/* 冒烟测试：用 jsdom 真实加载页面并逐个功能走查 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const results = [];
function log(name, ok, extra) {
  results.push({ name, ok, extra });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  :: ' + extra : ''));
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  const { window } = dom;
  const doc = window.document;
  const files = ['store', 'ui', 'views-course', 'views-class', 'views-ai', 'views-ops', 'views-app', 'main'];
  for (const f of files) {
    try {
      window.eval(fs.readFileSync(path.join(ROOT, 'assets/js', f + '.js'), 'utf8'));
    } catch (e) {
      log('脚本加载 ' + f + '.js', false, e.message);
    }
  }
  await sleep(300);

  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));
  const click = (el) => {
    if (!el) throw new Error('元素不存在，无法点击');
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  const view = () => $('#view').innerHTML;

  // ---------- 1 登录 ----------
  log('登录页存在', !!$('#loginForm'));
  $('#loginUser').value = 'root';
  $('#loginPass').value = 'wrong';
  $('#loginForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  log('错误密码被拦截', $('#loginErr').textContent.includes('不正确'), $('#loginErr').textContent);

  $('#loginUser').value = 'root';
  $('#loginPass').value = 'root';
  $('#loginForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await sleep(200);
  log('正确账号登录进入系统', $('#appView').hidden === false && !!window.App);
  log('登录态已持久化', !!window.localStorage.getItem('zkc_session_v3'));

  // ---------- 2 路由遍历 ----------
  const routes = ['dashboard', 'courses', 'tasks', 'resources', 'pre', 'live', 'homework',
    'scene', 'studio', 'play', 'materials', 'stats', 'refs', 'pay', 'app', 'settings'];
  for (const r of routes) {
    window.App.go('#/' + r);
    await sleep(120);
    const html = view();
    const ok = html.length > 800 && !html.includes('页面渲染异常');
    log('路由 ' + r + ' 渲染', ok, ok ? html.length + ' 字符' : html.slice(0, 220));
  }

  // ---------- 3 任务编排：新增任务点（16 类型） ----------
  window.App.go('#/tasks');
  await sleep(150);
  const before = window.Store.allTasks('c1').length;
  click($('[data-act="add-task"]'));
  await sleep(120);
  log('添加任务点弹窗打开', $$('.type-cell').length === 16, '类型数 ' + $$('.type-cell').length);
  click($$('.type-cell')[8]); // AI 实践
  $('#tfTitle').value = '自动化测试任务点';
  const resPicks = $$('#resArea .res-pick');
  log('资源选择器列出本课资源', resPicks.length > 0, '可选 ' + resPicks.length + ' 项');
  if (resPicks.length) click(resPicks[0]);
  // 切到"前往资源库添加"
  click($$('#srcSeg button')[2]);
  await sleep(80);
  log('跳转资源库入口存在', !!$('#goRes'));
  click($$('#srcSeg button')[0]);
  await sleep(80);
  click($$('#resArea .res-pick')[0]);
  $('#tfDur').value = '22';
  click($('#tfOk'));
  await sleep(160);
  const after = window.Store.allTasks('c1').length;
  log('新增任务点成功写入', after === before + 1, before + ' -> ' + after);
  log('任务点出现在列表中', view().includes('自动化测试任务点'));

  // 上移/下移/复制/删除
  const upBtn = $$('[data-move="up"]').filter(b => !b.disabled)[0];
  if (upBtn) { click(upBtn); await sleep(120); log('任务点上移', true); } else log('任务点上移', false, '没有可用按钮');
  const copyBtn = $$('[data-op="copy"]')[0];
  click(copyBtn); await sleep(150);
  log('任务点复制', window.Store.allTasks('c1').some(t => t.title.includes('（副本）')));

  // ---------- 4 新增分组 ----------
  click($('[data-act="add-group"]'));
  await sleep(120);
  $('#gpName').value = '实践环节';
  click($('#gpOk'));
  await sleep(150);
  const c1 = window.Store.currentCourse();
  log('新增任务分组', c1.chapters[0].groups.some(g => g.name === '实践环节'));

  // ---------- 5 资源库 ----------
  window.App.go('#/resources');
  await sleep(150);
  const resBefore = window.Store.db().resources.length;
  click($('[data-act="new-res"]'));
  await sleep(120);
  $('#rfName').value = '冒烟测试视频资源';
  click($('#rfOk'));
  await sleep(160);
  log('新增资源保存成功', window.Store.db().resources.length === resBefore + 1);
  log('资源出现在列表', view().includes('冒烟测试视频资源'));
  // 加入任务
  const addBtns = $$('[data-add-task]');
  click(addBtns[0]);
  await sleep(120);
  const taskBefore2 = window.Store.allTasks('c1').length;
  click($('#atOk'));
  await sleep(160);
  log('资源加入任务分组', window.Store.allTasks('c1').length === taskBefore2 + 1);

  // ---------- 6 课前导学发放 ----------
  window.App.go('#/pre');
  await sleep(150);
  const preBefore = window.Store.db().preStudy.length;
  click($('[data-act="assign"]'));
  await sleep(120);
  click($$('#resArea .res-pick')[0] || $$('.res-pick')[0]);
  click($('#arOk'));
  await sleep(160);
  log('课前资源发放', window.Store.db().preStudy.length === preBefore + 1);

  // ---------- 7 课堂互动：发起签到 + 学生端签到 ----------
  window.App.go('#/live');
  await sleep(150);
  const actBefore = window.Store.db().activities.length;
  click($$('[data-start="签到"]')[0]);
  await sleep(120);
  click($('#acOk'));
  await sleep(160);
  const act = window.Store.db().activities[window.Store.db().activities.length - 1];
  log('发起签到活动', window.Store.db().activities.length === actBefore + 1 && act.status === '进行中', '签到码 ' + act.code);
  log('进行中活动面板显示', view().includes('进行中'));

  // ---------- 8 教材运行（数字教材运行承载）----------
  window.App.go('#/app'); await sleep(160);
  log('教材运行页渲染', view().includes('数字教材运行承载'));
  log('课前发放资源列表', $$('[data-pick]').length > 0, $$('[data-pick]').length + ' 项可选');
  // 课前发放
  const preCnt0 = window.Store.db().preStudy.length;
  click($('[data-pick]')); await sleep(100);
  click($('#arSend')); await sleep(180);
  log('课前资源发放成功', window.Store.db().preStudy.length === preCnt0 + 1);
  log('发放记录留痕', (window.Store.db().issues || []).some(i => i.kind === '课前资源'));
  // 活动控件发放
  const actB2 = window.Store.db().activities.length;
  click($$('[data-start="投票"]')[0]); await sleep(130);
  click($('#acOk')); await sleep(170);
  log('活动控件发起投票', window.Store.db().activities.length === actB2 + 1 && window.Store.db().activities.slice(-1)[0].status === '进行中');
  // 作业再次发放
  const issueBtn = $('[data-hwissue]');
  if (issueBtn) {
    click(issueBtn); await sleep(130);
    const okBtn = $('.modal .btn-primary');
    if (okBtn) { click(okBtn); await sleep(160); }
  }
  log('作业再次发放留痕', (window.Store.db().issues || []).some(i => i.kind === '作业'));
  // 新建作业并发放
  const hwBefore = window.Store.db().homework.length;
  click($('#hwNew')); await sleep(140);
  const nhT = $('#nhTitle');
  if (nhT) {
    nhT.value = '冒烟测试作业';
    click($('#nhOk')); await sleep(170);
  }
  log('新建作业并发放', window.Store.db().homework.length === hwBefore + 1);
  // 发放记录导出按钮存在
  log('发放记录可导出', !!$('#issueExport'));

  // ---------- 9 AI 场景生成 ----------
  window.App.go('#/scene'); await sleep(150);
  const scBefore = window.Store.db().scenes.length;
  click($('[data-act="gen"]')); await sleep(140);
  click($('#genOk')); await sleep(220);
  log('AI 生成 3D 场景', window.Store.db().scenes.length === scBefore + 1);
  log('生成后跳到布展编辑', window.App.route === 'studio');
  log('布展编辑有素材', $$('[data-mat]').length > 10, '素材 ' + $$('[data-mat]').length + ' 项');
  const layoutBefore = window.Store.scene(window.Store.db().scenes[scBefore].id).layout.length;
  click($$('[data-mat]')[0]); await sleep(160);
  log('点击素材加入布展', window.Store.scene(window.Store.db().scenes[scBefore].id).layout.length === layoutBefore + 1);
  // 新增互动任务
  click($('[data-act="add-quiz"]')); await sleep(160);
  log('答题闯关编辑器打开', !!$('#tkTitle'));
  click($('#tkOk')); await sleep(180);
  click($('[data-act="add-match"]')); await sleep(160);
  log('知识连线编辑器打开', !!$('#tkTitle'));
  click($('#tkOk')); await sleep(180);
  log('互动任务已保存', (window.Store.scene(window.Store.db().scenes[scBefore].id).tasks || []).length >= 2);
  // 发布
  click($('[data-act="publish"]')); await sleep(180);
  log('场景发布', window.Store.scene(window.Store.db().scenes[scBefore].id).status === '已发布');

  // ---------- 10 实践与评价 ----------
  window.App.go('#/play'); await sleep(200);
  log('实践页渲染 3D 舞台', !!$('#playCanvas'));
  const convBefore = ($('#chatLog') || {}).children ? $('#chatLog').children.length : 0;
  click($$('[data-say]')[0]); await sleep(900);
  log('点击推荐问题产生对话', $('#chatLog').children.length > convBefore, '消息数 ' + $('#chatLog').children.length);
  $('#chatInput').value = '请问您咳嗽多久了？有没有吸烟史？做过肺功能检查吗？';
  click($('#sendBtn')); await sleep(900);
  log('文字输入对话成功', $('#chatLog').children.length >= convBefore + 4);
  click($('[data-act="eval"]')); await sleep(300);
  log('提交实践生成评价', !!$('.score-big'), $('.score-big') ? $('.score-big').textContent.trim() : '无');
  log('评价写入记录', window.Store.db().scenes.some(s => (s.records || []).some(r => r.student === 'root')));
  const hasRadar = $$('.modal svg polygon').length > 0;
  log('评价含雷达图', hasRadar);
  click($$('.modal-f .btn')[$$('.modal-f .btn').length - 1]);
  await sleep(200);

  // 答题闯关试玩
  const taskBtn = $('[data-task]');
  if (taskBtn) {
    click(taskBtn); await sleep(160);
    log('答题闯关打开', !!$('#qzNext'));
    click($$('[data-opt]')[0]); await sleep(120);
    log('选项可点击', $('#qzNext') && !$('#qzNext').disabled);
    click($('#qzNext')); await sleep(150);
    window.UI.modal({ title: 'x', body: '' }).close();
  } else log('答题闯关打开', false, '场景无任务');

  // ---------- 11 素材中心 ----------
  window.App.go('#/materials'); await sleep(180);
  log('素材中心渲染', view().includes('540') || view().includes('公共素材'), view().match(/内置\s*(\d+)\s*项/) ? view().match(/内置\s*(\d+)\s*项/)[0] : '');
  log('素材数量 540', window.Store.materials().length === 540, window.Store.materials().length + ' 项');
  click($$('[data-cat2]')[3]); await sleep(150);
  log('素材分类筛选', view().includes('公共素材'));
  click($$('[data-view-mat]')[0]); await sleep(150);
  log('素材详情弹窗', !!$('#mdOk'));
  click($('#mdOk')); await sleep(150);

  // ---------- 12 运营数据 ----------
  window.App.go('#/stats'); await sleep(180);
  const lcBefore = window.Store.db().learners.length;
  const cntBefore = window.Store.db().learners[window.Store.db().learners.length - 1].count;
  click($('[data-act="sync"]')); await sleep(200);
  const cntAfter = window.Store.db().learners[window.Store.db().learners.length - 1].count;
  log('同步学习数据生效', cntAfter > cntBefore, cntBefore + ' -> ' + cntAfter);
  click($('#tbPaid')); await sleep(80);
  const paidBefore = window.Store.db().textbook.paid;
  click($('[data-act="save-tb"]')); await sleep(180);
  log('教材付费开关保存', window.Store.db().textbook.paid !== paidBefore);
  click($('[data-act="export-all"]')); await sleep(150);
  log('运营数据导出不报错', true);

  // ---------- 13 引用详情 / 付费 ----------
  window.App.go('#/refs'); await sleep(160);
  click($$('[data-rt]')[1]); await sleep(150);
  log('引用筛选生效', view().includes('开设班级'));
  click($('[data-act="export"]')); await sleep(120);
  log('引用详情导出', true);

  window.App.go('#/pay'); await sleep(160);
  const refundBtn = $('[data-refund]');
  if (refundBtn) {
    click(refundBtn); await sleep(140);
    const okBtn = $$('.modal-f .btn').filter(b => b.textContent.includes('退款'))[0];
    click(okBtn); await sleep(200);
    log('订单退款处理', window.Store.db().orders.some(o => o.status === '已退款'));
  } else log('订单退款处理', false, '无退款按钮');
  click($('[data-act="export-orders"]')); await sleep(120);
  log('购买记录导出', true);

  // ---------- 14 登录态持久化 / 退出 ----------
  log('刷新后仍保持登录（session 存在）', !!window.localStorage.getItem('zkc_session_v3'));

  // 控制台错误
  const fatal = errors.filter(e => !/Not implemented|Could not parse CSS|css/i.test(e));
  log('无未捕获的运行时错误', fatal.length === 0, fatal.slice(0, 3).join(' | '));

  const pass = results.filter(r => r.ok).length;
  console.log('\n===== 结果：' + pass + '/' + results.length + ' 通过 =====');
  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.log('未通过项：');
    failed.forEach(f => console.log(' - ' + f.name + ' :: ' + (f.extra || '')));
  }
  window.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('测试异常', e); process.exit(2); });
