/* ============================================================
   平台其他页面 —— 我的课程 / 对接配置 / 选课排课 / 评价表管理
   / 用户管理 / 操作日志 / 帮助中心
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  /* ============================================================
     我的课程
     ============================================================ */
  function renderCourses(el) {
    var d = Z.db();
    var rp = Z.G.routeParams || {};
    var meta = d.meta;
    var rows = d.courses.map(function (c) {
      var ov = Z.outlineOverview(c.id);
      var acts = d.activities.filter(function (a) { return a.courseId === c.id; });
      var ress = d.resources.filter(function (r) { return r.courseId === c.id; });
      var st = c.progress || {};
      var pct = Math.round(st.taughtWeeks / st.totalWeeks * 100);
      return '<div class="course-card card">' +
        '<div class="cc-top">' +
        '<div class="cc-code">' + esc(c.code) + ' · ' + esc(c.platform.courseId) + '</div>' +
        '<div class="cc-name">' + esc(c.name) + '</div>' +
        '<div class="cc-teacher">' + esc(c.teacher) + '　' + esc(c.title) + '　·　' + esc(c.college) + '</div>' +
        '</div>' +
        '<div class="cc-body">' +
        '<div class="row2"><span>班级</span><span class="muted">' + esc(c.className) + '</span></div>' +
        '<div class="row2"><span>选课人数</span><span class="muted">' + c.students + ' 人</span></div>' +
        '<div class="row2"><span>学时 / 周数</span><span class="muted">' + c.hoursTotal + ' 学时 · ' + c.scheduleWeeks + '</span></div>' +
        '<div class="row2"><span>教学进度</span><span class="muted">' + (st.taughtWeeks || 0) + '/' + st.totalWeeks + ' 周（' + pct + '%）</span></div>' +
        '<div class="pbar mt6"><i style="width:' + pct + '%"></i></div>' +
        '<div class="row mt10" style="font-size:12px;color:var(--text-2);gap:14px">' +
        '<span>课堂活动 ' + acts.length + ' 次</span><span>资源 ' + ress.length + ' 个</span>' +
        '<span>知识点覆盖 ' + ov.rate + '%</span></div>' +
        '</div>' +
        '<div class="cc-foot">' +
        '<button class="btn sm primary" data-cg="go" data-cid="' + c.id + '" data-to="activity">课堂活动</button>' +
        '<button class="btn sm" data-cg="go" data-cid="' + c.id + '" data-to="teachplan">授课计划</button>' +
        '<button class="btn sm" data-cg="go" data-cid="' + c.id + '" data-to="outline">覆盖分析</button>' +
        '<button class="btn sm" data-cg="go" data-cid="' + c.id + '" data-to="resources">直录播</button>' +
        '<button class="btn sm" data-cg="go" data-cid="' + c.id + '" data-to="supervision">督导评价</button>' +
        '</div></div>';
    }).join('');

    el.innerHTML =
      '<div class="page-head"><div><h3>' + (Z.isAdmin() ? '课程库' : '我的课程') + '</h3>' +
      '<div class="ph-sub">' + esc(meta.term) + ' · ' + esc(Z.coursesMenuSub()) + '，已对接校方教学平台课程 ' + d.courses.length + ' 门</div></div>' +
      '<div class="ph-tools"><button class="btn" data-cq="refresh">刷新课程状态</button></div></div>' +
      '<div class="grid g3">' + rows + '</div>' +
      '<div class="mt14" style="font-size:12px;color:var(--text-3);background:#fff;border:1px dashed var(--line);border-radius:10px;padding:10px 16px">' +
      '课程同步说明：授课计划、课堂活动、直录播资源均与校方教学平台双向打通；点击课程卡片下方入口可进入对应课堂分析、资源与督导模块。</div>';
    bindCourses(el);
  }

  function bindCourses(el) {
    $$('[data-cg=go]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var cid = b.getAttribute('data-cid'), to = b.getAttribute('data-to');
        Z.G.currentCourseId = cid;
        Z.go(to, { course: cid });
      });
    });
    $$('[data-cq=refresh]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        b.classList.add('busy'); b.textContent = '刷新中…';
        setTimeout(function () {
          b.classList.remove('busy'); b.textContent = '刷新课程状态';
          Z.toast('课程对接状态已刷新，均为正常', 'ok');
        }, 800);
      });
    });
  }

  /* ============================================================
     对接课程配置（教学平台对接 · 课堂活动记录配置）
     ============================================================ */
  function renderCourseAuth(el) {
    var d = Z.db();
    var cfg = d.courseSync || {};
    el.innerHTML =
      '<div class="page-head"><div><h3>对接课程配置</h3>' +
      '<div class="ph-sub">配置校方已有教学平台线上课程对接，设置课堂活动记录同步范围与策略</div></div>' +
      '<div class="ph-tools"><span class="chip ok"><span class="dot"></span>统一身份认证已连接</span></div></div>' +
      '<div class="grid g4" style="margin-bottom:12px">' +
      statBox('对接课程总数', d.courses.length + ' 门', '全部已接入校方教学平台') +
      statBox('同步策略', '自动 · 每日', (cfg.strategy || '每日自动（06:30）')) +
      statBox('今日已同步活动', d.activities.filter(function (a) { return a.source === '教学平台同步' && a.pubAt.indexOf('2026-09-09') === 0; }).length + ' 项', '含随堂练习 / 测验 / 签到') +
      statBox('授课计划对接', '已启用', '授课计划 / 大纲覆盖双向校验') +
      '</div>' +
      '<div class="card"><div class="card-h"><div class="t">课程对接列表<span class="s">教学平台课程号 · 同步配置</span></div>' +
      '<button class="btn sm" data-ca="batch">立即批量同步</button></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>课程</th><th>教学平台课程号</th><th>对接状态</th><th>同步方式</th><th>活动类型</th><th>最近同步</th><th style="width:190px">操作</th>' +
      '</tr></thead><tbody>' +
      d.courses.map(function (c) {
        var cc = cfg[c.id] || {};
        var typeTxt = (cfg.types || Object.keys(ZData.ACT_TYPES)).slice(0, 4).join('、') + (cfg.types && cfg.types.length > 4 ? ' 等' : '');
        return '<tr>' +
          '<td style="font-weight:700">' + esc(c.name) + '<div class="tiny faint">' + esc(c.teacher) + ' · ' + esc(c.college) + '</div></td>' +
          '<td class="num muted">' + esc(c.platform.courseId) + '</td>' +
          '<td><span class="chip ok">已对接</span></td>' +
          '<td>' + Z.chip(c.platform.syncMode, 'brand') + '</td>' +
          '<td class="muted">' + esc(typeTxt) + '</td>' +
          '<td class="num muted">' + esc(c.platform.syncAt) + '</td>' +
          '<td><div class="row" style="gap:5px">' +
          '<button class="btn sm" data-ca="detail" data-id="' + c.id + '">配置详情</button>' +
          '<button class="btn sm primary" data-ca="sync" data-id="' + c.id + '">立即同步</button></div></td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="card-b" style="border-top:1px dashed var(--line-2);font-size:12px;color:var(--text-3);line-height:1.9">' +
      '● 课堂活动记录：教学平台课程发布的随堂练习、即时测验、主题讨论、分组任务、课堂签到等，将按配置自动同步至本平台课堂活动时间轴；<br>' +
      '● 授课计划与大纲：自动匹配教学平台授课计划，开展知识点覆盖分析；直录播资源可回传教学平台云盘 / 资源库统一存储调用。</div></div>';
    bindCourseAuth(el);
  }

  function bindCourseAuth(el) {
    $$('[data-ca=sync]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        var c = Z.courseById(id);
        b.classList.add('busy'); b.textContent = '同步中…';
        setTimeout(function () {
          c.platform.syncAt = Z.nowStr();
          Z.saveDB();
          Z.addLog('平台对接', '立即同步', c.name + ' 课堂活动与授课计划同步完成');
          Z.toast(c.name + ' 同步完成（课堂活动 + 授课计划）', 'ok');
          renderCourseAuth(el);
        }, 900);
      });
    });
    $$('[data-ca=detail]', el).forEach(function (b) {
      b.addEventListener('click', function () { openCaDetail(b.getAttribute('data-id')); });
    });
    $$('[data-ca=batch]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        b.classList.add('busy'); b.textContent = '批量同步中…';
        setTimeout(function () {
          var d2 = Z.db();
          d2.courses.forEach(function (c) { c.platform.syncAt = Z.nowStr(); });
          Z.saveDB();
          Z.addLog('平台对接', '批量同步', '全部课程课堂活动 / 授课计划批量同步');
          b.classList.remove('busy'); b.textContent = '立即批量同步';
          Z.toast('全部课程批量同步完成', 'ok');
          renderCourseAuth(el);
        }, 1100);
      });
    });
  }

  function openCaDetail(cid) {
    var c = Z.courseById(cid);
    var d = Z.db();
    var cfg = d.courseSync || {};
    var types = Object.keys(ZData.ACT_TYPES);
    var m = Z.modal({
      title: '对接配置 · ' + c.name, cls: 'wide',
      body:
        '<div class="grid g3" style="margin-bottom:12px">' +
        statBox('教学平台课程', c.platform.courseId, c.platform.courseName) +
        statBox('同步方式', c.platform.syncMode, '最近 ' + c.platform.syncAt) +
        statBox('对接组织', c.platform.org, '统一身份认证') +
        '</div>' +
        '<div style="font-weight:800;margin-bottom:6px">同步活动类型</div>' +
        '<div class="row wrap" style="gap:8px;margin-bottom:12px">' + types.map(function (t) {
          var on = !(cfg.types) || cfg.types.indexOf(t) >= 0;
          return '<label class="lang-chip' + (on ? ' on' : '') + '" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">' +
            '<input type="checkbox" data-ct="' + t + '" style="display:none"' + (on ? ' checked' : '') + '>' + t + '</label>';
        }).join('') + '</div>' +
        '<div class="row" style="gap:14px;margin-bottom:8px;font-size:13px;color:var(--text-2)">' +
        '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="caAuto" checked style="accent-color:var(--brand)"> 启用每日自动同步（06:30）</label>' +
        '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="caReport" checked style="accent-color:var(--brand)"> 同步后自动更新覆盖分析</label>' +
        '</div>' +
        '<div class="help-txt">教学平台侧发布新的随堂练习等活动后，将按以上规则自动记录并沉淀为课堂活动时间轴。</div>',
      footer: '<button class="btn" data-cad="c">取消</button><button class="btn primary" data-cad="s">保存配置</button>'
    });
    $('[data-cad=c]', m.ov).addEventListener('click', m.close);
    $('[data-cad=s]', m.ov).addEventListener('click', function () {
      var d2 = Z.db();
      var ncfg = d2.courseSync || {};
      var list = [];
      $$('[data-ct]', m.ov).forEach(function (cb) { if (cb.checked) list.push(cb.getAttribute('data-ct')); });
      ncfg.types = list;
      ncfg.auto = $('#caAuto', m.ov).checked;
      ncfg.updateAnalysis = $('#caReport', m.ov).checked;
      ncfg[cid] = { auto: ncfg.auto, types: list };
      d2.courseSync = ncfg;
      Z.saveDB();
      Z.addLog('平台对接', '更新配置', c.name + ' 对接范围与同步策略');
      m.close();
      Z.toast('对接配置已保存', 'ok');
      renderCourseAuth(document.getElementById('view'));
    });
  }

  /* ============================================================
     选课与排课
     ============================================================ */
  function renderSchedule(el) {
    var d = Z.db();
    var rows = [];
    d.courses.forEach(function (c) {
      c.sessions.forEach(function (s) {
        rows.push({
          course: c, session: s,
          label: sessionLabel(c, s),
          time: s.dayTime, room: s.classroom, weeks: c.scheduleWeeks,
          cls: s.className, students: s.students
        });
      });
    });
    el.innerHTML =
      '<div class="page-head"><div><h3>选课与排课</h3>' +
      '<div class="ph-sub">' + esc(d.meta.term) + ' · 排课计划与教室安排总览</div></div>' +
      '<div class="ph-tools"><button class="btn" data-sd="conflict">排课冲突检测</button>' +
      '<button class="btn" data-sd="export">导出课表</button></div></div>' +
      '<div class="card"><div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>课程</th><th>授课教师</th><th>节次</th><th>教室</th><th>班级</th><th>排课周</th><th>选课人数</th><th>状态</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r, i) {
        var conflict = i === 1; // 供演示：模拟一次冲突检测提示，若为真实状态再显示
        return '<tr><td style="font-weight:700">' + esc(r.course.name) + '<div class="tiny faint">' + esc(r.course.code) + '</div></td>' +
          '<td>' + esc(r.course.teacher) + '</td>' +
          '<td>' + esc(r.session.weekLabel) + ' · ' + esc(r.time) + '</td>' +
          '<td>' + esc(r.room) + '</td>' +
          '<td>' + esc(r.cls) + '</td>' +
          '<td class="muted">' + esc(r.weeks) + '</td>' +
          '<td class="num">' + r.students + ' 人</td>' +
          '<td><span class="chip ok">已排课</span></td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="card-b" style="border-top:1px dashed var(--line-2);font-size:12px;color:var(--text-3)">数据来自教务系统排课数据（只读），教学资源与录播设备按排课自动关联。</div></div>';
    bindSchedule(el, rows);
  }

  function bindSchedule(el, rows) {
    $$('[data-sd=conflict]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        // 简单冲突检测：同一教室同一节次
        var map = {}, conflicts = [];
        rows.forEach(function (r) {
          var k = r.room + '|' + r.time;
          map[k] = map[k] || [];
          map[k].push(r.course.name);
        });
        Object.keys(map).forEach(function (k) { if (map[k].length > 1) conflicts.push(k + '：' + map[k].join('、')); });
        if (!conflicts.length) {
          Z.toast('未检测到教室 / 节次冲突', 'ok');
          Z.addLog('选课排课', '冲突检测', '全校排课无冲突');
        } else {
          Z.toast('检测到 ' + conflicts.length + ' 处冲突，请核查', 'warn');
        }
      });
    });
    $$('[data-sd=export]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var lines = ['智慧课堂 · 排课表（' + Z.db().meta.term + '）', ''];
        rows.forEach(function (r) {
          lines.push([r.course.name, r.course.teacher, r.session.weekLabel + ' ' + r.time, r.room, r.cls, r.students + '人'].join('\t'));
        });
        Z.downloadText('排课表.txt', lines.join('\n'));
        Z.toast('课表已导出', 'ok');
      });
    });
  }
  function sessionLabel(c, s) { return s.weekLabel + ' · ' + s.dayTime; }

  /* ============================================================
     评价表管理
     ============================================================ */
  function renderEvalForms(el) {
    var d = Z.db();
    el.innerHTML =
      '<div class="page-head"><div><h3>评价表管理</h3>' +
      '<div class="ph-sub">维护督导听课评价表库，启用状态将同步至“在线督导”评价界面</div></div>' +
      '<div class="ph-tools"><button class="btn primary" data-ef="new">新增评价表</button></div></div>' +
      '<div class="grid g3">' +
      d.evalForms.map(function (f) {
        var itemCount = f.dims.reduce(function (x, dm) { return x + dm.items.length; }, 0);
        var used = d.evals.filter(function (e) { return e.formId === f.id; }).length;
        return '<div class="card" style="display:flex;flex-direction:column">' +
          '<div class="card-b" style="flex:1">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">' +
          '<span style="font-weight:800;font-size:15px">' + esc(f.name) + '</span>' +
          '<span class="chip brand">' + esc(f.version) + '</span></div>' +
          '<div class="tiny faint">' + esc(f.org) + ' · ' + esc(f.applyTo) + '</div>' +
          '<div style="margin:10px 0;display:flex;gap:16px;font-size:12.5px;color:var(--text-2)">' +
          '<span>维度 ' + f.dims.length + '</span><span>指标 ' + itemCount + ' 项</span>' +
          '<span>满分 ' + totalOf(f) + '</span><span>已使用 ' + used + ' 次</span></div>' +
          '<div style="font-size:12px;color:var(--text-3);line-height:1.7">' + esc(f.note) + '</div></div>' +
          '<div class="cc-foot" style="justify-content:space-between">' +
          '<label style="display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--text-2);cursor:pointer">' +
          '<input type="checkbox" data-ef="toggle" data-id="' + f.id + '"' + (f.enabled ? ' checked' : '') + ' style="accent-color:var(--brand)"> ' + (f.enabled ? '启用中' : '已停用') + '</label>' +
          '<div class="row" style="gap:5px">' +
          '<button class="btn sm primary" data-ef="edit" data-id="' + f.id + '">参数设置</button>' +
          '<button class="btn sm" data-ef="view" data-id="' + f.id + '">查看结构</button>' +
          '<button class="btn sm" data-ef="clone" data-id="' + f.id + '">复制</button>' +
          '<button class="btn sm ghost" style="color:var(--bad)" data-ef="del" data-id="' + f.id + '">删除</button></div></div></div>';
      }).join('') +
      '</div>' +
      '<div class="mt14" style="font-size:12px;color:var(--text-3);background:#fff;border:1px dashed var(--line);border-radius:10px;padding:10px 16px">评价表库与校方督导评价系统双向同步，评价记录实时回传归档。</div>';
    bindEvalForms(el);
  }

  function totalOf(f) {
    return f.dims.reduce(function (x, dm) { return x + dm.items.reduce(function (y, it) { return y + it.max; }, 0); }, 0);
  }

  function bindEvalForms(el) {
    $$('[data-ef=toggle]', el).forEach(function (cb) {
      cb.addEventListener('change', function () {
        var d = Z.db();
        var f = d.evalForms.filter(function (x) { return x.id === cb.getAttribute('data-id'); })[0];
        f.enabled = cb.checked;
        Z.saveDB();
        Z.addLog('评价表管理', f.enabled ? '启用' : '停用', f.name);
        Z.toast(f.name + ' 已' + (f.enabled ? '启用' : '停用'), 'ok');
        renderEvalForms(el);
      });
    });
    $$('[data-ef=view]', el).forEach(function (b) {
      b.addEventListener('click', function () { viewForm(b.getAttribute('data-id')); });
    });
    $$('[data-ef=edit]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var fid = b.getAttribute('data-id');
        global.ZFormEditor && global.ZFormEditor.open(fid, function () { renderEvalForms(el); });
      });
    });
    $$('[data-ef=clone]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Z.db();
        var f = d.evalForms.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
        var copy = JSON.parse(JSON.stringify(f));
        copy.id = Z.uid('f');
        copy.version = bumpVer(copy.version);
        copy.enabled = true;
        copy.name = copy.name + '（副本）';
        d.evalForms.push(copy);
        Z.saveDB();
        Z.addLog('评价表管理', '复制评价表', copy.name);
        Z.toast('已生成评价表副本', 'ok');
        renderEvalForms(el);
      });
    });
    $$('[data-ef=del]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Z.db();
        var f = d.evalForms.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
        var used = d.evals.filter(function (e) { return e.formId === f.id; }).length;
        Z.confirm({
          title: '删除评价表', okTxt: '删除',
          body: '确定删除评价表《' + esc(f.name) + '》吗？' + (used ? '<br><span class="faint" style="color:var(--warn)">该表已有 ' + used + ' 条历史评价记录，删除后仅不再提供选择。</span>' : ''),
          onOk: function () {
            var d2 = Z.db();
            d2.evalForms = d2.evalForms.filter(function (x) { return x.id !== f.id; });
            Z.saveDB();
            Z.toast('评价表已删除', 'ok');
            renderEvalForms(el);
          }
        });
      });
    });
    $$('[data-ef=new]', el).forEach(function (b) {
      b.addEventListener('click', function () { newForm(); });
    });
  }

  function bumpVer(v) {
    var m = v.match(/V(\d+)\.(\d+)/);
    if (!m) return v + '-C';
    return 'V' + m[1] + '.' + (+m[2] + 1);
  }
  function viewForm(fid) {
    var f = Z.db().evalForms.filter(function (x) { return x.id === fid; })[0];
    if (!f) return;
    var body = '<div class="card" style="padding:12px 14px;background:var(--brand-soft-2);margin-bottom:12px;font-size:13px">' +
      '<b>' + esc(f.name) + '</b>　<span class="chip brand">' + esc(f.version) + '</span>' +
      '<div class="small muted mt6">' + esc(f.org) + ' · ' + esc(f.applyTo) + ' · 满分 ' + totalOf(f) + ' 分</div></div>';
    f.dims.forEach(function (dm, di) {
      body += '<div style="margin-bottom:10px"><div style="font-weight:800;font-size:13px;margin-bottom:4px">' + (di + 1) + '. ' + esc(dm.dim) + '（权重 ' + dm.weight + '）</div>' +
        dm.items.map(function (it) {
          return '<div class="row" style="justify-content:space-between;font-size:12.5px;color:var(--text-2);padding:3px 0;border-bottom:1px dashed var(--line-2)"><span>' + esc(it.name) + '</span><b>' + it.max + '</b></div>';
        }).join('') + '</div>';
    });
    Z.modal({ title: '评价表结构 · ' + f.name, cls: 'wide', body: body });
  }
  function newForm() {
    var d = Z.db();
    var m = Z.modal({
      title: '新增评价表',
      body:
        '<div class="field"><label>评价表名称<span class="req">*</span></label><input class="inp" id="nfName" placeholder="如：青年教师听课评价表"></div>' +
        '<div class="row" style="gap:10px"><div class="field grow"><label>制定单位</label><input class="inp" id="nfOrg" placeholder="如：教师教学发展中心"></div>' +
        '<div class="field" style="width:130px"><label>适用范围</label><input class="inp" id="nfApply" value="理论课 / 实验课"></div></div>' +
        '<div class="field"><label>复制已有评价表结构（推荐）</label><select class="sel" id="nfClone">' +
        '<option value="">（空白结构，需后续编辑）</option>' +
        d.evalForms.map(function (f) { return '<option value="' + f.id + '">' + esc(f.name) + '（' + esc(f.version) + '）</option>'; }).join('') +
        '</select></div>' +
        '<div class="help-txt">复制后可在“评价表管理”中查看结构并调整指标；新表默认启用并出现在督导评价下拉列表。</div>',
      footer: '<button class="btn" data-nf="c">取消</button><button class="btn primary" data-nf="s">创建</button>'
    });
    $('[data-nf=c]', m.ov).addEventListener('click', m.close);
    $('[data-nf=s]', m.ov).addEventListener('click', function () {
      var nm = $('#nfName', m.ov).value.trim();
      if (!nm) { Z.toast('请填写评价表名称', 'warn'); return; }
      var d2 = Z.db();
      var cloneId = $('#nfClone', m.ov).value;
      var base = cloneId ? d2.evalForms.filter(function (f) { return f.id === cloneId; })[0] : null;
      var dims = base ? JSON.parse(JSON.stringify(base.dims)) : [];
      d2.evalForms.unshift({
        id: Z.uid('f'), name: nm, version: 'V1.0',
        org: $('#nfOrg', m.ov).value.trim() || '校教学督导委员会',
        applyTo: $('#nfApply', m.ov).value.trim() || '理论课 / 实验课',
        note: '满分 ' + (base ? totalOf(base) : 100) + ' 分；' + (base ? base.note : '≥90优秀，80-89良好，70-79合格，<70待改进'),
        enabled: true, dims: dims
      });
      Z.saveDB();
      Z.addLog('评价表管理', '新增评价表', nm);
      m.close();
      Z.toast('评价表创建成功', 'ok');
      renderEvalForms(document.getElementById('view'));
    });
  }

  /* ============================================================
     用户管理
     ============================================================ */
  function renderUsers(el) {
    var d = Z.db();
    var roles = ['全部', '平台管理员', '督导专家', '授课教师', '教学秘书'];
    var rSel = state.usersRole || '全部';
    var list = d.users.filter(function (u) { return rSel === '全部' || u.role === rSel; });
    el.innerHTML =
      '<div class="page-head"><div><h3>用户管理</h3>' +
      '<div class="ph-sub">平台用户与角色维护 · 账号采用校园统一身份认证</div></div>' +
      '<div class="ph-tools">' +
      '<select class="sel" id="uRole" style="min-width:130px">' + roles.map(function (r) { return '<option' + (r === rSel ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' +
      '<input class="inp" id="uQ" style="min-width:170px" placeholder="搜索姓名 / 账号…">' +
      '<button class="btn primary" data-um="new">新增用户</button></div></div>' +
      '<div class="card"><div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>姓名</th><th>账号</th><th>所属部门</th><th>角色</th><th>状态</th><th>最近登录</th><th style="width:190px">操作</th>' +
      '</tr></thead><tbody>' +
      list.map(function (u) {
        return '<tr><td style="font-weight:700"><span class="avatar" style="width:26px;height:26px;font-size:11px;display:inline-flex;vertical-align:-7px;margin-right:8px">' + esc(u.name.slice(0, 1)) + '</span>' + esc(u.name) + '</td>' +
          '<td class="num muted">' + esc(u.account) + '</td>' +
          '<td>' + esc(u.dept) + '</td>' +
          '<td>' + roleChip(u.role) + '</td>' +
          '<td><span class="chip ' + (u.status === '启用' ? 'ok' : 'bad') + '">' + esc(u.status) + '</span></td>' +
          '<td class="num muted">' + esc(u.last) + '</td>' +
          '<td><div class="row" style="gap:5px">' +
          '<button class="btn sm" data-um="pwd" data-id="' + u.id + '">重置密码</button>' +
          '<button class="btn sm" data-um="tog" data-id="' + u.id + '">' + (u.status === '启用' ? '停用' : '启用') + '</button>' +
          '<button class="btn sm ghost" style="color:var(--bad)" data-um="del" data-id="' + u.id + '">删除</button></div></td></tr>';
      }).join('') +
      '</tbody></table></div></div>';
    bindUsers(el);
  }
  var state = { usersRole: '全部' };
  function bindUsers(el) {
    $('#uRole', el).addEventListener('change', function () { state.usersRole = this.value; renderUsers(el); });
    $('#uQ', el).addEventListener('input', function () {
      var q = this.value.trim().toLowerCase();
      $$('#uQ', el).forEach(function () {});
      renderUsers(el);
      var inp = $('#uQ', el);
      if (inp && q !== inp.value) inp.value = q;
      // 简单客户端过滤
      var rows = $$('tbody tr', el);
      rows.forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
      });
    });
    $$('[data-um=new]', el).forEach(function (b) {
      b.addEventListener('click', function () { addUser(); });
    });
    $$('[data-um=pwd]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Z.db();
        var u = d.users.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
        if (!u) return;
        var np = 'Zhkt@' + Math.floor(1000 + Math.random() * 9000);
        Z.modal({
          title: '重置密码',
          body: '为用户 <b>' + esc(u.name) + '</b>（' + esc(u.account) + '）重置登录密码？<br><div class="help-txt mt6">新密码将发送至其校内邮箱 / 短信，历史登录会话将失效。</div>',
          footer: '<button class="btn" data-pw="c">取消</button><button class="btn primary" data-pw="s">确认重置</button>'
        });
        var m2 = $('.overlay:last-of-type');
        $('[data-pw=c]', m2).addEventListener('click', function () { m2.remove(); });
        $('[data-pw=s]', m2).addEventListener('click', function () {
          m2.remove();
          Z.addLog('用户管理', '重置密码', u.name + '（' + u.account + '）');
          Z.toast('已重置并通知用户', 'ok');
        });
      });
    });
    $$('[data-um=tog]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Z.db();
        var u = d.users.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
        u.status = u.status === '启用' ? '停用' : '启用';
        Z.saveDB();
        Z.toast(u.name + ' 已' + u.status, 'ok');
        renderUsers(el);
      });
    });
    $$('[data-um=del]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Z.db();
        var u = d.users.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
        Z.confirm({
          title: '删除用户', okTxt: '删除',
          body: '确定删除用户 <b>' + esc(u.name) + '</b>（' + esc(u.account) + '）吗？',
          onOk: function () {
            var d2 = Z.db();
            d2.users = d2.users.filter(function (x) { return x.id !== u.id; });
            Z.saveDB();
            Z.addLog('用户管理', '删除用户', u.name);
            Z.toast('用户已删除', 'ok');
            renderUsers(el);
          }
        });
      });
    });
  }
  function addUser() {
    var m = Z.modal({
      title: '新增用户',
      body:
        '<div class="form-grid">' +
        '<div class="field"><label>姓名<span class="req">*</span></label><input class="inp" id="nuName"></div>' +
        '<div class="field"><label>账号（工号）<span class="req">*</span></label><input class="inp" id="nuAcc"></div>' +
        '<div class="field"><label>所属部门</label><input class="inp" id="nuDept"></div>' +
        '<div class="field"><label>角色</label><select class="sel" id="nuRole"><option>授课教师</option><option>督导专家</option><option>教学秘书</option><option>平台管理员</option></select></div>' +
        '</div>',
      footer: '<button class="btn" data-nu="c">取消</button><button class="btn primary" data-nu="s">创建并开通</button>'
    });
    $('[data-nu=c]', m.ov).addEventListener('click', m.close);
    $('[data-nu=s]', m.ov).addEventListener('click', function () {
      var n = $('#nuName', m.ov).value.trim(), a = $('#nuAcc', m.ov).value.trim();
      if (!n || !a) { Z.toast('请填写姓名与账号', 'warn'); return; }
      var d = Z.db();
      d.users.unshift({
        id: Z.uid('u'), name: n, account: a, dept: $('#nuDept', m.ov).value.trim() || '—',
        role: $('#nuRole', m.ov).value, status: '启用', last: '—'
      });
      Z.saveDB();
      Z.addLog('用户管理', '新增用户', n + '（' + a + '）');
      m.close();
      Z.toast('用户创建成功，初始密码已短信通知', 'ok');
      renderUsers(document.getElementById('view'));
    });
  }
  function roleChip(r) {
    var cls = r === '平台管理员' ? 'bad' : r === '督导专家' ? 'ok' : r === '教学秘书' ? 'warn' : 'info';
    return '<span class="chip ' + cls + '">' + esc(r) + '</span>';
  }

  /* ============================================================
     操作日志
     ============================================================ */
  function renderLogs(el) {
    var d = Z.db();
    var mods = {};
    d.logs.forEach(function (l) { mods[l.module] = 1; });
    var modOpts = Object.keys(mods);
    var mSel = state.logMod || '全部';
    var list = d.logs.filter(function (l) { return mSel === '全部' || l.module === mSel; });
    el.innerHTML =
      '<div class="page-head"><div><h3>操作日志</h3>' +
      '<div class="ph-sub">平台关键操作审计留痕，供管理员与督导系统追溯</div></div>' +
      '<div class="ph-tools">' +
      '<select class="sel" id="lgMod" style="min-width:140px"><option>全部</option>' + modOpts.map(function (x) { return '<option' + (x === mSel ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>' +
      '<button class="btn" data-lg="export">导出日志</button>' +
      '<button class="btn ghost" style="color:var(--bad)" data-lg="clear">清空本地日志</button></div></div>' +
      '<div class="card"><div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:150px">时间</th><th>操作人</th><th>模块</th><th>动作</th><th>详情</th>' +
      '</tr></thead><tbody>' +
      list.map(function (l) {
        return '<tr><td class="num muted">' + esc(l.time) + '</td>' +
          '<td>' + esc(l.user) + '</td>' +
          '<td>' + Z.chip(l.module, 'brand') + '</td>' +
          '<td><b>' + esc(l.action) + '</b></td>' +
          '<td class="muted">' + esc(l.detail) + '</td></tr>';
      }).join('') +
      '</tbody></table></div></div>';
    bindLogs(el);
  }
  function bindLogs(el) {
    $('#lgMod', el).addEventListener('change', function () { state.logMod = this.value; renderLogs(el); });
    $$('[data-lg=export]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Z.db();
        var lines = ['智慧课堂 · 操作日志', ''];
        d.logs.forEach(function (l) { lines.push([l.time, l.user, l.module, l.action, l.detail].join('\t')); });
        Z.downloadText('操作日志_' + Z.todayStr() + '.txt', lines.join('\n'));
        Z.toast('日志已导出', 'ok');
      });
    });
    $$('[data-lg=clear]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        Z.confirm({
          title: '清空操作日志', okTxt: '清空',
          body: '确定清空当前本地操作日志吗？（仅演示环境本地数据，不影响系统审计）',
          onOk: function () {
            var d = Z.db();
            d.logs = [];
            Z.saveDB();
            Z.toast('本地操作日志已清空', 'ok');
            renderLogs(el);
          }
        });
      });
    });
  }

  /* ============================================================
     帮助中心
     ============================================================ */
  function renderHelp(el) {
    var faqs = [
      ['如何实现课堂活动与教学平台的同步？', '在“对接课程配置”中维护课程对接，可设置每日自动同步或课后即时同步，系统将把教学平台发布的随堂练习、即时测验、主题讨论、分组任务、签到等活动按时间轴沉淀至“课堂活动”。'],
      ['授课计划覆盖率是如何计算与更新的？', '系统自动匹配校方教学平台授课计划条目，依据课堂活动参与记录与授课录播/转写内容累计覆盖学时；可在“授课计划比对”一键重新匹配，“分析报告”输出知识点覆盖统计详情。'],
      ['直录播资源如何开放给学生并同步到教学平台？', '在“直录播资源”中对单个视频设置开放范围（校内公开 / 课程班级 / 指定班级 / 私有）与开放能力，支持在线剪辑导出片段，并一键同步至校方教学平台云盘 / 资源库。'],
      ['语音转写支持哪些语言与翻译语种？', '课堂语音支持实时转写并按上下文语义自动纠错；翻译语种涵盖中文、英语、德语、法语、日语、俄语、西班牙语、韩语、阿拉伯语、葡萄牙语、印地语等。'],
      ['督导评课与学校评价系统如何对接？', '课堂直录播视频直连校方督导评价系统，督导员可边看视频边选择评价表打分，界面展示课程、开课学院、教师、教室、班级、排课周、周进度与选课人数，基础信息字号可大中小切换。'],
      ['资源与评价数据是否安全？', '平台账号与校园统一身份认证打通，资源访问按开放范围鉴权；操作全程留痕（操作日志），评价记录实时回传校方评价系统归档。']
    ];
    el.innerHTML =
      '<div class="page-head"><div><h3>帮助中心</h3>' +
      '<div class="ph-sub">常见问题与使用指引 · 服务时间 工作日 8:00-18:00</div></div>' +
      '<div class="ph-tools"><button class="btn primary" data-hp="contact">联系技术支持</button></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 300px;gap:14px;align-items:start">' +
      '<div>' + faqs.map(function (f, i) {
        return '<div class="faq" data-faq="' + i + '"><div class="q">' + (i + 1) + '. ' + esc(f[0]) + '<span class="ar">▼</span></div><div class="a">' + esc(f[1]) + '</div></div>';
      }).join('') + '</div>' +
      '<div>' +
      '<div class="card"><div class="card-h"><div class="t">平台服务状态</div></div><div class="card-b" style="display:flex;flex-direction:column;gap:10px;font-size:13px">' +
      '<div class="row" style="justify-content:space-between"><span>语音识别 / 翻译服务</span><span class="chip ok">正常</span></div>' +
      '<div class="row" style="justify-content:space-between"><span>教学平台对接</span><span class="chip ok">正常</span></div>' +
      '<div class="row" style="justify-content:space-between"><span>督导评价系统</span><span class="chip ok">正常</span></div>' +
      '<div class="row" style="justify-content:space-between"><span>资源转码服务</span><span class="chip ok">正常</span></div>' +
      '</div></div>' +
      '<div class="card mt14"><div class="card-h"><div class="t">快捷指引</div></div><div class="card-b" style="display:flex;flex-direction:column;gap:8px;font-size:13px">' +
      '<button class="btn" data-hp="to" data-r="activity">我要发起随堂练习 / 讨论</button>' +
      '<button class="btn" data-hp="to" data-r="teachplan">查看授课计划覆盖率</button>' +
      '<button class="btn" data-hp="to" data-r="resources">管理课堂实录视频</button>' +
      '<button class="btn" data-hp="to" data-r="supervision">进入督导评课</button></div></div>' +
      '</div></div>';
    bindHelp(el);
  }
  function bindHelp(el) {
    $$('.faq .q', el).forEach(function (q) {
      q.addEventListener('click', function () {
        var box = q.parentNode;
        box.classList.toggle('open');
      });
    });
    $$('[data-hp=to]', el).forEach(function (b) {
      b.addEventListener('click', function () { Z.go(b.getAttribute('data-r')); });
    });
    $$('[data-hp=contact]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        Z.modal({
          title: '联系技术支持',
          body: '<div style="display:flex;flex-direction:column;gap:10px;font-size:14px">' +
            '<div class="row"><span style="width:86px;color:var(--text-2)">服务电话</span><b>400-800-2026</b></div>' +
            '<div class="row"><span style="width:86px;color:var(--text-2)">服务邮箱</span><b>support@zhkt.edu.cn</b></div>' +
            '<div class="row"><span style="width:86px;color:var(--text-2)">服务群组</span><b>教学平台管理员工作群</b></div>' +
            '<div class="help-txt">可通过在线工单提交问题，一般 2 小时内响应。</div></div>'
        });
      });
    });
  }

  /* ============================================================
     评价表参数设置（维度 / 指标 / 分值 在线编辑，督导评课页与评价表管理页共用）
     ============================================================ */
  function openFormEditor(formId, onSaved) {
    var d = Z.db();
    var f = d.evalForms.filter(function (x) { return x.id === formId; })[0];
    if (!f) { Z.toast('未找到评价表', 'warn'); return; }
    var S = {
      name: f.name, org: f.org, applyTo: f.applyTo, note: f.note,
      dims: JSON.parse(JSON.stringify(f.dims))
    };

    function total() {
      return S.dims.reduce(function (x, dm) { return x + dm.items.reduce(function (y, it) { return y + (parseFloat(it.max) || 0); }, 0); }, 0);
    }
    function readFromDom(root) {
      S.dims.forEach(function (dm, di) {
        var nm = $('#fd-name-' + di, root);
        if (nm) dm.dim = nm.value.trim();
        dm.items.forEach(function (it, ii) {
          var itNm = $('#fd-item-' + di + '-' + ii, root);
          var itMx = $('#fd-max-' + di + '-' + ii, root);
          if (itNm) it.name = itNm.value.trim();
          if (itMx) it.max = parseFloat(itMx.value) || 0;
        });
      });
    }
    function render(root) {
      var html = '<div style="display:flex;flex-direction:column;gap:12px;max-height:56vh;overflow-y:auto;padding-right:4px">';
      S.dims.forEach(function (dm, di) {
        html += '<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fff">' +
          '<div class="row" style="justify-content:space-between;margin-bottom:8px;gap:8px;flex-wrap:wrap">' +
          '<input class="inp" id="fd-name-' + di + '" value="' + esc(dm.dim) + '" style="max-width:340px;font-weight:700">' +
          '<button class="btn sm ghost" style="color:var(--bad)" data-fe="delDim" data-i="' + di + '">删除维度</button></div>';
        dm.items.forEach(function (it, ii) {
          html += '<div class="row" style="gap:8px;margin-bottom:6px;align-items:center">' +
            '<span class="tiny faint" style="width:16px">' + (ii + 1) + '</span>' +
            '<input class="inp" id="fd-item-' + di + '-' + ii + '" value="' + esc(it.name) + '" style="flex:1" placeholder="指标描述">' +
            '<input class="inp" id="fd-max-' + di + '-' + ii + '" type="number" min="1" value="' + it.max + '" style="width:74px;text-align:right" title="满分分值">' +
            '<button class="btn sm ghost" style="color:var(--bad)" data-fe="delItem" data-d="' + di + '" data-i="' + ii + '">×</button></div>';
        });
        html += '<button class="btn sm" data-fe="addItem" data-i="' + di + '">+ 添加指标</button></div>';
      });
      html += '<button class="btn sm" data-fe="addDim">+ 添加维度</button>' +
        '</div>';
      var rootEl = $('#feRoot', m.ov);
      if (rootEl) rootEl.innerHTML = html;
      var totEl = $('#feTot', m.ov);
      if (totEl) totEl.textContent = total();
    }

    var m = Z.modal({
      title: '评价表参数设置 · ' + f.name, cls: 'xl',
      body:
        '<div class="form-grid" style="margin-bottom:8px">' +
        '<div class="field"><label>评价表名称</label><input class="inp" id="feName" value="' + esc(S.name) + '"></div>' +
        '<div class="field"><label>制定单位</label><input class="inp" id="feOrg" value="' + esc(S.org) + '"></div>' +
        '<div class="field"><label>适用范围</label><input class="inp" id="feApply" value="' + esc(S.applyTo) + '"></div>' +
        '<div class="field"><label>当前总分</label><div class="inp" id="feTot" style="background:var(--brand-soft-2);font-weight:800;color:var(--brand-deep)">' + total() + '</div></div>' +
        '<div class="field full"><label>评分说明（等级规则）</label><textarea class="txt" id="feNote" style="min-height:52px">' + esc(S.note) + '</textarea></div>' +
        '</div>' +
        '<div style="font-weight:800;margin-bottom:8px">评价维度与指标（分值之和即总分）</div>' +
        '<div id="feRoot"></div>' +
        '<div class="help-txt mt6">督导评价界面将按此结构展示与打分；修改保存后即时生效，历史记录不受影响。</div>',
      footer: '<button class="btn" data-fec="c">取消</button><button class="btn primary" data-fec="s">保存设置</button>'
    });
    render($('#feRoot', m.ov));

    /* 结构操作：先同步输入，再变更模型并重绘 */
    m.ov.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-fe]') : null;
      if (!b) return;
      readFromDom(m.ov);
      var op = b.getAttribute('data-fe');
      if (op === 'addItem') {
        var di = parseInt(b.getAttribute('data-i'), 10);
        S.dims[di].items.push({ name: '', max: 5 });
      } else if (op === 'delItem') {
        var dd = parseInt(b.getAttribute('data-d'), 10), dii = parseInt(b.getAttribute('data-i'), 10);
        if (S.dims[dd].items.length > 1) S.dims[dd].items.splice(dii, 1);
        else Z.toast('每个维度至少保留 1 项指标', 'warn');
      } else if (op === 'addDim') {
        S.dims.push({ dim: '新维度', weight: 0, items: [{ name: '新评价指标', max: 10 }] });
      } else if (op === 'delDim') {
        var ddel = parseInt(b.getAttribute('data-i'), 10);
        if (S.dims.length > 1) S.dims.splice(ddel, 1);
        else Z.toast('评价表至少保留 1 个维度', 'warn');
      }
      render($('#feRoot', m.ov));
    });

    $('[data-fec=c]', m.ov).addEventListener('click', m.close);
    $('[data-fec=s]', m.ov).addEventListener('click', function () {
      readFromDom(m.ov);
      S.name = $('#feName', m.ov).value.trim();
      S.org = $('#feOrg', m.ov).value.trim() || '校教学督导委员会';
      S.applyTo = $('#feApply', m.ov).value.trim() || '理论课 / 实验课';
      S.note = $('#feNote', m.ov).value.trim();
      if (!S.name) { Z.toast('请填写评价表名称', 'warn'); return; }
      // 校验
      var bad = false;
      S.dims.forEach(function (dm) {
        if (!dm.dim) bad = true;
        dm.items.forEach(function (it) { if (!it.name || !(it.max > 0)) bad = true; });
      });
      if (bad) { Z.toast('维度名称、指标描述与分值均需填写且分值>0', 'warn'); return; }
      var d2 = Z.db();
      var real = d2.evalForms.filter(function (x) { return x.id === formId; })[0];
      real.name = S.name; real.org = S.org; real.applyTo = S.applyTo;
      real.note = S.note; real.dims = S.dims;
      real.version = bumpVer(real.version);
      Z.saveDB();
      Z.addLog('评价表管理', '参数设置', real.name + '（维度 ' + real.dims.length + '，总分 ' + total() + '）');
      m.close();
      Z.toast('评价表参数已保存（版本 ' + real.version + '）', 'ok');
      if (onSaved) onSaved();
    });
  }

  function statBox(l, v, e) {
    return '<div class="card stat-card"><div class="lab">' + esc(l) + '</div><div class="num">' + v + '</div><div class="extra">' + esc(e) + '</div></div>';
  }

  global.ZFormEditor = { open: openFormEditor };

  Z.register('courses', { render: renderCourses });
  Z.register('course-auth', { render: renderCourseAuth });
  Z.register('schedule', { render: renderSchedule });
  Z.register('evalforms', { render: renderEvalForms });
  Z.register('users', { render: renderUsers });
  Z.register('logs', { render: renderLogs });
  Z.register('help', { render: renderHelp });
})(window);
