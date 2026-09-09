/* ============================================================
   课堂活动 —— 活动时间轴（同步自校方教学平台 / 本平台发布）
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  var state = {
    courseId: 'all',
    typeSel: null,      // null=全部类型
    range: '全部',      // 全部 / 本月 / 本周
    source: 'all'       // all / sync / local
  };

  var WD = ['日', '一', '二', '三', '四', '五', '六'];

  function parsePub(a) {
    var datePart = (a.pubAt || '').split(' ')[0] || '';
    var timePart = (a.pubAt || '').split(' ')[1] || '--:--';
    var dt = new Date(datePart.replace(/-/g, '/'));
    var wd = isNaN(dt.getTime()) ? '' : '周' + WD[dt.getDay()];
    var m = (dt.getMonth() + 1), day = dt.getDate();
    return { datePart: datePart, timePart: timePart, wd: wd, m: m, day: day };
  }

  function isInRange(pubAt, range) {
    var now = new Date();
    var dt = new Date(pubAt.replace(/-/g, '/'));
    if (range === '本周') {
      var start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1); start.setHours(0, 0, 0, 0);
      var end = new Date(start); end.setDate(start.getDate() + 7);
      return dt >= start && dt < end;
    }
    if (range === '本月') {
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    }
    return true;
  }

  function filterActs(d) {
    return d.activities.filter(function (a) {
      if (state.courseId !== 'all' && a.courseId !== state.courseId) return false;
      if (state.typeSel && a.type !== state.typeSel) return false;
      if (state.source === 'sync' && a.source !== '教学平台同步') return false;
      if (state.source === 'local' && a.source !== '本平台发布') return false;
      return isInRange(a.pubAt, state.range);
    }).sort(function (x, y) { return y.pubAt < x.pubAt ? -1 : 1; });
  }

  function render(el) {
    var d = Z.db();
    var rp = Z.G.routeParams || {};
    if (rp.course) { state.courseId = rp.course; }
    if (rp.focus) { var focusId = rp.focus; Z.G.routeParams = {}; setTimeout(function () { openDetailById(focusId); }, 200); }
    if (state.courseId === 'all' && d.courses.length) state.courseId = 'c1';

    var acts = filterActs(d);
    var groups = [];
    acts.forEach(function (a) {
      var p = parsePub(a);
      var key = p.datePart;
      var g = groups.filter(function (x) { return x.key === key; })[0];
      if (!g) { g = { key: key, p: p, items: [] }; groups.push(g); }
      g.items.push(a);
    });
    groups.sort(function (x, y) { return y.key < x.key ? -1 : 1; });

    var allActs = d.activities;
    var stats = {
      month: allActs.filter(function (a) { return isInRange(a.pubAt, '本月'); }).length,
      sync: allActs.filter(function (a) { return a.source === '教学平台同步'; }).length,
      local: allActs.filter(function (a) { return a.source === '本平台发布'; }).length,
      active: allActs.filter(function (a) { return a.status === '进行中'; }).length
    };
    var avgRate = Math.round(allActs.filter(function (a) { return a.total > 0; }).reduce(function (x, a) { return x + a.join / a.total; }, 0) / Math.max(1, allActs.filter(function (a) { return a.total > 0; }).length) * 100);

    var courseOpts = d.courses.map(function (c) {
      return '<option value="' + c.id + '"' + (state.courseId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');

    var typeChips = Object.keys(ZData.ACT_TYPES).map(function (t) {
      var on = state.typeSel === t;
      var meta = ZData.ACT_TYPES[t];
      return '<button class="chip' + (on ? ' brand' : ' gray') + '" style="' + (on ? 'background:' + meta.bg + ';color:' + meta.fg : '') + '" data-type="' + t + '">' + esc(t) + '</button>';
    }).join('');

    el.innerHTML =
      '<div class="page-head"><div><h3>课堂活动</h3>' +
      '<div class="ph-sub">已接入校方教学平台（' + esc(d.meta.platformOrg) + '），随堂练习、主题讨论、分组任务等活动按时间轴统一沉淀</div></div>' +
      '<div class="ph-tools">' +
      '<button class="btn primary" data-q="new">发起活动</button>' +
      '<button class="btn" data-q="sync">立即同步</button>' +
      '<button class="btn" data-q="config">同步配置</button>' +
      '</div></div>' +

      /* 统计条 */
      '<div class="grid g4" style="margin-bottom:12px">' +
      statBox('本月活动', stats.month + ' 次', '随堂练习/讨论/任务等') +
      statBox('教学平台同步', stats.sync + ' 次', '自动同步 · 每日 06:30') +
      statBox('本平台发布', stats.local + ' 次', '教师直接发起') +
      statBox('平均参与率', avgRate + '%', '当前进行中 ' + stats.active + ' 项') +
      '</div>' +

      '<div class="card">' +
      '<div class="filterbar">' +
      '<span class="muted" style="font-size:12.5px">课程</span>' +
      '<select class="sel" id="fCourse">' + courseOpts + '</select>' +
      '<span class="seg" id="fRange">' + ['全部', '本月', '本周'].map(function (r) {
        return '<button class="' + (state.range === r ? 'on' : '') + '" data-range="' + r + '">' + r + '</button>';
      }).join('') + '</span>' +
      '<span class="seg" id="fSource">' +
      '<button class="' + (state.source === 'all' ? 'on' : '') + '" data-src="all">全部来源</button>' +
      '<button class="' + (state.source === 'sync' ? 'on' : '') + '" data-src="sync">教学平台同步</button>' +
      '<button class="' + (state.source === 'local' ? 'on' : '') + '" data-src="local">本平台发布</button></span>' +
      '</div>' +
      '<div class="filterbar" style="border-bottom:none;padding-top:4px">' +
      '<span class="muted" style="font-size:12.5px">类型</span>' +
      '<div class="row wrap" id="typeChips" style="gap:6px">' + typeChips + '</div>' +
      '<span class="faint" style="font-size:12px;margin-left:auto">共 ' + acts.length + ' 项</span>' +
      '</div>' +

      '<div class="card-b">' +
      '<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span class="chip ok">对接正常</span>' +
      '<span style="font-size:12.5px;color:var(--text-2)">' + esc(d.meta.platformOrg) + ' 最近同步：' + esc((d.courses[0] || {}).platform && d.courses[0].platform.syncAt ? d.courses[0].platform.syncAt : '今天 06:30') + '</span>' +
      '</div>' +
      (groups.length ? groups.map(function (g) {
        return '<div class="tl-day">' +
          '<div class="tl-day-h"><span class="dt">' + pad(g.p.m) + '月' + pad(g.p.day) + '日 ' + g.p.wd + '</span>' +
          '<span class="muted" style="font-weight:400">' + g.items.length + ' 项活动</span>' +
          (g.key === Z.todayStr() ? '<span class="chip brand">今天</span>' : '') + '</div>' +
          '<div class="tl-items">' + g.items.map(function (a) { return itemHtml(a, d); }).join('') + '</div>' +
          '</div>';
      }).join('') : Z.emptyBox('当前筛选条件下暂无课堂活动，可点击“立即同步”或“发起活动”。')) +
      '</div></div>';
    bind(el, d);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function statBox(l, v, e) {
    return '<div class="card stat-card"><div class="lab">' + esc(l) + '</div><div class="num">' + v + '</div><div class="extra">' + esc(e) + '</div></div>';
  }

  function itemHtml(a, d) {
    var p = parsePub(a);
    var c = Z.courseById(a.courseId);
    var isOwn = a.source === '本平台发布';
    var rate = a.total ? Math.round(a.join / a.total * 100) : 0;
    return '<div class="tl-item" style="--c:' + (ZData.ACT_TYPES[a.type] || {}).color + '">' +
      '<div class="tl-rail"><span class="tm">' + p.timePart + '</span><span class="wk">第' + a.week + '周</span></div>' +
      '<div class="tl-body">' +
      '<div class="t1">' + Z.typeBadge(a.type) +
      '<span class="at">' + esc(a.title) + '</span>' +
      (a.status === '进行中' ? '<span class="chip ok">进行中</span>' : '') +
      '<span class="chip ' + (a.source === '教学平台同步' ? 'info' : 'brand') + '">' + esc(a.source) + '</span></div>' +
      '<div class="t2">' +
      '<span>课程：' + esc(c ? c.name : '-') + '</span>' +
      '<span>参与 ' + a.join + '/' + a.total + ' 人 · ' + rate + '%</span>' +
      (a.avg > 0 ? '<span>平均分 ' + a.avg + '</span>' : '') +
      '<span>关联知识点：' + esc((Z.kpById(a.courseId, a.kpId) || {}).name || '未关联') + '</span>' +
      '</div>' +
      '<div class="t2"><span class="faint">发布：' + esc(a.pubAt) + ' · ' + esc(a.chapter || '') + '</span></div>' +
      '</div>' +
      '<div class="tl-ops" style="flex:none">' +
      '<button class="btn sm" data-op="detail" data-id="' + a.id + '">参与详情</button>' +
      '<button class="btn sm primary" data-op="platform" data-id="' + a.id + '">教学平台空间</button>' +
      (isOwn ? '<button class="btn sm" data-op="edit" data-id="' + a.id + '">编辑</button>' : '') +
      '<button class="btn sm" data-op="del" data-id="' + a.id + '">移除</button>' +
      '</div></div>';
  }

  function bind(el, d) {
    var fCourse = $('#fCourse', el);
    if (fCourse) fCourse.addEventListener('change', function () {
      state.courseId = fCourse.value; render(el);
    });
    Z.$$('#fRange button', el).forEach(function (b) {
      b.addEventListener('click', function () { state.range = b.getAttribute('data-range'); render(el); });
    });
    Z.$$('#fSource button', el).forEach(function (b) {
      b.addEventListener('click', function () { state.source = b.getAttribute('data-src'); render(el); });
    });
    Z.$$('#typeChips button', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-type');
        state.typeSel = state.typeSel === t ? null : t;
        render(el);
      });
    });

    Z.$$('[data-op]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        var op = b.getAttribute('data-op');
        var act = Z.actById(id);
        if (!act) return;
        if (op === 'detail') openDetail(act, el);
        else if (op === 'platform') openPlatform(act);
        else if (op === 'edit') openEdit(act, el);
        else if (op === 'del') removeAct(act, el);
      });
    });

    Z.$$('[data-q]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var q = b.getAttribute('data-q');
        if (q === 'new') openNew(el);
        else if (q === 'sync') doSync(el);
        else if (q === 'config') openConfig(el);
      });
    });
  }

  /* ---------- 发起 / 编辑 ---------- */
  function openNew(el) {
    openForm(null, el);
  }
  function openEdit(act, el) {
    if (act.source !== '本平台发布') {
      Z.toast('该活动由校方教学平台同步，如需修改请前往教学平台操作', 'warn');
      return;
    }
    openForm(act, el);
  }

  function kpOptions(courseId) {
    var o = Z.outlineById(courseId);
    if (!o) return '';
    var html = '';
    o.chapters.forEach(function (ch) {
      ch.kps.forEach(function (kp) {
        html += '<option value="' + kp.id + '">' + esc(ch.ch.replace(/^第.+?章\s*/, '')) + ' · ' + esc(kp.name) + '</option>';
      });
    });
    return html;
  }

  function openForm(act, el) {
    var d = Z.db();
    var courses = d.courses;
    var cid = act ? act.courseId : state.courseId !== 'all' ? state.courseId : 'c1';
    var course = Z.courseById(cid) || courses[0];
    var typeOptions = Object.keys(ZData.ACT_TYPES).map(function (t) {
      return '<option value="' + t + '"' + (act && act.type === t ? ' selected' : '') + '>' + t + '</option>';
    }).join('');
    var mode = act ? 'edit' : 'new';
    var m = Z.modal({
      title: act ? '编辑课堂活动' : '发起课堂活动',
      cls: 'wide',
      body:
        '<div class="form-grid">' +
        '<div class="field full"><label>活动标题<span class="req">*</span></label><input class="inp" id="fTitle" value="' + esc(act ? act.title : '') + '" placeholder="请输入活动标题"></div>' +
        '<div class="field"><label>活动类型<span class="req">*</span></label><select class="sel" id="fType">' + typeOptions + '</select></div>' +
        '<div class="field"><label>所属课程<span class="req">*</span></label><select class="sel" id="fCourse">' +
        courses.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cid ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field full"><label>关联知识点（课程大纲）</label><select class="sel" id="fKp">' + kpOptions(cid) + '</select></div>' +
        '<div class="field"><label>发布方式</label><select class="sel" id="fMode">' +
        '<option value="now"' + (act ? '' : ' selected') + '>立即发布</option>' +
        '<option value="timed"' + (act ? ' selected' : '') + '>定时发布</option></select></div>' +
        '<div class="field"><label>持续时长（分钟）</label><input class="inp" id="fDur" type="number" min="1" max="120" value="' + (act ? act.durMin : 10) + '"></div>' +
        '<div class="field full"><label>参与班级</label><input class="inp" value="' + esc(course.className) + '" disabled></div>' +
        '<div class="field full"><label>活动说明</label><textarea class="txt" id="fDesc" placeholder="向学生说明活动要求（选填）">' + esc(act ? act.desc || '' : '') + '</textarea></div>' +
        '</div>' +
        (act ? '' : '<div class="help-txt">发布后将实时出现在本课课堂时间轴，学生端可同步查收并参与。</div>'),
      footer: '<button class="btn" data-f="cancel">取消</button><button class="btn primary" data-f="save">' + (act ? '保存修改' : '立即发布') + '</button>'
    });
    // 课程变化联动知识点
    var fC = $('#fCourse', m.ov);
    var fKp = $('#fKp', m.ov);
    fC.addEventListener('change', function () {
      fKp.innerHTML = kpOptions(fC.value);
    });
    Z.$$('[data-f=cancel]', m.ov).forEach(function (b) { b.addEventListener('click', m.close); });
    Z.$('[data-f=save]', m.ov).addEventListener('click', function () {
      var title = $('#fTitle', m.ov).value.trim();
      if (!title) { Z.toast('请填写活动标题', 'warn'); return; }
      var d2 = Z.db();
      var type = $('#fType', m.ov).value;
      var courseId = fC.value;
      var kpId = fKp.value;
      var dur = parseInt($('#fDur', m.ov).value, 10) || 10;
      var courseObj = Z.courseById(courseId);
      var kp = Z.kpById(courseId, kpId);
      var chapter = '';
      if (kp) { Z.outlineById(courseId).chapters.forEach(function (ch) { if (ch.kps.indexOf(kp) >= 0) chapter = ch.ch; }); }
      var modeV = $('#fMode', m.ov).value;
      var desc = $('#fDesc', m.ov).value.trim();

      if (act) {
        var t = Z.actById(act.id);
        t.type = type; t.title = title; t.courseId = courseId; t.kpId = kpId;
        t.chapter = chapter || t.chapter; t.durMin = dur; t.desc = desc;
        Z.saveDB();
        Z.addLog('课堂活动', '编辑活动', '《' + title + '》（' + courseObj.name + '）');
        m.close(); Z.toast('活动已更新', 'ok'); render(el);
      } else {
        var now = new Date();
        var pubAt = Z.nowStr();
        var status = '进行中';
        var join = 0;
        if (modeV === 'timed') {
          var future = new Date(now.getTime() + 6 * 3600 * 1000);
          pubAt = Z.nowStr(); // 保持列表可见；演示统一以当前时间进入时间轴
          status = '未开始';
        } else {
          join = Math.min(courseObj.students, 4 + Math.floor(Math.random() * 20));
          status = '进行中';
        }
        d2.activities.unshift({
          id: Z.uid('a'), courseId: courseId, kpId: kpId || '', chapter: chapter,
          type: type, title: title, source: '本平台发布',
          week: (d2.meta || {}).currentWeek || 8, pubAt: pubAt, status: status,
          join: join, total: courseObj.students, durMin: dur, avg: 0, desc: desc
        });
        Z.saveDB();
        Z.addLog('课堂活动', '发布活动', '《' + title + '》（' + courseObj.name + '）');
        Z.addNotice('info', '活动发布', '您已发布课堂活动《' + title + '》，学生端可立即参与。');
        m.close(); Z.toast('活动发布成功，已加入课堂时间轴', 'ok'); render(el);
      }
    });
  }

  function removeAct(act, el) {
    var isOwn = act.source === '本平台发布';
    Z.confirm({
      title: '移除活动',
      body: '确定移除课堂活动《' + esc(act.title) + '》吗？' + (isOwn ? '' : '<br><span class="faint">该活动由教学平台同步，移除仅作用于本平台视图，不影响教学平台侧数据。</span>'),
      onOk: function () {
        var d = Z.db();
        d.activities = d.activities.filter(function (x) { return x.id !== act.id; });
        Z.saveDB();
        Z.addLog('课堂活动', '移除活动', '《' + act.title + '》');
        Z.toast('活动已移除', 'ok');
        render(el);
      }
    });
  }

  function openDetailById(id) {
    var act = Z.actById(id);
    if (act) openDetail(act);
    else Z.toast('未找到该活动', 'warn');
  }

  function openDetail(act) {
    var list = Z.participantsOf(act);
    var rate = act.total ? Math.round(act.join / act.total * 100) : 0;
    var avgSpend = act.durMin ? Math.round(act.durMin * 0.82) : '-';
    var c = Z.courseById(act.courseId);
    /* 该活动通过“平台调用”关联的视频资源 */
    var calls = (Z.db().resourceCalls || []).filter(function (cc) { return cc.type === 'activity' && cc.refId === act.id; });
    var resById = {};
    calls.forEach(function (cc) {
      var r = Z.db().resources.filter(function (x) { return x.id === cc.resId; })[0];
      if (r) resById[r.id] = r;
    });
    var attIds = Object.keys(resById);
    var attHtml = attIds.length ?
      '<div style="margin-top:14px"><div class="card-h" style="border:1px solid var(--line);border-radius:10px 10px 0 0"><div class="t">关联视频资源<span class="s">由直录播资源「平台调用」绑定</span></div></div>' +
      attIds.map(function (rid) {
        var r = resById[rid];
        return '<div class="file-row" style="border-radius:0;border-top:none;margin:0;padding:9px 12px">' +
          '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">' + esc(r.title) + '</div>' +
          '<div class="tiny faint mt6">' + esc(r.kind) + ' · ' + Z.fmtDur(r.durSec) + ' · ' + esc(r.date) + '</div></div>' +
          '<button class="btn sm primary" data-rplay="' + rid + '">引用播放</button></div>';
      }).join('') + '</div>' : '';
    var m = Z.modal({
      title: '活动参与详情',
      cls: 'wide',
      body:
        '<div class="card" style="margin-bottom:14px;padding:14px 16px;background:var(--brand-soft-2)">' +
        '<div style="font-weight:800;font-size:15px">' + Z.typeBadge(act.type) + ' ' + esc(act.title) + '</div>' +
        '<div class="small muted mt6">课程：' + esc(c ? c.name : '') + '　发布：' + esc(act.pubAt) + '　来源：' + esc(act.source) + '</div></div>' +
        '<div class="grid g4" style="margin-bottom:14px">' +
        statBox('应到人数', act.total + ' 人', '') + statBox('已参与', act.join + ' 人', '参与率 ' + rate + '%') +
        statBox('平均得分', act.avg > 0 ? act.avg : '待统计', '') + statBox('平均用时', avgSpend + ' 分钟', '') +
        '</div>' +
        '<div class="card-h" style="border:1px solid var(--line);border-bottom:none;border-radius:10px 10px 0 0"><div class="t">参与名单<span class="s">' + act.join + ' 人 · 展示前 ' + Math.min(list.length, 12) + ' 条</span></div></div>' +
        '<div class="table-wrap" style="border:1px solid var(--line);border-radius:0 0 10px 10px;max-height:280px;overflow-y:auto">' +
        '<table class="tbl"><tr><th style="width:60px">序号</th><th>学生</th><th>状态</th><th>得分</th><th>用时</th></tr>' +
        list.slice(0, 12).map(function (x, i) {
          return '<tr><td class="num">' + (i + 1) + '</td><td>' + esc(x.name) + '</td>' +
            '<td>' + Z.chip('已提交', 'ok') + '</td>' +
            '<td class="num" style="font-weight:700">' + (x.score > 0 ? x.score : '-') + '</td>' +
            '<td class="num muted">' + x.spent + '</td></tr>';
        }).join('') +
        '</table></div>' + attHtml
    });
    Z.$$('[data-rplay]', m.ov).forEach(function (b) {
      b.addEventListener('click', function () { playLinkedRes(b.getAttribute('data-rplay')); });
    });
  }

  function playLinkedRes(resId) {
    var res = Z.db().resources.filter(function (x) { return x.id === resId; })[0];
    if (!res) { Z.toast('资源不存在或已被移除', 'warn'); return; }
    var slides = (ZData.SLIDE_SETS[res.slides] || ZData.SLIDE_SETS.c1_gen);
    var m = Z.modal({ title: res.title, cls: 'xl', body: '<div id="plH"></div>' });
    ZLesson.mount(Z.$('#plH', m.ov), {
      fallback: { slides: slides, durSec: res.durSec, badge: res.kind, watermark: ((Z.courseById(res.courseId) || {}).name || '') + ' · ' + res.teacher },
      autoStart: false
    });
  }

  /* ---------- 跳转教学平台课程空间 ---------- */
  function openPlatform(act) {
    var c = Z.courseById(act.courseId);
    var list = Z.participantsOf(act);
    var rate = act.total ? Math.round(act.join / act.total * 100) : 0;
    var pid = c ? c.platform.courseId : 'JXP-0000';
    var m = Z.modal({
      title: '校方教学平台 · 课程教学空间',
      cls: 'xl',
      body:
        /* 模拟外部浏览器 */
        '<div style="border:1px solid var(--line);border-radius:12px;overflow:hidden">' +
        '<div style="background:#F0EEF8;padding:8px 14px;display:flex;align-items:center;gap:10px">' +
        '<span style="display:inline-flex;gap:5px"><i style="width:10px;height:10px;border-radius:50%;background:#F4A3B4;display:inline-block"></i>' +
        '<i style="width:10px;height:10px;border-radius:50%;background:#F5D08A;display:inline-block"></i>' +
        '<i style="width:10px;height:10px;border-radius:50%;background:#9ED9B8;display:inline-block"></i></span>' +
        '<span style="flex:1;background:#fff;border:1px solid var(--line);border-radius:16px;padding:3px 14px;font-size:12px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
        'https://jxp.' + esc('edu') + '.cn/course/space?courseId=' + pid + '&actId=' + act.id + '</span>' +
        '<span class="chip ok">统一身份认证已通过</span>' +
        '</div>' +
        '<div style="background:linear-gradient(120deg,#5B4AD8,#7A6BF0);color:#fff;padding:18px 22px">' +
        '<div class="small" style="opacity:.8">课程教学空间 · ' + esc(c ? c.name : '') + '</div>' +
        '<div style="font-size:18px;font-weight:800;margin-top:4px">' + Z.typeBadge(act.type).replace(/<span class="type-dot[\s\S]*?<\/span>/, '') + esc(act.title) + '</div>' +
        '<div class="small mt6" style="opacity:.85">发布教师：' + esc(c ? c.teacher : '') + '　·　发布时间：' + esc(act.pubAt) + '</div></div>' +
        '<div style="padding:18px 22px">' +
        '<div class="grid g4" style="margin-bottom:16px">' +
        statBox('参与人数', act.join + ' / ' + act.total, '') + statBox('提交率', rate + '%', '') +
        statBox('平均分', act.avg > 0 ? act.avg : '统计中', '') + statBox('答题用时', (act.durMin || 10) + ' 分钟', '') +
        '</div>' +
        '<div style="font-weight:800;margin-bottom:8px">参与情况（教学平台实时数据）</div>' +
        '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px;max-height:240px;overflow-y:auto">' +
        '<table class="tbl"><tr><th>序号</th><th>学生</th><th>提交状态</th><th>得分</th><th>提交时间</th><th>用时</th></tr>' +
        list.slice(0, 10).map(function (x, i) {
          return '<tr><td class="num">' + (i + 1) + '</td><td>' + esc(x.name) + '</td><td>' + Z.chip('已提交', 'ok') + '</td>' +
            '<td class="num">' + (x.score > 0 ? x.score : '-') + '</td><td class="num muted">' + esc(act.pubAt.split(' ')[1]) + ' 后 ' + ((i % 9) + 1) + ' 分钟</td><td class="num muted">' + x.spent + '</td></tr>';
        }).join('') + '</table></div>' +
        '<div class="small faint mt10">以上为校方教学平台课程教学空间内该活动的实时参与数据。返回智慧课堂后仍可查看对应课堂分析。</div>' +
        '</div></div>'
    });
  }

  /* ---------- 立即同步 ---------- */
  function doSync(el) {
    var d = Z.db();
    var pool = d.syncPool || [];
    if (!pool.length) {
      Z.toast('已是最新状态：校方教学平台暂无新增课堂活动', 'ok');
      return;
    }
    var btn = Z.$('[data-q=sync]', el);
    if (btn) { btn.classList.add('busy'); btn.textContent = '同步中…'; }
    setTimeout(function () {
      var d2 = Z.db();
      var got = d2.syncPool.slice();
      got.forEach(function (p) {
        var course = Z.courseById(p.courseId);
        d2.activities.unshift({
          id: Z.uid('a'), courseId: p.courseId, kpId: p.kpId || '', chapter: p.chapter || '',
          type: p.type, title: p.title, source: '教学平台同步',
          week: p.week, pubAt: Z.nowStr(), status: '进行中',
          join: Math.min(p.total, 12 + Math.floor(Math.random() * 30)), total: p.total,
          durMin: p.durMin || 10, avg: 0
        });
        if (course && course.platform) course.platform.syncAt = Z.nowStr();
      });
      d2.syncPool = [];
      Z.saveDB();
      Z.addLog('平台对接', '手动同步', '从校方教学平台同步课堂活动 ' + got.length + ' 项');
      Z.addNotice('info', '同步完成', '已从校方教学平台同步 ' + got.length + ' 项课堂活动至时间轴。');
      if (btn) { btn.classList.remove('busy'); btn.textContent = '立即同步'; }
      Z.toast('已从校方教学平台同步 ' + got.length + ' 项课堂活动', 'ok');
      render(el);
    }, 900);
  }

  /* ---------- 同步配置（课堂活动记录功能配置） ---------- */
  function openConfig(el) {
    var d = Z.db();
    var cfg = d.courseSync || {};
    var typeKeys = Object.keys(ZData.ACT_TYPES);
    var m = Z.modal({
      title: '课堂活动记录 · 同步配置',
      cls: 'wide',
      body:
        '<div class="help-txt mb10" style="font-size:12.5px;line-height:1.8">配置“对接教学平台线上课程 — 课堂活动记录”策略：平台将按照下方规则，把校方教学平台对应课程发布的活动自动同步至智慧课堂活动时间轴。</div>' +
        '<div style="font-weight:800;margin-bottom:6px">1. 同步范围（按课程）</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px" id="cfgCourses">' +
        d.courses.map(function (c) {
          var cc = cfg[c.id] || { types: [], auto: c.platform.syncMode.indexOf('自动') >= 0 };
          var cid = c.id;
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:9px;padding:8px 12px">' +
            '<div><div style="font-weight:700;font-size:13px">' + esc(c.name) + '</div>' +
            '<div class="tiny faint">教学平台课程号 ' + esc(c.platform.courseId) + '</div></div>' +
            '<label style="display:flex;gap:6px;font-size:12.5px;color:var(--text-2);align-items:center;white-space:nowrap">' +
            '<input type="checkbox" data-cfgauto="' + cid + '"' + (cc.auto ? ' checked' : '') + '> 自动同步</label></div>';
        }).join('') + '</div>' +
        '<div style="font-weight:800;margin-bottom:6px">2. 同步的活动类型</div>' +
        '<div class="row wrap" style="gap:8px;margin-bottom:8px" id="cfgTypes">' +
        typeKeys.map(function (t, i) {
          var on = true;
          return '<label class="lang-chip' + (on ? ' on' : '') + '" style="display:inline-flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" style="display:none" data-typeck="' + t + '"' + (on ? ' checked' : '') + '>' + t + '</label>';
        }).join('') + '</div>' +
        '<div style="font-weight:800;margin-bottom:6px">3. 同步策略</div>' +
        '<div class="row" style="gap:16px;font-size:13px;color:var(--text-2)">' +
        '<label style="display:flex;gap:6px;align-items:center"><input type="radio" name="cfgStrategy" value="每日自动（06:30）" checked> 每日自动同步（06:30）</label>' +
        '<label style="display:flex;gap:6px;align-items:center"><input type="radio" name="cfgStrategy" value="课后即时同步"> 课后即时同步</label>' +
        '</div>' +
        '<div class="help-txt mt10">同步后的活动以时间轴形式呈现，可一键跳转教学平台课程空间查看参与情况。</div>',
      footer: '<button class="btn" data-cf="cancel">取消</button><button class="btn primary" data-cf="save">保存配置</button>'
    });
    Z.$$('[data-cf=cancel]', m.ov).forEach(function (b) { b.addEventListener('click', m.close); });
    Z.$('[data-cf=save]', m.ov).addEventListener('click', function () {
      var d2 = Z.db();
      var ncfg = d2.courseSync || {};
      d2.courses.forEach(function (c) {
        var cb = Z.$('[data-cfgauto="' + c.id + '"]', m.ov);
        ncfg[c.id] = { auto: cb ? cb.checked : false, types: [] };
      });
      var types = [];
      Z.$$('[data-typeck]', m.ov).forEach(function (cb) { if (cb.checked) types.push(cb.getAttribute('data-typeck')); });
      ncfg.types = types;
      ncfg.strategy = (Z.$('input[name=cfgStrategy]:checked', m.ov) || {}).value || '每日自动（06:30）';
      d2.courseSync = ncfg;
      Z.saveDB();
      Z.addLog('平台对接', '修改同步配置', '更新课堂活动记录同步范围与策略');
      m.close();
      Z.toast('同步配置已保存', 'ok');
      render(el);
    });
  }

  Z.register('activity', { render: render });
})(window);
