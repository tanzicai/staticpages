/* ==========================================================================
   student.js —— 学生端三页：我的二课 / 我报名的 / 我的成绩单
   教职工切换到「学生」角色时看到的是同一套页面（取一名资料最完整的学生，
   便于演示端到端效果），页头会明确标注当前为学生端视角预览。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP, SG = w.ZSIGN;

  function stu() { return ZA.viewStudent() || {}; }
  function stuId() { return ZA.viewStudentId(); }
  function scheme() { return DB.scheme(); }

  /* ===================== 我的二课 ===================== */
  function renderMine(host) {
    var s = stu(), id = stuId();
    if (!id) { host.appendChild(UI.empty('未找到学生信息', '请重新登录后再试')); return; }
    var agg = DB.aggOf(id) || { total: 0, hours: 0, points: 0, cat: {}, records: 0 };
    var sc = scheme();
    var need = U.num(sc ? sc.standard.pass : 6);
    var pass = agg.total >= need;
    var recs = U.sortBy(DB.recsOf(id), function (r) { return r.at; }, true);

    /* 待办 */
    var myEnr = DB.filter('enrollments', function (e) { return e.studentId === id; });
    var myActs = myEnr.filter(function (e) { return e.status === '已通过'; });
    var signIns = DB.filter('signins', function (x) { return x.studentId === id; });
    var signedIds = {};
    signIns.forEach(function (x) { signedIds[x.actId] = true; });
    var toSign = myActs.filter(function (e) {
      var a = DB.get('activities', e.actId);
      return a && (a.status === '进行中' || a.status === '待开始') && !signedIds[e.actId];
    });
    var toWork = myActs.filter(function (e) {
      var a = DB.get('activities', e.actId);
      if (!a || !a.needWork) return false;
      return !DB.find('works', function (x) { return x.actId === a.id && x.studentId === id; });
    });
    var myApps = DB.filter('scoreApps', function (x) { return x.studentId === id; });
    var unread = DB.count('msgs', function (m) { return m.unreadCount > 0; });

    host.appendChild(UI.pageHd({
      crumb: '<b>我的二课</b> / 我的二课',
      title: '你好，' + s.name,
      desc: s.college + ' · ' + s.major + ' · ' + s.className + ' · 学号 ' + s.sno + ' · 学籍状态 ' + (s.status || '在籍'),
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('myscore'); } }, '📄 我的成绩单'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZR.go('square'); } }, '🔍 逛活动广场')
      ]
    }));

    if (!ZA.isStudent()) host.appendChild(KP.viewTip('顶栏显示的学生为演示用学生账号，可在「用户管理」中更换'));

    /* 学分总览 + 类别进度 */
    var catRows = KP.catProgress(agg, sc);
    host.appendChild(D.h('div.mt12.g-21',
      UI.card({
        title: '学分完成情况', sub: sc ? sc.name : '',
        body: D.h('div', { style: 'display:flex;gap:18px;align-items:center;flex-wrap:wrap' },
          D.h('div', { style: 'flex:0 0 auto' }, D.ring(need ? U.clamp(agg.total / need, 0, 1) : 0, 132,
            pass ? '#10b981' : '#f59e0b', (Math.round(agg.total * 100) / 100) + '')),
          D.h('div', { style: 'flex:1;min-width:190px' },
            D.h('div', { style: 'display:flex;align-items:center;gap:9px;margin-bottom:9px' },
              KP.status(pass ? '已达标' : '未达标'),
              D.h('span.muted', '达标线 ' + need + ' 学分'),
              D.h('span.muted', '已修 ' + agg.total + ' 学分')
            ),
            KP.kv([
              ['距达标', pass ? '已达标' : ('还差 ' + (Math.round((need - agg.total) * 100) / 100) + ' 学分')],
              ['累计学时', agg.hours + ' 学时'],
              ['累计积分', agg.points + ' 分'],
              ['成绩等级', gradeOf(agg.total, sc)],
              ['记录条数', agg.records + ' 条']
            ])
          )
        ),
        note: '学分 = 各类别活动认定学分累加；学时与积分按考核方案换算比例折算。'
      }),
      UI.card({
        title: '六大类别达成情况', sub: '各类别达标线为该类别标准学分的 60%',
        body: D.h('div', catRows.map(function (r) {
          return D.h('div', { style: 'margin-bottom:11px' },
            D.h('div', { style: 'display:flex;align-items:center;justify-content:space-between;font-size:12.5px;margin-bottom:4px' },
              D.h('span', { style: 'font-weight:600;display:flex;align-items:center;gap:6px' },
                D.h('i', { style: 'width:8px;height:8px;border-radius:2px;display:inline-block;background:' + (r.color || '#3b82f6') }),
                r.cat),
              D.h('span', { class: 'muted' }, r.got + ' / ' + r.need + ' 学分' + (r.ok ? '' : '（未达 60%）'))
            ),
            UI.pg(r.pct)
          );
        })),
        note: '点击左侧「学分完成情况」中的类别可查看该类别的成绩记录明细。'
      })
    ));

    /* 待办 */
    host.appendChild(D.h('div.mt16', UI.card({
      title: '我的待办',
      body: D.h('div.g4', [
        todoTile('📍', '待签到活动', toSign.length, '#2563eb', '#eff6ff', function () { w.ZR.go('myact'); }),
        todoTile('🎬', '待提交作品', toWork.length, '#d97706', '#fffbeb', function () { w.ZR.go('myact'); }),
        todoTile('📝', '申报进行中', myApps.filter(function (x) { return x.status === '待初审' || x.status === '待终审'; }).length, '#7c3aed', '#f5f3ff', function () { w.ZR.go('apply'); }),
        todoTile('📢', '未读消息', unread, '#db2777', '#fdf2f8', function () { w.ZR.go('msg'); })
      ])
    })));

    /* 最近成绩明细 */
    host.appendChild(D.h('div.mt16', UI.card({
      title: '最近成绩记录', sub: '共 ' + recs.length + ' 条，此处显示最近 6 条',
      right: D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('myscore'); } }, '查看完整成绩单 →'),
      flush: true,
      body: KP.lister({
        noCard: true, pageSize: 0,
        cols: [
          { t: '认定事由', render: function (r) { return KP.cell(r.actTitle, r.source + ' · ' + (r.term || '')); } },
          { t: '类别', w: 88, render: function (r) { return KP.catTag(r.cat); } },
          { t: '学分', w: 66, align: 'center', render: function (r) { return KP.numCell(r.credit, '分'); } },
          { t: '学时', w: 66, align: 'center', render: function (r) { return KP.numCell(r.hours, ''); } },
          { t: '积分', w: 66, align: 'center', render: function (r) { return KP.numCell(r.points, ''); } },
          { t: '级别', w: 62, align: 'center', render: function (r) { return r.level || '—'; } },
          { t: '认定时间', w: 132, render: function (r) { return D.h('span.muted', U.dt(r.at)); } }
        ],
        rows: function () { return recs.slice(0, 6); }
      })
    })));

    /* 快捷入口 */
    host.appendChild(D.h('div.mt16', UI.card({
      title: '快捷入口',
      body: D.h('div.g6', [
        ['🔍', '活动广场', 'square'], ['📋', '我报名的', 'myact'], ['📄', '我的成绩单', 'myscore'],
        ['📝', '分值申报', 'apply'], ['🏛️', '社团专区', 'club'], ['🤖', 'AI 二课助手', 'ai']
      ].map(function (x) {
        return D.h('div', {
          style: 'border:1px solid var(--line);border-radius:11px;padding:13px;text-align:center;cursor:pointer',
          onclick: function () { w.ZR.go(x[2]); }
        }, D.h('div', { style: 'font-size:23px;margin-bottom:6px' }, x[0]), D.h('div', { style: 'font-size:12.5px' }, x[1]));
      }))
    })));
  }
  function todoTile(ic, label, n, fg, bg, go) {
    return D.h('div', {
      style: 'border:1px solid var(--line);border-radius:11px;padding:12px;display:flex;gap:11px;align-items:center;cursor:pointer',
      onclick: go
    }, UI.icoBox(ic, fg, bg, 36),
      D.h('div', { style: 'flex:1' },
        D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, label),
        D.h('div', { style: 'font-size:19px;font-weight:750;color:' + (n ? fg : 'var(--text3)') }, n)));
  }
  function gradeOf(total, sc) {
    var g = (sc && sc.grades) || [];
    for (var i = 0; i < g.length; i++) if (total >= U.num(g[i].min)) return g[i].level + '（' + g[i].point + ' 分）';
    return '—';
  }

  /* ===================== 我报名的 ===================== */
  function renderMyAct(host, param) {
    var id = stuId();
    var myEnr = DB.filter('enrollments', function (e) { return e.studentId === id; });
    var t = param === 'joined' ? 'joined' : 'mine';

    host.appendChild(UI.pageHd({
      crumb: '<b>我的二课</b> / ' + (t === 'joined' ? '我参加的' : '我报名的'),
      title: t === 'joined' ? '我参加的活动' : '我报名的活动',
      desc: '共 ' + myEnr.length + ' 条报名记录 · 已通过 ' + myEnr.filter(function (e) { return e.status === '已通过'; }).length + ' 条',
      right: D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZR.go('square'); } }, '去活动广场报名')
    }));

    var tabHost = D.h('div');
    var bodyHost = D.h('div.mt12');
    host.appendChild(tabHost);
    host.appendChild(bodyHost);

    var cur = { t: t, kw: '', st: '全部' };
    var tabs = UI.tabs({
      items: [{ k: 'mine', n: '我报名的' }, { k: 'joined', n: '我参加的' }],
      cur: cur.t,
      onChange: function (k) { cur.t = k; paint(); }
    });
    D.fill(tabHost, tabs);

    var lister;
    function paint() {
      D.fill(tabHost, UI.tabs({
        items: [{ k: 'mine', n: '我报名的', cnt: myEnr.length }, { k: 'joined', n: '我参加的', cnt: myEnr.filter(function (e) { return e.signStatus === '已签到'; }).length }],
        cur: cur.t, onChange: function (k) { cur.t = k; paint(); }
      }));
      D.fill(bodyHost, null);
      lister = KP.lister({
        host: bodyHost,
        title: cur.t === 'joined' ? '已参加活动记录' : '报名记录',
        filters: function (st, refresh) {
          return UI.filterBar([
            { type: 'select', value: cur.st, options: [['全部', '全部状态'], ['待审核', '待审核'], ['已通过', '已通过'], ['已驳回', '已驳回'], ['已取消', '已取消']], onChange: function (v) { cur.st = v; refresh(); } },
            { type: 'input', ph: '搜索活动名称 / 类别', width: 210, onChange: function (e) { cur.kw = e.target.value; refresh(); } }
          ], { right: D.h('span.muted', '仅显示本人报名记录') });
        },
        rows: function () {
          var list = myEnr.slice();
          if (cur.t === 'joined') list = list.filter(function (e) { return e.signStatus === '已签到'; });
          if (cur.st !== '全部') list = list.filter(function (e) { return e.status === cur.st; });
          if (cur.kw) list = list.filter(function (e) { return U.hitAny([e.actTitle, e.cat, e.itemName], cur.kw); });
          return U.sortBy(list, function (e) { return e.at; }, true);
        },
        pageSize: 12,
        empty: '还没有报名记录',
        emptySub: '去「活动广场」看看正在报名的活动吧',
        cols: [
          {
            t: '活动', render: function (r) {
              var a = DB.get('activities', r.actId);
              return KP.cell(D.h('a', { href: 'javascript:;', style: 'color:var(--primary)', onclick: function () { actDetail(r.actId); } }, r.actTitle),
                (a ? a.host + ' · ' + U.dt(a.start) : '') + ' · 项目：' + r.itemName);
            }
          },
          { t: '类别', w: 88, render: function (r) { return KP.catTag(r.cat); } },
          { t: '报名时间', w: 132, render: function (r) { return D.h('span.muted', U.dt(r.at)); } },
          { t: '报名状态', w: 84, align: 'center', render: function (r) { return KP.status(r.status); } },
          { t: '签到状态', w: 84, align: 'center', render: function (r) { return KP.status(r.signStatus || '未签到'); } },
          {
            t: '操作', w: 172, render: function (r) {
              var a = DB.get('activities', r.actId);
              var acts = [D.h('button.btn.btn-sm', { onclick: function () { actDetail(r.actId); } }, '详情')];
              var canCancel = r.status === '待审核' || (r.status === '已通过' && a && (a.status === '待开始'));
              if (canCancel) {
                acts.push(D.h('button.btn.btn-sm', { onclick: function () { cancelEnroll(r, a); } }, '取消报名'));
              }
              if (r.status === '已通过' && r.signStatus !== '已签到' && a && (a.status === '进行中' || a.status === '待开始')) {
                acts.push(D.h('button.btn.btn-sm.btn-p', { onclick: function () { SG.studentModal(a, r, function () { paint(); }); } }, '去签到'));
              }
              return KP.acts(acts);
            }
          }
        ],
        footLeft: function (st, data) {
          return D.h('span.muted', '筛选结果 ' + data.length + ' 条');
        }
      });
    }
    paint();

    /* 取消报名（按取消规则校验，真实写入数据） */
    function cancelEnroll(r, a) {
      var it = null;
      if (a && a.items) a.items.forEach(function (x) { if (x.id === r.itemId) it = x; });
      var rule = it ? it.cancelRule : '';
      var act = a || {};
      var startT = U.toDate(act.start);
      /* 规则：活动开始前 2 小时截止取消（若项目自定义规则则按其描述提示） */
      var limit = startT ? startT.getTime() - 2 * 3600000 : null;
      var now = U.toDate(DB.data.meta.now || new Date());
      var overdue = limit !== null && now && now.getTime() > limit;
      UI.confirm({
        title: '取消报名',
        text: '确认取消「' + r.actTitle + '」的报名吗？取消后名额将释放给其他同学。',
        detail: '取消规则：' + (rule || '活动开始前 2 小时可取消') +
          (overdue ? '　·　当前已超过取消时限，取消将记入取消次数并可能影响后续报名优先级' : ''),
        okText: '确认取消', danger: true,
        onOk: function () {
          DB.update('enrollments', r.id, { status: '已取消', note: '学生自行取消' + (overdue ? '（超时取消）' : '') });
          UI.toast('已取消报名', r.actTitle, 'ok');
          paint();
        }
      });
    }
  }

  /* 活动主页（学生视角） */
  function actDetail(actId) {
    var a = DB.get('activities', actId);
    if (!a) { UI.toast('活动不存在', '该活动可能已被删除', 'warn'); return; }
    var id = stuId();
    var myEnr = DB.find('enrollments', function (e) { return e.actId === a.id && e.studentId === id; });
    var enrN = DB.count('enrollments', function (e) { return e.actId === a.id; });
    var sgnN = DB.count('signins', function (x) { return x.actId === a.id && x.status === '已签到'; });
    var body = D.h('div');
    body.appendChild(D.h('div', { style: 'display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:11px' },
      KP.catTag(a.cat), KP.status(a.status), D.h('span.tag', a.level), D.h('span.tag.tag-info', a.form),
      D.h('span.muted', '主办：' + a.host)));
    body.appendChild(KP.kv([
      ['活动时间', U.dt(a.start) + ' — ' + U.dt(a.end)],
      ['报名时间', U.dt(a.enrollStart) + ' — ' + U.dt(a.enrollEnd)],
      ['活动地点', (a.place || '未设置') + (a.mapPin ? '（已选点）' : '')],
      ['认定分值', '学分 ' + a.credit + ' · 学时 ' + a.hours + ' · 积分 ' + a.points],
      ['报名情况', enrN + ' 人报名 · ' + sgnN + ' 人已签到' + (a.maxNum ? ' · 上限 ' + a.maxNum + ' 人' : '')],
      ['签到方式', (a.signModes || []).join(' + ') || '未设置'],
      ['我的报名', myEnr ? (myEnr.status + ' / ' + (myEnr.signStatus || '未签到')) : '未报名']
    ]));
    body.appendChild(D.h('div.mt12', KP.h5('活动介绍'), D.h('div.pv-text', a.desc || '暂无介绍')));
    if (a.items && a.items.length) {
      body.appendChild(D.h('div.mt12', KP.h5('报名项目（' + a.items.length + ' 项）')));
      body.appendChild(KP.lister({
        noCard: true, pageSize: 0,
        cols: [
          { t: '项目名称', render: function (r) { return KP.cell(r.name, '报名范围：' + (r.scope || []).join('、')); } },
          { t: '报名时间', w: 190, render: function (r) { return D.h('span.muted', U.dt(r.enrollStart) + ' 起'); } },
          { t: '人数限制', w: 88, align: 'center', render: function (r) { return r.limit ? (r.enrolled + ' / ' + r.limit) : '不限'; } },
          { t: '现场报名', w: 78, align: 'center', render: function (r) { return r.onSite ? KP.status('是') : D.h('span.muted', '否'); } },
          { t: '需填表单', w: 82, align: 'center', render: function (r) { return r.needForm ? KP.status('是') : D.h('span.muted', '否'); } }
        ],
        rows: function () { return a.items; }
      }));
    }
    if (a.needWork) {
      body.appendChild(D.h('div.mt12', KP.h5('作品征集与投票规则')));
      body.appendChild(UI.kv([
        ['作品格式', (a.workRule.formats || []).join('、')],
        ['提交份数', '最多 ' + a.workRule.maxCount + ' 份'],
        ['是否需要审核', a.workRule.review ? '需要' : '不需要'],
        ['多环节评审 / 专家评分', (a.workRule.multiStage ? '多环节评审' : '单轮评审') + ' / ' + (a.workRule.expert ? '启用专家评分' : '不启用')],
        ['投票规则', a.voteRule && a.voteRule.enabled ? (a.voteRule.start + ' 起，' + a.voteRule.rule) : '未启用'],
        ['奖项设置', (a.awards || []).join('、') || '未设置']
      ]));
    }
    body.appendChild(D.h('div.mt12', KP.h5('活动信息变更通知')));
    body.appendChild(UI.timeline((a.infoChanges || []).map(function (x) {
      return { time: U.dt(x.at), text: '<b>' + U.esc(x.field) + '</b>：' + U.esc(x.from) + ' → ' + U.esc(x.to), desc: '操作人 ' + x.by + ' · 已通知 ' + x.notified + ' 人' };
    })) || UI.empty('无变更记录'));

    var foot = [D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭')];
    var m = UI.modal({ title: a.title, sub: a.host + ' · ' + a.cat, size: 'wide', body: body, foot: foot });
  }

  /* ===================== 我的成绩单 ===================== */
  function renderMyScore(host) {
    var s = stu(), id = stuId();
    var sc = scheme();
    var agg = DB.aggOf(id) || { total: 0, hours: 0, points: 0, cat: {}, records: 0 };
    var allRecs = U.sortBy(DB.recsOf(id), function (r) { return r.at; }, true);
    /* 模板取数：优先启用中的模板；若管理端把模板全部停用，则回落到全部模板，
       避免出现「无可用模板」时页面崩溃（此为可达状态，需兜底）。 */
    var tpls = DB.filter('tpls', function (t) { return t.enabled; });
    if (!tpls.length) tpls = DB.col('tpls').slice();
    if (!tpls.length) {
      host.appendChild(UI.pageHd({ crumb: '<b>我的二课</b> / 我的成绩单', title: '我的第二课堂成绩单', desc: '当前没有可用的成绩单模板' }));
      host.appendChild(D.h('div.mt16', UI.card({
        title: '暂无可用模板',
        body: UI.empty('系统尚未配置成绩单模板', '请联系学院团委或系统管理员在「成绩单模板」中启用模板')
      })));
      return;
    }
    var st = { tpl: (tpls[0] || {}).id, dim: '按学年汇总', term: '全部', cat: '全部', kw: '' };
    var previewHost = D.h('div');
    var detailHost = D.h('div.mt16');

    host.appendChild(UI.pageHd({
      crumb: '<b>我的二课</b> / 我的成绩单',
      title: '我的第二课堂成绩单',
      desc: s.name + ' · ' + s.sno + ' · ' + s.college + ' ' + s.className + ' · 版本 ' + (tpls[0] ? tpls[0].ver : '—'),
      right: [
        D.h('button.btn.btn-sm', {
          onclick: function () {
            var tpl = DB.get('tpls', st.tpl) || tpls[0];
            var recs = filterRecs();
            UI.exportCSV('第二课堂成绩单明细_' + s.sno, [
              { t: '认定事由', k: 'actTitle' }, { t: '类别', k: 'cat' }, { t: '级别', k: 'level' },
              { t: '学分', k: 'credit' }, { t: '学时', k: 'hours' }, { t: '积分', k: 'points' },
              { t: '来源', k: 'source' }, { t: '认定时间', k: 'at' }, { t: '学期', k: 'term' }
            ], recs);
          }
        }, '⤓ 导出明细'),
        D.h('button.btn.btn-sm.btn-p', { onclick: exportPDF }, '🖨 导出 PDF')
      ]
    }));

    /* 模板与筛选 */
    host.appendChild(UI.card({
      title: '成绩单模板', sub: '切换模板后下方预览与 PDF 导出实时生效',
      right: D.h('span.muted', '共 ' + tpls.length + ' 套模板'),
      body: [
        D.h('div.tpl-pick', tpls.map(function (t) {
          var on = t.id === st.tpl;
          return D.h('div.tpl-pick-item' + (on ? '.on' : ''), {
            style: 'border:1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)') + ';border-radius:11px;padding:11px;cursor:pointer;background:' + (on ? 'var(--primary-l)' : '#fff'),
            onclick: function () { st.tpl = t.id; paint(); }
          },
            D.h('div', { style: 'display:flex;align-items:center;justify-content:space-between' },
              D.h('b', { style: 'font-size:13px' }, t.name),
              on ? D.h('span.tag.tag-ok', '使用中') : null),
            D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:4px' },
              '版式字段 ' + t.fields.length + ' 项 · 统计维度 ' + t.dims.length + ' 项 · ' + t.paper + ' · ' + t.ver)
          );
        })),
        D.h('div.mt12', UI.filterBar([
          { type: 'select', label: '学年学期', value: st.term, options: [['全部', '全部学期']].concat(U.uniq(allRecs.map(function (r) { return r.term; })).filter(Boolean).map(function (t) { return [t, U.termText ? U.termText(t) : t]; })), onChange: function (v) { st.term = v; paint(); } },
          { type: 'select', label: '活动类别', value: st.cat, options: [['全部', '全部类别']].concat((DB.data.cats || []).map(function (c) { return [c.name, c.name]; })), onChange: function (v) { st.cat = v; paint(); } },
          { type: 'select', label: '统计维度', value: st.dim, options: tpls[0] ? tpls[0].dims.map(function (x) { return [x, x]; }) : [['按学年汇总', '按学年汇总']], onChange: function (v) { st.dim = v; paint(); } },
          { type: 'input', ph: '搜索认定事由', width: 190, onChange: function (e) { st.kw = e.target.value; paint(); } }
        ]))
      ]
    }));

    host.appendChild(D.h('div.mt16', UI.card({
      title: '成绩单预览', sub: '与 PDF 导出内容一致',
      right: D.h('button.btn.btn-sm', { onclick: exportPDF }, '打印 / 另存为 PDF'),
      body: previewHost
    })));

    host.appendChild(detailHost);

    function filterRecs() {
      var list = allRecs.slice();
      if (st.term !== '全部') list = list.filter(function (r) { return r.term === st.term; });
      if (st.cat !== '全部') list = list.filter(function (r) { return r.cat === st.cat; });
      if (st.kw) list = list.filter(function (r) { return U.hitAny([r.actTitle, r.source, r.level], st.kw); });
      return list;
    }

    function exportPDF() {
      var tpl = DB.get('tpls', st.tpl) || tpls[0];
      var recs = filterRecs();
      var html = scoreSheetHTML(s, agg, sc, recs, tpl);
      UI.printHTML('第二课堂成绩单 · ' + s.name, html);
    }

    function paint() {
      var tpl = DB.get('tpls', st.tpl) || tpls[0];
      var recs = filterRecs();
      /* 预览：按模板字段渲染 */
      D.fill(previewHost, scoreSheetDOM(s, agg, sc, recs, tpl, st));
      /* 明细 + 统计维度 */
      D.fill(detailHost, null);
      detailHost.appendChild(pivotCard(tpl, recs, agg));
      detailHost.appendChild(recTable(recs));
      D.qa('.tpl-pick-item', host).forEach(function (el, i) {
        var on = (tpls[i] || {}).id === st.tpl;
        el.classList.toggle('on', on);
        el.style.borderColor = on ? 'var(--primary)' : 'var(--line)';
        el.style.background = on ? 'var(--primary-l)' : '#fff';
      });
    }

    function recTable(recs) {
      return UI.card({
        title: '成绩记录明细', sub: '共 ' + recs.length + ' 条',
        flush: true,
        right: D.h('button.btn.btn-sm', {
          onclick: function () {
            UI.exportCSV('成绩记录明细_' + s.sno, [
              { t: '认定事由', k: 'actTitle' }, { t: '类别', k: 'cat' }, { t: '级别', k: 'level' },
              { t: '学分', k: 'credit' }, { t: '学时', k: 'hours' }, { t: '积分', k: 'points' },
              { t: '来源', k: 'source' }, { t: '认定时间', k: 'at' }, { t: '学期', k: 'term' }
            ], recs);
          }
        }, '⤓ 导出'),
        body: [KP.lister({
          noCard: true, pageSize: 10,
          cols: [
            { t: '认定事由', render: function (r) { return KP.cell(r.actTitle, r.source + (r.actId ? ' · 活动 ' + r.actId : '')); } },
            { t: '类别', w: 86, render: function (r) { return KP.catTag(r.cat); } },
            { t: '级别', w: 62, align: 'center', render: function (r) { return r.level || '—'; } },
            { t: '学分', w: 62, align: 'center', render: function (r) { return KP.numCell(r.credit); } },
            { t: '学时', w: 62, align: 'center', render: function (r) { return KP.numCell(r.hours); } },
            { t: '积分', w: 62, align: 'center', render: function (r) { return KP.numCell(r.points); } },
            { t: '学期', w: 108, render: function (r) { return D.h('span.muted', U.termText ? U.termText(r.term) : (r.term || '—')); } },
            { t: '认定时间', w: 128, render: function (r) { return D.h('span.muted', U.dt(r.at)); } }
          ],
          rows: function () { return recs; },
          empty: '当前筛选条件下没有成绩记录'
        })]
      });
    }

    function pivotCard(tpl, recs, a) {
      var dim = st.dim;
      if (dim === '按活动分类统计' || dim === '按类别') {
        var rows = (DB.data.cats || []).map(function (c, i) {
          var rs = recs.filter(function (r) { return r.cat === c.name; });
          return { n: c.name, v: Math.round(U.sum(rs, function (r) { return r.credit; }) * 100) / 100, c: c.color || C.color(i), cnt: rs.length };
        }).filter(function (r) { return r.cnt > 0 || true; });
        return UI.card({
          title: '统计维度 · 按活动分类', sub: dim,
          body: D.h('div', { style: 'display:flex;gap:16px;flex-wrap:wrap' },
            D.h('div', { style: 'flex:0 0 200px' }, C.donut(rows, { size: 196, thickness: 26, centerValue: Math.round(U.sum(rows, function (r) { return r.v; }) * 100) / 100, centerLabel: '合计学分' })),
            D.h('div', { style: 'flex:1;min-width:200px' }, C.rankBars(rows.map(function (r) { return { n: r.n, v: r.v, c: r.c }; }), { unit: ' 学分' })))
        });
      }
      if (dim === '按学期明细' || dim === '按学期') {
        var terms = U.uniq(recs.map(function (r) { return r.term; })).filter(Boolean);
        return UI.card({
          title: '统计维度 · 按学期', sub: dim,
          body: C.vbars(terms.map(function (t) {
            var rs = recs.filter(function (r) { return r.term === t; });
            return { n: U.termText ? U.termText(t) : t, v: Math.round(U.sum(rs, function (r) { return r.credit; }) * 100) / 100 };
          }), { height: 216, padB: 48, rotate: true, name: '学分' })
        });
      }
      /* 默认：按学年汇总 */
      var years = {};
      recs.forEach(function (r) {
        var y = String(r.term || r.at || '').slice(0, 4);
        if (!y) y = '其他';
        years[y] = (years[y] || 0) + U.num(r.credit);
      });
      var keys = Object.keys(years).sort();
      return UI.card({
        title: '统计维度 · 按学年汇总', sub: dim,
        body: [
          C.vbars(keys.map(function (k) { return { n: k + ' 学年', v: Math.round(years[k] * 100) / 100 }; }), { height: 200, name: '学分' }),
          D.h('div.g4.mt12', [
            UI.stat({ ic: '🎓', label: '累计学分', num: a.total, fg: '#2563eb', bg: '#eff6ff' }),
            UI.stat({ ic: '⏱', label: '累计学时', num: a.hours, fg: '#0891b2', bg: '#ecfeff' }),
            UI.stat({ ic: '⭐', label: '累计积分', num: a.points, fg: '#d97706', bg: '#fffbeb' }),
            UI.stat({ ic: '📄', label: '记录条数', num: a.records, fg: '#7c3aed', bg: '#f5f3ff' })
          ])
        ]
      });
    }

    paint();
  }

  /* 成绩单 DOM 渲染 */
  function scoreSheetDOM(s, agg, sc, recs, tpl, st) {
    var need = U.num(sc ? sc.standard.pass : 6);
    var pass = agg.total >= need;
    var wrap = D.h('div', { style: 'border:1px solid var(--line);border-radius:12px;padding:22px;background:#fff' });
    wrap.appendChild(D.h('div', { style: 'text-align:center;border-bottom:2px solid var(--primary);padding-bottom:12px;margin-bottom:14px' },
      D.h('div', { style: 'font-size:12.5px;color:var(--text3);letter-spacing:2px' }, DB.data.meta.school),
      D.h('div', { style: 'font-size:20px;font-weight:780;letter-spacing:5px;margin-top:5px;color:var(--primary)' }, '第二课堂成绩单'),
      D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:4px' }, '模板：' + ((tpl || {}).name || '默认模板') + ' · 统计维度：' + st.dim)
    ));
    wrap.appendChild(D.h('div.g4', [
      kvBox('姓名', s.name), kvBox('学号', s.sno), kvBox('学院', s.college), kvBox('专业班级', s.className)
    ]));
    wrap.appendChild(D.h('div.g4.mt12', [
      kvBox('累计学分', agg.total + ' 分'), kvBox('累计学时', agg.hours + ' 学时'),
      kvBox('累计积分', agg.points + ' 分'), kvBox('达标情况', pass ? '已达标' : ('未达标（差 ' + (Math.round((need - agg.total) * 100) / 100) + ' 分）'))
    ]));
    wrap.appendChild(KP.h5('类别学分明细'));
    wrap.appendChild(D.h('table.tbl', [
      D.h('thead', D.h('tr', ['类别', '已获学分', '达标线', '达成率', '结论'].map(function (t) { return D.h('th', t); }))),
      D.h('tbody', KP.catProgress(agg, sc).map(function (r) {
        return D.h('tr', [
          D.h('td', r.cat),
          D.h('td', String(r.got)),
          D.h('td', String(r.need)),
          D.h('td', r.pct.toFixed(0) + '%'),
          D.h('td', r.ok ? D.h('span', { style: 'color:#059669;font-weight:600' }, '合格') : D.h('span', { style: 'color:#dc2626;font-weight:600' }, '未达 60%'))
        ]);
      }))
    ]));
    wrap.appendChild(KP.h5('成绩记录（模板字段：' + (tpl.fields || []).join(' / ') + '）'));
    wrap.appendChild(D.h('div.tbl-wrap', D.h('table.tbl', [
      D.h('thead', D.h('tr', (tpl.fields || ['活动名称', '活动分类', '认定学分']).map(function (t) { return D.h('th', t); }))),
      D.h('tbody', recs.slice(0, 20).map(function (r) {
        var map = {
          '活动名称': r.actTitle, '活动分类': r.cat, '主办单位': (DB.get('activities', r.actId) || {}).host || '—',
          '开展时间': U.d(r.at), '认定学分': String(r.credit), '认定学时': String(r.hours),
          '认定积分': String(r.points), '认定状态': r.status
        };
        return D.h('tr', (tpl.fields || []).map(function (t) { return D.h('td', map[t] !== undefined ? map[t] : '—'); }));
      }))
    ])));
    if (recs.length > 20) wrap.appendChild(D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:6px' }, '仅显示前 20 条，完整明细见下方「成绩记录明细」或 PDF 导出。'));
    if (tpl.showStamp || tpl.showSign) {
      wrap.appendChild(D.h('div', { style: 'display:flex;justify-content:flex-end;align-items:flex-end;gap:26px;margin-top:18px' },
        tpl.showSign ? D.h('div', { style: 'font-size:12.5px;text-align:center' },
          D.h('div', { style: 'font-weight:600;padding-bottom:4px;border-bottom:1px solid var(--line);min-width:150px' }, tpl.sign),
          D.h('div', { style: 'color:var(--text3);margin-top:4px' }, '签发单位')) : null,
        tpl.showStamp ? D.h('div.seal-sq', { style: 'border:2px solid #ef4444;color:#ef4444;border-radius:50%;width:96px;height:96px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px;font-weight:700;line-height:1.25;transform:rotate(-8deg);opacity:.85;padding:9px' }, tpl.seal) : null
      ));
    }
    return wrap;
  }
  function kvBox(label, val) {
    return D.h('div', { style: 'border:1px solid var(--line);border-radius:9px;padding:9px 11px' },
      D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, label),
      D.h('div', { style: 'font-size:13.5px;font-weight:650;margin-top:2px' }, val));
  }

  /* 成绩单打印 HTML（与预览一致） */
  function scoreSheetHTML(s, agg, sc, recs, tpl) {
    var need = U.num(sc ? sc.standard.pass : 6);
    var pass = agg.total >= need;
    var h = '<div class="h1">' + U.esc(DB.data.meta.school) + '<br><span style="font-size:20px">第二课堂成绩单</span></div>' +
      '<div class="sub">模板：' + U.esc(tpl.name) + ' · 生成时间 ' + U.esc(U.dt(new Date())) + '</div>' +
      KP.metricsHTML([
        ['姓名', s.name], ['学号', s.sno], ['学院', s.college], ['专业班级', s.className],
        ['累计学分', agg.total + ' 分'], ['累计学时', agg.hours + ' 学时'], ['累计积分', agg.points + ' 分'],
        ['达标情况', pass ? '已达标' : '未达标（差 ' + (Math.round((need - agg.total) * 100) / 100) + ' 分）']
      ]) +
      '<div class="h2">类别学分明细</div>' +
      KP.tableHTML([{ t: '类别' }, { t: '已获学分' }, { t: '达标线' }, { t: '达成率' }, { t: '结论' }],
        KP.catProgress(agg, sc).map(function (r) {
          return { a: r.cat, b: r.got, c: r.need, d: r.pct.toFixed(0) + '%', e: r.ok ? '合格' : '未达 60%' };
        }).map(function (x) { return { 类别: x.a, 已获学分: x.b, 达标线: x.c, 达成率: x.d, 结论: x.e }; }),
        { cls: '' }) +
      '<div class="h2">成绩记录明细（共 ' + recs.length + ' 条）</div>' +
      KP.tableHTML([
        { t: '认定事由', k: 'actTitle' }, { t: '类别', k: 'cat' }, { t: '级别', k: 'level' },
        { t: '学分', k: 'credit' }, { t: '学时', k: 'hours' }, { t: '积分', k: 'points' },
        { t: '来源', k: 'source' }, { t: '认定时间', k: 'at' }, { t: '学期', k: 'term' }
      ], recs) +
      (tpl.showStamp ? KP.sealHTML(tpl.seal) : '') +
      (tpl.showSign ? '<div style="text-align:right;font-size:12px;margin-top:14px">签发单位：' + U.esc(tpl.sign) + '</div>' : '');
    return h;
  }

  w.ZKP.pages({
    mine: {
      title: '我的二课', group: '我的二课',
      render: renderMine
    },
    myact: {
      title: '我报名的', group: '活动与成绩',
      render: renderMyAct
    },
    myscore: {
      title: '我的成绩单', group: '活动与成绩',
      render: renderMyScore
    }
  });
})(window);
