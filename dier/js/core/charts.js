/* ==========================================================================
   charts.js —— 纯 SVG 图表（无外部依赖）
   全部返回真实 DOM 元素（SVGElement），可直接 appendChildDeep 挂载。
   颜色一律显式设置 fill/stroke（不依赖 CSS 类，避免落到默认黑色）。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD;

  var C = {
    PALETTE: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#f97316', '#14b8a6', '#a855f7'],
    AXIS: '#9aa8bc', GRID: '#eef3fa', TEXT: '#5b6b82', TEXT_D: '#111827', TRACK: '#f1f5fb',
    color: function (i) { return C.PALETTE[i % C.PALETTE.length]; }
  };
  C.SEM = { ok: '#10b981', warn: '#f59e0b', err: '#ef4444', info: '#3b82f6', purple: '#8b5cf6', cyan: '#06b6d4', pink: '#ec4899', indigo: '#6366f1' };

  function svg(vbw, vbh, extra) {
    var a = { viewBox: '0 0 ' + vbw + ' ' + vbh, width: '100%', preserveAspectRatio: 'xMidYMid meet', class: 'chart' };
    Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; });
    return D.s('svg', a);
  }
  function txt(x, y, str, o) {
    o = o || {};
    return D.s('text', {
      x: x, y: y, fill: o.fill || C.TEXT, 'font-size': o.size || 11,
      'font-weight': o.weight || 400, 'text-anchor': o.anchor || 'start',
      'font-family': 'inherit', transform: o.transform || null, opacity: o.opacity || null
    }, String(str));
  }
  /** 轴刻度友好值 */
  function niceMax(v) {
    if (v <= 0) return 1;
    var e = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var n = v / e;
    var s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return s * e;
  }
  function fmtNum(v) { return Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + '万' : U.fmt(v); }

  /* =========================================================
     横向条形图
     rows: [{n:'名称', v:123, c:'#hex'}]  opt: {unit,labelW,bh,gap,max}
     ========================================================= */
  C.bars = function (rows, opt) {
    opt = opt || {};
    var W = 480, labelW = opt.labelW || 118, rightW = opt.rightW || 52;
    var bh = opt.bh || 18, gap = opt.gap || 9;
    var H = Math.max(40, rows.length * (bh + gap) - gap + 6);
    var max = opt.max || niceMax(Math.max.apply(null, rows.map(function (r) { return U.num(r.v); }).concat([1])));
    var barW = W - labelW - rightW;
    var el = svg(W, H);
    rows.forEach(function (r, i) {
      var y = i * (bh + gap);
      var v = U.num(r.v);
      var w = Math.max(2, barW * (v / max));
      el.appendChild(txt(0, y + bh * 0.74, r.n, { size: 11 }));
      el.appendChild(D.s('rect', { x: labelW, y: y, width: barW, height: bh, rx: 4, fill: C.TRACK }));
      el.appendChild(D.s('rect', { x: labelW, y: y, width: w, height: bh, rx: 4, fill: r.c || C.color(i) }));
      el.appendChild(txt(labelW + barW / 2, y + bh * 0.74, fmtNum(v) + (opt.unit || ''), {
        size: 10.5, anchor: 'middle', fill: '#fff', weight: 600
      }));
      el.appendChild(txt(W, y + bh * 0.74, fmtNum(v) + (opt.unit || ''), { size: 10.5, anchor: 'end', fill: C.TEXT_D, weight: 700 }));
    });
    return el;
  };

  /* =========================================================
     纵向柱状图（支持分组 / 堆叠）
     groups: [{n:'标签', v:123}]  或 series: [{n:'系列名', data:[..]}]
     ========================================================= */
  C.vbars = function (groups, opt) {
    opt = opt || {};
    var W = 520, H = opt.height || 220, padL = 42, padR = 12, padT = 16, padB = opt.padB || 40;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var el = svg(W, H);
    var series = opt.series || [{ n: opt.name || '数量', data: groups.map(function (g) { return U.num(g.v); }) }];
    var stacked = !!opt.stacked;
    var flat = [];
    if (stacked) {
      groups.forEach(function (g, i) { flat.push(series.reduce(function (s, se) { return s + U.num(se.data[i]); }, 0)); });
    } else {
      series.forEach(function (se) { se.data.forEach(function (v) { flat.push(U.num(v)); }); });
    }
    var max = niceMax(Math.max.apply(null, flat.concat([1])));
    // 网格 + Y 轴
    for (var t = 0; t <= 4; t++) {
      var y = padT + plotH - plotH * t / 4;
      el.appendChild(D.s('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: C.GRID, 'stroke-width': t === 0 ? 1.2 : 1 }));
      el.appendChild(txt(padL - 6, y + 3.6, fmtNum(max * t / 4), { size: 9.5, anchor: 'end', fill: C.AXIS }));
    }
    var gw = plotW / Math.max(1, groups.length);
    var innerW = gw * 0.62;
    var bw = stacked ? innerW : innerW / series.length;
    groups.forEach(function (g, i) {
      var gx = padL + gw * i + (gw - innerW) / 2;
      if (stacked) {
        var acc = 0;
        series.forEach(function (se, si) {
          var v = U.num(se.data[i]);
          var h0 = plotH * (v / max);
          var y0 = padT + plotH - plotH * ((acc + v) / max);
          el.appendChild(D.s('rect', { x: gx, y: y0, width: bw, height: Math.max(0.5, h0), rx: 2, fill: se.c || C.color(si) }));
          acc += v;
        });
      } else {
        series.forEach(function (se, si) {
          var v = U.num(se.data[i]);
          var h0 = plotH * (v / max);
          el.appendChild(D.s('rect', {
            x: gx + bw * si + 1, y: padT + plotH - h0, width: Math.max(1, bw - 2), height: Math.max(0.5, h0),
            rx: 2.5, fill: se.c || C.color(si)
          }));
          if (opt.showValue !== false && series.length === 1) {
            el.appendChild(txt(gx + bw * si + bw / 2, padT + plotH - h0 - 4, fmtNum(v), { size: 9.5, anchor: 'middle', fill: C.TEXT_D, weight: 600 }));
          }
        });
      }
      var label = String(g.n);
      var disp = label.length > 5 && gw < 44 ? label.slice(0, 4) + '…' : label;
      el.appendChild(txt(padL + gw * i + gw / 2, H - padB + 15, disp, { size: 9.5, anchor: 'middle' }));
      if (opt.rotate && label.length > 4) {
        /* 长标签两行显示 */
        el.appendChild(txt(padL + gw * i + gw / 2, H - padB + 26, label.slice(4, 9), { size: 8.5, anchor: 'middle', fill: C.AXIS }));
      }
    });
    el.appendChild(D.s('line', { x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH, stroke: C.GRID, 'stroke-width': 1.4 }));
    return el;
  };

  /* =========================================================
     折线 / 面积图
     opt.series: [{n:'系列', data:[..], c}]
     opt.labels: ['09-01', ...]
     ========================================================= */
  C.line = function (labels, series, opt) {
    opt = opt || {};
    var W = 560, H = opt.height || 220, padL = 44, padR = 14, padT = 16, padB = opt.padB || 36;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var el = svg(W, H);
    var flat = [];
    series.forEach(function (se) { se.data.forEach(function (v) { flat.push(U.num(v)); }); });
    var max = niceMax(Math.max.apply(null, flat.concat([1])) * (opt.headroom || 1.08));
    for (var t = 0; t <= 4; t++) {
      var y = padT + plotH - plotH * t / 4;
      el.appendChild(D.s('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: C.GRID, 'stroke-width': t === 0 ? 1.2 : 1 }));
      el.appendChild(txt(padL - 6, y + 3.6, fmtNum(Math.round(max * t / 4)), { size: 9.5, anchor: 'end', fill: C.AXIS }));
    }
    var n = labels.length;
    var stepX = n > 1 ? plotW / (n - 1) : 0;
    var defs = D.s('defs');
    series.forEach(function (se, si) {
      var c = se.c || C.color(si);
      var lg = D.s('linearGradient', { id: 'lg-' + si + '-' + (se.n || '').replace(/\W/g, ''), x1: 0, y1: 0, x2: 0, y2: 1 });
      lg.appendChild(D.s('stop', { offset: '0%', 'stop-color': c, 'stop-opacity': .26 }));
      lg.appendChild(D.s('stop', { offset: '100%', 'stop-color': c, 'stop-opacity': 0 }));
      defs.appendChild(lg);
    });
    el.appendChild(defs);
    series.forEach(function (se, si) {
      var c = se.c || C.color(si);
      var pts = se.data.map(function (v, i) {
        var x = padL + stepX * i;
        var y = padT + plotH - plotH * (U.num(v) / max);
        return [x, y];
      });
      var dLine = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      if (opt.area) {
        var dArea = dLine + ' L' + (padL + stepX * (n - 1)).toFixed(1) + ' ' + (padT + plotH) + ' L' + padL + ' ' + (padT + plotH) + ' Z';
        el.appendChild(D.s('path', { d: dArea, fill: 'url(#lg-' + si + '-' + (se.n || '').replace(/\W/g, '') + ')', stroke: 'none' }));
      }
      el.appendChild(D.s('path', { d: dLine, fill: 'none', stroke: c, 'stroke-width': 2.1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      if (opt.dots !== false) {
        pts.forEach(function (p, i) {
          el.appendChild(D.s('circle', { cx: p[0], cy: p[1], r: 2.8, fill: '#fff', stroke: c, 'stroke-width': 1.8 }));
          if (opt.valueLabels) el.appendChild(txt(p[0], p[1] - 7, fmtNum(se.data[i]), { size: 9, anchor: 'middle', fill: c, weight: 600 }));
        });
      }
    });
    labels.forEach(function (lb, i) {
      if (opt.maxLabels && n > opt.maxLabels && i % Math.ceil(n / opt.maxLabels) !== 0 && i !== n - 1) return;
      el.appendChild(txt(padL + stepX * i, H - padB + 15, lb, { size: 9.5, anchor: 'middle' }));
    });
    el.appendChild(D.s('line', { x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH, stroke: C.GRID, 'stroke-width': 1.4 }));
    return el;
  };

  /* =========================================================
     环形图 / 饼图
     rows: [{n,v,c}]  opt:{size, thickness, centerLabel, centerValue, pie:true}
     ========================================================= */
  C.donut = function (rows, opt) {
    opt = opt || {};
    var size = opt.size || 200;
    var cis = size / 2;
    var thick = opt.thickness || 26;
    var r = cis - (opt.pie ? 2 : thick / 2 + 2);
    var total = U.sum(rows, function (x) { return U.num(x.v); });
    var el = svg(size, size, { style: 'max-width:' + size + 'px;margin:0 auto' });
    if (total <= 0) {
      el.appendChild(D.s('circle', { cx: cis, cy: cis, r: r, fill: 'none', stroke: C.TRACK, 'stroke-width': thick }));
      el.appendChild(txt(cis, cis + 4, '暂无数据', { size: 11, anchor: 'middle', fill: C.AXIS }));
      return el;
    }
    if (opt.pie) {
      var a0 = -Math.PI / 2;
      rows.forEach(function (row, i) {
        var frac = U.num(row.v) / total;
        var a1 = a0 + frac * Math.PI * 2;
        var large = frac > 0.5 ? 1 : 0;
        var x0 = cis + r * Math.cos(a0), y0 = cis + r * Math.sin(a0);
        var x1 = cis + r * Math.cos(a1), y1 = cis + r * Math.sin(a1);
        var d = frac >= 0.9999
          ? 'M' + cis + ' ' + (cis - r) + ' A' + r + ' ' + r + ' 0 1 1 ' + (cis - 0.01) + ' ' + (cis - r) + ' Z'
          : 'M' + cis + ' ' + cis + ' L' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
          ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z';
        el.appendChild(D.s('path', { d: d, fill: row.c || C.color(i), stroke: '#fff', 'stroke-width': 1.6 }));
        a0 = a1;
      });
    } else {
      var c = 2 * Math.PI * r;
      var off = 0;
      rows.forEach(function (row, i) {
        var frac = U.num(row.v) / total;
        var seg = c * frac;
        el.appendChild(D.s('circle', {
          cx: cis, cy: cis, r: r, fill: 'none',
          stroke: row.c || C.color(i), 'stroke-width': thick,
          'stroke-dasharray': (seg - 1.4).toFixed(2) + ' ' + (c - seg + 1.4).toFixed(2),
          'stroke-dashoffset': (-off).toFixed(2),
          transform: 'rotate(-90 ' + cis + ' ' + cis + ')',
          'stroke-linecap': 'butt'
        }));
        off += seg;
      });
    }
    if (!opt.pie) {
      if (opt.centerValue !== undefined) {
        el.appendChild(txt(cis, cis + 2, String(opt.centerValue), { size: size * 0.155, anchor: 'middle', fill: C.TEXT_D, weight: 750 }));
      }
      if (opt.centerLabel) {
        el.appendChild(txt(cis, cis + size * 0.115, String(opt.centerLabel), { size: size * 0.062, anchor: 'middle', fill: C.AXIS }));
      }
    }
    return el;
  };

  /* =========================================================
     雷达图
     axes: [{n:'思想素养', v:0.8, max:1}]
     ========================================================= */
  C.radar = function (axes, opt) {
    opt = opt || {};
    var size = opt.size || 232, cis = size / 2, r = cis - 34;
    var el = svg(size, size, { style: 'max-width:' + size + 'px;margin:0 auto' });
    var n = axes.length;
    function pt(i, ratio) {
      var ang = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      return [cis + r * ratio * Math.cos(ang), cis + r * ratio * Math.sin(ang)];
    }
    // 网格
    [0.25, 0.5, 0.75, 1].forEach(function (ratio, ri) {
      var d = axes.map(function (a, i) { var p = pt(i, ratio); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + ' Z';
      el.appendChild(D.s('path', { d: d, fill: 'none', stroke: ri === 3 ? '#dfe8f6' : C.GRID, 'stroke-width': 1 }));
    });
    axes.forEach(function (a, i) {
      var p = pt(i, 1);
      el.appendChild(D.s('line', { x1: cis, y1: cis, x2: p[0], y2: p[1], stroke: C.GRID, 'stroke-width': 1 }));
      var lp = pt(i, 1.19);
      el.appendChild(txt(lp[0], lp[1] + 3.4, a.n, { size: 10, anchor: 'middle', fill: C.TEXT }));
    });
    // 数据面
    var d2 = axes.map(function (a, i) {
      var ratio = a.max ? U.clamp(U.num(a.v) / a.max, 0, 1) : U.clamp(U.num(a.v), 0, 1);
      var p = pt(i, Math.max(0.02, ratio));
      return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }).join(' ') + ' Z';
    el.appendChild(D.s('path', { d: d2, fill: 'rgba(37,99,235,.16)', stroke: '#2563eb', 'stroke-width': 2 }));
    axes.forEach(function (a, i) {
      var ratio = a.max ? U.clamp(U.num(a.v) / a.max, 0, 1) : U.clamp(U.num(a.v), 0, 1);
      var p = pt(i, Math.max(0.02, ratio));
      el.appendChild(D.s('circle', { cx: p[0], cy: p[1], r: 3, fill: '#2563eb', stroke: '#fff', 'stroke-width': 1.4 }));
    });
    return el;
  };

  /* =========================================================
     迷你走势（sparkline）
     ========================================================= */
  C.spark = function (values, opt) {
    opt = opt || {};
    var W = opt.width || 120, H = opt.height || 34;
    var max = Math.max.apply(null, values.concat([1]));
    var min = Math.min.apply(null, values.concat([0]));
    var span = (max - min) || 1;
    var stepX = values.length > 1 ? W / (values.length - 1) : 0;
    var el = svg(W, H);
    var c = opt.c || '#2563eb';
    var pts = values.map(function (v, i) { return [stepX * i, H - 3 - (H - 6) * ((v - min) / span)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    if (opt.area !== false) {
      el.appendChild(D.s('path', { d: d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z', fill: c, opacity: .12, stroke: 'none' }));
    }
    el.appendChild(D.s('path', { d: d, fill: 'none', stroke: c, 'stroke-width': 1.9, 'stroke-linecap': 'round' }));
    var last = pts[pts.length - 1];
    el.appendChild(D.s('circle', { cx: last[0], cy: last[1], r: 2.6, fill: c }));
    return el;
  };

  /* =========================================================
     横向进度条（带标签/数值）
     ========================================================= */
  C.rankBars = function (rows, opt) {
    opt = opt || {};
    var max = Math.max.apply(null, rows.map(function (r) { return U.num(r.v); }).concat([1]));
    var host = D.h('div');
    rows.forEach(function (r, i) {
      var pct = Math.max(1.5, U.num(r.v) / max * 100);
      host.appendChild(D.h('div.rank-bar', { style: 'margin-bottom:8px' },
        D.h('div.rb-n', { title: r.n }, r.n),
        D.h('div', { style: 'flex:1' },
          D.h('div.pg', { style: 'height:' + (opt.h || 9) + 'px' },
            D.h('span', { style: 'width:' + pct.toFixed(2) + '%;background:' + (r.c || C.color(i)) })
          )
        ),
        D.h('div.rb-v', U.fmt(r.v) + (opt.unit || ''))
      ));
    });
    return host;
  };

  /** 图例 */
  C.legend = function (rows) {
    return D.h('div.legend', rows.map(function (r, i) {
      return D.h('span', {}, D.h('i', { style: 'background:' + (r.c || C.color(i)) }), r.n + (r.v !== undefined ? ' ' + U.fmt(r.v) : ''));
    }));
  };

  /** 双轴组合（柱 + 折线），用于统计页 */
  C.combo = function (groups, barSeries, lineSeries, opt) {
    opt = opt || {};
    var W = 560, H = opt.height || 240, padL = 44, padR = 40, padT = 18, padB = 42;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var el = svg(W, H);
    var bmax = niceMax(Math.max.apply(null, barSeries.data.concat([1])));
    var lmax = niceMax(Math.max.apply(null, lineSeries.data.concat([1])) * 1.1);
    for (var t = 0; t <= 4; t++) {
      var y = padT + plotH - plotH * t / 4;
      el.appendChild(D.s('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: C.GRID, 'stroke-width': t === 0 ? 1.2 : 1 }));
      el.appendChild(txt(padL - 6, y + 3.6, fmtNum(Math.round(bmax * t / 4)), { size: 9.5, anchor: 'end', fill: C.AXIS }));
      el.appendChild(txt(W - padR + 6, y + 3.6, fmtNum(Math.round(lmax * t / 4)), { size: 9.5, anchor: 'start', fill: C.AXIS }));
    }
    var gw = plotW / Math.max(1, groups.length);
    var bw = gw * 0.46;
    groups.forEach(function (g, i) {
      var v = U.num(barSeries.data[i]);
      var h0 = plotH * (v / bmax);
      el.appendChild(D.s('rect', {
        x: padL + gw * i + (gw - bw) / 2, y: padT + plotH - h0, width: bw, height: Math.max(.5, h0),
        rx: 3, fill: barSeries.c || '#3b82f6'
      }));
      el.appendChild(txt(padL + gw * i + gw / 2, H - padB + 15, String(g.n), { size: 9.5, anchor: 'middle' }));
    });
    var stepX = groups.length > 1 ? plotW / (groups.length - 1) : 0;
    var pts = lineSeries.data.map(function (v, i) {
      return [padL + stepX * i, padT + plotH - plotH * (U.num(v) / lmax)];
    });
    el.appendChild(D.s('path', {
      d: pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '),
      fill: 'none', stroke: lineSeries.c || '#f59e0b', 'stroke-width': 2.2, 'stroke-linecap': 'round'
    }));
    pts.forEach(function (p) {
      el.appendChild(D.s('circle', { cx: p[0], cy: p[1], r: 2.9, fill: '#fff', stroke: lineSeries.c || '#f59e0b', 'stroke-width': 1.9 }));
    });
    el.appendChild(D.s('line', { x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH, stroke: C.GRID, 'stroke-width': 1.4 }));
    return el;
  };

  /** 迷你热力方块（周 × 时段） */
  C.heat = function (matrix, opt) {
    opt = opt || {};
    var rows = matrix.length, cols = matrix[0].length;
    var cw = opt.cw || 26, ch = opt.ch || 18, gap = 3;
    var W = cols * (cw + gap) + 30, H = rows * (ch + gap) + 20;
    var el = svg(W, H);
    var max = 0;
    matrix.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    matrix.forEach(function (row, y) {
      if (opt.rowLabels) el.appendChild(txt(0, y * (ch + gap) + ch * 0.72 + 8, opt.rowLabels[y], { size: 9.5 }));
      row.forEach(function (v, x) {
        var a = max ? U.clamp(v / max, 0.06, 1) : 0.06;
        el.appendChild(D.s('rect', {
          x: 30 + x * (cw + gap), y: y * (ch + gap) + 8, width: cw, height: ch, rx: 3,
          fill: 'rgba(37,99,235,' + a.toFixed(2) + ')'
        }));
      });
    });
    (opt.colLabels || []).forEach(function (lb, x) {
      el.appendChild(txt(30 + x * (cw + gap) + cw / 2, H - 2, lb, { size: 9, anchor: 'middle', fill: C.AXIS }));
    });
    return el;
  };

  w.ZC = C;
})(window);
