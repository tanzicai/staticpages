/* ==========================================================================
   seed/community.js —— 社团 / 党团管理 / 党团审批工具
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, B = w.ZSEED_BASE;

  function build(rand, org) {
    var out = {};
    var students = org.students;

    /* =============== 社团 =============== */
    var NAMES = ['飞盘社', '街舞社', '摄影协会', '电子竞技社', '青年志愿者协会', '机器人创新社',
      '汉服文化社', '辩论协会', '篮球社', '羽毛球社', '心理协会', '乡村振兴实践社'];
    var CATS = ['体育竞技', '文艺文化', '志愿服务', '学术科技', '创新创业', '兴趣爱好'];
    var clubs = [];
    NAMES.forEach(function (n, i) {
      var c = B.COLLEGES[i % B.COLLEGES.length];
      var leader = students[U.rndInt(rand, 0, students.length - 1)];
      var mem = U.rndInt(rand, 32, 260);
      clubs.push({
        id: 'CL' + U.pad(i + 1), name: n, cat: CATS[i % CATS.length],
        collegeId: c.id, college: c.name, level: i % 3 === 0 ? '校级' : '院级',
        leaderId: leader.id, leader: leader.name, leaderSno: leader.sno,
        members: mem, founded: (2019 + (i % 6)) + '-09-15',
        intro: n + '成立于 ' + (2019 + (i % 6)) + ' 年，现有成员 ' + mem + ' 人，指导单位' + c.name +
          '。社团以' + CATS[i % CATS.length] + '方向开展常态化活动，每年举办品牌活动 2—4 场，成果多次在校内外展出。',
        status: i % 11 === 0 ? '整改中' : '正常',
        annual: i % 4 === 0 ? '待年审' : '已通过',
        events: U.rndInt(rand, 6, 34), works: U.rndInt(rand, 4, 60),
        fee: U.rndInt(rand, 0, 50), advisor: B.SURNAME[(i * 3) % B.SURNAME.length] + '老师',
        account: 'club' + U.pad(i + 1),
        perms: ['发布社团活动', '成员管理', '宣传物料提交', '成果展示'],
        ledger: null
      });
    });
    out.clubs = clubs;

    out.clubMembers = [];
    clubs.forEach(function (cl) {
      var n = Math.min(cl.members, U.rndInt(rand, 10, 22));
      var usedId = {};
      for (var i = 0; i < n; i++) {
        var st = students[U.rndInt(rand, 0, students.length - 1)];
        if (usedId[st.id]) continue;
        usedId[st.id] = 1;
        out.clubMembers.push({
          id: 'CM' + (out.clubMembers.length + 1), clubId: cl.id, clubName: cl.name,
          studentId: st.id, sno: st.sno, name: st.name, college: st.college, className: st.className, grade: st.grade, contact: st.contact,
          role: i === 0 ? '副社长' : (i < 4 ? '部门负责人' : '成员'),
          at: (2026 - (i % 3)) + '-' + U.pad(U.rndInt(rand, 3, 10)) + '-' + U.pad(U.rndInt(rand, 1, 28)),
          status: i % 37 === 0 ? '已退出' : '在册',
          post: i < 4 ? U.rndPick(rand, ['组织部', '宣传部', '外联部', '秘书处']) : ''
        });
      }
    });

    out.clubApps = [];
    for (var i = 0; i < 26; i++) {
      var st6 = students[U.rndInt(rand, 0, students.length - 1)];
      var cl6 = clubs[U.rndInt(rand, 0, clubs.length - 1)];
      var stt = i % 4 === 0 ? '待审核' : (i % 5 === 0 ? '已驳回' : '已通过');
      out.clubApps.push({
        id: 'CA' + (i + 1), clubId: cl6.id, clubName: cl6.name, type: '入社申请',
        studentId: st6.id, sno: st6.sno, name: st6.name, college: st6.college, className: st6.className, contact: st6.contact,
        reason: U.rndPick(rand, ['对' + cl6.cat + '很感兴趣，希望加入并参与活动组织', '希望在社团中锻炼组织协调能力', '有相关特长，希望为社团做贡献', '同学推荐加入']),
        skill: U.rndPick(rand, ['摄影、视频剪辑', '篮球、田径', '文案撰写、新媒体运营', '活动策划', '踏实肯干，时间充裕']),
        at: U.at(2026, U.rndInt(rand, 8, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 9, 22), U.rndInt(rand, 0, 59)),
        status: stt, reviewer: stt === '待审核' ? '' : '罗宇泽',
        note: stt === '已驳回' ? '本期招新名额已满，欢迎下期加入' : ''
      });
    }
    ['手工文创社', '攀岩社', '话剧社', '开源硬件社', '茶文化社', '无人机航拍社'].forEach(function (nm, i) {
      var st7 = students[U.rndInt(rand, 0, students.length - 1)];
      var stt2 = i < 2 ? '待审批' : (i % 3 === 0 ? '已驳回' : '已通过');
      out.clubApps.push({
        id: 'CB' + (i + 1), clubId: '', clubName: nm, type: '创建申报',
        studentId: st7.id, sno: st7.sno, name: st7.name, college: st7.college, className: st7.className, contact: st7.contact,
        reason: '拟成立' + nm + '，面向全校招募成员，围绕相关方向开展常态化活动，并纳入第二课堂活动体系。',
        skill: '发起人具备相关特长与组织经验',
        at: U.at(2026, U.rndInt(rand, 7, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 9, 22), U.rndInt(rand, 0, 59)),
        status: stt2, reviewer: stt2 === '待审批' ? '' : '陈立诚',
        guide: U.rndPick(rand, ['信息工程学院', '数字媒体学院', '文化旅游学院']),
        members: U.rndInt(rand, 12, 60), cat: U.rndPick(rand, CATS),
        note: stt2 === '已驳回' ? '发起人数不足，需不少于 20 名成员方可申报' : ''
      });
    });

    /* 社团活动台账（年审用） */
    clubs.forEach(function (cl, i) {
      cl.ledger = [];
      var n = U.rndInt(rand, 4, 10);
      for (var k = 0; k < n; k++) {
        cl.ledger.push({
          id: 'EV' + cl.id + '-' + (k + 1),
          name: cl.name + ' · ' + U.rndPick(rand, ['品牌活动', '常规训练营', '成果展', '公益行动', '招新宣讲']) + '（第 ' + (k + 1) + ' 期）',
          type: cl.cat, at: '2026-' + U.pad(U.rndInt(rand, 3, 9)) + '-' + U.pad(U.rndInt(rand, 1, 28)),
          join: U.rndInt(rand, 24, 220), sign: 0, rate: 0, score: U.rndInt(rand, 76, 98), status: '已归档'
        });
        var ev = cl.ledger[cl.ledger.length - 1];
        ev.sign = Math.round(ev.join * (0.78 + rand() * 0.2));
        ev.rate = Math.round(ev.sign / ev.join * 100);
      }
    });

    /* =============== 党团管理 =============== */
    var FLD = function (id, type, label, req, options) {
      return { id: id, type: type, label: label, required: !!req, options: options || null };
    };
    out.party = {
      forms: [
        {
          id: 'PF1', name: '入党申请表', cat: '党务', version: 'v2', used: 268, updatedAt: '2026-09-04 10:12',
          presets: ['基础信息包', '思想汇报包'], layout: 'card', enabled: true,
          fields: [
            FLD('f1', '单行输入', '姓名', 1), FLD('f2', '单行输入', '学号', 1), FLD('f3', '部门', '所在学院', 1),
            FLD('f4', '日期', '出生日期', 1), FLD('f5', '下拉框', '政治面貌', 1, ['共青团员', '群众']),
            FLD('f6', '多行输入', '入党动机', 1), FLD('f7', '附件', '思想汇报材料', 1), FLD('f8', '手写签名', '本人签名', 1)
          ]
        },
        {
          id: 'PF2', name: '积极分子考察表', cat: '党务', version: 'v3', used: 412, updatedAt: '2026-09-06 15:40',
          presets: ['考核评分包'], layout: 'tabs', enabled: true,
          fields: [
            FLD('g1', '选择数据', '学生基本信息', 1), FLD('g2', '评分', '思想表现评分', 1),
            FLD('g3', '评分', '学习表现评分', 1), FLD('g4', '滑动条', '群众基础评分', 1),
            FLD('g5', '多行输入', '培养联系人意见', 1), FLD('g6', '图片', '活动参与佐证', 0)
          ]
        },
        {
          id: 'PF3', name: '发展对象政审表', cat: '党务', version: 'v1', used: 156, updatedAt: '2026-09-08 09:26',
          presets: ['基础信息包'], layout: 'table', enabled: true,
          fields: [
            FLD('h1', '选择数据', '学生基本信息', 1), FLD('h2', '子表单', '直系亲属情况', 1),
            FLD('h3', '附件', '政审材料', 1), FLD('h4', '自动编号', '政审编号', 1)
          ]
        },
        {
          id: 'PF4', name: '预备党员转正申请表', cat: '党务', version: 'v2', used: 98, updatedAt: '2026-09-11 14:08',
          presets: ['考核评分包', '思想汇报包'], layout: 'card', enabled: true,
          fields: [
            FLD('i1', '选择数据', '学生基本信息', 1), FLD('i2', '日期区间', '预备期', 1),
            FLD('i3', '多行输入', '预备期思想总结', 1), FLD('i4', '计算公式', '预备期时长（月）', 0, ['MONTHS(预备期结束, 预备期开始)']),
            FLD('i5', '手写签名', '党支部意见', 1)
          ]
        },
        {
          id: 'PF5', name: '团组织关系转入登记表', cat: '团务', version: 'v1', used: 1840, updatedAt: '2026-09-02 11:30',
          presets: ['基础信息包'], layout: 'table', enabled: true,
          fields: [
            FLD('j1', '单行输入', '姓名', 1), FLD('j2', '单行输入', '团员编号', 1),
            FLD('j3', '部门', '转入团支部', 1), FLD('j4', '日期', '转入日期', 1), FLD('j5', '附件', '团员证扫描件', 1)
          ]
        }
      ],
      /* 全部可选组件（拖拉拽面板用，与参数.doc 组件清单一致） */
      components: ['单行输入', '多行输入', '数字输入', '滑动条', '评分', '说明文字', '单选', '下拉框', '下拉复选', '多级下拉',
        '日期', '日期区间', '图片', '视频', '附件', '联系人', '部门', '单位', '子表单', '富文本', '计算公式', '自动编号',
        '图片单选', '图片多选', '矩阵单选', '矩阵多选', '按钮', '选择数据', '直播', '定位', '地址', '手写签名', '文字识别', '数据所属人'],
      componentPacks: [
        { id: 'PK1', name: '考勤组件包', count: 6, items: ['定位', '手写签名', '日期区间', '附件', '联系人', '说明文字'] },
        { id: 'PK2', name: '基础信息包', count: 8, items: ['单行输入', '学号', '部门', '日期', '下拉框', '联系人', '说明文字', '附件'] },
        { id: 'PK3', name: '思想汇报包', count: 5, items: ['富文本', '附件', '手写签名', '日期', '多行输入'] },
        { id: 'PK4', name: '考核评分包', count: 7, items: ['评分', '滑动条', '矩阵单选', '多行输入', '图片', '计算公式', '说明文字'] }
      ],
      orgs: [
        { id: 'PO1', name: B.SCHOOL + '党委', type: '党委', parent: '', memberCount: 268, secretary: '党委书记' },
        { id: 'PO2', name: B.SCHOOL + '团委', type: '团委', parent: 'PO1', memberCount: 0, secretary: '校团委书记' }
      ].concat(B.COLLEGES.map(function (c, i) {
        return {
          id: 'PO' + (100 + i), name: c.name + '团总支', type: '团总支', parent: 'PO2',
          memberCount: U.rndInt(rand, 320, 1860),
          secretary: '团总支书记 · ' + B.SURNAME[(i * 4 + 2) % B.SURNAME.length] + '老师'
        };
      })),
      members: [],
      tables: {
        league: { name: '团员信息台账', count: 0, cols: ['姓名', '学号', '学院', '班级', '团员编号', '入团时间', '团内职务', '状态'] },
        party: { name: '党员信息台账', count: 0, cols: ['姓名', '学号/工号', '所属党支部', '入党时间', '党内职务', '发展阶段', '状态'] }
      }
    };
    students.forEach(function (s, i) {
      if (i % 10 >= 7) return;
      out.party.members.push({
        id: 'PM' + (out.party.members.length + 1), type: '团员', studentId: s.id, sno: s.sno, name: s.name,
        college: s.college, className: s.className, grade: s.grade,
        no: 'Z' + s.sno + '.' + (i % 9), joinedAt: s.joinedAt,
        post: i % 137 === 0 ? '团支书' : (i % 89 === 0 ? '组织委员' : (i % 53 === 0 ? '宣传委员' : '团员')),
        branch: s.college + '团支部', stage: '团员',
        status: i % 211 === 0 ? '已转出' : '在册'
      });
    });
    ['入党申请人', '积极分子', '发展对象', '预备党员', '正式党员'].forEach(function (stage, si) {
      var cnt = [88, 48, 22, 14, 34][si];
      for (var i = 0; i < cnt; i++) {
        var s = students[U.rndInt(rand, 0, students.length - 1)];
        out.party.members.push({
          id: 'PM' + (out.party.members.length + 1), type: '党员', studentId: s.id, sno: s.sno, name: s.name,
          college: s.college, className: s.className, grade: s.grade,
          no: 'D' + s.sno + '.' + si,
          joinedAt: (2023 + (si % 3)) + '-' + U.pad(U.rndInt(rand, 1, 12)) + '-' + U.pad(U.rndInt(rand, 1, 28)),
          post: (si === 4 && i % 17 === 0) ? '党支部书记' : '党员',
          stage: stage, status: '在册'
        });
      }
    });
    out.party.tables.league.count = out.party.members.filter(function (m) { return m.type === '团员'; }).length;
    out.party.tables.party.count = out.party.members.filter(function (m) { return m.type === '党员'; }).length;
    out.party.orgs[1].memberCount = out.party.tables.league.count;

    /* =============== 党团审批工具 =============== */
    out.flowApps = [
      {
        id: 'FA1', name: '入党申请审批', layout: 'card', enabled: true, used: 268,
        desc: '学生提交入党申请后，经团支部推优、培养考察判断、党支部审议（含并行审议）、党委审批三级流转；第二课堂学分不达标者自动转入补充材料分支。',
        nodes: [
          { id: 'n1', name: '发起申请', type: 'start', actors: ['学生本人'], limit: { mode: '无', onTimeout: '无' }, note: '填写入党申请表并上传思想汇报' },
          { id: 'n2', name: '团支部推优', type: 'approve', actors: ['班级团支书'], priority: 1, limit: { mode: '计时规则', hours: 48, onTimeout: '自动提醒', remind: ['当前审批人', '辅导员'] }, note: '' },
          { id: 'n3', name: '培养考察是否达标？', type: 'cond', actors: ['系统'], priority: 1, conds: [{ label: '第二课堂累计学分 ≥ 4.5', to: 'n4' }, { label: '第二课堂累计学分 < 4.5', to: 'n4b' }], limit: { mode: '无', onTimeout: '无' }, note: '按学生成绩记录自动判定' },
          { id: 'n4b', name: '补充考察材料', type: 'approve', actors: ['申请人', '培养联系人'], priority: 2, limit: { mode: '计时规则', hours: 72, onTimeout: '自动提醒', remind: ['当前审批人'] }, note: '补充第二课堂参与佐证后回到推优节点' },
          { id: 'n4', name: '党支部审议', type: 'approve', actors: ['党支部书记'], priority: 1, limit: { mode: '定时规则', day: '每月 25 日', onTimeout: '自动通过', remind: ['支部书记'] }, note: '与组织委员并行审议，需全部通过' },
          { id: 'n4p', name: '组织委员并行审议', type: 'parallel', actors: ['组织委员'], priority: 1, limit: { mode: '计时规则', hours: 120, onTimeout: '自动提醒' }, note: '与党支部书记审议并行流转' },
          { id: 'n5', name: '党委审批', type: 'approve', actors: ['校党委委员'], priority: 1, limit: { mode: '计时规则', hours: 168, onTimeout: '自动提醒', remind: ['校党委委员'] }, note: '' },
          { id: 'n6', name: '归档完成', type: 'end', actors: ['系统'], limit: { mode: '无', onTimeout: '无' }, note: '写入党务台账' }
        ],
        triggers: [
          { id: 'TG1', name: '党员信息同步', on: '入党申请审批通过', action: '修改', target: '党员信息台账', detail: '按学生基本信息自动写入党员台账，同步姓名、学号、所属党支部、入党时间、发展阶段', enabled: true, log: 68 },
          { id: 'TG2', name: '第二课堂记录联动', on: '积极分子考察表提交', action: '新增', target: '第二课堂成绩记录', detail: '新增一条“思想素养”认定记录（0.5 学分 / 8 学时 / 5 积分）', enabled: true, log: 142 },
          { id: 'TG3', name: '退回自动通知', on: '审批退回', action: '新增', target: '消息通知', detail: '向申请人推送退回原因与需补充材料清单', enabled: false, log: 21 }
        ],
        relations: [
          { from: '学生基本信息', to: '入党申请表', type: '基础数据关联', field: '姓名、学号、学院、班级' },
          { from: '学生基本信息', to: '积极分子考察表', type: '基础数据关联', field: '姓名、学号、学院' },
          { from: '党员信息台账', to: '入党申请表', type: '结果回写', field: '入党时间、发展阶段' },
          { from: '第二课堂成绩记录', to: '积极分子考察表', type: '指标引用', field: '累计学分、达标状态' },
          { from: '团员信息台账', to: '入党申请表', type: '基础数据关联', field: '团员编号、入团时间' }
        ]
      },
      {
        id: 'FA2', name: '社团创建申报审批', layout: 'table', enabled: true, used: 42,
        desc: '学生发起社团创建申报，经指导单位审核、校团委审批后完成社团创建并开通社团账号。',
        nodes: [
          { id: 'm1', name: '提交申报', type: 'start', actors: ['学生发起人'], limit: { mode: '无', onTimeout: '无' }, note: '' },
          { id: 'm2', name: '指导单位审核', type: 'approve', actors: ['指导学院团委'], priority: 1, limit: { mode: '计时规则', hours: 48, onTimeout: '自动提醒' }, note: '' },
          { id: 'm3', name: '校团委审批', type: 'approve', actors: ['校团委'], priority: 1, limit: { mode: '计时规则', hours: 96, onTimeout: '自动拒绝', remind: ['校团委负责人'] }, note: '' },
          { id: 'm4', name: '创建完成', type: 'end', actors: ['系统'], limit: { mode: '无', onTimeout: '无' }, note: '开通社团账号与活动发布权限' }
        ],
        triggers: [{ id: 'TG4', name: '社团账号开通', on: '审批通过', action: '新增', target: '社团台账', detail: '自动创建社团账号并授予活动发布权限', enabled: true, log: 18 }],
        relations: [{ from: '学生基本信息', to: '社团创建申报表', type: '基础数据关联', field: '发起人姓名、学号、学院' }]
      },
      {
        id: 'FA3', name: '活动申报审批', layout: 'tabs', enabled: true, used: 186,
        desc: '院级活动由院团总支初审、校团委终审；校级活动增加党委学生工作部会签。',
        nodes: [
          { id: 'k1', name: '活动申报提交', type: 'start', actors: ['活动组织者'], limit: { mode: '无', onTimeout: '无' }, note: '' },
          { id: 'k2', name: '活动级别判断', type: 'cond', actors: ['系统'], priority: 1, conds: [{ label: '院级活动', to: 'k3' }, { label: '校级活动', to: 'k4' }], limit: { mode: '无', onTimeout: '无' }, note: '' },
          { id: 'k3', name: '院团总支初审', type: 'approve', actors: ['学院团总支书记'], priority: 1, limit: { mode: '计时规则', hours: 24, onTimeout: '自动提醒', remind: ['当前审批人'] }, note: '' },
          { id: 'k4', name: '学工部会签', type: 'approve', actors: ['党委学生工作部'], priority: 1, limit: { mode: '计时规则', hours: 48, onTimeout: '自动提醒' }, note: '' },
          { id: 'k5', name: '校团委终审', type: 'approve', actors: ['校团委'], priority: 1, limit: { mode: '计时规则', hours: 72, onTimeout: '自动提醒', remind: ['校团委负责人'] }, note: '' },
          { id: 'k6', name: '发布到活动广场', type: 'end', actors: ['系统'], limit: { mode: '无', onTimeout: '无' }, note: '' }
        ],
        triggers: [{ id: 'TG5', name: '审批通过自动发布', on: '终审通过', action: '修改', target: '活动状态', detail: '活动状态由“待审核”变更为“待开始”并推送至活动广场', enabled: true, log: 164 }],
        relations: [{ from: '活动申报表', to: '活动台账', type: '结果回写', field: '活动名称、主办单位、开展时间、学分' }]
      },
      {
        id: 'FA4', name: '分值申报审批', layout: 'card', enabled: true, used: 96,
        desc: '学生申报积分 / 学分 / 学时，学院初审后校团委终审，通过后自动赋分并通知学生。',
        nodes: [
          { id: 'p1', name: '学生提交申报', type: 'start', actors: ['学生'], limit: { mode: '无', onTimeout: '无' }, note: '' },
          { id: 'p2', name: '学院初审', type: 'approve', actors: ['二级学院管理员'], priority: 1, limit: { mode: '计时规则', hours: 48, onTimeout: '自动提醒', remind: ['当前审批人', '团总支书记'] }, note: '' },
          { id: 'p3', name: '校团委终审', type: 'approve', actors: ['分值审核员'], priority: 1, limit: { mode: '计时规则', hours: 72, onTimeout: '自动通过', remind: ['审核员'] }, note: '' },
          { id: 'p4', name: '自动赋分', type: 'end', actors: ['系统'], limit: { mode: '无', onTimeout: '无' }, note: '写入第二课堂成绩记录' }
        ],
        triggers: [{ id: 'TG6', name: '通过即赋分', on: '终审通过', action: '新增', target: '第二课堂成绩记录', detail: '按核定分值自动写入学分 / 学时 / 积分并通知学生', enabled: true, log: 92 }],
        relations: [{ from: '学生基本信息', to: '分值申报表', type: '基础数据关联', field: '姓名、学号、学院、班级' }]
      }
    ];

    return out;
  }

  w.ZSEED_COMMUNITY = { build: build };
})(window);
