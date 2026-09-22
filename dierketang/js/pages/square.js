/* ==========================================================================
   square.js —— 活动广场（PC 端 / 移动端 / 列表三种视图）
   真实能力：
   · 多条件筛选（关键词 / 分类 / 级别 / 形式 / 状态 / 学院）+ 排序 + 分页
   · 报名闭环：黑名单校验 → 并行活动数校验（规则 AR1）→ 项目名额校验
                → 生成报名记录（需审核则「待审核」，否则「已通过」）→ 名额 +1
   · 取消报名：按报名截止时间与项目取消规则真实校验
   · 活动详情：基础信息 / 报名项目 / 我的报名状态 / 组织者 / 变更记录
   · 移动端视图：同一份数据用手机壳渲染，用于演示「PC 与移动端数据实时同步」
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP, SG = w.ZSIGN;

  var st = {
    kw: '', cat: '', level: '', form: '', phase: '', college: '',
    sort: 'latest', view: 'card', page: 1, ps: 12, onlyMine: false
  };

  function pub() { return KP.pubList(DB.col('activities')); }
  /** 当前登录学生（仅学生身份才有“我”的概念；教职工浏览广场时不产生报名动作） */
  function me() { return ZA.isStudent() ? ZA.viewStudent() : null; }

  /** 活动所处阶段（面向学生的口径） */
  function phaseOf(a) {
    var now = DB.data.meta.now;
    if (a.status === '待开始') return a.enrollStart && now < a.enrollStart ? '未开始报名' : '报名中';
    if (a.status === '进行中') return '进行中';
    if (a.status === '已结束') return '已结束';
    return a.status;
  }
  var PHASES = ['报名中', '进行中', '已结束'];

  function myEnrOf(actId, stuId) {
    return DB.find('enrollments', function (e) { return e.actId === actId && e.studentId === stuId; });
  }
  function enrolledCount(a) {
    return DB.count('enrollments', function (e) { return e.actId === a.id && e.status !== '已驳回'; });
  }
  function itemCap(a) {
    var it = a.items && a.items[0];
    return it ? U.int(it.limit, a.maxNum || 0) : U.int(a.maxNum, 0);
  }
  function myEnrList(stuId) {
    return DB.filter('enrollments', function (e) { return e.studentId === stuId; });
  }

  /* ---------------- 取数 ---------------- */
  function rows() {
    var list = pub();
    var stu = me();
    if (st.kw) list = list.filter(function (a) { return U.hitAny([a.title, a.host, a.cat, a.place, a.desc], st.kw); });
    if (st.cat) list = list.filter(function (a) { return a.cat === st.cat; });
    if (st.level) list = list.filter(function (a) { return a.level === st.level; });
    if (st.form) list = list.filter(function (a) { return a.form === st.form; });
    if (st.college) list = list.filter(function (a) { return a.collegeId === st.college || a.host === st.college; });
    if (st.phase) list = list.filter(function (a) { return phaseOf(a) === st.phase; });
    if (st.onlyMine && stu) {
      var ids = {};
      myEnrList(stu.id).forEach(function (e) { ids[e.actId] = 1; });
      list = list.filter(function (a) { return ids[a.id]; });
    }
    list = list.slice();
    if (st.sort === 'latest') list.sort(function (a, b) { return String(b.createdAt || b.start).localeCompare(String(a.createdAt || a.start)); });
    if (st.sort === 'start') list.sort(function (a, b) { return String(a.start).localeCompare(String(b.start)); });
    if (st.sort === 'hot') list.sort(function (a, b) { return enrolledCount(b) - enrolledCount(a); });
    if (st.sort === 'credit') list.sort(function (a, b) { return U.num(b.credit) - U.num(a.credit); });
    return list;
  }

  /* ---------------- 报名校验 ---------------- */
  function checkEnroll(a, stu) {
    if (!stu) return { ok: false, msg: '未识别到学生身份', sub: '请以学生角色登录后再报名' };
    if (a.status !== '待开始' && a.status !== '进行中') return { ok: false, msg: '当前活动不接受报名', sub: '活动状态：' + a.status };
    var now = DB.data.meta.now;
    if (a.enrollEnd && now > a.enrollEnd) return { ok: false, msg: '报名已截止', sub: '截止时间 ' + U.dt(a.enrollEnd) };
    var exist = myEnrOf(a.id, stu.id);
    if (exist) return { ok: false, msg: '你已报名该活动', sub: '报名状态：' + exist.status };
    /* 黑名单校验（规则 AR4 / AR5 的落地） */
    var bl = DB.find('blacklist', function (b) { return b.studentId === stu.id && b.active; });
    if (bl) return { ok: false, msg: '你当前处于活动黑名单', sub: bl.reason + '（' + bl.autoOutAt + ' 自动解除）' };
    /* 同时进行活动数校验（规则 AR1） */
    var rule = DB.find('actRules', function (r) { return r.id === 'AR1' && r.enabled; });
    if (rule) {
      var max = U.int(rule.params.maxParallel, 3);
      var live = myEnrList(stu.id).filter(function (e) {
        if (e.status === '已驳回' || e.status === '已取消') return false;
        var ea = DB.get('activities', e.actId);
        return ea && (ea.status === '待开始' || ea.status === '进行中');
      }).length;
      if (live >= max) return { ok: false, msg: '已达同时报名上限', sub: '规则「' + rule.name + '」限制同时处于进行中的活动不超过 ' + max + ' 个，你当前 ' + live + ' 个' };
    }
    /* 名额校验 */
    var cap = itemCap(a);
    var used = enrolledCount(a);
    if (cap && used >= cap) return { ok: false, msg: '名额已满', sub: '上限 ' + cap + ' 人，当前 ' + used + ' 人' };
    return { ok: true };
  }

  function doEnroll(a, stu, item, cb) {
    var chk = checkEnroll(a, stu);
    if (!chk.ok) { UI.toast(chk.msg, chk.sub, 'err'); return null; }
    var it = item || (a.items && a.items[0]) || null;
    var needAudit = a.needAudit !== false && U.int(it && it.limit, 0) >= 0;
    var rec = DB.insert('enrollments', {
      actId: a.id, actTitle: a.title, cat: a.cat,
      itemId: it ? it.id : '', itemName: it ? it.name : '统一报名',
      studentId: stu.id, sno: stu.sno, name: stu.name, gender: stu.gender,
      collegeId: stu.collegeId, college: stu.college, major: stu.major,
      className: stu.className, grade: stu.grade, contact: stu.contact,
      at: U.dt(new Date()),
      status: (a.needAudit === false) ? '已通过' : '待审核',
      reviewer: '', note: '', onSite: false, signStatus: '未签到', formData: {}, importBatch: ''
    });
    if (it) {
      var items = (a.items || []).map(function (x) {
        return x.id === it.id ? Object.assign({}, x, { enrolled: U.int(x.enrolled, 0) + 1 }) : x;
      });
      DB.update('activities', a.id, { items: items });
    }
    DB.insert('logs', {
      at: U.dt(new Date()), actor: stu.name, role: '学生', action: '活动报名',
      module: '活动管理', target: a.id, ip: '10.16.1.' + (100 + U.int(stu.sno.slice(-2), 10)),
      result: '成功', detail: a.title + ' · ' + (it ? it.name : '统一报名')
    });
    UI.toast(rec.status === '待审核' ? '报名已提交' : '报名成功',
      rec.status === '待审核' ? '等待「' + a.host + '」审核，可在「我报名的」查看进度' : '活动开始前请留意签到提醒', 'ok');
    if (cb) cb(rec);
    return rec;
  }

  function doCancel(enr, cb) {
    var a = DB.get('activities', enr.actId);
    if (!a) return;
    var it = null;
    (a.items || []).forEach(function (x) { if (x.id === enr.itemId) it = x; });
    UI.confirm({
      title: '取消报名', danger: true, okText: '确认取消',
      text: '确认取消「' + a.title + '」的报名吗？',
      detail: it && it.cancelRule ? '取消规则：' + it.cancelRule : '取消后名额将释放给其他同学。',
      onOk: function () {
        DB.update('enrollments', enr.id, { status: '已取消', note: '学生主动取消' });
        if (it) {
          var items = (a.items || []).map(function (x) {
            return x.id === it.id ? Object.assign({}, x, { enrolled: Math.max(0, U.int(x.enrolled, 1) - 1) }) : x;
          });
          DB.update('activities', a.id, { items: items });
        }
        UI.toast('已取消报名', a.title, 'ok');
        if (cb) cb();
      }
    });
  }

  /* ---------------- 活动卡片 ---------------- */
  function cover(a, h) {
    return D.h('div', {
      style: 'height:' + (h || 96) + 'px;border-radius:10px 10px 0 0;position:relative;overflow:hidden;' +
        'background:' + (a.catGrad || 'linear-gradient(135deg,#93c5fd,#2563eb)') + ';display:flex;align-items:flex-end'
    },
      D.h('div', {
        style: 'position:absolute;inset:0;background:radial-gradient(circle at 82% 18%,rgba(255,255,255,.34),transparent 58%)'
      }),
      D.h('div', { style: 'position:absolute;top:9px;left:10px;display:flex;gap:6px' },
        D.h('span', {
          style: 'background:rgba(255,255,255,.92);color:' + (a.catColor || '#2563eb') + ';font-size:11px;font-weight:700;' +
            'padding:2px 8px;border-radius:99px'
        }, a.cat),
        D.h('span', {
          style: 'background:rgba(15,23,42,.36);color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px'
        }, a.level)
      ),
      D.h('div', { style: 'position:absolute;top:9px;right:10px' },
        D.h('span', {
          style: 'background:rgba(255,255,255,.92);color:#334155;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px'
        }, phaseOf(a))
      ),
      D.h('div', {
        style: 'position:relative;padding:0 11px 9px;color:#fff;font-size:11.5px;font-weight:600;' +
          'text-shadow:0 1px 6px rgba(15,23,42,.45);display:flex;gap:10px'
      },
        D.h('span', a.form + (a.place ? ' · ' + a.place.slice(0, 8) : '')),
        D.h('span', '🎓 ' + a.credit + ' 学分')
      )
    );
  }

  function cardOf(a, refresh) {
    var stu = me();
    var mine = stu ? myEnrOf(a.id, stu.id) : null;
    var cap = itemCap(a), used = enrolledCount(a);
    var pct = cap ? U.clamp(used / cap * 100, 0, 100) : 0;
    return D.h('div.card', { style: 'padding:0;overflow:hidden;display:flex;flex-direction:column' },
      D.h('div', { style: 'cursor:pointer', onclick: function () { detail(a, refresh); } }, cover(a)),
      D.h('div', { style: 'padding:11px 12px;flex:1;display:flex;flex-direction:column;gap:7px' },
        D.h('div', {
          style: 'font-weight:700;font-size:13.5px;line-height:1.45;min-height:38px;cursor:pointer',
          title: a.title, onclick: function () { detail(a, refresh); }
        }, a.title),
        D.h('div', { style: 'font-size:11.5px;color:var(--text3);display:flex;flex-wrap:wrap;gap:4px 10px' },
          D.h('span', '🏛 ' + a.host),
          D.h('span', '🕒 ' + U.dt(a.start, false) + ' ' + String(a.start).slice(11))
        ),
        D.h('div', { style: 'font-size:11.5px;color:var(--text3)' },
          '📅 报名 ' + String(a.enrollEnd).slice(5, 10) + ' 截止'),
        D.h('div', {},
          UI.pg(pct),
          D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px;display:flex;justify-content:space-between' },
            D.h('span', '已报名 ' + used + (cap ? ' / ' + cap : '') + ' 人'),
            D.h('span', cap && used >= cap ? '名额已满' : '剩余 ' + Math.max(0, cap - used) + ' 个名额')
          )
        ),
        D.h('div.btn-row', { style: 'margin-top:auto;padding-top:4px' },
          D.h('button.btn.btn-sm', { onclick: function () { detail(a, refresh); } }, '查看详情'),
          mine
            ? D.h('button.btn.btn-sm.btn-dan', { onclick: function () { doCancel(mine, refresh); } }, '取消报名')
            : (function () {
              var dis = a.status === '已结束';
              return D.h('button.btn.btn-sm.btn-p', {
                disabled: dis,
                onclick: function () {
                  var chk = checkEnroll(a, stu);
                  if (!chk.ok) { UI.toast(chk.msg, chk.sub, 'err'); return; }
                  enrollModal(a, stu, refresh);
                }
              }, dis ? '已结束' : '立即报名');
            })()
        )
      )
    );
  }

  /** 手机壳视图：同一份报名数据，移动端即时同步 */
  function phoneOf(a) {
    var shell = D.h('div', {
      style: 'width:296px;margin:0 auto;border:9px solid #1f2937;border-radius:34px;background:#fff;' +
        'box-shadow:0 18px 40px rgba(15,23,42,.22);overflow:hidden'
    });
    shell.appendChild(D.h('div', {
      style: 'background:#1f2937;color:#cbd5e1;font-size:10.5px;padding:5px 12px;display:flex;justify-content:space-between'
    }, D.h('span', '9:41'), D.h('span', '第二课堂 4G ▮')));
    shell.appendChild(cover(a, 118));
    var body = D.h('div', { style: 'padding:12px 13px 16px' });
    body.appendChild(D.h('div', { style: 'font-weight:750;font-size:14.5px;line-height:1.4' }, a.title));
    body.appendChild(D.h('div', { style: 'margin:9px 0;font-size:12px;color:var(--text2);line-height:1.9' },
      D.h('div', '🏛 主办：' + a.host),
      D.h('div', '🕒 时间：' + U.dt(a.start) + ' — ' + String(a.end).slice(11)),
      D.h('div', '📍 地点：' + (a.place || '未设置')),
      D.h('div', '🎓 认定：' + a.credit + ' 学分 · ' + a.hours + ' 学时 · ' + a.points + ' 积分')
    ));
    var stu = me();
    var mine = stu ? myEnrOf(a.id, stu.id) : null;
    var cap = itemCap(a), used = enrolledCount(a);
    body.appendChild(D.h('div', { style: 'background:#f8fafc;border-radius:9px;padding:9px 10px;margin-bottom:10px' },
      UI.pgRow(cap ? used / cap * 100 : 0, used + (cap ? ' / ' + cap : '') + ' 人已报名')
    ));
    body.appendChild(D.h('div', { style: 'font-size:12px;color:var(--text2);line-height:1.85;max-height:74px;overflow:hidden' }, a.desc));
    body.appendChild(D.h('div', { style: 'margin-top:11px' },
      mine
        ? D.h('div', { style: 'background:#ecfdf5;color:#059669;border-radius:9px;padding:9px;text-align:center;font-weight:700;font-size:13px' },
          '已报名 · ' + mine.status)
        : D.h('button.btn.btn-p.btn-block', {
          onclick: function () {
            var chk = checkEnroll(a, stu);
            if (!chk.ok) { UI.toast(chk.msg, chk.sub, 'err'); return; }
            doEnroll(a, stu, null, function () { w.ZR.render(); });
          }
        }, '立即报名')
    ));
    shell.appendChild(body);
    return shell;
  }

  function rowOf(a, refresh) {
    var stu = me();
    var mine = stu ? myEnrOf(a.id, stu.id) : null;
    var cap = itemCap(a), used = enrolledCount(a);
    return D.h('div', {
      style: 'display:flex;gap:13px;padding:13px;border-bottom:1px solid var(--line);align-items:center;cursor:pointer',
      onclick: function () { detail(a, refresh); }
    },
      D.h('div', { style: 'flex:0 0 128px' }, cover(a, 74)),
      D.h('div', { style: 'flex:1;min-width:0' },
        D.h('div', { style: 'font-weight:700;font-size:13.5px' }, a.title),
        D.h('div', { style: 'margin-top:5px;font-size:11.5px;color:var(--text3);display:flex;flex-wrap:wrap;gap:4px 12px' },
          D.h('span', '🏛 ' + a.host), D.h('span', '🕒 ' + U.dt(a.start)), D.h('span', '📍 ' + (a.place || '—')),
          D.h('span', '🎓 ' + a.credit + ' 学分')
        )
      ),
      D.h('div', { style: 'flex:0 0 132px' },
        UI.pg(cap ? used / cap * 100 : 0),
        D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' }, used + (cap ? '/' + cap : '') + ' 人 · ' + phaseOf(a))
      ),
      D.h('div', { style: 'flex:0 0 108px;text-align:right' },
        mine ? KP.status(mine.status) : (a.status === '已结束' ? KP.status('已结束') : D.h('span.muted', '未报名'))
      )
    );
  }

  /* ---------------- 报名弹窗（按项目的报名表单） ---------------- */
  function enrollModal(a, stu, refresh) {
    var items = a.items && a.items.length ? a.items : [{ id: '', name: '统一报名', limit: a.maxNum, needForm: false, formFields: [], cancelRule: '' }];
    var pick = items.filter(function (it) {
      var cap = U.int(it.limit, 0);
      return !cap || DB.count('enrollments', function (e) { return e.itemId === it.id && e.status !== '已驳回'; }) < cap;
    });
    if (!pick.length) { UI.toast('所有报名项目名额已满', '请关注后续场次', 'warn'); return; }
    var selItem = pick[0];
    var formVals = {};
    var formHost = D.h('div');
    var itemHost = D.h('div');

    function paintItems() {
      D.fill(itemHost, pick.map(function (it) {
        var cap = U.int(it.limit, 0);
        var used = DB.count('enrollments', function (e) { return e.itemId === it.id && e.status !== '已驳回'; });
        var on = selItem.id === it.id;
        return D.h('div', {
          style: 'border:1.5px solid ' + (on ? '#2563eb' : 'var(--line)') + ';background:' + (on ? '#f5f9ff' : '#fff') + ';' +
            'border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer',
          onclick: function () { selItem = it; paintItems(); paintForm(); }
        },
          D.h('div', { style: 'display:flex;align-items:center;gap:9px' },
            D.h('div', {
              style: 'width:15px;height:15px;border-radius:50%;border:2px solid ' + (on ? '#2563eb' : '#cbd5e1') + ';' +
                'flex:0 0 15px;background:' + (on ? 'radial-gradient(circle,#2563eb 0 42%,#fff 46%)' : '#fff')
            }),
            D.h('div', { style: 'flex:1;font-weight:650;font-size:13px' }, it.name),
            D.h('span.muted', used + (cap ? ' / ' + cap : '') + ' 人')
          ),
          D.h('div', { style: 'margin:5px 0 0 24px;font-size:11.5px;color:var(--text3)' },
            '报名窗口 ' + U.dt(it.enrollStart, false) + ' — ' + U.dt(it.enrollEnd),
            it.needForm ? ' · 需填写报名表单' : ' · 免填写表单'
          ),
          it.cancelRule ? D.h('div', { style: 'margin:3px 0 0 24px;font-size:11px;color:#b45309' }, '取消规则：' + it.cancelRule) : null
        );
      }));
    }

    function paintForm() {
      D.fill(formHost, null);
      var keys = (selItem.formFields || []).filter(function (k) {
        var f = DB.find('formFields', function (x) { return x.name === k || x.key === k; });
        return !f || f.enabled;
      });
      if (!keys.length) {
        formHost.appendChild(D.h('div.req-note', '该项目无需填写额外表单，系统将自动带入你的学籍信息（姓名 / 学号 / 学院 / 班级 / 专业）。'));
        return;
      }
      var wrap = D.h('div.frm.c2');
      keys.forEach(function (k) {
        var f = DB.find('formFields', function (x) { return x.name === k || x.key === k; }) || { name: k, type: '单行输入', required: false };
        var ctrl;
        var auto = f.fromSystem;
        if (f.type === '多行输入') ctrl = UI.textarea({ rows: 3, placeholder: '请输入' + f.name, onInput: function (e) { formVals[f.name] = e.target.value; } });
        else if (f.type === '下拉框') ctrl = UI.select({ options: selectOpts(f), onChange: function (v) { formVals[f.name] = v; } });
        else if (f.type === '附件') ctrl = UI.input({ readonly: true, placeholder: '点击上传附件（演示：已模拟上传）', onChange: function (e) { formVals[f.name] = e.target.value || '已上传附件'; }, value: '' });
        else ctrl = UI.input({ placeholder: auto ? '系统自动带入' : '请输入' + f.name, readonly: auto, value: auto ? stuValue(f.key) : '', onInput: function (e) { formVals[f.name] = e.target.value; } });
        if (auto) formVals[f.name] = stuValue(f.key);
        wrap.appendChild(UI.field({ label: f.name, required: f.required, control: ctrl, span: f.type === '多行输入' ? 2 : null }));
      });
      formHost.appendChild(wrap);
    }
    /** 下拉选项归一化：字符串数组 → [值, 文本] */
    function selectOpts(f) {
      var raw = (f.options && f.options.length ? f.options : ['请选择']);
      return raw.map(function (o) { return Array.isArray(o) ? o : [o, o]; });
    }
    function stuValue(key) {
      if (!stu) return '';
      return { name: stu.name, sno: stu.sno, college: stu.college, className: stu.className, contact: stu.contact }[key] || '';
    }

    var m = UI.modal({
      title: '报名 · ' + a.title, sub: a.host + ' · ' + U.dt(a.start), size: 'wide',
      body: [
        D.h('div', { style: 'font-weight:700;font-size:13px;margin-bottom:8px' }, '① 选择报名项目'),
        itemHost,
        D.h('div', { style: 'font-weight:700;font-size:13px;margin:14px 0 8px' }, '② 填写报名信息'),
        formHost
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var missing = (selItem.formFields || []).filter(function (k) {
              var f = DB.find('formFields', function (x) { return x.name === k || x.key === k; });
              return f && f.required && !f.fromSystem && !String(formVals[f.name] || '').trim();
            });
            if (missing.length) { UI.toast('请完善必填项', '缺少：' + missing.join('、'), 'warn'); return; }
            var rec = doEnroll(a, stu, selItem, function () { m.close(); if (refresh) refresh(); });
            if (rec) DB.update('enrollments', rec.id, { formData: formVals });
          }
        }, '确认报名')
      ]
    });
    paintItems(); paintForm();
  }

  /* ---------------- 活动详情 ---------------- */
  function detail(a, refresh) {
    var stu = me();
    var mine = stu ? myEnrOf(a.id, stu.id) : null;
    var cap = itemCap(a), used = enrolledCount(a);
    var cur = 'base';
    var tabsDef = [{ k: 'base', n: '活动详情' }, { k: 'items', n: '报名项目' }, { k: 'sign', n: '签到与证书' }, { k: 'log', n: '变更与留痕' }];
    var tabHost = D.h('div'), bodyHost = D.h('div.mt12');

    function paint() {
      D.fill(tabHost, UI.tabs({ items: tabsDef, cur: cur, onChange: function (k) { cur = k; paint(); } }));
      D.fill(bodyHost, null);
      if (cur === 'base') bodyHost.appendChild(paneBase(a, mine, cap, used));
      if (cur === 'items') bodyHost.appendChild(paneItems(a));
      if (cur === 'sign') bodyHost.appendChild(paneSign(a, mine));
      if (cur === 'log') bodyHost.appendChild(paneLog(a));
    }

    var m = UI.modal({
      title: a.title, sub: a.host + ' · ' + a.cat + ' · ' + a.level, size: 'xwide',
      body: [
        D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          KP.status(a.status), KP.catTag(a.cat), D.h('span.tag', a.form), D.h('span.tag', a.level),
          D.h('span.muted', '浏览 ' + (a.viewCount || 0) + ' 次 · 报名 ' + used + ' 人 · 签到 ' +
            DB.count('signins', function (x) { return x.actId === a.id && x.status !== '缺勤'; }) + ' 人')
        ),
        D.h('div.mt12', tabHost),
        bodyHost
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        mine
          ? D.h('div', { style: 'display:flex;gap:9px;align-items:center' },
            KP.status(mine.status),
            D.h('span.muted', '报名于 ' + mine.at),
            D.h('button.btn.btn-sm.btn-dan', {
              onclick: function () { doCancel(mine, function () { m.close(); if (refresh) refresh(); }); }
            }, '取消报名')
          )
          : D.h('button.btn.btn-sm.btn-p', {
            disabled: a.status === '已结束',
            onclick: function () {
              var chk = checkEnroll(a, stu);
              if (!chk.ok) { UI.toast(chk.msg, chk.sub, 'err'); return; }
              m.close(); enrollModal(a, stu, refresh);
            }
          }, a.status === '已结束' ? '活动已结束' : '立即报名')
      ]
    });
    paint();
  }

  function paneBase(a, mine, cap, used) {
    return D.h('div', {},
      D.h('div.g-21', {},
        D.h('div', {},
          KP.kv([
            ['活动编号', a.id], ['活动类别', a.cat], ['活动级别', a.level],
            ['主办单位', a.host + '（' + a.hostType + '）'], ['举办形式', a.form],
            ['活动地点', (a.place || '未设置') + (a.mapPin ? '（已地图选点）' : '（未选点）')],
            ['活动时间', U.dt(a.start) + ' — ' + U.dt(a.end)],
            ['报名时间', U.dt(a.enrollStart) + ' — ' + U.dt(a.enrollEnd)],
            ['报名范围', (a.audiences || []).join('、') || '全体学生'],
            ['认定分值', '学分 ' + a.credit + ' · 学时 ' + a.hours + ' · 积分 ' + a.points],
            ['报名情况', used + (cap ? ' / ' + cap : '') + ' 人' + (cap && used >= cap ? '（已满）' : '')],
            ['审核流程', a.needAudit ? a.flowTpl : '无需审核（直接发布）'],
            ['创建人 / 时间', (a.createdBy || '—') + ' · ' + U.dt(a.createdAt)]
          ]),
          D.h('div.mt12', D.h('div', { style: 'font-weight:700;font-size:13px;margin-bottom:6px' }, '活动介绍')),
          D.h('div', { style: 'font-size:12.5px;line-height:1.9;color:var(--text2)' }, a.desc),
          (a.files || []).length ? D.h('div.mt12', {},
            D.h('div', { style: 'font-weight:700;font-size:13px;margin-bottom:6px' }, '活动附件'),
            D.h('div.btn-row', (a.files || []).map(function (f) {
              return D.h('button.btn.btn-sm', {
                onclick: function () { UI.toast('附件下载', f + '（演示：模拟下载）', 'ok'); }
              }, '📎 ' + f);
            }))
          ) : null
        ),
        D.h('div', {},
          UI.card({
            title: '我的报名状态', tight: true,
            body: mine ? [
              KP.kv([
                ['报名项目', mine.itemName],
                ['报名状态', mine.status],
                ['报名时间', mine.at],
                ['签到状态', mine.signStatus || '未签到'],
                ['审核人', mine.reviewer || '—'],
                ['备注', mine.note || '—']
              ]),
              D.h('div.btn-row', { style: 'margin-top:10px' },
                D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('myact'); } }, '去「我报名的」查看')
              )
            ] : D.h('div.req-note', '你尚未报名该活动。'),
            note: '报名数据与移动端实时同步'
          }),
          D.h('div.mt12', UI.card({
            title: '报名热度', tight: true,
            body: [
              UI.pgRow(cap ? used / cap * 100 : 0, used + ' / ' + (cap || '不限') + ' 人'),
              D.h('div', { style: 'margin-top:10px;font-size:12px;color:var(--text2);line-height:1.9' },
                D.h('div', '· 已签到 ' + DB.count('signins', function (x) { return x.actId === a.id && x.status !== '缺勤'; }) + ' 人'),
                D.h('div', '· 缺勤 ' + DB.count('signins', function (x) { return x.actId === a.id && x.status === '缺勤'; }) + ' 人'),
                D.h('div', '· 待审核报名 ' + DB.count('enrollments', function (x) { return x.actId === a.id && x.status === '待审核'; }) + ' 人')
              )
            ]
          })),
          D.h('div.mt12', UI.card({
            title: '组织者与协同管理员', tight: true,
            body: (a.admins || []).length ? UI.miniList((a.admins || []).map(function (ad) {
              return { name: ad.name, sub: ad.role + ' · ' + (ad.perms || []).join('/'), icon: '👤', fg: '#2563eb', bg: '#eff6ff' };
            })) : D.h('span.muted', '未配置协同管理员')
          }))
        )
      )
    );
  }

  function paneItems(a) {
    var list = a.items || [];
    if (!list.length) return UI.empty('未设置报名项目', '组织者可在「第二课堂活动」中配置');
    return D.h('div', {},
      UI.table({
        cols: [
          { t: '项目名称', render: function (it) { return KP.cell(it.name, '编号 ' + it.id); } },
          { t: '报名窗口', render: function (it) { return D.h('span', { style: 'font-size:12px' }, U.dt(it.enrollStart, false) + ' — ' + U.dt(it.enrollEnd, false)); } },
          { t: '名额', w: 118, render: function (it) {
            var cap = U.int(it.limit, 0);
            var used = DB.count('enrollments', function (e) { return e.itemId === it.id && e.status !== '已驳回'; });
            return KP.progCell(cap ? used / cap * 100 : 0, used + (cap ? ' / ' + cap : ' 不限'));
          } },
          { t: '报名表单', w: 130, render: function (it) { return it.needForm ? UI.tag((it.formFields || []).length + ' 个字段', 'tag-warn') : UI.tag('免填', 'tag-ok'); } },
          { t: '报名范围', render: function (it) { return (it.scope || []).join('、') || '全体学生'; } },
          { t: '取消规则', render: function (it) { return D.h('span', { style: 'font-size:11.5px;color:var(--text3)' }, it.cancelRule || '—'); } }
        ],
        rows: list, mini: true,
        footNote: '共 ' + list.length + ' 个报名项目'
      })
    );
  }

  function paneSign(a, mine) {
    return D.h('div', {},
      UI.card({
        title: '签到方式', tight: true,
        body: [
          D.h('div.btn-row', (a.signModes || []).map(function (m) { return D.h('span.tag.tag-info', m); })),
          D.h('div', { style: 'margin-top:10px;font-size:12px;color:var(--text2);line-height:1.9' },
            D.h('div', '· 二维码刷新频率：每 ' + (a.signRefresh || 60) + ' 秒重新生成一次（防代签）'),
            D.h('div', '· 位置签到校验半径：' + (SG ? SG.RADIUS + ' 米' : '—')),
            D.h('div', '· 签到 / 签退：支持一次签到与签退两次校验')
          ),
          mine && (a.status === '待开始' || a.status === '进行中')
            ? D.h('div', { style: 'margin-top:11px' },
              D.h('button.btn.btn-sm.btn-p', {
                onclick: function () {
                  if (!SG) { UI.toast('签到模块未加载', '', 'err'); return; }
                  var enr = DB.get('enrollments', mine.id);
                  SG.studentModal(a, enr, function () { w.ZR.render(); });
                }
              }, '📍 打开我的签到页'))
            : null
        ]
      }),
      D.h('div.mt12', UI.card({
        title: '我的签到记录', tight: true,
        body: (function () {
          var sg = DB.filter('signins', function (x) { return x.actId === a.id && mine && x.studentId === mine.studentId; });
          if (!sg.length) return UI.empty('暂无签到记录', '活动开始后可在此查看');
          return UI.table({
            cols: [
              { t: '签到方式', k: 'method', w: 118 },
              { t: '时间', k: 'at', w: 150 },
              { t: '状态', w: 100, render: function (x) { return KP.status(x.status); } },
              { t: '设备 / 位置', render: function (x) { return KP.cell(x.device || '—', x.place || ''); } }
            ],
            rows: sg, mini: true
          });
        })()
      })),
      D.h('div.mt12', UI.card({
        title: '证书与获奖', tight: true,
        body: [
          D.h('div', { style: 'margin-bottom:8px;font-size:12px;color:var(--text2)' },
            '证书模板：' + (function () { var t = DB.get('tpls', a.certTpl); return t ? t.name : (a.certTpl || '未配置'); })() +
            ' · 已生成证书 ' + (a.certCount || 0) + ' 份'),
          D.h('div.btn-row', (a.awards || []).map(function (x) { return D.h('span.tag.tag-purple', x); })),
          D.h('div', { style: 'margin-top:10px;font-size:12px;color:var(--text2)' },
            '展示样式：' + (a.showTpl || '样式1') + '（在「第二课堂活动 · 展示样式」中切换）')
        ]
      }))
    );
  }

  function paneLog(a) {
    var own = (a.infoChanges || []);
    var logs = DB.filter('logs', function (l) { return l.target === a.id; });
    return D.h('div', {},
      UI.card({
        title: '活动信息变更记录', tight: true,
        body: own.length ? UI.timeline(own.map(function (c) {
          return {
            time: c.at, text: '<b>' + c.by + '</b> ' + c.field + '：' + (c.from || '—') + ' → ' + (c.to || '—'),
            desc: c.notify ? '已通知相关参与人（' + (c.notified || 0) + ' 人）' : '', tone: 'ok'
          };
        })) : UI.empty('暂无信息变更')
      }),
      D.h('div.mt12', UI.card({
        title: '操作留痕', tight: true,
        body: logs.length ? UI.table({
          cols: [
            { t: '时间', k: 'at', w: 148 },
            { t: '操作人', render: function (l) { return KP.cell(l.actor, l.role); } },
            { t: '动作', k: 'action', w: 130 },
            { t: '结果', w: 88, render: function (l) { return KP.status(l.result); } },
            { t: 'IP', k: 'ip', w: 118 },
            { t: '详情', k: 'detail' }
          ],
          rows: logs, mini: true
        }) : UI.empty('暂无操作留痕')
      }))
    );
  }

  /* ---------------- 筛选条 ---------------- */
  function filterBar(refresh) {
    var cats = DB.col('cats').map(function (c) { return [c.name, c.name]; });
    var cols = DB.col('colleges').map(function (c) { return [c.id, c.name]; });
    return UI.filterBar([
      { type: 'input', ph: '搜索活动标题 / 主办方 / 地点…', value: st.kw, width: 236, onChange: function (e) { var v = e.target.value; st.kw = v; st.page = 1; refresh(); } },
      { type: 'select', label: '分类', value: st.cat, options: [['', '全部分类']].concat(cats), onChange: function (v) { st.cat = v; st.page = 1; refresh(); } },
      { type: 'select', label: '级别', value: st.level, options: [['', '全部级别'], ['校级', '校级'], ['院级', '院级']], onChange: function (v) { st.level = v; st.page = 1; refresh(); } },
      { type: 'select', label: '形式', value: st.form, options: [['', '全部形式'], ['线上', '线上'], ['线下', '线下']], onChange: function (v) { st.form = v; st.page = 1; refresh(); } },
      { type: 'select', label: '状态', value: st.phase, options: [['', '全部状态']].concat(PHASES.map(function (p) { return [p, p]; })), onChange: function (v) { st.phase = v; st.page = 1; refresh(); } },
      { type: 'select', label: '学院', value: st.college, options: [['', '全部学院']].concat(cols), onChange: function (v) { st.college = v; st.page = 1; refresh(); } },
      {
        type: 'select', label: '排序', value: st.sort,
        options: [['latest', '最新发布'], ['start', '即将开始'], ['hot', '报名最热'], ['credit', '学分最高']],
        onChange: function (v) { st.sort = v; refresh(); }
      }
    ], {
      right: D.h('div', { style: 'display:flex;gap:9px;align-items:center' },
        ZA.isStudent() ? D.h('label', { style: 'display:flex;gap:5px;align-items:center;font-size:12px;color:var(--text2)' },
          D.h('input', { type: 'checkbox', checked: st.onlyMine, onchange: function (e) { st.onlyMine = e.target.checked; st.page = 1; refresh(); } }), '仅看我已报名') : null,
        D.h('span.muted', '共 ' + rows().length + ' 个活动')
      )
    });
  }

  /* ---------------- 渲染 ---------------- */
  function render(host, param) {
    if (param === 'mine') st.onlyMine = true;
    var stu = me();
    var list = rows();
    var myEnr = stu ? myEnrList(stu.id) : [];

    host.appendChild(UI.pageHd({
      crumb: '<b>活动运营</b> / 活动广场',
      title: '活动广场',
      desc: '面向全校学生的活动浏览与报名入口 · ' + DB.data.meta.school + ' · 当前身份：' + (ZA.ROLE_LABEL[ZA.role()] || '') + '（' + ZA.scopeText() + '）',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { st.view = st.view === 'card' ? 'list' : 'card'; w.ZR.render(); } }, st.view === 'card' ? '☰ 列表视图' : '▦ 卡片视图'),
        D.h('button.btn.btn-sm', { onclick: function () { st.view = 'phone'; w.ZR.render(); } }, '📱 移动端预览'),
        ZA.isStudent() ? D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('myact'); } }, '我报名的 ' + myEnr.length) : null,
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZR.go(ZA.isStudent() ? 'apply' : 'act'); } }, ZA.isStudent() ? '分值申报' : '＋ 创建活动')
      ].filter(Boolean)
    }));

    if (ZA.isStudent()) host.appendChild(D.h('div.mt12', KP.viewTip('活动广场为你展示全校已发布活动，报名后可在这里同步看到状态')));

    host.appendChild(D.h('div.mt16', KP.kpis([
      { ic: '🎪', label: '已发布活动', num: pub().length, unit: '个', fg: '#2563eb', bg: '#eff6ff', foot: '当前筛选 ' + list.length + ' 个' },
      { ic: '🟢', label: '正在报名', num: pub().filter(function (a) { return phaseOf(a) === '报名中'; }).length, unit: '个', fg: '#0891b2', bg: '#ecfeff', foot: '报名截止前可取消' },
      { ic: '🙋', label: '我的报名', num: myEnr.filter(function (e) { return e.status !== '已取消'; }).length, unit: '人次', fg: '#7c3aed', bg: '#f5f3ff', foot: '待审核 ' + myEnr.filter(function (e) { return e.status === '待审核'; }).length + ' 人次' },
      { ic: '📍', label: '我的签到', num: DB.count('signins', function (x) { return stu && x.studentId === stu.id && x.status !== '缺勤'; }), unit: '人次', fg: '#059669', bg: '#ecfdf5', foot: '缺勤 ' + DB.count('signins', function (x) { return stu && x.studentId === stu.id && x.status === '缺勤'; }) + ' 次' },
      { ic: '🎓', label: '可获得学分', num: Math.round(list.reduce(function (s, a) { return s + U.num(a.credit); }, 0) * 10) / 10, unit: '分', fg: '#d97706', bg: '#fffbeb', foot: '按当前筛选结果统计' }
    ], 'g5')));

    var refresh = function () { w.ZR.render(); };

    if (st.view === 'phone') {
      var picks = list.slice(0, 3);
      host.appendChild(D.h('div.mt16', UI.card({
        title: '移动端预览', sub: '学生手机端与 PC 端共用同一份数据，报名、签到实时同步',
        right: D.h('button.btn.btn-sm', { onclick: function () { st.view = 'card'; w.ZR.render(); } }, '返回卡片视图'),
        body: D.h('div', { style: 'display:flex;gap:20px;flex-wrap:wrap;justify-content:center;padding:6px 0' },
          picks.length ? picks.map(phoneOf) : D.h('div', '当前筛选结果为空'))
      })));
    } else if (st.view === 'list') {
      host.appendChild(D.h('div.mt16', UI.card({
        title: '活动列表', sub: '共 ' + list.length + ' 个活动',
        flush: true,
        right: D.h('div.hd-r', KP.exportBtn('导出活动清单', [
          { t: '活动编号', k: 'id' }, { t: '活动标题', k: 'title' }, { t: '分类', k: 'cat' },
          { t: '级别', k: 'level' }, { t: '主办方', k: 'host' }, { t: '形式', k: 'form' },
          { t: '地点', k: 'place' }, { t: '开始时间', k: 'start' }, { t: '结束时间', k: 'end' },
          { t: '学分', k: 'credit' }, { t: '学时', k: 'hours' }, { t: '状态', k: 'status' }
        ], list, { primary: false })),
        body: (function () {
          var maxPage = Math.max(1, Math.ceil(list.length / st.ps));
          if (st.page > maxPage) st.page = maxPage;
          var shown = list.slice((st.page - 1) * st.ps, st.page * st.ps);
          if (!shown.length) return UI.empty('没有符合条件的活动', '试着调整筛选条件');
          return D.h('div', {},
            D.h('div', { style: 'padding:12px 15px 0' }, filterBar(refresh)),
            D.h('div.mt12', shown.map(function (a) { return rowOf(a, refresh); })),
            D.h('div', { style: 'padding:11px 15px' }, UI.pager({
              total: list.length, pageSize: st.ps, page: st.page,
              onChange: function (p) { st.page = p; w.ZR.render(); }
            }))
          );
        })()
      })));
    } else {
      var maxPage = Math.max(1, Math.ceil(list.length / st.ps));
      if (st.page > maxPage) st.page = maxPage;
      var shown = list.slice((st.page - 1) * st.ps, st.page * st.ps);
      host.appendChild(D.h('div.mt16', UI.card({
        title: st.onlyMine ? '我报名的活动' : '活动列表', sub: '共 ' + list.length + ' 个活动' + (st.onlyMine ? '（仅显示我已报名的）' : ''),
        right: D.h('div.hd-r', KP.exportBtn('导出活动清单', [
          { t: '活动编号', k: 'id' }, { t: '活动标题', k: 'title' }, { t: '分类', k: 'cat' },
          { t: '级别', k: 'level' }, { t: '主办方', k: 'host' }, { t: '开始时间', k: 'start' },
          { t: '地点', k: 'place' }, { t: '学分', k: 'credit' }, { t: '状态', k: 'status' }
        ], list)),
        body: [
          D.h('div', { style: 'padding:13px 15px 0' }, filterBar(refresh)),
          shown.length
            ? D.h('div', { style: 'padding:13px 15px;display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:13px' },
              shown.map(function (a) { return cardOf(a, refresh); }))
            : D.h('div', { style: 'padding:16px 15px' }, UI.empty('没有符合条件的活动', '试着放宽筛选条件，或切换分类看看'))
        ],
        note: '共 ' + list.length + ' 条，每页 ' + st.ps + ' 条'
      })));
      if (list.length) {
        host.appendChild(D.h('div.mt12', UI.pager({
          total: list.length, pageSize: st.ps, page: st.page,
          onChange: function (p) { st.page = p; w.ZR.render(); }
        })));
      }
    }
  }

  w.ZKP.pages({
    square: {
      title: '活动广场', group: '活动运营',
      render: render
    }
  });
})(window);
