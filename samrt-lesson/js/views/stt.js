/* ============================================================
   语音转写与翻译 —— 课堂语音实时转写（语义纠正）+ 11语种实时翻译
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  var run = { timer: null, idx: 0, running: false, corrected: 0, words: 0, t0: null, target: 'en', semFix: true, doneLines: 0, resId: 'r2', lines: [] };
  var allLangs = ZData.LANGS;

  var supLangTxt = allLangs.map(function (l) { return l.name; }).join('、');

  function langName(key) {
    var l = allLangs.filter(function (x) { return x.key === key; })[0];
    return l ? l.name : key;
  }
  function currentRes() {
    var rs = Z.db().resources.filter(function (x) { return x.id === run.resId; });
    return rs[0] || null;
  }
  function resOptions() {
    // 仅列出已具备可转写语音数据的课堂实录/回放/微课资源
    return Z.db().resources.filter(function (r) { return r.stt; });
  }
  function scriptLinesOf(resId) {
    var rs = Z.db().resources.filter(function (x) { return x.id === resId; })[0];
    var key = rs ? rs.stt : null;
    var map = ZData.RES_SCRIPTS || {};
    return (key && map[key]) || ZData.STT_SCRIPT;
  }

  function render(el) {
    var d = Z.db();
    resetAll();

    var ress = resOptions();
    if (!ress.some(function (r) { return r.id === run.resId; })) run.resId = ress.length ? ress[0].id : null;
    var res = currentRes();
    var resSelHtml = ress.map(function (r) {
      var c = Z.courseById(r.courseId);
      return '<option value="' + r.id + '"' + (r.id === run.resId ? ' selected' : '') + '>' +
        esc((c ? c.name : '') + ' · ' + r.kind + ' · ' + r.title) + '</option>';
    }).join('');

    el.innerHTML =
      '<div class="page-head"><div><h3>语音转写与翻译</h3>' +
      '<div class="ph-sub">课堂语音实时转文字（按上下文语义动态纠正）· 支持中英德法日俄西韩阿葡印等多语种实时翻译</div></div>' +
      '<div class="ph-tools">' +
      '<span class="chip ok" id="svcStatus"><span class="dot"></span>识别服务运行中</span>' +
      (ress.length ? '<select class="sel" id="sttRes" style="min-width:300px" title="选择要转写的课堂实录资源">' + resSelHtml + '</select>' : '') +
      '<button class="btn" data-q="stt-video">查看课堂实录</button>' +
      '<button class="btn" data-q="stt-dl">导出记录</button>' +
      '</div></div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">' +

      /* ---- 左侧：实时转写 ---- */
      '<div class="card" style="min-width:0">' +
      '<div class="card-h"><div class="t">实时转写<span class="s">课堂授课语音 → 文字</span></div>' +
      '<div style="display:flex;gap:10px;align-items:center">' +
      '<label style="display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--text-2);cursor:pointer">' +
      '<input type="checkbox" id="semFix" ' + (run.semFix ? 'checked' : '') + ' style="accent-color:var(--brand)"> 语义纠错</label>' +
      '<span class="chip info">普通话（zh-CN）· 自动识别</span></div></div>' +
      '<div class="card-b" style="padding:12px 14px">' +

      /* 转写对象（所选课堂实录资源） */
      '<div class="row mb10" style="gap:10px;flex-wrap:wrap;background:var(--brand-soft-2);border:1px solid var(--line-2);border-radius:9px;padding:8px 12px">' +
      '<span class="chip brand">转写对象</span>' +
      '<span id="resName" style="font-weight:700;font-size:13px">' + esc(res ? res.title : '暂无可转写资源') + '</span>' +
      '<span class="muted small" id="resMeta">' + (res ? esc((Z.courseById(res.courseId) || {}).name + ' · 主讲 ' + res.teacher + ' · 录制 ' + res.date + ' · 时长 ' + Z.fmtDur(res.durSec)) : '') + '</span>' +
      '</div>' +

      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">' +
      '<button class="btn primary" id="sttStart">开始实时转写</button>' +
      '<button class="btn" id="sttSave" disabled>保存转写记录</button>' +
      '<span style="margin-left:auto" class="small muted" id="sttState">就绪，等待开始…</span>' +
      '</div>' +

      '<div id="sttBody" style="height:352px;overflow-y:auto;background:var(--brand-soft-2);border:1px solid var(--line-2);border-radius:10px;padding:10px 12px">' +
      '<div class="tbl-empty" style="padding:80px 10px"><div class="em-t">课堂语音转写区</div>' +
      '<div style="font-size:12px;line-height:1.9;margin-top:6px">点击“开始实时转写”，系统将识别授课教师语音并实时输出文字。<br>开启“语义纠错”后，将结合上下文对同音误识自动纠正。</div></div>' +
      '</div>' +

      '<div class="row mt10" style="gap:18px;font-size:12.5px;color:var(--text-2);flex-wrap:wrap">' +
      '<span>本次转写时长：<b id="sttDur" style="color:var(--brand-deep)">00:00</b></span>' +
      '<span>输出字数：<b id="sttWords">0</b></span>' +
      '<span>语义纠正：<b id="sttFix" style="color:var(--ok)">0</b> 处</span>' +
      '<span>句子数：<b id="sttLines">0</b></span>' +
      '</div></div></div>' +

      /* ---- 右侧：实时翻译 ---- */
      '<div class="card" style="min-width:0">' +
      '<div class="card-h"><div class="t">实时翻译<span class="s">同步呈现所选语种译文</span></div>' +
      '<span class="chip brand">同传延迟 ≈ 0.9s</span></div>' +
      '<div class="card-b">' +
      '<div style="font-size:12.5px;color:var(--text-2);margin-bottom:8px">翻译目标语种（支持 ' + allLangs.length + ' 语种）</div>' +
      '<div id="langChips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">' +
      allLangs.map(function (l) {
        return '<button class="lang-chip' + (run.target === l.key ? ' on' : '') + '" data-lang="' + l.key + '">' + esc(l.name) + '</button>';
      }).join('') + '</div>' +
      '<div id="trBody" style="height:240px;overflow-y:auto;background:#fff;border:1px solid var(--line-2);border-radius:10px;padding:8px 12px">' +
      '<div class="tbl-empty" style="padding:60px 10px"><div class="em-t">译文实时呈现区</div>' +
      '<div style="font-size:12px;line-height:1.8;margin-top:6px">开始转写后，此处将以所选语种同步呈现授课译文。</div></div>' +
      '</div>' +
      '<div class="help-txt mt10">支持语种：' + supLangTxt + '。识别语言可随课堂自动检测，切换目标语种后历史句将即时重译。</div>' +
      '</div></div></div>' +

      /* ---- 转写记录 ---- */
      '<div class="card" style="margin-top:14px"><div class="card-h"><div class="t">转写记录<span class="s">已保存的课堂语音转写与译文记录</span></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>记录标题</th><th>课程</th><th>日期</th><th>时长</th><th>识别语种</th><th>句数</th><th>纠正次数</th><th style="width:200px">操作</th>' +
      '</tr></thead><tbody>' +
      (d.transcripts.length ? d.transcripts.map(function (t) {
        var c = Z.courseById(t.courseId);
        return '<tr>' +
          '<td style="font-weight:700">' + esc(t.title) + '</td>' +
          '<td>' + esc(c ? c.name : '-') + '</td>' +
          '<td class="num muted">' + esc(t.date) + '</td>' +
          '<td class="num">' + esc(t.dur) + '</td>' +
          '<td>' + Z.chip(t.srclang, 'brand') + '</td>' +
          '<td class="num">' + t.lines + '</td>' +
          '<td class="num" style="color:var(--ok);font-weight:700">' + t.corrected + '</td>' +
          '<td><div class="row" style="gap:5px">' +
          '<button class="btn sm" data-tr="view" data-id="' + t.id + '">查看</button>' +
          '<button class="btn sm" data-tr="dl" data-id="' + t.id + '">导出</button>' +
          '<button class="btn sm ghost" style="color:var(--bad)" data-tr="del" data-id="' + t.id + '">删除</button></div></td></tr>';
      }).join('') : '<tr><td colspan="8">' + Z.emptyBox('暂无转写记录，可开始一次实时转写并保存。') + '</td></tr>') +
      '</tbody></table></div></div>';

    bind(el);
  }

  function bind(el) {
    $('#semFix', el).addEventListener('change', function () {
      run.semFix = this.checked;
      Z.toast(run.semFix ? '已开启语义纠错（结合上下文纠正同音字词）' : '已关闭语义纠错', '');
    });
    var resSel = $('#sttRes', el);
    if (resSel) resSel.addEventListener('change', function () { chooseRes(this.value, el); });
    $$('#langChips .lang-chip', el).forEach(function (b) {
      b.addEventListener('click', function () {
        run.target = b.getAttribute('data-lang');
        $$('#langChips .lang-chip', el).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        rerenderTrans();
        Z.toast('译文语种切换为：' + langName(run.target), 'ok');
      });
    });
    $('#sttStart', el).addEventListener('click', function () { toggleLive(el); });
    $('#sttSave', el).addEventListener('click', function () { saveTranscript(el); });
    $$('[data-q=stt-dl]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Z.db();
        if (!d.transcripts.length) { Z.toast('暂无已保存记录', 'warn'); return; }
        exportTranscript(d.transcripts[0]);
      });
    });
    /* 查看所选课堂实录视频 */
    $$('[data-q=stt-video]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var res = currentRes();
        if (!res) { Z.toast('请先选择一段课堂实录资源', 'warn'); return; }
        var slides = (ZData.SLIDE_SETS[res.slides] || ZData.SLIDE_SETS.c1_gen);
        var c = Z.courseById(res.courseId);
        var m = Z.modal({ title: res.title, cls: 'xl', body: '<div id="sttVideoHost"></div>' });
        ZLesson.mount($('#sttVideoHost', m.ov), {
          fallback: { slides: slides, durSec: res.durSec, badge: '课堂实录', watermark: (c ? c.name : '') + ' · ' + res.teacher },
          autoStart: false
        });
      });
    });
    $$('[data-tr]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var op = b.getAttribute('data-tr'), id = b.getAttribute('data-id');
        var t = Z.db().transcripts.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        if (op === 'view') viewTranscript(t);
        else if (op === 'dl') exportTranscript(t);
        else if (op === 'del') delTranscript(t, el);
      });
    });
  }

  /* ---------- 实时转写核心 ---------- */
  function chooseRes(id, el) {
    if (run.running) { Z.toast('请先结束当前转写，再切换课堂实录资源', 'warn'); return; }
    run.resId = id;
    var res = currentRes();
    var nm = $('#resName'); if (nm) nm.textContent = res ? res.title : '暂无可转写资源';
    var mt = $('#resMeta'); if (mt) mt.textContent = res ? (Z.courseById(res.courseId) || {}).name + ' · 主讲 ' + res.teacher + ' · 录制 ' + res.date + ' · 时长 ' + Z.fmtDur(res.durSec) : '';
    var body = $('#sttBody'); if (body) { body.innerHTML = '<div class="tbl-empty" style="padding:80px 10px"><div class="em-t">课堂语音转写区</div><div style="font-size:12px;color:var(--text-3);margin-top:6px">已选择课堂实录：' + esc(res ? res.title : '') + '，点击“开始实时转写”将对该课堂语音进行转写。</div></div>'; }
    var trBody = $('#trBody'); if (trBody) { trBody.innerHTML = '<div class="tbl-empty" style="padding:50px 10px"><div class="em-t">译文实时呈现区</div><div style="font-size:12px;color:var(--text-3)">开始转写后将同步呈现译文</div></div>'; }
    $('#sttWords').textContent = '0'; $('#sttFix').textContent = '0'; $('#sttLines').textContent = '0';
    var st = $('#sttState'); if (st) st.innerHTML = '已选资源，等待开始…';
    var btn = $('#sttStart'); if (btn) { btn.textContent = '开始实时转写'; btn.classList.add('primary'); btn.classList.remove('danger-ghost'); }
    var sb = $('#sttSave'); if (sb) sb.disabled = true;
    run.doneLines = 0; run.idx = 0; run.corrected = 0; run.words = 0;
    Z.toast('转写对象已切换为：' + (res ? res.title : ''), 'ok');
  }
  function stopLive() {
    if (run.timer) { clearInterval(run.timer); run.timer = null; }
    if (run.clock) { clearInterval(run.clock); run.clock = null; }
  }
  function resetAll() {
    stopLive();
    run.running = false;
  }
  function toggleLive(el) {
    if (run.running) { endLive(el); return; }
    run.idx = 0; run.corrected = 0; run.words = 0; run.doneLines = 0; run.t0 = new Date();
    run.running = true;
    run.lines = scriptLinesOf(run.resId) || ZData.STT_SCRIPT;
    var body = $('#sttBody', el);
    if (body) {
      body.innerHTML = '';
    }
    var startBtn = $('#sttStart', el);
    if (startBtn) { startBtn.textContent = '结束本次转写'; startBtn.classList.remove('primary'); startBtn.classList.add('danger-ghost'); }
    var saveBtn = $('#sttSave', el);
    if (saveBtn) saveBtn.disabled = true;
    var st = $('#sttState', el);
    if (st) { st.innerHTML = '<span class="chip ok"><span class="dot"></span>实时转写中…</span>'; }
    // 时钟
    run.clock = setInterval(function () {
      var durEl = $('#sttDur');
      if (!durEl || !run.t0) return;
      var sec = Math.floor((new Date() - run.t0) / 1000);
      durEl.textContent = ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + sec % 60).slice(-2);
    }, 1000);

    run.timer = setInterval(function () {
      var body = $('#sttBody');
      var stEl = $('#sttState');
      if (!body) { stopLive(); return; }
      if (run.idx >= run.lines.length) {
        endLive(document.getElementById('view'));
        return;
      }
      appendLine(run.lines[run.idx], body);
      run.idx++;
    }, 2900);
  }

  function appendLine(item, body) {
    var empty = body.querySelector('.tbl-empty');
    if (empty) empty.remove();
    var fixInfo = item.fix && run.semFix;
    var displayText = item.zh;
    var fixNote = '';
    if (fixInfo) {
      displayText = item.zh;
      run.corrected++;
      fixNote = '<span class="fix">已按上下文语义纠正：误识“' + esc(fixInfo.wrong) + '”→“' + esc(fixInfo.right) + '”（' + esc(fixInfo.why) + '）</span>';
    }
    run.words += item.zh.replace(/[\s，。、：；]/g, '').length;
    run.doneLines++;
    var div = document.createElement('div');
    div.className = 'stt-line';
    div.innerHTML = '<div class="spk"><span class="tag">教师</span></div>' +
      '<div class="tx">' + esc(displayText) + fixNote + '</div>' +
      '<div class="tm">' + item.t + '</div>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    var w = $('#sttWords'); if (w) w.textContent = run.words;
    var f = $('#sttFix'); if (f) f.textContent = run.corrected;
    var lc = $('#sttLines'); if (lc) lc.textContent = run.doneLines;
    // 同步翻译
    setTimeout(function () {
      var trBody = $('#trBody');
      if (trBody) appendTrans(trBody, item, run.target);
    }, run.semFix && fixInfo ? 900 : 400);
  }

  function endLive(el) {
    if (!run.running) return;
    run.running = false;
    stopLive();
    var st = $('#sttState');
    if (st) st.innerHTML = run.doneLines ? '<span class="chip gray">本次转写已结束</span>' : '就绪，等待开始…';
    var btn = $('#sttStart');
    if (btn) { btn.textContent = '重新开始转写'; btn.classList.add('primary'); btn.classList.remove('danger-ghost'); }
    var saveBtn = $('#sttSave');
    if (saveBtn && run.doneLines) saveBtn.disabled = false;
  }

  /* ---------- 翻译区 ---------- */
  function appendTrans(trBody, item, key) {
    var empty = trBody.querySelector('.tbl-empty');
    if (empty) empty.remove();
    var tr = item.tr && item.tr[key];
    var no = trBody.querySelectorAll('.trans-line').length + 1;
    var div = document.createElement('div');
    div.className = 'trans-line';
    div.setAttribute('data-src', esc(item.zh));
    div.innerHTML = '<div class="ol">' + no + '</div>' +
      '<div style="flex:1"><div style="font-size:11.5px;color:var(--text-3)">[' + langName(key) + ' 译文]</div>' +
      '<div class="tx">' + esc(tr || '(该语种译文生成中)') + '</div></div>';
    trBody.appendChild(div);
    trBody.scrollTop = trBody.scrollHeight;
  }
  function rerenderTrans() {
    var trBody = $('#trBody');
    if (!trBody) return;
    var srcLines = (run.lines.length ? run.lines : scriptLinesOf(run.resId)).slice(0, run.doneLines);
    // 重译所有已到达的句子
    var list = [];
    var old = trBody.querySelectorAll('.trans-line');
    // 源文本行顺序 = run.doneLines 与实时行一一对应
    srcLines.forEach(function (it) {
      var tr = it.tr && it.tr[run.target];
      list.push('<div class="trans-line"><div class="ol"></div><div style="flex:1"><div style="font-size:11.5px;color:var(--text-3)">[' + langName(run.target) + ' 译文]</div>' +
        '<div class="tx">' + esc(tr || '(该语种译文生成中)') + '</div></div></div>');
    });
    trBody.innerHTML = list.length ? list.join('') : '<div class="tbl-empty" style="padding:50px 10px"><div class="em-t">译文实时呈现区</div><div style="font-size:12px;color:var(--text-3)">开始转写后将同步呈现译文</div></div>';
    var lines = trBody.querySelectorAll('.trans-line .ol');
    lines.forEach(function (o, i) { o.textContent = i + 1; });
  }

  /* ---------- 保存 / 导出 / 查看 / 删除 ---------- */
  function linesOfRecord(t) {
    var map = ZData.RES_SCRIPTS || {};
    var key = t && t.skey;
    return (key && map[key]) || ZData.STT_SCRIPT;
  }
  function saveTranscript(el) {
    if (!run.doneLines) { Z.toast('请先完成一次转写', 'warn'); return; }
    var dur = $('#sttDur').textContent;
    var secs = parseInt(dur.split(':')[0], 10) * 60 + parseInt(dur.split(':')[1], 10);
    var mins = Math.max(1, Math.round(secs / 60));
    var res = currentRes();
    var d = Z.db();
    var coreTitle = res ? res.title.replace(/[《》]/g, '') : 'COPD诊断与治疗';
    d.transcripts.unshift({
      id: Z.uid('t'), courseId: res ? res.courseId : 'c1',
      title: '《' + coreTitle + '》语音转写',
      date: Z.nowStr(), dur: (secs >= 60 ? Math.floor(secs / 60) + '分' : '') + (secs % 60) + '秒',
      srclang: '中文（普通话）', lines: run.doneLines, corrected: run.corrected,
      saved: true, skey: res ? res.stt : 'stt_copd', resId: run.resId
    });
    Z.saveDB();
    Z.addLog('语音转写', '转写保存', d.transcripts[0].title + '（' + d.transcripts[0].lines + ' 句）');
    Z.addNotice('ok', '转写已保存', '课堂语音转写记录已生成，可随时查看与导出。');
    var b = $('#sttSave', el);
    if (b) b.disabled = true;
    Z.toast('转写记录已保存', 'ok');
    render(el);
  }

  function viewTranscript(t) {
    var m = Z.modal({
      title: '转写记录详情', cls: 'wide',
      body:
        '<div class="card" style="padding:14px 16px;background:var(--brand-soft-2);margin-bottom:12px">' +
        '<div style="font-weight:800">' + esc(t.title) + '</div>' +
        '<div class="small muted mt6" style="display:flex;gap:16px;flex-wrap:wrap">' +
        '<span>保存时间：' + esc(t.date) + '</span><span>时长：' + esc(t.dur) + '</span>' +
        '<span>识别语种：' + esc(t.srclang) + '</span><span>句数：' + t.lines + '</span>' +
        '<span>语义纠正：' + t.corrected + ' 处</span></div></div>' +
        '<div style="font-weight:800;margin-bottom:6px">转写正文（节选）</div>' +
        linesOfRecord(t).map(function (s, i) {
          return '<div class="stt-line" style="border:none"><div class="spk"><span class="tag">教师</span></div>' +
            '<div class="tx">' + esc(s.zh) + (s.fix ? '<span class="fix">已纠正误识“' + esc(s.fix.wrong) + '”→“' + esc(s.fix.right) + '”</span>' : '') + '</div>' +
            '<div class="tm">' + s.t + '</div></div>';
        }).join('') +
        '<div class="help-txt mt10">完整转写正文可按时间轴与课堂实录逐句对齐，支持导出为 Word / TXT 归档。</div>'
    });
  }
  function exportTranscript(t) {
    var lines = ['智慧课堂 · 课堂语音转写记录', '标题：' + t.title, '保存时间：' + t.date + '｜时长：' + t.dur, '识别语种：' + t.srclang + '｜句数：' + t.lines + '｜语义纠正：' + t.corrected + ' 处', ''];
    linesOfRecord(t).slice(0, Math.max(2, t.lines || 2)).forEach(function (s) {
      lines.push('[' + s.t + '] ' + s.zh + (s.fix ? '（已纠正：' + s.fix.wrong + '→' + s.fix.right + '）' : ''));
      var en = s.tr && s.tr.en;
      if (en) lines.push('  [英语译文] ' + en);
    });
    Z.downloadText('转写记录_' + t.date.replace(/[ :]/g, '').slice(0, 8) + '.txt', lines.join('\n'));
    Z.toast('转写记录已导出（含英语译文）', 'ok');
  }
  function delTranscript(t, el) {
    Z.confirm({
      title: '删除记录', okTxt: '删除',
      body: '确定删除转写记录《' + esc(t.title) + '》吗？',
      onOk: function () {
        var d = Z.db();
        d.transcripts = d.transcripts.filter(function (x) { return x.id !== t.id; });
        Z.saveDB();
        Z.addLog('语音转写', '删除记录', t.title);
        Z.toast('记录已删除', 'ok');
        render(el);
      }
    });
  }

  Z.register('stt', { render: render, leave: resetAll });
})(window);
