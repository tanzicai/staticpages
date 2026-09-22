/* ==========================================================================
   seed/index.js —— 组装全部种子数据
   暴露 window.ZSEED.build() → 完整数据对象
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, B = w.ZSEED_BASE;

  var SEED_VERSION = 1;   /* 修改种子结构时 +1，可自动触发前端重建 */

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
    return db;
  }

  w.ZSEED = { build: build, version: SEED_VERSION, aggregate: w.ZSEED_OPS.aggregate };
})(window);
