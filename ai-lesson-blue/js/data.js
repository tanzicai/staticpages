// ============ Mock 数据 ============

// 外部演示视频（Bilibili），用于所有视频区域的真实播放接入。
// 字幕仍由平台语音转写引擎生成；若后续拿到该视频的真实字幕，可直接替换 getTranscriptForResource 的数据源。
const BILI_VIDEO = {
  bvid: 'BV1j44y1E7ot',
  startSec: 50.9,
  embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1j44y1E7ot&page=1&high_quality=1&danmaku=0&t=50.9&autoplay=0',
  sourceLabel: '外部教学视频 · Bilibili'
};

// 课程列表（对接校方教学平台的线上课程）
const mockCourses = [
  { id: 'c001', name: '高等数学（上）', college: '数学与统计学院', teacher: '李明华', class: '2024级计算机1班+2班', classroom: '教A-301', weeks: '第1-16周', schedule: '周一 3-4节 / 周三 1-2节', students: 96 },
  { id: 'c002', name: '大学英语III', college: '外国语学院', teacher: '王芳', class: '2024级机械工程1班', classroom: '教B-205', weeks: '第1-18周', schedule: '周二 3-4节 / 周四 1-2节', students: 48 },
  { id: 'c003', name: '程序设计基础', college: '计算机学院', teacher: '张伟', class: '2024级软件工程1班+2班', classroom: '实验楼-302', weeks: '第1-16周', schedule: '周一 1-2节 / 周五 3-4节', students: 72 },
  { id: 'c004', name: '线性代数', college: '数学与统计学院', teacher: '赵建国', class: '2024级全体工科专业', classroom: '教A-101', weeks: '第1-12周', schedule: '周四 3-4节', students: 128 },
  { id: 'c005', name: '大学物理', college: '物理与电子学院', teacher: '陈晓东', class: '2024级物理学1班', classroom: '物理楼-201', weeks: '第1-18周', schedule: '周一 5-6节 / 周三 3-4节', students: 42 },
  { id: 'c006', name: '数据结构', college: '计算机学院', teacher: '刘建华', class: '2023级计算机1班', classroom: '实验楼-405', weeks: '第1-14周', schedule: '周二 1-2节 / 周四 5-6节', students: 56 },
  { id: 'c007', name: '概率论与数理统计', college: '数学与统计学院', teacher: '孙梅', class: '2023级计算机1班+2班', classroom: '教A-203', weeks: '第1-16周', schedule: '周二 3-4节', students: 88 },
  { id: 'c008', name: '马克思主义基本原理', college: '马克思主义学院', teacher: '周文斌', class: '2024级全体工科专业', classroom: '教C-101', weeks: '第1-18周', schedule: '周三 5-6节', students: 120 },
  { id: 'c009', name: '计算机网络', college: '计算机学院', teacher: '吴涛', class: '2023级网络工程1班', classroom: '实验楼-501', weeks: '第1-16周', schedule: '周一 1-2节 / 周四 3-4节', students: 52 },
  { id: 'c010', name: '操作系统原理', college: '计算机学院', teacher: '郑敏', class: '2023级计算机2班', classroom: '实验楼-402', weeks: '第1-16周', schedule: '周二 5-6节', students: 55 },
  { id: 'c011', name: '模拟电子技术', college: '物理与电子学院', teacher: '冯军', class: '2023级电子信息1班', classroom: '物理楼-105', weeks: '第1-17周', schedule: '周三 1-2节 / 周五 3-4节', students: 60 },
  { id: 'c012', name: '机械设计基础', college: '机械工程学院', teacher: '许强', class: '2023级机械工程2班', classroom: '机械楼-201', weeks: '第1-17周', schedule: '周四 1-2节', students: 58 },
  { id: 'c013', name: '微观经济学', college: '经济管理学院', teacher: '何静', class: '2024级经济1班+2班', classroom: '教B-301', weeks: '第1-16周', schedule: '周五 1-2节', students: 78 },
  { id: 'c014', name: '大学语文', college: '文学院', teacher: '林晓燕', class: '2024级全体理科专业', classroom: '教C-205', weeks: '第1-16周', schedule: '周一 5-6节', students: 110 },
  { id: 'c015', name: '数据库系统原理', college: '计算机学院', teacher: '高翔', class: '2023级软件工程1班', classroom: '实验楼-506', weeks: '第1-16周', schedule: '周三 3-4节 / 周五 1-2节', students: 50 }
];

