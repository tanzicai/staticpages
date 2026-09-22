/* ==========================================================================
   router.js —— 哈希路由
   · 每个页面注册为 ZR.reg(key, {title, group, render(host, param)})
   · 渲染前统一 closeAllModals()，杜绝弹窗跨路由残留
   · 渲染异常时给出可诊断的异常卡片（不空白、不静默）
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD;

  var R = {
    pages: {},        /* key → {title, group, render} */
    order: [],
    cur: null,
    errors: []
  };

  w.__errs = R.errors;

  R.reg = function (key, def) {
    R.pages[key] = def;
    if (R.order.indexOf(key) < 0) R.order.push(key);
    return def;
  };
  R.regAll = function (map) {
    Object.keys(map).forEach(function (k) { R.reg(k, map[k]); });
  };

  /** 解析当前 hash → {key, param} */
  function parseHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/').filter(function (x) { return x !== ''; });
    if (!parts.length) return { key: R.defaultKey || 'dash', param: '' };
    var key = parts[0];
    var param = parts.slice(1).join('/');
    if (!R.pages[key]) return { key: R.defaultKey || 'dash', param: '', unknown: key };
    return { key: key, param: param };
  }
  R.parseHash = parseHash;

  R.go = function (key, param) {
    var h = '#/' + key + (param !== undefined && param !== null && param !== '' ? '/' + param : '');
    if (location.hash === h) { R.render(); return; }
    location.hash = h;
  };

  R.current = function () { return R.cur; };

  R.render = function () {
    var main = document.getElementById('main');
    if (!main) return;
    var info = parseHash();
    var def = R.pages[info.key];

    // 1) 关闭所有弹窗并清理游离遮罩（跨路由残留防护）
    try { w.ZUI.closeAllModals(); } catch (e) { }
    D.qa('.mask').forEach(function (m) { m.remove(); });
    // 关闭顶栏浮层
    D.qa('.pop').forEach(function (p) { p.remove(); });
    // 关闭窄屏抽屉
    var sb = document.querySelector('.sidebar');
    if (sb) sb.classList.remove('open');
    D.qa('.scrim').forEach(function (m) { m.remove(); });

    R.cur = { key: info.key, param: info.param, title: def ? def.title : '' };

    // 2) 高亮菜单
    D.qa('.nav-i').forEach(function (n) {
      n.classList.toggle('on', n.getAttribute('data-id') === info.key);
    });
    // 3) 面包屑 / 文档标题
    var groupName = def && def.group ? def.group : '';
    var crumb = document.getElementById('crumb');
    if (crumb) crumb.innerHTML = groupName ? '<b>' + U.esc(groupName) + '</b> / ' + U.esc(def ? def.title : '') : '';
    document.title = (def ? def.title + ' · ' : '') + (w.DB && w.DB.data.meta ? w.DB.data.meta.school + '第二课堂成绩单系统' : '第二课堂成绩单系统');

    // 4) 渲染
    D.fill(main, null);
    main.scrollTop = 0;
    window.scrollTo(0, 0);
    try {
      if (!def) {
        D.fill(main, R.notFound(info.unknown || info.key));
        return;
      }
      def.render(main, info.param);
    } catch (err) {
      R.errors.push({ key: info.key, msg: err && err.message, stack: err && err.stack });
      console.error('[router] 渲染失败 #' + info.key, err);
      D.fill(main, R.crash(info.key, err));
    }
    // 5) 通知页面渲染完成（页面内部可监听做局部刷新）
    try { document.dispatchEvent(new CustomEvent('page:after', { detail: R.cur })); } catch (e) { }
  };

  /** 渲染异常卡片（可诊断，不是空白页） */
  R.crash = function (key, err) {
    return D.h('div.card', { style: 'border-color:#fbd5d5' },
      D.h('div.card-h', { style: 'background:#fef2f2' }, D.h('h3', { style: 'color:#b91c1c' }, '⚠ 页面渲染异常')),
      D.h('div.card-b', {},
        D.h('p', { style: 'font-size:13px;margin-bottom:8px' }, '页面「' + key + '」在渲染时发生错误，已拦截以避免影响其他功能。'),
        D.h('div.code-box', String((err && err.message) || err) + '\n\n' + String(((err && err.stack) || '').split('\n').slice(0, 4).join('\n'))),
        D.h('div.mt12', D.h('button.btn.btn-sm.btn-p', {
          onclick: function () { R.go('dash'); }
        }, '返回运行总览'))
      )
    );
  };
  /** 未注册路由 */
  R.notFound = function (key) {
    return D.h('div.card', {},
      D.h('div.card-b', { style: 'padding:44px 20px' },
        D.h('div.empty', { style: 'padding:0' },
          D.h('div.e-ic', '🧭'),
          D.h('div.e-t', '未找到该功能页面'),
          D.h('div', '路由 “' + String(key) + '” 不存在。'),
          D.h('div.mt12', D.h('button.btn.btn-sm.btn-p', { onclick: function () { R.go('dash'); } }, '返回运行总览'))
        )
      )
    );
  };

  /** 监听 hash 变化 */
  R.start = function (defaultKey) {
    R.defaultKey = defaultKey || 'dash';
    window.addEventListener('hashchange', R.render);
    R.render();
  };

  w.ZR = R;
})(window);
