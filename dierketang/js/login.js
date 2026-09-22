/* ==========================================================================
   login.js —— 登录页逻辑
   三种登录方式：账号密码 / 手机验证码 / 统一身份认证（本地模拟，真实校验）
   登录页不展示任何账号密码提示；演示账号见《交付文档》。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI;

  var TABS = [
    { k: 'pwd', n: '账号密码' },
    { k: 'sms', n: '手机验证码' },
    { k: 'cas', n: '统一身份认证' }
  ];
  var state = { tab: 'pwd', captcha: '', smsCode: '', smsSentAt: 0, smsAccount: '' };

  function newCaptcha() {
    var chars = '2345678ABCDEFGHJKLMNPQRSTUVWXY';
    var s = '';
    for (var i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    state.captcha = s;
    return s;
  }

  function tabsEl() {
    var host = D.h('div.login-tabs#loginTabs');
    TABS.forEach(function (t) {
      host.appendChild(D.h('button' + (state.tab === t.k ? '.on' : ''), {
        type: 'button', dataset: { k: t.k },
        onclick: function () { state.tab = t.k; paint(); }
      }, t.n));
    });
    return host;
  }

  function errEl(msg) {
    return D.h('div.login-err', { html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>' }, D.h('span', msg));
  }

  function pwdForm() {
    var f = D.h('form.login-frm#loginForm', { autocomplete: 'off' });
    var acc = D.h('input#account', { placeholder: '请输入学号 / 工号', autocomplete: 'off' });
    var pwd = D.h('input#password', { type: 'password', placeholder: '请输入登录密码', autocomplete: 'off' });
    var cap = D.h('input#captcha', { placeholder: '请输入右侧验证码', maxlength: '4', autocomplete: 'off' });
    var capImg = D.h('div.cap-img', { title: '点击刷新验证码' }, newCaptcha());
    capImg.addEventListener('click', function () { capImg.textContent = newCaptcha(); });

    var errHost = D.h('div');
    f.appendChild(D.h('div.fld', D.h('label', '登录账号'), acc));
    f.appendChild(D.h('div.fld', D.h('label', '登录密码'), pwd));
    f.appendChild(D.h('div.fld', D.h('label', '验证码'), D.h('div.cap-row', cap, capImg)));
    f.appendChild(errHost);
    f.appendChild(D.h('div.login-opt',
      D.h('label.chk', D.h('input', { type: 'checkbox', id: 'remember', checked: true }), '记住登录状态'),
      D.h('a', { href: 'javascript:;', onclick: function () { UI.toast('密码找回', '请联系学院团委或信息化中心重置密码', 'warn'); } }, '忘记密码？')
    ));
    f.appendChild(D.h('button.btn.btn-p.btn-block', {
      type: 'submit', id: 'submitBtn', style: 'padding:11px;font-size:14px;margin-top:4px'
    }, '登 录'));

    function showErr(msg) {
      D.fill(errHost, null);
      errHost.appendChild(errEl(msg));
      return false;
    }
    function clearErr() { D.fill(errHost, null); }

    cap.addEventListener('keydown', function (e) { if (e.key === 'Enter') f.requestSubmit(); });
    pwd.addEventListener('keydown', function (e) { if (e.key === 'Enter') f.requestSubmit(); });

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErr();
      var a = acc.value.trim(), p = pwd.value, c = cap.value.trim();
      if (!a) { acc.focus(); return showErr('请输入登录账号'); }
      if (!p) { pwd.focus(); return showErr('请输入登录密码'); }
      if (!c) { cap.focus(); return showErr('请输入验证码'); }
      if (c.toUpperCase() !== state.captcha) {
        cap.value = ''; capImg.textContent = newCaptcha(); cap.focus();
        return showErr('验证码错误，请重新输入');
      }
      var btn = D.q('#submitBtn', f);
      btn.disabled = true;
      btn.textContent = '正在验证身份…';
      setTimeout(function () {
        var res = w.ZA.login(a, p);
        if (!res.ok) {
          btn.disabled = false; btn.textContent = '登 录';
          cap.value = ''; capImg.textContent = newCaptcha();
          return showErr(res.msg);
        }
        btn.textContent = '登录成功，正在进入系统…';
        UI.toast('登录成功', '欢迎回来，' + res.session.name, 'ok');
        setTimeout(function () { location.href = 'app.html'; }, 420);
      }, 420);
      return false;
    });
    return f;
  }

  function smsForm() {
    var f = D.h('form.login-frm#loginForm', { autocomplete: 'off' });
    var acc = D.h('input#smsAccount', { placeholder: '请输入学号 / 工号', autocomplete: 'off' });
    var code = D.h('input#smsCode', { placeholder: '请输入短信验证码', maxlength: '6', autocomplete: 'off' });
    var getBtn = D.h('button.btn.btn-sm', { type: 'button', style: 'flex:0 0 108px' }, '获取验证码');
    var errHost = D.h('div');
    var timer = null;

    getBtn.addEventListener('click', function () {
      var a = acc.value.trim();
      if (!a) { acc.focus(); return showErr('请输入学号 / 工号'); }
      var hit = w.ZA.lookup(a);
      if (!hit) { return showErr('该账号不存在，请核对后重试'); }
      clearErr();
      state.smsCode = String(Math.floor(100000 + Math.random() * 900000));
      state.smsSentAt = Date.now();
      state.smsAccount = a;
      UI.toast('验证码已发送至绑定手机 ' + (hit.user.contact || '—'), '本次验证码：' + state.smsCode, 'ok');
      var left = 60;
      getBtn.disabled = true;
      getBtn.textContent = left + ' 秒后重发';
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        left--;
        if (left <= 0) { clearInterval(timer); getBtn.disabled = false; getBtn.textContent = '重新获取'; }
        else getBtn.textContent = left + ' 秒后重发';
      }, 1000);
    });

    f.appendChild(D.h('div.fld', D.h('label', '登录账号'), acc));
    f.appendChild(D.h('div.fld', D.h('label', '短信验证码'), D.h('div.inline', code, getBtn)));
    f.appendChild(errHost);
    f.appendChild(D.h('div.login-opt',
      D.h('span.muted', '验证码将发送至账号已绑定的手机号'),
      D.h('a', { href: 'javascript:;', onclick: function () { state.tab = 'pwd'; paint(); } }, '改用账号密码')
    ));
    f.appendChild(D.h('button.btn.btn-p.btn-block', { type: 'submit', id: 'submitBtn', style: 'padding:11px;font-size:14px;margin-top:4px' }, '登 录'));

    function showErr(msg) { D.fill(errHost, null); errHost.appendChild(errEl(msg)); return false; }
    function clearErr() { D.fill(errHost, null); }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = acc.value.trim(), c = code.value.trim();
      if (!a) { acc.focus(); return showErr('请输入学号 / 工号'); }
      if (!state.smsCode) { code.focus(); return showErr('请先获取短信验证码'); }
      if (state.smsAccount !== a) { return showErr('账号已变更，请重新获取验证码'); }
      if (Date.now() - state.smsSentAt > 5 * 60000) { return showErr('验证码已过期，请重新获取'); }
      if (c !== state.smsCode) { code.value = ''; code.focus(); return showErr('短信验证码不正确'); }
      var hit = w.ZA.lookup(a);
      if (!hit) return showErr('该账号不存在');
      clearErr();
      var res = w.ZA.login(a, hit.user.pw);
      if (!res.ok) return showErr(res.msg);
      UI.toast('登录成功', '欢迎回来，' + res.session.name, 'ok');
      var btn = D.q('#submitBtn', f);
      btn.disabled = true; btn.textContent = '正在进入系统…';
      setTimeout(function () { location.href = 'app.html'; }, 420);
      return false;
    });
    return f;
  }

  function casForm() {
    var f = D.h('form.login-frm#loginForm', { autocomplete: 'off' });
    var acc = D.h('input#casAccount', { placeholder: '统一身份认证账号（学号 / 工号）', autocomplete: 'off' });
    var pwd = D.h('input#casPwd', { type: 'password', placeholder: '统一身份认证密码', autocomplete: 'off' });
    var errHost = D.h('div');
    f.appendChild(D.h('div.req-note', { html: '统一身份认证将跳转学校 CAS 单点登录服务完成校验，本机演示环境直接校验账号与密码，无需跳转。' }));
    f.appendChild(D.h('div.fld', D.h('label', '统一身份认证账号'), acc));
    f.appendChild(D.h('div.fld', D.h('label', '统一身份认证密码'), pwd));
    f.appendChild(errHost);
    f.appendChild(D.h('button.btn.btn-p.btn-block', { type: 'submit', id: 'submitBtn', style: 'padding:11px;font-size:14px;margin-top:4px' }, '通过统一身份认证登录'));

    function showErr(msg) { D.fill(errHost, null); errHost.appendChild(errEl(msg)); return false; }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = acc.value.trim(), p = pwd.value;
      if (!a || !p) return showErr('请输入统一身份认证账号与密码');
      var res = w.ZA.login(a, p);
      if (!res.ok) return showErr(res.msg);
      UI.toast('统一身份认证通过', '欢迎回来，' + res.session.name, 'ok');
      var btn = D.q('#submitBtn', f);
      btn.disabled = true; btn.textContent = '认证通过，正在进入系统…';
      setTimeout(function () { location.href = 'app.html'; }, 420);
      return false;
    });
    return f;
  }

  /* ===================== 演示快捷入口 =====================
     演示场景需要「管理员」与「学生」两个主视角一键进入。
     这里只按角色挑账号并调用认证层，源码中不出现任何凭据字面量。
     ======================================================== */
  function demoEntry() {
    var host = document.getElementById('loginDemo');
    if (!host) return;
    var DEMO = w.ZDEMO;
    if (!DEMO) return;

    host.appendChild(D.h('div.ld-t', D.h('i', '演'), '演示快捷入口（免输账号，一键进入对应身份）'));

    var grid = D.h('div.ld-grid');
    [
      { role: 'admin', n: '管理员', s: '全量菜单 · 全流程闭环', ic: '🛡', fg: '#1d4ed8', bg: '#eff6ff' },
      { role: 'student', n: '学生', s: '报名 · 签到 · 成绩单', ic: '🎓', fg: '#047857', bg: '#ecfdf5' }
    ].forEach(function (d) {
      var btn = D.h('button', { type: 'button' },
        D.h('span.ic', { style: 'background:' + d.bg + ';color:' + d.fg }, d.ic),
        D.h('span', D.h('b', d.n), D.h('span', d.s))
      );
      btn.addEventListener('click', function () {
        var r = DEMO.loginAs(d.role);
        if (!r.ok) { UI.toast('进入失败', r.msg || '演示数据中未找到该身份', 'err'); return; }
        UI.toast('已进入「' + d.n + '」身份', r.session.name + ' · ' + (w.ZA.ROLE_LABEL[r.role] || ''), 'ok');
        btn.disabled = true;
        var lab = btn.querySelector('b');
        if (lab) lab.textContent = '正在进入…';
        setTimeout(function () { location.href = 'app.html'; }, 420);
      });
      grid.appendChild(btn);
    });
    host.appendChild(grid);

    var more = D.h('div.ld-grid3');
    [
      { role: 'organizer', n: '组织者' }, { role: 'auditor', n: '审核员' }, { role: 'leader', n: '团总支书记' }
    ].forEach(function (d) {
      var b = D.h('button', { type: 'button' }, d.n);
      b.addEventListener('click', function () {
        var r = DEMO.loginAs(d.role);
        if (!r.ok) { UI.toast('进入失败', r.msg || '演示数据中未找到该身份', 'err'); return; }
        UI.toast('已进入「' + d.n + '」身份', r.session.name, 'ok');
        setTimeout(function () { location.href = 'app.html'; }, 380);
      });
      more.appendChild(b);
    });
    host.appendChild(more);

    var mob = D.h('div.ld-mobile', { html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18.5h2"/></svg>' },
      D.h('span', '用手机端打开（学生视角）'));
    mob.addEventListener('click', function () {
      var r = DEMO.loginAs('student');
      if (!r.ok) { UI.toast('进入失败', r.msg || '演示数据中未找到学生账号', 'err'); return; }
      location.href = 'm.html';
    });
    host.appendChild(mob);
  }

  function paint() {
    var tabsHost = document.getElementById('loginTabs');
    var formHost = document.getElementById('loginForm');
    var newTabs = tabsEl();
    newTabs.id = 'loginTabs';
    tabsHost.parentNode.replaceChild(newTabs, tabsHost);
    var f = state.tab === 'pwd' ? pwdForm() : (state.tab === 'sms' ? smsForm() : casForm());
    formHost.parentNode.replaceChild(f, formHost);
    var first = f.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  function boot() {
    w.DB.init();
    var s = w.ZA.restore();
    paint();
    var note = document.getElementById('loginNote');
    note.innerHTML = '登录即表示同意《第二课堂成绩单系统使用协议》与《个人信息保护说明》。<br>' +
      '本系统面向 ' + w.DB.data.meta.school + ' 师生开放，账号由学校统一分配；如遇登录异常请联系学院团委或信息化中心。';

    document.getElementById('btnSso').addEventListener('click', function () {
      state.tab = 'cas'; paint();
    });
    document.getElementById('btnHelp').addEventListener('click', function () {
      UI.modal({
        title: '登录帮助', size: 'slim',
        body: D.h('div', { style: 'font-size:13px;line-height:1.9' },
          D.h('div.h2', { style: 'font-weight:700;margin-bottom:6px' }, '一、账号说明'),
          D.h('p', '学生账号为本人学号，教职工账号为学校统一分配的工号。'),
          D.h('div.h2', { style: 'font-weight:700;margin:12px 0 6px' }, '二、常见问题'),
          D.h('ul', { style: 'padding-left:18px' },
            D.h('li', '提示"账号不存在"：请确认学号/工号是否输入完整，或联系学院团委确认账号已开通。'),
            D.h('li', '提示"密码错误"：可由学院团委或信息化中心重置密码。'),
            D.h('li', '学籍状态异常（休学/保留学籍）时无法登录，请联系学院团委。'),
            D.h('li', '统一身份认证登录失败：请先在统一身份认证平台修改密码后重试。')
          ),
          D.h('div.h2', { style: 'font-weight:700;margin:12px 0 6px' }, '三、联系方式'),
          D.h('p', '二课管理中心：023-6xxx xxxx　信息化中心：023-6xxx xxxx')
        ),
        foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { UI.closeAllModals(); } }, '知道了')]
      });
    });
    if (s) {
      UI.toast('检测到已登录状态', '正在进入系统…', 'ok');
      setTimeout(function () { location.href = 'app.html'; }, 600);
    } else {
      demoEntry();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
