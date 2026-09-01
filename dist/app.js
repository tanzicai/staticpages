const courseData = {
  "product-design": {
    title: "从洞察到方案：产品设计进阶",
    teacher: "宋清和",
    lessons: 18,
    progress: 68,
    chapter: "第 4 章 · 4.2",
    lessonTitle: "识别关键时刻与情绪落差",
    noteTitle: "从用户情绪变化中找到设计机会",
    noteText: "关注行为、触点和情绪曲线之间的关系，并将关键时刻转化为可验证的机会点。",
    chapters: ["理解用户与真实场景", "从研究资料提炼洞察", "建立清晰的问题定义", "用旅程图定位体验机会", "构建可验证的设计假设"],
  },
  "data-product": {
    title: "数据驱动的产品决策",
    teacher: "周予安",
    lessons: 16,
    progress: 42,
    chapter: "第 3 章 · 3.1",
    lessonTitle: "建立有效的业务指标体系",
    noteTitle: "让指标服务于真实的业务判断",
    noteText: "区分结果指标与过程指标，用可观察的数据变化验证产品策略是否有效。",
    chapters: ["认识产品数据全景", "提出可验证的问题", "建立业务指标体系", "设计分析与实验方案", "将结论转化为决策"],
  },
  "team-work": {
    title: "高效团队的协作方法",
    teacher: "许亦晨",
    lessons: 12,
    progress: 26,
    chapter: "第 2 章 · 2.3",
    lessonTitle: "让团队共识转化为行动",
    noteTitle: "用清晰的责任与节奏推动协作",
    noteText: "将会议共识明确为负责人、交付物和时间点，让团队成员知道下一步如何行动。",
    chapters: ["识别团队协作障碍", "建立清晰行动共识", "设计高效会议", "处理冲突与反馈", "沉淀团队协作机制"],
  },
  storytelling: {
    title: "商业表达与故事设计",
    teacher: "程夏",
    lessons: 10,
    progress: 100,
    chapter: "课程已完成",
    lessonTitle: "回顾你的完整表达作品",
    noteTitle: "用结构化叙事提升表达说服力",
    noteText: "回顾目标、受众、证据和行动主张，检查它们是否共同支持一个清晰的核心观点。",
    chapters: ["明确表达目标", "理解听众需求", "搭建故事结构", "呈现证据与观点", "完成最终表达作品"],
  },
};

const state = {
  filter: "all",
  query: "",
  activeCourse: "product-design",
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "aria-hidden": "true",
      },
    });
  }
}

function showToast(message, icon = "circle-check") {
  const region = $("#toastRegion");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  region.append(toast);
  refreshIcons();

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    window.setTimeout(() => toast.remove(), 180);
  }, 2600);
}

function updateDateAndGreeting() {
  const now = new Date();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  $("#dateLabel").textContent = `${now.getMonth() + 1}月${now.getDate()}日 · ${weekdays[now.getDay()]}`;

  const hour = now.getHours();
  const greeting = hour < 6 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  $("#pageTitle").textContent = `${greeting}，林知远`;
}

