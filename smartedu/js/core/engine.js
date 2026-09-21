/* ==========================================================================
   核心引擎 — ZK.engine
   1) 检索引擎：语义（TF-IDF 余弦）/ 全文（词项覆盖 + 精确子串）/ 混合
   2) AI 评阅引擎：按评估角色与评分标准对作品打分
   3) 文献解析引擎：词云 / 摘要 / 脑图 / 试题 / 问答
   4) 内容安全引擎：敏感词命中、忽略词消歧、用户风险统计
   5) 学情引擎：知识点聚合、学习路径、学情画像
   全部为真实计算，结果随输入数据变化
   ========================================================================== */
window.ZK = window.ZK || {};

(function () {
  "use strict";
  const U = ZK.util;

  /* =====================================================================
     一、分片与索引
     ===================================================================== */

  /** 中文友好的句子边界切分 */
  function splitKeep(text) {
    const s = String(text || "").replace(/\r\n/g, "\n");
    const blocks = s.split(/\n+/).filter((x) => x.trim());
    const out = [];
    blocks.forEach((b) => {
      const parts = b.split(/(?<=[。！？!?；;：:])/);
      let buf = "";
      parts.forEach((p) => {
        if ((buf + p).length > 400) {
          if (buf) out.push(buf.trim());
          buf = p;
        } else {
          buf += p;
        }
      });
      if (buf.trim()) out.push(buf.trim());
    });
    return out.filter((x) => x.length > 0);
  }

  /** 按分片配置切分文档，返回 chunk 数组 */
  function chunkText(text, size, overlap) {
    const sentences = splitKeep(text);
    const sz = Math.max(80, size || 300);
    const ov = Math.max(0, Math.min(overlap || 0, sz - 40));
    const chunks = [];
    let cur = "";
    for (const s of sentences) {
      if (cur && cur.length + s.length > sz) {
        chunks.push(cur.trim());
        const tail = cur.length > ov ? cur.slice(cur.length - ov) : cur;
        cur = tail + s;
      } else {
        cur += (cur ? "" : "") + s;
      }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.length ? chunks : [String(text || "").slice(0, sz)];
  }

  /**
   * 构建知识库索引
   * 返回 { chunks:[{id,docId,docTitle,text,index,tf,len}], idf:Map, avgLen, docs:[] }
   */
  function buildIndex(kbId) {
    const kb = ZK.db.find("knowledgeBases", kbId);
    const cfg = (kb && kb.recall) || { chunkSize: 300, overlap: 60 };
    const docs = ZK.db.list("kbDocs", (d) => d.kbId === kbId);
    const frags = ZK.db.list("kbFragments", (f) => f.kbId === kbId && f.enabled !== false);

    const chunks = [];
    docs.forEach((doc) => {
      const parts = chunkText(doc.text, cfg.chunkSize, cfg.overlap);
      parts.forEach((p, i) => {
        chunks.push({
          id: doc.id + "#c" + (i + 1),
          docId: doc.id,
          docTitle: doc.title,
          docType: doc.type,
          chapter: doc.chapter,
          text: p,
          index: i + 1,
          total: parts.length,
          kind: "doc",
        });
      });
    });
    frags.forEach((f) => {
      chunks.push({
        id: f.id,
        docId: f.id,
        docTitle: "［上下文补充］" + f.title,
        docType: "补充分片",
        chapter: "—",
        text: f.text,
        index: 1,
        total: 1,
        kind: "fragment",
        priority: f.priority || 5,
      });
    });

    const df = new Map();
    let totalLen = 0;
    chunks.forEach((c) => {
      const tf = U.termFreq(c.text);
      c.tf = tf;
      c.len = 0;
      tf.forEach((v, k) => {
        c.len += v;
        df.set(k, (df.get(k) || 0) + 1);
      });
      totalLen += c.len;
    });

    const N = chunks.length || 1;
    const idf = new Map();
    df.forEach((v, k) => idf.set(k, Math.log((N + 1) / (v + 0.5)) + 1));

    return {
      kb: kb,
      cfg: cfg,
      chunks: chunks,
      idf: idf,
      avgLen: totalLen / N,
      docCount: docs.length,
      fragCount: frags.length,
    };
  }

  /** TF-IDF 权重向量（L2 归一化） */
  function weightVector(tf, idf, avgLen) {
    const vec = new Map();
    let norm = 0;
    tf.forEach((f, term) => {
      const w = (1 + Math.log(f)) * (idf.get(term) || 1);
      vec.set(term, w);
      norm += w * w;
    });
    norm = Math.sqrt(norm) || 1;
    vec.forEach((v, k) => vec.set(k, v / norm));
    void avgLen;
    return vec;
  }

  function cosine(a, b) {
    let dot = 0;
    const small = a.size < b.size ? a : b;
    const big = a.size < b.size ? b : a;
    small.forEach((v, k) => {
      const w = big.get(k);
      if (w) dot += v * w;
    });
    return dot;
  }

  /**
   * 检索主入口
   * mode: semantic | fulltext | hybrid
   */
  function retrieve(kbId, query, override) {
    const idx = buildIndex(kbId);
    const cfg = Object.assign({}, idx.cfg, override || {});
    const q = String(query || "").trim();
    if (!q) return { hits: [], mode: cfg.mode, stats: { chunks: idx.chunks.length, docs: idx.docCount } };

    const qtokens = U.tokenize(q);
    const qtf = U.termFreq(q);
    const qvec = weightVector(qtf, idx.idf, idx.avgLen);
    const qLower = q.toLowerCase();

    const scored = idx.chunks.map((c) => {
      /* --- 语义分：余弦相似度（映射到 0-1） --- */
      const cvec = weightVector(c.tf, idx.idf, idx.avgLen);
      let semantic = cosine(qvec, cvec);
      semantic = U.clamp(semantic * 2.4, 0, 1);

      /* --- 全文分：词项覆盖率 + 精确子串命中 --- */
      const uniqueQ = Array.from(new Set(qtokens));
      let hitCount = 0;
      const matched = [];
      uniqueQ.forEach((t) => {
        if (c.tf.has(t)) {
          hitCount += 1;
          matched.push(t);
        }
      });
      let coverage = uniqueQ.length ? hitCount / uniqueQ.length : 0;
      const subHit = qLower.length >= 2 && c.text.toLowerCase().indexOf(qLower) >= 0;
      if (subHit) coverage = Math.min(1, coverage + 0.35);
      // 长词加权
      let longBonus = 0;
      matched.forEach((t) => {
        if (t.length >= 3) longBonus += 0.04;
      });
      const fulltext = U.clamp(coverage + longBonus, 0, 1);

      const w = cfg.semanticWeight + cfg.fulltextWeight || 1;
      let final =
        cfg.mode === "semantic"
          ? semantic
          : cfg.mode === "fulltext"
          ? fulltext
          : (semantic * cfg.semanticWeight + fulltext * cfg.fulltextWeight) / w;

      // 重排序：命中精确子串或补充分片优先
      if (cfg.rerank) {
        if (subHit) final = Math.min(1, final + 0.08);
        if (c.kind === "fragment") final = Math.min(1, final + 0.03);
      }

      return {
        chunkId: c.id,
        docId: c.docId,
        docTitle: c.docTitle,
        docType: c.docType,
        chapter: c.chapter,
        kind: c.kind,
        index: c.index,
        total: c.total,
        text: c.text,
        semantic: Number(semantic.toFixed(4)),
        fulltext: Number(fulltext.toFixed(4)),
        final: Number(final.toFixed(4)),
        matched: matched.slice(0, 12),
      };
    });

    // 文档分片全文展开模式
    if (cfg.fullDoc) {
      const byDoc = new Map();
      scored.forEach((s) => {
        const cur = byDoc.get(s.docId);
        if (!cur || s.final > cur.final) byDoc.set(s.docId, s);
      });
      const docHits = Array.from(byDoc.values())
        .filter((s) => s.final >= cfg.threshold * 0.6)
        .sort((a, b) => b.final - a.final)
        .slice(0, cfg.topK);
      const doc = ZK.db.find("kbDocs", docHits.length ? docHits[0].docId : "");
      void doc;
      return {
        hits: docHits.map((s) => {
          const d = ZK.db.find("kbDocs", s.docId);
          const f = ZK.db.find("kbFragments", s.docId);
          return Object.assign({}, s, {
            text: d ? d.text : f ? f.text : s.text,
            wholeDoc: true,
            docChunks: d ? Math.max(1, Math.round(d.text.length / cfg.chunkSize)) : 1,
          });
        }),
        mode: cfg.mode,
        stats: { chunks: idx.chunks.length, docs: idx.docCount, fragments: idx.fragCount, fullDoc: true },
      };
    }

    const hits = scored
      .filter((s) => s.final >= cfg.threshold)
      .sort((a, b) => b.final - a.final)
      .slice(0, cfg.topK);

    return {
      hits: hits,
      mode: cfg.mode,
      stats: {
        chunks: idx.chunks.length,
        docs: idx.docCount,
        fragments: idx.fragCount,
        candidate: scored.length,
      },
    };
  }

  /** 用命中结果拼装给"AI 助手"的引用式回答 */
  function composeAnswer(query, hits) {
    if (!hits.length) {
      return {
        text: "未在所选知识库中检索到与该问题足够相关的分片。建议降低相似度阈值、提高召回条数，或在知识库中补充相关文档与上下文分片。",
        cites: [],
      };
    }
    const top = hits.slice(0, 3);
    const lines = top.map((h, i) => {
      const sentences = splitKeep(h.text);
      const qset = new Set(U.tokenize(query));
      let best = sentences[0] || h.text;
      let bestScore = -1;
      sentences.forEach((s) => {
        const st = new Set(U.tokenize(s));
        let ov = 0;
        qset.forEach((t) => {
          if (st.has(t)) ov += 1;
        });
        if (ov > bestScore) {
          bestScore = ov;
          best = s;
        }
      });
      return { i: i + 1, text: U.truncate(best, 260), source: h, sentences: sentences };
    });

    const body = lines.map((l) => l.text).join("");
    const cites = lines.map((l) => ({
      index: l.i,
      docTitle: l.source.docTitle,
      chapter: l.source.chapter,
      chunk: l.source.index + "/" + l.source.total,
      score: l.source.final,
    }));

    return {
      text:
        "根据知识库检索到的 " +
        hits.length +
        " 个相关分片，要点如下：\n\n" +
        lines.map((l) => "【" + l.i + "】" + l.text).join("\n\n") +
        "\n\n以上内容来自文档分片检索，可在下方来源出处中逐条核对原文。",
      cites: cites,
      raw: body,
    };
  }

  /* =====================================================================
     二、AI 评阅引擎（作品型任务）
     ===================================================================== */

  function blocksToText(blocks) {
    return (blocks || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text || "")
      .join("\n");
  }

  function structureMarkers(text) {
    const marks = [];
    const pats = [
      [/第[一二三四五六七八九十]+[、部分节]/, "中文分节标记"],
      [/[一二三四五六七八九十]+、/, "中文序号列举"],
      [/[（(][一二三四五六七八九十\d]+[)）]/, "括号序号"],
      [/\d+[.、)]\s?/, "阿拉伯数字序号"],
      [/第\s*\d+\s*条/, "条款编号"],
      [/摘要|结论|参考文献|一、|二、/, "学术结构词"],
      [/[=＝]|根据|依据|因此|综上/, "论证连接词"],
      [/\|.*\|/, "表格"],
    ];
    pats.forEach((p) => {
      if (p[0].test(text)) marks.push(p[1]);
    });
    return marks;
  }

  /**
   * 按评估角色与评分标准评阅作品
   * @param {object} task 任务对象（含 aiRoles / rubric）
   * @param {object} payload {blocks, title, learner}
   */
  function reviewSubmission(task, payload) {
    const blocks = payload.blocks || [];
    const text = blocksToText(blocks);
    const lower = text.toLowerCase();
    const imageCount = blocks.filter((b) => b.type === "image").length;
    const textLen = text.replace(/[\s\p{P}]/gu, "").length;
    const markers = structureMarkers(text);

    // 文本充分度（0.6 - 1.06），与期望长度挂钩
    const expectedLen = 320;
    const lenFactor = U.clamp(0.62 + Math.min(textLen / expectedLen, 1.6) * 0.28, 0.55, 1.04);
    // 结构分：每命中一个结构标记 +2.5%，上限 +18%
    const structFactor = U.clamp(1 + Math.min(markers.length, 7) * 0.025, 1, 1.18);
    // 图片加分（图文混排）
    const imageFactor = U.clamp(1 + Math.min(imageCount, 3) * 0.035, 1, 1.12);

    const roles = [];
    const allDims = [];
    const issues = [];
    const highlights = [];

    (task.aiRoles || []).forEach((role) => {
      let roleGot = 0;
      let roleTotal = 0;
      const roleDims = [];

      (role.dimensions || []).forEach((dim) => {
        const total = dim.weight;
        roleTotal += total;

        const signals = dim.signals || [];
        const anti = dim.anti || [];
        const matched = signals.filter((s) => lower.indexOf(String(s).toLowerCase()) >= 0);
        const violated = anti.filter((s) => lower.indexOf(String(s).toLowerCase()) >= 0);

        let ratio;
        if (signals.length === 0) {
          // 无关键词维度的维度：按长度与结构评估
          ratio = U.clamp((lenFactor - 0.55) / 0.5 * 0.62 + (structFactor - 1) / 0.18 * 0.34 + 0.06, 0.3, 0.98);
        } else {
          const coverage = matched.length / signals.length;
          ratio = 0.34 + coverage * 0.56; // 0.34 ~ 0.90
          // 覆盖不足时受长度与结构拖累
          if (coverage < 0.5) ratio *= 0.72 + lenFactor * 0.24;
          ratio *= structFactor;
          ratio *= imageFactor * 0.55 + 0.45;
        }
        ratio = U.clamp(ratio, 0.22, 0.99);
        ratio -= violated.length * 0.09;
        ratio = U.clamp(ratio, 0.15, 0.99);

        const got = Number((total * ratio).toFixed(1));
        roleGot += got;

        /* 未被覆盖到的关键要素（评估结果，供评语与建议复用） */
        const missingList = signals.filter((s) => matched.indexOf(s) < 0).slice(0, 5);

        const dimRec = {
          role: role.name,
          roleId: role.id,
          name: dim.name,
          score: got,
          weight: total,
          ratio: Number(ratio.toFixed(3)),
          matched: matched,
          missing: missingList,
          violated: violated,
          desc: dim.desc,
        };
        roleDims.push(dimRec);
        allDims.push(dimRec);

        if (ratio >= 0.86) {
          highlights.push(
            "【" +
              role.name +
              "·" +
              dim.name +
              "】处理到位：" +
              dim.desc +
              "。" +
              (matched.length
                ? "文中可核验到的支撑表述包括 " +
                  matched.slice(0, 4).map((m) => "“" + m + "”").join("、") +
                  "。"
                : "")
          );
        } else if (ratio < 0.78) {
          const gap = total - got;
          const level = gap >= total * 0.32 ? "二级" : gap >= total * 0.2 ? "三级" : "四级";
          const deduct = level === "二级" ? 3 : level === "三级" ? 1.5 : 0.5;
          issues.push({
            level: level,
            role: role.name,
            dim: dim.name,
            deduct: deduct,
            text:
              "【" +
              role.name +
              "·" +
              dim.name +
              "】" +
              dim.desc +
              "这一项评估为 " +
              got +
              "/" +
              total +
              " 分。" +
              (missingList.length
                ? "文中未体现的关键要素包括：" + missingList.map((m) => "“" + m + "”").join("、") + "。"
                : "表述深度不足，建议补充具体依据与可核验的细节。") +
              (violated.length
                ? "另需注意出现了应规避的表述：" + violated.map((m) => "“" + m + "”").join("、") + "。"
                : ""),
          });
        }
      });

      const roleScore = roleTotal ? Number(((roleGot / roleTotal) * 100).toFixed(1)) : 0;
      roles.push({
        roleId: role.id,
        roleName: role.name,
        persona: role.persona,
        focus: role.focus,
        weight: role.weight,
        score: roleScore,
        dims: roleDims,
      });
    });

    const wsum = roles.reduce((s, r) => s + r.weight, 0) || 100;
    const overall = Number((roles.reduce((s, r) => s + r.score * r.weight, 0) / wsum).toFixed(1));

    const sorted = roles.slice().sort((a, b) => b.score - a.score);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const weakDims = allDims.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 3);

    const advice = weakDims.map((d, i) => {
      const head = i === 0 ? "优先改进：" : "进一步优化：";
      let body = "";
      if (d.missing.length) {
        body =
          "围绕“" +
          d.name +
          "”，建议补充 " +
          d.missing.map((m) => "“" + m + "”").join("、") +
          " 等要素，做法上可先在文档中列出一张要素对照表，逐项说明本文的处理方式与依据。";
      } else if (d.violated.length) {
        body =
          "围绕“" +
          d.name +
          "”，文中出现了 " +
          d.violated.map((m) => "“" + m + "”").join("、") +
          " 一类表述，建议替换为更符合该场景惯例的写法，并说明替换理由。";
      } else {
        body =
          "围绕“" +
          d.name +
          "”，当前得分 " +
          d.score +
          "/" +
          d.weight +
          " 分，主要受文本充分度与结构层次影响。建议增加具体语料引用与逐项分析，避免仅作概括性说明。";
      }
      return head + "（" + d.role + "·" + d.name + "）" + body;
    });

    // 结构性建议
    if (textLen < 400) {
      advice.push(
        "文本充分度提示：本次提交正文约 " +
          textLen +
          " 字，低于该任务的建议篇幅（约 600 字以上）。内容安全评阅与表达质量两项均会受篇幅影响，建议补充案例分析、依据说明与术语对照内容。"
      );
    }
    if (imageCount === 0) {
      advice.push(
        "图文混排提示：本次提交未包含图示或表格。任务要求提交图文混排文档，加入条款要素对照表、流程示意图或术语依据表可同时提升“格式规范度”“图表运用”等维度的得分。"
      );
    } else {
      advice.push(
        "图文混排已按要求提交，共 " +
          imageCount +
          " 幅图示。建议为每幅图示补充图注与正文引用（如“见图 1”），使图示与论证形成呼应，而非独立陈列。"
      );
    }

    const summary =
      "本次作品由 " +
      roles.length +
      " 个评估角色协同评阅，加权总分 " +
      overall +
      " 分（" +
      U.grade(overall).label +
      "）。评阅依据为任务中设定的评估角色与对应评分标准，各角色权重分别为 " +
      roles.map((r) => r.roleName + " " + r.weight + "%").join("、") +
      "。表现最好的评估维度来自【" +
      (best ? best.roleName : "—") +
      "】（" +
      (best ? best.score : 0) +
      " 分），相对薄弱的是【" +
      (worst ? worst.roleName : "—") +
      "】（" +
      (worst ? worst.score : 0) +
      " 分）。全文有效正文 " +
      textLen +
      " 字，含图示 " +
      imageCount +
      " 幅，结构标记 " +
      markers.length +
      " 项（" +
      (markers.join("、") || "无") +
      "）。";

    return {
      at: Date.now(),
      overall: overall,
      summary: summary,
      roles: roles,
      dims: allDims.map((d) => ({
        role: d.role,
        name: d.name,
        score: d.score,
        weight: d.weight,
        ratio: d.ratio,
        matched: d.matched,
        missing: d.missing,
      })),
      highlights: highlights.slice(0, 6),
      issues: issues,
      advice: advice,
      metrics: {
        textLen: textLen,
        imageCount: imageCount,
        markers: markers,
        lenFactor: Number(lenFactor.toFixed(3)),
        structFactor: Number(structFactor.toFixed(3)),
      },
    };
  }

  /* =====================================================================
     三、文献解析引擎
     ===================================================================== */

  function summarize(text, n) {
    const sentences = U.splitSentences(text);
    if (sentences.length <= (n || 5)) return sentences;
    const kws = U.keywords(text, 60).map((k) => k.term);
    const scored = sentences.map((s, i) => {
      const st = new Set(U.tokenize(s));
      let score = 0;
      kws.forEach((k, ki) => {
        if (st.has(k)) score += 1 / (1 + ki * 0.12);
      });
      score = score / Math.sqrt(s.length / 24 + 1);
      // 位置权重：开头与结尾的句子更重要
      const posBoost = i < 2 ? 1.35 : i >= sentences.length - 2 ? 1.15 : 1;
      return { s: s, i: i, score: score * posBoost };
    });
    const picked = scored
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, n || 5)
      .sort((a, b) => a.i - b.i);
    return picked.map((p) => p.s);
  }

  function buildMindmap(text, title) {
    const lines = String(text || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const branches = [];
    let current = null;

    const headRe = /^([一二三四五六七八九十]+|\d+)[、.．)]\s*(.{2,28})$/;

    lines.forEach((l) => {
      const m = l.match(headRe);
      // 章节标题：以「一、引言」形式出现且长度较短
      if (m && l.length <= 34) {
        current = { title: m[2].replace(/[。.]$/, ""), points: [] };
        branches.push(current);
        return;
      }
      if (!current) {
        current = { title: "概述", points: [] };
        branches.push(current);
      }
      const sentences = U.splitSentences(l);
      sentences.forEach((s) => {
        const kws = U.keywords(s, 1);
        const key = kws.length ? kws[0].term : "";
        if (current.points.length < 8) {
          current.points.push({ text: U.truncate(s, 78), key: key });
        }
      });
    });

    if (!branches.length) {
      const sentences = U.splitSentences(text);
      const chunkN = Math.max(1, Math.ceil(sentences.length / 6));
      for (let i = 0; i < chunkN && i < 8; i++) {
        branches.push({
          title: "主题 " + (i + 1),
          points: sentences.slice(i * 6, i * 6 + 6).map((s) => ({
            text: U.truncate(s, 78),
            key: (U.keywords(s, 1)[0] || { term: "" }).term,
          })),
        });
      }
    }

    return {
      root: title,
      branches: branches.slice(0, 10),
      nodeCount: branches.reduce((s, b) => s + b.points.length + 1, 0),
    };
  }

  /** 自动出题：填空 / 单选 / 判断 */
  function buildQuiz(text, count) {
    const sentences = U.splitSentences(text).filter((s) => s.length >= 24);
    const kws = U.keywords(text, 40).map((k) => k.term).filter((t) => t.length >= 2);
    if (sentences.length < 3 || kws.length < 4) return [];

    const quiz = [];
    const usedTerms = {};
    const N = Math.min(count || 6, sentences.length);

    // 按句子中是否含高权重关键词排序，优先出题
    const ranked = sentences
      .map((s, i) => {
        const st = new Set(U.tokenize(s));
        let sc = 0;
        kws.forEach((k, ki) => {
          if (st.has(k)) sc += 1 / (1 + ki * 0.1);
        });
        return { s: s, i: i, sc: sc };
      })
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc);

    const chosen = ranked.slice(0, N);

    chosen.forEach((item, qi) => {
      const st = new Set(U.tokenize(item.s));
      const inSentence = kws.filter((k) => st.has(k) && !usedTerms[k]);
      if (!inSentence.length) return;
      const term = inSentence[0];
      usedTerms[term] = 1;

      const others = kws.filter((k) => k !== term && !st.has(k)).slice(0, 12);
      if (others.length < 3) return;

      const distractors = [];
      const step = Math.max(1, Math.floor(others.length / 3));
      for (let i = 0; i < 3; i++) {
        const cand = others[(i * step + qi) % others.length];
        if (cand && distractors.indexOf(cand) < 0 && cand !== term) distractors.push(cand);
      }
      while (distractors.length < 3) {
        const cand = others[distractors.length + 5];
        if (!cand || distractors.indexOf(cand) >= 0) break;
        distractors.push(cand);
      }
      if (distractors.length < 3) return;

      const options = distractors.slice(0, 3).concat([term]);
      // 确定性洗牌
      const order = [options.length - 1];
      for (let i = 0; i < options.length - 1; i++) order.splice((qi + i) % (order.length + 1), 0, i);
      const shuffled = order.map((i) => options[i]);

      quiz.push({
        id: "q_" + (qi + 1),
        type: "choice",
        stem: item.s.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "＿＿＿＿"),
        answer: term,
        options: shuffled,
        explain: "原文表述：" + U.truncate(item.s, 120) + "。该知识点在文献中对应关键词“" + term + "”。",
        source: { sentenceIndex: item.i + 1 },
      });
    });

    // 补充判断题
    const judgeSrc = ranked.slice(N, N + 3);
    judgeSrc.forEach((item, i) => {
      const st = new Set(U.tokenize(item.s));
      const inSent = kws.filter((k) => st.has(k));
      if (!inSent.length) return;
      const useTerm = inSent[0];
      const wrongPool = kws.filter((k) => !st.has(k) && k !== useTerm);
      if (!wrongPool.length) return;
      const wrong = wrongPool[(i * 3 + 1) % wrongPool.length];
      quiz.push({
        id: "q_j" + (i + 1),
        type: "judge",
        stem:
          "判断：以下表述与文献一致 —— “" +
          U.truncate(item.s.replace(new RegExp(useTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), wrong), 110) +
          "”",
        answer: "错误",
        options: ["正确", "错误"],
        explain:
          "文献原文为：“" + U.truncate(item.s, 130) + "”。题干把关键词“" + useTerm + "”替换为“" + wrong + "”，改变了原意，故为错误。",
        source: { sentenceIndex: item.i + 1 },
      });
    });

    return quiz.slice(0, (count || 6) + 2);
  }

  /** 文献整体解析 */
  function parseLiterature(text, title) {
    const plain = String(text || "");
    const chars = plain.replace(/\s/g, "").length;
    const sentences = U.splitSentences(plain);
    const kws = U.keywords(plain, 46);

    const maxScore = kws.length ? kws[0].score : 1;
    const cloud = kws.slice(0, 44).map((k, i) => ({
      term: k.term,
      score: k.score,
      weight: Number((k.score / maxScore).toFixed(3)),
      size: Math.round(14 + (k.score / maxScore) * 30),
      rank: i + 1,
      color: ["#60a5fa", "#60a5fa", "#38bdf8", "#c7d2fe", "#7dd3fc", "#3b82f6"][i % 6],
    }));

    return {
      title: title || "未命名文献",
      stats: {
        chars: chars,
        sentences: sentences.length,
        paragraphs: plain.split(/\n+/).filter((x) => x.trim()).length,
        keywords: kws.length,
        readMinutes: Math.max(1, Math.round(chars / 420)),
        tokens: U.tokenize(plain).length,
        uniqueTokens: new Set(U.tokenize(plain)).size,
      },
      cloud: cloud,
      keywords: kws.slice(0, 20).map((k) => k.term),
      summary: {
        short: summarize(plain, 3),
        long: summarize(plain, 6),
        keyPoints: kws.slice(0, 8).map((k) => k.term),
      },
      mindmap: buildMindmap(plain, title || "文献主题"),
      quiz: buildQuiz(plain, 6),
      parsedAt: Date.now(),
    };
  }

  /** 基于文献内容的自然对话问答 */
  function answerFromLiterature(query, text, title) {
    const q = String(query || "").trim();
    const sentences = U.splitSentences(text);
    if (!sentences.length) {
      return { text: "当前文献尚未解析出可用正文，请先上传或粘贴文献内容后再提问。", sources: [], confidence: 0 };
    }
    const qtok = U.tokenize(q);
    const qset = new Set(qtok);
    const lower = q.toLowerCase();

    // 用整体词频做逆文档近似权重
    const corpusTf = U.termFreq(text);
    const totalTerms = Array.from(corpusTf.values()).reduce((a, b) => a + b, 0) || 1;

    const scored = sentences.map((s, i) => {
      const st = U.termFreq(s);
      let score = 0;
      let hit = 0;
      qset.forEach((t) => {
        if (st.has(t)) {
          const corpusProb = (corpusTf.get(t) || 1) / totalTerms;
          score += (1 / (1 + Math.log(1 + corpusProb * 1000))) * (1 + Math.log(st.get(t)));
          hit += 1;
        }
      });
      if (score > 0) score = score / Math.sqrt(s.length / 26 + 1);
      if (lower.length >= 3 && s.toLowerCase().indexOf(lower) >= 0) score += 1.2;
      return { s: s, i: i, score: score, hit: hit };
    });

    const top = scored
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!top.length) {
      return {
        text:
          "在《" +
          (title || "当前文献") +
          "》全文中未找到与「" +
          q +
          "」直接相关的表述。可以尝试换用文献中的术语提问，或先查看下方的关键词与脑图，确认提问所用概念是否与文献用词一致。",
        sources: [],
        confidence: 0,
      };
    }

    const ordered = top.slice().sort((a, b) => a.i - b.i);
    const body = ordered.map((x, i) => "【" + (i + 1) + "】" + x.s).join("\n\n");
    const confidence = U.clamp(top[0].score / 2.2, 0.32, 0.97);

    const lead =
      top[0].hit >= 2
        ? "文献中与该问题直接相关的段落如下："
        : "文献中有相近表述的段落如下，供参考：";

    return {
      text:
        lead +
        "\n\n" +
        body +
        "\n\n来源：《" +
        (title || "当前文献") +
        "》，命中段落位置 " +
        ordered.map((x) => "第 " + (x.i + 1) + " 句").join("、") +
        "。",
      sources: ordered.map((x) => ({
        sentenceIndex: x.i + 1,
        text: U.truncate(x.s, 150),
        score: Number(x.score.toFixed(3)),
      })),
      confidence: Number(confidence.toFixed(2)),
    };
  }

  /* =====================================================================
     四、内容安全引擎
     ===================================================================== */

  const LEVEL_WEIGHT = { 高: 3, 中: 2, 低: 1, 无: 0 };

  /** 标出命中位置，便于页面高亮 */
  function markHits(text, words) {
    if (!words || !words.length) return U.escapeHtml(text);
    let out = U.escapeHtml(text);
    const uniq = Array.from(new Set(words)).sort((a, b) => b.length - a.length);
    uniq.forEach((w) => {
      const safe = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(safe, "g"), '<mark class="hit">' + w + "</mark>");
    });
    return out;
  }

  /**
   * 文本敏感检测
   * 忽略词机制：命中词前后 8 字内出现忽略词，则标记为「疑似误判」并可被忽略
   */
  function scanText(text, opts) {
    const o = opts || {};
    const kws = o.keywords || ZK.db.list("safetyKeywords", (k) => k.enabled !== false);
    const ignores = o.ignoreWords || ZK.db.list("ignoreWords", (k) => k.enabled !== false);
    const src = String(text || "");

    const hits = [];
    const ignored = [];

    kws.forEach((k) => {
      const word = k.word;
      if (!word) return;
      let pos = src.indexOf(word);
      const positions = [];
      while (pos >= 0) {
        positions.push(pos);
        pos = src.indexOf(word, pos + word.length);
      }
      if (!positions.length) return;

      // 忽略词上下文判定
      const ctxStart = Math.max(0, positions[0] - 8);
      const near = src.slice(Math.max(0, positions[0] - 10), positions[0] + word.length + 10);
      const hitIgnore = ignores.find((ig) => near.indexOf(ig.word) >= 0 && ig.word !== word);

      const rec = {
        word: word,
        category: k.category,
        level: k.level,
        action: k.action,
        count: positions.length,
        positions: positions,
        context: src.slice(ctxStart, Math.min(src.length, positions[0] + word.length + 14)),
        ignoredBy: hitIgnore ? hitIgnore.word : null,
        ignoreReason: hitIgnore ? hitIgnore.scene : null,
      };

      if (hitIgnore) ignored.push(rec);
      else hits.push(rec);
    });

    // 风险分：命中等级加权 + 命中密度
    let weighted = 0;
    hits.forEach((h) => {
      weighted += LEVEL_WEIGHT[h.level] * (1 + Math.log(h.count));
    });
    const density = src.length ? (hits.reduce((s, h) => s + h.count, 0) / src.length) * 1000 : 0;
    let riskScore = U.clamp(Math.round(weighted * 9 + density * 6), 0, 100);

    // 等级与处置
    let level = "无";
    if (hits.some((h) => h.level === "高")) level = "高";
    else if (hits.some((h) => h.level === "中")) level = "中";
    else if (hits.length) level = "低";
    let action = "放行";
    if (level === "高") action = "拦截并上报";
    else if (level === "中") action = "机器审核";
    else if (level === "低") action = "仅记录";
    if (!hits.length) riskScore = Math.min(riskScore, 8);
    else riskScore = Math.max(riskScore, level === "高" ? 62 : level === "中" ? 34 : 14);

    return {
      hits: hits.sort((a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level]),
      ignored: ignored,
      hitWords: hits.map((h) => h.word),
      ignoredWords: ignored.map((h) => h.word),
      totalHits: hits.reduce((s, h) => s + h.count, 0),
      level: level,
      action: action,
      riskScore: riskScore,
      scannedLength: src.length,
      density: Number(density.toFixed(2)),
    };
  }

  /** 视频在线检测：字幕文本 + 画面帧信息 */
  function scanVideo(video, opts) {
    const base = scanText(video.subtitle || "", opts);
    // 画面维度：分辨率、时长、码率 → 画面信息量评估
    const res = String(video.resolution || "1280×720").split("×");
    const w = Number(res[0]) || 1280;
    const h = Number(res[1]) || 720;
    const pixels = (w * h) / (1280 * 720);
    const dur = Number(video.duration) || 0;

    const frames = [];
    const frameCount = Math.min(12, Math.max(1, Math.round(dur / 10)));
    for (let i = 0; i < frameCount; i++) {
      const ratio = frameCount === 1 ? 0 : i / (frameCount - 1);
      // 依据字幕分布密度判定该帧是否为"信息密集帧"
      const seg = (video.subtitle || "").slice(
        Math.floor((video.subtitle || "").length * ratio),
        Math.floor((video.subtitle || "").length * ratio) + 24
      );
      frames.push({
        index: i + 1,
        at: Math.round(dur * ratio),
        text: seg,
        dense: seg.length > 12,
      });
    }

    return Object.assign({}, base, {
      kind: "video",
      frames: frames,
      resolution: w + "×" + h,
      pixelFactor: Number(pixels.toFixed(2)),
      durationText:
        Math.floor(dur / 60) + " 分 " + String(dur % 60).padStart(2, "0") + " 秒",
      longVideo: dur > 600,
    });
  }

  /** 用户风险统计：风险值 / 垃圾发布量 / 垃圾发布率 */
  function userRisk(collection) {
    const posts = ZK.db.list("posts");
    const learners = ZK.db.list("learners");
    const lists = ZK.db.list("nameLists");

    const byUser = new Map();
    learners.forEach((l) => {
      byUser.set(l.id, {
        id: l.id,
        name: l.name,
        cls: l.cls || (ZK.db.find("classes", l.classId) || {}).name || "—",
        total: 0,
        spam: 0,
        hits: {},
        weighted: 0,
        lastSpamAt: null,
        platforms: {},
      });
    });

    posts.forEach((p) => {
      if (!byUser.has(p.learnerId)) {
        byUser.set(p.learnerId, {
          id: p.learnerId,
          name: p.learner,
          cls: p.cls,
          total: 0,
          spam: 0,
          hits: {},
          weighted: 0,
          lastSpamAt: null,
          platforms: {},
        });
      }
      const u = byUser.get(p.learnerId);
      u.total += 1;
      u.platforms[p.platform] = (u.platforms[p.platform] || 0) + 1;
      if (p.isSpam) {
        u.spam += 1;
        u.weighted += LEVEL_WEIGHT[p.level] || 0;
        (p.hits || []).forEach((h) => (u.hits[h] = (u.hits[h] || 0) + 1));
        if (!u.lastSpamAt || p.createdAt > u.lastSpamAt) u.lastSpamAt = p.createdAt;
      }
    });

    const listMap = {};
    lists.forEach((l) => (listMap[l.account] = l));

    const rows = Array.from(byUser.values()).map((u) => {
      const learner = ZK.db.find("learners", u.id) || {};
      const list = listMap[learner.sno] || null;
      const spamRate = u.total ? u.spam / u.total : 0;
      // 显式风险值公式：垃圾发布率 50% + 内容严重度 35% + 名单状态 15%
      let score =
        spamRate * 100 * 0.5 + Math.min(u.weighted * 8, 100) * 0.35 + (list && list.type === "black" ? 100 : 0) * 0.15;
      if (list && list.type === "white") score -= 18;
      score = U.clamp(Math.round(score), 1, 100);
      const lv = U.riskLevel(score);
      return {
        id: u.id,
        name: u.name,
        sno: learner.sno || "—",
        cls: u.cls,
        total: u.total,
        spam: u.spam,
        spamRate: Number((spamRate * 100).toFixed(1)),
        hitWords: Object.keys(u.hits),
        hitCount: Object.keys(u.hits).reduce((s, k) => s + u.hits[k], 0),
        weighted: u.weighted,
        riskScore: score,
        riskLevel: lv,
        listType: list ? list.type : null,
        listReason: list ? list.reason : null,
        lastSpamAt: u.lastSpamAt,
        platforms: u.platforms,
      };
    });

    const active = rows.filter((r) => r.total > 0 || r.riskScore > 30);
    active.sort((a, b) => b.riskScore - a.riskScore);

    const summary = {
      users: rows.length,
      activeUsers: active.length,
      riskyUsers: active.filter((r) => r.riskScore >= 40).length,
      highRiskUsers: active.filter((r) => r.riskScore >= 70).length,
      totalPosts: collection ? collection.length : posts.length,
      spamPosts: posts.filter((p) => p.isSpam).length,
      spamRate: Number(((posts.filter((p) => p.isSpam).length / (posts.length || 1)) * 100).toFixed(1)),
      blacklisted: lists.filter((l) => l.type === "black").length,
      whitelisted: lists.filter((l) => l.type === "white").length,
    };

    return { rows: active, summary: summary, all: rows };
  }

  /* =====================================================================
     五、学情分析引擎
     ===================================================================== */

  function classAnalytics(classId) {
    const kps = ZK.db.list("knowledgePoints", (k) => k.courseId === "c_biztrans");
    const recs = ZK.db.list("learningRecords", (r) => (classId ? r.classId === classId : true));
    const cls = ZK.db.find("classes", classId);
    const learners = ZK.db.list("learners", (l) => (classId ? l.classId === classId : true));

    const kpStats = kps
      .map((k) => {
        const rs = recs.filter((r) => r.kpId === k.id);
        const resCount = ZK.db.list("resources", (x) => x.chapter === k.chapter).length + k.resourceCount;
        return {
          kpId: k.id,
          name: k.name,
          chapter: k.chapter,
          difficulty: k.difficulty,
          order: k.order,
          concepts: k.concepts,
          books: k.books,
          learners: rs.length,
          resourceCount: resCount,
          materialCount: k.materialCount,
          avgCompletion: U.round(U.avg(rs.map((r) => r.completion)), 1),
          avgMastery: U.round(U.avg(rs.map((r) => r.mastery)), 1),
          readPerCapita: U.round(U.avg(rs.map((r) => r.materialsRead)), 2),
          readRate: U.round(
            (U.sum(rs.map((r) => r.materialsRead)) / Math.max(1, U.sum(rs.map((r) => r.materialTotal)))) * 100,
            1
          ),
          avgDuration: Math.round(U.avg(rs.map((r) => r.duration))),
          attemptAvg: U.round(U.avg(rs.map((r) => r.attempts)), 2),
          lowCount: rs.filter((r) => r.mastery < 60).length,
          highCount: rs.filter((r) => r.mastery >= 85).length,
        };
      })
      .sort((a, b) => a.order - b.order);

    const overall = {
      avgCompletion: U.round(U.avg(kpStats.map((k) => k.avgCompletion)), 1),
      avgMastery: U.round(U.avg(kpStats.map((k) => k.avgMastery)), 1),
      avgReadPerCapita: U.round(U.avg(kpStats.map((k) => k.readPerCapita)), 2),
      totalRecords: recs.length,
      learners: learners.length,
    };

    // 掌握度分布
    const dist = [
      { label: "90-100", min: 90, max: 101, count: 0 },
      { label: "80-89", min: 80, max: 90, count: 0 },
      { label: "70-79", min: 70, max: 80, count: 0 },
      { label: "60-69", min: 60, max: 70, count: 0 },
      { label: "60 以下", min: 0, max: 60, count: 0 },
    ];
    recs.forEach((r) => {
      const b = dist.find((d) => r.mastery >= d.min && r.mastery < d.max);
      if (b) b.count += 1;
    });

    const sorted = kpStats.slice().sort((a, b) => a.avgMastery - b.avgMastery);
    const weak = sorted.slice(0, 3);
    const strong = sorted.slice(-3).reverse();

    return {
      cls: cls,
      overall: overall,
      kpStats: kpStats,
      distribution: dist,
      weakKps: weak,
      strongKps: strong,
      chapterTrend: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ch) => {
        const inCh = kpStats.filter((k) => k.chapter === ch);
        return {
          chapter: ch,
          label: "第" + ch + "章",
          mastery: inCh.length ? U.round(U.avg(inCh.map((k) => k.avgMastery)), 1) : 0,
          completion: inCh.length ? U.round(U.avg(inCh.map((k) => k.avgCompletion)), 1) : 0,
        };
      }),
    };
  }

  /** 个性化学习路径：以学生最薄弱知识点为起点，结合前置关系排序 */
  function learningPath(learnerId) {
    const learner = ZK.db.find("learners", learnerId);
    if (!learner) return null;
    const recs = ZK.db.list("learningRecords", (r) => r.learnerId === learnerId);
    const kps = ZK.db.list("knowledgePoints", (k) => k.courseId === "c_biztrans");
    const preReq = {
      kp_02: "kp_01",
      kp_04: "kp_02",
      kp_06: "kp_05",
      kp_07: "kp_05",
      kp_11: "kp_03",
      kp_12: "kp_03",
      kp_08: "kp_02",
      kp_09: "kp_08",
    };

    const items = recs
      .map((r) => {
        const kp = kps.find((k) => k.id === r.kpId) || {};
        return {
          kpId: r.kpId,
          name: kp.name,
          chapter: kp.chapter,
          difficulty: kp.difficulty,
          completion: r.completion,
          mastery: r.mastery,
          readPerCapita: r.materialsRead,
          materialTotal: r.materialTotal,
          duration: r.duration,
          gap: 100 - r.mastery,
        };
      })
      .sort((a, b) => b.gap - a.gap);

    const steps = items.slice(0, 6).map((it, i) => {
      const pre = preReq[it.kpId];
      const preName = pre ? (kps.find((k) => k.id === pre) || {}).name : null;
      const preRec = pre ? recs.find((r) => r.kpId === pre) : null;
      const phase =
        i < 2 ? "第一周 · 补基础" : i < 4 ? "第二周 · 强关联" : "第三周 · 综合应用";
      const tasks = [];
      if (preName && preRec && preRec.mastery < 80) {
        tasks.push("先回看前置知识点《" + preName + "》（当前掌握率 " + preRec.mastery + "%），完成对应章节练习");
      }
      tasks.push(
        "完成《" +
          it.name +
          "》配套资源 " +
          Math.min(3, it.materialTotal) +
          " 项（当前已完成 " +
          it.readPerCapita +
          "/" +
          it.materialTotal +
          " 项）"
      );
      if (it.mastery < 60) {
        tasks.push("重做该知识点相关翻译练习，重点核对评分标准中标注的失分项");
      } else {
        tasks.push("参与该知识点的作品型任务评阅，对照 AI 反馈检查术语与格式规范");
      }
      return {
        step: i + 1,
        kpId: it.kpId,
        name: it.name,
        chapter: it.chapter,
        difficulty: it.difficulty,
        mastery: it.mastery,
        completion: it.completion,
        gap: it.gap,
        phase: phase,
        reason:
          "掌握率 " +
          it.mastery +
          "%（班级平均 " +
          U.round(
            U.avg(
              ZK.db.list("learningRecords", (r) => r.kpId === it.kpId && r.classId === learner.classId)
                .map((r) => r.mastery)
            ),
            1
          ) +
          "%），位列薄弱知识点",
        tasks: tasks,
        estMinutes: 45 + it.difficulty * 15,
      };
    });

    return {
      learner: learner,
      cls: ZK.db.find("classes", learner.classId),
      generatedAt: Date.now(),
      steps: steps,
      summary:
        learner.name +
        " 当前综合掌握率 " +
        U.round(U.avg(recs.map((r) => r.mastery)), 1) +
        "%，薄弱知识点集中在 " +
        steps
          .slice(0, 3)
          .map((s) => "《" + s.name + "》")
          .join("、") +
        "。建议按下列顺序推进，预计需要 " +
        steps.reduce((s, x) => s + x.estMinutes, 0) +
        " 分钟。",
    };
  }

  /** AI 学情画像 */
  function studentProfile(learnerId) {
    const learner = ZK.db.find("learners", learnerId);
    if (!learner) return null;
    const recs = ZK.db.list("learningRecords", (r) => r.learnerId === learnerId);
    const kps = ZK.db.list("knowledgePoints");
    const clsRecs = ZK.db.list("learningRecords", (r) => r.classId === learner.classId);

    const avg = (arr, f) => U.avg(arr.map(f));
    const mastery = U.round(avg(recs, (r) => r.mastery), 1);
    const completion = U.round(avg(recs, (r) => r.completion), 1);
    const clsMastery = U.round(avg(clsRecs, (r) => r.mastery), 1);
    const clsCompletion = U.round(avg(clsRecs, (r) => r.completion), 1);

    const rank =
      ZK.db
        .list("learners", (l) => l.classId === learner.classId)
        .map((l) => ({
          id: l.id,
          m: avg(
            ZK.db.list("learningRecords", (r) => r.learnerId === l.id),
            (r) => r.mastery
          ),
        }))
        .sort((a, b) => b.m - a.m)
        .findIndex((x) => x.id === learnerId) + 1;

    const byKp = recs
      .map((r) => {
        const kp = kps.find((k) => k.id === r.kpId) || {};
        return {
          kpId: r.kpId,
          name: kp.name,
          chapter: kp.chapter,
          difficulty: kp.difficulty,
          mastery: r.mastery,
          completion: r.completion,
          materialsRead: r.materialsRead,
          materialTotal: r.materialTotal,
          duration: r.duration,
          attempts: r.attempts,
        };
      })
      .sort((a, b) => a.mastery - b.mastery);

    const weak = byKp.slice(0, 3);
    const strong = byKp.slice(-3).reverse();

    // 学习行为特征
    const avgDuration = Math.round(avg(recs, (r) => r.duration));
    const readRate = U.round(
      (U.sum(recs.map((r) => r.materialsRead)) / Math.max(1, U.sum(recs.map((r) => r.materialTotal)))) * 100,
      1
    );
    const attemptAvg = U.round(avg(recs, (r) => r.attempts), 2);
    const practiceCount = ZK.db.list("practiceSessions", (s) => s.learnerId === learnerId).length;
    const subCount = ZK.db.list("submissions", (s) => s.learnerId === learnerId).length;

    const traits = [];
    if (readRate >= 70) traits.push({ tag: "资料阅读充分", desc: "课程资料人均阅读完成率 " + readRate + "%，资源利用水平高于班级均值" });
    else traits.push({ tag: "资料阅读不足", desc: "课程资料阅读完成率 " + readRate + "%，建议按学习路径提示补充阅读" });

    if (attemptAvg >= 2.6) traits.push({ tag: "反复练习型", desc: "知识点平均练习 " + attemptAvg + " 次，通过重复训练提升掌握度，可适当提高任务难度" });
    else traits.push({ tag: "一次成型型", desc: "知识点平均练习 " + attemptAvg + " 次，建议对薄弱知识点增加复盘练习" });

    if (avgDuration >= 90) traits.push({ tag: "深度投入型", desc: "单知识点平均学习时长 " + avgDuration + " 分钟，投入度较高" });
    else traits.push({ tag: "碎片学习型", desc: "单知识点平均学习时长 " + avgDuration + " 分钟，建议改为集中时段学习" });

    if (mastery - clsMastery >= 5) traits.push({ tag: "稳定领先", desc: "掌握率高于班级平均 " + U.round(mastery - clsMastery, 1) + " 个百分点" });
    else if (clsMastery - mastery >= 5) traits.push({ tag: "需重点关注", desc: "掌握率低于班级平均 " + U.round(clsMastery - mastery, 1) + " 个百分点" });

    const level = mastery >= 85 ? "优秀" : mastery >= 75 ? "良好" : mastery >= 65 ? "中等" : "待提升";
    const rl = U.riskLevel(ZK.db.list("posts", (p) => p.learnerId === learnerId && p.isSpam).length >= 2 ? 70 : 12);

    const persona =
      mastery >= 85
        ? "稳步领先型学习者"
        : mastery >= 75
        ? "均衡发展型学习者"
        : mastery >= 65
        ? "潜力待释放型学习者"
        : "基础待夯实型学习者";

    const suggestion = [
      "优先补强 " +
        weak
          .map((w) => "《" + w.name + "》（掌握率 " + w.mastery + "%）")
          .join("、") +
        "，建议通过重做相关翻译练习并对照评分标准自查。",
      readRate < 70
        ? "课程资料阅读完成率为 " +
          readRate +
          "%，低于班级平均水平，建议按知识点配套资料清单逐项完成，尤其是与薄弱知识点相关的资料。"
        : "资料阅读完成率 " + readRate + "%，资源利用充分，可将精力转向综合应用类任务。",
      strong.length
        ? "优势知识点为 " +
          strong.map((s) => "《" + s.name + "》").join("、") +
          "，建议在作品型任务中承担该部分的术语与逻辑把关角色，通过输出巩固优势。"
        : "",
      practiceCount || subCount
        ? "已参与 AI 实训 " + practiceCount + " 次、提交作品 " + subCount + " 份，建议继续保持实训频次，AI 反馈中的改进项需在下一次任务中闭环。"
        : "尚未参与 AI 实训与作品提交，建议从情景对话场景入手，先完成 1 至 2 个场景的对话训练。",
    ].filter(Boolean);

    return {
      learner: learner,
      cls: ZK.db.find("classes", learner.classId),
      generatedAt: Date.now(),
      mastery: mastery,
      completion: completion,
      clsMastery: clsMastery,
      clsCompletion: clsCompletion,
      rank: rank,
      classSize: ZK.db.list("learners", (l) => l.classId === learner.classId).length,
      level: level,
      persona: persona,
      traits: traits,
      weak: weak,
      strong: strong,
      readRate: readRate,
      avgDuration: avgDuration,
      attemptAvg: attemptAvg,
      practiceCount: practiceCount,
      subCount: subCount,
      suggestion: suggestion,
      radar: byKp.map((k) => ({ name: k.name, value: k.mastery, completion: k.completion })),
      riskLevel: rl,
    };
  }

  /** 班级画像（教师视角的整体画像） */
  function classProfile(classId) {
    const a = classAnalytics(classId);
    const learners = ZK.db.list("learners", (l) => l.classId === classId);
    const recs = ZK.db.list("learningRecords", (r) => r.classId === classId);

    const tiers = { A: 0, B: 0, C: 0 };
    learners.forEach((l) => (tiers[l.level] = (tiers[l.level] || 0) + 1));

    const low = a.kpStats.filter((k) => k.avgMastery < 70);
    const high = a.kpStats.filter((k) => k.avgMastery >= 82);

    return {
      cls: a.cls,
      generatedAt: Date.now(),
      overall: a.overall,
      kpStats: a.kpStats,
      distribution: a.distribution,
      weakKps: a.weakKps,
      strongKps: a.strongKps,
      chapterTrend: a.chapterTrend,
      tiers: tiers,
      learnerCount: learners.length,
      riskLearners: learners.filter((l) => l.riskScore >= 40).length,
      activeLearners: learners.filter((l) => Date.now() - l.lastActive < 86400000 * 3).length,
      narrative:
        "本班共 " +
        learners.length +
        " 名学生，知识点平均完成率 " +
        a.overall.avgCompletion +
        "%，平均掌握率 " +
        a.overall.avgMastery +
        "%。" +
        (low.length
          ? "掌握率低于 70% 的知识点有 " +
            low.length +
            " 个（" +
            low.map((k) => k.name).join("、") +
            "），主要集中在第 " +
            Array.from(new Set(low.map((k) => k.chapter))).join("、") +
            " 章，建议在下次课安排针对性讲解并调整作业难度。"
          : "各知识点掌握率均在 70% 以上，整体掌握情况良好。") +
        (high.length
          ? "掌握率超过 82% 的知识点有 " +
            high.length +
            " 个（" +
            high.map((k) => k.name).join("、") +
            "），可作为课堂案例教学与同伴互评的切入点。"
          : "") +
        "资料阅读方面，课程资料人均阅读 " +
        a.overall.avgReadPerCapita +
        " 项，需关注阅读完成率偏低的知识点。分层方面，A 层 " +
        tiers.A +
        " 人、B 层 " +
        tiers.B +
        " 人、C 层 " +
        tiers.C +
        " 人，建议对 C 层学生按个性化学习路径推送补强任务。",
      focus: low.map((k) => ({
        name: k.name,
        chapter: k.chapter,
        mastery: k.avgMastery,
        lowCount: k.lowCount,
        action:
          "第 " +
          k.chapter +
          " 章配套资源 " +
          k.resourceCount +
          " 项、资料 " +
          k.materialCount +
          " 份，人均阅读 " +
          k.readPerCapita +
          " 份；建议补充 " +
          (k.avgMastery < 62 ? "基础讲解与范例演示" : "综合练习与对照评析") +
          "，并对 " +
          k.lowCount +
          " 名学生推送专项补强任务。",
      })),
      records: recs.length,
    };
  }

  /* =====================================================================
     六、统计辅助
     ===================================================================== */

  function kbStats(kbId) {
    const kb = ZK.db.find("knowledgeBases", kbId);
    if (!kb) return null;
    const docs = ZK.db.list("kbDocs", (d) => d.kbId === kbId);
    const frags = ZK.db.list("kbFragments", (f) => f.kbId === kbId);
    const idx = buildIndex(kbId);
    const logs = ZK.db.list("retrievalLogs", (l) => l.kbId === kbId);
    return {
      kb: kb,
      docs: docs.length,
      fragments: frags.length,
      chunks: idx.chunks.length,
      tokens: U.sum(docs.map((d) => d.tokens || 0)),
      chars: U.sum(docs.map((d) => d.words || 0)),
      queries: logs.length,
      avgLatency: logs.length ? U.round(U.avg(logs.map((l) => l.latency)), 0) : 0,
      avgHits: logs.length ? U.round(U.avg(logs.map((l) => l.hits)), 1) : 0,
      docList: docs,
      fragList: frags,
    };
  }

  function overview() {
    const d = ZK.db;
    const learners = d.list("learners");
    const posts = d.list("posts");
    const risk = userRisk();
    const submissions = d.list("submissions");
    const reviewed = submissions.filter((s) => s.aiReview);
    return {
      kbs: d.list("knowledgeBases").length,
      books: d.list("libraryBooks").length,
      resources: d.list("resources").length,
      docs: d.list("kbDocs").length,
      learners: learners.length,
      classes: d.list("classes").length,
      scenes: d.list("scenes").length,
      sessions: d.list("practiceSessions").length,
      tasks: d.list("tasks").length,
      submissions: submissions.length,
      reviewed: reviewed.length,
      avgSubmissionScore: reviewed.length ? U.round(U.avg(reviewed.map((s) => s.aiReview.overall)), 1) : 0,
      literature: d.list("literature").length,
      kps: d.list("knowledgePoints").length,
      posts: posts.length,
      spamPosts: posts.filter((p) => p.isSpam).length,
      riskyUsers: risk.summary.riskyUsers,
      safetyScore: U.clamp(100 - risk.summary.spamRate * 2.6, 40, 100),
      graphNodes: d.list("graphNodes").length,
      graphEdges: d.list("graphEdges").length,
    };
  }

  ZK.engine = {
    splitKeep, chunkText, buildIndex, retrieve, composeAnswer,
    blocksToText, reviewSubmission, structureMarkers,
    parseLiterature, buildQuiz, buildMindmap, summarize, answerFromLiterature,
    scanText, scanVideo, userRisk, markHits, LEVEL_WEIGHT,
    classAnalytics, learningPath, studentProfile, classProfile,
    kbStats, overview,
  };
})();
