// ===== 答题交互（多题闯关 · 玻璃拟态） =====

let currentQuestions = [];   // 当前场景的所有题目
let currentQIndex = 0;       // 当前题号
let currentQuestion = null;   // 当前题对象
let selectedAnswer = null;   // 当前选择
let sceneResults = [];        // 本关答题结果记录

function loadQuestion(sceneId) {
  const qs = QUESTIONS[sceneId];
  if (!qs || qs.length === 0) return;

  currentQuestions = qs;
  currentQIndex = 0;
  sceneResults = [];
  selectedAnswer = null;

  showCurrentQuestion();
  updateQuestionProgress();
}

function showCurrentQuestion() {
  currentQuestion = currentQuestions[currentQIndex];
  selectedAnswer = null;

  // 填充题目信息
  const scene = SCENES[currentQuestion.sceneId || getSceneIdOfQuestion(currentQuestion)];
  document.getElementById('qTag').textContent = scene.tag;
  document.getElementById('qDifficulty').textContent = scene.difficulty;

  // 题目编号 + 标题
  const qNum = currentQIndex + 1;
  const total = currentQuestions.length;
  document.getElementById('qTitle').innerHTML =
    `<span class="q-num">第 ${qNum}/${total} 题</span> · ${currentQuestion.title}`;

  // 场景描述
  document.getElementById('qScene').innerHTML = currentQuestion.scene || '';

  // 题干
  document.getElementById('qBody').textContent = currentQuestion.body;

  // 隐藏提示框
  document.getElementById('hintBox').classList.add('hidden');

  // 渲染选项或输入框
  const optionsContainer = document.getElementById('qOptions');
  optionsContainer.innerHTML = '';

  if (currentQuestion.type === 'choice') {
    currentQuestion.options.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'option-item';
      div.dataset.value = opt.label;
      div.innerHTML = `
        <span class="option-label">${opt.label}</span>
        <span class="option-text">${opt.text}</span>
      `;
      div.addEventListener('click', () => selectOption(div, opt.label));
      optionsContainer.appendChild(div);
    });
  } else if (currentQuestion.type === 'input') {
    const inputWrap = document.createElement('div');
    inputWrap.className = 'input-wrap';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'answer-input';
    input.placeholder = '请输入你的答案...';
    input.id = 'textAnswer';
    inputWrap.appendChild(input);
    optionsContainer.appendChild(inputWrap);
    // 聚焦
    setTimeout(() => input.focus(), 100);
  }

  // 更新按钮文字
  const btn = document.getElementById('btnSubmit');
  if (currentQIndex === currentQuestions.length - 1) {
    btn.querySelector('span').textContent = '提交并通关';
  } else {
    btn.querySelector('span').textContent = '提交并下一题';
  }

  // 滚动到顶部
  const contentArea = document.querySelector('.content-area');
  if (contentArea) contentArea.scrollTop = 0;
}

function getSceneIdOfQuestion(q) {
  // 从 qid 反推：s1-q1 → scene-1
  const m = q.qid.match(/^s(\d+)-/);
  if (m) return 'scene-' + m[1];
  return gameState.currentScene;
}

function selectOption(element, value) {
  document.querySelectorAll('.option-item').forEach(el => {
    el.classList.remove('selected');
  });
  element.classList.add('selected');
  selectedAnswer = value;
}

function showHint() {
  if (!currentQuestion) return;
  const hintBox = document.getElementById('hintBox');
  hintBox.textContent = currentQuestion.hint;
  hintBox.classList.remove('hidden');
}

function submitAnswer() {
  if (!currentQuestion) return;

  let userAnswer;
  if (currentQuestion.type === 'choice') {
    userAnswer = selectedAnswer;
    if (!userAnswer) {
      showToast('请先选择一个答案', 'error');
      return;
    }
  } else {
    userAnswer = document.getElementById('textAnswer').value.trim();
    if (!userAnswer) {
      showToast('请输入你的答案', 'error');
      return;
    }
  }

  const isCorrect = checkAnswer(userAnswer, currentQuestion);

  // 记录
  sceneResults.push({
    qid: currentQuestion.qid,
    correct: isCorrect,
    answer: userAnswer,
    knowledgePoint: currentQuestion.knowledgePoint,
  });

  recordAnswer(currentQuestion, userAnswer, isCorrect);

  // 高亮选项
  highlightAnswers();

  // 反馈弹窗（小）
  showQuestionResult(isCorrect, userAnswer);

  // 禁用提交按钮防重复
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  setTimeout(() => { btn.disabled = false; }, 800);
}

