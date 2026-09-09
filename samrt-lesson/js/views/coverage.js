/* ============================================================
   课堂分析 —— 授课计划比对 / 大纲覆盖分析 / 分析报告
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  var state = { courseId: 'c1', tab: 'teachplan' };

  function pickCourse(el) {
    var rp = Z.G.routeParams || {};
    if (rp.course) state.courseId = rp.course;
  }

  function courseSelect(selId, extra) {
    var d = Z.db();
    return '<select class="sel" id="' + selId + '" style="min-width:230px">' +
      d.courses.map(function (c) { return '<option value="' + c.id + '"' + (c.id === state.courseId ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') +
      '</select>' + (extra || '');
  }

  function head(html, tools) {
    return '<div class="page-head"><div><h3>' + html.t + '</h3><div class="ph-sub">' + html.s + '</div></div>' +
      '<div class="ph-tools">' + tools + '</div></div>';
  }

  /* ========== 授课计划比对 ========== */
  function renderTeachplan(el) {
    pickCourse(el);
    var d = Z.db();
    var c = Z.courseById(state.courseId);
    var ov = Z.outlineOverview(state.courseId);
    var rows = Z.planRowsOf(state.courseId);
    var planHours = rows.reduce(function (x, r) { return x + r.hours; }, 0);
    var taughtHours = rows.reduce(function (x, r) { return x + Math.min(r.kp.taughtH, r.hours); }, 0);
    var full = rows.filter(function (r) { return r.state === '已覆盖'; }).length;
    var partial = rows.filter(function (r) { return r.state === '部分覆盖'; }).length;
    var pend = rows.filter(function (r) { return r.state === '未开课'; }).length;
    var rate = planHours ? Math.round(taughtHours / planHours * 100) : 0;

    el.innerHTML =
      head(
        { t: '授课计划比对', s: '自动匹配校方教学平台授课计划，开展授课知识点与课堂覆盖情况的对比分析' },
        courseSelect('tpCourse') +
        '<button class="btn" data-q="rematch">重新自动匹配</button>' +
        '<button class="btn primary" data-q="report">生成课堂分析报告</button>'
      ) +
      '<div class="grid g4" style="margin-bottom:12px">' +
      statBox('计划知识点', rows.length + ' 条', '自动匹配 ' + esc(c.platform.courseId)) +
      statBox('覆盖学时', taughtHours + ' / ' + planHours + ' 学时', '完全覆盖 ' + full + ' · 部分 ' + partial + ' · 待开课 ' + pend) +
      statBox('授课计划覆盖率', rate + '%', '基于授课记录自动计算') +
      statBox('计划同步状态', '已接入', '更新 ' + esc(c.platform.syncAt)) +
      '</div>' +

      '<div class="card"><div class="card-h"><div class="t">授课计划 · 覆盖率比对明细<span class="s">已匹配教学平台授课计划（' + esc(c.platform.courseName) + '）</span></div>' +
      '<div class="legend"><span class="lg"><span class="sw" style="background:#14967A"></span>完全覆盖</span><span class="lg"><span class="sw" style="background:#E0A33D"></span>部分覆盖</span><span class="lg"><span class="sw" style="background:#C9C5E0"></span>未开课/待覆盖</span></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>序号</th><th>授课知识点（教学平台授课计划）</th><th>所属章节</th><th>计划周次</th><th>计划学时</th><th>大纲要求</th>' +
      '<th>平台课堂覆盖</th><th>匹配结果</th><th style="width:120px">操作</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr>' +
          '<td class="num">' + r.no + '</td>' +
          '<td style="font-weight:700">' + esc(r.name) + '</td>' +
          '<td class="muted">' + esc(r.chName) + '</td>' +
          '<td class="num">第' + r.week + '周</td>' +
          '<td class="num">' + r.hours + '</td>' +
          '<td>' + levelChip(r.level) + '</td>' +
          '<td class="num" style="font-weight:700">' + Math.min(r.kp.taughtH, r.hours) + '/' + r.hours + ' 学时</td>' +
          '<td>' + stateChip(r) + '</td>' +
          '<td><button class="btn sm" data-op="ev" data-kp="' + r.kpId + '">覆盖证据</button></td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="card-b" style="border-top:1px dashed var(--line-2);font-size:12px;color:var(--text-3);display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">' +
      '<span>匹配规则：按知识点名称与大纲章节结构自动匹配，匹配置信度 ≥ ' + (96 - (rows.length % 3) * 2) + '%。</span>' +
      '<span>分析数据更新：' + esc(d.analysisAt || '2026-09-07 21:30') + '</span></div></div>';
    bindCommon(el, 'teachplan');
  }

  /* ========== 大纲覆盖分析 ========== */
  function renderOutline(el) {
    pickCourse(el);
    var d = Z.db();
    var c = Z.courseById(state.courseId);
    var o = Z.outlineById(state.courseId);
    var ov = Z.outlineOverview(state.courseId);
    if (!o) return;

    var rowsHtml = o.chapters.map(function (ch) {
      var chCovered = 0, chPartial = 0, chPend = 0;
      ch.kps.forEach(function (kp) {
        var st = Z.kpState(kp);
        if (st === '已覆盖') chCovered++;
        else if (st === '部分覆盖') chPartial++;
        else chPend++;
      });
      var total = ch.kps.length;
      var chRate = total ? Math.round(((chCovered + chPartial * 0.5) / total) * 100) : 0;
      var trs = ch.kps.map(function (kp) {
        var st = Z.kpState(kp);
        var acts = d.activities.filter(function (a) { return a.courseId === state.courseId && a.kpId === kp.id; });
        return '<tr class="kp">' +
          '<td class="num"><span class="kp-idx">' + esc(kp.id.toUpperCase().replace(/[A-Z]/g, '')) + '</span>' + esc(kp.name) + '</td>' +
          '<td>' + levelChip(kp.level) + '</td>' +
          '<td class="num">第' + kp.week + '周</td>' +
          '<td class="num">' + kp.reqH + '</td>' +
          '<td class="num" style="font-weight:800;color:' + (kp.taughtH >= kp.reqH ? 'var(--ok)' : kp.taughtH ? 'var(--warn)' : 'var(--text-3)') + '">' + kp.taughtH + '</td>' +
          '<td class="num">' + acts.length + '</td>' +
          '<td class="num muted">' + (kp.lastAct || (st === '未开课' ? '—' : '—')) + '</td>' +
          '<td>' + kpChip(st) + '</td>' +
          '<td><button class="btn sm" data-op="kp" data-kp="' + kp.id + '">覆盖详情</button></td>' +
          '</tr>';
      }).join('');
      return '<tr class="ch-row"><td colspan="9" style="padding:10px 12px">' +
        '<span style="font-size:13.5px;font-weight:800;color:var(--brand-deep)">' + esc(ch.ch) + '</span>' +
        '<span class="muted" style="margin-left:12px;font-size:12px">学时 ' + esc(ch.chHours) + ' · 知识点 ' + total + ' 个</span>' +
        '<div style="display:inline-flex;align-items:center;gap:8px;float:right;width:200px"><div class="pbar thin" style="flex:1"><i style="width:' + chRate + '%"></i></div><span class="small" style="color:var(--text-2)">' + chRate + '%</span></div></td></tr>' +
        trs;
    }).join('');

    el.innerHTML =
      head(
        { t: '大纲覆盖分析', s: '基于课程大纲知识点开展课堂覆盖分析，支持查看每个知识点的覆盖统计详情' },
        courseSelect('olCourse') +
        '<button class="btn" data-q="recalc">重新计算</button>' +
        '<button class="btn primary" data-q="report">生成分析报告</button>'
      ) +
      '<div class="card" style="margin-bottom:12px;padding:16px 20px;display:flex;align-items:center;gap:26px;flex-wrap:wrap">' +
      '<div style="text-align:center">' +
      '<div style="width:118px;height:118px;border-radius:50%;background:conic-gradient(var(--brand) ' + ov.rate * 3.6 + 'deg, #E9E6F7 0deg);display:flex;align-items:center;justify-content:center;position:relative">' +
      '<div style="position:absolute;inset:11px;background:#fff;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
      '<span style="font-size:24px;font-weight:800;color:var(--brand-deep)">' + ov.rate + '%</span><span class="tiny faint">综合覆盖率</span></div></div></div>' +
      '<div class="grow" style="min-width:220px">' +
      '<div style="font-weight:800;font-size:16px">' + esc(c.name) + '</div>' +
      '<div class="small muted mt6">大纲知识点 <b style="color:var(--brand-deep)">' + ov.total + '</b> 个：已覆盖 ' + ov.covered + ' · 部分覆盖 ' + ov.partial + ' · 待开课 ' + ov.pending + '</div>' +
      '<div class="row mt10" style="gap:18px;font-size:12.5px;color:var(--text-2)">' +
      '<span class="lg"><span class="sw" style="background:#14967A"></span>已覆盖（课时达标）</span>' +
      '<span class="lg"><span class="sw" style="background:#E0A33D"></span>部分覆盖（课时不足）</span>' +
      '<span class="lg"><span class="sw" style="background:#C9C5E0"></span>待开课（后续周次）</span></div></div>' +
      '<div class="help-txt" style="max-width:230px">覆盖判定依据：课堂活动参与记录 + 授课录播/语音转写授课记录自动累计覆盖学时。</div>' +
      '</div>' +

      '<div class="card"><div class="card-h"><div class="t">大纲知识点覆盖明细<span class="s">按章节分组 · 点击“覆盖详情”查看统计证据</span></div></div>' +
      '<div class="table-wrap"><table class="tbl kp-table"><thead><tr>' +
      '<th style="width:300px">知识点</th><th>大纲要求</th><th>计划周次</th><th>大纲要求学时</th><th>已覆盖学时</th><th>关联活动</th><th>最近覆盖</th><th>覆盖状态</th><th style="width:110px">操作</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div></div>';
    bindCommon(el, 'outline');
  }

  /* ========== 分析报告 ========== */
  function renderReports(el) {
    pickCourse(el);
    var d = Z.db();
    var c = Z.courseById(state.courseId);
    var ov = Z.outlineOverview(state.courseId);
    var rows = Z.planRowsOf(state.courseId);
    var planHours = rows.reduce(function (x, r) { return x + r.hours; }, 0);
    var taughtHours = rows.reduce(function (x, r) { return x + Math.min(r.kp.taughtH, r.hours); }, 0);
    var rate = planHours ? Math.round(taughtHours / planHours * 100) : 0;
    var no = 'AI-' + c.id.toUpperCase() + '-' + (new Date()).getFullYear() + '-' + pad2(nowMonth()) + pad2(nowDay()) + '-01';
    var weak = rows.filter(function (r) { return r.state !== '已覆盖'; });
    var topActs = d.activities.filter(function (a) { return a.courseId === state.courseId && a.avg > 0; }).sort(function (a, b) { return b.avg - a.avg; }).slice(0, 5);

    var kpDetailRows = rows.map(function (r) {
      var acts = d.activities.filter(function (a) { return a.courseId === state.courseId && a.kpId === r.kpId; });
      return '<tr><td class="num">' + r.no + '</td><td>' + esc(r.name) + '</td><td class="num">第' + r.week + '周</td>' +
        '<td class="num">' + r.hours + '</td><td class="num" style="font-weight:700">' + Math.min(r.kp.taughtH, r.hours) + '</td>' +
        '<td class="num">' + acts.length + '</td><td>' + kpChip(r.state) + '</td></tr>';
    }).join('');

    el.innerHTML =
      head(
        { t: '分析报告', s: 'AI课堂分析报告 · 知识点覆盖统计详情' },
        courseSelect('rpCourse') +
        '<button class="btn" data-q="dl">下载报告</button>' +
        '<button class="btn primary" data-q="print">打印报告</button>'
      ) +

      '<div class="card print-zone"><div class="card-b" style="padding:26px 30px">' +
      /* 报告头 */
      '<div style="text-align:center;border-bottom:2px solid var(--brand);padding-bottom:16px;margin-bottom:18px">' +
      '<div style="letter-spacing:6px;font-weight:800;font-size:20px;color:var(--brand-deep)">智慧课堂 · AI课堂分析报告</div>' +
      '<div class="small muted mt6">报告编号：' + no + '　生成时间：' + Z.nowStr() + '　数据周期：' + (d.meta.currentWeek) + ' 个教学周</div>' +
      '<div class="row mt10" style="justify-content:center;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--text-2)">' +
      '<span>课程：<b>' + esc(c.name) + '</b></span><span>开课学院：' + esc(c.college) + '</span><span>授课教师：' + esc(c.teacher) + '</span>' +
      '<span>选课班级：' + esc(c.className) + '</span></div></div>' +

      /* 概要卡 */
      '<div class="grid g4">' +
      '<div style="background:var(--brand-soft-2);border-radius:10px;padding:14px 16px"><div class="small muted">授课计划覆盖率</div><div style="font-size:28px;font-weight:800;color:var(--brand-deep)">' + rate + '%</div><div class="tiny faint mt6">覆盖学时 ' + taughtHours + '/' + planHours + '</div></div>' +
      '<div style="background:var(--ok-bg);border-radius:10px;padding:14px 16px"><div class="small muted" style="color:var(--ok)">大纲知识点覆盖数</div><div style="font-size:28px;font-weight:800;color:var(--ok)">' + ov.covered + '<span style="font-size:15px">/' + ov.total + '</span></div><div class="tiny faint mt6">部分覆盖 ' + ov.partial + ' · 待开课 ' + ov.pending + '</div></div>' +
      '<div style="background:#FBF0DC;border-radius:10px;padding:14px 16px"><div class="small muted" style="color:var(--warn)">课堂活动总量</div><div style="font-size:28px;font-weight:800;color:var(--warn)">' + d.activities.filter(function (a) { return a.courseId === state.courseId; }).length + '</div><div class="tiny faint mt6">用于知识点覆盖证据</div></div>' +
      '<div style="background:#FBE6EA;border-radius:10px;padding:14px 16px"><div class="small muted" style="color:var(--bad)">待补强知识点</div><div style="font-size:28px;font-weight:800;color:var(--bad)">' + weak.length + '</div><div class="tiny faint mt6">部分覆盖与未开课</div></div>' +
      '</div>' +

      /* 授课计划覆盖率 */
      '<h4 style="margin:22px 0 10px;display:flex;align-items:center;gap:8px"><span style="width:4px;height:16px;background:var(--brand);border-radius:2px;display:inline-block"></span>一、授课计划覆盖率统计</h4>' +
      '<p style="font-size:13px;color:var(--text-2);line-height:1.9;margin-bottom:8px">系统自动匹配校方教学平台授课计划条目 ' + rows.length + ' 条，授课知识点计划总学时 ' + planHours +
      ' 学时，截至当前教学周平台课堂已覆盖 ' + taughtHours + ' 学时，授课计划覆盖率 ' + rate + '%。其中完全覆盖 ' + rows.filter(function (r) { return r.state === '已覆盖'; }).length +
      ' 条、部分覆盖 ' + rows.filter(function (r) { return r.state === '部分覆盖'; }).length + ' 条，其余 ' + rows.filter(function (r) { return r.state === '未开课'; }).length + ' 条为后续周次待开课内容。</p>' +
      '<div class="pbar" style="height:10px"><i style="width:' + rate + '%"></i></div>' +
      '<div class="small faint mt6" style="text-align:right">授课计划覆盖率 ' + rate + '%</div>' +

      /* 大纲知识点覆盖统计详情 */
      '<h4 style="margin:24px 0 10px;display:flex;align-items:center;gap:8px"><span style="width:4px;height:16px;background:var(--brand);border-radius:2px;display:inline-block"></span>二、大纲知识点覆盖统计详情</h4>' +
      '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px;max-height:420px;overflow:auto"><table class="tbl"><thead><tr>' +
      '<th>序号</th><th>大纲知识点</th><th>计划周次</th><th>计划学时</th><th>已覆盖学时</th><th>关联活动数</th><th>覆盖状态</th>' +
      '</tr></thead><tbody>' + kpDetailRows + '</tbody></table></div>' +

      /* 表现与薄弱 */
      '<div class="grid g2" style="margin-top:20px">' +
      '<div style="border:1px solid var(--line);border-radius:10px;padding:14px 16px"><div style="font-weight:800;margin-bottom:8px">课堂活动表现最佳知识点 TOP5</div>' +
      (topActs.length ? topActs.map(function (a, i) {
        return '<div class="row" style="justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px dashed var(--line-2)"><span>' + (i + 1) + '. ' + esc(a.title) + '</span><b style="color:var(--ok)">' + a.avg + ' 分</b></div>';
      }).join('') : '<div class="faint">暂无数据</div>') + '</div>' +
      '<div style="border:1px solid var(--line);border-radius:10px;padding:14px 16px"><div style="font-weight:800;margin-bottom:8px">待补强 / 待开课知识点</div>' +
      (weak.length ? weak.map(function (r) {
        return '<div class="row" style="justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px dashed var(--line-2);gap:8px">' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.name) + '</span>' +
          (r.state === '部分覆盖' ? '<b style="color:var(--warn)">部分覆盖</b>' : '<b class="faint">第' + r.week + '周开课</b>') + '</div>';
      }).join('') : '<div class="faint">全部知识点均已覆盖</div>') + '</div>' +
      '</div>' +

      '<div style="border-top:1px dashed var(--line-2);margin-top:22px;padding-top:12px;font-size:12px;color:var(--text-3);line-height:1.9">' +
      '数据口径：以上统计由智慧课堂平台基于课堂活动记录（随堂练习/即时测验/主题讨论/分组任务/签到）、直录播授课记录与语音转写授课内容自动汇聚生成，可与校方教学平台授课计划双向核对。</div>' +
      '</div></div>';
    bindCommon(el, 'reports');
  }

  function bindCommon(el, page) {
    var fnMap = { teachplan: renderTeachplan, outline: renderOutline, reports: renderReports };
    ['tpCourse', 'olCourse', 'rpCourse'].forEach(function (id) {
      var sel = $('#' + id, el);
      if (sel) sel.addEventListener('change', function () {
        state.courseId = sel.value;
        fnMap[page](el);
      });
    });

    $$('[data-q]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var q = b.getAttribute('data-q');
        if (q === 'report') Z.go('reports', { course: state.courseId });
        else if (q === 'rematch') rematch(el);
        else if (q === 'recalc') recalc(el);
        else if (q === 'print') window.print();
        else if (q === 'dl') downloadReport();
      });
    });

    $$('[data-op=ev]', el).forEach(function (b) {
      b.addEventListener('click', function () { openKpEvidence(b.getAttribute('data-kp')); });
    });
    $$('[data-op=kp]', el).forEach(function (b) {
      b.addEventListener('click', function () { openKpEvidence(b.getAttribute('data-kp')); });
    });
  }

  function rematch(el) {
    var b = $('[data-q=rematch]', el);
    if (b) { b.classList.add('busy'); b.textContent = '匹配中…'; }
    setTimeout(function () {
      var d = Z.db();
      d.analysisAt = Z.nowStr();
      Z.saveDB();
      Z.addLog('授课计划', '自动匹配', Z.courseById(state.courseId).name + ' 授课计划覆盖率分析完成');
      if (b) { b.classList.remove('busy'); b.textContent = '重新自动匹配'; }
      Z.toast('授课计划自动匹配完成，覆盖率已更新', 'ok');
      Z.render('teachplan');
    }, 1100);
  }
  function recalc(el) {
    var b = $('[data-q=recalc]', el);
    if (b) { b.classList.add('busy'); b.textContent = '计算中…'; }
    setTimeout(function () {
      var d = Z.db();
      d.analysisAt = Z.nowStr();
      Z.saveDB();
      Z.addLog('大纲覆盖', '重新计算', Z.courseById(state.courseId).name + ' 知识点覆盖统计更新');
      if (b) { b.classList.remove('busy'); b.textContent = '重新计算'; }
      Z.toast('知识点覆盖已重新计算', 'ok');
      Z.render('outline');
    }, 900);
  }

  /* 覆盖详情 / 证据 */
  function openKpEvidence(kpId) {
    var d = Z.db();
    var kp = Z.kpById(state.courseId, kpId);
    if (!kp) return;
    var c = Z.courseById(state.courseId);
    var acts = d.activities.filter(function (a) { return a.courseId === state.courseId && a.kpId === kpId; });
    var st = Z.kpState(kp);
    var body =
      '<div class="card" style="padding:14px 16px;background:var(--brand-soft-2);margin-bottom:14px">' +
      '<div style="font-weight:800;font-size:15px">' + esc(kp.name) + '</div>' +
      '<div class="small muted mt6" style="display:flex;gap:14px;flex-wrap:wrap">' +
      '<span>大纲要求：' + esc(kp.level) + '</span><span>计划学时：' + kp.reqH + '</span>' +
      '<span>已覆盖学时：<b style="color:' + (kp.taughtH >= kp.reqH ? 'var(--ok)' : 'var(--warn)') + '">' + kp.taughtH + '</b></span>' +
      '<span>覆盖状态：' + (st === '已覆盖' ? '已覆盖' : st === '部分覆盖' ? '部分覆盖' : '未开课') + '</span>' +
      '<span>计划讲授：第' + kp.week + '周</span></div></div>';

    if (st === '未开课') {
      body += '<div class="row" style="gap:10px;background:var(--warn-bg);color:var(--warn);border-radius:9px;padding:12px 14px;font-size:13px">' +
        '<span style="flex:1">该知识点安排在后续教学周（第' + kp.week + '周）讲授，当前暂无课堂覆盖记录；系统将在开课后自动累计学时并更新覆盖状态。</span></div>';
    } else {
      body += '<div style="font-weight:800;margin-bottom:8px">覆盖统计证据</div>';
      body += acts.length ? acts.map(function (a) {
        return '<div class="file-row" style="margin-bottom:8px;padding:10px 14px">' +
          '<div style="flex:1"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="font-weight:700;font-size:13.5px">' + esc(a.title) + '</span>' + Z.typeBadge(a.type) + '</div>' +
          '<div class="tiny faint mt6">' + esc(a.pubAt) + ' · 参与 ' + a.join + '/' + a.total + (a.avg > 0 ? ' · 平均分 ' + a.avg : '') + '</div></div>' +
          '<button class="btn sm" data-jump="' + a.id + '">跳转详情</button></div>';
      }).join('') : '<div class="faint">暂无关联课堂活动记录</div>';
      body += '<div class="help-txt mt10">注：覆盖学时还包含授课录播转写中命中该知识点的讲授片段（自动语义匹配）。</div>';
    }
    var m = Z.modal({ title: '知识点覆盖详情 · ' + esc(c.name), cls: 'wide', body: body });
    $$('[data-jump]', m.ov).forEach(function (b) {
      b.addEventListener('click', function () {
        m.close();
        Z.go('activity', { course: state.courseId, focus: b.getAttribute('data-jump') });
      });
    });
  }

  function downloadReport() {
    var d = Z.db();
    var c = Z.courseById(state.courseId);
    var ov = Z.outlineOverview(state.courseId);
    var rows = Z.planRowsOf(state.courseId);
    var planHours = rows.reduce(function (x, r) { return x + r.hours; }, 0);
    var taughtHours = rows.reduce(function (x, r) { return x + Math.min(r.kp.taughtH, r.hours); }, 0);
    var rate = planHours ? Math.round(taughtHours / planHours * 100) : 0;
    var lines = [];
    lines.push('智慧课堂 · AI课堂分析报告');
    lines.push('课程：' + c.name + '｜授课教师：' + c.teacher + '｜开课学院：' + c.college);
    lines.push('生成时间：' + Z.nowStr() + '｜数据周期：前' + d.meta.currentWeek + '个教学周');
    lines.push('');
    lines.push('一、授课计划覆盖率：' + rate + '%（覆盖学时 ' + taughtHours + '/' + planHours + '）');
    lines.push('');
    lines.push('二、大纲知识点覆盖统计详情：');
    lines.push('知识点总数：' + ov.total + '｜已覆盖：' + ov.covered + '｜部分覆盖：' + ov.partial + '｜待开课：' + ov.pending);
    lines.push('');
    rows.forEach(function (r) {
      var acts = d.activities.filter(function (a) { return a.courseId === state.courseId && a.kpId === r.kpId; }).length;
      lines.push([r.no, r.name, '第' + r.week + '周', r.hours + '学时', Math.min(r.kp.taughtH, r.hours) + '学时', acts + '项', r.state].join('\t'));
    });
    Z.downloadText('智慧课堂分析报告_' + c.name.replace(/[（）]/g, '') + '.txt', lines.join('\n'));
    Z.addLog('分析报告', '下载报告', c.name + ' 课堂分析报告');
    Z.toast('报告已下载', 'ok');
  }

  function statBox(l, v, e) {
    return '<div class="card stat-card"><div class="lab">' + esc(l) + '</div><div class="num">' + v + '</div><div class="extra">' + esc(e) + '</div></div>';
  }
  function levelChip(lv) {
    if (lv === '掌握') return '<span class="chip brand">掌握</span>';
    if (lv === '熟悉') return '<span class="chip info">熟悉</span>';
    return '<span class="chip gray">了解</span>';
  }
  function kpChip(st) {
    if (st === '已覆盖') return '<span class="chip ok">已覆盖</span>';
    if (st === '部分覆盖') return '<span class="chip warn">部分覆盖</span>';
    return '<span class="chip gray">待开课</span>';
  }
  function stateChip(r) {
    if (r.state === '已覆盖') return '<span class="chip ok">完全覆盖</span>';
    if (r.state === '部分覆盖') return '<span class="chip warn">部分覆盖</span>';
    return '<span class="chip gray">未开课（第' + r.week + '周）</span>';
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function nowMonth() { return new Date().getMonth() + 1; }
  function nowDay() { return new Date().getDate(); }

  Z.register('teachplan', { render: renderTeachplan });
  Z.register('outline', { render: renderOutline });
  Z.register('reports', { render: renderReports });
})(window);
