/* ==========================================================================
   checks.js —— 纯逻辑自检（不依赖 DOM 渲染）
   重点验证「看起来对但可能是假的」的部分：
     · 二维码 Reed-Solomon 纠错码是否真的满足生成多项式整除（扫得出来的充要条件）
     · 二维码矩阵结构（定位图形 / 定时图形 / 格式信息可逆解码）
     · 种子数据的一致性与分布
   用法：node tools/checks.js
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createWindow } = require('./domstub.js');

const ROOT = path.join(__dirname, '..');
const w = createWindow();
const ctx = vm.createContext(w);
const load = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

['js/core/util.js', 'js/core/dom.js', 'js/core/qr.js'].forEach(load);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}
function sec(t) { console.log('\n' + t); }

/* ---------------- GF / RS 基础 ---------------- */
sec('一、GF(256) 与 Reed-Solomon 正确性');
const rs = w.ZQR._rs;
{
  /* 乘法交换/结合/分配 抽样 */
  let good = true;
  for (let a = 1; a < 256; a += 7) {
    for (let b = 1; b < 256; b += 11) {
      if (rs.gmul(a, b) !== rs.gmul(b, a)) good = false;
      const c = (a * b) % 255;
      if (rs.gmul(a, rs.gmul(b, 3)) !== rs.gmul(rs.gmul(a, b), 3)) good = false;
    }
  }
  ok('GF(256) 乘法交换律与结合律', good);

  /* 生成多项式：根为 α^0..α^(n-1) */
  let rootsOk = true;
  [10, 16, 18, 22, 24, 26].forEach(n => {
    const g = rs.genPoly(n);
    /* g 的系数按降幂排列，最高次为 1 */
    if (g[0] !== 1 || g.length !== n + 1) rootsOk = false;
    for (let i = 0; i < n; i++) {
      /* 求值 g(α^i) */
      let acc = 0;
      for (let k = 0; k < g.length; k++) {
        const deg = g.length - 1 - k;
        acc ^= rs.gmul(g[k], w.ZQR._rs.genPoly ? pow(EXP(), i * deg) : 0);
      }
      if (acc !== 0) rootsOk = false;
    }
  });
  function EXP() { /* 复用 gmul 的幂运算：用反复 gmul 求 α^e */ return null; }
  function pow(_, e) {
    /* α^e = EXP[e]；直接通过 gmul 累乘求得，避免依赖内部表 */
    let r = 1;
    for (let i = 0; i < e; i++) r = rs.gmul(r, 2);
    return r;
  }
  ok('RS 生成多项式的根为 α^0…α^(n-1)', rootsOk);

  /* 关键：对随机数据编码后，码字多项式在每个根处必须为 0（即能被整除） */
  let divOk = true, cases = 0, badCase = '';
  const enc = rs.buildCodewords;
  for (const txt of ['A', 'https://dekt.cqsf.edu.cn/sign?t=8F3A21', '第二课堂活动签到码-2026-09-22T10:30:00-ACT202609220001', 'x'.repeat(60), '签到 1234567890']) {
    const e = enc(txt);
    e.blocks.forEach((blk, bi) => {
      const full = blk.concat(e.ecBlocks[bi]);
      for (let i = 0; i < e.ecLen; i++) {
        const a = pow(null, i);
        let acc = 0;
        for (let k = 0; k < full.length; k++) {
          const deg = full.length - 1 - k;
          acc ^= rs.gmul(full[k], pow(null, i * deg));
        }
        cases++;
        if (acc !== 0) { divOk = false; badCase = txt.slice(0, 12) + ' 块' + bi + ' 根α^' + i; }
      }
    });
  }
  ok('data+ecc 码字多项式可被生成多项式整除（' + cases + ' 个根检验）', divOk, badCase);

  /* 纠错能力：故意篡改 1 个数据码字，应在 ecLen/2 个错以内可纠（此处只验证不可整除→说明有错） */
  const base = enc('SIGN-TOKEN-20260922-0001');
  let tamperDetected = false;
  {
    const full = base.blocks[0].concat(base.ecBlocks[0]).slice();
    const orig = full[0]; full[0] ^= 0x01;
    let acc = 0;
    for (let k = 0; k < full.length; k++) acc ^= rs.gmul(full[k], pow(null, 3 * (full.length - 1 - k)));
    tamperDetected = acc !== 0;
    full[0] = orig;
  }
  ok('篡改码字后校验值不再为 0（纠错校验有效）', tamperDetected);
}

