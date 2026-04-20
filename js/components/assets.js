// js/components/assets.js - 美化版
import { api } from '../api.js';
import { formatTimestamp, severityLabel, severityClass, showModal } from '../utils.js';

export async function renderAssets(container) {
    const assets = await api.assets.list({ limit: 100 });
    let html = `<div class="stats-grid"><div class="stat-card"><div class="stat-title"><i class="fas fa-server"></i> 总资产数</div><div class="stat-value">${assets.total_assets}</div></div></div><div class="table-wrapper"><table><thead><tr><th>目标IP</th><th>总告警数</th><th>最高严重等级</th><th>最近告警时间</th><th>风险分数</th><th>操作</th></tr></thead><tbody>`;
    for (const a of assets.items) {
        html += `<tr><td>${a.dst_ip}</td><td>${a.total_alerts}</td><td><span class="badge-sev ${severityClass(a.max_severity)}">${severityLabel(a.max_severity)}</span></td><td>${formatTimestamp(a.last_alert)}</td><td>${a.risk_score || 0}</td><td><button class="btn-sm btn" onclick="window.viewAssetRisk('${a.dst_ip}')">风险详情</button></td></tr>`;
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    
    window.viewAssetRisk = async (ip) => {
        const risk = await api.assets.risk(ip);
        showModal(`资产风险 - ${ip}`, `<p><strong>风险分数:</strong> ${risk.risk_score}</p><p><strong>高危告警数:</strong> ${risk.high_severity_count}</p><p><strong>攻击源:</strong> ${risk.attack_sources?.map(s => `${s.src_ip}(${s.alert_count})`).join(', ') || '无'}</p><p><strong>建议:</strong> ${risk.recommendations?.join('; ') || '无'}</p><canvas id="trendCanvas" style="margin-top:16px;"></canvas>`);
        setTimeout(() => {
            const ctx = document.getElementById('trendCanvas')?.getContext('2d');
            if (ctx && risk.alert_trend?.length) new Chart(ctx, { type: 'line', data: { labels: risk.alert_trend.map(t => t.date), datasets: [{ label: '告警趋势', data: risk.alert_trend.map(t => t.count), borderColor: '#4f9eff', backgroundColor: 'rgba(79,158,255,0.1)', fill: true }] }, options: { responsive: true } });
        }, 100);
    };
}