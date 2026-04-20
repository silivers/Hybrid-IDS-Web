# 混合入侵检测系统 - 安全态势感知平台

## 项目简介

本项目是一个基于Suricata规则的混合入侵检测系统(Hybrid IDS)的前端可视化平台，提供实时的网络安全态势感知、告警管理、事件溯源、资产风险分析等核心功能。

## 技术栈

- 前端框架: 原生JavaScript (ES6+)
- 图表库: Chart.js 4.4.0
- 图标库: Font Awesome 6.0
- 后端API: RESTful API (Python后端，端口8000)

## 系统架构

| 目录/文件 | 说明 |
|---------|------|
| ids-frontend/ | 项目根目录 |
| ids-frontend/index.html | 主入口页面 |
| ids-frontend/css/ | 样式目录 |
| ids-frontend/css/style.css | 全局样式 |
| ids-frontend/js/ | 脚本目录 |
| ids-frontend/js/app.js | 应用主控制器 |
| ids-frontend/js/api.js | API请求封装 |
| ids-frontend/js/config.js | 配置管理 |
| ids-frontend/js/utils.js | 工具函数 |
| ids-frontend/js/components/ | 视图组件目录 |
| ids-frontend/js/components/dashboard.js | 仪表盘组件 |
| ids-frontend/js/components/alerts.js | 告警管理组件 |
| ids-frontend/js/components/assets.js | 资产管理组件 |
| ids-frontend/js/components/rules.js | 规则管理组件 |
| ids-frontend/js/components/reports.js | 报表组件 |
| ids-frontend/js/components/investigate.js | 事件调查组件 |

## 功能模块

### 1. 仪表盘 (Dashboard)

- 总告警数、高危告警、未处理告警、受影响资产统计
- 告警趋势图（近24小时）
- 严重程度分布图
- 攻击源IP TOP10
- 目标IP TOP10
- 告警类型TOP10
- 触发规则TOP10

### 2. 告警管理 (Alerts)

- 告警列表展示（分页、排序）
- 多条件筛选（源IP、目标IP、严重程度、处理状态）
- 告警详情查看（包含规则文本、payload预览）
- 单条/批量标记已处理

### 3. 资产管理 (Assets)

- 资产列表展示
- 资产风险评分
- 攻击源分析
- 告警趋势图
- 安全加固建议

### 4. 规则管理 (Rules)

- 规则列表展示
- 多条件筛选（SID、消息关键词、分类、协议、严重程度、状态）
- 规则详情查看（完整规则文本、content条件）
- 规则启用/禁用切换

### 5. 报表合规 (Reports)

- 报表周期统计
- 告警总数及高危占比
- TOP攻击源排行
- TOP规则命中排行

### 6. 事件调查 (Investigate)

- 按源IP调查：追踪攻击源的所有行为
- 对话聚合：分析两个IP之间的通信
- 资产上下文：查看目标资产的完整安全状况

## 安装与运行

### 环境要求

- 现代浏览器（Chrome/Firefox/Edge）
- 后端服务正常运行在 http://localhost:8000

### 快速开始

1. 克隆项目到Web服务器目录

git clone <repository-url>
cd Hybrid-IDS-Frontend

2. 配置后端地址

编辑 js/config.js，根据需要修改后端地址：

自动检测模式（默认）：
前端访问 localhost:3000 -> 后端 localhost:8000
前端访问 192.168.1.100:3000 -> 后端 192.168.1.100:8000

手动指定模式（取消注释）：
// export const MANUAL_BACKEND_URL = 'http://192.168.1.8:8000/api';

3. 启动Web服务器

使用Python简单服务器：
python -m http.server 3000

或使用nginx/apache

4. 确保后端服务已启动

cd Hybrid-IDS-Backend
sudo python main.py

5. 访问系统

http://localhost:3000

## API接口说明

前端依赖以下后端API接口：

| 模块 | 端点 | 方法 | 说明 |
|------|------|------|------|
| 仪表盘 | /api/dashboard/overview | GET | 获取概览数据 |
| 告警 | /api/alerts | GET | 告警列表 |
| 告警 | /api/alerts/{id} | GET | 告警详情 |
| 告警 | /api/alerts/{id}/process | PUT | 标记处理 |
| 告警 | /api/alerts/batch-process | PUT | 批量处理 |
| 资产 | /api/assets | GET | 资产列表 |
| 资产 | /api/assets/{ip}/risk | GET | 资产风险 |
| 规则 | /api/rules | GET | 规则列表 |
| 规则 | /api/rules/{sid} | GET | 规则详情 |
| 规则 | /api/rules/{sid}/toggle | PUT | 切换状态 |
| 调查 | /api/investigate/source/{ip} | GET | 源IP调查 |
| 调查 | /api/investigate/conversation | GET | 对话聚合 |
| 调查 | /api/investigate/asset/{ip} | GET | 资产上下文 |
| 报表 | /api/reports/summary | GET | 报表汇总 |
| 报表 | /api/reports/top-sources | GET | TOP攻击源 |
| 报表 | /api/reports/top-rules | GET | TOP规则 |

## 配置说明

config.js 配置项：

export const config = {
    backendUrl: 'http://127.0.0.1:8000/api',  // 后端API地址
    timeout: 30000,                            // 请求超时(ms)
    debug: true,                               // 调试模式
    pagination: {
        defaultPageSize: 20,                   // 默认每页条数
        maxPageSize: 100                       // 最大每页条数
    }
};

## 跨域问题

如果前端和后端分离部署，需要确保后端支持CORS。后端已配置允许跨域访问。


## 开发调试

开启调试模式：
在 config.js 中设置 debug: true

调试信息将输出到浏览器控制台。

手动测试后端连接：
在浏览器控制台执行 window.appConfig.testBackend()

查看API请求：
所有API请求都会在控制台输出，便于调试。

## 注意事项

本前端项目需要配合Hybrid-IDS-Backend后端服务使用，请确保后端服务正常运行后再访问前端页面。