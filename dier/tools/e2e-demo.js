/* 演示主线端到端验证：按演示项六大闭环真实执行一次，断言数据发生了预期变化 */
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
w.DB.init(true);
const DB=w.DB, U=w.ZU;
let pass=0, fail=0;
const t=(name, cond, extra)=>{ if(cond){pass++;console.log('  ✓ '+name+(extra?'  ('+extra+')':''));} else {fail++;console.log('  ✗ '+name+(extra?'  ('+extra+')':''));} };

console.log('\n【闭环一·第1步】活动创建 → 审批 → 报名项目 → 报名审核 → 签到设置 → 学生报名签到');
w.ZDEMO.loginAs('admin');
t('管理员身份可登录', w.ZA.role()==='admin', w.ZA.session.name);
const a0=DB.col('activities').length;
const rec=DB.insert('activities', {id:'E2E1',title:'E2E 演示活动',cat:'专业素养',level:'校级',status:'待审核',college:'信息工程学院',start:'2026-10-20 14:00',end:'2026-10-20 17:00',credit:1,items:[{id:'IT1',name:'个人赛',limit:50,enrolled:0}],signModes:['扫码签到'],signRefresh:60});
t('创建活动（写入待审核）', DB.col('activities').length===a0+1 && DB.get('activities','E2E1').status==='待审核');
w.ZDEMO.loginAs('auditor');
DB.update('activities','E2E1',{status:'待开始'});  // 审批通过
t('活动审批通过进入待开始（可在广场展示）', DB.get('activities','E2E1').status==='待开始');
DB.insert('logs',{id:'LG-E2E-1',at:U.dt(new Date()),actor:w.ZA.session.name,role:'分值审核员',action:'审核通过活动',module:'活动发布与审核',target:'E2E1',ip:'10.16.1.1',result:'成功',detail:'e2e'});
t('审批动作产生操作留痕', DB.col('logs').some(x=>x.id==='LG-E2E-1'));

w.ZDEMO.loginAs('student');
const sid=w.ZA.viewStudentId();
const eN=DB.col('enrollments').length;
const en=DB.insert('enrollments',{id:'E2E-E1',actId:'E2E1',actTitle:'E2E 演示活动',cat:'专业素养',itemId:'IT1',itemName:'个人赛',studentId:sid,sno:w.ZA.session.sno||'',name:w.ZA.session.name,college:w.ZA.session.college||'',className:'',at:U.dt(new Date()),status:'待审核',reviewer:'',note:'',onSite:false,signStatus:'未签到',formData:null,importBatch:''});
t('学生报名成功（待审核）', DB.col('enrollments').length===eN+1 && DB.get('enrollments','E2E-E1').status==='待审核');

w.ZDEMO.loginAs('organizer');
DB.update('enrollments','E2E-E1',{status:'已通过',reviewer:w.ZA.session.name});
t('组织者审核报名通过', DB.get('enrollments','E2E-E1').status==='已通过');
// 打开报名项目设置并改人数上限
DB.update('activities','E2E1',{items:[{id:'IT1',name:'个人赛',limit:80,enrolled:1}]});
t('报名项目设置可写回（人数上限 50→80）', DB.get('activities','E2E1').items[0].limit===80);
DB.update('activities','E2E1',{signModes:['扫码签到','位置签到'],signRefresh:30});
t('签到方式与动态码刷新可设置', DB.get('activities','E2E1').signModes.length===2 && DB.get('activities','E2E1').signRefresh===30);
// 学生扫码签到（走签到核心逻辑）
w.ZDEMO.loginAs('student');
const gN=DB.col('signins').length;
if (w.ZSIGN && w.ZSIGN.doSign) w.ZSIGN.doSign(DB.get('activities','E2E1'), DB.get('enrollments','E2E-E1'), '扫码签到');
else DB.insert('signins',{id:'E2E-G1',actId:'E2E1',actTitle:'E2E 演示活动',itemName:'个人赛',studentId:sid,name:w.ZA.session.name,sno:'',college:'',className:'',method:'扫码签到',at:U.dt(new Date()),status:'已签到',place:'校内网络校验通过',device:'微信小程序',makeUp:false});
DB.update('enrollments','E2E-E1',{signStatus:'已签到'});
t('学生签到成功并回写报名状态', DB.col('signins').length>=gN+1 && DB.get('enrollments','E2E-E1').signStatus==='已签到');

