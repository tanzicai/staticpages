/* ================================================================
   页面注册表：模块 / 子模块 / 页面渲染 / 交互初始化
   视角约定：
     · 首页                 —— 平台统一入口
     · 评价 / 教师档案袋 / 教学 / 智能体 —— 单个教师视角（我的…）
     · 专业建设             —— 专业建设负责人视角（我负责的专业）
     · 数据驾驶舱           —— 院领导视角（全院各板块全维度数据 + M9 对标）
   ================================================================ */
(function () {
  'use strict';
  var D = window.D;

  /* ---------------- 通用组件 ---------------- */
  function esc(s) { return String(s == null ? '' : s); }

  function pageHead(title, desc, actions) {
    return '<div class="page-head"><div><h1>' + title + '</h1><p>' + desc + '</p></div>'
      + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }

  function btn(label, cls, id) {
    return '<button class="btn ' + (cls || '') + '"' + (id ? ' id="' + id + '"' : '') + '>' + label + '</button>';
  }

  function panel(title, body, right, cls) {
    return '<div class="panel ' + (cls || '') + '"><div class="panel-head"><h3>' + title + '</h3>'
      + (right ? '<span class="sub">' + right + '</span>' : '') + '</div>' + body + '</div>';
  }

  function kpiCards(items, cols) {
    return '<div class="grid ' + (cols || 'g4') + ' mb14">' + items.map(function (k) {
      var d = k.delta == null ? '' : '<span class="' + (String(k.delta).charAt(0) === '-' ? 'down' : 'up') + '">' + k.delta + '</span>';
      return '<div class="kpi"><div class="label">' + k.label + '</div><div class="value">' + k.value
        + (k.unit ? '<span class="unit">' + k.unit + '</span>' : '') + '</div>'
        + '<div class="foot">' + d + (k.foot || (d ? '较上期' : '')) + '</div></div>';
    }).join('') + '</div>';
  }

  function tagCls(t) {
    t = String(t);
    if (/红色|不合格|未达标|异常|偏离|延期/.test(t)) return 'red';
    if (/待处置|需改进|合格|橙色|黄色|待定/.test(t)) return 'amber';
    if (/优秀|达标|已发布|已完成|已处置|已推送|国家级|急需|实时|NEW/.test(t)) return 'green';
    if (/良好|进行中|处置中|省级|紧缺|月度|季度|周度|年度|学期/.test(t)) return 'blue';
    return 'gray';
  }

  function cell(c, opts) {
    opts = opts || {};
    c = esc(c);
    if (opts.tagCols && opts._ci != null && opts.tagCols.indexOf(opts._ci) >= 0) {
      return '<span class="tag ' + tagCls(c) + '">' + c + '</span>';
    }
    if (/^\d+(\.\d+)?%$/.test(c)) {
      var v = parseFloat(c);
      var cl = v >= 93 ? 'green' : (v >= 85 ? '' : 'amber');
      return '<div style="display:flex;align-items:center;gap:8px;"><div class="bar ' + cl + '" style="flex:1;"><i style="width:' + v + '%"></i></div>'
        + '<span class="mono nowrap">' + c + '</span></div>';
    }
    return c;
  }

  function table(headers, rows, opts) {
    opts = opts || {};
    var numCols = opts.numCols || [];
    var scoreCols = opts.scoreCols || [];
    var tagCols = opts.tagCols || [];
    var h = '<div class="table-wrap"><table class="tbl"><thead><tr>';
    headers.forEach(function (x, i) { h += '<th' + (numCols.indexOf(i) >= 0 ? ' class="num"' : '') + '>' + x + '</th>'; });
    h += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr>';
      r.forEach(function (c, i) {
        var cls = [];
        if (numCols.indexOf(i) >= 0) cls.push('num');
        if (scoreCols.indexOf(i) >= 0 && !isNaN(parseFloat(c))) {
          var v = parseFloat(c);
          cls.push('mono');
          if (v >= 95) c = '<b style="color:#12a37f">' + c + '</b>';
          else if (v >= 90) c = '<b style="color:#2c6fe0">' + c + '</b>';
          else if (v >= 85) c = '<b style="color:#c9860a">' + c + '</b>';
          else if (String(c).indexOf('<') < 0) c = '<b style="color:#d1454b">' + c + '</b>';
        } else {
          c = cell(c, { tagCols: tagCols, _ci: i });
        }
        if (i === 0) cls.push('name');
        h += '<td class="' + cls.join(' ') + '">' + c + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }

  function chart(id, cls) { return '<div class="chart ' + (cls || 'h220') + '" id="' + id + '"></div>'; }

  function chartOf(id, name) {
    var items = ['内科学（心血管）', '诊断学', '临床基本技能训练', '心血管疾病诊疗进展', '临床思维案例研讨', '内科学见习'];
    return chart(id);
  }

  function chatShell(agent) {
    return '<div class="chat" id="chat">'
      + '<div class="msg"><div class="who">' + Icon(agent.icon, 15) + '</div><div class="bubble">' + agent.greet.replace(/\n/g, '<br>') + '</div></div>'
      + '</div>'
      + '<div class="chips" style="margin-top:10px;">'
      + agent.presets.map(function (p) { return '<div class="chip" data-q="' + p + '">' + p + '</div>'; }).join('')
      + '</div>'
      + '<div class="chat-input"><input id="chatInput" placeholder="输入你的问题，或点击上方快捷指令…" />'
      + '<button class="btn primary" id="chatSend">发送</button></div>';
  }

  function bindChat(root, agent) {
    var chat = root.querySelector('#chat');
    if (!chat) return;
    var input = root.querySelector('#chatInput');

    function push(who, text, me) {
      var div = document.createElement('div');
      div.className = 'msg' + (me ? ' me' : '');
      div.innerHTML = '<div class="who">' + (me ? '我' : Icon(who, 15)) + '</div><div class="bubble">' + String(text).replace(/\n/g, '<br>') + '</div>';
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }
    function ask(q) {
      push('我', q, true);
      var r = agent.replies[q] || agent.replies.default;
      var t = document.createElement('div');
      t.className = 'msg';
      t.innerHTML = '<div class="who">' + Icon(agent.icon, 15) + '</div><div class="bubble">正在推理…</div>';
      chat.appendChild(t);
      chat.scrollTop = chat.scrollHeight;
      setTimeout(function () {
        t.querySelector('.bubble').innerHTML = String(r).replace(/\n/g, '<br>');
        chat.scrollTop = chat.scrollHeight;
      }, 520);
    }
    root.querySelectorAll('[data-q]').forEach(function (b) {
      b.addEventListener('click', function () { ask(b.getAttribute('data-q')); });
    });
    function send() {
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      ask(v);
    }
    root.querySelector('#chatSend').addEventListener('click', send);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }
  window.toast = toast;

  /* ================================================================
     首页（平台统一入口 · SAGE 风格）
     ================================================================ */
  var agentByKey = {};
  Object.keys(D.agents).forEach(function (k) { agentByKey[D.agents[k].key] = D.agents[k]; });

  var homeModule = {
    id: 'home', name: '首页', icon: 'home', noSidebar: true,
    desc: '平台首页',
    persona: null,
    subs: [
      {
        id: 'home', name: '平台首页', icon: 'home',
        render: function () {
          var h = D.home;
          var notices = h.notices.map(function (n) {
            return '<div class="notice-item"><span class="nd"></span><span class="nt">' + n[0] + '</span>'
              + (n[1] ? '<span class="tag new">NEW</span>' : '') + '<span class="nd-date">' + n[2] + '</span></div>';
          }).join('');
          var quick = h.quick.map(function (q) {
            return '<div class="quick-item" data-go="' + q.go + '"><div class="qi-icon">' + Icon(q.icon, 18) + '</div><span>' + q.name + '</span></div>';
          }).join('');
          var courses = h.courses.map(function (c) {
            return '<div class="course-card"><div class="cc-thumb ' + c.kind + '"><span class="play">' + Icon('play', 16) + '</span></div>'
              + '<div class="cc-body"><div class="cc-name">' + c.name + '</div>'
              + '<div class="cc-meta">' + c.teacher + ' · ' + c.title + '</div>'
              + '<div class="cc-score">' + Icon('star', 12) + ' ' + c.score + '</div></div></div>';
          }).join('');
          var mods = h.modules.map(function (m) {
            return '<div class="mod-card" data-go="' + m.go + '"><div class="mc-icon">' + Icon(m.icon, 20) + '</div><h4>' + m.name + '</h4>'
              + '<ul>' + m.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>'
              + '<div class="mc-arrow">' + Icon('arrowRight', 15) + '</div></div>';
          }).join('');
          var ai = D.agentOrder.map(function (k, i) {
            var a = agentByKey[k];
            return '<div class="ai-card" data-go="agent:' + a.key + '"><span class="ai-no">0' + (i + 1) + '</span>'
              + '<div class="ai-icon">' + Icon(a.icon, 17) + '</div><div class="ai-name">' + a.name + '</div></div>';
          }).join('');
          var ach = h.achievements.items.map(function (x) {
            return '<div class="ach-card"><div class="ach-value">' + x.value + '<span>' + x.unit + '</span></div><div class="ach-label">' + x.label + '</div></div>';
          }).join('');

          return '<div class="home-top">'
            + '<div class="hero">'
            + '<div class="hero-tag">' + Icon('flag', 14) + '平台使命</div>'
            + '<h2>' + h.mission + '</h2>'
            + '<div class="hero-stats">' + h.stats.map(function (s) {
              return '<div class="hs-item"><span class="hs-icon">' + Icon(s.icon, 17) + '</span><div><div class="hs-label">' + s.label + '</div>'
                + '<div class="hs-value">' + s.value + '<span>' + s.unit + '</span></div></div></div>';
            }).join('') + '</div>'
            + '<div class="hero-actions"><button class="btn primary" id="heroSpace">' + Icon('users', 14) + '我的空间</button>'
            + '<button class="btn ghost" data-go="dash:overview">' + Icon('activity', 14) + '数据驾驶舱</button></div>'
            + '</div>'
            + '<div class="home-side">'
            + panel('通知公告', '<div class="notice-list">' + notices + '</div>', '更多')
            + panel('快捷入口', '<div class="quick-grid">' + quick + '</div>', '更多')
            + panel('优秀课程展示', '<div class="course-list">' + courses + '</div>', '更多')
            + '</div>'
            + '</div>'
            + '<div class="panel mb14"><div class="panel-head"><h3>平台核心模块</h3><span class="sub">按角色视角进入对应模块</span></div>'
            + '<div class="mod-grid">' + mods + '</div></div>'
            + '<div class="panel mb14"><div class="panel-head"><h3>AI 能力中心</h3><span class="sub">七大临床教学智能体</span></div>'
            + '<div class="ai-row">' + ai + '</div></div>'
            + '<div class="panel"><div class="panel-head"><h3>建设成果展示</h3><span class="sub">全院教学建设成效</span></div>'
            + '<div class="ach-grid mb14">' + ach + '</div>'
            + chart('c-ach', 'h200')
            + '</div>';
        },
        init: function (root) {
          Charts.bar(root.querySelector('#c-ach'), {
            labels: D.home.achievements.trend.labels,
            series: D.home.achievements.trend.series,
            height: 200, legend: true
          });
          var b = root.querySelector('#heroSpace');
          if (b) b.addEventListener('click', function () { toast('已进入「我的空间」：我的课程 / 我的档案 / 我的待办（Demo）'); });
        }
      }
    ]
  };

  /* ================================================================
     模块一：评价（教师视角 · 我的评价）
     ================================================================ */
  var reviewModule = {
    id: 'review', name: '评价', icon: 'star', persona: 'teacher',
    desc: '教师视角 · 我的教学评价（学生评教 / 教师评学 / 同行互评 / 我的质量报告 / 我的预警）',
    subs: [
      {
        id: 'student', name: '我的学生评教', icon: 'clipboard',
        render: function () {
          var s = D.review.studentEval;
          return pageHead('我的学生评教', '查看本人在各门课程中收到的学生评价、评分与排名情况，支持与我讲授的其他课程、学院均值对比。',
            btn('导出我的评教明细', '', 'btnExport') + btn('对比学院均值', 'primary', 'btnNew'))
            + kpiCards(s.kpis)
            + '<div class="grid g-3-2 mb14">'
            + panel('我的评教得分趋势', chart('c1', 'h260'), '近 7 学期 · vs 学院均值')
            + panel('我的评教维度', chart('c2', 'h260'), '满分 100 分')
            + '</div>'
            + panel('我讲授课程的评教明细', table(
              ['课程名称', '授课班级', '学时', '我的得分', '参评率(%)', '上期得分', '环比', '评价等级'],
              s.rows, { numCols: [2, 3, 4, 5, 6], scoreCols: [3, 4, 5], tagCols: [7] }), '本学期 · 共 6 门课程')
            + '';
        },
        init: function (root) {
          var s = D.review.studentEval;
          Charts.line(root.querySelector('#c1'), { labels: s.trend.labels, series: s.trend.series, height: 260, yMin: 85 });
          Charts.radar(root.querySelector('#c2'), { axes: s.dims.axes, series: s.dims.series, height: 260 });
          root.querySelector('#btnExport').onclick = function () { toast('我的评教明细已导出（Demo）'); };
          root.querySelector('#btnNew').onclick = function () { toast('已按课程维度与学院均值对比（Demo）'); };
        }
      },
      {
        id: 'teachereval', name: '我的教师评学', icon: 'userCheck',
        render: function () {
          var s = D.review.teacherEval;
          return pageHead('我的教师评学', '我对所带班级学生的学习态度、课堂表现等进行评价，形成班级学风画像，作为学业指导与预警依据。',
            btn('继续评学', 'primary', 'btn1'))
            + kpiCards(s.kpis)
            + '<div class="grid g-3-2 mb14">'
            + panel('我带的班级学风维度', chart('c1', 'h260'), 'vs 年级平均')
            + panel('各班级学风得分', chart('c2', 'h260'))
            + '</div>'
            + panel('我的评学明细', table(
              ['班级', '评价教师', '学风总分', '出勤率(%)', '课堂表现', '作业完成', '综合等级'],
              s.rows, { numCols: [2, 3, 4, 5], scoreCols: [2, 3, 4, 5], tagCols: [6] }), '本学期已完成 4 个班级')
            + '';
        },
        init: function (root) {
          var s = D.review.teacherEval;
          Charts.radar(root.querySelector('#c1'), { axes: s.dims.axes, series: s.dims.series, height: 260 });
          Charts.bar(root.querySelector('#c2'), {
            labels: s.rows.map(function (r) { return r[0].replace('临床医学', ''); }),
            data: s.rows.map(function (r) { return r[2]; }),
            colors: ['#12a37f', '#2ec8a6', '#3d7bff', '#f0a12e'],
            height: 260, valueLabels: true, yMax: 100
          });
          root.querySelector('#btn1').onclick = function () { toast('已打开评学表：请对本班学生学风进行评价（Demo）'); };
        }
      },
      {
        id: 'peer', name: '我的同行互评', icon: 'users',
        render: function () {
          var s = D.review.peerEval;
          return pageHead('我的同行互评', '我的听课记录、同行对我的课堂评价与教学建议，支持按课程、学期、教研室检索。',
            btn('登记听课记录', 'primary', 'btn1'))
            + kpiCards(s.kpis)
            + '<div class="grid g-1-2 mb14">'
            + panel('我的互评分数分布', chart('c1', 'h260'))
            + panel('我的听课次数（按月）', chart('c2', 'h260'))
            + '</div>'
            + panel('我的听课互评记录', table(
              ['听课日期', '授课教师', '课程', '教室', '我的评分', '教学建议'],
              s.rows, { numCols: [4], scoreCols: [4] }), '近 30 天')
            + '';
        },
        init: function (root) {
          var s = D.review.peerEval;
          Charts.donut(root.querySelector('#c1'), { data: s.dist, height: 260, centerLabel: '我的听课', centerValue: 32 });
          Charts.bar(root.querySelector('#c2'), {
            labels: ['5月', '6月', '7月', '8月', '9月', '10月'],
            data: [4, 5, 2, 1, 8, 8], colors: ['#12a37f'], height: 260, valueLabels: true
          });
          root.querySelector('#btn1').onclick = function () { toast('听课记录登记表单已打开（Demo）'); };
        }
      },
      {
        id: 'quality', name: '我的质量报告', icon: 'chart',
        render: function () {
          var s = D.review.qualityReport;
          return pageHead('我的多维度质量报告', '综合学生评教、教师评学、同行互评、督导评价与数据监测，自动生成我本人的多维度教学质量报告。',
            btn('生成我的报告', 'primary', 'btn1') + btn('历史报告归档', '', 'btn2'))
            + kpiCards(s.kpis)
            + '<div class="grid g-3-2 mb14">'
            + panel('我的多维度质量雷达', chart('c1', 'h260'), '我的综合 vs 学院均值')
            + panel('我的课堂质量指数周趋势', chart('c2', 'h260'), '本学期')
            + '</div>'
            + panel('我的报告清单', table(
              ['报告名称', '生成时间', '生成部门', '状态'],
              s.reports, { tagCols: [3] }), '共 6 份')
            + '';
        },
        init: function (root) {
          var s = D.review.qualityReport;
          Charts.radar(root.querySelector('#c1'), { axes: s.radar.axes, series: s.radar.series, height: 260 });
          Charts.line(root.querySelector('#c2'), { labels: s.trend.labels, series: s.trend.series, height: 260, yMin: 90 });
          root.querySelector('#btn1').onclick = function () { toast('正在汇聚我的评教、评学、同行与督导数据…报告已生成（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('已打开我的历史报告归档（Demo）'); };
        }
      },
      {
        id: 'warning', name: '我的教学预警', icon: 'alert',
        render: function () {
          var s = D.review.warning;
          return pageHead('我的教学预警', '与我相关的教学质量异常提示（成绩波动、出勤率低、互动率低等），支持查看处置建议与闭环跟踪。',
            btn('预警规则说明', '', 'btn2') + btn('提交处置反馈', 'primary', 'btn1'))
            + kpiCards(s.kpis)
            + '<div class="grid g-3-2 mb14">'
            + panel('我的预警与处置趋势', chart('c1', 'h260'), '近 6 个月')
            + panel('我的预警类型分布', chart('c2', 'h260'))
            + '</div>'
            + panel('我的预警明细', table(
              ['预警时间', '对象', '课程', '预警类型', '异常说明', '级别', '状态'],
              s.rows, { tagCols: [5, 6] }), '实时')
            + '';
        },
        init: function (root) {
          var s = D.review.warning;
          Charts.bar(root.querySelector('#c1'), {
            labels: s.trend.labels,
            series: [
              { name: '我的预警', data: s.trend.series[0].data, color: '#ea5a5f' },
              { name: '已处置', data: s.trend.series[1].data, color: '#12a37f' }
            ], height: 260, legend: true
          });
          Charts.donut(root.querySelector('#c2'), {
            data: [
              { name: '互动率低', value: 2, color: '#f0a12e' },
              { name: '资源未使用', value: 1, color: '#3d7bff' },
              { name: '评教波动', value: 1, color: '#7a63f0' }
            ], height: 260, centerLabel: '我的预警', centerValue: 4
          });
          root.querySelector('#btn1').onclick = function () { toast('处置反馈已提交，预警闭环跟踪中（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('预警规则：出勤率 < 80%、成绩环比下降 > 10 分、互动率 < 75% 自动触发（Demo）'); };
        }
      }
    ]
  };

  /* ================================================================
     模块二：教师档案袋（教师个人视角 · 我的档案袋）
     ================================================================ */
  var portfolioModule = {
    id: 'portfolio', name: '教师档案袋', icon: 'folder', persona: 'teacher',
    desc: '教师视角 · 我的教学档案袋（荣誉 / 教学 / 培训 / 教研室 / 多维评价报告）',
    subs: [
      {
        id: 'honor', name: '我的荣誉档案', icon: 'award',
        render: function () {
          var p = D.portfolio;
          return pageHead('我的荣誉档案', '记录我获得的各类奖励、荣誉称号及表彰，形成个人教学荣誉墙与成长轨迹。',
            btn('新增荣誉', 'primary', 'btn1') + btn('导出荣誉证书清单', '', 'btn2'))
            + kpiCards([
              { label: '我的荣誉', value: p.summary.honors, unit: '项', delta: '+4' },
              { label: '国家级荣誉', value: 3, unit: '项', delta: '+1' },
              { label: '省部级荣誉', value: 4, unit: '项', delta: '+1' },
              { label: '本学期新增', value: 4, unit: '项', delta: '+2' }
            ])
            + '<div class="grid g-1-2 mb14">'
            + panel('我的荣誉级别构成', chart('c1', 'h260'), '按级别统计')
            + panel('我的荣誉增长', chart('c2', 'h260'), '项')
            + '</div>'
            + panel('我的荣誉明细 · ' + p.teacher.name + '（' + p.teacher.title + '）',
              table(['荣誉名称', '授予单位', '取得时间', '级别'], p.teacher.honors, { tagCols: [3] }),
              '共 ' + p.teacher.honors.length + ' 项')
            + '';
        },
        init: function (root) {
          Charts.donut(root.querySelector('#c1'), {
            data: D.portfolio.honorsStats, height: 260, centerLabel: '我的荣誉', centerValue: 21
          });
          Charts.bar(root.querySelector('#c2'), {
            labels: ['23-24上', '23-24下', '24-25上', '24-25下', '25-26上', '25-26下'],
            data: [2, 3, 4, 5, 4, 3], colors: ['#12a37f'], height: 260, valueLabels: true
          });
          root.querySelector('#btn1').onclick = function () { toast('荣誉录入表单已打开（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('荣誉证书清单导出中…（Demo）'); };
        }
      },
      {
        id: 'record', name: '我的教学档案', icon: 'book',
        render: function () {
          var t = D.portfolio.teacher;
          return pageHead('我的教学档案', '我的教学工作总量、授课课程、学生评价、教学改革项目等，形成个人教学工作全景档案。',
            btn('切换学年', '', 'btn2') + btn('导出教学档案', 'primary', 'btn1'))
            + '<div class="panel mb14" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">'
            + '<div class="avatar" style="width:52px;height:52px;font-size:18px;">张</div>'
            + '<div style="flex:1;min-width:220px;"><div style="font-size:16px;font-weight:700;">' + t.name + '　<span class="muted">' + t.title + '</span></div>'
            + '<div class="muted" style="margin-top:3px;">' + t.dept + '　·　教龄 ' + t.years + ' 年　·　主讲课程 ' + t.courses + ' 门</div></div>'
            + '<div style="display:flex;gap:26px;">'
            + '<div><div class="muted">我的教学工作量</div><div style="font-size:20px;font-weight:700;" class="mono">' + t.hours + ' <span class="muted" style="font-size:12px;">学时</span></div></div>'
            + '<div><div class="muted">我的学生评教</div><div style="font-size:20px;font-weight:700;color:#12a37f;" class="mono">' + t.rating + '</div></div>'
            + '</div></div>'
            + '<div class="grid g-3-2 mb14">'
            + panel('我的教学工作量', chart('c1', 'h260'), '学时')
            + panel('我的教学工作雷达', chart('c2', 'h260'), 'vs 学院均值')
            + '</div>'
            + panel('我的授课明细', table(
              ['课程名称', '授课班级', '学时', '学生评教', '课程级别'],
              t.courses, { numCols: [2, 3], scoreCols: [3], tagCols: [4] }), '2025-2026 学年')
            + '';
        },
        init: function (root) {
          var t = D.portfolio.teacher;
          Charts.bar(root.querySelector('#c1'), {
            labels: ['23-24上', '23-24下', '24-25上', '24-25下', '25-26上', '25-26下'],
            data: [286, 312, 328, 356, 386, 402], colors: ['#12a37f'], height: 260, valueLabels: true
          });
          Charts.radar(root.querySelector('#c2'), { axes: t.dims.axes, series: t.dims.series, height: 260 });
          root.querySelector('#btn1').onclick = function () { toast('我的教学档案（PDF）导出中…（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('已切换学年：2024-2025 学年（Demo）'); };
        }
      },
      {
        id: 'training', name: '我的培训交流', icon: 'plane',
        render: function () {
          var t = D.portfolio.teacher;
          return pageHead('我的培训交流档案', '记录我参加校内外培训、学术会议、访学交流等情况，跟踪个人教学能力成长轨迹。',
            btn('登记培训记录', 'primary', 'btn1'))
            + kpiCards([
              { label: '我的累计培训', value: 32, unit: '次', delta: '+6' },
              { label: '我的累计学时', value: 386, unit: '学时', delta: '+64' },
              { label: '我的境外访学', value: 2, unit: '次', delta: '+1' },
              { label: '我的培训完成率', value: 106, unit: '%', delta: '+6%' }
            ])
            + '<div class="grid g-3-2 mb14">'
            + panel('我的培训学时年度分布', chart('c1', 'h260'), '学时')
            + panel('我的培训类型构成', chart('c2', 'h260'))
            + '</div>'
            + panel('我的培训交流记录 · ' + t.name, '<div class="timeline">'
              + t.training.map(function (x) {
                return '<div class="tl-item"><div class="time">' + x[0] + '　·　' + x[2] + '　·　' + x[3] + '</div>'
                  + '<h4>' + x[1] + '</h4><p>已纳入我的教学发展档案，计入年度继续教育学时。</p></div>';
              }).join('') + '</div>', '教务 / 教发中心')
            + '';
        },
        init: function (root) {
          Charts.bar(root.querySelector('#c1'), {
            labels: ['2021', '2022', '2023', '2024', '2025'],
            data: [42, 56, 68, 86, 64], colors: ['#7a63f0'], height: 260, valueLabels: true
          });
          Charts.donut(root.querySelector('#c2'), {
            data: [
              { name: '校内培训', value: 12, color: '#12a37f' },
              { name: '国内会议', value: 9, color: '#3d7bff' },
              { name: '境外访学', value: 2, color: '#7a63f0' },
              { name: '在线课程', value: 9, color: '#f0a12e' }
            ], height: 260, centerLabel: '培训次数', centerValue: 32
          });
          root.querySelector('#btn1').onclick = function () { toast('培训记录登记成功，已计入我的档案袋（Demo）'); };
        }
      },
      {
        id: 'dept', name: '我的教研室', icon: 'hospital',
        render: function () {
          var ds = D.portfolio.departments;
          return pageHead('我的教研室档案', '我负责（或参与）的教研室团队资料、教研活动记录与成果汇总，支撑教研室建设与考核。',
            btn('新建教研室档案', 'primary', 'btn1'))
            + kpiCards([
              { label: '我负责的教研室', value: 1, unit: '个', foot: '心血管内科教研室' },
              { label: '我参与的教研室', value: 5, unit: '个', foot: '协作教研室' },
              { label: '教研室成员', value: 32, unit: '人', foot: '我负责的教研室' },
              { label: '年度教研活动', value: 46, unit: '次', delta: '+8' }
            ])
            + '<div class="card-grid g3 mb14">'
            + ds.map(function (d) {
              return '<div class="card"><h4>' + d.name + ' <span class="tag ' + (d.role === '负责人' ? 'green' : 'gray') + '">' + d.role + '</span></h4>'
                + '<p>负责人：' + d.lead + '　·　成员 ' + d.members + ' 人　·　课程 ' + d.courses + ' 门　·　年课时 ' + d.hours + '</p>'
                + '<div class="card-foot">' + d.tags.map(function (t) { return '<span class="tag blue">' + t + '</span>'; }).join('')
                + '<span class="tag green">教研评分 ' + d.score + '</span></div></div>';
            }).join('') + '</div>'
            + panel('教研室考核对比', chart('c1', 'h260'), '教研评分 / 课时量')
            + '';
        },
        init: function (root) {
          Charts.bar(root.querySelector('#c1'), {
            labels: D.portfolio.departments.map(function (d) { return d.name.replace('教研室', ''); }),
            series: [
              { name: '教研评分', data: D.portfolio.departments.map(function (d) { return d.score; }), color: '#12a37f' },
              { name: '课时量/10', data: D.portfolio.departments.map(function (d) { return Math.round(d.hours / 10); }), color: '#3d7bff' }
            ], height: 260, legend: true, yMax: 200
          });
          root.querySelector('#btn1').onclick = function () { toast('新建教研室档案成功（Demo）'); };
        }
      },
      {
        id: 'evalreport', name: '我的多维评价报告', icon: 'trending',
        render: function () {
          var e = D.portfolio.evalReport;
          var t = D.portfolio.teacher;
          return pageHead('我的多维教学评价报告', '面向教师个人评价的多维度、全周期教学评估报告，支持纵向对比与发展建议。',
            btn('生成我的报告', 'primary', 'btn1') + btn('推送至我的工作台', '', 'btn2'))
            + '<div class="grid g-2-1 mb14">'
            + panel('我的教学能力雷达（本期 vs 同期）', chart('c1', 'h300'), t.name)
            + panel('我的综合评分', chart('c2', 'h300'), '综合 94.6 分')
            + '</div>'
            + panel('我的分项评价得分', '<div style="display:flex;flex-direction:column;gap:12px;">'
              + e.items.map(function (x) {
                var v = x[1], pv = x[2], d = (v - pv).toFixed(1);
                return '<div><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px;">'
                  + '<span>' + x[0] + '</span><span class="mono">' + v + ' <span class="' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '+' : '') + d + '</span></span></div>'
                  + '<div class="bar ' + (v >= 95 ? 'green' : v >= 90 ? '' : 'amber') + '"><i style="width:' + v + '%"></i></div></div>';
              }).join('') + '</div>', '本期 vs 上期')
            + panel('AI 综合评语', '<p style="line-height:1.9;font-size:13.2px;color:var(--text-2);margin:0;">'
              + '本人教学态度严谨、课堂组织能力强，学生评教与督导评价均显著高于学院均值，教学工作量连续 3 学期递增。'
              + '教学改革参与度（88 分）略低于教学效果维度，建议进一步参与国家级虚拟仿真课程建设与教学方法创新项目，'
              + '并在青年教师带教中沉淀可推广的临床带教模式。</p>', '系统自动生成')
            + '';
        },
        init: function (root) {
          var e = D.portfolio.evalReport;
          Charts.radar(root.querySelector('#c1'), { axes: e.dims.axes, series: e.dims.series, height: 300 });
          Charts.gauge(root.querySelector('#c2'), { value: 94.6, max: 100, label: '我的综合教学评分', color: '#12a37f', height: 300, footer: '全院排名 前 5%' });
          root.querySelector('#btn1').onclick = function () { toast('我的多维教学评价报告生成完成（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('报告已推送至我的工作台（Demo）'); };
        }
      }
    ]
  };

  /* ================================================================
     模块三：教学（教师视角 · 我的教学）
     ================================================================ */
  var QUIZ = [
    {
      stem: '患者男，58岁，突发胸痛3小时，心电图示 V1-V4 导联 ST 段抬高，肌钙蛋白升高。最恰当的初始处理是？',
      options: ['立即口服阿司匹林后转诊', '静脉溶栓 + 抗凝 + 抗血小板治疗', '先行运动负荷试验明确诊断', '口服硝酸酯类药物后门诊随访'],
      answer: 1,
      analysis: '该患者为急性 ST 段抬高型心肌梗死（STEMI），发病 3 小时，应尽快再灌注治疗。首选急诊 PCI，若无法在 120 分钟内完成，应尽早静脉溶栓并联合抗凝、抗血小板治疗。运动负荷试验为 STEMI 禁忌。'
    },
    {
      stem: '女，32岁，反复右上腹隐痛 2 月，餐后加重，Murphy 征阳性。首选检查是？',
      options: ['腹部立位平片', '腹部超声', '胃镜', '腹部 CT 增强'],
      answer: 1,
      analysis: '临床表现符合慢性胆囊炎/胆囊结石，腹部超声为首选检查，无创、经济、对胆囊结石诊断灵敏度高。CT 增强用于并发症或肿瘤鉴别。'
    },
    {
      stem: '关于无菌操作原则，下列哪项是错误的？',
      options: ['无菌物品一经取出即使未用也不可放回', '无菌包潮湿后仍可使用', '手术人员穿无菌衣后肩以上视为有菌区', '一份无菌物品仅供一位患者使用'],
      answer: 1,
      analysis: '无菌包一旦潮湿即可被细菌穿透污染，必须重新灭菌，不得继续使用。其余选项均符合无菌技术操作原则。'
    }
  ];

  var teachingModule = {
    id: 'teaching', name: '教学', icon: 'cap', persona: 'teacher',
    desc: '教师视角 · 我的教学（虚拟医院教研室 / 我班的执医能力训练）',
    subs: [
      { group: '虚拟医院（我负责的教研室）' },
      {
        id: 'vr-show', name: '我的教研室风采', icon: 'layout',
        render: function () {
          var rooms = D.teaching.vrRooms;
          return pageHead('我的教研室风采搭建', '为我负责及协作的临床教研室提供专属线上展示空间，集中呈现师资队伍、特色课程、实训项目、教学成果、典型病例库等内容，支撑科室间教学经验交流与成果共享。',
            btn('预览展示页', '', 'btn2') + btn('新增展示间', 'primary', 'btn1'))
            + kpiCards([
              { label: '我负责的展示间', value: 1, unit: '个', foot: '心血管内科教研室' },
              { label: '我上传的教学资源', value: 286, unit: '份', delta: '+42' },
              { label: '我维护的病例库', value: 96, unit: '例', delta: '+12' },
              { label: '我的展示间访问量', value: 8620, unit: '次', delta: '+18.6%' }
            ])
            + '<div class="card-grid g3 mb14">'
            + rooms.map(function (r) {
              return '<div class="card"><h4>' + Icon(r.icon, 15) + ' ' + r.name + ' <span class="tag ' + (r.mine ? 'green' : 'gray') + '">' + (r.mine ? '我负责' : '协作') + '</span></h4>'
                + '<p>' + r.desc + '</p>'
                + '<div class="card-foot">' + r.tags.map(function (t) { return '<span class="tag blue">' + t + '</span>'; }).join('') + '</div></div>';
            }).join('') + '</div>'
            + '<div class="grid g2">'
            + panel('我的资源上传量（按展示间）', chart('c1', 'h260'), '份')
            + panel('我的展示间访问来源', chart('c2', 'h260'))
            + '</div>';
        },
        init: function (root) {
          Charts.hbar(root.querySelector('#c1'), {
            items: D.teaching.vrRooms.map(function (r, i) {
              return { name: r.name.replace('教研室', ''), value: [286, 62, 38, 46, 32, 22][i], color: Charts.palette[i % 8] };
            }), height: 260, unit: ' 份'
          });
          Charts.donut(root.querySelector('#c2'), {
            data: [
              { name: '我班学生', value: 4860, color: '#12a37f' },
              { name: '院内师生', value: 2280, color: '#3d7bff' },
              { name: '院外同行', value: 1080, color: '#7a63f0' },
              { name: '其他', value: 400, color: '#f0a12e' }
            ], height: 260, centerLabel: '访问量', centerValue: 8620
          });
          root.querySelector('#btn1').onclick = function () { toast('新增展示间：请填写科室、师资、课程与成果信息（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('已生成我的教研室展示页预览链接（Demo）'); };
        }
      },
      {
        id: 'vr-custom', name: '教研室特色需求定制', icon: 'sliders',
        render: function () {
          var c = D.teaching.vrConfig;
          return pageHead('教研室特色需求定制', '按我负责教研室的学科特色与教学目标，自主定制实训场景、病例资源、考核标准与训练流程，适配科室教学差异化需求。',
            btn('重置', '', 'btn2') + btn('保存定制方案', 'primary', 'btn1'))
            + '<div class="grid g-1-2">'
            + panel('定制信息', '<div class="form-row"><label>教研室</label><select id="fDept">'
              + D.portfolio.departments.map(function (d) { return '<option>' + d.name + (d.role === '负责人' ? '（我负责）' : '') + '</option>'; }).join('')
              + '</select></div>'
              + '<div class="form-row"><label>方案名称</label><input type="text" id="fName" value="心血管内科临床技能特色实训方案" /></div>'
              + '<div class="form-row"><label>适用对象</label><input type="text" value="临床医学专业 2023 级（我带的班级）" /></div>'
              + '<div class="form-row"><label>训练周期</label><input type="text" value="16 周 / 每周 4 学时" /></div>')
            + panel('定制项配置（点击选择）', '<div style="display:flex;flex-direction:column;gap:14px;">'
              + customGroup('实训场景', c.scenes)
              + customGroup('病例资源', c.resources)
              + customGroup('考核标准', c.standards)
              + customGroup('训练流程', c.flows)
              + '</div>', '已选 <b id="selCount">0</b> 项')
            + '</div>'
            + panel('方案预览', '<div id="preview" class="item-list"></div>', '实时生成');
        },
        init: function (root) {
          function update() {
            var on = root.querySelectorAll('.chip.on');
            root.querySelector('#selCount').textContent = on.length;
            var box = root.querySelector('#preview');
            if (!on.length) { box.innerHTML = '<div class="muted">请选择左侧定制项，系统将实时生成特色实训方案预览。</div>'; return; }
            box.innerHTML = ['实训场景', '病例资源', '考核标准', '训练流程'].map(function (gname, gi) {
              var items = [];
              root.querySelectorAll('.chip-group[data-g="' + gi + '"] .chip.on').forEach(function (c) { items.push(c.textContent); });
              if (!items.length) return '';
              return '<div class="item"><div class="ico-box">' + Icon(['play', 'folder', 'ruler', 'refresh'][gi], 15) + '</div><div class="body"><strong>' + gname + '</strong>'
                + '<span>' + items.join('　·　') + '</span></div><div class="side"><span class="tag blue">已启用</span></div></div>';
            }).join('');
          }
          root.querySelectorAll('.chip-group').forEach(function (g) {
            g.querySelectorAll('.chip').forEach(function (c) {
              c.addEventListener('click', function () { c.classList.toggle('on'); update(); });
            });
          });
          update();
          root.querySelector('#btn1').onclick = function () { toast('教研室特色实训方案已保存并下发至我的教学任务（Demo）'); };
          root.querySelector('#btn2').onclick = function () {
            root.querySelectorAll('.chip.on').forEach(function (c) { c.classList.remove('on'); });
            update(); toast('已重置定制项');
          };
        }
      },
      { group: '执医能力训练（我带的班级）' },
      {
        id: 'exam-test', name: '我班的知识测评', icon: 'edit',
        render: function () {
          var e = D.teaching.exam;
          return pageHead('我班的知识测评', '查看我带的班级在执医知识点测评中的表现，定位薄弱点；支持在线试做与即时判分。',
            btn('换一题', '', 'btn2') + btn('发起班级测评', 'primary', 'btn1'))
            + kpiCards(e.kpis, 'g5')
            + '<div class="grid g-3-2 mb14">'
            + panel('我班的知识点掌握度', chart('c1', 'h300'), '我带的班级 vs 目标值')
            + panel('在线试做', '<div id="quizBox"></div>', '单选 · 即时判分')
            + '</div>'
            + panel('我班高频错题知识点 TOP', chart('c2', 'h260'), '近 30 天')
            + '';
        },
        init: function (root) {
          var e = D.teaching.exam;
          Charts.radar(root.querySelector('#c1'), { axes: e.weak.axes, series: e.weak.series, height: 300 });
          Charts.hbar(root.querySelector('#c2'), {
            items: [
              { name: '心电图判读', value: 62.4, color: '#ea5a5f' },
              { name: '抗生素应用', value: 66.8, color: '#f0a12e' },
              { name: '酸碱平衡', value: 68.2, color: '#f0a12e' },
              { name: '神经系统定位', value: 71.6, color: '#3d7bff' },
              { name: '儿科液体疗法', value: 74.2, color: '#3d7bff' }
            ], height: 260, unit: '%', maxV: 100, labelWidth: 110
          });

          var box = root.querySelector('#quizBox');
          var qi = 0, picked = -1, done = false;
          function render() {
            var q = QUIZ[qi];
            box.innerHTML = '<div style="font-size:13.4px;line-height:1.85;margin-bottom:12px;">' + q.stem + '</div>'
              + q.options.map(function (o, i) {
                var cls = 'opt';
                if (done) { if (i === q.answer) cls += ' right'; else if (i === picked) cls += ' wrong'; }
                else if (i === picked) cls += ' on';
                return '<div class="' + cls + '" data-i="' + i + '"><div class="key">' + 'ABCD'.charAt(i) + '</div><div>' + o + '</div></div>';
              }).join('')
              + (done ? '<div class="panel" style="margin-top:12px;background:rgba(18,163,127,.07);"><div style="font-weight:700;margin-bottom:6px;font-size:13px;">解析</div><div style="font-size:12.8px;line-height:1.85;color:var(--text-2);">' + q.analysis + '</div></div>' : '');
            box.querySelectorAll('.opt').forEach(function (el) {
              el.addEventListener('click', function () {
                if (done) return;
                picked = +el.getAttribute('data-i');
                done = true;
                render();
                toast(picked === q.answer ? '回答正确，已计入班级掌握度' : '回答错误，已加入班级错题本');
              });
            });
          }
          render();
          root.querySelector('#btn2').onclick = function () { qi = (qi + 1) % QUIZ.length; picked = -1; done = false; render(); };
          root.querySelector('#btn1').onclick = function () { toast('班级测评已发布：内科系统 50 题 / 60 分钟（Demo）'); };
        }
      },
      {
        id: 'exam-recommend', name: '个性化智能推荐', icon: 'target',
        render: function () {
          var e = D.teaching.exam;
          return pageHead('个性化智能推荐', '“一生一案”思路：基于我班学生的前侧测评结果，智能推荐执医习题与相应知识点资源，我可在推送前复核调整。',
            btn('重新生成推送方案', 'primary', 'btn1'))
            + '<div class="grid g-2-1 mb14">'
            + panel('推荐资源匹配度', chart('c1', 'h300'), '基于我班掌握度画像')
            + panel('班级学习画像', chart('c2', 'h300'), '临床医学2022级1班')
            + '</div>'
            + panel('为我班生成的推荐清单', '<div class="item-list">'
              + e.recommend.map(function (r) {
                return '<div class="item"><div class="ico-box">' + Icon(r[2] >= 90 ? 'star' : 'book', 15) + '</div>'
                  + '<div class="body"><strong>' + r[0] + '</strong><span>' + r[1] + '　·　' + r[3] + '</span></div>'
                  + '<div class="side"><div class="bar ' + (r[2] >= 90 ? 'green' : '') + '" style="width:110px;margin-bottom:5px;"><i style="width:' + r[2] + '%"></i></div>'
                  + '<span class="mono">匹配度 ' + r[2] + '%</span></div></div>';
              }).join('') + '</div>', '“一生一案” · 待我复核')
            + '';
        },
        init: function (root) {
          var e = D.teaching.exam;
          Charts.hbar(root.querySelector('#c1'), {
            items: e.recommend.map(function (r, i) {
              return { name: r[0].slice(0, 10), value: r[2], color: Charts.palette[i % 8] };
            }), height: 300, unit: '%', maxV: 100, labelWidth: 140
          });
          Charts.radar(root.querySelector('#c2'), {
            axes: e.weak.axes,
            series: [{ name: '我班实际掌握度', data: e.weak.series[0].data, color: '#12a37f' }, { name: '目标值', data: [85, 85, 85, 85, 85, 85], color: '#f0a12e' }],
            height: 300
          });
          root.querySelector('#btn1').onclick = function () { toast('已根据我班最新测评结果重新生成“一生一案”学习方案（Demo）'); };
        }
      },
      {
        id: 'exam-agent', name: '智能体赋能备考', icon: 'cpu',
        render: function () {
          var e = D.teaching.exam;
          return pageHead('智能体赋能备考', '我班执医考试全流程备考管理与资源推送，由智能体完成学情跟踪、计划调度与资源精准投递，我负责审核与答疑。',
            btn('配置推送策略', '', 'btn2') + btn('立即推送至我班', 'primary', 'btn1'))
            + kpiCards([
              { label: '我班备考学生', value: 386, unit: '人', foot: '临床医学2022级1/2班' },
              { label: '为我班推送资源', value: 12864, unit: '次', delta: '+22.6%' },
              { label: '我班计划完成率', value: 86.4, unit: '%', delta: '+5.2%' },
              { label: '我班模拟通过率', value: 84.2, unit: '%', delta: '+3.6%' }
            ])
            + panel('我班备考全流程', '<div class="steps">'
              + [['入学测评', '生成班级知识画像与薄弱点标签'],
              ['计划生成', '智能体按考点权重编排周计划'],
              ['资源推送', '错题关联资源 + 高频考点微课'],
              ['阶段测评', '每两周一次模拟测评与排名'],
              ['复盘强化', 'AI 复盘失分点，动态调整计划'],
              ['冲刺陪练', '考前 30 天高频问答与技能提示']]
                .map(function (s, i) {
                  return '<div class="step' + (i < 3 ? ' done' : '') + '"><div class="idx">' + (i + 1) + '</div><h4>' + s[0] + '</h4><p>' + s[1] + '</p></div>';
                }).join('') + '</div>', '智能体自动调度 · 教师审核')
            + '<div class="grid g2 mt14">'
            + panel('我班的资源推送记录', table(['时间', '推送内容', '覆盖人数', '推送范围', '状态'], e.pushed, { tagCols: [4] }), '近 30 天')
            + panel('我班备考进度分布', chart('c1', 'h220'), '按备考阶段')
            + '</div>';
        },
        init: function (root) {
          Charts.donut(root.querySelector('#c1'), {
            data: [
              { name: '基础阶段', value: 86, color: '#12a37f' },
              { name: '强化阶段', value: 146, color: '#3d7bff' },
              { name: '冲刺阶段', value: 112, color: '#f0a12e' },
              { name: '考前一周', value: 42, color: '#ea5a5f' }
            ], height: 220, centerLabel: '我班学生', centerValue: 386
          });
          root.querySelector('#btn1').onclick = function () { toast('已向我带的 386 名学生推送《执医考点每日一练》第43期（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('推送策略：按我班薄弱点权重 + 遗忘曲线智能调度（Demo）'); };
        }
      }
    ]
  };

  function customGroup(title, items) {
    return '<div><div style="font-size:12.5px;font-weight:600;color:var(--text-2);margin-bottom:8px;">' + title + '</div>'
      + '<div class="chips chip-group" data-g="' + ['实训场景', '病例资源', '考核标准', '训练流程'].indexOf(title) + '">'
      + items.map(function (i, k) { return '<div class="chip' + (k < 3 ? ' on' : '') + '">' + i + '</div>'; }).join('') + '</div></div>';
  }

  /* ================================================================
     模块四：专业建设（专业建设负责人视角）
     ================================================================ */
  var majorModule = {
    id: 'major', name: '专业建设', icon: 'layers', persona: 'major',
    desc: '专业建设负责人视角 · 我负责的专业（临床医学）：岗位需求 / 能力图谱 / 知识结构 / 重合度 / 建设报告',
    subs: [
      {
        id: 'demand', name: '岗位需求分析', icon: 'search',
        render: function () {
          var d = D.major.demand;
          var i = D.major.info;
          return pageHead('岗位需求分析', '基于行业大数据，智能分析医学岗位需求，为「' + i.name + '」培养方案修订提供依据。',
            btn('更新数据源', '', 'btn2') + btn('生成分析简报', 'primary', 'btn1'))
            + '<div class="persona-inline">'
            + '<span class="tag green">我负责的专业</span><b>' + i.name + '</b>'
            + '<span class="muted">' + i.level + '　·　在校学生 ' + i.students + ' 人　·　课程 ' + i.courses + ' 门　·　专业教师 ' + i.teachers + ' 人　·　' + i.cycle + '</span>'
            + '</div>'
            + kpiCards(d.kpis)
            + '<div class="grid g-3-2 mb14">'
            + panel('岗位需求指数趋势', chart('c1', 'h260'), '以 2020 年为基期 100')
            + panel('热门岗位需求分布', chart('c2', 'h260'), '招聘岗位数')
            + '</div>'
            + panel('岗位需求明细（行业大数据）', table(
              ['岗位名称', '对应专业', '需求岗位数', '同比变化', '核心能力要求', '紧缺程度'],
              d.rows, { numCols: [2], tagCols: [5] }), '样本 38,420 条')
            + '';
        },
        init: function (root) {
          var d = D.major.demand;
          Charts.line(root.querySelector('#c1'), { labels: d.trend.labels, series: d.trend.series, height: 260 });
          Charts.bar(root.querySelector('#c2'), {
            labels: d.hot.map(function (h) { return h.name.replace('医师', ''); }),
            data: d.hot.map(function (h) { return h.value; }),
            colors: d.hot.map(function (h) { return h.color; }),
            height: 260, valueLabels: true
          });
          root.querySelector('#btn1').onclick = function () { toast('岗位需求分析简报已生成，可提交培养方案修订会议（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('已同步 1,268 家用人单位最新招聘数据（Demo）'); };
        }
      },
      {
        id: 'ability-map', name: '岗位能力图谱', icon: 'network',
        render: function () {
          return pageHead('岗位能力图谱', '围绕我负责专业对应的岗位，系统梳理并结构化展示所需知识、技能、素质等能力要素及其层级关系，用于精准指导人才选拔、培养与评估。',
            btn('导出图谱', '', 'btn2') + btn('编辑图谱', 'primary', 'btn1'))
            + '<div class="grid g-2-1 mb14">'
            + panel('能力要素层级图', '<div class="tree">'
              + D.major.abilityMap.map(function (b) {
                return '<div><div class="tree-root">' + Icon('layers', 15) + ' ' + b.root + '</div><div class="tree-branch" style="margin-top:8px;">'
                  + b.children.map(function (c) {
                    return '<div style="margin-bottom:8px;"><span class="tree-node" style="background:rgba(18,163,127,.12);border-color:transparent;"><b>' + c.name + '</b> <small>' + c.kids.length + ' 项</small></span><br>'
                      + c.kids.map(function (k) { return '<span class="tree-node">' + k + '</span>'; }).join('') + '</div>';
                  }).join('') + '</div></div>';
              }).join('') + '</div>', '3 大能力域 / 9 项能力 / 32 个能力项')
            + panel('能力项分布', chart('c1', 'h300'), '按能力域统计')
            + '</div>'
            + panel('能力要求强度（岗位侧）', chart('c2', 'h260'), '岗位提及率')
            + '';
        },
        init: function (root) {
          Charts.donut(root.querySelector('#c1'), {
            data: [
              { name: '临床诊疗能力', value: 12, color: '#12a37f' },
              { name: '临床操作技能', value: 9, color: '#2ec8a6' },
              { name: '医学人文素养', value: 6, color: '#7a63f0' },
              { name: '科研与创新', value: 8, color: '#f0a12e' },
              { name: '职业素养', value: 6, color: '#3d7bff' },
              { name: '数字化/AI 能力', value: 4, color: '#e07ba0' }
            ], height: 300, centerLabel: '能力项', centerValue: 45
          });
          Charts.hbar(root.querySelector('#c2'), {
            items: [
              { name: '临床诊疗能力', value: 96.4, color: '#12a37f' },
              { name: '临床操作技能', value: 92.8, color: '#2ec8a6' },
              { name: '医患沟通能力', value: 88.6, color: '#7a63f0' },
              { name: '数据分析能力', value: 76.2, color: '#f0a12e' },
              { name: '科研创新能力', value: 68.4, color: '#3d7bff' },
              { name: 'AI 工具应用', value: 62.6, color: '#e07ba0' }
            ], height: 260, unit: '%', maxV: 100, labelWidth: 120
          });
          root.querySelector('#btn1').onclick = function () { toast('能力图谱编辑模式已开启（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('岗位能力图谱已导出（PNG / Excel）（Demo）'); };
        }
      },
      {
        id: 'knowledge', name: '专业知识结构可视化', icon: 'gitBranch',
        render: function () {
          return pageHead('专业知识结构可视化', '将「临床医学」专业课程体系、知识结构进行可视化呈现，便于我作为专业负责人全局把控课程设置与知识覆盖。',
            btn('课程体系编辑器', 'primary', 'btn1'))
            + '<div class="grid g3 mb14">'
            + D.major.knowledge.map(function (k) {
              return '<div class="panel"><div class="panel-head"><h3>' + k.name + '</h3><span class="sub">' + k.modules.length + ' 门课程</span></div>'
                + k.modules.map(function (m, j) {
                  var w = [92, 86, 78, 72, 68, 62][j % 6];
                  return '<div style="margin-bottom:9px;"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;"><span>' + m + '</span><span class="muted mono">' + w + '%</span></div>'
                    + '<div class="bar"><i style="width:' + w + '%"></i></div></div>';
                }).join('') + '</div>';
            }).join('') + '</div>'
            + '<div class="grid g-3-2">'
            + panel('课程—知识领域关联矩阵', '<div id="heat1"></div>', '颜色越深表示知识覆盖越集中')
            + panel('各学期学时分布', chart('c1', 'h300'), '学时')
            + '</div>';
        },
        init: function (root) {
          Charts.heatmap(root.querySelector('#heat1'), {
            labels: ['基础医学', '临床医学', '医学技术', '人文交叉'],
            matrix: [
              [100, 46, 32, 18],
              [42, 100, 58, 26],
              [28, 54, 100, 22],
              [20, 30, 24, 100]
            ], max: 100
          });
          Charts.bar(root.querySelector('#c1'), {
            labels: ['第1学期', '第2学期', '第3学期', '第4学期', '第5学期', '第6学期'],
            data: [386, 412, 468, 496, 386, 296], colors: ['#12a37f'], height: 300, valueLabels: true
          });
          root.querySelector('#btn1').onclick = function () { toast('课程体系编辑器已打开，可拖拽调整课程与知识模块映射（Demo）'); };
        }
      },
      {
        id: 'overlap', name: '知识点重合度分析', icon: 'grid',
        render: function () {
          var df = [
            ['内科学 ↔ 诊断学', '38%', '高', '心电图与体格检查内容存在交叉，建议明确分工'],
            ['诊断学 ↔ 医学影像学', '46%', '高', '影像判读部分重复，建议统一由影像教研室承担'],
            ['病理学 ↔ 内科学', '42%', '高', '疾病发生机制与临床表型衔接处重叠'],
            ['外科学 ↔ 病理学', '35%', '中', '手术病理章节建议合并讲授'],
            ['药理学 ↔ 内科学', '30%', '中', '用药部分存在示例重复，可保留差异化案例'],
            ['儿科学 ↔ 内科学', '24%', '低', '重合度处于合理区间']
          ];
          return pageHead('知识点重合度分析', '检测我负责专业各门课程间的知识点重叠情况，避免重复教学，优化内容编排与教研室分工。',
            btn('优化建议', '', 'btn2') + btn('导出重合度报告', 'primary', 'btn1'))
            + kpiCards([
              { label: '本专业课程', value: 96, unit: '门', delta: '+8' },
              { label: '知识点总量', value: 8642, unit: '个', delta: '+426' },
              { label: '高重合知识点', value: 386, unit: '个', delta: '-62' },
              { label: '平均重合度', value: 28.4, unit: '%', delta: '-3.2%' }
            ])
            + '<div class="grid g-1-2 mb14">'
            + panel('重合度矩阵', '<div id="heat1"></div>', '内科学 / 外科学 / 诊断学 / 影像学 / 病理学 / 药理学')
            + panel('重合知识点数量分布', chart('c1', 'h300'), '个')
            + '</div>'
            + panel('高重合度明细与处理建议', table(['课程对', '重合度', '程度', '处理建议'], df, { tagCols: [1, 2] }), '自动检测')
            + '';
        },
        init: function (root) {
          Charts.heatmap(root.querySelector('#heat1'), {
            labels: ['内科', '外科', '诊断', '影像', '病理', '药理'], matrix: D.major.overlap, max: 50
          });
          Charts.bar(root.querySelector('#c1'), {
            labels: D.major.overlapLabels,
            data: [86, 72, 96, 62, 74, 48], colors: ['#e07ba0'], height: 300, valueLabels: true
          });
          root.querySelector('#btn1').onclick = function () { toast('知识点重合度分析报告已导出，可提交教研室分工调整（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('已生成 12 条内容编排优化建议并推送至课程负责人（Demo）'); };
        }
      },
      {
        id: 'report', name: '专业建设分析报告', icon: 'fileText',
        render: function () {
          var i = D.major.info;
          return pageHead('专业建设分析报告', '综合本专业多维度数据，输出专业建设质量、改进方向等分析报告，支撑专业负责人年度建设与申报。',
            btn('导出 Word', '', 'btn2') + btn('生成新版报告', 'primary', 'btn1'))
            + kpiCards(D.major.report.kpis.map(function (k) { return { label: k[0], value: k[1], unit: k[2], delta: '+2.4%' }; }))
            + '<div class="panel doc">'
            + '<h2>' + i.name + '专业建设质量分析报告</h2>'
            + '<div class="doc-meta">专业负责人：' + i.owner + '　|　建设级别：' + i.level + '　|　报告周期：2025-2026 学年第一学期　|　数据来源：行业大数据、教务系统、评教系统、实习基地反馈</div>'
            + '<section><h3>一、总体判断</h3>'
            + '<p>本期专业建设达成度 92.6%，较上期提升 2.4 个百分点。课程体系完整度 88.4%，产教融合度 84.2%，毕业生岗位适配度 91.3%。'
            + '整体呈现“课程体系稳定、实践教学成效突出、产教融合与成果转化仍需加强”的特征。</p></section>'
            + '<section><h3>二、行业需求趋势</h3>'
            + '<p>行业大数据显示，临床医学岗位需求指数由 2020 年的 100 上升至 2025 年的 136，医学技术类岗位需求增长更快（158）。'
            + '重症医学、影像诊断、医学检验等方向岗位需求同比增幅超过 15%，对 AI 辅助诊断与数据分析能力提出明确要求。</p></section>'
            + '<section><h3>三、课程与知识点分析</h3>'
            + '<ol><li>平均知识点重合度 28.4%，其中“诊断学 ↔ 医学影像学”重合度 46%，需重新划分教学边界。</li>'
            + '<li>人文交叉类课程学时占比 12.6%，低于培养方案建议值（15%）。</li>'
            + '<li>虚拟仿真课程已建设 62 门，覆盖 6 个教研室，建议扩展至急诊、儿科等薄弱环节。</li></ol></section>'
            + '<section><h3>四、改进方向</h3>'
            + '<ol><li>重构“诊断学—影像学—内科学”知识边界，形成统一知识点地图与责任教研室分工。</li>'
            + '<li>将数据分析与人工智能基础纳入临床医学核心能力项，新增 2 门交叉课程。</li>'
            + '<li>推进产教融合：与 M9 高校及区域三甲医院共建 3 个联合实训基地。</li>'
            + '<li>建立专业建设年度监测看板，实现达成度指标按学期滚动评估。</li></ol></section>'
            + '</div>';
        },
        init: function (root) {
          root.querySelector('#btn1').onclick = function () { toast('新版专业建设分析报告已生成（Demo）'); };
          root.querySelector('#btn2').onclick = function () { toast('报告导出中…（Demo）'); };
        }
      }
    ]
  };

  /* ================================================================
     模块五：智能体（教师个人 AI 工具）
     ================================================================ */
  var agentSubs = [];
  Object.keys(D.agents).forEach(function (key) {
    var a = D.agents[key];
    agentSubs.push({
      key: a.key, name: a.name.replace('智能体', ''), icon: a.icon,
      render: function () {
        return pageHead(a.name, a.desc, btn('切换场景', '', 'btn2') + btn('提交我的作答', 'primary', 'btnChat'))
          + '<div class="grid g-2-1">'
          + panel('交互式训练（我的工作台）', chatShell(a), '多轮对话 · 实时反馈')
          + '<div>'
          + panel('能力清单', '<div class="item-list">'
            + a.abilities.map(function (x) {
              return '<div class="item"><div class="ico-box">' + Icon('check', 14) + '</div><div class="body"><strong>' + x[0] + '</strong><span>' + x[1] + '</span></div></div>';
            }).join('') + '</div>')
          + panel('我的使用统计', '<div class="grid g2" style="gap:10px;">'
            + ['我本月使用', '平均得分', '教师复核率', '满意度'].map(function (l, i) {
              var v = [a.usage[0], a.usage[1], a.usage[2] + '%', a.usage[3] + '%'][i];
              return '<div class="kpi" style="padding:11px 13px;"><div class="label" style="font-size:12px;">' + l + '</div><div class="value" style="font-size:20px;">' + v + '</div></div>';
            }).join('') + '</div>', '近 30 天（个人）', 'mt14')
          + '</div></div>';
      },
      init: function (root) { bindChat(root, a); }
    });
  });

  var agentModule = {
    id: 'agent', name: '智能体', icon: 'bot', persona: 'teacher',
    desc: '教师视角 · 我的 AI 教学工具（AI 能力中心）',
    subs: agentSubs
  };

  /* ================================================================
     模块六：数据驾驶舱（院领导视角 · 全院各板块全维度数据）
     ================================================================ */
  function dashKpis(items) {
    return '<div class="dash-kpis mb14">' + items.map(function (k) {
      return '<div class="dash-kpi"><div class="label">' + k.label + '</div><div class="value">' + k.value
        + (k.unit ? '<span class="unit">' + k.unit + '</span>' : '') + '</div><div class="foot">' + (k.foot || '') + '</div></div>';
    }).join('') + '</div>';
  }

  function dashTitle(title, sub) {
    return '<div class="dash-title"><h1>' + title + '</h1>'
      + '<div class="side-info">' + (sub || '') + '</div></div>';
  }

  var dashModule = {
    id: 'dash', name: '数据驾驶舱', icon: 'activity', dash: true, persona: 'leader',
    desc: '院领导视角 · 全院教学数据驾驶舱（各板块全维度数据 + M9 对标）',
    subs: [
      {
        id: 'overview', name: '教学核心指标总览', icon: 'pie',
        render: function () {
          var c = D.dash.core;
          return dashTitle('重庆医科大学附属第二医院 · 教学数据驾驶舱', '院领导视角 · 全院数据 · ' + new Date().toLocaleString('zh-CN'))
            + dashKpis(D.dash.kpis)
            + '<div class="dash-sections mb14">' + D.dash.boardSections.map(function (s) {
              return '<div class="ds-card" data-go="' + s.go + '"><div class="ds-icon">' + Icon(s.icon, 18) + '</div>'
                + '<div><div class="ds-name">' + s.name + '</div><div class="ds-metric">' + s.metric + '</div>'
                + '<div class="ds-detail">' + s.detail + '</div></div></div>';
            }).join('') + '</div>'
            + '<div class="grid g4 mb14">'
            + c.gauges.map(function (g, i) { return panel(g.label, chart('g' + i, 'h180')); }).join('')
            + panel('课程类型构成', chart('c1', 'h180'), '门')
            + '</div>'
            + panel('本科专业建设情况（全院）', table(
              ['专业名称', '建设级别', '在校学生', '专业建设指数', '评价'],
              c.majors, { numCols: [2, 3], scoreCols: [3], tagCols: [1, 4] }), '12 个本科专业')
            + '<div class="grid g-3-2 mt14">'
            + panel('专业建设指数对比', chart('c2', 'h260'), '指数')
            + panel('资源建设', chart('c3', 'h260'), '项')
            + '</div>';
        },
        init: function (root) {
          var c = D.dash.core;
          c.gauges.forEach(function (g, i) {
            Charts.gauge(root.querySelector('#g' + i), { value: g.value, max: 100, label: g.label, color: g.color, height: 180 });
          });
          Charts.donut(root.querySelector('#c1'), { data: c.courseMix, height: 180, centerLabel: '课程总数', centerValue: 486 });
          Charts.bar(root.querySelector('#c2'), {
            labels: c.majors.map(function (m) { return m[0]; }),
            data: c.majors.map(function (m) { return m[3]; }),
            colors: ['#12a37f', '#3d7bff', '#7a63f0', '#2ec8a6', '#f0a12e', '#e07ba0'],
            height: 260, valueLabels: true, yMax: 100
          });
          Charts.bar(root.querySelector('#c3'), {
            labels: ['一流课程', '虚拟仿真', '教改项目', '教材出版', '教学成果奖'],
            data: [34, 62, 118, 26, 128], colors: ['#12a37f'], height: 260, valueLabels: true
          });
        }
      },
      {
        id: 'monitor', name: '教学质量运行监测', icon: 'activity',
        render: function () {
          return dashTitle('教学质量运行监测', '实时监测 · 每 5 秒刷新')
            + '<div class="grid g4 mb14" id="liveKpis">' + D.dash.monitor.kpis.map(function (k) {
              return '<div class="dash-kpi"><div class="label">' + k.label + '</div><div class="value">' + k.value
                + (k.unit ? '<span class="unit">' + k.unit + '</span>' : '') + '</div><div class="foot">' + k.foot + '</div></div>';
            }).join('') + '</div>'
            + '<div class="grid g-2-1 mb14">'
            + panel('课堂质量 / 出勤 / 互动 实时趋势', chart('c1', 'h300'), '实时流数据')
            + panel('多维课堂质量雷达', chart('c2', 'h300'), '本院 vs 校均值')
            + '</div>'
            + '<div class="grid g-1-2">'
            + panel('今日课堂质量分布', chart('c3', 'h260'), '128 间在线课堂')
            + panel('待处置教学预警（全院）', table(
              ['时间', '预警对象', '类型', '级别', '状态'],
              D.dash.monitor.warnings, { tagCols: [3, 4] }), '实时')
            + '</div>';
        },
        init: function (root) {
          var m = D.dash.monitor;
          function drawLine(lastShift) {
            var labels = m.trend.labels.slice();
            var series = m.trend.series.map(function (s) {
              return { name: s.name, data: s.data.slice(), color: s.color };
            });
            if (lastShift) {
              labels = labels.slice(1).concat('实时');
              series.forEach(function (s, i) {
                s.data = s.data.slice(1).concat([+(s.data[s.data.length - 1] + (Math.random() - .45) * (i === 0 ? 1.6 : 3)).toFixed(1)]);
              });
            }
            Charts.line(root.querySelector('#c1'), { labels: labels, series: series, height: 300, yMin: 60 });
          }
          drawLine(false);
          Charts.radar(root.querySelector('#c2'), { axes: m.radars.axes, series: m.radars.series, height: 300 });
          Charts.bar(root.querySelector('#c3'), {
            labels: ['优秀', '良好', '合格', '待改进'],
            data: [62, 44, 18, 4], colors: ['#2ec8a6', '#12a37f', '#f0a12e', '#e07ba0'], height: 260, valueLabels: true
          });

          var live = root.querySelector('#liveKpis');
          var timer = setInterval(function () {
            var vals = live.querySelectorAll('.dash-kpi');
            if (vals[0]) vals[0].querySelector('.value').innerHTML = (124 + Math.floor(Math.random() * 9)) + '<span class="unit">间</span>';
            drawLine(true);
          }, 5000);
          this._timer = timer;
        },
        destroy: function () { if (this._timer) clearInterval(this._timer); }
      },
      {
        id: 'faculty', name: '教师发展成效分析', icon: 'trending',
        render: function () {
          var f = D.dash.faculty;
          return dashTitle('教师发展成效分析', '全院师资结构 · 教学成果 · 培训成长（教师档案袋板块汇总）')
            + dashKpis(f.kpis)
            + '<div class="grid g4 mb14">'
            + panel('师资职称结构', chart('c1', 'h260'), '862 人')
            + panel('教学成果产出趋势', chart('c2', 'h260'), '项')
            + panel('人均培训学时趋势', chart('c3', 'h260'), '学时')
            + panel('教研室教研评分排名', '<div class="rank-list" style="margin-top:6px;">'
              + f.rank.map(function (r, i) {
                return '<div class="rank-row' + (r.name === '心血管内科' ? ' me' : '') + '"><div class="no t' + (i + 1) + '">' + (i + 1) + '</div>'
                  + '<div class="nm">' + r.name + '</div><div class="bar"><i style="width:' + r.value + '%;background:linear-gradient(90deg,#2ec8a6,#12a37f);"></i></div>'
                  + '<div class="vl">' + r.value + '</div></div>';
              }).join('') + '</div>')
            + '</div>'
            + '<div class="grid g-3-2">'
            + panel('教师教学能力提升成效', chart('c4', 'h260'), '培训后测评提升幅度')
            + panel('教学名师 / 人才分布', table(['类别', '人数', '占全院比'], [
              ['国家级人才', 26, '3.0%'], ['省部级人才', 68, '7.9%'], ['校级教学名师', 86, '10.0%'],
              ['院级骨干教师', 168, '19.5%'], ['青年教学新秀', 124, '14.4%']
            ], { numCols: [1, 2] }), '全院 862 人')
            + '</div>';
        },
        init: function (root) {
          var f = D.dash.faculty;
          Charts.donut(root.querySelector('#c1'), { data: f.structure, height: 260, centerLabel: '专任教师', centerValue: 862 });
          Charts.bar(root.querySelector('#c2'), {
            labels: f.achievements.labels, series: f.achievements.series, height: 260, legend: true
          });
          Charts.line(root.querySelector('#c3'), { labels: f.growth.labels, series: f.growth.series, height: 260 });
          Charts.hbar(root.querySelector('#c4'), {
            items: [
              { name: '课堂教学能力', value: 12.6, color: '#12a37f' },
              { name: '信息化教学', value: 18.4, color: '#3d7bff' },
              { name: '临床带教能力', value: 9.8, color: '#7a63f0' },
              { name: '教学研究能力', value: 14.2, color: '#2ec8a6' },
              { name: '课程开发能力', value: 11.4, color: '#f0a12e' }
            ], height: 260, unit: ' 分', maxV: 24, labelWidth: 110
          });
        }
      },
      {
        id: 'practice', name: '实践教学与执医成效', icon: 'cross',
        render: function () {
          var p = D.dash.practice;
          return dashTitle('实践教学与执医成效分析', '虚拟医院 · 实训基地 · 执医考试（全院）')
            + dashKpis(p.kpis)
            + '<div class="grid g4 mb14">'
            + panel('各专业实训完成率', chart('c1', 'h260'), '%')
            + panel('模拟诊疗 / 技能考核成绩', chart('c2', 'h260'), '分')
            + panel('执医通过率年度趋势', chart('c3', 'h260'), '%')
            + panel('执医通过率', chart('g0', 'h180'))
            + '</div>'
            + '<div class="grid g-3-2">'
            + panel('实践教学环节成效明细', table(
              ['实践环节', '参与人次', '完成率', '平均成绩', '评价'],
              p.rows, { numCols: [1, 2, 3], scoreCols: [3], tagCols: [4] }), '本学期')
            + panel('实训完成率', chart('g1', 'h180'))
            + '</div>';
        },
        init: function (root) {
          var p = D.dash.practice;
          Charts.bar(root.querySelector('#c1'), {
            labels: p.completion.labels, data: p.completion.series[0].data,
            colors: ['#12a37f'], height: 260, valueLabels: true, yMax: 100
          });
          Charts.line(root.querySelector('#c2'), { labels: p.simulate.labels, series: p.simulate.series, height: 260, yMin: 70 });
          Charts.line(root.querySelector('#c3'), { labels: p.examTrend.labels, series: p.examTrend.series, height: 260, yMin: 70 });
          Charts.gauge(root.querySelector('#g0'), { value: 87.3, max: 100, label: '本院执医通过率', color: '#12a37f', height: 180, footer: '全国均值 74.9%' });
          Charts.gauge(root.querySelector('#g1'), { value: 93.8, max: 100, label: '实训完成率', color: '#2ec8a6', height: 180 });
        }
      },
      {
        id: 'm9', name: 'M9 高校对标分析', icon: 'award',
        render: function () {
          var m = D.dash.m9;
          return dashTitle('M9 高校教学成果与申报情况对标分析', '医学类前 9 所高校 · 成果 / 申报 / 转化 横向对标')
            + '<div class="dash-kpi mb14" style="padding:11px 14px;"><div class="label">数据口径说明</div>'
            + '<div style="font-size:12.5px;color:var(--text-2);line-height:1.7;">' + m.note + '</div></div>'
            + '<div class="grid g4 mb14">'
            + panel('对标综合排名（M9 + 本院）', '<div class="rank-list" style="margin-top:6px;">'
              + m.rank.map(function (r, i) {
                var isMe = r.name.indexOf('本院') >= 0;
                return '<div class="rank-row' + (isMe ? ' me' : '') + '"><div class="no t' + (i + 1) + '">' + (i + 1) + '</div>'
                  + '<div class="nm" style="width:132px;">' + r.name + '</div><div class="bar"><i style="width:' + r.value + '%;"></i></div>'
                  + '<div class="vl">' + r.value + '</div></div>';
              }).join('') + '</div>')
            + panel('六维对标雷达', chart('c1', 'h300'), '本院 vs M9 均值 vs M9 最高')
            + panel('关键指标对比', chart('c2', 'h300'), '本院 vs M9 均值')
            + panel('M9 高校申报情况', chart('c4', 'h300'), '近 6 年（本院 vs M9 均值）')
            + '</div>'
            + panel('M9 高校教学成果核心指标对照表', table(
              ['高校', '教学成果奖(项)', '国家级一流课程', '国家级一流专业', '教改项目', '专利/转化', '综合指数'],
              m.rows, { numCols: [1, 2, 3, 4, 5, 6], scoreCols: [6] }), '示例数据')
            + panel('M9 高校本年度申报情况（国家级教学成果奖 / 一流课程 / 教改课题）', table(
              ['高校', '申报数', '已获批', '在审', '获批率(%)', '申报项目构成'],
              m.apply, { numCols: [1, 2, 3, 4], scoreCols: [4] }), '本年度 · 示例数据', 'mt14')
            + panel('一流专业 / 一流课程建设情况', chart('c3', 'h300'), '个', 'mt14')
            + panel('差距分析与提升建议', '<div style="font-size:13px;line-height:1.95;color:var(--text-2);">'
              + '<b style="color:#0b7a5f;">差距定位：</b>本院在实践教学维度已接近 M9 均值（90 vs 88），教学成果奖（86 vs 92）、'
              + '师资水平（84 vs 93）、成果转化（76 vs 91）仍有明显差距，其中成果转化差距最大（-15）。'
              + '申报情况方面，M9 高校年均申报 9 项、获批 4.2 项（获批率 46.7%），本院年均申报 6 项、获批 2.5 项（获批率 41.7%），'
              + '在国家级教学成果奖申报数量与获批率上差距明显。<br>'
              + '<b style="color:#0b7a5f;">提升建议：</b>1. 建立教学成果奖培育项目库，按 3 年周期滚动培育，重点冲击国家级教学成果奖；'
              + '2. 实施高层次人才引育计划，重点提升国家级人才数量与教学名师占比；'
              + '3. 打通“教学成果—专利—转化”链路，设立教学创新成果转化专项；'
              + '4. 建立 M9 高校申报动态跟踪机制，逐年对标申报数量、获批率与项目结构，'
              + '5. 与北京协和医学院、上海交通大学医学院等建立课程共建与师资互访机制。'
              + '</div>', '自动生成', 'mt14');
        },
        init: function (root) {
          var m = D.dash.m9;
          Charts.radar(root.querySelector('#c1'), { axes: m.axes, series: m.series, height: 300 });
          Charts.bar(root.querySelector('#c2'), {
            labels: m.compare.labels, series: m.compare.series, height: 300, legend: true
          });
          Charts.bar(root.querySelector('#c3'), {
            labels: ['本院', '北京协和', '上海交大', '复旦上医', '四川华西'],
            series: [
              { name: '国家级一流专业', data: [3, 9, 8, 7, 6], color: '#7a63f0' },
              { name: '国家级一流课程', data: [8, 18, 15, 14, 12], color: '#12a37f' }
            ], height: 300, legend: true
          });
          Charts.line(root.querySelector('#c4'), { labels: m.applyTrend.labels, series: m.applyTrend.series, height: 300 });
        }
      },
      {
        id: 'portal', name: '一体化综合门户', icon: 'layout',
        render: function () {
          return dashTitle('一体化综合门户', '可视化的一体化综合门户，拖拽式面板布局')
            + '<div class="panel mb14" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
            + '<div><h3 style="margin:0 0 5px;font-size:14px;">拖拽卡片可自由调整门户布局</h3>'
            + '<span class="muted">按住卡片拖动到目标位置即可交换，布局将保存至个人工作台（Demo 演示，刷新后恢复默认）。</span></div>'
            + '<div>' + btn('恢复默认布局', '', 'btnReset') + btn('保存布局', 'primary', 'btnSave') + '</div></div>'
            + '<div class="portal-grid" id="portal"></div>'
            + panel('门户指标口径', table(['卡片', '数据来源', '刷新频率', '责任部门'], [
              ['教学质量指数', '评教 / 评学 / 督导 / 数据监测', '实时', '教学质量监控中心'],
              ['专业建设进度', '人才培养方案系统 / 课程体系库', '月度', '教务处'],
              ['执医通过率', '执医考试数据库 / 模拟测评系统', '季度', '临床技能中心'],
              ['师资队伍', '教师档案袋 / 人事系统', '学期', '教师发展中心'],
              ['实践教学', '虚拟医院 / 实训基地平台', '周度', '临床技能中心'],
              ['M9 高校对标', '高校公开教学数据 / 行业共享数据库', '年度', '发展规划处']
            ], { tagCols: [2] }), '指标口径由各责任部门维护', 'mt14');
        },
        init: function (root) {
          var box = root.querySelector('#portal');
          var def = D.dash.portal.slice();
          var cards = def.slice();
          function render() {
            box.innerHTML = cards.map(function (c, i) {
              return '<div class="drag-card" draggable="true" data-i="' + i + '">'
                + '<h4>' + c.title + '<span class="tag blue">' + c.tag + '</span></h4>'
                + '<div class="metric">' + c.metric + '</div><p>' + c.desc + '</p></div>';
            }).join('');
            bind();
          }
          var dragIdx = null;
          function bind() {
            box.querySelectorAll('.drag-card').forEach(function (el) {
              el.addEventListener('dragstart', function (e) {
                dragIdx = +el.getAttribute('data-i');
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
              });
              el.addEventListener('dragend', function () { el.classList.remove('dragging'); });
              el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('over'); });
              el.addEventListener('dragleave', function () { el.classList.remove('over'); });
              el.addEventListener('drop', function (e) {
                e.preventDefault();
                var to = +el.getAttribute('data-i');
                if (dragIdx == null || to === dragIdx) return;
                var moved = cards.splice(dragIdx, 1)[0];
                cards.splice(to, 0, moved);
                dragIdx = null;
                render();
                toast('布局已调整：' + moved.title + ' 移动至第 ' + (to + 1) + ' 位');
              });
            });
          }
          render();
          root.querySelector('#btnSave').onclick = function () { toast('当前门户布局已保存到个人工作台（Demo）'); };
          root.querySelector('#btnReset').onclick = function () { cards = def.slice(); render(); toast('已恢复默认布局'); };
        }
      }
    ]
  };

  window.MODULES = [homeModule, reviewModule, portfolioModule, teachingModule, majorModule, agentModule, dashModule];
})();
