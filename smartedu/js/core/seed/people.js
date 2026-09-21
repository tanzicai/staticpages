/* ==========================================================================
   种子数据 · 人员与班级
   ========================================================================== */
window.ZK = window.ZK || {};
ZK.seed = ZK.seed || {};

(function () {
  "use strict";
  const U = ZK.util;

  ZK.seed.users = function () {
    /* 学生账号直接取自 learners 表的学号，避免用户表与花名册出现两套学号 */
    const byId = {};
    ZK.seed.learners().forEach((l) => (byId[l.id] = l));
    const snoOf = (id, fallback) => (byId[id] ? byId[id].sno : fallback);

    return [
      {
        id: "u_admin",
        account: "admin",
        password: "Admin@123",
        name: "张立信",
        role: "admin",
        roleName: "平台管理员",
        org: "教务处 · 教学技术支持中心",
        email: "admin@sisu.edu.cn",
        phone: "138****2201",
        status: "active",
        lastLogin: U.daysAgo(0),
        createdAt: U.daysAgo(420),
      },
      {
        id: "u_teacher",
        account: "T20190087",
        password: "Teach@123",
        name: "李明远",
        role: "teacher",
        roleName: "授课教师",
        org: "英语学院 · 翻译系",
        email: "liminyuan@sisu.edu.cn",
        phone: "139****7734",
        status: "active",
        lastLogin: U.daysAgo(0),
        createdAt: U.daysAgo(380),
        courses: ["c_biztrans", "c_crossculture"],
      },
      {
        id: "u_teacher2",
        account: "T20170452",
        password: "Teach@123",
        name: "陈慧珊",
        role: "teacher",
        roleName: "授课教师",
        org: "英语学院 · 商务英语系",
        email: "chenhuishan@sisu.edu.cn",
        phone: "137****5120",
        status: "active",
        lastLogin: U.daysAgo(1),
        createdAt: U.daysAgo(560),
        courses: ["c_crossculture"],
      },
      {
        id: "u_student",
        account: snoOf("l_001", "2022210137"),
        password: "Study@123",
        name: "王梓涵",
        role: "student",
        roleName: "学生",
        org: "英语学院 · 2022级商务英语1班",
        email: snoOf("l_001", "2022210137") + "@stu.sisu.edu.cn",
        phone: "186****9032",
        status: "active",
        lastLogin: U.daysAgo(0),
        createdAt: U.daysAgo(300),
        learnerId: "l_001",
      },
      {
        id: "u_student2",
        account: snoOf("l_003", "2022210142"),
        password: "Study@123",
        name: "赵思远",
        role: "student",
        roleName: "学生",
        org: "英语学院 · 2022级商务英语1班",
        email: snoOf("l_003", "2022210142") + "@stu.sisu.edu.cn",
        phone: "185****4417",
        status: "active",
        lastLogin: U.daysAgo(2),
        createdAt: U.daysAgo(300),
        learnerId: "l_003",
      },
      {
        id: "u_auditor",
        account: "A20210031",
        password: "Audit@123",
        name: "周敏",
        role: "auditor",
        roleName: "教学督导",
        org: "教学质量监控办公室",
        email: "zhoumin@sisu.edu.cn",
        phone: "135****6688",
        status: "active",
        lastLogin: U.daysAgo(4),
        createdAt: U.daysAgo(210),
      },
    ];
  };

  ZK.seed.permissions = function () {
    const rows = [
      ["admin", "kb.manage", "知识库管理"],
      ["admin", "kb.train", "知识库训练"],
      ["admin", "safety.manage", "内容安全治理"],
      ["admin", "user.manage", "用户与权限"],
      ["admin", "portal.publish", "门户发布"],
      ["admin", "data.export", "数据导出"],
      ["teacher", "kb.manage", "知识库管理"],
      ["teacher", "kb.train", "知识库训练"],
      ["teacher", "task.manage", "任务与评阅"],
      ["teacher", "literature.parse", "文献解析"],
      ["teacher", "analytics.view", "学情查看"],
      ["teacher", "portal.edit", "门户编辑"],
      ["teacher", "safety.view", "安全数据查看"],
      ["student", "practice.do", "AI实训"],
      ["student", "task.submit", "作品提交"],
      ["student", "kb.query", "知识库检索"],
      ["student", "portal.view", "门户浏览"],
      ["auditor", "analytics.view", "学情查看"],
      ["auditor", "safety.view", "安全数据查看"],
      ["auditor", "data.export", "数据导出"],
    ];
    return rows.map((r) => ({
      id: "perm_" + r[0] + "_" + r[1].replace(/\W/g, "_"),
      role: r[0],
      action: r[1],
      label: r[2],
      allowed: true,
    }));
  };

  const SURNAMES = "王李张刘陈杨黄赵吴周徐孙马朱胡林郭何高罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁沈".split("");
  const GIVEN = [
    "梓涵", "思远", "雨欣", "浩然", "欣怡", "子墨", "嘉怡", "宇轩", "语彤", "睿哲",
    "若曦", "骁然", "雅静", "承泽", "静怡", "文博", "紫晴", "皓宇", "舒然", "明煊",
    "佳琪", "景行", "书瑶", "旭尧", "念安", "屹辰", "清越", "知远", "沐晨", "楚言",
    "谨瑜", "琰琰", "维桢", "其琛", "斯年", "蔚然", "陶然", "昭华", "瑾瑜", "之衡",
    "澜溪", "望舒", "澄泓", "星河", "闻笛", "砺寒", "疏影", "怀瑾", "观澜", "松原",
  ];

  ZK.seed.classes = function () {
    return [
      {
        id: "cls_biz1",
        name: "2022级商务英语1班",
        courseId: "c_biztrans",
        courseName: "商务英语笔译",
        teacherId: "u_teacher",
        teacherName: "李明远",
        term: "2025-2026学年第一学期",
        size: 32,
      },
      {
        id: "cls_biz2",
        name: "2022级商务英语2班",
        courseId: "c_biztrans",
        courseName: "商务英语笔译",
        teacherId: "u_teacher",
        teacherName: "李明远",
        term: "2025-2026学年第一学期",
        size: 30,
      },
      {
        id: "cls_cross1",
        name: "2023级跨文化交际1班",
        courseId: "c_crossculture",
        courseName: "跨文化交际",
        teacherId: "u_teacher2",
        teacherName: "陈慧珊",
        term: "2025-2026学年第一学期",
        size: 28,
      },
    ];
  };

  ZK.seed.courses = function () {
    return [
      { id: "c_biztrans", name: "商务英语笔译", code: "BE3012", credit: 3, hours: 48, teacher: "李明远", term: "2025-2026-1" },
      { id: "c_crossculture", name: "跨文化交际", code: "BE2045", credit: 2, hours: 32, teacher: "陈慧珊", term: "2025-2026-1" },
      { id: "c_lit", name: "翻译理论与实践", code: "TR4011", credit: 3, hours: 48, teacher: "李明远", term: "2025-2026-1" },
    ];
  };

  ZK.seed.learners = function () {
    const rng = U.makeRng(20260920);
    const used = {};
    const list = [];
    let idx = 0;

    function genName() {
      for (let k = 0; k < 60; k++) {
        const n = rng.pick(SURNAMES) + rng.pick(GIVEN);
        if (!used[n]) {
          used[n] = 1;
          return n;
        }
      }
      return rng.pick(SURNAMES) + rng.pick(GIVEN) + String(idx);
    }

    /* 每个班级使用互不重叠的学号段，避免跨班出现重复学号；
       idx 1/3 的两位演示学生沿用固定学号，与登录账号保持一致 */
    const SPECIAL_SNO = { 1: "2022210137", 3: "2022210142" };
    const classPlan = [
      { cls: "cls_biz1", n: 32, course: "c_biztrans", prefix: "202221", from: 200 },
      { cls: "cls_biz2", n: 30, course: "c_biztrans", prefix: "202221", from: 300 },
      { cls: "cls_cross1", n: 28, course: "c_crossculture", prefix: "202321", from: 200 },
    ];

    classPlan.forEach((plan) => {
      for (let i = 0; i < plan.n; i++) {
        idx += 1;
        const name = idx === 1 ? "王梓涵" : idx === 3 ? "赵思远" : genName();
        const sno = SPECIAL_SNO[idx] || plan.prefix + String(plan.from + i).padStart(4, "0");
        const ability = rng.float(0.52, 0.97);
        list.push({
          id: "l_" + String(idx).padStart(3, "0"),
          name,
          sno,
          classId: plan.cls,
          courseId: plan.course,
          gender: rng.bool(0.36) ? "男" : "女",
          level: ability > 0.85 ? "A" : ability > 0.68 ? "B" : "C",
          baseAbility: Number(ability.toFixed(3)),
          studyHours: rng.int(18, 96),
          loginCount: rng.int(12, 88),
          lastActive: U.daysAgo(rng.int(0, 9)),
          riskScore: rng.int(2, 46),
          status: "active",
        });
      }
    });
    return list;
  };
})();
