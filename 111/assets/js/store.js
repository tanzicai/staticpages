/* ============================================================
   智课云 · 数字教材教学运行平台
   store.js —— 数据层：本地持久化、种子数据、类型定义、工具函数
   ============================================================ */
(function (global) {
  'use strict';

  var DB_KEY = 'zkc_db_v3';
  var SESSION_KEY = 'zkc_session_v3';

  /* ---------------- 基础工具 ---------------- */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(d) {
    var t = d ? new Date(d) : new Date();
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }
  function fmtTime(d) {
    var t = d ? new Date(d) : new Date();
    return fmtDate(t) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes());
  }
  function fmtHM(d) {
    var t = new Date(d);
    return pad(t.getHours()) + ':' + pad(t.getMinutes());
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d; }
  function deep(o) { return JSON.parse(JSON.stringify(o)); }

  function downloadFile(filename, content, mime) {
    try {
      var blob = new Blob(['\ufeff' + content], { type: mime || 'text/csv;charset=utf-8' });
      if (!window.URL || !window.URL.createObjectURL) return false;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      return true;
    } catch (e) { return false; }
  }
  function toCSV(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = String(c == null ? '' : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
  }

  /* ---------------- 16 种任务点类型 ---------------- */
  var TASK_TYPES = [
    { key: 'video', name: '视频', icon: 'play', color: '#2563EB', hint: '支持 MP4 / HLS，含防拖拽与学习时长采集' },
    { key: 'doc', name: '文档（笔记）', icon: 'doc', color: '#4C6BE0', hint: 'PDF / Word / PPT 在线阅读，支持划线笔记' },
    { key: 'course', name: '课程', icon: 'book', color: '#2BA471', hint: '引用平台内课程包，含完整章节结构' },
    { key: 'chapter', name: '章节', icon: 'layers', color: '#6366F1', hint: '引用教材章节，联动知识点与测评' },
    { key: 'point', name: '知识点', icon: 'star', color: '#D98A1F', hint: '绑定知识图谱节点，记录掌握度' },
    { key: 'offline', name: '线下课堂', icon: 'pin', color: '#C4573B', hint: '登记上课时间、地点与考勤方式' },
    { key: 'online', name: '线上课堂', icon: 'video', color: '#3C82F6', hint: '直播/录播教室，支持回看与连麦' },
    { key: 'discuss', name: '主题讨论', icon: 'chat', color: '#0EA5E9', hint: '教师发布议题，学生跟帖互评' },
    { key: 'ai', name: 'AI 实践', icon: 'spark', color: '#2563EB', hint: '关联 3D 实践场景与智能评价规则' },
    { key: 'homework', name: '作业', icon: 'edit', color: '#E0821F', hint: '从作业库发放，支持附件提交与批改' },
    { key: 'quiz', name: '测验', icon: 'check', color: '#2BA471', hint: '限时测验，自动判分与错题归集' },
    { key: 'selftest', name: '自测', icon: 'target', color: '#4C8BE0', hint: '学生自主练习，不限次数' },
    { key: 'survey', name: '问卷', icon: 'clipboard', color: '#38BDF8', hint: '学情调研，结果自动生成图表' },
    { key: 'approval', name: '审批', icon: 'stamp', color: '#C4573B', hint: '实践申请 / 免修申请等流程节点' },
    { key: 'task', name: '任务', icon: 'flag', color: '#5E6A82', hint: '通用任务，可设截止时间与完成标准' },
    { key: 'custom', name: '自定义', icon: 'plus', color: '#7E8AA6', hint: '自定义类型名称与完成方式' }
  ];
  var TYPE_MAP = {};
  TASK_TYPES.forEach(function (t) { TYPE_MAP[t.key] = t; });

  /* ---------------- 图标库（细线 stroke） ---------------- */
  var ICONS = {
    dash: '<path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4Zm10-13h6V4h-6v3Z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    play: '<circle cx="12" cy="12" r="8.5"/><path d="m10.5 9 5 3-5 3V9Z"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 11 6-3v8l-6-3v-2Z"/>',
    doc: '<path d="M6 3h8l5 5v13H6V3Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 17l9 5 9-5"/>',
    star: '<path d="m12 4 2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7L12 4Z"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    chat: '<path d="M20 12a7.5 7.5 0 0 1-7.5 7.5H8L4 22v-5.6A7.5 7.5 0 1 1 20 12Z"/><path d="M9 11h6M9 14h4"/>',
    spark: '<path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4M6.7 6.7 9.5 9.5M14.5 14.5l2.8 2.8M17.3 6.7 14.5 9.5M9.5 14.5l-2.8 2.8"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>',
    check: '<path d="m4 12.5 5 5L20 6.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M9 10h6M9 14h4"/>',
    stamp: '<path d="M9 4h6l-1 6h3l1.5 5H5.5L7 10h3L9 4Z"/><path d="M5 19h14"/>',
    flag: '<path d="M6 21V4M6 4h10l-1.6 3.5L16 11H6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
    up: '<path d="m6 14 6-6 6 6"/>',
    down: '<path d="m6 10 6 6 6-6"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    filter: '<path d="M4 6h16l-6 7v6l-4 2v-8L4 6Z"/>',
    download: '<path d="M12 4v10m0 0 4-4m-4 4-4-4"/><path d="M4 18h16"/>',
    upload: '<path d="M12 16V6m0 0 4 4m-4-4L8 10"/><path d="M4 18h16"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 20a6 6 0 0 0-2-4.3"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16V11M13 16V7M18 16v-3"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5h.01M17.5 14.5h.01"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M10.5 18h3"/>',
    setting: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1"/>',
    arrow: '<path d="M5 12h13m0 0-5-5m5 5-5 5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    mic: '<rect x="9" y="3" width="6" height="10" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    send: '<path d="M20 4 3 11l7 3 3 7 7-17Z"/>',
    cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12v9M12 12 4 7.5M12 12l8-4.5"/>',
    palette: '<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r="1"/><circle cx="14.5" cy="9.5" r="1"/><circle cx="15" cy="14.5" r="1"/>',
    link: '<path d="M10 13a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6"/><path d="M14 11a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L12.5 18"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    home: '<path d="m4 11 8-6.5 8 6.5v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/>',
    save: '<path d="M5 4h11l3 3v13H5V4Z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.5 16a4.5 4.5 0 0 1 5 0"/><circle cx="12" cy="19" r=".9" fill="currentColor" stroke="none"/>',
    battery: '<rect x="3" y="8" width="16" height="8" rx="2"/><path d="M21 11v2"/><rect x="5" y="10" width="9" height="4" rx="1" fill="currentColor" stroke="none"/>'
  };
  function icon(name, cls) {
    var p = ICONS[name] || ICONS.doc;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"' +
      (cls ? ' class="' + cls + '"' : '') + '>' + p + '</svg>';
  }

  /* ---------------- 公共素材库：12 类 × 15 组 × 3 款 = 540 ---------------- */
  var MAT_CATS = [
    { cat: '场景基座', color: '#2563EB', shape: 'platform', names: ['圆形展台', '方形地台', '弧形舞台', '阶梯讲台', '下沉广场', '环形跑道', '教学岛台', '圆形沙盘', '斜坡台面', '悬浮平台', '圆角基座', '多边形台', '双阶梯台', '八角地台', '岛式基台'] },
    { cat: '建筑构件', color: '#5B7BD5', shape: 'panel', names: ['立柱', '拱门', '隔断墙', '玻璃幕墙', '廊架', '旋转门', '转角楼梯', '吊顶格栅', '镂空花格', '门楣梁', '护栏组件', '电梯厅', '悬挑雨棚', '矮墙基座', '屋顶采光带'] },
    { cat: '家具陈设', color: '#B0703C', shape: 'box', names: ['讲台', '课桌', '座椅', '书架', '储物柜', '圆桌', '长凳', '茶几', '屏风', '工作台', '高脚椅', '资料架', '展示架', '洽谈桌', '折叠台'] },
    { cat: '医学模型', color: '#C4573B', shape: 'bottle', names: ['人体骨骼模型', '心脏解剖模型', '肺段模型', '肾脏剖面', '脑干模型', '脊柱节段', '血管铸型', '穴位铜人', '口腔牙列', '胚胎发育组', '关节结构', '神经丛模型', '腹腔脏器', '皮肤分层', '颈动脉模型'] },
    { cat: '实验器材', color: '#2BA471', shape: 'device', names: ['显微镜', '离心机', '恒温箱', '电子天平', '分光光度计', '超净工作台', '移液器组', '离心管架', '液氮罐', '培养箱', '灭菌锅', '滴定装置', '水浴锅', '电泳仪', '试剂柜'] },
    { cat: '植物绿植', color: '#3E9E63', shape: 'plant', names: ['散尾葵', '龟背竹', '琴叶榕', '绿萝架', '香樟盆栽', '竹林组', '苔藓墙', '多肉组合', '铁线蕨', '虎尾兰', '空中吊植', '草坪块', '藤蔓拱架', '时令花箱', '乔木孤植'] },
    { cat: '标识导视', color: '#D98A1F', shape: 'panel', names: ['楼层索引牌', '科室指引牌', '安全出口牌', '课程导视牌', '地面导流线', '台阶警示条', '功能室门牌', '总平面图牌', '分区色带', '排队一米线', '无障碍标识', '消防疏散图', '教学提示牌', '交互触控屏', '立式导向牌'] },
    { cat: '灯光氛围', color: '#E0A93F', shape: 'light', names: ['轨道射灯', '洗墙灯带', '吊装筒灯', '地埋灯', '投影氛围灯', '线性灯槽', '星空顶灯', '落地灯', '桌面台灯', '轮廓灯条', '声控灯组', '色温可调灯', '感应夜灯', '灯箱片', '光束发生器'] },
    { cat: '人物角色', color: '#2563EB', shape: 'human', names: ['主讲教师', '标准化病人', '护理人员', '门诊医生', '实习学生', '导诊人员', '实验技师', '讨论组员', '评审专家', '后勤人员', '患者家属', '志愿者', '会诊医师', '技能考官', '宣讲人员'] },
    { cat: '互动装置', color: '#0EA5E9', shape: 'screen', names: ['触控答题屏', '体感互动墙', '语音问答柱', 'AR 识别台', '全息投影柜', '多人协作桌', '答题抢答台', '虚拟翻书机', '手势识别屏', '电子签名板', '闯关打卡点', '连线互动板', '数字沙盘', '弹幕投屏', '实时评分屏'] },
    { cat: '数据看板', color: '#4C8BE0', shape: 'screen', names: ['学情总览大屏', '课堂参与看板', '成绩分布图板', '实践进度面板', '资源使用统计', '签到实时看板', '错题归集屏', '能力雷达图', '班级对比屏', '教学日程板', '设备状态屏', '预警提示屏', '评价结果屏', '成长档案屏', '课程运行屏'] },
    { cat: '装饰元素', color: '#7E8AA6', shape: 'ring', names: ['主题挂画', '几何雕塑', '水景池', '地毯纹样', '校徽浮雕', '文化石墙', '纸质吊饰', '亚克力立牌', '纤维艺术', '光影装置', '休息坐凳', '隔音软包', '圆环吊架', '立柱灯箱', '镜面装置'] }
  ];
  var VARIANTS = ['Ⅰ型', 'Ⅱ型', 'Ⅲ型'];

  function buildMaterials() {
    var out = [];
    MAT_CATS.forEach(function (c) {
      c.names.forEach(function (n, i) {
        VARIANTS.forEach(function (v, vi) {
          out.push({
            id: 'm_' + c.shape + '_' + i + '_' + vi,
            name: n + ' · ' + v,
            cat: c.cat,
            shape: c.shape,
            color: c.color,
            size: 60 + ((i * 7 + vi * 13) % 60)
          });
        });
      });
    });
    return out;
  }

  function matIconSVG(shape, color, opts) {
    opts = opts || {};
    var c = color || '#2563EB';
    var s = 'stroke="' + c + '" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"';
    var light = 'fill="' + c + '" fill-opacity="0.12" stroke="' + c + '" stroke-width="1.4"';
    switch (shape) {
      case 'platform':
        return '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="21" rx="12" ry="5.5" ' + light + '/><path d="M4 21v3c0 3 5.4 5.5 12 5.5s12-2.5 12-5.5v-3" ' + s + '/></svg>';
      case 'panel':
        return '<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="20" rx="2" ' + light + '/><path d="M12 24v5M20 24v5M10 29h12" ' + s + '/><path d="M11 10h10M11 15h7" ' + s + '/></svg>';
      case 'box':
        return '<svg viewBox="0 0 32 32"><path d="M6 10h20v14a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V10Z" ' + light + '/><path d="M6 10 9 5h14l3 5M16 5v22" ' + s + '/></svg>';
      case 'bottle':
        return '<svg viewBox="0 0 32 32"><path d="M13 4h6v5l4 4v13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V13l4-4V4Z" ' + light + '/><path d="M11 16h10M11 20h10" ' + s + '/></svg>';
      case 'device':
        return '<svg viewBox="0 0 32 32"><rect x="9" y="4" width="14" height="11" rx="2" ' + light + '/><path d="M16 15v6M11 27h10M13 27v-6M19 27v-6" ' + s + '/><circle cx="16" cy="9.5" r="2.4" ' + s + '/></svg>';
      case 'plant':
        return '<svg viewBox="0 0 32 32"><path d="M10 20h12l-2 8h-8l-2-8Z" ' + light + '/><path d="M16 20V9M16 9c-3-4-8-3-8 1s5 5 8 1m0-1c3-4 8-3 8 1s-5 5-8 1" ' + s + '/></svg>';
      case 'light':
        return '<svg viewBox="0 0 32 32"><path d="M16 4v4M10 28h12" ' + s + '/><path d="M16 8a6 6 0 0 1 6 6c0 3-2 4-2 6H12c0-2-2-3-2-6a6 6 0 0 1 6-6Z" ' + light + '/></svg>';
      case 'human':
        return '<svg viewBox="0 0 32 32"><circle cx="16" cy="9" r="4.4" ' + light + '/><path d="M7 28a9 9 0 0 1 18 0" ' + s + '/><path d="M16 13.5v7M12 30v-8M20 30v-8" ' + s + '/></svg>';
      case 'screen':
        return '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="15" rx="2" ' + light + '/><path d="M16 21v5M11 26h10" ' + s + '/><path d="M9 16v-4M13 16v-7M17 16v-5M21 16v-3" ' + s + '/></svg>';
      case 'ring':
        return '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" ' + light + '/><circle cx="16" cy="16" r="4" ' + s + '/><path d="M16 6v4M16 22v4M6 16h4M22 16h4" ' + s + '/></svg>';
      default:
        return '<svg viewBox="0 0 32 32"><path d="m16 4 11 6.2v11.6L16 28 5 21.8V10.2L16 4Z" ' + light + '/></svg>';
    }
  }


  /* 为种子场景生成默认布展 */
  function seedLayout(cats) {
    var M = buildMaterials();
    var pool = M.filter(function (m) { return cats.indexOf(m.cat) >= 0; });
    var spots = [[20, 32], [36, 24], [54, 22], [70, 28], [82, 40],
      [18, 60], [36, 56], [54, 54], [72, 58], [86, 68],
      [30, 76], [52, 78], [70, 78]];
    return spots.map(function (sp, i) {
      var m = pool[(i * 11 + 5) % pool.length];
      return { id: 'pl_' + i + '_' + Math.random().toString(36).slice(2, 6), materialId: m.id, x: sp[0], y: sp[1], scale: 1 + (i % 3) * 0.12 };
    });
  }

  function seedTasks() {
    return [
      {
        id: 'tk1', kind: 'quiz', title: '接诊要点闯关',
        questions: [
          { q: 'COPD 急性加重最常见的诱因是？', options: ['呼吸道感染', '剧烈运动', '高盐饮食', '情绪波动'], answer: 0 },
          { q: '判断持续气流受限的关键检查是？', options: ['胸部 CT', '肺功能（吸入支气管扩张剂后 FEV1/FVC < 0.70）', '血气分析', '胸片'], answer: 1 },
          { q: '急性加重期氧疗目标 SpO₂ 范围是？', options: ['80%—85%', '88%—92%', '95%—100%', '无需限定'], answer: 1 }
        ]
      },
      {
        id: 'tk2', kind: 'match', title: '分级与处置连线',
        pairs: [
          { l: 'GOLD 1 级', r: 'FEV₁ 占预计值 ≥ 80%' },
          { l: 'GOLD 2 级', r: 'FEV₁ 占预计值 50%—79%' },
          { l: 'GOLD 3 级', r: 'FEV₁ 占预计值 30%—49%' },
          { l: 'GOLD 4 级', r: 'FEV₁ 占预计值 < 30%' }
        ]
      }
    ];
  }

  /* ---------------- 种子数据 ---------------- */
  function seed() {
    var users = [
      { id: 'u_root', account: 'root', password: 'root', name: 'root', role: '教师', dept: '第一临床学院 · 内科学课程组', avatar: 'RT' }
    ];

    var courses = [
      {
        id: 'c1', name: '内科学（第9版）数字教材', code: 'NK-2026-01', term: '2026 春季学期',
        college: '第一临床学院', students: 86, classes: 2, credit: '5.0', cover: '',
        teacher: 'root', status: '运行中', refs: 12, isTextbook: true,
        chapters: [
          {
            id: 'ch1', name: '第一章 呼吸系统疾病', groups: [
              {
                id: 'g1', name: '课前导学', tasks: [
                  { id: 't1', type: 'video', title: '慢性阻塞性肺疾病诊治要点', source: 'course', resourceId: 'r1', duration: 18, required: true, desc: '重点讲解 GOLD 分级与稳定期用药路径' },
                  { id: 't2', type: 'doc', title: '拓展阅读：GOLD 2026 报告摘编', source: 'course', resourceId: 'r2', duration: 25, required: false, desc: '含 GOLD 分级更新要点标注' },
                  { id: 't3', type: 'point', title: '知识点：通气功能障碍分型', source: 'other', resourceId: 'r20', duration: 8, required: true, desc: '引用《诊断学》课程知识点' }
                ]
              },
              {
                id: 'g2', name: '课中学习', tasks: [
                  { id: 't4', type: 'offline', title: '线下课堂：肺部体格检查实操', source: 'manual', resourceId: '', duration: 90, required: true, desc: '地点：临床技能中心 A302', place: '临床技能中心 A302' },
                  { id: 't5', type: 'online', title: '线上课堂：病例讨论直播', source: 'manual', resourceId: '', duration: 45, required: true, desc: '直播教室 NK-Live-02，支持连麦提问' },
                  { id: 't6', type: 'discuss', title: '主题讨论：抗生素经验性用药边界', source: 'manual', resourceId: '', duration: 15, required: true, desc: '每人至少跟帖 1 次，需引用指南依据' },
                  { id: 't7', type: 'ai', title: 'AI 实践：COPD 急性加重接诊', source: 'manual', resourceId: '', duration: 30, required: true, desc: '3D 实践场景 + 智能评价', sceneId: 's1' }
                ]
              },
              {
                id: 'g3', name: '课后拓展', tasks: [
                  { id: 't8', type: 'homework', title: '作业：肺功能报告解读 5 例', source: 'course', resourceId: 'r4', duration: 40, required: true, desc: '提交 PDF，教师批改后计入平时成绩' },
                  { id: 't9', type: 'quiz', title: '测验：呼吸系统疾病单元测', source: 'course', resourceId: 'r5', duration: 20, required: true, desc: '限时 20 分钟，共 20 题' },
                  { id: 't10', type: 'selftest', title: '自测：血气分析判读专项', source: 'course', resourceId: 'r6', duration: 15, required: false, desc: '不限次数，错题自动归集' },
                  { id: 't11', type: 'survey', title: '问卷：本章学习困难点调研', source: 'manual', resourceId: '', duration: 5, required: false, desc: '结果用于调整下次课教学节奏' },
                  { id: 't12', type: 'approval', title: '审批：临床见习入科申请', source: 'manual', resourceId: '', duration: 3, required: false, desc: '需导师与教学秘书两级审批' }
                ]
              }
            ]
          },
          {
            id: 'ch2', name: '第二章 循环系统疾病', groups: [
              {
                id: 'g4', name: '课前导学', tasks: [
                  { id: 't13', type: 'video', title: '心力衰竭分类与诊断流程', source: 'course', resourceId: 'r7', duration: 22, required: true, desc: '含射血分数分型对照表' },
                  { id: 't14', type: 'chapter', title: '章节：冠心病章节通读', source: 'course', resourceId: 'r8', duration: 35, required: true, desc: '联动 12 个知识点掌握度' }
                ]
              },
              {
                id: 'g5', name: '课中学习', tasks: [
                  { id: 't15', type: 'task', title: '任务：心电图判读小组互评', source: 'manual', resourceId: '', duration: 25, required: true, desc: '组内互评后由教师抽评' },
                  { id: 't16', type: 'custom', title: '床旁教学查房（自定义类型）', source: 'manual', resourceId: '', duration: 60, required: false, desc: '自定义类型：床旁教学，按签到+反思记录考核' }
                ]
              }
            ]
          },
          {
            id: 'ch3', name: '第三章 消化系统疾病', groups: [
              {
                id: 'g6', name: '课前导学', tasks: [
                  { id: 't17', type: 'course', title: '课程：《消化内镜基础》微课包', source: 'other', resourceId: 'r21', duration: 55, required: false, desc: '引用本人另一门课程的微课资源' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'c2', name: '诊断学（第9版）数字教材', code: 'ZD-2026-02', term: '2026 春季学期',
        college: '第一临床学院', students: 92, classes: 3, credit: '4.0', teacher: 'root', status: '运行中', refs: 9, isTextbook: true,
        chapters: [
          { id: 'd1', name: '第一章 常见症状', groups: [{ id: 'dg1', name: '课前导学', tasks: [] }] },
          { id: 'd2', name: '第二章 体格检查', groups: [{ id: 'dg2', name: '课中学习', tasks: [] }] }
        ]
      },
      {
        id: 'c3', name: '外科学总论（第9版）数字教材', code: 'WK-2026-03', term: '2026 春季学期',
        college: '第二临床学院', students: 78, classes: 2, credit: '4.5', teacher: 'root', status: '筹备中', refs: 6, isTextbook: true,
        chapters: [
          { id: 'w1', name: '第一章 无菌术', groups: [{ id: 'wg1', name: '课前导学', tasks: [] }] }
        ]
      }
    ];

    var resources = [
      { id: 'r1', courseId: 'c1', name: '慢性阻塞性肺疾病诊治要点（微课）', type: 'video', size: '186 MB', duration: '18:24', chapter: '第一章', updated: fmtDate(daysAgo(12)) },
      { id: 'r2', courseId: 'c1', name: 'GOLD 2026 报告摘编（标注版）', type: 'doc', size: '4.2 MB', duration: '25 页', chapter: '第一章', updated: fmtDate(daysAgo(9)) },
      { id: 'r3', courseId: 'c1', name: '肺部体格检查操作规范', type: 'video', size: '240 MB', duration: '22:10', chapter: '第一章', updated: fmtDate(daysAgo(20)) },
      { id: 'r4', courseId: 'c1', name: '肺功能报告解读案例集', type: 'doc', size: '2.8 MB', duration: '18 页', chapter: '第一章', updated: fmtDate(daysAgo(6)) },
      { id: 'r5', courseId: 'c1', name: '呼吸系统疾病单元测题库', type: 'quiz', size: '—', duration: '20 题', chapter: '第一章', updated: fmtDate(daysAgo(5)) },
      { id: 'r6', courseId: 'c1', name: '血气分析判读自测包', type: 'quiz', size: '—', duration: '24 题', chapter: '第一章', updated: fmtDate(daysAgo(4)) },
      { id: 'r7', courseId: 'c1', name: '心力衰竭分类与诊断流程', type: 'video', size: '205 MB', duration: '22:36', chapter: '第二章', updated: fmtDate(daysAgo(3)) },
      { id: 'r8', courseId: 'c1', name: '冠心病章节（教材原文）', type: 'chapter', size: '—', duration: '35 页', chapter: '第二章', updated: fmtDate(daysAgo(30)) },
      { id: 'r9', courseId: 'c1', name: '心电图判读图谱（120 例）', type: 'doc', size: '36 MB', duration: '120 页', chapter: '第二章', updated: fmtDate(daysAgo(15)) },
      { id: 'r10', courseId: 'c1', name: '消化系统疾病概述（课件）', type: 'doc', size: '12 MB', duration: '42 页', chapter: '第三章', updated: fmtDate(daysAgo(8)) },
      { id: 'r11', courseId: 'c1', name: '内科学期末综合测评卷', type: 'quiz', size: '—', duration: '80 题', chapter: '综合', updated: fmtDate(daysAgo(2)) },
      { id: 'r12', courseId: 'c1', name: '住院医师规范化培训衔接要点', type: 'doc', size: '6.1 MB', duration: '30 页', chapter: '综合', updated: fmtDate(daysAgo(11)) },
      { id: 'r20', courseId: 'c2', name: '知识点：通气功能障碍分型', type: 'point', size: '—', duration: '8 分钟', chapter: '第三章', updated: fmtDate(daysAgo(7)) },
      { id: 'r21', courseId: 'c2', name: '《消化内镜基础》微课包', type: 'course', size: '1.2 GB', duration: '55 分钟', chapter: '第一章', updated: fmtDate(daysAgo(18)) },
      { id: 'r22', courseId: 'c2', name: '症状学问诊标准化病人脚本', type: 'doc', size: '3.4 MB', duration: '14 页', chapter: '第一章', updated: fmtDate(daysAgo(6)) },
      { id: 'r23', courseId: 'c2', name: '全身体格检查操作视频', type: 'video', size: '320 MB', duration: '31:05', chapter: '第二章', updated: fmtDate(daysAgo(13)) },
      { id: 'r24', courseId: 'c2', name: '腹部触诊手法要点', type: 'video', size: '168 MB', duration: '14:20', chapter: '第二章', updated: fmtDate(daysAgo(10)) },
      { id: 'r25', courseId: 'c2', name: '诊断学阶段测验卷 A', type: 'quiz', size: '—', duration: '30 题', chapter: '综合', updated: fmtDate(daysAgo(4)) },
      { id: 'r26', courseId: 'c3', name: '无菌术操作规范（4K）', type: 'video', size: '480 MB', duration: '26:48', chapter: '第一章', updated: fmtDate(daysAgo(22)) },
      { id: 'r27', courseId: 'c3', name: '手术基本操作视频合集', type: 'video', size: '620 MB', duration: '48:12', chapter: '第一章', updated: fmtDate(daysAgo(19)) },
      { id: 'r28', courseId: 'c3', name: '外科总论单元测题库', type: 'quiz', size: '—', duration: '25 题', chapter: '第一章', updated: fmtDate(daysAgo(9)) }
    ];

    var activities = [
      {
        id: 'a1', courseId: 'c1', type: '签到', title: '第二章 循环系统疾病 课前签到',
        status: '已结束', createdAt: fmtTime(daysAgo(2)), duration: 5, total: 86, joined: 84,
        options: [], responses: [], signRecords: 84
      },
      {
        id: 'a2', courseId: 'c1', type: '抢答', title: '心衰利尿剂抵抗处理抢答',
        status: '已结束', createdAt: fmtTime(daysAgo(2)), duration: 10, total: 86, joined: 31,
        options: [], responses: []
      },
      {
        id: 'a3', courseId: 'c1', type: '投票', title: '课堂投票：首选检查项目',
        status: '已结束', createdAt: fmtTime(daysAgo(1)), total: 86, joined: 79,
        options: [{ name: '胸部 CT', votes: 46 }, { name: '胸片', votes: 18 }, { name: '肺功能', votes: 12 }, { name: '血气分析', votes: 3 }],
        responses: []
      }
    ];

    var homework = [
      {
        id: 'h1', courseId: 'c1', title: '肺功能报告解读 5 例', chapter: '第一章', due: fmtDate(daysAgo(-3)),
        require: 'PDF 格式，需标注分级依据', score: 10, total: 86, submitted: 71, graded: 58, avg: 8.2,
        subs: []
      },
      {
        id: 'h2', courseId: 'c1', title: '心衰患者长期管理方案设计', chapter: '第二章', due: fmtDate(daysAgo(-7)),
        require: '小组作业，每组 ≤ 2000 字', score: 20, total: 86, submitted: 24, graded: 0, avg: 0, subs: []
      }
    ];

    var preStudy = [
      { id: 'p1', courseId: 'c1', chapter: '第一章 呼吸系统疾病', kind: '视频', title: '慢性阻塞性肺疾病诊治要点', target: 86, done: 79, avgTime: '16 分 42 秒' },
      { id: 'p2', courseId: 'c1', chapter: '第一章 呼吸系统疾病', kind: '拓展阅读', title: 'GOLD 2026 报告摘编', target: 86, done: 63, avgTime: '21 分 08 秒' },
      { id: 'p3', courseId: 'c1', chapter: '第二章 循环系统疾病', kind: '视频', title: '心力衰竭分类与诊断流程', target: 86, done: 51, avgTime: '19 分 30 秒' }
    ];

    var scenes = [
      {
        id: 's1', courseId: 'c1', title: 'COPD 急性加重接诊实践', theme: '呼吸内科门诊接诊：65 岁男性，咳嗽咳痰 20 年，气促加重 3 天',
        agent: { name: '王建国', role: '标准化病人 · 65 岁男性', voice: '男声·中年·略沙哑', style: '配合型', avatar: 'human' },
        rules: [{ name: '问诊完整性', weight: 30 }, { name: '鉴别诊断准确性', weight: 30 }, { name: '处置规范性', weight: 25 }, { name: '人文沟通', weight: 15 }],
        layout: seedLayout(['家具陈设', '医学模型', '标识导视', '灯光氛围', '人物角色', '植物绿植', '数据看板', '互动装置', '场景基座']),
        tasks: seedTasks(), status: '已发布', createdAt: fmtDate(daysAgo(10)), plays: 64, avgScore: 84.6,
        records: [
          { id: 'rec1', student: '李思远', studentNo: '2024110231', score: 88, dims: [90, 88, 86, 86], time: fmtTime(daysAgo(3)), turns: 12, comment: '问诊层次清晰，对诱因与用药史追问到位；鉴别诊断环节对支气管哮喘的鉴别证据组织略显单薄。' },
          { id: 'rec2', student: '陈可欣', studentNo: '2024110244', score: 92, dims: [94, 90, 92, 92], time: fmtTime(daysAgo(2)), turns: 15, comment: '接诊流程完整，能主动确认吸入装置使用情况，处置方案与指南一致，沟通共情表现突出。' },
          { id: 'rec3', student: '赵明宇', studentNo: '2024110256', score: 76, dims: [80, 74, 72, 78], time: fmtTime(daysAgo(1)), turns: 8, comment: '问诊遗漏职业暴露史与既往急性加重次数；处置环节未提及氧疗目标范围，建议复习 GOLD 分级内容。' }
        ]
      },
      {
        id: 's2', courseId: 'c1', title: '心力衰竭病房查房实践', theme: '心血管内科病房：射血分数降低型心衰患者的查房与用药调整',
        agent: { name: '李护士长', role: '病房护理负责人', voice: '女声·青年·清晰', style: '引导型', avatar: 'human' },
        rules: [{ name: '病史梳理', weight: 25 }, { name: '查体规范', weight: 30 }, { name: '用药调整合理性', weight: 30 }, { name: '团队协作', weight: 15 }],
        layout: seedLayout(['家具陈设', '医学模型', '灯光氛围', '植物绿植', '标识导视']),
        tasks: [], status: '草稿', createdAt: fmtDate(daysAgo(4)), plays: 0, avgScore: 0, records: []
      }
    ];

    var orders = [];
    var names = ['张宇轩', '李思远', '陈可欣', '赵明宇', '周雨桐', '吴嘉禾', '孙岚', '郑一诺', '冯书瑶', '钱思齐', '许清和', '何雨薇'];
    var channels = ['微信支付', '支付宝', '校园统一支付'];
    var prices = [68, 68, 68, 58, 68, 48, 68, 68, 58, 68, 68, 48];
    for (var i = 0; i < 12; i++) {
      orders.push({
        id: 'o' + (1001 + i),
        book: i % 3 === 0 ? '诊断学（第9版）数字教材' : (i % 3 === 1 ? '内科学（第9版）数字教材' : '外科学总论（第9版）数字教材'),
        buyer: names[i], college: ['第一临床学院', '第二临床学院', '儿科学院', '口腔医学院'][i % 4],
        amount: prices[i], channel: channels[i % 3],
        time: fmtTime(daysAgo(11 - i)), status: i === 4 ? '已退款' : '已支付'
      });
    }

    var learners = [];
    var base = 206;
    for (var d = 13; d >= 0; d--) {
      base += 3 + ((d * 13) % 6);
      learners.push({ date: fmtDate(daysAgo(d)), count: base, active: 38 + ((d * 37) % 42) });
    }

    var refs = [
      { school: '重庆医科大学第一临床学院', teacher: '王振华', className: '2024 级临床医学 1 班', students: 36, date: fmtDate(daysAgo(40)), type: '开设班级' },
      { school: '重庆医科大学第一临床学院', teacher: '刘敏', className: '2024 级临床医学 2 班', students: 34, date: fmtDate(daysAgo(38)), type: '开设班级' },
      { school: '重庆医科大学儿科学院', teacher: '陈立', className: '2024 级儿科医学 1 班', students: 28, date: fmtDate(daysAgo(35)), type: '开设班级' },
      { school: '重庆医科大学口腔医学院', teacher: '周文静', className: '2024 级口腔医学 1 班', students: 26, date: fmtDate(daysAgo(33)), type: '开设班级' },
      { school: '重庆医科大学第二临床学院', teacher: '李国强', className: '2023 级临床医学 5 班', students: 38, date: fmtDate(daysAgo(30)), type: '开设班级' },
      { school: '重庆医科大学中医药学院', teacher: '黄珊', className: '2024 级中西结合 1 班', students: 22, date: fmtDate(daysAgo(28)), type: '教材引用' },
      { school: '重庆医科大学公共卫生学院', teacher: '赵鹏', className: '2023 级预防医学 2 班', students: 24, date: fmtDate(daysAgo(26)), type: '教材引用' },
      { school: '重庆医科大学护理学院', teacher: '孙晓岚', className: '2024 级护理学 3 班', students: 28, date: fmtDate(daysAgo(24)), type: '教材引用' },
      { school: '重庆医科大学检验医学院', teacher: '吴凡', className: '2023 级检验技术 1 班', students: 20, date: fmtDate(daysAgo(21)), type: '教材引用' },
      { school: '重庆医科大学麻醉学系', teacher: '郑海涛', className: '2024 级麻醉学 1 班', students: 18, date: fmtDate(daysAgo(18)), type: '教材引用' },
      { school: '重庆医科大学影像医学系', teacher: '何瑾', className: '2023 级影像医学 2 班', students: 22, date: fmtDate(daysAgo(15)), type: '开设班级' },
      { school: '重庆医科大学全科医学院', teacher: '冯远', className: '2024 级全科医学 1 班', students: 26, date: fmtDate(daysAgo(12)), type: '教材引用' }
    ];

    return {
      version: 4,
      users: users,
      currentCourseId: 'c1',
      courses: courses,
      resources: resources,
      activities: activities,
      homework: homework,
      preStudy: preStudy,
      scenes: scenes,
      orders: orders,
      learners: learners,
      refs: refs,
      textbook: {
        id: 'tb1', title: '内科学（第9版）数字教材', isbn: '978-7-117-35218-6',
        paid: true, price: 68, freeChapters: ['第一章 呼吸系统疾病'],
        trialPages: 12, updated: fmtDate(daysAgo(2))
      },
      survey: { title: '本章学习困难点调研', count: 74, items: [{ label: '酸碱失衡判读', v: 38 }, { label: '抗生素选择', v: 27 }, { label: '影像读片', v: 21 }, { label: '其他', v: 8 }] },
      logs: [
        { time: fmtTime(daysAgo(1)), text: '教材《内科学（第9版）数字教材》版本更新至 v3.2，同步 12 个知识点' },
        { time: fmtTime(daysAgo(2)), text: 'AI 实践场景「COPD 急性加重接诊实践」新增答题闯关任务 1 组' },
        { time: fmtTime(daysAgo(3)), text: '第二章 循环系统疾病 任务编排完成，共 5 个任务点' }
      ]
    };
  }

  /* ---------------- 数据访问 ---------------- */
  var DB = null;
  function load() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (raw) {
        DB = JSON.parse(raw);
        if (DB && DB.version === 4) return DB;
      }
    } catch (e) { }
    DB = seed();
    save();
    return DB;
  }
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) { }
    try { global.dispatchEvent(new CustomEvent('zkc:change')); } catch (e) { }
  }
  function reset() {
    DB = seed(); save();
  }
  function db() { if (!DB) load(); return DB; }

  function session() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function setSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }

  /* ---------------- 便捷查询 ---------------- */
  function course(id) {
    var d = db();
    return d.courses.filter(function (c) { return c.id === (id || d.currentCourseId); })[0] || d.courses[0];
  }
  function currentCourse() { return course(db().currentCourseId); }
  function chapter(cid, chid) {
    var c = course(cid);
    return (c.chapters || []).filter(function (x) { return x.id === chid; })[0] || null;
  }
  function group(cid, chid, gid) {
    var ch = chapter(cid, chid);
    if (!ch) return null;
    return (ch.groups || []).filter(function (g) { return g.id === gid; })[0] || null;
  }
  function allTasks(cid) {
    var c = course(cid), out = [];
    (c.chapters || []).forEach(function (ch) {
      (ch.groups || []).forEach(function (g) {
        (g.tasks || []).forEach(function (t) {
          out.push(Object.assign({}, t, { chapterId: ch.id, chapterName: ch.name, groupId: g.id, groupName: g.name }));
        });
      });
    });
    return out;
  }
  function resource(id) {
    var d = db();
    return d.resources.filter(function (r) { return r.id === id; })[0] || null;
  }
  function courseResources(cid) {
    return db().resources.filter(function (r) { return r.courseId === (cid || db().currentCourseId); });
  }
  function otherResources(cid) {
    return db().resources.filter(function (r) { return r.courseId !== (cid || db().currentCourseId); });
  }
  function scene(id) {
    return db().scenes.filter(function (s) { return s.id === id; })[0] || null;
  }
  function materials() {
    if (!DB._materials) DB._materials = buildMaterials();
    return DB._materials;
  }

  /* ---------------- 消息 ---------------- */
  var notices = [
    { t: '教材版本更新提醒', d: '《内科学（第9版）数字教材》已更新至 v3.2，涉及 12 个知识点', time: '10 分钟前' },
    { t: '作业提交提醒', d: '肺功能报告解读作业已有 71 人提交，尚有 15 人未提交', time: '1 小时前' },
    { t: 'AI 实践评价完成', d: 'COPD 接诊实践新增 8 条评价记录，平均分 85.2', time: '今天 09:12' },
    { t: '付费订单提醒', d: '本月新增购买记录 12 笔，累计金额 ¥764.00', time: '昨天 18:40' }
  ];

  /* ---------------- 导出 ---------------- */
  global.Store = {
    DB_KEY: DB_KEY, SESSION_KEY: SESSION_KEY,
    TASK_TYPES: TASK_TYPES, TYPE_MAP: TYPE_MAP, MAT_CATS: MAT_CATS,
    icon: icon, ICONS: ICONS, matIconSVG: matIconSVG,
    uid: uid, fmtDate: fmtDate, fmtTime: fmtTime, fmtHM: fmtHM, esc: esc, clamp: clamp, num: num, deep: deep,
    downloadFile: downloadFile, toCSV: toCSV,
    db: db, save: save, load: load, reset: reset, seed: seed,
    session: session, setSession: setSession,
    course: course, currentCourse: currentCourse, chapter: chapter, group: group,
    allTasks: allTasks, resource: resource, courseResources: courseResources, otherResources: otherResources,
    scene: scene, materials: materials, notices: notices
  };
})(window);
