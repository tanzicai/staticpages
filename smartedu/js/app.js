/* ==========================================================================
   应用外壳与路由 — 顶栏主导航 + 模块侧栏 + 哈希路由
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;

  ZK.db.load();

  /* ---------------- 菜单定义 ---------------- */
  ZK.menu = [
    {
      id: "dashboard", name: "工作台", icon: "dashboard", roles: ["admin", "teacher", "student", "auditor"],
      desc: "平台运行总览与待办",
      pages: [
        { id: "overview", name: "总览看板", icon: "chart" },
        { id: "todo", name: "待办与提醒", icon: "clipboard" },
        { id: "calendar", name: "教学日历", icon: "calendar" },
      ],
    },
    {
      id: "kb", name: "AI知识库", icon: "books", roles: ["admin", "teacher", "student"],
      desc: "文档知识库训练与检索",
      pages: [
        { id: "list", name: "知识库管理", icon: "database" },
        { id: "detail", name: "知识库详情", icon: "fileText" },
        { id: "import", name: "资源导入与文献对接", icon: "upload" },
        { id: "recall", name: "召回参数与检索", icon: "sliders" },
        { id: "query", name: "知识库问答", icon: "messages" },
      ],
    },
    {
      id: "practice", name: "AI实践", icon: "messages", roles: ["admin", "teacher", "student"],
      desc: "情景对话实训与智能评分",
      pages: [
        { id: "scenes", name: "实训场景", icon: "layers" },
        { id: "session", name: "情景对话实训", icon: "message" },
        { id: "image", name: "图片智能评分", icon: "image" },
        { id: "records", name: "实训记录与评分", icon: "award" },
      ],
    },
    {
      id: "safety", name: "内容安全", icon: "shield", roles: ["admin", "auditor", "teacher"],
      desc: "敏感内容检测与风险治理",
      pages: [
        { id: "detect", name: "文档与视频检测", icon: "scan" },
        { id: "lexicons", name: "词库与名单管理", icon: "tag" },
        { id: "risk", name: "用户风险统计", icon: "shieldAlert" },
        { id: "records", name: "检测记录", icon: "clockHistory" },
      ],
    },
    {
      id: "tasks", name: "任务评阅", icon: "clipboard", roles: ["admin", "teacher", "student"],
      desc: "作品型任务与AI评阅",
      pages: [
        { id: "list", name: "任务管理", icon: "list" },
        { id: "new", name: "新建作品型任务", icon: "plus" },
        { id: "submit", name: "作品提交", icon: "upload" },
        { id: "review", name: "AI评阅与反馈", icon: "sparkles" },
      ],
    },
    {
      id: "graph", name: "知识图谱", icon: "network", roles: ["admin", "teacher", "student"],
      desc: "图谱导读与文献解析",
      pages: [
        { id: "map", name: "图谱总览", icon: "network" },
        { id: "books", name: "推荐图书AI解读", icon: "bookOpen" },
        { id: "literature", name: "AI文献解析", icon: "wand" },
        { id: "qa", name: "文献对话问答", icon: "messages" },
      ],
    },
    {
      id: "analytics", name: "学情分析", icon: "chart", roles: ["admin", "teacher", "auditor", "student"],
      desc: "知识点分析、学习路径与画像",
      pages: [
        { id: "class", name: "班级知识分析", icon: "bars" },
        { id: "kp", name: "知识点详情", icon: "target" },
        { id: "path", name: "个性化学习路径", icon: "route" },
        { id: "profile", name: "AI学情画像", icon: "user" },
      ],
    },
    {
      id: "portal", name: "门户搭建", icon: "layout", roles: ["admin", "teacher"],
      desc: "拖拽搭建课程AI赋能门户",
      pages: [
        { id: "builder", name: "门户布局编辑", icon: "grid" },
        { id: "modules", name: "模块数据配置", icon: "sliders" },
        { id: "sources", name: "数据源接入", icon: "database" },
        { id: "theme", name: "主题与多语言", icon: "palette" },
      ],
    },
    {
      id: "library", name: "文献资源", icon: "library", roles: ["admin", "teacher", "student"],
      desc: "馆藏文献与课程资源",
      pages: [
        { id: "books", name: "课程文献库", icon: "book" },
        { id: "resources", name: "在线课程资源", icon: "folder" },
      ],
    },
    {
      id: "system", name: "系统管理", icon: "settings", roles: ["admin"],
      desc: "用户、权限与数据维护",
      pages: [
        { id: "users", name: "用户管理", icon: "users" },
        { id: "roles", name: "角色与权限", icon: "lock" },
        { id: "logs", name: "操作日志", icon: "list" },
        { id: "data", name: "数据维护", icon: "database" },
      ],
    },
  ];

  /* 图标名兜底 */
  ["library"].forEach((k) => {
    if (!ZK.icons[k]) ZK.icons[k] = ZK.icons.book;
  });

  ZK.pages = ZK.pages || {};

  /* ---------------- 会话校验 ---------------- */
  let session = ZK.db.getSession();
  if (!session) {
    location.replace("index.html");
    return;
  }

  function user() {
    return ZK.db.find("users", session.userId) || {};
  }

  function visibleMenu() {
    const role = session.role;
    return ZK.menu.filter((m) => !m.roles || m.roles.indexOf(role) >= 0);
  }

  /* ---------------- 路由 ---------------- */
  function parseHash() {
    const raw = (location.hash || "#/dashboard/overview").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    return {
      moduleId: parts[0] || "dashboard",
      pageId: parts[1] || "overview",
      param: parts.slice(2).join("/") || null,
      raw: raw,
    };
  }

  let current = null;
  let expandedMod = null;   // 侧栏手风琴当前展开的模块 id

  function navigate(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function route() {
    const r = parseHash();
    const menu = visibleMenu();
    let mod = menu.find((m) => m.id === r.moduleId);
    if (!mod) {
      mod = menu[0];
      r.moduleId = mod.id;
      r.pageId = mod.pages[0].id;
    }
    let page = mod.pages.find((p) => p.id === r.pageId);
    if (!page) {
      page = mod.pages[0];
      r.pageId = page.id;
    }
    current = { mod: mod, page: page, param: r.param };

    /* 路由切换时关闭遗留弹窗，避免上一次操作的弹窗遮挡新页面 */
    if (ZK.closeAllModals) ZK.closeAllModals();

    renderTopNav();
    renderSidebar();
    renderMain();
  }

  /* ---------------- 顶栏（当前页面包屑） ---------------- */
  function renderTopNav() {
    const nav = document.getElementById("topnav");
    if (!nav || !current) return;
    U.clear(nav);
    nav.appendChild(
      h("span", { class: "tc-icon", html: ZK.icons[current.mod.icon] ? ZK.icons[current.mod.icon](15) : "" })
    );
    nav.appendChild(h("span", { class: "tc-mod", text: current.mod.name }));
    nav.appendChild(h("span", { class: "tc-sep", text: "/" }));
    nav.appendChild(h("b", { class: "tc-page", text: current.page.name }));
  }

  /* ---------------- 左侧整合导航（个人工作台） ---------------- */
  function renderSidebar() {
    const sb = document.getElementById("sidebar");
    if (!sb) return;
    U.clear(sb);
    const mod = current.mod;
    if (!expandedMod) expandedMod = mod.id;

    /* 品牌区（置顶） */
    sb.appendChild(
      h("div", { class: "sb-brand" }, [
        h("div", { class: "brand-mark", html: ZK.brandMark(19) }),
        h("div", { class: "brand-text" }, [h("b", { text: "智课云" }), h("span", { text: "AI Teaching" })]),
      ])
    );

    const scroll = h("div", { class: "sb-scroll" });
    scroll.appendChild(h("div", { class: "sb-section-label", text: "个人工作台" }));

    /* 全部模块：手风琴（当前模块展开，其余收起） */
    const u = user();
    visibleMenu().forEach((m) => {
      const active = mod.id === m.id;
      const open = expandedMod === m.id;
      const group = h("div", { class: "mod-group" });
      group.appendChild(
        h(
          "button",
          {
            class: "mod-head" + (active ? " on" : "") + (open ? " open" : ""),
            title: m.desc,
            onclick() {
              if (open && active) {
                expandedMod = null;      // 点击已展开的当前模块 → 收起
                renderSidebar();
              } else if (active) {
                expandedMod = m.id;
                renderSidebar();
              } else {
                expandedMod = m.id;
                navigate("#/" + m.id + "/" + m.pages[0].id);
              }
            },
          },
          [
            h("span", { class: "mh-icon", html: ZK.icons[m.icon] ? ZK.icons[m.icon](17) : "" }),
            h("span", { class: "mh-name", text: m.name }),
            h("span", { class: "caret", html: ZK.icons.chevronRight(14) }),
          ]
        )
      );
      if (open) {
        const pages = h("div", { class: "mod-pages" });
        m.pages.forEach((p) => {
          const on = active && current.page.id === p.id;
          pages.appendChild(
            h(
              "button",
              { class: "sb-item" + (on ? " on" : ""), onclick: () => navigate("#/" + m.id + "/" + p.id) },
              [
                h("span", { html: ZK.icons[p.icon] ? ZK.icons[p.icon](15) : "" }),
                h("span", { text: p.name }),
              ]
            )
          );
        });
        group.appendChild(pages);
      }
      scroll.appendChild(group);
    });

    if (mod.id === "kb") {
      const kbs = ZK.db.list("knowledgeBases");
      scroll.appendChild(h("div", { class: "sb-group-title", text: "知识库快捷入口" }));
      kbs.forEach((kb) => {
        scroll.appendChild(
          h(
            "button",
            {
              class: "sb-item",
              onclick: () => navigate("#/kb/detail/" + kb.id),
              title: kb.name,
            },
            [
              h("span", { html: ZK.icons.database(15) }),
              h("span", { class: "truncate", text: kb.name.replace("课程知识库", "").replace("与案例库", "") }),
              h("span", { class: "sb-count", text: String(ZK.db.list("kbDocs", (d) => d.kbId === kb.id).length) }),
            ]
          )
        );
      });
    }

    if (mod.id === "tasks") {
      const tasks = ZK.db.list("tasks");
      scroll.appendChild(h("div", { class: "sb-group-title", text: "任务快捷入口" }));
      tasks.slice(0, 5).forEach((t) => {
        scroll.appendChild(
          h("button", { class: "sb-item", onclick: () => navigate("#/tasks/review/" + t.id), title: t.title }, [
            h("span", { html: ZK.icons.clipboard(15) }),
            h("span", { class: "truncate", text: U.truncate(t.title, 9) }),
          ])
        );
      });
    }

    if (mod.id === "system") {
      scroll.appendChild(h("div", { class: "sb-group-title", text: "运行状态" }));
      scroll.appendChild(
        h("div", { style: { padding: "0 10px", fontSize: "11.5px", color: "var(--text-faint)", lineHeight: "1.9" } }, [
          h("div", {}, ["数据存储 ", h("b", { class: "em", text: ZK.db.persistOK ? "本地持久化" : "内存模式" })]),
          h("div", {}, ["数据版本 v", String(ZK.db.version)]),
          h("div", {}, ["登录账号 ", h("b", { class: "em", text: session.account })]),
        ])
      );
    }

    sb.appendChild(scroll);

    /* 底部个人区 */
    sb.appendChild(
      h("div", { class: "sb-user" }, [
        h("button", { class: "sb-user-card", title: "账号与登录信息", onclick: () => openAccountModal(u) }, [
          h("span", { class: "avatar", text: String(u.name || "?").slice(0, 1) }),
          h("span", { class: "su-meta" }, [
            h("b", { text: u.name || "" }),
            h("span", { text: (u.roleName || "") + (u.org ? " · " + u.org : "") }),
          ]),
          h("span", {
            class: "su-out",
            title: "退出登录",
            html: ZK.icons.logout(15),
            onclick(e) {
              e.stopPropagation();
              doLogout(u);
            },
          }),
        ]),
      ])
    );
  }

  /* ---------------- 主区 ---------------- */
  function renderMain() {
    const main = document.getElementById("main");
    if (!main) return;
    U.clear(main);
    const key = current.mod.id + "/" + current.page.id;
    const pageDef = ZK.pages[key] || ZK.pages[current.mod.id + "/*"];
    const wrap = h("div", { class: "main-narrow" });

    main.appendChild(wrap);

    if (pageDef && pageDef.render) {
      try {
        pageDef.render(wrap, current.param);
      } catch (err) {
        console.error("[page]", key, err);
        wrap.appendChild(
          ZK.ui.card({
            title: "页面渲染异常",
            body: [
              h("p", { class: "fs-13 muted", text: "该页面在渲染时出现异常，已记录到控制台。错误信息：" + err.message }),
            ],
          })
        );
      }
    } else {
      wrap.appendChild(
        ZK.ui.card({
          title: current.page.name,
          sub: "该功能页面正在装配中，请从左侧导航选择其他子页面",
          body: [
            h("div", { class: "fs-13 muted", text: "如需使用「" + current.page.name + "」，请点击左侧同模块下的其他入口。" }),
          ],
        })
      );
    }
    main.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "auto" : "auto" });
  }

  /* ---------------- 全局搜索 ---------------- */
  function buildGlobalSearch() {
    const input = h("input", { class: "input", placeholder: "搜索知识库、文献、任务、场景…", style: { width: "220px" } });
    const panel = h("div", {
      style: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: "0",
        width: "420px",
        background: "var(--bg-panel)",
        border: "1px solid var(--border-strong)",
        "border-radius": "var(--r-xl)",
        "box-shadow": "var(--shadow-pop)",
        "max-height": "420px",
        "overflow-y": "auto",
        display: "none",
        "z-index": "60",
      },
    });

    function doSearch(kw) {
      U.clear(panel);
      const q = kw.trim();
      if (q.length < 1) {
        panel.style.display = "none";
        return;
      }
      const results = [];
      ZK.db.list("knowledgeBases").forEach((k) => {
        if (k.name.indexOf(q) >= 0 || (k.desc || "").indexOf(q) >= 0)
          results.push({ icon: "database", title: k.name, sub: "知识库 · " + k.course, go: "#/kb/detail/" + k.id });
      });
      ZK.db.list("kbDocs").forEach((d) => {
        if (d.title.indexOf(q) >= 0 || (d.text || "").indexOf(q) >= 0)
          results.push({ icon: "fileText", title: d.title, sub: "知识库文档 · " + d.type, go: "#/kb/detail/" + d.kbId });
      });
      ZK.db.list("libraryBooks").forEach((b) => {
        if (b.title.indexOf(q) >= 0 || b.author.indexOf(q) >= 0 || (b.summary || "").indexOf(q) >= 0)
          results.push({ icon: "book", title: b.title, sub: "文献库 · " + b.author + " · " + b.year, go: "#/library/books" });
      });
      ZK.db.list("tasks").forEach((t) => {
        if (t.title.indexOf(q) >= 0)
          results.push({ icon: "clipboard", title: t.title, sub: "作品型任务 · " + t.course, go: "#/tasks/review/" + t.id });
      });
      ZK.db.list("scenes").forEach((s) => {
        if (s.name.indexOf(q) >= 0 || (s.background || "").indexOf(q) >= 0)
          results.push({ icon: "messages", title: s.name, sub: "实训场景 · " + s.type, go: "#/practice/session/" + s.id });
      });
      ZK.db.list("literature").forEach((l) => {
        if (l.title.indexOf(q) >= 0)
          results.push({ icon: "wand", title: l.title, sub: "文献 · " + (l.author || "—"), go: "#/graph/literature/" + l.id });
      });

      if (!results.length) {
        panel.appendChild(h("div", { class: "empty", style: { padding: "22px" } }, [h("p", { text: "未找到与“" + q + "”匹配的内容" })]));
      }
      results.slice(0, 24).forEach((r) => {
        panel.appendChild(
          h(
            "button",
            {
              class: "list-row",
              style: { "border-radius": "0", background: "transparent", padding: "10px 14px" },
              onclick: () => {
                panel.style.display = "none";
                input.value = "";
                location.hash = r.go;
              },
            },
            [
              h("div", { class: "lr-icon", html: ZK.icons[r.icon](15) }),
              h("div", { class: "lr-main" }, [h("b", { text: r.title }), h("span", { text: r.sub })]),
            ]
          )
        );
      });
      panel.style.display = "block";
    }

    input.addEventListener("input", U.debounce((e) => doSearch(e.target.value), 180));
    input.addEventListener("focus", () => {
      if (input.value.trim()) doSearch(input.value);
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) panel.style.display = "none";
    });

    const wrap = h("div", { class: "search-box", style: { position: "relative" } }, [
      h("span", { html: ZK.icons.search(14) }),
      input,
      panel,
    ]);
    return wrap;
  }

  /* ---------------- 通知 ---------------- */
  function buildNotifications() {
    const btn = h("button", { class: "icon-btn", "aria-label": "通知", html: ZK.icons.bell(17) });
    const unread = ZK.db.list("notifications", (n) => !n.read).length;
    if (unread) btn.appendChild(h("span", { class: "dot" }));

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const list = ZK.db.list("notifications");
      const m = ZK.modal({
        title: "通知中心",
        sub: "共 " + list.length + " 条通知，未读 " + unread + " 条",
        size: "sm",
        footer: false,
        render(api) {
          const box = h("div", { class: "row-list" });
          function paint() {
            U.clear(box);
            ZK.db.list("notifications").forEach((n) => {
              const toneMap = { warning: "amber", success: "emerald", info: "blue" };
              box.appendChild(
                h(
                  "button",
                  {
                    class: "list-row",
                    onclick() {
                      ZK.db.update("notifications", n.id, { read: true });
                      api.close();
                      if (n.link) location.hash = n.link.replace("#", "");
                      route();
                    },
                  },
                  [
                    h("div", { class: "lr-icon " + (toneMap[n.type] ? ZK.ui.tone(toneMap[n.type]).ic : ""), html: ZK.icons.bell(15) }),
                    h("div", { class: "lr-main" }, [
                      h("b", { text: n.title }),
                      h("span", { text: n.body }),
                    ]),
                    h("div", { class: "lr-tail" }, [
                      h("span", { class: "fs-11", text: U.fmtTime(n.at) }),
                      n.read ? null : h("span", { class: "badge badge-emerald", text: "未读" }),
                    ]),
                  ]
                )
              );
            });
          }
          paint();
          api.body.appendChild(box);
          api.setFooter([
            h("button", {
              class: "btn btn-sm",
              text: "全部标为已读",
              onclick() {
                ZK.db.list("notifications").forEach((n) => ZK.db.update("notifications", n.id, { read: true }));
                ZK.toast("已全部标为已读");
                api.close();
                renderChrome();
              },
            }),
          ]);
        },
      });
    });
    return btn;
  }

  /* ---------------- 账号菜单 ---------------- */
  async function doLogout(u) {
    const ok = await ZK.confirm({
      title: "退出登录",
      message: "退出后需要重新输入账号密码才能进入平台，确定退出吗？",
      okText: "退出登录",
      danger: true,
    });
    if (!ok) return;
    ZK.db.log("退出登录", u.name + " 退出了平台");
    ZK.db.clearSession();
    location.replace("index.html");
  }

  function openAccountModal(u) {
    const initials = String(u.name || "?").slice(0, 1);
    const s = ZK.db.getSession();
    ZK.modal({
      title: "账号与登录信息",
      size: "sm",
      render(api) {
        api.body.appendChild(
          h("div", { class: "stack-20" }, [
            h("div", { class: "row", style: { gap: "14px" } }, [
              h("div", {
                class: "stat-icon ic-emerald",
                style: { width: "48px", height: "48px", "border-radius": "14px", "font-size": "19px", "font-weight": "700" },
                text: initials,
              }),
              h("div", {}, [
                h("div", { class: "fs-15 fw-6 strong", text: u.name }),
                h("div", { class: "fs-12 faint", text: (u.roleName || "") + " · " + (u.org || "") }),
              ]),
            ]),
            ZK.ui.kv([
              ["登录账号", u.account],
              ["绑定邮箱", u.email || "—"],
              ["联系方式", u.phone || "—"],
              ["本次登录", U.fmtDateTime(s.loginAt)],
              ["会话有效期", s.ttlHours + " 小时（" + (s.remember ? "保持登录" : "单次登录") + "）"],
              ["会话令牌", String(s.token).slice(0, 12) + "…"],
            ]),
          ])
        );
        api.setFooter([
          h("button", {
            class: "btn",
            text: "修改密码",
            onclick() {
              api.close();
              openPasswordModal(u);
            },
          }),
          h("button", {
            class: "btn btn-danger",
            text: "退出登录",
            onclick() {
              api.close();
              doLogout(u);
            },
          }),
        ]);
      },
    });
  }

  function openPasswordModal(u) {
    const oldPwd = h("input", { class: "input", type: "password", placeholder: "当前密码" });
    const newPwd = h("input", { class: "input", type: "password", placeholder: "新密码（不少于 6 位）" });
    const newPwd2 = h("input", { class: "input", type: "password", placeholder: "确认新密码" });
    const err = h("div", { class: "login-err hidden" });
    ZK.modal({
      title: "修改登录密码",
      size: "sm",
      render(api) {
        api.body.appendChild(
          h("div", { class: "stack-16" }, [
            h("div", { class: "field" }, [h("label", { class: "label", text: "当前密码" }), oldPwd]),
            h("div", { class: "field" }, [h("label", { class: "label", text: "新密码" }), newPwd]),
            h("div", { class: "field" }, [h("label", { class: "label", text: "确认新密码" }), newPwd2]),
            err,
          ])
        );
        api.setFooter([
          h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
          h("button", {
            class: "btn btn-primary",
            text: "保存修改",
            onclick() {
              const fail = (t) => {
                err.textContent = t;
                err.classList.remove("hidden");
              };
              if (oldPwd.value !== u.password) return fail("当前密码不正确");
              if (newPwd.value.length < 6) return fail("新密码长度不足 6 位");
              if (newPwd.value !== newPwd2.value) return fail("两次输入的新密码不一致");
              ZK.db.update("users", u.id, { password: newPwd.value });
              ZK.db.log("修改密码", u.name + " 更新了登录密码");
              ZK.toast("密码修改成功，下次登录请使用新密码");
              api.close();
            },
          }),
        ]);
      },
    });
  }

  /* ---------------- 顶栏整体装配（面包屑 + 全局操作） ---------------- */
  function renderChrome() {
    const topbar = document.getElementById("topbar");
    U.clear(topbar);
    topbar.appendChild(h("div", { class: "topbar-crumb", id: "topnav" }));
    topbar.appendChild(
      h("div", { class: "topbar-actions" }, [
        buildGlobalSearch(),
        buildNotifications(),
      ])
    );
    renderTopNav();
  }

  /* ---------------- 启动 ---------------- */
  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", () => {
    renderChrome();
    if (!location.hash) location.hash = "#/dashboard/overview";
    route();
    ZK.db.log("进入平台", session.name + " 进入 " + (ZK.db.list("knowledgeBases").length) + " 个知识库的教学平台");
  });

  ZK.app = {
    navigate,
    route,
    refresh: () => {
      renderTopNav();
      renderSidebar();
      renderMain();
    },
    refreshChrome: renderChrome,
    get session() {
      return ZK.db.getSession();
    },
  };
})();
