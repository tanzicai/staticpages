/* ==========================================================================
   headless.js —— 无头验证台（自研 DOM 桩 + node vm）
   用法：
     node tools/headless.js probe            探测核心层对外 API
     node tools/headless.js pages            列出已注册页面
     node tools/headless.js render [key]     渲染全部/指定页面并断言
     node tools/headless.js click  [key]     渲染后对可交互元素做点击扫描
     node tools/headless.js dump   <key>     输出指定页面可见文本
   前提：NODE_PATH 指向已装 jsdom 的工作区（本文件不依赖 jsdom）。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createWindow } = require('./domstub.js');

const ROOT = path.join(__dirname, '..');

const CORE = [
  'js/core/util.js', 'js/core/dom.js', 'js/core/qr.js',
  'js/core/seed/base.js', 'js/core/seed/org.js', 'js/core/seed/academic.js',
  'js/core/seed/activity.js', 'js/core/seed/community.js', 'js/core/seed/ops.js',
  'js/core/seed/index.js', 'js/core/db.js', 'js/core/charts.js', 'js/core/ui.js',
  'js/core/auth.js', 'js/core/router.js', 'js/core/demo.js'
];

function pageFiles() {
  const dir = path.join(ROOT, 'js/pages');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.js'))
    .map(f => 'js/pages/' + f)
    .sort((a, b) => {
      const pa = /\/_/.test(a), pb = /\/_/.test(b);
      if (pa !== pb) return pa ? -1 : 1;
      return a.localeCompare(b);
    });
}

function boot(opts) {
  opts = opts || {};
  const w = createWindow();
  /* 复刻 app.html 的外壳结构（自研 DOM 桩不会解析 HTML，需手工建节点） */
  const doc = w.document;
  doc.body.appendChild(w.__el('header', { class: 'topbar', id: 'topbar' }));
  doc.body.appendChild(w.__el('aside', { class: 'sidebar', id: 'sidebar' }));
  doc.body.appendChild(w.__el('main', { class: 'main', id: 'main' }));
  doc.body.appendChild(w.__el('div', { class: 'toast-wrap', id: 'toastWrap' }));
  const ctx = vm.createContext(w);
  const errs = [];

  const load = (rel) => {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) { errs.push({ file: rel, msg: '文件不存在' }); return false; }
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: rel }); return true; }
    catch (e) { errs.push({ file: rel, msg: e.message }); return false; }
  };
  CORE.forEach(load);

  let sessionOk = false;
  try {
    w.DB.init(true);
    const staff = w.DB.col('staff');
    for (const s of staff) {
      const r = w.ZA.login(s.account, s.pw);
      if (r && r.ok) { sessionOk = true; break; }
    }
    if (!sessionOk) sessionOk = !!w.ZA.restore();
  } catch (e) { errs.push({ file: 'auth-login', msg: e.message }); }

  if (opts.withPages !== false) pageFiles().forEach(load);

  /* 外壳：不跑 ZAPP.boot()（它会跳转登录页），手动挂载顶栏与侧栏 */
  try { load('js/app.js'); } catch (e) { }
  if (opts.withShell !== false) mountShell(w);
  /* 启动路由（注册 hashchange 监听），等价于 ZAPP.boot() 的第 5 步 */
  if (opts.withPages !== false && w.ZR) {
    try { w.ZR.start(w.ZA.isStudent() ? 'mine' : 'dash'); } catch (e) { errs.push({ file: 'router-start', msg: e.message }); }
  }

  w.__loadErrors = errs;
  return { w, ctx, errs, sessionOk, load };
}

function mountShell(w) {
  const D = w.ZD;
  try {
    const top = w.document.getElementById('topbar');
    if (top && w.ZAPP) {
      D.fill(top, null);
      const s = w.ZA.session || {};
      top.appendChild(D.h('div.brand', D.h('div.logo', '二'), D.h('span', '第二课堂成绩单系统')));
      top.appendChild(D.h('div', s.name || ''));
    }
    const sb = w.document.getElementById('sidebar');
    if (sb && w.ZAPP && w.ZAPP.menuFor) {
      D.fill(sb, null);
      w.ZAPP.menuFor(w.ZA.role()).forEach(function (g) {
        g.items.forEach(function (it) {
          sb.appendChild(D.h('div.nav-i', { dataset: { id: it.id } }, D.h('span', it.n)));
        });
      });
    }
  } catch (e) { }
}