// 课堂活动时间轴数据（按课程组织）
const mockTimelineEvents = {
  c001: [
    { id: 'e001', type: 'quiz', title: '第三章 极限与连续 - 随堂测验', time: '2026-09-08 10:30', duration: '15分钟', participants: 96, maxScore: 20, avgScore: 16.8, status: 'completed', description: '10道选择题，覆盖数列极限、函数极限、无穷小与无穷大等知识点' },
    { id: 'e002', type: 'discuss', title: '小组讨论：如何理解ε-N定义？', time: '2026-09-08 09:15', duration: '20分钟', participants: 96, groups: 12, status: 'completed', description: '12个分组，围绕极限的ε-N定义展开讨论并发表见解' },
    { id: 'e003', type: 'signin', title: '课堂签到', time: '2026-09-08 08:30', duration: '5分钟', participants: 98, absent: 2, status: 'completed', description: '人脸识别签到，2名学生请假' },
    { id: 'e004', type: 'task', title: '分组任务：证明极限存在性', time: '2026-09-06 14:00', duration: '30分钟', participants: 94, submitted: 88, status: 'completed', description: '每组完成1道极限证明题并提交' },
    { id: 'e005', type: 'quiz', title: '第二章 函数 - 小测', time: '2026-09-04 10:00', duration: '10分钟', participants: 95, avgScore: 17.2, status: 'completed', description: '8道题，函数性质综合测试' },
    { id: 'e006', type: 'discuss', title: '主题讨论：生活中的极限思维', time: '2026-09-04 09:30', duration: '15分钟', participants: 90, status: 'completed', description: '学生分享生活中用到极限思想的例子' },
    { id: 'e007', type: 'signin', title: '课堂签到', time: '2026-09-04 08:30', participants: 96, absent: 0, status: 'completed' },
    { id: 'e008', type: 'quiz', title: '第四章 导数 - 课前预习测验', time: '2026-09-09 08:25', participants: 88, avgScore: 14.5, status: 'ongoing', description: '新课预习检测，5题' }
  ],
  c002: [
    { id: 'e101', type: 'signin', title: '课堂签到', time: '2026-09-08 14:30', participants: 46, absent: 2, status: 'completed' },
    { id: 'e102', type: 'discuss', title: '口语话题讨论：My Career Plan', time: '2026-09-08 15:00', duration: '25分钟', participants: 44, status: 'completed', description: '两人一组进行英语口语练习' },
    { id: 'e103', type: 'quiz', title: 'Unit 3 词汇测试', time: '2026-09-05 10:00', duration: '10分钟', participants: 47, avgScore: 18.5, status: 'completed', description: '20个单词英汉互译' },
    { id: 'e104', type: 'task', title: '分组任务：制作英文自我介绍PPT', time: '2026-09-03 15:30', duration: '20分钟', participants: 48, submitted: 23, status: 'completed' }
  ],
  c003: [
    { id: 'e201', type: 'signin', title: '实验课签到', time: '2026-09-08 08:30', participants: 70, absent: 2, status: 'completed' },
    { id: 'e202', type: 'task', title: '实验：Python基础语法练习', time: '2026-09-08 09:00', duration: '90分钟', participants: 70, submitted: 65, status: 'completed', description: '完成10道编程练习题并在线提交' },
    { id: 'e203', type: 'quiz', title: '第一章 计算机概述 - 随堂测验', time: '2026-09-05 10:00', duration: '12分钟', participants: 71, avgScore: 17.8, status: 'completed' },
    { id: 'e204', type: 'discuss', title: '讨论：编程语言的发展历程', time: '2026-09-02 14:00', duration: '20分钟', participants: 68, status: 'completed' }
  ],
  c004: [
    { id: 'e301', type: 'signin', title: '课堂签到', time: '2026-09-08 10:30', participants: 126, absent: 2, status: 'completed' },
    { id: 'e302', type: 'quiz', title: '第二章 行列式性质 - 随堂测验', time: '2026-09-08 11:00', duration: '15分钟', participants: 125, avgScore: 16.2, status: 'completed', description: '10道计算与选择题' },
    { id: 'e303', type: 'task', title: '分组任务：行列式计算技巧总结', time: '2026-09-05 10:30', duration: '25分钟', participants: 120, submitted: 115, status: 'completed' },
    { id: 'e304', type: 'discuss', title: '主题讨论：行列式的几何意义', time: '2026-09-04 10:30', duration: '15分钟', participants: 112, status: 'completed' }
  ],
  c005: [
    { id: 'e401', type: 'signin', title: '课堂签到', time: '2026-09-08 14:00', participants: 41, absent: 1, status: 'completed' },
    { id: 'e402', type: 'quiz', title: '第二章 质点运动学 - 随堂测验', time: '2026-09-08 14:30', duration: '12分钟', participants: 41, avgScore: 15.6, status: 'completed' },
    { id: 'e403', type: 'discuss', title: '讨论：伽利略相对性原理', time: '2026-09-05 15:00', duration: '20分钟', participants: 38, status: 'completed' }
  ],
  c006: [
    { id: 'e501', type: 'signin', title: '课堂签到', time: '2026-09-09 08:30', participants: 55, absent: 1, status: 'completed' },
    { id: 'e502', type: 'task', title: '实验：链表基本操作实现', time: '2026-09-09 09:00', duration: '90分钟', participants: 55, submitted: 52, status: 'completed', description: '实现单链表的插入、删除、查找操作' },
    { id: 'e503', type: 'quiz', title: '第一章 绪论 - 随堂测验', time: '2026-09-06 08:30', duration: '10分钟', participants: 54, avgScore: 17.5, status: 'completed' }
  ],
  c007: [
    { id: 'e601', type: 'signin', title: '课堂签到', time: '2026-09-09 10:30', participants: 86, absent: 2, status: 'completed' },
    { id: 'e602', type: 'quiz', title: '第一章 随机事件与概率 - 随堂测验', time: '2026-09-09 11:00', duration: '12分钟', participants: 85, avgScore: 16.9, status: 'completed' },
    { id: 'e603', type: 'discuss', title: '讨论：生活中的概率问题', time: '2026-09-08 10:30', duration: '15分钟', participants: 80, status: 'completed' }
  ],
  c008: [
    { id: 'e701', type: 'signin', title: '课堂签到', time: '2026-09-09 14:30', participants: 118, absent: 2, status: 'completed' },
    { id: 'e702', type: 'discuss', title: '主题讨论：理论与实践的辩证关系', time: '2026-09-09 15:00', duration: '20分钟', participants: 110, status: 'completed', description: '结合专业案例讨论认识论原理' },
    { id: 'e703', type: 'quiz', title: '第一章 概论 - 随堂测验', time: '2026-09-06 14:30', duration: '10分钟', participants: 116, avgScore: 17.1, status: 'completed' }
  ],
  c009: [
    { id: 'e801', type: 'signin', title: '课堂签到', time: '2026-09-09 08:30', participants: 51, absent: 1, status: 'completed' },
    { id: 'e802', type: 'quiz', title: '第一章 计算机网络概述 - 随堂测验', time: '2026-09-09 09:30', duration: '12分钟', participants: 51, avgScore: 16.4, status: 'completed' },
    { id: 'e803', type: 'task', title: '分组任务：网络拓扑结构调研', time: '2026-09-08 10:00', duration: '30分钟', participants: 50, submitted: 48, status: 'completed' }
  ],
  c010: [
    { id: 'e901', type: 'signin', title: '课堂签到', time: '2026-09-09 14:00', participants: 54, absent: 1, status: 'completed' },
    { id: 'e902', type: 'quiz', title: '第一章 操作系统引论 - 随堂测验', time: '2026-09-09 14:30', duration: '10分钟', participants: 54, avgScore: 17.6, status: 'completed' }
  ],
  c011: [
    { id: 'ea01', type: 'signin', title: '课堂签到', time: '2026-09-09 08:30', participants: 59, absent: 1, status: 'completed' },
    { id: 'ea02', type: 'quiz', title: '第一章 半导体器件 - 随堂测验', time: '2026-09-09 09:30', duration: '12分钟', participants: 58, avgScore: 15.8, status: 'completed' },
    { id: 'ea03', type: 'task', title: '实验：二极管伏安特性测量', time: '2026-09-08 08:30', duration: '90分钟', participants: 58, submitted: 56, status: 'completed' }
  ],
  c012: [
    { id: 'eb01', type: 'signin', title: '课堂签到', time: '2026-09-09 10:00', participants: 57, absent: 1, status: 'completed' },
    { id: 'eb02', type: 'discuss', title: '讨论：机械设计中的安全系数', time: '2026-09-08 10:00', duration: '20分钟', participants: 53, status: 'completed' }
  ],
  c013: [
    { id: 'ec01', type: 'signin', title: '课堂签到', time: '2026-09-09 08:00', participants: 76, absent: 2, status: 'completed' },
    { id: 'ec02', type: 'quiz', title: '第一章 供给与需求 - 随堂测验', time: '2026-09-09 08:30', duration: '12分钟', participants: 75, avgScore: 16.6, status: 'completed' },
    { id: 'ec03', type: 'discuss', title: '讨论：生活中的价格弹性', time: '2026-09-08 08:00', duration: '15分钟', participants: 70, status: 'completed' }
  ],
  c014: [
    { id: 'ed01', type: 'signin', title: '课堂签到', time: '2026-09-09 14:00', participants: 108, absent: 2, status: 'completed' },
    { id: 'ed02', type: 'discuss', title: '主题讨论：唐宋诗词的意境之美', time: '2026-09-09 14:30', duration: '20分钟', participants: 100, status: 'completed' },
    { id: 'ed03', type: 'quiz', title: '第一单元 文学史常识 - 随堂测验', time: '2026-09-08 14:00', duration: '10分钟', participants: 106, avgScore: 17.9, status: 'completed' }
  ],
  c015: [
    { id: 'ee01', type: 'signin', title: '课堂签到', time: '2026-09-09 10:00', participants: 49, absent: 1, status: 'completed' },
    { id: 'ee02', type: 'task', title: '实验：SQL查询语句练习', time: '2026-09-09 10:30', duration: '90分钟', participants: 49, submitted: 47, status: 'completed', description: '完成15道SQL查询练习题' },
    { id: 'ee03', type: 'quiz', title: '第一章 绪论 - 随堂测验', time: '2026-09-08 10:00', duration: '10分钟', participants: 49, avgScore: 17.3, status: 'completed' }
  ]
};