function checkAnswer(userAnswer, question) {
  if (question.type === 'choice') {
    return userAnswer === question.correctAnswer;
  } else {
    const userNum = parseFloat(userAnswer);
    const correctNum = parseFloat(question.correctAnswer);
    const tol = question.tolerance || 0;
    return Math.abs(userNum - correctNum) <= tol;
  }
}

function recordAnswer(question, userAnswer, isCorrect) {
  const kp = question.knowledgePoint;
  const sceneId = question.sceneId || getSceneIdOfQuestion(question);

  if (!gameState.answers[sceneId]) gameState.answers[sceneId] = [];
  gameState.answers[sceneId].push({
    qid: question.qid,
    answer: userAnswer,
    correct: isCorrect,
    time: new Date().toISOString(),
  });

  if (isCorrect) {
    gameState.correctKnowledge[kp] = (gameState.correctKnowledge[kp] || 0) + 1;
  } else {
    gameState.wrongKnowledge[kp] = (gameState.wrongKnowledge[kp] || 0) + 1;
  }

  // 保存到 sceneAnswers
  if (!gameState.sceneAnswers[sceneId]) gameState.sceneAnswers[sceneId] = [];
  gameState.sceneAnswers[sceneId].push({ qid: question.qid, correct: isCorrect });

  saveState();
}

function highlightAnswers() {
  if (!currentQuestion || currentQuestion.type !== 'choice') return;
  document.querySelectorAll('.option-item').forEach(el => {
    const val = el.dataset.value;
    if (val === currentQuestion.correctAnswer) {
      el.classList.add('correct');
    } else if (val === selectedAnswer && val !== currentQuestion.correctAnswer) {
      el.classList.add('wrong');
    }
  });
}

function showQuestionResult(isCorrect, userAnswer) {
  const isLast = currentQIndex === currentQuestions.length - 1;

  if (isCorrect) {
    showToast(`✅ 第${currentQIndex+1}题正确！`, 'success');
    setTimeout(() => {
      if (isLast) {
        finishScene();
      } else {
        currentQIndex++;
        showCurrentQuestion();
        updateQuestionProgress();
      }
    }, 900);
  } else {
    showToast(`❌ 第${currentQIndex+1}题答错了，正确答案见下方解析`, 'error');
    // 显示解析
    const hintBox = document.getElementById('hintBox');
    hintBox.innerHTML = `
      <strong style="color:var(--accent-green);">✓ 正确答案：${currentQuestion.correctAnswer}</strong><br>
      <span style="color:var(--text-2);">${currentQuestion.explanation}</span>
    `;
    hintBox.classList.remove('hidden');

    // 2秒后自动下一题（或结束）
    setTimeout(() => {
      if (isLast) {
        finishScene();
      } else {
        currentQIndex++;
        showCurrentQuestion();
        updateQuestionProgress();
      }
    }, 2500);
  }
}

function updateQuestionProgress() {
  const total = currentQuestions.length;
  const pct = (currentQIndex / total) * 100;
  const bar = document.getElementById('questionProgressFill');
  if (bar) bar.style.width = pct + '%';

  // 显示小圆点
  const dots = document.getElementById('questionDots');
  if (dots) {
    let html = '';
    for (let i = 0; i < total; i++) {
      let cls = 'dot';
      if (i < currentQIndex) cls += ' done';
      else if (i === currentQIndex) cls += ' current';
      html += `<span class="${cls}"></span>`;
    }
    dots.innerHTML = html;
  }
}

function finishScene() {
  const sceneId = gameState.currentScene;
  const allCorrect = sceneResults.every(r => r.correct);

  // 只要尝试过就解锁下一关
  if (!gameState.attemptedScenes.includes(sceneId)) {
    gameState.attemptedScenes.push(sceneId);
  }

  if (allCorrect) {
    // 通关成功
    if (!gameState.completedScenes.includes(sceneId)) {
      gameState.completedScenes.push(sceneId);
    }
    saveState();
    updateProgress();
    renderMap();
    renderSidebar();

    showResultModal(true, sceneId);
  } else {
    // 有错题 → 仍可解锁下一关，显示错题回顾
    saveState();
    updateProgress();
    renderMap();
    renderSidebar();
    showSceneFailModal(sceneId);
  }
}

