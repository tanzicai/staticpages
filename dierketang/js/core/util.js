/* ==========================================================================
   util.js —— 纯函数工具（无副作用、无 DOM 依赖）
   挂到 window.ZU 命名空间
   ========================================================================== */
(function (w) {
  'use strict';

  var U = {};

  /* ---------- 数字 / 文本 ---------- */
  U.num = function (v, d) {
    if (v === null || v === undefined || v === '' || isNaN(v)) return d === undefined ? 0 : d;
    var n = Number(v);
    return n;
  };
  U.int = function (v, d) { return Math.round(U.num(v, d || 0)); };

  /** 千分位；dec=小数位 */
  U.fmt = function (v, dec) {
    var n = U.num(v);
    var s = dec ? n.toFixed(dec) : String(Math.round(n * 100) / 100);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return p.join('.');
  };
  /** 百分比字符串（注意返回的是字符串，如 "86.0%"，不可直接参与数值运算） */
  U.pct = function (a, b, dec) {
    if (!b) return '0%';
    return (U.num(a) / U.num(b) * 100).toFixed(dec === undefined ? 1 : dec) + '%';
  };
  /**
   * 百分比数值（返回 number，如 86）
   * 用于进度条宽度、图表数值、KPI 的 num 等数值上下文；
   * 字符串展示场景请用 U.pct（或 pctNum + '%'）。
   */
  U.pctNum = function (a, b, dec) {
    if (!b) return 0;
    var v = U.num(a) / U.num(b) * 100;
    if (dec === undefined) return Math.round(v * 10) / 10;
    return Math.round(v * Math.pow(10, dec)) / Math.pow(10, dec);
  };
  U.rate = function (a, b) { return b ? U.num(a) / U.num(b) : 0; };

  /** HTML 转义（所有用户可输入内容进 innerHTML 前必须过这里） */
  U.esc = function (s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };

  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- 日期 ---------- */
  var MON = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  U.pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /** Date | 时间戳 | 'YYYY-MM-DD...' → 'YYYY-MM-DD HH:mm' */
  U.dt = function (v, withTime) {
    var d = U.toDate(v);
    if (!d) return '—';
    var s = d.getFullYear() + '-' + MON[d.getMonth()] + '-' + U.pad(d.getDate());
    if (withTime !== false) s += ' ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
    return s;
  };
  U.d = function (v) { return U.dt(v, false); };
  U.hm = function (v) { var d = U.toDate(v); return d ? U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) : '—'; };

  U.toDate = function (v) {
    if (!v && v !== 0) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === 'number') { var d1 = new Date(v); return isNaN(d1.getTime()) ? null : d1; }
    var s = String(v).trim().replace(/-/g, '/').replace(/T/, ' ').replace(/\.\d+Z?$/, '');
    var d2 = new Date(s);
    if (isNaN(d2.getTime())) { d2 = new Date(String(v)); }
    return isNaN(d2.getTime()) ? null : d2;
  };
  /** 生成 'YYYY-MM-DD HH:mm' 字符串 */
  U.at = function (y, m, d, hh, mm) { return y + '-' + MON[m - 1] + '-' + U.pad(d) + ' ' + U.pad(hh || 0) + ':' + U.pad(mm || 0); };
  U.daysBetween = function (a, b) {
    var A = U.toDate(a), B = U.toDate(b); if (!A || !B) return 0;
    return Math.round((B - A) / 86400000);
  };
  /** 相对时间：3 分钟前 / 2 天前 */
  U.ago = function (v, nowTs) {
    var d = U.toDate(v); if (!d) return '—';
    var now = nowTs ? U.toDate(nowTs) : new Date();
    var s = Math.floor((now - d) / 1000);
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
    if (s < 86400) return Math.floor(s / 3600) + ' 小时前';
    if (s < 86400 * 30) return Math.floor(s / 86400) + ' 天前';
    return U.dt(v, false);
  };
  /** 学期：'2025-2026-1' → '2025-2026 学年第一学期' */
  U.termText = function (t) {
    if (!t) return '—';
    var p = String(t).split('-');
    if (p.length < 3) return t;
    return p[0] + '-' + p[1] + ' 学年' + (p[2] === '1' ? '第一' : '第二') + '学期';
  };
  U.termList = function (n, y0) {
    var out = [], y = y0 || 2025;
    for (var i = 0; i < (n || 4); i++) {
      out.push((y - i) + '-' + (y - i + 1) + '-1');
      out.push((y - i) + '-' + (y - i + 1) + '-2');
    }
    return out;
  };

  /* ---------- 数组 / 对象 ---------- */
  U.uniq = function (a) { var m = {}, o = []; a.forEach(function (x) { if (!m[x]) { m[x] = 1; o.push(x); } }); return o; };
  U.pick = function (o, ks) { var r = {}; ks.forEach(function (k) { r[k] = o ? o[k] : undefined; }); return r; };
  U.groupBy = function (arr, fn) {
    var m = {};
    arr.forEach(function (x) { var k = fn(x); (m[k] = m[k] || []).push(x); });
    return m;
  };
  U.countBy = function (arr, fn) {
    var m = {};
    arr.forEach(function (x) { var k = fn(x); m[k] = (m[k] || 0) + 1; });
    return m;
  };
  U.sum = function (arr, fn) { return arr.reduce(function (s, x) { return s + U.num(fn ? fn(x) : x); }, 0); };
  U.avg = function (arr, fn) { return arr.length ? U.sum(arr, fn) / arr.length : 0; };
  /** 四舍五入到指定小数位（默认 1 位，用于学分/学时/积分口径展示） */
  U.round = function (v, d) {
    d = d === undefined ? 1 : d;
    var p = Math.pow(10, d);
    return Math.round(U.num(v) * p) / p;
  };
  U.maxBy = function (arr, fn) {
    if (!arr.length) return null;
    return arr.reduce(function (a, b) { return U.num(fn(b)) > U.num(fn(a)) ? b : a; });
  };
  U.sortBy = function (arr, fn, desc) {
    return arr.slice().sort(function (a, b) {
      var x = fn(a), y = fn(b);
      if (x === y) return 0;
      var r = x > y ? 1 : -1;
      return desc ? -r : r;
    });
  };
  U.topN = function (arr, fn, n, desc) { return U.sortBy(arr, fn, desc === undefined ? true : desc).slice(0, n || 10); };
  U.take = function (arr, n) { return arr.slice(0, n); };
  U.range = function (n, fn) { var o = []; for (var i = 0; i < n; i++) o.push(fn ? fn(i) : i); return o; };
  /** 展开嵌套数组（用于 DOM children） */
  U.flatten = function (a, out) {
    out = out || [];
    (Array.isArray(a) ? a : [a]).forEach(function (x) { Array.isArray(x) ? U.flatten(x, out) : out.push(x); });
    return out;
  };

  /* ---------- 搜索 / 过滤 ---------- */
  U.hit = function (text, kw) {
    if (!kw) return true;
    return String(text === null || text === undefined ? '' : text).toLowerCase().indexOf(String(kw).toLowerCase()) >= 0;
  };
  U.hitAny = function (fields, kw) {
    if (!kw) return true;
    for (var i = 0; i < fields.length; i++) { if (U.hit(fields[i], kw)) return true; }
    return false;
  };

  /* ---------- 中文关键词抽取（展示用，勿动检索分词） ---------- */
  /**
   * 从文本抽取关键词：
   * 1) 连续中文做二元切分并统计频次；
   * 2) 对同频重叠片段做「等频链合并」，还原完整术语；
   * 3) 只保留频次 >= 2 的片段（否则整句会被拼成一长串）；
   * 4) 合并结果必须在原文真实存在（indexOf 校验），过滤片段首尾虚字；
   * 5) 做包含去重（"第二课堂" 与 "课堂" 只留长的）。
   */
  var STOP_HEAD = '的了和与及或在是有为对将把被让使从到向以于其之并且但不也就都还很更最一二三四五六七八九十这那什么怎样如何为是的了';
  var STOP_TAIL = '的了和与及或在是有为对将把被让使从到向以于其之并且但不也就都还很更最一二三四五六七八九十这那什么怎样如何';
  U.keywords = function (text, topN) {
    var src = String(text || '');
    var runs = src.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    var freq = {};
    runs.forEach(function (run) {
      for (var i = 0; i + 2 <= run.length; i++) {
        var g = run.substr(i, 2);
        freq[g] = (freq[g] || 0) + 1;
      }
    });
    // 等频链合并：把 频次相同且首尾相接 的二元组拼回完整词
    var byFreq = {};
    Object.keys(freq).forEach(function (k) { (byFreq[freq[k]] = byFreq[freq[k]] || []).push(k); });
    var merged = {};
    Object.keys(byFreq).forEach(function (f) {
      var list = byFreq[f]; if (Number(f) < 2) return;
      var used = {};
      list.forEach(function (k) {
        if (used[k]) return;
        var word = k; used[k] = 1;
        var grew = true;
        while (grew) {
          grew = false;
          for (var i = 0; i < list.length; i++) {
            var c = list[i];
            if (used[c]) continue;
            if (c.charAt(0) === word.charAt(word.length - 1)) { word += c.charAt(1); used[c] = 1; grew = true; break; }
            if (c.charAt(1) === word.charAt(0)) { word = c.charAt(0) + word; used[c] = 1; grew = true; break; }
          }
        }
        // 原文存在性校验
        if (word.length >= 2 && src.indexOf(word) >= 0) {
          merged[word] = (merged[word] || 0) + Number(f);
        }
      });
    });
    var arr = Object.keys(merged).map(function (k) { return { w: k, v: merged[k] }; });
    // 纯二元片段也保留（若未被合并吸收）
    Object.keys(freq).forEach(function (k) {
      if (freq[k] < 2) return;
      var absorbed = arr.some(function (x) { return x.w.indexOf(k) >= 0; });
      if (!absorbed) arr.push({ w: k, v: freq[k] });
    });
    // 首尾虚字过滤
    arr = arr.filter(function (x) {
      if (x.w.length < 2) return false;
      if (STOP_HEAD.indexOf(x.w.charAt(0)) >= 0) return false;
      if (STOP_TAIL.indexOf(x.w.charAt(x.w.length - 1)) >= 0) return false;
      return true;
    });
    // 重算频次为真实出现次数，并统计「词边界出现次数」
    // 边界规则：出现位置的前一个或后一个字符不是中文时，视为独立成词
    // —— 用于剔除「校园歌手大赛」里切出来的「园歌手大」这类中间残片
    var isCJK = /[\u4e00-\u9fa5]/;
    arr.forEach(function (x) {
      var n = 0, from = 0, idx, boundary = 0;
      while ((idx = src.indexOf(x.w, from)) >= 0) {
        var prev = idx > 0 ? src.charAt(idx - 1) : '';
        var next = idx + x.w.length < src.length ? src.charAt(idx + x.w.length) : '';
        if (!isCJK.test(prev) || !isCJK.test(next)) boundary++;
        n++; from = idx + x.w.length;
      }
      x.v = n; x.boundary = boundary;
    });
    var FILLER = '欢迎 同学 详情 上传 介绍 免费 领取 如下 以上 以下 请在 可以 一个 我们 你们 他们'.split(' ');
    FILLER.forEach(function (fw) { arr = arr.filter(function (x) { return x.w.indexOf(fw) < 0; }); });
    // 从未在词边界出现过的片段一律丢弃
    arr = arr.filter(function (x) { return x.boundary > 0 && x.w.length >= 2; });
    arr = U.sortBy(arr, function (x) { return x.v * 100 + x.w.length; }, true);
    // 包含去重（长词优先）
    var keep = [];
    arr.forEach(function (x) {
      var dup = keep.some(function (y) { return y.w.indexOf(x.w) >= 0; });
      if (!dup) keep.push(x);
    });
    return keep.slice(0, topN || 18);
  };

  /* ---------- 其他 ---------- */
  U.uid = (function () { var n = 0; return function (p) { n++; return (p || 'id') + '-' + Date.now().toString(36) + '-' + n; }; })();
  U.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  U.debounce = function (fn, ms) {
    var t = null;
    return function () {
      var self = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 220);
    };
  };
  U.throttle = function (fn, ms) {
    var last = 0;
    return function () {
      var now = Date.now(); if (now - last < (ms || 200)) return;
      last = now; fn.apply(this, arguments);
    };
  };
  /** 确定性伪随机（同一 seed 永远同一序列，保证演示数据可复现） */
  U.seedRand = function (seed) {
    var s = seed >>> 0 || 20260922;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };
  U.rndPick = function (rand, arr) { return arr[Math.floor(rand() * arr.length) % arr.length]; };
  U.rndInt = function (rand, a, b) { return a + Math.floor(rand() * (b - a + 1)); };
  /** 生成下载（导出 CSV / 打印用） */
  U.download = function (filename, content, mime) {
    var blob = new Blob(['\ufeff' + content], { type: (mime || 'text/csv') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };
  /** 二维数组 → CSV（转义引号与逗号换行） */
  U.toCSV = function (rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = c === null || c === undefined ? '' : String(c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
  };

  w.ZU = U;
})(window);
