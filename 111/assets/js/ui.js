/* ============================================================
   ui.js —— 通用组件：弹窗 / 提示 / 图表 / 分页
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.Store;

  var modalSeq = 0;

  function toast(msg, type) {
    var root = document.getElementById('toastRoot');
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .2s, transform .2s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(function () { el.remove(); }, 220);
    }, 2200);
  }

  function modal(opts) {
    opts = opts || {};
    var id = 'm' + (++modalSeq);
    var mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.id = id;
    mask.innerHTML =
      '<div class="modal ' + (opts.size || '') + '" role="dialog">' +
      '<div class="modal-h"><h3>' + opts.title + '</h3>' + (opts.sub ? '<span class="sub">' + opts.sub + '</span>' : '') +
      '<button class="x" data-close>' + S.icon('close') + '</button></div>' +
      '<div class="modal-b">' + (opts.body || '') + '</div>' +
      (opts.footer === null ? '' : '<div class="modal-f">' + (opts.footer || '') + '</div>') +
      '</div>';
    document.getElementById('modalRoot').appendChild(mask);
    document.body.style.overflow = 'hidden';

    function close() {
      mask.remove();
      if (!document.querySelector('.modal-mask')) document.body.style.overflow = '';
      if (opts.onClose) opts.onClose();
    }
    mask.addEventListener('click', function (e) {
      if (e.target === mask || e.target.closest('[data-close]')) close();
    });
    var keyHandler = function (e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', keyHandler); } };
    document.addEventListener('keydown', keyHandler);

    var api = { el: mask, body: mask.querySelector('.modal-b'), close: close };
    if (opts.onMount) opts.onMount(api);
    return api;
  }

  function confirm(title, text, okText, danger) {
    return new Promise(function (resolve) {
      var m = modal({
        title: title,
        body: '<p style="color:var(--ink-2);font-size:13.5px;line-height:1.75">' + text + '</p>',
        footer: '<button class="btn" data-close>取消</button><button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + (okText || '确定') + '</button>',
        onMount: function (api) {
          api.el.querySelector('[data-ok]').addEventListener('click', function () { api.close(); resolve(true); });
          api.el.addEventListener('click', function (e) {
            if (e.target === api.el || e.target.closest('[data-close]')) resolve(false);
          });
        }
      });
      return m;
    });
  }

  /* ---------------- 图表 ---------------- */
  function lineChart(data, opts) {
    opts = opts || {};
    var W = 720, H = opts.height || 220, pl = 46, pr = 16, pt = 18, pb = 28;
    var vals = data.map(function (d) { return d.value; });
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    if (opts.zero) min = 0;
    var span = (max - min) || 1;
    max = max + span * 0.18;
    min = opts.zero ? 0 : Math.max(0, min - span * 0.22);
    var iw = W - pl - pr, ih = H - pt - pb;
    function x(i) { return pl + (data.length === 1 ? iw / 2 : iw * i / (data.length - 1)); }
    function y(v) { return pt + ih - (v - min) / (max - min) * ih; }
    var path = '', area = '', i;
    for (i = 0; i < data.length; i++) {
      path += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(data[i].value).toFixed(1) + ' ';
    }
    area = path + 'L' + x(data.length - 1).toFixed(1) + ' ' + (pt + ih) + ' L' + x(0).toFixed(1) + ' ' + (pt + ih) + ' Z';
    var grid = '', ticks = 4;
    for (i = 0; i <= ticks; i++) {
      var v = min + (max - min) * i / ticks, yy = y(v);
      grid += '<line x1="' + pl + '" y1="' + yy.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + yy.toFixed(1) + '" stroke="#EFF2F8" stroke-width="1"/>';
      grid += '<text x="' + (pl - 8) + '" y="' + (yy + 3.5).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="#A6B0C6">' + Math.round(v) + '</text>';
    }
    var labels = '', step = Math.ceil(data.length / 7);
    for (i = 0; i < data.length; i += step) {
      labels += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10.5" fill="#A6B0C6">' + data[i].label + '</text>';
    }
    var dots = data.map(function (d, idx) {
      return '<circle cx="' + x(idx).toFixed(1) + '" cy="' + y(d.value).toFixed(1) + '" r="3" fill="#fff" stroke="#2563EB" stroke-width="2"/>';
    }).join('');
    var gid = 'lg' + Math.random().toString(36).slice(2, 7);
    var last = data[data.length - 1];
    return '<div class="chart-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="height:' + H + 'px">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#2563EB" stop-opacity=".20"/><stop offset="100%" stop-color="#2563EB" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
      '<path d="' + path + '" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + labels +
      '<text x="' + (x(data.length - 1) - 4) + '" y="' + (y(last.value) - 10) + '" text-anchor="end" font-size="11.5" font-weight="600" fill="#1E40AF">' + last.value + '</text>' +
      '</svg></div>';
  }

  function barChart(data, opts) {
    opts = opts || {};
    var W = 720, H = opts.height || 200, pl = 40, pr = 14, pt = 16, pb = 30;
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.15 || 1;
    var iw = W - pl - pr, ih = H - pt - pb;
    var bw = iw / data.length * 0.52;
    var bars = data.map(function (d, i) {
      var cx = pl + iw * (i + 0.5) / data.length;
      var h = (d.value / max) * ih;
      var color = d.color || '#2563EB';
      return '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (pt + ih - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) +
        '" rx="5" fill="' + color + '" fill-opacity=".86"/>' +
        '<text x="' + cx.toFixed(1) + '" y="' + (pt + ih - h - 6).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#1E40AF">' + d.value + '</text>' +
        '<text x="' + cx.toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="10.5" fill="#7E8AA6">' + d.label + '</text>';
    }).join('');
    var grid = '';
    for (var i = 0; i <= 3; i++) {
      var yy = pt + ih * i / 3;
      grid += '<line x1="' + pl + '" y1="' + yy + '" x2="' + (W - pr) + '" y2="' + yy + '" stroke="#EFF2F8"/>';
    }
    return '<div class="chart-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" style="height:' + H + 'px">' + grid + bars + '</svg></div>';
  }

  function donutChart(items, opts) {
    opts = opts || {};
    var size = opts.size || 168, r = size / 2 - 12, cx = size / 2, cy = size / 2;
    var total = items.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    var palette = opts.palette || ['#2563EB', '#5B8BF7', '#8FB6FB', '#C7DBFE', '#0EA5E9', '#2BA471', '#D98A1F'];
    var acc = 0, segs = items.map(function (it, i) {
      var frac = it.value / total;
      var a0 = acc * Math.PI * 2 - Math.PI / 2, a1 = (acc + frac) * Math.PI * 2 - Math.PI / 2;
      acc += frac;
      var large = frac > 0.5 ? 1 : 0;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      return '<path d="M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
        '" stroke="' + (it.color || palette[i % palette.length]) + '" stroke-width="16" fill="none" stroke-linecap="butt"/>';
    }).join('');
    var legend = items.map(function (it, i) {
      return '<div><i style="background:' + (it.color || palette[i % palette.length]) + '"></i>' + it.label +
        ' <b style="color:var(--ink);font-weight:600">' + it.value + '</b></div>';
    }).join('');
    return '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">' +
      '<svg viewBox="0 0 ' + size + ' ' + size + '" style="width:' + size + 'px;height:' + size + 'px;flex:0 0 auto">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="#EEF1F8" stroke-width="16" fill="none"/>' + segs +
      '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="20" font-weight="600" fill="#182338">' + total + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="10.5" fill="#7E8AA6">' + (opts.unit || '总计') + '</text>' +
      '</svg><div class="legend" style="flex:1;min-width:130px;flex-direction:column;gap:9px">' + legend + '</div></div>';
  }

  function radarChart(labels, values, opts) {
    opts = opts || {};
    var size = opts.size || 230, cx = size / 2, cy = size / 2 + 4, R = size / 2 - 34;
    var n = labels.length;
    function pt(i, ratio) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / n;
      return [cx + R * ratio * Math.cos(a), cy + R * ratio * Math.sin(a)];
    }
    var rings = [0.25, 0.5, 0.75, 1].map(function (rr) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push(pt(i, rr).map(function (v) { return v.toFixed(1); }).join(','));
      return '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#E7ECF6"/>';
    }).join('');
    var axes = '', labs = '';
    for (var i = 0; i < n; i++) {
      var p = pt(i, 1), lp = pt(i, 1.2);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="#E7ECF6"/>';
      labs += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 3).toFixed(1) + '" text-anchor="middle" font-size="10.5" fill="#5E6A82">' + labels[i] + '</text>';
    }
    var poly = values.map(function (v, i) {
      var p = pt(i, Math.max(0.06, v / 100));
      return p[0].toFixed(1) + ',' + p[1].toFixed(1);
    }).join(' ');
    var dots = values.map(function (v, i) {
      var p = pt(i, Math.max(0.06, v / 100));
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="#2563EB"/>';
    }).join('');
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" style="width:' + size + 'px;height:' + size + 'px">' + rings + axes +
      '<polygon points="' + poly + '" fill="rgba(37,99,235,.16)" stroke="#2563EB" stroke-width="2"/>' + dots + labs + '</svg>';
  }

  function pager(total, page, size, cls) {
    var pages = Math.max(1, Math.ceil(total / size));
    var html = '<div class="pager ' + (cls || '') + '"><span>共 ' + total + ' 条</span>';
    html += '<button data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>上一页</button>';
    var start = Math.max(1, page - 2), end = Math.min(pages, start + 4);
    start = Math.max(1, end - 4);
    for (var i = start; i <= end; i++) html += '<button data-page="' + i + '" class="' + (i === page ? 'on' : '') + '">' + i + '</button>';
    html += '<button data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>下一页</button></div>';
    return html;
  }

  function statusTag(status) {
    var map = {
      '运行中': 'ok', '已发布': 'ok', '进行中': 'ok', '已支付': 'ok', '已完成': 'ok', '通过': 'ok',
      '筹备中': 'warn', '草稿': 'gray', '待提交': 'warn', '待审批': 'warn', '待批改': 'warn', '已退款': 'danger',
      '已结束': 'gray', '进行': 'ok'
    };
    return '<span class="tag ' + (map[status] || 'gray') + '">' + status + '</span>';
  }

  global.UI = {
    toast: toast, modal: modal, confirm: confirm,
    lineChart: lineChart, barChart: barChart, donutChart: donutChart, radarChart: radarChart,
    pager: pager, statusTag: statusTag
  };
})(window);
