/* ==========================================================================
   ui.js —— 通用 UI 组件库（全部返回真实 DOM 元素）
   关键机制：
   · 全局模态注册表 modalRegistry：路由切换前统一 closeAllModals()，
     并兜底清理游离的 .mask 节点，避免「弹窗跨路由残留盖住新页面」
   · 表格组件内置分页 / 空态 / 行操作，避免各页重复实现
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, C = w.ZC;

  var UI = {};
  var modalRegistry = [];
  var uidSeq = 0;
  function nid(p) { uidSeq++; return (p || 'ui') + uidSeq; }

  /* ===================== 提示 toast ===================== */
  UI.toast = function (title, sub, type) {
    var wrap = document.getElementById('toastWrap');
    if (!wrap) {
      wrap = D.h('div.toast-wrap#toastWrap');
      document.body.appendChild(wrap);
    }
    var t = D.h('div.toast' + (type ? '.' + type : ''),
      D.h('div', {}, D.h('div.tt', title), sub ? D.h('div.ts', sub) : null));
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = '.3s';
      t.style.opacity = '0';
      t.style.transform = 'translateX(24px)';
      setTimeout(function () { t.remove(); }, 320);
    }, 3200);
    return t;
  };

  /* ===================== 弹窗 ===================== */
  /**
   * UI.modal({title, sub, body, foot, size:'wide|slim|xwide', onClose, closable})
   * body/foot 可以是 DOM 元素 / 数组 / 字符串
   * 返回 {el, body, close()}
   */
  UI.modal = function (opt) {
    opt = opt || {};
    var mask = D.h('div.mask');
    var modal = D.h('div.modal' + (opt.size ? '.' + opt.size : ''));
    var hd = D.h('div.modal-h',
      D.h('h3', opt.title || ''),
      opt.sub ? D.h('span.mh-sub', opt.sub) : null,
      D.h('button.x', { html: '✕', title: '关闭' })
    );
    var body = D.h('div.modal-b');
    D.appendChildDeep(body, opt.body || '');
    modal.appendChild(hd);
    modal.appendChild(body);
    var footEl = null;
    if (opt.foot) {
      footEl = D.h('div.modal-f');
      D.appendChildDeep(footEl, opt.foot);
      modal.appendChild(footEl);
    }
    mask.appendChild(modal);

    var rec = { mask: mask, modal: modal, close: close };
    function close() {
      var i = modalRegistry.indexOf(rec);
      if (i >= 0) modalRegistry.splice(i, 1);
      mask.remove();
      if (opt.onClose) { try { opt.onClose(); } catch (e) { console.warn(e); } }
    }
    rec.close = close;
    hd.querySelector('.x').addEventListener('click', close);
    if (opt.closable !== false) {
      mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    }
    document.body.appendChild(mask);
    modalRegistry.push(rec);
    // 打开多个弹窗时，只允许最上层响应 Esc
    if (!document.__escBound) {
      document.__escBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var top = modalRegistry[modalRegistry.length - 1];
        if (top) top.close();
      });
    }
    return { el: modal, body: body, foot: footEl, close: close, mask: mask };
  };
  UI.closeAllModals = function () {
    while (modalRegistry.length) {
      var rec = modalRegistry.pop();
      try { rec.mask.remove(); } catch (e) { }
    }
    // 兜底：清理任何游离的遮罩（例如渲染异常时残留）
    D.qa('.mask').forEach(function (m) { m.remove(); });
  };
  UI.openCount = function () { return modalRegistry.length; };

  /** 确认对话框 */
  UI.confirm = function (opt) {
    opt = opt || {};
    var m = UI.modal({
      title: opt.title || '操作确认',
      size: 'slim',
      body: D.h('div', {},
        D.h('p', { style: 'font-size:13.5px;line-height:1.8' }, opt.text || '确定执行该操作吗？'),
        opt.detail ? D.h('div.pill-note', { style: 'margin-top:10px' }, opt.detail) : null
      ),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, opt.cancelText || '取消'),
        D.h('button.btn.btn-sm' + (opt.danger ? '.btn-dan' : '.btn-p'), {
          onclick: function () {
            m.close();
            if (opt.onOk) opt.onOk();
          }
        }, opt.okText || '确定')
      ]
    });
    return m;
  };

  /** 表单弹窗：fields [{label,required,control,hint,span}] */
  UI.formModal = function (opt) {
    var wrap = D.h('div.frm' + (opt.cols === 2 ? '.c2' : ''));
    (opt.fields || []).forEach(function (f) {
      wrap.appendChild(D.h('div.fld' + (f.span ? '.span2' : ''),
        D.h('label', {}, f.label, f.required ? D.h('i', '*') : null),
        f.control,
        f.hint ? D.h('div.hint', f.hint) : null
      ));
    });
    return UI.modal({
      title: opt.title, sub: opt.sub, size: opt.size || 'wide',
      body: [opt.intro ? D.h('div.req-note', { html: opt.intro }) : null, wrap],
      foot: opt.foot
    });
  };

  /* ===================== 小片段 ===================== */
  UI.icon = function (ch) { return D.h('span', { style: 'font-size:15px;line-height:1' }, ch); };
  UI.icoBox = function (ch, fg, bg, size) {
    return D.h('div', {
      style: 'width:' + (size || 32) + 'px;height:' + (size || 32) + 'px;border-radius:' + (size ? 10 : 9) + 'px;' +
        'display:flex;align-items:center;justify-content:center;font-size:' + (size ? 18 : 15) + 'px;flex:0 0 ' + (size || 32) + 'px;' +
        'background:' + (bg || '#eff6ff') + ';color:' + (fg || '#2563eb')
    }, ch);
  };
  UI.tag = function (text, cls) { return D.h('span.tag' + (cls ? '.' + cls : ''), text); };
  UI.dotTag = function (text, cls) { return D.h('span.tag.dot-tag' + (cls ? '.' + cls : ''), text); };
  UI.muted = function (t) { return D.h('span.muted', t); };
  UI.avatar = function (name, size) {
    var colors = ['linear-gradient(135deg,#60a5fa,#2563eb)', 'linear-gradient(135deg,#34d399,#059669)', 'linear-gradient(135deg,#fbbf24,#d97706)',
      'linear-gradient(135deg,#a78bfa,#7c3aed)', 'linear-gradient(135deg,#22d3ee,#0891b2)', 'linear-gradient(135deg,#fb7185,#e11d48)'];
    var i = 0;
    for (var k = 0; k < String(name).length; k++) i += String(name).charCodeAt(k);
    return D.h('div', {
      style: 'width:' + (size || 30) + 'px;height:' + (size || 30) + 'px;border-radius:50%;display:flex;align-items:center;' +
        'justify-content:center;color:#fff;font-size:' + Math.round((size || 30) * 0.42) + 'px;font-weight:600;flex:0 0 ' + (size || 30) + 'px;' +
        'background:' + colors[i % colors.length]
    }, String(name).slice(-2));
  };
  UI.avatarStack = function (names, max) {
    max = max || 5;
    var shown = names.slice(0, max);
    return D.h('div.avs', shown.map(function (n) {
      var colors = ['linear-gradient(135deg,#60a5fa,#2563eb)', 'linear-gradient(135deg,#34d399,#059669)', 'linear-gradient(135deg,#fbbf24,#d97706)',
        'linear-gradient(135deg,#a78bfa,#7c3aed)', 'linear-gradient(135deg,#22d3ee,#0891b2)'];
      var i = 0; for (var k = 0; k < n.length; k++) i += n.charCodeAt(k);
      return D.h('div.a', { style: 'background:' + colors[i % colors.length], title: n }, n.slice(-1));
    }).concat(names.length > max ? [D.h('div.more', '+' + (names.length - max))] : []));
  };
  UI.empty = function (text, sub, icon) {
    return D.h('div.empty', D.h('div.e-ic', icon || '📭'), D.h('div.e-t', text || '暂无数据'), sub ? D.h('div', sub) : null);
  };
  UI.pill = function (t) { return D.h('span.pill-note', t); };
  UI.kv = function (pairs, opt) {
    opt = opt || {};
    return D.h('dl.kv' + (opt.oneCol ? '.c1' : ''), U.flatten(pairs.map(function (p) {
      return [D.h('dt', p[0]), D.h('dd', p[1])];
    })));
  };
  UI.hr = function () { return D.h('div.hr'); };
  UI.pg = function (pct, cls) {
    return D.h('div.pg' + (cls ? '.' + cls : ''), D.h('span', { style: 'width:' + U.clamp(pct, 0, 100).toFixed(1) + '%' }));
  };
  UI.pgRow = function (pct, label, cls) {
    return D.h('div.pg-row', UI.pg(pct, cls), D.h('div.pv', label || (pct.toFixed(1) + '%')));
  };

  /* ===================== 页头 / 卡片 / 统计卡 ===================== */
  UI.pageHd = function (opt) {
    return D.h('div',
      opt.crumb ? D.h('div.crumb', { html: opt.crumb }) : null,
      D.h('div.page-hd',
        D.h('div', {},
          D.h('h1', opt.title, opt.star ? D.h('span.star-chip', '★ 重点功能') : null, opt.badge || null),
          opt.desc ? D.h('p', opt.desc) : null
        ),
        opt.right ? D.h('div.hd-act', opt.right) : null
      )
    );
  };
  UI.card = function (opt) {
    opt = opt || {};
    var el = D.h('div.card' + (opt.cls ? '.' + opt.cls : ''));
    if (opt.title || opt.right) {
      el.appendChild(D.h('div.card-h',
        D.h('h3', opt.titleIcon ? UI.icon(opt.titleIcon) : null, opt.title || ''),
        opt.sub ? D.h('span.sub', opt.sub) : null,
        opt.right ? D.h('div.hd-r', opt.right) : null
      ));
    }
    var body = D.h('div.card-b' + (opt.tight ? '.tight' : '') + (opt.flush ? '.flush' : ''));
    D.appendChildDeep(body, opt.body);
    el.appendChild(body);
    if (opt.note) el.appendChild(D.h('div.card-note', opt.note));
    return el;
  };
  UI.stat = function (opt) {
    var el = D.h('div.stat' + (opt.onClick ? '.clickable' : ''), {
      onclick: opt.onClick || null
    },
      D.h('div.st-top', UI.icoBox(opt.ic || '📊', opt.fg, opt.bg), D.h('div.lb', opt.label)),
      D.h('div.num', U.fmt(opt.num), opt.unit ? D.h('i', opt.unit) : null),
      opt.foot ? D.h('div.ft', { html: opt.foot }) : null
    );
    return el;
  };
  UI.reqNote = function (text) { return D.h('div.req-note', { html: text }); };

  /* ===================== 开关行 ===================== */
  UI.swRow = function (opt) {
    return D.h('div.sw-row',
      D.h('div', {}, D.h('div.t', opt.title), opt.desc ? D.h('div.d', opt.desc) : null),
      D.h('div.r',
        opt.rightText ? D.h('span.muted', opt.rightText) : null,
        D.h('label.sw', D.h('input', {
          type: 'checkbox', checked: !!opt.checked, disabled: !!opt.disabled,
          onchange: function (e) { if (opt.onChange) opt.onChange(e.target.checked, e); }
        }), D.h('span.sl'))
      )
    );
  };

  /* ===================== 表单控件 ===================== */
  UI.input = function (opt) {
    opt = opt || {};
    return D.h('input', {
      type: opt.type || 'text', value: opt.value === undefined ? '' : opt.value,
      placeholder: opt.placeholder || '', readonly: !!opt.readonly, disabled: !!opt.disabled,
      min: opt.min, max: opt.max, step: opt.step, id: opt.id,
      oninput: opt.onInput || null, onchange: opt.onChange || null
    });
  };
  UI.select = function (opt) {
    opt = opt || {};
    var el = D.h('select', {
      disabled: !!opt.disabled, id: opt.id,
      onchange: function (e) { if (opt.onChange) opt.onChange(e.target.value, e); }
    });
    (opt.options || []).forEach(function (o) {
      var val = Array.isArray(o) ? o[0] : o.value;
      var lab = Array.isArray(o) ? o[1] : o.label;
      el.appendChild(D.h('option', { value: val, selected: String(val) === String(opt.value) }, lab));
    });
    if (opt.value !== undefined && opt.value !== null) el.value = opt.value;
    return el;
  };
  UI.textarea = function (opt) {
    opt = opt || {};
    return D.h('textarea', {
      placeholder: opt.placeholder || '', rows: opt.rows || 3,
      oninput: opt.onInput || null
    }, opt.value || '');
  };
  UI.field = function (opt) {
    return D.h('div.fld' + (opt.span ? '.span' + opt.span : ''),
      D.h('label', {}, opt.label, opt.required ? D.h('i', '*') : null),
      opt.control,
      opt.hint ? D.h('div.hint', opt.hint) : null
    );
  };
  /** 多选/单选筹码 */
  UI.chips = function (opt) {
    var value = opt.multi ? (opt.value || []).slice() : opt.value;
    var host = D.h('div.chips');
    (opt.options || []).forEach(function (o) {
      var val = Array.isArray(o) ? o[0] : (o.value !== undefined ? o.value : o);
      var lab = Array.isArray(o) ? o[1] : (o.label !== undefined ? o.label : o);
      var on = opt.multi ? value.indexOf(val) >= 0 : String(value) === String(val);
      var c = D.h('div.chip' + (on ? '.on' : ''), lab);
      c.addEventListener('click', function () {
        if (opt.multi) {
          var i = value.indexOf(val);
          if (i >= 0) value.splice(i, 1); else value.push(val);
          c.classList.toggle('on');
          if (opt.onChange) opt.onChange(value.slice(), val);
        } else {
          D.qa('.chip', host).forEach(function (x) { x.classList.remove('on'); });
          c.classList.add('on');
          value = val;
          if (opt.onChange) opt.onChange(val);
        }
      });
      host.appendChild(c);
    });
    return host;
  };
  /** 分段控件 */
  UI.seg = function (opt) {
    var host = D.h('div.seg');
    (opt.options || []).forEach(function (o) {
      var val = Array.isArray(o) ? o[0] : o.value;
      var lab = Array.isArray(o) ? o[1] : o.label;
      host.appendChild(D.h('button' + (String(val) === String(opt.value) ? '.on' : ''), {
        onclick: function (e) {
          D.qa('button', host).forEach(function (b) { b.classList.remove('on'); });
          e.currentTarget.classList.add('on');
          if (opt.onChange) opt.onChange(val);
        }
      }, lab));
    });
    return host;
  };
  /** 标签页（返回 {el, set(cur)}） */
  UI.tabs = function (opt) {
    var host = D.h('div.tabs');
    (opt.items || []).forEach(function (it) {
      var val = Array.isArray(it) ? it[0] : it.k;
      var lab = Array.isArray(it) ? it[1] : it.n;
      var cnt = Array.isArray(it) ? null : it.cnt;
      host.appendChild(D.h('div.tab' + (String(val) === String(opt.cur) ? '.on' : ''), {
        dataset: { k: val },
        onclick: function (e) {
          D.qa('.tab', host).forEach(function (b) { b.classList.remove('on'); });
          e.currentTarget.classList.add('on');
          if (opt.onChange) opt.onChange(val);
        }
      }, lab, cnt !== null && cnt !== undefined ? D.h('span.tc', '(' + cnt + ')') : null));
    });
    return host;
  };

  /* ===================== 步骤条 ===================== */
  UI.steps = function (opt) {
    var host = D.h('div.steps');
    (opt.items || []).forEach(function (n, i) {
      var cls = i < opt.cur ? '.done' : (i === opt.cur ? '.cur' : '');
      host.appendChild(D.h('div.step' + cls, D.h('span.n', i < opt.cur ? '✓' : (i + 1)), D.h('span', n)));
      if (i < opt.items.length - 1) host.appendChild(D.h('div.step-line' + (i < opt.cur ? '.done' : '')));
    });
    return host;
  };

  /* ===================== 分页 ===================== */
  UI.pager = function (opt) {
    var total = opt.total || 0, ps = opt.pageSize || 10;
    var pages = Math.max(1, Math.ceil(total / ps));
    var cur = U.clamp(opt.page || 1, 1, pages);
    var host = D.h('div.pager');
    function btn(lab, page, dis, on) {
      return D.h('button' + (on ? '.on' : ''), {
        disabled: !!dis, onclick: function () { if (!dis && opt.onChange) opt.onChange(page); }
      }, lab);
    }
    host.appendChild(btn('‹', cur - 1, cur <= 1));
    var list = [];
    if (pages <= 7) { for (var i = 1; i <= pages; i++) list.push(i); }
    else {
      list.push(1);
      var s = Math.max(2, cur - 2), e = Math.min(pages - 1, cur + 2);
      if (s > 2) list.push('…');
      for (var j = s; j <= e; j++) list.push(j);
      if (e < pages - 1) list.push('…');
      list.push(pages);
    }
    list.forEach(function (p) {
      if (p === '…') { host.appendChild(D.h('span.pz', '…')); return; }
      host.appendChild(btn(String(p), p, false, p === cur));
    });
    host.appendChild(btn('›', cur + 1, cur >= pages));
    host.appendChild(D.h('span.pz', '共 ' + total + ' 条 · 第 ' + cur + '/' + pages + ' 页'));
    return host;
  };

  /* ===================== 数据表格 ===================== */
  /**
   * UI.table({
   *   cols: [{t:'表头', k:'字段', w:120, align:'center', render(row,i)}],
   *   rows: [...], empty:'暂无数据', pageSize, page, onPage, footLeft, rowClick, selectable,
   *   noCard:true  (只返回表格+分页，不包卡片)
   * })
   * 返回 {el, tableEl, footEl}
   */
  UI.table = function (opt) {
    opt = opt || {};
    var ps = opt.pageSize || 0;
    var rows = opt.rows || [];
    var total = rows.length;
    var page = opt.page || 1;
    var shown = ps ? rows.slice((page - 1) * ps, page * ps) : rows;

    var table = D.h('table.tbl' + (opt.mini ? '.mini' : '') + (opt.center ? '.center' : ''));
    var thead = D.h('thead');
    var trh = D.h('tr');
    if (opt.selectable) trh.appendChild(D.h('th', { style: 'width:36px' }, D.h('input.ck', { type: 'checkbox' })));
    (opt.cols || []).forEach(function (c) {
      trh.appendChild(D.h('th', { style: c.w ? 'width:' + (typeof c.w === 'number' ? c.w + 'px' : c.w) : null }, c.t));
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = D.h('tbody');
    if (!shown.length) {
      tbody.appendChild(D.h('tr', D.h('td', {
        colspan: (opt.cols || []).length + (opt.selectable ? 1 : 0),
        style: 'padding:0'
      }, UI.empty(opt.empty || '暂无数据', opt.emptySub))));
    } else {
      shown.forEach(function (r, i) {
        var tr = D.h('tr', { dataset: { id: r.id || '' } });
        if (opt.selectable) {
          tr.appendChild(D.h('td', D.h('input.ck', {
            type: 'checkbox', onclick: function (e) { e.stopPropagation(); if (opt.onSelect) opt.onSelect(r, e.target.checked); }
          })));
        }
        (opt.cols || []).forEach(function (c) {
          var val;
          if (c.render) val = c.render(r, i, page);
          else {
            val = c.k ? r[c.k] : '';
            if (val === null || val === undefined || val === '') val = '—';
          }
          var td = D.h('td', { style: c.align ? 'text-align:' + c.align : null, class: c.cls || null });
          D.appendChildDeep(td, val);
          tr.appendChild(td);
        });
        if (opt.rowClick) {
          tr.style.cursor = 'pointer';
          tr.addEventListener('click', function () { opt.rowClick(r, i); });
        }
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);

    var wrap = D.h('div.tbl-wrap', table);
    var footEl = null;
    var needFoot = ps || opt.footLeft || opt.footNote;
    if (needFoot) {
      footEl = D.h('div.tbl-foot');
      if (opt.footLeft) D.appendChildDeep(footEl, opt.footLeft);
      else footEl.appendChild(D.h('span.muted', opt.footNote || ('共 ' + total + ' 条记录')));
      if (ps) {
        footEl.appendChild(UI.pager({
          total: total, pageSize: ps, page: page,
          onChange: opt.onPage || function () { }
        }));
      }
      if (opt.footRight) D.appendChildDeep(footEl, opt.footRight);
    }

    var el = opt.noCard ? D.h('div', wrap, footEl) : D.h('div', wrap, footEl);
    return { el: el, tableEl: table, tbody: tbody, footEl: footEl };
  };

  /** 常用的「卡片 + 表格」组合 */
  UI.tableCard = function (opt) {
    var t = UI.table(opt);
    return UI.card({
      title: opt.title, sub: opt.sub, right: opt.right, flush: true,
      body: [t.el], note: opt.note, cls: opt.cls
    });
  };

  /* ===================== 小型列表 ===================== */
  /** items: [{rank, name, sub, value, onClick}] */
  UI.miniList = function (items, opt) {
    opt = opt || {};
    if (!items.length) return UI.empty(opt.empty || '暂无数据');
    return D.h('div.mini-list', items.map(function (it, i) {
      var rankCls = '';
      if (it.rank !== undefined) {
        rankCls = it.rank === 1 ? '.top1' : (it.rank === 2 ? '.top2' : (it.rank === 3 ? '.top3' : ''));
      }
      return D.h('div.mini', {
        style: it.onClick ? 'cursor:pointer' : null,
        onclick: it.onClick || null
      },
        it.rank !== undefined ? D.h('div.rk' + rankCls, it.rank) : null,
        it.icon ? UI.icoBox(it.icon, it.fg, it.bg, 28) : null,
        D.h('div', { style: 'flex:1;min-width:0' },
          D.h('div.nm', { title: it.name }, it.name),
          it.sub ? D.h('div', { style: 'font-size:11.5px;color:#9aa8bc;margin-top:1px' }, it.sub) : null
        ),
        it.value !== undefined ? D.h('div.vl', it.value) : null,
        it.tag || null
      );
    }));
  };

  /** 消息/通知条目 */
  UI.listItem = function (opt) {
    return D.h('div.lst-i' + (opt.unread ? '.unread' : ''), { onclick: opt.onClick || null },
      UI.icoBox(opt.icon || '📢', opt.fg, opt.bg, 34),
      D.h('div.li-b',
        D.h('div.li-t', opt.title),
        opt.desc ? D.h('div.li-d', opt.desc) : null,
        opt.meta ? D.h('div.li-m', U.flatten(opt.meta.map(function (m) { return D.h('span', m); }))) : null
      ),
      opt.right || null
    );
  };

  /** 时间线 */
  UI.timeline = function (items) {
    return D.h('div.timeline', items.map(function (it) {
      return D.h('div.tl-i' + (it.tone ? '.' + it.tone : ''),
        D.h('div.tm', it.time || ''),
        D.h('div.tx', { html: it.text || '' }),
        it.desc ? D.h('div.txd', it.desc) : null
      );
    }));
  };

  /** 折叠面板 */
  UI.fold = function (title, body, open) {
    var el = D.h('div.stat-fold' + (open ? '.open' : ''));
    el.appendChild(D.h('div.sf-h', {
      onclick: function () { el.classList.toggle('open'); }
    }, D.h('span.cv', '▶'), D.h('span', title)));
    el.appendChild(D.h('div.sf-b', body));
    return el;
  };

  /* ===================== 过滤条 ===================== */
  /** fields: [{type:'select|input|date', ph, options, value, onChange, key, label, width}] */
  UI.filterBar = function (fields, opt) {
    opt = opt || {};
    var host = D.h('div', { style: 'display:flex;gap:9px;flex-wrap:wrap;align-items:center' });
    fields.forEach(function (f) {
      var ctrl;
      if (f.type === 'select') {
        ctrl = UI.select({ options: f.options, value: f.value, onChange: f.onChange });
      } else if (f.type === 'date') {
        ctrl = UI.input({ type: 'date', value: f.value, onChange: f.onChange });
      } else {
        ctrl = UI.input({ placeholder: f.ph || '搜索…', value: f.value, onInput: f.onChange });
      }
      if (f.width) ctrl.style.width = (typeof f.width === 'number' ? f.width + 'px' : f.width);
      if (f.label) {
        host.appendChild(D.h('div.inline', D.h('span.muted', f.label), ctrl));
      } else host.appendChild(ctrl);
    });
    if (opt.right) host.appendChild(D.h('div', { style: 'margin-left:auto;display:flex;gap:9px;align-items:center;flex-wrap:wrap' }, opt.right));
    return host;
  };

  /** 通用搜索框（防抖） */
  UI.search = function (ph, onInput, width) {
    var t = null;
    var el = UI.input({
      placeholder: ph || '搜索…',
      onInput: function (e) {
        var v = e.target.value;
        clearTimeout(t);
        t = setTimeout(function () { onInput(v); }, 220);
      }
    });
    if (width) el.style.width = (typeof width === 'number' ? width + 'px' : width);
    return el;
  };

  /* ===================== 导出工具（页面共用） ===================== */
  UI.exportCSV = function (filename, cols, rows) {
    var head = cols.map(function (c) { return c.t; });
    var data = rows.map(function (r) {
      return cols.map(function (c) {
        var v = c.raw ? c.raw(r) : (c.render ? undefined : r[c.k]);
        if (v === undefined) v = '';
        return v;
      });
    });
    // 对使用 render 的列，取纯文本
    if (cols.some(function (c) { return c.render && !c.raw; })) {
      data = rows.map(function (r) {
        return cols.map(function (c) {
          if (c.raw) return c.raw(r);
          if (c.render) {
            var node = c.render(r, 0, 1);
            var tmp = D.h('div');
            D.appendChildDeep(tmp, node);
            return String(tmp.textContent || '').trim();
          }
          var v = c.k ? r[c.k] : '';
          return v === null || v === undefined ? '' : v;
        });
      });
    }
    U.download(filename + '.csv', U.toCSV([head].concat(data)));
    UI.toast('已导出 ' + filename, '共 ' + rows.length + ' 条记录', 'ok');
  };

  /** 打印/另存为 PDF（用浏览器打印，保留样式） */
  UI.printHTML = function (title, innerHTML, extraCss) {
    var win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) { UI.toast('浏览器拦截了新窗口', '请允许弹出窗口后重试', 'warn'); return; }
    win.document.write('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>' + title + '</title>' +
      '<style>' +
      'body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#111827;padding:26px;font-size:12.5px;line-height:1.7}' +
      'table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}' +
      'th{background:#f5f8fd;font-weight:600}' +
      '.h1{font-size:19px;font-weight:700;text-align:center;margin-bottom:6px}' +
      '.sub{text-align:center;color:#6b7a90;font-size:11.5px;margin-bottom:16px}' +
      '.h2{font-size:14px;font-weight:700;margin:16px 0 8px;padding-left:8px;border-left:3px solid #2563eb}' +
      '.m{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px}' +
      '.m div{border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;min-width:112px}' +
      '.m b{display:block;font-size:17px}' +
      '.m span{font-size:11px;color:#6b7a90}' +
      '.seal{float:right;width:104px;height:104px;border:2.5px solid #ef4444;border-radius:50%;color:#ef4444;' +
      'display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px;font-weight:700;' +
      'transform:rotate(-8deg);opacity:.85;line-height:1.2;padding:8px;margin-top:10px}' +
      '@media print{@page{margin:12mm}}' +
      (extraCss || '') +
      '</style></head><body>' + innerHTML + '</body></html>');
    win.document.close();
    setTimeout(function () { try { win.focus(); win.print(); } catch (e) { } }, 420);
    UI.toast('已生成打印视图', '在打印窗口中选择「另存为 PDF」即可导出', 'ok');
  };

  w.ZUI = UI;
})(window);
