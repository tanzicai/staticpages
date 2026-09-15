const RESOURCES = [
  {id:'P09-H5-LESSON-MAP-01',title:'教案与数字资源逐项映射',type:'教学导航',stage:'全流程',desc:'按教案教学节点逐项定位知识学习、功能开发、阶段考核、知识测试与成果证据。'},
  {id:'P09-H5-MAP-01',title:'项目9三级任务知识与能力图谱',type:'知识导航',stage:'课前/方案',desc:'按基础—进阶U3/U4—提升建立知识、功能、证据和评价链。'},
  {id:'P09-T01-H5-ANIM-01',title:'UART 8N1与初始化交互动画',type:'H5动画',stage:'课前/方案',desc:'观察8N1帧、SCON、Timer1方式2、SBUF和TI。'},
  {id:'P09-T02-H5-CALC-01',title:'Timer1波特率计算与误差校核',type:'计算工具',stage:'课前/方案',desc:'校核11.0592 MHz、1T、SMOD=0、TH1=0xDC。'},
  {id:'P09-T03-H5-ANIM-01',title:'基础任务：LM35＋OLED与虚拟终端闭环',type:'H5动画',stage:'基础任务',desc:'复用采集显示基线，完成温度文本输出、字符回显和无输出诊断。'},
  {id:'P09-T04-H5-QUIZ-01',title:'基础任务知识测试',type:'智能测验',stage:'基础任务',desc:'UART发送、字符回显、同源温度快照和500 ms调度。',file:'h5/P09-T04-H5-QUIZ-01_基础任务_UART发送与字符回显.html'},
  {id:'P09-T04-H5-ANIM-02',title:'进阶任务：U3发送与U4接收链路',type:'H5动画',stage:'进阶任务',desc:'AA55帧头与14字节收帧、双端同显和2秒断线恢复。'},
  {id:'P09-T04-H5-ANIM-01',title:'U4串口中断与收帧缓冲',type:'H5动画',stage:'进阶任务',desc:'可视化RI、SBUF、rx_index、frame_ready及短ISR。'},
  {id:'P09-T05-H5-QUIZ-01',title:'进阶任务知识测试',type:'智能测验',stage:'进阶任务',desc:'U3/U4分工、14字节收帧、临界区、超时与恢复。',file:'h5/P09-T05-H5-QUIZ-01_进阶任务_双机收发与超时恢复.html'},
  {id:'P09-T03-VD-01',title:'双节点联调互动微课',type:'互动微课',stage:'进阶任务',desc:'参数—接线—U3发送—U4收帧—OLED显示—断线恢复诊断链。'},
  {id:'P09-T05-H5-ANIM-01',title:'提升任务：USB-TTL与PC命令通信',type:'H5动画',stage:'提升任务',desc:'500 ms主动上报，响应PING、STATUS和异常命令。'},
  {id:'P09-T04-H5-QUIZ-02',title:'提升任务知识测试',type:'智能测验',stage:'提升任务',desc:'USB-TTL、COM口、PC日志和命令处理。',file:'h5/P09-T04-H5-QUIZ-02_提升任务_USB-TTL与PC通信测试.html'},
  {id:'P09-T01-H5-QUIZ-01',title:'课前T0：三级任务需求诊断',type:'智能测验',stage:'课前/方案',desc:'诊断功能基线、三级任务边界及验收证据。',file:'h5/P09-T01-H5-QUIZ-01_课前T0_三级任务需求与验收诊断.html'},
  {id:'P09-T02-H5-QUIZ-01',title:'方案校核：串口参数与文本格式',type:'智能测验',stage:'课前/方案',desc:'校核8N1、Timer1、TH1、SCON和LM35文本格式。',file:'h5/P09-T02-H5-QUIZ-01_方案校核_串口参数与文本格式.html'},
  {id:'P09-T03-H5-QUIZ-01',title:'接口与Proteus电路诊断',type:'智能测验',stage:'课前/方案',desc:'检查TXD/RXD、共地、电平、LM35/OLED接口和仿真参数。',file:'h5/P09-T03-H5-QUIZ-01_课前T0_三级接口与Proteus电路诊断.html'},
  {id:'P09-UART-TIMER-QUIZ-01',title:'UART预习与定时器强化自测',type:'强化自测',stage:'课前/方案',desc:'UART方式1、Timer1方式2、波特率与中断标志强化。',file:'h5/P09-UART-TIMER-QUIZ-01_UART预习与定时器强化自测.html'},
  {id:'P09-H5-UNIT-01',title:'项目9三级任务综合知识检测',type:'综合测试',stage:'考核评价',desc:'项目终评前形成知识证据，不另设项目总分。',file:'h5/P09-H5-UNIT-01_项目9三级任务综合知识检测.html'},
  {id:'P09-STAGE-EVAL-FLOW-01',title:'三级分任务考核评价与流程',type:'阶段评价',stage:'考核评价',desc:'基础、进阶、提升任务过程考核、证据提交和改进。',file:'h5/P09-STAGE-EVAL-FLOW-01_三级任务考核评价与流程.html'},
  {id:'P09-EVAL-H5-01',title:'项目考核评价H5（教案P09-H5-EVAL）',type:'项目终评',stage:'考核评价',desc:'功能60分、工程与电路30分、证据5分、协作迁移5分。',file:'h5/P09-EVAL-H5-01_项目考核评价.html'}
];

let cleanupTasks = [];
function registerCleanup(task)
{
  cleanupTasks.push(task);
}
function runCleanup()
{
  cleanupTasks.splice(0).forEach(task =>
  {
    try
    {
      task();
    }
    catch (error)
    {
      console.warn('资源清理失败',error);
    }
  });
}

const $ = selector => document.querySelector(selector);
const app = $('#app');
const link = (path,text) => `<a class="btn alt" href="${path}">${text}</a>`;

function shell(title, body)
{
  app.innerHTML = `<div class="crumb"><a href="#home">← 返回资源总览</a></div><section class="panel"><span class="eyebrow">项目9 · 数字资源中心 V3.0</span><h1 style="font-size:40px">${title}</h1>${body}</section>`;
}

