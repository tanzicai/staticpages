/* 安全审核 */
PageRenderers.securityReview = () => `
<div class="page-header"><h2>安全审核</h2><p>课程资源智能安全检测，支持文本、图片、文档、课程多维度审核</p></div>
<div class="card"><div class="card-header"><span class="card-title">风险概览</span></div><div class="card-body"><div class="stats-row"><div class="stat-card"><div class="stat-icon primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div><div class="stat-info"><div class="stat-value" id="secTotalPublish">-</div><div class="stat-label">总发布量</div></div></div><div class="stat-card"><div class="stat-icon danger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><div class="stat-info"><div class="stat-value" id="secSpamCount">-</div><div class="stat-label">垃圾发布量</div></div></div><div class="stat-card"><div class="stat-icon warning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div><div class="stat-info"><div class="stat-value" id="secSpamRate">-</div><div class="stat-label">垃圾发布率</div></div></div></div></div></div>
<div class="card" style="margin-top:16px"><div class="card-header"><span class="card-title">审核配置</span></div><div class="card-body"><div class="tabs" id="securityTabs"><div class="tab-item active" data-tab="keywords">关键词/忽略词</div><div class="tab-item" data-tab="blacklist">用户黑白名单</div><div class="tab-item" data-tab="imageList">图片名单</div></div><div id="securityTabContent"></div></div></div>
<div class="card" style="margin-top:16px"><div class="card-header"><span class="card-title">内容审核</span></div><div class="card-body"><div class="tabs" id="reviewTabs"><div class="tab-item active" data-tab="text">文本审核</div><div class="tab-item" data-tab="image">图片审核</div><div class="tab-item" data-tab="doc">文档审核</div><div class="tab-item" data-tab="course">课程审核</div></div><div id="reviewTabContent"></div></div></div>
<div class="card" style="margin-top:16px"><div class="card-header"><span class="card-title">文本纠错</span></div><div class="card-body"><div class="form-group"><textarea class="form-textarea" id="textCorrectionInput" rows="4" placeholder="输入需要纠错的文本内容..."></textarea></div><button class="btn btn-primary" id="textCorrectionBtn">智能纠错</button><div class="markdown-preview mt-16" id="textCorrectionResult" style="display:none"></div></div></div>`;

