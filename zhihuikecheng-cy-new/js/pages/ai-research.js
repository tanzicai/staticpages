/* AI科研助手 */
PageRenderers.aiResearch = () => `
<div class="page-header"><h2>AI科研助手</h2><p>基于大模型的智能科研辅助，支持分析计划生成、文献分析与报告撰写</p></div>
<div class="grid-2"><div class="card"><div class="card-header"><span class="card-title">研究分析</span></div><div class="card-body"><div class="chat-container" style="height:500px" id="researchChat"><div class="chat-messages" id="researchChatMessages"></div><div class="chat-input-area"><input type="text" class="form-input" id="researchChatInput" placeholder="描述你的研究需求，如：分析AI在医学影像诊断中的应用..."><button class="btn btn-primary" id="researchChatSend">分析</button></div></div></div></div>
<div><div class="card"><div class="card-header"><span class="card-title">研究模板</span></div><div class="card-body"><div class="form-group"><select class="form-select" id="researchTemplate"><option value="">选择研究模板...</option><option value="文献综述">文献综述</option><option value="研究报告">研究报告</option><option value="对比分析">对比分析</option><option value="创新评估">创新评估</option></select></div><div class="form-group"><label class="form-label">检索模式</label><div class="btn-group"><button class="btn btn-outline active" id="taskModeBtn">任务模式</button><button class="btn btn-outline" id="outlineModeBtn">大纲模式</button></div></div><div class="form-group"><label class="form-label">自定义检索源</label><input type="text" class="form-input" id="customSource" placeholder="输入检索源URL或关键词"></div><div class="form-group"><button class="btn btn-outline w-full" id="uploadDocBtn">📄 上传文献</button><input type="file" id="docFileInput" style="display:none" accept=".pdf,.doc,.docx,.txt" multiple></div><div class="form-group"><button class="btn btn-outline w-full" id="addTemplateBtn">+ 自主添加模板</button></div></div></div>
<div class="card" style="margin-top:16px"><div class="card-header"><span class="card-title">研究报告列表</span></div><div class="card-body" id="reportList"></div></div></div></div>
<div id="reportEditorOverlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center"><div style="background:#fff;border-radius:var(--radius-lg);width:700px;max-height:80vh;display:flex;flex-direction:column"><div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between"><b>编辑报告</b><button class="report-editor-close" style="background:none;border:none;font-size:20px;cursor:pointer">&times;</button></div><div style="padding:16px;flex:1;overflow:auto"><textarea id="reportEditorTextarea" style="width:100%;min-height:300px;border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-size:14px;font-family:inherit;resize:vertical"></textarea></div><div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-outline report-editor-close">取消</button><button class="btn btn-primary" id="reportEditorSave">保存修改</button></div></div></div>`;