function home()
{
  app.innerHTML = `<section class="hero"><div class="panel"><span class="eyebrow">岗课赛证 · 虚实融合 · 证据闭环</span><h1>让串口通信<br>从“看不见”到“可诊断”</h1><p>围绕LM35＋OLED功能基线，按基础、进阶U3/U4、提升三级任务组织知识学习、功能开发、阶段考核和项目评价。</p><div class="toolbar"><a class="btn" href="#P09-H5-LESSON-MAP-01">教案资源逐项映射</a>${link('guides/教师使用指南.html','教师使用指南')}${link('templates/项目交付清单.csv','项目交付清单')}</div></div><div class="stats"><div class="stat"><b>19</b>当前教学资源</div><div class="stat"><b>3</b>阶梯功能任务</div><div class="stat"><b>6</b>知识学习动画</div><div class="stat"><b>100</b>项目唯一总分</div></div></section><p class="notice"><b>教案配套口径：</b>STC15W4K32S4、11.0592 MHz、UART1、9600 bit/s、8N1；进阶任务采用AA55帧头、14字节整帧，不作CRC校验；温度高低字节位于第8、9字节（索引7、8），其余数据位预留为0。教材仍用12T、0xFD，<a href="guides/教材与教案参数区别.html">查看参数区别</a>。</p><div class="toolbar"><input id="search" placeholder="搜索：8N1、LM35、U3、U4、PC、评价…"><select id="stage"><option>全部阶段</option><option>全流程</option><option>课前/方案</option><option>基础任务</option><option>进阶任务</option><option>提升任务</option><option>考核评价</option></select></div><section class="grid" id="cards"></section>`;
  renderCards();
  $('#search').oninput = renderCards;
  $('#stage').onchange = renderCards;
}

function renderCards()
{
  const query = ($('#search')?.value || '').toLowerCase();
  const stage = $('#stage')?.value || '全部阶段';
  $('#cards').innerHTML = RESOURCES.filter(item =>
    (stage === '全部阶段' || item.stage === stage) && JSON.stringify(item).toLowerCase().includes(query)
  ).map(item => `<article class="card"><span class="tag">${item.type} · ${item.stage}</span><h3>${item.title}</h3><p>${item.desc}</p><a class="btn" href="${item.file || '#'+item.id}">进入资源 →</a></article>`).join('');
}

function resourceHref(id)
{
  const resource = RESOURCES.find(item => item.id === id);
  return resource?.file || '#'+id;
}

