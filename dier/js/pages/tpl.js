/* ==========================================================================
   tpl.js —— 成绩单模板（5 套版式 · 字段配置 · 印章签名 · 实时预览 · PDF 导出）
   真实能力：
   · 模板切换：启用/停用模板，指定「导出默认模板」，切换后预览与导出的 PDF 实时跟随
   · 字段配置：勾选成绩单上显示哪些字段并调整顺序（与预览、PDF 内容联动）
   · 印章与水印：电子印章文字、签发单位、是否显示印章/签名/水印、纸张规格
   · 实时预览：取真实学生数据渲染成绩单，含六大类别达成、活动明细、印章
   · 导出：调用浏览器打印生成带样式与印章的 PDF（另存为 PDF）
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = { id: '', sampleId: '', previewBasis: 'all' };

  var ALL_FIELDS = ['活动名称', '活动分类', '主办单位', '开展时间', '认定学分', '认定学时', '认定积分', '认定状态', '活动级别', '辅导教师'];
  var ALL_DIMS = ['按学年汇总', '按活动分类统计', '按学期明细', '按级别统计'];
  var PAPERS = [['A4', 'A4（210×297mm）'], ['A4L', 'A4 横向'], ['A3', 'A3 大版']];
  var THEMES = [
    ['theme-default', '官方蓝', '#2563eb'],
    ['theme-dark', '科技深色', '#0f172a'],
    ['theme-green', '清新绿', '#059669'],
    ['theme-indigo', '靛紫考核', '#4f46e5'],
    ['theme-gold', '暖金荣誉', '#b45309']
  ];

  function cur() { return DB.get('tpls', st.id) || DB.find('tpls', function (t) { return t.enabled; }) || DB.col('tpls')[0]; }
  function sample() {
    var s = st.sampleId ? DB.get('students', st.sampleId) : null;
    return s || ZA.viewStudent() || DB.col('students')[0];
  }
  function themeOf(t) { var hit = THEMES.filter(function (x) { return x[0] === t.theme; })[0]; return hit || THEMES[0]; }

  /* ---------------- 成绩单主体（预览与 PDF 共用同一份 HTML 生成逻辑） ---------------- */
  function sheetHTML(t, stu, opt) {
    opt = opt || {};
    var agg = DB.aggOf(stu.id) || { total: 0, cat: {}, byLevel: {}, count: 0 };
    var sc = DB.scheme();
    var need = U.num(sc ? sc.standard.pass : 6);
    var recs = DB.recsOf(stu.id, { basis: st.previewBasis === 'all' ? null : st.previewBasis });
    var theme = themeOf(t);
    var main = theme[2];
    var fields = t.fields || [];
    var show = function (k) { return fields.indexOf(k) >= 0; };

    var dimHTML = '';
    if ((t.dims || []).indexOf('按活动分类统计') >= 0) {
      dimHTML += '<div class="h2">按活动分类统计</div>' +
        '<table><tr><th>素养类别</th><th>认定学分</th><th>类别标准</th><th>达成情况</th></tr>' +
        DB.col('cats').map(function (c) {
          var got = U.num((agg.cat || {})[c.name] || 0);
          var std = U.num(((sc || {}).catStandard || {})[c.name] || 0);
          return '<tr><td>' + U.esc(c.name) + '</td><td>' + got.toFixed(2) + '</td><td>' + std.toFixed(2) + '</td>' +
            '<td style="color:' + (std && got >= std * 0.6 ? '#059669' : '#dc2626') + '">' +
            (std ? (got >= std ? '已达标' : (got >= std * 0.6 ? '基本达标' : '未达标')) : '不适用') + '</td></tr>';
        }).join('') + '</table>';
    }

    var detailHTML = '';
    if (recs.length) {
      var head = ['序号'].concat(fields.length ? fields : ['活动名称', '活动分类', '开展时间', '认定学分']).concat(['认定状态']);
      detailHTML += '<div class="h2">成绩明细（' + recs.length + ' 条）</div><table><tr>' +
        head.map(function (h) { return '<th>' + U.esc(h) + '</th>'; }).join('') + '</tr>' +
        recs.slice(0, opt.limit || 24).map(function (r, i) {
          return '<tr><td>' + (i + 1) + '</td>' + (fields.length ? fields : ['活动名称', '活动分类', '开展时间', '认定学分']).map(function (f) {
            return '<td>' + U.esc(FIELD_VAL(f, r, stu)) + '</td>';
          }).join('') + '<td>' + U.esc(r.status || '已认定') + '</td></tr>';
        }).join('') + '</table>' +
        (recs.length > (opt.limit || 24) ? '<div style="color:#6b7a90;font-size:11px;margin-top:6px">（此处仅显示前 ' + (opt.limit || 24) + ' 条，完整明细共 ' + recs.length + ' 条）</div>' : '');
    }

    return '' +
      '<div class="sheet ' + theme[0] + '" style="--main:' + main + '">' +
      '<div class="sheet-hd">' +
      '<div class="logo">' + U.esc(t.logo || '二课') + '</div>' +
      '<div class="ttl">' +
      '<div class="t1">' + U.esc(DB.data.meta.school) + '</div>' +
      '<div class="t2">第二课堂成绩单</div>' +
      '<div class="t3">' + U.esc(DB.data.meta.term) + ' 学年 · ' + U.esc(t.name) + ' · ' + U.esc(t.ver || 'v1') + '</div>' +
      '</div>' +
      '<div class="sn">编号<br><b>' + U.esc('DEKT-' + String(stu.sno).slice(-8)) + '</b></div>' +
      '</div>' +
      KP.metricsHTML([
        ['姓名', stu.name], ['学号', stu.sno], ['性别', stu.gender],
        ['学院', stu.college], ['专业', stu.major], ['班级', stu.className],
        ['年级', stu.grade], ['累计学分', U.num(agg.total).toFixed(2)],
        ['达标线', need.toFixed(1)], ['是否达标', U.num(agg.total) >= need ? '已达标' : '未达标']
      ]) +
      dimHTML +
      detailHTML +
      '<div class="h2">认定结论</div>' +
      '<p style="font-size:13px;line-height:2">' +
      U.esc(stu.name) + ' 同学（学号 ' + U.esc(stu.sno) + '）在校期间累计取得第二课堂学分 <b>' + U.num(agg.total).toFixed(2) + '</b> 学分，' +
      '其中' + DB.col('cats').map(function (c) { return U.esc(c.name) + ' ' + U.num((agg.cat || {})[c.name] || 0).toFixed(2) + ' 学分'; }).join('、') + '。' +
      '经审核，该生第二课堂成绩<b>' + (U.num(agg.total) >= need ? '已达到' : '暂未达到') + '</b>毕业要求（' + need.toFixed(1) + ' 学分）。' +
      '</p>' +
      (t.showSign !== false ? '<div class="sign">签发单位：' + U.esc(t.sign || '教务处（第二课堂管理中心）') + '<br>签发日期：' + DB.data.meta.now.slice(0, 10) + '</div>' : '') +
      (t.showStamp !== false && t.seal ? KP.sealHTML(t.seal) : '') +
      (t.watermark ? '<div class="wm">' + U.esc(t.watermark) + '</div>' : '') +
      '</div>';
  }
  function FIELD_VAL(f, r, stu) {
    return ({
      '活动名称': r.actTitle, '活动分类': r.cat, '主办单位': (DB.get('activities', r.actId) || {}).host || '第二课堂管理中心',
      '开展时间': r.at, '认定学分': r.credit, '认定学时': r.hours, '认定积分': r.points,
      '认定状态': r.status, '活动级别': r.level || '校级', '辅导教师': stu.advisor || '—'
    })[f] === undefined ? '—' : ({
      '活动名称': r.actTitle, '活动分类': r.cat, '主办单位': (DB.get('activities', r.actId) || {}).host || '第二课堂管理中心',
      '开展时间': r.at, '认定学分': r.credit, '认定学时': r.hours, '认定积分': r.points,
      '认定状态': r.status, '活动级别': r.level || '校级', '辅导教师': stu.advisor || '—'
    })[f];
  }

  /* 预览面板用的样式注入（在页面内用内联 css 保证观感，与打印输出一致） */
  function injectStyle() {
    if (document.getElementById('tplPreviewCss')) return;
    var css = '' +
      '.sheet{border:1px solid #dbe4f0;border-radius:12px;padding:22px 24px;background:#fff;position:relative;overflow:hidden;max-width:820px}' +
      '.sheet.theme-dark{background:#0f172a;color:#e2e8f0;border-color:#1e293b}' +
      '.sheet.theme-dark th{background:#1e293b;color:#e2e8f0}.sheet.theme-dark th,.sheet.theme-dark td{border-color:#334155}' +
      '.sheet.theme-green{background:#f6fefb}.sheet.theme-indigo{background:#fafaff}.sheet.theme-gold{background:#fffdf7}' +
      '.sheet .sheet-hd{display:flex;align-items:center;gap:14px;border-bottom:2px solid var(--main);padding-bottom:12px;margin-bottom:14px}' +
      '.sheet .logo{width:52px;height:52px;border-radius:14px;background:var(--main);color:#fff;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:700;flex:0 0 52px}' +
      '.sheet .ttl{flex:1;text-align:center}.sheet .t1{font-size:13px;color:#6b7a90}.sheet.theme-dark .t1{color:#94a3b8}' +
      '.sheet .t2{font-size:23px;font-weight:750;letter-spacing:4px;color:var(--main);margin:2px 0}' +
      '.sheet .t3{font-size:11.5px;color:#9aa8bc}' +
      '.sheet .sn{text-align:right;font-size:10.5px;color:#9aa8bc;line-height:1.7}' +
      '.sheet .sn b{font-family:ui-monospace,monospace;color:var(--main)}' +
      '.sheet .m{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}' +
      '.sheet .m div{border:1px solid #e2e8f0;border-radius:8px;padding:7px 11px;min-width:104px;flex:1 1 104px}' +
      '.sheet.theme-dark .m div{border-color:#334155}' +
      '.sheet .m b{display:block;font-size:14px}.sheet .m span{font-size:10.5px;color:#6b7a90}' +
      '.sheet .h2{font-size:12.5px;font-weight:700;margin:14px 0 7px;padding-left:8px;border-left:3px solid var(--main)}' +
      '.sheet table{width:100%;border-collapse:collapse;font-size:11.5px}' +
      '.sheet th,.sheet td{border:1px solid #e2e8f0;padding:5px 7px;text-align:left}' +
      '.sheet th{background:#f5f8fd;font-weight:600}' +
      '.sheet .sign{float:right;text-align:right;font-size:11.5px;line-height:2;margin-top:14px}' +
      '.sheet .seal{float:right;width:104px;height:104px;border:2.5px solid #ef4444;border-radius:50%;color:#ef4444;' +
      'display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px;font-weight:700;' +
      'transform:rotate(-8deg);opacity:.85;line-height:1.25;padding:9px;margin:8px 0 0 10px}' +
      '.sheet .wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:52px;' +
      'color:rgba(37,99,235,.06);font-weight:800;letter-spacing:8px;pointer-events:none;transform:rotate(-22deg)}';
    var el = document.createElement('style');
    el.id = 'tplPreviewCss';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function printSheet(t, stu) {
    injectStyle();
    UI.printHTML('第二课堂成绩单 · ' + stu.name, sheetHTML(t, stu), '');
  }

  /* ---------------- 模板卡片 ---------------- */
  function tplCard(t, refresh) {
    var theme = themeOf(t);
    var sel = cur().id === t.id;
    var isDefault = (function () {
      var d = DB.obj('meta');
      return d.defaultTpl === t.id;
    })();
    return D.h('div', {
      style: 'border:1.5px solid ' + (sel ? '#2563eb' : 'var(--line)') + ';border-radius:12px;overflow:hidden;background:#fff;' +
        'box-shadow:' + (sel ? '0 6px 18px rgba(37,99,235,.14)' : 'none') + ';cursor:pointer',
      onclick: function () { st.id = t.id; refresh(); }
    },
      D.h('div', {
        style: 'height:88px;background:linear-gradient(135deg,' + theme[2] + '22,' + theme[2] + '55);position:relative;' +
          'display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--line)'
      },
        D.h('div', { style: 'text-align:center' },
          D.h('div', { style: 'font-size:16px;font-weight:750;letter-spacing:3px;color:' + theme[2] }, '成绩单'),
          D.h('div', { style: 'font-size:10.5px;color:#6b7a90;margin-top:3px' }, t.theme)
        ),
        D.h('div', { style: 'position:absolute;top:8px;right:9px;display:flex;gap:5px;flex-direction:column;align-items:flex-end' },
          t.enabled ? UI.tag('已启用', 'tag-ok') : UI.tag('已停用', 'tag-info'),
          isDefault ? UI.tag('导出默认', 'tag-purple') : null
        )
      ),
      D.h('div', { style: 'padding:11px 12px' },
        D.h('div', { style: 'font-weight:700;font-size:13px;line-height:1.45;min-height:38px' }, t.name),
        D.h('div', { style: 'font-size:11.5px;color:var(--text3);display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:5px' },
          D.h('span', '字段 ' + (t.fields || []).length + ' 个'),
          D.h('span', '维度 ' + (t.dims || []).length + ' 个'),
          D.h('span', t.showStamp ? '含印章' : '无印章')
        ),
        D.h('div', { style: 'font-size:11px;color:var(--text3);margin-top:5px' }, '更新 ' + (t.updatedAt || '—') + ' · ' + (t.updatedBy || '—')),
        D.h('div.btn-row', { style: 'margin-top:9px' },
          D.h('button.btn.btn-sm' + (sel ? '.btn-p' : ''), { onclick: function (e) { e.stopPropagation(); st.id = t.id; refresh(); } }, sel ? '配置中' : '配置此模板'),
          D.h('button.btn.btn-sm', {
            onclick: function (e) {
              e.stopPropagation();
              /* 业务规则：至少保留一套启用模板，否则学生端将无模板可用 */
              if (t.enabled && DB.count('tpls', function (x) { return x.enabled; }) <= 1) {
                UI.toast('无法停用', '系统需至少保留一套启用中的成绩单模板', 'warn');
                return;
              }
              DB.update('tpls', t.id, { enabled: !t.enabled, updatedAt: U.dt(new Date()), updatedBy: ZA.session.name });
              log(t.enabled ? '停用成绩单模板' : '启用成绩单模板', t.name);
              UI.toast(t.enabled ? '模板已停用' : '模板已启用', t.name, t.enabled ? 'warn' : 'ok');
              refresh();
            }
          }, t.enabled ? '停用' : '启用'),
          D.h('button.btn.btn-sm', {
            onclick: function (e) {
              e.stopPropagation();
              DB.setObj('meta', { defaultTpl: t.id });
              log('设置导出默认模板', t.name);
              UI.toast('已设为导出默认模板', '导出成绩单时会默认使用该版式', 'ok');
              refresh();
            }
          }, isDefault ? '默认 ✓' : '设为默认')
        )
      )
    );
  }

  function log(action, detail) {
    DB.insert('logs', {
      at: U.dt(new Date()), actor: ZA.session.name, role: ZA.ROLE_LABEL[ZA.role()],
      action: action, module: '成绩管理', target: '', ip: '10.16.1.101', result: '成功', detail: detail
    });
  }

  /* ---------------- 字段配置（含拖拽排序） ---------------- */
  function fieldPane(t, refresh) {
    var on = (t.fields || []).slice();
    var off = ALL_FIELDS.filter(function (f) { return on.indexOf(f) < 0; });
    var dragFrom = null;
    function save() {
      DB.update('tpls', t.id, { fields: on.slice(), updatedAt: U.dt(new Date()), updatedBy: ZA.session.name });
      log('配置成绩单字段', t.name + '：' + on.join('、'));
    }
    function row(f, i) {
      return D.h('div', {
        draggable: 'true',
        style: 'display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;margin-bottom:6px;background:#fff;cursor:grab',
        ondragstart: function (e) { dragFrom = i; if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (err) { } } },
        ondragover: function (e) { if (e.preventDefault) e.preventDefault(); },
        ondrop: function (e) {
          if (e.preventDefault) e.preventDefault();
          if (dragFrom === null || dragFrom === i) return;
          var moved = on.splice(dragFrom, 1)[0];
          on.splice(i, 0, moved);
          dragFrom = null;
          save(); refresh();
        }
      },
        D.h('span', { style: 'color:var(--text3);cursor:grab' }, '⠿'),
        D.h('span', {
          style: 'width:20px;height:20px;border-radius:5px;background:#eef3fa;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:650'
        }, i + 1),
        D.h('span', { style: 'flex:1;font-size:12.5px;font-weight:600' }, f),
        D.h('button.btn.btn-sm', { onclick: function () { if (i > 0) { var m = on.splice(i, 1)[0]; on.splice(i - 1, 0, m); save(); refresh(); } } }, '↑'),
        D.h('button.btn.btn-sm', { onclick: function () { if (i < on.length - 1) { var m = on.splice(i, 1)[0]; on.splice(i + 1, 0, m); save(); refresh(); } } }, '↓'),
        D.h('button.btn.btn-sm.btn-dan', { onclick: function () { on.splice(i, 1); off.push(f); save(); refresh(); } }, '移除')
      );
    }
    return D.h('div', {},
      D.h('div.req-note', '拖拽字段可调整成绩单上的呈现顺序（也可用 ↑↓ 按钮）。预览与导出的 PDF 会实时跟随这里的配置。'),
      D.h('div.mt12', D.h('div', { style: 'font-weight:650;font-size:12.5px;margin-bottom:7px' }, '已显示字段（' + on.length + ' 个）')),
      on.length ? D.h('div', {}, on.map(function (f, i) { return row(f, i); })) : UI.empty('未选择任何字段', '从下方可选字段中添加'),
      D.h('div.mt12', D.h('div', { style: 'font-weight:650;font-size:12.5px;margin-bottom:7px' }, '可选字段（' + off.length + ' 个）')),
      D.h('div.btn-row', off.map(function (f) {
        return D.h('button.btn.btn-sm', {
          onclick: function () { on.push(f); off = off.filter(function (x) { return x !== f; }); save(); refresh(); }
        }, '＋ ' + f);
      })) || D.h('span.muted', '全部字段已显示')
    );
  }

  function dimPane(t, refresh) {
    var on = (t.dims || []).slice();
    return D.h('div', {},
      D.h('div.req-note', '选择成绩单上需要呈现的统计维度。勾选越多，成绩单篇幅越长；建议学生自助导出用 2 个维度，归档用 3—4 个维度。'),
      D.h('div.mt12', D.h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, ALL_DIMS.map(function (d) {
        var checked = on.indexOf(d) >= 0;
        return D.h('label', {
          style: 'display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid ' + (checked ? '#bfd7fb' : 'var(--line)') +
            ';border-radius:9px;background:' + (checked ? '#f5f9ff' : '#fff') + ';cursor:pointer'
        },
          D.h('input', {
            type: 'checkbox', checked: checked,
            onchange: function (e) {
              if (e.target.checked) { if (on.indexOf(d) < 0) on.push(d); } else on = on.filter(function (x) { return x !== d; });
              DB.update('tpls', t.id, { dims: on.slice(), updatedAt: U.dt(new Date()), updatedBy: ZA.session.name });
              log('配置成绩单统计维度', t.name + '：' + on.join('、'));
              refresh();
            }
          }),
          D.h('div', { style: 'flex:1' },
            D.h('div', { style: 'font-weight:650;font-size:12.5px' }, d),
            D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:2px' }, {
              '按学年汇总': '按学年汇总学分获得情况，适合年度归档',
              '按活动分类统计': '六大素养类别的认定学分与达标情况，最常用于审核',
              '按学期明细': '逐条列出每个学期的认定记录，篇幅最长',
              '按级别统计': '按校级 / 院级活动分别统计，便于评估活动供给'
            }[d])
          )
        );
      }))),
      D.h('div.mt12', UI.table({
        cols: [{ t: '维度', k: 'd' }, { t: '说明', render: function (r) { return '本模板当前' + (on.indexOf(r.d) >= 0 ? '已启用' : '未启用') + '该维度'; } }],
        rows: ALL_DIMS.map(function (d) { return { d: d }; }), mini: true
      }))
    );
  }

  function sealPane(t, refresh) {
    var d = {
      seal: t.seal || '第二课堂成绩单认定专用章', sign: t.sign || '教务处（第二课堂管理中心）',
      watermark: t.watermark || '', showStamp: t.showStamp !== false, showSign: t.showSign !== false,
      paper: t.paper || 'A4'
    };
    var host = D.h('div');
    function save() {
      DB.update('tpls', t.id, {
        seal: d.seal, sign: d.sign, watermark: d.watermark,
        showStamp: d.showStamp, showSign: d.showSign, paper: d.paper,
        updatedAt: U.dt(new Date()), updatedBy: ZA.session.name
      });
      log('配置成绩单印章与版式', t.name);
    }
    D.appendChildDeep(host, [
      D.h('div.req-note', '印章与签名会直接呈现在导出的 PDF 上。印章为电子印章样式（红章），签名栏显示签发单位与签发日期。'),
      D.h('div.frm.c2.mt12', {},
        UI.field({ label: '电子印章文字', required: true, control: UI.input({ value: d.seal, onInput: function (e) { d.seal = e.target.value; } }), span: 2, hint: '建议格式：学校名称 + 第二课堂成绩单认定专用章' }),
        UI.field({ label: '签发单位', required: true, control: UI.input({ value: d.sign, onInput: function (e) { d.sign = e.target.value; } }), span: 2 }),
        UI.field({ label: '水印文字', control: UI.input({ value: d.watermark, placeholder: '留空则不显示水印', onInput: function (e) { d.watermark = e.target.value; } }), span: 2 }),
        UI.field({ label: '纸张规格', control: UI.select({ options: PAPERS.map(function (p) { return [p[0], p[1]]; }), value: d.paper, onChange: function (v) { d.paper = v; } }) })
      ),
      D.h('div.mt12', D.h('div', { style: 'font-weight:650;font-size:12.5px;margin-bottom:7px' }, '显示选项')),
      UI.swRow({ title: '显示电子印章', desc: '关闭后导出的 PDF 不含红色印章', checked: d.showStamp, onChange: function (v) { d.showStamp = v; save(); refresh(); } }),
      UI.swRow({ title: '显示签发单位与日期', desc: '关闭后仅保留认定结论段落', checked: d.showSign, onChange: function (v) { d.showSign = v; save(); refresh(); } }),
      D.h('div.mt12', D.h('div.btn-row', {},
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { save(); UI.toast('印章与版式已保存', t.name, 'ok'); refresh(); } }, '保存设置'),
        D.h('button.btn.btn-sm', { onclick: function () { printSheet(t, sample()); } }, '📄 按当前配置导出 PDF')
      ))
    ]);
    return host;
  }

  /* ---------------- 渲染 ---------------- */
  function render(host) {
    injectStyle();
    if (!st.id) st.id = (DB.find('tpls', function (t) { return t.enabled; }) || DB.col('tpls')[0] || {}).id;
    var t = cur();
    var stu = sample();
    var refresh = function () { w.ZR.render(); };

    host.appendChild(UI.pageHd({
      crumb: '<b>成绩与评价</b> / 成绩单模板',
      title: '成绩单模板',
      desc: '5 套版式可切换 · 字段与统计维度可配置 · 印章与签名可设置 · 预览与导出 PDF 实时联动',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('grade'); } }, '成绩管理'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('myscore'); } }, '学生端成绩单'),
        D.h('button.btn.btn-sm.btn-p', { onclick: function () { printSheet(t, stu); } }, '📄 导出当前模板 PDF')
      ]
    }));

    host.appendChild(D.h('div.mt16', KP.kpis([
      { ic: '📄', label: '模板总数', num: DB.col('tpls').length, unit: '套', fg: '#2563eb', bg: '#eff6ff', foot: '启用 ' + DB.count('tpls', function (x) { return x.enabled; }) + ' 套' },
      { ic: '🧩', label: '当前模板字段', num: (t.fields || []).length, unit: '个', fg: '#7c3aed', bg: '#f5f3ff', foot: '共 ' + ALL_FIELDS.length + ' 个可选字段' },
      { ic: '📊', label: '统计维度', num: (t.dims || []).length, unit: '个', fg: '#0891b2', bg: '#ecfeff', foot: '共 ' + ALL_DIMS.length + ' 个维度' },
      { ic: '🔖', label: '认定专用章', num: t.showStamp ? '已启用' : '未启用', fg: '#dc2626', bg: '#fef2f2', foot: (t.seal || '').slice(0, 12) + '…' },
      { ic: '📐', label: '纸张规格', num: t.paper || 'A4', fg: '#d97706', bg: '#fffbeb', foot: '用于归档打印' }
    ], 'g5')));

    /* 模板选择区 */
    host.appendChild(D.h('div.mt16', UI.card({
      title: '选择成绩单版式', sub: '点击卡片切换配置对象；「导出默认」决定学生自助导出时使用的版式',
      right: D.h('div.hd-r', D.h('span.muted', '当前配置：' + t.name)),
      body: D.h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:13px' },
        DB.col('tpls').map(function (x) { return tplCard(x, refresh); }))
    })));

    /* 配置区 */
    var cfgHost = D.h('div.mt16');
    var curTab = st.cfg || 'fields';
    var TABS = [{ k: 'fields', n: '字段配置' }, { k: 'dims', n: '统计维度' }, { k: 'seal', n: '印章与版式' }];
    var tabHost = D.h('div');
    var paneHost = D.h('div.mt12');
    function paintCfg() {
      D.fill(tabHost, UI.tabs({ items: TABS, cur: curTab, onChange: function (k) { curTab = k; st.cfg = k; paintCfg(); } }));
      D.fill(paneHost, null);
      if (curTab === 'fields') paneHost.appendChild(fieldPane(t, refresh));
      if (curTab === 'dims') paneHost.appendChild(dimPane(t, refresh));
      if (curTab === 'seal') paneHost.appendChild(sealPane(t, refresh));
    }
    paintCfg();
    cfgHost.appendChild(D.h('div.g-21', {},
      UI.card({ title: '模板配置 · ' + t.name, sub: '配置项保存后立即生效', body: [tabHost, paneHost] }),
      UI.card({
        title: '模板元信息', tight: true,
        body: KP.kv([
          ['模板编号', t.id], ['模板名称', t.name], ['主题风格', themeOf(t)[1]],
          ['当前版本', t.ver || 'v1'], ['启用状态', t.enabled ? '已启用' : '已停用'],
          ['字段数', (t.fields || []).length + ' 个'], ['维度数', (t.dims || []).length + ' 个'],
          ['印章', t.showStamp ? (t.seal || '—') : '未启用'],
          ['签名', t.showSign !== false ? (t.sign || '—') : '未启用'],
          ['水印', t.watermark || '无'],
          ['纸张', t.paper || 'A4'],
          ['最近更新', (t.updatedAt || '—') + ' · ' + (t.updatedBy || '—')]
        ])
      })
    ));

    /* 预览区 */
    var stuOpts = DB.col('students').slice(0, 200).map(function (s) { return [s.id, s.name + '（' + s.sno + ' · ' + s.className + '）']; });
    var previewHost = D.h('div');
    function paintPreview() {
      D.fill(previewHost, null);
      previewHost.appendChild(D.h('div', {},
        UI.filterBar([
          { type: 'select', label: '预览学生', width: 268, value: stu.id, options: stuOpts, onChange: function (v) { st.sampleId = v; refresh(); } },
          {
            type: 'select', label: '明细范围', value: st.previewBasis,
            options: [['all', '全部记录'], ['term', '本学期'], ['year', '本学年']],
            onChange: function (v) { st.previewBasis = v; refresh(); }
          }
        ], {
          right: D.h('div.btn-row', {},
            D.h('button.btn.btn-sm', { onclick: function () { printSheet(t, sample()); } }, '📄 导出这份成绩单'),
            D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('grade'); } }, '成绩管理'))
        }),
        D.h('div.mt12', { style: 'overflow-x:auto' },
          D.h('div', { html: sheetHTML(t, stu) }))
      ));
    }
    paintPreview();
    host.appendChild(D.h('div.mt16', UI.card({
      title: '成绩单实时预览', sub: '与导出的 PDF 内容一致 · 数据取该生的真实认定记录',
      body: previewHost,
      note: '预览含 ' + DB.recsOf(stu.id).length + ' 条真实认定记录，累计学分 ' + U.num((DB.aggOf(stu.id) || {}).total).toFixed(2) + ' 学分'
    })));

    /* 模板对比 */
    host.appendChild(D.h('div.mt16', UI.card({
      title: '模板能力对比', sub: '按字段数、维度数、印章与水印支持情况横向比较',
      flush: true,
      body: UI.table({
        cols: [
          { t: '模板名称', render: function (x) { return KP.cell(x.name, x.id + ' · ' + x.theme, { clip: true }); } },
          { t: '启用', w: 88, render: function (x) { return KP.status(x.enabled ? '已启用' : '停用'); } },
          { t: '字段数', w: 84, align: 'right', render: function (x) { return KP.numCell((x.fields || []).length, '个'); } },
          { t: '维度数', w: 84, align: 'right', render: function (x) { return KP.numCell((x.dims || []).length, '个'); } },
          { t: '电子印章', w: 96, render: function (x) { return x.showStamp ? UI.tag('含印章', 'tag-ok') : UI.tag('无印章', 'tag-info'); } },
          { t: '签名栏', w: 96, render: function (x) { return x.showSign !== false ? UI.tag('含签名', 'tag-ok') : UI.tag('无签名', 'tag-info'); } },
          { t: '水印', render: function (x) { return x.watermark ? D.h('span', { style: 'font-size:11.5px' }, x.watermark) : D.h('span.muted', '无'); } },
          { t: '纸张', k: 'paper', w: 82 },
          {
            t: '操作', w: 152, render: function (x) {
              return KP.acts([
                D.h('button.btn.btn-sm' + (cur().id === x.id ? '.btn-p' : ''), { onclick: function () { st.id = x.id; refresh(); } }, cur().id === x.id ? '配置中' : '配置'),
                D.h('button.btn.btn-sm', { onclick: function () { printSheet(x, sample()); } }, '导出 PDF')
              ]);
            }
          }
        ],
        rows: DB.col('tpls'), mini: true, noCard: true,
        footNote: '共 ' + DB.col('tpls').length + ' 套模板'
      })
    })));
  }

  /* ---------------- 对外复用：成绩管理与学生端共用同一套成绩单渲染 ---------------- */
  w.ZTPL = {
    /* 按模板渲染某学生的成绩单 HTML（预览与 PDF 导出共用） */
    sheetHTML: function (tpl, stu, opt) {
      var t = tpl || DB.find('tpls', function (x) { return x.enabled; }) || DB.col('tpls')[0];
      var prev = st.previewBasis;
      if (opt && opt.basis !== undefined) st.previewBasis = opt.basis || 'all';
      var html = sheetHTML(t, stu, opt || {});
      st.previewBasis = prev;
      return html;
    },
    /* 直接调起浏览器打印（另存为 PDF） */
    print: function (stu, tpl, opt) {
      injectStyle();
      var t = tpl || DB.find('tpls', function (x) { return x.enabled; }) || DB.col('tpls')[0];
      var prev = st.previewBasis;
      if (opt && opt.basis !== undefined) st.previewBasis = opt.basis || 'all';
      var html = sheetHTML(t, stu, opt || {});
      st.previewBasis = prev;
      UI.printHTML('第二课堂成绩单 · ' + stu.name + '（' + stu.sno + '）', html, '');
    },
    /* 让预览面板的样式表就绪（弹窗里显示成绩单前调用） */
    ensureStyle: injectStyle,
    /* 默认（启用的第一套）模板 */
    defaultTpl: function () { return DB.find('tpls', function (x) { return x.enabled; }) || DB.col('tpls')[0]; },
    themes: THEMES
  };

  w.ZKP.pages({
    tpl: {
      title: '成绩单模板', group: '成绩与评价',
      render: render
    }
  });
})(window);
