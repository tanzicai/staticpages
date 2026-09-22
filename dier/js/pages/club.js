/* ==========================================================================
   club.js —— 社团管理（数据总览）
   说明：本次演示聚焦「第二课堂成绩认定与预警闭环」「系统配置、数据分析与智能服务」
   两大主线（见演示项文档）。本模块提供社团业务的数据总览与台账查询，
   数据与系统其他模块同源，可正常浏览、筛选与导出。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'list', cat: '', level: '', kw: '' };

  function clubs() { return KP.scopeFilter(DB.col('clubs')); }
  function apps() { return DB.col('clubApps'); }
  function members() { return DB.col('clubMembers'); }

  function filtered() {
    var l = clubs();
    if (st.cat) l = l.filter(function (c) { return c.cat === st.cat; });
    if (st.level) l = l.filter(function (c) { return c.level === st.level; });
    if (st.kw) l = l.filter(function (c) { return U.hitAny([c.name, c.cat, c.college, c.leader, c.advisor], st.kw); });
    return U.sortBy(l, function (c) { return c.members; }, true);
  }

  function listTab(host) {
    host.appendChild(KP.lister({
      title: '社团台账',
      sub: '共 ' + clubs().length + ' 个社团 · 成员 ' + U.fmt(members().length) + ' 人',
      flush: true, pageSize: 12,
      filters: function (s2, refresh) {
        return UI.filterBar([
          { type: 'select', options: [['', '全部类别']].concat(U.uniq(clubs().map(function (c) { return c.cat; })).map(function (x) { return [x, x]; })), value: st.cat, onChange: function (v) { st.cat = v; refresh(); } },
          { type: 'select', options: [['', '全部级别'], ['校级', '校级'], ['院级', '院级']], value: st.level, onChange: function (v) { st.level = v; refresh(); } },
          { type: 'input', ph: '社团名称 / 负责人 / 指导老师…', onChange: U.debounce(function (v) { st.kw = v; refresh(); }, 220) }
        ], {
          right: [KP.exportBtn('导出社团台账', [
            { t: '社团名称', k: 'name' }, { t: '类别', k: 'cat' }, { t: '级别', k: 'level' },
            { t: '指导单位', k: 'college' }, { t: '社长', k: 'leader' }, { t: '指导老师', k: 'advisor' },
            { t: '成员数', k: 'members' }, { t: '成立时间', k: 'founded' },
            { t: '活动场次', k: 'events' }, { t: '成果数', k: 'works' }, { t: '状态', k: 'status' }
          ], function () { return filtered(); })]
        });
      },
      cols: [
        { t: '社团', w: 176, render: function (c) { return KP.cell(c.name, c.cat + ' · ' + c.level); } },
        { t: '指导单位', w: 132, render: function (c) { return c.college; } },
        { t: '社长 / 指导老师', w: 150, render: function (c) { return KP.who(c.leader, '指导老师：' + c.advisor); } },
        { t: '成员', w: 80, render: function (c) { return KP.numCell(c.members, '人'); } },
        { t: '活动场次', w: 90, render: function (c) { return KP.numCell(c.events, '场'); } },
        { t: '成果数', w: 80, render: function (c) { return KP.numCell(c.works, '项'); } },
        { t: '年审', w: 90, render: function (c) { return KP.status(c.annual); } },
        { t: '状态', w: 90, render: function (c) { return KP.status(c.status); } },
        { t: '操作', w: 96, render: function (c) { return KP.acts([KP.btn('台账', function () { ledger(c); })]); } }
      ],
      rows: function () { return filtered(); },
      empty: '暂无社团数据'
    }));
  }

  function ledger(c) {
    var m = UI.modal({
      title: c.name + ' · 社团台账',
      sub: c.cat + ' · ' + c.level + ' · ' + c.college,
      size: 'wide',
      body: [
        UI.kv([
          ['社团名称', c.name], ['类别', c.cat], ['级别', c.level],
          ['指导单位', c.college], ['指导老师', c.advisor], ['社长', c.leader + '（' + c.leaderSno + '）'],
          ['成立时间', c.founded], ['成员数量', U.fmt(c.members) + ' 人'],
          ['社团账号', c.account], ['会费标准', U.fmt(c.fee) + ' 元/年'],
          ['活动场次', c.events + ' 场'], ['成果数量', c.works + ' 项'],
          ['年审状态', c.annual], ['社团状态', c.status]
        ]),
        KP.h5('社团简介'),
        D.h('div', { style: 'font-size:12.8px;line-height:1.85;padding:11px;border:1px solid var(--line);border-radius:10px;background:#fbfdff' }, c.intro),
        KP.h5('活动台账'),
        D.h('div', { html: KP.tableHTML([
          { t: '活动名称', k: 'name' }, { t: '类型', k: 'type' }, { t: '时间', k: 'at' },
          { t: '报名', k: 'join' }, { t: '签到', k: 'sign' }, { t: '签到率(%)', k: 'rate' },
          { t: '考核分', k: 'score' }, { t: '状态', k: 'status' }
        ], c.ledger || []) }),
        KP.h5('社团管理权限'),
        D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, (c.perms || []).map(function (p) { return UI.tag(p, 'tag-info'); }))
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        KP.exportBtn('导出活动台账', [
          { t: '活动名称', k: 'name' }, { t: '类型', k: 'type' }, { t: '时间', k: 'at' },
          { t: '报名', k: 'join' }, { t: '签到', k: 'sign' }, { t: '考核分', k: 'score' }
        ], c.ledger || [])
      ]
    });
  }

  function appTab(host) {
    var list = apps();
    host.appendChild(KP.lister({
      title: '社团申请与申报',
      sub: '入社申请 ' + list.filter(function (a) { return a.type === '入社申请'; }).length +
        ' 条 · 创建申报 ' + list.filter(function (a) { return a.type === '创建申报'; }).length + ' 条',
      flush: true, pageSize: 12,
      cols: [
        { t: '申请类型', w: 100, render: function (a) { return UI.tag(a.type, a.type === '创建申报' ? 'tag-purple' : 'tag-info'); } },
        { t: '申请人', w: 150, render: function (a) { return KP.who(a.name, a.sno); } },
        { t: '目标社团', w: 150, render: function (a) { return a.clubName || '新建社团'; } },
        { t: '学院 / 班级', w: 190, render: function (a) { return KP.cell(a.college, a.className); } },
        { t: '申请理由', w: 210, render: function (a) { return a.reason ? KP.cell(a.reason, '特长：' + (a.skill || '—'), { clip: true }) : D.h('span.muted', '—'); } },
        { t: '状态', w: 90, render: function (a) { return KP.status(a.status); } },
        { t: '申请时间', w: 132, render: function (a) { return D.h('span.muted', a.at); } }
      ],
      rows: function () { return U.sortBy(list, function (a) { return a.at; }, true); },
      empty: '暂无社团申请'
    }));
  }

  function render(host) {
    host.appendChild(UI.pageHd({
      title: '社团管理',
      desc: '社团台账、成员构成、入社申请与社团创建申报的数据总览；本次演示聚焦第二课堂成绩认定与预警闭环，本模块提供数据查询与导出。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('stat'); } }, '统计分析'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('party'); } }, '党团管理')
      ]
    }));
    host.appendChild(KP.kpis([
      { label: '在册社团', num: clubs().length, unit: '个', ic: '🏛', fg: '#2563eb', bg: '#eff6ff', foot: '校级 ' + clubs().filter(function (c) { return c.level === '校级'; }).length + ' 个' },
      { label: '社团成员', num: members().length, unit: '人', ic: '👥', fg: '#059669', bg: '#ecfdf5', foot: '人均参与 ' + U.round(members().length / Math.max(1, clubs().length), 1) + ' 人/社团' },
      { label: '待审申请', num: apps().filter(function (a) { return a.status === '待审核' || a.status === '待审批'; }).length, unit: '条', ic: '📝', fg: '#d97706', bg: '#fff8eb' },
      { label: '活动场次', num: U.sum(clubs(), function (c) { return U.num(c.events); }), unit: '场', ic: '🎯', fg: '#7c3aed', bg: '#f5f3ff' },
      { label: '社团成果', num: U.sum(clubs(), function (c) { return U.num(c.works); }), unit: '项', ic: '🏆', fg: '#0d9488', bg: '#f0fdfa' }
    ], 'g5'));
    host.appendChild(D.h('div', { style: 'height:14px' }));

    host.appendChild(UI.tabs({
      items: [{ k: 'list', n: '社团台账', cnt: clubs().length }, { k: 'app', n: '申请与申报', cnt: apps().length }],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'list') {
      listTab(body);
      body.appendChild(D.h('div', { style: 'height:14px' }));
      body.appendChild(D.h('div.g2', {},
        UI.card({
          title: '社团类别分布', sub: '按类别统计社团数',
          body: C.bars(U.uniq(clubs().map(function (c) { return c.cat; })).map(function (t, i) {
            return { n: t, v: clubs().filter(function (c) { return c.cat === t; }).length, c: C.color(i) };
          }), { labelW: 84, bh: 18 })
        }),
        UI.card({
          title: '成员规模 Top', sub: '按成员人数排行',
          body: C.rankBars(U.sortBy(clubs(), function (c) { return c.members; }, true).slice(0, 8)
            .map(function (c) { return { n: c.name, v: c.members }; }), { unit: ' 人' })
        })
      ));
    } else appTab(body);
    host.appendChild(body);
  }

  KP.pages({
    club: { title: '社团管理', group: '组织与运维', render: render }
  });
})(window);
