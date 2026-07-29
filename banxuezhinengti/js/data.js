// ===== 物流运筹学 · 场景与题目数据 =====

// ===== 知识树结构（与地图节点一一对应）=====
const KNOWLEDGE_TREE = [
  {
    id: 'lp',
    name: '线性规划',
    color: 'folder-blue',
    children: [
      { id: 'lp-1', name: '建模基础', sceneId: 'scene-1' },
      { id: 'lp-2', name: '单纯形法', sceneId: 'scene-2' },
      { id: 'lp-3', name: '灵敏度分析', sceneId: 'scene-3' },
    ]
  },
  {
    id: 'tp',
    name: '运输问题',
    color: 'folder-green',
    children: [
      { id: 'tp-1', name: '产销平衡', sceneId: 'scene-4' },
      { id: 'tp-2', name: '表上作业法', sceneId: 'scene-5' },
      { id: 'tp-3', name: '转运问题', sceneId: 'scene-6' },
    ]
  },
  {
    id: 'ip',
    name: '整数规划',
    color: 'folder-orange',
    children: [
      { id: 'ip-1', name: '分支定界', sceneId: 'scene-7' },
      { id: 'ip-2', name: '0-1规划', sceneId: 'scene-8' },
    ]
  },
  {
    id: 'dp',
    name: '动态规划',
    color: 'folder-purple',
    children: [
      { id: 'dp-1', name: '最短路径', sceneId: 'scene-9' },
      { id: 'dp-2', name: '资源分配', sceneId: 'scene-10' },
    ]
  },
  {
    id: 'inv',
    name: '库存控制',
    color: 'folder-teal',
    children: [
      { id: 'inv-1', name: 'EOQ模型', sceneId: 'scene-11' },
    ]
  },
  {
    id: 'qt',
    name: '排队论',
    color: 'folder-red',
    children: [
      { id: 'qt-1', name: 'M/M/1模型', sceneId: 'scene-12' },
    ]
  },
];