function showSceneFailModal(sceneId) {
  const modal = document.getElementById('resultModal');
  const icon = document.getElementById('modalIcon');
  const congrats = document.getElementById('modalCongrats');
  const title = document.getElementById('modalTitle');
  const feedback = document.getElementById('modalFeedback');
  const knowledge = document.getElementById('modalKnowledge');
  const btnContinue = document.getElementById('btnContinue');
  const btnReport = document.getElementById('btnViewReport');

  modal.classList.remove('hidden');
  icon.textContent = '💪';
  congrats.textContent = 'LEVEL UNLOCKED';
  title.textContent = '有错题，但下一关已解锁！';

  // 错题列表
  const wrongList = sceneResults.filter(r => !r.correct);
  let wrongHtml = '<div style="margin-bottom:12px;"><strong style="color:var(--accent-red);">错题回顾：</strong></div>';
  wrongList.forEach((w, i) => {
    const q = currentQuestions.find(cq => cq.qid === w.qid);
    wrongHtml += `
      <div style="background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.15);border-radius:10px;padding:10px 14px;margin-bottom:8px;">
        <div style="font-size:12px;color:var(--text-3);margin-bottom:4px;">${q.title}</div>
        <div style="font-size:13px;color:var(--accent-green);">✓ 正确：${q.correctAnswer}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:4px;">${q.explanation}</div>
      </div>`;
  });

  feedback.innerHTML = wrongHtml;
  knowledge.innerHTML = '<p style="color:var(--text-3);font-size:12px;">建议复习后重新挑战本关</p>';

  btnContinue.textContent = '重新挑战';
  btnContinue.onclick = () => {
    modal.classList.add('hidden');
    // 重置本关
    loadQuestion(sceneId);
    switchView('question');
    // 恢复按钮文字
    btnContinue.textContent = '继续闯关';
    btnContinue.onclick = null; // 恢复默认
  };

  btnReport.style.display = 'inline-flex';
  btnReport.textContent = '返回地图';
  btnReport.onclick = () => {
    modal.classList.add('hidden');
    switchView('map');
    btnReport.textContent = '查看诊断报告';
    btnReport.onclick = null;
  };
}

function showResultModal(isCorrect, sceneId) {
  const modal = document.getElementById('resultModal');
  const icon = document.getElementById('modalIcon');
  const congrats = document.getElementById('modalCongrats');
  const title = document.getElementById('modalTitle');
  const feedback = document.getElementById('modalFeedback');
  const knowledge = document.getElementById('modalKnowledge');
  const btnContinue = document.getElementById('btnContinue');
  const btnReport = document.getElementById('btnViewReport');

  modal.classList.remove('hidden');

  const scene = SCENES[sceneId];
  const totalQ = currentQuestions.length;

  icon.textContent = '🎉';
  congrats.textContent = 'SCENE CLEARED!';
  title.textContent = `「${scene.title}」通关成功！`;

  feedback.innerHTML = `
    <div style="display:flex;gap:20px;margin-bottom:12px;">
      <div style="text-align:center;">
        <div style="font-size:28px;font-weight:700;color:var(--accent-green);">${totalQ}/${totalQ}</div>
        <div style="font-size:11px;color:var(--text-3);">全部答对</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:28px;font-weight:700;color:var(--accent-violet);">+${totalQ * 10}</div>
        <div style="font-size:11px;color:var(--text-3);">经验值</div>
      </div>
    </div>
    <p style="color:var(--text-2);font-size:13px;">${scene.description}</p>
  `;

  // 知识点标签
  let kpHtml = '<p style="margin-top:14px;font-size:11px;color:var(--text-3);letter-spacing:1px;">本关知识点</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">';
  scene.knowledgePoints.forEach(kp => {
    kpHtml += `<span class="tag" style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;background:rgba(167,139,250,0.1);color:var(--accent-violet);border:1px solid rgba(167,139,250,0.2);">${kp}</span>`;
  });
  kpHtml += '</div>';
  knowledge.innerHTML = kpHtml;

  btnContinue.textContent = '继续闯关';
  btnContinue.onclick = () => {
    modal.classList.add('hidden');
    switchView('map');
    btnContinue.onclick = null;
  };

  btnReport.style.display = 'inline-flex';
  btnReport.textContent = '查看诊断报告';
  btnReport.onclick = () => {
    modal.classList.add('hidden');
    switchView('report');
    btnReport.onclick = null;
  };
}