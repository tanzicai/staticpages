/* ==========================================================================
   页面 · 知识图谱与 AI 文献解析
   （图谱总览 / 推荐图书AI解读 / AI文献解析 / 文献对话问答）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  const LIT_STORE = "literatureParses";   /* 解析结果留档 */
  const BOOK_STORE = "bookReads";         /* 图书解读留档 */

  function field(label, node, required) {
    return h("div", { class: "field" }, [
      h("label", { class: "label", html: label + (required ? '<span class="req">*</span>' : "") }),
      node,
    ]);
  }

  /* 模块级统一样式的小指标块，供图谱/图书/文献各页共用 */
  function statBox(label, value) {
    return h("div", { style: { background: "var(--bg-sunken)", "border-radius": "var(--r-lg)", padding: "10px 12px" } }, [
      h("div", { class: "fs-11 ghost", text: label }),
      h("div", { class: "fs-15 fw-7 strong", text: String(value) }),
    ]);
  }

  function neighborInfo(nodeId) {
    const edges = ZK.db.list("graphEdges");
    const nodes = ZK.db.list("graphNodes");
    const map = {};
    nodes.forEach((n) => (map[n.id] = n));
    const out = edges.filter((e) => e.source === nodeId).map((e) => ({ rel: e.rel, node: map[e.target], dir: "out" }));
    const inc = edges.filter((e) => e.target === nodeId).map((e) => ({ rel: e.rel, node: map[e.source], dir: "in" }));
    return out.concat(inc).filter((x) => x.node);
  }

  /** 依据图书信息与其关联知识点构造可解析语料，再交给文献解析引擎 */
  function buildBookCorpus(book) {
    const nodes = ZK.db.list("graphNodes");
    const rel = neighborInfo(book.id).filter((x) => x.node.type === "kp");
    const kpNames = rel.map((x) => x.node.label);
    const kps = ZK.db.list("knowledgePoints").filter((k) => kpNames.indexOf(k.name) >= 0);
    const chapters = Array.from(new Set(kps.map((k) => k.chapter)));

    const kw = (book.keywords || []).slice();
    const material = ZK.db.list("kbDocs", (d) => d.kind === "书籍" && d.title.indexOf(book.title) >= 0);
    const res = ZK.db.list("resources", (r) => book.chapter && r.chapter === book.chapter).slice(0, 3);

    const parts = [];
    parts.push("书名：" + book.title + "。作者：" + book.author + "。出版社：" + book.publisher + "，出版年份 " + book.year + "。分类：" + book.category + "，全书 " + book.pages + " 页。");
    parts.push("内容简介：" + book.summary);
    parts.push("关键词：" + kw.join("、") + "。");
    parts.push(
      "一、全书主题概述。" +
        book.title +
        "围绕" +
        kw.slice(0, 3).join("、") +
        "展开，是" +
        book.category +
        "方向的基础读本，面向" +
        (book.audience || "本科阶段英语专业学生") +
        "。全书以概念界定为起点，逐步进入方法层面，最后落到实践判断。"
    );
    parts.push(
      "二、知识定位。" +
        (kpNames.length
          ? "在本课程知识图谱中，本书与 " + kpNames.length + " 个知识点直接关联，包括" + kpNames.join("、") + "，主要支撑第 " + (chapters.join("、") || book.chapter) + " 章的学习。"
          : "本书在当前图谱中尚未建立知识点关联，建议先阅读基础章节再回到图谱查看关联关系。")
    );
    kps.slice(0, 6).forEach((k, i) => {
      parts.push("三·" + (i + 1) + "、" + k.name + "。" + "该知识点在本书中的对应论述围绕" + (k.concepts || []).join("、") + "展开，难度等级 " + "★".repeat(k.difficulty) + "。" + (k.summary || ""));
    });
    parts.push(
      "四、阅读线索。" +
        (res.length
          ? "建议配合课程资源「" + res.map((r) => r.title).join("」「") + "」同步阅读，先看视频或讲义建立整体印象，再回到书中精读方法部分。"
          : "建议先通读方法章节，再回到概念章节做二次梳理。")
    );
    parts.push(
      "五、延伸思考。" +
        "阅读时重点思考三件事：第一，" +
        (kw[0] || "核心概念") +
        "在本书中的界定与课堂讲授是否一致；第二，书中给出的处理依据能否迁移到你自己的作品型任务中；第三，与其他关联知识点（" +
        (kpNames.slice(1, 4).join("、") || "基础章节") +
        "）之间的先后关系是否清楚。"
    );
    if (material.length) parts.push("六、知识库收录情况。本书已收入课程知识库，包含 " + material.length + " 个文档分片，可在知识库问答中直接引用。");

    return { text: parts.join("\n"), kpNames: kpNames, chapters: chapters, related: rel };
  }

  /* ==================================================================
     一、图谱总览
     ================================================================== */
  P["graph/map"] = {
    render(root) {
      let activeTypes = { kp: true, concept: true, tool: true, book: true };
      let selected = null;

      const allNodes = ZK.db.list("graphNodes");
      const allEdges = ZK.db.list("graphEdges");

      root.appendChild(
        ZK.ui.pageHead({
          title: "知识图谱总览",
          sub: "以知识点为核心，向外连接概念、工具方法与系统推荐图书。点击任意节点可查看该节点的关联资源、掌握情况与推荐书目，并对图书发起 AI 解读。",
          actions: [
            h("button", { class: "btn btn-sm", text: "推荐图书 AI 解读", onclick: () => go("#/graph/books") }),
            h("button", { class: "btn btn-sm", text: "AI 文献解析", onclick: () => go("#/graph/literature") }),
          ],
        })
      );

      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({ label: "图谱节点", value: String(allNodes.length), target: "知识点 " + ZK.db.list("knowledgePoints").length + " 个", icon: ZK.icons.network(18), tone: "emerald", progress: 78 }),
          ZK.ui.statCard({ label: "关联关系", value: String(allEdges.length), target: "含前置、隶属、推荐阅读", icon: ZK.icons.link(18), tone: "blue", progress: 66 }),
          ZK.ui.statCard({ label: "推荐图书节点", value: String(allNodes.filter((n) => n.type === "book").length), target: "均可 AI 解读", icon: ZK.icons.bookOpen(18), tone: "amber", progress: 52 }),
          ZK.ui.statCard({ label: "已生成解读", value: String(ZK.db.list(BOOK_STORE).length), target: "图书解读留档数", icon: ZK.icons.sparkles(18), tone: "violet", progress: Math.min(100, ZK.db.list(BOOK_STORE).length * 20) }),
        ])
      );

      const graphHost = h("div");
      const detailHost = h("div");

      root.appendChild(
        ZK.ui.card({
          title: "图谱可视化",
          sub: "力导向布局；悬停节点可高亮其关联边，点击节点查看详情",
          icon: ZK.icons.network(16),
          actions: [
            h("button", { class: "btn btn-xs on", text: "知识点", onclick: (e) => toggle("kp", e.currentTarget) }),
            h("button", { class: "btn btn-xs on", text: "概念", onclick: (e) => toggle("concept", e.currentTarget) }),
            h("button", { class: "btn btn-xs on", text: "工具方法", onclick: (e) => toggle("tool", e.currentTarget) }),
            h("button", { class: "btn btn-xs on", text: "推荐图书", onclick: (e) => toggle("book", e.currentTarget) }),
            h("button", { class: "btn btn-xs", text: "重置", onclick: () => { activeTypes = { kp: true, concept: true, tool: true, book: true }; paintGraph(); ZK.toast("已显示全部节点类型"); } }),
          ],
          body: [graphHost],
        })
      );

      root.appendChild(h("div", { class: "mt-16" }, [detailHost]));

      function toggle(t, btn) {
        activeTypes[t] = !activeTypes[t];
        btn.classList.toggle("on", activeTypes[t]);
        btn.style.opacity = activeTypes[t] ? "1" : "0.5";
        paintGraph();
      }

      function paintGraph() {
        U.clear(graphHost);
        const nodes = allNodes.filter((n) => activeTypes[n.type]);
        const keep = {};
        nodes.forEach((n) => (keep[n.id] = 1));
        const edges = allEdges.filter((e) => keep[e.source] && keep[e.target]);
        graphHost.appendChild(
          ZK.ui.forceGraph({
            nodes: nodes,
            edges: edges,
            width: 980,
            height: 480,
            onSelect: (n) => {
              selected = n;
              paintDetail(n);
            },
          })
        );
      }

      function paintDetail(n) {
        U.clear(detailHost);
        const typeName = { kp: "知识点", concept: "概念", tool: "工具方法", book: "推荐图书" }[n.type] || n.type;
        const rel = neighborInfo(n.id);
        const node = n;

        const body = [];
        body.push(
          h("div", { class: "grid grid-3", style: { gap: "10px" } }, [
            statBox("节点类型", typeName),
            statBox("关联关系", rel.length + " 条"),
            statBox("所在章节", node.chapter ? "第 " + node.chapter + " 章" : "—"),
          ])
        );

        if (node.type === "kp") {
          const kp = ZK.db.list("knowledgePoints", (k) => k.name === node.label)[0];
          const recs = ZK.db.list("learningRecords", (r) => r.kpId === (kp ? kp.id : ""));
          const resCount = ZK.db.list("resources", (r) => kp && r.chapter === kp.chapter).length + (kp ? kp.resourceCount : 0);
          body.push(
            h("div", { class: "sb-group-title", text: "学习情况" }),
            h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
              statBox("关联学习资源", resCount + " 项"),
              statBox("平均完成率", recs.length ? U.pct(U.avg(recs.map((r) => r.completion))) : "—"),
              statBox("平均掌握率", recs.length ? U.pct(U.avg(recs.map((r) => r.mastery))) : "—"),
              statBox("课程资料人均阅读", recs.length ? U.round(U.avg(recs.map((r) => r.materialsRead)), 2) + " 项" : "—"),
            ]),
            h("div", { class: "row mt-12", style: { gap: "6px" } }, [
              kp ? h("button", { class: "btn btn-sm", text: "查看知识点详情", onclick: () => go("#/analytics/kp/" + kp.id) }) : null,
              h("button", { class: "btn btn-sm", text: "在知识库中提问", onclick: () => go("#/kb/query") }),
            ])
          );
        }

        if (node.type === "book") {
          const book = ZK.db.list("libraryBooks", (b) => b.id === node.id)[0];
          if (book) {
            body.push(
              h("div", { class: "sb-group-title", text: "图书信息" }),
              ZK.ui.kv([
                ["书名", book.title],
                ["作者 / 出版社", book.author + " · " + book.publisher + "（" + book.year + "）"],
                ["分类 / 页数", book.category + " · " + book.pages + " 页"],
                ["馆藏", book.location + "　可借 " + book.stock + "/" + book.total + " 册　借阅 " + book.borrowCount + " 次"],
                ["内容简介", book.summary],
                ["关键词", (book.keywords || []).join("、")],
              ]),
              h("div", { class: "row mt-12", style: { gap: "6px" } }, [
                h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.wand(13) + "<span>AI 解读本书</span>", onclick: () => go("#/graph/books/" + book.id) }),
              ])
            );
          }
        }

        body.push(
          h("div", { class: "sb-group-title", text: "关联关系（" + rel.length + " 条）" }),
          rel.length
            ? h("div", { class: "row-list" }, rel.slice(0, 14).map((x) =>
                h("div", { class: "list-row" }, [
                  h("div", { class: "lr-icon ic-blue", html: ZK.icons.link(14) }),
                  h("div", { class: "lr-main" }, [
                    h("b", { text: x.node.label }),
                    h("span", { text: ({ kp: "知识点", concept: "概念", tool: "工具方法", book: "推荐图书" }[x.node.type] || x.node.type) + " · " + (x.dir === "out" ? node.label + " → " + x.node.label : x.node.label + " → " + node.label) }),
                  ]),
                  h("div", { class: "lr-tail" }, [ZK.ui.badge(x.rel, x.rel === "前置" ? "red" : x.rel === "推荐阅读" ? "amber" : x.rel === "隶属" ? "blue" : "violet")]),
                ])
              ))
            : h("div", { class: "fs-12 faint", text: "该节点暂无关联。" })
        );

        detailHost.appendChild(
          ZK.ui.card({
            title: node.label,
            sub: typeName + (node.difficulty ? " · 难度 " + "★".repeat(node.difficulty) : ""),
            icon: ZK.icons.target(16),
            actions: [ZK.ui.badge("节点 " + node.id, "gray")],
            body: body,
          })
        );
      }

      paintGraph();
      const firstKp = allNodes.find((n) => n.type === "kp");
      if (firstKp) paintDetail(firstKp);
    },
  };

  /* ==================================================================
     二、推荐图书 AI 解读
     ================================================================== */
  P["graph/books"] = {
    render(root, param) {
      let currentId = param || null;
      const books = ZK.db.list("libraryBooks");

      root.appendChild(
        ZK.ui.pageHead({
          title: "推荐图书 AI 解读",
          sub: "对知识图谱中系统推荐的图书执行 AI 解读：自动生成主题词云、分段摘要、脑图与思考题，并说明该书在课程图谱中的知识定位。",
          actions: [
            h("button", { class: "btn btn-sm", text: "返回图谱", onclick: () => go("#/graph/map") }),
            h("button", { class: "btn btn-primary btn-sm", text: "批量解读全部推荐图书", onclick: () => batchRead() }),
          ],
        })
      );

      const recommended = ZK.db.list("graphNodes", (n) => n.type === "book").map((n) => n.id);
      const recBooks = books.filter((b) => recommended.indexOf(b.id) >= 0);
      const others = books.filter((b) => recommended.indexOf(b.id) < 0);

      const listHost = h("div", { class: "stack-12" });
      const detailHost = h("div");

      root.appendChild(
        ZK.ui.card({
          title: "图谱推荐图书（" + recBooks.length + "）",
          sub: "由知识图谱的「推荐阅读」关系给出，按与知识点的关联数排序",
          icon: ZK.icons.bookOpen(16),
          body: [listHost],
        })
      );
      root.appendChild(h("div", { class: "mt-16" }, [detailHost]));

      function paintList() {
        U.clear(listHost);
        const sorted = recBooks.slice().sort((a, b) => neighborInfo(b.id).length - neighborInfo(a.id).length).concat(others.slice(0, 6));
        sorted.forEach((b) => {
          const rel = neighborInfo(b.id).filter((x) => x.node.type === "kp");
          const done = ZK.db.list(BOOK_STORE, (x) => x.bookId === b.id).length > 0;
          const on = b.id === currentId;
          listHost.appendChild(
            h(
              "div",
              { class: "list-row", style: on ? { borderColor: "var(--accent-line)", background: "var(--accent-dim)" } : null, onclick: () => pick(b) },
              [
                h("div", { class: "lr-icon " + (done ? "ic-emerald" : "ic-amber"), html: ZK.icons.book(15) }),
                h("div", { class: "lr-main" }, [
                  h("b", { text: b.title }),
                  h("span", { text: b.author + " · " + b.publisher + " · " + b.year + " · " + b.category + " · 关联 " + rel.length + " 个知识点" }),
                ]),
                h("div", { class: "lr-tail" }, [
                  done ? ZK.ui.badge("已解读", "emerald") : ZK.ui.badge("待解读", "amber"),
                  h("button", {
                    class: "btn btn-xs btn-primary",
                    text: "AI 解读",
                    onclick(e) {
                      e.stopPropagation();
                      pick(b);
                      setTimeout(() => runRead(b), 60);
                    },
                  }),
                ]),
              ]
            )
          );
        });
      }

      function pick(b) {
        currentId = b.id;
        paintList();
        const cached = ZK.db.list(BOOK_STORE, (x) => x.bookId === b.id)[0];
        if (cached) renderRead(b, cached, true);
        else renderEmpty(b);
      }

      function renderEmpty(b) {
        U.clear(detailHost);
        const corpus = buildBookCorpus(b);
        detailHost.appendChild(
          ZK.ui.card({
            title: "《" + b.title + "》",
            sub: b.author + " · " + b.publisher + " · " + b.year + " · 全书 " + b.pages + " 页",
            icon: ZK.icons.bookOpen(16),
            actions: [h("button", { class: "btn btn-sm btn-primary", html: ZK.icons.wand(13) + "<span>开始 AI 解读</span>", onclick: () => runRead(b) })],
            body: [
              h("p", { class: "fs-13 muted", style: { "line-height": "1.75" }, text: b.summary }),
              h("div", { class: "chip-wrap mb-12" }, (b.keywords || []).map((k) => h("span", { class: "chip", text: k }))),
              ZK.ui.kv([
                ["图谱关联知识点", corpus.kpNames.length ? corpus.kpNames.join("、") : "暂无"],
                ["覆盖章节", corpus.chapters.length ? "第 " + corpus.chapters.join("、") + " 章" : "—"],
                ["馆藏位置", b.location + "　可借 " + b.stock + "/" + b.total + " 册"],
                ["解读语料", "由书目信息、章节要点、图谱关联与课程资源说明合成，共 " + corpus.text.length + " 字"],
              ]),
            ],
          })
        );
      }

      function runRead(b) {
        U.clear(detailHost);
        const loading = h("div", { class: "center", style: { padding: "40px" } }, [
          h("div", { class: "typing-dots" }, [h("i"), h("i"), h("i")]),
          h("div", { class: "fs-13 muted mt-12", text: "AI 正在阅读《" + b.title + "》并生成解读…" }),
        ]);
        detailHost.appendChild(loading);

        setTimeout(() => {
          const corpus = buildBookCorpus(b);
          const parsed = ZK.engine.parseLiterature(corpus.text, b.title);
          const rec = ZK.db.upsert(BOOK_STORE, {
            id: "br_" + b.id,
            bookId: b.id,
            title: b.title,
            kpNames: corpus.kpNames,
            chapters: corpus.chapters,
            parsed: parsed,
            text: corpus.text,
            at: Date.now(),
            reader: (ZK.db.currentUser() || {}).name || "系统",
          });
          ZK.db.log("图书 AI 解读", "解读《" + b.title + "》，关联 " + corpus.kpNames.length + " 个知识点");
          ZK.toast("《" + b.title + "》解读完成");
          paintList();
          renderRead(b, rec, false);
        }, 620);
      }

      function batchRead() {
        const done = [];
        recBooks.forEach((b) => {
          const corpus = buildBookCorpus(b);
          const parsed = ZK.engine.parseLiterature(corpus.text, b.title);
          ZK.db.upsert(BOOK_STORE, { id: "br_" + b.id, bookId: b.id, title: b.title, kpNames: corpus.kpNames, chapters: corpus.chapters, parsed: parsed, text: corpus.text, at: Date.now(), reader: (ZK.db.currentUser() || {}).name || "系统" });
          done.push(b.title);
        });
        ZK.db.log("批量图书解读", "解读 " + done.length + " 本推荐图书");
        ZK.toast("已完成 " + done.length + " 本推荐图书的 AI 解读");
        paintList();
        if (recBooks[0]) pick(recBooks[0]);
      }

      function renderRead(b, rec, cached) {
        U.clear(detailHost);
        const p = rec.parsed;
        detailHost.appendChild(
          ZK.ui.card({
            title: "《" + b.title + "》AI 解读",
            sub: (cached ? "读取留档结果" : "本次生成") + " · " + U.fmtDateTime(rec.at) + " · 解读人 " + rec.reader,
            icon: ZK.icons.sparkles(16),
            actions: [
              h("button", { class: "btn btn-xs", text: "重新解读", onclick: () => runRead(b) }),
              h("button", { class: "btn btn-xs", text: "导出解读报告", onclick: () => exportRead(b, rec) }),
            ],
            body: [
              h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
                statBox("全文字数", U.num(p.stats.chars)),
                statBox("句数 / 段数", p.stats.sentences + " / " + p.stats.paragraphs),
                statBox("关键词数", p.stats.keywords),
                statBox("预计阅读", p.stats.readMinutes + " 分钟"),
              ]),
              h("div", { class: "sb-group-title", text: "知识定位" }),
              h("div", { class: "advice info", text: "本书在图谱中与 " + (rec.kpNames.length || 0) + " 个知识点直接关联：" + (rec.kpNames.join("、") || "暂无") + "；覆盖第 " + (rec.chapters.join("、") || "—") + " 章内容。" }),
              h("div", { class: "sb-group-title", text: "主题词云" }),
              ZK.ui.wordCloud(p.cloud, 40),
            ],
          })
        );

        detailHost.appendChild(h("div", { class: "mt-16" }, [
          ZK.ui.card({
            title: "AI 摘要",
            sub: "短摘要 3 句，长摘要 6 句，均取自原文句子并按主题权重排序",
            icon: ZK.icons.fileText(16),
            body: [
              h("div", { class: "fs-12 fw-6 em mb-8", text: "短摘要" }),
              h("div", { class: "stack-8 mb-16" }, p.summary.short.map((s, i) => h("div", { class: "advice", text: (i + 1) + ". " + s }))),
              h("div", { class: "fs-12 fw-6 em mb-8", text: "长摘要" }),
              h("div", { class: "stack-8" }, p.summary.long.map((s, i) => h("div", { class: "advice info", text: (i + 1) + ". " + s }))),
              h("div", { class: "fs-12 fw-6 em mt-16 mb-8", text: "核心要点" }),
              h("div", { class: "chip-wrap" }, p.summary.keyPoints.map((k) => h("span", { class: "chip", text: k }))),
            ],
          }),
        ]));

        detailHost.appendChild(h("div", { class: "mt-16" }, [
          ZK.ui.card({
            title: "知识脑图",
            sub: "按章节标题自动分层，节点 " + p.mindmap.nodeCount + " 个",
            icon: ZK.icons.network(16),
            body: [ZK.ui.mindmap(p.mindmap)],
          }),
        ]));

        detailHost.appendChild(h("div", { class: "mt-16" }, [quizCard(p.quiz, b.title)]));
      }

      function quizCard(quiz, title) {
        const state = { answered: {}, right: 0 };
        const body = h("div", { class: "stack-16" });
        const scoreLine = h("div", { class: "fs-13 muted" });
        const card = ZK.ui.card({
          title: "自动生成试题（" + quiz.length + " 题）",
          sub: "由《" + title + "》解读语料自动生成，选择后立即判分并给出原文出处",
          icon: ZK.icons.checkCircle(16),
          actions: [scoreLine],
          body: [body, h("div", { class: "mt-12" }, [scoreLine])],
        });
        if (!quiz.length) {
          body.appendChild(h("div", { class: "fs-12 faint", text: "当前语料不足以出题，建议先导入更完整的文献正文。" }));
          return card;
        }
        quiz.forEach((q, qi) => {
          const box = h("div", { class: "quiz-card" });
          box.appendChild(h("div", { class: "qc-head" }, [h("span", { class: "pill-num", text: String(qi + 1) }), h("span", { class: "qc-q", text: q.type === "judge" ? "判断题" : "单项选择" })]));
          box.appendChild(h("div", { class: "qc-q", style: { "margin-bottom": "10px" }, text: q.stem }));
          const opts = h("div", { class: "stack-8" });
          q.options.forEach((opt, oi) => {
            const btn = h("button", { class: "quiz-opt" }, [
              h("span", { class: "qo-key", text: String.fromCharCode(65 + oi) }),
              h("span", { text: opt }),
            ]);
            btn.addEventListener("click", () => {
              if (state.answered[q.id]) return;
              state.answered[q.id] = opt;
              const ok = opt === q.answer;
              if (ok) state.right += 1;
              U.$$(".quiz-opt", opts).forEach((b, bi) => {
                if (q.options[bi] === q.answer) b.classList.add("right");
                else if (q.options[bi] === opt) b.classList.add("wrong");
              });
              box.appendChild(h("div", { class: "quiz-explain" }, [
                h("b", { class: ok ? "em" : "em-danger", text: ok ? "回答正确。" : "回答错误，正确答案：" + q.answer + "。" }),
                h("div", { class: "fs-12 muted mt-4", text: q.explain }),
                h("div", { class: "fs-11 faint mt-4", text: "出处：第 " + q.source.sentenceIndex + " 句" }),
              ]));
              scoreLine.textContent = "已答 " + Object.keys(state.answered).length + "/" + quiz.length + "，正确 " + state.right + " 题（" + U.round((state.right / quiz.length) * 100) + "%）";
            });
            opts.appendChild(btn);
          });
          box.appendChild(opts);
          body.appendChild(box);
        });
        scoreLine.textContent = "未作答";
        return card;
      }

      function exportRead(b, rec) {
        const p = rec.parsed;
        const lines = [
          "《" + b.title + "》AI 解读报告",
          "作者：" + b.author + "　出版社：" + b.publisher + "　年份：" + b.year,
          "图谱关联知识点：" + (rec.kpNames.join("、") || "无"),
          "语料规模：" + p.stats.chars + " 字 / " + p.stats.sentences + " 句 / " + p.stats.keywords + " 个关键词",
          "",
          "【词云关键词】",
          p.cloud.slice(0, 30).map((c, i) => (i + 1) + "." + c.term).join("　"),
          "",
          "【短摘要】",
        ].concat(p.summary.short.map((s, i) => (i + 1) + ". " + s));
        lines.push("", "【长摘要】");
        p.summary.long.forEach((s, i) => lines.push((i + 1) + ". " + s));
        lines.push("", "【核心要点】", p.summary.keyPoints.join("、"), "", "【脑图结构】");
        p.mindmap.branches.forEach((br) => {
          lines.push("· " + br.title);
          br.points.forEach((pt) => lines.push("    - " + pt.text));
        });
        lines.push("", "【自动生成试题】");
        p.quiz.forEach((q, i) => {
          lines.push((i + 1) + ". " + q.stem);
          lines.push("   选项：" + q.options.join(" / "));
          lines.push("   答案：" + q.answer);
          lines.push("   解析：" + q.explain);
        });
        U.download("图书AI解读-" + b.title.replace(/[\\/:*?"<>|]/g, "_") + ".txt", lines.join("\n"));
        ZK.toast("解读报告已导出");
      }

      paintList();
      if (currentId) {
        const b = ZK.db.find("libraryBooks", currentId);
        if (b) pick(b);
      } else if (recBooks.length) {
        pick(recBooks[0]);
      }
    },
  };

  /* ==================================================================
     三、AI 文献解析
     ================================================================== */
  P["graph/literature"] = {
    render(root, param) {
      let currentId = param || (ZK.db.list("literature")[0] || {}).id;
      let uploaded = null;

      root.appendChild(
        ZK.ui.pageHead({
          title: "AI 文献解析",
          sub: "教师上传文献后由 AI 快速通读，自动生成词云、摘要、脑图与试题；解析结果可直接用于课堂导学与课后自测。",
          actions: [
            h("button", { class: "btn btn-sm", text: "文献对话问答", onclick: () => go("#/graph/qa") }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.upload(14) + "<span>上传文献</span>", onclick: () => openUpload() }),
          ],
        })
      );

      const listHost = h("div", { class: "stack-12" });
      const detailHost = h("div");

      root.appendChild(
        ZK.ui.card({
          title: "文献列表",
          sub: "含学术论文与教研文献，可上传 txt / 粘贴正文新增",
          icon: ZK.icons.fileText(16),
          body: [listHost],
        })
      );
      root.appendChild(h("div", { class: "mt-16" }, [detailHost]));

      function paintList() {
        U.clear(listHost);
        const list = ZK.db.list("literature");
        if (!list.length) {
          listHost.appendChild(ZK.ui.empty({ title: "暂无文献", desc: "点击「上传文献」录入一篇文献。", icon: ZK.icons.wand(22) }));
          return;
        }
        list.forEach((l) => {
          const on = l.id === currentId;
          const parsed = ZK.db.list(LIT_STORE, (x) => x.litId === l.id)[0];
          listHost.appendChild(
            h(
              "div",
              { class: "list-row", style: on ? { borderColor: "var(--accent-line)", background: "var(--accent-dim)" } : null, onclick: () => pick(l) },
              [
                h("div", { class: "lr-icon " + (l.text ? "ic-emerald" : "ic-gray"), html: ZK.icons.fileText(15) }),
                h("div", { class: "lr-main" }, [
                  h("b", { text: l.title }),
                  h("span", { text: (l.author || "—") + " · " + (l.source || "—") + " · " + (l.year || "—") + " · " + (l.type || "文献") + " · " + (l.text ? U.num(l.text.length) + " 字" : "正文待补充") }),
                ]),
                h("div", { class: "lr-tail" }, [
                  parsed ? ZK.ui.badge("已解析", "emerald") : l.text ? ZK.ui.badge("待解析", "amber") : ZK.ui.badge("缺正文", "gray"),
                  h("button", {
                    class: "btn btn-xs",
                    text: "删除",
                    onclick: async (e) => {
                      e.stopPropagation();
                      const ok = await ZK.confirm({ title: "删除文献", message: "确定删除《" + U.escapeHtml(l.title) + "》及其解析结果吗？", danger: true, okText: "删除" });
                      if (!ok) return;
                      ZK.db.list(LIT_STORE, (x) => x.litId === l.id).forEach((x) => ZK.db.remove(LIT_STORE, x.id));
                      ZK.db.remove("literature", l.id);
                      if (currentId === l.id) currentId = (ZK.db.list("literature")[0] || {}).id;
                      paintList();
                      renderDetail(null);
                      ZK.toast("文献已删除");
                    },
                  }),
                ]),
              ]
            )
          );
        });
      }

      function pick(l) {
        currentId = l.id;
        paintList();
        const parsed = ZK.db.list(LIT_STORE, (x) => x.litId === l.id)[0];
        renderDetail(l, parsed);
      }

      function renderDetail(l, parsed) {
        U.clear(detailHost);
        if (!l) {
          detailHost.appendChild(ZK.ui.empty({ title: "请选择一篇文献", desc: "从上方列表选择文献，或上传新的文献正文。", icon: ZK.icons.wand(22) }));
          return;
        }
        if (!l.text) {
          detailHost.appendChild(
            ZK.ui.card({
              title: l.title,
              sub: l.author + " · " + l.source,
              icon: ZK.icons.fileText(16),
              body: [
                ZK.ui.empty({
                  title: "该文献尚无可用正文",
                  desc: "解析需要文献正文。可上传 txt 文件，或直接粘贴正文内容后再解析。",
                  icon: ZK.icons.upload(22),
                  action: h("button", { class: "btn btn-primary btn-sm", text: "补充正文并解析", onclick: () => openUpload(l) }),
                }),
              ],
            })
          );
          return;
        }
        if (!parsed) {
          detailHost.appendChild(
            ZK.ui.card({
              title: l.title,
              sub: l.author + " · " + l.source + " · 正文 " + U.num(l.text.length) + " 字",
              icon: ZK.icons.wand(16),
              actions: [h("button", { class: "btn btn-sm btn-primary", html: ZK.icons.wand(13) + "<span>开始 AI 解析</span>", onclick: () => runParse(l) })],
              body: [
                h("div", { class: "corpus-box" }, [h("div", { class: "corpus", text: U.truncate(l.text, 1200) })]),
                h("div", { class: "fs-12 muted mt-12", text: "点击「开始 AI 解析」将自动生成词云、摘要、脑图与试题，并支持基于该文献的对话问答。" }),
              ],
            })
          );
          return;
        }

        /* 已解析 */
        const p = parsed.parsed;
        detailHost.appendChild(
          ZK.ui.card({
            title: l.title,
            sub: l.author + " · " + l.source + " · 解析于 " + U.fmtDateTime(parsed.at),
            icon: ZK.icons.wand(16),
            actions: [
              h("button", { class: "btn btn-xs", text: "重新解析", onclick: () => runParse(l) }),
              h("button", { class: "btn btn-xs", text: "基于本文提问", onclick: () => go("#/graph/qa/" + l.id) }),
              h("button", { class: "btn btn-xs", text: "导出解析报告", onclick: () => exportLit(l, p) }),
            ],
            body: [
              h("div", { class: "grid grid-4", style: { gap: "10px" } }, [
                statBox("全文字数", U.num(p.stats.chars)),
                statBox("句数 / 段数", p.stats.sentences + " / " + p.stats.paragraphs),
                statBox("关键词数", p.stats.keywords),
                statBox("预计阅读", p.stats.readMinutes + " 分钟"),
              ]),
              h("div", { class: "sb-group-title", text: "主题词云" }),
              ZK.ui.wordCloud(p.cloud, 44),
            ],
          })
        );

        detailHost.appendChild(h("div", { class: "mt-16" }, [
          ZK.ui.card({
            title: "摘要与要点",
            icon: ZK.icons.fileText(16),
            body: [
              h("div", { class: "fs-12 fw-6 em mb-8", text: "短摘要（3 句）" }),
              h("div", { class: "stack-8 mb-16" }, p.summary.short.map((s, i) => h("div", { class: "advice", text: (i + 1) + ". " + s }))),
              h("div", { class: "fs-12 fw-6 em mb-8", text: "长摘要（6 句）" }),
              h("div", { class: "stack-8" }, p.summary.long.map((s, i) => h("div", { class: "advice info", text: (i + 1) + ". " + s }))),
              h("div", { class: "fs-12 fw-6 em mt-16 mb-8", text: "核心要点" }),
              h("div", { class: "chip-wrap" }, p.summary.keyPoints.map((k) => h("span", { class: "chip", text: k }))),
            ],
          }),
        ]));

        detailHost.appendChild(h("div", { class: "mt-16" }, [
          ZK.ui.card({
            title: "知识脑图",
            sub: "按「一、二、三…」或「1. 2. 3.」层级标题自动分层，共 " + p.mindmap.nodeCount + " 个节点",
            icon: ZK.icons.network(16),
            body: [ZK.ui.mindmap(p.mindmap)],
          }),
        ]));

        detailHost.appendChild(h("div", { class: "mt-16" }, [quizCard(p.quiz, l)]));
      }

      function quizCard(quiz, l) {
        const state = { answered: {}, right: 0 };
        const body = h("div", { class: "stack-16" });
        const scoreLine = h("div", { class: "fs-13 muted", text: "未作答" });
        const card = ZK.ui.card({
          title: "自动生成试题（" + quiz.length + " 题）",
          sub: "由本文语料自动生成，附原文出处与解析",
          icon: ZK.icons.checkCircle(16),
          actions: [scoreLine],
          body: [body],
        });
        if (!quiz.length) {
          body.appendChild(h("div", { class: "fs-12 faint", text: "当前文献语料不足以出题。" }));
          return card;
        }
        quiz.forEach((q, qi) => {
          const box = h("div", { class: "quiz-card" });
          box.appendChild(h("div", { class: "qc-head" }, [
            h("span", { class: "pill-num", text: String(qi + 1) }),
            h("span", { class: "qc-q", text: q.type === "judge" ? "判断题（2 分）" : "单项选择（2 分）" }),
          ]));
          box.appendChild(h("div", { class: "qc-q", style: { "margin-bottom": "10px" }, text: q.stem }));
          const opts = h("div", { class: "stack-8" });
          q.options.forEach((opt, oi) => {
            const btn = h("button", { class: "quiz-opt" }, [
              h("span", { class: "qo-key", text: String.fromCharCode(65 + oi) }),
              h("span", { text: opt }),
            ]);
            btn.addEventListener("click", () => {
              if (state.answered[q.id]) return;
              state.answered[q.id] = opt;
              const ok = opt === q.answer;
              if (ok) state.right += 1;
              U.$$(".quiz-opt", opts).forEach((b, bi) => {
                if (q.options[bi] === q.answer) b.classList.add("right");
                else if (q.options[bi] === opt) b.classList.add("wrong");
              });
              box.appendChild(h("div", { class: "quiz-explain" }, [
                h("b", { class: ok ? "em" : "em-danger", text: ok ? "回答正确。" : "回答错误，正确答案：" + q.answer + "。" }),
                h("div", { class: "fs-12 muted mt-4", text: q.explain }),
                h("div", { class: "fs-11 faint mt-4", text: "出处：第 " + q.source.sentenceIndex + " 句" }),
              ]));
              scoreLine.textContent = "已答 " + Object.keys(state.answered).length + "/" + quiz.length + "，正确 " + state.right + " 题（得分 " + state.right * 2 + " 分 / 满分 " + quiz.length * 2 + " 分）";
            });
            opts.appendChild(btn);
          });
          box.appendChild(opts);
          body.appendChild(box);
        });
        return card;
      }

      function runParse(l) {
        U.clear(detailHost);
        detailHost.appendChild(
          h("div", { class: "center", style: { padding: "48px" } }, [
            h("div", { class: "typing-dots" }, [h("i"), h("i"), h("i")]),
            h("div", { class: "fs-13 muted mt-12", text: "AI 正在通读全文并生成词云、摘要、脑图与试题…" }),
          ])
        );
        setTimeout(() => {
          const parsed = ZK.engine.parseLiterature(l.text, l.title);
          const rec = ZK.db.upsert(LIT_STORE, { id: "lp_" + l.id, litId: l.id, title: l.title, parsed: parsed, at: Date.now(), operator: (ZK.db.currentUser() || {}).name || "系统" });
          ZK.db.update("literature", l.id, { parsed: true, parsedAt: Date.now() });
          ZK.db.log("AI 文献解析", "解析《" + l.title + "》，提取关键词 " + parsed.stats.keywords + " 个");
          ZK.toast("解析完成：关键词 " + parsed.stats.keywords + " 个，试题 " + parsed.quiz.length + " 道");
          paintList();
          renderDetail(l, rec);
        }, 700);
      }

      function exportLit(l, p) {
        const lines = [
          "AI 文献解析报告",
          "文献标题：" + l.title,
          "作者 / 来源：" + (l.author || "—") + " · " + (l.source || "—"),
          "解析时间：" + U.fmtDateTime(Date.now()),
          "语料统计： " + p.stats.chars + " 字 / " + p.stats.sentences + " 句 / " + p.stats.paragraphs + " 段 / " + p.stats.keywords + " 个关键词",
          "",
          "【词云关键词 TOP 30】",
          p.cloud.slice(0, 30).map((c, i) => (i + 1) + "." + c.term + "(" + c.rank + ")").join("　"),
          "",
          "【短摘要】",
        ].concat(p.summary.short.map((s, i) => (i + 1) + ". " + s));
        lines.push("", "【长摘要】");
        p.summary.long.forEach((s, i) => lines.push((i + 1) + ". " + s));
        lines.push("", "【核心要点】", p.summary.keyPoints.join("、"), "", "【脑图结构】");
        p.mindmap.branches.forEach((b) => {
          lines.push("· " + b.title);
          b.points.forEach((pt) => lines.push("    - " + pt.text));
        });
        lines.push("", "【自动生成试题】");
        p.quiz.forEach((q, i) => {
          lines.push((i + 1) + ". " + q.stem);
          lines.push("   选项：" + q.options.join(" / "));
          lines.push("   答案：" + q.answer);
          lines.push("   解析：" + q.explain);
        });
        U.download("文献AI解析-" + l.title.replace(/[\\/:*?"<>|]/g, "_") + ".txt", lines.join("\n"));
        ZK.db.log("导出解析报告", "导出《" + l.title + "》解析报告");
        ZK.toast("解析报告已导出");
      }

      function openUpload(existing) {
        const title = h("input", { class: "input", value: existing ? existing.title : "", placeholder: "文献标题" });
        const author = h("input", { class: "input", value: existing ? existing.author : "", placeholder: "作者" });
        const source = h("input", { class: "input", value: existing ? existing.source : "", placeholder: "来源，例如：《中国翻译》2023 年第 4 期" });
        const year = h("input", { class: "input", type: "number", value: existing ? String(existing.year) : "2024" });
        const text = h("textarea", { class: "textarea", style: { "min-height": "180px" }, value: existing ? existing.text : "", placeholder: "粘贴文献正文，或先选择 txt 文件自动填充" });
        const file = h("input", { type: "file", accept: ".txt,.md,text/plain" });
        file.addEventListener("change", (e) => {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = function (ev) {
            text.value = String(ev.target.result || "").slice(0, 60000);
            if (!title.value) title.value = f.name.replace(/\.[^.]+$/, "");
            ZK.toast("已读取文件：" + f.name + "（" + U.num(text.value.length) + " 字）");
          };
          reader.onerror = () => ZK.toast("文件读取失败", "danger");
          reader.readAsText(f, "utf-8");
          e.target.value = "";
        });

        ZK.modal({
          title: existing ? "补充文献正文" : "上传文献",
          sub: "支持 txt / md 文件，或直接粘贴正文；解析将在保存后自动开始",
          size: "lg",
          render(api) {
            const err = h("div", { class: "login-err hidden" });
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                field("文献标题", title, true),
                field("作者", author),
                field("来源", source),
                field("年份", year),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "从文件读取" }), file]),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "文献正文" }), text]),
                h("div", { class: "span-full" }, [err]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: existing ? "保存并重新解析" : "保存并解析",
                onclick() {
                  if (!title.value.trim()) {
                    err.textContent = "请填写文献标题";
                    err.classList.remove("hidden");
                    return;
                  }
                  if (text.value.trim().length < 200) {
                    err.textContent = "正文过短（至少 200 字），解析结果会不完整";
                    err.classList.remove("hidden");
                    return;
                  }
                  let rec;
                  if (existing) {
                    rec = ZK.db.update("literature", existing.id, {
                      title: title.value.trim(),
                      author: author.value.trim() || "未填写",
                      source: source.value.trim() || "未填写",
                      year: Number(year.value) || new Date().getFullYear(),
                      text: text.value.trim(),
                      sizeKB: Math.round(text.value.length / 512),
                    });
                  } else {
                    rec = ZK.db.insert("literature", {
                      title: title.value.trim(),
                      author: author.value.trim() || "未填写",
                      source: source.value.trim() || "未填写",
                      year: Number(year.value) || new Date().getFullYear(),
                      type: "上传文献",
                      sizeKB: Math.round(text.value.length / 512),
                      parsed: false,
                      parsedAt: null,
                      addedAt: Date.now(),
                      text: text.value.trim(),
                    });
                  }
                  ZK.db.log("上传文献", "录入《" + rec.title + "》，正文 " + U.num(rec.text.length) + " 字");
                  api.close();
                  currentId = rec.id;
                  paintList();
                  runParse(rec);
                },
              }),
            ]);
          },
        });
      }

      paintList();
      const first = ZK.db.find("literature", currentId) || ZK.db.list("literature")[0];
      if (first) pick(first);
      else renderDetail(null);
      void uploaded;
    },
  };

  /* ==================================================================
     四、文献对话问答
     ================================================================== */
  P["graph/qa"] = {
    render(root, param) {
      const litList = ZK.db.list("literature").filter((l) => l.text);
      let currentId = param || (litList[0] || {}).id;
      let messages = [];

      root.appendChild(
        ZK.ui.pageHead({
          title: "文献对话问答",
          sub: "以自然对话方式围绕文献提问，回答均给出命中段落与出处位置，可核查、可追溯。",
          actions: [
            h("button", { class: "btn btn-sm", text: "返回文献解析", onclick: () => go("#/graph/literature") }),
            h("button", { class: "btn btn-sm", text: "清空对话", onclick: () => { messages = []; renderStream(); } }),
          ],
        })
      );

      if (!litList.length) {
        root.appendChild(ZK.ui.empty({ title: "暂无可问答的文献", desc: "请先在「AI 文献解析」中上传或补充文献正文。", icon: ZK.icons.wand(22), action: h("button", { class: "btn btn-primary btn-sm", text: "去上传文献", onclick: () => go("#/graph/literature") }) }));
        return;
      }

      const litSel = h("select", { class: "select", style: { width: "100%" } }, litList.map((l) => h("option", { value: l.id, text: l.title + "（" + U.num((l.text || "").length) + " 字）", selected: l.id === currentId ? true : null })));
      const infoHost = h("div", { class: "mt-12" });
      const stream = h("div", { class: "chat-stream" });
      const input = h("textarea", { class: "textarea", placeholder: "围绕文献内容提问，例如：shall 与 will 的区别是什么？", style: { "min-height": "70px" } });

      root.appendChild(
        ZK.ui.card({
          title: "选择文献",
          sub: "问答限定在当前选中文献范围内，回答不会超出文献内容",
          icon: ZK.icons.bookOpen(16),
          body: [litSel, infoHost],
        })
      );

      root.appendChild(
        ZK.ui.card({
          title: "文献对话",
          sub: "AI 基于文献原文作答，并标注命中段落位置与置信度",
          icon: ZK.icons.messages(16),
          body: [
            stream,
            h("div", { class: "chat-composer mt-12" }, [
              input,
              h("div", { class: "row-between mt-8" }, [
                h("div", { class: "fs-11 faint", text: "Ctrl / ⌘ + Enter 发送" }),
                h("div", { class: "row", style: { gap: "6px" } }, [
                  h("button", { class: "btn btn-sm", text: "查看词云与脑图", onclick: () => go("#/graph/literature/" + currentId) }),
                  h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.send(14) + "<span>提问</span>", onclick: () => ask() }),
                ]),
              ]),
            ]),
            suggestionChips(),
          ],
        })
      );

      function suggestionChips() {
        const l = ZK.db.find("literature", currentId);
        if (!l || !l.text) return h("div");
        const kws = U.keywords(l.text, 8).map((k) => k.term).filter((t) => t.length >= 2);
        const qs = kws.slice(0, 5).map((k) => "文献中关于「" + k + "」是怎么说的？");
        return h("div", { class: "mt-12" }, [
          h("div", { class: "fs-12 fw-6 em mb-8", text: "提问建议（依据本文关键词生成）" }),
          h("div", { class: "chip-wrap" }, qs.map((q) => h("button", { class: "chip", text: q, onclick: () => { input.value = q; ask(); } }))),
        ]);
      }

      function paintInfo() {
        U.clear(infoHost);
        const l = ZK.db.find("literature", currentId);
        if (!l) return;
        infoHost.appendChild(
          h("div", { class: "row-between" }, [
            h("div", { class: "fs-12 muted", text: (l.author || "—") + " · " + (l.source || "—") + " · " + (l.year || "") }),
            h("div", { class: "row", style: { gap: "6px" } }, [
              ZK.ui.badge("正文 " + U.num((l.text || "").length) + " 字", "blue"),
              ZK.ui.badge("句数 " + U.splitSentences(l.text || "").length, "violet"),
            ]),
          ])
        );
      }

      function renderStream() {
        U.clear(stream);
        if (!messages.length) {
          stream.appendChild(
            h("div", { class: "chat-msg" }, [
              h("div", { class: "cm-avatar ai", text: "AI" }),
              h("div", { class: "chat-bubble" }, [
                h("div", { class: "cb-name", text: "文献助读" }),
                h("div", { class: "fs-13", style: { "line-height": "1.8" }, text: "已载入文献全文。你可以就文献中的概念、结论、数据或方法提问，我会定位到原文段落并标出出处。回答严格限定在该文献范围内，不做外部扩写。" }),
              ]),
            ])
          );
        }
        messages.forEach((m) => {
          const isMe = m.role === "me";
          stream.appendChild(
            h("div", { class: "chat-msg" + (isMe ? " me" : "") }, [
              h("div", { class: "cm-avatar " + (isMe ? "me" : "ai"), text: isMe ? "学" : "AI" }),
              h("div", { class: "chat-bubble" }, [
                m.meta ? h("div", { class: "cb-name", text: m.meta }) : null,
                m.thinking
                  ? h("div", { class: "typing-dots" }, [h("i"), h("i"), h("i")])
                  : h("div", {}, String(m.text).split("\n\n").map((seg) => h("div", { class: "fs-13", style: { "line-height": "1.8", "margin-bottom": "6px" }, text: seg }))),
                m.sources && m.sources.length
                  ? h("div", { class: "mt-8" }, [
                      h("div", { class: "fs-11 ghost mb-4", text: "引用段落（" + m.sources.length + " 处）" }),
                      h("div", { class: "stack-8" }, m.sources.map((s) =>
                        h("div", { class: "advice info" }, [
                          h("div", { class: "fs-11 em", text: "第 " + s.sentenceIndex + " 句 · 相关度 " + s.score }),
                          h("div", { class: "fs-12 muted mt-4", text: s.text }),
                        ])
                      )),
                    ])
                  : null,
                m.confidence !== undefined && m.confidence > 0
                  ? h("div", { class: "fs-11 faint mt-8", text: "置信度 " + U.pct(m.confidence * 100, 0) + "　来源文献：《" + m.title + "》" })
                  : null,
              ]),
            ])
          );
        });
        stream.scrollTop = stream.scrollHeight;
      }

      function ask() {
        const q = input.value.trim();
        if (!q) return;
        const l = ZK.db.find("literature", currentId);
        if (!l) return;
        messages.push({ role: "me", text: q });
        input.value = "";
        renderStream();

        messages.push({ role: "ai", thinking: true });
        renderStream();

        setTimeout(() => {
          const res = ZK.engine.answerFromLiterature(q, l.text || "", l.title);
          messages.pop();
          messages.push({ role: "ai", text: res.text, sources: res.sources, confidence: res.confidence, title: l.title, meta: "基于《" + U.truncate(l.title, 18) + "》全文检索" });
          ZK.db.log("文献问答", "在《" + l.title + "》中提问：" + U.truncate(q, 30));
          renderStream();
        }, 520);
      }

      input.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask();
      });
      litSel.addEventListener("change", () => {
        currentId = litSel.value;
        messages = [];
        location.hash = "#/graph/qa/" + currentId;
      });

      paintInfo();
      renderStream();
    },
  };
})();
