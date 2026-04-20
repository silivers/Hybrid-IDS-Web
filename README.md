# Hybrid IDS 前端系统

基于 RESTful API 实现的混合入侵检测系统（Hybrid IDS）前端界面。

## 技术栈

- 原生 HTML5/CSS3/JavaScript (ES6+)
- 无任何外部依赖
- 模块化组件设计

## 项目结构

| 目录/文件 | 说明 |
| --- | --- |
| ids-frontend/ | 项目根目录 |
| ids-frontend/index.html | 主入口页面 |
| ids-frontend/css/ | 样式目录 |
| ids-frontend/css/style.css | 全局样式 |
| ids-frontend/js/ | 脚本目录 |
| ids-frontend/js/app.js | 应用主控制器 |
| ids-frontend/js/api.js | API请求封装 |
| ids-frontend/js/utils.js | 工具函数 |
| ids-frontend/js/components/ | 视图组件目录 |
| ids-frontend/js/components/dashboard.js | 仪表盘组件 |
| ids-frontend/js/components/alerts.js | 告警管理组件 |
| ids-frontend/js/components/assets.js | 资产管理组件 |
| ids-frontend/js/components/rules.js | 规则管理组件 |
| ids-frontend/js/components/reports.js | 报表组件 |
| ids-frontend/assets/ | 静态资源目录 |

## 功能模块

### 1. 仪表盘

- 关键指标卡片：总告警数、高危告警数、未处理告警数、受影响资产数
- 告警等级分布柱状图
- TOP 10 攻击源IP
- TOP 10 目标资产
- TOP 10 告警规则

数据来源：/api/dashboard/overview

### 2. 告警管理

- 告警列表展示（支持分页）
- 多条件筛选：严重程度、处理状态、源IP、目标IP
- 单条告警详情查看（包含规则完整信息、匹配content、payload预览）
- 单条告警标记为已处理
- 批量标记告警为已处理

数据来源：
- GET /api/alerts
- GET /api/alerts/{alert_id}
- PUT /api/alerts/{alert_id}/process
- PUT /api/alerts/batch-process
- GET /api/stats/filter-options

### 3. 资产管理

- 受监控资产列表（从告警中提取所有目标IP）
- 每个资产显示：告警总数、最高严重等级、最近告警时间、未处理数、风险评分
- 资产风险详情：风险评分、高危告警数、告警趋势、TOP攻击源、规则类型分布、安全建议

数据来源：
- GET /api/assets
- GET /api/assets/{dst_ip}/risk
- GET /api/investigate/asset/{dst_ip}

### 4. 规则管理

- Snort规则列表（支持分页）
- 多条件筛选：SID、规则消息关键词、严重程度、启用状态
- 规则启用/禁用切换
- 规则详情查看：完整规则文本、匹配条件列表（content）、参考链接

数据来源：
- GET /api/rules
- GET /api/rules/{sid}
- PUT /api/rules/{sid}/toggle

### 5. 报表中心

- 自定义时间范围报表生成
- 告警摘要：总数、高危/中危/低危数量及占比
- TOP 10 攻击源：告警数、占比、各级别分布、目标数
- TOP 10 命中规则：命中次数、占比、严重程度

数据来源：
- GET /api/reports/summary
- GET /api/reports/top-sources
- GET /api/reports/top-rules

## 安装与运行

### 环境要求

- 后端API服务运行在 http://localhost:8000
- 现代浏览器（Chrome/Firefox/Edge/Safari）

### 启动步骤

1. 确保后端API服务已启动

2. 使用任意静态服务器启动前端：

   Python方式：
   python -m http.server 8080

   Node.js方式：
   npx http-server . -p 8080

3. 访问 http://localhost:8080

## API配置

API基础地址在 js/api.js 中配置：

const API_BASE = 'http://localhost:8000/api';

如需修改后端地址，请更改此变量。

## 组件说明

### app.js

应用主控制器，负责：
- 路由导航切换
- 视图组件加载
- 激活菜单状态

### api.js

API请求封装类，包含所有后端接口调用方法：
- 仪表盘：getDashboardOverview
- 告警：getAlerts, getAlertDetail, processAlert, batchProcessAlerts
- 资产：getAssets, getAssetRisk
- 调查：investigateSource, investigateConversation, investigateAsset
- 规则：getRules, getRuleDetail, toggleRule
- 报表：getReportSummary, getTopSources, getTopRules
- 统计：getFilterOptions

### utils.js

公共工具函数：
- formatTime：时间格式化
- getSeverityLabel / getSeverityClass：严重程度标签和样式
- getProcessedLabel / getProcessedClass：处理状态标签和样式
- showModal：模态框显示
- debounce：防抖函数
- updateCurrentTime：更新时间显示

### components/*.js

五个独立视图组件，每个组件包含：
- render(container)：渲染主视图
- 内部数据加载方法
- 事件绑定方法
- 详情展示方法

## 样式说明

- 深色侧边栏 + 浅色主内容区
- 卡片式设计，圆角阴影
- 响应式布局：移动端侧边栏自动折叠为图标模式
- 状态徽章：高危红色、中危橙色、低危蓝色、已处理绿色、未处理粉色


## 注意事项

1. 后端API需支持CORS跨域请求
2. 告警批量操作时，批量处理的告警ID会保留在当前页面的选中状态中
3. 报表时间范围默认最近7天，可自定义修改
4. 规则列表中的content_preview最多显示3个匹配模式
5. 所有模态框点击外部或关闭按钮均可关闭