// 授课计划与知识点覆盖数据
const mockCoverageData = {
  c001: {
    courseName: '高等数学（上）',
    planSource: '校方在线教学平台（已自动匹配授课计划）',
    outlineSource: '2025版本科人才培养方案课程教学大纲',
    planChapters: [
      { id: 'ch1', name: '第一章 函数与极限', totalPoints: 24, coveredPoints: 24, coverage: 100, status: 'completed', sections: ['1.1 映射与函数', '1.2 数列的极限', '1.3 函数的极限', '1.4 无穷小与无穷大', '1.5 极限运算法则', '1.6 极限存在准则', '1.7 无穷小的比较', '1.8 函数的连续性', '1.9 闭区间上连续函数的性质'] },
      { id: 'ch2', name: '第二章 导数与微分', totalPoints: 22, coveredPoints: 18, coverage: 82, status: 'teaching', sections: ['2.1 导数概念', '2.2 函数的求导法则', '2.3 高阶导数', '2.4 隐函数及参数方程导数', '2.5 函数的微分'] },
      { id: 'ch3', name: '第三章 微分中值定理与导数的应用', totalPoints: 26, coveredPoints: 0, coverage: 0, status: 'planned', sections: ['3.1 微分中值定理', '3.2 洛必达法则', '3.3 泰勒公式', '3.4 函数单调性', '3.5 函数极值', '3.6 曲线凹凸性', '3.7 曲率'] },
      { id: 'ch4', name: '第四章 不定积分', totalPoints: 18, coveredPoints: 0, coverage: 0, status: 'planned', sections: ['4.1 不定积分概念', '4.2 换元积分法', '4.3 分部积分法'] },
      { id: 'ch5', name: '第五章 定积分', totalPoints: 20, coveredPoints: 0, coverage: 0, status: 'planned', sections: ['5.1 定积分概念', '5.2 微积分基本公式', '5.3 定积分换元法', '5.4 定积分分部法', '5.5 反常积分'] },
      { id: 'ch6', name: '第六章 定积分的应用', totalPoints: 12, coveredPoints: 0, coverage: 0, status: 'planned', sections: ['6.1 平面图形面积', '6.2 体积', '6.3 弧长'] },
      { id: 'ch7', name: '第七章 微分方程', totalPoints: 16, coveredPoints: 0, coverage: 0, status: 'planned', sections: ['7.1 微分方程概念', '7.2 可分离变量方程', '7.3 一阶线性方程', '7.4 二阶常系数齐次方程', '7.5 二阶常系数非齐次方程'] },
      { id: 'ch8', name: '第八章 向量代数与空间解析几何', totalPoints: 14, coveredPoints: 0, coverage: 0, status: 'planned', sections: ['8.1 向量及其线性运算', '8.2 数量积', '8.3 平面方程', '8.4 空间直线方程', '8.5 曲面方程', '8.6 空间曲线'] }
    ],
    totalPoints: 152,
    totalCovered: 42,
    overallCoverage: 27.6
  }
};

// 大纲知识点要求等级（用于大纲覆盖分析）
const outlineRequirements = {
  '1.1 映射与函数': '理解', '1.2 数列的极限': '掌握', '1.3 函数的极限': '掌握', '1.4 无穷小与无穷大': '理解',
  '1.5 极限运算法则': '掌握', '1.6 极限存在准则': '了解', '1.7 无穷小的比较': '理解', '1.8 函数的连续性': '掌握',
  '1.9 闭区间上连续函数的性质': '了解', '2.1 导数概念': '掌握', '2.2 函数的求导法则': '掌握', '2.3 高阶导数': '掌握',
  '2.4 隐函数及参数方程导数': '理解', '2.5 函数的微分': '掌握', '3.1 微分中值定理': '掌握', '3.2 洛必达法则': '掌握',
  '3.3 泰勒公式': '了解', '3.4 函数单调性': '掌握', '3.5 函数极值': '掌握', '3.6 曲线凹凸性': '理解',
  '3.7 曲率': '了解', '4.1 不定积分概念': '掌握', '4.2 换元积分法': '掌握', '4.3 分部积分法': '掌握',
  '5.1 定积分概念': '掌握', '5.2 微积分基本公式': '掌握', '5.3 定积分换元法': '掌握', '5.4 定积分分部法': '理解',
  '5.5 反常积分': '了解', '6.1 平面图形面积': '掌握', '6.2 体积': '理解', '6.3 弧长': '了解',
  '7.1 微分方程概念': '理解', '7.2 可分离变量方程': '掌握', '7.3 一阶线性方程': '掌握',
  '7.4 二阶常系数齐次方程': '掌握', '7.5 二阶常系数非齐次方程': '理解', '8.1 向量及其线性运算': '掌握',
  '8.2 数量积': '掌握', '8.3 平面方程': '掌握', '8.4 空间直线方程': '掌握', '8.5 曲面方程': '了解', '8.6 空间曲线': '了解'
};

