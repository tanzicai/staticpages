/* ==========================================================================
   domstub.js —— 无头 DOM 桩（自研，零依赖，低内存）
   为什么不用 jsdom：本机可用内存不足以稳定加载 jsdom（进程会被 OOM 杀掉）。
   实现范围：本项目页面/组件实际用到的那部分 DOM + CSS 选择器子集。
   支持的选择器：逗号分组、后代(空格)、子代(>)、标签、.class、#id、[attr]、[attr="v"]。
   ========================================================================== */
'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ----------------------------- 选择器 ----------------------------- */
function parseCompound(c) {
  const out = { tag: null, cls: [], id: null, attrs: [] };
  const re = /([a-zA-Z][\w:-]*)|\.([\w-]+)|#([\w-]+)|\[([\w-]+)(?:([~^$*|]?=)["']?([^\]"']*)["']?)?\]|(\*)/g;
  let m, consumed = 0;
  while ((m = re.exec(c))) {
    consumed += m[0].length;
    if (m[1]) out.tag = m[1].toLowerCase();
    else if (m[2]) out.cls.push(m[2]);
    else if (m[3]) out.id = m[3];
    else if (m[4]) out.attrs.push({ k: m[4], op: m[5] || null, v: m[6] });
  }
  return out;
}
function parseGroup(s) {
  const parts = s.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/).filter(Boolean);
  const out = [];
  let comb = '';
  for (const p of parts) {
    if (p === '>') { comb = '>'; continue; }
    out.push({ comb: comb, comp: parseCompound(p) });
    comb = ' ';
  }
  if (out.length) out[0].comb = '';
  return out;
}
function parseSelector(sel) {
  return String(sel).split(',').map(s => s.trim()).filter(Boolean).map(parseGroup);
}
function matchCompound(el, c) {
  if (!el || el.nodeType !== 1) return false;
  if (c.tag && el.tagName.toLowerCase() !== c.tag) return false;
  if (c.id && el.getAttribute('id') !== c.id) return false;
  for (const cl of c.cls) if (!el.classList.contains(cl)) return false;
  for (const a of c.attrs) {
    const v = el.getAttribute(a.k);
    if (v === null) return false;
    if (a.op === '=' && String(v) !== String(a.v)) return false;
    else if (a.op === '*=' && String(v).indexOf(a.v) < 0) return false;
    else if (a.op === '^=' && String(v).indexOf(a.v) !== 0) return false;
    else if (a.op === '$=' && !String(v).endsWith(a.v)) return false;
    else if (a.op === '~=' && String(v).split(/\s+/).indexOf(a.v) < 0) return false;
  }
  return true;
}
function matchGroup(el, group) {
  let i = group.length - 1;
  if (!matchCompound(el, group[i].comp)) return false;
  let node = el;
  i--;
  while (i >= 0) {
    const comb = group[i + 1].comb;
    const comp = group[i].comp;
    if (comb === '>') {
      node = node.parentNode;
      if (!node || node.nodeType !== 1 || !matchCompound(node, comp)) return false;
    } else {
      let p = node.parentNode, found = null;
      while (p && p.nodeType === 1) { if (matchCompound(p, comp)) { found = p; break; } p = p.parentNode; }
      if (!found) return false;
      node = found;
    }
    i--;
  }
  return true;
}
function matchSelector(el, groups) {
  for (const g of groups) if (matchGroup(el, g)) return true;
  return false;
}

/* ----------------------------- 节点 ----------------------------- */
let NODE_SEQ = 0;

