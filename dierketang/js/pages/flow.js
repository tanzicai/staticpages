/* ==========================================================================
   flow.js —— 党团审批工具（流程可视化总览）
   说明：本次演示聚焦「第二课堂成绩认定与预警闭环」「系统配置、数据分析与智能服务」
   两大主线（见演示项文档）。本模块以可视化方式呈现 4 套审批流程的真实结构：
   审批节点（含条件分支 / 并行分支 / 限时处理规则）、内部触发器、数据关联图谱。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { appId: '', nodeId: '' };

  function apps() { return DB.col('flowApps'); }
  function cur() {
    var l = apps();
    if (!st.appId) st.appId = (l[0] || {}).id;
    return l.filter(function (a) { return a.id === st.appId; })[0] || l[0];
  }

  var TYPE_LABEL = { start: '发起节点', approve: '审批节点', cond: '条件分支', parallel: '并行分支', end: '结束节点' };
  var LAYOUT_LABEL = { card: '卡片布局', table: '表格布局', tabs: '标签页布局' };

  /* ===================== 流程画布 ===================== */
  function canvas(a) {
    var nodes = a.nodes || [];
    var row = D.h('div.fl-row');
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    /* 主线节点：按数组顺序渲染，条件 / 并行节点后单独展开分支 */
    nodes.forEach(function (n, i) {
      var cls = '.fl-node' + (n.type === 'start' ? '.start' : (n.type === 'end' ? '.end' : (n.type === 'cond' ? '.cond' : (n.type === 'parallel' ? '.cond' : ''))));
      if (st.nodeId === n.id) cls += '.on';
      var el = D.h('div' + cls, {
        onclick: function () { st.nodeId = n.id; w.ZR.render(); }
      },
        D.h('div.fn-k', TYPE_LABEL[n.type] || n.type),
        D.h('div.fn-n', n.name),
        D.h('div.fn-a', (n.actors || []).join('、')),
        n.limit && n.limit.mode && n.limit.mode !== '无'
          ? D.h('div', { style: 'font-size:10.5px;color:#b45309;margin-top:3px' },
            '⏱ ' + (n.limit.mode === '计时规则' ? n.limit.hours + ' 小时' : (n.limit.day || n.limit.mode)) + ' · ' + n.limit.onTimeout)
          : null
      );
      row.appendChild(el);
      if (i < nodes.length - 1) row.appendChild(D.h('div.fl-arrow'));
    });

    var wrap = D.h('div', {}, row);

    /* 条件分支展开 */
    nodes.filter(function (n) { return n.type === 'cond' && (n.conds || []).length; }).forEach(function (n) {
      var b = D.h('div.fl-branch');
      b.appendChild(D.h('div.bh', '◇ 条件分支 · ' + n.name + '：按条件走向不同节点'));
      (n.conds || []).forEach(function (cd) {
        var target = byId[cd.to];
        b.appendChild(D.h('div', { style: 'display:flex;align-items:center;gap:9px;padding:5px 0;font-size:12.3px' },
          UI.tag(cd.label, 'tag-warn'),
          D.h('span.muted', '→'),
          D.h('b', target ? target.name : cd.to),
          target ? D.h('span.muted', '（' + (TYPE_LABEL[target.type] || target.type) + ' · ' + (target.actors || []).join('、') + '）') : null));
      });
      wrap.appendChild(b);
    });

    /* 并行分支说明 */
    var pars = nodes.filter(function (n) { return n.type === 'parallel'; });
    if (pars.length) {
      wrap.appendChild(D.h('div.fl-branch', D.h('div.bh', '⇉ 并行分支：与主审批节点同时流转，需全部通过'),
        pars.map(function (n) {
          return D.h('div', { style: 'padding:5px 0;font-size:12.3px' },
            D.h('b', n.name), ' · ' + (n.actors || []).join('、'),
            n.note ? D.h('span.muted', '（' + n.note + '）') : null);
        })));
    }
    return wrap;
  }

  /* ===================== 节点详情 ===================== */
  function nodeDetail(a) {
    if (!st.nodeId) return UI.empty('未选中节点', '点击流程中的任一节点查看其配置');
    var n = (a.nodes || []).filter(function (x) { return x.id === st.nodeId; })[0];
    if (!n) return UI.empty('节点不存在', '请重新选择');
    return D.h('div', {},
      UI.kv([
        ['节点名称', n.name],
        ['节点类型', TYPE_LABEL[n.type] || n.type],
        ['处理人 / 角色', (n.actors || []).join('、') || '—'],
        ['审批顺序', n.priority ? '第 ' + n.priority + ' 顺位' : '—'],
        ['限时规则', n.limit && n.limit.mode !== '无'
          ? (n.limit.mode + '：' + (n.limit.hours ? n.limit.hours + ' 小时' : (n.limit.day || ''))) + '，超时' + n.limit.onTimeout
          : '不限时'],
        ['超时提醒对象', (n.limit && n.limit.remind || []).join('、') || '—'],
        ['节点说明', n.note || '—']
      ]),
      (n.conds || []).length ? D.h('div', {},
        KP.h5('分支条件'),
        D.h('div', {}, n.conds.map(function (c) {
          return D.h('div', { style: 'padding:6px 0;border-bottom:1px dashed var(--line);font-size:12.3px' },
            UI.tag(c.label, 'tag-warn'), D.h('span.muted', ' → ' + c.to));
        }))) : null
    );
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    var a = cur();
    if (!a) { host.appendChild(UI.empty('暂无审批流程', '请先在流程配置中创建')); return; }

    host.appendChild(UI.pageHd({
      title: '党团审批工具',
      desc: '可视化流程设计器：条件分支、并行分支、限时处理规则、内部触发器与数据关联图谱；本次演示聚焦第二课堂成绩认定与预警闭环，本模块提供流程结构总览。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('party'); } }, '党团管理'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('audit'); } }, '活动发布与审核')
      ]
    }));

    host.appendChild(KP.kpis([
      { label: '审批流程', num: apps().length, unit: '套', ic: '🔀', fg: '#2563eb', bg: '#eff6ff', foot: '启用 ' + apps().filter(function (x) { return x.enabled; }).length + ' 套' },
      { label: '审批节点', num: U.sum(apps(), function (x) { return (x.nodes || []).length; }), unit: '个', ic: '⚙️', fg: '#059669', bg: '#ecfdf5' },
      { label: '内部触发器', num: U.sum(apps(), function (x) { return (x.triggers || []).length; }), unit: '个', ic: '⚡', fg: '#d97706', bg: '#fff8eb' },
      { label: '数据关联', num: U.sum(apps(), function (x) { return (x.relations || []).length; }), unit: '条', ic: '🔗', fg: '#7c3aed', bg: '#f5f3ff' },
      { label: '累计流转', num: U.sum(apps(), function (x) { return U.num(x.used); }), unit: '次', ic: '📨', fg: '#0d9488', bg: '#f0fdfa' }
    ], 'g5'));

    host.appendChild(D.h('div', { style: 'height:14px' }));

    /* 流程选择 */
    host.appendChild(D.h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px' },
      apps().map(function (x) {
        return D.h('button.btn.btn-sm' + (x.id === a.id ? '.btn-p' : ''), {
          onclick: function () { st.appId = x.id; st.nodeId = ''; w.ZR.render(); }
        }, x.name + '（' + LAYOUT_LABEL[x.layout] + '）');
      })));

    host.appendChild(UI.card({
      title: a.name,
      sub: (LAYOUT_LABEL[a.layout] || a.layout) + ' · ' + (a.nodes || []).length + ' 个节点 · 累计流转 ' + U.fmt(a.used) + ' 次 · ' + (a.enabled ? '已启用' : '已停用'),
      body: D.h('div', {},
        D.h('div', { style: 'font-size:12.8px;line-height:1.8;color:var(--text2);margin-bottom:10px' }, a.desc || ''),
        canvas(a))
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g2', {},
      UI.card({ title: '节点配置', sub: '点击流程节点查看详情', body: nodeDetail(a) }),
      D.h('div', {},
        UI.card({
          title: '内部触发器',
          sub: (a.triggers || []).length + ' 个 · 满足条件后自动执行动作',
          flush: true,
          body: D.h('table.tbl.mini',
            D.h('thead', D.h('tr', ['触发器', '触发时机', '动作', '目标对象', '状态', '执行次数'].map(function (h) { return D.h('th', h); }))),
            D.h('tbody', (a.triggers || []).map(function (t) {
              return D.h('tr', [
                D.h('td', { style: 'font-weight:600' }, t.name),
                D.h('td', { style: 'font-size:11.8px' }, t.on),
                D.h('td', {}, UI.tag(t.action, 'tag-info')),
                D.h('td', { style: 'font-size:11.8px' }, t.target),
                D.h('td', {}, KP.status(t.enabled ? '已启用' : '已停用')),
                D.h('td', {}, U.fmt(t.log))
              ]);
            }))),
          note: D.h('span.muted', (a.triggers || []).map(function (t) { return t.name + '：' + t.detail; }).join('　'))
        }),
        D.h('div', { style: 'height:12px' }),
        UI.card({
          title: '数据关联图谱',
          sub: (a.relations || []).length + ' 条关联关系',
          body: D.h('div', {}, (a.relations || []).map(function (r) {
            return D.h('div', { style: 'display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:12.3px' },
              D.h('b', { style: 'min-width:118px' }, r.from),
              D.h('span', { style: 'color:var(--primary)' }, '→'),
              D.h('b', { style: 'min-width:118px' }, r.to),
              UI.tag(r.type, 'tag-info'),
              D.h('span.muted', { style: 'flex:1;font-size:11.5px' }, r.field));
          }))
        })
      )
    ));
  }

  KP.pages({
    flow: { title: '党团审批工具', group: '组织与运维', render: render }
  });
})(window);
