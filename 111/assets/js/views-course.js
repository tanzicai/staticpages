/* ============================================================
   views-course.js —— 工作台 / 课程 / 任务编排 / 资源库
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.Store, U = global.UI;
  var V = global.Views = global.Views || {};

  function go(hash) { global.App.go(hash); }
  function save() { S.save(); }

  /* ==========================================================
     工作台
     ========================================================== */
  V.dashboard = {
    title: '工作台',
    crumb: ['教学运行', '工作台'],
    html: function () {
      var d = S.db(), c = S.currentCourse();
      var learners = d.learners;
      var today = learners[learners.length - 1];
      var yest = learners[learners.length - 2];
      var diff = today.count - yest.count;
      var refs = d.refs.length;
      var classCnt = d.refs.filter(function (r) { return r.type === '开设班级'; }).length;
      var paid = d.orders.filter(function (o) { return o.status === '已支付'; });
      var amount = paid.reduce(function (a, b) { return a + b.amount; }, 0);
      var tasks = S.allTasks(c.id);
      var aiTasks = tasks.filter(function (t) { return t.type === 'ai'; }).length;
      var hw = d.homework.filter(function (h) { return h.courseId === c.id; })[0];

      var chapterBars = c.chapters.map(function (ch) {
        var n = 0;
        (ch.groups || []).forEach(function (g) { n += (g.tasks || []).length; });
        return { label: ch.name.replace(/第.章\s*/, ''), value: n };
      });
      if (!chapterBars.length) chapterBars = [{ label: '暂无', value: 0 }];

      var typeCount = {};
      tasks.forEach(function (t) { typeCount[t.type] = (typeCount[t.type] || 0) + 1; });
      var sorted = Object.keys(typeCount).sort(function (a, b) { return typeCount[b] - typeCount[a]; });
      var typeItems = sorted.slice(0, 5).map(function (k) {
        return { label: S.TYPE_MAP[k] ? S.TYPE_MAP[k].name : k, value: typeCount[k] };
      });
      var rest = sorted.slice(5).reduce(function (a, k) { return a + typeCount[k]; }, 0);
      if (rest) typeItems.push({ label: '其他类型', value: rest, color: '#CBD5E1' });
      if (!typeItems.length) typeItems = [{ label: '暂未编排', value: 1 }];

      return `
      <div class="page-head">
        <div>
          <div class="page-title">工作台</div>
          <div class="page-desc">${S.esc(c.name)} · ${c.term} · 当前授课 ${c.students} 人，共 ${c.classes} 个教学班</div>
        </div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/resources">资源库</button>
          <button class="btn" data-go="#/app">教材运行</button>
          <button class="btn btn-primary" data-go="#/tasks">任务编排</button>
        </div>
      </div>

      <div class="grid g-4">
        <div class="stat">
          <div class="stat-t">教材学习人数</div>
          <div class="stat-v">${today.count.toLocaleString()}<small>人</small></div>
          <div class="stat-f"><span class="trend up">↑ ${diff}</span> 较昨日</div>
          <div class="stat-ico">${S.icon('users')}</div>
        </div>
        <div class="stat">
          <div class="stat-t">教材引用院系</div>
          <div class="stat-v">${refs}<small>个</small></div>
          <div class="stat-f">开设班级 ${classCnt} 个 · 覆盖 ${d.refs.reduce(function (a, b) { return a + b.students; }, 0)} 人</div>
          <div class="stat-ico">${S.icon('book')}</div>
        </div>
        <div class="stat">
          <div class="stat-t">任务点总数</div>
          <div class="stat-v">${tasks.length}<small>个</small></div>
          <div class="stat-f">AI 实践 ${aiTasks} 个 · 覆盖 ${c.chapters.length} 个章节</div>
          <div class="stat-ico">${S.icon('list')}</div>
        </div>
        <div class="stat">
          <div class="stat-t">本月教材购买</div>
          <div class="stat-v">¥${amount.toFixed(2)}</div>
          <div class="stat-f">${paid.length} 笔订单 · ${d.textbook.paid ? '付费教材' : '免费教材'}</div>
          <div class="stat-ico">${S.icon('money')}</div>
        </div>
      </div>

      <div class="grid g-7-5" style="margin-top:16px">
        <div class="card">
          <div class="card-h"><h3>教材学习人数趋势</h3><span class="sub">近 14 天</span>
            <div class="right"><button class="btn btn-sm" data-go="#/stats">查看运营数据</button></div>
          </div>
          <div class="card-b">${U.lineChart(learners.map(function (l) { return { label: l.date.slice(5), value: l.count }; }), { height: 230 })}</div>
        </div>
        <div class="card">
          <div class="card-h"><h3>任务点类型分布</h3><div class="right"><span class="tag line">共 ${tasks.length} 项</span></div></div>
          <div class="card-b">${U.donutChart(typeItems, { size: 156, unit: '任务点' })}</div>
        </div>
      </div>

      <div class="grid g-5-7" style="margin-top:16px">
        <div class="card">
          <div class="card-h"><h3>章节任务编排量</h3><div class="right"><button class="btn btn-sm" data-go="#/tasks">编排</button></div></div>
          <div class="card-b">${U.barChart(chapterBars, { height: 186 })}</div>
        </div>
        <div class="card">
          <div class="card-h"><h3>待处理事项</h3><div class="right"><span class="tag warn">${hw ? (hw.total - hw.submitted) : 0} 项待跟进</span></div></div>
          <div class="card-b tight">
            ${hw ? `<div class="list-line">
              <div class="avatar-sm">作</div>
              <div class="ll-main"><strong>${S.esc(hw.title)}</strong><span>${hw.chapter} · 截止 ${hw.due} · 已提交 ${hw.submitted}/${hw.total}</span></div>
              <button class="btn btn-sm" data-go="#/homework">批改</button>
            </div>` : ''}
            ${d.activities.filter(function (a) { return a.status === '已结束'; }).slice(0, 2).map(function (a) {
              return `<div class="list-line">
                <div class="avatar-sm">活</div>
                <div class="ll-main"><strong>${S.esc(a.title)}</strong><span>${a.type} · 参与 ${a.joined}/${a.total} · ${a.createdAt}</span></div>
                <button class="btn btn-sm" data-go="#/live">详情</button>
              </div>`;
            }).join('')}
            <div class="list-line">
              <div class="avatar-sm">评</div>
              <div class="ll-main"><strong>AI 实践评价记录</strong><span>COPD 接诊实践 · 已产生 ${(S.scene('s1') || { records: [] }).records.length} 条评分记录</span></div>
              <button class="btn btn-sm" data-go="#/play">查看</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h"><h3>最近动态</h3></div>
        <div class="card-b tight">
          ${d.logs.map(function (l) {
            return `<div class="list-line"><div class="avatar-sm">·</div>
              <div class="ll-main"><strong style="font-weight:400">${S.esc(l.text)}</strong><span>${l.time}</span></div></div>`;
          }).join('')}
        </div>
      </div>`;
    }
  };

  /* ==========================================================
     我的课程
     ========================================================== */
  V.courses = {
    title: '我的课程',
    crumb: ['课程建设', '我的课程'],
    html: function () {
      var d = S.db();
      var cards = d.courses.map(function (c, i) {
        var n = S.allTasks(c.id).length;
        return `<div class="course-card" data-course="${c.id}">
          <div class="course-cover ${i === 1 ? 'v2' : i === 2 ? 'v3' : ''}">
            <div class="cc-name">${S.esc(c.name)}</div>
          </div>
          <div class="course-body">
            <div class="course-meta"><span>${c.code}</span><span>${c.term}</span><span>${c.college}</span></div>
            <div class="course-meta" style="margin-top:6px">
              <span>${c.students} 人 / ${c.classes} 班</span><span>${c.chapters.length} 章</span><span>${n} 个任务点</span>
            </div>
            <div class="course-foot">
              ${U.statusTag(c.status)}
              ${S.db().currentCourseId === c.id ? '<span class="tag">当前课程</span>' : ''}
              <button class="btn btn-sm" style="margin-left:auto" data-enter="${c.id}">进入编排</button>
            </div>
          </div>
        </div>`;
      }).join('');

      return `
      <div class="page-head">
        <div><div class="page-title">我的课程</div>
        <div class="page-desc">数字教材与课程资源统一承载，支持章节—分组—任务点三级编排</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/resources">资源库</button>
          <button class="btn btn-primary" data-act="new-course">${S.icon('plus')} 新建课程</button>
        </div>
      </div>
      <div class="grid g-3">${cards}</div>

      <div class="card" style="margin-top:18px">
        <div class="card-h"><h3>课程运行概况</h3><span class="sub">按课程统计任务编排与学习进度</span></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>课程名称</th><th>课程编号</th><th>章节数</th><th>任务点</th><th>学习人数</th><th>教材引用</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${d.courses.map(function (c) {
            return `<tr>
              <td>${S.esc(c.name)}</td><td class="num">${c.code}</td><td class="num">${c.chapters.length}</td>
              <td class="num">${S.allTasks(c.id).length}</td><td class="num">${c.students}</td><td class="num">${c.refs}</td>
              <td>${U.statusTag(c.status)}</td>
              <td class="ops"><span class="tlink" data-enter="${c.id}">任务编排</span><span class="tlink" data-res="${c.id}">资源</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var enter = e.target.closest('[data-enter]');
        if (enter) { S.db().currentCourseId = enter.getAttribute('data-enter'); save(); go('#/tasks'); return; }
        var res = e.target.closest('[data-res]');
        if (res) { S.db().currentCourseId = res.getAttribute('data-res'); save(); go('#/resources'); return; }
        var card = e.target.closest('[data-course]');
        if (card && !e.target.closest('button')) { S.db().currentCourseId = card.getAttribute('data-course'); save(); go('#/tasks'); return; }
        if (e.target.closest('[data-act="new-course"]')) openCourseForm();
      });
    }
  };

  function openCourseForm() {
    var m = U.modal({
      title: '新建课程',
      sub: '创建后可编排章节与任务点',
      body: `<div class="form-grid">
        <label class="field"><span class="req">课程名称</span><input id="ncName" placeholder="如：病理学（第9版）数字教材" /></label>
        <div class="form-grid c2">
          <label class="field"><span>课程编号</span><input id="ncCode" placeholder="如：BL-2026-04" /></label>
          <label class="field"><span>学期</span><input id="ncTerm" value="2026 春季学期" /></label>
        </div>
        <div class="form-grid c2">
          <label class="field"><span>开课学院</span><input id="ncCollege" value="第一临床学院" /></label>
          <label class="field"><span>学生人数</span><input id="ncNum" type="number" value="60" /></label>
        </div>
        <div class="login-err" id="ncErr"></div>
      </div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="ncOk">创建课程</button>',
      onMount: function (api) {
        api.el.querySelector('#ncOk').addEventListener('click', function () {
          var name = api.el.querySelector('#ncName').value.trim();
          if (!name) { api.el.querySelector('#ncErr').textContent = '请填写课程名称'; return; }
          var d = S.db();
          var id = S.uid('c');
          d.courses.push({
            id: id, name: name,
            code: api.el.querySelector('#ncCode').value.trim() || 'NEW-2026',
            term: api.el.querySelector('#ncTerm').value.trim(),
            college: api.el.querySelector('#ncCollege').value.trim(),
            students: S.num(api.el.querySelector('#ncNum').value, 60), classes: 1, credit: '3.0',
            teacher: 'root', status: '筹备中', refs: 0, isTextbook: true,
            chapters: [{ id: S.uid('ch'), name: '第一章 绪论', groups: [{ id: S.uid('g'), name: '课前导学', tasks: [] }] }]
          });
          d.currentCourseId = id;
          save(); api.close(); U.toast('课程已创建'); global.App.render();
        });
      }
    });
  }

  /* ==========================================================
     任务编排（核心）
     ========================================================== */
  var taskSel = { chapterId: null, groupId: null };

  V.tasks = {
    title: '任务编排',
    crumb: ['课程建设', '任务编排'],
    html: function (params) {
      var d = S.db(), c = S.currentCourse();
      if (params && params.ch) taskSel.chapterId = params.ch;
      if (params && params.g) taskSel.groupId = params.g;
      var chapters = c.chapters;
      if (!taskSel.chapterId || !chapters.some(function (x) { return x.id === taskSel.chapterId; })) {
        taskSel.chapterId = chapters[0] ? chapters[0].id : null;
        taskSel.groupId = null;
      }
      var ch = S.chapter(c.id, taskSel.chapterId);
      if (!ch) return '<div class="empty">该课程还没有章节，请先新增章节</div>';
      if (!taskSel.groupId || !(ch.groups || []).some(function (g) { return g.id === taskSel.groupId; })) {
        taskSel.groupId = ch.groups && ch.groups[0] ? ch.groups[0].id : null;
      }
      var g = S.group(c.id, ch.id, taskSel.groupId);
      var tasks = g ? g.tasks : [];
      var all = S.allTasks(c.id);
      var typeCount = {};
      all.forEach(function (t) { typeCount[t.type] = (typeCount[t.type] || 0) + 1; });

      var tree = chapters.map(function (chap) {
        var n = 0;
        (chap.groups || []).forEach(function (gg) { n += (gg.tasks || []).length; });
        var isActive = chap.id === ch.id;
        var sub = (chap.groups || []).map(function (gg) {
          return `<div class="tree-node sub ${gg.id === taskSel.groupId ? 'active' : ''}" data-ch="${chap.id}" data-g="${gg.id}">
            ${S.esc(gg.name)}<span class="cnt">${(gg.tasks || []).length}</span></div>`;
        }).join('');
        return `<div class="tree-node ${isActive && !taskSel.groupId ? 'active' : ''}" data-ch="${chap.id}">
            ${S.icon('layers')}<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${S.esc(chap.name)}</span>
            <span class="cnt">${n}</span>
          </div>${isActive ? sub : ''}`;
      }).join('');

      var list = tasks.length ? tasks.map(function (t, i) {
        var T = S.TYPE_MAP[t.type] || S.TYPE_MAP.custom;
        var src = t.source === 'course' ? '<span class="tag line">本课资源</span>'
          : t.source === 'other' ? '<span class="tag info">其他课程资源</span>'
            : '<span class="tag warn">手动添加</span>';
        var r = t.resourceId ? S.resource(t.resourceId) : null;
        return `<div class="tp-item" data-tid="${t.id}">
          <div class="drag">${S.icon('grid')}</div>
          <div class="tp-ico" style="background:${T.color}14;color:${T.color}">${S.icon(T.icon)}</div>
          <div class="tp-main">
            <div class="tp-name">${S.esc(t.title)} ${t.required ? '<span class="tag danger">必做</span>' : ''}</div>
            <div class="tp-meta">
              <span class="tag" style="background:${T.color}12;border-color:${T.color}33;color:${T.color}">${T.name}</span>
              ${src}${r ? '<span>' + S.esc(r.name) + '</span>' : ''}
              <span>${t.duration || 0} 分钟</span>
              ${t.place ? '<span>' + S.esc(t.place) + '</span>' : ''}
            </div>
          </div>
          <div class="tp-ops">
            <button class="icon-btn" data-move="up" data-tid="${t.id}" title="上移" ${i === 0 ? 'disabled' : ''}>${S.icon('up')}</button>
            <button class="icon-btn" data-move="down" data-tid="${t.id}" title="下移" ${i === tasks.length - 1 ? 'disabled' : ''}>${S.icon('down')}</button>
            <button class="icon-btn" data-op="edit" data-tid="${t.id}" title="编辑">${S.icon('edit')}</button>
            <button class="icon-btn" data-op="copy" data-tid="${t.id}" title="复制">${S.icon('copy')}</button>
            <button class="icon-btn" data-op="del" data-tid="${t.id}" title="删除">${S.icon('trash')}</button>
          </div>
        </div>`;
      }).join('') : `<div class="empty">${S.icon('list')}<div>当前分组还没有任务点</div>
        <button class="btn btn-primary" style="margin-top:14px" data-act="add-task">${S.icon('plus')} 添加任务点</button></div>`;

      var typeChips = S.TASK_TYPES.map(function (t) {
        return `<span class="chip" data-quick="${t.key}">${S.icon(t.icon)}${t.name}${typeCount[t.key] ? ' · ' + typeCount[t.key] : ''}</span>`;
      }).join('');

      return `
      <div class="page-head">
        <div><div class="page-title">任务编排</div>
        <div class="page-desc">在任务分组下添加任务点，支持 16 种任务点类型；可直接引用本课资源或本人其他课程资源，也可跳转资源库添加新资源</div></div>
        <div class="page-head-actions">
          <select class="btn" id="courseSwitch" style="height:36px;padding:0 10px">
            ${d.courses.map(function (x) { return `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${S.esc(x.name)}</option>`; }).join('')}
          </select>
          <button class="btn" data-act="add-group">${S.icon('plus')} 新增分组</button>
          <button class="btn" data-act="add-chapter">${S.icon('layers')} 新增章节</button>
          <button class="btn btn-primary" data-act="add-task">${S.icon('plus')} 添加任务点</button>
        </div>
      </div>

      <div class="task-layout">
        <div class="card tree-card">
          <div class="tree-group-t">章节目录 · ${c.chapters.length} 章</div>
          ${tree}
          <div class="tree-group-t" style="margin-top:8px">快速添加</div>
          <div style="padding:0 12px 10px" class="chips">${typeChips}</div>
        </div>

        <div>
          <div class="card">
            <div class="card-h">
              <h3>${S.esc(ch.name)} · ${g ? S.esc(g.name) : '未选择分组'}</h3>
              <span class="sub">${tasks.length} 个任务点</span>
              <div class="right">
                <button class="btn btn-sm" data-act="add-task">${S.icon('plus')} 添加任务点</button>
              </div>
            </div>
            <div class="card-b">
              <div class="tabs" id="groupTabs">
                ${(ch.groups || []).map(function (gg) {
                  return `<button class="${gg.id === taskSel.groupId ? 'on' : ''}" data-ch="${ch.id}" data-g="${gg.id}">${S.esc(gg.name)} · ${(gg.tasks || []).length}</button>`;
                }).join('')}
                <button data-act="add-group" style="color:var(--primary)">+ 新增分组</button>
              </div>
              ${list}
            </div>
          </div>

          <div class="card" style="margin-top:16px">
            <div class="card-h"><h3>资源引用方式说明</h3></div>
            <div class="card-b" style="font-size:13px;color:var(--ink-2);line-height:1.9">
              <div class="rowline"><span class="tag">本课资源</span><span>直接引用当前课程下的视频、文档、题库、章节等资源，任务点与资源保持同步更新</span></div>
              <div class="rowline"><span class="tag info">其他课程</span><span>引用当前登录用户名下其他课程的资源，无需重复上传，适用于跨课程复用</span></div>
              <div class="rowline"><span class="tag warn">手动添加</span><span>点击添加跳转至资源库页面新建资源，创建完成后自动回填到任务点</span></div>
              <div class="rowline"><span class="tag gray">仅登记</span><span>线下课堂、线上课堂、审批、自定义等类型不绑定资源文件，登记时间地点与流程即可</span></div>
            </div>
          </div>
        </div>

        <div class="task-side">
          <div class="card">
            <div class="card-h"><h3>编排统计</h3></div>
            <div class="card-b">
              <div class="list-line"><span>任务点总数</span><b style="margin-left:auto" class="num">${all.length}</b></div>
              <div class="list-line"><span>必做任务点</span><b style="margin-left:auto" class="num">${all.filter(function (t) { return t.required; }).length}</b></div>
              <div class="list-line"><span>引用资源类</span><b style="margin-left:auto" class="num">${all.filter(function (t) { return t.source !== 'manual'; }).length}</b></div>
              <div class="list-line"><span>AI 实践任务</span><b style="margin-left:auto" class="num">${all.filter(function (t) { return t.type === 'ai'; }).length}</b></div>
              <div class="list-line"><span>总时长</span><b style="margin-left:auto" class="num">${all.reduce(function (a, b) { return a + (b.duration || 0); }, 0)} 分钟</b></div>
            </div>
          </div>
          <div class="card" style="margin-top:16px">
            <div class="card-h"><h3>类型分布</h3><span class="sub">16 种</span></div>
            <div class="card-b" style="max-height:320px;overflow:auto">
              ${S.TASK_TYPES.map(function (t) {
                var n = typeCount[t.key] || 0;
                return `<div class="list-line" style="padding:7px 0">
                  <span class="tp-ico" style="width:26px;height:26px;flex:0 0 26px;background:${t.color}14;color:${t.color}">${S.icon(t.icon)}</span>
                  <span style="flex:1;font-size:12.5px">${t.name}</span>
                  <b class="num" style="font-size:12.5px;color:${n ? 'var(--primary)' : 'var(--muted-2)'}">${n}</b>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>`;
    },

    mount: function (root) {
      root.addEventListener('click', function (e) {
        var nav = e.target.closest('[data-ch]');
        if (nav) {
          taskSel.chapterId = nav.getAttribute('data-ch');
          taskSel.groupId = nav.getAttribute('data-g') || null;
          global.App.render(); return;
        }
        if (e.target.closest('[data-act="add-task"]')) { openTaskForm(null, taskSel); return; }
        if (e.target.closest('[data-act="add-group"]')) { openGroupForm(taskSel); return; }
        if (e.target.closest('[data-act="add-chapter"]')) { openChapterForm(); return; }
        var quick = e.target.closest('[data-quick]');
        if (quick) { openTaskForm(null, taskSel, quick.getAttribute('data-quick')); return; }

        var mv = e.target.closest('[data-move]');
        if (mv && !mv.disabled) {
          moveTask(mv.getAttribute('data-tid'), mv.getAttribute('data-move')); return;
        }
        var op = e.target.closest('[data-op]');
        if (op) {
          var tid = op.getAttribute('data-tid');
          if (op.getAttribute('data-op') === 'edit') openTaskForm(tid, taskSel);
          if (op.getAttribute('data-op') === 'del') {
            U.confirm('删除任务点', '删除后该任务点及其学习记录将从分组中移除，确认继续？', '删除', true).then(function (ok) {
              if (!ok) return;
              var g = S.group(S.db().currentCourseId, taskSel.chapterId, taskSel.groupId);
              g.tasks = g.tasks.filter(function (t) { return t.id !== tid; });
              save(); U.toast('任务点已删除'); global.App.render();
            });
          }
          if (op.getAttribute('data-op') === 'copy') {
            var g2 = S.group(S.db().currentCourseId, taskSel.chapterId, taskSel.groupId);
            var t0 = g2.tasks.filter(function (t) { return t.id === tid; })[0];
            if (t0) {
              var nt = S.deep(t0); nt.id = S.uid('t'); nt.title = t0.title + '（副本）';
              g2.tasks.splice(g2.tasks.indexOf(t0) + 1, 0, nt);
              save(); U.toast('已复制任务点'); global.App.render();
            }
          }
        }
      });
      var sw = root.querySelector('#courseSwitch');
      if (sw) sw.addEventListener('change', function () {
        S.db().currentCourseId = sw.value;
        taskSel.chapterId = null; taskSel.groupId = null;
        save(); global.App.render();
      });
    }
  };

  function moveTask(tid, dir) {
    var g = S.group(S.db().currentCourseId, taskSel.chapterId, taskSel.groupId);
    if (!g) return;
    var i = g.tasks.findIndex(function (t) { return t.id === tid; });
    var j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= g.tasks.length) return;
    var tmp = g.tasks[i]; g.tasks[i] = g.tasks[j]; g.tasks[j] = tmp;
    save(); global.App.render();
  }

  function openGroupForm(sel) {
    U.modal({
      title: '新增任务分组',
      sub: '分组用于按教学环节组织任务点',
      body: `<label class="field"><span class="req">分组名称</span><input id="gpName" placeholder="如：课前导学 / 课中学习 / 课后拓展" /></label>
        <div class="chips" style="margin-top:6px">
          <span class="chip" data-fill="课前导学">课前导学</span>
          <span class="chip" data-fill="课中学习">课中学习</span>
          <span class="chip" data-fill="课后拓展">课后拓展</span>
          <span class="chip" data-fill="实践环节">实践环节</span>
        </div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="gpOk">保存</button>',
      onMount: function (api) {
        api.el.addEventListener('click', function (e) {
          var f = e.target.closest('[data-fill]');
          if (f) api.el.querySelector('#gpName').value = f.getAttribute('data-fill');
        });
        api.el.querySelector('#gpOk').addEventListener('click', function () {
          var name = api.el.querySelector('#gpName').value.trim();
          if (!name) { U.toast('请填写分组名称', 'err'); return; }
          var ch = S.chapter(S.db().currentCourseId, sel.chapterId);
          ch.groups.push({ id: S.uid('g'), name: name, tasks: [] });
          save(); api.close(); U.toast('分组已新增'); global.App.render();
        });
      }
    });
  }

  function openChapterForm() {
    U.modal({
      title: '新增章节',
      body: `<label class="field"><span class="req">章节名称</span><input id="chName" placeholder="如：第四章 泌尿系统疾病" /></label>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="chOk">保存</button>',
      onMount: function (api) {
        api.el.querySelector('#chOk').addEventListener('click', function () {
          var name = api.el.querySelector('#chName').value.trim();
          if (!name) { U.toast('请填写章节名称', 'err'); return; }
          var c = S.currentCourse();
          c.chapters.push({ id: S.uid('ch'), name: name, groups: [{ id: S.uid('g'), name: '课前导学', tasks: [] }] });
          save(); api.close(); U.toast('章节已新增'); global.App.render();
        });
      }
    });
  }

  /* ---------- 添加 / 编辑任务点 ---------- */
  function openTaskForm(taskId, sel, presetType) {
    var d = S.db(), c = S.currentCourse();
    var editing = null;
    if (taskId) {
      var g0 = S.group(c.id, sel.chapterId, sel.groupId);
      editing = g0.tasks.filter(function (t) { return t.id === taskId; })[0];
    }
    var state = {
      type: editing ? editing.type : (presetType || 'video'),
      source: editing ? editing.source : 'course',
      resourceId: editing ? (editing.resourceId || '') : '',
      required: editing ? !!editing.required : true
    };

    var chapterOptions = c.chapters.map(function (ch) {
      return (ch.groups || []).map(function (g) {
        return `<option value="${ch.id}|${g.id}" ${sel.chapterId === ch.id && sel.groupId === g.id ? 'selected' : ''}>${S.esc(ch.name)} / ${S.esc(g.name)}</option>`;
      }).join('');
    }).join('');

    var body = `
      <div class="form-grid">
        <div>
          <div style="font-size:13px;color:var(--ink-2);margin-bottom:9px" class="req">任务点类型（16 种）</div>
          <div class="type-grid" id="typeGrid">
            ${S.TASK_TYPES.map(function (t) {
              return `<div class="type-cell ${t.key === state.type ? 'on' : ''}" data-type="${t.key}">
                <div class="ti">${S.icon(t.icon)}</div><span>${t.name}</span></div>`;
            }).join('')}
          </div>
          <div class="hint" id="typeHint" style="margin-top:8px"></div>
        </div>

        <div class="form-grid c2">
          <label class="field"><span class="req">任务点名称</span><input id="tfTitle" value="${editing ? S.esc(editing.title) : ''}" placeholder="请输入任务点名称" /></label>
          <label class="field"><span>所属分组</span><select id="tfGroup">${chapterOptions}</select></label>
        </div>

        <div>
          <div style="font-size:13px;color:var(--ink-2);margin-bottom:9px">资源来源</div>
          <div class="seg" id="srcSeg">
            <button data-src="course" class="${state.source === 'course' ? 'on' : ''}">当前课程资源</button>
            <button data-src="other" class="${state.source === 'other' ? 'on' : ''}">我的其他课程资源</button>
            <button data-src="manual" class="${state.source === 'manual' ? 'on' : ''}">前往资源库添加</button>
          </div>
          <div id="resArea" style="margin-top:12px"></div>
        </div>

        <div class="form-grid c3">
          <label class="field"><span>建议时长（分钟）</span><input id="tfDur" type="number" value="${editing ? (editing.duration || 0) : 15}" /></label>
          <label class="field"><span>是否必做</span>
            <div style="display:flex;align-items:center;gap:9px;height:44px">
              <div class="switch ${state.required ? 'on' : ''}" id="tfReq"></div><span id="tfReqTxt" style="font-size:13px;color:var(--ink-2)">${state.required ? '必做' : '选做'}</span>
            </div>
          </label>
          <label class="field"><span>地点 / 备注</span><input id="tfPlace" value="${editing && editing.place ? S.esc(editing.place) : ''}" placeholder="如：临床技能中心 A302" /></label>
        </div>

        <label class="field"><span>任务说明</span><textarea id="tfDesc" placeholder="对学生可见的完成要求说明">${editing ? S.esc(editing.desc || '') : ''}</textarea></label>
        <div class="login-err" id="tfErr"></div>
      </div>`;

    var api = U.modal({
      title: editing ? '编辑任务点' : '添加任务点',
      sub: '支持 16 种类型',
      size: 'wide',
      body: body,
      footer: '<button class="btn left" data-close>取消</button><button class="btn btn-primary" id="tfOk">' + (editing ? '保存修改' : '添加到分组') + '</button>',
      onMount: function (a) {
        var root = a.el;
        function renderRes() {
          var area = root.querySelector('#resArea');
          var hint = root.querySelector('#typeHint');
          var T = S.TYPE_MAP[state.type];
          hint.textContent = T ? T.hint : '';
          if (state.source === 'manual') {
            area.innerHTML = `<div style="border:1px dashed var(--line);border-radius:12px;padding:16px;text-align:center;background:#FAFCFF">
              <div style="font-size:13px;color:var(--ink-2);margin-bottom:10px">该任务点暂未绑定资源，可跳转资源库新建资源后回填</div>
              <button class="btn btn-primary" id="goRes">${S.icon('plus')} 跳转资源库添加资源</button>
              <div class="hint" style="margin-top:8px">线下课堂、线上课堂、审批、自定义等类型可直接保存</div>
            </div>`;
            var btn = area.querySelector('#goRes');
            if (btn) btn.addEventListener('click', function () {
              a.close();
              global.App.pending = { type: state.type, sel: { chapterId: sel.chapterId, groupId: sel.groupId }, title: root.querySelector('#tfTitle').value };
              go('#/resources?add=1');
            });
            return;
          }
          var list = state.source === 'course' ? S.courseResources(c.id) : S.otherResources(c.id);
          var filtered = list.filter(function (r) {
            if (state.type === 'video') return r.type === 'video' || r.type === 'course';
            if (state.type === 'doc') return r.type === 'doc';
            if (state.type === 'quiz' || state.type === 'selftest') return r.type === 'quiz';
            if (state.type === 'point') return r.type === 'point' || r.type === 'doc';
            return true;
          });
          if (!filtered.length) filtered = list;
          area.innerHTML = `<div style="max-height:230px;overflow:auto;padding-right:4px">
            <div class="hint" style="margin-bottom:8px">共 ${filtered.length} 项${state.source === 'other' ? '（来自本人其他课程）' : ''}，点击选择后绑定到任务点</div>
            ${filtered.map(function (r) {
              var rc = S.course(r.courseId);
              return `<div class="res-pick ${state.resourceId === r.id ? 'on' : ''}" data-rid="${r.id}">
                <div class="ri">${S.icon(r.type === 'video' ? 'play' : r.type === 'quiz' ? 'check' : r.type === 'chapter' ? 'layers' : r.type === 'course' ? 'book' : r.type === 'point' ? 'star' : 'doc')}</div>
                <div class="rm"><strong>${S.esc(r.name)}</strong><span>${rc ? S.esc(rc.name) + ' · ' : ''}${r.chapter} · ${r.duration}</span></div>
                ${state.resourceId === r.id ? '<span class="tag">已选</span>' : ''}
              </div>`;
            }).join('')}
          </div>`;
          area.addEventListener('click', function (e) {
            var p = e.target.closest('[data-rid]');
            if (!p) return;
            state.resourceId = p.getAttribute('data-rid');
            var r = S.resource(state.resourceId);
            var input = root.querySelector('#tfTitle');
            if (r && !input.value.trim()) input.value = r.name;
            renderRes();
          });
        }
        renderRes();

        root.querySelector('#typeGrid').addEventListener('click', function (e) {
          var cell = e.target.closest('[data-type]');
          if (!cell) return;
          state.type = cell.getAttribute('data-type');
          root.querySelectorAll('.type-cell').forEach(function (x) { x.classList.remove('on'); });
          cell.classList.add('on');
          renderRes();
        });
        root.querySelector('#srcSeg').addEventListener('click', function (e) {
          var b = e.target.closest('[data-src]');
          if (!b) return;
          state.source = b.getAttribute('data-src');
          state.resourceId = '';
          root.querySelectorAll('#srcSeg button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          renderRes();
        });
        var sw = root.querySelector('#tfReq');
        sw.addEventListener('click', function () {
          state.required = !state.required;
          sw.classList.toggle('on', state.required);
          root.querySelector('#tfReqTxt').textContent = state.required ? '必做' : '选做';
        });

        root.querySelector('#tfOk').addEventListener('click', function () {
          var title = root.querySelector('#tfTitle').value.trim();
          var err = root.querySelector('#tfErr');
          if (!title) { err.textContent = '请填写任务点名称'; return; }
          if (state.source !== 'manual' && !state.resourceId && ['video', 'doc', 'course', 'chapter', 'point'].indexOf(state.type) >= 0) {
            err.textContent = '该类型需要选择一个资源'; return;
          }
          var gv = root.querySelector('#tfGroup').value.split('|');
          var cid = S.db().currentCourseId;
          var target = S.group(cid, gv[0], gv[1]);
          var data = {
            type: state.type, title: title, source: state.source,
            resourceId: state.source === 'manual' ? (state.resourceId || '') : state.resourceId,
            duration: S.num(root.querySelector('#tfDur').value, 0),
            required: state.required,
            desc: root.querySelector('#tfDesc').value.trim(),
            place: root.querySelector('#tfPlace').value.trim()
          };
          if (editing) {
            Object.assign(editing, data);
            if (gv[0] !== sel.chapterId || gv[1] !== sel.groupId) {
              var oldG = S.group(cid, sel.chapterId, sel.groupId);
              oldG.tasks = oldG.tasks.filter(function (t) { return t.id !== editing.id; });
              target.tasks.push(editing);
            }
            U.toast('任务点已更新');
          } else {
            data.id = S.uid('t');
            target.tasks.push(data);
            U.toast('任务点已添加到「' + target.name + '」');
          }
          save(); a.close(); global.App.render();
        });
      }
    });
    return api;
  }

  /* 供资源库视图复用：新建资源后回填 */
  function createTaskFromResource(res, chapterId, groupId, titleOverride) {
    var c = S.currentCourse();
    var ch = S.chapter(c.id, chapterId) || c.chapters[0];
    var g = S.group(c.id, ch.id, groupId) || (ch.groups && ch.groups[0]);
    if (!g) { g = { id: S.uid('g'), name: '课前导学', tasks: [] }; ch.groups.push(g); }
    var type = res.type === 'video' ? 'video' : res.type === 'quiz' ? 'quiz' : res.type === 'chapter' ? 'chapter' : res.type === 'course' ? 'course' : res.type === 'point' ? 'point' : 'doc';
    g.tasks.push({
      id: S.uid('t'), type: type, title: titleOverride || res.name,
      source: res.courseId === c.id ? 'course' : 'other', resourceId: res.id,
      duration: S.num((res.duration || '15').replace(/[^\d]/g, ''), 15) || 15, required: true,
      desc: '由资源库添加，引用资源：' + res.name
    });
    save();
    return g;
  }

  /* ==========================================================
     资源库
     ========================================================== */
  var resState = { tab: 'current', kw: '', type: 'all', page: 1, size: 8 };

  V.resources = {
    title: '资源库',
    crumb: ['课程建设', '资源库'],
    html: function (params) {
      var d = S.db(), c = S.currentCourse();
      var list = resState.tab === 'current' ? S.courseResources(c.id) : resState.tab === 'other' ? S.otherResources(c.id) : d.resources;
      if (resState.type !== 'all') list = list.filter(function (r) { return r.type === resState.type; });
      if (resState.kw) {
        var k = resState.kw.toLowerCase();
        list = list.filter(function (r) { return r.name.toLowerCase().indexOf(k) >= 0 || r.chapter.indexOf(k) >= 0; });
      }
      var total = list.length;
      var maxPage = Math.max(1, Math.ceil(total / resState.size));
      if (resState.page > maxPage) resState.page = maxPage;
      var pageList = list.slice((resState.page - 1) * resState.size, resState.page * resState.size);

      var typeName = { video: '视频', doc: '文档', quiz: '题库', chapter: '章节', course: '课程包', point: '知识点' };

      return `
      <div class="page-head">
        <div><div class="page-title">资源库</div>
        <div class="page-desc">${S.esc(c.name)} · 共 ${d.resources.length} 项资源，可直接加入任务分组，也可新建资源</div></div>
        <div class="page-head-actions">
          <button class="btn" data-act="export-res">${S.icon('download')} 导出清单</button>
          <button class="btn btn-primary" data-act="new-res">${S.icon('plus')} 新增资源</button>
        </div>
      </div>

      <div class="card">
        <div class="card-h" style="flex-wrap:wrap;gap:12px">
          <div class="seg" id="resTabs">
            <button data-tab="current" class="${resState.tab === 'current' ? 'on' : ''}">本课程资源</button>
            <button data-tab="other" class="${resState.tab === 'other' ? 'on' : ''}">我的其他课程资源</button>
            <button data-tab="all" class="${resState.tab === 'all' ? 'on' : ''}">全部资源</button>
          </div>
          <div class="right" style="gap:8px">
            <select id="resType" class="btn" style="height:34px">
              <option value="all">全部类型</option>
              ${Object.keys(typeName).map(function (k) { return `<option value="${k}" ${resState.type === k ? 'selected' : ''}>${typeName[k]}</option>`; }).join('')}
            </select>
            <input id="resKw" class="btn" style="height:34px;width:190px;padding:0 12px;text-align:left" placeholder="搜索资源名称 / 章节" value="${S.esc(resState.kw)}" />
          </div>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>资源名称</th><th>类型</th><th>所属课程</th><th>章节</th><th>时长/页数</th><th>大小</th><th>更新时间</th><th>操作</th></tr></thead>
          <tbody>${pageList.length ? pageList.map(function (r) {
            var rc = S.course(r.courseId);
            return `<tr>
              <td><span style="display:flex;align-items:center;gap:8px">
                <span class="tp-ico" style="width:26px;height:26px;flex:0 0 26px">${S.icon(r.type === 'video' ? 'play' : r.type === 'quiz' ? 'check' : r.type === 'chapter' ? 'layers' : r.type === 'course' ? 'book' : r.type === 'point' ? 'star' : 'doc')}</span>
                ${S.esc(r.name)}</span></td>
              <td><span class="tag line">${typeName[r.type] || r.type}</span></td>
              <td>${S.esc(rc ? rc.name : '—')}</td>
              <td>${S.esc(r.chapter)}</td>
              <td class="num">${S.esc(r.duration)}</td>
              <td class="num">${S.esc(r.size)}</td>
              <td class="num">${r.updated}</td>
              <td class="ops">
                <span class="tlink" data-add-task="${r.id}">加入任务</span>
                <span class="tlink" data-preview="${r.id}">预览</span>
                <span class="tlink danger" data-del-res="${r.id}">删除</span>
              </td>
            </tr>`;
          }).join('') : `<tr><td colspan="8"><div class="empty">${S.icon('search')}<div>没有匹配的资源</div></div></td></tr>`}</tbody>
        </table></div>
        ${U.pager(total, resState.page, resState.size)}
      </div>`;
    },
    mount: function (root, params) {
      root.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-tab]');
        if (tab) { resState.tab = tab.getAttribute('data-tab'); resState.page = 1; global.App.render(); return; }
        var pg = e.target.closest('.pager [data-page]');
        if (pg) { resState.page = parseInt(pg.getAttribute('data-page'), 10); global.App.render(); return; }
        if (e.target.closest('[data-act="new-res"]')) { openResourceForm(null, params); return; }
        if (e.target.closest('[data-act="export-res"]')) {
          var rows = [['资源名称', '类型', '所属课程', '章节', '时长', '大小', '更新时间']];
          S.db().resources.forEach(function (r) {
            var rc = S.course(r.courseId);
            rows.push([r.name, r.type, rc ? rc.name : '', r.chapter, r.duration, r.size, r.updated]);
          });
          S.downloadFile('资源清单_' + S.fmtDate() + '.csv', S.toCSV(rows));
          U.toast('资源清单已导出');
          return;
        }
        var at = e.target.closest('[data-add-task]');
        if (at) { openAddToTask(at.getAttribute('data-add-task')); return; }
        var pv = e.target.closest('[data-preview]');
        if (pv) {
          var r = S.resource(pv.getAttribute('data-preview'));
          var rc = S.course(r.courseId);
          U.modal({
            title: '资源详情', sub: r.type === 'video' ? '视频' : r.type === 'quiz' ? '题库' : '文档',
            body: `<dl class="kv">
              <dt>资源名称</dt><dd>${S.esc(r.name)}</dd>
              <dt>所属课程</dt><dd>${S.esc(rc ? rc.name : '—')}</dd>
              <dt>所属章节</dt><dd>${S.esc(r.chapter)}</dd>
              <dt>时长 / 页数</dt><dd>${S.esc(r.duration)}</dd>
              <dt>文件大小</dt><dd>${S.esc(r.size)}</dd>
              <dt>更新时间</dt><dd>${r.updated}</dd>
              <dt>引用情况</dt><dd>已被 ${S.allTasks(S.db().currentCourseId).filter(function (t) { return t.resourceId === r.id; }).length} 个任务点引用</dd>
            </dl>
            <div class="divider"></div>
            <div class="hint">资源内容在移动端与网页端统一渲染，学习行为（播放时长、阅读进度、答题记录）自动回流至学情数据。</div>`,
            footer: '<button class="btn" data-close>关闭</button><button class="btn btn-primary" id="pvAdd">加入任务分组</button>',
            onMount: function (api) {
              api.el.querySelector('#pvAdd').addEventListener('click', function () { api.close(); openAddToTask(r.id); });
            }
          });
          return;
        }
        var dr = e.target.closest('[data-del-res]');
        if (dr) {
          var id = dr.getAttribute('data-del-res');
          U.confirm('删除资源', '删除后引用该资源的任务点将解除绑定，确认删除？', '删除', true).then(function (ok) {
            if (!ok) return;
            S.db().resources = S.db().resources.filter(function (x) { return x.id !== id; });
            save(); U.toast('资源已删除'); global.App.render();
          });
        }
      });
      var sel = root.querySelector('#resType');
      if (sel) sel.addEventListener('change', function () { resState.type = sel.value; resState.page = 1; global.App.render(); });
      var kw = root.querySelector('#resKw');
      if (kw) {
        kw.addEventListener('input', function () {
          resState.kw = kw.value.trim(); resState.page = 1;
          clearTimeout(kw._t);
          kw._t = setTimeout(function () { global.App.render(); }, 320);
        });
      }
      if (params && params.add === '1') {
        /* 进入资源库页面本身不再自动弹出新增弹窗；清除地址参数避免切 tab 时重复弹出 */
        try { history.replaceState(null, '', '#/resources'); } catch (e) { }
        if (global.App.pending) U.toast('请点击右上角「新增资源」创建资源，保存后自动加入任务分组');
      }
    }
  };

  function openAddToTask(resId) {
    var d = S.db(), c = S.currentCourse();
    var r = S.resource(resId);
    var opts = c.chapters.map(function (ch) {
      return (ch.groups || []).map(function (g) {
        return `<option value="${ch.id}|${g.id}">${S.esc(ch.name)} / ${S.esc(g.name)}</option>`;
      }).join('');
    }).join('');
    U.modal({
      title: '加入任务分组',
      sub: S.esc(r.name),
      body: `<label class="field"><span class="req">选择目标分组</span><select id="atSel">${opts}</select></label>
        <label class="field"><span>任务点名称</span><input id="atTitle" value="${S.esc(r.name)}" /></label>
        <div class="hint">加入后将以资源对应的任务点类型写入分组，可在任务编排中继续调整顺序与属性。</div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="atOk">确认加入</button>',
      onMount: function (api) {
        api.el.querySelector('#atOk').addEventListener('click', function () {
          var v = api.el.querySelector('#atSel').value.split('|');
          var g = createTaskFromResource(r, v[0], v[1], api.el.querySelector('#atTitle').value.trim());
          api.close(); U.toast('已加入「' + g.name + '」');
          global.App.render();
        });
      }
    });
  }

  /* 资源类型 → 时长/页数 单位与建议值 */
  var RES_TYPE_META = {
    video: { unit: '时长', ph: '如 18:30', gen: function (i) { return (8 + (i * 7) % 22) + ':' + pad2((i * 17) % 60); } },
    doc: { unit: '页数', ph: '如 24 页', gen: function (i) { return (8 + (i * 5) % 40) + ' 页'; } },
    quiz: { unit: '题量', ph: '如 30 题', gen: function (i) { return (10 + (i * 7) % 40) + ' 题'; } },
    chapter: { unit: '节数', ph: '如 8 节', gen: function (i) { return (3 + (i * 3) % 10) + ' 节'; } },
    course: { unit: '课时', ph: '如 32 课时', gen: function (i) { return (12 + (i * 4) % 36) + ' 课时'; } },
    point: { unit: '时长', ph: '如 12:00', gen: function (i) { return (4 + (i * 5) % 14) + ':' + pad2((i * 13) % 60); } }
  };
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / 1048576).toFixed(1).replace(/\.0$/, '') + ' MB';
    return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  function openResourceForm(editing, params) {
    var c = S.currentCourse();
    var pending = global.App.pending;
    var chapterNames = c.chapters.map(function (ch) { return ch.name; }).concat(['综合']);
    function suggest(type, chName) {
      var meta = RES_TYPE_META[type] || RES_TYPE_META.doc;
      return meta.gen(Math.max(0, chapterNames.indexOf(chName)));
    }
    U.modal({
      title: '新增资源',
      sub: '创建后可直接加入任务分组',
      size: 'wide',
      body: `<div class="form-grid">
        <label class="field"><span class="req">资源名称</span><input id="rfName" placeholder="上传文件后自动填入，也可手动输入" /></label>
        <div class="form-grid c3">
          <label class="field"><span>资源类型</span><select id="rfType">
            <option value="video">视频</option><option value="doc">文档</option>
            <option value="quiz">题库</option><option value="chapter">章节</option>
            <option value="course">课程包</option><option value="point">知识点</option>
          </select></label>
          <label class="field"><span>所属章节</span><select id="rfChapter">
            ${chapterNames.map(function (n) { return `<option>${S.esc(n)}</option>`; }).join('')}
          </select></label>
          <label class="field"><span id="rfDurLabel">${RES_TYPE_META.video.unit}</span><input id="rfDur" placeholder="${RES_TYPE_META.video.ph}" value="${suggest('video', chapterNames[0])}" /></label>
        </div>
        <div class="form-grid c2">
          <label class="field"><span>文件大小</span><input id="rfSize" placeholder="选择文件后自动填入" value="—" /></label>
          <label class="field"><span>存放位置</span><input value="平台资源中心 / 我的资源" disabled /></label>
        </div>
        <div id="rfDrop" style="border:1.5px dashed var(--line);border-radius:12px;padding:20px;text-align:center;background:#F5F9FF;cursor:pointer;transition:.15s">
          <div style="color:var(--muted);font-size:13px" id="rfDropTxt">将文件拖拽到此处，或点击选择本地文件上传</div>
          <button class="btn" style="margin-top:10px" id="rfPick">${S.icon('upload')} 选择本地文件</button>
        </div>
        <div class="hint">支持 MP4 / MP3 / PDF / DOC / DOCX / PPT / EPUB 等格式；上传后自动识别类型、填入文件大小并按章节给出时长建议</div>
        <div class="login-err" id="rfErr"></div>
      </div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="rfOk">保存资源</button>',
      onMount: function (api) {
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        api.body.appendChild(fileInput);
        var drop = api.el.querySelector('#rfDrop');

        function fillFile(f) {
          if (!f) return;
          if (!api.el.querySelector('#rfName').value.trim()) {
            api.el.querySelector('#rfName').value = f.name.replace(/\.[^.]+$/, '');
          }
          api.el.querySelector('#rfSize').value = fmtSize(f.size);
          var ext = (f.name.split('.').pop() || '').toLowerCase();
          var t = api.el.querySelector('#rfType');
          if (/^(mp4|mov|m4v|avi|mkv|flv|webm|mp3|wav|m4a|aac)$/.test(ext)) t.value = 'video';
          else if (/^(pdf|doc|docx|ppt|pptx|epub|txt|md)$/.test(ext)) t.value = 'doc';
          syncDur();
          api.el.querySelector('#rfDropTxt').innerHTML =
            '<b style="color:var(--primary)">' + S.esc(f.name) + '</b>（' + fmtSize(f.size) + '）已就绪，保存后上传至平台资源中心';
          U.toast('已选择文件：' + f.name);
        }
        function syncDur() {
          var type = api.el.querySelector('#rfType').value;
          var ch = api.el.querySelector('#rfChapter').value;
          var meta = RES_TYPE_META[type] || RES_TYPE_META.doc;
          api.el.querySelector('#rfDurLabel').textContent = meta.unit;
          var inp = api.el.querySelector('#rfDur');
          inp.placeholder = meta.ph;
          inp.value = suggest(type, ch);
        }
        api.el.querySelector('#rfPick').addEventListener('click', function (e) { e.stopPropagation(); fileInput.click(); });
        drop.addEventListener('click', function (e) { fileInput.click(); });
        fileInput.addEventListener('change', function () { fillFile(fileInput.files[0]); });
        ['dragenter', 'dragover'].forEach(function (ev) {
          drop.addEventListener(ev, function (e) {
            e.preventDefault();
            drop.style.borderColor = 'var(--primary)';
            drop.style.background = 'var(--primary-50)';
          });
        });
        ['dragleave', 'drop'].forEach(function (ev) {
          drop.addEventListener(ev, function (e) {
            e.preventDefault();
            drop.style.borderColor = '';
            drop.style.background = '';
          });
        });
        drop.addEventListener('drop', function (e) {
          var dt = e.dataTransfer || {};
          fillFile(dt.files && dt.files[0]);
        });
        api.el.querySelector('#rfType').addEventListener('change', syncDur);
        api.el.querySelector('#rfChapter').addEventListener('change', syncDur);

        api.el.querySelector('#rfOk').addEventListener('click', function () {
          var name = api.el.querySelector('#rfName').value.trim();
          if (!name) { api.el.querySelector('#rfErr').textContent = '请填写资源名称'; return; }
          var r = {
            id: S.uid('r'), courseId: c.id, name: name,
            type: api.el.querySelector('#rfType').value,
            chapter: api.el.querySelector('#rfChapter').value,
            duration: api.el.querySelector('#rfDur').value.trim() || '—',
            size: api.el.querySelector('#rfSize').value.trim() || '—',
            updated: S.fmtDate()
          };
          S.db().resources.unshift(r);
          save(); api.close();
          U.toast('资源已保存到资源库');
          if (pending) {
            var g = createTaskFromResource(r, pending.sel.chapterId, pending.sel.groupId, pending.title || r.name);
            U.toast('已自动回填到「' + g.name + '」');
            global.App.pending = null;
            go('#/tasks?ch=' + pending.sel.chapterId + '&g=' + pending.sel.groupId);
          } else {
            global.App.render();
          }
        });
      }
    });
  }

  global.CourseViews = { openTaskForm: openTaskForm, createTaskFromResource: createTaskFromResource, openResourceForm: openResourceForm };
})(window);