PageInits.securityReview = () => {
  const config = Store.get('securityConfig') || {};
  const records = Store.get('reviewRecords') || [];

  document.getElementById('secTotalPublish').textContent = config.spamStats.total;
  document.getElementById('secSpamCount').textContent = config.spamStats.spam;
  document.getElementById('secSpamRate').textContent = config.spamStats.rate + '%';

  // 配置标签
  function renderSecurityTab(tab) {
    if (tab === 'keywords') {
      document.getElementById('securityTabContent').innerHTML = `
        <div class="grid-2"><div class="card"><div class="card-header"><span class="card-title">关键词列表</span><button class="btn btn-outline btn-sm" id="addKeywordBtn">+ 添加</button></div><div class="card-body"><div id="keywordList">${config.keywords.map(k => `<span class="badge badge-danger" style="margin:4px;font-size:13px;padding:6px 12px">${k} <span style="cursor:pointer;margin-left:4px" class="del-keyword" data-kw="${k}">×</span></span>`).join('')}</div></div></div>
        <div class="card"><div class="card-header"><span class="card-title">忽略词列表</span><button class="btn btn-outline btn-sm" id="addIgnoreBtn">+ 添加</button></div><div class="card-body"><div id="ignoreList">${config.ignoreWords.map(k => `<span class="badge badge-success" style="margin:4px;font-size:13px;padding:6px 12px">${k} <span style="cursor:pointer;margin-left:4px" class="del-ignore" data-kw="${k}">×</span></span>`).join('')}</div></div></div></div>`;
      document.getElementById('addKeywordBtn').addEventListener('click', () => {
        const kw = prompt('输入关键词:');
        if (kw) { config.keywords.push(kw); Store.set('securityConfig', config); renderSecurityTab('keywords'); }
      });
      document.getElementById('addIgnoreBtn').addEventListener('click', () => {
        const kw = prompt('输入忽略词:');
        if (kw) { config.ignoreWords.push(kw); Store.set('securityConfig', config); renderSecurityTab('keywords'); }
      });
      document.querySelectorAll('.del-keyword').forEach(el => {
        el.addEventListener('click', () => {
          config.keywords = config.keywords.filter(k => k !== el.dataset.kw);
          Store.set('securityConfig', config);
          renderSecurityTab('keywords');
        });
      });
      document.querySelectorAll('.del-ignore').forEach(el => {
        el.addEventListener('click', () => {
          config.ignoreWords = config.ignoreWords.filter(k => k !== el.dataset.kw);
          Store.set('securityConfig', config);
          renderSecurityTab('keywords');
        });
      });
    } else if (tab === 'blacklist') {
      document.getElementById('securityTabContent').innerHTML = `
        <div class="grid-2"><div class="card"><div class="card-header"><span class="card-title">黑名单用户</span><button class="btn btn-outline btn-sm" id="addBlackBtn">+ 添加</button></div><div class="card-body"><div id="blackList">${config.blacklist.map(u => `<span class="badge badge-danger" style="margin:4px;font-size:13px;padding:6px 12px">${u} <span style="cursor:pointer;margin-left:4px" class="del-black" data-u="${u}">×</span></span>`).join('')}</div></div></div>
        <div class="card"><div class="card-header"><span class="card-title">白名单用户</span><button class="btn btn-outline btn-sm" id="addWhiteBtn">+ 添加</button></div><div class="card-body"><div id="whiteList">${config.whitelist.map(u => `<span class="badge badge-success" style="margin:4px;font-size:13px;padding:6px 12px">${u} <span style="cursor:pointer;margin-left:4px" class="del-white" data-u="${u}">×</span></span>`).join('')}</div></div></div></div>`;
    } else if (tab === 'imageList') {
      document.getElementById('securityTabContent').innerHTML = `
        <div class="card"><div class="card-header"><span class="card-title">图片黑名单</span><button class="btn btn-outline btn-sm" id="addImgBtn">+ 添加</button></div><div class="card-body"><div>${config.imageBlacklist.map(h => `<span class="badge badge-warning" style="margin:4px;font-size:13px;padding:6px 12px">${h}</span>`).join('')}</div></div></div>`;
    }
  }

  document.querySelectorAll('#securityTabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#securityTabs .tab-item').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      renderSecurityTab(tab.dataset.tab);
    });
  });
  renderSecurityTab('keywords');

  // 审核记录
  function renderReviewTab(tab) {
    const filtered = records.filter(r => {
      if (tab === 'text') return r.type === '文本';
      if (tab === 'image') return r.type === '图片';
      if (tab === 'doc') return r.type === '文档';
      if (tab === 'course') return r.type === '课程';
      return true;
    });
    document.getElementById('reviewTabContent').innerHTML = filtered.length ? filtered.map(r => `
      <div class="review-card ${r.result==='通过'?'pass':r.result==='拦截'?'fail':'pending'}"><div class="flex-between"><div><b>${r.content}</b><span class="badge badge-info" style="margin-left:8px">${r.type}</span></div><span class="badge badge-${r.result==='通过'?'success':r.result==='拦截'?'danger':'warning'}">${r.result}</span></div><div class="flex-between mt-8"><span style="font-size:12px;color:var(--text-muted)">${r.time} | 审核人: ${r.reviewer}</span>${r.reason?`<span style="font-size:12px;color:var(--danger)">原因: ${r.reason}</span>`:''}</div></div>
    `).join('') : '<div class="empty-state"><p>暂无审核记录</p></div>';
  }

  document.querySelectorAll('#reviewTabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#reviewTabs .tab-item').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      renderReviewTab(tab.dataset.tab);
    });
  });
  renderReviewTab('text');

  // 文本纠错
  document.getElementById('textCorrectionBtn').addEventListener('click', () => {
    const input = document.getElementById('textCorrectionInput').value.trim();
    if (!input) { App.showToast('请输入需要纠错的文本', 'warning'); return; }
    const result = document.getElementById('textCorrectionResult');

    const corrections = [
      { wrong: '气官', right: '器官', type: '错别字' },
      { wrong: '己经', right: '已经', type: '错别字' },
      { wrong: '在次', right: '再次', type: '错别字' },
      { wrong: '祟高', right: '崇高', type: '错别字' },
      { wrong: '重耍', right: '重要', type: '错别字' },
      { wrong: '介决', right: '解决', type: '错别字' },
      { wrong: '脉博', right: '脉搏', type: '错别字' },
      { wrong: '痉孪', right: '痉挛', type: '错别字' },
      { wrong: '按装', right: '安装', type: '错别字' },
      { wrong: '布署', right: '部署', type: '错别字' },
      { wrong: '罗缉', right: '逻辑', type: '错别字' },
      { wrong: '不光', right: '不光', type: '✓' },
    ];

    let foundCount = 0;
    let correctedDisplay = input;
    let foundItems = [];

    for (const c of corrections) {
      if (input.includes(c.wrong) && c.type !== '✓') {
        foundCount++;
        const pos = input.indexOf(c.wrong);
        foundItems.push({ pos, wrong: c.wrong, right: c.right, type: c.type });
        correctedDisplay = correctedDisplay.replace(
          new RegExp(c.wrong, 'g'),
          `<span style="color:var(--danger);text-decoration:line-through;font-weight:600">${c.wrong}</span><span style="color:var(--success);font-weight:600;margin-left:2px">→ ${c.right}</span>`
        );
      }
    }

    // 语法/搭配检查
    const grammarChecks = [
      { pattern: /通过(\S+)方法/, fix: null, tip: '建议改为"通过...方式"或"采用...方法"' },
      { pattern: /据(\S+)显示/, fix: null, tip: '建议改为"据...报道"或"据...统计"' },
      { pattern: /原因是?由于/, fix: null, tip: '"原因"与"由于"语义重复，建议删去其一' },
      { pattern: /目的是为了/, fix: null, tip: '"目的"与"为了"语义重复，建议删去"为了"' },
    ];

    let grammarTips = [];
    for (const g of grammarChecks) {
      if (g.pattern.test(input)) {
        grammarTips.push(g.tip);
      }
    }

    if (foundCount === 0 && grammarTips.length === 0) {
      result.innerHTML = '<p style="color:var(--success);font-size:15px">✅ 未发现拼写、语法或搭配错误，文本质量良好。</p>';
    } else {
      let html = '<h4 style="margin-bottom:12px">纠错结果：</h4>';
      if (foundCount > 0) {
        html += `<p style="margin-bottom:8px;font-size:13px;color:var(--danger)">🔍 发现 ${foundCount} 处拼写错误：</p>`;
        html += `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:12px;line-height:2">${correctedDisplay}</div>`;
        html += '<table style="margin-bottom:12px"><thead><tr><th>错词</th><th>建议</th><th>类型</th></tr></thead><tbody>';
        foundItems.forEach(f => {
          html += `<tr><td><span style="color:var(--danger)">${f.wrong}</span></td><td><span style="color:var(--success);font-weight:600">${f.right}</span></td><td><span class="badge badge-warning">${f.type}</span></td></tr>`;
        });
        html += '</tbody></table>';
      }
      if (grammarTips.length > 0) {
        html += `<p style="margin-bottom:8px;font-size:13px;color:var(--warning)">⚠️ 发现 ${grammarTips.length} 处语法/搭配问题：</p>`;
        html += '<ul style="margin-bottom:12px">';
        grammarTips.forEach(t => { html += `<li style="margin:4px 0;font-size:13px;color:var(--text-secondary)">${t}</li>`; });
        html += '</ul>';
      }
      html += `<p style="color:var(--success);font-size:13px">✅ 已识别 ${foundCount + grammarTips.length} 处问题并提供修改建议。</p>`;
      result.innerHTML = html;
    }
    result.style.display = 'block';
  });
};