/* ==========================================================================
   act.js —— 第二课堂活动（★ 演示重点）
   覆盖参数要求：
   ★1 后台直接创建 / 活动申报两种发布方式，可按角色配置是否审批与审批流程
    2 标题/封面/起止时间/分类/主办方/举办形式/地点/地图选点/富媒体介绍/分值
    3 一个活动多个报名项目：报名时间、人数限制、报名表单、报名范围、
       取消报名限制、现场报名
   ★4 作品征集规则与投票规则：格式、份数、投票时间与规则、多环节评审、
       专家评分、获奖证书；多级审核流程 + 退回修改 / 重新提交 / 逐级审核 / 意见留痕
    5 时间限制 / 位置 / 扫码签到可组合，二维码定时刷新 + 大屏投屏
    6 活动展示样式 ≥6 种（可切换 PC / 移动端预览）；证书模板 ≥50 种，可自定义
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP, SG = w.ZSIGN;

  var FLOWS = ['无需审批（创建即发布）', '一级审核（校团委）', '二级审核（学院初审 + 校团委终审）', '校级活动三级审核', '活动申报（学生发起 → 学院初审 → 校团委终审）'];
  var FORMS = ['线下举办', '线上平台（直播）', '线上线下结合'];
  var SHOW_STYLES = [
    { k: '样式1', n: '卡片沉浸式', d: '大图封面 + 卡片列表，适合展示型活动' },
    { k: '样式2', n: '信息优先式', d: '信息条在前，突出时间地点与分值' },
    { k: '样式3', n: '横幅通栏式', d: '通栏横幅 + 报名进度条，适合大型活动' },
    { k: '样式4', n: '双栏列表式', d: '左图右文，一屏可见更多活动' },
    { k: '样式5', n: '时间轴式', d: '按时间排序，突出近期即将开始' },
    { k: '样式6', n: '榜单热力式', d: '按热度排序并标注热度值' }
  ];
  var COVERS = [
    'linear-gradient(135deg,#2563eb,#0891b2)', 'linear-gradient(135deg,#7c3aed,#2563eb)',
    'linear-gradient(135deg,#059669,#0891b2)', 'linear-gradient(135deg,#d97706,#dc2626)',
    'linear-gradient(135deg,#db2777,#7c3aed)', 'linear-gradient(135deg,#0f172a,#334155)'
  ];
  var CERT_PALETTES = [
    { n: '经典蓝', c1: '#1d4ed8', c2: '#eef4ff', bg: '#f8fbff' },
    { n: '党政红', c1: '#b91c1c', c2: '#fef2f2', bg: '#fffbfb' },
    { n: '墨绿', c1: '#047857', c2: '#ecfdf5', bg: '#f7fffb' },
    { n: '靛紫', c1: '#6d28d9', c2: '#f5f3ff', bg: '#faf8ff' },
    { n: '暖金', c1: '#b45309', c2: '#fffbeb', bg: '#fffdf7' },
    { n: '青瓷', c1: '#0e7490', c2: '#ecfeff', bg: '#f7feff' },
    { n: '中国红金', c1: '#dc2626', c2: '#fff7ed', bg: '#fffaf5' },
    { n: '深空黑金', c1: '#111827', c2: '#f3f4f6', bg: '#fdfdfd' },
    { n: '玫红', c1: '#be185d', c2: '#fdf2f8', bg: '#fff9fc' },
    { n: '湖蓝', c1: '#0369a1', c2: '#e0f2fe', bg: '#f8fcff' },
    { n: '橄榄绿', c1: '#4d7c0f', c2: '#f7fee7', bg: '#fbfff7' },
    { n: '紫金', c1: '#7e22ce', c2: '#fdf4ff', bg: '#fdfaff' }
  ];
  var CERT_LAYS = ['横版烫金边框', '竖版居中式', '双框典雅式', '角花装饰式', '简约现代式'];

  /* 证书模板库：12 配色 × 5 版式 = 60 套 */
  function certTemplates() {
    var out = [];
    CERT_PALETTES.forEach(function (p, pi) {
      CERT_LAYS.forEach(function (l, li) {
        out.push({
          id: 'CERT-' + U.pad(pi * 5 + li + 1),
          name: p.n + ' · ' + l,
          pal: p, lay: l, idx: pi * 5 + li + 1
        });
      });
    });
    return out;
  }

  /* ---------------- 列表页 ---------------- */
  function listState() {
    return { st: '全部', cat: '全部', lv: '全部', kw: '', owner: '全部' };
  }

  function statusOf(a) { return a.status; }
  function publishedLike(a) { return a.status === '待开始' || a.status === '进行中' || a.status === '已结束'; }

  function render(host) {
    var f = listState();
    var scopeActs = function () {
      return KP.scopeFilter(DB.col('activities'), function (a) { return a.collegeId || a.ownerCollege; });
    };

    host.appendChild(UI.pageHd({
      crumb: '<b>活动运营</b> / 第二课堂活动',
      title: '第二课堂活动',
      star: true,
      desc: '支持「后台直接创建」与「活动申报」两种发布方式；一个活动可挂多个报名项目，签到方式可组合使用。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { flowConfigModal(); } }, '⚙ 审核流程配置'),
        D.h('button.btn.btn-sm', { onclick: function () { openEditor(null, 'apply'); } }, '📝 活动申报'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { openEditor(null, 'create'); } }, '＋ 后台创建活动')
      ]
    }));

    var all = scopeActs();
    host.appendChild(KP.kpis([
      { ic: '📌', label: '活动总数', num: all.length, fg: '#2563eb', bg: '#eff6ff' },
      { ic: '⏳', label: '待审核', num: all.filter(function (a) { return a.status === '待审核'; }).length, fg: '#d97706', bg: '#fffbeb' },
      { ic: '🗓', label: '待开始', num: all.filter(function (a) { return a.status === '待开始'; }).length, fg: '#0891b2', bg: '#ecfeff' },
      { ic: '▶', label: '进行中', num: all.filter(function (a) { return a.status === '进行中'; }).length, fg: '#7c3aed', bg: '#f5f3ff' },
      { ic: '✅', label: '已结束', num: all.filter(function (a) { return a.status === '已结束'; }).length, fg: '#059669', bg: '#ecfdf5' }
    ], 'g5'));

    var host2 = D.h('div.mt16');
    host.appendChild(host2);

    var box = { el: null };
    var refresh = function () { if (box.el) box.el.render(); };
    box.el = KP.lister({
      host: host2,
      title: '活动列表', sub: '共 ' + all.length + ' 个活动 · 数据范围 ' + ZA.scopeText(),
      filters: function (st, refresh) {
        return UI.filterBar([
          { type: 'select', label: '状态', value: f.st, options: [['全部', '全部状态'], ['待审核', '待审核'], ['待开始', '待开始'], ['进行中', '进行中'], ['已结束', '已结束'], ['已驳回', '已驳回'], ['草稿', '草稿']], onChange: function (v) { f.st = v; refresh(); } },
          { type: 'select', label: '类别', value: f.cat, options: [['全部', '全部类别']].concat((DB.data.cats || []).map(function (c) { return [c.name, c.name]; })), onChange: function (v) { f.cat = v; refresh(); } },
          { type: 'select', label: '级别', value: f.lv, options: [['全部', '全部级别'], ['校级', '校级'], ['院级', '院级']], onChange: function (v) { f.lv = v; refresh(); } },
          { type: 'input', ph: '搜索活动名称 / 主办方', width: 200, onChange: function (e) { f.kw = e.target.value; refresh(); } }
        ], { right: D.h('span.muted', '我的活动范围：' + (ZA.role() === 'organizer' ? '本人负责' : ZA.scopeText())) });
      },
      rows: function () {
        var list = scopeActs();
        if (f.st !== '全部') list = list.filter(function (a) { return a.status === f.st; });
        if (f.cat !== '全部') list = list.filter(function (a) { return a.cat === f.cat; });
        if (f.lv !== '全部') list = list.filter(function (a) { return a.level === f.lv; });
        if (f.kw) list = list.filter(function (a) { return U.hitAny([a.title, a.host, a.place, a.cat], f.kw); });
        return U.sortBy(list, function (a) { return a.start; }, true);
      },
      pageSize: 12,
      empty: '没有符合条件的活动',
      emptySub: '可点击右上角「后台创建活动」或「活动申报」新建',
      rowClick: null,
      cols: [
        {
          t: '活动', render: function (a) {
            var enrN = DB.count('enrollments', function (e) { return e.actId === a.id; });
            return D.h('div', { style: 'display:flex;gap:10px;align-items:flex-start;min-width:0' },
              D.h('div', { style: 'width:52px;height:38px;border-radius:8px;flex:0 0 52px;background:' + (a.catGrad || COVERS[0]), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'11px', fontWeight:'700' }, a.level),
              D.h('div', { style: 'min-width:0' },
                D.h('div', { style: 'font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px', title: a.title }, a.title),
                D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:2px' },
                  a.host + ' · ' + U.dt(a.start) + ' · ' + (a.place || '未设置地点') + ' · 报名 ' + enrN + (a.maxNum ? '/' + a.maxNum : ''))
              ));
          }
        },
        { t: '类别', w: 88, render: function (a) { return KP.catTag(a.cat); } },
        { t: '分值', w: 108, render: function (a) { return D.h('span', { style: 'font-size:12px' }, '学分 ' + a.credit + ' · 学时 ' + a.hours); } },
        { t: '报名项目', w: 78, align: 'center', render: function (a) { return D.h('span', { style: 'font-weight:650' }, (a.items || []).length); } },
        { t: '签到方式', w: 152, render: function (a) { return D.h('div.tag-list', (a.signModes || []).map(function (m) { return D.h('span.tag.tag-info', m); })); } },
        { t: '状态', w: 84, align: 'center', render: function (a) { return KP.status(a.status); } },
        {
          t: '操作', w: 210, render: function (a) { return rowActs(a, host2.__refresh); }
        }
      ],
      footLeft: function (st, data) { return D.h('span.muted', '筛选结果 ' + data.length + ' 个活动'); }
    });

    /* 让行内操作能触发列表刷新 */
    var listerEl = host2.lastChild;
  }

  function rowActs(a, rerender) {
    var btns = [D.h('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); detailModal(a, rerender); } }, '详情')];
    if (a.status === '待审核') {
      btns.push(D.h('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); w.ZR.go('audit'); } }, '去审核'));
    } else if (a.status === '草稿') {
      btns.push(D.h('button.btn.btn-sm.btn-p', { onclick: function (e) { e.stopPropagation(); submitAudit(a, rerender); } }, '提交审核'));
    } else if (a.status === '已驳回') {
      btns.push(D.h('button.btn.btn-sm.btn-p', { onclick: function (e) { e.stopPropagation(); openEditor(a, 'edit'); } }, '修改重提'));
    } else if (publishedLike(a)) {
      btns.push(D.h('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); itemModal(a, rerender); } }, '报名项目'));
    }
    btns.push(D.h('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); moreMenu(a, e.currentTarget, rerender); } }, '更多 ▾'));
    return KP.acts(btns);
  }

  function moreMenu(a, anchor, rerender) {
    var old = D.q('.pop', anchor.parentNode);
    D.qa('.pop').forEach(function (p) { p.remove(); });
    if (old) return;
    var pop = D.h('div.pop', { style: 'right:0;left:auto;min-width:180px' });
    function item(label, fn, danger) {
      pop.appendChild(D.h('div.pop-i', {
        onclick: function (e) {
          e.stopPropagation(); pop.remove();
          fn();
        }
      }, D.h('span', { style: danger ? 'color:#b91c1c' : null }, label)));
    }
    item('编辑活动信息', function () { openEditor(a, a.status === '草稿' ? 'create' : 'edit'); });
    item('签到方式设置', function () { signModal(a, rerender); });
    item('作品与投票规则', function () { workModal(a, rerender); });
    item('展示样式（6 种）', function () { styleModal(a, rerender); });
    item('获奖证书模板', function () { certModal(a, rerender); });
    item('报名表单字段', function () { formFieldsModal(a); });
    pop.appendChild(D.h('div.hr'));
    if (a.status === '待开始' || a.status === '进行中') {
      item('投屏签到二维码', function () { SG.boardModal(a); });
    }
    if (a.status === '待审核') {
      item('撤回审核', function () {
        DB.update('activities', a.id, { status: '草稿' });
        UI.toast('已撤回审核', a.title, 'ok');
        if (rerender) rerender();
      });
    }
    if (publishedLike(a)) {
      item('下线（回到草稿）', function () {
        UI.confirm({
          title: '下线活动', text: '确认将「' + a.title + '」下线吗？下线后活动广场不再展示。', danger: true,
          onOk: function () {
            DB.update('activities', a.id, { status: '草稿' });
            UI.toast('已下线', a.title, 'ok');
            if (rerender) rerender();
          }
        });
      });
    }
    item('删除活动', function () {
      UI.confirm({
        title: '删除活动', danger: true, okText: '确认删除',
        text: '将删除「' + a.title + '」及其报名、签到记录，操作不可撤销。',
        detail: '关联数据：报名 ' + DB.count('enrollments', function (e) { return e.actId === a.id; }) + ' 条 · 签到 ' + DB.count('signins', function (x) { return x.actId === a.id; }) + ' 条',
        onOk: function () {
          DB.removeWhere('enrollments', function (e) { return e.actId === a.id; });
          DB.removeWhere('signins', function (x) { return x.actId === a.id; });
          DB.remove('activities', a.id);
          UI.toast('活动已删除', a.title, 'ok');
          if (rerender) rerender();
        }
      });
    }, true);
    anchor.parentNode.style.position = 'relative';
    anchor.parentNode.appendChild(pop);
  }

  /* ---------------- 提交审核 ---------------- */
  function submitAudit(a, rerender) {
    var need = a.needAudit !== false && a.flowTpl !== FLOWS[0];
    UI.confirm({
      title: need ? '提交活动审核' : '直接发布活动',
      text: need ? '确认按「' + a.flowTpl + '」提交审核吗？' : '该活动配置为无需审批，确认后直接发布到活动广场。',
      detail: need ? '审核通过后活动状态变为「待开始」，并出现在活动广场。' : '发布后学生即可在活动广场看到并报名。',
      okText: need ? '提交审核' : '确认发布',
      onOk: function () {
        DB.update('activities', a.id, {
          status: need ? '待审核' : '待开始',
          infoChanges: (a.infoChanges || []).concat([{
            at: U.dt(new Date()), by: ZA.session.name, field: need ? '提交审核' : '活动发布',
            from: a.status, to: need ? '待审核' : '待开始', notify: true, notified: 0
          }])
        });
        DB.insert('logs', {
          at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
          action: need ? '提交活动审核' : '发布活动', module: '活动管理', target: a.id,
          ip: '10.16.1.101', result: '成功', detail: a.title
        });
        UI.toast(need ? '已提交审核' : '已发布', a.title + ' · ' + (need ? '等待审核' : '已进入活动广场'), 'ok');
        if (rerender) rerender();
      }
    });
  }

  /* ---------------- 活动详情（标签页） ---------------- */
  function detailModal(a, rerender, initTab) {
    var tabsDef = [
      { k: 'base', n: '基本信息' }, { k: 'items', n: '报名项目' }, { k: 'sign', n: '签到设置' },
      { k: 'work', n: '作品与投票' }, { k: 'show', n: '展示样式' }, { k: 'cert', n: '证书模板' }, { k: 'flow', n: '审核流程' }
    ];
    var cur = initTab || 'base';
    var tabHost = D.h('div');
    var bodyHost = D.h('div.mt12');
    var m = UI.modal({
      title: a.title, sub: a.host + ' · ' + a.cat + ' · ' + a.level, size: 'xwide',
      body: [D.h('div', { style: 'display:flex;gap:9px;align-items:center;margin-bottom:10px;flex-wrap:wrap' },
        KP.status(a.status), KP.catTag(a.cat), D.h('span.tag', a.form),
        D.h('span.muted', '报名 ' + DB.count('enrollments', function (e) { return e.actId === a.id; }) + ' 人 · 签到 ' + DB.count('signins', function (x) { return x.actId === a.id && x.status === '已签到'; }) + ' 人 · 浏览 ' + (a.viewCount || 0) + ' 次')),
        tabHost, bodyHost],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        D.h('button.btn.btn-sm', { onclick: function () { openEditor(a, 'edit'); } }, '编辑活动'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { itemModal(a, rerender); } }, '设置报名项目')
      ]
    });
    function paint() {
      D.fill(tabHost, UI.tabs({ items: tabsDef, cur: cur, onChange: function (k) { cur = k; paint(); } }));
      D.fill(bodyHost, null);
      if (cur === 'base') bodyHost.appendChild(basePane(a));
      if (cur === 'items') bodyHost.appendChild(itemsPane(a, function () { paint(); }, rerender));
      if (cur === 'sign') bodyHost.appendChild(signPane(a, function () { paint(); }));
      if (cur === 'work') bodyHost.appendChild(workPane(a, function () { paint(); }));
      if (cur === 'show') bodyHost.appendChild(showPane(a));
      if (cur === 'cert') bodyHost.appendChild(certPane(a, function () { paint(); }));
      if (cur === 'flow') bodyHost.appendChild(flowPane(a));
    }
    paint();
  }

  /* 直接打开「报名项目」页签（列表行操作与详情页脚共用） */
  function itemModal(a, rerender) { detailModal(a, rerender, 'items'); }

  function basePane(a) {
    return D.h('div',
      KP.kv([
        ['活动标题', a.title], ['活动类别', a.cat], ['活动级别', a.level],
        ['主办方', a.host + '（' + a.hostType + '）'],
        ['举办形式', a.form], ['活动地点', (a.place || '未设置') + (a.mapPin ? '（已地图选点）' : '（未选点）')],
        ['活动时间', U.dt(a.start) + ' — ' + U.dt(a.end)],
        ['报名时间', U.dt(a.enrollStart) + ' — ' + U.dt(a.enrollEnd)],
        ['认定分值', '学分 ' + a.credit + ' · 学时 ' + a.hours + ' · 积分 ' + a.points],
        ['人数上限', a.maxNum ? a.maxNum + ' 人' : '不限'],
        ['报名范围', (a.audiences || []).join('、') || '全体学生'],
        ['是否需要审批', a.needAudit === false ? '否' : '是（' + a.flowTpl + '）'],
        ['协同管理员', (a.admins || []).filter(function (x) { return x.role === '协同管理员'; }).map(function (x) { return x.name + '（' + x.perms.join('/') + '）'; }).join('；') || '未设置'],
        ['创建人 / 时间', a.createdBy + '　' + U.dt(a.createdAt)]
      ]),
      KP.h5('活动介绍（富媒体）'),
      D.h('div.pv-text', a.desc || '暂无介绍'),
      KP.h5('活动信息变更记录'),
      (a.infoChanges && a.infoChanges.length)
        ? UI.timeline(a.infoChanges.map(function (x) {
          return { time: U.dt(x.at), text: '<b>' + U.esc(x.field) + '</b>：' + U.esc(x.from) + ' → ' + U.esc(x.to), desc: '操作人 ' + x.by + ' · ' + (x.notify ? '已通知 ' + x.notified + ' 人' : '未通知') };
        }))
        : UI.empty('暂无变更记录', '编辑活动信息并勾选通知后会自动生成')
    );
  }

  function itemsPane(a, repaint, rerender) {
    var wrap = D.h('div');
    wrap.appendChild(D.h('div.btn-row', { style: 'margin-bottom:10px' },
      D.h('button.btn.btn-sm.btn-p', { onclick: function () { itemEdit(a, null, repaint, rerender); } }, '＋ 添加报名项目'),
      D.h('span.muted', { style: 'margin-left:auto' }, '一个活动可挂多个报名项目，各自独立设置报名时间、人数与表单')));
    wrap.appendChild(KP.lister({
      noCard: true, pageSize: 0,
      cols: [
        { t: '项目名称', render: function (r) { return KP.cell(r.name, '报名范围：' + (r.scope || []).join('、')); } },
        { t: '报名时间', w: 210, render: function (r) { return D.h('span', { style: 'font-size:12px' }, U.dt(r.enrollStart) + ' → ' + U.dt(r.enrollEnd)); } },
        { t: '人数', w: 100, align: 'center', render: function (r) { return D.h('span', null, r.enrolled + ' / ' + (r.limit || '不限')); } },
        { t: '报名表单', w: 96, align: 'center', render: function (r) { return r.needForm ? D.h('span.tag.tag-info', (r.formFields || []).length + ' 个字段') : D.h('span.muted', '系统默认'); } },
        { t: '现场报名', w: 76, align: 'center', render: function (r) { return r.onSite ? KP.status('是') : D.h('span.muted', '否'); } },
        { t: '取消规则', render: function (r) { return D.h('span.muted', { style: 'font-size:12px' }, r.cancelRule || '活动开始前 2 小时可取消'); } },
        {
          t: '操作', w: 118, render: function (r) {
            return KP.acts([
              D.h('button.btn.btn-sm', { onclick: function () { itemEdit(a, r, repaint, rerender); } }, '编辑'),
              D.h('button.btn.btn-sm', {
                onclick: function () {
                  UI.confirm({
                    title: '删除报名项目', danger: true, okText: '删除',
                    text: '确认删除报名项目「' + r.name + '」吗？该项目下的 ' +
                      DB.count('enrollments', function (e) { return e.actId === a.id && e.itemId === r.id; }) + ' 条报名记录也会一并删除。',
                    onOk: function () {
                      var arr = a.items.filter(function (x) { return x.id !== r.id; });
                      DB.update('activities', a.id, { items: arr });
                      DB.removeWhere('enrollments', function (e) { return e.actId === a.id && e.itemId === r.id; });
                      UI.toast('已删除报名项目', r.name, 'ok');
                      repaint(); if (rerender) rerender();
                    }
                  });
                }
              }, '删除')
            ]);
          }
        }
      ],
      rows: function () { return a.items || []; },
      empty: '尚未添加报名项目'
    }));
    return wrap;
  }

  /* 报名项目编辑器 */
  function itemEdit(a, item, repaint, rerender) {
    var isNew = !item;
    var d = item ? JSON.parse(JSON.stringify(item)) : {
      id: 'IT' + a.id.slice(-2) + '-' + ((a.items || []).length + 1),
      name: '统一报名', enrollStart: a.enrollStart, enrollEnd: a.enrollEnd,
      limit: 0, needForm: false, formFields: ['姓名', '学号'], scope: ['全体学生'],
      cancelRule: '报名截止前 2 小时可取消；逾期需联系活动组织者', onSite: false, enrolled: 0
    };
    var fields = DB.col('formFields');
    var chosen = (d.formFields || []).slice();
    var body = D.h('div.frm.c2');
    body.appendChild(UI.field({ label: '项目名称', required: true, control: UI.input({ value: d.name, onInput: function (e) { d.name = e.target.value; } }) }));
    body.appendChild(UI.field({ label: '人数限制', hint: '0 表示不限人数', control: UI.input({ type: 'number', value: d.limit, onInput: function (e) { d.limit = U.int(e.target.value); } }) }));
    body.appendChild(UI.field({ label: '报名开始时间', control: UI.input({ value: d.enrollStart, placeholder: 'YYYY-MM-DD HH:mm', onInput: function (e) { d.enrollStart = e.target.value; } }) }));
    body.appendChild(UI.field({ label: '报名截止时间', control: UI.input({ value: d.enrollEnd, placeholder: 'YYYY-MM-DD HH:mm', onInput: function (e) { d.enrollEnd = e.target.value; } }) }));
    body.appendChild(UI.field({
      label: '报名范围（多选）', span: 2,
      control: UI.chips({
        multi: true, value: d.scope,
        options: ['全体学生', '本学院学生', '2024级', '2025级', '2026级', '社团成员'],
        onChange: function (v) { d.scope = v; }
      })
    }));
    body.appendChild(UI.field({
      label: '是否需要填写报名表单', span: 2,
      control: UI.swRow({
        title: '启用报名表单', desc: '关闭时使用系统默认字段（姓名、学号、学院、班级、联系方式）',
        checked: d.needForm, onChange: function (v) { d.needForm = v; paintFld(); }
      })
    }));
    var fldHost = D.h('div.span2');
    function paintFld() {
      D.fill(fldHost, null);
      if (!d.needForm) return;
      fldHost.appendChild(UI.field({
        label: '报名表单字段（勾选后学生报名时需填写）',
        control: UI.chips({
          multi: true, value: chosen,
          options: fields.filter(function (x) { return x.enabled; }).map(function (x) { return x.name; }),
          onChange: function (v) { chosen = v; }
        }),
        hint: '字段来源为「活动规则设置 · 字段管理」，可拖拽排序与增删'
      }));
    }
    paintFld();
    body.appendChild(fldHost);
    body.appendChild(UI.field({ label: '取消报名规则', span: 2, control: UI.input({ value: d.cancelRule, onInput: function (e) { d.cancelRule = e.target.value; } }) }));
    body.appendChild(UI.field({
      label: '现场报名', span: 2,
      control: UI.swRow({ title: '允许现场报名', desc: '开启后活动当天学生可在现场直接报名并签到', checked: d.onSite, onChange: function (v) { d.onSite = v; } })
    }));

    var m = UI.modal({
      title: isNew ? '添加报名项目' : '编辑报名项目', sub: a.title, size: 'wide',
      body: body,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            if (!d.name) { UI.toast('项目名称不能为空', '', 'warn'); return; }
            if (d.needForm) d.formFields = chosen.slice();
            var arr = (a.items || []).slice();
            if (isNew) arr.push(d);
            else {
              for (var i = 0; i < arr.length; i++) if (arr[i].id === item.id) arr[i] = d;
            }
            DB.update('activities', a.id, { items: arr });
            UI.toast(isNew ? '已添加报名项目' : '已保存报名项目', d.name, 'ok');
            m.close();
            repaint(); if (rerender) rerender();
          }
        }, '保存')
      ]
    });
  }

  /* ---------------- 签到设置 ---------------- */
  function signPane(a, repaint) {
    var modes = (a.signModes || []).slice();
    var wrap = D.h('div');
    wrap.appendChild(KP.note('三类签到方式可组合启用；组合启用时学生须全部通过才算签到成功。扫码签到二维码按设定间隔自动刷新，可投屏到大屏。'));
    wrap.appendChild(D.h('div.mt12', UI.chips({
      multi: true, value: modes, options: ['时间限制签到', '位置签到', '扫码签到'],
      onChange: function (v) {
        DB.update('activities', a.id, { signModes: v });
        UI.toast('签到方式已更新', v.join(' + ') || '未启用任何方式', 'ok');
        repaint();
      }
    })));
    wrap.appendChild(D.h('div.mt12', D.h('div.g2', [
      UI.field({
        label: '二维码刷新间隔（秒）',
        control: UI.select({
          options: [[30, '30 秒'], [60, '60 秒'], [90, '90 秒'], [120, '2 分钟'], [300, '5 分钟']],
          value: a.signRefresh || 60,
          onChange: function (v) { DB.update('activities', a.id, { signRefresh: U.int(v) }); UI.toast('刷新间隔已更新', v + ' 秒', 'ok'); repaint(); }
        }),
        hint: '与「扫码签到」配合使用；刷新后旧二维码立即失效'
      }),
      UI.field({
        label: '允许补签',
        control: UI.swRow({
          title: '允许组织者事后补签', desc: '开启后组织者可在签到记录中为缺勤学生标记补签',
          checked: !!a.allowMakeup, onChange: function (v) { DB.update('activities', a.id, { allowMakeup: v }); }
        })
      })
    ])));
    if (modes.indexOf('位置签到') >= 0) {
      var ap = SG.actPoint(a);
      wrap.appendChild(KP.h5('位置签到范围'));
      wrap.appendChild(D.h('div', { style: 'display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start' },
        mapPicker(a, function () { repaint(); }),
        D.h('div', { style: 'flex:1;min-width:220px' },
          KP.kv([
            ['活动地点', a.place || '未设置'],
            ['已选点位', ap.name + '（' + ap.x + ', ' + ap.y + '）'],
            ['允许偏差半径', SG.RADIUS + ' 米'],
            ['未在校内点位内', '判定为「定位不在活动地点范围内」']
          ]),
          D.h('div.mt8', D.h('button.btn.btn-sm', {
            onclick: function () {
              DB.update('activities', a.id, { allowFar: !a.allowFar });
              UI.toast('已切换', a.allowFar ? '关闭异地签到' : '开启异地签到（校外活动可用）', 'ok');
              repaint();
            }
          }, a.allowFar ? '关闭异地签到' : '开启异地签到')))
      ));
    }
    wrap.appendChild(D.h('div.mt12', D.h('button.btn.btn-sm.btn-p', {
      onclick: function () { SG.boardModal(a); }
    }, '📺 打开签到二维码投屏')));
    return wrap;
  }
  function signModal(a, rerender) {
    var m = UI.modal({
      title: '签到方式设置', sub: a.title, size: 'wide',
      body: D.h('div', { id: 'signPaneHost' }),
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); if (rerender) rerender(); } }, '完成')]
    });
    function repaint() { D.fill(D.q('#signPaneHost', m.body), signPane(a, repaint)); }
    repaint();
  }

  /* 地图选点（可点击的网格） */
  function mapPicker(a, onChange) {
    var host = D.h('div.pv-map', { style: 'width:280px;flex:0 0 280px;cursor:crosshair' });
    function paint() {
      D.fill(host, null);
      var pin = a.mapPin && typeof a.mapPin === 'object' ? a.mapPin : SG.actPoint(a);
      host.appendChild(D.h('div.pin', { style: 'left:' + (pin.x / 4000 * 100) + '%;top:' + (pin.y / 4000 * 100) + '%' }, '📍'));
      host.appendChild(D.h('div', { style: 'position:absolute;left:9px;bottom:8px;font-size:11px;color:var(--text3);background:rgba(255,255,255,.85);padding:2px 7px;border-radius:6px' },
        '点击地图任意位置选点 · 当前 (' + pin.x + ', ' + pin.y + ')'));
    }
    host.addEventListener('click', function (e) {
      var r = host.getBoundingClientRect();
      var x = Math.round((e.clientX - r.left) / (r.width || 280) * 4000);
      var y = Math.round((e.clientY - r.top) / (r.height || 150) * 4000);
      x = U.clamp(x, 0, 4000); y = U.clamp(y, 0, 4000);
      DB.update('activities', a.id, { mapPin: { x: x, y: y } });
      paint();
      UI.toast('已选点', '坐标 (' + x + ', ' + y + ')', 'ok');
      if (onChange) onChange();
    });
    paint();
    return host;
  }

  /* ---------------- 作品与投票 ---------------- */
  function workPane(a, repaint) {
    var wr = a.workRule || { formats: ['jpg'], maxCount: 1, review: true, multiStage: false, expert: false };
    var vr = a.voteRule || { enabled: false, start: '', end: '', perDay: 1, rule: '' };
    var wrap = D.h('div');
    wrap.appendChild(UI.swRow({
      title: '需要提交作品', desc: '开启后学生报名后需在截止时间前提交作品，组织者可在「活动管理 · 作品管理」中审核',
      checked: !!a.needWork, onChange: function (v) { DB.update('activities', a.id, { needWork: v }); repaint(); }
    }));
    if (!a.needWork) return wrap;
    wrap.appendChild(D.h('div.mt12', D.h('div.g2',
      UI.field({
        label: '允许的作品格式', control: UI.chips({
          multi: true, value: wr.formats || [], options: ['jpg', 'png', 'gif', 'mp4', 'pdf', 'docx', 'zip'],
          onChange: function (v) { wr.formats = v; DB.update('activities', a.id, { workRule: wr }); }
        })
      }),
      UI.field({
        label: '最多提交份数', control: UI.input({
          type: 'number', value: wr.maxCount, onInput: function (e) { wr.maxCount = U.int(e.target.value); DB.touch('activities', a); }
        })
      })
    )));
    wrap.appendChild(D.h('div.mt8', D.h('div.g2',
      UI.swRow({ title: '作品需要审核', desc: '开启后学生作品需审核通过才能参与评审', checked: !!wr.review, onChange: function (v) { wr.review = v; DB.update('activities', a.id, { workRule: wr }); } }),
      UI.swRow({ title: '专家评分', desc: '开启后支持专家打分环节', checked: !!wr.expert, onChange: function (v) { wr.expert = v; DB.update('activities', a.id, { workRule: wr }); } })
    )));
    wrap.appendChild(D.h('div.mt8', UI.swRow({
      title: '多环节评审', desc: '开启后支持初评 / 复评 / 终评多环节逐级评审',
      checked: !!wr.multiStage, onChange: function (v) { wr.multiStage = v; DB.update('activities', a.id, { workRule: wr }); repaint(); }
    })));
    if (wr.multiStage) {
      wrap.appendChild(D.h('div.mt8', KP.note('已启用多环节评审：初评（组织者）→ 复评（专家）→ 终评（校团委），每环节独立打分并留痕。')));
    }
    wrap.appendChild(KP.h5('投票规则'));
    wrap.appendChild(UI.swRow({
      title: '启用作品投票', desc: '开启后学生可对通过审核的作品投票',
      checked: !!vr.enabled, onChange: function (v) { vr.enabled = v; DB.update('activities', a.id, { voteRule: vr }); repaint(); }
    }));
    if (vr.enabled) {
      wrap.appendChild(D.h('div.mt8', D.h('div.g2',
        UI.field({ label: '投票开始', control: UI.input({ value: vr.start, placeholder: 'YYYY-MM-DD HH:mm', onInput: function (e) { vr.start = e.target.value; DB.touch('activities', a); } }) }),
        UI.field({ label: '投票结束', control: UI.input({ value: vr.end, placeholder: 'YYYY-MM-DD HH:mm', onInput: function (e) { vr.end = e.target.value; DB.touch('activities', a); } }) })
      )));
      wrap.appendChild(D.h('div.mt8', D.h('div.g2',
        UI.field({ label: '每人每日票数', control: UI.input({ type: 'number', value: vr.perDay, onInput: function (e) { vr.perDay = U.int(e.target.value); DB.touch('activities', a); } }) }),
        UI.field({ label: '投票规则说明', control: UI.input({ value: vr.rule, onInput: function (e) { vr.rule = e.target.value; DB.touch('activities', a); } }) })
      )));
    }
    wrap.appendChild(KP.h5('奖项设置'));
    var awards = (a.awards || []).slice();
    var aHost = D.h('div');
    function paintAwards() {
      D.fill(aHost, null);
      aHost.appendChild(D.h('div.btn-row', { style: 'margin-bottom:8px' },
        awards.map(function (x, i) {
          return D.h('span.tag.tag-info', { style: 'cursor:pointer' }, x + '　✕', {
            onclick: null
          });
        }),
        D.h('button.btn.btn-sm', {
          onclick: function () {
            var inp = UI.input({ placeholder: '如：一等奖 1 名' });
            var mm = UI.modal({
              title: '添加奖项', size: 'slim',
              body: UI.field({ label: '奖项名称与数量', control: inp }),
              foot: [D.h('button.btn.btn-sm', { onclick: function () { mm.close(); } }, '取消'),
              D.h('button.btn.btn-sm.btn-p', {
                onclick: function () {
                  if (!inp.value) return;
                  awards.push(inp.value);
                  DB.update('activities', a.id, { awards: awards });
                  mm.close(); paintAwards();
                }
              }, '添加')]
            });
          }
        }, '＋ 添加奖项')
      ));
      if (!awards.length) aHost.appendChild(UI.empty('未设置奖项', '可添加一等奖、二等奖等'));
    }
    paintAwards();
    wrap.appendChild(aHost);
    wrap.appendChild(D.h('div.mt12', KP.note('获奖证书在「证书模板」中配置，作品评审结束后可批量发放证书（当前活动已发放 ' + (a.certCount || 0) + ' 份）。')));
    return wrap;
  }
  function workModal(a, rerender) {
    var m = UI.modal({
      title: '作品征集与投票规则', sub: a.title, size: 'wide',
      body: D.h('div', { id: 'workHost' }),
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); if (rerender) rerender(); } }, '完成')]
    });
    function repaint() { D.fill(D.q('#workHost', m.body), workPane(a, repaint)); }
    repaint();
  }

  /* ---------------- 展示样式 ---------------- */
  function showPane(a) {
    var cur = a.showTpl || '样式1';
    var wrap = D.h('div');
    var mode = { dev: 'pc' };
    var host = D.h('div.mt12');
    var segHost = D.h('div');
    function paint() {
      D.fill(segHost, D.h('div', { style: 'display:flex;gap:10px;align-items:center;flex-wrap:wrap' },
        UI.seg({ options: SHOW_STYLES.map(function (s) { return [s.k, s.n]; }), value: cur, onChange: function (v) { cur = v; DB.update('activities', a.id, { showTpl: v }); UI.toast('展示样式已切换', v, 'ok'); paint(); } }),
        D.h('div', { style: 'margin-left:auto' }, UI.seg({ options: [['pc', 'PC 端预览'], ['mob', '移动端预览']], value: mode.dev, onChange: function (v) { mode.dev = v; paint(); } }))
      ));
      D.fill(host, null);
      host.appendChild(stylePreview(a, cur, mode.dev === 'mob'));
      var d = SHOW_STYLES.filter(function (s) { return s.k === cur; })[0];
      host.appendChild(D.h('div.req-note.mt12', { html: '<b>' + cur + '　' + d.n + '</b>　' + d.d + '　（学生端活动广场与该活动详情页同步使用此样式）' }));
    }
    wrap.appendChild(KP.note('活动展示样式共 6 种，可在学生端活动广场与该活动主页生效；切换后即时预览 PC / 移动端效果。'));
    wrap.appendChild(segHost);
    wrap.appendChild(host);
    paint();
    return wrap;
  }

  /** 按样式渲染活动卡片（PC / 移动端） */
  function stylePreview(a, style, mobile) {
    var box = D.h('div', {
      style: mobile
        ? 'width:320px;margin:0 auto;border:9px solid #0f172a;border-radius:22px;padding:9px;background:#fff'
        : 'border:1px solid var(--line);border-radius:12px;padding:13px;background:#fbfdff'
    });
    if (mobile) box.appendChild(D.h('div', { style: 'text-align:center;font-size:11px;color:var(--text3);padding:3px 0 7px' }, '移动端预览 · 学生端活动广场'));
    var grace = a.catGrad || COVERS[0];
    var enrN = DB.count('enrollments', function (e) { return e.actId === a.id; });
    var card = D.h('div', { style: 'background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden' });

    if (style === '样式1') {
      card.appendChild(D.h('div', { style: 'height:104px;background:' + grace + ';display:flex;align-items:flex-end;padding:11px;color:#fff' },
        D.h('div', D.h('div', { style: 'font-size:15px;font-weight:700' }, a.title),
          D.h('div', { style: 'font-size:11.5px;opacity:.9;margin-top:3px' }, a.cat + ' · ' + a.level))));
      card.appendChild(D.h('div', { style: 'padding:11px' },
        D.h('div', { style: 'font-size:12.5px;color:var(--text2);line-height:1.8' }, '🕒 ' + U.dt(a.start)),
        D.h('div', { style: 'font-size:12.5px;color:var(--text2);line-height:1.8' }, '📍 ' + (a.place || '待定')),
        D.h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:9px' },
          D.h('span.tag.tag-info', '学分 ' + a.credit), D.h('span.muted', enrN + ' 人已报名'))));
    } else if (style === '样式2') {
      card.appendChild(D.h('div', { style: 'padding:12px' },
        D.h('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start;gap:9px' },
          D.h('div', D.h('div', { style: 'font-size:14.5px;font-weight:700' }, a.title),
            D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:3px' }, a.host)),
          KP.catTag(a.cat)),
        D.h('div.g3.mt8', [
          infoCell('时间', U.dt(a.start)), infoCell('地点', a.place || '待定'), infoCell('学分', a.credit + ' 学分')
        ])));
    } else if (style === '样式3') {
      card.appendChild(D.h('div', { style: 'background:' + grace + ';padding:19px 14px;color:#fff;text-align:center' },
        D.h('div', { style: 'font-size:16px;font-weight:750' }, a.title),
        D.h('div', { style: 'font-size:11.5px;opacity:.92;margin-top:5px' }, U.dt(a.start) + ' · ' + (a.place || '待定'))));
      card.appendChild(D.h('div', { style: 'padding:12px' },
        UI.pgRow(a.maxNum ? U.clamp(enrN / a.maxNum * 100, 0, 100) : 60, '报名进度 ' + enrN + (a.maxNum ? '/' + a.maxNum : '')),
        D.h('div', { style: 'display:flex;gap:8px;margin-top:9px' }, D.h('span.tag.tag-info', a.cat), D.h('span.tag', a.level), D.h('span.tag.tag-ok', '学分 ' + a.credit))));
    } else if (style === '样式4') {
      card.appendChild(D.h('div', { style: 'display:flex;gap:11px;padding:11px' },
        D.h('div', { style: 'width:86px;height:64px;border-radius:9px;flex:0 0 86px;background:' + grace }),
        D.h('div', { style: 'flex:1;min-width:0' },
          D.h('div', { style: 'font-size:13.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, a.title),
          D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:4px;line-height:1.7' },
            U.dt(a.start) + D.h('br'), (a.place || '待定') + ' · ' + enrN + ' 人报名'))));
    } else if (style === '样式5') {
      card.appendChild(D.h('div', { style: 'padding:12px' },
        D.h('div', { style: 'display:flex;gap:11px' },
          D.h('div', { style: 'flex:0 0 52px;text-align:center;border-right:2px solid var(--primary);padding-right:9px' },
            D.h('div', { style: 'font-size:17px;font-weight:760;color:var(--primary)' }, String(a.start || '').slice(5, 10)),
            D.h('div', { style: 'font-size:11px;color:var(--text3)' }, String(a.start || '').slice(0, 4) + ' 年')),
          D.h('div', { style: 'flex:1' },
            D.h('div', { style: 'font-size:13.5px;font-weight:650' }, a.title),
            D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:4px' }, a.cat + ' · ' + (a.place || '待定'))))));
    } else {
      card.appendChild(D.h('div', { style: 'padding:12px' },
        D.h('div', { style: 'display:flex;justify-content:space-between;align-items:center' },
          D.h('div', { style: 'font-size:13.5px;font-weight:650' }, a.title),
          D.h('span.tag.tag-err', '🔥 热度 ' + (U.num(a.viewCount) + enrN * 3))),
        D.h('div', { style: 'display:flex;gap:8px;margin-top:9px;flex-wrap:wrap' },
          D.h('span.tag.tag-info', a.cat), D.h('span.tag', a.level),
          D.h('span.tag.tag-ok', enrN + ' 人报名'), D.h('span.muted', U.dt(a.start)))));
    }
    box.appendChild(card);
    return box;
  }
  function infoCell(k, v) {
    return D.h('div', { style: 'border:1px solid var(--line);border-radius:8px;padding:7px 9px;text-align:center' },
      D.h('div', { style: 'font-size:11px;color:var(--text3)' }, k),
      D.h('div', { style: 'font-size:12.5px;font-weight:600;margin-top:2px' }, v));
  }
  function styleModal(a, rerender) {
    var m = UI.modal({
      title: '活动展示样式', sub: a.title, size: 'xwide',
      body: D.h('div', { id: 'styleHost' }),
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); if (rerender) rerender(); } }, '完成')]
    });
    D.fill(D.q('#styleHost', m.body), showPane(a));
  }

  /* ---------------- 证书模板（≥50 种） ---------------- */
  function certPane(a, repaint) {
    var cur = a.certTpl || 'CERT-01';
    var all = certTemplates();
    var kw = '';
    var wrap = D.h('div');
    var gridHost = D.h('div');
    wrap.appendChild(KP.note('证书模板库共 ' + all.length + ' 套（12 种配色 × 5 种版式）；选择后活动评奖结束即可按此模板批量生成证书。'));
    wrap.appendChild(D.h('div.mt12', UI.filterBar([
      { type: 'input', ph: '搜索模板名称', width: 220, onChange: function (e) { kw = e.target.value; paint(); } }
    ], {
      right: D.h('span.muted', '当前使用：' + (all.filter(function (t) { return t.id === cur; })[0] || {}).name)
    })));
    wrap.appendChild(gridHost);
    function paint() {
      var list = all.filter(function (t) { return !kw || t.name.indexOf(kw) >= 0; });
      D.fill(gridHost, null);
      if (!list.length) { gridHost.appendChild(UI.empty('没有匹配的证书模板')); return; }
      gridHost.appendChild(D.h('div.g4', list.map(function (t) {
        var on = t.id === cur;
        return D.h('div', {
          style: 'border:1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)') + ';border-radius:10px;padding:9px;cursor:pointer;background:' + (on ? 'var(--primary-l)' : '#fff'),
          onclick: function () { cur = t.id; DB.update('activities', a.id, { certTpl: t.id }); UI.toast('已选用证书模板', t.name, 'ok'); repaint(); }
        }, certThumb(t), D.h('div', { style: 'font-size:11.5px;margin-top:6px;display:flex;justify-content:space-between' },
          D.h('span', t.name), on ? D.h('span.tag.tag-ok', '使用中') : D.h('span.muted', t.id)));
      })));
    }
    paint();
    wrap.appendChild(KP.h5('自定义证书内容'));
    var custom = a.certCustom || { title: '第二课堂活动获奖证书', body: '同学在活动中表现优异，特发此证，以资鼓励。', issuer: DB.data.meta.school + '　第二课堂管理中心', date: U.d(DB.data.meta.now) };
    wrap.appendChild(D.h('div.g2',
      UI.field({ label: '证书标题', control: UI.input({ value: custom.title, onInput: function (e) { custom.title = e.target.value; DB.update('activities', a.id, { certCustom: custom }); repaint(); } }) }),
      UI.field({ label: '落款单位', control: UI.input({ value: custom.issuer, onInput: function (e) { custom.issuer = e.target.value; DB.update('activities', a.id, { certCustom: custom }); } }) })
    ));
    wrap.appendChild(UI.field({ label: '证书正文', control: UI.textarea({ value: custom.body, rows: 2, onInput: function (e) { custom.body = e.target.value; DB.touch('activities', a); } }) }));
    return wrap;
  }
  function certThumb(t) {
    var p = t.pal;
    return D.h('div', {
      style: 'height:74px;border-radius:7px;background:' + p.bg + ';border:2px solid ' + p.c1 + ';display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px;text-align:center'
    },
      D.h('div', { style: 'font-size:10.5px;font-weight:750;color:' + p.c1 + ';letter-spacing:1px' }, '获奖证书'),
      D.h('div', { style: 'font-size:8px;color:' + p.c1 + ';opacity:.8;margin-top:3px;line-height:1.4' }, t.lay),
      D.h('div', { style: 'width:24px;height:24px;border-radius:50%;border:1.5px solid ' + p.c1 + ';margin-top:4px;opacity:.7' }));
  }
  function certModal(a, rerender) {
    var m = UI.modal({
      title: '获奖证书模板', sub: a.title, size: 'xwide',
      body: D.h('div', { id: 'certHost' }),
      foot: [
        D.h('button.btn.btn-sm', {
          onclick: function () {
            var t = certTemplates().filter(function (x) { return x.id === (a.certTpl || 'CERT-01'); })[0];
            var cc = a.certCustom || {};
            UI.printHTML('证书模板预览', '<div style="text-align:center;border:6px double ' + t.pal.c1 + ';padding:40px;background:' + t.pal.bg + '">' +
              '<div style="font-size:24px;font-weight:800;color:' + t.pal.c1 + ';letter-spacing:6px">' + U.esc(cc.title || '第二课堂活动获奖证书') + '</div>' +
              '<div style="margin:26px 0;font-size:14px;line-height:2.2">' + U.esc(cc.body || '') + '</div>' +
              '<div style="text-align:right;margin-top:30px;font-size:13px">' + U.esc(cc.issuer || '') + '<br>' + U.esc(cc.date || '') + '</div></div>');
          }
        }, '🖨 预览 / 打印证书'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); if (rerender) rerender(); } }, '完成')
      ]
    });
    D.fill(D.q('#certHost', m.body), certPane(a, function () { D.fill(D.q('#certHost', m.body), certPane(a, arguments.callee)); }));
    D.fill(D.q('#certHost', m.body), certPane(a, function () { }));
  }

  /* ---------------- 审核流程 ---------------- */
  function flowPane(a) {
    var nodes = [
      { n: '发起申请', r: '活动组织者', d: '填写活动信息与报名项目' },
      { n: '学院初审', r: '二级学院管理员', d: '审核活动内容、分值设置与场地' },
      { n: '校团委终审', r: '校团委管理员', d: '审核活动级别、学分标准与安全要求' },
      { n: '发布到活动广场', r: '系统', d: '自动上架并通知目标学生' }
    ];
    var idx = FLOWS.indexOf(a.flowTpl);
    if (idx <= 0) nodes = [{ n: '创建即发布', r: '系统', d: '该活动配置为无需审批，保存后直接发布' }];
    else if (idx === 1) nodes = [nodes[0], nodes[2], nodes[3]];
    else if (idx === 3) nodes = nodes;
    else if (idx === 4) nodes = [{ n: '学生发起申报', r: '学生', d: '提交活动方案与预算' }].concat(nodes.slice(1));
    var wrap = D.h('div');
    wrap.appendChild(UI.field({
      label: '当前审批流程模板',
      control: UI.select({
        options: FLOWS, value: a.flowTpl,
        onChange: function (v) {
          DB.update('activities', a.id, { flowTpl: v, needAudit: v !== FLOWS[0] });
          UI.toast('审批流程已更新', v, 'ok');
          w.ZR.render();
        }
      }),
      hint: '可按角色配置是否需要审批及对应审批流程；学生发起活动走「活动申报」流程'
    }));
    wrap.appendChild(KP.h5('审批节点'));
    wrap.appendChild(UI.steps({ items: nodes.map(function (x) { return x.n; }), cur: 0 }));
    wrap.appendChild(D.h('div.mt12', KP.lister({
      noCard: true, pageSize: 0,
      cols: [
        { t: '节点', w: 130, render: function (r) { return D.h('b', r.n); } },
        { t: '处理角色', w: 150, render: function (r) { return r.r; } },
        { t: '节点说明', render: function (r) { return D.h('span.muted', r.d); } },
        { t: '是否留痕', w: 88, align: 'center', render: function () { return KP.status('是'); } }
      ],
      rows: function () { return nodes; }
    })));
    wrap.appendChild(KP.h5('审核意见留痕'));
    var recs = (a.auditLog || []);
    wrap.appendChild(recs.length ? UI.timeline(recs.map(function (x) {
      return { time: U.dt(x.at), text: '<b>' + U.esc(x.node) + '</b>　' + U.esc(x.action), desc: x.by + '（' + x.role + '）' + (x.note ? '：' + x.note : ''), tone: x.action === '退回修改' ? ' err' : '' };
    })) : UI.empty('暂无审核记录', '提交审核后在此查看逐级审核意见'));
    return wrap;
  }

  function flowConfigModal() {
    var body = D.h('div');
    body.appendChild(KP.note('审批流程模板供活动创建时选择；<b>活动申报</b>流程用于学生/教师自行发起活动，需经学院初审与校团委终审。'));
    body.appendChild(D.h('div.mt12', KP.lister({
      noCard: true, pageSize: 0,
      cols: [
        { t: '流程模板', render: function (r) { return KP.cell(r.n, r.d); } },
        { t: '节点数', w: 76, align: 'center', render: function (r) { return r.c; } },
        { t: '适用角色', w: 178, render: function (r) { return r.who; } },
        {
          t: '状态', w: 88, align: 'center', render: function (r) { return KP.status(r.on ? '启用' : '已停用'); }
        }
      ],
      rows: function () {
        return [
          { n: '无需审批（创建即发布）', d: '适用于班级、社团内部小型活动', c: 1, who: '活动组织者', on: true },
          { n: '一级审核（校团委）', d: '校级活动快速审批', c: 2, who: '校团委管理员', on: true },
          { n: '二级审核（学院初审 + 校团委终审）', d: '院级活动标准流程', c: 3, who: '二级学院管理员 → 校团委', on: true },
          { n: '校级活动三级审核', d: '大型活动含安全与场地审核', c: 4, who: '学院 → 校团委 → 分管校领导', on: true },
          { n: '活动申报（学生发起 → 学院初审 → 校团委终审）', d: '学生/教师自主申报活动', c: 3, who: '学生 → 二级学院 → 校团委', on: true }
        ];
      }
    })));
    UI.modal({ title: '活动审核流程配置', size: 'xwide', body: body, foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { UI.closeAllModals(); } }, '关闭')] });
  }

  /* ---------------- 报名表单字段管理 ---------------- */
  function formFieldsModal(a) {
    var fields = DB.col('formFields');
    var body = D.h('div');
    body.appendChild(KP.note('字段支持拖拽排序与增删改；来源于「活动规则设置 · 字段管理」，此处可针对本活动调整启用范围。'));
    body.appendChild(D.h('div.mt12', KP.lister({
      noCard: true, pageSize: 0,
      cols: [
        { t: '字段名称', render: function (r) { return KP.cell(r.name, 'key: ' + r.key); } },
        { t: '所属模块', w: 100, render: function (r) { return D.h('span.tag.tag-info', r.module); } },
        { t: '控件类型', w: 100, render: function (r) { return r.type; } },
        { t: '必填', w: 68, align: 'center', render: function (r) { return r.required ? KP.status('是') : D.h('span.muted', '否'); } },
        { t: '来源', w: 88, align: 'center', render: function (r) { return r.fromSystem ? D.h('span.tag', '系统') : D.h('span.tag.tag-warn', '自定义'); } },
        {
          t: '启用', w: 76, align: 'center', render: function (r) {
            return D.h('label.sw', D.h('input', {
              type: 'checkbox', checked: !!r.enabled,
              onchange: function (e) { DB.update('formFields', r.id, { enabled: e.target.checked }); UI.toast('字段状态已更新', r.name, 'ok'); }
            }), D.h('span.sl'));
          }
        }
      ],
      rows: function () { return fields; }
    })));
    UI.modal({ title: '报名表单字段管理', sub: a.title, size: 'wide', body: body, foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { UI.closeAllModals(); } }, '关闭')] });
  }

  /* ---------------- 创建 / 编辑 / 申报 ---------------- */
  function openEditor(act, mode) {
    var isNew = !act;
    var d = isNew ? {
      id: '', title: '', cat: (DB.data.cats[0] || {}).name, level: '院级', host: ZA.session.college || '校团委',
      hostType: '学校', form: FORMS[0], place: '', mapPin: null,
      start: DB.data.meta.now.slice(0, 10) + ' 14:00', end: DB.data.meta.now.slice(0, 10) + ' 17:00',
      enrollStart: DB.data.meta.now.slice(0, 10) + ' 00:00', enrollEnd: DB.data.meta.now.slice(0, 10) + ' 12:00',
      credit: 0.5, hours: 8, points: 5, maxNum: 60, desc: '',
      items: [], signModes: ['扫码签到'], signRefresh: 60, needWork: false,
      voteRule: { enabled: false, start: '', end: '', perDay: 1, rule: '实名投票，每人每日 1 票' },
      workRule: { formats: ['jpg', 'png'], maxCount: 1, review: true, multiStage: false, expert: false },
      awards: [], showTpl: '样式1', certTpl: 'CERT-01', flowTpl: mode === 'apply' ? FLOWS[4] : FLOWS[1],
      needAudit: true, audiences: ['全体学生'], status: '草稿', viewCount: 0,
      catGrad: COVERS[0], catColor: '#2563eb', catLight: '#eff6ff', collegeId: ZA.session.collegeId || '',
      ownerCollege: ZA.session.collegeId || '', createdBy: ZA.session.name, createdAt: U.dt(new Date()),
      files: [], infoChanges: [], admins: [], auditLog: []
    } : JSON.parse(JSON.stringify(act));

    var steps = ['基本信息', '报名项目', '签到设置', '作品与投票', '展示与证书'];
    var cur = 0;
    var host = D.h('div');
    var stepHost = D.h('div');
    var bodyHost = D.h('div.mt12');
    var m = UI.modal({
      title: (isNew ? (mode === 'apply' ? '活动申报' : '后台创建活动') : '编辑活动'),
      sub: isNew ? (mode === 'apply' ? '提交后进入学院初审 → 校团委终审' : '保存后可提交审核或直接发布') : act.title,
      size: 'xwide',
      body: [stepHost, bodyHost],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm', { onclick: function () { save('草稿'); } }, '保存草稿'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { save('submit'); } }, mode === 'apply' && isNew ? '提交申报' : '保存并提交审核')
      ]
    });
    function paint() {
      D.fill(stepHost, UI.steps({ items: steps, cur: cur }));
      D.fill(bodyHost, null);
      bodyHost.appendChild([stepBase, stepItems, stepSign, stepWork, stepShow][cur](d));
      bodyHost.appendChild(D.h('div.btn-row.mt16', [
        D.h('button.btn.btn-sm', { disabled: cur === 0, onclick: function () { cur--; paint(); } }, '‹ 上一步'),
        D.h('button.btn.btn-sm' + (cur < steps.length - 1 ? '.btn-p' : ''), { disabled: cur >= steps.length - 1, onclick: function () { cur++; paint(); } }, '下一步 ›'),
        cur < steps.length - 1 ? D.h('span.muted', { style: 'margin-left:auto' }, '第 ' + (cur + 1) + ' / ' + steps.length + ' 步') : null
      ]));
    }
    function save(mode2) {
      if (!d.title) { UI.toast('请填写活动标题', '标题为必填项', 'warn'); cur = 0; paint(); return; }
      if (!(d.items || []).length) {
        /* 未配置报名项目时自动生成默认项目，避免出现无项目的活动 */
        d.items = [{
          id: 'IT' + (d.id ? d.id.slice(-2) : 'EX') + '-1', name: '统一报名',
          enrollStart: d.enrollStart, enrollEnd: d.enrollEnd, limit: d.maxNum || 0,
          needForm: false, formFields: ['姓名', '学号'], scope: d.audiences || ['全体学生'],
          cancelRule: '报名截止前 2 小时可取消；逾期需联系活动组织者', onSite: false, enrolled: 0
        }];
      }
      d.status = mode2 === 'submit' ? (d.flowTpl === FLOWS[0] ? '待开始' : '待审核') : '草稿';
      d.needAudit = d.flowTpl !== FLOWS[0];
      if (isNew) {
        d.id = '';
        var rec = DB.insert('activities', d, { top: true });
        DB.insert('logs', {
          at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
          action: mode === 'apply' ? '活动申报' : '创建活动', module: '活动管理', target: rec.id,
          ip: '10.16.1.101', result: '成功', detail: d.title
        });
        UI.toast(mode2 === 'submit' ? (d.needAudit ? '活动已提交审核' : '活动已发布') : '草稿已保存', d.title, 'ok');
      } else {
        DB.update('activities', act.id, d);
        DB.insert('logs', {
          at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
          action: '编辑活动', module: '活动管理', target: act.id, ip: '10.16.1.101', result: '成功', detail: d.title
        });
        UI.toast('活动已保存', d.title, 'ok');
      }
      m.close();
      w.ZR.render();
    }
    paint();
  }

  function stepBase(d) {
    var wrap = D.h('div.frm.c2');
    wrap.appendChild(UI.field({ label: '活动标题', required: true, span: 2, control: UI.input({ value: d.title, placeholder: '如：2026 年校园歌手大赛', onInput: function (e) { d.title = e.target.value; } }) }));
    wrap.appendChild(UI.field({
      label: '活动封面', span: 2,
      control: D.h('div', { style: 'display:flex;gap:9px;flex-wrap:wrap;align-items:center' },
        COVERS.map(function (g, i) {
          var on = d.catGrad === g;
          return D.h('div', {
            style: 'width:78px;height:50px;border-radius:9px;background:' + g + ';cursor:pointer;border:2.5px solid ' + (on ? 'var(--primary)' : 'transparent'),
            onclick: function () { d.catGrad = g; w.ZR.render(); UI.closeAllModals(); openEditorPatch(); }
          });
        }),
        D.h('span.muted', '点击选择预设封面（演示环境使用渐变色块替代图片，可替换为实际上传的封面图）'))
    }));
    wrap.appendChild(UI.field({ label: '活动分类', required: true, control: UI.select({ options: (DB.data.cats || []).map(function (c) { return [c.name, c.name]; }), value: d.cat, onChange: function (v) { d.cat = v; var c = DB.find('cats', function (x) { return x.name === v; }); if (c) { d.catColor = c.color; d.catLight = c.light; } } }) }));
    wrap.appendChild(UI.field({ label: '活动级别', control: UI.select({ options: [['校级', '校级'], ['院级', '院级']], value: d.level, onChange: function (v) { d.level = v; } }) }));
    wrap.appendChild(UI.field({ label: '主办方', required: true, control: UI.input({ value: d.host, onInput: function (e) { d.host = e.target.value; } }) }));
    wrap.appendChild(UI.field({ label: '举办形式', control: UI.select({ options: FORMS, value: d.form, onChange: function (v) { d.form = v; } }) }));
    wrap.appendChild(UI.field({ label: '活动地点', control: UI.input({ value: d.place, placeholder: '如：大学生活动中心 201', onInput: function (e) { d.place = e.target.value; } }) }));
    wrap.appendChild(UI.field({
      label: '地图选点', span: 2,
      control: D.h('div', { style: 'display:flex;gap:13px;flex-wrap:wrap;align-items:flex-start' },
        mapPicker({ id: d.id || 'NEW', mapPin: d.mapPin, place: d.place },
          function () { }),
        D.h('div', { style: 'flex:1;min-width:200px;font-size:12.5px;color:var(--text2);line-height:2' },
          '点击地图选择活动举办点位，用于位置签到范围判定。',
          D.h('br'), '当前位置签到判定半径：' + SG.RADIUS + ' 米'))
    }));
    wrap.appendChild(UI.field({ label: '活动开始时间', control: UI.input({ value: d.start, onInput: function (e) { d.start = e.target.value; } }) }));
    wrap.appendChild(UI.field({ label: '活动结束时间', control: UI.input({ value: d.end, onInput: function (e) { d.end = e.target.value; } }) }));
    wrap.appendChild(UI.field({ label: '报名开始时间', control: UI.input({ value: d.enrollStart, onInput: function (e) { d.enrollStart = e.target.value; } }) }));
    wrap.appendChild(UI.field({ label: '报名截止时间', control: UI.input({ value: d.enrollEnd, onInput: function (e) { d.enrollEnd = e.target.value; } }) }));
    wrap.appendChild(UI.field({ label: '认定学分', control: UI.input({ type: 'number', step: '0.5', value: d.credit, onInput: function (e) { d.credit = U.num(e.target.value); } }) }));
    wrap.appendChild(UI.field({ label: '认定学时', control: UI.input({ type: 'number', value: d.hours, onInput: function (e) { d.hours = U.int(e.target.value); } }) }));
    wrap.appendChild(UI.field({ label: '认定积分', control: UI.input({ type: 'number', value: d.points, onInput: function (e) { d.points = U.int(e.target.value); } }) }));
    wrap.appendChild(UI.field({ label: '人数上限', hint: '0 表示不限', control: UI.input({ type: 'number', value: d.maxNum, onInput: function (e) { d.maxNum = U.int(e.target.value); } }) }));
    wrap.appendChild(UI.field({
      label: '报名范围（多选）', span: 2,
      control: UI.chips({ multi: true, value: d.audiences, options: ['全体学生', '本学院学生', '2024级', '2025级', '2026级', '社团成员'], onChange: function (v) { d.audiences = v; } })
    }));
    wrap.appendChild(UI.field({
      label: '活动介绍（富媒体）', span: 2,
      control: richEditor(d.desc, function (html) { d.desc = html; }),
      hint: '支持加粗、斜体、项目符号、链接与图片占位；学生端活动主页按富文本渲染'
    }));
    return wrap;
  }
  function openEditorPatch() { /* 封面切换后就地重绘由 paint 处理，此处保持兼容 */ }

  /* 轻量富文本编辑器（contenteditable + 工具栏） */
  function richEditor(value, onChange) {
    var box = D.h('div', { style: 'border:1px solid var(--line);border-radius:10px;overflow:hidden' });
    var bar = D.h('div', { style: 'display:flex;gap:5px;padding:6px;border-bottom:1px solid var(--line);background:#f8fbff' });
    var area = D.h('div', {
      contenteditable: 'true',
      style: 'min-height:108px;padding:10px;font-size:13px;line-height:1.85;outline:none'
    });
    D.html(area, value || '');
    function emit() { if (onChange) onChange(area.innerHTML); }
    function wrapSel(open, close) {
      var sel = w.getSelection ? w.getSelection() : null;
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        var txt = sel.toString();
        area.innerHTML = area.innerHTML.replace(txt, open + txt + close);
      } else {
        area.innerHTML += open + '文本' + close;
      }
      emit();
    }
    [['B', '<b>', '</b>', '加粗'], ['I', '<i>', '</i>', '斜体'], ['•', '<ul><li>', '</li></ul>', '项目符号']].forEach(function (b) {
      bar.appendChild(D.h('button.btn.btn-sm', {
        type: 'button', title: b[3],
        onclick: function () { wrapSel(b[1], b[2]); }
      }, D.h('b', b[0])));
    });
    bar.appendChild(D.h('button.btn.btn-sm', {
      type: 'button',
      onclick: function () {
        var mm = UI.modal({
          title: '插入链接', size: 'slim',
          body: UI.field({ label: '链接地址', control: UI.input({ placeholder: 'https://' }) }),
          foot: [D.h('button.btn.btn-sm', { onclick: function () { mm.close(); } }, '取消')]
        });
      }
    }, '🔗'));
    bar.appendChild(D.h('button.btn.btn-sm', {
      type: 'button', title: '插入图片占位',
      onclick: function () { area.innerHTML += '<div style="height:64px;border-radius:8px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center;color:#1e40af;font-size:12px;margin:6px 0">活动图片占位</div>'; emit(); }
    }, '🖼'));
    bar.appendChild(D.h('span.muted', { style: 'margin-left:auto;display:flex;align-items:center' }, '演示环境不接入图床上传'));
    box.appendChild(bar);
    box.appendChild(area);
    area.addEventListener('input', emit);
    return box;
  }

  function stepItems(d) {
    var wrap = D.h('div');
    wrap.appendChild(KP.note('一个活动可添加多个报名项目，每个项目独立设置报名时间、人数限制、报名表单、报名范围、取消规则与是否允许现场报名。'));
    var host = D.h('div.mt12');
    function paint() {
      D.fill(host, null);
      host.appendChild(D.h('div.btn-row', { style: 'margin-bottom:10px' },
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            d.items.push({
              id: 'ITX-' + (d.items.length + 1), name: '报名项目 ' + (d.items.length + 1),
              enrollStart: d.enrollStart, enrollEnd: d.enrollEnd, limit: 0, needForm: false,
              formFields: ['姓名', '学号'], scope: d.audiences || ['全体学生'],
              cancelRule: '报名截止前 2 小时可取消', onSite: false, enrolled: 0
            });
            paint();
          }
        }, '＋ 添加报名项目')));
      host.appendChild(KP.lister({
        noCard: true, pageSize: 0,
        cols: [
          { t: '项目名称', render: function (r, i) { return UI.input({ value: r.name, onInput: function (e) { d.items[i].name = e.target.value; } }); } },
          { t: '人数限制', w: 92, render: function (r, i) { return UI.input({ type: 'number', value: r.limit, onInput: function (e) { d.items[i].limit = U.int(e.target.value); } }); } },
          { t: '报名范围', w: 150, render: function (r, i) { return UI.select({ options: ['全体学生', '本学院学生', '2024级', '2025级', '2026级', '社团成员'].map(function (x) { return [x, x]; }), value: (r.scope || [])[0], onChange: function (v) { d.items[i].scope = [v]; } }); } },
          { t: '需填表单', w: 82, align: 'center', render: function (r, i) { return D.h('label.sw', D.h('input', { type: 'checkbox', checked: !!r.needForm, onchange: function (e) { d.items[i].needForm = e.target.checked; } }), D.h('span.sl')); } },
          { t: '现场报名', w: 82, align: 'center', render: function (r, i) { return D.h('label.sw', D.h('input', { type: 'checkbox', checked: !!r.onSite, onchange: function (e) { d.items[i].onSite = e.target.checked; } }), D.h('span.sl')); } },
          { t: '取消规则', render: function (r, i) { return UI.input({ value: r.cancelRule, onInput: function (e) { d.items[i].cancelRule = e.target.value; } }); } },
          {
            t: '操作', w: 62, render: function (r, i) {
              return D.h('button.btn.btn-sm', { onclick: function () { d.items.splice(i, 1); paint(); } }, '删除');
            }
          }
        ],
        rows: function () { return d.items; },
        empty: '尚未添加报名项目（保存时会自动生成一个默认项目）'
      }));
    }
    paint();
    wrap.appendChild(host);
    return wrap;
  }

  function stepSign(d) {
    var wrap = D.h('div');
    wrap.appendChild(KP.note('签到方式可组合使用：组合启用时学生需全部通过才算签到成功。<b>扫码签到</b>二维码按设定间隔自动刷新，并支持投屏到会场大屏。'));
    wrap.appendChild(D.h('div.mt12', UI.chips({
      multi: true, value: d.signModes, options: ['时间限制签到', '位置签到', '扫码签到'],
      onChange: function (v) { d.signModes = v; }
    })));
    wrap.appendChild(D.h('div.mt12', D.h('div.g2',
      UI.field({
        label: '二维码刷新间隔', control: UI.select({
          options: [[30, '30 秒'], [60, '60 秒'], [90, '90 秒'], [120, '2 分钟'], [300, '5 分钟']],
          value: d.signRefresh, onChange: function (v) { d.signRefresh = U.int(v); }
        })
      }),
      UI.field({
        label: '演示提示',
        control: D.h('div', { style: 'font-size:12.5px;color:var(--text2);line-height:1.9' },
          '启用扫码签到后，可在活动列表中通过「更多 → 投屏签到二维码」打开动态二维码；',
          D.h('br'), '学生端在「我报名的」中点击「去签到」即可扫描该二维码完成签到。')
      })
    )));
    return wrap;
  }

  function stepWork(d) {
    var wrap = D.h('div');
    wrap.appendChild(UI.swRow({
      title: '需要提交作品', desc: '开启后学生报名后需提交作品，可在「活动管理 · 作品管理」中审核与批量导出',
      checked: !!d.needWork, onChange: function (v) { d.needWork = v; w.dispatchEvent(new w.Event('noop')); }
    }));
    wrap.appendChild(D.h('div.mt12', D.h('div.g2',
      UI.field({
        label: '作品格式', control: UI.chips({
          multi: true, value: d.workRule.formats, options: ['jpg', 'png', 'gif', 'mp4', 'pdf', 'docx', 'zip'],
          onChange: function (v) { d.workRule.formats = v; }
        })
      }),
      UI.field({ label: '最多提交份数', control: UI.input({ type: 'number', value: d.workRule.maxCount, onInput: function (e) { d.workRule.maxCount = U.int(e.target.value); } }) })
    )));
    wrap.appendChild(D.h('div.mt8', D.h('div.g2',
      UI.swRow({ title: '作品需要审核', checked: !!d.workRule.review, onChange: function (v) { d.workRule.review = v; } }),
      UI.swRow({ title: '专家评分', checked: !!d.workRule.expert, onChange: function (v) { d.workRule.expert = v; } })
    )));
    wrap.appendChild(D.h('div.mt8', UI.swRow({ title: '多环节评审', desc: '初评 → 复评 → 终评逐级评审', checked: !!d.workRule.multiStage, onChange: function (v) { d.workRule.multiStage = v; } })));
    wrap.appendChild(KP.h5('投票规则'));
    wrap.appendChild(UI.swRow({ title: '启用投票', checked: !!d.voteRule.enabled, onChange: function (v) { d.voteRule.enabled = v; } }));
    wrap.appendChild(D.h('div.mt8', D.h('div.g2',
      UI.field({ label: '投票开始', control: UI.input({ value: d.voteRule.start, placeholder: 'YYYY-MM-DD HH:mm', onInput: function (e) { d.voteRule.start = e.target.value; } }) }),
      UI.field({ label: '投票结束', control: UI.input({ value: d.voteRule.end, placeholder: 'YYYY-MM-DD HH:mm', onInput: function (e) { d.voteRule.end = e.target.value; } }) })
    )));
    wrap.appendChild(D.h('div.mt8', D.h('div.g2',
      UI.field({ label: '每人每日票数', control: UI.input({ type: 'number', value: d.voteRule.perDay, onInput: function (e) { d.voteRule.perDay = U.int(e.target.value); } }) }),
      UI.field({ label: '投票规则说明', control: UI.input({ value: d.voteRule.rule, onInput: function (e) { d.voteRule.rule = e.target.value; } }) })
    )));
    wrap.appendChild(KP.h5('奖项设置'));
    wrap.appendChild(UI.field({
      label: '奖项（每行一个）', control: UI.textarea({
        value: (d.awards || []).join('\n'), rows: 3,
        onInput: function (e) { d.awards = e.target.value.split('\n').filter(function (x) { return x.trim(); }); }
      })
    }));
    return wrap;
  }

  function stepShow(d) {
    var wrap = D.h('div');
    wrap.appendChild(KP.h5('活动展示样式（学生端生效）'));
    wrap.appendChild(D.h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:11px' },
      SHOW_STYLES.map(function (s) {
        var on = d.showTpl === s.k;
        return D.h('div', {
          style: 'border:1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)') + ';border-radius:9px;padding:8px 11px;cursor:pointer;background:' + (on ? 'var(--primary-l)' : '#fff'),
          onclick: function () { d.showTpl = s.k; paintShow(); }
        }, D.h('div', { style: 'font-weight:600;font-size:12.5px' }, s.k + '　' + s.n), D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:2px' }, s.d));
      })));
    var pvHost = D.h('div');
    wrap.appendChild(pvHost);
    function paintShow() {
      D.fill(pvHost, null);
      pvHost.appendChild(D.h('div.g-21',
        stylePreview({ title: d.title || '（未填写活动标题）', cat: d.cat, level: d.level, host: d.host, start: d.start, place: d.place, credit: d.credit, catGrad: d.catGrad, id: d.id || 'NEW', viewCount: d.viewCount }, d.showTpl, false),
        stylePreview({ title: d.title || '（未填写活动标题）', cat: d.cat, level: d.level, host: d.host, start: d.start, place: d.place, credit: d.credit, catGrad: d.catGrad, id: d.id || 'NEW', viewCount: d.viewCount }, d.showTpl, true)
      ));
    }
    paintShow();
    wrap.appendChild(KP.h5('获奖证书模板'));
    var cHost = D.h('div');
    function paintCert() {
      D.fill(cHost, null);
      cHost.appendChild(D.h('div.g4', certTemplates().slice(0, 8).map(function (t) {
        var on = d.certTpl === t.id;
        return D.h('div', {
          style: 'border:1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)') + ';border-radius:9px;padding:8px;cursor:pointer;background:' + (on ? 'var(--primary-l)' : '#fff'),
          onclick: function () { d.certTpl = t.id; paintCert(); }
        }, certThumb(t), D.h('div', { style: 'font-size:11px;margin-top:5px' }, t.name));
      })));
      cHost.appendChild(D.h('div', { style: 'font-size:12px;color:var(--text3);margin-top:8px' },
        '共 ' + certTemplates().length + ' 套模板，此处展示前 8 套；保存后可在活动详情「证书模板」中查看全部并自定义内容。'));
    }
    paintCert();
    wrap.appendChild(cHost);
    wrap.appendChild(KP.h5('审核流程'));
    wrap.appendChild(UI.field({
      label: '审批流程模板', control: UI.select({ options: FLOWS, value: d.flowTpl, onChange: function (v) { d.flowTpl = v; } }),
      hint: '选择「无需审批」时保存后直接发布；其余流程将进入审核'
    }));
    wrap.appendChild(UI.field({ label: '报名范围', control: UI.chips({ multi: true, value: d.audiences, options: ['全体学生', '本学院学生', '2024级', '2025级', '2026级', '社团成员'], onChange: function (v) { d.audiences = v; } }) }));
    return wrap;
  }

  w.ZKP.pages({
    act: {
      title: '第二课堂活动', group: '活动运营',
      render: render
    }
  });
})(window);