/* ---------------- 矩阵结构 ---------------- */
sec('二、二维码矩阵结构');
{
  const m = w.ZQR.matrix('https://dekt.cqsf.edu.cn/sign?t=8F3A21&act=ACT202609220001');
  const { size: n, modules: M, version: ver, mask } = m;
  ok('尺寸与版本一致（n = 4v+17）', n === ver * 4 + 17, 'n=' + n + ' v=' + ver);
  ok('数据区模块全为 0/1', M.every(r => r.every(v => v === 0 || v === 1)));

  /* 定位图形：三个角必须是标准 7×7 图案 */
  function finderOK(r0, c0) {
    const pat = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (M[r0 + r][c0 + c] !== pat[r][c]) return false;
    return true;
  }
  ok('左上定位图形正确', finderOK(0, 0));
  ok('右上定位图形正确', finderOK(0, n - 7));
  ok('左下定位图形正确', finderOK(n - 7, 0));
  ok('定位图形分隔带为白色', M[7][0] === 0 && M[0][7] === 0 && M[7][7] === 0 && M[7][n - 8] === 0);

  /* 定时图形：第 6 行/列在 8..n-9 之间严格交替
     例外：标准允许校正图形覆盖定时图形（如版本 7 的 (6,22)），
     以及三个与定位图形重合的位置不放置校正图形，故先算出覆盖足迹再比对 */
  const alignC = w.ZQR._alignOf ? w.ZQR._alignOf(ver) : null;
  const covered = new Set();
  if (alignC) {
    alignC.forEach(cr => alignC.forEach(cc => {
      if ((cr === 6 && cc === 6) || (cr === 6 && cc === n - 7) || (cr === n - 7 && cc === 6)) return;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) covered.add((cr + dr) + ',' + (cc + dc));
    }));
  }
  let timingOK = true;
  for (let i = 8; i <= n - 9; i++) {
    if (!covered.has('6,' + i) && M[6][i] !== (i % 2 === 0 ? 1 : 0)) timingOK = false;
    if (!covered.has(i + ',6') && M[i][6] !== (i % 2 === 0 ? 1 : 0)) timingOK = false;
  }
  ok('定时图形交替正确（已排除校正图形覆盖区）', timingOK);
  if (alignC) {
    /* 校正图形本身必须是 5×5 标准图案 */
    let apOK = true;
    alignC.forEach(cr => alignC.forEach(cc => {
      if ((cr === 6 && cc === 6) || (cr === 6 && cc === n - 7) || (cr === n - 7 && cc === 6)) return;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const want = Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0;
        if (M[cr + dr][cc + dc] !== want) apOK = false;
      }
    }));
    ok('校正图形图案正确', apOK);
  }

  /* 固定暗模块 */
  ok('固定暗模块存在', M[n - 8][8] === 1);

  /* 格式信息可逆解码：从矩阵读回 15 位，CRC 校验并还原出等级与掩码 */
  function readFormat() {
    let bits = 0;
    for (let i = 0; i < 15; i++) {
      let bit;
      if (i < 6) bit = M[8][i];
      else if (i === 6) bit = M[8][7];
      else if (i === 7) bit = M[8][8];
      else if (i === 8) bit = M[7][8];
      else bit = M[14 - i][8];
      bits |= bit << i;
    }
    return bits;
  }
  const fRead = readFormat();
  const unmasked = fRead ^ 0x5412;
  const dataPart = (unmasked >> 10) & 0x1F;
  const ecBits = (dataPart >> 3) & 0x03;
  const maskBits = dataPart & 0x07;
  /* BCH(15,5) 校验：rem 应为 0 */
  let rem = unmasked;
  for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
  ok('格式信息 BCH 校验通过', rem === 0, 'rem=' + rem);
  ok('格式信息解码出的纠错等级为 M', ecBits === 0b00, 'ec=' + ecBits.toString(2));
  ok('格式信息解码出的掩码与使用的一致', maskBits === mask, maskBits + ' vs ' + mask);

  /* 版本信息（v≥7 才有） */
  const m7 = w.ZQR.matrix('x'.repeat(100));
  if (m7.version >= 7) {
    const n7 = m7.size;
    let info = 0;
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      info |= m7.modules[n7 - 11 + c][r] << i;
    }
    const EXPECT = { 7: 0x07C94, 8: 0x085BC, 9: 0x09A99, 10: 0x0A4D3 };
    ok('版本 ' + m7.version + ' 信息位正确', info === EXPECT[m7.version], info.toString(16) + ' vs ' + EXPECT[m7.version].toString(16));
  }

  /* 编码容量边界：不同长度文本应落到合理版本，且不越界 */
  const lens = [10, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213];
  const vers = lens.map(L => w.ZQR.matrix('a'.repeat(L)).version);
  ok('版本选择随长度单调不减', vers.every((v, i) => i === 0 || v >= vers[i - 1]), JSON.stringify(vers));
  ok('10 字节落在版本 1', w.ZQR.matrix('a'.repeat(10)).version === 1);
  ok('超容量文本仍可编码（回落到最大版本）', !!w.ZQR.matrix('z'.repeat(400)).modules);

  /* 同一文本两次编码结果一致（确定性） */
  const A = JSON.stringify(w.ZQR.matrix('determinism-check-2026').modules);
  const B = JSON.stringify(w.ZQR.matrix('determinism-check-2026').modules);
  ok('编码结果确定性（同输入同输出）', A === B);

  /* 不同文本 → 不同矩阵 */
  const C1 = JSON.stringify(w.ZQR.matrix('token-A').modules);
  const C2 = JSON.stringify(w.ZQR.matrix('token-B').modules);
  ok('不同内容生成不同二维码', C1 !== C2);
}

