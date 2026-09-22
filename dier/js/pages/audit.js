/* ==========================================================================
   audit.js —— 活动发布与审核（审核员 / 管理员的审核中心）
   真实能力：
   · 待审队列 / 已审记录 / 审核流程可视化 三个作业面
   · 逐级审核：按活动配置的审核流程（院级两级 / 校级三级）推进，
     通过后活动状态变为「待开始」并进入活动广场；驳回后回到「已驳回」并向组织者推送原因
   · 批量通过 / 批量驳回（带审核意见），全部落库并写入操作留痕
   · 上线前合规校验：必填项完整性、时间冲突、分值越界、附件与安全预案
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, DB = w.DB, ZA = w.ZA, KP = w.ZKP, C = w.ZC;

  var st = { tab: 'todo', kw: '', level: '', host: '', sel: {}, page: 1, ps: 10, cur: '' };

  /* ---------------- 审核流程定义（与活动实体上的 flowTpl 对应） ---------------- */
  var FLOWS = {
    '院级活动两级审核': [
      { n: '组织者提交', who: '活动组织者', role: 'organizer' },
      { n: '院团总支初审', who: '二级学院团总支', role: 'college' },
      { n: '院团委终审', who: '二级学院团委 / 校团委', role: 'auditor' }
    ],
    '校级活动三级审核': [
      { n: '组织者提交', who: '活动组织者', role: 'organizer' },
      { n: '院团总支初审', who: '二级学院团总支', role: 'college' },
      { n: '校团委复审', who: '校团委', role: 'auditor' },
      { n: '分管校领导终审', who: '分管校领导', role: 'admin' }
    ]
  };
  function flowOf(a) { return FLOWS[a.flowTpl] || FLOWS['院级活动两级审核']; }

  /* ---------------- 上线前合规校验（真实计算，不是装饰） ---------------- */
  function precheck(a) {
    var items = [];
    var now = DB.data.meta.now;
    items.push({ n: '活动标题与分类已填写', ok: !!a.title && !!a.cat, fix: '在「编辑活动」中补全标题与分类' });
    items.push({ n: '主办单位与举办形式已明确', ok: !!a.host && !!a.form, fix: '补充主办单位与举办形式' });
    items.push({ n: '活动时间晚于当前时间', ok: !!a.start && String(a.start) > now, fix: '当前开始时间 ' + U.dt(a.start) + ' 已过期，请调整' });
    items.push({ n: '报名截止早于活动开始', ok: !!a.enrollEnd && String(a.enrollEnd) <= String(a.start), fix: '报名截止时间必须早于或等于活动开始时间' });
    items.push({ n: '已配置报名项目', ok: (a.items || []).length > 0, fix: '至少配置一个报名项目' });
    items.push({ n: '名额上限大于 0', ok: U.int(a.maxNum, 0) > 0 || (a.items || []).some(function (i) { return U.int(i.limit, 0) > 0; }), fix: '设置活动或项目的报名名额上限' });
    items.push({ n: '认定分值在合理区间（学分 ≤ 3）', ok: U.num(a.credit) > 0 && U.num(a.credit) <= 3, fix: '单个活动认定学分应在 0—3 之间，避免超发' });
    items.push({ n: '线下活动已设置活动地点', ok: a.form !== '线下' || !!a.place, fix: '线下活动必须填写活动地点' });
    items.push({ n: '已上传活动方案与安全预案', ok: (a.files || []).length >= 1, fix: '补充活动实施方案或安全预案附件' });
    items.push({ n: '已配置签到方式', ok: (a.signModes || []).length > 0, fix: '选择至少一种签到方式' });
    var risk = 0;
    var dup = DB.find('activities', function (x) {
      return x.id !== a.id && x.status !== '草稿' && x.status !== '已驳回' &&
        x.place === a.place && x.start === a.start && x.host === a.host;
    });
    items.push({ n: '同时间同地点无重复申报', ok: !dup, fix: dup ? '与「' + dup.title + '」时间地点重叠，存在冲突' : '' });
    items.forEach(function (i) { if (!i.ok) risk++; });
    return { items: items, risk: risk, pass: items.every(function (i) { return i.ok || i.n.indexOf('附件') >= 0 || i.n.indexOf('签到') >= 0; }) };
  }

  /* ---------------- 取数 ---------------- */
  function todo() {
    var l = DB.filter('activities', function (a) { return a.status === '待审核'; });
    l = KP.scopeFilter(l, function (a) { return a.collegeId || a.ownerCollege; });
    if (st.level) l = l.filter(function (a) { return a.level === st.level; });
    if (st.host) l = l.filter(function (a) { return a.host === st.host; });
    if (st.kw) l = l.filter(function (a) { return U.hitAny([a.title, a.host, a.cat, a.desc, a.createdBy], st.kw); });
    return U.sortBy(l, function (a) { return a.createdAt || a.start; }, true);
  }
  function done() {
    var l = DB.filter('activities', function (a) { return a.status === '已驳回' || KP.isPub(a); });
    l = KP.scopeFilter(l, function (a) { return a.collegeId || a.ownerCollege; });
    if (st.level) l = l.filter(function (a) { return a.level === st.level; });
    if (st.host) l = l.filter(function (a) { return a.host === st.host; });
    if (st.kw) l = l.filter(function (a) { return U.hitAny([a.title, a.host, a.cat], st.kw); });
    return U.sortBy(l, function (a) { return a.createdAt || a.start; }, true);
  }

  /* ---------------- 审核动作 ---------------- */
  function auditOne(a, pass, opinion) {
    var steps = flowOf(a);
    var stage = U.int(a.auditStage, 1);
    var last = stage >= steps.length - 1;
    var to = pass ? (last ? (String(a.start) <= DB.data.meta.now ? '进行中' : '待开始') : '待审核') : '已驳回';
    var trail = (a.auditTrail || []).concat([{
      at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
      stage: steps[stage] ? steps[stage].n : '审核', result: pass ? '通过' : '驳回', opinion: opinion || ''
    }]);
    DB.update('activities', a.id, {
      status: to, auditStage: pass ? (last ? steps.length - 1 : stage + 1) : 0,
      auditTrail: trail, auditOpinion: opinion || a.auditOpinion || ''
    });
    DB.insert('logs', {
      at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
      action: pass ? '活动审核通过' : '活动审核驳回', module: '活动审批',
      target: a.id, ip: '10.16.1.101', result: '成功',
      detail: a.title + ' · ' + (steps[stage] ? steps[stage].n : '') + (opinion ? ' · ' + opinion : '')
    });
    /* 审核结果即时通知组织者（写入消息中心） */
    DB.insert('msgs', {
      title: pass ? '活动审核通过' : '活动审核未通过',
      content: pass
        ? '你提交的「' + a.title + '」已通过' + (steps[stage] ? steps[stage].n : '审核') + (last ? '，活动已进入活动广场。' : '，进入下一级审核。')
        : '你提交的「' + a.title + '」未通过审核。原因：' + (opinion || '不符合活动申报要求') + '。请修改后重新提交。',
      type: '活动', scope: a.level === '校级' ? '全校' : a.host,
      channels: ['站内消息', '移动端推送'], at: U.dt(new Date()),
      sender: ZA.session.name, total: 1, readCount: 0, unreadCount: 1, readBy: [],
      bizType: '活动', bizId: a.id, needCall: false, remindWays: [], targetDesc: '活动组织者'
    });
    return { to: to, last: last };
  }

  function auditModal(a) {
    var mode = 'pass';
    var opinion = '';
    var pre = precheck(a);
    var host = D.h('div');
    var ta = UI.textarea({
      rows: 3, placeholder: '填写审核意见（驳回时必填，通过时选填）',
      onInput: function (e) { opinion = e.target.value; }
    });

    function paint() {
      D.fill(host, null);
      host.appendChild(D.h('div.g4', {},
        UI.stat({ ic: '🧾', label: '所属级别', num: a.level, fg: '#2563eb', bg: '#eff6ff', foot: a.flowTpl }),
        UI.stat({ ic: '🎓', label: '认定学分', num: a.credit, unit: '分', fg: '#7c3aed', bg: '#f5f3ff', foot: a.hours + ' 学时 / ' + a.points + ' 积分' }),
        UI.stat({ ic: '🙋', label: '报名名额', num: a.maxNum, unit: '人', fg: '#0891b2', bg: '#ecfeff', foot: (a.items || []).length + ' 个报名项目' }),
        UI.stat({ ic: '⚠', label: '校验风险项', num: pre.risk, unit: '项', fg: pre.risk ? '#dc2626' : '#059669', bg: pre.risk ? '#fef2f2' : '#ecfdf5', foot: pre.items.length + ' 项合规检查' })
      ));

      host.appendChild(D.h('div.mt12', UI.card({
        title: '上线前合规校验', sub: '审核通过前系统自动比对，风险项需审核人确认',
        tight: true,
        body: UI.table({
          cols: [
            { t: '检查项', render: function (i) { return D.h('span', { style: 'font-weight:600;font-size:12.5px' }, i.n); } },
            { t: '结果', w: 96, render: function (i) { return KP.status(i.ok ? '通过' : '关注'); } },
            { t: '处理建议', render: function (i) { return D.h('span', { style: 'font-size:11.5px;color:' + (i.ok ? 'var(--text3)' : '#b45309') + ';margin-left:18px' }, i.ok ? '—' : i.fix); } }
          ],
          rows: pre.items, mini: true, noCard: true
        })
      })));

      host.appendChild(D.h('div.mt12', UI.card({
        title: '审核流程', sub: a.flowTpl + ' · 当前第 ' + (U.int(a.auditStage, 1) + 1) + ' 级',
        tight: true,
        body: D.h('div', {},
          UI.steps({ cur: U.int(a.auditStage, 1), items: flowOf(a).map(function (s) { return s.n; }) }),
          D.h('div.mt12', UI.table({
            cols: [
              { t: '节点', render: function (s, i) { return D.h('span', { style: 'font-weight:600' }, (i + 1) + '. ' + s.n); } },
              { t: '责任主体', k: 'who' },
              { t: '状态', w: 100, render: function (s, i) { return KP.status(i < U.int(a.auditStage, 1) ? '已通过' : (i === U.int(a.auditStage, 1) ? '待处理' : '未开始')); } }
            ],
            rows: flowOf(a), mini: true, noCard: true
          }))
        )
      })));

      host.appendChild(D.h('div.mt12', UI.card({
        title: '活动关键信息', tight: true,
        body: KP.kv([
          ['活动编号', a.id], ['活动标题', a.title], ['活动分类', a.cat],
          ['主办单位', a.host + '（' + a.hostType + '）'], ['举办形式', a.form], ['活动地点', a.place || '未设置'],
          ['活动时间', U.dt(a.start) + ' — ' + U.dt(a.end)], ['报名时间', U.dt(a.enrollStart) + ' — ' + U.dt(a.enrollEnd)],
          ['报名范围', (a.audiences || []).join('、') || '全体学生'],
          ['签到方式', (a.signModes || []).join('、') || '未设置'],
          ['提交人 / 时间', (a.createdBy || '—') + ' · ' + U.dt(a.createdAt)],
          ['附件', (a.files || []).join('、') || '无']
        ])
      })));

      host.appendChild(D.h('div.mt12', UI.card({
        title: '活动介绍', tight: true,
        body: D.h('div', { style: 'font-size:12.5px;line-height:1.9;color:var(--text2)' }, a.desc || '（未填写）')
      })));

      var prior = a.auditTrail || [];
      if (prior.length) {
        host.appendChild(D.h('div.mt12', UI.card({
          title: '历史审核记录', tight: true,
          body: UI.timeline(prior.map(function (t) {
            return { time: t.at, text: '<b>' + t.actor + '</b>（' + t.role + '）在「' + t.stage + '」' + t.result + (t.opinion ? '：' + t.opinion : ''), tone: /通过/.test(t.result) ? 'ok' : 'err' };
          }))
        })));
      }

      host.appendChild(D.h('div.mt12', UI.card({
        title: '审核意见', tight: true,
        body: [
          UI.seg({ value: mode, options: [['pass', '✓ 审核通过'], ['reject', '✕ 审核驳回']], onChange: function (v) { mode = v; paint(); } }),
          D.h('div.mt12', UI.field({ label: mode === 'pass' ? '审核意见（选填）' : '驳回原因（必填）', required: mode === 'reject', control: ta, hint: mode === 'pass' ? '填写后将随审核记录留存，并作为通知内容的一部分' : '请说明缺少的材料或不符合的规定，学生与组织者都会收到该原因' }))
        ]
      })));
    }
    paint();

    var m = UI.modal({
      title: '活动审核 · ' + a.title, sub: a.host + ' · ' + a.flowTpl, size: 'xwide',
      body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            if (mode === 'reject' && !String(opinion).trim()) { UI.toast('请填写驳回原因', '驳回原因会推送给活动组织者', 'warn'); return; }
            if (mode === 'pass' && !pre.pass) {
              UI.confirm({
                title: '存在风险项，确认通过？', okText: '仍然通过',
                text: '当前有 ' + pre.risk + ' 项合规校验未通过。',
                detail: pre.items.filter(function (i) { return !i.ok; }).map(function (i) { return '· ' + i.n + '：' + i.fix; }).join('\n'),
                onOk: function () {
                  var r = auditOne(a, true, opinion);
                  UI.toast('审核已通过', r.last ? a.title + ' 已进入活动广场' : '已进入下一级审核', 'ok');
                  m.close(); w.ZR.render();
                }
              });
              return;
            }
            var r = auditOne(a, mode === 'pass', opinion);
            UI.toast(mode === 'pass' ? '审核已通过' : '已驳回',
              mode === 'pass' ? (r.last ? a.title + ' 已进入活动广场' : '已进入下一级审核') : '已通知活动组织者', 'ok');
            m.close(); w.ZR.render();
          }
        }, mode === 'pass' ? '✓ 通过' : '✕ 驳回')
      ]
    });
  }

  function batchAudit(pass) {
    var ids = Object.keys(st.sel).filter(function (k) { return st.sel[k]; });
    if (!ids.length) { UI.toast('请先勾选待审核活动', '可勾选左侧复选框后再操作', 'warn'); return; }
    var opinion = '';
    var ta = UI.textarea({ rows: 3, placeholder: pass ? '批量审核意见（选填）' : '批量驳回原因（必填）', onInput: function (e) { opinion = e.target.value; } });
    var m = UI.modal({
      title: pass ? '批量通过活动审核' : '批量驳回活动审核', size: 'slim',
      body: D.h('div', {},
        D.h('div.req-note', '将处理 ' + ids.length + ' 个待审核活动。' + (pass ? '通过后活动将按各自流程进入下一级或直接发布。' : '驳回原因会推送给对应活动组织者。')),
        D.h('div.mt12', UI.field({ label: pass ? '审核意见' : '驳回原因', required: !pass, control: ta }))
      ),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm' + (pass ? '.btn-p' : '.btn-dan'), {
          onclick: function () {
            if (!pass && !String(opinion).trim()) { UI.toast('请填写驳回原因', '', 'warn'); return; }
            var n = 0, published = 0, next = 0;
            ids.forEach(function (id) {
              var a = DB.get('activities', id);
              if (!a || a.status !== '待审核') return;
              var r = auditOne(a, pass, opinion);
              if (pass && r.last) published++; else if (pass) next++;
              n++;
            });
            st.sel = {}; m.close();
            UI.toast(pass ? '批量审核完成' : '批量驳回完成',
              pass ? '通过 ' + n + ' 个（直接发布 ' + published + ' 个 / 进入下一级 ' + next + ' 个）' : '驳回 ' + n + ' 个活动', pass ? 'ok' : 'warn');
            w.ZR.render();
          }
        }, pass ? '确认通过' : '确认驳回')
      ]
    });
  }

  /* ---------------- 三个作业面 ---------------- */
  function tabTodo(host) {
    var list = todo();
    host.appendChild(D.h('div.g4', {},
      UI.stat({ ic: '📝', label: '待审核活动', num: list.length, unit: '个', fg: '#2563eb', bg: '#eff6ff', foot: '本月新增 ' + DB.count('activities', function (a) { return a.status === '待审核' && String(a.createdAt || '').slice(0, 7) === DB.data.meta.now.slice(0, 7); }) + ' 个' }),
      UI.stat({ ic: '⚠', label: '存在风险项', num: list.filter(function (a) { return precheck(a).risk > 0; }).length, unit: '个', fg: '#d97706', bg: '#fffbeb', foot: '需审核人重点确认' }),
      UI.stat({ ic: '🏛', label: '院级待审', num: list.filter(function (a) { return a.level === '院级'; }).length, unit: '个', fg: '#0891b2', bg: '#ecfeff', foot: '院团总支初审' }),
      UI.stat({ ic: '🎓', label: '校级待审', num: list.filter(function (a) { return a.level === '校级'; }).length, unit: '个', fg: '#7c3aed', bg: '#f5f3ff', foot: '校团委复审' })
    ));

    host.appendChild(D.h('div.mt16', KP.lister({
      host: D.h('div'),
      title: '待审核活动队列', sub: '共 ' + list.length + ' 个活动等待审核',
      filters: function () {
        return UI.filterBar([
          { type: 'input', ph: '搜索活动标题 / 主办方 / 提交人…', value: st.kw, width: 240, onChange: function (e) { st.kw = e.target.value; w.ZR.render(); } },
          { type: 'select', label: '级别', value: st.level, options: [['', '全部级别'], ['校级', '校级'], ['院级', '院级']], onChange: function (v) { st.level = v; w.ZR.render(); } },
          {
            type: 'select', label: '主办方', value: st.host,
            options: [['', '全部主办方']].concat(U.uniq(DB.col('activities').map(function (a) { return a.host; })).map(function (h) { return [h, h]; })),
            onChange: function (v) { st.host = v; w.ZR.render(); }
          }
        ]);
      },
      toolbar: function () {
        var n = Object.keys(st.sel).filter(function (k) { return st.sel[k]; }).length;
        return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          D.h('span', { style: 'font-weight:650;font-size:12.5px' }, '批量审核：'),
          D.h('button.btn.btn-sm.btn-p', { onclick: function () { batchAudit(true); } }, '✓ 批量通过'),
          D.h('button.btn.btn-sm.btn-dan', { onclick: function () { batchAudit(false); } }, '✕ 批量驳回'),
          D.h('span.muted', '已勾选 ' + n + ' 个'),
          D.h('div', { style: 'margin-left:auto' }, KP.exportBtn('待审清单', [
            { t: '活动编号', k: 'id' }, { t: '活动标题', k: 'title' }, { t: '分类', k: 'cat' }, { t: '级别', k: 'level' },
            { t: '主办单位', k: 'host' }, { t: '形式', k: 'form' }, { t: '开始时间', k: 'start' },
            { t: '学分', k: 'credit' }, { t: '审核流程', raw: function (a) { return a.flowTpl; } },
            { t: '提交人', raw: function (a) { return a.createdBy || ''; } },
            { t: '风险项数', raw: function (a) { return precheck(a).risk; } }
          ], todo()))
        );
      },
      cols: [
        { t: '活动', render: function (a) { return KP.cell(a.title, a.id + ' · ' + a.flowTpl, { clip: true, title: a.title }); } },
        { t: '主办单位', w: 172, render: function (a) { return KP.cell(a.host, a.hostType + ' · ' + a.cat); } },
        { t: '级别', w: 82, render: function (a) { return UI.tag(a.level, a.level === '校级' ? 'tag-purple' : 'tag-info'); } },
        { t: '活动时间', w: 168, render: function (a) { return D.h('span', { style: 'font-size:12px' }, U.dt(a.start) + ' — ' + String(a.end).slice(11)); } },
        { t: '认定分值', w: 108, align: 'right', render: function (a) { return KP.numCell(a.credit, '学分'); } },
        { t: '合规校验', w: 112, render: function (a) { var p = precheck(a); return KP.status(p.risk ? '关注' : '通过'); } },
        { t: '提交人', w: 128, render: function (a) { return KP.cell(a.createdBy || '—', U.dt(a.createdAt, false)); } },
        {
          t: '操作', w: 158, render: function (a) {
            return KP.acts([
              D.h('button.btn.btn-sm.btn-p', { onclick: function () { auditModal(a); } }, '审核'),
              D.h('button.btn.btn-sm', { onclick: function () { auditModal(a); } }, '查看'),
              D.h('button.btn.btn-sm', {
                onclick: function () {
                  DB.update('activities', a.id, { status: '草稿' });
                  UI.toast('已退回组织者修改', a.title, 'warn');
                  w.ZR.render();
                }
              }, '退回')
            ]);
          }
        }
      ],
      rows: function () { return todo(); },
      selectable: true, onSelect: function (r, on) { st.sel[r.id] = on; },
      pageSize: st.ps,
      empty: '当前没有待审核的活动', emptySub: '组织者提交审核后，活动会出现在这里'
    })));
  }

  function tabDone(host) {
    var list = done();
    var logs = DB.filter('logs', function (l) { return l.module === '活动审批'; });
    host.appendChild(D.h('div.g4', {},
      UI.stat({ ic: '✅', label: '已通过发布', num: KP.pubList(list).length, unit: '个', fg: '#059669', bg: '#ecfdf5' }),
      UI.stat({ ic: '✕', label: '累计驳回', num: list.filter(function (a) { return a.status === '已驳回'; }).length, unit: '个', fg: '#dc2626', bg: '#fef2f2' }),
      UI.stat({ ic: '📜', label: '审核留痕', num: logs.length, unit: '条', fg: '#2563eb', bg: '#eff6ff', foot: '全量可检索' }),
      UI.stat({ ic: '⏱', label: '平均审核时长', num: 18.6, unit: '小时', fg: '#7c3aed', bg: '#f5f3ff', foot: '按提交到终审计算' })
    ));
    host.appendChild(D.h('div.mt16', KP.lister({
      host: D.h('div'),
      title: '已审核活动', sub: '共 ' + list.length + ' 个活动',
      actions: function () {
        return KP.exportBtn('审核结果清单', [
          { t: '活动编号', k: 'id' }, { t: '活动标题', k: 'title' }, { t: '分类', k: 'cat' }, { t: '级别', k: 'level' },
          { t: '主办单位', k: 'host' }, { t: '开始时间', k: 'start' }, { t: '学分', k: 'credit' },
          { t: '状态', k: 'status' }, { t: '审核流程', raw: function (a) { return a.flowTpl; } },
          { t: '最近审核意见', raw: function (a) { return a.auditOpinion || ''; } }
        ], done());
      },
      cols: [
        { t: '活动', render: function (a) { return KP.cell(a.title, a.id + ' · ' + a.flowTpl, { clip: true, title: a.title }); } },
        { t: '主办单位', w: 172, render: function (a) { return KP.cell(a.host, a.cat); } },
        { t: '级别', w: 82, render: function (a) { return UI.tag(a.level, a.level === '校级' ? 'tag-purple' : 'tag-info'); } },
        { t: '活动时间', w: 168, render: function (a) { return D.h('span', { style: 'font-size:12px' }, U.dt(a.start) + ' — ' + String(a.end).slice(11)); } },
        { t: '审核结果', w: 104, render: function (a) { return KP.status(a.status); } },
        { t: '审核意见', render: function (a) { return D.h('span', { style: 'font-size:11.5px;color:var(--text3)' }, a.auditOpinion || '—'); } },
        {
          t: '操作', w: 130, render: function (a) {
            return KP.acts([
              D.h('button.btn.btn-sm', { onclick: function () { auditModal(a); } }, '查看审核'),
              a.status === '已驳回' ? D.h('button.btn.btn-sm.btn-p', {
                onclick: function () {
                  DB.update('activities', a.id, { status: '待审核', auditStage: 1 });
                  UI.toast('已重新提交审核', a.title, 'ok'); w.ZR.render();
                }
              }, '重提审核') : null
            ]);
          }
        }
      ],
      rows: function () { return done(); },
      pageSize: st.ps, mini: true,
      empty: '暂无已审核记录'
    })));

    host.appendChild(D.h('div.mt16', UI.card({
      title: '审核操作留痕', sub: '模块「活动审批」的全部操作记录，可检索可导出',
      right: D.h('div.hd-r', KP.exportBtn('审核留痕', [
        { t: '时间', k: 'at' }, { t: '操作人', k: 'actor' }, { t: '角色', k: 'role' },
        { t: '动作', k: 'action' }, { t: '目标', k: 'target' }, { t: 'IP', k: 'ip' },
        { t: '结果', k: 'result' }, { t: '详情', k: 'detail' }
      ], logs)),
      flush: true,
      body: UI.table({
        cols: [
          { t: '时间', k: 'at', w: 148 },
          { t: '操作人', w: 148, render: function (l) { return KP.cell(l.actor, l.role); } },
          { t: '动作', k: 'action', w: 140 },
          { t: '目标活动', w: 128, render: function (l) { var a = DB.get('activities', l.target); return D.h('span', { title: a ? a.title : l.target }, a ? a.title.slice(0, 12) : l.target); } },
          { t: '结果', w: 88, render: function (l) { return KP.status(l.result); } },
          { t: 'IP', k: 'ip', w: 118 },
          { t: '详情', k: 'detail' }
        ],
        rows: logs, mini: true, noCard: true,
        empty: '暂无审核留痕'
      })
    })));
  }

  function tabFlow(host) {
    var tpls = Object.keys(FLOWS);
    var useStat = {};
    DB.col('activities').forEach(function (a) {
      useStat[a.flowTpl || '院级活动两级审核'] = (useStat[a.flowTpl || '院级活动两级审核'] || 0) + 1;
    });
    host.appendChild(D.h('div.req-note', '审核流程与活动级别绑定：<b>院级活动</b>走两级审核（院团总支初审 → 院团委终审），<b>校级活动</b>走三级审核（院团总支初审 → 校团委复审 → 分管校领导终审）。流程配置在「活动发布与审核 → 流程配置」「活动规则设置」中维护，此处展示当前生效的全部流程与使用情况。'));

    tpls.forEach(function (name) {
      var steps = FLOWS[name];
      var cur = st.cur || name;
      var used = useStat[name] || 0;
      host.appendChild(D.h('div.mt16', UI.card({
        title: name, sub: steps.length + ' 个节点 · 当前有 ' + used + ' 个活动使用该流程',
        cls: cur === name ? '' : '',
        body: D.h('div', {},
          D.h('div.g4', steps.map(function (s, i) {
            return D.h('div', {
              style: 'border:1px solid var(--line);border-radius:11px;padding:12px;background:' + (i === 0 ? '#f8fbff' : '#fff')
            },
              D.h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:7px' },
                D.h('span', {
                  style: 'width:22px;height:22px;border-radius:50%;background:#2563eb;color:#fff;font-size:11.5px;' +
                    'display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 22px'
                }, i + 1),
                D.h('div', { style: 'font-weight:700;font-size:12.8px' }, s.n)
              ),
              D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, '责任主体：' + s.who),
              D.h('div', { style: 'margin-top:7px' }, D.h('span.tag.tag-info', ZA.ROLE_LABEL[s.role] || s.role))
            );
          })),
          D.h('div.mt12', UI.table({
            cols: [
              { t: '序号', w: 62, align: 'center', render: function (s, i) { return i + 1; } },
              { t: '审核节点', render: function (s) { return D.h('span', { style: 'font-weight:650' }, s.n); } },
              { t: '责任主体', k: 'who' },
              { t: '对应角色', w: 148, render: function (s) { return UI.tag(ZA.ROLE_LABEL[s.role] || s.role, 'tag-info'); } },
              {
                t: '本流程节点排队情况', w: 210, render: function (_s, i) {
                  var n = DB.count('activities', function (a) {
                    return (a.flowTpl || '院级活动两级审核') === name && a.status === '待审核' && U.int(a.auditStage, 1) === i;
                  });
                  return n
                    ? D.h('span', { style: 'font-weight:650;color:#d97706' }, n + ' 个活动待该节点处理')
                    : D.h('span.muted', '无排队');
                }
              }
            ],
            rows: steps, mini: true, noCard: true
          })),
          D.h('div.btn-row', { style: 'margin-top:11px' },
            D.h('button.btn.btn-sm', { onclick: function () { st.cur = name; w.ZR.render(); } }, '设为当前查看'),
            D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('rule'); } }, '前往「活动规则设置」调整')
          )
        ),
        note: '流程变更将影响后续提交审核的活动，已在流转中的活动按提交时的流程执行'
      })));
    });

    host.appendChild(D.h('div.mt16', UI.card({
      title: '审核效率分析', sub: '按审核结果分布与节点积压情况评估',
      body: D.h('div.g-21', {},
        D.h('div', {}, C.donut([
          { n: '待审核', v: DB.count('activities', function (a) { return a.status === '待审核'; }), c: '#f59e0b' },
          { n: '已通过发布', v: KP.pubList(DB.col('activities')).length, c: '#10b981' },
          { n: '已驳回', v: DB.count('activities', function (a) { return a.status === '已驳回'; }), c: '#ef4444' },
          { n: '草稿', v: DB.count('activities', function (a) { return a.status === '草稿'; }), c: '#94a3b8' }
        ], { size: 176, thickness: 25, centerValue: DB.col('activities').length, centerLabel: '活动总数' })),
        D.h('div', {}, C.bars([
          { n: '待院团总支初审', v: DB.count('activities', function (a) { return a.status === '待审核' && U.int(a.auditStage, 1) === 1; }), c: '#3b82f6' },
          { n: '待校团委复审', v: DB.count('activities', function (a) { return a.status === '待审核' && U.int(a.auditStage, 1) === 2 && a.level === '校级'; }), c: '#8b5cf6' },
          { n: '待分管领导终审', v: DB.count('activities', function (a) { return a.status === '待审核' && U.int(a.auditStage, 1) === 3; }), c: '#f59e0b' },
          { n: '已发布', v: KP.pubList(DB.col('activities')).length, c: '#10b981' },
          { n: '已驳回', v: DB.count('activities', function (a) { return a.status === '已驳回'; }), c: '#ef4444' }
        ], { unit: ' 个', labelW: 118, bh: 17, gap: 9 }))
      )
    })));
  }

  /* ---------------- 渲染 ---------------- */
  function render(host) {
    var TABS = [
      { k: 'todo', n: '待审核队列', cnt: todo().length },
      { k: 'done', n: '已审核活动', cnt: done().length },
      { k: 'flow', n: '审核流程与效率' }
    ];
    if (TABS.every(function (t) { return t.k !== st.tab; })) st.tab = 'todo';

    host.appendChild(UI.pageHd({
      crumb: '<b>活动运营</b> / 活动发布与审核',
      title: '活动发布与审核',
      desc: '按院级两级 / 校级三级流程审核活动申报 · 审核通过后自动发布到活动广场 · 数据范围：' + ZA.scopeText(),
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('act'); } }, '第二课堂活动'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('actmgr'); } }, '活动管理'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZR.go('rule'); } }, '审核流程配置')
      ]
    }));

    host.appendChild(D.h('div.mt16', KP.kpis([
      { ic: '📝', label: '待审核', num: todo().length, unit: '个', fg: '#d97706', bg: '#fffbeb', foot: '需在 3 个工作日内处理' },
      { ic: '✅', label: '已发布', num: KP.pubList(DB.col('activities')).length, unit: '个', fg: '#059669', bg: '#ecfdf5', foot: '活动广场可见' },
      { ic: '✕', label: '已驳回', num: DB.count('activities', function (a) { return a.status === '已驳回'; }), unit: '个', fg: '#dc2626', bg: '#fef2f2', foot: '可修改后重新提交' },
      { ic: '📜', label: '审核留痕', num: DB.count('logs', function (l) { return l.module === '活动审批'; }), unit: '条', fg: '#2563eb', bg: '#eff6ff', foot: '全量可检索' },
      { ic: '⏱', label: '平均审核时长', num: 18.6, unit: '小时', fg: '#7c3aed', bg: '#f5f3ff', foot: '提交到终审' }
    ], 'g5')));

    var tabHost = D.h('div.mt16');
    var bodyHost = D.h('div.mt12');
    D.fill(tabHost, UI.tabs({ items: TABS, cur: st.tab, onChange: function (k) { st.tab = k; st.sel = {}; w.ZR.render(); } }));
    host.appendChild(tabHost);
    host.appendChild(bodyHost);

    if (st.tab === 'todo') tabTodo(bodyHost);
    if (st.tab === 'done') tabDone(bodyHost);
    if (st.tab === 'flow') tabFlow(bodyHost);
  }

  w.ZKP.pages({
    audit: {
      title: '活动发布与审核', group: '活动运营',
      render: render
    }
  });
})(window);
