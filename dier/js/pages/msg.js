/* ==========================================================================
   msg.js —— 消息通知（发送 / 已读未读统计 / 催办）
   对应演示项【2.1 第一步】：
   «演示…消息通知及已读未读统计。»
   · 消息列表：按类型（报名 / 提醒 / 分值 / 预警 / 作品 / 规则 / 成绩 / 社团）、
     送达范围（全校 / 二级学院 / 活动参与人 / 指定用户）、渠道与时间筛选。
   · 已读未读统计：已读率、已读人次、未读人次、回执情况；未读名单真实按
     送达范围从学生名册中推算（已读名单取自消息的已读记录）。
   · 发送消息：真实选择范围与渠道，按范围计算送达人数并写入消息记录，
     同时生成操作留痕；发送后列表与统计同步更新。
   · 催办未读：向未读对象补发一条提醒消息，并累加原消息的提醒次数。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'list', type: '', scope: '', read: '', kw: '', pages: 1 };

  var TYPES = ['报名', '提醒', '分值', '预警', '作品', '规则', '成绩', '社团'];
  var SCOPES = ['全校', '二级学院', '活动参与人', '指定用户'];
  var CHANNELS = ['站内消息', '移动端推送', '短信', '微信'];

  function msgs() { return DB.col('msgs'); }

  function filtered() {
    var l = msgs();
    if (st.type) l = l.filter(function (m) { return m.type === st.type; });
    if (st.scope) l = l.filter(function (m) { return m.scope === st.scope; });
    if (st.read === 'unread') l = l.filter(function (m) { return U.num(m.unreadCount) > 0; });
    if (st.read === 'all-read') l = l.filter(function (m) { return U.num(m.unreadCount) === 0; });
    if (st.read === 'receipt') l = l.filter(function (m) { return !!m.needCall; });
    if (st.kw) l = l.filter(function (m) { return U.hitAny([m.title, m.content, m.sender, m.targetDesc], st.kw); });
    U.sortBy(l, function (m) { return m.at; }, true);
    return l;
  }

  /** 送达人数：按范围推算（真实取数） */
  function reachOf(scope, targetDesc) {
    if (scope === '全校') return DB.col('students').length;
    if (scope === '二级学院') {
      var n = DB.count('students', function (s) { return s.college === targetDesc || (targetDesc || '').indexOf(s.college) >= 0; });
      return n || Math.round(DB.col('students').length / DB.col('colleges').length);
    }
    if (scope === '活动参与人') {
      var a = DB.find('activities', function (x) { return x.title === targetDesc; });
      return a ? U.num(a.enrolled) : 120;
    }
    return 1;
  }

  function totals() {
    var l = msgs();
    var total = U.sum(l, function (m) { return U.num(m.total); });
    var read = U.sum(l, function (m) { return U.num(m.readCount); });
    return {
      n: l.length, total: total, read: read, unread: total - read,
      rate: U.pctNum(read, total),
      receipt: l.filter(function (m) { return m.needCall; }).length,
      allRead: l.filter(function (m) { return U.num(m.unreadCount) === 0; }).length
    };
  }

  function kpis() {
    var t = totals();
    return KP.kpis([
      { label: '消息总数', num: t.n, unit: '条', ic: '📨', fg: '#2563eb', bg: '#eff6ff', foot: '覆盖 ' + U.fmt(t.total) + ' 人次' },
      { label: '已读人次', num: t.read, unit: '人次', ic: '👁', fg: '#059669', bg: '#ecfdf5', foot: '已读率 ' + t.rate + '%' },
      { label: '未读人次', num: t.unread, unit: '人次', ic: '🔕', fg: '#dc2626', bg: '#fef2f2', foot: '需催办 ' + msgs().filter(function (m) { return U.num(m.unreadCount) > 0; }).length + ' 条' },
      { label: '需回执', num: t.receipt, unit: '条', ic: '📌', fg: '#d97706', bg: '#fff8eb' },
      { label: '已全部已读', num: t.allRead, unit: '条', ic: '✅', fg: '#7c3aed', bg: '#f5f3ff', foot: '共 ' + t.n + ' 条消息' }
    ], 'g5');
  }

  /* ===================== 一、消息列表 ===================== */
  function listTab(host, rerender) {
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '消息列表',
        sub: '共 ' + msgs().length + ' 条消息 · 已读未读实时统计',
        flush: true,
        right: D.h('div', { style: 'display:flex;gap:8px' },
          D.h('button.btn.btn-sm', { onclick: function () { allRead(); rerender(); } }, '全部标记已读'),
          D.h('button.btn.btn-sm.btn-p', { onclick: function () { compose(rerender); } }, '＋ 发送消息')),
        body: KP.lister({
          noCard: true, pageSize: 12,
          filters: function (s2, refresh) {
            return UI.filterBar([
              { type: 'select', options: [['', '全部类型']].concat(TYPES.map(function (t) { return [t, t]; })), value: st.type, onChange: function (v) { st.type = v; refresh(); } },
              { type: 'select', options: [['', '全部范围']].concat(SCOPES.map(function (t) { return [t, t]; })), value: st.scope, onChange: function (v) { st.scope = v; refresh(); } },
              {
                type: 'select', options: [['', '全部状态'], ['unread', '存在未读'], ['all-read', '已全部已读'], ['receipt', '需回执']],
                value: st.read, onChange: function (v) { st.read = v; refresh(); }
              },
              { type: 'input', ph: '标题 / 内容 / 发送人…', onChange: U.debounce(function (v) { st.kw = v; refresh(); }, 220) }
            ], {
              right: [
                KP.exportBtn('导出消息台账', [
                  { t: '消息标题', k: 'title' }, { t: '类型', k: 'type' }, { t: '送达范围', k: 'scope' },
                  { t: '送达对象', k: 'targetDesc' }, { t: '发送人', k: 'sender' }, { t: '送达人次', k: 'total' },
                  { t: '已读', k: 'readCount' }, { t: '未读', k: 'unreadCount' },
                  { t: '已读率(%)', raw: function (m) { return U.pctNum(m.readCount, m.total); } },
                  { t: '发送时间', k: 'at' }
                ], function () { return filtered(); })
              ]
            });
          },
          cols: [
            { t: '消息内容', w: 300, render: function (m) { return KP.cell(m.title, String(m.content).slice(0, 40) + '…', { clip: true, title: m.title }); } },
            { t: '类型', w: 80, render: function (m) { return UI.tag(m.type, 'tag-info'); } },
            { t: '送达范围', w: 156, render: function (m) { return KP.cell(m.scope, m.targetDesc || '—'); } },
            {
              t: '已读 / 未读', w: 168, render: function (m) {
                var p = U.pctNum(m.readCount, m.total);
                return D.h('div', { style: 'min-width:130px' },
                  UI.pg(p, p >= 80 ? 'ok' : (p >= 50 ? 'warn' : 'err')),
                  D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' },
                    U.fmt(m.readCount) + ' 已读 / ' + D.h('b', { style: 'color:' + (m.unreadCount > 0 ? '#dc2626' : '#059669') }, U.fmt(m.unreadCount)) + ' 未读'));
              }
            },
            { t: '回执', w: 76, render: function (m) { return m.needCall ? UI.tag('需回执', 'tag-warn') : D.h('span.muted', '—'); } },
            { t: '发送时间', w: 132, render: function (m) { return D.h('span.muted', m.at); } },
            {
              t: '操作', w: 168, render: function (m) {
                return KP.acts([
                  KP.btn('详情', function () { detail(m, rerender); }),
                  KP.btn('未读名单', function () { unreadList(m); }),
                  U.num(m.unreadCount) > 0 ? KP.btn('催办', function () { remind(m, rerender); }, 'btn-p') : null
                ]);
              }
            }
          ],
          rows: function () { return filtered(); },
          empty: '暂无符合条件的消息', emptySub: '可调整类型、范围或状态筛选'
        })
      }),
      D.h('div', {},
        UI.card({
          title: '已读情况总览', sub: '按全部消息聚合统计',
          body: D.h('div', {}, (function () {
            var t = totals();
            var rows = [
              { n: '已读人次', v: t.read, c: C.SEM.ok },
              { n: '未读人次', v: t.unread, c: C.SEM.err }
            ];
            return D.h('div', {}, C.donut(rows, { size: 182 }), C.legend(rows),
              D.h('div', { style: 'margin-top:12px' }, KP.h5('整体已读率'),
                UI.pgRow(t.rate, t.rate + '%（' + U.fmt(t.read) + '/' + U.fmt(t.total) + ' 人次）')));
          })())
        }),
        D.h('div', { style: 'height:12px' }),
        UI.card({
          title: '按消息类型的已读率', sub: '定位哪些类型的通知触达偏弱',
          body: D.h('div', {}, (function () {
            var rows = TYPES.map(function (t) {
              var l = msgs().filter(function (m) { return m.type === t; });
              var tot = U.sum(l, function (m) { return U.num(m.total); });
              var rd = U.sum(l, function (m) { return U.num(m.readCount); });
              return { n: t, v: U.pctNum(rd, tot), cnt: l.length };
            }).filter(function (r) { return r.cnt > 0; });
            if (!rows.length) return UI.empty('暂无数据');
            return D.h('div', {}, C.bars(rows.map(function (r) { return { n: r.n, v: r.v }; }), { labelW: 60, bh: 17, unit: '%', max: 100 }),
              D.h('div.dk-tip', rows.map(function (r) { return r.n + '（' + r.cnt + ' 条）'; }).join('　')));
          })())
        })
      )
    ));
  }

  /* ===================== 发送消息 ===================== */
  function compose(rerender) {
    var titleInp = UI.input({ placeholder: '如：关于第二课堂学分认定结果的通知' });
    var contentTa = UI.textarea({ rows: 4, placeholder: '请输入消息正文（将按所选渠道推送给送达对象）' });
    var typeSel = UI.select({ options: TYPES.map(function (t) { return [t, t]; }), value: '提醒' });
    var scopeSel = UI.select({ options: SCOPES.map(function (t) { return [t, t]; }), value: '全校' });
    var targetSel = UI.select({
      options: [{ v: '', n: '（全校无需选择）' }].concat(DB.col('colleges').map(function (c) { return { v: c.name, n: c.name }; })).map(function (x) { return [x.v, x.n]; }),
      value: ''
    });
    var chChips = UI.chips({ multi: true, value: ['站内消息', '移动端推送'], options: CHANNELS });
    var remindChips = UI.chips({ multi: true, value: ['短信'], options: ['短信', '电话', '微信'] });
    var needCall = UI.chips({ options: [['yes', '需回执'], ['no', '不需回执']], value: 'no' });
    var reachBox = D.h('div.req-note');

    function refreshReach() {
      var n = reachOf(scopeSel.value, targetSel.value);
      reachBox.innerHTML = '预计送达 <b>' + U.fmt(n) + '</b> 人（送达范围：' + scopeSel.value +
        (targetSel.value ? ' · ' + targetSel.value : '') + '）；渠道：' + ((chChips._v || []).join('、') || '未选择');
    }
    scopeSel.addEventListener('change', refreshReach);
    targetSel.addEventListener('change', refreshReach);

    var m = UI.formModal({
      title: '发送消息通知',
      sub: '按送达范围真实计算人数并写入消息台账',
      fields: [
        { label: '消息标题', required: true, control: titleInp, span: true },
        { label: '消息正文', required: true, control: contentTa, span: true },
        { label: '消息类型', control: typeSel },
        { label: '送达范围', control: scopeSel },
        { label: '送达对象', control: targetSel, hint: '范围选择「二级学院」时在此选择具体学院；其他范围可留空。' },
        { label: '推送渠道', control: chChips, span: true },
        { label: '补充提醒方式', control: remindChips, span: true, hint: '对未读对象可通过短信 / 微信 / 电话补充提醒。' },
        { label: '是否需要回执', control: needCall }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var t = titleInp.value.trim(), c = contentTa.value.trim();
            if (!t) { UI.toast('请填写消息标题', '', 'warn'); return; }
            if (!c) { UI.toast('请填写消息正文', '', 'warn'); return; }
            var chans = chChips._v || [];
            if (!chans.length) { UI.toast('请至少选择一个推送渠道', '', 'warn'); return; }
            var n = reachOf(scopeSel.value, targetSel.value);
            var rec = DB.insert('msgs', {
              title: t, content: c, type: typeSel.value, scope: scopeSel.value,
              channels: chans, at: U.dt(new Date()), sender: ZA.session.name,
              total: n, readCount: 0, unreadCount: n, readBy: [],
              bizType: typeSel.value, bizId: '', needCall: needCall.value === 'yes',
              remindWays: remindChips._v || [], targetDesc: targetSel.value || (scopeSel.value === '全校' ? '全体学生' : scopeSel.value)
            });
            DB.insert('logs', {
              id: U.uid('LG'), at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()] || '管理员',
              action: '发送消息通知', module: '消息通知', target: rec ? rec.id : t, ip: '10.16.1.101', result: '成功',
              detail: '送达范围 ' + scopeSel.value + ' · ' + U.fmt(n) + ' 人'
            });
            m.close();
            UI.toast('消息已发送', '已推送至 ' + U.fmt(n) + ' 人（' + chans.join('、') + '）', 'ok');
            rerender();
          }
        }, '发送消息')
      ]
    });
    setTimeout(refreshReach, 60);
    /* 把送达预估插入弹窗头部，让用户发送前就能看到人数 */
    var body = w.document.querySelector('.mask .modal-b');
    if (body) body.insertBefore(reachBox, body.firstChild);
  }

  /* ===================== 详情 / 未读名单 / 催办 ===================== */
  function sampleStudents(scope, targetDesc, n, exclude) {
    var pool = DB.col('students');
    if (scope === '二级学院' && targetDesc) {
      var f = pool.filter(function (s) { return s.college === targetDesc || targetDesc.indexOf(s.college) >= 0; });
      if (f.length) pool = f;
    }
    var out = [], step = Math.max(1, Math.floor(pool.length / Math.max(1, n)));
    for (var i = 0; i < pool.length && out.length < n; i += step) {
      var s = pool[i];
      if (exclude && exclude.indexOf(s.sno) >= 0) continue;
      out.push(s);
    }
    return out;
  }

  /** 未读名单：按送达范围从学生名册推算（扣除已读记录） */
  function unreadOf(m) {
    var readSno = (m.readBy || []).map(function (x) { return x.sno; });
    var unread = U.num(m.unreadCount);
    var n = Math.min(unread, 30);
    return sampleStudents(m.scope, m.targetDesc, n + readSno.length, null)
      .filter(function (s) { return readSno.indexOf(s.sno) < 0; })
      .slice(0, n);
  }

  function unreadList(m) {
    var list = unreadOf(m);
    var modal = UI.modal({
      title: '未读名单',
      sub: m.title + ' · 未读 ' + U.fmt(m.unreadCount) + ' 人次（展示前 ' + list.length + ' 人）',
      size: 'wide',
      body: [
        UI.kv([
          ['送达范围', m.scope + (m.targetDesc ? ' · ' + m.targetDesc : '')],
          ['送达人次', U.fmt(m.total)],
          ['已读人次', U.fmt(m.readCount) + '（' + U.pct(m.readCount, m.total) + '）'],
          ['未读人次', U.fmt(m.unreadCount)],
          ['推送渠道', (m.channels || []).join('、')],
          ['补充提醒', (m.remindWays || []).join('、') || '未配置']
        ]),
        KP.h5('未读学生'),
        list.length
          ? D.h('div', { html: KP.tableHTML([
            { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' }, { t: '学院', k: 'college' },
            { t: '班级', k: 'className' }, { t: '联系方式', k: 'contact' }, { t: '年级', k: 'grade' }
          ], list) })
          : UI.empty('全部对象已读', '该消息已被全部送达对象阅读')
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { modal.close(); } }, '关闭'),
        KP.exportBtn('导出未读名单', [
          { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' }, { t: '学院', k: 'college' },
          { t: '班级', k: 'className' }, { t: '联系方式', k: 'contact' }
        ], list),
        U.num(m.unreadCount) > 0 ? D.h('button.btn.btn-sm.btn-p', {
          onclick: function () { modal.close(); remind(m, function () { w.ZR.render(); }); }
        }, '向未读对象催办') : null
      ]
    });
  }

  /** 催办：真实补发提醒消息并累加提醒次数 */
  function remind(m, rerender) {
    var unread = U.num(m.unreadCount);
    if (!unread) { UI.toast('该消息已全部已读', '无需催办', 'info'); return; }
    UI.confirm({
      title: '催办未读对象',
      text: '将向该消息的 ' + U.fmt(unread) + ' 个未读对象补发一条提醒消息。',
      detail: '提醒方式：' + ((m.remindWays || []).join('、') || '站内消息'),
      onOk: function () {
        DB.insert('msgs', {
          title: '【催办】' + m.title,
          content: '你有一条来自「' + m.sender + '」的消息还未阅读，请及时查看：' + String(m.content).slice(0, 60) + '…',
          type: '提醒', scope: m.scope, channels: m.remindWays && m.remindWays.length ? m.remindWays : ['站内消息'],
          at: U.dt(new Date()), sender: ZA.session.name, total: unread, readCount: 0, unreadCount: unread,
          readBy: [], bizType: '催办', bizId: m.id, needCall: false, remindWays: [], targetDesc: m.targetDesc
        });
        m.remindCount = U.num(m.remindCount) + 1;
        DB.touch('msgs', m);
        DB.insert('logs', {
          id: U.uid('LG'), at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()] || '管理员',
          action: '催办未读消息', module: '消息通知', target: m.id, ip: '10.16.1.101', result: '成功',
          detail: '催办 ' + unread + ' 人次'
        });
        UI.toast('催办已发出', '已向 ' + U.fmt(unread) + ' 个未读对象补发提醒', 'ok');
        if (rerender) rerender();
      }
    });
  }

  function allRead() {
    var n = 0;
    msgs().forEach(function (m) {
      if (U.num(m.unreadCount) > 0) { n += U.num(m.unreadCount); m.readCount = m.total; m.unreadCount = 0; }
    });
    DB.touchObj('msgs');
    UI.toast(n ? '已全部标记为已读' : '所有消息本就已读', n ? '共更新 ' + U.fmt(n) + ' 人次' : '无需变更', n ? 'ok' : 'info');
  }

  function detail(m, rerender) {
    var modal = UI.modal({
      title: m.title,
      sub: m.type + ' · ' + m.scope + (m.targetDesc ? ' · ' + m.targetDesc : '') + ' · ' + m.at,
      size: 'wide',
      body: [
        D.h('div', { style: 'padding:12px;border:1px solid var(--line);border-radius:10px;background:#fbfdff;font-size:13px;line-height:1.9' }, m.content),
        KP.h5('送达与阅读情况'),
        D.h('div', {}, (function () {
          var t = U.num(m.total), r = U.num(m.readCount), u = U.num(m.unreadCount);
          var rows = [{ n: '已读', v: r, c: C.SEM.ok }, { n: '未读', v: u, c: C.SEM.err }];
          return D.h('div', {},
            KP.kpis([
              { label: '送达人次', num: t, unit: '人次', ic: '📤', fg: '#2563eb', bg: '#eff6ff' },
              { label: '已读人次', num: r, unit: '人次', ic: '👁', fg: '#059669', bg: '#ecfdf5' },
              { label: '未读人次', num: u, unit: '人次', ic: '🔕', fg: '#dc2626', bg: '#fef2f2' },
              { label: '已读率', num: U.pctNum(r, t), unit: '%', ic: '📊', fg: '#7c3aed', bg: '#f5f3ff' }
            ], 'g4'),
            D.h('div', { style: 'margin-top:12px' }, C.donut(rows, { size: 170 }), C.legend(rows)));
        })()),
        KP.h5('推送配置'),
        UI.kv([
          ['消息类型', m.type],
          ['送达范围', m.scope + (m.targetDesc ? ' · ' + m.targetDesc : '')],
          ['推送渠道', (m.channels || []).join('、')],
          ['补充提醒方式', (m.remindWays || []).join('、') || '未配置'],
          ['是否需要回执', m.needCall ? '是' : '否'],
          ['发送人', m.sender],
          ['发送时间', m.at],
          ['累计催办次数', U.num(m.remindCount) + ' 次']
        ])
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { modal.close(); } }, '关闭'),
        D.h('button.btn.btn-sm', { onclick: function () { modal.close(); unreadList(m); } }, '查看未读名单'),
        U.num(m.unreadCount) > 0 ? D.h('button.btn.btn-sm.btn-p', { onclick: function () { modal.close(); remind(m, rerender); } }, '催办未读') : null
      ]
    });
  }

  /* ===================== 二、我的消息（学生视角） ===================== */
  function mineTab(host, rerender) {
    var mine = U.sortBy(msgs(), function (m) { return m.at; }, true).slice(0, 12);
    var unread = msgs().filter(function (m) { return U.num(m.unreadCount) > 0; }).length;
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '我的消息',
        sub: '当前登录身份：' + ZA.session.name + ' · ' + (ZA.ROLE_LABEL[ZA.role()] || ZA.role()),
        body: D.h('div', {}, mine.map(function (m, i) {
          return UI.listItem({
            icon: m.type === '预警' ? '⚠️' : (m.type === '成绩' ? '🎓' : (m.type === '报名' ? '📝' : '📢')),
            fg: i % 3 === 0 ? '#2563eb' : (i % 3 === 1 ? '#059669' : '#d97706'),
            bg: i % 3 === 0 ? '#eff6ff' : (i % 3 === 1 ? '#ecfdf5' : '#fff8eb'),
            title: m.title,
            desc: String(m.content).slice(0, 62) + '…',
            meta: [m.sender, m.at, m.type],
            unread: i < unread ? true : false,
            right: D.h('div', { style: 'text-align:right' },
              i < unread ? UI.tag('未读', 'tag-err') : UI.tag('已读', 'tag-ok'),
              D.h('div', { style: 'margin-top:5px' }, KP.btn('查看', function () { detail(m, rerender); }))),
            onClick: null
          });
        }))
      }),
      D.h('div', {},
        UI.card({
          title: '我的未读统计',
          sub: '按消息类型统计未读条数',
          body: D.h('div', {}, (function () {
            var rows = TYPES.map(function (t) {
              var l = msgs().filter(function (m) { return m.type === t; });
              var u = U.sum(l, function (m) { return U.num(m.unreadCount); });
              return { n: t, v: u, cnt: l.length };
            }).filter(function (r) { return r.cnt > 0; });
            var max = Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
            return D.h('div', {}, rows.map(function (r) {
              return D.h('div', { style: 'display:flex;align-items:center;gap:9px;margin-bottom:8px;font-size:12.3px' },
                D.h('span', { style: 'width:56px' }, r.n),
                D.h('div', { style: 'flex:1' }, UI.pg(r.v / max * 100, r.v > 6 ? 'err' : (r.v > 2 ? 'warn' : 'ok'))),
                D.h('span', { style: 'width:60px;text-align:right;color:var(--text3)' }, U.fmt(r.v) + ' 未读'));
            }));
          })())
        }),
        D.h('div', { style: 'height:12px' }),
        UI.card({
          title: '消息类型分布', sub: '全部消息按类型统计',
          body: C.donut(TYPES.map(function (t, i) {
            return { n: t, v: msgs().filter(function (m) { return m.type === t; }).length, c: C.color(i) };
          }).filter(function (r) { return r.v > 0; }), { size: 178 })
        })
      )
    ));
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    host.appendChild(UI.pageHd({
      title: '消息通知',
      desc: '消息发送、送达范围与渠道配置、已读未读统计、未读名单与催办全流程；统计与列表同源联动。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('ai'); } }, 'AI 助手推送'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { compose(function () { w.ZR.render(); }); } }, '＋ 发送消息')
      ]
    }));
    host.appendChild(kpis());
    host.appendChild(D.h('div', { style: 'height:14px' }));

    var rerender = function () { w.ZR.render(); };
    host.appendChild(UI.tabs({
      items: [
        { k: 'list', n: '消息台账', cnt: msgs().length },
        { k: 'mine', n: '我的消息', cnt: msgs().filter(function (m) { return U.num(m.unreadCount) > 0; }).length }
      ],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'list') listTab(body, rerender);
    else mineTab(body, rerender);
    host.appendChild(body);
  }

  KP.pages({
    msg: { title: '消息通知', group: '门户与智能', render: render }
  });
})(window);
