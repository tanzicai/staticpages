// ===== 地图渲染与交互（玻璃拟态 + 菜单统一风格） =====

function renderMap() {
  const svg = document.getElementById('mapSvg');
  const pathsGroup = document.getElementById('mapPaths');
  const nodesGroup = document.getElementById('mapNodes');

  pathsGroup.innerHTML = '';
  nodesGroup.innerHTML = '';

  // ---- 绘制路径 ----
  MAP_PATHS.forEach(p => {
    const fromScene = SCENES[p.from];
    const toScene = SCENES[p.to];
    if (!fromScene || !toScene) return;

    const isCompleted = gameState.completedScenes.includes(p.from) &&
                        gameState.completedScenes.includes(p.to);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', fromScene.mapPosition.x);
    line.setAttribute('y1', fromScene.mapPosition.y);
    line.setAttribute('x2', toScene.mapPosition.x);
    line.setAttribute('y2', toScene.mapPosition.y);
    line.setAttribute('class', 'map-path' + (isCompleted ? ' completed' : ''));
    pathsGroup.appendChild(line);
  });

  // ---- 绘制节点 ----
  Object.values(SCENES).forEach(scene => {
    const pos = scene.mapPosition;
    const isCompleted = gameState.completedScenes.includes(scene.id);
    const isCurrent = gameState.currentScene === scene.id;
    const isLocked = !isCompleted && !canAccessScene(scene.id);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'map-node' +
      (isCompleted ? ' completed' : '') +
      (isCurrent ? ' active' : '') +
      (isLocked ? ' locked' : ''));
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    g.dataset.sceneId = scene.id;

    // ---- 外圈光晕 ----
    const glowR = isCompleted ? 36 : (isCurrent ? 40 : 30);
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('r', glowR);
    if (isLocked) {
      glow.setAttribute('fill', 'url(#nodeGlow)');
      glow.setAttribute('opacity', '0.12');
    } else if (isCompleted) {
      glow.setAttribute('fill', 'url(#nodeGlow)');
      glow.setAttribute('opacity', '0.5');
    } else if (isCurrent) {
      glow.setAttribute('fill', 'url(#nodeGlowActive)');
      glow.setAttribute('opacity', '0.7');
    } else {
      glow.setAttribute('fill', 'url(#nodeGlow)');
      glow.setAttribute('opacity', '0.3');
    }
    glow.setAttribute('class', 'node-glow');
    g.appendChild(glow);

    // ---- 主圆（节点卡片风格，和左侧菜单一致）----
    const cardW = 96;
    const cardH = 52;
    const rx = 14;

    // 背景卡片圆角矩形
    const cardBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    cardBg.setAttribute('x', -cardW/2);
    cardBg.setAttribute('y', -cardH/2);
    cardBg.setAttribute('width', cardW);
    cardBg.setAttribute('height', cardH);
    cardBg.setAttribute('rx', rx);
    cardBg.setAttribute('class', 'node-card-bg');

    if (isLocked) {
      cardBg.setAttribute('fill', 'rgba(255,255,255,0.04)');
      cardBg.setAttribute('stroke', 'rgba(255,255,255,0.1)');
    } else if (isCompleted) {
      cardBg.setAttribute('fill', 'rgba(52,211,153,0.1)');
      cardBg.setAttribute('stroke', 'rgba(52,211,153,0.35)');
    } else if (isCurrent) {
      cardBg.setAttribute('fill', 'rgba(167,139,250,0.14)');
      cardBg.setAttribute('stroke', 'rgba(167,139,250,0.5)');
    } else {
      cardBg.setAttribute('fill', 'rgba(255,255,255,0.05)');
      cardBg.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    }
    cardBg.setAttribute('stroke-width', '1.2');
    cardBg.setAttribute('filter', isCurrent ? 'url(#glow)' : (isCompleted ? 'url(#glow)' : ''));
    g.appendChild(cardBg);

    // ---- 左侧色条（和左侧菜单一致）----
    const colorMap = getSceneColor(scene);
    const colorBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    colorBar.setAttribute('x', -cardW/2);
    colorBar.setAttribute('y', -cardH/2);
    colorBar.setAttribute('width', '3.5');
    colorBar.setAttribute('height', cardH);
    colorBar.setAttribute('rx', '1.5');
    colorBar.setAttribute('fill', colorMap.bar);
    g.appendChild(colorBar);

    // ---- 图标区域 ----
    const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    iconGroup.setAttribute('transform', `translate(${-cardW/2 + 16}, 0)`);

    // 图标背景圆
    const iconBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    iconBg.setAttribute('cx', '0');
    iconBg.setAttribute('cy', '0');
    iconBg.setAttribute('r', '14');
    iconBg.setAttribute('fill', colorMap.bg);
    iconGroup.appendChild(iconBg);

    // 图标文字
    const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    iconText.setAttribute('text-anchor', 'middle');
    iconText.setAttribute('y', '5');
    iconText.setAttribute('font-size', '14');
    iconText.textContent = scene.icon;
    iconGroup.appendChild(iconText);

    g.appendChild(iconGroup);

    // ---- 文字区域 ----
    const textX = -cardW/2 + 36;

    // 场景标题
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', textX);
    titleText.setAttribute('y', '-6');
    titleText.setAttribute('font-size', '11');
    titleText.setAttribute('font-weight', '600');
    titleText.setAttribute('font-family', 'Noto Sans SC, sans-serif');
    if (isLocked) {
      titleText.setAttribute('fill', 'rgba(255,255,255,0.3)');
    } else if (isCompleted) {
      titleText.setAttribute('fill', 'rgba(255,255,255,0.9)');
    } else {
      titleText.setAttribute('fill', 'rgba(255,255,255,0.85)');
    }
    // 截断过长标题
    const displayTitle = scene.title.length > 8 ? scene.title.substring(0, 8) + '…' : scene.title;
    titleText.textContent = displayTitle;
    g.appendChild(titleText);

    // 状态/标签文字
    const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statusText.setAttribute('x', textX);
    statusText.setAttribute('y', '10');
    statusText.setAttribute('font-size', '9');
    statusText.setAttribute('font-family', 'Noto Sans SC, sans-serif');

    if (isCompleted) {
      statusText.setAttribute('fill', 'rgba(52,211,153,0.8)');
      statusText.textContent = '✓ 已通关';
    } else if (isLocked) {
      statusText.setAttribute('fill', 'rgba(255,255,255,0.25)');
      statusText.textContent = '🔒 未解锁';
    } else if (isCurrent) {
      statusText.setAttribute('fill', 'rgba(167,139,250,0.8)');
      statusText.textContent = '▶ 当前';
    } else {
      statusText.setAttribute('fill', 'rgba(255,255,255,0.4)');
      statusText.textContent = '点击挑战';
    }
    g.appendChild(statusText);

    // ---- 难度星标 ----
    const diffText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    diffText.setAttribute('x', textX + 50);
    diffText.setAttribute('y', '-6');
    diffText.setAttribute('font-size', '8');
    diffText.setAttribute('fill', 'rgba(251,191,36,0.6)');
    diffText.textContent = '★'.repeat(scene.difficulty.length / 2);
    g.appendChild(diffText);

    // ---- 点击交互 ----
    if (!isLocked) {
      g.addEventListener('click', () => selectScene(scene.id));
    }

    // hover 效果
    g.addEventListener('mouseenter', () => {
      if (!isLocked) {
        cardBg.setAttribute('stroke-width', '2');
        if (!isCompleted && !isCurrent) {
          cardBg.setAttribute('stroke', 'rgba(167,139,250,0.35)');
        }
      }
    });
    g.addEventListener('mouseleave', () => {
      cardBg.setAttribute('stroke-width', '1.2');
    });

    nodesGroup.appendChild(g);
  });

  updateSceneCard();
}

