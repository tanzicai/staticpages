/* ============================================================
   views-app.js —— 数字教材运行承载（教师端）
   课前：发放章节知识点视频 / 拓展阅读，学生自主学习
   课中：签到 / 选人 / 抢答 / 投票 / 主题讨论 活动控件发放
   课后：作业库发放作业，检验学习效果
   全部发放操作落库留痕，可导出
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.Store, U = global.UI;
  var V = global.Views = global.Views || {};
  var CV = global.ClassViews;
  function save() { S.save(); }

  function issues() {
    var d = S.db();
    if (!d.issues) d.issues = [];
    return d.issues;
  }

  V.app = {
    title: '教材运行',
    crumb: ['数字教材', '教材运行'],
    html: function () {
      var d = S.db(), c = S.currentCourse();
      var res = S.courseResources(c.id);
      var acts = d.activities.filter(function (a) { return a.courseId === c.id; });
      var running = acts.filter(function (a) { return a.status === '进行中'; });
      var hw = d.homework.filter(function (h) { return h.courseId === c.id; });
      var pre = d.preStudy.filter(function (p) { return p.courseId === c.id; });
      var pendingGraded = hw.reduce(function (a, b) { return a + b.submitted - b.graded; }, 0);

      return `
      <div class="page-head">
        <div><div class="page-title">数字教材运行承载</div>
        <div class="page-desc">数字教材的运行与教学使用统一在本页完成：课前发放章节知识点视频与拓展阅读书目，课中用活动控件发起教学活动激活课堂，课后发放作业检验学习效果；全部操作落库留痕、实时回流学情</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/pre">课前学情</button>
          <button class="btn" data-go="#/live">课堂互动数据</button>
          <button class="btn btn-primary" data-go="#/homework">作业批改</button>
        </div>
      </div>

      <div class="grid g-2">
        <!-- ============ 课前 · 发放学习资源 ============ -->
        <div class="card">
          <div class="card-h"><h3>课前 · 发放学习资源</h3><span class="sub">已发放 ${pre.length} 项 · ${S.esc(c.name)}</span></div>
          <div class="card-b">
            <div style="font-size:13px;color:var(--ink-2);margin-bottom:8px">选择要发放的资源（章节知识点视频 / 拓展阅读）</div>
            <div style="max-height:214px;overflow:auto;border:1px solid var(--line-2);border-radius:10px">
              ${res.map(function (r) {
                return `<div class="res-pick" data-pick="${r.id}">
                  <div class="ri">${S.icon(r.type === 'video' ? 'play' : 'doc')}</div>
                  <div class="rm"><strong>${S.esc(r.name)}</strong><span>${S.esc(r.chapter)} · ${r.duration}</span></div>
                </div>`;
              }).join('') || '<div class="hint" style="padding:14px">本课程暂无资源，请先到资源库新增</div>'}
            </div>
            <div class="form-grid c3" style="margin-top:10px">
              <label class="field"><span>环节类型</span><select id="arKind"><option>视频</option><option>拓展阅读</option></select></label>
              <label class="field"><span>所属章节</span><select id="arCh">${c.chapters.map(function (ch) { return `<option>${S.esc(ch.name)}</option>`; }).join('')}</select></label>
              <label class="field"><span>发放对象</span><select id="arClass"><option>全部教学班</option><option>2024 级临床医学 1 班</option><option>2024 级临床医学 2 班</option></select></label>
            </div>
            <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap">
              <button class="btn btn-primary" id="arSend">${S.icon('send')} 发放给学生自主学习</button>
              <span class="hint" id="arTip">先在上方点选资源</span>
            </div>
            <div class="divider"></div>
            ${pre.slice(-2).reverse().map(function (p) {
              var pct = Math.round(p.done / p.target * 100);
              return `<div class="rowline"><span class="tag">${p.kind}</span>
                <span style="flex:1;font-size:13px">${S.esc(p.title)}</span>
                <div class="prog" style="width:110px"><i style="width:${pct}%"></i></div>
                <span class="hint">${p.done}/${p.target}</span></div>`;
            }).join('')}
          </div>
        </div>

        <!-- ============ 课中 · 活动控件发放 ============ -->
        <div class="card">
          <div class="card-h"><h3>课中 · 活动控件发放</h3>
            <span class="sub">${running.length ? running.length + ' 个活动进行中' : '当前无进行中活动'}</span></div>
          <div class="card-b">
            <div class="act-grid five">
              ${[['签到', 'check'], ['选人', 'user'], ['抢答', 'flag'], ['投票', 'chart'], ['主题讨论', 'chat']].map(function (a) {
                return `<div class="act-cell" data-start="${a[0]}">${S.icon(a[1])}${a[0]}</div>`;
              }).join('')}
            </div>
            <div class="hint" style="margin-top:10px">点击控件即发起教学活动：签到生成 4 位签到码、选人随机点名、投票可自定义选项、主题讨论实时上墙，学生参与数据即时回流</div>
            <div class="divider"></div>
            ${acts.slice(-3).reverse().map(function (a) {
              return `<div class="rowline"><span class="tag ${a.status === '进行中' ? 'ok' : 'gray'}">${a.type}</span>
                <span style="flex:1;font-size:13px">${S.esc(a.title)}</span>
                <span class="hint">${a.joined}/${a.total}</span>
                <button class="btn btn-sm" data-actres="${a.id}">查看结果</button></div>`;
            }).join('') || '<div class="hint">暂无活动记录</div>'}
            <div class="divider"></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-sm" data-go="#/live">查看全部活动记录</button>
              <button class="btn btn-sm" data-go="#/pre">查看课前学习明细</button>
            </div>
          </div>
        </div>

        <!-- ============ 课后 · 发放作业 ============ -->
        <div class="card">
          <div class="card-h"><h3>课后 · 发放作业</h3><span class="sub">作业库 ${hw.length} 项 · 待批改 ${pendingGraded} 份</span></div>
          <div class="card-b">
            ${hw.map(function (h) {
              return `<div class="rowline"><span class="tag line">${S.esc(h.chapter)}</span>
                <span style="flex:1;font-size:13px"><b>${S.esc(h.title)}</b> · 截止 ${h.due}</span>
                <span class="hint">已交 ${h.submitted}/${h.total}</span>
                <button class="btn btn-sm" data-hwissue="${h.id}">再次发放</button></div>`;
            }).join('') || '<div class="hint">作业库为空</div>'}
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" id="hwNew">${S.icon('plus')} 新建作业并发放</button>
              <button class="btn" data-go="#/homework">进入作业批改</button>
            </div>
          </div>
        </div>

        <!-- ============ 发放记录 ============ -->
        <div class="card">
          <div class="card-h"><h3>发放记录</h3><span class="sub">课前 / 课中 / 课后全部操作留痕</span>
            <div class="right"><button class="btn btn-sm" id="issueExport">${S.icon('download')} 导出</button></div></div>
          <div class="card-b">
            <div class="tbl-wrap" style="max-height:320px;overflow:auto"><table class="tbl">
              <thead><tr><th>时间</th><th>类型</th><th>内容</th><th>发放对象</th></tr></thead>
              <tbody>${issues().slice().reverse().map(function (i) {
                return `<tr><td class="num">${i.time}</td>
                  <td><span class="tag ${i.kind === '课堂活动' ? 'ok' : i.kind === '作业' ? 'warn' : ''}">${i.kind}</span></td>
                  <td>${S.esc(i.title)}</td><td>${S.esc(i.target)}</td></tr>`;
              }).join('') || '<tr><td colspan="4"><div class="empty"><div>暂无发放记录，完成一次发放后自动生成</div></div></td></tr>'}</tbody>
            </table></div>
          </div>
        </div>
      </div>`;
    },
    mount: function (root) {
      var picked = null;

      function logIssue(kind, title, target) {
        issues().push({ time: S.fmtTime(), kind: kind, title: title, target: target });
        save();
      }

      function sendPre() {
        if (!picked) { U.toast('请先在上方点选要发放的资源', 'err'); return; }
        var r = S.resource(picked);
        if (!r) { U.toast('资源不存在，请重新选择', 'err'); return; }
        var kind = root.querySelector('#arKind').value;
        var ch = root.querySelector('#arCh').value;
        var cls = root.querySelector('#arClass').value;
        var c = S.currentCourse();
        S.db().preStudy.push({
          id: S.uid('p'), courseId: c.id, chapter: ch, kind: kind,
          title: r.name, target: c.students, done: 0, avgTime: '—'
        });
        logIssue('课前资源', r.name + '（' + kind + '）', cls);
        U.toast('已发放「' + r.name + '」，学生完成情况在课前导学实时回流');
        global.App.render();
      }

      function issueHw(id) {
        var h = S.db().homework.filter(function (x) { return x.id === id; })[0];
        if (!h) return;
        U.confirm('发放作业', '将「' + h.title + '」发放给全部教学班（' + h.total + ' 人），截止 ' + h.due + '。学生可在移动端查看并提交。', '确认发放', false).then(function (ok) {
          if (!ok) return;
          logIssue('作业', h.title, '全部教学班');
          U.toast('作业已发放');
          global.App.render();
        });
      }

      function newHw() {
        var c = S.currentCourse();
        U.modal({
          title: '新建作业并发放', sub: '创建后立即发放给学生',
          body: `<div class="form-grid">
            <label class="field"><span class="req">作业标题</span><input id="nhTitle" placeholder="如：酸碱失衡病例分析" /></label>
            <div class="form-grid c3">
              <label class="field"><span>所属章节</span><select id="nhCh">${c.chapters.map(function (ch) { return `<option>${S.esc(ch.name)}</option>`; }).join('')}</select></label>
              <label class="field"><span>截止日期</span><input id="nhDue" value="${S.fmtDate()}" /></label>
              <label class="field"><span>满分</span><input id="nhScore" value="10" /></label>
            </div>
            <label class="field"><span>作业要求</span><textarea id="nhReq">PDF 格式提交，需注明判断依据</textarea></label>
            <div class="login-err" id="nhErr"></div>
          </div>`,
          footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="nhOk">创建并发放</button>',
          onMount: function (api) {
            api.el.querySelector('#nhOk').addEventListener('click', function () {
              var title = api.el.querySelector('#nhTitle').value.trim();
              if (!title) { api.el.querySelector('#nhErr').textContent = '请填写作业标题'; return; }
              var c2 = S.currentCourse();
              S.db().homework.push({
                id: S.uid('h'), courseId: c2.id, title: title,
                chapter: api.el.querySelector('#nhCh').value,
                due: api.el.querySelector('#nhDue').value.trim() || S.fmtDate(),
                require: api.el.querySelector('#nhReq').value.trim() || '—',
                score: S.num(api.el.querySelector('#nhScore').value, 10),
                total: c2.students, submitted: 0, graded: 0, avg: 0, subs: []
              });
              logIssue('作业', title, '全部教学班');
              save(); api.close();
              U.toast('作业已创建并发放，学生提交后可进入批改');
              global.App.render();
            });
          }
        });
      }

      root.addEventListener('click', function (e) {
        var g = e.target.closest('[data-go]');
        if (g) { global.App.go(g.getAttribute('data-go')); return; }
        var pk = e.target.closest('[data-pick]');
        if (pk) {
          picked = pk.getAttribute('data-pick');
          root.querySelectorAll('.res-pick').forEach(function (x) { x.classList.remove('on'); });
          pk.classList.add('on');
          var r = S.resource(picked);
          root.querySelector('#arTip').textContent = '已选：' + (r ? r.name : '未知资源');
          return;
        }
        if (e.target.closest('#arSend')) { sendPre(); return; }
        var st = e.target.closest('[data-start]');
        if (st) { CV.openActivity(st.getAttribute('data-start')); return; }
        var ar = e.target.closest('[data-actres]');
        if (ar) { CV.openActivityResult(ar.getAttribute('data-actres')); return; }
        var hi = e.target.closest('[data-hwissue]');
        if (hi) { issueHw(hi.getAttribute('data-hwissue')); return; }
        if (e.target.closest('#hwNew')) { newHw(); return; }
        if (e.target.closest('#issueExport')) {
          var rows = [['时间', '类型', '内容', '发放对象']];
          issues().forEach(function (i) { rows.push([i.time, i.kind, i.title, i.target]); });
          S.downloadFile('教材发放记录_' + S.fmtDate() + '.csv', S.toCSV(rows));
          U.toast('发放记录已导出');
        }
      });
    }
  };
})(window);
