/* =========================================================
   知行课程平台 · 公共层
   - 平台顶部模块导航注入
   - localStorage 数据层（Store）+ 演示种子数据
   - 通用工具：$ / $$ / toast / refreshIcons / el / uid
   说明：整文件包裹在 IIFE 中，避免与 index 页 app.js 的全局声明冲突。
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 工具 ---------- */
  var $ = function (sel, scope) {
    return (scope || document).querySelector(sel);
  };
  var $$ = function (sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  };
  var uid = function (prefix) {
    return (prefix || "id") + "-" + Math.random().toString(36).slice(2, 8);
  };
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.indexOf("data-") === 0) node.setAttribute(k, attrs[k]);
        else if (k === "for") node.setAttribute("for", attrs[k]);
        else node[k] = attrs[k];
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }
  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  }
  function ensureToastRegion() {
    var region = $("#toastRegion");
    if (!region) {
      region = el("div", { class: "toast-region", id: "toastRegion" });
      document.body.appendChild(region);
    }
    return region;
  }
  function toast(message, icon) {
    var region = ensureToastRegion();
    var t = el("div", { class: "toast" });
    t.innerHTML =
      '<i data-lucide="' + (icon || "circle-check") + '"></i><span></span>';
    t.querySelector("span").textContent = message;
    region.appendChild(t);
    refreshIcons();
    setTimeout(function () {
      t.style.opacity = "0";
      t.style.transform = "translateY(6px)";
      setTimeout(function () {
        t.remove();
      }, 180);
    }, 2600);
  }
  function formatDate(d) {
    d = d || new Date();
    function pad(n) {
      return n < 10 ? "0" + n : "" + n;
    }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  /* ---------- 触感反馈（支持振动的设备生效，如部分安卓机） ---------- */
  function haptic(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern || 10);
    } catch (e) {}
  }

  /* ---------- 骨架屏占位 ---------- */
  function skeleton(lines) {
    var box = el("div", { class: "skeleton-block", "aria-hidden": "true" });
    var n = lines || 4;
    for (var i = 0; i < n; i++) {
      var line = el("div", { class: "skeleton-line" });
      if (i === 0) line.classList.add("title");
      if (i === n - 1) line.classList.add("short");
      box.appendChild(line);
    }
    return box;
  }

  /* ---------- 确认弹窗（替代原生 confirm，返回 Promise<boolean>） ---------- */
  function confirmDialog(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var dlg = el("dialog", { class: "modal confirm-modal" });
      dlg.innerHTML =
        '<div class="modal-head"><h3></h3></div>' +
        '<div class="modal-body">' +
        '<div class="confirm-icon"><i data-lucide="' + (opts.danger ? "alert-octagon" : "alert-triangle") + '"></i></div>' +
        '<p class="confirm-text"></p>' +
        "</div>" +
        '<div class="modal-foot">' +
        '<button type="button" class="btn btn-ghost" data-act="cancel"></button>' +
        '<button type="button" class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" data-act="ok"></button>' +
        "</div>";
      dlg.querySelector("h3").textContent = opts.title || "操作确认";
      dlg.querySelector(".confirm-text").textContent = opts.message || "确定执行该操作吗？";
      if (opts.danger) dlg.querySelector(".confirm-icon").classList.add("danger");
      dlg.querySelector('[data-act="ok"]').textContent = opts.okText || "确定";
      dlg.querySelector('[data-act="cancel"]').textContent = opts.cancelText || "取消";
      document.body.appendChild(dlg);
      refreshIcons();
      function done(val) {
        dlg.close();
        dlg.remove();
        resolve(val);
      }
      dlg.querySelector('[data-act="ok"]').addEventListener("click", function () { done(true); });
      dlg.querySelector('[data-act="cancel"]').addEventListener("click", function () { done(false); });
      dlg.addEventListener("cancel", function () { resolve(false); });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) done(false); });
      dlg.showModal();
    });
  }

  /* ---------- 移动端边缘右滑返回手势 ---------- */
  function enableSwipeBack(container, onBack) {
    var startX = 0, startY = 0, tracking = false, fromEdge = false;
    container.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      var rect = container.getBoundingClientRect();
      startX = t.clientX;
      startY = t.clientY;
      fromEdge = startX - rect.left < 40;
      tracking = true;
    }, { passive: true });
    container.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      if (!fromEdge) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = Math.abs(t.clientY - startY);
      if (dx > 72 && dy < 48) {
        haptic(14);
        onBack();
      }
    }, { passive: true });
  }

  /* ---------- 模块导航 ---------- */
  var MODULES = [
    { id: "home", href: "index.html", label: "总览", icon: "layout-dashboard" },
    { id: "graph", href: "knowledge-graph.html", label: "知识图谱", icon: "network" },
    { id: "kb", href: "ai-knowledge-base.html", label: "AI知识库", icon: "database" },
    { id: "review", href: "security-review.html", label: "智能审核", icon: "shield-check" },
    { id: "interp", href: "ai-interpretation.html", label: "AI解读", icon: "sparkles" },
    { id: "mooc", href: "mooc-teaching.html", label: "慕课教学", icon: "graduation-cap" },
    { id: "mstu", href: "mobile-student.html", label: "移动·学生", icon: "smartphone" },
    { id: "mtea", href: "mobile-teacher.html", label: "移动·教师", icon: "bar-chart-3" },
    { id: "warn", href: "teaching-warning.html", label: "教学预警", icon: "bell-ring" }
  ];

  function currentModuleId() {
    var path = location.pathname.split("/").pop() || "index.html";
    var m = MODULES.filter(function (x) {
      return x.href === path;
    })[0];
    return m ? m.id : "home";
  }

  function injectNav() {
    var active = currentModuleId();
    var bar = el("header", { class: "platform-bar" });
    bar.innerHTML =
      '<a class="platform-brand" href="index.html">' +
      '<span class="brand-mark"><i data-lucide="blocks"></i></span>' +
      '<span>知行课程平台</span>' +
      "</a>" +
      '<nav class="platform-nav" id="platformNav"></nav>' +
      '<div class="platform-aside">' +
      '<i data-lucide="search" style="width:15px;height:15px"></i>' +
      '<span class="muted text-xs">演示版 · 数据存储于浏览器</span>' +
      '<button class="icon-btn" id="resetDataBtn" title="重置演示数据"><i data-lucide="refresh-ccw"></i></button>' +
      "</div>";
    var nav = bar.querySelector("#platformNav");
    MODULES.forEach(function (m) {
      var a = el("a", {
        class: "platform-link" + (m.id === active ? " is-active" : ""),
        href: m.href
      });
      a.innerHTML =
        '<i data-lucide="' + m.icon + '"></i><span></span>';
      a.querySelector("span").textContent = m.label;
      nav.appendChild(a);
    });
    document.body.insertBefore(bar, document.body.firstChild);

    var resetBtn = $("#resetDataBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        confirmDialog({
          title: "重置演示数据",
          message: "将清除所有本地操作记录并恢复初始演示数据，该操作不可撤销。",
          danger: true,
          okText: "重置",
          cancelText: "取消"
        }).then(function (ok) {
          if (!ok) return;
          Store.reset();
          toast("演示数据已重置，即将刷新…", "refresh-ccw");
          setTimeout(function () {
            location.reload();
          }, 700);
        });
      });
    }
    refreshIcons();
  }

  /* ---------- 数据层（localStorage） ---------- */
  var KEY = "zhkcpt.store.v1";

  function seedCourses() {
    return [
      {
        id: "c1",
        title: "数据结构与算法",
        teacher: "宋清和",
        lessons: 18,
        progress: 68,
        chapters: [
          { id: "c1-1", title: "算法分析基础" },
          { id: "c1-2", title: "线性表与链表" },
          { id: "c1-3", title: "栈与队列" },
          { id: "c1-4", title: "树与二叉树" },
          { id: "c1-5", title: "图与遍历" },
          { id: "c1-6", title: "排序算法" },
          { id: "c1-7", title: "查找与哈希" }
        ]
      },
      {
        id: "c2",
        title: "操作系统原理",
        teacher: "周予安",
        lessons: 16,
        progress: 42,
        chapters: [
          { id: "c2-1", title: "进程与线程" },
          { id: "c2-2", title: "CPU 调度" },
          { id: "c2-3", title: "内存管理" },
          { id: "c2-4", title: "文件系统" },
          { id: "c2-5", title: "I/O 与死锁" }
        ]
      },
      {
        id: "c3",
        title: "计算机网络",
        teacher: "许亦晨",
        lessons: 14,
        progress: 26,
        chapters: [
          { id: "c3-1", title: "体系结构" },
          { id: "c3-2", title: "物理层与数据链路层" },
          { id: "c3-3", title: "网络层与 IP" },
          { id: "c3-4", title: "传输层 TCP/UDP" },
          { id: "c3-5", title: "应用层协议" }
        ]
      },
      {
        id: "c4",
        title: "数据库系统",
        teacher: "程夏",
        lessons: 12,
        progress: 100,
        chapters: [
          { id: "c4-1", title: "关系模型" },
          { id: "c4-2", title: "SQL 与查询优化" },
          { id: "c4-3", title: "事务与并发" },
          { id: "c4-4", title: "存储与索引" }
        ]
      }
    ];
  }

  var BOOK_TITLES = [
    "算法导论", "数据结构与算法分析", "计算机程序设计艺术", "编程珠玑",
    "代码大全", "深入理解计算机系统", "现代操作系统", "操作系统概念",
    "计算机网络：自顶向下方法", "TCP/IP 详解 卷一", "数据库系统概念", "高性能 MySQL",
    "编译原理", "设计模式", "代码整洁之道", "重构：改善既有代码的设计",
    "人工智能：一种现代方法", "机器学习", "深度学习", "统计学习方法",
    "图论及其应用", "离散数学", "概率论与数理统计", "线性代数",
    "计算机图形学", "软件工程：实践者的研究方法", "人月神话", "架构整洁之道"
  ];
  var BOOK_AUTHORS = [
    "T.H.Cormen", "M.Weissfeld", "D.Knuth", "J.Bentley",
    "S.McConnell", "R.Bryant", "A.Silberschatz", "A.Silberschatz",
    "J.Kurose", "W.Richard Stevens", "A.Silberschatz", "B.Schwartz",
    "A.Aho", "E.Gamma", "R.Martin", "M.Fowler",
    "S.Russell", "周志华", "I.Goodfellow", "李航",
    "J.Bondy", "K.Rosen", "陈希孺", "G.Strang",
    "D.Hearn", "R.Pressman", "F.Brooks", "R.Martin"
  ];
  var BOOK_CATS = [
    "算法", "算法", "算法", "算法",
    "工程", "系统", "系统", "系统",
    "网络", "网络", "数据库", "数据库",
    "编译", "工程", "工程", "工程",
    "智能", "智能", "智能", "智能",
    "数学", "数学", "数学", "数学",
    "图形", "工程", "工程", "架构"
  ];
  var BOOK_COLORS = ["#147d6f", "#3e72ad", "#6a5fb0", "#d99119", "#e46f55", "#478a65", "#b5549a"];

  function seedBooks() {
    return BOOK_TITLES.map(function (t, i) {
      return {
        id: "b" + (i + 1),
        title: t,
        author: BOOK_AUTHORS[i] || "—",
        category: BOOK_CATS[i] || "综合",
        color: BOOK_COLORS[i % BOOK_COLORS.length],
        imported: i < 25,
        sliced: i < 25 ? Math.floor(40 + Math.random() * 60) : 0,
        trained: i < 25
      };
    });
  }

  function seedSlices() {
    var base = [
      {
        id: "s1",
        source: "算法导论 · 第2章",
        size: 512,
        delimiter: "\\n\\n",
        preprocess: "去空白 / 去停用词",
        text:
          "算法分析的核心在于评估运行时间随输入规模的增长趋势。我们使用大 O 记号描述上界，关注最坏情况下的渐进复杂度。常见函数阶：O(1)、O(log n)、O(n)、O(n log n)、O(n²)、O(2ⁿ)。在比较两个算法时，应优先关注主导项，忽略常数与低阶项……",
        edited: false
      },
      {
        id: "s2",
        source: "算法导论 · 第4章",
        size: 480,
        delimiter: "\\n\\n",
        preprocess: "去空白 / 去停用词",
        text:
          "分治法将问题分解为规模更小的子问题，递归求解后合并结果。典型应用包括归并排序与快速排序。递归式的求解可采用主方法：T(n)=aT(n/b)+f(n)，比较 f(n) 与 n^(log_b a) 即可得到渐进界……",
        edited: true
      },
      {
        id: "s3",
        source: "深入理解计算机系统 · 第3章",
        size: 600,
        delimiter: "。 ",
        preprocess: "保留标点 / 分句",
        text:
          "程序的机器级表示揭示了高级语言如何在处理器上执行。寄存器是 CPU 中速度最快的存储单元，x86-64 拥有 16 个通用寄存器。指令集架构定义了程序员可见的指令、寄存器与数据类型……",
        edited: false
      }
    ];
    return base;
  }

  function seedReview() {
    return {
      keywords: [
        "作弊", "代考", "泄题", "答案出售", "违规补课", "敏感词A", "敏感词B"
      ],
      ignore: ["考试中心", "考点", "答案解析", "考前复习"],
      queue: [
        {
          id: "r1",
          type: "text",
          title: "数据结构 · 第3章 课后习题",
          content: "本题考查栈与队列的基本应用。注意：考试中心常考点为括号匹配。请勿在课堂讨论任何作弊手段。答案解析见附录。某段文字疑似包含答案出售等表述，需重点审核。",
          flags: ["作弊", "答案出售"],
          status: "pending"
        },
        {
          id: "r2",
          type: "image",
          title: "计算机网络 · 课件插图",
          href: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=technical%20network%20topology%20diagram%20on%20white%20clean%20background%2C%20routers%20and%20switches%2C%20professional%2C%20no%20text&image_size=landscape_4_3",
          content: "OSI 七层模型示意图",
          flags: [],
          status: "pending"
        },
        {
          id: "r3",
          type: "doc",
          title: "操作系统 · 实验指导书.pdf",
          content: "本实验指导书涵盖进程调度与死锁避免。文件内嵌图片疑似含违规水印，建议人工复核。考点集中于银行家算法。",
          flags: ["疑似违规水印"],
          status: "pending"
        },
        {
          id: "r4",
          type: "course",
          title: "数据库系统 · 整门课程",
          content: "课程共 12 章节，含视频、文档、习题。系统扫描发现第 8 节文档存在敏感表述，需逐章复核。",
          flags: ["泄题"],
          status: "pending"
        }
      ],
      history: []
    };
  }

  function seedClasses() {
    var names = [
      "陈思远", "林书瑶", "王嘉树", "赵明轩", "刘梓涵", "孙若曦", "周予安", "吴清越",
      "郑瀚海", "黄子衿", "梁文渊", "苏静姝", "钟南山", "蒋语薇", "韩沐风", "沈知夏"
    ];
    function rand(a, b) {
      return Math.round(a + Math.random() * (b - a));
    }
    var students = names.map(function (n, i) {
      var completion = rand(45, 99);
      var mastery = Math.min(99, Math.max(30, completion + rand(-18, 14)));
      return {
        id: "u" + (i + 1),
        name: n,
        avatar: n.slice(0, 1),
        color: BOOK_COLORS[i % BOOK_COLORS.length],
        completion: completion,
        mastery: mastery,
        tasks: rand(60, 100),
        exams: rand(55, 98),
        access: rand(40, 100),
        score: rand(58, 96),
        warned: completion < 60
      };
    });
    return [
      {
        id: "cls1",
        name: "计科 2301 班",
        course: "数据结构与算法",
        students: students
      },
      {
        id: "cls2",
        name: "计科 2302 班",
        course: "操作系统原理",
        students: students.slice(0, 10).map(function (s) {
          return Object.assign({}, s, {
            id: s.id + "b",
            completion: Math.min(99, s.completion + 6),
            mastery: Math.min(99, s.mastery + 4)
          });
        })
      }
    ];
  }

  function seedWarnings() {
    return {
      conditions: [
        { id: "w1", dim: "任务点", op: "<", value: 60, channel: ["站内", "短信"], enabled: true },
        { id: "w2", dim: "章节测验", op: "<", value: 70, channel: ["站内"], enabled: true },
        { id: "w3", dim: "作业", op: "<", value: 50, channel: ["站内", "微信"], enabled: true },
        { id: "w4", dim: "访问", op: "<", value: 40, channel: ["短信", "电话"], enabled: false },
        { id: "w5", dim: "考试", op: "<", value: 60, channel: ["站内", "短信", "微信", "电话"], enabled: true },
        { id: "w6", dim: "综合成绩", op: "<", value: 60, channel: ["站内", "短信", "电话"], enabled: true }
      ],
      supervision: [
        { id: "sv1", student: "陈思远", cls: "计科 2301", dim: "作业", value: 48, time: "08-30 09:12", channel: "短信", status: "已提醒" },
        { id: "sv2", student: "赵明轩", cls: "计科 2301", dim: "任务点", value: 52, time: "08-30 10:40", channel: "微信", status: "已提醒" },
        { id: "sv3", student: "周予安", cls: "计科 2301", dim: "考试", value: 55, time: "08-30 14:20", channel: "电话", status: "已触达" },
        { id: "sv4", student: "黄子衿", cls: "计科 2301", dim: "综合成绩", value: 58, time: "08-29 16:05", channel: "站内", status: "未读" }
      ],
      notifications: [
        {
          id: "n1",
          scope: "计科 2301 班",
          title: "数据结构第 4 章作业截止提醒",
          channels: ["站内", "短信", "微信"],
          time: "08-30 18:00",
          total: 32,
          read: 24,
          unread: 8
        },
        {
          id: "n2",
          scope: "全校",
          title: "期末考试安排预告",
          channels: ["站内", "短信"],
          time: "08-29 09:00",
          total: 1280,
          read: 980,
          unread: 300
        },
        {
          id: "n3",
          scope: "计算机学院",
          title: "教学预警：综合成绩低于 60 分",
          channels: ["站内", "短信", "电话"],
          time: "08-28 15:30",
          total: 86,
          read: 60,
          unread: 26
        }
      ]
    };
  }

  function seedSchedule() {
    var days = ["一", "二", "三", "四", "五"];
    function ev(day, start, end, title, type, location) {
      return { id: uid("ev"), day: day, start: start, end: end, title: title, type: type, location: location };
    }
    return [
      ev("一", "08:00", "09:40", "数据结构与算法", "offline", "理科楼 A301"),
      ev("一", "10:00", "11:40", "操作系统答疑", "online", "腾讯会议"),
      ev("二", "08:00", "09:40", "计算机网络", "offline", "信息楼 B202"),
      ev("二", "14:00", "15:40", "数据库实验", "offline", "实验楼 C105"),
      ev("三", "10:00", "11:40", "数据结构直播", "live", "腾讯会议"),
      ev("四", "08:00", "09:40", "操作系统", "offline", "理科楼 A301"),
      ev("四", "14:00", "15:40", "算法研讨", "online", "腾讯会议"),
      ev("五", "08:00", "09:40", "计算机网络答疑", "online", "腾讯会议")
    ];
  }

  function seedChat() {
    return {
      b1: [
        { role: "ai", text: "我是本书的 AI 解读助手，可基于《算法导论》回答你的问题。试试：算法分析的核心是什么？" }
      ]
    };
  }

  function seedGraph() {
    return {
      nodes: [
        { id: "k0", label: "算法分析", x: 50, y: 50, type: "core" },
        { id: "k1", label: "渐进复杂度", x: 24, y: 24, type: "kp" },
        { id: "k2", label: "大O记号", x: 76, y: 24, type: "kp" },
        { id: "k3", label: "分治法", x: 24, y: 76, type: "kp" },
        { id: "k4", label: "递归主方法", x: 76, y: 76, type: "kp" },
        { id: "k5", label: "排序算法", x: 8, y: 50, type: "kp" },
        { id: "k6", label: "《算法导论》", x: 92, y: 50, type: "book" }
      ],
      links: [
        ["k0", "k1"], ["k0", "k2"], ["k0", "k3"], ["k0", "k4"],
        ["k1", "k2"], ["k3", "k4"], ["k0", "k5"], ["k0", "k6"],
        ["k3", "k5"]
      ],
      resources: {
        k0: [
          { type: "video", name: "算法分析导论 · 微课" },
          { type: "doc", name: "复杂度对照表.pdf" },
          { type: "quiz", name: "章节测验" }
        ],
        k2: [{ type: "video", name: "大O记号示例" }],
        k3: [{ type: "doc", name: "分治法讲义" }, { type: "quiz", name: "分治随堂测验" }]
      }
    };
  }

  function freshSeed() {
    return {
      courses: seedCourses(),
      books: seedBooks(),
      slices: seedSlices(),
      review: seedReview(),
      classes: seedClasses(),
      warnings: seedWarnings(),
      schedule: seedSchedule(),
      chat: seedChat(),
      graph: seedGraph(),
      activeCourseId: "c1"
    };
  }

  var Store = {
    data: null,
    load: function () {
      if (this.data) return this.data;
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) {
          this.data = JSON.parse(raw);
        } else {
          this.data = freshSeed();
          this.save();
        }
      } catch (e) {
        this.data = freshSeed();
      }
      // 兜底：补齐可能缺失的字段
      var base = freshSeed();
      var d = this.data;
      Object.keys(base).forEach(function (k) {
        if (d[k] == null) d[k] = base[k];
      });
      return this.data;
    },
    save: function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.data));
      } catch (e) {}
    },
    reset: function () {
      this.data = freshSeed();
      this.save();
    }
  };

  /* ---------- 对外暴露 ---------- */
  window.Platform = {
    $: $,
    $$: $$,
    el: el,
    uid: uid,
    toast: toast,
    refreshIcons: refreshIcons,
    confirm: confirmDialog,
    haptic: haptic,
    skeleton: skeleton,
    enableSwipeBack: enableSwipeBack,
    modules: MODULES,
    Store: Store,
    fmt: { date: formatDate },
    // 各页可在 DOMContentLoaded 注册初始化逻辑（也可直接在脚本末尾调用）
    onReady: function (fn) {
      document.addEventListener("DOMContentLoaded", fn);
    }
  };

  /* ---------- 启动：注入导航 ---------- */
  function boot() {
    Store.load();
    injectNav();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
