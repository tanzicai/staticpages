/* ============================================================
   资源中心 —— 直录播资源 / 在线剪辑 / 权限 / 同步 + 云端资源库
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  var rsState = { courseId: 'c1', kind: '全部', q: '' };
  var cloudState = { folder: '我的文件', q: '' };

  var KIND_COLORS = { '课堂实录': '#5B4AD8', '直播回放': '#C24E7E', '微课': '#14967A', '剪辑片段': '#C77E1B' };
  var SCOPE_CN = { '校内公开': '校内公开', '课程班级': '仅课程班级', '指定班级': '指定班级', '私有': '仅本人' };

  function courseOptions() {
    var d = Z.db();
    return d.courses.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');
  }

  function scopeChip(scope, allow) {
    var s = SCOPE_CN[scope] || scope;
    var cls = scope === '校内公开' ? 'info' : scope === '私有' ? 'warn' : scope === '指定班级' || scope === '指定教师' ? 'bad' : 'brand';
    var dl = (allow || []).indexOf('下载') >= 0;
    return '<span class="chip ' + cls + '">' + esc(s) + '</span>' +
      (dl ? '<span class="chip gray">可下载</span>' : '');
  }
  function fmtBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
  }
  /* ---------- 资源平台调用（自由调用记录） ---------- */
  function callsOf(resId) { return Z.db().resourceCalls.filter(function (c) { return c.resId === resId; }); }
  function callKind(c) {
    return c.type === 'activity' ? '课堂活动' : c.type === 'course' ? '课程资料' : '知识点证据';
  }

  /* ============================================================
     直录播资源
     ============================================================ */
  function renderResources(el) {
    var d = Z.db();
    var rp = Z.G.routeParams || {};
    if (rp.course) rsState.courseId = rp.course;
    var list = d.resources.filter(function (r) {
      if (rsState.courseId !== 'all' && r.courseId !== rsState.courseId) return false;
      if (rsState.kind !== '全部' && r.kind !== rsState.kind) return false;
      if (rsState.q && (r.title + r.teacher).indexOf(rsState.q) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });

    var countBy = {};
    d.resources.forEach(function (r) { countBy[r.kind] = (countBy[r.kind] || 0) + 1; });

    el.innerHTML =
      '<div class="page-head"><div><h3>直录播资源</h3>' +
      '<div class="ph-sub">授课视频统一管理 · 支持开放权限设置、在线剪辑导出、同步至校方教学平台云盘/资源库</div></div>' +
      '<div class="ph-tools">' +
      '<select class="sel" id="rsCourse"><option value="all">全部课程</option>' + courseOptions() + '</select>' +
      '<input class="inp" id="rsQ" style="min-width:190px" placeholder="搜索资源标题 / 教师…">' +
      '<button class="btn primary" data-q="upload">上传资源</button>' +
      '</div></div>' +

      '<div class="grid g4" style="margin-bottom:12px">' +
      statBox('资源总数', d.resources.length + ' 个', '课堂实录 ' + (countBy['课堂实录'] || 0) + ' · 回放 ' + (countBy['直播回放'] || 0) + ' · 微课 ' + (countBy['微课'] || 0) + ' · 剪辑 ' + (countBy['剪辑片段'] || 0)) +
      statBox('已同步教学平台', d.resources.filter(function (r) { return r.synced.done; }).length + ' 个', '存储于校方云盘 / 资源库') +
      statBox('开放范围', '3 档', '校内公开 / 课程班级 / 指定对象') +
      statBox('待处理', d.resources.filter(function (r) { return !r.synced.done; }).length + ' 个未同步', '含新上传与剪辑导出') +
      '</div>' +

      '<div class="card">' +
      '<div class="filterbar">' +
      '<span class="seg" id="rsKind">' + ['全部', '课堂实录', '直播回放', '微课', '剪辑片段'].map(function (k) {
        return '<button class="' + (rsState.kind === k ? 'on' : '') + '" data-kind="' + k + '">' + k + (countBy[k] ? ' ' + countBy[k] : '') + '</button>';
      }).join('') + '</span>' +
      '<span class="faint" style="margin-left:auto">共 ' + list.length + ' 个资源</span></div>' +
      '<div class="card-b">' +
      (list.length ? list.map(function (r) { return resourceRow(r, d); }).join('') : Z.emptyBox('当前条件下暂无资源，可点击“上传资源”。')) +
      '</div></div>';
    bindResources(el);
  }

  function resourceRow(r, d) {
    var c = Z.courseById(r.courseId);
    var col = KIND_COLORS[r.kind] || '#5B4AD8';
    var nCall = callsOf(r.id).length;
    var grantTxt = '';
    if (r.permission.scope === '指定班级' && (r.permission.classes || []).length) {
      grantTxt = '<div class="tiny faint mt6">开放班级：' + esc(r.permission.classes.slice(0, 3).join('、')) + (r.permission.classes.length > 3 ? ' 等 ' + r.permission.classes.length + ' 个班级' : '') + '</div>';
    }
    return '<div class="file-row" style="align-items:stretch">' +
      '<div class="file-thumb" style="background:linear-gradient(135deg,' + col + 'cc,' + col + '55);cursor:pointer" data-q="play" data-id="' + r.id + '" title="点击播放">' +
      '<span class="fk">' + r.kind.replace('直播回放', '回放').slice(0, 2) + '</span>' +
      '<span class="len">' + Z.fmtDur(r.durSec) + '</span></div>' +
      '<div class="file-meta">' +
      '<div class="fn">' + esc(r.title) +
      '<span class="chip" style="background:' + col + '1a;color:' + col + '">' + r.kind + '</span>' +
      (r.synced.done ? '<span class="chip ok">已同步教学平台</span>' : '<span class="chip warn">未同步</span>') +
      (nCall ? '<span class="chip info" data-q="viewcalls" data-id="' + r.id + '" style="cursor:pointer">已被调用 ' + nCall + ' 处</span>' : '') +
      '</div>' +
      '<div class="fm">' +
      '<span>课程：' + esc(c ? c.name : '-') + '</span>' +
      '<span>主讲：' + esc(r.teacher) + '</span>' +
      '<span>录制：' + esc(r.date) + '</span>' +
      '<span>大小：' + esc(r.size) + '</span>' +
      '<span style="display:inline-flex;gap:6px;align-items:center">权限：' + scopeChip(r.permission.scope, r.permission.allow) + '</span>' +
      '</div>' + grantTxt +
      (r.synced.done && r.synced.target ? '<div class="tiny faint mt6" style="display:flex;align-items:center;gap:6px"><span style="width:6px;height:6px;border-radius:50%;background:var(--ok);display:inline-block"></span>已同步：' + esc(r.synced.target) + '（' + esc(r.synced.at) + '）</div>' : '') +
      (r.clipFrom ? '<div class="tiny faint mt6">素材来源：' + esc((Z.db().resources.filter(function (x) { return x.id === r.clipFrom; })[0] || {}).title || '-') + '</div>' : '') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;justify-content:center;flex:none">' +
      '<button class="btn sm primary" data-q="play" data-id="' + r.id + '">播放</button>' +
      '<button class="btn sm" data-q="clip" data-id="' + r.id + '">在线剪辑</button>' +
      '<button class="btn sm" data-q="perm" data-id="' + r.id + '">访问权限</button>' +
      '<button class="btn sm" data-q="call" data-id="' + r.id + '">平台调用</button>' +
      (r.synced.done ? '<button class="btn sm" disabled>已同步</button>' : '<button class="btn sm" data-q="sync" data-id="' + r.id + '">同步教学平台</button>') +
      '<div class="row" style="gap:6px"><button class="btn sm ghost" data-q="dl" data-id="' + r.id + '" style="flex:1">授权下载</button>' +
      '<button class="btn sm ghost" data-q="del" data-id="' + r.id + '" style="color:var(--bad)">移除</button></div>' +
      '</div></div>';
  }

  function bindResources(el) {
    var cs = $('#rsCourse', el);
    if (cs) cs.value = rsState.courseId;
    if (cs) cs.addEventListener('change', function () { rsState.courseId = cs.value; renderResources(el); });
    $('#rsQ', el).addEventListener('input', function () { rsState.q = this.value.trim(); renderResources(el); });
    $$('#rsKind button', el).forEach(function (b) {
      b.addEventListener('click', function () { rsState.kind = b.getAttribute('data-kind'); renderResources(el); });
    });
    /* 事件委托：行内操作 */
    $$('[data-q]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var q = b.getAttribute('data-q'), id = b.getAttribute('data-id');
        var r = id ? Z.db().resources.filter(function (x) { return x.id === id; })[0] : null;
        if (q === 'play') openPlayer(r);
        else if (q === 'clip') openClip(r, el);
        else if (q === 'perm') openPerm(r, el);
        else if (q === 'sync') doSyncRes(r, b, el);
        else if (q === 'dl') dlAuth(r);
        else if (q === 'del') delRes(r, el);
        else if (q === 'upload') openUpload(el);
        else if (q === 'call') openCall(r, el);
        else if (q === 'viewcalls') viewCalls(r);
      });
    });
  }

  function openPlayer(r) {
    var slides = (ZData.SLIDE_SETS[r.slides] || ZData.SLIDE_SETS.c1_gen);
    var c = Z.courseById(r.courseId);
    var m = Z.modal({ title: r.title, cls: 'xl', body: '<div id="plHost"></div>' +
      '<div class="row mt10" style="font-size:12px;color:var(--text-2)"><span>课程：' + esc(c ? c.name : '') + '</span><span>主讲：' + esc(r.teacher) + '</span>' +
      '<span>录制时间：' + esc(r.date) + '</span><span style="margin-left:auto">来源：' + esc(r.kind) + (r.clipFrom ? '（剪辑片段）' : '') + '</span></div>' });
    ZLesson.mount($('#plHost', m.ov), {
      fallback: { slides: slides, durSec: r.durSec, badge: r.kind === '课堂实录' ? '课堂实录' : r.kind, watermark: (c ? c.name : '') + ' · 主讲 ' + r.teacher },
      autoStart: false
    });
  }

  function openClip(r, el) {
    var maxTxt = Z.fmtDur(r.durSec);
    var mid = Math.floor(r.durSec / 2);
    var m = Z.modal({
      title: '在线剪辑 · ' + r.title, cls: 'wide',
      body:
        '<div class="row" style="gap:12px;align-items:flex-end;margin-bottom:12px">' +
        '<div class="field" style="flex:1;margin:0"><label>入点（开始时间）</label><input class="inp" id="clIn" value="00:00:00"></div>' +
        '<div class="field" style="flex:1;margin:0"><label>出点（结束时间）</label><input class="inp" id="clOut" value="' + Z.fmtDur(mid) + '"></div>' +
        '<button class="btn sm" id="clPlay">试播片段</button></div>' +
        '<div class="player-frame" style="aspect-ratio:16/7;min-height:220px;border-radius:8px" id="clipPrev"><div class="screen"><div class="bg"></div>' +
        '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff">' +
        '<div style="font-size:16px;font-weight:700">剪辑预览区</div>' +
        '<div style="font-size:12px;opacity:.6;margin-top:8px">设置入点 / 出点后点击“试播片段”或直接导出</div></div></div></div>' +
        '<div class="row mt10" style="gap:18px;font-size:12.5px;color:var(--text-2)">' +
        '<span>素材总时长：' + maxTxt + '</span><span>剪辑后时长：<b id="clLen" style="color:var(--brand-deep)">-</b></span>' +
        '<span>导出格式：MP4 · 1080P · 与原课同权限</span></div>' +
        '<div class="help-txt mt10">剪辑基于云端原始视频进行无损片段抽取，导出后作为独立“剪辑片段”资源保存，可继续设置权限或同步至教学平台资源库。</div>',
      footer: '<button class="btn" data-cl="cancel">取消</button><button class="btn" data-cl="export" id="clExport">导出剪辑</button>'
    });
    function calc() {
      var tin = Z.parseDur($('#clIn', m.ov).value), tout = Z.parseDur($('#clOut', m.ov).value);
      if (isNaN(tin)) tin = 0;
      if (isNaN(tout)) tout = r.durSec;
      if (tout > r.durSec) tout = r.durSec;
      if (tin >= tout) { $('#clLen', m.ov).textContent = '入点需早于出点'; return -1; }
      $('#clLen', m.ov).textContent = Z.fmtDur(tout - tin);
      return tout - tin;
    }
    calc();
    $$('#clIn,#clOut', m.ov).forEach(function (i) { i.addEventListener('input', calc); });
    $('#clPlay', m.ov).addEventListener('click', function () {
      var len = calc();
      if (len < 0) { Z.toast('请检查入点与出点', 'warn'); return; }
      Z.toast('已试播剪辑片段 ' + Z.fmtDur(len), 'ok');
    });
    $('[data-cl=cancel]', m.ov).addEventListener('click', m.close);
    $('#clExport', m.ov).addEventListener('click', function () {
      var len = calc();
      if (len < 0) return;
      var b = $('#clExport', m.ov);
      b.classList.add('busy'); b.textContent = '导出中…';
      setTimeout(function () {
        var d = Z.db();
        d.resources.unshift({
          id: Z.uid('r'), courseId: r.courseId, kind: '剪辑片段',
          title: '《' + r.title.replace(/[《》]/g, '') + '》剪辑片段',
          date: Z.todayStr(), durSec: len, size: Math.max(24, Math.round(len / 60 * 2.1)) + ' MB',
          teacher: r.teacher, slides: r.slides, stt: r.stt || null,
          permission: { scope: r.permission.scope, allow: ['在线回看'], classes: (r.permission.classes || []).slice() },
          synced: { done: false, at: '', target: '' }, clipFrom: r.id
        });
        Z.saveDB();
        Z.addLog('直录播资源', '剪辑导出', r.title + ' 导出片段 ' + Z.fmtDur(len));
        Z.addNotice('ok', '剪辑完成', '剪辑片段已生成并保存至直录播资源（' + Z.fmtDur(len) + '）。');
        m.close();
        Z.toast('剪辑片段导出成功，已加入资源列表', 'ok');
        rsState.kind = '剪辑片段';
        renderResources(el);
      }, 1100);
    });
  }

  function permTargetsHtml(scope, cur) {
    var d = Z.db();
    cur = cur || [];
    if (scope === '指定班级') {
      var list = d.classes || ZData.CLASSLIST;
      return '<div style="font-weight:800;margin-bottom:6px">选择开放班级（可多选，已选 <b id="permCnt" style="color:var(--brand-deep)">' + cur.length + '</b> 个）</div>' +
        '<div class="row wrap" style="gap:7px;max-height:150px;overflow-y:auto;padding-right:4px;margin-bottom:4px">' +
        list.map(function (cl) {
          var on = cur.indexOf(cl) >= 0;
          return '<label class="lang-chip' + (on ? ' on' : '') + '" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">' +
            '<input type="checkbox" data-cls="' + esc(cl) + '"' + (on ? ' checked' : '') + ' style="display:none">' + esc(cl) + '</label>';
        }).join('') + '</div>';
    }
    if (scope === '指定教师') {
      var ts = d.teachers || ZData.TEACHERLIST;
      return '<div style="font-weight:800;margin-bottom:6px">选择授权教师（可多选）</div>' +
        '<div class="row wrap" style="gap:7px;max-height:120px;overflow-y:auto">' +
        ts.map(function (t) {
          var on = cur.indexOf(t) >= 0;
          return '<label class="lang-chip' + (on ? ' on' : '') + '" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">' +
            '<input type="checkbox" data-cls="' + esc(t) + '"' + (on ? ' checked' : '') + ' style="display:none">' + esc(t) + '</label>';
        }).join('') + '</div>';
    }
    return '<div class="help-txt">' + scopeDesc(scope, Z.courseById('c1')) + '</div>';
  }
  function permSelCount(el) {
    var n = $$('#permTargetWrap [data-cls]:checked', el).length;
    var c = $('#permCnt', el);
    if (c) c.textContent = n;
    return n;
  }

  function openPerm(r, el) {
    var c = Z.courseById(r.courseId);
    var scopes = ['校内公开', '课程班级', '指定班级', '私有'];
    var curClasses = r.permission.classes || [];
    var m = Z.modal({
      title: '访问权限设置 · ' + r.title, cls: 'wide',
      body:
        '<div style="font-weight:800;margin-bottom:8px">开放范围</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">' +
        scopes.map(function (s) {
          return '<label style="display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:9px;padding:9px 12px;cursor:pointer;' +
            (r.permission.scope === s ? 'border-color:var(--brand);background:var(--brand-soft-2)' : '') + '">' +
            '<input type="radio" name="permScope" value="' + s + '"' + (r.permission.scope === s ? ' checked' : '') + ' style="accent-color:var(--brand)">' +
            '<div><div style="font-weight:700;font-size:13.5px">' + s + '</div>' +
            '<div class="tiny faint">' + scopeDesc(s, c) + '</div></div></label>';
        }).join('') + '</div>' +
        '<div id="permTargetWrap" style="border:1px dashed var(--line);border-radius:10px;padding:10px 12px;margin-bottom:12px"></div>' +
        '<div style="font-weight:800;margin-bottom:6px">开放能力</div>' +
        '<div class="row wrap" style="gap:8px;margin-bottom:6px">' +
        ['在线回看', '下载', '转发分享'].map(function (cap) {
          var on = (r.permission.allow || []).indexOf(cap) >= 0;
          return '<label class="lang-chip' + (on ? ' on' : '') + '" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">' +
            '<input type="checkbox" style="display:none" data-cap="' + cap + '"' + (on ? ' checked' : '') + '>' + cap + '</label>';
        }).join('') + '</div>' +
        '<div class="help-txt">“指定班级”仅对所选班级开放；“私有”仅资源创建人可见；其余范围默认对全校 / 本课学生开放。</div>',
      footer: '<button class="btn" data-pf="cancel">取消</button><button class="btn primary" data-pf="save">保存设置</button>'
    });
    var wrap = $('#permTargetWrap', m.ov);
    function refreshTargets() {
      var sel = $('input[name=permScope]:checked', m.ov);
      var scope = sel ? sel.value : r.permission.scope;
      wrap.innerHTML = permTargetsHtml(scope, scope === '指定班级' ? curClasses : []);
      permSelCount(m.ov);
    }
    refreshTargets();
    $$('input[name=permScope]', m.ov).forEach(function (rd) {
      rd.addEventListener('change', refreshTargets);
    });
    wrap.addEventListener('change', function () { permSelCount(m.ov); });
    $('[data-pf=cancel]', m.ov).addEventListener('click', m.close);
    $('[data-pf=save]', m.ov).addEventListener('click', function () {
      var sel = $('input[name=permScope]:checked', m.ov);
      var scope = sel ? sel.value : r.permission.scope;
      var allow = [];
      $$('[data-cap]', m.ov).forEach(function (cb) { if (cb.checked) allow.push(cb.getAttribute('data-cap')); });
      var classes = [];
      $$('#permTargetWrap [data-cls]:checked', m.ov).forEach(function (cb) { classes.push(cb.getAttribute('data-cls')); });
      if (scope === '指定班级' && !classes.length) { Z.toast('请至少选择一个开放班级', 'warn'); return; }
      r.permission.scope = scope;
      r.permission.allow = allow;
      r.permission.classes = scope === '指定班级' ? classes : (r.permission.classes || []);
      Z.saveDB();
      Z.addLog('直录播资源', '修改权限', r.title + ' 开放范围：' + scope + (classes.length ? '（' + classes.length + ' 个班级）' : ''));
      Z.toast('访问权限已更新', 'ok');
      m.close();
      renderResources(el);
    });
  }
  function scopeDesc(s, c) {
    if (s === '校内公开') return '全校师生均可通过平台检索与观看';
    if (s === '课程班级') return '仅 ' + (c ? c.className : '本课程') + ' 选课学生可观看';
    if (s === '指定班级') return '可勾选一个或多个班级 / 教学小组开放';
    if (s === '指定教师') return '仅指定的教师账号可访问';
    return '仅资源创建人（教师本人）可见';
  }

  function doSyncRes(r, btn, el) {
    var c = Z.courseById(r.courseId);
    var oldTxt = btn.textContent;
    btn.classList.add('busy'); btn.textContent = '同步中…';
    setTimeout(function () {
      r.synced.done = true;
      r.synced.at = Z.nowStr();
      r.synced.target = '教学平台 · 资源库/' + (c ? c.name : '') + '/' + (r.kind === '剪辑片段' ? '剪辑片段' : '视频');
      Z.saveDB();
      Z.addLog('直录播资源', '同步教学平台', r.title + ' → ' + r.synced.target);
      Z.addNotice('ok', '资源同步完成', r.title + ' 已同步至校方教学平台资源库。');
      Z.toast('已同步至校方教学平台云盘 / 资源库', 'ok');
      renderResources(el);
    }, 1000);
  }

  function dlAuth(r) {
    var txt = '智慧课堂 · 资源授权下载清单\n资源：' + r.title + '\n课程：' + (Z.courseById(r.courseId) || {}).name + '\n时长：' + Z.fmtDur(r.durSec) + '\n访问链接（校内）：https://zhkt.local/res?v=' + r.id + '\n授权方式：统一身份认证后自动鉴权下载。';
    Z.downloadText('下载授权_' + r.id + '.txt', txt);
    Z.addLog('直录播资源', '授权下载', r.title);
    Z.toast('下载授权清单已生成', 'ok');
  }

  function delRes(r, el) {
    Z.confirm({
      title: '移除资源', okTxt: '移除',
      body: '确定移除资源《' + esc(r.title) + '》吗？若已同步至教学平台，请先在资源库删除对应副本。',
      onOk: function () {
        var d = Z.db();
        d.resources = d.resources.filter(function (x) { return x.id !== r.id; });
        Z.saveDB();
        Z.addLog('直录播资源', '移除资源', r.title);
        Z.toast('资源已移除', 'ok');
        renderResources(el);
      }
    });
  }

  function openUpload(el) {
    var d = Z.db();
    var defC = Z.courseById(rsState.courseId === 'all' ? 'c1' : rsState.courseId) || d.courses[0];
    var pick = { name: '', size: 0 };
    var m = Z.modal({
      title: '上传授课视频（支持本地文件选择）', cls: 'wide',
      body:
        '<div class="form-grid">' +
        '<div class="field full"><label>资源标题<span class="req">*</span></label><input class="inp" id="upTitle" placeholder="如：《COPD稳定期管理》第8周课堂实录"></div>' +
        '<div class="field"><label>资源类型<span class="req">*</span></label><select class="sel" id="upKind"><option>课堂实录</option><option>微课</option><option>直播回放</option></select></div>' +
        '<div class="field"><label>所属课程<span class="req">*</span></label><select class="sel" id="upCourse">' + courseOptions() + '</select></div>' +
        '<div class="field full"><label>视频文件（从本机选择）</label>' +
        '<div class="row" style="gap:8px">' +
        '<input type="file" id="upFileInput" accept="video/*,.mp4,.mkv,.mov,.avi,.flv" class="hide">' +
        '<button class="btn" data-uf="pick">选择本地文件…</button>' +
        '<span class="muted" id="upFileHint" style="font-size:12px;align-self:center">未选择文件（可留空，用示例时长上传）</span>' +
        '</div></div>' +
        '<div class="field"><label>录制时长（分钟）</label><input class="inp" id="upDur" type="number" value="40" min="1"></div>' +
        '<div class="field"><label>开放范围</label><select class="sel" id="upScope"><option>课程班级</option><option>校内公开</option><option>指定班级</option><option>私有</option></select></div>' +
        '<div class="field full" id="upClassWrap" style="display:none"><label>选择开放班级（可多选）</label>' +
        '<div class="row wrap" style="gap:6px;max-height:96px;overflow-y:auto">' +
        (d.classes || ZData.CLASSLIST).map(function (cl) {
          return '<label class="lang-chip" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" data-ucls="' + esc(cl) + '" style="display:none">' + esc(cl) + '</label>';
        }).join('') + '</div></div>' +
        '<div class="field full"><label>简介</label><textarea class="txt" id="upDesc" placeholder="课程章节、录制内容说明（选填）"></textarea></div>' +
        '</div>',
      footer: '<button class="btn" data-uf="cancel">取消</button><button class="btn primary" data-uf="save" id="upSave">上传并转码</button>'
    });
    // 打开本机文件选择窗口
    var fileInp = $('#upFileInput', m.ov);
    $('[data-uf=pick]', m.ov).addEventListener('click', function () { fileInp.click(); });
    fileInp.addEventListener('change', function () {
      var f = fileInp.files && fileInp.files[0];
      if (f) {
        pick.name = f.name;
        pick.size = f.size;
        $('#upFileHint', m.ov).textContent = f.name + '（' + fmtBytes(f.size) + '）';
        if (!$('#upTitle', m.ov).value.trim()) {
          var base = f.name.replace(/\.[^.]+$/, '');
          $('#upTitle', m.ov).value = base;
        }
        Z.toast('已选择本地文件：' + f.name, 'ok');
      }
    });
    var scopeSel = $('#upScope', m.ov);
    function toggleClasses() {
      var show = scopeSel.value === '指定班级';
      $('#upClassWrap', m.ov).style.display = show ? '' : 'none';
    }
    scopeSel.addEventListener('change', toggleClasses);
    toggleClasses();
    $('[data-uf=cancel]', m.ov).addEventListener('click', m.close);
    $('#upSave', m.ov).addEventListener('click', function () {
      var t = $('#upTitle', m.ov).value.trim();
      if (!t) { Z.toast('请填写资源标题', 'warn'); return; }
      var scope = scopeSel.value;
      var classes = [];
      $$('[data-ucls]:checked', m.ov).forEach(function (cb) { classes.push(cb.getAttribute('data-ucls')); });
      if (scope === '指定班级' && !classes.length) { Z.toast('指定班级开放需至少选择一个班级', 'warn'); return; }
      var b = $('#upSave', m.ov);
      b.classList.add('busy'); b.textContent = '上传中…';
      setTimeout(function () {
        var d2 = Z.db();
        var courseId = $('#upCourse', m.ov).value;
        var kind = $('#upKind', m.ov).value;
        var durM = parseInt($('#upDur', m.ov).value, 10) || 40;
        var co = Z.courseById(courseId);
        var slideMap = { c1: 'c1_gen', c2: 'c2', c3: 'c3', c4: 'c4', c5: 'c5' };
        var sizeTxt = pick.size ? fmtBytes(pick.size) : Math.max(80, Math.round(durM * 26 / 10)) + ' MB';
        d2.resources.unshift({
          id: Z.uid('r'), courseId: courseId, kind: kind, title: t,
          date: Z.todayStr(), durSec: durM * 60,
          size: sizeTxt,
          teacher: (Z.session() || {}).name || '管理员',
          slides: slideMap[co.id] || 'c1_gen',
          stt: ZData.STT_DEFAULT_BY_COURSE[courseId] || null,
          permission: { scope: scope, allow: ['在线回看'], classes: scope === '指定班级' ? classes : [] },
          synced: { done: false, at: '', target: '' }, clipFrom: '',
          srcFile: pick.name || '',
          desc: $('#upDesc', m.ov).value.trim()
        });
        Z.saveDB();
        Z.addLog('直录播资源', '上传资源', t + '（' + co.name + '）' + (pick.name ? ' · 源文件 ' + pick.name : ''));
        m.close();
        Z.toast('上传成功，视频正在后台转码', 'ok');
        rsState.kind = '全部';
        renderResources(el);
      }, 1200);
    });
  }

  /* ---------- 资源平台内调用（自由调用） ---------- */
  function openCall(r, el) {
    var d = Z.db();
    var c = Z.courseById(r.courseId);
    var acts = d.activities.filter(function (a) { return a.courseId === r.courseId; }).sort(function (a, b) { return a.pubAt < b.pubAt ? 1 : -1; });
    var o = Z.outlineById(r.courseId);
    var kps = [];
    if (o) o.chapters.forEach(function (ch) { ch.kps.forEach(function (k) { kps.push(k); }); });
    var m = Z.modal({
      title: '平台调用 · ' + r.title, cls: 'wide',
      body:
        '<div class="help-txt mb10" style="font-size:12.5px;line-height:1.9">将本资源“调用”到平台内的具体使用位置（如绑定课堂活动作为课后资料、加入课程资料区、或作为知识点覆盖证据），调用后资源可被对应场景直接播放引用，实现跨模块自由调用。</div>' +
        '<div style="font-weight:800;margin-bottom:6px">1. 调用位置</div>' +
        '<select class="sel" id="clTarget" style="width:100%;margin-bottom:10px">' +
        '<option value="activity">绑定到课堂活动（时间轴活动 → 课后资料附件）</option>' +
        '<option value="course">加入课程资料区（' + esc(c ? c.name : '') + '）</option>' +
        (kps.length ? '<option value="kp">作为大纲知识点覆盖证据（选择知识点）</option>' : '') +
        '</select>' +
        '<div id="clSelBox"></div>' +
        '<div style="font-weight:800;margin-bottom:6px;margin-top:8px">2. 说明</div>' +
        '<input class="inp" id="clNote" placeholder="例如：本节课重点讲解片段，供学生课后复习（选填）">',
      footer: '<button class="btn" data-cll="cancel">取消</button><button class="btn primary" data-cll="add">添加调用</button>'
    });
    function refreshSel() {
      var box = $('#clSelBox', m.ov);
      var kind = $('#clTarget', m.ov).value;
      var selBox = document.createElement('div');
      if (kind === 'activity') {
        if (!acts.length) { selBox.innerHTML = '<div class="help-txt">该课程暂无课堂活动</div>'; }
        else {
          var html = '<select class="sel" id="clRef" style="width:100%">' + acts.map(function (a) {
            return '<option value="' + a.id + '">' + esc(a.pubAt + ' · ' + a.title) + '</option>';
          }).join('') + '</select>';
          selBox.innerHTML = html;
        }
      } else if (kind === 'kp') {
        selBox.innerHTML = '<select class="sel" id="clRef" style="width:100%">' + kps.map(function (k) {
          return '<option value="' + k.id + '">' + esc(k.name + '（第' + k.week + '周）') + '</option>';
        }).join('') + '</select>';
      } else {
        selBox.innerHTML = '<div class="help-txt">将添加到课程资料区（课程库）内该课程下，学生可在课程资料中直接点播。</div>';
      }
      box.innerHTML = '';
      box.appendChild(selBox);
    }
    refreshSel();
    $('#clTarget', m.ov).addEventListener('change', refreshSel);
    $('[data-cll=cancel]', m.ov).addEventListener('click', m.close);
    $('[data-cll=add]', m.ov).addEventListener('click', function () {
      var kind = $('#clTarget', m.ov).value;
      var ref = $('#clRef', m.ov);
      var note = $('#clNote', m.ov).value.trim();
      var refId = ref ? ref.value : c.id;
      var refTxt = '';
      if (kind === 'activity') {
        var act = acts.filter(function (x) { return x.id === refId; })[0];
        refTxt = act.title;
      } else if (kind === 'kp') {
        refTxt = (Z.kpById(r.courseId, refId) || {}).name || '';
      } else {
        refTxt = c.name;
      }
      if (callsOf(r.id).filter(function (x) { return x.type === kind && x.refId === refId; }).length) {
        Z.toast('该资源已在同一位置被调用，请勿重复添加', 'warn'); return;
      }
      var d2 = Z.db();
      d2.resourceCalls.push({
        id: Z.uid('rc'), resId: r.id, courseId: r.courseId,
        type: kind, refId: refId, title: refTxt, note: note, at: Z.nowStr()
      });
      Z.saveDB();
      Z.addLog('直录播资源', '平台调用', r.title + ' → ' + callKind({ type: kind }) + '：' + refTxt);
      m.close();
      Z.toast('调用成功：该资源已在「' + callKind({ type: kind }) + '」中可直接播放引用', 'ok');
      renderResources(el);
    });
  }
  function viewCalls(r) {
    var list = callsOf(r.id);
    var body = '<div class="card" style="padding:12px 14px;background:var(--brand-soft-2);margin-bottom:12px"><b>' + esc(r.title) + '</b>' +
      '<div class="tiny faint mt6">' + (list.length ? '该资源已被以下位置调用，点击可直接跳转播放引用。' : '该资源尚未被调用，可在资源行点击“平台调用”添加。') + '</div></div>';
    if (list.length) {
      list.forEach(function (cc) {
        var icon = cc.type === 'activity' ? '课堂活动' : cc.type === 'course' ? '课程资料' : '知识点证据';
        body += '<div class="file-row" style="padding:10px 14px;margin-bottom:8px">' +
          '<div style="flex:1;min-width:0"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<span class="chip brand">' + icon + '</span><span style="font-weight:700;font-size:13.5px">' + esc(cc.title) + '</span></div>' +
          '<div class="tiny faint mt6">' + esc(cc.at) + (cc.note ? ' · ' + esc(cc.note) : '') + '</div></div>' +
          '<button class="btn sm" data-rc="play" data-id="' + cc.id + '">引用播放</button>' +
          '<button class="btn sm ghost" style="color:var(--bad)" data-rc="rm" data-id="' + cc.id + '">取消调用</button></div>';
      });
    } else {
      body += Z.emptyBox('暂无调用记录');
    }
    var m = Z.modal({ title: '资源调用情况 · ' + r.title, cls: 'wide', body: body });
    $$('[data-rc]', m.ov).forEach(function (b) {
      b.addEventListener('click', function () {
        var op = b.getAttribute('data-rc'), id = b.getAttribute('data-id');
        if (op === 'rm') {
          var d2 = Z.db();
          var rc = d2.resourceCalls.filter(function (x) { return x.id === id; })[0];
          d2.resourceCalls = d2.resourceCalls.filter(function (x) { return x.id !== id; });
          Z.saveDB();
          Z.addLog('直录播资源', '取消调用', (rc ? rc.title : ''));
          Z.toast('已取消该调用', 'ok');
          m.close();
          renderResources(document.getElementById('view'));
        } else {
          openPlayer(r);
        }
      });
    });
  }

  function statBox(l, v, e) {
    return '<div class="card stat-card"><div class="lab">' + esc(l) + '</div><div class="num">' + v + '</div><div class="extra">' + esc(e) + '</div></div>';
  }

  /* ============================================================
     云端资源库
     ============================================================ */
  function renderCloud(el) {
    var d = Z.db();
    var list = d.cloudFiles.filter(function (f) {
      if (cloudState.folder && f.folder !== cloudState.folder) return false;
      if (cloudState.q && (f.name + f.owner).indexOf(cloudState.q) < 0) return false;
      return true;
    });
    var folderCount = {};
    d.cloudFiles.forEach(function (f) { folderCount[f.folder] = (folderCount[f.folder] || 0) + 1; });

    el.innerHTML =
      '<div class="page-head"><div><h3>云端资源库</h3>' +
      '<div class="ph-sub">课件、教案、视频等教学资源云存储 · 支持一键同步至校方教学平台云盘/资源库</div></div>' +
      '<div class="ph-tools">' +
      '<input class="inp" id="cfQ" style="min-width:190px" placeholder="搜索文件名 / 上传人…">' +
      '<button class="btn primary" data-q="cf-upload">上传文件</button></div></div>' +

      '<div class="grid g4" style="margin-bottom:12px">' +
      statBox('文件总数', d.cloudFiles.length + ' 个', '共享 ' + d.cloudFiles.filter(function (f) { return f.scope !== '私有'; }).length + ' · 私有 ' + d.cloudFiles.filter(function (f) { return f.scope === '私有'; }).length) +
      statBox('已同步教学平台', d.cloudFiles.filter(function (f) { return f.platformSynced; }).length + ' 个', '云盘 / 资源库') +
      statBox('分类', d.cloudFolders.length + ' 类', d.cloudFolders.join(' / ')) +
      statBox('存储占用', '1.06 GB', '含音视频与课件归档') +
      '</div>' +

      '<div class="card">' +
      '<div class="filterbar"><span class="muted" style="font-size:12.5px">目录</span>' +
      '<span class="seg" id="cfFolder">' + d.cloudFolders.map(function (f) {
        return '<button class="' + (cloudState.folder === f ? 'on' : '') + '" data-folder="' + f + '">' + f + ' ' + (folderCount[f] || 0) + '</button>';
      }).join('') + '</span>' +
      '<span class="faint" style="margin-left:auto">共 ' + list.length + ' 个文件</span></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>文件名</th><th>分类</th><th>大小</th><th>上传人</th><th>日期</th><th>开放范围</th><th>教学平台同步</th><th style="width:190px">操作</th>' +
      '</tr></thead><tbody>' +
      (list.length ? list.map(function (f) { return cloudRow(f); }).join('') :
        '<tr><td colspan="8">' + Z.emptyBox('该目录下暂无文件') + '</td></tr>') +
      '</tbody></table></div></div>';
    bindCloud(el);
  }

  function cloudRow(f) {
    return '<tr>' +
      '<td><div style="font-weight:700">' + esc(f.name) + '</div>' +
      '<div class="tiny faint">' + esc(f.ext) + ' · ' + esc(f.folder) + '</div></td>' +
      '<td>' + Z.chip(f.cat, f.cat === '视频' ? 'brand' : 'gray') + '</td>' +
      '<td class="num">' + esc(f.size) + '</td>' +
      '<td>' + esc(f.owner) + '</td>' +
      '<td class="num muted">' + esc(f.date) + '</td>' +
      '<td>' + scopeChip(f.scope, []) + '</td>' +
      '<td>' + (f.platformSynced ? '<span class="chip ok">已同步</span>' : '<span class="chip warn">未同步</span>') + '</td>' +
      '<td><div class="row" style="gap:5px;flex-wrap:wrap">' +
      (f.platformSynced ? '' : '<button class="btn sm" data-cf="sync" data-id="' + f.id + '">同步</button>') +
      '<button class="btn sm" data-cf="perm" data-id="' + f.id + '">权限</button>' +
      '<button class="btn sm" data-cf="dl" data-id="' + f.id + '">下载</button>' +
      '<button class="btn sm ghost" style="color:var(--bad)" data-cf="del" data-id="' + f.id + '">删除</button></div></td>' +
      '</tr>';
  }

  function bindCloud(el) {
    $$('#cfFolder button', el).forEach(function (b) {
      b.addEventListener('click', function () { cloudState.folder = b.getAttribute('data-folder'); renderCloud(el); });
    });
    $('#cfQ', el).addEventListener('input', function () { cloudState.q = this.value.trim(); renderCloud(el); });
    $$('[data-q=cf-upload]', el).forEach(function (b) {
      b.addEventListener('click', function () { openCloudUpload(el); });
    });
    $$('[data-cf]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var op = b.getAttribute('data-cf'), id = b.getAttribute('data-id');
        var f = Z.db().cloudFiles.filter(function (x) { return x.id === id; })[0];
        if (!f) return;
        if (op === 'sync') { cfSync(f, b, el); }
        else if (op === 'perm') { cfPerm(f, el); }
        else if (op === 'dl') { cfDownload(f); }
        else if (op === 'del') { cfDel(f, el); }
      });
    });
  }

  function cfSync(f, btn, el) {
    btn.classList.add('busy'); btn.textContent = '同步中…';
    setTimeout(function () {
      f.platformSynced = true;
      Z.saveDB();
      Z.addLog('云端资源库', '同步教学平台', f.name + ' → 教学平台云盘');
      Z.toast(f.name + ' 已同步至教学平台云盘 / 资源库', 'ok');
      renderCloud(el);
    }, 900);
  }
  function cfPerm(f, el) {
    var scopes = ['校内公开', '课程班级', '指定教师', '私有'];
    var cur = f.grantTo || [];
    var m = Z.modal({
      title: '开放范围 · ' + f.name, cls: 'wide',
      body:
        '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">' + scopes.map(function (s) {
          return '<label style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:9px;padding:9px 12px;cursor:pointer;' +
            (f.scope === s ? 'border-color:var(--brand);background:var(--brand-soft-2)' : '') + '">' +
            '<input type="radio" name="cfScope" value="' + s + '"' + (f.scope === s ? ' checked' : '') + ' style="accent-color:var(--brand)">' +
            '<div><div style="font-weight:700;font-size:13.5px">' + s + '</div>' +
            '<div class="tiny faint">' + scopeDesc(s, Z.courseById('c1')) + '</div></div></label>';
        }).join('') + '</div>' +
        '<div id="cfTargetWrap"></div>',
      footer: '<button class="btn" data-cf2="c">取消</button><button class="btn primary" data-cf2="s">保存</button>'
    });
    var wrap = $('#cfTargetWrap', m.ov);
    function refresh() {
      var sel = $('input[name=cfScope]:checked', m.ov);
      var scope = sel ? sel.value : f.scope;
      wrap.innerHTML = permTargetsHtml(scope, scope === '指定教师' ? cur : []);
    }
    refresh();
    $$('input[name=cfScope]', m.ov).forEach(function (rd) { rd.addEventListener('change', refresh); });
    $('[data-cf2=c]', m.ov).addEventListener('click', m.close);
    $('[data-cf2=s]', m.ov).addEventListener('click', function () {
      var scope = $('input[name=cfScope]:checked', m.ov).value;
      if (scope === '指定教师') {
        var list = [];
        $$('#cfTargetWrap [data-cls]:checked', m.ov).forEach(function (cb) { list.push(cb.getAttribute('data-cls')); });
        if (!list.length) { Z.toast('请至少选择一位授权教师', 'warn'); return; }
        f.grantTo = list;
      } else { f.grantTo = []; }
      f.scope = scope;
      Z.saveDB();
      Z.addLog('云端资源库', '修改权限', f.name + ' 开放范围：' + scope);
      Z.toast('开放范围已更新', 'ok');
      m.close();
      renderCloud(el);
    });
  }
  function cfDownload(f) {
    var lines = '智慧课堂 · 云端资源库下载\n文件：' + f.name + '\n分类：' + f.cat + ' · 大小：' + f.size + '\n上传人：' + f.owner + '\n同步链接：https://zhkt.local/cloud/' + f.id;
    Z.downloadText(f.name.replace(/\.[^.]+$/, '') + '_下载清单.txt', lines);
    Z.toast('已生成下载清单', 'ok');
  }
  function cfDel(f, el) {
    Z.confirm({
      title: '删除文件', okTxt: '删除',
      body: '确定从云端资源库删除文件《' + esc(f.name) + '》吗？',
      onOk: function () {
        var d = Z.db();
        d.cloudFiles = d.cloudFiles.filter(function (x) { return x.id !== f.id; });
        Z.saveDB();
        Z.addLog('云端资源库', '删除文件', f.name);
        Z.toast('文件已删除', 'ok');
        renderCloud(el);
      }
    });
  }
  function openCloudUpload(el) {
    var cfPick = { name: '', size: 0 };
    var m = Z.modal({
      title: '上传文件到云端资源库（支持本地文件选择）',
      body:
        '<div class="form-grid">' +
        '<div class="field full"><label>文件（从本机选择）</label>' +
        '<div class="row" style="gap:8px">' +
        '<input type="file" id="cfFileInput" class="hide">' +
        '<button class="btn" data-cu="pick">选择本地文件…</button>' +
        '<span class="muted" id="cfFileHint" style="font-size:12px;align-self:center">未选择（可手动填写名称上传）</span>' +
        '</div></div>' +
        '<div class="field full"><label>文件名称<span class="req">*</span></label><input class="inp" id="cfName" placeholder="如：第9讲课件.pptx"></div>' +
        '<div class="field"><label>文件分类</label><select class="sel" id="cfCat"><option>课件</option><option>教案</option><option>题库</option><option>视频</option><option>资料</option><option>归档</option></select></div>' +
        '<div class="field"><label>目标目录</label><select class="sel" id="cfFolderSel">' + Z.db().cloudFolders.map(function (f) { return '<option' + (f === cloudState.folder ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>大小（MB，未选择文件时可填）</label><input class="inp" id="cfSize" type="number" value="5" min="1"></div>' +
        '<div class="field"><label>开放范围</label><select class="sel" id="cfScopeSel"><option>课程班级</option><option>校内公开</option><option>指定教师</option><option>私有</option></select></div>' +
        '</div>',
      footer: '<button class="btn" data-cu="c">取消</button><button class="btn primary" data-cu="s">上传</button>'
    });
    var fileInp = $('#cfFileInput', m.ov);
    $('[data-cu=pick]', m.ov).addEventListener('click', function () { fileInp.click(); });
    fileInp.addEventListener('change', function () {
      var f = fileInp.files && fileInp.files[0];
      if (f) {
        cfPick.name = f.name;
        cfPick.size = f.size;
        $('#cfFileHint', m.ov).textContent = f.name + '（' + fmtBytes(f.size) + '）';
        $('#cfName', m.ov).value = f.name;
      }
    });
    $('[data-cu=c]', m.ov).addEventListener('click', m.close);
    $('[data-cu=s]', m.ov).addEventListener('click', function () {
      var n = $('#cfName', m.ov).value.trim();
      if (!n) { Z.toast('请填写文件名', 'warn'); return; }
      var d = Z.db();
      var ext = (n.split('.').pop() || 'FILE').toUpperCase();
      var sizeTxt = cfPick.size ? fmtBytes(cfPick.size) : $('#cfSize', m.ov).value + ' MB';
      d.cloudFiles.unshift({
        id: Z.uid('f'), name: n, ext: ext, cat: $('#cfCat', m.ov).value,
        size: sizeTxt, date: Z.todayStr(),
        owner: (Z.session() || {}).name || '管理员',
        folder: $('#cfFolderSel', m.ov).value,
        scope: $('#cfScopeSel', m.ov).value, platformSynced: false
      });
      Z.saveDB();
      Z.addLog('云端资源库', '上传文件', n + (cfPick.name ? '（源文件 ' + cfPick.name + '）' : ''));
      m.close();
      Z.toast('文件上传成功', 'ok');
      renderCloud(el);
    });
  }

  Z.register('resources', { render: renderResources });
  Z.register('cloud', { render: renderCloud });
})(window);
