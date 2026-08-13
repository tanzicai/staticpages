/* 学情分析 */
PageRenderers.learningAnalysis = () => `
<div class="page-header"><h2>学情分析</h2><p>AI驱动的学情数据分析，支持班级整体与学生个人画像</p></div>
<div class="card"><div class="card-header"><span class="card-title">课程学情概览</span><select class="form-select" id="analysisCourseSelect" style="width:200px"></select></div>
<div class="card-body"><div class="stats-row"><div class="stat-card"><div class="stat-icon primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="stat-info"><div class="stat-value" id="statAvgScore">-</div><div class="stat-label">平均成绩</div></div></div><div class="stat-card"><div class="stat-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/></svg></div><div class="stat-info"><div class="stat-value" id="statVideoComp">-</div><div class="stat-label">视频完成率</div></div></div><div class="stat-card"><div class="stat-icon warning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div><div class="stat-info"><div class="stat-value" id="statHomeworkComp">-</div><div class="stat-label">作业完成率</div></div></div><div class="stat-card"><div class="stat-icon info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div class="stat-info"><div class="stat-value" id="statParticipation">-</div><div class="stat-label">课堂参与率</div></div></div></div></div></div>
<div class="card" style="margin-top:16px"><div class="card-header"><span class="card-title">AI学情问答</span></div><div class="card-body"><div class="chat-container" style="height:300px" id="analysisChat"><div class="chat-messages" id="analysisChatMessages"></div><div class="chat-input-area"><input type="text" class="form-input" id="analysisChatInput" placeholder="输入学情分析问题，如：班级整体掌握率如何？"><button class="btn btn-primary" id="analysisChatSend">发送</button></div></div></div></div>
<div class="grid-2" style="margin-top:16px"><div class="card"><div class="card-header"><span class="card-title">成绩分布</span></div><div class="card-body" id="scoreDistribution"></div></div><div class="card"><div class="card-header"><span class="card-title">作业/考试题目分析</span><select class="form-select" id="examSelect" style="width:200px"><option value="assign1">作业1：骨骼系统</option><option value="assign2">作业2：神经系统</option><option value="exam1">期中考试</option></select></div><div class="card-body" id="examAnalysis"></div></div></div>
<div class="grid-2" style="margin-top:16px"><div class="card"><div class="card-header"><span class="card-title">学生列表</span><div class="btn-group"><button class="btn btn-outline btn-sm" id="saveQuestionBtn">保存为常见问题</button><button class="btn btn-outline btn-sm" id="scheduledPushBtn">设置定时推送</button></div></div><div class="card-body"><table><thead><tr><th>学号</th><th>姓名</th><th>成绩</th><th>完成率</th><th>掌握率</th><th>参与度</th><th>状态</th><th>操作</th></tr></thead><tbody id="studentTableBody"></tbody></table></div></div></div>`;

