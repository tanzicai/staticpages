"use strict";

const courses = [
  {
    id: "pronunciation", title: "英语语音语调", en: "English Pronunciation & Intonation", image: "voice", tag: "语音训练",
    intro: "比较英式与美式英语常见发音差异，练习意群划分、重音与语调，将听辨训练应用到朗读和口头交流中。",
    task: ["听辨与跟读", "先读 I wanted the BLUE one. 再读 I WANTED the blue one. 体会重音移动时信息焦点的变化。下列哪一句的焦点是颜色？", ["I wanted the BLUE one.", "I WANTED the blue one."], 0, "重读 BLUE 让听者注意到颜色上的对比。"],
    prompts: [
      ["英美发音有哪些典型差异？", "可以先听 car、water、dance。许多美式口音会发出 car 词尾的 /r/，一些英式口音则省略该音。先比较同一个词，再模仿一整句。", ["英美", "美式", "英式", "发音"]],
      ["怎样练习句子重音？", "用 I wanted the BLUE one. 练习信息焦点。先重读 BLUE，再移到 WANTED，比较两句分别在强调什么。", ["重音", "重读", "焦点"]],
      ["一般疑问句一定用升调吗？", "升调可用于询问或确认。语调也会随语境、态度和口音变化。试用不同语调读 Are you ready?，听听确认和催促的区别。", ["升调", "疑问", "语调"]]
    ]
  },
  {
    id: "intercultural", title: "跨文化交际", en: "Intercultural Communication", image: "culture", tag: "跨文化实训",
    intro: "通过会议交流、合作项目和校园接待，识别表达风格差异，练习澄清、确认和礼貌协商。",
    task: ["跨文化小组讨论", "团队成员说“We'll think about it.”。如果你需要确认方案，怎样继续沟通？", ["把这句话当作同意，直接公布方案。", "确认对方的顾虑，并约定回复时间。"], 1, "开放式确认可以让对方说明顾虑，也便于双方明确接下来的安排。"],
    prompts: [
      ["如何礼貌地表达不同意见？", "先回应共同点，再提出不同看法。可以说 I see your point. Could we also consider a smaller pilot?", ["礼貌", "不同", "意见"]],
      ["怎样确认对方的意思？", "用自己的话复述并询问。可以说 Just to check, are you suggesting that we move the meeting to Friday?", ["确认", "意思", "澄清"]]
    ]
  },
  {
    id: "interpreting", title: "英语口译实务", en: "Practical English Interpreting", image: "conference", tag: "口译实践",
    intro: "在会务接待与城市推介中练习交替传译，重点训练信息提取、笔记组织和目的语复述。",
    task: ["会议开场交传", "请复述这段开场白。The workshop begins at nine in Room 204. Please bring your name badge. 哪一项保留了全部关键信息？", ["工作坊九点在 204 室开始，请佩戴名牌。", "工作坊上午开始，请提前到场。"], 0, "译文保留了时间、地点和携带名牌三项信息。"],
    prompts: [
      ["口译笔记应该写什么？", "用关键词和符号记录人名、数字、时间、地点与逻辑关系。听完整个意群后再落笔。", ["笔记", "记录"]],
      ["听到数字时怎样减少遗漏？", "把数字和单位成对记录，例如 2.5 million。复述前对照笔记确认数量级，再将它整合到句子里。", ["数字", "遗漏", "数量"]]
    ]
  },
  {
    id: "literature", title: "英美文学选读", en: "Readings in British & American Literature", image: "literature", tag: "文学研读",
    intro: "从叙述视角、修辞与历史语境切入，训练英语文本细读及有证据的批评性写作。",
    task: ["叙述视角辨析", "阅读 I packed my bags before dawn. No one knew I was leaving. 这段采用了哪种叙述视角？", ["第一人称叙述", "第三人称全知叙述"], 0, "I 表明叙事来自人物自身的视角。"],
    prompts: [
      ["如何识别第一人称叙事？", "留意 I、me、my，以及叙述者能知道哪些信息。第一人称叙述通常受叙述者的观察和记忆限制。", ["人称", "叙事", "叙述"]],
      ["细读时如何引用文本？", "引用能支撑论点的短语或句子，然后解释关键词、语序或修辞怎样产生你观察到的效果。", ["细读", "引用", "证据"]]
    ]
  }
];

