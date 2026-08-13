/* ============================================
   主应用 - 路由、布局、页面管理
   ============================================ */

const App = {
  currentPage: 'dashboard',
  currentUser: null,

  init() {
    Store.init();

    const loggedIn = localStorage.getItem('app_logged_in');
    const userData = localStorage.getItem('app_current_user');
    if (loggedIn !== '1' || !userData) {
      window.location.href = 'login.html';
      return;
    }
    this.currentUser = JSON.parse(userData);

    this.bindNavigation();
    this.bindLogout();
    this.renderUserInfo();
    this.navigateTo('dashboard');
  },

  bindNavigation() {
    const topNav = document.getElementById('topNav');
    if (!topNav) return;

    topNav.addEventListener('click', (e) => {
      // 处理 nav-item 点击
      const navItem = e.target.closest('.nav-item');
      if (!navItem) return;

      // 如果点击的是 dropdown 内的 item
      const dropdownItem = e.target.closest('.dropdown-item');
      if (dropdownItem) {
        e.preventDefault();
        e.stopPropagation();
        this.navigateTo(dropdownItem.dataset.page);
        return;
      }

      // 如果 nav-item 有 data-page，直接导航
      if (navItem.dataset.page) {
        this.navigateTo(navItem.dataset.page);
      }
      // 如果有 data-menu，toggle dropdown
      // (hover 已经处理了，但点击也支持)
    });

    // 点击页面其他地方关闭 dropdown
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.has-dropdown')) {
        // dropdown 通过 hover 控制，不需要额外处理
      }
    });
  },

  bindLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('app_logged_in');
        localStorage.removeItem('app_current_user');
        window.location.href = 'login.html';
      });
    }
  },

  renderUserInfo() {
    if (this.currentUser) {
      const avatar = document.getElementById('userAvatar');
      const name = document.getElementById('userName');
      const role = document.getElementById('userRole');
      if (avatar) avatar.textContent = this.currentUser.avatar;
      if (name) name.textContent = this.currentUser.name;
      if (role) role.textContent = this.currentUser.role;
    }
  },

  navigateTo(page) {
    this.currentPage = page;

    // 更新 top nav 激活状态
    document.querySelectorAll('.top-nav .nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) item.classList.add('active');
    });
    // 高亮包含当前页的 dropdown 父级
    document.querySelectorAll('.top-nav .has-dropdown').forEach(item => {
      const hasMatch = item.querySelector(`.dropdown-item[data-page="${page}"]`);
      if (hasMatch) item.classList.add('active');
    });

    const pageNames = {
      dashboard: '课程首页', courses: '课程大纲', courseDesign: '课程设计',
      knowledgeGraph: '知识图谱', problemGraph: '问题图谱',
      ideologyGraph: '课程思政', targetGraph: '课程目标',
      personalGraph: '个性化图谱', microCourse: '微课中心',
      videoResources: '视频资源', digitalHuman: '数字人管理',
      learningAnalysis: '学情分析', learningTasks: '学习任务',
      aiResearch: 'AI科研助手', securityReview: '安全审核',
      mobile: '移动端学习', settings: '平台设置',
    };

    const content = document.getElementById('contentArea');
    const renderer = PageRenderers[page];
    if (renderer) {
      content.innerHTML = renderer();
      const initFn = PageInits[page];
      if (initFn) initFn();
    } else {
      content.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>页面加载失败，请刷新重试</p><p style="font-size:12px;color:var(--text-muted);margin-top:8px">如果问题持续，请联系管理员</p></div>`;
    }
  },

  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  showModal(title, bodyHTML, footerHTML = '', size = '') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal ${size}">
        <div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close">&times;</button></div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    return overlay;
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
  },
};

// 页面渲染器与初始化函数注册
const PageRenderers = {};
const PageInits = {};