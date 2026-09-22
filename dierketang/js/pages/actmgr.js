/* ==========================================================================
   actmgr.js —— 活动管理（组织者与管理员的核心作业台）
   五个真实作业面：
   ① 报名管理：审核通过 / 驳回（写回报名记录 + 留痕）、批量审核、现场报名导入、导出
   ② 签到管理：签到率统计、缺勤名单、手动补签（写回签到记录）、黑名单自动纳入
   ③ 作品管理：作品审核 + 专家评分汇总 + 多轮评审阶段推进
   ④ 获奖与证书：按评分排名定奖、生成证书编号、证书导出
   ⑤ 协同管理员：为活动配置主管理员 / 协同管理员与权限范围
   所有操作都真实落库（DB.insert / DB.update / DB.removeWhere），刷新后保持一致。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = {
    tab: 'enroll', actId: '', college: '', status: '', kw: '',
    page: 1, ps: 12, sel: {}, workAct: '', awardBusy: false
  };

  /** 4 位序号（证书编号 / 导入批次） */
  function p4(n) { return ('0000' + n).slice(-4); }

  /** 获奖名单取数（表格与导出共用同一条件） */
  function awardRows() {
    var d = DB.filter('works', function (x) { return !!x.award; });
    if (st.workAct) d = d.filter(function (x) { return x.actId === st.workAct; });
    if (st.status) d = d.filter(function (x) { return x.award === st.status; });
    return d;
  }

  function acts() { return KP.scopeFilter(DB.col('activities')); }
  function actOpts() { return [['', '全部活动']].concat(U.sortBy(acts(), function (a) { return a.start; }, true).map(function (a) { return [a.id, a.title]; })); }
  function curAct() { return st.actId ? DB.get('activities', st.actId) : null; }
  function shortTitle(a) { return a ? (a.title.length > 16 ? a.title.slice(0, 16) + '…' : a.title) : ''; }

  /* ================= ① 报名管理 ================= */
  function enrollRows() {
    var list = KP.scopeFilter(DB.col('enrollments'));
    if (st.actId) list = list.filter(function (e) { return e.actId === st.actId; });
    if (st.college) list = list.filter(function (e) { return e.collegeId === st.college || e.college === st.college; });
    if (st.status) list = list.filter(function (e) { return e.status === st.status; });
    if (st.kw) list = list.filter(function (e) { return U.hitAny([e.name, e.sno, e.actTitle, e.className, e.major], st.kw); });
    /* 按报名时间倒序：刚提交的报名永远在第 1 页，演示时能立刻看到数据流转结果 */
    return U.sortBy(list, function (e) { return String(e.at || ''); }, true);
  }

  function reviewEnroll(ids, pass, note) {
    var n = 0;
    ids.forEach(function (id) {
      var e = DB.get('enrollments', id);
      if (!e || e.status !== '待审核') return;
      DB.update('enrollments', id, {
        status: pass ? '已通过' : '已驳回',
        reviewer: ZA.session.name, note: note || (pass ? '符合报名条件' : '不符合报名条件')
      });
      n++;
    });
    DB.insert('logs', {
      at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
      action: pass ? '批量通过报名' : '批量驳回报名', module: '报名管理',
      target: st.actId || '多个活动', ip: '10.16.1.101', result: '成功', detail: '共处理 ' + n + ' 条'
    });
    UI.toast(pass ? '报名审核已通过' : '报名已驳回', '共处理 ' + n + ' 条记录', pass ? 'ok' : 'warn');
    st.sel = {};
    return n;
  }

  function tabEnroll(host) {
    var list = enrollRows();
    var selIds = function () { return Object.keys(st.sel).filter(function (k) { return st.sel[k]; }); };

    var lister = KP.lister({
      host: host, title: '报名管理', sub: '共 ' + list.length + ' 条报名记录',
      filters: function () {
        return UI.filterBar([
          { type: 'select', label: '活动', value: st.actId, width: 230, options: actOpts(), onChange: function (v) { st.actId = v; w.ZR.render(); } },
          { type: 'select', label: '学院', value: st.college, options: [['', '全部学院']].concat(DB.col('colleges').map(function (c) { return [c.id, c.name]; })), onChange: function (v) { st.college = v; w.ZR.render(); } },
          { type: 'select', label: '状态', value: st.status, options: [['', '全部状态'], ['待审核', '待审核'], ['已通过', '已通过'], ['已驳回', '已驳回'], ['已取消', '已取消']], onChange: function (v) { st.status = v; w.ZR.render(); } },
          { type: 'input', ph: '搜索姓名 / 学号 / 班级…', value: st.kw, width: 200, onChange: function (e) { st.kw = e.target.value; w.ZR.render(); } }
        ]);
      },
      toolbar: function () {
        return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          D.h('span', { style: 'font-weight:650;font-size:12.5px' }, '批量操作：'),
          D.h('button.btn.btn-sm.btn-p', {
            onclick: function () {
              var ids = selIds();
              if (!ids.length) { UI.toast('请先勾选报名记录', '可勾选左侧复选框后再操作', 'warn'); return; }
              UI.confirm({
                title: '批量通过报名', okText: '确认通过',
                text: '确认通过选中的 ' + ids.length + ' 条报名申请吗？',
                detail: '通过后将向学生推送报名成功通知，并占用相应活动名额。',
                onOk: function () { reviewEnroll(ids, true); w.ZR.render(); }
              });
            }
          }, '✓ 批量通过'),
          D.h('button.btn.btn-sm.btn-dan', {
            onclick: function () {
              var ids = selIds();
              if (!ids.length) { UI.toast('请先勾选报名记录', '可勾选左侧复选框后再操作', 'warn'); return; }
              rejectModal(ids);
            }
          }, '✕ 批量驳回'),
          D.h('span.muted', '已勾选 ' + selIds().length + ' 条'),
          D.h('div', { style: 'margin-left:auto;display:flex;gap:9px' },
            D.h('button.btn.btn-sm', { onclick: importModal }, '⤒ 现场报名导入'),
            KP.exportBtn('报名明细', [
              { t: '报名编号', k: 'id' }, { t: '活动', k: 'actTitle' }, { t: '报名项目', k: 'itemName' },
              { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' }, { t: '学院', k: 'college' },
              { t: '专业', k: 'major' }, { t: '班级', k: 'className' }, { t: '年级', k: 'grade' },
              { t: '报名时间', k: 'at' }, { t: '状态', k: 'status' },
              { t: '审核人', raw: function (e) { return e.reviewer || ''; } }, { t: '备注', raw: function (e) { return e.note || ''; } },
              { t: '签到状态', raw: function (e) { return e.signStatus || ''; } }
            ], enrollRows())
          )
        );
      },
      cols: [
        { t: '姓名', w: 152, render: function (e) { return KP.who(e.name, e.sno, { size: 28 }); } },
        { t: '活动', render: function (e) { return KP.cell(shortTitle(DB.get('activities', e.actId)) || e.actTitle, e.itemName); } },
        { t: '学院 / 班级', render: function (e) { return KP.cell(e.college, e.major + ' · ' + e.className); } },
        { t: '报名时间', k: 'at', w: 142 },
        { t: '状态', w: 96, render: function (e) { return KP.status(e.status); } },
        { t: '签到', w: 92, render: function (e) { return e.signStatus ? KP.status(e.signStatus) : D.h('span.muted', '—'); } },
        {
          t: '操作', w: 158, render: function (e) {
            if (e.status !== '待审核') {
              return KP.acts([
                D.h('button.btn.btn-sm', { onclick: function () { enrollDetail(e); } }, '明细'),
                e.status === '已通过' ? D.h('button.btn.btn-sm', { onclick: function () { resetMakeup(e); } }, '补签') : null
              ]);
            }
            return KP.acts([
              D.h('button.btn.btn-sm.btn-p', {
                onclick: function () {
                  reviewEnroll([e.id], true);
                  DB.update('enrollments', e.id, { onSite: e.onSite });
                  w.ZR.render();
                }
              }, '通过'),
              D.h('button.btn.btn-sm.btn-dan', { onclick: function () { rejectModal([e.id]); } }, '驳回'),
              D.h('button.btn.btn-sm', { onclick: function () { enrollDetail(e); } }, '明细')
            ]);
          }
        }
      ],
      rows: function () { return enrollRows(); },
      selectable: true,
      onSelect: function (row, on) { st.sel[row.id] = on; },
      pageSize: st.ps,
      footLeft: function () { return D.h('span.muted', '共 ' + enrollRows().length + ' 条报名记录'); },
      empty: '没有符合条件的报名记录', emptySub: '在「第二课堂活动」中发布活动后，学生报名数据会实时汇总到这里'
    });
    return lister;
  }

  function rejectModal(ids) {
    var reason = '';
    var ta = UI.textarea({ rows: 3, placeholder: '请填写驳回原因，将同步推送给学生', onInput: function (e) { reason = e.target.value; } });
    var m = UI.modal({
      title: '驳回报名', size: 'slim',
      body: D.h('div', {},
        D.h('div.req-note', '将驳回 ' + ids.length + ' 条报名申请。驳回原因会作为推送消息发送给学生本人，并记录在报名明细中。'),
        D.h('div.mt12', UI.field({ label: '驳回原因', required: true, control: ta, hint: '例如：不符合本活动报名范围（限 2024 级）' }))
      ),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-dan', {
          onclick: function () {
            if (!String(reason).trim()) { UI.toast('请填写驳回原因', '', 'warn'); return; }
            reviewEnroll(ids, false, reason);
            m.close(); w.ZR.render();
          }
        }, '确认驳回')
      ]
    });
    setTimeout(function () { if (ta.focus) ta.focus(); }, 50);
  }

  function enrollDetail(e) {
    var a = DB.get('activities', e.actId);
    var sg = DB.find('signins', function (x) { return x.actId === e.actId && x.studentId === e.studentId; });
    UI.modal({
      title: '报名明细 · ' + e.name, sub: e.actTitle, size: 'wide',
      body: D.h('div', {},
        KP.kv([
          ['报名编号', e.id], ['报名项目', e.itemName], ['学号', e.sno], ['学院', e.college],
          ['专业班级', e.major + ' · ' + e.className], ['年级', e.grade], ['联系方式', e.contact || '—'],
          ['报名时间', e.at], ['报名状态', e.status], ['审核人', e.reviewer || '—'],
          ['审核备注', e.note || '—'], ['报名来源', e.onSite ? '现场报名（组织者录入）' : '学生自主报名'],
          ['签到状态', sg ? sg.status + '（' + sg.method + ' · ' + sg.at + '）' : '未签到']
        ]),
        Object.keys(e.formData || {}).length ? D.h('div.mt12', {},
          D.h('div', { style: 'font-weight:700;font-size:13px;margin-bottom:6px' }, '报名表单填写内容'),
          KP.kv(Object.keys(e.formData).map(function (k) { return [k, e.formData[k] || '—']; }))
        ) : null,
        a ? D.h('div.mt12', {},
          D.h('div', { style: 'font-weight:700;font-size:13px;margin-bottom:6px' }, '所属活动'),
          KP.kv([['活动名称', a.title], ['主办单位', a.host], ['活动时间', U.dt(a.start) + ' — ' + U.dt(a.end)], ['认定分值', '学分 ' + a.credit + ' · 学时 ' + a.hours + ' · 积分 ' + a.points]])
        ) : null
      ),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZUI.closeAllModals(); } }, '关闭'),
        D.h('button.btn.btn-sm', {
          onclick: function () {
            UI.printHTML('报名明细 · ' + e.name,
              '<div class="h1">第二课堂活动报名明细</div>' +
              '<div class="sub">' + DB.data.meta.school + ' · ' + DB.data.meta.term + '</div>' +
              KP.metricsHTML([['报名项目', e.itemName], ['报名状态', e.status], ['签到状态', sg ? sg.status : '未签到']]) +
              KP.tableHTML([{ t: '项目', k: 'k' }, { t: '内容', k: 'v' }], [
                { k: '报名编号', v: e.id }, { k: '姓名', v: e.name }, { k: '学号', v: e.sno },
                { k: '学院', v: e.college }, { k: '专业班级', v: e.major + ' ' + e.className },
                { k: '年级', v: e.grade }, { k: '联系方式', v: e.contact || '—' },
                { k: '报名时间', v: e.at }, { k: '审核人', v: e.reviewer || '—' }, { k: '审核备注', v: e.note || '—' }
              ]));
          }
        }, '🖨 打印明细')
      ]
    });
  }

  function resetMakeup(e) {
    var a = DB.get('activities', e.actId);
    if (!a) { UI.toast('未找到对应活动', '', 'err'); return; }
    var sg = DB.find('signins', function (x) { return x.actId === a.id && x.studentId === e.studentId; });
    if (!sg) {
      DB.insert('signins', {
        actId: a.id, actTitle: a.title, itemName: e.itemName, studentId: e.studentId,
        name: e.name, sno: e.sno, college: e.college, className: e.className,
        method: '组织者补签', at: U.dt(new Date()), status: '已签到',
        place: '由 ' + ZA.session.name + ' 手动补签', device: '管理端', makeUp: true
      });
    } else {
      DB.update('signins', sg.id, { status: '已签到', method: '组织者补签', makeUp: true, place: '由 ' + ZA.session.name + ' 手动补签' });
    }
    DB.update('enrollments', e.id, { signStatus: '已签到' });
    DB.insert('logs', {
      at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
      action: '手动补签', module: '活动管理', target: a.id, ip: '10.16.1.101', result: '成功', detail: e.name + ' · ' + a.title
    });
    UI.toast('已补签', e.name + ' · ' + a.title, 'ok');
  }

  function importModal() {
    var text = '';
    var ta = UI.textarea({ rows: 6, placeholder: '每行一条：学号,姓名\n例：\n26010101,张同学\n26010102,李同学', onInput: function (e) { text = e.target.value; } });
    var m = UI.modal({
      title: '现场报名导入', sub: '用于活动现场临时报名（纸质签到表批量录入）', size: 'wide',
      body: D.h('div', {},
        D.h('div.req-note', '粘贴现场签到的「学号,姓名」列表，系统将匹配学籍信息并生成报名记录（状态为「已通过」，并在报名明细中标注为现场报名）。'),
        D.h('div.mt12', UI.field({ label: '活动', required: true, control: UI.select({ id: 'impAct', options: KP.notPub(acts()).length ? actOpts().slice(1) : actOpts(), onChange: function (v) { st.actId = v; } }) })),
        D.h('div.mt12', UI.field({ label: '导入数据', required: true, control: ta, hint: '支持逗号或制表符分隔，单次最多 200 条' }))
      ),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var aid = D.q('#impAct', m.body);
            aid = aid ? aid.value : st.actId;
            var a = DB.get('activities', aid || st.actId);
            if (!a) { UI.toast('请先选择活动', '', 'warn'); return; }
            var lines = String(text).split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 200);
            if (!lines.length) { UI.toast('请粘贴导入数据', '每行一条：学号,姓名', 'warn'); return; }
            var ok = 0, miss = 0, dup = 0;
            lines.forEach(function (ln, i) {
              var parts = ln.split(/[,\t，]+/).map(function (x) { return x.trim(); });
              var sno = parts[0], name = parts[1] || '';
              var stu = DB.find('students', function (x) { return x.sno === sno || x.name === name; });
              if (!stu) { miss++; return; }
              var ex = DB.find('enrollments', function (x) { return x.actId === a.id && x.studentId === stu.id; });
              if (ex) { dup++; return; }
              DB.insert('enrollments', {
                actId: a.id, actTitle: a.title, cat: a.cat,
                itemId: (a.items[0] || {}).id || '', itemName: (a.items[0] || {}).name || '统一报名',
                studentId: stu.id, sno: stu.sno, name: stu.name, gender: stu.gender,
                collegeId: stu.collegeId, college: stu.college, major: stu.major, className: stu.className,
                grade: stu.grade, contact: stu.contact, at: U.dt(new Date()),
                status: '已通过', reviewer: ZA.session.name, note: '现场报名导入',
                onSite: true, signStatus: '已签到', formData: {}, importBatch: 'B' + p4(i + 1)
              });
              ok++;
            });
            DB.insert('logs', {
              at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
              action: '现场报名导入', module: '报名管理', target: a.id, ip: '10.16.1.101',
              result: '成功', detail: '成功 ' + ok + ' 条 / 未匹配 ' + miss + ' 条 / 重复 ' + dup + ' 条'
            });
            m.close();
            UI.toast('导入完成', '成功 ' + ok + ' 条，未匹配 ' + miss + ' 条，重复跳过 ' + dup + ' 条', ok ? 'ok' : 'warn');
            w.ZR.render();
          }
        }, '开始导入')
      ]
    });
  }

  /* ================= ② 签到管理 ================= */
  function signinRows() {
    var list = DB.col('signins');
    var acts1 = {};
    acts().forEach(function (a) { acts1[a.id] = 1; });
    list = list.filter(function (x) { return acts1[x.actId]; });
    if (st.actId) list = list.filter(function (x) { return x.actId === st.actId; });
    if (st.college) list = list.filter(function (x) { return x.college === st.college; });
    if (st.status) list = list.filter(function (x) { return x.status === st.status; });
    if (st.kw) list = list.filter(function (x) { return U.hitAny([x.name, x.sno, x.actTitle, x.className, x.method], st.kw); });
    /* 按签到时间倒序：刚签到成功的记录排在最前 */
    return U.sortBy(list, function (x) { return String(x.at || ''); }, true);
  }

  function tabSign(host) {
    var all = DB.col('signins').filter(function (x) {
      var a = DB.get('activities', x.actId);
      return a && KP.isPub(a);
    });
    var byAct = {};
    all.forEach(function (x) {
      if (!byAct[x.actId]) byAct[x.actId] = { ok: 0, miss: 0, makeup: 0 };
      if (x.status === '缺勤') byAct[x.actId].miss++; else byAct[x.actId].ok++;
      if (x.makeUp) byAct[x.actId].makeup++;
    });
    var actRank = Object.keys(byAct).map(function (k) {
      var a = DB.get('activities', k);
      var d = byAct[k];
      return { a: a, ok: d.ok, miss: d.miss, makeup: d.makeup, n: d.ok + d.miss };
    }).sort(function (x, y) { return (x.ok / (x.n || 1)) - (y.ok / (y.n || 1)); }).slice(0, 8);

    host.appendChild(D.h('div.g-21', {},
      D.h('div', {}, KP.lister({
        host: D.h('div'), title: '签到记录', sub: '共 ' + signinRows().length + ' 条签到记录',
        filters: function () {
          return UI.filterBar([
            { type: 'select', label: '活动', value: st.actId, width: 230, options: actOpts(), onChange: function (v) { st.actId = v; w.ZR.render(); } },
            { type: 'select', label: '学院', value: st.college, options: [['', '全部学院']].concat(DB.col('colleges').map(function (c) { return [c.name, c.name]; })), onChange: function (v) { st.college = v; w.ZR.render(); } },
            { type: 'select', label: '状态', value: st.status, options: [['', '全部状态'], ['已签到', '已签到'], ['已签退', '已签退'], ['未签到', '未签到'], ['缺勤', '缺勤']], onChange: function (v) { st.status = v; w.ZR.render(); } },
            { type: 'input', ph: '搜索姓名 / 学号…', value: st.kw, width: 180, onChange: function (e) { st.kw = e.target.value; w.ZR.render(); } }
          ]);
        },
        toolbar: function () {
          return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
            D.h('span', { style: 'font-weight:650;font-size:12.5px' }, '签到作业：'),
            D.h('button.btn.btn-sm', { onclick: missModal }, '⚠ 缺勤名单与黑名单处理'),
            D.h('button.btn.btn-sm', { onclick: function () { st.status = '缺勤'; w.ZR.render(); } }, '只看缺勤'),
            D.h('div', { style: 'margin-left:auto' }, KP.exportBtn('签到明细', [
              { t: '签到编号', k: 'id' }, { t: '活动', k: 'actTitle' }, { t: '报名项目', k: 'itemName' },
              { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' }, { t: '学院', k: 'college' }, { t: '班级', k: 'className' },
              { t: '签到方式', k: 'method' }, { t: '签到时间', k: 'at' }, { t: '状态', k: 'status' },
              { t: '校验位置', raw: function (x) { return x.place || ''; } }, { t: '设备', raw: function (x) { return x.device || ''; } },
              { t: '是否补签', raw: function (x) { return x.makeUp ? '是' : '否'; } }
            ], signinRows()))
          );
        },
        cols: [
          { t: '姓名', w: 148, render: function (x) { return KP.who(x.name, x.sno, { size: 26 }); } },
          { t: '活动', render: function (x) { return KP.cell(shortTitle(DB.get('activities', x.actId)) || x.actTitle, x.itemName); } },
          { t: '学院 / 班级', render: function (x) { return KP.cell(x.college, x.className, { clip: true }); } },
          { t: '签到方式', w: 112, render: function (x) { return D.h('span', {}, x.method, x.makeUp ? D.h('span.tag.tag-warn', { style: 'margin-left:5px' }, '补签') : null); } },
          { t: '时间', k: 'at', w: 138 },
          { t: '状态', w: 92, render: function (x) { return KP.status(x.status); } },
          { t: '校验', render: function (x) { return D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, x.place || '—', D.h('div', x.device || '—')); } },
          {
            t: '操作', w: 108, render: function (x) {
              return KP.acts([D.h('button.btn.btn-sm', {
                onclick: function () {
                  var e = DB.find('enrollments', function (y) { return y.actId === x.actId && y.studentId === x.studentId; });
                  if (!e) { UI.toast('未找到对应报名记录', '', 'warn'); return; }
                  resetMakeup(e); w.ZR.render();
                }
              }, x.status === '缺勤' ? '补签' : '重签')]);
            }
          }
        ],
        rows: function () { return signinRows(); },
        pageSize: st.ps, mini: true,
        empty: '没有符合条件的签到记录'
      })),
      D.h('div', {},
        UI.card({
          title: '签到率较低的场次', sub: '按签到率升序，便于重点督办', tight: true,
          body: UI.table({
            cols: [
              { t: '活动', render: function (r) { return KP.cell(r.a ? r.a.title : '—', r.a ? U.dt(r.a.start, false) : ''); } },
              { t: '签到', w: 88, align: 'right', render: function (r) { return KP.numCell(r.ok, '人'); } },
              { t: '缺勤', w: 88, align: 'right', render: function (r) { return KP.numCell(r.miss, '人'); } },
              { t: '签到率', w: 104, render: function (r) { return KP.progCell(r.n ? r.ok / r.n * 100 : 0); } }
            ],
            rows: actRank, mini: true, center: true, noCard: true
          })
        }),
        D.h('div.mt12', UI.card({
          title: '签到规则（系统内置）', tight: true,
          body: D.h('div', { style: 'font-size:12.2px;line-height:1.95;color:var(--text2)' },
            D.h('div', '· 扫码签到：大屏动态二维码每 60 秒刷新一次，扫码 + 定位双重校验'),
            D.h('div', '· 位置签到：距离活动地点 ' + (w.ZSIGN ? w.ZSIGN.RADIUS : 300) + ' 米内方可签到'),
            D.h('div', '· 签退：活动结束前需完成签退，未签退按「未签到」处理'),
            D.h('div', '· 缺勤统计：90 天内累计 3 次缺勤自动纳入活动黑名单，30 天后自动解除'),
            D.h('div.mt8', D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('rule'); } }, '前往「活动规则设置」调整规则 →'))
          )
        }))
      )
    ));
  }

  function missModal() {
    var misses = DB.col('signins').filter(function (x) { return x.status === '缺勤'; });
    var byStu = {};
    misses.forEach(function (x) {
      if (!byStu[x.studentId]) byStu[x.studentId] = { name: x.name, sno: x.sno, college: x.college, className: x.className, n: 0, acts: [] };
      byStu[x.studentId].n++;
      byStu[x.studentId].acts.push(DB.get('activities', x.actId) ? DB.get('activities', x.actId).title : x.actTitle);
    });
    var rows = Object.keys(byStu).map(function (k) { return Object.assign({ studentId: k }, byStu[k]); })
      .sort(function (a, b) { return b.n - a.n; });
    var hitRule = rows.filter(function (r) { return r.n >= 3; });
    var body = D.h('div', {},
      D.h('div.req-note', '系统按「黑名单规则 AR4」自动识别：<b>最近 90 天内缺勤累计 ≥ 3 次</b>的学生将自动纳入活动黑名单，黑名单期间无法报名新活动，满 30 天后自动解除。'),
      D.h('div.g4.mt12', {},
        UI.stat({ ic: '⚠', label: '缺勤记录', num: misses.length, unit: '条', fg: '#d97706', bg: '#fffbeb' }),
        UI.stat({ ic: '👥', label: '涉及学生', num: rows.length, unit: '人', fg: '#0891b2', bg: '#ecfeff' }),
        UI.stat({ ic: '🚫', label: '达到黑名单条件', num: hitRule.length, unit: '人', fg: '#dc2626', bg: '#fef2f2' }),
        UI.stat({ ic: '⏳', label: '当前黑名单在册', num: DB.count('blacklist', function (b) { return b.active; }), unit: '人', fg: '#7c3aed', bg: '#f5f3ff' })
      ),
      D.h('div.mt12', UI.table({
        cols: [
          { t: '姓名', w: 152, render: function (r) { return KP.who(r.name, r.sno, { size: 26 }); } },
          { t: '学院 / 班级', render: function (r) { return KP.cell(r.college, r.className, { clip: true }); } },
          { t: '缺勤次数', w: 108, align: 'right', render: function (r) { return KP.numCell(r.n, '次'); } },
          { t: '触发判定', w: 128, render: function (r) { return KP.status(r.n >= 3 ? '达到黑名单条件' : '关注'); } },
          { t: '涉及活动', render: function (r) { return D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, r.acts.slice(0, 3).join('、') + (r.acts.length > 3 ? ' 等' : '')); } },
          {
            t: '操作', w: 138, render: function (r) {
              var inBl = DB.find('blacklist', function (b) { return b.studentId === r.studentId && b.active; });
              if (inBl) return D.h('span.tag.tag-err', '已在黑名单');
              return KP.acts([D.h('button.btn.btn-sm.btn-dan', {
                onclick: function () {
                  DB.insert('blacklist', {
                    studentId: r.studentId, sno: r.sno, name: r.name, college: r.college, className: r.className,
                    contact: '', reason: '90 天内缺勤累计 ' + r.n + ' 次（组织者手动纳入）',
                    misses: r.n, at: U.dt(new Date()),
                    autoOutAt: U.dt(new Date(Date.now() + 30 * 86400000)),
                    active: true, source: '组织者手动纳入', related: ''
                  });
                  DB.insert('logs', {
                    at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
                    action: '纳入活动黑名单', module: '活动管理', target: r.studentId,
                    ip: '10.16.1.101', result: '成功', detail: r.name + ' · 缺勤 ' + r.n + ' 次'
                  });
                  UI.toast('已纳入黑名单', r.name + ' · 30 天后自动解除', 'ok');
                  w.ZUI.closeAllModals(); w.ZR.render();
                }
              }, '纳入黑名单')]);
            }
          }
        ],
        rows: rows, mini: true, noCard: true,
        empty: '暂无缺勤记录', emptySub: '活动结束后系统自动统计缺勤名单'
      }))
    );
    UI.modal({ title: '缺勤名单与黑名单处理', sub: '规则 AR4 / AR5 · 自动识别与手动处理', size: 'xwide', body: body, foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZUI.closeAllModals(); } }, '关闭')] });
  }

  /* ================= ③ 作品管理 ================= */
  function workRows() {
    var list = KP.scopeFilter(DB.col('works'));
    if (st.workAct) list = list.filter(function (x) { return x.actId === st.workAct; });
    if (st.status) list = list.filter(function (x) { return x.status === st.status; });
    if (st.kw) list = list.filter(function (x) { return U.hitAny([x.name, x.sno, x.title, x.actTitle, x.className], st.kw); });
    return U.sortBy(list, function (x) { return String(x.at || ''); }, true);
  }
  function avgExpert(x) {
    var arr = x.expert || [];
    if (!arr.length) return null;
    return Math.round(U.avg(arr, function (e) { return U.num(e.score); }) * 10) / 10;
  }
  function totalScore(x) {
    var e = avgExpert(x);
    var base = e === null ? U.num(x.score) : e;
    return Math.round((base * 0.8 + Math.min(U.num(x.votes), 100) * 0.2) * 10) / 10;
  }

  function tabWork(host) {
    var list = workRows();
    host.appendChild(KP.lister({
      host: D.h('div'), title: '作品管理', sub: '共 ' + list.length + ' 件作品',
      filters: function () {
        return UI.filterBar([
          { type: 'select', label: '活动', value: st.workAct, width: 230, options: actOpts(), onChange: function (v) { st.workAct = v; w.ZR.render(); } },
          { type: 'select', label: '状态', value: st.status, options: [['', '全部状态'], ['待审核', '待审核'], ['已通过', '已通过'], ['已驳回', '已驳回'], ['已获奖', '已获奖']], onChange: function (v) { st.status = v; w.ZR.render(); } },
          { type: 'input', ph: '搜索作品标题 / 作者…', value: st.kw, width: 200, onChange: function (e) { st.kw = e.target.value; w.ZR.render(); } }
        ]);
      },
      toolbar: function () {
        return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          D.h('span', { style: 'font-weight:650;font-size:12.5px' }, '作品作业：'),
          D.h('button.btn.btn-sm', { onclick: function () { awardModal(); } }, '🏅 按评分定奖并生成证书'),
          D.h('button.btn.btn-sm', { onclick: function () { st.status = '待审核'; w.ZR.render(); } }, '只看待审作品'),
          D.h('div', { style: 'margin-left:auto' }, KP.exportBtn('作品清单', [
            { t: '作品编号', k: 'id' }, { t: '活动', k: 'actTitle' }, { t: '作品标题', k: 'title' },
            { t: '作者', k: 'name' }, { t: '学号', k: 'sno' }, { t: '学院', k: 'college' }, { t: '班级', k: 'className' },
            { t: '类型', k: 'type' }, { t: '大小', k: 'size' }, { t: '提交时间', k: 'at' },
            { t: '状态', k: 'status' }, { t: '专家均分', raw: function (x) { return avgExpert(x) === null ? '' : avgExpert(x); } },
            { t: '投票数', raw: function (x) { return U.num(x.votes); } }, { t: '综合得分', raw: totalScore },
            { t: '获奖', raw: function (x) { return x.award || ''; } }, { t: '证书编号', raw: function (x) { return x.certNo || ''; } }
          ], workRows()))
        );
      },
      cols: [
        { t: '作品', render: function (x) { return KP.cell(x.title, x.actTitle, { clip: true, title: x.title }); } },
        { t: '作者', w: 148, render: function (x) { return KP.who(x.name, x.sno, { size: 26 }); } },
        { t: '学院 / 班级', render: function (x) { return KP.cell(x.college, x.className, { clip: true }); } },
        { t: '类型 / 大小', w: 124, render: function (x) { return KP.cell(x.type, x.size); } },
        { t: '提交时间', k: 'at', w: 138 },
        { t: '专家均分', w: 96, align: 'right', render: function (x) { var v = avgExpert(x); return v === null ? D.h('span.muted', '未评') : KP.numCell(v, '分'); } },
        { t: '投票', w: 78, align: 'right', render: function (x) { return KP.numCell(U.num(x.votes)); } },
        { t: '综合得分', w: 100, align: 'right', render: function (x) { return KP.numCell(totalScore(x), '分', { color: '#2563eb' }); } },
        { t: '状态', w: 96, render: function (x) { return KP.status(x.award || x.status); } },
        {
          t: '操作', w: 158, render: function (x) {
            return KP.acts([
              D.h('button.btn.btn-sm', { onclick: function () { workDetail(x); } }, '评审'),
              x.status === '待审核' ? D.h('button.btn.btn-sm.btn-p', {
                onclick: function () {
                  DB.update('works', x.id, { status: '已通过', stage: '终审通过' });
                  UI.toast('作品已通过', x.title, 'ok'); w.ZR.render();
                }
              }, '通过') : null,
              x.status === '待审核' ? D.h('button.btn.btn-sm.btn-dan', {
                onclick: function () {
                  DB.update('works', x.id, { status: '已驳回', stage: '终审驳回', note: '不符合征稿要求' });
                  UI.toast('作品已驳回', x.title, 'warn'); w.ZR.render();
                }
              }, '驳回') : null
            ]);
          }
        }
      ],
      rows: function () { return workRows(); },
      pageSize: st.ps, mini: true,
      empty: '没有符合条件的作品', emptySub: '学生提交作品后会汇总到这里'
    }));
  }

  function workDetail(x) {
    var a = DB.get('activities', x.actId);
    var experts = x.expert || [];
    UI.modal({
      title: '作品评审 · ' + x.title, sub: x.actTitle + ' · ' + x.name, size: 'xwide',
      body: D.h('div', {},
        D.h('div.g-21', {},
          D.h('div', {},
            KP.kv([
              ['作品编号', x.id], ['作者', x.name + '（' + x.sno + '）'], ['学院班级', x.college + ' · ' + x.className],
              ['作品类型', x.type], ['文件大小', x.size], ['提交时间', x.at],
              ['当前阶段', x.stage || '提交'], ['审核状态', x.status],
              ['专家均分', avgExpert(x) === null ? '未评分' : avgExpert(x) + ' 分'],
              ['网络投票', U.num(x.votes) + ' 票'], ['综合得分', totalScore(x) + ' 分'],
              ['获奖等级', x.award || '未评奖'], ['证书编号', x.certNo || '未生成']
            ]),
            a ? D.h('div.mt12', D.h('div.req-note', '所属活动：<b>' + a.title + '</b> · 作品规则：格式 ' +
              ((a.workRule || {}).formats || []).join('/') + ' · 最多 ' + ((a.workRule || {}).maxCount || 1) + ' 件 · ' +
              ((a.workRule || {}).multiStage ? '多轮评审' : '单轮评审') +
              ((a.workRule || {}).expert ? ' · 启用专家评分' : ''))) : null
          ),
          D.h('div', {},
            UI.card({
              title: '专家评分明细', tight: true,
              body: experts.length ? D.h('div', {},
                UI.table({
                  cols: [
                    { t: '专家', k: 'name' },
                    { t: '评分', w: 88, align: 'right', render: function (e) { return KP.numCell(e.score, '分'); } },
                    { t: '评语', k: 'note' }
                  ],
                  rows: experts, mini: true, noCard: true
                }),
                D.h('div', { style: 'margin-top:10px' },
                  D.h('button.btn.btn-sm', {
                    onclick: function () {
                      var sc = Math.round(U.rndInt(Math.random, 72, 96));
                      var ne = experts.concat([{ name: '管理员（' + ZA.session.name + '）', score: sc, note: '管理端复核评分' }]);
                      DB.update('works', x.id, { expert: ne, score: Math.round(U.avg(ne, function (e) { return U.num(e.score); })) });
                      UI.toast('已追加复核评分', '评分 ' + sc + ' 分', 'ok');
                      w.ZUI.closeAllModals(); w.ZR.render();
                    }
                  }, '＋ 追加管理端复核评分')
                )
              ) : UI.empty('暂无专家评分', '可追加管理端复核评分')
            }),
            D.h('div.mt12', UI.card({
              title: '评审阶段推进', tight: true,
              body: D.h('div', {},
                UI.steps({ cur: x.stage === '终审通过' ? 3 : (x.status === '待审核' ? 1 : 2), items: ['作品提交', '初审', '专家评审', '终审与定奖'] }),
                D.h('div.btn-row', { style: 'margin-top:11px' },
                  D.h('button.btn.btn-sm', {
                    onclick: function () {
                      DB.update('works', x.id, { stage: '初审通过', status: '待审核' });
                      UI.toast('已推进到专家评审阶段', x.title, 'ok'); w.ZUI.closeAllModals(); w.ZR.render();
                    }
                  }, '推进到专家评审'),
                  D.h('button.btn.btn-sm.btn-p', {
                    onclick: function () {
                      DB.update('works', x.id, { stage: '终审通过', status: '已通过' });
                      UI.toast('已完成终审', x.title, 'ok'); w.ZUI.closeAllModals(); w.ZR.render();
                    }
                  }, '完成终审')
                )
              )
            }))
          )
        )
      ),
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZUI.closeAllModals(); } }, '关闭')]
    });
  }

  /* ================= ④ 获奖与证书 ================= */
  function awardModal() {
    var a = st.workAct ? DB.get('activities', st.workAct) : DB.find('activities', function (x) { return DB.count('works', function (y) { return y.actId === x.id; }) > 0; });
    var sel = a ? a.id : (acts()[0] || {}).id;
    var host = D.h('div');
    var m = UI.modal({
      title: '按评分定奖并生成证书', sub: '综合得分 = 专家均分 × 0.8 + 投票数（上限 100）× 0.2', size: 'xwide',
      body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var list = DB.filter('works', function (x) { return x.actId === sel; });
            if (!list.length) { UI.toast('该活动暂无作品', '', 'warn'); return; }
            var ranked = list.slice().sort(function (x, y) { return totalScore(y) - totalScore(x); });
            var plan = [];
            var cfg = [{ n: 1, t: '一等奖' }, { n: 2, t: '二等奖' }, { n: 3, t: '三等奖' }, { n: 5, t: '优秀奖' }];
            var idx = 0, seq = 1;
            cfg.forEach(function (c) {
              for (var i = 0; i < c.n && idx < ranked.length; i++, idx++) {
                plan.push({ w: ranked[idx], award: c.t, no: 'CERT-' + new Date().getFullYear() + '-' + p4(seq++) });
              }
            });
            plan.forEach(function (p) {
              DB.update('works', p.w.id, { award: p.award, certNo: p.no, status: '已获奖' });
            });
            if (a) DB.update('activities', a.id, { certCount: plan.length });
            DB.insert('logs', {
              at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
              action: '作品定奖与证书生成', module: '活动管理', target: sel,
              ip: '10.16.1.101', result: '成功', detail: '共生成 ' + plan.length + ' 份证书'
            });
            UI.toast('定奖完成', '共生成 ' + plan.length + ' 份获奖证书', 'ok');
            m.close(); w.ZR.render();
          }
        }, '按排名定奖并生成证书')
      ]
    });

    function paint() {
      D.fill(host, null);
      host.appendChild(UI.filterBar([
        { type: 'select', label: '活动', width: 260, value: sel, options: actOpts(), onChange: function (v) { sel = v; paint(); } }
      ]));
      var list = DB.filter('works', function (x) { return x.actId === sel; });
      if (!list.length) { host.appendChild(D.h('div.mt12', UI.empty('该活动暂无作品', '学生提交作品后方可定奖'))); return; }
      var ranked = list.slice().sort(function (x, y) { return totalScore(y) - totalScore(x); });
      host.appendChild(D.h('div.mt12', UI.table({
        cols: [
          { t: '排名', w: 62, align: 'center', render: function (x, i) { return D.h('span', { style: 'font-weight:750;color:' + (i < 3 ? '#d97706' : 'var(--text3)') }, i + 1); } },
          { t: '作品', render: function (x) { return KP.cell(x.title, x.actTitle, { clip: true }); } },
          { t: '作者', w: 148, render: function (x) { return KP.who(x.name, x.sno, { size: 26 }); } },
          { t: '专家均分', w: 96, align: 'right', render: function (x) { var v = avgExpert(x); return v === null ? D.h('span.muted', '—') : KP.numCell(v, '分'); } },
          { t: '投票', w: 82, align: 'right', render: function (x) { return KP.numCell(U.num(x.votes)); } },
          { t: '综合得分', w: 100, align: 'right', render: function (x) { return KP.numCell(totalScore(x), '分', { color: '#2563eb' }); } },
          { t: '拟定奖项', w: 106, render: function (x, i) {
            var t = i === 0 ? '一等奖' : (i <= 2 ? '二等奖' : (i <= 5 ? '三等奖' : (i <= 10 ? '优秀奖' : '不获奖')));
            return x.award ? KP.status(x.award) : UI.tag(t, t === '不获奖' ? 'tag-info' : 'tag-purple');
          } },
          { t: '证书编号', w: 168, render: function (x) { return x.certNo ? D.h('span', { style: 'font-size:11.5px;font-family:ui-monospace,monospace' }, x.certNo) : D.h('span.muted', '待生成'); } }
        ],
        rows: ranked, mini: true, noCard: true,
        footNote: '共 ' + ranked.length + ' 件作品参与定奖'
      })));
      host.appendChild(D.h('div.mt12', D.h('div.req-note', '定奖后系统将为每件获奖作品生成唯一证书编号（格式 CERT-年份-序号），并同步到该活动的获奖证书数量；证书样式取活动配置的证书模板。')));
    }
    paint();
  }

  function tabAward(host) {
    var won = DB.filter('works', function (x) { return x.award; });
    var byAward = U.countBy(won, function (x) { return x.award; });
    host.appendChild(D.h('div.mt12', KP.kpis([
      { ic: '🏅', label: '已定奖作品', num: won.length, unit: '件', fg: '#d97706', bg: '#fffbeb', foot: '覆盖 ' + U.uniq(won.map(function (x) { return x.actId; })).length + ' 个活动' },
      { ic: '🥇', label: '一等奖', num: byAward['一等奖'] || 0, unit: '件', fg: '#dc2626', bg: '#fef2f2' },
      { ic: '🥈', label: '二等奖', num: byAward['二等奖'] || 0, unit: '件', fg: '#d97706', bg: '#fffbeb' },
      { ic: '🥉', label: '三等奖', num: byAward['三等奖'] || 0, unit: '件', fg: '#0891b2', bg: '#ecfeff' },
      { ic: '📜', label: '已生成证书', num: DB.count('works', function (x) { return x.certNo; }), unit: '份', fg: '#2563eb', bg: '#eff6ff' }
    ], 'g5')));
    host.appendChild(D.h('div.mt16', KP.lister({
      host: D.h('div'), title: '获奖名单与证书', sub: '共 ' + won.length + ' 件获奖作品',
      filters: function () {
        return UI.filterBar([
          { type: 'select', label: '活动', value: st.workAct, width: 230, options: actOpts(), onChange: function (v) { st.workAct = v; w.ZR.render(); } },
          { type: 'select', label: '奖项', value: st.status, options: [['', '全部奖项'], ['一等奖', '一等奖'], ['二等奖', '二等奖'], ['三等奖', '三等奖'], ['优秀奖', '优秀奖']], onChange: function (v) { st.status = v; w.ZR.render(); } }
        ]);
      },
      actions: function () {
        return [
          D.h('button.btn.btn-sm', { onclick: function () { awardModal(); } }, '🏅 重新定奖'),
          KP.exportBtn('获奖名单', [
            { t: '证书编号', k: 'certNo' }, { t: '奖项', k: 'award' }, { t: '作品标题', k: 'title' },
            { t: '活动', k: 'actTitle' }, { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' },
            { t: '学院', k: 'college' }, { t: '班级', k: 'className' }, { t: '综合得分', raw: totalScore }
          ], awardRows())
        ];
      },
      cols: [
        { t: '奖项', w: 96, render: function (x) { return UI.tag(x.award, 'tag-purple'); } },
        { t: '证书编号', w: 176, render: function (x) { return D.h('span', { style: 'font-size:11.5px;font-family:ui-monospace,monospace' }, x.certNo || '待生成'); } },
        { t: '作品 / 活动', render: function (x) { return KP.cell(x.title, x.actTitle, { clip: true }); } },
        { t: '获奖人', w: 152, render: function (x) { return KP.who(x.name, x.sno, { size: 26 }); } },
        { t: '学院 / 班级', render: function (x) { return KP.cell(x.college, x.className, { clip: true }); } },
        { t: '综合得分', w: 100, align: 'right', render: function (x) { return KP.numCell(totalScore(x), '分'); } },
        {
          t: '操作', w: 132, render: function (x) {
            return KP.acts([D.h('button.btn.btn-sm', {
              onclick: function () {
                var a = DB.get('activities', x.actId);
                var tpl = a ? DB.get('tpls', a.certTpl) : null;
                UI.printHTML('获奖证书 · ' + x.name,
                  '<div class="h1">获 奖 证 书</div>' +
                  '<div class="sub">' + DB.data.meta.school + ' · ' + DB.data.meta.term + '</div>' +
                  '<p style="font-size:15px;line-height:2.4;text-indent:2em">' +
                  U.esc(x.name) + ' 同学（学号 ' + U.esc(x.sno) + '，' + U.esc(x.college) + U.esc(x.className) + '）：<br>' +
                  '你在「' + U.esc(x.actTitle) + '」活动中提交的作品《' + U.esc(x.title) + '》，经专家评审与网络投票综合评定，荣获 <b>' + U.esc(x.award) + '</b>。</p>' +
                  '<p style="font-size:13px;color:#6b7a90">证书编号：' + U.esc(x.certNo || '—') + ' · 综合得分：' + totalScore(x) + ' 分</p>' +
                  KP.sealHTML(tpl ? tpl.seal : null));
              }
            }, '📜 证书')]);
          }
        }
      ],
      rows: function () { return awardRows(); },
      pageSize: st.ps, mini: true,
      empty: '暂无获奖作品', emptySub: '在「作品管理」中点击「按评分定奖并生成证书」'
    })));
  }

  /* ================= ⑤ 协同管理员 ================= */
  function tabAdmin(host) {
    var a = curAct() || acts()[0];
    if (!a) { host.appendChild(UI.empty('请先创建活动')); return; }
    st.actId = a.id;
    host.appendChild(UI.card({
      title: '协同管理员配置', sub: a.title,
      right: D.h('div.hd-r', {},
        UI.select({ options: actOpts(), value: a.id, onChange: function (v) { st.actId = v; w.ZR.render(); } }),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { addAdmin(a); } }, '＋ 添加协同管理员')
      ),
      body: [
        D.h('div.req-note', '主管理员拥有该活动的全部权限；协同管理员按勾选的权限范围参与活动运营（审核报名 / 导出名单 / 签到管理 / 作品评审）。权限变更即时生效并记录操作留痕。'),
        D.h('div.mt12', (a.admins || []).length ? UI.table({
          cols: [
            { t: '管理员', render: function (ad) { return KP.who(ad.name, ad.id, { size: 28 }); } },
            { t: '角色', w: 128, render: function (ad) { return UI.tag(ad.role, ad.role === '主管理员' ? 'tag-ok' : 'tag-info'); } },
            { t: '权限范围', render: function (ad) { return D.h('div.btn-row', (ad.perms || []).map(function (p) { return D.h('span.tag', p); })); } },
            {
              t: '操作', w: 200, render: function (ad) {
                return KP.acts([
                  D.h('button.btn.btn-sm', { onclick: function () { editAdmin(a, ad); } }, '编辑权限'),
                  ad.role === '主管理员' ? null : D.h('button.btn.btn-sm.btn-dan', {
                    onclick: function () {
                      UI.confirm({
                        title: '移除协同管理员', danger: true,
                        text: '确认移除「' + ad.name + '」对该活动的管理权限吗？',
                        onOk: function () {
                          DB.update('activities', a.id, { admins: (a.admins || []).filter(function (x) { return x.id !== ad.id; }) });
                          UI.toast('已移除', ad.name, 'ok'); w.ZR.render();
                        }
                      });
                    }
                  }, '移除')
                ]);
              }
            }
          ],
          rows: a.admins || [], mini: true, noCard: true,
          footNote: '共 ' + (a.admins || []).length + ' 名管理员'
        }) : UI.empty('尚未配置协同管理员', '添加后可将报名审核、签到管理等权限分派给其他老师或学生干部'))
      ]
    }));

    host.appendChild(D.h('div.mt16', UI.card({
      title: '该活动的作业入口', sub: '组织者常用操作直达',
      body: D.h('div.g4', {},
        opTile('✅', '报名审核', DB.count('enrollments', function (e) { return e.actId === a.id && e.status === '待审核'; }) + ' 条待审', '#2563eb', '#eff6ff', function () { st.tab = 'enroll'; st.actId = a.id; w.ZR.render(); }),
        opTile('📍', '签到管理', DB.count('signins', function (x) { return x.actId === a.id; }) + ' 条记录', '#0891b2', '#ecfeff', function () { st.tab = 'sign'; st.actId = a.id; w.ZR.render(); }),
        opTile('🎬', '作品评审', DB.count('works', function (x) { return x.actId === a.id; }) + ' 件作品', '#d97706', '#fffbeb', function () { st.tab = 'work'; st.workAct = a.id; w.ZR.render(); }),
        opTile('📺', '投屏签到二维码', a.status === '待开始' || a.status === '进行中' ? '活动进行中可用' : '活动未开始', '#7c3aed', '#f5f3ff', function () {
          if (w.ZSIGN) w.ZSIGN.boardModal(a);
        })
      ),
      note: '活动编号 ' + a.id + ' · 状态 ' + a.status + ' · 主办 ' + a.host
    })));

    host.appendChild(D.h('div.mt16', UI.card({
      title: '本活动数据概览', tight: true,
      body: (function () {
        var enr = DB.filter('enrollments', function (e) { return e.actId === a.id; });
        var sgn = DB.filter('signins', function (x) { return x.actId === a.id; });
        var wk = DB.filter('works', function (x) { return x.actId === a.id; });
        return D.h('div', {},
          D.h('div.g4', {},
            UI.stat({ ic: '🙋', label: '报名', num: enr.length, unit: '人次', fg: '#2563eb', bg: '#eff6ff', foot: '待审 ' + enr.filter(function (e) { return e.status === '待审核'; }).length }),
            UI.stat({ ic: '📍', label: '签到', num: sgn.filter(function (x) { return x.status !== '缺勤'; }).length, unit: '人次', fg: '#059669', bg: '#ecfdf5', foot: '缺勤 ' + sgn.filter(function (x) { return x.status === '缺勤'; }).length }),
            UI.stat({ ic: '🎬', label: '作品', num: wk.length, unit: '件', fg: '#d97706', bg: '#fffbeb', foot: '待审 ' + wk.filter(function (x) { return x.status === '待审核'; }).length }),
            UI.stat({ ic: '🎓', label: '认定学分', num: Math.round(enr.filter(function (e) { return e.status === '已通过'; }).length * U.num(a.credit) * 10) / 10, unit: '分', fg: '#7c3aed', bg: '#f5f3ff', foot: '按已通过报名计' })
          ),
          D.h('div.mt12', C.donut([
            { n: '待审核', v: enr.filter(function (e) { return e.status === '待审核'; }).length, c: '#f59e0b' },
            { n: '已通过', v: enr.filter(function (e) { return e.status === '已通过'; }).length, c: '#10b981' },
            { n: '已驳回', v: enr.filter(function (e) { return e.status === '已驳回'; }).length, c: '#ef4444' },
            { n: '已取消', v: enr.filter(function (e) { return e.status === '已取消'; }).length, c: '#94a3b8' }
          ], { size: 168, thickness: 24, centerValue: enr.length, centerLabel: '报名总数' }))
        );
      })()
    })));
  }

  function opTile(ic, label, sub, fg, bg, fn) {
    return D.h('div', {
      style: 'border:1px solid var(--line);border-radius:11px;padding:13px;display:flex;gap:11px;align-items:center;cursor:pointer',
      onmouseover: function (e) { e.currentTarget.style.borderColor = '#bfd7fb'; e.currentTarget.style.background = '#f8fbff'; },
      onmouseout: function (e) { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = ''; },
      onclick: fn
    }, UI.icoBox(ic, fg, bg, 36),
      D.h('div', { style: 'min-width:0' },
        D.h('div', { style: 'font-weight:700;font-size:13px' }, label),
        D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:2px' }, sub)));
  }

  function staffCandidates() {
    return DB.col('staff').concat(DB.col('students').filter(function (s, i) { return i % 40 === 0; }).slice(0, 12));
  }

  function addAdmin(a) {
    var cands = staffCandidates();
    var pickId = cands[0] ? cands[0].id : '';
    var perms = ['审核报名'];
    var host = D.h('div');
    function paint() {
      D.fill(host, null);
      host.appendChild(UI.field({
        label: '选择管理员', required: true,
        control: UI.select({
          options: cands.map(function (c) { return [c.id, c.name + '（' + (c.dept || c.title || c.college || '学生') + '）']; }),
          value: pickId, onChange: function (v) { pickId = v; }
        })
      }));
      host.appendChild(D.h('div.fld', { style: 'margin-top:12px' },
        D.h('label', {}, '权限范围'),
        UI.chips({
          multi: true, value: perms,
          options: ['全部权限', '审核报名', '导出名单', '签到管理', '作品评审', '通知发送'],
          onChange: function (v) { perms = v; }
        }),
        D.h('div.hint', '选择「全部权限」将获得与主管理员相同的操作能力')
      ));
    }
    paint();
    var m = UI.modal({
      title: '添加协同管理员', sub: a.title, size: 'slim', body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var u = DB.get('staff', pickId) || DB.get('students', pickId);
            if (!u) { UI.toast('请选择管理员', '', 'warn'); return; }
            if (!perms.length) { UI.toast('请至少选择一项权限', '', 'warn'); return; }
            var list = (a.admins || []).concat([{
              id: u.id, name: u.name, role: perms.indexOf('全部权限') >= 0 ? '主管理员' : '协同管理员',
              perms: perms.slice()
            }]);
            DB.update('activities', a.id, { admins: list });
            DB.insert('logs', {
              at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
              action: '添加协同管理员', module: '活动管理', target: a.id, ip: '10.16.1.101',
              result: '成功', detail: u.name + ' · ' + perms.join('/')
            });
            UI.toast('已添加协同管理员', u.name + ' · ' + perms.join('/'), 'ok');
            m.close(); w.ZR.render();
          }
        }, '确认添加')
      ]
    });
  }

  function editAdmin(a, ad) {
    var perms = (ad.perms || []).slice();
    var role = ad.role;
    var host = D.h('div', {},
      UI.field({ label: '角色', required: true, control: UI.select({ options: [['主管理员', '主管理员'], ['协同管理员', '协同管理员']], value: role, onChange: function (v) { role = v; } }) }),
      D.h('div.fld', { style: 'margin-top:12px' },
        D.h('label', {}, '权限范围'),
        UI.chips({ multi: true, value: perms, options: ['全部权限', '审核报名', '导出名单', '签到管理', '作品评审', '通知发送'], onChange: function (v) { perms = v; } }))
    );
    var m = UI.modal({
      title: '编辑管理员权限 · ' + ad.name, size: 'slim', body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var list = (a.admins || []).map(function (x) {
              return x.id === ad.id ? { id: x.id, name: x.name, role: role, perms: perms.slice() } : x;
            });
            DB.update('activities', a.id, { admins: list });
            UI.toast('权限已更新', ad.name + ' · ' + perms.join('/'), 'ok');
            m.close(); w.ZR.render();
          }
        }, '保存')
      ]
    });
  }

  /* ================= 渲染 ================= */
  function render(host) {
    var TABS = [
      { k: 'enroll', n: '报名管理', cnt: DB.count('enrollments', function (e) { return KP.inScope(e) && e.status === '待审核'; }) },
      { k: 'sign', n: '签到管理', cnt: signinRows().length },
      { k: 'work', n: '作品管理', cnt: DB.count('works', function (x) { return KP.inScope(x) && x.status === '待审核'; }) },
      { k: 'award', n: '获奖与证书', cnt: DB.count('works', function (x) { return x.award; }) },
      { k: 'admin', n: '协同管理员' }
    ];
    if (TABS.every(function (t) { return t.k !== st.tab; })) st.tab = 'enroll';

    host.appendChild(UI.pageHd({
      crumb: '<b>活动运营</b> / 活动管理',
      title: '活动管理',
      desc: '报名审核 · 签到考勤 · 作品评审 · 定奖发证 · 协同管理员 · 数据范围：' + ZA.scopeText(),
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('act'); } }, '第二课堂活动'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('square'); } }, '活动广场'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZR.go('rule'); } }, '活动规则设置')
      ]
    }));

    host.appendChild(D.h('div.mt16', KP.kpis([
      { ic: '📋', label: '活动总数', num: acts().length, unit: '个', fg: '#2563eb', bg: '#eff6ff', foot: '已发布 ' + KP.pubList(acts()).length + ' 个' },
      { ic: '🙋', label: '报名总量', num: enrollRows().length, unit: '人次', fg: '#0891b2', bg: '#ecfeff', foot: '待审核 ' + DB.count('enrollments', function (e) { return KP.inScope(e) && e.status === '待审核'; }) },
      { ic: '📍', label: '签到记录', num: signinRows().length, unit: '条', fg: '#059669', bg: '#ecfdf5', foot: '缺勤 ' + DB.count('signins', function (x) { return x.status === '缺勤'; }) + ' 条' },
      { ic: '🎬', label: '作品总数', num: KP.scopeFilter(DB.col('works')).length, unit: '件', fg: '#d97706', bg: '#fffbeb', foot: '获奖 ' + DB.count('works', function (x) { return x.award; }) + ' 件' },
      { ic: '🚫', label: '黑名单在册', num: DB.count('blacklist', function (b) { return b.active; }), unit: '人', fg: '#dc2626', bg: '#fef2f2', foot: '30 天自动解除' }
    ], 'g5')));

    /* ============ 数据流转链路（选中某个活动时显示，用于演示「数据怎么流」） ============
       把「活动 → 报名 → 审核 → 签到 → 认定赋分」这条链上的真实条数一次列全，
       演示时无需逐个模块翻数据即可说明数据已经贯通。 */
    var flowAct = curAct();
    if (flowAct) {
      var enrList = DB.filter('enrollments', function (e) { return e.actId === flowAct.id; });
      var passList = enrList.filter(function (e) { return e.status === '已通过'; });
      var signedList = enrList.filter(function (e) { return e.signStatus === '已签到'; });
      var recList = DB.filter('scoreRecs', function (r) { return r.actId === flowAct.id; });
      var credited = U.uniq(recList.map(function (r) { return r.studentId; })).length;
      var steps = [
        { n: '活动已发布', v: flowAct.status, unit: '', ic: '🎯', ok: KP.isPub(flowAct) },
        { n: '学生报名', v: enrList.length, unit: '人次', ic: '🙋', ok: enrList.length > 0 },
        { n: '报名审核通过', v: passList.length, unit: '人次', ic: '✅', ok: passList.length > 0 },
        { n: '完成签到', v: signedList.length, unit: '人次', ic: '📍', ok: signedList.length > 0 },
        { n: '生成成绩认定', v: credited, unit: '人', ic: '🎓', ok: credited > 0 }
      ];
      host.appendChild(D.h('div.mt16', UI.card({
        title: '数据流转链路 · ' + shortTitle(flowAct),
        sub: '该活动从发布到赋分的真实数据条数（随业务操作实时变化）',
        right: D.h('div', { style: 'display:flex;gap:8px' },
          D.h('button.btn.btn-sm', { onclick: function () { st.actId = ''; w.ZR.render(); } }, '查看全部活动'),
          D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('grade'); } }, '去成绩管理')),
        body: D.h('div', { style: 'display:flex;align-items:stretch;gap:0;flex-wrap:wrap' },
          steps.map(function (s, i) {
            return [
              D.h('div', {
                style: 'flex:1 1 132px;min-width:132px;border:1px solid ' + (s.ok ? '#bfd7fb' : 'var(--line)') +
                  ';border-radius:10px;padding:11px 12px;margin-right:8px;background:' + (s.ok ? '#f5f9ff' : '#fbfcfe')
              },
                D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, s.ic + ' ' + s.n),
                D.h('div', { style: 'font-size:19px;font-weight:750;margin-top:4px;color:' + (s.ok ? 'var(--primary)' : 'var(--text3)') },
                  typeof s.v === 'number' ? U.fmt(s.v) : s.v,
                  s.unit ? D.h('i', { style: 'font-style:normal;font-size:11px;color:var(--text3);margin-left:2px' }, s.unit) : null)),
              i < steps.length - 1 ? D.h('div', {
                style: 'align-self:center;color:#c7d7ee;font-size:16px;margin-right:8px'
              }, '→') : null
            ];
          })),
        note: D.h('span.muted', credited
          ? '已为 ' + credited + ' 名学生生成成绩认定记录，可在「成绩管理」「我的成绩单」「统计分析」中看到同一份数据。'
          : '完成报名审核与签到后，组织者提交考核结果即会自动生成成绩认定记录。')
      })));
    }

    var tabHost = D.h('div.mt16');
    var bodyHost = D.h('div.mt12');
    D.fill(tabHost, UI.tabs({ items: TABS, cur: st.tab, onChange: function (k) { st.tab = k; st.page = 1; st.sel = {}; w.ZR.render(); } }));
    host.appendChild(tabHost);
    host.appendChild(bodyHost);
    if (st.tab === 'enroll') tabEnroll(bodyHost);
    if (st.tab === 'sign') tabSign(bodyHost);
    if (st.tab === 'work') tabWork(bodyHost);
    if (st.tab === 'award') tabAward(bodyHost);
    if (st.tab === 'admin') tabAdmin(bodyHost);
  }

  w.ZKP.pages({
    actmgr: {
      title: '活动管理', group: '活动运营',
      render: render
    }
  });
})(window);
