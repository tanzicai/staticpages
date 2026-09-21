/* ==========================================================================
   种子数据 · 内容安全（词库 / 名单 / 发布内容 / 检测语料）
   ========================================================================== */
window.ZK = window.ZK || {};
ZK.seed = ZK.seed || {};

(function () {
  "use strict";
  const U = ZK.util;

  /* ===================== 一、敏感关键词库 ===================== */
  /* [词, 类别, 级别(高/中/低), 处置动作, 命中次数] */
  const KW_ROWS = [
    ["代写论文", "学术不端", "高", "拦截并上报", 42],
    ["代写作业", "学术不端", "高", "拦截并上报", 37],
    ["代考", "学术不端", "高", "拦截并上报", 18],
    ["包过", "学术不端", "高", "拦截并上报", 25],
    ["论文降重服务", "学术不端", "中", "机器审核", 31],
    ["刷课", "学术不端", "中", "机器审核", 22],
    ["挂机脚本", "学术不端", "高", "拦截并上报", 14],
    ["考试答案出售", "涉密信息", "高", "拦截并上报", 9],
    ["内部真题", "涉密信息", "高", "拦截并上报", 11],
    ["泄题", "涉密信息", "高", "拦截并上报", 7],
    ["兼职刷单", "广告导流", "中", "机器审核", 46],
    ["日结兼职", "广告导流", "中", "机器审核", 29],
    ["加微信", "广告导流", "中", "机器审核", 88],
    ["扫码进群", "广告导流", "中", "机器审核", 53],
    ["点击链接领取", "广告导流", "中", "机器审核", 61],
    ["返利", "广告导流", "低", "仅记录", 74],
    ["私域引流", "广告导流", "中", "机器审核", 33],
    ["办证", "违规服务", "高", "拦截并上报", 12],
    ["代开发票", "违规服务", "高", "拦截并上报", 16],
    ["破解版", "侵权盗版", "中", "机器审核", 41],
    ["盗版教材", "侵权盗版", "中", "机器审核", 28],
    ["外挂", "违规服务", "高", "拦截并上报", 15],
    ["博彩", "涉赌信息", "高", "拦截并上报", 10],
    ["赌球", "涉赌信息", "高", "拦截并上报", 6],
    ["高利贷", "违规金融", "高", "拦截并上报", 5],
    ["贷款秒批", "违规金融", "高", "拦截并上报", 13],
    ["套现", "违规金融", "高", "拦截并上报", 8],
    ["辱骂", "攻击谩骂", "中", "机器审核", 19],
    ["人身攻击", "攻击谩骂", "中", "机器审核", 12],
    ["刷屏", "恶意行为", "低", "仅记录", 57],
    ["垃圾信息", "恶意行为", "低", "仅记录", 21],
  ];

  ZK.seed.safetyKeywords = function () {
    const rng = U.makeRng(2214);
    return KW_ROWS.map((r, i) => ({
      id: "kw_" + String(i + 1).padStart(3, "0"),
      word: r[0],
      category: r[1],
      level: r[2],
      action: r[3],
      hits: r[4],
      wholeWord: ["加微信", "返利", "包过", "外挂", "刷屏"].indexOf(r[0]) >= 0,
      enabled: true,
      addedBy: "张立信",
      addedAt: U.daysAgo(rng.int(10, 200)),
    }));
  };

  /* ===================== 二、忽略词（降低误判） ===================== */
  ZK.seed.ignoreWords = function () {
    const rows = [
      ["免费", "课程语境中“免费公开课”“免费开放资源”为正常表述", "张立信"],
      ["考试", "与“考试大纲”“考试安排”组合时属正常教学用语", "张立信"],
      ["刷", "与“刷卡”“刷新”组合时非垃圾语义", "张立信"],
      ["链接", "与“参考资料链接”“文献链接”组合时属正常学术引用", "李明远"],
      ["领取", "与“领取教材”“领取证书”组合时属正常通知", "李明远"],
      ["群", "与“课程群”“小组群”组合时属教学组织用语", "陈慧珊"],
      ["兼职", "与“兼职翻译”“兼职助教”组合时属正常岗位信息", "陈慧珊"],
      ["内部", "与“内部讲义”“内部资料”组合时属课程资源表述", "张立信"],
      ["答案", "与“参考答案”“标准答案”组合时属教学资源", "李明远"],
      ["代理", "与“代理商”“代理流程”组合时属商务术语", "李明远"],
    ];
    return rows.map((r, i) => ({
      id: "ig_" + String(i + 1).padStart(3, "0"),
      word: r[0],
      scene: r[1],
      addedBy: r[2],
      enabled: true,
      addedAt: U.daysAgo(30 + i * 9),
    }));
  };

  /* ===================== 三、用户黑白名单 ===================== */
  ZK.seed.nameLists = function () {
    /* 人员信息以 learners / users 为唯一来源；
       黑名单与 posts 中的恶意发布用户一一对应，保证「名单状态」真实参与风险值计算 */
    const byId = {};
    ZK.seed.learners().forEach((l) => (byId[l.id] = l));
    const clsName = {};
    ZK.seed.classes().forEach((c) => (clsName[c.id] = c.name));
    const byAccount = {};
    ZK.seed.users().forEach((u) => (byAccount[u.account] = u));

    const rows = [
      ["black", "l_026", "连续三次发布兼职刷单类内容，命中高等级关键词", "张立信", 46],
      ["black", "l_039", "多次发布代写论文广告，经警告后仍未停止", "张立信", 38],
      ["black", "l_080", "在讨论区发布外部引流链接，且拒绝整改", "陈慧珊", 24],
      ["black", "l_014", "多次发布破解版软件下载信息，构成侵权传播", "陈慧珊", 31],
      ["white", "l_001", "课程助教，可发布课程通知类内容，内容安全策略放宽", "李明远", 120],
      ["white", "l_003", "班级学习委员，承担资源分享职责", "李明远", 96],
      ["white", "T20190087", "授课教师，享白名单豁免", "张立信", 300],
      ["white", "T20170452", "授课教师，享白名单豁免", "张立信", 280],
    ];
    return rows.map((r, i) => {
      const l = byId[r[1]];
      const u = byAccount[r[1]] || null;
      return {
        id: "nl_" + String(i + 1).padStart(3, "0"),
        type: r[0],
        account: l ? l.sno : u ? u.account : "—",
        name: l ? l.name : u ? u.name : "—",
        org: l ? clsName[l.classId] || "—" : u ? u.org : "—",
        reason: r[2],
        addedBy: r[3],
        validDays: r[4],
        addedAt: U.daysAgo(r[4] > 200 ? 60 : r[4]),
        enabled: true,
      };
    });
  };

  /* ===================== 四、平台发布内容（风险统计的数据源） ===================== */
  const SPAM_TEMPLATES = [
    { text: "【兼职】线上日结兼职刷单，动动手指每天200+，加微信 abc123 详细了解，学生优先。", hits: ["兼职刷单", "日结兼职", "加微信"], level: "中" },
    { text: "代写论文，各专业均可，包过查重，价格从优，需要私聊加微信 dxy2026。", hits: ["代写论文", "包过", "加微信"], level: "高" },
    { text: "低价出考试答案出售，内部真题全覆盖，需要的同学扫码进群。", hits: ["考试答案出售", "内部真题", "扫码进群"], level: "高" },
    { text: "破解版翻译软件，永久授权，点击链接领取安装包，限时免费。", hits: ["破解版", "点击链接领取"], level: "中" },
    { text: "办证：各类资格证、翻译资格证均可办理，代开发票，加微信详谈。", hits: ["办证", "代开发票", "加微信"], level: "高" },
    { text: "博彩内部渠道，稳赚不赔，有兴趣的同学私聊，返利高。", hits: ["博彩", "返利"], level: "高" },
    { text: "贷款秒批，学生也可申请，无需征信，套现方便，扫码进群咨询。", hits: ["贷款秒批", "套现", "扫码进群"], level: "高" },
    { text: "刷课挂机脚本，自动完成网课任务，价格实惠，加微信 getit888。", hits: ["刷课", "挂机脚本", "加微信"], level: "高" },
    { text: "出售盗版教材电子版，全套课程资料打包，点击链接领取。", hits: ["盗版教材", "点击链接领取"], level: "中" },
    { text: "论文降重服务，保证通过，私域引流加群有优惠。", hits: ["论文降重服务", "私域引流"], level: "中" },
  ];

  const NORMAL_TEMPLATES = [
    "今天做完第 4 章的合同翻译练习，长句拆分比想象中难，尤其是“的”字结构的层级判断，想问一下老师 30 日内的时间状语应该放句首还是句末？",
    "分享一个记忆点：shall 表义务、may 表授权、will 表陈述。之前一直把“应”一律译成 shall，导致句中“将会”也变成义务了。",
    "Incoterms 2020 把 DAT 改成了 DPU，这个勘误我在复习时才注意到，之前作业里还写过 DAT。",
    "请问文献库里《商务合同翻译实务》这本书在图书馆哪个位置？想去借来配合第 4 章一起看。",
    "第 7 条的违约金比例上限表述我改了三版，最后还是觉得用 and 连接比 provided that 更准确，因为两个分句是并列关系。",
    "跨文化交际课的文化维度小测做完了，不确定性规避这一条最容易和权力距离混淆，建议同学们重点对比。",
    "老师课上提到的显化倾向，我在语料库里实测了一下，连接词密度确实比原创英文高，数据挺有意思。",
    "关于函电的礼貌层级，我觉得中文的“敬请”并不总是对应英文的缓和式请求，有时候反而是直接的礼貌用语。",
    "翻译质量评估的错误分级标准已经下载，准备按这个标准自查一遍期中作业。",
    "本节作业里 force majeure 我一开始译成了 irresistible force，看了术语库才发现应该保留源形式。",
    "分享一下我整理的术语表模板，包含定义、词性、领域、例句四个字段，需要的同学可以自取。",
    "讨论一下：广告口号翻译里“零翻译”策略在什么条件下才成立？感觉品牌名的可注册性是个关键约束。",
    "被动语态的转换比预想的复杂，特别是形式被动意义主动的句子，比如 The book sells well。",
    "刚提交了跨文化冲突案例分析，四段式框架确实比自由发挥更容易写清楚，就是化解方案部分卡了很久。",
    "请问下周的实训场景是合同争议沟通吗？想提前把不可抗力条款的英文表述准备一下。",
    "把两班同学的译文做了小语料库统计，平均句长差了 6 个字，感觉和断句习惯关系很大。",
  ];

  ZK.seed.posts = function () {
    const rng = U.makeRng(9901);
    /* 人员信息以 learners 花名册为唯一来源，避免帖子作者与花名册对不上 */
    const roster = ZK.seed.learners();
    const byId = {};
    roster.forEach((l) => (byId[l.id] = l));
    const clsName = {};
    ZK.seed.classes().forEach((c) => (clsName[c.id] = c.name));
    const learners = roster.map((l) => l.id);
    const posts = [];

    function nameOf(id) {
      return byId[id] ? byId[id].name : "—";
    }

    function clsOf(id) {
      const l = byId[id];
      return l ? clsName[l.classId] || "—" : "—";
    }

    let seq = 0;
    // 恶意发布用户（与黑名单对应）
    const spamUsers = {
      l_026: 4, l_039: 3, l_080: 3, l_014: 2, l_055: 2, l_071: 1, l_008: 1,
    };

    Object.keys(spamUsers).forEach((uid) => {
      const count = spamUsers[uid];
      for (let i = 0; i < count; i++) {
        const tpl = SPAM_TEMPLATES[(Number(uid.slice(2)) + i) % SPAM_TEMPLATES.length];
        seq += 1;
        posts.push({
          id: "po_" + String(seq).padStart(4, "0"),
          learnerId: uid,
          learner: nameOf(uid),
          cls: clsOf(uid),
          platform: rng.pick(["课程讨论区", "学习圈", "资源共享区"]),
          content: tpl.text,
          hits: tpl.hits.slice(),
          level: tpl.level,
          isSpam: true,
          action: tpl.level === "高" ? "拦截并上报" : "机器审核",
          status: tpl.level === "高" ? "blocked" : "flagged",
          createdAt: U.daysAgo(rng.int(0, 45)),
        });
      }
    });

    // 正常发布
    for (let k = 0; k < 46; k++) {
      const uid = learners[rng.int(0, 89)];
      seq += 1;
      posts.push({
        id: "po_" + String(seq).padStart(4, "0"),
        learnerId: uid,
        learner: nameOf(uid),
        cls: clsOf(uid),
        platform: rng.pick(["课程讨论区", "学习圈", "资源共享区", "作业答疑区"]),
        content: NORMAL_TEMPLATES[rng.int(0, NORMAL_TEMPLATES.length - 1)],
        hits: [],
        level: "无",
        isSpam: false,
        action: "放行",
        status: "published",
        createdAt: U.daysAgo(rng.int(0, 60)),
      });
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);
    return posts;
  };

  /* ===================== 五、待检测文档语料 ===================== */
  ZK.seed.safetyDocs = function () {
    const rows = [
      {
        title: "第 4 章合同翻译作业-第 12 组提交稿.docx", author: "丁疏影", type: "学生作业",
        sizeKB: 268, words: 4180,
        text: "第 4 章合同翻译作业。本组翻译范围为采购合同第 3、5、7 条。译文如下：Party A shall pay to Party B all amounts outstanding under this Contract within thirty (30) days from the date of receipt of the written notice from Party B. 其中 under this Contract 的使用依据为法律英语惯例，not of this Contract。术语 force majeure 保留源形式。另附资料获取方式：完整术语库与我整理的参考资料链接见群文件，需要的同学扫码进群领取，另外提供论文降重服务，价格从优。",
        lastScanAt: U.daysAgo(5),
      },
      {
        title: "翻译技术实践报告-马谨瑜.docx", author: "马谨瑜", type: "学生作业",
        sizeKB: 512, words: 6320,
        text: "翻译技术实践报告。一、CAT 工具使用体验。本节介绍翻译记忆库的建立与维护流程。二、术语库建设。三、问题与建议。报告正文见下，另外补充：如果同学们没时间做，我可以代写作业，各专业均可，包过查重，需要的加微信 dxy2026 详谈。此外还有破解版翻译软件可供使用，点击链接领取安装包。",
        lastScanAt: U.daysAgo(2),
      },
      {
        title: "商务英语笔译-期中试题（A卷）.docx", author: "李明远", type: "教师资料",
        sizeKB: 96, words: 1860,
        text: "商务英语笔译期中试题 A 卷。一、术语翻译（每题 2 分，共 20 分）。二、句子翻译（每题 5 分，共 30 分）。三、段落翻译（共 30 分）。四、译文评析（共 20 分）。参考答案与评分标准见附件。考试范围涵盖第 1 至第 5 章，重点为合同条款翻译与术语一致性。本次考试为闭卷考试，考试时长 90 分钟。",
        lastScanAt: U.daysAgo(8),
      },
      {
        title: "课程讨论区精华帖合集.pdf", author: "王梓涵", type: "平台内容",
        sizeKB: 1440, words: 12400,
        text: "课程讨论区精华帖合集。收录本学期讨论区高价值问答 42 条。内容涉及合同条款拆分、情态动词用法、术语一致性检查、Incerms 更新、跨文化归因分析等主题。其中关于 shall 与 will 区分的讨论被置顶。合集末尾附有部分同学分享的资源清单与参考资料链接，均为公开可访问的学术资源。",
        lastScanAt: U.daysAgo(11),
      },
      {
        title: "学习圈转贴-兼职信息汇总.txt", author: "赵思远", type: "平台内容",
        sizeKB: 34, words: 920,
        text: "学习圈兼职信息汇总（转贴）。1. 线上兼职刷单，日结兼职，加微信 abc123，学生优先。2. 校园代理招聘，扫码进群了解。3. 翻译兼职岗位：某翻译公司招募学生兼职翻译，要求英语专业四级以上，有意向者请联系学院就业办。4. 办证广告，各类资格证均可办理，请勿相信。本汇总已标注风险条目，提醒同学注意甄别。",
        lastScanAt: U.daysAgo(1),
      },
      {
        title: "跨文化交际案例分析-曹望舒.docx", author: "曹望舒", type: "学生作业",
        sizeKB: 186, words: 3240,
        text: "跨文化冲突案例分析。摘要：本报告分析一起中德合资项目进度会议中的沟通冲突，运用霍夫斯泰德文化维度与高低语境理论进行归因分析。一、行为。二、归因。三、偏差。四、化解。结论：跨文化冲突的化解不能停留在加强沟通的层面，需要把文化差异转化为可执行的流程约定。参考文献：胡文仲《跨文化交际学概论》、窦卫霖《跨文化商务交际》。",
        lastScanAt: U.daysAgo(3),
      },
      {
        title: "资源共享区批量上传-课程资料包.zip", author: "邓知远", type: "平台内容",
        sizeKB: 8640, words: 0,
        text: "课程资料包，内含破解版课件模板与盗版教材电子版，完整课程资料打包下载。另有刷课挂机脚本，可自动完成网课任务，价格实惠。需要的同学扫码进群，或加微信 getit888。资料仅供学习交流，请勿外传。",
        lastScanAt: U.daysAgo(6),
      },
      {
        title: "毕业论文开题报告-代写版本.docx", author: "未知上传者", type: "平台内容",
        sizeKB: 402, words: 5820,
        text: "毕业论文开题报告（代写版本）。本报告由代写服务提供，保证通过答辩。研究主题为商务英语翻译中的术语一致性研究。如需定制开题报告、代写论文、论文降重服务，请加微信 dxy2026 详谈，包过查重，价格从优。内部真题与考试答案出售，欢迎咨询。",
        lastScanAt: U.daysAgo(4),
      },
    ];
    return rows.map((r, i) => ({
      id: "sd_" + String(i + 1).padStart(3, "0"),
      title: r.title,
      author: r.author,
      type: r.type,
      sizeKB: r.sizeKB,
      words: r.words,
      text: r.text,
      addedAt: U.daysAgo(3 + i * 2),
      lastScanAt: r.lastScanAt,
      status: "pending",
    }));
  };

  /* ===================== 六、待检测视频语料 ===================== */
  ZK.seed.safetyVideos = function () {
    const rows = [
      {
        title: "第 4 章合同翻译课堂实录.mp4", author: "李明远", duration: 3120, sizeMB: 468, resolution: "1920×1080", bitrate: "2.4 Mbps",
        subtitle:
          "各位同学，本节课继续讲合同条款的拆分。先看第 3 条，判断构成要素：主体是甲方，行为是支付，对象是合同项下全部未付款项，条件是收到书面通知，时限是三十日。翻译时先确定主干，再按英文习惯调整语序。注意 under this Contract 的用法。下节课我们讲第 5 条不可抗力条款。课后作业在课程平台提交。",
        lastScanAt: U.daysAgo(7),
      },
      {
        title: "学习圈短视频-留学中介推广.mp4", author: "外部账号", duration: 62, sizeMB: 18, resolution: "720×1280", bitrate: "1.2 Mbps",
        subtitle:
          "同学们注意啦，留学申请找我们，内部渠道保录取，办证加急三天出证。名额有限，加微信 study666 咨询，扫码进群还能领返利。点击链接领取免费资料包。另外我们提供代写论文服务，包过查重。",
        lastScanAt: U.daysAgo(2),
      },
      {
        title: "学生作品-商务函电撰写演示.mp4", author: "王梓涵", duration: 486, sizeMB: 96, resolution: "1280×720", bitrate: "1.6 Mbps",
        subtitle:
          "大家好，我演示一下商务函电的撰写流程。先写中文函件，明确事实陈述、依据引用、请求行动三个部分。然后翻译成英文，注意礼貌层级的对应。第三部分我会分析语域选择的理由，对比直译与缓和式表达的效果差异。最后附上参考资料。",
        lastScanAt: U.daysAgo(5),
      },
      {
        title: "跨文化交际线上讲座回放.mp4", author: "陈慧珊", duration: 5400, sizeMB: 812, resolution: "1920×1080", bitrate: "2.8 Mbps",
        subtitle:
          "本次讲座讨论高语境与低语境文化的谈判风格差异。高语境文化中大量信息隐含在共享背景之中，否定的表达往往不直接出现。低语境文化则倾向于明确的言语表达。我们在谈判中要识别这些信号，避免把程序性延迟误解为诚意不足。下一部分我们讨论归因偏差。",
        lastScanAt: U.daysAgo(9),
      },
      {
        title: "学习圈转载-网课代刷广告.mp4", author: "外部账号", duration: 28, sizeMB: 6, resolution: "480×854", bitrate: "0.8 Mbps",
        subtitle:
          "还在为网课发愁吗？刷课挂机脚本上线，自动完成全部任务，解放你的时间。外挂稳定不掉线，价格实惠。点击链接领取试用版，加微信 getit888 下单。另提供论文降重服务。",
        lastScanAt: U.daysAgo(1),
      },
      {
        title: "术语库操作演示录屏.mp4", author: "赵思远", duration: 742, sizeMB: 168, resolution: "1440×900", bitrate: "1.9 Mbps",
        subtitle:
          "接下来演示术语库的建立流程。第一步是术语提取，我们使用自动提取得到候选词串，再人工审核。第二步是添加定义字段，这里要注意定义必须能区分近义术语。第三步是设置锁定状态。最后运行一致性检查，输出不符合术语库的段落清单。",
        lastScanAt: U.daysAgo(4),
      },
    ];
    return rows.map((r, i) => ({
      id: "sv_" + String(i + 1).padStart(3, "0"),
      title: r.title,
      author: r.author,
      duration: r.duration,
      sizeMB: r.sizeMB,
      resolution: r.resolution,
      bitrate: r.bitrate,
      subtitle: r.subtitle,
      frames: Math.max(1, Math.round(r.duration / 10)),
      addedAt: U.daysAgo(2 + i * 3),
      lastScanAt: r.lastScanAt,
      status: "pending",
    }));
  };

  /* ===================== 七、检测任务执行记录 ===================== */
  ZK.seed.safetyRecords = function () {
    const rng = U.makeRng(3141);
    const rows = [
      { id: "sr_001", target: "第 4 章合同翻译作业-第 12 组提交稿.docx", kind: "文档", result: "命中 2 项", level: "中", action: "机器审核", hits: ["扫码进群", "论文降重服务"], at: U.daysAgo(5), operator: "张立信" },
      { id: "sr_002", target: "翻译技术实践报告-马谨瑜.docx", kind: "文档", result: "命中 3 项", level: "高", action: "拦截并上报", hits: ["代写作业", "包过", "破解版", "点击链接领取"], at: U.daysAgo(2), operator: "张立信" },
      { id: "sr_003", target: "学习圈短视频-留学中介推广.mp4", kind: "视频", result: "命中 5 项", level: "高", action: "拦截并上报", hits: ["办证", "加微信", "扫码进群", "返利", "代写论文"], at: U.daysAgo(2), operator: "张立信" },
      { id: "sr_004", target: "学习圈转载-网课代刷广告.mp4", kind: "视频", result: "命中 4 项", level: "高", action: "拦截并上报", hits: ["刷课", "挂机脚本", "外挂", "点击链接领取", "加微信"], at: U.daysAgo(1), operator: "张立信" },
      { id: "sr_005", target: "商务英语笔译-期中试题（A卷）.docx", kind: "文档", result: "未命中", level: "无", action: "放行", hits: [], at: U.daysAgo(8), operator: "张立信" },
      { id: "sr_006", target: "资源共享区批量上传-课程资料包.zip", kind: "文档", result: "命中 3 项", level: "高", action: "拦截并上报", hits: ["破解版", "盗版教材", "刷课", "挂机脚本", "扫码进群"], at: U.daysAgo(6), operator: "张立信" },
      { id: "sr_007", target: "跨文化交际案例分析-曹望舒.docx", kind: "文档", result: "未命中", level: "无", action: "放行", hits: [], at: U.daysAgo(3), operator: "张立信" },
      { id: "sr_008", target: "第 4 章合同翻译课堂实录.mp4", kind: "视频", result: "未命中", level: "无", action: "放行", hits: [], at: U.daysAgo(7), operator: "张立信" },
    ];
    return rows.map((r) => Object.assign({}, r, { id: r.id, seedNo: rng.int(1, 99) }));
  };
})();
