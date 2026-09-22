/* ==========================================================================
   app.js —— 应用外壳：顶栏 / 左侧菜单 / 全局搜索 / 通知 / 用户菜单
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, R = w.ZR;

  /* ---------------- 图标（24×24 stroke） ---------------- */
  var P = {
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    doc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="M8.2 12.9L7 22l5-3 5 3-1.2-9.1"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 5-7"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M16 8l-2.3 6.2L7.5 16l2.3-6.2z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    slider: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    edit: '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0119 7a4 4 0 01-3 3.87"/>',
    user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    flow: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3h12V9M12 12v3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    robot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M9 17h6"/>',
    msg: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>',
    check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 005.3 5.3l-8 8a4 4 0 01-5.3-5.3l8-8z"/><path d="M3 21l4-4"/>'
  };
  function icon(name) {
    var d = P[name] || P.grid;
    return D.s('svg', { class: 'ic', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', html: d });
  }

  /* ---------------- 菜单定义 ---------------- */
  function menuFor(role) {
    if (role === 'student') {
      return [
        { g: '我的二课', items: [{ id: 'mine', n: '我的二课', ic: 'home' }] },
        {
          g: '活动与成绩', items: [
            { id: 'square', n: '活动广场', ic: 'compass' },
            { id: 'myact', n: '我报名的', ic: 'check' },
            { id: 'myscore', n: '我的成绩单', ic: 'award' }
          ]
        },
        {
          g: '服务与工具', items: [
            { id: 'apply', n: '分值申报', ic: 'edit' },
            { id: 'club', n: '社团专区', ic: 'users' },
            { id: 'msg', n: '消息通知', ic: 'msg' },
            { id: 'ai', n: 'AI 二课助手', ic: 'robot' }
          ]
        }
      ];
    }
    if (role === 'organizer') {
      return [
        { g: '总览', items: [{ id: 'dash', n: '运行总览', ic: 'grid' }] },
        {
          g: '活动运营', items: [
            { id: 'act', n: '第二课堂活动', ic: 'plus' },
            { id: 'square', n: '活动广场', ic: 'compass' },
            { id: 'actmgr', n: '活动管理', ic: 'list' },
            { id: 'rule', n: '活动规则设置', ic: 'slider' }
          ]
        },
        {
          g: '成绩与评价', items: [
            { id: 'grade', n: '成绩管理', ic: 'award' },
            { id: 'stat', n: '统计分析', ic: 'chart' }
          ]
        },
        {
          g: '协同与智能', items: [
            { id: 'msg', n: '消息通知', ic: 'msg' },
            { id: 'ai', n: 'AI 二课助手', ic: 'robot' },
            { id: 'club', n: '社团管理', ic: 'users' }
          ]
        }
      ];
    }
    if (role === 'auditor') {
      return [
        { g: '总览', items: [{ id: 'dash', n: '运行总览', ic: 'grid' }] },
        {
          g: '审核中心', items: [
            { id: 'audit', n: '活动发布与审核', ic: 'shield' },
            { id: 'apply', n: '分值申报审核', ic: 'edit' },
            { id: 'content', n: '内容安全审核', ic: 'lock' }
          ]
        },
        {
          g: '成绩与评价', items: [
            { id: 'grade', n: '成绩管理', ic: 'award' },
            { id: 'tpl', n: '成绩单模板', ic: 'doc' },
            { id: 'stat', n: '统计分析', ic: 'chart' }
          ]
        }
      ];
    }
    if (role === 'leader') {
      return [
        { g: '总览', items: [{ id: 'dash', n: '学院看板', ic: 'grid' }] },
        {
          g: '成绩与预警', items: [
            { id: 'stat', n: '统计分析', ic: 'chart' },
            { id: 'warn', n: '预警管理', ic: 'bell' },
            { id: 'grade', n: '成绩查询', ic: 'award' }
          ]
        },
        {
          g: '协同', items: [
            { id: 'msg', n: '消息通知', ic: 'msg' },
            { id: 'actmgr', n: '活动管理', ic: 'list' }
          ]
        }
      ];
    }
    /* admin / college 默认（完整菜单） */
    return [
      { g: '总览', items: [{ id: 'dash', n: '运行总览', ic: 'grid' }] },
      {
        g: '活动运营', items: [
          { id: 'act', n: '第二课堂活动', ic: 'plus' },
          { id: 'square', n: '活动广场', ic: 'compass' },
          { id: 'actmgr', n: '活动管理', ic: 'list' },
          { id: 'audit', n: '活动发布与审核', ic: 'shield' },
          { id: 'apply', n: '分值申报', ic: 'edit' },
          { id: 'rule', n: '活动规则设置', ic: 'slider' }
        ]
      },
      {
        g: '成绩与评价', items: [
          { id: 'tpl', n: '成绩单模板', ic: 'doc' },
          { id: 'grade', n: '成绩管理', ic: 'award' },
          { id: 'warn', n: '预警管理', ic: 'bell' },
          { id: 'stat', n: '统计与分析', ic: 'chart' }
        ]
      },
      {
        g: '门户与智能', items: [
          { id: 'screen', n: '二课数据大屏', ic: 'monitor' },
          { id: 'portal', n: '门户配置', ic: 'layout' },
          { id: 'content', n: '内容安全', ic: 'lock' },
          { id: 'ai', n: 'AI 二课助手', ic: 'robot' },
          { id: 'msg', n: '消息通知', ic: 'msg' }
        ]
      },
      {
        g: '组织与运维', items: [
          { id: 'user', n: '用户管理', ic: 'user' },
          { id: 'club', n: '社团管理', ic: 'users' },
          { id: 'party', n: '党团管理', ic: 'flag' },
          { id: 'flow', n: '党团审批工具', ic: 'flow' },
          { id: 'sys', n: '安全与实施保障', ic: 'lock' }
        ]
      }
    ];
  }

  /** 供页面调用：数据变更后刷新侧栏角标（无需整页重渲染） */
  function refreshBadges() {
    var b = sidebarBadges();
    D.qa('.nav-i').forEach(function (n) {
      var id = n.getAttribute('data-id');
      var old = D.q('.cnt', n);
      if (old) old.remove();
      if (b[id]) n.appendChild(D.h('span.cnt' + (b[id].hot ? '.hot' : ''), b[id].n));
    });
  }

  var APP = { icon: icon, menuFor: menuFor, refreshBadges: refreshBadges, sidebarBadges: sidebarBadges };

  /* ---------------- 顶栏 ---------------- */
  function renderTop(host) {
    var s = w.ZA.session;
    var brand = D.h('div.brand',
      D.h('div.logo', '二'),
      D.h('span', '第二课堂成绩单系统'),
      D.h('small', w.DB.data.meta.school)
    );
    var toggle = D.h('button.nav-toggle', { title: '展开菜单', html: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' });
    toggle.addEventListener('click', function () {
      var sb = document.querySelector('.sidebar');
      if (!sb) return;
      sb.classList.toggle('open');
      if (sb.classList.contains('open')) {
        var sc = D.h('div.scrim');
        sc.addEventListener('click', function () { sb.classList.remove('open'); sc.remove(); });
        sb.parentNode.insertBefore(sc, sb);
      } else {
        D.qa('.scrim').forEach(function (m) { m.remove(); });
      }
    });

    var searchWrap = D.h('div.tb-search', D.h('input#globalSearch', { placeholder: '搜索活动、学生、社团、通知…' }));

    var rolePick = D.h('div.role-pick#rolePick');
    var roles = (s.roles || []).slice();
    if (s.type !== 'student' && roles.indexOf('student') < 0) roles.push('student');
    if (roles.length > 1 || roles[0] !== 'student') {
      roles.forEach(function (rk) {
        rolePick.appendChild(D.h('button' + (rk === s.role ? '.on' : ''), {
          dataset: { r: rk },
          onclick: function () { switchRole(rk); }
        }, w.ZA.ROLE_LABEL[rk] || rk));
      });
    } else {
      rolePick.appendChild(D.h('button.on', w.ZA.ROLE_LABEL[s.role] || s.role));
    }

    var unread = w.DB.filter('msgs', function (m) { return m.unreadCount > 0; }).length;
    var bell = D.h('button.tb-ic#bellBtn', { title: '消息通知' }, D.h('span', { html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>' }), unread ? D.h('span.dot') : null);
    bell.addEventListener('click', function (e) { e.stopPropagation(); toggleBell(bell); });

    var avatar = D.h('button.avatar', { title: '账号菜单' },
      D.h('div.av', s.avatar || '二'),
      D.h('div.who', D.h('b', s.name), D.h('span', s.title + (s.college ? ' · ' + s.college.replace('学院', '') : '')))
    );
    avatar.addEventListener('click', function (e) { e.stopPropagation(); toggleAccount(avatar); });

    host.appendChild(toggle);
    host.appendChild(brand);
    host.appendChild(searchWrap);
    host.appendChild(D.h('div.tb-spacer'));
    host.appendChild(D.h('div.tb-right', rolePick, bell, avatar));

    searchWrap.addEventListener('click', function (e) { e.stopPropagation(); });
    var inp = D.q('#globalSearch', searchWrap);
    inp.addEventListener('input', U.debounce(function () { doSearch(inp.value, searchWrap); }, 200));
    inp.addEventListener('focus', function () { if (inp.value) doSearch(inp.value, searchWrap); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePops(); });
  }

  /* ---------------- 角色切换 ---------------- */
  function switchRole(rk) {
    w.ZA.setRole(rk);
    UI.toast('已切换至「' + (w.ZA.ROLE_LABEL[rk] || rk) + '」视角', '菜单与数据范围已随角色调整', 'ok');
    buildSidebar();
    renderRolePick();
    // 若当前路由不在新角色菜单中，回到该角色首页
    var allowed = allowedKeys();
    var cur = R.current();
    if (!cur || allowed.indexOf(cur.key) < 0) R.go(rk === 'student' ? 'mine' : 'dash');
    else R.render();
  }
  function renderRolePick() {
    var host = D.q('#rolePick');
    if (!host) return;
    D.qa('button', host).forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-r') === w.ZA.role());
    });
  }
  function allowedKeys() {
    var out = [];
    menuFor(w.ZA.role()).forEach(function (g) { g.items.forEach(function (i) { out.push(i.id); }); });
    return out;
  }

  /* ---------------- 侧栏 ---------------- */
  function buildSidebar() {
    var sb = document.getElementById('sidebar');
    if (!sb) return;
    D.fill(sb, null);
    var role = w.ZA.role();
    var badges = sidebarBadges();
    menuFor(role).forEach(function (g) {
      sb.appendChild(D.h('div.side-group', g.g));
      g.items.forEach(function (it) {
        var cnt = badges[it.id];
        sb.appendChild(D.h('div.nav-i', {
          dataset: { id: it.id },
          onclick: function () { R.go(it.id); }
        }, icon(it.ic), D.h('span', it.n),
          cnt ? D.h('span.cnt' + (cnt.hot ? '.hot' : ''), cnt.n) : null));
      });
    });
  }
  /** 菜单角标：待办数量（真实取自数据） */
  function sidebarBadges() {
    var b = {};
    var pendingAct = w.DB.count('activities', function (a) { return a.status === '待审核'; });
    if (pendingAct) b.audit = { n: pendingAct, hot: true };
    var pendingApp = w.DB.count('scoreApps', function (x) { return x.status === '待初审' || x.status === '待终审'; });
    if (pendingApp) b.apply = { n: pendingApp, hot: true };
    var pendingContent = w.DB.count('contents', function (c) { return c.status === '待审'; });
    if (pendingContent) b.content = { n: pendingContent, hot: true };
    var prePay = w.DB.count('enrollments', function (e) { return e.status === '待审核'; });
    if (prePay) b.actmgr = { n: prePay };
    var clubPend = w.DB.count('clubApps', function (x) { return x.status === '待审核' || x.status === '待审批'; });
    if (clubPend) b.club = { n: clubPend, hot: true };
    if (w.ZA.role() === 'student') {
      var sid = w.ZA.viewStudentId();
      var myUnread = w.DB.count('msgs', function (m) { return m.unreadCount > 0; });
      if (myUnread) b.msg = { n: myUnread, hot: true };
    }
    return b;
  }

  /* ---------------- 浮层（通知 / 账号 / 搜索） ---------------- */
  function closePops() { D.qa('.pop').forEach(function (p) { p.remove(); }); }
  document.addEventListener('click', function () { closePops(); });

  function toggleBell(btn) {
    var existing = D.q('.pop', btn.parentNode);
    closePops();
    if (existing) return;
    var list = U.sortBy(w.DB.all('msgs'), function (m) { return m.at; }, true).slice(0, 6);
    var pop = D.h('div.pop');
    pop.appendChild(D.h('h5', {}, '最近消息'));
    list.forEach(function (m) {
      pop.appendChild(D.h('div.pop-i', {
        onclick: function (e) { e.stopPropagation(); closePops(); R.go('msg'); }
      }, UI.icoBox(m.unreadCount > 0 ? '●' : '○', m.unreadCount > 0 ? '#ef4444' : '#9aa8bc', m.unreadCount > 0 ? '#fef2f2' : '#f1f5fb', 28),
        D.h('span.clip', { style: 'max-width:190px' }, m.title),
        D.h('span.rt', U.ago(m.at))));
    });
    pop.appendChild(D.h('div.hr'));
    pop.appendChild(D.h('div.pop-i', {
      onclick: function (e) {
        e.stopPropagation(); closePops();
        var total = 0;
        w.DB.all('msgs').forEach(function (m) { total += U.num(m.readCount); m.readBy = []; });
        R.go('msg');
      }
    }, D.h('span', '查看全部消息通知 →')));
    btn.parentNode.appendChild(pop);
  }

  function toggleAccount(btn) {
    var existing = D.q('.pop', btn.parentNode);
    closePops();
    if (existing) return;
    var s = w.ZA.session;
    var pop = D.h('div.pop');
    pop.appendChild(D.h('h5', {}, '账号信息'));
    pop.appendChild(D.h('div', { style: 'padding:2px 10px 8px' },
      UI.kv([['姓名', s.name], ['账号', s.account], ['身份', s.title], ['数据范围', w.ZA.scopeText()]])
    ));
    pop.appendChild(D.h('div.hr'));
    pop.appendChild(D.h('div.pop-i', { onclick: function (e) { e.stopPropagation(); closePops(); R.go(w.ZA.isStudent() ? 'mine' : 'dash'); } }, D.h('span', '返回首页')));

    /* 演示身份一键切换（管理员 ↔ 学生），演示主视角要求 */
    if (w.ZDEMO) {
      pop.appendChild(D.h('div.pop-i', {
        onclick: function (e) {
          e.stopPropagation(); closePops();
          var role = w.ZA.role() === 'student' ? 'admin' : 'student';
          var r = w.ZDEMO.loginAs(role);
          if (!r.ok) { UI.toast('切换失败', r.msg || '演示数据中未找到该身份', 'err'); return; }
          UI.toast('已切换演示身份', (w.ZA.ROLE_LABEL[role] || role) + ' · ' + w.ZA.session.name, 'ok');
          location.href = 'app.html';
        }
      }, D.h('span', w.ZA.role() === 'student' ? '切换到「管理员」身份' : '切换到「学生」身份')));
      pop.appendChild(D.h('div.pop-i', {
        onclick: function (e) { e.stopPropagation(); closePops(); w.ZDEMO.toMobile(); }
      }, D.h('span', '切换到手机端（移动端入口）')));
    }

    pop.appendChild(D.h('div.pop-i', {
      onclick: function (e) {
        e.stopPropagation(); closePops(); showResetDialog();
      }
    }, D.h('span', '复位演示数据')));
    pop.appendChild(D.h('div.pop-i', {
      onclick: function (e) {
        e.stopPropagation(); closePops();
        UI.confirm({
          title: '退出登录', text: '确认退出当前账号？退出后需重新登录。', okText: '退出登录', danger: true,
          onOk: function () {
            w.ZA.logout();
            location.href = 'index.html';
          }
        });
      }
    }, D.h('span', { style: 'color:#b91c1c' }, '退出登录')));
    btn.parentNode.appendChild(pop);
  }

  function showResetDialog() {
    var m = UI.modal({
      title: '复位演示数据', size: 'slim',
      body: D.h('div', {},
        D.h('p', { style: 'font-size:13.5px;line-height:1.8' }, '将清空本地改动，恢复为初始演示数据（活动、报名、签到、成绩、申报、预警、消息等全部还原）。'),
        D.h('div.pill-note', { style: 'margin-top:10px' }, '当前数据体积约 ' + w.DB.sizeKB() + ' KB')
      ),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-dan', {
          onclick: function () {
            w.DB.reset();
            m.close();
            UI.toast('演示数据已复位', '已恢复初始状态', 'ok');
            buildSidebar();
            R.render();
          }
        }, '确认复位')
      ]
    });
  }

  /* ---------------- 全局搜索 ---------------- */
  function doSearch(kw, wrap) {
    var old = D.q('.search-pop');
    if (old) old.remove();
    kw = String(kw || '').trim();
    if (kw.length < 1) return;
    var hits = [];
    w.DB.all('activities').forEach(function (a) {
      if (U.hitAny([a.title, a.host, a.cat], kw)) hits.push({ g: '活动', n: a.title, s: a.cat + ' · ' + a.host, go: function () { R.go('actmgr', a.id); } });
    });
    w.DB.all('students').forEach(function (s) {
      if (hits.length > 40) return;
      if (U.hitAny([s.name, s.sno, s.className], kw)) hits.push({ g: '学生', n: s.name + '（' + s.sno + '）', s: s.college + ' · ' + s.className, go: function () { R.go('grade', 'stu:' + s.id); } });
    });
    w.DB.all('clubs').forEach(function (c) {
      if (U.hitAny([c.name, c.cat], kw)) hits.push({ g: '社团', n: c.name, s: c.cat + ' · ' + c.college, go: function () { R.go('club'); } });
    });
    w.DB.all('msgs').forEach(function (m) {
      if (U.hitAny([m.title, m.content], kw)) hits.push({ g: '通知', n: m.title, s: U.d(m.at) + ' · ' + m.scope, go: function () { R.go('msg'); } });
    });
    w.DB.all('scoreApps').forEach(function (x) {
      if (hits.length > 60) return;
      if (U.hitAny([x.title, x.name], kw)) hits.push({ g: '分值时申报', n: x.title, s: x.name + ' · ' + x.status, go: function () { R.go('apply'); } });
    });

    var pop = D.h('div.pop.search-pop');
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    if (!hits.length) {
      pop.appendChild(D.h('div', { style: 'padding:14px;text-align:center;color:#9aa8bc;font-size:12.5px' }, '未找到与「' + U.esc(kw) + '」匹配的结果'));
    } else {
      hits.slice(0, 12).forEach(function (h) {
        pop.appendChild(D.h('div.s-it', {
          onclick: function () { closePops(); h.go(); }
        }, D.h('span.tag.tag-info', h.g), D.h('span.clip', { style: 'flex:1' }, h.n), D.h('span.sg', h.s)));
      });
    }
    wrap.appendChild(pop);
  }

  /* ---------------- 启动 ---------------- */
  APP.boot = function () {
    // 1) 数据
    w.DB.init();
    // 2) 会话校验
    var s = w.ZA.restore();
    if (!s) { location.replace('index.html'); return; }
    // 3) 装载页面
    if (w.ZPAGES) R.regAll(w.ZPAGES);
    // 4) 外壳
    var top = document.getElementById('topbar');
    D.fill(top, null);
    renderTop(top);
    buildSidebar();
    // 5) 路由
    var savedHash = location.hash;
    R.start(w.ZA.isStudent() ? 'mine' : 'dash');
    // 若带 hash 但目标页不在当前角色菜单，回退首页
    if (savedHash) {
      var info = R.parseHash();
      if (allowedKeys().indexOf(info.key) < 0 && R.pages[info.key]) {
        // 该页存在但角色无权 → 若是学生专属页而当前为管理端，允许（管理端可查看学生端效果）
        var studentOnly = ['mine', 'myact', 'myscore'];
        if (!(studentOnly.indexOf(info.key) >= 0)) R.go(w.ZA.isStudent() ? 'mine' : 'dash');
      }
    }
    // 6) 异常上报
    window.addEventListener('error', function (e) {
      R.errors.push({ key: 'window', msg: e.message, stack: (e.error && e.error.stack) || '' });
    });
    window.addEventListener('unhandledrejection', function (e) {
      R.errors.push({ key: 'promise', msg: String(e.reason && e.reason.message || e.reason) });
    });
    // 7) 数据变更时刷新菜单角标
    w.DB.on(function (type) {
      if (type === 'insert' || type === 'remove' || type === 'update' || type === 'reset') {
        var b = sidebarBadges();
        D.qa('.nav-i').forEach(function (n) {
          var id = n.getAttribute('data-id');
          var old = D.q('.cnt', n);
          if (old) old.remove();
          if (b[id]) n.appendChild(D.h('span.cnt' + (b[id].hot ? '.hot' : ''), b[id].n));
        });
      }
    });
  };

  w.ZAPP = APP;
})(window);
