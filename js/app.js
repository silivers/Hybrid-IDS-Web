import { api } from './api.js';
import { renderDashboard } from './components/dashboard.js';
import { renderAlerts } from './components/alerts.js';
import { renderAssets } from './components/assets.js';
import { renderRules } from './components/rules.js';
import { renderReports } from './components/reports.js';
import { renderInvestigate } from './components/investigate.js';

let currentView = 'dashboard';
const container = document.getElementById('view-container');
const pageTitle = document.getElementById('page-title');

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
    container.innerHTML = '<div class="loading-spinner">加载中...</div>';
    try { await views[view].render(); } catch(e) { container.innerHTML = `<div class="error">加载失败: ${e.message}</div>`; }
    document.querySelectorAll('.nav-item').forEach(item => { if(item.dataset.view === view) item.classList.add('active'); else item.classList.remove('active'); });
}

document.querySelectorAll('.nav-item').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); loadView(link.dataset.view); }); });
loadView('dashboard');