// 对比分析：计划进度 vs 实际进度（按周）
const mockPlanProgress = [
  { week: '第1周', planned: '第一章 1.1-1.4：映射与函数、数列极限、函数极限', actual: '已完成 1.1-1.4，并完成 1.5 极限运算法则', status: '超前' },
  { week: '第2周', planned: '第一章 1.5-1.9：极限运算法则、存在准则、连续性', actual: '已完成 1.5-1.9；第二章 2.1-2.2 已开始', status: '超前' },
  { week: '第3周', planned: '第二章 2.1-2.3：导数概念、求导法则、高阶导数', actual: '待执行', status: '计划中' },
  { week: '第4周', planned: '第二章 2.4-2.5 + 第三章 3.1：隐函数求导、微分、中值定理', actual: '待执行', status: '计划中' },
  { week: '第5周', planned: '第三章 3.2-3.4：洛必达法则、泰勒公式、单调性', actual: '待执行', status: '计划中' },
  { week: '第6周', planned: '第三章 3.5-3.7：极值、凹凸性、曲率', actual: '待执行', status: '计划中' }
];

// 对比分析：本课程 vs 全校同类课程平均
const mockPeerComparison = {
  courseName: '高等数学（上）',
  peerGroup: '全校公共数学类课程（共12门）',
  dimensions: [
    { name: '知识点覆盖率', current: 27.6, peer: 31.2, unit: '%', higher: false },
    { name: '授课进度符合度', current: 100, peer: 94, unit: '%', higher: true },
    { name: '随堂测验平均分', current: 16.8, peer: 15.9, unit: '分', higher: true },
    { name: '课堂出勤率', current: 98, peer: 96.1, unit: '%', higher: true },
    { name: '师生互动频次', current: 82, peer: 65, unit: '次/课时', higher: true },
    { name: '作业提交率', current: 96, peer: 93.5, unit: '%', higher: true }
  ]
};

// 录播资源数据
const mockResources = [
  { id: 'r001', title: '高等数学-极限与连续（第3讲）', course: '高等数学（上）', teacher: '李明华', duration: '45:32', size: '356MB', uploadTime: '2026-09-08 12:00', views: 128, downloads: 45, permission: 'public', clipping: false, synced: true, cloudPath: '云盘/高数课程/2026秋/' },
  { id: 'r002', title: '高等数学-导数概念（第4讲）', course: '高等数学（上）', teacher: '李明华', duration: '42:18', size: '328MB', uploadTime: '2026-09-09 12:00', views: 89, downloads: 23, permission: 'students', clipping: false, synced: true, cloudPath: '云盘/高数课程/2026秋/' },
  { id: 'r003', title: '大学英语-Unit 3 听说课', course: '大学英语III', teacher: '王芳', duration: '38:45', size: '298MB', uploadTime: '2026-09-05 18:30', views: 76, downloads: 18, permission: 'class', clipping: true, synced: false, cloudPath: '' },
  { id: 'r004', title: '程序设计基础-Python基础语法实验', course: '程序设计基础', teacher: '张伟', duration: '92:15', size: '612MB', uploadTime: '2026-09-08 18:00', views: 156, downloads: 67, permission: 'public', clipping: false, synced: true, cloudPath: '资源库/计算机学院/' },
  { id: 'r005', title: '线性代数-行列式（第2讲）', course: '线性代数', teacher: '赵建国', duration: '44:08', size: '342MB', uploadTime: '2026-09-07 15:20', views: 145, downloads: 52, permission: 'public', clipping: false, synced: true, cloudPath: '云盘/线性代数/' },
  { id: 'r006', title: '大学物理-力学（第5讲）', course: '大学物理', teacher: '陈晓东', duration: '46:55', size: '371MB', uploadTime: '2026-09-06 16:00', views: 68, downloads: 15, permission: 'teacher_only', clipping: false, synced: false, cloudPath: '' },
  { id: 'r007', title: '数据结构-链表操作实验演示', course: '数据结构', teacher: '刘建华', duration: '52:30', size: '401MB', uploadTime: '2026-09-09 14:00', views: 95, downloads: 38, permission: 'students', clipping: false, synced: true, cloudPath: '资源库/计算机学院/' },
  { id: 'r008', title: '概率统计-随机事件与概率（第1讲）', course: '概率论与数理统计', teacher: '孙梅', duration: '43:12', size: '335MB', uploadTime: '2026-09-09 12:30', views: 62, downloads: 20, permission: 'public', clipping: false, synced: true, cloudPath: '云盘/概率统计/' }
];

// 语音转文字示例（多语种）
const mockTranscript = [
  { time: '00:00:02', lang: 'zh-CN', original: '同学们好，今天我们继续学习函数的极限这一节。', translated: 'Hello everyone, today we continue to learn about the limit of functions.' },
  { time: '00:00:15', lang: 'zh-CN', original: '上节课我们介绍了数列极限的定义，这节课我们把它推广到函数极限。', translated: 'Last class we introduced the definition of sequence limit, today we extend it to function limit.' },
  { time: '00:00:32', lang: 'zh-CN', original: '函数极限的ε-δ定义，大家一定要掌握。', translated: 'You must master the ε-δ definition of function limit.' },
  { time: '00:00:45', lang: 'zh-CN', original: '好，我们来看一个例题。', translated: 'OK, let us look at an example.' },
  { time: '00:01:00', lang: 'zh-CN', original: '设f(x)=2x+1，当x趋近于3时，f(x)的极限是多少？', translated: 'Let f(x)=2x+1, what is the limit of f(x) as x approaches 3?' },
  { time: '00:01:18', lang: 'zh-CN', original: '对，是7。那如何用ε-δ语言来描述这个极限过程呢？', translated: 'Right, it is 7. How do we describe this limit process in ε-δ language?' },
  { time: '00:01:35', lang: 'zh-CN', original: '我们来逐步分析，首先|f(x)-7|=|2x+1-7|=|2x-6|=2|x-3|。', translated: 'Let us analyze step by step, first |f(x)-7|=|2x+1-7|=|2x-6|=2|x-3|.' },
  { time: '00:01:55', lang: 'zh-CN', original: '我们希望2|x-3|<ε，也就是|x-3|<ε/2。', translated: 'We want 2|x-3|<ε, which means |x-3|<ε/2.' },
  { time: '00:02:12', lang: 'zh-CN', original: '所以我们取δ=ε/2即可。', translated: 'So we take δ=ε/2.' },
  { time: '00:02:25', lang: 'zh-CN', original: '这样就完成了证明。大家理解了吗？', translated: 'Thus the proof is complete. Do you understand?' }
];