class NodeBase {
  constructor() {
    this.nodeType = 0;
    this.childNodes = [];
    this.parentNode = null;
    this._id = ++NODE_SEQ;
    this._listeners = {};
  }
  get children() { return this.childNodes.filter(n => n.nodeType === 1); }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    const i = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[i + 1] || null;
  }
  get previousSibling() {
    if (!this.parentNode) return null;
    const i = this.parentNode.childNodes.indexOf(this);
    return i > 0 ? this.parentNode.childNodes[i - 1] : null;
  }
  appendChild(n) {
    /* 与真实浏览器保持一致：只接受节点。
       若静默接受非节点（字符串/数字/普通对象/数组），
       页面上会出现「真实浏览器报 TypeError 而自验却通过」的漏检——
       例如 appendChild(UI.table(...)) 传入包装对象。 */
    assertNode(n, 'appendChild');
    if (!n) return n;
    if (n.parentNode) n.parentNode.removeChild(n);
    n.parentNode = this;
    this.childNodes.push(n);
    if (this._onInsert) this._onInsert(n);
    return n;
  }
  insertBefore(n, ref) {
    assertNode(n, 'insertBefore');
    if (!ref) return this.appendChild(n);
    const i = this.childNodes.indexOf(ref);
    if (i < 0) return this.appendChild(n);
    if (n.parentNode) n.parentNode.removeChild(n);
    n.parentNode = this;
    this.childNodes.splice(i, 0, n);
    return n;
  }
  removeChild(n) {
    const i = this.childNodes.indexOf(n);
    if (i >= 0) { this.childNodes.splice(i, 1); n.parentNode = null; }
    return n;
  }
  replaceChild(n, old) {
    const i = this.childNodes.indexOf(old);
    if (i < 0) return old;
    if (n.parentNode) n.parentNode.removeChild(n);
    n.parentNode = this;
    this.childNodes[i] = n;
    old.parentNode = null;
    return old;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  contains(n) {
    let p = n;
    while (p) { if (p === this) return true; p = p.parentNode; }
    return false;
  }
  addEventListener(t, fn) {
    (this._listeners[t] || (this._listeners[t] = [])).push(fn);
  }
  removeEventListener(t, fn) {
    const a = this._listeners[t]; if (!a) return;
    const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
  }
  _fire(evt) {
    const a = this._listeners[evt.type];
    if (a) a.slice().forEach(fn => { try { fn.call(this, evt); } catch (e) { throw e; } });
  }
  dispatchEvent(evt) {
    evt.target = evt.target || this;
    evt.currentTarget = this;
    let node = this, path = [];
    while (node) { path.push(node); node = node.parentNode; }
    for (const n of path) {
      evt.currentTarget = n;
      n._fire(evt);
      if (evt._stop) break;
    }
    return !evt.defaultPrevented;
  }
  /* 遍历自身 + 后代（文档顺序） */
  _walk(out) {
    out.push(this);
    for (const c of this.childNodes) {
      if (c.nodeType === 1) c._walk(out);
    }
    return out;
  }
}

class TextNode extends NodeBase {
  constructor(t) { super(); this.nodeType = 3; this._text = String(t); }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); }
  get data() { return this._text; }
  set data(v) { this._text = String(v); }
  get nodeValue() { return this._text; }
  set nodeValue(v) { this._text = String(v); }
}

class ClassList {
  constructor(el) { this.el = el; }
  _list() { return String(this.el.getAttribute('class') || '').split(/\s+/).filter(Boolean); }
  _save(a) { this.el.setAttribute('class', a.join(' ')); }
  contains(c) { return this._list().indexOf(c) >= 0; }
  add(...cs) { const a = this._list(); cs.forEach(c => { if (c && a.indexOf(c) < 0) a.push(c); }); this._save(a); }
  remove(...cs) { let a = this._list(); cs.forEach(c => { const i = a.indexOf(c); if (i >= 0) a.splice(i, 1); }); this._save(a); }
  toggle(c, force) {
    const has = this.contains(c);
    const want = force === undefined ? !has : !!force;
    if (want) this.add(c); else this.remove(c);
    return want;
  }
  get length() { return this._list().length; }
  toString() { return this._list().join(' '); }
}

class StyleDecl {
  constructor() { this._props = {}; this._css = ''; }
  setProperty(k, v) { this._props[k] = v; if (k.startsWith('--')) this._css += k + ':' + v + ';'; }
  getPropertyValue(k) { return this._props[k] || ''; }
  removeProperty(k) { delete this._props[k]; }
  get cssText() { return this._css; }
  set cssText(v) { this._css = v; }
}

/* 节点校验：与浏览器行为对齐，拒绝非节点入参 */
function assertNode(n, where) {
  if (n === null || n === undefined || n === false) {
    throw new TypeError("Failed to execute '" + where + "': parameter 1 is not of type 'Node'.");
  }
  const ok = typeof n === 'object' && (n.nodeType !== undefined || n.childNodes !== undefined || n.__isStubEl);
  if (!ok) {
    let what = typeof n;
    if (Array.isArray(n)) what = 'array';
    else if (typeof n === 'object') what = 'plain object(' + Object.keys(n).slice(0, 6).join(',') + ')';
    throw new TypeError("Failed to execute '" + where + "': parameter 1 is not of type 'Node' (收到 " + what + ")。" +
      '常见原因：把返回包装对象的组件（如旧版 UI.table 的 {el:…}）直接传给了 appendChild，应改用其 .el。');
  }
  return n;
}