const labs = [
  {title:"国际会议口译模拟", image:"interpreting", tag:"交替传译", desc:"担任会议译员，提取日程与会议信息。", task:courses[2].task},
  {title:"跨文化商务会谈", image:"culture", tag:"情境决策", desc:"担任项目联络员，练习表达和确认。", task:courses[1].task},
  {title:"英语语音听辨实验", image:"voice", tag:"重音辨识", desc:"对照朗读同一句话，辨别信息焦点。", task:courses[0].task}
];

const scenes = [
  {title:"国际会议接待", image:"conference", tag:"会务英语", desc:"核对与会身份、引导签到并说明日程。", task:["确认报名信息","嘉宾表示忘带确认函。请选一句适合签到台的回应。",["May I have your name so I can check the registration list?","You cannot enter the building."],0,"先核对姓名和报名信息，符合会务接待的处理流程。"]},
  {title:"重庆城市双语导览", image:"chongqing", tag:"文化传播", desc:"设计面向国际来访者的山城导览词。", task:["面向国际访客的导览", "导览中第一次提到「山城」时，哪项表达更有助于听众理解？",["Chongqing is a city built on steep hills, with streets and buildings on different levels.","Everyone here already understands why it's called the Mountain City."],0,"具体描述地形和空间层次，让听众理解城市称呼的由来。"]},
  {title:"国际学生校园接待", image:"culture", tag:"校园交流", desc:"为国际学生说明校园设施与活动安排。", task:["说明活动路线","来访学生想去报告厅。请选择较清楚的路线指引。",["It’s around there somewhere.","Turn left at the library. The lecture hall is beside the main gate."],1,"地标和方向能让第一次来访的学生更容易找到路线。"]}
];

const works = [
  {title:"山城文化双语导览", en:"A Bilingual Guide to Chongqing", type:"双语导览词", excerpt:"Welcome to Chongqing, a city built on steep hills…", image:"chongqing", text:"Welcome to Chongqing, a city built on steep hills where the Yangtze and Jialing rivers meet. Look across the river and notice how the buildings, stairs and elevated walkways follow the shape of the slope.", detail:"任务目标｜为初次来访的国际游客撰写一段山城导览。"},
  {title:"国际会议交传笔记", en:"Interpreting Notes", type:"交传笔记", excerpt:"Workshop → 09:00 / Rm 204 / badge required", image:"interpreting", text:"Workshop → 09:00 / Rm 204 / badge required. The workshop begins at nine in Room 204. Please bring your name badge.", detail:"任务目标｜将会议通知转换为交传笔记，并据此完成双语复述。"},
  {title:"英美文学细读札记", en:"Close Reading Journal", type:"阅读札记", excerpt:"The first-person voice limits what the reader can know…", image:"literature", text:"In “I packed my bags before dawn,” the first-person voice limits what the reader can know, while “before dawn” makes the departure feel deliberate and private.", detail:"任务目标｜依据文本中的时序和叙述视角写出一段分析。"}
];

const textbooks = [
  {id:"pronunciation", title:"英语语音语调训练手册", en:"Pronunciation & Intonation", chapters:[
    ["词重音与句子重音", "比较 I wanted the BLUE one. 和 I WANTED the blue one.，尝试用重音突出不同的信息。"],
    ["英美发音听辨", "用 car、water、dance 做听辨笔记，记录你听到的元音差异和 /r/ 音。"]
  ]},
  {id:"intercultural", title:"跨文化交际案例读本", en:"Intercultural Casebook", chapters:[
    ["识别间接表达", "小组成员说 We'll think about it. 时，记录可能的含义，并写一句用于确认下一步安排的问句。"],
    ["礼貌表达不同意见", "试用 I see your point. Could we also consider…? 提出替代方案。"]
  ]},
  {id:"interpreting", title:"英语口译实践指南", en:"English Interpreting Guide", chapters:[
    ["会务口译准备", "围绕会议主题建立术语表，核对人名、地点和日程，准备两种表达常见流程的方式。"],
    ["交传笔记与复述", "听到 The workshop begins at nine in Room 204. 时，先记 09:00 / Rm 204，再用完整句复述。"]
  ]},
  {id:"literature", title:"英美文学细读读本", en:"Close Reading Companion", chapters:[
    ["叙事视角辨析", "从 I、me、my 等词辨认叙述者，再观察其能知道哪些信息。"],
    ["构建细读论证", "选一个能支撑观点的短语，解释用词或语序如何影响读者的理解。"]
  ]}
];

