/* ==========================================================================
   页面 · AI 学情分析
   （班级知识分析 / 知识点详情 / 个性化学习路径 / AI学情画像）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  const PATH_STORE = "pathPlans";
  const PROFILE_STORE = "profiles";

  function masteryTone(v) {
    return v >= 85 ? "emerald" : v >= 75 ? "blue" : v >= 65 ? "amber" : "red";
  }

  function miniStat(label, value, color) {
    return h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
      h("div", { class: "fs-11 ghost", text: label }),
      h("div", { class: "fs-15 fw-7 strong", style: { color: color || "var(--text-primary)" }, text: String(value) }),
    ]);
  }

  function field(label, node) {
    return h("div", { class: "field" }, [h("label", { class: "label", text: label }), node]);
  }

  function classOptions(selected) {
    return ZK.db.list("classes").map((c) => h("option", { value: c.id, text: c.name + "（" + c.size + " 人）", selected: c.id === selected ? true : null }));
  }

  /* ==================================================================
     一、班级知识分析
     ================================================================== */
  P["analytics/class"] = {
    render(root, param) {
      let classId = param || (ZK.db.list("classes")[0] || {}).id;

      root.appendChild(
        ZK.ui.pageHead({
          title: "班级整体知识点分析",
          sub: "按知识点智能呈现班级整体学习数据：关联学习资源数、平均完成率、平均掌握率、课程资料数、课程资料人均阅读，并自动识别薄弱与优势知识点。",
          actions: [
            h("button", { class: "btn btn-sm", text: "AI 生成班级学情画像", onclick: () => go("#/analytics/profile/" + classId) }),
            h("button", { class: "btn btn-sm", text: "导出分析报表", onclick: () => exportClass() }),
          ],
        })
      );

      const sel = h("select", { class: "select", style: { width: "280px" } }, classOptions(classId));
      root.appendChild(h("div", { class: "row mb-16", style: { gap: "12px" } }, [sel, h("button", { class: "btn btn-sm", text: "重新分析", onclick: () => paint() })]));

      const host = h("div", { class: "stack-16" });
      root.appendChild(host);

      sel.addEventListener("change", () => {
        classId = sel.value;
        location.hash = "#/analytics/class/" + classId;
      });

      function paint() {
        U.clear(host);
        const a = ZK.engine.classAnalytics(classId);
        const cls = a.cls || {};
        if (!a.kpStats.length) {
          host.appendChild(ZK.ui.empty({ title: "该班级暂无学习记录", desc: "请先补充学习行为数据。", icon: ZK.icons.chart(22) }));
          return;
        }

        host.appendChild(
          h("div", { class: "grid grid-4" }, [
            ZK.ui.statCard({ label: "班级平均完成率", value: U.pct(a.overall.avgCompletion), target: cls.name + " · " + a.overall.learners + " 人", icon: ZK.icons.checkCircle(18), tone: "emerald", progress: a.overall.avgCompletion }),
            ZK.ui.statCard({ label: "班级平均掌握率", value: U.pct(a.overall.avgMastery), target: "按 12 个知识点统计", icon: ZK.icons.target(18), tone: "blue", progress: a.overall.avgMastery }),
            ZK.ui.statCard({ label: "课程资料人均阅读", value: a.overall.avgReadPerCapita + " 项", target: "课程资料数合计 " + U.sum(a.kpStats.map((k) => k.materialCount)) + " 项", icon: ZK.icons.book(18), tone: "violet", progress: Math.min(100, a.overall.avgReadPerCapita * 25) }),
            ZK.ui.statCard({ label: "学习记录条数", value: U.num(a.overall.totalRecords), target: "每生每知识点一条", icon: ZK.icons.database(18), tone: "amber", progress: 70 }),
          ])
        );

        /* AI 结论 */
        const lowCount = a.kpStats.filter((k) => k.avgMastery < 70).length;
        host.appendChild(
          ZK.ui.card({
            title: "AI 学情结论",
            sub: "基于班级知识点数据自动生成，可直接引用到教学小结",
            icon: ZK.icons.sparkles(16),
            actions: [ZK.ui.badge("生成于 " + U.fmtDateTime(Date.now()), "gray")],
            body: [
              h("div", { class: "advice info" }, [
                h("b", { text: "整体判断" }),
                h("div", { class: "fs-12 muted mt-4", text: cls.name + " 知识点平均完成率 " + U.pct(a.overall.avgCompletion) + "，平均掌握率 " + U.pct(a.overall.avgMastery) + "，课程资料人均阅读 " + a.overall.avgReadPerCapita + " 项。掌握率低于 70% 的知识点 " + lowCount + " 个，掌握率高于 82% 的知识点 " + a.kpStats.filter((k) => k.avgMastery >= 82).length + " 个。" }),
              ]),
              h("div", { class: "advice warn" }, [
                h("b", { text: "薄弱知识点（需优先讲解）" }),
                h("div", { class: "fs-12 muted mt-4", text: a.weakKps.map((k) => k.name + "（掌握率 " + U.pct(k.avgMastery) + "，低掌握 " + k.lowCount + " 人）").join("；") }),
              ]),
              h("div", { class: "advice" }, [
                h("b", { text: "优势知识点（可作课堂案例）" }),
                h("div", { class: "fs-12 muted mt-4", text: a.strongKps.map((k) => k.name + "（掌握率 " + U.pct(k.avgMastery) + "，高掌握 " + k.highCount + " 人）").join("；") }),
              ]),
            ],
          })
        );

        /* 图表 */
        host.appendChild(
          h("div", { class: "grid grid-2" }, [
            ZK.ui.card({
              title: "各知识点掌握率对比",
              sub: "柱高为平均掌握率，低于 70% 标红",
              icon: ZK.icons.bars(16),
              body: [
                ZK.ui.bars({
                  data: a.kpStats.map((k) => ({
                    label: "第" + k.chapter + "章",
                    value: k.avgMastery,
                    display: U.round(k.avgMastery),
                    tone: k.avgMastery >= 82 ? "emerald" : k.avgMastery >= 70 ? "blue" : "red",
                    tip: k.name + "：掌握率 " + k.avgMastery + "%　完成率 " + k.avgCompletion + "%",
                  })),
                  max: 100,
                }),
                h("div", { class: "fs-11 faint mt-8", text: "鼠标悬停可查看具体知识点名称与完成率。" }),
              ],
            }),
            ZK.ui.card({
              title: "掌握度分布",
              sub: "以学生 × 知识点记录为单位统计",
              icon: ZK.icons.chart(16),
              body: [
                ZK.ui.bars({
                  data: a.distribution.map((d) => ({
                    label: d.label,
                    value: d.count,
                    tone: d.label === "90-100" ? "emerald" : d.label === "80-89" ? "blue" : d.label === "70-79" ? "violet" : d.label === "60-69" ? "amber" : "red",
                    tip: "掌握度 " + d.label + "：" + d.count + " 条记录",
                  })),
                }),
                h("div", { class: "fs-11 faint mt-8", text: "共 " + U.num(a.overall.totalRecords) + " 条学习记录。" }),
              ],
            }),
          ])
        );

        host.appendChild(
          ZK.ui.card({
            title: "章节掌握率与完成率趋势",
            sub: "按章节聚合，观察章节间的能力落差",
            icon: ZK.icons.trendingUp(16),
            body: [
              ZK.ui.lineChart({
                labels: a.chapterTrend.map((t) => t.label),
                series: [
                  { name: "平均掌握率", color: "#60a5fa", data: a.chapterTrend.map((t) => t.mastery) },
                  { name: "平均完成率", color: "#60a5fa", data: a.chapterTrend.map((t) => t.completion) },
                ],
                max: 100,
                min: 0,
              }),
            ],
          })
        );

        /* 知识点明细表 */
        const cols = [
          { key: "name", label: "知识点", sortable: true, render: (r) => h("div", {}, [h("div", { class: "cell-strong", text: r.name }), h("div", { class: "fs-11 faint", text: "第 " + r.chapter + " 章 · 难度 " + "★".repeat(r.difficulty) })]) },
          { key: "resourceCount", label: "关联学习资源数", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", text: r.resourceCount + " 项" }) },
          { key: "avgCompletion", label: "平均完成率", sortable: true, render: (r) => ZK.ui.progressLine(r.avgCompletion, masteryTone(r.avgCompletion), U.pct(r.avgCompletion)) },
          { key: "avgMastery", label: "平均掌握率", sortable: true, render: (r) => ZK.ui.progressLine(r.avgMastery, masteryTone(r.avgMastery), U.pct(r.avgMastery)) },
          { key: "materialCount", label: "课程资料数", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", text: r.materialCount + " 项" }) },
          { key: "readPerCapita", label: "资料人均阅读", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", text: r.readPerCapita + " 项" }) },
          { key: "readRate", label: "资料阅读率", sortable: true, render: (r) => ZK.ui.progressLine(r.readRate, r.readRate >= 70 ? "emerald" : r.readRate >= 50 ? "amber" : "red", U.pct(r.readRate)) },
          { key: "learners", label: "覆盖学生", align: "right", sortable: true, render: (r) => r.learners + " 人" },
          { key: "lowCount", label: "低掌握(<60)", align: "right", sortable: true, render: (r) => h("span", { class: "risk-high", text: r.lowCount }) },
          { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs", text: "知识点详情", onclick: () => go("#/analytics/kp/" + r.kpId + "?cls=" + classId) }) },
        ];

        host.appendChild(
          ZK.ui.card({
            title: "知识点数据明细",
            sub: "点击表头可排序，支持搜索；右侧可直接下钻到知识点详情",
            icon: ZK.icons.bars(16),
            body: [ZK.ui.table({ rows: a.kpStats, pageSize: 12, sortKey: "avgMastery", sortDir: "asc", searchKeys: ["name"], columns: cols })],
          })
        );
      }

      function exportClass() {
        const a = ZK.engine.classAnalytics(classId);
        const rows = [["知识点", "章节", "难度", "关联学习资源数", "平均完成率(%)", "平均掌握率(%)", "课程资料数", "资料人均阅读", "资料阅读率(%)", "覆盖学生", "低掌握人数", "高掌握人数", "平均学习时长(分)", "平均练习次数"]];
        a.kpStats.forEach((k) =>
          rows.push([k.name, "第 " + k.chapter + " 章", k.difficulty, k.resourceCount, k.avgCompletion, k.avgMastery, k.materialCount, k.readPerCapita, k.readRate, k.learners, k.lowCount, k.highCount, k.avgDuration, k.attemptAvg])
        );
        U.downloadCsv("班级知识点分析-" + (a.cls ? a.cls.name : "") + ".csv", rows);
        ZK.db.log("导出班级学情", "导出 " + (a.cls ? a.cls.name : "") + " 的知识点分析数据");
        ZK.toast("班级分析报表已导出");
      }

      paint();
    },
  };

  /* ==================================================================
     二、知识点详情
     ================================================================== */
  P["analytics/kp"] = {
    render(root, param) {
      const rawParam = String(param || "");
      const kpId = rawParam.split("?")[0] || "kp_01";
      const clsFromHash = (rawParam.split("?")[1] || "").replace("cls=", "") || (ZK.db.list("classes")[0] || {}).id;
      let classId = clsFromHash;
      let kp = ZK.db.find("knowledgePoints", kpId) || ZK.db.list("knowledgePoints")[0];

      root.appendChild(
        ZK.ui.pageHead({
          title: "知识点详情 · " + kp.name,
          sub: "该知识点的关联学习资源数、平均完成率、平均掌握率、课程资料数与课程资料人均阅读情况，以及逐生掌握明细。",
          actions: [
            h("button", { class: "btn btn-sm", text: "返回班级分析", onclick: () => go("#/analytics/class/" + classId) }),
            h("button", { class: "btn btn-sm", text: "查看图谱位置", onclick: () => go("#/graph/map") }),
          ],
        })
      );

      const kpSel = h("select", { class: "select", style: { width: "300px" } },
        ZK.db.list("knowledgePoints").map((k) => h("option", { value: k.id, text: "第 " + k.chapter + " 章 · " + k.name, selected: k.id === kp.id ? true : null }))
      );
      const clsSel = h("select", { class: "select", style: { width: "240px" } }, classOptions(classId));
      root.appendChild(h("div", { class: "row mb-16", style: { gap: "12px" } }, [kpSel, clsSel]));

      const host = h("div", { class: "stack-16" });
      root.appendChild(host);

      kpSel.addEventListener("change", () => go("#/analytics/kp/" + kpSel.value + "?cls=" + classId));
      clsSel.addEventListener("change", () => {
        classId = clsSel.value;
        location.hash = "#/analytics/kp/" + kp.id + "?cls=" + classId;
      });

      function paint() {
        U.clear(host);
        const a = ZK.engine.classAnalytics(classId);
        const stat = a.kpStats.find((k) => k.kpId === kp.id) || {};

        host.appendChild(
          h("div", { class: "grid grid-5" }, [
            ZK.ui.statCard({ label: "关联学习资源数", value: String(stat.resourceCount || 0), target: "含视频、讲义、习题", icon: ZK.icons.layers(18), tone: "blue", progress: Math.min(100, (stat.resourceCount || 0) * 6) }),
            ZK.ui.statCard({ label: "平均完成率", value: U.pct(stat.avgCompletion || 0), target: "班级 " + (a.cls ? a.cls.name : ""), icon: ZK.icons.checkCircle(18), tone: "emerald", progress: stat.avgCompletion || 0 }),
            ZK.ui.statCard({ label: "平均掌握率", value: U.pct(stat.avgMastery || 0), target: "低掌握 " + (stat.lowCount || 0) + " 人 / 高掌握 " + (stat.highCount || 0) + " 人", icon: ZK.icons.target(18), tone: "amber", progress: stat.avgMastery || 0 }),
            ZK.ui.statCard({ label: "课程资料数", value: String(stat.materialCount || 0) + " 项", target: "配套阅读材料", icon: ZK.icons.book(18), tone: "violet", progress: 60 }),
            ZK.ui.statCard({ label: "课程资料人均阅读", value: (stat.readPerCapita || 0) + " 项", target: "阅读率 " + U.pct(stat.readRate || 0), icon: ZK.icons.eye(18), tone: "cyan", progress: stat.readRate || 0 }),
          ])
        );

        host.appendChild(
          ZK.ui.card({
            title: "知识点画像",
            icon: ZK.icons.target(16),
            actions: [ZK.ui.badge("难度 " + "★".repeat(kp.difficulty), "amber"), ZK.ui.badge("权重 " + kp.weight, "blue")],
            body: [
              ZK.ui.kv([
                ["所属课程", kp.course],
                ["所在章节", "第 " + kp.chapter + " 章"],
                ["核心概念", kp.concepts.join("、")],
                ["推荐图书", ZK.db.list("libraryBooks", (b) => (kp.books || []).indexOf(b.id) >= 0).map((b) => b.title).join("、") || "—"],
                ["平均学习时长", (stat.avgDuration || 0) + " 分钟／生"],
                ["平均练习次数", (stat.attemptAvg || 0) + " 次／生"],
              ]),
              h("div", { class: "row mt-12", style: { gap: "8px" } }, [
                h("button", { class: "btn btn-sm", text: "在知识库中检索该知识点", onclick: () => go("#/kb/query") }),
                h("button", { class: "btn btn-sm", text: "查看该知识点的门户数据配置", onclick: () => go("#/portal/modules") }),
              ]),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-2" }, [
            ZK.ui.card({
              title: "掌握率分布",
              sub: "本班学生在知识点上的掌握情况",
              icon: ZK.icons.bars(16),
              body: [
                ZK.ui.bars({
                  stacked: true,
                  data: [
                    { label: "≥85 高掌握", value: stat.highCount || 0, tone: "emerald" },
                    { label: "70-84 达标", value: Math.max(0, (stat.learners || 0) - (stat.highCount || 0) - (stat.lowCount || 0)), tone: "blue" },
                    { label: "<60 低掌握", value: stat.lowCount || 0, tone: "red" },
                  ],
                  tip: "",
                }),
                h("div", { class: "fs-11 faint mt-8", text: "覆盖学生 " + (stat.learners || 0) + " 人。" }),
              ],
            }),
            ZK.ui.card({
              title: "关联资源与资料阅读",
              sub: "资源数、资料数与人均阅读的关系",
              icon: ZK.icons.layers(16),
              body: [
                ZK.ui.bars({
                  data: [
                    { label: "关联资源数", value: stat.resourceCount || 0, tone: "blue", tip: "关联学习资源 " + (stat.resourceCount || 0) + " 项" },
                    { label: "课程资料数", value: stat.materialCount || 0, tone: "violet", tip: "课程资料 " + (stat.materialCount || 0) + " 项" },
                    { label: "人均阅读", value: Math.round((stat.readPerCapita || 0) * 10) / 10, tone: "emerald", display: stat.readPerCapita, tip: "人均阅读 " + stat.readPerCapita + " 项" },
                    { label: "阅读率(%)", value: stat.readRate || 0, tone: "amber", tip: "资料阅读率 " + U.pct(stat.readRate || 0) },
                  ],
                }),
              ],
            }),
          ])
        );

        /* 学生明细 */
        const recs = ZK.db.list("learningRecords", (r) => r.kpId === kp.id && r.classId === classId);
        const rows = recs
          .map((r) => {
            const l = ZK.db.find("learners", r.learnerId) || {};
            return {
              id: r.learnerId,
              name: l.name || r.learnerId,
              sno: l.sno || "—",
              level: l.level || "—",
              completion: r.completion,
              mastery: r.mastery,
              materialsRead: r.materialsRead,
              materialTotal: r.materialTotal,
              duration: r.duration,
              attempts: r.attempts,
            };
          })
          .sort((a, b) => a.mastery - b.mastery);

        host.appendChild(
          ZK.ui.card({
            title: "逐生掌握明细（按掌握率升序）",
            sub: "低掌握学生排在最前，便于课堂重点关注",
            icon: ZK.icons.users(16),
            actions: [
              h("button", {
                class: "btn btn-xs",
                text: "为低掌握学生生成学习路径",
                onclick: () => {
                  const low = ZK.db.list("learners", (l) => l.classId === classId).filter((l) => {
                    const r = ZK.db.list("learningRecords", (x) => x.learnerId === l.id && x.kpId === kp.id)[0];
                    return r && r.mastery < 65;
                  });
                  if (!low.length) return ZK.toast("本班该知识点暂无掌握率低于 65% 的学生");
                  ZK.toast("已定位 " + low.length + " 名低掌握学生，可在「个性化学习路径」中查看");
                  go("#/analytics/path/" + low[0].id);
                },
              }),
            ],
            body: [
              ZK.ui.table({
                rows: rows,
                pageSize: 10,
                searchKeys: ["name", "sno"],
                sortKey: "mastery",
                sortDir: "asc",
                columns: [
                  { key: "name", label: "学生", sortable: true, render: (r) => h("div", {}, [h("div", { class: "cell-strong", text: r.name }), h("div", { class: "fs-11 faint", text: r.sno })]) },
                  { key: "level", label: "分层", render: (r) => ZK.ui.badge(r.level + " 层", r.level === "A" ? "emerald" : r.level === "B" ? "blue" : "amber") },
                  { key: "completion", label: "完成率", sortable: true, render: (r) => ZK.ui.progressLine(r.completion, masteryTone(r.completion), U.pct(r.completion)) },
                  { key: "mastery", label: "掌握率", sortable: true, render: (r) => ZK.ui.progressLine(r.mastery, masteryTone(r.mastery), U.pct(r.mastery)) },
                  { key: "materialsRead", label: "资料阅读", align: "right", sortable: true, render: (r) => r.materialsRead + " / " + r.materialTotal },
                  { key: "duration", label: "学习时长", align: "right", sortable: true, render: (r) => r.duration + " 分" },
                  { key: "attempts", label: "练习次数", align: "right", sortable: true, render: (r) => r.attempts + " 次" },
                  { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs", text: "学习路径", onclick: () => go("#/analytics/path/" + r.id) }) },
                ],
              }),
            ],
          })
        );
      }

      paint();
    },
  };

  /* ==================================================================
     三、个性化学习路径
     ================================================================== */
  P["analytics/path"] = {
    render(root, param) {
      let learnerId = param || (ZK.db.list("learners")[0] || {}).id;

      root.appendChild(
        ZK.ui.pageHead({
          title: "个性化学习路径",
          sub: "以学生最薄弱知识点为起点，结合前置知识关系自动排序，生成分阶段、带任务清单与预计时长的学习路径。",
          actions: [
            h("button", { class: "btn btn-sm", text: "查看学情画像", onclick: () => go("#/analytics/profile/" + learnerId) }),
            h("button", { class: "btn btn-sm", text: "导出路径方案", onclick: () => exportPath() }),
          ],
        })
      );

      const clsSel = h("select", { class: "select", style: { width: "240px" } }, classOptions((ZK.db.find("learners", learnerId) || {}).classId));
      const stuSel = h("select", { class: "select", style: { width: "260px" } });
      root.appendChild(h("div", { class: "row mb-16", style: { gap: "12px" } }, [clsSel, stuSel]));

      const host = h("div", { class: "stack-16" });
      root.appendChild(host);

      function fillStudents() {
        const list = ZK.db.list("learners", (l) => l.classId === clsSel.value);
        U.clear(stuSel);
        list.forEach((l) => stuSel.appendChild(h("option", { value: l.id, text: l.name + " · " + l.sno + " · " + l.level + " 层", selected: l.id === learnerId ? true : null })));
        if (!list.some((l) => l.id === learnerId) && list.length) learnerId = list[0].id;
      }

      clsSel.addEventListener("change", () => {
        fillStudents();
        paint();
      });
      stuSel.addEventListener("change", () => {
        learnerId = stuSel.value;
        paint();
      });

      function paint() {
        U.clear(host);
        const p = ZK.engine.learningPath(learnerId);
        if (!p) {
          host.appendChild(ZK.ui.empty({ title: "未找到该学生", desc: "请重新选择。", icon: ZK.icons.user(22) }));
          return;
        }
        const prof = ZK.engine.studentProfile(learnerId);

        host.appendChild(
          h("div", { class: "grid grid-4" }, [
            ZK.ui.statCard({ label: "综合掌握率", value: U.pct(prof.mastery), target: (p.cls ? p.cls.name : "") + " 平均 " + U.pct(prof.clsMastery), icon: ZK.icons.target(18), tone: "blue", progress: prof.mastery }),
            ZK.ui.statCard({ label: "班级排名", value: "第 " + prof.rank + " / " + prof.classSize, target: "按综合掌握率排序", icon: ZK.icons.award(18), tone: "amber", progress: ((prof.classSize - prof.rank + 1) / prof.classSize) * 100 }),
            ZK.ui.statCard({ label: "路径步骤", value: String(p.steps.length), target: "共 " + p.steps.reduce((s, x) => s + x.estMinutes, 0) + " 分钟", icon: ZK.icons.route(18), tone: "violet", progress: Math.min(100, p.steps.length * 16) }),
            ZK.ui.statCard({ label: "最大薄弱缺口", value: p.steps[0] ? p.steps[0].gap + " 分" : "—", target: p.steps[0] ? p.steps[0].name : "—", icon: ZK.icons.trendingDown(18), tone: "red", progress: p.steps[0] ? p.steps[0].gap : 0 }),
          ])
        );

        host.appendChild(
          ZK.ui.card({
            title: "AI 路径说明",
            icon: ZK.icons.sparkles(16),
            actions: [
              h("button", {
                class: "btn btn-xs btn-primary",
                text: "保存该路径方案",
                onclick: () => {
                  ZK.db.insert(PATH_STORE, {
                    id: U.uid("pp"),
                    learnerId: learnerId,
                    learner: p.learner.name,
                    cls: p.cls ? p.cls.name : "",
                    steps: p.steps.map((s) => ({ name: s.name, phase: s.phase, estMinutes: s.estMinutes })),
                    summary: p.summary,
                    at: Date.now(),
                    operator: (ZK.db.currentUser() || {}).name || "系统",
                  });
                  ZK.db.log("保存学习路径", "为 " + p.learner.name + " 生成 " + p.steps.length + " 步学习路径");
                  ZK.toast("路径方案已保存并推送至学生端");
                },
              }),
            ],
            body: [h("div", { class: "advice info", text: p.summary })],
          })
        );

        /* 路径时间线 */
        const phases = Array.from(new Set(p.steps.map((s) => s.phase)));
        phases.forEach((ph) => {
          const steps = p.steps.filter((s) => s.phase === ph);
          host.appendChild(
            ZK.ui.card({
              title: ph,
              sub: steps.length + " 个知识点 · 预计 " + steps.reduce((s, x) => s + x.estMinutes, 0) + " 分钟",
              icon: ZK.icons.route(16),
              body: [
                h("div", { class: "timeline" }, steps.map((s) =>
                  h("div", { class: "tl-item on" }, [
                    h("div", { class: "tl-time", text: "步骤 " + s.step + " · 第 " + s.chapter + " 章 · 难度 " + "★".repeat(s.difficulty) }),
                    h("div", { class: "tl-text" }, [
                      h("div", { class: "row-between mb-8" }, [
                        h("b", { class: "fs-15", text: s.name }),
                        h("div", { class: "row", style: { gap: "6px" } }, [
                          ZK.ui.badge("掌握率 " + U.pct(s.mastery), masteryTone(s.mastery)),
                          ZK.ui.badge("缺口 " + s.gap + " 分", "red"),
                          ZK.ui.badge("预计 " + s.estMinutes + " 分钟", "gray"),
                        ]),
                      ]),
                      h("div", { class: "fs-12 muted mb-8", text: s.reason }),
                      ZK.ui.progressLine(s.completion, "blue", "完成率 " + U.pct(s.completion)),
                      h("div", { class: "sb-group-title", text: "任务清单" }),
                      h("div", { class: "stack-8" }, s.tasks.map((t, i) =>
                        h("div", { class: "row", style: { gap: "8px", "align-items": "flex-start" } }, [
                          h("span", { class: "pill-num", text: String(i + 1) }),
                          h("span", { class: "fs-12 muted", style: { "line-height": "1.7" }, text: t }),
                        ])
                      )),
                      h("div", { class: "row mt-12", style: { gap: "6px" } }, [
                        h("button", { class: "btn btn-xs", text: "查看该知识点详情", onclick: () => go("#/analytics/kp/" + s.kpId + "?cls=" + (ZK.db.find("learners", learnerId) || {}).classId) }),
                        h("button", { class: "btn btn-xs", text: "推送学习任务", onclick: () => { ZK.db.log("推送学习任务", "向 " + p.learner.name + " 推送《" + s.name + "》学习任务"); ZK.toast("已向学生推送《" + s.name + "》学习任务"); } }),
                      ]),
                    ]),
                  ])
                )),
              ],
            })
          );
        });

        /* 历史保存记录 */
        const saved = ZK.db.list(PATH_STORE, (x) => x.learnerId === learnerId);
        if (saved.length) {
          host.appendChild(
            ZK.ui.card({
              title: "已保存的路径方案（" + saved.length + "）",
              icon: ZK.icons.clockHistory(16),
              body: [ZK.ui.table({
                rows: saved,
                pageSize: 6,
                columns: [
                  { key: "at", label: "生成时间", sortable: true, render: (r) => U.fmtDateTime(r.at) },
                  { key: "steps", label: "步骤数", render: (r) => r.steps.length + " 步" },
                  { key: "operator", label: "操作人" },
                  { key: "summary", label: "说明", render: (r) => h("span", { class: "cell-muted", text: U.truncate(r.summary, 60) }) },
                  { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs btn-danger", text: "删除", onclick: () => { ZK.db.remove(PATH_STORE, r.id); paint(); ZK.toast("已删除"); } }) },
                ],
              })],
            })
          );
        }
      }

      function exportPath() {
        const p = ZK.engine.learningPath(learnerId);
        if (!p) return;
        const lines = ["个性化学习路径方案", "学生：" + p.learner.name + "（" + (p.cls ? p.cls.name : "") + "）", "生成时间：" + U.fmtDateTime(Date.now()), "", p.summary, "", "路径步骤："];
        p.steps.forEach((s) => {
          lines.push("");
          lines.push("【步骤 " + s.step + "】" + s.name + "（" + s.phase + "）");
          lines.push("  掌握率 " + s.mastery + "%　完成率 " + s.completion + "%　缺口 " + s.gap + " 分　预计 " + s.estMinutes + " 分钟");
          lines.push("  依据：" + s.reason);
          s.tasks.forEach((t, i) => lines.push("  任务 " + (i + 1) + "：" + t));
        });
        U.download("学习路径-" + p.learner.name + ".txt", lines.join("\n"));
        ZK.db.log("导出学习路径", "导出 " + p.learner.name + " 的学习路径方案");
        ZK.toast("学习路径方案已导出");
      }

      fillStudents();
      paint();
    },
  };

  /* ==================================================================
     四、AI 学情画像
     ================================================================== */
  P["analytics/profile"] = {
    render(root, param) {
      let mode = "class";
      let classId = param && ZK.db.find("classes", param) ? param : (ZK.db.list("classes")[0] || {}).id;
      let learnerId = param && ZK.db.find("learners", param) ? param : (ZK.db.list("learners")[0] || {}).id;

      root.appendChild(
        ZK.ui.pageHead({
          title: "AI 学情画像",
          sub: "基于知识点数据、学习行为与实训记录，由 AI 生成班级整体画像或学生个体画像，并给出可执行的教学与学习建议。",
          actions: [
            h("button", { class: "btn btn-sm", text: "班级知识点分析", onclick: () => go("#/analytics/class/" + classId) }),
            h("button", { class: "btn btn-sm", text: "导出画像", onclick: () => exportProfile() }),
          ],
        })
      );

      const tabBar = ZK.ui.tabs([{ id: "class", name: "班级整体画像" }, { id: "student", name: "学生个体画像" }], mode, (id) => {
        mode = id;
        paintTabs();
        paint();
      });
      const selBox = h("div", { class: "mb-16" });
      const host = h("div", { class: "stack-16" });

      root.appendChild(h("div", { class: "mb-12" }, [tabBar]));
      root.appendChild(selBox);
      root.appendChild(host);

      function paintTabs() {
        U.$$("button", tabBar).forEach((b, i) => b.classList.toggle("on", ["class", "student"][i] === mode));
      }

      function paintSel() {
        U.clear(selBox);
        if (mode === "class") {
          const s = h("select", { class: "select", style: { width: "280px" } }, classOptions(classId));
          s.addEventListener("change", () => {
            classId = s.value;
            paint();
          });
          selBox.appendChild(h("div", { class: "row", style: { gap: "12px" } }, [s, h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.sparkles(13) + "<span>生成班级画像</span>", onclick: () => paint() })]));
        } else {
          const sel = h("select", { class: "select", style: { width: "280px" } }, ZK.db.list("learners").slice(0, 90).map((l) => h("option", { value: l.id, text: l.name + " · " + l.sno + " · " + (l.cls || ""), selected: l.id === learnerId ? true : null })));
          sel.addEventListener("change", () => {
            learnerId = sel.value;
            paint();
          });
          selBox.appendChild(h("div", { class: "row", style: { gap: "12px" } }, [sel, h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.sparkles(13) + "<span>生成学生画像</span>", onclick: () => paint() })]));
        }
      }

      function paint() {
        U.clear(host);
        if (mode === "class") paintClass();
        else paintStudent();
      }

      /* ---------- 班级画像 ---------- */
      function paintClass() {
        const p = ZK.engine.classProfile(classId);
        if (!p.cls) {
          host.appendChild(ZK.ui.empty({ title: "未找到班级", desc: "请重新选择班级。", icon: ZK.icons.users(22) }));
          return;
        }

        host.appendChild(
          h("div", { class: "grid grid-4" }, [
            ZK.ui.statCard({ label: "班级人数", value: String(p.learnerCount), target: "近 3 日活跃 " + p.activeLearners + " 人", icon: ZK.icons.users(18), tone: "emerald", progress: (p.activeLearners / Math.max(1, p.learnerCount)) * 100 }),
            ZK.ui.statCard({ label: "平均掌握率", value: U.pct(p.overall.avgMastery), target: "平均完成率 " + U.pct(p.overall.avgCompletion), icon: ZK.icons.target(18), tone: "blue", progress: p.overall.avgMastery }),
            ZK.ui.statCard({ label: "风险学生", value: String(p.riskLearners), target: "风险值 ≥ 40", icon: ZK.icons.shieldAlert(18), tone: "red", progress: Math.min(100, p.riskLearners * 12) }),
            ZK.ui.statCard({ label: "资料人均阅读", value: p.overall.avgReadPerCapita + " 项", target: "学习记录 " + U.num(p.overall.totalRecords) + " 条", icon: ZK.icons.book(18), tone: "violet", progress: Math.min(100, p.overall.avgReadPerCapita * 25) }),
          ])
        );

        host.appendChild(
          ZK.ui.card({
            title: "AI 班级画像",
            sub: "教师视角 · 生成于 " + U.fmtDateTime(p.generatedAt),
            icon: ZK.icons.sparkles(16),
            actions: [
              ZK.ui.badge("A 层 " + p.tiers.A + " 人", "emerald"),
              ZK.ui.badge("B 层 " + p.tiers.B + " 人", "blue"),
              ZK.ui.badge("C 层 " + p.tiers.C + " 人", "amber"),
            ],
            body: [
              h("div", { class: "advice info", text: p.narrative }),
              h("div", { class: "sb-group-title", text: "画像结论" }),
              h("div", { class: "stack-12" }, [
                bullet("教学重点", "薄弱知识点 " + p.weakKps.map((k) => k.name).join("、") + "，建议在下次课安排针对性讲解，并把作业难度按班内分层调整。"),
                bullet("资源使用", "课程资料人均阅读 " + p.overall.avgReadPerCapita + " 项，阅读率偏低的知识点为 " + (p.kpStats.slice().sort((a, b) => a.readRate - b.readRate)[0] || {}).name + "，建议在课堂上做一次资料导读。"),
                bullet("分层教学", "A 层学生可用于同伴互评与案例讲解，B 层按学习路径推进，C 层需强化基础练习与一对一反馈。"),
                bullet("内容安全", "风险学生 " + p.riskLearners + " 人，建议结合内容安全模块的处置记录做一次学业诚信提醒。"),
              ]),
              h("div", { class: "row mt-12", style: { gap: "8px" } }, [
                h("button", { class: "btn btn-sm", text: "保存画像留档", onclick: () => { ZK.db.insert(PROFILE_STORE, { id: U.uid("pf"), kind: "class", targetId: p.cls.id, target: p.cls.name, narrative: p.narrative, mastery: p.overall.avgMastery, at: Date.now(), operator: (ZK.db.currentUser() || {}).name || "系统" }); ZK.toast("班级画像已留档"); } }),
                h("button", { class: "btn btn-sm", text: "查看薄弱知识点明细", onclick: () => go("#/analytics/class/" + p.cls.id) }),
              ]),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-2" }, [
            ZK.ui.card({
              title: "分层结构",
              sub: "按学习者基础分层（A/B/C）",
              icon: ZK.icons.layers(16),
              body: [ZK.ui.bars({ data: [
                { label: "A 层", value: p.tiers.A, tone: "emerald" },
                { label: "B 层", value: p.tiers.B, tone: "blue" },
                { label: "C 层", value: p.tiers.C, tone: "amber" },
              ] })],
            }),
            ZK.ui.card({
              title: "章节掌握率趋势",
              icon: ZK.icons.trendingUp(16),
              body: [ZK.ui.lineChart({
                labels: p.chapterTrend.map((t) => t.label),
                series: [{ name: "平均掌握率", color: "#60a5fa", data: p.chapterTrend.map((t) => t.mastery) }],
                max: 100,
                min: 0,
              })],
            }),
          ])
        );

        const saved = ZK.db.list(PROFILE_STORE, (x) => x.kind === "class" && x.targetId === classId);
        if (saved.length) {
          host.appendChild(ZK.ui.card({
            title: "画像留档（" + saved.length + "）",
            icon: ZK.icons.clockHistory(16),
            body: [ZK.ui.table({
              rows: saved,
              pageSize: 5,
              columns: [
                { key: "at", label: "生成时间", sortable: true, render: (r) => U.fmtDateTime(r.at) },
                { key: "mastery", label: "平均掌握率", align: "right", render: (r) => U.pct(r.mastery) },
                { key: "operator", label: "操作人" },
                { key: "narrative", label: "画像摘要", render: (r) => h("span", { class: "cell-muted", text: U.truncate(r.narrative, 70) }) },
                { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs btn-danger", text: "删除", onclick: () => { ZK.db.remove(PROFILE_STORE, r.id); paint(); } }) },
              ],
            })],
          }));
        }
      }

      /* ---------- 学生画像 ---------- */
      function paintStudent() {
        const p = ZK.engine.studentProfile(learnerId);
        if (!p) {
          host.appendChild(ZK.ui.empty({ title: "未找到该学生", desc: "请重新选择。", icon: ZK.icons.user(22) }));
          return;
        }

        host.appendChild(
          h("div", { class: "grid grid-4" }, [
            ZK.ui.statCard({ label: "综合掌握率", value: U.pct(p.mastery), target: "班级平均 " + U.pct(p.clsMastery), icon: ZK.icons.target(18), tone: "blue", progress: p.mastery }),
            ZK.ui.statCard({ label: "综合完成率", value: U.pct(p.completion), target: "班级平均 " + U.pct(p.clsCompletion), icon: ZK.icons.checkCircle(18), tone: "emerald", progress: p.completion }),
            ZK.ui.statCard({ label: "班级排名", value: "第 " + p.rank + " / " + p.classSize, target: "分层 " + p.level, icon: ZK.icons.award(18), tone: "amber", progress: ((p.classSize - p.rank + 1) / p.classSize) * 100 }),
            ZK.ui.statCard({ label: "资料阅读率", value: U.pct(p.readRate), target: "平均时长 " + p.avgDuration + " 分钟", icon: ZK.icons.eye(18), tone: "violet", progress: p.readRate }),
          ])
        );

        host.appendChild(
          ZK.ui.card({
            title: "AI 学生画像 · " + p.learner.name,
            sub: p.persona + " · " + (p.cls ? p.cls.name : "") + " · 生成于 " + U.fmtDateTime(p.generatedAt),
            icon: ZK.icons.user(16),
            actions: [
              ZK.ui.badge(p.level, p.level === "优秀" ? "emerald" : p.level === "良好" ? "blue" : p.level === "中等" ? "amber" : "red"),
              ZK.ui.badge("风险 " + p.riskLevel.label, p.riskLevel.key === "high" ? "red" : p.riskLevel.key === "mid" ? "amber" : "emerald"),
            ],
            body: [
              h("div", { class: "row", style: { gap: "8px", "flex-wrap": "wrap" } }, (p.traits || []).map((t) => h("span", { class: "chip", text: t.tag, title: t.desc }))),
              h("div", { class: "sb-group-title", text: "行为特征解读" }),
              h("div", { class: "stack-8" }, (p.traits || []).map((t) => h("div", { class: "advice", text: t.tag + "：" + t.desc }))),
              h("div", { class: "sb-group-title", text: "AI 学习建议" }),
              h("div", { class: "stack-12" }, (p.suggestion || []).map((s, i) =>
                h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
                  h("div", { class: "fs-12 fw-6 em mb-4", text: "建议 " + (i + 1) }),
                  h("div", { class: "fs-12 muted", style: { "line-height": "1.75" }, text: s }),
                ])
              )),
              h("div", { class: "row mt-12", style: { gap: "8px" } }, [
                h("button", { class: "btn btn-sm btn-primary", text: "生成个性化学习路径", onclick: () => go("#/analytics/path/" + learnerId) }),
                h("button", { class: "btn btn-sm", text: "保存画像留档", onclick: () => { ZK.db.insert(PROFILE_STORE, { id: U.uid("pf"), kind: "student", targetId: learnerId, target: p.learner.name, narrative: p.suggestion.join(" "), mastery: p.mastery, at: Date.now(), operator: (ZK.db.currentUser() || {}).name || "系统" }); ZK.toast("学生画像已留档"); } }),
              ]),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-2" }, [
            ZK.ui.card({
              title: "能力雷达",
              sub: "各知识点掌握率 / 完成率",
              icon: ZK.icons.target(16),
              body: [
                ZK.ui.radar({ items: p.radar.slice(0, 12).map((r) => ({ name: r.name, value: r.mastery })) }),
                h("div", { class: "fs-11 faint", text: "雷达外沿为 100%，数值为掌握率。" }),
              ],
            }),
            ZK.ui.card({
              title: "掌握率排序",
              sub: "升序排列，最左侧为最薄弱知识点",
              icon: ZK.icons.bars(16),
              body: [ZK.ui.bars({
                data: p.radar.slice().sort((a, b) => a.value - b.value).slice(0, 8).map((r) => ({
                  label: U.truncate(r.name, 5),
                  value: r.value,
                  display: U.round(r.value),
                  tone: r.value >= 85 ? "emerald" : r.value >= 75 ? "blue" : r.value >= 65 ? "amber" : "red",
                  tip: r.name + "：掌握率 " + r.value + "%　完成率 " + r.completion + "%",
                })),
                max: 100,
              })],
            }),
          ])
        );

        host.appendChild(
          h("div", { class: "grid grid-2" }, [
            ZK.ui.card({
              title: "薄弱知识点 TOP 3",
              icon: ZK.icons.trendingDown(16),
              body: [ZK.ui.table({
                rows: p.weak,
                pageSize: 3,
                columns: [
                  { key: "name", label: "知识点", render: (r) => h("span", { class: "cell-strong", text: r.name }) },
                  { key: "mastery", label: "掌握率", align: "right", render: (r) => U.pct(r.mastery) },
                  { key: "materialsRead", label: "资料阅读", align: "right", render: (r) => r.materialsRead + " / " + r.materialTotal },
                  { key: "attempts", label: "练习", align: "right", render: (r) => r.attempts + " 次" },
                ],
              })],
            }),
            ZK.ui.card({
              title: "优势知识点 TOP 3",
              icon: ZK.icons.trendingUp(16),
              body: [ZK.ui.table({
                rows: p.strong,
                pageSize: 3,
                columns: [
                  { key: "name", label: "知识点", render: (r) => h("span", { class: "cell-strong", text: r.name }) },
                  { key: "mastery", label: "掌握率", align: "right", render: (r) => U.pct(r.mastery) },
                  { key: "completion", label: "完成率", align: "right", render: (r) => U.pct(r.completion) },
                  { key: "duration", label: "时长", align: "right", render: (r) => r.duration + " 分" },
                ],
              })],
            }),
          ])
        );

        host.appendChild(
          ZK.ui.card({
            title: "学习行为与参与度",
            icon: ZK.icons.chart(16),
            body: [h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
              miniStat("参与 AI 实训次数", p.practiceCount + " 次"),
              miniStat("提交作品数量", p.subCount + " 份"),
              miniStat("平均练习次数", p.attemptAvg + " 次/知识点"),
              miniStat("单个知识点平均时长", p.avgDuration + " 分钟"),
            ])],
          })
        );
      }

      function bullet(title, text) {
        return h("div", { class: "advice" }, [
          h("b", { text: title }),
          h("div", { class: "fs-12 muted mt-4", text: text }),
        ]);
      }

      function exportProfile() {
        const lines = [];
        if (mode === "class") {
          const p = ZK.engine.classProfile(classId);
          lines.push("AI 班级学情画像", "班级：" + p.cls.name, "人数：" + p.learnerCount, "生成时间：" + U.fmtDateTime(p.generatedAt), "");
          lines.push(p.narrative, "", "分层：A " + p.tiers.A + " 人 / B " + p.tiers.B + " 人 / C " + p.tiers.C + " 人", "");
          lines.push("薄弱知识点：");
          p.weakKps.forEach((k) => lines.push("- " + k.name + "（掌握率 " + k.avgMastery + "%，低掌握 " + k.lowCount + " 人）"));
          lines.push("", "知识点明细：");
          p.kpStats.forEach((k) => lines.push("- " + k.name + "：资源 " + k.resourceCount + " 项，完成率 " + k.avgCompletion + "%，掌握率 " + k.avgMastery + "%，资料 " + k.materialCount + " 项，人均阅读 " + k.readPerCapita + " 项"));
          U.download("班级学情画像-" + p.cls.name + ".txt", lines.join("\n"));
        } else {
          const p = ZK.engine.studentProfile(learnerId);
          lines.push("AI 学生学情画像", "学生：" + p.learner.name + "（" + (p.cls ? p.cls.name : "") + "）", "画像类型：" + p.persona, "综合掌握率：" + p.mastery + "%　班级平均 " + p.clsMastery + "%", "班级排名：第 " + p.rank + " / " + p.classSize + "　分层 " + p.level, "");
          lines.push("行为特征：");
          p.traits.forEach((t) => lines.push("- " + t.tag + "：" + t.desc));
          lines.push("", "学习建议：");
          p.suggestion.forEach((s, i) => lines.push((i + 1) + ". " + s));
          lines.push("", "薄弱知识点：");
          p.weak.forEach((w) => lines.push("- " + w.name + "（掌握率 " + w.mastery + "%）"));
          U.download("学生学情画像-" + p.learner.name + ".txt", lines.join("\n"));
        }
        ZK.db.log("导出学情画像", "导出" + (mode === "class" ? "班级" : "学生") + "学情画像");
        ZK.toast("学情画像已导出");
      }

      paintSel();
      paint();
      paintTabs();
    },
  };
})();
