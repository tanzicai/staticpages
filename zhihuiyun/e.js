/* 智课云 · 数据层（localStorage 持久化 + 预置教学数据） */
(function () {
  'use strict';

  const DATA_KEY = 'zky_data_v3';
  const SESSION_KEY = 'zky_session_v1';

  /* ---------- 角色 ---------- */
  const ROLES = [
    { id: 'admin', name: '平台管理员', short: '管', color: '#2563eb', desc: '平台全局配置：课程、门户、安全审核与系统设置' },
    { id: 'teacher', name: '课程教师', short: '师', color: '#0ea5e9', desc: '课程建设主力：图谱、微课、门户展厅、AI 教学工具' },
    { id: 'student', name: '学生', short: '学', color: '#16a34a', desc: '学习视角：知识图谱、微课学习、自测与错题集' },
    { id: 'supervisor', name: '教研督导', short: '督', color: '#f59e0b', desc: '质量把控：学情分析、资源安全检测与教学预警' }
  ];

  /* ---------- 演示账号 ---------- */
  const ACCOUNTS = [
    { username: 'admin', password: 'admin123', name: '刘建国', role: 'admin', dept: '现代教育技术中心' },
    { username: 'teacher', password: 'teacher123', name: '张恩正', role: 'teacher', dept: '安全工程学院' },
    { username: 'student', password: 'student123', name: '李娜', role: 'student', dept: '安全2301班' },
    { username: 'supervisor', password: 'supervisor123', name: '王海涛', role: 'supervisor', dept: '教学质量监控中心' }
  ];

  /* ---------- 菜单（按角色可见） ---------- */
  const MENUS = [
    { id: 'dashboard', title: '工作台', icon: 'dashboard', roles: ['admin', 'teacher', 'student', 'supervisor'] },
    { id: 'graph', title: '课程知识图谱', icon: 'graph', roles: ['admin', 'teacher', 'student', 'supervisor'] },
    { id: 'portal', title: '课程门户与虚拟展厅', icon: 'portal', roles: ['admin', 'teacher'] },
    { id: 'research', title: 'AI 科研助手', icon: 'research', roles: ['admin', 'teacher', 'supervisor'] },
    { id: 'analytics', title: 'AI 学情分析', icon: 'chart', roles: ['admin', 'teacher', 'supervisor'] },
    { id: 'security', title: '资源智能安全检测', icon: 'shield', roles: ['admin', 'supervisor'] },
    { id: 'messages', title: '消息中心', icon: 'bell', roles: ['admin', 'teacher', 'student', 'supervisor'] },
    { id: 'settings', title: '系统设置', icon: 'settings', roles: ['admin'] }
  ];

  /* ---------- 工具 ---------- */
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function lcg(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 课程与知识图谱 ---------- */
  const COURSES = [
    { id: 'C1', name: '建设工程安全管理', code: 'GZY26-C001', teacher: '张恩正', term: '2026-2027 第 1 学期', hours: 48, credits: 3, major: '安全技术与管理', students: 96, cover: 'linear-gradient(135deg,#0b3d91,#2563eb)' },
    { id: 'C2', name: '土力学与地基基础', code: 'GZY26-C002', teacher: '李非亚', term: '2026-2027 第 1 学期', hours: 64, credits: 4, major: '建筑工程技术', students: 108, cover: 'linear-gradient(135deg,#0f766e,#0ea5e9)' }
  ];

  const CHAPTERS = {
    C1: ['安全生产法律法规', '建筑施工安全技术', '施工机械设备安全', '危大工程管理', '事故预防与应急管理'],
    C2: ['土的物理性质及工程分类', '土中应力与地基沉降', '土的抗剪强度与地基承载力', '土压力与土坡稳定', '地基处理与基础工程']
  };

  const C1_KP = [
    ['安全生产法', 0, 1, []],
    ['建设工程安全生产管理条例', 0, 1, []],
    ['生产安全事故报告与调查处理', 0, 2, ['安全生产法']],
    ['安全生产责任制与教育培训', 0, 1, ['安全生产法']],
    ['基坑（槽）工程施工安全', 1, 3, ['建设工程安全生产管理条例']],
    ['脚手架工程安全技术', 1, 2, []],
    ['模板及支撑体系安全', 1, 3, ['脚手架工程安全技术']],
    ['高处作业安全防护', 1, 2, []],
    ['施工临时用电安全', 1, 2, []],
    ['塔式起重机安装与使用安全', 2, 3, ['建设工程安全生产管理条例']],
    ['施工升降机与物料提升机安全', 2, 2, []],
    ['危险性较大的分部分项工程识别', 3, 2, ['建设工程安全生产管理条例']],
    ['专项施工方案编制与专家论证', 3, 3, ['危险性较大的分部分项工程识别']],
    ['风险分级管控与隐患排查治理', 4, 2, ['安全生产责任制与教育培训']],
    ['生产安全事故应急救援', 4, 2, ['生产安全事故报告与调查处理']],
    ['建筑施工安全事故案例分析', 4, 3, ['风险分级管控与隐患排查治理']]
  ];
  const C2_KP = [
    ['土的组成与三相指标', 0, 2, []],
    ['土的结构性与工程分类', 0, 1, ['土的组成与三相指标']],
    ['土中自重应力与附加应力计算', 1, 3, ['土的组成与三相指标']],
    ['地基最终沉降量计算', 1, 3, ['土中自重应力与附加应力计算']],
    ['土的抗剪强度与摩尔-库仑准则', 2, 3, []],
    ['地基承载力确定', 2, 2, ['土的抗剪强度与摩尔-库仑准则']],
    ['朗肯土压力理论', 3, 3, ['土的抗剪强度与摩尔-库仑准则']],
    ['土坡稳定分析', 3, 2, ['朗肯土压力理论']],
    ['换填垫层法', 4, 2, ['地基承载力确定']],
    ['桩基础设计与施工', 4, 3, ['地基承载力确定']],
    ['基坑支护结构', 4, 3, ['朗肯土压力理论']],
    ['地基基础工程案例分析', 4, 2, ['桩基础设计与施工']]
  ];

  const CHAPTER_QUESTIONS = {
    '安全生产法律法规': [
      ['《中华人民共和国安全生产法》规定的安全生产工作方针是？', ['安全第一、预防为主、综合治理', '生产第一、安全第二', '预防为主、事后处理', '谁主管、谁负责'], 0, '安全生产法明确“安全第一、预防为主、综合治理”的方针。'],
      ['建设工程安全生产管理必须坚持的法定制度是？', ['安全生产责任制度', '安全生产奖惩制度', '安全生产许可制度', '以上均属法定基本制度'], 3, '安全生产责任制、许可制度、教育培训等均属法定基本制度。']
    ],
    '建筑施工安全技术': [
      ['基坑开挖深度超过多少米属于危险性较大的分部分项工程？', ['2 米', '3 米', '5 米', '8 米'], 1, '开挖深度超过 3 米（含 3 米）的基坑属危大工程范围。'],
      ['脚手架搭设完毕后，必须经验收合格并挂设什么方可使用？', ['合格牌', '警示牌', '施工牌', '验收合格牌（绿牌）'], 3, '脚手架验收合格后应挂设验收合格牌。'],
      ['高处作业的高度界定通常为坠落高度基准面多少米以上？', ['1 米', '2 米', '3 米', '5 米'], 1, '凡在坠落高度基准面 2 米及以上有可能坠落的高处作业均属高处作业。']
    ],
    '施工机械设备安全': [
      ['塔式起重机安装、拆卸作业必须由什么单位承担？', ['任意施工单位', '具有相应资质的单位', '设备生产厂家', '监理单位'], 1, '塔机安拆须由具备相应资质的单位实施。'],
      ['施工升降机每班使用前应进行什么检查？', ['空载试验', '满载试验', '例行检查与试运行', '无需检查'], 2, '每班使用前应进行例行检查并试运行。']
    ],
    '危大工程管理': [
      ['危险性较大的分部分项工程专项施工方案，超过一定规模时应当？', ['由项目经理审批', '组织专家论证', '报监理备案', '口头交底即可'], 1, '超过一定规模的危大工程须组织专家论证。'],
      ['危大工程专项施工方案应由谁审核签字？', ['施工单位技术负责人', '项目施工员', '班组长', '材料员'], 0, '专项方案须经施工单位技术负责人审核签字、总监理工程师审查签字。']
    ],
    '事故预防与应急管理': [
      ['事故隐患排查治理应建立什么机制？', ['一次性排查', '常态化闭环管理', '事后处理', '口头汇报'], 1, '隐患排查治理应建立自查、自报、自改的闭环管理机制。'],
      ['生产安全事故发生后，现场有关人员应当立即报告？', ['本单位负责人', '家属', '新闻媒体', '无需报告'], 0, '事故发生后现场人员应立即报告本单位负责人。']
    ],
    '土的物理性质及工程分类': [
      ['土的三个基本组成部分是？', ['固相、液相、气相', '砂、石、土', '粘土、粉土、砂土', '水、气、岩'], 0, '土由固相（颗粒）、液相（水）、气相（空气）三相组成。'],
      ['反映土的密实程度并与工程载荷密切相关的指标是？', ['含水率', '孔隙比', '饱和度', '液限'], 1, '孔隙比反映土的密实程度，是重要指标。']
    ],
    '土中应力与地基沉降': [
      ['计算地基附加应力常用的理论是？', ['布辛奈斯克解', '朗肯理论', '库仑准则', '太沙基理论'], 0, '竖向集中力作用下的附加应力计算常用布辛奈斯克解。'],
      ['地基最终沉降量的组成不包括？', ['瞬时沉降', '固结沉降', '次固结沉降', '弹性回弹'], 3, '地基最终沉降量由瞬时、固结、次固结沉降组成。']
    ],
    '土的抗剪强度与地基承载力': [
      ['土的抗剪强度主要取决于？', ['粘聚力与内摩擦角', '含水率', '孔隙比', '饱和度'], 0, '库仑公式中抗剪强度取决于粘聚力 c 与内摩擦角 φ。'],
      ['确定地基承载力常用方法不包括？', ['载荷试验', '理论公式计算', '经验查表', '视比重法'], 3, '视比重法不是确定地基承载力的方法。']
    ],
    '土压力与土坡稳定': [
      ['朗肯土压力理论假定墙背？', ['倾斜粗糙', '竖直光滑', '任意形状', '柔性'], 1, '朗肯理论假定墙背竖直、光滑、填土面水平。'],
      ['影响土坡稳定的主要因素不包括？', ['土的性质', '坡高与坡角', '地下水', '施工进度计划'], 3, '施工进度计划不直接决定土坡稳定性。']
    ],
    '地基处理与基础工程': [
      ['换填垫层法适用于处理？', ['深厚软土', '浅层软弱地基', '岩溶地基', '膨胀土'], 1, '换填垫层法适用于浅层软弱地基及不均匀地基处理。'],
      ['桩基础按受力特点可分为？', ['摩擦桩与端承桩', '预制桩与灌注桩', '钢桩与木桩', '长桩与短桩'], 0, '按受力特点分为摩擦桩与端承桩；按施工方式分预制桩与灌注桩。']
    ]
  };

  function buildGraph() {
    const rnd = lcg(20261110);
    function int(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    const gp = {};
    function make(course, defs) {
      const nodes = defs.map(function (d, i) {
        const name = d[0], chapter = d[1], diff = d[2], pre = d[3];
        const id = course + '-KP' + pad(i + 1, 2);
        return {
          id: id, course: course, name: name, chapter: chapter, diff: diff,
          pre: pre.map(function (p) { const idx = defs.findIndex(function (x) { return x[0] === p; }); return course + '-KP' + pad(idx + 1, 2); }),
          mastery: int(58, 96), completion: int(62, 99),
          video: int(1, 4), docs: int(2, 7), quiz: int(3, 9), discuss: int(0, 12)
        };
      });
      return nodes;
    }
    gp.C1 = make('C1', C1_KP);
    gp.C2 = make('C2', C2_KP);
    return gp;
  }

  /* 生成微课题库（每知识点 2-3 题） */
  function buildQuestions(graph) {
    const qs = [];
    Object.keys(graph).forEach(function (c) {
      graph[c].forEach(function (kp) {
        const bank = CHAPTER_QUESTIONS[CHAPTERS[c][kp.chapter]] || [];
        bank.forEach(function (q, i) {
          qs.push({ id: kp.id + '-Q' + (i + 1), kpId: kp.id, type: 'single', stem: q[0], options: q[1], answer: q[2], analysis: q[3] });
        });
      });
    });
    return qs;
  }

  /* 学习资料 & AI 分析 & 讨论（按知识点生成） */
  function buildLessonExtras(graph) {
    const materials = {};
    const analysis = {};
    const discussions = {};
    Object.keys(graph).forEach(function (c) {
      graph[c].forEach(function (kp) {
        materials[kp.id] = [
          { type: '课件', name: kp.name + '（教学课件）.pdf', size: '2.4 MB' },
          { type: '规范', name: '《' + kp.name + '》相关规范条文摘编.docx', size: '860 KB' },
          { type: '案例', name: kp.name + '·典型工程案例.pdf', size: '1.7 MB' },
          { type: '试题', name: kp.name + '·随堂测试卷.pdf', size: '420 KB' }
        ].slice(0, 2 + (kp.docs % 3));
        analysis[kp.id] = {
          core: '本知识点围绕「' + kp.name + '」展开，属于' + CHAPTERS[c][kp.chapter] + '模块的核心内容。',
          points: [
            '掌握「' + kp.name + '」的基本概念、术语与适用范围',
            '理解其在工程实践中的技术要点与常见问题',
            '能够结合案例进行识别、分析与处置'
          ],
          difficulty: kp.diff,
          videoLen: (18 + (kp.video * 7)) + ' 分钟',
          keyWords: [kp.name.slice(0, 4), '工程实践', '技术要点', '案例分析']
        };
        discussions[kp.id] = [
          { user: '陈晨', avatar: '陈', content: '老师，这里在实际工程中如何把握尺度？', time: '2 小时前', replies: [{ user: '张恩正', content: '重点看规范条文与专项方案要求，结合现场条件判断。', time: '1 小时前' }] },
          { user: '王浩', avatar: '王', content: '好的，配合案例学习后清晰多了。', time: '5 小时前', replies: [] }
        ].slice(0, kp.discuss > 6 ? 2 : 1);
      });
    });
    return { materials: materials, analysis: analysis, discussions: discussions };
  }

  /* 科研文献库 */
  const PAPERS = [
    { id: 'P01', title: '基于 BIM 的建筑施工安全风险智能识别方法研究', authors: '张恩正, 刘建国, 等', venue: '土木工程学报', year: 2025, type: '期刊', tags: ['施工安全', 'BIM', '风险识别'], doi: '10.15951/j.cnki.2025.03.011', abstract: '针对建筑施工高风险作业场景，提出基于 BIM 与深度学习的风险智能识别方法，实现危险源的自动定位与预警。', cite: 47 },
    { id: 'P02', title: '深基坑工程变形监测与预警阈值研究', authors: '李非亚, 王海涛', venue: '岩土工程学报', year: 2025, type: '期刊', tags: ['基坑工程', '变形监测', '预警'], doi: '10.11779/CJGE2025.02.008', abstract: '通过多工程实测数据，建立深基坑变形分级预警阈值体系，为安全管理提供量化依据。', cite: 33 },
    { id: 'P03', title: 'Knowledge Graph Construction for Engineering Safety Education', authors: 'Zhang E., Li F., et al.', venue: 'IEEE EDUCON', year: 2025, type: '会议', tags: ['知识图谱', '工程教育', 'AI'], doi: '10.1109/EDUCON.2025.00123', abstract: '构建面向工程安全课程的知识图谱，支持个性化学习路径推荐与知识点掌握度分析。', cite: 18 },
    { id: 'P04', title: '大语言模型在职业教育课程问答中的应用', authors: '刘建国, 张恩正', venue: '中国职业技术教育', year: 2025, type: '期刊', tags: ['大语言模型', '职业教育', '智能助教'], doi: '10.13468/j.cnki.2025.09.015', abstract: '将大语言模型应用于课程专属知识库问答，验证其在学习助手场景下的准确率与用户体验。', cite: 26 },
    { id: 'P05', title: '土体抗剪强度参数反演与地基承载力可靠度分析', authors: '李非亚', venue: '岩土力学', year: 2024, type: '期刊', tags: ['土力学', '抗剪强度', '地基承载力'], doi: '10.16285/j.rsm.2024.11.032', abstract: '基于贝叶斯方法对抗剪强度参数进行反演，开展地基承载力可靠度分析。', cite: 41 },
    { id: 'P06', title: 'AIGC 辅助教学资源生成的合规性治理研究', authors: '王海涛, 刘建国', venue: '现代教育技术', year: 2025, type: '期刊', tags: ['AIGC', '资源审核', '合规'], doi: '10.3969/j.issn.1009-8097.2025.04.006', abstract: '面向教学资源安全审核需求，构建多维度内容检测与文本纠错框架，降低人工审核成本。', cite: 22 },
    { id: 'P07', title: '脚手架高支模体系稳定性分析与安全控制', authors: '张恩正, 赵磊', venue: '施工技术', year: 2024, type: '期刊', tags: ['模板支撑', '脚手架', '安全控制'], doi: '10.7672/sgjs.2024.15.041', abstract: '针对高支模体系开展稳定性分析，提出构造与验收控制要点。', cite: 29 },
    { id: 'P08', title: '基于多模态数据的学情画像与教学预警', authors: '王海涛, 李非亚', venue: '电化教育研究', year: 2025, type: '期刊', tags: ['学情分析', '教学预警', '多模态'], doi: '10.13811/j.cnki.2025.07.009', abstract: '融合视频、作业与考试多模态数据，构建学情画像并实现学困生自动识别与预警。', cite: 35 },
    { id: 'P09', title: 'Digital Twin for Construction Safety Management', authors: 'Wang H., Zhang E.', venue: 'Automation in Construction', year: 2024, type: '期刊', tags: ['数字孪生', '施工安全', '智能监测'], doi: '10.1016/j.autcon.2024.105233', abstract: '提出面向施工安全管理的数字孪生框架，实现现场态势感知与协同预警。', cite: 58 },
    { id: 'P10', title: '职业教育在线开放课程运行质量评价体系构建', authors: '刘建国, 王海涛', venue: '中国电化教育', year: 2025, type: '期刊', tags: ['在线课程', '质量评价', '职业教育'], doi: '10.3969/j.issn.1006-9860.2025.05.012', abstract: '构建在线开放课程运行质量评价指标体系，支持课程建设与教学的持续改进。', cite: 17 },
    { id: 'P11', title: '人工智能赋能“师机生”交互教学模式改革', authors: '张恩正, 刘建国', venue: '中国大学教学', year: 2025, type: '期刊', tags: ['AI 教学', '交互模式', '教学改革'], doi: '10.16395/j.cnki.2025.08.004', abstract: '探索 AI 工具在备课、教学、学习、评价全流程深度融合的教学模式改革。', cite: 24 },
    { id: 'P12', title: '滑坡与土坡稳定分析的强度折减法应用', authors: '李非亚, 王海涛', venue: '工程地质学报', year: 2024, type: '期刊', tags: ['土坡稳定', '强度折减', '边坡'], doi: '10.13544/j.cnki.jeg.2024.06.021', abstract: '采用强度折减法对典型土坡进行稳定分析，并与极限平衡法结果对比验证。', cite: 31 },
    { id: 'P13', title: '装配式建筑施工安全风险预评估研究', authors: '王海涛, 张恩正', venue: 'ICCEE 国际土木工程学术会议', year: 2025, type: '会议', tags: ['装配式建筑', '安全评估', '风险'], doi: '10.1109/ICCEE.2025.00317', abstract: '针对装配式建筑施工阶段，构建安全风险预评估模型，实现风险的早期识别与分级管控。', cite: 12 },
    { id: 'P14', title: '智能建造背景下职业院校安全类课程改革路径', authors: '刘建国, 王海涛', venue: '中国职业教育学会年会', year: 2025, type: '会议', tags: ['智能建造', '课程改革', '职业教育'], doi: '10.26914/c.cnkihy.2025.004512', abstract: '探讨智能建造背景下职业院校安全类课程的改革方向与实施路径，提出课程资源建设建议。', cite: 9 },
    { id: 'P15', title: '土坡稳定可靠度分析的新方法及其应用', authors: '李非亚, 周敏', venue: '岩土力学', year: 2025, type: '期刊', tags: ['土坡稳定', '可靠度', '土力学'], doi: '10.16285/j.rsm.2025.03.044', abstract: '提出考虑参数不确定性的土坡稳定可靠度分析方法，提高边坡工程安全评价的可靠性。', cite: 27 },
    { id: 'P16', title: 'Virtual Simulation Teaching Platform for Engineering Safety Education', authors: 'ZHANG E., WANG H.', venue: 'IEEE EDUCON', year: 2024, type: '会议', tags: ['虚拟仿真', '工程安全', 'AI', '知识图谱'], doi: '10.1109/EDUCON.2024.00288', abstract: 'Designs a virtual simulation teaching platform integrating AI and knowledge graphs for engineering safety education.', cite: 21 }
  ];

  /* 虚拟展厅模板 */
  const HALL_TEMPLATES = [
    { id: 'T1', name: '现代简约展厅', desc: '白灰主调、通透分区，适合课程成果与教学团队展示', zones: ['课程简介', '师资团队', '成果展示'], color: '#e2e8f0' },
    { id: 'T2', name: '科技感沉浸展厅', desc: '深色科技风、全息投影感，适合 3D 模型与虚拟仿真展示', zones: ['虚拟仿真', '3D 模型', 'AI 互动'], color: '#0f172a' },
    { id: 'T3', name: '学术报告厅', desc: '庄重学术风格，适合课程介绍与专家讲座展示', zones: ['课程报告', '专家讲座', '学术成果'], color: '#78350f' },
    { id: 'T4', name: '主题成果馆', desc: '主题化分区，适合按章节/专题组织课程资源', zones: ['章节成果', '专题资源', '知识图谱'], color: '#1e3a8a' }
  ];

  /* 学情：学生 + 作业/考试 */
  const STUDENTS = [
    ['李娜', 1], ['王浩', 1], ['陈晨', 1], ['赵磊', 1], ['孙敏', 1], ['周涛', 1],
    ['吴倩', 1], ['郑凯', 1], ['冯磊', 1], ['许静', 1], ['何强', 1], ['马丽', 1]
  ];
  function buildStudents() {
    const rnd = lcg(20261111);
    function int(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    return STUDENTS.map(function (s, i) {
      const completion = int(45, 99), mastery = int(48, 97), score = int(52, 96);
      return {
        id: 'S' + pad(i + 1, 3), name: s[0], cls: '安全2301班', avatar: s[0].charAt(0),
        completion: completion, mastery: mastery, score: score,
        videoRate: int(50, 100), hwRate: int(45, 100), examRate: int(50, 100), activity: int(40, 100),
        weak: (completion < 62 || mastery < 62 || score < 62)
      };
    });
  }

  const ASSIGNMENTS = [
    { id: 'A1', name: '第 2 章 章节测验', type: '章节测验', avg: 81.5, submitRate: 94, difficulty: 0.72 },
    { id: 'A2', name: '高处作业安全 · 视频作业', type: '视频作业', avg: 86.2, submitRate: 97, difficulty: 0.58 },
    { id: 'A3', name: '危大工程专项方案案例（作业）', type: '作业', avg: 74.8, submitRate: 88, difficulty: 0.83 },
    { id: 'A4', name: '期中考试', type: '考试', avg: 78.3, submitRate: 100, difficulty: 0.76 }
  ];

  /* 资源安全检测：待检测资源 */
  const SEC_RESOURCES = [
    { id: 'R01', name: '安全生产法条文讲解.pptx', type: '文档', size: '3.1 MB', content: '本课件介绍安全生产法的立法背景与主要内容，坚持安全第一、预防为主、综合治理的方针。' },
    { id: 'R02', name: '基坑工程安全技术交底.docx', type: '文本', size: '86 KB', content: '基坑开挖前应编制专项施工方案，超过一定规模须组织专家论证，严禁无方案施工。' },
    { id: 'R03', name: '塔式起重机安装作业指导视频.mp4', type: '课程', size: '128 MB', content: '塔机安装须由具有相应资质的单位承担，安装完毕后应经验收合格方可使用。' },
    { id: 'R04', name: '某培训广告推广海报.png', type: '图片', size: '2.2 MB', content: '[图片] 包含外部培训机构招生二维码与联系方式，疑似商业推广信息。' },
    { id: 'R05', name: '土力学公式速记手册.pdf', type: '文档', size: '1.4 MB', content: '汇总土的三相指标、摩尔库仑准则与土压力计算常用公式，便于复习记忆。' },
    { id: 'R06', name: '课程讨论区留言摘录.txt', type: '文本', size: '12 KB', content: '有学生发布“加微信领取内部资料”等刷屏留言，存在垃圾发布风险。' },
    { id: 'R07', name: '施工安全事故案例合集.docx', type: '文档', size: '2.7 MB', content: '收集近年来典型建筑施工安全事故案例，分析事故原因与防范措施。' },
    { id: 'R08', name: '带水印的第三方教材扫描件.jpg', type: '图片', size: '4.6 MB', content: '[图片] 检测到某出版社教材版权水印，涉嫌版权风险。' },
    { id: 'R09', name: '桩基础设计计算书（初稿）.docx', type: '文档', size: '1.1 MB', content: '本计算书依据规范对桩基础承载力与沉降进行计算，附有计算表格与验算过程。' },
    { id: 'R10', name: '兼职招聘信息转发.txt', type: '文本', size: '8 KB', content: '转发内容涉及“高薪兼职、日结”等信息，与课程无关，属于垃圾信息。' },
    { id: 'R11', name: '地基承载力载荷试验教学视频.mp4', type: '课程', size: '96 MB', content: '演示现场平板载荷试验的设备布置、加载步骤与数据记录方法。' },
    { id: 'R12', name: '课程思政案例（安全管理）.pptx', type: '文档', size: '2.9 MB', content: '结合工程安全典型案例开展课程思政教学，弘扬生命至上、安全第一的理念。' }
  ];

  /* 安全审核规则 */
  const SEC_DEFAULT_RULES = {
    keywords: ['加微信', '二维码', '兼职', '日结', '招生广告', '高薪', '内部资料'],
    ignoreWords: ['安全第一', '预防为主', '综合治理'],
    blacklist: ['营销号 A', 'spam_user_001'],
    whitelist: ['张恩正', '李非亚', '刘建国'],
    imageList: ['培训机构招生'],
    sensitiveTexts: ['涉黄', '涉赌', '违法违规', '不当言论']
  };

  /* 数据装配 */
  function genData() {
    const graph = buildGraph();
    const questions = buildQuestions(graph);
    const extras = buildLessonExtras(graph);
    const rnd = lcg(20261112);
    function int(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    const messages = [
      { title: '课程图谱已更新', content: '《建设工程安全管理》知识图谱新增 2 个知识点关联，请核对。', type: '通知' },
      { title: '待处理：资源安全预警', content: '检测到 3 条资源存在风险，建议尽快复核处置。', type: '待办' },
      { title: '学困生预警', content: '安全2301班有 3 名学生综合完成度低于 62%，建议一键提醒。', type: '告警' },
      { title: '虚拟展厅已生成', content: '课程门户「科技感沉浸展厅」已生成并嵌入门户页面。', type: '通知' },
      { title: 'AI 科研助手推送', content: '根据您的兴趣「施工安全」，新增 2 篇最新文献。', type: '通知' },
      { title: '教学预警任务完成', content: '已向 3 名学困生发送多渠道提醒，已读 2 人。', type: '通知' },
      { title: '门户配置待完善', content: '课程门户尚有「参考教材」模块未配置。', type: '提醒' },
      { title: '文本纠错完成', content: '对 6 份文档完成智能校核，共发现 14 处问题。', type: '通知' }
    ].map(function (m, i) { return { id: 'MSG' + pad(i + 1, 4), title: m.title, content: m.content, type: m.type, read: i % 3 === 0, createdAt: '2026-11-' + pad(10 - (i % 5), 2) }; });

    return {
      graph: graph, questions: questions, materials: extras.materials,
      analysis: extras.analysis, discussions: extras.discussions,
      wrongBook: {}, hall: null, research: { interests: ['施工安全', '知识图谱'], journals: ['土木工程学报', '岩土工程学报'], scholars: ['张恩正'], conferences: ['IEEE EDUCON'], tracked: ['P01', 'P08'] },
      messages: messages,
      security: { rules: JSON.parse(JSON.stringify(SEC_DEFAULT_RULES)), results: {}, history: [] },
      analytics: {
        faq: [
          { q: '班级整体掌握情况如何？', a: '安全2301班共 12 人，平均完成率、掌握率与成绩详见班级总览；其中视频完成情况较好，作业完成情况相对偏低，建议加强作业督促。', at: '2026-11-08' },
          { q: '哪些学生需要重点关注？', a: '系统按完成度与成绩阈值自动筛选出学困生名单，可在「教学预警」中一键提醒（支持站内信 / 短信 / 电话 / 微信多渠道）。', at: '2026-11-09' }
        ],
        subs: [
          { metric: '作业完成情况', freq: '每周', time: '周一 09:00', channel: '站内信', on: true },
          { metric: '学生成绩分析', freq: '每月', time: '每月 1 日 08:00', channel: '邮件', on: true }
        ]
      }
    };
  }

  /* ---------- 读写 ---------- */
  let _data = null;
  function load() {
    if (_data) return _data;
    try { const raw = localStorage.getItem(DATA_KEY); if (raw) { _data = JSON.parse(raw); return _data; } } catch (e) { }
    _data = genData(); persist(); return _data;
  }
  function persist() { try { localStorage.setItem(DATA_KEY, JSON.stringify(_data)); } catch (e) { } }

  function getSession() { try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function login(u, p) {
    const a = ACCOUNTS.filter(function (x) { return x.username === u && x.password === p; })[0];
    if (!a) return null;
    const s = { username: a.username, name: a.name, dept: a.dept, role: a.role, loginAt: Date.now() };
    setSession(s); return s;
  }
  function roleById(id) { return ROLES.filter(function (r) { return r.id === id; })[0]; }
  function unreadCount() { return load().messages.filter(function (m) { return !m.read; }).length; }
  function resetAll() { localStorage.removeItem(DATA_KEY); localStorage.removeItem(SESSION_KEY); _data = null; }

  window.Store = {
    ROLES: ROLES, ACCOUNTS: ACCOUNTS, MENUS: MENUS, COURSES: COURSES, CHAPTERS: CHAPTERS,
    PAPERS: PAPERS, HALL_TEMPLATES: HALL_TEMPLATES, STUDENTS: STUDENTS, ASSIGNMENTS: ASSIGNMENTS,
    SEC_RESOURCES: SEC_RESOURCES,
    get data() { return load(); },
    save: persist, getSession: getSession, setSession: setSession, clearSession: clearSession,
    login: login, roleById: roleById, unreadCount: unreadCount, resetAll: resetAll, pad: pad,
    kpById: function (id) { let r = null; Object.keys(load().graph).forEach(function (c) { load().graph[c].forEach(function (k) { if (k.id === id) r = k; }); }); return r; },
    courseByKp: function (id) { return String(id).slice(0, 2); }
  };
})();
