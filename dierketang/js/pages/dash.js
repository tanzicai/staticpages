/* ==========================================================================
   dash.js —— 运行总览（工作台）
   内容：核心指标 / 我的待办 / 参与趋势 / 类别分布 / 热门活动榜 / 院系对比 /
         预警概览 / 演示导览（六条演示闭环的入口）
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  function publishedActs() { return KP.pubList(DB.col('activities')); }
  function signinList() { return DB.col('signins'); }

  function calc() {
    var acts = DB.col('activities');
    var pub = KP.pubList(acts);
    var enr = DB.col('enrollments');
    var sgn = signinList();
    var sgnOk = sgn.filter(function (x) { return x.status === '已签到'; });
    var agg = KP.scopeFilter(DB.agg());
    var sc = DB.scheme();
    var need = U.num(sc ? sc.standard.pass : 6);
    var pass = agg.filter(function (x) { return x.total >= need; }).length;
    return {
      acts: acts, pub: pub, enr: enr, sgn: sgn, sgnOk: sgnOk, agg: agg,
      scheme: sc, need: need, pass: pass,
      passRate: agg.length ? pass / agg.length * 100 : 0,
      avg: agg.length ? U.avg(agg, function (x) { return x.total; }) : 0,
      signRate: enr.length ? sgnOk.length / enr.length * 100 : 0,
      todo: {
        act: acts.filter(function (a) { return a.status === '待审核'; }).length,
        enroll: enr.filter(function (e) { return e.status === '待审核'; }).length,
        app: DB.count('scoreApps', function (x) { return x.status === '待初审' || x.status === '待终审'; }),
        content: DB.count('contents', function (c) { return c.status === '待审'; }),
        warn: DB.count('warnings', function (x) { return x.status === '待处理'; }),
        film: DB.count('works', function (x) { return x.status === '待审核'; })
      }
    };
  }

  /* ---------------- 我的待办 ---------------- */
  function todoCard(m) {
    var items = [
      { n: '活动待审核', v: m.todo.act, ic: '📝', fg: '#2563eb', bg: '#eff6ff', go: 'audit', tip: '活动发布与审核' },
      { n: '报名待审核', v: m.todo.enroll, ic: '✅', fg: '#0891b2', bg: '#ecfeff', go: 'actmgr', tip: '活动管理 · 报名管理' },
      { n: '分值申报待审', v: m.todo.app, ic: '🎯', fg: '#7c3aed', bg: '#f5f3ff', go: 'apply', tip: '分值申报审核' },
      { n: '作品待审核', v: m.todo.film, ic: '🎬', fg: '#d97706', bg: '#fffbeb', go: 'actmgr', tip: '活动管理 · 作品管理' },
      { n: '内容待审', v: m.todo.content, ic: '🛡', fg: '#dc2626', bg: '#fef2f2', go: 'content', tip: '内容安全审核' },
      { n: '预警待处理', v: m.todo.warn, ic: '🔔', fg: '#db2777', bg: '#fdf2f8', go: 'warn', tip: '预警管理' }
    ];
    var total = items.reduce(function (s, x) { return s + x.v; }, 0);
    return UI.card({
      title: '我的待办', sub: total ? '共 ' + total + ' 项待处理' : '暂无待处理事项',
      body: D.h('div.g3', items.map(function (it) {
        return D.h('div', {
          style: 'border:1px solid var(--line);border-radius:11px;padding:12px;display:flex;gap:11px;align-items:center;cursor:pointer;transition:.15s',
          onmouseover: function (e) { e.currentTarget.style.borderColor = '#bfd7fb'; e.currentTarget.style.background = '#f8fbff'; },
          onmouseout: function (e) { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = ''; },
          onclick: function () { w.ZR.go(it.go); },
          title: it.tip
        },
          UI.icoBox(it.ic, it.fg, it.bg, 36),
          D.h('div', { style: 'flex:1;min-width:0' },
            D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, it.n),
            D.h('div', { style: 'font-size:19px;font-weight:750;color:' + (it.v ? it.fg : 'var(--text3)') }, it.v)
          )
        );
      }))
    });
  }

  /* ---------------- 参与趋势（近 12 周） ---------------- */
  function trendCard(m) {
    var buckets = {}, keys = [];
    var all = m.enr.concat(m.sgn);
    all.forEach(function (x) {
      var k = String(x.at || '').slice(0, 7);
      if (!k) return;
      if (!buckets[k]) { buckets[k] = { e: 0, s: 0 }; keys.push(k); }
    });
    keys.sort();
    var byE = U.countBy(m.enr, function (x) { return String(x.at || '').slice(0, 7); });
    var byS = U.countBy(m.sgn.filter(function (x) { return x.status === '已签到'; }), function (x) { return String(x.at || '').slice(0, 7); });
    var labels = keys.slice(-8);
    return UI.card({
      title: '参与趋势', sub: '按月份统计报名量与签到量',
      body: C.line(labels.map(function (k) { return k.slice(5) + '月'; }), [
        { n: '报名', data: labels.map(function (k) { return byE[k] || 0; }), c: '#3b82f6' },
        { n: '签到', data: labels.map(function (k) { return byS[k] || 0; }), c: '#10b981' }
      ], { area: true, height: 232, maxLabels: 8 }),
      note: C.legend([{ n: '报名人次', c: '#3b82f6' }, { n: '实际签到', c: '#10b981' }])
    });
  }

  /* ---------------- 类别分布 ---------------- */
  function catCard(m) {
    var counts = U.countBy(m.pub, function (a) { return a.cat; });
    var rows = (DB.data.cats || []).map(function (c, i) {
      return { n: c.name, v: counts[c.name] || 0, c: c.color || C.color(i) };
    });
    var totalCredit = {};
    m.agg.forEach(function (x) {
      Object.keys(x.cat).forEach(function (k) { totalCredit[k] = (totalCredit[k] || 0) + U.num(x.cat[k]); });
    });
    return UI.card({
      title: '活动类别分布', sub: '已发布活动数 / 累计认定学分',
      body: D.h('div', { style: 'display:flex;gap:14px;align-items:center;flex-wrap:wrap' },
        D.h('div', { style: 'flex:0 0 190px' }, C.donut(rows, { size: 186, thickness: 26, centerValue: m.pub.length, centerLabel: '已发布活动' })),
        D.h('div', { style: 'flex:1;min-width:150px' }, C.legend(rows.map(function (r) {
          return { n: r.n + '（学分 ' + U.fmt(Math.round((totalCredit[r.n] || 0) * 10) / 10) + '）', c: r.c };
        })))
      )
    });
  }

  /* ---------------- 热门活动榜 ---------------- */
  function topActCard(m) {
    var enrN = U.countBy(m.enr, function (e) { return e.actId; });
    var sgnN = U.countBy(m.sgnOk, function (e) { return e.actId; });
    var rows = m.pub.map(function (a) {
      var n = enrN[a.id] || 0, s = sgnN[a.id] || 0;
      return { a: a, n: n, s: s, rate: n ? s / n * 100 : 0, score: n * 2 + s * 3 + U.num(a.viewCount) / 100 };
    }).sort(function (x, y) { return y.score - x.score; }).slice(0, 8);
    return UI.card({
      title: '热门活动排行', sub: '综合报名量、签到量与浏览量',
      flush: true,
      body: KP.lister({
        noCard: true, pageSize: 0,
        cols: [
          { t: '排名', w: 48, render: function (r, i) { return D.h('span', { style: 'font-weight:750;color:' + (i < 3 ? '#d97706' : 'var(--text3)') }, i + 1); } },
          {
            t: '活动', render: function (r) {
              return KP.cell(D.h('a', { href: 'javascript:;', onclick: function () { w.ZR.go('actmgr', r.a.id); }, style: 'color:var(--primary)' }, r.a.title), r.a.cat + ' · ' + r.a.host);
            }
          },
          { t: '报名', w: 62, align: 'center', render: function (r) { return KP.numCell(r.n); } },
          { t: '签到', w: 62, align: 'center', render: function (r) { return KP.numCell(r.s); } },
          { t: '签到率', w: 92, render: function (r) { return KP.progCell(r.rate, r.rate.toFixed(0) + '%'); } }
        ],
        rows: function () { return rows; },
        empty: '暂无已发布活动'
      })
    });
  }

  /* ---------------- 院系参与对比 ---------------- */
  function collegeCard(m) {
    var byCol = U.groupBy(m.agg, function (x) { return x.college; });
    var rows = Object.keys(byCol).map(function (k) {
      var list = byCol[k];
      var total = U.sum(list, function (x) { return x.total; });
      var pass = list.filter(function (x) { return x.total >= m.need; }).length;
      return { n: k, v: list.length, total: total, avg: total / list.length, pass: pass, rate: pass / list.length * 100 };
    }).sort(function (a, b) { return b.avg - a.avg; });
    return UI.card({
      title: '院系参与对比', sub: '平均学分与达标率（' + ZA.scopeText() + '）',
      flush: true,
      body: KP.lister({
        noCard: true, pageSize: 0,
        cols: [
          { t: '学院', render: function (r) { return KP.cell(r.n, '在册 ' + r.v + ' 人'); } },
          { t: '平均学分', w: 92, align: 'center', render: function (r) { return KP.numCell(r.avg.toFixed(2), '分'); } },
          { t: '达标人数', w: 82, align: 'center', render: function (r) { return KP.numCell(r.pass); } },
          { t: '达标率', w: 104, render: function (r) { return KP.progCell(r.rate, r.rate.toFixed(1) + '%'); } }
        ],
        rows: function () { return rows; }
      })
    });
  }

  /* ---------------- 预警概览 ---------------- */
  function warnCard(m) {
    var list = KP.scopeFilter(DB.col('warnings'));
    var pending = list.filter(function (x) { return x.status === '待处理'; });
    var byLevel = U.countBy(list, function (x) { return x.level; });
    var byCollege = U.countBy(list, function (x) { return x.college; });
    var rows = Object.keys(byCollege).map(function (k) { return { n: k.replace('学院', ''), v: byCollege[k] }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
    return UI.card({
      title: '预警概览', sub: '共 ' + list.length + ' 条待处理 ' + pending.length + ' 条',
      right: D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('warn'); } }, '进入预警管理 →'),
      body: [
        D.h('div.g4', [
          UI.stat({ ic: '🔔', label: '预警总数', num: list.length, fg: '#db2777', bg: '#fdf2f8' }),
          UI.stat({ ic: '⏳', label: '待处理', num: pending.length, fg: '#d97706', bg: '#fffbeb' }),
          UI.stat({ ic: '⚠', label: '严重预警', num: byLevel['严重'] || 0, fg: '#dc2626', bg: '#fef2f2' }),
          UI.stat({ ic: '✅', label: '已处理', num: list.filter(function (x) { return x.status === '已处理'; }).length, fg: '#059669', bg: '#ecfdf5' })
        ]),
        D.h('div.mt12', C.bars(rows, { unit: ' 人', labelW: 92, bh: 16, gap: 8 }))
      ]
    });
  }

  /* ---------------- 演示导览 ---------------- */
  var TOUR = [
    {
      t: '一、活动全流程', ic: '🚀', c: '#2563eb', bg: '#eff6ff',
      steps: ['后台创建活动 / 活动申报', '活动审批', '报名项目与报名表单', '报名审核', '时间 / 位置 / 扫码签到', '学生端报名签到'],
      go: [['act', '进入「第二课堂活动」'], ['audit', '进入「活动发布与审核」'], ['actmgr', '进入「活动管理」'], ['square', '进入「活动广场」']]
    },
    {
      t: '二、认定与赋分', ic: '🎯', c: '#7c3aed', bg: '#f5f3ff',
      steps: ['活动考核（签到率 / 得分）', '分值审核', '学生申报积分 / 学分 / 学时', '管理员审核通过', '系统自动赋分', '分值记录查询导出'],
      go: [['actmgr', '进入「活动管理 · 考核」'], ['apply', '进入「分值申报」'], ['grade', '进入「成绩管理」']]
    },
    {
      t: '三、成绩与预警', ic: '🏅', c: '#059669', bg: '#ecfdf5',
      steps: ['考核方案设置', '达标规则与换算规则', '成绩汇总查询', '学生端成绩单预览', 'PDF 导出', '自动预警规则与通知'],
      go: [['grade', '进入「成绩管理」'], ['tpl', '进入「成绩单模板」'], ['warn', '进入「预警管理」'], ['myscore', '进入「我的成绩单」']]
    },
    {
      t: '四、配置与协同', ic: '⚙️', c: '#0891b2', bg: '#ecfeff',
      steps: ['组织架构与角色权限', 'PC / 移动端活动广场', '我管理的 / 我报名的', '消息通知', '已读未读统计', '未读多渠道提醒'],
      go: [['user', '进入「用户管理」'], ['square', '进入「活动广场」'], ['msg', '进入「消息通知」']]
    },
    {
      t: '五、数据与决策', ic: '📊', c: '#d97706', bg: '#fffbeb',
      steps: ['单位统计', '用户统计', '成绩统计', '图表联动筛选', '报表导出', '二课数据大屏'],
      go: [['stat', '进入「统计与分析」'], ['screen', '进入「二课数据大屏」']]
    },
    {
      t: '六、门户与智能', ic: '🧠', c: '#db2777', bg: '#fdf2f8',
      steps: ['门户页面拖拽配置', '域名与访问权限', '内容安全审核与舆情', '敏感词命中统计', 'AI 助手问答规则', '文档学习与业务入口推送'],
      go: [['portal', '进入「门户配置」'], ['content', '进入「内容安全」'], ['ai', '进入「AI 二课助手」']]
    }
  ];

  function tourCard() {
    return UI.card({
      title: '演示导览', sub: '按六条闭环逐条演示，每张卡片下方可直接进入对应功能页',
      body: D.h('div.g3', TOUR.map(function (t) {
        return D.h('div', { style: 'border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff' },
          D.h('div', { style: 'display:flex;align-items:center;gap:9px;margin-bottom:9px' },
            UI.icoBox(t.ic, t.c, t.bg, 34),
            D.h('div', { style: 'font-weight:700;font-size:13.5px' }, t.t)
          ),
          D.h('ol', { style: 'margin:0;padding-left:19px;font-size:12.2px;line-height:1.95;color:var(--text2)' },
            t.steps.map(function (s) { return D.h('li', s); })),
          D.h('div.btn-row', { style: 'margin-top:10px' }, t.go.map(function (g) {
            return D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go(g[0]); } }, g[1]);
          }))
        );
      }))
    });
  }

  w.ZKP.pages({
    dash: {
      title: '运行总览', group: '总览',
      render: function (host) {
        var m = calc();
        var sc = m.scheme;
        host.appendChild(UI.pageHd({
          crumb: '<b>总览</b> / 运行总览',
          title: ZA.isStudent() ? '我的二课总览' : '第二课堂运行总览',
          desc: DB.data.meta.school + ' · ' + DB.data.meta.term + ' · 当前身份：' + (ZA.ROLE_LABEL[ZA.role()] || '') + '（数据范围：' + ZA.scopeText() + '）',
          right: [
            D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('screen'); } }, '📺 打开数据大屏'),
            D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZR.go(ZA.isStudent() ? 'square' : 'act'); } }, ZA.isStudent() ? '去活动广场' : '＋ 创建活动')
          ]
        }));

        host.appendChild(KP.kpis([
          { ic: '📌', label: '已发布活动', num: m.pub.length, unit: '个', fg: '#2563eb', bg: '#eff6ff', foot: '其中待审核 ' + m.todo.act + ' 个' },
          { ic: '🙋', label: '累计报名', num: m.enr.length, unit: '人次', fg: '#0891b2', bg: '#ecfeff', foot: '待审核 ' + m.todo.enroll + ' 人次' },
          { ic: '📍', label: '实际签到', num: m.sgnOk.length, unit: '人次', fg: '#059669', bg: '#ecfdf5', foot: '签到率 ' + m.signRate.toFixed(1) + '%' },
          { ic: '🎓', label: '人均学分', num: Math.round(m.avg * 100) / 100, unit: '分', fg: '#7c3aed', bg: '#f5f3ff', foot: '达标线 ' + m.need + ' 分' },
          { ic: '🏆', label: '学分达标率', num: m.passRate.toFixed(1), unit: '%', fg: '#d97706', bg: '#fffbeb', foot: m.pass + ' / ' + m.agg.length + ' 人达标' }
        ], 'g5'));

        host.appendChild(D.h('div.mt16', todoCard(m)));
        host.appendChild(D.h('div.mt16', D.h('div.g-21', trendCard(m), catCard(m))));
        host.appendChild(D.h('div.mt16', D.h('div.g-21', topActCard(m), collegeCard(m))));
        host.appendChild(D.h('div.mt16', warnCard(m)));

        if (!ZA.isStudent()) {
          host.appendChild(D.h('div.mt16', UI.card({
            title: '当前考核方案', sub: sc ? sc.name : '未配置',
            right: D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('grade'); } }, '进入成绩管理 →'),
            body: sc ? [
              D.h('div.g4', [
                UI.stat({ ic: '🎯', label: '达标学分', num: sc.standard.pass, unit: '分', fg: '#2563eb', bg: '#eff6ff' }),
                UI.stat({ ic: '⭐', label: '优秀学分', num: sc.standard.excellent, unit: '分', fg: '#7c3aed', bg: '#f5f3ff' }),
                UI.stat({ ic: '⚠', label: '预警线', num: sc.standard.warnLine, unit: '分', fg: '#d97706', bg: '#fffbeb' }),
                UI.stat({ ic: '🔁', label: '换算比例', num: sc.convert.hoursPerCredit, unit: '学时/学分', fg: '#059669', bg: '#ecfdf5' })
              ]),
              D.h('div.mt12', C.bars((DB.data.cats || []).map(function (c, i) {
                return { n: c.name, v: U.num((sc.catStandard || {})[c.name] || 0), c: c.color || C.color(i) };
              }), { unit: ' 分', labelW: 92, bh: 16, gap: 8 }))
            ] : D.h('div', '尚未配置考核方案')
          })));
        }
        host.appendChild(D.h('div.mt16', tourCard()));
      }
    }
  });
})(window);
