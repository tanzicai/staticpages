/* ==========================================================================
   页面 · 内容安全检测
   （文档与视频检测 / 词库与名单管理 / 用户风险统计 / 检测记录）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  const LEVEL_TONE = { 高: "red", 中: "amber", 低: "gray", 无: "emerald" };
  const LEVEL_RANK = { 高: 3, 中: 2, 低: 1, 无: 0 };

  function levelBadge(level) {
    return ZK.ui.badge(level === "无" ? "未命中" : level + "风险", LEVEL_TONE[level] || "gray", level !== "无");
  }

  function actionTone(action) {
    return action === "拦截并上报" ? "red" : action === "机器审核" ? "amber" : action === "仅记录" ? "gray" : "emerald";
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
      h("div", { class: "fs-18 fw-7", style: { color: color }, text: value }),
    ]);
  }

  /** 依据当前词库真实执行一次检测 */
  function scanTarget(target, kind) {
    if (kind === "视频") return ZK.engine.scanVideo(target);
    return ZK.engine.scanText(target.text || "");
  }

  /* ==================================================================
     一、文档与视频在线检测
     ================================================================== */
  P["safety/detect"] = {
    render(root) {
      let kind = "文档";
      let currentId = null;
      let result = null;

      root.appendChild(
        ZK.ui.pageHead({
          title: "敏感内容在线检测",
          sub: "对待发布的文档与视频执行实时检测：命中敏感关键词、结合忽略词做误判判定、给出处置动作与风险分，并自动写入检测记录。",
          actions: [
            h("button", { class: "btn btn-sm", text: "词库与名单管理", onclick: () => go("#/safety/lexicons") }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.scan(14) + "<span>全部检测</span>", onclick: () => runAll() }),
          ],
        })
      );

      const listHost = h("div", { class: "stack-12" });
      const resultHost = h("div", { class: "stack-16" });
      const progress = h("div", { class: "stack-8" });

      /* ---------- 左侧：待检测对象 ---------- */
      const leftCard = ZK.ui.card({
        title: "待检测对象",
        sub: "文档取正文，视频取字幕轨与画面帧信息",
        icon: ZK.icons.fileText(16),
        body: [
          h("div", { class: "tabs mb-12" }, [
            h("button", { class: "on", text: "文档 (" + ZK.db.list("safetyDocs").length + ")", dataset: { kind: "文档" }, onclick: (e) => pick("文档", e) }),
            h("button", { text: "视频 (" + ZK.db.list("safetyVideos").length + ")", dataset: { kind: "视频" }, onclick: (e) => pick("视频", e) }),
          ]),
          h("div", { class: "chip-wrap mb-12" }, [
            h("button", { class: "chip", text: "全部", onclick: () => paintList() }),
            h("button", { class: "chip", text: "仅未检测", onclick: () => paintList(true) }),
          ]),
          listHost,
        ],
      });

      /* ---------- 右侧：检测结果 ---------- */
      const rightCard = ZK.ui.card({
        title: "检测结果",
        sub: "命中项含类别、级别、处置动作、出现次数与上下文",
        icon: ZK.icons.shield(16),
        body: [progress, resultHost],
      });

      root.appendChild(h("div", { class: "grid grid-2" }, [leftCard, rightCard]));

      root.appendChild(
        ZK.ui.card({
          title: "检测口径说明",
          sub: "忽略词用于降低误判，命中词前后 10 字内出现忽略词时标记为疑似误判",
          icon: ZK.icons.info(16),
          body: [
            h("div", { class: "grid grid-3", style: { gap: "12px" } }, [
              note("风险分构成", "命中等级加权 × 9 + 命中密度 × 6，命中高等级词时不低于 62 分，未命中时不超过 8 分。"),
              note("处置动作", "出现高等级词 → 拦截并上报；仅中等级 → 机器审核；仅低等级 → 仅记录；无命中 → 放行。"),
              note("误判处理", "被忽略词命中的项不计入风险分，可在结果区一键加入忽略词库或按误判放行。"),
            ]),
          ],
        })
      );

      function note(title, desc) {
        return h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "12px 14px" } }, [
          h("div", { class: "fs-13 fw-6 strong mb-4", text: title }),
          h("div", { class: "fs-12 muted", style: { "line-height": "1.7" }, text: desc }),
        ]);
      }

      function pick(k, e) {
        kind = k;
        U.$$(".tabs button", leftCard).forEach((b) => b.classList.toggle("on", b.dataset.kind === kind));
        result = null;
        U.clear(resultHost);
        U.clear(progress);
        currentId = null;
        paintList();
      }

      function paintList(onlyPending) {
        U.clear(listHost);
        let rows = ZK.db.list(kind === "文档" ? "safetyDocs" : "safetyVideos");
        if (onlyPending) rows = rows.filter((r) => r.status === "pending");
        if (!rows.length) {
          listHost.appendChild(ZK.ui.empty({ title: "没有待检测对象", desc: "当前筛选条件下没有对象，可切换筛选条件。", icon: ZK.icons.checkCircle(22) }));
          return;
        }
        rows.forEach((r) => {
          const on = r.id === currentId;
          listHost.appendChild(
            h(
              "div",
              {
                class: "list-row",
                style: on ? { borderColor: "var(--accent-line)", background: "var(--accent-dim)" } : null,
                onclick: () => select(r),
              },
              [
                h("div", { class: "lr-icon " + (kind === "视频" ? "ic-blue" : "ic-emerald"), html: kind === "视频" ? ZK.icons.video(15) : ZK.icons.fileText(15) }),
                h("div", { class: "lr-main" }, [
                  h("b", { text: r.title }),
                  h("span", {
                    text:
                      kind === "视频"
                        ? r.author + " · " + Math.floor(r.duration / 60) + " 分 " + String(r.duration % 60).padStart(2, "0") + " 秒 · " + r.sizeMB + " MB · " + r.resolution
                        : r.author + " · " + r.type + " · " + r.sizeKB + " KB · " + U.num(r.words) + " 字",
                  }),
                ]),
                h("div", { class: "lr-tail" }, [
                  r.status === "pending" ? ZK.ui.badge("未检测", "amber") : ZK.ui.badge("已检测", "emerald"),
                  h("span", { class: "fs-11 faint", text: "上次 " + U.fmtDate(r.lastScanAt) }),
                ]),
              ]
            )
          );
        });
      }

      function select(r) {
        currentId = r.id;
        paintList();
        U.clear(progress);
        U.clear(resultHost);
        resultHost.appendChild(
          ZK.ui.empty({
            title: "已选择：" + U.truncate(r.title, 24),
            desc: "点击下方按钮开始在线检测。检测将读取" + (kind === "视频" ? "字幕轨" : "文档正文") + "并逐项比对敏感词库。",
            icon: ZK.icons.scan(22),
            action: h("button", { class: "btn btn-primary", html: ZK.icons.scan(14) + "<span>开始在线检测</span>", onclick: () => runOne(r) }),
          })
        );
      }

      function animate(label, done) {
        const fill = h("i", { style: { width: "0%" } });
        const pctText = h("span", { class: "pl-val", text: "0%" });
        U.clear(progress);
        progress.appendChild(
          h("div", {}, [
            h("div", { class: "row-between mb-8" }, [
              h("span", { class: "fs-12 muted", text: label }),
              pctText,
            ]),
            h("div", { class: "scan-bar" }, [fill]),
          ])
        );
        let p = 0;
        const timer = setInterval(() => {
          p = Math.min(100, p + Math.round(6 + Math.random() * 16));
          fill.style.width = p + "%";
          pctText.textContent = p + "%";
          if (p >= 100) {
            clearInterval(timer);
            setTimeout(done, 160);
          }
        }, 55);
      }

      function runOne(r) {
        animate("正在检测《" + U.truncate(r.title, 20) + "》…", () => {
          result = scanTarget(r, kind);
          renderResult(r);
          persist(r, result);
        });
      }

      function runAll() {
        const docs = ZK.db.list("safetyDocs");
        const vids = ZK.db.list("safetyVideos");
        const all = docs.map((d) => ({ r: d, k: "文档" })).concat(vids.map((v) => ({ r: v, k: "视频" })));
        const summary = { 高: 0, 中: 0, 低: 0, 无: 0 };
        animate("批量检测中：共 " + all.length + " 个对象…", () => {
          all.forEach((x) => {
            const res = scanTarget(x.r, x.k);
            summary[res.level] += 1;
            persist(x.r, res);
          });
          U.clear(progress);
          U.clear(resultHost);
          resultHost.appendChild(
            ZK.ui.card({
              title: "批量检测完成",
              sub: "共检测 " + all.length + " 个对象，结果已写入检测记录",
              icon: ZK.icons.checkCircle(16),
              body: [
                h("div", { class: "grid grid-4 mb-16" }, [
                  ZK.ui.statCard({ label: "高风险", value: String(summary["高"]), target: "已拦截上报", icon: ZK.icons.alert(18), tone: "red", progress: (summary["高"] / all.length) * 100 }),
                  ZK.ui.statCard({ label: "中风险", value: String(summary["中"]), target: "转机器审核", icon: ZK.icons.flag(18), tone: "amber", progress: (summary["中"] / all.length) * 100 }),
                  ZK.ui.statCard({ label: "低风险", value: String(summary["低"]), target: "仅记录", icon: ZK.icons.info(18), tone: "gray", progress: (summary["低"] / all.length) * 100 }),
                  ZK.ui.statCard({ label: "未命中", value: String(summary["无"]), target: "正常放行", icon: ZK.icons.checkCircle(18), tone: "emerald", progress: (summary["无"] / all.length) * 100 }),
                ]),
                h("button", { class: "btn btn-sm", text: "查看检测记录", onclick: () => go("#/safety/records") }),
              ],
            })
          );
          paintList();
          ZK.db.log("批量内容检测", "检测 " + all.length + " 个对象，高风险 " + summary["高"] + " 项");
          ZK.toast("批量检测完成，共 " + all.length + " 个对象");
        });
      }

      function persist(target, res) {
        ZK.db.update(kind === "视频" ? "safetyVideos" : "safetyDocs", target.id, { status: "scanned", lastScanAt: Date.now() });
        ZK.db.insert("safetyRecords", {
          id: U.uid("sr"),
          target: target.title,
          kind: kind,
          result: res.totalHits ? "命中 " + res.hitWords.length + " 项" : "未命中",
          level: res.level,
          action: res.action,
          hits: res.hitWords.slice(),
          ignored: res.ignoredWords.slice(),
          riskScore: res.riskScore,
          at: Date.now(),
          operator: (ZK.db.currentUser() || {}).name || "系统",
        });
        ZK.db.log("内容检测", "检测《" + target.title + "》：" + res.action + "（风险分 " + res.riskScore + "）");
      }

      function renderResult(target, res) {
        U.clear(resultHost);
        res = res || result;

        resultHost.appendChild(
          h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
            mini("命中项", String(res.hitWords.length), res.hitWords.length ? "danger" : "accent"),
            mini("命中次数", String(res.totalHits), res.totalHits ? "warn" : "accent"),
            mini("风险分", String(res.riskScore), res.riskScore >= 62 ? "danger" : res.riskScore >= 34 ? "warn" : "accent"),
            mini("处置动作", res.action, res.action === "拦截并上报" ? "danger" : res.action === "机器审核" ? "warn" : "accent"),
          ])
        );

        resultHost.appendChild(
          h("div", { class: "row-between mb-8" }, [
            h("div", { class: "row", style: { gap: "8px" } }, [
              h("span", { class: "fs-13 fw-6 strong", text: "检测结论" }),
              levelBadge(res.level),
              ZK.ui.badge(res.action, actionTone(res.action)),
            ]),
            h("div", { class: "row", style: { gap: "6px" } }, [
              h("button", { class: "btn btn-xs", text: "导出报告", onclick: () => exportReport(target, res) }),
              h("button", { class: "btn btn-xs", text: "重新检测", onclick: () => runOne(target) }),
            ]),
          ])
        );

        resultHost.appendChild(
          h("dl", { class: "kv" }, [
            h("dt", { text: "检测对象" }),
            h("dd", { text: target.title }),
            h("dt", { text: "检测方式" }),
            h("dd", {
              text:
                res.kind === "video"
                  ? "字幕轨 " + U.num(res.scannedLength) + " 字 + 画面帧 " + res.frames.length + " 帧（" + res.resolution + "，像素系数 " + res.pixelFactor + "）"
                  : "全文 " + U.num(res.scannedLength) + " 字",
            }),
            h("dt", { text: "命中密度" }),
            h("dd", { text: res.density + " 每千字" }),
            h("dt", { text: "疑似误判" }),
            h("dd", { text: res.ignoredWords.length ? res.ignoredWords.join("、") : "无" }),
          ])
        );

        if (res.hitWords.length) {
          resultHost.appendChild(h("div", { class: "sb-group-title", text: "命中明细" }));
          res.hits.forEach((hit, i) => {
            resultHost.appendChild(hitCard(hit, i, target, res));
          });
        } else {
          resultHost.appendChild(
            ZK.ui.empty({
              title: "未命中任何敏感词",
              desc: "该" + (res.kind === "video" ? "视频" : "文档") + "内容未命中当前词库，按策略放行。",
              icon: ZK.icons.checkCircle(22),
            })
          );
        }

        if (res.ignored.length) {
          resultHost.appendChild(h("div", { class: "sb-group-title", text: "疑似误判（已按忽略词放行）" }));
          res.ignored.forEach((ig) => {
            resultHost.appendChild(
              h("div", { class: "advice info" }, [
                h("b", { text: "「" + ig.word + "」命中，但被判为误判" }),
                h("div", { class: "fs-12 muted mt-4", text: "忽略词「" + ig.ignoredBy + "」： " + ig.ignoreReason }),
                h("div", { class: "fs-12 faint mt-4", text: "上下文：" + ig.context }),
              ])
            );
          });
        }

        if (res.kind === "video") {
          resultHost.appendChild(h("div", { class: "sb-group-title", text: "画面帧抽检（每 10 秒取帧）" }));
          resultHost.appendChild(
            h("div", { class: "grid grid-4", style: { gap: "8px" } },
              res.frames.slice(0, 8).map((f) =>
                h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-md)", padding: "8px 10px" } }, [
                  h("div", { class: "fs-11 ghost", text: "第 " + f.index + " 帧 · " + Math.floor(f.at / 60) + ":" + String(f.at % 60).padStart(2, "0") }),
                  h("div", { class: "fs-12 muted", style: { "line-height": "1.6" }, text: f.text || "（静音段）" }),
                  f.dense ? h("span", { class: "badge badge-amber mt-8", text: "信息密集帧" }) : null,
                ])
              )
            )
          );
        }
      }

      function mini(label, value, tone) {
        const col = { danger: "var(--danger-bright)", warn: "var(--warn-bright)", accent: "var(--accent-bright)" }[tone];
        return h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
          h("div", { class: "fs-11 ghost", text: label }),
          h("div", { class: "fs-18 fw-7", style: { color: col, "line-height": "1.5" }, text: value }),
        ]);
      }

      function hitCard(hit, i, target, res) {
        return ZK.ui.card({
          class: "mb-8",
          title: hit.word,
          sub: hit.category + " · " + hit.level + "等级 · 建议 " + hit.action + " · 出现 " + hit.count + " 次",
          icon: ZK.icons.alert(16),
          actions: [
            levelBadge(hit.level),
            h("button", {
              class: "btn btn-xs",
              text: "定位词库",
              onclick: () => {
                ZK.toast("已定位到词库中的「" + hit.word + "」");
                go("#/safety/lexicons");
              },
            }),
            h("button", {
              class: "btn btn-xs btn-danger",
              text: "判定为误判",
              onclick: async () => {
                if (!hit.context) return;
                const ok = await ZK.confirm({
                  title: "判定为误判",
                  message: "将把「<b>" + U.escapeHtml(hit.word) + "</b>」的当前上下文加入忽略词库，后续相同语境不再计入风险。<br>该操作不会影响已发生的命中记录。",
                  okText: "加入忽略词库",
                });
                if (!ok) return;
                ZK.db.insert("ignoreWords", {
                  id: U.uid("ig"),
                  word: hit.word,
                  scene: "复核判定误判：" + U.truncate(hit.context, 40),
                  addedBy: (ZK.db.currentUser() || {}).name || "系统",
                  enabled: true,
                  addedAt: Date.now(),
                });
                ZK.db.log("忽略词新增", "将「" + hit.word + "」加入忽略词库");
                ZK.toast("已加入忽略词库");
                runOne(target);
              },
            }),
          ],
          body: [
            h("div", { class: "corpus-box" }, [h("div", { class: "corpus", html: ZK.engine.markHits(hit.context, [hit.word]) })]),
            h("div", { class: "fs-11 faint mt-8", text: "第 " + (i + 1) + " 项命中 · 词长 " + hit.word.length + " 字 · 处置动作 " + hit.action }),
          ],
        });
      }

      function exportReport(target, res) {
        const lines = [
          "内容安全检测报告",
          "检测对象：" + target.title,
          "检测时间：" + U.fmtDateTime(Date.now()),
          "检测方式：" + (res.kind === "video" ? "视频（字幕 + 画面帧）" : "文档（全文）"),
          "命中项数：" + res.hitWords.length,
          "命中次数：" + res.totalHits,
          "风险分：" + res.riskScore,
          "等级：" + res.level,
          "处置动作：" + res.action,
          "",
          "命中明细：",
        ].concat(res.hits.map((x) => "- " + x.word + "（" + x.category + "/" + x.level + "）× " + x.count + "　上下文：" + x.context));
        if (res.ignored.length) {
          lines.push("", "疑似误判：");
          res.ignored.forEach((x) => lines.push("- " + x.word + "　忽略词：" + x.ignoredBy + "　理由：" + x.ignoreReason));
        }
        U.download("检测报告-" + target.title.replace(/[\\/:*?"<>|]/g, "_") + ".txt", lines.join("\n"));
        ZK.toast("检测报告已导出");
      }

      paintList();
      resultHost.appendChild(
        ZK.ui.empty({
          title: "请选择待检测对象",
          desc: "从左侧列表选择一个文档或视频，点击检测后即可看到命中明细与处置结论。",
          icon: ZK.icons.scan(22),
        })
      );
    },
  };

  /* ==================================================================
     二、词库与名单管理
     ================================================================== */
  P["safety/lexicons"] = {
    render(root) {
      let tab = "keywords";

      root.appendChild(
        ZK.ui.pageHead({
          title: "词库与名单管理",
          sub: "维护自定义敏感关键词、忽略词与用户黑白名单，三者共同决定检测的命中与误判判定。",
          actions: [
            h("button", { class: "btn btn-sm", text: "前往检测", onclick: () => go("#/safety/detect") }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.plus(14) + "<span>新增</span>", onclick: () => openAdd() }),
          ],
        })
      );

      const bodyHost = h("div", { class: "stack-16" });
      const tabBar = ZK.ui.tabs(
        [
          { id: "keywords", name: "敏感关键词 (" + ZK.db.list("safetyKeywords").length + ")" },
          { id: "ignores", name: "忽略词 (" + ZK.db.list("ignoreWords").length + ")" },
          { id: "names", name: "用户黑白名单 (" + ZK.db.list("nameLists").length + ")" },
        ],
        tab,
        (id) => {
          tab = id;
          paintTabs();
          paint();
        }
      );

      root.appendChild(h("div", { class: "mb-16" }, [tabBar]));
      root.appendChild(bodyHost);

      function paintTabs() {
        U.$$("button", tabBar).forEach((b, i) => b.classList.toggle("on", ["keywords", "ignores", "names"][i] === tab));
      }

      function paint() {
        U.clear(bodyHost);
        if (tab === "keywords") paintKeywords();
        else if (tab === "ignores") paintIgnores();
        else paintNames();
      }

      /* ---------------- 敏感关键词 ---------------- */
      function paintKeywords() {
        const cats = Array.from(new Set(ZK.db.list("safetyKeywords").map((k) => k.category)));
        const catFilter = h("select", { class: "select", style: { width: "150px" } }, [h("option", { value: "", text: "全部类别" })].concat(cats.map((c) => h("option", { value: c, text: c }))));
        const lvFilter = h("select", { class: "select", style: { width: "120px" } }, ["全部级别", "高", "中", "低"].map((v) => h("option", { value: v === "全部级别" ? "" : v, text: v })));

        const host = h("div");
        bodyHost.appendChild(
          ZK.ui.card({
            title: "敏感关键词库",
            sub: "支持自定义关键词、类别、风险级别与处置动作；开启整词匹配可降低「加微信」类词的部分误伤",
            icon: ZK.icons.tag(16),
            actions: [
              catFilter,
              lvFilter,
              h("button", { class: "btn btn-xs", text: "导出词库", onclick: exportKeywords }),
            ],
            body: [host],
          })
        );

        function rebuild() {
          let rows = ZK.db.list("safetyKeywords");
          const c = catFilter.value;
          const l = lvFilter.value;
          if (c) rows = rows.filter((k) => k.category === c);
          if (l) rows = rows.filter((k) => k.level === l);
          U.clear(host);
          host.appendChild(
            ZK.ui.table({
              rows: rows,
              pageSize: 8,
              searchKeys: ["word", "category"],
              sortKey: "hits",
              sortDir: "desc",
              columns: [
                { key: "word", label: "关键词", sortable: true, render: (r) => h("span", { class: "cell-strong", text: r.word }) },
                { key: "category", label: "类别", sortable: true, render: (r) => ZK.ui.badge(r.category, "violet") },
                { key: "level", label: "级别", sortable: true, render: (r) => levelBadge(r.level) },
                { key: "action", label: "处置动作", render: (r) => ZK.ui.badge(r.action, actionTone(r.action)) },
                { key: "wholeWord", label: "整词匹配", render: (r) => (r.wholeWord ? ZK.ui.badge("启用", "cyan") : h("span", { class: "faint", text: "模糊" })) },
                { key: "hits", label: "累计命中", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", text: U.num(r.hits) }) },
                {
                  key: "enabled",
                  label: "状态",
                  render: (r) =>
                    h("button", {
                      class: "switch" + (r.enabled ? " on" : ""),
                      title: r.enabled ? "点击停用" : "点击启用",
                      onclick() {
                        ZK.db.update("safetyKeywords", r.id, { enabled: !r.enabled });
                        ZK.toast("「" + r.word + "」已" + (r.enabled ? "停用" : "启用"));
                        rebuild();
                      },
                    }),
                },
                {
                  key: "op",
                  label: "操作",
                  render: (r) =>
                    h("div", { class: "row", style: { gap: "4px" } }, [
                      h("button", { class: "btn btn-xs", text: "编辑", onclick: () => openEditKw(r) }),
                      h("button", {
                        class: "btn btn-xs btn-danger",
                        text: "删除",
                        onclick: async () => {
                          const ok = await ZK.confirm({ title: "删除关键词", message: "确定删除敏感词「" + U.escapeHtml(r.word) + "」吗？", danger: true, okText: "删除" });
                          if (!ok) return;
                          ZK.db.remove("safetyKeywords", r.id);
                          ZK.db.log("删除敏感词", "删除「" + r.word + "」");
                          ZK.toast("已删除");
                          rebuild();
                        },
                      }),
                    ]),
                },
              ],
            })
          );
        }

        catFilter.addEventListener("change", rebuild);
        lvFilter.addEventListener("change", rebuild);
        rebuild();

        function exportKeywords() {
          const rows = [["关键词", "类别", "级别", "处置动作", "整词匹配", "累计命中", "状态"]];
          ZK.db.list("safetyKeywords").forEach((k) => rows.push([k.word, k.category, k.level, k.action, k.wholeWord ? "是" : "否", k.hits, k.enabled ? "启用" : "停用"]));
          U.downloadCsv("敏感词库.csv", rows);
          ZK.toast("词库已导出");
        }
      }

      function openEditKw(k) {
        const word = h("input", { class: "input", value: k.word });
        const category = h("input", { class: "input", value: k.category });
        const level = h("select", { class: "select" }, ["高", "中", "低"].map((v) => h("option", { value: v, text: v, selected: v === k.level ? true : null })));
        const action = h("select", { class: "select" }, ["拦截并上报", "机器审核", "仅记录"].map((v) => h("option", { value: v, text: v, selected: v === k.action ? true : null })));
        const whole = h("input", { type: "checkbox", checked: k.wholeWord ? true : null });
        openKwModal("编辑敏感关键词", { word, category, level, action, whole }, (data) => {
          ZK.db.update("safetyKeywords", k.id, data);
          ZK.db.log("编辑敏感词", "更新「" + k.word + "」");
          ZK.toast("已保存修改");
        });
      }

      function openAdd() {
        if (tab === "keywords") {
          const word = h("input", { class: "input", placeholder: "例如：代写论文" });
          const category = h("input", { class: "input", placeholder: "例如：学术不端" });
          const level = h("select", { class: "select" }, ["高", "中", "低"].map((v) => h("option", { value: v, text: v })));
          const action = h("select", { class: "select" }, ["拦截并上报", "机器审核", "仅记录"].map((v) => h("option", { value: v, text: v })));
          const whole = h("input", { type: "checkbox" });
          openKwModal("新增敏感关键词", { word, category, level, action, whole }, (data) => {
            if (!data.word) return false;
            ZK.db.insert("safetyKeywords", Object.assign({ id: U.uid("kw"), hits: 0, enabled: true, addedBy: (ZK.db.currentUser() || {}).name || "系统", addedAt: Date.now() }, data));
            ZK.db.log("新增敏感词", "新增「" + data.word + "」");
            ZK.toast("敏感词已新增");
            return true;
          });
        } else if (tab === "ignores") {
          const word = h("input", { class: "input", placeholder: "例如：链接" });
          const scene = h("textarea", { class: "textarea", placeholder: "说明该词在什么语境下属于正常表述" });
          ZK.modal({
            title: "新增忽略词",
            render(api) {
              api.body.appendChild(h("div", { class: "stack-16" }, [field("忽略词", word), field("适用场景说明", scene)]));
              api.setFooter([
                h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
                h("button", {
                  class: "btn btn-primary",
                  text: "保存",
                  onclick() {
                    if (!word.value.trim()) return ZK.toast("请填写忽略词", "danger");
                    ZK.db.insert("ignoreWords", { id: U.uid("ig"), word: word.value.trim(), scene: scene.value.trim() || "自定义忽略", addedBy: (ZK.db.currentUser() || {}).name || "系统", enabled: true, addedAt: Date.now() });
                    ZK.db.log("新增忽略词", "新增「" + word.value.trim() + "」");
                    api.close();
                    ZK.toast("忽略词已新增");
                    paint();
                  },
                }),
              ]);
            },
          });
        } else {
          openNameAdd();
        }
      }

      function openKwModal(title, els, onSave) {
        ZK.modal({
          title: title,
          sub: "处置动作决定命中后的处理链路",
          render(api) {
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                field("关键词", els.word, true),
                field("类别", els.category),
                field("风险级别", els.level),
                field("处置动作", els.action),
                h("div", { class: "field" }, [h("label", { class: "label", text: "整词匹配" }), h("label", { class: "check" }, [els.whole, h("span", { text: "仅整词命中时才判定（降低误伤）" })])]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "保存",
                onclick() {
                  const data = {
                    word: els.word.value.trim(),
                    category: els.category.value.trim() || "自定义",
                    level: els.level.value,
                    action: els.action.value,
                    wholeWord: !!els.whole.checked,
                  };
                  if (!data.word) return ZK.toast("请填写关键词", "danger");
                  const r = onSave(data);
                  if (r === false) return;
                  api.close();
                  paint();
                },
              }),
            ]);
          },
        });
      }

      /* ---------------- 忽略词 ---------------- */
      function paintIgnores() {
        const host = h("div");
        bodyHost.appendChild(
          ZK.ui.card({
            title: "忽略词库",
            sub: "命中词前后 10 字内出现忽略词时，该命中项被判为疑似误判，不计入风险分",
            icon: ZK.icons.filter(16),
            actions: [
              h("button", {
                class: "btn btn-xs",
                text: "命中测试",
                onclick: () => openIgnoreTest(),
              }),
            ],
            body: [host],
          })
        );
        function rebuild() {
          const rows = ZK.db.list("ignoreWords");
          U.clear(host);
          host.appendChild(
            ZK.ui.table({
              rows: rows,
              pageSize: 8,
              searchKeys: ["word", "scene"],
              columns: [
                { key: "word", label: "忽略词", render: (r) => h("span", { class: "cell-strong", text: r.word }) },
                { key: "scene", label: "适用场景", render: (r) => h("span", { class: "cell-muted", text: U.truncate(r.scene, 62) }) },
                { key: "addedBy", label: "添加人" },
                { key: "addedAt", label: "添加时间", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtDate(r.addedAt) }) },
                {
                  key: "enabled",
                  label: "状态",
                  render: (r) =>
                    h("button", {
                      class: "switch" + (r.enabled ? " on" : ""),
                      onclick() {
                        ZK.db.update("ignoreWords", r.id, { enabled: !r.enabled });
                        rebuild();
                      },
                    }),
                },
                {
                  key: "op",
                  label: "操作",
                  render: (r) =>
                    h("button", {
                      class: "btn btn-xs btn-danger",
                      text: "删除",
                      onclick: async () => {
                        const ok = await ZK.confirm({ title: "删除忽略词", message: "删除后「" + U.escapeHtml(r.word) + "」将不再豁免。", danger: true, okText: "删除" });
                        if (!ok) return;
                        ZK.db.remove("ignoreWords", r.id);
                        rebuild();
                        ZK.toast("已删除");
                      },
                    }),
                },
              ],
            })
          );
        }
        rebuild();
      }

      function openIgnoreTest() {
        const input = h("textarea", { class: "textarea", placeholder: "粘贴一段文本，例如：免费公开课的参考资料链接已上传至课程群。" });
        const out = h("div", { class: "mt-12" });
        ZK.modal({
          title: "忽略词命中测试",
          sub: "实时按当前词库执行检测，观察忽略词是否生效",
          size: "lg",
          render(api) {
            api.body.appendChild(h("div", { class: "stack-12" }, [field("待测文本", input), out]));
            input.addEventListener("input", U.debounce(run, 220));
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
            function run() {
              U.clear(out);
              if (!input.value.trim()) return;
              const res = ZK.engine.scanText(input.value);
              out.appendChild(
                h("div", { class: "stack-12" }, [
                  h("div", { class: "row", style: { gap: "8px" } }, [
                    levelBadge(res.level),
                    ZK.ui.badge(res.action, actionTone(res.action)),
                    ZK.ui.badge("风险分 " + res.riskScore, res.riskScore >= 62 ? "red" : res.riskScore >= 34 ? "amber" : "emerald"),
                  ]),
                  h("div", { class: "corpus-box" }, [h("div", { class: "corpus", html: ZK.engine.markHits(input.value, res.hitWords) })]),
                  h("div", { class: "fs-12 muted", text: "命中 " + (res.hitWords.join("、") || "—") + "；疑似误判 " + (res.ignoredWords.join("、") || "—") }),
                ])
              );
            }
          },
        });
      }

      /* ---------------- 用户黑白名单 ---------------- */
      function paintNames() {
        const typeFilter = h("select", { class: "select", style: { width: "140px" } }, [
          h("option", { value: "", text: "全部名单" }),
          h("option", { value: "black", text: "仅黑名单" }),
          h("option", { value: "white", text: "仅白名单" }),
        ]);
        const host = h("div");
        bodyHost.appendChild(
          ZK.ui.card({
            title: "用户黑白名单",
            sub: "黑名单用户命中后直接执行拦截并计入风险统计；白名单用户享受策略豁免，风险值下调 18 分",
            icon: ZK.icons.users(16),
            actions: [typeFilter, h("button", { class: "btn btn-xs", text: "新增名单", onclick: () => openNameAdd() })],
            body: [host],
          })
        );
        function rebuild() {
          let rows = ZK.db.list("nameLists");
          if (typeFilter.value) rows = rows.filter((r) => r.type === typeFilter.value);
          U.clear(host);
          host.appendChild(
            ZK.ui.table({
              rows: rows,
              pageSize: 8,
              searchKeys: ["name", "account", "org", "reason"],
              columns: [
                {
                  key: "type",
                  label: "名单类型",
                  sortable: true,
                  render: (r) => (r.type === "black" ? ZK.ui.badge("黑名单", "red", true) : ZK.ui.badge("白名单", "emerald", true)),
                },
                { key: "name", label: "姓名", render: (r) => h("span", { class: "cell-strong", text: r.name }) },
                { key: "account", label: "账号", render: (r) => h("span", { class: "mono fs-12", text: r.account }) },
                { key: "org", label: "所属单位" },
                { key: "reason", label: "加入原因", render: (r) => h("span", { class: "cell-muted", text: U.truncate(r.reason, 34) }) },
                { key: "validDays", label: "有效期", align: "right", sortable: true, render: (r) => r.validDays + " 天" },
                { key: "addedAt", label: "加入时间", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtDate(r.addedAt) }) },
                {
                  key: "op",
                  label: "操作",
                  render: (r) =>
                    h("div", { class: "row", style: { gap: "4px" } }, [
                      h("button", {
                        class: "btn btn-xs",
                        text: r.type === "black" ? "转白名单" : "转黑名单",
                        onclick: () => {
                          ZK.db.update("nameLists", r.id, { type: r.type === "black" ? "white" : "black" });
                          ZK.db.log("调整名单", r.name + " 调整为" + (r.type === "black" ? "白名单" : "黑名单"));
                          ZK.toast("名单类型已调整");
                          rebuild();
                        },
                      }),
                      h("button", {
                        class: "btn btn-xs btn-danger",
                        text: "移出",
                        onclick: async () => {
                          const ok = await ZK.confirm({ title: "移出名单", message: "将「" + U.escapeHtml(r.name) + "」移出名单？之后按其内容行为重新计算风险。", danger: true, okText: "移出" });
                          if (!ok) return;
                          ZK.db.remove("nameLists", r.id);
                          ZK.db.log("移出名单", r.name + " 已移出名单");
                          rebuild();
                          ZK.toast("已移出名单");
                        },
                      }),
                    ]),
                },
              ],
            })
          );
        }
        typeFilter.addEventListener("change", rebuild);
        rebuild();
      }

      function openNameAdd() {
        const learners = ZK.db.list("learners");
        const pick = h("select", { class: "select" }, learners.slice(0, 40).map((l) => h("option", { value: l.id, text: l.name + " · " + l.sno + " · " + (l.cls || "") })));
        const type = h("select", { class: "select" }, [h("option", { value: "black", text: "黑名单" }), h("option", { value: "white", text: "白名单" })]);
        const reason = h("textarea", { class: "textarea", placeholder: "说明加入名单的依据，例如：连续三次发布兼职刷单类内容" });
        const days = h("input", { class: "input", type: "number", value: "30" });
        ZK.modal({
          title: "新增名单用户",
          render(api) {
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "选择用户" }), pick]),
                field("名单类型", type),
                field("有效期（天）", days),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "加入原因" }), reason]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "加入名单",
                onclick() {
                  const l = ZK.db.find("learners", pick.value) || {};
                  if (!reason.value.trim()) return ZK.toast("请填写加入原因", "danger");
                  ZK.db.insert("nameLists", {
                    id: U.uid("nl"),
                    type: type.value,
                    account: l.sno,
                    name: l.name,
                    org: l.cls || "",
                    reason: reason.value.trim(),
                    addedBy: (ZK.db.currentUser() || {}).name || "系统",
                    validDays: Number(days.value) || 30,
                    addedAt: Date.now(),
                    enabled: true,
                  });
                  ZK.db.log("新增名单", l.name + " 加入" + (type.value === "black" ? "黑名单" : "白名单"));
                  api.close();
                  ZK.toast("已加入名单");
                  paint();
                },
              }),
            ]);
          },
        });
      }

      paint();
      paintTabs();
    },
  };

  /* ==================================================================
     三、用户风险统计
     ================================================================== */
  P["safety/risk"] = {
    render(root) {
      const { rows, summary } = ZK.engine.userRisk();

      root.appendChild(
        ZK.ui.pageHead({
          title: "用户风险统计",
          sub: "按用户风险值、垃圾发布量、垃圾发布率三个维度统计内容风险，风险值 = 垃圾发布率 × 50% + 内容严重度 × 35% + 名单状态 × 15%。",
          actions: [
            h("button", { class: "btn btn-sm", text: "词库与名单", onclick: () => go("#/safety/lexicons") }),
            h("button", { class: "btn btn-sm", text: "导出风险报表", onclick: () => exportRisk(rows) }),
          ],
        })
      );

      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({ label: "有发布行为的用户", value: String(summary.activeUsers), target: "平台用户 " + summary.users + " 人", icon: ZK.icons.users(18), tone: "blue", progress: (summary.activeUsers / Math.max(1, summary.users)) * 100 }),
          ZK.ui.statCard({ label: "风险用户数", value: String(summary.riskyUsers), target: "风险值 ≥ 40", icon: ZK.icons.shieldAlert(18), tone: "amber", progress: Math.min(100, summary.riskyUsers * 12) }),
          ZK.ui.statCard({ label: "垃圾发布量", value: String(summary.spamPosts), target: "占总发布 " + summary.totalPosts + " 条", icon: ZK.icons.flag(18), tone: "red", progress: summary.spamRate }),
          ZK.ui.statCard({ label: "垃圾发布率", value: U.pct(summary.spamRate), target: "全平台口径", icon: ZK.icons.chart(18), tone: "violet", progress: summary.spamRate * 4 }),
        ])
      );

      /* 风险分档 + 命中词分布 */
      const hi = rows.filter((r) => r.riskScore >= 70).length;
      const mid = rows.filter((r) => r.riskScore >= 40 && r.riskScore < 70).length;
      const low = rows.filter((r) => r.riskScore < 40).length;
      const wordCount = {};
      rows.forEach((r) => (r.hitWords || []).forEach((w) => (wordCount[w] = (wordCount[w] || 0) + r.hitCount)));
      const topWords = Object.keys(wordCount)
        .map((w) => ({ label: U.truncate(w, 5), value: wordCount[w], tone: "red" }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      root.appendChild(
        h("div", { class: "grid grid-2 mb-16" }, [
          ZK.ui.card({
            title: "风险等级分布",
            sub: "按用户风险值分档",
            icon: ZK.icons.bars(16),
            body: [
              h("div", { class: "grid grid-3 mb-16" }, [
                ringBox("高风险", hi, "#1d4ed8"),
                ringBox("中风险", mid, "#0ea5e9"),
                ringBox("低风险", low, "#2563eb"),
              ]),
              h("div", { class: "fs-12 muted", text: "高风险用户将由系统自动拦截其内容发布，并推送至教学管理员与学院审核人。" }),
            ],
          }),
          ZK.ui.card({
            title: "高频命中词 TOP 10",
            sub: "统计风险用户命中过的敏感词次数",
            icon: ZK.icons.tag(16),
            body: [topWords.length ? ZK.ui.bars({ data: topWords }) : h("div", { class: "fs-12 faint", text: "当前没有命中记录。" })],
          }),
        ])
      );

      /* 明细表 */
      const levelFilter = h("select", { class: "select", style: { width: "150px" } }, [
        h("option", { value: "", text: "全部风险等级" }),
        h("option", { value: "high", text: "仅高风险" }),
        h("option", { value: "mid", text: "仅中风险" }),
        h("option", { value: "low", text: "仅低风险" }),
      ]);
      const tableHost = h("div");

      root.appendChild(
        ZK.ui.card({
          title: "用户风险明细",
          sub: "风险值、垃圾发布量、垃圾发布率三维度并列呈现，可直接执行名单处置",
          icon: ZK.icons.shieldAlert(16),
          actions: [levelFilter, h("button", { class: "btn btn-xs", text: "导出报表", onclick: () => exportRisk(rows) })],
          body: [tableHost],
        })
      );

      function rebuild() {
        let list = rows;
        if (levelFilter.value) list = rows.filter((r) => r.riskLevel.key === levelFilter.value);
        U.clear(tableHost);
        if (!list.length) {
          tableHost.appendChild(ZK.ui.empty({ title: "没有符合条件的用户", desc: "调整筛选条件后重试。", icon: ZK.icons.checkCircle(22) }));
          return;
        }
        tableHost.appendChild(
          ZK.ui.table({
            rows: list,
            pageSize: 10,
            searchKeys: ["name", "sno", "cls"],
            sortKey: "riskScore",
            sortDir: "desc",
            columns: [
              { key: "name", label: "用户", sortable: true, render: (r) => h("div", {}, [h("div", { class: "cell-strong", text: r.name }), h("div", { class: "fs-11 faint", text: r.sno + " · " + r.cls })]) },
              { key: "total", label: "发布量", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", text: r.total }) },
              { key: "spam", label: "垃圾发布量", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", style: { color: r.spam ? "var(--danger-bright)" : "var(--text-faint)" }, text: r.spam }) },
              { key: "spamRate", label: "垃圾发布率", align: "right", sortable: true, render: (r) => ZK.ui.progressLine(r.spamRate, r.spamRate >= 30 ? "red" : r.spamRate >= 10 ? "amber" : "emerald", U.pct(r.spamRate)) },
              { key: "riskScore", label: "风险值", align: "right", sortable: true, render: (r) => h("span", { class: r.riskLevel.key === "high" ? "risk-high" : r.riskLevel.key === "mid" ? "risk-mid" : "risk-low", text: r.riskScore }) },
              { key: "riskLevel", label: "等级", render: (r) => ZK.ui.badge(r.riskLevel.label, r.riskLevel.key === "high" ? "red" : r.riskLevel.key === "mid" ? "amber" : "emerald", true) },
              { key: "listType", label: "名单状态", render: (r) => (r.listType === "black" ? ZK.ui.badge("黑名单", "red") : r.listType === "white" ? ZK.ui.badge("白名单", "emerald") : h("span", { class: "faint", text: "—" })) },
              {
                key: "op",
                label: "操作",
                render: (r) =>
                  h("div", { class: "row", style: { gap: "4px" } }, [
                    h("button", { class: "btn btn-xs", text: "风险详情", onclick: () => openDetail(r) }),
                    r.listType === "black"
                      ? h("button", {
                          class: "btn btn-xs",
                          text: "移出黑名单",
                          onclick: () => {
                            const rec = ZK.db.list("nameLists", (x) => x.account === r.sno)[0];
                            if (rec) ZK.db.remove("nameLists", rec.id);
                            ZK.db.log("移出黑名单", r.name + " 已移出黑名单");
                            ZK.toast("已移出黑名单");
                            ZK.app.refresh();
                          },
                        })
                      : h("button", {
                          class: "btn btn-xs btn-danger",
                          text: "加入黑名单",
                          onclick: () => addBlack(r),
                        }),
                  ]),
              },
            ],
          })
        );
      }

      function ringBox(label, count, color) {
        return h("div", { class: "center" }, [ZK.ui.ring({ size: 84, pct: rows.length ? (count / rows.length) * 100 : 0, color: color, text: String(count), sub: label })]);
      }

      function addBlack(r) {
        ZK.modal({
          title: "加入黑名单",
          sub: r.name + " · " + r.sno + " · " + r.cls,
          render(api) {
            const reason = h("textarea", { class: "textarea", value: "风险值 " + r.riskScore + "，垃圾发布 " + r.spam + " 条（垃圾发布率 " + r.spamRate + "%），命中 " + (r.hitWords.join("、") || "无") });
            const days = h("input", { class: "input", type: "number", value: "30" });
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                h("div", { class: "advice info" }, [
                  h("div", { class: "fs-12 muted", text: "风险值构成：垃圾发布率 " + r.spamRate + "% × 50% + 内容严重度 " + Math.min(r.weighted * 8, 100) + " × 35% + 名单状态 15%" }),
                ]),
                field("加入原因", reason),
                field("有效期（天）", days),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-danger",
                text: "确认加入黑名单",
                onclick() {
                  ZK.db.insert("nameLists", {
                    id: U.uid("nl"),
                    type: "black",
                    account: r.sno,
                    name: r.name,
                    org: r.cls,
                    reason: reason.value.trim(),
                    addedBy: (ZK.db.currentUser() || {}).name || "系统",
                    validDays: Number(days.value) || 30,
                    addedAt: Date.now(),
                    enabled: true,
                  });
                  ZK.db.log("加入黑名单", r.name + "（风险值 " + r.riskScore + "）已加入黑名单");
                  ZK.toast("已加入黑名单");
                  api.close();
                  ZK.app.refresh();
                },
              }),
            ]);
          },
        });
      }

      function openDetail(r) {
        const posts = ZK.db.list("posts", (p) => p.learnerId === r.id);
        ZK.modal({
          title: "用户风险详情 · " + r.name,
          sub: r.sno + " · " + r.cls + " · 风险等级 " + r.riskLevel.label,
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
                  statBox("风险值", String(r.riskScore), r.riskLevel.key === "high" ? "var(--danger-bright)" : r.riskLevel.key === "mid" ? "var(--warn-bright)" : "var(--accent-bright)"),
                  statBox("垃圾发布量", String(r.spam), "var(--danger-bright)"),
                  statBox("垃圾发布率", U.pct(r.spamRate), "var(--warn-bright)"),
                  statBox("发布总量", String(r.total), "var(--info-bright)"),
                ]),
                ZK.ui.kv([
                  ["命中敏感词", r.hitWords.length ? r.hitWords.join("、") : "无"],
                  ["命中总次数", String(r.hitCount)],
                  ["内容严重度加权", String(r.weighted) + "（高 3 / 中 2 / 低 1 加权累计）"],
                  ["最近垃圾发布", r.lastSpamAt ? U.fmtDate(r.lastSpamAt) : "—"],
                  ["发布平台分布", Object.keys(r.platforms).map((k) => k + " " + r.platforms[k] + " 条").join(" · ") || "—"],
                  ["名单状态", r.listType === "black" ? "黑名单（" + r.listReason + "）" : r.listType === "white" ? "白名单" : "未加入名单"],
                ]),
                r.hitWords.length
                  ? ZK.ui.card({
                      title: "命中词分布",
                      body: [ZK.ui.bars({ data: r.hitWords.map((w) => ({ label: U.truncate(w, 5), value: (wordCount[w] || 1), tone: "red", tip: w + "：" + (wordCount[w] || 1) + " 次" })) })],
                    })
                  : null,
                ZK.ui.card({
                  title: "该用户发布内容（" + posts.length + " 条）",
                  body: posts.length
                    ? [
                        h("div", { class: "row-list" }, posts.slice(0, 8).map((p) =>
                          h("div", { class: "list-row" }, [
                            h("div", { class: "lr-icon " + (p.isSpam ? "ic-red" : "ic-emerald"), html: ZK.icons.message(15) }),
                            h("div", { class: "lr-main" }, [
                              h("b", { text: U.truncate(p.content, 40) }),
                              h("span", { text: p.platform + " · " + U.fmtDate(p.createdAt) + (p.hits.length ? " · 命中 " + p.hits.join("、") : "") }),
                            ]),
                            h("div", { class: "lr-tail" }, [p.isSpam ? ZK.ui.badge(p.level + "风险", p.level === "高" ? "red" : "amber") : ZK.ui.badge("正常", "emerald")]),
                          ])
                        )),
                      ]
                    : [h("div", { class: "fs-12 faint", text: "该用户暂无发布记录。" })],
                }),
              ])
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }

      function exportRisk(list) {
        const csv = [["姓名", "学号", "班级", "发布量", "垃圾发布量", "垃圾发布率(%)", "风险值", "风险等级", "名单状态", "命中敏感词"]];
        list.forEach((r) => csv.push([r.name, r.sno, r.cls, r.total, r.spam, r.spamRate, r.riskScore, r.riskLevel.label, r.listType === "black" ? "黑名单" : r.listType === "white" ? "白名单" : "—", r.hitWords.join("、")]));
        U.downloadCsv("用户风险统计.csv", csv);
        ZK.db.log("导出风险报表", "导出 " + list.length + " 条用户风险数据");
        ZK.toast("风险报表已导出");
      }

      levelFilter.addEventListener("change", rebuild);
      rebuild();
    },
  };

  /* ==================================================================
     四、检测记录
     ================================================================== */
  P["safety/records"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "检测记录",
          sub: "所有文档与视频检测任务的执行留档，含命中结果、处置动作与操作人。",
          actions: [
            h("button", { class: "btn btn-sm", text: "前往检测", onclick: () => go("#/safety/detect") }),
            h("button", { class: "btn btn-sm", text: "导出记录", onclick: () => exportRecords() }),
          ],
        })
      );

      const kindFilter = h("select", { class: "select", style: { width: "130px" } }, [
        h("option", { value: "", text: "全部类型" }),
        h("option", { value: "文档", text: "仅文档" }),
        h("option", { value: "视频", text: "仅视频" }),
      ]);
      const levelFilter = h("select", { class: "select", style: { width: "140px" } }, [
        h("option", { value: "", text: "全部等级" }),
        h("option", { value: "高", text: "仅高风险" }),
        h("option", { value: "中", text: "仅中风险" }),
        h("option", { value: "低", text: "仅低风险" }),
        h("option", { value: "无", text: "仅未命中" }),
      ]);
      const host = h("div");

      root.appendChild(
        ZK.ui.card({
          title: "检测任务留档",
          sub: "检测动作会实时写入此处，可作为内容合规的过程证据",
          icon: ZK.icons.clockHistory(16),
          actions: [kindFilter, levelFilter],
          body: [host],
        })
      );

      function rebuild() {
        let rows = ZK.db.list("safetyRecords").slice().sort((a, b) => b.at - a.at);
        if (kindFilter.value) rows = rows.filter((r) => r.kind === kindFilter.value);
        if (levelFilter.value) rows = rows.filter((r) => r.level === levelFilter.value);
        U.clear(host);
        host.appendChild(
          ZK.ui.table({
            rows: rows,
            pageSize: 10,
            searchKeys: ["target", "operator"],
            sortKey: "at",
            sortDir: "desc",
            columns: [
              { key: "target", label: "检测对象", sortable: true, render: (r) => h("span", { class: "cell-strong", text: U.truncate(r.target, 40) }) },
              { key: "kind", label: "类型", render: (r) => ZK.ui.badge(r.kind, r.kind === "视频" ? "blue" : "emerald") },
              { key: "result", label: "检测结果", render: (r) => h("span", { class: "fs-12", text: r.result }) },
              { key: "level", label: "等级", sortable: true, render: (r) => levelBadge(r.level) },
              { key: "action", label: "处置动作", render: (r) => ZK.ui.badge(r.action, actionTone(r.action)) },
              { key: "riskScore", label: "风险分", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", text: r.riskScore === undefined ? "—" : r.riskScore }) },
              { key: "operator", label: "操作人" },
              { key: "at", label: "检测时间", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtDateTime(r.at) }) },
              { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs", text: "详情", onclick: () => openDetail(r) }) },
            ],
          })
        );
      }

      function openDetail(r) {
        ZK.modal({
          title: "检测记录详情",
          sub: r.target,
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                ZK.ui.kv([
                  ["检测对象", r.target],
                  ["对象类型", r.kind],
                  ["检测结果", r.result],
                  ["风险等级", r.level === "无" ? "未命中" : r.level + "风险"],
                  ["处置动作", r.action],
                  ["命中敏感词", (r.hits || []).join("、") || "无"],
                  ["疑似误判", (r.ignored || []).join("、") || "无"],
                  ["操作人", r.operator],
                  ["检测时间", U.fmtDateTime(r.at)],
                ]),
                (r.hits || []).length
                  ? ZK.ui.card({ title: "命中词高亮回放", body: [h("div", { class: "corpus-box" }, [h("div", { class: "corpus", html: ZK.engine.markHits("（历史记录仅保留命中词，未留全文）命中：" + r.hits.join("、"), r.hits) })])] })
                  : null,
              ])
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }

      function exportRecords() {
        const csv = [["检测对象", "类型", "检测结果", "等级", "处置动作", "风险分", "操作人", "检测时间"]];
        ZK.db.list("safetyRecords").forEach((r) => csv.push([r.target, r.kind, r.result, r.level === "无" ? "未命中" : r.level, r.action, r.riskScore === undefined ? "" : r.riskScore, r.operator, U.fmtDateTime(r.at)]));
        U.downloadCsv("内容安全检测记录.csv", csv);
        ZK.toast("检测记录已导出");
      }

      kindFilter.addEventListener("change", rebuild);
      levelFilter.addEventListener("change", rebuild);
      rebuild();
    },
  };
})();
