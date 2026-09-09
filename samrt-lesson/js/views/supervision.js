/* ============================================================
   在线督导 —— 课堂实录直连督导评价（紫色信息栏 / 评价表打分 / 字号切换）
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  var st = {
    courseId: 'c1',
    sessionId: 's2',
    formId: 'f1',
    fs: 14.5,          // 基础信息字号
    formVersion: 0
  };

  var FS_PRESET = [
    { label: '大', size: 16.5 },
    { label: '中', size: 14.5 },
    { label: '小', size: 12.5 }
  ];

  function sessionLabel(c, s) { return s.weekLabel + ' · ' + s.dayTime; }

  function allSessions() {
    var out = [];
    Z.db().courses.forEach(function (c) {
      c.sessions.forEach(function (s) {
        out.push({ courseId: c.id, course: c, session: s, label: '[' + c.name + '] ' + sessionLabel(c, s) });
      });
    });
    return out;
  }

  function currentSel() {
    return { course: Z.courseById(st.courseId), session: Z.courseById(st.courseId).sessions.filter(function (s) { return s.id === st.sessionId; })[0] };
  }

  function progressOf(c, s) {
    var p = c.progress || { totalWeeks: 18 };
    var tot = c.weeksTotal || p.totalWeeks || 18;
    // 周进度以“当前听课本节次所在周”动态计算，切换课次时随之变化
    var wk = (s && s.weekNo) || p.taughtWeeks || 1;
    var pct = Math.round(wk / tot * 100);
    return { txt: wk + '/' + tot + '周', pct: pct, wk: wk };
  }

  function alreadyEval(c, s) {
    var lab = sessionLabel(c, s);
    return Z.db().evals.filter(function (e) { return e.courseId === c.id && e.sessionLabel === lab; })[0] || null;
  }

  function render(el) {
    var d = Z.db();
    var sel = currentSel();
    var c = sel.course, s = sel.session;
    if (!c || !s) { el.innerHTML = '<div class="card pad">课程数据异常</div>'; return; }
    var prog = progressOf(c, s);
    var forms = d.evalForms.filter(function (f) { return f.enabled; });
    if (!forms.filter(function (f) { return f.id === st.formId; }).length) st.formId = forms[0] ? forms[0].id : 'f1';
    var form = d.evalForms.filter(function (f) { return f.id === st.formId; })[0] || forms[0];
    var ev = alreadyEval(c, s);
    var sim = Z.G.routeParams && Z.G.routeParams.session;
    if (sim) { Z.G.routeParams = {}; }

    /* 周进度文本 & 字段 */
    var topFields = [
      ['课程', c.name + '　' + c.code],
      ['开课学院', c.college],
      ['授课教师', c.teacher + ' ' + c.title],
      ['教室', s.classroom || c.classroom],
      ['班级', s.className || c.className],
      ['排课周', s.weekLabel + ' · ' + s.dayTime],
      ['周进度', prog.txt + ' · ' + prog.pct + '%'],
      ['选课人数', (s.students || c.students) + ' 人']
    ];

    var sessionsOpts = allSessions().map(function (o) {
      return '<option value="' + o.courseId + '|' + o.session.id + '"' +
        (o.courseId === st.courseId && o.session.id === st.sessionId ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    /* 播放素材（真实课堂视频优先，缺失则课件示例） */
    var res = d.resources.filter(function (r) { return r.courseId === c.id && r.kind === '课堂实录'; })[0]
      || d.resources.filter(function (r) { return r.courseId === c.id; })[0]
      || d.resources[0];
    var fallSlides = (res && ZData.SLIDE_SETS[res.slides]) || ZData.SLIDE_SETS.c1_copd;

    el.innerHTML =
      '<div class="page-head"><div><h3>在线督导</h3>' +
      '<div class="ph-sub">课堂直录播视频直连校方督导评价系统，边看边评、界面统一</div></div>' +
      '<div class="ph-tools">' +
      '<span class="chip ok"><span class="dot"></span>已接入校方评价系统</span>' +
      '<select class="sel" id="suSel" style="min-width:300px">' + sessionsOpts + '</select>' +
      '</div></div>' +

      /* 顶部信息栏 */
      '<div class="super-bar" style="margin-bottom:14px">' +
      topFields.map(function (f, i) {
        return '<div class="cell"><div class="lb">' + f[0] + '</div><div class="vl' + (i === 0 ? ' small-v' : '') + '" title="' + esc(f[1]) + '">' + esc(f[1]) + '</div></div>';
      }).join('') +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:14px;align-items:start">' +

      /* ---- 左：视频 ---- */
      '<div style="min-width:0">' +
      '<div class="card"><div class="card-h"><div class="t">课堂授课视频<span class="s">' + (res ? res.title : '课堂实录') + '</span></div>' +
      '<span class="chip info">直连评价系统</span></div>' +
      '<div class="card-b" style="padding:14px">' +
      '<div id="suPlayer"></div>' +
      '<div class="row mt10" style="justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12.5px;color:var(--text-2)">' +
      '<span>授课视频：' + esc(res ? res.title : '—') + '（' + (res ? Z.fmtDur(res.durSec) : '') + '）</span>' +
      '<span>督导专家：李岩 <span class="chip ok" style="margin-left:4px">听课中</span></span>' +
      '<span>画面 1/2：教师画面 · 学生画面</span></div>' +
      '</div></div>' +

      /* 评价记录列表 */
      '<div class="card" style="margin-top:14px"><div class="card-h"><div class="t">我的督导评价记录<span class="s">共 ' + d.evals.length + ' 条</span></div>' +
      '<button class="btn sm" data-sv="exportAll">导出汇总</button></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>课程</th><th>节次</th><th>授课教师</th><th>评价表</th><th>总分</th><th>等级</th><th>评价时间</th><th style="width:150px">操作</th></tr></thead><tbody>' +
      (d.evals.length ? d.evals.map(function (e) {
        var cc = Z.courseById(e.courseId);
        var ff = d.evalForms.filter(function (x) { return x.id === e.formId; })[0];
        return '<tr><td style="font-weight:700">' + esc(cc ? cc.name : '-') + '</td>' +
          '<td class="muted">' + esc(e.sessionLabel) + '</td>' +
          '<td>' + esc(e.teacher) + '</td>' +
          '<td class="muted">' + esc(ff ? ff.name : '-') + '</td>' +
          '<td class="num" style="font-weight:800;color:var(--brand-deep)">' + e.total + '</td>' +
          '<td>' + levelChip(e.level) + '</td>' +
          '<td class="num muted">' + esc(e.date) + '</td>' +
          '<td><div class="row" style="gap:5px"><button class="btn sm" data-ev="view" data-id="' + e.id + '">查看</button>' +
          '<button class="btn sm ghost" style="color:var(--bad)" data-ev="del" data-id="' + e.id + '">删除</button></div></td></tr>';
      }).join('') : '<tr><td colspan="8">' + Z.emptyBox('暂无督导评价记录') + '</td></tr>') +
      '</tbody></table></div></div>' +
      '</div>' +

      /* ---- 右：评价操作 ---- */
      '<div style="min-width:0">' +
      '<div class="card">' +
      '<div class="card-h"><div class="t">督导评价<span class="s">选择评价表 · 在线打分</span></div>' +
      '<div class="fs-switch" id="fsSwitch" title="基础信息字号切换">' +
      FS_PRESET.map(function (p) {
        return '<button data-fs="' + p.size + '" class="sz-' + (p.label === '大' ? 'l' : p.label === '小' ? 's' : 'm') + (Math.abs(p.size - st.fs) < 0.01 ? ' on' : '') + '">' + p.label + '</button>';
      }).join('') + '</div></div>' +

      '<div class="card-b">' +
      '<div class="row" style="gap:8px;margin-bottom:12px;flex-wrap:wrap">' +
      '<label class="muted" style="font-size:12.5px">评价表</label>' +
      '<select class="sel" id="suForm" style="min-width:240px">' +
      forms.map(function (f) { return '<option value="' + f.id + '"' + (f.id === st.formId ? ' selected' : '') + '>' + esc(f.name) + '（' + esc(f.version) + '）</option>'; }).join('') +
      '</select>' +
      '<span class="chip gray">当前字号：' + (st.fs >= 16 ? '大' : st.fs <= 13 ? '小' : '中') + '</span>' +
      '<button class="btn sm" data-su="formset" style="margin-left:auto" title="编辑当前评价表的维度 / 指标 / 分值">评价表参数设置</button></div>' +

      '<div class="eval-zone" id="evalZone" style="font-size:' + st.fs + 'px">' +

      /* 基础信息 */
      '<div class="eval-area baseinfo" style="border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:var(--brand-soft-2);margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px">' +
      '<span style="font-weight:800;font-size:1.1em">' + esc(form.name) + '</span>' +
      '<span class="chip brand">' + esc(form.version) + '</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px 14px;font-size:.94em;color:var(--text-2)">' +
      '<span>制定单位：' + esc(form.org) + '</span>' +
      '<span>适用范围：' + esc(form.applyTo) + '</span>' +
      '<span>指标数：' + form.dims.length + ' 个维度 · ' + form.dims.reduce(function (x, dm) { return x + dm.items.length; }, 0) + ' 项</span>' +
      '<span style="grid-column:1/-1" class="faint">评分说明：' + esc(form.note) + '</span></div></div>' +

      /* 打分表 */
      '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px;overflow:hidden"><table class="score-grid" style="width:100%"><thead><tr>' +
      '<th style="width:56px">维度</th><th>评价指标</th><th style="width:86px">满分</th><th style="width:120px">得分</th></tr></thead><tbody>' +
      form.dims.map(function (dm, di) {
        var items = dm.items.map(function (it) {
          return '<tr data-max="' + it.max + '"><td style="text-align:center">' + (di + 1) + '</td>' +
            '<td style="font-weight:600">' + esc(it.name) + '</td>' +
            '<td class="num" style="text-align:center">' + it.max + '</td>' +
            '<td style="text-align:center"><input class="score" type="number" min="0" max="' + it.max + '" step="0.5" placeholder="0-' + it.max + '"></td></tr>';
        }).join('');
        return '<tr class="dim-row"><td style="text-align:center;font-weight:800" rowspan="' + (dm.items.length + 1) + '">' + esc(dm.dim) + '</td></tr>' + items;
      }).join('') +
      '<tr style="background:var(--brand-soft-2)"><td colspan="2" style="font-weight:800">合计 / 等级</td><td class="num" style="text-align:center;font-weight:800">' + totalOf(form) + '</td>' +
      '<td style="text-align:center"><b id="totTxt" style="color:var(--brand-deep);font-size:1.25em">0.0</b> <span id="lvlTxt" class="chip gray" style="margin-left:4px">待评分</span></td></tr>' +
      '</tbody></table></div>' +

      '<div class="field mt14"><label>综合评价意见（评语）</label>' +
      '<textarea class="txt" id="suComment" style="min-height:64px" placeholder="请填写听课评价意见（选填）"></textarea></div>' +

      (ev ?
        '<div class="row" style="gap:8px;background:var(--ok-bg);color:var(--ok);border-radius:9px;padding:10px 12px;font-size:13px;flex-wrap:wrap">' +
        '<span style="flex:1">本课次已提交评价（' + ev.total + ' 分 · ' + ev.level + '），可重新评分覆盖。</span>' +
        '<button class="btn sm" data-ev="view" data-id="' + ev.id + '">查看已提交</button></div>' : '') +
      (ev ?
        '<button class="btn primary lg mt14" style="width:100%" data-sv="submit"><span>重新提交评分</span></button>' :
        '<button class="btn primary lg mt14" style="width:100%" data-sv="submit"><span>提交评价</span></button>') +
      '</div>' /* eval-zone */ +
      '</div></div></div>' +
      '</div>' /* cols */ ;

    var ph = $('#suPlayer', el);
    ZLesson.mount(ph, {
      fallback: { slides: fallSlides, durSec: res ? res.durSec : 2700, badge: '督导听课 · 课堂实录', watermark: c.name + ' · ' + c.teacher + ' 授课' },
      autoStart: false
    });
    bind(el);
  }

  function totalOf(form) {
    return form.dims.reduce(function (x, dm) { return x + dm.items.reduce(function (y, it) { return y + it.max; }, 0); }, 0);
  }
  function levelOf(t) {
    if (t >= 90) return '优秀';
    if (t >= 80) return '良好';
    if (t >= 70) return '合格';
    return '待改进';
  }

  function calcTotal(el) {
    var s = 0, ok = true, firstErr = null;
    $$('#evalZone tbody tr[data-max]', el).forEach(function (tr) {
      var mx = parseFloat(tr.getAttribute('data-max'));
      var inp = $('input.score', tr);
      var v = inp.value;
      inp.classList.remove('err');
      if (v === '') { inp.classList.add('err'); ok = false; if (!firstErr) firstErr = inp; return; }
      var n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > mx) { inp.classList.add('err'); ok = false; if (!firstErr) firstErr = inp; return; }
      s += n;
    });
    var tot = $('#totTxt', el);
    var lvl = $('#lvlTxt', el);
    if (tot) { tot.textContent = (Math.round(s * 10) / 10).toFixed(1); }
    if (lvl) { if (ok) { lvl.textContent = levelOf(s); lvl.className = 'chip ' + (s >= 90 ? 'ok' : s >= 70 ? 'warn' : 'bad'); } else { lvl.textContent = '待评分'; lvl.className = 'chip gray'; } }
    if (firstErr) { firstErr.focus(); }
    return { total: Math.round(s * 10) / 10, ok: ok };
  }

  function bind(el) {
    var d = Z.db();
    $('#suSel', el).addEventListener('change', function () {
      var v = this.value.split('|');
      st.courseId = v[0]; st.sessionId = v[1];
      render(el);
    });
    $('#suForm', el).addEventListener('change', function () {
      st.formId = this.value;
      st.formVersion++;
      render(el);
    });
    /* 当前评价表参数设置（维度/指标/分值在线编辑） */
    $$('[data-su=formset]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        if (global.ZFormEditor) {
          global.ZFormEditor.open(st.formId, function () { render(el); });
        } else {
          Z.toast('评价表编辑器加载中，请稍后重试', 'warn');
        }
      });
    });
    /* 字号切换 */
    $$('#fsSwitch button', el).forEach(function (b) {
      b.addEventListener('click', function () {
        st.fs = parseFloat(b.getAttribute('data-fs'));
        $$('#fsSwitch button', el).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var zone = $('#evalZone', el);
        if (zone) zone.style.fontSize = st.fs + 'px';
        Z.toast('评价基础信息字号已切换为：' + (st.fs >= 16 ? '大' : st.fs <= 13 ? '小' : '中'), '');
      });
    });
    /* 打分输入实时合计 */
    $$('#evalZone input.score', el).forEach(function (inp) {
      inp.addEventListener('input', function () { calcTotal(el); });
    });
    /* 提交 */
    $$('[data-sv=submit]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = calcTotal(el);
        if (!r.ok) { Z.toast('请先完成全部指标打分', 'warn'); return; }
        var sel = currentSel();
        var c = sel.course, s = sel.session;
        var form = d.evalForms.filter(function (f) { return f.id === st.formId; })[0];
        var evOld = alreadyEval(c, s);
        var comment = $('#suComment', el).value.trim() || '本次听课总体良好，课堂组织有序，师生互动充分。';
        Z.confirm({
          title: evOld ? '重新提交评价' : '提交评价',
          body: '本课次（' + esc(sessionLabel(c, s)) + '）总分 <b style="color:var(--brand-deep)">' + r.total + '</b> 分，等级 <b>' + levelOf(r.total) + '</b>。确认提交至督导评价系统归档？',
          okTxt: '确认提交',
          onOk: function () {
            var d2 = Z.db();
            var rec = {
              id: evOld ? evOld.id : Z.uid('e'),
              formId: st.formId, courseId: c.id, sessionLabel: sessionLabel(c, s),
              teacher: c.teacher, rater: '李岩', date: Z.nowStr(),
              total: r.total, level: levelOf(r.total), comment: comment, status: '已提交'
            };
            if (evOld) {
              d2.evals = d2.evals.map(function (x) { return x.id === evOld.id ? rec : x; });
              Z.addLog('在线督导', '重新提交评价', c.name + ' ' + sessionLabel(c, s) + '（' + r.total + ' 分）');
            } else {
              d2.evals.unshift(rec);
              Z.addLog('在线督导', '提交评价', c.name + ' ' + sessionLabel(c, s) + '（' + r.total + ' 分 · ' + rec.level + '）');
            }
            Z.saveDB();
            Z.addNotice('ok', '评价已提交', '督导评价已提交校方评价系统归档：' + c.name + ' ' + sessionLabel(c, s) + '。');
            Z.toast('评价已提交至校方评价系统', 'ok');
            render(el);
          }
        });
      });
    });
    /* 记录查看 / 删除 / 导出 */
    $$('[data-ev=view]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var e = d.evals.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
        if (e) viewEval(e);
      });
    });
    $$('[data-ev=del]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var e = d.evals.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
        if (!e) return;
        Z.confirm({
          title: '删除评价记录', okTxt: '删除',
          body: '确定删除该督导评价记录吗？删除后需重新评课。',
          onOk: function () {
            var d2 = Z.db();
            d2.evals = d2.evals.filter(function (x) { return x.id !== e.id; });
            Z.saveDB();
            Z.toast('评价记录已删除', 'ok');
            render(el);
          }
        });
      });
    });
    $$('[data-sv=exportAll]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var lines = ['智慧课堂 · 督导评价记录汇总', ''];
        d.evals.forEach(function (e) {
          var cc = Z.courseById(e.courseId);
          lines.push([cc ? cc.name : '', e.sessionLabel, e.teacher, e.total, e.level, e.date].join('\t'));
        });
        Z.downloadText('督导评价记录汇总.txt', lines.join('\n'));
        Z.toast('已导出评价记录汇总', 'ok');
      });
    });
  }

  function viewEval(e) {
    var c = Z.courseById(e.courseId);
    var form = Z.db().evalForms.filter(function (f) { return f.id === e.formId; })[0];
    Z.modal({
      title: '督导评价详情',
      cls: 'wide',
      body:
        '<div class="card" style="padding:14px 16px;background:var(--brand-soft-2);margin-bottom:12px">' +
        '<div style="font-weight:800">' + esc(c ? c.name : '') + ' · ' + esc(e.sessionLabel) + '</div>' +
        '<div class="small muted mt6" style="display:flex;gap:16px;flex-wrap:wrap">' +
        '<span>授课教师：' + esc(e.teacher) + '</span><span>评价表：' + esc(form ? form.name : '') + '</span>' +
        '<span>评价人：' + esc(e.rater) + '</span><span>评价时间：' + esc(e.date) + '</span></div></div>' +
        '<div class="row" style="gap:18px;margin-bottom:12px">' +
        '<div style="text-align:center;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border-radius:12px;padding:12px 20px"><div class="tiny" style="opacity:.8">总分</div><div style="font-size:26px;font-weight:800">' + e.total + '</div></div>' +
        '<div style="display:flex;flex-direction:column;justify-content:center"><span class="chip ' + (e.total >= 90 ? 'ok' : e.total >= 70 ? 'warn' : 'bad') + '" style="font-size:14px">' + e.level + '</span>' +
        '<span class="tiny faint mt6">满分 ' + (form ? totalOf(form) : 100) + ' 分</span></div></div>' +
        '<div style="font-weight:800;margin-bottom:4px">综合评价意见</div>' +
        '<div style="background:#fff;border:1px solid var(--line);border-radius:9px;padding:10px 14px;color:var(--text-2)">' + esc(e.comment) + '</div>'
    });
  }
  function levelChip(lv) {
    var cls = lv === '优秀' ? 'ok' : lv === '良好' ? 'warn' : lv === '合格' ? 'info' : 'bad';
    return '<span class="chip ' + cls + '">' + esc(lv) + '</span>';
  }

  Z.register('supervision', { render: render });
})(window);
