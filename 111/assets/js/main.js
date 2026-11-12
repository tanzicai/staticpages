/* ============================================================
   main.js —— 登录、导航、路由与应用启动
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.Store, U = global.UI;
  var V = global.Views;

  var NAV = [
    { group: '教学运行', items: [{ key: 'dashboard', name: '工作台', icon: 'dash' }] },
    {
      group: '课程建设', items: [
        { key: 'courses', name: '我的课程', icon: 'book' },
        { key: 'tasks', name: '任务编排', icon: 'list' },
        { key: 'resources', name: '资源库', icon: 'grid' }
      ]
    },
    {
      group: '课堂教学', items: [
        { key: 'pre', name: '课前导学', icon: 'play' },
        { key: 'live', name: '课堂互动', icon: 'chat' },
        { key: 'homework', name: '作业与测验', icon: 'edit' }
      ]
    },
    {
      group: 'AI 实践空间', items: [
        { key: 'scene', name: 'AI 场景生成', icon: 'spark' },
        { key: 'studio', name: '布展编辑', icon: 'palette' },
        { key: 'play', name: '实践与评价', icon: 'cube' },
        { key: 'materials', name: '素材中心', icon: 'grid' }
      ]
    },
    {
      group: '运营中心', items: [
        { key: 'stats', name: '教材运营数据', icon: 'chart' },
        { key: 'refs', name: '引用详情', icon: 'book' },
        { key: 'pay', name: '付费与订单', icon: 'money' }
      ]
    },
    { group: '数字教材', items: [{ key: 'app', name: '教材运行', icon: 'book' }] },
    { group: '系统', items: [{ key: 'settings', name: '平台设置', icon: 'setting' }] }
  ];

  var App = {
    route: 'dashboard',
    params: {},
    timers: [],
    disposers: [],
    pending: null,
    go: function (hash) {
      if (location.hash === hash) { App.render(); return; }
      location.hash = hash;
    },
    render: function () {
      /* 清理上一轮资源 */
      App.timers.forEach(function (t) { clearInterval(t); });
      App.timers = [];
      App.disposers.forEach(function (d) { try { d(); } catch (e) { } });
      App.disposers = [];

      var r = parseHash();
      App.route = r.route; App.params = r.params;
      var view = ROUTES[r.route] || ROUTES.dashboard;

      /* 顶部导航 */
      renderNav(r.route);
      /* 关闭上一页面残留的弹层 */
      var modalRoot = document.getElementById('modalRoot');
      if (modalRoot) modalRoot.innerHTML = '';
      document.body.style.overflow = '';
      /* 主视图：重建容器，避免事件监听重复绑定 */
      var oldRoot = document.getElementById('view');
      var root = oldRoot.cloneNode(false);
      oldRoot.parentNode.replaceChild(root, oldRoot);
      var html = '';
      try {
        html = view.html(App.params) || '';
      } catch (e) {
        html = '<div class="card"><div class="card-b"><b>页面渲染异常</b><p class="hint" style="margin-top:8px">' + S.esc(e.message) + '</p></div></div>';
        console.error(e);
      }
      root.innerHTML = html;
      if (view.mount) {
        try { view.mount(root, App.params); } catch (e) { console.error(e); }
      }
      document.title = (view.title || '工作台') + ' · 智课云 数字教材教学运行平台';
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      document.getElementById('appView').classList.remove('mobile-open');
    }
  };
  global.App = App;

  /* ---------------- 路由 ---------------- */
  function parseHash() {
    var h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var qs = qi >= 0 ? h.slice(qi + 1) : '';
    var params = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { route: path || 'dashboard', params: params };
  }

  var ROUTES = {
    dashboard: V.dashboard, courses: V.courses, tasks: V.tasks, resources: V.resources,
    pre: V.pre, live: V.live, homework: V.homework,
    scene: V.aiScene, studio: V.aiStudio, play: V.aiPlay, materials: V.materials,
    stats: V.stats, refs: V.refs, pay: V.pay, app: V.app,
    settings: {
      title: '平台设置', crumb: ['系统', '平台设置'],
      html: function () {
        var d = S.db();
        return `<div class="page-head"><div><div class="page-title">平台设置</div>
          <div class="page-desc">账号信息、数据管理与平台运行状态</div></div></div>
        <div class="grid g-2">
          <div class="card"><div class="card-h"><h3>账号信息</h3></div>
            <div class="card-b">
              <dl class="kv">
                <dt>账号</dt><dd>root</dd>
                <dt>姓名</dt><dd>root</dd>
                <dt>身份</dt><dd>教师（兼学生学习视图）</dd>
                <dt>所属机构</dt><dd>${S.esc(d.users[0].dept)}</dd>
                <dt>数据存储</dt><dd>浏览器本地存储（localStorage）</dd>
              </dl>
            </div>
          </div>
          <div class="card"><div class="card-h"><h3>数据管理</h3></div>
            <div class="card-b">
              <div class="rowline"><span style="flex:1">导出全量业务数据（JSON）</span>
                <button class="btn btn-sm" data-set="export">导出</button></div>
              <div class="rowline"><span style="flex:1">导入业务数据（JSON 文本粘贴）</span>
                <button class="btn btn-sm" data-set="import">导入</button></div>
              <div class="rowline"><span style="flex:1">恢复初始数据</span>
                <button class="btn btn-sm btn-danger" data-set="reset">恢复</button></div>
              <div class="hint" style="margin-top:10px">业务数据包含课程、章节任务点、资源、活动、作业、实践场景与订单记录，全部保存在本机浏览器中。</div>
            </div>
          </div>
          <div class="card"><div class="card-h"><h3>运行状态</h3></div>
            <div class="card-b">
              <div class="rowline"><span style="flex:1">课程数</span><b>${d.courses.length}</b></div>
              <div class="rowline"><span style="flex:1">任务点数</span><b>${d.courses.reduce(function (a, c) { return a + S.allTasks(c.id).length; }, 0)}</b></div>
              <div class="rowline"><span style="flex:1">资源数</span><b>${d.resources.length}</b></div>
              <div class="rowline"><span style="flex:1">实践场景</span><b>${d.scenes.length}</b></div>
              <div class="rowline"><span style="flex:1">素材库</span><b>${S.materials().length} 项</b></div>
            </div>
          </div>
          <div class="card"><div class="card-h"><h3>平台版本</h3></div>
            <div class="card-b">
              <dl class="kv">
                <dt>平台名称</dt><dd>智课云 · 数字教材教学运行平台</dd>
                <dt>版本</dt><dd>V3.2.0</dd>
                <dt>更新日期</dt><dd>${d.textbook.updated}</dd>
                <dt>终端支持</dt><dd>Web 管理端 + 移动端自适应（同一套数据）</dd>
              </dl>
            </div>
          </div>
        </div>`;
      },
      mount: function (root) {
        root.addEventListener('click', function (e) {
          var b = e.target.closest('[data-set]');
          if (!b) return;
          var act = b.getAttribute('data-set');
          if (act === 'export') {
            S.downloadFile('平台业务数据_' + S.fmtDate() + '.json', JSON.stringify(S.db(), null, 2), 'application/json');
            U.toast('数据已导出');
          }
          if (act === 'reset') {
            U.confirm('恢复初始数据', '当前所有编辑内容将被覆盖，确认恢复初始数据？', '恢复', true).then(function (ok) {
              if (!ok) return;
              S.reset(); U.toast('已恢复初始数据'); App.render();
            });
          }
          if (act === 'import') {
            var m = U.modal({
              title: '导入业务数据', sub: '粘贴 JSON 文本',
              body: '<label class="field"><span>JSON 数据</span><textarea id="impTxt" style="min-height:180px" placeholder="粘贴此前导出的 JSON"></textarea></label>',
              footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="impOk">导入</button>',
              onMount: function (api) {
                api.el.querySelector('#impOk').addEventListener('click', function () {
                  try {
                    var obj = JSON.parse(api.el.querySelector('#impTxt').value);
                    if (!obj.courses) throw new Error('数据结构不匹配');
                    localStorage.setItem(S.DB_KEY, JSON.stringify(obj));
                    api.close(); U.toast('导入成功'); location.reload();
                  } catch (err) { U.toast('导入失败：' + err.message, 'err'); }
                });
              }
            });
          }
        });
      }
    }
  };

  /* ---------------- 顶部导航 ---------------- */
  var CARET = '<svg viewBox="0 0 24 24" fill="none" class="caret"><path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="1.6"/></svg>';
  function navBadge(key, activeActs, pendingHw) {
    if (key === 'live' && activeActs) return '<span class="badge">' + activeActs + '</span>';
    if (key === 'homework' && pendingHw) return '<span class="badge">' + pendingHw + '</span>';
    return '';
  }
  function renderNav(active) {
    var nav = document.getElementById('sideNav');
    var mob = document.getElementById('mobileNav');
    if (!nav) return;
    var d = S.db();
    var activeActs = d.activities.filter(function (a) { return a.status === '进行中'; }).length;
    var pendingHw = d.homework.reduce(function (a, b) { return a + (b.submitted - b.graded); }, 0);

    nav.innerHTML = NAV.map(function (g) {
      if (g.items.length === 1) {
        var it = g.items[0];
        return '<div class="tn-item ' + (active === it.key ? 'active' : '') + '" data-nav="' + it.key + '">' +
          S.icon(it.icon) + '<span>' + it.name + '</span>' + navBadge(it.key, activeActs, pendingHw) + '</div>';
      }
      var groupActive = g.items.some(function (i) { return i.key === active; });
      return '<div class="tn-drop" data-drop>' +
        '<div class="tn-item' + (groupActive ? ' active' : '') + '" data-drop-btn><span>' + g.group + '</span>' + CARET + '</div>' +
        '<div class="tn-menu">' + g.items.map(function (it) {
          return '<div class="nav-item ' + (active === it.key ? 'active' : '') + '" data-nav="' + it.key + '">' +
            S.icon(it.icon) + '<span>' + it.name + '</span>' + navBadge(it.key, activeActs, pendingHw) + '</div>';
        }).join('') + '</div></div>';
    }).join('');

    nav.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () {
        App.go('#/' + el.getAttribute('data-nav'));
      });
    });
    nav.querySelectorAll('[data-drop]').forEach(function (dr) {
      var btn = dr.querySelector('[data-drop-btn]');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var was = dr.classList.contains('open');
        nav.querySelectorAll('[data-drop].open').forEach(function (x) { x.classList.remove('open'); });
        if (!was) dr.classList.add('open');
      });
    });

    if (mob) {
      mob.innerHTML = NAV.map(function (g) {
        return '<div class="nav-group-t">' + g.group + '</div>' + g.items.map(function (it) {
          return '<div class="nav-item ' + (active === it.key ? 'active' : '') + '" data-nav="' + it.key + '">' +
            S.icon(it.icon) + '<span>' + it.name + '</span>' + navBadge(it.key, activeActs, pendingHw) + '</div>';
        }).join('');
      }).join('');
      mob.querySelectorAll('[data-nav]').forEach(function (el) {
        el.addEventListener('click', function () {
          document.getElementById('appView').classList.remove('mobile-open');
          App.go('#/' + el.getAttribute('data-nav'));
        });
      });
    }
  }

  /* ---------------- 登录 ---------------- */
  function showLogin() {
    document.getElementById('loginView').style.display = 'flex';
    document.getElementById('appView').hidden = true;
  }
  function showApp() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('appView').hidden = false;
    var sess = S.session() || {};
    var name = sess.name || 'root';
    document.getElementById('userChipName').textContent = name;
    document.getElementById('userAva').textContent = 'RT';
    App.render();
  }

  function bindLogin() {
    var form = document.getElementById('loginForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('loginUser').value.trim();
      var p = document.getElementById('loginPass').value;
      var err = document.getElementById('loginErr');
      var user = S.db().users.filter(function (x) { return x.account === u && x.password === p; })[0];
      if (!u || !p) { err.textContent = '请输入账号和密码'; return; }
      if (!user) { err.textContent = '账号或密码不正确，请重新输入'; return; }
      err.textContent = '';
      S.setSession({ account: user.account, name: user.name, role: user.role, time: S.fmtTime() });
      U.toast('登录成功，欢迎回来');
      showApp();
    });
    document.getElementById('loginHelp').addEventListener('click', function () {
      U.modal({
        title: '找回密码', sub: '院校统一身份用户',
        body: '<p style="font-size:13.5px;color:var(--ink-2);line-height:1.8">平台账号由院校教学管理端统一开通，如需重置密码请联系教务处信息化教学服务窗口，或拨打平台服务热线 023-6848 5000。</p>',
        footer: '<button class="btn btn-primary" data-close>知道了</button>'
      });
    });
  }

  /* ---------------- 顶栏交互 ---------------- */
  function bindTop() {
    var app = document.getElementById('appView');
    document.getElementById('menuBtn').addEventListener('click', function () { app.classList.toggle('mobile-open'); });
    document.getElementById('sideMask').addEventListener('click', function () { app.classList.remove('mobile-open'); });
    /* 点击空白处收起顶部下拉菜单 */
    document.addEventListener('click', function () {
      document.querySelectorAll('[data-drop].open').forEach(function (x) { x.classList.remove('open'); });
    });
    /* 导航区域内点击（非触发按钮）也收起，避免多个下拉同时展开 */
    var navEl = document.getElementById('sideNav');
    if (navEl) {
      navEl.addEventListener('click', function (e) {
        if (e.target.closest('[data-drop-btn]')) return;
        navEl.querySelectorAll('[data-drop].open').forEach(function (x) { x.classList.remove('open'); });
      });
    }

    var chip = document.getElementById('userChip');
    var menu = document.getElementById('userMenu');
    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    document.addEventListener('click', function () { menu.hidden = true; });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      menu.hidden = true;
      var act = b.getAttribute('data-act');
      if (act === 'logout') {
        U.confirm('退出登录', '退出后需重新输入账号密码，本地业务数据不会丢失。', '退出', true).then(function (ok) {
          if (!ok) return;
          S.setSession(null);
          document.getElementById('loginPass').value = '';
          showLogin();
          U.toast('已退出登录');
        });
      }
      if (act === 'profile') {
        U.modal({
          title: '个人中心',
          body: `<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">
            <div class="ava lg">RT</div>
            <div><b style="font-size:15px">root</b><div class="hint">教师 · 第一临床学院内科学课程组</div></div></div>
            <dl class="kv"><dt>账号</dt><dd>root</dd><dt>角色</dt><dd>教师 / 课程负责人</dd>
            <dt>授课课程</dt><dd>${S.db().courses.filter(function (c) { return c.teacher === 'root'; }).length} 门</dd>
            <dt>最近登录</dt><dd>${(S.session() || {}).time || S.fmtTime()}</dd></dl>`,
          footer: '<button class="btn btn-primary" data-close>关闭</button>'
        });
      }
      if (act === 'switch') {
        U.toast('已切换到教材运行视图');
        App.go('#/app');
      }
      if (act === 'clear') {
        U.confirm('清理本地缓存', '将清除本地缓存并重新载入初始数据，已编辑内容会丢失。', '清理', true).then(function (ok) {
          if (!ok) return;
          S.reset(); U.toast('缓存已清理'); App.render();
        });
      }
    });

    document.getElementById('searchBtn').addEventListener('click', openSearch);
    document.getElementById('msgBtn').addEventListener('click', function () {
      U.modal({
        title: '消息通知', sub: S.notices.length + ' 条',
        body: S.notices.map(function (n) {
          return `<div class="list-line"><div class="avatar-sm">·</div>
            <div class="ll-main"><strong>${S.esc(n.t)}</strong><span>${S.esc(n.d)}</span></div>
            <span class="hint">${n.time}</span></div>`;
        }).join(''),
        footer: '<button class="btn btn-primary" data-close>关闭</button>'
      });
    });
  }

  function openSearch() {
    var d = S.db();
    var idx = [];
    d.courses.forEach(function (c) {
      S.allTasks(c.id).forEach(function (t) {
        idx.push({ t: '任务点', n: t.title, sub: c.name + ' / ' + t.chapterName, go: '#/tasks' });
      });
    });
    d.resources.forEach(function (r) { idx.push({ t: '资源', n: r.name, sub: S.course(r.courseId).name, go: '#/resources' }); });
    d.scenes.forEach(function (s) { idx.push({ t: '实践场景', n: s.title, sub: s.agent.name, go: '#/play' }); });
    d.homework.forEach(function (h) { idx.push({ t: '作业', n: h.title, sub: h.chapter, go: '#/homework' }); });

    U.modal({
      title: '全局搜索', sub: '任务点 / 资源 / 场景 / 作业',
      body: `<input id="gsKw" class="btn" style="width:100%;height:40px;padding:0 14px;text-align:left;margin-bottom:12px" placeholder="输入关键词，如：肺功能" />
        <div id="gsList" style="max-height:340px;overflow:auto">
          <div class="hint">输入关键词开始搜索，共 ${idx.length} 条可检索内容</div>
        </div>`,
      footer: '<button class="btn" data-close>关闭</button>',
      onMount: function (api) {
        var inp = api.el.querySelector('#gsKw');
        var list = api.el.querySelector('#gsList');
        function render(kw) {
          if (!kw) { list.innerHTML = '<div class="hint">输入关键词开始搜索，共 ' + idx.length + ' 条可检索内容</div>'; return; }
          var res = idx.filter(function (x) { return (x.n + x.sub).toLowerCase().indexOf(kw.toLowerCase()) >= 0; }).slice(0, 20);
          list.innerHTML = res.length ? res.map(function (x, i) {
            return `<div class="res-pick" data-res-i="${i}">
              <div class="ri">${S.icon('search')}</div>
              <div class="rm"><strong>${S.esc(x.n)}</strong><span>${x.t} · ${S.esc(x.sub)}</span></div>
              <span class="tag line">${x.t}</span></div>`;
          }).join('') : '<div class="empty">没有匹配结果</div>';
          list.querySelectorAll('[data-res-i]').forEach(function (el) {
            el.addEventListener('click', function () {
              api.close();
              App.go(res[parseInt(el.getAttribute('data-res-i'), 10)].go);
            });
          });
        }
        inp.addEventListener('input', function () { render(inp.value.trim()); });
        setTimeout(function () { inp.focus(); }, 60);
      }
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    S.load();
    bindLogin();
    bindTop();
    window.addEventListener('hashchange', function () { App.render(); });
    /* 跨标签页数据同步 */
    window.addEventListener('storage', function (e) {
      if (e.key === S.DB_KEY) { S.load(); if (S.session()) App.render(); }
    });
    if (S.session()) {
      showApp();
    } else {
      showLogin();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
