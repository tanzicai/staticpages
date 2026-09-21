/* ==========================================================================
   数据层 — ZK.db
   单库内存镜像 + localStorage 持久化（不可用时降级为内存态，功能不受影响）
   集合式 CRUD，全部写操作即时落盘
   ========================================================================== */
window.ZK = window.ZK || {};

(function () {
  "use strict";

  const STORAGE_KEY = "zhikeyun.db.v1";
  const SESSION_KEY = "zhikeyun.session.v1";
  const DB_VERSION = 1;

  let memoryFallback = {};
  let persistOK = true;

  function probe() {
    try {
      const k = "__zk_probe__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  const hasLS = (() => {
    const ok = probe();
    if (!ok) persistOK = false;
    return ok;
  })();

  function rawGet(key) {
    if (!hasLS) return memoryFallback[key] || null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryFallback[key] || null;
    }
  }

  function rawSet(key, val) {
    if (!hasLS) {
      memoryFallback[key] = val;
      return;
    }
    try {
      window.localStorage.setItem(key, val);
      persistOK = true;
    } catch (e) {
      memoryFallback[key] = val;
      persistOK = false;
    }
  }

  function rawDel(key) {
    if (!hasLS) {
      delete memoryFallback[key];
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      delete memoryFallback[key];
    }
  }

  /* ---------------- 状态装载 ---------------- */
  let state = null;

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function load() {
    const raw = rawGet(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.__v === DB_VERSION) {
          state = parsed;
          return;
        }
      } catch (e) {
        console.warn("[db] 本地数据解析失败，重新初始化", e);
      }
    }
    state = ZK.seedData();
    save();
  }

  function save() {
    state.updatedAt = Date.now();
    rawSet(STORAGE_KEY, JSON.stringify(state));
  }

  function reset() {
    state = ZK.seedData();
    save();
    ZK.util.emit("db:reset");
    return state;
  }

  /* ---------------- 通用集合操作 ---------------- */
  function coll(name) {
    if (!state[name]) state[name] = [];
    return state[name];
  }

  function list(name, filterFn) {
    const arr = coll(name);
    return filterFn ? arr.filter(filterFn) : arr.slice();
  }

  function find(name, id) {
    return coll(name).find((x) => x.id === id) || null;
  }

  function insert(name, obj) {
    const rec = Object.assign({ id: obj.id || ZK.util.uid(name), createdAt: Date.now() }, obj);
    coll(name).unshift(rec);
    save();
    ZK.util.emit("db:change", { coll: name, op: "insert", id: rec.id });
    return rec;
  }

  function update(name, id, patch) {
    const rec = find(name, id);
    if (!rec) return null;
    Object.assign(rec, patch, { updatedAt: Date.now() });
    save();
    ZK.util.emit("db:change", { coll: name, op: "update", id });
    return rec;
  }

  function remove(name, id) {
    const arr = coll(name);
    const idx = arr.findIndex((x) => x.id === id);
    if (idx < 0) return false;
    arr.splice(idx, 1);
    save();
    ZK.util.emit("db:change", { coll: name, op: "remove", id });
    return true;
  }

  function upsert(name, obj) {
    const found = obj.id ? find(name, obj.id) : null;
    return found ? update(name, obj.id, obj) : insert(name, obj);
  }

  /** 关键词过滤（对对象任意字符串字段做包含匹配） */
  function search(name, keyword, fields) {
    const kw = String(keyword || "").trim().toLowerCase();
    if (!kw) return list(name);
    return coll(name).filter((rec) =>
      (fields || Object.keys(rec))
        .map((f) => rec[f])
        .filter((v) => typeof v === "string" || typeof v === "number")
        .some((v) => String(v).toLowerCase().includes(kw))
    );
  }

  /* ---------------- 会话 ---------------- */
  function setSession(user, remember) {
    const keep = remember !== false;
    const ttl = keep ? 7 * 86400000 : 12 * 3600000;
    const now = Date.now();
    const s = {
      userId: user.id,
      account: user.account,
      name: user.name,
      role: user.role,
      roleName: user.roleName,
      org: user.org,
      remember: keep,
      loginAt: now,
      expiresAt: now + ttl,
      ttlHours: Math.round(ttl / 3600000),
      token: "tk_" + Math.random().toString(36).slice(2, 12),
    };
    rawSet(SESSION_KEY, JSON.stringify(s));
    ZK.util.emit("session:change", s);
    return s;
  }

  function getSession() {
    const raw = rawGet(SESSION_KEY);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      if (s.expiresAt && Date.now() > s.expiresAt) {
        clearSession();
        return null;
      }
      const user = find("users", s.userId);
      if (!user || user.status === "disabled") {
        clearSession();
        return null;
      }
      return Object.assign({}, s, { roleName: user.roleName, name: user.name });
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    rawDel(SESSION_KEY);
    ZK.util.emit("session:change", null);
  }

  function currentUser() {
    const s = getSession();
    return s ? find("users", s.userId) : null;
  }

  function can(action) {
    const u = currentUser();
    if (!u) return false;
    if (u.role === "admin") return true;
    const perms = coll("permissions").filter((p) => p.role === u.role);
    return perms.some((p) => p.action === action && p.allowed);
  }

  /* ---------------- 操作日志 ---------------- */
  function log(action, detail, level) {
    const u = currentUser();
    const rec = {
      id: ZK.util.uid("log"),
      at: Date.now(),
      action,
      detail: detail || "",
      level: level || "info",
      operator: u ? u.name : "系统",
      account: u ? u.account : "-",
      ip: "10.24." + (u ? String(u.account).length : 3) + "." + (u ? String(u.name.length * 7 + 11) : 8),
    };
    state.logs.unshift(rec);
    if (state.logs.length > 600) state.logs.length = 600;
    save();
    return rec;
  }

  /* ---------------- 导出 / 导入 ---------------- */
  function exportJson() {
    return JSON.stringify(state, null, 2);
  }

  function importJson(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("数据格式不正确");
    state = parsed;
    if (!state.__v) state.__v = DB_VERSION;
    save();
    ZK.util.emit("db:reset");
    return true;
  }

  ZK.db = {
    load, save, reset,
    get state() {
      return state;
    },
    get persistOK() {
      return persistOK;
    },
    coll, list, find, insert, update, remove, upsert, search,
    setSession, getSession, clearSession, currentUser, can,
    log, exportJson, importJson,
    get version() {
      return DB_VERSION;
    },
  };

  /* ---------------- 轻提示（全局可用） ---------------- */
  function toastHost() {
    let host = document.querySelector(".toast-host");
    if (!host) {
      host = ZK.util.el("div", { class: "toast-host" });
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(msg, kind, ms) {
    const node = ZK.util.el("div", { class: "toast " + (kind || ""), text: msg });
    toastHost().appendChild(node);
    setTimeout(() => {
      node.style.transition = "opacity 200ms ease";
      node.style.opacity = "0";
      setTimeout(() => node.remove(), 220);
    }, ms || 2400);
    return node;
  }

  ZK.toast = toast;

  /* ---------------- 弹窗注册表（路由切换时统一关闭，避免残留遮挡页面） ---------------- */
  const openModals = [];

  function registerModal(handle) {
    openModals.push(handle);
    return () => {
      const i = openModals.indexOf(handle);
      if (i >= 0) openModals.splice(i, 1);
    };
  }

  function closeAllModals() {
    openModals.slice().forEach((m) => {
      try {
        m.close();
      } catch (e) {
        /* 忽略单个弹窗关闭异常，保证其余弹窗仍被清理 */
      }
    });
    openModals.length = 0;
    /* 兜底：清掉任何遗漏的遮罩节点 */
    const stray = document.querySelectorAll(".modal-backdrop");
    for (let i = 0; i < stray.length; i += 1) {
      if (stray[i].parentNode) stray[i].parentNode.removeChild(stray[i]);
    }
  }

  ZK.closeAllModals = closeAllModals;
  ZK.modalCount = () => openModals.length;

  /* ---------------- 确认框（替代原生 confirm） ---------------- */
  function confirmDialog(opts) {
    return new Promise((resolve) => {
      const backdrop = ZK.util.el("div", { class: "modal-backdrop" });
      const modal = ZK.util.el("div", { class: "modal sm" }, [
        ZK.util.el("div", { class: "modal-head" }, [
          ZK.util.el("div", {}, [
            ZK.util.el("h2", { text: opts.title || "操作确认" }),
            opts.sub ? ZK.util.el("div", { class: "mh-sub", text: opts.sub }) : null,
          ]),
        ]),
        ZK.util.el("div", { class: "modal-body" }, [
          ZK.util.el("p", {
            style: { fontSize: "13.5px", lineHeight: "1.75", color: "var(--text-secondary)" },
            html: opts.message || "确定要继续吗？",
          }),
        ]),
        ZK.util.el("div", { class: "modal-foot" }, [
          ZK.util.el("button", {
            class: "btn",
            text: opts.cancelText || "取消",
            onclick: () => close(false),
          }),
          ZK.util.el("button", {
            class: "btn " + (opts.danger ? "btn-danger" : "btn-primary"),
            text: opts.okText || "确定",
            onclick: () => close(true),
          }),
        ]),
      ]);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      let closed = false;
      const unregister = registerModal({ close: () => close(false) });

      function close(v) {
        if (closed) return;
        closed = true;
        unregister();
        backdrop.remove();
        document.removeEventListener("keydown", onKey);
        resolve(v);
      }
      function onKey(e) {
        if (e.key === "Escape") close(false);
      }
      document.addEventListener("keydown", onKey);
      backdrop.addEventListener("mousedown", (e) => {
        if (e.target === backdrop) close(false);
      });
    });
  }

  ZK.confirm = confirmDialog;

  /* ---------------- 模态框（通用容器） ---------------- */
  function openModal(opts) {
    const backdrop = ZK.util.el("div", { class: "modal-backdrop" });
    const body = ZK.util.el("div", { class: "modal-body" });
    const foot = ZK.util.el("div", { class: "modal-foot" });
    const modal = ZK.util.el("div", { class: "modal " + (opts.size || "") }, [
      ZK.util.el("div", { class: "modal-head" }, [
        ZK.util.el("div", {}, [
          ZK.util.el("h2", { text: opts.title || "" }),
          opts.sub ? ZK.util.el("div", { class: "mh-sub", text: opts.sub }) : null,
        ]),
        ZK.util.el("button", {
          class: "icon-btn",
          html: ZK.icons.close(),
          onclick: () => api.close(),
          "aria-label": "关闭",
        }),
      ]),
      body,
      opts.footer === false ? null : foot,
    ]);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const api = {
      backdrop,
      modal,
      body,
      foot,
      close() {
        if (api._closed) return;
        api._closed = true;
        unregister();
        backdrop.remove();
        document.removeEventListener("keydown", onKey);
        if (opts.onClose) opts.onClose();
      },
      setFooter(nodes) {
        ZK.util.clear(foot);
        (nodes || []).forEach((n) => n && foot.appendChild(n));
        return api;
      },
    };

    const unregister = registerModal(api);

    function onKey(e) {
      if (e.key === "Escape") api.close();
    }
    document.addEventListener("keydown", onKey);
    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop && opts.dismissible !== false) api.close();
    });

    if (opts.render) opts.render(api);
    return api;
  }

  ZK.modal = openModal;
})();
