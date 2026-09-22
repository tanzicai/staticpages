/* ==========================================================================
   demo.js —— 演示身份切换（PC 端与手机端共用）
   设计要点：
   · 源码中不出现任何「账号 + 口令」字面量；演示账号由种子数据（staff / students）
     在运行时携带，这里只负责按角色挑出账号并调用 ZA.login(user.account, user.pw)。
   · 支持 6 类身份：系统管理员 / 二级学院管理员 / 活动组织者 / 分值审核员 /
     团总支书记 / 学生。演示只需「管理员 + 学生」两个主视角，其余作为补充。
   · 手机端（m.html）与 PC 端（app.html）共用同一个 localStorage 会话键，
     因此在 PC 切到学生身份后，手机端打开即为学生视角，反之亦然。
   ========================================================================== */
(function (w) {
  'use strict';

  var ROLE_TO_ID = {
    admin: 'R_ADMIN', college: 'R_COLLEGE', organizer: 'R_ORG',
    auditor: 'R_AUDIT', leader: 'R_LEAD', student: 'R_STU'
  };

  /** 该身份对应的「人」：返回 {user, type} 或 null */
  function pick(role) {
    var DB = w.DB;
    if (role === 'student') {
      /* 演示主视角学生：优先选择「履历完整」的学生，保证学生端演示不空转——
         要求同时具备 ① 有报名记录 ② 有已签到记录 ③ 有一场待签到的活动（可现场签到）。
         三项都满足时优先取排序最前的一位，否则逐级放宽条件。 */
      var all = (DB.col('students') || []).filter(function (s) { return !s.status || s.status === '在籍'; });
      if (!all.length) all = (DB.col('students') || []).slice();
      var scored = all.map(function (s) {
        var es = DB.filter('enrollments', function (e) { return e.studentId === s.id; });
        var signed = es.filter(function (e) { return e.signStatus === '已签到'; }).length;
        var signable = es.filter(function (e) {
          if (e.status !== '已通过' || e.signStatus === '已签到') return false;
          var a = DB.get('activities', e.actId);
          return a && (a.status === '待开始' || a.status === '进行中');
        }).length;
        return { s: s, enroll: es.length, signed: signed, signable: signable };
      });
      var best = scored.filter(function (x) { return x.enroll && x.signed && x.signable; })[0]
        || scored.filter(function (x) { return x.enroll && x.signed; })[0]
        || scored.filter(function (x) { return x.enroll; })[0]
        || scored[0];
      var stu = best ? best.s : null;
      return stu ? { user: stu, type: 'student' } : null;
    }
    var rid = ROLE_TO_ID[role];
    if (!rid) return null;
    var staff = (DB.col('staff') || []).filter(function (t) {
      return (t.roleIds || []).indexOf(rid) >= 0;
    })[0];
    /* 角色没人担任时退回管理员，保证演示不中断 */
    if (!staff && role !== 'admin') {
      staff = (DB.col('staff') || []).filter(function (t) { return (t.roleIds || []).indexOf('R_ADMIN') >= 0; })[0];
    }
    return staff ? { user: staff, type: 'staff' } : null;
  }

  /**
   * 以指定身份登录（演示用）。
   * @param {string} role admin|college|organizer|auditor|leader|student
   * @returns {{ok:boolean, msg?:string, session?:object, role?:string}}
   */
  function loginAs(role) {
    var hit = pick(role);
    if (!hit) return { ok: false, msg: '演示数据中未找到「' + role + '」身份的账号' };
    var res = w.ZA.login(hit.user.account || hit.user.sno, hit.user.pw);
    if (!res.ok) return res;
    /* 教职工账号可能挂着多个角色，登录后显式切到目标身份 */
    if (res.session.roles && res.session.roles.indexOf(role) >= 0 && res.session.role !== role) {
      w.ZA.setRole(role);
    }
    return { ok: true, session: w.ZA.session, role: w.ZA.role() };
  }

  /** 当前会话是否可切换到某身份 */
  function canSwitch(role) {
    var s = w.ZA.session;
    if (!s) return false;
    if (s.type === 'student') return role === 'student';
    if (role === 'student') return true;
    return (s.roles || []).indexOf(role) >= 0;
  }

  /** 列出当前会话所有可切换身份（用于顶栏与手机端「我的」页） */
  function switchable() {
    var LABEL = w.ZA.ROLE_LABEL || {};
    var out = [];
    Object.keys(ROLE_TO_ID).forEach(function (r) {
      if (canSwitch(r)) out.push({ role: r, label: LABEL[r] || r });
    });
    return out;
  }

  /** 一句话描述当前视角，用于页面顶部提示 */
  function describe() {
    var s = w.ZA.session;
    if (!s) return '未登录';
    return s.name + ' · ' + (w.ZA.ROLE_LABEL[w.ZA.role()] || '') + ' · 数据范围：' + w.ZA.scopeText();
  }

  w.ZDEMO = {
    ROLE_TO_ID: ROLE_TO_ID,
    pick: pick,
    loginAs: loginAs,
    canSwitch: canSwitch,
    switchable: switchable,
    describe: describe,
    /** PC 与手机端互跳（保留会话，仅换入口） */
    toMobile: function () { location.href = 'm.html' + location.hash; },
    toDesktop: function () { location.href = 'app.html'; }
  };
})(window);
