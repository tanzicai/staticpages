/* ==========================================================================
   portal.js —— 门户配置（可视化拖拽搭建）
   对应演示项【2.3 第三步】：
   «演示门户页面配置…等功能。»
   · 门户基础配置：域名、别名、站点标题、副标题、访问权限、主题色、备案号。
   · 页面管理：首页 / 活动专区 / 成绩查询三个页面，各自维护模块列表。
   · 模块库：20 种模块类型（轮播图、搜索条、图标列表、图表、图文列表、天气、
     文本、表格、图片列表、多图列表、文本列表、视频、按钮、地图、日期、
     IP 展示、插件、搜索列表…），拖拽到画布即完成搭建。
   · 画布：拖拽排序、上移/下移/置顶、删除、选中后在右侧编辑模块属性。
   · 预览：PC 端 / 移动端双视图，按当前搭建结果真实渲染（含真实业务数据）。
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, D = w.ZD, UI = w.ZUI, C = w.ZC, DB = w.DB, ZA = w.ZA, KP = w.ZKP;

  var st = {
    tab: 'build',
    pageId: 'PG1',
    preview: 'pc',
    selId: '',
    dragId: '',
    overId: ''
  };

  function portal() { return DB.data.portal; }
  function pages() { return portal().pages || []; }
  function lib() { return portal().modules || []; }
  function curPage() { return pages().filter(function (p) { return p.id === st.pageId; })[0] || pages()[0]; }
  function modById(id) { return lib().filter(function (m) { return m.id === id; })[0]; }
  function curModules() {
    var p = curPage();
    return (p ? p.modules : []).map(modById).filter(Boolean);
  }

  /* ===================== 一、基础配置 ===================== */
  function baseCard(rerender) {
    var p = portal();
    return UI.card({
      title: '门户基础配置',
      sub: '域名与站点信息真实写入配置，预览区标题同步更新',
      body: D.h('div', {},
        D.h('div.g2', {},
          UI.field({ label: '访问域名', control: UI.input({ value: p.domain, onInput: function (e) { p.domain = e.target.value; } }) }),
          UI.field({ label: '站点标题', control: UI.input({ value: p.title, onInput: function (e) { p.title = e.target.value; rerender(); } }) })
        ),
        UI.field({ label: '站点副标题', control: UI.input({ value: p.subtitle, onInput: function (e) { p.subtitle = e.target.value; } }) }),
        D.h('div.g2', {},
          UI.field({
            label: '访问权限', control: UI.select({
              options: [['public', '公开访问（无需登录）'], ['login', '登录后访问'], ['inner', '仅校内网络']],
              value: p.access, onChange: function (v) { p.access = v; rerender(); }
            })
          }),
          UI.field({
            label: '主题配色', control: UI.seg({
              options: [['blue', '校园蓝'], ['green', '青绿'], ['purple', '紫罗兰']],
              value: p.theme, onChange: function (v) { p.theme = v; rerender(); }
            })
          })
        ),
        UI.field({ label: '备案号', control: UI.input({ value: p.icp, onInput: function (e) { p.icp = e.target.value; } }) }),
        UI.field({ label: '域名别名（每行一个）', control: UI.textarea({ value: (p.alias || []).join('\n'), rows: 3, onInput: function (e) { p.alias = e.target.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); } }) }),
        D.h('div.req-note', { html: '当前访问策略：<b>' + U.esc(p.accessDesc || '') + '</b>' })
      ),
      note: D.h('div', { style: 'display:flex;gap:9px;align-items:center' },
        D.h('span.muted', '域名：' + p.domain + ' · 别名 ' + (p.alias || []).length + ' 个'),
        D.h('div', { style: 'margin-left:auto' },
          D.h('button.btn.btn-sm.btn-p', {
            onclick: function () {
              DB.touchObj('portal');
              UI.toast('门户配置已保存', '站点标题、访问权限、主题配色均已生效', 'ok');
              rerender();
            }
          }, '保存门户配置'))
      )
    });
  }

  /* ===================== 二、拖拽搭建器 ===================== */
  function palette(rerender) {
    var used = (curPage() || {}).modules || [];
    var grouped = U.groupBy(lib(), function (m) { return m.type; });
    var host = D.h('div');
    host.appendChild(D.h('div', { style: 'font-size:12px;font-weight:650;margin-bottom:8px;color:var(--text2)' },
      '模块库（拖拽到右侧画布）'));
    var pal = D.h('div.fd-pal');
    lib().forEach(function (m) {
      var c = D.h('div.fd-c', {
        draggable: 'true',
        title: m.type + ' · ' + m.title,
        dataset: { mid: m.id }
      }, D.h('span', moduleIcon(m.type)), D.h('span', { style: 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, m.title));
      c.addEventListener('dragstart', function (e) {
        st.dragId = m.id; st.overId = '';
        c.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', m.id); e.dataTransfer.effectAllowed = 'copy'; } catch (err) { }
      });
      c.addEventListener('dragend', function () { c.classList.remove('dragging'); st.dragId = ''; });
      /* 点击也能新增（无鼠标拖拽环境下同样可用） */
      c.addEventListener('dblclick', function () { addModule(m.id, rerender); });
      pal.appendChild(c);
    });
    host.appendChild(pal);
    host.appendChild(D.h('div.dk-tip', '支持拖拽，也支持双击模块快速添加。共 ' + lib().length + ' 种模块类型。'));
    return host;
  }

  function moduleIcon(type) {
    var map = {
      '轮播图': '🖼', '搜索条': '🔍', '图标列表': '⊞', '图表': '📈', '图文列表': '📰',
      '天气': '⛅', '文本': '📝', '表格': '▦', '图片列表': '🖼', '多图列表': '🎞',
      '文本列表': '☰', '视频': '▶', '按钮': '🔘', '地图': '🗺', '日期': '📅',
      'IP 展示': '🌐', '插件': '🧩', '搜索列表': '≣'
    };
    return map[type] || '◻';
  }

  function addModule(mid, rerender) {
    var p = curPage();
    if (!p) return;
    if (p.modules.indexOf(mid) >= 0) {
      UI.toast('该模块已在本页', '同一页面暂不支持放置两个同类型模块', 'warn');
      return;
    }
    p.modules.push(mid);
    st.selId = mid;
    DB.touchObj('portal');
    UI.toast('已添加模块', modById(mid).title + ' 已加入「' + p.name + '」', 'ok');
    if (rerender) rerender();
  }

  function removeModule(mid, rerender) {
    var p = curPage();
    var i = p.modules.indexOf(mid);
    if (i < 0) return;
    p.modules.splice(i, 1);
    if (st.selId === mid) st.selId = '';
    DB.touchObj('portal');
    UI.toast('已移除模块', modById(mid).title, 'info');
    if (rerender) rerender();
  }

  function moveModule(mid, dir, rerender) {
    var p = curPage();
    var i = p.modules.indexOf(mid), j = i + dir;
    if (i < 0 || j < 0 || j >= p.modules.length) return;
    var t = p.modules[i]; p.modules[i] = p.modules[j]; p.modules[j] = t;
    DB.touchObj('portal');
    if (rerender) rerender();
  }
  function topModule(mid, rerender) {
    var p = curPage();
    var i = p.modules.indexOf(mid);
    if (i <= 0) return;
    p.modules.splice(i, 1);
    p.modules.unshift(mid);
    DB.touchObj('portal');
    if (rerender) rerender();
  }

  function canvas(rerender) {
    var p = curPage();
    var host = D.h('div');
    host.appendChild(D.h('div', { style: 'display:flex;align-items:center;gap:9px;margin-bottom:8px' },
      D.h('div', { style: 'font-size:12px;font-weight:650;color:var(--text2)' }, '画布 · ' + (p ? p.name : '') + '（' + (p ? p.path : '') + '）'),
      D.h('span.muted', (p ? p.modules.length : 0) + ' 个模块'),
      D.h('div', { style: 'margin-left:auto' }, D.h('span.muted', '拖动排序 · 单击选中 · 悬停可删除'))
    ));
    var cv = D.h('div.fd-canvas');
    cv.addEventListener('dragover', function (e) {
      e.preventDefault();
      cv.classList.add('over');
      try { e.dataTransfer.dropEffect = 'copy'; } catch (err) { }
    });
    cv.addEventListener('dragleave', function () { cv.classList.remove('over'); });
    cv.addEventListener('drop', function (e) {
      e.preventDefault(); cv.classList.remove('over');
      var mid = st.dragId;
      try { mid = e.dataTransfer.getData('text/plain') || mid; } catch (err) { }
      if (!mid) return;
      var src = (p.modules || []).indexOf(mid);
      if (src >= 0) return;           /* 已在画布中：由模块自身排序处理 */
      addModule(mid, rerender);
    });

    if (!p || !p.modules.length) {
      cv.appendChild(UI.empty('画布为空', '从左侧模块库拖拽模块到这里完成搭建'));
      host.appendChild(cv);
      return host;
    }

    p.modules.forEach(function (mid, i) {
      var m = modById(mid);
      if (!m) return;
      var item = D.h('div.fd-item' + (st.selId === mid ? '.sel' : ''), { draggable: 'true', dataset: { mid: mid } },
        D.h('span.fd-tag', m.type),
        D.h('div.fd-lb', (i + 1) + '. ' + m.title),
        D.h('div.fd-ph', { style: 'color:var(--text2)' }, cfgSummary(m)),
        D.h('div', { style: 'margin-top:7px;display:flex;gap:6px' },
          KP.btn('↑ 上移', function (e) { stop(e); moveModule(mid, -1, rerender); }),
          KP.btn('↓ 下移', function (e) { stop(e); moveModule(mid, 1, rerender); }),
          KP.btn('置顶', function (e) { stop(e); topModule(mid, rerender); })
        ),
        D.h('span.fd-x', { title: '移除该模块', onclick: function (e) { stop(e); removeModule(mid, rerender); } }, '✕ 移除')
      );
      item.addEventListener('click', function () { st.selId = mid; rerender(); });
      item.addEventListener('dragstart', function (e) {
        st.dragId = mid;
        item.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', mid); e.dataTransfer.effectAllowed = 'move'; } catch (err) { }
      });
      item.addEventListener('dragend', function () { item.classList.remove('dragging'); st.dragId = ''; });
      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (!st.dragId || st.dragId === mid) return;
        /* 实时换位：拖拽经过时直接交换，做到「拖到哪就排到哪」 */
        var arr = p.modules;
        var from = arr.indexOf(st.dragId), to = arr.indexOf(mid);
        if (from < 0 || to < 0 || from === to) return;
        arr.splice(to, 0, arr.splice(from, 1)[0]);
        DB.touchObj('portal');
        rerender();
      });
      cv.appendChild(item);
    });
    host.appendChild(cv);
    return host;
  }

  function stop(e) { if (e && e.stopPropagation) e.stopPropagation(); }

  /** 模块配置摘要（画布中显示，便于确认搭建内容） */
  function cfgSummary(m) {
    var c = m.cfg || {};
    if (c.items) return '内容项 ' + c.items.length + ' 条';
    if (c.placeholder) return '输入提示：' + c.placeholder;
    if (c.chart) return c.chart + ' · ' + (c.metric || '');
    if (c.text) return String(c.text).slice(0, 40);
    if (c.note) return String(c.note).slice(0, 40);
    if (c.count) return '展示 ' + c.count + ' 条';
    if (c.name) return c.name + (c.duration ? ' · ' + c.duration : '');
    if (c.city) return c.city;
    if (c.center) return '中心点 ' + c.center;
    if (c.format) return c.format;
    if (c.source) return '数据源 ' + c.source;
    return Object.keys(c).map(function (k) { return k + '=' + c[k]; }).join(' · ') || '默认配置';
  }

  /* ===================== 模块属性编辑 ===================== */
  function inspector(rerender) {
    var m = st.selId ? modById(st.selId) : null;
    if (!m) {
      return UI.card({
        title: '模块属性',
        body: UI.empty('未选中模块', '在画布中单击模块即可在此编辑属性')
      });
    }
    var c = m.cfg || {};
    var fields = [];
    fields.push(UI.field({ label: '模块标题', control: UI.input({ value: m.title, onInput: function (e) { m.title = e.target.value; } }) }));
    Object.keys(c).forEach(function (k) {
      var v = c[k];
      if (Array.isArray(v)) {
        fields.push(UI.field({
          label: k + '（每行一项，共 ' + v.length + ' 项）',
          control: UI.textarea({
            rows: Math.min(5, Math.max(2, v.length)),
            value: v.map(function (x) { return Array.isArray(x) ? x.join(' | ') : x; }).join('\n'),
            onInput: function (e) {
              var arr = e.target.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
              c[k] = v.length && Array.isArray(v[0]) ? arr.map(function (x) { return x.split('|').map(function (y) { return y.trim(); }); }) : arr;
            }
          })
        }));
        return;
      }
      if (typeof v === 'boolean') {
        fields.push(D.h('div', { style: 'margin-bottom:10px' },
          UI.swRow({ title: k, checked: v, onChange: function (nv) { c[k] = nv; } })));
        return;
      }
      if (typeof v === 'number') {
        fields.push(UI.field({ label: k, control: UI.input({ type: 'number', value: v, onInput: function (e) { c[k] = U.num(e.target.value); } }) }));
        return;
      }
      fields.push(UI.field({ label: k, control: UI.input({ value: v === undefined ? '' : String(v), onInput: function (e) { c[k] = e.target.value; } }) }));
    });
    return UI.card({
      title: '模块属性 · ' + m.title,
      sub: '类型：' + m.type,
      body: D.h('div', {}, fields),
      note: D.h('div', { style: 'display:flex;gap:8px' },
        D.h('button.btn.btn-sm.btn-p', {
          onclick: function () {
            DB.touchObj('portal');
            UI.toast('模块属性已保存', m.title + ' 已更新', 'ok');
            rerender();
          }
        }, '保存属性'),
        D.h('button.btn.btn-sm', { onclick: function () { removeModule(m.id, rerender); } }, '从本页移除'))
    });
  }

  /* ===================== 三、门户预览（PC / 移动端） ===================== */
  function renderModuleView(m) {
    var c = m.cfg || {};
    var box = D.h('div.pv-block');
    switch (m.type) {
      case '轮播图': {
        box.appendChild(D.h('div.pv-hero',
          D.h('div', { style: 'font-size:16px;font-weight:700;margin-bottom:6px' }, (c.items || [])[0] || '欢迎访问'),
          D.h('div', { style: 'opacity:.9;font-size:12.5px' }, '共 ' + (c.items || []).length + ' 张轮播 · 自动播放 ' + (c.interval || 4) + ' 秒')
        ));
        box.appendChild(D.h('div.pv-carousel', (c.items || []).map(function (t, i) {
          return D.h('div', {
            style: 'flex:0 0 168px;border:1px solid var(--line);border-radius:9px;padding:9px;font-size:11.8px;background:#fff'
          }, D.h('div', { style: 'height:44px;border-radius:6px;margin-bottom:6px;background:linear-gradient(120deg,' + C.color(i) + '33,' + C.color(i) + '11)' }), t);
        })));
        break;
      }
      case '搜索条':
        box.appendChild(D.h('div.pv-search',
          UI.input({ placeholder: c.placeholder || '搜索…' }),
          D.h('button.btn.btn-sm.btn-p', '搜索')));
        break;
      case '图标列表':
        box.appendChild(D.h('div.pv-ico-grid', (c.items || []).map(function (it) {
          var emo = Array.isArray(it) ? it[0] : '◻', lab = Array.isArray(it) ? it[1] : it;
          return D.h('div', { style: 'border:1px solid var(--line);border-radius:10px;padding:12px 6px;text-align:center;background:#fff' },
            D.h('div', { style: 'font-size:20px' }, emo),
            D.h('div', { style: 'font-size:11.5px;margin-top:5px' }, lab));
        })));
        break;
      case '图表': {
        var agg = DB.agg(DB.col('students').slice(0, 200), DB.col('scoreRecs'));
        box.appendChild(D.h('div.pv-chart',
          C.donut(DB.col('cats').map(function (cc, i) {
            return { n: cc.name, v: U.round(U.sum(agg, function (x) { return U.num(x.cat[cc.name] || 0); }), 0), c: cc.color || C.color(i) };
          }), { size: 168 }),
          C.legend(DB.col('cats').map(function (cc, i) { return { n: cc.name, c: cc.color || C.color(i) }; }))
        ));
        break;
      }
      case '图文列表': {
        var as = KP.pubList(DB.col('activities')).slice(0, c.count || 6);
        box.appendChild(D.h('div', as.map(function (a) {
          return D.h('div', { style: 'display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)' },
            D.h('div', { style: 'flex:1' },
              D.h('div', { style: 'font-size:12.8px;font-weight:600' }, a.title),
              D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:3px' }, a.college + ' · ' + a.cat + (c.showTime ? ' · ' + a.start : '')),
              D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:2px' }, '报名 ' + a.enrolled + ' 人 · ' + a.level)
            ),
            D.h('button.btn.btn-sm', '查看')
          );
        })));
        break;
      }
      case '天气':
        box.appendChild(D.h('div.pv-weather',
          D.h('div', { style: 'font-size:30px' }, '⛅'),
          D.h('div', {},
            D.h('div', { style: 'font-size:15px;font-weight:700' }, '多云转晴 22—29℃'),
            D.h('div', { style: 'font-size:11.5px;color:var(--text3);margin-top:3px' }, (c.city || '重庆') + ' · 空气质量良 · 适宜户外活动')),
          D.h('div', { style: 'margin-left:auto;text-align:right' },
            D.h('div', { style: 'font-size:17px;font-weight:700' }, String(DB.data.meta.now || '').slice(5, 10)),
            D.h('div', { style: 'font-size:11px;color:var(--text3)' }, '第二课堂服务中'))
        ));
        break;
      case '文本':
        box.appendChild(D.h('div.pv-text', c.text || ''));
        break;
      case '表格':
        box.appendChild(D.h('div.pv-table', D.h('div', { html: KP.tableHTML(
          [{ t: '学院', k: 'name' }, { t: '学生数', k: 'students' }, { t: '达标人数', k: 'pass' }, { t: '达标率(%)', k: 'rate' }],
          collegeRows().slice(0, 6)
        ) })));
        break;
      case '图片列表':
      case '多图列表': {
        var items = c.items || [];
        box.appendChild(D.h('div.pv-img-list', items.map(function (t, i) {
          var lab = Array.isArray(t) ? t[0] : t;
          return D.h('div', { style: 'border:1px solid var(--line);border-radius:9px;overflow:hidden;background:#fff' },
            D.h('div', { style: 'height:56px;background:linear-gradient(135deg,' + C.color(i) + '44,' + C.color(i + 1) + '22)' }),
            D.h('div', { style: 'padding:6px 8px;font-size:11.5px' }, lab));
        })));
        break;
      }
      case '文本列表':
        box.appendChild(D.h('div', (c.items || []).map(function (t, i) {
          return D.h('div', { style: 'display:flex;gap:8px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:12.3px' },
            D.h('span', { style: 'color:var(--primary);font-weight:600' }, U.pad(i + 1, 2)),
            D.h('span', { style: 'flex:1' }, t),
            D.h('span.muted', '查看'));
        })));
        break;
      case '视频':
        box.appendChild(D.h('div.pv-video', '▶ ' + (c.name || '宣传视频') + ' · ' + (c.duration || '')));
        break;
      case '按钮':
        box.appendChild(D.h('div.pv-btn-row', (c.items || []).map(function (t) {
          var lab = Array.isArray(t) ? t[0] : t;
          return D.h('button.btn.btn-sm.btn-p', lab);
        })));
        break;
      case '地图':
        box.appendChild(D.h('div.pv-map', D.h('div', {
          style: 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;font-size:11.5px;color:var(--text3)'
        }, D.h('div', { style: 'font-size:22px' }, '📍'), '活动地点：' + (c.center || '校内') + ' · ' + (c.pin || ''))));
        break;
      case '日期':
        box.appendChild(D.h('div.pv-weather',
          D.h('div', { style: 'font-size:24px' }, '📅'),
          D.h('div', {},
            D.h('div', { style: 'font-size:15px;font-weight:700' }, String(DB.data.meta.now || '').slice(0, 10)),
            D.h('div', { style: 'font-size:11.5px;color:var(--text3)' }, '格式：' + (c.format || 'YYYY-MM-DD')))));
        break;
      case 'IP 展示':
        box.appendChild(D.h('div.pv-text',
          '您的访问信息：IP 10.16.x.x · 校内网络 · 位置：重庆市 · ' +
          (c.showIp ? '已记录访问 IP' : '未记录 IP') + ' / ' + (c.showLocation ? '已记录位置' : '未记录位置')));
        break;
      case '插件':
        box.appendChild(D.h('div.pv-text', '第三方插件位：' + (c.name || '') + '（类型 ' + (c.type || '') + '）'));
        break;
      case '搜索列表':
        box.appendChild(D.h('div', { html: KP.tableHTML(
          [{ t: '标题', k: 'title' }, { t: '类别', k: 'cat' }, { t: '学院', k: 'college' }],
          KP.pubList(DB.col('activities')).slice(0, 8)
        ) }));
        break;
      default:
        box.appendChild(D.h('div.pv-text', m.title));
    }
    return box;
  }

  function collegeRows() {
    var ss = DB.col('students'), recs = DB.col('scoreRecs');
    var sc = DB.scheme(), passLine = U.num(sc ? sc.standard.pass : 6);
    var recBy = U.groupBy(recs, function (r) { return r.studentId; });
    return U.groupBy(ss, function (s) { return s.college; }) && Object.keys(U.groupBy(ss, function (s) { return s.college; })).map(function (c) {
      var list = U.groupBy(ss, function (s) { return s.college; })[c], pass = 0;
      list.forEach(function (s) { if (U.sum(recBy[s.id] || [], function (r) { return U.num(r.credit); }) >= passLine) pass++; });
      return { name: c, students: list.length, pass: pass, rate: U.pctNum(pass, list.length) };
    }).sort(function (a, b) { return b.rate - a.rate; });
  }

  function previewCard() {
    var p = portal(), pg = curPage();
    var themeBg = p.theme === 'green' ? 'linear-gradient(120deg,#059669,#0891b2)'
      : (p.theme === 'purple' ? 'linear-gradient(120deg,#7c3aed,#2563eb)' : 'linear-gradient(120deg,#2563eb,#0891b2)');
    var inner = D.h('div');
    inner.appendChild(D.h('div', { style: 'border-radius:11px;padding:18px;color:#fff;background:' + themeBg },
      D.h('div', { style: 'font-size:16px;font-weight:750' }, p.title),
      D.h('div', { style: 'font-size:12px;opacity:.92;margin-top:4px' }, p.subtitle),
      D.h('div', { style: 'font-size:11px;opacity:.8;margin-top:8px' }, p.domain + (pg ? ' · ' + pg.path : ''))));
    curModules().forEach(function (m) { inner.appendChild(renderModuleView(m)); });
    inner.appendChild(D.h('div', { style: 'text-align:center;font-size:11px;color:var(--text3);padding:12px 0' }, p.icp));

    var shell;
    if (st.preview === 'mobile') {
      shell = D.h('div.m-pv-wrap',
        D.h('div.m-pv-frame',
          D.h('div.m-pv-bar', D.h('span', { style: 'font-size:10px;color:#94a3b8' }, '9:41'), D.h('span', { style: 'font-size:10px;color:#94a3b8' }, '●●●')),
          D.h('div.m-pv-body', inner)
        ));
    } else {
      shell = D.h('div', { style: 'border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff' },
        D.h('div', { style: 'display:flex;align-items:center;gap:6px;padding:8px 11px;border-bottom:1px solid var(--line);background:#f8fafc' },
          D.h('span', { style: 'width:9px;height:9px;border-radius:50%;background:#f87171;display:inline-block' }),
          D.h('span', { style: 'width:9px;height:9px;border-radius:50%;background:#fbbf24;display:inline-block' }),
          D.h('span', { style: 'width:9px;height:9px;border-radius:50%;background:#34d399;display:inline-block' }),
          D.h('span', { style: 'margin-left:8px;font-size:11.5px;color:var(--text3);background:#fff;border:1px solid var(--line);border-radius:6px;padding:2px 10px;flex:1' }, 'https://' + p.domain + (pg ? pg.path : '/'))),
        D.h('div', { style: 'padding:16px;max-height:620px;overflow:auto' }, inner));
    }

    return UI.card({
      title: '门户预览',
      sub: '页面：' + (pg ? pg.name : '—') + ' · 模块 ' + curModules().length + ' 个 · ' + (st.preview === 'mobile' ? '移动端' : 'PC 端'),
      right: UI.seg({
        options: [['pc', 'PC 端'], ['mobile', '移动端']],
        value: st.preview, onChange: function (v) { st.preview = v; w.ZR.render(); }
      }),
      body: shell,
      note: D.h('span.muted', '预览内容与真实业务数据同源：活动、成绩、达标率均取自系统当前数据。')
    });
  }

  /* ===================== 四、页面管理 ===================== */
  function pageCard(rerender) {
    return UI.card({
      title: '门户页面',
      sub: '共 ' + pages().length + ' 个页面 · 点击切换当前编辑页面',
      flush: true,
      body: D.h('table.tbl',
        D.h('thead', D.h('tr', ['页面名称', '路径', '模块数', '包含模块', '操作'].map(function (h) { return D.h('th', h); }))),
        D.h('tbody', pages().map(function (p) {
          return D.h('tr' + (p.id === st.pageId ? '' : ''), [
            D.h('td', {}, p.id === st.pageId
              ? D.h('span', { style: 'font-weight:700;color:var(--primary)' }, '● ' + p.name)
              : D.h('a', { href: 'javascript:;', onclick: function () { st.pageId = p.id; st.selId = ''; rerender(); } }, p.name)),
            D.h('td', {}, p.path),
            D.h('td', {}, p.modules.length + ' 个'),
            D.h('td', { style: 'font-size:11.5px;color:var(--text3)' }, p.modules.map(function (id) { var m = modById(id); return m ? m.title : id; }).join('、') || '—'),
            D.h('td', {}, KP.acts([
              KP.btn('编辑', function () { st.pageId = p.id; st.tab = 'build'; rerender(); }),
              KP.btn('清空', function () { p.modules = []; DB.touchObj('portal'); UI.toast('已清空页面模块', p.name, 'info'); rerender(); })
            ]))
          ]);
        }))),
      note: D.h('div', { style: 'display:flex;gap:9px' },
        D.h('span.muted', '门户路径直接对应线上访问地址，可自行调整。'),
        D.h('div', { style: 'margin-left:auto' },
          D.h('button.btn.btn-sm', {
            onclick: function () {
              var nm = window.prompt('请输入新页面名称', '新页面');
              if (!nm) return;
              var id = 'PG' + (pages().length + 1);
              pages().push({ id: id, name: nm, path: '/p' + (pages().length + 1), modules: [] });
              DB.touchObj('portal');
              UI.toast('已新增页面', nm + '（路径 /p' + pages().length + '）', 'ok');
              rerender();
            }
          }, '＋ 新增页面'))
      )
    });
  }

  /* ===================== 页面入口 ===================== */
  function render(host) {
    var p = portal();
    host.appendChild(UI.pageHd({
      title: '门户配置',
      desc: '可视化拖拽搭建门户页面；模块库 20 种类型，支持 PC 端与移动端双视图预览。',
      right: [
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('content'); } }, '内容安全'),
        D.h('button.btn.btn-sm', { onclick: function () { w.ZR.go('ai'); } }, 'AI 助手配置')
      ]
    }));

    host.appendChild(baseCard(function () { w.ZR.render(); }));
    host.appendChild(D.h('div', { style: 'height:14px' }));

    host.appendChild(UI.tabs({
      items: [{ k: 'build', n: '拖拽搭建' }, { k: 'pages', n: '页面管理' + '' }, { k: 'preview', n: '门户预览' }],
      cur: st.tab, onChange: function (v) { st.tab = v; w.ZR.render(); }
    }));

    var body = D.h('div', { style: 'margin-top:14px' });
    var rr = function () { w.ZR.render(); };

    if (st.tab === 'build') {
      body.appendChild(D.h('div.fd-wrap',
        UI.card({ title: '模块库', sub: lib().length + ' 种类型', body: palette(rr) }),
        UI.card({ title: '页面画布', sub: '拖拽排序 / 双击模块库可快速添加', body: canvas(rr) }),
        D.h('div', {}, inspector(rr))
      ));
      body.appendChild(D.h('div', { style: 'height:14px' }));
      body.appendChild(D.h('div.g2',
        pageCard(rr),
        UI.card({
          title: '已启用模块清单',
          sub: '当前页面模块与配置摘要',
          body: D.h('div', curModules().length
            ? curModules().map(function (m) {
              return D.h('div', { style: 'display:flex;gap:8px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:12.3px' },
                D.h('span', moduleIcon(m.type)),
                D.h('b', { style: 'min-width:110px' }, m.title),
                D.h('span.muted', { style: 'flex:1' }, m.type + ' · ' + cfgSummary(m)),
                D.h('a', { href: 'javascript:;', onclick: function () { st.selId = m.id; rr(); } }, '编辑'));
            })
            : UI.empty('本页还没有模块', '从左侧模块库拖拽添加'))
        })
      ));
    } else if (st.tab === 'pages') {
      body.appendChild(pageCard(rr));
      body.appendChild(D.h('div', { style: 'height:14px' }));
      body.appendChild(UI.card({
        title: '模块库总览',
        sub: '共 ' + lib().length + ' 种模块类型，按类型分组',
        body: D.h('div', Object.keys(U.groupBy(lib(), function (m) { return m.type; })).map(function (t) {
          var g = U.groupBy(lib(), function (m) { return m.type; })[t];
          return D.h('div', { style: 'display:flex;gap:9px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:12.3px' },
            D.h('b', { style: 'min-width:92px' }, t),
            D.h('span.muted', { style: 'flex:1' }, g.map(function (m) { return m.title; }).join('、')),
            D.h('span.muted', g.length + ' 个'));
        }))
      }));
    } else {
      body.appendChild(previewCard());
      body.appendChild(D.h('div', { style: 'height:14px' }));
      body.appendChild(D.h('div.g2', pageCard(rr), inspector(rr)));
    }
    host.appendChild(body);
  }

  KP.pages({
    portal: { title: '门户配置', group: '门户与智能', render: render }
  });
})(window);
