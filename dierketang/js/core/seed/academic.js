/* ==========================================================================
   seed/academic.js —— 考核方案 / 学分类型 / 考核项目 / 成绩单模板
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU;

  function build() {
    var out = {};

    /* ---------- 考核方案 ---------- */
    out.schemes = [
      {
        id: 'SC001', name: '2026 级第二课堂成绩考核方案', enabled: true, isDefault: true,
        scope: { colleges: ['全部'], grades: ['2026级'], terms: ['2026-2027-1', '2026-2027-2'], objects: '全体学生' },
        creditTotal: 6,
        standard: { total: 6, pass: 6, excellent: 8, warnLine: 4.5 },
        catStandard: { 思想素养: 1.5, 文化素养: 1.5, 专业素养: 1.5, 创新创业: 0.5, 社会实践: 0.5, 社会工作: 0.5 },
        rules: {
          total: '各类别学分累加 ≥ 6.0 学分，且每一类别不得低于该类别达标线的 60%',
          creditType: '必修学分 + 选修学分（选修不少于 1.0 学分）',
          index: '每类活动按级别折算质量系数：校级 1.0 / 院级 0.8 / 班级 0.5',
          project: '单个项目最高认定 1.0 学分，超出部分不累计',
          merge: '同一活动重复申报只认定一次，取最高分值'
        },
        convert: { pointsPerCredit: 10, hoursPerCredit: 16 },
        grades: [
          { level: '优秀', min: 8, max: 999, point: 95 },
          { level: '良好', min: 7, max: 7.99, point: 85 },
          { level: '中等', min: 6, max: 6.99, point: 75 },
          { level: '合格', min: 5, max: 5.99, point: 65 },
          { level: '不合格', min: 0, max: 4.99, point: 50 }
        ],
        createdAt: '2026-08-26 10:12', createdBy: '陈立诚'
      },
      {
        id: 'SC002', name: '2025 级第二课堂学分认定方案（试行）', enabled: true, isDefault: false,
        scope: { colleges: ['信息工程学院', '智能制造学院'], grades: ['2025级'], terms: ['2025-2026-1', '2025-2026-2'], objects: '全体学生' },
        creditTotal: 5,
        standard: { total: 5, pass: 5, excellent: 7, warnLine: 3.5 },
        catStandard: { 思想素养: 1, 文化素养: 1, 专业素养: 1.5, 创新创业: 0.5, 社会实践: 0.5, 社会工作: 0.5 },
        rules: {
          total: '各类别学分累加 ≥ 5.0 学分',
          creditType: '必修学分 4.0 + 选修学分 1.0',
          index: '按活动级别加权（校级 1.0 / 院级 0.8）',
          project: '单个项目最高 0.8 学分',
          merge: '同一活动取最高分值认定'
        },
        convert: { pointsPerCredit: 10, hoursPerCredit: 16 },
        grades: [
          { level: '优秀', min: 7, max: 999, point: 95 },
          { level: '合格', min: 5, max: 6.99, point: 80 },
          { level: '不合格', min: 0, max: 4.99, point: 50 }
        ],
        createdAt: '2025-09-01 09:30', createdBy: '陈立诚'
      },
      {
        id: 'SC003', name: '2024 级毕业年级学分清算方案', enabled: false, isDefault: false,
        scope: { colleges: ['全部'], grades: ['2024级'], terms: ['2024-2025-1', '2024-2025-2', '2025-2026-1', '2025-2026-2'], objects: '全体学生' },
        creditTotal: 6,
        standard: { total: 6, pass: 6, excellent: 8, warnLine: 5 },
        catStandard: { 思想素养: 1.5, 文化素养: 1.5, 专业素养: 1.5, 创新创业: 0.5, 社会实践: 0.5, 社会工作: 0.5 },
        rules: {
          total: '毕业前各类别学分累加 ≥ 6.0 学分',
          creditType: '必修 + 选修', index: '不加权',
          project: '单个项目最高 1.0 学分', merge: '同一活动取最高分值认定'
        },
        convert: { pointsPerCredit: 10, hoursPerCredit: 16 },
        grades: [{ level: '通过', min: 6, max: 999, point: 85 }, { level: '不通过', min: 0, max: 5.99, point: 50 }],
        createdAt: '2024-09-02 14:05', createdBy: '陈立诚'
      }
    ];

    /* ---------- 学分类型 / 单位 / 考核项目 ---------- */
    out.creditTypes = [
      { id: 'CT1', name: '必修学分', code: 'BX', unit: '学分', max: 5, desc: '六大类活动取得的规定学分' },
      { id: 'CT2', name: '选修学分', code: 'XX', unit: '学分', max: 2, desc: '超出规定类别以外的拓展学分' },
      { id: 'CT3', name: '认定学分', code: 'RD', unit: '学分', max: 3, desc: '竞赛获奖、荣誉奖励折算学分' }
    ];
    out.creditUnits = [
      { id: 'CU1', name: '学分', symbol: '学分', dec: 2, base: 1 },
      { id: 'CU2', name: '积分', symbol: '分', dec: 0, base: 10 },
      { id: 'CU3', name: '学时', symbol: '学时', dec: 0, base: 16 }
    ];
    out.creditProjects = [
      { id: 'CP1', name: '思想政治素养提升', cat: '思想素养', ref: 1.5, level: 1, parent: '' },
      { id: 'CP2', name: '主题教育活动参与', cat: '思想素养', ref: 0.5, level: 2, parent: 'CP1' },
      { id: 'CP3', name: '理论宣讲与宣讲团', cat: '思想素养', ref: 1, level: 2, parent: 'CP1' },
      { id: 'CP4', name: '文化素养与艺术实践', cat: '文化素养', ref: 1.5, level: 1, parent: '' },
      { id: 'CP5', name: '文艺展演与竞赛', cat: '文化素养', ref: 1, level: 2, parent: 'CP4' },
      { id: 'CP6', name: '中华经典文化传承', cat: '文化素养', ref: 0.5, level: 2, parent: 'CP4' },
      { id: 'CP7', name: '专业技能与学科竞赛', cat: '专业素养', ref: 1.5, level: 1, parent: '' },
      { id: 'CP8', name: '职业技能竞赛获奖', cat: '专业素养', ref: 1.5, level: 2, parent: 'CP7' },
      { id: 'CP9', name: '行业实践与研学', cat: '专业素养', ref: 0.5, level: 2, parent: 'CP7' },
      { id: 'CP10', name: '创新创业实践', cat: '创新创业', ref: 0.5, level: 1, parent: '' },
      { id: 'CP11', name: '双创赛事与项目立项', cat: '创新创业', ref: 0.5, level: 2, parent: 'CP10' },
      { id: 'CP12', name: '社会实践与志愿服务', cat: '社会实践', ref: 0.5, level: 1, parent: '' },
      { id: 'CP13', name: '社区实践与志愿时长', cat: '社会实践', ref: 0.5, level: 2, parent: 'CP12' },
      { id: 'CP14', name: '社会工作与履职', cat: '社会工作', ref: 0.5, level: 1, parent: '' },
      { id: 'CP15', name: '学生干部履职锻炼', cat: '社会工作', ref: 0.5, level: 2, parent: 'CP14' }
    ];

    /* ---------- 成绩单模板 ---------- */
    out.tpls = [
      {
        id: 'TP1', name: '标准成绩单 · 蓝（官方版式）', theme: 'theme-default', enabled: true, ver: 'v3',
        updatedAt: '2026-09-18 15:40', updatedBy: '陈立诚',
        fields: ['活动名称', '活动分类', '主办单位', '开展时间', '认定学分', '认定学时', '认定积分', '认定状态'],
        dims: ['按学年汇总', '按活动分类统计', '按学期明细'],
        seal: '重庆示范职业学院第二课堂成绩单认定专用章', logo: '二课', sign: '教务处（第二课堂管理中心）',
        showStamp: true, showSign: true, watermark: '第二课堂成绩单', paper: 'A4 纵向'
      },
      {
        id: 'TP2', name: '深色科技风 · 数据型', theme: 'theme-dark', enabled: true, ver: 'v1',
        updatedAt: '2026-09-15 11:02', updatedBy: '陈立诚',
        fields: ['活动名称', '活动分类', '认定学分', '认定学时', '认定积分'],
        dims: ['按活动分类统计', '按学期明细'],
        seal: '', logo: '二课', sign: '', showStamp: false, showSign: false, watermark: '', paper: 'A4 横向'
      },
      {
        id: 'TP3', name: '绿色清新 · 精简版', theme: 'theme-green', enabled: true, ver: 'v2',
        updatedAt: '2026-09-11 09:26', updatedBy: '陈立诚',
        fields: ['活动名称', '活动分类', '开展时间', '认定学分'],
        dims: ['按学年汇总'],
        seal: '重庆示范职业学院教务处', logo: '二课', sign: '', showStamp: true, showSign: false,
        watermark: '', paper: 'A4 纵向'
      },
      {
        id: 'TP4', name: '靛紫 · 指标考核版', theme: 'theme-indigo', enabled: true, ver: 'v1',
        updatedAt: '2026-09-08 16:55', updatedBy: '陈立诚',
        fields: ['活动名称', '活动分类', '认定学分', '认定学时', '认定积分', '认定状态'],
        dims: ['按活动分类统计'],
        seal: '', logo: '二课', sign: '', showStamp: false, showSign: false, watermark: '仅用于校内考核', paper: 'A4 纵向'
      },
      {
        id: 'TP5', name: '暖金 · 荣誉展示版', theme: 'theme-amber', enabled: false, ver: 'v1',
        updatedAt: '2026-08-30 10:18', updatedBy: '陈立诚',
        fields: ['活动名称', '主办单位', '开展时间', '认定学分'],
        dims: ['按学年汇总', '按活动分类统计'],
        seal: '重庆示范职业学院团委', logo: '二课', sign: '', showStamp: true, showSign: false,
        watermark: '', paper: 'A4 横向'
      }
    ];

    return out;
  }

  w.ZSEED_ACADEMIC = { build: build };
})(window);
