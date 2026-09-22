/* ==========================================================================
   pagekit.js —— 页面共用工具箱（所有业务页复用，避免逐页重复实现）
   约定：
   · 页面导出 w.ZPAGES = { 路由key: {title, group, render(host, param)} }
   · 列表页统一用 KP.lister(...)，自带筛选条 / 分页 / 空态 / 导出
   · 状态一律用 KP.status() 上色，颜色只表达语义，不随手写死
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA;

  var KP = {};

  /* ===================== 状态语义 ===================== */
  var TONE = {
    ok: ['通过', '已通过', '已认定', '已发布', '正常', '在册', '在籍', '合格', '已完成', '已签到', '已结束', '达标', '已达标', '有效', '启用', '已启用', '已归档', '已处理', '已同意', '已缴费', '已签退', '成功', '已读', '已发送', '已导出', '已生成', '已确认', '优秀'],
    warn: ['待审核', '待初审', '待终审', '待审', '待处理', '待审批', '草稿', '进行中', '报名中', '待签到', '待认定', '待提交', '未审核', '审核中', '审批中', '待发布', '部分达标', '关注', '较低', '待补录', '待缴费', '未读', '待发送', '待完善'],
    err: ['驳回', '已驳回', '未通过', '不合格', '异常', '停用', '已停用', '已封禁', '未签到', '未达标', '逾期', '超期', '失败', '严重', '禁止', '已拒收', '未参与', '黑名单', '高危', '违规'],
    info: ['已退回', '已取消', '已关闭', '已撤回', '已下线', '已结束报名', '历史', '已失效'],
    purple: ['优秀', '重点', '校级', '示范', '精品', '推荐']
  };
  KP.tone = function (s) {
    s = String(s === null || s === undefined ? '' : s);
    if (!s) return '';
    var hit = '';
    Object.keys(TONE).forEach(function (k) {
      if (hit) return;
      if (TONE[k].indexOf(s) >= 0) hit = k;
    });
    if (hit) return hit;
    /* 二次模糊匹配（含关键词即可） */
    var fuzzy = [[/(驳回|不合格|未达|未签|异常|停用|失败|违规|严重|禁止)/, 'err'],
    [/(待|草稿|进行中|报名中|审核中|审批中|未读)/, 'warn'],
    [/(已通过|通过|已认定|已完成|合格|达标|已发布|正常|在册)/, 'ok'],
    [/(已取消|已关闭|已撤回|已退回|失效|下线)/, 'info'],
    [/(优秀|示范|精品|推荐)/, 'purple']];
    for (var i = 0; i < fuzzy.length; i++) if (fuzzy[i][0].test(s)) return fuzzy[i][1];
    return '';
  };
  /** 状态标签 */
  KP.status = function (s) {
    var t = KP.tone(s);
    return UI.tag(s === null || s === undefined || s === '' ? '—' : s, t ? 'tag-' + t : '');
  };
  /** 分类标签（类别自带配色） */
  KP.catTag = function (cat) {
    var c = DB.find('cats', function (x) { return x.name === cat; });
    var el = D.h('span.tag' + (c ? '' : '.tag-info'), cat || '—');
    if (c && c.color) {
      el.setAttribute('style', 'background:' + (c.light || '#eff6ff') + ';color:' + c.color);
    }
    return el;
  };
  KP.catColor = function (cat) {
    var c = DB.find('cats', function (x) { return x.name === cat; });
    return c ? (c.color || C.color(0)) : C.color(0);
  };
  /** 双行单元格 */
  KP.cell = function (main, sub, opt) {
    opt = opt || {};
    return D.h('div', { style: 'min-width:0' },
      D.h('div', { style: 'font-weight:600;color:var(--text)' + (opt.clip ? ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap' : ''), title: opt.title || (typeof main === 'string' ? main : '') }, main),
      sub ? D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:2px' }, sub) : null
    );
  };
  /** 人名 + 副信息 */
  KP.who = function (name, sub, opt) {
    opt = opt || {};
    return D.h('div', { style: 'display:flex;align-items:center;gap:8px;min-width:0' },
      opt.avatar === false ? null : UI.avatar(name, opt.size || 28),
      D.h('div', { style: 'min-width:0' },
        D.h('div', { style: 'font-weight:600' }, name),
        sub ? D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:1px' }, sub) : null
      )
    );
  };
  /** 数值单元格（右对齐常用） */
  KP.numCell = function (v, unit, opt) {
    opt = opt || {};
    return D.h('span', { style: 'font-weight:650;font-variant-numeric:tabular-nums;' + (opt.color ? 'color:' + opt.color : '') }, U.fmt(v), unit ? D.h('i', { style: 'font-style:normal;font-size:11px;color:var(--text3);margin-left:1px' }, unit) : null);
  };
  /** 进度：达成率 */
  KP.progCell = function (pct, label) {
    return D.h('div', { style: 'min-width:86px' }, UI.pg(U.clamp(pct, 0, 100)), D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' }, label || (pct.toFixed(1) + '%')));
  };
  /** 导出按钮（cols / rows 均可传函数，便于按当前筛选条件动态取列取数） */
  KP.exportBtn = function (label, cols, rows, opt) {
    opt = opt || {};
    return D.h('button.btn.btn-sm' + (opt.primary ? '.btn-p' : ''), {
      onclick: function () {
        var cs = typeof cols === 'function' ? cols() : cols;
        var data = typeof rows === 'function' ? rows() : rows;
        if (!cs || !cs.length) { UI.toast('导出列未定义', '请检查该导出项的列配置', 'err'); return; }
        if (!data || !data.length) { UI.toast('没有可导出的数据', '请先调整筛选条件', 'warn'); return; }
        UI.exportCSV(label, cs, data);
      }
    }, opt.icon === false ? null : '⤓ ', label);
  };
  /** 打印按钮 */
  KP.printBtn = function (label, build, opt) {
    opt = opt || {};
    return D.h('button.btn.btn-sm' + (opt.primary ? '.btn-p' : ''), {
      onclick: function () {
        var r = typeof build === 'function' ? build() : build;
        UI.printHTML(r.title || label, r.html, r.css);
      }
    }, '🖨 ', label);
  };
  /** 指标卡组 */
  KP.kpis = function (items, cls) {
    return D.h('div.' + (cls || 'g4'), items.map(function (it) {
      if (it.el) return it.el;
      return UI.stat(it);
    }));
  };
  /** 卡片分组小标题 */
  KP.h5 = function (t, right) {
    return D.h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin:14px 0 8px' },
      D.h('div', { style: 'font-weight:700;font-size:13.5px;display:flex;align-items:center;gap:6px' },
        D.h('i', { style: 'width:3px;height:13px;border-radius:2px;background:var(--primary);display:inline-block' }), t),
      right || null);
  };
  /** 提示条 */
  KP.note = function (text) { return D.h('div.req-note', { html: text }); };
  /** 键值块 */
  KP.kv = function (pairs) { return UI.kv(pairs); };

  /* ===================== 活动状态口径（全局统一） ===================== */
  /**
   * 活动生命周期：草稿 → 待审核 →（通过）待开始 → 进行中 → 已结束
   *                         └（驳回）已驳回
   * 「已发布」= 已通过审核并进入活动广场，含 待开始 / 进行中 / 已结束 三种。
   * 全局只允许用 KP.isPub() 判断，禁止各页各自写 `status === '已发布'`（种子中无此取值）。
   */
  KP.PUB = ['待开始', '进行中', '已结束'];
  KP.isPub = function (a) { return !!a && KP.PUB.indexOf(a.status) >= 0; };
  KP.pubList = function (list) { return (list || []).filter(KP.isPub); };
  KP.notPub = function (list) { return (list || []).filter(function (a) { return !KP.isPub(a); }); };

  /* ===================== 数据范围 ===================== */
  /** 按当前角色数据范围过滤（college 字段） */
  KP.inScope = function (rec) {
    var sc = ZA.scope();
    if (!sc || !sc.collegeId) return true;
    if (!rec) return true;
    if (rec.collegeId) return rec.collegeId === sc.collegeId;
    if (rec.college) return rec.college === sc.college;
    return true;
  };
  KP.scopeFilter = function (list, keyFn) {
    var sc = ZA.scope();
    if (!sc || !sc.collegeId) return list;
    return list.filter(function (x) {
      var key = keyFn ? keyFn(x) : (x.collegeId || x.college);
      return key === sc.collegeId || key === sc.college;
    });
  };
  KP.scopeTip = function () {
    return D.h('span.muted', '数据范围：' + ZA.scopeText());
  };

  /* ===================== 列表页工厂 ===================== */
  /**
   * KP.lister({
   *   host, title, sub, right,                     // 卡片头
   *   head,                                        // 卡片头之前的自定义内容（DOM/数组）
   *   filters(st, refresh) -> DOM|array            // 筛选条
   *   rows(st) -> array                            // 取数（自行按 st.kw / st.f 过滤）
   *   cols: [...], pageSize, rowClick, selectable, onSelect,
   *   empty, emptySub, footLeft(st, data), actions(st, refresh),
   *   noCard, mini, center
   * })
   */
  KP.lister = function (opt) {
    var host = opt.host || D.h('div');
    var st = { page: 1, ps: opt.pageSize === undefined ? 12 : opt.pageSize, kw: '', f: {} };
    var filterHost = D.h('div');
    var tblHost = D.h('div');
    var rightHost = D.h('div.hd-r');

    function refresh() { st.page = 1; render(); }

    function render() {
      var data = opt.rows ? (opt.rows(st) || []) : [];
      var maxPage = Math.max(1, Math.ceil(data.length / st.ps));
      if (st.page > maxPage) st.page = maxPage;
      if (opt.filters) D.fill(filterHost, opt.filters(st, refresh) || null);
      else D.fill(filterHost, null);

      var t = UI.table({
        cols: opt.cols, rows: data, pageSize: st.ps, page: st.page,
        onPage: function (p) { st.page = p; render(); },
        empty: opt.empty, emptySub: opt.emptySub,
        rowClick: opt.rowClick, selectable: opt.selectable, onSelect: opt.onSelect,
        mini: opt.mini, center: opt.center, noCard: true,
        footLeft: opt.footLeft ? opt.footLeft(st, data) : null,
        footNote: opt.footNote
      });
      D.fill(tblHost, t.el);
    }

    var rebuild = function () { render(); };
    if (!opt.noCard) {
      D.fill(rightHost, null);
      if (opt.right) D.appendChildDeep(rightHost, opt.right);
      if (opt.actions) D.appendChildDeep(rightHost, opt.actions(st, refresh));
      host.appendChild(UI.card({
        title: opt.title, sub: opt.sub,
        right: (opt.right || opt.actions) ? rightHost : null,
        flush: true,
        body: [
          opt.toolbar ? D.h('div', { style: 'padding:13px 15px;border-bottom:1px solid var(--line)' }, opt.toolbar(st, refresh)) : null,
          opt.head || null,
          opt.filters ? D.h('div', { style: 'padding:13px 15px 0' }, filterHost) : null,
          tblHost
        ]
      }));
    } else {
      if (opt.filters) host.appendChild(D.h('div', { style: 'margin-bottom:12px' }, filterHost));
      host.appendChild(tblHost);
    }
    render();
    /* 返回值即容器元素本身（可直接当 body 用），并附带状态与方法便于外部刷新 */
    host.st = st;
    host.render = render;
    host.refresh = refresh;
    host.rows = function () { return opt.rows ? opt.rows(st) : []; };
    return host;
  };

  /* ===================== 学生成绩常用 ===================== */
  /** 学分达成视图（学生端与大屏共用） */
  KP.creditRow = function (agg, scheme) {
    var need = U.num(scheme ? scheme.standard.pass : 6);
    return {
      total: agg.total, need: need,
      pass: agg.total >= need,
      pct: need ? U.clamp(agg.total / need * 100, 0, 100) : 0,
      gap: Math.round(Math.max(0, need - agg.total) * 100) / 100
    };
  };
  /** 类别达成明细 */
  KP.catProgress = function (agg, scheme) {
    var std = (scheme && scheme.catStandard) || {};
    var rows = (DB.data.cats || []).map(function (c) {
      var need = U.num(std[c.name] || 0);
      var got = U.num(agg.cat[c.name] || 0);
      return { cat: c.name, color: c.color, light: c.light, got: got, need: need, pct: need ? U.clamp(got / need * 100, 0, 100) : 0, ok: need ? got >= need * 0.6 : true };
    });
    return rows;
  };

  /* ===================== 小工具 ===================== */
  KP.pickN = function (list, n) { return list.slice(0, n); };
  KP.fmtTime = function (v) { return U.dt(v); };
  KP.icon = function (ch, fg, bg, size) { return UI.icoBox(ch, fg, bg, size); };
  /** 关闭当前所有弹窗 */
  KP.close = UI.closeAllModals;
  /** 挂载（清空 + 填充） */
  KP.mount = function (host, el) {
    D.fill(host, null);
    D.appendChildDeep(host, el);
    return host;
  };
  /** 定位并高亮（操作后提示用户结果在哪） */
  KP.focusRow = function (host, id) {
    var tr = D.q('tr[data-id="' + id + '"]', host);
    if (tr) { D.flash(tr); tr.scrollIntoView && tr.scrollIntoView(); }
  };
  /** 生成编号（按前缀 + 计数） */
  KP.genNo = function (prefix, col, len) {
    len = len || 4;
    var n = DB.col(col).length + 1;
    return prefix + '-' + U.pad(new Date().getMonth() + 1) + String(n).padStart(len, '0');
  };
  /** today（统一取种子里的“当前时间”，保证与演示数据时间线一致） */
  KP.today = function () {
    return (DB.data.meta && DB.data.meta.now ? String(DB.data.meta.now).slice(0, 10) : U.d(String(new Date()).slice(0, 10)));
  };
  /** 组一个表格列：动作按钮组 */
  KP.acts = function (btns) {
    return D.h('div.btn-row', btns.filter(Boolean));
  };
  KP.btn = function (label, fn, cls) {
    return D.h('button.btn.btn-sm' + (cls ? '.' + cls : ''), { onclick: fn }, label);
  };

  /* ===================== 导出/打印辅助 ===================== */
  /** 通用明细表 HTML（用于 PDF / 打印） */
  KP.tableHTML = function (cols, rows, opt) {
    opt = opt || {};
    var head = '<tr>' + cols.map(function (c) { return '<th>' + U.esc(c.t) + '</th>'; }).join('') + '</tr>';
    var body = rows.map(function (r) {
      return '<tr>' + cols.map(function (c) {
        var v = c.raw ? c.raw(r) : (c.k ? r[c.k] : '');
        if (v === null || v === undefined || v === '') v = '—';
        return '<td>' + U.esc(v) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<table class="' + (opt.cls || '') + '">' + head + body + '</table>';
  };
  KP.metricsHTML = function (pairs) {
    return '<div class="m">' + pairs.map(function (p) {
      return '<div><b>' + U.esc(p[1]) + '</b><span>' + U.esc(p[0]) + '</span></div>';
    }).join('') + '</div>';
  };
  KP.sealHTML = function (text) {
    return '<div class="seal">' + U.esc(text || '第二课堂成绩认定专用章') + '</div>';
  };

  /* ===================== 页面注册快捷方式 ===================== */
  KP.reg = function (key, def) { w.ZR.reg(key, def); };
  /** 注册到 ZPAGES 并立即挂到路由（不依赖 ZAPP.boot()，便于逐页自验） */
  KP.pages = function (map) {
    if (!w.ZPAGES) w.ZPAGES = {};
    Object.keys(map).forEach(function (k) {
      w.ZPAGES[k] = map[k];
      if (w.ZR) w.ZR.reg(k, map[k]);
    });
  };
  /** 学生端与教职工端的视角提示条 */
  KP.viewTip = function (label) {
    return D.h('div.req-note', {
      html: '当前为学生端视角预览：' + U.esc(label || '展示学生本人看到的页面与数据') +
        '。切换到其他角色可查看管理端视图。'
    });
  };

  w.ZKP = KP;
})(window);
