/* ============================================================
   views-class.js —— 课前导学 / 课堂互动 / 作业与测验
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.Store, U = global.UI;
  var V = global.Views = global.Views || {};
  function go(h) { global.App.go(h); }
  function save() { S.save(); }

  var STUDENTS = ['李思远', '陈可欣', '赵明宇', '周雨桐', '吴嘉禾', '孙岚', '郑一诺', '冯书瑶', '钱思齐', '许清和',
    '何雨薇', '郭子铭', '罗嘉言', '梁雨萱', '谢知行', '唐嘉宁', '韩其琛', '曹语彤', '邓皓月', '曾令仪'];
  function studentNo(i) { return '2024110' + (200 + i * 7); }

  /* ==========================================================
     课前导学
     ========================================================== */
  V.pre = {
    title: '课前导学',
    crumb: ['课堂教学', '课前导学'],
    html: function () {
      var c = S.currentCourse(), d = S.db();
      var items = d.preStudy.filter(function (p) { return p.courseId === c.id; });
      var totalTarget = items.reduce(function (a, b) { return a + b.target; }, 0);
      var totalDone = items.reduce(function (a, b) { return a + b.done; }, 0);

      return `
      <div class="page-head">
        <div><div class="page-title">课前导学</div>
        <div class="page-desc">将章节知识点视频与拓展阅读书目发放给学生自主学习，学习进度实时回流至学情数据</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/app">教材运行</button>
          <button class="btn btn-primary" data-act="assign">${S.icon('send')} 发放学习资源</button>
        </div>
      </div>

      <div class="grid g-4">
        <div class="stat"><div class="stat-t">已发放资源</div><div class="stat-v">${items.length}<small>项</small></div>
          <div class="stat-f">视频 ${items.filter(function (i) { return i.kind === '视频'; }).length} · 拓展阅读 ${items.filter(function (i) { return i.kind === '拓展阅读'; }).length}</div>
          <div class="stat-ico">${S.icon('play')}</div></div>
        <div class="stat"><div class="stat-t">应完成人次</div><div class="stat-v">${totalTarget}<small>人次</small></div>
          <div class="stat-f">覆盖 ${c.classes} 个教学班</div><div class="stat-ico">${S.icon('users')}</div></div>
        <div class="stat"><div class="stat-t">已完成人次</div><div class="stat-v">${totalDone}<small>人次</small></div>
          <div class="stat-f">完成率 ${totalTarget ? Math.round(totalDone / totalTarget * 100) : 0}%</div>
          <div class="stat-ico">${S.icon('check')}</div></div>
        <div class="stat"><div class="stat-t">平均学习时长</div><div class="stat-v">19<small>分 12 秒</small></div>
          <div class="stat-f">较上周 ↑ 2 分 40 秒</div><div class="stat-ico">${S.icon('clock')}</div></div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h"><h3>已发放的自主学习资源</h3><span class="sub">课前环节</span>
          <div class="right"><button class="btn btn-sm" data-go="#/app">教材运行</button></div>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>资源名称</th><th>环节类型</th><th>所属章节</th><th>完成进度</th><th>平均学习时长</th><th>操作</th></tr></thead>
          <tbody>${items.length ? items.map(function (p) {
            var pct = p.target ? Math.round(p.done / p.target * 100) : 0;
            return `<tr>
              <td>${S.esc(p.title)}</td>
              <td><span class="tag ${p.kind === '视频' ? '' : 'info'}">${p.kind}</span></td>
              <td>${S.esc(p.chapter)}</td>
              <td style="min-width:170px">
                <div style="display:flex;align-items:center;gap:9px">
                  <div class="prog" style="flex:1"><i style="width:${pct}%"></i></div>
                  <span class="num" style="font-size:12px;color:var(--muted)">${p.done}/${p.target}</span>
                </div>
              </td>
              <td class="num">${p.avgTime}</td>
              <td class="ops">
                <span class="tlink" data-detail="${p.id}">学习明细</span>
                <span class="tlink" data-remind="${p.id}">提醒未完成</span>
              </td>
            </tr>`;
          }).join('') : `<tr><td colspan="6"><div class="empty">${S.icon('play')}<div>还没有发放课前资源</div>
            <button class="btn btn-primary" style="margin-top:12px" data-act="assign">发放学习资源</button></div></td></tr>`}</tbody>
        </table></div>
      </div>

      <div class="grid g-2" style="margin-top:16px">
        <div class="card"><div class="card-h"><h3>课前环节完成度</h3></div>
          <div class="card-b">${U.barChart(items.map(function (p) { return { label: p.kind === '视频' ? '视频学习' : '拓展阅读', value: p.target ? Math.round(p.done / p.target * 100) : 0 }; }), { height: 176 })}</div>
        </div>
        <div class="card"><div class="card-h"><h3>课前—课中—课后闭环</h3></div>
          <div class="card-b">
            <div class="rowline"><span class="tag">课前</span><span style="flex:1">知识点视频 + 拓展阅读，学生自主完成</span><b style="color:var(--primary)">${totalDone} 人次</b></div>
            <div class="rowline"><span class="tag info">课中</span><span style="flex:1">签到、选人、抢答、投票、主题讨论激活课堂</span><b style="color:var(--primary)">${d.activities.length} 场</b></div>
            <div class="rowline"><span class="tag ok">课后</span><span style="flex:1">作业库发放作业，检验学习效果并批改反馈</span><b style="color:var(--primary)">${d.homework.filter(function (h) { return h.courseId === c.id; }).length} 项</b></div>
          </div>
        </div>
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        if (e.target.closest('[data-act="assign"]')) { openAssign(); return; }
        var dt = e.target.closest('[data-detail]');
        if (dt) { openStudyDetail(dt.getAttribute('data-detail')); return; }
        var rm = e.target.closest('[data-remind]');
        if (rm) {
          var p = S.db().preStudy.filter(function (x) { return x.id === rm.getAttribute('data-remind'); })[0];
          U.toast('已通过 APP 推送提醒 ' + (p.target - p.done) + ' 名学生');
        }
      });
    }
  };

  function openAssign() {
    var c = S.currentCourse();
    var res = S.courseResources(c.id);
    U.modal({
      title: '发放课前学习资源',
      sub: '学生通过移动端 APP 接收并完成',
      size: 'wide',
      body: `<div class="form-grid">
        <div>
          <div style="font-size:13px;color:var(--ink-2);margin-bottom:8px">选择资源</div>
          <div style="max-height:200px;overflow:auto">
            ${res.map(function (r) {
              return `<div class="res-pick" data-ar="${r.id}">
                <div class="ri">${S.icon(r.type === 'video' ? 'play' : 'doc')}</div>
                <div class="rm"><strong>${S.esc(r.name)}</strong><span>${S.esc(r.chapter)} · ${r.duration}</span></div>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="form-grid c3">
          <label class="field"><span>环节类型</span><select id="arKind"><option>视频</option><option>拓展阅读</option></select></label>
          <label class="field"><span>所属章节</span><select id="arCh">${c.chapters.map(function (ch) { return `<option>${S.esc(ch.name)}</option>`; }).join('')}</select></label>
          <label class="field"><span>发放班级</span><select id="arClass"><option>全部教学班</option><option>2024 级临床医学 1 班</option><option>2024 级临床医学 2 班</option></select></label>
        </div>
        <label class="field"><span>学习要求</span><textarea id="arDesc">课前完成视频观看并提交 1 条学习疑问</textarea></label>
        <div class="login-err" id="arErr"></div>
      </div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="arOk">立即发放</button>',
      onMount: function (api) {
        var picked = null;
        api.el.addEventListener('click', function (e) {
          var p = e.target.closest('[data-ar]');
          if (!p) return;
          picked = p.getAttribute('data-ar');
          api.el.querySelectorAll('.res-pick').forEach(function (x) { x.classList.remove('on'); });
          p.classList.add('on');
        });
        api.el.querySelector('#arOk').addEventListener('click', function () {
          if (!picked) { api.el.querySelector('#arErr').textContent = '请选择要发放的资源'; return; }
          var r = S.resource(picked);
          S.db().preStudy.push({
            id: S.uid('p'), courseId: S.currentCourse().id,
            chapter: api.el.querySelector('#arCh').value,
            kind: api.el.querySelector('#arKind').value,
            title: r.name, target: S.currentCourse().students, done: 0, avgTime: '—'
          });
          save(); api.close(); U.toast('已发放，学生可在学习端看到'); global.App.render();
        });
      }
    });
  }

  function openStudyDetail(pid) {
    var p = S.db().preStudy.filter(function (x) { return x.id === pid; })[0];
    var rows = STUDENTS.map(function (n, i) {
      var done = i < Math.round(STUDENTS.length * (p.done / p.target));
      return `<tr><td>${n}</td><td class="num">${studentNo(i)}</td>
        <td>${done ? '<span class="tag ok">已完成</span>' : '<span class="tag warn">进行中</span>'}</td>
        <td class="num">${done ? (12 + (i % 9)) + ' 分 ' + (10 + i) + ' 秒' : (3 + (i % 5)) + ' 分'}</td>
        <td class="num">${done ? (i % 2 === 0 ? '1' : '0') : '0'}</td></tr>`;
    }).join('');
    U.modal({
      title: '学习明细', sub: S.esc(p.title), size: 'wide',
      body: `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>学生</th><th>学号</th><th>状态</th><th>学习时长</th><th>提问数</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`,
      footer: '<button class="btn left" id="exBtn">' + S.icon('download') + ' 导出明细</button><button class="btn btn-primary" data-close>关闭</button>',
      onMount: function (api) {
        api.el.querySelector('#exBtn').addEventListener('click', function () {
          var data = [['学生', '学号', '状态', '学习时长', '提问数']];
          STUDENTS.forEach(function (n, i) {
            var done = i < Math.round(STUDENTS.length * (p.done / p.target));
            data.push([n, studentNo(i), done ? '已完成' : '进行中', done ? (12 + i % 9) + '分' : (3 + i % 5) + '分', done ? (i % 2) : 0]);
          });
          S.downloadFile('课前学习明细_' + p.title.slice(0, 8) + '.csv', S.toCSV(data));
          U.toast('明细已导出');
        });
      }
    });
  }

  /* ==========================================================
     课堂互动
     ========================================================== */
  var liveTimer = null;

  V.live = {
    title: '课堂互动',
    crumb: ['课堂教学', '课堂互动'],
    html: function () {
      var d = S.db(), c = S.currentCourse();
      var acts = d.activities.filter(function (a) { return a.courseId === c.id; });
      var active = acts.filter(function (a) { return a.status === '进行中'; });
      var widgets = [
        { type: '签到', icon: 'check', desc: '学生扫码/定位签到，实时统计出勤' },
        { type: '选人', icon: 'user', desc: '随机抽取学生回答问题，可排除已选' },
        { type: '抢答', icon: 'flag', desc: '发布题目，学生抢答并计入课堂表现分' },
        { type: '投票', icon: 'chart', desc: '即时投票，结果可视化展示' },
        { type: '主题讨论', icon: 'chat', desc: '发布议题，学生跟帖互评' }
      ];

      return `
      <div class="page-head">
        <div><div class="page-title">课堂互动</div>
        <div class="page-desc">通过活动控件发起教学活动激活课堂，参与数据自动计入课堂表现</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/app">教材运行</button>
          <button class="btn" data-go="#/pre">课前导学</button>
        </div>
      </div>

      <div class="grid g-4" style="margin-bottom:16px">
        <div class="stat"><div class="stat-t">累计活动场次</div><div class="stat-v">${acts.length}<small>场</small></div>
          <div class="stat-f">本学期课堂互动</div><div class="stat-ico">${S.icon('chat')}</div></div>
        <div class="stat"><div class="stat-t">进行中活动</div><div class="stat-v">${active.length}<small>场</small></div>
          <div class="stat-f">${active.length ? '活动进行中，可实时查看' : '暂无进行中的活动'}</div><div class="stat-ico">${S.icon('wifi')}</div></div>
        <div class="stat"><div class="stat-t">平均参与率</div><div class="stat-v">${acts.length ? Math.round(acts.reduce(function (a, b) { return a + (b.joined / b.total); }, 0) / acts.length * 100) : 0}<small>%</small></div>
          <div class="stat-f">覆盖 ${c.students} 名学生</div><div class="stat-ico">${S.icon('users')}</div></div>
        <div class="stat"><div class="stat-t">课堂表现记录</div><div class="stat-v">${acts.reduce(function (a, b) { return a + b.joined; }, 0)}<small>人次</small></div>
          <div class="stat-f">已同步至学情档案</div><div class="stat-ico">${S.icon('chart')}</div></div>
      </div>

      ${active.length ? active.map(function (a) {
        var pct = Math.round(a.joined / a.total * 100);
        return `<div class="card" style="margin-bottom:16px;border-color:var(--primary-200)">
          <div class="card-h"><h3>${S.esc(a.title)}</h3><span class="tag ok">进行中</span>
            <span class="sub">${a.type} · 发起于 ${a.createdAt}</span>
            <div class="right">
              <button class="btn btn-sm" data-go="#/app">教材运行</button>
              <button class="btn btn-sm btn-primary" data-end="${a.id}">结束活动</button>
            </div>
          </div>
          <div class="card-b">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
              <div class="prog" style="flex:1;height:10px"><i style="width:${pct}%"></i></div>
              <b class="num" style="font-size:18px">${a.joined}<span style="color:var(--muted);font-size:13px">/${a.total}</span></b>
            </div>
            ${a.type === '投票' ? `<div class="grid g-2">
              ${a.options.map(function (o) {
                var op = Math.round(o.votes / Math.max(1, a.joined) * 100);
                return `<div class="vote-opt"><span class="vo-name">${S.esc(o.name)}</span>
                  <div class="prog" style="flex:1"><i style="width:${op}%"></i></div>
                  <b class="num" style="font-size:12.5px;width:52px;text-align:right">${o.votes} 票</b></div>`;
              }).join('')}</div>`
              : a.type === '主题讨论' ? `<div style="display:grid;gap:9px">
                  ${(a.posts || []).slice(-3).map(function (p) {
                    return `<div class="list-line" style="padding:8px 0"><div class="avatar-sm">${p.name.slice(0, 1)}</div>
                      <div class="ll-main"><strong style="font-weight:400">${S.esc(p.text)}</strong><span>${S.esc(p.name)} · ${p.time}</span></div></div>`;
                  }).join('') || '<div class="hint">等待学生提交观点…</div>'}
                </div>`
              : a.type === '签到' ? `<div class="hint">已签到 ${a.signed || 0} 人，未签到 ${a.total - (a.signed || 0)} 人；签到码 <b style="color:var(--primary);letter-spacing:2px">${a.code || '—'}</b></div>`
              : a.type === '选人' ? `<div class="hint">已抽取：<b style="color:var(--primary)">${(a.picked || []).join('、') || '尚未抽取'}</b></div>`
              : `<div class="hint">抢答成功：<b style="color:var(--primary)">${S.esc((a.first || '等待学生抢答…'))}</b></div>`}
          </div>
        </div>`;
      }).join('') : ''}

      <div class="card">
        <div class="card-h"><h3>活动控件</h3><span class="sub">一键发起，激活课堂</span></div>
        <div class="card-b">
          <div class="grid g-3">
            ${widgets.map(function (w) {
              return `<div class="card" style="box-shadow:none">
                <div class="card-b">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                    <div class="tp-ico">${S.icon(w.icon)}</div>
                    <b style="font-size:14px">${w.type}</b>
                    <button class="btn btn-sm btn-primary" style="margin-left:auto" data-start="${w.type}">发起</button>
                  </div>
                  <div class="hint">${w.desc}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h"><h3>活动记录</h3><span class="sub">全部历史活动</span>
          <div class="right"><button class="btn btn-sm" data-act="export-acts">${S.icon('download')} 导出记录</button></div>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>活动名称</th><th>类型</th><th>发起时间</th><th>参与人数</th><th>参与率</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${acts.slice().reverse().map(function (a) {
            var pct = Math.round(a.joined / a.total * 100);
            return `<tr>
              <td>${S.esc(a.title)}</td><td><span class="tag line">${a.type}</span></td>
              <td class="num">${a.createdAt}</td><td class="num">${a.joined}/${a.total}</td>
              <td class="num">${pct}%</td><td>${U.statusTag(a.status)}</td>
              <td class="ops"><span class="tlink" data-view="${a.id}">查看结果</span>
              ${a.status === '进行中' ? `<span class="tlink danger" data-end="${a.id}">结束</span>` : ''}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var st = e.target.closest('[data-start]');
        if (st) { openActivity(st.getAttribute('data-start')); return; }
        var en = e.target.closest('[data-end]');
        if (en) {
          var a = S.db().activities.filter(function (x) { return x.id === en.getAttribute('data-end'); })[0];
          if (a) { a.status = '已结束'; save(); U.toast('活动已结束'); global.App.render(); }
          return;
        }
        var vw = e.target.closest('[data-view]');
        if (vw) { openActivityResult(vw.getAttribute('data-view')); return; }
        if (e.target.closest('[data-act="export-acts"]')) {
          var rows = [['活动名称', '类型', '发起时间', '参与人数', '总人数', '参与率', '状态']];
          S.db().activities.forEach(function (a) {
            rows.push([a.title, a.type, a.createdAt, a.joined, a.total, Math.round(a.joined / a.total * 100) + '%', a.status]);
          });
          S.downloadFile('课堂活动记录_' + S.fmtDate() + '.csv', S.toCSV(rows));
          U.toast('活动记录已导出');
        }
      });
      // 实时刷新进行中的活动数据（学生参与后同步）
      liveTimer = setInterval(function () {
        var has = S.db().activities.some(function (a) { return a.status === '进行中'; });
        if (has && location.hash.indexOf('#/live') === 0 && !document.querySelector('.modal-mask')) global.App.render(true);
      }, 2600);
      global.App.timers.push(liveTimer);
    }
  };

  function openActivity(type) {
    var c = S.currentCourse();
    var body = `<div class="form-grid">
      <label class="field"><span class="req">活动名称</span><input id="acTitle" value="${type}：${c.chapters[0].name.replace(/^\S+章\s*/, '')}课堂互动" /></label>
      <div class="form-grid c2">
        <label class="field"><span>限时（分钟）</span><input id="acDur" type="number" value="${type === '签到' ? 3 : type === '投票' ? 5 : 8}" /></label>
        <label class="field"><span>参与班级</span><select><option>全部教学班</option><option>2024 级临床医学 1 班</option><option>2024 级临床医学 2 班</option></select></label>
      </div>
      ${type === '投票' ? `<div>
        <div style="font-size:13px;color:var(--ink-2);margin-bottom:8px">投票选项</div>
        <div id="optWrap">
          ${['选项一', '选项二', '选项三'].map(function (v, i) {
            return `<div class="opt-line"><span class="idx">${i + 1}</span><input value="${v}" /></div>`;
          }).join('')}
        </div>
        <button class="btn btn-sm" id="addOpt">${S.icon('plus')} 添加选项</button>
      </div>` : ''}
      ${type === '抢答' ? `<label class="field"><span>抢答题目</span><textarea id="acQ">患者男性，65 岁，COPD 急性加重入院，首选影像学检查是什么？并说明理由。</textarea></label>` : ''}
      ${type === '主题讨论' ? `<label class="field"><span>讨论议题</span><textarea id="acQ">社区获得性肺炎经验性抗感染方案的选择依据有哪些？请结合指南说明。</textarea></label>` : ''}
      ${type === '选人' ? `<label class="field"><span>抽取人数</span><input id="acNum" type="number" value="3" /></label>` : ''}
      ${type === '签到' ? `<div class="hint" style="border:1px dashed var(--line);border-radius:10px;padding:12px;background:#FAFCFF">发起后系统将生成 4 位签到码，学生在 APP 内输入完成签到，支持定位校验。</div>` : ''}
      <div class="login-err" id="acErr"></div>
    </div>`;
    U.modal({
      title: '发起' + type,
      sub: '发起后学生可实时参与',
      body: body,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="acOk">立即发起</button>',
      onMount: function (api) {
        var addOpt = api.el.querySelector('#addOpt');
        if (addOpt) addOpt.addEventListener('click', function () {
          var wrap = api.el.querySelector('#optWrap');
          var n = wrap.children.length;
          if (n >= 6) { U.toast('最多 6 个选项'); return; }
          var div = document.createElement('div');
          div.className = 'opt-line';
          div.innerHTML = `<span class="idx">${n + 1}</span><input value="选项${['一', '二', '三', '四', '五', '六'][n]}" />`;
          wrap.appendChild(div);
        });
        api.el.querySelector('#acOk').addEventListener('click', function () {
          var title = api.el.querySelector('#acTitle').value.trim();
          if (!title) { api.el.querySelector('#acErr').textContent = '请填写活动名称'; return; }
          var c2 = S.currentCourse();
          var act = {
            id: S.uid('a'), courseId: c2.id, type: type, title: title,
            status: '进行中', createdAt: S.fmtTime(), duration: S.num((api.el.querySelector('#acDur') || {}).value, 5),
            total: c2.students, joined: 0, options: [], responses: []
          };
          if (type === '投票') {
            act.options = Array.prototype.map.call(api.el.querySelectorAll('#optWrap input'), function (inp) {
              return { name: inp.value.trim() || '未命名选项', votes: 0 };
            });
          }
          if (type === '签到') act.code = String(1000 + Math.floor(Math.random() * 8999));
          if (type === '选人') act.picked = [];
          if (type === '主题讨论') act.posts = [];
          S.db().activities.push(act);
          save(); api.close(); U.toast(type + '已发起，学生可参与'); global.App.render();
        });
      }
    });
  }

  function openActivityResult(aid) {
    var a = S.db().activities.filter(function (x) { return x.id === aid; })[0];
    var rows = STUDENTS.slice(0, 10).map(function (n, i) {
      var joined = i < Math.round(10 * (a.joined / a.total));
      var val = a.type === '投票' ? (a.options[i % a.options.length] || {}).name : a.type === '签到' ? (joined ? '已签到' : '未签到') : joined ? '已参与' : '未参与';
      return `<tr><td>${n}</td><td class="num">${studentNo(i)}</td><td>${joined ? '<span class="tag ok">已参与</span>' : '<span class="tag gray">未参与</span>'}</td><td>${S.esc(val || '—')}</td><td class="num">${a.createdAt}</td></tr>`;
    }).join('');
    U.modal({
      title: '活动结果', sub: S.esc(a.title), size: 'wide',
      body: `<div class="grid g-2" style="margin-bottom:14px">
        <div class="stat" style="box-shadow:none"><div class="stat-t">参与人数</div><div class="stat-v">${a.joined}<small>/${a.total}</small></div></div>
        <div class="stat" style="box-shadow:none"><div class="stat-t">参与率</div><div class="stat-v">${Math.round(a.joined / a.total * 100)}<small>%</small></div></div>
      </div>
      ${a.type === '投票' ? U.barChart(a.options.map(function (o) { return { label: o.name, value: o.votes }; }), { height: 180 }) : ''}
      <div class="tbl-wrap" style="margin-top:10px"><table class="tbl">
        <thead><tr><th>学生</th><th>学号</th><th>参与状态</th><th>作答内容</th><th>参与时间</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`,
      footer: '<button class="btn btn-primary" data-close>关闭</button>'
    });
  }

  /* ==========================================================
     作业与测验
     ========================================================== */
  V.homework = {
    title: '作业与测验',
    crumb: ['课堂教学', '作业与测验'],
    html: function () {
      var c = S.currentCourse(), d = S.db();
      var hw = d.homework.filter(function (h) { return h.courseId === c.id; });
      var quizRes = S.courseResources(c.id).filter(function (r) { return r.type === 'quiz'; });
      var doneCount = hw.reduce(function (a, b) { return a + b.submitted; }, 0);
      var pending = hw.reduce(function (a, b) { return a + (b.submitted - b.graded); }, 0);

      return `
      <div class="page-head">
        <div><div class="page-title">作业与测验</div>
        <div class="page-desc">从作业库与题库发放作业和测验，教师在线批改并生成成绩统计</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/app">教材运行</button>
          <button class="btn" data-act="new-quiz">${S.icon('check')} 发放测验</button>
          <button class="btn btn-primary" data-act="new-hw">${S.icon('edit')} 发放作业</button>
        </div>
      </div>

      <div class="grid g-4">
        <div class="stat"><div class="stat-t">已发放作业</div><div class="stat-v">${hw.length}<small>项</small></div>
          <div class="stat-f">作业库共 26 项可选</div><div class="stat-ico">${S.icon('edit')}</div></div>
        <div class="stat"><div class="stat-t">已提交人次</div><div class="stat-v">${doneCount}<small>人次</small></div>
          <div class="stat-f">提交率 ${hw.length ? Math.round(doneCount / hw.reduce(function (a, b) { return a + b.total; }, 0) * 100) : 0}%</div>
          <div class="stat-ico">${S.icon('upload')}</div></div>
        <div class="stat"><div class="stat-t">待批改</div><div class="stat-v">${pending}<small>份</small></div>
          <div class="stat-f">建议 48 小时内完成</div><div class="stat-ico">${S.icon('clock')}</div></div>
        <div class="stat"><div class="stat-t">平均得分率</div><div class="stat-v">${hw.filter(function (h) { return h.avg; }).length ? Math.round(hw.filter(function (h) { return h.avg; }).reduce(function (a, b) { return a + b.avg / b.score; }, 0) / hw.filter(function (h) { return h.avg; }).length * 100) : 0}<small>%</small></div>
          <div class="stat-f">按满分折算</div><div class="stat-ico">${S.icon('chart')}</div></div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h"><h3>作业列表</h3><span class="sub">课后环节</span></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>作业名称</th><th>章节</th><th>截止时间</th><th>提交情况</th><th>批改进度</th><th>平均分</th><th>操作</th></tr></thead>
          <tbody>${hw.length ? hw.map(function (h) {
            var subPct = Math.round(h.submitted / h.total * 100);
            var grPct = Math.round(h.graded / Math.max(1, h.submitted) * 100);
            return `<tr>
              <td>${S.esc(h.title)}<div class="hint">${S.esc(h.require)}</div></td>
              <td>${S.esc(h.chapter)}</td><td class="num">${h.due}</td>
              <td style="min-width:150px"><div style="display:flex;align-items:center;gap:8px">
                <div class="prog" style="flex:1"><i style="width:${subPct}%"></i></div>
                <span class="num" style="font-size:12px;color:var(--muted)">${h.submitted}/${h.total}</span></div></td>
              <td style="min-width:140px"><div style="display:flex;align-items:center;gap:8px">
                <div class="prog ${grPct === 100 ? 'ok' : 'warn'}" style="flex:1"><i style="width:${grPct}%"></i></div>
                <span class="num" style="font-size:12px;color:var(--muted)">${h.graded}/${h.submitted}</span></div></td>
              <td class="num">${h.avg ? h.avg.toFixed(1) + ' / ' + h.score : '—'}</td>
              <td class="ops"><span class="tlink" data-grade="${h.id}">批改</span>
                <span class="tlink" data-hwdetail="${h.id}">提交明细</span>
                <span class="tlink danger" data-hwdel="${h.id}">撤回</span></td>
            </tr>`;
          }).join('') : `<tr><td colspan="7"><div class="empty">${S.icon('edit')}<div>还没有发放作业</div>
            <button class="btn btn-primary" style="margin-top:12px" data-act="new-hw">发放作业</button></div></td></tr>`}</tbody>
        </table></div>
      </div>

      <div class="grid g-2" style="margin-top:16px">
        <div class="card"><div class="card-h"><h3>测验卷库</h3><span class="sub">${quizRes.length} 套</span></div>
          <div class="card-b tight">
            ${quizRes.map(function (r) {
              return `<div class="list-line"><div class="avatar-sm">测</div>
                <div class="ll-main"><strong>${S.esc(r.name)}</strong><span>${S.esc(r.chapter)} · ${r.duration}</span></div>
                <button class="btn btn-sm" data-issue="${r.id}">发放</button></div>`;
            }).join('') || '<div class="empty">题库中暂无测验卷</div>'}
          </div>
        </div>
        <div class="card"><div class="card-h"><h3>提交趋势</h3><span class="sub">近 7 天</span></div>
          <div class="card-b">${U.barChart([
            { label: '周一', value: 8 }, { label: '周二', value: 15 }, { label: '周三', value: 22 },
            { label: '周四', value: 17 }, { label: '周五', value: 26 }, { label: '周六', value: 11 }, { label: '周日', value: 6 }
          ], { height: 176 })}</div>
        </div>
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        if (e.target.closest('[data-act="new-hw"]')) { openNewHomework(); return; }
        if (e.target.closest('[data-act="new-quiz"]')) { openNewQuiz(); return; }
        var g = e.target.closest('[data-grade]');
        if (g) { openGrade(g.getAttribute('data-grade')); return; }
        var d = e.target.closest('[data-hwdetail]');
        if (d) { openSubmitDetail(d.getAttribute('data-hwdetail')); return; }
        var iss = e.target.closest('[data-issue]');
        if (iss) { issueQuiz(iss.getAttribute('data-issue')); return; }
        var del = e.target.closest('[data-hwdel]');
        if (del) {
          var id = del.getAttribute('data-hwdel');
          U.confirm('撤回作业', '撤回后学生将不再看到该作业，已提交的记录保留。', '撤回', true).then(function (ok) {
            if (!ok) return;
            S.db().homework = S.db().homework.filter(function (x) { return x.id !== id; });
            save(); U.toast('作业已撤回'); global.App.render();
          });
        }
      });
    }
  };

  function openNewHomework() {
    var c = S.currentCourse();
    var bank = ['肺功能报告解读 5 例', '动脉血气分析判读练习', '心衰患者长期管理方案设计', '病例摘要撰写（呼吸系统）', '心电图判读 10 例', '临床用药禁忌梳理'];
    U.modal({
      title: '发放作业', sub: '从作业库中选取或新建',
      body: `<div class="form-grid">
        <label class="field"><span>从作业库选择</span><select id="hwBank">
          ${bank.map(function (b) { return `<option>${b}</option>`; }).join('')}
          <option value="__new">＋ 新建作业</option>
        </select></label>
        <label class="field"><span class="req">作业名称</span><input id="hwTitle" value="${bank[0]}" /></label>
        <div class="form-grid c3">
          <label class="field"><span>所属章节</span><select id="hwCh">${c.chapters.map(function (ch) { return `<option>${S.esc(ch.name)}</option>`; }).join('')}</select></label>
          <label class="field"><span>截止时间</span><input type="date" id="hwDue" value="${S.fmtDate(new Date(Date.now() + 7 * 864e5))}" /></label>
          <label class="field"><span>满分</span><input id="hwScore" type="number" value="10" /></label>
        </div>
        <label class="field"><span>提交要求</span><textarea id="hwReq">PDF 格式提交，需标注判断依据</textarea></label>
      </div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="hwOk">发放作业</button>',
      onMount: function (api) {
        api.el.querySelector('#hwBank').addEventListener('change', function () {
          if (this.value !== '__new') api.el.querySelector('#hwTitle').value = this.value;
          else api.el.querySelector('#hwTitle').value = '';
        });
        api.el.querySelector('#hwOk').addEventListener('click', function () {
          var title = api.el.querySelector('#hwTitle').value.trim();
          if (!title) { U.toast('请填写作业名称', 'err'); return; }
          S.db().homework.push({
            id: S.uid('h'), courseId: c.id, title: title, chapter: api.el.querySelector('#hwCh').value,
            due: api.el.querySelector('#hwDue').value, require: api.el.querySelector('#hwReq').value.trim(),
            score: S.num(api.el.querySelector('#hwScore').value, 10), total: c.students,
            submitted: 0, graded: 0, avg: 0, subs: []
          });
          save(); api.close(); U.toast('作业已发放，学生可在学习端看到'); global.App.render();
        });
      }
    });
  }

  function openNewQuiz() {
    var c = S.currentCourse();
    var quiz = S.courseResources(c.id).filter(function (r) { return r.type === 'quiz'; });
    U.modal({
      title: '发放测验', sub: '限时测验，自动判分',
      body: `<div class="form-grid">
        <label class="field"><span class="req">选择测验卷</span><select id="qzSel">
          ${quiz.map(function (r) { return `<option value="${r.id}">${S.esc(r.name)}（${r.duration}）</option>`; }).join('')}
        </select></label>
        <div class="form-grid c3">
          <label class="field"><span>限时（分钟）</span><input id="qzMin" type="number" value="20" /></label>
          <label class="field"><span>开放时间</span><input type="date" value="${S.fmtDate()}" /></label>
          <label class="field"><span>允许次数</span><input type="number" value="1" /></label>
        </div>
        <div class="rowline"><span style="flex:1">答完立即显示成绩</span><div class="switch on" id="qzS1"></div></div>
        <div class="rowline"><span style="flex:1">错题自动归集到错题本</span><div class="switch on" id="qzS2"></div></div>
      </div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="qzOk">发放测验</button>',
      onMount: function (api) {
        ['#qzS1', '#qzS2'].forEach(function (s) {
          var el = api.el.querySelector(s);
          el.addEventListener('click', function () { el.classList.toggle('on'); });
        });
        api.el.querySelector('#qzOk').addEventListener('click', function () {
          var r = S.resource(api.el.querySelector('#qzSel').value);
          var t = S.allTasks(c.id).filter(function (x) { return x.type === 'quiz'; })[0];
          if (t) { t.title = '测验：' + r.name; t.duration = S.num(api.el.querySelector('#qzMin').value, 20); }
          S.db().homework.push({
            id: S.uid('h'), courseId: c.id, title: '测验：' + r.name, chapter: r.chapter,
            due: S.fmtDate(new Date(Date.now() + 3 * 864e5)), require: '限时 ' + S.num(api.el.querySelector('#qzMin').value, 20) + ' 分钟，自动判分',
            score: 100, total: c.students, submitted: 0, graded: 0, avg: 0, subs: []
          });
          save(); api.close(); U.toast('测验已发放'); global.App.render();
        });
      }
    });
  }

  function issueQuiz(rid) {
    var r = S.resource(rid), c = S.currentCourse();
    U.confirm('发放测验', '将《' + r.name + '》发放至 ' + c.name + '（' + c.students + ' 人），学生可在 APP 内作答。', '确认发放').then(function (ok) {
      if (!ok) return;
      S.db().homework.push({
        id: S.uid('h'), courseId: c.id, title: '测验：' + r.name, chapter: r.chapter,
        due: S.fmtDate(new Date(Date.now() + 3 * 864e5)), require: '限时 20 分钟，自动判分',
        score: 100, total: c.students, submitted: 0, graded: 0, avg: 0, subs: []
      });
      save(); U.toast('测验已发放'); global.App.render();
    });
  }

  function openGrade(hid) {
    var h = S.db().homework.filter(function (x) { return x.id === hid; })[0];
    var n = Math.min(h.submitted, 8);
    var rows = STUDENTS.slice(0, n).map(function (s, i) {
      var sc = h.graded > i ? (h.avg ? (Math.round(h.avg * 10) / 10) : (h.score * 0.8)) : '';
      return `<tr><td>${s}</td><td class="num">${studentNo(i)}</td>
        <td>${h.graded > i ? '<span class="tag ok">已批改</span>' : '<span class="tag warn">待批改</span>'}</td>
        <td><input class="btn" style="height:30px;width:74px;padding:0 8px" data-score="${i}" value="${sc}" placeholder="分数" /></td>
        <td><span class="tlink" data-preview-sub="${i}">查看附件</span></td></tr>`;
    }).join('');
    U.modal({
      title: '作业批改', sub: S.esc(h.title), size: 'wide',
      body: `<div class="hint" style="margin-bottom:12px">满分 ${h.score} 分 · 提交 ${h.submitted}/${h.total} 人 · 已批改 ${h.graded} 份 · 本次列出前 ${n} 份</div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>学生</th><th>学号</th><th>状态</th><th>得分</th><th>附件</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5"><div class="empty">暂无提交</div></td></tr>'}</tbody>
        </table></div>
        <label class="field" style="margin-top:14px"><span>统一评语</span><textarea id="grRemark">整体完成情况良好，注意补充判断依据与指南出处。</textarea></label>`,
      footer: '<button class="btn" data-close>关闭</button><button class="btn btn-primary" id="grOk">保存批改结果</button>',
      onMount: function (api) {
        api.el.addEventListener('click', function (e) {
          var p = e.target.closest('[data-preview-sub]');
          if (p) U.toast('已打开学生提交的 PDF 附件（第 ' + (parseInt(p.getAttribute('data-preview-sub'), 10) + 1) + ' 份）');
        });
        api.el.querySelector('#grOk').addEventListener('click', function () {
          var inputs = api.el.querySelectorAll('[data-score]');
          var sum = 0, cnt = 0;
          Array.prototype.forEach.call(inputs, function (inp) {
            var v = parseFloat(inp.value);
            if (!isNaN(v)) { sum += v; cnt++; }
          });
          if (!cnt) { U.toast('请至少为一名学生填写分数', 'err'); return; }
          h.graded = Math.max(h.graded || 0, cnt); h.avg = Math.round(sum / cnt * 10) / 10;
          save(); api.close(); U.toast('批改结果已保存，学生可查看'); global.App.render();
        });
      }
    });
  }

  function openSubmitDetail(hid) {
    var h = S.db().homework.filter(function (x) { return x.id === hid; })[0];
    var rows = STUDENTS.slice(0, 12).map(function (s, i) {
      var submitted = i < Math.round(12 * h.submitted / h.total);
      return `<tr><td>${s}</td><td class="num">${studentNo(i)}</td>
        <td>${submitted ? '<span class="tag ok">已提交</span>' : '<span class="tag gray">未提交</span>'}</td>
        <td class="num">${submitted ? S.fmtDate(daysAgoLocal(i % 5)) : '—'}</td>
        <td class="num">${submitted ? (h.avg ? (h.avg + (i % 3 - 1) * 0.4).toFixed(1) : '待批改') : '—'}</td></tr>`;
    }).join('');
    U.modal({
      title: '提交明细', sub: S.esc(h.title), size: 'wide',
      body: `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>学生</th><th>学号</th><th>提交状态</th><th>提交时间</th><th>得分</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`,
      footer: '<button class="btn left" id="exSub">' + S.icon('download') + ' 导出提交明细</button><button class="btn btn-primary" data-close>关闭</button>',
      onMount: function (api) {
        api.el.querySelector('#exSub').addEventListener('click', function () {
          var data = [['学生', '学号', '提交状态', '提交时间', '得分']];
          STUDENTS.forEach(function (s, i) {
            var submitted = i < Math.round(STUDENTS.length * h.submitted / h.total);
            data.push([s, studentNo(i), submitted ? '已提交' : '未提交', submitted ? S.fmtDate() : '—', submitted ? (h.avg || '待批改') : '—']);
          });
          S.downloadFile('作业提交明细_' + h.title.slice(0, 8) + '.csv', S.toCSV(data));
          U.toast('提交明细已导出');
        });
      }
    });
  }

  function daysAgoLocal(n) { var d = new Date(); d.setDate(d.getDate() - n); return d; }

  global.ClassViews = { STUDENTS: STUDENTS, studentNo: studentNo, openActivity: openActivity, openActivityResult: openActivityResult };
})(window);
