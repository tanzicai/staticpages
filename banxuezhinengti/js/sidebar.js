// ===== 左侧知识树渲染（玻璃拟态风格） =====

function renderSidebar() {
  const tree = document.getElementById('knowledgeTree');
  tree.innerHTML = '';

  KNOWLEDGE_TREE.forEach(folder => {
    const li = document.createElement('li');
    li.className = `tree-folder ${folder.color} open`;

    // 文件夹头部 - 用SVG图标替代emoji
    const header = document.createElement('div');
    header.className = 'folder-header open';

    const folderIconSVG = getFolderIcon(folder.id);
    header.innerHTML = `
      <div class="folder-icon-wrap">${folderIconSVG}</div>
      <span class="folder-name">${folder.name}</span>
      <span class="folder-arrow">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </span>
    `;

    header.addEventListener('click', () => {
      li.classList.toggle('open');
      header.classList.toggle('open');
    });

    li.appendChild(header);

    // 子节点
    const childrenUl = document.createElement('ul');
    childrenUl.className = 'tree-children';

    folder.children.forEach(node => {
      const scene = SCENES[node.sceneId];
      if (!scene) return;

      const isCompleted = gameState.completedScenes.includes(node.sceneId);
      const isActive = gameState.currentScene === node.sceneId;
      const isLocked = !canAccessScene(node.sceneId);

      const nodeLi = document.createElement('li');
      nodeLi.className = `tree-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`;

      let statusIcon = '';
      if (isCompleted) statusIcon = '✓';
      else if (isLocked) statusIcon = '🔒';
      else statusIcon = '·';

      const sceneIcon = scene.icon || '📄';

      nodeLi.innerHTML = `
        <span class="node-icon">${sceneIcon}</span>
        <span class="node-name">${node.name}</span>
        <span class="node-status">${statusIcon}</span>
      `;

      if (!isLocked) {
        nodeLi.addEventListener('click', () => selectScene(node.sceneId));
      }

      childrenUl.appendChild(nodeLi);
    });

    li.appendChild(childrenUl);
    tree.appendChild(li);
  });

  renderAIPanel();
}

function getFolderIcon(folderId) {
  const icons = {
    'lp': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h4l2-2h6l2 2h2v12H4z"/><circle cx="12" cy="13" r="3"/></svg>',
    'tp': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18M3 12h18M3 17h18"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="17" cy="17" r="1.5" fill="currentColor"/></svg>',
    'ip': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    'dp': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M5 7v3l7 2 7-2V7M5 17v-3l7-2 7 2v3"/></svg>',
    'inv': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>',
  };
  return icons[folderId] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h13l5 5v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>';
}

function renderAIPanel() {
  const panel = document.getElementById('aiPanelBody');
  const weakKps = Object.entries(gameState.wrongKnowledge)
    .sort((a, b) => b[1] - a[1]);

  if (weakKps.length === 0) {
    panel.innerHTML = `
      <div class="ai-empty">
        <div class="ai-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m8.48 8.48 2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m8.48-8.48 2.83-2.83"/>
          </svg>
        </div>
        <p>完成关卡后自动分析</p>
      </div>`;
    return;
  }

  let html = `<div style="margin-bottom:10px;font-size:11px;color:var(--text-3);letter-spacing:1px;">检测到薄弱知识点：</div>`;
  weakKps.slice(0, 5).forEach(([kp, count]) => {
    const severity = count >= 2 ? '' : 'warn';
    html += `<span class="weak-tag ${severity}">${kp} ×${count}</span>`;
  });

  panel.innerHTML = html;
}