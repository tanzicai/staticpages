/* ============================================================
 * mockdata.js - 演示数据集中管理
 *
 * 说明：
 *   1. 所有静态数据从模板中抽离，便于统一维护和将来对接真实后端
 *   2. 提供通用渲染函数（如 renderKpis/renderTable），减少模板重复
 *   3. 当前 14 个页面中，dashboard 与 taskfund 演示使用 mockdata
 *      其他页面保留内联数据，便于单独维护（注释中标注 TODO）
 *   4. 命名约定：window.MOCK 暴露为全局对象，pages.js 和 app.js 都可访问
 * ============================================================ */

// 在浏览器全局上下文中声明 MOCK 变量，使得 pages.js 模板字符串插值
// 中可以直接用 `MOCK.xxx`（同时也是 `window.MOCK.xxx`）。
// 不能用 IIFE 因为那样 MOCK 只会成为函数局部变量。
/* eslint-disable no-var */
var MOCK = {};

  /* ============================================================
   * 学院基础信息（顶部导航 / 全局使用）
   * ============================================================ */
  var COLLEGE = {
    shortName: '智',
    name: '智能制造与汽车学院',
    fullName: '智能制造与汽车学院（航空学院）',
    university: '重庆电子科技职业大学',
    badge: '双高建设 · 学院管理驾驶舱',
    role: '院长驾驶舱视角',
    dean: '陈院长',
    deanAvatar: '陈',
    topbarStats: [
      { value: '4,800', label: '在校学生' },
      { value: '152',   label: '教职工' },
      { value: '37',    label: '博士教师' },
      { value: '760+',  label: '授权专利' },
      { value: '5类',   label: '任务类型' }
    ]
  };

  /* ============================================================
   * 各页面 KPI 数据
   * 结构：{ type, icon, label, value, trend, trendDir }
   * ============================================================ */
  var KPIS = {
    dashboard: [
      { type: 'primary', icon: '▤', label: '学院任务总数',    value: '286',    trend: '▲ 较上月 +18 项',     trendDir: 'up' },
      { type: 'success', icon: '✓', label: '本年度已完成',      value: '187',    trend: '完成率 65.4%',        trendDir: 'up' },
      { type: 'warning', icon: '◷', label: '进行中任务',      value: '72',     trend: '逾期预警 3 项',       trendDir: ''   },
      { type: 'danger',  icon: '!', label: '待审核任务',      value: '19',     trend: '▼ 需关注',            trendDir: 'down' },
      { type: 'gold',    icon: '★', label: '双高建设任务',    value: '48',     trend: '覆盖率 100%',         trendDir: 'up' },
      { type: 'primary', icon: '♟', label: '教师档案完整度',   value: '94.7%',  trend: '▲ +2.1%',            trendDir: 'up' }
    ],
    bigscreen: [
      { type: 'gold',    icon: '★', label: '国家级成果',     value: '14',     trend: '较上年 +3',       trendDir: 'up' },
      { type: 'success', icon: '',   label: '省级标志性成果', value: '38',     trend: '+5',             trendDir: 'up' },
      { type: 'primary', icon: '',   label: '双高任务达成率', value: '68.5%',  trend: '实时更新',       trendDir: ''   },
      { type: 'warning', icon: '',   label: '资金执行率',     value: '73.2%',  trend: '¥1,860万/2,540万', trendDir: '' }
    ],
    taskfund: [
      { type: 'primary', icon: '¥', label: '总预算',     value: '3,318万', trend: '全年规划',         trendDir: ''   },
      { type: 'success', icon: '✓', label: '已执行',     value: '2,299万', trend: '执行率 69.3%',     trendDir: 'up' },
      { type: 'warning', icon: '⌛', label: '待执行',     value: '1,019万', trend: '剩余 30.7%',       trendDir: ''   },
      { type: 'gold',    icon: '⚠', label: '待审批报销', value: '28',     trend: '¥126.5万 · 需关注', trendDir: ''   }
    ],
    performance: [
      { type: 'gold',    icon: '★', label: '绩效等级 A+', value: '12',     trend: '占比 7.9%',  trendDir: 'up' },
      { type: 'primary', icon: '',   label: '绩效等级 A',  value: '38',     trend: '占比 25.0%', trendDir: ''   },
      { type: 'success', icon: '',   label: '绩效等级 B',  value: '72',     trend: '占比 47.4%', trendDir: ''   },
      { type: 'warning', icon: '',   label: '绩效等级 C',  value: '30',     trend: '占比 19.7%', trendDir: ''   }
    ],
    audit: [
      { type: 'success', icon: '✓', label: '本月已通过',   value: '42',  trend: '通过率 93.3%', trendDir: 'up' },
      { type: 'warning', icon: '',   label: '待审核',       value: '19',  trend: '平均 2.3 天',  trendDir: ''   },
      { type: 'danger',  icon: '',   label: '本月驳回',     value: '3',   trend: '需补充材料',   trendDir: ''   },
      { type: 'gold',    icon: '',   label: '年度审核',     value: '214', trend: '通过率 92.6%', trendDir: ''   }
    ],
    course: [
      { type: 'primary', icon: '▤', label: '课程总数',        value: '180', trend: '本学期 +12',     trendDir: 'up' },
      { type: 'gold',    icon: '',   label: '课程思政示范',    value: '16',  trend: '国家级 3 · 市级 13', trendDir: '' },
      { type: 'success', icon: '',   label: '在线开放课程',    value: '22',  trend: '国家级 5 · 校级 9',  trendDir: '' },
      { type: 'warning', icon: '',   label: '新形态教材',      value: '14',  trend: '活页式 · 数字教材', trendDir: '' }
    ],
    lab: [
      { type: 'primary', icon: '⚙', label: '实训基地',        value: '12',    trend: '国家级 2 · 市级 5', trendDir: ''   },
      { type: 'success', icon: '',   label: '设备总数',        value: '386',   trend: '利用率 78%',       trendDir: 'up' },
      { type: 'gold',    icon: '',   label: '本学期实训学时',   value: '12,800', trend: '已完成 8,256',     trendDir: ''   },
      { type: 'warning', icon: '',   label: '故障设备',        value: '8',     trend: '已申报维修',       trendDir: 'down' }
    ],
    teacher: [
      { type: 'primary', icon: '♟', label: '教师总数',     value: '152', trend: '在岗率 96.7%', trendDir: ''   },
      { type: 'gold',    icon: '',   label: '博士学位',     value: '37',  trend: '占比 24.3%',   trendDir: ''   },
      { type: 'success', icon: '',   label: '双师型教师',   value: '86',  trend: '占比 56.6%',   trendDir: ''   },
      { type: 'warning', icon: '',   label: '企业兼职',     value: '28',  trend: '来自长安/比亚迪/中航等', trendDir: '' }
    ],
    portal: [
      { type: 'primary', icon: '★', label: '招生规模',     value: '1,320',  trend: '2026 录取',        trendDir: 'up' },
      { type: 'success', icon: '',   label: '就业率',       value: '97.1%',  trend: '对口率 86%',       trendDir: 'up' },
      { type: 'gold',    icon: '',   label: '合作企业',     value: '68',     trend: '世界 500 强 12 家', trendDir: ''  },
      { type: 'warning', icon: '',   label: '社会培训',     value: '17,000+', trend: '累计培训人次',     trendDir: ''  }
    ],
    workspace: [
      { type: 'danger',  icon: '!', label: '待办',          value: '8',   trend: '3 项加急',         trendDir: 'down' },
      { type: 'warning', icon: '',   label: '进行中任务',    value: '12',  trend: '6 项主负责',       trendDir: ''    },
      { type: 'primary', icon: '',   label: '本月已审核',    value: '28',  trend: '通过 26 项',       trendDir: 'up'  },
      { type: 'success', icon: '',   label: '本年绩效',      value: 'A+',  trend: '综合得分 92',      trendDir: ''    }
    ]
  };

  /* ============================================================
   * 任务库数据（tasklib 页面表格）
   * ============================================================ */
  var TASK_LIST = [
    { id: 'SG2026-001', name: '智能网联汽车高水平专业群建设',    type: '双高',     typeClass: 'tag-gold',    year: 2026, budget: 320.0, leader: '李教授', progress: 78, status: '进行中', statusClass: 'tag-success' },
    { id: 'SG2026-002', name: '航空智能制造技术专业群建设',      type: '双高',     typeClass: 'tag-gold',    year: 2026, budget: 280.0, leader: '王教授', progress: 62, status: '进行中', statusClass: 'tag-warning' },
    { id: 'KC2026-015', name: '《新能源汽车结构原理》课程思政示范课', type: '课程建设', typeClass: 'tag-primary', year: 2026, budget: 8.5,   leader: '陈教授', progress: 91, status: '已验收', statusClass: 'tag-success' },
    { id: 'KY2026-008', name: '航空发动机数字化制造工艺研究',    type: '科研项目', typeClass: 'tag-success', year: 2026, budget: 45.0,  leader: '张博士', progress: 55, status: '进行中', statusClass: 'tag-primary' },
    { id: 'SB2026-022', name: '国家级技能大师工作室建设',        type: '教师申报', typeClass: 'tag-warning', year: 2026, budget: 120.0, leader: '刘大师', progress: 54, status: '进行中', statusClass: 'tag-warning' },
    { id: 'SX2026-007', name: '长安汽车产教融合实训基地',        type: '实训产教', typeClass: 'tag-danger',  year: 2026, budget: 180.0, leader: '赵教授', progress: 88, status: '进行中', statusClass: 'tag-success' },
    { id: 'KY2026-013', name: '无人机智能制造关键技术研究',      type: '科研项目', typeClass: 'tag-success', year: 2026, budget: 28.0,  leader: '孙博士', progress: 42, status: '进行中', statusClass: 'tag-primary' },
    { id: 'KC2026-031', name: '《智能制造数字孪生技术》课程建设', type: '课程建设', typeClass: 'tag-primary', year: 2026, budget: 12.0,  leader: '周教授', progress: 35, status: '进行中', statusClass: 'tag-primary' }
  ];

  /* ============================================================
   * 角色与权限模型（P1 多视角方案）
   *
   * 三个角色：
   *   leader    — 学院领导（院长视角）— 看到全部 14 个菜单模块
   *   director  — 专业群负责人       — 看到全部 14 个菜单模块（专业群视角）
   *   teacher   — 专任教师           — 看到限定的 8 个菜单模块（个人视角）
   *
   * visibility: 哪些 menu-item.data-page 在该角色下可见
   * tag        : 顶栏视角标签
   * mainKpis   : 首页 KPI（领导/主任看全员指标；教师看个人任务）
   * ============================================================ */
  var ALL_PAGES = ['dashboard','bigscreen','tasklib','taskassign','taskmonitor','evidence',
                   'taskfund','performance','audit','course','lab','teacher','portal','workspace'];

  var ROLES = {
    leader: {
      code: 'leader',
      name: '王建军',
      avatar: '王',
      roleLabel: '学院领导',
      tag: '院长驾驶舱视角',
      sub: '智能制造与汽车学院（航空学院）院长',
      avatarGrad: 'linear-gradient(135deg,#f5b841,#d89614)',
      visibility: ALL_PAGES.slice(),
      dashboardKpis: [
        { type: 'primary', icon: '▤', label: '学院任务总数',    value: '286',    trend: '▲ 较上月 +18 项',     trendDir: 'up' },
        { type: 'success', icon: '✓', label: '本年度已完成',      value: '187',    trend: '完成率 65.4%',        trendDir: 'up' },
        { type: 'warning', icon: '◷', label: '进行中任务',      value: '72',     trend: '逾期预警 3 项',       trendDir: ''   },
        { type: 'danger',  icon: '!', label: '待审核任务',      value: '19',     trend: '▼ 需关注',            trendDir: 'down' },
        { type: 'gold',    icon: '★', label: '双高建设任务',    value: '48',     trend: '覆盖率 100%',         trendDir: 'up' },
        { type: 'primary', icon: '♟', label: '教师档案完整度',   value: '94.7%',  trend: '▲ +2.1%',            trendDir: 'up' }
      ]
    },

    director: {
      code: 'director',
      name: '王建军',
      avatar: '王',
      roleLabel: '专业群负责人',
      tag: '航空智能制造专业群视角',
      sub: '航空智能制造技术专业群负责人',
      avatarGrad: 'linear-gradient(135deg,#5cadff,#2d8cf0)',
      visibility: ALL_PAGES.slice(),
      dashboardKpis: [
        { type: 'primary', icon: '★', label: '专业群任务',     value: '126',   trend: '▲ 较上月 +9',         trendDir: 'up' },
        { type: 'gold',    icon: '✓', label: '已完成',          value: '74',    trend: '完成率 58.7%',        trendDir: 'up' },
        { type: 'warning', icon: '◷', label: '进行中',          value: '38',    trend: '专业群内 2 项逾期',    trendDir: ''   },
        { type: 'danger',  icon: '!', label: '待审核',          value: '11',    trend: '▼ 需关注',            trendDir: 'down' },
        { type: 'success', icon: '¥', label: '专业群预算执行',   value: '72.4%', trend: '已用 866 / 1,195 万', trendDir: 'up' },
        { type: 'primary', icon: '♟', label: '核心成员',        value: '32',    trend: '博士占比 43.8%',      trendDir: ''   }
      ]
    },

    teacher: {
      code: 'teacher',
      name: '陈静',
      avatar: '陈',
      roleLabel: '专任教师',
      tag: '教师个人工作视角',
      sub: '新能源汽车专业 · 讲师',
      avatarGrad: 'linear-gradient(135deg,#19be6b,#0e9f51)',
      visibility: ['dashboard','workspace','tasklib','taskmonitor','evidence','taskfund','performance','portal'],
      dashboardKpis: [
        { type: 'danger',  icon: '!', label: '我的待办',         value: '6',      trend: '3 项加急',           trendDir: 'down' },
        { type: 'warning', icon: '◷', label: '进行中任务',       value: '4',      trend: '2 项我主负责',       trendDir: ''    },
        { type: 'primary', icon: '▣', label: '待提交材料',       value: '3',      trend: '本周截止',           trendDir: 'down' },
        { type: 'success', icon: '★', label: '本年绩效',         value: '94.6',   trend: 'A+ · 排名前 8%',     trendDir: 'up'  },
        { type: 'gold',    icon: '✓', label: '已结题',           value: '3',      trend: '优秀结题 1 项',      trendDir: 'up'  },
        { type: 'primary', icon: '📚', label: '主讲课程',         value: '4',      trend: '本学期学生 218 人',  trendDir: ''    }
      ]
    }
  };

  /* ============================================================
   * 各角色差异化的页面 KPI 数据
   * workspace / taskfund / performance / audit / teacher 按角色取不同数据
   * ============================================================ */
  var ROLE_KPIS = {
    workspace: {
      leader: [
        { type: 'danger',  icon: '!', label: '需督办任务',   value: '8',  trend: '3 项加急',        trendDir: 'down' },
        { type: 'warning', icon: '◷', label: '在办任务',     value: '286', trend: '本月新增 18',     trendDir: ''    },
        { type: 'primary', icon: '▣', label: '今日已审',      value: '7',  trend: '通过 6 / 驳回 1',  trendDir: 'up'  },
        { type: 'success', icon: '★', label: '本年度绩效',    value: 'A+', trend: '学院均值 91.4',    trendDir: 'up'  }
      ],
      director: [
        { type: 'danger',  icon: '!', label: '专业群督办',   value: '5',  trend: '2 项加急',        trendDir: 'down' },
        { type: 'warning', icon: '◷', label: '专业群在办',   value: '126', trend: '本月新增 9',      trendDir: ''    },
        { type: 'primary', icon: '▣', label: '本周已审',      value: '12', trend: '通过 11',          trendDir: 'up'  },
        { type: 'success', icon: '★', label: '专业群绩效',    value: 'A',  trend: '专业群均值 88.6',  trendDir: 'up'  }
      ],
      teacher: [
        { type: 'danger',  icon: '!', label: '我的待办',     value: '6',  trend: '3 项加急',         trendDir: 'down' },
        { type: 'warning', icon: '◷', label: '进行中任务',   value: '4',  trend: '2 项我主负责',     trendDir: ''    },
        { type: 'primary', icon: '▣', label: '待提交材料',   value: '3',  trend: '本周截止',         trendDir: 'down' },
        { type: 'success', icon: '★', label: '本年绩效',     value: '94.6', trend: 'A+ · 排名前 8%',   trendDir: 'up'  }
      ]
    },

    taskfund: {
      leader: [
        { type: 'primary', icon: '¥', label: '全院预算',   value: '3,318万', trend: '全年规划',         trendDir: ''   },
        { type: 'success', icon: '✓', label: '已执行',     value: '2,299万', trend: '执行率 69.3%',     trendDir: 'up' },
        { type: 'warning', icon: '⌛', label: '待执行',     value: '1,019万', trend: '剩余 30.7%',       trendDir: ''   },
        { type: 'gold',    icon: '⚠', label: '待报销',     value: '28',    trend: '¥126.5万 · 需关注', trendDir: ''   }
      ],
      director: [
        { type: 'primary', icon: '¥', label: '专业群预算', value: '1,195万', trend: '航空专业群',       trendDir: ''   },
        { type: 'success', icon: '✓', label: '已执行',     value: '866万',  trend: '执行率 72.4%',     trendDir: 'up' },
        { type: 'warning', icon: '⌛', label: '待执行',     value: '329万',  trend: '剩余 27.6%',       trendDir: ''   },
        { type: 'gold',    icon: '⚠', label: '待审批',     value: '12',    trend: '¥58 万',            trendDir: ''   }
      ],
      teacher: [
        { type: 'primary', icon: '¥', label: '我的项目经费', value: '82万',  trend: '3 个在研项目',     trendDir: ''   },
        { type: 'success', icon: '✓', label: '已使用',         value: '49.6万', trend: '执行率 60.5%',    trendDir: 'up' },
        { type: 'warning', icon: '⌛', label: '剩余',           value: '32.4万', trend: '剩余 39.5%',      trendDir: ''   },
        { type: 'gold',    icon: '▣', label: '待报销',         value: '2',      trend: '¥4.6 万',         trendDir: ''   }
      ]
    },

    performance: {
      leader: [
        { type: 'gold',    icon: '★', label: 'A+ 等级教师',   value: '12',  trend: '占比 7.9%',  trendDir: 'up' },
        { type: 'primary', icon: '',   label: 'A 等级',         value: '38',  trend: '占比 25.0%', trendDir: ''   },
        { type: 'success', icon: '',   label: 'B 等级',         value: '72',  trend: '占比 47.4%', trendDir: ''   },
        { type: 'warning', icon: '',   label: 'C 等级',         value: '30',  trend: '占比 19.7%', trendDir: ''   }
      ],
      director: [
        { type: 'gold',    icon: '★', label: '专业群 A+',     value: '4',   trend: '占比 12.5%', trendDir: 'up' },
        { type: 'primary', icon: '',   label: '专业群 A',       value: '9',   trend: '占比 28.1%', trendDir: ''   },
        { type: 'success', icon: '',   label: '专业群 B',       value: '14',  trend: '占比 43.8%', trendDir: ''   },
        { type: 'warning', icon: '',   label: '专业群 C',       value: '5',   trend: '占比 15.6%', trendDir: ''   }
      ],
      teacher: [
        { type: 'gold',    icon: '★', label: '本年绩效分',     value: '94.6', trend: 'A+ · 排名前 8%', trendDir: 'up' },
        { type: 'primary', icon: '',   label: '上年度',         value: '91.2', trend: 'A',          trendDir: 'up' },
        { type: 'success', icon: '✓', label: '教学任务完成',   value: '100%', trend: '4/4 课程',   trendDir: 'up' },
        { type: 'warning', icon: '!', label: '待填报绩效',     value: '1',    trend: '本周截止',   trendDir: ''   }
      ]
    },

    audit: {
      leader: [
        { type: 'success', icon: '✓', label: '本月通过',     value: '42',  trend: '通过率 93.3%', trendDir: 'up' },
        { type: 'warning', icon: '',   label: '待审',         value: '19',  trend: '平均 2.3 天',  trendDir: ''   },
        { type: 'danger',  icon: '',   label: '本月驳回',     value: '3',   trend: '需补充材料',   trendDir: ''   },
        { type: 'gold',    icon: '',   label: '年度审核',     value: '214', trend: '通过率 92.6%', trendDir: ''   }
      ],
      director: [
        { type: 'success', icon: '✓', label: '专业群通过',   value: '14',  trend: '通过率 91.7%', trendDir: 'up' },
        { type: 'warning', icon: '',   label: '待审',         value: '8',   trend: '平均 1.9 天',  trendDir: ''   },
        { type: 'danger',  icon: '',   label: '本月驳回',     value: '2',   trend: '1 项整改中',   trendDir: ''   },
        { type: 'gold',    icon: '',   label: '专业群年度',   value: '76',  trend: '通过率 90.8%', trendDir: ''   }
      ],
      teacher: [
        { type: 'success', icon: '✓', label: '我已通过',     value: '3',  trend: '优秀结题 1 项', trendDir: 'up' },
        { type: 'warning', icon: '◷', label: '我审核中',     value: '2',  trend: '平均 1.5 天',   trendDir: ''   },
        { type: 'danger',  icon: '!', label: '被打回',       value: '1',  trend: '修改重报',       trendDir: ''   },
        { type: 'gold',    icon: '★', label: '审核绩效',     value: 'A',  trend: '专家评价 92',   trendDir: 'up' }
      ]
    },

    teacher_page: {
      leader: [
        { type: 'primary', icon: '♟', label: '教师总数',     value: '152', trend: '在岗率 96.7%',          trendDir: ''   },
        { type: 'gold',    icon: '',   label: '博士学位',     value: '37',  trend: '占比 24.3%',            trendDir: ''   },
        { type: 'success', icon: '',   label: '双师型',       value: '86',  trend: '占比 56.6%',            trendDir: ''   },
        { type: 'warning', icon: '',   label: '企业兼职',     value: '28',  trend: '来自长安/比亚迪/中航',  trendDir: ''   }
      ],
      director: [
        { type: 'primary', icon: '♟', label: '专业群成员',   value: '32', trend: '含兼职 4',                trendDir: ''   },
        { type: 'gold',    icon: '',   label: '博士教师',     value: '14',  trend: '占比 43.8%',              trendDir: ''   },
        { type: 'success', icon: '',   label: '双师型',       value: '22',  trend: '占比 68.8%',              trendDir: ''   },
        { type: 'warning', icon: '',   label: '骨干教师',     value: '9',   trend: '专业带头人 3',            trendDir: ''   }
      ],
      teacher: [
        { type: 'gold',    icon: '★', label: '本年度绩效',   value: 'A+',  trend: '综合得分 94.6',    trendDir: 'up'  },
        { type: 'primary', icon: '📚', label: '主讲课程',     value: '4',  trend: '本学期学生 218',   trendDir: ''    },
        { type: 'success', icon: '🔬', label: '主持课题',     value: '3',  trend: '在研 2 项',         trendDir: ''    },
        { type: 'warning', icon: '📜', label: '成果',         value: '8',  trend: '论文 5 / 专利 3',   trendDir: 'up'  }
      ]
    }
  };

  /* ============================================================
   * 角色差异化的待办清单（workspace 页面"我的待办"卡片）
   * ============================================================ */
  var TODO_LIST = {
    leader: [
      { priority: 'high', icon: '!', title: '审核 SG2026-002 中期材料（航空发动机）',   meta: '截止 2026-10-15 · 剩余 2 天' },
      { priority: 'high', icon: '!', title: '审批 3 项预算调整申请',                    meta: '截止 2026-10-14 · 剩余 1 天' },
      { priority: 'warn', icon: '⌛', title: '参加学院双高建设月度推进会',              meta: '10-15 14:00 · 学院会议室' },
      { priority: 'normal', icon: '▤', title: '签署 SB2026-022 国家级技能大师工作室立项', meta: '截止 2026-10-20' },
      { priority: 'low', icon: '▣', title: '查看 9 月任务绩效自动汇总',                meta: '已生成' }
    ],
    director: [
      { priority: 'high', icon: '!', title: '审核专业群 SG2026-002 中期阶段材料',       meta: '剩余 2 天 · 责任 王建军' },
      { priority: 'high', icon: '!', title: '专业群 4 项月度评审分配',                   meta: '截止 2026-10-16' },
      { priority: 'warn', icon: '⌛', title: '参与院长办公会 · 双高周汇报',             meta: '10-15 14:00 · 学院会议室' },
      { priority: 'normal', icon: '▤', title: '专业群绩效模型校准（按市级新规）',     meta: '本周内完成' },
      { priority: 'low', icon: '▣', title: '审阅专业群 9 月任务执行月报',             meta: '已生成' }
    ],
    teacher: [
      { priority: 'high', icon: '!', title: '提交《新能源汽车概论》精品课程结题材料', meta: '本周五 17:00 前提交' },
      { priority: 'high', icon: '!', title: '《理论力学》课程建设节点填报',           meta: '明日 12:00 截止' },
      { priority: 'warn', icon: '⌛', title: '审核：过程性考核材料签字（4 个班级）',   meta: '本周内完成' },
      { priority: 'normal', icon: '▤', title: '申报下学期教研项目',                    meta: '截止 2026-10-22' },
      { priority: 'low', icon: '▣', title: '查看 9 月个人绩效自动汇总',              meta: '已生成' }
    ]
  };

  /* ============================================================
   * 角色差异化的"我的任务"（workspace 页面"我的任务"卡片）
   * ============================================================ */
  var MY_TASKS = {
    leader: [
      { name: '智能网联汽车高水平专业群建设',     role: '负责人', progress: 78, status: '进行中' },
      { name: '《理论力学》课程体系升级与资源建设', role: '负责人', progress: 82, status: '进行中' },
      { name: 'SG2026-002 航空智能制造专业群',   role: '协办',   progress: 62, status: '进行中' },
      { name: '9 月任务绩效自动汇总（学院）',     role: '负责人', progress: 100, status: '已完成' },
      { name: '学院双高月度推进会议组织',         role: '负责人', progress: 56, status: '进行中' },
      { name: '上级专项审计接待材料准备',         role: '协办',   progress: 36, status: '进行中' }
    ],
    director: [
      { name: '航空智能制造技术专业群建设（第二轮）', role: '负责人', progress: 78, status: '进行中' },
      { name: '《理论力学》课程体系升级',             role: '负责人', progress: 82, status: '进行中' },
      { name: '"双师型"教师培养与技能大师工作室',   role: '负责人', progress: 66, status: '已打回' },
      { name: '航空智能制造实训车间设备升级',         role: '协办',   progress: 63, status: '进行中' },
      { name: '中德职业学院共建与国际交流项目',     role: '负责人', progress: 74, status: '进行中' },
      { name: '市级产教融合实训基地申报',             role: '负责人', progress: 72, status: '进行中' }
    ],
    teacher: [
      { name: '《新能源汽车概论》精品课程结题',       role: '我主负责', progress: 90, status: '待审批' },
      { name: '《理论力学》课程建设节点填报',         role: '我主负责', progress: 82, status: '进行中' },
      { name: '过程性考核材料签字（4 个班级）',       role: '我主负责', progress: 35, status: '进行中' },
      { name: '新能源汽车专业教研项目申报',           role: '我主负责', progress: 45, status: '进行中' },
      { name: '校企合作"长安定向班"课程实施',         role: '协办',     progress: 100, status: '已完成' },
      { name: '课程思政教学案例（思政融合主题）',     role: '我主负责', progress: 60, status: '进行中' }
    ]
  };

  /* ============================================================
   * 通用渲染器
   * ============================================================ */
  function renderKpi(k) {
    var cls = k.trendDir ? ('kpi-trend ' + k.trendDir) : 'kpi-trend';
    return ''
      + '<div class="kpi ' + k.type + ' hover-lift">'
      +   (k.icon ? '<div class="kpi-icon">' + k.icon + '</div>' : '')
      +   '<div class="kpi-label">' + k.label + '</div>'
      +   '<div class="kpi-value">' + k.value + '</div>'
      +   '<div class="' + cls + '">' + k.trend + '</div>'
      + '</div>';
  }

  function progressBar(pct, status) {
    var cls = '';
    if (status === '已验收' || pct >= 80) cls = 'success';
    else if (status === '需关注' || (pct >= 50 && pct < 80)) cls = 'warning';
    else if (status === '逾期' || pct < 30) cls = 'danger';
    return '<div class="progress"><div class="progress-bar ' + cls + '" style="width:' + pct + '%"></div></div>';
  }

  /* ============================================================
   * 暴露给全局
   * ============================================================ */
  MOCK = {
    COLLEGE: COLLEGE,
    KPIS: KPIS,
    TASK_LIST: TASK_LIST,
    ROLES: ROLES,
    ROLE_KPIS: ROLE_KPIS,
    ALL_PAGES: ALL_PAGES,
    renderKpi: renderKpi,
    progressBar: progressBar,
    /**
     * 渲染指定页面的所有 KPI 卡片（自动从 KPIS 取数）
     * @param {string} pageKey - 'dashboard' / 'bigscreen' / ...
     * @returns {string} HTML 片段
     */
    renderPageKpis: function (pageKey) {
      var list = KPIS[pageKey] || [];
      return list.map(renderKpi).join('');
    },
    /**
     * 按角色渲染首页 KPI（dashboard）
     */
    renderDashboardKpis: function (roleCode) {
      var role = ROLES[roleCode];
      if (role && role.dashboardKpis) return role.dashboardKpis.map(renderKpi).join('');
      // 回退到默认 dashboard KPIs
      var fallback = KPIS.dashboard || [];
      return fallback.map(renderKpi).join('');
    },
    /**
     * 按角色渲染待办清单（workspace）
     */
    renderTodoList: function (roleCode) {
      var list = TODO_LIST[roleCode] || TODO_LIST.leader;
      return list.map(function (t) {
        var styleMap = { high: 'danger', warn: 'warning', normal: 'primary', low: 'success' };
        var style = styleMap[t.priority] || 'primary';
        var iconMap = { high: 'high', warn: 'normal', normal: 'normal', low: 'low' };
        var ic = iconMap[t.priority] || 'normal';
        return ''
          + '<div class="todo-item" style="border-color:var(--' + style + ');">'
          +   '<div class="todo-icon ' + ic + '">' + t.icon + '</div>'
          +   '<div style="flex:1;">'
          +     '<div class="todo-title">' + t.title + '</div>'
          +     '<div class="todo-meta">' + t.meta + '</div>'
          +   '</div>'
          +   '<button class="btn ' + (t.priority === 'high' ? '' : 'outline') + '" style="font-size:11px;padding:4px 10px;">'
          +     (t.priority === 'high' ? '去处理' : '查看') + '</button>'
          + '</div>';
      }).join('');
    },
    /**
     * 按角色渲染"我的任务"列表（workspace）
     */
    renderMyTasks: function (roleCode) {
      var list = MY_TASKS[roleCode] || MY_TASKS.leader;
      return list.map(function (t) {
        var statusCls = {
          '进行中': 'tag-primary',
          '已完成': 'tag-success',
          '待审批': 'tag-warning',
          '已打回': 'tag-danger'
        }[t.status] || 'tag-primary';
        var cls = t.progress >= 80 ? 'success' : (t.progress >= 50 ? 'warning' : 'danger');
        return ''
          + '<tr>'
          +   '<td style="font-weight:600;">' + t.name + '</td>'
          +   '<td><span class="tag ' + (t.role === '我主负责' || t.role === '负责人' ? 'tag-gold' : 'tag-primary') + '">' + t.role + '</span></td>'
          +   '<td><div class="progress"><div class="progress-bar ' + cls + '" style="width:' + t.progress + '%"></div></div></td>'
          +   '<td><span class="tag ' + statusCls + '">' + t.status + '</span></td>'
          + '</tr>';
      }).join('');
    },
    /**
     * 按角色渲染 KPI（角色差异化的页面：workspace/taskfund/performance/audit/teacher）
     */
    renderRoleKpis: function (pageKey, roleCode) {
      var set = ROLE_KPIS[pageKey];
      if (set && set[roleCode]) return set[roleCode].map(renderKpi).join('');
      // 回退到默认 KPIs
      var fallback = KPIS[pageKey] || [];
      return fallback.map(renderKpi).join('');
    }
  };

  // 同时挂到 window（兼容 DevTools / 测试代码）
  if (typeof window !== 'undefined') {
    window.MOCK = MOCK;
  }