// 督导评价数据
const mockEvaluations = [
  { id: 'ev001', course: '高等数学（上）', teacher: '李明华', period: '周一 3-4节', week: '第2周', classroom: '教A-301', evals: 12, avgScore: 92.5, status: 'completed', lastEval: '2026-09-08' },
  { id: 'ev002', course: '程序设计基础', teacher: '张伟', period: '周一 1-2节', week: '第2周', classroom: '实验楼-302', evals: 8, avgScore: 88.3, status: 'completed', lastEval: '2026-09-08' },
  { id: 'ev003', course: '大学英语III', teacher: '王芳', period: '周二 3-4节', week: '第2周', classroom: '教B-205', evals: 5, avgScore: 90.0, status: 'ongoing', lastEval: '2026-09-09' },
  { id: 'ev004', course: '线性代数', teacher: '赵建国', period: '周四 3-4节', week: '第1周', classroom: '教A-101', evals: 15, avgScore: 94.1, status: 'completed', lastEval: '2026-09-05' },
  { id: 'ev005', course: '大学物理', teacher: '陈晓东', period: '周一 5-6节', week: '第2周', classroom: '物理楼-201', evals: 0, avgScore: 0, status: 'pending', lastEval: '-' },
  { id: 'ev006', course: '数据结构', teacher: '刘建华', period: '周二 1-2节', week: '第2周', classroom: '实验楼-405', evals: 3, avgScore: 89.5, status: 'ongoing', lastEval: '2026-09-09' }
];

// 评价表模板
const mockEvalTemplate = {
  name: '高校课堂教学质量评价表（标准版）',
  version: 'v3.2',
  totalItems: 20,
  sections: [
    {
      name: '教学态度（20分）',
      items: [
        { id: 1, content: '教师教学态度端正，认真负责', weight: 5, score: 0 },
        { id: 2, content: '教师按时上下课，不迟到不早退', weight: 5, score: 0 },
        { id: 3, content: '教师备课充分，授课内容充实', weight: 5, score: 0 },
        { id: 4, content: '教师衣冠整洁，言行文明规范', weight: 5, score: 0 }
      ]
    },
    {
      name: '教学内容（25分）',
      items: [
        { id: 5, content: '教学内容符合教学大纲要求', weight: 5, score: 0 },
        { id: 6, content: '教学内容具有科学性和先进性', weight: 5, score: 0 },
        { id: 7, content: '重点突出，难点讲解透彻', weight: 5, score: 0 },
        { id: 8, content: '理论联系实际，注重能力培养', weight: 5, score: 0 },
        { id: 9, content: '课堂信息量适中，难易适度', weight: 5, score: 0 }
      ]
    },
    {
      name: '教学方法（25分）',
      items: [
        { id: 10, content: '教学方法灵活多样，注重启发式教学', weight: 5, score: 0 },
        { id: 11, content: '善于运用现代教育技术手段', weight: 5, score: 0 },
        { id: 12, content: '师生互动良好，课堂氛围活跃', weight: 5, score: 0 },
        { id: 13, content: '教学组织有序，环节安排合理', weight: 5, score: 0 },
        { id: 14, content: '关注学生反馈，及时调整教学', weight: 5, score: 0 }
      ]
    },
    {
      name: '教学效果（20分）',
      items: [
        { id: 15, content: '学生对知识点掌握扎实', weight: 5, score: 0 },
        { id: 16, content: '学生课堂积极参与，思维活跃', weight: 5, score: 0 },
        { id: 17, content: '学生学习兴趣被有效激发', weight: 5, score: 0 },
        { id: 18, content: '教学目标达成度高', weight: 5, score: 0 }
      ]
    },
    {
      name: '综合素质（10分）',
      items: [
        { id: 19, content: '教师专业素养高，知识渊博', weight: 5, score: 0 },
        { id: 20, content: '教师语言表达准确，板书规范', weight: 5, score: 0 }
      ]
    }
  ],
  totalScore: 100
};

// 统计概览数据
const mockDashboardStats = {
  totalCourses: 86,
  totalTeachers: 142,
  totalStudents: 3856,
  totalActivitiesToday: 128,
  totalRecordings: 412,
  avgCoverage: 72.5,
  evalRate: 94.2,
  resourceViews: 28560
};

// 活动类型映射（label 用于展示，color 用于状态点着色）
const activityTypes = {
  quiz: { label: '随堂测验', color: '#1e6fd9' },
  discuss: { label: '主题讨论', color: '#4a90e2' },
  task: { label: '分组任务', color: '#1558b0' },
  signin: { label: '课堂签到', color: '#6bb3ff' },
  video: { label: '视频学习', color: '#2f7dd2' },
  poll: { label: '在线投票', color: '#7db8e8' }
};

// 同步的教学平台列表
const mockLmsPlatforms = [
  { id: 'lms001', name: '校方在线教学平台', connected: true, lastSync: '2026-09-09 08:00', courses: 86 },
  { id: 'lms002', name: '智慧树', connected: true, lastSync: '2026-09-09 08:00', courses: 42 },
  { id: 'lms003', name: '学堂在线', connected: false, lastSync: '2026-09-05 10:30', courses: 28 },
  { id: 'lms004', name: '自建MOOC平台', connected: true, lastSync: '2026-09-09 08:00', courses: 124 }
];

