/* 智课云 · 桌面端应用 */
(function () {
  'use strict';
  const S = window.Store;

  const I = {
    dashboard: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    graph: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M12 7.5v3.5M12 11l-5.2 5.4M12 11l5.2 5.4"/></svg>',
    portal: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg>',
    research: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/><path d="M11 8v6M8 11h6"/></svg>',
    chart: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 5-7"/></svg>',
    shield: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/><path d="M9.5 12l1.8 1.8L15 10"/></svg>',
    bell: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    settings: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>'
  };

  const $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function toast(msg, type) { const w = $('toastWrap'); const t = document.createElement('div'); t.className = 'toast ' + (type || 'info'); t.textContent = msg; w.appendChild(t); setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2200); }
  function courseById(id) { return S.COURSES.filter(function (c) { return c.id === id; })[0]; }
  function courseOfKp(kpId) { return String(kpId).slice(0, 2); }
  function kpById(id) { let r = null; Object.keys(S.data.graph).forEach(function (c) { S.data.graph[c].forEach(function (k) { if (k.id === id) r = k; }); }); return r; }
  function esc4(s) { return esc(s); }

  const App = { session: null, route: 'dashboard', course: 'C1', graphKp: null };

  /* ---------------- 启动 ---------------- */
  function boot() {
    bind();
    const sess = S.getSession();
    if (sess) enter(sess); else showLogin();
  }
  function showLogin() { $('loginView').style.display = 'grid'; $('appView').classList.remove('active'); $('loginUser').value = ''; $('loginPass').value = ''; $('loginError').style.display = 'none'; }
  function enter(sess) {
    App.session = sess;
    $('loginView').style.display = 'none';
    $('appView').classList.add('active');
    $('userName').textContent = sess.name; $('userDept').textContent = sess.dept; $('userAvatar').textContent = sess.name.charAt(0);
    if (!canAccess(App.route, sess.role)) App.route = 'dashboard';
    renderNav(); renderRoleSwitch(); renderBadge(); navigate(App.route);
  }
  function logout() { S.clearSession(); App.session = null; showLogin(); toast('已安全退出登录', 'info'); }
  function submitLogin(e) {
    e.preventDefault();
    const s = S.login($('loginUser').value.trim(), $('loginPass').value);
    if (!s) { const err = $('loginError'); err.textContent = '账号或密码错误，请重新输入'; err.style.display = 'block'; return; }
    enter(s); toast('欢迎回来，' + s.name, 'ok');
  }

  function menuFor(role) { return S.MENUS.filter(function (m) { return m.roles.indexOf(role) >= 0; }); }
  function canAccess(r, role) { const m = S.MENUS.filter(function (x) { return x.id === r; })[0]; return m && m.roles.indexOf(role) >= 0; }

  function renderNav() {
    const menus = menuFor(App.session.role);
    let h = '';
    menus.forEach(function (m) {
      let badge = '';
      if (m.id === 'messages') { const n = S.unreadCount(); if (n > 0) badge = '<span class="badge-mini">' + n + '</span>'; }
      h += '<div class="nav-item' + (m.id === App.route ? ' active' : '') + '" data-act="nav" data-route="' + m.id + '">' + I[m.icon] + '<span>' + m.title + '</span>' + badge + '</div>';
    });
    $('navMenu').innerHTML = h;
    $('sideUser').innerHTML = '<div style="color:#cbd5e1;font-weight:600;font-size:13px">' + esc(App.session.name) + ' · ' + S.roleById(App.session.role).name + '</div>';
  }
  function renderRoleSwitch() {
    const r = S.roleById(App.session.role);
    $('roleAvatar').textContent = r.short; $('roleAvatar').style.background = r.color; $('roleName').textContent = r.name;
    let h = '<div class="dd-title">切换角色（即时生效）</div>';
    S.ROLES.forEach(function (x) {
      const on = x.id === App.session.role;
      h += '<div class="role-item' + (on ? ' active' : '') + '" data-act="role" data-role="' + x.id + '">' +
        '<span class="role-avatar" style="background:' + x.color + '">' + x.short + '</span>' +
        '<span style="flex:1"><b>' + x.name + '</b><small>' + esc(x.desc) + '</small></span>' + (on ? '<span class="ck">✓</span>' : '') + '</div>';
    });
    $('roleDropdown').innerHTML = h;
  }
  function switchRole(id) {
    if (id === App.session.role) { $('roleDropdown').classList.remove('open'); return; }
    App.session.role = id; S.setSession(App.session);
    if (!canAccess(App.route, id)) App.route = 'dashboard';
    closeDropdowns(); renderNav(); renderRoleSwitch(); navigate(App.route);
    toast('已切换为「' + S.roleById(id).name + '」', 'ok');
  }
  function renderBadge() { const n = S.unreadCount(); const b = $('bellBadge'); if (n > 0) { b.style.display = 'grid'; b.textContent = n; } else b.style.display = 'none'; }

  const VIEWS = {};
  function navigate(route) {
    if (!canAccess(route, App.session.role)) route = 'dashboard';
    App.route = route;
    const m = S.MENUS.filter(function (x) { return x.id === route; })[0];
    $('pageTitle').textContent = m.title; $('pageCrumb').textContent = '首页 / ' + m.title;
    renderNav(); closeDropdowns(); closeModal(); closeDrawer();
    const c = $('content'); c.innerHTML = '';
    VIEWS[route](c);
  }

  function card(title, sub, body, headExtra) { return '<section class="card"><div class="card-hd"><h3>' + title + '</h3>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '<span class="spacer"></span>' + (headExtra || '') + '</div>' + body + '</section>'; }

  /* ---------------- 图表 ---------------- */
  function barChart(data, opts) {
    opts = opts || {};
    const max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    let h = '<div class="chart-bars">';
    data.forEach(function (d) {
      const pct = Math.max(2, Math.round(d.value / max * 88));
      const color = d.color ? 'background:' + d.color : '';
      h += '<div class="bar-col"><div class="bar" style="height:' + pct + '%;' + color + '"><span class="val">' + (opts.fmt ? opts.fmt(d.value) : d.value) + '</span></div><div class="bar-lbl">' + esc(d.label) + '</div></div>';
    });
    return h + '</div>';
  }
  function donutChart(data, opts) {
    opts = opts || {};
    const total = data.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    let acc = 0;
    const segs = data.map(function (d) { const s0 = acc / total * 360, s1 = (acc + d.value) / total * 360; acc += d.value; return d.color + ' ' + s0.toFixed(1) + 'deg ' + s1.toFixed(1) + 'deg'; }).join(', ');
    let h = '<div class="donut-wrap"><div class="donut" style="background:conic-gradient(' + segs + ')"><div class="donut-center"><div><b>' + (opts.totalText != null ? opts.totalText : total) + '</b><small>' + (opts.unit || '合计') + '</small></div></div></div><div class="legend" style="flex:1">';
    data.forEach(function (d) { h += '<div class="lg"><span class="sw" style="background:' + d.color + '"></span><span>' + esc(d.label) + '</span><span class="v">' + d.value + (opts.valueUnit || '') + '</span></div>'; });
    return h + '</div></div>';
  }
  function masteryColor(v) { return v >= 85 ? '#16a34a' : v >= 70 ? '#2563eb' : v >= 60 ? '#f59e0b' : '#e11d48'; }

  /* ---------------- 弹窗 / 抽屉 ---------------- */
  let modalSubmit = null;
  function closeModal() { $('modalMask').classList.remove('open'); modalSubmit = null; }
  function closeDrawer() { $('drawerMask').classList.remove('open'); $('drawer').classList.remove('open'); }
  function openModal(title, bodyHtml, footHtml, onSubmit) {
    $('modalTitle').textContent = title; $('modalBody').innerHTML = bodyHtml; $('modalFoot').innerHTML = footHtml || '<button class="btn" data-act="modal-close">关闭</button>';
    modalSubmit = onSubmit || null; $('modalMask').classList.add('open');
  }
  function openDrawer(title, bodyHtml, footHtml) {
    $('drawerTitle').textContent = title; $('drawerBody').innerHTML = bodyHtml; $('drawerFoot').innerHTML = footHtml || '<button class="btn" data-act="drawer-close">关闭</button>';
    $('drawerMask').classList.add('open'); $('drawer').classList.add('open');
  }

  /* ================= 工作台 ================= */
  VIEWS.dashboard = function (c) {
    const role = App.session.role;
    const kps = Object.keys(S.data.graph).reduce(function (a, k) { return a.concat(S.data.graph[k]); }, []);
    const avgMastery = Math.round(kps.reduce(function (a, b) { return a + b.mastery; }, 0) / kps.length);
    const secRisk = (S.data.security.history.length ? 3 : 3);
    const cards = [
      { l: '建设课程', v: S.COURSES.length + ' 门', c: '#2563eb', ico: I.portal },
      { l: '知识图谱知识点', v: kps.length + ' 个', c: '#0ea5e9', ico: I.graph },
      { l: '班级平均掌握率', v: avgMastery + '%', c: '#16a34a', ico: I.chart },
      { l: '资源安全预警', v: secRisk + ' 条', c: '#f59e0b', ico: I.shield }
    ];
    let h = '<div class="stat-row">';
    cards.forEach(function (x) { h += '<div class="stat"><div class="s-ico" style="background:#eef4ff;color:' + x.c + '">' + x.ico + '</div><div class="s-label">' + x.l + '</div><div class="s-value" style="color:' + x.c + '">' + x.v + '</div></div>'; });
    h += '</div>';

    // 章节掌握率
    const chapters = S.CHAPTERS[App.course];
    const chapData = chapters.map(function (name, ci) {
      const list = S.data.graph[App.course].filter(function (k) { return k.chapter === ci; });
      const avg = Math.round(list.reduce(function (a, b) { return a + b.mastery; }, 0) / (list.length || 1));
      return { label: name.slice(0, 6), value: avg };
    });
    const types = ['视频', '文档', '试题', '讨论'];
    const typeData = [
      { label: '视频', value: kps.reduce(function (a, b) { return a + b.video; }, 0), color: '#2563eb' },
      { label: '文档', value: kps.reduce(function (a, b) { return a + b.docs; }, 0), color: '#0ea5e9' },
      { label: '试题', value: kps.reduce(function (a, b) { return a + b.quiz; }, 0), color: '#16a34a' },
      { label: '讨论', value: kps.reduce(function (a, b) { return a + b.discuss; }, 0), color: '#f59e0b' }
    ];
    h += '<div class="grid" style="grid-template-columns:1.5fr 1fr">';
    h += card('《' + courseById(App.course).name + '》各章节平均掌握率', '单位：%', '<div class="card-bd">' + barChart(chapData) + '</div>');
    h += card('课程资源类型分布', '按知识点关联统计', '<div class="card-bd">' + donutChart(typeData, { unit: '项资源' }) + '</div>');
    h += '</div>';

    // 快速入口 + 待办
    const entries = menuFor(role).filter(function (m) { return m.id !== 'dashboard' && m.id !== 'messages' && m.id !== 'settings'; });
    let eh = '<div class="card-bd" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">';
    entries.forEach(function (m) {
      eh += '<div class="paper-item" style="cursor:pointer;margin:0" data-act="nav" data-route="' + m.id + '"><h4>' + m.title + '</h4><div class="meta">点击进入模块</div></div>';
    });
    eh += '</div>';

    const todos = [];
    if (role === 'admin' || role === 'supervisor') { todos.push({ t: '资源安全预警待复核', s: '检测到 3 条高风险资源' }); todos.push({ t: '门户外链有效性巡检', s: '课程门户已发布' }); }
    if (role === 'teacher') { todos.push({ t: '完善课程门户「参考教材」模块', s: '门户配置待完善' }); todos.push({ t: '危大工程案例作业批阅', s: 'A3 作业待批阅 12 份' }); }
    if (role === 'student') { todos.push({ t: '继续学习《建设工程安全管理》', s: '当前知识点：脚手架工程安全技术' }); todos.push({ t: '完成第 2 章章节测验', s: '截止 11-15' }); }
    if (role === 'supervisor') { todos.push({ t: '学困生一键提醒', s: '安全2301班 3 人低于阈值' }); }
    let th = '<div class="card-bd" style="padding-top:8px;padding-bottom:8px">';
    todos.forEach(function (t) { th += '<div class="list-line"><span class="av" style="background:#eef4ff;color:#2563eb">待</span><div class="li-main"><b>' + esc(t.t) + '</b><small>' + esc(t.s) + '</small></div></div>'; });
    th += '</div>';

    h += '<div class="grid" style="grid-template-columns:1.5fr 1fr">';
    h += card('功能入口', '按当前角色开放', eh);
    h += card('待办事项', '', th);
    h += '</div>';
    c.innerHTML = h;
  };

  /* ================= 课程知识图谱（PC） ================= */
  VIEWS.graph = function (c) {
    const courses = S.COURSES.slice();
    let h = '<div class="card"><div class="card-hd"><h3>课程知识图谱</h3><span class="sub">知识图谱 · 目标图谱 · 问题图谱 · 思政图谱</span><span class="spacer"></span>' +
      '<select class="filter" data-act="graph-course">' + courses.map(function (x) { return '<option value="' + x.id + '"' + (x.id === App.course ? ' selected' : '') + '>' + x.name + '</option>'; }).join('') + '</select>' +
      '<button class="btn sm" data-act="graph-mobile">移动端预览</button></div>';
    h += '<div class="card-bd">' + graphHtml(App.course) + '</div></div>';
    c.innerHTML = h;
  };

  function graphHtml(course) {
    const nodes = S.data.graph[course];
    const chapters = S.CHAPTERS[course];
    const W = 980, H = 520;
    const colX = {}; chapters.forEach(function (_, i) { colX[i] = 130 + i * ((W - 220) / (chapters.length - 1 || 1)); });
    const byChap = {}; chapters.forEach(function (_, i) { byChap[i] = []; });
    nodes.forEach(function (n) { byChap[n.chapter].push(n); });
    const pos = {};
    Object.keys(byChap).forEach(function (ci) {
      const list = byChap[ci];
      list.forEach(function (n, i) {
        const gap = H / (list.length + 1);
        pos[n.id] = { x: colX[ci], y: gap * (i + 1) + 10 };
      });
    });
    // 边
    let edges = '';
    nodes.forEach(function (n) {
      (n.pre || []).forEach(function (pid) {
        if (!pos[pid] || !pos[n.id]) return;
        const a = pos[pid], b = pos[n.id];
        const midX = (a.x + b.x) / 2;
        edges += '<path d="M' + a.x + ' ' + a.y + ' C' + midX + ' ' + a.y + ' ' + midX + ' ' + b.y + ' ' + b.x + ' ' + b.y + '" fill="none" stroke="#cbd5e1" stroke-width="1.6" marker-end="url(#arrow)"/>';
      });
    });
    let gh = '<div class="graph-wrap"><div class="graph-canvas" style="width:' + W + 'px;height:' + H + 'px">';
    gh += '<svg class="graph-edges" width="' + W + '" height="' + H + '"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#cbd5e1"/></marker></defs>' + edges + '</svg>';
    nodes.forEach(function (n) {
      const p = pos[n.id];
      const col = masteryColor(n.mastery);
      gh += '<div class="g-node' + (App.graphKp === n.id ? ' active' : '') + '" data-act="graph-node" data-id="' + n.id + '" style="left:' + p.x + 'px;top:' + p.y + 'px;border-color:' + col + '22">' +
        '<div class="g-name">' + esc(n.name) + '</div>' +
        '<div class="g-id">' + n.id + ' · 难度 ' + n.diff + '</div>' +
        '<div class="g-rate"><i style="background:' + col + ';flex:' + n.mastery + '"></i><i style="flex:' + (100 - n.mastery) + '"></i></div>' +
        '</div>';
    });
    gh += '</div></div>';
    gh += '<div style="margin-top:14px">' +
      '<span class="legend-chip"><b style="background:#16a34a"></b>掌握率 ≥85%</span>' +
      '<span class="legend-chip"><b style="background:#2563eb"></b>70%~85%</span>' +
      '<span class="legend-chip"><b style="background:#f59e0b"></b>60%~70%</span>' +
      '<span class="legend-chip"><b style="background:#e11d48"></b>不足 60%</span>' +
      '<span class="legend-chip">箭头：前置知识依赖</span></div>';
    if (App.graphKp && kpById(App.graphKp)) gh += '<div style="margin-top:16px">' + kpPanel(App.graphKp) + '</div>';
    return gh;
  }

  function kpPanel(kpId) {
    const kp = kpById(kpId); if (!kp) return '';
    const an = S.data.analysis[kpId] || { core: '', points: [] };
    const mats = S.data.materials[kpId] || [];
    const pre = (kp.pre || []).map(function (p) { const k = kpById(p); return k ? esc(k.name) : p; }).join('、') || '无';
    let h = '<div class="grid" style="grid-template-columns:1.1fr 1fr">';
    h += card('知识点：' + esc(kp.name), kp.id, '<div class="card-bd">' +
      '<div class="kpi-mini"><div class="k"><div class="l">掌握率</div><div class="v" style="color:' + masteryColor(kp.mastery) + '">' + kp.mastery + '%</div></div>' +
      '<div class="k"><div class="l">完成率</div><div class="v">' + kp.completion + '%</div></div>' +
      '<div class="k"><div class="l">难度</div><div class="v">' + kp.diff + ' / 3</div></div>' +
      '<div class="k"><div class="l">前置知识点</div><div class="v" style="font-size:13px;font-weight:600">' + pre + '</div></div></div>' +
      '<div style="margin-top:16px"><b style="font-size:13px">AI 内容解析</b><p class="muted" style="font-size:13px;line-height:1.8;margin:6px 0 0">' + esc(an.core) + '</p><ul style="font-size:13px;line-height:1.9;color:var(--sub);margin:8px 0 0;padding-left:18px">' + (an.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>' +
      '</div>');
    h += card('关联学习资源', mats.length + ' 项', '<div class="card-bd">' + mats.map(function (m) { return '<div class="list-line"><span class="av" style="background:#f1f5f9;color:#475569">' + esc(m.type) + '</span><div class="li-main"><b>' + esc(m.name) + '</b><small>' + esc(m.size) + '</small></div></div>'; }).join('') +
      '<div style="margin-top:14px"><button class="btn primary" data-act="graph-goto-mobile" data-id="' + kp.id + '">在移动端学习该知识点</button></div></div>');
    h += '</div>';
    return h;
  }

  /* ================= 课程门户与虚拟展厅 ================= */
  VIEWS.portal = function (c) {
    const d = S.data;
    let h = '<div class="mini-tabs"><button class="' + (portalTab === 'build' ? 'active' : '') + '" data-act="portal-tab" data-tab="build">门户搭建与虚拟展厅</button><button class="' + (portalTab === 'preview' ? 'active' : '') + '" data-act="portal-tab" data-tab="preview">门户预览</button></div>';
    h += '<div id="portalPane"></div>';
    c.innerHTML = h;
    renderPortalPane();
  };
  let portalTab = 'build', pickTemplate = 'T2';
  function renderPortalPane() {
    const pane = $('portalPane'); if (!pane) return;
    const info = getPortalInfo();
    if (portalTab === 'build') {
      let h = '<div class="grid" style="grid-template-columns:1fr 1fr">';
      // 左：基础信息 + 模板
      h += card('课程门户基础信息', '填写后生成个性化虚拟展厅', '<div class="card-bd">' +
        '<div class="form-grid" style="grid-template-columns:1fr 1fr">' +
        fld('课程名称', 'p-name', info.name) +
        fld('主讲教师', 'p-teacher', info.teacher) +
        fld('教师团队', 'p-team', info.team) +
        fld('所属院校', 'p-school', info.school) +
        fld('学时 / 学分', 'p-hours', info.hours) +
        fld('参考教材', 'p-book', info.book) +
        '</div>' +
        '<div class="f-field" style="margin-top:14px"><label>课程简介</label><textarea id="p-desc" rows="3">' + esc(info.desc) + '</textarea></div>' +
        '</div>');
      // 模板选择
      let th = '<div class="card-bd"><div class="layout-picker">';
      S.HALL_TEMPLATES.forEach(function (t) {
        th += '<div class="layout-card' + (pickTemplate === t.id ? ' active' : '') + '" data-act="hall-template" data-id="' + t.id + '"><div class="lc-cover" style="background:' + t.color + '">' + t.zones.length + ' 个展区</div><b>' + t.name + '</b><small>' + esc(t.desc) + '</small></div>';
      });
      th += '</div><div style="margin-top:16px;display:flex;gap:10px"><button class="btn primary" data-act="hall-generate">一键生成虚拟展厅</button>' +
        '<button class="btn" data-act="hall-embed">自动嵌入课程门户</button>' +
        (S.data.hall ? '<span class="tag green" style="align-self:center">已生成：' + esc(S.data.hall.template.name) + '</span>' : '') + '</div>' +
        (S.data.hall ? '<div style="margin-top:16px">' + hallHtml() + '</div>' : '') + '</div>';
      h += card('虚拟空间模板', '选择三维空间模板（网页端免插件）', th);
      h += '</div>';
      pane.innerHTML = h;
    } else {
      pane.innerHTML = '<div style="max-width:820px">' + portalPreview(info) + '</div>';
    }
  }
  function fld(label, id, val) { return '<div class="f-field"><label>' + label + '</label><input type="text" id="' + id + '" value="' + esc(val) + '"></div>'; }
  function getPortalInfo() {
    const def = { name: '《建设工程安全管理》智慧课程', teacher: '张恩正', team: '张恩正、李非亚、王海涛', school: '重庆工程职业技术大学', hours: '48 学时 / 3 学分', book: '《建设工程安全管理》（第三版）', desc: '面向安全技术与管理专业，融合 AI 知识图谱、3D 教学资源与虚拟展厅的智慧课程。' };
    try { const raw = localStorage.getItem('zky_portal'); return raw ? Object.assign(def, JSON.parse(raw)) : def; } catch (e) { return def; }
  }
  function collectPortal() {
    const info = {
      name: val('p-name'), teacher: val('p-teacher'), team: val('p-team'), school: val('p-school'),
      hours: val('p-hours'), book: val('p-book'), desc: val('p-desc')
    };
    localStorage.setItem('zky_portal', JSON.stringify(info)); return info;
  }
  function val(id) { const e = $(id); return e ? e.value.trim() : ''; }

  function hallHtml() {
    const hall = S.data.hall; if (!hall) return '';
    const t = hall.template;
    let h = '<div class="hall"><div class="hall-floor"></div><div class="hall-zones">';
    t.zones.forEach(function (z, i) {
      h += '<div class="hall-zone" data-act="hall-zone" data-zone="' + esc(z) + '"><span class="hz-tag">展区 ' + (i + 1) + '</span><h4>' + esc(z) + '</h4><p>点击进入该展区，查看关联课程资源</p></div>';
    });
    h += '</div></div>';
    h += '<div style="display:flex;gap:16px;margin-top:12px;font-size:12.5px;color:var(--muted)"><span>🖱 漫游：拖拽平移 / 滚轮缩放</span><span>🧭 一键导览：自动漫游全部展区</span><span>🔗 免插件访问：兼容 PC / 移动端</span></div>';
    return h;
  }

  function portalPreview(info) {
    const hall = S.data.hall;
    return '<div class="portal-preview">' +
      '<div class="portal-hero" style="background:' + courseById(App.course).cover + '"><h2>' + esc(info.name) + '</h2><p>' + esc(info.school) + ' · 主讲 ' + esc(info.teacher) + ' · ' + esc(info.hours) + '</p><p style="margin-top:8px">' + esc(info.desc) + '</p></div>' +
      '<div class="portal-mods">' +
      mod('师资团队', esc(info.team)) + mod('参考教材', esc(info.book)) + mod('课程章节', S.CHAPTERS[App.course].length + ' 个章节 · 关联 ' + S.data.graph[App.course].length + ' 个知识点') +
      mod('知识图谱', '知识图谱 / 目标图谱 / 问题图谱 / 思政图谱') + mod('AI 知识库', '已训练课程专属大模型与学习助手') + mod('虚拟展厅', hall ? '已嵌入「' + esc(hall.template.name) + '」（' + hall.template.zones.length + ' 个展区）' : '尚未生成，请前往门户搭建生成') +
      '<div class="portal-mod" style="background:linear-gradient(135deg,#0b2545,#2563eb);color:#fff"><h5 style="color:#fff">3D 教学资源</h5><p style="color:rgba(255,255,255,.8)">每门课程 4 个 3D 模型，支持热点交互</p></div>' +
      '</div></div>';
  }
  function mod(t, p) { return '<div class="portal-mod"><h5>' + t + '</h5><p>' + p + '</p></div>'; }

  /* ================= AI 科研助手 ================= */
  const RESEARCH_CATS = [
    { key: 'interests', title: '研究兴趣', sub: '按主题关键词追踪' },
    { key: 'journals', title: '学术期刊', sub: '按期刊来源追踪' },
    { key: 'scholars', title: '学者', sub: '按学者追踪' },
    { key: 'conferences', title: '学术顶会', sub: '按学术会议追踪' }
  ];
  let resSelected = [];

  VIEWS.research = function (c) {
    let h = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">';
    RESEARCH_CATS.forEach(function (cat) { h += researchCatCard(cat); });
    h += '</div>';

    h += card('自然语言追踪', '用一句话描述研究兴趣，AI 自动追踪最新文献', '<div class="card-bd">' +
      '<div class="chat-input" style="margin-top:0"><input id="res-nl" placeholder="例如：追踪近两年施工安全与数字孪生交叉的最新文献（可输入关键词、主题、方法等）"><button class="btn primary" data-act="res-nl-run">开始智能追踪</button></div>' +
      '</div>');

    h += '<div class="grid" style="grid-template-columns:1.25fr 1fr">';
    h += card('AI 推荐文献', '来自 研究兴趣 / 学术期刊 / 学者 / 学术顶会 的自动推送', recommendListHtml());
    h += card('多文献对话', '观点对比 · 研究方法对比 · 结论对比 · 摘要总结', '<div class="card-bd"><div id="resCmp">' + (resSelected.length >= 2 ? compareHtml(selectedPapers()) : emptyDialogHtml()) + '</div></div>');
    h += '</div>';
    c.innerHTML = h;
  };

  function researchCatCard(cat) {
    const items = S.data.research[cat.key];
    const matched = matchCategory(cat.key);
    let h = '<div class="card" style="margin:0"><div class="card-hd" style="padding:13px 15px"><h3 style="font-size:14px">' + cat.title + '</h3><span class="sub">' + cat.sub + '</span></div><div class="card-bd" style="padding:14px 15px">';
    h += '<div class="rule-chips">';
    items.forEach(function (x) { h += '<span class="rule-chip">' + esc(x) + '<span class="x" data-act="res-chip-del" data-key="' + cat.key + '" data-val="' + esc(x) + '">×</span></span>'; });
    h += '<span class="rule-chip" style="background:#f1f5f9;color:#64748b"><input data-chip-add="' + cat.key + '" placeholder="添加…" style="border:none;background:transparent;outline:none;width:66px;font-size:12.5px"></span>';
    h += '</div>';
    h += '<div style="margin-top:12px;font-size:12px;color:var(--muted)">自动追踪到 <b class="strong">' + matched.length + '</b> 篇最新文献</div>';
    h += '<div style="margin-top:6px">';
    if (matched.length) {
      matched.slice(0, 3).forEach(function (p) {
        h += '<div class="list-line" style="padding:7px 0"><div class="li-main"><b style="font-size:12.5px;font-weight:600">' + esc(p.title.slice(0, 18)) + (p.title.length > 18 ? '…' : '') + '</b><small>' + esc(p.venue) + ' · ' + p.year + '</small></div></div>';
      });
      if (matched.length > 3) h += '<div class="muted" style="font-size:11.5px;margin-top:4px">等共 ' + matched.length + ' 篇</div>';
    } else {
      h += '<div class="muted" style="font-size:12px">暂无命中，请添加追踪项</div>';
    }
    h += '</div></div></div>';
    return h;
  }

  function matchCategory(key) {
    const items = S.data.research[key] || [];
    if (!items.length) return [];
    if (key === 'interests') {
      return S.PAPERS.filter(function (p) {
        const hay = (p.title + p.tags.join('') + p.abstract).toLowerCase();
        return items.some(function (k) { return hay.indexOf(String(k).toLowerCase()) >= 0; });
      });
    }
    if (key === 'journals') return S.PAPERS.filter(function (p) { return p.type === '期刊' && items.indexOf(p.venue) >= 0; });
    if (key === 'conferences') return S.PAPERS.filter(function (p) { return p.type === '会议' && items.indexOf(p.venue) >= 0; });
    return S.PAPERS.filter(function (p) { return items.some(function (n) { return p.authors.indexOf(n) >= 0; }); });
  }

  function recommendMatches() {
    const map = {};
    RESEARCH_CATS.forEach(function (cat) {
      matchCategory(cat.key).forEach(function (p) {
        map[p.id] = map[p.id] || { p: p, src: [] };
        if (map[p.id].src.indexOf(cat.title) < 0) map[p.id].src.push(cat.title);
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function recommendListHtml() {
    const list = recommendMatches();
    let h = '<div class="card-bd">';
    h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span class="muted" style="font-size:12.5px">推荐 <b class="strong">' + list.length + '</b> 篇 · 已勾选 <b class="strong" id="resSelCount">' + resSelected.length + '</b> 篇</span><span style="flex:1"></span>' +
      '<button class="btn primary" data-act="res-compare"' + (resSelected.length < 2 ? ' disabled' : '') + '>发起多文献对话</button></div>';
    if (!list.length) h += '<div class="empty">暂无推荐文献，请在上方配置追踪项</div>';
    list.forEach(function (x) { h += paperItem(x.p, x.src, resSelected.indexOf(x.p.id) >= 0, true); });
    return h + '</div>';
  }

  function emptyDialogHtml() {
    return '<div class="muted" style="font-size:12.5px;line-height:1.9">在左侧「AI 推荐文献」中勾选 <b>2 篇以上</b>文献，点击「发起多文献对话」，即可自动生成：<br>' +
      '① 观点对比　② 研究方法对比　③ 结论对比　④ 摘要总结</div>';
  }

  function selectedPapers() { return S.PAPERS.filter(function (p) { return resSelected.indexOf(p.id) >= 0; }); }

  function paperItem(p, sources, picked, withCheck) {
    sources = sources || [];
    return '<div class="paper-item' + (picked ? ' picked' : '') + '" data-paper="' + p.id + '">' +
      '<h4>' + (withCheck ? '<label style="margin-right:8px"><input type="checkbox" data-act="res-pick" data-id="' + p.id + '"' + (picked ? ' checked' : '') + '></label>' : '') + esc(p.title) + '</h4>' +
      '<div class="meta"><span>' + esc(p.authors) + '</span><span>' + esc(p.venue) + ' · ' + p.year + '</span><span>' + esc(p.type) + '</span><span>被引 ' + p.cite + '</span></div>' +
      (sources.length ? '<div style="margin-top:8px">' + sources.map(function (s) { return '<span class="tag blue" style="margin-right:6px">来自' + esc(s) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="tags" style="margin-top:8px">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div style="margin-top:10px;font-size:12.5px;color:var(--sub);line-height:1.7">' + esc(p.abstract) + '</div>' +
      '<div style="margin-top:10px;display:flex;gap:10px;align-items:center">' +
      '<select class="filter" data-act="res-cite" data-id="' + p.id + '"><option value="APA">APA</option><option value="MLA">MLA</option><option value="GB/T 7714">GB/T 7714</option></select>' +
      '<button class="btn sm" data-act="res-copy" data-id="' + p.id + '">复制引用</button>' +
      '</div></div>';
  }

  function firstSentence(s) { const m = String(s).split(/。|\.\s/); return (m[0] || s) + '。'; }
  function methodOf(p) {
    const t = p.title + p.tags.join('') + p.abstract;
    if (/学习|图谱|模型|算法|AI|大语言|智能|数字孪生|仿真/.test(t)) return '数据驱动 / 智能算法建模，结合平台验证';
    if (/试验|实测|监测|载荷|折减|计算|反演|可靠度/.test(t)) return '现场实测 / 理论计算，与既有方法对比验证';
    return '文献综述 / 典型案例归纳分析';
  }
  function conclusionOf(p) {
    return (p.tags[0] || '该方向') + '方面具有明确应用价值，可为课程建设与工程实践提供支撑。';
  }

  function compareHtml(picked) {
    if (picked.length < 2) return emptyDialogHtml();
    function dim(title, fn) {
      return '<div class="cmp-card" style="margin-bottom:12px"><h4>' + title + '</h4>' +
        picked.map(function (p, i) {
          return '<p style="margin:8px 0"><b>' + (i + 1) + '. ' + esc(p.title.slice(0, 20)) + (p.title.length > 20 ? '…' : '') + '</b><br>' + esc(fn(p)) + '</p>';
        }).join('') + '</div>';
    }
    let h = '<div style="margin-bottom:12px;font-size:12.5px;color:var(--muted)">已勾选 ' + picked.length + ' 篇：' + picked.map(function (p) { return esc(p.title.slice(0, 12)) + '…'; }).join('、') + '</div>';
    h += dim('① 观点对比', function (p) { return firstSentence(p.abstract); });
    h += dim('② 研究方法对比', function (p) { return methodOf(p); });
    h += dim('③ 结论对比', function (p) { return conclusionOf(p); });
    h += dim('④ 摘要总结', function (p) { return p.abstract; });
    h += '<div class="cmp-card"><h4>综合摘要</h4><p>以上 ' + picked.length + ' 篇文献围绕「' + esc(picked.map(function (p) { return p.tags[0]; }).join('、')) + '」等主题展开，研究方法互补、结论一致，可作为课程建设与教研工作的参考文献。</p></div>';
    return h;
  }

  function citation(p, style) {
    const a = p.authors;
    const mark = p.type === '会议' ? 'C' : 'J';
    if (style === 'APA') return a + ' (' + p.year + '). ' + p.title + '. ' + p.venue + '. https://doi.org/' + p.doi;
    if (style === 'MLA') return a + ' "' + p.title + '." ' + p.venue + ', ' + p.year + '.';
    return a + '. ' + p.title + '[' + mark + ']. ' + p.venue + ', ' + p.year + '. DOI:' + p.doi + '.';
  }

  /* ================= AI 学情分析 ================= */
  const DIMENSIONS = [
    { key: 'videoRate', name: '视频完成情况' },
    { key: 'hwRate', name: '作业完成情况' },
    { key: 'examRate', name: '考试完成情况' },
    { key: 'activity', name: '课堂活动参与' },
    { key: 'mastery', name: '知识掌握情况' },
    { key: 'score', name: '学生成绩分析' }
  ];
  VIEWS.analytics = function (c) {
    let h = '<div class="mini-tabs">' +
      ['overview|班级总览', 'exam|作业与考试', 'profile|学生画像', 'warn|教学预警', 'ask|AI 学情问答', 'faq|常见问题', 'push|定时推送'].map(function (x) {
        const p = x.split('|'); return '<button class="' + (anaTab === p[0] ? 'active' : '') + '" data-act="ana-tab" data-tab="' + p[0] + '">' + p[1] + '</button>';
      }).join('') + '</div><div id="anaPane"></div>';
    c.innerHTML = h;
    renderAnaPane();
  };
  let anaTab = 'overview', anaStudent = 'S001', anaExam = 'A1', askScope = 'class';
  function classAvg(k) { const st = getStudents(); return Math.round(st.reduce(function (a, b) { return a + b[k]; }, 0) / st.length); }
  function analyticsData() { if (!S.data.analytics) { S.data.analytics = { faq: [], subs: [] }; S.save(); } return S.data.analytics; }

  function renderAnaPane() {
    const pane = $('anaPane'); if (!pane) return;
    const st = getStudents();
    if (anaTab === 'overview') {
      let h = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">';
      DIMENSIONS.forEach(function (d) {
        const v = classAvg(d.key), unit = d.key === 'score' ? '' : '%';
        h += '<div class="stat"><div class="s-label">' + d.name + '</div><div class="s-value" style="font-size:23px;color:' + masteryColor(v) + '">' + v + unit + '</div>' +
          '<div style="margin-top:8px"><button class="btn sm" data-act="push-add" data-metric="' + d.name + '">关注并定时推送</button></div></div>';
      });
      h += '</div>';
      h += card('班级各维度完成情况', '安全2301班 · ' + st.length + ' 人', '<div class="card-bd">' + barChart(DIMENSIONS.map(function (d) { return { label: d.name.slice(0, 5), value: classAvg(d.key) }; })) + '</div>');
      const dist = { '优秀': 0, '良好': 0, '及格': 0, '不及格': 0 };
      st.forEach(function (s) { if (s.score >= 90) dist['优秀']++; else if (s.score >= 80) dist['良好']++; else if (s.score >= 60) dist['及格']++; else dist['不及格']++; });
      const scoreDonut = [
        { label: '优秀 (≥90)', value: dist['优秀'], color: '#16a34a' },
        { label: '良好 (80-89)', value: dist['良好'], color: '#2563eb' },
        { label: '及格 (60-79)', value: dist['及格'], color: '#f59e0b' },
        { label: '不及格 (<60)', value: dist['不及格'], color: '#e11d48' }
      ];
      const chap = S.CHAPTERS[App.course].map(function (ch, ci) {
        const list = S.data.graph[App.course].filter(function (k) { return k.chapter === ci; });
        return { label: ch.slice(0, 6), value: Math.round(list.reduce(function (a, b) { return a + b.mastery; }, 0) / (list.length || 1)) };
      });
      h += '<div class="grid" style="grid-template-columns:1fr 1fr">';
      h += card('学生成绩分布', '成绩分析', '<div class="card-bd">' + donutChart(scoreDonut, { unit: '人' }) + '</div>');
      h += card('各章节知识掌握率', '知识掌握情况', '<div class="card-bd">' + barChart(chap) + '</div>');
      h += '</div>';
      pane.innerHTML = h;
    } else if (anaTab === 'exam') {
      let h = card('作业 / 考试列表', '点击查看题目作答分情况分析', '<div class="table-wrap"><table class="data"><thead><tr><th>名称</th><th>类型</th><th>平均分</th><th>提交率</th><th>难度系数</th><th>操作</th></tr></thead><tbody>' +
        S.ASSIGNMENTS.map(function (a) { return '<tr' + (anaExam === a.id ? ' style="background:#f4f8ff"' : '') + '><td class="strong">' + esc(a.name) + '</td><td>' + esc(a.type) + '</td><td class="mono">' + a.avg + '</td><td class="mono">' + a.submitRate + '%</td><td class="mono">' + a.difficulty + '</td><td><button class="btn ghost sm" data-act="ana-exam" data-id="' + a.id + '">题目作答分析</button></td></tr>'; }).join('') +
        '</tbody></table></div>');
      h += '<div style="margin-top:18px">' + examAnalysisHtml(anaExam) + '</div>';
      pane.innerHTML = h;
    } else if (anaTab === 'profile') {
      let h = '<div class="grid" style="grid-template-columns:1.05fr 1fr">';
      let lh = '<div class="table-wrap"><table class="data"><thead><tr><th>姓名</th><th>完成率</th><th>掌握率</th><th>成绩</th><th>状态</th><th></th></tr></thead><tbody>';
      st.forEach(function (s) {
        lh += '<tr' + (anaStudent === s.id ? ' style="background:#f4f8ff"' : '') + '><td class="strong">' + esc(s.name) + '</td><td class="mono">' + s.completion + '%</td><td class="mono">' + s.mastery + '%</td><td class="mono">' + s.score + '</td>' +
          '<td>' + (s.weak ? '<span class="tag red">需关注</span>' : '<span class="tag green">正常</span>') + '</td>' +
          '<td><button class="btn ghost sm" data-act="ana-student" data-id="' + s.id + '">画像</button></td></tr>';
      });
      lh += '</tbody></table></div>';
      h += card('学生列表', st.length + ' 人 · 点击查看单人画像', lh);
      h += studentProfile(anaStudent);
      h += '</div>';
      pane.innerHTML = h;
    } else if (anaTab === 'warn') {
      const weak = st.filter(function (s) { return s.weak; });
      let h = '<div class="grid" style="grid-template-columns:1fr 1.4fr">';
      h += card('预警规则设置', '针对学习表现较差的学生', '<div class="card-bd">' +
        '<div class="f-field"><label>任务点完成度低于（%）</label><input type="text" id="w-th" value="62"></div>' +
        '<div class="f-field" style="margin-top:12px"><label>综合成绩低于</label><input type="text" id="w-score" value="62"></div>' +
        '<div class="f-field" style="margin-top:12px"><label>提醒渠道</label><div class="rule-chips"><span class="rule-chip">站内信</span><span class="rule-chip">短信</span><span class="rule-chip">电话</span><span class="rule-chip">微信</span></div></div>' +
        '<button class="btn primary" style="margin-top:14px" data-act="warn-run">执行预警筛选</button>' +
        '<button class="btn" style="margin-top:14px;margin-left:8px" data-act="warn-faq">保存为常见问题</button>' +
        '</div>');
      let wh = '<div class="card-bd"><div class="table-wrap"><table class="data"><thead><tr><th>姓名</th><th>完成率</th><th>掌握率</th><th>成绩</th><th>操作</th></tr></thead><tbody>' +
        weak.map(function (s) { return '<tr><td class="strong">' + esc(s.name) + '</td><td class="mono">' + s.completion + '%</td><td class="mono">' + s.mastery + '%</td><td class="mono">' + s.score + '</td><td><button class="btn ghost sm" style="color:var(--danger)" data-act="warn-remind" data-id="' + s.id + '">一键提醒</button></td></tr>'; }).join('') +
        '</tbody></table></div><div style="margin-top:14px"><button class="btn primary" data-act="warn-remind-all">一键提醒全部（' + weak.length + ' 人）</button></div>' +
        '<div id="warnLog" style="margin-top:14px"></div></div>';
      h += card('学困生预警名单', '低于阈值自动筛选', wh);
      h += '</div>';
      pane.innerHTML = h;
    } else if (anaTab === 'ask') {
      const faq = analyticsData().faq;
      let h = '<div class="grid" style="grid-template-columns:1.4fr 1fr">';
      h += card('AI 学情问答', '选择要分析的数据范围，由智能体生成分析', '<div class="card-bd">' +
        '<div class="f-field"><label>分析范围</label><div class="pill-radio">' +
        '<label><input type="radio" name="askScope" data-act="ask-scope" value="class"' + (askScope === 'class' ? ' checked' : '') + '><span>班级整体</span></label>' +
        '<label><input type="radio" name="askScope" data-act="ask-scope" value="exam"' + (askScope === 'exam' ? ' checked' : '') + '><span>单份作业 / 考试</span></label>' +
        '<label><input type="radio" name="askScope" data-act="ask-scope" value="student"' + (askScope === 'student' ? ' checked' : '') + '><span>单个学生</span></label>' +
        '</div></div>' +
        '<div id="askScopeExtra" style="margin-top:12px">' + scopeExtraHtml() + '</div>' +
        '<button class="btn primary" style="margin-top:12px" data-act="ask-run">生成 AI 分析</button>' +
        '<div class="chat" id="askChat" style="margin-top:16px"><div class="chat-msg"><span class="c-av" style="background:#2563eb">AI</span><div class="c-body">您好，我是课程学情分析智能体。请先在上方选择分析范围（班级整体 / 单份作业考试 / 单个学生）后点「生成 AI 分析」；也可直接提问，如：视频与作业完成率对比？</div></div></div>' +
        '<div class="chat-input"><input id="askInput" placeholder="直接提问，如：班级哪些学生需要重点关注？"><button class="btn primary" data-act="ask-send">发送</button></div></div>');
      let fh = '<div class="card-bd">' + (faq.length ? faq.map(function (f, i) { return '<div class="list-line" style="cursor:pointer" data-act="ask-faq" data-q="' + esc(f.q) + '"><span class="av" style="background:#eef4ff;color:#2563eb">问</span><div class="li-main"><b>' + esc(f.q) + '</b><small>' + esc(f.at) + '</small></div></div>'; }).join('') : '<div class="muted" style="font-size:12.5px">暂无保存的常见问题，点击分析结果下方「保存为常见问题」即可。</div>') + '</div>';
      h += card('已保存的常见问题', '点击可重新提问', fh);
      h += '</div>';
      pane.innerHTML = h;
    } else if (anaTab === 'faq') {
      const faq = analyticsData().faq;
      let body = '<div class="card-bd">';
      if (!faq.length) body += '<div class="empty">暂无常见问题。可在「AI 学情问答」或「教学预警」中点击「保存为常见问题」。</div>';
      faq.forEach(function (f, i) {
        body += '<div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px;background:#fff">' +
          '<div style="display:flex;align-items:center;gap:10px"><b style="font-size:14px;flex:1">' + esc(f.q) + '</b><span class="muted" style="font-size:12px">' + esc(f.at) + '</span></div>' +
          '<div style="margin-top:10px;font-size:13px;color:var(--sub);line-height:1.8">' + esc(f.a) + '</div>' +
          '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn sm" data-act="faq-view" data-idx="' + i + '">查看详情</button><button class="btn sm" data-act="ask-faq" data-q="' + esc(f.q) + '">重新提问</button><button class="btn sm danger" data-act="faq-del" data-idx="' + i + '">删除</button></div></div>';
      });
      body += '</div>';
      pane.innerHTML = card('常见问题', '共 ' + faq.length + ' 条 · 随时查看', body);
    } else {
      const subs = analyticsData().subs;
      let h = '<div class="grid" style="grid-template-columns:1fr 1.3fr">';
      let fh = '<div class="card-bd">' +
        '<div class="f-field"><label>关注的数据指标</label><div class="pill-radio">' + DIMENSIONS.map(function (d, i) { return '<label><input type="checkbox" data-push-metric value="' + d.name + '"' + (i < 2 ? ' checked' : '') + '><span>' + d.name + '</span></label>'; }).join('') + '</div></div>' +
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;margin-top:12px">' +
        '<div class="f-field"><label>推送频率</label><select id="push-freq"><option>每日</option><option selected>每周</option><option>每月</option></select></div>' +
        '<div class="f-field"><label>推送时间</label><input type="text" id="push-time" value="周一 09:00"></div>' +
        '<div class="f-field"><label>接收方式</label><select id="push-ch"><option>站内信</option><option>邮件</option><option>短信</option><option>微信</option></select></div>' +
        '</div><button class="btn primary" style="margin-top:12px" data-act="push-create">添加定时推送</button></div>';
      h += card('关注数据 · 定时推送设置', '设置后系统将自动接收关注数据', fh);
      let lh = '<div class="card-bd">' + (subs.length ? subs.map(function (s, i) {
        return '<div class="list-line"><span class="av" style="background:#eef4ff;color:#2563eb">推</span><div class="li-main"><b>' + esc(s.metric) + '</b><small>' + esc(s.freq) + ' · ' + esc(s.time) + ' · ' + esc(s.channel) + '</small></div>' +
          '<button class="btn sm" data-act="sub-toggle" data-idx="' + i + '">' + (s.on ? '已开启' : '已关闭') + '</button><button class="btn sm danger" data-act="sub-del" data-idx="' + i + '">删除</button></div>';
      }).join('') : '<div class="empty">暂无定时推送，请在左侧添加关注指标</div>') + '</div>';
      h += card('我的定时推送', subs.length + ' 项', lh);
      h += '</div>';
      pane.innerHTML = h;
    }
  }
  function getStudents() {
    if (!S.data.studentsRaw) { S.data.studentsRaw = buildStudentList(); S.save(); }
    return S.data.studentsRaw;
  }
  function buildStudentList() {
    const names = ['李娜', '王浩', '陈晨', '赵磊', '孙敏', '周涛', '吴倩', '郑凯', '冯磊', '许静', '何强', '马丽'];
    const rnd = (function () { let s = 991234; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; })();
    return names.map(function (n, i) {
      const completion = Math.round(45 + rnd() * 54), mastery = Math.round(48 + rnd() * 49), score = Math.round(52 + rnd() * 44);
      return { id: 'S' + S.pad(i + 1, 3), name: n, completion: completion, mastery: mastery, score: score, videoRate: Math.round(50 + rnd() * 50), hwRate: Math.round(45 + rnd() * 55), examRate: Math.round(50 + rnd() * 50), activity: Math.round(40 + rnd() * 60), weak: (completion < 62 || mastery < 62 || score < 62) };
    });
  }
  function studentProfile(id) {
    const s = getStudents().filter(function (x) { return x.id === id; })[0];
    if (!s) return '';
    const kps = S.data.graph[App.course].slice(0, 8);
    const heatRows = kps.map(function (k, i) {
      const v1 = Math.max(30, Math.min(100, s.videoRate + (i * 3 % 20) - 10));
      const v2 = Math.max(30, Math.min(100, s.hwRate + (i * 5 % 20) - 8));
      const v3 = Math.max(30, Math.min(100, s.examRate + (i * 2 % 18) - 6));
      const v4 = Math.max(30, Math.min(100, s.activity + (i * 4 % 16) - 5));
      return '<div class="h-hd" style="font-weight:500;color:var(--sub)">' + esc(k.name.slice(0, 8)) + '</div>' +
        cell(v1) + cell(v2) + cell(v3) + cell(v4) + '<div class="h-cell" style="background:' + masteryColor(Math.round((v1 + v2 + v3) / 3)) + '">' + Math.round((v1 + v2 + v3) / 3) + '</div>';
    }).join('');
    let h = card('学生画像 · ' + esc(s.name), s.id, '<div class="card-bd">' +
      '<div class="profile-card"><span class="p-av" style="background:' + (s.weak ? '#e11d48' : '#2563eb') + '">' + esc(s.name.charAt(0)) + '</span>' +
      '<div style="display:flex;gap:18px;flex:1">' +
      ring('完成率', s.completion) + ring('掌握率', s.mastery) + ring('成绩', s.score) +
      '</div></div>' +
      '<div style="margin-top:18px"><b style="font-size:13px">知识点掌握情况（颜色越深掌握越好）</b><div class="heat" style="margin-top:10px">' +
      '<div class="h-hd">知识点</div><div class="h-hd">视频</div><div class="h-hd">作业</div><div class="h-hd">测验</div><div class="h-hd">讨论</div><div class="h-hd">掌握</div>' +
      heatRows +
      '</div></div>' +
      '<div style="margin-top:16px"><b style="font-size:13px">AI 画像分析评价</b><p class="muted" style="font-size:13px;line-height:1.8;margin:6px 0 0">' + esc(profileEval(s)) + '</p></div>' +
      (s.weak ? '<div style="margin-top:16px"><button class="btn primary" data-act="warn-remind" data-id="' + s.id + '">一键提醒该学生</button></div>' : '') +
      '</div>');
    return h;
  }
  function profileEval(s) {
    const trend = s.mastery >= 85 ? '整体表现优秀，学习自主性强' : s.mastery >= 70 ? '整体表现良好，仍有提升空间' : s.mastery >= 60 ? '基本达标，需加强薄弱环节' : '学习相对滞后，建议重点关注';
    return s.name + '：完成率 ' + s.completion + '%、掌握率 ' + s.mastery + '%、成绩 ' + s.score + ' 分，' + trend + '。' +
      '视频完成率 ' + s.videoRate + '%、作业完成率 ' + s.hwRate + '%、考试完成率 ' + s.examRate + '%、课堂活动参与 ' + s.activity + '%。' +
      (s.weak ? '该生已进入学困生预警名单，建议任课教师针对性辅导并及时提醒。' : '建议保持当前学习节奏，并适当拓展综合实践。');
  }
  function cell(v) { return '<div class="h-cell" style="background:' + masteryColor(v) + '">' + v + '</div>'; }
  function ring(label, v) {
    const c = '--p:' + v + (v >= 85 ? ';--primary:#16a34a' : v >= 60 ? ';--primary:#2563eb' : ';--primary:#e11d48');
    return '<div style="text-align:center"><div class="ring" style="' + c + '"><b>' + v + '%</b></div><div style="font-size:12px;color:var(--muted);margin-top:6px">' + label + '</div></div>';
  }

  /* AI 学情问答 */
  function askAnswer(q) {
    const st = getStudents();
    const avg = function (k) { return Math.round(st.reduce(function (a, b) { return a + b[k]; }, 0) / st.length); };
    q = q || '';
    if (/掌握|整体|情况|完成/.test(q)) {
      return '安全2301班共 ' + st.length + ' 人：平均完成率 ' + avg('completion') + '%，平均掌握率 ' + avg('mastery') + '%，平均成绩 ' + avg('score') + ' 分。其中视频观看完成率最高（' + avg('videoRate') + '%），作业完成率相对偏低（' + avg('hwRate') + '%），建议加强作业督促。';
    }
    if (/考试|测验|失分|题目/.test(q)) {
      const a = S.ASSIGNMENTS.slice().sort(function (x, y) { return x.avg - y.avg; })[0];
      return '当前平均分最低的是《' + a.name + '》（平均 ' + a.avg + ' 分，提交率 ' + a.submitRate + '%）。失分集中在难度系数 ' + a.difficulty + ' 以上的题目，建议针对该知识点补充微课与随堂练习。';
    }
    if (/学生|关注|学困|名单|提醒/.test(q)) {
      const weak = st.filter(function (s) { return s.weak; });
      return '共有 ' + weak.length + ' 名学生需要重点关注：' + weak.map(function (s) { return s.name + '（掌握 ' + s.mastery + '%）'; }).join('、') + '。可在「教学预警」中一键提醒。';
    }
    if (/视频|作业|对比/.test(q)) {
      return '视频观看完成率 ' + avg('videoRate') + '%，作业完成率 ' + avg('hwRate') + '%，两者相差 ' + Math.abs(avg('videoRate') - avg('hwRate')) + ' 个百分点，说明学生更偏好视频学习，作业环节存在拖延。';
    }
    return '已收到您的问题。基于本班数据，我建议重点关注作业完成率与学困生名单，可切换到「班级总览」「教学预警」查看详情。';
  }
  function saveFaq(q, a) {
    const d = analyticsData();
    if (d.faq.some(function (f) { return f.q === q; })) { toast('该问题已保存', 'info'); return; }
    d.faq.unshift({ q: q, a: a, at: new Date().toISOString().slice(0, 10) });
    S.save();
    toast('已保存为常见问题，可在「常见问题」中随时查看', 'ok');
  }
  function askMsgActions(q, a, opts) {
    opts = opts || {};
    let b = '<button class="btn sm" data-act="faq-save" data-q="' + esc(q) + '" data-a="' + esc(a) + '">保存为常见问题</button>';
    if (opts.pushMetric) b += '<button class="btn sm" data-act="push-add" data-metric="' + esc(opts.pushMetric) + '">设为定时推送</button>';
    if (opts.remind) b += '<button class="btn sm danger" data-act="warn-remind-all">一键提醒学困生</button>';
    return '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' + b + '</div>';
  }
  function askPush(q, preAnswer, opts) {
    const chat = $('askChat'); if (!chat) return;
    chat.innerHTML += '<div class="chat-msg me"><span class="c-av">我</span><div class="c-body">' + esc(q) + '</div></div>';
    const a = preAnswer || askAnswer(q);
    setTimeout(function () {
      chat.innerHTML += '<div class="chat-msg"><span class="c-av" style="background:#2563eb">AI</span><div class="c-body">' + esc(a) + askMsgActions(q, a, opts) + '</div></div>';
      chat.scrollTop = chat.scrollHeight;
    }, 260);
  }
  function askFaq(q) {
    if (anaTab !== 'ask') { anaTab = 'ask'; navigate('analytics'); setTimeout(function () { askPush(q); }, 40); }
    else askPush(q);
  }
  function scopeExtraHtml() {
    if (askScope === 'class') {
      const dims = [['videoRate', '视频完成情况'], ['hwRate', '作业完成情况'], ['examRate', '考试完成情况'], ['activity', '课堂活动参与'], ['mastery', '知识掌握情况'], ['score', '学生成绩分析']];
      return '<div class="f-field"><label>分析维度（可多选，默认全选）</label><div class="pill-radio">' + dims.map(function (d) { return '<label><input type="checkbox" data-ask-dim value="' + d[0] + '" checked><span>' + d[1] + '</span></label>'; }).join('') + '</div></div>';
    }
    if (askScope === 'exam') {
      return '<div class="f-field"><label>选择作业 / 考试</label><select id="ask-assignment">' + S.ASSIGNMENTS.map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '（' + esc(a.type) + '）</option>'; }).join('') + '</select></div>';
    }
    return '<div class="f-field"><label>选择学生</label><select id="ask-student">' + getStudents().map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select></div>';
  }
  function scopeAnalysis() {
    const st = getStudents();
    const avg = function (k) { return Math.round(st.reduce(function (a, b) { return a + b[k]; }, 0) / st.length); };
    if (askScope === 'class') {
      const dims = [].map.call(document.querySelectorAll('[data-ask-dim]:checked'), function (c) { return c.value; });
      if (!dims.length) return { q: '班级整体数据分析', a: '请至少选择一个分析维度后再生成分析。', opts: {} };
      const map = { videoRate: '视频完成情况', hwRate: '作业完成情况', examRate: '考试完成情况', activity: '课堂活动参与', mastery: '知识掌握情况', score: '学生成绩分析' };
      let a = '【班级整体数据分析】安全2301班共 ' + st.length + ' 人。' + dims.map(function (k) { return map[k] + '：' + avg(k) + (k === 'score' ? ' 分' : '%'); }).join('；') + '。';
      if (dims.indexOf('hwRate') >= 0 && dims.indexOf('videoRate') >= 0 && avg('hwRate') < avg('videoRate')) a += '其中作业完成情况低于视频完成情况，建议加强作业督促。';
      const weak = st.filter(function (s) { return s.weak; }).length;
      if (weak && dims.indexOf('score') >= 0) a += '当前有 ' + weak + ' 名学生进入学困生预警名单，可一键提醒。';
      return { q: '分析班级整体：' + dims.map(function (k) { return map[k]; }).join('、'), a: a, opts: { pushMetric: map[dims[0]], remind: weak > 0 } };
    }
    if (askScope === 'exam') {
      const sel = $('ask-assignment'); const id = sel ? sel.value : 'A1';
      const a0 = S.ASSIGNMENTS.filter(function (x) { return x.id === id; })[0] || S.ASSIGNMENTS[0];
      const items = examItems(a0);
      const great = items.filter(function (q) { return q.rate >= 85; }).length;
      const mid = items.filter(function (q) { return q.rate >= 60 && q.rate < 85; }).length;
      const bad = items.filter(function (q) { return q.rate < 60; }).length;
      const a = '【单份' + a0.type + '题目作答情况分析】' + a0.name + '：平均 ' + a0.avg + ' 分、提交率 ' + a0.submitRate + '%、难度系数 ' + a0.difficulty + '。逐题分情况：' + great + ' 题掌握良好、' + mid + ' 题需巩固、' + bad + ' 题失分集中。' + (bad ? '建议针对失分集中的题目安排专项讲解与随堂练习。' : '整体掌握较好，可适度提高难度。');
      return { q: '分析' + a0.type + '：' + a0.name, a: a, opts: { pushMetric: a0.name } };
    }
    const sel2 = $('ask-student'); const sid = sel2 ? sel2.value : 'S001';
    const s = getStudents().filter(function (x) { return x.id === sid; })[0] || getStudents()[0];
    return { q: '分析学生：' + s.name, a: '【单人画像分析评价】' + profileEval(s), opts: { remind: s.weak } };
  }
  function askRun() { const r = scopeAnalysis(); askPush(r.q, r.a, r.opts); }

  /* ================= 资源智能安全检测 ================= */
  VIEWS.security = function (c) {
    let h = '<div class="mini-tabs">' +
      ['rules|审核规则配置', 'scan|资源检测', 'risk|风险统计', 'correct|文本纠错'].map(function (x) {
        const p = x.split('|'); return '<button class="' + (secTab === p[0] ? 'active' : '') + '" data-act="sec-tab" data-tab="' + p[0] + '">' + p[1] + '</button>';
      }).join('') + '</div><div id="secPane"></div>';
    c.innerHTML = h;
    renderSecPane();
  };
  let secTab = 'rules';
  function renderSecPane() {
    const pane = $('secPane'); if (!pane) return;
    const rules = S.data.security.rules;
    if (secTab === 'rules') {
      let h = '<div class="grid" style="grid-template-columns:1fr 1fr">';
      h += card('关键词与忽略词', '用于命中与豁免审核', '<div class="card-bd">' +
        ruleBox('敏感关键词', 'keywords', rules.keywords, '#fdeef1', '#be123c') +
        ruleBox('忽略词（豁免）', 'ignoreWords', rules.ignoreWords, '#e9f9ef', '#15803d') +
        ruleBox('敏感文本类别', 'sensitiveTexts', rules.sensitiveTexts, '#fff5e6', '#c2710c') +
        '</div>');
      h += card('用户与图片名单', '', '<div class="card-bd">' +
        ruleBox('用户黑名单', 'blacklist', rules.blacklist, '#fdeef1', '#be123c') +
        ruleBox('用户白名单', 'whitelist', rules.whitelist, '#e9f9ef', '#15803d') +
        ruleBox('图片名单', 'imageList', rules.imageList, '#eef4ff', '#1d4ed8') +
        '<button class="btn primary" style="margin-top:12px" data-act="sec-save-rules">保存规则配置</button>' +
        '</div>');
      h += '</div>';
      pane.innerHTML = h;
    } else if (secTab === 'scan') {
      const results = S.data.security.results || {};
      let h = card('资源安全检测', '支持文本 / 图片 / 文档 / 课程多维审核', '<div class="card-bd">' +
        '<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><button class="btn primary" data-act="sec-scan">开始智能检测</button>' +
        '<span class="muted" style="font-size:12.5px">检测项：敏感文本 · 垃圾信息 · 版权水印 · 商业推广</span></div>' +
        '<div class="table-wrap"><table class="data"><thead><tr><th>资源名称</th><th>类型</th><th>大小</th><th>检测结果</th><th>命中规则</th><th>处置</th></tr></thead><tbody>' +
        S.SEC_RESOURCES.map(function (r) {
          const res = results[r.id];
          let badge = '<span class="risk-badge low">未检测</span>', hits = '—';
          if (res) { badge = '<span class="risk-badge ' + (res.level === 'high' ? 'high' : res.level === 'mid' ? 'mid' : 'ok') + '">' + res.label + '</span>'; hits = res.hits.length ? res.hits.join('、') : '无'; }
          return '<tr><td class="strong">' + esc(r.name) + '</td><td>' + esc(r.type) + '</td><td class="mono muted">' + r.size + '</td><td>' + badge + '</td><td class="muted" style="font-size:12.5px">' + esc(hits) + '</td>' +
            '<td class="nowrap"><button class="btn ghost sm" data-act="sec-detail" data-id="' + r.id + '">查看</button>' + (res && res.level !== 'ok' ? '<button class="btn ghost sm" style="color:var(--danger)" data-act="sec-handle" data-id="' + r.id + '">屏蔽</button>' : '') + '</td></tr>';
        }).join('') +
        '</tbody></table></div></div>');
      pane.innerHTML = h;
    } else if (secTab === 'risk') {
      const users = ['营销号 A', 'spam_user_001', '匿名用户 32', '李某某', '推广小号'];
      const rows = users.map(function (u, i) { const posts = 40 + i * 23, spam = 6 + i * 5; return { u: u, posts: posts, spam: spam, rate: (spam / posts * 100).toFixed(1) }; });
      let h = '<div class="grid" style="grid-template-columns:1fr 1.2fr">';
      const riskDonut = [
        { label: '商业推广', value: 9, color: '#e11d48' }, { label: '垃圾信息', value: 12, color: '#f59e0b' },
        { label: '版权风险', value: 4, color: '#8b5cf6' }, { label: '敏感文本', value: 6, color: '#0ea5e9' }
      ];
      h += card('风险维度分布', '按风险类型统计', '<div class="card-bd">' + donutChart(riskDonut, { unit: '条风险' }) + '</div>');
      h += card('用户风险统计', '垃圾发布量 / 垃圾发布率', '<div class="table-wrap"><table class="data"><thead><tr><th>用户</th><th>发布量</th><th>垃圾量</th><th>垃圾发布率</th><th>风险</th></tr></thead><tbody>' +
        rows.map(function (r) { const lvl = Number(r.rate) > 15 ? 'high' : Number(r.rate) > 8 ? 'mid' : 'low'; return '<tr><td class="strong">' + esc(r.u) + '</td><td class="mono">' + r.posts + '</td><td class="mono">' + r.spam + '</td><td class="mono">' + r.rate + '%</td><td><span class="risk-badge ' + lvl + '">' + (lvl === 'high' ? '高风险' : lvl === 'mid' ? '中风险' : '低风险') + '</span></td></tr>'; }).join('') +
        '</tbody></table></div>');
      h += '</div>';
      pane.innerHTML = h;
    } else {
      const sample = '本课件介绍 基坑（槽）工程施工安全 时，强调必须 加微信 获取内部资料，并注意 安全第一、预防为主 的方针。学员可直接 扫码二维码 参加高薪兼职。';
      let h = card('文本智能纠错', '自动识别拼写、语法、搭配、机构名称等问题', '<div class="card-bd">' +
        '<div class="f-field"><label>待校对文本</label><textarea id="corrInput" rows="3">' + esc(sample) + '</textarea></div>' +
        '<button class="btn primary" style="margin-top:12px" data-act="corr-run">开始智能校对</button>' +
        '<div id="corrOut" style="margin-top:16px"></div></div>');
      pane.innerHTML = h;
    }
  }
  function ruleBox(label, key, items, bg, fg) {
    let h = '<div class="f-field" style="margin-bottom:16px"><label>' + label + '</label><div class="rule-chips" data-rulebox="' + key + '">';
    items.forEach(function (x) { h += '<span class="rule-chip" style="background:' + bg + ';color:' + fg + '">' + esc(x) + '<span class="x" data-act="rule-del" data-key="' + key + '" data-val="' + esc(x) + '">×</span></span>'; });
    h += '<span class="rule-chip" style="background:#f1f5f9;color:#64748b"><input data-rule-add="' + key + '" placeholder="添加…" style="border:none;background:transparent;outline:none;width:80px;font-size:12.5px"></span>';
    return h + '</div></div>';
  }
  function scanAll() {
    const rules = S.data.security.rules;
    const results = {};
    S.SEC_RESOURCES.forEach(function (r) {
      const text = (r.name + r.content);
      const hits = [];
      let level = 'ok';
      rules.keywords.forEach(function (k) { if (text.indexOf(k) >= 0 && rules.ignoreWords.indexOf(k) < 0) hits.push('关键词:' + k); });
      rules.imageList.forEach(function (k) { if (text.indexOf(k) >= 0) hits.push('图片名单:' + k); });
      rules.sensitiveTexts.forEach(function (k) { if (text.indexOf(k) >= 0) hits.push('敏感:' + k); });
      if (/水印|版权|出版社/.test(text)) hits.push('版权风险');
      if (/兼职|日结|扫码|广告/.test(text)) hits.push('商业推广');
      if (hits.length >= 2) level = 'high'; else if (hits.length === 1) level = 'mid';
      results[r.id] = { level: level, hits: hits, label: level === 'high' ? '高风险' : level === 'mid' ? '疑似风险' : '合规' };
    });
    S.data.security.results = results;
    S.data.security.history.push({ at: new Date().toISOString(), count: Object.keys(results).filter(function (k) { return results[k].level !== 'ok'; }).length });
    S.save();
  }

  /* ================= 消息中心 / 系统设置 ================= */
  VIEWS.messages = function (c) {
    const msgs = S.data.messages.slice().sort(function (a, b) { return String(b.id).localeCompare(String(a.id)); });
    const unread = msgs.filter(function (m) { return !m.read; }).length;
    let h = '<section class="card"><div class="card-hd"><h3>消息中心</h3><span class="sub">未读 ' + unread + ' 条 / 共 ' + msgs.length + ' 条</span><span class="spacer"></span><button class="btn sm" data-act="msg-allread">全部标为已读</button></div><div>';
    msgs.forEach(function (m) {
      h += '<div class="msg-item ' + (m.read ? 'read' : 'unread') + '" data-act="msg-open" data-id="' + m.id + '"><span class="m-dot"></span><div class="m-body"><b>' + esc(m.title) + '</b> <span class="tag ' + (m.type === '告警' ? 'red' : m.type === '待办' ? 'blue' : m.type === '提醒' ? 'orange' : 'cyan') + '">' + esc(m.type) + '</span><p>' + esc(m.content) + '</p></div><span class="m-time">' + esc(m.createdAt) + '</span></div>';
    });
    h += '</div></section>';
    c.innerHTML = h;
  };

  let setTab = 'users';
  VIEWS.settings = function (c) {
    let h = '<section class="card"><div class="card-hd"><div class="settings-nav">' +
      [['users', '用户与账号'], ['roles', '角色权限'], ['params', '系统参数']].map(function (x) { return '<button data-act="set-tab" data-tab="' + x[0] + '" class="' + (setTab === x[0] ? 'active' : '') + '">' + x[1] + '</button>'; }).join('') +
      '</div></div><div class="card-bd">';
    if (setTab === 'users') {
      h += '<div class="table-wrap"><table class="data"><thead><tr><th>账号</th><th>姓名</th><th>部门</th><th>角色</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        S.ACCOUNTS.map(function (a) { return '<tr><td class="mono strong">' + esc(a.username) + '</td><td>' + esc(a.name) + '</td><td>' + esc(a.dept) + '</td><td><span class="tag blue">' + S.roleById(a.role).name + '</span></td><td><span class="tag green">启用</span></td><td><button class="btn ghost sm" data-act="set-reset" data-user="' + esc(a.username) + '">重置密码</button></td></tr>'; }).join('') +
        '</tbody></table></div>';
    } else if (setTab === 'roles') {
      h += '<p class="muted" style="margin-top:0;font-size:13px">各角色可访问的功能菜单权限。</p><div class="table-wrap"><table class="data"><thead><tr><th>功能菜单</th>' +
        S.ROLES.map(function (r) { return '<th style="text-align:center">' + r.name + '</th>'; }).join('') + '</tr></thead><tbody>';
      S.MENUS.forEach(function (m) {
        h += '<tr><td class="strong">' + m.title + '</td>' + S.ROLES.map(function (r) { return '<td style="text-align:center"><input type="checkbox" data-act="perm" data-menu="' + m.id + '" data-role="' + r.id + '"' + (m.roles.indexOf(r.id) >= 0 ? ' checked' : '') + '></td>'; }).join('') + '</tr>';
      });
      h += '</tbody></table></div><div style="margin-top:16px"><button class="btn primary" data-act="set-save-perm">保存权限配置</button></div>';
    } else {
      const p = getParams();
      h += '<div class="form-grid" style="max-width:720px">' +
        pf('平台名称', 'pf-name', p.name) + pf('建设院校', 'pf-school', p.school) + pf('课程前缀', 'pf-prefix', p.prefix) +
        pf('资源单文件上限(MB)', 'pf-size', p.size) + pf('教学预警阈值(%)', 'pf-threshold', p.threshold) + pf('联系方式', 'pf-contact', p.contact) +
        '</div><div style="margin-top:16px"><button class="btn primary" data-act="set-save-params">保存系统参数</button></div>';
    }
    h += '</div></section>';
    c.innerHTML = h;
  };
  function pf(label, id, v) { return '<div class="f-field"><label>' + label + '</label><input type="text" id="' + id + '" value="' + esc(v) + '"></div>'; }
  function getParams() { const def = { name: '智课云 · AI+智慧课程资源建设与运行平台', school: '重庆工程职业技术大学', prefix: 'GZY26', size: '2048', threshold: '62', contact: '023-61065905' }; try { const r = localStorage.getItem('zky_params'); return r ? Object.assign(def, JSON.parse(r)) : def; } catch (e) { return def; } }

  /* ---------------- 事件 ---------------- */
  function closeDropdowns() { document.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); }); }
  function onClick(e) {
    const roleBtn = e.target.closest('#roleBtn');
    if (roleBtn) { $('roleDropdown').classList.toggle('open'); return; }
    const el = e.target.closest('[data-act]');
    if (!el) { if (!e.target.closest('.role-switch')) closeDropdowns(); return; }
    const act = el.getAttribute('data-act');
    const id = el.getAttribute('data-id');
    switch (act) {
      case 'nav': navigate(el.getAttribute('data-route')); break;
      case 'role': switchRole(el.getAttribute('data-role')); break;
      case 'modal-close': case 'drawer-close': closeModal(); closeDrawer(); break;
      case 'msg-allread': S.data.messages.forEach(function (m) { m.read = true; }); S.save(); renderBadge(); navigate('messages'); toast('已全部标为已读', 'ok'); break;
      case 'msg-open': { const m = S.data.messages.filter(function (x) { return x.id === id; })[0]; if (m && !m.read) { m.read = true; S.save(); renderBadge(); navigate('messages'); } if (m) openDrawer(m.title, '<dl class="detail-list"><dt>类型</dt><dd>' + esc(m.type) + '</dd><dt>时间</dt><dd>' + esc(m.createdAt) + '</dd><dt>内容</dt><dd>' + esc(m.content) + '</dd></dl>'); break; }
      // 图谱
      case 'graph-node': App.graphKp = id; navigate('graph'); break;
      case 'graph-goto-mobile': openDrawer('移动端学习', '<p style="font-size:13.5px;line-height:1.8">知识点「' + esc(kpById(id).name) + '」的微课学习已在移动端就绪。请访问移动端路由 <b>/mobile</b>，进入「课程图谱 → 图谱模式」，点击该知识点即可学习（含分析、学习内容、自测、资料、错题集、讨论）。</p><div style="margin-top:14px"><span class="tag green">移动端已同步</span></div>'); break;
      case 'graph-mobile': openDrawer('移动端知识图谱', '<p style="font-size:13.5px;line-height:1.8">移动端提供 <b>图谱模式 / 大纲模式 / 学习地图模式</b> 三种视图，学生可通过微信公众号、移动 App 访问，支持点击知识点跳转微课深入学习。</p><div style="margin-top:14px"><span class="tag blue">访问路由：/mobile</span></div>'); break;
      // 门户 / 展厅
      case 'portal-tab': portalTab = el.getAttribute('data-tab'); navigate('portal'); break;
      case 'hall-template': pickTemplate = id; renderPortalPane(); break;
      case 'hall-generate': { collectPortal(); const t = S.HALL_TEMPLATES.filter(function (x) { return x.id === pickTemplate; })[0]; S.data.hall = { template: t, generatedAt: new Date().toISOString() }; S.save(); renderPortalPane(); toast('已生成虚拟展厅：' + t.name, 'ok'); break; }
      case 'hall-embed': if (!S.data.hall) { toast('请先生成虚拟展厅', 'warn'); break; } collectPortal(); toast('虚拟展厅已嵌入课程门户页面', 'ok'); break;
      case 'hall-zone': openDrawer('展厅展区：' + el.getAttribute('data-zone'), '<p style="font-size:13.5px;line-height:1.8">该展区内集成了课程介绍、教学视频、音频讲解与 3D 模型等资源，学生靠近对应展区可自动触发音视频讲解。</p><div style="margin-top:14px">' + ['课程介绍视频', '3D 教学模型', '音频讲解', '图文资料'].map(function (x) { return '<div class="list-line"><span class="av" style="background:#eef4ff;color:#2563eb">资</span><div class="li-main"><b>' + x + '</b><small>点击播放 / 查看</small></div></div>'; }).join('') + '</div>'); break;
      // 科研助手
      case 'res-pick': { const pid = id; const i = resSelected.indexOf(pid); if (i >= 0) resSelected.splice(i, 1); else resSelected.push(pid); const item = el.closest('.paper-item'); if (item) item.classList.toggle('picked', resSelected.indexOf(pid) >= 0); const cnt = $('resSelCount'); if (cnt) cnt.textContent = resSelected.length; const cb = document.querySelector('[data-act="res-compare"]'); if (cb) cb.disabled = resSelected.length < 2; break; }
      case 'res-compare': { const box = $('resCmp'); if (box) box.innerHTML = compareHtml(selectedPapers()); break; }
      case 'res-chip-del': { const k = el.getAttribute('data-key'), v = el.getAttribute('data-val'); const arr = S.data.research[k]; const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); S.save(); navigate('research'); break; }
      case 'res-nl-run': { const q = val('res-nl'); if (!q) { toast('请输入追踪内容', 'warn'); break; } const hits = S.PAPERS.filter(function (p) { const hay = (p.title + p.tags.join('') + p.abstract + p.authors).toLowerCase(); return q.split(/[\s,，、]+/).some(function (w) { return w && hay.indexOf(w.toLowerCase()) >= 0; }); }); openDrawer('智能追踪结果', '<p style="font-size:13px;color:var(--muted)">追踪语句：' + esc(q) + '　命中 ' + hits.length + ' 篇</p>' + (hits.length ? hits.map(function (p) { return paperItem(p, ['自然语言追踪'], false, false); }).join('') : '<div class="empty">未匹配到相关文献，请调整关键词</div>')); break; }
      case 'res-copy': { const p = S.PAPERS.filter(function (x) { return x.id === id; })[0]; const sel = document.querySelector('select[data-act="res-cite"][data-id="' + id + '"]'); const style = sel ? sel.value : 'GB'; const txt = citation(p, style); if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(function () { }); openDrawer('引用格式 · ' + style, '<div class="correction" style="font-family:ui-monospace">{{' + esc(txt) + '}}</div><div style="margin-top:12px"><span class="tag green">已复制到剪贴板</span></div>'); break; }
      // 学情
      case 'ana-tab': anaTab = el.getAttribute('data-tab'); navigate('analytics'); break;
      case 'ana-student': anaStudent = id; renderAnaPane(); break;
      case 'ana-exam': anaExam = id; navigate('analytics'); break;
      case 'warn-remind': { const s = getStudents().filter(function (x) { return x.id === id; })[0]; toast('已通过站内信 / 短信 / 微信提醒「' + s.name + '」', 'ok'); break; }
      case 'warn-remind-all': { const weak = getStudents().filter(function (s) { return s.weak; }); const log = $('warnLog'); if (log) log.innerHTML = '<div class="correction">已向 ' + weak.length + ' 名学生发送多渠道提醒（站内信 / 短信 / 电话 / 微信）。<br>' + weak.map(function (s) { return esc(s.name); }).join('、') + '</div>'; toast('已一键提醒 ' + weak.length + ' 名学生', 'ok'); break; }
      case 'warn-run': toast('已按完成度 ' + val('w-th') + '% / 成绩 ' + val('w-score') + ' 重新筛选预警名单', 'ok'); break;
      case 'warn-faq': { const weak = getStudents().filter(function (s) { return s.weak; }); saveFaq('当前教学预警的学困生名单是？', '本次按完成度与成绩阈值筛选出 ' + weak.length + ' 名学困生：' + weak.map(function (s) { return s.name + '（掌握率 ' + s.mastery + '%、成绩 ' + s.score + '）'; }).join('、') + '。建议通过站内信 / 短信 / 电话 / 微信多渠道一键提醒。'); break; }
      case 'ask-run': askRun(); break;
      case 'ask-send': { const q = val('askInput'); if (!q) break; const inp = $('askInput'); if (inp) inp.value = ''; askPush(q); break; }
      case 'ask-faq': askFaq(el.getAttribute('data-q')); break;
      case 'faq-save': { saveFaq(el.getAttribute('data-q'), el.getAttribute('data-a')); break; }
      case 'faq-view': { const f = analyticsData().faq[Number(el.getAttribute('data-idx'))]; if (f) openDrawer('常见问题 · ' + f.q, '<p style="font-size:13px;line-height:1.9">' + esc(f.a) + '</p><div style="margin-top:12px"><span class="tag blue">保存于 ' + esc(f.at) + '</span></div>'); break; }
      case 'faq-del': { const i = Number(el.getAttribute('data-idx')); analyticsData().faq.splice(i, 1); S.save(); navigate('analytics'); toast('已删除该常见问题', 'ok'); break; }
      case 'push-add': { const metric = el.getAttribute('data-metric'); const subs = analyticsData().subs; if (!subs.some(function (s) { return s.metric === metric; })) { subs.unshift({ metric: metric, freq: '每周', time: '周一 09:00', channel: '站内信', on: true }); S.save(); } toast('已订阅「' + metric + '」每周定时推送', 'ok'); break; }
      case 'push-create': { const metrics = [].map.call(document.querySelectorAll('[data-push-metric]:checked'), function (c) { return c.value; }); if (!metrics.length) { toast('请至少选择一个关注指标', 'warn'); break; } const freq = val('push-freq'), time = val('push-time'), ch = val('push-ch'); const subs = analyticsData().subs; metrics.forEach(function (m) { if (!subs.some(function (s) { return s.metric === m; })) subs.unshift({ metric: m, freq: freq, time: time, channel: ch, on: true }); }); S.save(); navigate('analytics'); toast('已添加 ' + metrics.length + ' 项定时推送', 'ok'); break; }
      case 'sub-toggle': { const s = analyticsData().subs[Number(el.getAttribute('data-idx'))]; s.on = !s.on; S.save(); navigate('analytics'); break; }
      case 'sub-del': { analyticsData().subs.splice(Number(el.getAttribute('data-idx')), 1); S.save(); navigate('analytics'); toast('已删除该定时推送', 'ok'); break; }
      // 安全
      case 'sec-tab': secTab = el.getAttribute('data-tab'); navigate('security'); break;
      case 'rule-del': { const k = el.getAttribute('data-key'), v = el.getAttribute('data-val'); const arr = S.data.security.rules[k]; const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); S.save(); renderSecPane(); break; }
      case 'sec-save-rules': S.save(); toast('审核规则配置已保存', 'ok'); break;
      case 'sec-scan': scanAll(); renderSecPane(); { const r = S.data.security.results; const bad = Object.keys(r).filter(function (k) { return r[k].level !== 'ok'; }).length; toast('检测完成，发现 ' + bad + ' 条风险资源', bad ? 'warn' : 'ok'); } break;
      case 'sec-detail': { const res = S.data.security.results[id]; const rr = S.SEC_RESOURCES.filter(function (x) { return x.id === id; })[0]; openDrawer('资源详情 · ' + rr.name, '<dl class="detail-list"><dt>类型</dt><dd>' + esc(rr.type) + '</dd><dt>大小</dt><dd>' + esc(rr.size) + '</dd><dt>检测结果</dt><dd>' + (res ? res.label : '未检测') + '</dd><dt>命中规则</dt><dd>' + (res && res.hits.length ? res.hits.join('、') : '无') + '</dd></dl><div style="margin-top:14px;font-size:13px;color:var(--sub);line-height:1.8">' + esc(rr.content) + '</div>'); break; }
      case 'sec-handle': toast('已屏蔽该资源并记录处置日志', 'ok'); break;
      case 'corr-run': { const t = val('corrInput'); const errs = []; if (t.indexOf('加微信') >= 0) errs.push(['加微信', '删除推广用语，改为“获取学习资料”']); if (t.indexOf('扫码二维码') >= 0) errs.push(['扫码二维码', '“扫码二维码”语义重复，建议改为“扫描二维码”']); if (t.indexOf('高薪兼职') >= 0) errs.push(['高薪兼职', '疑似商业推广信息，建议删除']); $('corrOut').innerHTML = '<div class="correction">' + highlightCorrections(t, errs) + '</div><div style="margin-top:14px">' + (errs.length ? errs.map(function (x, i) { return '<div class="list-line"><span class="av" style="background:#fdeef1;color:#be123c">' + (i + 1) + '</span><div class="li-main"><b>' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></div></div>'; }).join('') : '<span class="tag green">未发现明显问题</span>') + '</div>'; break; }
      case 'set-tab': setTab = el.getAttribute('data-tab'); navigate('settings'); break;
      case 'set-reset': toast('已为账号「' + el.getAttribute('data-user') + '」重置初始密码', 'ok'); break;
      case 'set-save-perm': toast('角色权限配置已保存', 'ok'); break;
      case 'set-save-params': { const p = { name: val('pf-name'), school: val('pf-school'), prefix: val('pf-prefix'), size: val('pf-size'), threshold: val('pf-threshold'), contact: val('pf-contact') }; localStorage.setItem('zky_params', JSON.stringify(p)); toast('系统参数已保存', 'ok'); break; }
    }
  }
  function examItems(a) {
    const mk = [['第 1 题', '单选'], ['第 2 题', '多选'], ['第 3 题', '判断'], ['第 4 题', '简答'], ['第 5 题', '案例']];
    const seed = Math.round(a.difficulty * 100);
    return mk.map(function (m, i) { return { no: m[0], type: m[1], rate: Math.max(22, Math.min(98, 40 + ((seed + i * 17) % 58))) }; });
  }
  function examAnalysisHtml(id) {
    const a = S.ASSIGNMENTS.filter(function (x) { return x.id === id; })[0] || S.ASSIGNMENTS[0];
    const items = examItems(a);
    function cls(r) { return r >= 85 ? { t: '掌握良好', c: 'green' } : r >= 60 ? { t: '需巩固', c: 'orange' } : { t: '失分集中', c: 'red' }; }
    const bars = barChart(items.map(function (q) { return { label: q.no, value: q.rate, color: masteryColor(q.rate) }; }), { fmt: function (v) { return v + '%'; } });
    let table = '<div class="table-wrap"><table class="data"><thead><tr><th>题号</th><th>题型</th><th>正确率</th><th>作答情况</th><th>分析</th></tr></thead><tbody>';
    items.forEach(function (q) {
      const k = cls(q.rate);
      table += '<tr><td class="strong">' + q.no + '</td><td>' + q.type + '</td><td class="mono">' + q.rate + '%</td><td><span class="tag ' + k.c + '">' + k.t + '</span></td><td class="muted" style="font-size:12.5px">' + (q.rate < 60 ? '失分集中，建议补充讲解' : q.rate < 85 ? '部分学生掌握不牢' : '掌握良好') + '</td></tr>';
    });
    table += '</tbody></table></div>';
    const great = items.filter(function (q) { return q.rate >= 85; }).length;
    const mid = items.filter(function (q) { return q.rate >= 60 && q.rate < 85; }).length;
    const bad = items.filter(function (q) { return q.rate < 60; }).length;
    const body = '<div class="card-bd"><p style="font-size:13px;color:var(--muted);margin:0 0 12px">' + esc(a.name) + ' · ' + esc(a.type) + ' · 平均 ' + a.avg + ' 分 · 提交率 ' + a.submitRate + '% · 难度系数 ' + a.difficulty + '</p>' + bars + '<div style="margin-top:16px">' + table + '</div>' +
      '<div style="margin-top:16px;font-size:13px;color:var(--sub);line-height:1.8"><b>AI 分析结论：</b>本次作答中 ' + great + ' 题掌握良好、' + mid + ' 题需巩固、' + bad + ' 题失分集中。' + (bad ? '建议针对失分集中的题目安排专项讲解与随堂练习。' : '整体掌握较好，可适度提高难度。') + '</div></div>';
    return card('题目作答情况分析 · ' + a.name, '按题分情况统计', body);
  }
  function highlightCorrections(text, errs) {
    let out = esc(text);
    errs.forEach(function (e) { out = out.replace(esc(e[0]), '<mark class="err" title="' + esc(e[1]) + '">' + esc(e[0]) + '</mark>'); });
    return out;
  }

  function onInput() { }
  function onKey(e) {
    const t = e.target;
    if (t.hasAttribute && t.hasAttribute('data-chip-add') && e.key === 'Enter' && t.value.trim()) {
      const k = t.getAttribute('data-chip-add'); S.data.research[k].push(t.value.trim()); S.save(); navigate('research');
    }
    if (t.hasAttribute && t.hasAttribute('data-rule-add') && e.key === 'Enter' && t.value.trim()) {
      const k = t.getAttribute('data-rule-add'); S.data.security.rules[k].push(t.value.trim()); S.save(); renderSecPane();
    }
    if (t.id === 'askInput' && e.key === 'Enter') { e.preventDefault(); onClick({ target: $('askInput') }); const btn = document.querySelector('[data-act="ask-send"]'); if (btn) onClick({ target: btn }); }
    if (t.id === 'res-nl' && e.key === 'Enter') { const btn = document.querySelector('[data-act="res-nl-run"]'); if (btn) onClick({ target: btn }); }
  }

  function bind() {
    $('loginForm').addEventListener('submit', submitLogin);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    $('modalClose').addEventListener('click', closeModal);
    $('modalMask').addEventListener('click', function (e) { if (e.target === $('modalMask')) closeModal(); });
    $('drawerClose').addEventListener('click', closeDrawer);
    $('drawerMask').addEventListener('click', closeDrawer);
    $('logoutBtn').addEventListener('click', function () { if (confirm('确定要退出当前账号吗？')) logout(); });
    $('bellBtn').addEventListener('click', function () { if (canAccess('messages', App.session.role)) navigate('messages'); });
    document.addEventListener('change', function (e) {
      const t = e.target;
      if (t.getAttribute && t.getAttribute('data-act') === 'graph-course') { App.course = t.value; App.graphKp = null; navigate('graph'); }
      if (t.getAttribute && t.getAttribute('data-act') === 'ask-scope') { askScope = t.value; const ex = $('askScopeExtra'); if (ex) ex.innerHTML = scopeExtraHtml(); }
    });
    $('globalSearch').addEventListener('keydown', function (e) { if (e.key === 'Enter') { toast('已按关键字定位', 'info'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); closeDrawer(); closeDropdowns(); } });
  }

  window.__zky = App;
  boot();
})();
