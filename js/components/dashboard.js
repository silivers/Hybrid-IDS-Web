// js/components/dashboard.js - 修复空白问题
import { api } from '../api.js';
import { showToast } from '../utils.js';

export async function renderDashboard(container) {
    try {
        const data = await api.dashboard.overview(7);
        const { metrics, severity_distribution, top_stats } = data;
        
        const totalAlerts = metrics?.total_alerts || 0;
        const highSeverity = metrics?.high_severity || metrics?.high_severity_count || 0;
        const unprocessed = metrics?.unprocessed || metrics?.unprocessed_count || 0;
        const affectedAssets = metrics?.affected_assets || metrics?.unique_assets || 0;
        
        let severityData = [];
        if (Array.isArray(severity_distribution)) severityData = severity_distribution;
        else if (severity_distribution && typeof severity_distribution === 'object') severityData = Object.values(severity_distribution);
        
        const html = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-title"><i class="fas fa-chart-line"></i> 总告警数</div><div class="stat-value">${totalAlerts}</div></div>
                <div class="stat-card"><div class="stat-title"><i class="fas fa-exclamation-triangle" style="color:#ff8a7a;"></i> 高危告警</div><div class="stat-value" style="color:#ff8a7a;">${highSeverity}</div></div>
                <div class="stat-card"><div class="stat-title"><i class="fas fa-clock"></i> 未处理告警</div><div class="stat-value" style="color:#f5b84d;">${unprocessed}</div></div>
                <div class="stat-card"><div class="stat-title"><i class="fas fa-server"></i> 受影响资产</div><div class="stat-value">${affectedAssets}</div></div>
            </div>
            <div class="severity-section" style="display: flex; justify-content: center; margin-bottom: 28px;">
                <div class="chart-card" style="max-width: 350px; width: 100%; text-align: center;">
                    <h3><i class="fas fa-chart-pie"></i> 严重程度分布</h3>
                    <div style="display: flex; justify-content: center; align-items: center; height: 220px;">
                        <canvas id="severityChart" width="180" height="180" style="max-width: 180px; max-height: 180px;"></canvas>
                    </div>
                </div>
            </div>
            <div class="tables-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
                <div class="chart-card">
                    <h3><i class="fas fa-upload"></i> 攻击源IP TOP10</h3>
                    <div class="table-wrapper" style="max-height: 350px; overflow-y: auto;">
                        ${renderTable(top_stats?.src_ips || [], [{ key: 'src_ip', title: '源IP' }, { key: 'count', title: '告警数' }])}
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-download"></i> 目标IP TOP10</h3>
                    <div class="table-wrapper" style="max-height: 350px; overflow-y: auto;">
                        ${renderTable(top_stats?.dst_ips || [], [{ key: 'dst_ip', title: '目标IP' }, { key: 'count', title: '告警数' }])}
                    </div>
                </div>
            </div>
            <div class="tables-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div class="chart-card">
                    <h3><i class="fas fa-bell"></i> 告警类型TOP10</h3>
                    <div class="table-wrapper" style="max-height: 350px; overflow-y: auto;">
                        ${renderTable(top_stats?.alert_types || [], [{ key: 'msg', title: '告警类型' }, { key: 'count', title: '次数' }])}
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-gavel"></i> 触发规则TOP10</h3>
                    <div class="table-wrapper" style="max-height: 350px; overflow-y: auto;">
                        ${renderTable(top_stats?.rules || [], [{ key: 'sid', title: 'SID' }, { key: 'msg', title: '规则消息' }, { key: 'count', title: '命中次数' }])}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
        
        // 严重程度分布图
        const sevCanvas = document.getElementById('severityChart');
        if (sevCanvas && severityData.length > 0) {
            const ctx = sevCanvas.getContext('2d');
            const sevMap = { 1: '高', 2: '中', 3: '低' };
            const sevColors = { 1: '#e74c3c', 2: '#f39c12', 3: '#3498db' };
            new Chart(ctx, { 
                type: 'doughnut', 
                data: { 
                    labels: severityData.map(s => sevMap[s.severity] || s.level || s.severity), 
                    datasets: [{ 
                        data: severityData.map(s => s.count), 
                        backgroundColor: severityData.map(s => sevColors[s.severity] || '#888'), 
                        borderWidth: 0 
                    }] 
                }, 
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    cutout: '50%',
                    plugins: { 
                        legend: { 
                            position: 'bottom', 
                            labels: { color: '#b8c7e7', font: { size: 11 } } 
                        } 
                    } 
                } 
            });
        }
        
        showToast('仪表盘加载成功', 'success');
    } catch (error) {
        console.error('[Dashboard]', error);
        container.innerHTML = `<div class="error-container"><i class="fas fa-exclamation-triangle"></i><h3>加载失败</h3><p>${error.message}</p><button class="btn btn-primary" onclick="location.reload()">刷新页面</button></div>`;
        showToast(error.message, 'error');
    }
}

function renderTable(data, columns) {
    if (!data?.length) return '<div style="padding: 40px; text-align: center; color: #8ba3c9;">暂无数据</div>';
    return `<table style="width: 100%;">
        <thead>
            <tr>${columns.map(c => `<th style="text-align: left; padding: 12px 16px;">${c.title}</th>`).join('')}</tr>
        </thead>
        <tbody>
            ${data.map(item => `
                <tr>
                    ${columns.map(c => `<td style="padding: 10px 16px; border-bottom: 1px solid rgba(79,158,255,0.1);" title="${item[c.key] || '-'}">${String(item[c.key] || '-').substring(0, 50)}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>`;
}
