// ===== 主入口（玻璃拟态风格） =====

function init() {
  loadState();

  // 默认选中
  if (!gameState.currentScene && gameState.completedScenes.length === 0) {
    gameState.currentScene = 'scene-1';
  } else if (gameState.completedScenes.length > 0) {
    gameState.currentScene = gameState.completedScenes[gameState.completedScenes.length - 1];
  }

  renderSidebar();
  renderMap();
  updateProgress();

  if (gameState.currentScene && QUESTIONS[gameState.currentScene]) {
    loadQuestion(gameState.currentScene);
  }

  bindEvents();
}

function updateProgress() {
  const total = Object.keys(SCENES).length;
  const done = gameState.completedScenes.length;
  const pct = Math.round((done / total) * 100);

  const fill = document.getElementById('progressFill');
  const glow = document.getElementById('progressGlow');
  fill.style.width = pct + '%';
  if (glow) glow.style.width = pct + '%';
  document.getElementById('progressText').textContent = `${done} / ${total} 关`;
}

function switchView(viewName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  document.getElementById('viewMap').classList.toggle('hidden', viewName !== 'map');
  document.getElementById('viewQuestion').classList.toggle('hidden', viewName !== 'question');
  document.getElementById('viewReport').classList.toggle('hidden', viewName !== 'report');

  if (viewName === 'report') {
    renderAIReport();
  }
}

function bindEvents() {
  // Tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // 进入关卡
  document.getElementById('btnEnter').addEventListener('click', () => {
    if (gameState.currentScene) {
      switchView('question');
      loadQuestion(gameState.currentScene);
    }
  });

  // 提交答案
  document.getElementById('btnSubmit').addEventListener('click', () => {
    submitAnswer();
    highlightAnswers();
  });

  // 提示
  document.getElementById('btnHint').addEventListener('click', showHint);

  // 弹窗 - 继续闯关
  document.getElementById('btnContinue').addEventListener('click', () => {
    document.getElementById('resultModal').classList.add('hidden');
    switchView('map');
  });

  // 弹窗 - 查看报告
  document.getElementById('btnViewReport').addEventListener('click', () => {
    document.getElementById('resultModal').classList.add('hidden');
    switchView('report');
  });

  // 回车提交
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !document.getElementById('viewQuestion').classList.contains('hidden')) {
      submitAnswer();
      highlightAnswers();
    }
  });

  // 点击弹窗背景关闭
  document.getElementById('resultModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('modal-backdrop')) {
      e.currentTarget.classList.add('hidden');
    }
  });
}

// 启动
document.addEventListener('DOMContentLoaded', init);