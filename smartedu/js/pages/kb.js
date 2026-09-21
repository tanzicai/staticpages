/* ==========================================================================
   页面 · AI知识库训练（列表 / 详情 / 资源导入 / 召回参数 / 知识库问答）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  const MODE_NAME = { semantic: "语义检索", fulltext: "全文检索", hybrid: "混合检索" };

  /* ---------------- 工具：生成导入文档正文 ---------------- */
  function bookToDocText(b) {
    return (
      "《" +
      b.title +
      "》 作者：" +
      b.author +
      "　出版社：" +
      b.publisher +
      "　出版年份：" +
      b.year +
      "　分类：" +
      b.category +
      "　页数：" +
      b.pages +
      "\n内容简介：" +
      b.summary +
      "\n关键词：" +
      b.keywords.join("、") +
      "\n馆藏信息：ISBN " +
      b.isbn +
      "　馆藏位置 " +
      b.location +
      "　可借 " +
      b.stock +
      "/" +
      b.total +
      " 册　借阅次数 " +
      b.borrowCount +
      "\n教学用途：本书纳入课程知识库后，用于支撑学生在翻译练习中的术语核对、理论溯源与案例对照。教师可通过知识库提问直接定位到该书相关章节要点，学生在完成作品型任务时可引用本书观点作为处理依据。" +
      "\n关键要点：" +
      b.keywords
        .map((k, i) => "（" + (i + 1) + "）" + k + "：本书围绕" + k + "展开论述，提供可迁移到商务翻译实践的方法与判别标准。")
        .join("")
    );
  }

  function resourceToDocText(r, kp) {
    return (
      "［" +
      r.type +
      "］" +
      r.title +
      "\n所属章节：第 " +
      r.chapter +
      " 章　发布单位：" +
      r.publisher +
      "　时长/体量：" +
      (r.duration ? r.duration + " 分钟" : r.sizeMB + " MB") +
      "　已学人数：" +
      r.learners +
      "　平均完成率：" +
      r.completion +
      "%" +
      (kp ? "\n关联知识点：" + kp.name + "（第 " + kp.chapter + " 章）" : "") +
      "\n内容要点：本资源围绕" +
      (kp ? kp.name : "课程核心内容") +
      "展开，讲解顺序为先给出判别标准，再以真实语料演示处理路径，最后归纳可复用的操作步骤。观看/学习时建议同步打开对应章节知识库文档，把讲义中的规则与本资源中的实例相互对照。" +
      (kp
        ? "\n涉及概念：" + kp.concepts.join("、") + "。这些概念在课后练习与作品型任务中会反复出现，属于术语一致性检查的强制项。"
        : "") +
      "\n配套建议：完成本资源后可进入对应知识点的检索测试，输入该知识点的核心概念，检查能否召回本资源与相关文献章节。"
    );
  }

  /* ============================ 知识库列表 ============================ */
  P["kb/list"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "知识库管理",
          sub: "支持新建多个文档知识库，每个知识库可独立配置召回参数、独立对接文献库与在线课程资源。",
          actions: [
            h("button", { class: "btn btn-sm", text: "资源导入与文献对接", onclick: () => go("#/kb/import") }),
            h("button", {
              class: "btn btn-primary btn-sm",
              html: ZK.icons.plus(14) + "<span>新建知识库</span>",
              onclick: openCreate,
            }),
          ],
        })
      );

      function paint() {
        const host = old;
        U.clear(host);
        const kbs = ZK.db.list("knowledgeBases");

        host.appendChild(
          h("div", { class: "grid grid-4 mb-16" }, [
            ZK.ui.statCard({ label: "知识库总数", value: String(kbs.length), target: ZK.db.list("kbDocs").length + " 篇文档", icon: ZK.icons.database(18), tone: "emerald", progress: Math.min(100, kbs.length * 25) }),
            ZK.ui.statCard({ label: "文档总分片", value: String(ZK.engine.buildIndex(kbs[0] ? kbs[0].id : "").chunks.length + ZK.engine.buildIndex(kbs[1] ? kbs[1].id : "").chunks.length + ZK.engine.buildIndex(kbs[2] ? kbs[2].id : "").chunks.length), target: "按分片配置切分", icon: ZK.icons.layers(18), tone: "blue", progress: 62 }),
            ZK.ui.statCard({ label: "上下文补充分片", value: String(ZK.db.list("kbFragments").length), target: "自定义追加", icon: ZK.icons.plus(18), tone: "violet", progress: 40 }),
            ZK.ui.statCard({ label: "累计检索次数", value: String(ZK.db.list("retrievalLogs").length), target: "含三种检索模式", icon: ZK.icons.search(18), tone: "amber", progress: Math.min(100, ZK.db.list("retrievalLogs").length * 5) }),
          ])
        );

        host.appendChild(
          h("div", { class: "grid grid-3" }, kbs.map((kb) => {
            const st = ZK.engine.kbStats(kb.id);
            const trained = kb.status === "trained";
            return ZK.ui.card({
              class: "card-hover",
              title: kb.name,
              sub: kb.course + " · 负责人 " + kb.owner + " · 可见范围 " + kb.visibility,
              icon: ZK.icons.database(16),
              actions: [trained ? ZK.ui.badge("已训练", "emerald") : ZK.ui.badge("待训练", "amber")],
              body: [
                h("p", { class: "fs-12 muted", style: { "line-height": "1.7", "min-height": "58px" }, text: kb.desc }),
                h("div", { class: "chip-wrap mb-12" }, kb.tags.map((t) => h("span", { class: "chip", text: t }))),
                h("div", { class: "grid grid-4", style: { gap: "8px" } }, [
                  metric("文档", st.docs),
                  metric("分片", st.chunks),
                  metric("补充", st.fragments),
                  metric("检索", st.queries),
                ]),
                h("div", { class: "divider" }),
                h("div", { class: "row", style: { gap: "6px", "flex-wrap": "wrap" } }, [
                  h("button", { class: "btn btn-sm btn-primary", text: "进入知识库", onclick: () => go("#/kb/detail/" + kb.id) }),
                  h("button", { class: "btn btn-sm", text: "召回参数", onclick: () => go("#/kb/recall/" + kb.id) }),
                  h("button", { class: "btn btn-sm", text: "检索测试", onclick: () => go("#/kb/query/" + kb.id) }),
                  h("button", {
                    class: "btn btn-sm btn-danger",
                    html: ZK.icons.trash(13),
                    title: "删除知识库",
                    onclick: async () => {
                      const ok = await ZK.confirm({
                        title: "删除知识库",
                        message: "将删除知识库《" + U.escapeHtml(kb.name) + "》及其 " + st.docs + " 篇文档与 " + st.fragments + " 条补充分片。<br><br><b>⚠️ 此操作不可撤销。</b>",
                        okText: "确认删除",
                        danger: true,
                      });
                      if (!ok) return;
                      ZK.db.list("kbDocs", (d) => d.kbId === kb.id).forEach((d) => ZK.db.remove("kbDocs", d.id));
                      ZK.db.list("kbFragments", (f) => f.kbId === kb.id).forEach((f) => ZK.db.remove("kbFragments", f.id));
                      ZK.db.remove("knowledgeBases", kb.id);
                      ZK.db.log("删除知识库", "删除《" + kb.name + "》及其文档");
                      ZK.toast("知识库已删除");
                      paint();
                    },
                  }),
                ]),
              ],
            });
          })
        ));
      }

      function metric(label, value) {
        return h("div", { style: { background: "rgba(31,41,55,0.5)", "border-radius": "8px", padding: "7px 9px" } }, [
          h("div", { class: "fs-11 ghost", text: label }),
          h("div", { class: "fs-15 fw-7 strong", text: String(value) }),
        ]);
      }

      function openCreate() {
        const name = h("input", { class: "input", placeholder: "例如：商务英语笔译课程知识库" });
        const course = h("select", { class: "select" }, ZK.db.list("courses").map((c) => h("option", { value: c.name, text: c.name })));
        const desc = h("textarea", { class: "textarea", placeholder: "描述该知识库的用途、覆盖范围与使用场景" });
        const visibility = h("select", { class: "select" }, ["课程内公开", "仅教师可见", "校内公开"].map((v) => h("option", { text: v })));
        const tags = h("input", { class: "input", placeholder: "逗号分隔，例如：合同翻译,术语规范" });
        const mode = h("select", { class: "select" }, Object.keys(MODE_NAME).map((k) => h("option", { value: k, text: MODE_NAME[k] })));
        const err = h("div", { class: "login-err hidden" });

        ZK.modal({
          title: "新建文档知识库",
          sub: "创建后可导入文献书籍、同步在线课程资源，并独立配置召回参数",
          render(api) {
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "知识库名称", html: '知识库名称<span class="req">*</span>' }), name]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "所属课程" }), course]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "可见范围" }), visibility]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "默认检索模式" }), mode]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "标签（逗号分隔）" }), tags]),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "用途说明" }), desc]),
                h("div", { class: "span-full" }, [err]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "创建知识库",
                onclick() {
                  if (!name.value.trim()) {
                    err.textContent = "请填写知识库名称";
                    err.classList.remove("hidden");
                    return;
                  }
                  const u = ZK.db.currentUser();
                  const kb = ZK.db.insert("knowledgeBases", {
                    name: name.value.trim(),
                    courseId: (ZK.db.list("courses").find((c) => c.name === course.value) || {}).id || "c_biztrans",
                    course: course.value,
                    desc: desc.value.trim() || "新建知识库，尚未导入文档。",
                    owner: u.name,
                    ownerId: u.id,
                    visibility: visibility.value,
                    tags: tags.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
                    status: "untrained",
                    createdAt: Date.now(),
                    recall: { mode: mode.value, topK: 5, threshold: 0.3, semanticWeight: 0.6, fulltextWeight: 0.4, fullDoc: false, chunkSize: 300, overlap: 60, rerank: true },
                  });
                  ZK.db.log("新建知识库", "创建《" + kb.name + "》");
                  ZK.toast("知识库已创建，可前往「资源导入与文献对接」导入文档");
                  api.close();
                  paint();
                },
              }),
            ]);
          },
        });
      }

      const old = h("div");
      root.appendChild(old);
      paint();
    },
  };

  /* ============================ 知识库详情 ============================ */
  P["kb/detail"] = {
    render(root, param) {
      const kbId = param || (ZK.db.list("knowledgeBases")[0] || {}).id;
      const host = h("div");
      let tab = "docs";
      /* 召回参数草稿：paint() 会整页重建，草稿用于保住尚未保存的编辑 */
      const recallDraft = {};

      function paint() {
        U.clear(host);
        const kb = ZK.db.find("knowledgeBases", kbId);
        if (!kb) {
          host.appendChild(ZK.ui.card({ title: "知识库不存在", body: [ZK.ui.empty({ title: "未找到该知识库", action: h("button", { class: "btn btn-primary", text: "返回列表", onclick: () => go("#/kb/list") }) })] }));
          return;
        }
        const st = ZK.engine.kbStats(kbId);

        host.appendChild(
          ZK.ui.pageHead({
            title: kb.name,
            sub:
              kb.course + " · 负责人 " + kb.owner + " · 可见范围 " + kb.visibility + " · 创建于 " + U.fmtDate(kb.createdAt) +
              " · 当前检索模式：" + MODE_NAME[kb.recall.mode],
            actions: [
              h("button", { class: "btn btn-sm", text: "切换知识库", onclick: openSwitch }),
              h("button", { class: "btn btn-sm", text: "导入资源", onclick: () => go("#/kb/import/" + kbId) }),
              h("button", {
                class: "btn btn-sm btn-primary",
                html: ZK.icons.wand(14) + "<span>执行训练</span>",
                onclick: () => train(kb, paint),
              }),
            ],
          })
        );

        // 统计
        host.appendChild(
          h("div", { class: "grid grid-5 mb-16" }, [
            ZK.ui.statCard({ label: "文档数", value: String(st.docs), target: "篇", icon: ZK.icons.fileText(18), tone: "emerald", progress: Math.min(100, st.docs * 6) }),
            ZK.ui.statCard({ label: "分片数", value: String(st.chunks), target: "分片大小 " + kb.recall.chunkSize + " 字", icon: ZK.icons.layers(18), tone: "blue", progress: 70 }),
            ZK.ui.statCard({ label: "补充分片", value: String(st.fragments), target: "自定义上下文", icon: ZK.icons.plus(18), tone: "violet", progress: st.fragments * 20 }),
            ZK.ui.statCard({ label: "总字数", value: U.num(st.chars), target: "约 " + U.num(st.tokens) + " 词项", icon: ZK.icons.code(18), tone: "cyan", progress: Math.min(100, st.chars / 500) }),
            ZK.ui.statCard({ label: "训练状态", value: kb.status === "trained" ? "已训练" : "待训练", target: kb.status === "trained" ? "索引就绪" : "尚未建立索引", icon: ZK.icons.checkCircle(18), tone: kb.status === "trained" ? "emerald" : "amber", progress: kb.status === "trained" ? 100 : 20 }),
          ])
        );

        // Tabs
        const tabBar = ZK.ui.tabs(
          [
            { id: "docs", name: "文档列表（" + st.docs + "）" },
            { id: "chunks", name: "分片视图（" + st.chunks + "）" },
            { id: "frags", name: "上下文补充分片（" + st.fragments + "）" },
            { id: "recall", name: "召回参数" },
          ],
          tab,
          (id) => {
            tab = id;
            paint();
          }
        );

        const body = h("div", { class: "mt-16" });

        if (tab === "docs") body.appendChild(renderDocs(kb, paint));
        if (tab === "chunks") body.appendChild(renderChunks(kb));
        if (tab === "frags") body.appendChild(renderFrags(kb, paint));
        if (tab === "recall") body.appendChild(renderRecall(kb, paint));

        host.appendChild(h("div", { class: "row-between mb-12" }, [tabBar, h("span", { class: "fs-12 faint", text: "文档 " + st.docs + " 篇 · 分片 " + st.chunks + " 个 · 补充 " + st.fragments + " 条" })]));
        host.appendChild(body);
      }

      /* --- 文档列表 --- */
      function renderDocs(kb, repaint) {
        const docs = ZK.db.list("kbDocs", (d) => d.kbId === kb.id);
        const tab0 = ZK.ui.tabs(["全部文档", "课程讲义", "文献书籍", "规范标准", "在线资源"], "全部文档", (id) => {
          currentFilter = id;
          repaint();
        });
        return h("div", {}, [
          h("div", { class: "row-between mb-12" }, [tab0, h("span", { class: "fs-12 faint", text: "点击文档标题可查看正文与分片" })]),
          ZK.ui.table({
            pageSize: 10,
            rows: docs,
            searchKeys: ["title", "type", "author"],
            searchPlaceholder: "搜索文档标题、类型、作者…",
            columns: [
              {
                key: "title", label: "文档标题", sortable: true,
                render: (r) => h("button", { class: "cell-strong", style: { textAlign: "left" }, onclick: () => viewDoc(r) }, [r.title]),
              },
              { key: "type", label: "类型", render: (r) => ZK.ui.badge(r.type, r.type === "文献书籍" ? "amber" : r.type === "在线资源" ? "blue" : "emerald") },
              { key: "chapter", label: "章", align: "right", sortable: true, render: (r) => (r.chapter ? "第 " + r.chapter + " 章" : "—") },
              { key: "author", label: "来源/作者" },
              { key: "words", label: "字数", align: "right", sortable: true, render: (r) => U.num(r.words) },
              { key: "chunks", label: "分片", align: "right", sortable: true },
              { key: "addedAt", label: "导入时间", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtDate(r.addedAt) }) },
              {
                key: "op", label: "操作", render: (r) =>
                  h("div", { class: "row", style: { gap: "4px" } }, [
                    h("button", { class: "btn btn-xs", text: "正文", onclick: () => viewDoc(r) }),
                    h("button", {
                      class: "btn btn-xs", text: "检索",
                      onclick: () => go("#/kb/query/" + kb.id),
                    }),
                    h("button", {
                      class: "btn btn-xs btn-danger", html: ZK.icons.trash(12),
                      onclick: async () => {
                        const ok = await ZK.confirm({ title: "移除文档", message: "从知识库中移除《" + U.escapeHtml(r.title) + "》？", okText: "移除", danger: true });
                        if (!ok) return;
                        ZK.db.remove("kbDocs", r.id);
                        ZK.db.log("移除知识库文档", "《" + r.title + "》已从《" + kb.name + "》移除");
                        ZK.toast("文档已移除");
                        repaint();
                      },
                    }),
                  ]),
              },
            ],
          }),
        ]);
      }
      let currentFilter = "全部文档";
      void currentFilter;

      function viewDoc(d) {
        ZK.modal({
          title: d.title,
          sub: d.type + " · " + (d.chapter ? "第 " + d.chapter + " 章 · " : "") + "字数 " + U.num(d.words) + " · 分片 " + d.chunks,
          size: "lg",
          render(api) {
            const parts = ZK.engine.chunkText(d.text, ZK.db.find("knowledgeBases", d.kbId).recall.chunkSize, ZK.db.find("knowledgeBases", d.kbId).recall.overlap);
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                h("div", { class: "row", style: { gap: "8px", "flex-wrap": "wrap" } }, [
                  ZK.ui.badge(d.type, "emerald"),
                  ZK.ui.badge("来源：" + d.source, "gray"),
                  ZK.ui.badge("作者：" + d.author, "gray"),
                  ZK.ui.badge("导入 " + U.fmtDate(d.addedAt), "gray"),
                ]),
                h("div", { class: "corpus-box" }, [h("div", { class: "corpus", text: d.text })]),
                h("div", {}, [
                  h("div", { class: "fs-13 fw-6 strong mb-8", text: "分片切分结果（按当前召回参数：" + ZK.db.find("knowledgeBases", d.kbId).recall.chunkSize + " 字 / 重叠 " + ZK.db.find("knowledgeBases", d.kbId).recall.overlap + " 字）" }),
                  h("div", { style: { display: "flex", "flex-direction": "column", gap: "8px", "max-height": "260px", overflow: "auto" } },
                    parts.map((p, i) =>
                      h("div", { style: { background: "rgba(31,41,55,0.45)", "border-radius": "8px", padding: "10px 12px" } }, [
                        h("div", { class: "fs-11 em", text: "分片 " + (i + 1) + " / " + parts.length + " · " + p.length + " 字" }),
                        h("div", { class: "fs-12 muted mt-4", text: U.truncate(p, 160) }),
                      ])
                    )
                  ),
                ]),
              ])
            );
          },
        });
      }

      /* --- 分片视图 --- */
      function renderChunks(kb) {
        const idx = ZK.engine.buildIndex(kb.id);
        return ZK.ui.card({
          title: "分片索引视图",
          sub: "共 " + idx.chunks.length + " 个分片，索引包含 " + idx.idf.size + " 个词项；分片由文档正文按当前分片参数切分而成",
          body: [
            ZK.ui.table({
              pageSize: 10,
              rows: idx.chunks.map((c) => ({
                id: c.id, docTitle: c.docTitle, index: c.index, total: c.total,
                len: c.text.length, terms: c.tf.size, kind: c.kind, text: c.text,
              })),
              searchKeys: ["docTitle", "text"],
              searchPlaceholder: "搜索分片内容…",
              columns: [
                { key: "docTitle", label: "所属文档", sortable: true, render: (r) => h("span", { class: "cell-strong", text: U.truncate(r.docTitle, 26) }) },
                { key: "index", label: "分片序号", align: "right", sortable: true, render: (r) => r.index + " / " + r.total },
                { key: "len", label: "字数", align: "right", sortable: true },
                { key: "terms", label: "词项数", align: "right", sortable: true },
                { key: "kind", label: "来源", render: (r) => ZK.ui.badge(r.kind === "fragment" ? "上下文补充" : "文档正文", r.kind === "fragment" ? "violet" : "gray") },
                { key: "text", label: "分片摘要", render: (r) => h("span", { class: "cell-muted", text: U.truncate(r.text, 60) }) },
                {
                  key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs", text: "查看", onclick: () => ZK.modal({ title: "分片 " + r.index + " / " + r.total, sub: r.docTitle, size: "lg", body: false, render(api) { api.body.appendChild(h("div", { class: "corpus-box" }, [h("div", { class: "corpus", text: r.text })])); } }) }),
                },
              ],
            }),
          ],
        });
      }

      /* --- 上下文补充分片 --- */
      function renderFrags(kb, repaint) {
        const frags = ZK.db.list("kbFragments", (f) => f.kbId === kb.id);
        return ZK.ui.card({
          title: "自定义上下文分片补充",
          sub: "在文档分片之外追加教师自定的上下文片段，检索时与文档分片一同参与召回，并可设置优先权重。",
          actions: [
            h("button", {
              class: "btn btn-sm btn-primary",
              html: ZK.icons.plus(14) + "<span>新增补充分片</span>",
              onclick: () => {
                const title = h("input", { class: "input", placeholder: "例如：课程组补充：本学期合同翻译统一要求" });
                const text = h("textarea", { class: "textarea", style: { "min-height": "160px" }, placeholder: "填写需要补充进召回范围的上下文内容，建议包含明确的强制项与判别标准" });
                const priority = h("input", { class: "input", type: "range", min: "1", max: "10", value: "7" });
                const pv = h("span", { class: "fs-13 em fw-6", text: "7" });
                priority.addEventListener("input", () => (pv.textContent = priority.value));
                ZK.modal({
                  title: "新增上下文分片",
                  render(api) {
                    api.body.appendChild(
                      h("div", { class: "stack-16" }, [
                        h("div", { class: "field" }, [h("label", { class: "label", text: "分片标题" }), title]),
                        h("div", { class: "field" }, [h("label", { class: "label", text: "分片内容" }), text]),
                        h("div", { class: "field" }, [h("label", { class: "label" }, ["优先权重（1-10，越高越靠前）", pv]), priority]),
                        h("div", { class: "hint", text: "补充分片适用于：课程组临时要求、评分口径说明、术语勘误、当期作业的特殊约定等。内容会直接进入检索候选集。" }),
                      ])
                    );
                    api.setFooter([
                      h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
                      h("button", {
                        class: "btn btn-primary", text: "保存并生效",
                        onclick() {
                          if (!title.value.trim() || !text.value.trim()) {
                            ZK.toast("分片标题与内容不能为空", "err");
                            return;
                          }
                          const u = ZK.db.currentUser();
                          ZK.db.insert("kbFragments", {
                            kbId: kb.id, title: title.value.trim(), text: text.value.trim(),
                            addedBy: u.name, addedAt: Date.now(), enabled: true, priority: Number(priority.value),
                          });
                          ZK.db.log("新增上下文分片", "《" + kb.name + "》新增补充分片：" + title.value.trim());
                          ZK.toast("分片已加入召回候选集");
                          api.close();
                          repaint();
                        },
                      }),
                    ]);
                  },
                });
              },
            }),
          ],
          body: [
            frags.length
              ? h("div", { class: "row-list" }, frags.map((f) =>
                  h("div", { class: "list-row", style: { "align-items": "flex-start", cursor: "default" } }, [
                    h("div", { class: "lr-icon ic-violet", html: ZK.icons.plus(15) }),
                    h("div", { class: "lr-main", style: { "white-space": "normal" } }, [
                      h("b", { text: f.title }),
                      h("div", { class: "fs-12 muted mt-4", style: { "line-height": "1.7", "white-space": "normal" }, text: f.text }),
                      h("div", { class: "row mt-8", style: { gap: "8px", "flex-wrap": "wrap" } }, [
                        ZK.ui.badge("权重 " + f.priority, "violet"),
                        ZK.ui.badge("添加人 " + f.addedBy, "gray"),
                        ZK.ui.badge(U.fmtDate(f.addedAt), "gray"),
                        f.enabled ? ZK.ui.badge("已启用", "emerald") : ZK.ui.badge("已停用", "gray"),
                      ]),
                    ]),
                    h("div", { class: "lr-tail" }, [
                      h("button", {
                        class: "btn btn-xs", text: f.enabled ? "停用" : "启用",
                        onclick: () => {
                          ZK.db.update("kbFragments", f.id, { enabled: !f.enabled });
                          ZK.db.log("切换补充分片状态", (f.enabled ? "停用" : "启用") + "分片：" + f.title);
                          repaint();
                        },
                      }),
                      h("button", {
                        class: "btn btn-xs btn-danger", html: ZK.icons.trash(12),
                        onclick: async () => {
                          const ok = await ZK.confirm({ title: "删除补充分片", message: "删除《" + U.escapeHtml(f.title) + "》？删除后不再参与召回。", danger: true, okText: "删除" });
                          if (!ok) return;
                          ZK.db.remove("kbFragments", f.id);
                          ZK.toast("分片已删除");
                          repaint();
                        },
                      }),
                    ]),
                  ])
                ))
              : ZK.ui.empty({ title: "暂无补充分片", desc: "补充分片用于在文档之外追加上下文，例如课程组临时要求、评分口径说明、术语勘误等。" }),
          ],
        });
      }

      /* --- 召回参数 --- */
      function renderRecall(kb, repaint) {
        const draft = recallDraft[kb.id] || {};
        const cfg = Object.assign({}, kb.recall, draft);
        const state = { mode: cfg.mode, fullDoc: !!cfg.fullDoc, rerank: !!cfg.rerank };
        const topK = h("input", { class: "input", type: "number", min: "1", max: "20", value: cfg.topK });
        const threshold = h("input", { type: "range", class: "input", min: "0", max: "0.9", step: "0.01", value: cfg.threshold });
        const thrVal = h("span", { class: "fs-13 em fw-6", text: Number(cfg.threshold).toFixed(2) });
        const sw = h("input", { type: "range", class: "input", min: "0", max: "1", step: "0.05", value: cfg.semanticWeight });
        const swVal = h("span", { class: "fs-13 em fw-6", text: Number(cfg.semanticWeight).toFixed(2) });
        const fwVal = h("span", { class: "fs-13 em fw-6", text: (1 - cfg.semanticWeight).toFixed(2) });
        const chunkSize = h("input", { class: "input", type: "number", min: "120", max: "900", step: "20", value: cfg.chunkSize });
        const overlap = h("input", { class: "input", type: "number", min: "0", max: "200", step: "10", value: cfg.overlap });

        /* 把当前表单值写进草稿，避免面板重绘时丢失未保存的编辑 */
        function snapshot() {
          recallDraft[kb.id] = {
            mode: state.mode,
            topK: U.clamp(Number(topK.value) || 5, 1, 20),
            threshold: Number(threshold.value),
            semanticWeight: Number(sw.value),
            fulltextWeight: Number((1 - Number(sw.value)).toFixed(2)),
            fullDoc: state.fullDoc,
            chunkSize: U.clamp(Number(chunkSize.value) || 300, 120, 900),
            overlap: U.clamp(Number(overlap.value) || 60, 0, 200),
            rerank: state.rerank,
          };
          return recallDraft[kb.id];
        }

        threshold.addEventListener("input", () => {
          thrVal.textContent = Number(threshold.value).toFixed(2);
          snapshot();
        });
        sw.addEventListener("input", () => {
          swVal.textContent = Number(sw.value).toFixed(2);
          fwVal.textContent = (1 - Number(sw.value)).toFixed(2);
          snapshot();
        });
        [topK, chunkSize, overlap].forEach((el) => el.addEventListener("input", snapshot));

        const preview = h("div", { style: { background: "rgba(31,41,55,0.4)", "border-radius": "10px", padding: "12px 14px" } });

        function updatePreview() {
          const idx = ZK.engine.buildIndex(kb.id);
          U.clear(preview);
          const docs = ZK.db.list("kbDocs", (d) => d.kbId === kb.id);
          const frags = ZK.db.list("kbFragments", (f) => f.kbId === kb.id);
          const newChunks = U.sum(docs.map((d) => ZK.engine.chunkText(d.text, Number(chunkSize.value), Number(overlap.value)).length));
          preview.appendChild(
            h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
              pv("当前分片数", idx.chunks.length + " 个"),
              pv("按新参数重算", newChunks + " 个"),
              pv("候选文档", docs.length + " 篇 + " + frags.length + " 条补充"),
              pv("词项规模", idx.idf.size + " 个"),
            ])
          );

          function pv(label, value) {
            return h("div", {}, [h("div", { class: "fs-11 ghost", text: label }), h("div", { class: "fs-15 fw-7 strong", text: value })]);
          }
        }
        [chunkSize, overlap].forEach((el) => el.addEventListener("input", U.debounce(updatePreview, 260)));
        updatePreview();

        const body = h("div", { class: "grid grid-2" }, [
          h("div", { class: "stack-16" }, [
            h("div", { class: "field" }, [
              h("label", { class: "label", text: "检索模式" }),
              ZK.ui.tabs([
                { id: "semantic", name: "语义检索" },
                { id: "fulltext", name: "全文检索" },
                { id: "hybrid", name: "混合检索" },
              ], state.mode, (id) => {
                state.mode = id;
                snapshot();
                redrawTabs();
              }),
              h("div", { class: "hint", text: "语义检索按词项权重向量计算余弦相似度；全文检索按查询词覆盖率与精确子串命中计分；混合检索按下方权重加权两者。" }),
            ]),
            h("div", { class: "field" }, [h("label", { class: "label", text: "召回条数 TopK" }), topK, h("div", { class: "hint", text: "单次检索最多返回的分片数量，范围 1-20" })]),
            h("div", { class: "field" }, [h("label", { class: "label" }, ["相似度阈值", thrVal]), threshold, h("div", { class: "hint", text: "低于该阈值的结果将被过滤。阈值过高会漏召回，过低会引入噪声。" })]),
            h("div", { class: "field" }, [h("label", { class: "label" }, ["语义权重 / 全文权重 ", swVal, " : ", fwVal]), sw, h("div", { class: "hint", text: "仅混合检索生效，两者之和恒为 1" })]),
          ]),
          h("div", { class: "stack-16" }, [
            h("div", { class: "field" }, [h("label", { class: "label", text: "分片大小（字）" }), chunkSize]),
            h("div", { class: "field" }, [h("label", { class: "label", text: "分片重叠（字）" }), overlap, h("div", { class: "hint", text: "重叠用于避免答案被切分边界截断，建议为分片大小的 15%-25%" })]),
            h("div", { class: "field" }, [
              h("label", { class: "label", text: "召回增强选项" }),
              h("label", { class: "check", style: { "margin-top": "6px" } }, [
                h("input", {
                  type: "checkbox", checked: state.fullDoc,
                  onchange: (e) => {
                    state.fullDoc = e.target.checked;
                    snapshot();
                    stateWrap.repaint();
                  },
                }),
                h("span", {}, [h("b", { class: "strong", text: "全文档召回" }), h("div", { class: "fs-11 ghost", text: "命中后返回整篇文档正文而非单个分片，适合需要完整上下文的场景" })]),
              ]),
              h("label", { class: "check", style: { "margin-top": "10px" } }, [
                h("input", { type: "checkbox", checked: state.rerank, onchange: (e) => { state.rerank = e.target.checked; snapshot(); } }),
                h("span", {}, [h("b", { class: "strong", text: "结果重排" }), h("div", { class: "fs-11 ghost", text: "对精确子串命中与上下文补充分片加权，提升高置信结果位次" })]),
              ]),
            ]),
            h("div", { class: "field" }, [h("label", { class: "label", text: "参数变更预览" }), preview]),
          ]),
        ]);

        const stateWrap = { repaint: () => repaint() };

        function redrawTabs() {
          repaint();
        }

        return ZK.ui.card({
          title: "召回参数设置",
          sub: "参数保存后立即作用于该知识库的所有检索请求",
          actions: [
            h("button", { class: "btn btn-sm", text: "恢复默认", onclick: () => { delete recallDraft[kb.id]; ZK.db.update("knowledgeBases", kb.id, { recall: { mode: "hybrid", topK: 6, threshold: 0.32, semanticWeight: 0.6, fulltextWeight: 0.4, fullDoc: false, chunkSize: 300, overlap: 60, rerank: true } }); ZK.db.log("恢复召回参数", "《" + kb.name + "》召回参数已恢复为系统默认值"); ZK.toast("已恢复默认参数"); repaint(); } }),
            h("button", {
              class: "btn btn-sm btn-primary", text: "保存参数",
              onclick() {
                const next = snapshot();
                delete recallDraft[kb.id];
                ZK.db.update("knowledgeBases", kb.id, { recall: Object.assign({}, next) });
                ZK.db.log("更新召回参数", "《" + kb.name + "》召回参数已更新为 " + MODE_NAME[next.mode] + "，TopK " + next.topK + "，阈值 " + Number(next.threshold).toFixed(2));
                ZK.toast("召回参数已保存并生效");
                repaint();
              },
            }),
          ],
          body: [body],
        });
      }

      /* --- 切换知识库 --- */
      function openSwitch() {
        ZK.modal({
          title: "切换知识库",
          size: "sm",
          render(api) {
            api.body.appendChild(
              h("div", { class: "row-list" }, ZK.db.list("knowledgeBases").map((k) =>
                h("button", {
                  class: "list-row",
                  onclick: () => {
                    api.close();
                    go("#/kb/detail/" + k.id);
                    setTimeout(() => ZK.app.refresh(), 30);
                  },
                }, [
                  h("div", { class: "lr-icon ic-emerald", html: ZK.icons.database(15) }),
                  h("div", { class: "lr-main" }, [h("b", { text: k.name }), h("span", { text: k.course + " · " + ZK.db.list("kbDocs", (d) => d.kbId === k.id).length + " 篇文档" })]),
                ])
              ))
            );
          },
        });
      }

      root.appendChild(host);
      paint();
    },
  };

  /* --- 训练动作 --- */
  function train(kb, done) {
    const m = ZK.modal({
      title: "知识库训练",
      sub: kb.name,
      size: "sm",
      dismissible: false,
      footer: false,
      render(api) {
        const bar = h("div", { class: "scan-bar mb-16" });
        const logBox = h("div", { style: { "font-size": "12.5px", color: "var(--text-muted)", "line-height": "2", "font-family": "var(--font-mono)" } });
        const ringHost = h("div", { class: "ring-wrap mb-16" });
        api.body.appendChild(h("div", {}, [ringHost, bar, logBox]));

        const docs = ZK.db.list("kbDocs", (d) => d.kbId === kb.id);
        const frags = ZK.db.list("kbFragments", (f) => f.kbId === kb.id);
        const steps = [
          { t: "读取文档集合", fn: () => "共 " + docs.length + " 篇文档，补充上下文 " + frags.length + " 条" },
          { t: "文本清洗与分句", fn: () => "按 " + kb.recall.chunkSize + " 字 / 重叠 " + kb.recall.overlap + " 字切分" },
          {
            t: "分片切分",
            fn: () => {
              const idx = ZK.engine.buildIndex(kb.id);
              return "生成分片 " + idx.chunks.length + " 个";
            },
          },
          { t: "词项统计与 IDF 计算", fn: () => { const idx = ZK.engine.buildIndex(kb.id); return "词项规模 " + idx.idf.size + " 个，平均分片长度 " + U.round(idx.avgLen) + " 词"; } },
          { t: "建立倒排与向量索引", fn: () => "语义 / 全文双索引就绪" },
          { t: "写入知识库状态", fn: () => { ZK.db.update("knowledgeBases", kb.id, { status: "trained", trainedAt: Date.now() }); return "训练完成"; } },
        ];

        let i = 0;
        function step() {
          if (i >= steps.length) {
            const idx = ZK.engine.buildIndex(kb.id);
            U.clear(ringHost);
            ringHost.appendChild(ZK.ui.ring({ pct: 100, size: 108, color: "#2563eb", text: "完成", sub: idx.chunks.length + " 分片" }));
            logBox.appendChild(h("div", { class: "em", text: "› 训练完成，索引已生效，可立即执行检索" }));
            api.setFooter([h("button", { class: "button btn btn-primary", text: "关闭", onclick: () => { api.close(); if (done) done(); } })]);
            ZK.db.log("知识库训练", "《" + kb.name + "》完成训练，生成 " + idx.chunks.length + " 个分片");
            ZK.toast("知识库训练完成");
            return;
          }
          const s = steps[i];
          const pct = Math.round(((i + 1) / steps.length) * 100);
          U.clear(ringHost);
          ringHost.appendChild(ZK.ui.ring({ pct: pct, size: 108, color: "#60a5fa", text: pct + "%", sub: "训练中" }));
          const out = s.fn();
          logBox.appendChild(h("div", { text: "› " + s.t + " … " + out }));
          i += 1;
          setTimeout(step, 420);
        }
        step();
      },
    });
    void m;
  }

  /* ============================ 资源导入与文献对接 ============================ */
  P["kb/import"] = {
    render(root, param) {
      const host = h("div");
      let selectedKb = param || (ZK.db.list("knowledgeBases")[0] || {}).id;
      const pickedBooks = {};
      const pickedResources = {};
      const logLines = [];
      let tab = "books";

      function paint() {
        U.clear(host);
        const kb = ZK.db.find("knowledgeBases", selectedKb);

        host.appendChild(
          ZK.ui.pageHead({
            title: "资源导入与文献对接",
            sub: "一键同步在线课程资源、对接文献库批量导入书籍，也可上传本地文档入库。导入完成后自动进入待训练状态。",
            actions: [
              h("div", { class: "field", style: { "min-width": "260px" } }, [
                h("select", {
                  class: "select",
                  onchange: (e) => {
                    selectedKb = e.target.value;
                    paint();
                  },
                }, ZK.db.list("knowledgeBases").map((k) => h("option", { value: k.id, selected: k.id === selectedKb, text: k.name }))),
              ]),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-4 mb-16" }, [
            ZK.ui.statCard({ label: "目标知识库文档", value: String(ZK.db.list("kbDocs", (d) => d.kbId === kb.id).length), target: "篇", icon: ZK.icons.fileText(18), tone: "emerald", progress: 64 }),
            ZK.ui.statCard({ label: "文献库可导入", value: String(ZK.db.list("libraryBooks").length), target: "本（已对接馆藏接口）", icon: ZK.icons.book(18), tone: "amber", progress: 100 }),
            ZK.ui.statCard({ label: "在线课程资源", value: String(ZK.db.list("resources").length), target: "项（已对接课程平台）", icon: ZK.icons.cloud(18), tone: "blue", progress: 100 }),
            ZK.ui.statCard({ label: "本次已导入", value: String(ZK.db.list("importBatches").filter((b) => b.kbId === kb.id).reduce((s, b) => s + b.count, 0)), target: "篇新增文档", icon: ZK.icons.upload(18), tone: "violet", progress: 42 }),
          ])
        );

        const tabBar = ZK.ui.tabs(
          [
            { id: "books", name: "文献库对接导入" },
            { id: "resources", name: "在线课程资源同步" },
            { id: "upload", name: "上传本地文档" },
            { id: "logs", name: "导入记录" },
          ],
          tab,
          (id) => {
            tab = id;
            paint();
          }
        );

        const body = h("div", { class: "mt-16" });
        if (tab === "books") body.appendChild(booksPane(kb, paint));
        if (tab === "resources") body.appendChild(resourcesPane(kb, paint));
        if (tab === "upload") body.appendChild(uploadPane(kb, paint));
        if (tab === "logs") body.appendChild(logsPane(kb));

        host.appendChild(h("div", { class: "mb-12" }, [tabBar]));
        host.appendChild(body);
      }

      /* --- 文献库导入 --- */
      function booksPane(kb, repaint) {
        const books = ZK.db.list("libraryBooks");
        const imported = {};
        ZK.db.list("kbDocs", (d) => d.kbId === kb.id && d.sourceId).forEach((d) => (imported[d.sourceId] = d));
        let cat = "全部";

        const cats = ["全部"].concat(Array.from(new Set(books.map((b) => b.category))));
        const host = h("div");

        function paintInner() {
          U.clear(host);
          const list = cat === "全部" ? books : books.filter((b) => b.category === cat);
          const picked = Object.keys(pickedBooks).filter((k) => pickedBooks[k]);

          host.appendChild(
            ZK.ui.card({
              title: "文献库对接",
              sub: "已通过图书馆馆藏接口（ext_library）同步 " + books.length + " 本课程相关书目，勾选后一次性导入知识库",
              icon: ZK.icons.book(16),
              actions: [
                h("button", { class: "btn btn-sm", text: "全选本页", onclick: () => { list.forEach((b) => { if (!imported[b.id]) pickedBooks[b.id] = true; }); paintInner(); } }),
                h("button", { class: "btn btn-sm", text: "清空选择", onclick: () => { Object.keys(pickedBooks).forEach((k) => delete pickedBooks[k]); paintInner(); } }),
                h("button", {
                  class: "btn btn-sm btn-primary",
                  html: ZK.icons.download(14) + "<span>批量导入（" + picked.length + "）</span>",
                  disabled: picked.length === 0,
                  onclick: () => runImportBatch(kb, picked, repaint),
                }),
                h("button", {
                  class: "btn btn-sm btn-primary",
                  html: ZK.icons.sync(14) + "<span>一键导入全部 " + books.filter((b) => !imported[b.id]).length + " 本</span>",
                  disabled: books.filter((b) => !imported[b.id]).length === 0,
                  onclick: () => runImportBatch(kb, books.filter((b) => !imported[b.id]).map((b) => b.id), repaint),
                }),
              ],
              body: [
                h("div", { class: "row-between mb-12" }, [
                  h("div", { class: "chip-wrap" }, cats.map((c) =>
                    h("button", { class: "chip" + (c === cat ? " on" : ""), text: c + (c === "全部" ? "（" + books.length + "）" : "（" + books.filter((b) => b.category === c).length + "）"), onclick: () => { cat = c; paintInner(); } })
                  )),
                  h("span", { class: "fs-12 faint", text: "已导入 " + Object.keys(imported).length + " / " + books.length + " 本" }),
                ]),
                h("div", { class: "grid grid-2", style: { gap: "10px" } }, list.map((b) => {
                  const done = imported[b.id];
                  const on = !!pickedBooks[b.id];
                  return h("div", {
                    class: "list-row",
                    style: {
                      cursor: done ? "default" : "pointer",
                      border: "1px solid " + (on ? "var(--accent-line)" : "transparent"),
                      background: on ? "var(--accent-dim)" : "",
                      "align-items": "flex-start",
                    },
                    onclick: () => {
                      if (done) return;
                      pickedBooks[b.id] = !pickedBooks[b.id];
                      paintInner();
                    },
                  }, [
                    h("div", { class: "lr-icon " + (done ? "ic-emerald" : on ? "ic-emerald" : "ic-gray"), html: done ? ZK.icons.check(15) : ZK.icons.book(15) }),
                    h("div", { class: "lr-main", style: { "white-space": "normal" } }, [
                      h("b", { text: b.title }),
                      h("span", { text: b.author + " · " + b.publisher + " · " + b.year + " · " + b.category }),
                      h("div", { class: "fs-11 muted mt-4", style: { "white-space": "normal", "line-height": "1.6" }, text: U.truncate(b.summary, 68) }),
                      h("div", { class: "row mt-8", style: { gap: "6px", "flex-wrap": "wrap" } }, [
                        ZK.ui.badge(b.pages + " 页", "gray"),
                        ZK.ui.badge("可借 " + b.stock + "/" + b.total, b.stock > 0 ? "emerald" : "red"),
                        ZK.ui.badge("借阅 " + b.borrowCount, "gray"),
                        b.recommended ? ZK.ui.badge("课程推荐", "amber") : null,
                        done ? ZK.ui.badge("已导入", "emerald") : null,
                      ]),
                    ]),
                  ]);
                })),
              ],
            })
          );
        }
        paintInner();
        return host;
      }

      function runImportBatch(kb, ids, repaint) {
        const books = ZK.db.list("libraryBooks").filter((b) => ids.indexOf(b.id) >= 0);
        if (!books.length) {
          ZK.toast("没有可导入的书目", "warn");
          return;
        }
        const m = ZK.modal({
          title: "批量导入文献书籍",
          sub: "目标知识库：" + kb.name + " · 待导入 " + books.length + " 本",
          size: "lg",
          dismissible: false,
          footer: false,
          render(api) {
            const ringHost = h("div", { class: "ring-wrap mb-16" });
            const bar = h("div", { class: "scan-bar mb-12" });
            const listBox = h("div", { style: { "max-height": "300px", overflow: "auto", display: "flex", "flex-direction": "column", gap: "6px" } });
            api.body.appendChild(h("div", {}, [ringHost, bar, listBox]));

            let i = 0;
            const created = [];
            function step() {
              if (i >= books.length) {
                U.clear(ringHost);
                ringHost.appendChild(ZK.ui.ring({ pct: 100, size: 104, color: "#2563eb", text: "完成", sub: created.length + " 本" }));
                ZK.db.insert("importBatches", {
                  id: U.uid("ib"), kbId: kb.id, type: "文献库对接", count: created.length,
                  items: created.map((c) => c.title), at: Date.now(), operator: (ZK.db.currentUser() || {}).name,
                });
                ZK.db.update("knowledgeBases", kb.id, { status: "untrained" });
                ZK.db.log("批量导入文献书籍", "向《" + kb.name + "》导入 " + created.length + " 本课程相关书籍");
                ZK.toast("已导入 " + created.length + " 本，知识库状态转为待训练");
                api.setFooter([
                  h("button", { class: "button btn", text: "关闭", onclick: () => { api.close(); Object.keys(pickedBooks).forEach((k) => delete pickedBooks[k]); repaint(); } }),
                  h("button", { class: "button btn btn-primary", text: "立即执行训练", onclick: () => { api.close(); Object.keys(pickedBooks).forEach((k) => delete pickedBooks[k]); repaint(); train(ZK.db.find("knowledgeBases", kb.id), repaint); } }),
                ]);
                return;
              }
              const b = books[i];
              const doc = ZK.db.insert("kbDocs", {
                kbId: kb.id, title: "《" + b.title + "》", type: "文献书籍",
                chapter: 0, source: "文献库对接", sourceId: b.id, author: b.author,
                words: bookToDocText(b).length, tokens: U.tokenize(bookToDocText(b)).length,
                chunks: Math.max(1, Math.round(bookToDocText(b).length / kb.recall.chunkSize)),
                text: bookToDocText(b), addedAt: Date.now(), status: "indexed",
              });
              created.push(doc);
              const pct = Math.round(((i + 1) / books.length) * 100);
              U.clear(ringHost);
              ringHost.appendChild(ZK.ui.ring({ pct: pct, size: 104, color: "#60a5fa", text: pct + "%", sub: (i + 1) + " / " + books.length }));
              listBox.insertBefore(
                h("div", { class: "row", style: { gap: "8px", "font-size": "12px", color: "var(--text-muted)" } }, [
                  h("span", { class: "em", text: "✓" }),
                  h("span", { text: b.title }),
                  h("span", { class: "faint", text: "· " + U.num(doc.words) + " 字 · " + doc.chunks + " 分片" }),
                ]),
                listBox.firstChild
              );
              i += 1;
              setTimeout(step, 110);
            }
            step();
          },
        });
        void m;
      }

      /* --- 在线课程资源同步 --- */
      function resourcesPane(kb, repaint) {
        const resources = ZK.db.list("resources");
        const kps = ZK.db.list("knowledgePoints");
        const importedIds = {};
        ZK.db.list("kbDocs", (d) => d.kbId === kb.id && d.sourceKind === "resource").forEach((d) => (importedIds[d.sourceId] = d));
        const host = h("div");
        let typeFilter = "全部";

        function paintInner() {
          U.clear(host);
          const types = ["全部"].concat(Array.from(new Set(resources.map((r) => r.type))));
          const list = typeFilter === "全部" ? resources : resources.filter((r) => r.type === typeFilter);
          const picked = Object.keys(pickedResources).filter((k) => pickedResources[k]);

          host.appendChild(
            ZK.ui.card({
              title: "在线课程资源一键同步",
              sub: "已对接课程资源库，共 " + resources.length + " 项资源，勾选后同步为知识库文档",
              icon: ZK.icons.cloud(16),
              actions: [
                h("button", { class: "btn btn-sm", text: "选择全部未同步", onclick: () => { resources.forEach((r) => { if (!importedIds[r.id]) pickedResources[r.id] = true; }); paintInner(); } }),
                h("button", { class: "btn btn-sm", text: "清空", onclick: () => { Object.keys(pickedResources).forEach((k) => delete pickedResources[k]); paintInner(); } }),
                h("button", {
                  class: "btn btn-sm btn-primary",
                  html: ZK.icons.sync(14) + "<span>同步所选（" + picked.length + "）</span>",
                  disabled: !picked.length,
                  onclick: () => runSync(kb, picked, repaint),
                }),
                h("button", {
                  class: "btn btn-sm btn-primary",
                  html: ZK.icons.refresh(14) + "<span>一键同步全部</span>",
                  onclick: () => runSync(kb, resources.filter((r) => !importedIds[r.id]).map((r) => r.id), repaint),
                }),
              ],
              body: [
                h("div", { class: "row-between mb-12" }, [
                  h("div", { class: "chip-wrap" }, types.map((t) =>
                    h("button", { class: "chip" + (t === typeFilter ? " on" : ""), text: t, onclick: () => { typeFilter = t; paintInner(); } })
                  )),
                  h("span", { class: "fs-12 faint", text: "已同步 " + Object.keys(importedIds).length + " / " + resources.length + " 项" }),
                ]),
                ZK.ui.table({
                  pageSize: 8,
                  rows: list.map((r) => Object.assign({}, r, { done: !!importedIds[r.id] })),
                  searchKeys: ["title", "type", "publisher"],
                  searchPlaceholder: "搜索资源标题…",
                  columns: [
                    {
                      key: "sel", label: "", width: "40px",
                      render: (r) => r.done
                        ? h("span", { class: "em", html: ZK.icons.check(15) })
                        : h("input", {
                            type: "checkbox", checked: !!pickedResources[r.id],
                            style: { "accent-color": "var(--accent)" },
                            onchange: (e) => {
                              pickedResources[r.id] = e.target.checked;
                              paintInner();
                            },
                          }),
                    },
                    { key: "title", label: "资源标题", sortable: true, render: (r) => h("span", { class: "cell-strong", text: r.title }) },
                    { key: "type", label: "类型", render: (r) => ZK.ui.badge(r.type, r.type === "视频" ? "blue" : r.type === "习题" ? "violet" : "gray") },
                    { key: "chapter", label: "章", align: "right", sortable: true, render: (r) => "第 " + r.chapter + " 章" },
                    { key: "learners", label: "已学人数", align: "right", sortable: true, render: (r) => U.num(r.learners) },
                    { key: "completion", label: "完成率", align: "right", sortable: true, render: (r) => ZK.ui.progressLine(r.completion, r.completion >= 80 ? "emerald" : "amber", r.completion + "%") },
                    { key: "synced", label: "同步状态", render: (r) => (r.done ? ZK.ui.badge("已同步", "emerald") : ZK.ui.badge("未同步", "gray")) },
                  ],
                }),
              ],
            })
          );
        }
        paintInner();
        return host;
      }

      function runSync(kb, ids, repaint) {
        const resources = ZK.db.list("resources").filter((r) => ids.indexOf(r.id) >= 0);
        if (!resources.length) {
          ZK.toast("没有可同步的资源", "warn");
          return;
        }
        const kps = ZK.db.list("knowledgePoints");
        const m = ZK.modal({
          title: "同步在线课程资源",
          sub: "目标知识库：" + kb.name + " · 待同步 " + resources.length + " 项",
          size: "lg",
          dismissible: false,
          footer: false,
          render(api) {
            const ringHost = h("div", { class: "ring-wrap mb-16" });
            const bar = h("div", { class: "scan-bar mb-12" });
            const logBox = h("div", { style: { "max-height": "290px", overflow: "auto", "font-size": "12px", "font-family": "var(--font-mono)", "line-height": "1.9", color: "var(--text-muted)" } });
            api.body.appendChild(h("div", {}, [ringHost, bar, logBox]));

            let i = 0;
            const created = [];
            function step() {
              if (i >= resources.length) {
                U.clear(ringHost);
                ringHost.appendChild(ZK.ui.ring({ pct: 100, size: 104, color: "#2563eb", text: "完成", sub: created.length + " 项" }));
                ZK.db.insert("importBatches", {
                  id: U.uid("ib"), kbId: kb.id, type: "在线资源同步", count: created.length,
                  items: created.map((c) => c.title), at: Date.now(), operator: (ZK.db.currentUser() || {}).name,
                });
                ZK.db.update("knowledgeBases", kb.id, { status: "untrained" });
                ZK.db.log("同步在线课程资源", "向《" + kb.name + "》同步 " + created.length + " 项课程资源");
                ZK.toast("已同步 " + created.length + " 项资源");
                api.setFooter([
                  h("button", { class: "button btn", text: "关闭", onclick: () => { api.close(); Object.keys(pickedResources).forEach((k) => delete pickedResources[k]); repaint(); } }),
                  h("button", { class: "button btn btn-primary", text: "立即执行训练", onclick: () => { api.close(); Object.keys(pickedResources).forEach((k) => delete pickedResources[k]); repaint(); train(ZK.db.find("knowledgeBases", kb.id), repaint); } }),
                ]);
                return;
              }
              const r = resources[i];
              const kp = kps.find((k) => k.chapter === r.chapter);
              const text = resourceToDocText(r, kp);
              const doc = ZK.db.insert("kbDocs", {
                kbId: kb.id, title: r.title, type: "在线资源", chapter: r.chapter,
                source: "在线课程资源同步", sourceId: r.id, sourceKind: "resource",
                author: r.publisher, words: text.length, tokens: U.tokenize(text).length,
                chunks: Math.max(1, Math.round(text.length / kb.recall.chunkSize)),
                text: text, addedAt: Date.now(), status: "indexed",
              });
              created.push(doc);
              logBox.insertBefore(
                h("div", { text: "› [" + r.type + "] " + U.truncate(r.title, 34) + " → " + doc.chunks + " 分片" }),
                logBox.firstChild
              );
              const pct = Math.round(((i + 1) / resources.length) * 100);
              U.clear(ringHost);
              ringHost.appendChild(ZK.ui.ring({ pct: pct, size: 104, color: "#60a5fa", text: pct + "%", sub: (i + 1) + " / " + resources.length }));
              i += 1;
              setTimeout(step, 100);
            }
            step();
          },
        });
        void m;
      }

      /* --- 上传本地文档 --- */
      function uploadPane(kb, repaint) {
        const title = h("input", { class: "input", placeholder: "文档标题" });
        const type = h("select", { class: "select" }, ["课程讲义", "文献书籍", "规范标准", "案例集", "试卷", "其他"].map((t) => h("option", { text: t })));
        const chapter = h("input", { class: "input", type: "number", min: "0", max: "20", value: "1" });
        const text = h("textarea", { class: "textarea", style: { "min-height": "180px" }, placeholder: "在此粘贴文档正文，或从上方选择文件自动读取（支持 .txt / .md / .csv 等纯文本格式）" });
        const fileInfo = h("div", { class: "fs-12 faint mt-8" });

        const input = h("input", {
          type: "file",
          accept: ".txt,.md,.csv,.json,text/*",
          style: { display: "none" },
          onchange(e) {
            const f = e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
              text.value = String(reader.result || "");
              if (!title.value) title.value = f.name.replace(/\.[^.]+$/, "");
              fileInfo.textContent = "已读取：" + f.name + " · " + U.bytes(f.size) + " · " + text.value.length + " 字符";
              ZK.toast("文件内容已读入，可继续编辑后保存");
            };
            reader.readAsText(f, "utf-8");
          },
        });

        const drop = h("div", { class: "drop-zone", onclick: () => input.click() }, [
          h("div", { class: "dz-icon", html: ZK.icons.upload(20) }),
          h("b", { text: "点击选择文件，或把文件拖到此处" }),
          h("span", { text: "支持纯文本类格式，读取后可在下方编辑再入库；也可直接把正文粘贴到文本框" }),
        ]);
        drop.addEventListener("dragover", (e) => {
          e.preventDefault();
          drop.classList.add("over");
        });
        drop.addEventListener("dragleave", () => drop.classList.remove("over"));
        drop.addEventListener("drop", (e) => {
          e.preventDefault();
          drop.classList.remove("over");
          const f = e.dataTransfer.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            text.value = String(reader.result || "");
            if (!title.value) title.value = f.name.replace(/\.[^.]+$/, "");
            fileInfo.textContent = "已读取：" + f.name + " · " + U.bytes(f.size);
          };
          reader.readAsText(f, "utf-8");
        });

        return ZK.ui.card({
          title: "上传本地文档入库",
          sub: "当前目标知识库：" + kb.name,
          icon: ZK.icons.upload(16),
          body: [
            h("div", { class: "grid grid-2" }, [
              h("div", { class: "stack-16" }, [
                drop,
                input,
                fileInfo,
                h("div", { class: "field" }, [h("label", { class: "label", text: "文档标题" }), title]),
                h("div", { class: "grid grid-2" }, [
                  h("div", { class: "field" }, [h("label", { class: "label", text: "文档类型" }), type]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "关联章节" }), chapter]),
                ]),
                h("button", {
                  class: "btn btn-primary btn-block",
                  html: ZK.icons.plus(14) + "<span>加入知识库</span>",
                  onclick() {
                    const body = text.value.trim();
                    if (!body) {
                      ZK.toast("请先选择文件或粘贴正文内容", "err");
                      return;
                    }
                    if (!title.value.trim()) {
                      ZK.toast("请填写文档标题", "err");
                      return;
                    }
                    const u = ZK.db.currentUser();
                    const doc = ZK.db.insert("kbDocs", {
                      kbId: kb.id, title: title.value.trim(), type: type.value,
                      chapter: Number(chapter.value) || 0, source: "本地上传",
                      author: u.name, words: body.length, tokens: U.tokenize(body).length,
                      chunks: Math.max(1, Math.round(body.length / kb.recall.chunkSize)),
                      text: body, addedAt: Date.now(), status: "indexed",
                    });
                    ZK.db.insert("importBatches", {
                      id: U.uid("ib"), kbId: kb.id, type: "本地上传", count: 1,
                      items: [doc.title], at: Date.now(), operator: u.name,
                    });
                    ZK.db.update("knowledgeBases", kb.id, { status: "untrained" });
                    ZK.db.log("上传文档入库", "《" + doc.title + "》加入知识库《" + kb.name + "》");
                    ZK.toast("已入库 " + doc.words + " 字，切分 " + doc.chunks + " 个分片，请执行训练");
                    title.value = "";
                    text.value = "";
                    fileInfo.textContent = "";
                    repaint();
                  },
                }),
              ]),
              h("div", { class: "stack-12" }, [
                h("div", { class: "fs-13 fw-6 strong", text: "正文内容预览/编辑" }),
                text,
                h("div", { class: "advice info", text: "入库后文档将按当前召回参数切分为分片，参与语义与全文检索。建议正文保持段落完整、术语统一，避免表格与图片造成的结构断裂。" }),
              ]),
            ]),
          ],
        });
      }

      /* --- 导入记录 --- */
      function logsPane(kb) {
        const batches = ZK.db.list("importBatches", (b) => b.kbId === kb.id);
        return ZK.ui.card({
          title: "导入记录",
          sub: "《" + kb.name + "》的历史导入批次",
          icon: ZK.icons.clockHistory(16),
          body: [
            batches.length
              ? h("div", { class: "row-list" }, batches.map((b) =>
                  h("div", { class: "list-row", style: { "align-items": "flex-start", cursor: "default" } }, [
                    h("div", { class: "lr-icon ic-blue", html: ZK.icons.download(15) }),
                    h("div", { class: "lr-main", style: { "white-space": "normal" } }, [
                      h("b", { text: b.type + " · 导入 " + b.count + " 篇" }),
                      h("div", { class: "fs-12 muted mt-4", style: { "white-space": "normal" }, text: b.items.slice(0, 4).join("、") + (b.items.length > 4 ? " 等 " + b.items.length + " 项" : "") }),
                      h("div", { class: "fs-11 ghost mt-4", text: "操作人 " + b.operator + " · " + U.fmtDateTime(b.at) }),
                    ]),
                    h("div", { class: "lr-tail" }, [ZK.ui.badge(b.count + " 篇", "emerald")]),
                  ])
                ))
              : ZK.ui.empty({ title: "暂无导入记录", desc: "从「文献库对接导入」或「在线课程资源同步」发起导入后会在此留存记录。" }),
          ],
        });
      }

      root.appendChild(host);
      paint();
    },
  };

  /* ============================ 召回参数与检索测试 ============================ */
  P["kb/recall"] = {
    render(root, param) {
      const kbId = param || (ZK.db.list("knowledgeBases")[0] || {}).id;
      const host = h("div");
      let query = "";
      let result = null;

      function paint() {
        U.clear(host);
        const kb = ZK.db.find("knowledgeBases", kbId);
        if (!kb) return;
        const cfg = kb.recall;

        host.appendChild(
          ZK.ui.pageHead({
            title: "召回参数与检索测试",
            sub: "知识库《" + kb.name + "》· 当前模式 " + MODE_NAME[cfg.mode] + " · TopK " + cfg.topK + " · 阈值 " + Number(cfg.threshold).toFixed(2) +
              (cfg.fullDoc ? " · 已开启全文档召回" : "") + (cfg.rerank ? " · 已开启结果重排" : ""),
            actions: [
              h("select", { class: "select", style: { width: "230px" }, onchange: (e) => { kbId = e.target.value; result = null; paint(); } },
                ZK.db.list("knowledgeBases").map((k) => h("option", { value: k.id, selected: k.id === kbId, text: k.name }))),
              h("button", { class: "btn btn-sm", text: "调整参数", onclick: () => go("#/kb/detail/" + kbId) }),
            ],
          })
        );

        /* 检索区 */
        const input = h("input", { class: "input", placeholder: "输入检索问题，例如：合同中的情态动词如何区分义务与陈述", value: query });
        const modeSel = h("select", { class: "select", style: { width: "140px" }, onchange: (e) => { override.mode = e.target.value; } },
          Object.keys(MODE_NAME).map((k) => h("option", { value: k, selected: k === cfg.mode, text: MODE_NAME[k] })));
        const fullDocCb = h("input", { type: "checkbox", checked: cfg.fullDoc });
        const override = { mode: cfg.mode };
        const t0 = { v: 0 };

        function run() {
          query = input.value.trim();
          if (!query) {
            ZK.toast("请输入检索内容", "warn");
            return;
          }
          const start = performance.now();
          const res = ZK.engine.retrieve(kbId, query, { mode: override.mode, fullDoc: fullDocCb.checked });
          const latency = Math.round(performance.now() - start);
          ZK.db.insert("retrievalLogs", { id: U.uid("rl"), kbId: kbId, query: query, mode: override.mode, hits: res.hits.length, latency: latency, at: Date.now() });
          result = Object.assign(res, { latency: latency, query: query });
          paint();
        }

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") run();
        });

        host.appendChild(
          ZK.ui.card({
            title: "检索测试",
            sub: "检索过程完全在本地执行：分片切分 → 词项加权 → 相似度计算 → 阈值过滤 → 排序截断",
            icon: ZK.icons.search(16),
            body: [
              h("div", { class: "row", style: { gap: "10px", "flex-wrap": "wrap" } }, [
                h("div", { class: "search-box", style: { flex: "1", "min-width": "280px" } }, [h("span", { html: ZK.icons.search(14) }), input]),
                modeSel,
                h("label", { class: "check" }, [fullDocCb, h("span", { text: "全文档召回" })]),
                h("button", { class: "btn btn-primary", html: ZK.icons.play(14) + "<span>执行检索</span>", onclick: run }),
              ]),
              h("div", { class: "chip-wrap mt-12" }, [
                h("span", { class: "fs-12 ghost", text: "快捷示例：" }),
                ...["合同情态动词 shall may will 的区别", "术语一致性与术语库建设", "长句拆分与语序重组", "Incoterms 2020 修订", "翻译质量评估错误分级", "高语境低语境谈判风格"]
                  .map((q) => h("button", { class: "chip", text: q, onclick: () => { input.value = q; run(); } })),
              ]),
            ],
          })
        );

        /* 参数摘要 */
        host.appendChild(
          h("div", { class: "grid grid-4 mt-16" }, [
            ZK.ui.statCard({ label: "召回条数 TopK", value: String(cfg.topK), target: "上限 20", icon: ZK.icons.layers(18), tone: "emerald", progress: cfg.topK * 5 }),
            ZK.ui.statCard({ label: "相似度阈值", value: Number(cfg.threshold).toFixed(2), target: cfg.threshold > 0.45 ? "偏严格" : cfg.threshold < 0.2 ? "偏宽松" : "适中", icon: ZK.icons.sliders(18), tone: "blue", progress: cfg.threshold * 100 }),
            ZK.ui.statCard({ label: "语义/全文权重", value: cfg.semanticWeight + " : " + cfg.fulltextWeight, target: "仅混合检索生效", icon: ZK.icons.cpu(18), tone: "violet", progress: cfg.semanticWeight * 100 }),
            ZK.ui.statCard({ label: "分片大小/重叠", value: cfg.chunkSize + " / " + cfg.overlap, target: "字", icon: ZK.icons.code(18), tone: "amber", progress: (cfg.chunkSize / 900) * 100 }),
          ])
        );

        /* 结果 */
        if (result) {
          const st = ZK.engine.kbStats(kbId);
          host.appendChild(
            ZK.ui.card({
              class: "mt-16",
              title: "检索结果",
              sub: "查询：“" + result.query + "” · 模式：" + MODE_NAME[result.mode] + " · 候选分片 " + result.stats.candidate +
                " 个 · 命中 " + result.hits.length + " 条 · 耗时 " + result.latency + " ms",
              icon: ZK.icons.list(16),
              actions: [
                h("button", {
                  class: "btn btn-sm", html: ZK.icons.messages(14) + "<span>用问答方式呈现</span>",
                  onclick: () => {
                    const ans = ZK.engine.composeAnswer(result.query, result.hits);
                    ZK.modal({
                      title: "知识库问答结果", sub: "基于 " + result.hits.length + " 个命中分片生成", size: "lg",
                      render(api) {
                        api.body.appendChild(
                          h("div", { class: "stack-16" }, [
                            h("div", { class: "chat-bubble", style: { "white-space": "pre-wrap" }, text: ans.text }),
                            h("div", {}, [
                              h("div", { class: "fs-13 fw-6 strong mb-8", text: "来源出处" }),
                              h("div", { class: "row-list" }, ans.cites.map((c) =>
                                h("div", { class: "list-row", style: { cursor: "default" } }, [
                                  h("div", { class: "lr-icon ic-emerald", text: String(c.index) }),
                                  h("div", { class: "lr-main" }, [h("b", { text: c.docTitle }), h("span", { text: "第 " + c.chapter + " 章 · 分片 " + c.chunk + " · 相关度 " + c.score })]),
                                ])
                              )),
                            ]),
                          ])
                        );
                      },
                    });
                  },
                }),
              ],
              body: [
                result.hits.length
                  ? h("div", { class: "row-list" }, result.hits.map((hh, i) =>
                      h("div", { class: "list-row", style: { "align-items": "flex-start", cursor: "default", "border-color": "var(--border-default)" } }, [
                        h("div", { class: "lr-icon " + (i === 0 ? "ic-emerald" : "ic-gray"), text: String(i + 1) }),
                        h("div", { class: "lr-main", style: { "white-space": "normal" } }, [
                          h("div", { class: "row-between" }, [
                            h("b", { text: hh.docTitle + "（分片 " + hh.index + "/" + hh.total + "）" }),
                            h("div", { class: "row", style: { gap: "6px" } }, [
                              ZK.ui.badge("综合 " + hh.final, i === 0 ? "emerald" : "gray"),
                              ZK.ui.badge("语义 " + hh.semantic, "blue"),
                              ZK.ui.badge("全文 " + hh.fulltext, "violet"),
                            ]),
                          ]),
                          h("div", { class: "corpus mt-8", style: { "font-size": "12.5px" }, html: ZK.engine.markHits(U.truncate(hh.text, 420), hh.matched) }),
                          h("div", { class: "chip-wrap mt-8" }, hh.matched.slice(0, 10).map((m) => h("span", { class: "chip", style: { padding: "2px 8px", "font-size": "11px" }, text: m }))),
                          h("div", { class: "fs-11 ghost mt-4", text: "类型：" + hh.docType + " · 章节：" + hh.chapter + (hh.wholeDoc ? " · 已按全文档展开" : "") }),
                        ]),
                      ])
                    ))
                  : ZK.ui.empty({
                      title: "没有命中任何分片",
                      desc: "当前阈值 " + Number(cfg.threshold).toFixed(2) + " 可能偏高，或知识库中缺少相关文档。可以降低阈值、提高 TopK，或补充上下文分片后重试。",
                    }),
              ],
            })
          );

          host.appendChild(
            ZK.ui.card({
              class: "mt-16",
              title: "检索过程指标",
              sub: "用于说明该次检索的规模与耗时",
              icon: ZK.icons.cpu(16),
              body: [
                ZK.ui.kv([
                  ["知识库文档数", st.docs + " 篇"],
                  ["参与计算的分片", result.stats.chunks + " 个（含补充分片 " + result.stats.fragments + " 条）"],
                  ["候选分片总数", result.stats.candidate + " 个"],
                  ["阈值过滤后命中", result.hits.length + " 条"],
                  ["检索耗时", result.latency + " ms"],
                  ["累计检索次数", (st.queries + 1) + " 次"],
                ]),
              ],
            })
          );
        } else {
          host.appendChild(
            ZK.ui.card({
              class: "mt-16",
              title: "尚未执行检索",
              icon: ZK.icons.info(16),
              body: [ZK.ui.empty({ title: "输入问题后点击「执行检索」", desc: "检索会实时返回每条分片的语义得分、全文得分与综合得分，并高亮命中的查询词项。" })],
            })
          );
        }
        void t0;
      }

      root.appendChild(host);
      paint();
    },
  };

  /* ============================ 知识库问答 ============================ */
  P["kb/query"] = {
    render(root, param) {
      const host = h("div");
      let kbId = param || (ZK.db.list("knowledgeBases")[0] || {}).id;
      const history = [];

      function paint() {
        U.clear(host);
        const kb = ZK.db.find("knowledgeBases", kbId);

        host.appendChild(
          ZK.ui.pageHead({
            title: "知识库问答",
            sub: "选择知识库后直接提问，系统会按当前召回参数检索分片并给出带出处的回答。支持切换知识库对比回答差异。",
            actions: [
              h("select", { class: "select", style: { width: "240px" }, onchange: (e) => { kbId = e.target.value; history.length = 0; paint(); } },
                ZK.db.list("knowledgeBases").map((k) => h("option", { value: k.id, selected: k.id === kbId, text: k.name }))),
              h("button", { class: "btn btn-sm", text: "清空对话", onclick: () => { history.length = 0; paint(); } }),
            ],
          })
        );

        const stream = h("div", { class: "chat-stream", id: "kbStream" });
        const input = h("textarea", { class: "textarea", placeholder: "输入你的问题，例如：合同里「应」什么时候译 shall，什么时候不能译 shall？" });
        const modeSel = h("select", { class: "select", style: { width: "132px" } }, Object.keys(MODE_NAME).map((k) => h("option", { value: k, selected: k === kb.recall.mode, text: MODE_NAME[k] })));

        function renderStream() {
          U.clear(stream);
          if (!history.length) {
            stream.appendChild(
              h("div", { class: "empty", style: { padding: "34px 20px" } }, [
                h("div", { class: "empty-icon", html: ZK.icons.messages(20) }),
                h("b", { text: "开始一次知识库问答" }),
                h("p", { text: "当前知识库《" + kb.name + "》包含 " + ZK.db.list("kbDocs", (d) => d.kbId === kbId).length + " 篇文档、" + ZK.engine.buildIndex(kbId).chunks.length + " 个分片，检索模式为 " + MODE_NAME[kb.recall.mode] + "。" }),
              ])
            );
          }
          history.forEach((m) => {
            const isMe = m.role === "me";
            stream.appendChild(
              h("div", { class: "chat-msg" + (isMe ? " me" : "") }, [
                h("div", { class: "cm-avatar " + (isMe ? "me" : "ai"), text: isMe ? "我" : "AI" }),
                h("div", { style: { "min-width": "0", flex: "1" } }, [
                  h("div", { class: "chat-bubble" }, [
                    h("div", { class: "cb-name", text: isMe ? "我" : "知识库助手 · " + MODE_NAME[m.mode || kb.recall.mode] }),
                    h("div", { style: { "white-space": "pre-wrap" }, text: m.text }),
                  ]),
                  m.cites && m.cites.length
                    ? h("div", { class: "chip-wrap mt-8" }, m.cites.map((c, i) =>
                        h("button", {
                          class: "chip",
                          onclick: () => {
                            const doc = ZK.db.list("kbDocs", (d) => d.title === c.docTitle)[0];
                            if (doc) {
                              ZK.modal({
                                title: doc.title, sub: "来源分片 " + c.chunk + " · 相关度 " + c.score, size: "lg",
                                render(api) {
                                  api.body.appendChild(h("div", { class: "corpus-box" }, [h("div", { class: "corpus", text: doc.text })]));
                                },
                              });
                            } else {
                              ZK.toast("该来源为上下文补充分片", "warn");
                            }
                          },
                        }, ["【" + c.index + "】" + U.truncate(c.docTitle, 16)])
                      ))
                    : null,
                  m.hits
                    ? h("div", { class: "fs-11 ghost mt-8", text: "命中 " + m.hits.length + " 条分片 · 耗时 " + m.latency + " ms · 知识库 " + kb.name })
                    : null,
                ]),
              ])
            );
          });
          stream.scrollTop = stream.scrollHeight;
        }

        function ask() {
          const q = input.value.trim();
          if (!q) {
            ZK.toast("请输入问题", "warn");
            return;
          }
          history.push({ role: "me", text: q });
          input.value = "";
          renderStream();
          stream.appendChild(h("div", { class: "chat-msg" }, [h("div", { class: "cm-avatar ai", text: "AI" }), h("div", { class: "chat-bubble" }, [h("div", { class: "typing-dots" }, [h("i"), h("i"), h("i")])])]));
          stream.scrollTop = stream.scrollHeight;

          setTimeout(() => {
            const start = performance.now();
            const res = ZK.engine.retrieve(kbId, q, { mode: modeSel.value });
            const latency = Math.round(performance.now() - start);
            const ans = ZK.engine.composeAnswer(q, res.hits);
            ZK.db.insert("retrievalLogs", { id: U.uid("rl"), kbId: kbId, query: q, mode: modeSel.value, hits: res.hits.length, latency: latency, at: Date.now() });
            history.push({ role: "ai", text: ans.text, cites: ans.cites, hits: res.hits, latency: latency, mode: modeSel.value });
            renderStream();
          }, 380);
        }

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
        });

        host.appendChild(
          ZK.ui.card({
            class: "mb-16",
            bodyClass: "flush",
            title: "知识库问答",
            sub: "回答内容由检索到的真实文档分片拼装而成，每条结论都可回溯到原文出处",
            icon: ZK.icons.sparkles(16),
            actions: [
              h("span", { class: "fs-12 faint", text: "文档 " + ZK.db.list("kbDocs", (d) => d.kbId === kbId).length + " 篇 · 分片 " + ZK.engine.buildIndex(kbId).chunks.length + " 个" }),
            ],
            body: [stream, h("div", { class: "chat-composer" }, [
              input, modeSel,
              h("button", { class: "btn btn-primary", html: ZK.icons.send(14) + "<span>发送</span>", onclick: ask }),
            ])],
          })
        );

        host.appendChild(
          ZK.ui.card({
            title: "提问建议",
            sub: "点击可直接提问，观察不同检索模式下的召回差异",
            icon: ZK.icons.info(16),
            body: [
              h("div", { class: "chip-wrap" }, [
                "合同条款中的六要素分别指什么？",
                "为什么「应」不能一律译为 shall？",
                "术语库应该包含哪些字段？",
                "金额翻译需要注意什么？",
                "Incoterms 2020 相比旧版有哪些修订？",
                "译文错误分成哪几个等级，分别扣多少分？",
                "FCA 在 2020 版新增了什么约定？",
                "文化负载词有哪些翻译策略？",
              ].map((q) => h("button", { class: "chip", text: q, onclick: () => { input.value = q; ask(); } }))),
            ],
          })
        );

        renderStream();
      }

      root.appendChild(host);
      paint();
    },
  };
})();