function lessonResourceMap()
{
  const rows = [
    ['课前：项目发布与需求分析','任务边界与验收证据诊断','P09-T01-H5-QUIZ-01','完成T0诊断，形成错因清单'],
    ['课前：项目发布与需求分析','三级接口、Proteus电路预诊断','P09-T03-H5-QUIZ-01','提交接口判断与电路检查结果'],
    ['第1节：项目分析与方案设计','8N1、SCON、SBUF、TI/RI知识学习','P09-T01-H5-ANIM-01','完成交互步骤与初始化记录'],
    ['第1节：项目分析与方案设计','Timer1方式2与波特率误差校核','P09-T02-H5-CALC-01','提交TH1计算和误差证据'],
    ['第1节：项目分析与方案设计','参数、文本格式与方案校核','P09-T02-H5-QUIZ-01','达到教案规定阈值并订正'],
    ['第2节：基础任务功能开发','LM35＋OLED基线叠加虚拟终端输出与字符回显','P09-T03-H5-ANIM-01','OLED/终端同源显示、回显、无输出诊断'],
    ['基础任务阶段考核','基础任务功能与证据验收','P09-STAGE-EVAL-FLOW-01','提交参数、接线、截图和测试数据'],
    ['基础任务知识测试','UART发送、回显与500 ms调度','P09-T04-H5-QUIZ-01','测试—订正—复测闭环'],
    ['第3节：进阶任务功能开发','U3发送、U4接收及AA55帧头与14字节收帧','P09-T04-H5-ANIM-02','完成双端同显、三点一致性和连续运行'],
    ['第3节：进阶任务知识深化','U4短ISR、收帧缓冲和主循环取帧','P09-T04-H5-ANIM-01','形成收帧状态与临界区记录'],
    ['第3节：进阶任务联调','双节点完整调试路径','P09-T03-VD-01','完成断线2秒、NO DATA与自动恢复'],
    ['进阶任务阶段考核','U3/U4职责、链路与故障恢复验收','P09-STAGE-EVAL-FLOW-01','提交U3/U4工程及联调证据'],
    ['进阶任务知识测试','14字节收帧、并发保护、超时恢复','P09-T05-H5-QUIZ-01','测试—订正—复测闭环'],
    ['第4节：提升任务功能开发','USB-TTL、PC日志与命令交互','P09-T05-H5-ANIM-01','完成周期上报、PING/STATUS/异常命令'],
    ['提升任务阶段考核','单片机—PC通信功能与证据验收','P09-STAGE-EVAL-FLOW-01','提交接线、COM参数、日志和响应记录'],
    ['提升任务知识测试','PC串口连接与命令处理','P09-T04-H5-QUIZ-02','测试—订正—复测闭环'],
    ['第4节：集成调试与实操训练','三级功能综合知识检测','P09-H5-UNIT-01','作为知识证据，不重复形成项目总分'],
    ['第4节：项目考核评价','项目唯一100分终评','P09-EVAL-H5-01','功能60＋工程/调试/电路30＋证据5＋协作迁移5'],
    ['总结反思与课后拓展','三级任务知识能力复盘与迁移','P09-H5-MAP-01','输出问题链、改进项和迁移任务']
  ];
  shell('教案与数字资源逐项映射',`<p>依据教案0914终极版的教学实施主线，将资源嵌入对应学习节点；阶段评价和知识测试随任务推进，不另设割裂的“项目复盘&实施”环节。</p><p><a class="btn alt" href="data/教案与数字资源逐项映射_V2.1.csv" download>下载逐项映射表</a></p><div class="table-scroll"><table><thead><tr><th>教案教学节点</th><th>知识/功能活动</th><th>对应数字资源</th><th>达成证据/标准</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td><a class="resource-link" href="${resourceHref(row[2])}">${row[2]}</a></td><td>${row[3]}</td></tr>`).join('')}</tbody></table></div><p class="notice"><b>统一技术口径：</b>三级任务均保留LM35＋OLED基线；进阶任务为U3发送、U4接收，帧为AA55帧头、14字节整帧，不作CRC校验；温度高低字节位于第8、9字节（索引7、8），其余数据位预留为0；提升任务使用USB-TTL与PC通信。</p>`);
}

function guidedDemo(title, intro, steps, notice)
{
  shell(title, `<p>${intro}</p><div class="uart-flow" style="grid-template-columns:repeat(${steps.length},minmax(115px,1fr))">${steps.map((step,index) => `<button class="uart-node" data-index="${index}"><b>${index+1}</b>${step.name}<small>${step.sub}</small></button>`).join('')}</div><div class="uart-lab"><section class="code-panel"><div class="code-head"><span><i></i>&nbsp;&nbsp;&nbsp;&nbsp;${steps[0].file || 'learning_flow.c'}</span><span id="demoState">等待执行</span></div><pre class="code-body" id="demoCode" style="padding:20px;white-space:pre-wrap"></pre></section><aside class="uart-side"><div class="uart-detail"><span class="step-kicker" id="demoKicker"></span><h3 id="demoTitle"></h3><p id="demoDetail"></p></div><div class="reg-grid" id="demoTags"></div><div class="uart-console" id="demoLog"></div></aside></div><div class="uart-controls"><button class="mini-btn" id="demoPrev">← 上一步</button><button class="mini-btn primary" id="demoPlay">▶ 自动播放</button><button class="mini-btn" id="demoNext">下一步 →</button><button class="mini-btn" id="demoReset">复位</button><div class="progress-track"><div class="progress-fill" id="demoProgress"></div></div><b id="demoCount"></b></div>${notice ? `<p class="notice">${notice}</p>` : ''}`);
  let current = 0;
  let timer = null;
  registerCleanup(() => clearTimeout(timer));
  const nodes = [...document.querySelectorAll('.uart-node')];
  function stop()
  {
    clearTimeout(timer);
    timer = null;
    $('#demoPlay').textContent = '▶ 自动播放';
  }
  function show(index, auto = false)
  {
    current = Math.max(0, Math.min(steps.length-1,index));
    const step = steps[current];
    nodes.forEach((node,nodeIndex) =>
    {
      node.classList.toggle('active',nodeIndex === current);
      node.classList.toggle('done',nodeIndex < current);
    });
    $('#demoKicker').textContent = `步骤 ${current+1} / ${steps.length}`;
    $('#demoTitle').textContent = step.name;
    $('#demoDetail').textContent = step.detail;
    $('#demoCode').textContent = step.code;
    $('#demoState').textContent = step.sub;
    $('#demoTags').innerHTML = step.tags.map((tag,index) => `<span class="reg ${index === step.tags.length-1 ? 'changed' : 'on'}">${tag}</span>`).join('');
    $('#demoLog').innerHTML = '&gt; ' + step.log;
    $('#demoProgress').style.width = ((current+1)/steps.length*100) + '%';
    $('#demoCount').textContent = `${current+1}/${steps.length}`;
    localStorage.setItem('P09-progress-'+title,String(current+1));
    if (auto && current < steps.length-1)
    {
      timer = setTimeout(() => show(current+1,true),1100);
    }
    else if (auto)
    {
      stop();
    }
  }
  nodes.forEach(node => node.onclick = () => {stop();show(Number(node.dataset.index));});
  $('#demoPrev').onclick = () => {stop();show(current-1);};
  $('#demoNext').onclick = () => {stop();show(current+1);};
  $('#demoReset').onclick = () => {stop();show(0);};
  $('#demoPlay').onclick = () =>
  {
    if (timer)
    {
      stop();
    }
    else
    {
      $('#demoPlay').textContent = 'Ⅱ 暂停';
      show(current === steps.length-1 ? 0 : current,true);
    }
  };
  show(0);
}

function knowledgeMap()
{
  guidedDemo('项目9三级任务知识与能力图谱','沿“知识学习—功能开发—阶段考核—知识测试—证据改进”主线完成三级任务。',[
    {name:'功能基线',sub:'LM35＋OLED',file:'project9_learning_path.c',code:'temperature_x10 = LM35_ReadTemperatureX10();\nDisplay_ShowTemperature(temperature_x10);',detail:'三级任务均保留LM35采集、ADC处理和OLED本地显示。',tags:['ADC0','temperature_x10','OLED'],log:'基线验收：温度采集与本显稳定'},
    {name:'参数方案',sub:'9600 · 8N1',code:'AUXR |= 0x40;\nTH1 = 0xDC;\nSCON = 0x50;',detail:'统一11.0592 MHz、Timer1方式2、1T、SMOD=0和9600 bit/s。',tags:['Timer1','TH1=DC','SCON=50'],log:'方案证据：参数表与误差校核'},
    {name:'基础任务',sub:'单机与虚拟终端',code:'Display_ShowTemperature(t);\nUART_SendTemperature(t);\nEchoReceivedChar();',detail:'同一温度快照驱动OLED与终端，并完成字符回显。',tags:['SBUF','TI/RI','500ms'],log:'阶段证据：OLED、终端和回显截图'},
    {name:'进阶U3',sub:'采集·本显·发送',code:'Protocol_SendTemperature(t);\n/* AA55 header; 14-byte receive frame */',detail:'U3按经核实的字段表编码温度快照并周期发送；接收示例采用AA55帧头与14字节长度。',tags:['U3','AA55','14字节'],log:'U3证据：本显与发帧记录'},
    {name:'进阶U4',sub:'收帧·远显·恢复',code:'Protocol_ReceiveByte(SBUF);\nProtocol_GetTemperature(&t);',detail:'U4的ISR只投递字节，主循环取帧显示；2秒无有效帧显示NO DATA。',tags:['U4','短ISR','2s超时'],log:'U4证据：同显、断线、恢复'},
    {name:'提升任务',sub:'USB-TTL与PC',code:'PING   -> PONG\nSTATUS -> LM35=xx.xC',detail:'PC端记录周期温度日志，并完成命令应答和异常输入处理。',tags:['COM口','日志','命令'],log:'提升证据：接线、参数、日志与响应'},
    {name:'项目终评',sub:'60＋30＋5＋5',code:'TOTAL = FUNCTION(60) + ENGINEERING(30)\n      + EVIDENCE(5) + TEAMWORK(5);',detail:'功能60分，工程规范/调试诊断/电路绘制合计30分，证据5分，协作迁移5分。',tags:['证据提交','100分','改进'],log:'形成一次项目总评并推送改进任务'}
  ],'各阶段测试用于诊断和订正，不重复形成项目总分。');
}

function uartAnimation()
{
  guidedDemo('UART 8N1与初始化交互动画','逐步建立从参数约定到字符A发送完成的最小通信闭环。',[
    {name:'约定8N1',sub:'10位字符帧',file:'uart.c',code:'空闲1 | 起始0 | D0...D7 | 停止1',detail:'8N1表示8位数据、无校验、1位停止；数据位低位先发。',tags:['START','D0→D7','STOP'],log:'字符A=0x41，完整帧共10位'},
    {name:'配置1T',sub:'AUXR.T1x12=1',code:'AUXR |= 0x40;',detail:'教案工程参数采用Timer1的1T计数模式。',tags:['11.0592MHz','1T'],log:'Timer1时钟条件已确定'},
    {name:'方式2',sub:'自动重装',code:'TMOD = (TMOD & 0x0F) | 0x20;',detail:'Timer1方式2自动从TH1重装，适合作为波特率发生器。',tags:['TMOD','方式2'],log:'Timer1工作方式配置完成'},
    {name:'装载DC',sub:'9600 bit/s',code:'TH1 = 0xDC;\nTL1 = 0xDC;\nPCON &= 0x7F;',detail:'11.0592 MHz、1T、SMOD=0时，0xDC对应9600 bit/s。',tags:['TH1/TL1','SMOD=0'],log:'实际波特率=9600，误差=0'},
    {name:'配置SCON',sub:'方式1且允许接收',code:'SCON = 0x50;\nTR1 = 1;',detail:'SCON=0x50选择方式1并置REN=1，然后启动Timer1。',tags:['SCON=50','REN=1','TR1=1'],log:'UART初始化完成'},
    {name:'发送字符A',sub:'查询式发送',code:"SBUF = 'A';\nwhile (TI == 0)\n{\n}\nTI = 0;",detail:'写SBUF启动发送，等待TI置1后由软件清零。',tags:['SBUF=41','TI:0→1→0'],log:'9600 bit/s时一个8N1字符约1.042 ms'}
  ],'完成字符A闭环后，再扩展温度字符串、双机帧和PC命令。');
}

function baudCalculator()
{
  shell('Timer1波特率计算与误差校核',`<p>保持原计算器的输入、候选值对比和误差判定要求，并以当前项目参数为默认值。</p><div class="calc-shell"><section class="calc-inputs"><span class="step-kicker" style="color:#fdba74">PARAMETERS</span><h2>通信参数</h2><label class="field-label">晶振频率/MHz</label><div class="input-unit"><input id="fosc" type="number" value="11.0592" step="0.0001"><span>MHz</span></div><label class="field-label">目标波特率</label><div class="input-unit"><input id="baud" type="number" value="9600"><span>bit/s</span></div><label class="field-label">Timer1时钟</label><div class="mode-toggle"><button id="mode12">12T对比</button><button id="mode1" class="active">工程1T</button></div><label class="field-label">SMOD</label><div class="mode-toggle"><button id="smod0" class="active">0 不倍速</button><button id="smod1">1 倍速</button></div><label class="field-label">TH1十六进制</label><div class="input-unit"><input id="th1" value="DC"><span>HEX</span></div><button class="btn" id="calculate" style="margin-top:18px">计算并校核</button></section><section class="calc-output"><div class="calc-steps"><div class="calc-step"><b>1</b><strong>计数差值</strong><output id="delta">36</output></div><div class="calc-step"><b>2</b><strong>实际波特率</strong><output id="actual">9600</output></div><div class="calc-step"><b>3</b><strong>相对误差</strong><output id="error">0.000%</output></div></div><div class="calc-result"><div class="error-gauge" id="gauge"><div><b id="gaugeText">0.00%</b>误差</div></div><div><span class="status-pill good" id="statusPill">适合验证</span><div class="hex-value" id="bigHex">TH1 = 0xDC</div><p id="adviceText">可进入Proteus与虚拟终端复测。</p></div></div><div class="copy-box"><code id="configCode">TH1 = 0xDC; TL1 = 0xDC;</code></div><p class="notice">公式：Baud = 2^SMOD × Fosc ÷ [32 × T × (256−TH1)]。当前工程T=1。</p></section></div>`);
  let timerDivisor = 1;
  let smod = 0;
  function calculate()
  {
    const fosc = Number($('#fosc').value) * 1000000;
    const target = Number($('#baud').value);
    const th1 = parseInt($('#th1').value.replace(/^0x/i,''),16);
    if (!(fosc > 0 && target > 0 && th1 >= 0 && th1 <= 255))
    {
      $('#adviceText').textContent = '请输入有效参数。';
      return;
    }
    const delta = 256-th1;
    const actual = Math.pow(2,smod)*fosc/(32*timerDivisor*delta);
    const error = (actual-target)/target*100;
    const abs = Math.abs(error);
    const kind = abs <= 2 ? 'good' : abs <= 3 ? 'warn' : 'bad';
    $('#delta').textContent = delta;
    $('#actual').textContent = actual.toFixed(2);
    $('#error').textContent = `${error >= 0 ? '+' : ''}${error.toFixed(3)}%`;
    $('#gaugeText').textContent = abs.toFixed(2)+'%';
    $('#statusPill').className = 'status-pill '+kind;
    $('#statusPill').textContent = abs <= 2 ? '适合验证' : abs <= 3 ? '谨慎使用' : '误差过大';
    $('#bigHex').textContent = 'TH1 = 0x'+th1.toString(16).toUpperCase().padStart(2,'0');
    $('#configCode').textContent = `TH1 = 0x${th1.toString(16).toUpperCase().padStart(2,'0')}; TL1 = 0x${th1.toString(16).toUpperCase().padStart(2,'0')};`;
    $('#adviceText').textContent = abs <= 2 ? '可进入Proteus与虚拟终端复测。' : '参数不匹配，可能出现乱码或无法接收。';
    $('#gauge').style.background = `conic-gradient(${kind === 'good' ? '#10b981' : kind === 'warn' ? '#f59e0b' : '#ef4444'} ${Math.min(100,abs/5*100)}%,#dce8ee 0)`;
  }
  function select(buttonA,buttonB,value,setter)
  {
    buttonA.onclick = () => {buttonA.classList.add('active');buttonB.classList.remove('active');setter(value[0]);calculate();};
    buttonB.onclick = () => {buttonB.classList.add('active');buttonA.classList.remove('active');setter(value[1]);calculate();};
  }
  select($('#mode12'),$('#mode1'),[12,1],value => timerDivisor=value);
  select($('#smod0'),$('#smod1'),[0,1],value => smod=value);
  $('#calculate').onclick = calculate;
  calculate();
}

