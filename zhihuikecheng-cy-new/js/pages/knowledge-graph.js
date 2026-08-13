/* ============================================
   图谱页面 - Cytoscape.js 专业可视化
   基于成熟教学平台演示真实课程
   ============================================ */

// Cytoscape.js 图谱工厂
const CyGraph = {
  create(containerId, elements, style, layout, callbacks) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const cy = cytoscape({
      container,
      elements,
      style,
      layout,
      wheelSensitivity: 0.3,
      minZoom: 0.4,
      maxZoom: 2.5,
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (callbacks.onNodeClick) callbacks.onNodeClick(node.data());
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      container.style.cursor = 'pointer';
      if (callbacks.onNodeHover) callbacks.onNodeHover(node, evt);
    });

    cy.on('mouseout', 'node', () => {
      container.style.cursor = 'default';
      if (callbacks.onNodeOut) callbacks.onNodeOut();
    });

    if (callbacks.onReady) callbacks.onReady(cy);
    return cy;
  },

  destroy(cy) {
    if (cy && !cy.destroyed()) cy.destroy();
  },
};

/* ============================================
   知识图谱建设
   ============================================ */
PageRenderers.knowledgeGraph = () => `
<div class="page-header">
  <h2>知识图谱</h2>
  <p>课程：人体解剖学 — 94个知识点按人体结构排列，可视化展示人体各系统组成与关联</p>
</div>
<div class="card">
  <div class="card-header">
    <span class="card-title">知识图谱可视化</span>
    <div class="btn-group">
      <select class="form-select" id="kgCourseSelect" style="width:200px"></select>
      <button class="btn btn-outline active" id="kgLayoutBody">🧬 人体布局</button>
      <button class="btn btn-outline" id="kgLayoutHierarchy">层次布局</button>
      <button class="btn btn-outline" id="kgLayoutTree">树形布局</button>
      <button class="btn btn-primary" id="kgAddNodeBtn">+ 添加知识点</button>
      <button class="btn btn-outline" id="kgImportBtn">批量导入</button>
      <button class="btn btn-outline" id="kgExportBtn">导出数据</button>
    </div>
  </div>
  <div class="card-body">
    <div class="kg-legend">
      <span>知识点总数: <b id="kgTotalCount">0</b></span>
      <span>建设率: <b id="kgBuildRate">0%</b></span>
      <span>关联资源: <b id="kgResourceCount">0</b></span>
      <span style="margin-left:auto">图例:</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#4f46e5"></span> 骨骼</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#ef4444"></span> 肌肉</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#8b5cf6"></span> 神经</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#f43f5e"></span> 循环</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#06b6d4"></span> 呼吸</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#f97316"></span> 消化</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#6366f1"></span> 泌尿</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#ec4899"></span> 内分泌</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#e11d48"></span> 生殖</span>
      <span class="kg-legend-item"><span class="kg-legend-dot" style="background:#14b8a6"></span> 感觉</span>
    </div>
    <div class="cy-container" id="kgCyContainer" style="height:820px"></div>
    <div class="cy-tooltip" id="kgTooltip"></div>
  </div>
</div>
<div class="card" style="margin-top:16px">
  <div class="card-header"><span class="card-title">知识点列表</span></div>
  <div class="card-body"><table><thead><tr><th>知识点名称</th><th>所属系统</th><th>层级</th><th>标签</th><th>分类</th><th>掌握率</th><th>完成率</th><th>操作</th></tr></thead><tbody id="kgTableBody"></tbody></table></div>
</div>`;

