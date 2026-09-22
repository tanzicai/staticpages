/* ==========================================================================
   user.js —— 用户管理（组织架构 / 用户账号 / 角色权限）
   对应演示项【2.1 第一步】：
   «演示组织架构、用户角色权限…»
   · 组织架构：按学校 → 二级学院 → 专业 → 班级四级真实渲染组织树，
     每个节点显示在册人数与负责人；点击节点筛选右侧人员列表。
   · 用户账号：教职工与学生两类账号统一维护，支持按学院 / 角色 / 关键词筛选、
     新增用户、变更角色、启用停用、重置登录口令（均真实写入数据并留痕）。
   · 角色权限：6 个角色，权限矩阵按「模块 × 操作」可视化勾选，
     数据范围（全校 / 本学院 / 本人 / 本人负责活动）可切换并保存；
     每个角色可展开查看权限明细与成员构成。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { tab: 'org', orgId: 'ROOT', kind: 'staff', college: '', roleId: '', kw: '', roleDetail: '' };

  /** 权限矩阵的模块清单（与角色 perms 里的 m 对应） */
  var PERM_MODULES = [
    '运行总览', '组织与用户', '角色权限', '考核方案', '活动创建 / 申报', '报名管理', '签到管理',
    '作品评审', '活动发布与审核', '分值申报', '分值申报审核', '成绩管理', '成绩单模板', '预警管理',
    '统计分析', '内容安全', '门户配置', '数据大屏', 'AI 助手', '社团管理', '党团管理', '消息通知', '日志审计'
  ];
  var PERM_ACTS = ['查看', '新增', '编辑', '删除', '审核', '导出', '导入'];
  /** 数据范围候选 */
  var SCOPES = ['全校', '本学院', '本人负责活动', '本人'];

  function roles() { return DB.col('roles'); }
  function staff() { return KP.scopeFilter(DB.col('staff')); }
  function students() { return KP.scopeFilter(DB.col('students')); }
  function tree() { return DB.data.orgTree || []; }

  /* ===================== 组织架构工具 ===================== */
  function findNode(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
      var hit = findNode(list[i].children || [], id);
      if (hit) return hit;
    }
    return null;
  }
  function nodePath(list, id, acc) {
    acc = acc || [];
    for (var i = 0; i < list.length; i++) {
      var p = acc.concat([list[i]]);
      if (list[i].id === id) return p;
      var hit = nodePath(list[i].children || [], id, p);
      if (hit) return hit;
    }
    return null;
  }
  function countNodes(list) {
    var n = 0;
    (list || []).forEach(function (x) { n += 1 + countNodes(x.children || []); });
    return n;
  }
  /** 选中节点对应的人员筛选（按节点类型落到不同字段） */
  function peopleOfNode(nodeId) {
    var path = nodePath(tree(), nodeId) || [];
    var node = path[path.length - 1];
    if (!node) return { staff: staff(), students: students(), label: '全部' };
    if (node.type === '学校') return { staff: staff(), students: students(), label: '全校' };
    if (node.type === '二级学院') {
      return {
        staff: staff().filter(function (s) { return s.college === node.name; }),
        students: students().filter(function (s) { return s.college === node.name; }),
        label: node.name
      };
    }
    if (node.type === '专业') {
      return {
        staff: staff().filter(function (s) { return s.dept && s.dept.indexOf(node.name) >= 0; }),
        students: students().filter(function (s) { return s.major === node.name; }),
        label: node.name
      };
    }
    return {
      staff: [],
      students: students().filter(function (s) { return s.className === node.name; }),
      label: node.name
    };
  }

  /* ===================== 一、组织架构 ===================== */
  function orgTab(host, rerender) {
    var host2 = D.h('div.org');
    host2.appendChild(D.h('div.org-c', renderTree(tree(), 0, rerender)));
    var right = D.h('div.org-r');
    var info = peopleOfNode(st.orgId);
    right.appendChild(UI.card({
      title: '当前节点：' + info.label,
      sub: '在册教职工 ' + info.staff.length + ' 人 · 在册学生 ' + info.students.length + ' 人',
      body: D.h('div', {}, (function () {
        var path = nodePath(tree(), st.orgId) || [];
        var node = path[path.length - 1] || {};
        return D.h('div', {},
          D.h('div.crumb', { style: 'margin-bottom:10px' }, path.map(function (p) { return U.esc(p.name); }).join(' <i>›</i> ')),
          UI.kv([
            ['节点名称', node.name || '—'],
            ['节点类型', node.type || '—'],
            ['负责人 / 班主任', node.leader || '—'],
            ['在册人数', U.fmt(node.size || 0) + ' 人'],
            ['下辖节点', ((node.children || []).length) + ' 个'],
            ['层级', (path.length) + ' 级']
          ]));
      })())
    }));
    /* 该节点下的人员 */
    if (info.staff.length) {
      right.appendChild(D.h('div', { style: 'height:12px' }));
      right.appendChild(UI.card({
        title: '教职工', sub: info.staff.length + ' 人', flush: true,
        body: D.h('table.tbl.mini',
          D.h('thead', D.h('tr', ['姓名', '工号', '职务', '所属部门', '角色'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', info.staff.slice(0, 14).map(function (s) {
            return D.h('tr', [
              D.h('td', {}, s.name), D.h('td', {}, s.no), D.h('td', {}, s.title),
              D.h('td', { style: 'font-size:11.5px' }, s.dept || s.college),
              D.h('td', { style: 'font-size:11.5px' }, (s.roleIds || []).map(function (id) {
                var r = DB.get('roles', id); return r ? r.name : id;
              }).join('、'))
            ]);
          })))
      }));
    }
    if (info.students.length) {
      right.appendChild(D.h('div', { style: 'height:12px' }));
      right.appendChild(UI.card({
        title: '在册学生', sub: '共 ' + info.students.length + ' 人（展示前 12 人）', flush: true,
        body: D.h('table.tbl.mini',
          D.h('thead', D.h('tr', ['姓名', '学号', '班级', '年级', '学分'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', info.students.slice(0, 12).map(function (s) {
            var agg = DB.aggOf(s.id);
            return D.h('tr', [
              D.h('td', {}, s.name), D.h('td', {}, s.sno),
              D.h('td', { style: 'font-size:11.5px' }, s.className), D.h('td', {}, s.grade),
              D.h('td', {}, KP.numCell(agg.total, '学分'))
            ]);
          })))
      }));
    }
    host2.appendChild(right);
    host.appendChild(host2);

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g4', {},
      UI.stat({ label: '组织节点总数', num: countNodes(tree()), unit: '个', ic: '🏛', fg: '#2563eb', bg: '#eff6ff', foot: '四级组织架构' }),
      UI.stat({ label: '二级学院', num: (tree()[0] ? tree()[0].children.length : 0), unit: '个', ic: '🏫', fg: '#059669', bg: '#ecfdf5' }),
      UI.stat({ label: '专业数量', num: DB.col('majors').length, unit: '个', ic: '📚', fg: '#7c3aed', bg: '#f5f3ff' }),
      UI.stat({ label: '班级数量', num: DB.col('classes').length, unit: '个', ic: '👥', fg: '#d97706', bg: '#fff8eb' })
    ));
  }

  /** 组织树（递归渲染，可展开收起） */
  function renderTree(list, depth, rerender) {
    var host = D.h('div.org-nodes' + (depth ? '.sub' : ''));
    list.forEach(function (n) {
      var kids = n.children || [];
      var isCur = st.orgId === n.id;
      var row = D.h('div.org-n', { style: isCur ? 'background:var(--primary-l);border-color:#bfd7fb' : null },
        D.h('span.org-tg', {
          onclick: function (e) {
            e.stopPropagation();
            nodeOpen[n.id] = !nodeOpen[n.id];
            rerender();
          }
        }, kids.length ? (nodeOpen[n.id] ? '▾' : '▸') : '·'),
        D.h('span.org-i', { class: 'org-type-' + n.type }, n.type === '学校' ? '校' : (n.type === '二级学院' ? '院' : (n.type === '专业' ? '专' : '班'))),
        D.h('div', { style: 'flex:1;min-width:0' },
          D.h('div', { style: 'font-size:12.6px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, n.name),
          D.h('div', { style: 'font-size:11px;color:var(--text3)' }, '负责人：' + (n.leader || '—'))),
        D.h('span.org-cnt', U.fmt(n.size || 0))
      );
      row.addEventListener('click', function () { st.orgId = n.id; rerender(); });
      host.appendChild(row);
      if (kids.length && nodeOpen[n.id]) host.appendChild(renderTree(kids, depth + 1, rerender));
    });
    return host;
  }
  var nodeOpen = {};

  /* ===================== 二、用户账号 ===================== */
  function usersFiltered() {
    var l = st.kind === 'staff' ? staff() : students();
    if (st.college) l = l.filter(function (x) { return x.college === st.college; });
    if (st.roleId) {
      var role = DB.get('roles', st.roleId);
      if (role) l = l.filter(function (x) {
        if (st.kind === 'staff') return (x.roleIds || []).indexOf(st.roleId) >= 0;
        return role.key === 'student';
      });
    }
    if (st.kw) l = l.filter(function (x) {
      return U.hitAny([x.name, x.no, x.sno, x.account, x.title, x.college, x.className, x.dept], st.kw);
    });
    return l;
  }

  function usersTab(host, rerender) {
    host.appendChild(UI.card({
      title: st.kind === 'staff' ? '教职工账号' : '学生账号',
      sub: '共 ' + usersFiltered().length + ' 个账号 · 数据范围 ' + ZA.scopeText(),
      flush: true,
      right: D.h('div', { style: 'display:flex;gap:8px' },
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { addUser(rerender); } }, '＋ 新增用户')),
      body: KP.lister({
        noCard: true, pageSize: 12,
        filters: function (s2, refresh) {
          return UI.filterBar([
            { type: 'select', options: [['staff', '教职工'], ['student', '学生']], value: st.kind, onChange: function (v) { st.kind = v; refresh(); } },
            { type: 'select', options: [['', '全部学院']].concat(DB.col('colleges').map(function (c) { return [c.name, c.name]; })), value: st.college, onChange: function (v) { st.college = v; refresh(); } },
            { type: 'select', options: [['', '全部角色']].concat(roles().map(function (r) { return [r.id, r.name]; })), value: st.roleId, onChange: function (v) { st.roleId = v; refresh(); } },
            { type: 'input', ph: '姓名 / 工号 / 学号 / 账号…', onChange: U.debounce(function (v) { st.kw = v; refresh(); }, 220) }
          ], {
            right: [
              KP.exportBtn('导出用户清单', [
                { t: '姓名', k: 'name' },
                { t: st.kind === 'staff' ? '工号' : '学号', raw: function (x) { return x.no || x.sno; } },
                { t: '登录账号', k: 'account' },
                { t: '性别', k: 'gender' },
                { t: '学院', k: 'college' },
                { t: '职务 / 班级', raw: function (x) { return x.title || x.className; } },
                { t: '所属部门', raw: function (x) { return x.dept || x.major; } },
                { t: '角色', raw: function (x) { return st.kind === 'staff' ? (x.roleIds || []).map(function (id) { var r = DB.get('roles', id); return r ? r.name : id; }).join('、') : '学生'; } },
                { t: '联系方式', k: 'contact' }
              ], function () { return usersFiltered(); })
            ]
          });
        },
        cols: [
          { t: '用户', w: 168, render: function (x) { return KP.who(x.name, (x.no || x.sno) + ' · ' + (x.gender || '')); } },
          { t: '登录账号', w: 120, render: function (x) { return D.h('span', { style: 'font-family:ui-monospace,Menlo,monospace;font-size:12px' }, x.account || x.sno); } },
          { t: '学院 / 班级', w: 210, render: function (x) { return KP.cell(x.college, x.className || x.dept || x.major); } },
          {
            t: '角色', w: 168, render: function (x) {
              if (st.kind !== 'staff') return UI.tag('学生', 'tag-info');
              return D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' }, (x.roleIds || []).map(function (id) {
                var r = DB.get('roles', id);
                return UI.tag(r ? r.name : id, r && r.key === 'admin' ? 'tag-purple' : '');
              }));
            }
          },
          { t: '状态', w: 82, render: function (x) { return KP.status(x.status === '停用' ? '停用' : '正常'); } },
          { t: '联系方式', w: 120, render: function (x) { return D.h('span.muted', x.contact || '—'); } },
          {
            t: '操作', w: 202, render: function (x) {
              return KP.acts([
                KP.btn('详情', function () { userDetail(x, rerender); }),
                KP.btn('改角色', function () { changeRole(x, rerender); }),
                KP.btn('重置口令', function () {
                  UI.confirm({
                    title: '重置登录口令',
                    text: '将重置「' + x.name + '」的登录口令为初始口令，用户下次登录后需修改。',
                    onOk: function () {
                      x.pwResetAt = U.dt(new Date());
                      x.pw = x.account || x.sno;
                      DB.touch(st.kind === 'staff' ? 'staff' : 'students', x);
                      log('重置用户口令', x.name + '（' + (x.account || x.sno) + '）');
                      UI.toast('口令已重置', x.name + ' 的初始口令已下发', 'ok');
                      rerender();
                    }
                  });
                }),
                KP.btn(x.status === '停用' ? '启用' : '停用', function () {
                  if (x.status === '停用') { x.status = '在籍'; UI.toast('账号已启用', x.name, 'ok'); }
                  else { x.status = '停用'; UI.toast('账号已停用', x.name + ' 将无法登录', 'warn'); }
                  x.statusChangedAt = U.dt(new Date());
                  DB.touch(st.kind === 'staff' ? 'staff' : 'students', x);
                  log(x.status === '停用' ? '停用用户账号' : '启用用户账号', x.name);
                  rerender();
                })
              ]);
            }
          }
        ],
        rows: function () { return usersFiltered(); },
        empty: '没有符合条件的用户', emptySub: '可调整学院、角色或关键词'
      })
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g3', {},
      UI.card({
        title: '用户构成', sub: '教职工与学生账号数量',
        body: D.h('div', {},
          C.donut([
            { n: '学生账号', v: DB.col('students').length, c: C.color(0) },
            { n: '教职工账号', v: DB.col('staff').length, c: C.color(1) }
          ], { size: 176 }),
          C.legend([
            { n: '学生账号', v: DB.col('students').length, c: C.color(0) },
            { n: '教职工账号', v: DB.col('staff').length, c: C.color(1) }
          ]))
      }),
      UI.card({
        title: '教职工角色分布', sub: '按角色统计人数',
        body: C.bars(roles().map(function (r, i) {
          return { n: r.name, v: U.num(r.memberCount), c: C.color(i) };
        }), { labelW: 100, bh: 17 })
      }),
      UI.card({
        title: '学院人数分布', sub: '各二级学院学生与教职工',
        body: D.h('div', {}, C.bars(DB.col('colleges').map(function (c) {
          return { n: c.name.replace('学院', ''), v: DB.count('students', function (s) { return s.college === c.name; }) };
        }), { labelW: 66, bh: 15 }),
          D.h('div.dk-tip', '教职工共 ' + DB.col('staff').length + ' 人，分布于校团委与各二级学院。'))
      })
    ));
  }

  function userDetail(x, rerender) {
    var isStaff = st.kind === 'staff';
    var agg = isStaff ? null : DB.aggOf(x.id);
    var m = UI.modal({
      title: x.name + ' · 账号详情',
      sub: (isStaff ? '教职工账号' : '学生账号') + ' · 登录账号 ' + (x.account || x.sno),
      size: 'wide',
      body: [
        UI.kv([
          ['姓名', x.name],
          [isStaff ? '工号' : '学号', x.no || x.sno || '—'],
          ['登录账号', x.account || x.sno || '—'],
          ['性别', x.gender || '—'],
          ['学院', x.college || '—'],
          [isStaff ? '职务' : '班级', (x.title || x.className) || '—'],
          [isStaff ? '所属部门' : '专业', (x.dept || x.major) || '—'],
          ['联系方式', x.contact || '—'],
          ['账号状态', x.status === '停用' ? '已停用' : '正常'],
          ['角色', isStaff ? (x.roleIds || []).map(function (id) { var r = DB.get('roles', id); return r ? r.name : id; }).join('、') : '学生'],
          ['最近口令重置', x.pwResetAt || '—']
        ]),
        agg ? D.h('div', {}, KP.h5('第二课堂成绩'),
          KP.kpis([
            { label: '累计学分', num: agg.total, unit: '学分', ic: '🎓', fg: '#2563eb', bg: '#eff6ff' },
            { label: '累计学时', num: U.round(agg.total * 16, 0), unit: '学时', ic: '⏱', fg: '#059669', bg: '#ecfdf5' },
            { label: '累计积分', num: U.round(agg.total * 10, 0), unit: '积分', ic: '⭐', fg: '#d97706', bg: '#fff8eb' },
            {
              label: '达标状态', num: agg.total >= U.num(DB.scheme().standard.pass) ? 1 : 0,
              unit: agg.total >= U.num(DB.scheme().standard.pass) ? ' 项达标' : ' 项未达标',
              ic: agg.total >= U.num(DB.scheme().standard.pass) ? '✅' : '⚠️',
              fg: agg.total >= U.num(DB.scheme().standard.pass) ? '#059669' : '#dc2626',
              bg: agg.total >= U.num(DB.scheme().standard.pass) ? '#ecfdf5' : '#fef2f2'
            }
          ], 'g4')) : null,
        KP.h5('该账号的操作留痕'),
        D.h('div', {}, (function () {
          var l = DB.col('logs').filter(function (g) { return g.actor === x.name; });
          if (!l.length) return UI.empty('暂无操作记录', '该账号尚未在系统中产生操作');
          return D.h('div', { html: KP.tableHTML([
            { t: '时间', k: 'at' }, { t: '模块', k: 'module' }, { t: '动作', k: 'action' }, { t: '对象', k: 'target' }, { t: '结果', k: 'result' }
          ], l.slice(0, 10)) });
        })())
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); changeRole(x, rerender); } }, '变更角色')
      ]
    });
  }

  function changeRole(x, rerender) {
    var isStaff = st.kind === 'staff';
    if (!isStaff) { UI.toast('学生账号角色固定', '学生在系统中统一使用「学生」角色与本人数据范围', 'info'); return; }
    var chips = UI.chips({ multi: true, value: (x.roleIds || []).slice(), options: roles().map(function (r) { return [r.id, r.name]; }) });
    var m = UI.formModal({
      title: '变更用户角色',
      sub: x.name + ' · ' + (x.title || ''),
      fields: [
        { label: '授予角色（可多选）', control: chips, span: true, hint: '多角色时用户登录后可在顶栏切换身份视角。' }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var v = chips._v || [];
            if (!v.length) { UI.toast('请至少选择一个角色', '', 'warn'); return; }
            x.roleIds = v;
            DB.touch('staff', x);
            log('变更用户角色', x.name + ' → ' + v.map(function (id) { var r = DB.get('roles', id); return r ? r.name : id; }).join('、'));
            m.close();
            UI.toast('角色已更新', x.name + ' 现具备 ' + v.length + ' 个角色', 'ok');
            rerender();
          }
        }, '保存角色')
      ]
    });
  }

  function addUser(rerender) {
    var isStaff = st.kind === 'staff';
    if (!isStaff) { UI.toast('学生账号由学籍数据同步', '新增学生请在学籍系统中导入后同步', 'info'); return; }
    var nm = UI.input({ placeholder: '请输入姓名' });
    var ac = UI.input({ placeholder: '登录账号，如 teacher10' });
    var collegeSel = UI.select({ options: DB.col('colleges').map(function (c) { return [c.name, c.name]; }).concat([['校团委', '校团委']]), value: DB.col('colleges')[0].name });
    var titleSel = UI.select({
      options: ['系统管理员', '二级学院管理员', '团总支书记', '活动组织者', '分值审核员'].map(function (t) { return [t, t]; }),
      value: '活动组织者'
    });
    var roleChips = UI.chips({ multi: true, value: ['R_ORG'], options: roles().map(function (r) { return [r.id, r.name]; }) });
    var m = UI.formModal({
      title: '新增教职工用户',
      sub: '创建后即可使用该账号登录系统',
      fields: [
        { label: '姓名', required: true, control: nm },
        { label: '登录账号', required: true, control: ac },
        { label: '所属学院 / 部门', control: collegeSel },
        { label: '职务', control: titleSel },
        { label: '授予角色', control: roleChips, span: true }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var name = nm.value.trim(), account = ac.value.trim();
            if (!name) { UI.toast('请填写姓名', '', 'warn'); return; }
            if (!account) { UI.toast('请填写登录账号', '', 'warn'); return; }
            if (DB.col('staff').some(function (s) { return s.account === account; })) { UI.toast('该登录账号已存在', account, 'warn'); return; }
            var seq = DB.col('staff').length + 1;
            DB.insert('staff', {
              no: 'gh' + U.pad(seq, 4), name: name, account: account, pw: account,
              gender: (seq % 2) ? '男' : '女', title: titleSel.value,
              collegeId: (function () { var c = DB.find('colleges', function (x) { return x.name === collegeSel.value; }); return c ? c.id : ''; })(),
              college: collegeSel.value, roleIds: roleChips._v || [], contact: '188****' + U.pad(seq * 7 % 10000, 4),
              dept: collegeSel.value + ' · ' + titleSel.value
            });
            log('新增用户账号', name + '（' + account + '）');
            m.close();
            UI.toast('用户已创建', name + ' 的登录账号为 ' + account, 'ok');
            rerender();
          }
        }, '创建用户')
      ]
    });
  }

  /* ===================== 三、角色权限 ===================== */
  function rolesTab(host, rerender) {
    host.appendChild(D.h('div.g3', {}, roles().map(function (r) {
      return UI.card({
        title: r.name,
        sub: r.dataScope + ' · ' + r.memberCount + ' 人' + (r.builtin ? ' · 内置角色' : ''),
        right: UI.tag(r.builtin ? '内置' : '自定义', r.builtin ? 'tag-info' : 'tag-purple'),
        body: D.h('div', {},
          UI.kv([
            ['角色标识', r.key],
            ['数据范围', r.dataScope],
            ['成员数量', U.fmt(r.memberCount) + ' 人'],
            ['权限模块', (r.perms || []).length + ' 个'],
            ['权限项', U.sum(r.perms || [], function (p) { return (p.a || []).length; }) + ' 项']
          ]),
          D.h('div', { style: 'margin-top:10px;display:flex;gap:8px' },
            D.h('button.btn.btn-sm', { onclick: function () { st.roleId = r.id; roleMatrix(r, rerender); } }, '编辑权限'),
            D.h('button.btn.btn-sm', { onclick: function () { roleMembers(r); } }, '查看成员'),
            !r.builtin ? D.h('button.btn.btn-sm', {
              onclick: function () {
                UI.confirm({
                  title: '删除角色', text: '确定删除自定义角色「' + r.name + '」吗？', danger: true,
                  onOk: function () { DB.remove('roles', r.id); log('删除角色', r.name); UI.toast('角色已删除', r.name, 'info'); rerender(); }
                });
              }
            }, '删除') : null)
        )
      });
    })));

    var headCells = [D.h('th', '角色 / 模块')].concat(PERM_MODULES.map(function (m0) {
      return D.h('th', { style: 'font-size:11px;white-space:nowrap' }, m0.replace(' / ', '/'));
    }));
    var bodyRows = roles().map(function (r) {
      var map = {};
      (r.perms || []).forEach(function (p) { map[p.m] = (p.a || []).length; });
      var cells = [D.h('td', { style: 'font-weight:600;white-space:nowrap' }, r.name)];
      PERM_MODULES.forEach(function (m0) {
        var n = map[m0] || 0;
        cells.push(D.h('td', {
          style: 'text-align:center;' + (n ? 'background:#eff6ff;color:#2563eb;font-weight:600' : 'color:#cbd5e1')
        }, n || '·'));
      });
      return D.h('tr', cells);
    });
    var matrix = D.h('table.tbl.mini', D.h('thead', D.h('tr', headCells)), D.h('tbody', bodyRows));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '角色权限总览矩阵',
      sub: '行 = 角色，列 = 权限模块；单元格数字为该模块下已授予的操作项数',
      flush: true,
      body: D.h('div', { style: 'overflow:auto' }, matrix)
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '数据范围说明',
      sub: '角色 + 数据范围双维度控制可见数据',
      body: D.h('div', {},
        UI.kv([
          ['全校', '可查看全校活动、学生、成绩与预警数据（系统管理员、分值审核员）'],
          ['本学院', '仅可查看本学院范围内的活动、报名、成绩与预警（二级学院管理员、团总支书记）'],
          ['本人负责活动', '仅可管理自己创建或担任协同管理员的活动（活动组织者）'],
          ['本人', '仅可查看本人成绩、报名与消息（学生）']
        ]),
        D.h('div.dk-tip', '数据范围在角色上配置，用户可拥有多个角色并在顶栏切换身份视角。'))
    }));
  }

  /** 权限矩阵编辑弹窗 */
  function roleMatrix(r, rerender) {
    var grant = {};
    (r.perms || []).forEach(function (p) { grant[p.m] = (p.a || []).slice(); });
    var body = D.h('div', { style: 'overflow:auto;max-height:520px' });
    var tbl = D.h('table.tbl.mini');
    tbl.appendChild(D.h('thead', D.h('tr', ['权限模块'].concat(PERM_ACTS.map(function (a) {
      return D.h('th', { style: 'text-align:center' }, a);
    })))));
    var tb = D.h('tbody');
    PERM_MODULES.forEach(function (m0) {
      var cells = [D.h('td', { style: 'font-weight:600;white-space:nowrap' }, m0)];
      PERM_ACTS.forEach(function (a) {
        var ck = D.h('input.ck', { type: 'checkbox', checked: (grant[m0] || []).indexOf(a) >= 0 });
        ck.addEventListener('change', function () {
          grant[m0] = grant[m0] || [];
          var i = grant[m0].indexOf(a);
          if (ck.checked && i < 0) grant[m0].push(a);
          if (!ck.checked && i >= 0) grant[m0].splice(i, 1);
        });
        cells.push(D.h('td', { style: 'text-align:center' }, ck));
      });
      tb.appendChild(D.h('tr', cells));
    });
    tbl.appendChild(tb);
    body.appendChild(tbl);

    var scopeSel = UI.select({ options: SCOPES.map(function (s) { return [s, s]; }), value: r.dataScope });

    var m = UI.modal({
      title: '编辑角色权限 · ' + r.name,
      sub: '勾选即授予；保存后立即写入角色配置',
      size: 'wide',
      body: [
        D.h('div', { style: 'margin-bottom:11px;display:flex;align-items:center;gap:10px' },
          D.h('span.muted', '数据范围'), scopeSel,
          D.h('span.muted', '　成员 ' + U.fmt(r.memberCount) + ' 人')),
        body,
        D.h('div', { style: 'margin-top:11px;display:flex;gap:8px' },
          D.h('button.btn.btn-sm', {
            onclick: function () { PERM_MODULES.forEach(function (m0) { grant[m0] = PERM_ACTS.slice(); }); if (r.key !== 'admin') { UI.toast('已全选', '保存后生效', 'info'); return; } UI.toast('已全选', '', 'info'); }
          }, '全选'),
          D.h('button.btn.btn-sm', { onclick: function () { grant = {}; UI.toast('已清空勾选', '保存后生效', 'info'); } }, '清空'))
        ,
        D.h('div.req-note', { style: 'margin-top:9px' }, '提示：勾选后点击「保存权限」才会写入；保存会同步记录操作留痕。')
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            r.perms = PERM_MODULES.filter(function (m0) { return (grant[m0] || []).length; }).map(function (m0) {
              return { m: m0, a: grant[m0].slice() };
            });
            r.dataScope = scopeSel.value;
            r.permsUpdatedAt = U.dt(new Date());
            DB.touch('roles', r);
            log('编辑角色权限', r.name + ' · ' + r.perms.length + ' 个模块 / ' + U.sum(r.perms, function (p) { return p.a.length; }) + ' 项');
            m.close();
            UI.toast('权限已保存', r.name + ' 现拥有 ' + r.perms.length + ' 个模块权限', 'ok');
            rerender();
          }
        }, '保存权限')
      ]
    });
  }

  function roleMembers(r) {
    var host = D.h('div');
    var list = [];
    if (r.key === 'student') list = DB.col('students').slice(0, 20).map(function (s) { return { name: s.name, no: s.sno, college: s.college, extra: s.className }; });
    else list = DB.col('staff').filter(function (s) { return (s.roleIds || []).indexOf(r.id) >= 0; })
      .map(function (s) { return { name: s.name, no: s.no, college: s.college, extra: s.title + ' · ' + (s.dept || '') }; });
    var m = UI.modal({
      title: '角色成员 · ' + r.name,
      sub: '实际持有该角色的用户（共 ' + U.fmt(r.memberCount) + ' 人，展示前 ' + list.length + ' 人）',
      size: 'wide',
      body: list.length
        ? D.h('div', { html: KP.tableHTML([
          { t: '姓名', k: 'name' }, { t: '工号 / 学号', k: 'no' }, { t: '学院', k: 'college' }, { t: '职务 / 班级', k: 'extra' }
        ], list) })
        : UI.empty('暂无成员', '该角色当前没有对应用户'),
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        KP.exportBtn('导出角色成员', [
          { t: '姓名', k: 'name' }, { t: '工号 / 学号', k: 'no' }, { t: '学院', k: 'college' }, { t: '职务 / 班级', k: 'extra' }
        ], list)
      ]
    });
  }

  function log(action, target) {
    DB.insert('logs', {
      id: U.uid('LG'), at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()] || '管理员',
      action: action, module: '组织与用户', target: target, ip: '10.16.1.101', result: '成功', detail: '操作留痕已记录'
    });
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    host.appendChild(UI.pageHd({
      title: '用户管理',
      desc: '组织架构、用户账号与角色权限三位一体；数据范围按角色控制，越权数据自动隔离。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('sys'); } }, '安全与实施保障'),
        D.h('button.btn.btn-sm', { onclick: function () { st.tab = 'role'; w.ZR.render(); } }, '角色权限')
      ]
    }));
    host.appendChild(KP.kpis([
      { label: '组织节点', num: countNodes(tree()), unit: '个', ic: '🏛', fg: '#2563eb', bg: '#eff6ff', foot: '校 / 院 / 专业 / 班 四级' },
      { label: '教职工账号', num: DB.col('staff').length, unit: '个', ic: '👤', fg: '#059669', bg: '#ecfdf5' },
      { label: '学生账号', num: DB.col('students').length, unit: '个', ic: '👥', fg: '#7c3aed', bg: '#f5f3ff', foot: '按学籍数据同步' },
      { label: '角色数量', num: roles().length, unit: '个', ic: '🔑', fg: '#d97706', bg: '#fff8eb', foot: '内置 ' + roles().filter(function (r) { return r.builtin; }).length + ' 个' },
      { label: '权限模块', num: PERM_MODULES.length, unit: '个', ic: '⚙️', fg: '#0d9488', bg: '#f0fdfa', foot: PERM_ACTS.length + ' 类操作' }
    ], 'g5'));
    host.appendChild(D.h('div', { style: 'height:14px' }));

    var rerender = function () { w.ZR.render(); };
    host.appendChild(UI.tabs({
      items: [
        { k: 'org', n: '组织架构' },
        { k: 'user', n: '用户账号', cnt: DB.col('staff').length + DB.col('students').length },
        { k: 'role', n: '角色权限', cnt: roles().length }
      ],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'org') orgTab(body, rerender);
    else if (st.tab === 'user') usersTab(body, rerender);
    else rolesTab(body, rerender);
    host.appendChild(body);
  }

  KP.pages({
    user: { title: '用户管理', group: '组织与运维', render: render }
  });
})(window);
