// ============ 智慧课堂 - 通用工具 ============

// 路径适配：根目录页面(index/login)与 pages/ 子目录页面自动适配
const IS_ROOT = !window.location.pathname.includes('/pages/');
function rootLink(page) { return IS_ROOT ? page + '.html' : '../' + page + '.html'; }
function subLink(page) { return IS_ROOT ? 'pages/' + page + '.html' : page + '.html'; }

// 认证相关
const Auth = {
  login(username, password) {
    // 演示用固定账号，实际环境应对接后端
    if (username === 'root' && password === 'root') {
      const userInfo = {
        username: username,
        displayName: '管理员',
        role: '系统管理员',
        avatar: '管',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('smart_class_user', JSON.stringify(userInfo));
      return true;
    }
    return false;
  },
  getUser() {
    const user = localStorage.getItem('smart_class_user');
    return user ? JSON.parse(user) : null;
  },
  logout() {
    localStorage.removeItem('smart_class_user');
    window.location.href = rootLink('login');
  },
  isLoggedIn() {
    return this.getUser() !== null;
  },
  guard() {
    if (!this.isLoggedIn()) {
      window.location.href = rootLink('login');
    }
  }
};

// ============ Toast 提示 ============
const Toast = {
  show(message, type = 'info', duration = 2500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

// ============ Modal 模态框 ============
const Modal = {
  open(content, title = '提示', options = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">${content}</div>
        ${options.footer !== false ? `
        <div class="modal-footer">
          <button class="btn btn-outline modal-cancel">取消</button>
          <button class="btn btn-primary modal-confirm">确定</button>
        </div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    if (overlay.querySelector('.modal-cancel')) {
      overlay.querySelector('.modal-cancel').onclick = () => overlay.remove();
    }
    return overlay;
  },
  confirm(message, title = '确认操作') {
    return new Promise((resolve) => {
      const overlay = this.open(
        `<p style="margin:0;">${message}</p>`,
        title
      );
      overlay.querySelector('.modal-confirm').onclick = () => {
        overlay.remove();
        resolve(true);
      };
      overlay.querySelector('.modal-cancel').onclick = () => {
        overlay.remove();
        resolve(false);
      };
    });
  }
};

// ============ 侧边栏导航 ============
function renderSidebar(activePage) {
  const user = Auth.getUser();
  const sidebarHTML = `
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">智</div>
        <div class="sidebar-title">
          智慧课堂
          <small>Smart Classroom</small>
        </div>
      </div>
      <div class="sidebar-nav">
        <div class="nav-section">工作台</div>
        <a href="${rootLink('index')}" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <span>首页仪表板</span>
        </a>

        <div class="nav-section">课堂分析</div>
        <a href="${subLink('timeline')}" class="nav-item ${activePage === 'timeline' ? 'active' : ''}">
          <span>课堂活动时间轴</span>
        </a>
        <a href="${subLink('coverage')}" class="nav-item ${activePage === 'coverage' ? 'active' : ''}">
          <span>授课计划与知识覆盖</span>
        </a>
        <a href="${subLink('resources')}" class="nav-item ${activePage === 'resources' ? 'active' : ''}">
          <span>录播资源管理</span>
        </a>
        <a href="${subLink('evaluation')}" class="nav-item ${activePage === 'evaluation' ? 'active' : ''}">
          <span>督导评价</span>
        </a>

        <div class="nav-section">教学资源</div>
        <a href="${subLink('placeholder1')}" class="nav-item">
          <span>资源库</span>
        </a>
        <a href="${subLink('placeholder1')}" class="nav-item">
          <span>课程管理</span>
        </a>
        <a href="${subLink('placeholder1')}" class="nav-item">
          <span>知识图谱</span>
        </a>

        <div class="nav-section">数据中心</div>
        <a href="${subLink('placeholder2')}" class="nav-item">
          <span>学情分析</span>
        </a>
        <a href="${subLink('placeholder2')}" class="nav-item">
          <span>成绩分析</span>
        </a>
        <a href="${subLink('placeholder2')}" class="nav-item">
          <span>教学报表</span>
        </a>

        <div class="nav-section">管理中心</div>
        <a href="${subLink('placeholder3')}" class="nav-item">
          <span>教师发展</span>
        </a>
        <a href="${subLink('placeholder4')}" class="nav-item">
          <span>智慧教室</span>
        </a>
        <a href="${subLink('placeholder4')}" class="nav-item">
          <span>系统设置</span>
        </a>
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">${user ? user.avatar : 'A'}</div>
          <div class="sidebar-user-info">
            <div class="name">${user ? user.displayName : '管理员'}</div>
            <div class="role">${user ? user.role : '系统管理员'}</div>
          </div>
          <a href="javascript:void(0)" style="color:rgba(255,255,255,0.5);font-size:12px;" onclick="Auth.logout()">退出</a>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// ============ 顶栏按钮（文本版） ============
function renderTopbarActions() {
  const els = document.querySelectorAll('[data-topbar-actions]');
  els.forEach(el => {
    el.innerHTML = `
      <button class="topbar-text-btn" onclick="Toast.info('您有3条未读消息')">消息<span class="badge-dot"></span></button>
      <button class="topbar-text-btn" onclick="Toast.info('打开帮助中心')">帮助</button>
      <button class="topbar-text-btn" onclick="toggleFullscreen()">全屏</button>
      <button class="topbar-text-btn" onclick="location.reload()">刷新</button>
    `;
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// ============ 格式化时间 ============
function formatTime(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============ 本地存储封装 ============
const Store = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) { return defaultValue; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// ============ 真实文件下载（触发浏览器下载窗口） ============
function downloadFile(filename, content, mimeType) {
  const blob = new Blob(['\ufeff' + content], { type: (mimeType || 'text/html') + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// 生成带样式的可下载报告HTML（浏览器打开即可查看/打印为PDF）
function buildReportHtml(title, subtitle, sections) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  const sectionHtml = buildReportSections(sections);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
${reportStyles}
</style>
</head>
<body>
<h1>${title}</h1>
<div class="sub">${subtitle}</div>
<div class="meta">智慧课堂平台生成 · 生成时间：${timeStr}</div>
${sectionHtml}
<div class="footer">本报告由智慧课堂平台自动生成</div>
</body>
</html>`;
}

// 报告正文区块（PDF与HTML共用）
function buildReportSections(sections) {
  return sections.map(sec => `
    <div class="sec">
      <h2>${sec.title}</h2>
      ${sec.desc ? `<p class="desc">${sec.desc}</p>` : ''}
      ${sec.table ? `
      <table>
        <thead><tr>${sec.table.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${sec.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>` : ''}
      ${sec.text ? `<div class="text">${sec.text}</div>` : ''}
    </div>
  `).join('');
}

// 报告样式（PDF与HTML共用）
const reportStyles = `
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color:#1a1a2e; margin:0; line-height:1.8; font-size:14px; }
  h1 { text-align:center; font-size:24px; margin:0 0 6px; color:#1e6fd9; }
  .sub { text-align:center; color:#6b7280; font-size:13px; margin-bottom:8px; }
  .meta { text-align:center; color:#9ca3af; font-size:12px; border-bottom:2px solid #1e6fd9; padding-bottom:14px; margin-bottom:24px; }
  .sec { margin-bottom:28px; }
  .sec h2 { font-size:16px; color:#1e6fd9; border-left:4px solid #1e6fd9; padding-left:10px; margin:0 0 10px; }
  .desc { color:#6b7280; font-size:13px; margin:0 0 8px; }
  table { width:100%; border-collapse:collapse; margin:10px 0; }
  th, td { border:1px solid #d1d5db; padding:8px 10px; font-size:13px; text-align:left; word-break:break-all; }
  th { background:#f0f6ff; }
  .text { background:#f9fafb; border-radius:6px; padding:14px; font-size:13px; }
  .footer { text-align:center; color:#9ca3af; font-size:12px; margin-top:30px; border-top:1px solid #e5e7eb; padding-top:12px; }
`;

// ============ 真实PDF下载（html2pdf.js 渲染，失败时回退为HTML下载） ============
async function downloadPdf(filename, title, subtitle, sections) {
  const htmlFallback = buildReportHtml(title, subtitle, sections);
  if (typeof html2pdf === 'undefined') {
    // CDN 未加载成功：回退下载HTML版（浏览器打开可直接打印为PDF）
    downloadFile(filename.replace(/\.pdf$/i, '.html'), htmlFallback);
    Toast.warning('PDF组件加载失败，已下载HTML版报告（浏览器打开后可打印为PDF）');
    return;
  }
  Toast.info('正在生成PDF文件，请稍候...');
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  // 离屏容器承载报告内容，供 html2canvas 渲染
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;padding:36px 40px;box-sizing:border-box;';
  container.innerHTML = '<style>' + reportStyles + '</style>'
    + '<h1>' + title + '</h1>'
    + '<div class="sub">' + subtitle + '</div>'
    + '<div class="meta">智慧课堂平台生成 · 生成时间：' + timeStr + '</div>'
    + buildReportSections(sections)
    + '<div class="footer">本报告由智慧课堂平台自动生成</div>';
  document.body.appendChild(container);
  try {
    await html2pdf().set({
      margin: [8, 0, 8, 0],
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(container).save();
    Toast.success('《' + title + '》PDF已开始下载');
  } catch (e) {
    downloadFile(filename.replace(/\.pdf$/i, '.html'), htmlFallback);
    Toast.warning('PDF生成失败，已下载HTML版报告');
  } finally {
    container.remove();
  }
}

// 初始化：检查登录状态 + 渲染顶栏按钮
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (!path.includes('login.html')) {
    Auth.guard();
  }
  renderTopbarActions();
});
