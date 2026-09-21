/* ==========================================================================
   页面 · 文献资源（课程文献库 / 在线课程资源）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  /** 依据书目录信息合成可入库的文档正文（与知识库导入口径一致） */
  function bookToDocText(b) {
    return (
      "《" + b.title + "》 作者：" + b.author + "　出版社：" + b.publisher + "　出版年份：" + b.year +
      "　分类：" + b.category + "　页数：" + b.pages +
      "\n内容简介：" + b.summary +
      "\n关键词：" + (b.keywords || []).join("、") +
      "\n馆藏信息：ISBN " + b.isbn + "　馆藏位置 " + b.location + "　可借 " + b.stock + "/" + b.total + " 册　借阅次数 " + b.borrowCount +
      "\n关键要点：" + (b.keywords || []).map((k, i) => "（" + (i + 1) + "）" + k + "：本书围绕" + k + "展开论述，提供可迁移到商务翻译实践的方法与判别标准。").join("")
    );
  }

  function importBooks(books, kbId, onDone) {
    const kb = ZK.db.find("knowledgeBases", kbId);
    if (!kb) return ZK.toast("请选择目标知识库", "danger");
    let imported = 0;
    books.forEach((b) => {
      const exists = ZK.db.list("kbDocs", (d) => d.kbId === kbId && d.kind === "书籍" && d.title.indexOf(b.title) >= 0);
      if (exists.length) return;
      const text = bookToDocText(b);
      ZK.db.insert("kbDocs", {
        id: U.uid("doc"),
        kbId: kbId,
        title: "《" + b.title + "》",
        type: "文献书籍",
        kind: "书籍",
        chapter: b.chapter || null,
        source: "文献库对接",
        author: b.author,
        words: U.stripHtml(text).length,
        tokens: U.tokenize(text).length,
        chunks: Math.max(1, Math.round(U.stripHtml(text).length / 300)),
        text: text,
        addedAt: Date.now(),
        status: "indexed",
      });
      imported += 1;
    });
    if (imported) {
      ZK.db.update("knowledgeBases", kbId, { status: "trained", lastTrainedAt: Date.now() });
      ZK.db.insert("importBatches", {
        id: U.uid("ib"),
        kbId: kbId,
        kbName: kb.name,
        kind: "文献书籍",
        count: imported,
        source: "课程文献库",
        at: Date.now(),
        operator: (ZK.db.currentUser() || {}).name || "系统",
      });
      ZK.db.log("批量导入书籍", "向《" + kb.name + "》导入 " + imported + " 本课程相关书籍");
      ZK.toast("已向《" + kb.name + "》导入 " + imported + " 本书籍");
    } else {
      ZK.toast("所选书籍均已在知识库中，未重复导入", "warn");
    }
    if (onDone) onDone(imported);
  }

  function kbPicker(labelText) {
    const sel = h("select", { class: "select" }, ZK.db.list("knowledgeBases").map((k) => h("option", { value: k.id, text: k.name })));
    return { node: h("div", { class: "field" }, [h("label", { class: "label", text: labelText || "目标知识库" }), sel]), sel: sel };
  }

  /* ==================================================================
     一、课程文献库
     ================================================================== */
  P["library/books"] = {
    render(root) {
      const books = ZK.db.list("libraryBooks");
      const cats = Array.from(new Set(books.map((b) => b.category)));

      root.appendChild(
        ZK.ui.pageHead({
          title: "课程文献库",
          sub: "课程关联的 " + books.length + " 本馆藏文献，可一键导入知识库作为 AI 训练语料，也可发起 AI 解读生成词云、摘要与脑图。",
          actions: [
            h("button", { class: "btn btn-sm", text: "在线课程资源", onclick: () => go("#/library/resources") }),
            h("button", {
              class: "btn btn-primary btn-sm",
              html: ZK.icons.upload(14) + "<span>批量导入知识库（全库）</span>",
              onclick: () => openBulk(books),
            }),
          ],
        })
      );

      const importedCount = ZK.db.list("kbDocs", (d) => d.kind === "书籍").length;
      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({ label: "馆藏文献", value: String(books.length), target: "覆盖 " + cats.length + " 个分类", icon: ZK.icons.book(18), tone: "emerald", progress: 100 }),
          ZK.ui.statCard({ label: "已入知识库", value: String(importedCount), target: "作为 AI 训练语料", icon: ZK.icons.database(18), tone: "blue", progress: Math.min(100, (importedCount / books.length) * 100) }),
          ZK.ui.statCard({ label: "有数字资源", value: String(books.filter((b) => b.hasDigital).length), target: "可在线阅览全文", icon: ZK.icons.fileText(18), tone: "violet", progress: (books.filter((b) => b.hasDigital).length / books.length) * 100 }),
          ZK.ui.statCard({ label: "累计借阅", value: U.num(U.sum(books.map((b) => b.borrowCount))), target: "按馆藏系统口径", icon: ZK.icons.trendingUp(18), tone: "amber", progress: 78 }),
        ])
      );

      const catFilter = h("select", { class: "select", style: { width: "180px" } }, [h("option", { value: "", text: "全部分类" })].concat(cats.map((c) => h("option", { value: c, text: c }))));
      const viewSel = h("select", { class: "select", style: { width: "130px" } }, [h("option", { value: "card", text: "卡片视图" }), h("option", { value: "table", text: "表格视图" })]);
      const host = h("div");
      root.appendChild(h("div", { class: "row mb-12", style: { gap: "10px" } }, [catFilter, viewSel]));
      root.appendChild(host);

      function paint() {
        U.clear(host);
        let rows = books;
        if (catFilter.value) rows = rows.filter((b) => b.category === catFilter.value);
        if (!rows.length) {
          host.appendChild(ZK.ui.empty({ title: "没有符合条件的文献", desc: "调整分类筛选后重试。", icon: ZK.icons.book(22) }));
          return;
        }
        if (viewSel.value === "table") {
          host.appendChild(
            ZK.ui.card({
              title: "文献清单（" + rows.length + "）",
              icon: ZK.icons.book(16),
              body: [ZK.ui.table({
                rows: rows,
                pageSize: 12,
                searchKeys: ["title", "author", "publisher", "category"],
                columns: [
                  { key: "title", label: "书名", sortable: true, render: (r) => h("span", { class: "cell-strong", text: r.title }) },
                  { key: "author", label: "作者", sortable: true },
                  { key: "publisher", label: "出版社" },
                  { key: "year", label: "年份", align: "right", sortable: true },
                  { key: "category", label: "分类", render: (r) => ZK.ui.badge(r.category, "violet") },
                  { key: "pages", label: "页数", align: "right", sortable: true },
                  { key: "stock", label: "馆藏可借", align: "right", sortable: true, render: (r) => r.stock + " / " + r.total },
                  { key: "borrowCount", label: "借阅次数", align: "right", sortable: true },
                  { key: "rating", label: "评分", align: "right", sortable: true, render: (r) => h("span", { class: "em", text: r.rating.toFixed(1) }) },
                  {
                    key: "op",
                    label: "操作",
                    render: (r) =>
                      h("div", { class: "row", style: { gap: "4px" } }, [
                        h("button", { class: "btn btn-xs", text: "详情", onclick: () => detail(r) }),
                        h("button", { class: "btn btn-xs", text: "AI解读", onclick: () => go("#/graph/books/" + r.id) }),
                        h("button", { class: "btn btn-xs btn-primary", text: "导入知识库", onclick: () => openBulk([r]) }),
                      ]),
                  },
                ],
              })],
            })
          );
          return;
        }
        host.appendChild(
          h("div", { class: "grid grid-3" }, rows.map((b) =>
            ZK.ui.card({
              class: "card-hover",
              title: b.title,
              sub: b.author + " · " + b.publisher + " · " + b.year,
              icon: ZK.icons.book(16),
              actions: [
                ZK.ui.badge(b.category, "violet"),
                b.recommended ? ZK.ui.badge("系统推荐", "amber") : null,
                b.hasDigital ? ZK.ui.badge("有电子版", "blue") : null,
              ].filter(Boolean),
              body: [
                h("p", { class: "fs-12 muted clamp-3", style: { "line-height": "1.7", "min-height": "60px" }, text: b.summary }),
                h("div", { class: "chip-wrap mb-12" }, (b.keywords || []).slice(0, 4).map((k) => h("span", { class: "chip", text: k }))),
                h("div", { class: "grid grid-3", style: { gap: "8px" } }, [
                  mini("馆藏可借", b.stock + " / " + b.total),
                  mini("借阅次数", String(b.borrowCount)),
                  mini("评分", b.rating.toFixed(1)),
                ]),
                h("div", { class: "divider" }),
                h("div", { class: "row", style: { gap: "6px", "flex-wrap": "wrap" } }, [
                  h("button", { class: "btn btn-sm", text: "详情", onclick: () => detail(b) }),
                  h("button", { class: "btn btn-sm", text: "AI 解读", onclick: () => go("#/graph/books/" + b.id) }),
                  h("button", { class: "btn btn-sm btn-primary", text: "导入知识库", onclick: () => openBulk([b]) }),
                  h("button", { class: "btn btn-sm", text: "借阅", onclick: () => borrow(b) }),
                ]),
              ],
            })
          ))
        );
      }

      function mini(label, value) {
        return h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-md)", padding: "7px 9px" } }, [
          h("div", { class: "fs-11 ghost", text: label }),
          h("div", { class: "fs-13 fw-7 strong", text: value }),
        ]);
      }

      function detail(b) {
        const relatedKp = ZK.db.list("graphNodes", (n) => n.type === "book" && n.id === b.id);
        const rel = ZK.db.list("graphEdges", (e) => e.source === b.id).map((e) => (ZK.db.find("graphNodes", e.target) || {}).label).filter(Boolean);
        const inKb = ZK.db.list("kbDocs", (d) => d.kind === "书籍" && d.title.indexOf(b.title) >= 0);
        ZK.modal({
          title: b.title,
          sub: b.author + " · " + b.publisher + " · " + b.year,
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
                  mini("页数", String(b.pages)),
                  mini("馆藏", b.location),
                  mini("可借册数", b.stock + " / " + b.total),
                  mini("评分", b.rating.toFixed(1)),
                ]),
                h("p", { class: "fs-13 muted", style: { "line-height": "1.8" }, text: b.summary }),
                h("div", { class: "chip-wrap" }, (b.keywords || []).map((k) => h("span", { class: "chip", text: k }))),
                ZK.ui.kv([
                  ["ISBN", b.isbn],
                  ["分类", b.category],
                  ["借阅次数", String(b.borrowCount)],
                  ["数字资源", b.hasDigital ? "平台提供电子版全文" : "仅提供纸质馆藏"],
                  ["图谱关联知识点", rel.length ? rel.join("、") : "尚未建立关联"],
                  ["知识库收录", inKb.length ? "已收录于 " + inKb.map((d) => (ZK.db.find("knowledgeBases", d.kbId) || {}).name).join("、") : "尚未收录"],
                  ["入库时间", U.fmtDate(b.addedAt)],
                ]),
                relatedKp.length ? h("div", { class: "fs-12 faint", text: "该图书是知识图谱中的推荐阅读节点，可在图谱总览中查看其与知识点的连接关系。" }) : null,
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "关闭", onclick: () => api.close() }),
              h("button", { class: "btn", text: "AI 解读本书", onclick: () => { api.close(); go("#/graph/books/" + b.id); } }),
              h("button", { class: "btn btn-primary", text: "导入知识库", onclick: () => { api.close(); openBulk([b]); } }),
            ]);
          },
        });
      }

      function borrow(b) {
        if (b.stock <= 0) return ZK.toast("该书馆藏已全部借出", "danger");
        ZK.confirm({
          title: "借阅申请",
          message: "向图书馆系统提交《" + U.escapeHtml(b.title) + "》的借阅申请？<br>馆藏位置：" + b.location + "，当前可借 " + b.stock + " / " + b.total + " 册。",
          okText: "提交申请",
        }).then((ok) => {
          if (!ok) return;
          ZK.db.update("libraryBooks", b.id, { stock: b.stock - 1, borrowCount: b.borrowCount + 1 });
          ZK.db.log("图书借阅", "借阅《" + b.title + "》");
          ZK.toast("借阅申请已提交，请到 " + b.location + " 取书");
          paint();
        });
      }

      function openBulk(list) {
        const picker = kbPicker("导入到知识库");
        const scope = h("select", { class: "select" }, [
          h("option", { value: "selected", text: "仅导入所选 " + list.length + " 本" }),
          h("option", { value: "all", text: "导入全部 " + books.length + " 本（一次性导入）" }),
          h("option", { value: "recommended", text: "导入系统推荐书目 " + books.filter((x) => x.recommended).length + " 本" }),
        ]);
        const info = h("div", { class: "advice info", text: "导入后每本书会生成一篇可检索的知识库文档（含书目信息、内容简介、关键词与馆藏信息），并计入知识库训练语料。" });
        const err = h("div", { class: "login-err hidden" });

        ZK.modal({
          title: "批量导入文献到知识库",
          sub: "支持一次性导入不少于 30 本课程相关书籍",
          render(api) {
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                h("div", { class: "field" }, [h("label", { class: "label", text: "导入范围" }), scope]),
                picker.node,
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "导入说明" }), h("div", { class: "fs-12 muted", style: { "line-height": "1.7" }, text: "同一本书在同一知识库中只保留一篇文档，重复导入将自动跳过。" })]),
                h("div", { class: "span-full" }, [info]),
                h("div", { class: "span-full" }, [err]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "开始导入",
                onclick() {
                  let targets = list;
                  if (scope.value === "all") targets = books;
                  else if (scope.value === "recommended") targets = books.filter((x) => x.recommended);
                  if (!targets.length) {
                    err.textContent = "没有可导入的书籍";
                    err.classList.remove("hidden");
                    return;
                  }
                  importBooks(targets, picker.sel.value, (n) => {
                    api.close();
                    paint();
                  });
                },
              }),
            ]);
          },
        });
      }

      catFilter.addEventListener("change", paint);
      viewSel.addEventListener("change", paint);
      paint();
    },
  };

  /* ==================================================================
     二、在线课程资源
     ================================================================== */
  P["library/resources"] = {
    render(root) {
      const res = ZK.db.list("resources");

      root.appendChild(
        ZK.ui.pageHead({
          title: "在线课程资源",
          sub: "课程组与教务处发布的视频、讲义、习题、案例与试卷资源，可一键同步进知识库作为在线课程语料。",
          actions: [
            h("button", { class: "btn btn-sm", text: "课程文献库", onclick: () => go("#/library/books") }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.sync(14) + "<span>一键同步到知识库</span>", onclick: () => openSync() }),
          ],
        })
      );

      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({ label: "资源总数", value: String(res.length), target: "覆盖第 1-10 章", icon: ZK.icons.folder(18), tone: "emerald", progress: 92 }),
          ZK.ui.statCard({ label: "视频资源", value: String(res.filter((r) => r.type === "视频" || r.type === "直播回放").length), target: "含课堂实录与讲座", icon: ZK.icons.video(18), tone: "blue", progress: 68 }),
          ZK.ui.statCard({ label: "平均完成率", value: U.pct(U.avg(res.map((r) => r.completion))), target: "已学人数合计 " + U.num(U.sum(res.map((r) => r.learners))), icon: ZK.icons.checkCircle(18), tone: "violet", progress: U.avg(res.map((r) => r.completion)) }),
          ZK.ui.statCard({ label: "已同步知识库", value: String(ZK.db.list("kbDocs", (d) => d.kind === "在线资源").length), target: "作为在线课程语料", icon: ZK.icons.database(18), tone: "amber", progress: Math.min(100, ZK.db.list("kbDocs", (d) => d.kind === "在线资源").length * 6) }),
        ])
      );

      const chFilter = h("select", { class: "select", style: { width: "150px" } }, [h("option", { value: "", text: "全部章节" })].concat(
        Array.from(new Set(res.map((r) => r.chapter))).sort((a, b) => a - b).map((c) => h("option", { value: String(c), text: "第 " + c + " 章" }))
      ));
      const typeFilter = h("select", { class: "select", style: { width: "150px" } }, [h("option", { value: "", text: "全部类型" })].concat(
        Array.from(new Set(res.map((r) => r.type))).map((t) => h("option", { value: t, text: t }))
      ));
      const host = h("div");
      root.appendChild(h("div", { class: "row mb-12", style: { gap: "10px" } }, [chFilter, typeFilter]));
      root.appendChild(host);

      function paint() {
        U.clear(host);
        let rows = res;
        if (chFilter.value) rows = rows.filter((r) => String(r.chapter) === chFilter.value);
        if (typeFilter.value) rows = rows.filter((r) => r.type === typeFilter.value);
        const synced = {};
        ZK.db.list("kbDocs", (d) => d.kind === "在线资源").forEach((d) => {
          const resId = (d.title.match(/\[(res_\d+)\]/) || [])[1];
          if (resId) synced[resId] = d.kbId;
        });

        host.appendChild(
          ZK.ui.card({
            title: "资源清单（" + rows.length + "）",
            sub: "在线课程资源与知识库的同步关系会在此处标记",
            icon: ZK.icons.folder(16),
            actions: [h("button", { class: "btn btn-xs", text: "导出清单", onclick: () => exportList(rows) })],
            body: [ZK.ui.table({
              rows: rows.map((r) => Object.assign({ synced: !!synced[r.id], syncedKb: synced[r.id] || null }, r)),
              pageSize: 12,
              searchKeys: ["title", "publisher", "type"],
              sortKey: "chapter",
              sortDir: "asc",
              columns: [
                { key: "title", label: "资源标题", sortable: true, render: (r) => h("div", {}, [h("div", { class: "cell-strong", text: r.title }), h("div", { class: "fs-11 faint", text: r.publisher + " · 发布于 " + U.fmtDate(r.publishedAt) })]) },
                { key: "type", label: "类型", render: (r) => ZK.ui.badge(r.type, r.type === "视频" ? "blue" : r.type === "习题" || r.type === "试卷" ? "violet" : r.type === "案例" ? "amber" : "gray") },
                { key: "chapter", label: "章节", align: "right", sortable: true, render: (r) => "第 " + r.chapter + " 章" },
                { key: "duration", label: "时长", align: "right", sortable: true, render: (r) => (r.duration ? r.duration + " 分" : "—") },
                { key: "sizeMB", label: "大小", align: "right", sortable: true, render: (r) => r.sizeMB + " MB" },
                { key: "learners", label: "已学人数", align: "right", sortable: true, render: (r) => U.num(r.learners) },
                { key: "views", label: "访问量", align: "right", sortable: true, render: (r) => U.num(r.views) },
                { key: "completion", label: "完成率", sortable: true, render: (r) => ZK.ui.progressLine(r.completion, r.completion >= 80 ? "emerald" : r.completion >= 65 ? "blue" : "amber", U.pct(r.completion)) },
                { key: "synced", label: "知识库同步", render: (r) => (r.synced ? ZK.ui.badge("已同步 · " + ((ZK.db.find("knowledgeBases", r.syncedKb) || {}).name || "").slice(0, 8), "emerald") : ZK.ui.badge("未同步", "gray")) },
                {
                  key: "op",
                  label: "操作",
                  render: (r) =>
                    h("div", { class: "row", style: { gap: "4px" } }, [
                      h("button", { class: "btn btn-xs", text: "预览", onclick: () => preview(r) }),
                      h("button", { class: "btn btn-xs btn-primary", text: "同步入库", onclick: () => syncOne(r) }),
                    ]),
                },
              ],
            })],
          })
        );
      }

      function preview(r) {
        const kp = ZK.db.list("knowledgePoints", (k) => k.chapter === r.chapter)[0] || {};
        ZK.modal({
          title: r.title,
          sub: r.type + " · 第 " + r.chapter + " 章 · " + r.publisher,
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                r.type === "视频" || r.type === "直播回放"
                  ? h("div", { class: "center", style: { background: "linear-gradient(135deg,rgba(37, 99, 235,0.18),rgba(59,130,246,0.14))", "border-radius": "var(--r-xl)", padding: "38px 20px" } }, [
                      h("div", { class: "stat-icon ic-emerald", style: { width: "52px", height: "52px", "border-radius": "16px" }, html: ZK.icons.play(22) }),
                      h("div", { class: "fs-13 fw-6 strong mt-12", text: "视频时长 " + r.duration + " 分钟 · " + r.sizeMB + " MB" }),
                      h("div", { class: "fs-12 faint mt-4", text: "（演示环境不加载真实视频流，此处展示播放器位置与元数据）" }),
                    ])
                  : h("div", { class: "corpus-box" }, [h("div", { class: "corpus", text: "【" + r.type + "】" + r.title + "\n所属章节：第 " + r.chapter + " 章　发布单位：" + r.publisher + "　体量：" + r.sizeMB + " MB\n本资源用于支撑《" + (kp.name || "相关章节") + "》的学习，包含概念界定、方法步骤与练习要求。教师可将其同步进知识库，使学生在知识库问答中直接检索到本资源的要点。" })]),
                ZK.ui.kv([
                  ["资源编号", r.id],
                  ["类型", r.type],
                  ["所属章节", "第 " + r.chapter + " 章"],
                  ["已学人数 / 访问量", U.num(r.learners) + " 人 / " + U.num(r.views) + " 次"],
                  ["平均完成率", U.pct(r.completion)],
                  ["拆分课时数", r.chapters + " 节"],
                  ["发布单位", r.publisher],
                  ["发布时间", U.fmtDate(r.publishedAt)],
                ]),
                h("div", { class: "advice info", text: "同步进入知识库后，会在知识库问答与检索中作为独立文段被召回，学生提问相关章节内容时可直接定位到本资源。" }),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "关闭", onclick: () => api.close() }),
              h("button", { class: "btn btn-primary", text: "同步到知识库", onclick: () => { api.close(); syncOne(r); } }),
            ]);
          },
        });
      }

      function syncOne(r) {
        const picker = kbPicker("同步到知识库");
        ZK.modal({
          title: "同步在线课程资源",
          sub: r.title,
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                picker.node,
                h("div", { class: "advice info", text: "同步后该资源会生成一篇知识库文档，标题带资源编号标记，便于识别来源。" }),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "确认同步",
                onclick() {
                  doSync([r], picker.sel.value);
                  api.close();
                },
              }),
            ]);
          },
        });
      }

      function doSync(list, kbId) {
        const kb = ZK.db.find("knowledgeBases", kbId);
        if (!kb) return ZK.toast("请选择知识库", "danger");
        let n = 0;
        list.forEach((r) => {
          const exists = ZK.db.list("kbDocs", (d) => d.kbId === kbId && d.kind === "在线资源" && d.title.indexOf(r.id) >= 0);
          if (exists.length) return;
          const text =
            "【" + r.type + "】" + r.title +
            "\n所属章节：第 " + r.chapter + " 章　发布单位：" + r.publisher + "　体量：" + r.sizeMB + " MB　已学 " + r.learners + " 人　平均完成率 " + r.completion + "%" +
            "\n资源要点：本资源围绕第 " + r.chapter + " 章的核心内容展开，包含概念界定、操作步骤与练习要求。学生在翻译实践中遇到相关知识点时，可参照本资源的处理路径与判断标准。" +
            "\n教学用途：用于支撑章节知识点的预习、复习与实践对照，也可作为作品型任务的参考资料。";
          ZK.db.insert("kbDocs", {
            id: U.uid("doc"),
            kbId: kbId,
            title: "[" + r.id + "] " + r.title,
            type: r.type,
            kind: "在线资源",
            chapter: r.chapter,
            source: "在线课程资源同步",
            author: r.publisher,
            words: U.stripHtml(text).length,
            tokens: U.tokenize(text).length,
            chunks: 1,
            text: text,
            addedAt: Date.now(),
            status: "indexed",
          });
          n += 1;
        });
        if (n) {
          ZK.db.update("knowledgeBases", kbId, { status: "trained" });
          ZK.db.insert("kbSyncLogs", { id: U.uid("sl"), kbId: kbId, kbName: kb.name, count: n, at: Date.now(), operator: (ZK.db.currentUser() || {}).name || "系统" });
          ZK.db.log("同步在线资源", "向《" + kb.name + "》同步 " + n + " 项在线课程资源");
          ZK.toast("已同步 " + n + " 项资源到《" + kb.name + "》");
        } else {
          ZK.toast("所选资源已在知识库中", "warn");
        }
        paint();
      }

      function openSync() {
        const picker = kbPicker("同步到知识库");
        const chs = h("select", { class: "select" }, [h("option", { value: "", text: "全部章节" })].concat(
          Array.from(new Set(res.map((r) => r.chapter))).sort((a, b) => a - b).map((c) => h("option", { value: String(c), text: "第 " + c + " 章" }))
        ));
        ZK.modal({
          title: "一键同步在线课程资源",
          sub: "按章节批量同步资源到指定知识库",
          render(api) {
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                picker.node,
                h("div", { class: "field" }, [h("label", { class: "label", text: "章节范围" }), chs]),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "同步说明" }), h("div", { class: "fs-12 muted", style: { "line-height": "1.7" }, text: "同步后资源会成为知识库文档，可在「知识库问答」中直接检索到其要点。" })]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "开始同步",
                onclick() {
                  const list = chs.value ? res.filter((r) => String(r.chapter) === chs.value) : res;
                  doSync(list, picker.sel.value);
                  api.close();
                },
              }),
            ]);
          },
        });
      }

      function exportList(rows) {
        const csv = [["资源编号", "标题", "类型", "章节", "时长(分)", "大小(MB)", "已学人数", "访问量", "完成率(%)", "发布单位", "发布时间"]];
        rows.forEach((r) => csv.push([r.id, r.title, r.type, r.chapter, r.duration, r.sizeMB, r.learners, r.views, r.completion, r.publisher, U.fmtDate(r.publishedAt)]));
        U.downloadCsv("在线课程资源清单.csv", csv);
        ZK.toast("资源清单已导出");
      }

      chFilter.addEventListener("change", paint);
      typeFilter.addEventListener("change", paint);
      paint();
    },
  };
})();
