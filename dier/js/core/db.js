/* ==========================================================================
   db.js —— 本地数据层（增量补丁持久化）
   设计要点（踩过的坑，别改）：
   1) 全量数据体量约 2.5MB，直接 JSON 落盘会逼近 localStorage 配额（UTF-16 计约翻倍）。
      因此持久化采用「种子 + 增量补丁」：内存里始终是完整数据（由 ZSEED.build() 重建，
      耗时约 20~40ms），localStorage 只记录被用户改动过的记录（新增/修改/删除/整表替换）。
      → 补丁通常只有几 KB，永不触配额；且刷新后未改动部分永远与种子一致，演示可复现。
   2) 约定：任何对记录的修改都必须经过 DB.update / DB.touch / DB.replace，
      否则改动只存在于内存，刷新后会回到种子态。页面里不要直接改 DB.get() 出来的对象
      而不调用 DB.touch()。
   3) 补丁带种子版本号；种子结构升级（ZSEED.version +1）时旧补丁自动作废重建。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU;
  var PKEY = 'zk_patch_v1';
  var MAX_PATCH = 3.5 * 1024 * 1024;   /* 补丁超过 3.5MB（约 7MB UTF-16）就不再落盘 */

  var DB = {
    data: {},
    patch: null,
    _listeners: [],
    _aggCache: null,
    _writeTimer: null,
    _lastWriteKB: 0,
    ready: false
  };

  function emptyPatch() {
    return { v: w.ZSEED.version, sets: {}, objs: {} };
  }
  /** 取某集合的补丁槽 */
  function slot(col, create) {
    var p = DB.patch;
    if (!p.sets[col]) {
      if (!create) return null;
      p.sets[col] = { up: {}, del: {} };
    }
    return p.sets[col];
  }
  /** 标记某条记录已改动（新增或修改） */
  function markUp(col, obj) {
    if (!obj || obj.id === undefined) return;
    var s = slot(col, true);
    delete s.del[obj.id];
    s.up[obj.id] = obj;
    if (s.set) { /* 整表替换模式下，改动同步进 set 数组 */ }
  }
  function markDel(col, id) {
    var s = slot(col, true);
    delete s.up[id];
    s.del[id] = 1;
    if (s.set) {
      for (var i = 0; i < s.set.length; i++) if (s.set[i].id === id) { s.set.splice(i, 1); break; }
    }
  }

  function persist() {
    if (DB._writeTimer) clearTimeout(DB._writeTimer);
    DB._writeTimer = setTimeout(function () {
      DB._writeTimer = null;
      var str;
      try { str = JSON.stringify(DB.patch); } catch (e) { return; }
      var kb = Math.round(str.length / 1024);
      DB._lastWriteKB = kb;
      if (str.length > MAX_PATCH) {
        console.warn('[db] 增量补丁过大(' + kb + 'KB)，本次不落盘；数据仍在内存中有效。');
        return;
      }
      try { localStorage.setItem(PKEY, str); }
      catch (e) { console.warn('[db] 补丁写入失败:', e && e.message); }
    }, 180);
  }
  DB.persist = persist;

  function emit(type, payload) {
    DB._listeners.forEach(function (fn) {
      try { fn(type, payload); } catch (e) { console.warn('[db] listener error', e); }
    });
  }

  /* ---------------- 初始化 ---------------- */
  /**
   * 重建内存数据并应用本地补丁。
   * @param {boolean} force 忽略本地补丁，回到纯净种子态
   */
  DB.init = function (force) {
    var raw = null;
    if (!force) {
      try { raw = localStorage.getItem(PKEY); } catch (e) { raw = null; }
    }
    DB.patch = emptyPatch();
    var applied = null;
    if (raw) {
      try {
        var p = JSON.parse(raw);
        if (p && p.v === w.ZSEED.version && p.sets) applied = p;
      } catch (e) { console.warn('[db] 本地补丁损坏，已忽略'); }
    }
    if (applied) DB.patch = applied;

    DB.data = w.ZSEED.build();
    DB._aggCache = null;

    if (applied) {
      /* 先应用整表替换，再应用增量 */
      Object.keys(applied.sets).forEach(function (col) {
        var s = applied.sets[col];
        if (s.set) DB.data[col] = s.set;
      });
      Object.keys(applied.sets).forEach(function (col) {
        var s = applied.sets[col];
        var arr = DB.data[col];
        if (!Array.isArray(arr)) { arr = DB.data[col] = []; }
        var del = s.del || {}, up = s.up || {};
        var keep = [];
        for (var i = 0; i < arr.length; i++) if (!del[arr[i].id]) keep.push(arr[i]);
        Object.keys(up).forEach(function (id) {
          var rec = up[id], hit = -1;
          for (var j = 0; j < keep.length; j++) if (keep[j].id === id) { hit = j; break; }
          if (hit >= 0) keep[hit] = rec; else keep.push(rec);
        });
        DB.data[col] = keep;
      });
      Object.keys(applied.objs || {}).forEach(function (name) {
        /* 单例对象：以补丁为基础（补丁里存的是完整对象），保留种子中未被补丁覆盖的键 */
        var seedObj = DB.data[name];
        var p = applied.objs[name];
        if (seedObj && typeof seedObj === 'object' && !Array.isArray(seedObj)) {
          Object.keys(p).forEach(function (k) { seedObj[k] = p[k]; });
          DB.data[name] = seedObj;
        } else {
          DB.data[name] = p;
        }
      });
    }
    DB.ready = true;
    if (applied) emit('ready', { restored: true });
    return DB.data;
  };

  /* ---------------- 读 ---------------- */
  /**
   * 取数组型集合。
   * 注意：portal / screenCfg / ai / party / safety / meta 等属于「单例对象型」集合，
   * 绝不可当作数组处理 —— 旧实现会就地写入 [] 把整个配置对象清空，故此处只返回
   * 一个临时空数组，不触碰 DB.data[name]。对象型集合请用 DB.obj / DB.setObj / DB.touchObj。
   */
  DB.col = function (name) {
    var c = DB.data[name];
    if (Array.isArray(c)) return c;
    return [];
  };
  /** 该集合是否为数组型（写入前可用于判断，避免误操作单例对象） */
  DB.isTable = function (name) { return Array.isArray(DB.data[name]); };
  DB.all = function (name) { return DB.col(name).slice(); };
  DB.get = function (name, id) {
    var arr = DB.col(name);
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  };
  DB.find = function (name, pred) {
    var arr = DB.col(name);
    for (var i = 0; i < arr.length; i++) if (pred(arr[i], i)) return arr[i];
    return null;
  };
  DB.filter = function (name, pred) {
    var arr = DB.col(name);
    return pred ? arr.filter(pred) : arr.slice();
  };
  DB.count = function (name, pred) { return DB.filter(name, pred).length; };
  DB.obj = function (name) {
    var o = DB.data[name];
    if (!o || typeof o !== 'object' || Array.isArray(o)) { o = DB.data[name] = {}; }
    return o;
  };
  DB.byId = function (name, ids) {
    var m = {};
    DB.col(name).forEach(function (x) { if (ids.indexOf(x.id) >= 0) m[x.id] = x; });
    return m;
  };

  /* ---------------- 写 ---------------- */
  DB.insert = function (name, obj, opts) {
    if (!DB.isTable(name)) {
      /* 单例对象型集合没有“表”语义，静默丢弃会造成数据不一致，这里明确拒绝 */
      try { console.warn('[DB.insert] "' + name + '" 不是数组型集合，请改用 DB.setObj / DB.obj'); } catch (e) { }
      return null;
    }
    opts = opts || {};
    if (!obj.id) obj.id = U.uid(name.slice(0, 2).toUpperCase());
    if (!obj.createdAt) obj.createdAt = U.dt(new Date());
    if (opts.top) DB.col(name).unshift(obj); else DB.col(name).push(obj);
    DB._aggCache = null;
    markUp(name, obj);
    persist();
    emit('insert', { col: name, item: obj });
    return obj;
  };
  DB.insertMany = function (name, list) {
    var arr = DB.col(name);
    list.forEach(function (obj) {
      if (!obj.id) obj.id = U.uid(name.slice(0, 2).toUpperCase());
      arr.push(obj);
      markUp(name, obj);
    });
    DB._aggCache = null;
    persist();
    emit('insert', { col: name, count: list.length });
    return list;
  };
  DB.update = function (name, id, patch) {
    var it = typeof id === 'object' && id !== null ? id : DB.get(name, id);
    if (!it) return null;
    Object.keys(patch).forEach(function (k) { it[k] = patch[k]; });
    it.updatedAt = U.dt(new Date());
    DB._aggCache = null;
    markUp(name, it);
    persist();
    emit('update', { col: name, item: it });
    return it;
  };
  /** 对象已就地改过，只需登记为已改动（不改字段）—— 仅用于数组型集合 */
  DB.touch = function (name, idOrObj) {
    if (!DB.isTable(name)) {
      try { console.warn('[DB.touch] "' + name + '" 不是数组型集合，请改用 DB.touchObj'); } catch (e) { }
      return null;
    }
    var it = typeof idOrObj === 'object' && idOrObj !== null ? idOrObj : DB.get(name, idOrObj);
    if (!it) return null;
    DB._aggCache = null;
    markUp(name, it);
    persist();
    emit('update', { col: name, item: it });
    return it;
  };
  /**
   * 单例对象型集合就地改动后的落盘登记
   * （portal / screenCfg / ai / party / safety / meta 等）
   * keys 省略时登记该对象的全部顶层键；传入 keys 可只登记改动的键，减少写入量。
   */
  DB.touchObj = function (name, keys) {
    var o = DB.data[name];
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    var store = DB.patch.objs[name] || (DB.patch.objs[name] = {});
    (keys && keys.length ? keys : Object.keys(o)).forEach(function (k) { store[k] = o[k]; });
    persist();
    emit('update', { col: name, item: o });
    return o;
  };
  DB.remove = function (name, id) {
    var arr = DB.col(name);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        var gone = arr.splice(i, 1)[0];
        DB._aggCache = null;
        markDel(name, id);
        persist();
        emit('remove', { col: name, item: gone });
        return gone;
      }
    }
    return null;
  };
  DB.removeWhere = function (name, pred) {
    var arr = DB.col(name), kept = [], removed = [];
    arr.forEach(function (x) { (pred(x) ? removed : kept).push(x); });
    DB.data[name] = kept;
    DB._aggCache = null;
    removed.forEach(function (x) { markDel(name, x.id); });
    persist();
    emit('remove', { col: name, count: removed.length });
    return removed;
  };
  /** 整体替换集合（批量导入后调用）：补丁里存整表，保证刷新后一致 */
  DB.replace = function (name, list) {
    DB.data[name] = list;
    DB._aggCache = null;
    var s = slot(name, true);
    s.set = list;
    s.up = {}; s.del = {};
    persist();
    emit('update', { col: name, bulk: true });
    return list;
  };
  /** 单例对象写入（portal / screenCfg / ai / party / safety / meta 等） */
  DB.setObj = function (name, patch) {
    var o = DB.data[name];
    if (!o || typeof o !== 'object' || Array.isArray(o)) o = DB.data[name] = {};
    Object.keys(patch).forEach(function (k) { o[k] = patch[k]; });
    var store = DB.patch.objs[name] || (DB.patch.objs[name] = {});
    Object.keys(patch).forEach(function (k) { store[k] = patch[k]; });
    persist();
    emit('update', { col: name, item: o });
    return o;
  };

  /* ---------------- 聚合 ---------------- */
  /**
   * 学生学分汇总：[{studentId,sno,name,college,...,total,hours,points,cat{}}]
   * 传 students / scoreRecs 则按传入计算（不缓存），否则用当前库并缓存。
   */
  DB.agg = function (studentList, recList) {
    if (!studentList && !recList && DB._aggCache) return DB._aggCache;
    var students = studentList || DB.col('students');
    var recs = recList || DB.col('scoreRecs');
    var cats = (DB.data.cats || []).map(function (c) { return c.name; });
    var m = {};
    students.forEach(function (s) {
      m[s.id] = {
        studentId: s.id, sno: s.sno, name: s.name, contact: s.contact, gender: s.gender,
        collegeId: s.collegeId, college: s.college, majorId: s.majorId, major: s.major,
        classId: s.classId, className: s.className, grade: s.grade,
        total: 0, hours: 0, points: 0, cat: {}, records: 0
      };
      cats.forEach(function (c) { m[s.id].cat[c] = 0; });
    });
    recs.forEach(function (r) {
      var t = m[r.studentId]; if (!t) return;
      t.total += U.num(r.credit);
      t.hours += U.num(r.hours);
      t.points += U.num(r.points);
      t.records++;
      if (t.cat[r.cat] === undefined) t.cat[r.cat] = 0;
      t.cat[r.cat] = U.num(t.cat[r.cat]) + U.num(r.credit);
    });
    var list = Object.keys(m).map(function (k) {
      var x = m[k];
      x.total = Math.round(x.total * 100) / 100;
      x.hours = Math.round(x.hours * 10) / 10;
      x.points = Math.round(x.points * 10) / 10;
      return x;
    });
    if (!studentList && !recList) DB._aggCache = list;
    return list;
  };
  DB.aggOf = function (studentId) {
    var list = DB.agg();
    for (var i = 0; i < list.length; i++) if (list[i].studentId === studentId) return list[i];
    return null;
  };
  /** 当前考核方案（默认启用） */
  DB.scheme = function () {
    return DB.find('schemes', function (x) { return x.isDefault && x.enabled; })
      || DB.col('schemes')[0] || null;
  };
  /** 学生成绩记录明细 */
  DB.recsOf = function (studentId, opt) {
    opt = opt || {};
    return DB.filter('scoreRecs', function (r) {
      if (r.studentId !== studentId) return false;
      if (opt.term && r.term !== opt.term) return false;
      if (opt.cat && r.cat !== opt.cat) return false;
      if (opt.from && r.at < opt.from) return false;
      if (opt.to && r.at > opt.to) return false;
      return true;
    });
  };
  /** 达标判定：返回 {pass, total, need, scheme} */
  DB.judge = function (total, schemeId) {
    var sc = schemeId ? DB.get('schemes', schemeId) : DB.scheme();
    var need = sc ? U.num((sc.standard || {}).pass || sc.minCredit || 6) : 6;
    return { pass: U.num(total) >= need, total: U.num(total), need: need, scheme: sc };
  };

  /* ---------------- 订阅 ---------------- */
  DB.on = function (fn) { DB._listeners.push(fn); return fn; };
  DB.off = function (fn) {
    var i = DB._listeners.indexOf(fn);
    if (i >= 0) DB._listeners.splice(i, 1);
  };

  /* ---------------- 复位 ---------------- */
  DB.reset = function () {
    try { localStorage.removeItem(PKEY); } catch (e) { }
    DB.patch = emptyPatch();
    DB._aggCache = null;
    DB.data = w.ZSEED.build();
    persist();
    emit('reset', {});
    return DB.data;
  };
  DB.clearAll = function () {
    try { localStorage.clear(); } catch (e) { }
    return DB.reset();
  };
  /** 当前改动统计 */
  DB.patchStat = function () {
    var up = 0, del = 0, cols = 0, sets = 0;
    Object.keys(DB.patch.sets).forEach(function (c) {
      var s = DB.patch.sets[c];
      if (Object.keys(s.up).length || Object.keys(s.del).length || s.set) cols++;
      up += Object.keys(s.up).length;
      del += Object.keys(s.del).length;
      if (s.set) sets++;
    });
    return { cols: cols, up: up, del: del, replaced: sets, objKeys: Object.keys(DB.patch.objs).length, kb: DB._lastWriteKB };
  };
  /** 内存数据体积（KB，仅供参考） */
  DB.sizeKB = function () {
    try { return Math.round(JSON.stringify(DB.data).length / 1024); } catch (e) { return 0; }
  };
  /** 已落盘补丁体积（KB） */
  DB.patchKB = function () {
    try { return Math.round(JSON.stringify(DB.patch).length / 1024); } catch (e) { return 0; }
  };

  w.DB = DB;
})(window);
