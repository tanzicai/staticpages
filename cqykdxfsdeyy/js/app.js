/* ================================================================
   应用外壳：顶栏菜单 / 左侧子菜单 / 页面路由 / 视角切换 / 主题切换
   ================================================================ */
(function () {
  'use strict';
  var MODULES = window.MODULES || [];
  var PERSONAS = window.D.personas;

  var state = { moduleIndex: -1, subIndex: -1, role: 'teacher', page: null };

  var topmenu = document.getElementById('topmenu');
  var submenu = document.getElementById('submenu');
  var content = document.getElementById('content');
  var sidebar = document.getElementById('sidebar');
  var sideTitle = document.getElementById('sideTitle');
  var sideDesc = document.getElementById('sideDesc');

  function indexOfModule(id) {
    for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === id) return i;
    return 0;
  }

  /* ---------------- 顶栏菜单 ---------------- */
  MODULES.forEach(function (m, i) {
    var b = document.createElement('button');
    b.innerHTML = Icon(m.icon, 16) + '<span>' + m.name + '</span>';
    b.setAttribute('data-i', i);
    b.addEventListener('click', function () { go(i); });
    topmenu.appendChild(b);
  });

  /* ---------------- 侧栏 ---------------- */
  function renderSubmenu(mod) {
    sideTitle.textContent = mod.name;
    sideDesc.textContent = mod.desc || '';
    submenu.innerHTML = '';
    mod.subs.forEach(function (s, i) {
      if (s.group) {
        var g = document.createElement('div');
        g.className = 'group';
        g.textContent = s.group;
        submenu.appendChild(g);
        return;
      }
      var b = document.createElement('button');
      b.innerHTML = Icon(s.icon || 'dotSquare', 15) + '<span>' + s.name + '</span>';
      b.setAttribute('data-i', i);
      b.addEventListener('click', function () { selectSub(i); });
      submenu.appendChild(b);
    });
  }

  function highlight() {
    submenu.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', +b.getAttribute('data-i') === state.subIndex);
    });
    topmenu.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', +b.getAttribute('data-i') === state.moduleIndex);
    });
  }

  /* ---------------- 视角标识 ---------------- */
  function personaBanner(mod) {
    var p = PERSONAS[mod.persona];
    if (!p) return '';
    return '<div class="persona-bar">'
      + '<div class="pa-avatar">' + p.avatar + '</div>'
      + '<div class="pa-info"><strong>' + p.role + ' · ' + p.name + '</strong><span>' + p.title + '　·　' + p.dept + '</span></div>'
      + '<div class="pa-note"><i class="lamp green"></i>' + p.note + '</div>'
      + '</div>';
  }

  function syncUser(role) {
    var p = PERSONAS[role];
    if (!p) return;
    document.getElementById('topAvatar').textContent = p.avatar;
    document.getElementById('topUser').textContent = p.name;
    document.getElementById('topRole').textContent = p.role.replace('视角', '');
  }

  /* ---------------- 路由 ---------------- */
  function go(mi, subId) {
    var mod = MODULES[mi];
    if (!mod) return;
    state.moduleIndex = mi;
    sidebar.style.display = mod.noSidebar ? 'none' : 'flex';
    renderSubmenu(mod);
    if (mod.persona) {
      state.role = mod.persona;
      syncUser(mod.persona);
      document.querySelectorAll('#roleSwitch button').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-role') === mod.persona);
      });
    }
    var target = 0;
    if (subId) {
      var idx = mod.subs.findIndex(function (s) { return s.id === subId; });
      if (idx >= 0) target = idx;
    }
    if (!mod.subs[target] || mod.subs[target].group) {
      target = mod.subs.findIndex(function (s) { return !s.group; });
      if (target < 0) target = 0;
    }
    selectSub(target);
  }

  function selectSub(si) {
    var mod = MODULES[state.moduleIndex];
    var page = mod.subs[si];
    if (!page || page.group) return;

    if (state.page && state.page.destroy) {
      try { state.page.destroy.call(state.page); } catch (e) { /* noop */ }
    }
    Charts.flush();

    state.subIndex = si;
    state.page = page;
    highlight();

    content.scrollTop = 0;
    content.innerHTML = (mod.persona ? personaBanner(mod) : '') + page.render();
    content.classList.remove('fade-in');
    void content.offsetWidth;
    content.classList.add('fade-in');

    try { page.init(content); } catch (e) { console.error('页面初始化失败：', e); }
  }

  /* ---------------- 卡片 / 快捷入口跳转 ---------------- */
  content.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go]');
    if (!el) return;
    var go2 = el.getAttribute('data-go').split(':');
    var mi = indexOfModule(go2[0]);
    go(mi, go2[1]);
  });

  /* ---------------- 视角切换 ---------------- */
  document.getElementById('roleSwitch').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var role = b.getAttribute('data-role');
    var p = PERSONAS[role];
    this.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
    b.classList.add('active');
    state.role = role;
    syncUser(role);
    window.toast('已切换至' + p.role + '：' + p.name + '（' + p.title + '）');
    go(indexOfModule(p.home));
  });

  /* ---------------- 帮助 / 通知 ---------------- */
  document.getElementById('helpIcon').innerHTML = Icon('help', 14);
  document.getElementById('bellIcon').innerHTML = Icon('bell', 15);
  document.getElementById('helpBtn').addEventListener('click', function () {
    window.toast('帮助中心：平台使用手册 / 常见问题 / 技术支持（Demo）');
  });
  document.getElementById('bellBtn').addEventListener('click', function () {
    window.toast('您有 6 条未读通知：教学成果奖申报、AI 工作坊报名…（Demo）');
  });

  /* ---------------- 时钟 ---------------- */
  function tick() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    document.getElementById('syncTime').textContent = p(d.getHours()) + ':' + p(d.getMinutes());
  }
  tick();
  setInterval(tick, 20000);

  /* ---------------- 响应式重绘 ---------------- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { Charts.redrawAll(); }, 180);
  });

  /* ---------------- 启动 ---------------- */
  syncUser('teacher');
  go(0);
})();
