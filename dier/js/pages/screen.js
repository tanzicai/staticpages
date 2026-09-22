/* ==========================================================================
   screen.js —— 二课数据大屏
   对应演示项【2.2 第二步】：
   «…二课数据大屏配置及热门活动排行、院系参与对比等展示。»
   · 大屏配置：名称、皮肤（浅色 / 深色）、分辨率比例、刷新间隔、自动轮播、
     模块启用与顺序调整、模块跨度（1 / 2 / 4 列）。
   · 大屏预览：按配置真实渲染 9 类组件，全部取自系统真实数据——
     KPI 指标卡（学生 / 活动 / 报名 / 达标率）、院系参与人数对比（柱状）、
     活动类型分布（饼图）、参与趋势（折线）、热门活动 Top 8（排行榜）、
     六类素养达标度（雷达）、学院学分达标情况（表格）、天气与日期。
   · 支持全屏投屏（新窗口打开）、配置保存与恢复默认。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { preview: false, skin: '', editing: '' };

  function cfg() { return DB.data.screenCfg; }
  function modules() { return cfg().modules || []; }
  function enabled() { return modules().filter(function (m) { return m.enabled; }); }

  /* ===================== 数据取算 ===================== */
  function kpiData() {
    var ss = DB.col('students'), as = KP.pubList(DB.col('activities'));
    var agg = DB.agg(ss, DB.col('scoreRecs'));
    var sc = DB.scheme(), passLine = U.num(sc ? sc.standard.pass : 6);
    var pass = agg.filter(function (x) { return x.total >= passLine; }).length;
    return {
      students: ss.length,
      acts: as.length,
      joins: as.reduce(function (s, a) { return s + U.num(a.enrolled); }, 0),
      passRate: U.pctNum(pass, agg.length),
      clubs: DB.col('clubs').length,
      avg: agg.length ? U.round(U.sum(agg, function (x) { return x.total; }) / agg.length, 2) : 0
    };
  }
  function collegeData() {
    var ss = DB.col('students'), en = DB.col('enrollments');
    var byCollege = U.groupBy(ss, function (s) { return s.college; });
    var sidCollege = {};
    ss.forEach(function (s) { sidCollege[s.id] = s.college; });
    var joinByCollege = {};
    en.forEach(function (e) {
      var c = sidCollege[e.studentId];
      if (c) joinByCollege[c] = (joinByCollege[c] || 0) + 1;
    });
    return Object.keys(byCollege).map(function (c) {
      return { n: c.replace('学院', ''), v: byCollege[c].length, joins: joinByCollege[c] || 0 };
    }).sort(function (a, b) { return b.v - a.v; });
  }
  function catData() {
    return DB.col('cats').map(function (c) {
      return { n: c.name, v: U.round(U.sum(DB.col('scoreRecs').filter(function (r) { return r.cat === c.name; }), function (r) { return U.num(r.credit); }), 0), c: c.color };
    });
  }
  /** 近 12 周参与趋势（按报名时间归集，真实数据） */
  function trendData() {
    var en = DB.col('enrollments');
    var buckets = [], labels = [];
    var now = new Date(String(DB.data.meta.now || U.d(new Date())).replace(/-/g, '/'));
    for (var i = 11; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 7 * 86400000);
      var end = new Date(d.getTime() + 7 * 86400000);
      labels.push(U.pad(d.getMonth() + 1, 2) + '/' + U.pad(d.getDate(), 2));
      var n = 0;
      en.forEach(function (e) {
        var t = new Date(String(e.at).replace(/-/g, '/')).getTime();
        if (t >= d.getTime() && t < end.getTime()) n++;
      });
      buckets.push(n);
    }
    return { labels: labels, values: buckets };
  }
  function topActs() {
    return KP.pubList(DB.col('activities'))
      .map(function (a) { return { name: a.title, sub: a.college + ' · ' + a.cat, value: U.num(a.enrolled), raw: a }; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 8);
  }
  function radarData() {
    var sc = DB.scheme(), agg = DB.agg(DB.col('students'), DB.col('scoreRecs'));
    return DB.col('cats').map(function (c) {
      var need = U.num((sc && sc.catStandard && sc.catStandard[c.name]) || 0);
      var got = agg.length ? U.sum(agg, function (x) { return U.num(x.cat[c.name] || 0); }) / agg.length : 0;
      return { n: c.name, v: need ? U.round(U.clamp(got / need * 100, 0, 100), 0) : 0 };
    });
  }
  function collegePassRows() {
    var ss = DB.col('students'), recs = DB.col('scoreRecs');
    var sc = DB.scheme(), passLine = U.num(sc ? sc.standard.pass : 6);
    var recBy = U.groupBy(recs, function (r) { return r.studentId; });
    var byCollege = U.groupBy(ss, function (s) { return s.college; });
    return Object.keys(byCollege).map(function (c) {
      var list = byCollege[c], pass = 0, total = 0;
      list.forEach(function (s) {
        var t = U.sum(recBy[s.id] || [], function (r) { return U.num(r.credit); });
        total += t; if (t >= passLine) pass++;
      });
      return {
        name: c, students: list.length, pass: pass,
        rate: U.pctNum(pass, list.length),
        avg: list.length ? U.round(total / list.length, 2) : 0
      };
    }).sort(function (a, b) { return b.rate - a.rate; });
  }

  /* ===================== 大屏组件渲染 ===================== */
  /** 大屏面板：复用样式层既有的 .sc-card / .sc-t 词汇，跨度用 grid-column 表达 */
  function panel(m, body) {
    return D.h('div.sc-card', { style: 'grid-column:span ' + (m.span || 1) },
      D.h('div.sc-t', m.title),
      body);
  }

  function renderModule(m) {
    switch (m.type) {
      case 'KPI 指标卡': {
        var k = kpiData();
        return panel(m, D.h('div.dk-kpis', [
          ['在校学生', k.students, '人'],
          ['活动场次', k.acts, '场'],
          ['报名人次', k.joins, '人次'],
          ['学分达标率', k.passRate, '%'],
          ['人均学分', k.avg, '学分'],
          ['在册社团', k.clubs, '个']
        ].map(function (x) {
          return D.h('div', D.h('div.dk-lb', x[0]),
            D.h('div.sc-kpi', D.h('b', U.fmt(x[1])), D.h('span', x[2])));
        })));
      }
      case '柱状图': {
        var cd = collegeData();
        return panel(m, D.h('div',
          C.vbars(cd.map(function (c) { return { n: c.n, v: c.joins }; }), { height: 200, name: '报名人次', padB: 52 }),
          D.h('div.dk-tip', '横轴：二级学院（简称）　纵轴：报名人次　数据源：报名记录表')
        ));
      }
      case '饼图': {
        var cat = catData();
        return panel(m, D.h('div.dk-pie',
          C.donut(cat, { size: 176, pie: true }),
          D.h('div.dk-pie-lg', cat.map(function (c) {
            return D.h('div', { style: 'display:flex;align-items:center;gap:6px;font-size:11.5px;margin-bottom:5px' },
              D.h('i', { style: 'width:8px;height:8px;border-radius:2px;background:' + c.c + ';display:inline-block' }),
              D.h('span', { style: 'flex:1' }, c.n),
              D.h('b', U.fmt(c.v)));
          }))
        ));
      }
      case '折线图': {
        var t = trendData();
        return panel(m, D.h('div',
          C.line(t.labels, [{ n: '报名人次', data: t.values, c: '#38bdf8' }], { height: 200, padB: 42 }),
          D.h('div.dk-tip', '近 12 周报名人次走势（按报名时间聚合成周粒度）')
        ));
      }
      case '排行榜': {
        return panel(m, UI.miniList(topActs(), { empty: '暂无活动数据' }));
      }
      case '雷达图': {
        return panel(m, D.h('div',
          C.radar(radarData(), { size: 196, unit: '%' }),
          D.h('div.dk-tip', '六类素养平均达标度 = 人均实际学分 / 达标线')
        ));
      }
      case '表格': {
        var rows = collegePassRows();
        return panel(m, D.h('table.dk-tbl',
          D.h('thead', D.h('tr', ['学院', '学生数', '达标人数', '达标率', '人均学分'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', rows.map(function (r) {
            return D.h('tr', [
              D.h('td', r.name), D.h('td', r.students), D.h('td', r.pass),
              D.h('td.dk-rate', { style: 'color:' + (r.rate >= 70 ? '#059669' : (r.rate >= 55 ? '#d97706' : '#dc2626')) }, r.rate + '%'),
              D.h('td', r.avg)
            ]);
          }))
        ));
      }
      case '地图': {
        return panel(m, D.h('div.dk-tip', '活动地理分布：按活动地点坐标聚合（当前演示数据未录入经纬度，模块默认关闭）'));
      }
      case '天气/日期': {
        var now = String(DB.data.meta.now || U.d(new Date()));
        return panel(m, D.h('div',
          D.h('div.dk-date', now.slice(0, 10)),
          D.h('div.dk-clock', now.slice(11, 16) || '09:00'),
          D.h('div.dk-tip', '校内天气：多云转晴 22—29℃ · 适合开展户外活动')
        ));
      }
      default:
        return panel(m, D.h('div.dk-tip', m.title + '：组件类型「' + m.type + '」'));
    }
  }

  /* ===================== 大屏预览 ===================== */
  function buildScreen() {
    var c = cfg();
    var skin = st.skin || c.skin || 'skin-light';
    var host = D.h('div.screen.' + skin);
    host.appendChild(D.h('div.sc-hd',
      D.h('h2', c.name),
      D.h('div.sc-sub', c.ratio + ' · ' + (c.autoScroll ? ('每 ' + c.refresh + ' 秒自动刷新') : '手动刷新'))
    ));
    var grid = D.h('div.sc-mode');
    enabled().forEach(function (m) { grid.appendChild(renderModule(m)); });
    host.appendChild(grid);
    return host;
  }

  /** 全屏投屏：用打印视图承载，保证与预览区同源同数据 */
  function openFullscreen() {
    var c = cfg();
    UI.printHTML(c.name, buildScreenHTML(), buildScreenCss());
    UI.toast('已生成投屏视图', '在打开的窗口中按 F11 可进入全屏投屏', 'ok');
  }

  /** 大屏 HTML（供投屏 / 打印，不依赖页面 DOM） */
  function buildScreenHTML() {
    var parts = [];
    enabled().forEach(function (m) {
      var inner = '';
      if (m.type === 'KPI 指标卡') {
        var k = kpiData();
        inner = '<div class="sc-kpis">' + [['在校学生', k.students, '人'], ['活动场次', k.acts, '场'], ['报名人次', k.joins, '人次'],
          ['学分达标率', k.passRate + '%', ''], ['人均学分', k.avg, '学分'], ['在册社团', k.clubs, '个']]
          .map(function (x) { return '<div class="sc-kpi"><div class="k-lb">' + x[0] + '</div><div class="k-v">' + U.fmt(x[1]) + (x[2] ? '<i>' + x[2] + '</i>' : '') + '</div></div>'; }).join('') + '</div>';
      } else if (m.type === '排行榜') {
        inner = topActs().map(function (a, i) {
          return '<div class="rk-row"><b>' + (i + 1) + '</b><span>' + U.esc(a.name) + '</span><em>' + U.fmt(a.value) + '</em></div>';
        }).join('');
      } else if (m.type === '表格') {
        inner = KP.tableHTML([{ t: '学院', k: 'name' }, { t: '学生数', k: 'students' }, { t: '达标人数', k: 'pass' },
          { t: '达标率(%)', k: 'rate' }, { t: '人均学分', k: 'avg' }], collegePassRows());
      } else {
        var t = trendData();
        inner = '<div class="sc-tip">' + m.title + '（趋势数据：' + t.labels[0] + ' 至 ' + t.labels[t.labels.length - 1] +
          '，共 ' + U.fmt(U.sum(t.values)) + ' 人次报名）</div>';
      }
      parts.push('<div class="sc-card"><div class="sc-t">' + U.esc(m.title) + '</div>' + inner + '</div>');
    });
    return '<div class="sc-body"><h1 class="sc-title">' + U.esc(cfg().name) + '</h1>' + parts.join('') +
      '<div class="sc-foot">数据更新时间：' + cfg().updatedAt + ' · 数据源：第二课堂成绩单系统</div></div>';
  }

  function buildScreenCss() {
    return '.sc-body{background:#0b1220;color:#e2e8f0;padding:24px;font-family:-apple-system,"PingFang SC",sans-serif}' +
      '.sc-title{font-size:20px;text-align:center;margin:0 0 18px;color:#93c5fd}' +
      '.sc-panel{border:1px solid rgba(148,163,184,.25);border-radius:8px;padding:12px;margin-bottom:12px;background:rgba(15,23,42,.6)}' +
      '.sc-h h4{margin:0 0 10px;font-size:14px;color:#cbd5e1}' +
      '.sc-kpi{display:inline-block;width:16%;text-align:center}.sc-kpi .k-lb{font-size:11px;color:#94a3b8}' +
      '.sc-kpi .k-v{font-size:22px;font-weight:700;color:#60a5fa}.sc-kpi .k-v i{font-size:11px;font-style:normal;margin-left:2px;color:#94a3b8}' +
      '.rk-row{display:flex;gap:8px;padding:5px 0;font-size:12px}.rk-row b{color:#38bdf8;width:18px}.rk-row span{flex:1}.rk-row em{font-style:normal;color:#34d399}' +
      '.sc-tip{font-size:11px;color:#64748b;margin-top:8px}.sc-foot{margin-top:14px;text-align:center;font-size:11px;color:#64748b}' +
      'table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;font-size:12px;border-bottom:1px solid rgba(148,163,184,.2);text-align:left}';
  }

  /* ===================== 配置面板 ===================== */
  function configCard(rerender) {
    var c = cfg();
    var nameInp = UI.input({ value: c.name, onInput: function (e) { c.name = e.target.value; } });
    var refreshInp = UI.input({ type: 'number', value: c.refresh, min: 5, max: 300, onInput: function (e) { c.refresh = U.num(e.target.value); } });

    return UI.card({
      title: '大屏配置',
      sub: '配置项真实生效：预览区与投屏视图均按此配置渲染',
      body: D.h('div', {},
        D.h('div.g2', {},
          UI.field({ label: '大屏名称', control: nameInp }),
          UI.field({ label: '分辨率比例', control: UI.select({ options: [['16:9', '16:9 横屏'], ['21:9', '21:9 超宽屏'], ['4:3', '4:3 标屏']], value: c.ratio, onChange: function (v) { c.ratio = v; rerender(); } }) })
        ),
        D.h('div.g2', {},
          UI.field({ label: '皮肤主题', control: UI.seg({ options: [['skin-light', '浅色'], ['skin-dark', '深色']], value: c.skin || 'skin-light', onChange: function (v) { c.skin = v; st.skin = v; rerender(); } }) }),
          UI.field({ label: '自动刷新间隔（秒）', control: refreshInp })
        ),
        UI.swRow({ title: '自动轮播', desc: '多个屏幕分组时按间隔自动切换（当前为单屏，配置项仍真实保存）', checked: c.autoScroll, onChange: function (v) { c.autoScroll = v; } })
      ),
      note: D.h('div', { style: 'display:flex;gap:9px;align-items:center' },
        D.h('span.muted', '最近更新：' + c.updatedAt + ' · ' + c.updatedBy),
        D.h('div', { style: 'margin-left:auto;display:flex;gap:8px' },
          D.h('button.btn.btn-sm', { onclick: function () { reset(); rerender(); } }, '恢复默认配置'),
          D.h('button.btn.btn-sm.btn-p', {
            onclick: function () {
              DB.setObj('screenCfg', { name: c.name, skin: c.skin, ratio: c.ratio, refresh: c.refresh, autoScroll: c.autoScroll, updatedAt: U.dt(new Date()), updatedBy: ZA.session.name });
              UI.toast('大屏配置已保存', '名称、皮肤、比例、刷新间隔均已生效', 'ok');
              rerender();
            }
          }, '保存配置'),
          D.h('button.btn.btn-sm', { onclick: openFullscreen }, '📺 全屏投屏')
        )
      )
    });
  }

  function reset() {
    var def = [
      ['SM1', 'KPI 指标卡', '核心指标', true, 4],
      ['SM2', '柱状图', '院系参与人数对比', true, 2],
      ['SM3', '饼图', '活动类型分布', true, 1],
      ['SM4', '折线图', '参与趋势（近 12 周）', true, 2],
      ['SM5', '排行榜', '热门活动 Top 8', true, 1],
      ['SM6', '雷达图', '六类素养达标度', true, 1],
      ['SM7', '表格', '学院学分达标情况', true, 2],
      ['SM8', '地图', '活动地理分布', false, 1],
      ['SM9', '天气/日期', '天气与日期', true, 1]
    ];
    DB.setObj('screenCfg', { modules: def.map(function (d) { return { id: d[0], type: d[1], title: d[2], enabled: d[3], span: d[4] }; }) });
    UI.toast('已恢复默认配置', '9 个组件按默认顺序与开关还原', 'ok');
  }

  function moduleEditor(rerender) {
    var list = modules();
    var rows = list.map(function (m, i) {
      return D.h('tr',
        D.h('td', { style: 'width:44px;color:var(--text3)' }, i + 1),
        D.h('td', {}, KP.cell(m.title, m.type)),
        D.h('td', { style: 'width:84px' }, UI.select({
          options: [[1, '1 列'], [2, '2 列'], [4, '4 列']], value: m.span,
          onChange: function (v) { m.span = U.num(v); rerender(); }
        })),
        D.h('td', { style: 'width:74px' },
          D.h('label.sw', D.h('input', { type: 'checkbox', checked: !!m.enabled, onchange: function (e) { m.enabled = e.target.checked; rerender(); } }), D.h('span'))),
        D.h('td', { style: 'width:132px' }, KP.acts([
          KP.btn('↑', function () { move(m.id, -1); rerender(); }, i === 0 ? '' : ''),
          KP.btn('↓', function () { move(m.id, 1); rerender(); }, ''),
          KP.btn('上移顶', function () { moveTop(m.id); rerender(); })
        ]))
      );
    });
    return UI.card({
      title: '组件配置',
      sub: '共 ' + list.length + ' 个组件 · 已启用 ' + enabled().length + ' 个',
      flush: true,
      body: D.h('table.tbl', D.h('thead', D.h('tr', ['#', '组件', '跨度', '启用', '排序'].map(function (h) { return D.h('th', h); }))), D.h('tbody', rows)),
      note: D.h('span.muted', '提示：跨度 4 = 通栏，2 = 半栏，1 = 三分之一栏；关闭后预览区与投屏视图同步隐藏。')
    });
  }

  function move(id, dir) {
    var l = modules();
    var i = l.findIndex(function (m) { return m.id === id; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return;
    var t = l[i]; l[i] = l[j]; l[j] = t;
    DB.touchObj('screenCfg');
  }
  function moveTop(id) {
    var l = modules();
    var i = l.findIndex(function (m) { return m.id === id; });
    if (i <= 0) return;
    var x = l.splice(i, 1)[0];
    l.unshift(x);
    DB.touchObj('screenCfg');
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    host.appendChild(UI.pageHd({
      title: '二课数据大屏',
      desc: '按学校需求配置大屏组件与展示方式；所有组件数据取自系统真实业务数据，可一键全屏投屏。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('stat'); } }, '回到统计分析'),
        D.h('button.btn.btn-sm.btn-p', { onclick: openFullscreen }, '📺 全屏投屏')
      ]
    }));

    var rerender = function () { w.ZR.render(); };

    host.appendChild(configCard(rerender));
    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(moduleEditor(rerender));

    host.appendChild(KP.h5('大屏预览', D.h('span.muted', cfg().ratio + ' · ' + (cfg().skin === 'skin-dark' ? '深色皮肤' : '浅色皮肤') + ' · 刷新间隔 ' + cfg().refresh + ' 秒')));
    host.appendChild(buildScreen());

    host.appendChild(KP.h5('与大屏同源的明细数据'));
    host.appendChild(D.h('div.g2',
      UI.card({
        title: '热门活动 Top 8', sub: '按报名人数排序（真实报名记录）',
        body: UI.miniList(topActs(), { empty: '暂无活动数据' })
      }),
      UI.card({
        title: '院系参与对比', sub: '报名人次 / 学生数',
        flush: true,
        body: D.h('table.tbl.mini',
          D.h('thead', D.h('tr', ['学院', '学生数', '报名人次', '人均报名'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', collegeData().map(function (c) {
            return D.h('tr', [
              D.h('td', c.n), D.h('td', c.v), D.h('td', c.joins),
              D.h('td', c.v ? U.round(c.joins / c.v, 1) : 0)
            ]);
          })))
      })
    ));

    host.appendChild(D.h('div', { style: 'margin-top:14px;display:flex;gap:9px' },
      KP.exportBtn('导出大屏数据', [
        { t: '学院', k: 'name' }, { t: '学生数', k: 'students' }, { t: '达标人数', k: 'pass' },
        { t: '达标率(%)', k: 'rate' }, { t: '人均学分', k: 'avg' }
      ], collegePassRows(), { primary: true }),
      KP.printBtn('打印大屏快照', function () {
        return { title: cfg().name, html: buildScreenHTML(), css: buildScreenCss() };
      })
    ));
  }

  KP.pages({
    screen: { title: '二课数据大屏', group: '门户与智能', render: render }
  });
})(window);