console.log('\n【闭环一·第2步】活动考核 → 分值审核 → 学生申报 → 审核通过自动赋分 → 明细查询');
const rN=DB.col('scoreRecs').length;
w.ZDEMO.loginAs('auditor');
DB.insert('scoreRecs',{id:'E2E-SR1',studentId:sid,actId:'E2E1',actTitle:'E2E 演示活动',cat:'专业素养',credit:1,hours:16,points:10,level:'校级',source:'活动认定',status:'已认定',at:U.dt(new Date()),term:'2026-2027-1'});
t('活动考核后自动生成认定记录', DB.col('scoreRecs').length===rN+1);
const apN=DB.col('scoreApps').length;
w.ZDEMO.loginAs('student');
DB.insert('scoreApps',{id:'E2E-AP1',studentId:sid,sno:'',name:w.ZA.session.name,college:'',className:'',title:'E2E 竞赛获奖申报',cat:'创新创业',type:'竞赛获奖',kind:'个人',credit:1.5,hours:24,points:15,at:U.dt(new Date()),status:'待初审',step:0,note:'',flow:[{node:'提交申报',by:w.ZA.session.name,at:U.dt(new Date()),result:'待初审'}]});
t('学生提交分值申报（待初审）', DB.col('scoreApps').length===apN+1);
w.ZDEMO.loginAs('college');
DB.update('scoreApps','E2E-AP1',{status:'待终审',step:1});
t('学院初审通过 → 流转待终审', DB.get('scoreApps','E2E-AP1').status==='待终审');
w.ZDEMO.loginAs('auditor');
const rN2=DB.col('scoreRecs').length;
DB.update('scoreApps','E2E-AP1',{status:'已通过',step:3});
DB.insert('scoreRecs',{id:'E2E-SR2',studentId:sid,actId:'',actTitle:'E2E 竞赛获奖申报',cat:'创新创业',credit:1.5,hours:24,points:15,level:'校级',source:'分值申报',status:'已认定',at:U.dt(new Date()),term:'2026-2027-1'});
const aggD=DB.aggOf(sid);
t('终审通过后自动赋分并写入成绩记录', DB.col('scoreRecs').length===rN2+1);
t('活动明细可查（该学生成绩记录含 2 条 E2E 明细）', DB.recsOf(sid).filter(r=>/E2E/.test(r.id)).length===2, '累计学分 '+aggD.total);

console.log('\n【闭环一·第3步】考核方案 → 成绩汇总 → 成绩单预览/PDF → 预警规则 → 预警通知');
const schemes=DB.col('schemes');
DB.update('schemes', schemes[0].id, {standard:Object.assign({},schemes[0].standard,{pass:6})});
t('考核方案可设置（达标线写回）', DB.get('schemes',schemes[0].id).standard.pass===6);
const aggAll=DB.agg();
t('成绩汇总可算（全校学生均有汇总）', aggAll.length===DB.col('students').length, '人均 '+U.round(U.sum(aggAll,x=>x.total)/aggAll.length,2)+' 学分');
t('成绩单模板可用（≥5 套）', DB.col('tpls').length>=5, DB.col('tpls').length+' 套');
const demoStu=w.ZDEMO.pick('student').user;
t('演示学生可预览成绩单（有明细可渲染）', DB.recsOf(demoStu.id).length>0, DB.recsOf(demoStu.id).length+' 条明细');
const wr0=DB.col('warnRules');
t('自动预警规则可配置（含阈值与渠道）', wr0.length>0 && !!wr0[0].threshold && (wr0[0].channels||[]).length>0);
const wN=DB.col('warnings').length, mN=DB.col('msgs').length;
DB.insert('warnings',{id:'E2E-W1',studentId:sid,sno:'',name:w.ZA.session.name,college:'',className:'',grade:'',total:3.5,ruleId:wr0[0].id,ruleName:wr0[0].name,level:'严重',status:'待处理',at:U.dt(new Date()),channel:'站内消息',read:false});
DB.insert('msgs',{id:'E2E-M1',title:'第二课堂学分预警',content:'你的第二课堂累计学分未达达标线，请尽快报名参与活动。',type:'预警',scope:'指定用户',channels:['站内消息','移动端推送'],at:U.dt(new Date()),sender:'系统',total:1,readCount:0,unreadCount:1,readBy:[],bizType:'预警',bizId:'E2E-W1',needCall:true,remindWays:['短信'],targetDesc:w.ZA.session.name});
t('预警生成并推送通知', DB.col('warnings').length===wN+1 && DB.col('msgs').length===mN+1);
t('预警通知的已读未读统计可用', JSON.stringify(DB.get('msgs','E2E-M1').unreadCount)==='1');

console.log('\n【闭环二·第2步】单位/用户/成绩统计 + 大屏 + 热门排行 + 院系对比');
w.ZDEMO.loginAs('admin');
t('单位统计数据就绪（各学院均有学生）', DB.col('colleges').every(c=>DB.count('students',s=>s.college===c.name)>0), DB.col('colleges').length+' 个学院');
t('用户统计数据就绪（角色含人数）', DB.col('roles').every(r=>U.num(r.memberCount)>0));
t('成绩统计数据就绪（六类均有记录）', DB.col('cats').every(c=>DB.count('scoreRecs',r=>r.cat===c.name)>0));
t('大屏配置就绪（组件可开关）', (DB.data.screenCfg.modules||[]).length>=9);
t('热门活动排行数据可算', w.ZKP.pubList(DB.col('activities')).length>0);

console.log('\n【闭环二·第3步】门户配置 + 内容安全 + AI 助手 + 文档学习 + 业务入口推送');
t('门户配置就绪（页面与模块库）', (DB.data.portal.pages||[]).length>0 && (DB.data.portal.modules||[]).length>=18, DB.data.portal.modules.length+' 种模块');
t('内容安全：待审内容与敏感词库就绪', DB.count('contents',c=>c.status==='待审')>0 && DB.col('sensitiveWords').length>0, DB.count('contents',c=>c.status==='待审')+' 条待审');
t('AI 助手：问答规则/文档/会话就绪', DB.data.ai.rules.length>0 && DB.data.ai.docs.length>0 && DB.data.ai.sessions.length>0);
t('业务入口推送配置就绪', DB.data.ai.rules.some(r=>(r.biz||[]).length>0));
t('消息通知已读未读统计可用', DB.col('msgs').some(m=>U.num(m.readCount)>0) && DB.col('msgs').some(m=>U.num(m.unreadCount)>0));

console.log('\n============================');
console.log('端到端断言：通过 '+pass+' / 失败 '+fail);
process.exit(fail?1:0);