// 参与学生名单生成（用于课程详情/教学平台空间页）
function getMockStudents(courseId, count) {
  const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗'];
  const names = ['伟', '芳', '娜', '敏', '静', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英', '文轩'];
  const students = [];
  for (let i = 0; i < count; i++) {
    const s = surnames[(i * 7 + 3) % surnames.length] + names[(i * 3 + 5) % names.length];
    const score = Math.round(55 + Math.random() * 45);
    students.push({
      no: 20240001 + i,
      name: s,
      submitted: Math.random() > 0.08,
      score: score,
      time: (3 + Math.floor(Math.random() * 12)) + '分钟'
    });
  }
  return students;
}

// ============ 语音转写字幕：多语种课堂句库（中/英/德/法/日/俄/西/韩/阿拉伯/葡萄牙/印地） ============
const transcriptSentencePool = [
  { zh: '同学们好，今天我们继续学习本课程的新内容。',
    en: 'Hello everyone, today we will continue with new content of this course.',
    de: 'Hallo zusammen, heute lernen wir die neuen Inhalte dieses Kurses weiter.',
    fr: "Bonjour à tous, aujourd'hui nous poursuivons avec le nouveau contenu du cours.",
    ja: '皆さんこんにちは、今日はこの科目の新しい内容を続けて学びます。',
    ru: 'Здравствуйте, сегодня мы продолжаем изучать новый материал этого курса.',
    es: 'Hola a todos, hoy continuaremos con el nuevo contenido del curso.',
    ko: '여러분 안녕하세요, 오늘은 이 과목의 새로운 내용을 계속 배우겠습니다.',
    ar: 'مرحباً بالجميع، اليوم سنكمل تعلّم المحتوى الجديد لهذه المادة.',
    pt: 'Olá a todos, hoje continuaremos com o novo conteúdo da disciplina.',
    hi: 'नमस्कार दोस्तों, आज हम इस पाठ्यक्रम की नई सामग्री जारी रखेंगे।' },
  { zh: '首先我们回顾一下上节课的重点内容。',
    en: 'First, let us review the key points from the last class.',
    de: 'Zuerst wiederholen wir die wichtigsten Punkte der letzten Stunde.',
    fr: "Tout d'abord, récapitulons les points essentiels du dernier cours.",
    ja: 'まず前回の授業の要点を振り返りましょう。',
    ru: 'Сначала повторим основные моменты прошлого занятия.',
    es: 'Primero repasemos los puntos clave de la clase anterior.',
    ko: '먼저 지난 수업의 핵심 내용을 복습해 봅시다.',
    ar: 'أولاً، لنراجع النقاط الرئيسية من المحاضرة السابقة.',
    pt: 'Primeiro, vamos revisar os pontos principais da última aula.',
    hi: 'पहले हम पिछली कक्षा के मुख्य बिंदुओं की समीक्षा करें।' },
  { zh: '大家请看屏幕上的这个例子。',
    en: 'Please look at this example on the screen.',
    de: 'Bitte schauen Sie sich dieses Beispiel auf dem Bildschirm an.',
    fr: "Veuillez regarder cet exemple à l'écran.",
    ja: '画面上のこの例を見てください。',
    ru: 'Пожалуйста, посмотрите на этот пример на экране.',
    es: 'Miren este ejemplo en la pantalla.',
    ko: '화면에 있는 이 예시를 보십시오.',
    ar: 'يرجى النظر إلى هذا المثال على الشاشة.',
    pt: 'Por favor, observem este exemplo na tela.',
    hi: 'कृपया स्क्रीन पर इस उदाहरण को देखें।' },
  { zh: '这个概念非常重要，请大家务必掌握。',
    en: 'This concept is very important, please make sure you master it.',
    de: 'Dieses Konzept ist sehr wichtig, bitte beherrschen Sie es unbedingt.',
    fr: 'Ce concept est très important, veuillez bien le maîtriser.',
    ja: 'この概念は非常に重要ですので、必ず身につけてください。',
    ru: 'Это очень важное понятие, обязательно освойте его.',
    es: 'Este concepto es muy importante, asegúrense de dominarlo.',
    ko: '이 개념은 매우 중요하므로 반드시 익히시기 바랍니다.',
    ar: 'هذا المفهوم مهم جداً، يرجى التأكد من إتقانه.',
    pt: 'Este conceito é muito importante, certifiquem-se de dominá-lo.',
    hi: 'यह अवधारणा बहुत महत्वपूर्ण है, कृपया इसे अवश्य समझें।' },
  { zh: '我们一起来分析这道题的解题思路。',
    en: "Let's analyze the approach to solving this problem together.",
    de: 'Analysieren wir gemeinsam den Lösungsweg dieser Aufgabe.',
    fr: 'Analysons ensemble la démarche de résolution de cet exercice.',
    ja: '一緒にこの問題の解き方を分析しましょう。',
    ru: 'Давайте вместе разберём ход решения этой задачи.',
    es: 'Analicemos juntos el enfoque para resolver este problema.',
    ko: '함께 이 문제의 풀이 방법을 분석해 봅시다.',
    ar: 'لنحلل معاً طريقة حل هذه المسألة.',
    pt: 'Vamos analisar juntos a abordagem para resolver este problema.',
    hi: 'आइए एक साथ इस प्रश्न के समाधान की विधि का विश्लेषण करें।' },
  { zh: '有哪位同学愿意说说自己的看法？',
    en: 'Would any of you like to share your thoughts?',
    de: 'Möchte jemand von Ihnen seine Meinung sagen?',
    fr: "Y aurait-il un volontaire pour donner son avis ?",
    ja: 'どなたか自分の考えを話してくれますか？',
    ru: 'Кто хотел бы высказать своё мнение?',
    es: '¿Alguien quiere compartir su opinión?',
    ko: '누군가 자신의 생각을 말해 보겠습니까?',
    ar: 'هل من متطوع ليدلي برأيه؟',
    pt: 'Alguém gostaria de compartilhar sua opinião?',
    hi: 'क्या कोई अपने विचार साझा करना चाहेगा?' },
  { zh: '很好，你的思路完全正确。',
    en: 'Very good, your reasoning is completely correct.',
    de: 'Sehr gut, Ihr Gedankengang ist völlig richtig.',
    fr: 'Très bien, votre raisonnement est tout à fait correct.',
    ja: '素晴らしい、その考え方は完全に正しいです。',
    ru: 'Отлично, ваше рассуждение совершенно верное.',
    es: 'Muy bien, tu razonamiento es completamente correcto.',
    ko: '아주 좋습니다, 그 접근 방식은 완전히 정확합니다.',
    ar: 'أحسنت، فكرتك صحيحة تماماً.',
    pt: 'Muito bom, seu raciocínio está totalmente correto.',
    hi: 'बहुत अच्छा, आपका तर्क पूरी तरह सही है।' },
  { zh: '注意这里容易出错的地方。',
    en: 'Pay attention to this part where mistakes are often made.',
    de: 'Achten Sie auf diese Stelle, an der häufig Fehler entstehen.',
    fr: 'Faites attention à cet endroit où l’on se trompe souvent.',
    ja: 'ここは間違いやすい箇所なので注意してください。',
    ru: 'Обратите внимание на это место, где часто допускают ошибки.',
    es: 'Presten atención a esta parte donde suelen cometerse errores.',
    ko: '여기는 실수하기 쉬운 부분이니 주의하시기 바랍니다.',
    ar: 'انتبهوا إلى هذا الموضع الذي تحدث فيه الأخطاء عادةً.',
    pt: 'Prestem atenção a esta parte onde erros são frequentes.',
    hi: 'यहाँ त्रुटि होने की संभावना रहती है, ध्यान दें।' },
  { zh: '我们把这个步骤再推导一遍。',
    en: "Let's go through this step of the derivation once more.",
    de: 'Lassen Sie uns diesen Schritt der Herleitung noch einmal durchgehen.',
    fr: 'Refaisons cette étape de la démonstration une fois de plus.',
    ja: 'この導出の手順をもう一度確認しましょう。',
    ru: 'Пройдём этот шаг вывода ещё раз.',
    es: 'Repitamos una vez más este paso de la deducción.',
    ko: '이 유도 과정을 한 번 더 살펴봅시다.',
    ar: 'لنعد إلى خطوة الاشتقاق هذه مرة أخرى.',
    pt: 'Vamos refazer mais uma vez esta etapa da dedução.',
    hi: 'आइए इस चरण को एक बार फिर से व्युत्पन्न करें।' },
  { zh: '大家理解了吗？如果有问题请举手。',
    en: 'Does everyone understand? Please raise your hand if you have questions.',
    de: 'Hat das jeder verstanden? Bitte melden Sie sich bei Fragen.',
    fr: 'Tout le monde a compris ? Levez la main si vous avez des questions.',
    ja: '皆さん理解できましたか？質問があれば手を挙げてください。',
    ru: 'Всем понятно? Если есть вопросы, поднимите руку.',
    es: '¿Todos entienden? Levanten la mano si tienen preguntas.',
    ko: '다들 이해했습니까? 질문이 있으면 손을 드세요.',
    ar: 'هل فهم الجميع؟ ارفعوا أيديكم إذا كانت لديكم أسئلة.',
    pt: 'Todos entenderam? Levantem a mão se tiverem dúvidas.',
    hi: 'क्या सबने समझ लिया? प्रश्न हो तो हाथ उठाइए।' },
  { zh: '下面我们做一道练习题巩固一下。',
    en: "Now let's do an exercise to consolidate what we've learned.",
    de: 'Jetzt machen wir eine Übungsaufgabe zur Festigung.',
    fr: 'Faisons maintenant un exercice pour consolider.',
    ja: '次に、理解を深めるために練習問題を解きましょう。',
    ru: 'А теперь выполним упражнение для закрепления.',
    es: 'Ahora hagamos un ejercicio para consolidar lo aprendido.',
    ko: '이제 배운 내용을巩固하기 위해 연습문제를 풀어봅시다.',
    ar: 'الآن لنحل تمريناً لتثبيت ما تعلمناه.',
    pt: 'Agora vamos fazer um exercício para consolidar o que aprendemos.',
    hi: 'अब हम सीखी गई बातों को मजबूत करने के लिए एक अभ्यास प्रश्न करें।' },
  { zh: '请大家拿出练习本，限时五分钟完成。',
    en: 'Please take out your exercise books, you have five minutes.',
    de: 'Bitte nehmen Sie Ihr Übungsheft, Sie haben fünf Minuten Zeit.',
    fr: 'Sortez vos cahiers d’exercices, vous avez cinq minutes.',
    ja: '練習帳を取り出してください。制限時間は5分です。',
    ru: 'Возьмите тетради, на выполнение — пять минут.',
    es: 'Saquen sus cuadernos de ejercicios, tienen cinco minutos.',
    ko: '연습장을 꺼내 주세요. 제한 시간은 5분입니다.',
    ar: 'أخرجوا دفاتر التمارين، لديكم خمس دقائق.',
    pt: 'Tirem seus cadernos de exercícios, vocês têm cinco minutos.',
    hi: 'कृपया अपनी अभ्यास पुस्तिका निकालें, पाँच मिनट का समय है।' },
  { zh: '时间到，我们一起来对答案。',
    en: "Time's up, let's check the answers together.",
    de: 'Die Zeit ist um, vergleichen wir die Antworten.',
    fr: "Le temps est écoulé, corrigeons ensemble.",
    ja: '時間となりました。一緒に答え合わせをしましょう。',
    ru: 'Время вышло, сверим ответы вместе.',
    es: "Se acabó el tiempo, corrijamos juntos las respuestas.",
    ko: '시간이 다 되었습니다. 함께 정답을 확인해 봅시다.',
    ar: 'انتهى الوقت، لنتحقق من الإجابات معاً.',
    pt: 'O tempo acabou, vamos conferir as respostas juntos.',
    hi: 'समय समाप्त, आइए एक साथ उत्तर मिलाएँ।' },
  { zh: '大部分同学都做对了，非常好。',
    en: 'Most of you got it right, very good.',
    de: 'Die meisten von Ihnen haben es richtig gemacht, sehr gut.',
    fr: 'La plupart d’entre vous ont réussi, très bien.',
    ja: 'ほとんどの人が正解できました。大変良いです。',
    ru: 'Большинство справилось правильно, очень хорошо.',
    es: 'La mayoría lo hizo bien, muy bien.',
    ko: '대부분 맞혔네요. 아주 좋습니다.',
    ar: 'أجاب معظمكم بشكل صحيح، أحسنتم.',
    pt: 'A maioria acertou, muito bem.',
    hi: 'अधिकांश ने सही उत्तर दिया, बहुत अच्छा।' },
  { zh: '这个知识点在考试中经常出现。',
    en: 'This knowledge point appears frequently in exams.',
    de: 'Dieser Wissenspunkt erscheint häufig in Prüfungen.',
    fr: 'Ce point de connaissance revient souvent dans les examens.',
    ja: 'この知識点は試験でよく出題されます。',
    ru: 'Этот материал часто встречается на экзаменах.',
    es: 'Este punto aparece con frecuencia en los exámenes.',
    ko: '이 지식 포인트는 시험에 자주 출제됩니다.',
    ar: 'تظهر هذه النقطة المعرفية كثيراً في الامتحانات.',
    pt: 'Este ponto aparece com frequência nas provas.',
    hi: 'यह बिंदु परीक्षा में अक्सर आता है।' },
  { zh: '我们来看第二种解法，这种方法更为简洁。',
    en: "Let's look at the second solution, which is more concise.",
    de: 'Schauen wir uns die zweite Lösung an, sie ist eleganter.',
    fr: 'Voyons la deuxième méthode, plus concise.',
    ja: '第二の解法を見てみましょう。こちらの方が簡潔です。',
    ru: 'Рассмотрим второй способ решения — он более краткий.',
    es: 'Veamos el segundo método, es más conciso.',
    ko: '두 번째 풀이를 봅시다. 이 방법이 더 간결합니다.',
    ar: 'لننظر إلى الحل الثاني، فهذه الطريقة أكثر إيجازاً.',
    pt: 'Vejamos o segundo método, que é mais conciso.',
    hi: 'आइए दूसरी विधि देखें, यह अधिक संक्षिप्त है।' },
  { zh: '课后请大家完成教材上的习题。',
    en: 'After class, please complete the exercises in the textbook.',
    de: 'Bitte erledigen Sie nach der Stunde die Aufgaben im Lehrbuch.',
    fr: 'Après le cours, faites les exercices du manuel.',
    ja: '授業後に教科書の問題を完成させてください。',
    ru: 'После занятий выполните упражнения из учебника.',
    es: 'Después de clase, completen los ejercicios del libro de texto.',
    ko: '수업 후 교재의 문제를 완성해 주세요.',
    ar: 'بعد الحصة، يرجى حل تمارين الكتاب المدرسي.',
    pt: 'Após a aula, completem os exercícios do livro didático.',
    hi: 'कक्षा के बाद कृपया पाठ्यपुस्तक के अभ्यास प्रश्न पूरे करें।' },
  { zh: '下节课我们要学习新的章节。',
    en: 'Next class we will start a new chapter.',
    de: 'In der nächsten Stunde beginnen wir mit einem neuen Kapitel.',
    fr: 'Au prochain cours, nous commencerons un nouveau chapitre.',
    ja: '次の授業では新しい章を学びます。',
    ru: 'На следующем занятии мы начнём новую главу.',
    es: 'En la próxima clase comenzaremos un nuevo capítulo.',
    ko: '다음 수업에서는 새로운 장을 배우겠습니다.',
    ar: 'في الحصة القادمة سنبدأ فصلاً جديداً.',
    pt: 'Na próxima aula começaremos um novo capítulo.',
    hi: 'अगली कक्षा में हम नया अध्याय शुरू करेंगे।' },
  { zh: '今天的课就讲到这里。',
    en: "That's all for today's class.",
    de: 'Das war alles für heute.',
    fr: "C'est tout pour aujourd'hui.",
    ja: '今日の授業はここまでです。',
    ru: 'На этом сегодняшнее занятие закончено.',
    es: 'Esto es todo por la clase de hoy.',
    ko: '오늘 수업은 여기까지입니다.',
    ar: 'انتهى درس اليوم إلى هنا.',
    pt: 'Por hoje é só.',
    hi: 'आज की कक्षा इतनी ही।' },
  { zh: '记得复习今天讲过的内容。',
    en: 'Remember to review what we covered today.',
    de: 'Denken Sie daran, den heutigen Stoff zu wiederholen.',
    fr: 'N’oubliez pas de réviser ce que nous avons vu aujourd’hui.',
    ja: '今日学んだ内容を復習するのを忘れないでください。',
    ru: 'Не забудьте повторить сегодняшний материал.',
    es: 'Recuerden repasar lo que vimos hoy.',
    ko: '오늘 배운 내용을 복습하는 것을 잊지 마세요.',
    ar: 'تذكروا مراجعة ما درسناه اليوم.',
    pt: 'Lembrem-se de revisar o que vimos hoje.',
    hi: 'आज की सामग्री की समीक्षा करना न भूलें।' },
  { zh: '我们休息五分钟再继续。',
    en: "Let's take a five-minute break before continuing.",
    de: 'Machen wir eine fünfminütige Pause, bevor wir fortfahren.',
    fr: 'Prenons une pause de cinq minutes avant de continuer.',
    ja: '5分休憩してから続けましょう。',
    ru: 'Сделаем пятиминутный перерыв и продолжим.',
    es: 'Tomemos un descanso de cinco minutos antes de continuar.',
    ko: '5분간 쉬었다가 계속하겠습니다.',
    ar: 'لنأخذ استراحة لمدة خمس دقائق قبل المواصلة.',
    pt: 'Vamos fazer uma pausa de cinco minutos antes de continuar.',
    hi: 'आइए पाँच मिनट का ब्रेक लें और फिर जारी रखें।' },
  { zh: '请看这道例题，注意它的条件设置。',
    en: 'Look at this example problem, note how the conditions are set up.',
    de: 'Betrachten Sie diese Beispielaufgabe, achten Sie auf die Bedingungen.',
    fr: 'Regardez cet exemple, notez comment les conditions sont posées.',
    ja: 'この例題を見てください。条件の設定に注意してください。',
    ru: 'Посмотрите на этот пример, обратите внимание на условия.',
    es: 'Miren este problema de ejemplo, noten cómo están planteadas las condiciones.',
    ko: '이 예제 문제를 보세요. 조건 설정에 주목하세요.',
    ar: 'انظروا إلى هذا المثال، ولاحظوا كيف صيغت الشروط.',
    pt: 'Veja este problema de exemplo, observem como as condições são definidas.',
    hi: 'इस उदाहरण को देखें, इसकी शर्तों पर ध्यान दें।' },
  { zh: '谁能试着回答这个问题？',
    en: 'Who can try to answer this question?',
    de: 'Wer kann versuchen, diese Frage zu beantworten?',
    fr: 'Qui peut essayer de répondre à cette question ?',
    ja: '誰かこの質問に答えてみますか？',
    ru: 'Кто может попробовать ответить на этот вопрос?',
    es: '¿Quién puede intentar responder esta pregunta?',
    ko: '누가 이 질문에 답해 보겠습니까?',
    ar: 'من يستطيع محاولة الإجابة على هذا السؤال؟',
    pt: 'Quem pode tentar responder a esta pergunta?',
    hi: 'कौण इस प्रश्न का उत्तर देने का प्रयास कर सकता है?' }
];

// 按资源生成与视频时长匹配的字幕（每20-40秒一句，覆盖全片）
function getTranscriptForResource(resourceId, lang) {
  const r = mockResources.find(x => x.id === resourceId) || mockResources[0];
  const parts = r.duration.split(':').map(Number);
  const totalSec = (parts[0] || 0) * 60 + (parts[1] || 0);
  const offset = r.id.charCodeAt(r.id.length - 1);
  const items = [];
  let sec = 2, i = 0;
  while (sec < totalSec - 5) {
    const s = transcriptSentencePool[(i + offset) % transcriptSentencePool.length];
    const pad = (n) => String(n).padStart(2, '0');
    const ts = pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec % 3600 / 60)) + ':' + pad(sec % 60);
    items.push({ time: ts, original: s.zh, translated: s[lang] || s.en });
    sec += 20 + ((i * 7 + offset) % 20);
    i++;
  }
  return items;
}