// ===== 场景数据（12关）=====
const SCENES = {
  // ========== 线性规划 ==========
  'scene-1': {
    id: 'scene-1', title: '城市配送中心选址',
    icon: '🏙️', tag: '线性规划 · 建模',
    difficulty: '⭐⭐',
    description: '某电商需在候选地点选择配送中心，建立线性规划模型使总建设+运输成本最小。',
    knowledgePoints: ['线性规划建模', '目标函数', '约束条件'],
    mapPosition: { x: 140, y: 100 },
  },
  'scene-2': {
    id: 'scene-2', title: '工厂生产计划优化',
    icon: '🏭', tag: '线性规划 · 单纯形法',
    difficulty: '⭐⭐⭐',
    description: '某工厂生产A、B两种产品，资源有限，用单纯形法求最大利润方案。',
    knowledgePoints: ['单纯形法', '基变量', '检验数'],
    mapPosition: { x: 320, y: 80 },
  },
  'scene-3': {
    id: 'scene-3', title: '原料价格灵敏度分析',
    icon: '📊', tag: '线性规划 · 灵敏度',
    difficulty: '⭐⭐⭐',
    description: '已知最优解，分析原料价格变动对最优基的影响范围。',
    knowledgePoints: ['灵敏度分析', '影子价格', '可行域变化'],
    mapPosition: { x: 500, y: 100 },
  },

  // ========== 运输问题 ==========
  'scene-4': {
    id: 'scene-4', title: '跨省干线运输调度',
    icon: '🚚', tag: '运输问题 · 平衡',
    difficulty: '⭐⭐',
    description: '多地工厂向多地仓库调运货物，产销总量相等，求最小运费方案。',
    knowledgePoints: ['产销平衡', '最小元素法', '伏格尔法'],
    mapPosition: { x: 680, y: 130 },
  },
  'scene-5': {
    id: 'scene-5', title: '多仓库物资调拨',
    icon: '🏗️', tag: '运输问题 · 表上作业',
    difficulty: '⭐⭐⭐⭐',
    description: '3个工厂供应4个仓库，用表上作业法（闭回路+位势法）求最优调运方案。',
    knowledgePoints: ['闭回路法', '位势法', '最优性检验'],
    mapPosition: { x: 820, y: 240 },
  },
  'scene-6': {
    id: 'scene-6', title: '中转仓库转运优化',
    icon: '🔄', tag: '运输问题 · 转运',
    difficulty: '⭐⭐⭐⭐',
    description: '允许货物经中转仓库转运，求含转运的最小总成本调运方案。',
    knowledgePoints: ['转运问题', '虚拟产销点', '等价变换'],
    mapPosition: { x: 700, y: 360 },
  },

  // ========== 整数规划 ==========
  'scene-7': {
    id: 'scene-7', title: '物流园区设施布局',
    icon: '🏢', tag: '整数规划 · 分支定界',
    difficulty: '⭐⭐⭐',
    description: '在候选区域选定设施位置（整数决策），满足覆盖需求且总成本最小。',
    knowledgePoints: ['分支定界法', '整数约束', '松弛问题'],
    mapPosition: { x: 200, y: 260 },
  },
  'scene-8': {
    id: 'scene-8', title: '配送车辆路径选择',
    icon: '🚐', tag: '整数规划 · 0-1',
    difficulty: '⭐⭐⭐⭐',
    description: '从仓库出发服务多个客户，每辆车有容量限制，选择最优车辆路径组合。',
    knowledgePoints: ['0-1规划', 'VRP模型', '约束满足'],
    mapPosition: { x: 350, y: 340 },
  },

  // ========== 动态规划 ==========
  'scene-9': {
    id: 'scene-9', title: '快递网点路径规划',
    icon: '📮', tag: '动态规划 · 最短路',
    difficulty: '⭐⭐⭐',
    description: '快递员从网点出发经过多个站点，用动态规划求最短配送路径。',
    knowledgePoints: ['Bellman方程', '阶段变量', '状态转移'],
    mapPosition: { x: 500, y: 430 },
  },
  'scene-10': {
    id: 'scene-10', title: '多期投资资源分配',
    icon: '💰', tag: '动态规划 · 资源分配',
    difficulty: '⭐⭐⭐⭐',
    description: '将有限预算分配到多个项目多期投资中，使总回报最大化。',
    knowledgePoints: ['多阶段决策', '递推方程', '边界条件'],
    mapPosition: { x: 300, y: 480 },
  },

  // ========== 库存控制 ==========
  'scene-11': {
    id: 'scene-11', title: '生鲜冷链库存策略',
    icon: '❄️', tag: '库存控制 · EOQ',
    difficulty: '⭐⭐',
    description: '某超市冷链食品需求稳定，求经济订货批量与再订货点。',
    knowledgePoints: ['EOQ公式', '订货成本', '持有成本', '安全库存'],
    mapPosition: { x: 650, y: 490 },
  },

  // ========== 排队论 ==========
  'scene-12': {
    id: 'scene-12', title: '港口集装箱装卸排队',
    icon: '⚓', tag: '排队论 · M/M/1',
    difficulty: '⭐⭐⭐',
    description: '泊位有限导致船舶排队等待，用M/M/1模型分析平均等待时间和队列长度。',
    knowledgePoints: ['到达率λ', '服务率μ', '利用率ρ', 'Little定律'],
    mapPosition: { x: 850, y: 470 },
  },
};

// ===== 地图路径（学习路线）=====
const MAP_PATHS = [
  // 线性规划主线
  { from: 'scene-1', to: 'scene-2' },
  { from: 'scene-2', to: 'scene-3' },
  // 运输问题主线
  { from: 'scene-3', to: 'scene-4' },
  { from: 'scene-4', to: 'scene-5' },
  { from: 'scene-5', to: 'scene-6' },
  // 整数规划支线
  { from: 'scene-1', to: 'scene-7' },
  { from: 'scene-7', to: 'scene-8' },
  // 动态规划支线
  { from: 'scene-7', to: 'scene-9' },
  { from: 'scene-9', to: 'scene-10' },
  // 库存 + 排队论
  { from: 'scene-4', to: 'scene-11' },
  { from: 'scene-6', to: 'scene-12' },
];

