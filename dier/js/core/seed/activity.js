/* ==========================================================================
   seed/activity.js —— 活动 / 报名 / 签到 / 作品 / 分值记录与申报 /
                       黑名单 / 活动规则 / 报名表单字段
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, B = w.ZSEED_BASE;

  function build(rand, org) {
    var out = {};
    var students = org.students;
    var catNames = B.CATS.map(function (c) { return c.name; });

    /* =============== 活动 =============== */
    var activities = [];
    var seq = 0;

    catNames.forEach(function (catName, ci) {
      var titles = B.ACT_TITLES[catName];
      var n = titles.length;
      for (var i = 0; i < n; i++) {
        seq++;
        var title = titles[i];
        var year = 2025, mon;
        if (ci <= 2) { year = 2026; mon = ((i * 3 + ci) % 9) + 1; }
        else if (ci === 3) { year = 2026; mon = i < 4 ? 8 + (i % 2) : 5 + (i % 4); }
        else { year = 2026; mon = i < 4 ? 7 + (i % 3) : 3 + (i % 5); }
        var day = U.rndInt(rand, 3, 26);
        var dh = U.rndInt(rand, 8, 19);
        var start = U.at(year, mon, day, dh, [0, 10, 30][U.rndInt(rand, 0, 2)]);
        var end = U.at(year, mon, Math.min(28, day + U.rndInt(rand, 0, 2)), Math.min(21, dh + U.rndInt(rand, 1, 3)), [0, 30][U.rndInt(rand, 0, 1)]);

        var nowD = U.toDate(B.NOW), stD = U.toDate(start), enD = U.toDate(end);
        var status = '已结束';
        if (enD > nowD) status = '进行中';
        if (stD > nowD) status = '待开始';
        if (seq % 19 === 5) status = '待审核';
        if (seq % 23 === 8) status = '草稿';
        if (seq % 31 === 11) status = '已驳回';
        // 关键演示锚点
        if (catName === '思想素养' && i === 0) { status = '待审核'; start = U.at(2026, 10, 15, 14, 0); end = U.at(2026, 10, 15, 17, 0); }
        if (catName === '思想素养' && i === 1) { status = '待审核'; start = U.at(2026, 10, 20, 9, 0); end = U.at(2026, 10, 20, 11, 30); }
        if (catName === '专业素养' && i === 0) { status = '进行中'; start = U.at(2026, 9, 18, 13, 30); end = U.at(2026, 9, 30, 17, 30); }
        if (catName === '创新创业' && i === 0) { status = '进行中'; start = U.at(2026, 9, 12, 9, 0); end = U.at(2026, 9, 25, 18, 0); }
        if (catName === '文化素养' && i === 0) { status = '待开始'; start = U.at(2026, 10, 8, 14, 0); end = U.at(2026, 10, 8, 17, 0); }

        var cat = B.catOf(catName);
        var credit = [0.5, 1, 1, 1.5][U.rndInt(rand, 0, 3)];
        var hours = Math.round(credit * 16);
        var points = Math.round(credit * 10);
        var form = rand() < 0.68 ? '线下' : '线上';
        var isSchool = rand() < 0.45;
        var hostObj = isSchool ? null : B.COLLEGES[U.rndInt(rand, 0, B.COLLEGES.length - 1)];
        var host = isSchool ? U.rndPick(rand, B.HOSTS_EXTRA) : hostObj.name;

        /* 报名项目 */
        var items = [];
        var hasItems = rand() < 0.62;
        var itemNames = ['主体活动', '赛前培训营', '作品征集通道', '观众通道'];
        var icount = hasItems ? U.rndInt(rand, 2, 3) : 1;
        for (var q = 0; q < icount; q++) {
          var scopeCollege = U.rndPick(rand, B.COLLEGES);
          items.push({
            id: 'IT' + seq + '-' + (q + 1),
            name: hasItems ? itemNames[q] : '统一报名',
            enrollStart: U.dt(U.toDate(start), false) + ' 00:00',
            enrollEnd: U.dt(U.toDate(end), false) + ' 23:59',
            limit: U.rndInt(rand, 30, 200),
            needForm: hasItems && q === 0,
            formFields: (hasItems && q === 0) ? ['姓名', '学号', '学院', '联系电话', '个人简介'] : ['姓名', '学号'],
            scope: (!hasItems || q === icount - 1) ? ['全体学生'] : [scopeCollege.name],
            cancelRule: '报名截止前 2 小时可取消；逾期需联系活动组织者',
            onSite: rand() < 0.3,
            enrolled: 0
          });
        }

        var signModes = [];
        if (rand() < 0.92) signModes.push('时间限制签到');
        if (rand() < 0.55) signModes.push('位置签到');
        if (rand() < 0.75) signModes.push('扫码签到');

        var needWork = rand() < 0.36;
        activities.push({
          id: 'A' + U.pad(seq),
          title: title,
          cat: catName, catColor: cat.color, catLight: cat.lc, catGrad: cat.grad,
          level: isSchool ? '校级' : '院级',
          host: host, hostType: isSchool ? '职能部门 / 校级组织' : '二级学院',
          collegeId: hostObj ? hostObj.id : '',
          form: form,
          place: form === '线上' ? '线上平台（腾讯会议 / 学习通直播）' : U.rndPick(rand, B.PLACES),
          mapPin: form === '线下' ? { lng: 106.45 + rand() * 0.06, lat: 29.56 + rand() * 0.05, name: '重庆示范职业学院 · 主校区' } : null,
          start: start, end: end,
          enrollStart: items[0].enrollStart, enrollEnd: items[0].enrollEnd,
          credit: credit, hours: hours, points: points,
          maxNum: U.sum(items, function (x) { return x.limit; }),
          signModes: signModes.length ? signModes : ['时间限制签到'],
          signRefresh: 60,
          status: status,
          needAudit: rand() < 0.6,
          flowTpl: isSchool ? '校级活动三级审核' : '院级活动两级审核',
          desc: '本次活动属于「' + catName + '」类别，由' + host + '主办。活动围绕' + title.replace(/["“”]/g, '') +
            '主题开展，包含主题分享、分组研讨与实践环节。参与学生需完成全程签到并按要求提交材料，方可认定 ' +
            credit + ' 学分（' + hours + ' 学时 / ' + points + ' 积分）。',
          files: rand() < 0.42 ? ['活动实施方案.docx', '活动安全预案.pdf'] : [],
          items: items,
          needWork: needWork,
          workRule: { formats: ['jpg', 'png', 'mp4', 'pdf'], maxCount: U.rndInt(rand, 1, 3), review: rand() < 0.72, multiStage: rand() < 0.4, expert: rand() < 0.5 },
          voteRule: { enabled: rand() < 0.3, start: U.dt(U.toDate(end), false) + ' 00:00', end: U.dt(U.toDate(end), false) + ' 23:59', perDay: 1, rule: '实名投票，每人每日 1 票' },
          awards: ['一等奖 1 名', '二等奖 2 名', '三等奖 3 名', '优秀奖 5 名'],
          certCount: U.rndInt(rand, 0, 24),
          certTpl: 'TP' + U.rndInt(rand, 1, 5),
          showTpl: '样式' + (U.rndInt(rand, 1, 6)),
          audiences: isSchool ? ['全体学生'] : [hostObj.name],
          admins: [],
          viewCount: U.rndInt(rand, 120, 2400),
          createdBy: U.rndPick(rand, ['罗宇泽', '黄静怡', '陈立诚']),
          createdAt: U.dt(U.toDate(start), false) + ' 09:00',
          ownerCollege: hostObj ? hostObj.name : '校团委'
        });
      }
    });

    /* 协同管理员（活动管理 ★第 4 条） */
    activities.forEach(function (a, i) {
      var names = ['罗宇泽', '黄静怡', '郑少华', '周雅婷'];
      a.admins = [
        { id: 'T003', name: a.createdBy || '罗宇泽', role: '主管理员', perms: ['全部权限'], at: a.createdAt },
        { id: 'T1' + U.pad((i % 8) + 1), name: names[(i + 1) % names.length], role: '协同管理员', perms: i % 3 === 0 ? ['报名审核', '作品评审', '签到管理'] : ['报名审核', '签到管理'], at: B.addDays(a.createdAt, 1) }
      ];
      a.infoChanges = i % 5 === 0 ? [
        { at: B.addDays(a.createdAt, 2), by: '罗宇泽', field: '活动时间', from: '原定 ' + U.dt(U.toDate(a.start), false) + ' 上午', to: '调整为 ' + a.start, notify: true, notified: 46 },
        { at: B.addDays(a.createdAt, 3), by: '黄静怡', field: '活动地点', from: '大学生活动中心 201', to: a.place, notify: true, notified: 46 }
      ] : [];
    });
    out.activities = activities;
    out.cats = B.CATS;

    /* =============== 报名 / 签到 / 作品 / 认定记录 =============== */
    var enrollments = [], signins = [], works = [], scoreRecs = [];
    var eSeq = 0, wSeq = 0;

    activities.forEach(function (a) {
      if (a.status === '草稿') return;
      var pool = pickStudents(rand, a, students);
      var used = {};
      a.items.forEach(function (it) {
        var want = U.rndInt(rand, 6, 16);
        var got = 0;
        for (var t = 0; t < want * 3 && got < want; t++) {
          var stu = pool[Math.floor(rand() * pool.length)];
          if (!stu || used[stu.id]) continue;
          used[stu.id] = 1; got++;
          eSeq++;
          var eStatus = '已通过';
          if (a.status === '待审核' || a.status === '已驳回') eStatus = '待审核';
          else if (a.needAudit && rand() < 0.16) eStatus = '待审核';
          else if (rand() < 0.035) eStatus = '已驳回';
          var eDay = U.toDate(it.enrollStart) || U.toDate(a.start);
          var eAt = U.dt(eDay, false) + ' ' + U.pad(U.rndInt(rand, 8, 22)) + ':' + U.pad(U.rndInt(rand, 0, 59));
          /* 报名阶段不判定签到：签到状态统一由签到记录反推，避免两处各自随机导致口径矛盾 */
          enrollments.push({
            id: 'E' + (10000 + eSeq), actId: a.id, actTitle: a.title, cat: a.cat,
            itemId: it.id, itemName: it.name,
            studentId: stu.id, sno: stu.sno, name: stu.name, gender: stu.gender,
            collegeId: stu.collegeId, college: stu.college, major: stu.major, className: stu.className, grade: stu.grade, contact: stu.contact,
            at: eAt, status: eStatus,
            reviewer: eStatus === '已通过' ? '罗宇泽' : (eStatus === '已驳回' ? '罗宇泽' : ''),
            note: eStatus === '已驳回' ? '报名信息与学籍信息不一致，请核对后重新提交' : '',
            onSite: it.onSite,
            signStatus: '未签到',   /* 稍后由签到记录回写 */
            formData: it.needForm ? { 联系电话: stu.contact, 个人简介: '本人对本次活动主题很感兴趣，希望在实践中提升综合能力。' } : null,
            importBatch: ''
          });
        }
      });
      // item.enrolled 按项目独立计数（在报名生成完成后统一回填）
      a.items.forEach(function (it) {
        it.enrolled = enrollments.filter(function (e) { return e.actId === a.id && e.itemId === it.id; }).length;
      });

      /* 签到记录：只对「已通过」的报名生成，并把签到结果回写到报名记录（单一数据源） */
      enrollments.filter(function (e) { return e.actId === a.id; }).forEach(function (e) {
        /* 未通过审核的报名不存在签到行为 */
        if (e.status !== '已通过') { e.signStatus = '未签到'; return; }
        /* 活动未开始（或活动本身尚未通过审核）时无签到记录 */
        if (a.status !== '进行中' && a.status !== '已结束') { e.signStatus = '未签到'; return; }
        var ok = a.status === '进行中' ? rand() < 0.62 : rand() < 0.84;
        var method = a.signModes[U.rndInt(rand, 0, a.signModes.length - 1)] || '扫码签到';
        var base = U.toDate(a.start);
        var sAt = U.dt(base, false) + ' ' + U.pad(U.rndInt(rand, 13, 15)) + ':' + U.pad(U.rndInt(rand, 0, 59));
        e.signStatus = ok ? '已签到' : (a.status === '已结束' ? '缺勤' : '未签到');
        signins.push({
          id: 'G' + (20000 + signins.length), actId: a.id, actTitle: a.title, itemName: e.itemName,
          studentId: e.studentId, name: e.name, sno: e.sno, college: e.college, className: e.className,
          method: method,
          at: ok ? sAt : '',
          status: ok ? (rand() < 0.86 ? '已签退' : '已签到') : '缺勤',
          place: ok ? (method === '位置签到' ? '位置校验通过 · 距活动地点 32 米' : '校内网络校验通过') : '未检测到签到记录',
          device: U.rndPick(rand, ['iOS 移动端', 'Android 移动端', '微信小程序']),
          makeUp: false
        });
      });

      /* 作品 */
      if (a.needWork && (a.status === '已结束' || a.status === '进行中' || a.status === '待开始')) {
        var wpool = enrollments.filter(function (e) { return e.actId === a.id && e.status === '已通过'; });
        var wn = Math.min(U.rndInt(rand, 2, 7), wpool.length);
        for (var i = 0; i < wn; i++) {
          var e0 = wpool[U.rndInt(rand, 0, wpool.length - 1)];
          if (!e0) continue;
          wSeq++;
          var st = rand() < 0.5 ? '已通过' : (rand() < 0.62 ? '待审核' : '已驳回');
          works.push({
            id: 'W' + (3000 + wSeq), actId: a.id, actTitle: a.title, cat: a.cat,
            studentId: e0.studentId, name: e0.name, sno: e0.sno, college: e0.college, className: e0.className,
            title: a.title.slice(0, 8) + '参赛作品 · ' + e0.name,
            type: U.rndPick(rand, ['图片', '视频', '文档', '图片']),
            size: (U.rndInt(rand, 200, 9000) / 100).toFixed(1) + ' MB',
            at: U.dt(U.toDate(a.end), false) + ' ' + U.pad(U.rndInt(rand, 9, 22)) + ':' + U.pad(U.rndInt(rand, 0, 59)),
            status: st,
            score: st === '已通过' ? U.rndInt(rand, 72, 98) : 0,
            expert: st === '已通过' ? [
              { name: '李专家（校外）', score: U.rndInt(rand, 70, 98), note: '主题鲜明，完成度较高' },
              { name: '王专家（校内）', score: U.rndInt(rand, 70, 98), note: '表达清晰，建议补充数据支撑' }
            ] : [],
            votes: U.rndInt(rand, 0, 460),
            award: st === '已通过' && rand() < 0.18 ? U.rndPick(rand, ['一等奖', '二等奖', '三等奖', '优秀奖']) : '',
            certNo: st === '已通过' && rand() < 0.2 ? 'CERT-2026-' + U.rndInt(rand, 1000, 9999) : '',
            note: st === '已驳回' ? '作品与活动主题不符，请修改后重新提交' : '',
            stage: '终审'
          });
        }
      }

      /* 活动认定分值（活动结束后自动认定） */
      if (a.status === '已结束') {
        enrollments.filter(function (e) {
          return e.actId === a.id && e.status === '已通过' && e.signStatus === '已签到';
        }).forEach(function (e) {
          scoreRecs.push({
            id: 'SR' + (40000 + scoreRecs.length),
            studentId: e.studentId,
            actId: a.id, actTitle: a.title, cat: a.cat,
            credit: a.credit, hours: a.hours, points: a.points, level: a.level,
            source: '活动认定', status: '已认定',
            at: U.dt(U.toDate(a.end), false) + ' 18:00',
            term: B.termOf(a.start)
          });
        });
      }
      a._used = null;
    });
    /* =============== 报名覆盖度补齐（保证任何学生打开学生端都有内容） ===============
       背景：随机抽样会让部分学生一条报名都没有，学生端「我报名的」「去签到」将整页空白，
             演示时无法完成「学生端报名签到」这一环节。
       做法：① 对零报名的学生补 1—2 条历史报名（已结束活动 + 已签到）；
             ② 首位学生（PC / 移动端演示的主视角）补一套完整履历：
                待审核 1 条、已驳回 1 条、已结束已签到 3 条、
                以及 1 条「进行中且未签到」的报名，用于演示现场扫码 / 位置签到。
       ======================================================================= */
    (function () {
      var byStu = U.groupBy(enrollments, function (e) { return e.studentId; });
      /* 可用于补录的活动：已结束优先，其次进行中 / 待开始 */
      var ended = activities.filter(function (a) { return a.status === '已结束'; });
      var live = activities.filter(function (a) { return a.status === '进行中'; });
      var upcoming = activities.filter(function (a) { return a.status === '待开始'; });
      var eSeq2 = function () { return 'E' + (10000 + (++eSeq)); };

      function addEnroll(stu, a, status, signStatus) {
        var it = (a.items || [])[0] || { id: 'IT', name: '默认项目', onSite: false, needForm: false };
        var d = U.toDate(it.enrollStart) || U.toDate(a.start);
        var e = {
          id: eSeq2(), actId: a.id, actTitle: a.title, cat: a.cat,
          itemId: it.id, itemName: it.name,
          studentId: stu.id, sno: stu.sno, name: stu.name, gender: stu.gender,
          collegeId: stu.collegeId, college: stu.college, major: stu.major,
          className: stu.className, grade: stu.grade, contact: stu.contact,
          at: U.dt(d, false) + ' ' + U.pad(U.rndInt(rand, 8, 22)) + ':' + U.pad(U.rndInt(rand, 0, 59)),
          status: status,
          reviewer: status === '待审核' ? '' : '罗宇泽',
          note: status === '已驳回' ? '报名信息与学籍信息不一致，请核对后重新提交' : '',
          onSite: !!it.onSite, signStatus: signStatus || '未签到',
          formData: it.needForm ? { 联系电话: stu.contact, 个人简介: '本人对本次活动主题很感兴趣，希望在实践中提升综合能力。' } : null,
          importBatch: ''
        };
        enrollments.push(e);
        if (signStatus === '已签到') {
          signins.push({
            id: 'G' + (20000 + signins.length), actId: a.id, actTitle: a.title, itemName: e.itemName,
            studentId: stu.id, name: stu.name, sno: stu.sno, college: stu.college, className: stu.className,
            method: (a.signModes || [])[0] || '扫码签到',
            at: U.dt(U.toDate(a.start), false) + ' 14:' + U.pad(U.rndInt(rand, 0, 59)),
            status: '已签退',
            place: '校内网络校验通过',
            device: U.rndPick(rand, ['iOS 移动端', 'Android 移动端', '微信小程序']),
            makeUp: false
          });
        }
        return e;
      }

      /* ① 零报名学生补齐 */
      students.forEach(function (stu) {
        if ((byStu[stu.id] || []).length) return;
        var pickA = ended[U.rndInt(rand, 0, Math.max(0, ended.length - 1))];
        if (pickA) addEnroll(stu, pickA, '已通过', '已签到');
        if (ended.length > 1 && rand() < 0.45) {
          var pickB = ended[U.rndInt(rand, 0, ended.length - 1)];
          if (pickB && pickB.id !== (pickA || {}).id) addEnroll(stu, pickB, '已通过', rand() < 0.8 ? '已签到' : '缺勤');
        }
      });

      /* ② 演示主视角学生：完整履历 */
      var demo = students[0];
      if (demo) {
        var demoActs = {};
        (byStu[demo.id] || []).forEach(function (e) { demoActs[e.actId] = 1; });
        var freeEnded = ended.filter(function (a) { return !demoActs[a.id]; });

        /* 3 条已结束且已签到的履历 */
        freeEnded.slice(0, 3).forEach(function (a) { addEnroll(demo, a, '已通过', '已签到'); demoActs[a.id] = 1; });

        /* 1 条「进行中且未签到」——用于演示现场扫码 / 位置签到 */
        var signable = live.filter(function (a) { return !demoActs[a.id]; })[0]
          || upcoming.filter(function (a) { return !demoActs[a.id]; })[0];
        if (signable) { addEnroll(demo, signable, '已通过', '未签到'); demoActs[signable.id] = 1; }

        /* 1 条待审核（演示组织者审批报名） */
        var pend = upcoming.filter(function (a) { return !demoActs[a.id]; })[0]
          || ended.filter(function (a) { return !demoActs[a.id]; })[0];
        if (pend) { addEnroll(demo, pend, '待审核', '未签到'); demoActs[pend.id] = 1; }

        /* 1 条已驳回（演示报名审核不通过） */
        var rej = ended.filter(function (a) { return !demoActs[a.id]; })[0]
          || upcoming.filter(function (a) { return !demoActs[a.id]; })[0];
        if (rej) { addEnroll(demo, rej, '已驳回', '未签到'); demoActs[rej.id] = 1; }
      }

      /* ③ 回填各报名项目的已报名人数（补齐后需重算） */
      activities.forEach(function (a) {
        (a.items || []).forEach(function (it) {
          it.enrolled = enrollments.filter(function (e) { return e.actId === a.id && e.itemId === it.id; }).length;
        });
      });

      /* ④ 一致性归一：报名上的签到状态必须与签到记录完全对应 */
      var signByKey = {};
      signins.forEach(function (g) { signByKey[g.actId + '|' + g.studentId] = g; });
      enrollments.forEach(function (e) {
        var g = signByKey[e.actId + '|' + e.studentId];
        if (e.status !== '已通过') { e.signStatus = '未签到'; return; }
        if (!g || !g.at) {
          var act = activities.filter(function (x) { return x.id === e.actId; })[0] || {};
          e.signStatus = act.status === '已结束' ? '缺勤' : '未签到';
        } else {
          e.signStatus = '已签到';
        }
      });
    })();

    out.enrollments = enrollments;
    out.signins = signins;
    out.works = works;

    /* =============== 分值申报 =============== */
    var apps = [];
    var KINDS = [
      { type: '竞赛获奖', cat: '专业素养', titles: ['重庆市职业院校技能大赛二等奖', '全国大学生数学建模竞赛重庆赛区三等奖', '“挑战杯”校级一等奖', '蓝桥杯程序设计大赛省级优秀奖'], credit: 1.5, hours: 24, points: 15 },
      { type: '竞赛获奖', cat: '创新创业', titles: ['“互联网+”创新创业大赛校级银奖', '重庆市大学生创新创业训练计划立项'], credit: 1, hours: 16, points: 10 },
      { type: '荣誉奖励', cat: '思想素养', titles: ['校级优秀共青团员', '校优秀学生干部', '社会实践先进个人', '优秀青年志愿者'], credit: 0.5, hours: 8, points: 5 },
      { type: '荣誉奖励', cat: '文化素养', titles: ['校园文化艺术节优秀组织者', '校运会会徽设计入围奖'], credit: 0.5, hours: 8, points: 5 },
      { type: '线下活动', cat: '社会实践', titles: ['暑期“三下乡”社会实践（自行组队）', '校外志愿服务 32 小时', '社区实践计划（校外）'], credit: 0.5, hours: 8, points: 5 },
      { type: '线下活动', cat: '社会工作', titles: ['校外青少年宫助教履职', '社区网格志愿服务岗'], credit: 0.5, hours: 8, points: 5 }
    ];
    for (var i = 0; i < 46; i++) {
      var kind = KINDS[i % KINDS.length];
      var stu = students[U.rndInt(rand, 0, students.length - 1)];
      var st = (i % 5 === 0) ? '待初审' : (i % 5 === 1) ? '待终审' : (i % 7 === 0) ? '已驳回' : '已通过';
      var at = U.at(2026, U.rndInt(rand, 6, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 8, 21), U.rndInt(rand, 0, 59));
      apps.push({
        id: 'SA' + (5000 + i),
        studentId: stu.id, sno: stu.sno, name: stu.name,
        collegeId: stu.collegeId, college: stu.college, major: stu.major, className: stu.className, grade: stu.grade,
        type: '积分/学分/学时', kind: kind.type, cat: kind.cat,
        title: kind.titles[i % kind.titles.length],
        credit: kind.credit, hours: kind.hours, points: kind.points,
        evidence: U.rndPick(rand, ['获奖证书扫描件.pdf', '活动照片与签到表.zip', '主办单位证明.docx', '志愿服务时长证明.pdf']),
        files: [U.rndPick(rand, ['获奖证书.pdf', '主办单位证明.docx']), U.rndPick(rand, ['现场照片.jpg', '签到表.xlsx'])],
        at: at, status: st,
        step: st === '待初审' ? 1 : st === '待终审' ? 2 : 3,
        flow: [
          { node: '提交申请', actor: stu.name, role: '学生', status: 'done', at: at, note: '提交材料 2 份' },
          { node: '学院初审', actor: '黄静怡', role: '二级学院管理员', status: st === '待初审' ? 'cur' : ((st === '已驳回' && i % 2 === 0) ? 'rej' : 'done'), at: st === '待初审' ? '' : B.addDays(at, 1), note: (st === '已驳回' && i % 2 === 0) ? '材料不完整，请补充主办单位盖章的证明材料' : '材料齐全，予以通过' },
          { node: '校团委终审', actor: '周雅婷', role: '分值审核员', status: st === '待终审' ? 'cur' : (st === '已通过' ? 'done' : 'wait'), at: st === '已通过' ? B.addDays(at, 2) : '', note: st === '已通过' ? '分值核定为 ' + kind.credit + ' 学分' : '' },
          { node: '自动赋分', actor: '系统', role: '系统', status: st === '已通过' ? 'done' : 'wait', at: st === '已通过' ? B.addDays(at, 2) : '', note: st === '已通过' ? '已写入成绩记录：+' + kind.credit + ' 学分 / +' + kind.points + ' 积分 / +' + kind.hours + ' 学时' : '' }
        ],
        note: st === '已驳回' ? '材料不完整，请补充主办单位盖章的证明材料' : ''
      });
    }
    out.scoreApps = apps;
    // 已通过申报 → 写入成绩记录
    apps.forEach(function (ap) {
      if (ap.status !== '已通过') return;
      scoreRecs.push({
        id: 'SR' + (40000 + scoreRecs.length),
        studentId: ap.studentId, actId: '', actTitle: ap.title, cat: ap.cat,
        credit: ap.credit, hours: ap.hours, points: ap.points, level: '校级',
        source: '分值申报', status: '已认定',
        at: B.addDays(ap.at, 2), term: B.termOf(ap.at)
      });
    });

    /* =============== 管理员导入的历史分值 =============== */
    for (var i2 = 0; i2 < 130; i2++) {
      var s2 = students[U.rndInt(rand, 0, students.length - 1)];
      var c2 = U.rndPick(rand, catNames);
      var cr = [0.5, 1][U.rndInt(rand, 0, 1)];
      scoreRecs.push({
        id: 'SR' + (40000 + scoreRecs.length),
        studentId: s2.id,
        actId: '', actTitle: '历史数据导入 · ' + U.rndPick(rand, ['校级荣誉表彰', '志愿服务时长', '社会实践证明', '技能竞赛获奖']),
        cat: c2, credit: cr, hours: cr * 16, points: cr * 10, level: '校级',
        source: '管理员导入', status: '已认定',
        at: U.at(2025, U.rndInt(rand, 9, 12), U.rndInt(rand, 1, 28), 10, 0), term: '2025-2026-1'
      });
    }

    /* =============== 基础认定记录：保证每名学生都有可查的成绩明细 =============== */
    students.forEach(function (s0, si) {
      var n = 3 + (si % 3);                 /* 每人 3—5 条基础认定记录 */
      for (var j = 0; j < n; j++) {
        var cat0 = catNames[(si + j * 2) % catNames.length];
        var cr0 = [0.5, 1, 1][j % 3];
        scoreRecs.push({
          id: 'SR' + (40000 + scoreRecs.length),
          studentId: s0.id, actId: '',
          actTitle: '活动认定 · ' + U.rndPick(rand, B.ACT_TITLES[cat0]).slice(0, 16),
          cat: cat0, credit: cr0, hours: Math.round(cr0 * 16), points: Math.round(cr0 * 10),
          level: j % 2 ? '院级' : '校级',
          source: '活动认定', status: '已认定',
          at: U.at(2025, U.rndInt(rand, 9, 12), U.rndInt(rand, 1, 28), 16, 0),
          term: '2025-2026-1'
        });
      }
    });

    /* =============== 按目标分布校准学分（等比缩放，不新增记录） ===============
       目标：约 60% 学生达标（≥6 学分）/ 22% 中间（4.5—6）/ 18% 偏低（<4.5）
       做法：统计每名学生的当前累计学分，再对其已有认定记录做等比缩放，
             既保证分布真实，又不额外膨胀数据量（本地存储有配额上限）。
       ======================================================================== */
    (function () {
      var byStudent = U.groupBy(scoreRecs, function (r) { return r.studentId; });
      students.forEach(function (s, idx) {
        var roll = idx % 100;
        var target = roll < 60 ? (6 + (idx % 37) / 10)
          : (roll < 82 ? (4.5 + (idx % 14) / 10)
            : (1.5 + (idx % 27) / 10));
        var rs = byStudent[s.id] || [];
        if (!rs.length) return;
        var cur = U.sum(rs, function (r) { return U.num(r.credit); });
        if (cur <= 0) return;
        var k = target / cur;
        rs.forEach(function (r) {
          var cr = Math.round(U.num(r.credit) * k * 2) / 2;
          if (cr < 0.5) cr = 0.5;
          if (cr > 2) cr = 2;
          r.credit = cr;
          r.hours = Math.round(cr * 16);
          r.points = Math.round(cr * 10);
        });
      });
    })();

    out.scoreRecs = scoreRecs;

    /* =============== 黑名单 =============== */
    out.blacklist = [];
    for (var i3 = 0; i3 < 7; i3++) {
      var s3 = students[U.rndInt(rand, 0, students.length - 1)];
      var miss = U.rndInt(rand, 2, 5);
      var at3 = U.at(2026, U.rndInt(rand, 4, 9), U.rndInt(rand, 1, 21), 10, 30);
      out.blacklist.push({
        id: 'BL' + (i3 + 1), studentId: s3.id, sno: s3.sno, name: s3.name,
        college: s3.college, className: s3.className, contact: s3.contact,
        reason: '30 天内连续 ' + miss + ' 次报名后未签到 / 未签退', misses: miss,
        at: at3, autoOutAt: B.addDays(at3, 30), active: true, source: '系统自动纳入',
        related: [1, 2, 3].map(function (x) { return 'A' + U.pad(U.rndInt(rand, 1, 48)); }).join('、')
      });
    }

    /* =============== 活动规则 =============== */
    out.actRules = [
      { id: 'AR1', type: '报名规则', name: '同时报名活动数量限制', desc: '限制参与人同时处于“已报名未结束”状态的活动数量，防止一人占用多个活动名额', params: { maxParallel: 3, scope: '全体学生', effect: '超出时系统拒绝报名并提示' }, enabled: true, updatedAt: '2026-09-10 10:20', updatedBy: '陈立诚' },
      { id: 'AR2', type: '报名规则', name: '报名截止时间统一约束', desc: '报名必须在活动报名截止时间前完成，截止后不允许新报名', params: { before: '活动开始前 2 小时', scope: '全部活动' }, enabled: true, updatedAt: '2026-09-10 10:22', updatedBy: '陈立诚' },
      { id: 'AR3', type: '报名规则', name: '专业 / 年级范围校验', desc: '仅允许活动设定的报名范围内学生报名', params: { scope: '按活动单独配置' }, enabled: true, updatedAt: '2026-09-10 10:25', updatedBy: '陈立诚' },
      { id: 'AR4', type: '黑名单规则', name: '多次未签到自动纳入黑名单', desc: '统计周期内未签到 / 未签退达到阈值，自动纳入黑名单并限制报名', params: { missTimes: 3, period: '最近 90 天', autoOutDays: 30 }, enabled: true, updatedAt: '2026-09-12 15:03', updatedBy: '陈立诚' },
      { id: 'AR5', type: '黑名单规则', name: '黑名单到期自动移除', desc: '纳入黑名单后经过设定天数自动移除，恢复报名权限', params: { autoOutDays: 30 }, enabled: true, updatedAt: '2026-09-12 15:05', updatedBy: '陈立诚' },
      { id: 'AR6', type: '通知条件', name: '报名成功即时通知', desc: '报名审核通过后向学生推送站内消息与移动端消息', params: { channels: ['站内消息', '移动端推送'], when: '报名审核通过' }, enabled: true, updatedAt: '2026-09-14 09:40', updatedBy: '黄静怡' },
      { id: 'AR7', type: '通知条件', name: '活动开始前提醒', desc: '活动开始前 24 小时自动提醒已报名学生，含时间、地点与签到方式', params: { channels: ['站内消息', '移动端推送'], when: '活动开始前 24 小时' }, enabled: true, updatedAt: '2026-09-14 09:42', updatedBy: '黄静怡' },
      { id: 'AR8', type: '通知条件', name: '未签到预警通知', desc: '活动结束后统计未签到人员并通知本人与辅导员', params: { channels: ['站内消息', '短信'], when: '活动结束后 2 小时' }, enabled: false, updatedAt: '2026-09-14 09:45', updatedBy: '黄静怡' }
    ];

    /* =============== 报名 / 签到表单字段 =============== */
    out.formFields = [
      { id: 'FF1', name: '姓名', key: 'name', type: '单行输入', module: '基本信息', required: true, enabled: true, fromSystem: true, sort: 1 },
      { id: 'FF2', name: '学号', key: 'sno', type: '单行输入', module: '基本信息', required: true, enabled: true, fromSystem: true, sort: 2 },
      { id: 'FF3', name: '学院', key: 'college', type: '下拉框', module: '基本信息', required: true, enabled: true, fromSystem: true, sort: 3 },
      { id: 'FF4', name: '专业班级', key: 'className', type: '下拉框', module: '基本信息', required: true, enabled: true, fromSystem: true, sort: 4 },
      { id: 'FF5', name: '联系电话', key: 'contact', type: '单行输入', module: '基本信息', required: true, enabled: true, fromSystem: false, sort: 5 },
      { id: 'FF6', name: '个人简介', key: 'intro', type: '多行输入', module: '报名信息', required: false, enabled: true, fromSystem: false, sort: 6 },
      { id: 'FF7', name: '特长 / 技能', key: 'skill', type: '多行输入', module: '报名信息', required: false, enabled: true, fromSystem: false, sort: 7 },
      { id: 'FF8', name: '紧急联系人', key: 'emg', type: '联系人', module: '报名信息', required: false, enabled: false, fromSystem: false, sort: 8 },
      { id: 'FF9', name: '免责承诺书', key: 'risk', type: '附件', module: '报名信息', required: true, enabled: true, fromSystem: false, sort: 9 },
      { id: 'FF10', name: '签到时段', key: 'signSlot', type: '日期区间', module: '签到 / 签退', required: false, enabled: true, fromSystem: true, sort: 10 },
      { id: 'FF11', name: '签到方式', key: 'signMode', type: '下拉框', module: '签到 / 签退', required: true, enabled: true, fromSystem: true, sort: 11 },
      { id: 'FF12', name: '签退确认', key: 'signOut', type: '下拉框', module: '签到 / 签退', required: true, enabled: true, fromSystem: true, sort: 12 }
    ];

    return out;
  }

  /** 按活动报名范围挑学生池 */
  function pickStudents(rand, a, students) {
    var cands = students;
    if (a.audiences && a.audiences[0] && a.audiences[0] !== '全体学生') {
      var f = students.filter(function (s) { return a.audiences.indexOf(s.college) >= 0; });
      if (f.length) cands = f;
    }
    // 活跃池：偏好 2025/2026 级
    var active = cands.filter(function (s) { return s.grade !== '2023级' && s.status === '在籍'; });
    var base = active.length ? active : cands;
    var n = Math.min(base.length, U.rndInt(rand, 60, 180));
    var pool = [], seen = {};
    for (var i = 0; i < n * 2 && pool.length < n; i++) {
      var k = Math.floor(rand() * base.length);
      if (seen[k]) continue;
      seen[k] = 1; pool.push(base[k]);
    }
    return pool.length ? pool : base;
  }

  w.ZSEED_ACTIVITY = { build: build };
})(window);
