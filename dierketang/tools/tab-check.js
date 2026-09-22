/* 定向验证：预警管理「预警规则」页签（用户报错位置）能正常渲染出规则表 */
const fs=require('fs'), vm=require('vm');
const ROOT='/Users/tanzicai/二课/第二课堂成绩单系统';
const { createWindow } = require(ROOT+'./tools/domstub.js');
const w=createWindow(); const ctx=vm.createContext(w);
const doc=w.document;
[['header','topbar'],['aside','sidebar'],['main','main'],['div','toastWrap']].forEach(([t,i])=>{
  doc.body.appendChild(w.__el(t,{class:i==='toastWrap'?'toast-wrap':'',id:i}));
});
['js/core/util.js','js/core/dom.js','js/core/qr.js','js/core/seed/base.js','js/core/seed/org.js','js/core/seed/academic.js','js/core/seed/activity.js','js/core/seed/community.js','js/core/seed/ops.js','js/core/seed/index.js','js/core/db.js','js/core/charts.js','js/core/ui.js','js/core/auth.js','js/core/router.js','js/core/demo.js'].forEach(f=>vm.runInContext(fs.readFileSync(ROOT+'/'+f,'utf8'),ctx,{filename:f}));
['_kit.js','_sign.js','warn.js','grade.js'].forEach(f=>vm.runInContext(fs.readFileSync(ROOT+'/js/pages/'+f,'utf8'),ctx,{filename:f}));
vm.runInContext(fs.readFileSync(ROOT+'./js/app.js','utf8'),ctx,{filename:'app.js'});
w.DB.init(true); w.ZR.start('dash');
w.ZDEMO.loginAs('admin');
const main=()=>doc.getElementById('main');
let bad=0;
function t(n,c,x){ if(c){console.log('  ✓ '+n+(x?'  ('+x+')':''));} else {bad++;console.log('  ✗ '+n+(x?'  ('+x+')':''));} }

console.log('=== 预警管理 ===');
w.ZR.go('warn');
t('预警管理首页渲染', (main().textContent||'').length>500, (main().textContent||'').length+' 字');

/* 逐个页签点击，验证每个页签都能渲染出内容且不抛错 */
const tabs=[...main().querySelectorAll('.tab')];
console.log('  页签数:', tabs.length, tabs.map(x=>x.textContent.trim()).join(' / '));
tabs.forEach(tb=>{
  const label=tb.textContent.trim().replace(/\(\d+\)/,'');
  w.ZR.errors.length=0;
  let thrown='';
  try{ tb.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true})); }
  catch(e){ thrown=e.message; }
  const txt=main().textContent||'';
  const nodes=main().querySelectorAll('*').length;
  const hasTable=main().querySelectorAll('table').length;
  const ok=!thrown && nodes>60 && !/not of type 'Node'/.test(txt);
  if(!ok) bad++;
  console.log('  '+(ok?'✓':'✗')+' 页签「'+label+'」 节点 '+nodes+' 表格 '+hasTable+' 字数 '+txt.replace(/\s+/g,'').length+(thrown?' 抛错:'+thrown:''));
});

console.log('\n=== 成绩管理（同类 UI.table 用法）===');
w.ZR.go('grade');
t('成绩管理渲染', (main().textContent||'').length>500, (main().textContent||'').length+' 字');
t('成绩管理渲染出表格', main().querySelectorAll('table').length>0, main().querySelectorAll('table').length+' 个表格');

console.log('\n'+'='.repeat(28));
console.log(bad? ('✗ 失败 '+bad+' 项') : '✓ 全部通过：预警管理各页签与成绩管理均正常渲染，无 appendChild 报错');
process.exit(bad?1:0);
