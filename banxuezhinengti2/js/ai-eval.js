// ===== AI 评价与诊断（玻璃拟态风格） =====

function generateAIReport() {
  const totalScenes = Object.keys(SCENES).length;
  const completed = gameState.completedScenes.length;

  // 收集所有知识点（每题都有 knowledgePoint 字段）
  const allKPs = new Set();
  Object.values(QUESTIONS).forEach(qList => {
    qList.forEach(q => {
      if (q.knowledgePoint) allKPs.add(q.knowledgePoint);
    });
  });

  const mastery = {};
  allKPs.forEach(kp => {
    const correct = gameState.correctKnowledge[kp] || 0;
    const wrong = gameState.wrongKnowledge[kp] || 0;
    const total = correct + wrong;
    mastery[kp] = total > 0 ? Math.round((correct / total) * 100) : 50;
  });

  return {
    completed,
    totalScenes,
    mastery,
    weakPoints: Object.entries(gameState.wrongKnowledge)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  };
}

function renderAIReport() {
  const report = generateAIReport();

  // 摘要
  const summary = document.getElementById('reportSummary');
  const completionRate = Math.round((report.completed / report.totalScenes) * 100);
  const overallMastery = calcOverallMastery(report.mastery);

  let summaryHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
      <div style="flex:1;">
        <div style="font-size:11px;color:var(--text-3);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">通关进度</div>
        <div style="font-size:28px;font-weight:700;color:var(--text-1);">${report.completed}<span style="font-size:14px;color:var(--text-3);"> / ${report.totalScenes} 关</span></div>
      </div>
      <div style="width:1px;height:40px;background:var(--glass-border);"></div>
      <div style="flex:1;">
        <div style="font-size:11px;color:var(--text-3);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">综合掌握度</div>
        <div style="font-size:28px;font-weight:700;background:linear-gradient(135deg,var(--accent-violet),var(--accent-cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${overallMastery}%</div>
      </div>
    </div>
    <div style="font-size:13px;color:var(--text-2);line-height:1.8;">${getOverallAdvice(report)}</div>
  `;

  // 知识标签云
  const tagCloud = generateTagCloud(report.mastery);
  summaryHTML += `<div class="tag-cloud" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:16px;">${tagCloud}</div>`;

  summary.innerHTML = summaryHTML;

  // 雷达图
  drawRadarChart(report.mastery);

  // 薄弱知识点
  const weakList = document.getElementById('weakList');
  if (report.weakPoints.length === 0) {
    weakList.innerHTML = '<li style="justify-content:center;color:var(--text-3);">暂无数据，继续完成关卡后AI将分析你的薄弱点</li>';
  } else {
    weakList.innerHTML = report.weakPoints.map(([kp, count]) => {
      const m = report.mastery[kp] || 0;
      const barColor = m >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
      const textColor = m >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
      return `
        <li>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <strong style="color:${textColor};font-weight:600;">${kp}</strong>
              <span style="font-size:11px;color:var(--text-3);">掌握度 ${m}% · 错误 ${count} 次</span>
            </div>
            <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${m}%;background:${barColor};border-radius:2px;transition:width 0.6s var(--ease);"></div>
            </div>
          </div>
        </li>`;
    }).join('');
  }

  // 复习建议
  const suggestionList = document.getElementById('suggestionList');
  const suggestions = getSuggestions(report);
  suggestionList.innerHTML = suggestions.map((s, i) => `
    <li>
      <span style="color:var(--accent-violet);font-weight:700;font-size:12px;min-width:20px;">0${i+1}</span>
      <span>${s}</span>
    </li>
  `).join('');
}

function generateTagCloud(mastery) {
  const tags = Object.entries(mastery);
  if (tags.length === 0) return '';
  return tags.map(([kp, val]) => {
    let cls = 'weak';
    if (val >= 80) cls = 'strong';
    else if (val >= 50) cls = 'medium';
    return `<span class="knowledge-tag ${cls}">${kp} · ${val}%</span>`;
  }).join('');
}

