/* 智课云 · 移动端应用（/mobile） */
(function () {
  'use strict';
  const S = window.Store;
  const $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function toast(msg) { const w = $('mToast'); const t = document.createElement('div'); t.className = 'm-toast'; t.textContent = msg; w.appendChild(t); setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2000); }
  function masteryColor(v) { return v >= 85 ? '#16a34a' : v >= 70 ? '#2563eb' : v >= 60 ? '#f59e0b' : '#e11d48'; }
  function kpById(id) { let r = null; Object.keys(S.data.graph).forEach(function (c) { S.data.graph[c].forEach(function (k) { if (k.id === id) r = k; }); }); return r; }
  function courseById(id) { return S.COURSES.filter(function (c) { return c.id === id; })[0]; }

  const App = { session: null, tab: 'graph', course: 'C1', mode: 'map', micro: null };
  const ICON = {
    graph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M12 7.4v3.6M12 11l-5 5M12 11l5 5"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>'
  };

  /* ---------------- 启动 ---------------- */
  function boot() { bind(); const s = S.getSession(); if (s) enter(s); else showLogin(); }
  function showLogin() { $('mLogin').style.display = 'flex'; $('mApp').classList.remove('active'); $('mErr').style.display = 'none'; }
  function enter(s) {
    App.session = s;
    $('mLogin').style.display = 'none';
    $('mApp').classList.add('active');
    const r = S.roleById(s.role);
    $('mAvatar').textContent = r.short; $('mAvatar').style.background = r.color;
    renderTabbar(); renderBell(); render();
  }
  function logout() { S.clearSession(); App.session = null; showLogin(); toast('已退出登录'); }
  function submit(e) { e.preventDefault(); const s = S.login($('mUser').value.trim(), $('mPass').value); if (!s) { $('mErr').textContent = '账号或密码错误，请重新输入'; $('mErr').style.display = 'block'; return; } enter(s); toast('欢迎回来，' + s.name); }

  function renderTabbar() {
    const tabs = [{ id: 'graph', t: '课程图谱', i: ICON.graph }, { id: 'msg', t: '消息', i: ICON.msg }, { id: 'me', t: '我的', i: ICON.me }];
    $('mTabbar').innerHTML = tabs.map(function (x) { return '<button class="m-tab' + (App.tab === x.id ? ' active' : '') + '" data-tab="' + x.id + '">' + x.i + '<span>' + x.t + '</span></button>'; }).join('');
  }
  function renderBell() { const n = S.unreadCount(); const d = $('mBellDot'); if (n > 0) { d.style.display = 'grid'; d.textContent = n; } else d.style.display = 'none'; }
  function setTitle(t, sub) { $('mTitle').textContent = t; $('mSub').textContent = sub || '智课云 · 移动学习'; }

  function render() {
    if (App.tab === 'graph') renderGraph();
    else if (App.tab === 'msg') renderMsgs();
    else renderMe();
  }

  /* ---------------- 课程图谱 ---------------- */
  function renderGraph() {
    setTitle('课程图谱', courseById(App.course).name);
    const courses = S.COURSES;
    let h = '<div class="m-course-pick">' + courses.map(function (c) { return '<button class="' + (App.course === c.id ? 'active' : '') + '" data-course="' + c.id + '">' + c.name + '</button>'; }).join('') + '</div>';
    h += '<div class="m-seg">' + [['map', '图谱模式'], ['outline', '大纲模式'], ['learn', '学习地图模式']].map(function (m) { return '<button class="' + (App.mode === m[0] ? 'active' : '') + '" data-mode="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>';
    h += '<div id="graphBody">' + graphBody() + '</div>';
    $('mBody').innerHTML = h;
  }
  function graphBody() {
    const nodes = S.data.graph[App.course];
    if (App.mode === 'map') {
      let h = '<div class="m-graph">';
      S.CHAPTERS[App.course].forEach(function (ch, ci) {
        const list = nodes.filter(function (n) { return n.chapter === ci; });
        if (!list.length) return;
        h += '<div class="m-chapter">第 ' + (ci + 1) + ' 章 · ' + esc(ch) + '</div>';
        list.forEach(function (n) {
          h += '<div class="m-gnode" data-kp="' + n.id + '"><span class="dot" style="background:' + masteryColor(n.mastery) + '"></span><span class="nm">' + esc(n.name) + '</span><span class="rt" style="color:' + masteryColor(n.mastery) + '">' + n.mastery + '%</span></div>';
        });
      });
      h += '</div><div style="margin-top:10px;font-size:11.5px;color:var(--muted)">点击任一知识点进入微课学习（分析 / 学习内容 / 自测 / 资料 / 错题集 / 讨论）</div>';
      return h;
    }
    if (App.mode === 'outline') {
      let h = '<div class="m-outline">';
      S.CHAPTERS[App.course].forEach(function (ch, ci) {
        const list = nodes.filter(function (n) { return n.chapter === ci; });
        h += '<div class="ol-chapter"><div class="ol-hd"><span class="n">' + (ci + 1) + '</span>' + esc(ch) + '<span style="margin-left:auto;font-size:12px;color:var(--muted)">' + list.length + ' 个知识点</span></div>';
        list.forEach(function (n) {
          h += '<div class="ol-item" data-kp="' + n.id + '"><span class="dot" style="width:9px;height:9px;border-radius:50%;background:' + masteryColor(n.mastery) + '"></span><span>' + esc(n.name) + '</span><span class="st" style="color:' + masteryColor(n.mastery) + '">掌握 ' + n.mastery + '%</span></div>';
        });
        h += '</div>';
      });
      return h + '</div>';
    }
    // 学习地图模式
    let idx = 0;
    let h = '<div class="m-map">';
    nodes.forEach(function (n) {
      idx++;
      const done = n.mastery >= 85, ok = n.mastery >= 60;
      const label = done ? '已掌握' : ok ? '学习中' : '待巩固';
      const done2 = (idx < nodes.length);
      h += '<div class="mstep"><div class="ln"><span class="bub" style="background:' + masteryColor(n.mastery) + '">' + idx + '</span>' + (done2 ? '<span class="bar"></span>' : '') + '</div>' +
        '<div class="bx" data-kp="' + n.id + '"><b>' + esc(n.name) + '</b><small>' + esc(S.CHAPTERS[App.course][n.chapter]) + ' · ' + label + ' · 掌握 ' + n.mastery + '%</small></div></div>';
    });
    return h + '</div>';
  }

  /* ---------------- 微课 ---------------- */
  function openMicro(kpId) {
    App.micro = { kpId: kpId, tab: 'analysis', quiz: null, answers: {}, submitted: false, scope: 'kp' };
    $('mPageTitle').textContent = '微课学习';
    $('mPage').classList.add('open');
    renderMicro();
  }
  function closePage() { $('mPage').classList.remove('open'); }

  function renderMicro() {
    const kp = kpById(App.micro.kpId);
    if (!kp) return closePage();
    const an = S.data.analysis[kp.id] || { points: [] };
    const tabs = [['analysis', '分析'], ['content', '学习内容'], ['quiz', '自测'], ['mats', '资料'], ['wrong', '错题集'], ['discuss', '讨论']];
    let h = '<div class="m-micro-hd"><h3>' + esc(kp.name) + '</h3><p>' + esc(S.CHAPTERS[kp.course][kp.chapter]) + ' · 知识点 ' + kp.id + '</p>' +
      '<div class="stats"><div><b>' + kp.mastery + '%</b>班级掌握率</div><div><b>' + kp.completion + '%</b>完成率</div><div><b>' + kp.diff + '/3</b>难度</div></div></div>';
    h += '<div class="m-mtabs">' + tabs.map(function (t) { return '<button class="' + (App.micro.tab === t[0] ? 'active' : '') + '" data-mtab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    h += '<div id="microBody">' + microBody(kp, an) + '</div>';
    $('mPageBody').innerHTML = h;
  }

  function microBody(kp, an) {
    const t = App.micro.tab;
    if (t === 'analysis') {
      return '<div class="m-card"><div class="m-card-hd">AI 内容解析</div><div style="padding:15px"><p style="font-size:13.5px;line-height:1.8;margin:0">' + esc(an.core || '') + '</p>' +
        '<ul style="font-size:13px;line-height:1.9;color:var(--sub);margin:12px 0 0;padding-left:18px">' + (an.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
        '<div style="margin-top:14px"><b style="font-size:13px">知识点词云</b><div style="margin-top:8px">' + (an.keyWords || []).map(function (k, i) { return '<span class="m-tag blue" style="margin:3px 4px 0 0;font-size:' + (11 + (i % 3)) + 'px">' + esc(k) + '</span>'; }).join('') + '</div></div>' +
        '<div style="margin-top:14px;font-size:12.5px;color:var(--muted)">讲解视频时长 ' + esc(an.videoLen || '') + ' · 难度系数 ' + kp.diff + ' / 3</div></div></div>';
    }
    if (t === 'content') {
      return '<div class="m-video"><div class="play"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div><div style="position:absolute;bottom:12px;left:14px;font-size:12px">知识讲解视频 · 支持智能切片与 AI 助教答疑</div></div>' +
        '<div class="m-card"><div class="m-card-hd">学习内容</div><div style="padding:6px 15px">' +
        (an.points || []).map(function (p, i) { return '<div class="m-item"><span class="m-icon" style="background:#eef4ff;color:#2563eb">' + (i + 1) + '</span><div class="body"><div class="t1" style="font-weight:500;font-size:13.5px">' + esc(p) + '</div></div></div>'; }).join('') +
        '</div></div>' +
        '<div class="m-card"><div class="m-card-hd">AI 助教</div><div style="padding:14px"><div class="m-search" style="margin:0"><input id="aiAsk" placeholder="有不懂的？点击提问，AI 助教即时答疑"></div><button class="m-btn" data-act="ai-ask">向 AI 助教提问</button></div></div>';
    }
    if (t === 'quiz') return quizBody(kp);
    if (t === 'mats') {
      return '<div class="m-card">' + (S.data.materials[kp.id] || []).map(function (m) { return '<div class="m-item"><span class="m-icon" style="background:#f1f5f9;color:#475569">' + esc(m.type) + '</span><div class="body"><div class="t1" style="font-weight:500;font-size:13px">' + esc(m.name) + '</div><div class="t2"><span>' + esc(m.size) + '</span></div></div><svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg></div>'; }).join('') + '</div>';
    }
    if (t === 'wrong') {
      const wb = wrongList(kp.id);
      if (!wb.length) return '<div class="m-card"><div class="m-empty">暂无错题，去「自测」练习一下吧</div></div>';
      return '<div class="m-card"><div class="m-card-hd">错题集 · ' + wb.length + ' 题</div><div style="padding:14px">' + wb.map(function (w) {
        return '<div class="m-q"><div class="qt">' + esc(w.stem) + '</div><div style="font-size:13px;color:var(--danger)">你的作答：' + esc(w.your) + '</div><div style="font-size:13px;color:var(--success);margin-top:4px">正确答案：' + esc(w.correct) + '</div><div style="font-size:12.5px;color:var(--muted);margin-top:8px">解析：' + esc(w.analysis) + '</div></div>';
      }).join('') + '</div></div>';
    }
    if (t === 'discuss') {
      const list = S.data.discussions[kp.id] || [];
      let h = '<div class="m-card"><div class="m-card-hd">讨论区</div><div class="m-discuss" style="padding:6px 15px">' + list.map(function (d) {
        return '<div class="d"><span class="av">' + esc(d.avatar) + '</span><div style="flex:1"><b>' + esc(d.user) + '</b><p>' + esc(d.content) + '</p>' + (d.replies || []).map(function (r) { return '<div class="rep"><b>' + esc(r.user) + '</b>：' + esc(r.content) + '</div>'; }).join('') + '<div style="font-size:11.5px;color:var(--muted);margin-top:6px">' + esc(d.time) + '</div></div></div>';
      }).join('') + '</div></div>';
      return h + '<div class="m-card"><div style="padding:14px"><div class="m-search" style="margin:0"><input id="discInput" placeholder="参与讨论，发表你的看法…"></div><button class="m-btn" data-act="disc-post">发表</button></div></div>';
    }
    return '';
  }

  function quizBody(kp) {
    if (!App.micro.quiz) {
      return '<div class="m-card"><div class="m-card-hd">开始自测</div><div style="padding:15px">' +
        '<div style="font-size:13px;color:var(--sub);margin-bottom:10px">抽题范围（避免抽到未开始学习的知识点）</div>' +
        '<div class="m-seg"><button class="' + (App.micro.scope === 'kp' ? 'active' : '') + '" data-scope="kp">仅当前知识点</button><button class="' + (App.micro.scope === 'pre' ? 'active' : '') + '" data-scope="pre">当前及前置知识点</button></div>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">将从「' + esc(kp.name) + '」' + (App.micro.scope === 'pre' ? '及其前置知识点' : '') + '的题库中抽取最多 5 道题</div>' +
        '<button class="m-btn" data-act="quiz-start">开始自测</button></div></div>';
    }
    const q = App.micro.quiz;
    let h = '<div class="m-card"><div class="m-card-hd">自测 · 共 ' + q.length + ' 题</div><div style="padding:14px">';
    q.forEach(function (item, qi) {
      h += '<div class="m-q"><div class="qt">' + (qi + 1) + '. ' + esc(item.stem) + '</div>';
      item.options.forEach(function (o, oi) {
        let cls = '';
        const picked = App.micro.answers[item.id] === oi;
        if (App.micro.submitted) {
          if (oi === item.answer) cls = 'correct'; else if (picked) cls = 'wrong';
        } else if (picked) cls = 'sel';
        h += '<div class="qo ' + cls + '" data-ans="' + item.id + '|' + oi + '"><span class="k">' + 'ABCD'[oi] + '</span><span>' + esc(o) + '</span></div>';
      });
      if (App.micro.submitted) h += '<div style="font-size:12.5px;color:var(--muted);margin-top:6px">解析：' + esc(item.analysis) + '</div>';
      h += '</div>';
    });
    if (!App.micro.submitted) h += '<button class="m-btn" data-act="quiz-submit">提交答卷</button>';
    else {
      const correct = q.filter(function (item) { return App.micro.answers[item.id] === item.answer; }).length;
      h += '<div class="m-score"><div class="big">' + Math.round(correct / q.length * 100) + '</div><div class="lbl">本次得分（答对 ' + correct + '/' + q.length + ' 题）</div></div><button class="m-btn ghost" data-act="quiz-again">再测一次</button>';
    }
    h += '</div></div>';
    return h;
  }

  function startQuiz(kp) {
    const scope = App.micro.scope;
    let kpIds = [kp.id];
    if (scope === 'pre') kpIds = kpIds.concat(kp.pre || []);
    let pool = S.data.questions.filter(function (q) { return kpIds.indexOf(q.kpId) >= 0; });
    pool = pool.slice(0, 5);
    if (pool.length === 0) { toast('该知识点暂无试题'); return; }
    App.micro.quiz = pool; App.micro.answers = {}; App.micro.submitted = false;
    renderMicro();
  }
  function submitQuiz() {
    const q = App.micro.quiz;
    if (!q) return;
    const ans = App.micro.answers;
    const missing = q.filter(function (item) { return ans[item.id] == null; }).length;
    if (missing > 0) { toast('还有 ' + missing + ' 题未作答'); return; }
    App.micro.submitted = true;
    // 记录错题
    const kpId = App.micro.kpId;
    const wb = S.data.wrongBook[kpId] = S.data.wrongBook[kpId] || [];
    q.forEach(function (item) {
      if (ans[item.id] !== item.answer) {
        if (!wb.some(function (w) { return w.qid === item.id; })) {
          wb.push({ qid: item.id, stem: item.stem, your: 'ABCD'[ans[item.id]] + '. ' + item.options[ans[item.id]], correct: 'ABCD'[item.answer] + '. ' + item.options[item.answer], analysis: item.analysis });
        }
      }
    });
    S.save();
    renderMicro();
    const correct = q.filter(function (item) { return ans[item.id] === item.answer; }).length;
    toast('自测完成，答对 ' + correct + '/' + q.length + ' 题');
  }
  function wrongList(kpId) { return S.data.wrongBook[kpId] || []; }

  /* ---------------- 消息 ---------------- */
  function renderMsgs() {
    setTitle('消息中心', '未读 ' + S.unreadCount() + ' 条');
    const msgs = S.data.messages.slice().sort(function (a, b) { return String(b.id).localeCompare(String(a.id)); });
    let h = '<div class="m-card"><div class="m-card-hd">全部消息<span class="spacer"></span><span class="more" data-act="allread">全部已读</span></div>';
    msgs.forEach(function (m) {
      h += '<div class="m-item" data-msg="' + m.id + '"><span class="m-icon" style="background:' + (m.read ? '#f1f4f9' : '#eef4ff') + ';color:' + (m.read ? '#8a95a8' : '#2563eb') + ';width:8px;height:8px;border-radius:50%;padding:0"></span>' +
        '<div class="body"><div class="t1">' + esc(m.title) + ' <span class="m-tag ' + (m.type === '告警' ? 'red' : m.type === '待办' ? 'blue' : m.type === '提醒' ? 'orange' : 'cyan') + '">' + esc(m.type) + '</span></div><div class="t2"><span>' + esc(m.content) + '</span></div></div><span style="color:var(--muted);font-size:11.5px;white-space:nowrap">' + esc(m.createdAt) + '</span></div>';
    });
    return $('mBody').innerHTML = h + '</div>';
  }

  /* ---------------- 我的 ---------------- */
  function renderMe() {
    setTitle('我的', '个人中心');
    const s = App.session, r = S.roleById(s.role);
    const wrongTotal = Object.keys(S.data.wrongBook).reduce(function (a, k) { return a + S.data.wrongBook[k].length; }, 0);
    let h = '<div class="m-hero" style="background:linear-gradient(135deg,#0f172a,#334155)"><div style="display:flex;align-items:center;gap:14px"><span class="m-avatar" style="width:52px;height:52px;font-size:20px;background:' + r.color + '">' + r.short + '</span><div><div class="name" style="margin:0">' + esc(s.name) + '</div><div class="meta">' + esc(s.dept) + ' · ' + r.name + '</div></div></div></div>';
    h += '<div class="m-card"><div class="m-card-hd">学习概览</div><div style="display:grid;grid-template-columns:repeat(3,1fr)">' +
      meStat(S.data.graph[App.course].length, '知识点') + meStat(wrongTotal, '错题数') + meStat(Object.keys(S.data.wrongBook).length, '已练知识点') + '</div></div>';
    h += '<div class="m-card"><div class="m-card-hd">切换角色<span class="spacer"></span><span class="more">当前：' + r.name + '</span></div>';
    S.ROLES.forEach(function (x) {
      h += '<div class="m-item" data-role="' + x.id + '"><span class="m-avatar" style="background:' + x.color + '">' + x.short + '</span><div class="body"><div class="t1">' + x.name + (x.id === s.role ? ' <span class="m-tag blue">当前</span>' : '') + '</div><div class="t2"><span>' + esc(x.desc) + '</span></div></div>' + (x.id === s.role ? '<span style="color:var(--primary);font-weight:700">✓</span>' : '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>') + '</div>';
    });
    h += '</div>';
    h += '<div class="m-card"><div class="m-card-hd">设置</div>' +
      '<div class="m-item" data-act="about"><div class="body"><div class="t1">关于平台</div><div class="t2"><span>智课云移动端 v3.1.0</span></div></div></div>' +
      '<div class="m-item" data-act="reset"><div class="body"><div class="t1">恢复初始数据</div><div class="t2"><span>清空错题与学习记录</span></div></div></div></div>';
    h += '<button class="m-btn danger" data-act="logout" style="margin-bottom:20px">退出登录</button>';
    $('mBody').innerHTML = h;
  }
  function meStat(v, l) { return '<div style="text-align:center;padding:16px 6px"><div style="font-size:21px;font-weight:800;color:var(--primary)">' + v + '</div><div style="font-size:12px;color:var(--muted);margin-top:4px">' + l + '</div></div>'; }

  /* ---------------- 角色切换 ---------------- */
  function openRoleSheet() {
    $('mSheetTitle').textContent = '切换角色（即时生效）';
    let h = '';
    S.ROLES.forEach(function (x) { h += '<div class="m-sheet-item' + (x.id === App.session.role ? ' active' : '') + '" data-pick="' + x.id + '"><span class="m-avatar" style="background:' + x.color + '">' + x.short + '</span><span style="flex:1"><b>' + x.name + '</b><small>' + esc(x.desc) + '</small></span>' + (x.id === App.session.role ? '<span class="ck">✓</span>' : '') + '</div>'; });
    $('mSheetBody').innerHTML = h; $('mSheetMask').classList.add('open'); $('mSheet').classList.add('open');
  }
  function closeSheet() { $('mSheetMask').classList.remove('open'); $('mSheet').classList.remove('open'); }
  function pickRole(id) {
    App.session.role = id; S.setSession(App.session);
    const r = S.roleById(id);
    $('mAvatar').textContent = r.short; $('mAvatar').style.background = r.color;
    App.tab = 'graph'; renderTabbar(); render(); closeSheet(); toast('已切换为「' + r.name + '」');
  }

  /* ---------------- 事件 ---------------- */
  function bind() {
    $('mLoginForm').addEventListener('submit', submit);
    $('mBack').addEventListener('click', closePage);
    $('mBell').addEventListener('click', function () { App.tab = 'msg'; renderTabbar(); render(); renderBell(); });
    $('mAvatar').addEventListener('click', openRoleSheet);
    $('mSheetMask').addEventListener('click', closeSheet);

    document.addEventListener('click', function (e) {
      const t = e.target.closest('[data-tab],[data-course],[data-mode],[data-kp],[data-mtab],[data-scope],[data-ans],[data-role],[data-pick],[data-msg],[data-act]');
      if (!t) return;
      if (t.hasAttribute('data-tab')) { App.tab = t.getAttribute('data-tab'); renderTabbar(); render(); return; }
      if (t.hasAttribute('data-course')) { App.course = t.getAttribute('data-course'); renderGraph(); return; }
      if (t.hasAttribute('data-mode')) { App.mode = t.getAttribute('data-mode'); renderGraph(); return; }
      if (t.hasAttribute('data-kp')) { openMicro(t.getAttribute('data-kp')); return; }
      if (t.hasAttribute('data-mtab')) { App.micro.tab = t.getAttribute('data-mtab'); renderMicro(); return; }
      if (t.hasAttribute('data-scope')) { App.micro.scope = t.getAttribute('data-scope'); renderMicro(); return; }
      if (t.hasAttribute('data-ans')) { const p = t.getAttribute('data-ans').split('|'); if (!App.micro.submitted) { App.micro.answers[p[0]] = Number(p[1]); const card = t.closest('.m-q'); if (card) { card.querySelectorAll('.qo').forEach(function (o) { o.classList.remove('sel'); }); t.classList.add('sel'); } } return; }
      if (t.hasAttribute('data-pick')) { pickRole(t.getAttribute('data-pick')); return; }
      if (t.hasAttribute('data-role')) { pickRole(t.getAttribute('data-role')); return; }
      if (t.hasAttribute('data-msg')) {
        const m = S.data.messages.filter(function (x) { return x.id === t.getAttribute('data-msg'); })[0];
        if (m && !m.read) { m.read = true; S.save(); } renderBell(); renderMsgs();
        if (m) { $('mPageTitle').textContent = '消息详情'; $('mPageBody').innerHTML = '<div class="m-kv"><div class="row"><span class="k">标题</span><span class="v">' + esc(m.title) + '</span></div><div class="row"><span class="k">类型</span><span class="v">' + esc(m.type) + '</span></div><div class="row"><span class="k">时间</span><span class="v">' + esc(m.createdAt) + '</span></div></div><div class="m-card" style="margin-top:12px"><div style="padding:15px;font-size:13.5px;line-height:1.8">' + esc(m.content) + '</div></div>'; $('mPage').classList.add('open'); }
        return;
      }
      if (t.hasAttribute('data-act')) {
        const a = t.getAttribute('data-act');
        if (a === 'quiz-start') { startQuiz(kpById(App.micro.kpId)); }
        else if (a === 'quiz-submit') { submitQuiz(); }
        else if (a === 'quiz-again') { App.micro.quiz = null; App.micro.submitted = false; App.micro.answers = {}; renderMicro(); }
        else if (a === 'disc-post') { const v = $('discInput').value.trim(); if (!v) { toast('请输入内容'); return; } S.data.discussions[App.micro.kpId].push({ user: S.roleById(App.session.role).name + '(' + App.session.name + ')', avatar: App.session.name.charAt(0), content: v, time: '刚刚', replies: [] }); S.save(); renderMicro(); toast('已发表'); }
        else if (a === 'ai-ask') { const v = ($('aiAsk') && $('aiAsk').value.trim()) || '这个知识点在实际工程中如何应用？'; toast('AI 助教正在解答…'); setTimeout(function () { toast('AI 助教：' + aiAnswer(App.micro.kpId, v)); }, 400); }
        else if (a === 'allread') { S.data.messages.forEach(function (m) { m.read = true; }); S.save(); renderBell(); renderMsgs(); toast('已全部标为已读'); }
        else if (a === 'logout') { if (confirm('确定要退出当前账号吗？')) logout(); }
        else if (a === 'about') { $('mPageTitle').textContent = '关于平台'; $('mPageBody').innerHTML = '<div class="m-kv"><div class="row"><span class="k">产品</span><span class="v">智课云 · AI+智慧课程资源建设与运行平台</span></div><div class="row"><span class="k">客户端</span><span class="v">移动端 v3.1.0</span></div><div class="row"><span class="k">访问方式</span><span class="v">微信公众号 / 移动 App</span></div></div>'; $('mPage').classList.add('open'); }
        else if (a === 'reset') { if (confirm('确定恢复初始数据？将清空错题与学习记录。')) { S.resetAll(); location.reload(); } }
        return;
      }
    });
  }
  function aiAnswer(kpId, q) {
    const kp = kpById(kpId);
    const an = S.data.analysis[kpId] || {};
    if (/应用|实践|工程/.test(q)) return '「' + kp.name + '」在工程实践中，主要体现在' + (an.points && an.points[1] ? an.points[1] : '技术要点与现场管理') + '。建议结合配套案例与规范条文理解。';
    if (/自测|题|考/.test(q)) return '你可以在「自测」标签中按知识点或前置知识点抽题练习，做错的题会自动进入「错题集」方便复习。';
    return '关于「' + kp.name + '」：' + (an.core || '请参考学习内容与配套资料。');
  }

  boot();
})();
