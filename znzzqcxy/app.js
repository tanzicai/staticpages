/* ============================================================
 * app.js - SPA 路由 + ECharts 深色主题 + 图表初始化 + 多角色切换
 * 重庆电子科技职业大学·智能制造与汽车学院（航空学院）
 * 项目任务管理平台 · Demo 版本
 *
 * 依赖：
 *   mockdata.js（必须先加载，提供 window.MOCK，含 ROLES/ROLE_KPIS）
 *   pages.js（必须先加载，提供 window.PAGES）
 *   ECharts 5.x（CDN）
 *
 * 新增能力（相对上一版）：
 *   1. splash 登录入口，按角色卡片选择进入
 *   2. 顶栏 rolebox 三个 segmented 按钮随时切换角色
 *   3. 菜单按角色 visibility 过滤
 *   4. 顶栏用户信息（姓名 / 角色名 / 头像渐变 / 视角标签）随角色更新
 *   5. dashboard 与受限页面（workspace/taskfund/performance/audit/teacher）
 *      的 KPI 数据按角色动态切换
 * ============================================================ */
(function () {
  'use strict';

  /* ============================================================
   * 1. ECharts 深色主题片段
   * ============================================================ */
  var DARK_DEFAULTS = {
    backgroundColor: 'transparent',
    textStyle: {
      color: '#e6f1ff',
      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
    },
    title: { textStyle: { color: '#5cadff', fontWeight: 600 } },
    legend: { textStyle: { color: '#8faacb' } },
    tooltip: {
      backgroundColor: 'rgba(14,42,82,0.95)',
      borderColor: '#2b6db8',
      borderWidth: 1,
      textStyle: { color: '#e6f1ff' },
      extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.4); border-radius:6px;'
    },
    color: ['#2d8cf0', '#5cadff', '#19be6b', '#ff9900', '#f5b841', '#ed3f3f', '#9b59b6', '#1abc9c']
  };

  var GRID_DEFAULT = { left: 50, right: 24, top: 40, bottom: 36, containLabel: true };
  var AXIS_CATEGORY = {
    axisLine: { lineStyle: { color: '#1d4576' } },
    axisTick: { lineStyle: { color: '#1d4576' } },
    axisLabel: { color: '#8faacb', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(45,140,240,0.08)' } }
  };
  var AXIS_VALUE = {
    axisLine: { lineStyle: { color: '#1d4576' } },
    axisLabel: { color: '#8faacb', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(45,140,240,0.08)' } }
  };

  function mergeDeep(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      Object.keys(src).forEach(function (k) {
        var v = src[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          target[k] = mergeDeep(target[k] || {}, v);
        } else {
          target[k] = v;
        }
      });
    }
    return target;
  }

  /* ============================================================
   * 2. 全局状态
   * ============================================================ */
  var ROLE_STORAGE_KEY = 'wb-role';
  var THEME_STORAGE_KEY = 'wb-theme';
  var chartCache = {};
  var currentPage = null;
  var currentRoleCode = null;

  /* ============================================================
   * 3. 路由与渲染
   * ============================================================ */
  var main = document.getElementById('mainContent');
  var menuItems = document.querySelectorAll('.menu-item');

  function disposeCharts() {
    Object.keys(chartCache).forEach(function (id) {
      try { chartCache[id].dispose(); } catch (e) {}
      delete chartCache[id];
    });
  }

  function placeholder(key) {
    return ''
      + '<div class="page active">'
      +   '<div class="page-header"><div>'
      +     '<div class="page-title">' + key + '</div>'
      +     '<div class="page-sub">该模块已进入产品规划，预计在 P1 阶段补全上线</div>'
      +   '</div></div>'
      +   '<div class="card" style="padding:80px 20px;text-align:center;">'
      +     '<div style="font-size:54px;color:var(--warning);">🚧</div>'
      +     '<div style="margin-top:16px;font-size:16px;font-weight:600;">该模块即将上线</div>'
      +     '<div style="margin-top:8px;font-size:12px;color:var(--text-sub);">资金管理 / 任务绩效 / 任务审核 / 课程建设 / 实验实训 / 教师档案 / 学院门户 / 个人工作台</div>'
      +   '</div>'
      + '</div>';
  }

  function navigate(pageKey) {
    if (currentPage === pageKey) return;
    disposeCharts();
    currentPage = pageKey;

    if (!window.PAGES || !window.PAGES[pageKey]) {
      main.innerHTML = placeholder(pageKey);
      return;
    }

    main.innerHTML = window.PAGES[pageKey]();

    setTimeout(function () { initPageCharts(pageKey); }, 30);
  }

  /* ============================================================
   * 4. 图表工厂
   * ============================================================ */
  function makeChart(id, option) {
    var el = document.getElementById(id);
    if (!el) return null;
    if (chartCache[id]) {
      try { chartCache[id].dispose(); } catch (e) {}
      delete chartCache[id];
    }
    var chart = echarts.init(el);
    var merged = mergeDeep({}, DARK_DEFAULTS, option);
    chart.setOption(merged);
    chartCache[id] = chart;
    return chart;
  }

  /* ============================================================
   * 5. 各页面图表配置
   * ============================================================ */
  function initPageCharts(pageKey) {
    switch (pageKey) {
      case 'dashboard':
        makeChart('chartDoubleHigh', {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          legend: { data: ['已完成', '进行中', '待启动'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['党建工作', '人才培养', '专业群建设', '课程教材', '师资队伍', '产教融合', '国际交流', '社会服务', '数字化', '机制创新']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value', max: 100,
            axisLabel: { formatter: '{value}%' }
          }, AXIS_VALUE),
          series: [
            { name: '已完成', type: 'bar', stack: 'pct', barWidth: 22,
              itemStyle: { color: '#19be6b' },
              data: [85, 78, 68, 72, 65, 58, 45, 70, 55, 60] },
            { name: '进行中', type: 'bar', stack: 'pct',
              itemStyle: { color: '#5cadff' },
              data: [10, 15, 22, 18, 25, 30, 35, 20, 30, 25] },
            { name: '待启动', type: 'bar', stack: 'pct',
              itemStyle: { color: '#ed3f3f' },
              data: [5, 7, 10, 10, 10, 12, 20, 10, 15, 15] }
          ]
        });

        makeChart('chartTaskType', {
          tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 项 · {d}%' },
          legend: { bottom: 4, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
          series: [{
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['50%', '46%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 4, borderColor: '#0e2a52', borderWidth: 2 },
            label: { color: '#e6f1ff', fontSize: 11, formatter: '{b}\n{c}项' },
            labelLine: { lineStyle: { color: '#8faacb' } },
            data: [
              { name: '双高建设', value: 48, itemStyle: { color: '#f5b841' } },
              { name: '课程建设', value: 82, itemStyle: { color: '#5cadff' } },
              { name: '科研项目', value: 56, itemStyle: { color: '#19be6b' } },
              { name: '教师申报', value: 63, itemStyle: { color: '#ff9900' } },
              { name: '实训产教', value: 37, itemStyle: { color: '#ed3f3f' } }
            ]
          }]
        });
        break;

      case 'bigscreen':
        makeChart('chartRadar', {
          tooltip: { trigger: 'item' },
          radar: {
            center: ['50%', '52%'],
            radius: '68%',
            indicator: [
              { name: '党建工作',   max: 100 }, { name: '人才培养',   max: 100 },
              { name: '专业群',     max: 100 }, { name: '课程教材',   max: 100 },
              { name: '师资队伍',   max: 100 }, { name: '产教融合',   max: 100 },
              { name: '国际交流',   max: 100 }, { name: '社会服务',   max: 100 }
            ],
            splitArea: { areaStyle: { color: ['rgba(45,140,240,0.04)', 'rgba(45,140,240,0.08)', 'rgba(45,140,240,0.12)'] } },
            axisLine:  { lineStyle: { color: 'rgba(45,140,240,0.3)' } },
            splitLine: { lineStyle: { color: 'rgba(45,140,240,0.2)' } },
            name: { textStyle: { color: '#8faacb', fontSize: 11 } }
          },
          series: [{
            type: 'radar',
            data: [
              { value: [85, 78, 68, 72, 65, 58, 45, 70], name: '2026 完成度',
                areaStyle: { color: 'rgba(45,140,240,0.35)' },
                lineStyle: { color: '#5cadff', width: 2 },
                itemStyle: { color: '#5cadff' } },
              { value: [70, 65, 55, 60, 50, 45, 30, 55], name: '2025 同期',
                areaStyle: { color: 'rgba(245,184,65,0.2)' },
                lineStyle: { color: '#f5b841', width: 1.5, type: 'dashed' },
                itemStyle: { color: '#f5b841' } }
            ]
          }]
        });
        makeChart('chartTeacher', {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          legend: { data: ['教授', '副教授', '讲师', '博士', '硕士'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['汽车工程', '智能制造', '航空制造', '新能源', '物联网', '机械工程']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value' }, AXIS_VALUE),
          series: [
            { name: '教授',   type: 'bar', stack: 't', itemStyle: { color: '#f5b841' }, data: [2, 1, 2, 1, 1, 2] },
            { name: '副教授', type: 'bar', stack: 't', itemStyle: { color: '#5cadff' }, data: [4, 5, 3, 3, 2, 4] },
            { name: '讲师',   type: 'bar', stack: 't', itemStyle: { color: '#19be6b' }, data: [8, 10, 6, 5, 4, 8] },
            { name: '博士',   type: 'bar', stack: 't', itemStyle: { color: '#ff9900' }, data: [6, 8, 5, 4, 3, 6] },
            { name: '硕士',   type: 'bar', stack: 't', itemStyle: { color: '#ed3f3f' }, data: [5, 4, 3, 4, 3, 2] }
          ]
        });
        makeChart('chartTrend', {
          tooltip: { trigger: 'axis' },
          legend: { data: ['完成任务', '新增任务'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['11月','12月','1月','2月','3月','4月','5月','6月','7月','8月','9月','10月']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value' }, AXIS_VALUE),
          series: [
            { name: '完成任务', type: 'line', smooth: true, symbolSize: 6,
              itemStyle: { color: '#19be6b' }, lineStyle: { width: 2 },
              areaStyle: { color: 'rgba(25,190,107,0.18)' },
              data: [12, 15, 8, 6, 18, 22, 25, 28, 20, 24, 26, 31] },
            { name: '新增任务', type: 'line', smooth: true, symbolSize: 6,
              itemStyle: { color: '#5cadff' }, lineStyle: { width: 2 },
              data: [10, 12, 6, 5, 15, 18, 22, 24, 18, 20, 22, 28] }
          ]
        });
        makeChart('chartAchievement', {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          legend: { data: ['国家级', '省部级', '校级'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category', data: ['2023', '2024', '2025', '2026'] }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value' }, AXIS_VALUE),
          series: [
            { name: '国家级', type: 'bar', barWidth: 18, itemStyle: { color: '#ed3f3f' }, data: [2, 3, 5, 8] },
            { name: '省部级', type: 'bar', barWidth: 18, itemStyle: { color: '#f5b841' }, data: [8, 10, 15, 22] },
            { name: '校级',   type: 'bar', barWidth: 18, itemStyle: { color: '#5cadff' }, data: [25, 32, 40, 52] }
          ]
        });
        break;

      case 'taskfund':
        makeChart('chartBudget', {
          tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
          legend: { data: ['预算', '已执行', '执行率'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['双高建设', '课程建设', '科研项目', '教师申报', '实训产教']
          }, AXIS_CATEGORY),
          yAxis: [
            mergeDeep({ type: 'value', name: '万元' }, AXIS_VALUE),
            mergeDeep({ type: 'value', name: '执行率', max: 100, axisLabel: { formatter: '{value}%' } }, AXIS_VALUE)
          ],
          series: [
            { name: '预算', type: 'bar', barWidth: 22, itemStyle: { color: '#5cadff' },
              data: [1248, 320, 580, 410, 760] },
            { name: '已执行', type: 'bar', barWidth: 22, itemStyle: { color: '#19be6b' },
              data: [892, 245, 386, 254, 522] },
            { name: '执行率', type: 'line', yAxisIndex: 1, smooth: true,
              itemStyle: { color: '#f5b841' }, lineStyle: { width: 2 },
              data: [71.5, 76.6, 66.6, 62.0, 68.7] }
          ]
        });
        makeChart('chartBudgetTrend', {
          tooltip: { trigger: 'axis' },
          legend: { data: ['当月预算', '当月执行'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['3月','4月','5月','6月','7月','8月','9月','10月']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value', name: '万元' }, AXIS_VALUE),
          series: [
            { name: '当月预算', type: 'bar', itemStyle: { color: 'rgba(92,173,255,0.5)' },
              data: [180, 220, 240, 260, 280, 300, 320, 340] },
            { name: '当月执行', type: 'bar', itemStyle: { color: '#19be6b' },
              data: [142, 195, 212, 232, 248, 270, 285, 308] }
          ]
        });
        break;

      case 'performance':
        makeChart('chartPerformanceRank', {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: 90, right: 30, top: 16, bottom: 24, containLabel: false },
          xAxis: mergeDeep({ type: 'value' }, AXIS_VALUE),
          yAxis: mergeDeep({ type: 'category',
            data: ['陈教授','李教授','王教授','张博士','赵教授','周教授','孙博士','刘大师','钱教授','吴博士'].reverse(),
            axisLabel: { color: '#e6f1ff' }
          }, AXIS_CATEGORY),
          series: [{
            type: 'bar', barWidth: 14,
            itemStyle: {
              color: function (p) { var c = ['#f5b841','#5cadff','#19be6b','#ff9900','#9b59b6']; return c[p.dataIndex % 5]; },
              borderRadius: [0, 4, 4, 0]
            },
            label: { show: true, position: 'right', color: '#e6f1ff', formatter: '{c} 分' },
            data: [92, 88, 86, 85, 83, 82, 80, 78, 76, 74].reverse()
          }]
        });
        makeChart('chartPerformanceRadar', {
          tooltip: {},
          radar: {
            center: ['50%', '52%'], radius: '64%',
            indicator: [
              { name: '教学', max: 100 }, { name: '科研', max: 100 },
              { name: '竞赛', max: 100 }, { name: '服务', max: 100 },
              { name: '育人', max: 100 }, { name: '双高', max: 100 }
            ],
            splitArea: { areaStyle: { color: ['rgba(45,140,240,0.04)', 'rgba(45,140,240,0.08)'] } },
            axisLine:  { lineStyle: { color: 'rgba(45,140,240,0.3)' } },
            splitLine: { lineStyle: { color: 'rgba(45,140,240,0.2)' } },
            name: { textStyle: { color: '#8faacb', fontSize: 11 } }
          },
          series: [{
            type: 'radar',
            data: [
              { value: [90, 75, 88, 70, 85, 80], name: '学院均值',
                areaStyle: { color: 'rgba(45,140,240,0.3)' },
                lineStyle: { color: '#5cadff' },
                itemStyle: { color: '#5cadff' } },
              { value: [95, 92, 85, 82, 90, 95], name: 'TOP10 均值',
                lineStyle: { color: '#f5b841' },
                itemStyle: { color: '#f5b841' },
                areaStyle: { color: 'rgba(245,184,65,0.15)' } }
            ]
          }]
        });
        break;

      case 'audit':
        makeChart('chartAuditRate', {
          tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 项 · {d}%' },
          series: [{
            type: 'pie',
            radius: ['62%', '82%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            label: { show: true, position: 'center',
              formatter: '{d|92.6%}\n{a|审核通过率}',
              rich: {
                d: { fontSize: 32, fontWeight: 700, color: '#5cadff', lineHeight: 40 },
                a: { fontSize: 12, color: '#8faacb', lineHeight: 24 }
              }
            },
            labelLine: { show: false },
            itemStyle: { borderRadius: 6, borderColor: '#0e2a52', borderWidth: 2 },
            data: [
              { name: '已通过', value: 187, itemStyle: { color: '#19be6b' } },
              { name: '已驳回', value: 8,   itemStyle: { color: '#ed3f3f' } },
              { name: '待审核', value: 19,  itemStyle: { color: '#ff9900' } }
            ]
          }]
        });
        makeChart('chartAuditTrend', {
          tooltip: { trigger: 'axis' },
          legend: { data: ['提交', '通过', '驳回'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['3月','4月','5月','6月','7月','8月','9月','10月']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value' }, AXIS_VALUE),
          series: [
            { name: '提交', type: 'line', smooth: true, itemStyle: { color: '#5cadff' }, data: [22, 28, 35, 30, 32, 38, 42, 45] },
            { name: '通过', type: 'line', smooth: true, itemStyle: { color: '#19be6b' }, data: [20, 26, 33, 28, 30, 35, 40, 42] },
            { name: '驳回', type: 'line', smooth: true, itemStyle: { color: '#ed3f3f' }, data: [2, 2, 2, 2, 2, 3, 2, 3] }
          ]
        });
        break;

      case 'course':
        makeChart('chartCourseType', {
          tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 门 · {d}%' },
          legend: { bottom: 4, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
          series: [{
            type: 'pie',
            radius: [30, 110],
            center: ['50%', '46%'],
            roseType: 'area',
            itemStyle: { borderRadius: 4, borderColor: '#0e2a52', borderWidth: 2 },
            label: { color: '#e6f1ff', fontSize: 11 },
            data: [
              { name: '专业核心课', value: 42, itemStyle: { color: '#5cadff' } },
              { name: '专业基础课', value: 56, itemStyle: { color: '#19be6b' } },
              { name: '实践实训课', value: 38, itemStyle: { color: '#f5b841' } },
              { name: '通识公共课', value: 28, itemStyle: { color: '#ff9900' } },
              { name: '思政课程',   value: 16, itemStyle: { color: '#ed3f3f' } }
            ]
          }]
        });
        makeChart('chartCourseProgress', {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: 100, right: 30, top: 16, bottom: 24 },
          xAxis: mergeDeep({ type: 'value', max: 100, axisLabel: { formatter: '{value}%' } }, AXIS_VALUE),
          yAxis: mergeDeep({ type: 'category',
            data: ['课程思政示范','在线开放课程','精品在线开放','MOOC建设','活页式教材','新形态教材'].reverse(),
            axisLabel: { color: '#e6f1ff' }
          }, AXIS_CATEGORY),
          series: [{
            type: 'bar', barWidth: 14,
            itemStyle: {
              color: function (p) {
                return p.value >= 90 ? '#19be6b' : (p.value >= 70 ? '#5cadff' : '#ff9900');
              },
              borderRadius: [0, 4, 4, 0]
            },
            label: { show: true, position: 'right', color: '#e6f1ff', formatter: '{c}%' },
            data: [92, 86, 78, 65, 58, 45].reverse()
          }]
        });
        break;

      case 'lab':
        makeChart('chartLabUsage', {
          tooltip: { trigger: 'axis' },
          legend: { data: ['已排课', '空闲'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['汽车工程中心','智能制造工厂','航空发动机实验室','新能源实验室','物联网实验室','金工实习车间']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value', max: 100, axisLabel: { formatter: '{value}%' } }, AXIS_VALUE),
          series: [
            { name: '已排课', type: 'bar', stack: 'u', barWidth: 28, itemStyle: { color: '#5cadff' },
              data: [88, 76, 92, 65, 58, 82] },
            { name: '空闲', type: 'bar', stack: 'u', itemStyle: { color: 'rgba(92,173,255,0.18)' },
              data: [12, 24, 8, 35, 42, 18] }
          ]
        });
        makeChart('chartDeviceStatus', {
          tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 台 · {d}%' },
          legend: { bottom: 4, textStyle: { fontSize: 11 } },
          series: [{
            type: 'pie',
            radius: ['40%', '68%'],
            center: ['50%', '46%'],
            itemStyle: { borderRadius: 4, borderColor: '#0e2a52', borderWidth: 2 },
            label: { color: '#e6f1ff', fontSize: 11 },
            data: [
              { name: '在用', value: 286, itemStyle: { color: '#19be6b' } },
              { name: '空闲', value: 64,  itemStyle: { color: '#5cadff' } },
              { name: '维护中', value: 28, itemStyle: { color: '#ff9900' } },
              { name: '故障', value: 8,   itemStyle: { color: '#ed3f3f' } }
            ]
          }]
        });
        break;

      case 'teacher':
        makeChart('chartTeacherLevel', {
          tooltip: { trigger: 'item', formatter: '{b}：{c} 人' },
          series: [{
            type: 'funnel',
            left: '10%', right: '10%', top: 16, bottom: 16,
            width: '80%', min: 0, max: 152, sort: 'descending', gap: 4,
            label: { color: '#e6f1ff', fontSize: 12 },
            itemStyle: { borderColor: '#0e2a52', borderWidth: 2 },
            data: [
              { name: '教授',   value: 9,  itemStyle: { color: '#f5b841' } },
              { name: '副教授', value: 28, itemStyle: { color: '#5cadff' } },
              { name: '讲师',   value: 64, itemStyle: { color: '#19be6b' } },
              { name: '助教',   value: 38, itemStyle: { color: '#ff9900' } },
              { name: '实验师', value: 13, itemStyle: { color: '#9b59b6' } }
            ]
          }]
        });
        makeChart('chartTeacherAge', {
          tooltip: { trigger: 'axis' },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['25-30岁','30-35岁','35-40岁','40-45岁','45-50岁','50岁以上']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value', name: '人数' }, AXIS_VALUE),
          series: [{
            type: 'bar', barWidth: 36,
            itemStyle: {
              color: function (p) {
                var c = ['#5cadff','#19be6b','#f5b841','#ff9900','#ed3f3f','#9b59b6'];
                return c[p.dataIndex];
              },
              borderRadius: [4, 4, 0, 0]
            },
            label: { show: true, position: 'top', color: '#e6f1ff' },
            data: [22, 38, 35, 28, 18, 11]
          }]
        });
        break;

      case 'portal':
        makeChart('chartPortalData', {
          tooltip: { trigger: 'axis' },
          legend: { data: ['招生数', '就业率'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category', data: ['2023', '2024', '2025', '2026'] }, AXIS_CATEGORY),
          yAxis: [
            mergeDeep({ type: 'value', name: '招生数' }, AXIS_VALUE),
            mergeDeep({ type: 'value', name: '就业率', max: 100, axisLabel: { formatter: '{value}%' } }, AXIS_VALUE)
          ],
          series: [
            { name: '招生数', type: 'bar', barWidth: 30, itemStyle: { color: '#5cadff' },
              data: [1180, 1220, 1280, 1320] },
            { name: '就业率', type: 'line', yAxisIndex: 1, smooth: true,
              itemStyle: { color: '#f5b841' }, lineStyle: { width: 2 },
              data: [94.5, 95.8, 96.2, 97.1] }
          ]
        });
        break;

      case 'workspace':
        makeChart('chartWorkspaceWeek', {
          tooltip: { trigger: 'axis' },
          legend: { data: ['完成', '新增', '进行中'], top: 4 },
          grid: GRID_DEFAULT,
          xAxis: mergeDeep({ type: 'category',
            data: ['周一','周二','周三','周四','周五','周六','周日']
          }, AXIS_CATEGORY),
          yAxis: mergeDeep({ type: 'value' }, AXIS_VALUE),
          series: [
            { name: '完成',   type: 'bar', stack: 'w', itemStyle: { color: '#19be6b' }, data: [5, 6, 4, 7, 8, 2, 1] },
            { name: '新增',   type: 'bar', stack: 'w', itemStyle: { color: '#5cadff' }, data: [3, 4, 5, 4, 3, 1, 0] },
            { name: '进行中', type: 'bar', stack: 'w', itemStyle: { color: '#f5b841' }, data: [4, 5, 6, 5, 4, 2, 1] }
          ]
        });
        break;

      default:
        break;
    }
  }

  /* ============================================================
   * 6. 角色切换
   * ============================================================ */

  // 取出页面标题映射（用于当用户当前所在页面在新角色下不可见时的回退）
  function getFirstVisiblePage(role) {
    var visible = role.visibility || [];
    if (visible.indexOf(currentPage) !== -1) return currentPage;
    if (visible.indexOf('dashboard') !== -1) return 'dashboard';
    return visible[0] || 'dashboard';
  }

  // 应用角色：写 window.ROLE + 过滤菜单 + 同步顶栏 + 更新 active
  function applyRole(code) {
    var role = window.MOCK && window.MOCK.ROLES && window.MOCK.ROLES[code];
    if (!role) return;

    currentRoleCode = code;
    window.ROLE = role;
    window.ROLE_CODE = code;

    // 持久化
    try { localStorage.setItem(ROLE_STORAGE_KEY, code); } catch (e) {}

    // 1) 过滤菜单：visibility 之外的菜单隐藏
    var visible = role.visibility || [];
    menuItems.forEach(function (m) {
      var pageKey = m.dataset.page;
      var allowed = visible.indexOf(pageKey) !== -1;
      m.style.display = allowed ? '' : 'none';
    });

    // 2) 同步顶栏
    var elTag = document.getElementById('roleTag');
    if (elTag) elTag.textContent = role.tag;

    var elAvatar = document.getElementById('userAvatar');
    if (elAvatar) {
      elAvatar.textContent = role.avatar;
      elAvatar.style.background = role.avatarGrad;
    }
    var elName = document.getElementById('userName');
    if (elName) elName.textContent = role.name;
    var elLabel = document.getElementById('userRoleLabel');
    if (elLabel) elLabel.textContent = role.roleLabel;

    // 3) 切换 rolebox active
    var roleBtns = document.querySelectorAll('.rolebox-btn');
    roleBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.role === code);
    });

    // 4) 跳转：若当前页面在角色下不可见，去 dashboard
    var target = getFirstVisiblePage(role);
    if (target !== currentPage) {
      // 同步把 active 菜单切到 target
      menuItems.forEach(function (m) {
        m.classList.toggle('active', m.dataset.page === target);
      });
      navigate(target);
    }
  }

  // 进入主程序（关闭 splash）
  function enterApp(code) {
    var splash = document.getElementById('splash');
    var app = document.getElementById('app');
    if (splash) splash.style.display = 'none';
    if (app) app.style.display = '';

    applyRole(code);

    // 第一次进入默认在 dashboard
    currentPage = null;
    navigate('dashboard');
    menuItems.forEach(function (m) {
      m.classList.toggle('active', m.dataset.page === 'dashboard');
    });
  }

  /* ============================================================
   * 7. 菜单点击事件
   * ============================================================ */
  function bindMenu() {
    menuItems = document.querySelectorAll('.menu-item'); // 重新查询（可能动态生成）
    menuItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var pageKey = item.dataset.page;
        // 当前角色看不到这个菜单 → 提示并跳到 dashboard
        var role = window.MOCK && window.MOCK.ROLES && window.MOCK.ROLES[currentRoleCode];
        if (role && role.visibility.indexOf(pageKey) === -1) {
          showToast('当前角色（' + (role.roleLabel || '') + '）无访问「' +
            item.querySelector('span:last-child').textContent + '」的权限');
          return;
        }
        menuItems.forEach(function (m) { m.classList.remove('active'); });
        item.classList.add('active');
        navigate(pageKey);
      });
    });
  }

  /* ============================================================
   * 8. 友情提示 toast
   * ============================================================ */
  var toastEl = null, toastTimer = null;
  function showToast(msg) {
    toastEl = toastEl || document.getElementById('toast');
    if (!toastEl) return;
    document.getElementById('toastText').textContent = msg;
    toastEl.style.display = 'block';
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
      setTimeout(function () { toastEl.style.display = 'none'; }, 300);
    }, 2400);
  }

  /* ============================================================
   * 9. 主题切换
   * ============================================================ */
  var btnTheme = document.getElementById('btnTheme');
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      btnTheme.textContent = '☀';
    } else {
      document.documentElement.removeAttribute('data-theme');
      btnTheme.textContent = '🌙';
    }
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (e) {}
    setTimeout(function () {
      Object.keys(chartCache).forEach(function (id) {
        try { chartCache[id].resize(); } catch (e) {}
      });
    }, 100);
  }
  if (btnTheme) {
    btnTheme.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'light' ? 'dark' : 'light');
    });
  }
  try {
    var savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) applyTheme(savedTheme);
  } catch (e) {}

  /* ============================================================
   * 10. 全屏大屏模式
   * ============================================================ */
  var btnFullscreen = document.getElementById('btnFullscreen');

  function toggleFullscreen() {
    var isFs = document.querySelector('.fullscreen-mode');
    if (isFs) {
      document.body.classList.remove('fullscreen-mode');
      btnFullscreen.textContent = '⛶';
      try {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      } catch (e) {}
    } else {
      document.body.classList.add('fullscreen-mode');
      btnFullscreen.textContent = '⛞';
      try {
        var el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      } catch (e) {}
    }
    setTimeout(function () {
      Object.keys(chartCache).forEach(function (id) {
        try { chartCache[id].resize(); } catch (e) {}
      });
    }, 300);
  }
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreen);
  }
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement) {
      document.body.classList.remove('fullscreen-mode');
      if (btnFullscreen) btnFullscreen.textContent = '⛶';
      setTimeout(function () {
        Object.keys(chartCache).forEach(function (id) {
          try { chartCache[id].resize(); } catch (e) {}
        });
      }, 100);
    }
  });

  /* ============================================================
   * 11. 缩放重绘
   * ============================================================ */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      Object.keys(chartCache).forEach(function (id) {
        try { chartCache[id].resize(); } catch (e) {}
      });
    }, 200);
  });

  /* ============================================================
   * 12. 启动
   * ============================================================ */
  function bootstrap() {
    bindMenu();

    // splash 角色卡片点击
    var roleCards = document.querySelectorAll('#splashRoles .splash-role');
    roleCards.forEach(function (card) {
      card.addEventListener('click', function () {
        enterApp(card.dataset.role);
      });
    });

    // 顶栏 rolebox 切换（首次进入后才有 app）
    var roleBtns = document.querySelectorAll('.rolebox-btn');
    roleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyRole(btn.dataset.role);
      });
    });

    // 检查上次登录角色
    var savedRole = null;
    try { savedRole = localStorage.getItem(ROLE_STORAGE_KEY); } catch (e) {}
    if (savedRole && window.MOCK && window.MOCK.ROLES[savedRole]) {
      // 跳过 splash 直接进入
      enterApp(savedRole);
    }
    // 否则保持 splash 显示
  }

  // 暴露调试接口
  window.APP = {
    navigate: navigate,
    toggleFullscreen: toggleFullscreen,
    applyTheme: applyTheme,
    applyRole: applyRole,
    enterApp: enterApp,
    showToast: showToast,
    get currentPage() { return currentPage; },
    get currentRole() { return currentRoleCode; },
    get charts() { return chartCache; },
    get role() { return window.ROLE; },
    get theme() {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
