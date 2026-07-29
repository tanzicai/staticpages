// ===== 物流运筹学 · 场景与题目数据 =====

// ===== 知识树结构 =====
const KNOWLEDGE_TREE = [
  {
    id: 'lp', name: '线性规划', color: 'folder-blue',
    children: [
      { id: 'lp-1', name: '建模基础', sceneId: 'scene-1' },
      { id: 'lp-2', name: '单纯形法', sceneId: 'scene-2' },
    ]
  },
  {
    id: 'tp', name: '运输问题', color: 'folder-green',
    children: [
      { id: 'tp-1', name: '产销平衡', sceneId: 'scene-3' },
      { id: 'tp-2', name: '表上作业法', sceneId: 'scene-4' },
    ]
  },
  {
    id: 'ip', name: '整数规划', color: 'folder-orange',
    children: [
      { id: 'ip-1', name: '分支定界', sceneId: 'scene-5' },
    ]
  },
  {
    id: 'dp', name: '动态规划', color: 'folder-purple',
    children: [
      { id: 'dp-1', name: '最短路径', sceneId: 'scene-6' },
    ]
  },
  {
    id: 'inv', name: '库存控制', color: 'folder-teal',
    children: [
      { id: 'inv-1', name: 'EOQ模型', sceneId: 'scene-7' },
    ]
  },
];

// ===== 场景数据（7个场景，每个3-5题）=====
const SCENES = {
  'scene-1': {
    id: 'scene-1', title: '城市配送中心选址',
    icon: '🏙️', tag: '线性规划 · 建模',
    difficulty: '⭐⭐',
    description: '某电商需在候选地点选择配送中心，建立线性规划模型使总成本最小。共3题，全部答对即通关。',
    knowledgePoints: ['线性规划建模', '目标函数', '约束条件'],
    mapPosition: { x: 160, y: 130 },
    questionCount: 3,
  },
  'scene-2': {
    id: 'scene-2', title: '工厂生产计划优化',
    icon: '🏭', tag: '线性规划 · 单纯形法',
    difficulty: '⭐⭐⭐',
    description: '某工厂生产A、B两种产品，资源有限，用单纯形法求最大利润方案。共4题。',
    knowledgePoints: ['单纯形法', '基变量', '检验数', '最优性判定'],
    mapPosition: { x: 380, y: 100 },
    questionCount: 4,
  },
  'scene-3': {
    id: 'scene-3', title: '跨省干线运输调度',
    icon: '🚚', tag: '运输问题 · 平衡',
    difficulty: '⭐⭐',
    description: '多地工厂向多地仓库调运货物，产销平衡下求最小运费方案。共3题。',
    knowledgePoints: ['产销平衡', '最小元素法', '伏格尔法'],
    mapPosition: { x: 600, y: 140 },
    questionCount: 3,
  },
  'scene-4': {
    id: 'scene-4', title: '多仓库物资调拨',
    icon: '🏗️', tag: '运输问题 · 表上作业',
    difficulty: '⭐⭐⭐⭐',
    description: '3个工厂供应4个仓库，用表上作业法（闭回路+位势法）求最优调运方案。共5题。',
    knowledgePoints: ['闭回路法', '位势法', '最优性检验', '退化处理'],
    mapPosition: { x: 800, y: 240 },
    questionCount: 5,
  },
  'scene-5': {
    id: 'scene-5', title: '物流园区设施布局',
    icon: '🏢', tag: '整数规划 · 分支定界',
    difficulty: '⭐⭐⭐',
    description: '在候选区域选定设施位置（整数决策），满足覆盖需求且总成本最小。共3题。',
    knowledgePoints: ['分支定界法', '整数约束', '0-1变量'],
    mapPosition: { x: 220, y: 300 },
    questionCount: 3,
  },
  'scene-6': {
    id: 'scene-6', title: '快递网点路径规划',
    icon: '📮', tag: '动态规划 · 最短路',
    difficulty: '⭐⭐⭐',
    description: '快递员从网点出发经过多个站点，用动态规划求最短配送路径。共4题。',
    knowledgePoints: ['Bellman方程', '阶段变量', '状态转移', '递推求解'],
    mapPosition: { x: 440, y: 390 },
    questionCount: 4,
  },
  'scene-7': {
    id: 'scene-7', title: '生鲜冷链库存策略',
    icon: '❄️', tag: '库存控制 · EOQ',
    difficulty: '⭐⭐',
    description: '某超市冷链食品需求稳定，求经济订货批量、再订货点及安全库存。共3题。',
    knowledgePoints: ['EOQ公式', '订货成本', '持有成本', '安全库存'],
    mapPosition: { x: 680, y: 460 },
    questionCount: 3,
  },
};

