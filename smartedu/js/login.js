/* ==========================================================================
   登录页逻辑 — 账号校验 / 登录态持久化 / 找回密码完整流程
   ========================================================================== */
(function () {
  "use strict";

  ZK.db.load();

  const U = ZK.util;

  /* 已登录则直接进入系统 */
  if (ZK.db.getSession()) {
    location.replace("app.html");
    return;
  }

  /* ---------- 品牌图标与真实统计 ---------- */
  const mark = document.getElementById("brandMark");
  if (mark) mark.innerHTML = ZK.brandMark(20);

  (function fillMetrics() {
    const books = ZK.db.list("libraryBooks");
    const scenes = ZK.db.list("scenes");
    const users = ZK.db.list("users");
    const total = books.length + users.length + ZK.db.list("learners").length;
    const targets = ["m0", "m1", "m2"];
    const vals = [
      books.length + " 本",
      scenes.length + " 个",
      (users.length + ZK.db.list("learners").length) + " 人",
    ];
    targets.forEach((id, i) => {
      const node = document.getElementById(id);
      if (node) node.textContent = vals[i];
    });
    void total;
  })();

  /* ---------- 登录 ---------- */
  const form = document.getElementById("loginForm");
  const errBox = document.getElementById("errBox");
  const submitBtn = document.getElementById("submitBtn");

  function showError(msg) {
    errBox.textContent = msg;
    errBox.classList.remove("hidden");
  }

  function hideError() {
    errBox.classList.add("hidden");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    const account = document.getElementById("account").value.trim();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    if (!account) return showError("请输入账号");
    if (!password) return showError("请输入登录密码");

    submitBtn.disabled = true;
    submitBtn.textContent = "正在验证…";

    setTimeout(function () {
      const user = ZK.db
        .list("users")
        .find((u) => u.account.toLowerCase() === account.toLowerCase());

      submitBtn.disabled = false;
      submitBtn.textContent = "登 录";

      if (!user || user.password !== password) {
        ZK.db.log("登录失败", "账号 " + account + " 凭证不匹配", "warn");
        return showError("账号或密码不正确，请重新输入");
      }

      if (user.status === "disabled") {
        ZK.db.log("登录被拦截", "账号 " + account + " 已停用", "warn");
        return showError("该账号已停用，请联系教学技术支持中心");
      }

      ZK.db.log("登录成功", user.name + " 通过账号密码登录平台");
      ZK.db.setSession(user, remember);
      submitBtn.textContent = "进入平台…";
      setTimeout(() => location.replace("app.html"), 260);
    }, 420);
  });

  /* ---------- 找回密码（完整三步流程） ---------- */
  const forgotBtn = document.getElementById("forgotBtn");

  forgotBtn.addEventListener("click", function () {
    let step = 0;
    let targetUser = null;
    let issuedCode = null;
    let accountInput = null;

    const m = ZK.modal({
      title: "找回登录密码",
      sub: "通过教务绑定邮箱接收重置码，验证后设置新密码",
      size: "sm",
      render(api) {
        render();

        function render() {
          U.clear(api.body);
          api.setFooter([]);

          if (step === 0) {
            accountInput = U.el("input", {
              class: "input",
              placeholder: "请输入工号或学号",
              value: accountInput ? accountInput.value : "",
            });
            api.body.appendChild(
              U.el("div", { class: "stack-16" }, [
                U.el("div", { class: "field" }, [
                  U.el("label", { class: "label", text: "账号" }),
                  accountInput,
                  U.el("div", { class: "hint", text: "需与教务系统登记信息一致，重置码将发送至绑定邮箱" }),
                ]),
                U.el("div", { id: "fpErr", class: "login-err hidden" }),
              ])
            );
            api.setFooter([
              U.el("button", { class: "btn", text: "取消", onclick: () => api.close() }),
              U.el("button", {
                class: "btn btn-primary",
                text: "发送重置码",
                onclick() {
                  const acc = accountInput.value.trim();
                  const err = api.body.querySelector("#fpErr");
                  if (!acc) {
                    err.textContent = "请输入账号";
                    err.classList.remove("hidden");
                    return;
                  }
                  const u = ZK.db.list("users").find(
                    (x) => x.account.toLowerCase() === acc.toLowerCase()
                  );
                  if (!u) {
                    err.textContent = "未查询到该账号，请核对后重试";
                    err.classList.remove("hidden");
                    return;
                  }
                  targetUser = u;
                  issuedCode = String(Math.floor(100000 + Math.random() * 900000));
                  ZK.db.log("发起密码重置", "账号 " + u.account + " 重置码已下发至绑定邮箱");
                  step = 1;
                  render();
                },
              }),
            ]);
          }

          if (step === 1) {
            const codeInput = U.el("input", { class: "input", placeholder: "请输入 6 位重置码", maxlength: "6" });
            const pwdInput = U.el("input", { class: "input", type: "password", placeholder: "设置新密码（不少于 6 位）" });
            const pwd2Input = U.el("input", { class: "input", type: "password", placeholder: "再次确认新密码" });

            api.body.appendChild(
              U.el("div", { class: "stack-16" }, [
                U.el("div", {
                  class: "advice info",
                  html:
                    "重置码已发送至绑定邮箱 <b>" +
                    U.escapeHtml(targetUser.email) +
                    "</b>。当前演示环境直接展示收到的重置码：<b class='em mono'>" +
                    issuedCode +
                    "</b>",
                }),
                U.el("div", { class: "field" }, [
                  U.el("label", { class: "label", text: "重置码" }),
                  codeInput,
                ]),
                U.el("div", { class: "field" }, [
                  U.el("label", { class: "label", text: "新密码" }),
                  pwdInput,
                ]),
                U.el("div", { class: "field" }, [
                  U.el("label", { class: "label", text: "确认新密码" }),
                  pwd2Input,
                ]),
                U.el("div", { id: "fpErr2", class: "login-err hidden" }),
              ])
            );

            api.setFooter([
              U.el("button", {
                class: "btn",
                text: "上一步",
                onclick() {
                  step = 0;
                  render();
                },
              }),
              U.el("button", {
                class: "btn btn-primary",
                text: "重置密码",
                onclick() {
                  const err = api.body.querySelector("#fpErr2");
                  const fail = (t) => {
                    err.textContent = t;
                    err.classList.remove("hidden");
                  };
                  if (codeInput.value.trim() !== issuedCode) return fail("重置码不正确");
                  if (pwdInput.value.length < 6) return fail("新密码长度不足 6 位");
                  if (pwdInput.value !== pwd2Input.value) return fail("两次输入的密码不一致");

                  ZK.db.update("users", targetUser.id, { password: pwdInput.value });
                  ZK.db.log("密码重置完成", "账号 " + targetUser.account + " 已更新登录密码");
                  step = 2;
                  render();
                },
              }),
            ]);
          }

          if (step === 2) {
            api.body.appendChild(
              U.el("div", { class: "stack-16 center" }, [
                U.el("div", {
                  class: "stat-icon ic-emerald",
                  style: { width: "48px", height: "48px", margin: "0 auto", borderRadius: "14px" },
                  html: ZK.icons.check(22),
                }),
                U.el("div", {}, [
                  U.el("div", { class: "fs-15 fw-6 strong", text: "密码已重置" }),
                  U.el("div", {
                    class: "fs-12 faint mt-8",
                    html:
                      "账号 <b class='strong'>" +
                      U.escapeHtml(targetUser.account) +
                      "</b> 的新密码已生效，请使用新密码登录。",
                  }),
                ]),
              ])
            );
            api.setFooter([
              U.el("button", {
                class: "btn btn-primary",
                text: "返回登录",
                onclick() {
                  api.close();
                  document.getElementById("account").value = targetUser.account;
                  document.getElementById("password").value = "";
                  document.getElementById("password").focus();
                },
              }),
            ]);
          }
        }
      },
    });
    void m;
  });

  /* 聚焦 */
  const accEl = document.getElementById("account");
  if (accEl) accEl.focus();
})();