function calcOverallMastery(mastery) {
  const vals = Object.values(mastery);
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function getOverallAdvice(report) {
  const rate = report.completed / report.totalScenes;
  if (rate < 0.3) return '📖 建议从线性规划基础开始，逐步推进，不要急于挑战高难度关卡。每完成一题后仔细阅读解析。';
  if (rate < 0.6) return '👍 基础已具备，重点关注运输问题和整数规划的解题技巧。建议对错题做二次练习。';
  if (rate < 1) return '🔥 进度良好！建议攻克剩余关卡，特别注意表上作业法的手算练习。';
  return '🏆 全部通关！可以尝试组合场景的综合题，进一步提升实战建模能力。';
}

function getSuggestions(report) {
  const suggestions = [];
  const weak = report.weakPoints;

  if (weak.length === 0) {
    return ['继续完成更多关卡，解锁全部知识点评估！'];
  }

  weak.forEach(([kp]) => {
    switch (kp) {
      case '线性规划建模':
        suggestions.push('复习线性规划三要素（决策变量、目标函数、约束条件），用3道以上实际场景练习建模');
        break;
      case '单纯形法':
        suggestions.push('重点练习单纯形表迭代过程，注意入基/出基变量的选择规则与退化处理');
        break;
      case '产销平衡':
        suggestions.push('深入理解产销平衡的数学含义，练习判断运输问题可行解的存在条件');
        break;
      case '位势法':
        suggestions.push('反复练习位势计算与检验数求解，建议手算完整表格3道以上');
        break;
      case '闭回路法':
        suggestions.push('掌握闭回路的寻找技巧和运量调整方向，注意退化情形的处理');
        break;
      case '整数规划求解方法':
        suggestions.push('理解分支定界的剪枝逻辑，用0-1背包问题跟踪完整求解过程');
        break;
      case '动态规划基本原理':
        suggestions.push('重点理解Bellman最优性原理，从最短路径问题入手掌握阶段递推思想');
        break;
      case 'EOQ公式计算':
        suggestions.push('熟记EOQ公式及参数含义，练习变式题（如数量折扣、缺货允许等扩展模型）');
        break;
      case '灵敏度分析':
      case '影子价格':
        suggestions.push('练习对偶问题求解，理解影子价格的经济含义及适用范围（允许变化区间）');
        break;
      case '分支定界法':
        suggestions.push('动手跟踪一个完整的分支定界树，标注上下界和剪枝条件，体会搜索效率');
        break;
      case '0-1规划':
        suggestions.push('用0-1变量建模覆盖/选址/背包问题，重点练习约束的逻辑表达（如"至多选一个"）');
        break;
      case '转运问题':
        suggestions.push('掌握将转运问题化为普通运输问题的技巧：虚拟产销点 + 最短路径等效运费');
        break;
      case 'M/M/1模型':
      case '排队论指标':
        suggestions.push('熟记M/M/1核心公式（ρ、Ls、Lq、Ws、Wq），练习先算利用率ρ再递推其他指标');
        break;
      default:
        suggestions.push(`针对「${kp}」进行专项练习，回顾教材对应章节并做配套习题`);
    }
  });

  if (report.completed < report.totalScenes) {
    suggestions.push('继续完成未通关的场景，解锁更多知识点评估数据');
  }

  return suggestions.slice(0, 6);
}

// ===== 精美雷达图（Canvas） =====
function drawRadarChart(mastery) {
  const canvas = document.getElementById('radarChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 6;
  const r = Math.min(w, h) / 2 - 56;

  // 高清适配
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);

  // 按场景顺序整理标签
  const labels = [];
  const values = [];
  Object.keys(SCENES).forEach(sid => {
    const kps = SCENES[sid].knowledgePoints || [];
    kps.forEach(kp => {
      if (!labels.includes(kp) && mastery[kp] !== undefined) {
        labels.push(kp);
        values.push(mastery[kp]);
      }
    });
  });
  // 补充不在场景中的知识点
  Object.keys(mastery).forEach(kp => {
    if (!labels.includes(kp)) {
      labels.push(kp);
      values.push(mastery[kp]);
    }
  });
  const n = labels.length;
  if (n === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '13px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', cx, cy);
    return;
  }

  const angleStep = (Math.PI * 2) / n;

  // 绘制发光背景圈
  for (let level = 5; level >= 1; level--) {
    const radius = (r / 5) * level;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const alpha = 0.03 + level * 0.015;
    ctx.fillStyle = `rgba(167,139,250,${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.05 + level * 0.01})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 轴线 + 标签
  ctx.font = '11.5px "Noto Sans SC", sans-serif';
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;

    // 轴线
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 标签
    const lx = cx + (r + 22) * Math.cos(angle);
    const ly = cy + (r + 22) * Math.sin(angle);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], lx, ly);

    // 刻度值
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '9px "Noto Sans SC", sans-serif';
    for (let lv = 1; lv <= 5; lv++) {
      const tr = (r / 5) * lv;
      const tx = cx + tr * Math.cos(angle);
      const ty = cy + tr * Math.sin(angle);
      if (lv === 5) ctx.fillText('100', tx + 10 * Math.cos(angle), ty + 10 * Math.sin(angle));
    }
    ctx.font = '11.5px "Noto Sans SC", sans-serif';
  }

  // 数据区域（渐变填充）
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, 'rgba(167,139,250,0.35)');
  gradient.addColorStop(0.5, 'rgba(139,92,246,0.2)');
  gradient.addColorStop(1, 'rgba(96,165,250,0.08)');

  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const angle = idx * angleStep - Math.PI / 2;
    const val = values[idx] / 100;
    const x = cx + r * val * Math.cos(angle);
    const y = cy + r * val * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // 数据线（发光）
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const angle = idx * angleStep - Math.PI / 2;
    const val = values[idx] / 100;
    const x = cx + r * val * Math.cos(angle);
    const y = cy + r * val * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(167,139,250,0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(167,139,250,0.5)';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 数据点
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const val = values[i] / 100;
    const x = cx + r * val * Math.cos(angle);
    const y = cy + r * val * Math.sin(angle);
    const masteryVal = values[i];

    // 外圈光晕
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    const dotGlow = ctx.createRadialGradient(x, y, 0, x, y, 7);
    if (masteryVal >= 70) {
      dotGlow.addColorStop(0, 'rgba(52,211,153,0.4)');
      dotGlow.addColorStop(1, 'rgba(52,211,153,0)');
    } else if (masteryVal >= 40) {
      dotGlow.addColorStop(0, 'rgba(251,191,36,0.4)');
      dotGlow.addColorStop(1, 'rgba(251,191,36,0)');
    } else {
      dotGlow.addColorStop(0, 'rgba(248,113,113,0.4)');
      dotGlow.addColorStop(1, 'rgba(248,113,113,0)');
    }
    ctx.fillStyle = dotGlow;
    ctx.fill();

    // 实心点
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = masteryVal >= 70 ? '#34d399' : (masteryVal >= 40 ? '#fbbf24' : '#f87171');
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 数值标注
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    const labelOffset = 16;
    ctx.fillText(masteryVal + '%', x + labelOffset * Math.cos(angle), y + labelOffset * Math.sin(angle));
  }
}