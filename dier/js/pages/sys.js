/* ==========================================================================
   sys.js —— 安全与实施保障（数据总览）
   说明：本次演示聚焦「第二课堂成绩认定与预警闭环」「系统配置、数据分析与智能服务」
   两大主线（见演示项文档）。本模块提供安全防护、备份、实施进度、培训、运维、
   接口对接与 PC/移动端数据同步的真实状态总览。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'sec' };

  function safety() { return DB.data.safety || {}; }
  function S(k) { return safety()[k] || []; }

  function secTab(host) {
    host.appendChild(UI.card({
      title: '安全防护措施',
      sub: '共 ' + S('protections').length + ' 项，平均完成度 ' + U.round(U.avg(S('protections'), function (p) { return U.num(p.percent); }), 1) + '%',
      flush: true,
      body: D.h('table.tbl',
        D.h('thead', D.h('tr', ['防护项', '目标要求', '当前状态', '完成度', '责任人', '更新时间', '说明'].map(function (h) { return D.h('th', h); }))),
        D.h('tbody', S('protections').map(function (p) {
          return D.h('tr', [
            D.h('td', { style: 'font-weight:600' }, p.name),
            D.h('td', { style: 'font-size:11.8px' }, p.target),
            D.h('td', {}, KP.status(p.status)),
            D.h('td', { style: 'width:150px' }, KP.progCell(U.num(p.percent), p.percent + '%')),
            D.h('td', {}, p.owner),
            D.h('td', { style: 'font-size:11.5px;color:var(--text3)' }, p.at),
            D.h('td', { style: 'font-size:11.5px;color:var(--text3);max-width:240px' }, p.detail)
          ]);
        })))
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '备份记录',
        sub: S('backups').length + ' 条 · 每日全量 + 实时增量',
        flush: true,
        body: D.h('table.tbl.mini',
          D.h('thead', D.h('tr', ['备份类型', '时间', '大小', '耗时', '存储位置', '保留策略', '结果'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', S('backups').map(function (b) {
            return D.h('tr', [
              D.h('td', {}, UI.tag(b.type, b.type === '全量备份' ? 'tag-purple' : 'tag-info')),
              D.h('td', { style: 'font-size:11.8px' }, b.at),
              D.h('td', {}, b.size), D.h('td', {}, b.duration),
              D.h('td', { style: 'font-size:11.8px' }, b.store),
              D.h('td', { style: 'font-size:11.8px' }, b.keep),
              D.h('td', {}, KP.status(b.status))
            ]);
          })))
      }),
      UI.card({
        title: '运维保障承诺', sub: S('ops').length + ' 项服务条款',
        body: D.h('div', {}, S('ops').map(function (o) {
          return D.h('div', { style: 'padding:9px 0;border-bottom:1px dashed var(--line)' },
            D.h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:3px' },
              D.h('b', { style: 'font-size:12.8px' }, o.name),
              KP.status(o.status)),
            D.h('div', { style: 'font-size:12px;color:var(--text3);line-height:1.7' }, o.value));
        }))
      })
    ));
  }

  function implTab(host) {
    host.appendChild(UI.card({
      title: '实施进度',
      sub: '共 ' + S('impl').length + ' 个实施阶段 · 总体完成度 ' + U.round(U.avg(S('impl'), function (i) { return U.num(i.percent); }), 1) + '%',
      body: D.h('div', {}, S('impl').map(function (i) {
        return D.h('div', { style: 'margin-bottom:13px' },
          D.h('div', { style: 'display:flex;align-items:center;gap:9px;margin-bottom:5px' },
            D.h('b', { style: 'font-size:12.8px;min-width:96px' }, i.name),
            KP.status(i.status),
            D.h('span.muted', { style: 'font-size:11.5px' }, i.at),
            D.h('span.muted', { style: 'margin-left:auto;font-size:11.8px' }, i.percent + '%')),
          UI.pg(i.percent, i.percent === 100 ? 'ok' : ''),
          D.h('div', { style: 'font-size:11.8px;color:var(--text3);margin-top:5px' }, i.detail));
      }))
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '培训计划',
        sub: S('trainings').length + ' 场培训 · 覆盖 ' + U.sum(S('trainings'), function (t) { return U.num(t.count); }) + ' 人',
        flush: true,
        body: D.h('table.tbl.mini',
          D.h('thead', D.h('tr', ['培训对象', '人数', '课时', '讲师', '时间', '状态', '培训内容'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', S('trainings').map(function (t) {
            return D.h('tr', [
              D.h('td', { style: 'font-weight:600' }, t.object),
              D.h('td', {}, KP.numCell(t.count, '人')),
              D.h('td', {}, KP.numCell(t.hours, '课时')),
              D.h('td', { style: 'font-size:11.8px' }, t.teacher),
              D.h('td', { style: 'font-size:11.8px' }, t.at),
              D.h('td', {}, KP.status(t.status)),
              D.h('td', { style: 'font-size:11.5px;color:var(--text3);max-width:230px' }, t.content)
            ]);
          })))
      }),
      UI.card({
        title: '培训交付材料', sub: '参训人员可下载的操作手册与说明',
        body: D.h('div', {}, S('trainings').map(function (t) {
          return D.h('div', { style: 'padding:8px 0;border-bottom:1px dashed var(--line)' },
            D.h('div', { style: 'font-size:12.5px;font-weight:600;margin-bottom:4px' }, t.object),
            D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' },
              (t.materials || []).map(function (mm) { return UI.tag('📄 ' + mm, 'tag-info'); })));
        }))
      })
    ));
  }

  function ifcTab(host) {
    host.appendChild(UI.card({
      title: '接口对接情况',
      sub: S('interfaces').length + ' 个对接通道 · 按学校要求完成数据互通',
      flush: true,
      body: D.h('table.tbl',
        D.h('thead', D.h('tr', ['对接名称', '对接目标', '同步频率', '同步字段', '最近同步', '同步量', '状态'].map(function (h) { return D.h('th', h); }))),
        D.h('tbody', S('interfaces').map(function (f) {
          return D.h('tr', [
            D.h('td', { style: 'font-weight:600' }, f.name),
            D.h('td', { style: 'font-size:11.8px' }, f.target),
            D.h('td', { style: 'font-size:11.8px' }, f.freq),
            D.h('td', { style: 'font-size:11.5px;color:var(--text3);max-width:220px' }, f.field),
            D.h('td', { style: 'font-size:11.8px' }, f.lastAt),
            D.h('td', {}, KP.numCell(f.rows === '—' ? 0 : f.rows, '')),
            D.h('td', {}, KP.status(f.status))
          ]);
        })))
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: 'PC 端与移动端数据同步',
      sub: '数据实时同步，双端共用同一份业务数据',
      body: D.h('div', {},
        KP.kpis(S('pcMobile').map(function (p) {
          return { label: p.name, num: 1, unit: ' 项正常', ic: '🔄', fg: '#059669', bg: '#ecfdf5', foot: p.sync + ' · ' + p.lastAt };
        }).slice(0, 5), 'g5'),
        D.h('div', { style: 'margin-top:12px' }, D.h('table.tbl.mini',
          D.h('thead', D.h('tr', ['同步数据域', '同步方式', '最近同步时间', '状态'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', S('pcMobile').map(function (p) {
            return D.h('tr', [D.h('td', { style: 'font-weight:600' }, p.name), D.h('td', {}, p.sync),
              D.h('td', { style: 'font-size:11.8px' }, p.lastAt), D.h('td', {}, KP.status(p.status))]);
          })))))
    }));
  }

  function logTab(host) {
    var logs = DB.col('logs');
    host.appendChild(KP.lister({
      title: '操作日志审计',
      sub: '共 ' + logs.length + ' 条留痕 · 登录、增删改、导出、审批全留痕',
      flush: true, pageSize: 15,
      filters: function (s2, refresh) {
        return UI.filterBar([
          {
            type: 'select', options: [['', '全部模块']].concat(U.uniq(logs.map(function (l) { return l.module; })).map(function (x) { return [x, x]; })),
            value: st.m || '', onChange: function (v) { st.m = v; refresh(); }
          },
          { type: 'input', ph: '操作人 / 动作 / 对象…', onChange: U.debounce(function (v) { st.kw = v; refresh(); }, 220) }
        ], {
          right: [KP.exportBtn('导出审计日志', [
            { t: '时间', k: 'at' }, { t: '操作人', k: 'actor' }, { t: '角色', k: 'role' },
            { t: '模块', k: 'module' }, { t: '动作', k: 'action' }, { t: '对象', k: 'target' },
            { t: 'IP', k: 'ip' }, { t: '结果', k: 'result' }
          ], function () { return logList(); })]
        });
      },
      cols: [
        { t: '时间', w: 136, render: function (l) { return D.h('span', { style: 'font-size:11.8px' }, l.at); } },
        { t: '操作人', w: 130, render: function (l) { return KP.who(l.actor, l.role); } },
        { t: '模块', w: 116, render: function (l) { return UI.tag(l.module, 'tag-info'); } },
        { t: '操作动作', w: 150, render: function (l) { return D.h('b', { style: 'font-size:12.3px' }, l.action); } },
        { t: '操作对象', w: 130, render: function (l) { return D.h('span', { style: 'font-size:11.8px' }, l.target || '—'); } },
        { t: '来源 IP', w: 122, render: function (l) { return D.h('span', { style: 'font-size:11.8px;font-family:ui-monospace,Menlo,monospace' }, l.ip); } },
        { t: '结果', w: 84, render: function (l) { return KP.status(l.result); } }
      ],
      rows: function () { return logList(); },
      empty: '暂无审计日志'
    }));
  }

  function logList() {
    var l = DB.col('logs');
    if (st.m) l = l.filter(function (x) { return x.module === st.m; });
    if (st.kw) l = l.filter(function (x) { return U.hitAny([x.actor, x.action, x.target, x.module], st.kw); });
    return U.sortBy(l, function (x) { return x.at; }, true);
  }

  function render(host) {
    host.appendChild(UI.pageHd({
      title: '安全与实施保障',
      desc: '等保防护、数据备份、实施进度、培训、运维承诺、接口对接与操作日志审计的真实状态总览。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('user'); } }, '用户与权限'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('content'); } }, '内容安全')
      ]
    }));
    host.appendChild(KP.kpis([
      { label: '安全防护项', num: S('protections').length, unit: '项', ic: '🔒', fg: '#2563eb', bg: '#eff6ff', foot: '已启用 ' + S('protections').filter(function (p) { return p.status === '已启用'; }).length + ' 项' },
      { label: '备份记录', num: S('backups').length, unit: '条', ic: '💾', fg: '#059669', bg: '#ecfdf5', foot: 'RPO ≤ 15 分钟' },
      { label: '实施阶段', num: S('impl').length, unit: '个', ic: '📈', fg: '#7c3aed', bg: '#f5f3ff', foot: '已完成 ' + S('impl').filter(function (i) { return i.status === '已完成'; }).length + ' 个' },
      { label: '接口对接', num: S('interfaces').length, unit: '个', ic: '🔌', fg: '#d97706', bg: '#fff8eb', foot: '已上线 ' + S('interfaces').filter(function (f) { return f.status === '已上线'; }).length + ' 个' },
      { label: '审计日志', num: DB.col('logs').length, unit: '条', ic: '📜', fg: '#0d9488', bg: '#f0fdfa', foot: '留痕 ≥ 180 天' }
    ], 'g5'));
    host.appendChild(D.h('div', { style: 'height:14px' }));

    host.appendChild(UI.tabs({
      items: [
        { k: 'sec', n: '安全与备份' },
        { k: 'impl', n: '实施与培训' },
        { k: 'ifc', n: '接口与双端同步' },
        { k: 'log', n: '操作日志', cnt: DB.col('logs').length }
      ],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'sec') secTab(body);
    else if (st.tab === 'impl') implTab(body);
    else if (st.tab === 'ifc') ifcTab(body);
    else logTab(body);
    host.appendChild(body);
  }

  KP.pages({
    sys: { title: '安全与实施保障', group: '组织与运维', render: render }
  });
})(window);
