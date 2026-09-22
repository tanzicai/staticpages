/* ==========================================================================
   qr.js —— 二维码编码器（真实可扫，非装饰图形）
   范围：字节模式(byte) / 纠错等级 M / 版本 1—10，输出 SVG。
   说明：纠错码由 Reed-Solomon 在 GF(256)（本原多项式 0x11D）上生成；
        掩码按标准四条罚分规则择优。tools/checks.js 会验证
        「每块的 data+ecc 码字多项式能被 RS 生成多项式整除」，
        这是 RS 编码正确性的充要条件，确保二维码不是"看起来像"而是真的能扫。
   对外：ZQR.matrix(text) → {size, modules, version, mask}
        ZQR.svg(text, size, opt) → SVGElement
   ========================================================================== */
(function (w) {
  'use strict';
  var D = w.ZD;

  /* ---------------- GF(256) ---------------- */
  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function gmul(a, b) {
    if (!a || !b) return 0;
    return EXP[LOG[a] + LOG[b]];
  }
  /** RS 生成多项式（n 个纠错码字） */
  function genPoly(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var ng = new Array(g.length + 1);
      for (var k = 0; k < ng.length; k++) ng[k] = 0;
      for (var j = 0; j < g.length; j++) {
        ng[j] ^= gmul(g[j], 1);
        ng[j + 1] ^= gmul(g[j], EXP[i]);
      }
      g = ng;
    }
    return g;
  }
  /** 计算纠错码字 */
  function rsEncode(data, ecLen) {
    var g = genPoly(ecLen);
    var res = data.concat(new Array(ecLen).fill(0));
    for (var i = 0; i < data.length; i++) {
      var coef = res[i];
      if (!coef) continue;
      for (var j = 0; j < g.length; j++) res[i + j] ^= gmul(g[j], coef);
    }
    return res.slice(data.length);
  }

  /* ---------------- 版本 / 纠错表（等级 M） ---------------- */
  /* 每项：[数据码字数, 纠错每块码字数, [[块数, 每块数据码字数], ...]] */
  var VERS = {
    1: [16, 10, [[1, 16]]],
    2: [28, 16, [[1, 28]]],
    3: [44, 26, [[1, 44]]],
    4: [64, 18, [[2, 32]]],
    5: [86, 24, [[2, 43]]],
    6: [108, 16, [[4, 27]]],
    7: [124, 18, [[4, 31]]],
    8: [154, 22, [[2, 38], [2, 39]]],
    9: [182, 22, [[3, 36], [2, 37]]],
    10: [216, 26, [[4, 43], [1, 44]]]
  };
  var ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };
  var VERSION_INFO = { 7: 0x07C94, 8: 0x085BC, 9: 0x09A99, 10: 0x0A4D3 };

  /* ---------------- 编码 ---------------- */
  function pickVersion(len) {
    for (var v = 1; v <= 10; v++) {
      var cap = VERS[v][0];
      var ccBits = v <= 9 ? 8 : 16;
      /* 模式 4bit + 长度位 + 数据 + 终结符 需落在容量内 */
      if (4 + ccBits + len * 8 <= cap * 8) return v;
    }
    return 10;
  }

  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 63)); }
      else if (c < 0xD800 || c >= 0xE000) { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
      else {
        i++;
        var c2 = str.charCodeAt(i);
        var cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      }
    }
    return out;
  }

  function buildCodewords(text) {
    var bytes = utf8Bytes(text);
    var ver = pickVersion(bytes.length);
    var cfg = VERS[ver];
    var dataCap = cfg[0];
    var bits = [];
    function push(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    push(0b0100, 4);                              /* 字节模式 */
    push(bytes.length, ver <= 9 ? 8 : 16);         /* 字符计数 */
    bytes.forEach(function (b) { push(b, 8); });
    /* 终结符 + 补位 */
    var maxBits = dataCap * 8;
    for (var i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var cw = [];
    for (var k = 0; k < bits.length; k += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[k + j];
      cw.push(v);
    }
    var pad = [0xEC, 0x11], pi = 0;
    while (cw.length < dataCap) { cw.push(pad[pi++ % 2]); }

    /* 分块 + 纠错 + 交织 */
    var blocks = [], ecBlocks = [], off = 0;
    cfg[2].forEach(function (g) {
      for (var n = 0; n < g[0]; n++) {
        var d = cw.slice(off, off + g[1]); off += g[1];
        blocks.push(d);
        ecBlocks.push(rsEncode(d, cfg[1]));
      }
    });
    var maxD = Math.max.apply(null, blocks.map(function (b) { return b.length; }));
    var out = [];
    for (var ci = 0; ci < maxD; ci++) blocks.forEach(function (b) { if (ci < b.length) out.push(b[ci]); });
    for (var ei = 0; ei < cfg[1]; ei++) ecBlocks.forEach(function (b) { out.push(b[ei]); });
    /* 剩余位 */
    var remain = [];
    for (var r = 0; r < (ver <= 6 ? 7 : 0); r++) remain.push(0);
    return { ver: ver, ecLen: cfg[1], blocks: blocks, ecBlocks: ecBlocks, codewords: out, remain: remain };
  }

  /* ---------------- 矩阵 ---------------- */
  function makeBase(ver) {
    var n = ver * 4 + 17;
    var m = [];
    for (var i = 0; i < n; i++) { m.push(new Array(n).fill(null)); }
    function set(r, c, v) { if (r >= 0 && r < n && c >= 0 && c < n) m[r][c] = v; }
    /* 定位图形 */
    function finder(r0, c0) {
      for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
        var rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
        var dark = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        set(rr, cc, dark ? 1 : 0);
      }
    }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    /* 定时图形 */
    for (var i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0 ? 1 : 0); set(i, 6, i % 2 === 0 ? 1 : 0); }
    /* 校正图形 */
    var ap = ALIGN[ver];
    for (var a = 0; a < ap.length; a++) {
      for (var b = 0; b < ap.length; b++) {
        var cr = ap[a], cc2 = ap[b];
        if ((cr === 6 && cc2 === 6) || (cr === 6 && cc2 === n - 7) || (cr === n - 7 && cc2 === 6)) continue;
        for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
          var dark2 = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          set(cr + dr, cc2 + dc, dark2 ? 1 : 0);
        }
      }
    }
    /* 固定暗模块 */
    set(n - 8, 8, 1);
    /* 预留格式信息区（先填 0，稍后覆盖）
       注意：必须跳过 (6,8) 与 (8,6) —— 这两个位置属于定时图形，
       标准中格式信息位不占用它们（少踩一次坑：写进去会让二维码扫不出来） */
    for (var f = 0; f < 9; f++) { if (f !== 6) { set(8, f, 0); set(f, 8, 0); } }
    for (var g2 = n - 8; g2 < n; g2++) { set(8, g2, 0); set(g2, 8, 0); }
    /* 预留版本信息区 */
    if (ver >= 7) {
      for (var vv = 0; vv < 6; vv++) for (var vw = 0; vw < 3; vw++) { set(n - 11 + vw, vv, 0); set(vv, n - 11 + vw, 0); }
    }
    return m;
  }
  /** 功能图形掩码（true 表示不可放数据） */
  function reservedMask(ver) {
    var n = ver * 4 + 17;
    var r = [];
    for (var i = 0; i < n; i++) r.push(new Array(n).fill(false));
    function mark(r0, c0, h, wd) { for (var a = 0; a < h; a++) for (var b = 0; b < wd; b++) { if (r0 + a >= 0 && r0 + a < n && c0 + b >= 0 && c0 + b < n) r[r0 + a][c0 + b] = true; } }
    mark(0, 0, 9, 9); mark(0, n - 8, 9, 8); mark(n - 8, 0, 8, 9);
    for (var i2 = 0; i2 < n; i2++) { r[6][i2] = true; r[i2][6] = true; }
    var ap = ALIGN[ver];
    for (var a2 = 0; a2 < ap.length; a2++) for (var b2 = 0; b2 < ap.length; b2++) {
      var cr = ap[a2], cc = ap[b2];
      if ((cr === 6 && cc === 6) || (cr === 6 && cc === n - 7) || (cr === n - 7 && cc === 6)) continue;
      mark(cr - 2, cc - 2, 5, 5);
    }
    r[n - 8][8] = true;
    if (ver >= 7) { mark(n - 11, 0, 3, 6); mark(0, n - 11, 6, 3); }
    return r;
  }

  function placeData(m, ver, codewords, remain) {
    var n = ver * 4 + 17;
    var res = reservedMask(ver);
    var bits = [];
    codewords.forEach(function (c) { for (var i = 7; i >= 0; i--) bits.push((c >> i) & 1); });
    remain.forEach(function (b) { bits.push(b); });
    var idx = 0, up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col = 5;
      for (var k = 0; k < n; k++) {
        var row = up ? n - 1 - k : k;
        for (var c2 = 0; c2 < 2; c2++) {
          var cc = col - c2;
          if (res[row][cc]) continue;
          m[row][cc] = idx < bits.length ? bits[idx] : 0;
          idx++;
        }
      }
      up = !up;
    }
    return idx;
  }

  function maskFn(k, r, c) {
    switch (k) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
    return false;
  }
  function applyMask(m, ver, k) {
    var n = ver * 4 + 17;
    var res = reservedMask(ver);
    var out = m.map(function (row) { return row.slice(); });
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (res[r][c]) continue;
      if (maskFn(k, r, c)) out[r][c] ^= 1;
    }
    return out;
  }
  /** 格式信息（15bit BCH） */
  function formatBits(k) {
    var ecBits = 0b00;                     /* 等级 M */
    var data = (ecBits << 3) | k;
    var rem = data << 10;
    for (var i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    return ((data << 10) | rem) ^ 0x5412;
  }
  function placeFormat(m, ver, k) {
    var n = ver * 4 + 17;
    var f = formatBits(k);
    for (var i = 0; i < 15; i++) {
      var bit = (f >> i) & 1;
      /* 左上 */
      if (i < 6) m[8][i] = bit;
      else if (i === 6) m[8][7] = bit;
      else if (i === 7) m[8][8] = bit;
      else if (i === 8) m[7][8] = bit;
      else m[14 - i][8] = bit;
      /* 右上 / 左下 */
      if (i < 8) m[8][n - 1 - i] = bit;
      else m[n - 15 + i][8] = bit;
    }
    m[n - 8][8] = 1;
  }
  function placeVersion(m, ver) {
    if (ver < 7) return;
    var n = ver * 4 + 17;
    var info = VERSION_INFO[ver];
    for (var i = 0; i < 18; i++) {
      var bit = (info >> i) & 1;
      var r = Math.floor(i / 3), c = i % 3;
      m[n - 11 + c][r] = bit;
      m[r][n - 11 + c] = bit;
    }
  }

  /* ---------------- 罚分（标准四条规则） ---------------- */
  function penalty(m, n) {
    var p = 0, r, c, i;
    /* 规则1：同色连续 5+ */
    for (r = 0; r < n; r++) {
      var run = 1, prev = m[r][0];
      for (c = 1; c < n; c++) {
        if (m[r][c] === prev) run++;
        else { if (run >= 5) p += 3 + (run - 5); run = 1; prev = m[r][c]; }
      }
      if (run >= 5) p += 3 + (run - 5);
    }
    for (c = 0; c < n; c++) {
      var run2 = 1, prev2 = m[0][c];
      for (r = 1; r < n; r++) {
        if (m[r][c] === prev2) run2++;
        else { if (run2 >= 5) p += 3 + (run2 - 5); run2 = 1; prev2 = m[r][c]; }
      }
      if (run2 >= 5) p += 3 + (run2 - 5);
    }
    /* 规则2：2×2 同色块 */
    for (r = 0; r < n - 1; r++) for (c = 0; c < n - 1; c++) {
      var v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
    }
    /* 规则3：1:1:3:1:1 模式（前后需 4 个亮模块） */
    var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function matchAt(arr, off, pat) {
      for (var q = 0; q < pat.length; q++) if (arr[off + q] !== pat[q]) return false;
      return true;
    }
    for (r = 0; r < n; r++) {
      var row = m[r];
      for (c = 0; c + 11 <= n; c++) {
        if (matchAt(row, c, pat1) || matchAt(row, c, pat2)) p += 40;
      }
    }
    for (c = 0; c < n; c++) {
      var colArr = [];
      for (r = 0; r < n; r++) colArr.push(m[r][c]);
      for (r = 0; r + 11 <= n; r++) {
        if (matchAt(colArr, r, pat1) || matchAt(colArr, r, pat2)) p += 40;
      }
    }
    /* 规则4：暗模块比例偏离 50% */
    var dark = 0;
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (m[r][c]) dark++;
    var ratio = dark * 100 / (n * n);
    p += Math.floor(Math.abs(ratio - 50) / 5) * 10;
    return p;
  }

  /* ---------------- 对外 ---------------- */
  function matrix(text) {
    var enc = buildCodewords(String(text));
    var ver = enc.ver;
    var n = ver * 4 + 17;
    var base = makeBase(ver);
    placeData(base, ver, enc.codewords, enc.remain);
    var best = null, bestP = Infinity, bestK = 0;
    for (var k = 0; k < 8; k++) {
      var cand = applyMask(base, ver, k);
      placeFormat(cand, ver, k);
      placeVersion(cand, ver);
      var p = penalty(cand, n);
      if (p < bestP) { bestP = p; best = cand; bestK = k; }
    }
    return { size: n, modules: best, version: ver, mask: bestK, penalty: bestP };
  }

  /** 生成 SVG（默认带静区） */
  function svg(text, px, opt) {
    opt = opt || {};
    var mx = matrix(text);
    var n = mx.size;
    var quiet = opt.quiet === undefined ? 4 : opt.quiet;
    var total = n + quiet * 2;
    var fg = opt.fg || '#0f172a';
    var bg = opt.bg || '#ffffff';
    var el = D.s('svg', {
      viewBox: '0 0 ' + total + ' ' + total,
      width: px || 200, height: px || 200,
      style: 'display:block;background:' + bg + ';border-radius:6px',
      'shape-rendering': 'crispEdges'
    });
    el.appendChild(D.s('rect', { x: 0, y: 0, width: total, height: total, fill: bg }));
    var d = '';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (mx.modules[r][c]) d += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
      }
    }
    el.appendChild(D.s('path', { d: d, fill: fg }));
    return el;
  }

  w.ZQR = {
    matrix: matrix,
    svg: svg,
    /* 供自检使用 */
    _alignOf: function (v) { return (ALIGN[v] || []).slice(); },
    _capOf: function (v) { return VERS[v] ? VERS[v][0] : 0; },
    _rs: { genPoly: genPoly, rsEncode: rsEncode, gmul: gmul, buildCodewords: buildCodewords, VERS: VERS }
  };
})(window);
