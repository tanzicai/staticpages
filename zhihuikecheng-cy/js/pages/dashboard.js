/* 工作台 - 基于成熟教学平台演示真实课程 */
PageRenderers.dashboard = () => `
<div class="dashboard-welcome">
  <h2>欢迎回来，${App.currentUser?.name || ''}</h2>
  <p>今天是 ${new Date().toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric',weekday:'long'})}，当前主讲课程：人体解剖学（MED101）</p>
</div>
<div class="stats-row">
  <div class="stat-card"><div class="stat-icon primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="stat-info"><div class="stat-value" id="statCourseCount">0</div><div class="stat-label">课程总数</div><div class="stat-change up" id="statCourseStatus">—</div></div></div>
  <div class="stat-card"><div class="stat-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="stat-info"><div class="stat-value" id="statStudentCount">0</div><div class="stat-label">学生总数</div><div class="stat-change up" id="statStudentChange">—</div></div></div>
  <div class="stat-card"><div class="stat-icon warning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><div class="stat-info"><div class="stat-value" id="statVideoMinutes">0</div><div class="stat-label">视频资源(分钟)</div><div class="stat-change" id="statVideoDone">—</div></div></div>
  <div class="stat-card"><div class="stat-icon info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="stat-info"><div class="stat-value" id="statAvgCompletion">0%</div><div class="stat-label">平均完成率</div><div class="stat-change up" id="statAvgChange">—</div></div></div>
</div>
<div class="grid-2">
  <div class="card"><div class="card-header"><span class="card-title">课程建设进度</span><a href="javascript:App.navigateTo('courses')" style="font-size:12px;color:var(--primary)">查看全部 →</a></div><div class="card-body"><table><thead><tr><th>课程名称</th><th>进度</th><th>状态</th></tr></thead><tbody id="dashboardCourseTable"></tbody></table></div></div>
  <div class="card"><div class="card-header"><span class="card-title">最近学习任务</span><a href="javascript:App.navigateTo('learningTasks')" style="font-size:12px;color:var(--primary)">查看全部 →</a></div><div class="card-body" id="dashboardTasks"></div></div>
</div>
<div class="grid-2" style="margin-top:16px">
  <div class="card"><div class="card-header"><span class="card-title">本周教学日历</span></div><div class="card-body"><div id="weekSchedule"></div></div></div>
  <div class="card"><div class="card-header"><span class="card-title">教学通知</span></div><div class="card-body"><div id="teachingNotices"></div></div></div>
</div>`;

PageInits.dashboard = () => {
  const courses = Store.get('courses') || [];
  const tasks = Store.get('tasks') || [];

  const completedCourses = courses.filter(c => c.status === '已完成').length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0);
  const avgProgress = courses.length ? Math.round(courses.reduce((s, c) => s + (c.progress || 0), 0) / courses.length) : 0;
  const totalVideoMin = 3000;
  const doneVideoMin = 1920;

  document.getElementById('statCourseCount').textContent = courses.length;
  document.getElementById('statCourseStatus').textContent = completedCourses + '门已完成';
  document.getElementById('statStudentCount').textContent = totalStudents.toLocaleString();
  document.getElementById('statStudentChange').textContent = '+12% 较上期';
  document.getElementById('statVideoMinutes').textContent = totalVideoMin.toLocaleString();
  document.getElementById('statVideoDone').textContent = '已完成 ' + doneVideoMin.toLocaleString();
  document.getElementById('statAvgCompletion').textContent = avgProgress + '%';
  document.getElementById('statAvgChange').textContent = '+5.2%';

  document.getElementById('dashboardCourseTable').innerHTML = courses.slice(0, 5).map(c => `
    <tr><td>${c.name}</td><td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:120px"><div class="progress-fill primary" style="width:${c.progress}%"></div></div><span style="font-size:11px;color:var(--text-muted)">${c.progress}%</span></div></td><td><span class="badge badge-${c.status==='进行中'?'info':'success'}">${c.status}</span></td></tr>
  `).join('');

  document.getElementById('dashboardTasks').innerHTML = tasks.slice(0, 5).map(t => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border-light)"><div class="flex-between"><div><b>${t.title}</b><span class="badge badge-info" style="margin-left:8px">${t.courseName}</span></div><span class="text-muted">${t.deadline}</span></div><div class="flex-between mt-8"><div class="progress-bar" style="width:200px"><div class="progress-fill ${t.progress>=80?'success':t.progress>=50?'warning':'primary'}" style="width:${t.progress}%"></div></div><span style="font-size:12px">${t.progress}%</span></div></div>
  `).join('');

  document.getElementById('weekSchedule').innerHTML = `
    <div style="display:grid;gap:10px">
      ${['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => {
        const schedules = [
          ['08:00-09:40 骨骼系统理论课', '14:00-15:40 实验课：骨骼标本观察'],
          ['10:00-11:40 肌肉系统理论课', ''],
          ['08:00-09:40 神经系统理论课', '16:00-17:40 习题课'],
          ['10:00-11:40 循环系统理论课', ''],
          ['08:00-09:40 章节复习', '14:00-15:40 小组讨论'],
          ['', ''],
          ['', ''],
        ][i];
        return `<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--border-light)"><div style="font-weight:600;min-width:36px;color:${i<5?'var(--primary)':'var(--text-muted)'}">${day}</div><div style="font-size:12px;color:var(--text-secondary)">${schedules.join('<br>') || '—'}</div></div>`;
      }).join('')}
    </div>`;

  document.getElementById('teachingNotices').innerHTML = [
    { title: '骨骼系统实验课安排通知', time: '2026-08-10', cat: '教学安排' },
    { title: '解剖学期中考试安排', time: '2026-08-08', cat: '考试通知' },
    { title: '关于课后自测练习的通知', time: '2026-08-05', cat: '学习任务' },
  ].map(n => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border-light)">
      <div class="flex-between"><b>${n.title}</b><span class="badge badge-info" style="font-size:11px">${n.cat}</span></div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${n.time}</div>
    </div>
  `).join('');
};