class Element extends NodeBase {
  get __isStubEl() { return true; }
  constructor(tag, ns) {
    super();
    this.nodeType = 1;
    this.tagName = ns ? tag : String(tag).toUpperCase();
    this.localName = String(tag).toLowerCase();
    this.namespaceURI = ns || null;
    this.attributes = {};
    this.classList = new ClassList(this);
    this.style = new StyleDecl();
    this._html = null;
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.selected = false;
    this.readOnly = false;
    this.multiple = false;
    this.scrollTop = 0;
    this._value = undefined;
  }
  setAttribute(k, v) {
    k = String(k);
    this.attributes[k] = v === true ? 'true' : String(v);
    if (k === 'value') this.value = this.attributes[k];
    if (k === 'checked') this.checked = true;
    if (k === 'disabled') this.disabled = true;
    if (k === 'selected') this.selected = true;
  }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attributes, String(k)) ? this.attributes[String(k)] : null; }
  hasAttribute(k) { return this.getAttribute(k) !== null; }
  removeAttribute(k) { delete this.attributes[String(k)]; }
  get id() { return this.getAttribute('id') || ''; }
  set id(v) { this.setAttribute('id', v); }
  get className() { return this.getAttribute('class') || ''; }
  set className(v) { this.setAttribute('class', v); }
  get dataset() {
    const self = this;
    return new Proxy({}, {
      get(_, k) { return self.getAttribute('data-' + k); },
      set(_, k, v) { self.setAttribute('data-' + k, v); return true; },
      has(_, k) { return self.hasAttribute('data-' + k); },
      ownKeys() {
        return Object.keys(self.attributes)
          .filter(a => a.startsWith('data-'))
          .map(a => a.slice(5).replace(/-([a-z])/g, (m, c) => c.toUpperCase()));
      },
      getOwnPropertyDescriptor(_, k) { return { enumerable: true, configurable: true, value: self.getAttribute('data-' + k) }; }
    });
  }
  get innerHTML() { return this._html !== null ? this._html : this.childNodes.map(n => n.textContent).join(''); }
  set innerHTML(v) {
    this._html = v === null || v === undefined ? '' : String(v);
    this.childNodes = [];
    if (this._html) parseHTMLInto(this, this._html);
  }
  get outerHTML() {
    const attrs = Object.keys(this.attributes).map(k => ' ' + k + '="' + this.attributes[k] + '"').join('');
    return '<' + this.localName + attrs + '>' + this.innerHTML + '</' + this.localName + '>';
  }
  get textContent() {
    return this.childNodes.map(n => n.textContent).join('');
  }
  set textContent(v) { this.childNodes = []; this._html = null; this.appendChild(new TextNode(v === null || v === undefined ? '' : v)); }
  get innerText() { return this.textContent; }
  set innerText(v) { this.textContent = v; }
  click() {
    const e = new StubEvent('click', { bubbles: true, cancelable: true });
    return this.dispatchEvent(e);
  }
  focus() { this._focused = true; }
  blur() { this._focused = false; }
  matches(sel) { return matchSelector(this, parseSelector(sel)); }
  closest(sel) {
    const g = parseSelector(sel);
    let n = this;
    while (n && n.nodeType === 1) { if (matchSelector(n, g)) return n; n = n.parentNode; }
    return null;
  }
  querySelector(sel) { const r = this.querySelectorAll(sel); return r[0] || null; }
  querySelectorAll(sel) {
    const groups = parseSelector(sel);
    const all = [];
    for (const c of this.childNodes) if (c.nodeType === 1) c._walk(all);
    return all.filter(el => matchSelector(el, groups));
  }
  getElementsByTagName(t) { return this.querySelectorAll(String(t)); }
  getBoundingClientRect() { return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
  scrollIntoView() { }
  setSelectionRange() { }
  insertAdjacentHTML(pos, html) {
    const tmp = new Element('div');
    parseHTMLInto(tmp, html);
    if (pos === 'beforeend') { tmp.childNodes.slice().forEach(n => this.appendChild(n)); }
    else if (pos === 'afterbegin') { tmp.childNodes.slice().reverse().forEach(n => this.insertBefore(n, this.firstChild)); }
  }
  append(...ns) { ns.forEach(n => this.appendChild(n)); }
  get offsetWidth() { return 120; }
  get offsetHeight() { return 30; }
  get scrollHeight() { return 300; }
}

