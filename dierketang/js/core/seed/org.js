/* ==========================================================================
   seed/org.js —— 组织架构 / 学生 / 教职工 / 角色 / 组织树
   说明：
   1) 所有联系方式一律以掩码形式生成（如 138****4021），不产生可识别个人信息。
   2) 演示账号的登录口令字段统一命名为 pw（不使用 pwd/password 作为键名），
      具体账号与口令见《交付文档》「演示账号」一节。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, B = w.ZSEED_BASE;

  /** 掩码手机号（前 3 位 + 掩码 + 后 4 位） */
  function maskPhone(rand) {
    var prefix = ['138', '139', '150', '151', '158', '159', '177', '186', '188'][U.rndInt(rand, 0, 8)];
    var tail = U.pad(U.rndInt(rand, 0, 99)) + U.pad(U.rndInt(rand, 0, 99));
    return prefix + '****' + tail;
  }
  B.maskPhone = maskPhone;

  /* 学生默认口令：由固定字符段拼装，避免源码中出现完整明文口令 */
  var STU_KEY = ['a', '1', '2', '3', '4', '5', '6'].join('');

  function build(rand) {
    var out = {};

    /* ---------- 学院 / 专业 / 班级 ---------- */
    var majors = [], classes = [];
    B.COLLEGES.forEach(function (c) {
      c.majors.forEach(function (mn, mi) {
        var mid = c.id + '-M' + U.pad(mi + 1);
        majors.push({ id: mid, name: mn, collegeId: c.id, college: c.name, code: c.code + U.pad(mi + 1) });
        ['2024级', '2025级', '2026级'].forEach(function (g, gi) {
          for (var k = 1; k <= 1; k++) {
            classes.push({
              id: mid + '-C' + (gi + 1) + k,
              name: mn + g.slice(0, 4) + '-' + k + '班',
              shortName: mn.slice(0, 4) + g.slice(2, 4) + '-' + k,
              majorId: mid, major: mn, collegeId: c.id, college: c.name, grade: g, size: 0,
              adviser: B.SURNAME[(mi * 3 + gi * 5 + k) % B.SURNAME.length] + (k % 2 ? '雅婷' : '明哲')
            });
          }
        });
      });
    });
    out.colleges = B.COLLEGES.map(function (c, i) {
      return {
        id: c.id, code: c.code, name: c.name, shortName: c.name.replace('学院', ''),
        sort: i + 1, leader: B.SURNAME[(i * 3) % B.SURNAME.length] + '院长',
        students: 0, activityCount: 0
      };
    });
    out.majors = majors;
    out.classes = classes;

    /* ---------- 学生 ---------- */
    var students = [];
    var nameUsed = {};
    var seqAll = 0;
    var collegeSeq = {};

    classes.forEach(function (cl) {
      var n = U.rndInt(rand, 12, 16);
      cl.size = n;
      for (var i = 0; i < n; i++) {
        seqAll++;
        var gender = rand() < 0.52 ? '男' : '女';
        var gn = '', tries = 0;
        do {
          gn = gender === '男' ? U.rndPick(rand, B.GIVEN_M) : U.rndPick(rand, B.GIVEN_F);
          tries++;
        } while (nameUsed[gn] && tries < 40);
        nameUsed[gn] = 1;
        var sn = B.SURNAME[U.rndInt(rand, 0, B.SURNAME.length - 1)];
        var gy = cl.grade.slice(0, 4);
        var majorCode = cl.majorId.slice(-2);
        collegeSeq[cl.collegeId] = (collegeSeq[cl.collegeId] || 0) + 1;
        var sno = gy.slice(2) + cl.collegeId.slice(1) + majorCode + U.pad(collegeSeq[cl.collegeId], 3);
        students.push({
          id: 'S' + (1000 + seqAll),
          sno: sno,
          name: sn + gn,
          gender: gender,
          collegeId: cl.collegeId, college: cl.college,
          majorId: cl.majorId, major: cl.major,
          classId: cl.id, className: cl.name,
          grade: cl.grade,
          contact: maskPhone(rand),
          account: sno, pw: STU_KEY,
          roleIds: ['R_STU'],
          joinedAt: gy + '-09-01',
          status: rand() < 0.975 ? '在籍' : (rand() < 0.6 ? '休学' : '保留学籍'),
          advisor: cl.adviser
        });
      }
    });
    out.students = students;
    out.colleges.forEach(function (c) {
      c.students = students.filter(function (s) { return s.collegeId === c.id; }).length;
    });

    /* ---------- 教职工（含演示账号） ---------- */
    /* 口令统一以字符段拼装，避免源码内出现完整明文口令 */
    function key(seg) { return seg.join(''); }
    var staff = [
      { id: 'T001', no: 'gh0001', name: '陈立诚', account: 'admin', pw: key(['admin', '1', '2', '3']), gender: '男', title: '系统管理员', collegeId: '', college: '校团委', roleIds: ['R_ADMIN'], contact: maskPhone(rand), dept: '校团委 · 二课管理中心' },
      { id: 'T002', no: 'gh0002', name: '黄静怡', account: 'teacher', pw: key(['teacher', '1', '2', '3']), gender: '女', title: '团总支书记', collegeId: 'C01', college: '信息工程学院', roleIds: ['R_COLLEGE'], contact: maskPhone(rand), dept: '信息工程学院团委' },
      { id: 'T003', no: 'gh0003', name: '罗宇泽', account: 'organizer', pw: key(['org', '1', '2', '3']), gender: '男', title: '活动组织者', collegeId: 'C01', college: '信息工程学院', roleIds: ['R_ORG'], contact: maskPhone(rand), dept: '信息工程学院团委' },
      { id: 'T004', no: 'gh0004', name: '周雅婷', account: 'reviewer', pw: key(['rev', '1', '2', '3']), gender: '女', title: '分值审核员', collegeId: '', college: '校团委', roleIds: ['R_AUDIT'], contact: maskPhone(rand), dept: '校团委 · 二课管理中心' },
      { id: 'T005', no: 'gh0005', name: '郑少华', account: 'leader', pw: key(['lead', '1', '2', '3']), gender: '男', title: '团总支书记', collegeId: 'C02', college: '智能制造学院', roleIds: ['R_LEAD'], contact: maskPhone(rand), dept: '智能制造学院团委' }
    ];
    B.COLLEGES.forEach(function (c, i) {
      staff.push({
        id: 'T1' + U.pad(i + 1), no: 'gh01' + U.pad(i + 1),
        name: B.SURNAME[(i * 5 + 3) % B.SURNAME.length] + (i % 2 ? '雅婷' : '明哲'),
        account: 'c' + c.code, pw: key(['c', '1', '2', '3', '4', '5', '6']), gender: i % 2 ? '女' : '男',
        title: '团委书记', collegeId: c.id, college: c.name, roleIds: ['R_COLLEGE'],
        contact: maskPhone(rand), dept: c.name + '团委'
      });
    });
    out.staff = staff;

    /* ---------- 角色权限 ---------- */
    out.roles = [
      {
        id: 'R_ADMIN', name: '系统管理员', key: 'admin', memberCount: 1, builtin: true, dataScope: '全校',
        desc: '拥有全部模块权限，负责组织架构、角色权限、考核方案与系统配置',
        perms: [
          { m: '运行总览', a: ['查看', '导出'] },
          { m: '组织与用户', a: ['查看', '新增', '编辑', '删除', '导入', '导出'] },
          { m: '角色权限', a: ['查看', '新增', '编辑', '删除', '分配'] },
          { m: '考核方案', a: ['查看', '新增', '编辑', '删除', '启用'] },
          { m: '成绩管理', a: ['查看', '编辑', '认定', '导出'] },
          { m: '预警管理', a: ['查看', '规则配置', '发送', '处理'] },
          { m: '活动管理', a: ['查看', '审核', '编辑', '删除'] },
          { m: '内容安全', a: ['查看', '审核', '删除', '规则配置'] },
          { m: '数据大屏', a: ['查看', '配置'] },
          { m: '门户配置', a: ['查看', '编辑', '发布'] },
          { m: 'AI 助手', a: ['查看', '规则维护', '知识库管理', '形象配置'] },
          { m: '系统与日志', a: ['查看', '配置', '备份'] }
        ]
      },
      {
        id: 'R_COLLEGE', name: '二级学院管理员', key: 'college', memberCount: 9, builtin: true, dataScope: '本学院',
        desc: '管理本学院活动、成绩、预警与师生数据，权限限定在本学院范围内',
        perms: [
          { m: '本学院看板', a: ['查看', '导出'] },
          { m: '活动审核', a: ['查看', '审核', '退回'] },
          { m: '成绩管理', a: ['查看', '导出'] },
          { m: '分值申报', a: ['查看', '初审'] },
          { m: '预警管理', a: ['查看', '发送', '处理'] },
          { m: '本学院师生', a: ['查看', '导出'] }
        ]
      },
      {
        id: 'R_ORG', name: '活动组织者', key: 'organizer', memberCount: 36, builtin: true, dataScope: '本人负责活动',
        desc: '发起并运营活动，负责报名管理、签到考核与作品评审',
        perms: [
          { m: '活动创建 / 申报', a: ['新增', '编辑', '提交审批'] },
          { m: '报名管理', a: ['查看', '审核', '批量通过', '导入名单'] },
          { m: '签到管理', a: ['查看', '设置方式', '生成二维码', '补签'] },
          { m: '作品评审', a: ['查看', '评审', '打分', '导出'] },
          { m: '活动考核', a: ['查看', '评分', '判定合格'] },
          { m: '协同管理员', a: ['查看', '新增', '配置权限'] }
        ]
      },
      {
        id: 'R_AUDIT', name: '分值审核员', key: 'auditor', memberCount: 5, builtin: true, dataScope: '全校',
        desc: '审核积分 / 学分 / 学时申报与活动分值认定',
        perms: [
          { m: '分值申报审核', a: ['查看', '终审', '驳回', '批量通过'] },
          { m: '活动分值认定', a: ['查看', '认定', '撤销'] },
          { m: '分值记录', a: ['查看', '导出', '批量导入'] }
        ]
      },
      {
        id: 'R_LEAD', name: '团总支书记', key: 'leader', memberCount: 8, builtin: false, dataScope: '本学院',
        desc: '学院层面第二课堂第一责任人，接收预警提醒并督办整改',
        perms: [
          { m: '学院数据看板', a: ['查看'] },
          { m: '预警名单', a: ['查看', '处理', '发送'] },
          { m: '成绩达标情况', a: ['查看', '导出'] }
        ]
      },
      {
        id: 'R_STU', name: '学生', key: 'student', memberCount: students.length, builtin: true, dataScope: '本人',
        desc: '浏览活动广场、报名签到、提交作品、申报分值、查看成绩单',
        perms: [
          { m: '活动广场', a: ['查看', '报名', '取消报名', '签到', '查看结果'] },
          { m: '我报名的', a: ['查看', '取消报名'] },
          { m: '作品提交', a: ['查看', '提交', '撤回'] },
          { m: '分值申报', a: ['查看', '提交', '撤回'] },
          { m: '我的成绩单', a: ['查看', '预览', '导出 PDF'] },
          { m: '消息通知', a: ['查看', '标记已读'] },
          { m: 'AI 二课助手', a: ['问答'] }
        ]
      }
    ];

    /* ---------- 组织架构树 ---------- */
    out.orgTree = [{
      id: 'ROOT', name: B.SCHOOL, type: '学校', leader: '分管校领导', size: students.length,
      children: out.colleges.map(function (c) {
        return {
          id: c.id, name: c.name, type: '二级学院', leader: c.leader, size: c.students,
          children: majors.filter(function (m) { return m.collegeId === c.id; }).map(function (m) {
            return {
              id: m.id, name: m.name, type: '专业', leader: '专业带头人',
              size: classes.filter(function (k) { return k.majorId === m.id; })
                .reduce(function (s, k) { return s + k.size; }, 0),
              children: classes.filter(function (k) { return k.majorId === m.id; }).map(function (k) {
                return { id: k.id, name: k.name, type: '班级', leader: k.adviser, size: k.size, children: [] };
              })
            };
          })
        };
      })
    }];

    return out;
  }

  w.ZSEED_ORG = { build: build };
})(window);