function basicAnimation()
{
  shell('基础任务：LM35＋OLED与虚拟终端闭环',`<p>在原LM35＋OLED工程上增量叠加UART，不删除、不重写已经验收的采集显示模块。</p><div class="sim-grid"><section class="sim-card"><h2>现场节点</h2><label>LM35温度：<b id="basicTempText">25.6 ℃</b><input id="basicTemp" type="range" min="0" max="800" value="256"></label><div class="oled-screen" id="basicOled">PROJECT 9\nLM35=25.6C\nBASIC UART</div><button class="btn" id="sendTemp">采样并发送</button></section><section class="sim-card"><h2>虚拟终端与接线</h2><label>连接<select id="basicWire"><option value="ok">TXD/RXD交叉并共地</option><option value="tx">仅TXD→终端RXD</option><option value="same">TXD接TXD</option><option value="none">未连接</option></select></label><label>单片机波特率<select id="basicMcuBaud"><option>9600</option><option>4800</option></select></label><label>终端波特率<select id="basicTermBaud"><option>9600</option><option>4800</option></select></label><div class="uart-console sim-console" id="basicTerminal">Virtual Terminal ready...</div></section><section class="sim-card"><h2>字符回显</h2><label>终端发送字符<input id="echoChar" maxlength="1" value="A"></label><button class="btn" id="echoSend">发送并回显</button><button class="btn alt" id="basicDiagnose">串口无输出诊断</button><div class="result" id="basicResult">先完成温度文本发送，再验证字符回显。</div></section></div><p class="notice"><b>验收证据：</b>OLED与虚拟终端同一温度截图、9600/8N1参数截图、字符回显截图和连续输出记录。</p>`);
  function tempText()
  {
    const value = Number($('#basicTemp').value);
    return `${Math.floor(value/10)}.${value%10}`;
  }
  function update()
  {
    $('#basicTempText').textContent = tempText()+' ℃';
    $('#basicOled').textContent = `PROJECT 9\nLM35=${tempText()}C\nBASIC UART`;
  }
  function transmitOk(requireRx)
  {
    const wire = $('#basicWire').value;
    const baud = $('#basicMcuBaud').value === $('#basicTermBaud').value;
    return baud && (requireRx ? wire === 'ok' : (wire === 'ok' || wire === 'tx'));
  }
  $('#basicTemp').oninput = update;
  $('#sendTemp').onclick = () =>
  {
    update();
    if (transmitOk(false))
    {
      $('#basicTerminal').textContent += `\nLM35=${tempText()}C`;
      $('#basicResult').textContent = '温度发送成功：OLED与终端使用同一温度快照。';
    }
    else
    {
      $('#basicResult').textContent = '未获得有效输出，请运行分层诊断。';
    }
  };
  $('#echoSend').onclick = () =>
  {
    const value = ($('#echoChar').value || 'A')[0];
    if (transmitOk(true))
    {
      $('#basicTerminal').textContent += `\n> ${value}\nECHO=${value}`;
      $('#basicResult').textContent = '字符闭环成功：终端TXD→P3.0/RXD，单片机经P3.1/TXD回显。';
      localStorage.setItem('P09-basic-complete','1');
    }
    else
    {
      $('#basicResult').textContent = '回显失败：除输出线外，还需终端TXD→P3.0/RXD、共地且参数一致。';
    }
  };
  $('#basicDiagnose').onclick = () =>
  {
    const faults = [];
    if ($('#basicMcuBaud').value !== $('#basicTermBaud').value) faults.push('两端波特率不一致');
    if ($('#basicWire').value === 'same') faults.push('TXD/RXD没有交叉');
    if ($('#basicWire').value === 'none') faults.push('串口线路未连接');
    if ($('#basicWire').value === 'tx') faults.push('只能输出，不能完成回显');
    $('#basicResult').textContent = faults.length ? '诊断结果：'+faults.join('；') : '接线与参数正确；继续检查HEX、时钟、P3.1网络和SBUF/TI流程。';
  };
  update();
}

