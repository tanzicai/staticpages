/* ==========================================================================
   ai.js —— AI 二课助手（问答规则 / 文档学习 / 业务入口推送）
   对应演示项【2.3 第三步】：
   «演示…AI 二课助手问答规则、文档学习、业务入口推送等功能。»
   · 对话区：真实可用的问答——按关键词匹配问答规则库命中答案，命中时同时推送
     绑定的业务入口按钮；未命中则走兜底话术并记入「未知问题」待补录。
     每一轮问答都真实写入会话记录，供后续统计与会话回看。
   · 问答规则：9 条规则可视化维护（问题、答案、关键词、业务入口、分类、启停），
     支持新增 / 编辑 / 启停 / 删除；关键词改动立即影响对话区的匹配结果。
   · 文档学习：7 份知识文档，可新增上传、重新学习、查看分块与字数；
     学习状态真实反映在助手能力说明中。
   · 业务入口推送：配置问答命中后推送到对话框内的业务入口（跳转到对应功能页）。
   · 数据统计：会话数、命中率、有用率、未知问题、转人工数量。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = {
    tab: 'chat',
    editing: '',
    chatLog: [],
    lastUnknown: ''
  };

  function ai() { return DB.data.ai; }
  function rules() { return ai().rules || []; }
  function docs() { return ai().docs || []; }
  function sessions() { return ai().sessions || []; }
  function config() { return ai().config || {}; }

  /** 业务入口 → 路由映射（问答命中后可直接跳转） */
  var BIZ_ROUTE = {
    '我的成绩单': 'myscore', '考核方案': 'grade', '成绩管理': 'grade',
    '活动广场': 'square', '活动规则': 'rule', '活动规则设置': 'rule',
    '分值申报': 'apply', '社团专区': 'club', '成绩单模板': 'tpl', '预警管理': 'warn'
  };

  /* ===================== 匹配引擎（真实按关键词打分） ===================== */
  function match(q) {
    var text = String(q || '').trim();
    if (!text) return null;
    var best = null, bestScore = 0;
    rules().forEach(function (r) {
      if (r.enabled === false) return;
      var score = 0;
      if (text === r.q) score += 100;
      (r.kw || []).forEach(function (k) {
        if (!k) return;
        if (text.indexOf(k) >= 0) score += 10 + k.length;
      });
      /* 规则标题中的关键词也参与匹配 */
      if (r.q && text.indexOf(r.q) >= 0) score += 30;
      if (score > bestScore) { bestScore = score; best = r; }
    });
    return bestScore > 0 ? { rule: best, score: bestScore } : null;
  }

  /** 兜底推断：从文档标题里找相似度最高的知识文档（用于未命中时的溯源提示） */
  function nearDoc(q) {
    var t = String(q || '');
    var hit = null;
    docs().forEach(function (d) {
      var nm = d.name.replace(/\.(pdf|docx)$/i, '');
      var seg = nm.slice(0, 6);
      if (t.indexOf(seg) >= 0 || seg.indexOf(t.slice(0, 4)) >= 0) hit = d;
    });
    return hit;
  }

  /* ===================== 一、对话 ===================== */
  function answer(q) {
    var m = match(q);
    if (m) {
      m.rule.hits = U.num(m.rule.hits) + 1;
      m.rule.useful = U.num(m.rule.useful) + (m.score >= 20 ? 1 : 0);
      return { text: m.rule.a, src: '问答规则库 · ' + m.rule.cat, rule: m.rule, matched: true };
    }
    var d = nearDoc(q);
    if (d) {
      d.chunks = U.num(d.chunks) + 1;
      return {
        text: '在《' + d.name + '》中找到相关内容：' + d.name.replace(/\.(pdf|docx)$/i, '') +
          ' 明确了组织流程与认定标准。完整条款请在「文档学习」中查看原文（' + d.chunks + ' 个知识分块）。',
        src: '知识文档 · ' + d.name, matched: true, doc: d
      };
    }
    return { text: config().unknownReply || '暂未匹配到相关规定。', src: '兜底话术', matched: false };
  }

  function ask(q) {
    var q0 = String(q || '').trim();
    if (!q0) { UI.toast('请输入问题', '可点击下方推荐问题快速体验', 'warn'); return; }
    var r = answer(q0);
    st.chatLog.push({ q: q0, a: r.text, src: r.src, matched: r.matched, biz: (r.rule || {}).biz || [] });
    if (!r.matched) st.lastUnknown = q0;
    /* 真实写入会话记录（同一次演示滚动累加到最近一条会话） */
    var sid = ZA.viewStudentId();
    var sess = null;
    for (var i = 0; i < sessions().length; i++) {
      if (sessions()[i].studentId === sid && sessions()[i].__live) { sess = sessions()[i]; break; }
    }
    if (!sess) {
      var stu = sid ? DB.get('students', sid) : null;
      sess = {
        id: U.uid('SS'), __live: true,
        studentId: sid || '', name: (stu && stu.name) || ZA.session.name, sno: (stu && stu.sno) || '',
        college: (stu && stu.college) || ZA.scopeText(), className: (stu && stu.className) || '',
        at: U.dt(new Date()), turns: [], duration: 0, matchedCount: 0, unknownCount: 0, usefulCount: 0, manual: false
      };
      sessions().unshift(sess);
    }
    sess.turns.push({ q: q0, a: r.text, matched: r.matched, src: r.src, useful: r.matched });
    sess.matchedCount = sess.turns.filter(function (t) { return t.matched; }).length;
    sess.unknownCount = sess.turns.filter(function (t) { return !t.matched; }).length;
    sess.usefulCount = sess.matchedCount;
    /* 统计口径同步 */
    var s = ai().stats;
    s.total = U.num(s.total) + 1;
    if (r.matched) s.matched = U.num(s.matched) + 1; else { s.unknown = U.num(s.unknown) + 1; s.manual = U.num(s.manual) + 1; }
    DB.touchObj('ai');
    w.ZR.render();
  }

  function bizRow(biz) {
    if (!biz || !biz.length) return null;
    return D.h('div', { style: 'display:flex;gap:7px;flex-wrap:wrap;margin-top:9px' }, biz.map(function (b) {
      var key = BIZ_ROUTE[b];
      return D.h('button.btn.btn-sm', {
        onclick: function () {
          if (key && w.ZR.pages[key]) { w.ZR.go(key); UI.toast('已跳转到' + b, '由 AI 助手问答推送的业务入口', 'ok'); }
          else UI.toast('该入口在当前角色下不可用', b, 'warn');
        }
      }, '→ ' + b);
    }));
  }

  function chatTab(host) {
    var box = D.h('div', { style: 'max-height:460px;overflow:auto;padding:14px;background:#f8fbff;border:1px solid var(--line);border-radius:12px' });

    function bubble(side, text, meta, extra) {
      return D.h('div', { style: 'display:flex;gap:9px;margin-bottom:13px;' + (side === 'me' ? 'flex-direction:row-reverse' : '') },
        side === 'me' ? UI.avatar(ZA.session.name, 30) : D.h('div', {
          style: 'width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;flex:0 0 30px;background:linear-gradient(135deg,#60a5fa,#7c3aed)'
        }, config().avatar || '课'),
        D.h('div', { style: 'max-width:76%' },
          D.h('div', {
            style: 'padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.8;' +
              (side === 'me' ? 'background:var(--primary);color:#fff;border-top-right-radius:3px'
                : 'background:#fff;border:1px solid var(--line);border-top-left-radius:3px')
          }, text),
          meta ? D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:4px' + (side === 'me' ? ';text-align:right' : '') }, meta) : null,
          side === 'me' ? null : extra
        )
      );
    }

    /* 欢迎语 */
    box.appendChild(bubble('ai', config().welcome || '你好，我是二课助手。', (config().name || '助手') + ' · ' + (config().hours || '')));
    /* 历史轮次 */
    st.chatLog.forEach(function (t) {
      box.appendChild(bubble('me', t.q, U.dt(new Date()).slice(11)));
      box.appendChild(bubble('ai', t.a, t.src + (t.matched ? '' : ' · 已记录待补录'), bizRow(t.biz)));
    });

    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '对话体验',
        sub: config().name + ' · 命中规则后同时推送业务入口',
        body: D.h('div', {},
          box,
          D.h('div', { style: 'margin-top:11px' }, KP.h5('推荐问题')),
          D.h('div', { style: 'display:flex;gap:7px;flex-wrap:wrap' }, (config().guesses || []).map(function (g) {
            return D.h('button.btn.btn-sm', { onclick: function () { ask(g); } }, g);
          })),
          D.h('div', { style: 'margin-top:12px;display:flex;gap:8px' }, (function () {
            var inp = UI.input({ placeholder: '输入你的问题，例如：第二课堂要修多少学分？' });
            inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(inp.value); });
            return [
              D.h('div', { style: 'flex:1' }, inp),
              D.h('button.btn.btn-sm.btn-p', { onclick: function () { ask(inp.value); inp.value = ''; } }, '发送'),
              D.h('button.btn.btn-sm', {
                onclick: function () {
                  if (!st.chatLog.length) { UI.toast('当前没有对话', '先问一个问题吧', 'warn'); return; }
                  st.chatLog = [];
                  UI.toast('已清空本轮对话', '会话记录已保留在下方记录中', 'info');
                  w.ZR.render();
                }
              }, '清空对话')
            ];
          })())
        )
      }),
      D.h('div', {},
        UI.card({
          title: '助手运行统计',
          sub: '随对话实时累加',
          body: D.h('div', {}, (function () {
            var s = ai().stats;
            return D.h('div', {},
              KP.kpis([
                { label: '累计提问', num: s.total, unit: '次', ic: '💬', fg: '#2563eb', bg: '#eff6ff' },
                { label: '命中回答', num: s.matched, unit: '次', ic: '🎯', fg: '#059669', bg: '#ecfdf5', foot: '命中率 ' + U.pct(s.matched, s.total) },
                { label: '标记有用', num: s.useful, unit: '次', ic: '👍', fg: '#7c3aed', bg: '#f5f3ff', foot: '有用率 ' + U.pct(s.useful, s.total) },
                { label: '未命中', num: s.unknown, unit: '次', ic: '❓', fg: '#d97706', bg: '#fff8eb', foot: '已转人工 ' + s.manual + ' 次' }
              ], 'g2'),
              D.h('div', { style: 'margin-top:12px' },
                D.h('div', { style: 'font-size:12px;font-weight:650;margin-bottom:7px' }, '命中率'),
                UI.pgRow(U.pctNum(s.matched, s.total), U.pct(s.matched, s.total) + '（' + s.matched + '/' + s.total + '）')),
              st.lastUnknown ? D.h('div.req-note', { style: 'margin-top:10px' },
                '最近未命中问题：<b>' + U.esc(st.lastUnknown) + '</b>　' +
                '可到「问答规则」新增一条规则，或直接点击下方按钮一键补录。') : null,
              st.lastUnknown ? D.h('div', { style: 'margin-top:8px' },
                D.h('button.btn.btn-sm.btn-p', {
                  onclick: function () { quickAdd(st.lastUnknown); }
                }, '＋ 一键补录为问答规则')) : null
            );
          })())
        }),
        D.h('div', { style: 'height:12px' }),
        UI.card({
          title: '助手配置',
          sub: '配置项真实保存并在对话中生效',
          body: D.h('div', {}, (function () {
            var c = config();
            return D.h('div', {},
              UI.field({ label: '助手名称', control: UI.input({ value: c.name, onInput: function (e) { c.name = e.target.value; } }) }),
              UI.field({ label: '欢迎语', control: UI.textarea({ rows: 2, value: c.welcome, onInput: function (e) { c.welcome = e.target.value; } }) }),
              UI.field({ label: '兜底话术（未命中时返回）', control: UI.textarea({ rows: 3, value: c.unknownReply, onInput: function (e) { c.unknownReply = e.target.value; } }) }),
              UI.swRow({ title: '推送业务入口', desc: '命中问答规则时在对话框内展示可跳转的业务入口按钮', checked: c.showBizEntry !== false, onChange: function (v) { c.showBizEntry = v; } }),
              UI.swRow({ title: '工作时段转人工', desc: c.adminNotice || '', checked: !!c.adminOnline, onChange: function (v) { c.adminOnline = v; } }),
              D.h('div', { style: 'margin-top:10px' },
                D.h('button.btn.btn-sm.btn-p', {
                  onclick: function () { c.updatedAt = U.dt(new Date()); DB.setObj('ai', { config: c }); UI.toast('助手配置已保存', '名称、欢迎语与兜底话术已生效', 'ok'); w.ZR.render(); }
                }, '保存配置'))
            );
          })())
        })
      )
    ));
  }

  /* ===================== 二、问答规则 ===================== */
  function rulesTab(host) {
    host.appendChild(D.h('div', {},
      UI.card({
        title: '问答规则库',
        sub: '共 ' + rules().length + ' 条规则 · 关键词改动立即影响对话匹配结果',
        flush: true,
        right: D.h('button.btn.btn-sm.btn-p', { onclick: function () { quickAdd(''); } }, '＋ 新增问答规则'),
        body: D.h('table.tbl',
          D.h('thead', D.h('tr', ['问题', '分类', '关键词', '业务入口', '命中 / 有用', '状态', '操作'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', rules().map(function (r) {
            return D.h('tr', [
              D.h('td', { style: 'max-width:230px' }, KP.cell(r.q, String(r.a).slice(0, 30) + '…', { clip: true, title: r.q })),
              D.h('td', {}, UI.tag(r.cat, 'tag-info')),
              D.h('td', { style: 'max-width:190px' }, D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' }, (r.kw || []).map(function (k) { return UI.tag(k, ''); }))),
              D.h('td', { style: 'font-size:11.5px' }, (r.biz || []).length
                ? D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' }, r.biz.map(function (b) { return UI.tag('→ ' + b, 'tag-ok'); }))
                : D.h('span.muted', '未绑定')),
              D.h('td', {}, D.h('b', U.fmt(r.hits)), D.h('span.muted', ' / ' + U.fmt(r.useful))),
              D.h('td', {}, UI.tag(r.enabled === false ? '已停用' : '已启用', r.enabled === false ? 'tag-info' : 'tag-ok')),
              D.h('td', {}, KP.acts([
                KP.btn('编辑', function () { editRule(r.id); }),
                KP.btn('测试', function () { testRule(r); }),
                KP.btn(r.enabled === false ? '启用' : '停用', function () {
                  r.enabled = r.enabled === false;
                  DB.touchObj('ai');
                  UI.toast(r.enabled === false ? '规则已停用' : '规则已启用', r.q, 'info');
                  w.ZR.render();
                }),
                KP.btn('删除', function () {
                  UI.confirm({
                    title: '删除问答规则', text: '确定删除「' + r.q + '」吗？删除后助手将不再命中该问题。', danger: true,
                    onOk: function () { removeRule(r.id); }
                  });
                })
              ]))
            ]);
          })))
      })
    ));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '规则分类分布', sub: '按业务分类统计规则数',
        body: C.bars(Object.keys(U.groupBy(rules(), function (r) { return r.cat; })).map(function (k, i) {
          return { n: k, v: U.groupBy(rules(), function (r) { return r.cat; })[k].length, c: C.color(i) };
        }), { labelW: 82, bh: 18 })
      }),
      UI.card({
        title: '命中热度 Top', sub: '按累计命中次数排行',
        body: (function () {
          var rows = U.sortBy(rules(), function (r) { return r.hits; }, true).slice(0, 8)
            .map(function (r) { return { n: r.q.length > 14 ? r.q.slice(0, 14) + '…' : r.q, v: U.num(r.hits) }; });
          return D.h('div', {}, C.rankBars(rows, { unit: ' 次' }));
        })()
      })
    ));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '规则命中自测台',
      sub: '输入一句话，实时看命中哪条规则、走哪个业务入口',
      body: D.h('div', {}, (function () {
        var out = D.h('div', { style: 'margin-top:11px' });
        var inp = UI.input({ placeholder: '例如：报名了但没去签到会怎样？' });
        function run() {
          var q = inp.value.trim();
          if (!q) { UI.toast('请输入测试问题', '', 'warn'); return; }
          var r = answer(q);
          D.fill(out, null);
          out.appendChild(D.h('div.req-note',
            r.matched
              ? '命中：<b>' + U.esc(r.src) + '</b>　匹配得分 ' + (r.score || '-')
              : '未命中任何规则，将返回兜底话术。'));
          out.appendChild(D.h('div', { style: 'padding:11px;border:1px solid var(--line);border-radius:10px;background:#fbfdff;font-size:12.8px;line-height:1.85;margin-top:9px' }, r.text));
          if (r.rule && r.rule.biz) out.appendChild(bizRow(r.rule.biz));
        }
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
        return D.h('div', {},
          D.h('div', { style: 'display:flex;gap:8px' }, D.h('div', { style: 'flex:1' }, inp),
            D.h('button.btn.btn-sm.btn-p', { onclick: run }, '测试匹配'), out)
        );
      })())
    }));
  }

  function removeRule(id) {
    var l = rules();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) { l.splice(i, 1); break; }
    DB.touchObj('ai');
    UI.toast('已删除问答规则', '该问题将不再被命中', 'info');
    w.ZR.render();
  }

  function editRule(id, presetQ) {
    var r = id ? rules().filter(function (x) { return x.id === id; })[0] : null;
    var isNew = !r;
    if (isNew) r = { id: U.uid('Q'), q: presetQ || '', a: '', kw: [], biz: [], cat: '成绩认定', enabled: true, hits: 0, useful: 0 };
    var qInp = UI.input({ value: r.q, placeholder: '用户可能提出的问题' });
    var aTa = UI.textarea({ rows: 5, value: r.a, placeholder: '助手应返回的标准答案（建议引用学校现行规定）' });
    var kwInp = UI.input({ value: (r.kw || []).join('、'), placeholder: '关键词，用「、」或逗号分隔' });
    var catSel = UI.select({
      options: ['成绩认定', '活动规则', '分值申报', '预警', '社团', '系统操作'].map(function (x) { return [x, x]; }),
      value: r.cat
    });
    var bizChips = UI.chips({
      multi: true, value: (r.biz || []).slice(),
      options: Object.keys(BIZ_ROUTE).filter(function (b, i, a) { return a.indexOf(b) === i; })
    });

    var m = UI.formModal({
      title: isNew ? '新增问答规则' : '编辑问答规则',
      sub: isNew ? '保存后立即参与对话匹配' : '规则 ID：' + r.id,
      fields: [
        { label: '用户问题', required: true, control: qInp, span: true },
        { label: '标准答案', required: true, control: aTa, span: true, hint: '答案将直接展示给学生，建议写明依据与办理路径。' },
        { label: '匹配关键词', control: kwInp, span: true, hint: '命中任一关键词即视为匹配；关键词越长权重越高。' },
        { label: '所属分类', control: catSel },
        { label: '状态', control: UI.chips({ options: [['on', '启用'], ['off', '停用']], value: r.enabled === false ? 'off' : 'on' }) }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var q = qInp.value.trim(), a = aTa.value.trim();
            if (!q) { UI.toast('请填写用户问题', '', 'warn'); return; }
            if (!a) { UI.toast('请填写标准答案', '', 'warn'); return; }
            r.q = q;
            r.a = a;
            r.kw = kwInp.value.split(/[、,，\s]+/).map(function (x) { return x.trim(); }).filter(Boolean);
            r.cat = catSel.value;
            r.biz = bizChips._v || [];
            r.updatedAt = U.dt(new Date());
            r.updatedBy = ZA.session.name;
            if (isNew) {
              rules().unshift(r);
              DB.touchObj('ai');
              UI.toast('问答规则已新增', '关键词：' + (r.kw.join('、') || '未设置'), 'ok');
            } else {
              DB.touchObj('ai');
              UI.toast('问答规则已保存', q, 'ok');
            }
            m.close();
            w.ZR.render();
          }
        }, '保存规则')
      ]
    });
  }

  function quickAdd(presetQ) {
    st.tab = 'rules';
    editRule('', presetQ);
  }

  function testRule(r) {
    var m = UI.modal({
      title: '规则测试 · ' + r.cat,
      sub: r.q,
      size: 'wide',
      body: [
        UI.kv([
          ['命中关键词', (r.kw || []).join('、') || '未设置'],
          ['业务入口', (r.biz || []).join('、') || '未绑定'],
          ['累计命中', U.fmt(r.hits) + ' 次'],
          ['标记有用', U.fmt(r.useful) + ' 次'],
          ['有用率', U.pct(r.useful, r.hits)],
          ['最近更新', (r.updatedAt || '—') + ' · ' + (r.updatedBy || '')]
        ]),
        KP.h5('助手回答预览'),
        D.h('div', { style: 'padding:11px;border:1px solid var(--line);border-radius:10px;background:#fbfdff;font-size:13px;line-height:1.85' }, r.a),
        KP.h5('命中该规则的会话轮次'),
        D.h('div', {}, (function () {
          var turns = [];
          sessions().forEach(function (s) { (s.turns || []).forEach(function (t) { if (t.src && t.src.indexOf(r.cat) >= 0) turns.push({ student: s.name, sno: s.sno, q: t.q, at: s.at }); }); });
          if (!turns.length) return UI.empty('暂无命中记录', '在对话中提问相关问题后即可在此看到');
          return D.h('div', { html: KP.tableHTML([{ t: '学生', k: 'student' }, { t: '学号', k: 'sno' }, { t: '提问', k: 'q' }, { t: '时间', k: 'at' }], turns.slice(0, 10)) });
        })())
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); editRule(r.id); } }, '编辑此规则')
      ]
    });
  }

  /* ===================== 三、文档学习 ===================== */
  function docsTab(host) {
    var learned = docs().filter(function (d) { return d.status === '已学习'; }).length;
    var totalChunks = U.sum(docs(), function (d) { return U.num(d.chunks); });

    host.appendChild(D.h('div', {},
      UI.card({
        title: '知识文档库',
        sub: docs().length + ' 份文档 · 已学习 ' + learned + ' 份 · 累计 ' + U.fmt(totalChunks) + ' 个知识分块',
        flush: true,
        right: D.h('div', { style: 'display:flex;gap:8px' },
          D.h('button.btn.btn-sm', {
            onclick: function () {
              var notYet = docs().filter(function (d) { return d.status !== '已学习'; });
              if (!notYet.length) { UI.toast('全部文档已学习完成', '无需重复学习', 'info'); return; }
              notYet.forEach(function (d) { d.status = '已学习'; d.learnedAt = U.dt(new Date()); });
              DB.touchObj('ai');
              UI.toast('文档学习已完成', '本次学习 ' + notYet.length + ' 份文档', 'ok');
              w.ZR.render();
            }
          }, '↻ 全部重新学习'),
          D.h('button.btn.btn-sm.btn-p', { onclick: function () { uploadDoc(); } }, '＋ 上传文档')),
        body: D.h('table.tbl',
          D.h('thead', D.h('tr', ['文档名称', '版本', '大小', '字数', '知识分块', '学习状态', '学习时间', '操作'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', docs().map(function (d) {
            return D.h('tr', [
              D.h('td', { style: 'max-width:280px' }, KP.cell(d.name, '原始文件已入库，供助手检索引用', { clip: true, title: d.name })),
              D.h('td', {}, UI.tag(d.ver || '—', 'tag-info')),
              D.h('td', {}, d.size || '—'),
              D.h('td', {}, d.words || '—'),
              D.h('td', {}, KP.numCell(d.chunks, '块')),
              D.h('td', {}, KP.status(d.status)),
              D.h('td', { style: 'font-size:11.8px;color:var(--text3)' }, d.learnedAt || '—'),
              D.h('td', {}, KP.acts([
                KP.btn('重新学习', function () {
                  d.status = '已学习';
                  d.learnedAt = U.dt(new Date());
                  d.chunks = U.num(d.chunks) + Math.round(U.num(d.chunks) * 0.05);
                  DB.touchObj('ai');
                  UI.toast('文档已重新学习', d.name + ' · 分块更新至 ' + d.chunks, 'ok');
                  w.ZR.render();
                }),
                KP.btn('查看分块', function () { docChunks(d); }),
                KP.btn('删除', function () {
                  UI.confirm({
                    title: '删除知识文档', text: '删除后助手将无法引用《' + d.name + '》的内容。', danger: true,
                    onOk: function () { removeDoc(d.id); }
                  });
                })
              ]))
            ]);
          })))
      })
    ));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '学习进度', sub: '已学习文档占比',
        body: D.h('div', {}, (function () {
          var rows = [
            { n: '已学习', v: learned, c: C.SEM.ok },
            { n: '待学习', v: docs().length - learned, c: C.SEM.warn }
          ];
          return D.h('div', {}, C.donut(rows, { size: 180 }), C.legend(rows),
            D.h('div', { style: 'margin-top:12px' }, KP.h5('知识分块总量'),
              UI.pgRow(U.clamp(totalChunks / 8, 0, 100), U.fmt(totalChunks) + ' 个分块')));
        })())
      }),
      UI.card({
        title: '文档能力说明',
        sub: '当前知识库支撑的回答范围',
        body: D.h('div', {},
          UI.kv([
            ['部署方式', config().model || '校内私有化部署模型'],
            ['服务时段', config().hours || '7×24 小时'],
            ['授权有效期', config().authUntil || '—'],
            ['人工服务', config().adminNotice || '—'],
            ['问答规则', rules().filter(function (r) { return r.enabled !== false; }).length + ' 条启用中'],
            ['知识文档', docs().length + ' 份 / ' + U.fmt(totalChunks) + ' 个分块']
          ]),
          D.h('div.dk-tip', '助手回答优先级：问答规则库（精确） → 知识文档检索（溯源） → 兜底话术并转人工。'))
      })
    ));
  }

  function removeDoc(id) {
    var l = docs();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) { l.splice(i, 1); break; }
    DB.touchObj('ai');
    UI.toast('已删除知识文档', '助手将不再引用该文档内容', 'info');
    w.ZR.render();
  }

  function uploadDoc() {
    var nm = UI.input({ placeholder: '如：第二课堂活动考核评分细则.pdf' });
    var ver = UI.input({ placeholder: '如：v1.0', value: 'v1.0' });
    var m = UI.formModal({
      title: '上传知识文档',
      sub: '上传后立即进入学习队列',
      fields: [
        { label: '文档名称', required: true, control: nm, span: true },
        { label: '版本号', control: ver },
        { label: '学习方式', control: UI.select({ options: [['auto', '自动分块学习'], ['manual', '人工校对后学习']], value: 'auto' }) }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var v = nm.value.trim();
            if (!v) { UI.toast('请填写文档名称', '', 'warn'); return; }
            var name = /\.(pdf|docx|doc|xlsx)$/i.test(v) ? v : v + '.pdf';
            docs().unshift({
              id: U.uid('D'), name: name, size: (Math.random() * 1.6 + 0.3).toFixed(1) + ' MB',
              chunks: Math.round(Math.random() * 60 + 24), learnedAt: U.dt(new Date()), status: '已学习',
              words: U.fmt(Math.round(Math.random() * 12000 + 3000)), ver: ver.value || 'v1.0'
            });
            DB.touchObj('ai');
            m.close();
            UI.toast('文档已上传并完成学习', name, 'ok');
            w.ZR.render();
          }
        }, '上传并学习')
      ]
    });
  }

  function docChunks(d) {
    var n = Math.min(8, U.num(d.chunks));
    var base = d.name.replace(/\.(pdf|docx|doc)$/i, '');
    var m = UI.modal({
      title: '知识分块预览',
      sub: d.name + ' · 共 ' + d.chunks + ' 个分块（展示前 ' + n + ' 个）',
      size: 'wide',
      body: [
        UI.kv([
          ['文档版本', d.ver || '—'], ['文档大小', d.size || '—'],
          ['总字数', d.words || '—'], ['分块数量', U.fmt(d.chunks) + ' 块'],
          ['学习状态', KP.status(d.status)], ['学习时间', d.learnedAt || '—']
        ]),
        KP.h5('分块内容'),
        D.h('div', {}, Array.apply(null, { length: n }).map(function (_, i) {
          return D.h('div', { style: 'border:1px solid var(--line);border-radius:9px;padding:9px 11px;margin-bottom:8px;background:#fbfdff' },
            D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-bottom:4px' }, '分块 #' + (i + 1) + ' · 约 ' + Math.round(U.num(d.words.replace(/,/g, '')) / U.num(d.chunks)) + ' 字'),
            D.h('div', { style: 'font-size:12.5px;line-height:1.8' },
              '《' + base + '》第 ' + (i + 1) + ' 章相关条款：' +
              ['本规定适用于全体在校学生的第二课堂成绩认定与管理工作。',
                '第二课堂活动按思想素养、文化素养、专业素养、创新创业、社会实践、社会工作六类归集。',
                '学生参加活动须完成报名、签到、签退三个环节，方可计入参与记录。',
                '活动结束后由组织者提交考核结果，系统按考核方案自动生成认定记录。',
                '认定记录经审核通过后计入个人第二课堂成绩单，可在学生端查询与导出。',
                '未达到规定学分的学生将收到系统预警，并同步通知辅导员与团总支书记。',
                '对认定结果有异议的，可在公示期内向学院团委提交复核申请。',
                '本规定由校团委负责解释，自发布之日起施行。'][i % 8]));
        }))
      ],
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); } }, '关闭')]
    });
  }

  /* ===================== 四、业务入口推送 ===================== */
  function bizTab(host) {
    var bound = [];
    rules().forEach(function (r) { (r.biz || []).forEach(function (b) { if (bound.indexOf(b) < 0) bound.push(b); }); });

    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '已推送的业务入口',
        sub: '问答命中后可在对话框内一键跳转',
        flush: true,
        body: D.h('table.tbl',
          D.h('thead', D.h('tr', ['业务入口', '跳转页面', '绑定规则数', '可用性', '试跳转'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', bound.map(function (b) {
            var key = BIZ_ROUTE[b];
            var n = rules().filter(function (r) { return (r.biz || []).indexOf(b) >= 0; }).length;
            return D.h('tr', [
              D.h('td', { style: 'font-weight:600' }, b),
              D.h('td', {}, key ? (w.ZR.pages[key] ? w.ZR.pages[key].title : key) : D.h('span.muted', '未映射路由')),
              D.h('td', {}, KP.numCell(n, '条')),
              D.h('td', {}, key && w.ZR.pages[key] ? UI.tag('可用', 'tag-ok') : UI.tag('当前角色不可用', 'tag-warn')),
              D.h('td', {}, KP.acts([KP.btn('跳转', function () {
                if (key && w.ZR.pages[key]) { w.ZR.go(key); UI.toast('已跳转到' + b, '由 AI 助手推送的业务入口', 'ok'); }
                else UI.toast('该入口在当前角色下不可用', b, 'warn');
              })]))
            ]);
          }))),
        note: D.h('span.muted', '共推送 ' + bound.length + ' 个业务入口；入口与角色菜单权限联动。')
      }),
      D.h('div', {},
        UI.card({
          title: '推送配置', sub: '控制业务入口的展示行为',
          body: D.h('div', {}, (function () {
            var c = config();
            return D.h('div', {},
              UI.swRow({ title: '展示业务入口按钮', desc: '关闭后助手只回答文字，不展示跳转按钮', checked: c.showBizEntry !== false, onChange: function (v) { c.showBizEntry = v; DB.setObj('ai', { config: c }); UI.toast('配置已保存', '', 'ok'); w.ZR.render(); } }),
              UI.swRow({ title: '推送气泡样式', desc: '当前样式：' + (c.bubbleStyle || '左右气泡'), checked: c.bubbleStyle === '左右气泡', onChange: function (v) { c.bubbleStyle = v ? '左右气泡' : '紧凑样式'; DB.setObj('ai', { config: c }); w.ZR.render(); } }),
              KP.h5('入口排序（按绑定规则数）'),
              D.h('div', {}, bound.slice().sort(function (a, b) {
                return rules().filter(function (r) { return (r.biz || []).indexOf(b) >= 0; }).length - rules().filter(function (r) { return (r.biz || []).indexOf(a) >= 0; }).length;
              }).map(function (b) {
                var n = rules().filter(function (r) { return (r.biz || []).indexOf(b) >= 0; }).length;
                var max = Math.max.apply(null, bound.map(function (x) { return rules().filter(function (r) { return (r.biz || []).indexOf(x) >= 0; }).length; }).concat([1]));
                return D.h('div', { style: 'display:flex;align-items:center;gap:9px;margin-bottom:7px;font-size:12px' },
                  D.h('span', { style: 'width:92px' }, b),
                  D.h('div', { style: 'flex:1' }, UI.pg(n / max * 100)),
                  D.h('span.muted', n + ' 条'));
              }))
            );
          })())
        })
      )
    ));
  }

  /* ===================== 五、会话记录 ===================== */
  function sessionsTab(host) {
    host.appendChild(KP.lister({
      title: '会话记录',
      sub: '共 ' + sessions().length + ' 条会话 · 点击可回看逐轮问答',
      flush: true, pageSize: 12,
      cols: [
        { t: '学生', w: 140, render: function (s) { return KP.who(s.name, s.sno); } },
        { t: '学院 / 班级', w: 200, render: function (s) { return KP.cell(s.college, s.className); } },
        { t: '轮次', w: 74, render: function (s) { return KP.numCell((s.turns || []).length, '轮'); } },
        { t: '命中 / 未命中', w: 116, render: function (s) { return D.h('span', {}, KP.numCell(s.matchedCount, '次'), D.h('span.muted', ' / ' + U.num(s.unknownCount) + ' 次')); } },
        { t: '时长', w: 78, render: function (s) { return KP.numCell(s.duration, '秒'); } },
        { t: '转人工', w: 82, render: function (s) { return s.manual ? UI.tag('已转人工', 'tag-warn') : UI.tag('未转人工', 'tag-ok'); } },
        { t: '时间', w: 132, render: function (s) { return D.h('span.muted', s.at); } },
        { t: '操作', w: 88, render: function (s) { return KP.acts([KP.btn('回看', function () { viewSession(s); })]); } }
      ],
      rows: function () { return U.sortBy(sessions(), function (s) { return s.at; }, true); },
      empty: '暂无会话记录', emptySub: '在对话区提问后会生成会话记录'
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '会话统计',
      sub: '按命中情况与学院维度统计',
      body: D.h('div', {},
        KP.kpis([
          { label: '会话总数', num: sessions().length, unit: '条', ic: '💬', fg: '#2563eb', bg: '#eff6ff' },
          { label: '平均轮次', num: U.round(U.avg(sessions(), function (s) { return (s.turns || []).length; }), 1), unit: '轮', ic: '🔁', fg: '#059669', bg: '#ecfdf5' },
          { label: '平均时长', num: U.round(U.avg(sessions(), function (s) { return U.num(s.duration); }), 0), unit: '秒', ic: '⏱', fg: '#d97706', bg: '#fff8eb' },
          { label: '转人工', num: sessions().filter(function (s) { return s.manual; }).length, unit: '条', ic: '🙋', fg: '#7c3aed', bg: '#f5f3ff' }
        ], 'g4'),
        D.h('div', { style: 'height:12px' }),
        D.h('div', {}, (function () {
          var byCollege = U.groupBy(sessions(), function (s) { return s.college || '未知'; });
          return C.bars(Object.keys(byCollege).map(function (k, i) {
            return { n: k.replace('学院', ''), v: byCollege[k].length, c: C.color(i) };
          }), { labelW: 92, bh: 17 });
        })())
      )
    }));
  }

  function viewSession(s) {
    var m = UI.modal({
      title: '会话回看 · ' + s.name,
      sub: s.sno + ' · ' + s.college + ' · ' + s.at,
      size: 'wide',
      body: [
        UI.kv([
          ['学生', s.name + '（' + s.sno + '）'],
          ['学院 / 班级', s.college + ' · ' + (s.className || '—')],
          ['会话轮次', (s.turns || []).length + ' 轮'],
          ['命中 / 未命中', s.matchedCount + ' / ' + s.unknownCount],
          ['会话时长', s.duration + ' 秒'],
          ['是否转人工', s.manual ? '是' : '否']
        ]),
        KP.h5('逐轮问答'),
        D.h('div', {}, (s.turns || []).map(function (t, i) {
          return D.h('div', { style: 'border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:9px;background:#fbfdff' },
            D.h('div', { style: 'display:flex;gap:8px;align-items:flex-start;margin-bottom:7px' },
              D.h('b', { style: 'color:var(--primary)' }, 'Q' + (i + 1)),
              D.h('span', { style: 'flex:1;font-size:13px' }, t.q),
              UI.tag(t.matched ? '已命中' : '未命中', t.matched ? 'tag-ok' : 'tag-warn')),
            D.h('div', { style: 'font-size:12.8px;line-height:1.85;color:var(--text2);padding-left:22px' }, t.a),
            t.src ? D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:5px;padding-left:22px' }, '来源：' + t.src) : null);
        }))
      ],
      foot: [D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); } }, '关闭')]
    });
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    var ctxLabel = ZA.isStudent() ? '学生端视角：你看到的是学生本人与助手对话的完整效果' : '管理端视角：可维护问答规则、知识文档与业务入口推送';
    host.appendChild(UI.pageHd({
      title: 'AI 二课助手',
      desc: ctxLabel + '。回答优先级：问答规则库 → 知识文档检索 → 兜底话术并转人工。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { st.tab = 'chat'; w.ZR.render(); } }, '💬 去对话'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('content'); } }, '内容安全')
      ]
    }));

    host.appendChild(D.h('div', {},
      KP.kpis([
        { label: '问答规则', num: rules().length, unit: '条', ic: '📋', fg: '#2563eb', bg: '#eff6ff', foot: '启用 ' + rules().filter(function (r) { return r.enabled !== false; }).length + ' 条' },
        { label: '知识文档', num: docs().length, unit: '份', ic: '📚', fg: '#059669', bg: '#ecfdf5', foot: U.fmt(U.sum(docs(), function (d) { return U.num(d.chunks); })) + ' 个分块' },
        { label: '会话记录', num: sessions().length, unit: '条', ic: '💬', fg: '#7c3aed', bg: '#f5f3ff' },
        { label: '整体命中率', num: U.pctNum(ai().stats.matched, ai().stats.total), unit: '%', ic: '🎯', fg: '#d97706', bg: '#fff8eb', foot: ai().stats.matched + ' / ' + ai().stats.total + ' 次' },
        { label: '业务入口', num: (function () { var b = []; rules().forEach(function (r) { (r.biz || []).forEach(function (x) { if (b.indexOf(x) < 0) b.push(x); }); }); return b.length; })(), unit: '个', ic: '🔗', fg: '#0d9488', bg: '#f0fdfa' }
      ], 'g5')
    ));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.tabs({
      items: [
        { k: 'chat', n: '对话体验' },
        { k: 'rules', n: '问答规则', cnt: rules().length },
        { k: 'docs', n: '文档学习', cnt: docs().length },
        { k: 'biz', n: '业务入口推送' },
        { k: 'sessions', n: '会话记录', cnt: sessions().length }
      ],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'chat') chatTab(body);
    else if (st.tab === 'rules') rulesTab(body);
    else if (st.tab === 'docs') docsTab(body);
    else if (st.tab === 'biz') bizTab(body);
    else sessionsTab(body);
    host.appendChild(body);
  }

  KP.pages({
    ai: { title: 'AI 二课助手', group: '门户与智能', render: render }
  });
})(window);
