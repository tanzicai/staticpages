// ============================================================
// pages.js - 14 个模块页面模板（已支持多角色差异化）
// 重庆电子科技职业大学智能制造与汽车学院（航空学院）· 项目任务管理平台
//
// 角色差异化说明：
//   * dashboard / workspace / taskfund / performance / audit / teacher
//     这 6 个页面的 KPI 数据按 window.ROLE_CODE 自动切换
//   * dashboard 标题 / 顶部预警随角色变化
//   * workspace 待办清单按角色变化
//   * taskfund 标题 / 范围随角色变化（全院 / 专业群 / 我的项目）
// ============================================================
const PAGES = {

  // ===========================================================
  // 1. 驾驶舱首页 - 按角色呈现不同 KPI 与预警
  // ===========================================================
  dashboard: () => {
    const RC = (typeof window !== 'undefined' && window.ROLE_CODE) || 'leader';
    const roleDef = (window.MOCK && window.MOCK.ROLES && window.MOCK.ROLES[RC]) || { sub: '', roleLabel: '学院领导' };
    const DASH_ALERTS = {
      leader:   { icon: '⚠', title: '当前有 3 项任务即将逾期', text: '最近预警：航空智能制造专业群·"航空发动机数字化制造工艺标准制定"任务剩余 5 天 | 建议立即督办', btn: '前往督办' },
      director: { icon: '⚠', title: '专业群内 2 项任务逾期',     text: '最近预警：航空发动机实验室"智能装配单元"任务逾期 8 天 | 专业群内需重点关注', btn: '查看详情' },
      teacher:  { icon: '!', title: '你有 3 项加急待办',          text: '"新能源汽车概论"精品课程结题材料（本周五 17:00 前提交） | 《理论力学》节点填报（明日截止）', btn: '去处理' }
    };
    const DASH_TITLES = {
      leader:   { t: '学院管理驾驶舱', sub: '一屏总览学院任务、绩效、数据全貌 · 数据更新于 2026-10-13 09:00' },
      director: { t: '专业群驾驶舱',     sub: '一屏总览航空智能制造专业群 · 任务、人员、预算执行 · 数据更新于 2026-10-13 09:00' },
      teacher:  { t: '我的工作驾驶舱',   sub: '快速进入：我的待办 / 我的任务 / 我的课程 / 我的绩效 · 数据更新于 2026-10-13 09:00' }
    };
    const T = DASH_TITLES[RC] || DASH_TITLES.leader;
    const A = DASH_ALERTS[RC] || DASH_ALERTS.leader;

    return `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">${T.t}</div>
          <div class="page-sub">${T.sub}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📤 一键汇报</button>
          <button class="btn gold">⚡ 快速派发任务</button>
        </div>
      </div>

      <!-- 角色感知预警横幅 -->
      <div class="alert ${RC === 'teacher' ? 'danger' : 'warning'}">
        <span style="font-size:18px;">${A.icon}</span>
        <div style="flex:1;">
          <strong>${A.title}</strong>　|　${A.text}
        </div>
        <button class="btn" style="font-size:11px;padding:4px 10px;">${A.btn}</button>
      </div>

      <!-- KPI 数字（按角色差异化） -->
      <div class="grid grid-6" style="margin-bottom:14px;">
        ${MOCK.renderDashboardKpis(window.ROLE_CODE)}
      </div>

      <!-- 主图区：双高进度 + 任务分布 -->
      <div class="grid grid-3" style="margin-bottom:14px;">
        <div class="card" style="grid-column: span 2;">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>双高建设任务进度全景</div>
            <span class="card-extra">按建设维度</span>
          </div>
          <div id="chartDoubleHigh" class="chart"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>任务类型分布</div>
            <span class="card-extra">共 5 类</span>
          </div>
          <div id="chartTaskType" class="chart"></div>
        </div>
      </div>

      <!-- 任务流（核心闭环） -->
      <div class="card" style="margin-bottom:14px;">
        <div class="card-title">
          <div class="card-title-left"><span class="card-title-dot"></span>任务全生命周期闭环管理 · 主攻线</div>
          <span class="card-extra">学院管理驾驶舱 · 流程引擎驱动</span>
        </div>
        <div class="task-flow">
          <div class="flow-step">
            <div class="flow-circle" data-num="1">📝</div>
            <div class="flow-name">申报立项</div>
            <div class="flow-desc">模板化申报 · 逐级审批</div>
          </div>
          <div class="flow-step"><span class="flow-arrow">▶</span></div>
          <div class="flow-step">
            <div class="flow-circle" data-num="2">▤</div>
            <div class="flow-name">任务库</div>
            <div class="flow-desc">批量导入 · 责任到人</div>
          </div>
          <div class="flow-step"><span class="flow-arrow">▶</span></div>
          <div class="flow-step">
            <div class="flow-circle" data-num="3">◉</div>
            <div class="flow-name">过程监测</div>
            <div class="flow-desc">节点预警 · 实时进度</div>
          </div>
          <div class="flow-step"><span class="flow-arrow">▶</span></div>
          <div class="flow-step">
            <div class="flow-circle" data-num="4">▣</div>
            <div class="flow-name">佐证归档</div>
            <div class="flow-desc">材料在线 · 统一文档库</div>
          </div>
          <div class="flow-step"><span class="flow-arrow">▶</span></div>
          <div class="flow-step">
            <div class="flow-circle" data-num="5">✓</div>
            <div class="flow-name">审核验收</div>
            <div class="flow-desc">自定义流程 · 主客观评价</div>
          </div>
          <div class="flow-step"><span class="flow-arrow">▶</span></div>
          <div class="flow-step">
            <div class="flow-circle" data-num="6">★</div>
            <div class="flow-name">绩效考核</div>
            <div class="flow-desc">指标关联 · 数据可追溯</div>
          </div>
        </div>
      </div>

      <!-- 双高任务列表 + 学院关键数据 -->
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>双高重点任务督办</div>
            <span class="card-extra">查看全部 →</span>
          </div>
          <table class="task-table">
            <thead>
              <tr><th>任务名称</th><th>负责人</th><th>类型</th><th>进度</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>智能网联汽车高水平专业群建设</td>
                <td>李教授</td>
                <td><span class="tag tag-gold">双高任务</span></td>
                <td><div class="progress"><div class="progress-bar success" style="width:78%"></div></div><span style="font-size:11px;color:var(--text-sub);">78%</span></td>
              </tr>
              <tr>
                <td>航空智能制造技术专业群</td>
                <td>王教授</td>
                <td><span class="tag tag-gold">双高任务</span></td>
                <td><div class="progress"><div class="progress-bar warning" style="width:62%"></div></div><span style="font-size:11px;color:var(--text-sub);">62%</span></td>
              </tr>
              <tr>
                <td>国家级协同创新中心建设</td>
                <td>张博士</td>
                <td><span class="tag tag-gold">双高任务</span></td>
                <td><div class="progress"><div class="progress-bar" style="width:85%"></div></div><span style="font-size:11px;color:var(--text-sub);">85%</span></td>
              </tr>
              <tr>
                <td>课程思政示范课建设</td>
                <td>陈教授</td>
                <td><span class="tag tag-primary">课程建设</span></td>
                <td><div class="progress"><div class="progress-bar success" style="width:91%"></div></div><span style="font-size:11px;color:var(--text-sub);">91%</span></td>
              </tr>
              <tr>
                <td>国家级技能大师工作室</td>
                <td>刘大师</td>
                <td><span class="tag tag-success">实训产教</span></td>
                <td><div class="progress"><div class="progress-bar warning" style="width:54%"></div></div><span style="font-size:11px;color:var(--text-sub);">54%</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>学院发展关键指标</div>
            <span class="card-extra">按学期</span>
          </div>
          <div class="desc-list">
            <div class="row-item"><dt>在校生规模</dt><dd><strong style="color:var(--primary-hi);font-size:16px;">4,800</strong> 人（全日制）</dd></div>
            <div class="row-item"><dt>教职工</dt><dd><strong style="color:var(--primary-hi);font-size:16px;">152</strong> 人（教授 9 · 博士 37）</dd></div>
            <div class="row-item"><dt>国务院政府特殊津贴</dt><dd><strong style="color:var(--gold);">2</strong> 人</dd></div>
            <div class="row-item"><dt>市级技术能手/技能大师</dt><dd><strong style="color:var(--gold);">13</strong> 人</dd></div>
            <div class="row-item"><dt>课程思政教学名师</dt><dd><strong style="color:var(--gold);">6</strong> 人</dd></div>
            <div class="row-item"><dt>国家级协同创新中心</dt><dd><strong style="color:var(--gold);">1</strong> 个</dd></div>
            <div class="row-item"><dt>国家级技能大师工作室</dt><dd><strong style="color:var(--gold);">1</strong> 个</dd></div>
            <div class="row-item"><dt>现代产业学院</dt><dd><strong style="color:var(--gold);">2</strong> 个</dd></div>
            <div class="row-item"><dt>授权专利总数</dt><dd><strong style="color:var(--primary-hi);">760+</strong> 项</dd></div>
            <div class="row-item"><dt>国家自然科学基金</dt><dd><strong style="color:var(--primary-hi);">3</strong> 项</dd></div>
            <div class="row-item"><dt>国际化培训人次</dt><dd><strong style="color:var(--primary-hi);">17,000+</strong></dd></div>
          </div>
        </div>
      </div>
    </div>
  `;
},

  // ===========================================================
  // 2. 数据大屏
  // ===========================================================
  bigscreen: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">数据大屏 · 双高建设驾驶舱</div>
          <div class="page-sub">学院 / 专业 / 课程 / 教师 / 任务 多维度可视化监测</div>
        </div>
        <div style="display:flex;gap:10px;">
          <select style="background:var(--bg-card);color:var(--text-main);border:1px solid var(--border);padding:6px 12px;border-radius:6px;font-size:12px;">
            <option>2026-2027 学年</option>
            <option>2025-2026 学年</option>
          </select>
          <button class="btn">📊 全屏展示</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        <div class="kpi gold"><div class="kpi-icon">★</div><div class="kpi-label">国家级成果</div><div class="kpi-value">14</div><div class="kpi-trend up">较上年 +3</div></div>
        <div class="kpi success"><div class="kpi-label">省级标志性成果</div><div class="kpi-value">38</div><div class="kpi-trend up">+5</div></div>
        <div class="kpi primary"><div class="kpi-label">双高任务达成率</div><div class="kpi-value">68.5%</div><div class="kpi-trend">实时更新</div></div>
        <div class="kpi warning"><div class="kpi-label">资金执行率</div><div class="kpi-value">73.2%</div><div class="kpi-trend">¥1,860万/2,540万</div></div>
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="deco-card">
          <div class="corner-deco tl"></div><div class="corner-deco tr"></div>
          <div class="corner-deco bl"></div><div class="corner-deco br"></div>
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>双高专业群建设进度雷达</div></div>
          <div id="chartRadar" class="chart"></div>
        </div>
        <div class="deco-card">
          <div class="corner-deco tl"></div><div class="corner-deco tr"></div>
          <div class="corner-deco bl"></div><div class="corner-deco br"></div>
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>师资队伍结构分布</div></div>
          <div id="chartTeacher" class="chart"></div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>近12月任务完成趋势</div></div>
          <div id="chartTrend" class="chart"></div>
        </div>
        <div class="card">
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>标志性成果统计</div></div>
          <div id="chartAchievement" class="chart"></div>
        </div>
      </div>
    </div>
  `,

  // ===========================================================
  // 3. 任务库管理
  // ===========================================================
  tasklib: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">任务库管理</div>
          <div class="page-sub">按年度批量导入任务 · 设置预算资金 · 支持多模式导入</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📥 批量导入</button>
          <button class="btn">＋ 新增任务</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:14px;">
        <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>任务类型分布概览</div></div>
        <div class="grid grid-5">
          <div class="kpi primary" style="text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--gold);">48</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">双高建设任务</div>
          </div>
          <div class="kpi primary" style="text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--primary-hi);">82</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">课程建设任务</div>
          </div>
          <div class="kpi primary" style="text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--success);">56</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">科研项目任务</div>
          </div>
          <div class="kpi primary" style="text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--warning);">63</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">教师申报任务</div>
          </div>
          <div class="kpi primary" style="text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--danger);">37</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">实训产教融合</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <div class="card-title-left"><span class="card-title-dot"></span>2026 年度任务库（286 项）</div>
          <div style="display:flex;gap:8px;font-size:12px;">
            <span class="tag tag-primary">全部</span>
            <span class="tag tag-info">双高任务</span>
            <span class="tag tag-info">课程建设</span>
            <span class="tag tag-info">科研项目</span>
            <span class="tag tag-info">教师申报</span>
            <span class="tag tag-info">实训产教</span>
          </div>
        </div>
        <table class="task-table">
          <thead>
            <tr><th>任务编号</th><th>任务名称</th><th>类型</th><th>年度</th><th>预算(万元)</th><th>负责人</th><th>进度</th><th>状态</th></tr>
          </thead>
          <tbody>
            <tr><td>SG2026-001</td><td>智能网联汽车高水平专业群建设</td><td><span class="tag tag-gold">双高</span></td><td>2026</td><td>320.0</td><td>李教授</td><td><div class="progress"><div class="progress-bar success" style="width:78%"></div></div></td><td><span class="tag tag-success">进行中</span></td></tr>
            <tr><td>SG2026-002</td><td>航空智能制造技术专业群建设</td><td><span class="tag tag-gold">双高</span></td><td>2026</td><td>280.0</td><td>王教授</td><td><div class="progress"><div class="progress-bar warning" style="width:62%"></div></div></td><td><span class="tag tag-warning">进行中</span></td></tr>
            <tr><td>KC2026-015</td><td>《新能源汽车结构原理》课程思政示范课</td><td><span class="tag tag-primary">课程建设</span></td><td>2026</td><td>8.5</td><td>陈教授</td><td><div class="progress"><div class="progress-bar success" style="width:91%"></div></div></td><td><span class="tag tag-success">已验收</span></td></tr>
            <tr><td>KY2026-008</td><td>航空发动机数字化制造工艺研究</td><td><span class="tag tag-success">科研项目</span></td><td>2026</td><td>45.0</td><td>张博士</td><td><div class="progress"><div class="progress-bar" style="width:55%"></div></div></td><td><span class="tag tag-primary">进行中</span></td></tr>
            <tr><td>SB2026-022</td><td>国家级技能大师工作室建设</td><td><span class="tag tag-warning">教师申报</span></td><td>2026</td><td>120.0</td><td>刘大师</td><td><div class="progress"><div class="progress-bar warning" style="width:54%"></div></div></td><td><span class="tag tag-warning">进行中</span></td></tr>
            <tr><td>SX2026-007</td><td>长安汽车产教融合实训基地</td><td><span class="tag tag-danger">实训产教</span></td><td>2026</td><td>180.0</td><td>赵教授</td><td><div class="progress"><div class="progress-bar success" style="width:88%"></div></div></td><td><span class="tag tag-success">进行中</span></td></tr>
            <tr><td>KY2026-013</td><td>无人机智能制造关键技术研究</td><td><span class="tag tag-success">科研项目</span></td><td>2026</td><td>28.0</td><td>孙博士</td><td><div class="progress"><div class="progress-bar" style="width:42%"></div></div></td><td><span class="tag tag-primary">进行中</span></td></tr>
            <tr><td>KC2026-031</td><td>《智能制造数字孪生技术》课程建设</td><td><span class="tag tag-primary">课程建设</span></td><td>2026</td><td>12.0</td><td>周教授</td><td><div class="progress"><div class="progress-bar" style="width:35%"></div></div></td><td><span class="tag tag-primary">进行中</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,

  // ===========================================================
  // 4. 任务分配管理
  // ===========================================================
  taskassign: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">任务分配管理</div>
          <div class="page-sub">任务逐级分解 · 责任到人 · 支持更换责任人、灵活配置权限</div>
        </div>
        <button class="btn">＋ 分配新任务</button>
      </div>

      <div class="alert info">
        <span>ℹ</span>
        <div><strong>分配规则：</strong>支持一级、二级负责人分层管理；可批量分配、灵活更换责任人；分配自动同步至责任人个人工作台。</div>
      </div>

      <div class="row" style="margin-bottom:14px;">
        <div class="card col" style="flex:1.4;">
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>任务分配树形图（节选）</div></div>
          <div style="padding:10px 0;">
            <div style="padding:10px 14px;background:rgba(245,184,65,0.08);border-left:3px solid var(--gold);border-radius:6px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>📌 智能网联汽车高水平专业群建设</strong>
                <span class="tag tag-gold">一级 · 总负责人：李教授</span>
              </div>
            </div>
            <div style="padding-left:30px;">
              <div style="padding:10px 14px;background:rgba(45,140,240,0.06);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <strong>↳ 子任务1：智能网联汽车技术专业建设</strong>
                  <span class="tag tag-primary">二级 · 张博士</span>
                </div>
              </div>
              <div style="padding-left:30px;">
                <div style="padding:8px 12px;background:rgba(25,190,107,0.05);border-left:3px solid var(--success);border-radius:6px;margin-bottom:6px;">
                  ↳↳ 课程体系重构（陈教授）
                </div>
                <div style="padding:8px 12px;background:rgba(25,190,107,0.05);border-left:3px solid var(--success);border-radius:6px;margin-bottom:6px;">
                  ↳↳ 实训基地建设（赵教授）
                </div>
              </div>
              <div style="padding:10px 14px;background:rgba(45,140,240,0.06);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <strong>↳ 子任务2：师资队伍国际化建设</strong>
                  <span class="tag tag-primary">二级 · 王教授</span>
                </div>
              </div>
              <div style="padding:10px 14px;background:rgba(45,140,240,0.06);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <strong>↳ 子任务3：国际化办学项目申报</strong>
                  <span class="tag tag-primary">二级 · 周教授</span>
                </div>
              </div>
            </div>

            <div style="padding:10px 14px;background:rgba(245,184,65,0.08);border-left:3px solid var(--gold);border-radius:6px;margin-bottom:8px;margin-top:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>📌 航空智能制造技术专业群建设</strong>
                <span class="tag tag-gold">一级 · 总负责人：王教授</span>
              </div>
            </div>
            <div style="padding-left:30px;">
              <div style="padding:10px 14px;background:rgba(45,140,240,0.06);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <strong>↳ 子任务1：航空发动机数字化制造工艺</strong>
                  <span class="tag tag-primary">二级 · 张博士</span>
                </div>
              </div>
              <div style="padding:10px 14px;background:rgba(45,140,240,0.06);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <strong>↳ 子任务2：无人机智能制造关键技术</strong>
                  <span class="tag tag-primary">二级 · 孙博士</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card col">
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>分配操作</div></div>
          <div style="padding:8px 0;">
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">选择任务</div>
              <select style="width:100%;background:var(--bg-card-hi);color:var(--text-main);border:1px solid var(--border);padding:8px 12px;border-radius:6px;">
                <option>SG2026-001 智能网联汽车高水平专业群建设</option>
              </select>
            </div>
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">指派给（教师）</div>
              <select style="width:100%;background:var(--bg-card-hi);color:var(--text-main);border:1px solid var(--border);padding:8px 12px;border-radius:6px;">
                <option>陈教授 - 智能制造教研室</option>
                <option>张博士 - 汽车工程教研室</option>
                <option>李教授 - 航空智能制造教研室</option>
              </select>
            </div>
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">角色权限</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span class="badge green">✓ 任务编辑</span>
                <span class="badge green">✓ 材料上传</span>
                <span class="badge green">✓ 进度填报</span>
                <span class="badge">+ 添加</span>
              </div>
            </div>
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">完成期限</div>
              <input type="text" value="2026-12-31" style="width:100%;background:var(--bg-card-hi);color:var(--text-main);border:1px solid var(--border);padding:8px 12px;border-radius:6px;">
            </div>
            <button class="btn" style="width:100%;justify-content:center;">✓ 确认分配</button>
          </div>
        </div>
      </div>
    </div>
  `,

  // ===========================================================
  // 5. 任务过程监测（核心闭环可视化）
  // ===========================================================
  taskmonitor: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">任务过程监测 · 核心闭环</div>
          <div class="page-sub">在线填报 · 节点预警 · 实时进度跟踪</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📅 时间线视图</button>
          <button class="btn outline">📊 看板视图</button>
        </div>
      </div>

      <!-- 选中任务：智能网联汽车专业群 -->
      <div class="card" style="margin-bottom:14px;border-color:var(--gold);">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <div style="font-size:16px;font-weight:600;">📌 SG2026-001 · 智能网联汽车高水平专业群建设</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:6px;">
              一级负责人：李教授 | 二级负责人：张博士/王教授/周教授 | 预算：320万 | 完成期限：2026-12-31
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:24px;font-weight:700;color:var(--success);">78%</div>
            <div style="font-size:11px;color:var(--text-sub);">总进度</div>
          </div>
        </div>
        <div class="progress" style="margin-top:12px;height:8px;"><div class="progress-bar success" style="width:78%"></div></div>
      </div>

      <div class="row">
        <div class="card col">
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>任务执行时间线</div></div>
          <div class="timeline">
            <div class="timeline-item success">
              <div>
                <div class="timeline-time">2026-03-15</div>
                <div class="timeline-title">✓ 立项申报审批通过</div>
                <div class="timeline-desc">学院领导审批通过，正式立项</div>
              </div>
            </div>
            <div class="timeline-item success">
              <div>
                <div class="timeline-time">2026-04-02</div>
                <div class="timeline-title">✓ 任务分解与责任人确认</div>
                <div class="timeline-desc">8 个子任务分发至 12 名教师</div>
              </div>
            </div>
            <div class="timeline-item success">
              <div>
                <div class="timeline-time">2026-06-20</div>
                <div class="timeline-title">✓ 阶段性中期检查</div>
                <div class="timeline-desc">完成进度 45%，符合预期</div>
              </div>
            </div>
            <div class="timeline-item current">
              <div>
                <div class="timeline-time">2026-10-12</div>
                <div class="timeline-title">⚡ 关键节点：核心课程体系重构</div>
                <div class="timeline-desc">本月进行中，需关注 · 完成进度 78%</div>
              </div>
            </div>
            <div class="timeline-item">
              <div>
                <div class="timeline-time">2026-12-01</div>
                <div class="timeline-title">⏳ 预期：佐证材料归档完成</div>
                <div class="timeline-desc">所有子任务材料汇总至文档库</div>
              </div>
            </div>
            <div class="timeline-item">
              <div>
                <div class="timeline-time">2026-12-31</div>
                <div class="timeline-title">⏳ 预期：审核验收与结题</div>
                <div class="timeline-desc">提交验收申请，进入结题流程</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card col">
          <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>子任务进度详情</div></div>
          <div style="padding:6px 0;">
            <div style="padding:10px 0;border-bottom:1px dashed rgba(45,140,240,0.15);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="font-size:13px;">智能网联汽车技术专业建设</strong>
                <span class="tag tag-success">已完成</span>
              </div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">负责人：张博士</div>
              <div class="progress" style="margin-top:8px;"><div class="progress-bar success" style="width:100%"></div></div>
            </div>
            <div style="padding:10px 0;border-bottom:1px dashed rgba(45,140,240,0.15);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="font-size:13px;">课程体系重构</strong>
                <span class="tag tag-primary">进行中</span>
              </div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">负责人：陈教授 · 进度 85%</div>
              <div class="progress" style="margin-top:8px;"><div class="progress-bar success" style="width:85%"></div></div>
            </div>
            <div style="padding:10px 0;border-bottom:1px dashed rgba(45,140,240,0.15);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="font-size:13px;">实训基地建设（长安汽车）</strong>
                <span class="tag tag-warning">需关注</span>
              </div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">负责人：赵教授 · 进度 62%</div>
              <div class="progress" style="margin-top:8px;"><div class="progress-bar warning" style="width:62%"></div></div>
            </div>
            <div style="padding:10px 0;border-bottom:1px dashed rgba(45,140,240,0.15);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="font-size:13px;">师资队伍国际化建设</strong>
                <span class="tag tag-primary">进行中</span>
              </div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">负责人：王教授 · 进度 75%</div>
              <div class="progress" style="margin-top:8px;"><div class="progress-bar" style="width:75%"></div></div>
            </div>
            <div style="padding:10px 0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="font-size:13px;">国际化办学项目申报</strong>
                <span class="tag tag-primary">进行中</span>
              </div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">负责人：周教授 · 进度 68%</div>
              <div class="progress" style="margin-top:8px;"><div class="progress-bar" style="width:68%"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  // ===========================================================
  // 6. 佐证材料管理
  // ===========================================================
  evidence: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">佐证材料管理</div>
          <div class="page-sub">在线提交 · 实时预览 · 批量下载 · 文档库统一归档</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📂 文档库</button>
          <button class="btn">＋ 上传材料</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        <div class="kpi primary"><div class="kpi-icon">▣</div><div class="kpi-label">材料总数</div><div class="kpi-value">1,287</div><div class="kpi-trend up">本月 +86</div></div>
        <div class="kpi success"><div class="kpi-label">本月提交</div><div class="kpi-value">86</div><div class="kpi-trend">按任务归集</div></div>
        <div class="kpi warning"><div class="kpi-label">待审核材料</div><div class="kpi-value">23</div><div class="kpi-trend down">需关注</div></div>
        <div class="kpi gold"><div class="kpi-label">已归档</div><div class="kpi-value">1,178</div><div class="kpi-trend">归档率 91.5%</div></div>
      </div>

      <div class="card">
        <div class="card-title"><div class="card-title-left"><span class="card-title-dot"></span>SG2026-001 · 智能网联汽车高水平专业群建设 · 佐证材料</div></div>
        <table class="task-table">
          <thead>
            <tr><th>材料名称</th><th>所属子任务</th><th>上传人</th><th>上传时间</th><th>大小</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr><td>📄 专业群建设方案终稿.pdf</td><td>整体方案</td><td>李教授</td><td>2026-03-15</td><td>2.4 MB</td><td><span class="tag tag" style="background:rgba(25,190,107,0.18);color:var(--success);padding:3px 10px;border-radius:12px;font-size:11px;">已归档</span></td><td><a style="color:var(--primary-hi);cursor:pointer;">预览 | 下载</a></td></tr>
            <tr><td>📊 中期检查报告.pdf</td><td>整体进度</td><td>李教授</td><td>2026-06-20</td><td>1.8 MB</td><td><span class="tag success" style="background:rgba(25,190,107,0.18);color:var(--success);padding:3px 10px;border-radius:12px;font-size:11px;">已归档</span></td><td><a style="color:var(--primary-hi);cursor:pointer;">预览 | 下载</a></td></tr>
            <tr><td>📚 课程体系重构方案.docx</td><td>课程体系重构</td><td>陈教授</td><td>2026-09-15</td><td>856 KB</td><td><span class="tag warning" style="background:rgba(255,153,0,0.18);color:var(--warning);padding:3px 10px;border-radius:12px;font-size:11px;">待审核</span></td><td><a style="color:var(--primary-hi);cursor:pointer;">预览 | 审核</a></td></tr>
            <tr><td>🖼 实训基地现场照片.jpg</td><td>实训基地建设</td><td>赵教授</td><td>2026-10-08</td><td>3.2 MB</td><td><span class="tag success" style="background:rgba(25,190,107,0.18);color:var(--success);padding:3px 10px;border-radius:12px;font-size:11px;">已归档</span></td><td><a style="color:var(--primary-hi);cursor:pointer;">预览 | 下载</a></td></tr>
            <tr><td>📑 师资国际化培训证书.zip</td><td>师资国际化</td><td>王教授</td><td>2026-10-10</td><td>15.6 MB</td><td><span class="tag success" style="background:rgba(25,190,107,0.18);color:var(--success);padding:3px 10px;border-radius:12px;font-size:11px;">已归档</span></td><td><a style="color:var(--primary-hi);cursor:pointer;">预览 | 下载</a></td></tr>
            <tr><td>📄 国际化办学申报书.pdf</td><td>国际化办学</td><td>周教授</td><td>2026-10-11</td><td>4.2 MB</td><td><span class="tag warning" style="background:rgba(255,153,0,0.18);color:var(--warning);padding:3px 10px;border-radius:12px;font-size:11px;">待审核</span></td><td><a style="color:var(--primary-hi);cursor:pointer;">预览 | 审核</a></td></tr>
            <tr><td>📈 专业群建设指标数据.xlsx</td><td>整体进度</td><td>张博士</td><td>2026-10-12</td><td>512 KB</td><td><span class="tag success" style="background:rgba(25,190,107,0.18);color:var(--success);padding:3px 10px;border-radius:12px;font-size:11px;">已归档</span></td><td><a style="color:var(--primary-hi);cursor:pointer;">预览 | 下载</a></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  taskfund: () => {
    const RC = (typeof window !== 'undefined' && window.ROLE_CODE) || 'leader';
    const TF_TITLES = {
      leader:   { t: '任务资金管理 · 全院预算',     sub: '预算下达 · 资金执行 · 报销审批 · 资金使用全过程留痕' },
      director: { t: '任务资金管理 · 专业群预算', sub: '航空智能制造专业群预算下达 · 执行 · 报销审批' },
      teacher:  { t: '我的项目经费',                  sub: '我主负责项目经费到账 · 报销 · 执行情况' }
    };
    const T = TF_TITLES[RC] || TF_TITLES.leader;
    return `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">${T.t}</div>
          <div class="page-sub">${T.sub}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <select style="background:var(--bg-card);color:var(--text-main);border:1px solid var(--border);padding:6px 12px;border-radius:6px;font-size:12px;">
            <option>2026 年度</option>
            <option>2025 年度</option>
          </select>
          <button class="btn outline">📤 导出凭证</button>
          <button class="btn">＋ 预算申报</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        ${MOCK.renderRoleKpis('taskfund', window.ROLE_CODE)}
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>各类型预算 vs 执行</div>
            <span class="card-extra">单位：万元</span>
          </div>
          <div id="chartBudget" class="chart"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>近 8 月资金执行趋势</div>
            <span class="card-extra">月度</span>
          </div>
          <div id="chartBudgetTrend" class="chart"></div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>待审批报销单</div>
            <span class="card-extra">共 28 单</span>
          </div>
          <table class="task-table">
            <thead>
              <tr><th>报销单号</th><th>所属任务</th><th>金额(元)</th><th>申请人</th><th>状态</th></tr>
            </thead>
            <tbody>
              <tr><td>BX2026-1025</td><td>航空发动机数字化制造工艺</td><td>86,500</td><td>张博士</td><td><span class="tag tag-warning">待审批</span></td></tr>
              <tr><td>BX2026-1026</td><td>智能网联汽车高水平专业群</td><td>152,000</td><td>李教授</td><td><span class="tag tag-warning">待审批</span></td></tr>
              <tr><td>BX2026-1027</td><td>新能源汽车结构原理课程</td><td>18,600</td><td>陈教授</td><td><span class="tag tag-primary">审批中</span></td></tr>
              <tr><td>BX2026-1028</td><td>无人机智能制造关键技术</td><td>62,300</td><td>孙博士</td><td><span class="tag tag-warning">待审批</span></td></tr>
              <tr><td>BX2026-1029</td><td>长安汽车产教融合基地</td><td>198,000</td><td>赵教授</td><td><span class="tag tag-success">已通过</span></td></tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>资金执行规则说明</div>
          </div>
          <div class="desc-list">
            <div class="row-item"><dt>预算下达</dt><dd>年度预算经学院党政联席会议审议通过后下达</dd></div>
            <div class="row-item"><dt>使用范围</dt><dd>用于双高建设、课程建设、科研、教师发展、实训产教融合五类任务</dd></div>
            <div class="row-item"><dt>报销流程</dt><dd>申请人填报 → 教研室主任审核 → 学院分管院长审批 → 财务复核 → 支付</dd></div>
            <div class="row-item"><dt>单笔限额</dt><dd>5 万以下：教研室主任审批；5-20 万：分管院长审批；20 万以上：院长 + 党政联席会议</dd></div>
            <div class="row-item"><dt>调整规则</dt><dd>同类任务间调整≤10% 由分管院长审批；&gt;10% 或跨类调整须学院党政联席会议审议</dd></div>
            <div class="row-item"><dt>执行率监控</dt><dd>系统按月自动统计执行率；连续 2 个月低于 60% 触发预警</dd></div>
            <div class="row-item"><dt>结余处理</dt><dd>年度结余资金可结转下年度同类任务使用；跨类结余须重新申报</dd></div>
          </div>
        </div>
      </div>
    </div>
  `;
},

  // ===========================================================
  // 8. 任务绩效管理
  // ===========================================================
  performance: () => {
    const RC = (typeof window !== 'undefined' && window.ROLE_CODE) || 'leader';
    const PERF_TITLES = {
      leader:   { t: '任务绩效管理 · 全院教师绩效',       sub: '教学 · 科研 · 竞赛 · 服务 · 育人 · 双高 六维绩效指标体系' },
      director: { t: '任务绩效管理 · 专业群教师绩效', sub: '航空智能制造专业群六维绩效评估与排名' },
      teacher:  { t: '我的绩效',                                  sub: '本年/上学年/教学任务完成情况 / 绩效自评' }
    };
    const T = PERF_TITLES[RC] || PERF_TITLES.leader;
    return `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">${T.t}</div>
          <div class="page-sub">${T.sub}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📊 绩效方案</button>
          <button class="btn">⚙ 指标配置</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        ${MOCK.renderRoleKpis('performance', window.ROLE_CODE)}
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>教师绩效 TOP10</div>
            <span class="card-extra">综合得分</span>
          </div>
          <div id="chartPerformanceRank" class="chart" style="height:380px;"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span">学院均值 vs TOP10 均值</div>
            <span class="card-extra">六维对比</span>
          </div>
          <div id="chartPerformanceRadar" class="chart" style="height:380px;"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <div class="card-title-left"><span class="card-title-dot"></span>绩效计算逻辑</div>
          <span class="card-extra">六维加权</span>
        </div>
        <div class="grid grid-3">
          <div class="kpi primary" style="text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--primary-hi);">30%</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">教学权重</div>
          </div>
          <div class="kpi success" style="text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--success);">25%</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">科研权重</div>
          </div>
          <div class="kpi gold" style="text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--gold);">15%</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">竞赛权重</div>
          </div>
          <div class="kpi warning" style="text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--warning);">10%</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">服务权重</div>
          </div>
          <div class="kpi primary" style="text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--primary-hi);">10%</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">育人权重</div>
          </div>
          <div class="kpi gold" style="text-align:center;">
            <div style="font-size:22px;font-weight:700;color:var(--gold);">10%</div>
            <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">双高权重</div>
          </div>
        </div>
        <div style="margin-top:18px;padding:14px;background:rgba(245,184,65,0.08);border-left:3px solid var(--gold);border-radius:6px;font-size:12px;color:var(--text-sub);">
          <strong style="color:var(--gold);">评分规则：</strong>
          每维度按 100 分制计算 → 加权求和得出综合得分 → 90+ 为 A+、80-89 为 A、70-79 为 B、60-69 为 C、60 以下为 D。任务完成情况自动同步至绩效系统，作为过程性评价依据。
        </div>
      </div>
    </div>
  `;
},

  // ===========================================================
  // 9. 任务审核评价
  // ===========================================================
  audit: () => {
    const RC = (typeof window !== 'undefined' && window.ROLE_CODE) || 'leader';
    const AUDIT_TITLES = {
      leader:   { t: '任务审核评价 · 全院审核',           sub: '自定义审核流程 · 专家评价 · 在线签字' },
      director: { t: '任务审核评价 · 专业群审核',     sub: '专业群任务审核流程与材料归档' },
      teacher:  { t: '我的审核',                                  sub: '我主负责的任务审核状态与反馈' }
    };
    const T = AUDIT_TITLES[RC] || AUDIT_TITLES.leader;
    return `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">${T.t}</div>
          <div class="page-sub">${T.sub}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📋 审核流程配置</button>
          <button class="btn">🔍 进入审核</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        ${MOCK.renderRoleKpis('audit', window.ROLE_CODE)}
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>审核通过率分布</div>
            <span class="card-extra">2026 年度</span>
          </div>
          <div id="chartAuditRate" class="chart" style="height:320px;"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>月度审核趋势</div>
            <span class="card-extra">单位：项</span>
          </div>
          <div id="chartAuditTrend" class="chart" style="height:320px;"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <div class="card-title-left"><span class="card-title-dot"></span>待我审核任务</div>
          <span class="card-extra">共 19 项 · 按截止日期排序</span>
        </div>
        <table class="task-table">
          <thead>
            <tr><th>任务编号</th><th>任务名称</th><th>类型</th><th>负责人</th><th>提交时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr><td>SG2026-002-03</td><td>航空发动机数字化制造工艺研究（中期）</td><td><span class="tag tag-success">科研项目</span></td><td>张博士</td><td>2026-10-12</td><td><a style="color:var(--primary-hi);cursor:pointer;">审核 →</a></td></tr>
            <tr><td>KC2026-031-01</td><td>智能制造数字孪生技术课程建设（中期）</td><td><span class="tag tag-primary">课程建设</span></td><td>周教授</td><td>2026-10-11</td><td><a style="color:var(--primary-hi);cursor:pointer;">审核 →</a></td></tr>
            <tr><td>SB2026-022-02</td><td>国家级技能大师工作室（年度）</td><td><span class="tag tag-warning">教师申报</span></td><td>刘大师</td><td>2026-10-10</td><td><a style="color:var(--primary-hi);cursor:pointer;">审核 →</a></td></tr>
            <tr><td>SX2026-007-02</td><td>长安汽车产教融合基地（中期）</td><td><span class="tag tag-danger">实训产教</span></td><td>赵教授</td><td>2026-10-09</td><td><a style="color:var(--primary-hi);cursor:pointer;">审核 →</a></td></tr>
            <tr><td>KY2026-013-01</td><td>无人机智能制造关键技术研究（开题）</td><td><span class="tag tag-success">科研项目</span></td><td>孙博士</td><td>2026-10-08</td><td><a style="color:var(--primary-hi);cursor:pointer;">审核 →</a></td></tr>
            <tr><td>KC2026-015-02</td><td>新能源汽车结构原理课程（结题）</td><td><span class="tag tag-primary">课程建设</span></td><td>陈教授</td><td>2026-10-05</td><td><a style="color:var(--primary-hi);cursor:pointer;">审核 →</a></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
},

  // ===========================================================
  // 10. 课程建设管控
  // ===========================================================
  course: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">课程建设管控</div>
          <div class="page-sub">课程库管理 · 课程思政示范 · 在线开放课程 · 新形态教材</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📚 课程标准</button>
          <button class="btn">＋ 新建课程</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        <div class="kpi primary"><div class="kpi-icon">▤</div><div class="kpi-label">课程总数</div><div class="kpi-value">180</div><div class="kpi-trend up">本学期 +12</div></div>
        <div class="kpi gold"><div class="kpi-label">课程思政示范</div><div class="kpi-value">16</div><div class="kpi-trend">国家级 3 · 市级 13</div></div>
        <div class="kpi success"><div class="kpi-label">在线开放课程</div><div class="kpi-value">22</div><div class="kpi-trend">国家级 5 · 校级 9</div></div>
        <div class="kpi warning"><div class="kpi-label">新形态教材</div><div class="kpi-value">14</div><div class="kpi-trend">活页式 · 数字教材</div></div>
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>课程类型分布</div>
            <span class="card-extra">共 180 门</span>
          </div>
          <div id="chartCourseType" class="chart"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>课程建设进度</div>
            <span class="card-extra">按类别</span>
          </div>
          <div id="chartCourseProgress" class="chart"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <div class="card-title-left"><span class="card-title-dot"></span>重点课程建设清单（节选）</div>
          <span class="card-extra">查看全部 →</span>
        </div>
        <table class="task-table">
          <thead>
            <tr><th>课程编号</th><th>课程名称</th><th>类型</th><th>负责人</th><th>建设进度</th><th>状态</th></tr>
          </thead>
          <tbody>
            <tr><td>KC2026-015</td><td>新能源汽车结构原理（课程思政示范）</td><td><span class="tag tag-gold">思政示范</span></td><td>陈教授</td><td><div class="progress"><div class="progress-bar success" style="width:91%"></div></div></td><td><span class="tag tag-success">已验收</span></td></tr>
            <tr><td>KC2026-031</td><td>智能制造数字孪生技术</td><td><span class="tag tag-primary">在线开放</span></td><td>周教授</td><td><div class="progress"><div class="progress-bar" style="width:78%"></div></div></td><td><span class="tag tag-primary">建设中</span></td></tr>
            <tr><td>KC2026-008</td><td>航空发动机结构与维修</td><td><span class="tag tag-primary">专业核心</span></td><td>王教授</td><td><div class="progress"><div class="progress-bar success" style="width:86%"></div></div></td><td><span class="tag tag-primary">建设中</span></td></tr>
            <tr><td>KC2026-022</td><td>智能网联汽车技术</td><td><span class="tag tag-gold">思政示范</span></td><td>李教授</td><td><div class="progress"><div class="progress-bar success" style="width:94%"></div></div></td><td><span class="tag tag-success">已验收</span></td></tr>
            <tr><td>KC2026-040</td><td>汽车制造工艺数字化</td><td><span class="tag tag-warning">新形态教材</span></td><td>赵教授</td><td><div class="progress"><div class="progress-bar warning" style="width:62%"></div></div></td><td><span class="tag tag-primary">建设中</span></td></tr>
            <tr><td>KC2026-052</td><td>新能源汽车电力驱动</td><td><span class="tag tag-success">实训实践</span></td><td>张博士</td><td><div class="progress"><div class="progress-bar" style="width:45%"></div></div></td><td><span class="tag tag-primary">建设中</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,

  // ===========================================================
  // 11. 实验实训运行
  // ===========================================================
  lab: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">实验实训运行</div>
          <div class="page-sub">实训基地调度 · 设备状态监控 · 产教融合运行</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📅 课表编排</button>
          <button class="btn">＋ 实训计划</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        <div class="kpi primary"><div class="kpi-icon">⚙</div><div class="kpi-label">实训基地</div><div class="kpi-value">12</div><div class="kpi-trend">国家级 2 · 市级 5</div></div>
        <div class="kpi success"><div class="kpi-label">设备总数</div><div class="kpi-value">386</div><div class="kpi-trend up">利用率 78%</div></div>
        <div class="kpi gold"><div class="kpi-label">本学期实训学时</div><div class="kpi-value">12,800</div><div class="kpi-trend">已完成 8,256</div></div>
        <div class="kpi warning"><div class="kpi-label">故障设备</div><div class="kpi-value">8</div><div class="kpi-trend down">已申报维修</div></div>
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>实训基地使用率</div>
            <span class="card-extra">本学期</span>
          </div>
          <div id="chartLabUsage" class="chart"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>设备运行状态</div>
            <span class="card-extra">共 386 台</span>
          </div>
          <div id="chartDeviceStatus" class="chart"></div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>产教融合基地</div>
            <span class="card-extra">合作企业</span>
          </div>
          <div style="padding:8px 0;">
            <div style="padding:14px;background:linear-gradient(135deg,rgba(45,140,240,0.08),rgba(245,184,65,0.05));border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:600;">🚗 长安汽车产教融合实训基地</div>
                  <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">国家级 · 2019 立项 · 累计培养学生 1,260 人</div>
                </div>
                <span class="tag tag-gold">国家级</span>
              </div>
            </div>
            <div style="padding:14px;background:linear-gradient(135deg,rgba(45,140,240,0.08),rgba(245,184,65,0.05));border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:600;">✈ 中航工业航空制造产教融合基地</div>
                  <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">市级 · 2021 立项 · 累计培养学生 480 人</div>
                </div>
                <span class="tag tag-primary">市级</span>
              </div>
            </div>
            <div style="padding:14px;background:linear-gradient(135deg,rgba(45,140,240,0.08),rgba(245,184,65,0.05));border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:600;">🔋 比亚迪新能源汽车实训中心</div>
                  <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">校级 · 2022 立项 · 累计培养学生 320 人</div>
                </div>
                <span class="tag tag-info">校级</span>
              </div>
            </div>
            <div style="padding:14px;background:linear-gradient(135deg,rgba(45,140,240,0.08),rgba(245,184,65,0.05));border:1px solid var(--border);border-radius:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:600;">🤖 大疆无人机创新实践基地</div>
                  <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">校级 · 2023 立项 · 累计培养学生 180 人</div>
                </div>
                <span class="tag tag-info">校级</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>本周实训计划</div>
            <span class="card-extra">10/13 - 10/19</span>
          </div>
          <table class="task-table">
            <thead>
              <tr><th>日期</th><th>时段</th><th>课程/项目</th><th>基地</th><th>指导教师</th></tr>
            </thead>
            <tbody>
              <tr><td>10-13</td><td>08:00-12:00</td><td>新能源汽车电力驱动实训</td><td>比亚迪中心</td><td>张博士</td></tr>
              <tr><td>10-14</td><td>14:00-17:00</td><td>智能网联汽车仿真</td><td>汽车工程中心</td><td>李教授</td></tr>
              <tr><td>10-15</td><td>08:00-12:00</td><td>航空发动机拆装实训</td><td>中航工业基地</td><td>王教授</td></tr>
              <tr><td>10-16</td><td>14:00-17:00</td><td>无人机飞行控制</td><td>大疆基地</td><td>孙博士</td></tr>
              <tr><td>10-17</td><td>08:00-12:00</td><td>汽车制造工艺综合实训</td><td>长安汽车基地</td><td>赵教授</td></tr>
              <tr><td>10-18</td><td>全天</td><td>职业技能等级认证（中级）</td><td>汽车工程中心</td><td>刘大师</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,

  // ===========================================================
  // 12. 教师一师一档案
  // ===========================================================
  teacher: () => {
    const RC = (typeof window !== 'undefined' && window.ROLE_CODE) || 'leader';
    const TEACHER_TITLES = {
      leader:   { t: '教师一师一档案 · 全院',         sub: '教学 · 科研 · 竞赛 · 育人 · 服务全维度记录 · 数据自动归集' },
      director: { t: '教师一师一档案 · 专业群',     sub: '航空智能制造专业群教师档案管理' },
      teacher:  { t: '我的教师档案',                          sub: '我的教学 / 科研 / 育人 / 培训 / 产教融合 / 成果' }
    };
    const T = TEACHER_TITLES[RC] || TEACHER_TITLES.leader;
    return `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">${T.t}</div>
          <div class="page-sub">${T.sub}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📥 批量导入</button>
          <button class="btn">＋ 新增教师</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        ${MOCK.renderRoleKpis('teacher_page', window.ROLE_CODE)}
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>教师职称结构</div>
            <span class="card-extra">共 152 人</span>
          </div>
          <div id="chartTeacherLevel" class="chart" style="height:300px;"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>教师年龄分布</div>
            <span class="card-extra">按年龄段</span>
          </div>
          <div id="chartTeacherAge" class="chart" style="height:300px;"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <div class="card-title-left"><span class="card-title-dot"></span>教师档案 · 重点人才</div>
          <span class="card-extra">查看全部 →</span>
        </div>
        <div class="grid grid-4">
          <div class="teacher-card hover-lift">
            <div class="teacher-avatar" style="background:linear-gradient(135deg,#f5b841,#d89614);">陈</div>
            <div class="teacher-name">陈教授</div>
            <div class="teacher-title">智能制造教研室 · 二级教授</div>
            <div class="teacher-tags">
              <span class="tag tag-gold">国务院政府特殊津贴</span>
              <span class="tag tag-primary">博士</span>
            </div>
            <div style="margin-top:12px;font-size:11px;color:var(--text-sub);text-align:left;line-height:1.7;">
              <div>📚 主讲课程：6 门</div>
              <div>🔬 主持课题：8 项（含国家自然基金 2 项）</div>
              <div>🏆 获奖：国家级 3 · 省部级 8</div>
              <div>📜 授权专利：32 项</div>
              <div>📝 论文：SCI/EI 28 篇</div>
            </div>
            <button class="btn outline" style="width:100%;margin-top:12px;justify-content:center;font-size:11px;padding:6px;">查看档案 →</button>
          </div>

          <div class="teacher-card hover-lift">
            <div class="teacher-avatar" style="background:linear-gradient(135deg,#5cadff,#2d8cf0);">李</div>
            <div class="teacher-name">李教授</div>
            <div class="teacher-title">汽车工程教研室 · 教授</div>
            <div class="teacher-tags">
              <span class="tag tag-primary">课程思政教学名师</span>
              <span class="tag tag-info">博士</span>
            </div>
            <div style="margin-top:12px;font-size:11px;color:var(--text-sub);text-align:left;line-height:1.7;">
              <div>📚 主讲课程：5 门</div>
              <div>🔬 主持课题：6 项</div>
              <div>🏆 获奖：国家级 2 · 省部级 6</div>
              <div>📜 授权专利：18 项</div>
              <div>👨‍🎓 指导学生获奖：12 项</div>
            </div>
            <button class="btn outline" style="width:100%;margin-top:12px;justify-content:center;font-size:11px;padding:6px;">查看档案 →</button>
          </div>

          <div class="teacher-card hover-lift">
            <div class="teacher-avatar" style="background:linear-gradient(135deg,#19be6b,#0fa558);">王</div>
            <div class="teacher-name">王教授</div>
            <div class="teacher-title">航空智能制造教研室 · 教授</div>
            <div class="teacher-tags">
              <span class="tag tag-gold">市级技术能手</span>
              <span class="tag tag-info">博士</span>
            </div>
            <div style="margin-top:12px;font-size:11px;color:var(--text-sub);text-align:left;line-height:1.7;">
              <div>📚 主讲课程：4 门</div>
              <div>🔬 主持课题：5 项</div>
              <div>🏆 获奖：省部级 4</div>
              <div>📜 授权专利：22 项</div>
              <div>📝 论文：SCI 12 篇</div>
            </div>
            <button class="btn outline" style="width:100%;margin-top:12px;justify-content:center;font-size:11px;padding:6px;">查看档案 →</button>
          </div>

          <div class="teacher-card hover-lift">
            <div class="teacher-avatar" style="background:linear-gradient(135deg,#ed3f3f,#c8302f);">刘</div>
            <div class="teacher-name">刘大师</div>
            <div class="teacher-title">国家级技能大师工作室 · 高级技师</div>
            <div class="teacher-tags">
              <span class="tag tag-danger">国家级技能大师</span>
              <span class="tag tag-warning">企业兼职</span>
            </div>
            <div style="margin-top:12px;font-size:11px;color:var(--text-sub);text-align:left;line-height:1.7;">
              <div>🛠 主导项目：3 项</div>
              <div>👨‍🎓 培养技师：126 人</div>
              <div>🏆 获奖：国家级 2 · 省部级 5</div>
              <div>📜 国家专利：8 项</div>
              <div>🤝 校企合作：长安/比亚迪</div>
            </div>
            <button class="btn outline" style="width:100%;margin-top:12px;justify-content:center;font-size:11px;padding:6px;">查看档案 →</button>
          </div>
        </div>
      </div>
    </div>
  `;
},

  // ===========================================================
  // 13. 学院专题门户
  // ===========================================================
  portal: () => `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">学院专题门户</div>
          <div class="page-sub">学院新闻 · 招生就业 · 合作企业 · 社会服务对外展示</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📰 发布新闻</button>
          <button class="btn">🌐 访问前台</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        <div class="kpi primary"><div class="kpi-icon">★</div><div class="kpi-label">招生规模</div><div class="kpi-value">1,320</div><div class="kpi-trend up">2026 录取</div></div>
        <div class="kpi success"><div class="kpi-label">就业率</div><div class="kpi-value">97.1%</div><div class="kpi-trend up">对口率 86%</div></div>
        <div class="kpi gold"><div class="kpi-label">合作企业</div><div class="kpi-value">68</div><div class="kpi-trend">世界 500 强 12 家</div></div>
        <div class="kpi warning"><div class="kpi-label">社会培训</div><div class="kpi-value">17,000+</div><div class="kpi-trend">累计培训人次</div></div>
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>招生 vs 就业率趋势</div>
            <span class="card-extra">近 4 年</span>
          </div>
          <div id="chartPortalData" class="chart"></div>
        </div>
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>学院简介</div>
          </div>
          <div class="desc-list">
            <div class="row-item"><dt>学院名称</dt><dd>智能制造与汽车学院（航空学院）</dd></div>
            <div class="row-item"><dt>办学定位</dt><dd>服务重庆"33618"现代制造业集群，培养智能制造、汽车工程、航空制造领域高素质技术技能人才</dd></div>
            <div class="row-item"><dt>开设专业</dt><dd>8 个（智能制造工程、汽车制造、航空发动机制造、新能源汽车、物联网、机械工程、数控技术、工业机器人）</dd></div>
            <div class="row-item"><dt>国家级平台</dt><dd>国家级协同创新中心 1 个 · 国家级技能大师工作室 1 个 · 国家级生产性实训基地 2 个</dd></div>
            <div class="row-item"><dt>省级平台</dt><dd>市级重点实验室 3 个 · 市级技能大师工作室 5 个 · 现代产业学院 2 个</dd></div>
            <div class="row-item"><dt>合作企业</dt><dd>长安、比亚迪、上汽通用五菱、中航工业、华为、大疆等 68 家世界 500 强和行业头部企业</dd></div>
            <div class="row-item"><dt>国际化</dt><dd>与德国、瑞士、新加坡等 12 所海外院校建立合作；累计培养学生海外交流 320 人次</dd></div>
          </div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>学院新闻</div>
            <span class="card-extra">更多 →</span>
          </div>
          <div class="timeline" style="padding:0;">
            <div class="timeline-item success">
              <div>
                <div class="timeline-time">2026-10-12</div>
                <div class="timeline-title">🎉 学院获评"国家级智能制造高水平专业群"</div>
                <div class="timeline-desc">教育部公示，我院智能网联汽车专业群入选第二轮双高计划</div>
              </div>
            </div>
            <div class="timeline-item">
              <div>
                <div class="timeline-time">2026-10-08</div>
                <div class="timeline-title">🤝 与长安汽车签署战略合作协议 2.0</div>
                <div class="timeline-desc">共建智能网联汽车产业学院，年培养规模 500 人</div>
              </div>
            </div>
            <div class="timeline-item">
              <div>
                <div class="timeline-time">2026-09-28</div>
                <div class="timeline-title">🏆 师生在全国职业院校技能大赛斩获 3 金 2 银</div>
                <div class="timeline-desc">智能制造、汽车检测维修、航空发动机维修赛项</div>
              </div>
            </div>
            <div class="timeline-item">
              <div>
                <div class="timeline-time">2026-09-15</div>
                <div class="timeline-title">📚 6 门课程获评市级课程思政示范课程</div>
                <div class="timeline-desc">《新能源汽车结构原理》等 6 门课程入选</div>
              </div>
            </div>
            <div class="timeline-item">
              <div>
                <div class="timeline-time">2026-09-01</div>
                <div class="timeline-title">🎓 2026 级新生开学典礼举行</div>
                <div class="timeline-desc">1,320 名新生入学，招生规模再创新高</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>合作企业（节选）</div>
            <span class="card-extra">共 68 家</span>
          </div>
          <div class="grid grid-3">
            <div style="padding:14px;background:rgba(45,140,240,0.06);border:1px solid var(--border);border-radius:8px;text-align:center;">
              <div style="font-size:24px;">🚗</div>
              <div style="font-weight:600;margin-top:6px;">长安汽车</div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">世界 500 强 · 战略合作</div>
            </div>
            <div style="padding:14px;background:rgba(45,140,240,0.06);border:1px solid var(--border);border-radius:8px;text-align:center;">
              <div style="font-size:24px;">🔋</div>
              <div style="font-weight:600;margin-top:6px;">比亚迪</div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">世界 500 强 · 新能源</div>
            </div>
            <div style="padding:14px;background:rgba(45,140,240,0.06);border:1px solid var(--border);border-radius:8px;text-align:center;">
              <div style="font-size:24px;">✈</div>
              <div style="font-weight:600;margin-top:6px;">中航工业</div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">央企 · 航空制造</div>
            </div>
            <div style="padding:14px;background:rgba(45,140,240,0.06);border:1px solid var(--border);border-radius:8px;text-align:center;">
              <div style="font-size:24px;">🤖</div>
              <div style="font-weight:600;margin-top:6px;">大疆创新</div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">无人机 · 创新实践</div>
            </div>
            <div style="padding:14px;background:rgba(45,140,240,0.06);border:1px solid var(--border);border-radius:8px;text-align:center;">
              <div style="font-size:24px;">🔧</div>
              <div style="font-weight:600;margin-top:6px;">上汽通用五菱</div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">世界 500 强 · 汽车制造</div>
            </div>
            <div style="padding:14px;background:rgba(45,140,240,0.06);border:1px solid var(--border);border-radius:8px;text-align:center;">
              <div style="font-size:24px;">📡</div>
              <div style="font-weight:600;margin-top:6px;">华为技术</div>
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">世界 500 强 · 工业互联</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  // ===========================================================
  // 14. 个人工作台
  // ===========================================================
  workspace: () => {
    const RC = (typeof window !== 'undefined' && window.ROLE_CODE) || 'leader';
    const WS_TITLES = {
      leader:   { t: '个人工作台 · 王建军',          sub: '我的待办 · 我的任务 · 通知消息 · 全院督办' },
      director: { t: '专业群工作台 · 王建军',     sub: '专业群督办 · 我的任务 · 通知消息 · 专业群绩效' },
      teacher:  { t: '我的工作台 · 陈静',         sub: '我的待办 · 我的任务 · 我的课程 · 我的绩效' }
    };
    const WS_TODO_TITLE = {
      leader:   { t: '全院需督办任务（按紧急度）',     extra: '共 8 项' },
      director: { t: '专业群需督办任务（按紧急度）', extra: '共 5 项' },
      teacher:  { t: '我的待办（按紧急度）',          extra: '共 6 项' }
    };
    const WS_TASK_TITLE = {
      leader:   { t: '我主负责 / 协办的任务（进行中）',         extra: '6 项' },
      director: { t: '我主负责 / 协办的任务（进行中）',         extra: '6 项' },
      teacher:  { t: '我主负责 / 协办的任务（进行中）',         extra: '6 项' }
    };
    const T = WS_TITLES[RC] || WS_TITLES.leader;
    const TODO_T = WS_TODO_TITLE[RC] || WS_TODO_TITLE.leader;
    const TASK_T = WS_TASK_TITLE[RC] || WS_TASK_TITLE.leader;

    return `
    <div class="page active">
      <div class="page-header">
        <div>
          <div class="page-title">${T.t}</div>
          <div class="page-sub">${T.sub}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn outline">📅 我的日历</button>
          <button class="btn">⚙ 偏好设置</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:14px;">
        ${MOCK.renderRoleKpis('workspace', window.ROLE_CODE)}
      </div>

      <div class="grid grid-2" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>${TODO_T.t}</div>
            <span class="card-extra">${TODO_T.extra}</span>
          </div>
          <div>
            ${MOCK.renderTodoList(window.ROLE_CODE)}
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>本周工作分布</div>
            <span class="card-extra">10/13 - 10/19</span>
          </div>
          <div id="chartWorkspaceWeek" class="chart"></div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>${TASK_T.t}</div>
            <span class="card-extra">${TASK_T.extra}</span>
          </div>
          <table class="task-table">
            <thead>
              <tr><th>任务名称</th><th>角色</th><th>进度</th><th>状态</th></tr>
            </thead>
            <tbody>
              ${MOCK.renderMyTasks(window.ROLE_CODE)}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">
            <div class="card-title-left"><span class="card-title-dot"></span>系统消息</div>
            <span class="card-extra">最新 6 条</span>
          </div>
          <div style="padding:8px 0;">
            <div style="padding:12px;background:rgba(237,63,63,0.06);border-left:3px solid var(--danger);border-radius:6px;margin-bottom:8px;font-size:12px;">
              <strong style="color:var(--danger);">🔴 紧急</strong>　|　
              <strong>航空发动机数字化制造工艺任务</strong>仅剩 5 天，请立即督办。
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">2026-10-13 09:00 · 系统自动预警</div>
            </div>
            <div style="padding:12px;background:rgba(255,153,0,0.06);border-left:3px solid var(--warning);border-radius:6px;margin-bottom:8px;font-size:12px;">
              <strong style="color:var(--warning);">🟡 提醒</strong>　|　
              <strong>SG2026-001 阶段性中期检查</strong>已通过审核，可推进后续工作。
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">2026-10-12 16:30 · 教务处</div>
            </div>
            <div style="padding:12px;background:rgba(45,140,240,0.06);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:8px;font-size:12px;">
              <strong style="color:var(--primary-hi);">🔵 通知</strong>　|　
              <strong>学院获评"国家级智能制造高水平专业群"</strong>，请关注后续工作部署。
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">2026-10-12 14:20 · 学院办公室</div>
            </div>
            <div style="padding:12px;background:rgba(25,190,107,0.06);border-left:3px solid var(--success);border-radius:6px;margin-bottom:8px;font-size:12px;">
              <strong style="color:var(--success);">🟢 完成</strong>　|　
              <strong>KC2026-015《新能源汽车结构原理》课程思政示范课</strong>已结题归档。
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">2026-10-11 11:15 · 教务处</div>
            </div>
            <div style="padding:12px;background:rgba(45,140,240,0.06);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:8px;font-size:12px;">
              <strong style="color:var(--primary-hi);">🔵 通知</strong>　|　
              <strong>10 月 15 日 14:00</strong>召开双高建设月度推进会，请准时参加。
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">2026-10-10 09:00 · 学院办公室</div>
            </div>
            <div style="padding:12px;background:rgba(245,184,65,0.06);border-left:3px solid var(--gold);border-radius:6px;font-size:12px;">
              <strong style="color:var(--gold);">🟡 重要</strong>　|　
              <strong>2027 年预算编制工作启动</strong>，请各教研室 11 月 5 日前提交申报。
              <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">2026-10-09 17:00 · 财务处</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
},

};

// 让 PAGES 可被其他模块扩展
window.PAGES = PAGES;
