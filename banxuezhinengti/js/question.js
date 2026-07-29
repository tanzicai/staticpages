// ===== 答题交互（玻璃拟态风格） =====

let currentQuestion = null;
let selectedAnswer = null;

function loadQuestion(sceneId) {
  const q = QUESTIONS[sceneId];
  if (!q) return;

  currentQuestion = q;
  selectedAnswer = null;

  // 填充题目信息
  document.getElementById('qTag').textContent = q.tag || SCENES[sceneId].tag;
  document.getElementById('qDifficulty').textContent = SCENES[sceneId].difficulty;
  document.getElementById('qTitle').textContent = q.title;
  document.getElementById('qScene').innerHTML = q.scene;
  document.getElementById('qBody').textContent = q.body;

  // 隐藏提示框
  document.getElementById('hintBox').classList.add('hidden');

  // 渲染选项或输入框
  const optionsContainer = document.getElementById('qOptions');
  optionsContainer.innerHTML = '';

  if (q.type === 'choice') {
    q.options.forEach(opt => {
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
  } else if (q.type === 'input') {
    const inputWrap = document.createElement('div');
    inputWrap.style.position = 'relative';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'answer-input';
    input.placeholder = '请输入你的答案...';
    input.id = 'textAnswer';
    inputWrap.appendChild(input);
    optionsContainer.appendChild(inputWrap);
  }

  document.querySelector('.content-area').scrollTop = 0;
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

  recordAnswer(currentQuestion, userAnswer, isCorrect);
  showResultModal(isCorrect, currentQuestion, userAnswer);

  if (isCorrect) {
    if (!gameState.completedScenes.includes(currentQuestion.sceneId)) {
      gameState.completedScenes.push(currentQuestion.sceneId);
    }
    saveState();
    updateProgress();
    renderMap();
    renderSidebar();
  }
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
  if (!gameState.answers[question.sceneId]) {
    gameState.answers[question.sceneId] = [];
  }
  gameState.answers[question.sceneId].push({
    answer: userAnswer,
    correct: isCorrect,
    time: new Date().toISOString(),
  });

  if (isCorrect) {
    gameState.correctKnowledge[kp] = (gameState.correctKnowledge[kp] || 0) + 1;
  } else {
    gameState.wrongKnowledge[kp] = (gameState.wrongKnowledge[kp] || 0) + 1;
  }

  saveState();
}

function showResultModal(isCorrect, question, userAnswer) {
  const modal = document.getElementById('resultModal');
  const icon = document.getElementById('modalIcon');
  const congrats = document.getElementById('modalCongrats');
  const title = document.getElementById('modalTitle');
  const feedback = document.getElementById('modalFeedback');
  const knowledge = document.getElementById('modalKnowledge');

  modal.classList.remove('hidden');

  if (isCorrect) {
    icon.textContent = '🎉';
    congrats.textContent = 'CONGRATULATIONS';
    title.textContent = '回答正确！关卡通过！';
    feedback.innerHTML = `
      <p style="color:var(--accent-green);font-weight:600;margin-bottom:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;"><path d="M5 13l4 4L19 7"/></svg>
        你的答案：${userAnswer}
      </p>
      <p style="color:var(--text-2);">${question.explanation}</p>
    `;
  } else {
    icon.textContent = '💪';
    congrats.textContent = 'ALMOST THERE';
    title.textContent = '差一点就对了！再接再厉';
    feedback.innerHTML = `
      <p style="color:var(--accent-red);font-weight:600;margin-bottom:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;"><path d="M6 18L18 6M6 6l12 12"/></svg>
        你的答案：${userAnswer}
      </p>
      <p style="color:var(--accent-green);margin-bottom:8px;font-weight:500;">
        ✓ 正确答案：${question.correctAnswer}
      </p>
      <p style="color:var(--text-2);">${question.explanation}</p>
    `;
  }

  // 知识点标签
  let kpHtml = '<p style="margin-top:16px;font-size:12px;color:var(--text-3);letter-spacing:1px;">涉及知识点</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">';
  question.knowledgePoints.forEach(kp => {
    kpHtml += `<span class="tag" style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;background:rgba(167,139,250,0.1);color:var(--accent-violet);border:1px solid rgba(167,139,250,0.2);">${kp}</span>`;
  });
  kpHtml += '</div>';
  knowledge.innerHTML = kpHtml;
}

function highlightAnswers() {
  if (!currentQuestion) return;
  if (currentQuestion.type !== 'choice') return;

  document.querySelectorAll('.option-item').forEach(el => {
    const val = el.dataset.value;
    if (val === currentQuestion.correctAnswer) {
      el.classList.add('correct');
    } else if (val === selectedAnswer && val !== currentQuestion.correctAnswer) {
      el.classList.add('wrong');
    }
  });
}