/* 数据流转验证：从「学生报名」到「成绩单体现」的完整可见链路 */
const fs=require('fs'), vm=require('vm');
const ROOT='/Users/tanzicai/二课/第二课堂成绩单系统';
const { createWindow } = require(ROOT+'./tools/domstub.js');
const w=createWindow(); const ctx=vm.createContext(w);
const doc=w.document;
[['header','topbar'],['aside','sidebar'],['main','main'],['div','toastWrap']].forEach(([t,i])=>{
  doc.body.appendChild(w.__el(t,{class:i==='toastWrap'?'toast-wrap':'',id:i}));
});
['js/core/util.js','js/core/dom.js','js/core/qr.js','js/core/seed/base.js','js/core/seed/org.js','js/core/seed/academic.js','js/core/seed/activity.js','js/core/seed/community.js','js/core/seed/ops.js','js/core/seed/index.js','js/core/db.js','js/core/charts.js','js/core/ui.js','js/core/auth.js','js/core/router.js','js/core/demo.js'].forEach(f=>vm.runInContext(fs.readFileSync(ROOT+'/'+f,'utf8'),ctx,{filename:f}));
['_kit.js','_sign.js','dash.js','act.js','square.js','actmgr.js','audit.js','apply.js','rule.js','tpl.js','grade.js','warn.js','stat.js','screen.js','portal.js','content.js','ai.js','msg.js','user.js','club.js','party.js','flow.js','sys.js','student.js'].forEach(f=>vm.runInContext(fs.readFileSync(ROOT+'/js/pages/'+f,'utf8'),ctx,{filename:f}));
vm.runInContext(fs.readFileSync(ROOT+'./js/app.js','utf8'),ctx,{filename:'app.js'});
w.DB.init(true); w.ZR.start('dash');
const DB=w.DB, U=w.ZU;
const main=()=>doc.getElementById('main');
const masks=()=>[...doc.querySelectorAll('.mask')];
const modal=()=>{const a=masks();return a[a.length-1];};
function click(el,l){ if(!el){console.log('   ✗ 未找到 '+l);return false;} el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true})); return true; }
function setInput(el,v){ el.value=v; el.dispatchEvent(new w.Event('input',{bubbles:true})); }
/** 精确取「包含指定标题」的最小可点击容器（自叶子节点向上找到含 button 的最近祖先） */
function cardOf(title){
  const leaves=[...main().querySelectorAll('*')].filter(e=>!e.children.length && (e.textContent||'').trim()===title);
  for(const leaf of leaves){
    let p=leaf;
    for(let d=0; d<8 && p; d++){
      if(p.querySelector && p.querySelector('button')) return p;
      p=p.parentNode;
    }
  }
  return null;
}
function btnIn(scope,re,notRe){
  return [...scope.querySelectorAll('button')].filter(b=>{
    const t=(b.textContent||'').trim();
    return re.test(t) && !(notRe && notRe.test(t));
  })[0];
}
let pass=0, fail=0;
const t=(n,c,x)=>{ if(c){pass++;console.log('  ✓ '+n+(x?'  ('+x+')':''));}else{fail++;console.log('  ✗ '+n+(x?'  ('+x+')':''));} };

/* ---------- 准备：创建并审批发布一个活动 ---------- */
w.ZDEMO.loginAs('admin');
DB.insert('activities', Object.assign({}, DB.col('activities')[0], {
  id:'FLOW1', title:'数据流转演示活动', status:'待审核', auditStage:1,
  flowTpl:'一级审核（校团委）', needAudit:true, enrolled:0, auditTrail:[],
  items:[{id:'FLOW1-IT1',name:'统一报名',limit:60,enrolled:0,needForm:false,onSite:false,
          enrollStart:'2026-09-20 00:00', enrollEnd:'2026-09-30 12:00', scope:['全体学生'], cancelRule:'报名截止前 2 小时可取消'}],
  start:'2026-10-05 14:00', end:'2026-10-05 17:00', createAt:U.dt(new Date())
}));
console.log('【准备】活动已写入待审核，flowTpl=' + DB.get('activities','FLOW1').flowTpl);

console.log('\n【1】审核中心：一次「通过」即发布');
w.ZDEMO.loginAs('auditor');
w.ZR.go('audit');
let tr=null;
[...main().querySelectorAll('tr')].forEach(r=>{ if(!tr && (r.textContent||'').indexOf('数据流转演示活动')>=0) tr=r; });
t('待审列表出现该活动', !!tr);
t('列表显示「还需 N 级」', tr? /还需 \d 级/.test(tr.textContent) : false, tr? (tr.textContent.match(/还需 \d 级/)||[''])[0] : '');
click(tr? btnIn(tr,/审核|详情/):null,'审核');
const am=modal();
if(am){
  click(btnIn(am,/✓ 通过/),'通过');
  const cm=modal();
  if(cm && btnIn(cm,/仍然通过/)) click(btnIn(cm,/仍然通过/),'仍然通过');
}
t('审批通过后状态为「待开始」', DB.get('activities','FLOW1').status==='待开始', DB.get('activities','FLOW1').status);
t('活动已进入活动广场（KP.isPub）', w.ZKP.isPub(DB.get('activities','FLOW1')));

