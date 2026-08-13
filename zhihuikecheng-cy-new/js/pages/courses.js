/* 课程管理、课程设计、视频资源、数字人管理、系统设置 */
PageRenderers.courses = () => `
<div class="page-header"><h2>课程管理</h2><p>管理全部15门智慧课程的建设与运行</p></div>
<div class="card"><div class="card-header"><span class="card-title">课程列表</span><div class="search-bar"><input type="text" class="form-input" id="courseSearch" placeholder="搜索课程名称..."><select class="form-select" id="courseStatusFilter" style="width:140px"><option value="">全部状态</option><option value="进行中">进行中</option><option value="已完成">已完成</option></select><button class="btn btn-primary" id="addCourseBtn">+ 新建课程</button></div></div>
<div class="card-body"><div class="table-wrapper"><table><thead><tr><th>课程编号</th><th>课程名称</th><th>授课教师</th><th>所属学院</th><th>学生数</th><th>建设进度</th><th>资源数</th><th>状态</th><th>操作</th></tr></thead><tbody id="courseTableBody"></tbody></table></div><div class="pagination" id="coursePagination"></div></div></div>`;

PageInits.courses = () => {
  const courses = Store.get('courses');
  let filtered = [...courses];
  const pageSize = 10;
  let currentPage = 1;

  function renderTable(data) {
    const tbody = document.getElementById('courseTableBody');
    const start = (currentPage - 1) * pageSize;
    const pageData = data.slice(start, start + pageSize);
    tbody.innerHTML = pageData.map(c => `
      <tr><td>${c.code}</td><td><b>${c.name}</b></td><td>${c.teacher}</td><td>${c.college}</td><td>${c.students}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div class="progress-bar" style="width:100px"><div class="progress-fill primary" style="width:${c.progress}%"></div></div><span style="font-size:11px">${c.progress}%</span></div></td>
      <td>${c.resources}</td><td><span class="badge badge-${c.status==='进行中'?'info':'success'}">${c.status}</span></td>
      <td><button class="btn btn-outline btn-sm edit-course-btn" data-id="${c.id}">编辑</button><button class="btn btn-ghost btn-sm view-course-btn" data-id="${c.id}">详情</button></td></tr>
    `).join('');
    const totalPages = Math.ceil(data.length / pageSize);
    const pag = document.getElementById('coursePagination');
    pag.innerHTML = `<button ${currentPage===1?'disabled':''}>«</button>${Array.from({length:totalPages},(_,i)=>`<button class="${currentPage===i+1?'active':''}">${i+1}</button>`).join('')}<button ${currentPage===totalPages?'disabled':''}>»</button>`;
    pag.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.textContent === '«') currentPage = Math.max(1, currentPage - 1);
        else if (btn.textContent === '»') currentPage = Math.min(totalPages, currentPage + 1);
        else currentPage = parseInt(btn.textContent);
        renderTable(filtered);
      });
    });
    document.querySelectorAll('.edit-course-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const course = courses.find(c => c.id === id);
        App.showModal('编辑课程', `
          <div class="form-group"><label class="form-label">课程名称</label><input class="form-input" id="editCourseName" value="${course.name}"></div>
          <div class="form-row"><div class="form-group"><label class="form-label">课程编号</label><input class="form-input" id="editCourseCode" value="${course.code}"></div><div class="form-group"><label class="form-label">授课教师</label><input class="form-input" id="editCourseTeacher" value="${course.teacher}"></div></div>
          <div class="form-group"><label class="form-label">所属学院</label><input class="form-input" id="editCourseCollege" value="${course.college}"></div>
        `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveCourseBtn">保存</button>`);
        document.getElementById('saveCourseBtn').addEventListener('click', () => {
          course.name = document.getElementById('editCourseName').value;
          course.code = document.getElementById('editCourseCode').value;
          course.teacher = document.getElementById('editCourseTeacher').value;
          course.college = document.getElementById('editCourseCollege').value;
          Store.set('courses', courses);
          document.querySelector('.modal-overlay').remove();
          App.showToast('课程信息已更新', 'success');
          renderTable(filtered);
        });
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
      });
    });
  }

  renderTable(filtered);
  document.getElementById('courseSearch').addEventListener('input', (e) => {
    currentPage = 1;
    filtered = courses.filter(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()));
    renderTable(filtered);
  });
  document.getElementById('courseStatusFilter').addEventListener('change', (e) => {
    currentPage = 1;
    filtered = e.target.value ? courses.filter(c => c.status === e.target.value) : [...courses];
    renderTable(filtered);
  });
  document.getElementById('addCourseBtn').addEventListener('click', () => {
    App.showModal('新建课程', `
      <div class="form-group"><label class="form-label">课程名称 <span class="required">*</span></label><input class="form-input" id="newCourseName"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">课程编号</label><input class="form-input" id="newCourseCode"></div><div class="form-group"><label class="form-label">授课教师</label><input class="form-input" id="newCourseTeacher"></div></div>
      <div class="form-group"><label class="form-label">所属学院</label><input class="form-input" id="newCourseCollege"></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveNewCourseBtn">创建</button>`);
    document.getElementById('saveNewCourseBtn').addEventListener('click', () => {
      courses.push({
        id: Math.max(...courses.map(c=>c.id)) + 1,
        name: document.getElementById('newCourseName').value || '新课程',
        code: document.getElementById('newCourseCode').value || 'MED' + (Math.max(...courses.map(c=>c.id))+1),
        teacher: document.getElementById('newCourseTeacher').value || '待分配',
        college: document.getElementById('newCourseCollege').value || '待分配',
        students: 0, progress: 0, status: '进行中', chapters: 0, resources: 0,
        createdAt: new Date().toISOString().split('T')[0],
      });
      Store.set('courses', courses);
      document.querySelector('.modal-overlay').remove();
      App.showToast('课程创建成功', 'success');
      filtered = [...courses];
      renderTable(filtered);
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });
};

/* 课程设计 */
PageRenderers.courseDesign = () => `
<div class="page-header"><h2>课程设计</h2><p>智慧课程设计一对一指导，基于"四新"建设要求进行课程内容重构</p></div>
<div class="card"><div class="card-header"><span class="card-title">设计指导记录</span></div><div class="card-body"><table><thead><tr><th>课程名称</th><th>设计负责人</th><th>目标分析</th><th>内容重构</th><th>教学模式</th><th>状态</th><th>操作</th></tr></thead><tbody id="designTableBody"></tbody></table></div></div>`;

PageInits.courseDesign = () => {
  const courses = Store.get('courses') || [];
  document.getElementById('designTableBody').innerHTML = courses.map(c => `
    <tr><td><b>${c.name}</b></td><td>${c.teacher}</td><td><span class="badge badge-${c.progress>70?'success':'warning'}">${c.progress>70?'已完成':'进行中'}</span></td><td><span class="badge badge-${c.progress>60?'success':'info'}">${c.progress>60?'已重构':'待重构'}</span></td><td>混合式教学</td><td><span class="badge badge-info">${c.status}</span></td><td><button class="btn btn-outline btn-sm design-detail-btn" data-id="${c.id}">查看详情</button></td></tr>
  `).join('');

  document.querySelectorAll('.design-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = courses.find(c => c.id === parseInt(btn.dataset.id));
      App.showModal('课程设计详情 - ' + course.name, `
        <div style="margin-bottom:16px"><b>课程信息</b><p>名称: ${course.name} | 教师: ${course.teacher} | 学院: ${course.college}</p></div>
        <div style="margin-bottom:16px"><b>课程目标分析</b><div class="markdown-preview"><ul><li>知识目标：掌握${course.name}核心概念与理论体系</li><li>能力目标：培养临床思维与问题解决能力</li><li>素养目标：树立医学人文关怀与职业道德</li></ul></div></div>
        <div style="margin-bottom:16px"><b>内容重构方案</b><div class="markdown-preview"><ul><li>重构前：传统章节式教学，${course.chapters}章</li><li>重构后：基于知识图谱的模块化教学，${course.resources}个资源包</li><li>新增：虚拟仿真实验、案例教学、PBL讨论</li></ul></div></div>
        <div style="margin-bottom:16px"><b>教学模式</b><p>混合式教学（线上+线下） | 翻转课堂 | 小组协作学习</p><div class="progress-bar mt-4"><div class="progress-fill primary" style="width:${course.progress}%"></div></div><span style="font-size:12px;color:var(--text-muted)">建设进度 ${course.progress}%</span></div>
      `, `<button class="btn btn-outline modal-close-btn">关闭</button>`);
      document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
    });
  });
};