PageInits.learningAnalysis = () => {
  const courses = Store.get('courses');
  const sel = document.getElementById('analysisCourseSelect');
  sel.innerHTML = courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  function loadStats(courseId) {
    const key = `classStats_${courseId}`;
    let stats = Store.get(key);
    if (!stats) {
      stats = {
        courseName: courses.find(c=>c.id===courseId)?.name||'',
        avgScore: 82.5, avgCompletion: 78.3, avgMastery: 75.1,
        videoCompletion: 85.2, homeworkCompletion: 72.8, examAvgScore: 81.3, participationRate: 68.5,
        students: [
          { id:1, name:'李明', studentId:'202501001', score:92, completion:95, mastery:90, participation:18, status:'优秀' },
          { id:2, name:'王芳', studentId:'202501002', score:88, completion:90, mastery:85, participation:15, status:'良好' },
          { id:3, name:'张伟', studentId:'202501003', score:75, completion:78, mastery:72, participation:12, status:'中等' },
          { id:4, name:'刘洋', studentId:'202501004', score:62, completion:65, mastery:60, participation:8, status:'待提升' },
          { id:5, name:'陈静', studentId:'202501005', score:55, completion:50, mastery:48, participation:5, status:'待提升' },
          { id:6, name:'赵强', studentId:'202501006', score:95, completion:98, mastery:94, participation:20, status:'优秀' },
          { id:7, name:'孙丽', studentId:'202501007', score:80, completion:82, mastery:78, participation:14, status:'良好' },
          { id:8, name:'周杰', studentId:'202501008', score:58, completion:55, mastery:50, participation:4, status:'待提升' },
        ],
      };
    }
    document.getElementById('statAvgScore').textContent = stats.avgScore;
    document.getElementById('statVideoComp').textContent = stats.videoCompletion + '%';
    document.getElementById('statHomeworkComp').textContent = stats.homeworkCompletion + '%';
    document.getElementById('statParticipation').textContent = stats.participationRate + '%';

    // 成绩分布柱状图
    const dist = [{range:'90-100',count:35},{range:'80-89',count:58},{range:'70-79',count:47},{range:'60-69',count:28},{range:'<60',count:18}];
    const maxCount = Math.max(...dist.map(d=>d.count));
    document.getElementById('scoreDistribution').innerHTML = '<div style="display:flex;align-items:flex-end;gap:20px;height:200px;padding:20px;justify-content:center">' + dist.map(d => {
      const h = Math.round(d.count/maxCount*160);
      const color = d.range==='90-100'?'var(--success)':d.range==='80-89'?'var(--primary)':d.range==='70-79'?'var(--info)':d.range==='60-69'?'var(--warning)':'var(--danger)';
      return `<div style="text-align:center"><div style="width:50px;height:${h}px;background:${color};border-radius:4px 4px 0 0"></div><div style="margin-top:6px;font-size:12px">${d.range}</div><div style="font-size:11px;color:var(--text-muted)">${d.count}人</div></div>`;
    }).join('') + '</div>';

    // 作业/考试题目分析数据
    const examData = {
      assign1: {
        name: '作业1：骨骼系统',
        totalStudents: 186, submitCount: 158, avgScore: 82.5, maxScore: 100, minScore: 38,
        questions: [
          { id: 'Q1', type: '单选题', title: '人体最大的骨骼是？', correctRate: '89%', avgScore: 4.5, total: 5, difficulty: '简单', analysis: '89%学生答对，主要错误集中在混淆"股骨"与"肱骨"，建议强化解剖学名词记忆' },
          { id: 'Q2', type: '多选题', title: '骨骼的主要功能包括？', correctRate: '72%', avgScore: 3.6, total: 5, difficulty: '中等', analysis: '72%学生完全答对，18%漏选"造血功能"，需在教学中强调骨骼的完整功能体系' },
          { id: 'Q3', type: '简答题', title: '请简述骨骼的组成结构', correctRate: '65%', avgScore: 11.7, total: 18, difficulty: '中等', analysis: '65%学生得分12分以上，主要失分点：未完整描述"中轴骨"和"附肢骨"的区分，建议使用思维导图辅助教学' },
          { id: 'Q4', type: '判断题', title: '骨骼肌是随意肌', correctRate: '94%', avgScore: 3.8, total: 4, difficulty: '简单', analysis: '94%学生答对，掌握情况良好' },
          { id: 'Q5', type: '论述题', title: '试述骨骼系统在维持人体内环境稳定中的作用', correctRate: '52%', avgScore: 10.4, total: 20, difficulty: '困难', analysis: '52%学生得分15分以上，主要问题：缺乏系统性思维，未将骨骼系统与免疫、内分泌等系统关联分析，建议开设跨系统整合课程' },
        ],
      },
      assign2: {
        name: '作业2：神经系统',
        totalStudents: 186, submitCount: 145, avgScore: 76.8, maxScore: 98, minScore: 42,
        questions: [
          { id: 'Q1', type: '单选题', title: '神经冲动传递的方向是？', correctRate: '82%', avgScore: 4.1, total: 5, difficulty: '简单', analysis: '82%学生答对，12%选择了"双向传递"，需强调在完整反射弧中的单向传递原则' },
          { id: 'Q2', type: '单选题', title: '下列哪个不属于中枢神经系统？', correctRate: '68%', avgScore: 3.4, total: 5, difficulty: '中等', analysis: '68%学生答对，22%误选"脊髓"，需在教学中明确中枢/周围神经系统的解剖边界' },
          { id: 'Q3', type: '简答题', title: '请描述突触传递的过程', correctRate: '58%', avgScore: 10.4, total: 18, difficulty: '困难', analysis: '58%学生得分12分以上，主要失分点："神经递质释放"和"受体结合"过程描述不完整，建议使用动画演示辅助教学' },
          { id: 'Q4', type: '多选题', title: '自主神经系统的特点包括？', correctRate: '61%', avgScore: 3.1, total: 5, difficulty: '困难', analysis: '61%学生完全答对，23%漏选"不受意识支配"，需加强自主神经与躯体神经的对比教学' },
        ],
      },
      exam1: {
        name: '期中考试',
        totalStudents: 186, submitCount: 180, avgScore: 81.3, maxScore: 98, minScore: 35,
        questions: [
          { id: 'Q1', type: '单选题', title: '心脏的起搏点是？', correctRate: '91%', avgScore: 4.6, total: 5, difficulty: '简单', analysis: '91%学生答对，基础知识掌握扎实' },
          { id: 'Q2', type: '单选题', title: '肺循环的路径是？', correctRate: '76%', avgScore: 3.8, total: 5, difficulty: '中等', analysis: '76%学生答对，15%混淆了体循环和肺循环的路径，建议使用血液循环示意图强化记忆' },
          { id: 'Q3', type: '简答题', title: '请简述免疫系统的组成', correctRate: '63%', avgScore: 11.3, total: 18, difficulty: '中等', analysis: '63%学生得分12分以上，主要失分点：未提及"免疫器官"和"免疫分子"，建议以思维导图形式梳理免疫系统层级' },
          { id: 'Q4', type: '论述题', title: '结合临床案例，分析呼吸系统与循环系统的协同工作机制', correctRate: '48%', avgScore: 9.6, total: 20, difficulty: '困难', analysis: '48%学生得分15分以上，主要问题：缺乏临床案例联系能力，建议增加PBL(问题导向学习)教学环节' },
          { id: 'Q5', type: '多选题', title: '人体内环境稳态的调节机制包括？', correctRate: '70%', avgScore: 3.5, total: 5, difficulty: '中等', analysis: '70%学生完全答对，常见错误为漏选"体液调节"，需强调神经-体液-免疫调节网络的整体性' },
        ],
      },
    };

    function renderExamAnalysis(examId) {
      const ed = examData[examId];
      if (!ed) return;
      document.getElementById('examAnalysis').innerHTML = `
        <div style="margin-bottom:12px"><b>${ed.name}</b> <span style="font-size:12px;color:var(--text-muted)">提交人数: ${ed.submitCount}/${ed.totalStudents} | 平均分: ${ed.avgScore} | 最高分: ${ed.maxScore} | 最低分: ${ed.minScore}</span></div>
        ${ed.questions.map((q, i) => `
          <div style="padding:12px;background:var(--primary-bg);border-radius:8px;margin-bottom:10px">
            <div class="flex-between"><b>${q.id}. ${q.title}</b><span class="badge badge-${q.difficulty==='简单'?'success':q.difficulty==='中等'?'info':'danger'}">${q.difficulty}</span></div>
            <div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:var(--text-muted)">
              <span>类型: ${q.type}</span><span>正确率: <b style="color:${parseInt(q.correctRate)>=80?'var(--success)':parseInt(q.correctRate)>=60?'var(--warning)':'var(--danger)'}">${q.correctRate}</b></span><span>均分: ${q.avgScore}/${q.total}</span>
            </div>
            <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);background:var(--warning-bg);padding:8px;border-radius:6px">
              <b>分析建议：</b>${q.analysis}
            </div>
          </div>
        `).join('')}
      `;
    }

    document.getElementById('examSelect').addEventListener('change', (e) => renderExamAnalysis(e.target.value));
    renderExamAnalysis('assign1');

    // 学生列表
    document.getElementById('studentTableBody').innerHTML = stats.students.map(s => `
      <tr><td>${s.studentId}</td><td><b>${s.name}</b></td><td>${s.score}</td><td><div style="display:flex;align-items:center;gap:4px"><div class="progress-bar" style="width:60px"><div class="progress-fill ${s.completion>=80?'success':s.completion>=60?'warning':'danger'}" style="width:${s.completion}%"></div></div>${s.completion}%</div></td><td><div style="display:flex;align-items:center;gap:4px"><div class="progress-bar" style="width:60px"><div class="progress-fill ${s.mastery>=80?'success':s.mastery>=60?'warning':'danger'}" style="width:${s.mastery}%"></div></div>${s.mastery}%</div></td><td>${s.participation}</td><td><span class="badge badge-${s.status==='优秀'?'success':s.status==='良好'?'primary':s.status==='中等'?'info':'danger'}">${s.status}</span></td><td><button class="btn btn-outline btn-sm view-student-btn" data-id="${s.id}">画像</button><button class="btn btn-ghost btn-sm remind-btn" data-id="${s.id}" style="color:var(--danger)">${s.status==='待提升'?'一键提醒':''}</button></td></tr>
    `).join('');

    document.querySelectorAll('.remind-btn').forEach(btn => {
      if (btn.textContent.trim()) {
        btn.addEventListener('click', () => {
          const s = stats.students.find(ss=>ss.id===parseInt(btn.dataset.id));
          const reminders = Store.get('studentReminders') || [];
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          reminders.push({
            id: Date.now(),
            studentId: s.id,
            studentName: s.name,
            studentNo: s.studentId,
            courseName: stats.courseName,
            message: `${s.name}同学，您在${stats.courseName}课程中成绩为${s.score}分，完成率${s.completion}%，请加强学习。`,
            time: timeStr,
            type: '学习提醒',
          });
          Store.set('studentReminders', reminders);
          App.showToast(`已向 ${s.name} 发送学习提醒`, 'success');
          btn.textContent = '已提醒';
          btn.style.color = 'var(--success)';
          btn.disabled = true;
        });
      }
    });

    document.querySelectorAll('.view-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = stats.students.find(ss=>ss.id===parseInt(btn.dataset.id));
        const radarData = [
          { label: '视频学习', val: Math.round(s.completion), max: 100 },
          { label: '作业完成', val: Math.round(s.completion * 0.85), max: 100 },
          { label: '知识掌握', val: Math.round(s.mastery), max: 100 },
          { label: '课堂参与', val: Math.round(s.participation / 20 * 100), max: 100 },
          { label: '考试成绩', val: s.score, max: 100 },
        ];
        const radarHTML = radarData.map((d, i) => {
          const angle = i * 72 - 90;
          const radius = d.val / d.max * 80;
          const x = Math.round(radius * Math.cos(angle * Math.PI / 180)) + 100;
          const y = Math.round(radius * Math.sin(angle * Math.PI / 180)) + 100;
          return `<circle cx="${x}" cy="${y}" r="4" fill="var(--primary)"/><line x1="100" y1="100" x2="${x}" y2="${y}" stroke="var(--primary-light)" stroke-width="1"/><text x="${Math.round(radius * 1.25 * Math.cos(angle * Math.PI / 180)) + 100}" y="${Math.round(radius * 1.25 * Math.sin(angle * Math.PI / 180)) + 100}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${d.label}</text>`;
        }).join('');

        const polygonPoints = radarData.map((d, i) => {
          const angle = i * 72 - 90;
          const radius = d.val / d.max * 80;
          const x = Math.round(radius * Math.cos(angle * Math.PI / 180)) + 100;
          const y = Math.round(radius * Math.sin(angle * Math.PI / 180)) + 100;
          return `${x},${y}`;
        }).join(' ');

        const suggestions = s.status === '待提升'
          ? '1. 建议每周安排2次一对一辅导\n2. 重点关注基础知识点掌握\n3. 增加课堂互动参与机会\n4. 制定个性化学习计划并跟踪'
          : s.status === '优秀'
          ? '1. 继续保持优秀的学习习惯\n2. 可参与科研创新项目\n3. 建议担任学习小组组长\n4. 拓展跨学科知识学习'
          : '1. 保持当前学习节奏\n2. 针对薄弱知识点加强练习\n3. 积极参加课堂互动\n4. 定期复习巩固已学内容';

        App.showModal(`学生画像 - ${s.name}`, `
          <div class="stats-row"><div class="stat-card"><div class="stat-icon primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></div><div class="stat-info"><div class="stat-value">${s.score}</div><div class="stat-label">成绩</div></div></div><div class="stat-card"><div class="stat-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/></svg></div><div class="stat-info"><div class="stat-value">${s.completion}%</div><div class="stat-label">完成率</div></div></div><div class="stat-card"><div class="stat-icon warning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg></div><div class="stat-info"><div class="stat-value">${s.mastery}%</div><div class="stat-label">掌握率</div></div></div></div>
          <div class="grid-2" style="margin-top:16px"><div><b>基本信息</b><p style="font-size:13px;color:var(--text-muted);margin-top:4px">学号: ${s.studentId}<br>姓名: ${s.name}<br>状态: <span class="badge badge-${s.status==='优秀'?'success':s.status==='良好'?'primary':s.status==='中等'?'info':'danger'}">${s.status}</span><br>课堂参与: ${s.participation}次</p></div><div><b>能力雷达图</b><svg viewBox="0 0 200 200" style="width:100%;max-width:200px"><polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="var(--border)" stroke-width="1"/><polygon points="100,60 140,100 100,140 60,100" fill="none" stroke="var(--border)" stroke-width="1"/><polygon points="${polygonPoints}" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="2" opacity="0.7"/>${radarHTML}</svg></div></div>
          <div style="margin-top:16px"><b>综合评价</b><p style="font-size:13px;color:var(--text-secondary);margin-top:4px">${s.status==='待提升'?'该生整体表现低于班级平均水平，课堂参与度偏低，完成率不足75%，需要重点关注并加强辅导。建议采取以下措施：':'成绩良好，能够按时完成学习任务，课堂参与度较高。建议继续保持学习状态，并在薄弱环节加强练习。'}</p></div>
          <div style="margin-top:12px"><b>提升建议</b><pre style="font-size:12px;color:var(--text-secondary);background:var(--primary-bg);padding:12px;border-radius:8px;margin-top:4px;white-space:pre-line">${suggestions}</pre></div>
        `, `<button class="btn btn-outline modal-close-btn">关闭</button>`, 'modal-lg');
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
      });
    });
  }

  sel.addEventListener('change', (e) => loadStats(parseInt(e.target.value)));
  loadStats(1);

  // AI 问答
  const analysisAnswers = {
    '班级整体掌握率': '当前班级整体掌握率为75.1%。其中骨骼系统掌握率最高(85%)，神经系统最低(67.5%)。建议加强神经系统相关知识点的教学与练习。',
    '视频完成情况': '班级视频完成率85.2%，共186名学生。其中128人已完成全部视频学习，38人完成80%以上，20人完成率低于60%，需要重点关注。',
    '成绩分布': '班级成绩分布：90-100分35人(18.8%)，80-89分58人(31.2%)，70-79分47人(25.3%)，60-69分28人(15.1%)，60分以下18人(9.7%)。整体呈正态分布。',
    '待提升': '目前有3名学生成绩低于60分需要重点关注：陈静(55分)、周杰(58分)、刘洋(62分)。建议对这些学生进行一对一辅导，并关注其学习进度。',
    '作业': '作业完成率72.8%，其中28份作业未提交。诊断学相关作业完成率最高(88%)，解剖学实验报告完成率较低(65%)。',
    '考试': '考试平均分81.3分，最高分95分，最低分38分。及格率90.3%。选择题正确率较高(85%)，论述题得分偏低(68%)。',
  };

  const chatMessages = document.getElementById('analysisChatMessages');
  chatMessages.innerHTML = `<div class="chat-message assistant"><div class="msg-avatar">AI</div><div class="msg-bubble">您好！我是AI学情分析助手，您可以问我关于班级学情的任何问题，如：班级整体掌握率、视频完成情况、成绩分布、待提升学生等。</div></div>`;

  document.getElementById('analysisChatSend').addEventListener('click', () => {
    const input = document.getElementById('analysisChatInput');
    const q = input.value.trim();
    if (!q) return;
    chatMessages.innerHTML += `<div class="chat-message user"><div class="msg-avatar">${App.currentUser?.avatar||'?'}</div><div class="msg-bubble">${q}</div></div>`;
    let answer = '抱歉，我暂时无法回答这个问题。请尝试询问关于班级整体掌握率、视频完成情况、成绩分布、作业完成情况或考试分析等问题。';
    for (const [key, val] of Object.entries(analysisAnswers)) {
      if (q.includes(key)) { answer = val; break; }
    }
    setTimeout(() => {
      chatMessages.innerHTML += `<div class="chat-message assistant"><div class="msg-avatar">AI</div><div class="msg-bubble">${answer}</div></div>`;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 500);
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  document.getElementById('analysisChatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('analysisChatSend').click();
  });

  document.getElementById('saveQuestionBtn').addEventListener('click', () => {
    const sq = Store.get('savedQuestions') || [];
    sq.push({ id: Date.now(), question: '班级学情分析', answer: '当前班级整体掌握率为75.1%', createdAt: new Date().toISOString().split('T')[0] });
    Store.set('savedQuestions', sq);
    App.showToast('已保存为常见问题', 'success');
  });

  document.getElementById('scheduledPushBtn').addEventListener('click', () => {
    App.showModal('设置定时推送', `
      <div class="form-group"><label class="form-label">推送名称</label><input class="form-input" id="pushName" value="学情数据推送"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">推送频率</label><select class="form-select" id="pushFreq"><option>每日 09:00</option><option>每周一 09:00</option><option>每月1日 09:00</option></select></div><div class="form-group"><label class="form-label">数据类型</label><select class="form-select" id="pushType"><option>班级整体学情</option><option>成绩预警</option><option>完成率统计</option></select></div></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="confirmPushBtn">确认设置</button>`);
    document.getElementById('confirmPushBtn').addEventListener('click', () => {
      const sp = Store.get('scheduledPushes') || [];
      sp.push({ id: Date.now(), name: document.getElementById('pushName').value, type: '学情分析', frequency: document.getElementById('pushFreq').value, dataType: document.getElementById('pushType').value, status: '启用', createdAt: new Date().toISOString().split('T')[0] });
      Store.set('scheduledPushes', sp);
      document.querySelector('.modal-overlay').remove();
      App.showToast('定时推送设置成功', 'success');
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });
};