/* 占位实现文案（技能明确禁止） */
const PLACEHOLDER = [
  [/待接入/, '待接入'], [/敬请期待/, '敬请期待'], [/暂未开放/, '暂未开放'],
  [/coming\s*soon/i, 'coming soon'], [/功能开发中/, '功能开发中'],
  [/占位/, '占位'], [/示例文本/, '示例文本'], [/lorem/i, 'lorem'],
  [/此处省略/, '此处省略'], [/TODO/, 'TODO']
];

function scan(w) {
  const main = w.document.getElementById('main');
  const txt = main ? main.textContent : '';
  const hits = PLACEHOLDER.filter(p => p[0].test(txt)).map(p => p[1]);
  return { hits, len: txt.replace(/\s+/g, '').length, txt };
}

const SKIP_CLICK = /删除|移除|退出|复位|清空|禁用|注销|解散|作废|重置|取消|驳回/;

function clickScan(w) {
  const main = w.document.getElementById('main');
  if (!main) return { clicks: 0, bad: 0, msgs: [] };
  const msgs = [];
  const nodes = main.querySelectorAll('button, .tab, .chip, .seg button, .nav-i, .sf-h, .mini, .lst-i, .sw input');
  let clicks = 0;
  for (const el of nodes) {
    const label = String(el.textContent || '').trim();
    if (SKIP_CLICK.test(label)) continue;
    w.ZR.errors.length = 0;
    try { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); }
    catch (e) { msgs.push('[' + label.slice(0, 12) + '] 抛错 ' + e.message); }
    clicks++;
    try { if (w.__flush) w.__flush(2); } catch (e) { msgs.push('[' + label.slice(0, 12) + '] 定时器抛错 ' + e.message); }
    try { w.ZUI.closeAllModals(); } catch (e) { }
    if (w.ZR.errors.length) msgs.push('[' + label.slice(0, 12) + '] ' + (w.ZR.errors[0].msg || 'err'));
    if (msgs.length >= 6) break;
  }
  try { w.DB.reset(); w.ZUI.closeAllModals(); } catch (e) { }
  return { clicks, bad: msgs.length, msgs };
}

const mode = process.argv[2] || 'render';
const only = process.argv[3] || '';

if (mode === 'probe') {
  const { w, errs, sessionOk } = boot({ withPages: false, withShell: false });
  console.log('核心层装载错误:', errs.length ? JSON.stringify(errs) : '无');
  console.log('会话建立:', sessionOk, '| 角色:', w.ZA.role());
  console.log('ZA 方法:', Object.keys(w.ZA).filter(k => typeof w.ZA[k] === 'function').join(', '));
  console.log('ZA 属性:', Object.keys(w.ZA).filter(k => typeof w.ZA[k] !== 'function').join(', '));
  console.log('数据集合数:', Object.keys(w.DB.data).length);
  const st = w.DB.col('staff')[0] || {};
  console.log('staff 字段:', Object.keys(st).join(','));
  console.log('students 字段:', Object.keys(w.DB.col('students')[0] || {}).join(','));
  console.log('activities 字段:', Object.keys(w.DB.col('activities')[0] || {}).join(','));
  console.log('enrollments 字段:', Object.keys(w.DB.col('enrollments')[0] || {}).join(','));
  console.log('signins 字段:', Object.keys(w.DB.col('signins')[0] || {}).join(','));
  console.log('scoreApps 字段:', Object.keys(w.DB.col('scoreApps')[0] || {}).join(','));
  console.log('scoreRecs 字段:', Object.keys(w.DB.col('scoreRecs')[0] || {}).join(','));
  console.log('warnings 字段:', Object.keys(w.DB.col('warnings')[0] || {}).join(','));
  console.log('contents 字段:', Object.keys(w.DB.col('contents')[0] || {}).join(','));
  console.log('clubs 字段:', Object.keys(w.DB.col('clubs')[0] || {}).join(','));
  console.log('scheme:', JSON.stringify(w.DB.col('schemes')[0] || {}).slice(0, 700));
  console.log('cats:', (w.DB.data.cats || []).map(c => c.name + '(' + (c.credit || '') + ')').join(' '));
  console.log('tpls:', (w.DB.col('tpls') || []).map(t => t.name).join(' | '));
  console.log('portal keys:', Object.keys(w.DB.data.portal || {}).join(','));
  console.log('screenCfg keys:', Object.keys(w.DB.data.screenCfg || {}).join(','));
  console.log('ai keys:', Object.keys(w.DB.data.ai || {}).join(','));
  console.log('safety keys:', Object.keys(w.DB.data.safety || {}).join(','));
  console.log('party keys:', Object.keys(w.DB.data.party || {}).join(','));
  console.log('msgs 字段:', Object.keys(w.DB.col('msgs')[0] || {}).join(','));
  console.log('actRules:', JSON.stringify(w.DB.data.actRules || {}).slice(0, 500));
  console.log('warnRules:', JSON.stringify(w.DB.data.warnRules || {}).slice(0, 400));
  console.log('blacklist:', (w.DB.data.blacklist || []).length, JSON.stringify((w.DB.data.blacklist || [])[0] || {}).slice(0, 240));
  process.exit(0);
}

