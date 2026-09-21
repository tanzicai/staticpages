/* ==========================================================================
   UI 组件与图表 — ZK.ui
   全部返回原生 DOM 节点，用于页面装配；图表为自绘 SVG（数据驱动）
   ========================================================================== */
window.ZK = window.ZK || {};

(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;

  const TONES = {
    emerald: { color: "#2563eb", bright: "#60a5fa", dim: "rgba(37,99,235,0.16)", cls: "badge-emerald", ic: "ic-emerald" },
    blue: { color: "#3b82f6", bright: "#60a5fa", dim: "rgba(59,130,246,0.15)", cls: "badge-blue", ic: "ic-blue" },
    amber: { color: "#0ea5e9", bright: "#38bdf8", dim: "rgba(14, 165, 233,0.15)", cls: "badge-amber", ic: "ic-amber" },
    red: { color: "#1d4ed8", bright: "#3b82f6", dim: "rgba(29, 78, 216,0.15)", cls: "badge-red", ic: "ic-red" },
    orange: { color: "#38bdf8", bright: "#7dd3fc", dim: "rgba(56, 189, 248,0.15)", cls: "badge-amber", ic: "ic-orange" },
    violet: { color: "#6366f1", bright: "#a5b4fc", dim: "rgba(99, 102, 241,0.15)", cls: "badge-violet", ic: "ic-violet" },
    indigo: { color: "#6366f1", bright: "#a5b4fc", dim: "rgba(99,102,241,0.15)", cls: "badge-indigo", ic: "ic-indigo" },
    cyan: { color: "#0ea5e9", bright: "#7dd3fc", dim: "rgba(14, 165, 233,0.15)", cls: "badge-cyan", ic: "ic-cyan" },
    gray: { color: "#6b7280", bright: "#9ca3af", dim: "rgba(107,114,128,0.15)", cls: "badge-gray", ic: "ic-gray" },
  };

  function tone(t) {
    return TONES[t] || TONES.emerald;
  }

  /* ---------------- 基础块 ---------------- */
  function badge(text, t, withDot) {
    return h("span", { class: "badge " + (tone(t).cls || t) }, [
      withDot ? h("i", { class: "badge-dot" }) : null,
      text,
    ]);
  }

  function progress(value, t, thin) {
    return h("div", { class: "progress" + (thin ? " thin" : "") }, [
      h("i", {
        class: t && t !== "emerald" ? t : "",
        style: { width: Math.max(0, Math.min(100, value)) + "%" },
      }),
    ]);
  }

  function progressLine(value, t, label) {
    return h("div", { class: "progress-line" }, [
      progress(value, t),
      h("span", { class: "pl-val", text: label === undefined ? U.round(value) + "%" : label }),
    ]);
  }

  function statCard(o) {
    const t = tone(o.tone);
    return h("div", { class: "stat-card" }, [
      h("div", { class: "sc-top" }, [
        h("div", { class: "stat-icon " + t.ic, html: o.icon || ZK.icons.chart(18) }),
        o.target ? h("span", { class: "sc-target", text: o.target }) : null,
      ]),
      h("div", { class: "sc-value", text: o.value }),
      h("div", { class: "sc-label" }, [
        o.label,
        o.delta
          ? h("span", { class: "sc-delta " + o.delta.dir, style: { marginLeft: "8px" }, text: o.delta.text })
          : null,
      ]),
      o.progress !== undefined ? progress(o.progress, o.tone) : null,
    ]);
  }

  function card(o) {
    const head =
      o.title || o.actions
        ? h("div", { class: "card-head" }, [
            h("div", {}, [
              h("h3", {}, [o.icon ? h("span", { html: o.icon, style: { color: "var(--accent-bright)" } }) : null, o.title]),
              o.sub ? h("div", { class: "ch-sub", text: o.sub }) : null,
            ]),
            o.actions ? h("div", { class: "page-actions" }, o.actions) : null,
          ])
        : null;
    return h("div", { class: "card " + (o.class || "") }, [
      head,
      h("div", { class: "card-body " + (o.bodyClass || "") }, o.body || []),
      o.foot ? h("div", { class: "card-foot" }, o.foot) : null,
    ]);
  }

  function empty(o) {
    return h("div", { class: "empty" }, [
      h("div", { class: "empty-icon", html: (o && o.icon) || ZK.icons.list(22) }),
      h("b", { text: (o && o.title) || "暂无数据" }),
      h("p", { text: (o && o.desc) || "当前条件下没有匹配的记录。" }),
      o && o.action ? h("div", { class: "mt-16" }, [o.action]) : null,
    ]);
  }

  function kv(pairs) {
    const frag = document.createDocumentFragment();
    pairs.forEach((p) => {
      frag.appendChild(h("dt", { text: p[0] }));
      frag.appendChild(
        h("dd", {}, typeof p[1] === "string" || typeof p[1] === "number" ? String(p[1]) : p[1])
      );
    });
    const dl = h("dl", { class: "kv" });
    dl.appendChild(frag);
    return dl;
  }

  function listRow(o) {
    return h("button", { class: "list-row", onclick: o.onclick || null }, [
      h("div", { class: "lr-icon " + (o.tone ? tone(o.tone).ic : ""), html: o.icon || ZK.icons.file(16) }),
      h("div", { class: "lr-main" }, [h("b", { text: o.title }), h("span", { text: o.sub || "" })]),
      o.tail ? h("div", { class: "lr-tail" }, o.tail) : null,
    ]);
  }

  /* ---------------- 表格（可排序 + 分页 + 搜索） ---------------- */
  /**
   * columns: [{key, label, width, sortable, align, render(row)->node|string, sortValue(row)}]
   */
  function table(o) {
    const host = h("div");
    const state = {
      sortKey: o.sortKey || null,
      sortDir: o.sortDir || "desc",
      page: 1,
      pageSize: o.pageSize || 10,
      keyword: "",
    };

    function filtered() {
      let rows = (o.rows || []).slice();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        rows = rows.filter((r) =>
          (o.searchKeys || Object.keys(r)).some((k) => String(r[k] === undefined ? "" : r[k]).toLowerCase().indexOf(kw) >= 0)
        );
      }
      if (state.sortKey) {
        const col = o.columns.find((c) => c.key === state.sortKey);
        const getV = col && col.sortValue ? col.sortValue : (r) => r[state.sortKey];
        rows.sort((a, b) => {
          const va = getV(a);
          const vb = getV(b);
          let r;
          if (typeof va === "number" && typeof vb === "number") r = va - vb;
          else r = String(va === undefined ? "" : va).localeCompare(String(vb === undefined ? "" : vb), "zh-CN");
          return state.sortDir === "asc" ? r : -r;
        });
      }
      return rows;
    }

    function render() {
      U.clear(host);
      const rows = filtered();
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / state.pageSize));
      if (state.page > pages) state.page = pages;
      const start = (state.page - 1) * state.pageSize;
      const pageRows = rows.slice(start, start + state.pageSize);

      const thead = h("thead");
      const tr = h("tr");
      o.columns.forEach((c) => {
        tr.appendChild(
          h(
            "th",
            {
              class:
                (c.sortable ? "sortable " : "") +
                (state.sortKey === c.key ? "sorted " : "") +
                (c.align === "right" ? "num" : ""),
              style: c.width ? { width: c.width } : null,
              onclick: c.sortable
                ? () => {
                    if (state.sortKey === c.key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
                    else {
                      state.sortKey = c.key;
                      state.sortDir = c.defaultDir || "desc";
                    }
                    render();
                  }
                : null,
            },
            [c.label, c.sortable ? h("span", { class: "sort-caret", text: state.sortKey === c.key ? (state.sortDir === "asc" ? "▲" : "▼") : "◆" }) : null]
          )
        );
      });
      thead.appendChild(tr);

      const tbody = h("tbody");
      if (!pageRows.length) {
        tbody.appendChild(
          h("tr", {}, [
            h("td", { colspan: o.columns.length, style: { padding: "0" } }, [
              empty({ title: o.emptyTitle || "没有匹配的记录", desc: o.emptyDesc || "调整筛选条件或搜索关键词后重试。" }),
            ]),
          ])
        );
      }
      pageRows.forEach((r) => {
        const rowTr = h("tr", { onclick: o.onRowClick ? () => o.onRowClick(r) : null, style: o.onRowClick ? { cursor: "pointer" } : null });
        o.columns.forEach((c) => {
          const cell = h("td", { class: c.align === "right" ? "num " : "" + (c.cellClass || "") });
          const v = c.render ? c.render(r) : r[c.key];
          if (v instanceof Node) cell.appendChild(v);
          else cell.innerHTML = v === undefined || v === null ? '<span class="cell-muted">—</span>' : String(v);
          rowTr.appendChild(cell);
        });
        tbody.appendChild(rowTr);
      });

      const tbl = h("table", { class: "tbl" }, [thead, tbody]);
      const wrap = h("div", { class: "table-wrap" }, [tbl]);
      host.appendChild(wrap);

      if (o.toolbar !== false) {
        const toolbar = h("div", { class: "row-between", style: { padding: "12px 16px", borderBottom: "1px solid var(--border-default)" } }, [
          h("div", { class: "row" }, [
            h("span", { class: "fs-12 faint", text: "共 " + total + " 条记录" }),
            o.pageSizeOptions === false
              ? null
              : h("select", {
                  class: "select",
                  style: { width: "104px", padding: "5px 26px 5px 9px", fontSize: "12px" },
                  onchange: (e) => {
                    state.pageSize = Number(e.target.value);
                    state.page = 1;
                    render();
                  },
                }, [10, 20, 50].map((n) => h("option", { value: n, selected: n === state.pageSize, text: n + " 条/页" }))),
          ]),
          h("div", { class: "search-box", style: { width: "230px" } }, [
            h("span", { html: ZK.icons.search(14) }),
            h("input", {
              class: "input",
              placeholder: o.searchPlaceholder || "搜索…",
              value: state.keyword,
              oninput: U.debounce((e) => {
                state.keyword = e.target.value.trim();
                state.page = 1;
                const pos = e.target.selectionStart;
                render();
                const inp = host.querySelector("input.input");
                if (inp) {
                  inp.focus();
                  try { inp.setSelectionRange(pos, pos); } catch (err) { void err; }
                }
              }, 220),
            }),
          ]),
        ]);
        host.insertBefore(toolbar, wrap);
      }

      if (pages > 1) {
        const pager = h("div", { class: "row-between", style: { padding: "12px 16px" } });
        const btns = h("div", { class: "pager" });
        btns.appendChild(
          h("button", {
            text: "‹",
            disabled: state.page === 1,
            onclick: () => {
              state.page -= 1;
              render();
            },
          })
        );
        const nums = [];
        const from = Math.max(1, state.page - 2);
        const to = Math.min(pages, from + 4);
        if (from > 1) nums.push(1, "…");
        for (let i = from; i <= to; i++) nums.push(i);
        if (to < pages) nums.push("…", pages);
        nums.forEach((n) => {
          if (n === "…") btns.appendChild(h("span", { class: "faint fs-12", style: { padding: "0 4px" }, text: "…" }));
          else
            btns.appendChild(
              h("button", {
                class: n === state.page ? "on" : "",
                text: String(n),
                onclick: () => {
                  state.page = n;
                  render();
                },
              })
            );
        });
        btns.appendChild(
          h("button", {
            text: "›",
            disabled: state.page === pages,
            onclick: () => {
              state.page += 1;
              render();
            },
          })
        );
        pager.appendChild(h("span", { class: "fs-12 faint", text: "第 " + state.page + " / " + pages + " 页" }));
        pager.appendChild(btns);
        host.appendChild(pager);
      }
    }

    render();
    host.rerender = render;
    return host;
  }

  /* ---------------- 图表（自绘 SVG） ---------------- */
  function ring(o) {
    const size = o.size || 96;
    const stroke = o.stroke || 8;
    const r = size / 2 - stroke / 2 - 1;
    const circ = 2 * Math.PI * r;
    const pct = U.clamp(o.pct || 0, 0, 100);
    const offset = circ - (pct / 100) * circ;
    const color = o.color || "#2563eb";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);
    svg.style.transform = "rotate(-90deg)";

    const c1 = document.createElementNS(ns, "circle");
    c1.setAttribute("cx", size / 2);
    c1.setAttribute("cy", size / 2);
    c1.setAttribute("r", r);
    c1.setAttribute("fill", "none");
    c1.setAttribute("stroke", "#1f2937");
    c1.setAttribute("stroke-width", stroke);
    svg.appendChild(c1);

    const c2 = document.createElementNS(ns, "circle");
    c2.setAttribute("cx", size / 2);
    c2.setAttribute("cy", size / 2);
    c2.setAttribute("r", r);
    c2.setAttribute("fill", "none");
    c2.setAttribute("stroke", color);
    c2.setAttribute("stroke-width", stroke);
    c2.setAttribute("stroke-linecap", "round");
    c2.setAttribute("stroke-dasharray", circ);
    c2.setAttribute("stroke-dashoffset", offset);
    svg.appendChild(c2);

    const wrap = h("div", { class: "ring-item" });
    const holder = h("div", { style: { position: "relative", width: size + "px", height: size + "px" } });
    holder.appendChild(svg);
    holder.appendChild(
      h(
        "div",
        {
          style: {
            position: "absolute",
            inset: "0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        [
          h("span", { style: { fontSize: Math.round(size * 0.2) + "px", fontWeight: "700" }, text: o.text || U.round(pct) + "%" }),
          o.sub ? h("span", { style: { fontSize: "10.5px", color: "var(--text-faint)" }, text: o.sub }) : null,
        ]
      )
    );
    wrap.appendChild(holder);
    if (o.label) wrap.appendChild(h("div", { class: "ri-label", text: o.label }));
    if (o.value) wrap.appendChild(h("div", { class: "ri-val", text: o.value }));
    return wrap;
  }

  function bars(o) {
    const data = o.data || [];
    const max = o.max || Math.max.apply(null, data.map((d) => d.value).concat([1]));
    return h(
      "div",
      { class: "bars" + (o.stacked ? " stacked" : "") },
      data.map((d) =>
        h("div", { class: "bar-col", title: (d.tip || d.label + "：" + d.value) }, [
          o.showValue === false ? null : h("span", { class: "bar-val", text: d.display !== undefined ? d.display : U.round(d.value) }),
          h("div", { class: "bar-track" }, [
            h("div", {
              class: "bar-fill " + (d.tone || ""),
              style: { height: Math.max(2, (d.value / max) * 100) + "%" },
            }),
          ]),
          h("span", { class: "bar-label", text: d.label }),
        ])
      )
    );
  }

  function lineChart(o) {
    const w = o.width || 640;
    const hgt = o.height || 190;
    const pad = { top: 18, right: 18, bottom: 28, left: 38 };
    const series = o.series || [];
    const labels = o.labels || [];
    const all = series.reduce((s, x) => s.concat(x.data), []);
    const max = o.max !== undefined ? o.max : Math.max.apply(null, all.concat([1]));
    const min = o.min !== undefined ? o.min : 0;
    const iw = w - pad.left - pad.right;
    const ih = hgt - pad.top - pad.bottom;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + hgt);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", hgt);
    svg.setAttribute("role", "img");

    const title = document.createElementNS(ns, "title");
    title.textContent = (o.title || "趋势图") + "：" + series.map((s) => s.name).join("、");
    svg.appendChild(title);

    // 网格与 Y 轴
    const gridN = 4;
    for (let i = 0; i <= gridN; i++) {
      const y = pad.top + (ih / gridN) * i;
      const ln = document.createElementNS(ns, "line");
      ln.setAttribute("x1", pad.left);
      ln.setAttribute("x2", w - pad.right);
      ln.setAttribute("y1", y);
      ln.setAttribute("y2", y);
      ln.setAttribute("stroke", "#1f2937");
      ln.setAttribute("stroke-width", "1");
      svg.appendChild(ln);
      const t = document.createElementNS(ns, "text");
      t.setAttribute("x", pad.left - 7);
      t.setAttribute("y", y + 3.5);
      t.setAttribute("text-anchor", "end");
      t.setAttribute("fill", "#6b7280");
      t.setAttribute("font-size", "10");
      t.textContent = U.round(max - ((max - min) / gridN) * i);
      svg.appendChild(t);
    }

    // X 标签
    const step = labels.length > 1 ? iw / (labels.length - 1) : 0;
    labels.forEach((lb, i) => {
      if (labels.length > 8 && i % 2) return;
      const t = document.createElementNS(ns, "text");
      t.setAttribute("x", pad.left + step * i);
      t.setAttribute("y", hgt - 8);
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("fill", "#6b7280");
      t.setAttribute("font-size", "10");
      t.textContent = lb;
      svg.appendChild(t);
    });

    function px(i) {
      return pad.left + (labels.length > 1 ? (iw / (labels.length - 1)) * i : iw / 2);
    }
    function py(v) {
      return pad.top + ih - ((v - min) / (max - min || 1)) * ih;
    }

    series.forEach((s, si) => {
      const pts = s.data.map((v, i) => px(i) + "," + py(v)).join(" ");
      if (s.area) {
        const area = document.createElementNS(ns, "polygon");
        area.setAttribute(
          "points",
          pad.left + "," + (pad.top + ih) + " " + pts + " " + px(s.data.length - 1) + "," + (pad.top + ih)
        );
        area.setAttribute("fill", s.color);
        area.setAttribute("opacity", "0.13");
        svg.appendChild(area);
      }
      const pl = document.createElementNS(ns, "polyline");
      pl.setAttribute("points", pts);
      pl.setAttribute("fill", "none");
      pl.setAttribute("stroke", s.color);
      pl.setAttribute("stroke-width", s.width || 2);
      pl.setAttribute("stroke-linejoin", "round");
      pl.setAttribute("stroke-linecap", "round");
      if (s.dash) pl.setAttribute("stroke-dasharray", s.dash);
      svg.appendChild(pl);

      s.data.forEach((v, i) => {
        const c = document.createElementNS(ns, "circle");
        c.setAttribute("cx", px(i));
        c.setAttribute("cy", py(v));
        c.setAttribute("r", si === 0 ? 3 : 2.4);
        c.setAttribute("fill", "#0b1220");
        c.setAttribute("stroke", s.color);
        c.setAttribute("stroke-width", "1.8");
        const tt = document.createElementNS(ns, "title");
        tt.textContent = (labels[i] || "") + " · " + s.name + "：" + v;
        c.appendChild(tt);
        svg.appendChild(c);
      });
    });

    return svg;
  }

  function radar(o) {
    const size = o.size || 260;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 42;
    const items = o.items || [];
    const n = items.length;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + size + " " + (size - 16));
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", size - 16);
    svg.setAttribute("role", "img");

    function pt(i, ratio) {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + Math.cos(ang) * r * ratio, cy + Math.sin(ang) * r * ratio];
    }

    for (let ringI = 1; ringI <= 4; ringI++) {
      const poly = document.createElementNS(ns, "polygon");
      poly.setAttribute(
        "points",
        items.map((_, i) => pt(i, ringI / 4).join(",")).join(" ")
      );
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "#1f2937");
      poly.setAttribute("stroke-width", "1");
      svg.appendChild(poly);
    }
    items.forEach((_, i) => {
      const ln = document.createElementNS(ns, "line");
      const p = pt(i, 1);
      ln.setAttribute("x1", cx);
      ln.setAttribute("y1", cy);
      ln.setAttribute("x2", p[0]);
      ln.setAttribute("y2", p[1]);
      ln.setAttribute("stroke", "#1f2937");
      svg.appendChild(ln);
    });

    const shape = document.createElementNS(ns, "polygon");
    shape.setAttribute(
      "points",
      items.map((it, i) => pt(i, U.clamp((it.value || 0) / 100, 0, 1)).join(",")).join(" ")
    );
    shape.setAttribute("fill", "rgba(37,99,235,0.22)");
    shape.setAttribute("stroke", "#60a5fa");
    shape.setAttribute("stroke-width", "1.8");
    svg.appendChild(shape);

    items.forEach((it, i) => {
      const p = pt(i, U.clamp((it.value || 0) / 100, 0, 1));
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", p[0]);
      c.setAttribute("cy", p[1]);
      c.setAttribute("r", "3");
      c.setAttribute("fill", "#60a5fa");
      const tt = document.createElementNS(ns, "title");
      tt.textContent = it.name + "：" + it.value;
      c.appendChild(tt);
      svg.appendChild(c);

      const lp = pt(i, 1.2);
      const t = document.createElementNS(ns, "text");
      t.setAttribute("x", lp[0]);
      t.setAttribute("y", lp[1]);
      t.setAttribute("text-anchor", lp[0] < cx - 6 ? "end" : lp[0] > cx + 6 ? "start" : "middle");
      t.setAttribute("fill", "#9ca3af");
      t.setAttribute("font-size", "10");
      t.textContent = U.truncate(it.name, 8);
      svg.appendChild(t);
    });

    return svg;
  }

  /** 简易力导向图 */
  function forceGraph(o) {
    const W = o.width || 900;
    const H = o.height || 460;
    const nodes = o.nodes.map((n, i) => Object.assign({}, n, { x: 0, y: 0, vx: 0, vy: 0, i: i }));
    const nodeMap = {};
    nodes.forEach((n) => (nodeMap[n.id] = n));
    const edges = o.edges.filter((e) => nodeMap[e.source] && nodeMap[e.target]);

    // 初始化位置（按类型分层，确定性）
    const groups = {};
    nodes.forEach((n) => {
      groups[n.type] = groups[n.type] || [];
      groups[n.type].push(n);
    });
    const typeOrder = ["kp", "concept", "tool", "book"];
    typeOrder.forEach((t, gi) => {
      const arr = groups[t] || [];
      arr.forEach((n, i) => {
        const ang = (Math.PI * 2 * i) / Math.max(1, arr.length) + gi * 0.7;
        const rad = t === "kp" ? H * 0.26 : t === "concept" ? H * 0.4 : H * 0.44;
        n.x = W / 2 + Math.cos(ang) * rad * 1.5;
        n.y = H / 2 + Math.sin(ang) * rad;
      });
    });

    // 迭代力学布局
    const k = o.linkDistance || 92;
    for (let iter = 0; iter < 320; iter++) {
      const alpha = 1 - iter / 320;
      // 斥力
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy || 0.01;
          const d = Math.sqrt(d2);
          const rep = (k * k * 1.9) / d2;
          const fx = (dx / d) * rep;
          const fy = (dy / d) * rep;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      // 引力
      edges.forEach((e) => {
        const a = nodeMap[e.source];
        const b = nodeMap[e.target];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const desired = k * (e.rel === "隶属" ? 0.66 : e.rel === "推荐阅读" ? 1.32 : 1);
        const force = (d - desired) * 0.045;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      });
      // 向心 + 更新
      nodes.forEach((n) => {
        n.vx += (W / 2 - n.x) * 0.0055;
        n.vy += (H / 2 - n.y) * 0.012;
        n.x += n.vx * alpha * 0.9;
        n.y += n.vy * alpha * 0.9;
        n.vx *= 0.62;
        n.vy *= 0.62;
        n.x = U.clamp(n.x, 34, W - 34);
        n.y = U.clamp(n.y, 28, H - 28);
      });
    }

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", H);
    svg.style.display = "block";
    svg.setAttribute("role", "img");

    const COLORS = {
      kp: { fill: "#2563eb", stroke: "#60a5fa", text: "#ffffff" },
      concept: { fill: "#1f2937", stroke: "#3b82f6", text: "#dbeafe" },
      tool: { fill: "#1f2937", stroke: "#6366f1", text: "#e0e7ff" },
      book: { fill: "#1f2937", stroke: "#0ea5e9", text: "#e0f2fe" },
    };
    const REL_COLOR = { 前置: "#2563eb", 关联: "#3b82f6", 隶属: "#4b5563", 推荐阅读: "#0ea5e9", 支撑: "#6366f1" };

    const gEdges = document.createElementNS(ns, "g");
    edges.forEach((e) => {
      const a = nodeMap[e.source];
      const b = nodeMap[e.target];
      const ln = document.createElementNS(ns, "line");
      ln.setAttribute("x1", a.x);
      ln.setAttribute("y1", a.y);
      ln.setAttribute("x2", b.x);
      ln.setAttribute("y2", b.y);
      ln.setAttribute("stroke", REL_COLOR[e.rel] || "#374151");
      ln.setAttribute("stroke-width", e.rel === "隶属" ? 0.7 : 1.1);
      ln.setAttribute("opacity", e.rel === "隶属" ? 0.32 : 0.55);
      ln.dataset.source = e.source;
      ln.dataset.target = e.target;
      const tt = document.createElementNS(ns, "title");
      tt.textContent = a.label + " —" + e.rel + "→ " + b.label;
      ln.appendChild(tt);
      gEdges.appendChild(ln);
    });
    svg.appendChild(gEdges);

    const gNodes = document.createElementNS(ns, "g");
    nodes.forEach((n) => {
      const c = COLORS[n.type] || COLORS.concept;
      const r = (n.size || 12) / 2 + (n.type === "kp" ? 5 : 3);
      const g = document.createElementNS(ns, "g");
      g.style.cursor = "pointer";

      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", n.x);
      circle.setAttribute("cy", n.y);
      circle.setAttribute("r", r);
      circle.setAttribute("fill", c.fill);
      circle.setAttribute("stroke", c.stroke);
      circle.setAttribute("stroke-width", n.type === "kp" ? 2 : 1.4);
      g.appendChild(circle);

      const t = document.createElementNS(ns, "text");
      t.setAttribute("x", n.x);
      t.setAttribute("y", n.y + r + 11);
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("fill", n.type === "kp" ? "#e5e7eb" : "#9ca3af");
      t.setAttribute("font-size", n.type === "kp" ? "10.5" : "9.5");
      t.textContent = U.truncate(n.label, 11);
      g.appendChild(t);

      const tt = document.createElementNS(ns, "title");
      tt.textContent = n.label + "（" + ({ kp: "知识点", concept: "概念", tool: "工具方法", book: "推荐图书" }[n.type] || n.type) + "）";
      g.appendChild(tt);

      g.dataset.id = n.id;
      g.addEventListener("mouseenter", () => {
        circle.setAttribute("stroke-width", "3");
        gEdges.childNodes.forEach((ln) => {
          const on = ln.dataset && (ln.dataset.source === n.id || ln.dataset.target === n.id);
          ln.setAttribute("opacity", on ? "0.95" : "0.08");
          ln.setAttribute("stroke-width", on ? "2" : "0.7");
        });
      });
      g.addEventListener("mouseleave", () => {
        circle.setAttribute("stroke-width", n.type === "kp" ? "2" : "1.4");
        gEdges.childNodes.forEach((ln, i) => {
          const e = edges[i];
          if (!e) return;
          ln.setAttribute("opacity", e.rel === "隶属" ? "0.32" : "0.55");
          ln.setAttribute("stroke-width", e.rel === "隶属" ? "0.7" : "1.1");
        });
      });
      if (o.onSelect) g.addEventListener("click", () => o.onSelect(n));
      gNodes.appendChild(g);
    });
    svg.appendChild(gNodes);

    const holder = h("div", { class: "graph-stage", style: { overflow: "hidden" } });
    holder.appendChild(svg);

    if (o.legend !== false) {
      holder.appendChild(
        h("div", { class: "graph-legend" }, [
          h("span", {}, [h("i", { style: { background: "#2563eb" } }), "知识点"]),
          h("span", {}, [h("i", { style: { background: "#3b82f6" } }), "概念"]),
          h("span", {}, [h("i", { style: { background: "#6366f1" } }), "工具方法"]),
          h("span", {}, [h("i", { style: { background: "#0ea5e9" } }), "推荐图书"]),
        ])
      );
    }
    return holder;
  }

  /** 词云 */
  function wordCloud(cloud, max) {
    const items = cloud.slice(0, max || 40);
    return h(
      "div",
      { class: "cloud" },
      items.map((c) =>
        h("span", {
          text: c.term,
          title: c.term + " · 权重 " + c.weight + " · 排名 " + c.rank,
          style: {
            fontSize: Math.round(12 + c.weight * 20) + "px",
            fontWeight: c.weight > 0.62 ? "700" : c.weight > 0.34 ? "600" : "500",
            color: c.color,
            opacity: 0.55 + c.weight * 0.45,
          },
        })
      )
    );
  }

  /** 脑图 */
  function mindmap(mm) {
    const root = h("div", { class: "mindmap" });
    root.appendChild(h("div", { class: "mm-node lv1", text: mm.root }));
    const branches = h("div", { class: "mm-branch" });
    mm.branches.forEach((b) => {
      const box = h("div", { style: { display: "flex", "flex-direction": "column", gap: "6px", "align-items": "flex-start" } });
      box.appendChild(h("div", { class: "mm-node lv2", text: b.title + "（" + b.points.length + "）" }));
      const leaf = h("div", { class: "mm-branch" });
      b.points.forEach((p) => {
        leaf.appendChild(
          h("div", {
            class: "mm-node",
            text: (p.key ? "[" + p.key + "] " : "") + p.text,
            title: p.text,
          })
        );
      });
      box.appendChild(leaf);
      branches.appendChild(box);
    });
    root.appendChild(branches);
    return root;
  }

  /** 评分条（用于评分维度） */
  function scoreScale(dims) {
    const box = h("div", { class: "score-scale" });
    dims.forEach((d) => {
      const ratio = d.weight ? d.score / d.weight : 0;
      const col = ratio >= 0.86 ? "emerald" : ratio >= 0.72 ? "blue" : ratio >= 0.6 ? "amber" : "red";
      const row = h("div", { class: "scale-row", title: (d.role ? d.role + " · " : "") + d.name + "：" + d.score + "/" + d.weight }, [
        h("span", { class: "sr-name", text: (d.role ? d.role.slice(0, 4) + "·" : "") + d.name }),
        progress((d.score / (d.weight || 100)) * 100, col),
        h("span", { class: "sr-val", text: d.score + "/" + d.weight }),
      ]);
      box.appendChild(row);
    });
    return box;
  }

  /* ---------------- 页面标题区 ---------------- */
  function pageHead(o) {
    return h("div", { class: "page-head" }, [
      h("div", {}, [
        h("h1", {}, o.titleNodes || [o.title]),
        o.sub ? h("div", { class: "ph-sub", html: o.sub }) : null,
      ]),
      o.actions && o.actions.length ? h("div", { class: "page-actions" }, o.actions) : null,
    ]);
  }

  function tabs(items, active, onPick) {
    const bar = h("div", { class: "tabs" });
    items.forEach((it) => {
      const id = typeof it === "string" ? it : it.id;
      const label = typeof it === "string" ? it : it.name;
      bar.appendChild(
        h("button", {
          class: id === active ? "on" : "",
          text: label,
          onclick: () => onPick(id),
        })
      );
    });
    return bar;
  }

  ZK.ui = {
    TONES, tone, badge, progress, progressLine, statCard, card, empty, kv, listRow,
    table, ring, bars, lineChart, radar, forceGraph, wordCloud, mindmap, scoreScale,
    pageHead, tabs, h,
  };
})();
