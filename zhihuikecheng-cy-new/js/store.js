/* ============================================
   数据存储层 - localStorage 模拟后端
   ============================================ */

const Store = {
  // 初始化演示数据
  init() {
    if (!localStorage.getItem('app_initialized_v2')) {
      this.seedData();
      localStorage.setItem('app_initialized_v2', '1');
    }
  },

  seedData() {
    // 课程数据
    const courses = [
      { id: 1, name: '人体解剖学', code: 'MED101', teacher: '张教授', college: '基础医学院', students: 186, progress: 78, status: '进行中', chapters: 12, resources: 45, createdAt: '2025-09-01' },
      { id: 2, name: '病理生理学', code: 'MED102', teacher: '李教授', college: '基础医学院', students: 152, progress: 65, status: '进行中', chapters: 10, resources: 38, createdAt: '2025-09-01' },
      { id: 3, name: '临床诊断学', code: 'MED201', teacher: '王教授', college: '临床医学院', students: 134, progress: 90, status: '进行中', chapters: 14, resources: 52, createdAt: '2025-09-01' },
      { id: 4, name: '内科学', code: 'MED301', teacher: '赵教授', college: '临床医学院', students: 168, progress: 72, status: '进行中', chapters: 16, resources: 60, createdAt: '2025-09-01' },
      { id: 5, name: '外科学', code: 'MED302', teacher: '陈教授', college: '临床医学院', students: 145, progress: 80, status: '进行中', chapters: 15, resources: 55, createdAt: '2025-09-01' },
      { id: 6, name: '药理学', code: 'MED401', teacher: '刘教授', college: '药学院', students: 178, progress: 68, status: '进行中', chapters: 11, resources: 42, createdAt: '2025-09-01' },
      { id: 7, name: '医学影像学', code: 'MED501', teacher: '周教授', college: '医学影像学院', students: 98, progress: 85, status: '进行中', chapters: 9, resources: 35, createdAt: '2025-09-01' },
      { id: 8, name: '免疫学', code: 'MED103', teacher: '吴教授', college: '基础医学院', students: 156, progress: 60, status: '进行中', chapters: 8, resources: 30, createdAt: '2025-09-01' },
      { id: 9, name: '医学统计学', code: 'MED601', teacher: '郑教授', college: '公共卫生学院', students: 142, progress: 55, status: '进行中', chapters: 7, resources: 28, createdAt: '2025-09-01' },
      { id: 10, name: '医学伦理学', code: 'MED701', teacher: '孙教授', college: '人文医学院', students: 200, progress: 92, status: '进行中', chapters: 6, resources: 25, createdAt: '2025-09-01' },
      { id: 11, name: '神经病学', code: 'MED303', teacher: '马教授', college: '临床医学院', students: 112, progress: 45, status: '进行中', chapters: 12, resources: 40, createdAt: '2025-09-01' },
      { id: 12, name: '妇产科学', code: 'MED304', teacher: '朱教授', college: '临床医学院', students: 130, progress: 70, status: '进行中', chapters: 13, resources: 48, createdAt: '2025-09-01' },
      { id: 13, name: '儿科学', code: 'MED305', teacher: '胡教授', college: '临床医学院', students: 125, progress: 75, status: '进行中', chapters: 11, resources: 44, createdAt: '2025-09-01' },
      { id: 14, name: '传染病学', code: 'MED306', teacher: '林教授', college: '临床医学院', students: 140, progress: 62, status: '进行中', chapters: 10, resources: 36, createdAt: '2025-09-01' },
      { id: 15, name: '康复医学', code: 'MED801', teacher: '何教授', college: '康复医学院', students: 108, progress: 50, status: '进行中', chapters: 8, resources: 32, createdAt: '2025-09-01' },
    ];
    localStorage.setItem('courses', JSON.stringify(courses));

    // 知识图谱知识点 — 70+ 知识点模拟人体结构，精确坐标布局
    const knowledgePoints = [
      // ===== Level 1: 根节点 =====
      { id: 1, courseId: 1, name: '人体解剖学', parentId: null, level: 1, system: 'root', tags: ['核心'], category: '概念性', mastered: 85, completed: 92, x: 450, y: 10 },

      // ===== Level 2: 十大系统 =====
      { id: 2,  courseId: 1, name: '骨骼系统', parentId: 1, level: 2, system: 'bone', tags: ['重点', '难点'], category: '事实性', mastered: 78, completed: 88, x: 450, y: 55 },
      { id: 3,  courseId: 1, name: '肌肉系统', parentId: 1, level: 2, system: 'muscle', tags: ['重点'], category: '事实性', mastered: 82, completed: 90, x: 450, y: 55 },
      { id: 4,  courseId: 1, name: '神经系统', parentId: 1, level: 2, system: 'nerve', tags: ['重点', '难点'], category: '概念性', mastered: 70, completed: 80, x: 450, y: 55 },
      { id: 5,  courseId: 1, name: '循环系统', parentId: 1, level: 2, system: 'heart', tags: ['重点'], category: '事实性', mastered: 88, completed: 95, x: 450, y: 55 },
      { id: 6,  courseId: 1, name: '呼吸系统', parentId: 1, level: 2, system: 'lung', tags: [], category: '事实性', mastered: 76, completed: 82, x: 450, y: 55 },
      { id: 7,  courseId: 1, name: '消化系统', parentId: 1, level: 2, system: 'stomach', tags: ['重点'], category: '事实性', mastered: 80, completed: 86, x: 450, y: 55 },
      { id: 8,  courseId: 1, name: '泌尿系统', parentId: 1, level: 2, system: 'kidney', tags: [], category: '事实性', mastered: 72, completed: 78, x: 450, y: 55 },
      { id: 9,  courseId: 1, name: '内分泌系统', parentId: 1, level: 2, system: 'endocrine', tags: [], category: '概念性', mastered: 64, completed: 70, x: 450, y: 55 },
      { id: 10, courseId: 1, name: '生殖系统', parentId: 1, level: 2, system: 'urogenital', tags: [], category: '事实性', mastered: 68, completed: 74, x: 450, y: 55 },
      { id: 11, courseId: 1, name: '感觉系统', parentId: 1, level: 2, system: 'eye', tags: [], category: '概念性', mastered: 74, completed: 80, x: 450, y: 55 },

      // ===== Level 3: 头部 (Head) =====
      { id: 12, courseId: 1, name: '颅骨', parentId: 2, level: 3, system: 'bone', tags: ['难点'], category: '事实性', mastered: 65, completed: 75, x: 450, y: 120 },
      { id: 13, courseId: 1, name: '大脑皮质', parentId: 4, level: 3, system: 'nerve', tags: ['重点', '难点', '课程思政'], category: '概念性', mastered: 60, completed: 72, x: 450, y: 140 },
      { id: 14, courseId: 1, name: '小脑', parentId: 4, level: 3, system: 'nerve', tags: [], category: '概念性', mastered: 68, completed: 76, x: 450, y: 160 },
      { id: 15, courseId: 1, name: '脑干', parentId: 4, level: 3, system: 'nerve', tags: ['重点'], category: '概念性', mastered: 62, completed: 70, x: 450, y: 180 },
      { id: 16, courseId: 1, name: '左眼球', parentId: 11, level: 3, system: 'eye', tags: [], category: '事实性', mastered: 80, completed: 86, x: 395, y: 90 },
      { id: 17, courseId: 1, name: '右眼球', parentId: 11, level: 3, system: 'eye', tags: [], category: '事实性', mastered: 82, completed: 88, x: 505, y: 90 },
      { id: 18, courseId: 1, name: '内耳/前庭', parentId: 11, level: 3, system: 'eye', tags: [], category: '事实性', mastered: 72, completed: 78, x: 380, y: 115 },
      { id: 19, courseId: 1, name: '鼻腔/鼻窦', parentId: 6, level: 3, system: 'lung', tags: [], category: '事实性', mastered: 76, completed: 82, x: 450, y: 100 },
      { id: 20, courseId: 1, name: '垂体', parentId: 9, level: 3, system: 'endocrine', tags: [], category: '概念性', mastered: 58, completed: 66, x: 450, y: 125 },
      { id: 21, courseId: 1, name: '面部骨骼', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 78, completed: 84, x: 450, y: 105 },

      // ===== Level 3: 颈部 (Neck) =====
      { id: 22, courseId: 1, name: '颈椎（C1-C7）', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 80, completed: 90, x: 450, y: 205 },
      { id: 23, courseId: 1, name: '气管', parentId: 6, level: 3, system: 'lung', tags: [], category: '事实性', mastered: 74, completed: 80, x: 440, y: 230 },
      { id: 24, courseId: 1, name: '食管', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 72, completed: 78, x: 460, y: 230 },
      { id: 25, courseId: 1, name: '甲状腺', parentId: 9, level: 3, system: 'endocrine', tags: ['重点'], category: '概念性', mastered: 70, completed: 76, x: 430, y: 215 },

      // ===== Level 3: 肩胸 (Shoulders & Upper Thorax) =====
      { id: 26, courseId: 1, name: '左锁骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 82, completed: 88, x: 360, y: 245 },
      { id: 27, courseId: 1, name: '右锁骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 84, completed: 90, x: 540, y: 245 },
      { id: 28, courseId: 1, name: '左肩胛骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 78, completed: 84, x: 330, y: 260 },
      { id: 29, courseId: 1, name: '右肩胛骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 80, completed: 86, x: 570, y: 260 },
      { id: 30, courseId: 1, name: '胸骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 84, completed: 90, x: 450, y: 270 },

      // ===== Level 3: 胸腔 (Thorax) =====
      { id: 31, courseId: 1, name: '肋骨与胸廓', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 80, completed: 86, x: 450, y: 295 },
      { id: 32, courseId: 1, name: '胸椎（T1-T12）', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 82, completed: 88, x: 450, y: 320 },
      { id: 33, courseId: 1, name: '左肺', parentId: 6, level: 3, system: 'lung', tags: [], category: '事实性', mastered: 76, completed: 82, x: 385, y: 310 },
      { id: 34, courseId: 1, name: '右肺', parentId: 6, level: 3, system: 'lung', tags: [], category: '事实性', mastered: 78, completed: 84, x: 515, y: 310 },
      { id: 35, courseId: 1, name: '心脏', parentId: 5, level: 3, system: 'heart', tags: ['重点', '核心'], category: '事实性', mastered: 90, completed: 96, x: 450, y: 345 },
      { id: 36, courseId: 1, name: '主动脉', parentId: 5, level: 3, system: 'heart', tags: ['重点'], category: '事实性', mastered: 86, completed: 92, x: 450, y: 370 },
      { id: 37, courseId: 1, name: '上腔静脉', parentId: 5, level: 3, system: 'heart', tags: [], category: '事实性', mastered: 82, completed: 88, x: 470, y: 365 },
      { id: 38, courseId: 1, name: '膈肌', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 74, completed: 80, x: 450, y: 395 },

      // ===== Level 3: 上腹 (Upper Abdomen) =====
      { id: 39, courseId: 1, name: '胃', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 82, completed: 88, x: 410, y: 420 },
      { id: 40, courseId: 1, name: '肝脏', parentId: 7, level: 3, system: 'stomach', tags: ['重点'], category: '事实性', mastered: 80, completed: 86, x: 480, y: 415 },
      { id: 41, courseId: 1, name: '胆囊', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 70, completed: 76, x: 495, y: 430 },
      { id: 42, courseId: 1, name: '脾脏', parentId: 5, level: 3, system: 'heart', tags: [], category: '事实性', mastered: 74, completed: 80, x: 380, y: 425 },
      { id: 43, courseId: 1, name: '胰腺', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 68, completed: 74, x: 450, y: 445 },
      { id: 44, courseId: 1, name: '十二指肠', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 72, completed: 78, x: 420, y: 465 },

      // ===== Level 3: 下腹 (Lower Abdomen) =====
      { id: 45, courseId: 1, name: '小肠', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 76, completed: 82, x: 450, y: 490 },
      { id: 46, courseId: 1, name: '大肠/结肠', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 74, completed: 80, x: 450, y: 515 },
      { id: 47, courseId: 1, name: '阑尾与盲肠', parentId: 7, level: 3, system: 'stomach', tags: [], category: '事实性', mastered: 70, completed: 76, x: 480, y: 525 },
      { id: 48, courseId: 1, name: '左肾', parentId: 8, level: 3, system: 'kidney', tags: [], category: '事实性', mastered: 72, completed: 78, x: 380, y: 470 },
      { id: 49, courseId: 1, name: '右肾', parentId: 8, level: 3, system: 'kidney', tags: [], category: '事实性', mastered: 74, completed: 80, x: 520, y: 470 },
      { id: 50, courseId: 1, name: '左肾上腺', parentId: 9, level: 3, system: 'endocrine', tags: [], category: '概念性', mastered: 60, completed: 68, x: 370, y: 455 },
      { id: 51, courseId: 1, name: '右肾上腺', parentId: 9, level: 3, system: 'endocrine', tags: [], category: '概念性', mastered: 62, completed: 70, x: 530, y: 455 },

      // ===== Level 3: 盆部 (Pelvis) =====
      { id: 52, courseId: 1, name: '腰椎（L1-L5）', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 78, completed: 84, x: 450, y: 540 },
      { id: 53, courseId: 1, name: '骶骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 74, completed: 80, x: 450, y: 565 },
      { id: 54, courseId: 1, name: '骨盆', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 76, completed: 82, x: 450, y: 590 },
      { id: 55, courseId: 1, name: '膀胱', parentId: 8, level: 3, system: 'kidney', tags: [], category: '事实性', mastered: 70, completed: 76, x: 450, y: 610 },
      { id: 56, courseId: 1, name: '左输尿管', parentId: 8, level: 3, system: 'kidney', tags: [], category: '事实性', mastered: 66, completed: 72, x: 400, y: 500 },
      { id: 57, courseId: 1, name: '右输尿管', parentId: 8, level: 3, system: 'kidney', tags: [], category: '事实性', mastered: 68, completed: 74, x: 500, y: 500 },
      { id: 58, courseId: 1, name: '卵巢', parentId: 10, level: 3, system: 'urogenital', tags: [], category: '事实性', mastered: 66, completed: 72, x: 410, y: 575 },

      // ===== Level 3: 神经系统核心 =====
      { id: 59, courseId: 1, name: '脊髓', parentId: 4, level: 3, system: 'nerve', tags: ['重点', '课程思政'], category: '概念性', mastered: 66, completed: 72, x: 450, y: 400 },
      { id: 60, courseId: 1, name: '周围神经', parentId: 4, level: 3, system: 'nerve', tags: [], category: '概念性', mastered: 75, completed: 85, x: 450, y: 440 },
      { id: 61, courseId: 1, name: '自主神经', parentId: 4, level: 3, system: 'nerve', tags: [], category: '概念性', mastered: 62, completed: 70, x: 450, y: 480 },

      // ===== Level 3: 循环系统补充 =====
      { id: 62, courseId: 1, name: '动脉系统', parentId: 5, level: 3, system: 'heart', tags: [], category: '事实性', mastered: 85, completed: 92, x: 450, y: 350 },
      { id: 63, courseId: 1, name: '静脉系统', parentId: 5, level: 3, system: 'heart', tags: [], category: '事实性', mastered: 82, completed: 88, x: 450, y: 380 },
      { id: 64, courseId: 1, name: '毛细血管', parentId: 5, level: 3, system: 'heart', tags: [], category: '事实性', mastered: 78, completed: 84, x: 450, y: 410 },

      // ===== Level 3: 左上肢 (Left Upper Limb) =====
      { id: 65, courseId: 1, name: '左肱骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 84, completed: 90, x: 285, y: 290 },
      { id: 66, courseId: 1, name: '左尺骨与桡骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 80, completed: 86, x: 255, y: 360 },
      { id: 67, courseId: 1, name: '左腕骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 76, completed: 82, x: 235, y: 420 },
      { id: 68, courseId: 1, name: '左手骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 78, completed: 84, x: 215, y: 470 },
      { id: 69, courseId: 1, name: '左肱二头肌', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 85, completed: 88, x: 310, y: 295 },
      { id: 70, courseId: 1, name: '左肱三头肌', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 82, completed: 86, x: 265, y: 300 },
      { id: 71, courseId: 1, name: '左前臂屈肌群', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 80, completed: 84, x: 280, y: 365 },
      { id: 72, courseId: 1, name: '左前臂伸肌群', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 78, completed: 82, x: 240, y: 370 },

      // ===== Level 3: 右上肢 (Right Upper Limb) =====
      { id: 73, courseId: 1, name: '右肱骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 86, completed: 92, x: 615, y: 290 },
      { id: 74, courseId: 1, name: '右尺骨与桡骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 82, completed: 88, x: 645, y: 360 },
      { id: 75, courseId: 1, name: '右腕骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 78, completed: 84, x: 665, y: 420 },
      { id: 76, courseId: 1, name: '右手骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 80, completed: 86, x: 685, y: 470 },
      { id: 77, courseId: 1, name: '右肱二头肌', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 86, completed: 90, x: 590, y: 295 },
      { id: 78, courseId: 1, name: '右肱三头肌', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 84, completed: 88, x: 635, y: 300 },
      { id: 79, courseId: 1, name: '右前臂屈肌群', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 82, completed: 86, x: 620, y: 365 },
      { id: 80, courseId: 1, name: '右前臂伸肌群', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 80, completed: 84, x: 660, y: 370 },

      // ===== Level 3: 左下肢 (Left Lower Limb) =====
      { id: 81, courseId: 1, name: '左股骨', parentId: 2, level: 3, system: 'bone', tags: ['重点'], category: '事实性', mastered: 82, completed: 88, x: 390, y: 640 },
      { id: 82, courseId: 1, name: '左膝关节', parentId: 2, level: 3, system: 'bone', tags: ['难点'], category: '事实性', mastered: 68, completed: 74, x: 390, y: 680 },
      { id: 83, courseId: 1, name: '左胫骨与腓骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 76, completed: 82, x: 390, y: 710 },
      { id: 84, courseId: 1, name: '左踝关节', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 72, completed: 78, x: 390, y: 745 },
      { id: 85, courseId: 1, name: '左足骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 74, completed: 80, x: 390, y: 775 },
      { id: 86, courseId: 1, name: '左股四头肌', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 80, completed: 84, x: 370, y: 650 },
      { id: 87, courseId: 1, name: '左小腿肌群', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 78, completed: 82, x: 370, y: 720 },

      // ===== Level 3: 右下肢 (Right Lower Limb) =====
      { id: 88, courseId: 1, name: '右股骨', parentId: 2, level: 3, system: 'bone', tags: ['重点'], category: '事实性', mastered: 84, completed: 90, x: 510, y: 640 },
      { id: 89, courseId: 1, name: '右膝关节', parentId: 2, level: 3, system: 'bone', tags: ['难点'], category: '事实性', mastered: 70, completed: 76, x: 510, y: 680 },
      { id: 90, courseId: 1, name: '右胫骨与腓骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 78, completed: 84, x: 510, y: 710 },
      { id: 91, courseId: 1, name: '右踝关节', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 74, completed: 80, x: 510, y: 745 },
      { id: 92, courseId: 1, name: '右足骨', parentId: 2, level: 3, system: 'bone', tags: [], category: '事实性', mastered: 76, completed: 82, x: 510, y: 775 },
      { id: 93, courseId: 1, name: '右股四头肌', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 82, completed: 86, x: 530, y: 650 },
      { id: 94, courseId: 1, name: '右小腿肌群', parentId: 3, level: 3, system: 'muscle', tags: [], category: '事实性', mastered: 80, completed: 84, x: 530, y: 720 },
    ];
    localStorage.setItem('knowledgePoints', JSON.stringify(knowledgePoints));

    // 学习任务
    const tasks = [
      { id: 1, courseId: 1, courseName: '人体解剖学', title: '骨骼系统学习任务', desc: '完成骨骼系统相关知识点的学习与自测', type: '必修', deadline: '2026-09-15', progress: 75, status: '进行中', items: [
        { id: 101, name: '骨骼系统概述', type: '视频', completed: true, unlocked: true },
        { id: 102, name: '颅骨结构详解', type: '视频', completed: true, unlocked: true },
        { id: 103, name: '脊柱与胸廓', type: '文档', completed: false, unlocked: true },
        { id: 104, name: '骨骼系统自测', type: '测验', completed: false, unlocked: false },
      ]},
      { id: 2, courseId: 1, courseName: '人体解剖学', title: '肌肉系统学习任务', desc: '掌握肌肉系统分类与功能', type: '必修', deadline: '2026-09-20', progress: 40, status: '进行中', items: [
        { id: 201, name: '肌肉组织概述', type: '视频', completed: true, unlocked: true },
        { id: 202, name: '骨骼肌结构', type: '视频', completed: true, unlocked: true },
        { id: 203, name: '肌肉收缩机制', type: '文档', completed: false, unlocked: true },
        { id: 204, name: '肌肉系统自测', type: '测验', completed: false, unlocked: false },
      ]},
      { id: 3, courseId: 2, courseName: '病理生理学', title: '疾病发生机制', desc: '理解疾病发生发展基本机制', type: '必修', deadline: '2026-09-18', progress: 60, status: '进行中', items: [
        { id: 301, name: '疾病概论', type: '视频', completed: true, unlocked: true },
        { id: 302, name: '水电解质紊乱', type: '视频', completed: true, unlocked: true },
        { id: 303, name: '酸碱平衡', type: '文档', completed: false, unlocked: false },
      ]},
      { id: 4, courseId: 3, courseName: '临床诊断学', title: '体格检查方法', desc: '系统学习体格检查基本方法', type: '必修', deadline: '2026-09-22', progress: 100, status: '已完成', items: [
        { id: 401, name: '视诊方法', type: '视频', completed: true, unlocked: true },
        { id: 402, name: '触诊方法', type: '视频', completed: true, unlocked: true },
        { id: 403, name: '叩诊方法', type: '视频', completed: true, unlocked: true },
        { id: 404, name: '综合测试', type: '测验', completed: true, unlocked: true },
      ]},
      { id: 5, courseId: 4, courseName: '内科学', title: '心血管疾病', desc: '学习心血管系统常见疾病', type: '选修', deadline: '2026-10-01', progress: 25, status: '进行中', items: [
        { id: 501, name: '冠心病概述', type: '视频', completed: true, unlocked: true },
        { id: 502, name: '高血压诊疗', type: '视频', completed: false, unlocked: true },
        { id: 503, name: '心衰管理', type: '文档', completed: false, unlocked: false },
      ]},
    ];
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // 学情数据
    const classStats = {
      courseId: 1,
      courseName: '人体解剖学',
      totalStudents: 186,
      avgScore: 82.5,
      avgCompletion: 78.3,
      avgMastery: 75.1,
      videoCompletion: 85.2,
      homeworkCompletion: 72.8,
      examAvgScore: 81.3,
      participationRate: 68.5,
      distribution: [
        { range: '90-100', count: 35 },
        { range: '80-89', count: 58 },
        { range: '70-79', count: 47 },
        { range: '60-69', count: 28 },
        { range: '<60', count: 18 },
      ],
      students: [
        { id: 1, name: '李明', studentId: '202501001', score: 92, completion: 95, mastery: 90, participation: 18, status: '优秀' },
        { id: 2, name: '王芳', studentId: '202501002', score: 88, completion: 90, mastery: 85, participation: 15, status: '良好' },
        { id: 3, name: '张伟', studentId: '202501003', score: 75, completion: 78, mastery: 72, participation: 12, status: '中等' },
        { id: 4, name: '刘洋', studentId: '202501004', score: 62, completion: 65, mastery: 60, participation: 8, status: '待提升' },
        { id: 5, name: '陈静', studentId: '202501005', score: 55, completion: 50, mastery: 48, participation: 5, status: '待提升' },
        { id: 6, name: '赵强', studentId: '202501006', score: 95, completion: 98, mastery: 94, participation: 20, status: '优秀' },
        { id: 7, name: '孙丽', studentId: '202501007', score: 80, completion: 82, mastery: 78, participation: 14, status: '良好' },
        { id: 8, name: '周杰', studentId: '202501008', score: 58, completion: 55, mastery: 50, participation: 4, status: '待提升' },
      ],
    };
    localStorage.setItem('classStats_1', JSON.stringify(classStats));

    // 安全审核配置
    const securityConfig = {
      keywords: ['违规', '敏感', '不当', '禁止', '非法'],
      ignoreWords: ['通知', '公告', '说明'],
      blacklist: ['user_black_001', 'user_black_002'],
      whitelist: ['user_admin_001', 'user_teacher_001'],
      imageBlacklist: ['img_hash_001'],
      spamStats: { total: 1245, spam: 23, rate: 1.85 },
    };
    localStorage.setItem('securityConfig', JSON.stringify(securityConfig));

    // 审核记录
    const reviewRecords = [
      { id: 1, type: '文本', content: '关于课程考核方式的通知', result: '通过', time: '2026-08-10 14:30', reviewer: '系统' },
      { id: 2, type: '图片', content: '解剖学教学图片_001.jpg', result: '通过', time: '2026-08-10 13:20', reviewer: '系统' },
      { id: 3, type: '文档', content: '病理学实验报告.docx', result: '通过', time: '2026-08-10 11:15', reviewer: '系统' },
      { id: 4, type: '课程', content: '临床诊断学课程资源包', result: '待审核', time: '2026-08-10 10:00', reviewer: '-' },
      { id: 5, type: '文本', content: '学生论坛讨论内容片段', result: '拦截', time: '2026-08-09 16:45', reviewer: '系统', reason: '含敏感词' },
      { id: 6, type: '图片', content: '学生上传头像_042.png', result: '拦截', time: '2026-08-09 15:30', reviewer: '系统', reason: '图片违规' },
    ];
    localStorage.setItem('reviewRecords', JSON.stringify(reviewRecords));

    // 数字人数据
    const digitalHumans = [
      { id: 1, name: '张教授数字人', teacher: '张教授', course: '人体解剖学', status: '已上线', voice: '标准普通话', languages: ['中文', '英语'], createdAt: '2025-10-15' },
      { id: 2, name: '李教授数字人', teacher: '李教授', course: '病理生理学', status: '训练中', voice: '真人定制', languages: ['中文', '日语'], createdAt: '2025-11-01' },
      { id: 3, name: '王教授数字人', teacher: '王教授', course: '临床诊断学', status: '已上线', voice: '标准普通话', languages: ['中文', '英语', '四川话'], createdAt: '2025-10-20' },
    ];
    localStorage.setItem('digitalHumans', JSON.stringify(digitalHumans));

    // 视频资源
    const videos = [
      { id: 1, courseId: 1, courseName: '人体解剖学', title: '骨骼系统概述', duration: 480, size: '256MB', format: 'MP4', resolution: '1920×1080', status: '已完成', createdAt: '2025-10-10' },
      { id: 2, courseId: 1, courseName: '人体解剖学', title: '颅骨结构详解', duration: 720, size: '380MB', format: 'MP4', resolution: '1920×1080', status: '已完成', createdAt: '2025-10-12' },
      { id: 3, courseId: 2, courseName: '病理生理学', title: '疾病发生机制', duration: 600, size: '320MB', format: 'MP4', resolution: '1920×1080', status: '制作中', createdAt: '2025-10-15' },
      { id: 4, courseId: 3, courseName: '临床诊断学', title: '体格检查方法', duration: 540, size: '290MB', format: 'MP4', resolution: '1920×1080', status: '已完成', createdAt: '2025-10-08' },
      { id: 5, courseId: 4, courseName: '内科学', title: '心血管疾病诊治', duration: 900, size: '480MB', format: 'MP4', resolution: '1920×1080', status: '待审核', createdAt: '2025-10-18' },
    ];
    localStorage.setItem('videos', JSON.stringify(videos));

    // 常见问题
    const savedQuestions = [
      { id: 1, question: '人体解剖学班级整体掌握率是多少？', answer: '当前班级整体掌握率为75.1%，其中骨骼系统掌握率最高(85%)，神经系统最低(67.5%)。', createdAt: '2026-08-05' },
      { id: 2, question: '哪些学生需要重点关注？', answer: '目前有3名学生成绩低于60分需要重点关注：陈静(55分)、周杰(58分)、刘洋(62分)。建议进行一对一辅导。', createdAt: '2026-08-06' },
    ];
    localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));

    // 定时推送
    const scheduledPushes = [
      { id: 1, name: '每周学情报告', type: '学情分析', frequency: '每周一 09:00', dataType: '班级整体学情', status: '启用', createdAt: '2026-08-01' },
      { id: 2, name: '成绩预警通知', type: '预警提醒', frequency: '每日 18:00', dataType: '低分学生名单', status: '启用', createdAt: '2026-08-01' },
    ];
    localStorage.setItem('scheduledPushes', JSON.stringify(scheduledPushes));

    // 研究报告
    const researchReports = [
      { id: 1, title: '人工智能在医学影像诊断中的应用研究', template: '文献综述', createdAt: '2026-08-08', status: '已完成', keywords: ['AI', '医学影像', '深度学习'] },
      { id: 2, title: '基于知识图谱的医学课程体系优化研究', template: '研究报告', createdAt: '2026-08-09', status: '进行中', keywords: ['知识图谱', '课程体系', '医学教育'] },
    ];
    localStorage.setItem('researchReports', JSON.stringify(researchReports));

    // 微课数据
    const microCourses = [
      { id: 1, knowledgeId: 2, name: '骨骼系统微课', duration: 480, type: '视频', views: 1520, avgRating: 4.8 },
      { id: 2, knowledgeId: 6, name: '颅骨结构微课', duration: 720, type: '视频', views: 980, avgRating: 4.6 },
      { id: 3, knowledgeId: 11, name: '心脏结构微课', duration: 600, type: '视频', views: 2100, avgRating: 4.9 },
    ];
    localStorage.setItem('microCourses', JSON.stringify(microCourses));

    const studentReminders = [];
    localStorage.setItem('studentReminders', JSON.stringify(studentReminders));
  },

  get(key) {
    const data = localStorage.getItem(key);
    try { return JSON.parse(data); } catch(e) { return data; }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  // 用户认证
  getUsers() {
    return [
      { username: 'admin', password: 'admin123', name: '系统管理员', role: '管理员', avatar: '管' },
      { username: 'teacher', password: 'teacher123', name: '张教授', role: '教师', avatar: '张' },
      { username: 'student', password: 'student123', name: '李明', role: '学生', avatar: '李' },
    ];
  },
};