function protocolFrame(temp) {
  const value=Math.round(Number(temp)*10), bytes=Array(14).fill(0);
  bytes[0]=0xAA;bytes[1]=0x55;bytes[7]=(value>>8)&255;bytes[8]=value&255;return bytes;
}
function frameText(bytes) {return bytes.map(v=>v.toString(16).toUpperCase().padStart(2,'0')).join(' ');}
function dualAnimation() {
  shell('U3发送与U4接收链路',`<p>与V4.0工程一致：AA55帧头，整帧14字节，无CRC。第8、9字节为温度高、低字节，温度值放大10倍，其余数据位预留为0。</p><label>现场温度（℃）<input id="dualTemp" type="number" min="0" max="150" step="0.1" value="25.6"></label><div class="reg-grid"><span class="reg" id="u3Display"></span><span class="reg" id="u4Display"></span><span class="reg" id="dualState"></span></div><pre id="dualFrame" style="white-space:pre-wrap"></pre><div class="sim-controls"><button class="btn" id="dualNext">发送一帧</button><button class="btn alt" id="dualDisconnect">断开数据线</button><button class="btn" id="dualConnect">恢复连接</button></div><p id="dualResult"></p><p>自动发送间隔500 ms；连续2秒未收到有效帧显示NO DATA。网页用于理解过程，不能代替Proteus与开发板实测。</p>`);
  let connected=true,last=Date.now(),timer;
  function send(){let t=Number($('#dualTemp').value);if(!Number.isFinite(t)||t<0||t>150){$('#dualResult').textContent='请输入0～150℃。';return;}
    const bytes=protocolFrame(t);$('#u3Display').textContent='U3 OLED '+t.toFixed(1)+'℃';$('#dualFrame').textContent=frameText(bytes);
    if(connected){last=Date.now();$('#u4Display').textContent='U4 OLED '+(((bytes[7]<<8)|bytes[8])/10).toFixed(1)+'℃';$('#dualState').textContent='通信正常';$('#dualResult').textContent='U4收满14字节，主循环复制完整帧后解析第8、9字节并更新显示。';}
  }
  $('#dualNext').onclick=send;$('#dualDisconnect').onclick=()=>{connected=false;$('#dualState').textContent='数据线断开，等待超时';};$('#dualConnect').onclick=()=>{connected=true;send();};
  timer=setInterval(()=>{send();if(Date.now()-last>=2000){$('#u4Display').textContent='NO DATA';$('#dualState').textContent='连续2秒未收到有效帧';}},500);registerCleanup(()=>clearInterval(timer));send();
}
function receiveAnimation() {
  shell('U4串口中断与14字节收帧缓冲',`<p>ISR负责读SBUF、清RI、识别帧头并保存字节。收满后置frame_ready；主循环保护并复制缓冲，再解析温度和更新OLED。无CRC。</p><div class="reg-grid"><span class="reg" id="rxRI">RI=0</span><span class="reg" id="rxSBUF">SBUF=--</span><span class="reg" id="rxIndex">rx_index=0</span><span class="reg" id="rxReady">frame_ready=0</span></div><pre id="rxBuffer" style="white-space:pre-wrap"></pre><label>十六进制字节<input id="rxByte" value="AA"></label><div class="sim-controls"><button class="btn" id="rxInject">接收1字节</button><button class="btn" id="rxDemo">演示25.6℃收帧</button><button class="btn" id="rxConsume">主循环取帧</button><button class="btn alt" id="rxReset">复位</button></div><pre id="rxLog" style="white-space:pre-wrap"></pre><div class="result" id="rxOLED">OLED等待完整帧</div><p>字节序号从1开始：1=AA，2=55，8=温度高字节，9=温度低字节。数组索引从0开始，对应frame[7]与frame[8]。</p>`);
  let buffer=[],timer;
  registerCleanup(()=>clearInterval(timer));
  function render(){$('#rxIndex').textContent='rx_index='+buffer.length;$('#rxReady').textContent='frame_ready='+(buffer.length===14?1:0);$('#rxBuffer').textContent=frameText(buffer);}
  function receive(v){$('#rxRI').textContent='RI=1 → 读SBUF → RI=0';$('#rxSBUF').textContent='SBUF='+frameText([v]);
    if(buffer.length===14){$('#rxLog').textContent='完整帧尚未取走，不覆盖缓冲。';return;}
    if(!buffer.length&&v!==0xAA){$('#rxLog').textContent='等待AA帧头。';return;}
    if(buffer.length===1&&v!==0x55){buffer=v===0xAA?[0xAA]:[];render();$('#rxLog').textContent='重新寻找AA55帧头。';return;}
    buffer.push(v);render();$('#rxLog').textContent=buffer.length===14?'frame_ready=1，ISR结束。等待主循环处理。':'字节已保存。';
  }
  $('#rxInject').onclick=()=>{const s=$('#rxByte').value.trim().replace(/^0x/i,'');if(!/^[0-9a-f]{1,2}$/i.test(s)){$('#rxLog').textContent='请输入00至FF。';return;}receive(parseInt(s,16));};
  $('#rxDemo').onclick=()=>{clearInterval(timer);buffer=[];render();let bytes=protocolFrame(25.6);timer=setInterval(()=>{if(!bytes.length){clearInterval(timer);return;}receive(bytes.shift());},100);};
  $('#rxConsume').onclick=()=>{if(buffer.length!==14){$('#rxLog').textContent='未收满14字节，不能解析。';return;}const copy=buffer.slice();buffer=[];render();const valid=copy.every((v,i)=>[0,1,7,8].includes(i)||v===0);$('#rxLog').textContent='保存ES → 关闭串口中断 → 复制14字节 → 清标志 → 恢复ES。'+(valid?'帧头、长度与预留字段符合约定，无CRC。':'预留字段非0，丢弃当前帧。');if(valid)$('#rxOLED').textContent='OLED '+(((copy[7]<<8)|copy[8])/10).toFixed(1)+'℃';};
  $('#rxReset').onclick=()=>{clearInterval(timer);buffer=[];render();$('#rxLog').textContent='等待AA55';$('#rxOLED').textContent='OLED等待完整帧';};render();
}