const courseTopics = {
  pronunciation: /语音|语调|发音|口语|重音|朗读|英美发音|pronunciat|intonation/i,
  intercultural: /跨文化|交际|商务|礼貌|intercultural/i,
  interpreting: /口译|翻译|交传|传译|会议|会务|interpret/i,
  literature: /文学|细读|写作|阅读|叙事|literature/i
};

const mentors = [
  ["语言服务行业导师","交替传译、译前准备与项目复盘。","指导学生整理术语表、进行会前准备并复盘模拟任务。"],
  ["国际传播行业导师","双语编辑、英文内容策划与审校。","围绕受众分析与英语表达，评阅双语导览等传播成果。"],
  ["国际会展行业导师","会务沟通、接待流程与服务英语。","评阅模拟签到、路线引导和现场沟通的英语表现。"]
];

const rooms = [
  ["英语语音教研室","共建意群划分与重音训练任务。"],
  ["翻译与口译教研室","共研国际会议交传任务和评价量规。"],
  ["跨文化教学教研室","讨论来访接待中的跨文化案例。"]
];

const icons = {
  book:'<path d="M3 5h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-3H3zM21 5h-6a3 3 0 0 0-3 3v13a4 4 0 0 1 4-3h5z"/>',
  cube:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m4 9v-2a6 6 0 0 0-4-5"/>',
  case:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 12h18m-9-1v3"/>',
  grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'
};

const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const byId = id => document.getElementById(id);
const photograph = (name, className = "") => `<img class="${className}" src="assets/${name}.jpg" alt="">`;
const cardBody = (item, action) => `${photograph(item.image)}<span class="badge">${item.tag}</span><div class="card-copy"><h3>${item.title}</h3><p>${item.en ?? item.desc}</p><div class="card-action">${action}<span aria-hidden="true">↗</span></div></div>`;

function exerciseMarkup([title, question, options]) {
  return `<div class="exercise"><h3>${title}</h3><p>${question}</p><div class="options">${options.map((option, index) => `<button type="button" data-option="${index}" aria-pressed="false">${option}</button>`).join("")}</div><p class="feedback" role="status"></p></div>`;
}

function bindExercise(region, [, , , correct, explanation]) {
  const choices = region.querySelectorAll("[data-option]");
  const feedback = region.querySelector(".feedback");
  choices.forEach(choice => choice.addEventListener("click", () => {
    choices.forEach(button => button.setAttribute("aria-pressed", String(button === choice)));
    feedback.textContent = Number(choice.dataset.option) === correct ? explanation : "请再读一遍题目，比较另一项表达。";
  }));
}

