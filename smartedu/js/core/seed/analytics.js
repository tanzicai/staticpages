/* ==========================================================================
   种子数据 · 知识点 / 学习记录 / 知识图谱 / 文献 / 门户配置
   ========================================================================== */
window.ZK = window.ZK || {};
ZK.seed = ZK.seed || {};

(function () {
  "use strict";
  const U = ZK.util;

  /* ===================== 一、知识点 ===================== */
  const KP_ROWS = [
    ["kp_01", "商务合同条款结构与要素识别", 4, 3, 5, ["主体", "行为", "对象", "条件", "时限", "例外"], ["bk_011", "bk_001"]],
    ["kp_02", "合同情态动词与义务表达", 4, 4, 4, ["shall", "may", "will", "义务", "授权"], ["bk_011", "bk_012"]],
    ["kp_03", "术语一致性与术语库管理", 6, 3, 6, ["术语提取", "术语库", "一致性检查", "锁定"], ["bk_026", "bk_027"]],
    ["kp_04", "数字金额与计量单位规范", 5, 2, 3, ["大写金额", "进位制", "单位换算", "起算点"], ["bk_007", "bk_011"]],
    ["kp_05", "英汉形合意合差异与长句处理", 3, 5, 6, ["形合", "意合", "拆分", "重组", "语序"], ["bk_018", "bk_001"]],
    ["kp_06", "被动语态的选择与转换", 3, 4, 4, ["被动", "施动者", "话题句", "形式被动"], ["bk_018", "bk_010"]],
    ["kp_07", "语篇衔接与指代关系处理", 3, 4, 5, ["衔接", "指代", "显化", "焦点", "主题推进"], ["bk_020", "bk_001"]],
    ["kp_08", "商务函电语域与礼貌策略", 2, 3, 5, ["语域", "礼貌层级", "缓和式请求", "三段式"], ["bk_010", "bk_007"]],
    ["kp_09", "国际贸易术语 Incoterms 应用", 5, 4, 4, ["FOB", "CIF", "FCA", "DPU", "风险转移"], ["bk_009", "bk_007"]],
    ["kp_10", "文化负载词翻译策略", 8, 5, 4, ["音译", "直译加注", "意译", "替换", "归化异化"], ["bk_015", "bk_016"]],
    ["kp_11", "CAT 工具与翻译记忆库实践", 6, 3, 5, ["翻译记忆", "模糊匹配", "对齐", "质量检查"], ["bk_025", "bk_028"]],
    ["kp_12", "翻译质量评估标准应用", 9, 4, 3, ["错误分级", "扣分规则", "加分维度", "同侪互评"], ["bk_034", "bk_038"]],
  ];

  ZK.seed.knowledgePoints = function () {
    const rng = U.makeRng(6120);
    return KP_ROWS.map((r) => ({
      id: r[0],
      name: r[1],
      courseId: "c_biztrans",
      course: "商务英语笔译",
      chapter: r[2],
      difficulty: r[3],
      weight: r[4],
      concepts: r[5],
      books: r[6],
      order: Number(r[0].slice(3)),
      resourceCount: rng.int(4, 14),
      materialCount: rng.int(3, 9),
      createdAt: U.daysAgo(120),
    }));
  };

  /* ===================== 二、学习记录（由学习者基础能力推导） ===================== */
  ZK.seed.learningRecords = function (learners, kps) {
    const rng = U.makeRng(2718);
    const out = [];
    const kpDifficulty = {};
    kps.forEach((k) => (kpDifficulty[k.id] = k.difficulty));

    learners.forEach((l, li) => {
      kps.forEach((k, ki) => {
        const diff = kpDifficulty[k.id]; // 1-5
        const penalty = (diff - 3) * 6.5;
        const noise = rng.float(-9, 9);
        let completion = U.clamp(Math.round(l.baseAbility * 100 - penalty + noise), 18, 100);
        let mastery = U.clamp(Math.round(completion * (0.72 + l.baseAbility * 0.26) + rng.float(-5, 5)), 15, 99);
        if (l.studyHours > 70) completion = U.clamp(completion + 5, 0, 100);
        if (l.studyHours < 30) completion = U.clamp(completion - 7, 0, 100);
        const materialTotal = k.materialCount;
        const readRate = U.clamp(l.baseAbility * 0.85 + rng.float(-0.18, 0.22), 0.05, 1);
        out.push({
          id: "lr_" + String(li + 1).padStart(2, "0") + "_" + String(ki + 1).padStart(2, "0"),
          learnerId: l.id,
          classId: l.classId,
          kpId: k.id,
          completion,
          mastery,
          materialsRead: U.clamp(Math.round(materialTotal * readRate), 0, materialTotal),
          materialTotal,
          duration: rng.int(12, 168),
          attempts: rng.int(1, 5),
          lastAt: U.daysAgo(rng.int(0, 26)),
        });
      });
    });
    return out;
  };

  /* ===================== 三、知识图谱节点与关系 ===================== */
  ZK.seed.graphNodes = function () {
    const nodes = [];
    KP_ROWS.forEach((r, i) => {
      nodes.push({ id: r[0], label: r[1], type: "kp", size: 20 + r[3], chapter: r[2], difficulty: r[3] });
    });
    const concepts = [
      ["cp_01", "条款要素六分法", "kp_01"], ["cp_02", "的字符层级拆分", "kp_01"],
      ["cp_03", "情态动词三分", "kp_02"], ["cp_04", "义务与陈述区分", "kp_02"],
      ["cp_05", "术语提取与审核", "kp_03"], ["cp_06", "一致性检查脚本", "kp_03"],
      ["cp_07", "大写金额规范", "kp_04"], ["cp_08", "进位制换算", "kp_04"],
      ["cp_09", "形合意合对比", "kp_05"], ["cp_10", "长句四法", "kp_05"],
      ["cp_11", "无标记被动", "kp_06"], ["cp_12", "形式被动意义主动", "kp_06"],
      ["cp_13", "显化倾向", "kp_07"], ["cp_14", "末端焦点", "kp_07"],
      ["cp_15", "礼貌层级三分", "kp_08"], ["cp_16", "三段式结构", "kp_08"],
      ["cp_17", "风险与费用分离", "kp_09"], ["cp_18", "Incoterms 2020 修订", "kp_09"],
      ["cp_19", "音译与加注", "kp_10"], ["cp_20", "归化与异化", "kp_10"],
      ["cp_21", "翻译记忆匹配类型", "kp_11"], ["cp_22", "语言资产积累", "kp_11"],
      ["cp_23", "错误四级分类", "kp_12"], ["cp_24", "同侪互评程序", "kp_12"],
    ];
    concepts.forEach((c) => nodes.push({ id: c[0], label: c[1], type: "concept", size: 12, parent: c[2] }));

    const tools = [
      ["tl_01", "术语库管理工具", "kp_03"],
      ["tl_02", "翻译记忆库", "kp_11"],
      ["tl_03", "平行语料库", "kp_11"],
      ["tl_04", "质量检查规则集", "kp_12"],
      ["tl_05", "对比语言学分析", "kp_05"],
      ["tl_06", "语域分析框架", "kp_08"],
    ];
    tools.forEach((t) => nodes.push({ id: t[0], label: t[1], type: "tool", size: 13, parent: t[2] }));

    const books = ["bk_011", "bk_018", "bk_026", "bk_015", "bk_034", "bk_025", "bk_001", "bk_009"];
    const bookTitles = {
      bk_011: "商务合同翻译实务", bk_018: "英汉对比研究", bk_026: "术语管理与翻译技术",
      bk_015: "文化与翻译", bk_034: "翻译批评导论", bk_025: "计算机辅助翻译实践",
      bk_001: "实用翻译教程", bk_009: "国际贸易实务英语",
    };
    books.forEach((b) => nodes.push({ id: b, label: bookTitles[b], type: "book", size: 15 }));

    return nodes;
  };

  ZK.seed.graphEdges = function () {
    const edges = [];
    function add(a, b, rel, weight) {
      edges.push({ id: "ge_" + edges.length, source: a, target: b, rel: rel, weight: weight || 1 });
    }
    // 知识点之间的前置与关联
    const kpChain = [
      ["kp_01", "kp_02", "前置"],
      ["kp_02", "kp_04", "关联"],
      ["kp_01", "kp_04", "关联"],
      ["kp_01", "kp_03", "关联"],
      ["kp_03", "kp_11", "前置"],
      ["kp_05", "kp_06", "前置"],
      ["kp_05", "kp_07", "前置"],
      ["kp_06", "kp_07", "关联"],
      ["kp_02", "kp_08", "关联"],
      ["kp_08", "kp_09", "关联"],
      ["kp_09", "kp_01", "关联"],
      ["kp_10", "kp_05", "关联"],
      ["kp_03", "kp_12", "前置"],
      ["kp_11", "kp_12", "关联"],
      ["kp_10", "kp_08", "关联"],
    ];
    kpChain.forEach((e, i) => add(e[0], e[1], e[2], 1 + (i % 3) * 0.3));

    // 概念 → 知识点
    [
      ["cp_01", "kp_01"], ["cp_02", "kp_01"], ["cp_03", "kp_02"], ["cp_04", "kp_02"],
      ["cp_05", "kp_03"], ["cp_06", "kp_03"], ["cp_07", "kp_04"], ["cp_08", "kp_04"],
      ["cp_09", "kp_05"], ["cp_10", "kp_05"], ["cp_11", "kp_06"], ["cp_12", "kp_06"],
      ["cp_13", "kp_07"], ["cp_14", "kp_07"], ["cp_15", "kp_08"], ["cp_16", "kp_08"],
      ["cp_17", "kp_09"], ["cp_18", "kp_09"], ["cp_19", "kp_10"], ["cp_20", "kp_10"],
      ["cp_21", "kp_11"], ["cp_22", "kp_11"], ["cp_23", "kp_12"], ["cp_24", "kp_12"],
    ].forEach((e) => add(e[0], e[1], "隶属"));

    // 概念之间的横向关联
    [
      ["cp_02", "cp_10"], ["cp_03", "cp_04"], ["cp_05", "cp_06"], ["cp_07", "cp_08"],
      ["cp_09", "cp_11"], ["cp_13", "cp_16"], ["cp_19", "cp_20"], ["cp_21", "cp_22"],
      ["cp_23", "cp_24"], ["cp_01", "cp_17"],
    ].forEach((e) => add(e[0], e[1], "关联", 0.6));

    // 工具 → 知识点
    [
      ["tl_01", "kp_03"], ["tl_02", "kp_11"], ["tl_03", "kp_11"],
      ["tl_04", "kp_12"], ["tl_05", "kp_05"], ["tl_06", "kp_08"],
    ].forEach((e) => add(e[0], e[1], "支撑"));

    // 图书 → 知识点（系统推荐）
    [
      ["bk_011", "kp_01"], ["bk_011", "kp_02"], ["bk_018", "kp_05"], ["bk_018", "kp_06"],
      ["bk_026", "kp_03"], ["bk_015", "kp_10"], ["bk_034", "kp_12"], ["bk_025", "kp_11"],
      ["bk_001", "kp_01"], ["bk_009", "kp_09"],
    ].forEach((e) => add(e[0], e[1], "推荐阅读"));

    return edges;
  };

  /* ===================== 四、教师文献（待解析） ===================== */
  ZK.seed.literature = function () {
    return [
      {
        id: "lit_001",
        title: "商务合同翻译中情态动词的功能对等研究",
        author: "周维桢",
        source: "《中国翻译》2023 年第 4 期",
        year: 2023,
        type: "学术论文",
        sizeKB: 486,
        parsed: false,
        parsedAt: null,
        addedAt: U.daysAgo(6),
        text:
          "摘要：商务合同翻译的核心难点之一在于情态动词的功能对等。本文以 300 份中英双语商务合同为语料，考察 shall、may、will、must 四个情态动词在合同语境中的分布规律与翻译对应关系，提出以义务层级而非语法形式为标准的翻译决策框架。\n" +
          "一、引言。合同文本的功能在于界定当事人的权利义务，情态动词是承载这一功能的核心语法手段。中文合同中的“应”“应当”“可”“可以”“须”“不得”等表达，在英语中并非与单一情态动词形成固定对应。译者若按词典释义机械对应，容易造成义务层级的偏移。已有研究表明，合同英语中 shall 的使用频率远高于其他语体，其在法律文本中的功能已从表示将来演变为表示义务。\n" +
          "二、语料与方法。本文自建中英平行语料库，语料来源为公开的国际贸易合同与采购合同，总量约 42 万词。对齐单位为句，共得到有效句对 18,600 组。标注方案区分四个义务层级：强制义务、授权许可、条件假设、事实陈述。标注一致性检验的 Kappa 系数为 0.86，达到可接受水平。\n" +
          "三、shall 的功能与译法。语料统计显示，shall 在合同英语中占全部情态动词用法的 71.3%，其中表示强制义务的占 88.6%。中文“应”译为 shall 的对应率为 92.1%，是最高的一致性项。但需要注意，中文“应”存在两种用法：一是表达义务的规范性应当，二是表达推测的可能性判断。后者不应译为 shall，而应译为 should 或 will。语料中因混用导致义务错位的案例共 34 处，占错误总数的 12.4%。\n" +
          "四、may 与 will 的区分。may 在合同英语中表示授权或许可，占其用法的 76.2%，其余表示可能性。中文“可”“可以”译为 may 的对应率为 84.7%。will 在合同英语中主要表示对未来事实的陈述，占其用法的 81.5%。值得注意的是一种常见错误：把中文“将会”译为 shall，导致描述性内容被赋予义务属性。语料中此类错误共 21 处。\n" +
          "五、must 的边缘化。must 在合同英语中仅占 2.1%，且多出现在非正式附件或说明性文本中。合同正文极少使用 must，原因是 shall 已足以表达强制义务，而 must 的语气被认为过于生硬，且在不同法域中的解释存在差异。因此中文“必须”在合同正文中通常仍译为 shall，仅在技术规范附件中可保留 must。\n" +
          "六、翻译决策框架。基于上述发现，本文提出三步决策路径：第一步判断原句的义务层级；第二步按层级选择情态动词，强制义务对应 shall，授权许可对应 may，事实陈述对应 will，条件假设对应 where 或 provided that 引导的从句；第三步检查全篇情态动词使用的一致性，避免同一义务层级在不同条款中使用不同情态动词。\n" +
          "七、结论与局限。情态动词的功能对等应以义务层级为判断基础，而非以词典释义为唯一依据。本文的局限在于语料集中于货物贸易合同，未覆盖服务合同与技术许可合同，后续研究可扩展语料范围。此外，不同法域对 shall 的解释差异尚未纳入考察，这是下一步研究的方向。",
      },
      {
        id: "lit_002",
        title: "高语境文化视阈下的国际商务谈判策略研究",
        author: "陈慧珊",
        source: "《外语教学》2022 年第 6 期",
        year: 2022,
        type: "学术论文",
        sizeKB: 392,
        parsed: false,
        parsedAt: null,
        addedAt: U.daysAgo(11),
        text:
          "摘要：本文从高语境与低语境文化的差异出发，考察国际商务谈判中信息传递方式对谈判进程与结果的影响。通过对 42 场跨境谈判的观察记录与访谈，本文归纳出否定表达、议程组织、沉默处理与书面确认四个关键差异点，并提出双向适应策略。\n" +
          "一、问题的提出。跨文化谈判的失败往往并非源于利益不可调和，而是源于信息传递方式的错配。高语境文化中，信息大量隐含于共享背景、关系网络与具体情境之中，语言符号承载的信息比例相对较低；低语境文化则倾向于将信息尽可能编码于明确的言语表达之中，以降低对语境的依赖。这一差异在谈判的每一个环节都会显现。\n" +
          "二、否定表达的差异。观察记录显示，高语境文化背景的谈判者表达否定时，常使用“我们再研究一下”“这个方案有一定难度”“需要向总部汇报”等表述。这些表述在字面上并不构成否定，但实际语用含义为拒绝。低语境文化背景的谈判者若仅按字面理解，会误判谈判空间，导致在同一议题上反复推动，既消耗时间也损耗关系。研究样本中，因否定表达误判导致的议题重复讨论平均为 2.7 轮。\n" +
          "三、议程组织的差异。低语境文化倾向于先确定议程、逐项推进、当场形成纪要；高语境文化更重视会前的关系铺垫与非正式接触，实质讨论往往在正式议程之外完成。研究中有 9 场谈判的关键让步发生在正式会议之外的场合，若仅以正式会议记录评估进展，将完全错过实际推进节点。\n" +
          "四、沉默的处理。沉默在高语境文化中可能表示深思、不便表态或礼貌性保留；在低语境文化中，沉默常被解读为缺乏准备或隐性拒绝。观察中发现，当沉默超过约 8 秒时，低语境一方倾向于主动填补空白，此时做出的让步平均幅度高于常规谈判阶段 4.2 个百分点。这说明沉默构成一种非言语的谈判压力。\n" +
          "五、书面确认的时机。低语境文化习惯每轮沟通后即发送会议纪要，把口头共识尽快固定；高语境文化倾向于在共识成熟后再落笔，过早的书面确认会被视为施压。样本中因书面确认时机不当引发的摩擦共 7 起，其中 3 起导致谈判暂停。\n" +
          "六、双向适应策略。本文提出四步策略：一是把行为与归因分离，讨论具体行为而不推测动机；二是建立共同的过程约定，把文化差异显性化为可执行规则，例如明确决策链条与预期响应时限；三是设置文化中介角色，由熟悉双方文化的成员承担意图解释工作；四是在谈判结束后复盘归因链条，形成组织层面的跨文化经验积累。\n" +
          "七、结论。跨文化谈判能力并非天赋，而是可以通过对信息传递方式的系统训练获得的专业能力。翻译人员在谈判中不仅是语言转换者，更应承担语境信号的显化职责，把原话语的语用含义在译文中适度呈现。",
      },
      {
        id: "lit_003",
        title: "基于语料库的译文显化特征研究（待解析）",
        author: "待补充",
        source: "待补充",
        year: 2024,
        type: "学术论文",
        sizeKB: 0,
        parsed: false,
        parsedAt: null,
        addedAt: U.daysAgo(1),
        text: "",
      },
    ];
  };

  /* ===================== 五、门户配置 ===================== */
  ZK.seed.portalConfig = function () {
    return {
      id: "portal_main",
      title: "商务英语笔译 · AI 赋能课程门户",
      subtitle: "一个把知识库、AI 实训、智能评阅与学情洞察连成一体的课程空间",
      lang: "zh-CN",
      published: true,
      updatedAt: U.daysAgo(1),
      theme: {
        primary: "#2563eb",
        accent: "#60a5fa",
        surface: "rgba(17,24,39,0.72)",
        text: "#ffffff",
        mode: "dark",
        radius: 16,
      },
      background: {
        type: "gradient",
        value: "radial-gradient(circle at 18% 12%, rgba(37, 99, 235,0.22), transparent 55%), radial-gradient(circle at 82% 88%, rgba(59,130,246,0.20), transparent 55%), #030712",
        name: "翠绿青蓝双光晕",
      },
      music: {
        enabled: false,
        track: "轻音乐 · 专注学习",
        autoplay: false,
        volume: 30,
      },
      nav: ["首页", "知识库", "AI实训", "任务作品", "知识图谱", "学情看板", "资源库"],
      blocks: [
        { id: "blk_hero", key: "hero", title: "课程导语", enabled: true, source: { type: "static", ref: "" }, display: { columns: 1, limit: 1 } },
        { id: "blk_stats", key: "stats", title: "课程数据总览", enabled: true, source: { type: "datacenter", ref: "ds_course_overview" }, display: { columns: 4, limit: 4 } },
        { id: "blk_kb", key: "kb", title: "AI 知识库", enabled: true, source: { type: "datacenter", ref: "ds_kb_stats" }, display: { columns: 3, limit: 3 } },
        { id: "blk_tasks", key: "tasks", title: "作品型任务", enabled: true, source: { type: "datacenter", ref: "ds_tasks" }, display: { columns: 2, limit: 4 } },
        { id: "blk_graph", key: "graph", title: "知识图谱导读", enabled: true, source: { type: "datacenter", ref: "ds_graph_hot" }, display: { columns: 2, limit: 6 } },
        { id: "blk_analytics", key: "analytics", title: "班级学情速览", enabled: true, source: { type: "datacenter", ref: "ds_class_analytics" }, display: { columns: 3, limit: 3 } },
        { id: "blk_practice", key: "practice", title: "AI 实训场景", enabled: false, source: { type: "datacenter", ref: "ds_scenes" }, display: { columns: 3, limit: 3 } },
        { id: "blk_library", key: "library", title: "推荐书目", enabled: true, source: { type: "datacenter", ref: "ds_books" }, display: { columns: 4, limit: 8 } },
        { id: "blk_notice", key: "notice", title: "课程公告", enabled: true, source: { type: "external", ref: "ext_oa_notice" }, display: { columns: 1, limit: 5 } },
        { id: "blk_contact", key: "contact", title: "教学支持", enabled: true, source: { type: "static", ref: "" }, display: { columns: 1, limit: 1 } },
      ],
    };
  };

  ZK.seed.dataSources = function () {
    return [
      { id: "ds_course_overview", name: "课程数据总览", type: "datacenter", desc: "课程规模、资源量、活跃度等聚合指标", fields: ["课程数", "学生数", "资源数", "活跃率"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ds_kb_stats", name: "知识库统计", type: "datacenter", desc: "各知识库文档数、分片数、训练状态与检索量", fields: ["文档数", "分片数", "检索次数", "命中率"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ds_tasks", name: "任务与作品", type: "datacenter", desc: "进行中的作品型任务、提交量与平均得分", fields: ["任务数", "提交量", "平均分", "截止时间"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ds_graph_hot", name: "图谱热点知识点", type: "datacenter", desc: "图谱中被访问与关联最多的知识点", fields: ["知识点", "关联资源数", "访问量"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ds_class_analytics", name: "班级学情", type: "datacenter", desc: "班级平均完成率、掌握率与薄弱知识点", fields: ["完成率", "掌握率", "薄弱知识点"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ds_scenes", name: "实训场景", type: "datacenter", desc: "已发布的 AI 实训场景与平均得分", fields: ["场景数", "参与人次", "平均分"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ds_books", name: "推荐书目", type: "datacenter", desc: "课程关联的文献库推荐图书", fields: ["书名", "作者", "馆藏", "评分"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ds_safety_summary", name: "内容安全摘要", type: "datacenter", desc: "风险用户数、垃圾发布量与内容环境评分", fields: ["风险用户", "垃圾发布量", "安全评分"], updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ext_oa_notice", name: "教务系统公告接口", type: "external", desc: "对接学校教务系统公告，按课程代码过滤", fields: ["公告标题", "发布时间", "发布单位"], endpoint: "https://jw.sisu.edu.cn/api/notice", method: "GET", updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ext_library", name: "图书馆馆藏接口", type: "external", desc: "对接图书馆系统，实时查询馆藏与借阅状态", fields: ["ISBN", "馆藏位置", "可借册数"], endpoint: "https://lib.sisu.edu.cn/api/holding", method: "GET", updatedAt: U.daysAgo(0), status: "connected" },
      { id: "ext_mooc", name: "慕课平台课程资源接口", type: "external", desc: "同步校外慕课平台的课程与视频资源", fields: ["课程名", "章节", "时长"], endpoint: "https://mooc.example.edu/api/courses", method: "GET", updatedAt: U.daysAgo(1), status: "connected" },
      { id: "ext_sso", name: "统一身份认证", type: "external", desc: "对接学校统一身份认证，用于单点登录与身份核验", fields: ["工号", "学号", "身份类型"], endpoint: "https://sso.sisu.edu.cn/oauth2/token", method: "POST", updatedAt: U.daysAgo(0), status: "connected" },
    ];
  };

  /* ===================== 六、通知 ===================== */
  ZK.seed.notifications = function () {
    return [
      { id: "nt_001", type: "warning", title: "内容安全告警", body: "检测到 2 名用户发布高风险内容，已自动拦截并计入风险统计。", at: U.daysAgo(0) + 3600000 * 2, read: false, link: "#/safety/risk" },
      { id: "nt_002", type: "info", title: "任务提交提醒", body: "《商务合同条款翻译（中译英）》新增 1 份作品待评阅。", at: U.daysAgo(0) + 3600000 * 5, read: false, link: "#/tasks/review" },
      { id: "nt_003", type: "info", title: "知识库训练完成", body: "「商务英语笔译课程知识库」已完成分片索引，共 8 篇文档、26 个分片。", at: U.daysAgo(1), read: false, link: "#/kb" },
      { id: "nt_004", type: "success", title: "文献同步成功", body: "已从图书馆馆藏接口同步 38 本课程相关书目。", at: U.daysAgo(1), read: true, link: "#/library" },
      { id: "nt_005", type: "info", title: "学情周报已生成", body: "2022级商务英语1班第 12 周学情画像已生成，薄弱知识点 3 个。", at: U.daysAgo(2), read: true, link: "#/analytics/profile" },
      { id: "nt_006", type: "warning", title: "术语一致性提示", body: "期中作业中有 6 份译文存在术语不一致，建议在评阅时统一提示。", at: U.daysAgo(3), read: true, link: "#/tasks" },
    ];
  };

  /* ===================== 七、教学公告（外部数据接入示例） ===================== */
  ZK.seed.notices = function () {
    return [
      { id: "no_01", title: "关于 2025-2026 学年第一学期期中教学检查的通知", org: "教务处", at: U.daysAgo(2), external: true },
      { id: "no_02", title: "商务英语笔译课程第 5 次作业提交截止时间提醒", org: "英语学院 · 翻译系", at: U.daysAgo(3), external: false },
      { id: "no_03", title: "图书馆新增翻译学外文数据库试用通知", org: "图书馆", at: U.daysAgo(5), external: true },
      { id: "no_04", title: "关于组织参加全国商务英语翻译大赛的报名通知", org: "英语学院", at: U.daysAgo(7), external: true },
      { id: "no_05", title: "课程组教研活动：AI 赋能翻译教学案例分享", org: "英语学院 · 翻译系", at: U.daysAgo(9), external: false },
    ];
  };
})();
