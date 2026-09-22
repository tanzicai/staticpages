/* ==========================================================================
   dom.js —— DOM 构建助手
   设计要点（都是踩过的坑，别改）：
   1) children 递归展开 appendChildDeep：h('div',{},[a,[b,c]]) 里内层数组若直接交给
      appendChild，真实浏览器会抛 "parameter 1 is not of type 'Node'"，整页降级成异常卡片。
   2) ENUM_ATTRS：draggable / contenteditable / spellcheck / translate 这类枚举属性，
      写成空字符串会被浏览器按默认值处理（draggable="" → auto，元素实际不可拖拽），
      值为 true 时必须输出字符串 "true"。
   3) SVG 必须走 createElementNS，否则不渲染。
   4) h() 的 style 支持对象；on* 支持对象或函数；dataset 支持对象。
   ========================================================================== */
(function (w) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SVG_TAGS = {
    svg: 1, g: 1, path: 1, rect: 1, circle: 1, ellipse: 1, line: 1, polyline: 1, polygon: 1,
    text: 1, tspan: 1, defs: 1, linearGradient: 1, radialGradient: 1, stop: 1, clipPath: 1,
    mask: 1, pattern: 1, use: 1, filter: 1, foreignObject: 1, marker: 1, style: 1, title: 1
  };
  var ENUM_ATTRS = { draggable: 1, contenteditable: 1, spellcheck: 1, translate: 1, hidden: 1 };

  function isNode(x) {
    return x && typeof x === 'object' && typeof x.nodeType === 'number';
  }

  function applyStyle(el, style) {
    if (!style) return;
    if (typeof style === 'string') { el.setAttribute('style', style); return; }
    Object.keys(style).forEach(function (k) {
      var v = style[k];
      if (v === null || v === undefined) return;
      if (k.indexOf('--') === 0) el.style.setProperty(k, String(v));
      else el.style[k] = v;
    });
  }

  function setAttrs(el, attrs) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class' || k === 'className') { el.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : String(v)); return; }
      if (k === 'style') { applyStyle(el, v); return; }
      if (k === 'dataset' || k === 'data') {
        Object.keys(v).forEach(function (dk) {
          if (v[dk] === null || v[dk] === undefined) return;
          el.setAttribute('data-' + dk, String(v[dk]));
        });
        return;
      }
      if (k === 'html' || k === 'innerHTML') { el.innerHTML = v === null || v === undefined ? '' : String(v); return; }
      if (k === 'text' || k === 'textContent') { el.textContent = v === null || v === undefined ? '' : String(v); return; }
      if (k === 'value') { el.value = v === null || v === undefined ? '' : v; return; }
      if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'multiple' || k === 'readOnly' || k === 'required') {
        el[k] = !!v; if (v) el.setAttribute(k.toLowerCase(), k === 'readOnly' ? 'readonly' : k.toLowerCase());
        return;
      }
      if (k.indexOf('on') === 0 && typeof v === 'function') { el.addEventListener(k.slice(2).toLowerCase(), v); return; }
      if (ENUM_ATTRS[k]) { el.setAttribute(k, v === true ? 'true' : String(v)); return; }
      el.setAttribute(k, v === true ? '' : String(v));
    });
  }

  /** 递归把任意嵌套的 children 挂到 el 上 */
  function appendChildDeep(el, child) {
    if (child === null || child === undefined || child === false || child === true) return;
    if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++) appendChildDeep(el, child[i]);
      return;
    }
    if (isNode(child)) { el.appendChild(child); return; }
    // 字符串 / 数字 → 文本节点（不解析 HTML，安全）
    el.appendChild(document.createTextNode(String(child)));
  }

  /**
   * h(tag, attrs, children...)
   * - tag 支持 'div.cls1.cls2#id'
   * - attrs 省略时可直接传 children
   */
  function h(tag, attrs) {
    var children = Array.prototype.slice.call(arguments, 2);
    if (attrs && (isNode(attrs) || typeof attrs === 'string' || typeof attrs === 'number' || Array.isArray(attrs))) {
      children.unshift(attrs); attrs = null;
    }
    var name = 'div', cls = [], id = null, m;
    m = String(tag || 'div').match(/^([a-zA-Z][\w:-]*)?((?:[.#][\w-]+)*)$/);
    if (m) {
      name = m[1] || 'div';
      if (m[2]) {
        m[2].replace(/([.#])([\w-]+)/g, function (_, s, v) {
          if (s === '.') cls.push(v); else id = v;
          return '';
        });
      }
    } else { name = String(tag); }

    var isSvg = !!SVG_TAGS[name];
    var el = isSvg ? document.createElementNS(SVG_NS, name) : document.createElement(name);
    if (cls.length) el.setAttribute('class', cls.join(' '));
    if (id) el.setAttribute('id', id);
    setAttrs(el, attrs);
    for (var i = 0; i < children.length; i++) appendChildDeep(el, children[i]);
    return el;
  }

  /** SVG 专用（强制命名空间） */
  function s(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    setAttrs(el, attrs);
    var children = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < children.length; i++) appendChildDeep(el, children[i]);
    return el;
  }

  var D = {
    h: h, s: s,
    NS: SVG_NS,
    ENUM_ATTRS: ENUM_ATTRS,
    isNode: isNode,
    appendChildDeep: appendChildDeep,

    /** 清空并填充 */
    fill: function (host, child) {
      if (!host) return host;
      while (host.firstChild) host.removeChild(host.firstChild);
      appendChildDeep(host, child);
      return host;
    },
    /** 用 HTML 字符串填充（内部内容须已转义） */
    html: function (host, str) {
      if (!host) return host;
      host.innerHTML = str === null || str === undefined ? '' : String(str);
      return host;
    },
    q: function (sel, root) { return (root || document).querySelector(sel); },
    qa: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },
    /** 事件委托 */
    on: function (root, evt, sel, fn) {
      if (!root) return;
      root.addEventListener(evt, function (e) {
        var t = e.target;
        while (t && t !== root) {
          if (t.matches && t.matches(sel)) { fn.call(t, e, t); return; }
          t = t.parentNode;
        }
      });
    },
    /** 元素文本（去掉多余空白），用于值取读 */
    txt: function (el) { return el ? String(el.textContent || '').trim() : ''; },
    /** 短暂高亮（新增记录后定位） */
    flash: function (el) {
      if (!el) return;
      el.style.transition = 'background .25s';
      el.style.background = '#fff7e6';
      setTimeout(function () { el.style.background = ''; }, 1200);
    },
    /** 输入框百分比进度环（纯 SVG） */
    ring: function (pct, size, color, label) {
      size = size || 62;
      var r = size / 2 - 5, c = 2 * Math.PI * r;
      var off = c * (1 - Math.max(0, Math.min(1, pct)));
      return s('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size },
        s('circle', { cx: size / 2, cy: size / 2, r: r, fill: 'none', stroke: '#eef3fa', 'stroke-width': 6 }),
        s('circle', {
          cx: size / 2, cy: size / 2, r: r, fill: 'none', stroke: color || '#2563eb', 'stroke-width': 6,
          'stroke-linecap': 'round', 'stroke-dasharray': c.toFixed(2), 'stroke-dashoffset': off.toFixed(2),
          transform: 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'
        }),
        s('text', {
          x: size / 2, y: size / 2 + 4, 'text-anchor': 'middle',
          'font-size': size * 0.22, 'font-weight': '700', fill: '#111827'
        }, String(label !== undefined ? label : Math.round(pct * 100) + '%'))
      );
    }
  };

  w.ZD = D;
})(window);