/* ---------------- 种子数据一致性 ---------------- */
sec('三、种子数据一致性');
['js/core/seed/base.js', 'js/core/seed/org.js', 'js/core/seed/academic.js', 'js/core/seed/activity.js',
  'js/core/seed/community.js', 'js/core/seed/ops.js', 'js/core/seed/index.js', 'js/core/db.js'].forEach(load);
{
  const DB = w.DB;
  DB.init(true);
  const d = DB.data;
  ok('学生学号唯一', new Set(d.students.map(s => s.sno)).size === d.students.length);
  const stuIds = new Set(d.students.map(s => s.id));
  const actIds = new Set(d.activities.map(a => a.id));
  ok('报名记录无孤儿（关联活动与学生均存在）',
    d.enrollments.every(e => actIds.has(e.actId) && stuIds.has(e.studentId)));
  ok('签到记录无孤儿', d.signins.every(s => stuIds.has(s.studentId)));
  ok('成绩记录无孤儿', d.scoreRecs.every(r => stuIds.has(r.studentId)));
  ok('预警记录无孤儿', d.warnings.every(x => stuIds.has(x.studentId)));
  ok('社团成员无孤儿', d.clubMembers.every(m => stuIds.has(m.studentId)));

  /* ---- 报名 / 签到一致性：报名上的签到状态必须与签到记录完全对应 ----
     这类矛盾不会让页面报错，只会让演示自相矛盾（例如「待审核」的报名却已签到），
     因此在这里做硬校验。 */
  const signKeys = new Set(d.signins.filter(g => g.at).map(g => g.actId + '|' + g.studentId));
  const eBadStatus = d.enrollments.filter(e => e.status !== '已通过' && e.signStatus !== '未签到');
  ok('未通过审核的报名不存在签到状态', eBadStatus.length === 0,
    '异常 ' + eBadStatus.length + ' 条，如 ' + (eBadStatus[0] ? eBadStatus[0].status + '/' + eBadStatus[0].signStatus : ''));
  const eBadSign = d.enrollments.filter(e => e.status === '已通过' && e.signStatus === '已签到' && !signKeys.has(e.actId + '|' + e.studentId));
  ok('标记已签到的报名均有对应签到记录', eBadSign.length === 0, '异常 ' + eBadSign.length + ' 条');
  const eBadNosign = d.enrollments.filter(e => e.status === '已通过' && e.signStatus !== '已签到' && signKeys.has(e.actId + '|' + e.studentId));
  ok('存在签到记录的报名均已标记为已签到', eBadNosign.length === 0, '异常 ' + eBadNosign.length + ' 条');
  /* 签到记录必须挂在「已通过 + 活动已开始」的报名上 */
  const eMap = {};
  d.enrollments.forEach(e => { eMap[e.actId + '|' + e.studentId] = e; });
  const actStatus = {}; d.activities.forEach(a => { actStatus[a.id] = a.status; });
  const gBad = d.signins.filter(g => {
    const e = eMap[g.actId + '|' + g.studentId];
    if (!e || e.status !== '已通过') return true;
    return actStatus[g.actId] === '待开始' || actStatus[g.actId] === '待审核' || actStatus[g.actId] === '草稿' || actStatus[g.actId] === '已驳回';
  });
  ok('签到记录仅存在于已通过且活动已开始的报名上', gBad.length === 0, '异常 ' + gBad.length + ' 条');

  /* ---- 学生端演示覆盖度：任何学生打开学生端都要有内容可看 ---- */
  const perStu = {};
  d.enrollments.forEach(e => { perStu[e.studentId] = (perStu[e.studentId] || 0) + 1; });
  const noEnroll = d.students.filter(s => !perStu[s.id]);
  ok('每名学生均有报名记录（学生端「我报名的」不为空）', noEnroll.length === 0,
    '零报名 ' + noEnroll.length + ' 人，如 ' + (noEnroll[0] ? noEnroll[0].name : ''));

  /* ---- 演示主视角学生必须具备完整履历（否则演示会空转） ---- */
  const demoStu = (function () {
    const all = d.students.filter(s => !s.status || s.status === '在籍');
    const list = all.length ? all : d.students;
    for (const s of list) {
      const es = d.enrollments.filter(e => e.studentId === s.id);
      const signed = es.filter(e => e.signStatus === '已签到').length;
      const signable = es.filter(e => {
        if (e.status !== '已通过' || e.signStatus === '已签到') return false;
        const a = d.activities.filter(x => x.id === e.actId)[0];
        return a && (a.status === '待开始' || a.status === '进行中');
      }).length;
      if (es.length && signed && signable) return { s, es, signed, signable };
    }
    return null;
  })();
  ok('演示主视角学生具备完整履历（报名 + 已签到 + 待签到）', !!demoStu,
    demoStu ? demoStu.s.name + '：报名 ' + demoStu.es.length + ' 条 / 已签到 ' + demoStu.signed + ' / 待签到 ' + demoStu.signable
      : '没有同时满足三项条件的学生，学生端签到演示会空转');

  const agg = DB.agg();
  ok('每名学生均有成绩明细', agg.every(x => x.records > 0), '无明细人数 ' + agg.filter(x => !x.records).length);
  const sc = DB.scheme();
  const need = sc.standard.pass;
  const passRate = agg.filter(x => x.total >= need).length / agg.length * 100;
  ok('学分达标率处于真实区间(50%~75%)', passRate >= 50 && passRate <= 75, passRate.toFixed(1) + '%');
  ok('学分存在合理上限（无异常高分）', Math.max(...agg.map(x => x.total)) <= 12, '最高 ' + Math.max(...agg.map(x => x.total)));
  const cats = d.cats.map(c => c.name);
  ok('六大类别均有用例覆盖', cats.every(c => agg.some(x => x.cat[c] > 0)));
  ok('考核方案六大类达标线之和等于总达标线',
    cats.reduce((s, c) => s + (sc.catStandard[c] || 0), 0) === sc.standard.pass,
    cats.reduce((s, c) => s + (sc.catStandard[c] || 0), 0) + ' vs ' + sc.standard.pass);
  const ACT_ST = ['待审核', '已发布', '已驳回', '草稿', '待开始', '进行中', '已结束'];
  ok('活动状态取值在预期集合内',
    d.activities.every(a => ACT_ST.indexOf(a.status) >= 0),
    [...new Set(d.activities.map(a => a.status))].join('/'));
  ok('活动状态覆盖 待审核/待开始/进行中/已结束 四态（支撑全流程演示）',
    ['待审核', '待开始', '进行中', '已结束'].every(s => d.activities.some(a => a.status === s)),
    [...new Set(d.activities.map(a => a.status))].join('/'));
  ok('待审核活动存在（供演示审批）', d.activities.some(a => a.status === '待审核'));
  ok('待审核报名存在（供演示报名审核）', d.enrollments.some(e => e.status === '待审核'));
  ok('待审核申报存在（供演示分值审核）', d.scoreApps.some(x => x.status === '待初审' || x.status === '待终审'));
  ok('待审内容存在（供演示内容安全）', d.contents.some(c => c.status === '待审'));
  ok('待处理预警存在（供演示预警处理）', d.warnings.some(x => x.status === '待处理'));
  ok('待审核作品存在（供演示作品审核）', d.works.some(x => x.status === '待审核'));
  ok('待审核入社申请存在', d.clubApps.some(x => x.status === '待审核'));
  ok('角色数 6 且含学生与管理员', d.roles.length === 6 && !!d.roles.find(r => r.key === 'admin') && !!d.roles.find(r => r.key === 'student'));
  ok('每名教职工均有账号与口令字段', d.staff.every(s => s.account && s.pw));
  ok('每名学生均有账号与口令字段', d.students.every(s => s.account && s.pw));
  ok('联系方式一律为掩码格式（无真实手机号）',
    d.students.every(s => /\*{4}/.test(String(s.contact))), '异常 ' + d.students.filter(s => !/\*{4}/.test(String(s.contact))).length + ' 条');
  ok('成绩单模板不少于 5 套', d.tpls.length >= 5);
  ok('活动规则含报名/黑名单/通知三类', ['报名规则', '黑名单规则', '通知条件'].every(t => d.actRules.some(r => r.type === t)));
  ok('预警规则含自动发送与多渠道', d.warnRules.some(r => r.autoSend && r.channels.length >= 2));
  ok('AI 助手含问答规则、文档与会话', d.ai.rules.length > 5 && d.ai.docs.length > 3 && d.ai.sessions.length > 3);
  ok('内容安全统计有敏感词命中', d.contents.some(c => c.hits && c.hits.length));
  ok('党务表单组件库不少于 25 种', d.party.components.length >= 25, '实际 ' + d.party.components.length);
  ok('审批流程含条件分支与并行分支',
    d.flowApps.some(f => f.nodes.some(n => n.type === 'cond')) && d.flowApps.some(f => f.nodes.some(n => n.type === 'parallel')));
  ok('审批节点含限时处理规则', d.flowApps.some(f => f.nodes.some(n => n.limit && n.limit.mode !== '无')));
  ok('门户模块含 18 种以上类型', d.portal.modules.length >= 18, '实际 ' + d.portal.modules.length);
  ok('大屏组件含多模板配置', d.screenCfg.modules.length >= 8);
  ok('安全实施含等保/备份/培训/运维', !!(d.safety.protections && d.safety.backups && d.safety.trainings && d.safety.ops));
  ok('日志含操作留痕', d.logs.length > 20);
  const kb = Math.round(JSON.stringify(d).length / 1024);
  console.log('  · 种子数据体积 ' + kb + ' KB（走增量补丁持久化，不整包落盘）');
}