PageInits.knowledgeGraph = () => {
  const courses = Store.get('courses') || [];
  const points = Store.get('knowledgePoints') || [];
  let currentCourseId = 1;
  let currentLayout = 'body';
  let cy;

  const courseSelect = document.getElementById('kgCourseSelect');
  courseSelect.innerHTML = courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  // 系统颜色映射
  const SYS_COLORS = {
    root:      '#4f46e5',
    bone:      '#4f46e5',
    muscle:    '#ef4444',
    nerve:     '#8b5cf6',
    heart:     '#f43f5e',
    lung:      '#06b6d4',
    stomach:   '#f97316',
    kidney:    '#6366f1',
    endocrine: '#ec4899',
    urogenital:'#e11d48',
    eye:       '#14b8a6',
  };

  const SYS_NAMES = {
    root: '根节点', bone: '骨骼系统', muscle: '肌肉系统', nerve: '神经系统',
    heart: '循环系统', lung: '呼吸系统', stomach: '消化系统', kidney: '泌尿系统',
    endocrine: '内分泌系统', urogenital: '生殖系统', eye: '感觉系统',
  };

  function getNodeColor(pt) {
    if (pt.system && SYS_COLORS[pt.system]) return SYS_COLORS[pt.system];
    if (pt.level === 1) return '#4f46e5';
    if (pt.mastered >= 80) return '#10b981';
    if (pt.mastered >= 50) return '#f59e0b';
    return '#9ca3af';
  }

  function getNodeLabel(pt) {
    const maxLen = currentLayout === 'body' ? 8 : 10;
    return pt.name.length > maxLen ? pt.name.slice(0, maxLen) + '…' : pt.name;
  }

  function renderGraph(courseId) {
    currentCourseId = courseId;
    const coursePoints = points.filter(p => p.courseId === courseId);

    // 更新统计
    document.getElementById('kgTotalCount').textContent = coursePoints.length;
    const built = coursePoints.filter(p => p.completed > 0).length;
    document.getElementById('kgBuildRate').textContent = coursePoints.length ? Math.round(built / coursePoints.length * 100) + '%' : '0%';
    document.getElementById('kgResourceCount').textContent = coursePoints.length * 3;

    // 构建 cytoscape elements
    const nodes = coursePoints.map(p => ({
      data: {
        id: 'n' + p.id,
        label: getNodeLabel(p),
        fullName: p.name,
        level: p.level,
        system: p.system || '',
        mastered: p.mastered,
        completed: p.completed,
        category: p.category,
        tags: p.tags || [],
        parentId: p.parentId,
        origId: p.id,
        x: p.x || 0,
        y: p.y || 0,
      },
    }));

    const edges = [];
    coursePoints.forEach(p => {
      if (p.parentId) {
        const parent = coursePoints.find(pp => pp.id === p.parentId);
        if (parent) {
          edges.push({
            data: {
              id: 'e' + p.parentId + '_' + p.id,
              source: 'n' + p.parentId,
              target: 'n' + p.id,
            },
          });
        }
      }
    });

    const elements = [...nodes, ...edges];

    // 样式
    const style = [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '11px',
          'font-family': '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
          'color': '#ffffff',
          'font-weight': '500',
          'text-wrap': 'wrap',
          'text-max-width': '90px',
          'background-color': '#9ca3af',
          'shape': 'round-rectangle',
          'width': 'label',
          'height': 'label',
          'padding': '8px',
          'border-width': 2,
          'border-color': '#ffffff',
          'text-outline-color': 'transparent',
          'text-outline-width': 0,
          'transition-property': 'background-color, border-color, width, height, opacity',
          'transition-duration': '0.2s',
        },
      },
      {
        selector: 'node[level=1]',
        style: {
          'background-color': '#4f46e5',
          'font-size': '14px',
          'font-weight': '600',
          'width': 150,
          'height': 42,
          'padding': '14px',
          'border-width': 3,
          'border-color': '#c7d2fe',
          'text-max-width': '130px',
        },
      },
      {
        selector: 'node[level=2]',
        style: {
          'font-size': '12px',
          'font-weight': '600',
          'width': 120,
          'height': 34,
          'padding': '10px',
          'text-max-width': '100px',
        },
      },
      {
        selector: 'node[level=3]',
        style: {
          'font-size': '10px',
          'width': 'label',
          'height': 'label',
          'padding': '6px',
          'text-max-width': '80px',
        },
      },
      // 系统颜色
      { selector: 'node[system="bone"]',       style: { 'background-color': '#4f46e5' } },
      { selector: 'node[system="muscle"]',     style: { 'background-color': '#ef4444' } },
      { selector: 'node[system="nerve"]',      style: { 'background-color': '#8b5cf6' } },
      { selector: 'node[system="heart"]',      style: { 'background-color': '#f43f5e' } },
      { selector: 'node[system="lung"]',       style: { 'background-color': '#06b6d4' } },
      { selector: 'node[system="stomach"]',    style: { 'background-color': '#f97316' } },
      { selector: 'node[system="kidney"]',     style: { 'background-color': '#6366f1' } },
      { selector: 'node[system="endocrine"]',  style: { 'background-color': '#ec4899' } },
      { selector: 'node[system="urogenital"]', style: { 'background-color': '#e11d48' } },
      { selector: 'node[system="eye"]',        style: { 'background-color': '#14b8a6' } },
      {
        selector: 'edge',
        style: {
          'width': 1.2,
          'line-color': '#cbd5e1',
          'target-arrow-color': '#cbd5e1',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.6,
          'curve-style': 'bezier',
          'transition-property': 'line-color, opacity',
          'transition-duration': '0.2s',
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#1e1b4b',
          'border-opacity': 0.9,
        },
      },
    ];

    // 布局
    let layout;
    if (currentLayout === 'body') {
      layout = {
        name: 'preset',
        positions: (node) => {
          return { x: node.data('x'), y: node.data('y') };
        },
        animate: true,
        animationDuration: 600,
        fit: true,
        padding: 30,
      };
    } else if (currentLayout === 'tree') {
      layout = { name: 'breadthfirst', directed: true, spacingFactor: 1.15, animate: true, animationDuration: 500 };
    } else {
      layout = { name: 'concentric', concentric: (node) => node.data('level'), minNodeSpacing: 50, animate: true, animationDuration: 500 };
    }

    // 销毁旧实例
    if (cy) { cy.destroy(); cy = null; }
    document.getElementById('kgCyContainer').innerHTML = '';

    // 人体布局时添加背景样式
    const cont = document.getElementById('kgCyContainer');
    cont.classList.toggle('body-layout', currentLayout === 'body');

    // 创建新实例
    cy = cytoscape({
      container: document.getElementById('kgCyContainer'),
      elements,
      style,
      layout,
      wheelSensitivity: 0.3,
      minZoom: 0.4,
      maxZoom: 2.5,
    });

    // 根据掌握率动态着色（仅在非人体布局时覆盖）
    cy.nodes().forEach(node => {
      const level = node.data('level');
      const mastered = node.data('mastered');
      const sys = node.data('system');
      if (level === 1) {
        node.style('background-color', '#4f46e5');
      } else if (currentLayout === 'body') {
        // 人体布局保持系统颜色，但降低未掌握节点不透明度
        if (sys && SYS_COLORS[sys]) {
          node.style('background-color', SYS_COLORS[sys]);
          if (mastered < 50) node.style('opacity', '0.55');
          else if (mastered < 80) node.style('opacity', '0.8');
          else node.style('opacity', '1');
        }
      } else if (mastered >= 80) {
        node.style('background-color', '#10b981');
      } else if (mastered >= 50) {
        node.style('background-color', '#f59e0b');
      } else {
        node.style('background-color', '#9ca3af');
      }
    });

    // 人体布局中隐藏连线，保持画面干净
    if (currentLayout === 'body') {
      cy.edges().forEach(e => e.style('opacity', '0.08'));
    } else {
      cy.edges().forEach(e => e.style('opacity', '1'));
    }

    // Tooltip
    const tooltip = document.getElementById('kgTooltip');
    const container = document.getElementById('kgCyContainer');

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      container.style.cursor = 'pointer';
      const sys = node.data('system');
      const sysName = SYS_NAMES[sys] || '';
      const sysHint = sysName ? ' — ' + sysName : '';
      tooltip.textContent = node.data('fullName') + ' (L' + node.data('level') + sysHint + ') — 掌握率 ' + node.data('mastered') + '%';
      tooltip.classList.add('visible');
      tooltip.style.left = (evt.originalEvent.clientX - container.getBoundingClientRect().left + 16) + 'px';
      tooltip.style.top = (evt.originalEvent.clientY - container.getBoundingClientRect().top - 36) + 'px';
    });

    cy.on('mousemove', 'node', (evt) => {
      tooltip.style.left = (evt.originalEvent.clientX - container.getBoundingClientRect().left + 16) + 'px';
      tooltip.style.top = (evt.originalEvent.clientY - container.getBoundingClientRect().top - 36) + 'px';
    });

    cy.on('mouseout', 'node', () => {
      container.style.cursor = 'default';
      tooltip.classList.remove('visible');
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const pt = coursePoints.find(p => p.id === node.data('origId'));
      if (pt) showKnowledgePointDetail(pt, coursePoints);
    });

    // 渲染表格
    document.getElementById('kgTableBody').innerHTML = coursePoints.map(p => {
      const indent = '　'.repeat(Math.max(0, p.level - 1));
      const sysName = SYS_NAMES[p.system] || '—';
      return `<tr>
        <td>${indent}${p.name}</td>
        <td><span class="badge" style="background:${SYS_COLORS[p.system]||'#9ca3af'};color:#fff;font-size:11px">${sysName}</span></td>
        <td>L${p.level}</td>
        <td>${(p.tags||[]).map(t => `<span class="badge badge-warning" style="margin-right:4px">${t}</span>`).join('')}</td>
        <td>${p.category}</td>
        <td><div style="display:flex;align-items:center;gap:6px"><div class="progress-bar" style="width:80px"><div class="progress-fill ${p.mastered>=80?'success':p.mastered>=50?'warning':'danger'}" style="width:${p.mastered}%"></div></div>${p.mastered}%</div></td>
        <td><div style="display:flex;align-items:center;gap:6px"><div class="progress-bar" style="width:80px"><div class="progress-fill primary" style="width:${p.completed}%"></div></div>${p.completed}%</div></td>
        <td><button class="btn btn-outline btn-sm kg-edit-btn" data-id="${p.id}">编辑</button></td>
      </tr>`;
    }).join('');

    bindEditButtons(coursePoints);
  }

  function bindEditButtons(coursePoints) {
    document.querySelectorAll('.kg-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pt = coursePoints.find(p => p.id === parseInt(btn.dataset.id));
        if (!pt) return;
        App.showModal('编辑知识点 - ' + pt.name, `
          <div class="form-group"><label class="form-label">知识点名称</label><input class="form-input" id="editKgName" value="${pt.name}"></div>
          <div class="form-row"><div class="form-group"><label class="form-label">所属系统</label><select class="form-select" id="editKgSystem">${Object.entries(SYS_NAMES).filter(([k]) => k !== 'root').map(([k, v]) => `<option value="${k}" ${pt.system===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">分类</label><select class="form-select" id="editKgCategory"><option ${pt.category==='事实性'?'selected':''}>事实性</option><option ${pt.category==='概念性'?'selected':''}>概念性</option><option ${pt.category==='程序性'?'selected':''}>程序性</option><option ${pt.category==='元认知'?'selected':''}>元认知</option></select></div></div>
          <div class="form-row"><div class="form-group"><label class="form-label">掌握率(%)</label><input class="form-input" id="editKgMastered" type="number" value="${pt.mastered}" min="0" max="100"></div><div class="form-group"><label class="form-label">标签</label><input class="form-input" id="editKgTags" value="${(pt.tags||[]).join(',')}"></div></div>
        `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveKgBtn">保存</button>`);
        document.getElementById('saveKgBtn').addEventListener('click', () => {
          pt.name = document.getElementById('editKgName').value;
          pt.system = document.getElementById('editKgSystem').value;
          pt.category = document.getElementById('editKgCategory').value;
          pt.mastered = parseInt(document.getElementById('editKgMastered').value) || 0;
          pt.tags = document.getElementById('editKgTags').value.split(',').filter(Boolean);
          Store.set('knowledgePoints', points);
          document.querySelector('.modal-overlay').remove();
          App.showToast('知识点已更新', 'success');
          renderGraph(currentCourseId);
        });
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
      });
    });
  }

  function showKnowledgePointDetail(pt, coursePoints) {
    const parent = pt.parentId ? coursePoints.find(p => p.id === pt.parentId) : null;
    const children = coursePoints.filter(p => p.parentId === pt.id);
    const sysName = SYS_NAMES[pt.system] || '—';
    const sysColor = SYS_COLORS[pt.system] || '#9ca3af';
    App.showModal('知识点详情 - ' + pt.name, `
      <div style="margin-bottom:16px"><b>基本信息</b><p>层级: L${pt.level} | 分类: ${pt.category} | 所属系统: <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sysColor};margin-right:4px"></span>${sysName} | 父节点: ${parent?.name || '无'}</p></div>
      <div style="margin-bottom:16px"><b>标签</b><div>${(pt.tags||[]).map(t => `<span class="badge badge-warning" style="margin-right:4px">${t}</span>`).join('') || '无'}</div></div>
      <div style="margin-bottom:16px"><b>掌握率</b><div class="progress-bar mt-4"><div class="progress-fill ${pt.mastered>=80?'success':pt.mastered>=50?'warning':'danger'}" style="width:${pt.mastered}%"></div></div><span style="font-size:12px;color:var(--text-muted)">${pt.mastered}%</span></div>
      <div style="margin-bottom:16px"><b>完成率</b><div class="progress-bar mt-4"><div class="progress-fill primary" style="width:${pt.completed}%"></div></div><span style="font-size:12px;color:var(--text-muted)">${pt.completed}%</span></div>
      ${children.length ? `<div><b>子知识点 (${children.length}个)</b><div style="margin-top:8px">${children.map(c => `<span class="badge badge-info" style="margin-right:4px">${c.name}</span>`).join('')}</div></div>` : ''}
    `, `<button class="btn btn-outline modal-close-btn">关闭</button>`);
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  }

  courseSelect.addEventListener('change', (e) => renderGraph(parseInt(e.target.value)));
  renderGraph(1);

  function setActiveLayoutBtn(activeId) {
    ['kgLayoutBody', 'kgLayoutHierarchy', 'kgLayoutTree'].forEach(id => {
      document.getElementById(id).classList.toggle('active', id === activeId);
    });
  }

  document.getElementById('kgLayoutBody').addEventListener('click', function() {
    currentLayout = 'body';
    setActiveLayoutBtn('kgLayoutBody');
    renderGraph(currentCourseId);
  });
  document.getElementById('kgLayoutHierarchy').addEventListener('click', function() {
    currentLayout = 'hierarchy';
    setActiveLayoutBtn('kgLayoutHierarchy');
    renderGraph(currentCourseId);
  });
  document.getElementById('kgLayoutTree').addEventListener('click', function() {
    currentLayout = 'tree';
    setActiveLayoutBtn('kgLayoutTree');
    renderGraph(currentCourseId);
  });

  // 添加知识点
  document.getElementById('kgAddNodeBtn').addEventListener('click', () => {
    const sysOpts = Object.entries(SYS_NAMES).filter(([k]) => k !== 'root').map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    App.showModal('添加知识点', `
      <div class="form-group"><label class="form-label">知识点名称</label><input class="form-input" id="newNodeName"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">父级知识点</label><select class="form-select" id="newNodeParent"><option value="">无</option></select></div><div class="form-group"><label class="form-label">所属系统</label><select class="form-select" id="newNodeSystem">${sysOpts}</select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">分类</label><select class="form-select" id="newNodeCategory"><option>事实性</option><option>概念性</option><option>程序性</option><option>元认知</option></select></div><div class="form-group"><label class="form-label">标签</label><input class="form-input" id="newNodeTags" placeholder="用逗号分隔，如：重点,难点"></div></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveNewNodeBtn">添加</button>`);
    const courseId = parseInt(courseSelect.value);
    const coursePoints = points.filter(p => p.courseId === courseId);
    document.getElementById('newNodeParent').innerHTML = '<option value="">无</option>' + coursePoints.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('saveNewNodeBtn').addEventListener('click', () => {
      const parentId = document.getElementById('newNodeParent').value ? parseInt(document.getElementById('newNodeParent').value) : null;
      const level = parentId ? (coursePoints.find(p => p.id === parentId)?.level || 1) + 1 : 1;
      points.push({
        id: Math.max(...points.map(p => p.id), 0) + 1, courseId,
        name: document.getElementById('newNodeName').value || '新知识点',
        parentId, level, system: document.getElementById('newNodeSystem').value,
        tags: document.getElementById('newNodeTags').value.split(',').filter(Boolean),
        category: document.getElementById('newNodeCategory').value, mastered: 0, completed: 0,
      });
      Store.set('knowledgePoints', points);
      document.querySelector('.modal-overlay').remove();
      App.showToast('知识点添加成功', 'success');
      renderGraph(courseId);
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  // 导入
  document.getElementById('kgImportBtn').addEventListener('click', () => {
    App.showModal('批量导入知识点', `
      <div class="form-group"><label class="form-label">导入方式</label><select class="form-select" id="importMode"><option>从Excel导入</option><option>从教材大纲导入</option><option>从已有课程复制</option></select></div>
      <div class="form-group"><label class="form-label">选择文件</label><div style="border:2px dashed var(--border);border-radius:8px;padding:40px;text-align:center;cursor:pointer" id="uploadArea"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><p style="color:var(--text-muted);margin-top:8px">点击或拖拽文件到此处上传</p></div></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="doImportBtn">开始导入</button>`);
    document.getElementById('doImportBtn').addEventListener('click', () => {
      const courseId = parseInt(courseSelect.value);
      const newPt = { id: Math.max(...points.map(p => p.id), 0) + 1, courseId, name: '导入知识点', parentId: null, level: 1, system: 'bone', tags: ['导入'], category: '概念性', mastered: 0, completed: 0 };
      points.push(newPt);
      Store.set('knowledgePoints', points);
      document.querySelector('.modal-overlay').remove();
      App.showToast('知识点导入成功', 'success');
      renderGraph(courseId);
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  // 导出
  document.getElementById('kgExportBtn').addEventListener('click', () => {
    const courseId = parseInt(courseSelect.value);
    const coursePoints = points.filter(p => p.courseId === courseId);
    const csv = '名称,层级,分类,标签,掌握率,完成率\n' + coursePoints.map(p => `${p.name},L${p.level},${p.category},"${(p.tags||[]).join(';')}",${p.mastered}%,${p.completed}%`).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '知识图谱导出.csv'; a.click();
    URL.revokeObjectURL(url);
    App.showToast('知识图谱导出成功', 'success');
  });
};

/* ============================================
   问题图谱
   ============================================ */
PageRenderers.problemGraph = () => `
<div class="page-header"><h2>问题图谱</h2><p>基于知识图谱构建三层问题体系，引导学生解决复杂临床问题</p></div>
<div class="card"><div class="card-header"><span class="card-title">问题体系</span><div class="btn-group"><button class="btn btn-primary" id="addProblemBtn">+ 添加问题</button><button class="btn btn-outline" id="importProblemBtn">批量导入</button><button class="btn btn-outline" id="exportProblemBtn">导出数据</button></div></div>
<div class="card-body"><div class="tabs" id="problemTabs"><div class="tab-item active" data-level="1">一级问题</div><div class="tab-item" data-level="2">二级问题</div><div class="tab-item" data-level="3">三级问题</div></div>
<div class="cy-container" id="problemCyContainer" style="height:300px;margin-bottom:16px"></div>
<div id="problemList"></div></div></div>`;

PageInits.problemGraph = () => {
  let problems = [
    { id: 1, level: 1, name: '如何理解人体各系统的结构与功能关系？', desc: '核心问题', tags: ['核心'], kps: ['骨骼系统', '肌肉系统', '神经系统'] },
    { id: 2, level: 2, name: '骨骼系统如何支撑人体运动？', desc: '子问题', tags: [], kps: ['骨骼系统', '骨骼肌分类'] },
    { id: 3, level: 2, name: '神经系统如何调控身体活动？', desc: '子问题', tags: [], kps: ['中枢神经系统', '周围神经系统'] },
    { id: 4, level: 3, name: '颅骨如何保护大脑？', desc: '细节问题', tags: [], kps: ['颅骨结构'] },
    { id: 5, level: 3, name: '脊柱如何支撑身体直立？', desc: '细节问题', tags: [], kps: ['脊柱结构'] },
  ];
  let currentLevel = 1;
  let cy;

  function renderProblemGraph() {
    const nodes = problems.map(p => ({
      data: { id: 'p' + p.id, label: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name, fullName: p.name, level: p.level, desc: p.desc, tags: p.tags, kps: p.kps, origId: p.id },
    }));
    const edges = [];
    const l1 = problems.filter(p => p.level === 1);
    const l2 = problems.filter(p => p.level === 2);
    const l3 = problems.filter(p => p.level === 3);
    l2.forEach(p => edges.push({ data: { id: 'pe_l1_' + p.id, source: 'p' + l1[0].id, target: 'p' + p.id } }));
    l3.forEach((p, i) => {
      const l2Idx = i % l2.length;
      edges.push({ data: { id: 'pe_l2_' + p.id, source: 'p' + l2[l2Idx].id, target: 'p' + p.id } });
    });

    if (cy) { cy.destroy(); cy = null; }
    document.getElementById('problemCyContainer').innerHTML = '';

    cy = cytoscape({
      container: document.getElementById('problemCyContainer'),
      elements: [...nodes, ...edges],
      style: [
        { selector: 'node', style: { 'label': 'data(label)', 'text-valign': 'center', 'font-size': '11px', 'color': '#ffffff', 'font-weight': '500', 'background-color': '#3b82f6', 'shape': 'round-rectangle', 'width': 'label', 'height': 'label', 'padding': '10px', 'border-width': 2, 'border-color': '#ffffff' } },
        { selector: 'node[level=1]', style: { 'background-color': '#4f46e5', 'font-size': '13px', 'font-weight': '600', 'width': 160, 'height': 40, 'padding': '14px' } },
        { selector: 'node[level=2]', style: { 'background-color': '#3b82f6', 'font-size': '12px' } },
        { selector: 'node[level=3]', style: { 'background-color': '#6366f1', 'font-size': '11px' } },
        { selector: 'edge', style: { 'width': 1.5, 'line-color': '#93c5fd', 'target-arrow-color': '#93c5fd', 'target-arrow-shape': 'triangle', 'arrow-scale': 0.8, 'curve-style': 'bezier' } },
      ],
      layout: { name: 'breadthfirst', directed: true, spacingFactor: 1.2, animate: true },
      wheelSensitivity: 0.3, minZoom: 0.4, maxZoom: 2.5,
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const prob = problems.find(p => p.id === node.data('origId'));
      if (prob) showProblemDetail(prob);
    });
  }

  function showProblemDetail(prob) {
    App.showModal('探索模式 - ' + prob.name, `
      <div style="margin-bottom:16px"><b>问题描述</b><p>${prob.desc}</p></div>
      <div style="margin-bottom:16px"><b>关联知识点</b><div style="margin-top:8px">${prob.kps.map(kp => `<span class="badge badge-info" style="margin-right:4px">${kp}</span>`).join('')}</div></div>
      <div style="margin-bottom:16px"><b>探索路径</b><div class="markdown-preview"><ul><li>第一步：查阅知识图谱中"${prob.kps[0]||'相关知识点'}"的详细内容</li><li>第二步：通过微课中心学习相关视频资源</li><li>第三步：完成自测练习检验理解程度</li><li>第四步：参与讨论区交流，深化理解</li></ul></div></div>
      <div><b>推荐资源</b><div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="card" style="cursor:pointer"><div class="card-body" style="padding:12px"><b>视频讲解</b><p style="font-size:12px;color:var(--text-muted)">${prob.kps[0]||'相关'}知识详解</p></div></div><div class="card" style="cursor:pointer"><div class="card-body" style="padding:12px"><b>自测练习</b><p style="font-size:12px;color:var(--text-muted)">检验掌握程度</p></div></div></div></div>
    `, `<button class="btn btn-outline modal-close-btn">关闭</button>`);
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  }

  function renderLevel(level) {
    currentLevel = level;
    const container = document.getElementById('problemCyContainer');
    const levelNames = { 1: '一级问题', 2: '二级问题', 3: '三级问题' };
    container.style.display = 'block';
    renderProblemGraph();

    document.getElementById('problemList').innerHTML = problems.filter(p => p.level === level).map(p => `
      <div class="review-card"><div class="flex-between"><div><b>${p.name}</b><p style="font-size:12px;color:var(--text-muted);margin-top:4px">${p.desc}</p><div style="margin-top:8px">${p.tags.map(t => `<span class="badge badge-info" style="margin-right:4px">${t}</span>`).join('')}</div><div style="margin-top:4px;font-size:12px;color:var(--text-muted)">关联知识点: ${p.kps.join('、')}</div></div><div class="btn-group"><button class="btn btn-outline btn-sm prob-edit-btn" data-id="${p.id}">编辑</button><button class="btn btn-outline btn-sm prob-explore-btn" data-id="${p.id}">探索模式</button></div></div></div>
    `).join('');

    document.querySelectorAll('.prob-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prob = problems.find(p => p.id === parseInt(btn.dataset.id));
        if (!prob) return;
        App.showModal('编辑问题', `
          <div class="form-group"><label class="form-label">问题名称</label><input class="form-input" id="editProbName" value="${prob.name}"></div>
          <div class="form-row"><div class="form-group"><label class="form-label">层级</label><select class="form-select" id="editProbLevel"><option value="1" ${prob.level===1?'selected':''}>一级问题</option><option value="2" ${prob.level===2?'selected':''}>二级问题</option><option value="3" ${prob.level===3?'selected':''}>三级问题</option></select></div><div class="form-group"><label class="form-label">标签</label><input class="form-input" id="editProbTags" value="${prob.tags.join(',')}"></div></div>
          <div class="form-group"><label class="form-label">关联知识点</label><input class="form-input" id="editProbKps" value="${prob.kps.join('、')}"></div>
        `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveProbBtn">保存</button>`);
        document.getElementById('saveProbBtn').addEventListener('click', () => {
          prob.name = document.getElementById('editProbName').value;
          prob.level = parseInt(document.getElementById('editProbLevel').value);
          prob.tags = document.getElementById('editProbTags').value.split(',').filter(Boolean);
          prob.kps = document.getElementById('editProbKps').value.split('、').filter(Boolean);
          document.querySelector('.modal-overlay').remove();
          App.showToast('问题已更新', 'success');
          renderLevel(currentLevel);
        });
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
      });
    });

    document.querySelectorAll('.prob-explore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prob = problems.find(p => p.id === parseInt(btn.dataset.id));
        if (prob) showProblemDetail(prob);
      });
    });
  }

  document.getElementById('addProblemBtn').addEventListener('click', () => {
    App.showModal('添加问题', `
      <div class="form-group"><label class="form-label">问题名称</label><input class="form-input" id="newProbName"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">层级</label><select class="form-select" id="newProbLevel"><option value="1">一级问题</option><option value="2">二级问题</option><option value="3">三级问题</option></select></div><div class="form-group"><label class="form-label">标签</label><input class="form-input" id="newProbTags" placeholder="核心,重点"></div></div>
      <div class="form-group"><label class="form-label">关联知识点</label><input class="form-input" id="newProbKps" placeholder="用顿号分隔，如：骨骼系统、肌肉系统"></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveNewProbBtn">添加</button>`);
    document.getElementById('saveNewProbBtn').addEventListener('click', () => {
      problems.push({ id: Math.max(...problems.map(p => p.id), 0) + 1, level: parseInt(document.getElementById('newProbLevel').value), name: document.getElementById('newProbName').value || '新问题', desc: '新问题描述', tags: document.getElementById('newProbTags').value.split(',').filter(Boolean), kps: document.getElementById('newProbKps').value.split('、').filter(Boolean) });
      document.querySelector('.modal-overlay').remove();
      App.showToast('问题添加成功', 'success');
      renderLevel(currentLevel);
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  document.getElementById('importProblemBtn').addEventListener('click', () => {
    App.showModal('批量导入', `<div class="form-group"><label class="form-label">选择模板</label><select class="form-select"><option>医学问题模板</option><option>自定义模板</option></select></div><p style="color:var(--text-muted);font-size:12px">导入后将自动生成三层问题体系</p>`, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="doImportProbBtn">导入</button>`);
    document.getElementById('doImportProbBtn').addEventListener('click', () => {
      problems.push({ id: Math.max(...problems.map(p => p.id), 0) + 1, level: 1, name: '如何培养临床思维能力？', desc: '核心能力问题', tags: ['核心'], kps: ['临床诊断'] });
      document.querySelector('.modal-overlay').remove();
      App.showToast('问题导入成功', 'success');
      renderLevel(currentLevel);
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  document.getElementById('exportProblemBtn').addEventListener('click', () => {
    const csv = '问题,层级,标签,关联知识点\n' + problems.map(p => `${p.name},${p.level},"${p.tags.join(';')}","${p.kps.join(';')}"`).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '问题图谱导出.csv'; a.click();
    URL.revokeObjectURL(url);
    App.showToast('数据导出成功', 'success');
  });

  document.querySelectorAll('#problemTabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#problemTabs .tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLevel(parseInt(tab.dataset.level));
    });
  });

  renderLevel(1);
};

/* ============================================
   课程思政图谱
   ============================================ */
PageRenderers.ideologyGraph = () => `
<div class="page-header"><h2>课程思政</h2><p>将思政元素融入专业知识教学，实现价值引领与知识传授有机统一</p></div>
<div class="card"><div class="card-header"><span class="card-title">思政融入体系</span><div class="btn-group"><button class="btn btn-primary" id="autoGenIdeologyBtn">自动生成</button><button class="btn btn-outline" id="exportIdeologyBtn">导出</button></div></div>
<div class="card-body"><div class="cy-container" id="ideologyCyContainer" style="height:380px"></div></div></div>
<div class="card" style="margin-top:16px"><div class="card-header"><span class="card-title">思政知识点列表</span></div><div class="card-body"><table><thead><tr><th>知识点</th><th>思政标签</th><th>融入方式</th><th>父节点</th><th>操作</th></tr></thead><tbody id="ideologyTableBody"></tbody></table></div></div>`;

PageInits.ideologyGraph = () => {
  const points = Store.get('knowledgePoints') || [];
  const ip = points.filter(p => p.tags && p.tags.includes('课程思政'));
  const displayPoints = ip.length > 0 ? ip : points.filter(p => p.level <= 2);
  let cy;

  function render() {
    if (cy) { cy.destroy(); cy = null; }
    document.getElementById('ideologyCyContainer').innerHTML = '';

    const nodes = displayPoints.map(p => ({
      data: { id: 'in' + p.id, label: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name, fullName: p.name, level: p.level, origId: p.id },
    }));
    const edges = [];
    displayPoints.forEach(p => {
      if (p.parentId) {
        const parent = displayPoints.find(pp => pp.id === p.parentId);
        if (parent) edges.push({ data: { id: 'ie' + p.parentId + '_' + p.id, source: 'in' + p.parentId, target: 'in' + p.id } });
      }
    });

    cy = cytoscape({
      container: document.getElementById('ideologyCyContainer'),
      elements: [...nodes, ...edges],
      style: [
        { selector: 'node', style: { 'label': 'data(label)', 'text-valign': 'center', 'font-size': '11px', 'color': '#ffffff', 'font-weight': '500', 'background-color': '#ef4444', 'shape': 'round-rectangle', 'width': 'label', 'height': 'label', 'padding': '10px', 'border-width': 2, 'border-color': '#ffffff' } },
        { selector: 'node[level=1]', style: { 'background-color': '#dc2626', 'font-size': '13px', 'font-weight': '600', 'width': 140, 'height': 40, 'padding': '14px' } },
        { selector: 'node[level=2]', style: { 'background-color': '#ef4444', 'font-size': '12px' } },
        { selector: 'node[level=3]', style: { 'background-color': '#f87171', 'font-size': '11px' } },
        { selector: 'edge', style: { 'width': 1.5, 'line-color': '#fca5a5', 'target-arrow-color': '#fca5a5', 'target-arrow-shape': 'triangle', 'arrow-scale': 0.8, 'curve-style': 'bezier' } },
      ],
      layout: { name: 'breadthfirst', directed: true, spacingFactor: 1.2, animate: true },
      wheelSensitivity: 0.3, minZoom: 0.4, maxZoom: 2.5,
    });
  }

  render();

  document.getElementById('ideologyTableBody').innerHTML = ip.length ? ip.map(p => `
    <tr><td>${p.name}</td><td><span class="badge badge-danger">课程思政</span></td><td>价值引领与知识传授结合</td><td>${p.parentId ? (points.find(pp => pp.id === p.parentId)?.name || '-') : '-'}</td><td><button class="btn btn-outline btn-sm ideology-view-btn" data-id="${p.id}">查看</button></td></tr>
  `).join('') : '<tr><td colspan="5" class="text-center text-muted">暂无数据，点击"自动生成"为知识点添加思政标签</td></tr>';

  document.querySelectorAll('.ideology-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pt = points.find(p => p.id === parseInt(btn.dataset.id));
      if (!pt) return;
      App.showModal('思政元素详情 - ' + pt.name, `
        <div style="margin-bottom:16px"><b>知识点</b><p>${pt.name} (L${pt.level} | ${pt.category})</p></div>
        <div style="margin-bottom:16px"><b>思政标签</b><div style="margin-top:4px"><span class="badge badge-danger">课程思政</span></div></div>
        <div style="margin-bottom:16px"><b>融入方式</b><p>在知识传授中自然融入价值引领，实现课程思政润物细无声</p></div>
        <div><b>教学设计建议</b><div class="markdown-preview"><ul><li>课前：引入相关医学人文案例</li><li>课中：结合知识点讨论伦理与责任</li><li>课后：布置反思性学习任务</li></ul></div></div>
      `, `<button class="btn btn-outline modal-close-btn">关闭</button>`);
      document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
    });
  });

  document.getElementById('autoGenIdeologyBtn').addEventListener('click', () => {
    const nonIdeology = points.filter(p => !p.tags || !p.tags.includes('课程思政'));
    if (nonIdeology.length > 0) {
      const pt = nonIdeology[0];
      if (!pt.tags) pt.tags = [];
      pt.tags.push('课程思政');
      Store.set('knowledgePoints', points);
      App.showToast('已为"' + pt.name + '"添加思政标签', 'success');
      PageInits.ideologyGraph();
    }
  });

  document.getElementById('exportIdeologyBtn').addEventListener('click', () => {
    const csv = '知识点,思政标签,融入方式\n' + ip.map(p => `${p.name},课程思政,价值引领与知识传授结合`).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '思政图谱导出.csv'; a.click();
    URL.revokeObjectURL(url);
    App.showToast('导出成功', 'success');
  });
};

/* ============================================
   课程目标图谱
   ============================================ */
PageRenderers.targetGraph = () => `
<div class="page-header"><h2>课程目标</h2><p>根据不同班级定制课程目标，关联知识点展示目标达成情况</p></div>
<div class="card"><div class="card-header"><span class="card-title">课程目标</span><div class="btn-group"><button class="btn btn-primary" id="addTargetBtn">+ 添加目标</button><button class="btn btn-outline" id="importTargetBtn">导入模板</button><button class="btn btn-outline" id="exportTargetBtn">一键导出</button></div></div>
<div class="card-body"><div class="grid-2"><div><table><thead><tr><th>目标名称</th><th>关联知识点</th><th>标签</th><th>操作</th></tr></thead><tbody id="targetTableBody"></tbody></table></div><div><div class="cy-container" id="targetCyContainer" style="height:350px"></div></div></div></div></div>`;

PageInits.targetGraph = () => {
  let targets = [
    { id: 1, name: '掌握人体解剖学基本概念', desc: '理解人体各系统结构', tags: ['基础'], kc: 5 },
    { id: 2, name: '具备临床诊断基本能力', desc: '掌握体格检查方法', tags: ['核心'], kc: 4 },
    { id: 3, name: '培养医学人文素养', desc: '理解医学伦理原则', tags: ['素养'], kc: 3 },
  ];
  let cy;

  function renderTargets() {
    document.getElementById('targetTableBody').innerHTML = targets.map(t => `
      <tr><td><b>${t.name}</b><br><span style="font-size:12px;color:var(--text-muted)">${t.desc}</span></td><td>${t.kc}</td><td>${t.tags.map(tg => `<span class="badge badge-info" style="margin-right:4px">${tg}</span>`).join('')}</td><td><button class="btn btn-outline btn-sm target-edit-btn" data-id="${t.id}">编辑</button></td></tr>
    `).join('');

    if (cy) { cy.destroy(); cy = null; }
    document.getElementById('targetCyContainer').innerHTML = '';

    const nodes = targets.map((t, i) => ({
      data: { id: 't' + t.id, label: t.name.length > 8 ? t.name.slice(0, 8) + '…' : t.name, fullName: t.name, kc: t.kc, tags: t.tags, origId: t.id },
    }));
    const colors = ['#4f46e5', '#10b981', '#f59e0b'];

    cy = cytoscape({
      container: document.getElementById('targetCyContainer'),
      elements: nodes,
      style: [
        { selector: 'node', style: { 'label': 'data(label)', 'text-valign': 'center', 'font-size': '12px', 'color': '#ffffff', 'font-weight': '600', 'shape': 'round-rectangle', 'width': 'label', 'height': 'label', 'padding': '14px', 'border-width': 2, 'border-color': '#ffffff' } },
      ],
      layout: { name: 'circle', animate: true, animationDuration: 500 },
      wheelSensitivity: 0.3, minZoom: 0.4, maxZoom: 2.5,
    });

    cy.nodes().forEach((node, i) => {
      const w = 60 + node.data('kc') * 20;
      const h = 36 + node.data('kc') * 8;
      node.style({ 'width': w, 'height': h, 'background-color': colors[i % colors.length] });
    });

    document.querySelectorAll('.target-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = targets.find(tg => tg.id === parseInt(btn.dataset.id));
        if (!t) return;
        App.showModal('编辑目标', `
          <div class="form-group"><label class="form-label">目标名称</label><input class="form-input" id="editTargetName" value="${t.name}"></div>
          <div class="form-row"><div class="form-group"><label class="form-label">关联知识点数</label><input class="form-input" id="editTargetKc" type="number" value="${t.kc}" min="0"></div><div class="form-group"><label class="form-label">标签</label><input class="form-input" id="editTargetTags" value="${t.tags.join(',')}"></div></div>
          <div class="form-group"><label class="form-label">描述</label><input class="form-input" id="editTargetDesc" value="${t.desc}"></div>
        `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveTargetBtn">保存</button>`);
        document.getElementById('saveTargetBtn').addEventListener('click', () => {
          t.name = document.getElementById('editTargetName').value;
          t.kc = parseInt(document.getElementById('editTargetKc').value) || 0;
          t.tags = document.getElementById('editTargetTags').value.split(',').filter(Boolean);
          t.desc = document.getElementById('editTargetDesc').value;
          document.querySelector('.modal-overlay').remove();
          App.showToast('目标已更新', 'success');
          renderTargets();
        });
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
      });
    });
  }

  document.getElementById('addTargetBtn').addEventListener('click', () => {
    App.showModal('添加目标', `
      <div class="form-group"><label class="form-label">目标名称</label><input class="form-input" id="newTargetName"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">关联知识点数</label><input class="form-input" id="newTargetKc" type="number" value="3" min="0"></div><div class="form-group"><label class="form-label">标签</label><input class="form-input" id="newTargetTags" placeholder="基础,核心,素养"></div></div>
      <div class="form-group"><label class="form-label">描述</label><input class="form-input" id="newTargetDesc"></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveNewTargetBtn">添加</button>`);
    document.getElementById('saveNewTargetBtn').addEventListener('click', () => {
      targets.push({ id: Math.max(...targets.map(t => t.id), 0) + 1, name: document.getElementById('newTargetName').value || '新目标', desc: document.getElementById('newTargetDesc').value || '新目标', kc: parseInt(document.getElementById('newTargetKc').value) || 3, tags: document.getElementById('newTargetTags').value.split(',').filter(Boolean) });
      document.querySelector('.modal-overlay').remove();
      App.showToast('目标添加成功', 'success');
      renderTargets();
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  document.getElementById('importTargetBtn').addEventListener('click', () => {
    App.showModal('导入目标模板', `
      <div class="form-group"><label class="form-label">选择模板</label><select class="form-select" id="targetTemplate"><option>医学专业通用模板</option><option>临床医学模板</option><option>基础医学模板</option></select></div>
      <div class="markdown-preview"><p>导入模板将自动创建预设课程目标，包含知识、能力、素养三维目标体系</p></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="doImportTargetBtn">导入</button>`);
    document.getElementById('doImportTargetBtn').addEventListener('click', () => {
      targets.push({ id: Math.max(...targets.map(t => t.id), 0) + 1, name: '知识应用能力', desc: '运用知识解决实际问题', tags: ['能力'], kc: 4 });
      targets.push({ id: Math.max(...targets.map(t => t.id), 0) + 1, name: '团队协作精神', desc: '培养团队协作能力', tags: ['素养'], kc: 2 });
      document.querySelector('.modal-overlay').remove();
      App.showToast('模板导入成功', 'success');
      renderTargets();
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });

  document.getElementById('exportTargetBtn').addEventListener('click', () => {
    const csv = '目标名称,描述,标签,关联知识点数\n' + targets.map(t => `${t.name},${t.desc},"${t.tags.join(';')}",${t.kc}`).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '课程目标导出.csv'; a.click();
    URL.revokeObjectURL(url);
    App.showToast('课程目标导出成功', 'success');
  });

  renderTargets();
};

/* ============================================
   个性化图谱
   ============================================ */
PageRenderers.personalGraph = () => `
<div class="page-header"><h2>个性化图谱</h2><p>自定义图谱形态与样式，满足不同教学场景需求</p></div>
<div class="card"><div class="card-header"><span class="card-title">图谱样式</span><div class="btn-group"><button class="btn btn-outline active graph-style-btn" data-style="tree">树形图</button><button class="btn btn-outline graph-style-btn" data-style="radial">放射图</button><button class="btn btn-outline graph-style-btn" data-style="network">网络图</button><button class="btn btn-outline graph-style-btn" data-style="hierarchy">层级图</button><button class="btn btn-outline graph-style-btn" data-style="flow">流程图</button><button class="btn btn-outline graph-style-btn" data-style="matrix">矩阵图</button></div></div>
<div class="card-body"><div class="form-row" style="margin-bottom:16px"><div class="form-group"><label class="form-label">节点颜色</label><input type="color" class="form-input" id="nodeColor" value="#4f46e5" style="width:60px;height:38px;padding:4px"></div><div class="form-group"><label class="form-label">文字大小</label><select class="form-select" id="textSize" style="width:120px"><option value="11">小</option><option value="13" selected>中</option><option value="15">大</option></select></div></div><div class="cy-container" id="personalCyContainer" style="height:420px"></div></div></div>`;

PageInits.personalGraph = () => {
  const points = Store.get('knowledgePoints') || [];
  let currentStyle = 'tree';
  let cy;

  const layoutMap = {
    tree: { name: 'breadthfirst', directed: true, spacingFactor: 1.2, animate: true },
    radial: { name: 'concentric', concentric: (node) => node.data('level'), minNodeSpacing: 50, animate: true },
    network: { name: 'cose', animate: true, animationDuration: 800 },
    hierarchy: { name: 'breadthfirst', directed: true, spacingFactor: 1.0, animate: true },
    flow: { name: 'breadthfirst', directed: true, spacingFactor: 1.5, animate: true },
    matrix: { name: 'grid', rows: 3, animate: true },
  };

  function render(style) {
    currentStyle = style;
    const nodeColor = document.getElementById('nodeColor').value;
    const fontSize = parseInt(document.getElementById('textSize').value);

    if (cy) { cy.destroy(); cy = null; }
    document.getElementById('personalCyContainer').innerHTML = '';

    const displayPoints = points.slice(0, 12);
    const nodes = displayPoints.map(p => ({
      data: { id: 'pn' + p.id, label: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name, fullName: p.name, level: p.level, origId: p.id },
    }));
    const edges = [];
    displayPoints.forEach(p => {
      if (p.parentId) {
        const parent = displayPoints.find(pp => pp.id === p.parentId);
        if (parent) edges.push({ data: { id: 'pe' + p.parentId + '_' + p.id, source: 'pn' + p.parentId, target: 'pn' + p.id } });
      }
    });

    cy = cytoscape({
      container: document.getElementById('personalCyContainer'),
      elements: [...nodes, ...edges],
      style: [
        { selector: 'node', style: { 'label': 'data(label)', 'text-valign': 'center', 'font-size': fontSize + 'px', 'color': '#ffffff', 'font-weight': '500', 'background-color': nodeColor, 'shape': 'round-rectangle', 'width': 'label', 'height': 'label', 'padding': '10px', 'border-width': 2, 'border-color': '#ffffff', 'transition-property': 'background-color, width, height', 'transition-duration': '0.3s' } },
        { selector: 'node[level=1]', style: { 'font-weight': '600', 'font-size': (fontSize + 2) + 'px' } },
        { selector: 'node[level=3]', style: { 'font-size': (fontSize - 1) + 'px' } },
        { selector: 'edge', style: { 'width': 1.5, 'line-color': nodeColor + '44', 'target-arrow-color': nodeColor + '44', 'target-arrow-shape': 'triangle', 'arrow-scale': 0.8, 'curve-style': 'bezier' } },
        { selector: 'node:selected', style: { 'border-width': 3, 'border-color': nodeColor, 'border-opacity': 0.8 } },
      ],
      layout: layoutMap[style] || layoutMap.tree,
      wheelSensitivity: 0.3, minZoom: 0.4, maxZoom: 2.5,
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const pt = points.find(p => p.id === node.data('origId'));
      if (pt) {
        App.showModal('知识点详情 - ' + pt.name, `
          <div style="margin-bottom:16px"><b>基本信息</b><p>层级: L${pt.level} | 分类: ${pt.category}</p></div>
          <div style="margin-bottom:16px"><b>标签</b><div>${(pt.tags||[]).map(t => `<span class="badge badge-warning" style="margin-right:4px">${t}</span>`).join('') || '无'}</div></div>
          <div style="margin-bottom:16px"><b>掌握率</b><div class="progress-bar mt-4"><div class="progress-fill ${pt.mastered>=80?'success':pt.mastered>=50?'warning':'primary'}" style="width:${pt.mastered}%"></div></div><span style="font-size:12px;color:var(--text-muted)">${pt.mastered}%</span></div>
        `, `<button class="btn btn-outline modal-close-btn">关闭</button>`);
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
      }
    });
  }

  document.querySelectorAll('.graph-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.graph-style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.style);
    });
  });

  document.getElementById('nodeColor').addEventListener('input', () => render(currentStyle));
  document.getElementById('textSize').addEventListener('change', () => render(currentStyle));

  render('tree');
};