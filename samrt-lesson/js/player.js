/* ============================================================
   智慧课堂 — 课堂视频播放器组件（课堂实录模拟播放）
   纯前端模拟：进度推进 + 课件按时间切换 + 播放/暂停/倍速
   ============================================================ */
(function (global) {
  'use strict';
  var $ = Z.$, $$ = Z.$$, esc = Z.esc;

  var seq = 0;
  var players = {};   // key -> {root, st, timers}

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return h > 0 ? h + ':' + p(m) + ':' + p(s) : m + ':' + p(s);
  }

  function renderSlide(inst) {
    var slides = inst.slides;
    if (!slides || !slides.length) return;
    var idx = inst.idx;
    var s = slides[idx];
    if (inst.slideEl) {
      inst.slideEl.innerHTML =
        '<div style="color:rgba(255,255,255,.55);font-size:11px;letter-spacing:2px;margin-bottom:10px">课件演示 · ' + (idx + 1) + ' / ' + slides.length + '</div>' +
        '<div class="slide-title">' + esc(s.title) + '</div>' +
        (s.sub ? '<div class="slide-sub">' + s.sub.map(function (x) { return esc(x); }).join('　·　') + '</div>' : '') +
        (s.items ? s.items.map(function (x, i) {
          return '<div class="slide-item"><span class="n">' + (i < 9 ? '0' : '') + (i + 1) + '</span><span>' + esc(x) + '</span></div>';
        }).join('') : '');
    }
    if (inst.dotsEl) {
      inst.dotsEl.innerHTML = slides.map(function (x, i) {
        return '<i class="' + (i === idx ? 'on' : '') + '"></i>';
      }).join('');
    }
  }

  function tick() {
    Object.keys(players).forEach(function (k) {
      var inst = players[k];
      if (!inst.root || !document.body.contains(inst.root)) {
        clearInterval(inst.timer);
        delete players[k];
        return;
      }
      if (!inst.st.playing) return;
      inst.st.t += 0.3 * inst.st.rate;
      if (inst.st.t >= inst.st.dur) {
        inst.st.t = 0;
        inst.st.playing = false;
        if (inst.btn) inst.btn.textContent = '重新播放';
      }
      updateUI(inst);
    });
  }
  setInterval(tick, 300);

  function updateUI(inst) {
    var st = inst.st;
    var idx = Math.min(st.slides.length - 1, Math.max(0, Math.floor(st.t / st.dur * st.slides.length)));
    if (idx !== inst.idx) { inst.idx = idx; renderSlide(inst); }
    var pct = st.dur ? st.t / st.dur * 100 : 0;
    if (inst.fillEl) inst.fillEl.style.width = pct + '%';
    if (inst.timeEl) inst.timeEl.textContent = fmt(st.t) + ' / ' + fmt(st.dur);
  }

  /**
   * opts: { slides:[{title,sub:[],items:[]}], durSec, badge, watermark }
   * return { html, mount(host) }
   */
  function create(opts) {
    var key = 'pl' + (++seq);
    var html =
      '<div class="player-frame" id="' + key + '">' +
      '<div class="screen">' +
      '<div class="bg"><div class="blob" style="width:300px;height:300px;right:-80px;top:-80px"></div>' +
      '<div class="blob" style="width:200px;height:200px;left:-60px;bottom:-60px"></div>' +
      '<div class="blob" style="width:46px;height:46px;left:30%;top:18%"></div></div>' +
      '<div class="rec"><span class="rd"></span>' + esc(opts.badge || '课堂实录') + ' · 智慧课堂</div>' +
      (opts.watermark ? '<div class="wat">' + esc(opts.watermark) + '</div>' : '') +
      '<div class="glass" data-slide></div>' +
      '<div class="cp" data-dots></div>' +
      '</div>' +
      '<div class="player-c">' +
      '<button class="pbtn play" data-play>播放</button>' +
      '<button class="pbtn" data-speed>倍速 1.0</button>' +
      '<div class="tbar"><div class="track" data-track><div class="fill" data-fill><div class="knob"></div></div></div></div>' +
      '<span class="time" data-time>0:00 / ' + fmt(opts.durSec || 2700) + '</span>' +
      '<span style="font-size:11px;color:rgba(255,255,255,.5)">1080P</span>' +
      '</div></div>';

    return {
      html: html,
      mount: function (host) {
        host.innerHTML = html;
        var root = document.getElementById(key);
        var st = {
          slides: (opts.slides || []).slice(),
          dur: opts.durSec || 2700,
          t: 0, playing: false, rate: 1
        };
        var inst = {
          root: root, st: st, idx: 0,
          slideEl: $('[data-slide]', root),
          dotsEl: $('[data-dots]', root),
          fillEl: $('[data-fill]', root),
          timeEl: $('[data-time]', root),
          btn: $('[data-play]', root)
        };
        renderSlide(inst);
        updateUI(inst);
        // 清理旧实例
        if (players[key]) { clearInterval(players[key].timer); delete players[key]; }
        inst.timer = setInterval(function () {
          if (!document.body.contains(root)) { clearInterval(inst.timer); delete players[key]; }
        }, 4000);
        players[key] = inst;

        /* 交互 */
        var playBtn = $('[data-play]', root);
        playBtn.addEventListener('click', function () {
          if (inst.st.playing) { inst.st.playing = false; playBtn.textContent = '继续播放'; }
          else { inst.st.playing = true; playBtn.textContent = '暂停'; }
        });
        var spdBtn = $('[data-speed]', root);
        spdBtn.addEventListener('click', function () {
          var list = [1.0, 1.25, 1.5, 2.0];
          var i = list.indexOf(inst.st.rate);
          inst.st.rate = list[(i + 1) % list.length];
          spdBtn.textContent = '倍速 ' + inst.st.rate.toFixed(inst.st.rate === 1 ? 1 : 2).replace(/\.?0+$/, '');
        });
        var track = $('[data-track]', root);
        track.addEventListener('mousedown', function (e) { seekBy(e); });
        track.addEventListener('touchstart', function (e) { seekBy(e.touches[0]); });
        function seekBy(ev) {
          var r = track.getBoundingClientRect();
          var pct = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
          inst.st.t = pct * inst.st.dur;
          updateUI(inst);
        }
        return inst;
      }
    };
  }

  global.ZPlayer = { create: create };
})(window);
