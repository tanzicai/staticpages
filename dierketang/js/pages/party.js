/* ==========================================================================
   party.js —— 党团管理（数据总览）
   说明：本次演示聚焦「第二课堂成绩认定与预警闭环」「系统配置、数据分析与智能服务」
   两大主线（见演示项文档）。本模块提供党团业务的数据总览与台账查询。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'org', type: '团员', kw: '' };

  function party() { return DB.data.party || {}; }
  function orgs() { return party().orgs || []; }
  function members() { return party().members || []; }
  function forms() { return party().forms || []; }
  function comps() { return party().components || []; }
  function packs() { return party().componentPacks || []; }
  function tables() { return party().tables || {}; }

  function memberList() {
    var l = members().filter(function (m) { return m.type === st.type; });
    if (st.kw) l = l.filter(function (m) { return U.hitAny([m.name, m.sno, m.college, m.className, m.post, m.branch], st.kw); });
    return l;
  }

  function orgTab(host) {
    var byType = U.groupBy(orgs(), function (o) { return o.type; });
    host.appendChild(D.h('div.g4', {}, Object.keys(byType).map(function (t, i) {
      var n = U.sum(byType[t], function (o) { return U.num(o.memberCount); });
      return UI.stat({
        label: t, num: byType[t].length, unit: '个',
        ic: t === '党委' ? '🎖' : (t === '团委' ? '🚩' : '🏛'),
        fg: C.color(i), bg: '#f5f8ff',
        foot: '覆盖 ' + U.fmt(n) + ' 人'
      });
    })));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '党团组织架构',
      sub: '党委 → 团委 → 各二级学院团总支',
      flush: true,
      body: D.h('table.tbl',
        D.h('thead', D.h('tr', ['组织名称', '组织类型', '上级组织', '覆盖人数', '负责人'].map(function (h) { return D.h('th', h); }))),
        D.h('tbody', orgs().map(function (o) {
          var parent = orgs().filter(function (x) { return x.id === o.parent; })[0];
          return D.h('tr', [
            D.h('td', { style: 'font-weight:600;padding-left:' + (o.parent ? 20 : 8) + 'px' }, o.name),
            D.h('td', {}, UI.tag(o.type, o.type === '党委' ? 'tag-purple' : 'tag-info')),
            D.h('td', { style: 'font-size:11.8px;color:var(--text3)' }, parent ? parent.name : '—'),
            D.h('td', {}, KP.numCell(o.memberCount, '人')),
            D.h('td', {}, o.secretary)
          ]);
        })))
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '团员信息台账', sub: '共 ' + U.fmt((tables().league || {}).count || 0) + ' 人',
        flush: true,
        body: D.h('div', {},
          D.h('div', { style: 'padding:11px 13px 0;display:flex;flex-wrap:wrap;gap:6px' },
            ((tables().league || {}).cols || []).map(function (c) { return UI.tag(c, 'tag-info'); })),
          D.h('div', { style: 'padding:11px 13px;font-size:12.3px;color:var(--text3)' },
            '台账字段与学籍数据自动关联，支持按学院 / 年级筛选与批量导出。'))
      }),
      UI.card({
        title: '党员信息台账', sub: '共 ' + U.fmt((tables().party || {}).count || 0) + ' 人',
        flush: true,
        body: D.h('div', {},
          D.h('div', { style: 'padding:11px 13px 0;display:flex;flex-wrap:wrap;gap:6px' },
            ((tables().party || {}).cols || []).map(function (c) { return UI.tag(c, 'tag-warn'); })),
          D.h('div', { style: 'padding:11px 13px;font-size:12.3px;color:var(--text3)' },
            '党员台账由入党审批流程通过后自动回写，含发展阶段与党内职务。'))
      })
    ));
  }

  function memberTab(host) {
    var list = memberList();
    host.appendChild(KP.lister({
      title: st.type + '名册',
      sub: '共 ' + list.length + ' 条记录',
      flush: true, pageSize: 12,
      filters: function (s2, refresh) {
        return UI.filterBar([
          { type: 'select', options: [['团员', '团员'], ['党员', '党员']], value: st.type, onChange: function (v) { st.type = v; refresh(); } },
          { type: 'input', ph: '姓名 / 学号 / 班级 / 职务…', onChange: U.debounce(function (v) { st.kw = v; refresh(); }, 220) }
        ], {
          right: [KP.exportBtn('导出' + st.type + '名册', [
            { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' }, { t: '学院', k: 'college' },
            { t: '班级', k: 'className' }, { t: '编号', k: 'no' },
            { t: st.type === '团员' ? '入团时间' : '入党时间', k: 'joinedAt' },
            { t: '党内 / 团内职务', k: 'post' }, { t: '所属组织', k: 'branch' },
            { t: '发展阶段', k: 'stage' }, { t: '状态', k: 'status' }
          ], function () { return memberList(); })]
        });
      },
      cols: [
        { t: '姓名', w: 130, render: function (m) { return KP.who(m.name, m.sno); } },
        { t: '学院 / 班级', w: 200, render: function (m) { return KP.cell(m.college, m.className); } },
        { t: '年级', w: 76, render: function (m) { return m.grade; } },
        { t: '编号', w: 122, render: function (m) { return D.h('span', { style: 'font-size:11.8px;font-family:ui-monospace,Menlo,monospace' }, m.no || '—'); } },
        { t: st.type === '团员' ? '入团时间' : '入党时间', w: 106, render: function (m) { return D.h('span.muted', m.joinedAt || '—'); } },
        { t: '职务', w: 92, render: function (m) { return m.post || D.h('span.muted', '—'); } },
        { t: '发展阶段', w: 96, render: function (m) { return KP.status(m.stage); } },
        { t: '状态', w: 88, render: function (m) { return KP.status(m.status); } }
      ],
      rows: function () { return list; },
      empty: '暂无' + st.type + '记录'
    }));
  }

  function formTab(host) {
    host.appendChild(UI.card({
      title: '党团表单模板',
      sub: '共 ' + forms().length + ' 套表单模板 · 支持拖拉拽自定义',
      flush: true,
      body: D.h('table.tbl',
        D.h('thead', D.h('tr', ['表单名称', '分类', '版本', '字段数', '使用次数', '布局', '状态', '字段明细'].map(function (h) { return D.h('th', h); }))),
        D.h('tbody', forms().map(function (f) {
          return D.h('tr', [
            D.h('td', { style: 'font-weight:600' }, f.name),
            D.h('td', {}, UI.tag(f.cat, 'tag-info')),
            D.h('td', {}, f.version),
            D.h('td', {}, KP.numCell((f.fields || []).length, '个')),
            D.h('td', {}, KP.numCell(f.used, '次')),
            D.h('td', {}, UI.tag(f.layout === 'card' ? '卡片布局' : '表格布局', 'tag-info')),
            D.h('td', {}, KP.status(f.enabled ? '已启用' : '已停用')),
            D.h('td', { style: 'font-size:11.5px;color:var(--text3);max-width:260px' }, (f.fields || []).map(function (x) { return x.label; }).join('、'))
          ]);
        })))
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '表单组件库',
      sub: '共 ' + comps().length + ' 种组件 · ' + packs().length + ' 个组件包',
      body: D.h('div', {},
        D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px' },
          comps().map(function (c) { return UI.tag(c, ''); })),
        KP.h5('预置组件包'),
        D.h('div', {}, packs().map(function (p) {
          return D.h('div', { style: 'display:flex;gap:9px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed var(--line);font-size:12.3px' },
            D.h('b', { style: 'min-width:92px' }, p.name),
            D.h('span.muted', { style: 'width:52px' }, p.count + ' 个'),
            D.h('span', { style: 'flex:1' }, (p.items || []).join('、')));
        }))
      )
    }));
  }

  function render(host) {
    host.appendChild(UI.pageHd({
      title: '党团管理',
      desc: '党团组织架构、团员与党员名册、党团表单模板与组件库的数据总览；本次演示聚焦第二课堂成绩认定与预警闭环，本模块提供数据查询与导出。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('flow'); } }, '党团审批工具'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('user'); } }, '组织与用户')
      ]
    }));
    host.appendChild(KP.kpis([
      { label: '党团组织', num: orgs().length, unit: '个', ic: '🏛', fg: '#2563eb', bg: '#eff6ff' },
      { label: '团员', num: U.num((tables().league || {}).count), unit: '人', ic: '🚩', fg: '#059669', bg: '#ecfdf5' },
      { label: '党员', num: U.num((tables().party || {}).count), unit: '人', ic: '🎖', fg: '#dc2626', bg: '#fef2f2' },
      { label: '表单模板', num: forms().length, unit: '套', ic: '📋', fg: '#7c3aed', bg: '#f5f3ff', foot: '组件 ' + comps().length + ' 种' },
      { label: '台账字段', num: ((tables().league || {}).cols || []).length + ((tables().party || {}).cols || []).length, unit: '个', ic: '📊', fg: '#d97706', bg: '#fff8eb' }
    ], 'g5'));
    host.appendChild(D.h('div', { style: 'height:14px' }));

    host.appendChild(UI.tabs({
      items: [
        { k: 'org', n: '组织架构' },
        { k: 'member', n: '人员名册', cnt: members().length },
        { k: 'form', n: '表单模板', cnt: forms().length }
      ],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'org') orgTab(body);
    else if (st.tab === 'member') memberTab(body);
    else formTab(body);
    host.appendChild(body);
  }

  KP.pages({
    party: { title: '党团管理', group: '组织与运维', render: render }
  });
})(window);
