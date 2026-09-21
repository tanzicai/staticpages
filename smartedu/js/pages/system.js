/* ==========================================================================
   页面 · 系统管理（用户管理 / 角色与权限 / 操作日志 / 数据维护）
   ========================================================================== */
(function () {
  "use strict";
  const U = ZK.util;
  const h = U.el;
  const P = ZK.pages;

  const ROLE_META = {
    admin: { name: "平台管理员", tone: "violet", desc: "平台配置、用户权限、内容安全治理与数据维护" },
    teacher: { name: "授课教师", tone: "emerald", desc: "知识库训练、任务评阅、文献解析、学情与门户编辑" },
    student: { name: "学生", tone: "blue", desc: "AI 实训、作品提交、知识库检索与门户浏览" },
    auditor: { name: "内容审核员", tone: "amber", desc: "内容安全检测与治理、学情与风险数据查看" },
  };

  const ACTION_GROUPS = [
    { module: "知识库", actions: [["kb.manage", "知识库管理"], ["kb.train", "知识库训练"], ["kb.query", "知识库检索"]] },
    { module: "内容安全", actions: [["safety.manage", "内容安全治理"], ["safety.view", "安全数据查看"]] },
    { module: "任务评阅", actions: [["task.manage", "任务与评阅"], ["task.submit", "作品提交"]] },
    { module: "AI 实训", actions: [["practice.do", "AI 实训"]] },
    { module: "知识图谱", actions: [["literature.parse", "文献解析"]] },
    { module: "学情分析", actions: [["analytics.view", "学情查看"]] },
    { module: "门户", actions: [["portal.publish", "门户发布"], ["portal.edit", "门户编辑"], ["portal.view", "门户浏览"]] },
    { module: "系统", actions: [["user.manage", "用户与权限"], ["data.export", "数据导出"]] },
  ];

  function field(label, node) {
    return h("div", { class: "field" }, [h("label", { class: "label", text: label }), node]);
  }

  function permOf(role, action) {
    const rec = ZK.db.list("permissions", (p) => p.role === role && p.action === action)[0];
    return rec ? rec.allowed : false;
  }

  function setPerm(role, action, label, allowed) {
    const rec = ZK.db.list("permissions", (p) => p.role === role && p.action === action)[0];
    if (rec) ZK.db.update("permissions", rec.id, { allowed: allowed });
    else ZK.db.insert("permissions", { id: "perm_" + role + "_" + action.replace(/\W/g, "_"), role: role, action: action, label: label, allowed: allowed });
  }

  /* ==================================================================
     一、用户管理
     ================================================================== */
  P["system/users"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "用户管理",
          sub: "维护平台账号、角色与状态。停用账号会立即失效其登录态；重置密码后下次登录需使用新密码。",
          actions: [
            h("button", { class: "btn btn-sm", text: "角色与权限", onclick: () => (location.hash = "#/system/roles") }),
            h("button", { class: "btn btn-primary btn-sm", html: ZK.icons.plus(14) + "<span>新增用户</span>", onclick: () => openEdit(null) }),
          ],
        })
      );

      const users = ZK.db.list("users");
      const roleFilter = h("select", { class: "select", style: { width: "160px" } }, [
        h("option", { value: "", text: "全部角色" }),
        h("option", { value: "admin", text: "平台管理员" }),
        h("option", { value: "teacher", text: "授课教师" }),
        h("option", { value: "student", text: "学生" }),
        h("option", { value: "auditor", text: "内容审核员" }),
      ]);
      const statusFilter = h("select", { class: "select", style: { width: "140px" } }, [
        h("option", { value: "", text: "全部状态" }),
        h("option", { value: "active", text: "启用" }),
        h("option", { value: "disabled", text: "停用" }),
      ]);
      const host = h("div");

      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({ label: "账号总数", value: String(users.length), target: "含四大角色", icon: ZK.icons.users(18), tone: "emerald", progress: 100 }),
          ZK.ui.statCard({ label: "教师账号", value: String(users.filter((u) => u.role === "teacher").length), target: "可训练知识库与评阅任务", icon: ZK.icons.graduation(18), tone: "blue", progress: 60 }),
          ZK.ui.statCard({ label: "今日有登录", value: String(users.filter((u) => Date.now() - u.lastLogin < 86400000).length), target: "按最近登录时间统计", icon: ZK.icons.clock(18), tone: "violet", progress: 72 }),
          ZK.ui.statCard({ label: "停用账号", value: String(users.filter((u) => u.status === "disabled").length), target: "登录态即时失效", icon: ZK.icons.lock(18), tone: "amber", progress: 18 }),
        ])
      );
      root.appendChild(h("div", { class: "row mb-12", style: { gap: "10px" } }, [roleFilter, statusFilter]));
      root.appendChild(host);

      function paint() {
        U.clear(host);
        let rows = ZK.db.list("users");
        if (roleFilter.value) rows = rows.filter((u) => u.role === roleFilter.value);
        if (statusFilter.value) rows = rows.filter((u) => u.status === statusFilter.value);
        host.appendChild(
          ZK.ui.card({
            title: "账号列表（" + rows.length + "）",
            icon: ZK.icons.users(16),
            actions: [
              h("button", { class: "btn btn-xs", text: "导出账号表", onclick: () => exportUsers(rows) }),
            ],
            body: [ZK.ui.table({
              rows: rows.map((u) => Object.assign({ __u: u }, u)),
              pageSize: 10,
              searchKeys: ["account", "name", "org", "email"],
              sortKey: "lastLogin",
              sortDir: "desc",
              columns: [
                { key: "name", label: "用户", render: (r) => h("div", { class: "row", style: { gap: "9px" } }, [
                  h("span", { class: "avatar", text: String(r.name).slice(0, 1) }),
                  h("div", {}, [h("div", { class: "cell-strong", text: r.name }), h("div", { class: "fs-11 faint", text: r.account })]),
                ]) },
                { key: "role", label: "角色", sortable: true, render: (r) => ZK.ui.badge(ROLE_META[r.role] ? ROLE_META[r.role].name : r.role, (ROLE_META[r.role] || {}).tone || "gray") },
                { key: "org", label: "所属单位", render: (r) => h("span", { class: "cell-muted", text: r.org || "—" }) },
                { key: "email", label: "联系方式", render: (r) => h("div", {}, [h("div", { class: "fs-12", text: r.email || "—" }), h("div", { class: "fs-11 faint", text: r.phone || "" })]) },
                { key: "lastLogin", label: "最近登录", sortable: true, render: (r) => h("span", { class: "cell-muted", text: U.fmtDateTime(r.lastLogin) }) },
                {
                  key: "status",
                  label: "状态",
                  render: (r) =>
                    h("button", {
                      class: "switch" + (r.status !== "disabled" ? " on" : ""),
                      title: r.status === "disabled" ? "点击启用" : "点击停用",
                      onclick: async () => {
                        if (r.__u.id === (ZK.db.currentUser() || {}).id) return ZK.toast("不能停用当前登录账号", "danger");
                        ZK.db.update("users", r.__u.id, { status: r.status === "disabled" ? "active" : "disabled" });
                        ZK.db.log("用户状态变更", r.name + " 账号已" + (r.status === "disabled" ? "启用" : "停用"));
                        ZK.toast(r.name + " 账号已" + (r.status === "disabled" ? "启用" : "停用"));
                        paint();
                      },
                    }),
                },
                {
                  key: "op",
                  label: "操作",
                  render: (r) =>
                    h("div", { class: "row", style: { gap: "4px" } }, [
                      h("button", { class: "btn btn-xs", text: "编辑", onclick: () => openEdit(r.__u) }),
                      h("button", { class: "btn btn-xs", text: "重置密码", onclick: () => resetPwd(r.__u) }),
                      h("button", { class: "btn btn-xs", text: "查看权限", onclick: () => showPerm(r.__u) }),
                    ]),
                },
              ],
            })],
          })
        );
      }

      function openEdit(u) {
        const name = h("input", { class: "input", value: u ? u.name : "" });
        const account = h("input", { class: "input", value: u ? u.account : "", placeholder: "登录账号，例如 T20230012" });
        const role = h("select", { class: "select" }, Object.keys(ROLE_META).map((k) => h("option", { value: k, text: ROLE_META[k].name, selected: u && u.role === k ? true : null })));
        const org = h("input", { class: "input", value: u ? u.org : "" });
        const email = h("input", { class: "input", value: u ? u.email : "" });
        const phone = h("input", { class: "input", value: u ? u.phone : "" });
        const pwd = h("input", { class: "input", value: u ? u.password : "", placeholder: "初始密码，不少于 6 位" });
        const err = h("div", { class: "login-err hidden" });

        ZK.modal({
          title: u ? "编辑用户" : "新增用户",
          sub: u ? u.name + " · " + u.account : "新增后可分配角色与权限",
          render(api) {
            api.body.appendChild(
              h("div", { class: "form-grid" }, [
                field("姓名", name),
                field("登录账号", account),
                field("角色", role),
                h("div", { class: "field" }, [h("label", { class: "label", text: "初始密码" }), pwd]),
                h("div", { class: "field span-full" }, [h("label", { class: "label", text: "所属单位" }), org]),
                field("邮箱", email),
                field("手机", phone),
                h("div", { class: "span-full" }, [err]),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "保存",
                onclick() {
                  const fail = (t) => {
                    err.textContent = t;
                    err.classList.remove("hidden");
                  };
                  if (!name.value.trim()) return fail("请填写姓名");
                  if (!account.value.trim()) return fail("请填写登录账号");
                  const dup = ZK.db.list("users", (x) => x.account === account.value.trim() && (!u || x.id !== u.id));
                  if (dup.length) return fail("该登录账号已存在");
                  if (!u && (pwd.value || "").length < 6) return fail("初始密码不少于 6 位");
                  const data = {
                    name: name.value.trim(),
                    account: account.value.trim(),
                    role: role.value,
                    roleName: ROLE_META[role.value].name,
                    org: org.value.trim(),
                    email: email.value.trim(),
                    phone: phone.value.trim(),
                    password: pwd.value || (u ? u.password : "Init@123"),
                  };
                  if (u) {
                    ZK.db.update("users", u.id, data);
                    ZK.db.log("编辑用户", "更新 " + data.name + " 的账号信息");
                    ZK.toast("用户信息已保存");
                  } else {
                    ZK.db.insert("users", Object.assign({ id: U.uid("u"), status: "active", lastLogin: Date.now(), createdAt: Date.now() }, data));
                    ZK.db.log("新增用户", "新增 " + data.name + "（" + data.account + "）· " + data.roleName);
                    ZK.toast("用户已新增");
                  }
                  api.close();
                  if (ZK.app) ZK.app.refresh();
                },
              }),
            ]);
          },
        });
      }

      function resetPwd(u) {
        const pwd = h("input", { class: "input", value: "Reset@123" });
        ZK.modal({
          title: "重置登录密码",
          sub: u.name + " · " + u.account,
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                field("新密码（不少于 6 位）", pwd),
                h("div", { class: "advice warn", text: "重置后该账号的登录态不会自动失效，但下次登录必须使用新密码。" }),
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-primary",
                text: "确认重置",
                onclick() {
                  if ((pwd.value || "").length < 6) return ZK.toast("密码长度不足 6 位", "danger");
                  ZK.db.update("users", u.id, { password: pwd.value });
                  ZK.db.log("重置密码", "重置 " + u.name + " 的登录密码");
                  ZK.toast("密码已重置为：" + pwd.value);
                  api.close();
                },
              }),
            ]);
          },
        });
      }

      function showPerm(u) {
        const perms = ZK.db.list("permissions", (p) => p.role === u.role);
        ZK.modal({
          title: "权限查看 · " + u.name,
          sub: "角色：" + (ROLE_META[u.role] || {}).name,
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-12" }, [
                h("div", { class: "fs-12 muted", text: (ROLE_META[u.role] || {}).desc || "" }),
                h("div", { class: "row-list" }, perms.map((p) =>
                  h("div", { class: "list-row" }, [
                    h("div", { class: "lr-icon " + (p.allowed ? "ic-emerald" : "ic-gray"), html: (p.allowed ? ZK.icons.checkCircle : ZK.icons.close)(14) }),
                    h("div", { class: "lr-main" }, [h("b", { text: p.label }), h("span", { text: p.action })]),
                    h("div", { class: "lr-tail" }, [ZK.ui.badge(p.allowed ? "已授权" : "未授权", p.allowed ? "emerald" : "gray")]),
                  ])
                )),
                h("button", { class: "btn btn-sm", text: "前往角色与权限调整", onclick: () => { api.close(); location.hash = "#/system/roles"; } }),
              ])
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }

      function exportUsers(rows) {
        const csv = [["姓名", "账号", "角色", "所属单位", "邮箱", "手机", "状态", "最近登录"]];
        rows.forEach((u) => csv.push([u.name, u.account, (ROLE_META[u.role] || {}).name || u.role, u.org || "", u.email || "", u.phone || "", u.status === "disabled" ? "停用" : "启用", U.fmtDateTime(u.lastLogin)]));
        U.downloadCsv("平台账号表.csv", csv);
        ZK.db.log("导出账号表", "导出 " + rows.length + " 个账号");
        ZK.toast("账号表已导出");
      }

      roleFilter.addEventListener("change", paint);
      statusFilter.addEventListener("change", paint);
      paint();
    },
  };

  /* ==================================================================
     二、角色与权限
     ================================================================== */
  P["system/roles"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "角色与权限",
          sub: "权限以「角色 × 功能动作」的方式授予，学生的实训与提交、教师的评阅与训练、审核员的安全治理互不越界。",
          actions: [
            h("button", { class: "btn btn-sm", text: "用户管理", onclick: () => (location.hash = "#/system/users") }),
            h("button", { class: "btn btn-primary btn-sm", text: "保存权限配置", onclick: () => save() }),
          ],
        })
      );

      const roles = Object.keys(ROLE_META);
      const host = h("div", { class: "stack-16" });
      root.appendChild(host);
      paint();

      function paint() {
        U.clear(host);
        host.appendChild(
          h("div", { class: "grid grid-4" }, roles.map((r) =>
            ZK.ui.card({
              class: "card-hover",
              title: ROLE_META[r].name,
              sub: ROLE_META[r].desc,
              icon: ZK.icons.lock(16),
              actions: [ZK.ui.badge(ZK.db.list("users", (u) => u.role === r).length + " 个账号", "gray")],
              body: [
                h("div", { class: "row-between" }, [
                  h("span", { class: "fs-12 muted", text: "已授权动作" }),
                  h("b", { class: "em", text: ZK.db.list("permissions", (p) => p.role === r && p.allowed).length + " / " + U.sum(ACTION_GROUPS.map((g) => g.actions.length)) }),
                ]),
                ZK.ui.progressLine(
                  (ZK.db.list("permissions", (p) => p.role === r && p.allowed).length / U.sum(ACTION_GROUPS.map((g) => g.actions.length))) * 100,
                  ROLE_META[r].tone
                ),
                h("div", { class: "chip-wrap mt-12" }, ZK.db.list("permissions", (p) => p.role === r && p.allowed).slice(0, 6).map((p) => h("span", { class: "chip", text: p.label }))),
              ],
            })
          ))
        );

        const matrix = h("div", { class: "table-wrap" });
        const head = h("tr", {}, [h("th", { text: "功能模块" }), h("th", { text: "功能动作" })].concat(roles.map((r) => h("th", { text: ROLE_META[r].name }))));
        const tbody = h("tbody");
        ACTION_GROUPS.forEach((g) => {
          g.actions.forEach((act, ai) => {
            const tr = h("tr", {}, [
              ai === 0 ? h("td", { rowspan: String(g.actions.length) }, [h("b", { class: "fs-13", text: g.module })]) : null,
              h("td", {}, [h("span", { class: "fs-13", text: act[1] }), h("div", { class: "fs-11 faint", text: act[0] })]),
            ]);
            roles.forEach((r) => {
              const btn = h("button", {
                class: "switch" + (permOf(r, act[0]) ? " on" : ""),
                title: ROLE_META[r].name + " · " + act[1],
              });
              btn.addEventListener("click", () => {
                const next = !btn.classList.contains("on");
                if (r === "admin" && act[0] === "user.manage" && !next) return ZK.toast("平台管理员必须保留用户与权限管理权限", "danger");
                btn.classList.toggle("on", next);
              });
              btn.dataset.role = r;
              btn.dataset.action = act[0];
              btn.dataset.label = act[1];
              tr.appendChild(h("td", {}, [btn]));
            });
            tbody.appendChild(tr);
          });
        });
        const table = h("table", {}, [h("thead", {}, [head]), tbody]);
        matrix.appendChild(table);

        host.appendChild(
          ZK.ui.card({
            title: "权限矩阵",
            sub: "勾选后点击右上角「保存权限配置」生效；平台管理员的系统权限不可撤销",
            icon: ZK.icons.grid(16),
            body: [matrix],
          })
        );
      }

      function save() {
        const sws = U.$$(".switch[data-role]", root);
        let changed = 0;
        sws.forEach((sw) => {
          const role = sw.dataset.role;
          const action = sw.dataset.action;
          const label = sw.dataset.label;
          const allowed = sw.classList.contains("on");
          if (permOf(role, action) !== allowed) {
            setPerm(role, action, label, allowed);
            changed += 1;
          }
        });
        ZK.db.log("保存权限配置", "更新 " + changed + " 项权限");
        ZK.toast(changed ? "已保存 " + changed + " 项权限变更" : "权限没有变化");
        paint();
      }
    },
  };

  /* ==================================================================
     三、操作日志
     ================================================================== */
  P["system/logs"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "操作日志",
          sub: "记录平台内的关键操作，含操作人、账号、来源 IP 与时间，可用于教学过程的追溯与审计。",
          actions: [
            h("button", { class: "btn btn-sm", text: "导出日志", onclick: () => exportLogs() }),
            h("button", { class: "btn btn-danger btn-sm", html: ZK.icons.trash(14) + "<span>清空日志</span>", onclick: () => clearLogs() }),
          ],
        })
      );

      const logs = ZK.db.list("logs");
      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({ label: "日志条数", value: String(logs.length), target: "最多保留 600 条", icon: ZK.icons.list(18), tone: "emerald", progress: Math.min(100, (logs.length / 600) * 100) }),
          ZK.ui.statCard({ label: "今日操作", value: String(logs.filter((l) => Date.now() - l.at < 86400000).length), target: "按自然日统计", icon: ZK.icons.clock(18), tone: "blue", progress: 62 }),
          ZK.ui.statCard({ label: "操作人", value: String(new Set(logs.map((l) => l.operator)).size), target: "去重统计", icon: ZK.icons.users(18), tone: "violet", progress: 48 }),
          ZK.ui.statCard({ label: "告警级日志", value: String(logs.filter((l) => l.level === "warn" || l.level === "error").length), target: "需人工关注", icon: ZK.icons.alert(18), tone: "amber", progress: 22 }),
        ])
      );

      const lvFilter = h("select", { class: "select", style: { width: "140px" } }, [
        h("option", { value: "", text: "全部级别" }),
        h("option", { value: "info", text: "常规" }),
        h("option", { value: "warn", text: "告警" }),
        h("option", { value: "error", text: "错误" }),
      ]);
      const host = h("div");
      root.appendChild(h("div", { class: "row mb-12", style: { gap: "10px" } }, [lvFilter]));
      root.appendChild(host);

      function paint() {
        U.clear(host);
        let rows = ZK.db.list("logs").slice().sort((a, b) => b.at - a.at);
        if (lvFilter.value) rows = rows.filter((l) => l.level === lvFilter.value);
        host.appendChild(
          ZK.ui.card({
            title: "日志明细（" + rows.length + "）",
            icon: ZK.icons.clockHistory(16),
            body: [ZK.ui.table({
              rows: rows,
              pageSize: 12,
              searchKeys: ["action", "detail", "operator", "account"],
              sortKey: "at",
              sortDir: "desc",
              columns: [
                { key: "at", label: "时间", sortable: true, render: (r) => h("span", { class: "cell-muted mono fs-11", text: U.fmtDateTime(r.at) }) },
                { key: "level", label: "级别", render: (r) => ZK.ui.badge(r.level === "warn" ? "告警" : r.level === "error" ? "错误" : "常规", r.level === "warn" ? "amber" : r.level === "error" ? "red" : "gray") },
                { key: "action", label: "操作", sortable: true, render: (r) => h("span", { class: "cell-strong", text: r.action }) },
                { key: "detail", label: "详情", render: (r) => h("span", { class: "cell-muted", text: U.truncate(r.detail, 72) }) },
                { key: "operator", label: "操作人", sortable: true },
                { key: "account", label: "账号", render: (r) => h("span", { class: "mono fs-11", text: r.account }) },
                { key: "ip", label: "来源 IP", render: (r) => h("span", { class: "mono fs-11 cell-muted", text: r.ip }) },
              ],
            })],
          })
        );
      }

      function exportLogs() {
        const csv = [["时间", "级别", "操作", "详情", "操作人", "账号", "来源IP"]];
        ZK.db.list("logs").forEach((l) => csv.push([U.fmtDateTime(l.at), l.level, l.action, l.detail, l.operator, l.account, l.ip]));
        U.downloadCsv("操作日志.csv", csv);
        ZK.db.log("导出日志", "导出 " + ZK.db.list("logs").length + " 条操作日志");
        ZK.toast("日志已导出");
      }

      function clearLogs() {
        ZK.confirm({
          title: "清空操作日志",
          message: "将删除当前全部 " + ZK.db.list("logs").length + " 条日志记录。<br><br><b>⚠️ 此操作不可撤销，且日志是教学过程追溯的依据。</b>建议先导出备份。",
          okText: "仍然清空",
          danger: true,
        }).then((ok) => {
          if (!ok) return;
          ZK.db.list("logs").forEach((l) => ZK.db.remove("logs", l.id));
          ZK.db.log("清空日志", "清空了全部操作日志", "warn");
          ZK.toast("日志已清空");
          paint();
        });
      }

      lvFilter.addEventListener("change", paint);
      paint();
    },
  };

  /* ==================================================================
     四、数据维护
     ================================================================== */
  P["system/data"] = {
    render(root) {
      root.appendChild(
        ZK.ui.pageHead({
          title: "数据维护",
          sub: "查看数据规模与持久化状态，支持导出全量数据、导入备份与恢复演示初始数据。",
          actions: [
            h("button", { class: "btn btn-sm", text: "导出全量数据", onclick: () => exportAll() }),
            h("button", { class: "btn btn-sm", text: "导入数据", onclick: () => importAll() }),
            h("button", { class: "btn btn-danger btn-sm", html: ZK.icons.refresh(14) + "<span>恢复演示初始数据</span>", onclick: () => resetData() }),
          ],
        })
      );

      const state = ZK.db.state || {};
      const keys = Object.keys(state).filter((k) => Array.isArray(state[k]) && k !== "logs");

      root.appendChild(
        h("div", { class: "grid grid-4 mb-16" }, [
          ZK.ui.statCard({ label: "数据集合数", value: String(keys.length), target: "不含日志集合", icon: ZK.icons.database(18), tone: "emerald", progress: 100 }),
          ZK.ui.statCard({ label: "记录总条数", value: U.num(U.sum(keys.map((k) => state[k].length))), target: "全部集合合计", icon: ZK.icons.list(18), tone: "blue", progress: 84 }),
          ZK.ui.statCard({ label: "存储方式", value: ZK.db.persistOK ? "本地持久化" : "内存", target: ZK.db.persistOK ? "localStorage 已启用" : "刷新后数据会重置", icon: ZK.icons.database(18), tone: ZK.db.persistOK ? "violet" : "amber", progress: 100 }),
          ZK.ui.statCard({ label: "数据版本", value: "v" + ZK.db.version, target: "更新于 " + U.fmtDateTime((state.meta || {}).seededAt || Date.now()), icon: ZK.icons.cpu(18), tone: "amber", progress: 70 }),
        ])
      );

      root.appendChild(
        ZK.ui.card({
          title: "数据集合明细",
          sub: "逐集合展示记录数量与用途，便于确认演示数据是否完整",
          icon: ZK.icons.database(16),
          body: [ZK.ui.table({
            rows: keys.map((k) => ({ key: k, count: state[k].length, kind: DB_NOTE[k] || "业务数据" })),
            pageSize: 20,
            sortKey: "count",
            sortDir: "desc",
            columns: [
              { key: "key", label: "集合名", render: (r) => h("span", { class: "mono fs-12 cell-strong", text: r.key }) },
              { key: "kind", label: "用途" },
              { key: "count", label: "记录数", align: "right", sortable: true, render: (r) => h("span", { class: "tnum", text: U.num(r.count) }) },
              { key: "op", label: "操作", render: (r) => h("button", { class: "btn btn-xs", text: "查看样例", onclick: () => peek(r.key) }) },
            ],
          })],
        })
      );

      const logs = ZK.db.list("logs").slice().sort((a, b) => b.at - a.at).slice(0, 8);
      root.appendChild(
        h("div", { class: "mt-16" }, [
          ZK.ui.card({
            title: "最近维护动作",
            icon: ZK.icons.clockHistory(16),
            body: [ZK.ui.table({
              rows: logs,
              pageSize: 8,
              columns: [
                { key: "at", label: "时间", render: (r) => h("span", { class: "cell-muted mono fs-11", text: U.fmtDateTime(r.at) }) },
                { key: "action", label: "操作", render: (r) => h("span", { class: "cell-strong", text: r.action }) },
                { key: "detail", label: "详情", render: (r) => U.truncate(r.detail, 70) },
                { key: "operator", label: "操作人" },
              ],
            })],
          }),
        ])
      );

      function peek(key) {
        const rows = ZK.db.list(key).slice(0, 20);
        const cols = rows.length ? Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== "object" || rows[0][k] === null).slice(0, 8) : [];
        ZK.modal({
          title: "数据样例 · " + key,
          sub: "共 " + ZK.db.list(key).length + " 条记录，以下展示前 " + rows.length + " 条",
          size: "lg",
          render(api) {
            api.body.appendChild(
              cols.length
                ? ZK.ui.table({
                    rows: rows.map((r, i) => Object.assign({ __i: i + 1 }, r)),
                    pageSize: 20,
                    columns: [{ key: "__i", label: "#", align: "right" }].concat(cols.map((c) => ({ key: c, label: c, render: (r) => h("span", { class: "fs-12", text: r[c] === null || r[c] === undefined ? "—" : String(r[c]).slice(0, 60) }) }))),
                  })
                : h("div", { class: "fs-12 faint", text: "该集合暂无可展示的字段。" })
            );
            api.setFooter([h("button", { class: "btn", text: "关闭", onclick: () => api.close() })]);
          },
        });
      }

      function exportAll() {
        U.download("zhikeyun-data-" + U.fmtDate(Date.now()) + ".json", ZK.db.exportJson(), "application/json;charset=utf-8");
        ZK.db.log("导出全量数据", "导出平台全量数据备份");
        ZK.toast("全量数据已导出为 JSON 备份文件");
      }

      function importAll() {
        const file = h("input", { type: "file", accept: ".json,application/json" });
        const ta = h("textarea", { class: "textarea", style: { "min-height": "140px" }, placeholder: "或直接粘贴导出的 JSON 内容" });
        const err = h("div", { class: "login-err hidden" });
        file.addEventListener("change", (e) => {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            ta.value = String(ev.target.result || "");
            ZK.toast("已读取备份文件：" + f.name);
          };
          reader.readAsText(f, "utf-8");
          e.target.value = "";
        });
        ZK.modal({
          title: "导入数据备份",
          sub: "导入后当前数据将被完全覆盖，请确认备份内容正确",
          size: "lg",
          render(api) {
            api.body.appendChild(
              h("div", { class: "stack-16" }, [
                field("选择备份文件", file),
                field("备份内容", ta),
                h("div", { class: "advice warn", text: "导入会覆盖当前全部数据，包括用户、知识库、任务、提交记录与日志。" }),
                err,
              ])
            );
            api.setFooter([
              h("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              h("button", {
                class: "btn btn-danger",
                text: "确认导入并覆盖",
                onclick() {
                  try {
                    ZK.db.importJson(ta.value);
                    ZK.db.log("导入数据", "从备份导入了平台数据", "warn");
                    api.close();
                    ZK.toast("数据已导入，页面即将刷新");
                    setTimeout(() => location.reload(), 700);
                  } catch (e) {
                    err.textContent = "导入失败：" + e.message;
                    err.classList.remove("hidden");
                  }
                },
              }),
            ]);
          },
        });
      }

      function resetData() {
        ZK.confirm({
          title: "恢复演示初始数据",
          message: "将清空当前所有改动（新建的知识库、提交的作品、迁移的布局、产生的日志），恢复为演示初始状态。<br><br><b>⚠️ 此操作不可撤销。</b>",
          okText: "确认恢复",
          danger: true,
        }).then((ok) => {
          if (!ok) return;
          ZK.db.reset();
          ZK.toast("已恢复演示初始数据，页面即将刷新");
          setTimeout(() => location.reload(), 700);
        });
      }
    },
  };

  /* 集合用途注解 */
  const DB_NOTE = {
    users: "平台账号", permissions: "角色权限", courses: "课程", classes: "班级", learners: "学生",
    knowledgeBases: "知识库", kbDocs: "知识库文档", kbFragments: "上下文补充分片", resources: "在线课程资源",
    libraryBooks: "课程文献库书目", scenes: "AI 实训场景", practiceSessions: "实训会话", imageSubmissions: "图片评分提交",
    tasks: "作品型任务", submissions: "学生作品提交", safetyKeywords: "敏感关键词库", ignoreWords: "忽略词库",
    nameLists: "用户黑白名单", posts: "平台发布内容", safetyDocs: "待检测文档", safetyVideos: "待检测视频",
    safetyRecords: "内容检测记录", knowledgePoints: "知识点", learningRecords: "学习记录", graphNodes: "图谱节点",
    graphEdges: "图谱关系", literature: "教师文献", portalConfig: "门户配置", dataSources: "数据源",
    notifications: "通知", notices: "教学公告", literatureParses: "文献解析结果", bookReads: "图书解读结果",
    pathPlans: "学习路径方案", profiles: "学情画像留档", importBatches: "资源导入批次",
    kbSyncLogs: "资源同步记录", retrievalLogs: "检索日志", portalSaves: "门户保存记录", logs: "操作日志",
  };
})();
