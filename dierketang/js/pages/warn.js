/* ==========================================================================
   warn.js —— 预警管理（自动预警规则 / 预警名单 / 手动预警 / 预警通知）
   对应演示项【1.1 第三步】「自动预警规则设置及预警通知」：
   · 规则可视化配置：适用范围（学院 / 年级）、触发阈值、预警依据、办理时限、
     推送渠道（站内消息 / 移动端推送 / 短信 / 微信）、通知对象（本人 / 辅导员 /
     团总支书记 / 分管校领导）、扫描周期、自动发送开关。
   · 立即扫描：按规则真实遍历学生成绩数据，把低于阈值的学生写入预警名单，
     并同时生成一条「预警」类型的站内通知（已读/未读实时统计）。
   · 预警名单：按状态 / 级别 / 规则 / 学院筛选，支持一键通知、标记处理、
     导出名单；每条预警可查看学生成绩短板明细。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'list', status: '', level: '', ruleId: '', college: '', kw: '' };

  /* ===================== 取数 ===================== */
  function warnings() { return KP.scopeFilter(DB.col('warnings')); }
  function filtered() {
    var l = warnings();
    if (st.status) l = l.filter(function (x) { return x.status === st.status; });
    if (st.level) l = l.filter(function (x) { return x.level === st.level; });
    if (st.ruleId) l = l.filter(function (x) { return x.ruleId === st.ruleId; });
    if (st.college) l = l.filter(function (x) { return x.college === st.college; });
    if (st.kw) l = l.filter(function (x) { return U.hitAny([x.name, x.sno, x.className, x.ruleName], st.kw); });
    U.sortBy(l, function (x) { return x.at; }, true);
    return l;
  }
  function scheme() { return DB.scheme(); }

  /* ===================== 顶部 KPI ===================== */
  function kpis() {
    var l = warnings();
    var pending = l.filter(function (x) { return x.status === '待处理'; }).length;
    var done = l.filter(function (x) { return x.status === '已处理'; }).length;
    var severe = l.filter(function (x) { return x.level === '严重'; }).length;
    var enabledRules = DB.col('warnRules').filter(function (r) { return r.enabled; }).length;
    return KP.kpis([
      { label: '预警总数', num: l.length, unit: '条', ic: '🔔', fg: '#2563eb', bg: '#eff6ff' },
      { label: '待处理', num: pending, unit: '条', ic: '⏳', fg: '#d97706', bg: '#fff8eb' },
      { label: '已处理', num: done, unit: '条', ic: '✅', fg: '#059669', bg: '#ecfdf5', foot: '处理率 ' + U.pct(done, l.length) },
      { label: '严重预警', num: severe, unit: '条', ic: '⚠️', fg: '#dc2626', bg: '#fef2f2' },
      { label: '启用规则', num: enabledRules, unit: '条', ic: '⚙️', fg: '#7c3aed', bg: '#f5f3ff', foot: '共 ' + DB.col('warnRules').length + ' 条' }
    ], 'g5');
  }

  /* ===================== 扫描引擎（真实按规则跑数据） ===================== */
  function inScopeStudents(rule) {
    var sc = (rule || {}).scope || {};
    var colleges = sc.colleges || ['全部'];
    var grades = sc.grades || ['全部'];
    return KP.scopeFilter(DB.col('students')).filter(function (s) {
      if (colleges.indexOf('全部') < 0 && colleges.indexOf(s.college) < 0) return false;
      if (grades.indexOf('全部') < 0 && grades.indexOf(s.grade) < 0) return false;
      return true;
    });
  }
  /** 学生是否命中规则（学分线 或 类别短板） */
  function hitRule(stu, rule) {
    var agg = DB.aggOf(stu.id) || { total: 0, cat: {} };
    var th = U.num(rule.threshold);
    if (/(思想素养|文化素养|专业素养|创新创业|社会实践|社会工作)/.test(rule.basis || '')) {
      var cat = (rule.basis.match(/(思想素养|文化素养|专业素养|创新创业|社会实践|社会工作)/) || [])[0];
      var got = U.num(agg.cat[cat] || 0);
      if (got < th) return { total: U.num(agg.total), got: got, cat: cat, gap: Math.round((th - got) * 100) / 100 };
      return null;
    }
    if (U.num(agg.total) < th) return { total: U.num(agg.total), got: U.num(agg.total), cat: '', gap: Math.round((th - U.num(agg.total)) * 100) / 100 };
    return null;
  }
  function levelOf(gap, threshold) {
    var r = threshold ? gap / threshold : 0;
    if (r >= 0.5) return '严重';
    if (r >= 0.25) return '较重';
    return '一般';
  }
  /** 真实执行一次扫描：写入预警名单 + 生成站内通知 */
  function runScan(rule, silent) {
    var stuList = inScopeStudents(rule);
    var exist = {};
    warnings().forEach(function (x) { if (x.ruleId === rule.id) exist[x.studentId] = true; });
    var hitList = [];
    stuList.forEach(function (s) {
      if (exist[s.id]) return;
      var hit = hitRule(s, rule);
      if (hit) hitList.push({ stu: s, hit: hit });
    });
    if (!hitList.length) {
      if (!silent) UI.toast('扫描完成', '规则「' + rule.name + '」覆盖 ' + stuList.length + ' 名学生，未发现新的命中对象', 'ok');
      DB.update('warnRules', rule.id, { lastRun: U.dt(new Date()) });
      return 0;
    }
    var now = U.dt(new Date());
    hitList.forEach(function (x) {
      DB.insert('warnings', {
        id: U.uid('WN'), studentId: x.stu.id, sno: x.stu.sno, name: x.stu.name,
        college: x.stu.college, collegeId: x.stu.collegeId, major: x.stu.major,
        className: x.stu.className, grade: x.stu.grade, contact: x.stu.contact,
        schemeId: rule.schemeId, ruleId: rule.id, ruleName: rule.name,
        total: x.hit.total, threshold: U.num(rule.threshold), gap: x.hit.gap,
        deadline: rule.deadline, level: levelOf(x.hit.gap, U.num(rule.threshold)),
        channels: (rule.channels || []).slice(), targets: (rule.targets || []).slice(),
        at: now, read: false, readAt: '', handledBy: '', handledAt: '', note: '',
        status: '待处理', source: '自动预警', shortCat: x.hit.cat ? [x.hit.cat] : []
      });
    });
    /* 同步生成一条预警通知（真实可统计已读未读） */
    if (rule.autoSend !== false) {
      DB.insert('msgs', {
        id: U.uid('M'), title: '第二课堂学分预警通知',
        content: '按规则「' + rule.name + '」扫描，本学期共有 ' + hitList.length + ' 名学生第二课堂学分低于预警线 ' +
          U.num(rule.threshold).toFixed(1) + '，请相关辅导员与团总支书记及时跟进督促。',
        type: '预警', scope: ((rule.scope || {}).colleges || ['全校'])[0] === '全部' ? '全校' : '二级学院',
        channels: (rule.channels || []).slice(), at: now, sender: w.ZA.session.name,
        total: hitList.length, readCount: 0, unreadCount: hitList.length, readBy: [],
        bizType: '预警', bizId: '', remindWays: (rule.channels || []).slice(), targetDesc: (rule.targets || []).join('、')
      });
    }
    DB.update('warnRules', rule.id, { lastRun: now, sentCount: U.num(rule.sentCount) + hitList.length });
    if (!silent) UI.toast('预警扫描已完成', '命中 ' + hitList.length + ' 人，已写入预警名单并生成通知', 'ok');
    return hitList.length;
  }

  /* ===================== 规则编辑弹窗 ===================== */
  var CHANNELS = ['站内消息', '移动端推送', '短信', '微信'];
  var TARGETS = ['学生本人', '辅导员', '团总支书记', '分管校领导'];
  var TRIGGERS = ['每日 06:00 自动扫描', '每周一 08:00 扫描', '每月 1 日扫描', '手动触发'];
  var BASES = ['累计学分低于达标线', '思想素养类别学分不足', '文化素养类别学分不足', '专业素养类别学分不足',
    '创新创业类别学分不足', '社会实践类别学分不足', '社会工作类别学分不足'];

  function ruleEdit(rule) {
    var isNew = !rule;
    var r = rule || {
      name: '', schemeId: (scheme() || {}).id || 'SC001', enabled: true,
      scope: { colleges: ['全部'], grades: ['全部'] }, threshold: 4.5, basis: BASES[0],
      deadline: '2026-12-31', channels: ['站内消息', '移动端推送'], targets: ['学生本人', '辅导员'],
      trigger: TRIGGERS[0], autoSend: true
    };
    var f = {
      name: UI.input({ value: r.name, placeholder: '如：2027 级学分未达标自动预警' }),
      threshold: UI.input({ type: 'number', step: '0.5', value: U.num(r.threshold) }),
      basis: UI.select({ options: BASES.map(function (x) { return [x, x]; }), value: r.basis }),
      scheme: UI.select({ options: DB.col('schemes').map(function (x) { return [x.id, x.name]; }), value: r.schemeId }),
      deadline: UI.input({ type: 'date', value: r.deadline }),
      trigger: UI.select({ options: TRIGGERS.map(function (x) { return [x, x]; }), value: r.trigger }),
      autoSend: UI.select({ options: [['1', '开启（扫描后自动推送通知）'], ['0', '关闭（仅写入名单，需人工确认后推送）']], value: r.autoSend ? '1' : '0' })
    };
    var pickedColleges = ((r.scope || {}).colleges || ['全部']).slice();
    var pickedGrades = ((r.scope || {}).grades || ['全部']).slice();
    var pickedChannels = (r.channels || []).slice();
    var pickedTargets = (r.targets || []).slice();
    var colsCh = UI.chips({ multi: true, value: pickedColleges, options: ['全部'].concat(DB.col('colleges').map(function (c) { return c.name; })), onChange: function (v) { pickedColleges = v.slice(); } });
    var grCh = UI.chips({ multi: true, value: pickedGrades, options: ['全部'].concat(DB.data.meta.grades || []), onChange: function (v) { pickedGrades = v.slice(); } });
    var chCh = UI.chips({ multi: true, value: pickedChannels, options: CHANNELS, onChange: function (v) { pickedChannels = v.slice(); } });
    var tgCh = UI.chips({ multi: true, value: pickedTargets, options: TARGETS, onChange: function (v) { pickedTargets = v.slice(); } });

    var m = UI.formModal({
      title: isNew ? '新增预警规则' : '编辑预警规则', size: 'wide',
      intro: '预警规则决定「谁会被预警、什么时候预警、怎么通知」。保存后可在「预警规则」页点击「立即扫描」按本规则真实跑一遍数据。',
      fields: [
        { label: '规则名称', control: f.name, required: true, span: 2 },
        { label: '预警依据', control: f.basis, required: true },
        { label: '预警阈值（学分）', control: f.threshold, required: true },
        { label: '关联考核方案', control: f.scheme },
        { label: '办理时限', control: f.deadline },
        { label: '扫描周期', control: f.trigger },
        { label: '自动推送', control: f.autoSend, span: 2 },
        { label: '适用学院', control: colsCh, span: 2 },
        { label: '适用年级', control: grCh, span: 2 },
        { label: '推送渠道', control: chCh, span: 2 },
        { label: '通知对象', control: tgCh, span: 2 }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm', { onclick: function () {
          var nm = f.name.value.trim();
          if (!nm) { UI.toast('请填写规则名称', '', 'warn'); return; }
          var patch = {
            name: nm, schemeId: f.scheme.value, threshold: U.num(f.threshold.value), basis: f.basis.value,
            deadline: f.deadline.value, trigger: f.trigger.value, autoSend: f.autoSend.value === '1',
            scope: { colleges: pickedColleges.length ? pickedColleges : ['全部'], grades: pickedGrades.length ? pickedGrades : ['全部'] },
            channels: pickedChannels.length ? pickedChannels : ['站内消息'],
            targets: pickedTargets.length ? pickedTargets : ['学生本人']
          };
          if (isNew) {
            Object.assign(patch, { id: 'WR' + (DB.col('warnRules').length + 1), enabled: true, lastRun: '', sentCount: 0, createdAt: U.dt(new Date()), createdBy: w.ZA.session.name });
            DB.insert('warnRules', patch);
          } else DB.update('warnRules', rule.id, patch);
          m.close();
          UI.toast(isNew ? '预警规则已新增' : '预警规则已保存', '可点击「立即扫描」验证命中结果', 'ok');
          w.ZR.render();
        } }, '保存'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var nm = f.name.value.trim();
            if (!nm) { UI.toast('请填写规则名称', '', 'warn'); return; }
            var tmp = {
              id: isNew ? ('WR' + (DB.col('warnRules').length + 1)) : rule.id,
              name: nm, schemeId: f.scheme.value, threshold: U.num(f.threshold.value), basis: f.basis.value,
              deadline: f.deadline.value, scope: { colleges: pickedColleges.length ? pickedColleges : ['全部'], grades: pickedGrades.length ? pickedGrades : ['全部'] },
              channels: pickedChannels.length ? pickedChannels : ['站内消息'], targets: pickedTargets.length ? pickedTargets : ['学生本人'],
              autoSend: f.autoSend.value === '1'
            };
            var n = dryRun(tmp);
            m.close();
            var msg = UI.modal({
              title: '试算结果（未写入数据）', size: 'wide',
              body: [
                KP.kpis([
                  { label: '覆盖学生', num: n.total, unit: '人', ic: '👥', fg: '#2563eb', bg: '#eff6ff' },
                  { label: '命中预警', num: n.hit, unit: '人', ic: '🔔', fg: '#dc2626', bg: '#fef2f2' },
                  { label: '命中率', num: U.pctNum(n.hit, n.total), unit: '%', ic: '📊', fg: '#d97706', bg: '#fff8eb' },
                  { label: '严重', num: n.severe, unit: '人', ic: '⚠️', fg: '#b91c1c', bg: '#fef2f2' }
                ], 'g4'),
                D.h('div', { style: 'font-weight:700;font-size:13px;margin:14px 0 8px' }, '命中学生（前 12 名）'),
                UI.table({
                  mini: true, noCard: true,
                  cols: [
                    { t: '学生', render: function (x) { return KP.who(x.stu.name, x.stu.sno); } },
                    { t: '班级', render: function (x) { return KP.cell(x.stu.className, x.stu.college); } },
                    { t: '当前学分', w: 92, center: true, render: function (x) { return KP.numCell(x.hit.total, ''); } },
                    { t: '阈值', w: 76, center: true, render: function (x) { return KP.numCell(tmp.threshold, ''); } },
                    { t: '差距', w: 84, center: true, render: function (x) { return D.h('span', { style: 'color:#dc2626;font-weight:650' }, '-' + x.hit.gap.toFixed(2)); } },
                    { t: '级别', w: 76, center: true, render: function (x) { return KP.status(levelOf(x.hit.gap, tmp.threshold)); } }
                  ],
                  rows: n.list.slice(0, 12), empty: '无命中学生'
                })
              ],
              foot: [D.h('button.btn.btn-sm', { onclick: function () { msg.close(); } }, '关闭'),
              D.h('button.btn.btn-sm.btn-p', { onclick: function () { msg.close(); UI.toast('规则试算完成', '正式保存规则后扫描才会写入名单', 'ok'); } }, '知道了')]
            });
          }
        }, '试算命中人数')
      ]
    });
  }
  /** 干跑：不写数据，返回命中明细 */
  function dryRun(rule) {
    var list = [];
    var stuList = inScopeStudents(rule);
    stuList.forEach(function (s) {
      var hit = hitRule(s, rule);
      if (hit) list.push({ stu: s, hit: hit });
    });
    return {
      total: stuList.length, hit: list.length, list: list,
      severe: list.filter(function (x) { return levelOf(x.hit.gap, U.num(rule.threshold)) === '严重'; }).length
    };
  }

  /* ===================== 页签一：预警名单 ===================== */
  function tabList(host) {
    host.appendChild(kpis());
    host.appendChild(D.h('div', { style: 'height:12px' }));

    var cols = [
      { t: '学生', render: function (r) { return KP.who(r.name, r.sno); } },
      { t: '学院 / 班级', render: function (r) { return KP.cell(r.college, r.className); } },
      { t: '累计 / 达标线', w: 128, center: true, render: function (r) {
        return D.h('span', {}, KP.numCell(r.total, ''), D.h('span.muted', ' / ' + U.num(r.threshold).toFixed(1))); } },
      { t: '差距', w: 84, center: true, render: function (r) { return D.h('span', { style: 'color:#dc2626;font-weight:650' }, '-' + U.num(r.gap).toFixed(2)); } },
      { t: '预警依据', render: function (r) { return KP.cell(r.ruleName, r.shortCat && r.shortCat.length ? '短板类别：' + r.shortCat.join('、') : '累计学分不足'); } },
      { t: '级别', w: 76, center: true, render: function (r) { return KP.status(r.level); } },
      { t: '来源', w: 88, center: true, k: 'source' },
      { t: '预警时间', w: 148, k: 'at' },
      { t: '状态', w: 92, center: true, render: function (r) { return KP.status(r.status); } },
      { t: '办理人', w: 110, render: function (r) { return r.handledBy ? KP.cell(r.handledBy, r.handledAt) : D.h('span.muted', '未办理'); } },
      { t: '操作', w: 214, render: function (r) {
        return KP.acts([
          KP.btn('详情', function () { warnDetail(r); }),
          r.status === '待处理' ? KP.btn('通知', function () { notify(r); }) : null,
          r.status === '待处理' ? KP.btn('处理', function () { handle(r); }, 'btn-p') : KP.btn('已处理', function () { warnDetail(r); })
        ]);
      } }
    ];

    KP.lister({
      host: host, noCard: true,
      title: '预警名单', sub: '共 ' + warnings().length + ' 条 · 数据范围 ' + ZA.scopeText(),
      toolbar: function (s, refresh) {
        return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          UI.seg({
            options: [['', '全部' + warnings().length], ['待处理', '待处理 ' + warnings().filter(function (x) { return x.status === '待处理'; }).length], ['已处理', '已处理 ' + warnings().filter(function (x) { return x.status === '已处理'; }).length]],
            value: st.status, onChange: function (v) { st.status = v; refresh(); }
          }),
          D.h('span.muted', '预警督办流程：扫描命中 → 名单生成 → 通知推送 → 辅导员处理并回填记录 → 归档')
        );
      },
      filters: function (s, refresh) {
        return UI.filterBar([
          { type: 'input', ph: '姓名 / 学号 / 班级', value: st.kw, width: 190, onChange: function (v) { st.kw = v; refresh(); } },
          { type: 'select', options: [['', '全部级别'], ['严重', '严重'], ['较重', '较重'], ['一般', '一般']], value: st.level, onChange: function (v) { st.level = v; refresh(); } },
          { type: 'select', options: [['', '全部规则']].concat(DB.col('warnRules').map(function (r) { return [r.id, r.name]; })), value: st.ruleId, onChange: function (v) { st.ruleId = v; refresh(); } },
          { type: 'select', options: [['', '全部学院']].concat(DB.col('colleges').filter(function (c) { return KP.inScope(c); }).map(function (c) { return [c.name, c.name]; })), value: st.college, onChange: function (v) { st.college = v; refresh(); } }
        ], {
          right: [
            KP.exportBtn('导出名单', null, function () {
              var l = filtered();
              UI.exportCSV('第二课堂预警名单_' + U.d(new Date()), [
                { t: '学号', k: 'sno' }, { t: '姓名', k: 'name' }, { t: '学院', k: 'college' }, { t: '班级', k: 'className' },
                { t: '累计学分', k: 'total' }, { t: '预警线', k: 'threshold' }, { t: '差距', k: 'gap' },
                { t: '预警依据', k: 'ruleName' }, { t: '级别', k: 'level' }, { t: '状态', k: 'status' },
                { t: '预警时间', k: 'at' }, { t: '办理人', k: 'handledBy' }, { t: '办理说明', k: 'note' }
              ], l);
              return true;
            }),
            D.h('button.btn.btn-sm.btn-p', { onclick: function () { manualWarn(); } }, '＋ 手动预警')
          ]
        });
      },
      rows: function () { return filtered(); },
      cols: cols, pageSize: 15,
      rowClick: function (r) { warnDetail(r); },
      empty: '当前条件下没有预警记录', emptySub: '可在「预警规则」页执行扫描，或使用「手动预警」'
    });
  }

  function warnDetail(r) {
    var stu = DB.get('students', r.studentId) || { name: r.name, sno: r.sno };
    var agg = DB.aggOf(r.studentId) || { total: 0, cat: {}, hours: 0, points: 0, records: 0 };
    var sc = DB.get('schemes', r.schemeId) || scheme();
    var m = UI.modal({
      title: '预警详情 · ' + r.name, sub: r.sno + ' · ' + r.college + ' · ' + r.className, size: 'wide',
      body: [
        KP.kpis([
          { label: '累计学分', num: U.num(r.total), unit: '学分', ic: '📘', fg: '#2563eb', bg: '#eff6ff' },
          { label: '预警线', num: U.num(r.threshold), unit: '学分', ic: '🎯', fg: '#d97706', bg: '#fff8eb' },
          { label: '差距', num: U.num(r.gap), unit: '学分', ic: '📉', fg: '#dc2626', bg: '#fef2f2' },
          { label: '预警级别', num: r.level, ic: '⚠️', fg: '#b91c1c', bg: '#fef2f2' },
          { label: '办理时限', num: r.deadline, ic: '⏰', fg: '#7c3aed', bg: '#f5f3ff' }
        ], 'g5'),
        KP.h5('六大素养类别达成'),
        UI.table({
          mini: true, noCard: true,
          cols: [
            { t: '类别', render: function (x) { return KP.catTag(x.name); } },
            { t: '已获学分', w: 100, center: true, render: function (x) { return KP.numCell(x.got, ''); } },
            { t: '类别达标线', w: 110, center: true, render: function (x) { return KP.numCell(x.std, ''); } },
            { t: '状态', w: 100, center: true, render: function (x) { return KP.status(x.ok ? '已达标' : '未达标'); } }
          ],
          rows: (DB.data.cats || []).map(function (c) {
            var std = U.num(((sc || {}).catStandard || {})[c.name] || 0);
            var got = U.num(agg.cat[c.name] || 0);
            return { name: c.name, got: got, std: std, ok: std ? got >= std * 0.6 : true };
          })
        }),
        KP.h5('预警与办理记录'),
        UI.timeline([
          { time: r.at, text: '<b>' + U.esc(r.source) + '</b> · 命中规则「' + U.esc(r.ruleName) + '」，预警级别 <b>' + U.esc(r.level) + '</b>', tone: 'warn' },
          { time: r.at, text: '推送渠道：' + U.esc((r.channels || []).join('、')) + '；通知对象：' + U.esc((r.targets || []).join('、')) },
          r.handledAt ? { time: r.handledAt, text: '<b>' + U.esc(r.handledBy) + '</b> 已办理：' + U.esc(r.note || '（未填写说明）'), tone: 'ok' }
            : { time: '—', text: '尚未办理', tone: 'err' }
        ]),
        KP.h5('该生近期认定记录'),
        UI.table({
          mini: true, noCard: true,
          cols: [
            { t: '项目', render: function (x) { return KP.cell(x.actTitle || '—', x.source); } },
            { t: '类别', w: 92, render: function (x) { return KP.catTag(x.cat); } },
            { t: '学分', w: 62, center: true, render: function (x) { return KP.numCell(x.credit, ''); } },
            { t: '认定时间', w: 148, k: 'at' }
          ],
          rows: DB.recsOf(r.studentId).slice(0, 8), empty: '该生暂无认定记录'
        })
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); notify(r); } }, '再次通知'),
        r.status === '待处理' ? D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); handle(r); } }, '标记已处理') : null
      ]
    });
  }

  function notify(r) {
    UI.confirm({
      title: '发送预警通知', okText: '确认发送',
      text: '将按规则「' + r.ruleName + '」的推送渠道（' + (r.channels || []).join('、') + '）向' + (r.targets || []).join('、') + '发送预警提醒。',
      onOk: function () {
        DB.insert('msgs', {
          id: U.uid('M'), title: '学分预警提醒 · ' + r.name,
          content: r.name + '（' + r.sno + '，' + r.className + '）第二课堂累计学分 ' + U.num(r.total).toFixed(2) +
            '，低于预警线 ' + U.num(r.threshold).toFixed(1) + '，差距 ' + U.num(r.gap).toFixed(2) + ' 学分，请及时督促参与活动补足学分。',
          type: '预警', scope: '指定用户', channels: (r.channels || []).slice(), at: U.dt(new Date()),
          sender: w.ZA.session.name, total: (r.targets || []).length || 1, readCount: 0,
          unreadCount: (r.targets || []).length || 1, readBy: [], bizType: '预警', bizId: r.id,
          remindWays: (r.channels || []).slice(), targetDesc: (r.targets || []).join('、')
        });
        DB.update('warnings', r.id, { read: true, readAt: U.dt(new Date()) });
        UI.toast('预警通知已发送', '已按 ' + (r.channels || []).join('、') + ' 推送至 ' + (r.targets || []).join('、'), 'ok');
        if (w.ZAPP && w.ZAPP.refreshBadges) w.ZAPP.refreshBadges();
      }
    });
  }

  function handle(r) {
    var note = UI.textarea({ rows: 4, placeholder: '如：已电话联系学生，安排参与本周主题活动补足思想素养学分' });
    var m = UI.modal({
      title: '办理预警 · ' + r.name, sub: r.ruleName, size: 'slim',
      body: [
        UI.kv([['学生', r.name + '（' + r.sno + '）'], ['班级', r.className], ['累计学分', U.num(r.total).toFixed(2)],
        ['预警线', U.num(r.threshold).toFixed(1)], ['差距', U.num(r.gap).toFixed(2)]]),
        D.h('div', { style: 'margin-top:12px' }, UI.field({ label: '办理说明', required: true, control: note }))
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var v = String(note.value || '').trim();
            if (!v) { UI.toast('请填写办理说明', '办理记录会同步给学生与辅导员', 'warn'); return; }
            DB.update('warnings', r.id, { status: '已处理', handledBy: w.ZA.session.name, handledAt: U.dt(new Date()), note: v });
            m.close();
            UI.toast('预警已办理', '办理记录已归档，可在名单中查看', 'ok');
            w.ZR.render();
          }
        }, '提交办理')
      ]
    });
  }

  /* ===================== 手动预警 ===================== */
  function manualWarn() {
    var stuCh = UI.input({ placeholder: '输入姓名或学号搜索学生' });
    var listHost = D.h('div', { style: 'max-height:210px;overflow:auto;margin-top:8px' });
    var picked = null;
    var ruleId = (DB.col('warnRules')[0] || {}).id;
    var levelCh = UI.select({ options: [['严重', '严重'], ['较重', '较重'], ['一般', '一般']], value: '较重' });
    var note = UI.textarea({ rows: 3, placeholder: '预警事由（如：参加活动缺勤、学分长期停滞等）' });
    var targetsV = ['学生本人', '辅导员'];
    var chansV = ['站内消息', '移动端推送'];
    var targetsCh = UI.chips({ multi: true, value: targetsV, options: TARGETS, onChange: function (v) { targetsV = v.slice(); } });
    var chansCh = UI.chips({ multi: true, value: chansV, options: CHANNELS, onChange: function (v) { chansV = v.slice(); } });

    function paintList(kw) {
      D.fill(listHost, null);
      var l = KP.scopeFilter(DB.col('students'));
      if (kw) l = l.filter(function (s) { return U.hitAny([s.name, s.sno, s.className], kw); });
      l = l.slice(0, 14);
      l.forEach(function (s) {
        var agg = DB.aggOf(s.id) || { total: 0, cat: {} };
        var el = D.h('div.lst-i', {
          onclick: function () {
            picked = s;
            D.qa('.lst-i', listHost).forEach(function (x) { x.classList.remove('on'); });
            el.classList.add('on');
          }
        },
          UI.icoBox('👤', '#2563eb', '#eff6ff', 32),
          D.h('div.li-b', D.h('div.li-t', s.name + '（' + s.sno + '）'),
            D.h('div.li-d', s.college + ' · ' + s.className)),
          D.h('span', { style: 'font-weight:650' }, U.num(agg.total).toFixed(2) + ' 学分')
        );
        listHost.appendChild(el);
      });
    }
    paintList('');
    stuCh.addEventListener('input', U.debounce(function () { paintList(stuCh.value.trim()); }, 200));

    var m = UI.modal({
      title: '手动预警', size: 'wide',
      body: [
        KP.note('手动预警用于「规则未覆盖但需人工提醒」的场景（如长期未参与活动、多次缺席）。提交后将写入预警名单并生成通知。'),
        UI.field({ label: '选择学生', required: true, control: stuCh }),
        listHost,
        D.h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px' },
          UI.field({ label: '关联预警规则', control: UI.select({ options: DB.col('warnRules').map(function (r) { return [r.id, r.name]; }), value: ruleId, onChange: function (v) { ruleId = v; } }) }),
          UI.field({ label: '预警级别', control: levelCh })),
        D.h('div', { style: 'margin-top:10px' }, UI.field({ label: '推送渠道', control: chansCh })),
        D.h('div', { style: 'margin-top:10px' }, UI.field({ label: '通知对象', control: targetsCh })),
        D.h('div', { style: 'margin-top:10px' }, UI.field({ label: '预警事由', required: true, control: note }))
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            if (!picked) { UI.toast('请选择学生', '', 'warn'); return; }
            var v = String(note.value || '').trim();
            if (!v) { UI.toast('请填写预警事由', '', 'warn'); return; }
            var rule = DB.get('warnRules', ruleId) || {};
            var sc = scheme();
            var agg = DB.aggOf(picked.id) || { total: 0, cat: {} };
            var th = U.num(rule.threshold || (sc ? (sc.standard || {}).warnLine : 4.5));
            DB.insert('warnings', {
              id: U.uid('WN'), studentId: picked.id, sno: picked.sno, name: picked.name,
              college: picked.college, collegeId: picked.collegeId, major: picked.major,
              className: picked.className, grade: picked.grade, contact: picked.contact,
              schemeId: (sc || {}).id || '', ruleId: ruleId, ruleName: (rule.name || '手动预警') + '（手动）',
              total: U.num(agg.total), threshold: th, gap: Math.round(Math.max(0, th - U.num(agg.total)) * 100) / 100,
              deadline: rule.deadline || '', level: levelCh.value, channels: chansV.slice(),
              targets: targetsV.slice(), at: U.dt(new Date()), read: true, readAt: U.dt(new Date()),
              handledBy: '', handledAt: '', note: '', status: '待处理', source: '手动预警', shortCat: []
            });
            DB.insert('msgs', {
              id: U.uid('M'), title: '学分预警提醒 · ' + picked.name,
              content: v + '（当前累计学分 ' + U.num(agg.total).toFixed(2) + '，预警线 ' + th.toFixed(1) + '）',
              type: '预警', scope: '指定用户', channels: ['站内消息', '移动端推送'], at: U.dt(new Date()),
              sender: w.ZA.session.name, total: 2, readCount: 0, unreadCount: 2, readBy: [],
              bizType: '预警', bizId: '', remindWays: ['短信', '微信'], targetDesc: '学生本人、辅导员'
            });
            m.close();
            UI.toast('手动预警已发送', picked.name + ' 已进入预警名单', 'ok');
            w.ZR.render();
          }
        }, '发送预警')
      ]
    });
  }

  /* ===================== 页签二：预警规则 ===================== */
  function tabRule(host) {
    host.appendChild(D.h('div.card', D.h('div.card-b', { style: 'padding:13px 15px' },
      D.h('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap' },
        UI.icoBox('⚙️', '#7c3aed', '#f5f3ff', 36),
        D.h('div', { style: 'flex:1;min-width:220px' },
          D.h('div', { style: 'font-weight:700;font-size:14px' }, '自动预警规则'),
          D.h('div', { style: 'font-size:12px;color:var(--text3);margin-top:3px' },
            '规则支持按学院 / 年级圈定范围、按学分阈值或类别短板触发、多渠道推送与多角色通知。「立即扫描」会真实读取成绩数据生成预警名单。')),
        D.h('button.btn.btn-sm', {
          onclick: function () {
            var n = 0;
            DB.col('warnRules').filter(function (r) { return r.enabled; }).forEach(function (r) { n += runScan(r, true); });
            UI.toast('全部启用规则已扫描', n ? '共命中 ' + n + ' 人，已写入预警名单并推送通知' : '未发现新的命中对象', 'ok');
            w.ZR.render();
          }
        }, '⚡ 执行全部启用规则'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { ruleEdit(null); } }, '＋ 新增规则')
      )
    )));
    host.appendChild(D.h('div', { style: 'height:12px' }));

    host.appendChild(UI.table({
      cols: [
        { t: '规则名称', render: function (r) { return KP.cell(r.name, r.id + ' · 触发：' + r.trigger); } },
        { t: '适用范围', w: 200, render: function (r) {
          return KP.cell(((r.scope || {}).colleges || []).join('、'), ((r.scope || {}).grades || []).join('、'));
        } },
        { t: '预警依据', render: function (r) { return KP.cell(r.basis, '阈值 ' + U.num(r.threshold).toFixed(1) + ' 学分 · 限 ' + r.deadline + ' 前办结'); } },
        { t: '推送渠道', w: 170, render: function (r) {
          return D.h('div', { style: 'display:flex;gap:3px;flex-wrap:wrap' }, (r.channels || []).map(function (c) {
            return D.h('span.tag', { style: 'background:#eff6ff;color:#2563eb' }, c);
          }));
        } },
        { t: '通知对象', w: 190, render: function (r) { return D.h('span.muted', (r.targets || []).join('、')); } },
        { t: '自动推送', w: 88, center: true, render: function (r) { return KP.status(r.autoSend ? '启用' : '停用'); } },
        { t: '上次扫描', w: 148, render: function (r) { return KP.cell(r.lastRun || '—', '累计命中 ' + U.num(r.sentCount) + ' 人'); } },
        { t: '状态', w: 82, center: true, render: function (r) { return KP.status(r.enabled ? '启用' : '停用'); } },
        { t: '操作', w: 250, render: function (r) {
          return KP.acts([
            KP.btn('立即扫描', function () {
              var n = runScan(r);
              if (n) w.ZR.render();
            }, 'btn-p'),
            KP.btn('编辑', function () { ruleEdit(r); }),
            KP.btn(r.enabled ? '停用' : '启用', function () {
              DB.update('warnRules', r.id, { enabled: !r.enabled });
              UI.toast(r.enabled ? '规则已停用' : '规则已启用', r.name, 'ok');
              w.ZR.render();
            }),
            KP.btn('明细', function () {
              var l = DB.filter('warnings', function (x) { return x.ruleId === r.id; });
              var mm = UI.modal({
                title: '规则命中明细 · ' + r.name, size: 'wide',
                body: [UI.table({
                  mini: true, noCard: true,
                  cols: [
                    { t: '学生', render: function (x) { return KP.who(x.name, x.sno); } },
                    { t: '班级', render: function (x) { return KP.cell(x.className, x.college); } },
                    { t: '学分 / 阈值', w: 128, center: true, render: function (x) { return D.h('span', {}, KP.numCell(x.total, ''), D.h('span.muted', ' / ' + U.num(x.threshold).toFixed(1))); } },
                    { t: '级别', w: 76, center: true, render: function (x) { return KP.status(x.level); } },
                    { t: '状态', w: 88, center: true, render: function (x) { return KP.status(x.status); } },
                    { t: '预警时间', w: 148, k: 'at' }
                  ],
                  rows: l, empty: '该规则暂无命中记录'
                })]
              });
            })
          ]);
        } }
      ],
      rows: DB.col('warnRules'),
      empty: '暂无预警规则'
    }));
  }

  /* ===================== 页签三：预警通知 ===================== */
  function tabNotify(host) {
    var l = DB.filter('msgs', function (m) { return m.type === '预警'; });
    var total = l.reduce(function (s, m) { return s + U.num(m.total); }, 0);
    var read = l.reduce(function (s, m) { return s + U.num(m.readCount); }, 0);
    host.appendChild(KP.kpis([
      { label: '预警通知', num: l.length, unit: '条', ic: '📣', fg: '#2563eb', bg: '#eff6ff' },
      { label: '送达人次', num: total, unit: '人次', ic: '📨', fg: '#0891b2', bg: '#ecfeff' },
      { label: '已读人次', num: read, unit: '人次', ic: '👁', fg: '#059669', bg: '#ecfdf5', foot: '已读率 ' + U.pct(read, total) },
      { label: '未读人次', num: total - read, unit: '人次', ic: '🔕', fg: '#dc2626', bg: '#fef2f2', foot: '未读率 ' + U.pct(total - read, total) }
    ], 'g4'));
    host.appendChild(D.h('div', { style: 'height:12px' }));

    KP.lister({
      host: host, noCard: true,
      title: '预警通知记录', sub: '通知送达与已读情况 · 未读可再次提醒',
      rows: function (s) {
        var r = l.slice();
        if (s.kw) r = r.filter(function (m) { return U.hitAny([m.title, m.content, m.sender], s.kw); });
        U.sortBy(r, function (m) { return m.at; }, true);
        return r;
      },
      filters: function (s, refresh) {
        return UI.filterBar([{ type: 'input', ph: '搜索通知标题 / 内容', width: 240, onChange: function (v) { s.kw = v; refresh(); } }], {
          right: [KP.exportBtn('导出通知记录', null, function () {
            UI.exportCSV('预警通知记录_' + U.d(new Date()), [
              { t: '通知标题', k: 'title' }, { t: '通知内容', k: 'content' }, { t: '发送对象', k: 'targetDesc' },
              { t: '推送渠道', raw: function (m) { return (m.channels || []).join('、'); } },
              { t: '送达', k: 'total' }, { t: '已读', k: 'readCount' }, { t: '未读', k: 'unreadCount' },
              { t: '发送人', k: 'sender' }, { t: '发送时间', k: 'at' }
            ], l);
            return true;
          })]
        });
      },
      cols: [
        { t: '通知标题', render: function (m) { return KP.cell(m.title, m.content, { clip: true }); } },
        { t: '通知对象', w: 150, render: function (m) { return KP.cell(m.targetDesc || m.scope, (m.channels || []).join('、')); } },
        { t: '送达', w: 78, center: true, render: function (m) { return KP.numCell(m.total, '人次'); } },
        { t: '已读 / 未读', w: 140, center: true, render: function (m) {
          return D.h('span', {}, D.h('span', { style: 'color:#059669;font-weight:650' }, U.num(m.readCount)),
            D.h('span.muted', ' / '), D.h('span', { style: 'color:#dc2626;font-weight:650' }, U.num(m.unreadCount))); } },
        { t: '已读率', w: 150, render: function (m) { return KP.progCell(U.rate(m.readCount, m.total) * 100, U.pct(m.readCount, m.total)); } },
        { t: '发送人 / 时间', w: 186, render: function (m) { return KP.cell(m.sender, m.at); } },
        { t: '操作', w: 168, render: function (m) {
          return KP.acts([
            KP.btn('查看', function () {
              UI.modal({
                title: m.title, size: 'slim',
                body: [
                  D.h('p', { style: 'font-size:13.5px;line-height:1.9;margin-bottom:12px' }, m.content),
                  UI.kv([['通知类型', m.type], ['发送对象', m.targetDesc || m.scope], ['推送渠道', (m.channels || []).join('、')],
                  ['送达人次', U.num(m.total)], ['已读人次', U.num(m.readCount)], ['未读人次', U.num(m.unreadCount)], ['发送人', m.sender], ['发送时间', m.at]])
                ]
              });
            }),
            U.num(m.unreadCount) > 0 ? KP.btn('再次提醒', function () {
              DB.insert('msgs', {
                id: U.uid('M'), title: '【提醒】' + m.title, content: '该通知仍有 ' + m.unreadCount + ' 人未读，请及时查阅。原内容：' + m.content,
                type: '提醒', scope: m.scope, channels: (m.channels || []).slice(), at: U.dt(new Date()),
                sender: w.ZA.session.name, total: U.num(m.unreadCount), readCount: 0, unreadCount: U.num(m.unreadCount),
                readBy: [], bizType: '预警', bizId: m.id, remindWays: ['站内消息'], targetDesc: '未读用户'
              });
              UI.toast('已向未读用户再次提醒', '新增通知 1 条，待读 ' + U.num(m.unreadCount) + ' 人次', 'ok');
              w.ZR.render();
            }, 'btn-p') : null
          ]);
        } }
      ],
      pageSize: 12,
      empty: '暂无预警通知记录'
    });
  }

  /* ===================== 渲染入口 ===================== */
  function render(host) {
    host.appendChild(UI.pageHd({
      title: '预警管理',
      sub: '自动预警规则设置 · 预警名单督办 · 预警通知与已读统计',
      crumb: '成绩与评价 / 预警管理',
      right: [
        KP.exportBtn('导出预警名单', null, function () {
          UI.exportCSV('第二课堂预警名单_' + U.d(new Date()), [
            { t: '学号', k: 'sno' }, { t: '姓名', k: 'name' }, { t: '学院', k: 'college' }, { t: '班级', k: 'className' },
            { t: '累计学分', k: 'total' }, { t: '预警线', k: 'threshold' }, { t: '差距', k: 'gap' },
            { t: '规则', k: 'ruleName' }, { t: '级别', k: 'level' }, { t: '状态', k: 'status' }, { t: '预警时间', k: 'at' }
          ], warnings());
          return true;
        }),
        D.h('button.btn.btn-sm', { onclick: function () { tabRuleScanNow(); } }, '⚡ 立即扫描'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { manualWarn(); } }, '＋ 手动预警')
      ]
    }));

    host.appendChild(D.h('div', { style: 'margin-bottom:12px' }, UI.tabs({
      items: [
        { k: 'list', n: '预警名单', cnt: warnings().length },
        { k: 'rule', n: '预警规则', cnt: DB.col('warnRules').length },
        { k: 'notify', n: '预警通知', cnt: DB.filter('msgs', function (m) { return m.type === '预警'; }).length }
      ],
      cur: st.tab,
      onChange: function (v) { st.tab = v; w.ZR.render(); }
    })));

    var body = D.h('div');
    host.appendChild(body);
    if (st.tab === 'list') tabList(body);
    else if (st.tab === 'rule') tabRule(body);
    else tabNotify(body);
  }
  function tabRuleScanNow() {
    st.tab = 'rule';
    w.ZR.render();
    setTimeout(function () {
      var n = 0;
      DB.col('warnRules').filter(function (r) { return r.enabled; }).forEach(function (r) { n += runScan(r, true); });
      UI.toast('扫描完成', n ? '命中 ' + n + ' 人，已生成预警名单与通知' : '未发现新的命中对象', 'ok');
      w.ZR.render();
    }, 80);
  }

  KP.pages({
    warn: { title: '预警管理', group: '成绩与评价', render: render }
  });
})(window);