// 获取场景对应的颜色（与左侧菜单一致）
function getSceneColor(scene) {
  const tag = scene.tag || '';
  if (tag.includes('线性')) return { bar: '#60a5fa', bg: 'rgba(96,165,250,0.15)' };
  if (tag.includes('运输')) return { bar: '#34d399', bg: 'rgba(52,211,153,0.15)' };
  if (tag.includes('整数')) return { bar: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
  if (tag.includes('动态')) return { bar: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
  if (tag.includes('库存')) return { bar: '#22d3ee', bg: 'rgba(34,211,238,0.15)' };
  if (tag.includes('排队')) return { bar: '#f87171', bg: 'rgba(248,113,113,0.15)' };
  return { bar: '#a78bfa', bg: 'rgba(167,139,250,0.12)' };
}

function canAccessScene(sceneId) {
  if (sceneId === 'scene-1') return true;
  const deps = getSceneDependencies(sceneId);
  return deps.every(d => gameState.completedScenes.includes(d));
}

function getSceneDependencies(sceneId) {
  const deps = [];
  MAP_PATHS.forEach(p => {
    if (p.to === sceneId) deps.push(p.from);
  });
  return deps;
}

function updateSceneCard() {
  const card = document.getElementById('sceneCard');
  const btn = document.getElementById('btnEnter');
  const icon = document.getElementById('sceneCardIcon');
  const title = document.getElementById('sceneCardTitle');
  const desc = document.getElementById('sceneCardDesc');
  const eyebrow = document.getElementById('sceneCardEyebrow');
  const meta = document.getElementById('sceneCardMeta');

  if (!gameState.currentScene) {
    icon.textContent = '🗺️';
    eyebrow.textContent = 'READY';
    title.textContent = '选择关卡开始冒险';
    desc.textContent = '点击地图上的节点或左侧知识树中的文件夹，开始你的物流运筹学闯关之旅！';
    btn.disabled = true;
    btn.querySelector('span').textContent = '选择关卡';
    meta.innerHTML = '';
    return;
  }

  const scene = SCENES[gameState.currentScene];
  const isCompleted = gameState.completedScenes.includes(scene.id);
  const isLocked = !canAccessScene(scene.id);

  icon.textContent = scene.icon;
  eyebrow.textContent = scene.tag.toUpperCase();
  title.textContent = scene.title;
  desc.textContent = scene.description;
  btn.disabled = isLocked;

  if (isCompleted) {
    btn.querySelector('span').textContent = '再次挑战';
  } else {
    btn.querySelector('span').textContent = '进入关卡';
  }

  meta.innerHTML = `
    <span class="meta-tag">${scene.tag}</span>
    <span class="meta-tag">${scene.difficulty}</span>
    <span class="meta-tag">${isCompleted ? '✓ 已通关' : (isLocked ? '🔒 未解锁' : '⏳ 未挑战')}</span>
  `;
}

function selectScene(sceneId) {
  if (!canAccessScene(sceneId)) {
    showToast('🔒 该关卡尚未解锁，请先完成前置关卡', 'error');
    return;
  }
  gameState.currentScene = sceneId;
  renderMap();
  renderSidebar();
  switchView('question');
  loadQuestion(sceneId);
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}