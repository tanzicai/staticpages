/* ============================================================
   工作台（首页）—— 大模块直达卡片 + 概览
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  function greeting() {
    var h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  var MODULES = [
    { route: 'courses', title: '课程中心', desc: '课程库 / 我的课程 · 对接校方教学平台课程，授课计划、课堂活动与资源统一入口。', tag: '课程' },
    { route: 'activity', title: '课堂活动', desc: '随堂练习、主题讨论、分组任务按时间轴沉淀，支持同步与直接发起。', tag: '高频' },
    { route: 'teachplan', title: '授课计划比对', desc: '自动匹配教学平台授课计划，开展授课知识点覆盖率对比分析。', tag: '分析' },
    { route: 'outline', title: '大纲覆盖分析', desc: '基于课程大纲知识点的覆盖统计、薄弱知识点与待开课提示。', tag: '分析' },
    { route: 'reports', title: '分析报告', desc: '一键生成 AI 课堂分析报告，输出知识点覆盖统计详情，可下载打印。', tag: '报告' },
    { route: 'resources', title: '直录播资源', desc: '课堂实录统一管理：播放、在线剪辑导出、权限设置、同步教学平台资源库。', tag: '视频' },
    { route: 'stt', title: '语音转写与翻译', desc: '课堂语音实时转写（语义纠正），中英等 11 语种字幕实时翻译。', tag: 'AI' },
    { route: 'cloud', title: '云端资源库', desc: '课件、教案、视频等云存储，与教学平台云盘/资源库互通。', tag: '存储' },
    { route: 'supervision', title: '在线督导评课', desc: '课堂实录直连督导评价：看课、选表、打分、字号大中小一键切换。', tag: '评课', accent: true },
    { route: 'evalforms', title: '评价表管理', desc: '督导评价表库维护，支持维度/指标/分值在线参数设置。', tag: '评课' }
  ];

  function render(el) {
    var d = Z.db();
    var s = Z.session() || {};
    var now = new Date();
    var wd = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    var meta = d.meta || {};
    var actTotal = d.activities.length;
    var resTotal = d.resources.length;
    var evCount = d.evals.length;
    var pendingEval = pendingEvalList(d).length;
    var feeds = d.logs.slice(0, 5);

    el.innerHTML =
      /* 顶部问候条 */
      '<div class="card" style="background:linear-gradient(120deg,#F1EDFF 0%,#FFFFFF 70%);border-color:var(--brand-soft);padding:18px 22px;margin-bottom:14px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:240px">' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<span class="chip brand">' + esc(meta.term || '') + '</span>' +
      '<span class="chip ok">第 ' + (meta.currentWeek || 8) + ' 教学周</span></div>' +
      '<div style="font-size:20px;font-weight:800;margin-top:8px">' + greeting() + '，' + esc(s.name || '') + '</div>' +
      '<div class="small muted mt6">' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + wd +
      ' · 平台已与校方教学平台、督导评价系统完成对接 · 本周待办 ' + pendingEval + ' 项</div></div>' +
      '<div style="display:flex;gap:18px;font-size:13px;color:var(--text-2);flex-wrap:wrap">' +
      '<span style="text-align:center"><b style="display:block;font-size:20px;color:var(--brand-deep)">' + d.courses.length + '</b>门课程</span>' +
      '<span style="text-align:center"><b style="display:block;font-size:20px;color:var(--ok)">' + actTotal + '</b>次活动</span>' +
      '<span style="text-align:center"><b style="display:block;font-size:20px;color:#C77E1B">' + resTotal + '</b>个资源</span>' +
      '<span style="text-align:center"><b style="display:block;font-size:20px;color:var(--info)">' + evCount + '</b>条评价</span></div>' +
      '</div>' +

      /* 大模块直达 */
      '<div class="mod-grid">' +
      MODULES.map(function (m) {
        return '<div class="mcard' + (m.accent ? ' acc' : '') + '" data-mod="' + m.route + '" title="点击进入：' + esc(m.title) + '">' +
          '<div class="mt">' + esc(m.title) +
          '<span class="chip" style="background:' + (m.accent ? 'rgba(255,255,255,.22)' : 'var(--brand-soft)') + ';color:' + (m.accent ? '#fff' : 'var(--brand-deep)') + ';font-size:11px">' + esc(m.tag || '') + '</span>' +
          '<span class="arrow">进入 →</span></div>' +
          '<div class="md">' + esc(m.desc) + '</div>' +
          '<div class="mg">点击直达对应功能模块</div>' +
          '</div>';
      }).join('') +
      '</div>' +

      /* 下方动态两栏 */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">' +
      '<div class="card"><div class="card-h"><div class="t">平台对接状态</div></div><div class="card-b" style="display:flex;flex-direction:column;gap:10px;font-size:13px">' +
      '<div class="row" style="justify-content:space-between"><span>校方教学平台（课程/活动/授课计划）</span><span class="chip ok">正常</span></div>' +
      '<div class="row" style="justify-content:space-between"><span>督导评价系统（录播直连评课）</span><span class="chip ok">正常</span></div>' +
      '<div class="row" style="justify-content:space-between"><span>语音识别 / 翻译服务（转写与字幕）</span><span class="chip ok">正常</span></div>' +
      '<div class="row" style="justify-content:space-between"><span>资源转码 / 剪辑服务</span><span class="chip ok">正常</span></div>' +
      '<div class="row" style="justify-content:space-between"><span>课堂视频源（B站教师课堂实录 · 在线）</span><span class="chip ok">已接入</span></div>' +
      '</div></div>' +
      '<div class="card"><div class="card-h"><div class="t">最新动态</div></div><div class="card-b" style="padding:8px 16px">' +
      feeds.map(function (l) {
        return '<div class="fi"><div class="md">' + esc(l.module.slice(0, 2)) + '</div>' +
          '<div style="flex:1;min-width:0"><div class="small">' + esc(l.user) + ' <b>' + esc(l.action) + '</b>　' + esc(l.detail) + '</div>' +
          '<div class="tiny faint">' + esc(l.time) + ' · ' + esc(l.module) + '</div></div></div>';
      }).join('') +
      '</div></div></div>';

    bind(el);
  }

  function pendingEvalList(d) {
    var out = [];
    var used = {};
    d.evals.forEach(function (e) { used[e.courseId + '|' + e.sessionLabel] = 1; });
    d.courses.forEach(function (c) {
      c.sessions.forEach(function (sess) {
        var lab = sess.weekLabel + ' · ' + sess.dayTime;
        if (sess.weekNo <= d.meta.currentWeek && !used[c.id + '|' + lab]) out.push(sess);
      });
    });
    return out;
  }

  function bind(el) {
    $$('[data-mod]', el).forEach(function (card) {
      card.addEventListener('click', function () {
        Z.go(card.getAttribute('data-mod'));
      });
    });
  }

  Z.register('dashboard', { render: render });
})(window);
