/* ==========================================================================
   auth.js —— 认证 / 会话 / 角色
   设计要点：
   1) 本文件不出现任何「账号+口令」字面量。演示账号由种子数据（staff / students）
      在运行时携带，登录时按记录逐条比对，口令字段统一名为 pw。
   2) 会话持久化在 localStorage，刷新与跨页（index.html → app.html）保持登录态。
   3) 角色视角：一名教职工可拥有多个角色，顶栏可切换；教职工均可预览学生端视角。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU;
  var SKEY = 'zk_session_v1';

  var ROLE_BY_ID = {
    R_ADMIN: 'admin', R_COLLEGE: 'college', R_ORG: 'organizer',
    R_AUDIT: 'auditor', R_LEAD: 'leader', R_STU: 'student'
  };
  var ROLE_LABEL = {
    admin: '系统管理员', college: '二级学院管理员', organizer: '活动组织者',
    auditor: '分值审核员', leader: '团总支书记', student: '学生'
  };
  var ROLE_SCOPE = {
    admin: '全校', auditor: '全校', college: '本学院',
    leader: '本学院', organizer: '本人负责活动', student: '本人'
  };
  /* 各角色的模块级权限，供「用户管理 / 角色权限」页展示与页面侧校验 */
  var ROLE_PERMS = {
    admin: ['dash', 'act', 'square', 'actmgr', 'audit', 'apply', 'rule', 'tpl', 'grade', 'warn', 'stat', 'screen', 'portal', 'content', 'ai', 'msg', 'user', 'club', 'party', 'flow', 'sys', 'mine', 'myact', 'myscore'],
    college: ['dash', 'act', 'square', 'actmgr', 'audit', 'apply', 'rule', 'grade', 'warn', 'stat', 'msg', 'club', 'party', 'ai', 'mine', 'myact', 'myscore'],
    organizer: ['dash', 'act', 'square', 'actmgr', 'rule', 'grade', 'stat', 'msg', 'club', 'ai', 'mine', 'myact', 'myscore'],
    auditor: ['dash', 'audit', 'apply', 'content', 'grade', 'tpl', 'stat', 'msg', 'ai', 'mine', 'myact', 'myscore'],
    leader: ['dash', 'stat', 'warn', 'grade', 'msg', 'actmgr', 'club', 'party', 'ai', 'mine', 'myact', 'myscore'],
    student: ['mine', 'square', 'myact', 'myscore', 'apply', 'club', 'msg', 'ai']
  };

  var ZA = {
    ROLE_LABEL: ROLE_LABEL,
    ROLE_BY_ID: ROLE_BY_ID,
    ROLE_SCOPE: ROLE_SCOPE,
    ROLE_PERMS: ROLE_PERMS,
    session: null,
    _viewStuId: null
  };

  /* ---------------- 用户解析 ---------------- */
  /** 按账号在 staff / students 中查找，返回 {user, type} 或 null */
  ZA.lookup = function (account) {
    var a = String(account || '').trim();
    if (!a) return null;
    var st = w.DB.find('staff', function (x) { return x.account === a || x.no === a; });
    if (st) return { user: st, type: 'staff' };
    var su = w.DB.find('students', function (x) { return x.account === a || x.sno === a; });
    if (su) return { user: su, type: 'student' };
    return null;
  };

  function rolesOf(user, type) {
    if (type === 'student') return ['student'];
    var out = [];
    (user.roleIds || []).forEach(function (rid) {
      var k = ROLE_BY_ID[rid];
      if (k && out.indexOf(k) < 0) out.push(k);
    });
    if (!out.length) out.push('organizer');
    var ORDER = ['admin', 'college', 'auditor', 'leader', 'organizer', 'student'];
    out.sort(function (a, b) { return ORDER.indexOf(a) - ORDER.indexOf(b); });
    return out;
  }
  ZA.rolesOf = rolesOf;

  function buildSession(user, type) {
    var roles = rolesOf(user, type);
    return {
      id: user.id,
      name: user.name,
      account: user.account || user.sno,
      title: user.title || (type === 'student' ? '学生' : '教职工'),
      college: user.college || '',
      collegeId: user.collegeId || '',
      avatar: String(user.name).slice(-2),
      type: type,
      studentId: type === 'student' ? user.id : '',
      roles: roles,
      role: roles[0],
      at: U.dt(new Date())
    };
  }

  /* ---------------- 登录 / 登出 ---------------- */
  /** @returns {{ok:boolean, msg?:string, session?:object}} */
  ZA.login = function (account, pw) {
    var hit = ZA.lookup(account);
    if (!hit) return { ok: false, msg: '账号不存在，请核对学号 / 工号后重试' };
    var user = hit.user;
    if (hit.type === 'student' && user.status && user.status !== '在籍') {
      return { ok: false, msg: '当前学籍状态为「' + user.status + '」，暂无法登录，请联系学院团委' };
    }
    if (String(user.pw) !== String(pw)) return { ok: false, msg: '登录密码不正确，请重新输入' };
    var s = buildSession(user, hit.type);
    ZA.session = s;
    try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { }
    ZA._viewStuId = null;
    return { ok: true, session: s };
  };

  ZA.logout = function () {
    ZA.session = null;
    ZA._viewStuId = null;
    try { localStorage.removeItem(SKEY); } catch (e) { }
  };

  /** 恢复会话：重新与库中用户对齐，账号被删/停用则失效 */
  ZA.restore = function () {
    var raw = null;
    try { raw = localStorage.getItem(SKEY); } catch (e) { raw = null; }
    if (!raw) { ZA.session = null; return null; }
    var s;
    try { s = JSON.parse(raw); } catch (e) { ZA.session = null; return null; }
    if (!s || !s.account) { ZA.session = null; return null; }
    var hit = ZA.lookup(s.account);
    if (!hit) { ZA.logout(); return null; }
    var fresh = buildSession(hit.user, hit.type);
    fresh.role = (s.role && fresh.roles.indexOf(s.role) >= 0) ? s.role : fresh.roles[0];
    if (hit.type !== 'student' && s.role === 'student') fresh.role = 'student';
    ZA.session = fresh;
    try { localStorage.setItem(SKEY, JSON.stringify(fresh)); } catch (e) { }
    return fresh;
  };

  /* ---------------- 当前视角 ---------------- */
  ZA.role = function () { return ZA.session ? ZA.session.role : 'student'; };
  ZA.isStudent = function () { return ZA.role() === 'student'; };
  ZA.isAdmin = function () { return ZA.role() === 'admin'; };

  ZA.setRole = function (rk) {
    if (!ZA.session) return null;
    var allow = ZA.session.roles.slice();
    if (ZA.session.type !== 'student' && allow.indexOf('student') < 0) allow.push('student');
    if (allow.indexOf(rk) < 0) return null;
    ZA.session.role = rk;
    try { localStorage.setItem(SKEY, JSON.stringify(ZA.session)); } catch (e) { }
    return ZA.session;
  };

  ZA.scopeText = function () {
    var r = ZA.role();
    if (r === 'college' || r === 'leader') {
      return ZA.session && ZA.session.college
        ? ZA.session.college + '（' + ROLE_SCOPE[r] + '）' : ROLE_SCOPE[r];
    }
    return ROLE_SCOPE[r] || '全校';
  };

  ZA.can = function (key) {
    var list = ROLE_PERMS[ZA.role()] || [];
    return list.indexOf(key) >= 0;
  };

  /** 当前生效的数据范围：{collegeId, college} 或 null 表示全校 */
  ZA.scope = function () {
    var r = ZA.role();
    if (r === 'college' || r === 'leader') {
      return { collegeId: ZA.session.collegeId, college: ZA.session.college };
    }
    return null;
  };

  /**
   * 学生端视角对应的学生。学生登录 = 本人；
   * 教职工预览学生端时，取一名「成绩资料最完整」的学生，保证页面有真实内容。
   */
  ZA.viewStudentId = function () {
    if (ZA.isStudent() && ZA.session && ZA.session.studentId) return ZA.session.studentId;
    if (ZA._viewStuId && w.DB.get('students', ZA._viewStuId)) return ZA._viewStuId;
    var students = w.DB.col('students');
    if (!students.length) return '';
    var best = null, bestN = -1;
    var byStu = U.groupBy(w.DB.col('scoreRecs'), function (r) { return r.studentId; });
    students.forEach(function (s) {
      var n = (byStu[s.id] || []).length;
      if (n > bestN) { bestN = n; best = s; }
    });
    ZA._viewStuId = best ? best.id : students[0].id;
    return ZA._viewStuId;
  };
  ZA.viewStudent = function () {
    var id = ZA.viewStudentId();
    return id ? w.DB.get('students', id) : null;
  };

  w.ZA = ZA;
})(window);
