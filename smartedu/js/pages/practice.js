/* ==========================================================================
   页面 · AI实践（实训场景 / 情景对话 / 图片智能评分 / 实训记录）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;
  const go = (hash) => (location.hash = hash);

  /* =====================================================================
     场景对话流程定义（判定规则 + 对方应答）
     ===================================================================== */
  const SCENE_FLOW = {
    sc_001: {
      steps: [
        {
          id: "s1", name: "确认规格与数量",
          detect: ["wifi", "wi-fi", "specification", "spec", "model", "standard", "unit", "规格", "型号", "2000", "2,000"],
          ai: "Wi-Fi version, and the 2,000 units stand. But USD 42.00 is well above what I'm paying now. My other quote is USD 38.50. I need you to move closer to that number.",
          probe: "Before we talk numbers, I need to know exactly what I'm buying. Which model are we discussing, and can you confirm 2,000 units is the quantity you'd quote on?",
        },
        {
          id: "s2", name: "给出正式报价",
          detect: ["usd", "price", "fob", "报价", "per unit", "quote", "quotation"],
          ai: "Alright, that's a clear number. But you'll understand I can't sign anything on price alone. What are your payment terms, and how long is the lead time?",
          probe: "Let's put a number on the table. What is your unit price, on what trade term, and how long is that price valid?",
        },
        {
          id: "s3", name: "回应竞争报价",
          detect: ["38.50", "competitor", "cost", "below", "margin", "compare", "成本", "毛利", "不可比", "scope"],
          ai: "Fair point about the scope, but I still have a budget. Give me something concrete I can take to my board.",
          probe: "USD 38.50 is what I have in hand. I'd like to hear how you justify your price against it — the specification, the warranty, the service package, anything.",
        },
        {
          id: "s4", name: "分层报价与条件交换",
          detect: ["tier", "tiered", "if you", "3000", "3,000", "discount", "offer", "阶梯", "折", "交换", "if you can"],
          ai: "Interesting. The 3,000-unit price is closer. But I can't commit to 3,000 without knowing your lead time and payment terms.",
          probe: "I need options, not a single take-it-or-leave-it price. Can you structure something that gives me a path to a better number?",
        },
        {
          id: "s5", name: "交期与付款条件",
          detect: ["lead time", "days", "deposit", "t/t", "payment", "balance", "bill of lading", "交期", "预付", "付款"],
          ai: "40% is more than I'd like. I can do 35%. If you accept that, we have a deal on 3,000 units.",
          probe: "Price is only half the picture. What's your lead time, and what payment terms are you asking for?",
        },
        {
          id: "s6", name: "约定下一步动作",
          detect: ["proforma", "confirm", "invoice", "send", "deadline", "next step", "by the end of", "回签", "确认"],
          ai: "Then let's close this properly. Send me the revised proforma invoice today and I'll get it signed. One more thing — I'll need the warranty terms in writing before I release the deposit.",
        },
      ],
      closing:
        "Good. We're aligned on 3,000 units, USD 39.20 FOB Shanghai, 35% deposit, 35-day lead time. Send the documents and we'll proceed. I appreciate you working through the numbers with me rather than just repeating your list price.",
      fallback: [
        "I'm not sure that answers what I asked. Can you be more specific?",
        "Let me put it plainly — I need concrete terms, not general assurances.",
        "That's not quite what I'm after. Try again, and be specific this time.",
      ],
    },
    sc_002: {
      steps: [
        {
          id: "s1", name: "陈述事实与时间线",
          detect: ["typhoon", "force majeure", "factory", "stopped", "dated", "台风", "停产", "复工", "不可抗力", "自"],
          ai: "I accept the typhoon is beyond your control. But 'as soon as possible' is not a plan. My production line starts on the 15th. I need dates and I need to know who pays for the air freight if we run out of stock.",
          probe: "Before we discuss remedies, I want the facts: what happened, on what dates, and how many days did it cost you?",
        },
        {
          id: "s2", name: "引用合同条款",
          detect: ["clause", "article", "section", "penalty", "clause 5", "clause 7", "条款", "第"],
          ai: "You're right that Clause 5 gives you an extension. But the penalty clause still stands separately, and my downstream losses are real. What do you propose?",
          probe: "Let's ground this in the contract. Which clause are you relying on, and what does it actually say about extension of time?",
        },
        {
          id: "s3", name: "提出补救方案",
          detect: ["partial", "60%", "air freight", "split", "shipment", "deliver", "分批", "空运", "首批"],
          ai: "Splitting the shipment helps, but 60% on the 12th still leaves a gap. And air freight is not cheap. Who bears it?",
          probe: "I need a remedy, not an apology. What can you actually put on a vessel, and when?",
        },
        {
          id: "s4", name: "费用分担方案",
          detect: ["share", "bear", "50%", "cost", "we will cover", "分担", "承担", "费用"],
          ai: "Fifty-fifty on air freight is a starting point, but that's separate from the penalty clause. And I want the 60% commitment written into an amendment.",
          probe: "Someone has to pay for the expedited freight. What are you offering on that?",
        },
        {
          id: "s5", name: "责任边界说明",
          detect: ["liability", "cap", "not exceed", "excluding", "limit", "责任", "上限", "不承担"],
          ai: "I can accept a liability cap in principle, but I won't waive the penalty for the days that fall outside the force majeure window. The extension covers eleven days, not twelve.",
          probe: "Where do you draw the line on responsibility? Be precise about what you accept and what you don't.",
        },
        {
          id: "s6", name: "维护合作关系",
          detect: ["long-term", "long term", "partnership", "appreciate", "relationship", "priority", "next order", "长期", "合作", "优先", "下一批"],
          ai: "That means a lot, and frankly it's the reason I'm still at the table. Put the amendment in writing today and let's move on. I'd rather invest this energy in the next order than in a claim.",
        },
      ],
      closing:
        "All right. Sixty percent on the 12th, the balance by the 25th, air freight shared equally, and the extension documented in an amendment. I'll hold the claim in abeyance pending delivery. Let's make sure the next shipment doesn't need this conversation.",
      fallback: [
        "That doesn't address what I asked. Be more specific, please.",
        "I need substance, not reassurance. Try again.",
        "You're not answering the question. What exactly are you proposing?",
      ],
    },
    sc_003: {
      steps: [
        {
          id: "s1", name: "介绍情境与任务",
          detect: ["project", "role", "task", "situation", "i led", "i managed", "项目", "负责"],
          ai: "Understood. Now the part I actually care about — what did you change in how you work because of that mistake?",
          probe: "Start with the situation and your specific role. What was the project, and what were you accountable for?",
        },
        {
          id: "s2", name: "说明行动与结果",
          detect: ["action", "i did", "result", "reduced", "improved", "increased", "%", "结果", "提升", "降低"],
          ai: "Numbers. Good. But 'improved coordination' — what did that mean in practice? Give me the mechanism, not the outcome.",
          probe: "And the outcome? I want figures, not adjectives. What changed, and by how much?",
        },
        {
          id: "s3", name: "回应质疑与追问",
          detect: ["because", "the reason", "actually", "to be precise", "data", "metric", "原因", "数据"],
          ai: "That's a better answer. Now tell me how you handle disagreement. In this company people will contradict you in the room, not behind your back. Does that work for you?",
          probe: "I'm not convinced yet. Justify that choice — why that approach and not the obvious alternative?",
        },
        {
          id: "s4", name: "跨文化协作经验",
          detect: ["cross-border", "cross border", "german", "feedback", "direct", "adapt", "culture", "跨文化", "直接反馈", "适应"],
          ai: "Good — you've thought about it rather than just endured it. Last thing: what's your question for me? And make it a real one, not a formality.",
          probe: "Have you actually worked with people who give feedback differently from what you're used to? Give me an example.",
        },
        {
          id: "s5", name: "提出反向问题",
          detect: ["may i ask", "could you", "what do you", "how do you", "question", "想了解", "请问"],
          ai: "Fair question, and a good one. The team you'd join has four nationalities and the last two hires both said the same thing you just did — they underestimated how much time we spend on written communication. I'll come back to you by Friday.",
        },
      ],
      closing:
        "Thank you. Structured answers, real numbers, and you didn't dodge the question about your own mistake. That's what I was testing. You'll hear from me by Friday.",
      fallback: [
        "You're drifting. Answer the question I asked.",
        "That's vague. I want specifics — what did you personally do?",
        "Try again, and be direct. Vagueness reads as evasion here.",
      ],
    },
    sc_004: {
      steps: [
        {
          id: "s1", name: "承认问题与责任",
          detect: ["acknowledge", "my responsibility", "i take", "responsibility", "my fault", "承认", "责任", "我的"],
          ai: "I appreciate you not blaming the translators. Now tell me why it happened — and 'human error' isn't an answer.",
          probe: "Start by telling me plainly what went wrong and who owns it.",
        },
        {
          id: "s2", name: "定位流程原因",
          detect: ["glossary", "termbase", "no glossary", "three translators", "no check", "workflow", "no process", "术语库", "流程", "没有"],
          ai: "So there was no single source of truth and no check gate. That's a process failure, and it's on the project lead. What's the fix?",
          probe: "Why did three translators produce five variants? Walk me through the process that allowed it.",
        },
        {
          id: "s3", name: "统一术语标准",
          detect: ["termbase", "fix", "lock", "standard", "unify", "single source", "锁定", "统一", "术语库"],
          ai: "Locked terms, one source. Good. How long to bring the whole document into line, and who does it?",
          probe: "Concretely — how will you guarantee one term, one translation, for the rest of this document?",
        },
        {
          id: "s4", name: "返工安排与时间表",
          detect: ["rework", "hours", "days", "by", "timeline", "assign", "返工", "小时内", "日内"],
          ai: "Two days with two people is acceptable. And the amounts? Don't tell me the amounts are fine — show me what you'll actually change.",
          probe: "I want a schedule. Who, what, by when.",
        },
        {
          id: "s5", name: "质控流程改进",
          detect: ["qa", "script", "check", "two-stage", "prevent", "recheck", "复核", "检查", "预防", "脚本"],
          ai: "That's the answer I was looking for. Put the consistency check in the delivery checklist and make it non-optional. If the next project arrives without it, I'll reject it and we'll have this conversation again.",
        },
      ],
      closing:
        "Fine. Rework by Thursday, termbase locked, consistency check added to the delivery gate. I'll verify on Friday. You handled this better than the last project lead did — just make sure I don't have to check twice.",
      fallback: [
        "That's deflection. Answer the question.",
        "I don't want process language, I want specifics. Try again.",
        "You're not giving me what I asked for. Once more.",
      ],
    },
  };

  /* =====================================================================
     对话评分引擎（基于学生实际发言计算）
     ===================================================================== */
  ZK.engine.reviewPractice = function (scene, flow, messages) {
    const meMsgs = messages.filter((m) => m.role === "me");
    const text = meMsgs.map((m) => m.text).join("\n");
    const lower = text.toLowerCase();
    const covered = flow.steps.filter((s) => s.detect.some((d) => lower.indexOf(String(d).toLowerCase()) >= 0));
    const missing = flow.steps.filter((s) => covered.indexOf(s) < 0);

    /* 图片使用情况：参与轮次与总张数 */
    const imgMsgs = meMsgs.filter((m) => m.images && m.images.length);
    const totalImgs = imgMsgs.reduce((a, m) => a + m.images.length, 0);

    const coverage = flow.steps.length ? covered.length / flow.steps.length : 0;
    const avgLen = meMsgs.length ? text.replace(/\s/g, "").length / meMsgs.length : 0;
    const turnsRatio = meMsgs.length ? Math.min(1.4, flow.steps.length / Math.max(1, meMsgs.length)) : 0;

    // 语言质量：英文占比、礼貌/专业标记
    const latinChars = (text.match(/[A-Za-z]/g) || []).length;
    const totalChars = text.replace(/\s/g, "").length || 1;
    const englishRatio = latinChars / totalChars;
    const politeness = [
      /i appreciate|thank you|we appreciate|i understand|i'm sorry|we regret|please|would you|could you/i,
      /however|nevertheless|that said|on the other hand|while|although/i,
      /we are prepared|we can offer|would it be possible|subject to|provided that/i,
    ].filter((r) => r.test(text)).length;

    // 策略：条件交换（if … we …）
    const conditional = (/if\s+[^.,;]{3,60},?\s*(we|i)\s/i.test(text) ? 1 : 0) +
      (/if you can|if you accept|if you confirm|provided that|subject to your/i.test(text) ? 1 : 0);
    // 无条件让步（风险）
    const unconditional = (/we accept|we agree|no problem|whatever you|as you wish/i.test(text) ? 1 : 0);

    const dims = scene.rubric.map((r, i) => {
      let ratio;
      if (i === 0) ratio = 0.3 + coverage * 0.66;
      else if (i === 1) ratio = 0.34 + Math.min(1, conditional / 2) * 0.36 + Math.min(1, turnsRatio) * 0.22 - unconditional * 0.1;
      else if (i === 2) ratio = 0.36 + U.clamp(englishRatio / 0.45, 0, 1) * 0.3 + (politeness / 3) * 0.26;
      else ratio = 0.34 + U.clamp(turnsRatio, 0, 1) * 0.4 + Math.min(1, avgLen / 90) * 0.2;
      if (i === 3 && totalImgs) ratio = U.clamp(ratio + Math.min(0.08, totalImgs * 0.03), 0.2, 0.98);
      ratio = U.clamp(ratio, 0.2, 0.98);
      const score = Number((r.weight * ratio).toFixed(1));
      return { name: r.name, weight: r.weight, score: score, ratio: Number(ratio.toFixed(3)), desc: r.desc };
    });

    const overall = Number(U.sum(dims.map((d) => d.score)).toFixed(1));

    const advice = [];
    if (missing.length) {
      advice.push(
        "本轮对话有 " +
          missing.length +
          " 个关键环节未覆盖：" +
          missing.map((m) => "「" + m.name + "」").join("、") +
          "。这些环节直接对应评分标准中的信息完整度要求，下一轮请主动推进，不要等待对方追问。"
      );
    } else {
      advice.push("六个关键环节全部覆盖：确认需求、给出报价、回应竞争、条件交换、交期付款、约定下一步。节奏完整，这是本次对话的主要得分来源。");
    }
    if (conditional < 2) {
      advice.push(
        "条件交换的表述偏少（当前仅 " +
          conditional +
          " 处）。谈判中让步应当附带条件，建议使用 “If you can …, we can …” 或 “We can offer …, provided that …” 的句式，把单向让价改为双向交换。"
      );
    } else {
      advice.push("条件交换用了 " + conditional + " 处，让步与对价绑定清晰，符合商务谈判的交换逻辑。");
    }
    if (unconditional) {
      advice.push("检测到无条件让步式表述（如 we accept / no problem）。此类表述会让对方持续加大压力，建议改为附加条件或限定范围后再让步。");
    }
    if (englishRatio < 0.3) {
      advice.push("英文表达占比约 " + U.round(englishRatio * 100) + "%，本场景要求全英文应答。建议先用中文理清要点，再转为英文表述，避免中英混用影响语域一致性。");
    } else {
      advice.push("英文表达占比 " + U.round(englishRatio * 100) + "%，语域保持稳定。下一步可注意礼貌层级的层次化：常规请求用缓和式，敏感事项（催款、拒收、索赔）用间接式。");
    }
    if (avgLen < 45) {
      advice.push("单轮平均 " + U.round(avgLen) + " 字，表述偏简。商务谈判中单轮回应建议包含「回应对方关切 + 说明我方立场 + 提出具体方案」三层，篇幅约 60-120 字为宜。");
    }
    if (totalImgs) {
      advice.push("本次对话有 " + totalImgs + " 张图片参与（覆盖 " + imgMsgs.length + " 轮）。图文配合增强了表达的直观性与说服力，已在「推进效率」维度计入加分；建议进一步用文字点明每张图所指向的具体诉求或数据，避免对方误读。");
    } else {
      advice.push("全程未使用图片。若场景涉及产品样图、函件截图或数据图表，适当附图可让对方更快理解要点，建议后续尝试图文配合的方式。");
    }

    return {
      at: Date.now(),
      overall: overall,
      dims: dims,
      advice: advice,
      covered: covered.map((c) => c.name),
      missing: missing.map((c) => c.name),
      metrics: {
        turns: meMsgs.length,
        avgLen: U.round(avgLen),
        englishRatio: U.round(englishRatio, 3),
        politeness: politeness,
        conditional: conditional,
        unconditional: unconditional,
        coverage: U.round(coverage, 3),
        images: totalImgs,
        imageTurns: imgMsgs.length,
      },
    };
  };

  /* ============================ 实训场景 ============================ */
  P["practice/scenes"] = {
    render(root) {
      const host = h("div");

      function paint() {
        U.clear(host);
        const scenes = ZK.db.list("scenes");
        const sessions = ZK.db.list("practiceSessions");

        host.appendChild(
          ZK.ui.pageHead({
            title: "AI 实训场景",
            sub: "教师可创设虚拟场景，由 AI 扮演指定角色与学生进行多轮对话。场景设定包含角色人设、情境背景、训练目标与评分标准。",
            actions: [
              h("button", { class: "btn btn-sm", text: "实训记录", onclick: () => go("#/practice/records") }),
              h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.plus(14) + "<span>创设新场景</span>", onclick: openCreate }),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-4 mb-16" }, [
            ZK.ui.statCard({ label: "已发布场景", value: String(scenes.filter((s) => s.published).length), target: scenes.length + " 个场景", icon: ZK.icons.messages(18), tone: "emerald", progress: (scenes.filter((s) => s.published).length / scenes.length) * 100 }),
            ZK.ui.statCard({ label: "累计实训人次", value: String(sessions.length), target: "含进行中", icon: ZK.icons.users(18), tone: "blue", progress: Math.min(100, sessions.length * 4) }),
            ZK.ui.statCard({ label: "平均得分", value: U.round(U.avg(sessions.filter((s) => s.score).map((s) => s.score)), 1) + " 分", target: "满分 100", icon: ZK.icons.award(18), tone: "amber", progress: U.avg(sessions.filter((s) => s.score).map((s) => s.score)) }),
            ZK.ui.statCard({ label: "场景均轮次", value: U.round(U.avg(scenes.map((s) => s.turnsExpected)), 1) + " 轮", target: "预期交互轮次", icon: ZK.icons.message(18), tone: "violet", progress: 60 }),
          ])
        );

        host.appendChild(
          h("div", { class: "grid grid-2" }, scenes.map((sc) =>
            ZK.ui.card({
              class: "card-hover",
              title: sc.name,
              sub: sc.course + " · " + sc.type + " · 难度 " + sc.difficulty + " · 预期 " + sc.turnsExpected + " 轮",
              icon: ZK.icons.messages(16),
              actions: [
                sc.published ? ZK.ui.badge("已发布", "emerald") : ZK.ui.badge("草稿", "gray"),
                ZK.ui.badge("权重 " + sc.gradeWeight + "%", "violet"),
              ],
              body: [
                h("div", { class: "stack-12" }, [
                  h("div", { style: { background: "rgba(31,41,55,0.45)", "border-radius": "10px", padding: "11px 13px" } }, [
                    h("div", { class: "fs-11 em mb-4", text: "AI 角色设定" }),
                    h("div", { class: "fs-12 muted", style: { "line-height": "1.7" }, text: sc.persona }),
                  ]),
                  h("div", {}, [
                    h("div", { class: "fs-11 ghost mb-4", text: "情境背景" }),
                    h("div", { class: "fs-12 muted clamp-3", style: { "line-height": "1.7" }, text: sc.background }),
                  ]),
                  h("div", {}, [
                    h("div", { class: "fs-11 ghost mb-4", text: "训练目标" }),
                    h("div", { class: "fs-12 muted", style: { "line-height": "1.7" }, text: sc.objective }),
                  ]),
                  h("div", {}, [
                    h("div", { class: "fs-11 ghost mb-8", text: "评分标准" }),
                    h("div", { class: "stack-8" }, sc.rubric.map((r) => ZK.ui.progressLine(r.weight * 3, "emerald", r.weight + "%"))),
                    h("div", { class: "fs-11 ghost mt-8", text: sc.rubric.map((r) => r.name).join(" / ") }),
                  ]),
                ]),
                h("div", { class: "divider" }),
                h("div", { class: "row-between" }, [
                  h("span", { class: "fs-12 faint", text: "已实训 " + sessions.filter((s) => s.sceneId === sc.id).length + " 人次 · 平均 " + sc.avgScore + " 分" }),
                  h("div", { class: "row", style: { gap: "6px" } }, [
                    h("button", { class: "btn btn-sm", text: "预览开场", onclick: () => ZK.modal({ title: sc.name, sub: "AI 角色：" + sc.persona, render(api) { api.body.appendChild(h("div", { class: "chat-stream", style: { padding: "0" } }, [h("div", { class: "chat-msg" }, [h("div", { class: "cm-avatar ai", text: "AI" }), h("div", { class: "chat-bubble", text: sc.opening })])])); } }) }),
                    h("button", { class: "btn btn-sm btn-primary", text: "进入实训", onclick: () => go("#/practice/session/" + sc.id) }),
                  ]),
                ]),
              ],
            })
          ))
        );
      }

      function openCreate() {
        const name = h("input", { class: "input", placeholder: "例如：外贸索赔谈判：质量问题争议" });
        const course = h("select", { class: "select" }, ZK.db.list("courses").map((c) => h("option", { value: c.id, text: c.name })));
        const type = h("select", { class: "select" }, ["商务沟通", "争议处理", "跨文化沟通", "项目管理", "面试场景", "客户服务"].map((t) => h("option", { text: t })));
        const difficulty = h("select", { class: "select" }, ["简单", "中等", "困难"].map((t) => h("option", { selected: t === "中等", text: t })));
        const turns = h("input", { class: "input", type: "number", min: "3", max: "12", value: "5" });
        const persona = h("textarea", { class: "textarea", placeholder: "描述 AI 扮演的角色：国籍、职位、性格、关注点、决策权限" });
        const background = h("textarea", { class: "textarea", placeholder: "情境背景：学生身份、业务背景、已有条件与约束" });
        const objective = h("textarea", { class: "textarea", placeholder: "训练目标：学生需要在几轮内完成哪些动作" });
        const opening = h("textarea", { class: "textarea", placeholder: "AI 的开场白（建议使用全英文，符合角色语域）" });
        const rubricRows = h("div", { class: "stack-8" });
        let rid = 0;

        function addRule(n, w, d) {
          rid += 1;
          const row = h("div", { class: "row", style: { gap: "8px" } }, [
            h("input", { class: "input", placeholder: "维度名称", value: n || "", style: { flex: "0 0 150px" } }),
            h("input", { class: "input", type: "number", min: "5", max: "60", value: String(w || 25), style: { flex: "0 0 80px" } }),
            h("input", { class: "input", placeholder: "评分要点说明", value: d || "", style: { flex: "1" } }),
            h("button", { class: "btn btn-xs btn-danger", html: ZK.icons.trash(12), onclick: () => row.remove() }),
          ]);
          rubricRows.appendChild(row);
        }
        addRule("信息准确", 30, "关键信息表述准确，无遗漏与偏离");
        addRule("谈判策略", 30, "条件交换与让步节奏合理");
        addRule("语言得体", 25, "语域与礼貌层级恰当");
        addRule("推进效率", 15, "在限定轮次内推动达成共识");

        ZK.modal({
          title: "创设 AI 实训场景",
          sub: "场景发布后学生可进入对话实训，AI 将按评分标准对学生的每一次反应进行打分",
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                h("div", { class: "form-grid" }, [
                  h("div", { class: "field span-full" }, [h("label", { class: "label" }, ["场景名称", h("span", { class: "req", text: "*" })]), name]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "所属课程" }), course]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "场景类型" }), type]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "难度" }), difficulty]),
                  h("div", { class: "field" }, [h("label", { class: "label", text: "预期交互轮次" }), turns]),
                ]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "AI 角色设定" }), persona]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "情境背景" }), background]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "训练目标" }), objective]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "AI 开场白" }), opening]),
                h("div", { class: "field" }, [
                  h("label", { class: "label", text: "评分标准" }),
                  rubricRows,
                  h("button", { class: "btn btn-sm mt-8", html: ZK.icons.plus(13) + "<span>添加维度</span>", onclick: () => addRule() }),
                ]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary", text: "创建场景",
                onclick() {
                  if (!name.value.trim() || !persona.value.trim() || !opening.value.trim()) {
                    ZK.toast("场景名称、AI 角色设定与开场白为必填项", "err");
                    return;
                  }
                  const rules = Array.prototype.slice.call(rubricRows.children).map((row) => {
                    const ins = row.querySelectorAll("input");
                    return { name: ins[0].value || "未命名维度", weight: Number(ins[1].value) || 20, desc: ins[2].value || "" };
                  });
                  const sum = U.sum(rules.map((r) => r.weight));
                  if (Math.abs(sum - 100) > 0.01) {
                    ZK.toast("评分标准权重之和应为 100，当前为 " + sum, "err");
                    return;
                  }
                  const c = ZK.db.find("courses", course.value) || {};
                  const u = ZK.db.currentUser();
                  const sc = ZK.db.insert("scenes", {
                    name: name.value.trim(), courseId: course.value, course: c.name || "",
                    type: type.value, difficulty: difficulty.value, duration: Number(turns.value) * 4,
                    persona: persona.value.trim(), background: background.value.trim(),
                    objective: objective.value.trim(), opening: opening.value.trim(),
                    rubric: rules, turnsExpected: Number(turns.value), createdAt: Date.now(),
                    published: true, playCount: 0, avgScore: 0, ownerId: u.id, owner: u.name,
                    classes: ZK.db.list("classes", (x) => x.courseId === course.value).map((x) => x.id),
                    gradeWeight: 10,
                  });
                  ZK.db.log("创设实训场景", "新建场景《" + sc.name + "》，评分维度 " + rules.length + " 项");

                  // 为新场景生成默认对话流程，保证可立即实训
                  SCENE_FLOW[sc.id] = {
                    steps: [
                      { id: "g1", name: "了解对方诉求", detect: ["hello", "thank", "understand", "i see", "we note", "了解", "明白"], ai: "That's noted. But I need something more concrete from you — what exactly can you offer on this?", probe: "Let's start properly. What's your understanding of the situation and what do you propose?" },
                      { id: "g2", name: "提出具体方案", detect: ["we can", "we will", "we propose", "offer", "we are prepared", "方案", "可以"], ai: "That's a step forward. What's the trade-off on your side — what do you need from me in return?", probe: "Give me a specific proposal with numbers and dates, not a general position." },
                      { id: "g3", name: "交换条件", detect: ["if you", "provided that", "subject to", "in return", "条件", "作为对价"], ai: "Acceptable in principle. Let me take it back to my team.", probe: "And what do you want in return? A concession without a condition isn't a negotiation." },
                      { id: "g4", name: "确认与收尾", detect: ["confirm", "in writing", "by", "next step", "确认", "书面"], ai: "Then let's put it in writing. I'll revert within two working days." },
                    ],
                    closing: "Understood. Let's document this and proceed. Thank you for engaging with the substance rather than just restating your position.",
                    fallback: ["That doesn't move us forward. Be specific.", "I need substance, not generalities. Try again.", "You're not addressing what I asked. Once more, please."],
                  };
                  ZK.toast("场景已创建，可立即进入实训");
                  api.close();
                  paint();
                },
              }),
            ]);
          },
        });
      }

      root.appendChild(host);
      paint();
    },
  };

  /* ============================ 情景对话实训 ============================ */
  P["practice/session"] = {
    render(root, param) {
      const host = h("div");
      let sceneId = param || (ZK.db.list("scenes")[0] || {}).id;
      let messages = [];
      let reviewing = false;
      let result = null;
      let learnerId = null;
      /* 侧栏重绘入口：由 renderChat 在每轮对话后调用 */
      let paintSide = function () {};

      function paint() {
        U.clear(host);
        const sc = ZK.db.find("scenes", sceneId);
        const flow = SCENE_FLOW[sceneId] || SCENE_FLOW.sc_001;
        const learners = ZK.db.list("learners");

        /* 侧栏容器：对话每推进一步都要重绘，才能让「本轮实时评估」跟着更新 */
        const sideHost = h("div", { class: "stack-16" });
        paintSide = function () {
          U.clear(sideHost);
          sideHost.appendChild(renderSide(sc, flow));
        };
        paintSide();

        host.appendChild(
          ZK.ui.pageHead({
            title: "情景对话实训",
            sub: "AI 按场景设定扮演指定角色与学生进行生-机交互，逐轮评价学生反应，对话结束后给出维度打分与优化建议。",
            actions: [
              h("select", { class: "select", style: { width: "220px" }, onchange: (e) => { sceneId = e.target.value; messages = []; result = null; paint(); } },
                ZK.db.list("scenes").map((s) => h("option", { value: s.id, selected: s.id === sceneId, text: s.name }))),
              h("select", {
                class: "select", style: { width: "180px" }, onchange: (e) => (learnerId = e.target.value || null),
              }, [h("option", { value: "", text: "以教师视角体验" })].concat(
                learners.slice(0, 12).map((l) => h("option", { value: l.id, selected: l.id === learnerId, text: l.name + "（" + l.sno + "）" }))
              )),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-3" }, [
            h("div", { class: "span-2" }, [renderChat(sc, flow)]),
            sideHost,
          ])
        );
      }

      function renderChat(sc, flow) {
        const stream = h("div", { class: "chat-stream" });
        const input = h("textarea", {
          class: "textarea",
          placeholder: "输入你的回应，或点击回形针上传图片（产品图、函件截图、数据图表等）一并发送。建议：先回应对方关切，再说明我方立场，最后提出具体方案（条件交换）。",
          disabled: reviewing,
        });
        /* 当前草稿待发送的图片（data URL 列表），发送后清空 */
        let draftImgs = [];
        const fileInput = h("input", { type: "file", accept: "image/*", multiple: true, style: { display: "none" } });
        const attachBtn = h("button", {
          class: "btn-attach",
          title: "上传图片",
          html: ZK.icons.image(18),
          onclick: () => fileInput.click(),
        });
        const attachBox = h("div", { class: "attach-grid" });

        function renderAttach() {
          U.clear(attachBox);
          attachBtn.classList.toggle("has-img", draftImgs.length > 0);
          draftImgs.forEach((it, i) =>
            attachBox.appendChild(
              h("div", { class: "attach-thumb" }, [
                h("img", { src: it.url }),
                h("span", { class: "sz", text: it.w + "×" + it.h }),
                h("button", {
                  class: "rm", text: "×", title: "移除",
                  onclick() {
                    draftImgs.splice(i, 1);
                    renderAttach();
                  },
                }),
              ])
            )
          );
        }

        fileInput.addEventListener("change", (e) => {
          Array.prototype.forEach.call(e.target.files || [], (f) => pickImage(f));
          e.target.value = "";
        });

        function pickImage(file) {
          if (!file || !/^image\//.test(file.type)) {
            ZK.toast("请选择图片文件", "err");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              const metrics = imageMetrics(img);
              draftImgs.push({ url: reader.result, name: file.name, w: img.naturalWidth, h: img.naturalHeight, file: file, metrics: metrics });
              renderAttach();
            };
            img.onerror = () => ZK.toast("图片解析失败，请更换文件", "err");
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        }

        function paintStream() {
          U.clear(stream);
          if (!messages.length) {
            stream.appendChild(
              h("div", { class: "empty", style: { padding: "28px 20px" } }, [
                h("div", { class: "empty-icon", html: ZK.icons.messages(20) }),
                h("b", { text: "点击「开始实训」进入对话" }),
                h("p", { text: "AI 将扮演以下角色与你对话：" + sc.persona }),
              ])
            );
          }
          messages.forEach((m) => {
            const isMe = m.role === "me";
            stream.appendChild(
              h("div", { class: "chat-msg" + (isMe ? " me" : "") }, [
                h("div", { class: "cm-avatar " + (isMe ? "me" : "ai"), text: isMe ? "学" : "AI" }),
                h("div", { style: { "min-width": "0", flex: "1" } }, [
                  h("div", { class: "chat-bubble" }, [
                    h("div", { class: "cb-name", text: isMe ? "学生" : "AI 角色 · " + sc.persona.split("（")[0] }),
                    h("div", { style: { "white-space": "pre-wrap" }, text: m.text || "" }),
                    m.images && m.images.length
                      ? h("div", {}, m.images.map((im) =>
                          h("img", {
                            class: "chat-img", src: im.url, alt: im.name || "图片",
                            onclick: () => ZK.modal({ title: im.name || "图片预览", sub: im.w + " × " + im.h + " px", render(api) { api.body.appendChild(h("div", { style: { "text-align": "center" } }, [h("img", { src: im.url, style: { "max-width": "100%", "border-radius": "10px" } })])); } }),
                          })
                        ))
                      : null,
                    m.images && m.images.length && isMe
                      ? h("div", { class: "img-tag", html: ZK.icons.image(12) + "<span>附 " + m.images.length + " 张图片</span>" })
                      : null,
                  ]),
                  m.tips && m.tips.length
                    ? h("div", { class: "mt-8", style: { display: "flex", "flex-direction": "column", gap: "6px" } },
                        m.tips.map((t) => h("div", { class: "advice " + (t.kind || ""), style: { "font-size": "12px" }, text: t.text })))
                    : null,
                ]),
              ])
            );
          });
          stream.scrollTop = stream.scrollHeight;
        }

        function evaluateTurn(text, imgs) {
          const lower = text.toLowerCase();
          const tips = [];
          const len = text.replace(/\s/g, "").length;
          if (imgs && imgs.length) {
            const docLike = imgs.some((im) => im.metrics && im.metrics.aspect >= 0.6 && im.metrics.aspect <= 0.92 && im.metrics.colorfulness < 0.28);
            const photoLike = imgs.some((im) => im.metrics && im.metrics.colorfulness >= 0.28);
            if (docLike) tips.push({ kind: "", text: "本轮附带了" + imgs.length + " 张图片（文档/截图类）。用图片支撑论点能提升说服力，建议补一句文字说明图片与当前议题的关系。" });
            else if (photoLike) tips.push({ kind: "", text: "本轮附带了" + imgs.length + " 张图片（实拍/图表类）。视觉材料有助于对方理解，建议说明图片对应的具体诉求或数据。" });
            else tips.push({ kind: "", text: "本轮附带了" + imgs.length + " 张图片。图文配合能增强表达，建议用文字点明图片想要传达的信息。" });
          }
          if (len < 30 && !(imgs && imgs.length)) tips.push({ kind: "warn", text: "本轮表述偏简（" + len + " 字）。建议补上「立场 + 方案」两层，让对方有可回应的具体信息。" });
          const hasCondition = /if you|provided that|subject to|in return|if we|若|如果/.test(text);
          if (!hasCondition && /we can|we will|we accept|we offer|可以|我们可/.test(text)) {
            tips.push({ kind: "warn", text: "本轮给出方案但未附带条件。谈判中的让步应与对价绑定，可改为 “If you can …, we can …”。" });
          } else if (hasCondition) {
            tips.push({ kind: "", text: "本轮使用了条件交换句式，让步与对价绑定，策略得当。" });
          }
          if (/[a-z]{4,}/.test(lower) === false) tips.push({ kind: "warn", text: "本轮未见英文表达。该场景要求全英文应答，中英混用会影响语域一致性。" });
          const newCov = flow.steps.filter((s) => s.detect.some((d) => lower.indexOf(String(d).toLowerCase()) >= 0) && !coveredBefore(s.id));
          if (newCov.length) tips.push({ kind: "", text: "本轮推进了环节：" + newCov.map((c) => "「" + c.name + "」").join("、") + "。" });
          return tips;
        }

        function coveredBefore(stepId) {
          return messages.some((m) => m.role === "me" && flow.steps.find((s) => s.id === stepId).detect.some((d) => m.text.toLowerCase().indexOf(String(d).toLowerCase()) >= 0));
        }

        /* AI 对图片的针对性回应（演示用：基于本地量化指标判断图片类型，不调用外部视觉接口） */
        function imageAck(imgs, text) {
          const m0 = imgs[0].metrics;
          const many = imgs.length > 1 ? " these " + imgs.length + " images" : " this image";
          if (m0 && m0.aspect >= 0.6 && m0.aspect <= 0.92 && m0.colorfulness < 0.28) {
            return "I've received" + many + " — it reads like a document or a screenshot, which gives me useful context on where we stand.";
          }
          if (m0 && m0.colorfulness >= 0.28) {
            return "I've received" + many + " you shared, and I can see the details you're pointing to.";
          }
          return "I've received" + many + " you attached.";
        }

        function reply() {
          const text = input.value.trim();
          const imgs = draftImgs.slice();
          if (!text && !imgs.length) {
            ZK.toast("请输入你的回应，或上传图片后发送", "warn");
            return;
          }
          const tips = evaluateTurn(text, imgs);
          messages.push({ role: "me", text: text, images: imgs, tips: tips });
          input.value = "";
          draftImgs = [];
          renderAttach();
          paintStream();
          paintSide();

          reviewing = true;
          input.disabled = true;
          attachBtn.classList.remove("has-img");
          stream.appendChild(h("div", { class: "chat-msg" }, [h("div", { class: "cm-avatar ai", text: "AI" }), h("div", { class: "chat-bubble" }, [h("div", { class: "typing-dots" }, [h("i"), h("i"), h("i")])])]));
          stream.scrollTop = stream.scrollHeight;

          setTimeout(() => {
            const lower = text.toLowerCase();
            // 优先推进未覆盖的环节
            const next = flow.steps.find((s) => s.detect.some((d) => lower.indexOf(String(d).toLowerCase()) >= 0) && !coveredBefore(s.id));
            const anyCovered = flow.steps.filter((s) => coveredBefore(s.id));
            let aiText;
            if (next) aiText = next.ai;
            else if (messages.filter((m) => m.role === "me").length >= flow.steps.length + 1) {
              aiText = flow.closing;
            } else {
              const uncovered = flow.steps.filter((s) => !coveredBefore(s.id));
              aiText = uncovered.length ? uncovered[0].probe : flow.fallback[messages.length % flow.fallback.length];
            }
            void anyCovered;
            if (imgs.length) aiText = imageAck(imgs, text) + (aiText ? " " + aiText : "");
            messages.push({ role: "ai", text: aiText });
            reviewing = false;
            input.disabled = false;
            paintStream();
            paintSide();
            input.focus();
          }, 520);
        }

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) reply();
        });

        const startBtn = h("button", {
          class: "btn btn-primary",
          html: ZK.icons.play(14) + "<span>开始实训</span>",
          onclick() {
            messages = [{ role: "ai", text: sc.opening }];
            result = null;
            paintStream();
            input.focus();
            paint();
          },
        });

        const finishBtn = h("button", {
          class: "btn",
          html: ZK.icons.wand(14) + "<span>结束并评分</span>",
          onclick() {
            const meCount = messages.filter((m) => m.role === "me").length;
            if (meCount < 2) {
              ZK.toast("至少完成 2 轮回应后再评分", "warn");
              return;
            }
            result = ZK.engine.reviewPractice(sc, flow, messages);
            const learner = learnerId ? ZK.db.find("learners", learnerId) : null;
            const rec = ZK.db.insert("practiceSessions", {
              sceneId: sc.id, learnerId: learner ? learner.id : "l_001",
              learner: learner ? learner.name : "王梓涵",
              cls: learner ? (ZK.db.find("classes", learner.classId) || {}).name : "2022级商务英语1班",
              status: "completed", score: result.overall,
              turns: messages.map((m) => ({
                role: m.role, text: m.text,
                images: (m.images || []).map((im) => ({ url: im.url, name: im.name, w: im.w, h: im.h })),
              })),
              dims: result.dims, advice: result.advice,
              startedAt: Date.now() - meCount * 60000, finishedAt: Date.now(),
              imageSubmission: result.metrics.images || null, byTeacher: !learner,
            });
            ZK.db.log("完成AI实训", "场景《" + sc.name + "》完成 " + meCount + " 轮对话，AI 评分 " + result.overall + " 分");
            ZK.toast("AI 已完成评分：" + result.overall + " 分（" + U.grade(result.overall).label + "）");
            void rec;
            paint();
          },
        });

        return ZK.ui.card({
          bodyClass: "flush",
          title: sc.name,
          sub: "角色：" + sc.persona,
          icon: ZK.icons.messages(16),
          actions: [startBtn, finishBtn],
          body: [stream, attachBox, h("div", { class: "chat-composer" }, [
            attachBtn,
            fileInput,
            input,
            h("button", { class: "btn btn-primary", html: ZK.icons.send(14) + "<span>发送</span>", onclick: reply }),
          ])],
        });
      }

      function renderSide(sc, flow) {
        const meMsgs = messages.filter((m) => m.role === "me");
        const covered = flow.steps.filter((s) => meMsgs.some((m) => s.detect.some((d) => m.text.toLowerCase().indexOf(String(d).toLowerCase()) >= 0)));

        const side = h("div", { class: "stack-16" });

        side.appendChild(
          ZK.ui.card({
            title: "本轮实时评估",
            sub: "AI 按场景评分标准逐轮评价学生反应",
            icon: ZK.icons.target(16),
            body: [
              ZK.ui.kv([
                ["已完成轮次", meMsgs.length + " / " + sc.turnsExpected],
                ["覆盖环节", covered.length + " / " + flow.steps.length],
                ["覆盖进度", ZK.ui.progressLine((covered.length / flow.steps.length) * 100, "emerald", U.round((covered.length / flow.steps.length) * 100) + "%")],
                ["平均单轮字数", meMsgs.length ? U.round(U.avg(meMsgs.map((m) => m.text.replace(/\s/g, "").length))) : "—"],
              ]),
              h("div", { class: "divider" }),
              h("div", { class: "fs-12 fw-6 strong mb-8", text: "环节清单" }),
              h("div", { class: "stack-8" }, flow.steps.map((s) => {
                const on = covered.indexOf(s) >= 0;
                return h("div", { class: "row", style: { gap: "8px", "font-size": "12.5px" } }, [
                  h("span", { class: "em" === "" ? "" : "", html: on ? ZK.icons.checkCircle(14) : ZK.icons.info(14), style: { color: on ? "var(--accent-bright)" : "var(--text-ghost)" } }),
                  h("span", { style: { color: on ? "var(--text-secondary)" : "var(--text-faint)" }, text: s.name }),
                  on ? h("span", { class: "badge badge-emerald", style: { "margin-left": "auto" }, text: "已覆盖" }) : null,
                ]);
              })),
            ],
          })
        );

        if (result) {
          side.appendChild(
            ZK.ui.card({
              title: "AI 评分结果",
              sub: "总分 " + result.overall + " 分 · " + U.grade(result.overall).label,
              icon: ZK.icons.award(16),
              actions: [ZK.ui.badge(U.grade(result.overall).label, result.overall >= 85 ? "emerald" : result.overall >= 70 ? "blue" : "amber")],
              body: [
                h("div", { class: "score-hero mb-16" }, [
                  h("div", {}, [h("div", { class: "score-big em", text: String(result.overall) }), h("div", { class: "fs-12 faint", text: "满分 100" })]),
                  ZK.ui.ring({ pct: result.overall, size: 96, color: result.overall >= 85 ? "#2563eb" : result.overall >= 70 ? "#3b82f6" : "#0ea5e9", text: String(result.overall) }),
                ]),
                ZK.ui.scoreScale(result.dims),
                h("div", { class: "divider" }),
                h("div", { class: "fs-12 fw-6 strong mb-8", text: "优化建议" }),
                h("div", { class: "stack-8" }, result.advice.map((a, i) => h("div", { class: "advice" + (i === 0 ? "" : " info"), text: a }))),
                h("div", { class: "divider" }),
                h("div", { class: "row", style: { gap: "6px", "flex-wrap": "wrap" } }, [
                  h("button", { class: "btn btn-sm", text: "查看全部实训记录", onclick: () => go("#/practice/records") }),
                ]),
              ],
            })
          );
        } else {
          side.appendChild(
            ZK.ui.card({
              title: "评分标准",
              sub: "对话达到 2 轮以上可结束评分",
              icon: ZK.icons.clipboard(16),
              body: [
                h("div", { class: "stack-12" }, sc.rubric.map((r) =>
                  h("div", {}, [
                    h("div", { class: "row-between" }, [
                      h("span", { class: "fs-13 strong", text: r.name }),
                      ZK.ui.badge(r.weight + " 分", "emerald"),
                    ]),
                    h("div", { class: "fs-11 faint mt-4", text: r.desc }),
                  ])
                )),
                h("div", { class: "divider" }),
                h("div", { class: "hint", text: "评分依据来自学生实际发言内容：环节覆盖度、条件交换句式、英文占比、礼貌标记、单轮信息密度等指标参与计算。" }),
              ],
            })
          );
        }
        return side;
      }

      root.appendChild(host);
      paint();
    },
  };

  /* ============================ 图片智能评分 ============================ */
  P["practice/image"] = {
    render(root) {
      const host = h("div");
      let pending = null;
      /* 上传表单草稿：paint() 会重建上传区，草稿用于保住已选图片与用户输入 */
      const DRAFT = {
        title: "商务函电排版截图",
        desc: "按商务函电格式规范提交函件截图，检查抬头、正文分段、落款与附件标注是否规范。",
        learnerId: null,
      };
      /* 示例图纸生成入口：renderUploader 就绪后回填，供页头按钮调用 */
      let makeSampleImage = () => ZK.toast("图片模块正在载入，请稍后重试", "warn");

      function paint() {
        U.clear(host);
        const subs = ZK.db.list("imageSubmissions");

        host.appendChild(
          ZK.ui.pageHead({
            title: "图片提交与智能评分",
            sub: "支持学生以图片形式提交作品，AI 对图像实际内容做量化分析后按任务标准给出评分与改进建议。",
            actions: [
              h("button", { class: "btn btn-sm", text: "生成示例图纸", onclick: () => makeSampleImage() }),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-4 mb-16" }, [
            ZK.ui.statCard({ label: "图片提交量", value: String(subs.length), target: "份", icon: ZK.icons.image(18), tone: "emerald", progress: subs.length * 20 }),
            ZK.ui.statCard({ label: "平均得分", value: subs.length ? U.round(U.avg(subs.map((s) => s.score)), 1) + " 分" : "—", target: "满分 100", icon: ZK.icons.award(18), tone: "blue", progress: subs.length ? U.avg(subs.map((s) => s.score)) : 0 }),
            ZK.ui.statCard({ label: "最高得分", value: subs.length ? Math.max.apply(null, subs.map((s) => s.score)) + " 分" : "—", target: "单份最高", icon: ZK.icons.trendingUp(18), tone: "amber", progress: 88 }),
            ZK.ui.statCard({ label: "待评分", value: String(ZK.db.list("imageSubmissions", (s) => s.score === null).length), target: "份", icon: ZK.icons.clock(18), tone: "violet", progress: 30 }),
          ])
        );

        host.appendChild(
          h("div", { class: "grid grid-3" }, [
            h("div", { class: "span-2" }, [renderUploader()]),
            renderList(subs),
          ])
        );
      }

      function renderUploader() {
        const learnerSel = h("select", { class: "select", onchange: (e) => (DRAFT.learnerId = e.target.value) },
          ZK.db.list("learners").slice(0, 12).map((l) => h("option", { value: l.id, selected: l.id === DRAFT.learnerId, text: l.name + "（" + l.sno + "）" })));
        if (!DRAFT.learnerId) DRAFT.learnerId = learnerSel.value;
        const taskTitle = h("input", { class: "input", value: DRAFT.title, placeholder: "作品标题", oninput: (e) => (DRAFT.title = e.target.value) });
        const taskDesc = h("textarea", {
          class: "textarea",
          value: DRAFT.desc,
          placeholder: "评分要求说明",
          oninput: (e) => (DRAFT.desc = e.target.value),
        });
        const fileInput = h("input", { type: "file", accept: "image/*", style: { display: "none" } });
        const preview = h("div", {
          style: { "border-radius": "12px", border: "1px solid var(--border-default)", "min-height": "190px", display: "flex", "align-items": "center", "justify-content": "center", overflow: "hidden", background: "rgba(3,7,18,0.5)" },
          html: pending && pending.liveUrl ? null : '<span class="fs-12 ghost">尚未选择图片</span>',
        });
        const metricsBox = h("div", { class: "fs-12 muted" });
        /* 已有待提交图片时，重绘后把预览与指标一并还原，避免 paint() 后看起来像未选择 */
        if (pending && pending.liveUrl) {
          preview.style.padding = "0";
          preview.appendChild(h("img", { src: pending.liveUrl, style: { "max-height": "300px", width: "auto", margin: "0 auto" } }));
        }
        if (pending) renderMetrics(pending, metricsBox);
        const drop = h("div", { class: "drop-zone", onclick: () => fileInput.click() }, [
          h("div", { class: "dz-icon", html: ZK.icons.image(20) }),
          h("b", { text: "点击选择图片，或把图片拖到此处" }),
          h("span", { text: "支持 PNG / JPG / WEBP，评分依据为图像的真实尺寸、留白比例、灰度分布与边缘密度" }),
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
          if (f) analyze(f);
        });
        fileInput.addEventListener("change", (e) => {
          const f = e.target.files[0];
          if (f) analyze(f);
        });

        function analyze(file) {
          if (!/^image\//.test(file.type)) {
            ZK.toast("请选择图片文件", "err");
            return;
          }
          metricsBox.innerHTML = '<div class="scan-bar" style="margin-top:10px"><i></i></div><div class="fs-12 faint mt-8">正在解析图像内容…</div>';
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              const m = imageMetrics(img);
              m.fileName = file.name;
              m.fileSize = file.size;
              m.liveUrl = reader.result;
              pending = m;
              U.clear(preview);
              preview.style.padding = "0";
              preview.appendChild(h("img", { src: reader.result, style: { "max-height": "300px", width: "auto", margin: "0 auto" } }));
              renderMetrics(m, metricsBox);
              paint();
            };
            img.onerror = () => ZK.toast("图像解析失败，请更换图片", "err");
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        }

        function sampleImage() {
          const c = document.createElement("canvas");
          c.width = 1240;
          c.height = 1754;
          const g = c.getContext("2d");
          g.fillStyle = "#ffffff";
          g.fillRect(0, 0, c.width, c.height);
          g.fillStyle = "#1f2937";
          g.font = "bold 34px sans-serif";
          g.fillText("Sichuan International Studies University", 110, 170);
          g.font = "26px sans-serif";
          g.fillText("School of English Studies", 110, 212);
          g.fillRect(110, 240, 1020, 3);
          g.font = "24px sans-serif";
          g.fillText("May 12, 2026", 110, 320);
          g.fillText("Dear Mr. Whitfield,", 110, 372);
          const lines = [
            "Thank you for your enquiry dated May 8 regarding our smart thermostat.",
            "We are pleased to quote as follows: 3,000 units at USD 39.20 per unit,",
            "FOB Shanghai, with a lead time of 35 days from receipt of your order.",
            "Our standard payment terms are 35% deposit by T/T, with the balance",
            "payable against the copy of the bill of lading.",
          ];
          lines.forEach((l, i) => g.fillText(l, 110, 428 + i * 38));
          g.fillText("We look forward to your confirmation.", 110, 660);
          g.fillText("Yours sincerely,", 110, 736);
          g.font = "bold 24px sans-serif";
          g.fillText("Li Mingyuan", 110, 790);
          g.font = "22px sans-serif";
          g.fillText("Sales Manager, Whitfield Trading Account", 110, 826);
          g.fillText("Enclosure: Proforma Invoice No. PI-2026-0512", 110, 940);
          c.toBlob((blob) => {
            const f = new File([blob], "sample-business-letter.png", { type: "image/png" });
            analyze(f);
            ZK.toast("已生成示例图纸并完成图像解析");
          }, "image/png");
        }
        /* 回填页头按钮的入口，使页头与卡片内的按钮行为一致 */
        makeSampleImage = sampleImage;

        return ZK.ui.card({
          title: "提交图片作品",
          sub: "图像分析在浏览器本地完成，指标包括分辨率、留白比例、灰度对比、色彩饱和度与边缘密度",
          icon: ZK.icons.image(16),
          actions: [h("button", { class: "btn btn-sm", text: "生成示例图纸", onclick: sampleImage })],
          body: [
            h("div", { class: "grid grid-2" }, [
              h("div", { class: "stack-12" }, [drop, fileInput, preview, metricsBox]),
              h("div", { class: "stack-12" }, [
                h("div", { class: "field" }, [h("label", { class: "label", text: "提交学生" }), learnerSel]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "作品标题" }), taskTitle]),
                h("div", { class: "field" }, [h("label", { class: "label", text: "评分要求" }), taskDesc]),
                h("button", {
                  class: "btn btn-primary btn-block",
                  html: ZK.icons.sparkles(14) + "<span>提交并由 AI 评分</span>",
                  onclick() {
                    if (!pending) {
                      ZK.toast("请先选择图片或生成示例图纸", "warn");
                      return;
                    }
                    const learner = ZK.db.find("learners", learnerSel.value);
                    const scored = scoreImage(pending, taskDesc.value);
                    const rec = ZK.db.insert("imageSubmissions", {
                      id: U.uid("img"), learnerId: learner.id, learner: learner.name,
                      cls: (ZK.db.find("classes", learner.classId) || {}).name,
                      sceneId: null, title: taskTitle.value, desc: taskDesc.value,
                      fileName: pending.fileName, width: pending.width, height: pending.height,
                      sizeKB: Math.round(pending.fileSize / 1024), format: pending.format,
                      colorfulness: pending.colorfulness, inkRatio: pending.inkRatio,
                      aspect: pending.aspect, edgeDensity: pending.edgeDensity,
                      brightness: pending.brightness, contrast: pending.contrast,
                      score: scored.score, verdict: scored.verdict, dims: scored.dims,
                      advice: scored.advice, submittedAt: Date.now(), thumb: pending.thumb,
                    });
                    ZK.db.log("图片作品智能评分", learner.name + " 提交《" + rec.title + "》，AI 评分 " + scored.score + " 分");
                    ZK.toast("AI 评分完成：" + scored.score + " 分");
                    ZK.modal({
                      title: "AI 图片评分结果",
                      sub: rec.title + " · " + learner.name,
                      size: "lg",
                      render(api) {
                        api.body.appendChild(
                          h("div", { class: "stack-16" }, [
                            h("div", { class: "grid grid-2" }, [
                              h("div", { style: { "border-radius": "12px", overflow: "hidden", border: "1px solid var(--border-default)" } },
                                pending.liveUrl ? [h("img", { src: pending.liveUrl, style: { width: "100%" } })] : [ZK.ui.empty({ title: "无预览" })]),
                              h("div", { class: "stack-12" }, [
                                h("div", { class: "score-hero" }, [
                                  h("div", { class: "score-big em", text: String(scored.score) }),
                                  ZK.ui.ring({ pct: scored.score, size: 88, color: scored.score >= 85 ? "#2563eb" : "#0ea5e9", text: String(scored.score) }),
                                ]),
                                ZK.ui.scoreScale(scored.dims),
                                h("div", { class: "fs-12 faint", text: scored.verdict }),
                              ]),
                            ]),
                            h("div", {}, [
                              h("div", { class: "fs-13 fw-6 strong mb-8", text: "图像量化指标" }),
                              ZK.ui.kv([
                                ["分辨率", pending.width + " × " + pending.height + "（比例 " + pending.aspect + "）"],
                                ["文件大小", rec.sizeKB + " KB"],
                                ["留白 / 墨迹比", U.pct(pending.inkRatio * 100)],
                                ["灰度对比度", U.round(pending.contrast, 1) + "（0-255）"],
                                ["色彩饱和度", U.round(pending.colorfulness * 100, 1) + "%"],
                                ["边缘密度", U.round(pending.edgeDensity * 100, 1) + "%"],
                              ]),
                            ]),
                            h("div", {}, [
                              h("div", { class: "fs-13 fw-6 strong mb-8", text: "评分建议" }),
                              h("div", { class: "stack-8" }, scored.advice.map((a) => h("div", { class: "advice info", text: a }))),
                            ]),
                          ])
                        );
                      },
                    });
                    pending = null;
                    paint();
                  },
                }),
                h("div", { class: "hint", text: "说明：AI 评分依据图像的真实量化指标与评分要求文本共同计算，同一张图重复评分结果一致，换图后评分随之变化。" }),
              ]),
            ]),
          ],
        });
      }

      function renderList(subs) {
        return ZK.ui.card({
          title: "图片评分记录",
          sub: "共 " + subs.length + " 份",
          icon: ZK.icons.list(16),
          body: [
            subs.length
              ? h("div", { class: "row-list" }, subs.map((s) =>
                  h("button", {
                    class: "list-row",
                    onclick: () => openDetail(s),
                  }, [
                    h("div", { class: "lr-icon " + (s.score >= 85 ? "ic-emerald" : s.score >= 70 ? "ic-blue" : "ic-amber"), html: ZK.icons.image(15) }),
                    h("div", { class: "lr-main" }, [
                      h("b", { text: s.title }),
                      h("span", { text: s.learner + " · " + s.cls + " · " + U.fmtTime(s.submittedAt) }),
                    ]),
                    h("div", { class: "lr-tail" }, [ZK.ui.badge(s.score + " 分", s.score >= 85 ? "emerald" : s.score >= 70 ? "blue" : "amber")]),
                  ])
                ))
              : ZK.ui.empty({ title: "暂无图片评分记录", desc: "从左侧提交一份图片作品，或点击「生成示例图纸」快速体验评分流程。" }),
          ],
        });
      }

      function openDetail(s) {
        ZK.modal({
          title: "图片评分详情",
          sub: s.title + " · " + s.learner,
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                h("div", { class: "row-between" }, [
                  h("div", { class: "score-hero", style: { flex: "1" } }, [
                    h("div", { class: "score-big em", text: String(s.score) }),
                    ZK.ui.ring({ pct: s.score, size: 84, color: s.score >= 85 ? "#2563eb" : "#0ea5e9", text: String(s.score) }),
                  ]),
                  ZK.ui.badge(s.verdict, s.score >= 85 ? "emerald" : "amber"),
                ]),
                ZK.ui.scoreScale(s.dims),
                ZK.ui.kv([
                  ["提交文件", s.fileName + "（" + s.format + " · " + s.sizeKB + " KB）"],
                  ["分辨率", s.width + " × " + s.height],
                  ["留白 / 墨迹比", U.pct(s.inkRatio * 100)],
                  ["灰度对比度", U.round(s.contrast, 1)],
                  ["色彩饱和度", U.round(s.colorfulness * 100, 1) + "%"],
                  ["边缘密度", U.round(s.edgeDensity * 100, 1) + "%"],
                  ["提交时间", U.fmtDateTime(s.submittedAt)],
                ]),
                h("div", {}, [
                  h("div", { class: "fs-13 fw-6 strong mb-8", text: "评分建议" }),
                  h("div", { class: "stack-8" }, (s.advice || []).map((a) => h("div", { class: "advice info", text: a }))),
                ]),
              ])
            );
          },
        });
      }

      root.appendChild(host);
      paint();
    },
  };

  /* --- 图像量化分析 --- */
  function imageMetrics(img) {
    const W = img.naturalWidth || img.width;
    const Hgt = img.naturalHeight || img.height;
    const scale = Math.min(1, 360 / Math.max(W, Hgt));
    const w = Math.max(1, Math.round(W * scale));
    const hh = Math.max(1, Math.round(Hgt * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = hh;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0, w, hh);
    const data = g.getImageData(0, 0, w, hh).data;

    let sumL = 0;
    let sumL2 = 0;
    let dark = 0;
    let sumSat = 0;
    const lum = new Float32Array(w * hh);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i] / 255;
      const gg = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const l = 0.299 * r + 0.587 * gg + 0.114 * b;
      lum[p] = l;
      sumL += l;
      sumL2 += l * l;
      if (l < 0.45) dark += 1;
      const mx = Math.max(r, gg, b);
      const mn = Math.min(r, gg, b);
      sumSat += mx === 0 ? 0 : (mx - mn) / mx;
    }
    const n = w * hh;
    const mean = sumL / n;
    const contrast = Math.sqrt(Math.max(0, sumL2 / n - mean * mean)) * 255;
    const inkRatio = dark / n;
    const colorfulness = sumSat / n;

    // 边缘密度（水平/垂直梯度）
    let edges = 0;
    for (let y = 1; y < hh - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = Math.abs(lum[i + 1] - lum[i - 1]);
        const gy = Math.abs(lum[i + w] - lum[i - w]);
        if (gx + gy > 0.16) edges += 1;
      }
    }
    const edgeDensity = edges / n;

    // 留白比例（按行统计空白行，用于版式评估）
    let blankRows = 0;
    for (let y = 0; y < hh; y++) {
      let darkPix = 0;
      for (let x = 0; x < w; x++) if (lum[y * w + x] < 0.55) darkPix += 1;
      if (darkPix / w < 0.02) blankRows += 1;
    }
    const blankRatio = blankRows / hh;

    // 内容区边界（用于判断留白是否均衡）
    let top = hh;
    let bottom = 0;
    let left = w;
    let right = 0;
    for (let y = 0; y < hh; y++) {
      for (let x = 0; x < w; x++) {
        if (lum[y * w + x] < 0.6) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }
    const marginTop = top / hh;
    const marginBottom = 1 - bottom / hh;
    const marginLeft = left / w;
    const marginRight = 1 - right / w;
    const marginBalance = 1 - Math.abs(marginLeft - marginRight) - Math.abs(marginTop - marginBottom);

    // 缩略图
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = 120;
    thumbCanvas.height = Math.round((120 * hh) / w);
    thumbCanvas.getContext("2d").drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumb = thumbCanvas.toDataURL("image/jpeg", 0.62);

    return {
      width: W, height: Hgt,
      aspect: Number((W / Hgt).toFixed(2)),
      format: (img.src && img.src.indexOf("data:image/png") === 0) ? "PNG" : "JPG",
      brightness: U.round(mean, 3),
      contrast: Number(contrast.toFixed(1)),
      inkRatio: Number(inkRatio.toFixed(4)),
      colorfulness: Number(colorfulness.toFixed(4)),
      edgeDensity: Number(edgeDensity.toFixed(4)),
      blankRatio: Number(blankRatio.toFixed(3)),
      margins: { top: Number(marginTop.toFixed(3)), bottom: Number(marginBottom.toFixed(3)), left: Number(marginLeft.toFixed(3)), right: Number(marginRight.toFixed(3)) },
      marginBalance: Number(marginBalance.toFixed(3)),
      thumb: thumb,
    };
  }

  /** 依据图像真实指标 + 评分要求文本计算得分 */
  function scoreImage(m, reqText) {
    const req = String(reqText || "");
    const dims = [];

    // 1 格式规范（要求文档/函件类时权重更高）
    const isDoc = /函|文档|排版|格式|截图|报告|图表|流程/.test(req);
    const ratioFit = m.aspect >= 0.6 && m.aspect <= 0.85 ? 1 : m.aspect > 1.2 ? 0.62 : 0.82;
    const resScore = Math.min(1, Math.sqrt((m.width * m.height) / (1240 * 1754)));
    let fmt = (ratioFit * 0.5 + (0.55 + resScore * 0.45) * 0.5);
    fmt = U.clamp(fmt, 0.35, 0.99);
    dims.push({ name: "格式规范", weight: 40, score: Number((40 * fmt).toFixed(1)), ratio: fmt });

    // 2 版式清晰：留白均衡 + 墨迹占比合理 + 边缘密度适中
    const inkIdeal = 1 - Math.min(1, Math.abs(m.inkRatio - 0.14) / 0.2);
    const blankIdeal = 1 - Math.min(1, Math.abs(m.blankRatio - 0.26) / 0.34);
    const edgeIdeal = 1 - Math.min(1, Math.abs(m.edgeDensity - 0.16) / 0.22);
    let layout = (inkIdeal * 0.35 + blankIdeal * 0.3 + edgeIdeal * 0.2 + U.clamp(m.marginBalance, 0, 1) * 0.15);
    layout = U.clamp(layout, 0.35, 0.99);
    dims.push({ name: "版式清晰", weight: 30, score: Number((30 * layout).toFixed(1)), ratio: layout });

    // 3 内容完整：对比度 + 内容覆盖率（非空白区域占比）
    const contentCoverage = U.clamp(1 - m.blankRatio * 1.6, 0.2, 1);
    const contrastIdeal = U.clamp(m.contrast / 62, 0.35, 1);
    let content = contentCoverage * 0.55 + contrastIdeal * 0.45;
    content = U.clamp(content, 0.35, 0.99);
    dims.push({ name: "内容完整", weight: 30, score: Number((30 * content).toFixed(1)), ratio: content });

    const score = Math.round(U.sum(dims.map((d) => d.score)));
    const verdict =
      score >= 88 ? "符合提交规范，版式与内容完整度良好"
        : score >= 75 ? "基本符合规范，存在可改进的版式细节"
        : score >= 62 ? "部分要素不达标，建议重新整理后提交"
        : "存在明显问题，建议按评分要求重新排版";

    const advice = [];
    if (m.inkRatio > 0.24) advice.push("墨迹占比 " + U.pct(m.inkRatio * 100) + "，画面偏满，信息密度过高。建议增加段落间距或删减冗余说明，使重点更突出。");
    else if (m.inkRatio < 0.07) advice.push("墨迹占比 " + U.pct(m.inkRatio * 100) + "，内容偏少，可能未包含评分要求中的全部要素（如抬头、落款、附件标注）。建议核对后补全。");
    else advice.push("墨迹占比 " + U.pct(m.inkRatio * 100) + "，处于文档类图像的合理区间，信息密度适中。");

    if (m.blankRatio < 0.16) advice.push("空白行比例仅 " + U.pct(m.blankRatio * 100) + "，段落之间缺少呼吸空间。建议在抬头与正文、正文与落款之间各留一个空行。");
    else if (m.blankRatio > 0.42) advice.push("空白行比例 " + U.pct(m.blankRatio * 100) + "，页面留白过多，有效内容占比不足，可能被判定为内容不完整。");
    else advice.push("空白行比例 " + U.pct(m.blankRatio * 100) + "，版面留白分布合理。");

    if (m.contrast < 42) advice.push("灰度对比度 " + m.contrast + " 偏低，文字与背景区分度不足。建议提高字号层级差异或加深正文颜色，避免扫描件灰度过高。");
    else advice.push("灰度对比度 " + m.contrast + "，文字与背景区分度良好，可读性达标。");

    if (Math.abs(m.margins.left - m.margins.right) > 0.07) advice.push("左右页边距不对称（左 " + U.pct(m.margins.left * 100) + " / 右 " + U.pct(m.margins.right * 100) + "），截图存在裁切偏移，建议重新截取完整页面。");
    if (isDoc && m.width < 900) advice.push("图像宽度仅 " + m.width + " 像素，文档类截图建议不低于 1200 像素，以防文字细节在评阅时无法辨认。");

    if (m.colorfulness > 0.42) advice.push("色彩饱和度 " + U.pct(m.colorfulness * 100) + " 偏高，正式商务函件通常以黑白为主，过多色彩会削弱专业感。");

    return { score: score, verdict: verdict, dims: dims, advice: advice };
  }

  function renderMetrics(m, box) {
    U.clear(box);
    box.appendChild(
      h("div", { class: "grid grid-4", style: { gap: "8px" } }, [
        mv("分辨率", m.width + "×" + m.height),
        mv("墨迹比", U.pct(m.inkRatio * 100)),
        mv("对比度", U.round(m.contrast, 1)),
        mv("边缘密度", U.pct(m.edgeDensity * 100)),
      ])
    );
    function mv(l, v) {
      return h("div", { style: { background: "rgba(31,41,55,0.5)", "border-radius": "8px", padding: "7px 9px" } }, [
        h("div", { class: "fs-11 ghost", text: l }),
        h("div", { class: "fs-13 fw-6 strong", text: v }),
      ]);
    }
  }

  /* ============================ 实训记录与评分 ============================ */
  P["practice/records"] = {
    render(root) {
      const host = h("div");

      function paint() {
        U.clear(host);
        const sessions = ZK.db.list("practiceSessions");
        const done = sessions.filter((s) => s.score);
        const scenes = ZK.db.list("scenes");

        host.appendChild(
          ZK.ui.pageHead({
            title: "实训记录与评分",
            sub: "汇总全部生-机交互记录，可按场景、班级与学生筛选，查看 AI 的维度评分与优化建议。",
            actions: [
              h("button", { class: "btn btn-sm", text: "导出成绩" , onclick: exportCsv }),
              h("button", { class: "btn btn-primary btn-sm", text: "进入实训", onclick: () => go("#/practice/session") }),
            ],
          })
        );

        host.appendChild(
          h("div", { class: "grid grid-4 mb-16" }, [
            ZK.ui.statCard({ label: "实训总人次", value: String(sessions.length), target: "含进行中", icon: ZK.icons.messages(18), tone: "emerald", progress: Math.min(100, sessions.length * 3) }),
            ZK.ui.statCard({ label: "已完成评分", value: String(done.length), target: "人次", icon: ZK.icons.checkCircle(18), tone: "blue", progress: (done.length / (sessions.length || 1)) * 100 }),
            ZK.ui.statCard({ label: "平均得分", value: done.length ? U.round(U.avg(done.map((s) => s.score)), 1) + " 分" : "—", target: "满分 100", icon: ZK.icons.award(18), tone: "amber", progress: done.length ? U.avg(done.map((s) => s.score)) : 0 }),
            ZK.ui.statCard({ label: "最高得分", value: done.length ? U.round(Math.max.apply(null, done.map((s) => s.score)), 1) + " 分" : "—", target: "人次最高", icon: ZK.icons.trendingUp(18), tone: "violet", progress: 96 }),
          ])
        );

        host.appendChild(
          h("div", { class: "grid grid-3 mb-16" }, [
            h("div", { class: "span-2" }, [
              ZK.ui.card({
                title: "各场景平均得分",
                icon: ZK.icons.bars(16),
                sub: "按场景汇总已完成的实训记录",
                body: [
                  ZK.ui.bars({
                    data: scenes.map((sc) => {
                      const rs = done.filter((x) => x.sceneId === sc.id);
                      const v = rs.length ? U.round(U.avg(rs.map((x) => x.score)), 1) : 0;
                      return { label: U.truncate(sc.name, 6), value: v, display: v || "—", tone: v >= 82 ? "" : v >= 70 ? "blue" : "amber", tip: sc.name + "：平均 " + v + " 分（" + rs.length + " 人次）" };
                    }),
                    max: 100,
                  }),
                ],
              }),
            ]),
            ZK.ui.card({
              title: "维度平均得分率",
              icon: ZK.icons.target(16),
              sub: "按全部评分记录聚合",
              body: [
                h("div", { class: "stack-12" }, (function () {
                  const map = {};
                  done.forEach((s) => (s.dims || []).forEach((d) => {
                    map[d.name] = map[d.name] || { sum: 0, w: 0 };
                    map[d.name].sum += d.score;
                    map[d.name].w += d.weight;
                  }));
                  const rows = Object.keys(map).map((k) => ({ name: k, rate: map[k].w ? map[k].sum / map[k].w : 0 }));
                  return rows.map((r) =>
                    h("div", {}, [
                      h("div", { class: "row-between mb-4" }, [
                        h("span", { class: "fs-12 muted", text: r.name }),
                        h("span", { class: "fs-12 fw-6 strong", text: U.pct(r.rate * 100) }),
                      ]),
                      ZK.ui.progress(r.rate * 100, r.rate >= 0.85 ? "emerald" : r.rate >= 0.7 ? "blue" : "amber", true),
                    ])
                  );
                })()),
              ],
            }),
          ])
        );

        host.appendChild(
          ZK.ui.card({
            title: "实训记录明细",
            icon: ZK.icons.list(16),
            bodyClass: "flush",
            body: [
              ZK.ui.table({
                pageSize: 10,
                onRowClick: (r) => openDetail(r),
                rows: sessions.map((s) => Object.assign({}, s, { sceneName: (ZK.db.find("scenes", s.sceneId) || {}).name || "—" })),
                searchKeys: ["learner", "cls", "sceneName"],
                searchPlaceholder: "搜索学生、班级、场景…",
                columns: [
                  { key: "learner", label: "学生", sortable: true, render: (r) => h("span", { class: "cell-strong", text: r.learner }) },
                  { key: "cls", label: "班级", sortable: true },
                  { key: "sceneName", label: "实训场景", sortable: true, render: (r) => U.truncate(r.sceneName, 16) },
                  { key: "turns", label: "对话轮次", align: "right", sortable: true, sortValue: (r) => (r.turns || []).filter((t) => t.role === "me").length, render: (r) => (r.turns || []).filter((t) => t.role === "me").length + " 轮" },
                  { key: "score", label: "AI 评分", align: "right", sortable: true, render: (r) => (r.score ? h("span", { class: r.score >= 85 ? "em-score" : "", text: r.score + " 分" }) : ZK.ui.badge("未评分", "gray")) },
                  { key: "grade", label: "等级", render: (r) => (r.score ? ZK.ui.badge(U.grade(r.score).label, U.grade(r.score).cls.replace("badge-", "")) : "—") },
                  { key: "finishedAt", label: "完成时间", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtTime(r.finishedAt || r.startedAt) }) },
                  { key: "op", label: "操作", render: () => h("span", { class: "fs-12 em", text: "查看评分" }) },
                ],
              }),
            ],
          })
        );
      }

      function openDetail(s) {
        const sc = ZK.db.find("scenes", s.sceneId) || {};
        ZK.modal({
          title: "实训评分详情",
          sub: s.learner + " · " + s.cls + " · " + (sc.name || ""),
          size: "xl",
          render(api) {
            api.body.appendChild(
              h("div", { class: "grid grid-2" }, [
                h("div", {}, [
                  h("div", { class: "fs-13 fw-6 strong mb-8", text: "对话记录" }),
                  h("div", { class: "chat-stream", style: { padding: "0", "max-height": "520px" } },
                    (s.turns && s.turns.length ? s.turns : [{ role: "ai", text: "该记录由批量数据生成，未保留完整对话文本。" }]).map((t) =>
                      h("div", { class: "chat-msg" + (t.role === "me" ? " me" : "") }, [
                        h("div", { class: "cm-avatar " + (t.role === "me" ? "me" : "ai"), text: t.role === "me" ? "学" : "AI" }),
                        h("div", { class: "chat-bubble" }, [h("div", { style: { "white-space": "pre-wrap" }, text: t.text })]),
                      ])
                    )
                  ),
                ]),
                h("div", { class: "stack-16" }, [
                  h("div", { class: "score-hero" }, [
                    h("div", {}, [
                      h("div", { class: "score-big em", text: s.score ? String(s.score) : "—" }),
                      h("div", { class: "fs-12 faint", text: s.score ? U.grade(s.score).label + " · 满分 100" : "未评分" }),
                    ]),
                    ZK.ui.ring({ pct: s.score || 0, size: 96, color: (s.score || 0) >= 85 ? "#2563eb" : "#3b82f6", text: s.score ? String(s.score) : "—" }),
                  ]),
                  h("div", {}, [
                    h("div", { class: "fs-13 fw-6 strong mb-8", text: "维度得分" }),
                    ZK.ui.scoreScale((s.dims || []).map((d) => ({ name: d.name, score: d.score, weight: d.weight }))),
                  ]),
                  h("div", {}, [
                    h("div", { class: "fs-13 fw-6 strong mb-8", text: "优化建议" }),
                    h("div", { class: "stack-8" }, (s.advice || []).length
                      ? s.advice.map((a) => h("div", { class: "advice info", text: a }))
                      : [h("div", { class: "fs-12 faint", text: "该记录未生成文字建议。" })]),
                  ]),
                ]),
              ])
            );
          },
        });
      }

      function exportCsv() {
        const rows = [["学生", "班级", "场景", "轮次", "AI评分", "等级", "完成时间"]];
        ZK.db.list("practiceSessions").forEach((s) => {
          const sc = ZK.db.find("scenes", s.sceneId) || {};
          rows.push([s.learner, s.cls, sc.name || "", (s.turns || []).filter((t) => t.role === "me").length, s.score || "", s.score ? U.grade(s.score).label : "未评分", U.fmtDateTime(s.finishedAt || s.startedAt)]);
        });
        U.downloadCsv("实训成绩.csv", rows);
        ZK.db.log("导出实训成绩", "导出 " + (rows.length - 1) + " 条实训记录");
        ZK.toast("成绩已导出为 CSV 文件");
      }

      root.appendChild(host);
      paint();
    },
  };
})();
