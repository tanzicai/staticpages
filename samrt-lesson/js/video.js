/* ============================================================
   智慧课堂 — 课堂视频播放器（B站在线课堂视频）
   - 播放界面统一嵌入 B 站教师课堂实录（player.bilibili.com 官方外嵌）
   - 无本地视频通道；仅保留“课件画面”作为断网兜底
   - 字幕：播放器下方“AI 实时字幕条”（开/关 + 中/英切换）
     内置示例字幕按时间轴滚动演示“识别→字幕→翻译”链路，
     接入云端语音识别后按真实语音时间戳自动生成与翻译
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  /* B 站课堂视频（教师上课视频） */
  var BILI = {
    label: '教师课堂实录（B站在线）',
    bvid: 'BV1Hi4y1u7Zi',
    page: 1
  };
  function biliUrl() {
    return 'https://player.bilibili.com/player.html?bvid=' + BILI.bvid +
      '&page=' + BILI.page + '&high_quality=1&danmaku=0&autoplay=0';
  }
  global.__videoSrc = 'bili:' + BILI.bvid;

  /* ---------- 示例字幕轨（演示交互用，接入云端语音识别后替换为真实字幕） ---------- */
  function buildSampleCaps() {
    var src = ZData.STT_SCRIPT || [];
    var caps = [], t = 2, step = 8;
    src.slice(0, 6).forEach(function (line) {
      caps.push({ start: t, end: t + step - 0.5, zh: line.zh, en: (line.tr && line.tr.en) || '' });
      t += step + 1;
    });
    return caps;
  }
  var sampleCaps = buildSampleCaps();
  var demoTotal = sampleCaps.length ? sampleCaps[sampleCaps.length - 1].end : 0;

  function cueAt(t) {
    var hit = null;
    sampleCaps.forEach(function (c) { if (t >= c.start && t < c.end) hit = c; });
    return hit;
  }

  function mountLesson(host, opts) {
    opts = opts || {};
    var seq = 'lv' + Date.now().toString(36) + Math.floor(Math.random() * 999);

    var st = { mode: 'bili', capsOn: true, lang: 'zh', demoT: 0, clock: null, currentCue: null };

    host.innerHTML =
      '<div class="vbox">' +
      '<div class="vstage" id="' + seq + 'stage"></div>' +
      '<div class="capbar" id="' + seq + 'capbar">' +
      '<div class="cp-l" id="' + seq + 'cpmain">AI 字幕待开启…</div>' +
      '<div class="cp-s" id="' + seq + 'cpsub"></div>' +
      '<div class="cap-tag" id="' + seq + 'captag">AI 实时字幕</div>' +
      '</div>' +
      '<div class="vmeta">' +
      '<button class="chip tog on" id="' + seq + 'sbili" title="B站教师课堂实录（需联网）">B站课堂视频</button>' +
      '<button class="chip tog" id="' + seq + 'smock" title="无网络时的课件画面示例">课件画面</button>' +
      '<span style="width:1px;height:18px;background:var(--line);flex:none"></span>' +
      '<button class="chip tog on" id="' + seq + 'cap" title="字幕开关">字幕：开</button>' +
      '<select class="sel" id="' + seq + 'lang" style="width:auto;min-width:0;padding:3px 10px;font-size:12.5px">' +
      '<option value="zh">中文</option><option value="en">English</option></select>' +
      '<a class="bopen" id="' + seq + 'open" href="https://www.bilibili.com/video/BV1Hi4y1u7Zi" target="_blank" rel="noopener">在 B 站打开原视频</a>' +
      '<span class="faint" style="font-size:11.5px" id="' + seq + 'note">字幕为演示轨 · 接入云端语音识别后自动生成真实课堂字幕并翻译</span>' +
      '</div></div>';

    var stage = $('#' + seq + 'stage', host);
    var capBar = $('#' + seq + 'capbar', host);
    var capMain = $('#' + seq + 'cpmain', host);
    var capSub = $('#' + seq + 'cpsub', host);
    var capTag = $('#' + seq + 'captag', host);
    var capBtn = $('#' + seq + 'cap', host);
    var langSel = $('#' + seq + 'lang', host);
    var biliBtn = $('#' + seq + 'sbili', host), mockBtn = $('#' + seq + 'smock', host);
    var note = $('#' + seq + 'note', host);

    /* ---------- 字幕渲染（示例字幕按时间轴滚动） ---------- */
    function paintCue(cue) {
      st.currentCue = cue || null;
      if (!st.capsOn) return;
      if (!cue) { capMain.textContent = '…'; capSub.textContent = ''; return; }
      if (st.lang === 'zh') {
        capMain.textContent = cue.zh || '';
        capSub.textContent = (cue.en ? '[EN] ' + cue.en : '');
      } else {
        capMain.textContent = cue.en || cue.zh || '';
        capSub.textContent = (cue.zh ? '[中文] ' + cue.zh : '');
      }
    }
    function startDemoClock() {
      stopDemoClock();
      st.demoT = 0;
      st.clock = setInterval(function () {
        if (!st.capsOn) return;
        st.demoT += 0.25;
        if (demoTotal && st.demoT >= demoTotal) st.demoT = 0;
        paintCue(cueAt(st.demoT));
      }, 250);
      paintCue(cueAt(0));
    }
    function stopDemoClock() {
      if (st.clock) { clearInterval(st.clock); st.clock = null; }
    }
    function refreshCaption() {
      if (!st.capsOn) {
        stopDemoClock();
        capMain.textContent = ''; capSub.textContent = '';
        capBar.style.display = 'none';
        return;
      }
      capBar.style.display = '';
      if (!st.clock) startDemoClock();
    }

    /* ---------- 字幕开关 / 语种 ---------- */
    capBtn.addEventListener('click', function () {
      st.capsOn = !st.capsOn;
      capBtn.textContent = '字幕：' + (st.capsOn ? '开' : '关');
      capBtn.classList.toggle('on', st.capsOn);
      langSel.style.display = st.capsOn ? '' : 'none';
      refreshCaption();
    });
    langSel.addEventListener('change', function () {
      st.lang = this.value;
      if (st.capsOn) paintCue(st.currentCue || cueAt(st.demoT));
    });

    /* ---------- 模式：B站在线 ---------- */
    function inFrame() { try { return global.self !== global.top; } catch (e) { return true; } }
    function setBili() {
      st.mode = 'bili';
      stage.innerHTML = '';
      var ifr = document.createElement('iframe');
      ifr.className = 'vframe';
      ifr.src = biliUrl();
      ifr.setAttribute('allowfullscreen', 'true');
      ifr.setAttribute('scrolling', 'no');
      ifr.setAttribute('frameborder', '0');
      ifr.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
      stage.appendChild(ifr);
      var hint = document.createElement('div');
      hint.className = 'vnet';
      var embWarn = inFrame() ?
        '（当前运行在受限预览中：预览窗口的安全策略可能禁止加载外部视频站点。<br>' +
        '若下方一直无画面，请用浏览器<b>直接打开</b>演示文件夹中的 <b>index.html</b>，视频即可正常播放；或点右上“在 B 站打开原视频”。）' : '';
      hint.innerHTML = '正在连接 B 站课堂视频（BV1Hi4y1u7Zi）…<br>' +
        '<span class="vn-sub">如现场无网络或长时间无画面，请点下方“课件画面”兜底；' + embWarn + '</span>';
      stage.appendChild(hint);
      ifr.addEventListener('load', function () {
        global.__videoFound = true;
        var h = stage.querySelector('.vnet');
        if (h) h.remove();
      });
      paintChips('bili');
      capTag.textContent = 'AI 字幕 · 演示轨（识别服务就绪）';
      refreshCaption();
    }

    /* ---------- 模式：课件画面示例（断网兜底） ---------- */
    function setMock() {
      st.mode = 'mock';
      stage.innerHTML = '';
      var sl = opts.fallback && opts.fallback.slides;
      if (!sl) { stage.innerHTML = '<div class="vhint">无课件示例画面可用，请切换回“B站课堂视频”。</div>'; paintChips('mock'); capTag.textContent = 'AI 字幕 · 课件模式'; refreshCaption(); return; }
      var p = ZPlayer.create({
        slides: sl,
        durSec: (opts.fallback && opts.fallback.durSec) || 2700,
        badge: (opts.fallback && opts.fallback.badge) || '课堂实录',
        watermark: (opts.fallback && opts.fallback.watermark) || ''
      });
      p.mount(stage);
      paintChips('mock');
      capTag.textContent = 'AI 字幕 · 课件模式';
      refreshCaption();
    }

    /* ---------- 源选择 ---------- */
    function paintChips(mode) {
      biliBtn.classList.toggle('on', mode === 'bili');
      mockBtn.classList.toggle('on', mode === 'mock');
    }
    biliBtn.addEventListener('click', function () { stopDemoClock(); setBili(); });
    mockBtn.addEventListener('click', function () { stopDemoClock(); setMock(); });

    /* ---------- 启动（默认 B站课堂视频） ---------- */
    note.textContent = '当前播放：' + BILI.label + '（BV1Hi4y1u7Zi）｜字幕为演示轨，接入云端语音识别后自动生成真实课堂字幕并翻译';
    global.__videoFound = true;   // B站在线视频源已就绪
    langSel.style.display = st.capsOn ? '' : 'none';
    setBili();

    return {
      setCaptionLang: function (l) { st.lang = l; if (langSel) langSel.value = l; },
      setCaptions: function (on) {
        st.capsOn = on;
        if (capBtn) { capBtn.textContent = '字幕：' + (on ? '开' : '关'); capBtn.classList.toggle('on', on); }
        refreshCaption();
      },
      destroy: function () { stopDemoClock(); }
    };
  }

  global.ZLesson = { mount: mountLesson, bili: BILI };
})(window);
