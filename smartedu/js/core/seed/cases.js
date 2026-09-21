/* ==========================================================================
   种子数据 · AI 实训场景 / 对话记录 / 作品型任务 / 学生提交
   ========================================================================== */
window.ZK = window.ZK || {};
ZK.seed = ZK.seed || {};

(function () {
  "use strict";
  const U = ZK.util;

  /* ===================== 一、AI 实训场景 ===================== */
  const SCENE_ROWS = [
    {
      id: "sc_001", name: "外贸询盘回复：首次报价谈判", courseId: "c_biztrans", course: "商务英语笔译",
      type: "商务沟通", difficulty: "中等", duration: 20,
      persona: "海外采购经理 Daniel Whitfield（英国，采购主管，注重效率，对价格敏感）",
      background:
        "你是某外贸公司业务员。英国客户 Daniel 首次发来询盘，询问 2,000 台智能温控器的报价。公司底价已定，可接受 3% 以内的折扣空间，但要求预付比例不低于 30%。客户邮件中暗示拿到了其他供应商更低的报价。",
      objective:
        "在五轮对话内完成：确认需求细节、给出分层报价、回应竞争压力、争取预付比例、约定下一步动作。",
      opening:
        "Hello, this is Daniel from Whitfield Trading. We're looking at 2,000 units of your smart thermostat. I'll be honest upfront — I've got a quote from another supplier that's about 8% below your list price. What can you do for us?",
      rubric: [
        { name: "商务信息准确", weight: 30, desc: "价格、数量、交期、付款条件等关键信息表述准确，无数字或条件错误" },
        { name: "谈判策略得当", weight: 30, desc: "分层报价、条件交换、让步有度，不盲目降价也不直接拒绝" },
        { name: "语言得体专业", weight: 25, desc: "商务函电语域恰当，礼貌层级与专业术语使用规范" },
        { name: "推进节奏有效", weight: 15, desc: "在限定轮次内推动对话向成交条件靠近" },
      ],
      turnsExpected: 5,
    },
    {
      id: "sc_002", name: "合同条款争议：交期违约沟通", courseId: "c_biztrans", course: "商务英语笔译",
      type: "争议处理", difficulty: "困难", duration: 25,
      persona: "东南亚客户代表 Somchai（泰国，合作三年，性格温和但立场坚定）",
      background:
        "因台风导致工厂停产，本批货物将延迟 12 天交付。客户下游已排产，延迟会造成其损失。客户提出索赔要求，并暗示可能转向其他供应商。",
      objective:
        "在六轮对话内完成：说明不可抗力事实、提供补救方案、回应索赔诉求、维护长期合作关系。",
      opening:
        "I received your notice about the delay. Twelve days is a serious problem for us — our production line is already scheduled. Frankly, we're considering the penalty clause. What do you propose?",
      rubric: [
        { name: "事实陈述清晰", weight: 25, desc: "不可抗力的事实、时间线与影响范围陈述完整，引用合同条款准确" },
        { name: "方案可行具体", weight: 30, desc: "分批交付、空运补货、费用分担等补救措施具体可执行" },
        { name: "责任边界清晰", weight: 25, desc: "既表达担当又不无原则承担责任，法律表述严谨" },
        { name: "关系维护到位", weight: 20, desc: "语气尊重、立场坚定，为长期合作留出空间" },
      ],
      turnsExpected: 6,
    },
    {
      id: "sc_003", name: "跨文化面试：中外合资企业岗位面试", courseId: "c_crossculture", course: "跨文化交际",
      type: "跨文化沟通", difficulty: "中等", duration: 18,
      persona: "德方人力资源总监 Klaus Reinhardt（德国，直接坦诚，注重事实与数据）",
      background:
        "你正在应聘一家中德合资企业的项目经理岗位。面试官 Klaus 以直接提问著称，会追问细节与数据。你需要展示项目经验，同时理解并适应直接反馈的沟通方式。",
      objective: "在五轮对话内完成：介绍项目经历、回应质疑、说明跨文化协作经验、提出反向问题。",
      opening:
        "Let's skip the small talk. Your resume says you led a cross-border project. Tell me the biggest mistake you made in that project, and what you changed afterwards.",
      rubric: [
        { name: "回答结构清晰", weight: 25, desc: "使用 STAR 结构，情境、任务、行动、结果完整" },
        { name: "文化适应意识", weight: 30, desc: "体现对直接反馈、低语境沟通的理解与主动适应" },
        { name: "数据支撑充分", weight: 25, desc: "成果以量化指标说明，避免空泛描述" },
        { name: "互动掌控能力", weight: 20, desc: "反问有质量，掌握对话节奏" },
      ],
      turnsExpected: 5,
    },
    {
      id: "sc_004", name: "术语一致性危机：多版本译文统一", courseId: "c_biztrans", course: "商务英语笔译",
      type: "项目管理", difficulty: "困难", duration: 22,
      persona: "项目审校 Linda Zhao（新加坡，资深审校，标准严格）",
      background:
        "一份 80 页的合同由三位译者分工完成，交付前的术语检查发现同一概念出现五种译法，且金额格式不统一。你是该项目的负责人，需要向审校说明处理方案。",
      objective: "在五轮对话内完成：问题定位、统一标准说明、返工安排、质控流程改进承诺。",
      opening:
        "I've finished the terminology check. Five variants for 'force majeure', three for 'liquidated damages', and the amounts are inconsistent across sections. Honestly, this shouldn't have reached me. How did this happen and what's your plan?",
      rubric: [
        { name: "问题定位准确", weight: 25, desc: "能说清问题产生的环节，而非泛泛归因于疏忽" },
        { name: "方案可追溯", weight: 30, desc: "给出术语库固化、一致性检查脚本、复核节点等具体措施" },
        { name: "责任担当", weight: 25, desc: "坦诚承认管理漏洞，同时给出可验证的补救时间表" },
        { name: "术语表述专业", weight: 20, desc: "术语与质控表述规范，不出现新的不一致" },
      ],
      turnsExpected: 5,
    },
  ];

  ZK.seed.scenes = function () {
    const rng = U.makeRng(3307);
    return SCENE_ROWS.map((s, i) =>
      Object.assign({}, s, {
        createdAt: U.daysAgo(rng.int(20, 140)),
        published: true,
        playCount: rng.int(24, 168),
        avgScore: Number((68 + rng.float(0, 22)).toFixed(1)),
        ownerId: s.courseId === "c_crossculture" ? "u_teacher2" : "u_teacher",
        owner: s.courseId === "c_crossculture" ? "陈慧珊" : "李明远",
        classes: s.courseId === "c_crossculture" ? ["cls_cross1"] : ["cls_biz1", "cls_biz2"],
        gradeWeight: i < 2 ? 15 : 10,
      })
    );
  };

  /* ===================== 二、已有实训对话记录 ===================== */
  const SESSION_SEED = [
    {
      sceneId: "sc_001", learnerId: "l_001", learner: "王梓涵", cls: "2022级商务英语1班",
      status: "completed", score: 84.5,
      turns: [
        { role: "ai", text: SCENE_ROWS[0].opening, at: -8 },
        {
          role: "me", at: -7,
          text: "Dear Daniel, thank you for your interest in our smart thermostat. I understand price is a key factor for you. Let me confirm the specification first: do you need the Wi-Fi version or the standard model? For 2,000 units of the Wi-Fi version, our FOB Shanghai price is USD 42.00 per unit.",
        },
        {
          role: "ai", at: -6,
          text: "Wi-Fi version. But USD 42.00 is well above what I'm paying now. My other quote is USD 38.50. I need you to move closer to that number.",
        },
        {
          role: "me", at: -5,
          text: "I appreciate your candour. Let me be equally direct about where we can and cannot go. USD 38.50 is below our production cost for the Wi-Fi model. What I can offer is a tiered structure: USD 40.50 for 2,000 units, or USD 39.20 if you increase to 3,000 units. Both prices are FOB Shanghai and valid for 30 days.",
        },
        {
          role: "ai", at: -4,
          text: "Interesting. The 3,000-unit price is closer. But I can't commit to 3,000 without knowing your lead time and payment terms.",
        },
        {
          role: "me", at: -3,
          text: "Lead time is 35 days from receipt of your purchase order. On payment, our standard terms are 30% deposit by T/T and the balance against the copy of the bill of lading. If you can accept a 40% deposit, I can hold the USD 39.20 price and prioritise your order in the production queue.",
        },
        {
          role: "ai", at: -2,
          text: "40% is more than I'd like. I can do 35%. If you accept, we have a deal on 3,000 units.",
        },
        {
          role: "me", at: -1,
          text: "35% works for us if you confirm the order by the end of this week. I'll send a revised proforma invoice today reflecting 3,000 units at USD 39.20, FOB Shanghai, 35% deposit, 35-day lead time. Please review and let me know if anything needs adjusting.",
        },
      ],
      dims: [
        { name: "商务信息准确", score: 27, weight: 30 },
        { name: "谈判策略得当", score: 26, weight: 30 },
        { name: "语言得体专业", score: 21, weight: 25 },
        { name: "推进节奏有效", score: 11, weight: 15 },
      ],
      advice: [
        "价格层级设计清晰，用 3,000 台的数量门槛换取 4% 的让步空间，条件交换逻辑成立，这是本次对话最突出的处理。",
        "对 USD 38.50 的竞争报价，未做核实的反驳略显生硬。可先追问对方报价所包含的服务范围（是否含运保费、质保期长短），再指出不可比之处，说服力会更强。",
        "付款条件与交期在最后一轮才明确，节奏偏后。建议在第二轮报价时同步给出交期与付款框架，避免对方在中途因信息不全而观望。",
        "语言层面，“I appreciate your candour” 与 “Let me be equally direct” 的呼应处理得体，商务语域准确；但 “works for us” 偏口语，正式函电中宜改为 is acceptable to us。",
      ],
    },
    {
      sceneId: "sc_002", learnerId: "l_003", learner: "赵思远", cls: "2022级商务英语1班",
      status: "completed", score: 71,
      turns: [
        { role: "ai", text: SCENE_ROWS[1].opening, at: -5 },
        {
          role: "me", at: -4,
          text: "Dear Somchai, I am sorry for the delay. The typhoon was very strong and our factory stopped for two weeks. We cannot deliver on time. Please understand the situation. We will try our best to deliver as soon as possible.",
        },
        {
          role: "ai", at: -3,
          text: "I understand the typhoon is beyond your control. But 'as soon as possible' is not a plan. My production line starts on the 15th. I need concrete dates and I need to know who bears the cost of the air freight if we run out of stock.",
        },
        {
          role: "me", at: -2,
          text: "We can deliver 60% of the goods on the 12th and the rest on the 25th. If you need air freight for the urgent part, we can share the cost, maybe 50% each. We hope you can accept this solution.",
        },
        {
          role: "ai", at: -1,
          text: "Fifty-fifty on air freight is a starting point, but the penalty clause is separate. And I want the 60% commitment written into an amendment.",
        },
      ],
      dims: [
        { name: "事实陈述清晰", score: 17, weight: 25 },
        { name: "方案可行具体", score: 22, weight: 30 },
        { name: "责任边界清晰", score: 18, weight: 25 },
        { name: "关系维护到位", score: 14, weight: 20 },
      ],
      advice: [
        "首轮回复过于笼统，“we cannot deliver on time” 直接给出否定结论，却未提供任何支撑事实与补救路径，导致对方下一轮不得不追问细节。建议开场即给出时间线：台风起止日期、停产天数、复工日期。",
        "“share the cost, maybe 50% each” 中的 maybe 削弱了方案的确定性。商务谈判中提出的方案应当明确，可用 We are prepared to bear 50% of the air freight, subject to your confirmation 表达同等让步意愿而不显犹豫。",
        "全篇未引用合同条款。延迟交付涉及不可抗力条款与违约金条款，应明确引用条款编号并说明责任划分依据，否则对方会持续试探责任边界。",
        "欠缺对长期合作关系的回应。客户合作三年，本应在方案中体现对关系的重视，例如主动提出优先排产或下批订单的价格补偿。",
      ],
    },
  ];

  ZK.seed.practiceSessions = function () {
    const rng = U.makeRng(6631);
    const sessions = SESSION_SEED.map((s, i) =>
      Object.assign({}, s, {
        id: "ps_" + String(i + 1).padStart(3, "0"),
        startedAt: U.daysAgo(rng.int(1, 12)),
        finishedAt: U.daysAgo(rng.int(0, 1)),
        imageSubmission: null,
      })
    );
    // 补充若干条学生完成记录（用于场景统计）：人员以 learners 花名册为准
    const EXTRA_IDS = ["l_010", "l_017", "l_024", "l_031", "l_038", "l_045", "l_052", "l_059"];
    const roster = ZK.seed.learners();
    const byId = {};
    roster.forEach((l) => (byId[l.id] = l));
    const clsName = {};
    ZK.seed.classes().forEach((c) => (clsName[c.id] = c.name));
    EXTRA_IDS.forEach((lid, i) => {
      const l = byId[lid];
      if (!l) return;
      const sc = SCENE_ROWS[i % SCENE_ROWS.length];
      sessions.push({
        id: "ps_1" + String(i).padStart(2, "0"),
        sceneId: sc.id,
        learnerId: l.id,
        learner: l.name,
        cls: clsName[l.classId] || "—",
        status: "completed",
        score: Number((62 + rng.float(0, 32)).toFixed(1)),
        turns: [],
        dims: sc.rubric.map((r) => ({
          name: r.name,
          weight: r.weight,
          score: Number(((62 + rng.float(0, 34)) / 100 * r.weight).toFixed(1)),
        })),
        advice: [],
        startedAt: U.daysAgo(rng.int(3, 30)),
        finishedAt: U.daysAgo(rng.int(0, 3)),
        imageSubmission: null,
      });
    });
    return sessions;
  };

  /* ===================== 三、图片提交评分记录 ===================== */
  ZK.seed.imageSubmissions = function () {
    const rng = U.makeRng(8812);
    const rows = [
      {
        id: "img_001", learnerId: "l_001", learner: "王梓涵", cls: "2022级商务英语1班",
        sceneId: "sc_001", title: "商务函电排版截图",
        desc: "期中作业：按商务函电格式规范提交函件截图，检查抬头、正文分段、落款与附件标注是否规范。",
        fileName: "business-letter-layout.png", width: 1440, height: 900, sizeKB: 386,
        format: "PNG", colorfulness: 0.34, inkRatio: 0.11, aspect: 1.6, edgeDensity: 0.27,
        score: 88, verdict: "符合商务函电排版规范",
        dims: [
          { name: "格式规范", weight: 40, score: 36 },
          { name: "版式清晰", weight: 30, score: 27 },
          { name: "内容完整", weight: 30, score: 25 },
        ],
        advice: [
          "页面留白比例适中，抬头、正文、落款三段式结构完整，符合商务函电的版面要求。",
          "附件标注位置偏低且未与正文建立视觉分隔，建议增加一行间距并使用 “Enclosure:” 前缀统一标注。",
          "页面整体灰度偏高、信息层级对比不足，建议标题与正文形成更明显的字号差异。",
        ],
        submittedAt: U.daysAgo(3),
      },
      {
        id: "img_002", learnerId: "l_003", learner: "赵思远", cls: "2022级商务英语1班",
        sceneId: "sc_002", title: "合同条款批注图",
        desc: "对照合同原文标注译文中的术语不一致处，用批注框标出并截图提交。",
        fileName: "contract-annotation.jpg", width: 1280, height: 1024, sizeKB: 612,
        format: "JPG", colorfulness: 0.62, inkRatio: 0.19, aspect: 1.25, edgeDensity: 0.41,
        score: 74, verdict: "批注有效但不完整",
        dims: [
          { name: "标注准确性", weight: 45, score: 33 },
          { name: "批注覆盖面", weight: 30, score: 21 },
          { name: "可读性", weight: 25, score: 20 },
        ],
        advice: [
          "已标注 force majeure 的两种译法，定位准确。",
          "liquidated damages 的三处不一致中仅标注了一处，批注覆盖面不足，建议重新通篇核查术语字段。",
          "批注框重叠较多，遮挡了原文内容，建议改用页边批注或编号引注方式。",
        ],
        submittedAt: U.daysAgo(5),
      },
    ];
    rows.forEach((r, i) => {
      r.at = U.daysAgo(i + 2);
      r.seedRandom = rng.int(1, 9);
    });
    return rows;
  };

  /* ===================== 四、作品型任务 ===================== */
  const TASK_ROWS = [
    {
      id: "tk_001", title: "商务合同条款翻译（中译英）", courseId: "c_biztrans", course: "商务英语笔译",
      type: "翻译作品", chapter: 4, total: 100, deadlineDays: 6, publishedDays: 12,
      desc: "翻译给定的采购合同第 3、5、7 条，提交中英对照的图文混排文档，需包含条款要素分析说明与术语处理依据。",
      deliverables: ["中英对照译文文档（图文混排）", "条款要素分析说明", "术语处理依据表"],
      classes: ["cls_biz1", "cls_biz2"],
      aiRoles: [
        {
          id: "role_legal", name: "法律审校专家", persona: "具备十年涉外合同审校经验的法律文本专家", weight: 45,
          focus: "信息完整性与法律责任准确性",
          dimensions: [
            { name: "条款要素完整", weight: 40, desc: "主体、行为、对象、条件、时限、例外六要素齐备", signals: ["主体", "甲方", "乙方", "条件", "时限", "例外", "期限", "起算"], anti: [] },
            { name: "情态动词准确", weight: 35, desc: "shall/may/will 使用符合义务、授权、陈述的区分", signals: ["shall", "may", "will", "义务", "授权", "陈述"], anti: ["must shall"] },
            { name: "责任边界清晰", weight: 25, desc: "责任归属表述无歧义，无归因模糊", signals: ["责任", "承担", "Party A", "Party B", "liable", "responsible"], anti: [] },
          ],
        },
        {
          id: "role_term", name: "术语管理专家", persona: "企业级术语库管理员", weight: 30,
          focus: "术语一致性与规范符合度",
          dimensions: [
            { name: "术语一致性", weight: 50, desc: "同一概念全篇使用同一译法", signals: ["术语", "一致", "统一", "force majeure", "liquidated damages", "under this Contract"], anti: [] },
            { name: "术语库符合度", weight: 30, desc: "符合课程组强制术语要求", signals: ["Party A", "Party B", "under this Contract"], anti: ["of this Contract"] },
            { name: "数字金额规范", weight: 20, desc: "金额采用数字加大写双重形式，单位换算正确", signals: ["USD", "SAY", "大写", "元整"], anti: ["‰"] },
          ],
        },
        {
          id: "role_client", name: "客户方代表", persona: "海外客户方项目经理，关注可读性与执行便利", weight: 25,
          focus: "可读性与执行可操作性",
          dimensions: [
            { name: "语句通顺度", weight: 45, desc: "英文表达符合法律英语惯例，无中式英语", signals: ["thereof", "hereunder", "provided that", "in witness whereof"], anti: [] },
            { name: "格式规范度", weight: 30, desc: "条款编号层级、签署栏、附件引用保留完整", signals: ["条款", "编号", "附件", "签署"], anti: [] },
            { name: "执行便利性", weight: 25, desc: "关键义务与时限一目了然", signals: ["within", "days", "from the date"], anti: [] },
          ],
        },
      ],
      rubric: [
        { name: "信息准确完整", weight: 45, desc: "条款要素无遗漏、无增添、无意思偏离" },
        { name: "术语与数字规范", weight: 30, desc: "术语一致、金额与单位规范" },
        { name: "语言与格式规范", weight: 25, desc: "法律英语表达地道，格式层级完整" },
      ],
    },
    {
      id: "tk_002", title: "跨文化冲突案例分析报告", courseId: "c_crossculture", course: "跨文化交际",
      type: "分析报告", chapter: 6, total: 100, deadlineDays: 3, publishedDays: 8,
      desc: "选取一例真实的跨文化商务冲突，按“行为—归因—偏差—化解”四段式框架撰写分析报告，需配图说明沟通流程。",
      deliverables: ["案例分析报告（图文混排）", "冲突流程图", "化解方案执行清单"],
      classes: ["cls_cross1"],
      aiRoles: [
        {
          id: "role_theory", name: "跨文化理论评审", persona: "跨文化交际研究方向评审专家", weight: 40,
          focus: "理论框架运用的准确性",
          dimensions: [
            { name: "框架运用", weight: 40, desc: "四段式框架完整且逻辑自洽", signals: ["行为", "归因", "偏差", "化解", "四段式"], anti: [] },
            { name: "理论支撑", weight: 35, desc: "正确引用文化维度、高语境低语境等理论", signals: ["霍夫斯泰德", "高语境", "低语境", "文化维度", "权力距离", "个人主义", "不确定性规避"], anti: [] },
            { name: "归因深度", weight: 25, desc: "区分文化性行为与个人性意图，避免刻板印象", signals: ["归因偏差", "刻板印象", "文化性", "误判"], anti: [] },
          ],
        },
        {
          id: "role_practice", name: "实务方案评审", persona: "跨国企业人力资源与合规实务专家", weight: 35,
          focus: "化解方案的可执行性",
          dimensions: [
            { name: "方案具体性", weight: 50, desc: "落到可执行的流程约定，非空泛表述", signals: ["决策链条", "响应时限", "文化中介", "复盘", "流程约定"], anti: ["加强沟通", "增进理解", "提高认识"] },
            { name: "可验证性", weight: 30, desc: "方案含可检查的节点或指标", signals: ["节点", "指标", "检查", "时限", "负责人"], anti: [] },
            { name: "风险预判", weight: 20, desc: "对方案可能带来的新问题有预判", signals: ["风险", "副作用", "边界", "前提"], anti: [] },
          ],
        },
        {
          id: "role_writing", name: "学术写作评审", persona: "学术论文写作指导教师", weight: 25,
          focus: "文本规范与表达质量",
          dimensions: [
            { name: "结构规范", weight: 40, desc: "摘要、主体、结论层次清晰", signals: ["摘要", "结论", "一、", "二、", "综上"], anti: [] },
            { name: "论证严谨", weight: 35, desc: "论据与论点匹配，无逻辑跳跃", signals: ["因此", "据此", "证据", "表明", "说明"], anti: [] },
            { name: "表达质量", weight: 25, desc: "语言准确简洁，术语使用规范", signals: [], anti: [] },
          ],
        },
      ],
      rubric: [
        { name: "理论运用", weight: 40, desc: "框架完整、理论引用准确" },
        { name: "方案可执行", weight: 35, desc: "化解方案具体可验证" },
        { name: "写作规范", weight: 25, desc: "结构清晰、论证严谨" },
      ],
    },
    {
      id: "tk_003", title: "企业级术语库建设与质量评估报告", courseId: "c_biztrans", course: "商务英语笔译",
      type: "实践报告", chapter: 6, total: 100, deadlineDays: 11, publishedDays: 3,
      desc: "基于给定双语语料建设不少于 30 条术语的术语库，撰写质量评估报告，说明术语提取方法、一致性检查规则与评估结果。",
      deliverables: ["术语库文件（不低于 30 条）", "质量评估报告", "一致性检查规则清单"],
      classes: ["cls_biz1", "cls_biz2"],
      aiRoles: [
        {
          id: "role_term2", name: "术语库评审专家", persona: "翻译技术方向的术语管理专家", weight: 50,
          focus: "术语库结构完整性与条目质量",
          dimensions: [
            { name: "条目完整性", weight: 40, desc: "条目含定义、词性、领域、语境例句等必要字段", signals: ["定义", "词性", "领域", "例句", "同义词", "来源"], anti: [] },
            { name: "条目数量达标", weight: 20, desc: "术语条目不低于 30 条", signals: ["条", "术语"], anti: [] },
            { name: "定义准确性", weight: 40, desc: "定义能区分近义术语，避免循环定义", signals: ["指", "表示", "区别于", "即"], anti: [] },
          ],
        },
        {
          id: "role_qc", name: "质控流程评审", persona: "翻译项目管理与质控专家", weight: 30,
          focus: "检查规则与质控链条设计",
          dimensions: [
            { name: "规则可执行", weight: 45, desc: "检查规则可脚本化或工具化落地", signals: ["脚本", "规则", "检查", "阈值", "工具"], anti: [] },
            { name: "流程闭环", weight: 35, desc: "包含译中约束与译后复核两个环节", signals: ["译中", "译后", "复核", "回写", "记录"], anti: [] },
            { name: "权限与版本", weight: 20, desc: "含权限分级与版本管理设计", signals: ["权限", "版本", "审核", "锁定"], anti: [] },
          ],
        },
        {
          id: "role_writing2", name: "报告写作评审", persona: "技术报告写作指导教师", weight: 20,
          focus: "报告结构与数据呈现",
          dimensions: [
            { name: "结构完整", weight: 45, desc: "含背景、方法、结果、结论四部分", signals: ["背景", "方法", "结果", "结论"], anti: [] },
            { name: "数据支撑", weight: 35, desc: "结论有统计数据或检查结果支撑", signals: ["%", "条", "处", "占比", "统计"], anti: [] },
            { name: "图表运用", weight: 20, desc: "恰当使用表格或图示呈现术语库结构", signals: ["表", "图", "清单"], anti: [] },
          ],
        },
      ],
      rubric: [
        { name: "术语库质量", weight: 50, desc: "条目完整、定义准确、数量达标" },
        { name: "质控设计", weight: 30, desc: "规则可执行、流程闭环" },
        { name: "报告规范", weight: 20, desc: "结构完整、有数据支撑" },
      ],
    },
    {
      id: "tk_004", title: "商务函电撰写与翻译综合作业", courseId: "c_biztrans", course: "商务英语笔译",
      type: "翻译作品", chapter: 2, total: 100, deadlineDays: -2, publishedDays: 22,
      desc: "根据给定的商务情境（客户拒收批次货物），先撰写中文函件，再译为英文，提交图文混排文档并附语域分析。",
      deliverables: ["中文函件", "英文译文", "语域与礼貌层级分析"],
      classes: ["cls_biz1", "cls_biz2"],
      aiRoles: [
        {
          id: "role_email", name: "商务沟通评审", persona: "跨国企业商务沟通培训师", weight: 50,
          focus: "语域、礼貌层级与沟通效果",
          dimensions: [
            { name: "语域恰当", weight: 40, desc: "正式函电语域，无口语化表达", signals: ["Dear", "Yours sincerely", "we regret", "we note that", "please find"], anti: ["works for us", "gonna", "ok", "btw"] },
            { name: "礼貌层级", weight: 35, desc: "拒绝与索赔事项采用缓和式表达", signals: ["we regret", "we would appreciate", "we wonder", "while we appreciate"], anti: ["cannot accept", "we refuse"] },
            { name: "结构完整", weight: 25, desc: "事实陈述—依据引用—请求行动三段式", signals: ["We note that", "According to", "We therefore request", "Clause"], anti: [] },
          ],
        },
        {
          id: "role_lang", name: "语言质量评审", persona: "英语写作与翻译教师", weight: 30,
          focus: "语言准确性与表达质量",
          dimensions: [
            { name: "语法准确", weight: 45, desc: "无语法与搭配错误", signals: [], anti: [] },
            { name: "表达地道", weight: 35, desc: "符合英文商务函电表达惯例", signals: ["we are pleased", "we look forward to", "should you"], anti: ["中式"] },
            { name: "术语规范", weight: 20, desc: "商务术语使用准确", signals: ["shipment", "invoice", "packing list", "claim"], anti: [] },
          ],
        },
        {
          id: "role_analysis", name: "语域分析评审", persona: "语体学与对比语言学研究专家", weight: 20,
          focus: "对话轮的语域分析深度",
          dimensions: [
            { name: "分析深度", weight: 55, desc: "能说明改译理由，而非仅罗列差异", signals: ["因此", "对比", "原因", "层级", "意图"], anti: [] },
            { name: "理论引用", weight: 45, desc: "引用语域、礼貌原则等相关理论", signals: ["语域", "礼貌原则", "面子", "语体", "层级"], anti: [] },
          ],
        },
      ],
      rubric: [
        { name: "语域与礼貌", weight: 50, desc: "函电语域恰当、礼貌层级准确" },
        { name: "语言质量", weight: 30, desc: "语法准确、表达地道" },
        { name: "语域分析", weight: 20, desc: "分析有深度、有理论支撑" },
      ],
    },
  ];

  ZK.seed.tasks = function () {
    const rng = U.makeRng(5150);
    return TASK_ROWS.map((t) =>
      Object.assign({}, t, {
        ownerId: t.courseId === "c_crossculture" ? "u_teacher2" : "u_teacher",
        owner: t.courseId === "c_crossculture" ? "陈慧珊" : "李明远",
        publishAt: U.daysAgo(t.publishedDays),
        deadline: U.daysAgo(t.publishedDays) + (t.publishedDays + t.deadlineDays) * 86400000,
        status: t.deadlineDays < 0 ? "closed" : "open",
        createdAt: U.daysAgo(t.publishedDays + 2),
        allowResubmit: true,
        peerReview: rng.bool(0.4),
      })
    );
  };

  /* ===================== 五、学生作品提交 ===================== */
  ZK.seed.submissions = function () {
    const rows = [
      {
        id: "sb_001", taskId: "tk_001", learnerId: "l_001", learner: "王梓涵", cls: "2022级商务英语1班",
        title: "采购合同第 3、5、7 条中英对照译文", submittedAt: U.daysAgo(2), status: "reviewed",
        score: 86.5, gradeLabel: "良好",
        blocks: [
          { type: "text", text: "一、条款要素分析\n第 3 条为付款条款，构成要素为主体（甲方）、行为（支付）、对象（合同项下全部未付款项）、条件（收到乙方书面通知）、时限（三十日内）。第 5 条为交货条款，含例外情形（不可抗力）。第 7 条为违约责任条款，需明确违约金计算基数与比例。" },
          { type: "text", text: "二、中英对照译文\n【第 3 条】甲方应在收到乙方书面通知之日起三十日内，向乙方支付本合同项下全部未付款项。\nParty A shall pay to Party B all amounts outstanding under this Contract within thirty (30) days from the date of receipt of the written notice from Party B." },
          { type: "image", name: "条款结构拆解示意", note: "以树形结构标出第 3 条六要素的对应关系" },
          { type: "text", text: "【第 5 条】乙方应于本合同生效之日起九十日内完成全部货物的交付。因不可抗力致使乙方不能按期交付的，交付期限相应顺延，但乙方应在不可抗力事件发生后十五日内书面通知甲方并提供有效证明。\nParty B shall complete the delivery of all goods within ninety (90) days from the date this Contract takes effect. Where Party B is prevented from delivering on schedule by force majeure, the delivery period shall be extended accordingly, provided that Party B shall notify Party A in writing within fifteen (15) days of the occurrence of such force majeure event and provide valid supporting evidence." },
          { type: "text", text: "【第 7 条】乙方逾期交货的，每逾期一日应按合同总价的千分之三向甲方支付违约金，违约金总额不超过合同总价的百分之十。\nIn the event of late delivery by Party B, Party B shall pay Party A liquidated damages equal to 0.3% of the total contract price for each day of delay, provided that the aggregate liquidated damages shall not exceed 10% of the total contract price." },
          { type: "image", name: "术语处理依据表", note: "列出 under this Contract、force majeure、liquidated damages 的处理依据与来源" },
          { type: "text", text: "三、术语处理依据\n1）under this Contract：合同项下关系使用介词 under 表达，符合法律英语惯例，不使用 of this Contract。2）force majeure：保留法语源形式，首次出现时以斜体标注，不译为 irresistible force。3）liquidated damages：约定违约金，区分于 penalty（惩罚性违约金），后者在英美法下可能不被执行。" },
        ],
        aiReview: {
          at: U.daysAgo(2),
          overall: 86.5,
          summary:
            "译文整体质量良好。三个条款的六要素识别完整，情态动词使用准确，shall 与 will 的功能区分清晰。术语处理依据说明到位，under this Contract 与 liquidated damages 的处理符合法律英语惯例。主要失分点在于第 7 条违约金上限的表述层次可再优化，以及条款编号层级在译文中未完全保留。",
          roles: [
            { roleId: "role_legal", roleName: "法律审校专家", score: 88, weight: 45 },
            { roleId: "role_term", roleName: "术语管理专家", score: 87, weight: 30 },
            { roleId: "role_client", roleName: "客户方代表", score: 83, weight: 25 },
          ],
          dims: [
            { role: "法律审校专家", name: "条款要素完整", score: 36, weight: 40 },
            { role: "法律审校专家", name: "情态动词准确", score: 31, weight: 35 },
            { role: "法律审校专家", name: "责任边界清晰", score: 21, weight: 25 },
            { role: "术语管理专家", name: "术语一致性", score: 45, weight: 50 },
            { role: "术语管理专家", name: "术语库符合度", score: 27, weight: 30 },
            { role: "术语管理专家", name: "数字金额规范", score: 15, weight: 20 },
            { role: "客户方代表", name: "语句通顺度", score: 38, weight: 45 },
            { role: "客户方代表", name: "格式规范度", score: 24, weight: 30 },
            { role: "客户方代表", name: "执行便利性", score: 21, weight: 25 },
          ],
          highlights: [
            "第 5 条把「因不可抗力致使乙方不能按期交付」处理为 Where Party B is prevented from delivering on schedule by force majeure，用 where 引导条件从句替代直译的 if because of，符合法律英语惯例。",
            "明确区分 liquidated damages 与 penalty，并在术语依据中说明后者在英美法下可能不被执行，体现了对法律术语内涵的理解。",
            "金额与比例同时使用阿拉伯数字与英文拼写形式，降低篡改风险。",
          ],
          issues: [
            { level: "三级", text: "第 7 条「违约金总额不超过合同总价的百分之十」处理为 provided that the aggregate liquidated damages shall not exceed 10%，provided that 在此处引导限制性条件，但原条款中该限制与违约金比例是并列关系，建议改用 and the aggregate liquidated damages shall not exceed 10% of the total contract price，避免读作对整句的限制。", deduct: 1.5 },
            { level: "四级", text: "译文未保留原文的条款编号层级（第 3 条、第 5 条、第 7 条的层级关系），建议在译文标题中使用 Article 3 / Article 5 / Article 7 统一标注。", deduct: 0.5 },
            { level: "三级", text: "「乙方应于本合同生效之日起九十日内完成全部货物的交付」中的「完成交付」译为 complete the delivery，语义上侧重过程完成；法律文本中更宜使用 deliver all goods within ninety (90) days，突出义务的完成节点。", deduct: 1.5 },
          ],
          advice: [
            "结构层次上，建议在译文前增加条款要素对照表，把六要素与译文成分一一对应，便于客户方快速核对，也可减少沟通成本。",
            "术语一致性的检查建议固定到交付前的自检清单中。本次译文术语使用完全统一，但依托的是人工通读，规模化项目中应使用一致性检查脚本。",
            "情态动词方面已掌握 shall 表义务、will 表陈述的基本区分，下一步可以练习 should 在合同中的非常规用法，例如在条件句中表达可能性较低的情形。",
          ],
        },
      },
      {
        id: "sb_002", taskId: "tk_002", learnerId: "l_067", learner: "胡骁然", cls: "2023级跨文化交际1班",
        title: "中德合资项目进度会议冲突案例分析", submittedAt: U.daysAgo(1), status: "reviewed",
        score: 79, gradeLabel: "中等",
        blocks: [
          { type: "text", text: "摘要：本报告分析一起中德合资项目进度会议中的沟通冲突，运用霍夫斯泰德文化维度与高低语境理论进行归因分析，并提出可执行的化解方案。" },
          { type: "text", text: "一、行为：德方项目经理在会议中直接指出中方团队提交的进度报告「数据缺失，无法判断」，并当场要求给出明确的完成日期。中方项目成员未直接回应，会后通过邮件补充了说明。德方随即在邮件中再次追问，认为中方回避问题。" },
          { type: "text", text: "二、归因：德方的直接反馈在低语境文化中被视为对事不对人的常规做法，其意图是获取可决策的信息。中方的会后补充说明在高语境文化中是一种保全体面并寻求内部共识的处理方式。双方均按自身文化逻辑解读对方行为，德方将中方的沉默归因为回避责任，中方将德方的追问归因为不信任与施压。" },
          { type: "image", name: "冲突归因流程图", note: "行为 → 归因 → 偏差 → 结果 四阶段流程图" },
          { type: "text", text: "三、偏差：本次冲突存在两处归因偏差。一是把文化性行为解释为个人性意图，德方将沉默解读为态度问题；二是不确定性规避维度差异未被识别，德方所属文化对不确定性规避程度较高，需要明确的日期与数据来降低风险感知，而中方对模糊表述的容忍度更高。" },
          { type: "text", text: "四、化解：1）建立共同的过程约定，明确进度报告的必填字段与提交时限，减少对信息完整度的解释空间。2）约定会议反馈规则，直接反馈用于事实与数据，涉及人员评价的内容改为会后单独沟通。3）设置文化中介角色，由具备双方工作经验的成员在会后同步双方的真实意图。" },
          { type: "text", text: "结论：跨文化冲突的化解不能停留在加强沟通的层面，需要把文化差异转化为可执行的流程约定。" },
        ],
        aiReview: {
          at: U.daysAgo(1),
          overall: 79,
          summary:
            "报告完整运用了四段式分析框架，归因分析部分区分了文化性行为与个人性意图，理论引用基本准确。主要不足在于化解方案的可验证性不足，三条方案中仅第一条含明确的可检查节点，其余两条缺少责任人与时限。此外，结论部分较简短，未对方案可能带来的新问题做预判。",
          roles: [
            { roleId: "role_theory", roleName: "跨文化理论评审", score: 84, weight: 40 },
            { roleId: "role_practice", roleName: "实务方案评审", score: 72, weight: 35 },
            { roleId: "role_writing", roleName: "学术写作评审", score: 81, weight: 25 },
          ],
          dims: [
            { role: "跨文化理论评审", name: "框架运用", score: 34, weight: 40 },
            { role: "跨文化理论评审", name: "理论支撑", score: 30, weight: 35 },
            { role: "跨文化理论评审", name: "归因深度", score: 20, weight: 25 },
            { role: "实务方案评审", name: "方案具体性", score: 35, weight: 50 },
            { role: "实务方案评审", name: "可验证性", score: 22, weight: 30 },
            { role: "实务方案评审", name: "风险预判", score: 15, weight: 20 },
            { role: "学术写作评审", name: "结构规范", score: 33, weight: 40 },
            { role: "学术写作评审", name: "论证严谨", score: 30, weight: 35 },
            { role: "学术写作评审", name: "表达质量", score: 18, weight: 25 },
          ],
          highlights: [
            "把「德方直接反馈」与「中方会后补充」两种行为分别放回各自文化逻辑中解读，避免了单方面归责，归因分析层次清楚。",
            "引入不确定性规避维度解释德方对明确日期的需求，比仅使用高语境低语境框架更有解释力。",
          ],
          issues: [
            { level: "三级", text: "化解方案第 2、3 条缺少责任人与完成时限，可执行性不足。建议补充「由项目经理在两周内更新会议反馈规则并纳入会议纪要模板」。", deduct: 1.5 },
            { level: "三级", text: "结论部分仅两句，未对化解方案可能带来的新问题作预判。例如直接反馈改为会后沟通，可能降低会议的信息同步效率，需说明适用边界。", deduct: 1.5 },
            { level: "二级", text: "第三部分对「面子」概念的使用缺少界定，直接以「保全体面」解释中方行为，未说明所依据的礼貌理论，理论表述不够严谨。", deduct: 3 },
          ],
          advice: [
            "方案设计建议补充「谁在什么时间完成什么动作、如何验证」，使方案具备可检查性，这也是本次主要失分点。",
            "结论部分可以增加方案风险预判，说明化解措施的适用边界与可能的副作用，这会让分析从描述性上升到决策支持层面。",
            "理论引用处建议给出出处（作者与年份），提高学术规范度。",
          ],
        },
      },
      {
        id: "sb_003", taskId: "tk_004", learnerId: "l_003", learner: "赵思远", cls: "2022级商务英语1班",
        title: "客户拒收批次货物函件及英译", submittedAt: U.daysAgo(0), status: "pending",
        score: null, gradeLabel: null,
        blocks: [
          { type: "text", text: "中文函件（草稿）：\n尊敬的客户：关于贵方拒收第 20250912 批次货物事宜，我方已核查相关记录。该批次货物在装运前已经过质量检验并取得合格证明，检验项目包括外观、尺寸与功能测试。贵方拒收理由为外观不符合要求，但具体不符合项目未在通知中列明。我方无法接受该拒收决定，请贵方提供详细的检验报告。" },
        ],
        aiReview: null,
      },
    ];
    return rows;
  };
})();
