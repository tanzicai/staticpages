/* 微课中心 */
PageRenderers.microCourse = () => `
<div class="page-header"><h2>微课中心</h2><p>按知识点组织微课资源，支持视频学习、自测练习与错题管理</p></div>
<div class="card"><div class="card-header"><span class="card-title">微课列表</span><button class="btn btn-primary" id="addMicroCourseBtn">+ 新建微课</button></div>
<div class="card-body"><table><thead><tr><th>微课名称</th><th>关联知识点</th><th>时长</th><th>类型</th><th>观看次数</th><th>评分</th><th>操作</th></tr></thead><tbody id="microCourseTableBody"></tbody></table></div></div>
<div class="card" style="margin-top:16px" id="microCourseDetail" style="display:none"><div class="card-header"><span class="card-title">微课详情</span></div>
<div class="card-body"><div class="tabs" id="microCourseTabs"><div class="tab-item active" data-tab="analysis">分析</div><div class="tab-item" data-tab="content">学习内容</div><div class="tab-item" data-tab="selftest">自测</div><div class="tab-item" data-tab="materials">资料</div><div class="tab-item" data-tab="errors">错题集</div><div class="tab-item" data-tab="discussion">讨论</div></div><div id="microCourseTabContent"></div></div></div>`;

PageInits.microCourse = () => {
  const microCourses = Store.get('microCourses') || [];
  const points = Store.get('knowledgePoints') || [];
  document.getElementById('microCourseTableBody').innerHTML = microCourses.map(m => {
    const pt = points.find(p => p.id === m.knowledgeId);
    return `<tr><td><b>${m.name}</b></td><td>${pt?.name||'-'}</td><td>${App.formatDuration(m.duration)}</td><td>${m.type}</td><td>${m.views}</td><td>${'★'.repeat(Math.round(m.avgRating))} ${m.avgRating}</td><td><button class="btn btn-outline btn-sm view-micro-btn" data-id="${m.id}">学习</button></td></tr>`;
  }).join('');

  let currentMicroCourse = null;

  document.querySelectorAll('.view-micro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('microCourseDetail').style.display = 'block';
      currentMicroCourse = microCourses.find(m => m.id === parseInt(btn.dataset.id));
      if (currentMicroCourse) {
        currentMicroCourse.views++;
        Store.set('microCourses', microCourses);
      }
      renderMicroCourseDetail(currentMicroCourse);
    });
  });

  function renderMicroCourseDetail(mc) {
    const tabContents = {
      analysis: `<div style="padding:20px"><h4>学习分析</h4><p>知识点掌握率: 85% | 建议学习时长: 15分钟</p><div class="progress-bar mt-8"><div class="progress-fill success" style="width:85%"></div></div><div style="margin-top:16px"><b>学习统计</b><p style="font-size:13px;color:var(--text-muted)">学习人数: ${mc.views} | 平均评分: ${mc.avgRating}</p></div></div>`,
      content: `<div style="padding:20px"><h4>学习内容</h4><div class="markdown-preview"><h3>学习目标</h3><ul><li>理解基本概念和原理</li><li>掌握核心知识点</li><li>能够应用于实际场景</li></ul><h3>视频讲解</h3><div style="background:#f0f2f5;border-radius:8px;padding:40px;text-align:center;cursor:pointer" id="playVideoBtn"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg><p style="margin-top:8px;color:var(--text-muted)">点击播放视频</p></div><div id="videoPlayer" style="display:none;margin-top:16px"></div><h3>核心知识点</h3><ul><li>知识点1：基础概念定义</li><li>知识点2：关键原理阐述</li><li>知识点3：应用案例分析</li></ul></div></div>`,
      selftest: `<div style="padding:20px"><h4>自测练习</h4><div class="card" style="margin-bottom:12px"><div class="card-body"><b>1. 以下哪项是骨骼的主要功能？</b><div class="mt-8"><label class="form-check"><input type="radio" name="q1"> A. 产生热量</label><label class="form-check"><input type="radio" name="q1"> B. 支撑身体</label><label class="form-check"><input type="radio" name="q1"> C. 消化食物</label><label class="form-check"><input type="radio" name="q1"> D. 分泌激素</label></div></div></div><div class="card" style="margin-bottom:12px"><div class="card-body"><b>2. 颅骨的主要功能是？</b><div class="mt-8"><label class="form-check"><input type="radio" name="q2"> A. 支撑身体</label><label class="form-check"><input type="radio" name="q2"> B. 保护大脑</label><label class="form-check"><input type="radio" name="q2"> C. 产生血液</label><label class="form-check"><input type="radio" name="q2"> D. 储存钙质</label></div></div></div><button class="btn btn-primary" id="submitTestBtn">提交答案</button><div id="testResult" class="mt-16" style="display:none"></div></div>`,
      materials: `<div style="padding:20px"><h4>学习资料</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="card" style="cursor:pointer" id="downloadPdfBtn"><div class="card-body"><div style="display:flex;align-items:center;gap:12px"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div><b>教材文档</b><p style="font-size:12px;color:var(--text-muted)">骨骼系统教材.pdf</p></div></div></div></div><div class="card" style="cursor:pointer" id="downloadPptBtn"><div class="card-body"><div style="display:flex;align-items:center;gap:12px"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--warning)" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><div><b>PPT课件</b><p style="font-size:12px;color:var(--text-muted)">骨骼结构示意图.pptx</p></div></div></div></div><div class="card" style="cursor:pointer"><div class="card-body"><div style="display:flex;align-items:center;gap:12px"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><div><b>推荐阅读</b><p style="font-size:12px;color:var(--text-muted)">人体解剖学图谱</p></div></div></div></div><div class="card" style="cursor:pointer"><div class="card-body"><div style="display:flex;align-items:center;gap:12px"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg><div><b>3D模型</b><p style="font-size:12px;color:var(--text-muted)">3D骨骼模型演示</p></div></div></div></div></div></div>`,
      errors: `<div style="padding:20px"><h4>错题集</h4><div class="card" style="margin-bottom:12px"><div class="card-body"><div class="flex-between"><div><b>错题1:</b> 骨骼的主要功能（单选）<br><span style="color:var(--danger)">你的答案: A</span> | <span style="color:var(--success)">正确答案: B</span></div><span class="badge badge-danger">错误</span></div><p style="font-size:12px;color:var(--text-muted);margin-top:8px">解析：骨骼的主要功能是支撑身体、保护内脏器官、协助运动等。</p></div></div><div class="card" style="margin-bottom:12px"><div class="card-body"><div class="flex-between"><div><b>错题2:</b> 颅骨的主要功能（单选）<br><span style="color:var(--danger)">你的答案: A</span> | <span style="color:var(--success)">正确答案: B</span></div><span class="badge badge-danger">错误</span></div><p style="font-size:12px;color:var(--text-muted);margin-top:8px">解析：颅骨的主要功能是保护大脑，形成颅腔。</p></div></div></div>`,
      discussion: `<div style="padding:20px"><h4>讨论区</h4><div class="card" style="margin-bottom:12px"><div class="card-body"><div style="display:flex;gap:12px"><div class="avatar" style="width:36px;height:36px;border-radius:50%;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">李</div><div><b>李明</b> <span style="font-size:12px;color:var(--text-muted)">2026-08-10 15:30</span><p style="margin-top:4px">骨骼系统这个章节的视频讲解很清晰，3D模型演示帮助很大！</p><div style="margin-top:8px;display:flex;gap:12px;font-size:12px;color:var(--text-muted)"><span>👍 12</span><span class="reply-btn" style="cursor:pointer">💬 回复</span></div></div></div></div></div><div class="card" style="margin-bottom:12px"><div class="card-body"><div style="display:flex;gap:12px"><div class="avatar" style="width:36px;height:36px;border-radius:50%;background:var(--warning-bg);color:var(--warning);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">王</div><div><b>王芳</b> <span style="font-size:12px;color:var(--text-muted)">2026-08-10 16:20</span><p style="margin-top:4px">请问颅骨结构的自测题第3题，答案为什么是C？</p><div style="margin-top:8px;display:flex;gap:12px;font-size:12px;color:var(--text-muted)"><span>👍 5</span><span class="reply-btn" style="cursor:pointer">💬 回复</span></div></div></div></div></div><div class="chat-input-area" style="border-top:1px solid var(--border);padding-top:12px"><input type="text" class="form-input" id="discussInput" placeholder="发表你的讨论..."><button class="btn btn-primary" id="sendDiscussBtn">发送</button></div><div id="newDiscussions"></div></div>`,
    };
    document.getElementById('microCourseTabContent').innerHTML = tabContents.analysis;
  }

  document.querySelectorAll('#microCourseTabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#microCourseTabs .tab-item').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const tabContents = {
        analysis: `<div style="padding:20px"><h4>学习分析</h4><p>知识点掌握率: 85% | 建议学习时长: 15分钟</p><div class="progress-bar mt-8"><div class="progress-fill success" style="width:85%"></div></div></div>`,
        content: `<div style="padding:20px"><h4>学习内容</h4><div class="markdown-preview"><h3>学习目标</h3><ul><li>理解基本概念和原理</li><li>掌握核心知识点</li><li>能够应用于实际场景</li></ul><h3>视频讲解</h3><div style="background:#f0f2f5;border-radius:8px;padding:40px;text-align:center;cursor:pointer" id="playVideoBtn"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg><p style="margin-top:8px;color:var(--text-muted)">点击播放视频</p></div><div id="videoPlayer" style="display:none;margin-top:16px"></div></div></div>`,
        selftest: `<div style="padding:20px"><h4>自测练习</h4><div class="card" style="margin-bottom:12px"><div class="card-body"><b>1. 以下哪项是骨骼的主要功能？</b><div class="mt-8"><label class="form-check"><input type="radio" name="q1"> A. 产生热量</label><label class="form-check"><input type="radio" name="q1"> B. 支撑身体</label><label class="form-check"><input type="radio" name="q1"> C. 消化食物</label><label class="form-check"><input type="radio" name="q1"> D. 分泌激素</label></div></div></div><button class="btn btn-primary" id="submitTestBtn">提交答案</button></div>`,
        materials: `<div style="padding:20px"><h4>学习资料</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="card" style="cursor:pointer" id="downloadPdfBtn"><div class="card-body"><div style="display:flex;align-items:center;gap:12px"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div><b>教材文档</b><p style="font-size:12px;color:var(--text-muted)">骨骼系统教材.pdf</p></div></div></div></div><div class="card" style="cursor:pointer" id="downloadPptBtn"><div class="card-body"><div style="display:flex;align-items:center;gap:12px"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--warning)" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/></svg><div><b>PPT课件</b><p style="font-size:12px;color:var(--text-muted)">骨骼结构示意图.pptx</p></div></div></div></div></div></div>`,
        errors: `<div style="padding:20px"><h4>错题集</h4><div class="card" style="margin-bottom:12px"><div class="card-body"><div class="flex-between"><div><b>错题1:</b> 骨骼的主要功能<br><span style="color:var(--danger)">你的答案: A</span> | <span style="color:var(--success)">正确答案: B</span></div><span class="badge badge-danger">错误</span></div><p style="font-size:12px;color:var(--text-muted);margin-top:8px">解析：骨骼的主要功能是支撑身体、保护内脏器官。</p></div></div></div>`,
        discussion: `<div style="padding:20px"><h4>讨论区</h4><div class="card" style="margin-bottom:12px"><div class="card-body"><div style="display:flex;gap:12px"><div class="avatar" style="width:36px;height:36px;border-radius:50%;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">李</div><div><b>李明</b> <span style="font-size:12px;color:var(--text-muted)">2026-08-10 15:30</span><p style="margin-top:4px">骨骼系统这个章节的视频讲解很清晰！</p></div></div></div></div><div class="chat-input-area" style="border-top:1px solid var(--border);padding-top:12px"><input type="text" class="form-input" id="discussInput" placeholder="发表你的讨论..."><button class="btn btn-primary" id="sendDiscussBtn">发送</button></div><div id="newDiscussions"></div></div>`,
      };
      document.getElementById('microCourseTabContent').innerHTML = tabContents[tab.dataset.tab] || '';

      if (tab.dataset.tab === 'selftest') {
        setTimeout(() => {
          document.getElementById('submitTestBtn')?.addEventListener('click', () => {
            const q1 = document.querySelector('input[name="q1"]:checked');
            const q2 = document.querySelector('input[name="q2"]:checked');
            if (!q1 || !q2) { App.showToast('请完成所有题目', 'warning'); return; }
            const correct = (q1.value === 'B' ? 1 : 0) + (q2.value === 'B' ? 1 : 0);
            const resultEl = document.getElementById('testResult');
            if (resultEl) {
              resultEl.style.display = 'block';
              resultEl.innerHTML = `<div class="card" style="border-color:${correct===2?'var(--success)':'var(--warning)'}"><div class="card-body"><b>自测结果: ${correct}/2 (${correct*50}%)</b>${correct<2?`<p style="font-size:13px;color:var(--text-muted);margin-top:8px">错误题目已加入错题集，请及时复习</p>`:''}</div></div>`;
            }
            App.showToast(`答案已提交，正确率: ${correct*50}%`, correct===2?'success':'warning');
          });
        }, 50);
      }

      if (tab.dataset.tab === 'content') {
        setTimeout(() => {
          document.getElementById('playVideoBtn')?.addEventListener('click', () => {
            const player = document.getElementById('videoPlayer');
            const btn = document.getElementById('playVideoBtn');
            if (player && btn) {
              btn.style.display = 'none';
              player.style.display = 'block';
              player.innerHTML = `<div style="background:#000;border-radius:8px;padding:50px;text-align:center;position:relative"><div style="display:flex;align-items:center;justify-content:center;gap:16px"><button class="btn btn-primary" id="simPlayBtn2">▶ 播放</button><button class="btn btn-outline" id="simPauseBtn2" style="color:#fff;border-color:#fff">⏸ 暂停</button><button class="btn btn-outline" id="simStopBtn2" style="color:#fff;border-color:#fff">⏹ 停止</button></div><div class="progress-bar mt-8" style="width:100%"><div class="progress-fill primary" style="width:0%" id="simVideoProgress"></div></div><span id="simVideoTime" style="font-size:12px;color:#999">00:00 / ${App.formatDuration(currentMicroCourse?.duration||300)}</span></div>`;
              let simSec = 0; const totalSec = currentMicroCourse?.duration || 300;
              let simTimer = null;
              document.getElementById('simPlayBtn2').addEventListener('click', () => {
                if (simTimer) return;
                simTimer = setInterval(() => {
                  simSec++;
                  const pct = Math.min(100, Math.round(simSec/totalSec*100));
                  const pg = document.getElementById('simVideoProgress');
                  const st = document.getElementById('simVideoTime');
                  if (pg) pg.style.width = pct+'%';
                  if (st) { const m=Math.floor(simSec/60), s=simSec%60; st.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} / ${App.formatDuration(totalSec)}`; }
                  if (simSec >= totalSec) { clearInterval(simTimer); simTimer = null; if (st) st.textContent = '播放完毕'; }
                }, 200);
              });
              document.getElementById('simPauseBtn2').addEventListener('click', () => { clearInterval(simTimer); simTimer = null; });
              document.getElementById('simStopBtn2').addEventListener('click', () => { clearInterval(simTimer); simTimer = null; simSec = 0; const pg = document.getElementById('simVideoProgress'); if (pg) pg.style.width = '0%'; const st = document.getElementById('simVideoTime'); if (st) st.textContent = `00:00 / ${App.formatDuration(totalSec)}`; });
            }
          });
        }, 50);
      }

      if (tab.dataset.tab === 'discussion') {
        setTimeout(() => {
          document.getElementById('sendDiscussBtn')?.addEventListener('click', () => {
            const input = document.getElementById('discussInput');
            if (!input || !input.value.trim()) { App.showToast('请输入讨论内容', 'warning'); return; }
            const newDiscussions = document.getElementById('newDiscussions');
            if (newDiscussions) {
              newDiscussions.innerHTML += `<div class="card" style="margin-top:12px"><div class="card-body"><div style="display:flex;gap:12px"><div class="avatar" style="width:36px;height:36px;border-radius:50%;background:var(--success-bg);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">我</div><div><b>我</b> <span style="font-size:12px;color:var(--text-muted)">刚刚</span><p style="margin-top:4px">${input.value}</p></div></div></div></div>`;
            }
            input.value = '';
            App.showToast('讨论已发送', 'success');
          });
          document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const reply = prompt('输入回复内容:');
              if (reply) {
                const newDiscussions = document.getElementById('newDiscussions');
                if (newDiscussions) {
                  newDiscussions.innerHTML += `<div class="card" style="margin-top:12px;margin-left:20px"><div class="card-body"><div style="display:flex;gap:12px"><div class="avatar" style="width:36px;height:36px;border-radius:50%;background:var(--success-bg);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">我</div><div><b>我</b> <span style="font-size:12px;color:var(--text-muted)">刚刚</span><p style="margin-top:4px">${reply}</p></div></div></div></div>`;
                }
                App.showToast('回复已发送', 'success');
              }
            });
          });
        }, 50);
      }

      if (tab.dataset.tab === 'materials') {
        setTimeout(() => {
          document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
            App.showToast('教材文档下载已开始', 'success');
          });
          document.getElementById('downloadPptBtn')?.addEventListener('click', () => {
            App.showToast('PPT课件下载已开始', 'success');
          });
        }, 50);
      }
    });
  });

  document.getElementById('addMicroCourseBtn').addEventListener('click', () => {
    App.showModal('新建微课', `
      <div class="form-group"><label class="form-label">微课名称</label><input class="form-input" id="newMcName"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">关联知识点</label><select class="form-select" id="newMcKp">${points.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">类型</label><select class="form-select" id="newMcType"><option>视频</option><option>文档</option><option>互动</option></select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">时长(秒)</label><input class="form-input" id="newMcDuration" type="number" value="600"></div><div class="form-group"><label class="form-label">评分</label><input class="form-input" id="newMcRating" type="number" value="4.5" step="0.1" min="0" max="5"></div></div>
    `, `<button class="btn btn-outline modal-close-btn">取消</button><button class="btn btn-primary" id="saveNewMcBtn">创建</button>`);
    document.getElementById('saveNewMcBtn').addEventListener('click', () => {
      microCourses.push({
        id: Math.max(...microCourses.map(m=>m.id))+1, name: document.getElementById('newMcName').value || '新微课',
        knowledgeId: parseInt(document.getElementById('newMcKp').value), type: document.getElementById('newMcType').value,
        duration: parseInt(document.getElementById('newMcDuration').value)||600, views: 0, avgRating: parseFloat(document.getElementById('newMcRating').value)||4.5,
      });
      Store.set('microCourses', microCourses);
      document.querySelector('.modal-overlay').remove();
      App.showToast('微课创建成功', 'success');
      location.reload();
    });
    document.querySelector('.modal-close-btn').addEventListener('click', () => document.querySelector('.modal-overlay').remove());
  });
};