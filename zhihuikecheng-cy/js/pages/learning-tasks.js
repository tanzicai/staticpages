/* 学习任务 */
PageRenderers.learningTasks = () => `
<div class="page-header"><h2>学习任务</h2><p>查看学习任务列表，跟踪任务完成与解锁状态</p></div>
<div class="card"><div class="card-header"><span class="card-title">任务列表</span><div class="btn-group"><button class="btn btn-outline active" id="taskListMode">列表模式</button><button class="btn btn-outline" id="taskMapMode">地图模式</button></div></div><div class="card-body" id="taskContentArea"></div></div>`;

PageInits.learningTasks = () => {
  let mode = 'list';

  function getTasks() {
    return Store.get('tasks') || [];
  }

  function renderList() {
    const tasks = getTasks();
    document.getElementById('taskContentArea').innerHTML = tasks.map(t => `
      <div class="card" style="margin-bottom:12px;cursor:pointer" data-task-id="${t.id}">
        <div class="card-body"><div class="flex-between"><div><b>${t.title}</b><span class="badge badge-info" style="margin-left:8px">${t.courseName}</span><span class="badge badge-${t.type==='必修'?'danger':'warning'}" style="margin-left:4px">${t.type}</span></div><span class="text-muted">截止: ${t.deadline}</span></div>
        <div class="flex-between mt-8"><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:200px"><div class="progress-fill ${t.progress>=80?'success':t.progress>=50?'warning':'primary'}" style="width:${t.progress}%"></div></div><span style="font-size:12px">${t.progress}%</span></div><span class="badge badge-${t.status==='已完成'?'success':'info'}">${t.status}</span></div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:8px">${t.desc}</p></div>
      </div>
    `).join('');

    document.querySelectorAll('#taskContentArea .card').forEach(card => {
      card.addEventListener('click', () => {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === parseInt(card.dataset.taskId));
        showTaskDetail(task);
      });
    });
  }

  function renderMap() {
    const tasks = getTasks();
    document.getElementById('taskContentArea').innerHTML = '<div class="path-map">' + tasks.map((t, i) => {
      const cls = t.status === '已完成' ? 'completed' : (i === 0 ? 'current' : '');
      const conn = i > 0 ? `<div class="path-connector ${tasks[i-1].status==='已完成'?'completed':''}"></div>` : '';
      return `${conn}<div class="path-node ${cls}" data-task-id="${t.id}"><b>${t.title}</b><p style="font-size:11px;color:var(--text-muted);margin-top:4px">${t.courseName}</p><div class="progress-bar mt-8" style="width:100%"><div class="progress-fill ${t.progress>=80?'success':t.progress>=50?'warning':'primary'}" style="width:${t.progress}%"></div></div><span style="font-size:11px">${t.progress}%</span></div>`;
    }).join('') + '</div>';

    document.querySelectorAll('.path-node').forEach(node => {
      node.addEventListener('click', () => {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === parseInt(node.dataset.taskId));
        showTaskDetail(task);
      });
    });
  }

  function showTaskDetail(task) {
    App.showModal(task.title, `
      <div style="margin-bottom:16px"><b>基本信息</b><p style="font-size:13px;color:var(--text-muted)">课程: ${task.courseName} | 类型: ${task.type} | 截止: ${task.deadline} | 进度: ${task.progress}%</p></div>
      <div style="margin-bottom:16px"><b>达标情况</b><div class="progress-bar mt-4"><div class="progress-fill ${task.progress>=80?'success':task.progress>=50?'warning':'primary'}" style="width:${task.progress}%"></div></div><span style="font-size:12px;color:var(--text-muted)">${task.progress}% 已完成</span></div>
      <div><b>任务点</b><table style="margin-top:8px"><thead><tr><th>任务点</th><th>类型</th><th>完成状态</th><th>解锁状态</th></tr></thead><tbody>${task.items.map(it => `<tr><td>${it.name}</td><td>${it.type}</td><td><span class="badge badge-${it.completed?'success':'warning'}">${it.completed?'已完成':'未完成'}</span></td><td><span class="badge badge-${it.unlocked?'success':'danger'}">${it.unlocked?'已解锁':'未解锁'}</span></td></tr>`).join('')}</tbody></table></div>
    `, `<button class="btn btn-outline modal-close-btn">关闭</button><button class="btn btn-primary" id="startLearnBtn">开始学习</button>`, 'modal-lg');
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
    document.getElementById('startLearnBtn').addEventListener('click', () => {
      document.querySelector('.modal-overlay').remove();

      const tasks = getTasks();
      const taskIdx = tasks.findIndex(t => t.id === task.id);
      if (taskIdx >= 0) {
        const newProgress = Math.min(100, tasks[taskIdx].progress + Math.floor(Math.random() * 15) + 10);
        tasks[taskIdx].progress = newProgress;
        if (newProgress >= 100) {
          tasks[taskIdx].status = '已完成';
          tasks[taskIdx].items.forEach(it => { it.completed = true; it.unlocked = true; });
        } else {
          tasks[taskIdx].items.forEach(it => {
            if (it.unlocked && !it.completed) it.completed = Math.random() > 0.5;
          });
          const nextLocked = tasks[taskIdx].items.find(it => !it.unlocked);
          if (nextLocked) nextLocked.unlocked = true;
        }
        Store.set('tasks', tasks);
      }
      App.showToast('学习完成，任务进度已更新', 'success');
      if (mode === 'list') renderList(); else renderMap();
    });
  }

  renderList();

  document.getElementById('taskListMode').addEventListener('click', () => {
    mode = 'list';
    document.getElementById('taskListMode').classList.add('active');
    document.getElementById('taskMapMode').classList.remove('active');
    renderList();
  });

  document.getElementById('taskMapMode').addEventListener('click', () => {
    mode = 'map';
    document.getElementById('taskMapMode').classList.add('active');
    document.getElementById('taskListMode').classList.remove('active');
    renderMap();
  });
};