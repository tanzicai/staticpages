/* ==========================================================================
   grade.js —— 成绩管理（成绩汇总 / 成绩明细 / 考核方案 / 达标规则 / 学生成绩单）
   对应演示项【2.1 第三步】与【1.1 第三步】：
   · 考核方案设置：达标线、六大类别类别标准、等级换算、认定规则、适用范围、
     启用/停用/设为默认 —— 全部真实写入数据，改动即时影响成绩汇总与达标判定。
   · 成绩汇总查询：按学院/专业/班级/年级/达标状态筛选，展示累计学分、六大类别达成、
     等级、达标状态，支持一键导出；点击学生可查看成绩明细。
   · 学生端成绩单预览 + PDF 导出：复用成绩单模板模块的同一套渲染逻辑，
     切换模板后预览与导出内容实时跟随（真实调起浏览器打印另存为 PDF）。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = {
    tab: 'sum',
    kw: '', college: '', major: '', classId: '', grade: '', pass: '', cat: '', source: '',
    basis: 'all', tplId: '', pageSize: 15, planId: ''
  };

  /* ===================== 取数 ===================== */
  function scheme() { return st.planId ? (DB.get('schemes', st.planId) || DB.scheme()) : DB.scheme(); }
  function need() { var sc = scheme(); return U.num(sc ? (sc.standard || {}).pass || 6 : 6); }
  function excellent() { var sc = scheme(); return U.num(sc ? (sc.standard || {}).excellent || 8 : 8); }

  /** 学生在当前方案下的综合成绩视图 */
  function rowOf(agg) {
    var sc = scheme();
    var nd = need();
    var total = U.num(agg.total);
    var std = (sc && sc.catStandard) || {};
    var catRows = (DB.data.cats || []).map(function (c) {
      var n = U.num(std[c.name] || 0);
      var got = U.num(agg.cat[c.name] || 0);
      return { name: c.name, color: c.color, got: got, need: n, ok: n ? got >= n * 0.6 : true, full: n ? got >= n : true };
    });
    var weak = catRows.filter(function (x) { return x.need > 0 && !x.ok; });
    var level = gradeLevelOf(total, sc);
    return {
      id: agg.studentId, agg: agg, total: total, need: nd,
      pct: nd ? U.clamp(total / nd * 100, 0, 100) : 0,
      pass: total >= nd && !weak.length,
      level: level.level, point: level.point,
      cats: catRows, weak: weak
    };
  }
  function gradeLevelOf(total, sc) {
    var gs = (sc && sc.grades) || [];
    var hit = null;
    gs.forEach(function (g) {
      var min = U.num(g.min), max = U.num(g.max);
      if (total >= min && total <= max && !hit) hit = g;
    });
    if (!hit) {
      if (total >= excellent()) hit = { level: '优秀', point: 95 };
      else if (total >= need()) hit = { level: '合格', point: 65 };
      else hit = { level: '不合格', point: 50 };
    }
    return hit;
  }

  function students() {
    var list = KP.scopeFilter(DB.col('students'));
    return list;
  }
  function filtersActive() { return st.kw || st.college || st.major || st.classId || st.grade || st.pass || st.cat; }

  function sumRows() {
    var aggList = DB.agg();
    var byId = {};
    aggList.forEach(function (a) { byId[a.studentId] = a; });
    var rows = students().map(function (s) {
      var a = byId[s.id] || { studentId: s.id, total: 0, cat: {}, hours: 0, points: 0, records: 0, name: s.name, sno: s.sno, college: s.college, className: s.className, grade: s.grade };
      return rowOf(a);
    });
    if (st.kw) rows = rows.filter(function (r) { return U.hitAny([r.agg.name, r.agg.sno, r.agg.className, r.agg.college], st.kw); });
    if (st.college) rows = rows.filter(function (r) { return r.agg.college === st.college; });
    if (st.grade) rows = rows.filter(function (r) { return r.agg.grade === st.grade; });
    if (st.major) rows = rows.filter(function (r) { return r.agg.major === st.major; });
    if (st.classId) rows = rows.filter(function (r) { return r.agg.className === st.classId; });
    if (st.pass === 'pass') rows = rows.filter(function (r) { return r.pass; });
    if (st.pass === 'fail') rows = rows.filter(function (r) { return !r.pass; });
    if (st.pass === 'excellent') rows = rows.filter(function (r) { return r.total >= excellent(); });
    if (st.pass === 'warn') rows = rows.filter(function (r) { return r.total < need() * 0.75; });
    if (st.cat) rows = rows.filter(function (r) {
      return r.cats.some(function (x) { return x.name === st.cat && x.need > 0 && !x.ok; });
    });
    U.sortBy(rows, function (r) { return r.total; }, true);
    return rows;
  }

  function detailRows() {
    var stuIds = {};
    students().forEach(function (s) { stuIds[s.id] = s; });
    var list = DB.col('scoreRecs').filter(function (r) { return stuIds[r.studentId]; });
    if (st.kw) list = list.filter(function (r) {
      var s = stuIds[r.studentId] || {};
      return U.hitAny([s.name, s.sno, r.actTitle, r.cat], st.kw);
    });
    if (st.college) list = list.filter(function (r) { return (stuIds[r.studentId] || {}).college === st.college; });
    if (st.grade) list = list.filter(function (r) { return (stuIds[r.studentId] || {}).grade === st.grade; });
    if (st.major) list = list.filter(function (r) { return (stuIds[r.studentId] || {}).major === st.major; });
    if (st.classId) list = list.filter(function (r) { return (stuIds[r.studentId] || {}).className === st.classId; });
    if (st.cat) list = list.filter(function (r) { return r.cat === st.cat; });
    if (st.source) list = list.filter(function (r) { return r.source === st.source; });
    U.sortBy(list, function (r) { return r.at; }, true);
    return list;
  }

  /* ===================== 筛选条 ===================== */
  function collegeOpts() {
    var l = DB.col('colleges').filter(function (c) { return KP.inScope(c); });
    return [['', '全部学院']].concat(l.map(function (c) { return [c.name, c.name]; }));
  }
  function majorOpts() {
    var l = DB.col('majors') || [];
    if (st.college) l = l.filter(function (m) { return m.college === st.college || m.collegeName === st.college; });
    var names = [];
    l.forEach(function (m) { if (names.indexOf(m.name) < 0) names.push(m.name); });
    return [['', '全部专业']].concat(names.map(function (n) { return [n, n]; }));
  }
  function classOpts() {
    var l = DB.col('classes') || [];
    if (st.college) l = l.filter(function (c) { return c.college === st.college || c.collegeName === st.college; });
    if (st.major) l = l.filter(function (c) { return c.major === st.major || c.majorName === st.major; });
    var names = [];
    l.forEach(function (c) { if (names.indexOf(c.name) < 0) names.push(c.name); });
    return [['', '全部班级']].concat(names.map(function (n) { return [n, n]; }));
  }
  function catOpts() {
    return [['', '全部类别']].concat((DB.data.cats || []).map(function (c) { return [c.name, c.name]; }));
  }

  function filterBar(refresh) {
    return UI.filterBar([
      { type: 'input', ph: '姓名 / 学号 / 班级', value: st.kw, width: 190, onChange: function (v) { st.kw = v; refresh(); } },
      { type: 'select', options: collegeOpts(), value: st.college, onChange: function (v) { st.college = v; st.major = ''; st.classId = ''; refresh(); } },
      { type: 'select', options: majorOpts(), value: st.major, onChange: function (v) { st.major = v; st.classId = ''; refresh(); } },
      { type: 'select', options: classOpts(), value: st.classId, onChange: function (v) { st.classId = v; refresh(); } },
      { type: 'select', options: [['', '全部年级']].concat((DB.data.meta.grades || []).map(function (g) { return [g, g]; })), value: st.grade, onChange: function (v) { st.grade = v; refresh(); } },
      { type: 'select', options: catOpts(), value: st.cat, onChange: function (v) { st.cat = v; refresh(); } }
    ], {
      right: [
        st.tab === 'sum' ? UI.select({
          options: [['', '全部状态'], ['pass', '已达标'], ['fail', '未达标'], ['excellent', '优秀（≥' + excellent() + '）'], ['warn', '预警线以下（<' + (need() * 0.75).toFixed(1) + '）']],
          value: st.pass, onChange: function (v) { st.pass = v; refresh(); }
        }) : UI.select({
          options: [['', '全部来源'], ['活动认定', '活动认定'], ['分值申报', '分值申报'], ['历史数据导入', '历史数据导入']],
          value: st.source, onChange: function (v) { st.source = v; refresh(); }
        }),
        KP.exportBtn('导出当前结果', null, function () { return exportRows(); }, {})
      ]
    });
  }
  function exportRows() {
    if (st.tab === 'sum') {
      var rows = sumRows();
      UI.exportCSV('第二课堂成绩汇总_' + U.d(new Date()),
        [{ t: '学号', k: 'sno' }, { t: '姓名', k: 'name' }, { t: '学院', k: 'college' }, { t: '专业', k: 'major' }, { t: '班级', k: 'className' },
        { t: '累计学分', raw: function (r) { return r.total.toFixed(2); } },
        { t: '认定学时', raw: function (r) { return U.num(r.agg.hours); } },
        { t: '认定积分', raw: function (r) { return U.num(r.agg.points); } },
        { t: '等级', k: 'level' }, { t: '是否达标', raw: function (r) { return r.pass ? '已达标' : '未达标'; } },
        { t: '未达类别', raw: function (r) { return r.weak.map(function (x) { return x.name; }).join('、') || '—'; } }],
        rows.map(function (r) {
          return { sno: r.agg.sno, name: r.agg.name, college: r.agg.college, major: r.agg.major, className: r.agg.className, total: r.total, agg: r.agg, level: r.level, pass: r.pass, weak: r.weak };
        }));
      return true;
    }
    var d = detailRows();
    UI.exportCSV('第二课堂成绩明细_' + U.d(new Date()),
      [{ t: '学号', raw: function (r) { return (DB.get('students', r.studentId) || {}).sno || ''; } },
      { t: '姓名', raw: function (r) { return (DB.get('students', r.studentId) || {}).name || ''; } },
      { t: '类别', k: 'cat' }, { t: '项目名称', k: 'actTitle' }, { t: '级别', k: 'level' },
      { t: '认定学分', k: 'credit' }, { t: '认定学时', k: 'hours' }, { t: '认定积分', k: 'points' },
      { t: '来源', k: 'source' }, { t: '认定时间', k: 'at' }, { t: '状态', k: 'status' }], d);
    return true;
  }

  /* ===================== 顶部 KPI ===================== */
  function kpis() {
    var rows = sumRows();
    var n = rows.length || 1;
    var total = rows.reduce(function (s, r) { return s + r.total; }, 0);
    var passN = rows.filter(function (r) { return r.pass; }).length;
    var excellentN = rows.filter(function (r) { return r.total >= excellent(); }).length;
    var warnN = rows.filter(function (r) { return r.total < need() * 0.75; }).length;
    return KP.kpis([
      { label: '统计学生数', num: rows.length, unit: '人', ic: '👥', fg: '#2563eb', bg: '#eff6ff' },
      { label: '人均学分', num: Math.round(total / n * 100) / 100, unit: '学分', ic: '📘', fg: '#0891b2', bg: '#ecfeff' },
      { label: '达标人数', num: passN, unit: '人', ic: '✅', fg: '#059669', bg: '#ecfdf5', foot: '达标率 ' + U.pct(passN, rows.length) },
      { label: '优秀人数', num: excellentN, unit: '人', ic: '🏅', fg: '#7c3aed', bg: '#f5f3ff', foot: '≥ ' + excellent().toFixed(1) + ' 学分' },
      { label: '预警线以下', num: warnN, unit: '人', ic: '⚠️', fg: '#dc2626', bg: '#fef2f2', foot: '< ' + (need() * 0.75).toFixed(1) + ' 学分' }
    ], 'g5');
  }

  /* ===================== 学生成绩单预览 / PDF 导出 ===================== */
  function sheetModal(stu, tplId) {
    var ZTPL = w.ZTPL;
    var tpl = tplId ? DB.get('tpls', tplId) : (ZTPL ? ZTPL.defaultTpl() : DB.col('tpls')[0]);
    if (ZTPL) ZTPL.ensureStyle();
    var bodyHost = D.h('div');

    function paint() {
      D.fill(bodyHost, null);
      var t = st.tplId ? DB.get('tpls', st.tplId) : tpl;
      var html = ZTPL ? ZTPL.sheetHTML(t, stu, { basis: st.basis, limit: 30 }) : '<div class="req-note">成绩单渲染模块未就绪</div>';
      var wrap = D.h('div', { html: html });
      bodyHost.appendChild(wrap);
      bodyHost.appendChild(D.h('div', { style: 'margin-top:12px' },
        KP.note('导出将调起浏览器打印窗口，在「目标打印机」中选择「另存为 PDF」即可得到带印章与版式的成绩单文件。')
      ));
    }
    paint();

    var m = UI.modal({
      title: '第二课堂成绩单预览 · ' + stu.name,
      sub: stu.sno + ' · ' + stu.className,
      size: 'wide',
      body: [
        D.h('div', { style: 'display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:12px' },
          D.h('span.muted', '成绩单版式'),
          UI.select({
            options: DB.col('tpls').filter(function (t) { return t.enabled; }).map(function (t) { return [t.id, t.name]; }),
            value: (st.tplId || tpl.id),
            onChange: function (v) { st.tplId = v; paint(); }
          }),
          D.h('span.muted', '统计口径'),
          UI.seg({
            options: [['all', '全部记录'], ['2025-2026-1', '本学期'], ['2024-2025-1', '上学年']],
            value: st.basis === 'all' ? 'all' : st.basis,
            onChange: function (v) { st.basis = v; paint(); }
          })
        ),
        bodyHost
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        D.h('button.btn.btn-sm', {
          onclick: function () {
            UI.printHTML('第二课堂成绩单 · ' + stu.name + '（' + stu.sno + '）',
              ZTPL.sheetHTML(st.tplId ? DB.get('tpls', st.tplId) : tpl, stu, { basis: st.basis, limit: 200 }), '');
          }
        }, '🖨 导出 PDF'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var t = st.tplId ? DB.get('tpls', st.tplId) : tpl;
            UI.printHTML('第二课堂成绩单 · ' + stu.name + '（' + stu.sno + '）',
              ZTPL.sheetHTML(t, stu, { basis: st.basis, limit: 200 }), '');
          }
        }, '按当前版式导出')
      ]
    });
  }

  /** 学生成绩明细弹窗（含六大类别达成雷达与逐条认定记录） */
  function stuModal(stu) {
    var agg = DB.aggOf(stu.id) || { total: 0, cat: {}, hours: 0, points: 0, records: 0 };
    var sc = scheme();
    var recs = DB.recsOf(stu.id);
    var cats = (DB.data.cats || []).map(function (c) {
      var std = U.num(((sc || {}).catStandard || {})[c.name] || 0);
      var got = U.num(agg.cat[c.name] || 0);
      return { name: c.name, color: c.color, got: got, std: std, ok: std ? got >= std : true };
    });
    var m = UI.modal({
      title: '成绩明细 · ' + stu.name,
      sub: stu.sno + ' · ' + stu.college + ' · ' + stu.className,
      size: 'wide',
      body: [
        KP.kpis([
          { label: '累计学分', num: U.num(agg.total), unit: '学分', ic: '📘', fg: '#2563eb', bg: '#eff6ff' },
          { label: '认定学时', num: U.num(agg.hours), unit: '学时', ic: '⏱', fg: '#0891b2', bg: '#ecfeff' },
          { label: '认定积分', num: U.num(agg.points), unit: '分', ic: '⭐', fg: '#f59e0b', bg: '#fff8eb' },
          { label: '认定记录', num: U.num(agg.records || recs.length), unit: '条', ic: '📄', fg: '#7c3aed', bg: '#f5f3ff' },
          { label: '是否达标', num: U.num(agg.total) >= need() ? '已达标' : '未达标', ic: '✅', fg: U.num(agg.total) >= need() ? '#059669' : '#dc2626', bg: U.num(agg.total) >= need() ? '#ecfdf5' : '#fef2f2' }
        ], 'g5'),
        KP.h5('六大素养类别达成'),
        D.h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:9px' }, cats.map(function (x) {
          return D.h('div', { style: 'border:1px solid var(--line);border-radius:10px;padding:10px 12px' },
            D.h('div', { style: 'display:flex;align-items:center;justify-content:space-between' },
              D.h('span', { style: 'font-weight:650;font-size:12.5px;color:' + x.color }, x.name),
              D.h('span', { style: 'font-size:11.5px;color:var(--text3)' }, x.got.toFixed(2) + ' / ' + x.std.toFixed(2))),
            D.h('div', { style: 'margin-top:7px' }, UI.pg(x.std ? U.clamp(x.got / x.std * 100, 0, 100) : 0, x.ok ? '' : 'warn')),
            D.h('div', { style: 'font-size:11px;margin-top:5px;color:' + (x.ok ? '#059669' : '#dc2626') }, x.ok ? '已达标' : '未达标')
          );
        })),
        KP.h5('认定记录明细（' + recs.length + ' 条）'),
        UI.table({
          mini: true, noCard: true,
          cols: [
            { t: '认定项目', render: function (r) { return KP.cell(r.actTitle || '—', r.actId ? '活动认定' : r.source); } },
            { t: '类别', w: 90, render: function (r) { return KP.catTag(r.cat); } },
            { t: '级别', w: 64, k: 'level' },
            { t: '学分', w: 60, render: function (r) { return KP.numCell(r.credit, ''); } },
            { t: '学时', w: 60, render: function (r) { return KP.numCell(r.hours, ''); } },
            { t: '积分', w: 60, render: function (r) { return KP.numCell(r.points, ''); } },
            { t: '来源', w: 96, k: 'source' },
            { t: '认定时间', w: 148, k: 'at' },
            { t: '状态', w: 78, render: function (r) { return KP.status(r.status); } }
          ],
          rows: recs, empty: '该生暂无成绩认定记录'
        })
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); sheetModal(stu); } }, '📄 成绩单预览 / 导出')
      ]
    });
  }

  /* ===================== 页签一：成绩汇总 ===================== */
  function tabSum(host) {
    host.appendChild(kpis());
    host.appendChild(D.h('div', { style: 'height:12px' }));

    var cols = [
      { t: '学生', render: function (r) { return KP.who(r.agg.name, r.agg.sno); } },
      { t: '学院 / 专业', render: function (r) { return KP.cell(r.agg.college, r.agg.major); } },
      { t: '班级', w: 148, render: function (r) { return KP.cell(r.agg.className, r.agg.grade); } },
      { t: '累计学分', w: 132, render: function (r) { return KP.progCell(r.pct, r.total.toFixed(2) + ' / ' + r.need.toFixed(1)); } },
      { t: '学时 / 积分', w: 112, center: true, render: function (r) { return D.h('div', { style: 'font-size:12px' }, U.num(r.agg.hours) + ' 学时 / ' + U.num(r.agg.points) + ' 分'); } },
      { t: '类别达成', w: 190, render: function (r) {
        return D.h('div', { style: 'display:flex;gap:3px;flex-wrap:wrap' }, r.cats.map(function (x) {
          if (!x.need) return D.h('span', { title: x.name + '（不适用）', style: 'width:12px;height:12px;border-radius:3px;background:#eef3fa;display:inline-block' });
          return D.h('span', {
            title: x.name + '：' + x.got.toFixed(1) + ' / ' + x.need.toFixed(1) + (x.full ? '（已达标）' : (x.ok ? '（基本达标）' : '（未达标）')),
            style: 'width:12px;height:12px;border-radius:3px;display:inline-block;background:' + (x.full ? x.color : (x.ok ? x.color : '#e2e8f0')) + ';opacity:' + (x.ok ? '1' : '.45') });
        }));
      } },
      { t: '等级', w: 78, center: true, render: function (r) { return r.level === '优秀' ? KP.status('优秀') : UI.tag(r.level, r.level === '不合格' ? 'tag-err' : ''); } },
      { t: '达标状态', w: 92, center: true, render: function (r) { return r.pass ? KP.status('已达标') : KP.status('未达标'); } },
      { t: '操作', w: 150, render: function (r) {
        return KP.acts([
          KP.btn('明细', function () { stuModal(DB.get('students', r.id)); }),
          KP.btn('成绩单', function () { sheetModal(DB.get('students', r.id)); })
        ]);
      } }
    ];

    KP.lister({
      host: host, noCard: true,
      title: '成绩汇总', sub: '按当前考核方案「' + ((scheme() || {}).name || '—') + '」统计 · 达标线 ' + need().toFixed(1) + ' 学分',
      filters: filterBar,
      rows: function () { return sumRows(); },
      cols: cols, pageSize: st.pageSize,
      empty: '没有符合条件的学生成绩', emptySub: '请调整筛选条件后重试',
      footNote: '学分数据由「活动认定 + 分值申报 + 历史导入」三类记录自动汇总，与成绩单、预警名单同源'
    });
  }

  /* ===================== 页签二：成绩明细 ===================== */
  function tabDetail(host) {
    KP.lister({
      host: host, noCard: true,
      title: '成绩明细', sub: '逐条认定记录 · 与成绩单导出内容一致',
      filters: filterBar,
      rows: function () { return detailRows(); },
      cols: [
        { t: '学生', render: function (r) { var s = DB.get('students', r.studentId) || {}; return KP.who(s.name, s.sno); } },
        { t: '班级', w: 148, render: function (r) { var s = DB.get('students', r.studentId) || {}; return KP.cell(s.className, s.college); } },
        { t: '认定项目', render: function (r) { return KP.cell(r.actTitle || '—', r.actId ? '关联活动 ' + r.actId : r.source); } },
        { t: '类别', w: 92, render: function (r) { return KP.catTag(r.cat); } },
        { t: '级别', w: 62, center: true, k: 'level' },
        { t: '学分', w: 62, center: true, render: function (r) { return KP.numCell(r.credit, ''); } },
        { t: '学时', w: 62, center: true, render: function (r) { return KP.numCell(r.hours, ''); } },
        { t: '积分', w: 62, center: true, render: function (r) { return KP.numCell(r.points, ''); } },
        { t: '来源', w: 104, k: 'source' },
        { t: '认定时间', w: 148, k: 'at' },
        { t: '状态', w: 78, center: true, render: function (r) { return KP.status(r.status); } }
      ],
      pageSize: 15,
      empty: '暂无成绩明细记录'
    });
  }

  /* ===================== 页签三：考核方案 ===================== */
  function tabPlan(host) {
    host.appendChild(D.h('div.card', D.h('div.card-b', { style: 'padding:13px 15px' },
      D.h('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap' },
        UI.icoBox('📘', '#2563eb', '#eff6ff', 36),
        D.h('div', { style: 'flex:1;min-width:220px' },
          D.h('div', { style: 'font-weight:700;font-size:14px' }, '第二课堂成绩考核方案'),
          D.h('div', { style: 'font-size:12px;color:var(--text3);margin-top:3px' },
            '方案决定达标线、六大类别类别标准、等级换算与认定规则。修改后立即影响「成绩汇总」「学生成绩单」「预警名单」三处口径。')),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { planEdit(null); } }, '＋ 新增方案')
      )
    )));
    host.appendChild(D.h('div', { style: 'height:12px' }));

    host.appendChild(UI.table({
      cols: [
        { t: '方案名称', render: function (r) { return KP.cell(r.name, r.id + ' · 适用 ' + ((r.scope || {}).grades || []).join('/') + ' · ' + ((r.scope || {}).colleges || []).join('/')); } },
        { t: '达标线', w: 86, center: true, render: function (r) { return KP.numCell(U.num((r.standard || {}).pass), '学分'); } },
        { t: '优秀线', w: 86, center: true, render: function (r) { return KP.numCell(U.num((r.standard || {}).excellent), '学分'); } },
        { t: '预警线', w: 86, center: true, render: function (r) { return KP.numCell(U.num((r.standard || {}).warnLine), '学分'); } },
        { t: '类别达标线', render: function (r) {
          return D.h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap' }, (DB.data.cats || []).map(function (c) {
            return D.h('span.tag', { style: 'background:' + c.lc + ';color:' + c.color }, c.name + ' ' + U.num(((r.catStandard || {})[c.name] || 0)).toFixed(1));
          }));
        } },
        { t: '适用范围', w: 168, render: function (r) { return KP.cell(((r.scope || {}).terms || []).join('、') || '—', ((r.scope || {}).objects || '')); } },
        { t: '状态', w: 96, center: true, render: function (r) {
          return D.h('div', { style: 'display:flex;gap:5px;justify-content:center' }, KP.status(r.enabled ? '启用' : '停用'), r.isDefault ? KP.status('优秀') && UI.tag('默认', 'tag-purple') : null);
        } },
        { t: '操作', w: 240, render: function (r) {
          return KP.acts([
            KP.btn('编辑', function () { planEdit(r); }),
            KP.btn(r.enabled ? '停用' : '启用', function () {
              DB.update('schemes', r.id, { enabled: !r.enabled });
              UI.toast(r.enabled ? '方案已停用' : '方案已启用', r.name, 'ok');
              w.ZR.render();
            }),
            r.isDefault ? null : KP.btn('设为默认', function () {
              DB.col('schemes').forEach(function (x) { if (x.isDefault) DB.update('schemes', x.id, { isDefault: false }); });
              DB.update('schemes', r.id, { isDefault: true });
              UI.toast('已设为默认方案', '成绩汇总与成绩单将按该方案判定', 'ok');
              w.ZR.render();
            }),
            KP.btn('查看口径', function () { planView(r); })
          ]);
        } }
      ],
      rows: DB.col('schemes'),
      empty: '暂无考核方案'
    }));
  }

  function planView(sc) {
    var m = UI.modal({
      title: '考核方案口径 · ' + sc.name, size: 'wide',
      body: [
        KP.kpis([
          { label: '达标线', num: U.num((sc.standard || {}).pass), unit: '学分', ic: '🎯', fg: '#2563eb', bg: '#eff6ff' },
          { label: '优秀线', num: U.num((sc.standard || {}).excellent), unit: '学分', ic: '🏅', fg: '#7c3aed', bg: '#f5f3ff' },
          { label: '预警线', num: U.num((sc.standard || {}).warnLine), unit: '学分', ic: '⚠️', fg: '#dc2626', bg: '#fef2f2' },
          { label: '学分换算', num: U.num((sc.convert || {}).pointsPerCredit), unit: '积分/学分', ic: '🔄', fg: '#0891b2', bg: '#ecfeff' }
        ], 'g4'),
        KP.h5('六大类别达标线'),
        UI.table({
          mini: true, noCard: true,
          cols: [
            { t: '素养类别', render: function (r) { return KP.catTag(r.name); } },
            { t: '类别达标线', w: 110, center: true, render: function (r) { return KP.numCell(r.std, '学分'); } },
            { t: '基本达标线（60%）', w: 140, center: true, render: function (r) { return KP.numCell(r.std * 0.6, '学分'); } },
            { t: '当前达标人数', center: true, render: function (r) { return KP.numCell(r.pass, '人') + D.h('span.muted', ' / ' + r.total + ' 人'); } }
          ],
          rows: (DB.data.cats || []).map(function (c) {
            var std = U.num(((sc.catStandard || {})[c.name] || 0));
            var cnt = 0, tot = 0;
            DB.agg().forEach(function (a) {
              if (!students().some(function (s) { return s.id === a.studentId; })) return;
              tot++;
              if (U.num(a.cat[c.name] || 0) >= std * 0.6) cnt++;
            });
            return { name: c.name, std: std, pass: cnt, total: tot };
          })
        }),
        KP.h5('等级换算'),
        UI.table({
          mini: true, noCard: true,
          cols: [
            { t: '等级', render: function (r) { return UI.tag(r.level, r.level === '优秀' ? 'tag-purple' : (r.level === '不合格' ? 'tag-err' : '')); } },
            { t: '学分区间', center: true, render: function (r) { return U.num(r.min).toFixed(1) + ' — ' + (U.num(r.max) > 100 ? '不限' : U.num(r.max).toFixed(2)); } },
            { t: '折算绩点', w: 110, center: true, render: function (r) { return KP.numCell(r.point, ''); } }
          ],
          rows: sc.grades || []
        }),
        KP.h5('认定规则'),
        UI.kv(Object.keys(sc.rules || {}).map(function (k) {
          var LAB = { total: '总学分规则', creditType: '学分构成', index: '质量系数', project: '单项目上限', merge: '重复申报处理' };
          return [LAB[k] || k, sc.rules[k]];
        }))
      ],
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); } }, '关闭')]
    });
  }

  function planEdit(sc) {
    var isNew = !sc;
    var f = {
      name: UI.input({ value: sc ? sc.name : '', placeholder: '如：2027 级第二课堂成绩考核方案' }),
      pass: UI.input({ type: 'number', step: '0.5', value: sc ? (sc.standard || {}).pass : 6 }),
      excellent: UI.input({ type: 'number', step: '0.5', value: sc ? (sc.standard || {}).excellent : 8 }),
      warnLine: UI.input({ type: 'number', step: '0.5', value: sc ? (sc.standard || {}).warnLine : 4.5 }),
      ppc: UI.input({ type: 'number', value: sc ? (sc.convert || {}).pointsPerCredit : 10 }),
      hpc: UI.input({ type: 'number', value: sc ? (sc.convert || {}).hoursPerCredit : 16 })
    };
    var catInputs = {};
    (DB.data.cats || []).forEach(function (c) {
      catInputs[c.name] = UI.input({ type: 'number', step: '0.5', value: U.num(((sc || {}).catStandard || {})[c.name] || c.credit) });
    });
    var pickedGrades = sc ? ((((sc.scope || {}).grades) || []).slice()) : ['2026级'];
    var scopeCells = UI.chips({
      multi: true, value: pickedGrades,
      options: (DB.data.meta.grades || []).map(function (g) { return g; }),
      onChange: function (vals) { pickedGrades = vals.slice(); }
    });

    var m = UI.formModal({
      title: isNew ? '新增考核方案' : '编辑考核方案', size: 'wide',
      intro: '达标线、类别达标线与等级换算将直接决定成绩单的「是否达标」结论与预警名单，请谨慎调整。',
      fields: [
        { label: '方案名称', control: f.name, required: true, span: 2 },
        { label: '总达标线（学分）', control: f.pass, required: true },
        { label: '优秀线（学分）', control: f.excellent, required: true },
        { label: '预警线（学分）', control: f.warnLine, hint: '低于该线自动进入预警名单' },
        { label: '适用范围（年级）', control: scopeCells, span: 2 }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var name = f.name.value.trim();
            if (!name) { UI.toast('请填写方案名称', '', 'warn'); return; }
            var pass = U.num(f.pass.value);
            if (pass <= 0) { UI.toast('达标线需大于 0', '', 'warn'); return; }
            var cat = {};
            Object.keys(catInputs).forEach(function (k) { cat[k] = U.num(catInputs[k].value); });
            var catSum = Object.keys(cat).reduce(function (s, k) { return s + cat[k]; }, 0);
            var patch = {
              name: name,
              standard: { total: pass, pass: pass, excellent: U.num(f.excellent.value), warnLine: U.num(f.warnLine.value) },
              catStandard: cat,
              convert: { pointsPerCredit: U.num(f.ppc.value), hoursPerCredit: U.num(f.hpc.value) },
              scope: { colleges: (sc ? ((sc.scope || {}).colleges) : ['全部']) || ['全部'], grades: pickedGrades.slice(), terms: (sc ? ((sc.scope || {}).terms) : ['2026-2027-1', '2026-2027-2']), objects: '全体学生' }
            };
            if (isNew) {
              DB.insert('schemes', Object.assign({
                id: 'SC' + U.pad(DB.col('schemes').length + 1, 3),
                enabled: true, isDefault: false,
                creditTotal: pass,
                rules: { total: '各类别学分累加 ≥ ' + pass.toFixed(1) + ' 学分', creditType: '必修 + 选修', index: '校级 1.0 / 院级 0.8 / 班级 0.5', project: '单个项目最高 1.0 学分', merge: '同一活动只认定一次' },
                grades: [
                  { level: '优秀', min: U.num(f.excellent.value), max: 999, point: 95 },
                  { level: '良好', min: pass + 1, max: U.num(f.excellent.value) - 0.01, point: 85 },
                  { level: '中等', min: pass, max: pass + 0.99, point: 75 },
                  { level: '合格', min: pass - 1, max: pass - 0.01, point: 65 },
                  { level: '不合格', min: 0, max: pass - 1.01, point: 50 }
                ],
                createdAt: U.dt(new Date()), createdBy: w.ZA.session.name
              }, patch));
            } else {
              DB.update('schemes', sc.id, patch);
            }
            m.close();
            UI.toast(isNew ? '考核方案已新增' : '考核方案已保存', '类别达标线合计 ' + catSum.toFixed(1) + ' 学分，总达标线 ' + pass.toFixed(1) + ' 学分', 'ok');
            w.ZR.render();
          }
        }, isNew ? '创建方案' : '保存修改')
      ]
    });
    /* 类别达标线区块追加进表单（在适用范围之前） */
    var wrap = D.q('.frm', m.modal);
    if (wrap) {
      var block = D.h('div', { style: 'grid-column:1/-1' },
        D.h('div', { style: 'font-weight:700;font-size:13px;margin:4px 0 8px' }, '六大类别达标线（学分）'),
        D.h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px' }, (DB.data.cats || []).map(function (c) {
          return UI.field({ label: c.name, control: catInputs[c.name] });
        }))
      );
      wrap.appendChild(block);
      var extra = D.h('div', { style: 'grid-column:1/-1' },
        D.h('div', { style: 'font-weight:700;font-size:13px;margin:8px 0 8px' }, '学分换算'),
        D.h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' },
          UI.field({ label: '1 学分折算积分', control: f.ppc }),
          UI.field({ label: '1 学分折算学时', control: f.hpc }))
      );
      wrap.appendChild(extra);
    }
  }

  /* ===================== 页签四：达标规则书 ===================== */
  function tabRule(host) {
    var sc = scheme();
    host.appendChild(D.h('div.card', D.h('div.card-h', D.h('h3', '达标规则与预警口径'), D.h('span.mh-sub', (sc || {}).name || '')), D.h('div.card-b', {},
      UI.kv([
        ['总达标线', need().toFixed(1) + ' 学分'],
        ['优秀线', excellent().toFixed(1) + ' 学分'],
        ['预警线', U.num((sc || {}).standard && sc.standard.warnLine || 4.5).toFixed(1) + ' 学分'],
        ['学分构成', U.num(((sc || {}).convert || {}).pointsPerCredit) + ' 积分 = 1 学分，' + U.num(((sc || {}).convert || {}).hoursPerCredit) + ' 学时 = 1 学分'],
        ['判定逻辑', '累计学分 ≥ 达标线，且每一「有达标线」的类别不低于其达标线的 60%，方判为达标'],
        ['数据来源', '活动考核认定记录 + 分值申报审核通过自动赋分 + 历史数据导入，三者同源汇总']
      ]),
      KP.note('说明：本页展示的口径即系统实际判定口径。修改「考核方案」后，本页数值、成绩汇总的达标状态、学生成绩单的认定结论与预警名单会同步变化。')
    )));

    host.appendChild(D.h('div', { style: 'height:12px' }));

    /* 全类别交叉表：每个类别在各学院的达成情况 */
    var rows = sumRows();
    host.appendChild(UI.card({
      title: '类别达成交叉统计',
      sub: '按当前筛选条件统计各素养类别的达标人数与达成率',
      body: [UI.table({
        cols: [
          { t: '素养类别', render: function (r) { return KP.catTag(r.name); } },
          { t: '类别达标线', w: 110, center: true, render: function (r) { return KP.numCell(r.std, '学分'); } },
          { t: '已达标人数', w: 110, center: true, render: function (r) { return KP.numCell(r.ok, '人'); } },
          { t: '未达标人数', w: 110, center: true, render: function (r) { return KP.numCell(r.bad, '人'); } },
          { t: '类别达成率', w: 190, render: function (r) { return KP.progCell(U.rate(r.ok, r.total) * 100, U.pct(r.ok, r.total) + '（' + r.ok + '/' + r.total + '）'); } },
          { t: '人均学分', w: 110, center: true, render: function (r) { return KP.numCell(r.avg, ''); } }
        ],
        rows: (DB.data.cats || []).map(function (c) {
          var std = U.num(((sc || {}).catStandard || {})[c.name] || 0);
          var ok = 0, bad = 0, sum = 0;
          rows.forEach(function (r) {
            var got = U.num(r.agg.cat[c.name] || 0);
            sum += got;
            if (got >= std) ok++; else bad++;
          });
          return { name: c.name, std: std, ok: ok, bad: bad, total: rows.length || 1, avg: (sum / (rows.length || 1)) };
        })
      })]
    }));
  }

  /* ===================== 渲染入口 ===================== */
  function render(host, param) {
    /* 支持从全局搜索「学生」直达成绩单：#/grade/stu:S1001 */
    var directStu = null;
    if (param && /^stu:/.test(param)) directStu = DB.get('students', param.slice(4));
    st.college = st.college || '';

    host.appendChild(UI.pageHd({
      title: '成绩管理',
      sub: '考核方案设置 · 成绩汇总查询 · 学生成绩单预览与 PDF 导出',
      crumb: '成绩与评价 / 成绩管理',
      right: [
        KP.exportBtn('导出汇总', null, function () { st.tab = 'sum'; return exportRows(); }),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var s = DB.col('students')[0];
            sheetModal(s);
          }
        }, '⬇ 成绩单批量导出')
      ]
    }));

    var TABS = [['sum', '成绩汇总'], ['detail', '成绩明细'], ['plan', '考核方案'], ['rule', '达标规则']];
    host.appendChild(D.h('div', { style: 'margin-bottom:12px' }, UI.tabs({
      items: TABS.map(function (t) {
        var cnt = null;
        if (t[0] === 'sum') cnt = sumRows().length;
        if (t[0] === 'detail') cnt = detailRows().length;
        if (t[0] === 'plan') cnt = DB.col('schemes').length;
        return { k: t[0], n: t[1], cnt: cnt };
      }),
      cur: st.tab,
      onChange: function (v) { st.tab = v; w.ZR.render(); }
    })));

    var body = D.h('div');
    host.appendChild(body);
    if (st.tab === 'sum') tabSum(body);
    else if (st.tab === 'detail') tabDetail(body);
    else if (st.tab === 'plan') tabPlan(body);
    else tabRule(body);

    if (directStu) setTimeout(function () { stuModal(directStu); }, 40);
  }

  KP.pages({
    grade: { title: '成绩管理', group: '成绩与评价', render: render }
  });
})(window);