// ===== 题目数据（12关）=====
const QUESTIONS = {

  // ============ scene-1: 建模基础 ============
  'scene-1': {
    sceneId: 'scene-1',
    title: '建立配送中心选址的线性规划模型',
    scene: '某电商计划在A、B、C三个候选城市建设配送中心。已知：<br>• 建设成本分别为 200万、150万、180万<br>• 每个中心覆盖一定区域，需覆盖全部3个区域<br>• 城市A可覆盖区域1、2；城市B可覆盖区域2、3；城市C可覆盖区域1、3<br>• 运输成本暂不考虑<br><br><b>请回答以下问题：</b>',
    type: 'choice',
    body: '该问题的决策变量应该如何定义？',
    options: [
      { label: 'A', text: 'xᵢ = 第i个城市的需求量（i=1,2,3）' },
      { label: 'B', text: 'xᵢ = 是否在候选城市i建设配送中心（0或1，i=A,B,C）' },
      { label: 'C', text: 'xᵢ = 第i个配送中心的运输量（i=A,B,C）' },
      { label: 'D', text: 'xᵢ = 第i个区域的人口数量（i=1,2,3）' },
    ],
    correctAnswer: 'B',
    explanation: '选址问题本质是0-1决策："建"或"不建"。用二进制变量xᵢ∈{0,1}表示是否在城市i建设，目标函数为最小化建设成本之和，约束为覆盖全部区域。',
    knowledgePoint: '线性规划建模',
    hint: '核心决策是什么？是"选"还是"不选"，二选一。',
  },

  // ============ scene-2: 单纯形法 ============
  'scene-2': {
    sceneId: 'scene-2',
    title: '单纯形法 · 初始基可行解',
    scene: '某工厂生产产品A和B：<br>• 每单位A利润 3万元，每单位B利润 5万元<br>• 生产A需2小时工时，B需3小时，总工时 ≤ 18小时<br>• 生产A需1单位原料，B需2单位，总原料 ≤ 10单位<br>• A、B产量 ≥ 0<br><br>标准形：max Z = 3x₁ + 5x₂ + 0s₁ + 0s₂',
    type: 'choice',
    body: '引入松弛变量s₁、s₂后，初始基变量是？',
    options: [
      { label: 'A', text: 'x₁ 和 x₂' },
      { label: 'B', text: 's₁ 和 s₂' },
      { label: 'C', text: 'x₁ 和 s₁' },
      { label: 'D', text: 'x₂ 和 s₂' },
    ],
    correctAnswer: 'B',
    explanation: '松弛变量在约束矩阵中构成单位矩阵，天然是初始基变量。s₁对应工时约束（x₁系数2, s₁系数1），s₂对应原料约束（x₂系数2, s₂系数1）。',
    knowledgePoint: '单纯形法 · 基变量识别',
    hint: '松弛变量系数为1且互不重叠 → 天然单位矩阵 → 直接做基。',
  },

  // ============ scene-3: 灵敏度分析 ============
  'scene-3': {
    sceneId: 'scene-3',
    title: '灵敏度分析 · 影子价格',
    scene: '已知最优解下，工时约束的松弛变量s₁=0（资源耗尽），原料约束s₂=2（剩余2单位）。工时约束的对偶变量（影子价格）为 1.5。',
    type: 'choice',
    body: '若工时增加1小时（从18→19），总利润大约变化多少？',
    options: [
      { label: 'A', text: '增加 0.5 万元' },
      { label: 'B', text: '增加 1.5 万元' },
      { label: 'C', text: '不变，因为不是瓶颈' },
      { label: 'D', text: '减少 1.5 万元' },
    ],
    correctAnswer: 'B',
    explanation: '影子价格 = 约束右端项增加1单位时目标函数的改善量。影子价格1.5意味着每增加1小时工时，利润增加1.5万元（在允许范围内）。',
    knowledgePoint: '灵敏度分析 · 影子价格',
    hint: '影子价格就是"再多一单位资源能多赚多少"的边际价值。',
  },

  // ============ scene-4: 产销平衡 ============
  'scene-4': {
    sceneId: 'scene-4',
    title: '运输问题 · 产销平衡判定',
    scene: '有2个工厂（F1产量80吨，F2产量120吨）向3个仓库（W1需求60吨，W2需求70吨，W3需求70吨）调运。总供应量=总需求量=200吨。',
    type: 'choice',
    body: '判断：该运输问题是否一定存在可行解？',
    options: [
      { label: 'A', text: '是，产销平衡时必然存在可行解' },
      { label: 'B', text: '否，还需要运费非负' },
      { label: 'C', text: '否，还需要路网完全连通' },
      { label: 'D', text: '不一定，可能无可行解' },
    ],
    correctAnswer: 'A',
    explanation: '产销平衡（总供给=总需求）是运输问题存在可行解的充要条件（假设完全连通）。这是运输问题区别于一般LP的重要性质。',
    knowledgePoint: '产销平衡性质',
    hint: '产销平衡 = 供需恰好相等 → 必有可行解（全连通前提下）。',
  },

  // ============ scene-5: 表上作业法 ============
  'scene-5': {
    sceneId: 'scene-5',
    title: '表上作业法 · 位势法检验',
    scene: '在某调运方案用位势法检验时，得到空格(1,1)的检验数 σ₁₁ = -3。当前总运费为 560 元。',
    type: 'choice',
    body: '若沿(1,1)的闭回路做一次调整（调整量为θ=10吨），新的总运费约为？',
    options: [
      { label: 'A', text: '563 元' },
      { label: 'B', text: '557 元' },
      { label: 'C', text: '530 元' },
      { label: 'D', text: '590 元' },
    ],
    correctAnswer: 'C',
    explanation: '检验数σ=-3意味着每将1吨货物移到(1,1)格，总运费减少3元。调整10吨则减少30元：560-30=530元。',
    knowledgePoint: '位势法 · 检验数应用',
    hint: '检验数 = 每调整1单位运量的费用变化。σ<0说明调整后费用降低。',
  },

  // ============ scene-6: 转运问题 ============
  'scene-6': {
    sceneId: 'scene-6',
    title: '转运问题 · 等价变换',
    scene: '某运输问题中，工厂F可通过中转仓库T向仓库W调运。F→T运费3元/吨，T→W运费2元/吨。也可F直送W运费7元/吨。',
    type: 'choice',
    body: '将转运问题化为普通运输问题时，F到W的等效运费应取？',
    options: [
      { label: 'A', text: '7 元（直送优先）' },
      { label: 'B', text: '5 元（取F→T→W路径 3+2=5）' },
      { label: 'C', text: '3 元（仅算第一段）' },
      { label: 'D', text: '取 5 和 7 的较小值 = 5 元' },
    ],
    correctAnswer: 'D',
    explanation: '转运问题化为普通运输问题时，需计算各产销对之间的最短路径运费作为等效直接运费。F→W经T为5元 < 直送7元，故取5元。',
    knowledgePoint: '转运问题 · 等效运费',
    hint: '转运 = 先算"虚拟直送"的最短路径费用，再当普通运输问题求解。',
  },

  // ============ scene-7: 分支定界 ============
  'scene-7': {
    sceneId: 'scene-7',
    title: '整数规划 · 分支定界原理',
    scene: '用分支定界法求解最大化问题，松弛问题最优解为 x₁=2.7, x₂=1.3，目标值 Z=18.5。分支选择 x₁≤2 和 x₁≥3。分支后：左支(LP1)得Z=16.2，右支(LP2)得Z=17.8。',
    type: 'choice',
    body: '下一步应优先探索哪个分支？',
    options: [
      { label: 'A', text: '左支(LP1)，因为其Z值更小，离整数最优可能更近' },
      { label: 'B', text: '右支(LP2)，因为其Z值更大，更可能包含最优整数解' },
      { label: 'C', text: '两个分支同时剪枝，都已无解' },
      { label: 'D', text: '回到根节点重新分支' },
    ],
    correctAnswer: 'B',
    explanation: '分支定界中，最大化问题优先探索上界更大的分支（Z=17.8 > 16.2）。若某分支的上界已低于已知整数可行解，则剪枝。',
    knowledgePoint: '分支定界法 · 搜索策略',
    hint: '最大化 → 先探"天花板"高的分支；若天花板 < 已知最优解 → 剪枝。',
  },

  // ============ scene-8: 0-1规划 ============
  'scene-8': {
    sceneId: 'scene-8',
    title: '0-1规划 · 背包问题建模',
    scene: '配送车容量限制为 15 立方米。有5类货物可选装，体积和利润如下：<br>• 货物A：v=4, p=40<br>• 货物B：v=6, p=50<br>• 货物C：v=3, p=25<br>• 货物D：v=5, p=45<br>• 货物E：v=7, p=60<br><br>每种货物最多装1件（0-1决策）。',
    type: 'choice',
    body: '该问题的目标函数应为？',
    options: [
      { label: 'A', text: 'max 4x₁+6x₂+3x₃+5x₄+7x₅' },
      { label: 'B', text: 'max 40x₁+50x₂+25x₃+45x₄+60x₅' },
      { label: 'C', text: 'min 15 - (4x₁+6x₂+3x₃+5x₄+7x₅)' },
      { label: 'D', text: 'max 40x₁+50x₂+25x₃+45x₄+60x₅，约束为 ∑vᵢxᵢ ≤ 15' },
    ],
    correctAnswer: 'D',
    explanation: '0-1背包问题：最大化总利润 ∑pᵢxᵢ，约束为总体积不超过容量 ∑vᵢxᵢ≤V。A只写了体积（错误），B缺约束，C方向反了。',
    knowledgePoint: '0-1规划 · 背包模型',
    hint: '目标=最大化利润（不是体积），约束=体积不超限。',
  },

  // ============ scene-9: 最短路径 ============
  'scene-9': {
    sceneId: 'scene-9',
    title: '动态规划 · 最短路径',
    scene: '从S到T分3个阶段，各节点间距离：<br>• S→A₁=2, S→A₂=5<br>• A₁→B₁=4, A₁→B₂=2, A₂→B₁=3, A₂→B₂=1<br>• B₁→T=5, B₂→T=4<br><br>用逆向动态规划求解。',
    type: 'choice',
    body: '从S到T的最短距离是？',
    options: [
      { label: 'A', text: '8' },
      { label: 'B', text: '9' },
      { label: 'C', text: '10' },
      { label: 'D', text: '11' },
    ],
    correctAnswer: 'A',
    explanation: '逆向递推：f(B₁)=5, f(B₂)=4。A₁: min(4+5=9, 2+4=6)=6。A₂: min(3+5=8, 1+4=5)=5。S: min(2+6=8, 5+5=10)=8。最短路径 S→A₁→B₂→T = 2+2+4 = 8。',
    knowledgePoint: '动态规划 · Bellman方程',
    hint: '逆向递推：从T往S逐阶段取min，f(i)=min{d(i,j)+f(j)}。',
  },

  // ============ scene-10: 资源分配 ============
  'scene-10': {
    sceneId: 'scene-10',
    title: '动态规划 · 资源分配',
    scene: '将3台设备分配给2个项目。项目1分配x台时的收益：g₁(0)=0, g₁(1)=5, g₁(2)=9, g₁(3)=12。项目2：g₂(0)=0, g₂(1)=4, g₂(2)=7, g₂(3)=10。',
    type: 'choice',
    body: '用动态规划求最大总收益，最优分配方案是？',
    options: [
      { label: 'A', text: '项目1分2台，项目2分1台，总收益=14' },
      { label: 'B', text: '项目1分1台，项目2分2台，总收益=12' },
      { label: 'C', text: '项目1分3台，项目2分0台，总收益=12' },
      { label: 'D', text: '项目1分2台，项目2分1台，总收益=13' },
    ],
    correctAnswer: 'D',
    explanation: '枚举：x₁=0,x₂=3→0+10=10；x₁=1,x₂=2→5+7=12；x₁=2,x₂=1→9+4=13；x₁=3,x₂=0→12+0=12。最大=13，方案为(2,1)。',
    knowledgePoint: '动态规划 · 资源分配',
    hint: '设备总数固定为3，枚举所有分配组合取max。',
  },

  // ============ scene-11: EOQ ============
  'scene-11': {
    sceneId: 'scene-11',
    title: 'EOQ经济订货批量',
    scene: '某超市冷链食品：年需求D=2400箱，每次订货成本K=50元，单位持有成本h=2元/箱·年。',
    type: 'input',
    body: '计算经济订货批量 EOQ = √(2DK/h)（只填整数）：',
    options: [],
    correctAnswer: '346',
    tolerance: 5,
    explanation: 'EOQ = √(2×2400×50/2) = √120000 ≈ 346.4 → 取整346箱。年订货次数≈2400/346≈6.9次，订货间隔≈53天。',
    knowledgePoint: 'EOQ公式计算',
    hint: '公式 EOQ = √(2DK/h)。K=每次订货成本，h=单位年持有成本。',
  },

  // ============ scene-12: M/M/1 ============
  'scene-12': {
    sceneId: 'scene-12',
    title: '排队论 · M/M/1 模型',
    scene: '某港口泊位：船舶到达率 λ=2艘/天，服务率 μ=3艘/天（负指数分布）。单泊位服务。',
    type: 'choice',
    body: '平均排队等待的船舶数 Lq 为？',
    options: [
      { label: 'A', text: '1.33 艘' },
      { label: 'B', text: '2.0 艘' },
      { label: 'C', text: '0.67 艘' },
      { label: 'D', text: '0.44 艘' },
    ],
    correctAnswer: 'A',
    explanation: 'M/M/1模型：ρ=λ/μ=2/3。Lq = ρ²/(1-ρ) = (4/9)/(1/3) = 4/3 ≈ 1.33艘。Ls = ρ/(1-ρ) = 2。Wq = Lq/λ = 0.67天。',
    knowledgePoint: 'M/M/1 · 排队指标',
    hint: 'ρ=λ/μ，Lq=ρ²/(1-ρ)，Ls=ρ/(1-ρ)。先算利用率再套公式。',
  },
};

// ===== 学习进度存储 =====
let gameState = {
  completedScenes: [],
  currentScene: null,
  wrongKnowledge: {},
  correctKnowledge: {},
  answers: {},
};

function loadState() {
  const saved = localStorage.getItem('logisticsGameState');
  if (saved) {
    try { gameState = JSON.parse(saved); } catch(e) {}
  }
}

function saveState() {
  localStorage.setItem('logisticsGameState', JSON.stringify(gameState));
}