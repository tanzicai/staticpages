/* ==========================================================================
   apply.js —— 分值申报（学生申报 → 学院初审 → 校团委终审 → 自动赋分）
   这是演示参数里「分值申报闭环」的实现：
   ① 学生提交申报（竞赛获奖 / 荣誉奖励 / 线下活动三类），生成 4 节点流转记录
   ② 学院初审通过 / 驳回（驳回需填原因，学生可修改后重新提交）
   ③ 校团委终审通过
   ④ 终审通过后系统<b>自动写入成绩记录</b>（scoreRecs，source=分值申报），
      学分 / 学时 / 积分同时计入该生成绩单，并生成消息通知
   ⑤ 赋分记录可筛选、可导出，与「我的成绩单」的数据完全一致
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'all', kw: '', cat: '', status: '', college: '', page: 1, ps: 10, sel: {} };

  var KINDS = ['竞赛获奖', '荣誉奖励', '线下活动'];
  var NODES = [
    { node: '提交申请', role: '学生' },
    { node: '学院初审', role: '二级学院管理员' },
    { node: '校团委终审', role: '分值审核员' },
    { node: '自动赋分', role: '系统' }
  ];
  var STEP_OF = { '待初审': 1, '待终审': 2, '已通过': 3, '已驳回': 1 };

  function me() { return ZA.isStudent() ? ZA.viewStudent() : null; }

  function all() { return KP.scopeFilter(DB.col('scoreApps')); }
  function myList() { var s = me(); return s ? DB.filter('scoreApps', function (x) { return x.studentId === s.id; }) : []; }
  function todoList() {
    return all().filter(function (x) { return x.status === '待初审' || x.status === '待终审'; });
  }
  function recList() {
    /* 成绩记录本身不带学院字段，按学生所属学院做数据范围过滤 */
    var sc = ZA.scope();
    return DB.filter('scoreRecs', function (r) {
      if (r.source !== '分值申报') return false;
      if (!sc || !sc.collegeId) return true;
      var s = DB.get('students', r.studentId);
      return s && (s.collegeId === sc.collegeId || s.college === sc.college);
    });
  }
  function filt(l) {
    if (st.kw) l = l.filter(function (x) { return U.hitAny([x.name, x.sno, x.title, x.kind, x.evidence, x.college], st.kw); });
    if (st.cat) l = l.filter(function (x) { return x.cat === st.cat; });
    if (st.status) l = l.filter(function (x) { return x.status === st.status; });
    if (st.college) l = l.filter(function (x) { return x.collegeId === st.college || x.college === st.college; });
    return U.sortBy(l, function (x) { return x.at; }, true);
  }

  /* ---------------- 自动赋分（闭环的关键一步，真实写入成绩记录） ---------------- */
  function autoCredit(app) {
    var dup = DB.find('scoreRecs', function (r) { return r.appId === app.id; });
    if (dup) return dup;
    var rec = DB.insert('scoreRecs', {
      appId: app.id,
      studentId: app.studentId,
      actId: '', actTitle: app.title + '（分值申报）', cat: app.cat,
      credit: U.num(app.credit), hours: U.num(app.hours), points: U.num(app.points),
      level: '校级', source: '分值申报', status: '已认定',
      at: U.dt(new Date()), term: DB.data.meta.term || '2026-2027-1'
    });
    DB.insert('msgs', {
      title: '分值申报已通过并完成赋分',
      content: '你申报的「' + app.title + '」已通过校团委终审，系统已自动认定 ' + app.credit + ' 学分 / ' +
        app.hours + ' 学时 / ' + app.points + ' 积分，可在「我的成绩单」中查看。',
      type: '成绩', scope: app.college, channels: ['站内消息', '移动端推送'],
      at: U.dt(new Date()), sender: '第二课堂管理中心', total: 1, readCount: 0, unreadCount: 1,
      readBy: [], bizType: '分值申报', bizId: app.id, needCall: false, remindWays: [], targetDesc: app.name
    });
    return rec;
  }

  /* ---------------- 审核流转 ---------------- */
  function doReview(app, pass, note) {
    var step = U.int(app.step, 1);
    var flow = (app.flow || []).map(function (f) { return Object.assign({}, f); });
    var idx = step;                       /* flow[step] 即当前处理节点 */
    if (flow[idx]) {
      flow[idx].status = pass ? 'done' : 'rej';
      flow[idx].actor = ZA.session.name;
      flow[idx].role = ZA.ROLE_LABEL[ZA.role()];
      flow[idx].at = U.dt(new Date());
      flow[idx].note = note || (pass ? '审核通过' : '审核驳回');
    }
    var last = step >= 2;
    if (pass && last) {
      if (flow[3]) { flow[3].status = 'done'; flow[3].actor = '系统'; flow[3].at = U.dt(new Date()); flow[3].note = '已写入成绩记录：+' + app.credit + ' 学分 / +' + app.hours + ' 学时 / +' + app.points + ' 积分'; }
      DB.update('scoreApps', app.id, { status: '已通过', step: 3, flow: flow, note: note || '' });
      var rec = autoCredit(Object.assign({}, app, { status: '已通过' }));
      DB.insert('logs', {
        at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
        action: '分值申报终审通过并自动赋分', module: '成绩管理', target: app.id, ip: '10.16.1.101',
        result: '成功', detail: app.name + ' · ' + app.title + ' · +' + app.credit + ' 学分'
      });
      return { published: true, rec: rec };
    }
    if (pass) {
      if (flow[2]) flow[2].status = 'cur';
      DB.update('scoreApps', app.id, { status: '待终审', step: 2, flow: flow, note: note || '' });
      DB.insert('logs', {
        at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
        action: '分值申报学院初审通过', module: '成绩管理', target: app.id, ip: '10.16.1.101',
        result: '成功', detail: app.name + ' · ' + app.title
      });
      return { published: false };
    }
    /* 驳回：回到第 1 步，流转记录保留驳回痕迹 */
    if (flow[0]) { flow[0].status = 'done'; }
    DB.update('scoreApps', app.id, { status: '已驳回', step: 1, flow: flow, note: note || '' });
    DB.insert('msgs', {
      title: '分值申报未通过', content: '你申报的「' + app.title + '」未通过审核。原因：' + (note || '材料不符合认定要求') + '。可补充材料后重新提交。',
      type: '成绩', scope: app.college, channels: ['站内消息', '移动端推送'], at: U.dt(new Date()),
      sender: ZA.session.name, total: 1, readCount: 0, unreadCount: 1, readBy: [],
      bizType: '分值申报', bizId: app.id, needCall: false, remindWays: [], targetDesc: app.name
    });
    DB.insert('logs', {
      at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
      action: '分值申报驳回', module: '成绩管理', target: app.id, ip: '10.16.1.101',
      result: '成功', detail: app.name + ' · ' + app.title + ' · ' + (note || '')
    });
    return { published: false };
  }

  /* ---------------- 申报表单 ---------------- */
  function submitModal(onDone) {
    var s = me();
    if (!s) { UI.toast('请以学生身份登录后申报', '', 'warn'); return; }
    var sc = DB.scheme();
    var d = {
      kind: KINDS[0], cat: '专业素养', title: '', credit: 1, hours: 16, points: 10,
      evidence: '', files: [], level: '校级'
    };
    var host = D.h('div');
    var titleCtrl = UI.input({ placeholder: '例如：重庆市职业院校技能大赛二等奖', onInput: function (e) { d.title = e.target.value; } });
    var evCtrl = UI.input({ placeholder: '例如：主办单位证明.docx', onInput: function (e) { d.evidence = e.target.value; } });
    var fileHost = D.h('div');
    var creditCtrl, hourCtrl, pointCtrl;

    function paintFiles() {
      D.fill(fileHost, null);
      if (!d.files.length) { fileHost.appendChild(D.h('div.hint', '尚未添加附件')); }
      d.files.forEach(function (f, i) {
        fileHost.appendChild(D.h('div', {
          style: 'display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px'
        },
          D.h('span', '📎 ' + f),
          D.h('button.btn.btn-sm', {
            style: 'margin-left:auto', onclick: function () { d.files.splice(i, 1); paintFiles(); }
          }, '移除')
        ));
      });
    }

    function paint() {
      D.fill(host, null);
      D.appendChildDeep(host, [
        D.h('div.req-note', '申报类型：<b>' + d.kind + '</b>。系统按《第二课堂成绩单实施办法》给出参考分值，可在合理区间内调整；终审通过后系统自动写入成绩记录。'),
        D.h('div.frm.c2.mt12', {},
          UI.field({ label: '申报类型', required: true, control: UI.chips({ value: d.kind, options: KINDS, onChange: function (v) { d.kind = v; paint(); } }), span: 2 }),
          UI.field({
            label: '所属分类', required: true,
            control: UI.select({
              options: DB.col('cats').map(function (c) { return [c.name, c.name + '（参考 ' + U.num((sc ? sc.catStandard[c.name] : 0) || 0) + ' 学分）']; }),
              value: d.cat, onChange: function (v) { d.cat = v; paint(); }
            })
          }),
          UI.field({ label: '申报级别', required: true, control: UI.select({ options: [['校级', '校级'], ['院级', '院级']], value: d.level, onChange: function (v) { d.level = v; } }) }),
          UI.field({ label: '申报标题', required: true, control: titleCtrl, span: 2, hint: '请填写可核验的完整名称，将作为成绩记录中的活动名称' }),
          UI.field({ label: '认定学分', required: true, control: creditCtrl, hint: '0—3 之间，步长 0.5' }),
          UI.field({ label: '认定学时', required: true, control: hourCtrl, hint: '1 学分 = 16 学时（按考核方案换算）' }),
          UI.field({ label: '认定积分', required: true, control: pointCtrl, hint: '1 学分 = 10 积分（按考核方案换算）' }),
          UI.field({ label: '证明材料', required: true, control: evCtrl, hint: '写明证明材料名称，便于审核人核验' }),
          UI.field({ label: '附件', control: D.h('div', {},
            fileHost,
            D.h('button.btn.btn-sm', {
              onclick: function () {
                var names = ['获奖证书.pdf', '荣誉证书.jpg', '主办单位证明.docx', '现场照片.jpg', '成绩公示截图.png'];
                var pick = names[d.files.length % names.length];
                if (d.files.indexOf(pick) >= 0) { UI.toast('该附件已添加', pick, 'warn'); return; }
                d.files.push(pick); paintFiles();
              }
            }, '＋ 添加附件（演示）')
          ), span: 2 })
        )
      ]);
      paintFiles();
    }

    function syncCredit() {
      var c = U.num(d.credit);
      d.hours = Math.round(c * (sc ? U.num(sc.convert.hoursPerCredit, 16) : 16));
      d.points = Math.round(c * (sc ? U.num(sc.convert.pointsPerCredit, 10) : 10));
      hourCtrl.value = d.hours; pointCtrl.value = d.points;
    }
    creditCtrl = UI.input({
      type: 'number', value: d.credit, min: 0, max: 3, step: 0.5,
      onChange: function (e) { d.credit = U.num(e.target.value); syncCredit(); }
    });
    hourCtrl = UI.input({ type: 'number', value: d.hours, readonly: true });
    pointCtrl = UI.input({ type: 'number', value: d.points, readonly: true });
    paint();

    var m = UI.modal({
      title: '分值申报', sub: s.name + ' · ' + s.sno + ' · ' + s.college + ' ' + s.className, size: 'wide',
      body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm', { onclick: function () { UI.toast('草稿已保存', '可在「我的申报」中继续编辑并提交', 'ok'); m.close(); } }, '存为草稿'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            if (!String(d.title).trim()) { UI.toast('请填写申报标题', '', 'warn'); return; }
            if (!String(d.evidence).trim()) { UI.toast('请填写证明材料', '', 'warn'); return; }
            if (U.num(d.credit) <= 0) { UI.toast('认定学分必须大于 0', '', 'warn'); return; }
            var flow = NODES.map(function (n, i) {
              return {
                node: n.node, actor: i === 0 ? s.name : (i === 3 ? '系统' : ''), role: i === 0 ? '学生' : n.role,
                status: i === 0 ? 'done' : (i === 1 ? 'cur' : 'wait'),
                at: i === 0 ? U.dt(new Date()) : '',
                note: i === 0 ? '提交材料 ' + (d.files.length + 1) + ' 份' : ''
              };
            });
            var rec = DB.insert('scoreApps', {
              studentId: s.id, sno: s.sno, name: s.name, collegeId: s.collegeId, college: s.college,
              major: s.major, className: s.className, grade: s.grade,
              type: '积分/学分/学时', kind: d.kind, cat: d.cat, title: d.title,
              credit: U.num(d.credit), hours: U.num(d.hours), points: U.num(d.points),
              evidence: d.evidence, files: d.files.slice(), at: U.dt(new Date()),
              status: '待初审', step: 1, flow: flow, note: ''
            });
            DB.insert('logs', {
              at: U.dt(new Date()), actor: s.name, role: '学生', action: '提交分值申报',
              module: '成绩管理', target: rec.id, ip: '10.16.1.' + (100 + U.int(s.sno.slice(-2), 10)),
              result: '成功', detail: d.title + ' · ' + d.cat
            });
            UI.toast('申报已提交', '进入学院初审，可在「我的申报」查看进度', 'ok');
            m.close();
            if (onDone) onDone(rec);
          }
        }, '提交申报')
      ]
    });
  }

  function editModal(app, onDone) {
    var d = {
      title: app.title, kind: app.kind, cat: app.cat,
      credit: app.credit, hours: app.hours, points: app.points,
      evidence: app.evidence, files: (app.files || []).slice()
    };
    var host = D.h('div');
    var titleCtrl = UI.input({ value: d.title, onInput: function (e) { d.title = e.target.value; } });
    var evCtrl = UI.input({ value: d.evidence, onInput: function (e) { d.evidence = e.target.value; } });
    var creditCtrl = UI.input({ type: 'number', value: d.credit, min: 0, max: 3, step: 0.5, onChange: function (e) { d.credit = U.num(e.target.value); } });
    D.appendChildDeep(host, [
      D.h('div.req-note', '修改后重新提交将回到「学院初审」环节。原驳回原因保留在流转记录中。'),
      D.h('div.frm.c2.mt12', {},
        UI.field({ label: '申报标题', required: true, control: titleCtrl, span: 2 }),
        UI.field({ label: '所属分类', required: true, control: UI.select({ options: DB.col('cats').map(function (c) { return [c.name, c.name]; }), value: d.cat, onChange: function (v) { d.cat = v; } }) }),
        UI.field({ label: '申报类型', control: UI.select({ options: KINDS.map(function (k) { return [k, k]; }), value: d.kind, onChange: function (v) { d.kind = v; } }) }),
        UI.field({ label: '认定学分', required: true, control: creditCtrl }),
        UI.field({ label: '证明材料', required: true, control: evCtrl })
      )
    ]);
    var m = UI.modal({
      title: '修改并重新提交 · ' + app.title, size: 'wide', body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var sc = DB.scheme();
            var flow = NODES.map(function (n, i) {
              return {
                node: n.node, actor: i === 0 ? app.name : '', role: i === 0 ? '学生' : n.role,
                status: i === 0 ? 'done' : (i === 1 ? 'cur' : 'wait'),
                at: i === 0 ? U.dt(new Date()) : '', note: i === 0 ? '重新提交' : i === 3 ? '' : ''
              };
            });
            DB.update('scoreApps', app.id, {
              title: d.title, kind: d.kind, cat: d.cat, credit: U.num(d.credit),
              hours: Math.round(U.num(d.credit) * (sc ? U.num(sc.convert.hoursPerCredit, 16) : 16)),
              points: Math.round(U.num(d.credit) * (sc ? U.num(sc.convert.pointsPerCredit, 10) : 10)),
              evidence: d.evidence, files: d.files, at: U.dt(new Date()),
              status: '待初审', step: 1, flow: flow
            });
            UI.toast('已重新提交', '回到学院初审环节', 'ok');
            m.close(); if (onDone) onDone();
          }
        }, '重新提交')
      ]
    });
  }

  /* ---------------- 审核弹窗 ---------------- */
  function reviewModal(app) {
    var mode = 'pass', note = '';
    var ta = UI.textarea({ rows: 3, placeholder: mode === 'pass' ? '审核意见（选填）' : '驳回原因（必填）', onInput: function (e) { note = e.target.value; } });
    var host = D.h('div');
    function paint() {
      D.fill(host, null);
      D.appendChildDeep(host, [
        D.h('div.g4', {},
          UI.stat({ ic: '🎓', label: '申报分值', num: app.credit, unit: '学分', fg: '#7c3aed', bg: '#f5f3ff', foot: app.hours + ' 学时 / ' + app.points + ' 积分' }),
          UI.stat({ ic: '🏷', label: '申报类型', num: app.kind, fg: '#2563eb', bg: '#eff6ff', foot: app.cat }),
          UI.stat({ ic: '📎', label: '附件数', num: (app.files || []).length, unit: '份', fg: '#0891b2', bg: '#ecfeff', foot: app.evidence }),
          UI.stat({ ic: '⏱', label: '当前环节', num: U.int(app.step, 1) === 1 ? '学院初审' : '校团委终审', fg: '#d97706', bg: '#fffbeb', foot: '提交于 ' + app.at })
        ),
        D.h('div.mt12', UI.card({
          title: '申报信息', tight: true,
          body: KP.kv([
            ['申报编号', app.id], ['申报人', app.name + '（' + app.sno + '）'],
            ['学院 / 班级', app.college + ' · ' + app.className], ['年级', app.grade],
            ['申报标题', app.title], ['申报类型', app.kind], ['所属分类', app.cat],
            ['认定学分', app.credit + ' 学分'], ['认定学时', app.hours + ' 学时'], ['认定积分', app.points + ' 积分'],
            ['证明材料', app.evidence], ['附件', (app.files || []).join('、') || '无'], ['提交时间', app.at]
          ])
        })),
        D.h('div.mt12', UI.card({
          title: '申报流转记录', sub: '4 节点：提交申请 → 学院初审 → 校团委终审 → 自动赋分', tight: true,
          body: UI.timeline((app.flow || []).map(function (f) {
            return {
              time: f.at || (f.status === 'cur' ? '待处理' : '—'),
              text: '<b>' + f.node + '</b> · ' + (f.actor || f.role || '—') + (f.note ? '：' + f.note : ''),
              desc: f.status === 'done' ? '已完成' : (f.status === 'cur' ? '当前处理中' : (f.status === 'rej' ? '已驳回' : '未开始')),
              tone: f.status === 'done' ? 'ok' : (f.status === 'rej' ? 'err' : '')
            };
          }))
        })),
        D.h('div.mt12', UI.card({
          title: '审核操作', tight: true,
          body: [
            UI.seg({ value: mode, options: [['pass', '✓ 审核通过'], ['reject', '✕ 审核驳回']], onChange: function (v) { mode = v; paint(); } }),
            D.h('div.mt12', UI.field({ label: mode === 'pass' ? '审核意见（选填）' : '驳回原因（必填）', required: mode === 'reject', control: ta })),
            mode === 'pass' && U.int(app.step, 1) >= 2
              ? D.h('div.req-note', { style: 'margin-top:10px' }, '这是<b>最后一级审核</b>。通过后系统将自动写入成绩记录：<b>+' + app.credit + ' 学分 / +' + app.hours + ' 学时 / +' + app.points + ' 积分</b>，并推送给学生。')
              : null
          ]
        }))
      ]);
    }
    paint();
    var m = UI.modal({
      title: '分值申报审核 · ' + app.name, sub: app.title, size: 'xwide', body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm' + (mode === 'pass' ? '.btn-p' : '.btn-dan'), {
          onclick: function () {
            if (mode === 'reject' && !String(note).trim()) { UI.toast('请填写驳回原因', '', 'warn'); return; }
            var r = doReview(app, mode === 'pass', note);
            if (r.published) UI.toast('终审通过，已自动赋分', '+' + app.credit + ' 学分已计入 ' + app.name + ' 的成绩单', 'ok');
            else if (mode === 'pass') UI.toast('初审已通过', '已进入校团委终审', 'ok');
            else UI.toast('已驳回', '驳回原因已推送给学生', 'warn');
            m.close(); w.ZR.render();
          }
        }, mode === 'pass' ? '✓ 通过' : '✕ 驳回')
      ]
    });
  }

  /* ---------------- 表格列（三处共用） ---------------- */
  function cols(opts) {
    opts = opts || {};
    var c = [
      { t: '申报人', w: 152, render: function (x) { return KP.who(x.name, x.sno, { size: 28 }); } },
      { t: '申报内容', render: function (x) { return KP.cell(x.title, x.id + ' · ' + x.kind, { clip: true, title: x.title }); } },
      { t: '学院 / 班级', render: function (x) { return KP.cell(x.college, x.className, { clip: true }); } }
    ];
    if (opts.cat) c.push({ t: '分类', w: 100, render: function (x) { return KP.catTag(x.cat); } });
    c.push({ t: '认定分值', w: 132, render: function (x) { return D.h('div', { style: 'font-size:12px' }, D.h('div', { style: 'font-weight:650' }, x.credit + ' 学分'), D.h('div', { style: 'color:var(--text3);font-size:11px' }, x.hours + ' 学时 · ' + x.points + ' 积分')); } });
    c.push({ t: '提交时间', k: 'at', w: 138 });
    c.push({ t: '当前环节', w: 118, render: function (x) {
      if (x.status === '已通过') return KP.status('已通过');
      if (x.status === '已驳回') return KP.status('已驳回');
      return UI.tag((app_NODE(x) || {}).node || '—', 'tag-warn');
    } });
    c.push({ t: '状态', w: 96, render: function (x) { return KP.status(x.status); } });
    return c;
  }
  function app_NODE(x) { return (x.flow || [])[U.int(x.step, 1)]; }

  function actsCol(rerender) {
    return {
      t: '操作', w: 156, render: function (x) {
        var btns = [];
        if (x.status === '待初审' || x.status === '待终审') {
          btns.push(D.h('button.btn.btn-sm.btn-p', { onclick: function () { reviewModal(x); } }, '审核'));
        }
        btns.push(D.h('button.btn.btn-sm', { onclick: function () { detailModal(x, rerender); } }, '详情'));
        if (x.status === '已驳回') {
          btns.push(D.h('button.btn.btn-sm', { onclick: function () { editModal(x, rerender); } }, '修改重提'));
        }
        if (x.status === '待初审') {
          btns.push(D.h('button.btn.btn-sm', {
            onclick: function () {
              UI.confirm({
                title: '撤回申报', danger: true, text: '确认撤回「' + x.title + '」的申报吗？撤回后需重新提交。',
                onOk: function () {
                  DB.remove('scoreApps', x.id);
                  UI.toast('已撤回申报', x.title, 'ok');
                  if (rerender) rerender();
                }
              });
            }
          }, '撤回'));
        }
        return KP.acts(btns);
      }
    };
  }

  function detailModal(x, rerender) {
    var rec = DB.find('scoreRecs', function (r) { return r.appId === x.id; });
    UI.modal({
      title: '申报详情 · ' + x.name, sub: x.title, size: 'xwide',
      body: D.h('div', {},
        KP.kv([
          ['申报编号', x.id], ['申报类型', x.type + ' · ' + x.kind], ['所属分类', x.cat],
          ['申报标题', x.title], ['认定学分', x.credit + ' 学分'], ['认定学时', x.hours + ' 学时'],
          ['认定积分', x.points + ' 积分'], ['证明材料', x.evidence], ['附件', (x.files || []).join('、') || '无'],
          ['提交时间', x.at], ['当前状态', x.status], ['审核备注', x.note || '—']
        ]),
        D.h('div.mt12', UI.card({
          title: '申报流转记录', tight: true,
          body: UI.timeline((x.flow || []).map(function (f) {
            return {
              time: f.at || (f.status === 'cur' ? '待处理' : '—'),
              text: '<b>' + f.node + '</b> · ' + (f.actor || f.role || '—') + (f.note ? '：' + f.note : ''),
              desc: f.status === 'done' ? '已完成' : (f.status === 'cur' ? '当前处理中' : (f.status === 'rej' ? '已驳回' : '未开始')),
              tone: f.status === 'done' ? 'ok' : (f.status === 'rej' ? 'err' : '')
            };
          }))
        })),
        D.h('div.mt12', UI.card({
          title: '自动赋分结果', sub: '终审通过后系统写入的成绩记录', tight: true,
          body: rec ? KP.kv([
            ['成绩记录编号', rec.id], ['认定来源', rec.source], ['认定状态', rec.status],
            ['活动名称', rec.actTitle], ['活动分类', rec.cat], ['认定学分', rec.credit + ' 学分'],
            ['认定学时', rec.hours + ' 学时'], ['认定积分', rec.points + ' 积分'],
            ['认定时间', rec.at], ['所属学期', rec.term || '—']
          ]) : D.h('div.req-note', '尚未赋分。终审通过后系统会自动在此生成成绩记录，并同步到该生的成绩单。')
        })),
        rec ? D.h('div.mt12', D.h('div.btn-row', {},
          D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('myscore'); } }, '去「我的成绩单」查看'),
          D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('grade'); } }, '去「成绩管理」查看汇总')
        )) : null
      ),
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZUI.closeAllModals(); } }, '关闭')]
    });
  }

  /* ---------------- 三个作业面 ---------------- */
  function filterControls() {
    return UI.filterBar([
      { type: 'input', ph: '搜索姓名 / 学号 / 申报标题…', value: st.kw, width: 240, onChange: function (e) { st.kw = e.target.value; w.ZR.render(); } },
      { type: 'select', label: '分类', value: st.cat, options: [['', '全部分类']].concat(DB.col('cats').map(function (c) { return [c.name, c.name]; })), onChange: function (v) { st.cat = v; w.ZR.render(); } },
      { type: 'select', label: '状态', value: st.status, options: [['', '全部状态'], ['待初审', '待初审'], ['待终审', '待终审'], ['已通过', '已通过'], ['已驳回', '已驳回']], onChange: function (v) { st.status = v; w.ZR.render(); } },
      { type: 'select', label: '学院', value: st.college, options: [['', '全部学院']].concat(DB.col('colleges').map(function (c) { return [c.id, c.name]; })), onChange: function (v) { st.college = v; w.ZR.render(); } }
    ]);
  }

  function exportCols() {
    return [
      { t: '申报编号', k: 'id' }, { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' },
      { t: '学院', k: 'college' }, { t: '专业', k: 'major' }, { t: '班级', k: 'className' }, { t: '年级', k: 'grade' },
      { t: '申报类型', k: 'kind' }, { t: '分类', k: 'cat' }, { t: '申报标题', k: 'title' },
      { t: '认定学分', k: 'credit' }, { t: '认定学时', k: 'hours' }, { t: '认定积分', k: 'points' },
      { t: '证明材料', k: 'evidence' }, { t: '附件', raw: function (x) { return (x.files || []).join('、'); } },
      { t: '提交时间', k: 'at' }, { t: '状态', k: 'status' }, { t: '审核备注', raw: function (x) { return x.note || ''; } }
    ];
  }

  function tabAll(host) {
    host.appendChild(KP.lister({
      host: D.h('div'),
      title: '全部申报记录', sub: '共 ' + filt(all()).length + ' 条',
      filters: filterControls,
      toolbar: function () {
        return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          D.h('span', { style: 'font-weight:650;font-size:12.5px' }, '申报操作：'),
          D.h('button.btn.btn-sm.btn-p', { onclick: function () { submitModal(function () { w.ZR.render(); }); } }, '＋ 我要申报'),
          D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('grade'); } }, '成绩管理'),
          D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('tpl'); } }, '成绩单模板'),
          D.h('div', { style: 'margin-left:auto' }, KP.exportBtn('分值申报明细', exportCols(), filt(all())))
        );
      },
      cols: cols({ cat: true }).concat([actsCol(function () { w.ZR.render(); })]),
      rows: function () { return filt(all()); },
      pageSize: st.ps,
      empty: '暂无申报记录', emptySub: '点击「我要申报」提交竞赛获奖、荣誉奖励或线下活动分值'
    }));
  }

  function tabMine(host) {
    var l = filt(myList());
    var s = me();
    if (!s) { host.appendChild(UI.empty('当前非学生身份', '切换到学生角色可查看「我的申报」')); return; }
    host.appendChild(D.h('div.g4', {},
      UI.stat({ ic: '📝', label: '我的申报', num: myList().length, unit: '条', fg: '#2563eb', bg: '#eff6ff' }),
      UI.stat({ ic: '⏳', label: '审核中', num: myList().filter(function (x) { return x.status === '待初审' || x.status === '待终审'; }).length, unit: '条', fg: '#d97706', bg: '#fffbeb' }),
      UI.stat({ ic: '✅', label: '已通过', num: myList().filter(function (x) { return x.status === '已通过'; }).length, unit: '条', fg: '#059669', bg: '#ecfdf5' }),
      UI.stat({ ic: '🎓', label: '累计认定学分', num: Math.round(DB.filter('scoreRecs', function (r) { return r.studentId === s.id && r.source === '分值申报'; }).reduce(function (a, r) { return a + U.num(r.credit); }, 0) * 100) / 100, unit: '分', fg: '#7c3aed', bg: '#f5f3ff' })
    ));
    host.appendChild(D.h('div.mt16', KP.lister({
      host: D.h('div'),
      title: '我的申报', sub: '共 ' + l.length + ' 条 · ' + s.name + ' · ' + s.sno,
      filters: filterControls,
      actions: function () {
        return [
          D.h('button.btn.btn-sm.btn-p', { onclick: function () { submitModal(function () { w.ZR.render(); }); } }, '＋ 我要申报'),
          KP.exportBtn('我的申报', exportCols(), l)
        ];
      },
      cols: cols({ cat: true }).concat([actsCol(function () { w.ZR.render(); })]),
      rows: function () { return l; },
      pageSize: st.ps,
      empty: '你还没有提交过分值申报', emptySub: '竞赛获奖、荣誉奖励、线下活动都可以申报学分'
    })));
  }

  function tabTodo(host) {
    var l = filt(todoList());
    var c1 = l.filter(function (x) { return x.status === '待初审'; }).length;
    var c2 = l.filter(function (x) { return x.status === '待终审'; }).length;
    host.appendChild(D.h('div.g4', {},
      UI.stat({ ic: '1️⃣', label: '待学院初审', num: c1, unit: '条', fg: '#2563eb', bg: '#eff6ff', foot: '二级学院管理员处理' }),
      UI.stat({ ic: '2️⃣', label: '待校团委终审', num: c2, unit: '条', fg: '#d97706', bg: '#fffbeb', foot: '终审通过即自动赋分' }),
      UI.stat({ ic: '🎓', label: '待审涉及学分', num: Math.round(l.reduce(function (a, x) { return a + U.num(x.credit); }, 0) * 100) / 100, unit: '分', fg: '#7c3aed', bg: '#f5f3ff' }),
      UI.stat({ ic: '📎', label: '待核验附件', num: l.reduce(function (a, x) { return a + (x.files || []).length; }, 0), unit: '份', fg: '#0891b2', bg: '#ecfeff' })
    ));
    host.appendChild(D.h('div.mt16', KP.lister({
      host: D.h('div'),
      title: '待我审核的申报', sub: '共 ' + l.length + ' 条',
      filters: filterControls,
      toolbar: function () {
        return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          D.h('span', { style: 'font-weight:650;font-size:12.5px' }, '批量审核：'),
          D.h('button.btn.btn-sm.btn-p', {
            onclick: function () {
              var ids = Object.keys(st.sel).filter(function (k) { return st.sel[k]; });
              if (!ids.length) { UI.toast('请先勾选申报记录', '', 'warn'); return; }
              UI.confirm({
                title: '批量审核通过', okText: '确认通过',
                text: '将按各自所处环节通过选中的 ' + ids.length + ' 条申报。',
                detail: '处于终审环节的申报通过后，系统会立即自动赋分并写入成绩记录。',
                onOk: function () {
                  var n = 0, pub = 0;
                  ids.forEach(function (id) {
                    var x = DB.get('scoreApps', id);
                    if (!x || (x.status !== '待初审' && x.status !== '待终审')) return;
                    var r = doReview(x, true, '批量审核通过');
                    if (r.published) pub++;
                    n++;
                  });
                  st.sel = {};
                  UI.toast('批量审核完成', '共通过 ' + n + ' 条，其中 ' + pub + ' 条已完成自动赋分', 'ok');
                  w.ZR.render();
                }
              });
            }
          }, '✓ 批量通过'),
          D.h('span.muted', '已勾选 ' + Object.keys(st.sel).filter(function (k) { return st.sel[k]; }).length + ' 条'),
          D.h('div', { style: 'margin-left:auto' }, KP.exportBtn('待审申报', exportCols(), l))
        );
      },
      cols: cols({ cat: true }).concat([actsCol(function () { w.ZR.render(); })]),
      rows: function () { return l; },
      selectable: true, onSelect: function (r, on) { st.sel[r.id] = on; },
      pageSize: st.ps,
      empty: '当前没有待审核的申报', emptySub: '学生提交申报后会出现在这里'
    })));
  }

  function tabRecs(host) {
    var l = filt(recList());
    host.appendChild(D.h('div.g4', {},
      UI.stat({ ic: '📒', label: '赋分记录', num: recList().length, unit: '条', fg: '#2563eb', bg: '#eff6ff', foot: '来源为「分值申报」' }),
      UI.stat({ ic: '🎓', label: '累计学分', num: Math.round(recList().reduce(function (a, r) { return a + U.num(r.credit); }, 0) * 100) / 100, unit: '分', fg: '#7c3aed', bg: '#f5f3ff' }),
      UI.stat({ ic: '⏱', label: '累计学时', num: recList().reduce(function (a, r) { return a + U.num(r.hours); }, 0), unit: '学时', fg: '#0891b2', bg: '#ecfeff' }),
      UI.stat({ ic: '⭐', label: '累计积分', num: recList().reduce(function (a, r) { return a + U.num(r.points); }, 0), unit: '积分', fg: '#d97706', bg: '#fffbeb' })
    ));
    host.appendChild(D.h('div.mt16', KP.lister({
      host: D.h('div'),
      title: '自动赋分记录', sub: '终审通过后系统写入的成绩记录，与「我的成绩单」同源',
      filters: filterControls,
      actions: function () {
        return KP.exportBtn('赋分记录', [
          { t: '记录编号', k: 'id' }, { t: '姓名', raw: function (r) { var s = DB.get('students', r.studentId); return s ? s.name : ''; } },
          { t: '学号', raw: function (r) { var s = DB.get('students', r.studentId); return s ? s.sno : ''; } },
          { t: '学院', raw: function (r) { var s = DB.get('students', r.studentId); return s ? s.college : ''; } },
          { t: '认定来源', k: 'source' }, { t: '活动名称', k: 'actTitle' }, { t: '分类', k: 'cat' },
          { t: '学分', k: 'credit' }, { t: '学时', k: 'hours' }, { t: '积分', k: 'points' },
          { t: '认定状态', k: 'status' }, { t: '认定时间', k: 'at' }, { t: '学期', raw: function (r) { return r.term || ''; } }
        ], l);
      },
      cols: [
        { t: '学生', render: function (r) { var s = DB.get('students', r.studentId); return KP.who(s ? s.name : '—', s ? s.sno : '', { size: 28 }); } },
        { t: '学院 / 班级', render: function (r) { var s = DB.get('students', r.studentId); return KP.cell(s ? s.college : '—', s ? s.className : '', { clip: true }); } },
        { t: '认定内容', render: function (r) { return KP.cell(r.actTitle, r.id + ' · ' + r.source, { clip: true, title: r.actTitle }); } },
        { t: '分类', w: 100, render: function (r) { return KP.catTag(r.cat); } },
        { t: '认定分值', w: 132, render: function (r) { return D.h('div', { style: 'font-size:12px' }, D.h('div', { style: 'font-weight:650' }, r.credit + ' 学分'), D.h('div', { style: 'color:var(--text3);font-size:11px' }, r.hours + ' 学时 · ' + r.points + ' 积分')); } },
        { t: '认定状态', w: 96, render: function (r) { return KP.status(r.status); } },
        { t: '认定时间', k: 'at', w: 138 },
        { t: '学期', k: 'term', w: 118 }
      ],
      rows: function () {
        var d = l;
        if (st.kw) d = d.filter(function (r) { var s = DB.get('students', r.studentId); return U.hitAny([s ? s.name : '', s ? s.sno : '', r.actTitle], st.kw); });
        if (st.cat) d = d.filter(function (r) { return r.cat === st.cat; });
        if (st.college) d = d.filter(function (r) { var s = DB.get('students', r.studentId); return s && (s.collegeId === st.college || s.college === st.college); });
        return d;
      },
      pageSize: st.ps, mini: true,
      empty: '暂无赋分记录', emptySub: '分值申报终审通过后自动生成'
    })));
  }

  /* ---------------- 渲染 ---------------- */
  function render(host) {
    var TABS = [
      { k: 'all', n: '全部申报', cnt: all().length },
      { k: 'mine', n: '我的申报', cnt: myList().length },
      { k: 'todo', n: '待我审核', cnt: todoList().length },
      { k: 'recs', n: '自动赋分记录', cnt: recList().length }
    ];
    if (TABS.every(function (t) { return t.k !== st.tab; })) st.tab = 'all';

    host.appendChild(UI.pageHd({
      crumb: '<b>成绩与评价</b> / 分值申报',
      title: '分值申报',
      desc: '学生申报 → 学院初审 → 校团委终审 → 系统自动赋分 · 数据范围：' + ZA.scopeText(),
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('grade'); } }, '成绩管理'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('tpl'); } }, '成绩单模板'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { submitModal(function () { w.ZR.render(); }); } }, '＋ 我要申报')
      ]
    }));

    host.appendChild(D.h('div.mt16', KP.kpis([
      { ic: '📝', label: '申报总量', num: all().length, unit: '条', fg: '#2563eb', bg: '#eff6ff', foot: '近 30 天 ' + all().filter(function (x) { return String(x.at).slice(0, 7) === DB.data.meta.now.slice(0, 7); }).length + ' 条' },
      { ic: '⏳', label: '待审核', num: todoList().length, unit: '条', fg: '#d97706', bg: '#fffbeb', foot: '待初审 ' + all().filter(function (x) { return x.status === '待初审'; }).length + ' / 待终审 ' + all().filter(function (x) { return x.status === '待终审'; }).length },
      { ic: '✅', label: '已通过', num: all().filter(function (x) { return x.status === '已通过'; }).length, unit: '条', fg: '#059669', bg: '#ecfdf5', foot: '通过率 ' + (all().length ? (all().filter(function (x) { return x.status === '已通过'; }).length / all().length * 100).toFixed(1) : '0.0') + '%' },
      { ic: '✕', label: '已驳回', num: all().filter(function (x) { return x.status === '已驳回'; }).length, unit: '条', fg: '#dc2626', bg: '#fef2f2', foot: '可修改后重新提交' },
      { ic: '🎓', label: '累计认定学分', num: Math.round(recList().reduce(function (a, r) { return a + U.num(r.credit); }, 0) * 10) / 10, unit: '分', fg: '#7c3aed', bg: '#f5f3ff', foot: '均来自自动赋分' }
    ], 'g5')));

    var tabHost = D.h('div.mt16');
    var bodyHost = D.h('div.mt12');
    D.fill(tabHost, UI.tabs({ items: TABS, cur: st.tab, onChange: function (k) { st.tab = k; st.sel = {}; w.ZR.render(); } }));
    host.appendChild(tabHost);
    host.appendChild(bodyHost);

    if (st.tab === 'all') tabAll(bodyHost);
    if (st.tab === 'mine') tabMine(bodyHost);
    if (st.tab === 'todo') tabTodo(bodyHost);
    if (st.tab === 'recs') tabRecs(bodyHost);
  }

  w.ZKP.pages({
    apply: {
      title: '分值申报', group: '成绩与评价',
      render: render
    }
  });
})(window);
