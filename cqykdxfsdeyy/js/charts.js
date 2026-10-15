/* ================================================================
   轻量图表库（Canvas 手写，无第三方依赖）
   提供：lineChart / barChart / hbarChart / donutChart / radarChart / gaugeChart
   ================================================================ */
(function (global) {
  'use strict';

  var DPR = Math.max(1, window.devicePixelRatio || 1);
  var redraws = [];

  /* 同一个容器只保留一个重绘函数，避免重复注册造成内存增长 */
  function registerRedraw(el, fn) {
    for (var i = 0; i < redraws.length; i++) {
      if (redraws[i].el === el) { redraws[i].fn = fn; return; }
    }
    redraws.push({ el: el, fn: fn });
  }
  function flush() { redraws = []; }
  function redrawAll() {
    redraws.slice().forEach(function (r) {
      if (!r.el || !document.body.contains(r.el)) return;
      try { r.fn(); } catch (e) { /* noop */ }
    });
  }

  function isDark(el) {
    return !!el.closest('[data-theme="dark"]');
  }

  function themeOf(el) {
    var d = isDark(el);
    return d ? {
      dark: true,
      text: '#8fb0dc', strong: '#e8f3ff',
      grid: 'rgba(120,170,255,.13)', axis: 'rgba(120,170,255,.28)'
    } : {
      dark: false,
      text: '#64748b', strong: '#1a2942',
      grid: 'rgba(20,45,90,.08)', axis: 'rgba(20,45,90,.16)'
    };
  }

  var PALETTE = ['#2f9bff', '#12b5b0', '#7c5cff', '#f5a524', '#e5484d', '#17a673', '#ff8fb1', '#46b3ff'];

  function mount(el, height) {
    el.innerHTML = '';
    var w = Math.max(180, el.clientWidth || 420);
    var h = height || el.clientHeight || 220;
    var cv = document.createElement('canvas');
    cv.width = Math.round(w * DPR);
    cv.height = Math.round(h * DPR);
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    cv.style.display = 'block';
    el.appendChild(cv);
    var ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  function animate(dur, step, done) {
    var t0 = performance.now();
    function frame(t) {
      var p = Math.min(1, (t - t0) / dur);
      p = 1 - Math.pow(1 - p, 3);
      step(p);
      if (p < 1) requestAnimationFrame(frame);
      else if (done) done();
    }
    requestAnimationFrame(frame);
  }

  function niceMax(v) {
    if (!v || v <= 0) return 10;
    var exp = Math.floor(Math.log10(v));
    var base = Math.pow(10, exp);
    var n = v / base, m;
    if (n <= 1) m = 1; else if (n <= 1.5) m = 1.5; else if (n <= 2) m = 2;
    else if (n <= 2.5) m = 2.5; else if (n <= 3) m = 3; else if (n <= 4) m = 4;
    else if (n <= 5) m = 5; else if (n <= 8) m = 8; else m = 10;
    return m * base;
  }

  function fmt(v) {
    if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1) + '万';
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(1);
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------------- 折线 / 面积图 ---------------- */
  function lineChart(el, opts) {
    opts = opts || {};
    var draw = function () {
      var m = mount(el, opts.height || 220);
      var ctx = m.ctx, w = m.w, h = m.h, th = themeOf(el);
      var series = opts.series || [];
      var labels = opts.labels || [];
      var spark = !!opts.spark;
      var showLegend = !spark && opts.legend !== false && series.length > 1;
      var pad = spark ? { l: 4, r: 4, t: 6, b: 6 } : { l: 46, r: 16, t: showLegend ? 30 : 20, b: 26 };
      var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      var all = [];
      series.forEach(function (s) { s.data.forEach(function (v) { all.push(v); }); });
      var maxV = opts.yMax != null ? opts.yMax
        : (opts.yMin != null && opts.yMin > 0
          ? opts.yMin + niceMax((Math.max.apply(null, all.concat([0])) - opts.yMin) * 1.25)
          : niceMax(Math.max.apply(null, all.concat([0])) * 1.08));
      var minV = opts.yMin != null ? opts.yMin : 0;
      var ticks = opts.ticks || 4;
      var xAt = function (i) { return pad.l + (labels.length <= 1 ? iw / 2 : (iw * i) / (labels.length - 1)); };
      var yAt = function (v) { return pad.t + ih - ((v - minV) / (maxV - minV || 1)) * ih; };

      function drawGrid() {
        ctx.strokeStyle = th.grid; ctx.lineWidth = 1; ctx.fillStyle = th.text;
        ctx.font = '11px "PingFang SC", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (var i = 0; i <= ticks; i++) {
          var v = minV + ((maxV - minV) * i) / ticks, y = yAt(v);
          ctx.beginPath(); ctx.moveTo(pad.l, y + .5); ctx.lineTo(pad.l + iw, y + .5); ctx.stroke();
          ctx.fillText(fmt(Math.round(v * 10) / 10), pad.l - 8, y);
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        var step = Math.ceil(labels.length / (w < 420 ? 4 : 8));
        labels.forEach(function (lb, i) {
          if (i % step !== 0 && i !== labels.length - 1) return;
          ctx.fillText(lb, xAt(i), pad.t + ih + 8);
        });
      }

      function drawLegend() {
        if (!showLegend) return;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '11.5px "PingFang SC", sans-serif';
        var lx = pad.l;
        series.forEach(function (s, i) {
          var color = s.color || PALETTE[i % PALETTE.length];
          ctx.fillStyle = color; roundRect(ctx, lx, 13, 9, 9, 3); ctx.fill();
          ctx.fillStyle = th.text; ctx.fillText(s.name || ('系列' + (i + 1)), lx + 14, 18);
          lx += ctx.measureText(s.name || '').width + 34;
        });
      }

      function drawSeries(s, si, p) {
        var color = s.color || PALETTE[si % PALETTE.length];
        var pts = s.data.map(function (v, i) { return { x: xAt(i), y: yAt(v) }; });
        var smooth = opts.smooth !== false && pts.length > 2;
        var pathFn = function (p) {
          ctx.beginPath();
          if (!smooth) {
            pts.forEach(function (pt, i) { if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
          } else {
            ctx.moveTo(pts[0].x, pts[0].y);
            for (var i = 0; i < pts.length - 1; i++) {
              var p0 = pts[i], p1 = pts[i + 1];
              var cx = (p0.x + p1.x) / 2;
              ctx.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y);
            }
          }
        };
        var base = pad.t + ih;
          var scaled = pts.map(function (pt) { return { x: pt.x, y: base - (base - pt.y) * p }; });
          var orig = pts;
          pts = scaled;
          if (s.area !== false) {
            pathFn();
            ctx.lineTo(scaled[scaled.length - 1].x, base);
            ctx.lineTo(scaled[0].x, base);
            ctx.closePath();
            var g = ctx.createLinearGradient(0, pad.t, 0, base);
            g.addColorStop(0, hexA(color, th.dark ? .42 : .3));
            g.addColorStop(1, hexA(color, 0));
            ctx.fillStyle = g; ctx.fill();
          }
          pathFn();
          pts = orig;
          ctx.strokeStyle = color; ctx.lineWidth = s.width || 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          if (th.dark) { ctx.shadowColor = hexA(color, .9); ctx.shadowBlur = 8; }
          ctx.stroke(); ctx.shadowBlur = 0;
          if (p === 1 && opts.dots !== false && !spark) {
            pts.forEach(function (pt) {
              ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
              ctx.fillStyle = th.dark ? '#08152b' : '#fff'; ctx.fill();
              ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
            });
          }
      }

      function frame(p) {
        ctx.clearRect(0, 0, w, h);
        if (!spark) drawGrid();
        series.forEach(function (s, si) { drawSeries(s, si, p); });
        drawLegend();
      }
      animate(700, frame);
    };
    draw();
    registerRedraw(el, draw);
  }

  /* ---------------- 柱状图（纵向，支持多系列） ---------------- */
  function barChart(el, opts) {
    opts = opts || {};
    var draw = function () {
      var m = mount(el, opts.height || 220);
      var ctx = m.ctx, w = m.w, h = m.h, th = themeOf(el);
      var labels = opts.labels || [];
      var series = opts.series || (opts.data ? [{ data: opts.data, color: opts.color }] : []);
      var pad = { l: 46, r: 14, t: opts.legend && series.length > 1 ? 26 : 14, b: 28 };
      var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      var all = [];
      series.forEach(function (s) { s.data.forEach(function (v) { all.push(v); }); });
      var maxV = opts.yMax != null ? opts.yMax : niceMax(Math.max.apply(null, all.concat([0])) * 1.12);
      var ticks = opts.ticks || 4;
      var gw = iw / labels.length;
      var bw = Math.min(opts.barWidth || 26, (gw * .62) / series.length);
      var yAt = function (v) { return pad.t + ih - (v / maxV) * ih; };

      function grid() {
        ctx.strokeStyle = th.grid; ctx.fillStyle = th.text;
        ctx.font = '11px "PingFang SC", sans-serif'; ctx.lineWidth = 1;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (var i = 0; i <= ticks; i++) {
          var v = (maxV * i) / ticks, y = yAt(v);
          ctx.beginPath(); ctx.moveTo(pad.l, y + .5); ctx.lineTo(pad.l + iw, y + .5); ctx.stroke();
          ctx.fillText(fmt(Math.round(v * 10) / 10), pad.l - 8, y);
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        labels.forEach(function (lb, i) {
          var x = pad.l + gw * i + gw / 2;
          ctx.fillText(lb, x, pad.t + ih + 8);
        });
      }

      function legend() {
        if (!opts.legend || series.length <= 1) return;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '11.5px "PingFang SC", sans-serif';
        var lx = pad.l;
        series.forEach(function (s, i) {
          var color = s.color || PALETTE[i % PALETTE.length];
          ctx.fillStyle = color; roundRect(ctx, lx, 8, 9, 9, 3); ctx.fill();
          ctx.fillStyle = th.text; ctx.fillText(s.name || '', lx + 14, 13);
          lx += ctx.measureText(s.name || '').width + 30;
        });
      }

      animate(650, function (p) {
        ctx.clearRect(0, 0, w, h);
        grid();
        series.forEach(function (s, si) {
          s.data.forEach(function (v, i) {
            var x = pad.l + gw * i + gw / 2 - (bw * series.length) / 2 + bw * si;
            var bh = (v / maxV) * ih * p;
            var color = s.color || PALETTE[si % PALETTE.length];
            if (series.length === 1 && opts.colors) color = opts.colors[i % opts.colors.length];
            var g = ctx.createLinearGradient(0, yAt(v), 0, pad.t + ih);
            g.addColorStop(0, color);
            g.addColorStop(1, hexA(color, th.dark ? .25 : .45));
            ctx.fillStyle = g;
            roundRect(ctx, x, pad.t + ih - bh, bw, bh, 4);
            ctx.fill();
            if (opts.valueLabels && p === 1) {
              ctx.fillStyle = th.strong; ctx.font = '11px "PingFang SC", sans-serif';
              ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
              ctx.fillText(fmt(v), x + bw / 2, pad.t + ih - bh - 4);
            }
          });
        });
        legend();
      });
    };
    draw();
    registerRedraw(el, draw);
  }

  /* ---------------- 横向条形排行 ---------------- */
  function hbarChart(el, opts) {
    opts = opts || {};
    var draw = function () {
      var items = (opts.items || []).slice();
      var rowH = opts.rowHeight || 30;
      var m = mount(el, opts.height || items.length * rowH + 16);
      var ctx = m.ctx, w = m.w, h = m.h, th = themeOf(el);
      var labelW = opts.labelWidth || 96;
      var valW = opts.valueWidth || 56;
      var pad = { l: 12, r: 8, t: 8, b: 8 };
      var iw = w - pad.l - pad.r - labelW - valW;
      var maxV = opts.maxV || niceMax(Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1])) * 1.05);
      animate(700, function (p) {
        ctx.clearRect(0, 0, w, h);
        items.forEach(function (it, i) {
          var y = pad.t + i * rowH;
          var bh = Math.min(12, rowH - 12);
          ctx.fillStyle = th.text; ctx.font = '12px "PingFang SC", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(it.name, pad.l, y + rowH / 2);
          var bx = pad.l + labelW;
          ctx.fillStyle = th.dark ? 'rgba(120,170,255,.12)' : 'rgba(20,45,90,.06)';
          roundRect(ctx, bx, y + (rowH - bh) / 2, iw, bh, bh / 2); ctx.fill();
          var bw = (it.value / maxV) * iw * p;
          var color = it.color || PALETTE[i % PALETTE.length];
          var g = ctx.createLinearGradient(bx, 0, bx + iw, 0);
          g.addColorStop(0, hexA(color, .75)); g.addColorStop(1, color);
          ctx.fillStyle = g;
          roundRect(ctx, bx, y + (rowH - bh) / 2, Math.max(bw, bh), bh, bh / 2); ctx.fill();
          ctx.fillStyle = th.strong; ctx.textAlign = 'right';
          ctx.font = '12px "PingFang SC", sans-serif';
          ctx.fillText(fmt(it.value) + (opts.unit || ''), w - pad.r, y + rowH / 2);
        });
      });
    };
    draw();
    registerRedraw(el, draw);
  }

  /* ---------------- 环形图 ---------------- */
  function donutChart(el, opts) {
    opts = opts || {};
    var draw = function () {
      var m = mount(el, opts.height || 220);
      var ctx = m.ctx, w = m.w, h = m.h, th = themeOf(el);
      var data = opts.data || [];
      var total = data.reduce(function (a, b) { return a + b.value; }, 0) || 1;
      var n = data.length;
      var narrow = w < 340;
      var legendSpace = narrow ? n * 19 + 6 : 0;
      var cx, cy, R, r;
      if (narrow) { cx = w / 2; cy = (h - legendSpace) / 2 + 4; R = Math.min(w * .30, (h - legendSpace) * .40); }
      else { cx = w * .32; cy = h / 2; R = Math.min(w * .26, h * .42); }
      r = R * .62;
      var legendX = narrow ? 6 : w * .62;
      var legendY = narrow ? h - legendSpace + 12 : Math.max(20, cy - n * 11);
      var rowGap = narrow ? 19 : 22;
      var lw = narrow ? w : w - legendX;

      animate(760, function (p) {
        ctx.clearRect(0, 0, w, h);
        var a0 = -Math.PI / 2;
        data.forEach(function (d, i) {
          var ang = (d.value / total) * Math.PI * 2 * p;
          ctx.beginPath();
          ctx.arc(cx, cy, R, a0, a0 + ang);
          ctx.arc(cx, cy, r, a0 + ang, a0, true);
          ctx.closePath();
          ctx.fillStyle = d.color || PALETTE[i % PALETTE.length];
          if (th.dark) { ctx.shadowColor = hexA(d.color || PALETTE[i % PALETTE.length], .8); ctx.shadowBlur = 10; }
          ctx.fill(); ctx.shadowBlur = 0;
          a0 += ang;
        });
        ctx.fillStyle = th.strong;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '700 20px "PingFang SC", sans-serif';
        ctx.fillText(opts.centerValue != null ? String(opts.centerValue) : fmt(total), cx, cy - 7);
        ctx.font = '11px "PingFang SC", sans-serif'; ctx.fillStyle = th.text;
        ctx.fillText(opts.centerLabel || '合计', cx, cy + 13);

        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        data.forEach(function (d, i) {
          var y = legendY + i * rowGap;
          var color = d.color || PALETTE[i % PALETTE.length];
          ctx.fillStyle = color; roundRect(ctx, legendX, y - 4, 9, 9, 3); ctx.fill();
          ctx.fillStyle = th.text; ctx.font = '12px "PingFang SC", sans-serif';
          var txt = d.name;
          ctx.fillText(txt, legendX + 14, y);
          ctx.fillStyle = th.strong;
          ctx.textAlign = 'right';
          ctx.font = '600 12px "PingFang SC", sans-serif';
          ctx.fillText(fmt(d.value) + (opts.unit ? ' ' + opts.unit : '') + ' · ' + ((d.value / total) * 100).toFixed(1) + '%', legendX + lw - 8, y);
          ctx.textAlign = 'left';
        });
      });
    };
    draw();
    registerRedraw(el, draw);
  }

  /* ---------------- 雷达图 ---------------- */
  function radarChart(el, opts) {
    opts = opts || {};
    var draw = function () {
      var m = mount(el, opts.height || 260);
      var ctx = m.ctx, w = m.w, h = m.h, th = themeOf(el);
      var axes = opts.axes || [];
      var series = opts.series || [];
      var legendH = series.length > 1 ? 26 : 8;
      var cx = w / 2, cy = (h - legendH) / 2 + 4;
      var R = Math.min(w * .34, (h - legendH) * .40);
      var n = axes.length || 1;
      var maxV = opts.max != null ? opts.max : 100;
      var angle = function (i) { return -Math.PI / 2 + (Math.PI * 2 * i) / n; };
      var rings = 4;

      function poly(vals, R0) {
        ctx.beginPath();
        vals.forEach(function (v, i) {
          var a = angle(i), rr = (v / maxV) * R0;
          var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }

      animate(760, function (p) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = th.grid; ctx.lineWidth = 1;
        for (var rI = 1; rI <= rings; rI++) {
          poly(axes.map(function () { return (maxV * rI) / rings; }), R);
          ctx.stroke();
        }
        ctx.strokeStyle = th.axis;
        axes.forEach(function (t, i) {
          var a = angle(i);
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
        });
        ctx.fillStyle = th.text; ctx.font = '11.5px "PingFang SC", sans-serif';
        axes.forEach(function (t, i) {
          var a = angle(i);
          var x = cx + Math.cos(a) * (R + 20), y = cy + Math.sin(a) * (R + 16);
          ctx.textAlign = Math.abs(Math.cos(a)) < .25 ? 'center' : (Math.cos(a) > 0 ? 'left' : 'right');
          ctx.textBaseline = 'middle';
          ctx.fillText(t, x, y);
        });
        series.forEach(function (s, si) {
          var color = s.color || PALETTE[si % PALETTE.length];
          poly(s.data.map(function (v) { return v * p; }), R);
          ctx.fillStyle = hexA(color, th.dark ? .22 : .16); ctx.fill();
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          if (th.dark) { ctx.shadowColor = hexA(color, .9); ctx.shadowBlur = 8; }
          ctx.stroke(); ctx.shadowBlur = 0;
          s.data.forEach(function (v, i) {
            if (p < 1) return;
            var a = angle(i), rr = (v / maxV) * R;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
          });
        });
        if (series.length > 1 && p === 1) {
          var lx = Math.max(8, (w - series.length * 96) / 2);
          var ly = h - 10;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          series.forEach(function (s, i) {
            var color = s.color || PALETTE[i % PALETTE.length];
            ctx.fillStyle = color; roundRect(ctx, lx, ly - 4, 9, 9, 3); ctx.fill();
            ctx.fillStyle = th.text; ctx.font = '11.5px "PingFang SC", sans-serif';
            ctx.fillText(s.name, lx + 14, ly);
            lx += ctx.measureText(s.name).width + 30;
          });
        }
      });
    };
    draw();
    registerRedraw(el, draw);
  }

  /* ---------------- 仪表盘 ---------------- */
  function gaugeChart(el, opts) {
    opts = opts || {};
    var draw = function () {
      var m = mount(el, opts.height || 180);
      var ctx = m.ctx, w = m.w, h = m.h, th = themeOf(el);
      var value = opts.value || 0;
      var maxV = opts.max || 100;
      var color = opts.color || '#2f9bff';
      var cx = w / 2, cy = h * .72, R = Math.min(w * .40, h * .62);
      var thick = opts.thick || 12;
      var start = Math.PI * .75, sweep = Math.PI * 1.5;
      animate(800, function (p) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = 'round';
        ctx.lineWidth = thick;
        ctx.strokeStyle = th.dark ? 'rgba(120,170,255,.15)' : 'rgba(20,45,90,.08)';
        ctx.beginPath(); ctx.arc(cx, cy, R - thick / 2, start, start + sweep); ctx.stroke();
        var v = Math.min(value / maxV, 1) * p;
        var g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
        g.addColorStop(0, hexA(color, .55)); g.addColorStop(1, color);
        ctx.strokeStyle = g;
        if (th.dark) { ctx.shadowColor = hexA(color, .9); ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(cx, cy, R - thick / 2, start, start + sweep * v); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = th.strong; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '800 26px "PingFang SC", sans-serif';
        ctx.fillText((value * p).toFixed(opts.decimals != null ? opts.decimals : 1), cx, cy - 10);
        ctx.font = '11.5px "PingFang SC", sans-serif'; ctx.fillStyle = th.text;
        ctx.fillText(opts.label || '达成度', cx, cy + 16);
        if (opts.footer) { ctx.fillText(opts.footer, cx, cy + 34); }
      });
    };
    draw();
    registerRedraw(el, draw);
  }

  /* ---------------- 工具：hex + alpha ---------------- */
  function hexA(hex, a) {
    if (hex.indexOf('rgba') === 0 || hex.indexOf('rgb') === 0) return hex;
    var c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
    var num = parseInt(c, 16);
    return 'rgba(' + ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255) + ',' + a + ')';
  }

  /* ---------------- 热力图（DOM 渲染） ---------------- */
  function heatmap(el, opts) {
    opts = opts || {};
    var labels = opts.labels || [];
    var matrix = opts.matrix || [];
    var max = opts.max || 100;
    var th = themeOf(el);
    var html = '<div class="heat" style="grid-template-columns: 92px repeat(' + labels.length + ', minmax(0,1fr));">';
    html += '<div></div>';
    labels.forEach(function (l) { html += '<div class="hl" style="justify-content:center;">' + l + '</div>'; });
    matrix.forEach(function (row, ri) {
      html += '<div class="hl">' + labels[ri] + '</div>';
      row.forEach(function (v, ci) {
        var t = Math.max(0, Math.min(1, v / max));
        var bg = ri === ci ? (th.dark ? 'rgba(120,170,255,.10)' : 'rgba(20,45,90,.06)')
          : 'linear-gradient(135deg,' + hexA('#2f9bff', .18 + t * .82) + ',' + hexA('#e5484d', .12 + t * .78) + ')';
        html += '<div class="hc" style="background:' + bg + ';color:' + (ri === ci || t < .35 ? (th.dark ? '#8fb0dc' : '#64748b') : '#fff') + '">'
          + (ri === ci ? '—' : v + '%') + '</div>';
      });
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function sparkline(el, data, color, height) {
    lineChart(el, { series: [{ data: data, color: color, area: true }], spark: true, height: height || 40, labels: data.map(function (_, i) { return i; }) });
  }

  global.Charts = {
    line: lineChart,
    bar: barChart,
    hbar: hbarChart,
    donut: donutChart,
    radar: radarChart,
    gauge: gaugeChart,
    heatmap: heatmap,
    spark: sparkline,
    redrawAll: redrawAll,
    flush: flush,
    palette: PALETTE,
    hexA: hexA,
    fmt: fmt
  };
})(window);
