/* ==========================================================================
   种子数据 · 汇总装配 ZK.seedData()
   ========================================================================== */
window.ZK = window.ZK || {};

(function () {
  "use strict";

  ZK.seedData = function () {
    const S = ZK.seed;

    const users = S.users();
    const permissions = S.permissions();
    const courses = S.courses();
    const classes = S.classes();
    const learners = S.learners();
    const knowledgePoints = S.knowledgePoints();

    return {
      __v: ZK.db ? ZK.db.version : 1,
      updatedAt: Date.now(),
      meta: {
        system: "智课云 · AI教学赋能平台",
        term: "2025-2026学年第一学期",
        seededAt: Date.now(),
        collections: 0,
      },
      users: users,
      permissions: permissions,
      courses: courses,
      classes: classes,
      learners: learners,
      knowledgeBases: S.knowledgeBases(),
      kbDocs: S.kbDocs(),
      kbFragments: S.kbFragments(),
      resources: S.resources(),
      libraryBooks: S.libraryBooks(),
      scenes: S.scenes(),
      practiceSessions: S.practiceSessions(),
      imageSubmissions: S.imageSubmissions(),
      tasks: S.tasks(),
      submissions: S.submissions(),
      safetyKeywords: S.safetyKeywords(),
      ignoreWords: S.ignoreWords(),
      nameLists: S.nameLists(),
      posts: S.posts(),
      safetyDocs: S.safetyDocs(),
      safetyVideos: S.safetyVideos(),
      safetyRecords: S.safetyRecords(),
      knowledgePoints: knowledgePoints,
      learningRecords: S.learningRecords(learners, knowledgePoints),
      graphNodes: S.graphNodes(),
      graphEdges: S.graphEdges(),
      literature: S.literature(),
      portalConfig: [S.portalConfig()],
      dataSources: S.dataSources(),
      notifications: S.notifications(),
      notices: S.notices(),
      // 运行期产生的数据集合（后续由页面写入）
      kbSyncLogs: [],
      importBatches: [],
      retrievalLogs: [],
      portalSaves: [],
      pathPlans: [],
      profiles: [],
      tasksLogs: [],
      logs: [
        {
          id: "log_seed",
          at: Date.now() - 86400000 * 30,
          action: "系统初始化",
          detail: "课程数据、文献库、知识库与学情数据完成初始化装载",
          level: "info",
          operator: "系统",
          account: "-",
          ip: "127.0.0.1",
        },
      ],
    };
  };
})();
