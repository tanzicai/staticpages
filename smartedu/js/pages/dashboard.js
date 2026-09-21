/* ==========================================================================
   页面 · 工作台（总览看板 / 待办与提醒 / 教学日历）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;

  function head(o) {
    return ZK.ui.pageHead(o);
  }

  function go(hash) {
    location.hash = hash;
  }

  /* ============================ 总览看板 ============================ */
  P["dashboard/overview"] = {
    render(root) {
      const ov = ZK.engine.overview();
      const risk = ZK.engine.userRisk();
      const cls = ZK.engine.classAnalytics("cls_biz1");
      const u = ZK.db.currentUser() || {};

      root.appendChild(
        head({
          title: "教学运行总览",
          sub:
            "当前学期：2025-2026学年第一学期 · 登录身份：" +
            (u.roleName || "") +
            " " +
            (u.name || "") +
            " · 数据更新时间：" +
            U.fmtDateTime(Date.now()),
          actions: [
            h("button", { class: "btn btn-sm", html: ZK.icons.refresh(14) + "<span>刷新数据</span>", onclick: () => ZK.app.refresh() }),
            h("button", { class: "btn btn-primary btn-sm", text: "进入知识库", onclick: () => go("#/kb/list") }),
          ],
        })
      );

      /* --- 指标卡 --- */
      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({
            label: "文档知识库", value: String(ov.kbs) + " 个", target: ov.docs + " 篇文档",
            icon: ZK.icons.database(18), tone: "emerald", progress: Math.min(100, ov.docs * 4),
          }),
          ZK.ui.statCard({
            label: "课程文献库", value: String(ov.books) + " 本", target: ov.resources + " 项在线资源",
            icon: ZK.icons.book(18), tone: "blue", progress: Math.min(100, ov.books),
          }),
          ZK.ui.statCard({
            label: "AI 实训完成", value: String(ov.sessions) + " 人次", target: ov.scenes + " 个场景",
            icon: ZK.icons.messages(18), tone: "violet", progress: Math.min(100, ov.sessions * 3),
          }),
          ZK.ui.statCard({
            label: "作品平均得分", value: ov.avgSubmissionScore ? ov.avgSubmissionScore + " 分" : "—",
            target: ov.submissions + " 份提交 · " + ov.reviewed + " 份已评", icon: ZK.icons.award(18), tone: "amber",
            progress: ov.avgSubmissionScore,
          }),
        ])
      );

      /* --- 学情趋势 + 安全评分 --- */
      root.appendChild(
        h("div", { class: "grid grid-3 mb-16" }, [
          h("div", { class: "span-2" }, [
            ZK.ui.card({
              title: "各章知识点掌握情况",
              sub: "数据来源：2022级商务英语1班 学习记录，随学生学习行为实时更新",
              icon: ZK.icons.chart(16),
              body: [
                (function () {
                  const labels = cls.chapterTrend.map((c) => c.label);
                  const chart = ZK.ui.lineChart({
                    labels: labels,
                    series: [
                      { name: "平均掌握率", data: cls.chapterTrend.map((c) => c.mastery), color: "#60a5fa", area: true },
                      { name: "平均完成率", data: cls.chapterTrend.map((c) => c.completion), color: "#60a5fa", dash: "5 4" },
                    ],
                    max: 100,
                  });
                  return h("div", {}, [
                    chart,
                    h("div", { class: "row mt-12", style: { gap: "18px", "flex-wrap": "wrap" } }, [
                      h("span", { class: "fs-12 muted" }, [h("i", { style: { display: "inline-block", width: "16px", height: "3px", background: "#60a5fa", "vertical-align": "middle", "margin-right": "6px" } }), "平均掌握率"]),
                      h("span", { class: "fs-12 muted" }, [h("i", { style: { display: "inline-block", width: "16px", height: "3px", background: "#60a5fa", "vertical-align": "middle", "margin-right": "6px" } }), "平均完成率"]),
                      h("span", { class: "fs-12 faint", text: "共 " + cls.overall.totalRecords + " 条学习记录 · " + cls.overall.learners + " 名学生" }),
                    ]),
                  ]);
                })(),
              ],
            }),
          ]),
          ZK.ui.card({
            title: "内容安全概览",
            sub: "近 30 日平台内容治理数据",
            icon: ZK.icons.shield(16),
            body: [
              h("div", { class: "ring-wrap mb-16" }, [
                ZK.ui.ring({
                  pct: ov.safetyScore, size: 116, stroke: 9,
                  color: ov.safetyScore >= 90 ? "#2563eb" : ov.safetyScore >= 75 ? "#0ea5e9" : "#1d4ed8",
                  text: Math.round(ov.safetyScore) + "",
                  sub: "内容环境评分",
                }),
              ]),
              ZK.ui.kv([
                ["累计发布内容", ov.posts + " 条"],
                ["垃圾发布量", h("span", { class: "em-danger", text: String(ov.spamPosts) + " 条" })],
                ["垃圾发布率", h("span", { class: "em-danger", text: U.pct((ov.spamPosts / (ov.posts || 1)) * 100) })],
                ["风险用户", risk.summary.riskyUsers + " 人（高风险 " + risk.summary.highRiskUsers + " 人）"],
              ]),
              h("button", { class: "btn btn-sm btn-block mt-16", text: "查看用户风险统计", onclick: () => go("#/safety/risk") }),
            ],
          }),
        ])
      );

      /* --- 知识点掌握率 + 待评阅 --- */
      root.appendChild(
        h("div", { class: "grid grid-3 mb-16" }, [
          h("div", { class: "span-2" }, [
            ZK.ui.card({
              title: "各知识点平均掌握率",
              sub: "点击柱状图区域可进入知识点详情查看关联资源与阅读情况",
              icon: ZK.icons.target(16),
              actions: [h("button", { class: "btn btn-sm", text: "知识点详情", onclick: () => go("#/analytics/kp") })],
              body: [
                ZK.ui.bars({
                  data: cls.kpStats.map((k) => ({
                    label: "K" + k.order,
                    value: k.avgMastery,
                    display: U.round(k.avgMastery),
                    tone: k.avgMastery >= 82 ? "" : k.avgMastery >= 70 ? "blue" : "red",
                    tip: k.name + "：掌握率 " + k.avgMastery + "%（完成率 " + k.avgCompletion + "%）",
                  })),
                  max: 100,
                }),
                h("div", { class: "row mt-12", style: { gap: "16px", "flex-wrap": "wrap" } }, cls.kpStats.slice(0, 6).map((k) =>
                  h("span", { class: "fs-11 faint", text: "K" + k.order + " " + U.truncate(k.name, 10) })
                )),
              ],
            }),
          ]),
          ZK.ui.card({
            title: "薄弱知识点",
            sub: "按班级平均掌握率升序",
            icon: ZK.icons.alert(16),
            body: [
              h("div", { class: "row-list" }, cls.weakKps.map((k) =>
                h("button", { class: "list-row", onclick: () => go("#/analytics/kp/" + k.kpId) }, [
                  h("div", { class: "lr-icon ic-red", html: ZK.icons.target(15) }),
                  h("div", { class: "lr-main" }, [
                    h("b", { text: k.name }),
                    h("span", { text: "第 " + k.chapter + " 章 · 掌握率 " + k.avgMastery + "% · 低于 60% 者 " + k.lowCount + " 人" }),
                  ]),
                ])
              )),
            ],
          }),
        ])
      );

      /* --- 待办 + 动态 --- */
      const pending = ZK.db.list("submissions", (s) => !s.aiReview);
      const openTasks = ZK.db.list("tasks", (t) => t.status === "open");
      root.appendChild(
        h("div", { class: "grid grid-3" }, [
          ZK.ui.card({
            title: "待评阅作品",
            sub: "提交后未完成 AI 评阅的作品",
            icon: ZK.icons.sparkles(16),
            actions: [h("button", { class: "btn btn-sm", text: "全部任务", onclick: () => go("#/tasks/list") })],
            body: [
              pending.length
                ? h("div", { class: "row-list" }, pending.map((s) =>
                    h("button", { class: "list-row", onclick: () => go("#/tasks/review/" + s.taskId) }, [
                      h("div", { class: "lr-icon ic-amber", html: ZK.icons.fileText(15) }),
                      h("div", { class: "lr-main" }, [
                        h("b", { text: s.title }),
                        h("span", { text: s.learner + " · " + s.cls + " · " + U.fmtTime(s.submittedAt) }),
                      ]),
                      h("div", { class: "lr-tail" }, [ZK.ui.badge("待评阅", "amber")]),
                    ])
                  ))
                : ZK.ui.empty({ title: "暂无待评阅作品", desc: "所有已提交的作品都已完成 AI 评阅。" }),
            ],
          }),
          ZK.ui.card({
            title: "进行中的任务",
            sub: "按截止时间排序",
            icon: ZK.icons.clipboard(16),
            body: [
              openTasks.length
                ? h("div", { class: "row-list" }, openTasks.slice(0, 4).map((t) => {
                    const left = Math.ceil((t.deadline - Date.now()) / 86400000);
                    return h("button", { class: "list-row", onclick: () => go("#/tasks/review/" + t.id) }, [
                      h("div", { class: "lr-icon ic-emerald", html: ZK.icons.clipboard(15) }),
                      h("div", { class: "lr-main" }, [
                        h("b", { text: t.title }),
                        h("span", { text: t.course + " · 截止 " + U.fmtDate(t.deadline) }),
                      ]),
                      h("div", { class: "lr-tail" }, [
                        ZK.ui.badge("剩余 " + Math.max(0, left) + " 天", left <= 3 ? "red" : left <= 7 ? "amber" : "emerald"),
                      ]),
                    ]);
                  }))
                : ZK.ui.empty({ title: "暂无进行中的任务" }),
            ],
          }),
          ZK.ui.card({
            title: "平台动态",
            sub: "最近操作日志",
            icon: ZK.icons.clockHistory(16),
            actions: [h("button", { class: "btn btn-sm", text: "全部日志", onclick: () => go("#/system/logs") })],
            body: [
              h("div", { class: "timeline" }, ZK.db.list("logs").slice(0, 7).map((l, i) =>
                h("div", { class: "tl-item" + (i === 0 ? " on" : "") }, [
                  h("div", { class: "tl-time", text: U.fmtTime(l.at) + " · " + l.operator }),
                  h("div", { class: "tl-text", text: l.action + "：" + U.truncate(l.detail, 48) }),
                ])
              )),
            ],
          }),
        ])
      );
    },
  };

  /* ============================ 待办与提醒 ============================ */
  P["dashboard/todo"] = {
    render(root) {
      const u = ZK.db.currentUser() || {};
      const pending = ZK.db.list("submissions", (s) => !s.aiReview);
      const openTasks = ZK.db.list("tasks", (t) => t.status === "open");
      const risky = ZK.engine.userRisk().rows.filter((r) => r.riskScore >= 40);
      const untrained = ZK.db.list("knowledgeBases", (k) => k.status !== "trained");
      const unparsed = ZK.db.list("literature", (l) => !l.parsed && l.text);
      const lowMastery = ZK.engine.classAnalytics("cls_biz1").weakKps;

      root.appendChild(
        head({
          title: "待办与提醒",
          sub: "按角色聚合当前需要处理的事项。每一条都可直接跳转到对应处理页面。",
        })
      );

      const groups = [];

      groups.push({
        title: "作品评阅", tone: "amber", icon: "sparkles",
        count: pending.length, empty: "所有提交的作品均已完成评阅。",
        items: pending.map((s) => ({
          title: s.title, sub: s.learner + " · " + s.cls + " · 提交于 " + U.fmtTime(s.submittedAt),
          tag: "待 AI 评阅", go: "#/tasks/review/" + s.taskId, action: "进入评阅",
        })),
      });

      groups.push({
        title: "任务截止", tone: "red", icon: "clock",
        count: openTasks.length, empty: "当前没有进行中的任务。",
        items: openTasks.map((t) => {
          const left = Math.ceil((t.deadline - Date.now()) / 86400000);
          return {
            title: t.title,
            sub: t.course + " · 截止 " + U.fmtDate(t.deadline) + " · 已收作品 " + ZK.db.list("submissions", (s) => s.taskId === t.id).length + " 份",
            tag: "剩余 " + Math.max(0, left) + " 天", go: "#/tasks/review/" + t.id, action: "查看任务",
          };
        }),
      });

      groups.push({
        title: "内容安全", tone: "red", icon: "shieldAlert",
        count: risky.length, empty: "暂无中高风险用户。",
        items: risky.map((r) => ({
          title: r.name + "（" + r.sno + "）",
          sub: r.cls + " · 垃圾发布 " + r.spam + "/" + r.total + " 条 · 垃圾发布率 " + r.spamRate + "%",
          tag: r.riskLevel.label, go: "#/safety/risk", action: "查看风险详情",
        })),
      });

      groups.push({
        title: "学情预警", tone: "blue", icon: "alert",
        count: lowMastery.length, empty: "各知识点掌握情况正常。",
        items: lowMastery.map((k) => ({
          title: k.name,
          sub: "第 " + k.chapter + " 章 · 掌握率 " + k.avgMastery + "% · 低于 60% 者 " + k.lowCount + " 人",
          tag: "需重点关注", go: "#/analytics/kp/" + k.kpId, action: "查看知识点",
        })),
      });

      groups.push({
        title: "知识库与文献", tone: "emerald", icon: "database",
        count: untrained.length + unparsed.length, empty: "知识库与文献均已完成处理。",
        items: untrained
          .map((k) => ({ title: k.name, sub: "状态：" + k.status + " · 需完成分片索引", tag: "待训练", go: "#/kb/detail/" + k.id, action: "去训练" }))
          .concat(
            unparsed.map((l) => ({ title: l.title, sub: (l.source || "待补充来源") + " · 尚未解析", tag: "待解析", go: "#/graph/literature/" + l.id, action: "去解析" }))
          ),
      });

      groups.forEach((g) => {
        const t = ZK.ui.tone(g.tone);
        root.appendChild(
          ZK.ui.card({
            title: g.title + "（" + g.count + "）",
            icon: ZK.icons[g.icon] ? ZK.icons[g.icon](16) : "",
            body: [
              g.count
                ? h("div", { class: "row-list" }, g.items.map((it) =>
                    h("div", { class: "list-row", style: { cursor: "default" } }, [
                      h("div", { class: "lr-icon " + t.ic, html: ZK.icons[g.icon](15) }),
                      h("div", { class: "lr-main" }, [h("b", { text: it.title }), h("span", { text: it.sub })]),
                      h("div", { class: "lr-tail" }, [
                        ZK.ui.badge(it.tag, g.tone),
                        h("button", { class: "btn btn-sm", text: it.action, onclick: () => go(it.go) }),
                      ]),
                    ])
                  ))
                : ZK.ui.empty({ title: "暂无待办", desc: g.empty }),
            ],
          })
        );
      });
    },
  };

  /* ============================ 教学日历 ============================ */
  P["dashboard/calendar"] = {
    render(root) {
      let cursor = new Date();
      cursor.setDate(1);
      const host = h("div");

      function eventsOf(monthDate) {
        const y = monthDate.getFullYear();
        const m = monthDate.getMonth();
        const evts = [];
        ZK.db.list("tasks").forEach((t) => {
          [["发布", t.publishAt], ["截止", t.deadline]].forEach((p) => {
            const d = new Date(p[1]);
            if (d.getFullYear() === y && d.getMonth() === m) {
              evts.push({ day: d.getDate(), type: p[0] === "截止" ? "deadline" : "publish", title: t.title, sub: t.course + " · 任务" + p[0], tone: p[0] === "截止" ? "red" : "emerald", go: "#/tasks/review/" + t.id });
            }
          });
        });
        ZK.db.list("resources").forEach((r) => {
          const d = new Date(r.publishedAt);
          if (d.getFullYear() === y && d.getMonth() === m) {
            evts.push({ day: d.getDate(), type: "resource", title: r.title, sub: "在线课程资源发布", tone: "blue", go: "#/library/resources" });
          }
        });
        ZK.db.list("practiceSessions").forEach((s) => {
          const d = new Date(s.startedAt);
          if (d.getFullYear() === y && d.getMonth() === m) {
            const sc = ZK.db.find("scenes", s.sceneId) || {};
            evts.push({ day: d.getDate(), type: "practice", title: (sc.name || "实训场景") + " · " + s.learner, sub: "AI 实训完成", tone: "violet", go: "#/practice/records" });
          }
        });
        ZK.db.list("notices").forEach((n) => {
          const d = new Date(n.at);
          if (d.getFullYear() === y && d.getMonth() === m) {
            evts.push({ day: d.getDate(), type: "notice", title: n.title, sub: "公告 · " + n.org, tone: "amber", go: "#/dashboard/calendar" });
          }
        });
        return evts;
      }

      function paint() {
        U.clear(host);
        const y = cursor.getFullYear();
        const m = cursor.getMonth();
        const first = new Date(y, m, 1);
        const startWeekday = (first.getDay() + 6) % 7; // 周一起
        const days = new Date(y, m + 1, 0).getDate();
        const evts = eventsOf(cursor);
        const today = new Date();

        const grid = h("div", { class: "grid grid-4", style: { gap: "1px", background: "var(--border-default)", border: "1px solid var(--border-default)", "border-radius": "12px", overflow: "hidden" } });
        ["周一", "周二", "周三", "周四", "周五", "周六", "周日"].forEach((w) =>
          grid.appendChild(h("div", { style: { background: "rgba(31,41,55,0.6)", padding: "9px 12px", "font-size": "12px", color: "var(--text-muted)", "text-align": "center" }, text: w }))
        );
        for (let i = 0; i < startWeekday; i++) {
          grid.appendChild(h("div", { style: { background: "var(--bg-base)", "min-height": "104px" } }));
        }
        for (let d = 1; d <= days; d++) {
          const dayEvts = evts.filter((e) => e.day === d);
          const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
          grid.appendChild(
            h("div", { style: { background: isToday ? "rgba(37,99,235,0.11)" : "var(--bg-panel)", "min-height": "104px", padding: "8px 9px", display: "flex", "flex-direction": "column", gap: "4px" } }, [
              h("div", { class: "fs-12 " + (isToday ? "em fw-7" : "faint"), text: String(d) + (isToday ? " 今天" : "") }),
              h("div", { style: { display: "flex", "flex-direction": "column", gap: "3px" } }, dayEvts.slice(0, 3).map((e) =>
                h("button", {
                  class: "chip",
                  style: { padding: "2px 7px", "font-size": "10.5px", "justify-content": "flex-start", overflow: "hidden" },
                  title: e.sub + "：" + e.title,
                  onclick: () => go(e.go),
                }, [h("span", { class: "truncate", text: U.truncate(e.title, 9) })])
              )),
              dayEvts.length > 3 ? h("div", { class: "fs-11 ghost", text: "还有 " + (dayEvts.length - 3) + " 项" }) : null,
            ])
          );
        }
        // 补齐末尾
        const tail = (7 - ((startWeekday + days) % 7)) % 7;
        for (let i = 0; i < tail; i++) grid.appendChild(h("div", { style: { background: "var(--bg-base)", "min-height": "104px" } }));

        host.appendChild(
          h("div", { class: "grid grid-3" }, [
            h("div", { class: "span-2" }, [ZK.ui.card({ title: y + " 年 " + (m + 1) + " 月", sub: "共 " + evts.length + " 项教学日程", icon: ZK.icons.calendar(16), body: [grid], bodyClass: "flush" })]),
            ZK.ui.card({
              title: "本月日程明细",
              sub: "按日期排序",
              icon: ZK.icons.list(16),
              body: [
                evts.length
                  ? h("div", { class: "row-list" }, evts.slice().sort((a, b) => a.day - b.day).map((e) =>
                      h("button", { class: "list-row", onclick: () => go(e.go) }, [
                        h("div", { class: "lr-icon " + ZK.ui.tone(e.tone).ic, html: ZK.icons[e.type === "deadline" ? "clock" : e.type === "resource" ? "folder" : e.type === "practice" ? "messages" : "megaphone"](15) }),
                        h("div", { class: "lr-main" }, [h("b", { text: e.title }), h("span", { text: (m + 1) + "月" + e.day + "日 · " + e.sub })]),
                      ])
                    ))
                  : ZK.ui.empty({ title: "本月暂无日程" }),
              ],
            }),
          ])
        );
      }

      root.appendChild(
        head({
          title: "教学日历",
          sub: "任务发布与截止、课程资源发布、AI 实训完成记录、教学公告统一排布在同一张月历上。",
          actions: [
            h("button", { class: "btn btn-sm", text: "上月", onclick: () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1); paint(); } }),
            h("button", { class: "btn btn-sm", text: "本月", onclick: () => { cursor = new Date(); cursor.setDate(1); paint(); } }),
            h("button", { class: "btn btn-sm", text: "下月", onclick: () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1); paint(); } }),
          ],
        })
      );
      root.appendChild(host);
      paint();
    },
  };
})();
