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
    const isAttempted = gameState.attemptedScenes.includes(scene.id);
    const isCurrent = gameState.currentScene === scene.id;
    const isLocked = !isCompleted && !isAttempted && !canAccessScene(scene.id);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'map-node' +
      (isCompleted ? ' completed' : '') +
      (isCurrent ? ' active' : '') +
      (isLocked ? ' locked' : '') +
      (isLocked ? '' : ' interactive'));
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    g.dataset.sceneId = scene.id;

    // ---- 外圈光晕（纯CSS动画驱动，JS不动它）----
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('r', isCompleted ? 38 : (isCurrent ? 42 : 32));
    glow.setAttribute('class', 'node-glow' +
      (isLocked ? ' glow-locked' : '') +
      (isCompleted ? ' glow-done' : '') +
      (isCurrent ? ' glow-active' : ''));
    g.appendChild(glow);

    // ---- 卡片主体 ----
    const cardW = 104;
    const cardH = 48;
    const colorMap = getSceneColor(scene);

    const cardBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    cardBg.setAttribute('x', -cardW / 2);
    cardBg.setAttribute('y', -cardH / 2);
    cardBg.setAttribute('width', cardW);
    cardBg.setAttribute('height', cardH);
    cardBg.setAttribute('rx', 12);
    cardBg.setAttribute('class', 'node-card-bg');
    cardBg.setAttribute('data-state',
      isLocked ? 'locked' : (isCompleted ? 'done' : (isCurrent ? 'active' : 'idle')));
    cardBg.setAttribute('fill', colorMap.cardFill);
    cardBg.setAttribute('stroke', colorMap.cardStroke);
    cardBg.setAttribute('stroke-width', isCurrent ? '1.8' : '1');
    g.appendChild(cardBg);

    // ---- 左侧色条 ----
    const colorBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    colorBar.setAttribute('x', -cardW / 2);
    colorBar.setAttribute('y', -cardH / 2 + 4);
    colorBar.setAttribute('width', '3');
    colorBar.setAttribute('height', cardH - 8);
    colorBar.setAttribute('rx', '1.5');
    colorBar.setAttribute('fill', colorMap.bar);
    g.appendChild(colorBar);

    // ---- 图标圆 ----
    const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    iconGroup.setAttribute('transform', `translate(${-cardW / 2 + 16}, 0)`);

    const iconBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    iconBg.setAttribute('cx', '0');
    iconBg.setAttribute('cy', '0');
    iconBg.setAttribute('r', '13');
    iconBg.setAttribute('fill', colorMap.iconBg);
    iconGroup.appendChild(iconBg);

    const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    iconText.setAttribute('text-anchor', 'middle');
    iconText.setAttribute('y', '4.5');
    iconText.setAttribute('font-size', '13');
    iconText.textContent = scene.icon;
    iconGroup.appendChild(iconText);

    g.appendChild(iconGroup);

    // ---- 文字：标题 + 状态（用<foreignObject>支持更好排版）----
    const textX = -cardW / 2 + 34;

    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', textX);
    titleText.setAttribute('y', '-5');
    titleText.setAttribute('font-size', '10.5');
    titleText.setAttribute('font-weight', '600');
    titleText.setAttribute('font-family', 'Noto Sans SC, sans-serif');
    titleText.setAttribute('fill',
      isLocked ? 'rgba(255,255,255,0.28)' :
      (isCompleted ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)'));
    const maxLen = 9;
    titleText.textContent = scene.title.length > maxLen ? scene.title.substring(0, maxLen) + '…' : scene.title;
    g.appendChild(titleText);

    const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statusText.setAttribute('x', textX);
    statusText.setAttribute('y', '11');
    statusText.setAttribute('font-size', '8.5');
    statusText.setAttribute('font-family', 'Noto Sans SC, sans-serif');
    if (isCompleted) {
      statusText.setAttribute('fill', 'rgba(52,211,153,0.85)');
      statusText.textContent = '✓ 已通关';
    } else if (isAttempted) {
      statusText.setAttribute('fill', 'rgba(251,191,36,0.85)');
      statusText.textContent = '◉ 已尝试';
    } else if (isLocked) {
      statusText.setAttribute('fill', 'rgba(255,255,255,0.22)');
      statusText.textContent = '🔒 未解锁';
    } else if (isCurrent) {
      statusText.setAttribute('fill', 'rgba(167,139,250,0.85)');
      statusText.textContent = '▶ 当前';
    } else {
      statusText.setAttribute('fill', 'rgba(255,255,255,0.38)');
      statusText.textContent = '点击挑战';
    }
    g.appendChild(statusText);

    // ---- 难度星标（右上角）----
    const diffText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    diffText.setAttribute('x', cardW / 2 - 8);
    diffText.setAttribute('y', '-5');
    diffText.setAttribute('text-anchor', 'end');
    diffText.setAttribute('font-size', '7.5');
    diffText.setAttribute('fill', 'rgba(251,191,36,0.55)');
    diffText.textContent = '★'.repeat(scene.difficulty.length / 2);
    g.appendChild(diffText);

    // ---- 点击：只绑定点击，hover完全交给CSS ----
    if (!isLocked) {
      g.addEventListener('click', () => selectScene(scene.id));
    }

    nodesGroup.appendChild(g);
  });

  updateSceneCard();
}

