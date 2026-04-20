import { api } from '../api.js';
import { formatTimestamp, severityLabel } from '../utils.js';

export async function renderDashboard(container) {
    const data = await api.dashboard.overview(7);
    const { metrics, trend, severity_distribution, top_stats } = data;
    const html = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-title">总告警数</div><div class="stat-value">${metrics.total_alerts || 0}</div></div>
            <div class="stat-card"><div class="stat-title">高危告警</div><div class="stat-value">${metrics.high_severity_count || 0}</div></div>
            <div class="stat-card"><div class="stat-title">未处理告警</div><div class="stat-value">${metrics.unprocessed_count || 0}</div></div>
            <div class="stat-card"><div class="stat-title">受影响资产</div><div class="stat-value">${metrics.unique_assets || 0}</div></div>
        </div>
        <div class="chart-row"><div class="chart-card"><h3>告警趋势 (近24h)</h3><canvas id="trendChart"></canvas></div><div class="chart-card"><h3>严重程度分布</h3><canvas id="severityChart"></canvas></div></div>
        <div class="chart-row"><div class="chart-card"><h3>攻击源IP TOP10</h3><div id="srcTable"></div></div><div class="chart-card"><h3>目标IP TOP10</h3><div id="dstTable"></div></div></div>
        <div class="chart-row"><div class="chart-card"><h3>告警类型TOP10</h3><div id="typeTable"></div></div><div class="chart-card"><h3>触发规则TOP10</h3><div id="ruleTable"></div></div></div>
    `;
    container.innerHTML = html;
    // 趋势图
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, { type: 'line', data: { labels: trend.map(t => t.time_slot), datasets: [{ label: '告警数', data: trend.map(t => t.count), borderColor: '#4f9eff' }] } });
    const sevCtx = document.getElementById('severityChart').getContext('2d');
    const sevMap = {1:'高',2:'中',3:'低'};
    const sevLabels = severity_distribution.map(s => sevMap[s.severity]);
    new Chart(sevCtx, { type: 'doughnut', data: { labels: sevLabels, datasets: [{ data: severity_distribution.map(s => s.count), backgroundColor: ['#e74c3c','#f39c12','#3498db'] }] } });
    const renderList = (data, cols) => `<table>${data.map(item => `<tr>${cols.map(c => `<td>${item[c.key] || '-'}</td>`).join('')}</tr>`).join('')}</table>`;
    document.getElementById('srcTable').innerHTML = renderList(top_stats.src_ips, [{key:'src_ip'},{key:'alert_count'}]);
    document.getElementById('dstTable').innerHTML = renderList(top_stats.dst_ips, [{key:'dst_ip'},{key:'alert_count'}]);
    document.getElementById('typeTable').innerHTML = renderList(top_stats.alert_types, [{key:'msg'},{key:'count'}]);
    document.getElementById('ruleTable').innerHTML = renderList(top_stats.rules, [{key:'sid'},{key:'msg'},{key:'hit_count'}]);
}