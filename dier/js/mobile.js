/* ==========================================================================
   mobile.js —— 手机端（m.html）应用
   独立路由（与 PC 端 app.html 各自一套，共用同一份数据与登录会话）：
     #/home              首页（学生看学分进度与待办；管理端看审核待办）
     #/square            活动广场（搜索 / 分类筛选 / 报名）
     #/act/<活动ID>       活动详情与报名
     #/sign/<活动ID>      活动签到（时间 / 位置 / 扫码三类真实校验）
     #/myact             我报名的
     #/score             我的成绩单（含导出 PDF）
     #/apply             分值申报
     #/msg               消息通知
     #/managed           我管理的（组织者 / 管理员）
     #/me                我的（含管理员↔学生身份切换、切换 PC 端）
   数据与学生端行为与 PC 端完全一致：在手机端报名 / 签到后，PC 端「活动管理」立即可见。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, SG = w.ZSIGN, DEMO = w.ZDEMO;

  var M = {};
  var st = { route: 'home', param: '', kw: '', cat: '', tab: 'mine', roleSwitching: false };

  /* ===================== 通用片段 ===================== */
  M.card = function (title, sub, body, right) {
    var el = D.h('div.m-card');
    if (title) {
      el.appendChild(D.h('div.m-ch',
        D.h('h3', title, sub ? D.h('span', { style: 'font-size:11px;color:var(--text3);font-weight:400;margin-left:6px' }, sub) : null),
        right || null));
    }
    D.appendChildDeep(el, body);
    return el;
  };
  M.secT = function (t, right) { return D.h('div.m-sec-t', D.h('i'), t, right ? D.h('span.r', right) : null); };
  M.kpis = function (items) {
    return D.h('div.m-kpis', items.map(function (it) {
      return D.h('div.m-kpi', D.h('div.v', { style: it.c ? 'color:' + it.c : null }, U.fmt(it.num), it.unit ? D.h('i', it.unit) : null), D.h('div.l', it.label));
    }));
  };
  M.empty = function (text, sub, icon) {
    return D.h('div.m-empty', D.h('div.e-ic', icon || '📭'), D.h('div.e-t', text || '暂无数据'), sub ? D.h('div', { style: 'font-size:11.5px;margin-top:5px' }, sub) : null);
  };
  M.note = function (html) { return D.h('div.m-note', { html: html }); };
  M.chips = function (options, value, onChange) {
    var host = D.h('div.m-chips');
    options.forEach(function (o) {
      var val = Array.isArray(o) ? o[0] : o;
      var lab = Array.isArray(o) ? o[1] : o;
      host.appendChild(D.h('button' + (String(val) === String(value) ? '.on' : ''), {
        onclick: function (e) {
          D.qa('button', host).forEach(function (b) { b.classList.remove('on'); });
          e.currentTarget.classList.add('on');
          onChange(val);
        }
      }, lab));
    });
    return host;
  };
  M.row = function (icon, fg, bg, title, desc, right, onClick) {
    return D.h('div.m-row', { onclick: onClick || null },
      D.h('div.ic', { style: 'background:' + bg + ';color:' + fg }, icon),
      D.h('div.tx', D.h('div.t', title), desc ? D.h('div.d', desc) : null),
      right ? (typeof right === 'string' ? D.h('div.rt', right) : right) : D.h('span', { style: 'color:#cbd5e1;font-size:15px' }, '›')
    );
  };
  M.tag = function (t, cls) { return UI.tag(t, cls); };
  M.status = function (s) { return w.ZKP.status(s); };

  /* ===================== 路由 ===================== */
  var PAGES = {};
  function go(name, param) {
    location.hash = '#/' + name + (param ? '/' + param : '');
  }
  function parse() {
    var h = String(location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/');
    return { name: parts[0] || 'home', param: parts.slice(1).join('/') || '' };
  }

  /* ===================== 顶部栏与底部栏 ===================== */
  function header(cfg) {
    var el = D.h('div.m-hd' + (cfg.plain ? '.plain' : ''));
    if (cfg.back) {
      el.appendChild(D.h('button.m-back', { onclick: function () { history.length > 1 ? history.back() : go(cfg.backTo || 'home'); } }, '‹'));
    }
    el.appendChild(D.h('div.m-ttl', D.h('div', cfg.title || ''), cfg.sub ? D.h('div.m-sub', cfg.sub) : null));
    if (cfg.actions) el.appendChild(D.h('div.m-act', cfg.actions));
    return el;
  }

  var TABS = [
    { k: 'home', n: '首页', ic: '🏠' },
    { k: 'square', n: '活动', ic: '🎪' },
    { k: 'myact', n: '我的报名', ic: '📋' },
    { k: 'msg', n: '消息', ic: '🔔' },
    { k: 'me', n: '我的', ic: '👤' }
  ];
  function tabbar() {
    var el = D.h('div.m-tabbar');
    var unread = DB.count('msgs', function (m) { return U.int(m.unreadCount, 0) > 0; });
    var pending = DB.count('enrollments', function (e) { return e.status === '待审核'; });
    TABS.forEach(function (t) {
      var badge = t.k === 'msg' ? unread : (t.k === 'myact' ? (ZA.isStudent() ? DB.filter('enrollments', function (e) {
        return e.studentId === ZA.viewStudentId() && e.status === '待审核';
      }).length : 0) : 0);
      el.appendChild(D.h('button.m-tab' + (st.tabKey === t.k ? '.on' : ''), {
        onclick: function () { go(t.k); }
      }, D.h('span.ti', t.ic), D.h('span', t.n), badge ? D.h('span.bd', badge) : null));
    });
    return el;
  }

  /* ===================== 页面：首页 ===================== */
  PAGES.home = function (main, hd) {
    var stu = ZA.viewStudent();
    if (ZA.isStudent()) {
      var agg = stu ? (DB.aggOf(stu.id) || { total: 0, cat: {} }) : { total: 0, cat: {} };
      var sc = DB.scheme();
      var need = U.num(sc ? sc.standard.pass : 6);
      var recs = stu ? DB.recsOf(stu.id) : [];
      var myEnr = stu ? DB.filter('enrollments', function (e) { return e.studentId === stu.id; }) : [];
      var toSign = myEnr.filter(function (e) {
        var a = DB.get('activities', e.actId);
        return a && (a.status === '待开始' || a.status === '进行中') && e.status === '已通过' && e.signStatus !== '已签到';
      });
      var live = KP_pub().filter(function (a) { return a.status === '待开始' || a.status === '进行中'; });

      hd.title = '你好，' + (stu ? stu.name : '');
      hd.sub = stu ? (stu.college + ' · ' + stu.className) : '';

      main.appendChild(D.h('div', {
        style: 'background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:14px;padding:16px;color:#fff;margin-bottom:11px'
      },
        D.h('div', { style: 'font-size:11.5px;opacity:.86' }, '第二课堂学分进度 · ' + DB.data.meta.term),
        D.h('div', { style: 'font-size:32px;font-weight:800;line-height:1.15;margin-top:6px;font-variant-numeric:tabular-nums' },
          U.num(agg.total).toFixed(2), D.h('i', { style: 'font-size:12px;font-weight:400;opacity:.85;font-style:normal;margin-left:4px' }, '/ ' + need.toFixed(1) + ' 学分')),
        D.h('div', { style: 'height:8px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden;margin-top:11px' },
          D.h('i', { style: 'display:block;height:100%;border-radius:99px;background:#fff;width:' + U.clamp(need ? agg.total / need * 100 : 0, 0, 100).toFixed(1) + '%' })),
        D.h('div', { style: 'display:flex;justify-content:space-between;font-size:11px;opacity:.9;margin-top:6px' },
          D.h('span', U.num(agg.total) >= need ? '已达标 ✓' : '还差 ' + (need - U.num(agg.total)).toFixed(2) + ' 学分'),
          D.h('span', '认定记录 ' + recs.length + ' 条'))
      ));

      main.appendChild(M.kpis([
        { num: myEnr.filter(function (e) { return e.status !== '已取消'; }).length, label: '我报名的', unit: '个' },
        { num: DB.count('signins', function (x) { return stu && x.studentId === stu.id && x.status !== '缺勤'; }), label: '已签到', unit: '次', c: '#059669' },
        { num: toSign.length, label: '待签到', unit: '个', c: '#d97706' },
        { num: DB.count('msgs', function (m) { return U.int(m.unreadCount, 0) > 0; }), label: '未读消息', unit: '条', c: '#dc2626' }
      ]));

      if (toSign.length) {
        main.appendChild(D.h('div', M.secT('待办事项', toSign.length + ' 项')));
        main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, toSign.slice(0, 3).map(function (e) {
          var a = DB.get('activities', e.actId);
          return M.row('📍', '#2563eb', '#eff6ff', '待签到 · ' + (a ? a.title : e.actTitle),
            (a ? U.dt(a.start) : '') + ' · ' + (a ? a.place : ''), '去签到', function () { go('sign', e.actId); });
        })));
      }

      main.appendChild(D.h('div', M.secT('推荐活动', '报名中 ' + live.length + ' 个', D.h('span.r', { onclick: function () { go('square'); }, style: 'color:#2563eb' }, '全部 ›'))));
      if (live.length) {
        main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, live.slice(0, 4).map(function (a) { return actRow(a); })));
      } else main.appendChild(D.h('div.m-card', M.empty('暂无正在报名的活动')));

      if (recs.length) {
        main.appendChild(D.h('div', M.secT('最近认定', '共 ' + recs.length + ' 条', D.h('span.r', { onclick: function () { go('score'); }, style: 'color:#2563eb' }, '成绩单 ›'))));
        main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, U.sortBy(recs, function (r) { return r.at; }, true).slice(0, 5).map(function (r) {
          return M.row('🎓', '#7c3aed', '#f5f3ff', r.actTitle || r.cat, U.d( r.at) + ' · ' + r.cat, '+' + r.credit + ' 学分');
        })));
      }
      return;
    }

    /* 管理端首页 */
    hd.title = '管理端 · 手机版';
    hd.sub = ZA.session.name + ' · ' + (ZA.ROLE_LABEL[ZA.role()] || '');
    main.appendChild(D.h('div', M.note('这是手机端的管理视图。完整管理功能请打开 PC 端；手机端提供待办处理与关键数据速览。')));
    main.appendChild(M.kpis([
      { num: DB.count('activities', function (a) { return a.status === '待审核'; }), label: '活动待审', unit: '个', c: '#d97706' },
      { num: DB.count('enrollments', function (e) { return e.status === '待审核'; }), label: '报名待审', unit: '条' },
      { num: DB.count('scoreApps', function (x) { return x.status === '待初审' || x.status === '待终审'; }), label: '申报待审', unit: '条', c: '#7c3aed' },
      { num: DB.count('contents', function (c) { return c.status === '待审'; }), label: '内容待审', unit: '条', c: '#dc2626' }
    ]));
    main.appendChild(D.h('div', M.secT('快捷处理')));
    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' },
      M.row('📝', '#2563eb', '#eff6ff', '活动发布与审核', '待审 ' + DB.count('activities', function (a) { return a.status === '待审核'; }) + ' 个', null, function () { go('managed', 'audit'); }),
      M.row('✅', '#0891b2', '#ecfeff', '报名审核', '待审 ' + DB.count('enrollments', function (e) { return e.status === '待审核'; }) + ' 条', null, function () { go('managed', 'enroll'); }),
      M.row('🎯', '#7c3aed', '#f5f3ff', '分值申报审核', '待审 ' + DB.count('scoreApps', function (x) { return x.status === '待初审' || x.status === '待终审'; }) + ' 条', null, function () { go('managed', 'apply'); }),
      M.row('📊', '#d97706', '#fffbeb', '运行数据速览', '活动 / 报名 / 学分', null, function () { go('managed', 'dash'); })
    ));
    main.appendChild(D.h('div', M.secT('最近活动')));
    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' },
      U.sortBy(KP_pub(), function (a) { return a.start; }, true).slice(0, 5).map(function (a) { return actRow(a); })));
  };
  function KP_pub() { return w.ZKP.pubList(DB.col('activities')); }

  /* ===================== 页面：活动广场 ===================== */
  function actRow(a) {
    var cap = U.int((a.items[0] || {}).limit, a.maxNum);
    var used = DB.count('enrollments', function (e) { return e.actId === a.id && e.status !== '已驳回'; });
    return D.h('div.m-act', { onclick: function () { go('act', a.id); } },
      D.h('div.cv', { style: 'background:' + (a.catGrad || 'linear-gradient(135deg,#93c5fd,#2563eb)') },
        D.h('span', { style: 'background:rgba(255,255,255,.9);color:' + (a.catColor || '#2563eb') + ';font-size:9.5px;padding:1px 6px;border-radius:99px;font-weight:700' }, a.cat)),
      D.h('div.bd',
        D.h('div.t', a.title),
        D.h('div.m', '🕒 ' + U.dt(a.start, false) + ' ' + String(a.start).slice(11) + ' · ' + a.form),
        D.h('div.m', '🏛 ' + a.host),
        D.h('div.foot',
          M.tag(a.status, a.status === '进行中' ? 'tag-warn' : (a.status === '已结束' ? 'tag-info' : 'tag-ok')),
          D.h('span', { style: 'font-size:10.5px;color:var(--text3)' }, '🎓 ' + a.credit + ' 学分 · ' + used + (cap ? '/' + cap : '') + ' 人'))
      ));
  }

  PAGES.square = function (main, hd) {
    hd.title = '活动广场';
    hd.sub = '共 ' + KP_pub().length + ' 个已发布活动';
    hd.actions = [D.h('button.m-ib', { onclick: function () { go('myact'); }, title: '我报名的' }, '📋')];

    var kwInput = D.h('input.m-search', {
      placeholder: '搜索活动标题 / 主办方 / 地点…', value: st.kw,
      oninput: function (e) { st.kw = e.target.value; paint(); }
    });
    main.appendChild(kwInput);
    var catHost = D.h('div');
    var listHost = D.h('div');
    main.appendChild(catHost);
    main.appendChild(listHost);

    function paintCats() {
      D.fill(catHost, null);
      catHost.appendChild(M.chips([['', '全部']].concat(DB.col('cats').map(function (c) { return [c.name, c.name]; })), st.cat, function (v) { st.cat = v; paintCats(); paint(); }));
    }
    function paint() {
      D.fill(listHost, null);
      var l = KP_pub();
      if (st.kw) l = l.filter(function (a) { return U.hitAny([a.title, a.host, a.cat, a.place], st.kw); });
      if (st.cat) l = l.filter(function (a) { return a.cat === st.cat; });
      l = U.sortBy(l, function (a) { return a.start; }, true);
      if (!l.length) { listHost.appendChild(D.h('div.m-card', M.empty('没有符合条件的活动', '换个关键词或分类试试'))); return; }
      var stu = w.ZKP ? (ZA.isStudent() ? ZA.viewStudent() : null) : null;
      listHost.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, l.map(function (a) {
        var mine = stu ? DB.find('enrollments', function (e) { return e.actId === a.id && e.studentId === stu.id; }) : null;
        return D.h('div', { style: 'position:relative' },
          actRow(a),
          mine ? D.h('span', { style: 'position:absolute;right:10px;bottom:12px' }, M.status(mine.status)) : null);
      })));
    }
    paintCats(); paint();
  };

  /* ===================== 页面：活动详情与报名 ===================== */
  PAGES.act = function (main, hd, id) {
    var a = DB.get('activities', id);
    /* 缺参数或参数失效时回到活动广场，避免出现空白详情页 */
    if (!id || !a) {
      hd.title = '活动详情';
      hd.sub = id ? '该活动不存在或已下线' : '请从活动广场选择活动';
      main.appendChild(D.h('div.m-card', M.empty(
        id ? '活动不存在' : '未指定活动',
        id ? '该活动可能已被取消或已下线' : '请先在活动广场中挑选活动', '🎯')));
      var hot = KP_pub().slice(0, 5);
      if (hot.length) {
        main.appendChild(D.h('div.m-card', {},
          D.h('div.m-sec-t', '近期活动'),
          hot.map(function (x) {
            return D.h('div.m-row', { style: 'cursor:pointer', onclick: function () { go('act', x.id); } },
              D.h('div', { style: 'flex:1' },
                D.h('div', { style: 'font-weight:600;font-size:13px' }, x.title),
                D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:3px' }, x.cat + ' · ' + U.dt(x.start))),
              D.h('div', { style: 'color:var(--primary);font-size:12.5px' }, '查看 ›'));
          })));
      }
      main.appendChild(D.h('div.m-card', {}, D.h('button.m-btn-block', { onclick: function () { go('square'); } }, '去活动广场')));
      return;
    }
    hd.title = a.title;
    hd.sub = a.host + ' · ' + a.cat;
    hd.back = true; hd.backTo = 'square';

    var stu = ZA.isStudent() ? ZA.viewStudent() : null;
    var mine = stu ? DB.find('enrollments', function (e) { return e.actId === a.id && e.studentId === stu.id; }) : null;
    var cap = U.int((a.items[0] || {}).limit, a.maxNum);
    var used = DB.count('enrollments', function (e) { return e.actId === a.id && e.status !== '已驳回'; });

    main.appendChild(D.h('div.m-banner', { style: 'background:' + (a.catGrad || 'linear-gradient(135deg,#93c5fd,#2563eb)') },
      D.h('div.t', a.title),
      D.h('div.m', a.cat + ' · ' + a.level + ' · ' + a.form + ' · 🎓 ' + a.credit + ' 学分')
    ));

    main.appendChild(M.kpis([
      { num: U.dt(a.start, false), label: '活动日期' },
      { num: used, unit: cap ? '/' + cap : '', label: '已报名', c: '#2563eb' },
      { num: a.credit, unit: '学分', label: '认定学分', c: '#7c3aed' },
      { num: a.hours, unit: '学时', label: '认定学时', c: '#0891b2' }
    ]));

    main.appendChild(M.card('活动信息', null, D.h('div', { style: 'font-size:12.5px;line-height:2;color:var(--text2)' },
      D.h('div', '🕒 ' + U.dt(a.start) + ' — ' + String(a.end).slice(11)),
      D.h('div', '📅 报名 ' + U.dt(a.enrollStart, false) + ' 起至 ' + U.dt(a.enrollEnd)),
      D.h('div', '📍 ' + (a.place || '未设置') + (a.mapPin ? '（已地图选点）' : '')),
      D.h('div', '🎯 签到方式：' + ((a.signModes || []).join('、') || '未设置')),
      D.h('div', '👥 报名范围：' + ((a.audiences || []).join('、') || '全体学生')),
      D.h('div', '🏛 主办：' + a.host)
    )));

    main.appendChild(M.card('活动介绍', null, D.h('div', { style: 'font-size:12.5px;line-height:1.9;color:var(--text2)' }, a.desc || '（暂无介绍）')));

    if ((a.items || []).length) {
      main.appendChild(M.card('报名项目', (a.items || []).length + ' 个', (a.items || []).map(function (it) {
        var ic = U.int(it.limit, 0);
        var iu = DB.count('enrollments', function (e) { return e.itemId === it.id && e.status !== '已驳回'; });
        return D.h('div', { style: 'padding:9px 0;border-bottom:1px solid #f1f5fb' },
          D.h('div', { style: 'display:flex;align-items:center;gap:8px' },
            D.h('span', { style: 'font-weight:650;font-size:13px;flex:1' }, it.name),
            D.h('span', { style: 'font-size:11.5px;color:var(--text3)' }, iu + (ic ? '/' + ic : '') + ' 人')),
          D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' }, '报名窗口 ' + U.dt(it.enrollStart, false) + ' — ' + U.dt(it.enrollEnd)),
          it.cancelRule ? D.h('div', { style: 'font-size:11px;color:#b45309;margin-top:2px' }, '取消规则：' + it.cancelRule) : null);
      })));
    }

    /* 报名动作 */
    var actHost = D.h('div');
    main.appendChild(actHost);
    function paintAct() {
      D.fill(actHost, null);
      if (!ZA.isStudent()) {
        actHost.appendChild(D.h('div.m-card', M.note('当前为管理端身份。切换到「学生」身份后可用手机端报名与签到。')));
        actHost.appendChild(D.h('div.m-card', {},
          D.h('button.m-btn-block.ghost', { onclick: function () { go('me'); } }, '去「我的」切换为学生身份'),
          D.h('div', { style: 'height:8px' }),
          D.h('button.m-btn-block', { onclick: function () { location.href = 'app.html#actmgr/' + a.id; } }, '在 PC 端管理该活动')));
        return;
      }
      if (mine) {
        actHost.appendChild(D.h('div.m-card', {},
          D.h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:10px' },
            M.status(mine.status), D.h('span', { style: 'font-size:12px;color:var(--text3)' }, '报名于 ' + mine.at)),
          D.h('div', { style: 'font-size:12px;color:var(--text2);margin-bottom:11px' },
            '报名项目：' + mine.itemName + ' · 签到状态：' + (mine.signStatus || '未签到')),
          (a.status === '待开始' || a.status === '进行中')
            ? D.h('button.m-btn-block', { onclick: function () { go('sign', a.id); } }, '📍 去签到')
            : D.h('button.m-btn-block', { disabled: true }, '活动已结束'),
          D.h('div', { style: 'height:8px' }),
          (a.status === '待开始' && mine.status !== '已取消')
            ? D.h('button.m-btn-block.ghost', { onclick: function () { cancelEnroll(mine, a); } }, '取消报名')
            : null));
        return;
      }
      var canEnroll = a.status === '待开始' || a.status === '进行中';
      actHost.appendChild(D.h('div.m-card', {},
        D.h('button.m-btn-block', {
          disabled: !canEnroll,
          onclick: function () { enroll(a, stu); }
        }, canEnroll ? '立即报名' : '活动已结束'),
        D.h('div', { style: 'font-size:11px;color:var(--text3);text-align:center;margin-top:8px' },
          a.needAudit === false ? '该活动无需审核，报名后直接通过' : '报名后需组织者审核，审核结果会推送消息')));
    }
    paintAct();

    main.appendChild(D.h('div.m-card', M.note('手机端报名与 PC 端数据实时同步：报名后可在 PC 端「活动管理 · 报名管理」中看到该条记录并完成审核。')));
  };

  function enroll(a, stu) {
    if (!stu) { UI.toast('未识别到学生身份', '请切换到学生身份', 'warn'); return; }
    /* 与 PC 端一致的校验口径：黑名单 → 并行活动数 → 名额 */
    var bl = DB.find('blacklist', function (b) { return b.studentId === stu.id && b.active; });
    if (bl) { UI.toast('你当前处于活动黑名单', bl.reason, 'err'); return; }
    var rule = DB.find('actRules', function (r) { return r.id === 'AR1' && r.enabled; });
    if (rule) {
      var max = U.int(rule.params.maxParallel, 3);
      var live = DB.filter('enrollments', function (e) {
        if (e.studentId !== stu.id || e.status === '已驳回' || e.status === '已取消') return false;
        var ea = DB.get('activities', e.actId);
        return ea && (ea.status === '待开始' || ea.status === '进行中');
      }).length;
      if (live >= max) { UI.toast('已达同时报名上限', '规则限制同时进行中的活动不超过 ' + max + ' 个', 'err'); return; }
    }
    var cap = U.int((a.items[0] || {}).limit, a.maxNum);
    var used = DB.count('enrollments', function (e) { return e.actId === a.id && e.status !== '已驳回'; });
    if (cap && used >= cap) { UI.toast('名额已满', '上限 ' + cap + ' 人', 'err'); return; }

    var it = (a.items || [])[0] || null;
    var rec = DB.insert('enrollments', {
      actId: a.id, actTitle: a.title, cat: a.cat,
      itemId: it ? it.id : '', itemName: it ? it.name : '统一报名',
      studentId: stu.id, sno: stu.sno, name: stu.name, gender: stu.gender,
      collegeId: stu.collegeId, college: stu.college, major: stu.major,
      className: stu.className, grade: stu.grade, contact: stu.contact,
      at: U.dt(new Date()), status: a.needAudit === false ? '已通过' : '待审核',
      reviewer: '', note: '', onSite: false, signStatus: '未签到', formData: {}, importBatch: ''
    });
    if (it) {
      DB.update('activities', a.id, {
        items: (a.items || []).map(function (x) { return x.id === it.id ? Object.assign({}, x, { enrolled: U.int(x.enrolled, 0) + 1 }) : x; })
      });
    }
    DB.insert('logs', {
      at: U.dt(new Date()), actor: stu.name, role: '学生', action: '活动报名（手机端）',
      module: '活动管理', target: a.id, ip: '10.16.1.' + (100 + U.int(String(stu.sno).slice(-2), 10)),
      result: '成功', detail: a.title
    });
    UI.toast('报名已提交', rec.status === '待审核' ? '等待组织者审核，结果会推送消息' : '报名成功', 'ok');
    render();
  }

  function cancelEnroll(enr, a) {
    UI.confirm({
      title: '取消报名', danger: true, okText: '确认取消',
      text: '确认取消「' + a.title + '」的报名吗？',
      detail: '取消后名额将释放给其他同学，可在活动广场重新报名。',
      onOk: function () {
        DB.update('enrollments', enr.id, { status: '已取消', note: '学生在手机端取消' });
        var it = (a.items || [])[0];
        if (it) {
          DB.update('activities', a.id, {
            items: (a.items || []).map(function (x) { return x.id === it.id ? Object.assign({}, x, { enrolled: Math.max(0, U.int(x.enrolled, 1) - 1) }) : x; })
          });
        }
        UI.toast('已取消报名', a.title, 'ok');
        render();
      }
    });
  }

  /* ===================== 页面：签到 ===================== */
  /** 当前学生「已报名通过且待签到」的活动（首页提示与签到页共用同一口径） */
  function mySignable() {
    var stu = ZA.viewStudent();
    if (!stu) return [];
    return DB.filter('enrollments', function (e) { return e.studentId === stu.id; })
      .map(function (e) {
        var a = DB.get('activities', e.actId);
        return a && e.status === '已通过' && e.signStatus !== '已签到'
          && (a.status === '待开始' || a.status === '进行中') ? { act: a, enr: e } : null;
      })
      .filter(Boolean);
  }

  PAGES.sign = function (main, hd, id) {
    var a = DB.get('activities', id);
    /* 直接访问 #/sign（缺活动参数）或参数失效时，给出可操作的指引而不是空白页 */
    if (!id) {
      hd.title = '活动签到';
      hd.sub = '请选择要签到的活动';
      main.appendChild(D.h('div.m-card', M.empty('未指定活动', '请从「我报名的」列表中点击「去签到」进入', '📍')));
      var todo = mySignable();
      if (todo.length) {
        main.appendChild(D.h('div.m-card', {},
          D.h('div.m-sec-t', '待签到活动（' + todo.length + ' 场）'),
          todo.map(function (x) {
            return D.h('div.m-row', { style: 'cursor:pointer', onclick: function () { go('sign', x.act.id); } },
              D.h('div', { style: 'flex:1' },
                D.h('div', { style: 'font-weight:600;font-size:13px' }, x.act.title),
                D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:3px' }, U.dt(x.act.start) + ' · ' + x.act.place)),
              D.h('div', { style: 'color:var(--primary);font-size:12.5px' }, '去签到 ›'));
          })));
      }
      main.appendChild(D.h('div.m-card', {}, D.h('button.m-btn-block', { onclick: function () { go('myact'); } }, '查看我报名的活动')));
      return;
    }
    if (!a) { main.appendChild(M.empty('活动不存在', '该活动可能已被取消或已下线', '❓')); return; }
    var stu = ZA.viewStudent();
    var enr = stu ? DB.find('enrollments', function (e) { return e.actId === a.id && e.studentId === stu.id; }) : null;
    hd.title = '活动签到';
    hd.sub = a.title;
    hd.back = true; hd.backTo = 'myact';

    if (!enr) {
      main.appendChild(D.h('div.m-card', M.empty('尚未报名该活动', '报名成功后才能签到，可返回活动详情报名', '📍')));
      main.appendChild(D.h('div.m-card', {}, D.h('button.m-btn-block', { onclick: function () { go('act', a.id); } }, '去活动详情报名')));
      return;
    }
    var sg = DB.find('signins', function (x) { return x.actId === a.id && x.studentId === enr.studentId; });
    if (sg && sg.status === '已签到') {
      main.appendChild(M.card('签到状态', '已签到', D.h('div', {},
        D.h('div', { style: 'text-align:center;padding:14px 0' },
          D.h('div', { style: 'font-size:40px' }, '✅'),
          D.h('div', { style: 'font-weight:700;font-size:15px;margin-top:8px' }, '签到成功'),
          D.h('div', { style: 'font-size:12px;color:var(--text3);margin-top:5px' }, sg.method + ' · ' + sg.at)),
        KP_kv([['签到方式', sg.method], ['签到时间', sg.at], ['校验位置', sg.place || '—'], ['设备', sg.device || '—']])
      )));
      main.appendChild(D.h('div.m-card', M.note('签到结果已同步至 PC 端「活动管理 · 签到管理」，并计入该活动的签到率与学分认定依据。')));
      return;
    }

    var modes = (a.signModes && a.signModes.length) ? a.signModes.slice() : ['时间限制签到'];
    var state = { timeOK: false, posOK: false, scanOK: false, loc: SG.actPoint(a).name, scanned: '' };

    main.appendChild(D.h('div.m-note', { html: '本活动启用的签到方式：<b>' + modes.join('、') + '</b>。' + modes.length + ' 项全部通过后方可签到成功。' }));

    var modeHost = D.h('div');
    var okBtn = D.h('button.m-btn-block', { onclick: submit }, '确认签到');
    main.appendChild(modeHost);
    main.appendChild(D.h('div.m-card', {}, okBtn,
      D.h('div', { style: 'font-size:11px;color:var(--text3);text-align:center;margin-top:8px' }, '活动地点：' + (a.place || '未设置'))));

    /* 时间限制签到 */
    var timerHost = D.h('div');
    function paintTime() {
      D.fill(timerHost, null);
      var s = U.toDate(a.start), e = U.toDate(a.end);
      var now = Date.now();
      var from = s ? s.getTime() - 30 * 60000 : now, to = e ? e.getTime() + 30 * 60000 : now;
      var ok = now >= from && now <= to;
      state.timeOK = ok;
      timerHost.appendChild(D.h('div.m-card', {},
        D.h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px' },
          M.tag('时间限制签到', 'tag-info'), D.h('span', { style: 'font-size:11.5px;color:var(--text3)' }, '系统时间校验')),
        D.h('div', { style: 'font-size:12.5px;line-height:1.9;color:' + (ok ? '#059669' : '#dc2626') },
          (ok ? '✓ ' : '✕ ') + (ok
            ? '当前时间在允许签到区间内（活动 ' + U.dt(a.start) + ' 起，前后 30 分钟缓冲）'
            : (now < from ? '签到尚未开始（活动开始前 30 分钟开放签到）' : '签到已结束（活动结束后 30 分钟关闭签到）'))),
        D.h('div', { style: 'height:9px' }),
        D.h('button.m-btn-block.ghost', { onclick: function () { paintTime(); paint(); UI.toast('已重新校验时间', ok ? '校验通过' : '未通过', ok ? 'ok' : 'warn'); } }, '重新校验当前时间')
      ));
    }

    /* 位置签到 */
    var posHost = D.h('div');
    function paintPos() {
      D.fill(posHost, null);
      var ap = SG.actPoint(a);
      var cur = SG.POINTS.filter(function (p) { return p.name === state.loc; })[0] || SG.POINTS[0];
      var d = SG.dist(cur, ap);
      state.posOK = d <= SG.RADIUS;
      posHost.appendChild(D.h('div.m-card', {},
        D.h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px' },
          M.tag('位置签到', 'tag-info'),
          D.h('span', { style: 'font-size:11.5px;color:var(--text3)' }, '允许偏差 ' + SG.RADIUS + ' 米')),
        D.h('div', { style: 'font-size:12px;color:var(--text3);margin-bottom:7px' }, '模拟当前定位（演示环境提供校内点位，非真实 GPS）'),
        M.chips(SG.POINTS.map(function (p) { return [p.name, p.name]; }), state.loc, function (v) { state.loc = v; paintPos(); paint(); }),
        D.h('div', { style: 'font-size:12.5px;line-height:1.9;color:' + (state.posOK ? '#059669' : '#dc2626') },
          (state.posOK ? '✓ ' : '✕ ') + '距活动地点「' + ap.name + '」约 ' + d + ' 米' +
          (state.posOK ? '（在允许范围内）' : '（超出 ' + SG.RADIUS + ' 米范围，签到不通过）'))
      ));
    }

    /* 扫码签到 */
    var scanHost = D.h('div');
    function paintScan(drawCode) {
      D.fill(scanHost, null);
      var card = D.h('div.m-card', {},
        D.h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:9px' },
          M.tag('扫码签到', 'tag-info'),
          D.h('span', { style: 'font-size:11.5px;color:var(--text3)' }, '动态码每 ' + (a.signRefresh || 60) + ' 秒刷新')),
        D.h('div.m-sign-qr', { id: 'scanBox' }),
        D.h('div', { id: 'scanMsg', style: 'font-size:12px;line-height:1.8;color:var(--text3);margin-bottom:10px' },
          '对准会场大屏上的签到二维码。二维码只对当前时间片有效，过期即失效。'),
        D.h('div', { style: 'display:flex;gap:8px' },
          D.h('button.m-btn-block', {
            onclick: function () {
              var tk = SG.tokenOf(a);
              var v = SG.verify(a, tk);
              state.scanOK = v.ok; state.scanned = tk;
              var box = D.q('#scanBox', scanHost);
              if (box) D.fill(box, w.ZQR.svg(tk, 190, { quiet: 2 }));
              var msg = D.q('#scanMsg', scanHost);
              if (msg) {
                msg.textContent = v.ok ? '✓ 识别到二维码内容：' + tk + '（当前有效码）' : '✕ 识别到二维码内容：' + tk + ' —— ' + v.reason;
                msg.style.color = v.ok ? '#059669' : '#dc2626';
              }
              paint();
            }
          }, '📷 扫描大屏二维码'),
          D.h('button.m-btn-block.ghost', {
            onclick: function () {
              /* 演示过期码：取上一个时间片的码，验证会真实失败 */
              var prev = Date.now() - (a.signRefresh || 60) * 1000;
              var tk = SG.tokenOf(a, prev);
              var v = SG.verify(a, tk);
              state.scanOK = v.ok;
              var box = D.q('#scanBox', scanHost);
              if (box) D.fill(box, w.ZQR.svg(tk, 190, { quiet: 2 }));
              var msg = D.q('#scanMsg', scanHost);
              if (msg) { msg.textContent = '✕ 识别到二维码内容：' + tk + ' —— ' + v.reason; msg.style.color = '#dc2626'; }
              UI.toast('扫码未通过', v.reason, 'err');
              paint();
            }
          }, '试扫过期码')
        )
      );
      scanHost.appendChild(card);
      if (drawCode) {
        var tk0 = SG.tokenOf(a);
        state.scanned = tk0;
        var box = D.q('#scanBox', scanHost);
        if (box) D.fill(box, w.ZQR.svg(tk0, 190, { quiet: 2 }));
        state.scanOK = SG.verify(a, tk0).ok;
      }
    }

    modes.forEach(function (m) {
      if (m === '时间限制签到') { paintTime(); main.insertBefore(timerHost, modeHost); }
      else if (m === '位置签到') { paintPos(); main.insertBefore(posHost, modeHost); }
      else if (m === '扫码签到') { paintScan(false); main.insertBefore(scanHost, modeHost); }
      else {
        var other = D.h('div.m-card', {}, M.tag(m, 'tag-info'), D.h('div', { style: 'font-size:12.5px;color:var(--text2);margin-top:6px' }, '该签到方式由组织者在现场核验，无需学生端操作。'));
        state[m] = true;
        main.insertBefore(other, modeHost);
      }
    });

    function passed() {
      return modes.every(function (m) {
        if (m === '时间限制签到') return state.timeOK;
        if (m === '位置签到') return state.posOK;
        if (m === '扫码签到') return state.scanOK;
        return true;
      });
    }
    function paint() {
      var got = 0, need = 0;
      modes.forEach(function (m) {
        need++;
        if (m === '时间限制签到' ? state.timeOK : m === '位置签到' ? state.posOK : m === '扫码签到' ? state.scanOK : true) got++;
      });
      okBtn.disabled = got < need;
      okBtn.textContent = got < need ? '确认签到（' + got + '/' + need + ' 项已通过）' : '确认签到';
    }
    function submit() {
      var now = U.dt(new Date());
      var payload = {
        actId: a.id, actTitle: a.title, itemName: enr.itemName,
        studentId: enr.studentId, name: enr.name, sno: enr.sno,
        college: enr.college, className: enr.className,
        method: modes.join(' + '), at: now, status: '已签到',
        place: state.loc, device: 'iOS 移动端', makeUp: false
      };
      var exist = DB.find('signins', function (x) { return x.actId === a.id && x.studentId === enr.studentId; });
      if (exist) DB.update('signins', exist.id, payload); else DB.insert('signins', payload);
      DB.update('enrollments', enr.id, { signStatus: '已签到' });
      DB.insert('logs', {
        at: now, actor: enr.name, role: '学生', action: '活动签到（手机端）',
        module: '活动管理', target: a.id, ip: '10.16.1.' + (100 + U.int(String(enr.sno).slice(-2), 10)),
        result: '成功', detail: a.title + ' · ' + payload.method
      });
      UI.toast('签到成功', payload.method + ' · ' + now, 'ok');
      go('sign', a.id);
    }
    paint();
  };
  function KP_kv(pairs) { return w.ZUI.kv(pairs); }

  /* ===================== 页面：我报名的 ===================== */
  PAGES.myact = function (main, hd) {
    hd.title = '我报名的';
    if (!ZA.isStudent()) {
      main.appendChild(D.h('div.m-card', M.note('当前为管理端身份，此处展示的是你所管理活动的最新报名。切换到「学生」身份可查看本人报名。')));
      var pend = DB.filter('enrollments', function (e) { return e.status === '待审核'; }).slice(0, 30);
      main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, pend.length ? pend.map(function (e) {
        return M.row('🙋', '#2563eb', '#eff6ff', e.name + '（' + e.sno + '）', e.actTitle + ' · ' + e.className, M.status(e.status));
      }) : M.empty('暂无待审核报名')));
      return;
    }
    var stu = ZA.viewStudent();
    var l = DB.filter('enrollments', function (e) { return e.studentId === stu.id; });
    var sub = st.tab === 'mine' ? l : l.filter(function (e) { return e.signStatus === '已签到'; });
    hd.sub = stu.name + ' · ' + stu.className;

    main.appendChild(M.chips([['mine', '我报名的(' + l.length + ')'], ['joined', '我参加的(' + l.filter(function (e) { return e.signStatus === '已签到'; }).length + ')']],
      st.tab, function (v) { st.tab = v; render(); }));

    if (!sub.length) { main.appendChild(D.h('div.m-card', M.empty('还没有报名记录', '去活动广场看看正在报名的活动'))); return; }
    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, U.sortBy(sub, function (e) { return e.at; }, true).map(function (e) {
      var a = DB.get('activities', e.actId);
      var canSign = a && (a.status === '待开始' || a.status === '进行中') && e.status === '已通过' && e.signStatus !== '已签到';
      return D.h('div', { style: 'padding:12px 13px;border-bottom:1px solid #f1f5fb;cursor:pointer' },
        D.h('div', { style: 'display:flex;align-items:flex-start;gap:9px' },
          D.h('div', { style: 'flex:1;min-width:0' },
            D.h('div', { style: 'font-weight:650;font-size:13px;line-height:1.45' }, a ? a.title : e.actTitle),
            D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:4px' }, (a ? U.dt(a.start, false) + ' ' + String(a.start).slice(11) + ' · ' + (a.place || '') : '')),
            D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:2px' }, '报名项目：' + e.itemName + ' · 报名于 ' + e.at)),
          D.h('div', { style: 'text-align:right;flex:0 0 auto' },
            M.status(e.status),
            D.h('div', { style: 'font-size:10.5px;color:var(--text3);margin-top:5px' }, e.signStatus || '未签到'))),
        canSign ? D.h('div', { style: 'margin-top:9px' },
          D.h('button.m-btn-block', { onclick: function () { go('sign', e.actId); } }, '📍 去签到')) : null
      );
    })));
  };

  /* ===================== 页面：我的成绩单 ===================== */
  PAGES.score = function (main, hd) {
    hd.title = '我的成绩单';
    hd.actions = [D.h('button.m-ib', { onclick: exportPDF, title: '导出 PDF' }, '⤓')];
    if (!ZA.isStudent()) {
      main.appendChild(D.h('div.m-card', M.note('当前为管理端身份。切换到「学生」身份可查看本人成绩单；管理端的成绩汇总查询请使用 PC 端「成绩管理」。')));
      main.appendChild(D.h('div.m-card', {}, D.h('button.m-btn-block.ghost', { onclick: function () { go('me'); } }, '切换为学生身份')));
      return;
    }
    var stu = ZA.viewStudent();
    var agg = DB.aggOf(stu.id) || { total: 0, cat: {}, count: 0 };
    var sc = DB.scheme();
    var need = U.num(sc ? sc.standard.pass : 6);
    var recs = DB.recsOf(stu.id);

    main.appendChild(D.h('div.m-score-hd', {},
      D.h('div.nm', stu.name + ' · ' + stu.sno),
      D.h('div.sub', stu.college + ' ' + stu.className + ' · ' + (sc ? sc.name : '')),
      D.h('div.big', U.num(agg.total).toFixed(2), D.h('i', '/ ' + need.toFixed(1) + ' 学分')),
      D.h('div.line', U.num(agg.total) >= need ? '✓ 已达到毕业要求' : '还差 ' + (need - U.num(agg.total)).toFixed(2) + ' 学分达标'),
      D.h('div', { style: 'height:7px;border-radius:99px;background:rgba(255,255,255,.3);margin-top:9px;overflow:hidden' },
        D.h('i', { style: 'display:block;height:100%;background:#fff;border-radius:99px;width:' + U.clamp(agg.total / need * 100, 0, 100).toFixed(1) + '%' }))
    ));

    main.appendChild(M.kpis([
      { num: recs.length, label: '认定记录', unit: '条' },
      { num: U.num(agg.total).toFixed(2), label: '累计学分', unit: '分', c: '#7c3aed' },
      { num: recs.reduce(function (a, r) { return a + U.num(r.hours); }, 0), label: '累计学时', unit: 'h', c: '#0891b2' },
      { num: recs.reduce(function (a, r) { return a + U.num(r.points); }, 0), label: '累计积分', unit: '分', c: '#d97706' }
    ]));

    main.appendChild(M.card('六大类别达成情况', null, DB.col('cats').map(function (c) {
      var got = U.num((agg.cat || {})[c.name] || 0);
      var std = U.num(((sc || {}).catStandard || {})[c.name] || 0);
      var pct = std ? U.clamp(got / std * 100, 0, 100) : 0;
      return D.h('div.m-catbar', {},
        D.h('div.h', D.h('span.n', c.name), D.h('span.v', got.toFixed(2) + ' / ' + std.toFixed(1) + ' 学分')),
        D.h('div.track', D.h('i', { style: 'width:' + pct.toFixed(1) + '%;background:' + c.color })),
        D.h('div', { style: 'font-size:10.5px;color:' + (std && got >= std * 0.6 ? '#059669' : '#dc2626') + ';margin-top:4px' },
          std ? (got >= std ? '已达标' : (got >= std * 0.6 ? '基本达标' : '未达标')) : '不适用'));
    })));

    main.appendChild(M.card('认定记录明细', '共 ' + recs.length + ' 条', recs.length ? U.sortBy(recs, function (r) { return r.at; }, true).map(function (r) {
      return D.h('div', { style: 'padding:9px 0;border-bottom:1px solid #f1f5fb' },
        D.h('div', { style: 'display:flex;align-items:flex-start;gap:8px' },
          D.h('div', { style: 'flex:1;min-width:0' },
            D.h('div', { style: 'font-weight:600;font-size:12.5px;line-height:1.45' }, r.actTitle),
            D.h('div', { style: 'font-size:10.5px;color:var(--text3);margin-top:3px' }, r.cat + ' · ' + r.source + ' · ' + U.d(r.at))),
          D.h('div', { style: 'flex:0 0 auto;text-align:right' },
            D.h('div', { style: 'font-weight:700;font-size:13px;color:#7c3aed' }, '+' + r.credit),
            D.h('div', { style: 'font-size:9.5px;color:var(--text3)' }, '学分'))));
    }) : M.empty('暂无认定记录')));

    main.appendChild(D.h('div.m-card', {},
      D.h('button.m-btn-block', { onclick: exportPDF }, '⤓ 导出成绩单 PDF'),
      D.h('div', { style: 'height:8px' }),
      D.h('button.m-btn-block.ghost', { onclick: function () { go('apply'); } }, '去分值申报')));

    function exportPDF() { w.ZKP.printBtn && printSheet(); }
    function printSheet() {
      var t = DB.find('tpls', function (x) { return x.enabled; }) || DB.col('tpls')[0];
      var html = w.ZTplSheet ? w.ZTplSheet(t, stu) : null;
      if (!html) {
        UI.printHTML('第二课堂成绩单 · ' + stu.name,
          '<div class="h1">' + U.esc(DB.data.meta.school) + ' 第二课堂成绩单</div>' +
          '<div class="sub">' + U.esc(DB.data.meta.term) + ' · 编号 DEKT-' + U.esc(String(stu.sno).slice(-8)) + '</div>' +
          KP.metricsHTML([
            ['姓名', stu.name], ['学号', stu.sno], ['学院', stu.college], ['专业班级', stu.major + ' ' + stu.className],
            ['累计学分', U.num(agg.total).toFixed(2)], ['达标线', need.toFixed(1)],
            ['是否达标', U.num(agg.total) >= need ? '已达标' : '未达标'], ['认定记录', recs.length + ' 条']
          ]) +
          '<div class="h2">按活动分类统计</div>' +
          KP.tableHTML([{ t: '素养类别', k: 'a' }, { t: '认定学分', k: 'b' }, { t: '类别标准', k: 'c' }, { t: '达成情况', k: 'd' }],
            DB.col('cats').map(function (c) {
              var got = U.num((agg.cat || {})[c.name] || 0);
              var std = U.num(((sc || {}).catStandard || {})[c.name] || 0);
              return { a: c.name, b: got.toFixed(2), c: std.toFixed(2), d: std ? (got >= std ? '已达标' : (got >= std * 0.6 ? '基本达标' : '未达标')) : '不适用' };
            })) +
          '<div class="h2">成绩明细（' + recs.length + ' 条）</div>' +
          KP.tableHTML([{ t: '序号', raw: function (r, i) { return i + 1; } }, { t: '活动名称', k: 'actTitle' }, { t: '活动分类', k: 'cat' },
            { t: '开展时间', k: 'at' }, { t: '认定学分', k: 'credit' }, { t: '认定学时', k: 'hours' },
            { t: '认定积分', k: 'points' }, { t: '认定状态', k: 'status' }], recs) +
          KP.sealHTML(t ? t.seal : null));
      }
    }
  };

  /* ===================== 页面：分值申报 ===================== */
  PAGES.apply = function (main, hd) {
    hd.title = '分值申报';
    hd.back = false;
    if (!ZA.isStudent()) {
      var pend = DB.filter('scoreApps', function (x) { return x.status === '待初审' || x.status === '待终审'; });
      main.appendChild(D.h('div.m-card', M.note('当前为管理端身份，展示待审核的分值申报。审核请在 PC 端「分值申报」中完成。')));
      main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, pend.length ? pend.slice(0, 30).map(function (x) {
        return M.row('🎯', '#7c3aed', '#f5f3ff', x.name + ' · ' + x.title, x.cat + ' · ' + x.credit + ' 学分 · ' + x.status, M.status(x.status));
      }) : M.empty('暂无待审申报')));
      return;
    }
    var stu = ZA.viewStudent();
    var l = DB.filter('scoreApps', function (x) { return x.studentId === stu.id; });
    main.appendChild(M.kpis([
      { num: l.length, label: '我的申报', unit: '条' },
      { num: l.filter(function (x) { return x.status === '待初审' || x.status === '待终审'; }).length, label: '审核中', unit: '条', c: '#d97706' },
      { num: l.filter(function (x) { return x.status === '已通过'; }).length, label: '已通过', unit: '条', c: '#059669' },
      { num: DB.filter('scoreRecs', function (r) { return r.studentId === stu.id && r.source === '分值申报'; }).reduce(function (a, r) { return a + U.num(r.credit); }, 0).toFixed(1), label: '已赋学分', unit: '分', c: '#7c3aed' }
    ]));
    main.appendChild(D.h('div.m-card', {},
      D.h('button.m-btn-block', { onclick: submitApp }, '＋ 新增分值申报'),
      D.h('div', { style: 'font-size:11px;color:var(--text3);text-align:center;margin-top:8px' }, '终审通过后系统自动赋分并写入成绩单')));
    main.appendChild(D.h('div', M.secT('我的申报记录', l.length + ' 条')));
    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, l.length ? U.sortBy(l, function (x) { return x.at; }, true).map(function (x) {
      var node = (x.flow || [])[U.int(x.step, 1)];
      return D.h('div', { style: 'padding:11px 13px;border-bottom:1px solid #f1f5fb' },
        D.h('div', { style: 'display:flex;align-items:flex-start;gap:9px' },
          D.h('div', { style: 'flex:1;min-width:0' },
            D.h('div', { style: 'font-weight:650;font-size:13px;line-height:1.45' }, x.title),
            D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' }, x.kind + ' · ' + x.cat + ' · ' + x.credit + ' 学分'),
            x.status === '已驳回' && x.note ? D.h('div', { style: 'font-size:11px;color:#b91c1c;margin-top:3px' }, '驳回原因：' + x.note) : null,
            D.h('div', { style: 'font-size:10.5px;color:var(--text3);margin-top:3px' }, U.d(x.at) + (x.status !== '已通过' && x.status !== '已驳回' && node ? ' · 当前：' + node.node : ''))),
          M.status(x.status)),
        x.status === '已驳回' ? D.h('div', { style: 'margin-top:8px' },
          D.h('button.m-btn-block.ghost', {
            onclick: function () {
              DB.update('scoreApps', x.id, {
                status: '待初审', step: 1, at: U.dt(new Date()),
                flow: (x.flow || []).map(function (f, i) { return Object.assign({}, f, { status: i === 0 ? 'done' : (i === 1 ? 'cur' : 'wait'), at: i === 0 ? U.dt(new Date()) : '' }); })
              });
              UI.toast('已重新提交', '回到学院初审环节', 'ok');
              render();
            }
          }, '修改后重新提交')) : null
      );
    }) : M.empty('你还没有提交过分值申报')));
  };
  function submitApp() {
    var stu = ZA.viewStudent();
    var d = { kind: '竞赛获奖', cat: '专业素养', title: '', credit: 1 };
    var host = D.h('div');
    D.appendChildDeep(host, [
      D.h('div.m-note', { html: '填写申报信息。系统按考核方案给出参考分值，终审通过后自动写入成绩记录。' }),
      D.h('div.fld', D.h('label', '申报类型'), M.chips(['竞赛获奖', '荣誉奖励', '线下活动'], d.kind, function (v) { d.kind = v; })),
      D.h('div.fld', { style: 'margin-top:11px' }, D.h('label', '所属分类'),
        M.chips(DB.col('cats').map(function (c) { return [c.name, c.name]; }), d.cat, function (v) { d.cat = v; })),
      D.h('div.fld', { style: 'margin-top:11px' }, D.h('label', '申报标题 ', D.h('i', '*')),
        D.h('input', { placeholder: '例如：重庆市职业院校技能大赛二等奖', oninput: function (e) { d.title = e.target.value; } })),
      D.h('div.fld', { style: 'margin-top:11px' }, D.h('label', '认定学分 '), D.h('input', { type: 'number', value: 1, min: 0, max: 3, step: 0.5, oninput: function (e) { d.credit = U.num(e.target.value); } })),
      D.h('div.fld', { style: 'margin-top:11px' }, D.h('label', '证明材料 '), D.h('input', { placeholder: '例如：获奖证书.pdf', oninput: function (e) { d.ev = e.target.value; } }))
    ]);
    var m = UI.modal({
      title: '新增分值申报', sub: stu.name + ' · ' + stu.sno, size: 'wide', body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            if (!String(d.title).trim()) { UI.toast('请填写申报标题', '', 'warn'); return; }
            var sc = DB.scheme();
            var flow = ['提交申请', '学院初审', '校团委终审', '自动赋分'].map(function (n, i) {
              return { node: n, actor: i === 0 ? stu.name : (i === 3 ? '系统' : ''), role: i === 0 ? '学生' : '', status: i === 0 ? 'done' : (i === 1 ? 'cur' : 'wait'), at: i === 0 ? U.dt(new Date()) : '', note: '' };
            });
            DB.insert('scoreApps', {
              studentId: stu.id, sno: stu.sno, name: stu.name, collegeId: stu.collegeId, college: stu.college,
              major: stu.major, className: stu.className, grade: stu.grade,
              type: '积分/学分/学时', kind: d.kind, cat: d.cat, title: d.title,
              credit: U.num(d.credit), hours: Math.round(U.num(d.credit) * U.num((sc || {}).convert ? sc.convert.hoursPerCredit : 16)),
              points: Math.round(U.num(d.credit) * U.num((sc || {}).convert ? sc.convert.pointsPerCredit : 10)),
              evidence: d.ev || '待补充', files: [], at: U.dt(new Date()), status: '待初审', step: 1, flow: flow, note: ''
            });
            DB.insert('logs', {
              at: U.dt(new Date()), actor: stu.name, role: '学生', action: '提交分值申报（手机端）',
              module: '成绩管理', target: stu.id, ip: '10.16.1.' + (100 + U.int(String(stu.sno).slice(-2), 10)), result: '成功', detail: d.title
            });
            UI.toast('申报已提交', '进入学院初审', 'ok');
            m.close(); render();
          }
        }, '提交申报')
      ]
    });
  }

  /* ===================== 页面：消息 ===================== */
  PAGES.msg = function (main, hd) {
    hd.title = '消息通知';
    var l = U.sortBy(DB.col('msgs'), function (m) { return m.at; }, true);
    hd.sub = '未读 ' + l.filter(function (m) { return U.int(m.unreadCount, 0) > 0; }).length + ' 条 / 共 ' + l.length + ' 条';
    main.appendChild(M.kpis([
      { num: l.length, label: '通知总数', unit: '条' },
      { num: l.reduce(function (a, m) { return a + U.int(m.unreadCount, 0); }, 0), label: '未读人次', unit: '次', c: '#dc2626' },
      { num: l.reduce(function (a, m) { return a + U.int(m.readCount, 0); }, 0), label: '已读人次', unit: '次', c: '#059669' },
      { num: l.reduce(function (a, m) { return a + U.int(m.total, 0); }, 0), label: '触达人次', unit: '次', c: '#2563eb' }
    ]));
    if (!l.length) { main.appendChild(D.h('div.m-card', M.empty('暂无消息'))); return; }
    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, l.map(function (m) {
      var unread = U.int(m.unreadCount, 0) > 0;
      return D.h('div.m-msg' + (unread ? '.unread' : ''), { onclick: function () { readOne(m); } },
        D.h('div.t', unread ? D.h('span.dt') : null, m.title),
        D.h('div.d', String(m.content).slice(0, 74) + (String(m.content).length > 74 ? '…' : '')),
        D.h('div.m', D.h('span', m.type), D.h('span', m.sender), D.h('span', m.at),
          D.h('span', '已读 ' + U.int(m.readCount, 0) + ' / 未读 ' + U.int(m.unreadCount, 0)))
      );
    })));
    main.appendChild(D.h('div.m-card', M.note('已读 / 未读统计来自消息的真实触达数据，管理员在 PC 端「消息通知」中可查看完整统计与催办记录。')));
  };
  function readOne(m) {
    DB.update('msgs', m.id, {
      readCount: U.int(m.total, 0), unreadCount: 0,
      readBy: (m.readBy || []).concat([ZA.session ? ZA.session.name : '演示账号'])
    });
    UI.toast('已标记为已读', m.title, 'ok');
    render();
  }

  /* ===================== 页面：我管理的 ===================== */
  PAGES.managed = function (main, hd, tab) {
    var t = tab || 'dash';
    hd.title = '我管理的';
    if (ZA.isStudent()) {
      main.appendChild(D.h('div.m-card', M.note('当前为学生身份，管理功能请在「我的」中切换为管理端身份，或使用 PC 端。')));
      main.appendChild(D.h('div.m-card', {}, D.h('button.m-btn-block.ghost', { onclick: function () { go('me'); } }, '切换身份')));
      return;
    }
    hd.sub = ZA.ROLE_LABEL[ZA.role()] || '';
    main.appendChild(M.chips([['dash', '数据速览'], ['audit', '活动审核'], ['enroll', '报名审核'], ['apply', '申报审核']], t, function (v) { go('managed', v); }));

    if (t === 'dash') {
      var agg = DB.agg();
      var sc = DB.scheme();
      var need = U.num(sc ? sc.standard.pass : 6);
      var pass = agg.filter(function (x) { return x.total >= need; }).length;
      main.appendChild(M.kpis([
        { num: KP_pub().length, label: '已发布活动', unit: '个' },
        { num: DB.col('enrollments').length, label: '累计报名', unit: '人次', c: '#2563eb' },
        { num: DB.count('signins', function (x) { return x.status !== '缺勤'; }), label: '实际签到', unit: '人次', c: '#059669' },
        { num: agg.length ? (pass / agg.length * 100).toFixed(1) : '0.0', label: '学分达标率', unit: '%', c: '#7c3aed' }
      ]));
      main.appendChild(M.card('活动状态分布', null, C.donut([
        { n: '待审核', v: DB.count('activities', function (a) { return a.status === '待审核'; }), c: '#f59e0b' },
        { n: '待开始', v: DB.count('activities', function (a) { return a.status === '待开始'; }), c: '#3b82f6' },
        { n: '进行中', v: DB.count('activities', function (a) { return a.status === '进行中'; }), c: '#10b981' },
        { n: '已结束', v: DB.count('activities', function (a) { return a.status === '已结束'; }), c: '#94a3b8' },
        { n: '已驳回', v: DB.count('activities', function (a) { return a.status === '已驳回'; }), c: '#ef4444' }
      ], { size: 168, thickness: 24, centerValue: DB.col('activities').length, centerLabel: '活动总数' })));
      main.appendChild(M.card('院系参与人数对比', null, C.bars(U.topN(DB.col('colleges'), function (c) {
        return DB.count('enrollments', function (e) { return e.collegeId === c.id; });
      }, 6, true).map(function (c, i) {
        return { n: c.shortName || c.name, v: DB.count('enrollments', function (e) { return e.collegeId === c.id; }), c: C.color(i) };
      }), { unit: ' 人', labelW: 76, bh: 15, gap: 7 })));
      return;
    }
    if (t === 'audit') {
      var pend = DB.filter('activities', function (a) { return a.status === '待审核'; });
      main.appendChild(D.h('div.m-card', M.note('手机端可快速通过 / 驳回。多级审核的流程推进与合规校验请在 PC 端「活动发布与审核」中完成。')));
      if (!pend.length) { main.appendChild(D.h('div.m-card', M.empty('暂无待审核活动'))); return; }
      main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, pend.map(function (a) {
        return D.h('div', { style: 'padding:12px 13px;border-bottom:1px solid #f1f5fb' },
          D.h('div', { style: 'font-weight:650;font-size:13px;line-height:1.45' }, a.title),
          D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:4px' }, a.host + ' · ' + a.cat + ' · ' + a.level + ' · ' + a.credit + ' 学分'),
          D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:2px' }, U.dt(a.start) + ' · ' + (a.place || '')),
          D.h('div', { style: 'display:flex;gap:8px;margin-top:9px' },
            D.h('button.m-btn-block', {
              onclick: function () {
                DB.update('activities', a.id, { status: '待开始', auditTrail: (a.auditTrail || []).concat([{ at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()], stage: '手机端快速审核', result: '通过', opinion: '手机端快速通过' }]) });
                UI.toast('已通过', a.title, 'ok'); render();
              }
            }, '✓ 通过'),
            D.h('button.m-btn-block.ghost', {
              onclick: function () {
                var reason = '手机端快速驳回';
                DB.update('activities', a.id, { status: '已驳回', auditStage: 0, auditOpinion: reason });
                UI.toast('已驳回', '请到 PC 端补充驳回原因', 'warn'); render();
              }
            }, '✕ 驳回'))
        );
      })));
      return;
    }
    if (t === 'enroll') {
      var pe = DB.filter('enrollments', function (e) { return e.status === '待审核'; });
      if (!pe.length) { main.appendChild(D.h('div.m-card', M.empty('暂无待审核报名'))); return; }
      main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, pe.slice(0, 40).map(function (e) {
        return D.h('div', { style: 'padding:11px 13px;border-bottom:1px solid #f1f5fb' },
          D.h('div', { style: 'display:flex;align-items:center;gap:9px' },
            D.h('div', { style: 'flex:1;min-width:0' },
              D.h('div', { style: 'font-weight:650;font-size:13px' }, e.name + '（' + e.sno + '）'),
              D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' }, e.actTitle),
              D.h('div', { style: 'font-size:10.5px;color:var(--text3);margin-top:2px' }, e.className + ' · ' + e.at))),
          D.h('div', { style: 'display:flex;flex-direction:column;gap:6px;flex:0 0 76px' },
            D.h('button.btn.btn-sm.btn-p', { onclick: function () { DB.update('enrollments', e.id, { status: '已通过', reviewer: ZA.session.name, note: '手机端审核通过' }); UI.toast('已通过', e.name, 'ok'); render(); } }, '通过'),
            D.h('button.btn.btn-sm.btn-dan', { onclick: function () { DB.update('enrollments', e.id, { status: '已驳回', reviewer: ZA.session.name, note: '手机端驳回' }); UI.toast('已驳回', e.name, 'warn'); render(); } }, '驳回')));
      })));
      return;
    }
    /* 申报审核 */
    var pa = DB.filter('scoreApps', function (x) { return x.status === '待初审' || x.status === '待终审'; });
    if (!pa.length) { main.appendChild(D.h('div.m-card', M.empty('暂无待审核申报'))); return; }
    main.appendChild(D.h('div.m-card', M.note('终审通过后系统会自动赋分并写入该生成绩记录。')));
    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' }, pa.slice(0, 40).map(function (x) {
      return D.h('div', { style: 'padding:11px 13px;border-bottom:1px solid #f1f5fb' },
        D.h('div', { style: 'font-weight:650;font-size:13px' }, x.name + ' · ' + x.title),
        D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' }, x.cat + ' · ' + x.credit + ' 学分 / ' + x.hours + ' 学时 · ' + x.status),
        D.h('div', { style: 'display:flex;gap:8px;margin-top:9px' },
          D.h('button.m-btn-block', {
            onclick: function () {
              var step = U.int(x.step, 1);
              var flow = (x.flow || []).map(function (f) { return Object.assign({}, f); });
              if (flow[step]) { flow[step].status = 'done'; flow[step].actor = ZA.session.name; flow[step].role = ZA.ROLE_LABEL[ZA.role()]; flow[step].at = U.dt(new Date()); }
              if (step >= 2) {
                if (flow[3]) { flow[3].status = 'done'; flow[3].actor = '系统'; flow[3].at = U.dt(new Date()); flow[3].note = '自动赋分 +' + x.credit + ' 学分'; }
                DB.update('scoreApps', x.id, { status: '已通过', step: 3, flow: flow });
                DB.insert('scoreRecs', {
                  appId: x.id, studentId: x.studentId, actId: '', actTitle: x.title + '（分值申报）',
                  cat: x.cat, credit: U.num(x.credit), hours: U.num(x.hours), points: U.num(x.points),
                  level: '校级', source: '分值申报', status: '已认定', at: U.dt(new Date()), term: DB.data.meta.term
                });
                UI.toast('终审通过，已自动赋分', '+' + x.credit + ' 学分已计入 ' + x.name + ' 的成绩单', 'ok');
              } else {
                if (flow[2]) flow[2].status = 'cur';
                DB.update('scoreApps', x.id, { status: '待终审', step: 2, flow: flow });
                UI.toast('初审通过', '已进入校团委终审', 'ok');
              }
              render();
            }
          }, '✓ 通过'),
          D.h('button.m-btn-block.ghost', {
            onclick: function () {
              DB.update('scoreApps', x.id, { status: '已驳回', step: 1, note: '手机端驳回：材料不符合认定要求' });
              UI.toast('已驳回', x.title, 'warn'); render();
            }
          }, '✕ 驳回'))
      );
    })));
  };

  /* ===================== 页面：我的 ===================== */
  PAGES.me = function (main, hd) {
    hd.plain = true;
    hd.title = '我的';
    var s = ZA.session;
    var stu = ZA.viewStudent();
    var isStu = ZA.isStudent();
    var head = D.h('div.m-me-hd',
      D.h('div.top',
        D.h('div.av', (s.name || '二').slice(-1)),
        D.h('div', { style: 'flex:1;min-width:0' },
          D.h('div.nm', s.name),
          D.h('div.sub', isStu ? (stu.college + ' · ' + stu.className + ' · ' + stu.sno) : (s.title + ' · ' + s.account + ' · ' + ZA.scopeText()))
        )),
      D.h('div', { style: 'font-size:11.5px;opacity:.88;margin-top:11px' }, '切换演示身份（菜单与数据范围随身份变化）'),
      D.h('div.role', DEMO.switchable().map(function (r) {
        return D.h('button' + (r.role === ZA.role() ? '.on' : ''), { onclick: function () { switchRole(r.role); } }, r.label);
      }))
    );
    main.appendChild(head);
    main.appendChild(D.h('div', { style: 'height:11px' }));

    if (ZA.isStudent()) {
      var agg = DB.aggOf(stu.id) || { total: 0 };
      var need = U.num((DB.scheme() || {}).standard ? DB.scheme().standard.pass : 6);
      main.appendChild(M.kpis([
        { num: U.num(agg.total).toFixed(1), label: '累计学分', unit: '分', c: '#7c3aed' },
        { num: DB.count('enrollments', function (e) { return e.studentId === stu.id; }), label: '报名活动', unit: '个' },
        { num: DB.count('signins', function (x) { return x.studentId === stu.id && x.status !== '缺勤'; }), label: '签到次数', unit: '次', c: '#059669' },
        { num: DB.count('clubMembers', function (m) { return m.studentId === stu.id && m.status !== '已退出'; }), label: '加入社团', unit: '个', c: '#0891b2' }
      ]));
    }

    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' },
      ZA.isStudent() ? M.row('📋', '#2563eb', '#eff6ff', '我报名的', '报名与签到记录', null, function () { go('myact'); }) : null,
      M.row('🎓', '#7c3aed', '#f5f3ff', '我的成绩单', ZA.isStudent() ? '查看与导出 PDF' : '管理端成绩汇总请用 PC 端', null, function () { go('score'); }),
      M.row('🎯', '#0891b2', '#ecfeff', '分值申报', ZA.isStudent() ? '竞赛获奖 / 荣誉奖励 / 线下活动' : '查看待审申报', null, function () { go('apply'); }),
      M.row('🔔', '#d97706', '#fffbeb', '消息通知', DB.count('msgs', function (m) { return U.int(m.unreadCount, 0) > 0; }) + ' 条未读', null, function () { go('msg'); }),
      M.row('🛠', '#dc2626', '#fef2f2', '我管理的', ZA.isStudent() ? '需切换为管理端身份' : '待办速览与快速处理', null, function () { go('managed'); })
    ));

    main.appendChild(D.h('div.m-card', { style: 'padding:0;overflow:hidden' },
      M.row('💻', '#2563eb', '#eff6ff', '切换到 PC 管理端', '完整管理功能（活动 / 成绩 / 统计 / 门户 / AI）', null, function () { DEMO.toDesktop(); }),
      M.row('♻', '#94a3b8', '#f1f5fb', '复位演示数据', '恢复为初始演示数据（约 ' + DB.sizeKB() + ' KB）', null, function () {
        UI.confirm({
          title: '复位演示数据', danger: true, okText: '确认复位',
          text: '将清空本地改动，恢复为初始演示数据。',
          onOk: function () { DB.reset(); UI.toast('演示数据已复位', '已恢复初始状态', 'ok'); render(); }
        });
      }),
      M.row('🚪', '#dc2626', '#fef2f2', '退出登录', '回到登录页', null, function () {
        UI.confirm({
          title: '退出登录', danger: true, okText: '退出', text: '确认退出当前账号？',
          onOk: function () { ZA.logout(); location.href = 'index.html'; }
        });
      })
    ));

    main.appendChild(D.h('div', { style: 'text-align:center;font-size:11px;color:var(--text3);padding:14px 0 4px' },
      DB.data.meta.school + ' · ' + DB.data.meta.domain + ' · ' + DB.data.meta.term));
  };

  function switchRole(role) {
    var r = DEMO.loginAs(role);
    if (!r.ok) { UI.toast('切换失败', r.msg || '', 'err'); return; }
    st.tab = 'home';
    UI.toast('已切换为「' + (ZA.ROLE_LABEL[role] || role) + '」', '菜单与数据范围已同步调整', 'ok');
    go('home');
  }

  /* ===================== 渲染 ===================== */
  var elStage, elDevice, elHd, elMain, elTab;

  function render() {
    var info = parse();
    st.route = info.name; st.param = info.param;
    var def = PAGES[st.route] || PAGES.home;
    var tabKey = ['home', 'square', 'myact', 'msg', 'me'].indexOf(st.route) >= 0 ? st.route
      : (st.route === 'act' || st.route === 'sign' ? 'square' : (st.route === 'score' || st.route === 'apply' ? 'me' : (st.route === 'managed' ? 'me' : 'home')));
    st.tabKey = tabKey;

    var hdCfg = { title: '第二课堂', sub: DB.data.meta.school, back: false, plain: false, actions: null };
    D.fill(elHd, null);
    D.fill(elMain, null);
    D.fill(elTab, null);

    def(elMain, hdCfg, st.param);

    D.appendChildDeep(elHd, header(hdCfg));
    var hideTab = ['sign'].indexOf(st.route) >= 0;
    elMain.className = 'm-main' + (hideTab ? ' no-tab' : '');
    if (!hideTab) D.appendChildDeep(elTab, tabbar());

    Array.prototype.forEach.call(document.querySelectorAll('.mask'), function (x) { x.remove(); });
    elMain.scrollTop = 0;
  }

  function boot() {
    DB.init();
    var s = ZA.restore();
    if (!s) {
      /* 未登录则按地址栏参数或默认「学生」身份演示登录，保证双击打开 m.html 也能演示 */
      var q = String(location.search || '');
      var role = /role=([a-z]+)/.exec(q) ? /role=([a-z]+)/.exec(q)[1] : 'student';
      var r = DEMO.loginAs(role);
      if (!r.ok) {
        var r2 = DEMO.loginAs('student');
        if (!r2.ok) { location.href = 'index.html'; return; }
      }
    } else if (ZA.session && ZA.session.type === 'student' && ZA.role() !== 'student') {
      ZA.setRole('student');
    }

    elStage = document.getElementById('mStage');
    elDevice = D.h('div.m-device');
    elHd = D.h('div');
    elMain = D.h('main.m-main');
    elTab = D.h('div');
    elDevice.appendChild(elHd);
    elDevice.appendChild(elMain);
    elDevice.appendChild(elTab);
    elDevice.appendChild(D.h('div.toast-wrap#toastWrap'));
    D.fill(elStage, null);
    elStage.appendChild(elDevice);

    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/home';
    render();
  }

  M.go = go; M.render = render; M.PAGES = PAGES;
  w.ZM = M;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