// ============ 跨页面共享存储（不依赖common.js，可直接使用） ============
function lsGet(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// 智慧课堂发起的活动（同步发布至教学平台）
function getCustomEvents(courseId) {
  const all = lsGet('smart_class_custom_events', []);
  return courseId ? all.filter(e => e.courseId === courseId).map(e => e.event) : all;
}
function addCustomEvent(courseId, event) {
  const all = lsGet('smart_class_custom_events', []);
  all.push({ courseId, event });
  lsSet('smart_class_custom_events', all);
}
function removeCustomEvent(eventId) {
  const all = lsGet('smart_class_custom_events', []).filter(e => e.event.id !== eventId);
  lsSet('smart_class_custom_events', all);
}
// 合并平台同步活动 + 智慧课堂发起活动
function getCourseEvents(courseId) {
  return (mockTimelineEvents[courseId] || []).concat(getCustomEvents(courseId));
}

// 同步至教学平台云盘/资源库的录播资源
function getSyncedResourceIds() { return lsGet('smart_class_synced_resources', []); }
function isResourceSynced(r) { return r.synced || getSyncedResourceIds().indexOf(r.id) >= 0; }
function syncResourceToLms(resourceId) {
  const ids = getSyncedResourceIds();
  if (ids.indexOf(resourceId) < 0) { ids.push(resourceId); lsSet('smart_class_synced_resources', ids); }
}
