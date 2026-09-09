/* ============================================================
   智慧课堂 — 本地数据层（localStorage 模拟业务库）
   ============================================================ */
(function (global) {
  'use strict';

  var DB_KEY = 'zhkt_db_v1';
  var TERM = '2025-2026学年 第二学期';
  var CURR_WEEK = 8;       // 当前教学周（共18周）

  /* ---------- 语种 ---------- */
  var LANGS = [
    { key: 'zh', name: '中文' }, { key: 'en', name: '英语' }, { key: 'de', name: '德语' },
    { key: 'fr', name: '法语' }, { key: 'ja', name: '日语' }, { key: 'ru', name: '俄语' },
    { key: 'es', name: '西班牙语' }, { key: 'ko', name: '韩语' }, { key: 'ar', name: '阿拉伯语' },
    { key: 'pt', name: '葡萄牙语' }, { key: 'hi', name: '印地语' }
  ];

  /* ---------- 活动类型元数据（无图标，仅色标） ---------- */
  var ACT_TYPES = {
    '随堂练习': { color: '#5B4AD8', bg: '#EFECFD', fg: '#4336B4' },
    '即时测验': { color: '#7C53C7', bg: '#F1EBFC', fg: '#5B3E9E' },
    '主题讨论': { color: '#2F6BC4', bg: '#E7F0FB', fg: '#24579F' },
    '分组任务': { color: '#14967A', bg: '#E2F5EF', fg: '#0E7A63' },
    '课堂签到': { color: '#C77E1B', bg: '#FBF0DC', fg: '#A4630F' },
    '随堂投票': { color: '#C24E7E', bg: '#F9E9F0', fg: '#9D3A63' }
  };

  /* ---------- 学生花名册（用于参与情况演示） ---------- */
  var STUDENT_NAMES = [
    '王思远', '李雨桐', '张子涵', '刘一诺', '陈欣然', '杨昊宇', '赵可欣', '黄俊杰',
    '周诗琪', '吴宇航', '徐若曦', '孙浩然', '马佳怡', '朱天翊', '胡梦洁', '郭启铭',
    '何静怡', '高翔宇', '林雨欣', '罗子谦', '郑欣妍', '梁文博', '谢佳琪', '宋睿哲',
    '唐婉清', '许博文', '邓丽娜', '冯子墨', '曹艺馨', '彭俊熙', '曾语嫣', '肖铭泽',
    '田思颖', '董浩然', '袁梦洁', '潘志远', '于欣悦', '蒋承宇', '蔡文静', '余嘉豪',
    '杜若曦', '叶明轩', '阎紫萱', '魏泽宇', '苏晓彤', '孔令辉', '姜语桐', '范文博',
    '金雨菲', '顾星辰'
  ];
  var EVAL_RATERS = ['李岩', '陈国栋', '王雅琴', '刘建平', '孙立群'];

  /* ---------- 转写演示脚本（含语义纠错 + 11 语种译文） ---------- */
  var STT_SCRIPT = [
    { t: '00:03', zh: '同学们好，今天我们学习慢性阻塞性肺疾病的诊断与治疗。',
      tr: { en: 'Good morning everyone. Today we will learn the diagnosis and treatment of chronic obstructive pulmonary disease.', de: 'Guten Morgen zusammen. Heute lernen wir Diagnose und Therapie der chronisch obstruktiven Lungenerkrankung.', fr: 'Bonjour à tous. Aujourd\u2019hui, nous étudions le diagnostic et le traitement de la BPCO.', ja: '皆さん、こんにちは。今日は慢性閉塞性肺疾患の診断と治療について学びます。', ru: 'Здравствуйте. Сегодня мы изучаем диагностику и лечение ХОБЛ.', es: 'Buenos días a todos. Hoy estudiaremos el diagnóstico y tratamiento de la EPOC.', ko: '여러분 안녕하세요. 오늘은 만성폐쇄성폐질환의 진단과 치료에 대해 배우겠습니다.', ar: 'صباح الخير جميعا. اليوم سندرس تشخيص وعلاج مرض الانسداد الرئوي المزمن.', pt: 'Bom dia a todos. Hoje vamos estudar o diagnóstico e o tratamento da DPOC.', hi: 'नमस्ते। आज हम क्रॉनिक ऑब्सट्रक्टिव पल्मोनरी डिज़ीज़ के निदान और उपचार का अध्ययन करेंगे।' } },
    { t: '00:26', zh: '首先回顾流行病学，我国四十岁以上人群慢阻肺患病率约为百分之十三点七。',
      tr: { en: 'First, a quick review of the epidemiology: among people over forty in China, the prevalence of COPD is about 13.7 percent.', de: 'Zuerst zur Epidemiologie: Bei über 40-Jährigen in China liegt die COPD-Prävalenz bei etwa 13,7 Prozent.', fr: 'D\u2019abord l\u2019épidémiologie : chez les plus de quarante ans en Chine, la prévalence de la BPCO est d\u2019environ 13,7 %.', ja: 'まず疫学を振り返ります。中国の40歳以上ではCOPDの有病率は約13.7％です。', ru: 'Сначала об эпидемиологии: среди людей старше 40 лет в Китае распространённость ХОБЛ составляет около 13,7%.', es: 'Primero la epidemiología: en mayores de 40 años en China, la prevalencia de la EPOC es de alrededor del 13,7 %.', ko: '먼저 역학을 살펴보면, 중국 40세 이상 인구의 COPD 유병률은 약 13.7%입니다.', ar: 'أولا علم الأوبئة: بين من تجاوزوا الأربعين في الصين تبلغ نسبة انتشار المرض نحو 13.7٪.', pt: 'Primeiro a epidemiologia: na China, em maiores de 40 anos, a prevalência da DPOC é de cerca de 13,7%.', hi: 'पहले महामारी विज्ञान: चीन में 40 वर्ष से अधिक लोगों में सीओपीडी लगभग 13.7 प्रतिशत है।' } },
    { t: '00:52', zh: '吸烟是慢阻肺最主要的危险因素，二手烟与职业性粉尘暴露同样需要关注。',
      fix: { wrong: '满族废', right: '慢阻肺', why: '根据“吸烟 / 肺疾病”上下文语义纠正' },
      tr: { en: 'Smoking is the most important risk factor for COPD; secondhand smoke and occupational dust exposure also need attention.', de: 'Rauchen ist der wichtigste Risikofaktor für COPD; auch Passivrauch und berufliche Staubbelastung sind zu beachten.', fr: 'Le tabagisme est le principal facteur de risque de la BPCO ; le tabagisme passif et les poussières professionnelles comptent aussi.', ja: '喫煙はCOPDの最も重要な危険因子です。受動喫煙や職業性粉塵曝露にも注意が必要です。', ru: 'Курение — главный фактор риска ХОБЛ; важны также пассивное курение и производственная пыль.', es: 'El tabaquismo es el principal factor de riesgo de la EPOC; también importan el humo pasivo y el polvo ocupacional.', ko: '흡연은 COPD의 가장 중요한 위험 요인이며 간접흡연과 직업적 분진 노출도 주의해야 합니다.', ar: 'التدخين هو أهم عامل خطر للمرض؛ كما يجب الانتباه للتدخين السلبي وغبار المهن.', pt: 'O tabagismo é o principal fator de risco da DPOC; o fumo passivo e a poeira ocupacional também importam.', hi: 'धूम्रपान सीओपीडी का सबसे महत्वपूर्ण जोखिम कारक है; सेकेंडहैंड धुआं और व्यावसायिक धूल भी महत्वपूर्ण हैं।' } },
    { t: '01:18', zh: '肺功能检查是诊断慢阻肺的金标准，吸入支气管舒张剂后 FEV1 与 FVC 比值小于零点七即可诊断。',
      tr: { en: 'Spirometry is the gold standard for diagnosing COPD: a post-bronchodilator FEV1/FVC ratio below 0.7 confirms the diagnosis.', de: 'Die Spirometrie ist der Goldstandard: Ein FEV1/FVC-Quotient unter 0,7 nach Bronchodilatation bestätigt die Diagnose.', fr: 'La spirométrie est la référence : un rapport VEMS/CVF inférieur à 0,7 après bronchodilatation confirme le diagnostic.', ja: '肺機能検査が診断のゴールドスタンダードです。気管支拡張薬吸入後のFEV1/FVC比が0.7未満なら診断できます。', ru: 'Спирометрия — золотой стандарт: отношение ОФВ1/ФЖЕЛ после бронходилатации ниже 0,7 подтверждает диагноз.', es: 'La espirometría es la referencia: un cociente FEV1/FVC inferior a 0,7 tras broncodilatación confirma el diagnóstico.', ko: '폐기능 검사가 COPD 진단의 표준이며, 기관지확장제 흡입 후 FEV1/FVC 비가 0.7 미만이면 진단됩니다.', ar: 'قياس وظائف الرئة هو المعيار الذهبي؛ ونسبة FEV1 إلى FVC بعد موسع القصبات أقل من 0.7 تؤكد التشخيص.', pt: 'A espirometria é o padrão-ouro: uma relação VEF1/CVF inferior a 0,7 pós-broncodilatador confirma o diagnóstico.', hi: 'स्पाइरोमेट्री निदान का स्वर्ण मानक है: ब्रोन्कोडाइलेटर के बाद FEV1/FVC अनुपात 0.7 से कम होने पर निदान की पुष्टि होती है।' } },
    { t: '01:52', zh: '稳定期治疗以长效支气管舒张剂为核心，同时强调长期家庭氧疗与肺康复训练。',
      tr: { en: 'Stable-state treatment centres on long-acting bronchodilators, together with long-term home oxygen therapy and pulmonary rehabilitation.', de: 'Im stabilen Stadium stehen langwirksame Bronchodilatatoren im Zentrum, ergänzt durch Langzeit-Sauerstofftherapie und Lungensport.', fr: 'Au stade stable, les bronchodilatateurs de longue durée sont essentiels, avec l\u2019oxygénothérapie à domicile et la réadaptation respiratoire.', ja: '安定期の治療は長時間作用性気管支拡張薬が中心で、長期在宅酸素療法と肺リハビリテーションも重要です。', ru: 'В стабильной стадии основа — длительно действующие бронходилататоры, а также длительная оксигенотерапия и лёгочная реабилитация.', es: 'En fase estable destacan los broncodilatadores de acción prolongada, con oxigenoterapia domiciliaria y rehabilitación respiratoria.', ko: '안정기 치료는 지속성 기관지확장제가 중심이며 장기 가정 산소요법과 폐재활 훈련도 중요합니다.', ar: 'في المرحلة المستقرة تكون موسعات القصبات طويلة المفعول أساس العلاج مع الأكسجين المنزلي طويل الأمد وإعادة التأهيل الرئوي.', pt: 'Na fase estável, os broncodilatadores de longa duração são centrais, com oxigenoterapia domiciliar e reabilitação pulmonar.', hi: 'स्थिर अवस्था में लंबे समय तक असर करने वाले ब्रोन्कोडाइलेटर मुख्य हैं, साथ में दीर्घकालिक घरेलू ऑक्सीजन और फेफड़े का पुनर्वास।' } },
    { t: '02:24', zh: '戒烟是延缓疾病进展最关键的措施，每位患者都应接受规范的戒烟指导。',
      tr: { en: 'Smoking cessation is the most critical measure to slow disease progression, and every patient should receive proper counselling.', de: 'Die Raucherentwöhnung ist die wichtigste Maßnahme zur Verlangsamung des Fortschreitens; jeder Patient braucht Beratung.', fr: 'L\u2019arrêt du tabac est la mesure la plus importante pour ralentir la progression ; chaque patient doit être conseillé.', ja: '禁煙は病状の進行を遅らせる最も重要な対策であり、すべての患者が適切な禁煙指導を受けるべきです。', ru: 'Отказ от курения — ключевая мера замедления прогрессирования; каждый пациент должен получить консультацию.', es: 'Dejar de fumar es la medida más importante para frenar la progresión; todo paciente debe recibir consejo.', ko: '금연은 질환 진행을 늦추는 가장 중요한 조치이며 모든 환자가 표준 금연 지도를 받아야 합니다.', ar: 'الإقلاع عن التدخين هو أهم إجراء لإبطاء تقدم المرض، ويجب أن يحصل كل مريض على إرشاد مناسب.', pt: 'Parar de fumar é a medida mais importante para retardar a progressão; todo paciente deve receber orientação.', hi: 'धूम्रपान छोड़ना रोग की प्रगति धीमी करने का सबसे महत्वपूर्ण उपाय है; हर मरीज़ को उचित परामर्श मिलना चाहिए।' } },
    { t: '02:58', zh: '下面我们结合一个临床病例，分析如何评估和处理慢阻肺急性加重。',
      tr: { en: 'Now let us look at a clinical case to analyse how to assess and manage an acute exacerbation of COPD.', de: 'Nun betrachten wir einen klinischen Fall zur Bewertung und Behandlung einer akuten Exazerbation der COPD.', fr: 'Étudions maintenant un cas clinique pour analyser l\u2019évaluation et la prise en charge d\u2019une exacerbation aiguë.', ja: 'では臨床例を用いて、COPD急性増悪の評価と対応を分析しましょう。', ru: 'Рассмотрим клинический случай оценки и лечения острого обострения ХОБЛ.', es: 'Veamos ahora un caso clínico para analizar la evaluación y el manejo de una exacerbación aguda.', ko: '이제 임상 사례를 통해 COPD 급성 악화의 평가와 대응을 분석해 보겠습니다.', ar: 'لننظر الآن إلى حالة سريرية لتحليل تقييم وتدبير التفاقم الحاد للمرض.', pt: 'Vejamos agora um caso clínico para analisar a avaliação e o manejo de uma exacerbação aguda da DPOC.', hi: 'अब हम एक नैदानिक मामले से सीओपीडी की तीव्र वृद्धि के मूल्यांकन और प्रबंधन का विश्लेषण करेंगे।' } }
  ];

  /* ---------- 更多课堂实录的语音转写脚本（可随资源切换） ---------- */
  var T = function (en, de, fr, ja, ru, es, ko, ar, pt, hi) {
    return { en: en, de: de, fr: fr, ja: ja, ru: ru, es: es, ko: ko, ar: ar, pt: pt, hi: hi };
  };
  var RES_SCRIPTS = {
    /* 《呼吸系统总论》第1讲课堂实录（r1） */
    stt_gen: [
      { t: '00:05', zh: '同学们好，今天我们开始学习呼吸系统疾病总论。', tr: T('Good morning everyone. Today we begin with the general introduction to respiratory diseases.', 'Guten Morgen. Heute beginnen wir mit der allgemeinen Einführung in Atemwegserkrankungen.', 'Bonjour à tous. Aujourd\u2019hui, nous commençons l\u2019introduction générale aux maladies respiratoires.', '皆さん、こんにちは。今日は呼吸器疾患総論を学び始めます。', 'Здравствуйте. Сегодня мы начинаем общее введение в респираторные заболевания.', 'Buenos días a todos. Hoy comenzamos con la introducción general a las enfermedades respiratorias.', '여러분 안녕하세요. 오늘은 호흡기 질환 총론을 배우기 시작합니다.', 'صباح الخير جميعا. اليوم نبدأ بالمقدمة العامة لأمراض الجهاز التنفسي.', 'Bom dia a todos. Hoje começamos a introdução geral às doenças respiratórias.', 'नमस्ते। आज हम श्वसन रोगों का सामान्य परिचय शुरू करते हैं।' ) },
      { t: '00:31', zh: '首先认识呼吸系统的结构与组成。', tr: T('First, let us understand the structure and components of the respiratory system.', 'Zuerst lernen wir den Aufbau der Atemwege kennen.', 'D\u2019abord, comprenons la structure et la composition du système respiratoire.', 'まず呼吸器系の構造と構成を理解しましょう。', 'Сначала познакомимся со строением дыхательной системы.', 'Primero comprendamos la estructura del sistema respiratorio.', '먼저 호흡기계의 구조와 구성을 이해합니다.', 'أولا دعونا نفهم بنية الجهاز التنفسي ومكوناته.', 'Primeiro, compreendamos a estrutura do sistema respiratório.', 'पहले श्वसन तंत्र की संरचना को समझें।' ) },
      { t: '00:58', zh: '气道分为上呼吸道与下呼吸道，肺是气体交换的主要场所。', tr: T('The airway is divided into the upper and lower respiratory tracts, and the lungs are the main site of gas exchange.', 'Die Atemwege teilen sich in obere und untere; die Lunge ist der Hauptort des Gasaustauschs.', 'Les voies aériennes se divisent en voies supérieures et inférieures ; les poumons sont le siège des échanges gazeux.', '気道は上気道と下気道に分かれ、肺がガス交換の主な場です。', 'Дыхательные пути делятся на верхние и нижние; лёгкие — главное место газообмена.', 'La vía aérea se divide en superior e inferior; los pulmones son el principal lugar de intercambio gaseoso.', '기도는 상기도와 하기도로 나뉘며 폐가 가스 교환의 주요 장소입니다.', 'تنقسم المجاري الهوائية إلى علوية وسفلية، والرئتان هما المكان الرئيسي لتبادل الغازات.', 'As vias aéreas dividem-se em superiores e inferiores; os pulmões são o principal local de troca gasosa.', 'वायुमार्ग ऊपरी और निचले में बँटा है; फेफड़े गैस विनिमय का मुख्य स्थान हैं।' ) },
    ],
    /* 《慢阻肺急性加重》微课（r4） */
    stt_ac: [
      { t: '00:04', zh: '下面我们学习慢阻肺急性加重的识别与处理。', tr: T('Next, we will learn to recognise and manage acute exacerbations of COPD.', 'Als Nächstes lernen wir die Erkennung und Behandlung akuter COPD-Exazerbationen.', 'Ensuite, apprenons à reconnaître et à prendre en charge les exacerbations aiguës de la BPCO.', '次にCOPD急性増悪の認識と対応を学びます。', 'Далее учимся распознавать и лечить острое обострение ХОБЛ.', 'A continuación aprenderemos a reconocer y manejar las exacerbaciones agudas de la EPOC.', '다음으로 COPD 급성 악화의 인지와 대처를 배웁니다.', 'بعد ذلك نتعلم كيفية التعرف على التفاقم الحاد للمرض ومعالجته.', 'A seguir, vamos aprender a reconhecer e tratar as exacerbações agudas da DPOC.', 'आगे हम सीओपीडी की तीव्र वृद्धि को पहचानना और उसका प्रबंधन सीखेंगे।' ) },
      { t: '00:29', zh: '急性加重时，患者的呼吸困难会明显加重。', fix: { wrong: '呼吸困哪', right: '呼吸困难', why: '结合“急性加重”医学语境纠正' },
        tr: T('During an exacerbation, the patient\u2019s breathlessness clearly worsens.', 'Bei einer Exazerbation verschlechtert sich die Atemnot deutlich.', 'Lors d\u2019une exacerbation, la dyspnée du patient s\u2019aggrave nettement.', '急性増悪時には、患者の呼吸困難が明らかに悪化します。', 'При обострении одышка пациента заметно усиливается.', 'Durante una exacerbación, la dificultad respiratoria del paciente empeora claramente.', '급성 악화 시 환자의 호흡곤란이 뚜렷하게 악화됩니다.', 'أثناء التفاقم تشتد ضيق التنفس لدى المريض بوضوح.', 'Durante uma exacerbação, a falta de ar do paciente piora claramente.', 'तीव्र वृद्धि के दौरान रोगी की सांस की तकलीफ स्पष्ट रूप से बढ़ जाती है।' ) },
      { t: '00:57', zh: '我们要及时评估患者的氧合状态，并给予规范治疗。', tr: T('We should promptly assess the patient\u2019s oxygenation and provide standard treatment.', 'Wir müssen die Oxygenierung des Patienten rechtzeitig beurteilen und standardgerecht behandeln.', 'Nous devons évaluer rapidement l\u2019oxygénation du patient et instaurer un traitement standard.', '患者の酸素化状態を速やかに評価し、標準的な治療を行いましょう。', 'Мы должны своевременно оценить оксигенацию и назначить стандартное лечение.', 'Debemos evaluar la oxigenación del paciente y dar tratamiento estándar.', '환자의 산소화 상태를 신속히 평가하고 표준 치료를 제공합니다.', 'يجب تقييم الأكسجة بسرعة وتقديم العلاج المعياري.', 'Devemos avaliar prontamente a oxigenação e oferecer tratamento padrão.', 'हमें रोगी की ऑक्सीजन स्थिति का तुरंत मूल्यांकन और मानक उपचार करना चाहिए।' ) },
    ],
    /* 《心脏瓣膜听诊区定位》微课（r5） */
    stt_anat: [
      { t: '00:03', zh: '大家好，今天我们一起复习心脏的解剖结构。', tr: T('Hello everyone. Today we will review the anatomy of the heart.', 'Hallo zusammen. Heute wiederholen wir die Anatomie des Herzens.', 'Bonjour à tous. Aujourd\u2019hui, nous révisons l\u2019anatomie du cœur.', '皆さん、こんにちは。今日は心臓の解剖を復習します。', 'Здравствуйте. Сегодня мы повторим анатомию сердца.', 'Hola a todos. Hoy repasaremos la anatomía del corazón.', '여러분 안녕하세요. 오늘은 심장의 해부학을 복습합니다.', 'مرحبا بالجميع. اليوم نراجع تشريح القلب.', 'Olá a todos. Hoje vamos rever a anatomia do coração.', 'नमस्ते। आज हम हृदय की शारीरिक रचना दोहराएंगे।' ) },
      { t: '00:26', zh: '心脏位于胸腔中纵隔，有四个腔室。', tr: T('The heart lies in the middle mediastinum and has four chambers.', 'Das Herz liegt im mittleren Mediastinum und hat vier Kammern.', 'Le cœur se situe dans le médiastin moyen et possède quatre cavités.', '心臓は中縦隔に位置し、四つの腔を持ちます。', 'Сердце расположено в среднем средостении и имеет четыре камеры.', 'El corazón está en el mediastino medio y tiene cuatro cavidades.', '심장은 중간 종격동에 위치하며 네 개의 방이 있습니다.', 'يقع القلب في المنصف الأوسط وله أربع حجرات.', 'O coração está no mediastino médio e tem quatro câmaras.', 'हृदय मध्य मीडियास्टिनम में स्थित है और इसमें चार कक्ष होते हैं।' ) },
      { t: '00:52', zh: '四个瓣膜保证血液单向流动，防止反流。', tr: T('The four valves ensure one-way blood flow and prevent regurgitation.', 'Die vier Klappen sichern den unidirektionalen Blutfluss und verhindern Rückfluss.', 'Les quatre valves assurent un flux sanguin unidirectionnel et préviennent le reflux.', '四つの弁が血液の一方向の流れを保ち、逆流を防ぎます。', 'Четыре клапана обеспечивают однонаправленный ток крови и предотвращают регургитацию.', 'Las cuatro válvulas aseguran el flujo sanguíneo unidireccional y evitan la regurgitación.', '네 개의 판막이 혈액의 단방향 흐름을 보장하고 역류를 막습니다.', 'الصمامات الأربعة تضمن تدفق الدم باتجاه واحد وتمنع الارتداد.', 'As quatro válvulas garantem o fluxo sanguíneo unidirecional e evitam a regurgitação.', 'चार वाल्व रक्त के एकतरफा प्रवाह को सुनिश्चित करते हैं और रिवर्स प्रवाह रोकते हैं।' ) },
    ],
    /* 《胸部CT读片基础》课堂实录（r6） */
    stt_ct: [
      { t: '00:05', zh: '接下来我们来看一幅胸部CT图像。', tr: T('Next, let us look at a chest CT image.', 'Als Nächstes betrachten wir ein CT-Bild des Brustkorbs.', 'Ensuite, regardons une image de scanner thoracique.', '次に胸部CT画像を見てみましょう。', 'Далее рассмотрим КТ-изображение грудной клетки.', 'A continuación veamos una imagen de TC de tórax.', '다음으로 흉부 CT 영상을 보겠습니다.', 'بعد ذلك لننظر إلى صورة مقطعية للصدر.', 'A seguir, vejamos uma imagem de TC de tórax.', 'आगे हम छाती की सीटी छवि देखेंगे।' ) },
      { t: '00:30', zh: '先看肺窗，再看纵隔窗，观察双侧是否对称。', tr: T('First look at the lung window, then the mediastinal window, and check whether both sides are symmetrical.', 'Zuerst das Lungenfenster, dann das Mediastinalfenster; prüfen Sie die Symmetrie beider Seiten.', 'D\u2019abord le fenêtrage pulmonaire, puis le fenêtrage médiastinal ; vérifiez la symétrie.', 'まず肺野条件で見て、次に縦隔条件で、左右対称か確認します。', 'Сначала лёгочное окно, затем медиастинальное; проверьте симметричность.', 'Primero la ventana pulmonar, luego la mediastínica, y compruebe la simetría.', '먼저 폐 창을 보고 다음으로 종격동 창을 보며 양측 대칭을 확인합니다.', 'ننظر أولا إلى نافذة الرئة ثم نافذة المنصف ونتحقق من التناظر.', 'Primeiro a janela pulmonar, depois a mediastínica; verifique a simetria.', 'पहले फेफड़े की विंडो देखें, फिर मीडियास्टिनल विंडो, और दोनों तरफ सममिति जाँचें।' ) },
      { t: '01:02', zh: '最后结合临床病史，对病变作出综合判断。', tr: T('Finally, combine the clinical history to make a comprehensive judgement.', 'Zum Schluss kombinieren wir die Anamnese für eine Gesamtbeurteilung.', 'Enfin, croisons l\u2019histoire clinique pour un jugement global.', '最後に臨床歴と合わせて総合的に判断します。', 'Наконец, сопоставляем с историей болезни для общей оценки.', 'Por último, combine la historia clínica para un juicio global.', '마지막으로 임상 병력을 종합하여 종합적으로 판단합니다.', 'أخيرا نجمع التاريخ السريري لاتخاذ حكم شامل.', 'Por fim, combine a história clínica para um julgamento global.', 'अंत में नैदानिक इतिहास जोड़कर समग्र निर्णय लें।' ) },
    ],
    stt_copd: null  // 指向主 STT_SCRIPT，见下方赋值
  };
  RES_SCRIPTS.stt_copd = STT_SCRIPT;

  /* 云端各资源库班级 / 教师名册（用于“指定班级/指定教师”开放范围选择） */
  var CLASSLIST = [
    '临床医学（五年制）2022级1班', '临床医学（五年制）2022级2班', '临床医学（五年制）2022级3班',
    '临床医学（5+3一体化）2022级1班', '临床医学（5+3一体化）2022级2班',
    '儿科学2022级1班', '口腔医学2022级1班', '护理学2022级1班', '护理学2022级2班',
    '医学影像学2022级1班', '康复治疗学2022级1班', '医学检验技术2022级1班',
    '中西医临床医学2022级1班'
  ];
  var TEACHERLIST = [
    '陈立群', '周明远', '吴静', '刘建国', '王淑颖', '张远志', '李岩', '刘建平', '赵敏', '王雅琴'
  ];
  var STT_DEFAULT_BY_COURSE = { c1: 'stt_copd', c2: 'stt_anat', c3: 'stt_ct' };

  /* ---------- 课程 ---------- */
  var COURSES = [
    {
      id: 'c1', code: 'YX2026-0101', name: '内科学（呼吸系统疾病）', college: '第一临床学院',
      teacher: '陈立群', title: '主任医师 / 教授', className: '临床医学（五年制）2022级1班',
      classroom: '第一教学楼 A-302', students: 126, weeksTotal: 18, hoursTotal: 64,
      scheduleWeeks: '1-18周', weekly: '每周一 3-4节 · 2学时',
      platform: { linked: true, courseId: 'JXP-C0231', courseName: '内科学（呼吸系统）', org: '校方教学平台', syncMode: '每日自动同步', syncAt: '2026-09-09 06:30' },
      sessions: [
        { id: 's1', weekLabel: '第7周', dayTime: '周一 3-4节', weekNo: 7, classroom: '第一教学楼 A-302', className: '临床医学（五年制）2022级1班', students: 126 },
        { id: 's2', weekLabel: '第8周', dayTime: '周一 3-4节', weekNo: 8, classroom: '第一教学楼 A-302', className: '临床医学（五年制）2022级1班', students: 126 },
        { id: 's3', weekLabel: '第8周', dayTime: '周三 5-6节', weekNo: 8, classroom: '临床技能中心 305', className: '临床医学（五年制）2022级2班', students: 122 }
      ],
      progress: { taughtWeeks: 8, totalWeeks: 18 }
    },
    {
      id: 'c2', code: 'YX2026-0107', name: '系统解剖学（脉管系统）', college: '基础医学院',
      teacher: '周明远', title: '副教授', className: '护理学2022级1班',
      classroom: '形态教学楼 B-201', students: 98, weeksTotal: 12, hoursTotal: 48,
      scheduleWeeks: '1-12周', weekly: '每周二 1-2节 · 2学时',
      platform: { linked: true, courseId: 'JXP-C0366', courseName: '系统解剖学（脉管系统）', org: '校方教学平台', syncMode: '每日自动同步', syncAt: '2026-09-09 06:30' },
      sessions: [
        { id: 's1', weekLabel: '第6周', dayTime: '周二 1-2节', weekNo: 6, classroom: '形态教学楼 B-201', className: '护理学2022级1班', students: 98 }
      ],
      progress: { taughtWeeks: 6, totalWeeks: 12 }
    },
    {
      id: 'c3', code: 'YX2026-0203', name: '医学影像学（胸部影像诊断）', college: '医学影像学院',
      teacher: '吴静', title: '副主任医师', className: '医学影像学2022级1班',
      classroom: '影像教学中心 影像室2', students: 84, weeksTotal: 16, hoursTotal: 56,
      scheduleWeeks: '1-16周', weekly: '每周四 3-4节 · 2学时',
      platform: { linked: true, courseId: 'JXP-C0452', courseName: '医学影像学（胸部影像）', org: '校方教学平台', syncMode: '每日自动同步', syncAt: '2026-09-09 06:30' },
      sessions: [
        { id: 's1', weekLabel: '第7周', dayTime: '周四 3-4节', weekNo: 7, classroom: '影像教学中心 影像室2', className: '医学影像学2022级1班', students: 84 }
      ],
      progress: { taughtWeeks: 7, totalWeeks: 16 }
    },
    {
      id: 'c4', code: 'YX2026-0210', name: '外科学（普外总论）', college: '第二临床学院',
      teacher: '刘建国', title: '主任医师 / 教授', className: '临床医学（五年制）2022级2班',
      classroom: '临床技能中心 401', students: 118, weeksTotal: 16, hoursTotal: 56,
      scheduleWeeks: '1-16周', weekly: '每周五 1-2节 · 2学时',
      platform: { linked: true, courseId: 'JXP-C0618', courseName: '外科学（普外总论）', org: '校方教学平台', syncMode: '每日自动同步', syncAt: '2026-09-09 06:30' },
      sessions: [
        { id: 's1', weekLabel: '第7周', dayTime: '周五 1-2节', weekNo: 7, classroom: '临床技能中心 401', className: '临床医学（五年制）2022级2班', students: 118 },
        { id: 's2', weekLabel: '第8周', dayTime: '周五 3-4节', weekNo: 8, classroom: '外科示教室 206', className: '临床医学（五年制）2022级1班', students: 121 }
      ],
      progress: { taughtWeeks: 7, totalWeeks: 16 }
    },
    {
      id: 'c5', code: 'YX2026-0312', name: '儿科学（呼吸系统常见病）', college: '儿科学院',
      teacher: '王淑颖', title: '主任医师 / 副教授', className: '儿科学2022级1班',
      classroom: '儿童医院教学楼 302', students: 72, weeksTotal: 14, hoursTotal: 52,
      scheduleWeeks: '1-14周', weekly: '每周三 5-6节 · 2学时',
      platform: { linked: true, courseId: 'JXP-C0741', courseName: '儿科学（呼吸系统常见病）', org: '校方教学平台', syncMode: '每日自动同步', syncAt: '2026-09-09 06:30' },
      sessions: [
        { id: 's1', weekLabel: '第8周', dayTime: '周三 5-6节', weekNo: 8, classroom: '儿童医院教学楼 302', className: '儿科学2022级1班', students: 72 }
      ],
      progress: { taughtWeeks: 8, totalWeeks: 14 }
    }
  ];

  /* ---------- 大纲知识点（courseId -> 章节树）----------
     level: 掌握/熟悉/了解；reqH 大纲要求学时；taughtH 已覆盖学时；week 计划讲授周；
     acts: 关联课堂活动；stage: 实验/理论/案例 由 plan 覆盖  */
  var OUTLINES = {
    c1: {
      focusNote: '重点章节：慢性气道疾病（COPD / 哮喘）',
      chapters: [
        { ch: '第一章 呼吸系统总论', chHours: 8, kps: [
          { id: 'k1', name: '呼吸系统的结构与功能、防御机制', level: '掌握', reqH: 2, taughtH: 2, week: 1, acts: ['a01', 'a02'], lastAct: '2026-07-20' },
          { id: 'k2', name: '呼吸系统疾病常见症状与体征', level: '掌握', reqH: 2, taughtH: 2, week: 1, acts: ['a03'], lastAct: '2026-07-21' },
          { id: 'k3', name: '胸部X线与CT阅片基础', level: '熟悉', reqH: 2, taughtH: 2, week: 2, acts: ['a04'], lastAct: '2026-07-27' },
          { id: 'k4', name: '肺功能检查的基本原理与应用', level: '掌握', reqH: 2, taughtH: 2, week: 2, acts: ['a05'], lastAct: '2026-07-28' }
        ] },
        { ch: '第二章 气道与肺部感染性疾病', chHours: 12, kps: [
          { id: 'k5', name: '急性上呼吸道感染与急性支气管炎', level: '掌握', reqH: 2, taughtH: 2, week: 3, acts: ['a06'], lastAct: '2026-08-03' },
          { id: 'k6', name: '肺炎的病原学与诊断流程', level: '掌握', reqH: 3, taughtH: 3, week: 4, acts: ['a07', 'a08'], lastAct: '2026-08-10' },
          { id: 'k7', name: '社区获得性肺炎与医院获得性肺炎的诊治', level: '掌握', reqH: 3, taughtH: 3, week: 4, acts: ['a09'], lastAct: '2026-08-11' },
          { id: 'k8', name: '肺结核的临床表现、诊断与规范治疗', level: '熟悉', reqH: 2, taughtH: 2, week: 5, acts: ['a10'], lastAct: '2026-08-17' },
          { id: 'k9', name: '抗菌药物合理应用原则', level: '熟悉', reqH: 2, taughtH: 2, week: 5, acts: ['a11'], lastAct: '2026-08-18' }
        ] },
        { ch: '第三章 慢性气道疾病（重点章节）', chHours: 16, kps: [
          { id: 'k10', name: 'COPD的病因、发病机制与病理改变', level: '掌握', reqH: 2, taughtH: 2, week: 6, acts: ['a12'], lastAct: '2026-08-24' },
          { id: 'k11', name: 'COPD的诊断与严重程度评估', level: '掌握', reqH: 2, taughtH: 2, week: 6, acts: ['a13'], lastAct: '2026-08-25' },
          { id: 'k12', name: 'COPD稳定期治疗与管理', level: '掌握', reqH: 3, taughtH: 3, week: 7, acts: ['a14'], lastAct: '2026-09-01' },
          { id: 'k13', name: 'COPD急性加重的评估与处理', level: '掌握', reqH: 3, taughtH: 2, week: 8, acts: ['a15', 'a16'], lastAct: '2026-09-09' },
          { id: 'k14', name: '支气管哮喘的病因与发病机制', level: '掌握', reqH: 3, taughtH: 0, week: 9, acts: [], lastAct: '' },
          { id: 'k15', name: '支气管哮喘的诊断与分级治疗', level: '掌握', reqH: 3, taughtH: 0, week: 9, acts: [], lastAct: '' }
        ] },
        { ch: '第四章 肺部肿瘤与胸膜疾病', chHours: 10, kps: [
          { id: 'k16', name: '原发性支气管肺癌的早期筛查', level: '熟悉', reqH: 2, taughtH: 0, week: 10, acts: [], lastAct: '' },
          { id: 'k17', name: '肺癌的病理分型与TNM分期', level: '了解', reqH: 2, taughtH: 0, week: 10, acts: [], lastAct: '' },
          { id: 'k18', name: '胸腔积液与恶性胸膜疾病的诊治', level: '熟悉', reqH: 2, taughtH: 0, week: 11, acts: [], lastAct: '' },
          { id: 'k19', name: '呼吸系统疾病诊断思路综合训练', level: '掌握', reqH: 4, taughtH: 0, week: 12, acts: [], lastAct: '' }
        ] }
      ]
    },
    c2: {
      focusNote: '以“脉管系统”为主线组织教学',
      chapters: [
        { ch: '第一章 心脏', chHours: 10, kps: [
          { id: 'm1', name: '心的位置、外形与体表投影', level: '掌握', reqH: 2, taughtH: 2, week: 1, acts: ['b01'], lastAct: '2026-07-21' },
          { id: 'm2', name: '心腔结构与心传导系统', level: '掌握', reqH: 3, taughtH: 3, week: 2, acts: ['b02'], lastAct: '2026-07-28' },
          { id: 'm3', name: '冠状动脉的分布与意义', level: '熟悉', reqH: 2, taughtH: 2, week: 3, acts: ['b03'], lastAct: '2026-08-04' },
          { id: 'm4', name: '心脏瓣膜与听诊区体表投影', level: '掌握', reqH: 3, taughtH: 3, week: 4, acts: ['b04'], lastAct: '2026-08-11' }
        ] },
        { ch: '第二章 血管系统', chHours: 8, kps: [
          { id: 'm5', name: '体循环与肺循环的路径', level: '掌握', reqH: 3, taughtH: 3, week: 5, acts: ['b05'], lastAct: '2026-08-18' },
          { id: 'm6', name: '上肢动脉的走行与体表标志', level: '了解', reqH: 2, taughtH: 1, week: 5, acts: ['b06'], lastAct: '2026-08-18' },
          { id: 'm7', name: '下肢深静脉与浅静脉', level: '熟悉', reqH: 2, taughtH: 2, week: 6, acts: ['b07'], lastAct: '2026-08-25' }
        ] }
      ]
    },
    c3: {
      focusNote: '强调影像征象与临床结合',
      chapters: [
        { ch: '第一章 CT成像基础', chHours: 8, kps: [
          { id: 'x1', name: 'CT成像原理与窗宽窗位', level: '掌握', reqH: 3, taughtH: 3, week: 3, acts: ['x01'], lastAct: '2026-08-05' },
          { id: 'x2', name: '胸部CT扫描规范与辐射防护', level: '熟悉', reqH: 2, taughtH: 2, week: 4, acts: ['x02'], lastAct: '2026-08-12' }
        ] },
        { ch: '第二章 胸部常见疾病影像', chHours: 14, kps: [
          { id: 'x3', name: '肺炎的影像表现与动态演变', level: '掌握', reqH: 3, taughtH: 3, week: 5, acts: ['x03'], lastAct: '2026-08-19' },
          { id: 'x4', name: '孤立性肺结节的读片思路', level: '掌握', reqH: 3, taughtH: 2, week: 5, acts: ['x04'], lastAct: '2026-08-20' },
          { id: 'x5', name: '纵隔分区与常见占位病变', level: '熟悉', reqH: 2, taughtH: 2, week: 6, acts: ['x05'], lastAct: '2026-08-26' },
          { id: 'x6', name: '间质性肺疾病的HRCT表现', level: '了解', reqH: 2, taughtH: 0, week: 8, acts: [], lastAct: '' }
        ] },
        { ch: '第三章 介入与前沿', chHours: 6, kps: [
          { id: 'x7', name: 'CT引导下经皮肺穿刺活检', level: '了解', reqH: 2, taughtH: 0, week: 10, acts: [], lastAct: '' },
          { id: 'x8', name: '影像组学与AI辅助诊断', level: '了解', reqH: 2, taughtH: 0, week: 11, acts: [], lastAct: '' }
        ] }
      ]
    },
    c4: {
      focusNote: '重点章节：常见普外疾病的诊疗',
      chapters: [
        { ch: '第一章 普外基础与围手术期', chHours: 12, kps: [
          { id: 'g1', name: '无菌术与外科基本操作', level: '掌握', reqH: 3, taughtH: 3, week: 1, acts: ['c41'], lastAct: '2026-07-24' },
          { id: 'g2', name: '围手术期处理与术前评估', level: '掌握', reqH: 3, taughtH: 3, week: 2, acts: ['c42'], lastAct: '2026-07-31' },
          { id: 'g3', name: '外科病人的体液与酸碱平衡', level: '掌握', reqH: 4, taughtH: 3, week: 3, acts: ['c43'], lastAct: '2026-08-07' },
          { id: 'g4', name: '输血与成分输血', level: '熟悉', reqH: 2, taughtH: 2, week: 4, acts: ['c44'], lastAct: '2026-08-14' }
        ] },
        { ch: '第二章 常见普外疾病', chHours: 16, kps: [
          { id: 'g5', name: '外科感染与抗菌药物策略', level: '掌握', reqH: 3, taughtH: 3, week: 5, acts: ['c45'], lastAct: '2026-08-21' },
          { id: 'g6', name: '甲状腺结节的评估与处理', level: '掌握', reqH: 3, taughtH: 3, week: 6, acts: ['c46'], lastAct: '2026-08-28' },
          { id: 'g7', name: '腹外疝的诊断与治疗', level: '掌握', reqH: 3, taughtH: 0, week: 9, acts: [], lastAct: '' },
          { id: 'g8', name: '急腹症的鉴别诊断思路', level: '掌握', reqH: 4, taughtH: 0, week: 10, acts: [], lastAct: '' },
          { id: 'g9', name: '外科营养支持基础', level: '熟悉', reqH: 2, taughtH: 0, week: 11, acts: [], lastAct: '' }
        ] }
      ]
    },
    c5: {
      focusNote: '结合儿童解剖生理特点讲授',
      chapters: [
        { ch: '第一章 儿科学基础与呼吸解剖特点', chHours: 8, kps: [
          { id: 'p1', name: '小儿呼吸道解剖与免疫特点', level: '掌握', reqH: 2, taughtH: 2, week: 1, acts: ['c51'], lastAct: '2026-07-22' },
          { id: 'p2', name: '婴幼儿喂养与生长发育评估', level: '熟悉', reqH: 2, taughtH: 2, week: 2, acts: ['c52'], lastAct: '2026-07-29' },
          { id: 'p3', name: '小儿肺炎的病原学特点', level: '掌握', reqH: 3, taughtH: 3, week: 3, acts: ['c53'], lastAct: '2026-08-05' }
        ] },
        { ch: '第二章 小儿呼吸道常见病', chHours: 12, kps: [
          { id: 'p4', name: '支气管肺炎的诊治', level: '掌握', reqH: 3, taughtH: 3, week: 4, acts: ['c54'], lastAct: '2026-08-12' },
          { id: 'p5', name: '婴幼儿喘息与哮喘管理', level: '掌握', reqH: 3, taughtH: 2, week: 5, acts: ['c55'], lastAct: '2026-08-19' },
          { id: 'p6', name: '急性喉炎与气道梗阻', level: '熟悉', reqH: 2, taughtH: 2, week: 6, acts: ['c56'], lastAct: '2026-08-26' }
        ] },
        { ch: '第三章 指南更新与临床实践', chHours: 8, kps: [
          { id: 'p7', name: '儿童社区获得性肺炎诊疗指南', level: '掌握', reqH: 3, taughtH: 0, week: 9, acts: [], lastAct: '' },
          { id: 'p8', name: '儿童呼吸道感染抗菌药物规范', level: '熟悉', reqH: 2, taughtH: 0, week: 10, acts: [], lastAct: '' },
          { id: 'p9', name: '儿科呼吸道疾病随访与家长沟通', level: '了解', reqH: 2, taughtH: 0, week: 11, acts: [], lastAct: '' }
        ] }
      ]
    }
  };

  /* ---------- 课堂活动 ---------- */
  var ACTIVITIES = [
    { id: 'a01', courseId: 'c1', kpId: 'k1', chapter: '第一章 呼吸系统总论', type: '随堂练习', title: '呼吸系统解剖结构与防御功能自测', source: '教学平台同步', week: 1, pubAt: '2026-07-20 09:02', status: '已结束', join: 126, total: 126, durMin: 8, avg: 88.4 },
    { id: 'a02', courseId: 'c1', kpId: 'k1', chapter: '第一章 呼吸系统总论', type: '即时测验', title: '课堂小测：呼吸生理基础（10题）', source: '教学平台同步', week: 1, pubAt: '2026-07-20 10:40', status: '已结束', join: 126, total: 126, durMin: 10, avg: 82.1 },
    { id: 'a03', courseId: 'c1', kpId: 'k2', chapter: '第一章 呼吸系统总论', type: '主题讨论', title: '病例导入：慢性咳嗽的鉴别诊断思路', source: '教学平台同步', week: 1, pubAt: '2026-07-21 14:05', status: '已结束', join: 119, total: 126, durMin: 15, avg: 91.0 },
    { id: 'a04', courseId: 'c1', kpId: 'k3', chapter: '第一章 呼吸系统总论', type: '随堂练习', title: '胸部X线阅片基础训练（10幅）', source: '教学平台同步', week: 2, pubAt: '2026-07-27 09:10', status: '已结束', join: 126, total: 126, durMin: 12, avg: 90.2 },
    { id: 'a05', courseId: 'c1', kpId: 'k4', chapter: '第一章 呼吸系统总论', type: '随堂练习', title: '肺功能报告解读专项练习', source: '教学平台同步', week: 2, pubAt: '2026-07-28 11:00', status: '已结束', join: 124, total: 126, durMin: 10, avg: 86.7 },
    { id: 'a06', courseId: 'c1', kpId: 'k5', chapter: '第二章 气道与肺部感染性疾病', type: '随堂练习', title: '上呼吸道感染诊疗要点自测', source: '本平台发布', week: 3, pubAt: '2026-08-03 09:15', status: '已结束', join: 122, total: 126, durMin: 8, avg: 89.5 },
    { id: 'a07', courseId: 'c1', kpId: 'k6', chapter: '第二章 气道与肺部感染性疾病', type: '分组任务', title: '肺炎病例分组诊疗方案设计', source: '本平台发布', week: 4, pubAt: '2026-08-10 09:05', status: '已结束', join: 126, total: 126, durMin: 25, avg: 92.3 },
    { id: 'a08', courseId: 'c1', kpId: 'k6', chapter: '第二章 气道与肺部感染性疾病', type: '随堂练习', title: '肺炎病原学判断随堂练', source: '教学平台同步', week: 4, pubAt: '2026-08-10 10:30', status: '已结束', join: 125, total: 126, durMin: 9, avg: 84.0 },
    { id: 'a09', courseId: 'c1', kpId: 'k7', chapter: '第二章 气道与肺部感染性疾病', type: '主题讨论', title: '社区获得性肺炎经验性抗感染方案讨论', source: '教学平台同步', week: 4, pubAt: '2026-08-11 15:20', status: '已结束', join: 116, total: 126, durMin: 18, avg: 88.8 },
    { id: 'a10', courseId: 'c1', kpId: 'k8', chapter: '第二章 气道与肺部感染性疾病', type: '即时测验', title: '肺结核诊断要点快测', source: '教学平台同步', week: 5, pubAt: '2026-08-17 09:40', status: '已结束', join: 123, total: 126, durMin: 8, avg: 85.2 },
    { id: 'a11', courseId: 'c1', kpId: 'k9', chapter: '第二章 气道与肺部感染性疾病', type: '随堂练习', title: '抗菌药物分级管理情境题', source: '教学平台同步', week: 5, pubAt: '2026-08-18 10:05', status: '已结束', join: 121, total: 126, durMin: 11, avg: 87.6 },
    { id: 'a12', courseId: 'c1', kpId: 'k10', chapter: '第三章 慢性气道疾病', type: '随堂练习', title: 'COPD病因与机制课前测', source: '教学平台同步', week: 6, pubAt: '2026-08-24 09:10', status: '已结束', join: 126, total: 126, durMin: 8, avg: 90.5 },
    { id: 'a13', courseId: 'c1', kpId: 'k11', chapter: '第三章 慢性气道疾病', type: '随堂练习', title: 'COPD诊断与GOLD分组练习', source: '教学平台同步', week: 6, pubAt: '2026-08-25 11:20', status: '已结束', join: 124, total: 126, durMin: 12, avg: 83.9 },
    { id: 'a14', courseId: 'c1', kpId: 'k12', chapter: '第三章 慢性气道疾病', type: '主题讨论', title: '稳定期治疗：阶梯方案辩论', source: '本平台发布', week: 7, pubAt: '2026-09-01 09:00', status: '已结束', join: 120, total: 126, durMin: 16, avg: 90.7 },
    { id: 'a15', courseId: 'c1', kpId: 'k13', chapter: '第三章 慢性气道疾病', type: '随堂练习', title: '急性加重评估流程演练（情景题）', source: '本平台发布', week: 8, pubAt: '2026-09-07 09:10', status: '已结束', join: 118, total: 126, durMin: 12, avg: 86.1 },
    { id: 'a16', courseId: 'c1', kpId: 'k13', chapter: '第三章 慢性气道疾病', type: '随堂练习', title: '急性加重情景案例：现场作答中', source: '本平台发布', week: 8, pubAt: '2026-09-09 09:20', status: '进行中', join: 86, total: 126, durMin: 10, avg: 0 },
    { id: 'b01', courseId: 'c2', kpId: 'm1', chapter: '第一章 心脏', type: '课堂签到', title: '课堂签到：心的体表投影', source: '教学平台同步', week: 1, pubAt: '2026-07-21 08:02', status: '已结束', join: 98, total: 98, durMin: 2, avg: 100 },
    { id: 'b02', courseId: 'c2', kpId: 'm2', chapter: '第一章 心脏', type: '即时测验', title: '心传导系统路径小测', source: '教学平台同步', week: 2, pubAt: '2026-07-28 08:05', status: '已结束', join: 97, total: 98, durMin: 8, avg: 88.0 },
    { id: 'b03', courseId: 'c2', kpId: 'm3', chapter: '第一章 心脏', type: '分组任务', title: '心肌梗死与冠状动脉供血区分析', source: '教学平台同步', week: 3, pubAt: '2026-08-04 08:10', status: '已结束', join: 98, total: 98, durMin: 20, avg: 91.4 },
    { id: 'b04', courseId: 'c2', kpId: 'm4', chapter: '第一章 心脏', type: '随堂练习', title: '心脏瓣膜听诊区定位练习', source: '教学平台同步', week: 4, pubAt: '2026-08-11 08:00', status: '已结束', join: 96, total: 98, durMin: 10, avg: 87.7 },
    { id: 'b05', courseId: 'c2', kpId: 'm5', chapter: '第二章 血管系统', type: '随堂练习', title: '体循环与肺循环路径自测', source: '教学平台同步', week: 5, pubAt: '2026-08-18 08:02', status: '已结束', join: 95, total: 98, durMin: 9, avg: 92.0 },
    { id: 'b06', courseId: 'c2', kpId: 'm6', chapter: '第二章 血管系统', type: '随堂练习', title: '上肢动脉体表标志速记', source: '教学平台同步', week: 5, pubAt: '2026-08-18 09:30', status: '已结束', join: 93, total: 98, durMin: 7, avg: 81.2 },
    { id: 'b07', courseId: 'c2', kpId: 'm7', chapter: '第二章 血管系统', type: '课堂签到', title: '课堂签到：下肢静脉', source: '教学平台同步', week: 6, pubAt: '2026-08-25 08:03', status: '已结束', join: 98, total: 98, durMin: 2, avg: 100 },
    { id: 'x01', courseId: 'c3', kpId: 'x1', chapter: '第一章 CT成像基础', type: '随堂练习', title: '窗宽窗位调节随堂练', source: '教学平台同步', week: 3, pubAt: '2026-08-05 10:02', status: '已结束', join: 84, total: 84, durMin: 10, avg: 89.1 },
    { id: 'x02', courseId: 'c3', kpId: 'x2', chapter: '第一章 CT成像基础', type: '主题讨论', title: '低剂量胸部CT与防护讨论', source: '教学平台同步', week: 4, pubAt: '2026-08-12 10:00', status: '已结束', join: 80, total: 84, durMin: 14, avg: 90.0 },
    { id: 'x03', courseId: 'c3', kpId: 'x3', chapter: '第二章 胸部常见疾病影像', type: '即时测验', title: '肺炎影像表现快测', source: '教学平台同步', week: 5, pubAt: '2026-08-19 10:05', status: '已结束', join: 83, total: 84, durMin: 8, avg: 84.6 },
    { id: 'x04', courseId: 'c3', kpId: 'x4', chapter: '第二章 胸部常见疾病影像', type: '随堂练习', title: '孤立性肺结节读片思路训练', source: '本平台发布', week: 5, pubAt: '2026-08-20 10:10', status: '已结束', join: 78, total: 84, durMin: 12, avg: 82.3 },
    { id: 'x05', courseId: 'c3', kpId: 'x5', chapter: '第二章 胸部常见疾病影像', type: '随堂练习', title: '纵隔分区常见病变自测', source: '教学平台同步', week: 6, pubAt: '2026-08-26 10:02', status: '已结束', join: 82, total: 84, durMin: 9, avg: 88.9 },
    { id: 'c41', courseId: 'c4', kpId: 'g1', chapter: '第一章 普外基础与围手术期', type: '课堂签到', title: '课堂签到：外科无菌区设置', source: '教学平台同步', week: 1, pubAt: '2026-07-24 08:02', status: '已结束', join: 118, total: 118, durMin: 2, avg: 100 },
    { id: 'c42', courseId: 'c4', kpId: 'g2', chapter: '第一章 普外基础与围手术期', type: '随堂练习', title: '术前评估风险分级练习', source: '教学平台同步', week: 2, pubAt: '2026-07-31 08:00', status: '已结束', join: 116, total: 118, durMin: 10, avg: 87.2 },
    { id: 'c43', courseId: 'c4', kpId: 'g3', chapter: '第一章 普外基础与围手术期', type: '主题讨论', title: '体液失衡补液方案讨论', source: '教学平台同步', week: 3, pubAt: '2026-08-07 08:05', status: '已结束', join: 110, total: 118, durMin: 15, avg: 89.5 },
    { id: 'c44', courseId: 'c4', kpId: 'g4', chapter: '第一章 普外基础与围手术期', type: '即时测验', title: '输血指征与不良反应快测', source: '教学平台同步', week: 4, pubAt: '2026-08-14 08:01', status: '已结束', join: 115, total: 118, durMin: 8, avg: 84.6 },
    { id: 'c45', courseId: 'c4', kpId: 'g5', chapter: '第二章 常见普外疾病', type: '随堂练习', title: '外科感染经验性用药练习', source: '教学平台同步', week: 5, pubAt: '2026-08-21 08:02', status: '已结束', join: 114, total: 118, durMin: 10, avg: 86.8 },
    { id: 'c46', courseId: 'c4', kpId: 'g6', chapter: '第二章 常见普外疾病', type: '分组任务', title: '甲状腺结节病例分析（小组）', source: '本平台发布', week: 6, pubAt: '2026-08-28 08:10', status: '已结束', join: 118, total: 118, durMin: 22, avg: 91.0 },
    { id: 'c51', courseId: 'c5', kpId: 'p1', chapter: '第一章 儿科学基础与呼吸解剖特点', type: '随堂练习', title: '儿童呼吸解剖特点自测', source: '教学平台同步', week: 1, pubAt: '2026-07-22 15:05', status: '已结束', join: 72, total: 72, durMin: 9, avg: 90.1 },
    { id: 'c52', courseId: 'c5', kpId: 'p2', chapter: '第一章 儿科学基础与呼吸解剖特点', type: '课堂签到', title: '课堂签到：生长发育曲线', source: '教学平台同步', week: 2, pubAt: '2026-07-29 15:02', status: '已结束', join: 72, total: 72, durMin: 2, avg: 100 },
    { id: 'c53', courseId: 'c5', kpId: 'p3', chapter: '第一章 儿科学基础与呼吸解剖特点', type: '随堂练习', title: '小儿肺炎病原学判读练习', source: '教学平台同步', week: 3, pubAt: '2026-08-05 15:03', status: '已结束', join: 70, total: 72, durMin: 10, avg: 88.4 },
    { id: 'c54', courseId: 'c5', kpId: 'p4', chapter: '第二章 小儿呼吸道常见病', type: '即时测验', title: '支气管肺炎诊断标准快测', source: '教学平台同步', week: 4, pubAt: '2026-08-12 15:00', status: '已结束', join: 71, total: 72, durMin: 8, avg: 85.7 },
    { id: 'c55', courseId: 'c5', kpId: 'p5', chapter: '第二章 小儿呼吸道常见病', type: '主题讨论', title: '婴幼儿喘息：哮喘还是感染？', source: '教学平台同步', week: 5, pubAt: '2026-08-19 15:01', status: '已结束', join: 68, total: 72, durMin: 14, avg: 90.9 },
    { id: 'c56', courseId: 'c5', kpId: 'p6', chapter: '第二章 小儿呼吸道常见病', type: '随堂练习', title: '急性喉炎严重度判断练习', source: '教学平台同步', week: 6, pubAt: '2026-08-26 15:00', status: '已结束', join: 69, total: 72, durMin: 9, avg: 87.3 }
  ];

  /* 教学平台侧待同步活动（点击“立即同步”后并入活动列表） */
  var SYNC_POOL = [
    { type: '随堂练习', title: 'COPD稳定期随访管理自测', courseId: 'c1', kpId: 'k12', chapter: '第三章 慢性气道疾病', week: 8, durMin: 8, total: 126 },
    { type: '主题讨论', title: '肺康复训练方案分享讨论', courseId: 'c1', kpId: 'k13', chapter: '第三章 慢性气道疾病', week: 8, durMin: 15, total: 126 },
    { type: '课堂签到', title: '课堂签到：间质性肺病章节', courseId: 'c3', kpId: 'x6', chapter: '第二章 胸部常见疾病影像', week: 8, durMin: 2, total: 84 }
  ];

  /* ---------- 直录播资源 ---------- */
  var SLIDE_SETS = {
    c1_gen: [
      { title: '呼吸系统总论 · 第1讲', sub: ['授课教师：陈立群 · 第一临床学院', '临床医学（五年制）2022级1班'], items: ['课程目标：掌握呼吸系统结构与功能', '本次课重点：防御机制与症状学基础', '临床衔接：呼吸系统疾病谱'] },
      { title: '呼吸系统防御机制', sub: ['结构防御 · 免疫防御 · 神经调节'], items: ['气道纤毛-黏液转运系统', '肺泡巨噬细胞与表面活性物质', '咳嗽反射的临床意义'] },
      { title: '常见症状与体征', sub: ['症状学是临床思维起点'], items: ['咳嗽、咳痰、咯血的鉴别', '呼吸困难的分级评估', '发绀与杵状指的临床提示'] },
      { title: '课堂小结与思考', sub: ['下节课：胸部影像基础'], items: ['回顾：三大防御层次', '思考：为什么慢阻肺患者易反复感染？', '预习：胸部X线与CT阅片基础'] }
    ],
    c1_copd: [
      { title: '慢性阻塞性肺疾病 · 诊断与评估', sub: ['授课教师：陈立群 · 第8周'], items: ['定义：持续气流受限，不可逆进展', '危险因素：吸烟是首要因素', '病理生理：小气道病变与肺实质破坏'] },
      { title: '诊断与严重程度评估', sub: ['肺功能是金标准'], items: ['吸入支气管舒张剂后 FEV1/FVC < 0.7', 'GOLD 1-4 级气流受限分级', '症状评估：CAT / mMRC 量表'] },
      { title: '稳定期管理阶梯', sub: ['评估-治疗-再评估'], items: ['核心用药：长效支气管舒张剂（LAMA/LABA）', 'ICS 适用人群的判断', '非药物：戒烟、疫苗、肺康复'] },
      { title: '急性加重的评估与处理', sub: ['早识别 · 早干预'], items: ['加重诱因：感染与空气污染', '病情分级与处理路径', '氧疗目标与无创通气指征'] }
    ],
    c1_case: [
      { title: '病例导入', sub: ['67岁男性，吸烟40余年'], items: ['主诉：反复咳嗽咳痰10年，加重伴气促3天', '查体：桶状胸，双肺哮鸣音', '问题：初步诊断考虑什么？'] },
      { title: '辅助检查解读', sub: ['肺功能 + 血气分析'], items: ['FEV1/FVC = 0.52，FEV1占预计值48%', '动脉血气：PaO2 55mmHg', '诊断：COPD急性加重（GOLD 3级）'] },
      { title: '治疗决策', sub: ['住院治疗要点'], items: ['控制性氧疗（目标 88-92%）', '雾化短效支气管舒张剂 + 全身糖皮质激素', '经验性抗感染与排痰管理'] },
      { title: '思考与讨论', sub: ['出院后随访计划'], items: ['如何评估本次急性加重诱因？', '长期家庭氧疗与肺康复如何落实？', '下一次门诊复诊的要点'] }
    ],
    c2: [
      { title: '心的位置与体表投影', sub: ['系统解剖学 · 脉管系统'], items: ['心的位置：纵隔内、中纵隔', '体表投影与听诊区', '心的毗邻关系'] },
      { title: '心腔结构与心传导系统', sub: ['重点：传导路径'], items: ['窦房结→房室结→房室束→浦肯野纤维', '血液在四腔的流动方向', '瓣膜开闭与心动周期'] },
      { title: '冠状动脉分布', sub: ['左右冠状动脉供血区'], items: ['左前降支：室间隔前2/3', '回旋支：左室侧壁', '右冠状动脉：窦房结/房室结动脉'] },
      { title: '听诊区体表投影', sub: ['结合临床实践'], items: ['二尖瓣区：心尖部', '主动脉瓣区：胸骨右缘第2肋间', '三尖瓣区：胸骨左缘第4-5肋间'] }
    ],
    c3: [
      { title: '胸部CT成像基础', sub: ['窗宽窗位 · 解剖辨认'], items: ['肺窗：观察肺纹理与病灶', '纵隔窗：评估血管与淋巴结', '窗宽窗位调节操作演示'] },
      { title: '常见征象识别', sub: ['以征象推病变'], items: ['磨玻璃影与实变影', '结节/肿块与分叶毛刺', '胸腔积液与胸膜增厚'] },
      { title: '读片思路', sub: ['系统化读片流程'], items: ['先肺野后纵隔，先定位后定性', '结合临床资料综合判断', '随访影像对比的意义'] }
    ],
    c4: [
      { title: '外科学（普外总论）· 无菌术与围手术期', sub: ['授课教师：刘建国 · 第二临床学院'], items: ['外科无菌原则与手术室规范', '围手术期评估与准备', '术前谈话与知情同意'] },
      { title: '体液与酸碱平衡', sub: ['重点：补液方案设计'], items: ['细胞外液与电解质分布', '酸碱失衡的判定', '常用补液方案与监测'] },
      { title: '甲状腺结节评估', sub: ['B超 / 穿刺 / 手术指征'], items: ['TI-RADS分级解读', '细针穿刺的适应证', '手术方式选择与并发症'] },
      { title: '急腹症鉴别', sub: ['先定位、再定性'], items: ['病史与查体要点', '影像学检查路径', '剖腹探查决策'] }
    ],
    c5: [
      { title: '小儿呼吸道解剖生理特点', sub: ['儿童医院 · 儿科学院'], items: ['小儿气道狭长易梗阻', '免疫系统发育不成熟', '呼吸频率与肺功能差异'] },
      { title: '支气管肺炎诊治', sub: ['重点：病情评估'], items: ['临床表现与肺部体征', '病原学与影像检查', '住院指征与治疗原则'] },
      { title: '婴幼儿喘息鉴别', sub: ['哮喘 vs 感染后喘息'], items: ['喘息病因谱', '支气管舒张试验', '家庭管理计划'] }
    ]
  };

  var RESOURCES = [
    { id: 'r1', courseId: 'c1', kind: '课堂实录', title: '《呼吸系统总论》第1讲课堂实录', date: '2026-07-20', durSec: 2712, size: '1.24 GB', teacher: '陈立群', slides: 'c1_gen', stt: 'stt_gen', permission: { scope: '校内公开', allow: ['在线回看', '下载'] }, synced: { done: true, at: '2026-07-20 20:10', target: '教学平台 · 资源库/内科学（呼吸系统）/课堂实录' }, clipFrom: '' },
    { id: 'r2', courseId: 'c1', kind: '课堂实录', title: '《COPD诊断与评估》第7周课堂实录', date: '2026-08-31', durSec: 2405, size: '1.08 GB', teacher: '陈立群', slides: 'c1_copd', stt: 'stt_copd', permission: { scope: '课程班级', allow: ['在线回看'] }, synced: { done: true, at: '2026-08-31 19:02', target: '教学平台 · 资源库/内科学（呼吸系统）/课堂实录' }, clipFrom: '' },
    { id: 'r3', courseId: 'c1', kind: '直播回放', title: '名师示范课：呼吸病学进展（直播回放）', date: '2026-07-06', durSec: 3490, size: '1.56 GB', teacher: '张远志', slides: 'c1_gen', stt: 'stt_copd', permission: { scope: '校内公开', allow: ['在线回看', '下载'] }, synced: { done: true, at: '2026-07-07 09:00', target: '教学平台 · 资源库/名师课堂' }, clipFrom: '' },
    { id: 'r4', courseId: 'c1', kind: '微课', title: '慢阻肺急性加重：识别与处理（微课）', date: '2026-09-02', durSec: 765, size: '286 MB', teacher: '陈立群', slides: 'c1_case', stt: 'stt_ac', permission: { scope: '指定班级', allow: ['在线回看'], classes: ['临床医学（五年制）2022级1班', '临床医学（五年制）2022级2班'] }, synced: { done: false, at: '', target: '' }, clipFrom: '' },
    { id: 'r5', courseId: 'c2', kind: '微课', title: '心脏瓣膜听诊区定位（微课）', date: '2026-08-02', durSec: 620, size: '212 MB', teacher: '周明远', slides: 'c2', stt: 'stt_anat', permission: { scope: '校内公开', allow: ['在线回看', '下载'] }, synced: { done: false, at: '', target: '' }, clipFrom: '' },
    { id: 'r6', courseId: 'c3', kind: '课堂实录', title: '《胸部CT读片基础》课堂实录', date: '2026-08-06', durSec: 2302, size: '980 MB', teacher: '吴静', slides: 'c3', stt: 'stt_ct', permission: { scope: '课程班级', allow: ['在线回看'] }, synced: { done: true, at: '2026-08-06 21:00', target: '教学平台 · 资源库/医学影像学（胸部影像）/课堂实录' }, clipFrom: '' },
    { id: 'r7', courseId: 'c1', kind: '剪辑片段', title: '《COPD诊疗要点精剪》（源自第7周实录）', date: '2026-09-03', durSec: 560, size: '96 MB', teacher: '陈立群', slides: 'c1_copd', stt: 'stt_copd', permission: { scope: '课程班级', allow: ['在线回看'] }, synced: { done: false, at: '', target: '' }, clipFrom: 'r2' },
    { id: 'r8', courseId: 'c4', kind: '课堂实录', title: '《无菌术与围手术期》课堂实录', date: '2026-07-31', durSec: 2105, size: '1.02 GB', teacher: '刘建国', slides: 'c4', permission: { scope: '课程班级', allow: ['在线回看'] }, synced: { done: true, at: '2026-07-31 20:00', target: '教学平台 · 资源库/外科学（普外总论）/课堂实录' }, clipFrom: '' },
    { id: 'r9', courseId: 'c5', kind: '课堂实录', title: '《小儿呼吸道解剖与支气管肺炎》课堂实录', date: '2026-08-12', durSec: 1988, size: '940 MB', teacher: '王淑颖', slides: 'c5', permission: { scope: '课程班级', allow: ['在线回看'] }, synced: { done: false, at: '', target: '' }, clipFrom: '' }
  ];

  /* ---------- 云端资源库 ---------- */
  var CLOUD_FILES = [
    { id: 'f1', name: '内科学（呼吸系统）第8讲课件', ext: 'PPT', cat: '课件', size: '18.6 MB', date: '2026-09-08', owner: '陈立群', folder: '我的文件', scope: '课程班级', platformSynced: true },
    { id: 'f2', name: '《COPD诊疗指南（2025版）》要点解读', ext: 'PDF', cat: '资料', size: '3.2 MB', date: '2026-09-06', owner: '陈立群', folder: '我的文件', scope: '校内公开', platformSynced: true },
    { id: 'f3', name: '慢阻肺病例讨论学习单', ext: 'DOC', cat: '教案', size: '1.1 MB', date: '2026-08-31', owner: '陈立群', folder: '教案课件', scope: '课程班级', platformSynced: false },
    { id: 'f4', name: '呼吸系统疾病随堂题库（章节版）', ext: 'XLS', cat: '题库', size: '4.8 MB', date: '2026-08-20', owner: '陈立群', folder: '习题试卷', scope: '私有', platformSynced: false },
    { id: 'f5', name: '《慢阻肺稳定期管理》微课成片', ext: 'MP4', cat: '视频', size: '260 MB', date: '2026-09-02', owner: '陈立群', folder: '音视频', scope: '指定教师', platformSynced: false },
    { id: 'f6', name: '肺功能检查操作示教视频', ext: 'MP4', cat: '视频', size: '410 MB', date: '2026-08-12', owner: '陈立群', folder: '音视频', scope: '校内公开', platformSynced: true },
    { id: 'f7', name: '课堂板书与胶片归档（第1-6周）', ext: 'ZIP', cat: '归档', size: '88 MB', date: '2026-08-26', owner: '陈立群', folder: '归档', scope: '私有', platformSynced: false },
    { id: 'f8', name: '翻转课堂任务清单（呼吸系统）', ext: 'PDF', cat: '资料', size: '0.8 MB', date: '2026-07-18', owner: '陈立群', folder: '教案课件', scope: '课程班级', platformSynced: true }
  ];
  var CLOUD_FOLDERS = ['我的文件', '教案课件', '习题试卷', '音视频', '归档'];

  /* ---------- 评价表 ---------- */
  var EVAL_FORMS = [
    {
      id: 'f1', name: '课堂教学质量评价表（督导听课版）', version: 'V3.1', org: '校教学督导委员会',
      applyTo: '理论课 / 实验课课堂听课', note: '满分100分；≥90优秀，80-89良好，70-79合格，<70待改进', enabled: true,
      dims: [
        { dim: '教学准备与态度', weight: 15, items: [
          { name: '教学准备充分，教案、课件等教学文件齐全', max: 8 },
          { name: '教态自然、仪表得体、精神饱满，守时尽责', max: 7 } ] },
        { dim: '教学内容与目标', weight: 30, items: [
          { name: '教学目标明确，重点、难点突出', max: 10 },
          { name: '内容科学准确、逻辑清晰、信息量适当', max: 12 },
          { name: '理论联系临床案例，注重学科前沿渗透', max: 8 } ] },
        { dim: '教学方法与手段', weight: 25, items: [
          { name: '教学方法多样，启发式教学与师生互动充分', max: 10 },
          { name: '信息技术与课堂教学融合恰当、有效', max: 8 },
          { name: '时间分配合理，教学节奏张弛有度', max: 7 } ] },
        { dim: '课堂组织与氛围', weight: 20, items: [
          { name: '学生参与度高，课堂气氛活跃有序', max: 12 },
          { name: '课堂管理规范，课程思政融入自然', max: 8 } ] },
        { dim: '总体印象', weight: 10, items: [
          { name: '教学效果好，教学目标达成度高', max: 10 } ] }
      ]
    },
    {
      id: 'f2', name: '同行专家听课评价表', version: 'V2.0', org: '各二级学院教学委员会',
      applyTo: '同行专家相互听课', note: '满分100分；评价结果用于教研组改进与教师发展档案。', enabled: true,
      dims: [
        { dim: '专业内容', weight: 40, items: [
          { name: '学术观点准确，无科学性或知识性错误', max: 15 },
          { name: '内容深度与广度符合培养方案要求', max: 13 },
          { name: '体现本学科最新进展与临床规范', max: 12 } ] },
        { dim: '教学设计', weight: 30, items: [
          { name: '教学设计合理，重难点处理得当', max: 15 },
          { name: '案例、问题导向设计有效激活思维', max: 15 } ] },
        { dim: '教学效果', weight: 30, items: [
          { name: '课堂即时反馈显示理解度较高', max: 15 },
          { name: '学生课后任务与能力目标衔接良好', max: 15 } ] }
      ]
    },
    {
      id: 'f3', name: '智慧课堂教学质量评价表（AI辅助）', version: 'V1.5', org: '教师教学发展中心',
      applyTo: '智慧课堂环境听课评价', note: '结合课堂行为数据与人工评分形成综合评价。', enabled: false,
      dims: [
        { dim: '课堂行为数据', weight: 40, items: [
          { name: '学生抬头率/参与率符合优良标准', max: 20 },
          { name: '随堂练习完成度与正确率达标', max: 20 } ] },
        { dim: '人工评价维度', weight: 60, items: [
          { name: '教学设计、内容与互动质量', max: 35 },
          { name: '目标达成与学生反馈', max: 25 } ] }
      ]
    }
  ];

  /* ---------- 督导评价记录 ---------- */
  var EVALS = [
    { id: 'e1', formId: 'f1', courseId: 'c2', sessionLabel: '第6周 · 周二 1-2节', teacher: '周明远', rater: '李岩', date: '2026-08-25 10:20', total: 93.5, level: '优秀', comment: '解剖结构与临床衔接自然，板书清晰，学生参与积极。', status: '已提交' },
    { id: 'e2', formId: 'f2', courseId: 'c3', sessionLabel: '第5周 · 周四 3-4节', teacher: '吴静', rater: '刘建平', date: '2026-08-20 09:30', total: 88, level: '良好', comment: '读片训练设计好，个别学生提问覆盖面可再均衡。', status: '已提交' }
  ];

  /* ---------- 用户 / 日志 / 通知 ---------- */
  var USERS = [
    { id: 'u1', name: '陈立群', account: 'chenlq', dept: '第一临床学院', role: '授课教师', status: '启用', last: '2026-09-09 08:45' },
    { id: 'u2', name: '李岩', account: 'liyan', dept: '校教学督导委员会', role: '督导专家', status: '启用', last: '2026-09-08 16:20' },
    { id: 'u3', name: '周明远', account: 'zhoumy', dept: '基础医学院', role: '授课教师', status: '启用', last: '2026-09-07 11:02' },
    { id: 'u4', name: '吴静', account: 'wujing', dept: '医学影像学院', role: '授课教师', status: '启用', last: '2026-09-08 15:10' },
    { id: 'u5', name: '赵敏', account: 'zhaomin', dept: '第一临床学院教学办', role: '教学秘书', status: '启用', last: '2026-09-09 07:55' },
    { id: 'u6', name: '王泽', account: 'wangze', dept: '平台管理中心', role: '平台管理员', status: '启用', last: '2026-09-09 09:01' }
  ];

  var LOGS = [
    { id: 'l1', time: '2026-09-09 09:20', user: '陈立群', module: '课堂活动', action: '发布活动', detail: '《急性加重情景案例：现场作答中》（内科学）' },
    { id: 'l2', time: '2026-09-09 06:30', user: '系统', module: '平台对接', action: '自动同步', detail: '同步校方教学平台课堂活动 3 项' },
    { id: 'l3', time: '2026-09-08 19:40', user: '陈立群', module: '直录播资源', action: '剪辑导出', detail: '导出剪辑片段《COPD诊疗要点精剪》' },
    { id: 'l4', time: '2026-09-08 16:20', user: '李岩', module: '在线督导', action: '提交评价', detail: '《课堂教学质量评价表》使用记录 1 条' },
    { id: 'l5', time: '2026-09-08 10:05', user: '陈立群', module: '语音转写', action: '转写保存', detail: '《慢阻肺病例讨论》课堂语音转写记录' },
    { id: 'l6', time: '2026-09-07 21:30', user: '系统', module: '授课计划', action: '自动匹配', detail: '内科学（呼吸系统疾病）授课计划覆盖率分析完成' },
    { id: 'l7', time: '2026-09-07 09:10', user: '陈立群', module: '课堂活动', action: '发布活动', detail: '《急性加重评估流程演练（情景题）》（内科学）' },
    { id: 'l8', time: '2026-09-06 20:15', user: '赵敏', module: '云端资源库', action: '上传文件', detail: '《COPD诊疗指南（2025版）》要点解读.pdf' }
  ];

  var NOTICES = [
    { id: 'n1', level: 'info', title: '平台对接', txt: '校方教学平台自动同步完成：新增课堂活动 2 项，请前往“课堂活动”查看。', time: '今天 06:30', read: false },
    { id: 'n2', level: 'warn', title: '覆盖分析', txt: '《医学影像学（胸部影像诊断）》尚有 3 个大纲知识点暂未覆盖（后续周次开课）。', time: '昨天 21:00', read: false },
    { id: 'n3', level: 'ok', title: '语音转写', txt: '《慢阻肺病例讨论》转写记录已生成并保存，可随时导出。', time: '昨天 10:05', read: true },
    { id: 'n4', level: 'info', title: '资源同步', txt: '《呼吸系统总论》课堂实录已同步至教学平台资源库。', time: '07-20 20:10', read: true }
  ];

  /* ---------- 转写记录 ---------- */
  var TRANSCRIPTS = [
    { id: 't1', courseId: 'c1', title: '《慢阻肺病例讨论》课堂语音转写', date: '2026-09-08 10:02', dur: '46分12秒', srclang: '中文（普通话）', lines: 132, corrected: 6, saved: true }
  ];

  function seed() {
    return {
      meta: { term: TERM, currentWeek: CURR_WEEK, totalWeeks: 18, platformOrg: '校方教学平台（统一身份认证）' },
      courses: JSON.parse(JSON.stringify(COURSES)),
      outlines: JSON.parse(JSON.stringify(OUTLINES)),
      activities: JSON.parse(JSON.stringify(ACTIVITIES)),
      syncPool: JSON.parse(JSON.stringify(SYNC_POOL)),
      resources: JSON.parse(JSON.stringify(RESOURCES)),
      cloudFiles: JSON.parse(JSON.stringify(CLOUD_FILES)),
      cloudFolders: JSON.parse(JSON.stringify(CLOUD_FOLDERS)),
      evalForms: JSON.parse(JSON.stringify(EVAL_FORMS)),
      evals: JSON.parse(JSON.stringify(EVALS)),
      users: JSON.parse(JSON.stringify(USERS)),
      logs: JSON.parse(JSON.stringify(LOGS)),
      notices: JSON.parse(JSON.stringify(NOTICES)),
      transcripts: JSON.parse(JSON.stringify(TRANSCRIPTS)),
      classes: JSON.parse(JSON.stringify(CLASSLIST)),
      teachers: JSON.parse(JSON.stringify(TEACHERLIST)),
      resourceCalls: []
    };
  }

  /* 平滑升级旧库：补齐新增课程/大纲/活动/资源字段/名册（不覆盖用户已产生的数据） */
  function migrate(db) {
    var s = seed();
    if (!db.meta) db.meta = s.meta;
    if (!db.classes || !db.classes.length) db.classes = s.classes;
    if (!db.teachers || !db.teachers.length) db.teachers = s.teachers;
    if (!db.resourceCalls) db.resourceCalls = [];
    // 课程 / 大纲 / 活动 增量补齐
    function idx(arr, id) { return arr.filter(function (x) { return x.id === id; })[0]; }
    s.courses.forEach(function (c) { if (!idx(db.courses || [], c.id)) (db.courses = db.courses || []).push(c); });
    Object.keys(s.outlines).forEach(function (k) { if (!db.outlines[k]) db.outlines[k] = s.outlines[k]; });
    (s.activities || []).forEach(function (a) { if (!idx(db.activities || [], a.id)) (db.activities = db.activities || []).push(a); });
    // 资源补齐 stt 字段
    var smap = {};
    (s.resources || []).forEach(function (r) { smap[r.id] = r; });
    (db.resources || []).forEach(function (r) {
      if (r.stt === undefined || r.stt === null) {
        r.stt = (smap[r.id] && smap[r.id].stt) || STT_DEFAULT_BY_COURSE[r.courseId] || null;
      }
    });
    // 旧库若有 evalForms 但缺少新字段则忽略（结构未变）
    return db;
  }

  function load() {
    var raw;
    try { raw = localStorage.getItem(DB_KEY); } catch (e) { raw = null; }
    if (!raw) {
      var s = seed();
      try { localStorage.setItem(DB_KEY, JSON.stringify(s)); } catch (e) {}
      return s;
    }
    try { return migrate(JSON.parse(raw)); } catch (e) { return seed(); }
  }
  function save(db) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
    return db;
  }
  function reset() {
    var s = seed();
    save(s);
    return s;
  }

  global.ZData = {
    load: load, save: save, reset: reset,
    LANGS: LANGS, ACT_TYPES: ACT_TYPES, STUDENT_NAMES: STUDENT_NAMES,
    EVAL_RATERS: EVAL_RATERS, STT_SCRIPT: STT_SCRIPT, SLIDE_SETS: SLIDE_SETS,
    RES_SCRIPTS: RES_SCRIPTS, CLASSLIST: CLASSLIST, TEACHERLIST: TEACHERLIST,
    STT_DEFAULT_BY_COURSE: STT_DEFAULT_BY_COURSE
  };
})(window);