PageInits.aiResearch = () => {
  const reports = Store.get('researchReports') || [];
  const chatMessages = document.getElementById('researchChatMessages');
  // 每条报告独立存储内容，避免互相覆盖
  const reportContents = {};
  // 分析计划项（支持增删改）
  let planItems = [];

  chatMessages.innerHTML = `<div class="chat-message assistant"><div class="msg-avatar">AI</div><div class="msg-bubble">您好！我是AI科研助手，可以帮您：<br>1. 生成研究分析计划<br>2. 文献综述与分析（核心观点+创新摘要+对比分析）<br>3. 撰写研究报告<br>4. 创新价值评估<br>5. 多格式报告导出（MD/HTML/TXT）<br><br>请描述您的研究需求开始分析。</div></div>`;

  const researchData = {
    '医学影像': {
      plan: ['医学影像AI发展现状调研', '深度学习在影像诊断中的应用分析', '关键算法对比研究', '临床验证案例分析', '创新点提炼与展望'],
      keywords: '人工智能、医学影像、深度学习、CNN、影像诊断、计算机辅助诊断',
      report: '# AI在医学影像诊断中的应用研究报告\n\n## 摘要\n人工智能技术在医学影像诊断领域的应用正快速发展，深度学习模型在影像识别、分割和分类方面展现出卓越性能。\n\n## 1. 研究背景\n医学影像诊断是临床诊断的重要组成部分，传统方法依赖医生经验，存在主观性强、效率低等问题。\n\n## 2. 核心技术\n- **卷积神经网络（CNN）**：用于影像特征提取\n- **迁移学习**：利用预训练模型加速训练\n- **注意力机制**：提升关键区域识别精度\n\n## 3. 应用场景\n- X光片异常检测\n- CT影像肿瘤分割\n- MRI脑部结构分析\n\n## 4. 创新观点\n本研究提出基于多模态融合的影像诊断框架，结合临床文本数据提升诊断准确率。\n\n## 5. 结论\nAI在医学影像诊断中具有巨大潜力，但需解决数据质量、模型可解释性等挑战。',
    },
    '知识图谱': {
      plan: ['知识图谱技术发展综述', '医学教育知识图谱构建方法', '课程体系优化策略分析', '个性化学习路径推荐研究', '效果评估与展望'],
      keywords: '知识图谱、医学教育、课程体系、个性化学习、知识表示',
      report: '# 基于知识图谱的医学课程体系优化研究\n\n## 摘要\n知识图谱技术为医学课程体系优化提供了新的方法，通过构建知识点关联网络，实现课程内容的系统化组织。\n\n## 1. 研究背景\n传统医学课程体系存在知识点孤立、缺乏系统性等问题，知识图谱技术可以有效解决。\n\n## 2. 构建方法\n- 知识点提取与分类\n- 关联关系定义\n- 图谱可视化\n- 动态更新机制\n\n## 3. 应用效果\n- 学生知识掌握率提升15%\n- 课程体系完整性提高\n- 跨学科知识关联增强\n\n## 4. 创新价值\n本研究首次将知识图谱应用于医学课程体系优化，提出了完整的构建方法论。',
    },
  };

  const template = document.getElementById('researchTemplate');
  document.getElementById('taskModeBtn').addEventListener('click', function() {
    this.classList.add('active'); document.getElementById('outlineModeBtn').classList.remove('active');
  });
  document.getElementById('outlineModeBtn').addEventListener('click', function() {
    this.classList.add('active'); document.getElementById('taskModeBtn').classList.remove('active');
  });

  // Markdown简易渲染
  function renderMarkdown(md) {
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : '<p>' + m + '</p>');
  }

  // 追加消息（用 insertAdjacentHTML 避免重建DOM丢失事件）
  function appendMessage(html) {
    chatMessages.insertAdjacentHTML('beforeend', html);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 渲染可编辑的分析计划
  function renderPlanItems(planId) {
    const container = document.getElementById(planId);
    if (!container) return;
    container.innerHTML = planItems.map((item, i) => `
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0;padding:6px 8px;background:var(--primary-bg);border-radius:6px">
        <span style="flex:1">${i + 1}. ${item}</span>
        <button class="btn btn-outline btn-sm plan-edit-btn" data-idx="${i}" style="padding:2px 8px;font-size:12px">✏️ 修改</button>
        <button class="btn btn-outline btn-sm plan-del-btn" data-idx="${i}" style="padding:2px 8px;font-size:12px;color:var(--danger)">🗑️ 删除</button>
      </div>
    `).join('') + `
      <div style="margin-top:8px;display:flex;gap:8px">
        <input type="text" class="form-input" id="${planId}_newInput" placeholder="补充分析步骤..." style="flex:1;font-size:13px">
        <button class="btn btn-primary btn-sm plan-add-btn" data-plan-id="${planId}" style="white-space:nowrap">+ 添加</button>
      </div>
    `;
    // 绑定删除
    container.querySelectorAll('.plan-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        planItems.splice(idx, 1);
        renderPlanItems(planId);
        App.showToast('已删除分析步骤', 'success');
      });
    });
    // 绑定修改
    container.querySelectorAll('.plan-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const newText = prompt('修改分析步骤:', planItems[idx]);
        if (newText && newText.trim()) {
          planItems[idx] = newText.trim();
          renderPlanItems(planId);
          App.showToast('已修改分析步骤', 'success');
        }
      });
    });
    // 绑定添加
    container.querySelector('.plan-add-btn')?.addEventListener('click', () => {
      const input = document.getElementById(planId + '_newInput');
      if (input && input.value.trim()) {
        planItems.push(input.value.trim());
        renderPlanItems(planId);
        App.showToast('已添加分析步骤', 'success');
      }
    });
  }

  // 绑定报告操作按钮（使用事件委托避免DOM重建问题）
  function bindReportActions(msgId, rawContent, reportTitle) {
    reportContents[msgId] = { content: rawContent, title: reportTitle };
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;

    msgEl.querySelector('.copy-report-btn')?.addEventListener('click', () => {
      const text = reportContents[msgId].content;
      navigator.clipboard.writeText(text).then(() => {
        App.showToast('报告已复制到剪贴板', 'success');
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        App.showToast('报告已复制到剪贴板', 'success');
      });
    });

    msgEl.querySelector('.edit-report-btn')?.addEventListener('click', () => {
      const overlay = document.getElementById('reportEditorOverlay');
      const textarea = document.getElementById('reportEditorTextarea');
      textarea.value = reportContents[msgId].content;
      overlay.style.display = 'flex';
      window._editReportMsgId = msgId;
    });

    msgEl.querySelectorAll('.download-report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fmt = btn.dataset.fmt;
        const rawText = reportContents[msgId].content;
        const title = reportContents[msgId].title.replace(/[\/\\:*?"<>|]/g, '_');
        let content, filename, mime;

        if (fmt === 'md') {
          content = rawText; filename = title + '.md'; mime = 'text/markdown';
        } else if (fmt === 'html') {
          content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.8}h1{font-size:24px}h2{font-size:20px}h3{font-size:16px}li{margin:4px 0}</style></head><body>${renderMarkdown(rawText)}</body></html>`;
          filename = title + '.html'; mime = 'text/html';
        } else {
          content = rawText; filename = title + '.txt'; mime = 'text/plain';
        }

        const blob = new Blob(['\uFEFF' + content], { type: mime + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showToast(`报告已下载为 ${filename}`, 'success');
      });
    });

    msgEl.querySelector('.delete-report-btn')?.addEventListener('click', () => {
      msgEl.style.transition = 'opacity 0.3s';
      msgEl.style.opacity = '0';
      setTimeout(() => { msgEl.remove(); }, 300);
      delete reportContents[msgId];
      App.showToast('报告内容已删除', 'success');
    });
  }

  // 发送分析请求
  document.getElementById('researchChatSend').addEventListener('click', () => {
    const input = document.getElementById('researchChatInput');
    const q = input.value.trim();
    if (!q) return;
    appendMessage(`<div class="chat-message user"><div class="msg-avatar">${App.currentUser?.avatar||'?'}</div><div class="msg-bubble">${q}</div></div>`);

    let resp = researchData['医学影像'];
    for (const [key, val] of Object.entries(researchData)) {
      if (q.includes(key)) { resp = val; break; }
    }

    const reportTitle = resp.plan[0] || '研究报告';
    planItems = [...resp.plan];

    setTimeout(() => {
      const planId = 'plan-' + Date.now();
      appendMessage(`<div class="chat-message assistant"><div class="msg-avatar">AI</div><div class="msg-bubble"><b>分析计划：</b><br><div id="${planId}" style="margin-top:8px"></div><br><b>核心关键词：</b>${resp.keywords}<br><br><span style="font-size:12px;color:var(--text-muted)">💡 您可以对分析计划进行删除、修改和补充</span></div></div>`);
      renderPlanItems(planId);

      setTimeout(() => {
        const msgId = 'report-' + Date.now();
        appendMessage(`<div class="chat-message assistant" id="${msgId}"><div class="msg-avatar">AI</div><div class="msg-bubble"><div class="markdown-preview" id="reportContent_${msgId}">${renderMarkdown(resp.report)}</div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline btn-sm copy-report-btn">📋 复制</button><button class="btn btn-outline btn-sm edit-report-btn">✏️ 编辑</button><button class="btn btn-outline btn-sm download-report-btn" data-fmt="md">📥 下载MD</button><button class="btn btn-outline btn-sm download-report-btn" data-fmt="html">📥 下载HTML</button><button class="btn btn-outline btn-sm download-report-btn" data-fmt="txt">📥 下载TXT</button><button class="btn btn-outline btn-sm delete-report-btn" style="color:var(--danger)">🗑️ 删除</button></div></div></div>`);
        bindReportActions(msgId, resp.report, reportTitle);
      }, 800);
    }, 600);
    input.value = '';
  });

  document.getElementById('researchChatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('researchChatSend').click();
  });

  // 报告编辑器
  const editorOverlay = document.getElementById('reportEditorOverlay');
  document.querySelectorAll('.report-editor-close').forEach(el => {
    el.addEventListener('click', () => { editorOverlay.style.display = 'none'; });
  });
  document.getElementById('reportEditorSave').addEventListener('click', () => {
    const newContent = document.getElementById('reportEditorTextarea').value;
    const msgId = window._editReportMsgId;
    if (msgId && reportContents[msgId]) {
      const reportEl = document.getElementById('reportContent_' + msgId);
      if (reportEl) reportEl.innerHTML = renderMarkdown(newContent);
      reportContents[msgId].content = newContent;
    }
    editorOverlay.style.display = 'none';
    App.showToast('报告已保存', 'success');
  });

  // 上传文献
  document.getElementById('uploadDocBtn').addEventListener('click', () => {
    document.getElementById('docFileInput').click();
  });

  document.getElementById('docFileInput').addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const fileNames = Array.from(files).map(f => f.name).join('、');

    App.showModal('文献分析', `
      <div class="form-group"><p>已选择文件：<b>${fileNames}</b></p><p style="font-size:12px;color:var(--text-muted);margin-top:4px">共 ${files.length} 个文件，将自动生成核心观点、创新摘要与对比分析报告</p></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="confirmUploadBtn">开始全量分析</button>`);

    document.getElementById('confirmUploadBtn').addEventListener('click', () => {
      document.querySelector('.modal-overlay').remove();

      const allResults = {
        core: '核心观点：\n该文献探讨了AI技术在医学教育中的应用前景，提出了基于知识图谱的个性化学习框架。研究指出，传统医学教育模式存在内容碎片化、缺乏个性化等问题，而知识图谱技术可以有效解决这些问题。主要观点包括：\n1. 知识图谱技术可实现课程内容的系统化组织\n2. 个性化学习路径推荐能显著提升学习效率\n3. 多模态数据融合是未来医学教育信息化的发展方向\n4. 实时学习效果评估与动态调整机制至关重要',
        innovation: '创新摘要：\n本研究的主要创新点如下：\n1. 【方法创新】首次将知识图谱与自适应学习结合应用于医学教育领域，构建了多维度医学知识关联网络\n2. 【技术创新】提出了基于学习路径的个性化推荐算法，准确率较传统方法提升23%\n3. 【应用创新】实现了实时学习效果评估与动态调整机制，支持移动端随时访问\n4. 【数据创新】整合了15门医学课程的知识点数据，构建了完整的医学知识图谱\n\n创新价值评估：该研究具有较高的创新价值和实践意义，已在医学院实际教学中验证，学生满意度提升18%。',
        compare: '对比分析报告：\n\n## 一、与已有研究对比\n| 对比维度 | 本研究 | Smith et al.(2025) | Wang et al.(2024) |\n|---------|--------|-------------------|------------------|\n| 知识覆盖 | 15门课程 | 8门课程 | 10门课程 |\n| 推荐准确率 | 87% | 71% | 78% |\n| 移动端支持 | ✓ | ✗ | ✓ |\n| 实时评估 | ✓ | ✗ | ✗ |\n\n## 二、优势分析\n1. 知识覆盖更全面（涵盖15门课程 vs 8-10门）\n2. 个性化推荐准确率提升23%（87% vs 64-71%）\n3. 学生知识掌握率提升15%\n4. 增加了移动端访问功能和实时评估机制\n\n## 三、不足与改进方向\n1. 跨学科知识关联有待加强\n2. 大规模并发性能需优化\n3. 自然语言处理精度可进一步提升',
      };

      // 依次生成三部分分析
      setTimeout(() => {
        appendMessage(`<div class="chat-message assistant"><div class="msg-avatar">AI</div><div class="msg-bubble"><b>📄 文献分析结果</b><br><span style="font-size:12px;color:var(--text-muted)">分析文件：${fileNames}</span><br><br><b>一、核心观点</b><br>${allResults.core.replace(/\n/g, '<br>')}</div></div>`);
      }, 400);

      setTimeout(() => {
        appendMessage(`<div class="chat-message assistant"><div class="msg-avatar">AI</div><div class="msg-bubble"><b>二、创新摘要</b><br>${allResults.innovation.replace(/\n/g, '<br>')}</div></div>`);
      }, 1200);

      setTimeout(() => {
        const msgId = 'report-' + Date.now();
        const fullReport = `# 文献分析报告\n\n## 分析文件\n${fileNames}\n\n## 一、核心观点\n${allResults.core.replace('核心观点：\n', '')}\n\n## 二、创新摘要\n${allResults.innovation.replace('创新摘要：\n', '')}\n\n## 三、对比分析\n${allResults.compare.replace('对比分析：\n', '')}`;
        appendMessage(`<div class="chat-message assistant" id="${msgId}"><div class="msg-avatar">AI</div><div class="msg-bubble"><b>三、对比分析报告</b><br>${allResults.compare.replace(/\n/g, '<br>')}<br><br><div class="markdown-preview" id="reportContent_${msgId}">${renderMarkdown(fullReport)}</div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline btn-sm copy-report-btn">📋 复制</button><button class="btn btn-outline btn-sm edit-report-btn">✏️ 编辑</button><button class="btn btn-outline btn-sm download-report-btn" data-fmt="md">📥 下载MD</button><button class="btn btn-outline btn-sm download-report-btn" data-fmt="html">📥 下载HTML</button><button class="btn btn-outline btn-sm download-report-btn" data-fmt="txt">📥 下载TXT</button><button class="btn btn-outline btn-sm delete-report-btn" style="color:var(--danger)">🗑️ 删除</button></div></div></div>`);
        bindReportActions(msgId, fullReport, '文献分析报告');
      }, 2000);
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  // 自主添加模板
  document.getElementById('addTemplateBtn').addEventListener('click', () => {
    App.showModal('添加研究模板', `
      <div class="form-group"><label class="form-label">模板名称</label><input class="form-input" id="newTemplateName" placeholder="如：实验报告模板"></div>
      <div class="form-group"><label class="form-label">模板类型</label><select class="form-select" id="newTemplateType"><option>文献综述</option><option>研究报告</option><option>对比分析</option><option>创新评估</option><option>自定义</option></select></div>
      <div class="form-group"><label class="form-label">模板内容（Markdown）</label><textarea class="form-textarea" id="newTemplateContent" rows="5" placeholder="输入模板内容..."></textarea></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="confirmAddTemplate">确认添加</button>`);

    document.getElementById('confirmAddTemplate').addEventListener('click', () => {
      const name = document.getElementById('newTemplateName').value.trim();
      const type = document.getElementById('newTemplateType').value;
      const content = document.getElementById('newTemplateContent').value.trim();
      if (!name) { App.showToast('请输入模板名称', 'warning'); return; }

      const sel = document.getElementById('researchTemplate');
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
      sel.value = name;

      document.querySelector('.modal-overlay').remove();
      App.showToast(`模板"${name}"已添加`, 'success');
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  // 报告列表
  function renderReportList() {
    document.getElementById('reportList').innerHTML = reports.map(r => `
      <div style="padding:10px 0;border-bottom:1px solid var(--border-light)"><div class="flex-between"><div><b>${r.title}</b><p style="font-size:12px;color:var(--text-muted)">${r.template} | ${r.createdAt}</p></div><span class="badge badge-${r.status==='已完成'?'success':'warning'}">${r.status}</span></div><div style="margin-top:4px">${r.keywords.map(k=>`<span class="badge badge-info" style="margin-right:4px;font-size:11px">${k}</span>`).join('')}</div></div>
    `).join('');
  }
  renderReportList();
};
