/* 智慧教育一体化平台 · 纯静态运行时（无框架） */
(function () {
  const S = window.SEED
  const $ = (sel, root) => (root || document).querySelector(sel)
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel))

  /* ---------- icons ---------- */
  const ICON_ALIAS = {
    'check-circle-2': 'circle-check', 'check-circle': 'circle-check', 'alert-triangle': 'triangle-alert',
    'alert-circle': 'circle-alert', 'help-circle': 'circle-help', 'more-horizontal': 'ellipsis',
    'more-vertical': 'ellipsis-vertical', 'unlock': 'lock-open', 'pie-chart': 'chart-pie',
    'bar-chart-3': 'chart-column', 'line-chart': 'chart-line', 'code-2': 'code-xml',
    'wand-2': 'wand-sparkles', network: 'git-branch', 'inbox-out': 'inbox',
  }
  function icon(name, size) {
    const n = window.ICONS[name] ? name : ICON_ALIAS[name]
    const body = (n && window.ICONS[n]) || window.ICONS.dot || ''
    const s = size || 15
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${body}</svg>`
  }
  // 平台 icon 名（platforms.ts 里的 PascalCase）映射
  const PLATFORM_ICONS = { Layers: 'layers', Handshake: 'handshake', BookOpen: 'book-open', GraduationCap: 'graduation-cap', ShieldCheck: 'shield-check', Sparkles: 'sparkles', FolderKanban: 'folder-kanban' }
  const platformIcon = (name, size) => icon(PLATFORM_ICONS[name] || 'layers', size || 16)

  /* ---------- session ---------- */
  const session = {
    get loggedIn() { return localStorage.getItem('sep-login') === '1' },
    get roleKey() {
      const k = localStorage.getItem('sep-role')
      return S.roleProfiles.some((r) => r.key === k) ? k : 'teacher'
    },
    get role() { return S.roleProfiles.find((r) => r.key === this.roleKey) || S.roleProfiles[0] },
    login(roleKey) { localStorage.setItem('sep-role', roleKey || this.roleKey); localStorage.setItem('sep-login', '1') },
    switchRole(k) { localStorage.setItem('sep-role', k); location.reload() },
    logout() { localStorage.removeItem('sep-login'); location.href = 'login.html' },
  }

  /* ---------- url helpers ---------- */
  const param = (k, dft) => new URLSearchParams(location.search).get(k) ?? dft
  // 模块 -> 专用静态页映射（对应 DemoDispatcher 的 DEMO_MAP）
  const MODULE_PAGES = {
    'course/course-build': 'course-manage.html',
    'course/teaching': 'course-picker.html?fn=teach',
    'course/learning': 'course-picker.html?fn=learning',
    'course/classroom': 'screencast.html?m=classroom',
    'course/graph-build': 'graph.html',
    'course/ai-workbench': 'ai-workbench.html',
    'exam/online-exam': 'exam-manage.html',
    'ai/agents': 'ai-agents.html',
    'ai/knowledge': 'knowledge-base.html',
  }
  function moduleUrl(p, m) {
    return MODULE_PAGES[`${p}/${m}`] || `module.html?p=${p}&m=${m}`
  }
  const overviewUrl = (p) => `platform.html?p=${p}`

  /* ---------- toast ---------- */
  function toast(text, ms) {
    let wrap = $('.toast-wrap')
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap) }
    const el = document.createElement('div')
    el.className = 'toast'
    el.innerHTML = icon('check-circle', 14) + `<span></span>`
    el.querySelector('span').textContent = text
    wrap.appendChild(el)
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260) }, ms || 2200)
  }

  /* ---------- modal ---------- */
  function openModal(id) { const m = typeof id === 'string' ? $('#' + id) : id; if (m) m.classList.add('show') }
  function closeModal(el) {
    const m = typeof el === 'string' ? $(el) : el
    const mask = m && (m.classList.contains('modal-mask') ? m : m.closest('.modal-mask'))
    if (mask) mask.classList.remove('show')
  }
  document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-mask')) e.target.classList.remove('show')
    const c = e.target.closest('[data-close-modal]')
    if (c) closeModal(c)
  })

  /* ---------- brand ---------- */
  function brandHTML(opts) {
    const o = opts || {}
    return `<div class="brand${o.large ? ' large' : ''}${o.invert ? ' invert' : ''}">
      <div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none">
        <path d="M20 7.5 33 14 20 20.5 7 14 20 7.5Z"/><path d="M20 15.6 33 22.1 20 28.6 7 22.1 20 15.6Z"/><path d="M20 23.2 33 29.7 20 36.2 7 29.7 20 23.2Z"/>
      </svg></div>
      <div class="brand-text"><div class="brand-name"><strong>智能化教管</strong><strong>一体化平台</strong></div>${o.sub === false ? '' : '<span class="brand-sub">SMART EDUCATION PLATFORM</span>'}</div>
    </div>`
  }

  /* ---------- search ---------- */
  function searchModules(q) {
    q = q.trim().toLowerCase()
    if (!q) return []
    const out = []
    for (const p of S.platforms) {
      for (const m of p.modules) {
        if (`${m.name}${m.summary}${m.features.join('')}`.toLowerCase().includes(q)) {
          out.push({ title: m.name, sub: `${p.code} ${p.shortName} · ${m.count ?? '待细分'} 条功能`, url: moduleUrl(p.key, m.id), tone: p.accent })
        }
        if (out.length >= 10) break
      }
      if (out.length >= 10) break
    }
    return out
  }

  /* ---------- sidebar ---------- */
  function sidebarHTML(platformKey, activeModule) {
    const p = platformKey && S.platformMap[platformKey]
    let nav = ''
    if (p) {
      const groups = []
      for (const m of p.modules) {
        const g = m.group || '平台模块'
        let grp = groups.find((x) => x.name === g)
        if (!grp) { grp = { name: g, items: [] }; groups.push(grp) }
        grp.items.push(m)
      }
      nav += `<a href="${overviewUrl(p.key)}" class="nav-item${!activeModule ? ' active' : ''}">${icon('layout-grid', 15)}平台概览<span class="nav-count">${p.modules.length}</span></a>`
      for (const g of groups) {
        nav += `<div class="nav-group-label">${g.name}</div>`
        for (const m of g.items) {
          nav += `<a href="${moduleUrl(p.key, m.id)}" class="nav-item${activeModule === m.id ? ' active' : ''}">${icon('chevron-right', 13)}${m.name}<span class="nav-count">${m.count ?? '—'}</span></a>`
        }
      }
      nav += `<div class="divider"></div><a href="portal.html" class="nav-item">${icon('house', 15)}返回首页</a>`
      return `<div class="side-platform"><small>PLATFORM ${p.code}</small><strong>${p.name}</strong><p>${p.tagline}</p></div><nav>${nav}</nav>`
    }
    const page = document.body.dataset.page || ''
    const item = (href, ic, label, key, count) =>
      `<a href="${href}" class="nav-item${page === key ? ' active' : ''}">${icon(ic, 15)}${label}${count ? `<span class="nav-count">${count}</span>` : ''}</a>`
    nav += item('portal.html', 'house', '我的工作台', 'portal')
    nav += item('apps.html', 'layout-grid', '应用中心', 'apps')
    nav += item('space.html', 'user-round', '个人空间', 'space')
    nav += item('messages.html', 'bell', '消息与待办', 'messages')
    nav += `<div class="nav-group-label">业务平台</div>`
    for (const pl of S.platforms) {
      nav += `<a href="${overviewUrl(pl.key)}" class="nav-item">${platformIcon(pl.icon, 15)}${pl.shortName}<span class="nav-count">${pl.modules.length}</span></a>`
    }
    nav += `<div class="nav-group-label">数据与运营</div>`
    nav += item('screen.html', 'monitor-play', '数据大屏', 'screen')
    nav += item(moduleUrl('base', 'monitor'), 'shield-check', '运行监控')
    return `<nav>${nav}</nav>`
  }

  /* ---------- shell ---------- */
  function buildShell() {
    const body = document.body
    if (body.dataset.standalone !== undefined) return // 独立页（登录/大屏）
    if (!session.loggedIn) {
      const back = encodeURIComponent(location.pathname.split('/').pop() + location.search)
      location.href = `login.html?redirect=${back}`
      return
    }
    const pKey = body.dataset.platform
    const activeModule = body.dataset.module
    const role = session.role

    const header = document.createElement('header')
    header.className = 'topbar'
    header.innerHTML = `
      <div class="topbar-brand"><a href="portal.html" aria-label="返回首页">${brandHTML()}</a></div>
      <nav class="topbar-nav">
        <a href="portal.html" data-nav="portal">${icon('house', 15)}首页</a>
        <a href="screen.html" data-nav="screen">${icon('monitor-play', 15)}数据大屏</a>
        <a href="apps.html" data-nav="apps">${icon('layout-grid', 15)}应用中心</a>
      </nav>
      <div class="topbar-spacer"></div>
      <div class="search-wrap">
        <button class="search-trigger" id="searchTrigger">${icon('search', 15)}<span>搜索应用、模块、功能…</span><kbd>⌘ K</kbd></button>
        <div class="search-pop" id="searchPop" hidden>
          <div class="search-box">${icon('search', 16)}<input id="searchInput" placeholder="输入模块或功能名称，如“知识图谱”“监考”"></div>
          <div class="search-results" id="searchResults" hidden></div>
          <div class="search-quick" id="searchQuick">
            <div class="quick-label">平台入口</div>
            <div class="quick-grid">${S.platforms.map((p) => `
              <a class="quick-item" href="${overviewUrl(p.key)}">
                <span class="quick-icon" style="color:${p.accent};background:${p.accent}14">${platformIcon(p.icon, 15)}</span>
                <span><strong>${p.shortName}</strong><small>${p.modules.length} 个模块</small></span>
              </a>`).join('')}</div>
            <div class="quick-stats"><span>${S.platforms.length} 个平台</span><span>${S.totalModules} 个一级模块</span><span>${S.totalFeatures} 条功能</span></div>
          </div>
        </div>
      </div>
      <div class="topbar-actions">
        <a href="messages.html" class="icon-btn" aria-label="消息中心">${icon('bell', 17)}<span class="badge">3</span></a>
        <div class="profile-wrap">
          <button class="profile-trigger" id="profileTrigger">
            <span class="avatar" style="background:${role.color}">${role.avatarText}</span>
            <span class="profile-meta"><strong>${role.name}</strong><span>${role.scope}</span></span>
            ${icon('chevron-down', 14)}
          </button>
          <div class="profile-pop" id="profilePop" hidden>
            <div class="profile-card">
              <span class="avatar" style="background:${role.color}">${role.avatarText}</span>
              <div><strong>${role.name}</strong><small>${role.org}</small></div>
            </div>
            <div class="pop-divider"></div>
            <button class="pop-item" id="roleToggle">${icon('user-round', 15)}切换角色${icon('chevron-right', 14, ).replace('style="', 'class="pop-arrow" style="')}</button>
            <div class="role-list" id="roleList" hidden>${S.roleProfiles.map((r) => `
              <button class="role-item${r.key === session.roleKey ? ' active' : ''}" data-role="${r.key}">
                <span class="avatar small" style="background:${r.color}">${r.avatarText}</span>
                <span><strong>${r.scope}</strong><small>${r.org}</small></span>
              </button>`).join('')}</div>
            <a class="pop-item" href="space.html">${icon('layout-grid', 15)}个人空间</a>
            <a class="pop-item" href="${overviewUrl('base')}">${icon('shield-check', 15)}管理后台</a>
            <div class="pop-divider"></div>
            <button class="pop-item danger" id="logoutBtn">${icon('log-out', 15)}退出登录</button>
          </div>
        </div>
      </div>`

    const aside = document.createElement('aside')
    aside.className = 'sidebar'
    aside.innerHTML = sidebarHTML(pKey, activeModule) +
      `<div class="side-footer"><div class="side-foot-note"><span class="dot" style="background:#0f9d8f;margin-top:5px"></span><span>统一身份在线 · 网关正常<br>今日调用 246 万次 · 可用性 99.9%</span></div></div>`

    const main = $('.content', body) || $('main', body)
    const shell = document.createElement('div')
    shell.className = 'shell'
    body.insertBefore(shell, body.firstChild)
    shell.appendChild(header)
    shell.appendChild(aside)
    if (main) shell.appendChild(main)

    // 顶栏 nav 高亮
    const page = body.dataset.page
    if (page) $$('[data-nav]', header).forEach((a) => a.classList.toggle('active', a.dataset.nav === page))

    // 搜索交互
    const trigger = $('#searchTrigger', header), pop = $('#searchPop', header)
    const input = $('#searchInput', header), results = $('#searchResults', header), quick = $('#searchQuick', header)
    trigger.addEventListener('click', () => {
      const willOpen = pop.hidden
      pop.hidden = !willOpen
      trigger.classList.toggle('focused', willOpen)
      if (willOpen) setTimeout(() => input.focus(), 40)
    })
    input.addEventListener('input', () => {
      const list = searchModules(input.value)
      const has = !!input.value.trim()
      results.hidden = !has
      quick.hidden = has
      if (has) {
        results.innerHTML = list.length
          ? list.map((r) => `<a class="search-result" href="${r.url}"><span class="result-dot" style="background:${r.tone}"></span><span class="result-main"><strong>${r.title}</strong><small>${r.sub}</small></span>${icon('arrow-up-right', 14)}</a>`).join('')
          : `<div class="empty">没有匹配的模块，试试“课程”“考试”“AI”</div>`
      }
    })
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pop.hidden = true; trigger.classList.remove('focused') } })

    // 个人菜单
    const pTrigger = $('#profileTrigger', header), pPop = $('#profilePop', header), roleList = $('#roleList', header)
    pTrigger.addEventListener('click', () => { pPop.hidden = !pPop.hidden })
    $('#roleToggle', header).addEventListener('click', () => { roleList.hidden = !roleList.hidden })
    $$('.role-item', header).forEach((b) => b.addEventListener('click', () => session.switchRole(b.dataset.role)))
    $('#logoutBtn', header).addEventListener('click', () => session.logout())

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-wrap')) pPop.hidden = true
      if (!e.target.closest('.search-wrap')) { pop.hidden = true; trigger.classList.remove('focused') }
    })

    buildAiDock()
  }

  /* ---------- ai dock ---------- */
  const AI_ANSWERS = [
    '已为《数字影像创作》第 5 章生成 3 个课堂活动建议：情境导入 8 分钟、分组镜头语言拆解 15 分钟、随堂图谱测验 10 分钟。',
    '根据课程知识图谱与题库，可生成 10 道覆盖「叙事结构 / 镜头语言 / 色彩情绪」三个知识点的练习题，难度分布为 3:5:2。',
    '23 级视觉传达 2 班近 3 天有 12 名学生未完成章节任务，主要集中在「版式网格」节点；建议推送图谱微课并生成督学提醒。',
    '本周教学周报已生成：课程平均完成率 82.6%，AI 调用 1,240 次，知识图谱覆盖度提升 4.8%，已同步至个人空间。',
  ]
  function buildAiDock() {
    if (document.body.dataset.noDock !== undefined) return
    const prompts = S.portal.aiPrompts.slice(0, 3)
    const dock = document.createElement('div')
    dock.className = 'ai-dock'
    dock.innerHTML = `
      <div class="ai-panel" id="aiPanel" hidden>
        <div class="ai-head">
          <span class="ai-logo">${icon('sparkles', 16)}</span>
          <div class="ai-title"><strong>校园智能助手</strong><small>AI 能力中心 · 权限继承模式</small></div>
          <button class="ai-close" id="aiClose">${icon('x', 15)}</button>
        </div>
        <div class="ai-body" id="aiBody"></div>
        <div class="ai-prompts">${prompts.map((p) => `<button data-p="${p}">${p}</button>`).join('')}</div>
        <div class="ai-input"><input id="aiInput" placeholder="向助手提问，如“生成第 5 章测验”"><button class="send-btn" id="aiSend">${icon('send', 15)}</button></div>
        <div class="ai-foot">回答由 AI 生成 · 重要决策请结合业务数据核实</div>
      </div>
      <button class="ai-fab" id="aiFab">${icon('sparkles', 19)}<span class="fab-label">AI 助手</span></button>`
    document.body.appendChild(dock)

    const panel = $('#aiPanel', dock), fab = $('#aiFab', dock), body = $('#aiBody', dock), input = $('#aiInput', dock)
    let userCount = 0, sending = false
    const scrollEnd = () => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' })
    const addMsg = (role, text, refs) => {
      const div = document.createElement('div')
      div.className = `msg ${role}`
      div.innerHTML = `<span class="msg-avatar">${icon(role === 'assistant' ? 'bot' : 'user-round', 14)}</span>
        <div class="msg-content"><div class="bubble"></div>${refs ? `<div class="msg-refs">${refs.map((r) => `<span class="tag gray">${r}</span>`).join('')}</div>` : ''}</div>`
      div.querySelector('.bubble').textContent = text
      body.appendChild(div)
      scrollEnd()
    }
    addMsg('assistant', '你好，我是嵌入首页的校园智能助手。我可以基于你有权限的课程、图谱、题库与教学数据回答问题。', ['权限继承：仅检索当前角色可见范围'])
    const send = (text) => {
      const content = (text ?? input.value).trim()
      if (!content || sending) return
      addMsg('user', content)
      input.value = ''
      sending = true
      const typing = document.createElement('div')
      typing.className = 'msg assistant'
      typing.innerHTML = `<span class="msg-avatar">${icon('bot', 14)}</span><div class="bubble typing"><i></i><i></i><i></i></div>`
      body.appendChild(typing); scrollEnd()
      setTimeout(() => {
        typing.remove()
        addMsg('assistant', AI_ANSWERS[userCount % AI_ANSWERS.length], ['AI 能力中心 · 知识库权限过滤', '引用来源：课程图谱 v2.3'])
        userCount++; sending = false
      }, 700)
    }
    const toggle = (open) => {
      panel.hidden = !open
      fab.classList.toggle('open', open)
      fab.innerHTML = open ? icon('x', 19) : icon('sparkles', 19) + '<span class="fab-label">AI 助手</span>'
      if (open) scrollEnd()
    }
    fab.addEventListener('click', () => toggle(panel.hidden))
    $('#aiClose', dock).addEventListener('click', () => toggle(false))
    $('#aiSend', dock).addEventListener('click', () => send())
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send() })
    $$('.ai-prompts button', dock).forEach((b) => b.addEventListener('click', () => send(b.dataset.p)))
  }

  /* ---------- chart helper ---------- */
  function chart(el, option, height) {
    if (typeof el === 'string') el = $(el)
    if (!el || !window.echarts) return null
    if (height) el.style.height = height
    const c = echarts.init(el, undefined, { renderer: 'canvas' })
    c.setOption(option)
    new ResizeObserver(() => c.resize()).observe(el)
    return c
  }

  /* ---------- misc ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const findCourse = (id) => S.courseList.find((c) => c.id === id) || S.courseList[0]
  const findAgent = (id) => S.agentList.find((a) => a.id === id)

  window.UI = {
    $, $$, icon, platformIcon, session, param, moduleUrl, overviewUrl,
    toast, openModal, closeModal, brandHTML, chart, esc, findCourse, findAgent,
    searchModules,
  }
  window.icon = icon

  document.addEventListener('DOMContentLoaded', buildShell)
})()
