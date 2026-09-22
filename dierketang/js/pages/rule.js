/* ==========================================================================
   rule.js —— 活动规则设置（规则中心）
   五个真实作业面：
   ① 报名规则：并行活动数上限、报名截止约束、专业/年级范围校验 —— 全部可按需启停与调参
   ② 黑名单管理：自动纳入规则、手动纳入/移除、到期自动解除、涉及缺勤明细
   ③ 报名表单字段：拖拽排序 + 启用/必填开关 + 新增自定义字段 + 实时表单预览
   ④ 自动通知条件：报名成功、活动前提醒、未签到预警等触发条件与渠道配置
   ⑤ 学分项目库：六大类学分项目树（一级/二级项目与参考分值）
   规则改动即时生效并写入操作留痕，活动广场的报名校验会真正读取这些规则。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'enroll', kw: '', status: '', dragId: '', dragOverId: '', preview: true };

  var RULE_TYPES = ['报名规则', '黑名单规则', '通知条件'];

  /* ---------------- 通用：规则卡片（可启停 + 可调参） ---------------- */
  function ruleCard(r, onEdit) {
    var p = r.params || {};
    var paramText = Object.keys(p).map(function (k) {
      var v = p[k];
      if (Array.isArray(v)) v = v.join('、');
      return LABEL[k] ? LABEL[k] + '：' + v : k + '：' + v;
    });
    return D.h('div', {
      style: 'border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:9px'
    },
      D.h('div', { style: 'display:flex;align-items:flex-start;gap:11px' },
        UI.icoBox(TYPE_ICON[r.type] || '⚙', TYPE_FG[r.type] || '#2563eb', TYPE_BG[r.type] || '#eff6ff', 34),
        D.h('div', { style: 'flex:1;min-width:0' },
          D.h('div', { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap' },
            D.h('span', { style: 'font-weight:700;font-size:13.5px' }, r.name),
            UI.tag(r.type, 'tag-info'),
            r.enabled ? UI.tag('已启用', 'tag-ok') : UI.tag('已停用', 'tag-info')
          ),
          D.h('div', { style: 'font-size:12px;color:var(--text2);line-height:1.75;margin-top:5px' }, r.desc)
        ),
        D.h('label.sw', { style: 'flex:0 0 auto' },
          D.h('input', {
            type: 'checkbox', checked: !!r.enabled,
            onchange: function (e) {
              DB.update('actRules', r.id, { enabled: e.target.checked, updatedAt: U.dt(new Date()), updatedBy: ZA.session.name });
              log('切换规则启停', r.name + ' → ' + (e.target.checked ? '启用' : '停用'));
              UI.toast(e.target.checked ? '规则已启用' : '规则已停用', r.name, e.target.checked ? 'ok' : 'warn');
              w.ZR.render();
            }
          }), D.h('span.sl'))
      ),
      D.h('div', { style: 'background:#f8fafc;border-radius:9px;padding:9px 11px' },
        paramText.length
          ? D.h('div', { style: 'font-size:11.8px;color:var(--text2);line-height:1.95' },
            paramText.map(function (t) { return D.h('div', '· ' + t); }))
          : D.h('div.muted', '无附加参数')
      ),
      D.h('div', { style: 'display:flex;align-items:center;gap:9px;margin-top:auto' },
        D.h('span.muted', '最后修改：' + (r.updatedAt || '—') + ' · ' + (r.updatedBy || '—')),
        D.h('div', { style: 'margin-left:auto' },
          D.h('button.btn.btn-sm', { onclick: function () { onEdit(r); } }, '调整参数'))
      )
    );
  }
  var LABEL = {
    maxParallel: '同时可报名活动数', scope: '适用范围', effect: '超出时处理',
    before: '报名截止约束', missTimes: '缺勤累计次数', period: '统计周期', autoOutDays: '自动解除天数',
    channels: '通知渠道', when: '触发时机'
  };
  var TYPE_ICON = { '报名规则': '📋', '黑名单规则': '🚫', '通知条件': '🔔' };
  var TYPE_FG = { '报名规则': '#2563eb', '黑名单规则': '#dc2626', '通知条件': '#d97706' };
  var TYPE_BG = { '报名规则': '#eff6ff', '黑名单规则': '#fef2f2', '通知条件': '#fffbeb' };

  function log(action, detail) {
    DB.insert('logs', {
      at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
      action: action, module: '活动规则', target: '', ip: '10.16.1.101', result: '成功', detail: detail
    });
  }

  function editParams(r) {
    var p = JSON.parse(JSON.stringify(r.params || {}));
    var host = D.h('div');
    var ctrls = {};
    function paint() {
      D.fill(host, null);
      host.appendChild(D.h('div.req-note', r.desc));
      var wrap = D.h('div.frm.c2.mt12');
      Object.keys(p).forEach(function (k) {
        var v = p[k];
        var ctrl;
        if (k === 'channels') {
          ctrl = UI.chips({ multi: true, value: v.slice(), options: ['站内消息', '移动端推送', '短信', '微信', '邮件'], onChange: function (nv) { p[k] = nv; } });
        } else if (k === 'scope' || k === 'effect' || k === 'when') {
          var opts = {
            scope: ['全体学生', '本学院学生', '社团成员', '按活动单独配置'],
            effect: ['超出时系统拒绝报名并提示', '超出时进入候补队列', '仅提醒不拦截'],
            when: ['报名审核通过', '活动开始前 24 小时', '活动开始前 2 小时', '活动结束后 2 小时', '签到 30 分钟前']
          }[k] || [v];
          ctrl = UI.select({ options: opts.map(function (o) { return [o, o]; }), value: v, onChange: function (nv) { p[k] = nv; } });
        } else if (typeof v === 'number') {
          ctrl = UI.input({
            type: 'number', value: v, min: 0, max: 365,
            onInput: function (e) { p[k] = U.num(e.target.value); }
          });
        } else {
          ctrl = UI.input({ value: v, onInput: function (e) { p[k] = e.target.value; } });
        }
        wrap.appendChild(UI.field({ label: LABEL[k] || k, control: ctrl, span: k === 'channels' ? 2 : null }));
      });
      host.appendChild(wrap);
    }
    paint();
    var m = UI.modal({
      title: '调整规则参数 · ' + r.name, sub: r.type + ' · ' + r.id, size: 'wide', body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            DB.update('actRules', r.id, { params: p, updatedAt: U.dt(new Date()), updatedBy: ZA.session.name });
            log('调整活动规则参数', r.name + ' · ' + JSON.stringify(p).slice(0, 90));
            UI.toast('规则参数已保存', r.name + ' 已即时生效', 'ok');
            m.close(); w.ZR.render();
          }
        }, '保存并生效')
      ]
    });
  }

  /* ---------------- ① 报名规则 ---------------- */
  function tabEnroll(host) {
    var l = DB.filter('actRules', function (r) { return r.type === '报名规则'; });
    host.appendChild(D.h('div.req-note', '报名规则由系统在<b>每次报名时实时校验</b>：在「活动广场」点击「立即报名」会依次检查黑名单、并行活动数上限、报名截止时间与名额余量，任一不通过即拦截并给出具体原因。'));
    host.appendChild(D.h('div.mt12', D.h('div.g3', l.map(function (r) { return ruleCard(r, editParams); }))));

    /* 报名规则拦截效果统计（从真实数据统计，不是写死） */
    var bl = DB.count('blacklist', function (b) { return b.active; });
    var actCount = {};
    DB.col('enrollments').forEach(function (e) { if (e.actId) actCount[e.actId] = (actCount[e.actId] || 0) + 1; });
    var topAct = U.topN(DB.col('activities'), function (a) { return actCount[a.id] || 0; }, 6, true);
    host.appendChild(D.h('div.mt16', UI.card({
      title: '报名规则实际效果', sub: '按当前数据统计，规则拦截与放行情况',
      body: D.h('div.g-21', {},
        D.h('div', {}, C.bars([
          { n: '黑名单拦截（在册人数）', v: bl, c: '#ef4444' },
          { n: '并行活动超限（预估）', v: DB.count('enrollments', function (e) { return e.status === '待审核'; }), c: '#f59e0b' },
          { n: '报名截止后拒单（预估）', v: DB.count('activities', function (a) { return a.status === '已结束'; }), c: '#94a3b8' },
          { n: '名额满拒单（预估）', v: DB.col('activities').filter(function (a) { var cap = U.int((a.items[0] || {}).limit, a.maxNum); return cap && (actCount[a.id] || 0) >= cap; }).length, c: '#8b5cf6' },
          { n: '正常放行报名', v: DB.count('enrollments', function (e) { return e.status !== '已驳回'; }), c: '#10b981' }
        ], { unit: ' 人次', labelW: 168, bh: 17, gap: 9 })),
        D.h('div', {}, UI.card({
          title: '报名最集中的活动', tight: true, cls: 'inner',
          body: UI.miniList(topAct.map(function (a, i) {
            return {
              rank: i + 1, name: a.title, sub: a.host + ' · ' + a.cat,
              value: (actCount[a.id] || 0) + ' 人',
              onClick: function () { w.ZR.go('actmgr'); }
            };
          }))
        }))
      )
    })));
  }

  /* ---------------- ② 黑名单管理 ---------------- */
  function tabBlack(host) {
    var l = DB.col('blacklist');
    var active = l.filter(function (b) { return b.active; });
    var lister = KP.lister({
      host: D.h('div'),
      title: '活动黑名单', sub: '共 ' + l.length + ' 条记录，其中在册 ' + active.length + ' 人',
      filters: function () {
        return UI.filterBar([
          { type: 'input', ph: '搜索姓名 / 学号 / 原因…', value: st.kw, width: 230, onChange: function (e) { st.kw = e.target.value; w.ZR.render(); } },
          { type: 'select', label: '状态', value: st.status, options: [['', '全部状态'], ['active', '在册'], ['out', '已解除']], onChange: function (v) { st.status = v; w.ZR.render(); } }
        ]);
      },
      toolbar: function () {
        return D.h('div', { style: 'display:flex;gap:9px;align-items:center;flex-wrap:wrap' },
          D.h('span', { style: 'font-weight:650;font-size:12.5px' }, '黑名单操作：'),
          D.h('button.btn.btn-sm.btn-dan', { onclick: function () { addBlack(); } }, '＋ 手动纳入黑名单'),
          D.h('button.btn.btn-sm', {
            onclick: function () {
              var n = 0;
              DB.col('blacklist').forEach(function (b) {
                if (b.active && b.autoOutAt && b.autoOutAt <= DB.data.meta.now + ' 23:59') {
                  DB.update('blacklist', b.id, { active: false, reason: b.reason + '（到期自动解除）' });
                  n++;
                }
              });
              log('执行黑名单到期自动解除', '解除 ' + n + ' 人');
              UI.toast(n ? '已解除到期黑名单' : '当前没有到期的黑名单记录', n ? n + ' 人已恢复报名权限' : '', n ? 'ok' : 'warn');
              w.ZR.render();
            }
          }, '⏳ 执行到期自动解除'),
          D.h('div', { style: 'margin-left:auto' }, KP.exportBtn('黑名单明细', [
            { t: '编号', k: 'id' }, { t: '姓名', k: 'name' }, { t: '学号', k: 'sno' },
            { t: '学院', k: 'college' }, { t: '班级', k: 'className' }, { t: '联系方式', raw: function (b) { return b.contact || ''; } },
            { t: '纳入原因', k: 'reason' }, { t: '缺勤次数', k: 'misses' },
            { t: '纳入时间', k: 'at' }, { t: '自动解除时间', k: 'autoOutAt' },
            { t: '来源', k: 'source' }, { t: '是否在册', raw: function (b) { return b.active ? '在册' : '已解除'; } }
          ], DB.col('blacklist')))
        );
      },
      cols: [
        { t: '学生', w: 152, render: function (b) { return KP.who(b.name, b.sno, { size: 28 }); } },
        { t: '学院 / 班级', render: function (b) { return KP.cell(b.college, b.className, { clip: true }); } },
        { t: '缺勤次数', w: 100, align: 'right', render: function (b) { return KP.numCell(U.int(b.misses, 0), '次'); } },
        { t: '纳入原因', render: function (b) { return D.h('span', { style: 'font-size:11.8px;color:var(--text2)' }, b.reason); } },
        { t: '纳入 / 解除时间', w: 196, render: function (b) { return D.h('div', { style: 'font-size:11.8px;line-height:1.75' }, D.h('div', '纳入 ' + b.at), D.h('div', { style: 'color:var(--text3)' }, '解除 ' + b.autoOutAt)); } },
        { t: '来源', w: 118, render: function (b) { return UI.tag(b.source, b.source === '系统自动纳入' ? 'tag-warn' : 'tag-info'); } },
        { t: '状态', w: 92, render: function (b) { return KP.status(b.active ? '黑名单' : '已解除'); } },
        {
          t: '操作', w: 150, render: function (b) {
            return KP.acts([
              D.h('button.btn.btn-sm', { onclick: function () { blackDetail(b); } }, '明细'),
              b.active ? D.h('button.btn.btn-sm.btn-p', {
                onclick: function () {
                  UI.confirm({
                    title: '解除黑名单', text: '确认解除「' + b.name + '」的活动黑名单吗？解除后可立即报名新活动。',
                    onOk: function () {
                      DB.update('blacklist', b.id, { active: false, reason: b.reason + '（管理员手动解除）' });
                      log('手动解除黑名单', b.name + ' · ' + b.sno);
                      UI.toast('已解除黑名单', b.name + ' 恢复报名权限', 'ok');
                      w.ZR.render();
                    }
                  });
                }
              }, '解除') : D.h('button.btn.btn-sm.btn-dan', {
                onclick: function () {
                  UI.confirm({
                    title: '重新纳入黑名单', danger: true, text: '确认重新纳入「' + b.name + '」吗？',
                    onOk: function () {
                      DB.update('blacklist', b.id, { active: true, at: U.dt(new Date()), autoOutAt: U.dt(new Date(Date.now() + 30 * 86400000)) });
                      log('重新纳入黑名单', b.name + ' · ' + b.sno);
                      UI.toast('已重新纳入', b.name, 'warn'); w.ZR.render();
                    }
                  });
                }
              }, '重新纳入')
            ]);
          }
        }
      ],
      rows: function () {
        var d = l;
        if (st.kw) d = d.filter(function (b) { return U.hitAny([b.name, b.sno, b.reason, b.college, b.className], st.kw); });
        if (st.status === 'active') d = d.filter(function (b) { return b.active; });
        if (st.status === 'out') d = d.filter(function (b) { return !b.active; });
        return d;
      },
      pageSize: 10, mini: true,
      empty: '暂无黑名单记录', emptySub: '缺勤达到规则阈值的学生会自动纳入'
    });
    host.appendChild(lister);

    host.appendChild(D.h('div.mt16', D.h('div.g3', DB.filter('actRules', function (r) { return r.type === '黑名单规则'; }).map(function (r) {
      return ruleCard(r, editParams);
    }))));
  }

  function addBlack() {
    var pick = '';
    var reason = '';
    var sOpts = DB.col('students').slice(0, 300).map(function (s) { return [s.id, s.name + '（' + s.sno + ' · ' + s.className + '）']; });
    var m = UI.modal({
      title: '手动纳入黑名单', size: 'slim',
      body: D.h('div', {},
        D.h('div.req-note', '手动纳入后该学生将无法报名新活动，到达解除时间后自动恢复；也可随时手动解除。'),
        D.h('div.mt12', UI.field({ label: '选择学生', required: true, control: UI.select({ options: sOpts, value: sOpts[0][0], onChange: function (v) { pick = v; } }) })),
        D.h('div.mt12', UI.field({ label: '纳入原因', required: true, control: UI.textarea({ rows: 3, placeholder: '例如：活动报名后无故缺席且未提前说明', onInput: function (e) { reason = e.target.value; } }) }))
      ),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-dan', {
          onclick: function () {
            pick = pick || sOpts[0][0];
            if (!String(reason).trim()) { UI.toast('请填写纳入原因', '', 'warn'); return; }
            var s = DB.get('students', pick);
            if (!s) { UI.toast('请选择学生', '', 'warn'); return; }
            if (DB.find('blacklist', function (b) { return b.studentId === s.id && b.active; })) {
              UI.toast('该学生已在黑名单中', s.name, 'warn'); return;
            }
            DB.insert('blacklist', {
              studentId: s.id, sno: s.sno, name: s.name, college: s.college, className: s.className,
              contact: s.contact, reason: reason, misses: 0, at: U.dt(new Date()),
              autoOutAt: U.dt(new Date(Date.now() + 30 * 86400000)), active: true,
              source: '管理员手动纳入', related: ''
            });
            log('手动纳入黑名单', s.name + ' · ' + s.sno + ' · ' + reason);
            UI.toast('已纳入黑名单', s.name + ' · 30 天后自动解除', 'ok');
            m.close(); w.ZR.render();
          }
        }, '确认纳入')
      ]
    });
  }

  function blackDetail(b) {
    var misses = DB.filter('signins', function (x) { return x.studentId === b.studentId && x.status === '缺勤'; });
    UI.modal({
      title: '黑名单明细 · ' + b.name, sub: b.sno + ' · ' + b.college + ' ' + b.className, size: 'wide',
      body: D.h('div', {},
        KP.kv([
          ['编号', b.id], ['学号', b.sno], ['学院 / 班级', b.college + ' · ' + b.className],
          ['联系方式', b.contact || '—'], ['纳入原因', b.reason], ['缺勤次数', U.int(b.misses, 0) + ' 次'],
          ['纳入时间', b.at], ['自动解除时间', b.autoOutAt], ['来源', b.source],
          ['关联活动', b.related || '—'], ['当前状态', b.active ? '在册（不可报名新活动）' : '已解除']
        ]),
        D.h('div.mt12', UI.card({
          title: '缺勤记录明细', sub: '共 ' + misses.length + ' 条', tight: true,
          body: misses.length ? UI.table({
            cols: [
              { t: '活动', render: function (x) { return KP.cell(x.actTitle, x.itemName || '', { clip: true }); } },
              { t: '应签到时间', k: 'at', w: 148 },
              { t: '状态', w: 92, render: function (x) { return KP.status(x.status); } },
              { t: '处理', w: 118, render: function (x) { return x.makeUp ? UI.tag('已补签', 'tag-ok') : UI.tag('未补签', 'tag-err'); } }
            ],
            rows: misses, mini: true, noCard: true
          }) : UI.empty('暂无缺勤记录')
        }))
      ),
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZUI.closeAllModals(); } }, '关闭')]
    });
  }

  /* ---------------- ③ 报名表单字段（拖拽排序） ---------------- */
  function fieldsOf() { return U.sortBy(DB.col('formFields'), function (f) { return U.int(f.sort, 99); }); }
  function persistOrder(list) {
    list.forEach(function (f, i) { DB.update('formFields', f.id, { sort: i + 1 }); });
  }
  function moveField(id, dir) {
    var l = fieldsOf();
    var i = l.findIndex(function (f) { return f.id === id; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return;
    var tmp = l[i]; l[i] = l[j]; l[j] = tmp;
    persistOrder(l);
    log('调整报名表单字段顺序', l.map(function (f) { return f.name; }).join(' → '));
  }
  function dropField(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    var l = fieldsOf();
    var fi = l.findIndex(function (f) { return f.id === fromId; });
    if (fi < 0) return;
    var moved = l.splice(fi, 1)[0];
    var ti = l.findIndex(function (f) { return f.id === toId; });
    l.splice(ti < 0 ? l.length : ti, 0, moved);
    persistOrder(l);
    log('拖拽调整报名表单字段顺序', moved.name + ' 移动到第 ' + (l.findIndex(function (f) { return f.id === moved.id; }) + 1) + ' 位');
  }

  function tabFields(host) {
    var list = fieldsOf();
    var enabled = list.filter(function (f) { return f.enabled; });
    var host2 = D.h('div');

    function paint() {
      D.fill(host2, null);
      D.appendChildDeep(host2, [
        D.h('div.req-note', '拖拽字段卡片可调整报名表单的填写顺序（也可用右侧 ↑↓ 按钮）。改动即时保存，学生在「活动广场」报名时看到的表单与这里的顺序、必填标记完全一致。系统内置字段不可删除，只能控制显示与必填。'),
        D.h('div.mt12', D.h('div.g-21', {},
          UI.card({
            title: '报名表单字段', sub: '共 ' + list.length + ' 个字段，启用 ' + enabled.length + ' 个',
            right: D.h('div.hd-r', {},
              D.h('button.btn.btn-sm', { onclick: function () { w.ZR.render(); } }, '↻ 刷新视图'),
              D.h('button.btn.btn-sm.btn-p', { onclick: addField }, '＋ 新增自定义字段')
            ),
            tight: true,
            body: D.h('div', {},
              list.map(function (f, i) {
                var isDrag = st.dragId === f.id;
                var isOver = st.dragOverId === f.id && st.dragId && st.dragId !== f.id;
                return D.h('div', {
                  draggable: 'true',
                  style: 'display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;margin-bottom:7px;' +
                    'border:1.5px ' + (isOver ? 'dashed #2563eb' : 'solid var(--line)') + ';' +
                    'background:' + (isDrag ? '#eff6ff' : (isOver ? '#f5f9ff' : '#fff')) + ';cursor:grab',
                  ondragstart: function (e) { st.dragId = f.id; if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', f.id); } catch (err) { } } },
                  ondragover: function (e) { if (e.preventDefault) e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; st.dragOverId = f.id; markOver(f.id, true); },
                  ondragleave: function () { markOver(f.id, false); },
                  ondrop: function (e) { if (e.preventDefault) e.preventDefault(); markOver(f.id, false); dropField(st.dragId, f.id); st.dragId = ''; st.dragOverId = ''; w.ZR.render(); },
                  ondragend: function () { st.dragId = ''; st.dragOverId = ''; }
                },
                  D.h('span', { style: 'color:var(--text3);font-size:15px;cursor:grab', title: '拖拽排序' }, '⠿'),
                  D.h('span', {
                    style: 'width:22px;height:22px;border-radius:6px;background:#eef3fa;color:var(--text2);font-size:11.5px;' +
                      'display:flex;align-items:center;justify-content:center;flex:0 0 22px;font-weight:650'
                  }, i + 1),
                  D.h('div', { style: 'flex:1;min-width:0' },
                    D.h('div', { style: 'display:flex;align-items:center;gap:7px;flex-wrap:wrap' },
                      D.h('span', { style: 'font-weight:650;font-size:13px' }, f.name),
                      UI.tag(f.type, 'tag-info'),
                      f.fromSystem ? UI.tag('系统字段', 'tag-purple') : UI.tag('自定义', 'tag-warn'),
                      f.required ? UI.tag('必填', 'tag-err') : null
                    ),
                    D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:3px' }, '所属分组：' + f.module + ' · 字段标识 ' + (f.key || '—'))
                  ),
                  D.h('label', { style: 'display:flex;align-items:center;gap:5px;font-size:11.8px;color:var(--text2)' },
                    D.h('input', {
                      type: 'checkbox', checked: !!f.enabled,
                      onchange: function (e) { DB.update('formFields', f.id, { enabled: e.target.checked }); log('切换表单字段启用', f.name); w.ZR.render(); }
                    }), '启用'),
                  D.h('label', { style: 'display:flex;align-items:center;gap:5px;font-size:11.8px;color:var(--text2)' },
                    D.h('input', {
                      type: 'checkbox', checked: !!f.required, disabled: !f.enabled,
                      onchange: function (e) { DB.update('formFields', f.id, { required: e.target.checked }); log('切换表单字段必填', f.name); w.ZR.render(); }
                    }), '必填'),
                  D.h('div.btn-row', {},
                    D.h('button.btn.btn-sm', { disabled: i === 0, onclick: function () { moveField(f.id, -1); w.ZR.render(); } }, '↑'),
                    D.h('button.btn.btn-sm', { disabled: i === list.length - 1, onclick: function () { moveField(f.id, 1); w.ZR.render(); } }, '↓'),
                    f.fromSystem ? null : D.h('button.btn.btn-sm.btn-dan', {
                      onclick: function () {
                        UI.confirm({
                          title: '删除自定义字段', danger: true, text: '确认删除字段「' + f.name + '」吗？',
                          onOk: function () { DB.remove('formFields', f.id); persistOrder(fieldsOf().filter(function (x) { return x.id !== f.id; })); log('删除表单字段', f.name); UI.toast('字段已删除', f.name, 'ok'); w.ZR.render(); }
                        });
                      }
                    }, '删除')
                  )
                );
              })
            )
          }),
          UI.card({
            title: '学生端表单实时预览', sub: '顺序与必填标记与左侧配置完全一致',
            right: D.h('div.hd-r', D.h('button.btn.btn-sm', { onclick: function () { st.preview = !st.preview; w.ZR.render(); } }, st.preview ? '隐藏预览' : '显示预览')),
            tight: true,
            body: st.preview ? D.h('div', {
              style: 'max-width:340px;margin:0 auto;border:1px solid var(--line);border-radius:12px;padding:13px;background:#fbfcfe'
            },
              D.h('div', { style: 'font-weight:700;font-size:13px;margin-bottom:9px' }, '活动报名表'),
              enabled.length ? D.h('div', {},
                enabled.map(function (f) {
                  var ctrl;
                  if (f.type === '多行输入') ctrl = UI.textarea({ rows: 2, placeholder: '请输入' + f.name });
                  else if (f.type === '下拉框') ctrl = UI.select({ options: [['', '请选择' + f.name]], value: '' });
                  else if (f.type === '日期区间') ctrl = D.h('div', { style: 'display:flex;gap:6px' }, UI.input({ type: 'date' }), UI.input({ type: 'date' }));
                  else if (f.type === '附件') ctrl = UI.input({ readonly: true, placeholder: '上传' + f.name });
                  else if (f.type === '联系人') ctrl = D.h('div', { style: 'display:flex;gap:6px' }, UI.input({ placeholder: '姓名' }), UI.input({ placeholder: '关系' }), UI.input({ placeholder: '电话' }));
                  else ctrl = UI.input({ placeholder: f.fromSystem ? '系统自动带入' : '请输入' + f.name, readonly: f.fromSystem });
                  return D.h('div', { style: 'margin-bottom:10px' },
                    D.h('div', { style: 'font-size:12px;color:var(--text2);margin-bottom:4px' }, f.name, f.required ? D.h('span', { style: 'color:#dc2626' }, ' *') : null),
                    ctrl
                  );
                })
              ) : UI.empty('未启用任何字段'),
              D.h('button.btn.btn-p.btn-block', { style: 'margin-top:6px' }, '提交报名')
            ) : UI.empty('预览已隐藏', '点击右上角「显示预览」查看')
          })
        ))
      ]);
    }
    function markOver(id, on) {
      /* 拖拽悬停视觉反馈：直接操作 DOM，不触发整页重渲染 */
      var nodes = [];
      try { nodes = D.qa('[draggable="true"]', host2); } catch (e) { return; }
      nodes.forEach(function (n) {
        n.style.borderStyle = 'solid';
        n.style.borderColor = 'var(--line)';
      });
      if (!on) return;
      nodes.forEach(function (n, i) {
        if (list[i] && list[i].id === id) { n.style.borderStyle = 'dashed'; n.style.borderColor = '#2563eb'; }
      });
    }
    paint();
    host.appendChild(host2);

    host.appendChild(D.h('div.mt16', UI.card({
      title: '字段配置说明', tight: true,
      body: D.h('div', { style: 'font-size:12.2px;line-height:1.95;color:var(--text2)' },
        D.h('div', '· <b>基本信息组</b>：姓名、学号、学院、专业班级为系统字段，报名时自动带入学籍数据，不可删除'),
        D.h('div', '· <b>报名信息组</b>：个人简介、特长技能、紧急联系人、免责承诺书等可按活动类型增删'),
        D.h('div', '· <b>签到 / 签退组</b>：签到时段、签到方式、签退确认为签到流程的系统字段'),
        D.h('div', '· 字段顺序决定学生在移动端填写表单时的呈现顺序，建议把必填项放在前 3 项')
      )
    })));
  }

  function addField() {
    var d = { name: '', type: '单行输入', module: '报名信息', required: false, key: '' };
    var host = D.h('div');
    D.appendChildDeep(host, D.h('div.frm.c2', {},
      UI.field({ label: '字段名称', required: true, control: UI.input({ placeholder: '例如：参赛项目', onInput: function (e) { d.name = e.target.value; } }) }),
      UI.field({
        label: '字段类型', required: true,
        control: UI.select({
          options: ['单行输入', '多行输入', '下拉框', '日期', '日期区间', '附件', '联系人'].map(function (t) { return [t, t]; }),
          value: d.type, onChange: function (v) { d.type = v; }
        })
      }),
      UI.field({ label: '所属分组', control: UI.select({ options: [['基本信息', '基本信息'], ['报名信息', '报名信息'], ['签到 / 签退', '签到 / 签退']], value: d.module, onChange: function (v) { d.module = v; } }) }),
      UI.field({ label: '字段标识', control: UI.input({ placeholder: '英文标识，留空自动生成', onInput: function (e) { d.key = e.target.value; } }) }),
      UI.field({ label: '是否必填', control: UI.chips({ value: d.required ? '是' : '否', options: ['是', '否'], onChange: function (v) { d.required = v === '是'; } }) })
    ));
    var m = UI.modal({
      title: '新增报名表单字段', size: 'wide', body: host,
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            if (!String(d.name).trim()) { UI.toast('请填写字段名称', '', 'warn'); return; }
            if (DB.find('formFields', function (f) { return f.name === d.name; })) { UI.toast('字段名称已存在', d.name, 'warn'); return; }
            var list = fieldsOf();
            DB.insert('formFields', {
              name: d.name, key: d.key || ('custom' + (list.length + 1)), type: d.type,
              module: d.module, required: d.required, enabled: true, fromSystem: false, sort: list.length + 1
            });
            log('新增报名表单字段', d.name + ' · ' + d.type);
            UI.toast('字段已添加', d.name + ' · 已启用并排在末位', 'ok');
            m.close(); w.ZR.render();
          }
        }, '确认添加')
      ]
    });
  }

  /* ---------------- ④ 自动通知条件 ---------------- */
  function tabNotify(host) {
    var l = DB.filter('actRules', function (r) { return r.type === '通知条件'; });
    host.appendChild(D.h('div.req-note', '通知条件决定「在什么时机、通过哪些渠道、通知谁」。开启后由系统在对应事件发生时自动发送，发送记录可在「消息通知」中查看已读 / 未读统计。'));
    host.appendChild(D.h('div.mt12', D.h('div.g3', l.map(function (r) { return ruleCard(r, editParams); }))));

    /* 真实发送效果统计（读取消息中心的真实数据） */
    var msgs = DB.col('msgs');
    host.appendChild(D.h('div.mt16', UI.card({
      title: '通知发送效果', sub: '按消息中心的真实发送与阅读数据统计',
      body: D.h('div', {},
        D.h('div.g4', {},
          UI.stat({ ic: '📨', label: '累计发送', num: msgs.reduce(function (a, m) { return a + U.int(m.total, 0); }, 0), unit: '条', fg: '#2563eb', bg: '#eff6ff', foot: msgs.length + ' 个通知任务' }),
          UI.stat({ ic: '✅', label: '已读', num: msgs.reduce(function (a, m) { return a + U.int(m.readCount, 0); }, 0), unit: '条', fg: '#059669', bg: '#ecfdf5' }),
          UI.stat({ ic: '🔵', label: '未读', num: msgs.reduce(function (a, m) { return a + U.int(m.unreadCount, 0); }, 0), unit: '条', fg: '#d97706', bg: '#fffbeb' }),
          UI.stat({ ic: '📊', label: '平均阅读率', num: (function () {
            var t = msgs.reduce(function (a, m) { return a + U.int(m.total, 0); }, 0);
            var r = msgs.reduce(function (a, m) { return a + U.int(m.readCount, 0); }, 0);
            return t ? (r / t * 100).toFixed(1) : '0.0';
          })(), unit: '%', fg: '#7c3aed', bg: '#f5f3ff' })
        ),
        D.h('div.mt12', C.bars(U.uniq(msgs.map(function (m) { return m.type; })).map(function (t, i) {
          var sub = msgs.filter(function (m) { return m.type === t; });
          return { n: t, v: sub.reduce(function (a, m) { return a + U.int(m.total, 0); }, 0), c: C.color(i) };
        }), { unit: ' 条', labelW: 92, bh: 17, gap: 9 }))
      ),
      note: C.legend([{ n: '按通知类型统计累计发送量', c: C.color(0) }])
    })));
  }

  /* ---------------- ⑤ 学分项目库 ---------------- */
  function tabProjects(host) {
    var l = DB.col('creditProjects');
    var catStd = (DB.scheme() || {}).catStandard || {};
    host.appendChild(D.h('div.req-note', '学分项目库定义「做什么事可以拿多少学分」。一级项目对应六大素养类别，二级项目是具体的活动 / 荣誉 / 实践类型，其参考分值是活动申报时认定分值上下浮动的基础。'));
    host.appendChild(D.h('div.mt12', KP.kpis(DB.col('cats').map(function (c, i) {
      var sub = l.filter(function (p) { return p.cat === c.name; });
      return {
        ic: '📚', label: c.name, num: sub.length, unit: '个项目',
        fg: c.color, bg: c.lc, foot: '类别标准 ' + U.num(catStd[c.name] || 0) + ' 学分'
      };
    }), 'g3')));
    DB.col('cats').forEach(function (c) {
      var l1 = l.filter(function (p) { return p.cat === c.name && U.int(p.level, 1) === 1; });
      var l2 = l.filter(function (p) { return p.cat === c.name && U.int(p.level, 2) === 2; });
      host.appendChild(D.h('div.mt16', UI.card({
        title: c.name + ' · 学分项目', sub: '一级项目 ' + l1.length + ' 个 · 二级项目 ' + l2.length + ' 个 · 类别达标线 ' + U.num(catStd[c.name] || 0) + ' 学分',
        right: D.h('div.hd-r', D.h('span.tag', { style: 'background:' + c.lc + ';color:' + c.color }, '参考标准 ' + U.num(catStd[c.name] || 0) + ' 分')),
        flush: true,
        body: UI.table({
          cols: [
            { t: '层级', w: 82, render: function (p) { return UI.tag(U.int(p.level, 1) === 1 ? '一级' : '二级', U.int(p.level, 1) === 1 ? 'tag-purple' : 'tag-info'); } },
            { t: '项目名称', render: function (p) { return D.h('span', { style: 'font-weight:' + (U.int(p.level, 1) === 1 ? '700' : '500') + ';padding-left:' + (U.int(p.level, 1) === 2 ? '18px' : '0') }, p.name); } },
            { t: '项目编号', k: 'id', w: 108 },
            { t: '所属类别', k: 'cat', w: 118, render: function (p) { return KP.catTag(p.cat); } },
            { t: '参考分值', w: 110, align: 'right', render: function (p) { return KP.numCell(p.ref, '学分', { color: c.color }); } },
            { t: '上级项目', w: 168, render: function (p) { var par = DB.get('creditProjects', p.parent); return par ? par.name : D.h('span.muted', '（顶层）'); } },
            { t: '折算', w: 176, render: function (p) {
              var sc = DB.scheme() || { convert: { hoursPerCredit: 16, pointsPerCredit: 10 } };
              return D.h('span', { style: 'font-size:11.8px;color:var(--text3)' }, U.num(p.ref) * U.num(sc.convert.hoursPerCredit) + ' 学时 / ' + U.num(p.ref) * U.num(sc.convert.pointsPerCredit) + ' 积分');
            } }
          ],
          rows: l1.concat(l2), mini: true, noCard: true,
          footNote: '共 ' + (l1.length + l2.length) + ' 个项目'
        })
      })));
    });
  }

  /* ---------------- 渲染 ---------------- */
  function render(host) {
    var TABS = [
      { k: 'enroll', n: '报名规则', cnt: DB.filter('actRules', function (r) { return r.type === '报名规则'; }).length },
      { k: 'black', n: '黑名单管理', cnt: DB.count('blacklist', function (b) { return b.active; }) },
      { k: 'fields', n: '报名表单字段', cnt: DB.count('formFields', function (f) { return f.enabled; }) },
      { k: 'notify', n: '自动通知条件', cnt: DB.filter('actRules', function (r) { return r.type === '通知条件'; }).length },
      { k: 'projects', n: '学分项目库', cnt: DB.col('creditProjects').length }
    ];
    if (TABS.every(function (t) { return t.k !== st.tab; })) st.tab = 'enroll';

    host.appendChild(UI.pageHd({
      crumb: '<b>活动运营</b> / 活动规则设置',
      title: '活动规则设置',
      desc: '报名规则 · 黑名单 · 报名表单字段 · 自动通知条件 · 学分项目库 · 规则改动即时生效并留痕',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('square'); } }, '去活动广场验证'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('actmgr'); } }, '活动管理'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { w.ZR.go('flow'); } }, '党团审批工具')
      ]
    }));

    host.appendChild(D.h('div.mt16', KP.kpis([
      { ic: '⚙', label: '启用中的规则', num: DB.count('actRules', function (r) { return r.enabled; }), unit: '条', fg: '#2563eb', bg: '#eff6ff', foot: '共 ' + DB.col('actRules').length + ' 条规则' },
      { ic: '🚫', label: '黑名单在册', num: DB.count('blacklist', function (b) { return b.active; }), unit: '人', fg: '#dc2626', bg: '#fef2f2', foot: '到期自动解除' },
      { ic: '📝', label: '启用表单字段', num: DB.count('formFields', function (f) { return f.enabled; }), unit: '个', fg: '#0891b2', bg: '#ecfeff', foot: '共 ' + DB.col('formFields').length + ' 个字段' },
      { ic: '🔔', label: '通知条件', num: DB.filter('actRules', function (r) { return r.type === '通知条件' && r.enabled; }).length, unit: '条', fg: '#d97706', bg: '#fffbeb', foot: '多渠道触达' },
      { ic: '📚', label: '学分项目', num: DB.col('creditProjects').length, unit: '个', fg: '#7c3aed', bg: '#f5f3ff', foot: '覆盖六大素养类别' }
    ], 'g5')));

    var tabHost = D.h('div.mt16');
    var bodyHost = D.h('div.mt12');
    D.fill(tabHost, UI.tabs({ items: TABS, cur: st.tab, onChange: function (k) { st.tab = k; st.dragId = ''; w.ZR.render(); } }));
    host.appendChild(tabHost);
    host.appendChild(bodyHost);

    if (st.tab === 'enroll') tabEnroll(bodyHost);
    if (st.tab === 'black') tabBlack(bodyHost);
    if (st.tab === 'fields') tabFields(bodyHost);
    if (st.tab === 'notify') tabNotify(bodyHost);
    if (st.tab === 'projects') tabProjects(bodyHost);
  }

  w.ZKP.pages({
    rule: {
      title: '活动规则设置', group: '活动运营',
      render: render
    }
  });
})(window);
