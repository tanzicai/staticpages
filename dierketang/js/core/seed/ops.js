/* ==========================================================================
   seed/ops.js —— 消息通知 / 内容安全 / 门户 / 数据大屏 / AI 助手 /
                  预警 / 审计日志 / 安全实施培训验收
   ========================================================================== */
(function (w) {
  'use strict';
  var U = w.ZU, B = w.ZSEED_BASE;

  function build(rand, org, act, academic) {
    var out = {};
    var students = org.students;
    var scoreRecs = act.scoreRecs;

    /* =============== 消息通知 =============== */
    var SEEDS = [
      { t: '活动报名审核通过', c: '你报名的「校园歌手大赛」已通过审核，请于 10 月 12 日 14:00 到大学生活动中心 301 参加。', ty: '报名' },
      { t: '活动即将开始提醒', c: '「职业技能大赛校级选拔赛」将于 24 小时后开始，请提前到场完成扫码签到。', ty: '提醒' },
      { t: '分值申报已通过', c: '你申报的「重庆市职业院校技能大赛二等奖」已审核通过，已自动赋分 1.5 学分。', ty: '分值' },
      { t: '第二课堂成绩预警', c: '截至 2026-09-20，你的第二课堂累计学分低于达标线，请尽快参与活动或提交已获得的荣誉材料。', ty: '预警' },
      { t: '活动签退提醒', c: '「中华经典诵读大赛」尚未签退，请在活动结束前完成签退，否则将记为未签到。', ty: '提醒' },
      { t: '作品评审结果通知', c: '你提交的作品已通过评审，得分 92 分，荣获二等奖，证书已生成可自行下载。', ty: '作品' },
      { t: '黑名单解除通知', c: '你已在黑名单中满 30 天，系统已自动解除限制，可正常报名活动。', ty: '规则' },
      { t: '考核方案更新通知', c: '「2026 级第二课堂成绩考核方案」已更新学分达标规则，请查看最新要求。', ty: '成绩' },
      { t: '社团申请审核通过', c: '你提交的「话剧社」创建申报已通过校团委审批，社团已正式成立。', ty: '社团' },
      { t: '作品提交截止提醒', c: '「“互联网+”大学生创新创业大赛校赛」作品将于今日 23:59 截止提交。', ty: '提醒' }
    ];
    out.msgs = [];
    for (var i = 0; i < 42; i++) {
      var m = SEEDS[i % SEEDS.length];
      var at = U.at(2026, U.rndInt(rand, 7, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 8, 21), U.rndInt(rand, 0, 59));
      var scope = i % 4 === 0 ? '全校' : (i % 4 === 1 ? '二级学院' : (i % 4 === 2 ? '活动参与人' : '指定用户'));
      var base = scope === '全校' ? students.length : (scope === '二级学院' ? Math.round(students.length / 8) : U.rndInt(rand, 24, 180));
      var read = Math.round(base * (0.42 + rand() * 0.5));
      out.msgs.push({
        id: 'M' + (i + 1), title: m.t, content: m.c, type: m.ty,
        scope: scope,
        channels: i % 3 === 0 ? ['站内消息', '移动端推送'] : ['站内消息', '移动端推送', '短信'],
        at: at, sender: i % 2 ? '校团委' : '信息工程学院',
        total: base, readCount: read, unreadCount: base - read,
        readBy: [], bizType: m.ty, bizId: '',
        needCall: i % 9 === 0,
        remindWays: ['短信', '电话', '微信'],
        targetDesc: scope === '全校' ? '全体学生' : (scope === '二级学院' ? '信息工程学院全体学生' : '活动已报名学生')
      });
    }

    /* =============== 内容安全 =============== */
    out.sensitiveWords = [
      { word: '代刷', level: '禁止', cat: '违规交易' }, { word: '代考', level: '禁止', cat: '违规交易' },
      { word: '刷单', level: '禁止', cat: '违规交易' }, { word: '兼职日结', level: '警告', cat: '广告' },
      { word: '扫码领奖', level: '警告', cat: '广告' }, { word: '免费领取', level: '警告', cat: '广告' },
      { word: '加群', level: '警告', cat: '引流' }, { word: '私聊', level: '警告', cat: '引流' },
      { word: '贷款', level: '禁止', cat: '金融风险' }, { word: '博彩', level: '禁止', cat: '违法' },
      { word: '赌博', level: '禁止', cat: '违法' }, { word: '违禁品', level: '禁止', cat: '违法' },
      { word: '身份证号', level: '警告', cat: '隐私' }, { word: '银行卡', level: '警告', cat: '隐私' },
      { word: '裸聊', level: '禁止', cat: '低俗' }, { word: '约炮', level: '禁止', cat: '低俗' },
      { word: '辱骂', level: '警告', cat: '不文明' }, { word: '抄袭', level: '警告', cat: '学术' },
      { word: '外挂', level: '禁止', cat: '违规' }, { word: '破解版', level: '警告', cat: '版权' }
    ];
    var CTEXTS = [
      { ti: '活动宣传稿：校园歌手大赛开始报名', ex: '校园歌手大赛正式启动，欢迎同学们报名参加，报名截止 10 月 10 日。', ty: '文本', sc: '活动介绍' },
      { ti: '兼职信息分享（用户上传）', ex: '招聘兼职日结，扫码领奖加群私聊，日薪 300 元起，详情私聊。', ty: '文本', sc: '评论/留言' },
      { ti: '社团招新海报', ex: '飞盘社招新啦！加群 123456 了解详情，欢迎各学院同学。', ty: '图片', sc: '社团简介' },
      { ti: '活动回顾长图', ex: '暑期“三下乡”社会实践成果回顾，走进沙坪坝区团结坝社区。', ty: '图片', sc: '活动介绍' },
      { ti: '竞赛培训资料（上传）', ex: '职业技能大赛历年真题与解析（破解版），仅供学习交流。', ty: '文档', sc: '作品提交' },
      { ti: '校园正能量短视频', ex: '我校学子见义勇为事迹报道，弘扬青春正能量。', ty: '视频', sc: '作品提交' },
      { ti: '代刷第二课堂学分（违规）', ex: '专业代刷第二课堂学分、代考服务，价格优惠，先到先得。', ty: '文本', sc: '评论/留言' },
      { ti: '闲置物品转让', ex: '出二手教材、耳机，有意私聊，请勿加群刷单，谢谢。', ty: '文本', sc: '评论/留言' },
      { ti: '学术讲座通知', ex: '本周五举办人工智能前沿讲座，欢迎各专业同学参加。', ty: '文本', sc: '通知公告' },
      { ti: '投票拉票链接', ex: '帮忙投一票，需要身份证号验证，投完私聊领红包。', ty: '文本', sc: '评论/留言' },
      { ti: '社团活动直播预告', ex: '汉服文化社秋季展演直播，欢迎围观。', ty: '视频', sc: '社团简介' },
      { ti: '心理咨询预约指南', ex: '心理健康中心开放预约，保护隐私，欢迎有需要的同学。', ty: '文档', sc: '门户内容' }
    ];
    out.contents = [];
    for (var i2 = 0; i2 < 68; i2++) {
      var ct = CTEXTS[i2 % CTEXTS.length];
      var s4 = students[U.rndInt(rand, 0, students.length - 1)];
      var hits = [];
      out.sensitiveWords.forEach(function (sw) { if (ct.ex.indexOf(sw.word) >= 0) hits.push({ word: sw.word, level: sw.level, cat: sw.cat }); });
      var at2 = U.at(2026, U.rndInt(rand, 7, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 8, 22), U.rndInt(rand, 0, 59));
      var hasBan = hits.some(function (h) { return h.level === '禁止'; });
      out.contents.push({
        id: 'CN' + (i2 + 1), type: ct.ty, title: ct.ti, excerpt: ct.ex,
        author: s4.name, authorId: s4.id, college: s4.college, className: s4.className, at: at2,
        status: hits.length ? '待审' : (i2 % 9 === 0 ? '已删除' : '已通过'),
        hits: hits, hitLevel: hasBan ? '禁止' : (hits.length ? '警告' : ''),
        scene: ct.sc, media: ct.ty === '图片' ? 'jpg' : (ct.ty === '视频' ? 'mp4' : (ct.ty === '文档' ? 'pdf' : 'text')),
        size: ct.ty === '文本' ? (U.rndInt(rand, 60, 900) + ' 字') : (U.rndInt(rand, 120, 8600) / 100).toFixed(1) + ' MB',
        handledBy: '', handledAt: '', note: '',
        risk: hasBan ? 92 : (hits.length ? 58 : 6)
      });
    }
    // 舆情监控的关键词热度（用于展示型关键词提取，走 U.keywords 的展示规则）
    out.contentTopics = (function () {
      var text = out.contents.map(function (c) { return c.excerpt + '。' + c.title; }).join('');
      return U.keywords(text, 14);
    })();

    /* =============== 门户配置 =============== */
    out.portal = {
      domain: B.DOMAIN,
      alias: ['dekt.' + B.DOMAIN, 'www.' + B.DOMAIN],
      title: B.SCHOOL + '第二课堂',
      subtitle: '第二课堂成绩单 · 活动报名 · 学分认定 · 数据服务',
      access: 'public',
      accessDesc: '公开访问（无需登录即可浏览活动广场与通知公告）',
      theme: 'blue',
      icp: '渝 ICP 备 2026xxxxxx 号',
      pages: [
        { id: 'PG1', name: '首页', path: '/', modules: ['MB1', 'MB2', 'MB3', 'MB4', 'MB5', 'MB6'] },
        { id: 'PG2', name: '活动专区', path: '/activity', modules: ['MB5', 'MB7', 'MB8'] },
        { id: 'PG3', name: '成绩查询', path: '/score', modules: ['MB4', 'MB9'] }
      ],
      modules: [
        { id: 'MB1', type: '轮播图', title: '轮播图', cfg: { items: ['2026 年第二课堂工作全面启动', '“挑战杯”校赛火热报名中', '暑期社会实践成果展开幕'], height: 148, auto: true, interval: 4 } },
        { id: 'MB2', type: '搜索条', title: '站内搜索', cfg: { placeholder: '搜索活动 / 通知 / 成绩…', scope: '全部内容' } },
        { id: 'MB3', type: '图标列表', title: '快捷入口', cfg: { items: [['🎯', '活动报名'], ['🏅', '成绩查询'], ['📝', '分值申报'], ['📢', '通知公告'], ['🤖', 'AI 助手'], ['📚', '文档学习'], ['🏛️', '社团专区'], ['📊', '数据公开']] } },
        { id: 'MB4', type: '图表', title: '我的二课成绩', cfg: { chart: '环形图', metric: '学分完成度' } },
        { id: 'MB5', type: '图文列表', title: '热门活动', cfg: { count: 3, showTime: true } },
        { id: 'MB6', type: '天气', title: '天气与日期', cfg: { city: '重庆', showDate: true } },
        { id: 'MB7', type: '文本', title: '活动专区说明', cfg: { text: '活动专区汇总全校六大类第二课堂活动，支持按类型、时间、主办单位筛选，并可直接报名、签到与查看结果。' } },
        { id: 'MB8', type: '轮播图', title: '活动banner', cfg: { items: ['专业技能比武月', '非遗进校园'], height: 120, auto: true, interval: 5 } },
        { id: 'MB9', type: '表格', title: '成绩查询说明', cfg: { note: '登录后可按学年、学期、活动类型查看完成任务与成绩记录明细，并导出 PDF 成绩单。' } },
        { id: 'MB10', type: '图片列表', title: '图集展示', cfg: { items: ['校园文化艺术节', '志愿服务风采', '技能竞赛掠影', '社会实践纪实', '社团巡礼', '开学第一课'] } },
        { id: 'MB11', type: '多图列表', title: '成果展示', cfg: { items: ['优秀作品选集', '获奖证书墙', '实践成果汇编'] } },
        { id: 'MB12', type: '文本列表', title: '通知公告', cfg: { items: ['关于 2026 年第二课堂成绩认定工作的通知', '第二课堂活动申报流程调整说明', '关于开展学分预警帮扶工作的通知', '社团年审工作安排'] } },
        { id: 'MB13', type: '视频', title: '宣传视频', cfg: { name: '第二课堂宣传片.mp4', duration: '2:36' } },
        { id: 'MB14', type: '按钮', title: '快捷按钮', cfg: { items: ['立即报名', '查看成绩单', '申报分值'] } },
        { id: 'MB15', type: '地图', title: '活动地点', cfg: { center: '重庆示范职业学院', pin: '大学生活动中心' } },
        { id: 'MB16', type: '日期', title: '日期显示', cfg: { format: 'YYYY 年 MM 月 DD 日 星期一' } },
        { id: 'MB17', type: 'IP 展示', title: '访问信息', cfg: { showIp: true, showLocation: true } },
        { id: 'MB18', type: '插件', title: '第三方插件位', cfg: { name: '青春重庆入口', type: '外链' } },
        { id: 'MB19', type: '搜索列表', title: '搜索结果列表', cfg: { source: '活动 + 通知' } },
        { id: 'MB20', type: '表格', title: '数据一览表', cfg: { note: '展示学院参与率、达标率等公开数据' } }
      ]
    };

    /* =============== 数据大屏配置 =============== */
    out.screenCfg = {
      name: B.SCHOOL + '第二课堂数据大屏',
      skin: 'skin-light', ratio: '16:9', refresh: 30, autoScroll: true,
      updatedAt: '2026-09-19 16:20', updatedBy: '陈立诚',
      modules: [
        { id: 'SM1', type: 'KPI 指标卡', title: '核心指标', enabled: true, span: 4 },
        { id: 'SM2', type: '柱状图', title: '院系参与人数对比', enabled: true, span: 2 },
        { id: 'SM3', type: '饼图', title: '活动类型分布', enabled: true, span: 1 },
        { id: 'SM4', type: '折线图', title: '参与趋势（近 12 周）', enabled: true, span: 2 },
        { id: 'SM5', type: '排行榜', title: '热门活动 Top 8', enabled: true, span: 1 },
        { id: 'SM6', type: '雷达图', title: '六类素养达标度', enabled: true, span: 1 },
        { id: 'SM7', type: '表格', title: '学院学分达标情况', enabled: true, span: 2 },
        { id: 'SM8', type: '地图', title: '活动地理分布', enabled: false, span: 1 },
        { id: 'SM9', type: '天气/日期', title: '天气与日期', enabled: true, span: 1 }
      ]
    };

    /* =============== AI 二课助手 =============== */
    var RULES = [
      { q: '第二课堂一共要修多少学分？', a: '按现行《' + B.SCHOOL + '第二课堂成绩单实施办法》，在校期间第二课堂需累计取得 6.0 学分方可毕业。其中思想素养、文化素养、专业素养各不少于 1.5 学分，创新创业、社会实践、社会工作各不少于 0.5 学分。你的实时达标情况可在“我的成绩单”查看。', kw: ['多少学分', '学分要求', '修满', '毕业学分', '总学分'], biz: ['我的成绩单', '考核方案'] },
      { q: '成绩单怎么导出 PDF？', a: '进入“我的成绩单”，点击右上角“导出 PDF”即可下载带学校电子印章的成绩单；也可以先在“成绩单模板”中切换版式，导出的文件会跟随你选择的模板样式。', kw: ['导出', 'PDF', '成绩单下载', '打印'], biz: ['我的成绩单'] },
      { q: '报名了但没去签到会怎样？', a: '活动结束后系统会统计未签到 / 未签退记录。90 天内累计达到 3 次，系统会自动将你纳入活动黑名单，黑名单期间无法报名新活动，满 30 天后自动解除。如确有特殊情况，可联系活动组织者或学院团委申诉。', kw: ['没签到', '未签到', '黑名单', '缺勤', '不去'], biz: ['活动规则', '活动广场'] },
      { q: '竞赛获奖怎么申报学分？', a: '进入“分值申报”，选择申报类型为“竞赛获奖”，填写赛事名称、获奖等级并上传获奖证书扫描件。提交后先由二级学院初审，再由校团委终审；审核通过后系统自动赋分并写入成绩记录。校级一等奖一般认定 1.5 学分。', kw: ['竞赛获奖', '申报学分', '证书', '获奖怎么算'], biz: ['分值申报', '我的成绩单'] },
      { q: '最多可以同时报名几个活动？', a: '为防止一人占用多个活动名额，系统默认限制同时处于“已报名未结束”状态的活动不超过 3 个，超出时报名会被拒绝并给出提示。该限制可在“活动规则设置”中按学校要求调整。', kw: ['同时报名', '报名数量', '限制', '几个活动'], biz: ['活动广场', '活动规则'] },
      { q: '积分、学时、学分之间怎么换算？', a: '按现行方案：10 积分 = 1 学分，1 学分 = 16 学时，换算比例可在“成绩管理 → 换算设置”中调整。成绩单上会同时展示学分、学时、积分三个口径的认定结果。', kw: ['换算', '积分', '学时', '比例'], biz: ['成绩管理', '我的成绩单'] },
      { q: '收到成绩预警怎么办？', a: '预警说明你在规定时间内第二课堂学分未达到达标线。请尽快登录活动广场报名参与活动，或在“分值申报”中提交尚未认定的获奖、荣誉、校外实践材料。预警会同时推送给你的辅导员与学院团总支书记，如有疑问可联系学院团委。', kw: ['预警', '成绩不达标', '预警通知', '没达标'], biz: ['活动广场', '分值申报'] },
      { q: '怎么加入社团？', a: '在“社团专区”中浏览社团并点击“申请加入”，社团负责人审核通过后即成为正式成员。如果你想创建新社团，可提交社团创建申报，由校团委审批通过后完成创建。', kw: ['加入社团', '社团申请', '创建社团'], biz: ['社团专区'] },
      { q: '二维码签到怎么用？', a: '活动现场大屏会展示动态签到二维码，二维码默认每 60 秒刷新一次，请用手机端“扫码签到”对准屏幕扫描，同时系统会校验你的定位是否在活动地点范围内，两项都通过才算签到成功。', kw: ['扫码签到', '二维码', '签到方式', '定位签到'], biz: ['活动广场'] }
    ];
    out.ai = {
      config: {
        name: '小课 · 二课助手',
        avatar: '课',
        avatarStyle: 'gradient',
        persona: '亲切、专业、简洁。以学校《第二课堂成绩单实施办法》为准绳回答，不确定时引导用户联系管理员，不编造规则。',
        welcome: '同学你好，我是小课，第二课堂的智能助手。学分认定、活动报名、成绩单导出、预警规则这些问题都可以问我。',
        unknownReply: '这个问题我暂时没有匹配到学校现行规定，已帮你记录并转交管理员，你也可以在“文档学习”中查看《第二课堂成绩单实施办法》原文。',
        guesses: ['第二课堂要修满多少学分？', '成绩单怎么导出 PDF？', '报名后没去签到会怎样？', '竞赛获奖怎么申报学分？'],
        adminOnline: true,
        hours: '7×24 小时',
        model: '校内私有化部署模型',
        authUntil: '2029-12-31',
        adminNotice: '工作时段 8:30—17:30 可转人工服务',
        bubbleStyle: '左右气泡',
        themeColor: '#2563eb',
        showBizEntry: true,
        updatedAt: '2026-09-16 11:02'
      },
      rules: RULES.map(function (r, i) {
        return {
          id: 'Q' + (i + 1), q: r.q, a: r.a, kw: r.kw, biz: r.biz, cat: ['成绩认定', '成绩认定', '活动规则', '分值申报', '活动规则', '成绩认定', '预警', '社团', '活动规则'][i],
          enabled: true, hits: U.rndInt(rand, 60, 860),
          useful: U.rndInt(rand, 50, 800),
          updatedAt: '2026-09-16 10:' + U.pad(20 + i * 3), updatedBy: '陈立诚'
        };
      }),
      docs: [
        { id: 'D1', name: B.SCHOOL + '第二课堂成绩单实施办法.pdf', size: '1.8 MB', chunks: 126, learnedAt: '2026-09-05 14:20', status: '已学习', words: '28,640', ver: '2026 修订版' },
        { id: 'D2', name: '第二课堂活动组织与审批操作流程.docx', size: '860 KB', chunks: 74, learnedAt: '2026-09-05 14:22', status: '已学习', words: '12,180', ver: 'v2.3' },
        { id: 'D3', name: '学生端报名与签到操作指引.pdf', size: '2.4 MB', chunks: 92, learnedAt: '2026-09-06 09:10', status: '已学习', words: '9,420', ver: 'v1.6' },
        { id: 'D4', name: '分值申报与审核材料规范.pdf', size: '640 KB', chunks: 58, learnedAt: '2026-09-06 09:12', status: '已学习', words: '7,360', ver: 'v1.2' },
        { id: 'D5', name: '第二课堂学分预警与黑名单管理规定.pdf', size: '420 KB', chunks: 41, learnedAt: '2026-09-08 16:40', status: '已学习', words: '5,180', ver: 'v1.0' },
        { id: 'D6', name: '社团管理办法（2026 修订）.pdf', size: '1.1 MB', chunks: 68, learnedAt: '2026-09-10 11:05', status: '已学习', words: '10,240', ver: '2026 修订版' },
        { id: 'D7', name: '第二课堂数据对接与接口说明.docx', size: '520 KB', chunks: 36, learnedAt: '2026-09-12 15:20', status: '已学习', words: '4,860', ver: 'v1.1' }
      ],
      sessions: [],
      stats: { total: 0, matched: 0, useful: 0, unknown: 0, manual: 0 }
    };
    for (var i3 = 0; i3 < 30; i3++) {
      var s5 = students[U.rndInt(rand, 0, students.length - 1)];
      var q0 = out.ai.rules[U.rndInt(rand, 0, out.ai.rules.length - 1)];
      var turns = [{ q: q0.q, a: q0.a, matched: true, src: '问答规则库', useful: rand() < 0.86 }];
      if (rand() < 0.5) {
        var q1 = out.ai.rules[U.rndInt(rand, 0, out.ai.rules.length - 1)];
        turns.push({ q: q1.q, a: q1.a, matched: true, src: '知识文档（' + out.ai.docs[U.rndInt(rand, 0, 6)].name + '）', useful: rand() < 0.82 });
      }
      if (rand() < 0.28) turns.push({ q: U.rndPick(rand, ['周末能报名吗？', '转专业后学分还算吗？', '毕业生还能补学分吗？']), a: out.ai.config.unknownReply, matched: false, src: '未匹配 · 已转人工', useful: false });
      out.ai.sessions.push({
        id: 'SS' + (i3 + 1), studentId: s5.id, name: s5.name, sno: s5.sno, college: s5.college, className: s5.className,
        at: U.at(2026, U.rndInt(rand, 7, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 8, 22), U.rndInt(rand, 0, 59)),
        turns: turns, duration: U.rndInt(rand, 40, 460),
        matchedCount: turns.filter(function (t) { return t.matched; }).length,
        unknownCount: turns.filter(function (t) { return !t.matched; }).length,
        usefulCount: turns.filter(function (t) { return t.useful; }).length,
        manual: turns.some(function (t) { return !t.matched; })
      });
    }
    out.ai.sessions = U.sortBy(out.ai.sessions, function (x) { return x.at; }, true);
    out.ai.stats = {
      total: out.ai.sessions.reduce(function (s, x) { return s + x.turns.length; }, 0),
      matched: out.ai.sessions.reduce(function (s, x) { return s + x.matchedCount; }, 0),
      useful: out.ai.sessions.reduce(function (s, x) { return s + x.usefulCount; }, 0),
      unknown: out.ai.sessions.reduce(function (s, x) { return s + x.unknownCount; }, 0),
      manual: out.ai.sessions.filter(function (x) { return x.manual; }).length
    };

    /* =============== 预警规则与预警名单 =============== */
    out.warnRules = [
      {
        id: 'WR1', name: '学分未达标自动预警（2026 级）', schemeId: 'SC001', enabled: true,
        scope: { colleges: ['全部'], grades: ['2026级'] },
        threshold: 4.5, basis: '累计学分低于达标线 4.5 分', deadline: '2026-12-31',
        channels: ['站内消息', '移动端推送', '短信'],
        targets: ['学生本人', '辅导员', '团总支书记'],
        trigger: '每日 06:00 自动扫描', autoSend: true, lastRun: '2026-09-22 06:00', sentCount: 42,
        createdAt: '2026-08-28 09:00', createdBy: '陈立诚'
      },
      {
        id: 'WR2', name: '分类别短板预警（思想素养）', schemeId: 'SC001', enabled: true,
        scope: { colleges: ['信息工程学院', '智能制造学院'], grades: ['2025级', '2026级'] },
        threshold: 1, basis: '思想素养类别学分不足 1.0 分', deadline: '2026-11-30',
        channels: ['站内消息', '移动端推送'],
        targets: ['学生本人', '辅导员'],
        trigger: '每周一 08:00 扫描', autoSend: true, lastRun: '2026-09-21 08:00', sentCount: 18,
        createdAt: '2026-09-01 10:20', createdBy: '陈立诚'
      },
      {
        id: 'WR3', name: '毕业年级清算预警（自定义）', schemeId: 'SC003', enabled: false,
        scope: { colleges: ['全部'], grades: ['2024级'] },
        threshold: 6, basis: '毕业前累计学分不足 6.0 分', deadline: '2026-06-30',
        channels: ['站内消息', '移动端推送', '微信'],
        targets: ['学生本人', '辅导员', '团总支书记', '分管校领导'],
        trigger: '手动触发', autoSend: false, lastRun: '2026-06-01 09:00', sentCount: 0,
        createdAt: '2026-05-20 15:40', createdBy: '陈立诚'
      }
    ];
    // 按学生学分生成预警名单
    out.warnings = [];
    (function () {
      var agg = aggregate(students, scoreRecs);
      U.sortBy(agg, function (x) { return x.total; }, false).forEach(function (s) {
        if (s.total >= 4.5 || out.warnings.length >= 48) return;
        var gap = Math.round((4.5 - s.total) * 100) / 100;
        var at6 = U.at(2026, U.rndInt(rand, 8, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 7, 20), U.rndInt(rand, 0, 59));
        out.warnings.push({
          id: 'WN' + (out.warnings.length + 1),
          studentId: s.studentId, sno: s.sno, name: s.name, college: s.college, collegeId: s.collegeId,
          major: s.major, className: s.className, grade: s.grade, contact: s.contact,
          schemeId: 'SC001', ruleId: 'WR1', ruleName: '学分未达标自动预警（2026 级）',
          total: s.total, threshold: 4.5, gap: gap, deadline: '2026-12-31',
          level: s.total < 2.5 ? '严重' : (s.total < 3.5 ? '较重' : '一般'),
          channels: ['站内消息', '移动端推送', '短信'],
          targets: ['学生本人', '辅导员', '团总支书记'],
          at: at6, read: rand() < 0.62, readAt: '',
          handledBy: '', handledAt: '', note: '',
          status: rand() < 0.3 ? '已处理' : '待处理',
          source: '自动预警',
          shortCat: Object.keys(s.cat).filter(function (k) { return s.cat[k] < 1; }).slice(0, 2)
        });
        var last = out.warnings[out.warnings.length - 1];
        if (last.read) last.readAt = B.addDays(at6, 1);
        if (last.status === '已处理') {
          last.handledBy = '黄静怡';
          last.handledAt = B.addDays(at6, 2);
          last.note = '已电话联系学生，安排参与本周主题活动补足思想素养学分';
        }
      });
    })();

    /* =============== 审计日志 =============== */
    var ACTS = [
      ['登录系统', '用户认证'], ['创建活动', '活动管理'], ['审核活动', '活动审批'], ['审核报名', '报名管理'],
      ['认定分值', '成绩管理'], ['导出成绩单', '成绩管理'], ['发送预警', '预警管理'], ['保存考核方案', '成绩管理'],
      ['配置角色权限', '用户管理'], ['导入用户', '用户管理'], ['审核内容', '内容安全'], ['更新知识库', 'AI 助手'],
      ['发布门户', '门户配置'], ['设置黑名单', '活动规则'], ['维护社团成员', '社团管理'], ['导出团员数据', '党团管理'],
      ['配置数据大屏', '数据大屏'], ['备份数据库', '系统运维']
    ];
    out.logs = [];
    for (var i4 = 0; i4 < 70; i4++) {
      var la = ACTS[i4 % ACTS.length];
      var who = i4 % 5 === 0 ? org.staff[U.rndInt(rand, 0, org.staff.length - 1)] : { name: i4 % 3 === 0 ? '周雅婷' : '陈立诚', title: '管理员' };
      out.logs.push({
        id: 'LG' + (i4 + 1),
        at: U.at(2026, U.rndInt(rand, 8, 9), U.rndInt(rand, 1, 21), U.rndInt(rand, 8, 22), U.rndInt(rand, 0, 59)),
        actor: who.name, role: who.title, action: la[0], module: la[1],
        target: U.rndPick(rand, ['A' + U.pad(U.rndInt(rand, 1, 48)), 'S' + U.rndInt(rand, 1001, 1400), 'SC001', 'WR1', 'CN' + U.rndInt(rand, 1, 68)]),
        ip: '10.16.' + U.rndInt(rand, 1, 40) + '.' + U.rndInt(rand, 2, 240),
        result: rand() < 0.97 ? '成功' : '失败',
        detail: '操作留痕已记录'
      });
    }
    out.logs = U.sortBy(out.logs, function (x) { return x.at; }, true);

    /* =============== 安全 / 实施 / 培训 / 运维 / 对接 =============== */
    out.safety = {
      protections: [
        { id: 'SP1', name: '网络安全等级保护', target: '等保二级（配合学校开展）', status: '已备案', detail: '已完成定级备案与差距分析，整改进行中', owner: '运维组', at: '2026-07-18', percent: 68 },
        { id: 'SP2', name: '数据安全', target: '敏感字段加密 + 分级授权', status: '已启用', detail: '手机号、身份证加密存储；导出行为全量留痕', owner: '运维组', at: '2026-08-02', percent: 100 },
        { id: 'SP3', name: '权限控制', target: '角色 + 数据范围双维度', status: '已启用', detail: '6 类角色、三级数据范围（全校 / 学院 / 本人）', owner: '运维组', at: '2026-08-02', percent: 100 },
        { id: 'SP4', name: '日志审计', target: '全量操作留痕 ≥ 180 天', status: '已启用', detail: '登录、增删改、导出、审批全留痕，可检索可导出', owner: '运维组', at: '2026-08-05', percent: 100 },
        { id: 'SP5', name: '备份恢复', target: '每日全量 + 实时增量', status: '已启用', detail: '每日 02:00 全量备份，保留 30 天；RPO ≤ 15 分钟', owner: '运维组', at: '2026-08-05', percent: 100 }
      ],
      backups: (function () {
        var out2 = [];
        for (var i = 0; i < 30; i++) {
          var full = i % 7 === 0;
          out2.push({
            id: 'BK' + (i + 1), type: full ? '全量备份' : '增量备份',
            at: '2026-09-' + U.pad(Math.max(1, 21 - Math.floor(i / 1.4))) + ' 02:0' + (i % 6),
            size: (full ? U.rndInt(rand, 820, 1180) : U.rndInt(rand, 60, 220)) + ' MB',
            status: '成功', keep: '保留 30 天', store: i % 3 === 0 ? '异地灾备' : '本地存储',
            duration: U.rndInt(rand, 40, 320) + ' 秒'
          });
        }
        return out2;
      })(),
      impl: [
        { id: 'IM1', name: '系统部署', status: '已完成', at: '2026-08-10', detail: '校内私有化部署，双节点应用 + 主从数据库', percent: 100 },
        { id: 'IM2', name: '数据初始化', status: '已完成', at: '2026-08-18', detail: '导入师生 12,860 条、历史成绩 6.2 万条', percent: 100 },
        { id: 'IM3', name: '接口联调', status: '进行中', at: '2026-09-05', detail: '青春重庆数据对接、学校数据中心成绩单对接、教学 APP 对接', percent: 62 },
        { id: 'IM4', name: '业务测试', status: '进行中', at: '2026-09-12', detail: '六大类活动全流程用例 186 条，已通过 172 条', percent: 92 },
        { id: 'IM5', name: '上线试运行', status: '未开始', at: '计划 2026-10-08', detail: '试运行 1 个学期，期间与纸质流程并行', percent: 0 },
        { id: 'IM6', name: '验收交付', status: '未开始', at: '计划 2027-03-15', detail: '含操作手册、培训课件、常见问题处理说明', percent: 0 }
      ],
      trainings: [
        { id: 'TR1', object: '系统管理员', count: 6, hours: 8, status: '已完成', at: '2026-09-15', teacher: '实施组 · 陈工', content: '组织架构、角色权限、考核方案、数据大屏、系统参数与日志', materials: ['管理员操作手册.pdf', '系统参数说明.docx'] },
        { id: 'TR2', object: '二级学院管理人员', count: 24, hours: 6, status: '已完成', at: '2026-09-16', teacher: '实施组 · 李工', content: '本学院活动审核、成绩查询与导出、预警处理与督办', materials: ['学院管理员手册.pdf', '常见问题处理说明.docx'] },
        { id: 'TR3', object: '活动组织者', count: 86, hours: 4, status: '进行中', at: '2026-09-20', teacher: '实施组 · 王工', content: '活动创建与审批、报名与签到、作品评审、活动考核评分', materials: ['活动组织者手册.pdf', '签到设备使用说明.docx'] },
        { id: 'TR4', object: '学生用户', count: 12600, hours: 2, status: '进行中', at: '2026-09-22', teacher: '线上课程', content: '活动广场报名、扫码签到、作品提交、分值申报、成绩单导出', materials: ['学生操作指引.pdf', '操作短视频合集'] }
      ],
      ops: [
        { id: 'OP1', name: '质保期', value: '3 年（自验收合格之日起）', status: '生效中' },
        { id: 'OP2', name: '系统升级', value: '每年不少于 2 次功能版本升级，安全补丁 7 日内响应', status: '生效中' },
        { id: 'OP3', name: '故障处理', value: '严重故障 2 小时响应、4 小时恢复；一般故障 8 小时响应', status: '生效中' },
        { id: 'OP4', name: '数据备份', value: '每日全量 + 实时增量，异地灾备保留 90 天', status: '生效中' },
        { id: 'OP5', name: '应急响应', value: '7×24 值班电话，重大活动期间现场保障', status: '生效中' },
        { id: 'OP6', name: '定期巡检', value: '每月 1 次现场巡检并出具巡检报告', status: '生效中' }
      ],
      interfaces: [
        { id: 'IF1', name: '青春重庆数据对接', target: '团市委“青春重庆”平台', status: '联调中', freq: '每日 02:00 增量同步', field: '学生信息、活动信息、成绩记录', lastAt: '2026-09-22 02:04', rows: '1,286 条', need: '根据学校要求对接' },
        { id: 'IF2', name: '学校数据中心成绩单对接', target: '学校数据中心', status: '联调中', freq: '每学期 1 次全量 + 每日增量', field: '第二课堂成绩单信息', lastAt: '2026-09-21 23:10', rows: '12,860 条', need: '根据学校要求对接' },
        { id: 'IF3', name: '教学 APP 统一身份认证', target: '师生现有教学 APP', status: '已上线', freq: '实时单点登录', field: 'CAS 统一身份认证', lastAt: '2026-09-22 08:52', rows: '1,024 次', need: '根据学校要求对接' },
        { id: 'IF4', name: '短信 / 微信提醒通道', target: '运营商短信 + 企业微信', status: '已上线', freq: '按需触发', field: '预警与通知推送', lastAt: '2026-09-22 06:00', rows: '60 条', need: '条件具备时启用' }
      ],
      pcMobile: [
        { id: 'PM1', name: '活动数据', sync: '实时同步', lastAt: '2026-09-22 09:18', status: '正常' },
        { id: 'PM2', name: '报名数据', sync: '实时同步', lastAt: '2026-09-22 09:18', status: '正常' },
        { id: 'PM3', name: '签到数据', sync: '实时同步', lastAt: '2026-09-22 09:17', status: '正常' },
        { id: 'PM4', name: '成绩数据', sync: '实时同步', lastAt: '2026-09-22 09:16', status: '正常' },
        { id: 'PM5', name: '通知数据', sync: '实时同步', lastAt: '2026-09-22 09:18', status: '正常' }
      ]
    };

    return out;
  }

  /** 学生学分汇总（供预警 / 统计复用） */
  function aggregate(students, scoreRecs) {
    var m = {};
    students.forEach(function (s) {
      m[s.id] = {
        studentId: s.id, sno: s.sno, name: s.name, contact: s.contact,
        college: s.college, collegeId: s.collegeId, major: s.major, className: s.className, grade: s.grade,
        total: 0, hours: 0, points: 0, cat: {}, records: 0
      };
      B.CATS.forEach(function (c) { m[s.id].cat[c.name] = 0; });
    });
    scoreRecs.forEach(function (r) {
      var t = m[r.studentId]; if (!t) return;
      t.total += U.num(r.credit);
      t.hours += U.num(r.hours);
      t.points += U.num(r.points);
      t.records++;
      t.cat[r.cat] = U.num(t.cat[r.cat]) + U.num(r.credit);
    });
    return Object.keys(m).map(function (k) {
      m[k].total = Math.round(m[k].total * 100) / 100;
      m[k].hours = Math.round(m[k].hours * 10) / 10;
      m[k].points = Math.round(m[k].points * 10) / 10;
      return m[k];
    });
  }

  w.ZSEED_OPS = { build: build, aggregate: aggregate };
})(window);
