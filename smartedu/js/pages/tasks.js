/* ==========================================================================
   页面 · 作品型任务与 AI 评阅
   （任务管理 / 新建作品型任务 / 作品提交 / AI评阅与反馈）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  const ROLE_TEMPLATES = [
    {
      id: "role_default", name: "内容评审专家", persona: "课程内容方向的评审专家", weight: 50,
      focus: "内容完整性与准确性",
      dimensions: [
        { name: "内容完整", weight: 40, desc: "覆盖任务要求的全部要素", signals: [], anti: [] },
        { name: "表达准确", weight: 35, desc: "表述准确，无概念性错误", signals: [], anti: [] },
        { name: "结构清晰", weight: 25, desc: "层次分明，便于阅读", signals: ["一、", "二、", "结论", "首先", "其次"], anti: [] },
      ],
    },
    {
      id: "role_lang", name: "语言质量评审", persona: "英语写作与翻译教师", weight: 30,
      focus: "语言准确性与表达质量",
      dimensions: [
        { name: "语法准确", weight: 45, desc: "无语法与搭配错误", signals: [], anti: [] },
        { name: "表达地道", weight: 35, desc: "符合目标语表达惯例", signals: ["we are pleased", "we look forward to", "should you"], anti: [] },
        { name: "术语规范", weight: 20, desc: "专业术语使用准确一致", signals: [], anti: [] },
      ],
    },
    {
      id: "role_client", name: "客户方代表", persona: "成果使用方代表", weight: 20,
      focus: "可读性与执行便利",
      dimensions: [
        { name: "可读性", weight: 50, desc: "非专业读者亦可理解", signals: [], anti: [] },
        { name: "可直接使用", weight: 30, desc: "格式规范，可交付落地", signals: ["附件", "表格", "清单", "说明"], anti: [] },
        { name: "排版规范", weight: 20, desc: "图文混排得当，编号统一", signals: ["图", "表"], anti: [] },
      ],
    },
  ];

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function weightSum(roles) {
    return U.sum(roles.map((r) => Number(r.weight) || 0));
  }

  function submissionCount(taskId) {
    return ZK.db.list("submissions", (s) => s.taskId === taskId).length;
  }

  function taskAvg(taskId) {
    const list = ZK.db.list("submissions", (s) => s.taskId === taskId && s.score !== null && s.score !== undefined);
    return list.length ? U.round(U.avg(list.map((s) => s.score)), 1) : null;
  }

  function field(label, node, required) {
    return h("div", { class: "field" }, [
      h("label", { class: "label", html: label + (required ? '<span class="req">*</span>' : "") }),
      node,
    ]);
  }

  function statBox(label, value, color) {
    return h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
      h("div", { class: "fs-11 ghost", text: label }),
      h("div", { class: "fs-18 fw-7", style: { color: color || "var(--text-primary)" }, text: String(value) }),
    ]);
  }

  /** 真实读取图片文件，压缩出缩略图后仅保留必要信息 */
  function readImage(file, cb) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const maxW = 260;
        const ratio = Math.min(1, maxW / img.width);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * ratio);
        c.height = Math.round(img.height * ratio);
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        cb({
          name: file.name,
          w: img.width,
          h: img.height,
          sizeKB: Math.round(file.size / 1024),
          thumb: c.toDataURL("image/jpeg", 0.62),
        });
      };
      img.onerror = function () {
        ZK.toast("图片解析失败，请更换文件", "danger");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ==================================================================
     一、任务管理
     ================================================================== */
  P["tasks/list"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "作品型任务管理",
          sub: "教师创建作品型任务，在任务中明确评估角色与评分标准；学生提交图文混排作品后由 AI 按标准评阅并给出反馈。",
          actions: [
            h("button", { class: "btn btn-sm", text: "作品提交", onclick: () => go("#/tasks/submit") }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.plus(14) + "<span>新建作品型任务</span>", onclick: () => go("#/tasks/new") }),
          ],
        })
      );

      const host = h("div");
      root.appendChild(host);

      const courseFilter = h("select", { class: "select", style: { width: "170px" } }, [h("option", { value: "", text: "全部课程" })].concat(
        Array.from(new Set(ZK.db.list("tasks").map((t) => t.course))).map((c) => h("option", { value: c, text: c }))
      ));
      const statusFilter = h("select", { class: "select", style: { width: "140px" } }, [
        h("option", { value: "", text: "全部状态" }),
        h("option", { value: "open", text: "进行中" }),
        h("option", { value: "closed", text: "已截止" }),
      ]);

      function paint() {
        U.clear(host);
        const all = ZK.db.list("tasks");
        const subs = ZK.db.list("submissions");
        const reviewed = subs.filter((s) => s.aiReview);

        host.appendChild(
          h("div", { class: "grid grid-4 mb-16" }, [
            ZK.ui.statCard({ label: "任务总数", value: String(all.length), target: "覆盖 " + ZK.db.list("courses").length + " 门课程", icon: ZK.icons.clipboard(18), tone: "emerald", progress: Math.min(100, all.length * 18) }),
            ZK.ui.statCard({ label: "进行中任务", value: String(all.filter((t) => t.status === "open").length), target: "含实训与综合作业", icon: ZK.icons.clock(18), tone: "blue", progress: 55 }),
            ZK.ui.statCard({ label: "作品提交量", value: String(subs.length), target: "已 AI 评阅 " + reviewed.length + " 份", icon: ZK.icons.upload(18), tone: "violet", progress: Math.min(100, subs.length * 22) }),
            ZK.ui.statCard({
              label: "AI 评阅平均分",
              value: reviewed.length ? String(U.round(U.avg(reviewed.map((s) => s.aiReview.overall)), 1)) : "—",
              target: "满分 100 分",
              icon: ZK.icons.award(18),
              tone: "amber",
              progress: reviewed.length ? U.avg(reviewed.map((s) => s.aiReview.overall)) : 0,
            }),
          ])
        );

        let rows = all;
        if (courseFilter.value) rows = rows.filter((t) => t.course === courseFilter.value);
        if (statusFilter.value) rows = rows.filter((t) => t.status === statusFilter.value);

        host.appendChild(
          h("div", { class: "grid grid-2" },
            rows.map((t) => {
              const cnt = submissionCount(t.id);
              const avg = taskAvg(t.id);
              const roles = t.aiRoles || [];
              const cls = t.status === "open" ? "emerald" : "gray";
              return ZK.ui.card({
                title: t.title,
                sub: t.course + " · 第 " + t.chapter + " 章 · " + t.type + " · 总分 " + t.total,
                icon: ZK.icons.clipboard(16),
                actions: [ZK.ui.badge(t.status === "open" ? "进行中" : "已截止", cls, t.status === "open"), ZK.ui.badge(t.owner, "gray")],
                body: [
                  h("p", { class: "fs-12 muted", style: { "line-height": "1.7", "min-height": "54px" }, text: t.desc }),
                  h("div", { class: "chip-wrap mb-12" }, (t.deliverables || []).map((d) => h("span", { class: "chip", text: d }))),
                  h("div", { class: "grid grid-4", style: { gap: "8px" } }, [
                    statBox("评估角色", roles.length),
                    statBox("评分维度", U.sum(roles.map((r) => (r.dimensions || []).length))),
                    statBox("提交量", cnt),
                    statBox("平均分", avg === null ? "—" : avg, avg === null ? null : avg >= 85 ? "var(--accent-bright)" : avg >= 75 ? "var(--info-bright)" : "var(--warn-bright)"),
                  ]),
                  h("div", { class: "divider" }),
                  h("div", { class: "fs-11 faint mb-8", text: "截止 " + U.fmtDate(t.deadline) + " · 发布 " + U.fmtDate(t.publishAt) + " · " + (t.allowResubmit ? "允许重复提交" : "仅可提交一次") }),
                  h("div", { class: "row", style: { gap: "6px", "flex-wrap": "wrap" } }, [
                    h("button", { class: "btn btn-sm btn-primary", text: "AI 评阅与反馈", onclick: () => go("#/tasks/review/" + t.id) }),
                    h("button", { class: "btn btn-sm", text: "查看评分标准", onclick: () => openRubric(t) }),
                    h("button", { class: "btn btn-sm", text: "提交作品", onclick: () => go("#/tasks/submit/" + t.id) }),
                    h("button", { class: "btn btn-sm", text: "编辑", onclick: () => go("#/tasks/new/" + t.id) }),
                    h("button", {
                      class: "btn btn-sm btn-danger",
                      html: ZK.icons.trash(13),
                      title: "删除任务",
                      onclick: async () => {
                        const ok = await ZK.confirm({
                          title: "删除任务",
                          message: "将删除《" + U.escapeHtml(t.title) + "》及其 " + cnt + " 份作品提交记录。<br><br><b>⚠️ 此操作不可撤销。</b>",
                          okText: "确认删除",
                          danger: true,
                        });
                        if (!ok) return;
                        ZK.db.list("submissions", (s) => s.taskId === t.id).forEach((s) => ZK.db.remove("submissions", s.id));
                        ZK.db.remove("tasks", t.id);
                        ZK.db.log("删除任务", "删除《" + t.title + "》");
                        ZK.toast("任务已删除");
                        paint();
                      },
                    }),
                  ]),
                ],
              });
            })
          )
        );

        if (!rows.length) host.appendChild(ZK.ui.empty({ title: "没有符合条件的任务", desc: "调整筛选条件或新建一个作品型任务。", icon: ZK.icons.clipboard(22) }));
      }

      function openRubric(t) {
        ZK.modal({
          title: "评分标准 · " + t.title,
          sub: "评估角色权重合计 " + weightSum(t.aiRoles) + "% · 任务总分 " + t.total,
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, (t.aiRoles || []).map((r) =>
                ZK.ui.card({
                  title: r.name,
                  sub: r.persona + " · 关注 " + r.focus + " · 权重 " + r.weight + "%",
                  icon: ZK.icons.user(16),
                  body: [
                    ZK.ui.kv((r.dimensions || []).map((d) => [d.name + "（" + d.weight + "%）", d.desc + (d.signals && d.signals.length ? "　｜　可核验表述：" + d.signals.join("、") : "")])),
                  ],
                })
              ).concat([
                ZK.ui.card({
                  title: "综合评分标准",
                  icon: ZK.icons.award(16),
                  body: [ZK.ui.table({
                    rows: t.rubric || [],
                    pageSize: 10,
                    columns: [
                      { key: "name", label: "评分项", render: (v) => h("span", { class: "cell-strong", text: v.name }) },
                      { key: "weight", label: "权重", align: "right", render: (v) => v.weight + "%" },
                      { key: "desc", label: "评分要点", render: (v) => h("span", { class: "cell-muted", text: v.desc }) },
                    ],
                  })],
                }),
              ]))
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }

      courseFilter.addEventListener("change", paint);
      statusFilter.addEventListener("change", paint);
      root.appendChild(h("div", { class: "row mb-12", style: { gap: "10px" } }, [courseFilter, statusFilter]));
      root.appendChild(host);
      paint();
    },
  };

  /* ==================================================================
     二、新建作品型任务（核心：评估角色与评分标准配置）
     ================================================================== */
  P["tasks/new"] = {
    render(root, param) {
      const editing = param ? ZK.db.find("tasks", param) : null;
      const state = editing
        ? {
            title: editing.title,
            courseId: editing.courseId,
            course: editing.course,
            type: editing.type,
            chapter: editing.chapter,
            total: editing.total,
            desc: editing.desc,
            deliverables: (editing.deliverables || []).slice(),
            classes: (editing.classes || []).slice(),
            deadline: editing.deadline,
            aiRoles: clone(editing.aiRoles || []),
            rubric: clone(editing.rubric || []),
          }
        : {
            title: "",
            courseId: "c_biztrans",
            course: "商务英语笔译",
            type: "翻译作品",
            chapter: 4,
            total: 100,
            desc: "",
            deliverables: ["图文混排作品文档", "处理依据说明"],
            classes: ["cls_biz1"],
            deadline: Date.now() + 86400000 * 14,
            aiRoles: clone(ROLE_TEMPLATES),
            rubric: [
              { name: "内容完整准确", weight: 45, desc: "要素无遗漏、无增添、无意思偏离" },
              { name: "语言与格式规范", weight: 30, desc: "表达地道、格式层级完整" },
              { name: "术语与依据", weight: 25, desc: "术语一致，处理依据可核验" },
            ],
          };

      root.appendChild(
        ZK.ui.pageHead({
          title: editing ? "编辑作品型任务" : "新建作品型任务",
          sub: "作品型任务的关键在于把事情说清楚：交付什么、由谁评、按什么标准评。评估角色与评分标准将直接驱动 AI 评阅。",
          actions: [
            h("button", { class: "btn btn-sm", text: "返回任务列表", onclick: () => go("#/tasks/list") }),
            h("button", { class: "btn btn-sm", text: "载入模板", onclick: () => loadTemplate() }),
          ],
        })
      );

      /* ---------- 基础信息 ---------- */
      const title = h("input", { class: "input", value: state.title, placeholder: "例如：商务合同条款翻译（中译英）" });
      const course = h("select", { class: "select" }, ZK.db.list("courses").map((c) => h("option", { value: c.id, text: c.name, selected: c.id === state.courseId ? true : null })));
      const type = h("select", { class: "select" }, ["翻译作品", "分析报告", "实践报告", "设计方案", "综合实践"].map((v) => h("option", { value: v, text: v, selected: v === state.type ? true : null })));
      const chapter = h("input", { class: "input", type: "number", value: String(state.chapter), min: "1", max: "10" });
      const total = h("input", { class: "input", type: "number", value: String(state.total) });
      const desc = h("textarea", { class: "textarea", value: state.desc, placeholder: "描述任务情境、要求与提交方式" });
      const deliver = h("input", { class: "input", value: state.deliverables.join("、"), placeholder: "逗号分隔，例如：中文函件、英文译文、语域分析" });
      const deadline = h("input", { class: "input", type: "date", value: U.fmtDate(state.deadline) });
      const clsBox = h("div", { class: "chip-wrap" });
      ZK.db.list("classes").forEach((c) => {
        const badge = h("button", {
          class: "chip" + (state.classes.indexOf(c.id) >= 0 ? " on" : ""),
          text: c.name + "（" + c.size + " 人）",
          onclick() {
            const i = state.classes.indexOf(c.id);
            if (i >= 0) state.classes.splice(i, 1);
            else state.classes.push(c.id);
            badge.classList.toggle("on", i < 0);
            paintRoles();
          },
        });
        clsBox.appendChild(badge);
      });

      root.appendChild(
        ZK.ui.card({
          title: "任务基础信息",
          icon: ZK.icons.clipboard(16),
          body: [
            h("div", { class: "form-grid" }, [
              h("div", { class: "field span-full" }, [h("label", { class: "label", html: '任务标题<span class="req">*</span>' }), title]),
              field("所属课程", course),
              field("任务类型", type),
              field("对应章节", chapter),
              field("任务总分", total),
              h("div", { class: "field span-2" }, [h("label", { class: "label", text: "交付物（逗号分隔）" }), deliver]),
              field("截止日期", deadline),
              h("div", { class: "field span-full" }, [h("label", { class: "label", text: "任务说明" }), desc]),
              h("div", { class: "field span-full" }, [h("label", { class: "label", text: "面向班级（可多选）" }), clsBox]),
            ]),
          ],
        })
      );

      /* ---------- 评估角色与评分标准 ---------- */
      const rolesHost = h("div");
      const warn = h("div");

      const rolesCard = ZK.ui.card({
        title: "评估角色与相应评分标准",
        sub: "每个评估角色代表一个评阅视角，其下维度权重合计 100%；各角色权重合计 100% 后 AI 才能按标准合成总分。",
        icon: ZK.icons.users(16),
        actions: [
          h("button", { class: "btn btn-xs", text: "按各角色自动配平", onclick: () => balanceRoles() }),
          h("button", { class: "btn btn-xs btn-primary", html: ZK.icons.plus(12) + "<span>新增评估角色</span>", onclick: () => addRole() }),
        ],
        body: [warn, rolesHost],
      });

      root.appendChild(rolesCard);
      const previewHost = h("div", { class: "stack-16" });
      const previewCard = ZK.ui.card({
        title: "评阅标准预览",
        sub: "AI 评阅时将逐维度对照下面列出的可核验表述与规避表述进行打分",
        icon: ZK.icons.sparkles(16),
        actions: [h("button", { class: "btn btn-xs", text: "刷新预览", onclick: () => paintRoles() })],
        body: [previewHost],
      });
      root.appendChild(previewCard);

      /* ---------- 底部操作 ---------- */
      const err = h("div", { class: "login-err hidden" });
      root.appendChild(
        h("div", { class: "row-between mt-16 mb-20" }, [
          h("div", { class: "fs-12 muted", text: "保存后学生即可在「作品提交」中看到该任务，教师可在「AI 评阅与反馈」中批量评阅。" }),
          h("div", { class: "row", style: { gap: "8px" } }, [
            err,
            h("button", { class: "btn", text: "取消", onclick: () => go("#/tasks/list") }),
            h("button", {
              class: "btn btn-primary",
              text: editing ? "保存修改" : "创建任务并发布",
              onclick: () => save(),
            }),
          ]),
        ])
      );

      function addRole() {
        state.aiRoles.push({
          id: U.uid("role"),
          name: "新评估角色",
          persona: "请描述该评阅人身份",
          weight: U.clamp(100 - weightSum(state.aiRoles), 0, 100),
          focus: "关注点",
          dimensions: [{ name: "维度一", weight: 100, desc: "该维度的评分要点", signals: [], anti: [] }],
        });
        paintRoles();
      }

      function addDim(role) {
        role.dimensions.push({ name: "新维度", weight: 0, desc: "该维度的评分要点", signals: [], anti: [] });
        paintRoles();
      }

      function balanceRoles() {
        const n = state.aiRoles.length || 1;
        const base = Math.floor(100 / n);
        state.aiRoles.forEach((r, i) => (r.weight = i === n - 1 ? 100 - base * (n - 1) : base));
        state.aiRoles.forEach((r) => {
          const m = r.dimensions.length || 1;
          const b = Math.floor(100 / m);
          r.dimensions.forEach((d, i) => (d.weight = i === m - 1 ? 100 - b * (m - 1) : b));
        });
        paintRoles();
        ZK.toast("已按角色数自动配平权重");
      }

      function loadTemplate() {
        state.aiRoles = clone(ROLE_TEMPLATES);
        paintRoles();
        ZK.toast("已载入三角色评分标准模板");
      }

      function paintRoles() {
        U.clear(rolesHost);
        U.clear(warn);
        U.clear(previewHost);

        const sum = weightSum(state.aiRoles);
        warn.appendChild(
          h("div", { class: "advice " + (sum === 100 ? "info" : "warn") }, [
            h("b", { text: "各角色权重合计 " + sum + "%" }),
            h("div", { class: "fs-12 muted mt-4", text: sum === 100 ? "权重配置正确，AI 可据此合成总分。" : "权重合计必须等于 100% 才能通过校验，可点击「按各角色自动配平」快速处理。" }),
          ])
        );

        state.aiRoles.forEach((role, ri) => {
          const dimSum = U.sum(role.dimensions.map((d) => Number(d.weight) || 0));
          const nameIn = h("input", { class: "input", value: role.name, oninput: (e) => (role.name = e.target.value) });
          const personaIn = h("input", { class: "input", value: role.persona, oninput: (e) => (role.persona = e.target.value) });
          const focusIn = h("input", { class: "input", value: role.focus, oninput: (e) => (role.focus = e.target.value) });
          const weightIn = h("input", {
            class: "input",
            type: "number",
            value: String(role.weight),
            oninput(e) {
              role.weight = Number(e.target.value) || 0;
              paintRoles();
            },
          });

          const dimRows = h("div", { class: "stack-12" });
          role.dimensions.forEach((dim, di) => {
            dimRows.appendChild(
              h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "12px" } }, [
                h("div", { class: "form-grid", style: { "margin-bottom": "10px" } }, [
                  h("div", { class: "field" }, [h("label", { class: "label", text: "维度名称" }), h("input", { class: "input", value: dim.name, oninput: (e) => (dim.name = e.target.value) })]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "维度权重 %" }), h("input", { class: "input", type: "number", value: String(dim.weight), oninput: (e) => { dim.weight = Number(e.target.value) || 0; paintRoles(); } })]),
                  h("div", { class: "field span-2" }, [h("label", { class: "label", text: "评分要点说明" }), h("input", { class: "input", value: dim.desc, oninput: (e) => (dim.desc = e.target.value) })]),
                  h("div", { class: "field span-2" }, [
                    h("label", { class: "label", text: "可核验表述（逗号分隔，命中即得分依据）" }),
                    h("input", { class: "input", value: (dim.signals || []).join("、"), placeholder: "例如：定义、词性、领域、例句", oninput: (e) => (dim.signals = splitList(e.target.value)) }),
                  ]),
                  h("div", { class: "field span-2" }, [
                    h("label", { class: "label", text: "规避表述（逗号分隔，出现即扣分）" }),
                    h("input", { class: "input", value: (dim.anti || []).join("、"), placeholder: "例如：加强沟通、增进理解", oninput: (e) => (dim.anti = splitList(e.target.value)) }),
                  ]),
                ]),
                h("div", { class: "row-between" }, [
                  h("span", { class: "fs-11 faint", text: "维度 " + (di + 1) }),
                  h("button", {
                    class: "btn btn-xs btn-danger",
                    text: "删除维度",
                    onclick() {
                      role.dimensions.splice(di, 1);
                      paintRoles();
                    },
                  }),
                ]),
              ])
            );
          });

          rolesHost.appendChild(
            ZK.ui.card({
              class: "mb-12",
              title: role.name || "未命名角色",
              sub: "关注 " + (role.focus || "—") + " · 维度权重合计 " + dimSum + "%",
              icon: ZK.icons.user(16),
              actions: [
                dimSum === 100 ? ZK.ui.badge("维度配平", "emerald") : ZK.ui.badge("维度合计 " + dimSum + "%", "amber"),
                ZK.ui.badge("角色权重 " + role.weight + "%", "blue"),
                h("button", {
                  class: "btn btn-xs btn-danger",
                  text: "删除角色",
                  onclick() {
                    state.aiRoles.splice(ri, 1);
                    paintRoles();
                  },
                }),
              ],
              body: [
                h("div", { class: "form-grid mb-12" }, [field("角色名称", nameIn), field("角色权重 %", weightIn), h("div", { class: "field span-2" }, [h("label", { class: "label", text: "角色身份描述" }), personaIn]), h("div", { class: "field span-full" }, [h("label", { class: "label", text: "关注重点" }), focusIn])]),
                h("div", { class: "sb-group-title", text: "评分维度" }),
                dimRows,
                h("button", { class: "btn btn-xs mt-12", html: ZK.icons.plus(12) + "<span>新增评分维度</span>", onclick: () => addDim(role) }),
              ],
            })
          );
        });

        /* 预览 */
        previewHost.appendChild(
          h("div", { class: "grid grid-3 mb-16" }, [
            statBox("评估角色", state.aiRoles.length),
            statBox("评分维度合计", U.sum(state.aiRoles.map((r) => r.dimensions.length))),
            statBox("角色权重合计", weightSum(state.aiRoles) + "%", weightSum(state.aiRoles) === 100 ? "var(--accent-bright)" : "var(--warn-bright)"),
          ])
        );
        state.aiRoles.forEach((role) => {
          previewHost.appendChild(
            h("div", { class: "mb-12" }, [
              h("div", { class: "row-between mb-8" }, [
                h("b", { class: "fs-13", text: role.name + "（" + role.weight + "%）" }),
                h("span", { class: "fs-11 faint", text: role.persona }),
              ]),
              ZK.ui.scoreScale(role.dimensions.map((d) => ({ name: d.name, score: d.weight, weight: 100 }))),
              h("div", { class: "fs-11 faint mt-4", text: role.dimensions.map((d) => d.name + " " + d.weight + "%").join("　｜　") }),
            ])
          );
        });

        /* 综合评分标准预览：按角色权重换算成任务分 */
        const totalScore = Number(total.value) || 100;
        previewHost.appendChild(
          ZK.ui.card({
            title: "总分构成（按任务总分 " + totalScore + " 换算）",
            body: [
              ZK.ui.bars({
                stacked: false,
                data: state.aiRoles.map((r) => ({
                  label: U.truncate(r.name, 6),
                  value: r.weight,
                  tone: r.weight >= 45 ? "emerald" : r.weight >= 30 ? "blue" : "violet",
                  display: U.round((r.weight / 100) * totalScore, 1),
                })),
                max: 100,
              }),
              h("div", { class: "fs-11 faint mt-8", text: "柱高表示角色权重占比，柱顶数字为该角色折算后的满分数值。" }),
            ],
          })
        );
      }

      function splitList(s) {
        return String(s || "").split(/[,，、]/).map((x) => x.trim()).filter(Boolean);
      }

      function save() {
        const fail = (t) => {
          err.textContent = t;
          err.classList.remove("hidden");
          ZK.toast(t, "danger");
        };
        err.classList.add("hidden");
        if (!title.value.trim()) return fail("请填写任务标题");
        if (!desc.value.trim()) return fail("请填写任务说明");
        if (!state.classes.length) return fail("请至少选择一个面向班级");
        if (!state.aiRoles.length) return fail("请至少配置一个评估角色");
        const sum = weightSum(state.aiRoles);
        if (sum !== 100) return fail("各评估角色权重合计须为 100%，当前为 " + sum + "%");
        const badRole = state.aiRoles.find((r) => U.sum(r.dimensions.map((d) => Number(d.weight) || 0)) !== 100);
        if (badRole) return fail("角色「" + badRole.name + "」的维度权重合计须为 100%");
        if (state.aiRoles.some((r) => !r.dimensions.length)) return fail("每个评估角色至少需要一个评分维度");

        const c = ZK.db.find("courses", course.value) || {};
        const payload = {
          title: title.value.trim(),
          courseId: course.value,
          course: c.name || "",
          type: type.value,
          chapter: Number(chapter.value) || 1,
          total: Number(total.value) || 100,
          desc: desc.value.trim(),
          deliverables: splitList(deliver.value),
          classes: state.classes.slice(),
          deadline: new Date(deadline.value + "T23:59:00").getTime(),
          aiRoles: clone(state.aiRoles),
          rubric: state.aiRoles.map((r) => ({ name: r.name, weight: r.weight, desc: r.focus })),
          ownerId: (ZK.db.currentUser() || {}).id,
          owner: (ZK.db.currentUser() || {}).name || "教师",
          status: new Date(deadline.value + "T23:59:00").getTime() > Date.now() ? "open" : "closed",
        };

        if (editing) {
          ZK.db.update("tasks", editing.id, payload);
          ZK.db.log("编辑作品型任务", "更新《" + payload.title + "》");
          ZK.toast("任务已保存");
        } else {
          const t = ZK.db.insert("tasks", Object.assign({ id: U.uid("tk"), publishAt: Date.now(), createdAt: Date.now(), allowResubmit: true, peerReview: false }, payload));
          ZK.db.log("新建作品型任务", "发布《" + payload.title + "》，含 " + state.aiRoles.length + " 个评估角色");
          ZK.toast("任务已创建并发布");
          void t;
        }
        go("#/tasks/list");
      }

      paintRoles();
    },
  };

  /* ==================================================================
     三、作品提交（图文混排）
     ================================================================== */
  P["tasks/submit"] = {
    render(root, param) {
      let taskId = param || (ZK.db.list("tasks", (t) => t.status === "open")[0] || ZK.db.list("tasks")[0] || {}).id;
      let blocks = [];
      let student = pickDefaultStudent();

      root.appendChild(
        ZK.ui.pageHead({
          title: "作品提交",
          sub: "按任务要求提交作品型成果（图文混排文档）。正文充分度、结构标记与图示数量都会进入 AI 评阅计算。",
          actions: [
            h("button", { class: "btn btn-sm", text: "返回任务列表", onclick: () => go("#/tasks/list") }),
            h("button", { class: "btn btn-sm", text: "查看我的提交", onclick: () => paintMine() }),
          ],
        })
      );

      function pickDefaultStudent() {
        const u = ZK.db.currentUser() || {};
        if (u.role === "student") {
          const l = ZK.db.list("learners").find((x) => x.name === u.name);
          if (l) return l;
        }
        return ZK.db.list("learners")[0];
      }

      const taskSel = h("select", { class: "select", style: { width: "100%" } },
        ZK.db.list("tasks").map((t) => h("option", { value: t.id, text: t.title + "（" + t.course + " · 截止 " + U.fmtDate(t.deadline) + "）", selected: t.id === taskId ? true : null }))
      );
      const stuSel = h("select", { class: "select", style: { width: "100%" } },
        ZK.db.list("learners").slice(0, 60).map((l) => h("option", { value: l.id, text: l.name + " · " + l.sno + " · " + (l.cls || ""), selected: student && l.id === student.id ? true : null }))
      );
      const titleIn = h("input", { class: "input", placeholder: "作品标题，例如：采购合同第 3、5、7 条中英对照译文" });

      const taskInfo = h("div", { class: "advice info mb-16" });
      const editorHost = h("div", { class: "stack-12" });
      const mineHost = h("div");

      root.appendChild(
        ZK.ui.card({
          title: "提交信息",
          icon: ZK.icons.upload(16),
          body: [
            h("div", { class: "form-grid" }, [
              h("div", { class: "field span-2" }, [h("label", { class: "label", text: "选择任务" }), taskSel]),
              h("div", { class: "field span-2" }, [h("label", { class: "label", text: "提交人（演示用可切换）" }), stuSel]),
              h("div", { class: "field span-full" }, [h("label", { class: "label", text: "作品标题" }), titleIn]),
            ]),
            taskInfo,
          ],
        })
      );

      const fileInput = h("input", { type: "file", accept: "image/*", style: { display: "none" } });
      fileInput.addEventListener("change", (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        readImage(f, (info) => {
          blocks.push({ type: "image", name: info.name, w: info.w, h: info.h, sizeKB: info.sizeKB, thumb: info.thumb, note: "" });
          paintEditor();
          ZK.toast("已插入图片：" + info.name);
        });
        e.target.value = "";
      });

      root.appendChild(
        ZK.ui.card({
          title: "作品正文（图文混排）",
          sub: "可插入多个文字段落与图片块；支持上移、下移、删除",
          icon: ZK.icons.edit(16),
          actions: [
            h("button", { class: "btn btn-xs", html: ZK.icons.plus(12) + "<span>添加文字段落</span>", onclick: () => { blocks.push({ type: "text", text: "" }); paintEditor(); } }),
            h("button", { class: "btn btn-xs", html: ZK.icons.image(12) + "<span>插入图片</span>", onclick: () => fileInput.click() }),
            h("button", { class: "btn btn-xs", text: "载入示例作品", onclick: () => loadSample() }),
            h("button", { class: "btn btn-xs btn-danger", text: "清空", onclick: async () => {
              if (!blocks.length) return;
              const ok = await ZK.confirm({ title: "清空正文", message: "将清空当前编辑区内的全部内容块。", danger: true, okText: "清空" });
              if (!ok) return;
              blocks = [];
              paintEditor();
            } }),
          ],
          body: [fileInput, editorHost, h("div", { class: "row-between mt-16" }, [
            h("div", { class: "fs-12 muted", id: "editor-stat" }),
            h("div", { class: "row", style: { gap: "8px" } }, [
              h("button", { class: "btn", text: "存为草稿", onclick: () => ZK.toast("草稿已保存在本地（未提交）") }),
              h("button", { class: "btn btn-primary", html: ZK.icons.send(14) + "<span>提交作品</span>", onclick: () => submit() }),
            ]),
          ])],
        })
      );
      root.appendChild(ZK.ui.card({ title: "本次提交记录", sub: "同一任务可重复提交（任务允许重复提交时）", icon: ZK.icons.list(16), body: [mineHost] }));

      function paintTaskInfo() {
        const t = ZK.db.find("tasks", taskId) || {};
        U.clear(taskInfo);
        if (!t.id) {
          taskInfo.appendChild(h("div", { text: "请先选择任务。" }));
          return;
        }
        taskInfo.appendChild(
          h("div", {}, [
            h("b", { class: "fs-13", text: t.title + "（总分 " + t.total + "）" }),
            h("div", { class: "fs-12 muted mt-4", text: t.desc }),
            h("div", { class: "chip-wrap mt-8" }, [
              ZK.ui.badge(t.course + " · 第 " + t.chapter + " 章", "blue"),
              ZK.ui.badge("截止 " + U.fmtDate(t.deadline), t.status === "open" ? "emerald" : "red"),
              ZK.ui.badge("需交付：" + (t.deliverables || []).join("、"), "violet"),
            ]),
            h("div", { class: "fs-12 muted mt-8", text: "评估角色：" + (t.aiRoles || []).map((r) => r.name + "（" + r.weight + "%）").join("　") }),
          ])
        );
        if (!titleIn.value) titleIn.value = t.title + " · " + student.name + "提交稿";
      }

      function paintEditor() {
        U.clear(editorHost);
        if (!blocks.length) {
          editorHost.appendChild(ZK.ui.empty({ title: "正文还是空的", desc: "点击「添加文字段落」或「插入图片」开始撰写作品，也可以载入示例作品快速体验评阅。", icon: ZK.icons.edit(22) }));
        }
        blocks.forEach((b, i) => {
          if (b.type === "text") {
            const ta = h("textarea", { class: "textarea", style: { "min-height": "110px" }, value: b.text, placeholder: "在此撰写段落内容…", oninput: (e) => { b.text = e.target.value; updateStat(); } });
            editorHost.appendChild(
              h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "12px" } }, [
                h("div", { class: "row-between mb-8" }, [
                  h("span", { class: "fs-11 ghost", text: "文字块 " + (i + 1) + " · " + b.text.length + " 字" }),
                  blockCtrl(i),
                ]),
                ta,
              ])
            );
          } else {
            const noteIn = h("input", { class: "input", value: b.note || "", placeholder: "图示说明", oninput: (e) => (b.note = e.target.value) });
            editorHost.appendChild(
              h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "12px" } }, [
                h("div", { class: "row-between mb-8" }, [
                  h("span", { class: "fs-11 ghost", text: "图片块 " + (i + 1) + " · " + b.w + "×" + b.h + " · " + b.sizeKB + " KB" }),
                  blockCtrl(i),
                ]),
                h("div", { class: "row", style: { gap: "12px", "align-items": "flex-start" } }, [
                  b.thumb ? h("img", { src: b.thumb, style: { width: "180px", "border-radius": "var(--r-md)", border: "1px solid var(--border-default)" } }) : null,
                  h("div", { style: { flex: "1" } }, [
                    h("div", { class: "fs-12 fw-6 strong mb-4", text: b.name }),
                    noteIn,
                  ]),
                ]),
              ])
            );
          }
        });
        updateStat();
      }

      function blockCtrl(i) {
        return h("div", { class: "row", style: { gap: "4px" } }, [
          h("button", { class: "btn btn-xs", text: "↑", title: "上移", onclick() { if (i > 0) { const x = blocks.splice(i, 1)[0]; blocks.splice(i - 1, 0, x); paintEditor(); } } }),
          h("button", { class: "btn btn-xs", text: "↓", title: "下移", onclick() { if (i < blocks.length - 1) { const x = blocks.splice(i, 1)[0]; blocks.splice(i + 1, 0, x); paintEditor(); } } }),
          h("button", { class: "btn btn-xs btn-danger", text: "删除", onclick() { blocks.splice(i, 1); paintEditor(); } }),
        ]);
      }

      function updateStat() {
        const text = blocks.filter((b) => b.type === "text").map((b) => b.text).join("\n");
        const len = text.replace(/[\s\p{P}]/gu, "").length;
        const imgs = blocks.filter((b) => b.type === "image").length;
        const el = U.$("#editor-stat", root);
        if (el) el.textContent = "有效正文 " + len + " 字 · 文字块 " + (blocks.length - imgs) + " 个 · 图片 " + imgs + " 幅";
      }

      function loadSample() {
        const t = ZK.db.find("tasks", taskId) || {};
        const sample = ZK.db.list("submissions")[0];
        if (sample && t.id === sample.taskId) {
          blocks = clone(sample.blocks);
          titleIn.value = "（复现示例）" + sample.title;
        } else {
          blocks = [
            { type: "text", text: "一、任务要素分析\n依据任务要求逐项拆解要素：主体、行为、对象、条件、时限，并说明每项在译文中的对应成分。" },
            { type: "text", text: "二、作品正文\n甲方应在收到乙方书面通知之日起三十日内，向乙方支付本合同项下全部未付款项。\nParty A shall pay to Party B all amounts outstanding under this Contract within thirty (30) days from the date of receipt of the written notice from Party B." },
            { type: "image", name: "结构拆解示意.png", w: 1280, h: 720, sizeKB: 96, thumb: "", note: "以树形结构标出要素与译文成分的对应关系" },
            { type: "text", text: "三、处理依据\n1）under this Contract：合同项下关系使用介词 under，符合法律英语惯例。2）force majeure：保留源形式，不译为 irresistible force。3）术语一致性：全篇术语在各条款中保持统一，并列出对照表。" },
            { type: "text", text: "四、结论\n作品已覆盖任务要求的全部交付物，下一步将按 AI 反馈中的扣分项逐条修订。" },
          ];
        }
        paintEditor();
        ZK.toast("示例作品已载入，可直接提交");
      }

      function paintMine() {
        U.clear(mineHost);
        const mine = ZK.db.list("submissions", (s) => s.learnerId === student.id).sort((a, b) => b.submittedAt - a.submittedAt);
        if (!mine.length) {
          mineHost.appendChild(ZK.ui.empty({ title: "该同学暂无提交记录", desc: "在上方编辑区完成作品后点击提交即可。", icon: ZK.icons.upload(22) }));
          return;
        }
        mineHost.appendChild(
          ZK.ui.table({
            rows: mine,
            pageSize: 6,
            columns: [
              { key: "title", label: "作品", render: (r) => h("span", { class: "cell-strong", text: U.truncate(r.title, 34) }) },
              { key: "taskId", label: "所属任务", render: (r) => (ZK.db.find("tasks", r.taskId) || {}).title || "—" },
              { key: "submittedAt", label: "提交时间", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtDateTime(r.submittedAt) }) },
              { key: "status", label: "评阅状态", render: (r) => (r.aiReview ? ZK.ui.badge("已评阅", "emerald") : ZK.ui.badge("待评阅", "amber")) },
              { key: "score", label: "AI 得分", align: "right", sortable: true, render: (r) => (r.score === null || r.score === undefined ? h("span", { class: "faint", text: "—" }) : h("span", { class: "em fw-7", text: r.score })) },
              { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs", text: "查看评阅", onclick: () => go("#/tasks/review/" + r.taskId) }) },
            ],
          })
        );
      }

      function submit() {
        const t = ZK.db.find("tasks", taskId);
        if (!t) return ZK.toast("请先选择任务", "danger");
        const textBlocks = blocks.filter((b) => b.type === "text" && b.text.trim());
        if (!textBlocks.length) return ZK.toast("作品正文不能为空，至少填写一个文字段落", "danger");
        if (!titleIn.value.trim()) return ZK.toast("请填写作品标题", "danger");

        const rec = ZK.db.insert("submissions", {
          id: U.uid("sb"),
          taskId: t.id,
          learnerId: student.id,
          learner: student.name,
          cls: student.cls,
          title: titleIn.value.trim(),
          submittedAt: Date.now(),
          status: "pending",
          score: null,
          gradeLabel: null,
          blocks: blocks.map((b) => (b.type === "image" ? { type: "image", name: b.name, note: b.note || "", w: b.w, h: b.h, sizeKB: b.sizeKB, thumb: b.thumb } : { type: "text", text: b.text })),
          aiReview: null,
        });
        ZK.db.log("提交作品", student.name + " 提交《" + rec.title + "》至任务《" + t.title + "》");
        ZK.toast("作品已提交，可前往 AI 评阅与反馈查看结果");
        ZK.app.refresh();
        setTimeout(() => go("#/tasks/review/" + t.id), 240);
      }

      taskSel.addEventListener("change", () => {
        taskId = taskSel.value;
        titleIn.value = "";
        paintTaskInfo();
      });
      stuSel.addEventListener("change", () => {
        student = ZK.db.find("learners", stuSel.value);
        titleIn.value = "";
        paintTaskInfo();
        paintMine();
      });

      paintTaskInfo();
      paintEditor();
      paintMine();
    },
  };

  /* ==================================================================
     四、AI 评阅与反馈
     ================================================================== */
  P["tasks/review"] = {
    render(root, param) {
      const tasks = ZK.db.list("tasks");
      let taskId = param || (tasks[0] || {}).id;
      let currentSubId = null;

      root.appendChild(
        ZK.ui.pageHead({
          title: "AI 评阅与反馈",
          sub: "AI 依据任务中配置的评估角色与评分标准，对作品逐维度打分，输出亮点、问题分级（二级 / 三级 / 四级扣分）与改进建议。",
          actions: [
            h("button", { class: "btn btn-sm", text: "任务管理", onclick: () => go("#/tasks/list") }),
            h("button", {
              class: "btn btn-primary btn-sm",
              html: ZK.icons.sparkles(14) + "<span>批量评阅待评作品</span>",
              onclick: () => batchReview(),
            }),
          ],
        })
      );

      const taskSel = h("select", { class: "select", style: { width: "100%" } }, tasks.map((t) => h("option", { value: t.id, text: t.title + "（" + t.course + "）", selected: t.id === taskId ? true : null })));
      const subHost = h("div", { class: "stack-12" });
      const detailHost = h("div");
      const statHost = h("div");

      root.appendChild(h("div", { class: "grid grid-4 mb-16" }, [statHost]));
      root.appendChild(
        ZK.ui.card({
          title: "选择评阅任务",
          actions: [
            h("button", { class: "btn btn-xs", text: "查看评分标准", onclick: () => {
              const t = ZK.db.find("tasks", taskId);
              if (t) openRubricModal(t);
            } }),
          ],
          body: [taskSel],
        })
      );

      root.appendChild(h("div", { class: "grid grid-2 mt-16" }, [
        ZK.ui.card({ title: "作品提交列表", sub: "点击一条记录查看评阅结果", icon: ZK.icons.list(16), body: [subHost] }),
        ZK.ui.card({ title: "评阅结论", sub: "按评估角色分列，含维度得分与扣分项", icon: ZK.icons.sparkles(16), body: [detailHost] }),
      ]));

      function paintStat() {
        U.clear(statHost);
        const subs = ZK.db.list("submissions", (s) => s.taskId === taskId);
        const reviewed = subs.filter((s) => s.aiReview);
        const t = ZK.db.find("tasks", taskId) || {};
        const avg = reviewed.length ? U.round(U.avg(reviewed.map((s) => s.aiReview.overall)), 1) : null;
        statHost.appendChild(
          h("div", { class: "grid grid-4", style: { gap: "12px" } }, [
            ZK.ui.statCard({ label: "提交量", value: String(subs.length), target: "任务总分 " + t.total, icon: ZK.icons.upload(18), tone: "blue", progress: Math.min(100, subs.length * 20) }),
            ZK.ui.statCard({ label: "已评阅", value: String(reviewed.length), target: "待评阅 " + (subs.length - reviewed.length) + " 份", icon: ZK.icons.checkCircle(18), tone: "emerald", progress: subs.length ? (reviewed.length / subs.length) * 100 : 0 }),
            ZK.ui.statCard({ label: "AI 平均分", value: avg === null ? "—" : String(avg), target: "满分 " + t.total, icon: ZK.icons.award(18), tone: "amber", progress: avg === null ? 0 : avg }),
            ZK.ui.statCard({
              label: "高分作品（≥85）",
              value: String(reviewed.filter((s) => s.aiReview.overall >= 85).length),
              target: reviewed.length ? "占已评阅 " + U.pct((reviewed.filter((s) => s.aiReview.overall >= 85).length / reviewed.length) * 100) : "暂无数据",
              icon: ZK.icons.star(18),
              tone: "violet",
              progress: reviewed.length ? (reviewed.filter((s) => s.aiReview.overall >= 85).length / reviewed.length) * 100 : 0,
            }),
          ])
        );
      }

      function paintSubs() {
        U.clear(subHost);
        const subs = ZK.db.list("submissions", (s) => s.taskId === taskId).sort((a, b) => b.submittedAt - a.submittedAt);
        if (!subs.length) {
          subHost.appendChild(
            ZK.ui.empty({
              title: "该任务暂无作品提交",
              desc: "可前往「作品提交」以学生身份提交一份图文混排作品，再回来执行 AI 评阅。",
              icon: ZK.icons.upload(22),
              action: h("button", { class: "btn btn-primary btn-sm", text: "去提交作品", onclick: () => go("#/tasks/submit/" + taskId) }),
            })
          );
          return;
        }
        subs.forEach((s) => {
          const on = s.id === currentSubId;
          const g = s.aiReview ? U.grade(s.aiReview.overall) : null;
          subHost.appendChild(
            h(
              "div",
              { class: "list-row", style: on ? { borderColor: "var(--accent-line)", background: "var(--accent-dim)" } : null, onclick: () => show(s) },
              [
                h("div", { class: "lr-icon " + (s.aiReview ? "ic-emerald" : "ic-amber"), html: s.aiReview ? ZK.icons.checkCircle(15) : ZK.icons.clock(15) }),
                h("div", { class: "lr-main" }, [
                  h("b", { text: s.title }),
                  h("span", { text: s.learner + " · " + s.cls + " · " + U.fmtDateTime(s.submittedAt) + " · " + (s.blocks || []).length + " 个内容块" }),
                ]),
                h("div", { class: "lr-tail" },
                  s.aiReview
                    ? [
                        h("span", { class: "fs-15 fw-7 em", text: s.aiReview.overall + " 分" }),
                        ZK.ui.badge(g.label, g.cls.replace("badge-", "")),
                      ]
                    : [
                        h("button", {
                          class: "btn btn-xs btn-primary",
                          text: "AI 评阅",
                          onclick(e) {
                            e.stopPropagation();
                            doReview(s);
                          },
                        }),
                      ]
                ),
              ]
            )
          );
        });
      }

      function doReview(s) {
        const t = ZK.db.find("tasks", s.taskId);
        const res = ZK.engine.reviewSubmission(t, { blocks: s.blocks || [] });
        ZK.db.update("submissions", s.id, { status: "reviewed", score: res.overall, gradeLabel: U.grade(res.overall).label, aiReview: res });
        ZK.db.log("AI 评阅", s.learner + "《" + s.title + "》AI 评分 " + res.overall);
        ZK.toast("AI 评阅完成：" + res.overall + " 分");
        currentSubId = s.id;
        paintStat();
        paintSubs();
        renderDetail(s);
      }

      function batchReview() {
        const pending = ZK.db.list("submissions", (s) => s.taskId === taskId && !s.aiReview);
        if (!pending.length) return ZK.toast("该任务下没有待评阅作品");
        const t = ZK.db.find("tasks", taskId);
        pending.forEach((s) => {
          const res = ZK.engine.reviewSubmission(t, { blocks: s.blocks || [] });
          ZK.db.update("submissions", s.id, { status: "reviewed", score: res.overall, gradeLabel: U.grade(res.overall).label, aiReview: res });
        });
        ZK.db.log("批量 AI 评阅", "任务《" + t.title + "》评阅 " + pending.length + " 份作品");
        ZK.toast("已完成 " + pending.length + " 份作品的 AI 评阅");
        paintStat();
        paintSubs();
        if (pending.length) renderDetail(ZK.db.find("submissions", pending[0].id));
      }

      function show(s) {
        currentSubId = s.id;
        if (!s.aiReview) {
          doReview(s);
          return;
        }
        paintSubs();
        renderDetail(s);
      }

      function renderDetail(s) {
        U.clear(detailHost);
        if (!s || !s.aiReview) {
          detailHost.appendChild(ZK.ui.empty({ title: "尚未选择作品", desc: "从左侧选择一条提交记录，或点击「AI 评阅」生成评阅结论。", icon: ZK.icons.sparkles(22) }));
          return;
        }
        const r = s.aiReview;
        const g = U.grade(r.overall);

        detailHost.appendChild(
          h("div", { class: "score-hero" }, [
            h("div", { class: "score-big", text: (r.overall % 1 === 0 ? r.overall : r.overall.toFixed(1)) }),
            h("div", {}, [
              h("div", { class: "fs-15 fw-6 strong", text: s.title }),
              h("div", { class: "fs-12 muted mt-4", text: s.learner + " · " + s.cls + " · 提交于 " + U.fmtDateTime(s.submittedAt) }),
              h("div", { class: "row mt-8", style: { gap: "6px" } }, [
                ZK.ui.badge(g.label, g.cls.replace("badge-", "")),
                ZK.ui.badge("评估角色 " + (r.roles || []).length + " 个", "blue"),
                ZK.ui.badge("评分维度 " + (r.dims || []).length + " 项", "violet"),
              ]),
            ]),
          ])
        );

        detailHost.appendChild(h("div", { class: "sb-group-title", text: "各评估角色得分" }));
        detailHost.appendChild(
          ZK.ui.scoreScale((r.roles || []).map((x) => ({ name: x.roleName, score: x.score, weight: 100, role: x.weight + "%" })))
        );

        detailHost.appendChild(h("div", { class: "sb-group-title", text: "总分构成" }));
        detailHost.appendChild(
          ZK.ui.bars({
            data: (r.roles || []).map((x) => ({
              label: U.truncate(x.roleName, 6),
              value: x.score,
              display: U.round((x.score * x.weight) / 100, 1),
              tone: x.score >= 85 ? "emerald" : x.score >= 75 ? "blue" : "amber",
              tip: x.roleName + "：" + x.score + " 分 × 权重 " + x.weight + "% = 折算 " + U.round((x.score * x.weight) / 100, 1) + " 分",
            })),
            max: 100,
          })
        );

        detailHost.appendChild(h("div", { class: "sb-group-title", text: "AI 总评" }));
        detailHost.appendChild(h("div", { class: "advice info", text: r.summary }));

        detailHost.appendChild(h("div", { class: "sb-group-title", text: "维度得分明细" }));
        detailHost.appendChild(ZK.ui.table({
          rows: (r.dims || []).map((d, i) => Object.assign({ __i: i + 1 }, d)),
          pageSize: 20,
          columns: [
            { key: "__i", label: "#", align: "right" },
            { key: "role", label: "评估角色", render: (v) => ZK.ui.badge(v.role, "blue") },
            { key: "name", label: "评分维度", render: (v) => h("span", { class: "cell-strong", text: v.name }) },
            { key: "score", label: "得分", align: "right", sortable: true, render: (v) => h("span", { class: "tnum", text: v.score + "/" + v.weight }) },
            { key: "ratio", label: "达成率", sortable: true, render: (v) => ZK.ui.progressLine(v.ratio * 100, v.ratio >= 0.86 ? "emerald" : v.ratio >= 0.72 ? "blue" : v.ratio >= 0.6 ? "amber" : "red", U.pct(v.ratio * 100)) },
            { key: "matched", label: "已体现要素", render: (v) => (v.matched && v.matched.length ? h("span", { class: "fs-11 muted", text: v.matched.join("、") }) : h("span", { class: "faint", text: "—" })) },
          ],
        }));

        if ((r.highlights || []).length) {
          detailHost.appendChild(h("div", { class: "sb-group-title", text: "亮点" }));
          r.highlights.forEach((x) => detailHost.appendChild(h("div", { class: "advice", text: x })));
        }

        if ((r.issues || []).length) {
          detailHost.appendChild(h("div", { class: "sb-group-title", text: "问题与扣分（" + r.issues.length + " 项）" }));
          r.issues.forEach((x) =>
            detailHost.appendChild(
              h("div", { class: "advice " + (x.level === "二级" ? "danger" : x.level === "三级" ? "warn" : "info") }, [
                h("div", { class: "row-between mb-4" }, [
                  h("b", { text: "【" + x.level + "】" + x.role + " · " + x.dim }),
                  ZK.ui.badge("扣 " + x.deduct + " 分", x.level === "二级" ? "red" : x.level === "三级" ? "amber" : "gray"),
                ]),
                h("div", { class: "fs-12 muted", text: x.text }),
              ])
            )
          );
        }

        if ((r.advice || []).length) {
          detailHost.appendChild(h("div", { class: "sb-group-title", text: "优化建议" }));
          r.advice.forEach((x, i) =>
            detailHost.appendChild(
              h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
                h("div", { class: "fs-12 fw-6 em mb-4", text: "建议 " + (i + 1) }),
                h("div", { class: "fs-12 muted", style: { "line-height": "1.7" }, text: x }),
              ])
            )
          );
        }

        if (r.metrics) {
          detailHost.appendChild(h("div", { class: "sb-group-title", text: "文本指标（进入评阅计算的客观量）" }));
          detailHost.appendChild(
            h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
              statBox("有效正文", r.metrics.textLen + " 字"),
              statBox("图示数量", r.metrics.imageCount + " 幅"),
              statBox("结构标记", r.metrics.markers.length + " 项", r.metrics.markers.length ? "var(--accent-bright)" : "var(--warn-bright)"),
              statBox("篇幅因子 × 结构因子", r.metrics.lenFactor + " × " + r.metrics.structFactor),
            ])
          );
          detailHost.appendChild(h("div", { class: "fs-11 faint mt-8", text: "结构标记明细：" + (r.metrics.markers.join("、") || "无") }));
        }

        detailHost.appendChild(
          h("div", { class: "row mt-16", style: { gap: "8px" } }, [
            h("button", { class: "btn btn-sm", html: ZK.icons.download(13) + "<span>导出评阅报告</span>", onclick: () => exportReport(s, r) }),
            h("button", { class: "btn btn-sm", text: "重新评阅", onclick: () => doReview(ZK.db.find("submissions", s.id)) }),
            h("button", { class: "btn btn-sm", text: "查看作品原文", onclick: () => openOriginal(s) }),
          ])
        );
      }

      function statBox(label, value, color) {
        return h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
          h("div", { class: "fs-11 ghost", text: label }),
          h("div", { class: "fs-13 fw-6 strong", style: { color: color || "var(--text-primary)", "line-height": "1.7" }, text: String(value) }),
        ]);
      }

      function openOriginal(s) {
        ZK.modal({
          title: "作品原文 · " + s.title,
          sub: s.learner + " · " + s.cls + " · " + (s.blocks || []).length + " 个内容块",
          size: "lg",
          render(api) {
            const box = h("div", { class: "stack-12" });
            (s.blocks || []).forEach((b) => {
              if (b.type === "text") box.appendChild(h("div", { class: "corpus-box" }, [h("div", { class: "corpus", text: b.text })]));
              else
                box.appendChild(
                  h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "12px" } }, [
                    b.thumb ? h("img", { src: b.thumb, style: { width: "100%", "max-width": "420px", "border-radius": "var(--r-md)" } }) : null,
                    h("div", { class: "fs-12 fw-6 strong mt-8", text: b.name }),
                    h("div", { class: "fs-11 faint", text: b.note || "无图示说明" }),
                    b.w ? h("div", { class: "fs-11 ghost", text: b.w + "×" + b.h + " · " + (b.sizeKB || "—") + " KB" }) : null,
                  ])
                );
            });
            api.body.appendChild(box);
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }

      function openRubricModal(t) {
        ZK.modal({
          title: "评分标准 · " + t.title,
          sub: "评估角色权重合计 " + weightSum(t.aiRoles) + "%",
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-12" }, (t.aiRoles || []).map((r) =>
                ZK.ui.card({
                  title: r.name + "（" + r.weight + "%）",
                  sub: r.persona + " · 关注 " + r.focus,
                  body: [ZK.ui.kv((r.dimensions || []).map((d) => [d.name + " " + d.weight + "%", d.desc]))],
                })
              ))
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }

      function exportReport(s, r) {
        const lines = [
          "AI 作品评阅报告",
          "作品标题：" + s.title,
          "提交人：" + s.learner + "（" + s.cls + "）",
          "提交时间：" + U.fmtDateTime(s.submittedAt),
          "综合得分：" + r.overall + "（" + U.grade(r.overall).label + "）",
          "",
          "各评估角色得分：",
        ].concat((r.roles || []).map((x) => "- " + x.roleName + "：" + x.score + " 分（权重 " + x.weight + "%）"));
        lines.push("", "维度明细：");
        (r.dims || []).forEach((d) => lines.push("- [" + d.role + "·" + d.name + "] " + d.score + "/" + d.weight));
        lines.push("", "AI 总评：", r.summary, "", "亮点：");
        (r.highlights || []).forEach((x) => lines.push("- " + x));
        lines.push("", "问题与扣分：");
        (r.issues || []).forEach((x) => lines.push("- 【" + x.level + "】" + x.role + "·" + x.dim + "（扣 " + x.deduct + " 分）：" + x.text));
        lines.push("", "优化建议：");
        (r.advice || []).forEach((x) => lines.push("- " + x));
        U.download("AI评阅报告-" + s.learner + "-" + s.title.replace(/[\\/:*?"<>|]/g, "_") + ".txt", lines.join("\n"));
        ZK.db.log("导出评阅报告", "导出《" + s.title + "》评阅报告");
        ZK.toast("评阅报告已导出");
      }

      taskSel.addEventListener("change", () => {
        taskId = taskSel.value;
        currentSubId = null;
        paintStat();
        paintSubs();
        renderDetail(null);
      });

      paintStat();
      paintSubs();
      const first = ZK.db.list("submissions", (s) => s.taskId === taskId && s.aiReview)[0];
      if (first) {
        currentSubId = first.id;
        renderDetail(first);
      } else {
        renderDetail(null);
      }
    },
  };
})();