/* ---------------- 页面层静态引用检查 ---------------- */
/* 场景：页面调用 KP.xxx / UI.xxx 等命名空间成员，但拼错或用了未实现的方法。
   这类错误只有在真实点开该分支时才暴露，属于最隐蔽的一类缺陷，
   因此在纯逻辑自检里做一次全量静态比对。 */
sec('四、页面层命名空间引用完整性');
{
  const NS = ['ZU', 'ZD', 'ZUI', 'ZC', 'DB', 'ZA', 'ZKP', 'ZSIGN', 'ZQR', 'ZR', 'ZAPP'];
  const probe = createWindow();
  const pctx = vm.createContext(probe);
  const load2 = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), pctx, { filename: f });
  [
    'js/core/util.js', 'js/core/dom.js', 'js/core/qr.js',
    'js/core/seed/base.js', 'js/core/seed/org.js', 'js/core/seed/academic.js',
    'js/core/seed/activity.js', 'js/core/seed/community.js', 'js/core/seed/ops.js',
    'js/core/seed/index.js', 'js/core/db.js', 'js/core/charts.js', 'js/core/ui.js',
    'js/core/auth.js', 'js/core/router.js'
  ].forEach(load2);
  probe.DB.init(true);
  const pageDir = path.join(ROOT, 'js/pages');
  const pageFiles = fs.readdirSync(pageDir).filter(f => f.endsWith('.js')).sort();
  pageFiles.forEach(f => { try { load2('js/pages/' + f); } catch (e) { /* 页面自身的错误由 render 检查负责 */ } });
  try { load2('js/app.js'); } catch (e) { }

  const members = {};
  NS.forEach(n => { members[n] = probe[n] && typeof probe[n] === 'object' ? new Set(Object.keys(probe[n])) : null; });

  const bad = [];
  pageFiles.forEach(f => {
    const src = fs.readFileSync(path.join(pageDir, f), 'utf8');
    /* 忽略注释行，避免把说明文字里的示例当真实调用 */
    const lines = src.split('\n').map(l => l.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, ''));
    lines.forEach((line, i) => {
      NS.forEach(n => {
        if (!members[n]) return;
        const re = new RegExp(n.replace('Z', 'Z') + '\\.([A-Za-z_$][\\w$]*)', 'g');
        let m;
        while ((m = re.exec(line))) {
          if (!members[n].has(m[1])) bad.push(f + ':' + (i + 1) + ' ' + n + '.' + m[1] + ' 未定义');
        }
      });
    });
  });
  ok('页面层未引用未定义的命名空间成员', bad.length === 0, bad.slice(0, 8).join(' | '));
  console.log('  · 已比对 ' + pageFiles.length + ' 个页面文件 × ' + NS.filter(n => members[n]).length + ' 个命名空间');

  /* 路由连通性：页面里 go('xxx') 的目标必须已在路由表注册 */
  const routes = new Set(probe.ZR && probe.ZR.order ? probe.ZR.order : []);
  const deadLinks = [];
  pageFiles.forEach(f => {
    const src = fs.readFileSync(path.join(pageDir, f), 'utf8');
    let m;
    const re = /ZR\.go\(\s*'([a-zA-Z0-9_-]+)'/g;
    while ((m = re.exec(src))) if (!routes.has(m[1])) deadLinks.push(f + ' → ' + m[1]);
  });
  ok('页面内的路由跳转目标均已注册', deadLinks.length === 0,
    deadLinks.length ? '未注册: ' + [...new Set(deadLinks)].join(' | ') : '');
  ok('路由总数不少于 20 条', routes.size >= 20, '实际 ' + routes.size + ' 条：' + [...routes].join(','));
}

