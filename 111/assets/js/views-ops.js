/* ============================================================
   views-ops.js —— 运营数据 / 引用详情 / 付费管理
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.Store, U = global.UI;
  var V = global.Views = global.Views || {};
  function save() { S.save(); }
  function go(h) { global.App.go(h); }

  /* ==========================================================
     教材运营数据
     ========================================================== */
  V.stats = {
    title: '教材运营数据',
    crumb: ['运营中心', '教材运营数据'],
    html: function () {
      var d = S.db();
      var ls = d.learners;
      var today = ls[ls.length - 1], yest = ls[ls.length - 2] || today;
      var totalRefs = d.refs.length;
      var classes = d.refs.filter(function (r) { return r.type === '开设班级'; }).length;
      var students = d.refs.reduce(function (a, b) { return a + b.students; }, 0);
      var paid = d.orders.filter(function (o) { return o.status === '已支付'; });
      var amount = paid.reduce(function (a, b) { return a + b.amount; }, 0);

      return `
      <div class="page-head">
        <div><div class="page-title">教材运营数据</div>
        <div class="page-desc">${S.esc(d.textbook.title)} · 数据更新于 ${today.date} 08:00，支持导出引用数与开设班级数等引用详情</div></div>
        <div class="page-head-actions">
          <button class="btn" data-act="sync">${S.icon('reset')} 同步最新数据</button>
          <button class="btn" data-go="#/refs">引用详情</button>
          <button class="btn btn-primary" data-act="export-all">${S.icon('download')} 导出运营数据</button>
        </div>
      </div>

      <div class="grid g-4">
        <div class="stat"><div class="stat-t">教材学习人数</div>
          <div class="stat-v">${today.count.toLocaleString()}<small>人</small></div>
          <div class="stat-f"><span class="trend up">↑ ${today.count - yest.count}</span> 较昨日</div>
          <div class="stat-ico">${S.icon('users')}</div></div>
        <div class="stat"><div class="stat-t">日均活跃人数</div>
          <div class="stat-v">${Math.round(ls.reduce(function (a, b) { return a + b.active; }, 0) / ls.length)}<small>人</small></div>
          <div class="stat-f">近 ${ls.length} 天平均</div><div class="stat-ico">${S.icon('chart')}</div></div>
        <div class="stat"><div class="stat-t">教材引用数</div>
          <div class="stat-v">${totalRefs}<small>个院系</small></div>
          <div class="stat-f">开设班级 ${classes} 个 · 覆盖学生 ${students} 人</div>
          <div class="stat-ico">${S.icon('book')}</div></div>
        <div class="stat"><div class="stat-t">教材购买金额</div>
          <div class="stat-v">¥${amount.toFixed(2)}</div>
          <div class="stat-f">${paid.length} 笔订单 · ${d.textbook.paid ? '付费教材' : '免费教材'}</div>
          <div class="stat-ico">${S.icon('money')}</div></div>
      </div>

      <div class="grid g-7-5" style="margin-top:16px">
        <div class="card">
          <div class="card-h"><h3>学习人数与活跃人数趋势</h3><span class="sub">按日统计</span>
            <div class="right"><span class="tag line">定期更新</span></div></div>
          <div class="card-b">
            ${U.lineChart(ls.map(function (l) { return { label: l.date.slice(5), value: l.count }; }), { height: 244 })}
            <div class="legend"><span><i style="background:#2563EB"></i>累计学习人数</span>
              <span><i style="background:#93C5FD"></i>日均活跃 ${Math.round(ls.reduce(function (a, b) { return a + b.active; }, 0) / ls.length)} 人</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><h3>引用院系分布</h3><span class="sub">${totalRefs} 个院系</span></div>
          <div class="card-b">
            ${U.donutChart([
              { label: '第一临床学院', value: d.refs.filter(function (r) { return r.school.indexOf('第一临床') >= 0; }).length },
              { label: '第二临床学院', value: d.refs.filter(function (r) { return r.school.indexOf('第二临床') >= 0; }).length },
              { label: '儿科 / 口腔', value: d.refs.filter(function (r) { return /儿科|口腔/.test(r.school); }).length },
              { label: '其他院系', value: d.refs.filter(function (r) { return !/第一临床|第二临床|儿科|口腔/.test(r.school); }).length }
            ], { size: 158, unit: '院系' })}
          </div>
        </div>
      </div>

      <div class="grid g-2" style="margin-top:16px">
        <div class="card">
          <div class="card-h"><h3>每日学习数据明细</h3>
            <div class="right"><button class="btn btn-sm" data-act="export-learn">${S.icon('download')} 导出</button></div></div>
          <div class="tbl-wrap" style="max-height:320px;overflow:auto"><table class="tbl">
            <thead><tr><th>日期</th><th>累计学习人数</th><th>日活跃</th><th>环比</th></tr></thead>
            <tbody>${ls.slice().reverse().map(function (l, i, arr) {
              var prev = arr[i + 1];
              var diff = prev ? l.count - prev.count : 0;
              return `<tr><td class="num">${l.date}</td><td class="num">${l.count.toLocaleString()}</td>
                <td class="num">${l.active}</td>
                <td class="num" style="color:${diff >= 0 ? 'var(--ok)' : 'var(--danger)'}">${prev ? (diff >= 0 ? '+' : '') + diff : '—'}</td></tr>`;
            }).join('')}</tbody>
          </table></div>
        </div>
        <div class="card">
          <div class="card-h"><h3>教材与付费设置</h3>
            <div class="right"><button class="btn btn-sm" data-act="save-tb">保存设置</button></div></div>
          <div class="card-b">
            <dl class="kv" style="margin-bottom:14px">
              <dt>教材名称</dt><dd>${S.esc(d.textbook.title)}</dd>
              <dt>ISBN</dt><dd class="mono">${d.textbook.isbn}</dd>
              <dt>最近更新</dt><dd>${d.textbook.updated}</dd>
            </dl>
            <div class="rowline"><span style="flex:1">付费教材</span>
              <div class="switch ${d.textbook.paid ? 'on' : ''}" id="tbPaid"></div></div>
            <div class="rowline"><span style="flex:1">教材定价（元）</span>
              <input id="tbPrice" class="btn" style="width:110px;height:32px;padding:0 10px;text-align:left" value="${d.textbook.price}" /></div>
            <div class="rowline"><span style="flex:1">免费试读章节</span>
              <span class="tag line">${d.textbook.freeChapters.join('、')}</span></div>
            <div class="hint" style="margin-top:10px">设置为免费后，可阅读全部章节；付费模式下购买记录在后台形成数据统计。</div>
          </div>
        </div>
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        if (e.target.closest('[data-act="sync"]')) {
          var d = S.db();
          var last = d.learners[d.learners.length - 1];
          var todayStr = S.fmtDate();
          if (last.date === todayStr) {
            last.count += 3 + Math.floor(Math.random() * 6);
            last.active += 3;
          } else {
            d.learners.push({ date: todayStr, count: last.count + 5 + Math.floor(Math.random() * 8), active: last.active + 2 });
            if (d.learners.length > 20) d.learners.shift();
          }
          d.textbook.updated = todayStr;
          save(); U.toast('已同步最新学习数据'); global.App.render(); return;
        }
        if (e.target.closest('[data-act="export-learn"]') || e.target.closest('[data-act="export-all"]')) {
          var all = e.target.closest('[data-act="export-all"]');
          var rows = [['日期', '累计学习人数', '日活跃人数']];
          S.db().learners.forEach(function (l) { rows.push([l.date, l.count, l.active]); });
          if (all) {
            rows.push([]);
            rows.push(['教材名称', S.db().textbook.title]);
            rows.push(['教材定价', S.db().textbook.price]);
            rows.push(['引用院系数', S.db().refs.length]);
            rows.push(['开设班级数', S.db().refs.filter(function (r) { return r.type === '开设班级'; }).length]);
            rows.push([]);
            rows.push(['院系', '教师', '班级', '学生数', '引用类型', '开通日期']);
            S.db().refs.forEach(function (r) { rows.push([r.school, r.teacher, r.className, r.students, r.type, r.date]); });
            rows.push([]);
            rows.push(['订单号', '教材', '购买人', '学院', '金额', '渠道', '时间', '状态']);
            S.db().orders.forEach(function (o) { rows.push([o.id, o.book, o.buyer, o.college, o.amount, o.channel, o.time, o.status]); });
            S.downloadFile('教材运营数据汇总_' + S.fmtDate() + '.csv', S.toCSV(rows));
            U.toast('运营数据已导出（含学习人数、引用详情、购买记录）');
          } else {
            S.downloadFile('学习人数明细_' + S.fmtDate() + '.csv', S.toCSV(rows));
            U.toast('学习人数明细已导出');
          }
          return;
        }
        if (e.target.closest('[data-act="save-tb"]')) {
          var d2 = S.db();
          var price = S.num(document.getElementById('tbPrice').value, 68);
          d2.textbook.price = price;
          d2.textbook.paid = document.getElementById('tbPaid').classList.contains('on');
          save(); U.toast('教材付费设置已保存');
          global.App.render();
        }
      });
      var sw = root.querySelector('#tbPaid');
      if (sw) sw.addEventListener('click', function () {
        sw.classList.toggle('on');
        U.toast(sw.classList.contains('on') ? '已切换为付费教材' : '已切换为免费教材');
      });
    }
  };

  /* ==========================================================
     引用详情
     ========================================================== */
  var refState = { kw: '', type: 'all', page: 1, size: 8 };

  V.refs = {
    title: '引用详情',
    crumb: ['运营中心', '引用详情'],
    html: function () {
      var d = S.db();
      var list = d.refs.filter(function (r) {
        if (refState.type !== 'all' && r.type !== refState.type) return false;
        if (refState.kw) {
          var k = refState.kw.toLowerCase();
          return (r.school + r.teacher + r.className).toLowerCase().indexOf(k) >= 0;
        }
        return true;
      });
      var total = list.length;
      var maxPage = Math.max(1, Math.ceil(total / refState.size));
      if (refState.page > maxPage) refState.page = maxPage;
      var pageList = list.slice((refState.page - 1) * refState.size, refState.page * refState.size);
      var classCnt = d.refs.filter(function (r) { return r.type === '开设班级'; }).length;
      var refCnt = d.refs.filter(function (r) { return r.type === '教材引用'; }).length;

      return `
      <div class="page-head">
        <div><div class="page-title">引用详情</div>
        <div class="page-desc">教材引用数与开设班级数逐条可追溯，支持按院系、教师、班级检索并导出明细</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/stats">运营总览</button>
          <button class="btn btn-primary" data-act="export">${S.icon('download')} 导出引用详情</button>
        </div>
      </div>

      <div class="grid g-4">
        <div class="stat"><div class="stat-t">引用院系</div><div class="stat-v">${d.refs.length}<small>个</small></div>
          <div class="stat-f">覆盖 ${d.refs.reduce(function (a, b) { return a + b.students; }, 0)} 名学生</div>
          <div class="stat-ico">${S.icon('book')}</div></div>
        <div class="stat"><div class="stat-t">开设班级数</div><div class="stat-v">${classCnt}<small>个</small></div>
          <div class="stat-f">含 ${refCnt} 个纯引用院系</div><div class="stat-ico">${S.icon('users')}</div></div>
        <div class="stat"><div class="stat-t">本学期新增</div><div class="stat-v">${d.refs.filter(function (r) { return new Date(r.date) > new Date(Date.now() - 30 * 864e5); }).length}<small>个</small></div>
          <div class="stat-f">近 30 天开通</div><div class="stat-ico">${S.icon('chart')}</div></div>
        <div class="stat"><div class="stat-t">平均班额</div><div class="stat-v">${Math.round(d.refs.reduce(function (a, b) { return a + b.students; }, 0) / Math.max(1, d.refs.length))}<small>人</small></div>
          <div class="stat-f">按教学班统计</div><div class="stat-ico">${S.icon('users')}</div></div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h" style="flex-wrap:wrap;gap:12px">
          <div class="seg" id="refSeg">
            <button data-rt="all" class="${refState.type === 'all' ? 'on' : ''}">全部</button>
            <button data-rt="开设班级" class="${refState.type === '开设班级' ? 'on' : ''}">开设班级</button>
            <button data-rt="教材引用" class="${refState.type === '教材引用' ? 'on' : ''}">教材引用</button>
          </div>
          <div class="right">
            <input id="refKw" class="btn" style="height:34px;width:200px;padding:0 12px;text-align:left" placeholder="搜索院系 / 教师 / 班级" value="${S.esc(refState.kw)}" />
          </div>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>引用单位</th><th>授课教师</th><th>教学班</th><th>学生数</th><th>引用类型</th><th>开通日期</th><th>教材使用</th></tr></thead>
          <tbody>${pageList.length ? pageList.map(function (r) {
            return `<tr>
              <td>${S.esc(r.school)}</td><td>${S.esc(r.teacher)}</td><td>${S.esc(r.className)}</td>
              <td class="num">${r.students}</td>
              <td><span class="tag ${r.type === '开设班级' ? 'ok' : 'info'}">${r.type}</span></td>
              <td class="num">${r.date}</td>
              <td class="num">${Math.round(r.students * 0.92)} 人在学</td>
            </tr>`;
          }).join('') : `<tr><td colspan="7"><div class="empty">${S.icon('search')}<div>没有匹配的引用记录</div></div></td></tr>`}</tbody>
        </table></div>
        ${U.pager(total, refState.page, refState.size)}
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-rt]');
        if (t) { refState.type = t.getAttribute('data-rt'); refState.page = 1; global.App.render(); return; }
        var pg = e.target.closest('.pager [data-page]');
        if (pg) { refState.page = parseInt(pg.getAttribute('data-page'), 10); global.App.render(); return; }
        if (e.target.closest('[data-act="export"]')) {
          var rows = [['引用单位', '授课教师', '教学班', '学生数', '引用类型', '开通日期']];
          S.db().refs.forEach(function (r) { rows.push([r.school, r.teacher, r.className, r.students, r.type, r.date]); });
          rows.push([]);
          rows.push(['汇总项', '数值']);
          rows.push(['教材引用数', S.db().refs.length + ' 个院系']);
          rows.push(['开设班级数', S.db().refs.filter(function (r) { return r.type === '开设班级'; }).length + ' 个']);
          rows.push(['覆盖学生数', S.db().refs.reduce(function (a, b) { return a + b.students; }, 0) + ' 人']);
          S.downloadFile('教材引用详情_' + S.fmtDate() + '.csv', S.toCSV(rows));
          U.toast('引用详情已导出');
        }
      });
      var kw = root.querySelector('#refKw');
      kw.addEventListener('input', function () {
        refState.kw = kw.value.trim(); refState.page = 1;
        clearTimeout(kw._t);
        kw._t = setTimeout(function () { global.App.render(); }, 320);
      });
    }
  };

  /* ==========================================================
     付费与订单
     ========================================================== */
  var payState = { kw: '', status: 'all', page: 1, size: 8 };

  V.pay = {
    title: '付费与订单',
    crumb: ['运营中心', '付费与订单'],
    html: function () {
      var d = S.db();
      var list = d.orders.filter(function (o) {
        if (payState.status !== 'all' && o.status !== payState.status) return false;
        if (payState.kw) {
          var k = payState.kw.toLowerCase();
          return (o.buyer + o.book + o.id + o.college).toLowerCase().indexOf(k) >= 0;
        }
        return true;
      });
      var total = list.length;
      var maxPage = Math.max(1, Math.ceil(total / payState.size));
      if (payState.page > maxPage) payState.page = maxPage;
      var pageList = list.slice((payState.page - 1) * payState.size, payState.page * payState.size);
      var paid = d.orders.filter(function (o) { return o.status === '已支付'; });
      var refund = d.orders.filter(function (o) { return o.status === '已退款'; });
      var amount = paid.reduce(function (a, b) { return a + b.amount; }, 0);
      var channels = ['微信支付', '支付宝', '校园统一支付'].map(function (c) {
        return { label: c, value: d.orders.filter(function (o) { return o.channel === c; }).length };
      }).filter(function (x) { return x.value > 0; });

      return `
      <div class="page-head">
        <div><div class="page-title">付费与订单</div>
        <div class="page-desc">教材可设为付费或免费，付费教材的购买记录在后台形成数据统计，支持按状态与关键词检索</div></div>
        <div class="page-head-actions">
          <button class="btn" data-go="#/stats">教材设置</button>
          <button class="btn btn-primary" data-act="export-orders">${S.icon('download')} 导出购买记录</button>
        </div>
      </div>

      <div class="grid g-4">
        <div class="stat"><div class="stat-t">累计收入</div><div class="stat-v">¥${amount.toFixed(2)}</div>
          <div class="stat-f">${paid.length} 笔已支付订单</div><div class="stat-ico">${S.icon('money')}</div></div>
        <div class="stat"><div class="stat-t">客单价</div>
          <div class="stat-v">¥${(paid.length ? amount / paid.length : 0).toFixed(2)}</div>
          <div class="stat-f">教材定价 ¥${d.textbook.price}</div><div class="stat-ico">${S.icon('chart')}</div></div>
        <div class="stat"><div class="stat-t">退款订单</div><div class="stat-v">${refund.length}<small>笔</small></div>
          <div class="stat-f">退款率 ${(d.orders.length ? refund.length / d.orders.length * 100 : 0).toFixed(1)}%</div>
          <div class="stat-ico">${S.icon('reset')}</div></div>
        <div class="stat"><div class="stat-t">教材状态</div>
          <div class="stat-v" style="font-size:20px">${d.textbook.paid ? '付费教材' : '免费教材'}</div>
          <div class="stat-f">定价 ¥${d.textbook.price} · 试读 ${d.textbook.trialPages} 页</div>
          <div class="stat-ico">${S.icon('lock')}</div></div>
      </div>

      <div class="grid g-5-7" style="margin-top:16px">
        <div class="card">
          <div class="card-h"><h3>支付渠道分布</h3></div>
          <div class="card-b">${U.donutChart(channels.length ? channels : [{ label: '暂无', value: 1 }], { size: 152, unit: '订单' })}</div>
        </div>
        <div class="card">
          <div class="card-h"><h3>教材付费设置</h3><span class="sub">修改后阅读权限实时生效</span>
            <div class="right"><button class="btn btn-sm btn-primary" data-act="save-pay">保存</button></div></div>
          <div class="card-b">
            <div class="rowline"><span style="flex:1">启用付费购买</span>
              <div class="switch ${d.textbook.paid ? 'on' : ''}" id="paySwitch"></div></div>
            <div class="rowline"><span style="flex:1">教材定价（元）</span>
              <input id="payPrice" class="btn" style="width:120px;height:32px;padding:0 10px;text-align:left" value="${d.textbook.price}" /></div>
            <div class="rowline"><span style="flex:1">免费试读页数</span>
              <input id="payTrial" class="btn" style="width:120px;height:32px;padding:0 10px;text-align:left" value="${d.textbook.trialPages}" /></div>
            <div class="hint" style="margin-top:10px">开启付费后，未购买时仅可阅读试读页，购买记录自动写入订单统计。</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h" style="flex-wrap:wrap;gap:12px">
          <div class="seg" id="paySeg">
            <button data-ps="all" class="${payState.status === 'all' ? 'on' : ''}">全部订单</button>
            <button data-ps="已支付" class="${payState.status === '已支付' ? 'on' : ''}">已支付</button>
            <button data-ps="已退款" class="${payState.status === '已退款' ? 'on' : ''}">已退款</button>
          </div>
          <div class="right">
            <input id="payKw" class="btn" style="height:34px;width:200px;padding:0 12px;text-align:left" placeholder="搜索订单号 / 购买人" value="${S.esc(payState.kw)}" />
          </div>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>订单号</th><th>教材</th><th>购买人</th><th>所属学院</th><th>金额</th><th>渠道</th><th>支付时间</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${pageList.length ? pageList.map(function (o) {
            return `<tr>
              <td class="mono">${o.id}</td><td>${S.esc(o.book)}</td><td>${S.esc(o.buyer)}</td>
              <td>${S.esc(o.college)}</td><td class="num">¥${o.amount.toFixed(2)}</td>
              <td><span class="tag line">${o.channel}</span></td><td class="num">${o.time}</td>
              <td>${U.statusTag(o.status)}</td>
              <td class="ops">${o.status === '已支付' ? `<span class="tlink danger" data-refund="${o.id}">退款</span>` : '<span class="hint">—</span>'}</td>
            </tr>`;
          }).join('') : `<tr><td colspan="9"><div class="empty">${S.icon('money')}<div>没有匹配的订单</div></div></td></tr>`}</tbody>
        </table></div>
        ${U.pager(total, payState.page, payState.size)}
      </div>`;
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-ps]');
        if (t) { payState.status = t.getAttribute('data-ps'); payState.page = 1; global.App.render(); return; }
        var pg = e.target.closest('.pager [data-page]');
        if (pg) { payState.page = parseInt(pg.getAttribute('data-page'), 10); global.App.render(); return; }
        if (e.target.closest('[data-act="save-pay"]')) {
          var d = S.db();
          d.textbook.paid = root.querySelector('#paySwitch').classList.contains('on');
          d.textbook.price = S.num(root.querySelector('#payPrice').value, 68);
          d.textbook.trialPages = S.num(root.querySelector('#payTrial').value, 12);
          save(); U.toast('付费设置已保存，阅读权限已同步'); global.App.render(); return;
        }
        if (e.target.closest('[data-act="export-orders"]')) {
          var rows = [['订单号', '教材', '购买人', '所属学院', '金额', '渠道', '支付时间', '状态']];
          S.db().orders.forEach(function (o) { rows.push([o.id, o.book, o.buyer, o.college, o.amount, o.channel, o.time, o.status]); });
          var paidAmt = S.db().orders.filter(function (o) { return o.status === '已支付'; }).reduce(function (a, b) { return a + b.amount; }, 0);
          rows.push([]);
          rows.push(['合计收入', paidAmt.toFixed(2)]);
          S.downloadFile('教材购买记录_' + S.fmtDate() + '.csv', S.toCSV(rows));
          U.toast('购买记录已导出'); return;
        }
        var rf = e.target.closest('[data-refund]');
        if (rf) {
          var id = rf.getAttribute('data-refund');
          U.confirm('订单退款', '退款后该订单状态变更为已退款，教材阅读权限将同步收回。', '确认退款', true).then(function (ok) {
            if (!ok) return;
            var o = S.db().orders.filter(function (x) { return x.id === id; })[0];
            if (o) o.status = '已退款';
            save(); U.toast('退款已处理'); global.App.render();
          });
        }
      });
      var sw = root.querySelector('#paySwitch');
      if (sw) sw.addEventListener('click', function () {
        sw.classList.toggle('on');
        U.toast(sw.classList.contains('on') ? '已启用付费购买' : '已切换为免费教材');
      });
      var kw = root.querySelector('#payKw');
      kw.addEventListener('input', function () {
        payState.kw = kw.value.trim(); payState.page = 1;
        clearTimeout(kw._t);
        kw._t = setTimeout(function () { global.App.render(); }, 320);
      });
    }
  };
})(window);
