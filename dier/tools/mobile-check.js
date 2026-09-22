/* ==========================================================================
   mobile-check.js —— 移动端路由验证台
   与 m.html 完全一致的脚本装载顺序，逐个遍历移动端路由并断言：
     · 页面 render 不抛异常、节点数正常、无占位文案
     · 关键路由有实质内容（字数下限）
   用法：node tools/mobile-check.js
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createWindow } = require('./domstub.js');

const ROOT = path.join(__dirname, '..');
const SCRIPTS = [
  'js/core/util.js', 'js/core/dom.js', 'js/core/qr.js',
  'js/core/seed/base.js', 'js/core/seed/org.js', 'js/core/seed/academic.js',
  'js/core/seed/activity.js', 'js/core/seed/community.js', 'js/core/seed/ops.js',
  'js/core/seed/index.js', 'js/core/db.js', 'js/core/charts.js', 'js/core/ui.js',
  'js/core/auth.js', 'js/core/router.js', 'js/core/demo.js',
  'js/pages/_kit.js', 'js/pages/_sign.js', 'js/mobile.js'
];
const PLACEHOLDER = [
  [/待接入/, '待接入'], [/敬请期待/, '敬请期待'], [/暂未开放/, '暂未开放'],
  [/coming\s*soon/i, 'coming soon'], [/功能开发中/, '功能开发中'], [/占位/, '占位'],
  [/示例文本/, '示例文本'], [/lorem/i, 'lorem'], [/此处省略/, '此处省略'], [/TODO/, 'TODO']
];

const w = createWindow();
const doc = w.document;
doc.body.appendChild(w.__el('div', { class: 'm-stage', id: 'mStage' }));
const ctx = vm.createContext(w);
const errs = [];
SCRIPTS.forEach(f => {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { errs.push(f + ' 不存在'); return; }
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); }
  catch (e) { errs.push(f + ' :: ' + e.message); }
});
console.log('【装载】错误 ' + errs.length + (errs.length ? ' ' + JSON.stringify(errs) : '') + ' | 会话 ' + !!w.ZA.session + ' | 角色 ' + w.ZA.role());

/* 带参数的路由：传入真实业务实体的 ID，验证其在真实数据下的渲染 */
const PARAM = (function () {
  const stu = w.ZA.viewStudent();
  const enr = stu ? w.DB.find('enrollments', e => e.studentId === stu.id && e.status === '已通过') : null;
  const act = enr ? w.DB.get('activities', enr.actId) : w.DB.col('activities')[0];
  return { act: act ? act.id : '', sign: act ? act.id : '' };
})();
console.log('参数路由取真实实体：act/sign → ' + (PARAM.act || '(无可用活动)'));

const keys = Object.keys(w.ZM.PAGES);
console.log('移动端路由 ' + keys.length + ' 条：' + keys.join(', '));
console.log('');
console.log('路由'.padEnd(14) + '结果'.padEnd(8) + '节点'.padEnd(8) + '字数'.padEnd(8) + '备注');
console.log('-'.repeat(84));

let bad = 0;
const rows = [];
keys.forEach(k => {
  let thrown = '';
  try { w.ZM.go(k, PARAM[k] || undefined); } catch (e) { thrown = e.message; }
  const stage = doc.getElementById('mStage');
  const device = stage ? stage.querySelector('.m-device') : null;
  const nodes = device ? device.querySelectorAll('*').length : 0;
  const txt = device ? device.textContent : '';
  const hits = PLACEHOLDER.filter(p => p[0].test(txt)).map(p => p[1]);
  const len = txt.replace(/\s+/g, '').length;
  const ok = !thrown && nodes > 20 && len > 30 && hits.length === 0;
  if (!ok) bad++;
  const note = (thrown ? '抛错:' + thrown + ' ' : '') + (hits.length ? '占位:' + hits.join('|') : '');
  rows.push([k, ok ? 'OK' : 'FAIL', nodes, len, note]);
});
rows.forEach(r => console.log(String(r[0]).padEnd(14) + String(r[1]).padEnd(8) + String(r[2]).padEnd(8) + String(r[3]).padEnd(8) + (r[4] || '')));
console.log('-'.repeat(84));
console.log('通过 ' + rows.filter(r => r[1] === 'OK').length + ' / 失败 ' + bad);

/* 缺参兜底：直接访问 #/act、#/sign 必须给出可操作指引，而不是空白页 */
console.log('\n---- 缺参兜底（直接访问不带 ID 的地址）----');
let bad2 = 0;
['act', 'sign'].forEach(k => {
  let thrown = '';
  try { w.ZM.go(k); } catch (e) { thrown = e.message; }
  const device = doc.getElementById('mStage').querySelector('.m-device');
  const txt = device ? device.textContent : '';
  const len = txt.replace(/\s+/g, '').length;
  const ok = !thrown && len > 40;
  if (!ok) bad2++;
  console.log(String(k).padEnd(8) + (ok ? 'OK' : 'FAIL').padEnd(8) + '字数 ' + len + (thrown ? ' 抛错:' + thrown : ''));
});
console.log('缺参兜底 通过 ' + (2 - bad2) + ' / 失败 ' + bad2);

process.exit(bad + bad2 ? 1 : 0);
