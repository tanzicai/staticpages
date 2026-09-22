/* ==========================================================================
   seed/index.js —— 组装全部种子数据
   暴露 window.ZSEED.build() → 完整数据对象
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, B = w.ZSEED_BASE;

  var SEED_VERSION = 1;   /* 修改种子结构时 +1，可自动触发前端重建 */

  /**
   * 业务时间合理性校验（构建完成后的最后一道关卡）
   * 规则：任何「已发生」的业务时间都不得晚于系统当前时间（meta.now）。
   * 背景：报告时间 / 报名时间 / 签到时间 / 认定时间若落在未来，会出现
   *       「报名时间在未来」这类失真数据，并让按时间倒序的列表把新数据挤到后面，
   *       演示时看不到刚产生的记录。此处统一兜底，避免逐个生成点遗漏。
   */
  var TIME_KEYS = ['at', 'createdAt', 'handledAt', 'learnedAt', 'joinedAt', 'submittedAt', 'reviewedAt'];
  function sanitizeTimes(db) {
    var now = String(db.meta.now || '');
    if (!now) return db;
    Object.keys(db).forEach(function (k) {
      var arr = db[k];
      if (!Array.isArray(arr)) return;
      arr.forEach(function (rec) {
        if (!rec || typeof rec !== 'object') return;
        TIME_KEYS.forEach(function (tk) {
          var v = rec[tk];
          if (typeof v !== 'string' || !/^20\d\d-\d\d-\d\d/.test(v)) return;
          if (v > now) rec[tk] = now;   /* 收敛到当前时间，保持“刚刚发生”的语义 */
        });
      });
    });
    return db;
  }

  function build() {
    var rand = U.seedRand(20260922);
    var org = w.ZSEED_ORG.build(rand);
    var academic = w.ZSEED_ACADEMIC.build();
    var act = w.ZSEED_ACTIVITY.build(rand, org);
    var community = w.ZSEED_COMMUNITY.build(rand, org);
    var ops = w.ZSEED_OPS.build(rand, org, act, academic);

    var db = {
      meta: {
        version: SEED_VERSION,
        school: B.SCHOOL,
        domain: B.DOMAIN,
        term: B.TERM,
        terms: B.TERMS,
        grades: B.GRADES,
        now: B.NOW,
        builtAt: B.NOW
      },
      colleges: org.colleges,
      majors: org.majors,
      classes: org.classes,
      students: org.students,
      staff: org.staff,
      roles: org.roles,
      orgTree: org.orgTree,

      schemes: academic.schemes,
      creditTypes: academic.creditTypes,
      creditUnits: academic.creditUnits,
      creditProjects: academic.creditProjects,
      tpls: academic.tpls,

      cats: act.cats,
      activities: act.activities,
      enrollments: act.enrollments,
      signins: act.signins,
      works: act.works,
      scoreApps: act.scoreApps,
      scoreRecs: act.scoreRecs,
      blacklist: act.blacklist,
      actRules: act.actRules,
      formFields: act.formFields,

      clubs: community.clubs,
      clubMembers: community.clubMembers,
      clubApps: community.clubApps,
      party: community.party,
      flowApps: community.flowApps,

      msgs: ops.msgs,
      contents: ops.contents,
      contentTopics: ops.contentTopics,
      sensitiveWords: ops.sensitiveWords,
      portal: ops.portal,
      screenCfg: ops.screenCfg,
      ai: ops.ai,
      warnRules: ops.warnRules,
      warnings: ops.warnings,
      logs: ops.logs,
      safety: ops.safety
    };
    return sanitizeTimes(db);
  }

  w.ZSEED = { build: build, version: SEED_VERSION, aggregate: w.ZSEED_OPS.aggregate, sanitizeTimes: sanitizeTimes };
})(window);