function pcAnimation()
{
  shell('提升任务：USB-TTL与PC命令通信',`<p>保持LM35采集与OLED本显，同时向PC主动上报，并把按行命令交给主循环处理。</p><div class="sim-grid"><section class="sim-card"><h2>连接与参数</h2><label>接口<select id="pcLevel"><option value="ttl">USB-TTL兼容电平</option><option value="rs232">PC原生RS-232电平</option></select></label><label>接线<select id="pcWire"><option value="ok">TXD/RXD交叉并共地</option><option value="same">同名直连</option></select></label><label>串口助手<select id="pcSetting"><option value="ok">9600, 8N1, 无流控</option><option value="bad">115200, 8N1</option></select></label><button class="btn" id="pcConnect">连接</button></section><section class="sim-card"><h2>PC串口助手</h2><div class="uart-console sim-console" id="pcTerminal">[PC] Port closed</div><label>命令<input id="pcCommand" value="PING"></label><div class="uart-controls"><button class="mini-btn primary" id="pcSend">发送</button><button class="mini-btn" data-command="PING">PING</button><button class="mini-btn" data-command="STATUS">STATUS</button><button class="mini-btn" data-command="HELLO">异常命令</button></div></section><section class="sim-card"><h2>程序分工</h2><pre class="screen" style="min-height:180px">ISR：收字节、识别CR/LF、置line_ready\n\n主循环：\nPING   → PONG\nSTATUS → LM35=25.6C\n其他   → ERR</pre><div class="result" id="pcResult">先核对接口、接线和9600/8N1。</div></section></div><p class="notice"><b>验收证据：</b>USB-TTL接线、COM口参数、READY信息、周期日志、PING/STATUS及异常命令响应。</p>`);
  let connected=false;
  let timer=null;
  registerCleanup(() => clearInterval(timer));
  function append(text)
  {
    $('#pcTerminal').textContent += '\n'+text;
  }
  $('#pcConnect').onclick = () =>
  {
    clearInterval(timer);
    const ok=$('#pcLevel').value==='ttl' && $('#pcWire').value==='ok' && $('#pcSetting').value==='ok';
    if (!ok)
    {
      connected=false;
      $('#pcResult').textContent='连接失败：必须使用兼容USB-TTL、交叉共地并设置9600/8N1。';
      return;
    }
    connected=true;
    $('#pcTerminal').textContent='[PC] COM opened\n[MCU] PC TERMINAL READY';
    timer=setInterval(() => append('[MCU] LM35=25.6C'),500);
    $('#pcResult').textContent='连接成功，开始500 ms周期上报。';
  };
  function sendCommand()
  {
    if (!connected)
    {
      $('#pcResult').textContent='请先正确连接PC串口。';
      return;
    }
    const command=$('#pcCommand').value.trim().toUpperCase();
    append('[PC>] '+command);
    append(command==='PING'?'[MCU] PONG':command==='STATUS'?'[MCU] LM35=25.6C':'[MCU] ERR: USE PING OR STATUS');
    $('#pcResult').textContent='ISR完成按字节投递，主循环完成命令比较与响应。';
    localStorage.setItem('P09-pc-complete','1');
  }
  $('#pcSend').onclick=sendCommand;
  document.querySelectorAll('[data-command]').forEach(button => button.onclick=()=>{$('#pcCommand').value=button.dataset.command;sendCommand();});
}