// ===== 地图路径 =====
const MAP_PATHS = [
  { from: 'scene-1', to: 'scene-2' },
  { from: 'scene-2', to: 'scene-3' },
  { from: 'scene-3', to: 'scene-4' },
  { from: 'scene-1', to: 'scene-5' },
  { from: 'scene-5', to: 'scene-6' },
  { from: 'scene-3', to: 'scene-7' },
];

// ===== 题目数据（每个场景多道题）=====
// 结构：QUESTIONS[sceneId] = [题1, 题2, ...]
const QUESTIONS = {

  // ========================
  // scene-1: 建模基础（3题）
  // ========================
  'scene-1': [
    {
      qid: 's1-q1',
      title: '决策变量定义',
      scene: '某电商计划在A、B、C三个候选城市建设配送中心。已知：<br>• 建设成本分别为 200万、150万、180万<br>• 需覆盖全部3个区域<br>• A覆盖区域1、2；B覆盖区域2、3；C覆盖区域1、3<br>• 运输成本暂不考虑',
      type: 'choice',
      body: '该问题的决策变量应该如何定义？',
      options: [
        { label: 'A', text: 'xᵢ = 第i个城市的需求量（i=1,2,3）' },
        { label: 'B', text: 'xᵢ = 是否在候选城市i建设配送中心（0或1，i=A,B,C）' },
        { label: 'C', text: 'xᵢ = 第i个配送中心的运输量（i=A,B,C）' },
        { label: 'D', text: 'xᵢ = 第i个区域的人口数量（i=1,2,3）' },
      ],
      correctAnswer: 'B',
      explanation: '选址问题本质是0-1决策："建"或"不建"。用二进制变量xᵢ∈{0,1}表示是否在城市i建设。',
      knowledgePoint: '线性规划建模',
      hint: '核心决策是"选"还是"不选"，二选一。',
    },
    {
      qid: 's1-q2',
      title: '目标函数构建',
      scene: '沿用上题条件：A、B、C建设成本分别为200万、150万、180万。',
      type: 'choice',
      body: '目标函数应写为？',
      options: [
        { label: 'A', text: 'min Z = 200x₁ + 150x₂ + 180x₃' },
        { label: 'B', text: 'max Z = 200x₁ + 150x₂ + 180x₃' },
        { label: 'C', text: 'min Z = x₁ + x₂ + x₃' },
        { label: 'D', text: 'max Z = 200x₁ + 150x₂ + 180x₃，约束为成本≤预算' },
      ],
      correctAnswer: 'A',
      explanation: '目标是最小化总建设成本，系数即各地建设费用。xᵢ为0-1变量，选中则加对应成本。',
      knowledgePoint: '目标函数',
      hint: '"最小成本"→min；系数是什么？每个城市的建设花费。',
    },
    {
      qid: 's1-q3',
      title: '覆盖约束',
      scene: '区域1可被A或C覆盖。要求每个区域至少被1个选址覆盖。',
      type: 'choice',
      body: '区域1的覆盖约束应如何写？',
      options: [
        { label: 'A', text: 'x₁ + x₃ ≥ 1' },
        { label: 'B', text: 'x₁ + x₃ = 1' },
        { label: 'C', text: 'x₁ · x₃ ≥ 1' },
        { label: 'D', text: 'x₁ + x₂ + x₃ ≥ 1' },
      ],
      correctAnswer: 'A',
      explanation: 'A(x₁)和C(x₃)都能覆盖区域1。"至少1个"→≥1。x₁+x₃≥1表示A或C至少一个被选中。注意不是=1（允许两个都选）。',
      knowledgePoint: '约束条件',
      hint: '"至少覆盖"→≥；谁覆盖区域1？A和C。',
    },
  ],

  // ========================
  // scene-2: 单纯形法（4题）
  // ========================
  'scene-2': [
    {
      qid: 's2-q1',
      title: '初始基变量识别',
      scene: '某工厂生产A和B：每单位A利润3万，B利润5万。A需2h工时+B需3h，总工时≤18h。A需1单位原料+B需2单位，总原料≤10单位。标准形：max Z = 3x₁+5x₂+0s₁+0s₂',
      type: 'choice',
      body: '引入松弛变量s₁、s₂后，初始基变量是？',
      options: [
        { label: 'A', text: 'x₁ 和 x₂' },
        { label: 'B', text: 's₁ 和 s₂' },
        { label: 'C', text: 'x₁ 和 s₁' },
        { label: 'D', text: 'x₂ 和 s₂' },
      ],
      correctAnswer: 'B',
      explanation: '松弛变量在约束矩阵中构成单位矩阵（系数列互为e₁,e₂），天然作为初始基变量，对应初始基本可行解。',
      knowledgePoint: '单纯形法 · 基变量识别',
      hint: '松弛变量系数为1且互相独立→天然单位矩阵→直接做基。',
    },
    {
      qid: 's2-q2',
      title: '检验数计算',
      scene: '在单纯形表中，某非基变量xⱼ的系数列为 (2, 3)ᵀ，当前基变量的目标系数（c_B）= (0, 0)，非基变量价格系数cⱼ = 5。',
      type: 'choice',
      body: '用公式 σⱼ = cⱼ - c_B · aⱼ 计算，检验数 σⱼ = ？',
      options: [
        { label: 'A', text: '5 - 0×2 - 0×3 = 5' },
        { label: 'B', text: '5 - 0×2 + 0×3 = 5' },
        { label: 'C', text: '0 - 5×2 - 5×3 = -25' },
        { label: 'D', text: '5 × 2 + 5 × 3 = 25' },
      ],
      correctAnswer: 'A',
      explanation: 'σⱼ = cⱼ - Σc_Bᵢ·aᵢⱼ = 5 - 0×2 - 0×3 = 5。σⱼ>0说明入基可改善目标。',
      knowledgePoint: '检验数计算',
      hint: '公式：σⱼ = cⱼ - c_B·aⱼ（向量点积）。当前基是松弛变量，c_B全为0。',
    },
    {
      qid: 's2-q3',
      title: '入基变量选择',
      scene: '单纯形表中各非基变量检验数：σ₁=3, σ₂=-2, σ₃=0, σ₄=5。最大化问题。',
      type: 'choice',
      body: '应选择哪个变量入基？',
      options: [
        { label: 'A', text: 'x₁（σ=3）' },
        { label: 'B', text: 'x₂（σ=-2）' },
        { label: 'C', text: 'x₃（σ=0）' },
        { label: 'D', text: 'x₄（σ=5）' },
      ],
      correctAnswer: 'D',
      explanation: '最大化问题中，选检验数最大的正检验数对应的变量入基（σ=5最大→x₄入基），可使目标函数改善最多。',
      knowledgePoint: '入基规则',
      hint: 'max问题：σ>0才能改善，选最大的σ对应的变量。',
    },
    {
      qid: 's2-q4',
      title: '最优性判定',
      scene: '某单纯形表中所有非基变量的检验数 σⱼ ≤ 0。',
      type: 'choice',
      body: '此时该解的性质是？',
      options: [
        { label: 'A', text: '一定是全局最优解' },
        { label: 'B', text: '一定不是最优解' },
        { label: 'C', text: '若问题有界，则为最优解' },
        { label: 'D', text: '需要继续迭代' },
      ],
      correctAnswer: 'C',
      explanation: '所有σⱼ≤0（max问题）是单纯形法的最优性条件。前提是问题有界且当前解可行。若存在退化可能导致循环（但实践中极罕见）。',
      knowledgePoint: '最优性判定',
      hint: '所有检验数≤0 → 无改进空间 → 最优（假设有界）。',
    },
  ],

  // ========================
  // scene-3: 产销平衡（3题）
  // ========================
  'scene-3': [
    {
      qid: 's3-q1',
      title: '可行解判定',
      scene: '2个工厂（F1产量80吨，F2产量120吨）向3个仓库（W1需求60吨，W2需求70吨，W3需求70吨）调运。总供应=总需求=200吨。',
      type: 'choice',
      body: '判断：该运输问题是否一定存在可行解？',
      options: [
        { label: 'A', text: '是，产销平衡时必然存在可行解' },
        { label: 'B', text: '否，还需要运费非负' },
        { label: 'C', text: '否，还需要路网完全连通' },
        { label: 'D', text: '不一定，可能无可行解' },
      ],
      correctAnswer: 'A',
      explanation: '产销平衡（总供给=总需求）是运输问题存在可行解的充要条件（假设完全连通）。这是运输问题的基本性质。',
      knowledgePoint: '产销平衡性质',
      hint: '产销平衡 = 供需恰好相等 → 必有可行解。',
    },
    {
      qid: 's3-q2',
      title: '最小元素法初试',
      scene: '运费表（元/吨）：<br>F1→W1: 4, F1→W2: 6, F1→W3: 8<br>F2→W1: 5, F2→W2: 3, F2→W3: 2<br>F1供应80，F2供应120。W1需60，W2需70，W3需70。',
      type: 'choice',
      body: '用最小元素法，第一步应选择哪个格子填数？',
      options: [
        { label: 'A', text: 'F1→W1（运费4）' },
        { label: 'B', text: 'F2→W3（运费2）' },
        { label: 'C', text: 'F2→W2（运费3）' },
        { label: 'D', text: 'F1→W2（运费6）' },
      ],
      correctAnswer: 'B',
      explanation: '最小元素法每次选运费最小的未分配格子。全局最小是F2→W3=2，故先分配此格（可分配min(120,70)=70吨）。',
      knowledgePoint: '最小元素法',
      hint: '"最小元素"=运费最小的格子优先填。扫一遍全表找最小值。',
    },
    {
      qid: 's3-q3',
      title: '伏格尔法 vs 最小元素法',
      scene: '同一运输问题，分别用最小元素法和伏格尔法求初始方案。',
      type: 'choice',
      body: '关于两种方法，以下说法正确的是？',
      options: [
        { label: 'A', text: '最小元素法总能得到最优解' },
        { label: 'B', text: '伏格尔法考虑罚数，通常初始解更接近最优' },
        { label: 'C', text: '伏格尔法比最小元素法计算量更小' },
        { label: 'D', text: '两种方法得到的初始解一定不同' },
      ],
      correctAnswer: 'B',
      explanation: '伏格尔法(VAM)计算每个行/列的罚数（次小-最小运费），优先在罚数大的行/列分配，故初始解质量通常更高，迭代次数更少。但计算量更大。',
      knowledgePoint: '伏格尔法',
      hint: '伏格尔 = 看"不选最小会亏多少"（罚数），贪心更聪明但更费算。',
    },
  ],

  // ========================
  // scene-4: 表上作业法（5题）
  // ========================
  'scene-4': [
    {
      qid: 's4-q1',
      title: '基格数量',
      scene: '某运输问题有3个产地、4个销地，产销平衡。已用最小元素法得到初始方案。',
      type: 'choice',
      body: '基格（有运量的格子）数量应为？',
      options: [
        { label: 'A', text: '3 + 4 - 1 = 6 个' },
        { label: 'B', text: '3 × 4 = 12 个' },
        { label: 'C', text: '3 + 4 = 7 个' },
        { label: 'D', text: '不确定，取决于具体方案' },
      ],
      correctAnswer: 'A',
      explanation: '运输问题基格数 = m + n - 1（m行n列）。3+4-1=6个基格。这是表上作业法的基本结构。',
      knowledgePoint: '基格数量',
      hint: '基格数公式：m+n-1。退化时可能少于此数需补0格。',
    },
    {
      qid: 's4-q2',
      title: '位势法求检验数',
      scene: '某运输问题，已知基格位势满足 uᵢ + vⱼ = cᵢⱼ。当前：u₁=0, v₁=4, v₂=6, v₃=8。空格(1,4)不存在（只有3个销地）。换例：空格(2,1)的运费c₂₁=5。已知u₂=1。',
      type: 'choice',
      body: '求空格(2,1)的检验数 σ₂₁ = c₂₁ - (u₂+v₁) = ？',
      options: [
        { label: 'A', text: '5 - (1+4) = 0' },
        { label: 'B', text: '5 - (1+4) = 5' },
        { label: 'C', text: '5 - 1 - 4 = 0' },
        { label: 'D', text: '(1+4) - 5 = 0' },
      ],
      correctAnswer: 'A',
      explanation: 'σ₂₁ = c₂₁ - (u₂+v₁) = 5 - (1+4) = 0。检验数为0说明该空格入基后目标不变（存在多个最优解）。',
      knowledgePoint: '位势法 · 检验数计算',
      hint: '公式 σᵢⱼ = cᵢⱼ - uᵢ - vⱼ。先由基格求出u、v，再代入空格。',
    },
    {
      qid: 's4-q3',
      title: '检验数符号与调整方向',
      scene: '用位势法检验得到空格(1,1)的检验数 σ₁₁ = -3。当前总运费为560元。',
      type: 'choice',
      body: 'σ₁₁=-3说明什么？沿该空格闭回路调整θ=10吨后总运费变为？',
      options: [
        { label: 'A', text: '方案已最优，运费不变=560' },
        { label: 'B', text: '应增加(1,1)运量，新运费=530' },
        { label: 'C', text: '应减少(1,1)运量，新运费=590' },
        { label: 'D', text: '应增加(1,1)运量，新运费=563' },
      ],
      correctAnswer: 'B',
      explanation: 'σ<0说明将空格纳入基格可降低总运费。每调整1吨降低3元，调整10吨→560-30=530元。',
      knowledgePoint: '检验数意义与调整',
      hint: 'σ<0 → 入基可降本 → 沿闭回路调整，变化量=σ×θ。',
    },
    {
      qid: 's4-q4',
      title: '闭回路调整量',
      scene: '空格(1,2)入基，其闭回路上各转角点运量为：加号点 20吨、35吨；减号点 10吨、15吨。',
      type: 'choice',
      body: '最大调整量 θ（保持可行）为？',
      options: [
        { label: 'A', text: 'min(20,35)=20 吨' },
        { label: 'B', text: 'min(10,15)=10 吨' },
        { label: 'C', text: 'max(10,15)=15 吨' },
        { label: 'D', text: 'min(20+35, 10+15)=35 吨' },
      ],
      correctAnswer: 'B',
      explanation: '调整量θ取闭回路上所有"减号点"（即将减少运量的基格）运量的最小值，确保不出现负运量。θ=min(10,15)=10。',
      knowledgePoint: '闭回路 · 调整量',
      hint: 'θ = min{减号点运量}。减号点是闭回路上要"让出"运量的格子。',
    },
    {
      qid: 's4-q5',
      title: '退化处理',
      scene: '某运输问题3×3，基格应有 3+3-1=5 个，但当前只有4个有正运量，出现退化。',
      type: 'choice',
      body: '退化时应如何处理？',
      options: [
        { label: 'A', text: '补一个运量为0的基格（虚基格）使基格数凑齐' },
        { label: 'B', text: '直接终止，当前解即为最优' },
        { label: 'C', text: '随机删除一个基格' },
        { label: 'D', text: '增加一行虚拟产地' },
      ],
      correctAnswer: 'A',
      explanation: '退化时基格数<m+n-1，位势法无法正常计算。需在运费最小的空格补一个运量=0的虚基格，凑齐m+n-1个基格后继续迭代。',
      knowledgePoint: '退化处理',
      hint: '退化 = 基格不够 → 补0格（选运费最小的空格）凑数。',
    },
  ],

  // ========================
  // scene-5: 整数规划（3题）
  // ========================
  'scene-5': [
    {
      qid: 's5-q1',
      title: '分支定界 · 搜索策略',
      scene: '用分支定界法求解最大化问题。松弛问题最优解 x₁=2.7, x₂=1.3，目标值Z=18.5。分支：左支(LP1)Z=16.2，右支(LP2)Z=17.8。已知整数可行解Z=15。',
      type: 'choice',
      body: '下一步应优先探索哪个分支？',
      options: [
        { label: 'A', text: '左支(LP1)，Z=16.2' },
        { label: 'B', text: '右支(LP2)，Z=17.8' },
        { label: 'C', text: '两个都剪枝' },
        { label: 'D', text: '先回到根节点' },
      ],
      correctAnswer: 'B',
      explanation: '最大化问题优先探索上界更大的分支（17.8>16.2）。且右支上界17.8>已知整数可行解15，有改进空间，不应剪枝。',
      knowledgePoint: '分支定界 · 搜索策略',
      hint: 'max→先探天花板高的分支；天花板<已知最优解→剪枝。',
    },
    {
      qid: 's5-q2',
      title: '分支定界 · 剪枝条件',
      scene: '最大化问题，已知最佳整数可行解 Z*=14。某分支松弛解 Z=13.5（无整数解）。',
      type: 'choice',
      body: '该分支应如何处理？',
      options: [
        { label: 'A', text: '继续分支，可能有更优整数解' },
        { label: 'B', text: '剪枝（该分支不可能产生比Z*更优的整数解）' },
        { label: 'C', text: '直接取Z=13.5作为近似最优解' },
        { label: 'D', text: '回溯到父节点重新分支' },
      ],
      correctAnswer: 'B',
      explanation: '该分支上界13.5 < 已知整数最优14，且取整只会更小，不可能超越Z*。故剪枝，不再探索。',
      knowledgePoint: '剪枝条件',
      hint: '上界 < 已知最优整数解 → 该分支无价值 → 剪。',
    },
    {
      qid: 's5-q3',
      title: '0-1变量建模',
      scene: '配送车容量15m³。货物A(v=4,p=40), B(v=6,p=50), C(v=3,p=25), D(v=5,p=45), E(v=7,p=60)。每种最多装1件。',
      type: 'choice',
      body: '正确的0-1背包模型是？',
      options: [
        { label: 'A', text: 'max Σpᵢxᵢ，约束 Σvᵢxᵢ ≤ 15，xᵢ∈{0,1}' },
        { label: 'B', text: 'min Σvᵢxᵢ，约束 Σpᵢxᵢ ≥ 某值，xᵢ∈{0,1}' },
        { label: 'C', text: 'max Σvᵢxᵢ，约束 Σpᵢxᵢ ≤ 预算' },
        { label: 'D', text: 'max Σ(pᵢ/vᵢ)xᵢ，无容量约束' },
      ],
      correctAnswer: 'A',
      explanation: '标准0-1背包：最大化总利润Σpᵢxᵢ，约束总体积Σvᵢxᵢ≤容量V，xᵢ∈{0,1}。',
      knowledgePoint: '0-1规划建模',
      hint: '目标=最大利润，约束=体积不超容量，变量=0或1。',
    },
  ],

  // ========================
  // scene-6: 动态规划（4题）
  // ========================
  'scene-6': [
    {
      qid: 's6-q1',
      title: 'Bellman最优性原理',
      scene: '从S到T分3个阶段，各节点间距离：<br>• S→A₁=2, S→A₂=5<br>• A₁→B₁=4, A₁→B₂=2, A₂→B₁=3, A₂→B₂=1<br>• B₁→T=5, B₂→T=4',
      type: 'choice',
      body: '从S到T的最短距离是？（逆向递推）',
      options: [
        { label: 'A', text: '8（S→A₁→B₂→T = 2+2+4）' },
        { label: 'B', text: '9（S→A₂→B₂→T = 5+1+4）' },
        { label: 'C', text: '10（S→A₂→B₁→T = 5+3+5）' },
        { label: 'D', text: '11（S→A₁→B₁→T = 2+4+5）' },
      ],
      correctAnswer: 'A',
      explanation: '逆向：f(B₁)=5, f(B₂)=4。f(A₁)=min(4+5,2+4)=6，f(A₂)=min(3+5,1+4)=5。f(S)=min(2+6,5+5)=8。路径S→A₁→B₂→T=2+2+4=8。',
      knowledgePoint: 'Bellman方程',
      hint: '从终点往回推：f(i)=min{c(i,j)+f(j)}。',
    },
    {
      qid: 's6-q2',
      title: '阶段与状态定义',
      scene: '用动态规划求解最短路问题。',
      type: 'choice',
      body: '关于"阶段"和"状态"的正确理解是？',
      options: [
        { label: 'A', text: '阶段 = 决策步序（第几步），状态 = 当前所在节点' },
        { label: 'B', text: '阶段 = 节点编号，状态 = 剩余距离' },
        { label: 'C', text: '阶段 = 路径总长度，状态 = 边数' },
        { label: 'D', text: '阶段和状态是同一个概念' },
      ],
      correctAnswer: 'A',
      explanation: '阶段是决策的顺序编号（第1步、第2步…），状态是每阶段面临的局面（当前在哪个节点）。递推公式连接相邻阶段。',
      knowledgePoint: '阶段与状态',
      hint: '"第几步"=阶段，"现在在哪"=状态。',
    },
    {
      qid: 's6-q3',
      title: '资源分配 · 枚举验证',
      scene: '3台设备分配给2个项目。g₁(0)=0,g₁(1)=5,g₁(2)=9,g₁(3)=12。g₂(0)=0,g₂(1)=4,g₂(2)=7,g₂(3)=10。',
      type: 'choice',
      body: '用动态规划求最大总收益，最优分配是？',
      options: [
        { label: 'A', text: '项目1分2台，项目2分1台，总=13' },
        { label: 'B', text: '项目1分1台，项目2分2台，总=12' },
        { label: 'C', text: '项目1分3台，项目2分0台，总=12' },
        { label: 'D', text: '项目1分0台，项目2分3台，总=10' },
      ],
      correctAnswer: 'A',
      explanation: '枚举：x₁=0→0+10=10；x₁=1→5+7=12；x₁=2→9+4=13；x₁=3→12+0=12。最大=13，(2,1)分配。',
      knowledgePoint: '资源分配 · 递推',
      hint: '总数固定为3，枚举所有分配组合取max。',
    },
    {
      qid: 's6-q4',
      title: 'DP vs 分治法',
      scene: '比较动态规划与分治法。',
      type: 'choice',
      body: '以下说法正确的是？',
      options: [
        { label: 'A', text: '分治法子问题相互独立，DP子问题重叠且需存储中间结果' },
        { label: 'B', text: 'DP子问题独立，分治法子问题重叠' },
        { label: 'C', text: '两者无本质区别' },
        { label: 'D', text: '分治法一定比DP快' },
      ],
      correctAnswer: 'A',
      explanation: '分治法（如快排）子问题独立，不重叠；DP（如最短路）子问题大量重叠，用记忆化/表格避免重复计算。这是DP的核心特征。',
      knowledgePoint: '动态规划基本原理',
      hint: 'DP的精髓 = 重叠子问题 + 最优子结构 + 记忆化。',
    },
  ],

  // ========================
  // scene-7: EOQ与库存（3题）
  // ========================
  'scene-7': [
    {
      qid: 's7-q1',
      title: 'EOQ计算',
      scene: '某超市冷链食品：年需求D=2400箱，每次订货成本K=50元，单位持有成本h=2元/箱·年。',
      type: 'input',
      body: '计算经济订货批量 EOQ = √(2DK/h)（只填整数）：',
      options: [],
      correctAnswer: '346',
      tolerance: 5,
      explanation: 'EOQ = √(2×2400×50/2) = √120000 ≈ 346.4 → 取整346箱。年订货次数≈2400/346≈6.9次。',
      knowledgePoint: 'EOQ公式计算',
      hint: '公式 EOQ = √(2DK/h)。K=每次订货成本，h=单位年持有成本。',
    },
    {
      qid: 's7-q2',
      title: '再订货点',
      scene: '接上题。补货提前期 L=5天，日均需求 d=2400/365≈6.58箱/天。要求服务水平95%（Z=1.65），日需求标准差 σd=2箱/天。',
      type: 'choice',
      body: '再订货点 ROP = d·L + Z·σd·√L ≈ ？',
      options: [
        { label: 'A', text: '约 33 + 18 = 51 箱' },
        { label: 'B', text: '约 33 + 8 = 41 箱' },
        { label: 'C', text: '约 33 箱（不考虑安全库存）' },
        { label: 'D', text: '约 33 - 18 = 15 箱' },
      ],
      correctAnswer: 'B',
      explanation: 'ROP = d·L + Z·σd·√L = 6.58×5 + 1.65×2×√5 ≈ 32.9 + 7.38 ≈ 40.3 ≈ 41箱。选B。',
      knowledgePoint: '再订货点 · 安全库存',
      hint: 'ROP = 平均需求×提前期 + 安全库存。安全库存=Z·σ·√L。',
    },
    {
      qid: 's7-q3',
      title: '总成本公式',
      scene: 'EOQ模型中，年总成本 TC(Q) = 订货成本 + 持有成本 = DK/Q + hQ/2。已知D=2400, K=50, h=2。',
      type: 'choice',
      body: '当Q=EOQ=346时，年总成本约为？',
      options: [
        { label: 'A', text: '约 692 元' },
        { label: 'B', text: '约 346 元' },
        { label: 'C', text: '约 1384 元' },
        { label: 'D', text: '约 2400 元' },
      ],
      correctAnswer: 'A',
      explanation: 'TC = DK/Q + hQ/2 = 2400×50/346 + 2×346/2 ≈ 347 + 346 ≈ 693元。EOQ处订货成本=持有成本=Q/2·h=346元，总≈692。',
      knowledgePoint: 'EOQ · 总成本',
      hint: 'EOQ处：订货成本=持有成本=DK/EOQ=EOQ·h/2。总成本=2×其中一项。',
    },
  ],
};

// ===== 学习进度存储 =====
// gameState 新增字段：
//   sceneAnswers: { sceneId: [{qid, correct, answer}] }
//   scenePassed: { sceneId: true }  // 全部答对才标记
let gameState = {
  completedScenes: [],    // 已通关场景（全部答对）
  attemptedScenes: [],    // 已尝试场景（用于解锁下一关）
  currentScene: null,
  wrongKnowledge: {},      // 错题知识点统计
  correctKnowledge: {},   // 正确知识点统计
  answers: {},            // 旧字段兼容
  sceneAnswers: {},       // 每个场景的答题记录
};

function loadState() {
  const saved = localStorage.getItem('logisticsGameState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameState = Object.assign(gameState, parsed);
      // 兼容旧数据：如果没有 attemptedScenes，用 completedScenes 初始化
      if (!gameState.attemptedScenes || gameState.attemptedScenes.length === 0) {
        gameState.attemptedScenes = [...(gameState.completedScenes || [])];
      }
    } catch(e) {}
  }
}

function saveState() {
  localStorage.setItem('logisticsGameState', JSON.stringify(gameState));
}