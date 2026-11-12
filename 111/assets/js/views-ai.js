/* ============================================================
   views-ai.js —— AI 实践空间：场景生成 / 3D 漫游 / 布展编辑 / 智能评价
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.Store, U = global.UI;
  var V = global.Views = global.Views || {};
  function go(h) { global.App.go(h); }
  function save() { S.save(); }

  /* ==========================================================
     一、3D 舞台引擎（Canvas 2D 透视投影）
     ========================================================== */
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function createStage(canvas, scene, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      return { api: { move: function () { }, face: function () { }, toggleAuto: function () { return false; }, destroy: function () { } } };
    }
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var cam = { x: 0, y: 1.62, z: -13.2, yaw: 0 };
    var killed = false, raf = 0, auto = false;
    var hits = [], sprites = [];
    var agent = scene.agent || { name: '智能体', role: '角色' };

    function buildSprites() {
      var mats = S.materials();
      var mmap = {};
      mats.forEach(function (m) { mmap[m.id] = m; });
      sprites = (scene.layout || []).map(function (it) {
        var m = mmap[it.materialId];
        if (!m) return null;
        return {
          kind: 'mat', id: it.id, mat: m,
          x: (it.x / 100 - 0.5) * 22, z: (it.y / 100 - 0.5) * 15,
          scale: it.scale || 1
        };
      }).filter(Boolean);

      sprites.push({ kind: 'agent', id: 'agent', x: 0.6, z: -7.2, scale: 1.35, mat: { color: '#3B82F6', size: 96, shape: 'human' } });
      (scene.tasks || []).forEach(function (t, i) {
        var ang = -1.1 + i * 2.2;
        sprites.push({
          kind: 'task', id: t.id, task: t,
          x: Math.sin(ang) * 6.4, z: Math.cos(ang) * 4.6 + 1.6,
          scale: 1, mat: { color: '#5B7BD5', size: 80, shape: 'screen' }
        });
      });
    }
    buildSprites();

    function project(x, y, z) {
      var dx = x - cam.x, dz = z - cam.z;
      var c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
      var rx = dx * c - dz * s;
      var rz = dx * s + dz * c;
      if (rz < 0.2) return null;
      var f = H * 0.92;
      var sc = f / rz;
      return { x: W / 2 + rx * sc, y: H * 0.45 + (cam.y - y) * sc, sc: sc, z: rz };
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(200, r.width); H = Math.max(160, r.height);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function drawSky() {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#101A30');
      g.addColorStop(0.36, '#1B2B4D');
      g.addColorStop(0.46, '#27406E');
      g.addColorStop(1, '#0A1220');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 顶部光晕
      var rg = ctx.createRadialGradient(W / 2, H * 0.16, 10, W / 2, H * 0.16, W * 0.6);
      rg.addColorStop(0, 'rgba(120,160,255,.28)');
      rg.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }

    function ringPoint(ang, radius) { return [Math.sin(ang) * radius, Math.cos(ang) * radius]; }

    function drawFloor() {
      var R = 16.4, seg = 44;
      ctx.beginPath();
      var started = false;
      for (var i = 0; i <= seg; i++) {
        var a = i / seg * Math.PI * 2;
        var p = ringPoint(a, R);
        var pr = project(p[0], 0, p[1]);
        if (!pr) { continue; }
        if (!started) { ctx.moveTo(pr.x, pr.y); started = true; }
        else ctx.lineTo(pr.x, pr.y);
      }
      var gf = ctx.createLinearGradient(0, H * 0.45, 0, H);
      gf.addColorStop(0, 'rgba(60,88,170,.55)');
      gf.addColorStop(1, 'rgba(46,32,96,.85)');
      ctx.fillStyle = gf; ctx.fill();
    }

    function drawGrid() {
      var step = 2, half = 8;
      ctx.strokeStyle = 'rgba(140,170,255,.16)';
      ctx.lineWidth = 1;
      var cx0 = Math.round(cam.x / step) * step;
      var cz0 = Math.round(cam.z / step) * step;
      for (var k = -half; k <= half; k++) {
        var x = cx0 + k * step, z = cz0 + k * step, i;
        for (i = -half; i < half; i++) {
          var a1 = project(x, 0, cz0 + i * step), a2 = project(x, 0, cz0 + (i + 1) * step);
          if (a1 && a2) { ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); }
          var b1 = project(cx0 + i * step, 0, z), b2 = project(cx0 + (i + 1) * step, 0, z);
          if (b1 && b2) { ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }
        }
      }
    }

    function drawWalls() {
      var R = 16.6, seg = 40, hgt = 4.8;
      for (var i = 0; i < seg; i++) {
        var a1 = i / seg * Math.PI * 2, a2 = (i + 1) / seg * Math.PI * 2;
        var p1 = ringPoint(a1, R), p2 = ringPoint(a2, R);
        var b1 = project(p1[0], 0, p1[1]), b2 = project(p2[0], 0, p2[1]);
        var t1 = project(p1[0], hgt, p1[1]), t2 = project(p2[0], hgt, p2[1]);
        if (!b1 || !b2 || !t1 || !t2) continue;
        if (Math.abs(b1.x) > W * 8 && Math.abs(b2.x) > W * 8) continue;
        var shade = i % 2 === 0 ? 0.10 : 0.18;
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y);
        ctx.closePath();
        var g = ctx.createLinearGradient(0, Math.min(t1.y, t2.y), 0, Math.max(b1.y, b2.y));
        g.addColorStop(0, 'rgba(50,80,160,.55)');
        g.addColorStop(0.55, 'rgba(64,104,200,' + (shade + 0.16) + ')');
        g.addColorStop(1, 'rgba(100,150,235,' + (shade + 0.10) + ')');
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = 'rgba(150,180,255,.18)'; ctx.lineWidth = 1; ctx.stroke();
      }
      // 地平线灯带
      ctx.beginPath();
      var started = false;
      for (var j = 0; j <= 60; j++) {
        var ang = j / 60 * Math.PI * 2;
        var pp = ringPoint(ang, R - 0.2);
        var prj = project(pp[0], 0.02, pp[1]);
        if (!prj) { continue; }
        if (!started) { ctx.moveTo(prj.x, prj.y); started = true; } else ctx.lineTo(prj.x, prj.y);
      }
      ctx.strokeStyle = 'rgba(120,160,255,.34)'; ctx.lineWidth = 2; ctx.stroke();
    }

    function drawMatSprite(sp, p, pw, ph) {
      var color = sp.mat.color, bx = p.x, by = p.y;
      var top = by - ph;
      var dx = Math.min(pw * 0.30, pw * 0.55), dy = Math.min(pw * 0.22, ph * 0.42);

      // 地面投影
      ctx.save();
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = '#040A14';
      ctx.beginPath();
      ctx.ellipse(bx + dx * 0.4, by + 1, pw * 0.58, pw * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 顶面
      ctx.beginPath();
      ctx.moveTo(bx - pw / 2, top);
      ctx.lineTo(bx - pw / 2 + dx, top - dy);
      ctx.lineTo(bx + pw / 2 + dx, top - dy);
      ctx.lineTo(bx + pw / 2, top);
      ctx.closePath();
      ctx.fillStyle = hexA(color, 0.98);
      ctx.fill();
      ctx.strokeStyle = hexA(color, 0.85); ctx.lineWidth = 1; ctx.stroke();

      // 侧面
      ctx.beginPath();
      ctx.moveTo(bx + pw / 2, top);
      ctx.lineTo(bx + pw / 2 + dx, top - dy);
      ctx.lineTo(bx + pw / 2 + dx, by - dy);
      ctx.lineTo(bx + pw / 2, by);
      ctx.closePath();
      ctx.fillStyle = hexA(color, 0.46);
      ctx.fill();
      ctx.strokeStyle = hexA(color, 0.62); ctx.lineWidth = 1; ctx.stroke();

      // 正面
      var g = ctx.createLinearGradient(bx - pw / 2, top, bx + pw / 2, by);
      g.addColorStop(0, hexA(color, 0.72));
      g.addColorStop(0.55, hexA(color, 0.52));
      g.addColorStop(1, hexA(color, 0.30));
      ctx.fillStyle = g;
      rr(ctx, bx - pw / 2, top, pw, ph, Math.min(8, pw * 0.07));
      ctx.fill();
      ctx.strokeStyle = hexA(color, 0.9); ctx.lineWidth = 1.3; ctx.stroke();

      // 细节：横向分层线
      if (pw > 26) {
        ctx.strokeStyle = 'rgba(255,255,255,.20)'; ctx.lineWidth = 1;
        for (var i = 1; i <= 2; i++) {
          var yy = top + ph * (0.26 + i * 0.24);
          ctx.beginPath();
          ctx.moveTo(bx - pw * 0.32, yy);
          ctx.lineTo(bx + pw * 0.30, yy);
          ctx.stroke();
        }
      }
      hits.push({ kind: 'mat', id: sp.id, x: bx - pw / 2, y: top - dy, w: pw + dx, h: ph + dy, name: sp.mat.name });
    }

    function drawAgent(p) {
      var h = Math.min(H * 0.62, p.sc * 1.75);
      var bx = p.x, by = p.y;
      var c = scene.agent && /女/.test(scene.agent.voice || '') ? '#5B8BF7' : '#2563EB';
      // 脚下光环
      ctx.save();
      var rg = ctx.createRadialGradient(bx, by, 2, bx, by, h * 0.42);
      rg.addColorStop(0, 'rgba(100,150,255,.42)');
      rg.addColorStop(1, 'rgba(100,150,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.ellipse(bx, by, h * 0.44, h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // 身体
      var bodyW = h * 0.28;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(bx - bodyW * 0.5, by);
      ctx.quadraticCurveTo(bx - bodyW * 0.62, by - h * 0.44, bx - bodyW * 0.26, by - h * 0.5);
      ctx.lineTo(bx + bodyW * 0.26, by - h * 0.5);
      ctx.quadraticCurveTo(bx + bodyW * 0.62, by - h * 0.44, bx + bodyW * 0.5, by);
      ctx.closePath();
      var g = ctx.createLinearGradient(bx, by - h * 0.5, bx, by);
      g.addColorStop(0, hexA(c, 0.98));
      g.addColorStop(1, hexA(c, 0.62));
      ctx.fillStyle = g; ctx.fill();
      // 头
      var hr = h * 0.11;
      ctx.beginPath(); ctx.arc(bx, by - h * 0.62, hr, 0, Math.PI * 2);
      ctx.fillStyle = '#EEF4FF'; ctx.fill();
      ctx.strokeStyle = hexA(c, .8); ctx.lineWidth = 1.2; ctx.stroke();
      // 眼睛
      ctx.fillStyle = '#1E40AF';
      ctx.beginPath(); ctx.arc(bx - hr * 0.34, by - h * 0.63, Math.max(1, hr * 0.12), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + hr * 0.34, by - h * 0.63, Math.max(1, hr * 0.12), 0, Math.PI * 2); ctx.fill();
      // 名牌
      var label = (agent.name || '智能体');
      ctx.font = '600 ' + Math.max(10, h * 0.075) + 'px "PingFang SC",sans-serif';
      var tw = ctx.measureText(label).width;
      var ty = by - h * 0.62 - hr - Math.max(16, h * 0.11);
      ctx.fillStyle = 'rgba(24,18,44,.72)';
      rr(ctx, bx - tw / 2 - 8, ty - 11, tw + 16, 21, 10); ctx.fill();
      ctx.fillStyle = '#E4EDFF'; ctx.textAlign = 'center';
      ctx.fillText(label, bx, ty + 3);
      ctx.textAlign = 'left';
      ctx.font = '400 ' + Math.max(9, h * 0.062) + 'px "PingFang SC",sans-serif';
      ctx.fillStyle = 'rgba(220,210,255,.75)';
      ctx.textAlign = 'center';
      ctx.fillText('点击对话', bx, by + Math.max(12, h * 0.09));
      ctx.textAlign = 'left';

      hits.push({ kind: 'agent', id: 'agent', x: bx - h * 0.24, y: by - h * 0.78, w: h * 0.48, h: h * 0.82, name: label });
    }

    function drawTask(p, sp) {
      var w = Math.min(W * 0.24, p.sc * 1.3), h = w * 0.44;
      var bx = p.x - w / 2, by = p.y - h - p.sc * 0.06;
      ctx.save();
      ctx.shadowColor = 'rgba(120,150,255,.5)'; ctx.shadowBlur = 18;
      var g = ctx.createLinearGradient(bx, by, bx + w, by + h);
      g.addColorStop(0, 'rgba(92,124,240,.92)');
      g.addColorStop(1, 'rgba(100,150,255,.72)');
      ctx.fillStyle = g;
      rr(ctx, bx, by, w, h, 9); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(215,225,255,.65)'; ctx.lineWidth = 1.2;
      rr(ctx, bx, by, w, h, 9); ctx.stroke();
      // 支杆
      ctx.strokeStyle = 'rgba(180,190,255,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, by + h); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '600 ' + Math.max(9, Math.min(13, w * 0.075)) + 'px "PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sp.task.title.length > 9 ? sp.task.title.slice(0, 9) + '…' : sp.task.title, p.x, by + h * 0.44);
      ctx.font = '400 ' + Math.max(8, Math.min(11, w * 0.06)) + 'px "PingFang SC",sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.fillText(sp.task.kind === 'quiz' ? '答题闯关 · 点击进入' : '知识连线 · 点击进入', p.x, by + h * 0.74);
      ctx.textAlign = 'left';

      hits.push({ kind: 'task', id: sp.id, x: bx, y: by, w: w, h: h, name: sp.task.title });
    }

    function render() {
      if (killed) return;
      if (auto) cam.yaw += 0.0016;
      hits = [];
      drawSky();
      drawFloor();
      drawGrid();
      drawWalls();

      var list = sprites.map(function (sp) {
        var pr = project(sp.x, 0, sp.z);
        return { sp: sp, p: pr };
      }).filter(function (o) { return !!o.p; }).sort(function (a, b) { return b.p.z - a.p.z; });

      list.forEach(function (o) {
        var p = o.p, sp = o.sp;
        if (sp.kind === 'agent') drawAgent(p);
        else if (sp.kind === 'task') drawTask(p, sp);
        else {
          var sizeW = (sp.mat.size || 70) / 100 * 1.95 * sp.scale;
          var pw = sizeW * p.sc, ph = pw * 0.82;
          if (pw < 2) return;
          drawMatSprite(sp, p, pw, ph);
        }
      });

      // 暗角
      var vg = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.78);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(6,4,16,.62)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(render);
    }

    /* ---- 交互 ---- */
    var drag = null;
    function localPos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX != null ? e.clientX : e.touches[0].clientX) - r.left, y: (e.clientY != null ? e.clientY : e.touches[0].clientY) - r.top };
    }
    function onDown(e) {
      drag = { x: localPos(e).x, y: localPos(e).y, yaw: cam.yaw, moved: 0 };
      if (e.pointerId != null && canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) { } }
    }
    function onMove(e) {
      if (!drag) return;
      var p = localPos(e);
      var dx = p.x - drag.x;
      drag.moved += Math.abs(dx);
      cam.yaw = drag.yaw + dx * 0.006;
      if (e.cancelable) e.preventDefault();
    }
    function onUp(e) {
      if (!drag) return;
      var wasDrag = drag.moved > 6;
      drag = null;
      if (wasDrag) return;
      var p = localPos(e);
      var hit = null;
      for (var i = hits.length - 1; i >= 0; i--) {
        var h = hits[i];
        if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) { hit = h; break; }
      }
      if (hit && opts.onHit) opts.onHit(hit);
    }
    function onWheel(e) {
      e.preventDefault();
      var d = e.deltaY > 0 ? -0.8 : 0.8;
      move(d, 0);
    }
    function move(fwd, side) {
      var s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
      cam.x += s * fwd + c * side;
      cam.z += c * fwd - s * side;
      var r = Math.sqrt(cam.x * cam.x + cam.z * cam.z);
      if (r > 14) { cam.x *= 14 / r; cam.z *= 14 / r; }
      if (cam.z < -15.4) cam.z = -15.4;
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    var ro = window.ResizeObserver ? new ResizeObserver(function () { resize(); }) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);

    resize(); render();
    return {
      api: {
        move: move,
        face: function () { cam.yaw = 0; },
        toggleAuto: function () { auto = !auto; return auto; },
        destroy: function () {
          killed = true; cancelAnimationFrame(raf);
          window.removeEventListener('pointerup', onUp);
          if (ro) ro.disconnect();
        }
      }
    };
  }

  /* ==========================================================
     二、AI 场景生成
     ========================================================== */
  var AGENT_PRESETS = [
    { name: '标准化病人', role: '配合型患者', voice: '男声·中年·略沙哑', style: '配合型', desc: '按脚本回答症状与病史，考察问诊完整性' },
    { name: '门诊带教医师', role: '带教老师', voice: '女声·青年·清晰', style: '引导型', desc: '追问诊断依据，考察临床推理与表达' },
    { name: '护理负责人', role: '病房护士长', voice: '女声·中年·沉稳', style: '协作型', desc: '协作沟通场景，考察团队配合与操作规范' },
    { name: '实验指导教师', role: '实验中心技师', voice: '男声·青年·平稳', style: '规范型', desc: '实验操作纠错，考察流程规范与安全意识' },
    { name: '评审专家', role: '实践考核评委', voice: '男声·中年·严肃', style: '考评型', desc: '按评分规则追问，考察综合实践能力' }
  ];
  var STYLE_PRESETS = [
    { key: 'clinic', name: '门诊诊室', mats: ['家具陈设', '医学模型', '标识导视', '灯光氛围', '人物角色', '植物绿植', '数据看板', '互动装置'], tone: '以诊桌、检查床、导视牌、学情看板构建接诊环境' },
    { key: 'ward', name: '病房', mats: ['家具陈设', '医学模型', '灯光氛围', '植物绿植', '标识导视'], tone: '以病床、监护设备、柔光灯构建病房环境' },
    { key: 'lab', name: '实验实训室', mats: ['实验器材', '场景基座', '标识导视', '数据看板'], tone: '以操作台、仪器、安全标识构建实训环境' },
    { key: 'class', name: '智慧教室', mats: ['家具陈设', '互动装置', '数据看板', '植物绿植'], tone: '以岛式桌椅、互动屏、学情看板构建课堂环境' },
    { key: 'hall', name: '主题展馆', mats: ['场景基座', '装饰元素', '互动装置', '灯光氛围'], tone: '以展台、雕塑、光影装置构建沉浸式展陈' }
  ];

  var aiState = { sceneId: null };

  V.aiScene = {
    title: 'AI 场景生成',
    crumb: ['AI 实践空间', '场景生成'],
    html: function () {
      var d = S.db(), c = S.currentCourse();
      var scenes = d.scenes.filter(function (s) { return s.courseId === c.id; });
      return `
      <div class="page-head">
        <div><div class="page-title">AI 实践空间</div>
        <div class="page-desc">基于课程实践主题与智能体配置一键生成 3D 实践场景，支持布展编辑、沉浸式漫游、角色化对话与多维度智能评价</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/materials">素材中心 · ${S.materials().length} 项</button>
          <button class="btn btn-primary" data-act="gen">${S.icon('spark')} 一键生成场景</button>
        </div>
      </div>

      <div class="grid g-4">
        <div class="stat"><div class="stat-t">实践场景</div><div class="stat-v">${scenes.length}<small>个</small></div>
          <div class="stat-f">已发布 ${scenes.filter(function (s) { return s.status === '已发布'; }).length} 个</div>
          <div class="stat-ico">${S.icon('cube')}</div></div>
        <div class="stat"><div class="stat-t">累计实践人次</div><div class="stat-v">${scenes.reduce(function (a, b) { return a + (b.plays || 0); }, 0)}<small>人次</small></div>
          <div class="stat-f">含 3D 漫游与角色对话</div><div class="stat-ico">${S.icon('users')}</div></div>
        <div class="stat"><div class="stat-t">平均评价得分</div><div class="stat-v">${avgScore(scenes).toFixed(1)}<small>分</small></div>
          <div class="stat-f">按评分规则加权计算</div><div class="stat-ico">${S.icon('chart')}</div></div>
        <div class="stat"><div class="stat-t">公共素材</div><div class="stat-v">${S.materials().length}<small>项</small></div>
          <div class="stat-f">${S.MAT_CATS.length} 个类别 · 支持拖拽布展</div><div class="stat-ico">${S.icon('palette')}</div></div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h"><h3>实践场景列表</h3><span class="sub">${S.esc(c.name)}</span></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>场景名称</th><th>实践主题</th><th>智能体</th><th>互动任务</th><th>布展素材</th><th>实践人次</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${scenes.length ? scenes.map(function (s) {
            return `<tr>
              <td><b style="font-weight:600">${S.esc(s.title)}</b><div class="hint">创建于 ${s.createdAt}</div></td>
              <td style="max-width:260px"><div class="hint" style="color:var(--ink-2)">${S.esc(s.theme.slice(0, 42))}${s.theme.length > 42 ? '…' : ''}</div></td>
              <td>${S.esc(s.agent.name)}<div class="hint">${S.esc(s.agent.role)}</div></td>
              <td class="num">${(s.tasks || []).length}</td>
              <td class="num">${(s.layout || []).length}</td>
              <td class="num">${s.plays || 0}</td>
              <td>${U.statusTag(s.status)}</td>
              <td class="ops">
                <span class="tlink" data-play="${s.id}">进入实践</span>
                <span class="tlink" data-edit="${s.id}">布展编辑</span>
                <span class="tlink danger" data-del="${s.id}">删除</span>
              </td>
            </tr>`;
          }).join('') : `<tr><td colspan="8"><div class="empty">${S.icon('cube')}<div>还没有实践场景</div>
            <button class="btn btn-primary" style="margin-top:12px" data-act="gen">一键生成场景</button></div></td></tr>`}</tbody>
        </table></div>
      </div>

      <div class="grid g-3" style="margin-top:16px">
        <div class="card"><div class="card-h"><h3>能力构成</h3></div>
          <div class="card-b">
            <div class="rowline"><span style="flex:1">3D 沉浸式场景与 360° 自主漫游</span><span class="tag ok">已具备</span></div>
            <div class="rowline"><span style="flex:1">文字 / 语音角色化实践对话</span><span class="tag ok">已具备</span></div>
            <div class="rowline"><span style="flex:1">形—声—动一体化表达</span><span class="tag ok">已具备</span></div>
            <div class="rowline"><span style="flex:1">多维度智能评分与个性化反馈</span><span class="tag ok">已具备</span></div>
          </div>
        </div>
        <div class="card"><div class="card-h"><h3>布展能力</h3></div>
          <div class="card-b">
            <div class="rowline"><span style="flex:1">可视化拖拽布展编辑</span><span class="tag ok">已具备</span></div>
            <div class="rowline"><span style="flex:1">公共素材库 ${S.materials().length} 项</span><span class="tag ok">已具备</span></div>
            <div class="rowline"><span style="flex:1">答题闯关互动任务</span><span class="tag ok">已具备</span></div>
            <div class="rowline"><span style="flex:1">知识连线互动任务</span><span class="tag ok">已具备</span></div>
          </div>
        </div>
        <div class="card"><div class="card-h"><h3>最近评价记录</h3></div>
          <div class="card-b tight">
            ${(S.scene('s1') || { records: [] }).records.slice(-3).reverse().map(function (r) {
              return `<div class="list-line"><div class="avatar-sm">${r.student.slice(0, 1)}</div>
                <div class="ll-main"><strong>${r.student} · ${r.score} 分</strong><span>${r.time} · 对话 ${r.turns} 轮</span></div>
                <span class="tag ${r.score >= 85 ? 'ok' : 'warn'}">${r.score >= 85 ? '优秀' : '合格'}</span></div>`;
            }).join('') || '<div class="empty">暂无记录</div>'}
          </div>
        </div>
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        if (e.target.closest('[data-act="gen"]')) { openGenerate(); return; }
        var p = e.target.closest('[data-play]');
        if (p) { aiState.sceneId = p.getAttribute('data-play'); go('#/play'); return; }
        var ed = e.target.closest('[data-edit]');
        if (ed) { studioState.sceneId = ed.getAttribute('data-edit'); go('#/studio'); return; }
        var del = e.target.closest('[data-del]');
        if (del) {
          var id = del.getAttribute('data-del');
          U.confirm('删除场景', '删除后布展内容与评价记录一并移除，确认继续？', '删除', true).then(function (ok) {
            if (!ok) return;
            S.db().scenes = S.db().scenes.filter(function (x) { return x.id !== id; });
            save(); U.toast('场景已删除'); global.App.render();
          });
        }
      });
    }
  };

  function avgScore(scenes) {
    var all = [];
    scenes.forEach(function (s) { (s.records || []).forEach(function (r) { all.push(r.score); }); });
    if (!all.length) return 0;
    return all.reduce(function (a, b) { return a + b; }, 0) / all.length;
  }

  function openGenerate() {
    var c = S.currentCourse();
    var styleOpts = STYLE_PRESETS.map(function (s) { return `<option value="${s.key}">${s.name}</option>`; }).join('');
    var agentOpts = AGENT_PRESETS.map(function (a, i) { return `<option value="${i}">${a.name} · ${a.role}</option>`; }).join('');
    U.modal({
      title: 'AI 一键生成 3D 实践场景',
      sub: '输入实践主题，自动生成场景、智能体与评分规则',
      size: 'wide',
      body: `<div class="form-grid">
        <label class="field"><span class="req">实践主题</span>
          <textarea id="genTheme" placeholder="描述实践情境，如：呼吸内科门诊接诊，65 岁男性，咳嗽咳痰 20 年，气促加重 3 天">呼吸内科门诊接诊：65 岁男性，咳嗽咳痰 20 年，气促加重 3 天</textarea></label>
        <div class="form-grid c3">
          <label class="field"><span>场景名称</span><input id="genTitle" value="COPD 急性加重接诊实践" /></label>
          <label class="field"><span>场景风格</span><select id="genStyle">${styleOpts}</select></label>
          <label class="field"><span>智能体角色</span><select id="genAgent">${agentOpts}</select></label>
        </div>
        <div>
          <div style="font-size:13px;color:var(--ink-2);margin-bottom:8px">评分规则（权重合计 100%）</div>
          <div id="ruleWrap">
            ${[['问诊完整性', 30], ['鉴别诊断准确性', 30], ['处置规范性', 25], ['人文沟通', 15]].map(function (r) {
              return `<div class="rule-row"><span class="rn">${r[0]}</span>
                <input type="range" min="5" max="50" value="${r[1]}" data-rule="${r[0]}" class="rw" />
                <b class="num" style="width:44px;text-align:right">${r[1]}%</b></div>`;
            }).join('')}
          </div>
        </div>
        <div class="hint" id="genHint" style="background:var(--primary-50);border-radius:10px;padding:11px 13px;color:var(--primary-700)">
          生成后将自动完成：场景空间构建 · 素材布展 · 智能体形象与音色配置 · 评分规则绑定
        </div>
      </div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="genOk">' + S.icon('spark') + ' 生成场景</button>',
      onMount: function (api) {
        var rules = api.el.querySelectorAll('[data-rule]');
        Array.prototype.forEach.call(rules, function (r) {
          r.addEventListener('input', function () {
            r.nextElementSibling.textContent = r.value + '%';
          });
        });
        api.el.querySelector('#genStyle').addEventListener('change', function () {
          var st = STYLE_PRESETS.filter(function (s) { return s.key === this.value; }.bind(this))[0];
          api.el.querySelector('#genHint').textContent = '场景风格：' + st.name + ' —— ' + st.tone;
        });
        api.el.querySelector('#genOk').addEventListener('click', function () {
          var theme = api.el.querySelector('#genTheme').value.trim();
          if (!theme) { U.toast('请填写实践主题', 'err'); return; }
          var title = api.el.querySelector('#genTitle').value.trim() || 'AI 实践场景';
          var styleKey = api.el.querySelector('#genStyle').value;
          var agentIdx = parseInt(api.el.querySelector('#genAgent').value, 10);
          var ag = AGENT_PRESETS[agentIdx];
          var ruleList = [];
          Array.prototype.forEach.call(rules, function (r) {
            ruleList.push({ name: r.getAttribute('data-rule'), weight: parseInt(r.value, 10) });
          });
          var scene = {
            id: S.uid('s'), courseId: c.id, title: title, theme: theme,
            agent: { name: ag.name === '标准化病人' ? '王建国' : ag.name, role: ag.role, voice: ag.voice, style: ag.style, preset: ag.name },
            rules: ruleList, layout: autoLayout(styleKey), tasks: [defaultQuiz()],
            status: '草稿', createdAt: S.fmtDate(), plays: 0, avgScore: 0, records: []
          };
          S.db().scenes.push(scene);
          save(); api.close();
          U.toast('场景已生成，可继续布展编辑');
          studioState.sceneId = scene.id;
          go('#/studio');
        });
      }
    });
  }

  function autoLayout(styleKey) {
    var st = STYLE_PRESETS.filter(function (s) { return s.key === styleKey; })[0] || STYLE_PRESETS[0];
    var mats = S.materials();
    var pool = mats.filter(function (m) { return st.mats.indexOf(m.cat) >= 0; });
    var out = [];
    var spots = [
      [22, 34], [36, 26], [52, 24], [68, 30], [80, 42],
      [20, 62], [38, 58], [56, 56], [72, 60], [86, 70],
      [30, 78], [50, 80], [70, 80]
    ];
    spots.forEach(function (sp, i) {
      var m = pool[(i * 7 + 3) % pool.length];
      out.push({ id: S.uid('pl'), materialId: m.id, x: sp[0], y: sp[1], scale: 1 + (i % 3) * 0.12 });
    });
    return out;
  }

  function defaultQuiz() {
    return {
      id: S.uid('tk'), kind: 'quiz', title: '接诊要点闯关',
      questions: [
        { q: 'COPD 急性加重最常见的诱因是？', options: ['呼吸道感染', '剧烈运动', '高盐饮食', '情绪波动'], answer: 0 },
        { q: '判断 COPD 气流受限的关键检查是？', options: ['胸部 CT', '肺功能（吸入支气管扩张剂后 FEV1/FVC）', '血气分析', '胸片'], answer: 1 },
        { q: '急性加重期氧疗目标 SpO₂ 范围应为？', options: ['80%—85%', '88%—92%', '95%—100%', '无需限定'], answer: 1 }
      ]
    };
  }

  /* ==========================================================
     三、布展编辑
     ========================================================== */
  var studioState = { sceneId: null, sel: null, cat: '全部', kw: '', limit: 42 };
  global.App = global.App || {};

  V.aiStudio = {
    title: '布展编辑',
    crumb: ['AI 实践空间', '布展编辑'],
    html: function (params) {
      var d = S.db();
      var scenes = d.scenes;
      if (params && params.s) studioState.sceneId = params.s;
      var sid = studioState.sceneId || (scenes[0] && scenes[0].id);
      studioState.sceneId = sid;
      var sc = S.scene(sid) || scenes[0];
      if (!sc) return `<div class="empty">请先生成实践场景</div>`;
      if (studioState.sel && !(sc.layout || []).some(function (i) { return i.id === studioState.sel; })) studioState.sel = null;

      var mats = S.materials();
      var cats = ['全部'].concat(S.MAT_CATS.map(function (c) { return c.cat; }));
      var pool = mats.filter(function (m) {
        if (studioState.cat !== '全部' && m.cat !== studioState.cat) return false;
        if (studioState.kw && m.name.indexOf(studioState.kw) < 0) return false;
        return true;
      });
      var shown = pool.slice(0, studioState.limit);

      return `
      <div class="page-head">
        <div><div class="page-title">可视化布展编辑</div>
        <div class="page-desc">拖拽或点击添加公共素材到场景，支持位置、比例调整，布展结果同步至 3D 实践场景</div></div>
        <div class="page-head-actions">
          <select class="btn" id="stScene" style="height:36px">
            ${scenes.map(function (s) { return `<option value="${s.id}" ${s.id === sc.id ? 'selected' : ''}>${S.esc(s.title)}</option>`; }).join('')}
          </select>
          <button class="btn" data-act="auto">${S.icon('reset')} 智能铺排</button>
          <button class="btn" data-act="preview3d">${S.icon('cube')} 3D 预览</button>
          <button class="btn btn-primary" data-act="publish">${sc.status === '已发布' ? '更新发布' : '发布场景'}</button>
        </div>
      </div>

      <div class="studio">
        <div class="card">
          <div class="card-h"><h3>公共素材</h3><span class="sub">${mats.length} 项</span></div>
          <div class="card-b" style="padding:12px">
            <input id="matKw" class="btn" style="width:100%;height:32px;padding:0 10px;text-align:left;margin-bottom:9px" placeholder="搜索素材" value="${S.esc(studioState.kw)}" />
            <div class="chips" style="margin-bottom:10px;max-height:70px;overflow:auto">
              ${cats.map(function (c) {
                return `<span class="chip ${studioState.cat === c ? 'on' : ''}" data-cat="${c}">${c}</span>`;
              }).join('')}
            </div>
            <div class="mat-list" id="matList">
              ${shown.map(function (m) {
                return `<div class="mat-item" data-mat="${m.id}">
                  <div class="mat-thumb">${S.matIconSVG(m.shape, m.color)}</div>
                  <div class="mm"><strong>${m.name}</strong><span>${m.cat}</span></div>
                  <span style="color:var(--primary-200);display:flex">${S.icon('plus')}</span>
                </div>`;
              }).join('')}
            </div>
            ${pool.length > shown.length ? `<button class="btn btn-sm btn-block" style="margin-top:8px" data-act="more">加载更多（${pool.length - shown.length}）</button>` : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>${S.esc(sc.title)}</h3>
            <span class="sub">已布展 ${(sc.layout || []).length} 件素材</span>
            <div class="right"><span class="hint">拖动素材调整位置 · 点击选中后可调整比例</span></div>
          </div>
          <div class="card-b">
            <div class="stage2d" id="stage2d">
              ${(sc.layout || []).map(function (it) {
                var m = mats.filter(function (x) { return x.id === it.materialId; })[0];
                if (!m) return '';
                var size = 44 * (it.scale || 1);
                return `<div class="placed ${studioState.sel === it.id ? 'on' : ''}" data-pl="${it.id}"
                  style="left:${it.x}%;top:${it.y}%;width:${size}px;height:${size}px;transform:translate(-50%,-50%)">
                  ${S.matIconSVG(m.shape, m.color)}
                  <span class="pl-name">${m.name}</span>
                </div>`;
              }).join('')}
              <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;
                border:1px dashed rgba(37,99,235,.4);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:10px;pointer-events:none">
                智能体
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap">
              <span class="tag line">画布 16:10</span>
              <span class="hint">素材以中心为基准定位，比例越大在 3D 场景中越靠近观察者</span>
              <button class="btn btn-sm" style="margin-left:auto" data-act="clear">清空布展</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>属性与任务</h3></div>
          <div class="card-b">
            <div id="propBox">
              ${studioState.sel ? propPanel(sc, studioState.sel) : '<div class="hint">点击画布中的素材以编辑属性</div>'}
            </div>
            <div class="divider"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
              <b style="font-size:13px">互动任务</b>
              <span class="tag line">${(sc.tasks || []).length} 个</span>
            </div>
            <div id="taskList">
              ${(sc.tasks || []).map(function (t) {
                return `<div class="q-card" style="padding:10px 12px">
                  <div class="qh"><strong>${S.esc(t.title)}</strong>
                    <span class="tag ${t.kind === 'quiz' ? '' : 'info'}" style="margin-left:auto">${t.kind === 'quiz' ? '答题闯关' : '知识连线'}</span>
                  </div>
                  <div class="hint" style="margin-bottom:8px">${t.kind === 'quiz' ? t.questions.length + ' 道题目' : t.pairs.length + ' 组配对'}</div>
                  <div style="display:flex;gap:10px">
                    <span class="tlink" data-etask="${t.id}">编辑</span>
                    <span class="tlink" data-ptask="${t.id}">试玩</span>
                    <span class="tlink danger" data-dtask="${t.id}">删除</span>
                  </div>
                </div>`;
              }).join('') || '<div class="hint">还没有互动任务</div>'}
            </div>
            <div style="display:grid;gap:8px;margin-top:10px">
              <button class="btn btn-sm" data-act="add-quiz">${S.icon('check')} 新增答题闯关</button>
              <button class="btn btn-sm" data-act="add-match">${S.icon('link')} 新增知识连线</button>
            </div>
          </div>
        </div>
      </div>`;
    },
    mount: function (root) {
      var stage = root.querySelector('#stage2d');
      var scene = S.scene(studioState.sceneId);

      /* 素材添加 */
      root.querySelector('#matList').addEventListener('click', function (e) {
        var it = e.target.closest('[data-mat]');
        if (!it) return;
        addMaterial(it.getAttribute('data-mat'));
      });
      /* 分类/搜索 */
      root.addEventListener('click', function (e) {
        var c = e.target.closest('[data-cat]');
        if (c) { studioState.cat = c.getAttribute('data-cat'); studioState.limit = 42; global.App.render(); return; }
        if (e.target.closest('[data-act="more"]')) { studioState.limit += 60; global.App.render(); return; }
        if (e.target.closest('[data-act="auto"]')) {
          scene.layout = autoLayout('clinic'); save(); U.toast('已按诊室风格智能铺排'); global.App.render(); return;
        }
        if (e.target.closest('[data-act="clear"]')) {
          U.confirm('清空布展', '将移除当前场景全部素材，确认继续？', '清空', true).then(function (ok) {
            if (!ok) return;
            scene.layout = []; studioState.sel = null; save(); U.toast('布展已清空'); global.App.render();
          });
          return;
        }
        if (e.target.closest('[data-act="publish"]')) {
          if (!(scene.layout || []).length) { U.toast('请先布展素材', 'err'); return; }
          scene.status = '已发布'; save(); U.toast('场景已发布，学生可见'); global.App.render(); return;
        }
        if (e.target.closest('[data-act="preview3d"]')) { open3DPreview(scene); return; }
        var et = e.target.closest('[data-etask]');
        if (et) { openTaskEditor(scene, et.getAttribute('data-etask')); return; }
        var pt = e.target.closest('[data-ptask]');
        if (pt) {
          var t = (scene.tasks || []).filter(function (x) { return x.id === pt.getAttribute('data-ptask'); })[0];
          if (t.kind === 'quiz') playQuiz(t, function () { });
          else playMatch(t, function () { });
          return;
        }
        var dt = e.target.closest('[data-dtask]');
        if (dt) {
          var id = dt.getAttribute('data-dtask');
          scene.tasks = scene.tasks.filter(function (x) { return x.id !== id; });
          save(); U.toast('任务已删除'); global.App.render(); return;
        }
        if (e.target.closest('[data-act="add-quiz"]')) { newTask(scene, 'quiz'); return; }
        if (e.target.closest('[data-act="add-match"]')) { newTask(scene, 'match'); return; }
        var delBtn = e.target.closest('[data-pl-del]');
        if (delBtn) {
          scene.layout = scene.layout.filter(function (x) { return x.id !== delBtn.getAttribute('data-pl-del'); });
          studioState.sel = null; save(); global.App.render(); return;
        }
      });
      var kw = root.querySelector('#matKw');
      kw.addEventListener('input', function () {
        studioState.kw = kw.value.trim();
        clearTimeout(kw._t);
        kw._t = setTimeout(function () { studioState.limit = 42; global.App.render(); }, 300);
      });
      var ss = root.querySelector('#stScene');
      ss.addEventListener('change', function () { studioState.sceneId = ss.value; studioState.sel = null; go('#/studio?s=' + ss.value); });

      /* 拖拽定位 */
      if (stage) {
        var dragItem = null, rect = null;
        stage.addEventListener('pointerdown', function (e) {
          var el = e.target.closest('[data-pl]');
          if (!el) {
            studioState.sel = null;
            root.querySelectorAll('.placed').forEach(function (x) { x.classList.remove('on'); });
            updateProp();
            return;
          }
          studioState.sel = el.getAttribute('data-pl');
          root.querySelectorAll('.placed').forEach(function (x) { x.classList.remove('on'); });
          el.classList.add('on');
          dragItem = el;
          rect = stage.getBoundingClientRect();
          updateProp();
          if (el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) { } }
          e.preventDefault();
        });
        stage.addEventListener('pointermove', function (e) {
          if (!dragItem || !rect) return;
          var x = (e.clientX - rect.left) / rect.width * 100;
          var y = (e.clientY - rect.top) / rect.height * 100;
          x = S.clamp(x, 3, 97); y = S.clamp(y, 5, 95);
          dragItem.style.left = x + '%';
          dragItem.style.top = y + '%';
          var it = scene.layout.filter(function (o) { return o.id === studioState.sel; })[0];
          if (it) { it.x = Math.round(x * 10) / 10; it.y = Math.round(y * 10) / 10; }
        });
        window.addEventListener('pointerup', function () {
          if (dragItem) { dragItem = null; rect = null; save(); updateProp(); }
        });
      }
      function updateProp() {
        var box = root.querySelector('#propBox');
        if (!box) return;
        box.innerHTML = studioState.sel ? propPanel(scene, studioState.sel) : '<div class="hint">点击画布中的素材以编辑属性</div>';
        bindProp();
      }
      function bindProp() {
        var box = root.querySelector('#propBox');
        var sc = scene;
        var range = box.querySelector('#plScale');
        if (range) range.addEventListener('input', function () {
          var it = sc.layout.filter(function (o) { return o.id === studioState.sel; })[0];
          if (!it) return;
          it.scale = parseFloat(range.value);
          var el = root.querySelector('[data-pl="' + studioState.sel + '"]');
          if (el) { var size = 44 * it.scale; el.style.width = size + 'px'; el.style.height = size + 'px'; }
          box.querySelector('#plScaleTxt').textContent = it.scale.toFixed(2) + '×';
          save();
        });
        var top = box.querySelector('[data-pl-top]');
        if (top) top.addEventListener('click', function () {
          var it = sc.layout.filter(function (o) { return o.id === studioState.sel; })[0];
          if (!it) return;
          sc.layout = sc.layout.filter(function (o) { return o.id !== it.id; });
          sc.layout.push(it); save(); U.toast('已置于最前'); global.App.render();
        });
      }
      bindProp();

      function addMaterial(mid) {
        var m = S.materials().filter(function (x) { return x.id === mid; })[0];
        scene.layout = scene.layout || [];
        if (scene.layout.length >= 40) { U.toast('单个场景最多布展 40 件素材', 'err'); return; }
        var n = scene.layout.length;
        var it = {
          id: S.uid('pl'), materialId: mid,
          x: 30 + (n % 5) * 10 + (n % 3) * 2,
          y: 42 + (Math.floor(n / 5) % 3) * 16,
          scale: 1
        };
        scene.layout.push(it);
        studioState.sel = it.id;
        save(); U.toast('已添加：' + m.name);
        global.App.render();
      }
    }
  };

  function propPanel(scene, plId) {
    var it = (scene.layout || []).filter(function (o) { return o.id === plId; })[0];
    if (!it) return '<div class="hint">点击画布中的素材以编辑属性</div>';
    var m = S.materials().filter(function (x) { return x.id === it.materialId; })[0] || {};
    return `<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
        <div class="mat-thumb" style="width:40px;height:40px">${S.matIconSVG(m.shape, m.color)}</div>
        <div><b style="font-size:13px">${S.esc(m.name || '素材')}</b><div class="hint">${m.cat || ''}</div></div>
      </div>
      <div class="prop-row"><label>横坐标</label><input type="number" value="${it.x.toFixed(1)}" disabled /></div>
      <div class="prop-row"><label>纵坐标</label><input type="number" value="${it.y.toFixed(1)}" disabled /></div>
      <div class="prop-row"><label>比例</label><input type="range" id="plScale" min="0.5" max="2.2" step="0.05" value="${it.scale || 1}" />
        <b id="plScaleTxt" style="width:38px;text-align:right;font-size:12px">${(it.scale || 1).toFixed(2)}×</b></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-sm" style="flex:1" data-pl-top>置于最前</button>
        <button class="btn btn-sm btn-danger" style="flex:1" data-pl-del="${it.id}">移除</button>
      </div>`;
  }

  function open3DPreview(scene) {
    var m = U.modal({
      title: '3D 场景预览', sub: S.esc(scene.title), size: 'xwide',
      body: `<div class="scene-stage" style="height:420px" id="pvStage">
        <canvas id="pvCanvas" style="width:100%;height:100%"></canvas>
        <div class="stage-veil"></div>
        <div class="stage-hud"><span class="hud-pill"><i></i>3D 场景渲染中</span>
          <span class="hud-pill">拖动旋转视角 · 滚轮前后移动</span></div>
      </div>`,
      footer: '<button class="btn btn-primary" data-close>关闭预览</button>',
      onMount: function (api) {
        var canvas = api.el.querySelector('#pvCanvas');
        var st = createStage(canvas, scene, {});
        global.App.disposers.push(function () { st.api.destroy(); });
      },
      onClose: function () { }
    });
    return m;
  }

  /* ---------- 互动任务编辑 ---------- */
  function newTask(scene, kind) {
    var t = kind === 'quiz'
      ? { id: S.uid('tk'), kind: 'quiz', title: '答题闯关', questions: [{ q: '', options: ['', '', '', ''], answer: 0 }] }
      : { id: S.uid('tk'), kind: 'match', title: '知识连线', pairs: [{ l: '', r: '' }] };
    scene.tasks = scene.tasks || [];
    scene.tasks.push(t);
    save();
    openTaskEditor(scene, t.id);
  }

  function openTaskEditor(scene, tid) {
    var t = (scene.tasks || []).filter(function (x) { return x.id === tid; })[0];
    if (!t) return;
    var body = t.kind === 'quiz' ? quizEditorHTML(t) : matchEditorHTML(t);
    U.modal({
      title: t.kind === 'quiz' ? '答题闯关任务' : '知识连线任务',
      sub: '编辑后可从场景内试玩',
      size: 'wide',
      body: body,
      footer: '<button class="btn left" id="tkPlay">' + S.icon('play') + ' 试玩</button><button class="btn" data-close>取消</button><button class="btn btn-primary" id="tkOk">保存</button>',
      onMount: function (api) {
        api.el.querySelector('#tkOk').addEventListener('click', function () {
          collect();
          save(); api.close(); U.toast('任务已保存'); global.App.render();
        });
        api.el.querySelector('#tkPlay').addEventListener('click', function () {
          collect();
          if (t.kind === 'quiz') playQuiz(t, function () { });
          else playMatch(t, function () { });
        });
        if (t.kind === 'quiz') {
          api.el.addEventListener('click', function (e) {
            if (e.target.closest('[data-addq]')) {
              collect();
              t.questions.push({ q: '', options: ['', '', '', ''], answer: 0 });
              api.body.innerHTML = quizEditorHTML(t); bindQuiz(api, t);
            }
            var rm = e.target.closest('[data-rmq]');
            if (rm) {
              collect();
              t.questions.splice(parseInt(rm.getAttribute('data-rmq'), 10), 1);
              api.body.innerHTML = quizEditorHTML(t); bindQuiz(api, t);
            }
            var ans = e.target.closest('[data-ans]');
            if (ans) {
              var qi = parseInt(ans.getAttribute('data-qi'), 10);
              t.questions[qi].answer = parseInt(ans.getAttribute('data-ans'), 10);
              api.body.innerHTML = quizEditorHTML(t); bindQuiz(api, t);
            }
          });
          bindQuiz(api, t);
        } else {
          api.el.addEventListener('click', function (e) {
            if (e.target.closest('[data-addp]')) {
              collect();
              t.pairs.push({ l: '', r: '' });
              api.body.innerHTML = matchEditorHTML(t); bindMatch(api, t);
            }
            var rmp = e.target.closest('[data-rmp]');
            if (rmp) {
              collect();
              t.pairs.splice(parseInt(rmp.getAttribute('data-rmp'), 10), 1);
              api.body.innerHTML = matchEditorHTML(t); bindMatch(api, t);
            }
          });
          bindMatch(api, t);
        }
        function collect() {
          var titleInp = api.el.querySelector('#tkTitle');
          if (titleInp) t.title = titleInp.value.trim() || t.title;
          if (t.kind === 'quiz') {
            api.el.querySelectorAll('[data-q]').forEach(function (ta) {
              var qi = parseInt(ta.getAttribute('data-q'), 10);
              t.questions[qi].q = ta.value;
            });
            api.el.querySelectorAll('[data-opt]').forEach(function (inp) {
              var p = inp.getAttribute('data-opt').split('-');
              t.questions[parseInt(p[0], 10)].options[parseInt(p[1], 10)] = inp.value;
            });
          } else {
            api.el.querySelectorAll('[data-l]').forEach(function (inp) {
              t.pairs[parseInt(inp.getAttribute('data-l'), 10)].l = inp.value;
            });
            api.el.querySelectorAll('[data-r]').forEach(function (inp) {
              t.pairs[parseInt(inp.getAttribute('data-r'), 10)].r = inp.value;
            });
          }
        }
      }
    });
  }

  function quizEditorHTML(t) {
    return `<label class="field"><span>任务名称</span><input id="tkTitle" value="${S.esc(t.title)}" /></label>
      <div id="qWrap">${t.questions.map(function (q, qi) {
        return `<div class="q-card">
          <div class="qh"><strong>题目 ${qi + 1}</strong>
            <button class="icon-btn" style="margin-left:auto" data-rmq="${qi}" title="删除">${S.icon('trash')}</button></div>
          <input class="btn" style="width:100%;height:34px;padding:0 10px;text-align:left;margin-bottom:9px" data-q="${qi}" value="${S.esc(q.q)}" placeholder="请输入题干" />
          ${q.options.map(function (o, oi) {
            return `<div class="opt-line">
              <span class="idx">${'ABCD'[oi]}</span>
              <input data-opt="${qi}-${oi}" class="${q.answer === oi ? 'right' : ''}" value="${S.esc(o)}" placeholder="选项内容" />
              <button class="pick ${q.answer === oi ? 'on' : ''}" data-qi="${qi}" data-ans="${oi}" title="设为正确答案">${S.icon('check')}</button>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}</div>
      <button class="btn btn-sm" data-addq>${S.icon('plus')} 添加题目</button>`;
  }
  function bindQuiz() { }

  function matchEditorHTML(t) {
    return `<label class="field"><span>任务名称</span><input id="tkTitle" value="${S.esc(t.title)}" /></label>
      <div class="hint" style="margin-bottom:10px">左侧为概念，右侧为对应解释，学生需在两侧之间连线，全部连对得分。</div>
      ${t.pairs.map(function (p, i) {
        return `<div class="q-card">
          <div class="qh"><strong>第 ${i + 1} 组</strong>
            <button class="icon-btn" style="margin-left:auto" data-rmp="${i}" title="删除">${S.icon('trash')}</button></div>
          <div class="form-grid c2">
            <input class="btn" style="height:34px;padding:0 10px;text-align:left" data-l="${i}" value="${S.esc(p.l)}" placeholder="左侧概念" />
            <input class="btn" style="height:34px;padding:0 10px;text-align:left" data-r="${i}" value="${S.esc(p.r)}" placeholder="右侧对应内容" />
          </div>
        </div>`;
      }).join('')}
      <button class="btn btn-sm" data-addp>${S.icon('plus')} 添加一组</button>`;
  }
  function bindMatch() { }

  /* ---------- 互动任务试玩 ---------- */
  function playQuiz(t, done) {
    var idx = 0, score = 0, answered = false;
    var api = U.modal({
      title: t.title || '答题闯关', sub: '答题闯关', footer: null,
      body: '<div id="qzBody"></div>',
      onMount: function (a) {
        renderQ();
        a.el.addEventListener('click', function (e) {
          var opt = e.target.closest('[data-opt]');
          if (opt && !answered) {
            answered = true;
            var pick = parseInt(opt.getAttribute('data-opt'), 10);
            var q = t.questions[idx];
            var right = pick === q.answer;
            if (right) score += Math.round(100 / t.questions.length);
            a.el.querySelectorAll('[data-opt]').forEach(function (x, i) {
              if (i === q.answer) x.style.background = 'var(--ok-bg)', x.style.borderColor = '#9BDCC0';
              if (i === pick && !right) x.style.background = 'var(--danger-bg)', x.style.borderColor = '#F0C4C4';
            });
            var nxt = a.el.querySelector('#qzNext');
            if (nxt) { nxt.disabled = false; nxt.textContent = idx === t.questions.length - 1 ? '查看结果' : '下一题'; }
          }
          if (e.target.closest('#qzNext') && answered) {
            if (idx === t.questions.length - 1) {
              a.body.innerHTML = `<div style="text-align:center;padding:16px 0">
                <div class="score-big">${score}<small>分</small></div>
                <p class="hint" style="margin-top:8px">共 ${t.questions.length} 题，答对 ${Math.round(score / 100 * t.questions.length)} 题</p>
                <button class="btn btn-primary" style="margin-top:16px" id="qzDone">完成</button></div>`;
              a.el.querySelector('#qzDone').addEventListener('click', function () {
                a.close(); if (done) done(score);
              });
            } else { idx++; answered = false; renderQ(); }
          }
        });
        function renderQ() {
          var q = t.questions[idx];
          a.body.innerHTML = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <span class="tag">第 ${idx + 1}/${t.questions.length} 题</span>
              <div class="prog" style="flex:1"><i style="width:${(idx) / t.questions.length * 100}%"></i></div>
            </div>
            <div style="font-size:14.5px;font-weight:500;margin-bottom:14px">${S.esc(q.q || '（未设置题干）')}</div>
            <div id="optWrap">
              ${q.options.map(function (o, i) {
                return `<div class="res-pick" data-opt="${i}" style="cursor:pointer">
                  <span class="idx" style="width:22px;height:22px;border-radius:6px;background:var(--primary-50);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex:0 0 22px">${'ABCD'[i]}</span>
                  <div class="rm"><strong style="white-space:normal">${S.esc(o || '—')}</strong></div>
                </div>`;
              }).join('')}
            </div>
            <div style="text-align:right;margin-top:14px"><button class="btn btn-primary" id="qzNext" disabled>${idx === t.questions.length - 1 ? '查看结果' : '下一题'}</button></div>`;
        }
      }
    });
    return api;
  }

  function playMatch(t, done) {
    var pairs = t.pairs.slice();
    var rights = pairs.map(function (p, i) { return { text: p.r, idx: i }; });
    rights.sort(function () { return Math.random() - 0.5; });
    var selLeft = null, correct = 0, total = pairs.length;
    var api = U.modal({
      title: t.title || '知识连线', sub: '点击左侧概念，再点击右侧对应内容完成连线', size: 'wide',
      body: `<div class="connect-canvas" id="cc">
        <div class="connect-col">${pairs.map(function (p, i) {
        return `<div class="connect-node" data-left="${i}">${S.esc(p.l || '（未设置）')}</div>`;
      }).join('')}</div>
        <div class="connect-col">${rights.map(function (r, i) {
        return `<div class="connect-node" data-right="${r.idx}">${S.esc(r.text || '（未设置）')}</div>`;
      }).join('')}</div>
        <svg class="connect-svg" id="ccSvg"></svg>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
        <span class="tag" id="ccTip">已连对 0 / ${total}</span>
        <button class="btn btn-sm" style="margin-left:auto" id="ccReset">重新连线</button>
        <button class="btn btn-primary btn-sm" id="ccDone">完成</button>
      </div>`,
      footer: null,
      onMount: function (a) {
        var cc = a.el.querySelector('#cc');
        var svg = a.el.querySelector('#ccSvg');
        function drawLines() {
          var nodes = cc.querySelectorAll('.connect-node');
          var rect = cc.getBoundingClientRect();
          var html = '';
          cc.querySelectorAll('.connect-node.done').forEach(function (n) {
            if (n.getAttribute('data-left') == null) return;
            var li = parseInt(n.getAttribute('data-left'), 10);
            var target = cc.querySelector('[data-right="' + li + '"]');
            if (!target) return;
            var r1 = n.getBoundingClientRect(), r2 = target.getBoundingClientRect();
            html += `<line x1="${r1.right - rect.left}" y1="${r1.top - rect.top + r1.height / 2}"
              x2="${r2.left - rect.left}" y2="${r2.top - rect.top + r2.height / 2}"
              stroke="#2BA471" stroke-width="2" stroke-linecap="round"/>`;
          });
          svg.innerHTML = html;
        }
        cc.addEventListener('click', function (e) {
          var l = e.target.closest('[data-left]');
          var r = e.target.closest('[data-right]');
          if (l) {
            if (l.classList.contains('done')) return;
            cc.querySelectorAll('[data-left]').forEach(function (x) { x.classList.remove('on'); });
            l.classList.add('on');
            selLeft = parseInt(l.getAttribute('data-left'), 10);
            return;
          }
          if (r && selLeft != null) {
            var li = selLeft;
            var ri = parseInt(r.getAttribute('data-right'), 10);
            if (li === ri) {
              r.classList.add('done');
              cc.querySelector('[data-left="' + li + '"]').classList.add('done');
              cc.querySelector('[data-left="' + li + '"]').classList.remove('on');
              correct++;
              U.toast('连线正确');
            } else {
              r.classList.add('bad');
              setTimeout(function () { r.classList.remove('bad'); }, 700);
              U.toast('连线不正确，请再试', 'err');
            }
            selLeft = null;
            a.el.querySelector('#ccTip').textContent = '已连对 ' + correct + ' / ' + total;
            drawLines();
          }
        });
        a.el.querySelector('#ccReset').addEventListener('click', function () {
          cc.querySelectorAll('.connect-node').forEach(function (x) { x.classList.remove('done', 'on', 'bad'); });
          correct = 0; selLeft = null; drawLines();
          a.el.querySelector('#ccTip').textContent = '已连对 0 / ' + total;
        });
        a.el.querySelector('#ccDone').addEventListener('click', function () {
          var sc = Math.round(correct / Math.max(1, total) * 100);
          a.close(); if (done) done(sc);
        });
        setTimeout(drawLines, 60);
      }
    });
    return api;
  }

  /* ==========================================================
     四、实践与评价
     ========================================================== */
  var playState = { sceneId: 's1', conv: [], stage: null, submitted: false };

  V.aiPlay = {
    title: '实践与评价',
    crumb: ['AI 实践空间', '实践与评价'],
    html: function (params) {
      var d = S.db();
      var scenes = d.scenes.filter(function (s) { return s.status === '已发布'; });
      if (!scenes.length) scenes = d.scenes;
      if (params && params.s) playState.sceneId = params.s;
      var sc = S.scene(playState.sceneId) || scenes[0];
      if (!sc) return `<div class="empty">请先生成并发布实践场景</div>`;
      if (sc.id !== playState.sceneId) { playState.sceneId = sc.id; playState.conv = []; }
      if (!playState.conv.length) {
        playState.conv = [{
          role: 'ai', text: '（' + sc.agent.name + '）' + welcome(sc) + ' 你可以直接向我提问，也可以点击下方推荐问题开始。'
        }];
      }
      var recs = sc.records || [];
      return `
      <div class="page-head">
        <div><div class="page-title">3D 沉浸式实践与智能评价</div>
        <div class="page-desc">360° 自主漫游场景，通过文字或语音与 3D 智能体开展角色化实践对话，完成后按评分规则输出多维度智能评分与个性化反馈</div></div>
        <div class="page-head-actions">
          <select class="btn" id="playScene" style="height:36px">
            ${scenes.map(function (s) { return `<option value="${s.id}" ${s.id === sc.id ? 'selected' : ''}>${S.esc(s.title)}</option>`; }).join('')}
          </select>
          <button class="btn" data-act="eval">${S.icon('chart')} 提交实践并评价</button>
        </div>
      </div>

      <div class="grid g-7-5">
        <div class="card" style="overflow:hidden">
          <div class="card-h"><h3>${S.esc(sc.title)}</h3><span class="tag ok">3D 场景</span>
            <div class="right"><span class="hint" id="fpsTip">拖动旋转 · 滚轮/方向键移动</span></div>
          </div>
          <div class="scene-stage" style="height:408px" id="playStage">
            <canvas id="playCanvas" style="width:100%;height:100%"></canvas>
            <div class="stage-veil"></div>
            <div class="stage-hud">
              <span class="hud-pill"><i></i>场景已加载</span>
              <span class="hud-pill">智能体：${S.esc(sc.agent.name)}</span>
              <span class="hud-pill">素材 ${(sc.layout || []).length} 件</span>
            </div>
            <div class="stage-pad">
              <button class="sp-1" data-move="f">${S.icon('up')}</button>
              <button class="sp-2" data-move="l">${S.icon('left')}</button>
              <button class="sp-3" data-move="b">${S.icon('down')}</button>
              <button class="sp-4" data-move="r">${S.icon('right')}</button>
            </div>
            <div class="stage-tools">
              <button class="btn btn-sm" data-act="auto">自动巡游</button>
              <button class="btn btn-sm" data-act="reset">回到起点</button>
            </div>
          </div>
          <div class="card-b" style="padding:12px 18px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <span class="tag line">实践主题</span>
              <span class="hint" style="flex:1;min-width:200px">${S.esc(sc.theme)}</span>
              ${(sc.tasks || []).map(function (t) {
                return `<button class="btn btn-sm" data-task="${t.id}">${S.icon(t.kind === 'quiz' ? 'check' : 'link')} ${S.esc(t.title)}</button>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>与智能体对话</h3>
            <span class="sub">${S.esc(sc.agent.role)}</span>
            <div class="right"><span class="tag line">${S.esc(sc.agent.voice)}</span></div>
          </div>
          <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
            <div class="chat-log" id="chatLog">
              ${playState.conv.map(function (m) {
                return `<div class="msg ${m.role === 'me' ? 'me' : ''}">
                  <div class="m-ava">${m.role === 'me' ? '我' : 'AI'}</div>
                  <div class="m-body">${S.esc(m.text)}</div></div>`;
              }).join('')}
            </div>
            <div class="chips" id="suggests">
              ${suggestions(sc).map(function (s) { return `<span class="chip" data-say="${S.esc(s)}">${S.esc(s)}</span>`; }).join('')}
            </div>
            <div class="chat-input">
              <button class="mic-btn" id="micBtn" title="语音输入">${S.icon('mic')}</button>
              <textarea id="chatInput" placeholder="输入你的问题或操作，Enter 发送 / Shift+Enter 换行"></textarea>
              <button class="btn btn-primary" id="sendBtn" style="height:40px">${S.icon('send')}</button>
            </div>
            <div class="hint" id="voiceTip">支持语音输入与语音播报，语音识别不可用时可直接使用键盘输入</div>
          </div>
        </div>
      </div>

      <div class="grid g-5-7" style="margin-top:16px">
        <div class="card">
          <div class="card-h"><h3>评分规则</h3><span class="sub">按权重加权</span></div>
          <div class="card-b">
            ${(sc.rules || []).map(function (r) {
              return `<div class="rule-row"><span class="rn">${S.esc(r.name)}</span>
                <div class="prog" style="width:120px"><i style="width:${r.weight * 2}%"></i></div>
                <b class="num" style="width:42px;text-align:right;font-size:12.5px">${r.weight}%</b></div>`;
            }).join('')}
            <div class="divider"></div>
            <div class="hint">评分依据实践对话中的信息采集完整度、判断依据引用、处置方案规范性与沟通表达，自动生成多维度得分与改进建议。</div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><h3>评价记录</h3><span class="sub">${recs.length} 条</span>
            <div class="right"><button class="btn btn-sm" data-act="export-rec">${S.icon('download')} 导出</button></div>
          </div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>实践者</th><th>学号</th><th>得分</th><th>对话轮次</th><th>时间</th><th>操作</th></tr></thead>
            <tbody>${recs.length ? recs.slice().reverse().map(function (r) {
              return `<tr><td>${S.esc(r.student)}</td><td class="num">${r.studentNo}</td>
                <td><b class="num" style="color:${r.score >= 85 ? 'var(--ok)' : r.score >= 70 ? 'var(--primary)' : 'var(--warn)'}">${r.score}</b></td>
                <td class="num">${r.turns}</td><td class="num">${r.time}</td>
                <td class="ops"><span class="tlink" data-rec="${r.id}">查看反馈</span></td></tr>`;
            }).join('') : '<tr><td colspan="6"><div class="empty">暂无评价记录，完成一次实践后自动生成</div></td></tr>'}</tbody>
          </table></div>
        </div>
      </div>`;
    },
    mount: function (root) {
      var sc = S.scene(playState.sceneId);
      var canvas = root.querySelector('#playCanvas');
      var stage = createStage(canvas, sc, {
        onHit: function (hit) {
          if (hit.kind === 'agent') {
            var inp = root.querySelector('#chatInput');
            if (inp) { inp.focus(); U.toast('已选中智能体 ' + sc.agent.name + '，请输入你的问题'); }
          } else if (hit.kind === 'task') {
            var t = (sc.tasks || []).filter(function (x) { return x.id === hit.id; })[0];
            if (t) {
              if (t.kind === 'quiz') playQuiz(t, function (s) { U.toast('答题闯关完成，得分 ' + s); });
              else playMatch(t, function (s) { U.toast('知识连线完成，得分 ' + s); });
            }
          } else if (hit.kind === 'mat') {
            U.toast('已查看素材：' + hit.name);
          }
        }
      });
      playState.stage = stage;
      global.App.disposers.push(function () { stage.api.destroy(); });

      root.addEventListener('click', function (e) {
        var mv = e.target.closest('[data-move]');
        if (mv) {
          var k = mv.getAttribute('data-move');
          if (k === 'f') stage.api.move(1.2, 0);
          if (k === 'b') stage.api.move(-1.2, 0);
          if (k === 'l') stage.api.move(0, -1.2);
          if (k === 'r') stage.api.move(0, 1.2);
          return;
        }
        if (e.target.closest('[data-act="auto"]')) {
          var on = stage.api.toggleAuto();
          U.toast(on ? '已开启自动巡游' : '已停止自动巡游');
          return;
        }
        if (e.target.closest('[data-act="reset"]')) { stage.api.face(); U.toast('已回到起点视角'); return; }
        var sug = e.target.closest('[data-say]');
        if (sug) { send(root, sc, sug.getAttribute('data-say')); return; }
        if (e.target.closest('#sendBtn')) { doSend(); return; }
        if (e.target.closest('[data-act="eval"]')) { submitPractice(sc); return; }
        var tk = e.target.closest('[data-task]');
        if (tk) {
          var t = (sc.tasks || []).filter(function (x) { return x.id === tk.getAttribute('data-task'); })[0];
          if (t) {
            if (t.kind === 'quiz') playQuiz(t, function (s) { U.toast('答题闯关完成，得分 ' + s); });
            else playMatch(t, function (s) { U.toast('知识连线完成，得分 ' + s); });
          }
          return;
        }
        if (e.target.closest('[data-act="export-rec"]')) {
          var rows = [['实践者', '学号', '得分', '对话轮次', '时间', '评语']];
          (sc.records || []).forEach(function (r) { rows.push([r.student, r.studentNo, r.score, r.turns, r.time, r.comment]); });
          S.downloadFile('AI实践评价记录_' + S.fmtDate() + '.csv', S.toCSV(rows));
          U.toast('评价记录已导出');
          return;
        }
        var rec = e.target.closest('[data-rec]');
        if (rec) { showRecord(sc, rec.getAttribute('data-rec')); return; }
      });

      var inp = root.querySelector('#chatInput');
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
      });
      function doSend() {
        var v = inp.value.trim();
        if (!v) return;
        inp.value = '';
        send(root, sc, v);
      }

      /* 语音输入 */
      var mic = root.querySelector('#micBtn');
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      mic.addEventListener('click', function () {
        if (!SR) {
          // 当前浏览器无语音识别能力时，按内置问句完成一轮对话
          mic.classList.add('on');
          root.querySelector('#voiceTip').textContent = '正在识别语音…';
          setTimeout(function () {
            mic.classList.remove('on');
            root.querySelector('#voiceTip').textContent = '语音识别完成';
            send(root, sc, '患者目前主要有哪些不舒服？平时用什么药控制？');
          }, 900);
          return;
        }
        var rec = new SR();
        rec.lang = 'zh-CN';
        rec.interimResults = false;
        mic.classList.add('on');
        root.querySelector('#voiceTip').textContent = '正在聆听…';
        rec.onresult = function (ev) {
          var txt = ev.results[0][0].transcript;
          root.querySelector('#voiceTip').textContent = '识别结果：' + txt;
          send(root, sc, txt);
        };
        rec.onerror = function () {
          root.querySelector('#voiceTip').textContent = '语音识别失败，请使用文字输入';
        };
        rec.onend = function () { mic.classList.remove('on'); };
        rec.start();
      });

      var ps = root.querySelector('#playScene');
      ps.addEventListener('change', function () {
        playState.sceneId = ps.value; playState.conv = [];
        go('#/play?s=' + ps.value);
      });

      /* 键盘漫游 */
      var keyHandler = function (e) {
        if (!document.getElementById('playCanvas')) { document.removeEventListener('keydown', keyHandler); return; }
        if (['INPUT', 'TEXTAREA'].indexOf((e.target.tagName || '')) >= 0) return;
        if (e.key === 'w' || e.key === 'ArrowUp') stage.api.move(0.9, 0);
        if (e.key === 's' || e.key === 'ArrowDown') stage.api.move(-0.9, 0);
        if (e.key === 'a' || e.key === 'ArrowLeft') stage.api.move(0, -0.9);
        if (e.key === 'd' || e.key === 'ArrowRight') stage.api.move(0, 0.9);
      };
      document.addEventListener('keydown', keyHandler);
      global.App.disposers.push(function () { document.removeEventListener('keydown', keyHandler); });
    }
  };

  function welcome(sc) {
    if (/COPD|呼吸|咳/.test(sc.theme)) return '医生您好，我这几天咳得厉害，痰也多了，走两步就喘…';
    if (/心|血压/.test(sc.theme)) return '最近总觉得胸口闷，上楼梯就喘不上气，晚上得垫高枕头才能睡。';
    return '您好，我是本次实践中的' + sc.agent.role + '，请开始你的实践任务。';
  }
  function suggestions(sc) {
    if (/COPD|呼吸|咳/.test(sc.theme)) return ['请问您咳嗽多久了？痰是什么颜色？', '这次气促加重有什么诱因吗？', '既往用过哪些吸入药物？', '有没有吸烟史和职业暴露史？'];
    return ['请描述一下目前的主要不适', '这种情况持续多久了？', '既往做过哪些检查？', '目前在用什么药物？'];
  }

  function agentReply(sc, text) {
    var t = text;
    var theme = sc.theme;
    if (/多久|时间|起始|什么时候/.test(t)) return '（回忆）大概二十来年了，最早是冬天咳，这几年一年比一年重，这次加重是三天前着凉以后开始的。';
    if (/痰|咳|颜色/.test(t)) return '痰是黄白色的，早上的时候多，最近两天痰量比平时多，也变粘了。';
    if (/诱因|着凉|受凉|原因/.test(t)) return '三天前下雨淋了点，晚上就开始咳得厉害，第二天走几步路就喘。';
    if (/药|吸入|治疗|用过/.test(t)) return '平时用的是吸入的那个喷雾，一天两次，喘得厉害的时候会多吸几次，具体名字记不太清了，药盒我带来了。';
    if (/吸烟|烟|职业|粉尘|暴露/.test(t)) return '年轻时抽过，一天一包，抽了二十多年，五年前戒了。以前在水泥厂做过几年，粉尘挺大的。';
    if (/过敏|家族|遗传/.test(t)) return '没有药物过敏，我父亲也有老慢支。';
    if (/查|检查|片子|血|肺功能/.test(t)) return '去年做过肺功能，说是有气流受限，片子也拍过；这次还没做检查。';
    if (/氧|吸氧|氧疗/.test(t)) return '家里有制氧机，喘得厉害的时候会吸一会儿，一般吸半个小时。';
    if (/诊断|什么病|考虑/.test(t)) return '（看向你）那大夫，我这到底是什么病？是不是又加重了？';
    if (/住院|处置|治疗|方案|用药调整/.test(t)) return '要住院吗？我家里还有老伴需要照顾，能不能先开点药回去？';
    if (/谢谢|辛苦|理解|放心/.test(t)) return '谢谢你大夫，说得挺清楚的，我心里踏实一些了。';
    if (/睡|躺|夜间|枕头/.test(t)) return '晚上躺平了就觉得闷，得垫两个枕头才舒服些，夜里会咳醒一两回。';
    if (/吃饭|胃口|体重|消瘦/.test(t)) return '胃口还行，就是这半年瘦了五六斤。';
    return '（想了想）这个我不太清楚，你具体想问哪方面？我可以再仔细说说。';
  }

  function send(root, sc, text) {
    playState.conv.push({ role: 'me', text: text });
    var log = root.querySelector('#chatLog');
    log.insertAdjacentHTML('beforeend', `<div class="msg me"><div class="m-ava">我</div><div class="m-body">${S.esc(text)}</div></div>`);
    log.scrollTop = log.scrollHeight;

    setTimeout(function () {
      var rep = agentReply(sc, text);
      playState.conv.push({ role: 'ai', text: rep });
      var l2 = document.getElementById('chatLog');
      if (!l2) return;
      l2.insertAdjacentHTML('beforeend', `<div class="msg"><div class="m-ava">AI</div><div class="m-body">${S.esc(rep)}</div></div>`);
      l2.scrollTop = l2.scrollHeight;
      // 语音播报
      if (window.speechSynthesis) {
        try {
          var u = new SpeechSynthesisUtterance(rep.replace(/（[^）]*）/g, ''));
          u.lang = 'zh-CN'; u.rate = 1.02;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch (e) { }
      }
      // 智能体动作反馈
      var tip = document.getElementById('voiceTip');
      if (tip) tip.textContent = '智能体已作出回应（形—声—动同步）';
    }, 620);
  }

  function evaluate(sc) {
    var mine = playState.conv.filter(function (m) { return m.role === 'me'; }).map(function (m) { return m.text; }).join(' ');
    var kw = ['多久', '痰', '诱因', '吸烟', '职业', '用药', '吸入', '过敏', '家族', '检查', '肺功能', '氧', '诊断', '治疗', '住院', '夜间', '体重'];
    var hit = kw.filter(function (k) { return mine.indexOf(k) >= 0; });
    var coverage = hit.length / kw.length;
    var turns = playState.conv.filter(function (m) { return m.role === 'me'; }).length;
    var polite = /您|请|谢谢|理解|放心/.test(mine) ? 1 : 0;
    var dims = (sc.rules || [{ name: '综合表现', weight: 100 }]).map(function (r, i) {
      var base = 60 + coverage * 34 + Math.min(6, turns * 1.1) + [1.5, 0, 2.4, 0][i % 4] + (i === 3 ? polite * 5 : 0);
      return S.clamp(Math.round(base), 58, 98);
    });
    var weights = (sc.rules || [{ weight: 100 }]).map(function (r) { return r.weight; });
    var wsum = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
    var score = Math.round(dims.reduce(function (a, d, i) { return a + d * weights[i]; }, 0) / wsum);
    var missed = kw.filter(function (k) { return mine.indexOf(k) < 0; }).slice(0, 4);
    var comment = '本次实践共 ' + turns + ' 轮对话，覆盖 ' + hit.length + '/' + kw.length + ' 个关键问诊要素。' +
      (coverage > 0.6 ? '信息采集较为完整，' : '信息采集仍有缺口，') +
      '鉴别诊断环节需重点补充' + (missed.length ? '「' + missed.join('」「') + '」相关信息' : '指南依据引用') + '。' +
      (polite ? '沟通中体现了对患者的共情与告知，' : '建议在告知病情时增加共情表达，') +
      '处置方案应结合分级评估给出随访计划。';
    var advice = [];
    if (coverage < 0.6) advice.push('复习 GOLD 分级与稳定期用药路径，补强问诊清单');
    if (turns < 6) advice.push('增加追问轮次，避免单轮信息采集过少');
    if (!polite) advice.push('训练病情告知与共情表达话术');
    if (!advice.length) advice.push('可尝试更高难度的鉴别诊断场景');
    return { score: score, dims: dims, comment: comment, advice: advice, turns: turns, hit: hit, missed: missed };
  }

  function submitPractice(sc) {
    var mine = playState.conv.filter(function (m) { return m.role === 'me'; }).length;
    if (mine < 1) { U.toast('请先与智能体进行至少一轮对话', 'err'); return; }
    var r = evaluate(sc);
    var rec = {
      id: S.uid('rec'), student: 'root', studentNo: '2024110200',
      score: r.score, dims: r.dims, time: S.fmtTime(), turns: r.turns, comment: r.comment
    };
    sc.records = sc.records || [];
    sc.records.push(rec);
    sc.plays = (sc.plays || 0) + 1;
    sc.avgScore = Math.round(sc.records.reduce(function (a, b) { return a + b.score; }, 0) / sc.records.length * 10) / 10;
    save();
    showScoreModal(sc, rec, r);
  }

  function showScoreModal(sc, rec, r) {
    var labels = (sc.rules || []).map(function (x) { return x.name; });
    U.modal({
      title: '智能评价结果', sub: S.esc(sc.title), size: 'wide',
      body: `<div style="display:flex;gap:22px;flex-wrap:wrap">
        <div style="flex:0 0 240px;text-align:center">
          <div class="score-big">${rec.score}<small>/100</small></div>
          <div class="hint" style="margin-top:6px">${rec.score >= 90 ? '表现优秀' : rec.score >= 80 ? '表现良好' : rec.score >= 70 ? '基本达标' : '需要加强'}</div>
          <div style="margin-top:14px;display:flex;justify-content:center">${U.radarChart(labels, r.dims, { size: 230 })}</div>
        </div>
        <div style="flex:1;min-width:260px">
          <div style="font-size:13px;font-weight:600;margin-bottom:9px">多维度得分</div>
          ${labels.map(function (l, i) {
            return `<div style="margin-bottom:11px">
              <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
                <span>${S.esc(l)}</span><b class="num">${r.dims[i]}</b></div>
              <div class="prog ${r.dims[i] >= 85 ? 'ok' : r.dims[i] >= 70 ? '' : 'warn'}"><i style="width:${r.dims[i]}%"></i></div>
            </div>`;
          }).join('')}
          <div class="divider"></div>
          <div style="font-size:13px;font-weight:600;margin-bottom:6px">个性化反馈</div>
          <p style="font-size:13px;color:var(--ink-2);line-height:1.78">${S.esc(r.comment)}</p>
          <div style="font-size:13px;font-weight:600;margin:12px 0 6px">改进建议</div>
          <ul style="font-size:13px;color:var(--ink-2);line-height:1.9;padding-left:16px;list-style:disc">
            ${r.advice.map(function (a) { return '<li>' + S.esc(a) + '</li>'; }).join('')}
          </ul>
          <div class="hint" style="margin-top:10px">评价时间 ${rec.time} · 对话 ${rec.turns} 轮 · 关键要素命中 ${r.hit.length} 项</div>
        </div>
      </div>`,
      footer: '<button class="btn left" id="dlRep">' + S.icon('download') + ' 导出评价报告</button><button class="btn btn-primary" data-close>完成</button>',
      onClose: function () { setTimeout(function () { global.App.render(); }, 30); },
      onMount: function (api) {
        api.el.querySelector('#dlRep').addEventListener('click', function () {
          var rows = [['项目', '内容'], ['实践场景', sc.title], ['实践者', rec.student], ['总分', rec.score]];
          labels.forEach(function (l, i) { rows.push([l, r.dims[i]]); });
          rows.push(['对话轮次', rec.turns], ['个性化反馈', r.comment], ['评价时间', rec.time]);
          S.downloadFile('AI实践评价报告_' + rec.student + '.csv', S.toCSV(rows));
          U.toast('评价报告已导出');
        });
      }
    });
  }

  function showRecord(sc, rid) {
    var r = (sc.records || []).filter(function (x) { return x.id === rid; })[0];
    if (!r) return;
    var labels = (sc.rules || []).map(function (x) { return x.name; });
    U.modal({
      title: '评价详情', sub: r.student + ' · ' + r.time,
      body: `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
        <div class="score-big" style="font-size:38px">${r.score}</div>
        <div style="flex:1;min-width:180px">
          ${labels.map(function (l, i) {
            return `<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0"><span>${S.esc(l)}</span><b>${r.dims[i]}</b></div>`;
          }).join('')}
        </div>
      </div>
      <div class="divider"></div>
      <p style="font-size:13px;color:var(--ink-2);line-height:1.78">${S.esc(r.comment)}</p>`,
      footer: '<button class="btn btn-primary" data-close>关闭</button>'
    });
  }

  /* ==========================================================
     五、素材中心
     ========================================================== */
  var matState = { cat: '全部', kw: '', limit: 60 };

  V.materials = {
    title: '素材中心',
    crumb: ['AI 实践空间', '素材中心'],
    html: function () {
      var mats = S.materials();
      var cats = ['全部'].concat(S.MAT_CATS.map(function (c) { return c.cat; }));
      var pool = mats.filter(function (m) {
        if (matState.cat !== '全部' && m.cat !== matState.cat) return false;
        if (matState.kw && m.name.indexOf(matState.kw) < 0) return false;
        return true;
      });
      var shown = pool.slice(0, matState.limit);
      return `
      <div class="page-head">
        <div><div class="page-title">公共素材中心</div>
        <div class="page-desc">内置 ${mats.length} 项公共素材，覆盖 ${S.MAT_CATS.length} 个类别，可直接加入 3D 实践场景布展</div></div>
        <div class="page-head-actions">
          <input class="btn" id="matKw2" style="height:36px;width:200px;padding:0 12px;text-align:left" placeholder="搜索素材名称" value="${S.esc(matState.kw)}" />
          <button class="btn" data-go="#/studio">进入布展编辑</button>
        </div>
      </div>

      <div class="card">
        <div class="card-h" style="flex-wrap:wrap;gap:10px">
          <div class="chips" style="flex:1">
            ${cats.map(function (c) {
              var n = c === '全部' ? mats.length : mats.filter(function (m) { return m.cat === c; }).length;
              return `<span class="chip ${matState.cat === c ? 'on' : ''}" data-cat2="${c}">${c} · ${n}</span>`;
            }).join('')}
          </div>
        </div>
        <div class="card-b">
          <div class="grid g-4" style="gap:12px">
            ${shown.map(function (m) {
              return `<div class="card" style="box-shadow:none;cursor:pointer" data-view-mat="${m.id}">
                <div class="card-b" style="padding:12px;display:flex;gap:10px;align-items:center">
                  <div class="mat-thumb" style="width:44px;height:44px;flex:0 0 44px;background:#F0F5FE">${S.matIconSVG(m.shape, m.color)}</div>
                  <div style="min-width:0">
                    <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.name}</div>
                    <div class="hint">${m.cat}</div>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
          ${pool.length > shown.length ? `<div style="text-align:center;margin-top:16px">
            <button class="btn" data-act="more-mat">加载更多（剩余 ${pool.length - shown.length} 项）</button></div>` : ''}
          ${!pool.length ? `<div class="empty">${S.icon('search')}<div>没有匹配的素材</div></div>` : ''}
        </div>
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var c = e.target.closest('[data-cat2]');
        if (c) { matState.cat = c.getAttribute('data-cat2'); matState.limit = 60; global.App.render(); return; }
        if (e.target.closest('[data-act="more-mat"]')) { matState.limit += 120; global.App.render(); return; }
        var v = e.target.closest('[data-view-mat]');
        if (v) { openMatDetail(v.getAttribute('data-view-mat')); return; }
      });
      var kw = root.querySelector('#matKw2');
      kw.addEventListener('input', function () {
        matState.kw = kw.value.trim();
        clearTimeout(kw._t);
        kw._t = setTimeout(function () { matState.limit = 60; global.App.render(); }, 300);
      });
    }
  };

  function openMatDetail(mid) {
    var m = S.materials().filter(function (x) { return x.id === mid; })[0];
    var scenes = S.db().scenes;
    U.modal({
      title: m.name, sub: m.cat,
      body: `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
        <div class="mat-thumb" style="width:96px;height:96px;flex:0 0 96px;background:#F0F5FE">${S.matIconSVG(m.shape, m.color)}</div>
        <dl class="kv" style="flex:1;min-width:180px">
          <dt>素材类别</dt><dd>${m.cat}</dd>
          <dt>素材编号</dt><dd class="mono">${m.id}</dd>
          <dt>默认尺寸</dt><dd>${m.size} cm</dd>
          <dt>适用场景</dt><dd>3D 实践场景布展 / 2D 平面布展</dd>
        </dl>
      </div>
      <div class="divider"></div>
      <label class="field"><span>加入实践场景</span>
        <select id="mdScene">${scenes.map(function (s) { return `<option value="${s.id}">${S.esc(s.title)}</option>`; }).join('')}</select>
      </label>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="mdOk">加入布展</button>',
      onMount: function (api) {
        api.el.querySelector('#mdOk').addEventListener('click', function () {
          var sid = api.el.querySelector('#mdScene').value;
          var sc = S.scene(sid);
          if (!sc) return;
          sc.layout = sc.layout || [];
          sc.layout.push({ id: S.uid('pl'), materialId: m.id, x: 50, y: 70, scale: 1 });
          save(); api.close();
          U.toast('已加入「' + sc.title + '」布展');
          studioState.sceneId = sid;
        });
      }
    });
  }

  global.AIViews = { createStage: createStage, playQuiz: playQuiz, playMatch: playMatch };
})(window);