class Document extends NodeBase {
  constructor() {
    super();
    this.nodeType = 9;
    this.tagName = '#document';
    this.documentElement = new Element('html');
    this.head = new Element('head');
    this.body = new Element('body');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
    this.title = '';
    this._escBound = false;
  }
  createElement(t) { return new Element(t); }
  createElementNS(ns, t) { return new Element(t, ns); }
  createTextNode(t) { return new TextNode(t); }
  createDocumentFragment() { const f = new Element('#fragment'); f.nodeType = 11; return f; }
  getElementById(id) {
    const all = [];
    this.documentElement._walk(all);
    for (const el of all) if (el.nodeType === 1 && el.getAttribute('id') === id) return el;
    return null;
  }
  querySelector(sel) { const r = this.querySelectorAll(sel); return r[0] || null; }
  querySelectorAll(sel) {
    const groups = parseSelector(sel);
    const all = [];
    this.documentElement._walk(all);
    return all.filter(el => el.nodeType === 1 && matchSelector(el, groups));
  }
  getElementsByTagName(t) { return this.querySelectorAll(String(t)); }
  getElementsByClassName(c) { return this.querySelectorAll('.' + c); }
}

/* --------------------- 极简 HTML 解析（够用即可） --------------------- */
const VOID_TAGS = { br: 1, img: 1, input: 1, hr: 1, meta: 1, link: 1, source: 1, col: 1, area: 1, base: 1, embed: 1, track: 1, wbr: 1 };
function parseHTMLInto(host, html) {
  const stack = [host];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--') || m[0].startsWith('<![')) continue;
    if (m[1]) {
      const name = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].localName === name) { stack.length = i; break; }
      }
      continue;
    }
    if (m[2]) {
      const name = m[2].toLowerCase();
      const ns = /^(svg|path|g|rect|circle|ellipse|line|polyline|polygon|text|tspan|defs|linearGradient|radialGradient|stop|clipPath|mask|pattern|use|filter|foreignObject|marker|title)$/.test(name) ? SVG_NS : null;
      const el = ns ? new Element(name, ns) : new Element(name);
      const attrRe = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
      let a;
      while ((a = attrRe.exec(m[3] || ''))) {
        el.setAttribute(a[1], a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : '');
      }
      stack[stack.length - 1].appendChild(el);
      if (!m[4] && !VOID_TAGS[name]) stack.push(el);
      continue;
    }
    if (m[5] !== undefined) {
      const t = m[5];
      if (t.trim()) stack[stack.length - 1].appendChild(new TextNode(t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')));
    }
  }
}

/* ----------------------------- 事件 ----------------------------- */
class StubEvent {
  constructor(type, o) {
    o = o || {};
    this.type = type;
    this.bubbles = !!o.bubbles;
    this.cancelable = !!o.cancelable;
    this.defaultPrevented = false;
    this._stop = false;
    this.target = o.target || null;
    this.currentTarget = null;
    Object.keys(o).forEach(k => { this[k] = o[k]; });
  }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() { this._stop = true; }
  stopImmediatePropagation() { this._stop = true; }
}

/* ----------------------------- 定时器 ----------------------------- */
function makeTimers() {
  let seq = 0;
  const timers = new Map();
  const intervals = new Map();
  const w = {
    setTimeout(fn, ms) { seq++; timers.set(seq, { fn, ms: ms || 0 }); return seq; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn, ms) { seq++; intervals.set(seq, { fn, ms: ms || 0 }); return seq; },
    clearInterval(id) { intervals.delete(id); }
  };
  w.__flush = function (rounds) {
    rounds = rounds || 4;
    for (let r = 0; r < rounds; r++) {
      const batch = Array.from(timers.entries());
      if (!batch.length && !intervals.size) return;
      timers.clear();
      for (const [, t] of batch) { try { t.fn(); } catch (e) { w.__onTimerError && w.__onTimerError(e); } }
      for (const [, t] of Array.from(intervals.entries())) { try { t.fn(); } catch (e) { w.__onTimerError && w.__onTimerError(e); } }
    }
  };
  return w;
}

