// js/components/dashboard.js - 美化版
import { api } from '../api.js';
import { showToast } from '../utils.js';

export async function renderDashboard(container) {
    try {
        const data = await api.dashboard.overview(7);
        const { metrics, trend, severity_distribution, top_stats } = data;
        
        let trendData = [];
        if (trend) {
            if (Array.isArray(trend)) trendData = trend;
            else if (trend.last_24h) trendData = trend.last_24h;
            else if (trend.last_7d) trendData = trend.last_7d;
            else trendData = Object.values(trend).flat() || [];
        }
        
        const totalAlerts = metrics?.total_alerts || 0;
        const highSeverity = metrics?.high_severity || metrics?.high_severity_count || 0;
        const unprocessed = metrics?.unprocessed || metrics?.unprocessed_count || 0;
        const affectedAssets = metrics?.affected_assets || metrics?.unique_assets || 0;
        
        let severityData = [];
        if (Array.isArray(severity_distribution)) severityData = severity_distribution;
        else if (severity_distribution && typeof severity_distribution === 'object') severityData = Object.values(severity_distribution);
        
        const html = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-title"><i class="fas fa-chart-line"></i> 总告警数</div><div class="stat-value">${totalAlerts.toLocaleString()}</div></div>
                <div class="stat-card"><div class="stat-title"><i class="fas fa-exclamation-triangle" style="color:#ff8a7a;"></i> 高危告警</div><div class="stat-value" style="color:#ff8a7a;">${highSeverity.toLocaleString()}</div></div>
                <div class="stat-card"><div class="stat-title"><i class="fas fa-clock"></i> 未处理告警</div><div class="stat-value" style="color:#f5b84d;">${unprocessed.toLocaleString()}</div></div>
                <div class="stat-card"><div class="stat-title"><i class="fas fa-server"></i> 受影响资产</div><div class="stat-value">${affectedAssets}</div></div>
            </div>
            <div class="chart-row">
                <div class="chart-card"><h3><i class="fas fa-chart-line"></i> 告警趋势 (近24小时)</h3><canvas id="trendChart" height="200"></canvas>${trendData.length === 0 ? '<div class="empty-state">暂无趋势数据</div>' : ''}</div>
                <div class="chart-card"><h3><i class="fas fa-chart-pie"></i> 严重程度分布</h3><canvas id="severityChart" height="200"></canvas></div>
            </div>
            <div class="chart-row">
                <div class="chart-card"><h3><i class="fas fa-upload"></i> 攻击源IP TOP10</h3><div id="srcTable" class="table-wrapper" style="max-height:300px;overflow-y:auto;"></div></div>
                <div class="chart-card"><h3><i class="fas fa-download"></i> 目标IP TOP10</h3><div id="dstTable" class="table-wrapper" style="max-height:300px;overflow-y:auto;"></div></div>
            </div>
            <div class="chart-row">
                <div class="chart-card"><h3><i class="fas fa-bell"></i> 告警类型TOP10</h3><div id="typeTable" class="table-wrapper" style="max-height:300px;overflow-y:auto;"></div></div>
                <div class="chart-card"><h3><i class="fas fa-gavel"></i> 触发规则TOP10</h3><div id="ruleTable" class="table-wrapper" style="max-height:300px;overflow-y:auto;"></div></div>
            </div>
        `;
        container.innerHTML = html;
        
        // 趋势图
        const trendCanvas = document.getElementById('trendChart');
        if (trendCanvas && trendData.length > 0) {
            const ctx = trendCanvas.getContext('2d');
            const labels = trendData.map(t => t.time_bucket || t.date || t.time_slot || t.hour || '');
            const counts = trendData.map(t => t.count || 0);
            new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: '告警数', data: counts, borderColor: '#4f9eff', backgroundColor: 'rgba(79,158,255,0.1)', fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#b8c7e7' } } }, scales: { x: { ticks: { color: '#8ba3c9', maxRotation: 45 } }, y: { ticks: { color: '#8ba3c9' } } } } });
        }
        
        // 严重程度图
        const sevCanvas = document.getElementById('severityChart');
        if (sevCanvas && severityData.length > 0) {
            const ctx = sevCanvas.getContext('2d');
            const sevMap = { 1: '高 (严重)', 2: '中', 3: '低' };
            const sevColors = { 1: '#e74c3c', 2: '#f39c12', 3: '#3498db' };
            new Chart(ctx, { type: 'doughnut', data: { labels: severityData.map(s => sevMap[s.severity] || s.level || s.severity), datasets: [{ data: severityData.map(s => s.count), backgroundColor: severityData.map(s => sevColors[s.severity] || '#888'), borderWidth: 0 }] }, options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#b8c7e7' } } } } });
        }
        
        const renderTable = (data, columns) => {
            if (!data?.length) return '<div class="empty-state" style="padding:40px;text-align:center;">暂无数据</div>';
            return `<table><thead><tr>${columns.map(c => `<th>${c.title}</th>`).join('')}</tr></thead><tbody>${data.map(item => `<tr>${columns.map(c => `<td title="${item[c.key] || '-'}">${String(item[c.key] || '-').substring(0, 50)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        };
        
        const srcContainer = document.getElementById('srcTable');
        if (srcContainer) srcContainer.innerHTML = renderTable(top_stats?.src_ips || [], [{ key: 'src_ip', title: '源IP' }, { key: 'count', title: '告警数' }]);
        const dstContainer = document.getElementById('dstTable');
        if (dstContainer) dstContainer.innerHTML = renderTable(top_stats?.dst_ips || [], [{ key: 'dst_ip', title: '目标IP' }, { key: 'count', title: '告警数' }]);
        const typeContainer = document.getElementById('typeTable');
        if (typeContainer) typeContainer.innerHTML = renderTable(top_stats?.alert_types || [], [{ key: 'msg', title: '告警类型' }, { key: 'count', title: '次数' }]);
        const ruleContainer = document.getElementById('ruleTable');
        if (ruleContainer) ruleContainer.innerHTML = renderTable(top_stats?.rules || [], [{ key: 'sid', title: 'SID' }, { key: 'msg', title: '规则消息' }, { key: 'count', title: '命中次数' }]);
        
        showToast('仪表盘加载成功', 'success');
    } catch (error) {
        console.error('[Dashboard]', error);
        container.innerHTML = `<div class="error-container"><i class="fas fa-exclamation-triangle"></i><h3>加载失败</h3><p>${error.message}</p><button class="btn btn-primary" onclick="location.reload()">刷新页面</button></div>`;
        showToast(error.message, 'error');
    }
}