function applyCourseFilters() {
  const normalizedQuery = state.query.trim().toLowerCase();
  let visibleCount = 0;

  $$(".course-card").forEach((card) => {
    const content = `${card.dataset.title} ${card.dataset.teacher}`.toLowerCase();
    const statuses = card.dataset.status.split(" ");
    const matchesFilter = state.filter === "all" || statuses.includes(state.filter);
    const matchesQuery = !normalizedQuery || content.includes(normalizedQuery);
    const isVisible = matchesFilter && matchesQuery;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  $("#emptyState").hidden = visibleCount > 0;
}

function selectFilter(filter) {
  state.filter = filter;
  $$(".filter-chip").forEach((chip) => {
    const selected = chip.dataset.filter === filter;
    chip.classList.toggle("is-active", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  applyCourseFilters();
}

function scrollToSection(selector) {
  const target = $(selector);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function closeMobileMenu() {
  $("#sidebar").classList.remove("is-open");
  $("#mobileScrim").hidden = true;
  $("#mobileMenuButton").setAttribute("aria-expanded", "false");
}

function activateView(view) {
  const linkedViews = view === "学习总览" ? ["学习总览"] : [view];
  $$("[data-view]").forEach((button) => {
    button.classList.toggle("is-active", linkedViews.includes(button.dataset.view));
  });

  const targets = {
    学习总览: ".page-heading",
    我的课程: ".course-section",
    学习计划: ".schedule-panel",
    学习社区: ".community-panel",
    学习档案: ".activity-panel",
  };

  if (view === "收藏夹") {
    selectFilter("saved");
    scrollToSection(".course-section");
    showToast("已显示收藏课程", "bookmark-check");
  } else if (view === "作业考试") {
    scrollToSection(".schedule-panel");
    showToast("你有 1 项作业将在明天截止", "file-clock");
  } else if (targets[view]) {
    scrollToSection(targets[view]);
    if (view !== "学习总览") showToast(`已定位到${view}`, "navigation");
  }

  closeMobileMenu();
}

function togglePopover(target, trigger, otherPopover, otherTrigger) {
  const willOpen = target.hidden;
  target.hidden = !willOpen;
  trigger.setAttribute("aria-expanded", String(willOpen));
  otherPopover.hidden = true;
  otherTrigger.setAttribute("aria-expanded", "false");
}

function setDialogCourse(courseId) {
  const course = courseData[courseId] || courseData["product-design"];
  state.activeCourse = courseId;

  $("#dialogCourseTitle").textContent = course.title;
  $("#dialogCourseMeta").textContent = `${course.teacher} · ${course.lessons} 节课程`;
  $("#dialogProgressLabel").textContent = `${course.progress}%`;
  $("#dialogProgressBar").style.width = `${course.progress}%`;
  $(".dialog-header p").textContent = course.chapter;
  $(".dialog-header h3").textContent = course.lessonTitle;
  $(".lesson-notes h4").textContent = course.noteTitle;
  $(".lesson-notes p").textContent = course.noteText;
  $(".dialog-course-label").textContent = course.progress >= 100 ? "已完成" : "正在学习";

  const currentChapter = course.progress >= 100 ? course.chapters.length : Math.min(course.chapters.length - 1, Math.floor(course.progress / 20));
  $("#lessonList").innerHTML = course.chapters
    .map((title, index) => {
      const isComplete = course.progress >= 100 || index < currentChapter;
      const isCurrent = course.progress < 100 && index === currentChapter;
      const className = isComplete ? "lesson is-complete" : isCurrent ? "lesson is-current" : "lesson";
      const icon = isComplete ? "check" : isCurrent ? "play" : "lock-keyhole";
      const label = `第 ${index + 1} 章${isCurrent ? " · 当前" : ""}`;
      return `
        <button class="${className}" type="button">
          <span><i data-lucide="${icon}"></i></span>
          <span><small>${label}</small><strong>${title}</strong></span>
        </button>
      `;
    })
    .join("");

  const lessonImage = $(".video-stage > img");
  const courseCardImage = $(`.course-card[data-course-id="${courseId}"] .course-cover img`);
  lessonImage.src = courseCardImage?.src || lessonImage.dataset.defaultSrc;
  lessonImage.alt = courseCardImage?.alt || lessonImage.dataset.defaultAlt;
  $("#videoPlayButton").classList.remove("is-playing");

  const completeButton = $("#completeLessonButton");
  const completed = course.progress >= 100;
  completeButton.disabled = completed;
  completeButton.innerHTML = completed
    ? `课程已完成 <i data-lucide="badge-check"></i>`
    : `标记本节完成 <i data-lucide="circle-check-big"></i>`;

  const dialog = $("#courseDialog");
  if (!dialog.open) dialog.showModal();
  $(".dialog-layout").scrollTop = 0;
  $(".lesson-content").scrollTop = 0;
  document.body.style.overflow = "hidden";
  refreshIcons();
}

function closeDialog() {
  const dialog = $("#courseDialog");
  if (dialog.open) dialog.close();
  document.body.style.overflow = "";
}

function updatePlanProgress() {
  const tasks = $$("#taskList input[type='checkbox']");
  const completed = tasks.filter((task) => task.checked).length;
  const percent = Math.round((completed / tasks.length) * 100);

  tasks.forEach((task) => {
    task.closest(".task-item").classList.toggle("is-complete", task.checked);
  });

  $("#planProgressText").textContent = `已完成 ${completed} / ${tasks.length}`;
  $("#planProgressBar").style.width = `${percent}%`;

  const weeklyPercent = Math.min(100, 60 + completed * 12);
  $("#goalPercent").textContent = `${weeklyPercent}%`;
  $("#goalBar").style.width = `${weeklyPercent}%`;
  $(".goal-track").setAttribute("aria-label", `本周目标完成 ${weeklyPercent}%`);
}

function handleLessonComplete() {
  const course = courseData[state.activeCourse];
  if (!course || course.progress >= 100) return;

  course.progress = Math.min(100, course.progress + 7);
  $("#dialogProgressLabel").textContent = `${course.progress}%`;
  $("#dialogProgressBar").style.width = `${course.progress}%`;

  if (state.activeCourse === "product-design") {
    $("#heroProgressLabel").textContent = `${course.progress}%`;
    $("#heroProgressBar").style.width = `${course.progress}%`;
    const secondTask = $$("#taskList input[type='checkbox']")[1];
    if (secondTask) secondTask.checked = true;
    updatePlanProgress();
  }

  const button = $("#completeLessonButton");
  button.innerHTML = `本节已完成 <i data-lucide="badge-check"></i>`;
  button.disabled = true;
  refreshIcons();
  showToast("学习进度已更新，继续保持", "badge-check");
}

function addPlanTask() {
  const list = $("#taskList");
  if ($("[data-added-task]", list)) {
    showToast("复习任务已在今日计划中", "info");
    return;
  }

  const task = document.createElement("label");
  task.className = "task-item";
  task.dataset.addedTask = "true";
  task.innerHTML = `
    <input type="checkbox" />
    <span class="custom-checkbox"><i data-lucide="check"></i></span>
    <span class="task-copy">
      <strong>整理本周课程学习笔记</strong>
      <small><i data-lucide="clock-3"></i> 21:00 · 15 分钟</small>
    </span>
  `;
  list.append(task);
  task.querySelector("input").addEventListener("change", updatePlanProgress);
  refreshIcons();
  updatePlanProgress();
  showToast("已添加一项今日计划", "calendar-plus");
}

function initializeInteractions() {
  $$(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => selectFilter(chip.dataset.filter));
  });

  const searchInput = $("#courseSearch");
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    applyCourseFilters();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape") {
      closeMobileMenu();
      $("#notificationPopover").hidden = true;
      $("#profilePopover").hidden = true;
    }
  });

  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.view));
  });

  const mobileMenuButton = $("#mobileMenuButton");
  mobileMenuButton.setAttribute("aria-expanded", "false");
  mobileMenuButton.addEventListener("click", () => {
    const sidebar = $("#sidebar");
    const willOpen = !sidebar.classList.contains("is-open");
    sidebar.classList.toggle("is-open", willOpen);
    $("#mobileScrim").hidden = !willOpen;
    mobileMenuButton.setAttribute("aria-expanded", String(willOpen));
  });
  $("#mobileScrim").addEventListener("click", closeMobileMenu);

  const notificationButton = $("#notificationButton");
  const profileButton = $("#profileButton");
  const notificationPopover = $("#notificationPopover");
  const profilePopover = $("#profilePopover");

  notificationButton.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePopover(notificationPopover, notificationButton, profilePopover, profileButton);
  });

  profileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePopover(profilePopover, profileButton, notificationPopover, notificationButton);
  });

  $("#sidebarProfile").addEventListener("click", () => {
    showToast("个人资料入口已就绪", "user-round");
  });

  $("#markReadButton").addEventListener("click", () => {
    $$(".notification-item").forEach((item) => item.classList.remove("is-unread"));
    $(".notification-badge").hidden = true;
    showToast("通知已全部标记为已读");
  });

  document.addEventListener("click", (event) => {
    if (!notificationPopover.contains(event.target) && event.target !== notificationButton) {
      notificationPopover.hidden = true;
      notificationButton.setAttribute("aria-expanded", "false");
    }
    if (!profilePopover.contains(event.target) && event.target !== profileButton) {
      profilePopover.hidden = true;
      profileButton.setAttribute("aria-expanded", "false");
    }
  });

  $$("[data-open-course]").forEach((button) => {
    button.addEventListener("click", () => setDialogCourse(button.dataset.openCourse));
  });

  $$(".course-card").forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `打开课程：${card.dataset.title}`);
    card.addEventListener("click", (event) => {
      if (!event.target.closest(".save-button")) setDialogCourse(card.dataset.courseId);
    });
    card.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.target.closest(".save-button")) {
        event.preventDefault();
        setDialogCourse(card.dataset.courseId);
      }
    });
  });

  $$(".save-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = button.closest(".course-card");
      const isSaved = !button.classList.contains("is-saved");
      const statuses = new Set(card.dataset.status.split(" ").filter(Boolean));

      button.classList.toggle("is-saved", isSaved);
      button.setAttribute("aria-pressed", String(isSaved));
      button.setAttribute("aria-label", isSaved ? "取消收藏课程" : "收藏课程");
      button.title = isSaved ? "取消收藏课程" : "收藏课程";
      isSaved ? statuses.add("saved") : statuses.delete("saved");
      card.dataset.status = [...statuses].join(" ");
      applyCourseFilters();
      showToast(isSaved ? "课程已加入收藏" : "已取消收藏", isSaved ? "bookmark-check" : "bookmark-x");
    });
  });

  $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", closeDialog));
  $("#courseDialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeDialog();
  });
  $("#courseDialog").addEventListener("close", () => {
    document.body.style.overflow = "";
  });
  $("#completeLessonButton").addEventListener("click", handleLessonComplete);

  $("#videoPlayButton").addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.classList.toggle("is-playing");
    showToast(button.classList.contains("is-playing") ? "课程视频正在播放" : "课程视频已暂停", "play-circle");
  });

  $$("#taskList input[type='checkbox']").forEach((task) => {
    task.addEventListener("change", () => {
      updatePlanProgress();
      showToast(task.checked ? "学习任务已完成" : "任务已恢复为待完成", task.checked ? "check-circle-2" : "rotate-ccw");
    });
  });

  $(".schedule-panel .icon-button").addEventListener("click", addPlanTask);
  $("#scheduleButton").addEventListener("click", () => {
    scrollToSection(".schedule-panel");
    showToast("已定位到今日学习计划", "calendar-days");
  });

  $$(".profile-popover button").forEach((button) => {
    button.addEventListener("click", () => {
      profilePopover.hidden = true;
      showToast(`${button.textContent.trim()}为演示入口`, "circle-dot");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const lessonImage = $(".video-stage > img");
  lessonImage.dataset.defaultSrc = lessonImage.src;
  lessonImage.dataset.defaultAlt = lessonImage.alt;
  updateDateAndGreeting();
  initializeInteractions();
  updatePlanProgress();
  applyCourseFilters();
  refreshIcons();
});
