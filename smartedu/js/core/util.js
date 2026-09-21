/* ==========================================================================
   基础工具库 — 全局命名空间 ZK.util
   含中文分词（二元切分）、TF-IDF、确定性随机、格式化等
   ========================================================================== */
window.ZK = window.ZK || {};
window.ZK.pages = window.ZK.pages || {};   /* 页面注册表：各 pages/*.js 在加载时写入 */

(function () {
  "use strict";

  /* ---------- 确定性随机（保证每次演示数据一致） ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    const r = mulberry32(seed);
    return {
      next: r,
      int: (min, max) => Math.floor(r() * (max - min + 1)) + min,
      float: (min, max) => r() * (max - min) + min,
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      picks: (arr, n) => {
        const copy = arr.slice();
        const out = [];
        for (let i = 0; i < n && copy.length; i++) {
          out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
        }
        return out;
      },
      bool: (p) => r() < (p === undefined ? 0.5 : p),
    };
  }

  /* ---------- id ---------- */
  let seq = 0;
  function uid(prefix) {
    seq += 1;
    return (
      (prefix || "id") +
      "_" +
      Date.now().toString(36) +
      "_" +
      seq.toString(36) +
      Math.floor(Math.random() * 1296).toString(36)
    );
  }

  /* ---------- 字符串 ---------- */
  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripHtml(s) {
    return String(s || "").replace(/<[^>]*>/g, "");
  }

  function truncate(s, n) {
    const t = String(s || "");
    return t.length > n ? t.slice(0, n) + "…" : t;
  }

  /* ---------- 中文分词：CJK 二元切分 + 英文/数字整词 ---------- */
  const STOPWORDS = new Set(
    (
      "的 了 和 是 就 都 而 及 与 着 或 一个 没有 我们 你们 他们 它们 这个 那个 这些 那些 不 在 有 也 很 会 到 说 要 去 你 我 他 她 它 们 把 被 让 从 对 向 为 以 于 之 其 则 并 但 因 由 可 能 使 得 地 呢 吗 吧 啊 呀 么 什么 怎么 这样 那样 因为 所以 如果 虽然 但是 并且 以及 一些 一种 进行 通过 具有 可以 需要 应该 能够 已经 正在 上 下 中 内 外 前 后 左 右 为 了 与 和 the a an of to in is are was were be been being and or for on with at by from as it its this that these those we you they he she not no do does did can could will would shall should may might must have has had"
    ).split(/\s+/)
  );

  const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  const WORD_RE = /[A-Za-z][A-Za-z0-9+#.\-_]*|\d+(?:\.\d+)?%?/g;

  /**
   * 分词：返回 token 数组。
   * - 英文/数字：整词（小写化）
   * - 中文：连续 CJK 片段切出二元组 + 单字（单字仅用于高精度全文匹配）
   */
  function tokenize(text) {
    const out = [];
    const s = String(text || "");
    if (!s) return out;

    const words = s.match(WORD_RE);
    if (words) {
      for (const w of words) {
        const lw = w.toLowerCase();
        if (lw.length > 1 || /[a-z0-9]/.test(lw)) out.push(lw);
      }
    }

    // 抽取连续 CJK 段落
    const runs = s.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g);
    if (runs) {
      for (const run of runs) {
        if (run.length === 1) {
          out.push(run);
          continue;
        }
        for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
        for (let i = 0; i < run.length; i++) out.push(run[i]);
      }
    }
    return out.filter((t) => t && !STOPWORDS.has(t));
  }

  /** 词频统计 */
  function termFreq(text) {
    const tf = new Map();
    for (const t of tokenize(text)) tf.set(t, (tf.get(t) || 0) + 1);
    return tf;
  }

  /* 片段词过滤：这些字出现在词首/词尾时，多为固定二元切分留下的残片 */
  const FRAG_HEAD = new Set("的在和与及或为以对于之其所被把从到向由是有不也就而并等该此它他我你们这那些都还又很更最会能要应需请让使将同务致制".split(""));
  const FRAG_TAIL = new Set("的了着过和与及或在为以于之其是有不也就而并等此中上下所被把从到向由使将很更最都还又们个些这那".split(""));

  /** 统计 needle 在 hay 中出现的次数 */
  function countOcc(hay, needle) {
    if (!needle) return 0;
    let c = 0;
    let i = 0;
    for (;;) {
      const j = hay.indexOf(needle, i);
      if (j < 0) break;
      c++;
      i = j + 1;
    }
    return c;
  }

  /**
   * 提取关键词（优先长词）。
   * 固定二元切分会把「情态动词」切成「情态 / 态动 / 动词」这类残片，
   * 这里先做「等频链合并」把这些同频重叠的二元组还原为完整词，再按
   * TF × 长度权重排序、按包含关系去重叠。仅用于词云/要点/脑图等展示，
   * 不影响检索用的 tokenize / termFreq。
   */
  function keywords(text, n) {
    const plain = String(text || "");
    const cand = new Map();

    // 英文 / 数字整词
    const words = plain.match(WORD_RE);
    if (words) {
      for (const w of words) {
        const lw = w.toLowerCase();
        if (lw.length > 1 || /[a-z0-9]/.test(lw)) cand.set(lw, (cand.get(lw) || 0) + 1);
      }
    }

    // CJK 二元组频次 + 按首字倒排
    const bi = new Map();
    const runs = plain.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) || [];
    for (const run of runs) {
      if (run.length < 2) continue;
      for (let i = 0; i + 2 <= run.length; i++) {
        const t = run.slice(i, i + 2);
        bi.set(t, (bi.get(t) || 0) + 1);
      }
    }
    const byHead = new Map();
    bi.forEach((f, t) => {
      const h = t[0];
      if (!byHead.has(h)) byHead.set(h, []);
      byHead.get(h).push(t);
    });

    // 等频链合并：当「尾字续接」的候选二元组频次完全一致且唯一时向后延伸。
    // 只对重复出现的片段（频次 >= 2）合并，否则单次出现的句子会因所有二元组同频而被整句拼接。
    function mergeChain(seed) {
      let term = seed;
      const f = bi.get(seed);
      if (f < 2) return term;
      const used = new Set([seed]);
      for (;;) {
        const tail = term.slice(-1);
        const nexts = (byHead.get(tail) || []).filter((t) => bi.get(t) === f && !used.has(t));
        if (nexts.length !== 1) break;
        const grown = term + nexts[0][1];
        if (grown.length > 6) break;          // 中文术语一般不超过 6 字
        if (plain.indexOf(grown) < 0) break;   // 合并结果必须真实存在，避免拼出伪词
        term = grown;
        used.add(nexts[0]);
      }
      return term;
    }

    bi.forEach((f, t) => {
      const term = mergeChain(t);
      const freq = term === t ? f : countOcc(plain, term);
      cand.set(term, Math.max(cand.get(term) || 0, freq));
    });

    const scored = [];
    for (const [term, freq] of cand) {
      if (term.length < 2) continue;
      if (STOPWORDS.has(term)) continue;
      if (!/[A-Za-z0-9]/.test(term)) {
        if (FRAG_HEAD.has(term[0])) continue;
        if (FRAG_TAIL.has(term[term.length - 1])) continue;
      }
      const lenBonus = 1 + Math.min(term.length - 2, 3) * 0.5;
      scored.push({ term, score: freq * lenBonus });
    }
    scored.sort((a, b) => b.score - a.score);

    // 去重叠：长词优先，已被保留长词包含的短词丢弃
    const kept = [];
    const dropped = new Set();
    for (const s of scored) {
      if (dropped.has(s.term)) continue;
      let dup = false;
      for (const k of kept) {
        if (k.term.includes(s.term) || s.term.includes(k.term)) {
          dup = true;
          break;
        }
      }
      if (dup) continue;
      kept.push(s);
      for (const t of cand.keys()) {
        if (t !== s.term && s.term.includes(t)) dropped.add(t);
      }
      if (kept.length >= (n || 40)) break;
    }
    return kept;
  }

  /** 中英混排断句 */
  function splitSentences(text) {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    if (!s) return [];
    const parts = s.split(/(?<=[。！？!?；;])|(?<=\.)\s+/);
    return parts.map((p) => p.trim()).filter((p) => {
      const len = p.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "").length;
      return len >= 8;
    });
  }

  /* ---------- 数字/日期 ---------- */
  function num(n, digits) {
    if (n === null || n === undefined || isNaN(n)) return "0";
    return Number(n).toLocaleString("zh-CN", {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0,
    });
  }

  function pct(n, digits) {
    return (Number(n) || 0).toFixed(digits === undefined ? 1 : digits) + "%";
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function fmtDate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate());
  }

  function fmtDateTime(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return fmtDate(dt) + " " + pad2(dt.getHours()) + ":" + pad2(dt.getMinutes());
  }

  function fmtTime(ts) {
    const dt = new Date(ts);
    const diff = Date.now() - dt.getTime();
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
    if (diff < 86400000) return Math.floor(diff / 3600000) + " 小时前";
    if (diff < 604800000) return Math.floor(diff / 86400000) + " 天前";
    return fmtDate(dt);
  }

  function daysAgo(n) {
    return Date.now() - n * 86400000;
  }

  /* ---------- 数值 ---------- */
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function round(v, digits) {
    const f = Math.pow(10, digits === undefined ? 0 : digits);
    return Math.round(v * f) / f;
  }

  function avg(arr) {
    if (!arr || !arr.length) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  function sum(arr) {
    return (arr || []).reduce((s, v) => s + (Number(v) || 0), 0);
  }

  function bytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    if (n < 1073741824) return (n / 1048576).toFixed(1) + " MB";
    return (n / 1073741824).toFixed(2) + " GB";
  }

  function riskLevel(v) {
    if (v >= 70) return { key: "high", label: "高风险", cls: "badge-red", color: "#1d4ed8" };
    if (v >= 40) return { key: "mid", label: "中风险", cls: "badge-amber", color: "#0ea5e9" };
    return { key: "low", label: "低风险", cls: "badge-emerald", color: "#2563eb" };
  }

  /* ---------- 数值格式化：分数档位 ---------- */
  function grade(score) {
    if (score >= 90) return { label: "优秀", cls: "badge-emerald" };
    if (score >= 80) return { label: "良好", cls: "badge-blue" };
    if (score >= 70) return { label: "中等", cls: "badge-cyan" };
    if (score >= 60) return { label: "及格", cls: "badge-amber" };
    return { label: "待提升", cls: "badge-red" };
  }

  /* ---------- DOM ---------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /** 把子节点挂到 parent 上：字符串/数字转文本节点，数组递归展开，空值跳过 */
  function appendChildDeep(parent, c) {
    if (c === null || c === undefined || c === false || c === true) return;
    if (Array.isArray(c)) {
      for (const item of c) appendChildDeep(parent, item);
      return;
    }
    parent.appendChild(
      typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c
    );
  }

  /* 枚举型 HTML 属性：值为 true 时需写成 "true"，空字符串会被浏览器按默认值处理
     （例如 draggable="" 会被解析为 auto，元素将无法拖拽） */
  const ENUM_ATTRS = { draggable: 1, contenteditable: 1, spellcheck: 1, translate: 1, dir: 1 };

  /** 创建元素：el('div', {class:'x', onclick:fn}, [child, 'text']) */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === "class" || k === "className") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k === "dataset" && typeof v === "object") Object.assign(node.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v === true) node.setAttribute(k, ENUM_ATTRS[k] ? "true" : "");
        else node.setAttribute(k, v);
      }
    }
    if (children) appendChildDeep(node, children);
    return node;
  }

  function frag(children) {
    const f = document.createDocumentFragment();
    appendChildDeep(f, children);
    return f;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function on(node, evt, sel, handler) {
    node.addEventListener(evt, function (e) {
      const t = e.target.closest(sel);
      if (t && node.contains(t)) handler(e, t);
    });
  }

  /* ---------- 事件总线 ---------- */
  const bus = {};
  function emit(name, payload) {
    (bus[name] || []).forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.warn("[bus]", name, err);
      }
    });
  }
  function listen(name, fn) {
    (bus[name] = bus[name] || []).push(fn);
    return () => {
      bus[name] = (bus[name] || []).filter((f) => f !== fn);
    };
  }

  function debounce(fn, ms) {
    let t = 0;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms || 200);
    };
  }

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  /* ---------- 下载 ---------- */
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadCsv(filename, rows) {
    const csv = rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c === null || c === undefined ? "" : c);
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
          })
          .join(",")
      )
      .join("\n");
    download(filename, "\ufeff" + csv, "text/csv;charset=utf-8");
  }

  ZK.util = {
    makeRng, uid, escapeHtml, stripHtml, truncate,
    tokenize, termFreq, keywords, splitSentences,
    num, pct, fmtDate, fmtDateTime, fmtTime, daysAgo,
    clamp, round, avg, sum, bytes, riskLevel, grade,
    $, $$, el, frag, clear, on, emit, listen, debounce, sleep,
    download, downloadCsv, STOPWORDS, CJK_RE,
  };
})();