/* --------------------------------------------------------------------------
   五、核心层 API 误用的静态排查
   这三类误用都不会抛异常，只会静默产生错误结果或清空配置，最难靠人工发现：
     ① U.pct() 返回字符串（如 "86.0%"），被当数值用时 U.num() 会得到 0；
     ② U.pct() 结果再拼 '%' 会产出 "86.0%%" 这种双百分号；
     ③ DB.col / DB.touch / DB.insert 作用于「单例对象型」集合
        （portal / screenCfg / ai / party / safety / meta）会破坏配置结构。
   -------------------------------------------------------------------------- */
sec('五、核心层 API 误用排查');
{
  const OBJ_COLS = ['portal', 'screenCfg', 'ai', 'party', 'safety', 'meta'];
  const pageDir = path.join(ROOT, 'js/pages');
  const pageFiles = fs.readdirSync(pageDir).filter(f => f.endsWith('.js')).sort();
  const numMisuse = [], pctDup = [], objMisuse = [];

  pageFiles.forEach(f => {
    const lines = fs.readFileSync(path.join(pageDir, f), 'utf8').split('\n');
    lines.forEach((raw, i) => {
      const line = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
      const at = f + ':' + (i + 1);
      /* ① 把 U.pct(...) 放进数值型位置 */
      if (/num:\s*U\.pct\(|U\.pg\(\s*U\.pct\(|progCell\(\s*U\.pct\(|width:\s*U\.pct\(/.test(line)) {
        numMisuse.push(at + ' ' + line.trim().slice(0, 70));
      }
      /* ② U.pct(...) 后面又拼 % */
      if (/U\.pct\([^()]*\)\s*\+\s*['"]\s*%/.test(line)) {
        pctDup.push(at + ' ' + line.trim().slice(0, 70));
      }
      /* ③ 对单例对象型集合做数组写入 */
      OBJ_COLS.forEach(c => {
        if (new RegExp('DB\\.(col|touch|insert|remove|update|replace)\\(\\s*[\'"]' + c + '[\'"]').test(line)) {
          objMisuse.push(at + ' DB.*(' + c + ')');
        }
      });
    });
  });

  ok('U.pct 未用于数值上下文（数值请用 U.pctNum）', numMisuse.length === 0, numMisuse.slice(0, 5).join(' | '));
  ok('U.pct 结果未重复拼接百分号', pctDup.length === 0, pctDup.slice(0, 5).join(' | '));
  ok('未对单例对象型集合做数组写入', objMisuse.length === 0, objMisuse.slice(0, 5).join(' | '));
  console.log('  · 已排查 ' + pageFiles.length + ' 个页面文件；单例对象型集合：' + OBJ_COLS.join(' / '));
}

console.log('\n通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
