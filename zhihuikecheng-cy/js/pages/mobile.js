/* 移动端学习 */
PageRenderers.mobile = () => `
<div class="page-header"><h2>移动端学习</h2><p>支持微信公众号、移动APP访问知识图谱，随时随地个性化学习</p></div>
<div class="mobile-simulator" id="mobileSimulator">
  <div class="mobile-status-bar"><span>9:41</span><span>■■■■ 5G</span></div>
  <div class="mobile-header" id="mobileHeader">知识图谱</div>
  <div class="mobile-content" id="mobileContent"></div>
  <div class="mobile-tab-bar">
    <div class="mobile-tab-item active" data-mode="graph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/></svg><span>图谱模式</span></div>
    <div class="mobile-tab-item" data-mode="outline"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg><span>大纲模式</span></div>
    <div class="mobile-tab-item" data-mode="map"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg><span>学习地图</span></div>
  </div>
</div>`;

PageInits.mobile = () => {
  const points = Store.get('knowledgePoints');
  const microCourses = Store.get('microCourses');
  const header = document.getElementById('mobileHeader');
  const content = document.getElementById('mobileContent');
  let currentMode = 'graph';

  function renderGraphMode() {
    header.textContent = '知识图谱';
    const ps = points.filter(p => p.courseId === 1);
    let html = '<div style="padding:12px;position:relative;min-height:520px;background:#fafbfc;overflow:auto">';
    html += '<div style="margin-bottom:8px;font-size:12px;color:var(--text-muted);display:flex;gap:12px"><button class="btn btn-outline btn-sm active" id="navModeBtn">导航模式</button><button class="btn btn-outline btn-sm" id="globalModeBtn">全局模式</button><input type="text" class="form-input" style="width:120px;height:28px;margin-left:auto;font-size:12px" placeholder="搜索知识点..." id="mobileSearch"></div>';
    html += '<div style="display:flex;gap:8px"><div style="width:140px;flex-shrink:0;background:#fff;border-radius:8px;padding:8px;max-height:420px;overflow-y:auto" id="mobileNavList">';
    // 按层级组织
    const roots = ps.filter(p => p.level === 1);
    roots.forEach(root => {
      html += `<div style="padding:6px 8px;font-weight:600;font-size:12px;border-bottom:1px solid var(--border-light);cursor:pointer" class="mobile-nav-item" data-id="${root.id}">📁 ${root.name}</div>`;
      const children = ps.filter(p => p.parentId === root.id);
      children.forEach(child => {
        html += `<div style="padding:4px 8px 4px 16px;font-size:11px;cursor:pointer;color:var(--text-secondary)" class="mobile-nav-item" data-id="${child.id}">📄 ${child.name}</div>`;
      });
    });
    html += '</div>';
    html += '<div style="flex:1;position:relative;background:#fff;border-radius:8px;min-height:420px" id="mobileGraphArea">';
    // 简化图谱
    ps.forEach(p => {
      const cls = p.level === 1 ? 'root' : (p.mastered >= 80 ? 'mastered' : (p.mastered >= 50 ? 'in-progress' : 'not-started'));
      html += `<div class="kg-node ${cls}" style="left:${(p.x-350)*0.5+20}px;top:${(p.y)*0.5+10}px;font-size:10px;padding:4px 10px;cursor:pointer" data-id="${p.id}">${p.name}</div>`;
    });
    html += '</div></div></div>';
    content.innerHTML = html;

    // 连线
    const graphArea = document.getElementById('mobileGraphArea');
    let lineHTML = '';
    ps.forEach(p => {
      if (p.parentId) {
        const parent = ps.find(pp => pp.id === p.parentId);
        if (parent) {
          lineHTML += `<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"><line x1="${(parent.x-350)*0.5+20}" y1="${(parent.y)*0.5+10}" x2="${(p.x-350)*0.5+20}" y2="${(p.y)*0.5+10}" stroke="#d1d5db" stroke-width="1"/></svg>`;
        }
      }
    });
    graphArea.innerHTML = lineHTML + graphArea.innerHTML;

    // 点击事件
    document.querySelectorAll('#mobileGraphArea .kg-node, .mobile-nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        const pt = ps.find(p => p.id === id);
        if (pt) showMicroCourse(pt);
      });
    });

    document.getElementById('mobileSearch')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.mobile-nav-item').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  function renderOutlineMode() {
    header.textContent = '课程大纲';
    const ps = points.filter(p => p.courseId === 1);
    let html = '<div style="padding:12px"><input type="text" class="form-input" placeholder="搜索知识点..." style="margin-bottom:12px;font-size:13px" id="outlineSearch">';
    const roots = ps.filter(p => p.level === 1);
    roots.forEach(root => {
      html += `<div style="padding:10px;background:#fff;border-radius:8px;margin-bottom:8px;box-shadow:var(--shadow-sm)"><div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:8px;cursor:pointer" class="outline-item" data-id="${root.id}"><span style="color:var(--success)">●</span> ${root.name}<span style="margin-left:auto;font-size:11px;color:var(--text-muted)">掌握${root.mastered}%</span></div>`;
      const children = ps.filter(p => p.parentId === root.id);
      children.forEach(child => {
        html += `<div style="padding:8px 8px 8px 24px;font-size:13px;border-bottom:1px solid var(--border-light);cursor:pointer;display:flex;align-items:center;gap:8px" class="outline-item" data-id="${child.id}"><span style="color:${child.mastered>=80?'var(--success)':child.mastered>=50?'var(--warning)':'var(--text-muted)'}">●</span> ${child.name}<span style="margin-left:auto;font-size:11px;color:var(--text-muted)">完成${child.completed}%</span></div>`;
      });
      html += '</div>';
    });
    html += '</div>';
    content.innerHTML = html;

    document.querySelectorAll('.outline-item').forEach(el => {
      el.addEventListener('click', () => {
        const pt = ps.find(p => p.id === parseInt(el.dataset.id));
        if (pt) showMicroCourse(pt);
      });
    });
  }

  function renderMapMode() {
    header.textContent = '学习地图';
    const ps = points.filter(p => p.courseId === 1);
    let html = '<div style="padding:12px;overflow-y:auto;max-height:580px"><div class="path-map" style="padding:20px 10px">';
    const roots = ps.filter(p => p.level === 1);
    roots.forEach(root => {
      const cls = root.mastered >= 80 ? 'completed' : (root.mastered >= 50 ? 'current' : '');
      html += `<div class="path-node ${cls}" data-id="${root.id}"><b>${root.name}</b><p style="font-size:10px;color:var(--text-muted);margin-top:4px">掌握率 ${root.mastered}%</p><div class="progress-bar mt-4" style="width:100%"><div class="progress-fill ${root.mastered>=80?'success':'warning'}" style="width:${root.mastered}%"></div></div></div>`;
      html += '<div class="path-connector completed"></div>';
      const children = ps.filter(p => p.parentId === root.id);
      html += '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">';
      children.forEach(child => {
        const cls2 = child.mastered >= 80 ? 'completed' : (child.mastered >= 50 ? 'current' : '');
        html += `<div class="path-node ${cls2}" style="width:140px;padding:10px" data-id="${child.id}"><b style="font-size:11px">${child.name}</b><p style="font-size:10px;color:var(--text-muted);margin-top:4px">完成 ${child.completed}%</p></div>`;
      });
      html += '</div>';
      if (roots.indexOf(root) < roots.length - 1) html += '<div class="path-connector"></div>';
    });
    html += '</div></div>';
    content.innerHTML = html;

    document.querySelectorAll('.path-node').forEach(el => {
      el.addEventListener('click', () => {
        const pt = ps.find(p => p.id === parseInt(el.dataset.id));
        if (pt) showMicroCourse(pt);
      });
    });
  }

  function showMicroCourse(pt) {
    const mc = microCourses.find(m => m.knowledgeId === pt.id);
    header.textContent = pt.name;
    content.innerHTML = `
      <div style="padding:12px">
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:var(--shadow-sm)">
          <h4 style="font-size:15px">${pt.name}</h4>
          <div style="display:flex;gap:8px;margin-top:8px"><span style="font-size:12px;color:var(--text-muted)">掌握率: ${pt.mastered}%</span><span style="font-size:12px;color:var(--text-muted)">完成率: ${pt.completed}%</span></div>
          <div class="progress-bar mt-4"><div class="progress-fill ${pt.mastered>=80?'success':'warning'}" style="width:${pt.mastered}%"></div></div>
        </div>
        <div class="tabs" style="overflow-x:auto;flex-wrap:nowrap" id="mobileMicroTabs">
          <div class="tab-item active" data-tab="analysis" style="font-size:11px;padding:8px 12px">分析</div>
          <div class="tab-item" data-tab="content" style="font-size:11px;padding:8px 12px">学习内容</div>
          <div class="tab-item" data-tab="selftest" style="font-size:11px;padding:8px 12px">自测</div>
          <div class="tab-item" data-tab="materials" style="font-size:11px;padding:8px 12px">资料</div>
          <div class="tab-item" data-tab="errors" style="font-size:11px;padding:8px 12px">错题集</div>
          <div class="tab-item" data-tab="discussion" style="font-size:11px;padding:8px 12px">讨论</div>
        </div>
        <div id="mobileMicroTabContent" style="background:#fff;border-radius:0 0 12px 12px;padding:12px"></div>
        <button class="btn btn-ghost btn-sm w-full mt-8" id="mobileBackBtn">← 返回图谱</button>
      </div>`;

    const tabContents = {
      analysis: `<div><b>学习分析</b><p style="font-size:12px;color:var(--text-muted);margin-top:4px">掌握率: ${pt.mastered}% | 建议学习时长: 15分钟</p><div class="progress-bar mt-4"><div class="progress-fill success" style="width:${pt.mastered}%"></div></div></div>`,
      content: `<div><b>学习内容</b><div style="background:#f0f2f5;border-radius:8px;padding:30px;text-align:center;margin-top:8px"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg><p style="font-size:12px;color:var(--text-muted);margin-top:4px">${mc ? mc.name : '微课视频'}</p></div></div>`,
      selftest: `<div><b>自测练习</b><div style="margin-top:8px" id="selftestQuestions"><p style="font-size:12px;margin-bottom:8px">1. 以下哪项是骨骼的主要功能？</p><div style="margin-bottom:12px"><label class="form-check"><input type="radio" name="mq1" value="A"> A. 产生热量</label><label class="form-check"><input type="radio" name="mq1" value="B"> B. 支撑身体</label><label class="form-check"><input type="radio" name="mq1" value="C"> C. 消化食物</label></div><p style="font-size:12px;margin-bottom:8px">2. 人体最大的骨骼是？</p><div style="margin-bottom:12px"><label class="form-check"><input type="radio" name="mq2" value="A"> A. 肱骨</label><label class="form-check"><input type="radio" name="mq2" value="B"> B. 脊柱</label><label class="form-check"><input type="radio" name="mq2" value="C"> C. 股骨</label></div></div><button class="btn btn-primary btn-sm mt-8" id="mobileSelftestSubmit">提交</button><div id="mobileSelftestResult" style="margin-top:8px;display:none"></div></div>`,
      materials: `<div><b>学习资料</b><div style="margin-top:8px"><div style="padding:8px;border-bottom:1px solid var(--border-light);font-size:12px">📄 教材文档.pdf</div><div style="padding:8px;border-bottom:1px solid var(--border-light);font-size:12px">📊 PPT课件.pptx</div><div style="padding:8px;font-size:12px">🔗 推荐阅读资料</div></div></div>`,
      errors: `<div><b>错题集</b><div style="margin-top:8px;padding:8px;background:var(--danger-bg);border-radius:8px"><p style="font-size:12px"><b>错题:</b> 骨骼的主要功能</p><p style="font-size:11px;color:var(--danger)">你的答案: A | 正确答案: B</p></div></div>`,
      discussion: `<div><b>讨论区</b><div style="margin-top:8px" id="mobileDiscussionList"><div style="padding:8px;background:#f9fafb;border-radius:8px;margin-bottom:8px"><p style="font-size:12px"><b>李明:</b> 这个知识点讲解很清晰！</p><p style="font-size:10px;color:var(--text-muted)">2026-08-10</p></div></div><div style="display:flex;gap:8px;margin-top:8px"><input type="text" class="form-input" id="mobileDiscussionInput" style="font-size:12px;flex:1" placeholder="发表讨论..."><button class="btn btn-primary btn-sm" id="mobileDiscussionSend">发送</button></div></div>`,
    };
    document.getElementById('mobileMicroTabContent').innerHTML = tabContents.analysis;

    document.querySelectorAll('#mobileMicroTabs .tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#mobileMicroTabs .tab-item').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('mobileMicroTabContent').innerHTML = tabContents[tab.dataset.tab] || '';
        bindMobileTabEvents(tab.dataset.tab);
      });
    });

    function bindMobileTabEvents(tabName) {
      if (tabName === 'selftest') {
        const submitBtn = document.getElementById('mobileSelftestSubmit');
        if (submitBtn) {
          submitBtn.addEventListener('click', () => {
            const q1 = document.querySelector('input[name="mq1"]:checked');
            const q2 = document.querySelector('input[name="mq2"]:checked');
            if (!q1 || !q2) { App.showToast('请完成所有题目', 'warning'); return; }

            const resultDiv = document.getElementById('mobileSelftestResult');
            const correct = (q1.value === 'B' ? 1 : 0) + (q2.value === 'C' ? 1 : 0);
            if (correct === 2) {
              resultDiv.innerHTML = '<div style="background:var(--success-bg);padding:12px;border-radius:8px"><p style="color:var(--success);font-weight:600">✅ 全部正确！</p><p style="font-size:12px;color:var(--text-secondary)">2/2 题答对，掌握情况良好</p></div>';
            } else {
              let detail = '';
              if (q1.value !== 'B') detail += '<p style="font-size:12px;color:var(--danger)">第1题错误：骨骼的主要功能是支撑身体，正确答案是B</p>';
              if (q2.value !== 'C') detail += '<p style="font-size:12px;color:var(--danger)">第2题错误：人体最大的骨骼是股骨，正确答案是C</p>';
              resultDiv.innerHTML = `<div style="background:var(--danger-bg);padding:12px;border-radius:8px"><p style="color:var(--danger);font-weight:600">❌ 答对 ${correct}/2 题</p>${detail}</div>`;
            }
            resultDiv.style.display = 'block';
            submitBtn.disabled = true;
            submitBtn.textContent = '已提交';
          });
        }
      }
      if (tabName === 'discussion') {
        const sendBtn = document.getElementById('mobileDiscussionSend');
        const input = document.getElementById('mobileDiscussionInput');
        if (sendBtn && input) {
          sendBtn.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) return;
            const now = new Date();
            const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            const list = document.getElementById('mobileDiscussionList');
            list.innerHTML += `<div style="padding:8px;background:var(--primary-bg);border-radius:8px;margin-bottom:8px"><p style="font-size:12px"><b>${App.currentUser?.name||'我'}:</b> ${text}</p><p style="font-size:10px;color:var(--text-muted)">${timeStr}</p></div>`;
            input.value = '';
            App.showToast('讨论已发表', 'success');
          });
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendBtn.click();
          });
        }
      }
    }

    document.getElementById('mobileBackBtn').addEventListener('click', () => {
      renderCurrentMode();
    });
  }

  function renderCurrentMode() {
    if (currentMode === 'graph') renderGraphMode();
    else if (currentMode === 'outline') renderOutlineMode();
    else renderMapMode();
  }

  document.querySelectorAll('.mobile-tab-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.mobile-tab-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      currentMode = item.dataset.mode;
      renderCurrentMode();
    });
  });

  renderGraphMode();
};