function microCourse()
{
  guidedDemo('双节点联调互动微课','沿“先发送端、后接收端；先参数接线、后程序状态”的诊断链定位故障。',[
    {name:'参数一致',sub:'9600 · 8N1',file:'dual_node_diagnosis.c',code:'assert(U3.baud == U4.baud);\nassert(U3.frame == U4.frame);',detail:'两端统一11.0592 MHz、1T、SMOD=0、9600 bit/s和8N1。',tags:['参数表','误差'],log:'PASS · 两端参数一致'},
    {name:'交叉共地',sub:'U3 TXD→U4 RXD',code:'U3_P3_1_TXD -> U4_P3_0_RXD;\nU3_GND ------ U4_GND;',detail:'当前进阶任务只需U3到U4单向温度传输；调试回传时再增加反向线。',tags:['TXD/RXD','GND'],log:'PASS · 信号方向与电平参考正确'},
    {name:'检查U3',sub:'采集·本显·发帧',code:'t=LM35_ReadTemperatureX10();\nDisplay_ShowTemperature(t);\nProtocol_SendTemperature(t);',detail:'核对U3发送的AA55帧头、总长与接收示例一致；字段编码须依据最新工程。',tags:['LM35','OLED','14字节'],log:'检查AA55帧头和接收长度'},
    {name:'观察RI',sub:'确认字节到达U4',code:'if (RI != 0)\n{\n    RI=0; value=SBUF;\n}',detail:'若RI无变化，返回参数与接线；不要先修改OLED。',tags:['RI','SBUF'],log:'RI:0→1 · SBUF=AA'},
    {name:'检查收帧',sub:'frame_ready',code:'Protocol_ReceiveByte(value);\nProtocol_GetTemperature(&t);',detail:'状态机先识别AA55并接满14字节，主循环安全取帧后解析索引7、8。',tags:['rx_index','volatile'],log:'frame_ready=1 · t=256'},
    {name:'显示与恢复',sub:'OLED · 2s超时',code:'Display_ShowTemperature(t);\nif(silence_ms>=2000) ShowNoData();',detail:'比较U3/U4低中高三点；断线2秒显示NO DATA，恢复后自动刷新。',tags:['三点一致','NO DATA'],log:'PASS · 同显、断线、恢复'}
  ],'故障记录统一采用：现象—假设—测试—定位—修复—复测。');
}

function stageEvaluation()
{
  shell('三级分任务考核评价与流程',`<p>阶段评价用于确认能否进入下一级任务，结果作为项目终评证据，不重复形成项目总分。</p><div class="grid"><article class="card"><span class="tag">基础任务</span><h3>单机与虚拟终端</h3><p>LM35＋OLED基线、9600/8N1、温度文本稳定输出、字符回显。</p><label><input class="stage-check" type="checkbox"> 功能通过</label><label><input class="stage-check" type="checkbox"> 参数/接线证据齐全</label></article><article class="card"><span class="tag">进阶任务</span><h3>U3发送与U4接收</h3><p>AA55帧头与14字节收帧、双端同显、连续运行、断线2秒与自动恢复。</p><label><input class="stage-check" type="checkbox"> 功能通过</label><label><input class="stage-check" type="checkbox"> 测试数据齐全</label></article><article class="card"><span class="tag">提升任务</span><h3>单片机与PC</h3><p>USB-TTL、周期日志、PING/STATUS及异常命令响应。</p><label><input class="stage-check" type="checkbox"> 功能通过</label><label><input class="stage-check" type="checkbox"> PC证据齐全</label></article></div><div class="result" id="stageResult">完成0/6项。</div><p class="notice">实施流程：知识学习→功能开发→阶段考核→知识测试→订正改进→进入下一任务。</p>`);
  const checks=[...document.querySelectorAll('.stage-check')];
  checks.forEach((check,index) =>
  {
    check.checked=localStorage.getItem('P09-stage-'+index)==='1';
    check.onchange=() =>
    {
      localStorage.setItem('P09-stage-'+index,check.checked?'1':'0');
      const count=checks.filter(item => item.checked).length;
      $('#stageResult').textContent=`完成${count}/6项。${count===6?'三级任务过程证据齐全，可进入项目终评。':''}`;
    };
  });
  const count=checks.filter(item => item.checked).length;
  $('#stageResult').textContent=`完成${count}/6项。`;
}

