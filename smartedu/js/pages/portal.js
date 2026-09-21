/* ==========================================================================
   页面 · 门户搭建
   （门户布局编辑 / 模块数据配置 / 数据源接入 / 主题与多语言）
   门户 = 课程中 AI 赋能模块的对外展示层：可拖拽排布、可换肤、可简繁切换、数据可抽调
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  /* ---------------- 简繁转换字典（演示用最小可用映射） ---------------- */
  const TRAD_PHRASES = [
    ["知识库", "知識庫"], ["学习路径", "學習路徑"], ["学情", "學情"], ["数据中心", "數據中心"],
    ["学习圈", "學習圈"], ["作品型", "作品型"], ["外接", "外接"],
  ];
  const TRAD_MAP = {
    课: "課", 程: "程", 学: "學", 习: "習", 數: "數", 数: "數", 据: "據", 资: "資", 源: "源",
    师: "師", 级: "級", 阅: "閱", 读: "讀", 检: "檢", 测: "測", 险: "險", 词: "詞", 库: "庫",
    单: "單", 荐: "薦", 图: "圖", 书: "書", 题: "題", 试: "試", 话: "話", 统: "統", 计: "計",
    报: "報", 练: "練", 网: "網", 链: "鏈", 关: "關", 联: "聯", 义: "義", 务: "務", 动: "動",
    态: "態", 观: "觀", 记: "記", 录: "錄", 传: "傳", 输: "輸", 项: "項", 页: "頁", 处: "處",
    后: "後", 会: "會", 体: "體", 时: "時", 间: "間", 长: "長", 将: "將", 应: "應", 该: "該",
    对: "對", 于: "於", 为: "為", 无: "無", 与: "與", 这: "這", 个: "個", 们: "們", 来: "來",
    说: "說", 见: "見", 现: "現", 结: "結", 线: "線", 织: "織", 组: "組", 变: "變", 认: "認",
    识: "識", 设: "設", 训: "訓", 评: "評", 价: "價", 反: "反", 馈: "饋", 献: "獻", 谱: "譜",
    场: "場", 景: "景", 系: "系", 管: "管", 理: "理", 师: "師", 团: "團", 队: "隊", 门: "門",
    户: "戶", 台: "臺", 智: "智", 能: "能", 模: "模", 块: "塊", 页: "頁", 面: "面", 布: "佈",
    局: "局", 背: "背", 音: "音", 乐: "樂", 主: "主", 色: "色", 简: "簡", 繁: "繁", 体: "體",
    权: "權", 限: "限", 角: "角", 员: "員", 账: "賬", 号: "號", 录: "錄", 注: "註", 册: "冊",
    检: "檢", 测: "測", 频: "頻", 视: "視", 画: "畫", 帧: "幀", 字: "字", 幕: "幕", 敏: "敏",
    感: "感", 略: "略", 过: "過", 滤: "濾", 惩: "懲", 治: "治", 理: "理", 达: "達", 标: "標",
    维: "維", 度: "度", 完: "完", 成: "成", 率: "率", 掌: "掌", 握: "握", 能: "能", 力: "力",
    概: "概", 念: "念", 难: "難", 易: "易", 习: "習", 熟: "熟", 练: "練", 积: "積", 累: "累",
    笔: "筆", 记: "記", 摘: "摘", 要: "要", 脑: "腦", 导: "導", 览: "覽", 索: "索", 引: "引",
    擎: "擎", 算: "算", 法: "法", 精: "精", 准: "準", 快: "快", 速: "速", 稳: "穩", 定: "定",
    门: "門", 户: "戶", 题: "題", 库: "庫", 卷: "卷", 判: "判", 断: "斷", 空: "空", 填: "填",
    择: "擇", 简: "簡", 报: "報", 表: "表", 格: "格", 示: "示", 例: "例", 样: "樣", 本: "本",
  };

  function toTraditional(s) {
    let out = String(s);
    TRAD_PHRASES.forEach((p) => {
      out = out.split(p[0]).join(p[1]);
    });
    return out
      .split("")
      .map((ch) => TRAD_MAP[ch] || ch)
      .join("");
  }

  function L(cfg, s) {
    return cfg.lang === "zh-TW" ? toTraditional(s) : s;
  }

  /* ---------------- 模块定义 ---------------- */
  const BLOCK_DEFS = [
    { key: "hero", name: "课程导语", icon: "bookOpen", desc: "门户头图区，展示课程名称与一句话定位", source: { type: "static", ref: "" }, display: { columns: 1, limit: 1 } },
    { key: "stats", name: "课程数据总览", icon: "chart", desc: "课程规模、学生规模、资源量与活跃度", source: { type: "datacenter", ref: "ds_course_overview" }, display: { columns: 4, limit: 4 } },
    { key: "kb", name: "AI 知识库", icon: "database", desc: "知识库文档数、分片数与检索量", source: { type: "datacenter", ref: "ds_kb_stats" }, display: { columns: 3, limit: 3 } },
    { key: "tasks", name: "作品型任务", icon: "clipboard", desc: "进行中的任务、提交量与平均得分", source: { type: "datacenter", ref: "ds_tasks" }, display: { columns: 2, limit: 4 } },
    { key: "graph", name: "知识图谱导读", icon: "network", desc: "被访问与关联最多的知识点", source: { type: "datacenter", ref: "ds_graph_hot" }, display: { columns: 2, limit: 6 } },
    { key: "analytics", name: "班级学情速览", icon: "bars", desc: "完成率、掌握率与薄弱知识点", source: { type: "datacenter", ref: "ds_class_analytics" }, display: { columns: 3, limit: 3 } },
    { key: "practice", name: "AI 实训场景", icon: "message", desc: "已发布的情景对话场景与参与情况", source: { type: "datacenter", ref: "ds_scenes" }, display: { columns: 3, limit: 3 } },
    { key: "library", name: "推荐书目", icon: "book", desc: "课程关联的文献库推荐图书", source: { type: "datacenter", ref: "ds_books" }, display: { columns: 4, limit: 8 } },
    { key: "safety", name: "内容安全摘要", icon: "shield", desc: "风险用户、垃圾发布量与内容环境评分", source: { type: "datacenter", ref: "ds_safety_summary" }, display: { columns: 3, limit: 3 } },
    { key: "notice", name: "课程公告", icon: "megaphone", desc: "教务系统公告与课程通知（外部数据接入）", source: { type: "external", ref: "ext_oa_notice" }, display: { columns: 1, limit: 5 } },
    { key: "contact", name: "教学支持", icon: "users", desc: "授课教师、答疑方式与办公地点", source: { type: "static", ref: "" }, display: { columns: 1, limit: 1 } },
  ];

  const BLOCK_MAP = {};
  BLOCK_DEFS.forEach((b) => (BLOCK_MAP[b.key] = b));

  function cfg() {
    return ZK.db.list("portalConfig")[0] || ZK.seed.portalConfig();
  }

  function saveCfg(patch) {
    const cur = cfg();
    const next = Object.assign({}, cur, patch, { updatedAt: Date.now() });
    ZK.db.upsert("portalConfig", next);
    ZK.util.emit("portal:change", next);
    return next;
  }

  /* ==================================================================
     数据源 → 真实数据
     ================================================================== */
  function sourceData(ref, limit) {
    const n = limit || 6;
    const d = ZK.db;
    switch (ref) {
      case "ds_course_overview": {
        const learners = d.list("learners");
        const active = learners.filter((l) => Date.now() - l.lastActive < 86400000 * 3).length;
        return {
          kind: "metrics",
          items: [
            { label: "课程数", value: String(d.list("courses").length), sub: "本科教学课程" },
            { label: "学生数", value: String(learners.length), sub: "覆盖 " + d.list("classes").length + " 个班级" },
            { label: "课程资源数", value: String(d.list("resources").length), sub: "视频 / 讲义 / 习题" },
            { label: "近 3 日活跃率", value: U.pct((active / Math.max(1, learners.length)) * 100), sub: active + " 人活跃" },
          ],
        };
      }
      case "ds_kb_stats":
        return {
          kind: "list",
          items: d.list("knowledgeBases").slice(0, n).map((k) => {
            const st = ZK.engine.kbStats(k.id) || {};
            return { title: k.name, sub: "文档 " + (st.docs || 0) + " 篇 · 分片 " + (st.chunks || 0) + " 个 · 检索 " + (st.queries || 0) + " 次", badge: k.status === "trained" ? "已训练" : "待训练", tone: k.status === "trained" ? "emerald" : "amber" };
          }),
        };
      case "ds_tasks":
        return {
          kind: "list",
          items: d.list("tasks").slice(0, n).map((t) => {
            const subs = d.list("submissions", (s) => s.taskId === t.id);
            const reviewed = subs.filter((s) => s.aiReview);
            return {
              title: t.title,
              sub: t.course + " · 提交 " + subs.length + " 份 · " + (reviewed.length ? "平均 " + U.round(U.avg(reviewed.map((s) => s.aiReview.overall)), 1) + " 分" : "尚无评阅") + " · 截止 " + U.fmtDate(t.deadline),
              badge: t.status === "open" ? "进行中" : "已截止",
              tone: t.status === "open" ? "emerald" : "gray",
            };
          }),
        };
      case "ds_graph_hot":
        return {
          kind: "list",
          items: d
            .list("knowledgePoints")
            .map((k) => ({ k: k, cnt: d.list("learningRecords", (r) => r.kpId === k.id).length }))
            .sort((a, b) => b.cnt - a.cnt || b.k.resourceCount - a.k.resourceCount)
            .slice(0, n)
            .map((x) => ({ title: x.k.name, sub: "第 " + x.k.chapter + " 章 · 学习记录 " + x.cnt + " 条 · 关联资源 " + x.k.resourceCount + " 项", badge: "★".repeat(x.k.difficulty), tone: "violet" })),
        };
      case "ds_class_analytics": {
        const a = ZK.engine.classAnalytics(d.list("classes")[0] ? d.list("classes")[0].id : null);
        return {
          kind: "mixed",
          metrics: [
            { label: "平均完成率", value: U.pct(a.overall.avgCompletion), sub: (a.cls || {}).name || "" },
            { label: "平均掌握率", value: U.pct(a.overall.avgMastery), sub: "共 " + a.kpStats.length + " 个知识点" },
            { label: "资料人均阅读", value: a.overall.avgReadPerCapita + " 项", sub: "课程资料配套阅读" },
          ],
          items: a.weakKps.slice(0, 3).map((k) => ({ title: "薄弱：" + k.name, sub: "掌握率 " + U.pct(k.avgMastery) + " · 低掌握 " + k.lowCount + " 人", badge: "第 " + k.chapter + " 章", tone: "amber" })),
        };
      }
      case "ds_scenes":
        return {
          kind: "list",
          items: d.list("scenes").slice(0, n).map((s) => {
            const sessions = d.list("practiceSessions", (x) => x.sceneId === s.id);
            const scored = sessions.filter((x) => x.score);
            return { title: s.name, sub: s.course + " · " + s.type + " · 参与 " + sessions.length + " 人次 · " + (scored.length ? "平均 " + U.round(U.avg(scored.map((x) => x.score)), 1) + " 分" : "尚无评分"), badge: "难度 " + s.difficulty, tone: "blue" };
          }),
        };
      case "ds_books":
        return {
          kind: "list",
          items: d.list("libraryBooks").slice(0, n).map((b) => ({ title: b.title, sub: b.author + " · " + b.publisher + "（" + b.year + "）", badge: "馆藏 " + b.stock + "/" + b.total, tone: "amber" })),
        };
      case "ds_safety_summary": {
        const r = ZK.engine.userRisk();
        return {
          kind: "mixed",
          metrics: [
            { label: "风险用户", value: String(r.summary.riskyUsers), sub: "风险值 ≥ 40" },
            { label: "垃圾发布量", value: String(r.summary.spamPosts), sub: "占发布总量 " + U.pct(r.summary.spamRate) },
            { label: "内容环境评分", value: String(U.round(ZK.engine.overview().safetyScore)), sub: "满分 100" },
          ],
          items: r.rows.slice(0, 3).map((u) => ({ title: u.name + "（" + u.riskLevel.label + "）", sub: "风险值 " + u.riskScore + " · 垃圾发布 " + u.spam + " 条", badge: "垃圾发布率 " + U.pct(u.spamRate), tone: u.riskLevel.key === "high" ? "red" : "amber" })),
        };
      }
      case "ext_oa_notice":
        return {
          kind: "list",
          items: d.list("notices").slice(0, n).map((x) => ({ title: x.title, sub: x.org + " · " + U.fmtDate(x.at) + (x.external ? " · 外部接口" : " · 课程通知"), badge: x.external ? "教务系统" : "课程", tone: x.external ? "blue" : "emerald" })),
        };
      case "ext_library":
        return {
          kind: "list",
          items: d.list("libraryBooks").slice(0, n).map((b) => ({ title: b.title, sub: "ISBN " + b.isbn + " · " + b.location + " · 可借 " + b.stock + "/" + b.total, badge: "借阅 " + b.borrowCount + " 次", tone: "violet" })),
        };
      case "ext_mooc":
        return {
          kind: "list",
          items: d.list("resources").slice(0, n).map((r) => ({ title: r.title, sub: "第 " + r.chapter + " 章 · " + r.type + " · " + r.publisher, badge: "完成率 " + U.pct(r.completion), tone: "cyan" })),
        };
      case "ext_sso":
        return {
          kind: "list",
          items: d.list("users").slice(0, n).map((u) => ({ title: u.name, sub: u.account + " · " + u.roleName + " · " + (u.org || ""), badge: u.status === "active" || u.status === undefined ? "已同步" : "已停用", tone: "emerald" })),
        };
      default:
        return { kind: "list", items: [] };
    }
  }

  /* ==================================================================
     门户渲染（供预览与整站预览复用）
     ================================================================== */
  function renderPortal(container, config) {
    const c = config || cfg();
    const th = c.theme || {};
    const root = h("div", {
      class: "portal-body",
      style: {
        background: (c.background || {}).value || "var(--bg-base)",
        "--accent": th.primary || "#2563eb",
        "--accent-bright": th.accent || "#60a5fa",
        "--r-xl": (th.radius || 12) + "px",
        "--r-2xl": ((th.radius || 12) + 4) + "px",
        color: th.text || "#ffffff",
        "min-height": "100%",
      },
    });

    root.appendChild(
      h("div", { class: "portal-nav" }, [
        h("div", { class: "row", style: { gap: "8px" } }, [
          h("div", { class: "brand-mark", html: ZK.brandMark(18) }),
          h("b", { class: "fs-13", text: L(c, "智课云") }),
        ]),
        h("div", { class: "row", style: { gap: "4px", "flex-wrap": "wrap" } }, (c.nav || []).map((n, i) =>
          h("span", { class: "chip" + (i === 0 ? " on" : ""), text: L(c, n) })
        )),
        h("span", { class: "badge badge-emerald", text: L(c, c.lang === "zh-TW" ? "繁體" : "简体") }),
      ])
    );

    const blocks = (c.blocks || []).filter((b) => b.enabled);
    const hero = blocks.find((b) => b.key === "hero");
    if (hero) {
      root.appendChild(
        h("div", { class: "portal-hero" }, [
          h("h1", { text: L(c, c.title) }),
          h("p", { text: L(c, c.subtitle) }),
          h("div", { class: "row mt-16", style: { gap: "8px" } }, [
            h("span", { class: "badge badge-emerald", text: L(c, "AI 赋能课程") }),
            h("span", { class: "badge badge-blue", text: L(c, "知识库 + 智能评阅 + 学情画像") }),
            c.music && c.music.enabled ? h("span", { class: "badge badge-violet", text: L(c, "背景音乐已开启：" + c.music.track) }) : null,
          ]),
        ])
      );
    }

    const inner = h("div", { class: "portal-inner" });
    blocks.filter((b) => b.key !== "hero").forEach((b) => {
      const def = BLOCK_MAP[b.key] || { name: b.title, icon: "grid", desc: "" };
      const d = sourceData((b.source || {}).ref, (b.display || {}).limit);
      const cols = (b.display || {}).columns || 3;

      const body = [];
      if (b.key === "contact") {
        body.push(
          ZK.ui.kv([
            [L(c, "授课教师"), "李明远 · 英语学院翻译系　陈慧珊 · 商务英语系"],
            [L(c, "答疑方式"), "课程讨论区（工作日 18:00-21:00 集中答疑）"],
            [L(c, "办公地点"), "教学楼 A 座 512"],
            [L(c, "课程助教"), "王梓涵（2022210137）· 赵思远（2022210142）"],
          ])
        );
      } else {
        if (d.metrics) {
          body.push(
            h("div", { class: "grid grid-3 mb-12", style: { gap: "10px" } }, d.metrics.map((m) =>
              h("div", { style: { background: "rgba(31,41,55,0.55)", "border-radius": "var(--r-lg)", padding: "12px 14px" } }, [
                h("div", { class: "fs-11 ghost", text: L(c, m.label) }),
                h("div", { class: "fs-22 fw-7", style: { color: th.accent || "#60a5fa" }, text: L(c, m.value) }),
                h("div", { class: "fs-11 faint", text: L(c, m.sub) }),
              ])
            ))
          );
        }
        if (d.kind === "list" || d.kind === "mixed") {
          const items = (d.items || []).slice(0, (b.display || {}).limit || 6);
          if (!items.length) body.push(h("div", { class: "fs-12 faint", text: L(c, "该数据源暂无可展示的数据。") }));
          else
            body.push(
              h("div", { class: "masonry c" + Math.min(4, Math.max(1, cols)) }, items.map((it) =>
                h("div", { style: { background: "rgba(31,41,55,0.5)", "border-radius": "var(--r-lg)", padding: "12px 14px", border: "1px solid rgba(55,65,81,0.6)" } }, [
                  h("div", { class: "row-between mb-4" }, [
                    h("b", { class: "fs-13", text: L(c, it.title) }),
                    it.badge ? h("span", { class: "badge badge-" + (it.tone || "gray"), text: L(c, it.badge) }) : null,
                  ]),
                  h("div", { class: "fs-11 faint", text: L(c, it.sub) }),
                ])
              ))
            );
        }
      }

      inner.appendChild(
        h("div", { class: "portal-block" }, [
          h("div", { class: "row-between mb-8" }, [
            h("h2", { text: L(c, b.title || def.name) }),
            h("span", { class: "pb-sub", text: L(c, "数据来源：" + ((b.source || {}).type === "external" ? "外部数据接入" : (b.source || {}).type === "datacenter" ? "数据中心抽调" : "静态内容") + "　列数 " + cols) }),
          ]),
          h("div", { class: "pb-sub mb-12", text: L(c, def.desc) }),
          h("div", {}, body),
        ])
      );
    });

    root.appendChild(inner);
    root.appendChild(
      h("div", { class: "center", style: { padding: "26px", color: "var(--text-faint)", "font-size": "12px" } }, [
        L(c, "智课云 · 课程 AI 赋能门户　更新时间 ") + U.fmtDateTime(c.updatedAt || Date.now()),
      ])
    );

    container.appendChild(root);
    return root;
  }

  /* ---------------- 背景音乐（Web Audio 生成柔和环境音） ---------------- */
  let audioCtx = null;
  let audioNodes = null;
  function playAmbient(volume) {
    try {
      stopAmbient();
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const gain = audioCtx.createGain();
      gain.gain.value = U.clamp((volume === undefined ? 30 : volume) / 100, 0, 1) * 0.06;
      gain.connect(audioCtx.destination);
      const freqs = [261.63, 329.63, 392.0, 523.25];
      const oscs = freqs.map((f, i) => {
        const o = audioCtx.createOscillator();
        o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        const g = audioCtx.createGain();
        g.gain.value = 0.25 / (i + 1);
        o.connect(g);
        g.connect(gain);
        o.start();
        return o;
      });
      audioNodes = { gain: gain, oscs: oscs };
      return true;
    } catch (e) {
      ZK.toast("当前环境不支持音频播放", "danger");
      return false;
    }
  }
  function stopAmbient() {
    if (audioNodes) {
      audioNodes.oscs.forEach((o) => {
        try {
          o.stop();
        } catch (e) {
          void e;
        }
      });
      try {
        audioNodes.gain.disconnect();
      } catch (e) {
        void e;
      }
      audioNodes = null;
    }
  }

  /* ==================================================================
     一、门户布局编辑（拖拽）
     ================================================================== */
  P["portal/builder"] = {
    render(root) {
      let c = cfg();

      root.appendChild(
        ZK.ui.pageHead({
          title: "门户布局编辑",
          sub: "从左侧模块库拖拽模块到画布，画布内拖拽可调整顺序；支持启用/停用、列数与条数配置，右侧实时预览。",
          actions: [
            h("button", { class: "btn btn-sm", text: "整站预览", onclick: () => openFullPreview() }),
            h("button", { class: "btn btn-sm", text: "恢复默认布局", onclick: () => resetLayout() }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.check(14) + "<span>保存并发布</span>", onclick: () => save() }),
          ],
        })
      );

      const paletteHost = h("div", { class: "stack-8" });
      const canvasHost = h("div", { class: "canvas-drop" });
      const previewHost = h("div", { style: { "border-radius": "var(--r-xl)", overflow: "hidden", border: "1px solid var(--border-default)", height: "520px", overflowY: "auto" } });

      root.appendChild(
        h("div", { class: "builder-grid" }, [
          ZK.ui.card({ title: "模块库", sub: "拖拽到画布添加", icon: ZK.icons.grid(16), body: [paletteHost] }),
          ZK.ui.card({ title: "门户画布", sub: "拖拽调整顺序，点击按钮调整配置", icon: ZK.icons.layout(16), body: [canvasHost] }),
          ZK.ui.card({ title: "实时预览", sub: "按当前配置即时渲染", icon: ZK.icons.eye(16), body: [previewHost] }),
        ])
      );

      /* ---- 模块库 ---- */
      function paintPalette() {
        U.clear(paletteHost);
        BLOCK_DEFS.forEach((def) => {
          const used = (c.blocks || []).some((b) => b.key === def.key);
          const item = h("div", { class: "drag-item", draggable: true, title: def.desc }, [
            h("span", { class: "dg-handle", html: ZK.icons.drag(14) }),
            h("span", { html: ZK.icons[def.icon] ? ZK.icons[def.icon](14) : ZK.icons.grid(14) }),
            h("span", { style: { flex: "1" }, text: def.name }),
            used ? ZK.ui.badge("已添加", "gray") : ZK.ui.badge("可添加", "emerald"),
          ]);
          item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", "new:" + def.key);
            e.dataTransfer.effectAllowed = "copy";
            item.classList.add("dragging");
          });
          item.addEventListener("dragend", () => item.classList.remove("dragging"));
          item.addEventListener("dblclick", () => addBlock(def.key));
          paletteHost.appendChild(item);
        });
        paletteHost.appendChild(h("div", { class: "fs-11 faint mt-8", text: "提示：双击模块可直接追加到画布末尾。" }));
      }

      /* ---- 画布 ---- */
      function paintCanvas() {
        U.clear(canvasHost);
        if (!(c.blocks || []).length) {
          canvasHost.appendChild(ZK.ui.empty({ title: "画布为空", desc: "从左侧模块库拖入模块开始搭建门户。", icon: ZK.icons.layout(22) }));
          return;
        }
        (c.blocks || []).forEach((b, i) => {
          const def = BLOCK_MAP[b.key] || { name: b.title, icon: "grid" };
          const node = h("div", { class: "canvas-block", draggable: true }, [
            h("span", { class: "dg-handle", html: ZK.icons.drag(14) }),
            h("span", { style: { color: "var(--accent-bright)" }, html: ZK.icons[def.icon] ? ZK.icons[def.icon](16) : ZK.icons.grid(16) }),
            h("div", { class: "cb-main" }, [
              h("b", { text: b.title || def.name }),
              h("span", {
                text:
                  ((b.source || {}).type === "external" ? "外部数据接入：" : (b.source || {}).type === "datacenter" ? "数据中心抽调：" : "静态内容") +
                  ((b.source || {}).ref ? (ZK.db.find("dataSources", b.source.ref) || {}).name || b.source.ref : "—") +
                  "　列数 " + (b.display || {}).columns + "　条数 " + (b.display || {}).limit,
              }),
            ]),
            h("div", { class: "cb-ctrl" }, [
              h("button", { html: ZK.icons.arrowUp(13), title: "上移", onclick: () => move(i, -1) }),
              h("button", { html: ZK.icons.arrowDown(13), title: "下移", onclick: () => move(i, 1) }),
              h("button", {
                html: ZK.icons.sliders(13),
                title: "配置数据来源与展示",
                onclick: () => openBlockConfig(b),
              }),
              h("button", {
                class: b.enabled ? "" : "del",
                html: b.enabled ? ZK.icons.eye(13) : ZK.icons.close(13),
                title: b.enabled ? "点击停用（不显示在门户）" : "点击启用",
                onclick() {
                  b.enabled = !b.enabled;
                  paintCanvas();
                  paintPreview();
                  ZK.toast((b.title || def.name) + " 已" + (b.enabled ? "启用" : "停用"));
                },
              }),
              h("button", { class: "del", html: ZK.icons.trash(13), title: "移除模块", onclick: () => removeBlock(i) }),
            ]),
          ]);

          node.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", "move:" + i);
            e.dataTransfer.effectAllowed = "move";
            node.classList.add("dragging");
          });
          node.addEventListener("dragend", () => node.classList.remove("dragging"));
          node.addEventListener("dragover", (e) => {
            e.preventDefault();
            const r = node.getBoundingClientRect();
            const before = e.clientY < r.top + r.height / 2;
            node.classList.toggle("over-top", before);
            node.classList.toggle("over-bottom", !before);
          });
          node.addEventListener("dragleave", () => node.classList.remove("over-top", "over-bottom"));
          node.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const data = e.dataTransfer.getData("text/plain");
            const r = node.getBoundingClientRect();
            const before = e.clientY < r.top + r.height / 2;
            node.classList.remove("over-top", "over-bottom");
            if (data.indexOf("new:") === 0) {
              insertBlock(data.slice(4), before ? i : i + 1);
            } else if (data.indexOf("move:") === 0) {
              const from = Number(data.slice(5));
              if (from === i) return;
              const item = c.blocks.splice(from, 1)[0];
              let to = before ? i : i + 1;
              if (from < to) to -= 1;
              c.blocks.splice(to, 0, item);
              paintCanvas();
              paintPreview();
            }
          });

          canvasHost.appendChild(node);
        });
      }

      canvasHost.addEventListener("dragover", (e) => {
        e.preventDefault();
        canvasHost.classList.add("over");
      });
      canvasHost.addEventListener("dragleave", () => canvasHost.classList.remove("over"));
      canvasHost.addEventListener("drop", (e) => {
        e.preventDefault();
        canvasHost.classList.remove("over");
        const data = e.dataTransfer.getData("text/plain");
        if (data.indexOf("new:") === 0) insertBlock(data.slice(4), c.blocks.length);
        else if (data.indexOf("move:") === 0) {
          const from = Number(data.slice(5));
          const item = c.blocks.splice(from, 1)[0];
          c.blocks.push(item);
          paintCanvas();
          paintPreview();
        }
      });

      function addBlock(key) {
        insertBlock(key, c.blocks.length);
      }

      function insertBlock(key, idx) {
        const def = BLOCK_MAP[key];
        if (!def) return;
        if (c.blocks.some((b) => b.key === key)) {
          ZK.toast("模块「" + def.name + "」已在画布中，可拖拽调整位置", "warn");
          return;
        }
        c.blocks.splice(idx, 0, {
          id: U.uid("blk"),
          key: key,
          title: def.name,
          enabled: true,
          source: Object.assign({}, def.source),
          display: Object.assign({}, def.display),
        });
        paintCanvas();
        paintPreview();
        paintPalette();
        ZK.toast("已添加模块：" + def.name);
      }

      function move(i, delta) {
        const to = i + delta;
        if (to < 0 || to >= c.blocks.length) return;
        const item = c.blocks.splice(i, 1)[0];
        c.blocks.splice(to, 0, item);
        paintCanvas();
        paintPreview();
      }

      function removeBlock(i) {
        const b = c.blocks[i];
        c.blocks.splice(i, 1);
        paintCanvas();
        paintPreview();
        paintPalette();
        ZK.toast("已移除模块：" + (b.title || b.key));
      }

      function openBlockConfig(b) {
        const def = BLOCK_MAP[b.key] || {};
        const title = h("input", { class: "input", value: b.title || def.name });
        const sources = ZK.db.list("dataSources");
        const srcSel = h("select", { class: "select" }, [h("option", { value: "static", text: "静态内容（手工维护）" })]
          .concat(sources.map((s) => h("option", { value: s.id, text: (s.type === "external" ? "【外部】" : "【数据中台】") + s.name, selected: (b.source || {}).ref === s.id ? true : null }))));
        const colsIn = h("input", { class: "input", type: "number", min: "1", max: "4", value: String((b.display || {}).columns || 3) });
        const limitIn = h("input", { class: "input", type: "number", min: "1", max: "12", value: String((b.display || {}).limit || 6) });
        const preview = h("div", { class: "mt-12" });

        function refresh() {
          U.clear(preview);
          const ref = srcSel.value === "static" ? "" : srcSel.value;
          const d = sourceData(ref, Number(limitIn.value) || 6);
          if (b.key === "hero" || b.key === "contact" || !ref) {
            preview.appendChild(h("div", { class: "advice info", text: "该模块使用静态内容，不依赖数据源。" }));
            return;
          }
          const items = (d.metrics || []).map((m) => ({ title: m.label, sub: m.value + " · " + m.sub, badge: "指标", tone: "emerald" })).concat(d.items || []);
          preview.appendChild(
            h("div", { class: "stack-8" }, [
              h("div", { class: "fs-12 fw-6 em", text: "数据预览（实时从数据源抽取 " + items.length + " 条）" }),
            ].concat(items.slice(0, 6).map((it) =>
              h("div", { class: "list-row" }, [
                h("div", { class: "lr-icon ic-blue", html: ZK.icons.database(14) }),
                h("div", { class: "lr-main" }, [h("b", { text: it.title }), h("span", { text: it.sub })]),
                it.badge ? h("div", { class: "lr-tail" }, [ZK.ui.badge(it.badge, it.tone || "gray")]) : null,
              ])
            )))
          );
        }

        srcSel.addEventListener("change", refresh);
        limitIn.addEventListener("input", refresh);

        ZK.modal({
          title: "模块配置 · " + (b.title || def.name),
          sub: def.desc,
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                h("div", { class: "form-grid" }, [
                  h("div", { class: "field span-full" }, [h("label", { class: "label", text: "模块标题" }), title]),
                  h("div", { class: "field span-2" }, [h("label", { class: "label", text: "数据来源" }), srcSel]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "每行列数" }), colsIn]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "展示条数" }), limitIn]),
                ]),
                preview,
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "应用配置",
                onclick() {
                  b.title = title.value.trim() || def.name;
                  const src = ZK.db.find("dataSources", srcSel.value);
                  b.source = { type: src ? src.type : "static", ref: src ? src.id : "" };
                  b.display = { columns: U.clamp(Number(colsIn.value) || 3, 1, 4), limit: U.clamp(Number(limitIn.value) || 6, 1, 12) };
                  api.close();
                  paintCanvas();
                  paintPreview();
                  ZK.toast("模块配置已应用");
                },
              }),
            ]);
            refresh();
          },
        });
      }

      /* ---- 预览 ---- */
      function paintPreview() {
        U.clear(previewHost);
        renderPortal(previewHost, c);
      }

      function openFullPreview() {
        const m = ZK.modal({
          title: "门户整站预览",
          sub: c.title + " · " + (c.lang === "zh-TW" ? "繁體" : "简体"),
          size: "lg",
          render(api) {
            api.modal.style.maxWidth = "1180px";
            const box = h("div", { style: { "border-radius": "var(--r-xl)", overflow: "hidden", border: "1px solid var(--border-default)", maxHeight: "70vh", overflowY: "auto" } });
            renderPortal(box, c);
            api.body.appendChild(box);
            api.body.appendChild(
              h("div", { class: "row mt-12", style: { gap: "8px" } }, [
                h("button", { class: "btn btn-sm", text: "切换简繁", onclick: () => { c.lang = c.lang === "zh-TW" ? "zh-CN" : "zh-TW"; api.close(); openFullPreview(); } }),
                h("button", { class: "btn btn-sm", text: c.music && c.music.enabled ? "停止背景音乐" : "播放背景音乐", onclick: () => { if (c.music && c.music.enabled) { stopAmbient(); ZK.toast("已停止播放"); } else { playAmbient(c.music ? c.music.volume : 30); ZK.toast("正在播放：" + ((c.music || {}).track || "环境音")); } } }),
                h("button", { class: "btn btn-sm", text: "前往主题设置", onclick: () => { api.close(); go("#/portal/theme"); } }),
              ])
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => { stopAmbient(); api.close(); } })]);
          },
          onClose: () => stopAmbient(),
        });
        void m;
      }

      function resetLayout() {
        ZK.confirm({ title: "恢复默认布局", message: "将丢弃当前布局与主题配置，恢复为系统默认的门户结构。<br><br><b>⚠️ 此操作不可撤销。</b>", danger: true, okText: "恢复默认" }).then((ok) => {
          if (!ok) return;
          const def = ZK.seed.portalConfig();
          ZK.db.upsert("portalConfig", def);
          c = cfg();
          paintPalette();
          paintCanvas();
          paintPreview();
          ZK.toast("已恢复默认布局");
        });
      }

      function save() {
        if (!c.blocks.some((b) => b.enabled)) return ZK.toast("至少需要启用一个模块", "danger");
        saveCfg(c);
        ZK.db.log("保存门户布局", "门户保存 " + c.blocks.length + " 个模块（启用 " + c.blocks.filter((b) => b.enabled).length + " 个）");
        ZK.toast("门户配置已保存并发布");
      }

      paintPalette();
      paintCanvas();
      paintPreview();
    },
  };

  /* ==================================================================
     二、模块数据配置
     ================================================================== */
  P["portal/modules"] = {
    render(root) {
      const c = cfg();

      root.appendChild(
        ZK.ui.pageHead({
          title: "模块数据配置",
          sub: "为每个门户模块指定数据来源、展示列数与条数，并查看抽取到的真实数据。数据可来自数据中心抽调，也可来自外部数据接入。",
          actions: [
            h("button", { class: "btn btn-sm", text: "门户布局编辑", onclick: () => go("#/portal/builder") }),
            h("button", { class: "btn btn-sm", text: "数据源接入", onclick: () => go("#/portal/sources") }),
            h("button", { class: "btn btn-primary btn-sm", text: "保存全部配置", onclick: () => { saveCfg(c); ZK.db.log("保存模块配置", "更新 " + c.blocks.length + " 个模块的数据配置"); ZK.toast("配置已保存"); } }),
          ],
        })
      );

      const host = h("div", { class: "stack-16" });
      root.appendChild(host);
      paint();

      function paint() {
        U.clear(host);
        host.appendChild(
          ZK.ui.card({
            title: "模块清单（" + c.blocks.length + " 个）",
            sub: "停用的模块不会出现在门户上，但配置会保留",
            icon: ZK.icons.sliders(16),
            body: [ZK.ui.table({
              rows: c.blocks.map((b, i) => Object.assign({ __i: i + 1, __b: b }, { key: b.key, title: b.title, enabled: b.enabled, srcType: (b.source || {}).type, srcRef: (b.source || {}).ref, columns: (b.display || {}).columns, limit: (b.display || {}).limit })),
              pageSize: 12,
              columns: [
                { key: "__i", label: "#", align: "right" },
                { key: "title", label: "模块", render: (r) => h("div", {}, [h("div", { class: "cell-strong", text: r.title }), h("div", { class: "fs-11 faint", text: (BLOCK_MAP[r.key] || {}).desc || "" })]) },
                { key: "enabled", label: "状态", render: (r) => h("button", { class: "switch" + (r.enabled ? " on" : ""), onclick: () => { r.__b.enabled = !r.enabled; paint(); } }) },
                {
                  key: "srcRef",
                  label: "数据来源",
                  render: (r) => {
                    const sel = h("select", { class: "select", style: { width: "220px" } }, [h("option", { value: "", text: "静态内容" })].concat(
                      ZK.db.list("dataSources").map((s) => h("option", { value: s.id, text: (s.type === "external" ? "【外部】" : "【中台】") + s.name, selected: r.srcRef === s.id ? true : null }))
                    ));
                    sel.addEventListener("change", () => {
                      const src = ZK.db.find("dataSources", sel.value);
                      r.__b.source = { type: src ? src.type : "static", ref: src ? src.id : "" };
                      ZK.toast("已切换数据来源，记得保存");
                    });
                    return sel;
                  },
                },
                { key: "srcType", label: "接入方式", render: (r) => ZK.ui.badge(r.srcType === "external" ? "外部数据接入" : r.srcType === "datacenter" ? "数据中心抽调" : "静态内容", r.srcType === "external" ? "violet" : r.srcType === "datacenter" ? "blue" : "gray") },
                {
                  key: "columns",
                  label: "列数",
                  render: (r) => {
                    const sel = h("select", { class: "select", style: { width: "76px" } }, [1, 2, 3, 4].map((v) => h("option", { value: String(v), text: v + " 列", selected: r.columns === v ? true : null })));
                    sel.addEventListener("change", () => {
                      r.__b.display = Object.assign({}, r.__b.display, { columns: Number(sel.value) });
                      ZK.toast("已调整列数，记得保存");
                    });
                    return sel;
                  },
                },
                {
                  key: "limit",
                  label: "条数",
                  render: (r) => {
                    const inp = h("input", { class: "input", type: "number", min: "1", max: "12", value: String(r.limit), style: { width: "76px" } });
                    inp.addEventListener("change", () => {
                      r.__b.display = Object.assign({}, r.__b.display, { limit: U.clamp(Number(inp.value) || 6, 1, 12) });
                      ZK.toast("已调整展示条数，记得保存");
                    });
                    return inp;
                  },
                },
                { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs", text: "查看抽取数据", onclick: () => openData(r.__b) }) },
              ],
            })],
          })
        );

        /* 数据抽取总览 */
        const rows = c.blocks.filter((b) => b.enabled && (b.source || {}).ref).map((b) => {
          const d = sourceData(b.source.ref, b.display.limit);
          const cnt = (d.metrics ? d.metrics.length : 0) + (d.items ? d.items.length : 0);
          return {
            title: b.title,
            src: (ZK.db.find("dataSources", b.source.ref) || {}).name || b.source.ref,
            kind: d.metrics ? "指标 + 列表" : "列表",
            count: cnt,
            limit: b.display.limit,
            state: cnt > 0 ? "有数据" : "空数据",
          };
        });
        host.appendChild(
          ZK.ui.card({
            title: "数据抽取自检",
            sub: "逐模块真实抽取一次，确认门户上不会出现空模块",
            icon: ZK.icons.checkCircle(16),
            actions: [ZK.ui.badge(rows.every((r) => r.count > 0) ? "全部模块均有数据" : "存在空数据模块", rows.every((r) => r.count > 0) ? "emerald" : "amber")],
            body: [ZK.ui.table({
              rows: rows,
              pageSize: 12,
              columns: [
                { key: "title", label: "模块", render: (r) => h("span", { class: "cell-strong", text: r.title }) },
                { key: "src", label: "数据源" },
                { key: "kind", label: "返回形态" },
                { key: "count", label: "抽取条目", align: "right", sortable: true },
                { key: "limit", label: "展示上限", align: "right" },
                { key: "state", label: "状态", render: (r) => ZK.ui.badge(r.state, r.state === "有数据" ? "emerald" : "amber") },
              ],
            })],
          })
        );
      }

      function openData(b) {
        const d = sourceData((b.source || {}).ref, (b.display || {}).limit);
        ZK.modal({
          title: "抽取数据预览 · " + b.title,
          sub: "来源：" + ((ZK.db.find("dataSources", b.source.ref) || {}).name || "静态内容") + "　列数 " + b.display.columns + "　条数 " + b.display.limit,
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-12" }, [
                (d.metrics || []).length
                  ? h("div", { class: "grid grid-3", style: { gap: "10px" } }, d.metrics.map((mm) =>
                      h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
                        h("div", { class: "fs-11 ghost", text: mm.label }),
                        h("div", { class: "fs-22 fw-7 em", text: mm.value }),
                        h("div", { class: "fs-11 faint", text: mm.sub }),
                      ])
                    ))
                  : null,
                (d.items || []).length
                  ? h("div", { class: "row-list" }, d.items.slice(0, (b.display || {}).limit || 6).map((it) =>
                      h("div", { class: "list-row" }, [
                        h("div", { class: "lr-icon ic-emerald", html: ZK.icons.fileText(14) }),
                        h("div", { class: "lr-main" }, [h("b", { text: it.title }), h("span", { text: it.sub })]),
                        it.badge ? h("div", { class: "lr-tail" }, [ZK.ui.badge(it.badge, it.tone || "gray")]) : null,
                      ])
                    ))
                  : h("div", { class: "fs-12 faint", text: "该模块使用静态内容，无数据源抽取结果。" }),
              ])
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }
    },
  };

  /* ==================================================================
     三、数据源接入
     ================================================================== */
  P["portal/sources"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "数据源接入",
          sub: "门户模块的数据可以来自数据中心抽调，也可以来自外部系统接口。测试连接会真实执行一次数据抽取，返回字段与样例数据。",
          actions: [
            h("button", { class: "btn btn-sm", text: "模块数据配置", onclick: () => go("#/portal/modules") }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.plus(14) + "<span>新增外部数据源</span>", onclick: () => openAdd() }),
          ],
        })
      );

      const host = h("div", { class: "stack-16" });
      root.appendChild(host);
      paint();

      function paint() {
        U.clear(host);
        const dc = ZK.db.list("dataSources", (s) => s.type === "datacenter");
        const ext = ZK.db.list("dataSources", (s) => s.type === "external");

        host.appendChild(
          h("div", { class: "grid grid-4" }, [
            ZK.ui.statCard({ label: "数据源总数", value: String(ZK.db.list("dataSources").length), target: "中台 " + dc.length + " · 外部 " + ext.length, icon: ZK.icons.database(18), tone: "emerald", progress: 80 }),
            ZK.ui.statCard({ label: "已连接", value: String(ZK.db.list("dataSources", (s) => s.status === "connected").length), target: "状态为已连接的数据源", icon: ZK.icons.link(18), tone: "blue", progress: 92 }),
            ZK.ui.statCard({ label: "被模块引用", value: String(cfg().blocks.filter((b) => (b.source || {}).ref).length), target: "门户模块引用数", icon: ZK.icons.layout(18), tone: "violet", progress: 66 }),
            ZK.ui.statCard({ label: "可抽调字段", value: String(U.sum(ZK.db.list("dataSources").map((s) => (s.fields || []).length))), target: "全部数据源字段合计", icon: ZK.icons.list(18), tone: "amber", progress: 74 }),
          ])
        );

        [["数据中心抽调", dc, "datacenter"], ["外部数据接入", ext, "external"]].forEach((pair) => {
          host.appendChild(
            ZK.ui.card({
              title: pair[0],
              sub: pair[2] === "datacenter" ? "平台内部数据中台，直接对平台数据做聚合抽调" : "对接学校与校外系统，通过接口拉取数据",
              icon: pair[2] === "datacenter" ? ZK.icons.database(16) : ZK.icons.external(16),
              body: [ZK.ui.table({
                rows: pair[1],
                pageSize: 12,
                searchKeys: ["name", "desc"],
                columns: [
                  { key: "name", label: "数据源", render: (r) => h("div", {}, [h("div", { class: "cell-strong", text: r.name }), h("div", { class: "fs-11 faint", text: r.desc })]) },
                  { key: "fields", label: "字段", render: (r) => h("div", { class: "chip-wrap" }, (r.fields || []).map((f) => h("span", { class: "chip", text: f }))) },
                  { key: "endpoint", label: "接口地址", render: (r) => (r.endpoint ? h("span", { class: "mono fs-11 cell-muted", text: r.method + " " + r.endpoint }) : h("span", { class: "faint", text: "内部抽调" })) },
                  { key: "status", label: "状态", render: (r) => ZK.ui.badge(r.status === "connected" ? "已连接" : "未连接", r.status === "connected" ? "emerald" : "amber", true) },
                  { key: "updatedAt", label: "最近同步", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtDateTime(r.updatedAt) }) },
                  {
                    key: "op",
                    label: "操作",
                    render: (r) =>
                      h("div", { class: "row", style: { gap: "4px" } }, [
                        h("button", { class: "btn btn-xs btn-primary", text: "测试连接", onclick: () => testConn(r) }),
                        pair[2] === "external"
                          ? h("button", { class: "btn btn-xs btn-danger", text: "删除", onclick: async () => {
                              const ok = await ZK.confirm({ title: "删除数据源", message: "确定删除「" + U.escapeHtml(r.name) + "」吗？引用该数据源的门户模块将失去数据。", danger: true, okText: "删除" });
                              if (!ok) return;
                              ZK.db.remove("dataSources", r.id);
                              ZK.db.log("删除数据源", "删除「" + r.name + "」");
                              paint();
                              ZK.toast("数据源已删除");
                            } })
                          : null,
                      ]),
                  },
                ],
              })],
            })
          );
        });
      }

      function testConn(src) {
        const t0 = performance.now();
        const d = sourceData(src.id, 6);
        const cost = U.round(performance.now() - t0, 2);
        const items = (d.metrics || []).map((m) => ({ title: m.label, sub: m.value + " · " + m.sub, badge: "指标", tone: "emerald" })).concat(d.items || []);
        ZK.modal({
          title: "连接测试 · " + src.name,
          sub: (src.endpoint ? src.method + " " + src.endpoint : "平台内部数据中台抽调动词") + "　耗时 " + cost + " ms",
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-12" }, [
                h("div", { class: "row", style: { gap: "8px" } }, [
                  ZK.ui.badge(items.length ? "连接成功" : "连接成功但无数据", items.length ? "emerald" : "amber", true),
                  ZK.ui.badge("返回 " + items.length + " 条", "blue"),
                  ZK.ui.badge("耗时 " + cost + " ms", "gray"),
                ]),
                ZK.ui.kv([
                  ["数据源类型", src.type === "external" ? "外部数据接入" : "数据中心抽调"],
                  ["字段定义", (src.fields || []).join("、")],
                  ["最近同步", U.fmtDateTime(src.updatedAt)],
                  ["授权标识", src.type === "external" ? "已通过统一身份认证换取访问令牌" : "平台内部调用，无需授权"],
                ]),
                items.length
                  ? h("div", { class: "row-list" }, items.slice(0, 8).map((it) =>
                      h("div", { class: "list-row" }, [
                        h("div", { class: "lr-icon ic-emerald", html: ZK.icons.checkCircle(14) }),
                        h("div", { class: "lr-main" }, [h("b", { text: it.title }), h("span", { text: it.sub })]),
                        it.badge ? h("div", { class: "lr-tail" }, [ZK.ui.badge(it.badge, it.tone || "gray")]) : null,
                      ])
                    ))
                  : h("div", { class: "fs-12 faint", text: "接口返回为空，请检查字段映射或数据权限。" }),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "关闭", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "标记为已连接",
                onclick() {
                  ZK.db.update("dataSources", src.id, { status: "connected", updatedAt: Date.now() });
                  ZK.db.log("测试数据源", "「" + src.name + "」连接测试通过，耗时 " + cost + " ms");
                  ZK.toast("数据源已标记为已连接");
                  api.close();
                  paint();
                },
              }),
            ]);
          },
        });
      }

      function openAdd() {
        const name = h("input", { class: "input", placeholder: "例如：学生考勤系统接口" });
        const desc = h("input", { class: "input", placeholder: "用途说明" });
        const endpoint = h("input", { class: "input", placeholder: "https://example.edu/api/attendance" });
        const method = h("select", { class: "select" }, ["GET", "POST"].map((m) => h("option", { text: m })));
        const fields = h("input", { class: "input", placeholder: "字段，逗号分隔，例如：学号,出勤率,缺勤次数" });
        ZK.modal({
          title: "新增外部数据源",
          sub: "新增后可在「模块数据配置」中将其指派给门户模块",
          render(api) {
            const err = h("div", { class: "login-err hidden" });
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "数据源名称" }), name]),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "用途说明" }), desc]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "请求方式" }), method]),
                h("div", { class: "field span-2" }, [h("label", { class: "label", text: "接口地址" }), endpoint]),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "返回字段" }), fields]),
                h("div", { class: "span-full" }, [err]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "保存并测试",
                onclick() {
                  if (!name.value.trim() || !endpoint.value.trim()) {
                    err.textContent = "请填写名称与接口地址";
                    err.classList.remove("hidden");
                    return;
                  }
                  const rec = ZK.db.insert("dataSources", {
                    id: U.uid("ext"),
                    name: name.value.trim(),
                    type: "external",
                    desc: desc.value.trim() || "自定义外部数据源",
                    fields: fields.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
                    endpoint: endpoint.value.trim(),
                    method: method.value,
                    updatedAt: Date.now(),
                    status: "connected",
                  });
                  ZK.db.log("新增数据源", "接入外部数据源「" + rec.name + "」");
                  api.close();
                  paint();
                  ZK.toast("数据源已接入，可在模块配置中引用");
                },
              }),
            ]);
          },
        });
      }
    },
  };

  /* ==================================================================
     四、主题与多语言
     ================================================================== */
  P["portal/theme"] = {
    render(root) {
      const c = cfg();

      root.appendChild(
        ZK.ui.pageHead({
          title: "主题与多语言",
          sub: "设置门户页面背景、背景音乐、主题色与圆角，并支持简体 / 繁体一键切换。所有设置即时在右侧预览中生效。",
          actions: [
            h("button", { class: "btn btn-sm", text: "门户布局编辑", onclick: () => go("#/portal/builder") }),
            h("button", { class: "btn btn-primary btn-sm", text: "保存主题设置", onclick: () => save() }),
          ],
        })
      );

      const left = h("div", { class: "stack-16" });
      const previewHost = h("div", { style: { "border-radius": "var(--r-xl)", overflow: "hidden", border: "1px solid var(--border-default)", height: "620px", overflowY: "auto" } });
      root.appendChild(h("div", { class: "grid grid-2", style: { "align-items": "start" } }, [left, ZK.ui.card({ title: "主题预览", sub: "点击右侧控件即时生效", icon: ZK.icons.eye(16), body: [previewHost] })]));

      /* ---- 背景 ---- */
      const BG_PRESETS = [
        { name: "翠绿青蓝双光晕", type: "gradient", value: "radial-gradient(circle at 18% 12%, rgba(37, 99, 235,0.22), transparent 55%), radial-gradient(circle at 82% 88%, rgba(59,130,246,0.20), transparent 55%), #030712" },
        { name: "深蓝极光", type: "gradient", value: "radial-gradient(circle at 25% 15%, rgba(99,102,241,0.28), transparent 58%), radial-gradient(circle at 78% 82%, rgba(14, 165, 233,0.20), transparent 55%), #050914" },
        { name: "紫夜星空", type: "gradient", value: "radial-gradient(circle at 20% 20%, rgba(99, 102, 241,0.26), transparent 58%), radial-gradient(circle at 80% 78%, rgba(79, 70, 229,0.18), transparent 55%), #060b1a" },
        { name: "纯黑板式", type: "solid", value: "#030712" },
        { name: "深灰板式", type: "solid", value: "#0f172a" },
        { name: "浅色纸张", type: "solid", value: "linear-gradient(180deg,#f8fafc,#eef2f7)" },
      ];
      const bgRow = h("div", { class: "swatch-row" });

      left.appendChild(
        ZK.ui.card({
          title: "页面背景",
          sub: "支持渐变、纯色与自定义色值",
          icon: ZK.icons.palette(16),
          body: [
            bgRow,
            h("div", { class: "row mt-12", style: { gap: "8px" } }, [
              h("span", { class: "fs-12 muted", text: "自定义背景色值：" }),
              (function () {
                const inp = h("input", { class: "input", style: { width: "300px" }, value: c.background.value });
                inp.addEventListener("change", () => {
                  c.background = { type: "custom", value: inp.value, name: "自定义背景" };
                  paintBg();
                  paintPreview();
                });
                return inp;
              })(),
            ]),
          ],
        })
      );

      /* ---- 主题色与圆角 ---- */
      const COLORS = [
        { name: "翠绿", primary: "#2563eb", accent: "#60a5fa" },
        { name: "青蓝", primary: "#0ea5e9", accent: "#7dd3fc" },
        { name: "靛蓝", primary: "#6366f1", accent: "#a5b4fc" },
        { name: "紫罗兰", primary: "#6366f1", accent: "#a5b4fc" },
        { name: "琥珀", primary: "#0ea5e9", accent: "#38bdf8" },
        { name: "玫红", primary: "#4f46e5", accent: "#a5b4fc" },
      ];
      const colorRow = h("div", { class: "swatch-row" });

      left.appendChild(
        ZK.ui.card({
          title: "主题色",
          sub: "影响强调色、按钮、数据强调数字与激活态",
          icon: ZK.icons.sparkles(16),
          body: [
            colorRow,
            h("div", { class: "form-grid mt-12" }, [
              (function () {
                const inp = h("input", { class: "input", value: c.theme.primary });
                inp.addEventListener("change", () => {
                  c.theme = Object.assign({}, c.theme, { primary: inp.value });
                  paintColors();
                  paintPreview();
                });
                return h("div", { class: "field" }, [h("label", { class: "label", text: "主色（自定义）" }), inp]);
              })(),
              (function () {
                const inp = h("input", { class: "input", value: c.theme.accent });
                inp.addEventListener("change", () => {
                  c.theme = Object.assign({}, c.theme, { accent: inp.value });
                  paintColors();
                  paintPreview();
                });
                return h("div", { class: "field" }, [h("label", { class: "label", text: "辅助色（自定义）" }), inp]);
              })(),
              (function () {
                const inp = h("input", { class: "input", type: "number", min: "0", max: "32", value: String(c.theme.radius) });
                inp.addEventListener("input", () => {
                  c.theme = Object.assign({}, c.theme, { radius: U.clamp(Number(inp.value) || 0, 0, 32) });
                  paintPreview();
                });
                return h("div", { class: "field" }, [h("label", { class: "label", text: "圆角（px）" }), inp]);
              })(),
            ]),
          ],
        })
      );

      /* ---- 背景音乐 ---- */
      const musicEnabled = h("button", { class: "switch" + (c.music.enabled ? " on" : "") });
      const trackInp = h("input", { class: "input", value: c.music.track });
      const volInp = h("input", { class: "input", type: "number", min: "0", max: "100", value: String(c.music.volume) });
      left.appendChild(
        ZK.ui.card({
          title: "背景音乐",
          sub: "开启后门户会显示音乐标识，可试听环境音（浏览器要求用户手动触发播放）",
          icon: ZK.icons.music(16),
          body: [
            h("div", { class: "form-grid" }, [
              h("div", { class: "field" }, [h("label", { class: "label", text: "是否开启" }), musicEnabled]),
              h("div", { class: "field span-2" }, [h("label", { class: "label", text: "曲目名称" }), trackInp]),
              h("div", { class: "field" }, [h("label", { class: "label", text: "音量（0-100）" }), volInp]),
            ]),
            h("div", { class: "row mt-12", style: { gap: "8px" } }, [
              h("button", { class: "btn btn-sm", text: "试听", onclick: () => { playAmbient(Number(volInp.value) || 30); ZK.toast("正在播放：" + (trackInp.value || "环境音")); } }),
              h("button", { class: "btn btn-sm", text: "停止", onclick: () => { stopAmbient(); ZK.toast("已停止播放"); } }),
            ]),
          ],
        })
      );
      musicEnabled.addEventListener("click", () => {
        c.music = Object.assign({}, c.music, { enabled: !c.music.enabled });
        musicEnabled.classList.toggle("on", c.music.enabled);
        paintPreview();
        ZK.toast("背景音乐已" + (c.music.enabled ? "开启" : "关闭"));
      });

      /* ---- 多语言 ---- */
      const langRow = h("div", { class: "chip-wrap" });
      left.appendChild(
        ZK.ui.card({
          title: "语言与导航",
          sub: "简体 / 繁体一键切换；导航项可增删与排序",
          icon: ZK.icons.globe(16),
          body: [langRow, navEditor()],
        })
      );

      function navEditor() {
        const box = h("div", { class: "stack-8 mt-12" });
        function paintNav() {
          U.clear(box);
          c.nav.forEach((n, i) => {
            const inp = h("input", { class: "input", value: n, style: { width: "160px" } });
            inp.addEventListener("change", () => (c.nav[i] = inp.value.trim() || n));
            box.appendChild(
              h("div", { class: "row", style: { gap: "6px" } }, [
                h("span", { class: "pill-num", text: String(i + 1) }),
                inp,
                h("button", { class: "btn btn-xs", text: "↑", onclick() { if (i > 0) { const x = c.nav.splice(i, 1)[0]; c.nav.splice(i - 1, 0, x); paintNav(); paintPreview(); } } }),
                h("button", { class: "btn btn-xs", text: "↓", onclick() { if (i < c.nav.length - 1) { const x = c.nav.splice(i, 1)[0]; c.nav.splice(i + 1, 0, x); paintNav(); paintPreview(); } } }),
                h("button", { class: "btn btn-xs btn-danger", text: "删除", onclick() { c.nav.splice(i, 1); paintNav(); paintPreview(); } }),
              ])
            );
          });
          box.appendChild(
            h("div", { class: "row", style: { gap: "8px" } }, [
              (function () {
                const inp = h("input", { class: "input", placeholder: "新导航项名称", style: { width: "160px" } });
                return h("div", { class: "row", style: { gap: "6px" } }, [inp, h("button", { class: "btn btn-xs btn-primary", text: "新增导航", onclick: () => { if (!inp.value.trim()) return ZK.toast("请输入导航名称", "danger"); c.nav.push(inp.value.trim()); inp.value = ""; paintNav(); paintPreview(); } })]);
              })(),
            ])
          );
        }
        paintNav();
        return box;
      }

      /* ---- 页面文案 ---- */
      left.appendChild(
        ZK.ui.card({
          title: "门户文案",
          icon: ZK.icons.edit(16),
          body: [
            h("div", { class: "form-grid" }, [
              (function () {
                const inp = h("input", { class: "input", value: c.title });
                inp.addEventListener("change", () => { c.title = inp.value; paintPreview(); });
                return h("div", { class: "field span-full" }, [h("label", { class: "label", text: "门户标题" }), inp]);
              })(),
              (function () {
                const inp = h("textarea", { class: "textarea", value: c.subtitle });
                inp.addEventListener("change", () => { c.subtitle = inp.value; paintPreview(); });
                return h("div", { class: "field span-full" }, [h("label", { class: "label", text: "副标题 / 定位语" }), inp]);
              })(),
            ]),
          ],
        })
      );

      function paintBg() {
        U.clear(bgRow);
        BG_PRESETS.forEach((p) => {
          const on = c.background.value === p.value;
          const b = h("button", { class: "swatch" + (on ? " on" : ""), title: p.name, style: { background: p.value, width: "54px", height: "40px", "border-radius": "var(--r-md)", border: on ? "2px solid var(--accent)" : "1px solid var(--border-strong)" } });
          b.addEventListener("click", () => {
            c.background = { type: p.type, value: p.value, name: p.name };
            paintBg();
            paintPreview();
            ZK.toast("已应用背景：" + p.name);
          });
          bgRow.appendChild(b);
        });
      }

      function paintColors() {
        U.clear(colorRow);
        COLORS.forEach((p) => {
          const on = c.theme.primary === p.primary;
          const b = h("button", {
            class: "swatch" + (on ? " on" : ""),
            text: p.name,
            title: p.name + " " + p.primary,
            style: { background: "linear-gradient(135deg," + p.primary + "," + p.accent + ")", color: "#04101f", border: on ? "2px solid #fff" : "1px solid var(--border-strong)", "border-radius": "var(--r-md)", padding: "8px 12px", "font-size": "12px", "font-weight": "600" },
          });
          b.addEventListener("click", () => {
            c.theme = Object.assign({}, c.theme, { primary: p.primary, accent: p.accent });
            paintColors();
            paintPreview();
            ZK.toast("已应用主题色：" + p.name);
          });
          colorRow.appendChild(b);
        });
      }

      function paintLang() {
        U.clear(langRow);
        [["zh-CN", "简体中文"], ["zh-TW", "繁體中文（一键切换）"]].forEach((pair) => {
          const on = c.lang === pair[0];
          langRow.appendChild(
            h("button", { class: "chip" + (on ? " on" : ""), text: pair[1], onclick: () => { c.lang = pair[0]; paintLang(); paintPreview(); ZK.toast("语言已切换：" + (c.lang === "zh-TW" ? "繁體" : "简体")); } })
          );
        });
      }

      function paintPreview() {
        U.clear(previewHost);
        renderPortal(previewHost, c);
      }

      function save() {
        c.music = { enabled: c.music.enabled, track: trackInp.value, autoplay: false, volume: U.clamp(Number(volInp.value) || 30, 0, 100) };
        saveCfg(c);
        ZK.db.log("保存门户主题", "主题色 " + c.theme.primary + "，背景「" + (c.background.name || "自定义") + "」，语言 " + c.lang);
        ZK.toast("主题设置已保存");
      }

      paintBg();
      paintColors();
      paintLang();
      paintPreview();
    },
  };
})();
