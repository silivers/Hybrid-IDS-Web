// js/app.js
import { config } from './config.js';
import { ErrorHandler } from './api.js';
import { showToast } from './utils.js';
import { renderDashboard } from './components/dashboard.js';
import { renderAlerts } from './components/alerts.js';
import { renderAssets } from './components/assets.js';
import { renderRules } from './components/rules.js';
import { renderReports } from './components/reports.js';
import { renderInvestigate } from './components/investigate.js';

let currentView = 'dashboard';
const container = document.getElementById('view-container');
const pageTitle = document.getElementById('page-title');

// 显示启动信息
console.log('[App] 前端配置:', config);

// 注册全局错误处理
ErrorHandler.onError((error) => {
    let message = error.message;
    if (error.status === 404) message = '请求的资源不存在，请检查API地址';
    if (error.status === 500) message = '服务器内部错误，请稍后重试';
    if (error.status === 400) message = '请求参数错误：' + (error.details || message);
    if (error.code === 404) message = '数据不存在';
    if (error.status === 0) message = error.message || '网络连接失败';
    showToast(message, 'error');
    console.error('[Global Error]', error);
});

const views = {
    dashboard: { title: '仪表盘', render: () => renderDashboard(container) },
    alerts: { title: '告警管理', render: () => renderAlerts(container) },
    assets: { title: '资产管理', render: () => renderAssets(container) },
    rules: { title: '规则管理', render: () => renderRules(container) },
    reports: { title: '报表与合规', render: () => renderReports(container) },
    investigate: { title: '事件调查与溯源', render: () => renderInvestigate(container) }
};

async function loadView(view) {
    currentView = view;
    pageTitle.innerText = views[view]?.title || '仪表盘';
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
    try { 
        await views[view].render(); 
    } catch(e) { 
        console.error(`[View Error] ${view}:`, e);
        container.innerHTML = `<div class="error-container" style="text-align:center;padding:60px;">
            <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#ff6b6b;margin-bottom:20px;"></i>
            <h3>加载失败</h3>
            <p>${e.message || '未知错误'}</p>
            <p style="font-size:12px;color:#888;margin-top:10px;">后端地址: ${config.backendUrl}</p>
            <button class="btn btn-primary" onclick="location.reload()">刷新页面</button>
        </div>`; 
    }
    document.querySelectorAll('.nav-item').forEach(item => { 
        if(item.dataset.view === view) item.classList.add('active'); 
        else item.classList.remove('active'); 
    });
}

// 绑定导航事件
document.querySelectorAll('.nav-item').forEach(link => { 
    link.addEventListener('click', (e) => { 
        e.preventDefault(); 
        loadView(link.dataset.view); 
    }); 
});

// 启动应用
loadView('dashboard');