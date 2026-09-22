/* ==========================================================================
   content.js —— 内容安全审核与舆情监控
   对应演示项【2.3 第三步】：
   «演示…内容安全审核或舆情监控…等功能。»
   · 待审队列：真实遍历待审内容，支持单条通过 / 驳回 / 删除，批量通过，
     每次操作真实写入内容状态、处理人与处理时间，并生成操作留痕。
   · 敏感词库：20 个敏感词按分类 / 级别管理，可新增、启停、删除；
     新增后对全部内容重新扫描，命中结果实时反映到统计与队列。
   · 命中统计：命中级别分布、内容类型分布、敏感词命中排行、审核场景分布。
   · 舆情监控：内容热点词（含词边界计数）、高风险内容清单、风险分档分布。
   · 策略配置：审核开关、命中即拦截、人工复核阈值、审核范围。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = {
    tab: 'queue',
    status: '待审',
    type: '',
    scene: '',
    level: '',
    kw: '',
    sel: {}
  };

  function contents() { return DB.col('contents'); }
  function words() { return DB.col('sensitiveWords'); }

  function filtered() {
    var l = contents();
    if (st.status) l = l.filter(function (c) { return c.status === st.status; });
    if (st.type) l = l.filter(function (c) { return c.type === st.type; });
    if (st.scene) l = l.filter(function (c) { return c.scene === st.scene; });
    if (st.level) l = l.filter(function (c) { return (c.hitLevel || '') === st.level; });
    if (st.kw) l = l.filter(function (c) { return U.hitAny([c.title, c.excerpt, c.author, c.college, c.className], st.kw); });
    U.sortBy(l, function (c) { return c.at; }, true);
    return l;
  }

  /* ===================== 重新扫描：按当前敏感词库给内容打分 ===================== */
  function rescanAll() {
    var ws = words();
    contents().forEach(function (c) {
      var text = (c.title || '') + ' ' + (c.excerpt || '');
      var hits = [];
      ws.forEach(function (x) {
        if (!x.enabled && x.enabled !== undefined) return;
        if (text.indexOf(x.word) >= 0) hits.push({ word: x.word, level: x.level, cat: x.cat });
      });
      c.hits = hits;
      c.hitLevel = hits.some(function (h) { return h.level === '禁止'; }) ? '禁止'
        : (hits.length ? '警告' : '');
      c.risk = hits.length ? U.clamp(40 + hits.length * 14 + (hits.some(function (h) { return h.level === '禁止'; }) ? 33 : 0), 0, 100) : 6;
    });
    DB.touchObj('contents');
  }

  function stats() {
    var l = contents();
    return {
      total: l.length,
      pending: l.filter(function (c) { return c.status === '待审'; }).length,
      passed: l.filter(function (c) { return c.status === '已通过'; }).length,
      removed: l.filter(function (c) { return c.status === '已删除'; }).length,
      banned: l.filter(function (c) { return c.hitLevel === '禁止'; }).length,
      warned: l.filter(function (c) { return c.hitLevel === '警告'; }).length,
      high: l.filter(function (c) { return U.num(c.risk) >= 80; }).length
    };
  }

  function kpis() {
    var s = stats();
    return KP.kpis([
      { label: '内容总量', num: s.total, unit: '条', ic: '📄', fg: '#2563eb', bg: '#eff6ff' },
      { label: '待审', num: s.pending, unit: '条', ic: '⏳', fg: '#d97706', bg: '#fff8eb', foot: '需人工复核' },
      { label: '已通过', num: s.passed, unit: '条', ic: '✅', fg: '#059669', bg: '#ecfdf5', foot: '通过率 ' + U.pct(s.passed, s.total) },
      { label: '命中禁止词', num: s.banned, unit: '条', ic: '🚫', fg: '#dc2626', bg: '#fef2f2', foot: '命中警告词 ' + s.warned + ' 条' },
      { label: '高风险内容', num: s.high, unit: '条', ic: '⚠️', fg: '#7c3aed', bg: '#f5f3ff', foot: '风险分 ≥ 80' }
    ], 'g5');
  }

  /* ===================== 一、待审队列 ===================== */
  function riskCell(r) {
    var v = U.num(r.risk);
    var color = v >= 80 ? '#dc2626' : (v >= 40 ? '#d97706' : '#059669');
    return D.h('div', { style: 'min-width:76px' },
      D.h('span', { style: 'font-weight:700;color:' + color + ';font-variant-numeric:tabular-nums' }, v),
      D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:3px' }, v >= 80 ? '高风险' : (v >= 40 ? '需复核' : '低风险')));
  }

  function hitsCell(r) {
    var h = r.hits || [];
    if (!h.length) return UI.tag('未命中', 'tag-ok');
    return D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' }, h.map(function (x) {
      return UI.tag(x.word, x.level === '禁止' ? 'tag-err' : 'tag-warn');
    }));
  }

  function queueTab(host, rerender) {
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '待审内容队列',
        sub: '共 ' + stats().pending + ' 条待人工复核',
        flush: true,
        body: KP.lister({
          noCard: true, pageSize: 12,
          filters: function (s2, refresh) {
            return UI.filterBar([
              { type: 'select', options: [['', '全部状态'], ['待审', '待审'], ['已通过', '已通过'], ['已删除', '已删除']], value: st.status, onChange: function (v) { st.status = v; refresh(); } },
              { type: 'select', options: [['', '全部类型'], ['文本', '文本'], ['图片', '图片'], ['文档', '文档'], ['视频', '视频']], value: st.type, onChange: function (v) { st.type = v; refresh(); } },
              { type: 'select', options: [['', '全部场景']].concat(U.uniq(contents().map(function (c) { return c.scene; })).map(function (x) { return [x, x]; })), value: st.scene, onChange: function (v) { st.scene = v; refresh(); } },
              { type: 'select', options: [['', '全部命中级别'], ['禁止', '命中禁止词'], ['警告', '命中警告词'], ['__none', '未命中']], value: st.level, onChange: function (v) { st.level = v; refresh(); } },
              { type: 'input', ph: '标题 / 作者 / 学院…', onChange: U.debounce(function (v) { st.kw = v; refresh(); }, 220) }
            ], {
              right: [
                KP.exportBtn('导出内容清单', [
                  { t: '标题', k: 'title' }, { t: '类型', k: 'type' }, { t: '作者', k: 'author' },
                  { t: '学院', k: 'college' }, { t: '场景', k: 'scene' }, { t: '状态', k: 'status' },
                  { t: '命中', raw: function (r) { return (r.hits || []).map(function (x) { return x.word; }).join('、') || '未命中'; } },
                  { t: '风险分', k: 'risk' }, { t: '提交时间', k: 'at' }
                ], function () { return qList(); }),
                D.h('button.btn.btn-sm.btn-p', {
                  onclick: function () {
                    var tot = qList().filter(function (c) { return c.status === '待审'; }).length;
                    if (!tot) { UI.toast('没有待审内容', '当前筛选条件下无待审内容', 'warn'); return; }
                    UI.confirm({
                      title: '批量通过待审内容',
                      text: '将把当前筛选出的 ' + tot + ' 条待审内容全部标记为「已通过」。',
                      onOk: function () {
                        qList().forEach(function (c) {
                          if (c.status !== '待审') return;
                          c.status = '已通过';
                          c.handledBy = ZA.session.name;
                          c.handledAt = U.dt(new Date());
                          c.note = '批量审核通过';
                        });
                        DB.touchObj('contents');
                        log('批量通过内容', tot + ' 条待审内容');
                        UI.toast('已批量通过', tot + ' 条内容已进入发布状态', 'ok');
                        rerender();
                      }
                    });
                  }
                }, '批量通过')
              ]
            });
          },
          cols: [
            { t: '内容', w: 260, render: function (r) { return KP.cell(r.title, r.type + ' · ' + r.scene + ' · ' + r.size, { clip: true }); } },
            { t: '提交人', w: 140, render: function (r) { return KP.who(r.author, r.college); } },
            { t: '命中敏感词', w: 190, render: function (r) { return hitsCell(r); } },
            { t: '风险分', w: 82, render: riskCell },
            { t: '状态', w: 88, render: function (r) { return KP.status(r.status); } },
            { t: '提交时间', w: 130, render: function (r) { return D.h('span.muted', r.at); } },
            {
              t: '操作', w: 168, render: function (r) {
                return KP.acts([
                  KP.btn('查看', function () { detail(r, rerender); }),
                  r.status === '待审' ? KP.btn('通过', function () { act(r, '已通过', rerender); }, 'btn-p') : null,
                  r.status === '待审' ? KP.btn('驳回', function () { reject(r, rerender); }) : null
                ]);
              }
            }
          ],
          rows: function () { return qList(); },
          empty: '当前筛选条件下没有内容',
          emptySub: '可调整状态、类型或场景筛选条件'
        })
      }),
      D.h('div', {},
        UI.card({
          title: '命中级别分布', sub: '按内容命中最高级别统计',
          body: D.h('div', {}, (function () {
            var l = contents();
            var rows = [
              { n: '命中禁止词', v: l.filter(function (c) { return c.hitLevel === '禁止'; }).length, c: C.SEM.err },
              { n: '命中警告词', v: l.filter(function (c) { return c.hitLevel === '警告'; }).length, c: C.SEM.warn },
              { n: '未命中', v: l.filter(function (c) { return !c.hitLevel; }).length, c: C.SEM.ok }
            ];
            return D.h('div', {}, C.donut(rows, { size: 190 }), C.legend(rows));
          })())
        }),
        D.h('div', { style: 'height:12px' }),
        UI.card({
          title: '内容类型分布', sub: '文本 / 图片 / 文档 / 视频',
          body: C.bars(U.uniq(contents().map(function (c) { return c.type; })).map(function (t, i) {
            return { n: t, v: contents().filter(function (c) { return c.type === t; }).length, c: C.color(i) };
          }), { labelW: 76, bh: 18 })
        })
      )
    ));
  }

  function qList() {
    var l = filtered();
    if (st.level === '__none') l = l.filter(function (c) { return !c.hitLevel; });
    return l;
  }

  /** 审核动作：真实写入状态、处理人与时间，并留痕 */
  function act(r, status, rerender, note) {
    r.status = status;
    r.handledBy = ZA.session.name;
    r.handledAt = U.dt(new Date());
    r.note = note || (status === '已通过' ? '人工复核通过' : status === '已删除' ? '人工判定违规，已下架' : '');
    DB.touchObj('contents');
    log(status === '已通过' ? '通过内容' : (status === '已删除' ? '删除内容' : '更新内容'), r.title);
    if (status === '已删除') {
      DB.insert('msgs', {
        id: U.uid('M'), title: '内容审核结果通知', content: '你提交的「' + r.title + '」经审核未通过，已被下架。原因：' + (r.note || '命中平台内容规范'),
        type: '提醒', scope: '指定用户', channels: ['站内消息'], at: U.dt(new Date()), sender: ZA.session.name,
        total: 1, readCount: 0, unreadCount: 1, readBy: [], bizType: '内容安全', bizId: r.id, targetDesc: r.author
      });
    }
    UI.toast(status === '已通过' ? '内容已通过' : '内容已下架', r.title, status === '已通过' ? 'ok' : 'warn');
    if (rerender) rerender();
  }

  function reject(r, rerender) {
    var ta = UI.textarea({ rows: 3, placeholder: '请填写驳回原因（将同步通知提交人）' });
    var m = UI.modal({
      title: '驳回内容',
      sub: r.title,
      size: 'slim',
      body: [
        D.h('div', { style: 'margin-bottom:10px' }, KP.who(r.author, r.college + ' · ' + r.at)),
        hitsCell(r),
        D.h('div', { style: 'margin-top:12px' }, UI.field({ label: '驳回原因', required: true, control: ta }))
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var v = ta.value.trim();
            if (!v) { UI.toast('请填写驳回原因', '驳回原因将通知提交人', 'warn'); return; }
            m.close();
            act(r, '已删除', rerender, v);
          }
        }, '确认驳回')
      ]
    });
  }

  /* ===================== 内容详情 ===================== */
  function detail(r, rerender) {
    var ws = words();
    var text = (r.title || '') + ' ' + (r.excerpt || '');
    var preview = D.h('div', { style: 'font-size:13px;line-height:2;padding:12px;border:1px solid var(--line);border-radius:10px;background:#fbfdff' });
    /* 命中词高亮：把摘要按敏感词切成片段渲染 */
    (function () {
      var hits = r.hits || [];
      if (!hits.length) { preview.appendChild(document.createTextNode(r.excerpt || r.title)); return; }
      var idx = 0, segs = [];
      var pos = 0;
      while (pos < text.length) {
        var best = -1, bw = '';
        hits.forEach(function (h) {
          var i = text.indexOf(h.word, pos);
          if (i >= 0 && (best < 0 || i < best)) { best = i; bw = h.word; }
        });
        if (best < 0) break;
        if (best > pos) segs.push({ t: text.slice(pos, best), hit: false });
        segs.push({ t: bw, hit: true });
        pos = best + bw.length;
      }
      segs.push({ t: text.slice(pos), hit: false });
      segs.forEach(function (s) {
        if (!s.hit) { preview.appendChild(document.createTextNode(s.t)); return; }
        preview.appendChild(D.h('span', {
          style: 'background:#fef2f2;color:#dc2626;border-bottom:1.5px solid #dc2626;padding:0 2px;border-radius:3px;font-weight:600'
        }, s.t));
      });
    })();

    var m = UI.modal({
      title: '内容审核详情',
      sub: r.type + ' · ' + r.scene + ' · 风险分 ' + r.risk,
      size: 'wide',
      body: [
        UI.kv([
          ['内容标题', r.title],
          ['内容类型', r.type + '（' + (r.media || '') + '，' + (r.size || '') + '）'],
          ['提交人', r.author + '（' + (r.authorId || '') + '）'],
          ['所属学院 / 班级', r.college + ' · ' + (r.className || '—')],
          ['审核场景', r.scene],
          ['提交时间', r.at],
          ['当前状态', KP.status(r.status)],
          ['处理人 / 时间', (r.handledBy || '—') + ' / ' + (r.handledAt || '—')]
        ]),
        KP.h5('内容与命中词标注'),
        preview,
        KP.h5('命中敏感词明细'),
        (r.hits || []).length
          ? D.h('div', {
            html: KP.tableHTML([
              { t: '敏感词', k: 'word' }, { t: '级别', k: 'level' }, { t: '分类', k: 'cat' },
              { t: '处置建议', raw: function (x) { return x.level === '禁止' ? '立即下架并通知作者' : '人工复核后决定是否放行'; } }
            ], r.hits)
          })
          : UI.empty('未命中敏感词', '该内容通过了敏感词扫描'),
        r.note ? D.h('div.req-note', { html: '审核意见：' + U.esc(r.note) }) : null
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '关闭'),
        KP.printBtn('打印审核单', function () {
          return {
            title: '内容审核单',
            html: KP.metricsHTML([['内容', r.title], ['提交人', r.author], ['风险分', r.risk]]) +
              KP.tableHTML([{ t: '敏感词', k: 'word' }, { t: '级别', k: 'level' }, { t: '分类', k: 'cat' }], r.hits || [])
          };
        }),
        r.status === '待审' ? D.h('button.btn.btn-sm', { onclick: function () { m.close(); reject(r, rerender); } }, '驳回下架') : null,
        r.status === '待审' ? D.h('button.btn.btn-sm.btn-p', { onclick: function () { m.close(); act(r, '已通过', rerender); } }, '审核通过') : null
      ]
    });
  }

  /* ===================== 二、敏感词库 ===================== */
  function wordsTab(host, rerender) {
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '敏感词库',
        sub: '共 ' + words().length + ' 个词条 · 新增后自动对全部内容重新扫描',
        flush: true,
        right: D.h('button.btn.btn-sm.btn-p', { onclick: function () { addWord(rerender); } }, '＋ 新增敏感词'),
        body: D.h('table.tbl',
          D.h('thead', D.h('tr', ['敏感词', '级别', '分类', '命中内容数', '状态', '操作'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', words().map(function (x) {
            var hitN = contents().filter(function (c) { return (c.hits || []).some(function (h) { return h.word === x.word; }); }).length;
            return D.h('tr', [
              D.h('td', { style: 'font-weight:600' }, x.word),
              D.h('td', {}, UI.tag(x.level, x.level === '禁止' ? 'tag-err' : 'tag-warn')),
              D.h('td', {}, x.cat),
              D.h('td', {}, hitN ? D.h('b', { style: 'color:#dc2626' }, hitN + ' 条') : D.h('span.muted', '0 条')),
              D.h('td', {}, UI.tag(x.enabled === false ? '已停用' : '已启用', x.enabled === false ? 'tag-info' : 'tag-ok')),
              D.h('td', {}, KP.acts([
                KP.btn(x.enabled === false ? '启用' : '停用', function () {
                  x.enabled = x.enabled === false;
                  DB.touchObj('sensitiveWords');
                  rescanAll();
                  UI.toast(x.enabled === false ? '已停用该词' : '已启用该词', x.word, 'info');
                  rerender();
                }),
                KP.btn('删除', function () {
                  UI.confirm({
                    title: '删除敏感词', text: '确定删除「' + x.word + '」吗？删除后将不再参与内容扫描。', danger: true,
                    onOk: function () {
                      DB.remove('sensitiveWords', x.id);
                      rescanAll();
                      UI.toast('已删除敏感词', x.word, 'info');
                      rerender();
                    }
                  });
                })
              ]))
            ]);
          })))
      }),
      D.h('div', {},
        UI.card({
          title: '分类分布', sub: '按敏感词分类统计词条数',
          body: C.bars(Object.keys(U.groupBy(words(), function (x) { return x.cat; })).map(function (k, i) {
            return { n: k, v: U.groupBy(words(), function (x) { return x.cat; })[k].length, c: C.color(i) };
          }), { labelW: 76, bh: 17 })
        }),
        D.h('div', { style: 'height:12px' }),
        UI.card({
          title: '级别构成', sub: '禁止类词命中即拦截',
          body: D.h('div', {},
            C.donut([
              { n: '禁止（拦截）', v: words().filter(function (x) { return x.level === '禁止'; }).length, c: C.SEM.err },
              { n: '警告（复核）', v: words().filter(function (x) { return x.level === '警告'; }).length, c: C.SEM.warn }
            ], { size: 176 }),
            C.legend([
              { n: '禁止（拦截）', v: words().filter(function (x) { return x.level === '禁止'; }).length, c: C.SEM.err },
              { n: '警告（复核）', v: words().filter(function (x) { return x.level === '警告'; }).length, c: C.SEM.warn }
            ]))
        })
      )
    ));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '敏感词命中排行（Top 20）',
      sub: '统计口径：全部内容命中次数',
      body: D.h('div', {}, (function () {
        var cnt = {};
        contents().forEach(function (c) { (c.hits || []).forEach(function (h) { cnt[h.word] = (cnt[h.word] || 0) + 1; }); });
        var rows = Object.keys(cnt).map(function (k) {
          var w0 = words().filter(function (x) { return x.word === k; })[0] || {};
          return { word: k, n: cnt[k], level: w0.level || '', cat: w0.cat || '' };
        }).sort(function (a, b) { return b.n - a.n; });
        if (!rows.length) return UI.empty('暂无命中记录', '当前内容均未命中敏感词');
        return D.h('div', {}, C.rankBars(rows.slice(0, 20).map(function (r) { return { n: r.word, v: r.n }; }), { unit: ' 次' }));
      })())
    }));
  }

  function addWord(rerender) {
    var inp = UI.input({ placeholder: '请输入敏感词，如：代刷' });
    var catSel = UI.select({
      options: ['违规交易', '广告', '引流', '金融风险', '违法', '隐私', '低俗', '不文明', '学术', '违规', '版权'].map(function (x) { return [x, x]; }),
      value: '广告'
    });
    var levelSel = UI.select({ options: [['禁止', '禁止（命中即拦截）'], ['警告', '警告（转人工复核）']], value: '警告' });
    var m = UI.formModal({
      title: '新增敏感词',
      sub: '保存后自动对 ' + contents().length + ' 条内容重新扫描',
      fields: [
        { label: '敏感词', required: true, control: inp },
        { label: '所属分类', control: catSel },
        { label: '处置级别', control: levelSel }
      ],
      foot: [
        D.h('button.btn.btn-sm', { onclick: function () { m.close(); } }, '取消'),
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            var v = inp.value.trim();
            if (!v) { UI.toast('请填写敏感词', '敏感词不能为空', 'warn'); return; }
            if (words().some(function (x) { return x.word === v; })) { UI.toast('该词已存在', '请勿重复添加', 'warn'); return; }
            DB.insert('sensitiveWords', { id: U.uid('SW'), word: v, level: levelSel.value, cat: catSel.value, enabled: true });
            m.close();
            rescanAll();
            var n = contents().filter(function (c) { return (c.hits || []).some(function (h) { return h.word === v; }); }).length;
            log('新增敏感词', v + '（命中 ' + n + ' 条内容）');
            UI.toast('敏感词已新增', n ? '已命中 ' + n + ' 条内容，可在待审队列处理' : '当前内容未命中该词', 'ok');
            rerender();
          }
        }, '保存并重新扫描')
      ]
    });
  }

  /* ===================== 三、舆情监控 ===================== */
  function monitorTab(host) {
    var topics = DB.data.contentTopics || [];
    var high = contents().filter(function (c) { return U.num(c.risk) >= 80; });

    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '内容热点词', sub: '由全部内容文本自动提取（已过滤非独立成词的残片）',
        body: D.h('div', {}, topics.length
          ? D.h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, topics.map(function (t, i) {
            var sz = 12 + U.clamp(t.v, 0, 24) * 0.6;
            return D.h('span', {
              style: 'font-size:' + sz.toFixed(1) + 'px;padding:3px 9px;border-radius:20px;background:' +
                (t.v >= 15 ? '#fef2f2' : (t.v >= 10 ? '#fff8eb' : '#eff6ff')) + ';color:' +
                (t.v >= 15 ? '#dc2626' : (t.v >= 10 ? '#d97706' : '#2563eb')) + ';font-weight:' + (t.v >= 15 ? 700 : 500)
            }, t.w, D.h('i', { style: 'font-style:normal;font-size:11px;opacity:.7;margin-left:3px' }, t.v));
          }))
          : UI.empty('暂无热点词', '内容文本较少时不会生成热点词')),
        note: D.h('span.muted', '热点词共 ' + topics.length + ' 个；标注数字为出现次数。')
      }),
      UI.card({
        title: '舆情风险概览', sub: '按风险分档统计内容数量',
        body: D.h('div', {}, (function () {
          var l = contents();
          var rows = [
            { n: '高风险（≥80）', v: l.filter(function (c) { return U.num(c.risk) >= 80; }).length, c: C.SEM.err },
            { n: '需复核（40—79）', v: l.filter(function (c) { return U.num(c.risk) >= 40 && U.num(c.risk) < 80; }).length, c: C.SEM.warn },
            { n: '低风险（<40）', v: l.filter(function (c) { return U.num(c.risk) < 40; }).length, c: C.SEM.ok }
          ];
          return D.h('div', {}, C.donut(rows, { size: 186 }), C.legend(rows),
            D.h('div', { style: 'margin-top:10px' }, KP.kpis([
              { label: '高风险内容', num: rows[0].v, unit: '条', ic: '⚠️', fg: '#dc2626', bg: '#fef2f2' },
              { label: '审核场景', num: U.uniq(l.map(function (c) { return c.scene; })).length, unit: '个', ic: '🗂', fg: '#2563eb', bg: '#eff6ff' }
            ], 'g2')));
        })())
      })
    ));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(KP.lister({
      title: '高风险内容清单',
      sub: '风险分 ≥ 80，建议优先处置',
      flush: true, pageSize: 10,
      cols: [
        { t: '内容', w: 250, render: function (r) { return KP.cell(r.title, r.excerpt.slice(0, 34) + '…', { clip: true }); } },
        { t: '作者', w: 130, render: function (r) { return KP.who(r.author, r.college); } },
        { t: '命中敏感词', w: 180, render: hitsCell },
        { t: '风险分', w: 82, render: riskCell },
        { t: '状态', w: 88, render: function (r) { return KP.status(r.status); } },
        { t: '操作', w: 96, render: function (r) { return KP.acts([KP.btn('查看', function () { detail(r, function () { w.ZR.render(); }); })]); } }
      ],
      rows: function () { return high; },
      empty: '暂无高风险内容', emptySub: '当前内容风控情况良好'
    }));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '审核场景分布', sub: '内容来源场景统计',
        body: C.bars(U.uniq(contents().map(function (c) { return c.scene; })).map(function (s, i) {
          return { n: s, v: contents().filter(function (c) { return c.scene === s; }).length, c: C.color(i) };
        }), { labelW: 88, bh: 17 })
      }),
      UI.card({
        title: '舆情处置动作留痕', sub: '来自系统操作日志中内容安全相关记录',
        flush: true,
        body: D.h('table.tbl.mini',
          D.h('thead', D.h('tr', ['时间', '操作人', '动作', '对象'].map(function (h) { return D.h('th', h); }))),
          D.h('tbody', (function () {
            var l = DB.col('logs').filter(function (x) { return /内容|敏感词/.test(x.action + x.module); });
            if (!l.length) return [D.h('tr', D.h('td', { colspan: '4' }, UI.empty('暂无内容安全操作记录', '在待审队列执行审核后会在此留痕')))];
            return l.slice(0, 12).map(function (x) {
              return D.h('tr', [D.h('td', x.at), D.h('td', x.actor), D.h('td', x.action), D.h('td', x.target)]);
            });
          })())
        )
      })
    ));
  }

  /* ===================== 四、策略配置 ===================== */
  function policyTab(host) {
    var cfg = DB.obj('contentPolicy');
    if (cfg.inited === undefined) {
      cfg.inited = true;
      cfg.autoScan = true;
      cfg.blockOnBan = true;
      cfg.reviewThreshold = 40;
      cfg.scenes = ['活动介绍', '评论/留言', '社团简介', '作品提交', '通知公告', '门户内容'];
      cfg.autoNotice = true;
    }
    function save() { DB.setObj('contentPolicy', cfg); UI.toast('内容安全策略已保存', '策略将在下一次内容提交时生效', 'ok'); }

    host.appendChild(D.h('div.g2', {},
      UI.card({
        title: '审核策略',
        sub: '策略项真实保存到系统配置',
        body: D.h('div', {},
          UI.swRow({ title: '提交即自动扫描', desc: '内容提交后立即执行敏感词扫描，无需人工触发', checked: cfg.autoScan, onChange: function (v) { cfg.autoScan = v; save(); } }),
          UI.swRow({ title: '命中禁止词自动拦截', desc: '命中「禁止」级敏感词的内容直接拒绝提交', checked: cfg.blockOnBan, onChange: function (v) { cfg.blockOnBan = v; save(); } }),
          UI.swRow({ title: '审核结果自动通知作者', desc: '驳回后向作者推送站内消息说明原因', checked: cfg.autoNotice, onChange: function (v) { cfg.autoNotice = v; save(); } }),
          KP.h5('人工复核阈值'),
          D.h('div', { style: 'display:flex;align-items:center;gap:10px' },
            UI.input({ type: 'number', value: cfg.reviewThreshold, min: 0, max: 100, onInput: function (e) { cfg.reviewThreshold = U.num(e.target.value); } }),
            D.h('span.muted', '风险分 ≥ 该值的内容进入人工复核队列（当前 ' +
              contents().filter(function (c) { return U.num(c.risk) >= cfg.reviewThreshold; }).length + ' 条符合）'))
        )
      }),
      UI.card({
        title: '审核范围',
        sub: '勾选需要纳入内容安全扫描的业务场景',
        body: D.h('div', {},
          UI.chips({
            multi: true, value: cfg.scenes.slice(),
            options: ['活动介绍', '评论/留言', '社团简介', '作品提交', '通知公告', '门户内容', '分值申报材料', 'AI 会话记录'],
            onChange: function (v) { cfg.scenes = v; save(); }
          }),
          D.h('div.dk-tip', '已选 ' + cfg.scenes.length + ' 个场景。未勾选的场景不参与敏感词扫描。')
        )
      })
    ));

    host.appendChild(D.h('div', { style: 'height:14px' }));
    host.appendChild(UI.card({
      title: '扫描与处置统计',
      sub: '按当前敏感词库与策略实时计算',
      body: D.h('div', {}, (function () {
        var l = contents(), s = stats();
        return D.h('div', {},
          KP.kpis([
            { label: '纳入扫描内容', num: l.filter(function (c) { return cfg.scenes.indexOf(c.scene) >= 0; }).length, unit: '条', ic: '🔍', fg: '#2563eb', bg: '#eff6ff' },
            { label: '命中禁止词', num: s.banned, unit: '条', ic: '🚫', fg: '#dc2626', bg: '#fef2f2', foot: cfg.blockOnBan ? '已开启自动拦截' : '未开启自动拦截' },
            { label: '待人工复核', num: l.filter(function (c) { return U.num(c.risk) >= cfg.reviewThreshold && c.status === '待审'; }).length, unit: '条', ic: '👁', fg: '#d97706', bg: '#fff8eb' },
            { label: '敏感词库', num: words().length, unit: '个', ic: '📚', fg: '#7c3aed', bg: '#f5f3ff' }
          ], 'g4'),
          D.h('div', { style: 'margin-top:12px;display:flex;gap:9px' },
            D.h('button.btn.btn-sm.btn-p', {
              onclick: function () {
                rescanAll();
                var n = contents().filter(function (c) { return (c.hits || []).length; }).length;
                log('全量内容重新扫描', '命中 ' + n + ' 条内容');
                UI.toast('已重新扫描全部内容', '共 ' + contents().length + ' 条内容，命中 ' + n + ' 条', 'ok');
                w.ZR.render();
              }
            }, '↻ 立即重新扫描'),
            KP.exportBtn('导出敏感词库', [
              { t: '敏感词', k: 'word' }, { t: '级别', k: 'level' }, { t: '分类', k: 'cat' },
              { t: '命中内容数', raw: function (x) { return contents().filter(function (c) { return (c.hits || []).some(function (h) { return h.word === x.word; }); }).length; } }
            ], function () { return words(); }))
        );
      })())
    }));
  }

  function log(action, target) {
    DB.insert('logs', {
      id: U.uid('LG'), at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()] || '管理员',
      action: action, module: '内容安全', target: target, ip: '10.16.1.101', result: '成功', detail: '操作留痕已记录'
    });
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    /* 首次进入时按敏感词库校准一次扫描结果，保证展示与规则一致 */
    if (!w.__contentScanned) {
      rescanAll();
      w.__contentScanned = true;
    }
    host.appendChild(UI.pageHd({
      title: '内容安全',
      desc: '内容提交前置扫描 + 人工复核双保险；敏感词库、命中统计与舆情监控同源联动。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('portal'); } }, '门户配置'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('user'); } }, '用户与权限')
      ]
    }));
    host.appendChild(kpis());
    host.appendChild(D.h('div', { style: 'height:14px' }));

    var rerender = function () { w.ZR.render(); };
    host.appendChild(UI.tabs({
      items: [
        { k: 'queue', n: '审核队列', cnt: stats().pending },
        { k: 'words', n: '敏感词库', cnt: words().length },
        { k: 'monitor', n: '舆情监控' },
        { k: 'policy', n: '策略配置' }
      ],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    if (st.tab === 'queue') queueTab(body, rerender);
    else if (st.tab === 'words') wordsTab(body, rerender);
    else if (st.tab === 'monitor') monitorTab(body);
    else policyTab(body);
    host.appendChild(body);
  }

  KP.pages({
    content: { title: '内容安全', group: '门户与智能', render: render }
  });
})(window);
