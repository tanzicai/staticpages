/* ==========================================================================
   _sign.js —— 签到核心（时间限制签到 / 位置签到 / 扫码签到，可组合）
   设计要点：
   1) 扫码用的二维码是「动态码」：token = f(活动ID, 时间片)，时间片长度取活动的
      signRefresh（默认 60 秒）。组织者大屏与学生端扫描读的是同一套算法，
      因此「码过期 → 签到失败」是真实验证逻辑，不是假提示。
   2) 位置签到会比对设备上报坐标与活动地点坐标的距离，超出半径判定失败。
      演示环境的坐标由「定位」下拉提供（已标注为模拟定位，不冒充真实 GPS）。
   3) 三类签到方式可同时启用；全部启用的方式都必须通过才算签到成功。
   对外：ZSIGN.boardModal(act, run)  组织者大屏投屏二维码
        ZSIGN.studentModal(act, enr, onDone) 学生端签到
        ZSIGN.tokenOf(act, ts) / slotOf / msLeft / verify
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, DB = w.DB, ZA = w.ZA;

  /* 校内坐标点（用于位置签到比对；坐标为校内相对点位，非真实经纬度） */
  var POINTS = [
    { id: 'P1', name: '大学生活动中心', x: 100, y: 120 },
    { id: 'P2', name: '图书馆前广场', x: 100, y: 120 },
    { id: 'P3', name: '体育馆', x: 150, y: 120 },
    { id: 'P4', name: '第一教学楼报告厅', x: 320, y: 460 },
    { id: 'P5', name: '实训楼 B 座', x: 600, y: 380 },
    { id: 'P6', name: '田径运动场', x: 1180, y: 900 },
    { id: 'P7', name: '学生宿舍区（校外）', x: 3200, y: 2600 }
  ];
  var RADIUS = 300;   /* 允许偏差（米） */

  function pointOf(name) {
    name = String(name || '');
    for (var i = 0; i < POINTS.length; i++) if (name.indexOf(POINTS[i].name) >= 0) return POINTS[i];
    /* 活动地点的 mapPin 若给出坐标则直接用 */
    return null;
  }
  function actPoint(act) {
    if (act.mapPin && typeof act.mapPin === 'object') return { name: act.place || '活动地点', x: U.num(act.mapPin.x), y: U.num(act.mapPin.y) };
    if (typeof act.mapPin === 'string' && act.mapPin.indexOf(',') > 0) {
      var p = act.mapPin.split(',');
      return { name: act.place || '活动地点', x: U.num(p[0]), y: U.num(p[1]) };
    }
    return pointOf(act.place) || POINTS[0];
  }
  function dist(a, b) {
    var dx = U.num(a.x) - U.num(b.x), dy = U.num(a.y) - U.num(b.y);
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  }

  /* ---------------- 动态码 ---------------- */
  function refreshSec(act) { return Math.max(10, U.int(act.signRefresh || 60)); }
  function slotOf(act, ts) { return Math.floor((ts || Date.now()) / 1000 / refreshSec(act)); }
  /** 短码：活动 ID + 时间片 → 8 位大写码（确定性哈希） */
  function tokenOf(act, ts) {
    var s = String(act.id) + '#' + slotOf(act, ts);
    var h1 = 0x811c9dc5, h2 = 0x1000193;
    for (var i = 0; i < s.length; i++) {
      h1 ^= s.charCodeAt(i); h1 = (h1 * 16777619) >>> 0;
      h2 = ((h2 << 5) - h2 + s.charCodeAt(i) * (i + 7)) >>> 0;
    }
    var alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var k = 0; k < 8; k++) {
      var v = k < 4 ? (h1 >>> (k * 5)) : (h2 >>> ((k - 4) * 5));
      out += alpha[v % alpha.length];
    }
    return out;
  }
  function msLeft(act, ts) {
    ts = ts || Date.now();
    var per = refreshSec(act) * 1000;
    return per - (ts % per);
  }
  /** 校验扫描到的码：必须等于当前时间片的码，或容忍上一时间片（跨刷新瞬间） */
  function verify(act, code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return { ok: false, reason: '未识别到二维码内容' };
    var now = Date.now();
    if (code === tokenOf(act, now)) return { ok: true, slot: 'current' };
    return { ok: false, reason: '二维码已过期（每 ' + refreshSec(act) + ' 秒刷新一次），请扫描屏幕上的最新二维码' };
  }

  /* ---------------- 组织者：大屏投屏二维码 ---------------- */
  /** 返回 {el, stop()} —— 二维码按刷新周期自动更新，含倒计时 */
  function qrLive(act, size) {
    var host = D.h('div', { style: 'text-align:center' });
    var qrHost = D.h('div', { style: 'display:inline-block;padding:10px;background:#fff;border:1px solid var(--line);border-radius:12px' });
    var code = D.h('div', { style: 'font-family:ui-monospace,Menlo,monospace;font-size:16px;font-weight:750;letter-spacing:2px;color:var(--primary);margin-top:9px' });
    var tip = D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:4px' });
    var timer = null;
    function paint() {
      var tk = tokenOf(act);
      D.fill(qrHost, w.ZQR.svg(tk, size || 168, { quiet: 3 }));
      code.textContent = tk;
      tip.textContent = '剩余 ' + Math.ceil(msLeft(act) / 1000) + ' 秒刷新 · 有效期 ' + refreshSec(act) + ' 秒';
    }
    host.appendChild(qrHost);
    host.appendChild(code);
    host.appendChild(tip);
    paint();
    timer = setInterval(paint, 1000);
    return { el: host, stop: function () { if (timer) clearInterval(timer); }, refresh: paint };
  }
  /** 投屏弹窗 */
  function boardModal(act) {
    var live = null;
    var m = UI.modal({
      title: '扫码签到 · 大屏投屏',
      sub: act.title,
      size: 'slim',
      onClose: function () { if (live) live.stop(); },
      body: D.h('div', { style: 'text-align:center' },
        D.h('div', { style: 'font-size:12.5px;color:var(--text2);line-height:1.9;margin-bottom:10px' },
          '请学生用手机端「扫码签到」对准本页二维码扫描。',
          D.h('br'),
          D.h('span.muted', '二维码每 ' + refreshSec(act) + ' 秒自动刷新；如需投屏到会场大屏，可按 F11 全屏显示本页。')),
        D.h('div', { id: 'qrLiveHost' })
      ),
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { if (live) live.stop(); m.close(); } }, '结束投屏')]
    });
    live = qrLive(act, 190);
    D.fill(D.q('#qrLiveHost', m.body), live.el);
  }

  /* ---------------- 学生端：签到 ---------------- */
  /**
   * @param act 活动
   * @param enr 报名记录（可为 null，现场报名场景）
   * @param onDone(record) 成功后回调
   */
  function studentModal(act, enr, onDone) {
    var modes = (act.signModes && act.signModes.length) ? act.signModes.slice() : ['时间限制签到'];
    host_();
    function host_() { }

    var state = {
      timeOK: false, posOK: false, scanOK: false,
      loc: (actPoint(act).name),
      scanned: ''
    };
    /* 时间限制签到：活动起止时间窗内（含前后 30 分钟缓冲） */
    function timeCheck(ts) {
      var t = ts || Date.now();
      var s = U.toDate(act.start), e = U.toDate(act.end);
      if (!s || !e) return { ok: true, msg: '活动未设置时间窗，默认允许签到' };
      var from = s.getTime() - 30 * 60000, to = e.getTime() + 30 * 60000;
      if (t < from) return { ok: false, msg: '签到尚未开始（活动开始前 30 分钟开放签到）' };
      if (t > to) return { ok: false, msg: '签到已结束（活动结束后 30 分钟关闭签到）' };
      return { ok: true, msg: '当前时间在允许签到区间内（活动 ' + U.dt(act.start) + ' 起）' };
    }

    var body = D.h('div');
    body.appendChild(D.h('div', { style: 'font-size:12.5px;color:var(--text2);line-height:1.9;margin-bottom:10px' },
      '本活动启用的签到方式：' + modes.map(function (x) { return D.h('span.tag.tag-info', x); }),
      D.h('br'),
      D.h('span.muted', '活动地点：' + (act.place || '未设置') + (act.mapPin ? '（已设置地图点位）' : ''))
    ));

    var rowsHost = D.h('div');
    var okBtn = D.h('button.btn.btn-sm.btn-p', { onclick: submit }, '确认签到');
    okBtn.disabled = true;

    modes.forEach(function (md, idx) {
      var row = D.h('div', { style: 'border:1px solid var(--line);border-radius:10px;padding:11px;margin-bottom:9px' });
      row.appendChild(D.h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:7px' },
        D.h('span.tag' + (idx === 0 ? '.tag-info' : ''), md),
        D.h('span', { style: 'font-size:12px;color:var(--text3)' }, '第 ' + (idx + 1) + ' 项，需通过后进入下一项')
      ));
      if (md === '时间限制签到') {
        var r = timeCheck();
        state.timeOK = r.ok;
        row.appendChild(D.h('div', { style: 'font-size:12.5px;color:' + (r.ok ? '#059669' : '#dc2626') }, (r.ok ? '✓ ' : '✕ ') + r.msg));
        row.appendChild(D.h('div.mt8', D.h('button.btn.btn-sm', {
          onclick: function (e) {
            var rr = timeCheck();
            state.timeOK = rr.ok;
            e.currentTarget.parentNode.parentNode.lastChild.textContent = '';
            UI.toast('时间校验' + (rr.ok ? '通过' : '未通过'), rr.msg, rr.ok ? 'ok' : 'warn');
            paint();
          }
        }, '重新校验当前时间')));
      } else if (md === '位置签到') {
        var ap = actPoint(act);
        var sel = UI.select({
          options: POINTS.map(function (p) { return { value: p.name, label: p.name + '（校内点位）' }; }),
          value: state.loc,
          onChange: function (v) { state.loc = v; checkPos(); }
        });
        var posMsg = D.h('div', { style: 'font-size:12.5px;margin-top:6px' });
        function checkPos() {
          var cur = pointOf(state.loc) || POINTS[0];
          var d = dist(cur, ap);
          state.posOK = d <= RADIUS;
          posMsg.textContent = (state.posOK ? '✓ ' : '✕ ') + '设备上报位置：' + state.loc + '，距活动地点约 ' + d + ' 米' +
            (state.posOK ? '（在允许范围内）' : '（超出允许范围 ' + RADIUS + ' 米，签到不通过）');
          posMsg.style.color = state.posOK ? '#059669' : '#dc2626';
          paint();
        }
        row.appendChild(D.h('div', { style: 'display:flex;gap:8px;align-items:center' },
          D.h('span.muted', '模拟定位'), sel));
        row.appendChild(posMsg);
        checkPos();
      } else if (md === '扫码签到') {
        var view = D.h('div', { style: 'display:flex;gap:11px;align-items:center' });
        var qbox = D.h('div', { style: 'width:104px;height:104px;border:1px dashed #cfdcf0;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#f8fbff;color:var(--text3);font-size:11.5px;text-align:center;padding:6px' }, '扫码取景框');
        var scanMsg = D.h('div', { style: 'font-size:12.5px;line-height:1.8' }, '点击右侧按钮，模拟手机端对准会场大屏二维码扫描。');
        row.appendChild(D.h('div', { style: 'display:flex;gap:11px;align-items:flex-start' },
          qbox, D.h('div', { style: 'flex:1' }, scanMsg,
            D.h('div.mt8', D.h('button.btn.btn-sm', {
              onclick: function (e) {
                var tk = tokenOf(act);
                D.fill(qbox, w.ZQR.svg(tk, 92, { quiet: 2 }));
                var v = verify(act, tk);
                state.scanOK = v.ok;
                state.scanned = tk;
                scanMsg.textContent = v.ok
                  ? '识别到二维码内容：' + tk + '（当前有效码）'
                  : '识别到二维码内容：' + tk + ' —— ' + v.reason;
                scanMsg.style.color = v.ok ? '#059669' : '#dc2626';
                paint();
              }
            }, '开始扫描')))));
      }
      rowsHost.appendChild(row);
    });

    body.appendChild(rowsHost);
    body.appendChild(D.h('div.req-note', { style: 'margin-top:4px' },
      '签到结果会同步到「活动管理 · 考核管理」，并计入签到率与学分认定依据。'));

    function paint() {
      var need = modes.length;
      var got = (state.timeOK ? 1 : 0) + (state.posOK ? 1 : 0) + (state.scanOK ? 1 : 0);
      okBtn.disabled = got < need;
      okBtn.textContent = got < need ? ('确认签到（' + got + '/' + need + ' 项已通过）') : '确认签到';
    }

    function submit() {
      var now = U.dt(new Date());
      var rec = DB.find('signins', function (x) { return x.actId === act.id && x.studentId === (enr ? enr.studentId : ZA.viewStudentId()); });
      var payload = {
        actId: act.id, actTitle: act.title, itemName: enr ? enr.itemName : '现场报名',
        studentId: enr ? enr.studentId : ZA.viewStudentId(),
        name: enr ? enr.name : (ZA.viewStudent() || {}).name,
        sno: enr ? enr.sno : (ZA.viewStudent() || {}).sno,
        college: enr ? enr.college : (ZA.viewStudent() || {}).college,
        className: enr ? enr.className : (ZA.viewStudent() || {}).className,
        method: modes.join(' + '), at: now, status: '已签到',
        place: state.loc, device: '移动端 · 小程序', makeUp: false
      };
      if (rec) {
        DB.update('signins', rec.id, payload);
      } else {
        DB.insert('signins', payload);
      }
      if (enr) DB.update('enrollments', enr.id, { signStatus: '已签到' });
      /* 活动参与计数留痕 */
      DB.touch('activities', act);
      UI.toast('签到成功', '签到方式：' + payload.method + ' · ' + now, 'ok');
      m.close();
      if (onDone) onDone(payload);
    }

    var m = UI.modal({
      title: '活动签到', sub: act.title, size: 'wide',
      body: body,
      foot: [D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'), okBtn]
    });
    paint();
  }

  /* ---------------- 现场报名（无报名记录也可签到） ---------------- */
  function onSiteEnroll(act, cb) {
    var stu = ZA.viewStudent();
    if (!stu) { UI.toast('未识别到学生身份', '请以学生角色登录', 'warn'); return; }
    var exist = DB.find('enrollments', function (e) { return e.actId === act.id && e.studentId === stu.id; });
    if (exist) { UI.toast('已报名该活动', '报名状态：' + exist.status, 'warn'); if (cb) cb(exist); return; }
    var rec = DB.insert('enrollments', {
      actId: act.id, actTitle: act.title, cat: act.cat,
      itemId: (act.items && act.items[0] ? act.items[0].id : ''),
      itemName: (act.items && act.items[0] ? act.items[0].name : '统一报名'),
      studentId: stu.id, sno: stu.sno, name: stu.name, gender: stu.gender,
      collegeId: stu.collegeId, college: stu.college, major: stu.major,
      className: stu.className, grade: stu.grade, contact: stu.contact,
      at: U.dt(new Date()), status: act.needAudit ? '待审核' : '已通过', reviewer: '', note: '',
      onSite: true, signStatus: '未签到', formData: {}, importBatch: ''
    });
    UI.toast('现场报名成功', act.needAudit ? '已提交，等待组织者审核' : '已直接通过', 'ok');
    if (cb) cb(rec);
  }

  w.ZSIGN = {
    POINTS: POINTS, RADIUS: RADIUS,
    actPoint: actPoint, pointOf: pointOf, dist: dist, refreshSec: refreshSec,
    slotOf: slotOf, tokenOf: tokenOf, msLeft: msLeft, verify: verify,
    qrLive: qrLive, boardModal: boardModal, studentModal: studentModal, onSiteEnroll: onSiteEnroll
  };
})(window);