/* ----------------------------- 组装 window ----------------------------- */
function createWindow() {
  const document = new Document();
  const timers = makeTimers();

  const store = {};
  const localStorage = {
    getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: i => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; }
  };

  const listeners = {};
  let winRef = null;
  let _hash = '';
  const location = {
    href: 'http://localhost/app.html',
    get hash() { return _hash; },
    /* 真实浏览器改 hash 会派发 hashchange；桩里同步派发，保证路由可被驱动 */
    set hash(v) {
      const nv = String(v);
      if (nv === _hash) return;
      _hash = nv;
      if (winRef && winRef._onHashChange) winRef._onHashChange();
    },
    search: '',
    pathname: '/app.html',
    replace(u) { this.href = u; this._replaced = u; },
    assign(u) { this.href = u; this._assigned = u; },
    reload() { }
  };

  const w = {
    document, localStorage, location,
    innerWidth: 1440, innerHeight: 900, scrollX: 0, scrollY: 0,
    navigator: { userAgent: 'stub', clipboard: { writeText: () => Promise.resolve() } },
    addEventListener(t, fn) { (listeners[t] || (listeners[t] = [])).push(fn); },
    removeEventListener(t, fn) { const a = listeners[t]; if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
    dispatchEvent(evt) { (listeners[evt.type] || []).slice().forEach(fn => fn(evt)); return true; },
    scrollTo() { }, focus() { }, print() { }, alert() { }, confirm() { return true; }, prompt() { return null; },
    getComputedStyle() { return { getPropertyValue() { return ''; } }; },
    open() { return null; },
    __flush: timers.__flush,
    __onTimerError: null,
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    setInterval: timers.setInterval, clearInterval: timers.clearInterval,
    requestAnimationFrame(fn) { return timers.setTimeout(fn, 16); },
    cancelAnimationFrame(id) { timers.clearTimeout(id); },
    Blob: class Blob { constructor(parts, o) { this.parts = parts; this.type = (o && o.type) || ''; } },
    URL: { createObjectURL() { return 'blob:stub'; }, revokeObjectURL() { } },
    MouseEvent: class MouseEvent extends StubEvent { constructor(t, o) { super(t, o); } },
    KeyboardEvent: class KeyboardEvent extends StubEvent { constructor(t, o) { super(t, o); } },
    CustomEvent: class CustomEvent extends StubEvent { constructor(t, o) { super(t, o || {}); if (o && o.detail !== undefined) this.detail = o.detail; } },
    Event: StubEvent,
    Element, TextNode, Node: NodeBase, Document,
    FileReader: class FileReader {
      readAsText(file) {
        const self = this;
        timers.setTimeout(() => {
          self.result = file && file.__text !== undefined ? file.__text : '';
          if (self.onload) self.onload({ target: self });
        }, 0);
      }
    }
  };
  w.window = w; w.self = w; w.globalThis = w;
  winRef = w;
  /** hashchange 派发（等价于浏览器 window.onhashchange 链） */
  w._onHashChange = function () {
    (listeners['hashchange'] || []).slice().forEach(fn => { try { fn({ type: 'hashchange' }); } catch (e) { console.error(e); } });
  };
  /** 便捷建元素（供验证台复刻 app.html 外壳） */
  w.__el = function (tag, attrs) {
    const el = new Element(tag);
    Object.keys(attrs || {}).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  };
  w.console = console;
  w.Math = Math; w.JSON = JSON; w.Date = Date; w.Object = Object; w.Array = Array;
  w.String = String; w.Number = Number; w.Boolean = Boolean; w.RegExp = RegExp;
  w.Error = Error; w.TypeError = TypeError; w.Map = Map; w.Set = Set; w.Promise = Promise;
  w.parseInt = parseInt; w.parseFloat = parseFloat; w.isNaN = isNaN; w.isFinite = isFinite;
  w.encodeURIComponent = encodeURIComponent; w.decodeURIComponent = decodeURIComponent;
  w.Intl = Intl;
  return w;
}

module.exports = { createWindow, parseSelector, matchSelector, StubEvent, Element, TextNode, Document };