function initHome() {
  const dialog = byId("detail");
  const body = byId("detail-content");
  const close = dialog.querySelector(".close");
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  const show = html => {
    body.innerHTML = html;
    if (!dialog.open) dialog.showModal();
    close.focus();
  };

  document.querySelectorAll("[data-icon]").forEach(element => {
    element.innerHTML = icon(element.dataset.icon);
  });
  byId("course-list").innerHTML = courses.map(course => `<a class="card" href="course.html?course=${course.id}">${cardBody(course, "进入课程")}</a>`).join("");

  function openTask(item) {
    show(`<h2>${item.title}</h2>${exerciseMarkup(item.task)}`);
    bindExercise(body, item.task);
  }

  function addTasks(id, items, action) {
    byId(id).innerHTML = items.map(item => `<button class="card" type="button">${cardBody(item, action)}</button>`).join("");
    byId(id).querySelectorAll("button").forEach((button, index) => {
      button.addEventListener("click", () => openTask(items[index]));
    });
  }
  addTasks("lab-list", labs, "开始实验");
  addTasks("scene-list", scenes, "进入场景");
  byId("feature-city").addEventListener("click", () => openTask(scenes[1]));
  byId("feature-interpreting").addEventListener("click", () => openTask(labs[0]));

  byId("portfolio-list").innerHTML = works.map(work => `<button class="card" type="button"><div class="portfolio-cover" style="--cover:url('assets/${work.image}.jpg')"><small>学生作品 · ${work.type}</small><strong lang="en">${work.en}</strong><span lang="en">${work.excerpt}</span></div><div class="card-copy"><h3>${work.title}</h3><span class="card-action">阅读作品节选 <span>↗</span></span></div></button>`).join("");
  byId("portfolio-list").querySelectorAll("button").forEach((button, index) => button.addEventListener("click", () => {
    const work = works[index];
    show(`<div class="eyebrow">示例作品</div><h2>${work.title}</h2><p>${work.detail}</p><hr><blockquote lang="en">${work.text}</blockquote>`);
  }));

  const textbookList = byId("textbook-list");
  textbookList.innerHTML = textbooks.map(book => `<details class="card textbook" id="textbook-${book.id}">
    <summary><div class="textbook-cover"><span class="icon">${icon("book")}</span><span lang="en">${book.en}</span></div>
    <div class="card-copy"><h3>${book.title}</h3><span class="card-action">目录与试读 <span aria-hidden="true">+</span></span></div></summary>
    <ol class="textbook-chapters">${book.chapters.map(([name, excerpt]) => `<li><strong>${name}</strong><p>${excerpt}</p></li>`).join("")}</ol>
    <a class="textbook-course" href="course.html?course=${book.id}">进入配套课程 ↗</a>
  </details>`).join("");

  const mentorList = byId("mentor-list");
  mentorList.innerHTML = mentors.map(([title, description]) => `<button class="card" type="button"><div class="card-copy"><span class="icon">${icon("case")}</span><div><h3>${title}</h3><p>${description}</p><span class="card-action">查看指导内容 ↗</span></div></div></button>`).join("");
  mentorList.querySelectorAll("button").forEach((button, index) => button.addEventListener("click", () => {
    const [title, description, detail] = mentors[index];
    show(`<h2>${title}</h2><p>${description}</p><p>${detail}</p>`);
  }));

  initPlatformAssistant();

  const roomKey = "sisu-english-research";
  let saved = [];
  try {
    const value = JSON.parse(localStorage.getItem(roomKey));
    if (Array.isArray(value)) saved = value.filter(index => rooms[index]);
  } catch {}
  function showRooms(mine, changed = false) {
    const visible = mine ? saved : rooms.map((_, index) => index);
    show(`<h2>${mine ? "我的教研室" : "教研室广场"}</h2><p>${mine ? "查看你在当前浏览器收藏的教研室。" : "浏览示例教研主题，收藏感兴趣的教研室。"}</p>${visible.length ? visible.map(index => {
      const [title, detail] = rooms[index];
      const active = saved.includes(index);
      return `<article class="room"><h3>${title}</h3><p>${detail}</p><button class="button secondary" data-room="${index}">${active ? "取消收藏" : "收藏教研室"}</button></article>`;
    }).join("") : '<p>暂无收藏。</p><button class="button secondary" id="browse-rooms">浏览教研室广场 →</button>'}${changed ? '<p id="room-status" role="status"></p>' : ""}`);
    byId("browse-rooms")?.addEventListener("click", () => showRooms(false));
    body.querySelectorAll("[data-room]").forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.room);
      const removing = saved.includes(index);
      saved = removing ? saved.filter(value => value !== index) : [...saved, index];
      let message = removing ? "已取消收藏。" : "已收藏到我的教研室。";
      try { localStorage.setItem(roomKey, JSON.stringify(saved)); }
      catch { message += "当前浏览器仅保留本次访问的变更。"; }
      showRooms(mine, true);
      byId("room-status").textContent = message;
      (body.querySelector(`[data-room="${index}"]`) ?? byId("browse-rooms") ?? close).focus();
    }));
  }
  byId("my-room").addEventListener("click", () => showRooms(true));
  byId("room-square").addEventListener("click", () => showRooms(false));
  function selectNav() {
    const hash = location.hash.startsWith("#textbook-") ? "#textbooks" : location.hash || "#home";
    document.querySelectorAll(".top nav a").forEach(a => {
      const active = a.hash === hash;
      a.classList.toggle("current", active);
      if (active) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("hashchange", selectNav);
  selectNav();
}

function platformReply(mode, question) {
  const matchingCourses = courses.filter(course => courseTopics[course.id].test(question));
  const matchingBooks = textbooks.filter(book => courseTopics[book.id].test(question)
    || book.chapters.some(([name]) => question.includes(name)));
  const courseLink = course => ({ label: course.title, href: `course.html?course=${course.id}` });
  const bookLink = book => ({ label: book.title, href: `#textbook-${book.id}` });

  if (mode === "material" || (mode === "help" && /教材|资料|手册|读本|讲义|章节/.test(question))) {
    const list = matchingBooks.length ? matchingBooks : textbooks;
    return {
      text: matchingBooks.length ? "这些教材有相关章节，点开可查看目录和试读。" : "可以试读以下数字教材。输入语音、跨文化、口译或文学，可以缩小范围。",
      links: list.map(bookLink)
    };
  }
  if (mode === "course" || (mode === "help" && /课程|选课|什么课|哪门课/.test(question))) {
    const list = matchingCourses.length ? matchingCourses : courses;
    return {
      text: matchingCourses.length ? "找到这些课程，点击进入虚拟空间。" : "平台目前有这四门英语课程。试试输入课程名称或学习方向。",
      links: list.map(courseLink)
    };
  }

  const course = matchingCourses[0];
  if (course) {
    const prompt = course.prompts.find(([, , keywords]) => keywords.some(keyword => question.includes(keyword)));
    return {
      text: prompt?.[1] ?? `可以从「${course.task[0]}」开始。${course.task[1]}做完后对照页面反馈，再复做一次。`,
      links: [courseLink(course)]
    };
  }

  return {
    text: "可以先选一门课程，读一小节数字教材，再到虚拟空间做练习。告诉我你想练语音、跨文化交际、口译还是文学细读，我可以帮你选一个起步任务。",
    links: [{ label: "浏览智慧课程", href: "#courses" }, { label: "浏览数字教材", href: "#textbooks" }]
  };
}

function initPlatformAssistant() {
  const dialog = byId("assistant-dialog");
  const field = byId("assistant-question");
  const log = byId("assistant-log");
  const modes = dialog.querySelectorAll("[data-mode]");
  const placeholders = {
    course: "例如：有没有英语口译课程？",
    material: "例如：查找语音语调教材",
    help: "例如：怎么练口译？"
  };
  let mode = "help";

  function appendMessage(text, links = [], user = false) {
    const message = document.createElement("div");
    message.className = user ? "assistant-message user-message" : "assistant-message";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    message.append(paragraph);
    for (const { label, href } of links) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label + " ↗";
      if (href.startsWith("#")) {
        link.addEventListener("click", () => {
          dialog.close();
          if (href.startsWith("#textbook-")) byId(href.slice(1)).open = true;
        });
      }
      message.append(link);
    }
    log.append(message);
    log.scrollTop = log.scrollHeight;
  }

  byId("open-assistant").addEventListener("click", () => {
    dialog.showModal();
    field.focus();
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  modes.forEach(button => button.addEventListener("click", () => {
    mode = button.dataset.mode;
    modes.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    field.placeholder = placeholders[mode];
    if (mode !== "help") {
      const reply = platformReply(mode, "");
      appendMessage(reply.text, reply.links);
    }
    field.focus();
  }));
  byId("assistant-form").addEventListener("submit", event => {
    event.preventDefault();
    const question = field.value.trim();
    if (!question) return;
    const reply = platformReply(mode, question);
    appendMessage(question, [], true);
    appendMessage(reply.text, reply.links);
    field.value = "";
    field.focus();
  });
}

function initCourse() {
  const id = new URLSearchParams(location.search).get("course");
  const course = courses.find(item => item.id === id) ?? courses[0];
  document.title = `${course.title} · 四川外国语大学英语学院`;
  const main = byId("course-main");
  main.innerHTML = `
    <header class="course-heading">
      <div class="course-title-row"><h1>${course.title}</h1><span class="course-emblem"><span class="orb" aria-hidden="true"></span> 智慧课程</span></div>
      <p lang="en">${course.en}</p>
    </header>
    <dl class="course-meta">
      <div><dt>${icon("people")} 教学单位</dt><dd>四川外国语大学英语学院</dd></div>
      <div><dt>${icon("book")} 课程方向</dt><dd>${course.tag}</dd></div>
      <div><dt>${icon("cube")} 开放方式</dt><dd>自主练习 · 教学演示</dd></div>
      <div><dt>${icon("folder")} 实践任务</dt><dd>${course.task[0]}</dd></div>
    </dl>
    <section class="glass course-intro">
      <div class="intro-heading"><h2><span class="orb" aria-hidden="true">AI</span> 课程介绍</h2><a href="#course-space">进入课程空间 →</a></div>
      <p>${course.intro}</p>
    </section>
    <div class="course-columns">
      <section class="glass lesson-panel" id="course-space">
        <div class="lesson-visual">
          ${photograph(course.image, "lesson-cover")}
          <div class="lesson-overlay"><span>课程虚拟空间</span><h2>${course.task[0]}</h2>
          <button class="button primary" id="start" type="button" aria-controls="lesson" aria-expanded="false">开始练习 ↓</button></div>
        </div>
        <div class="lesson-body" id="lesson" hidden>${exerciseMarkup(course.task)}</div>
      </section>
      <section class="glass agent-panel" id="course-agent">
        <div class="eyebrow">课程 AI 智能体 · 本地演示</div><h2>AI 助教热门问题</h2>
        <div class="prompt-list">${course.prompts.map(([question], index) => `<button type="button" data-prompt="${index}">${question}</button>`).join("")}</div>
        <div class="chat-log" id="chat-log" aria-label="课程问答记录" role="log"></div>
        <form class="chat-form" id="chat-form"><input id="question" aria-label="输入课程问题" placeholder="请输入课程问题" maxlength="200" required><button class="button primary" type="submit">发送</button></form>
      </section>
    </div>`;
  const start = byId("start");
  const lesson = byId("lesson");
  start.addEventListener("click", () => {
    lesson.hidden = !lesson.hidden;
    start.textContent = lesson.hidden ? "开始练习 ↓" : "收起练习 ↑";
    start.setAttribute("aria-expanded", String(!lesson.hidden));
  });
  bindExercise(lesson, course.task);

  const log = byId("chat-log");
  const input = byId("question");
  function answer(question, reply) {
    for (const line of [`你 · ${question}`, `课程助教 · ${reply}`]) {
      const message = document.createElement("p");
      message.textContent = line;
      log.append(message);
    }
    log.scrollTop = log.scrollHeight;
  }
  main.querySelectorAll("[data-prompt]").forEach(button => button.addEventListener("click", () => {
    const [question, reply] = course.prompts[Number(button.dataset.prompt)];
    answer(question, reply);
  }));
  byId("chat-form").addEventListener("submit", event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    const match = course.prompts.find(([prompt, , keywords]) => prompt === question || keywords.some(keyword => question.includes(keyword)));
    answer(question, match?.[1] ?? `可以试着询问：${course.prompts.map(([prompt]) => prompt).join("、")}`);
    input.value = "";
    input.focus();
  });
}

if (byId("course-main")) initCourse();
else initHome();
