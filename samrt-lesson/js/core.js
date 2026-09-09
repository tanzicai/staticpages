/* ============================================================
   智慧课堂 — 核心框架：会话守卫 / 路由 / 公共组件 / 工具
   ============================================================ */
(function (global) {
  'use strict';

  var SESSION_KEY = 'zhkt_session';

  /* ---------- 会话守卫 ---------- */
  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  }

  /* ---------- 数据访问 ---------- */
  var _db = null;
  function db() { if (!_db) _db = ZData.load(); return _db; }
  function saveDB() { ZData.save(_db || db()); renderNotices(); }
  function resetDB() { _db = ZData.reset(); renderNotices(); }
  function reloadDB() { _db = ZData.load(); }

  /* ---------- 基础工具 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var _uid = 1000;
  function uid(p) { _uid++; return (p || 'id') + '_' + Date.now().toString(36) + '_' + _uid; }
  function nowStr() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function todayStr() { return nowStr().slice(0, 10); }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return h > 0 ? h + ':' + p(m) + ':' + p(s) : p(m) + ':' + p(s);
  }
  function parseDur(str) {
    var parts = String(str || '').split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  }
  /* ---------- 角色化菜单 ---------- */
  function isAdmin() {
    var s = session();
    if (!s) return false;
    var t = String((s.role || '') + ' ' + (s.name || ''));
    return t.indexOf('管理员') >= 0;
  }
  function coursesMenuLabel() { return isAdmin() ? '课程库' : '我的课程'; }
  function coursesMenuSub() {
    return isAdmin() ? '全校课程库 · 课程资料与教学资源统一管理' : '本学期授课计划与开课信息';
  }
  function courseById(id) {
    return db().courses.filter(function (c) { return c.id === id; })[0] || null;
  }
  function outlineById(courseId) {
    return db().outlines[courseId] || null;
  }
  function kpById(courseId, kpId) {
    var o = outlineById(courseId);
    if (!o) return null;
    for (var i = 0; i < o.chapters.length; i++) {
      var ch = o.chapters[i];
      for (var j = 0; j < ch.kps.length; j++) {
        if (ch.kps[j].id === kpId) return ch.kps[j];
      }
    }
    return null;
  }
  function actById(id) {
    var list = db().activities.filter(function (a) { return a.id === id; });
    return list[0] || null;
  }

  /* ---------- 日志与通知 ---------- */
  function addLog(module, action, detail) {
    var d = db();
    d.logs.unshift({ id: uid('l'), time: nowStr(), user: (session() || {}).name || '系统', module: module, action: action, detail: detail });
    if (d.logs.length > 200) d.logs = d.logs.slice(0, 200);
    Z.saveDB();
  }
  function addNotice(level, title, txt) {
    var d = db();
    var now = new Date();
    var hm = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    d.notices.unshift({ id: uid('n'), level: level, title: title, txt: txt, time: '今天 ' + hm, read: false });
    Z.saveDB();
  }
  function unreadCount() {
    return db().notices.filter(function (n) { return !n.read; }).length;
  }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    var box = $('#toastBox');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = '<span class="dot-mark"></span><span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, 2600);
  }

  /* ---------- 弹窗 ---------- */
  function overlayBase(html, cls) {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    var m = document.createElement('div');
    m.className = 'modal ' + (cls || '');
    m.innerHTML = html;
    ov.appendChild(m);
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    return { ov: ov, m: m, close: close };
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
  }
  function modal(opts) {
    var title = opts.title || '';
    var html = '<div class="modal-h"><div class="t">' + esc(title) + '</div><button class="x" data-x="1">×</button></div>';
    if (opts.body !== undefined && opts.body !== null) html += '<div class="modal-b">' + opts.body + '</div>';
    if (opts.footer !== undefined && opts.footer !== null) html += '<div class="modal-f">' + (opts.footer || '') + '</div>';
    var inst = overlayBase(html, opts.cls || (opts.wide ? 'wide' : '') || (opts.xl ? 'xl' : ''));
    inst.bodyEl = $('.modal-b', inst.ov);
    inst.footEl = $('.modal-f', inst.ov);
    inst.setBody = function (h) { if (inst.bodyEl) inst.bodyEl.innerHTML = h; };
    inst.setFooter = function (h) { if (inst.footEl) { inst.footEl.innerHTML = h; } else { var f = document.createElement('div'); f.className = 'modal-f'; f.innerHTML = h; $('.modal', inst.ov).appendChild(f); inst.footEl = f; } };
    var xBtn = $('[data-x]', inst.ov);
    if (xBtn) xBtn.addEventListener('click', inst.close);
    document.addEventListener('keydown', escKey);
    function escKey(e) { if (e.key === 'Escape') { inst.close(); document.removeEventListener('keydown', escKey); } }
    var origClose = inst.close;
    inst.close = function () { document.removeEventListener('keydown', escKey); origClose(); };
    if (opts.onClose) { var c0 = inst.close; inst.close = function () { c0(); opts.onClose(); }; }
    return inst;
  }
  function confirm(opts) {
    var m = modal({
      title: opts.title || '操作确认',
      body: '<div style="font-size:14px;line-height:1.8;color:var(--text-2)">' + (opts.body || '确定执行该操作吗？') + '</div>',
      footer: '<button class="btn" data-act="no">取消</button><button class="btn primary" data-act="ok">' + (opts.okTxt || '确定') + '</button>'
    });
    $('[data-act=ok]', m.ov).addEventListener('click', function () { m.close(); if (opts.onOk) opts.onOk(); });
    $('[data-act=no]', m.ov).addEventListener('click', m.close);
    return m;
  }
  function emptyBox(html) {
    return '<div class="tbl-empty"><div class="em-t">暂无数据</div><div style="font-size:12px">' + html + '</div></div>';
  }

  /* ---------- 参与情况伪数据 ---------- */
  function participantsOf(act) {
    var count = Math.min(act.join || 0, 60);
    var out = [];
    for (var i = 0; i < count; i++) {
      var name = ZData.STUDENT_NAMES[i % ZData.STUDENT_NAMES.length];
      var status = '已提交';
      var score = act.avg > 0 ? (act.avg + ((i * 7) % 17) - 8) : 0;
      score = Math.max(60, Math.min(100, Math.round(score * 10) / 10));
      var mm = 10 + (i * 3) % 35;
      var sec = (i * 11) % 60;
      out.push({ name: name, status: status, score: score, spent: fmtDur(mm * 60 + sec) });
    }
    return out;
  }

  /* ---------- 类型徽标 ---------- */
  function typeBadge(type) {
    var meta = ZData.ACT_TYPES[type] || { color: '#5B4AD8', bg: '#EFECFD', fg: '#4336B4' };
    return '<span class="type-badge" style="background:' + meta.bg + ';color:' + meta.fg + '">' +
      '<span class="type-dot" style="background:' + meta.color + '"></span>' + esc(type) + '</span>';
  }
  function chip(text, cls) {
    return '<span class="chip ' + (cls || 'gray') + '"><span class="dot"></span>' + esc(text) + '</span>';
  }
  function actStatusChip(st) {
    if (st === '进行中') return chip('进行中', 'ok');
    if (st === '未开始') return chip('未开始', 'warn');
    return chip('已结束', 'gray');
  }

  /* ---------- 路由 ---------- */
  var ROUTES = {};
  var PAGE_META = {
    dashboard: ['工作台', '课程与课堂数据总览'],
    courses: ['我的课程', '本学期授课计划与开课信息'],
    'course-auth': ['对接课程配置', '校方教学平台课程对接与课堂活动记录设置'],
    schedule: ['选课与排课', '全校排课计划与冲突检测'],
    activity: ['课堂活动', '随堂练习、讨论、分组任务等活动时间轴'],
    teachplan: ['授课计划比对', '授课计划与课堂覆盖情况自动比对'],
    outline: ['大纲覆盖分析', '课程大纲知识点覆盖分析'],
    reports: ['分析报告', '课堂分析报告与知识点覆盖统计详情'],
    resources: ['直录播资源', '授课视频统一管理 · 剪辑 · 权限 · 同步'],
    stt: ['语音转写与翻译', '课堂语音实时转写 · 语义纠正 · 多语种翻译'],
    cloud: ['云端资源库', '课件、教案、视频等资源云存储'],
    supervision: ['在线督导', '课堂实录直连督导评价'],
    evalforms: ['评价表管理', '督导评价表库维护与启停'],
    users: ['用户管理', '平台用户与角色维护'],
    logs: ['操作日志', '平台关键操作审计记录'],
    help: ['帮助中心', '平台使用帮助与常见问题']
  };

  function register(route, view) { ROUTES[route] = view; }

  function currentRoute() {
    var h = location.hash.replace(/^#\/?/, '').split('?')[0];
    return h || 'dashboard';
  }

  function navigate(route, params) {
    if (!ROUTES[route]) route = 'dashboard';
    G.routeParams = params || {};
    location.hash = '#/' + route;
    if (currentRoute() === route) render(route);
  }
  function go(route, params) { navigate(route, params); }

  var _lastRoute = null;
  function render(route) {
    if (!ROUTES[route]) route = 'dashboard';
    if (_lastRoute && _lastRoute !== route && ROUTES[_lastRoute] && ROUTES[_lastRoute].leave) {
      try { ROUTES[_lastRoute].leave(); } catch (e) {}
    }
    var view = ROUTES[route];
    var meta = (PAGE_META[route] || [route, '']).slice();
    if (route === 'courses') { meta = [coursesMenuLabel(), coursesMenuSub()]; }
    $('#tbTitle').textContent = meta[0];
    $('#tbSub').textContent = meta[1];
    document.title = meta[0] + ' · 智慧课堂';
    highlightTopMenu(route);
    var wrap = $('#view');
    wrap.innerHTML = '';
    wrap.scrollTop = 0;
    try {
      view.render(wrap, G.routeParams);
    } catch (e) {
      wrap.innerHTML = '<div class="card pad"><div style="font-weight:800;margin-bottom:8px">页面渲染异常</div><div style="font-size:12px;color:var(--bad)">' + esc(e && e.message ? e.message : e) + '</div></div>';
    }
    if (view.after) view.after(wrap, G.routeParams);
    renderNotices();
    _lastRoute = route;
  }

  /* ---------- 全局状态 ---------- */
  var G = {
    routeParams: {},
    currentCourseId: 'c1'   // 供各页默认课程联动
  };

  /* ---------- 顶部导航高亮 ---------- */
  var ROUTE_GROUP = {
    dashboard: 'dash', courses: 'course', 'course-auth': 'course', schedule: 'course',
    activity: 'analysis', teachplan: 'analysis', outline: 'analysis', reports: 'analysis',
    resources: 'res', stt: 'res', cloud: 'res',
    supervision: 'sup', evalforms: 'sup',
    users: 'sys', logs: 'sys', help: 'help'
  };
  function highlightTopMenu(route) {
    var g = ROUTE_GROUP[route] || 'dash';
    var menu = $('#tmenu');
    if (!menu) return;
    menu.setAttribute('data-active', route);
    $$('#tmenu [data-route]').forEach(function (b) {
      var on = b.getAttribute('data-route') === route;
      b.classList.toggle('sel', on);
      b.setAttribute('data-sel', on ? '1' : '0');
    });
    $$('#tmenu .tgrp').forEach(function (grp) {
      var on = grp.getAttribute('data-g') === g;
      grp.classList.toggle('sel', on);
      grp.setAttribute('data-sel', on ? '1' : '0');
      grp.classList.remove('open');
    });
    $$('#tmenu .tl').forEach(function (tl) {
      var on = tl.getAttribute('data-route') === route || tl.getAttribute('data-g') === g;
      tl.classList.toggle('sel', on);
      tl.setAttribute('data-sel', on ? '1' : '0');
    });
  }

  /* ---------- 通知中心 ---------- */
  function renderNotices() {
    var dot = $('#bellDot');
    var n = unreadCount();
    if (dot) { dot.textContent = n > 99 ? '99+' : n; dot.classList.toggle('hide', n === 0); }
  }
  function openBell() {
    var box = $('#bellList');
    var list = db().notices;
    if (!list.length) { box.innerHTML = '<div class="tbl-empty"><div class="em-t">暂无消息</div></div>'; }
    else {
      box.innerHTML = list.map(function (n) {
        var col = n.level === 'warn' ? 'var(--warn)' : n.level === 'ok' ? 'var(--ok)' : 'var(--brand)';
        return '<div style="display:flex;gap:10px;padding:10px 12px;border-bottom:1px dashed var(--line-2);align-items:flex-start">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + col + ';margin-top:6px;flex:none"></span>' +
          '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">' + esc(n.title) + '</div>' +
          '<div style="font-size:12px;color:var(--text-2);line-height:1.6">' + esc(n.txt) + '</div>' +
          '<div style="font-size:11px;color:var(--text-3);margin-top:3px">' + esc(n.time) + '</div></div></div>';
      }).join('');
    }
    if (unreadCount() > 0) {
      var btn = $('#readAllBell');
      if (btn) btn.style.display = '';
    } else {
      var btn2 = $('#readAllBell');
      if (btn2) btn2.style.display = 'none';
    }
  }

  /* ---------- 用户菜单 / 顶栏 ---------- */
  function bindShell() {
    var s = session();
    var userBtn = $('#userChip'), userMenu = $('#userMenu'), bellBtn = $('#bellBtn'), bellMenu = $('#bellMenu');
    function closeMenus(ex) {
      if (ex !== 'user') userMenu.classList.remove('open');
      if (ex !== 'bell') bellMenu.classList.remove('open');
    }
    userBtn.addEventListener('click', function (e) { e.stopPropagation(); userMenu.classList.toggle('open'); bellMenu.classList.remove('open'); });
    bellBtn.addEventListener('click', function (e) { e.stopPropagation(); bellMenu.classList.toggle('open'); userMenu.classList.remove('open'); openBell(); });
    document.addEventListener('click', function () { closeMenus(); });
    $('#dmLogout').addEventListener('click', function () {
      confirm({ title: '退出登录', body: '确定退出当前账号并返回登录页吗？', okTxt: '退出',
        onOk: function () { localStorage.removeItem(SESSION_KEY); location.href = 'index.html'; } });
    });
    $('#dmProfile').addEventListener('click', function () {
      userMenu.classList.remove('open');
      modal({
        title: '当前账号信息',
        body: '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<div class="row" style="gap:14px"><div class="avatar" style="width:56px;height:56px;font-size:22px">' + esc((s && s.name || '管').slice(0, 1)) + '</div>' +
          '<div><div style="font-weight:800;font-size:16px">' + esc(s ? s.name : '') + '</div>' +
          '<div style="color:var(--text-2);font-size:12.5px;margin-top:2px">' + esc(s ? s.dept + ' · ' + s.role : '') + '</div></div></div>' +
          '<table class="tbl" style="margin-top:6px">' +
          '<tr><th style="width:110px">登录账号</th><td>' + esc(s ? s.user : '') + '</td></tr>' +
          '<tr><th>所属单位</th><td>' + esc(s ? s.dept : '') + '</td></tr>' +
          '<tr><th>最近登录</th><td>' + esc(s ? s.loginAt : '') + '</td></tr>' +
          '</table></div>'
      });
    });
    $('#dmPwd').addEventListener('click', function () {
      userMenu.classList.remove('open');
      var effPwd = function () { return localStorage.getItem('zhkt_pwd') || 'root'; };
      var m = modal({
        title: '修改密码',
        body: '<div class="field"><label>原密码</label><input class="inp" type="password" id="oldPwd"></div>' +
          '<div class="field"><label>新密码</label><input class="inp" type="password" id="newPwd"></div>' +
          '<div class="field"><label>确认新密码</label><input class="inp" type="password" id="newPwd2"></div>' +
          '<div class="help-txt">新密码需不少于 6 位，并包含字母与数字。</div>',
        footer: '<button class="btn" data-x2="1">取消</button><button class="btn primary" data-x2="2">保存</button>'
      });
      $('[data-x2=1]', m.ov).addEventListener('click', m.close);
      $('[data-x2=2]', m.ov).addEventListener('click', function () {
        var o = $('#oldPwd', m.ov).value, n = $('#newPwd', m.ov).value, n2 = $('#newPwd2', m.ov).value;
        if (o !== effPwd()) { Z.toast('原密码不正确', 'bad'); return; }
        if (!n || n.length < 6 || !/[a-zA-Z]/.test(n) || !/[0-9]/.test(n)) { Z.toast('新密码需不少于 6 位且包含字母与数字', 'warn'); return; }
        if (n !== n2) { Z.toast('两次输入的新密码不一致', 'warn'); return; }
        localStorage.setItem('zhkt_pwd', n);
        Z.addLog('账号安全', '修改密码', '平台管理员修改登录密码');
        m.close();
        Z.toast('密码修改成功，下次登录请使用新密码', 'ok');
      });
    });
    $('#readAllBell').addEventListener('click', function () {
      var d = db();
      d.notices.forEach(function (n) { n.read = true; });
      saveDB();
      renderNotices();
      openBell();
    });
    // 顶栏学期
    $('#termPill').textContent = (db().meta && db().meta.term) || '';
    if (s) { $('#userName').textContent = s.name; $('#avatarTxt').textContent = s.name.slice(0, 1); $('#dmAccount').textContent = s.user; }

    // 顶部导航：分组展开 / 收拢
    $$('#tmenu .tgrp').forEach(function (grp) {
      var tg = $('.tg', grp);
      if (!tg) return;
      tg.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = grp.classList.contains('open');
        $$('#tmenu .tgrp').forEach(function (x) { x.classList.remove('open'); });
        if (!open) grp.classList.add('open');
      });
    });
    // 顶部导航：菜单跳转（含下拉子项与直达项）
    $$('#tmenu [data-route]').forEach(function (b) {
      b.addEventListener('click', function () {
        go(b.getAttribute('data-route'));
      });
    });
    document.addEventListener('click', function () {
      $$('#tmenu .tgrp').forEach(function (x) { x.classList.remove('open'); });
    });
  }

  /* ---------- 知识覆盖分析工具 ---------- */
  function kpState(kp) {
    // kp: {taughtH, reqH, week}
    if (!kp.taughtH) return '未开课';          // 含后续周次未开课
    if (kp.taughtH >= kp.reqH) return '已覆盖';
    return '部分覆盖';
  }
  // 返回课程覆盖总览 {rows:[{no,kp,ch,state,chName}], total, covered, partial, pending, rate}
  function outlineOverview(courseId) {
    var o = Z.db().outlines[courseId];
    var out = { rows: [], total: 0, covered: 0, partial: 0, pending: 0 };
    if (!o) return out;
    o.chapters.forEach(function (ch) {
      ch.kps.forEach(function (kp) {
        var st = kpState(kp);
        var item = { kp: kp, chName: ch.ch, chHours: ch.chHours, state: st };
        out.rows.push(item);
        out.total++;
        if (st === '已覆盖') out.covered++;
        else if (st === '部分覆盖') out.partial++;
        else out.pending++;
      });
    });
    out.rate = out.total ? Math.round(((out.covered + out.partial * 0.5) / out.total) * 100) : 0;
    return out;
  }
  // 授课计划条目（由大纲知识点映射，模拟“教学平台授课计划自动匹配”）
  function planRowsOf(courseId) {
    var o = Z.db().outlines[courseId];
    var rows = [];
    if (!o) return rows;
    var no = 0;
    o.chapters.forEach(function (ch) {
      ch.kps.forEach(function (kp) {
        no++;
        rows.push({
          no: no, kpId: kp.id, name: kp.name, chName: ch.ch, week: kp.week,
          hours: kp.reqH, level: kp.level, kp: kp,
          state: kpState(kp),
          matched: true, conf: 96 - (no % 3) * 2   // 自动匹配置信度(模拟)
        });
      });
    });
    return rows;
  }

  /* ---------- 导出 ---------- */
  function downloadText(filename, content) {
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    var s = session();
    if (!s) { location.replace('index.html'); return; }
    bindShell();
    // 管理员视角：课程中心入口显示为“课程库”
    var ci = $$('#tmenu [data-route=courses]')[0];
    if (ci) ci.textContent = coursesMenuLabel();
    renderNotices();
    window.addEventListener('hashchange', function () { render(currentRoute()); });
    render(currentRoute());
    Z.toast('欢迎回来，' + s.name, 'ok');
  }

  global.Z = {
    db: db, saveDB: saveDB, resetDB: resetDB, reloadDB: reloadDB,
    session: session, toast: toast, modal: modal, confirm: confirm, emptyBox: emptyBox,
    esc: esc, uid: uid, nowStr: nowStr, todayStr: todayStr,
    $: $, $$: $$, fmtDur: fmtDur, parseDur: parseDur,
    courseById: courseById, outlineById: outlineById, kpById: kpById, actById: actById,
    addLog: addLog, addNotice: addNotice, unreadCount: unreadCount,
    participantsOf: participantsOf, typeBadge: typeBadge, chip: chip, actStatusChip: actStatusChip,
    kpState: kpState, outlineOverview: outlineOverview, planRowsOf: planRowsOf,
    register: register, go: go, navigate: navigate, currentRoute: currentRoute, G: G,
    downloadText: downloadText,     overlayBase: overlayBase, isAdmin: isAdmin, coursesMenuLabel: coursesMenuLabel, coursesMenuSub: coursesMenuSub,
    boot: boot, render: render
  };
  global.AppBoot = boot;
})(window);