// 场景颜色映射（与左侧菜单色条一致）
function getSceneColor(scene) {
  const tag = scene.tag || '';
  if (tag.includes('线性')) {
    return { bar: '#60a5fa', bg: 'rgba(96,165,250,0.15)', iconBg: 'rgba(96,165,250,0.18)',
             cardFill: 'rgba(96,165,250,0.06)', cardStroke: 'rgba(96,165,250,0.22)' };
  }
  if (tag.includes('运输')) {
    return { bar: '#34d399', bg: 'rgba(52,211,153,0.15)', iconBg: 'rgba(52,211,153,0.18)',
             cardFill: 'rgba(52,211,153,0.06)', cardStroke: 'rgba(52,211,153,0.22)' };
  }
  if (tag.includes('整数')) {
    return { bar: '#fbbf24', bg: 'rgba(251,191,36,0.15)', iconBg: 'rgba(251,191,36,0.18)',
             cardFill: 'rgba(251,191,36,0.06)', cardStroke: 'rgba(251,191,36,0.22)' };
  }
  if (tag.includes('动态')) {
    return { bar: '#a78bfa', bg: 'rgba(167,139,250,0.15)', iconBg: 'rgba(167,139,250,0.18)',
             cardFill: 'rgba(167,139,250,0.06)', cardStroke: 'rgba(167,139,250,0.22)' };
  }
  if (tag.includes('库存')) {
    return { bar: '#22d3ee', bg: 'rgba(34,211,238,0.15)', iconBg: 'rgba(34,211,238,0.18)',
             cardFill: 'rgba(34,211,238,0.06)', cardStroke: 'rgba(34,211,238,0.22)' };
  }
  if (tag.includes('排队') || tag.includes('网络')) {
    return { bar: '#f87171', bg: 'rgba(248,113,113,0.15)', iconBg: 'rgba(248,113,113,0.18)',
             cardFill: 'rgba(248,113,113,0.06)', cardStroke: 'rgba(248,113,113,0.22)' };
  }
  return { bar: '#a78bfa', bg: 'rgba(167,139,250,0.12)', iconBg: 'rgba(167,139,250,0.15)',
           cardFill: 'rgba(255,255,255,0.04)', cardStroke: 'rgba(255,255,255,0.14)' };
}

function canAccessScene(sceneId) {
  if (sceneId === 'scene-1') return true;
  const deps = getSceneDependencies(sceneId);
  return deps.every(d => gameState.attemptedScenes.includes(d));
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
  const isAttempted = gameState.attemptedScenes.includes(scene.id);
  const isLocked = !canAccessScene(scene.id);

  icon.textContent = scene.icon;
  eyebrow.textContent = scene.tag.toUpperCase();
  title.textContent = scene.title;
  desc.textContent = scene.description;
  btn.disabled = isLocked;

  if (isCompleted) {
    btn.querySelector('span').textContent = '再次挑战';
  } else if (isAttempted) {
    btn.querySelector('span').textContent = '重新挑战';
  } else {
    btn.querySelector('span').textContent = '进入关卡';
  }

  meta.innerHTML = `
    <span class="meta-tag">${scene.tag}</span>
    <span class="meta-tag">${scene.difficulty}</span>
    <span class="meta-tag">${isCompleted ? '✓ 已通关' : (isAttempted ? '◉ 已尝试' : (isLocked ? '🔒 未解锁' : '⏳ 未挑战'))}</span>
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