/* ==========================================================================
   stat.js —— 统计与分析（单位统计 / 用户统计 / 成绩统计）
   对应演示项【2.2 第二步】：
   «演示单位统计、用户统计、成绩统计、二课数据大屏配置及热门活动排行、
     院系参与对比等展示。»
   · 单位统计：按二级学院 / 专业 / 班级三级下钻，展示参与人次、活动场次、
     人均学分、达标率，支持排序与导出。
   · 用户统计：按角色（学生 / 组织者 / 审核员 / 团总支书记）统计活跃度，
     学生侧展示学分分布、年级分布、素养雷达。
   · 成绩统计：学分配置口径（学分 / 学时 / 积分三口径切换）、类别达成率、
     学期趋势、达标与预警对比。
   · 全部图表由页面内筛选条件实时联动重算（不是静态图）。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = {
    tab: 'org',
    college: '',
    grade: '',
    metric: 'credit',
    dim: 'month',
    sort: 'total'
  };

  /* ===================== 公共取数 ===================== */

  /** 学生（已按当前角色数据范围裁剪） */
  function students() {
    var l = KP.scopeFilter(DB.col('students'));
    if (st.college) l = l.filter(function (s) { return s.college === st.college; });
    if (st.grade) l = l.filter(function (s) { return s.grade === st.grade; });
    return l;
  }
  /** 学生 Id 集合（供成绩记录过滤） */
  function sidSet() {
    var m = {};
    students().forEach(function (s) { m[s.id] = true; });
    return m;
  }
  /** 成绩记录（限定在所选学生范围内） */
  function recs() {
    var m = sidSet();
    return DB.col('scoreRecs').filter(function (r) { return m[r.studentId]; });
  }
  /** 活动（限定在所选学院范围） */
  function acts() {
    var l = KP.scopeFilter(DB.col('activities'));
    if (st.college) l = l.filter(function (a) { return !a.college || a.college === st.college || ZA.scope().collegeId === undefined; });
    return l;
  }
  function scheme() { return DB.scheme(); }
  /** 三口径换算（学分 1 : 学时 16 : 积分 10） */
  function toHours(v) { return v * 16; }
  function toPoints(v) { return v * 10; }
  function metric(v, unit) {
    if (st.metric === 'hour') return U.num(unit === 'hour' ? v : toHours(v));
    if (st.metric === 'point') return U.num(unit === 'point' ? v : toPoints(v));
    return U.num(v);
  }
  function metricLabel() {
    return st.metric === 'hour' ? '学时' : (st.metric === 'point' ? '积分' : '学分');
  }
  function metricValue(credit) {
    return st.metric === 'hour' ? U.round(credit * 16, 1) : (st.metric === 'point' ? U.round(credit * 10, 1) : U.round(credit, 1));
  }

  /* ===================== 顶部 KPI ===================== */
  function kpis() {
    var ss = students(), rs = recs(), as = acts();
    var agg = DB.agg(ss, rs);
    var total = U.sum(agg, function (x) { return x.total; });
    var sc = scheme();
    var passLine = U.num(sc ? sc.standard.pass : 6);
    var pass = agg.filter(function (x) { return x.total >= passLine; }).length;
    var enrolls = KP.pubList(as).reduce(function (s, a) { return s + U.num(a.enrolled); }, 0);
    var signRate = (function () {
      var m = sidSet();
      var si = DB.col('signins').filter(function (x) { return m[x.studentId]; });
      return U.pctNum(si.filter(function (x) { return x.status === '已签到' || x.status === '已签退'; }).length, si.length);
    })();
    return KP.kpis([
      { label: '统计学生数', num: ss.length, unit: '人', ic: '👥', fg: '#2563eb', bg: '#eff6ff', foot: '共 ' + DB.col('students').length + ' 人在校' },
      { label: '活动场次', num: KP.pubList(as).length, unit: '场', ic: '🎯', fg: '#059669', bg: '#ecfdf5', foot: '累计报名 ' + U.fmt(enrolls) + ' 人次' },
      {
        label: '人均' + metricLabel(), unit: metricLabel(), ic: '🎓', fg: '#7c3aed', bg: '#f5f3ff',
        num: ss.length ? metricValue(total / ss.length) : 0,
        foot: '总量 ' + U.fmt(metricValue(total)) + metricLabel()
      },
      { label: '学分达标率', num: U.pctNum(pass, agg.length), unit: '%', ic: '✅', fg: '#0d9488', bg: '#f0fdfa', foot: pass + ' / ' + agg.length + ' 人达标（≥' + passLine + ' 学分）' },
      { label: '活动签到率', num: signRate, unit: '%', ic: '📍', fg: '#d97706', bg: '#fff8eb', foot: '按签到记录实时计算' }
    ], 'g5');
  }

  /* ===================== 筛选条 ===================== */
  function filterBar() {
    var colleges = [{ v: '', n: '全部学院' }].concat(DB.col('colleges').map(function (c) { return { v: c.name, n: c.name }; }));
    return UI.filterBar([
      { type: 'select', options: colleges.map(function (c) { return [c.v, c.n]; }), value: st.college, onChange: function (v) { st.college = v; w.ZR.render(); } },
      {
        type: 'select', options: [{ v: '', n: '全部年级' }].concat((DB.data.meta.grades || []).map(function (g) { return { v: g, n: g }; })).map(function (c) { return [c.v, c.n]; }),
        value: st.grade, onChange: function (v) { st.grade = v; w.ZR.render(); }
      }
    ], {
      right: [
        D.h('span.muted', '统计口径'),
        UI.seg({
          options: [['credit', '学分'], ['hour', '学时'], ['point', '积分']],
          value: st.metric, onChange: function (v) { st.metric = v; w.ZR.render(); }
        }),
        KP.exportBtn('导出统计报表', function () { return exportCols(); }, function () { return reportRows(); }, { primary: true })
      ]
    });
  }

  /** 导出列（跟随当前页签，与页面表格同口径） */
  function exportCols() {
    if (st.tab === 'org') {
      return [
        { t: '统计单位', k: 'name' }, { t: '学生数', k: 'students' }, { t: '活动场次', k: 'acts' },
        { t: '报名人次', k: 'joins' }, { t: '人均报名', k: 'per' },
        { t: '人均' + metricLabel(), raw: function (r) { return metricValue(r.avg); } },
        { t: '达标率(%)', k: 'passRate' }, { t: '需关注人数', k: 'warn' }
      ];
    }
    if (st.tab === 'user') {
      return [
        { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' }, { t: '学院', k: 'college' },
        { t: '班级', k: 'className' }, { t: '年级', k: 'grade' }, { t: '参与活动数', k: 'acts' },
        { t: metricLabel(), k: 'total' }
      ];
    }
    return [
      { t: '素养类别', k: 'name' }, { t: '认定记录', k: 'records' }, { t: '覆盖人数', k: 'people' },
      { t: '累计' + metricLabel(), raw: function (r) { return r.total; } },
      { t: '人均' + metricLabel(), raw: function (r) { return r.avg; } },
      { t: '达标线', k: 'need' }, { t: '达成率(%)', raw: function (r) { return r.reach.toFixed(1); } }
    ];
  }

  /** 导出数据：按当前页签组织 */
  function reportRows() {
    if (st.tab === 'org') return orgRows();
    if (st.tab === 'user') return userRows();
    return scoreRows();
  }

  /* ===================== 一、单位统计 ===================== */
  function collegeAgg() {
    var ss = students(), rs = recs();
    var byCollege = U.groupBy(ss, function (s) { return s.college; });
    var recByStudent = U.groupBy(rs, function (r) { return r.studentId; });
    var actByCollege = U.groupBy(KP.pubList(DB.col('activities')), function (a) { return a.college || '校团委'; });
    var sc = scheme(), passLine = U.num(sc ? sc.standard.pass : 6);
    return Object.keys(byCollege).map(function (cname) {
      var list = byCollege[cname];
      var total = 0, pass = 0, warn = 0;
      list.forEach(function (s) {
        var t = U.sum(recByStudent[s.id] || [], function (r) { return U.num(r.credit); });
        total += t;
        if (t >= passLine) pass++; else if (t < passLine * 0.75) warn++;
      });
      var as = actByCollege[cname] || [];
      var joins = as.reduce(function (a, x) { return a + U.num(x.enrolled); }, 0);
      var students_ = list.length;
      return {
        name: cname,
        students: students_,
        acts: as.length,
        joins: joins,
        avg: students_ ? U.round(total / students_, 2) : 0,
        total: U.round(total, 1),
        passRate: U.pctNum(pass, students_),
        pass: pass,
        warn: warn,
        per: students_ ? U.round(joins / students_, 1) : 0
      };
    }).sort(function (a, b) { return b[st.sort] - a[st.sort]; });
  }

  function orgRows() { return collegeAgg(); }

  function tabOrg(host) {
    var rows = collegeAgg();
    var maxAvg = Math.max.apply(null, rows.map(function (r) { return r.avg; }).concat([1]));

    /* 院系参与对比（横向条形） */
    host.appendChild(KP.h5('院系参与对比 · 人均' + metricLabel() + '与报名人次'));
    host.appendChild(UI.card({
      flush: true,
      body: D.h('div', { style: 'padding:15px' },
        C.bars(rows.map(function (r) { return { n: r.name, v: metricValue(r.avg), c: C.color(0) }; }), { labelW: 108, bh: 17 })
      )
    }));

    /* 学院明细表 */
    host.appendChild(KP.h5('单位统计明细（按学院）', D.h('span.muted', '共 ' + rows.length + ' 个统计单位')));
    host.appendChild(KP.lister({
      host: D.h('div'),
      title: '二级学院统计',
      sub: '统计口径：' + metricLabel() + ' · 点击行可下钻到该学院专业明细',
      flush: true,
      pageSize: 12,
      cols: [
        { t: '统计单位', w: 150, render: function (r) { return KP.cell(r.name, '共 ' + r.students + ' 名在校学生'); } },
        { t: '学生数', w: 78, render: function (r) { return KP.numCell(r.students, '人'); } },
        { t: '活动场次', w: 84, render: function (r) { return KP.numCell(r.acts, '场'); } },
        { t: '报名人次', w: 90, render: function (r) { return KP.numCell(r.joins, '人次'); } },
        { t: '人均报名', w: 84, render: function (r) { return KP.numCell(r.per, '次/人'); } },
        { t: '人均' + metricLabel(), w: 96, render: function (r) { return KP.numCell(metricValue(r.avg), metricLabel()); } },
        {
          t: '达标率', w: 150, render: function (r) {
            return KP.progCell(r.passRate, U.pct(r.pass, r.students) + '（' + r.pass + '/' + r.students + ' 人）');
          }
        },
        { t: '需关注', w: 84, render: function (r) { return r.warn ? UI.tag(r.warn + ' 人', 'tag-err') : UI.tag('无', 'tag-ok'); } },
        {
          t: '操作', w: 90, render: function (r) {
            return KP.acts([KP.btn('下钻', function () { drillCollege(r.name); })]);
          }
        }
      ],
      rows: function () { return rows; },
      footLeft: function () {
        var t = rows.reduce(function (a, b) { return a + b.students; }, 0);
        var all = rows.reduce(function (a, b) { return a + b.total; }, 0);
        return D.h('span.muted', '合计：' + rows.length + ' 个学院 / ' + t + ' 名学生 / 累计 ' + U.fmt(metricValue(all)) + metricLabel());
      },
      empty: '暂无统计数据'
    }));

    /* 排序切换 */
    host.appendChild(D.h('div', { style: 'margin-top:12px;display:flex;align-items:center;gap:9px' },
      D.h('span.muted', '排序方式'),
      UI.seg({
        options: [['total', '按总量'], ['avg', '按人均'], ['passRate', '按达标率'], ['joins', '按报名人次']],
        value: st.sort, onChange: function (v) { st.sort = v; w.ZR.render(); }
      })
    ));
  }

  /** 学院下钻：按专业 → 班级 */
  function drillCollege(cname) {
    var byCollege = U.groupBy(DB.col('students'), function (s) { return s.college; });
    var list = byCollege[cname] || [];
    var byMajor = U.groupBy(list, function (s) { return s.major; });
    var recByStudent = U.groupBy(DB.col('scoreRecs'), function (r) { return r.studentId; });
    var rows = Object.keys(byMajor).map(function (m) {
      var l = byMajor[m], total = 0;
      l.forEach(function (s) { total += U.sum(recByStudent[s.id] || [], function (r) { return U.num(r.credit); }); });
      return { name: m, students: l.length, total: U.round(total, 1), avg: l.length ? U.round(total / l.length, 2) : 0 };
    }).sort(function (a, b) { return b.total - a.total; });
    var maxV = Math.max.apply(null, rows.map(function (r) { return r.total; }).concat([1]));

    var m = UI.modal({
      title: cname + ' · 专业维度下钻',
      sub: '共 ' + rows.length + ' 个专业 / ' + list.length + ' 名学生',
      size: 'wide',
      body: [
        KP.tableHTML ? null : null,
        D.h('div', {}, rows.map(function (r) {
          return D.h('div', { style: 'margin-bottom:11px' },
            D.h('div', { style: 'display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px' },
              D.h('b', r.name),
              D.h('span.muted', r.students + ' 人 · 人均 ' + r.avg + ' 学分')),
            UI.pg(r.total / maxV * 100)
          );
        })),
        D.h('div.hr'),
        UI.kv([
          ['学院学生总数', list.length + ' 人'],
          ['累计学分', U.round(rows.reduce(function (a, b) { return a + b.total; }, 0), 1) + ' 学分'],
          ['专业数量', rows.length + ' 个'],
          ['统计口径', metricLabel() + '（1 学分 = 16 学时 = 10 积分）']
        ])
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        KP.exportBtn('导出专业明细',
          [{ t: '专业', k: 'name' }, { t: '学生数', k: 'students' }, { t: '累计学分', k: 'total' }, { t: '人均学分', k: 'avg' }],
          rows)
      ]
    });
  }

  /* ===================== 二、用户统计 ===================== */
  function userRows() {
    var ss = students(), rs = recs();
    var agg = DB.agg(ss, rs);
    return agg.map(function (x) {
      var s = DB.get('students', x.studentId) || {};
      return {
        name: s.name || '', sno: s.sno || '', college: s.college || '', className: s.className || '',
        grade: s.grade || '', total: metricValue(x.total), raw: x.total,
        cats: x.cat, acts: (DB.col('enrollments').filter(function (e) { return e.studentId === x.studentId; })).length
      };
    });
  }

  function tabUser(host) {
    var ss = students(), rs = recs();
    var agg = DB.agg(ss, rs);
    var sc = scheme(), passLine = U.num(sc ? sc.standard.pass : 6);

    /* 学分区间分布 */
    var buckets = [
      { n: '未达标（<' + U.round(passLine * 0.75, 1) + '）', v: 0, c: C.SEM.err },
      { n: '偏低（' + U.round(passLine * 0.75, 1) + '—' + passLine + '）', v: 0, c: C.SEM.warn },
      { n: '达标（' + passLine + '—' + U.round(passLine * 1.33, 1) + '）', v: 0, c: C.SEM.ok },
      { n: '优秀（≥' + U.round(passLine * 1.33, 1) + '）', v: 0, c: C.color(3) }
    ];
    agg.forEach(function (x) {
      if (x.total < passLine * 0.75) buckets[0].v++;
      else if (x.total < passLine) buckets[1].v++;
      else if (x.total < passLine * 1.33) buckets[2].v++;
      else buckets[3].v++;
    });

    /* 年级分布 */
    var byGrade = U.groupBy(ss, function (s) { return s.grade; });
    var gradeRows = Object.keys(byGrade).sort().map(function (g) {
      var list = byGrade[g];
      var recS = {};
      list.forEach(function (s) { recS[s.id] = true; });
      var t = U.sum(rs.filter(function (r) { return recS[r.studentId]; }), function (r) { return U.num(r.credit); });
      return { n: g, v: list.length, avg: list.length ? U.round(t / list.length, 2) : 0 };
    });

    host.appendChild(KP.h5('学生学分区间分布'));
    host.appendChild(D.h('div.g2',
      UI.card({
        title: '区间人数占比', sub: '共 ' + agg.length + ' 名学生',
        body: D.h('div', {},
          C.donut(buckets.map(function (b) { return { n: b.n, v: b.v, c: b.c }; }), { size: 208 }),
          C.legend(buckets.map(function (b) { return { n: b.n, v: b.v, c: b.c }; }))
        )
      }),
      UI.card({
        title: '年级维度', sub: '各年级人数与人均学分',
        body: D.h('div', {},
          C.vbars(gradeRows.map(function (g) { return { n: g.n, v: g.v }; }), { height: 200, name: '学生数' }),
          D.h('div', { style: 'margin-top:8px' }, gradeRows.map(function (g) {
            return D.h('div', { style: 'display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px dashed var(--line)' },
              D.h('span', g.n), D.h('span.muted', g.v + ' 人 · 人均 ' + g.avg + ' 学分'));
          }))
        )
      })
    ));

    /* 六类素养雷达 */
    var catNames = DB.col('cats').map(function (c) { return c.name; });
    var radarVals = catNames.map(function (n) {
      var need = U.num((sc && sc.catStandard && sc.catStandard[n]) || 0);
      var got = agg.length ? U.sum(agg, function (x) { return U.num(x.cat[n] || 0); }) / agg.length : 0;
      return { n: n, v: need ? U.clamp(got / need * 100, 0, 100) : 0 };
    });

    host.appendChild(KP.h5('用户活跃与素养达标'));
    host.appendChild(D.h('div.g2',
      UI.card({
        title: '六类素养平均达标度', sub: '按学生人均实际学分 / 达标线计算',
        body: D.h('div', {}, C.radar(radarVals.map(function (r) { return { n: r.n, v: r.v }; }), { size: 244, unit: '%' }))
      }),
      UI.card({
        title: '角色活跃统计', sub: '按系统角色统计用户规模与在办事项',
        flush: true,
        body: KP.lister({
          noCard: true, pageSize: 10,
          cols: [
            { t: '角色', w: 130, render: function (r) { return KP.cell(r.name, r.key); } },
            { t: '用户数', w: 80, render: function (r) { return KP.numCell(r.count, '人'); } },
            { t: '数据范围', w: 90, render: function (r) { return UI.tag(r.scope, r.scope === '全校' ? 'tag-info' : ''); } },
            { t: '在办事项', w: 90, render: function (r) { return KP.numCell(r.todo, '项'); } }
          ],
          rows: function () {
            return DB.col('roles').map(function (r) {
              var todo = 0;
              if (r.key === 'admin') todo = DB.count('activities', function (a) { return a.status === '待审核'; });
              else if (r.key === 'college') todo = DB.count('scoreApps', function (x) { return x.status === '待初审'; });
              else if (r.key === 'auditor') todo = DB.count('scoreApps', function (x) { return x.status === '待终审'; });
              else if (r.key === 'leader') todo = DB.count('warnings', function (x) { return x.status === '待处理'; });
              else if (r.key === 'organizer') todo = DB.count('enrollments', function (x) { return x.status === '待审核'; });
              else todo = DB.count('enrollments', function (x) { return x.status === '已通过'; });
              return { name: r.name, key: r.key, count: r.memberCount, scope: r.dataScope, todo: todo };
            });
          },
          empty: '暂无角色数据'
        })
      })
    ));

    /* 学生明细 TOP */
    host.appendChild(KP.h5('学生成绩明细（按' + metricLabel() + '降序）'));
    var ranked = userRows().sort(function (a, b) { return b.raw - a.raw; });
    host.appendChild(KP.lister({
      title: '学生成绩排名',
      sub: '共 ' + ranked.length + ' 名学生 · 数据范围 ' + ZA.scopeText(),
      flush: true, pageSize: 12,
      cols: [
        { t: '排名', w: 62, render: function (r, i) { return D.h('span', { style: 'font-weight:700;color:' + (i < 3 ? '#d97706' : 'var(--text3)') }, '#' + (i + 1)); } },
        { t: '学生', w: 150, render: function (r) { return KP.who(r.name, r.sno); } },
        { t: '学院 / 班级', w: 200, render: function (r) { return KP.cell(r.college, r.className); } },
        { t: '年级', w: 76, render: function (r) { return r.grade; } },
        { t: '参与活动', w: 88, render: function (r) { return KP.numCell(r.acts, '个'); } },
        { t: metricLabel(), w: 90, render: function (r) { return KP.numCell(r.total, metricLabel()); } },
        {
          t: '达标状态', w: 96, render: function (r) {
            return KP.status(r.raw >= passLine ? '达标' : (r.raw >= passLine * 0.75 ? '关注' : '未达标'));
          }
        }
      ],
      rows: function () { return ranked; },
      rowClick: function (r) { showStudent(r); },
      empty: '暂无学生数据'
    }));
  }

  /** 学生成绩详情（统计页与用户统计联动） */
  function showStudent(r) {
    var stu = DB.find('students', function (s) { return s.sno === r.sno; });
    if (!stu) return;
    var agg = DB.aggOf(stu.id);
    var rs = DB.recsOf(stu.id);
    var sc = scheme();
    var cr = KP.creditRow(agg, sc);
    var cats = KP.catProgress(agg, sc);
    var m = UI.modal({
      title: r.name + ' · 第二课堂成绩明细',
      sub: r.sno + ' · ' + r.college + ' · ' + r.className,
      size: 'wide',
      body: [
        KP.kpis([
          { label: '累计学分', num: agg.total, unit: '学分', ic: '🎓', fg: '#2563eb', bg: '#eff6ff' },
          { label: '累计学时', num: U.round(agg.total * 16, 0), unit: '学时', ic: '⏱', fg: '#059669', bg: '#ecfdf5' },
          { label: '累计积分', num: U.round(agg.total * 10, 0), unit: '积分', ic: '⭐', fg: '#d97706', bg: '#fff8eb' },
          { label: '达标进度', num: cr.pct, unit: '%', ic: '📈', fg: '#7c3aed', bg: '#f5f3ff', foot: cr.pass ? '已达标' : '还差 ' + cr.gap + ' 学分' }
        ], 'g4'),
        KP.h5('六类素养达成'),
        D.h('div', {}, cats.map(function (c) {
          return D.h('div', { style: 'margin-bottom:9px' },
            D.h('div', { style: 'display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px' },
              D.h('b', { style: 'color:' + c.color }, c.cat),
              D.h('span.muted', c.got + ' / ' + c.need + ' 学分')),
            UI.pg(c.pct, c.ok ? 'ok' : 'warn'));
        })),
        KP.h5('成绩记录明细（最近 12 条）'),
        KP.tableHTML([
          { t: '认定时间', k: 'at' }, { t: '活动 / 事由', k: 'actTitle' },
          { t: '类别', k: 'cat' }, { t: '学分', k: 'credit' },
          { t: '学时', k: 'hours' }, { t: '积分', k: 'points' }, { t: '来源', k: 'source' }
        ], rs.slice(0, 12))
          ? D.h('div', { html: KP.tableHTML([
            { t: '认定时间', k: 'at' }, { t: '活动 / 事由', k: 'actTitle' },
            { t: '类别', k: 'cat' }, { t: '学分', k: 'credit' },
            { t: '学时', k: 'hours' }, { t: '积分', k: 'points' }, { t: '来源', k: 'source' }
          ], rs.slice(0, 12)) })
          : null
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        KP.printBtn('打印成绩明细', function () {
          return {
            title: r.name + ' 第二课堂成绩明细',
            html: KP.metricsHTML([['累计学分', agg.total], ['达标线', cr.need], ['是否达标', cr.pass ? '是' : '否']]) +
              KP.tableHTML([
                { t: '认定时间', k: 'at' }, { t: '活动 / 事由', k: 'actTitle' },
                { t: '类别', k: 'cat' }, { t: '学分', k: 'credit' }, { t: '来源', k: 'source' }
              ], rs)
          };
        })
      ]
    });
  }

  /* ===================== 三、成绩统计 ===================== */
  function scoreRows() {
    var rs = recs(), m = sidSet();
    var byCat = U.groupBy(rs, function (r) { return r.cat; });
    var sc = scheme();
    return DB.col('cats').map(function (c) {
      var list = byCat[c.name] || [];
      var total = U.sum(list, function (r) { return U.num(r.credit); });
      var people = U.uniq(list.map(function (r) { return r.studentId; })).length;
      var need = U.num((sc && sc.catStandard && sc.catStandard[c.name]) || 0);
      var reach = people ? U.clamp((total / people) / (need || 1) * 100, 0, 100) : 0;
      return {
        name: c.name, records: list.length, people: people,
        total: metricValue(U.round(total, 1)), rawTotal: U.round(total, 1),
        avg: people ? metricValue(U.round(total / people, 2)) : 0,
        need: need, reach: reach
      };
    });
  }

  function tabScore(host) {
    var rs = recs(), ss = students();
    var sc = scheme();
    var rows = scoreRows();

    /* 学期趋势：按记录时间所在学期归集 */
    var byTerm = U.groupBy(rs, function (r) { return r.term || (String(r.at).slice(0, 4) + ' 学年'); });
    var terms = Object.keys(byTerm).sort();
    var termRows = terms.map(function (t) {
      var l = byTerm[t];
      return {
        n: t, v: U.round(U.sum(l, function (r) { return U.num(r.credit); }), 1),
        people: U.uniq(l.map(function (r) { return r.studentId; })).length
      };
    });

    /* 类别达标率 */
    var catRows = rows.map(function (r) {
      return { n: r.name, v: r.reach, c: KP.catColor(r.name), total: r.rawTotal };
    });

    host.appendChild(KP.h5('成绩总量与趋势'));
    host.appendChild(D.h('div.g2',
      UI.card({
        title: '六类素养认定结构', sub: '按类别统计累计' + metricLabel() + '（可切换口径）',
        body: D.h('div', {},
          C.donut(rows.map(function (r) { return { n: r.name, v: r.total, c: KP.catColor(r.name) }; }), { size: 208 }),
          C.legend(rows.map(function (r) { return { n: r.name, v: r.total, c: KP.catColor(r.name) }; }))
        )
      }),
      UI.card({
        title: '学期趋势', sub: '各学期认定' + metricLabel() + '总量',
        body: D.h('div', { style: 'margin-top:6px' },
          C.vbars(termRows.map(function (t) { return { n: t.n, v: t.v }; }), { height: 214, name: metricLabel() }),
          D.h('div', { style: 'margin-top:6px' }, C.legend(termRows.map(function (t, i) { return { n: t.n, v: t.v, c: C.color(i) }; })))
        )
      })
    ));

    /* 类别达成率 + 双轴组合 */
    host.appendChild(KP.h5('类别达成率与人均水平'));
    host.appendChild(UI.card({
      title: '类别达成率', sub: '达成率 = 该类人均实际 / 该类达标线',
      body: D.h('div', { style: 'margin-top:4px' },
        C.bars(catRows.map(function (r) { return { n: r.n, v: r.v, c: r.c }; }), { labelW: 96, bh: 18, unit: '%', max: 100 }))
    }));

    if (termRows.length >= 2) {
      host.appendChild(UI.card({
        title: '认定量与人次双轴对比', sub: '柱：各学期' + metricLabel() + '总量　折线：参与人次',
        body: D.h('div', { style: 'margin-top:6px' },
          C.combo(
            termRows.map(function (t) { return { n: t.n }; }),
            { n: metricLabel(), data: termRows.map(function (t) { return t.v; }) },
            { n: '参与人次', data: termRows.map(function (t) { return t.people; }), c: '#f59e0b' },
            { height: 236 }
          ),
          C.legend([{ n: metricLabel(), c: C.color(0) }, { n: '参与人次', c: '#f59e0b' }])
        )
      }));
    }

    /* 达标对比：达标 vs 未达标 */
    var passLine = U.num(sc ? sc.standard.pass : 6);
    var agg = DB.agg(ss, rs);
    var pass = agg.filter(function (x) { return x.total >= passLine; }).length;
    var warn = agg.length - pass;

    host.appendChild(KP.h5('达标情况与考核方案'));
    host.appendChild(D.h('div.g2',
      UI.card({
        title: '达标 / 未达标对比', sub: '达标线 ' + passLine + ' 学分',
        body: D.h('div', {},
          C.donut([{ n: '已达标', v: pass, c: C.SEM.ok }, { n: '未达标', v: warn, c: C.SEM.err }], { size: 190 }),
          C.legend([{ n: '已达标', v: pass, c: C.SEM.ok }, { n: '未达标', v: warn, c: C.SEM.err }]),
          D.h('div', { style: 'margin-top:10px' }, KP.kpis([
            { label: '达标人数', num: pass, unit: '人', ic: '✅', fg: '#059669', bg: '#ecfdf5' },
            { label: '未达标人数', num: warn, unit: '人', ic: '⚠️', fg: '#dc2626', bg: '#fef2f2' }
          ], 'g2'))
        )
      }),
      UI.card({
        title: '当前考核方案', sub: sc ? sc.name : '未配置',
        body: D.h('div', {},
          UI.kv([
            ['方案名称', sc ? sc.name : '—'],
            ['总达标线', passLine + ' 学分'],
            ['优秀线', U.num(sc && sc.standard.excellent) + ' 学分'],
            ['预警线', U.num(sc && sc.standard.warnLine) + ' 学分'],
            ['换算比例', '1 学分 = ' + ((sc && sc.convert && sc.convert.hours) || 16) + ' 学时 = ' + ((sc && sc.convert && sc.convert.points) || 10) + ' 积分'],
            ['适用学期', ((sc && sc.scope && sc.scope.terms) || []).join('、') || '—']
          ]),
          KP.h5('类别达标线'),
          D.h('div', {}, DB.col('cats').map(function (c) {
            var need = U.num((sc && sc.catStandard && sc.catStandard[c.name]) || 0);
            return D.h('div', { style: 'display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--line)' },
              D.h('span', { style: 'color:' + c.color + ';font-weight:600' }, c.name),
              D.h('span.muted', '≥ ' + need + ' 学分'));
          }))
        )
      })
    ));

    /* 类别明细表 */
    host.appendChild(KP.h5('成绩统计明细'));
    host.appendChild(KP.lister({
      title: '类别统计明细',
      sub: '统计口径：' + metricLabel() + ' · 记录数 ' + U.fmt(rs.length) + ' 条',
      flush: true, pageSize: 10,
      cols: [
        { t: '素养类别', w: 140, render: function (r) { return KP.catTag(r.name); } },
        { t: '认定记录', w: 94, render: function (r) { return KP.numCell(r.records, '条'); } },
        { t: '覆盖人数', w: 90, render: function (r) { return KP.numCell(r.people, '人'); } },
        { t: '累计' + metricLabel(), w: 104, render: function (r) { return KP.numCell(r.total, metricLabel()); } },
        { t: '人均' + metricLabel(), w: 104, render: function (r) { return KP.numCell(r.avg, metricLabel()); } },
        { t: '达标线', w: 86, render: function (r) { return KP.numCell(r.need, '学分'); } },
        { t: '达成率', w: 160, render: function (r) { return KP.progCell(r.reach, r.reach.toFixed(1) + '%'); } }
      ],
      rows: function () { return scoreRows(); },
      footLeft: function () { return D.h('span.muted', '金额口径换算：1 学分 = 16 学时 = 10 积分'); },
      empty: '暂无成绩数据'
    }));

    /* 成绩导出 */
    host.appendChild(D.h('div', { style: 'margin-top:12px;display:flex;gap:9px' },
      KP.exportBtn('导出成绩统计明细', [
        { t: '素养类别', k: 'name' }, { t: '认定记录', k: 'records' }, { t: '覆盖人数', k: 'people' },
        { t: '累计' + metricLabel(), raw: function (r) { return r.total; } },
        { t: '人均' + metricLabel(), raw: function (r) { return r.avg; } },
        { t: '达标线', k: 'need' }, { t: '达成率(%)', raw: function (r) { return r.reach.toFixed(1); } }
      ], function () { return scoreRows(); }, { primary: true }),
      KP.printBtn('打印成绩统计报表', function () {
        return {
          title: '第二课堂成绩统计报表',
          html: KP.metricsHTML([['统计学生数', students().length], ['认定记录', rs.length], ['统计口径', metricLabel()]]) +
            KP.tableHTML([
              { t: '类别', k: 'name' }, { t: '记录数', k: 'records' }, { t: '覆盖人数', k: 'people' },
              { t: '累计' + metricLabel(), raw: function (r) { return r.total; } }, { t: '达成率', raw: function (r) { return r.reach.toFixed(1) + '%'; } }
            ], scoreRows())
        };
      })
    ));
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    host.appendChild(UI.pageHd({
      title: '统计与分析',
      desc: '单位统计、用户统计、成绩统计三维度分析；所有图表随上方筛选条件与统计口径实时重算。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('screen'); } }, '📺 打开数据大屏'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('portal'); } }, '门户配置')
      ]
    }));
    host.appendChild(kpis());
    host.appendChild(D.h('div', { style: 'margin:14px 0' }, filterBar()));

    host.appendChild(UI.tabs({
      items: [{ k: 'org', n: '单位统计' }, { k: 'user', n: '用户统计' }, { k: 'score', n: '成绩统计' }],
      cur: st.tab,
      onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'org') tabOrg(body);
    else if (st.tab === 'user') tabUser(body);
    else tabScore(body);
    host.appendChild(body);
  }

  KP.pages({
    stat: { title: '统计与分析', group: '成绩与评价', render: render }
  });
})(window);