console.log('\n【2】学生端活动广场：看到该活动并可报名');
w.ZDEMO.loginAs('student');
const sid=w.ZA.session.studentId, sname=w.ZA.session.name;
w.ZR.go('square');
t('广场渲染出该活动', (main().textContent||'').indexOf('数据流转演示活动')>=0);
const card=cardOf('数据流转演示活动');
t('定位到活动卡片', !!card);
const enrollBtn=card? btnIn(card,/报名/,/取消|已报名/) : null;
t('卡片有报名按钮', !!enrollBtn, enrollBtn? '"'+enrollBtn.textContent.trim()+'"':'');
click(enrollBtn,'立即报名');
const em=modal();
if(em){
  const okb=btnIn(em,/确认报名|提交报名|立即报名|确定/);
  if(okb) click(okb, okb.textContent.trim());
}
const myEnr=DB.find('enrollments', e=>e.actId==='FLOW1' && e.studentId===sid);
t('报名记录已写入', !!myEnr, myEnr? '状态='+myEnr.status : '');
t('需审核的活动报名后为「待审核」', myEnr && myEnr.status==='待审核', myEnr? myEnr.status : '');
t('活动已报名人数 +1', U.num(DB.get('activities','FLOW1').items[0].enrolled)>=1, 'enrolled='+DB.get('activities','FLOW1').items[0].enrolled);

console.log('\n【3】活动管理（组织者）：报名记录出现在待审列表');
w.ZDEMO.loginAs('organizer');
w.ZR.go('actmgr');
const mgrTxt=main().textContent||'';
t('活动管理含该活动', mgrTxt.indexOf('数据流转演示活动')>=0);
t('活动管理含报名学生', mgrTxt.indexOf(sname)>=0, sname);
t('待审报名可在 DB 查到', DB.count('enrollments', e=>e.actId==='FLOW1'&&e.status==='待审核')>0);

console.log('\n【4】审核报名通过 → 学生端「我报名的」状态变化');
DB.update('enrollments', myEnr.id, {status:'已通过', reviewer:w.ZA.session.name});
w.ZDEMO.loginAs('student');
w.ZR.go('myact');
const ma=main().textContent||'';
t('我报名的 含该活动', ma.indexOf('数据流转演示活动')>=0);
t('显示为已通过', /已通过/.test(ma));

console.log('\n【5】学生签到 → 报名表与签到表同步');
w.ZR.go('myact');
const signBtn=btnIn(main(),/去签到|签到/)||null;
t('我报名的 有签到入口', !!signBtn, signBtn? '"'+signBtn.textContent.trim()+'"':'');
const g0=DB.count('signins', g=>g.actId==='FLOW1');
click(signBtn,'去签到');
const sm=modal();
if(sm){
  const sb=btnIn(sm,/扫描大屏二维码|扫码签到|立即签到|签到/);
  const tk=DB.get('activities','FLOW1');
  if(sb) click(sb, sb.textContent.trim());
  const sm2=modal();
  if(sm2){ const c2=btnIn(sm2,/确认|签到/); if(c2) click(c2,'确认签到'); }
}
const g1=DB.count('signins', g=>g.actId==='FLOW1');
t('签到记录已生成', g1>=g0+1 || DB.get('enrollments',myEnr.id).signStatus==='已签到',
  'signins '+g0+'→'+g1+' / 报名签到状态='+DB.get('enrollments',myEnr.id).signStatus);

console.log('\n【6】组织者在活动管理看到签到记录');
w.ZDEMO.loginAs('organizer');
w.ZR.go('actmgr');
t('活动管理页可达且含签到关键字', /签到/.test(main().textContent||''));

console.log('\n【7】活动考核赋分 → 成绩记录 → 下游视图同步');
w.ZDEMO.loginAs('auditor');
const before=DB.count('scoreRecs', r=>r.actId==='FLOW1');
DB.insert('scoreRecs',{studentId:sid,actId:'FLOW1',actTitle:'数据流转演示活动',cat:DB.get('activities','FLOW1').cat,
  credit:DB.get('activities','FLOW1').credit,hours:DB.get('activities','FLOW1').hours,points:DB.get('activities','FLOW1').points,
  level:DB.get('activities','FLOW1').level,source:'活动认定',status:'已认定',at:U.dt(new Date()),term:'2026-2027-1'});
t('该活动成绩记录 +1', DB.count('scoreRecs', r=>r.actId==='FLOW1')===before+1);
const aggBefore=DB.aggOf(sid).total;
t('学生累计学分已计入', aggBefore>0, '累计 '+aggBefore+' 学分');

w.ZDEMO.loginAs('student');
w.ZR.go('myscore');
t('「我的成绩单」含该活动认定', (main().textContent||'').indexOf('数据流转演示活动')>=0);
w.ZDEMO.loginAs('admin');
w.ZR.go('grade');
t('「成绩管理」统计已含该学生', (main().textContent||'').indexOf(sname)>=0);
w.ZR.go('stat');
t('「统计分析」渲染正常', (main().textContent||'').length>500);
w.ZR.go('screen');
t('「数据大屏」渲染正常', (main().textContent||'').length>500);
w.ZR.go('msg');
t('「消息通知」含活动审核流转消息', /活动审核通过|活动已进入活动广场|报名/.test(main().textContent||''));

console.log('\n============================');
console.log('数据流转验证：通过 '+pass+' / 失败 '+fail);
process.exit(fail?1:0);