/* 视频资源 */
PageRenderers.videoResources = () => `
<div class="page-header"><h2>视频资源</h2><p>课程视频资源建设与管理，支持数字人视频制作</p></div>
<div class="card"><div class="card-header"><span class="card-title">视频资源列表</span><div class="btn-group"><button class="btn btn-primary" id="addVideoBtn">+ 上传视频</button><select class="form-select" id="videoCourseFilter" style="width:160px"><option value="">全部课程</option></select></div></div>
<div class="card-body"><table><thead><tr><th>视频名称</th><th>所属课程</th><th>时长</th><th>大小</th><th>格式</th><th>分辨率</th><th>状态</th><th>操作</th></tr></thead><tbody id="videoTableBody"></tbody></table></div></div>`;

PageInits.videoResources = () => {
  const videos = Store.get('videos') || [];
  const courses = Store.get('courses') || [];
  const sel = document.getElementById('videoCourseFilter');
  sel.innerHTML = '<option value="">全部课程</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  function renderVideos(filter) {
    const data = filter ? videos.filter(v => v.courseId === filter) : videos;
    document.getElementById('videoTableBody').innerHTML = data.map(v => `
      <tr><td><b>${v.title}</b></td><td>${v.courseName}</td><td>${App.formatDuration(v.duration)}</td><td>${v.size}</td><td>${v.format}</td><td>${v.resolution}</td><td><span class="badge badge-${v.status==='已完成'?'success':v.status==='制作中'?'warning':'info'}">${v.status}</span></td><td><button class="btn btn-outline btn-sm video-preview-btn" data-id="${v.id}">预览</button><button class="btn btn-ghost btn-sm video-download-btn" data-id="${v.id}">下载</button></td></tr>
    `).join('');
    document.querySelectorAll('.video-preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vid = videos.find(v => v.id === parseInt(btn.dataset.id));
        App.showModal('视频预览 - ' + vid.title, `
          <div style="background:#000;border-radius:8px;padding:60px;text-align:center;position:relative">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            <p style="color:#fff;margin-top:8px">${vid.title}</p>
            <p style="color:#999;font-size:12px">时长: ${App.formatDuration(vid.duration)} | 分辨率: ${vid.resolution} | 格式: ${vid.format}</p>
            <div style="margin-top:12px;display:flex;gap:8px;justify-content:center"><button class="btn btn-primary btn-sm" id="simPlayBtn">▶ 播放</button><button class="btn btn-outline btn-sm" id="simPauseBtn" style="color:#fff;border-color:#fff">⏸ 暂停</button></div>
            <div class="progress-bar mt-8" style="width:100%"><div class="progress-fill primary" style="width:0%" id="simProgress"></div></div>
            <span id="simTime" style="font-size:12px;color:#999">00:00 / ${App.formatDuration(vid.duration)}</span>
          </div>
        `, `<button class="btn btn-outline modal-close-btn">关闭</button>`);
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
        let simSec = 0; const totalSec = vid.duration;
        const simTimer = setInterval(() => {
          simSec++;
          const pct = Math.min(100, Math.round(simSec / totalSec * 100));
          document.getElementById('simProgress').style.width = pct + '%';
          const m = Math.floor(simSec / 60), s = simSec % 60;
          document.getElementById('simTime').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} / ${App.formatDuration(totalSec)}`;
          if (simSec >= totalSec) { clearInterval(simTimer); document.getElementById('simTime').textContent = '播放完毕'; }
        }, 200);
        document.getElementById('simPauseBtn').addEventListener('click', () => { clearInterval(simTimer); });
        document.getElementById('simPlayBtn').addEventListener('click', () => {
          if (simSec >= totalSec) simSec = 0;
          const t2 = setInterval(() => {
            simSec++;
            const pct = Math.min(100, Math.round(simSec / totalSec * 100));
            document.getElementById('simProgress').style.width = pct + '%';
            const m = Math.floor(simSec / 60), s = simSec % 60;
            document.getElementById('simTime').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} / ${App.formatDuration(totalSec)}`;
            if (simSec >= totalSec) { clearInterval(t2); document.getElementById('simTime').textContent = '播放完毕'; }
          }, 200);
        });
      });
    });
    document.querySelectorAll('.video-download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vid = videos.find(v => v.id === parseInt(btn.dataset.id));
        const blob = new Blob([`# ${vid.title}\n\n课程: ${vid.courseName}\n时长: ${App.formatDuration(vid.duration)}\n格式: ${vid.format}\n分辨率: ${vid.resolution}\n\n(视频资源文件)`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = vid.title + '.txt'; a.click();
        URL.revokeObjectURL(url);
        App.showToast('视频资源下载已开始', 'success');
      });
    });
  }
  renderVideos();
  sel.addEventListener('change', (e) => renderVideos(e.target.value ? parseInt(e.target.value) : null));
  document.getElementById('addVideoBtn').addEventListener('click', () => {
    App.showModal('上传视频', `
      <div class="form-group"><label class="form-label">视频名称</label><input class="form-input" id="newVideoName"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">所属课程</label><select class="form-select" id="newVideoCourse">${courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">时长(秒)</label><input class="form-input" id="newVideoDuration" type="number" value="600"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">格式</label><select class="form-select" id="newVideoFormat"><option>MP4</option><option>AVI</option><option>MOV</option></select></div><div class="form-group"><label class="form-label">分辨率</label><select class="form-select" id="newVideoRes"><option>1080P</option><option>4K</option><option>720P</option></select></div></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveVideoBtn">上传</button>`);
    document.getElementById('saveVideoBtn').addEventListener('click', () => {
      const courseId = parseInt(document.getElementById('newVideoCourse').value);
      const course = courses.find(c => c.id === courseId);
      videos.push({
        id: Math.max(...videos.map(v=>v.id), 0) + 1,
        title: document.getElementById('newVideoName').value || '新视频',
        courseId, courseName: course?.name || '',
        duration: parseInt(document.getElementById('newVideoDuration').value) || 600,
        size: Math.floor(Math.random()*500+100) + 'MB',
        format: document.getElementById('newVideoFormat').value,
        resolution: document.getElementById('newVideoRes').value,
        status: '已完成',
      });
      Store.set('videos', videos);
      document.querySelector('.modal-overlay').remove();
      App.showToast('视频上传成功', 'success');
      renderVideos();
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });
};

/* 数字人管理 */
PageRenderers.digitalHuman = () => `
<div class="page-header"><h2>数字人管理</h2><p>AI数字人定制与管理，支持真人形象与声音定制</p></div>
<div class="card"><div class="card-header"><span class="card-title">数字人列表</span><button class="btn btn-primary" id="addDigitalHumanBtn">+ 创建数字人</button></div>
<div class="card-body"><table><thead><tr><th>数字人名称</th><th>关联教师</th><th>关联课程</th><th>声音类型</th><th>支持语言</th><th>状态</th><th>操作</th></tr></thead><tbody id="digitalHumanTableBody"></tbody></table></div></div>`;

PageInits.digitalHuman = () => {
  const dhs = Store.get('digitalHumans') || [];
  const courses = Store.get('courses') || [];

  function renderDigitalHumans() {
    document.getElementById('digitalHumanTableBody').innerHTML = dhs.map(d => `
      <tr><td><b>${d.name}</b></td><td>${d.teacher}</td><td>${d.course}</td><td>${d.voice}</td><td>${d.languages.join('、')}</td><td><span class="badge badge-${d.status==='已上线'?'success':'warning'}">${d.status}</span></td><td><button class="btn btn-outline btn-sm dh-edit-btn" data-id="${d.id}">编辑</button><button class="btn btn-ghost btn-sm dh-preview-btn" data-id="${d.id}">预览</button></td></tr>
    `).join('');

    document.querySelectorAll('.dh-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dh = dhs.find(d => d.id === parseInt(btn.dataset.id));
        App.showModal('编辑数字人 - ' + dh.name, `
          <div class="form-group"><label class="form-label">数字人名称</label><input class="form-input" id="editDhName" value="${dh.name}"></div>
          <div class="form-row"><div class="form-group"><label class="form-label">关联教师</label><input class="form-input" id="editDhTeacher" value="${dh.teacher}"></div><div class="form-group"><label class="form-label">声音类型</label><select class="form-select" id="editDhVoice"><option ${dh.voice==='温柔女声'?'selected':''}>温柔女声</option><option ${dh.voice==='沉稳男声'?'selected':''}>沉稳男声</option><option ${dh.voice==='知性女声'?'selected':''}>知性女声</option></select></div></div>
          <div class="form-group"><label class="form-label">支持语言</label><input class="form-input" id="editDhLang" value="${dh.languages.join('、')}"></div>
        `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveDhBtn">保存</button>`);
        document.getElementById('saveDhBtn').addEventListener('click', () => {
          dh.name = document.getElementById('editDhName').value;
          dh.teacher = document.getElementById('editDhTeacher').value;
          dh.voice = document.getElementById('editDhVoice').value;
          dh.languages = document.getElementById('editDhLang').value.split('、');
          Store.set('digitalHumans', dhs);
          document.querySelector('.modal-overlay').remove();
          App.showToast('数字人信息已更新', 'success');
          renderDigitalHumans();
        });
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
      });
    });

    document.querySelectorAll('.dh-preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dh = dhs.find(d => d.id === parseInt(btn.dataset.id));
        App.showModal('数字人预览 - ' + dh.name, `
          <div style="display:flex;gap:24px;align-items:center">
            <div style="width:200px;height:200px;background:linear-gradient(135deg,var(--primary-bg),var(--warning-bg));border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--primary)" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
            </div>
            <div>
              <h3>${dh.name}</h3>
              <p>教师: ${dh.teacher} | 课程: ${dh.course}</p>
              <p>声音: ${dh.voice} | 语言: ${dh.languages.join('、')}</p>
              <p style="color:var(--text-muted);font-size:12px">状态: ${dh.status}</p>
              <div style="margin-top:12px;display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" id="ttsDemoBtn">🎤 试听语音</button>
                <button class="btn btn-outline btn-sm" id="videoDemoBtn">📹 生成视频</button>
              </div>
              <div id="ttsResult" style="margin-top:8px;font-size:12px;color:var(--text-muted);display:none"></div>
            </div>
          </div>
        `, `<button class="btn btn-outline modal-close-btn">关闭</button>`);
        document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
        document.getElementById('ttsDemoBtn').addEventListener('click', () => {
          const el = document.getElementById('ttsResult');
          el.style.display = 'block';
          el.innerHTML = '🔊 正在生成语音...';
          setTimeout(() => { el.innerHTML = '✅ 语音生成完成：' + dh.voice + ' - "同学们好，欢迎来到智慧课程学习平台，我是你们的AI助教' + dh.name + '。"'; }, 1500);
        });
        document.getElementById('videoDemoBtn').addEventListener('click', () => {
          App.showToast('视频生成任务已提交，预计3分钟后完成', 'info');
        });
      });
    });
  }

  renderDigitalHumans();

  document.getElementById('addDigitalHumanBtn').addEventListener('click', () => {
    App.showModal('创建数字人', `
      <div class="form-group"><label class="form-label">数字人名称</label><input class="form-input" id="newDhName"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">关联教师</label><input class="form-input" id="newDhTeacher"></div><div class="form-group"><label class="form-label">关联课程</label><select class="form-select" id="newDhCourse">${courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}</select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">声音类型</label><select class="form-select" id="newDhVoice"><option>温柔女声</option><option>沉稳男声</option><option>知性女声</option></select></div><div class="form-group"><label class="form-label">支持语言</label><input class="form-input" id="newDhLang" value="中文、英文"></div></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveNewDhBtn">创建</button>`);
    document.getElementById('saveNewDhBtn').addEventListener('click', () => {
      dhs.push({
        id: Math.max(...dhs.map(d=>d.id), 0) + 1,
        name: document.getElementById('newDhName').value || '新数字人',
        teacher: document.getElementById('newDhTeacher').value || '待分配',
        course: document.getElementById('newDhCourse').value,
        voice: document.getElementById('newDhVoice').value,
        languages: document.getElementById('newDhLang').value.split('、'),
        status: '训练中',
      });
      Store.set('digitalHumans', dhs);
      document.querySelector('.modal-overlay').remove();
      App.showToast('数字人创建成功', 'success');
      renderDigitalHumans();
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });
};

/* 系统设置 */
PageRenderers.settings = () => `
<div class="page-header"><h2>系统设置</h2><p>平台基础配置与服务管理</p></div>
<div class="card"><div class="card-header"><span class="card-title">服务要求</span></div><div class="card-body"><table><thead><tr><th>序号</th><th>服务内容</th><th>规格</th><th>数量</th><th>状态</th></tr></thead><tbody>
<tr><td>1</td><td>课程建设</td><td>15门智慧课程建设</td><td>15套</td><td><span class="badge badge-success">进行中</span></td></tr>
<tr><td>2</td><td>设计培训</td><td>专业编导协助课程设计</td><td>1项</td><td><span class="badge badge-success">已完成</span></td></tr>
<tr><td>3</td><td>使用培训</td><td>免费智慧课程应用培训</td><td>不限次数</td><td><span class="badge badge-info">持续中</span></td></tr>
<tr><td>4</td><td>运营支持</td><td>每门课程至少1名运营人员</td><td>15人</td><td><span class="badge badge-success">已配置</span></td></tr>
<tr><td>5</td><td>申报支持</td><td>辅助课程申报材料填写</td><td>1项</td><td><span class="badge badge-info">进行中</span></td></tr>
<tr><td>6</td><td>平台对接</td><td>对接重庆市和国家级平台</td><td>1项</td><td><span class="badge badge-warning">对接中</span></td></tr>
<tr><td>7</td><td>运行报告</td><td>每学期课程运行数据分析报告</td><td>2次/年</td><td><span class="badge badge-info">按计划</span></td></tr>
<tr><td>8</td><td>服务期</td><td>2年免费质保与运行服务</td><td>2年</td><td><span class="badge badge-success">生效中</span></td></tr>
<tr><td>9</td><td>响应时效</td><td>7×8小时技术支持</td><td>全天候</td><td><span class="badge badge-success">保障中</span></td></tr>
</tbody></table></div></div>`;