function projectEvaluation()
{
  const groups=[['任务功能',60],['工程规范、调试诊断与电路绘制',30],['证据质量',5],['协作与迁移',5]];
  shell('项目考核评价H5',`<p>每项评分点后提交对应证据；本页形成项目唯一一次100分总评。</p><div class="eval-grid"><label>姓名/小组<input id="evalName"></label>${groups.map((group,index) => `<label>${group[0]}（0—${group[1]}）<input class="eval-score" id="eval${index}" type="number" min="0" max="${group[1]}" value="0"></label>`).join('')}<label>证据索引<textarea id="evalEvidence" rows="5" placeholder="文件名、参数、截图、测试数据及对应评分点"></textarea></label></div><p><span class="score" id="evalTotal">0</span> / 100</p><div class="result" id="evalAdvice">录入分数后生成整改建议。</div><p><button class="btn" id="evalSave">保存本机</button> <button class="btn alt" id="evalExport">导出CSV</button></p>`);
  function calculate()
  {
    const scores=[...document.querySelectorAll('.eval-score')].map((input,index) => Math.max(0,Math.min(groups[index][1],Number(input.value)||0)));
    const total=scores.reduce((sum,value) => sum+value,0);
    $('#evalTotal').textContent=total;
    const ratios=scores.map((value,index) => value/groups[index][1]);
    const weakest=ratios.reduce((best,value,index,array) => value<array[best]?index:best,0);
    $('#evalAdvice').textContent=total>=85?'项目功能与证据较完整，可开展新传感参数迁移。':`优先整改：${groups[weakest][0]}，按“现象—假设—测试—修复—复测”补齐证据。`;
    return {name:$('#evalName').value,scores,total,evidence:$('#evalEvidence').value,advice:$('#evalAdvice').textContent};
  }
  document.querySelectorAll('.eval-score').forEach(input => input.oninput=calculate);
  $('#evalSave').onclick=() => localStorage.setItem('P09-EVAL-V2',JSON.stringify(calculate()));
  $('#evalExport').onclick=() =>
  {
    const data=calculate();
    const row=[data.name,...data.scores,data.total,data.evidence,data.advice].map(value => '"'+String(value).replaceAll('"','""')+'"').join(',');
    const csv='姓名,任务功能,工程规范调试诊断与电路绘制,证据质量,协作与迁移,总分,证据索引,整改建议\n'+row;
    const anchor=document.createElement('a');
    anchor.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));
    anchor.download='P09项目评价_'+(data.name||'未命名')+'.csv';
    anchor.click();
  };
  const saved=JSON.parse(localStorage.getItem('P09-EVAL-V2')||'null');
  if (saved)
  {
    $('#evalName').value=saved.name||'';
    saved.scores.forEach((value,index) => $('#eval'+index).value=value);
    $('#evalEvidence').value=saved.evidence||'';
  }
  calculate();
}

function originalResources(){shell('历史资源说明','<p>旧H5、视频、PPT、源码及PDF保留在项目9的99_历史归档目录，不作为本次课的默认入口。当前V4.0已明确14字节字段；旧PPT、协议视频及Proteus原件仍需适配。</p>');}

function evidence()
{
  shell('过程证据模板与迁移包',`<div class="downloads">${link('templates/C1_字符闭环与参数检查.csv','基础任务参数与字符闭环')}${link('templates/C2_稳定发送证据记录.csv','稳定输出记录')}${link('templates/C3_TEMP接收与采集记录.csv','温度接收记录')}${link('templates/C4_双节点联调故障闭环.csv','双节点故障闭环')}${link('templates/T0_课前诊断题.csv','T0课前诊断')}${link('templates/T1_100分评价量规.csv','T1评价量规')}${link('templates/T2_分层迁移任务单.csv','T2迁移任务')}${link('templates/项目交付清单.csv','项目交付清单')}</div><p class="notice">模板文件名沿用原资源中心，课堂填写内容按基础、进阶、提升三级任务重新对应。</p>`);
}

function guide()
{
  shell('资源中心使用指南',`<ol><li>先打开“教案与数字资源逐项映射”，按教学节点调用资源。</li><li>课前使用需求、参数和电路诊断测验形成T0证据。</li><li>项目实施中按“知识学习—功能开发—阶段考核—知识测试”自然递进。</li><li>基础任务完成虚拟终端闭环；进阶任务完成U3/U4AA55与14字节收帧；提升任务完成PC通信。</li><li>最后在项目评价页形成一次100分总评，并按薄弱项改进。</li></ol><div class="downloads"><a class="btn" href="#P09-H5-LESSON-MAP-01">教案资源逐项映射</a>${link('guides/教师使用指南.html','教师使用指南')}${link('guides/学生任务书.html','学生任务书')}${link('guides/Proteus双节点仿真搭建指南.html','Proteus搭建指南')}${link('guides/STC15数据手册检索指南.html','数据手册检索指南')}</div>`);
}

function route()
{
  runCleanup();
  const id=decodeURIComponent(location.hash.slice(1)||'home');
  if (id==='home') home();
  else if (id==='P09-H5-LESSON-MAP-01') lessonResourceMap();
  else if (id==='P09-H5-MAP-01') knowledgeMap();
  else if (id==='P09-T01-H5-ANIM-01') uartAnimation();
  else if (id==='P09-T02-H5-CALC-01') baudCalculator();
  else if (id==='P09-T03-H5-ANIM-01') basicAnimation();
  else if (id==='P09-T04-H5-ANIM-02') dualAnimation();
  else if (id==='P09-T04-H5-ANIM-01') receiveAnimation();
  else if (id==='P09-T03-VD-01') microCourse();
  else if (id==='P09-T05-H5-ANIM-01') pcAnimation();
  else if (RESOURCES.some(r=>r.id===id && r.file)) location.href=RESOURCES.find(r=>r.id===id).file;
  else if (id==='P09-STAGE-EVAL-FLOW-01') stageEvaluation();
  else if (id==='P09-EVAL-H5-01') projectEvaluation();
  else if (id==='original-h5') originalResources();
  else if (id==='evidence') evidence();
  else if (id==='guide') guide();
  else home();
}

window.onhashchange=route;
route();