if (mode === 'pages') {
  const { w } = boot();
  console.log('页面文件:', pageFiles().join(', '));
  console.log('已注册路由:', w.ZR.order.join(', '));
  process.exit(0);
}

if (mode === 'render' || mode === 'click') {
  const { w, errs, sessionOk } = boot();
  console.log('【装载】错误 ' + errs.length + (errs.length ? ' ' + JSON.stringify(errs) : '') + ' | 会话 ' + sessionOk);
  w.ZR.errors.length = 0;
  const keys = only ? [only] : w.ZR.order.slice();
  if (!keys.length) { console.log('未注册任何页面'); process.exit(1); }
  let bad = 0;
  const rows = [];
  const details = [];
  for (const k of keys) {
    const def = w.ZR.pages[k];
    if (!def) { rows.push([k, '未注册', '', '', '']); bad++; continue; }
    let thrown = '';
    w.ZR.errors.length = 0;
    try { w.ZR.go(k); } catch (e) { thrown = e.message; }
    const main = w.document.getElementById('main');
    const nodes = main ? main.querySelectorAll('*').length : 0;
    const crash = main ? /渲染异常/.test(main.textContent) : true;
    const sc = scan(w);
    const rerr = w.ZR.errors.length;
    const ok = !thrown && !crash && nodes > 12 && rerr === 0 && sc.hits.length === 0;
    if (!ok) bad++;
    const note = (sc.hits.join('|') ? '占位:' + sc.hits.join('|') + ' ' : '') +
      (thrown ? '抛错:' + thrown + ' ' : '') + (crash ? '异常卡片 ' : '') +
      (rerr ? '错误:' + JSON.stringify(w.ZR.errors.slice(0, 2)) : '');
    rows.push([k, ok ? 'OK' : 'FAIL', nodes, sc.len, note]);
    if (!ok) details.push({ key: k, note, text: sc.txt.slice(0, 600) });

    if (mode === 'click') {
      const res = clickScan(w);
      if (res.bad) { rows.push([' ↳点击', 'FAIL', res.clicks, '', res.msgs.join(' ;; ')]); bad++; details.push({ key: k + ' 点击', note: res.msgs.join(' ;; ') }); }
      else rows.push([' ↳点击', 'OK', res.clicks, '', '']);
    }
  }
  console.log('');
  console.log('页面'.padEnd(14) + '结果'.padEnd(8) + '节点'.padEnd(8) + '字数'.padEnd(8) + '备注');
  console.log('-'.repeat(96));
  rows.forEach(r => console.log(String(r[0]).padEnd(14) + String(r[1]).padEnd(8) + String(r[2]).padEnd(8) + String(r[3]).padEnd(8) + (r[4] || '')));
  console.log('-'.repeat(96));
  console.log('通过 ' + (rows.filter(r => r[1] === 'OK').length) + ' / 失败 ' + rows.filter(r => r[1] === 'FAIL').length);
  if (details.length) {
    console.log('\n---- 失败详情 ----');
    details.forEach(d => { console.log('## ' + d.key + '\n' + d.note + '\n' + (d.text || '') + '\n'); });
  }
  process.exit(bad ? 1 : 0);
}

if (mode === 'dump') {
  const { w } = boot();
  w.ZR.go(only || 'dash');
  if (w.__flush) w.__flush(2);
  console.log(scan(w).txt.replace(/\s+/g, ' ').trim().slice(0, 5000));
  process.exit(0);
}
