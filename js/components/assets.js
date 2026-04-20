import { api } from '../api.js';
import { formatTimestamp, severityLabel, severityClass, showModal } from '../utils.js';

export async function renderAssets(container) {
    const assets = await api.assets.list({ limit: 100 });
    let html = `<div class="stats-grid"><div class="stat-card"><div class="stat-title">总资产数</div><div class="stat-value">${assets.total_assets}</div></div></div><div class="table-wrapper"><table><thead><tr><th>目标IP</th><th>总告警数</th><th>最高严重等级</th><th>最近告警时间</th><th>风险分数</th><th>操作</th></tr></thead><tbody>`;
    for(const a of assets.items){
        html += `<tr><td>${a.dst_ip}</td><td>${a.total_alerts}</td><td><span class="badge-sev ${severityClass(a.max_severity)}">${severityLabel(a.max_severity)}</span></td><td>${formatTimestamp(a.last_alert)}</td><td>${a.risk_score||0}</td><td><button class="btn-sm btn" onclick="window.viewAssetRisk('${a.dst_ip}')">风险详情</button></td></tr>`;
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    window.viewAssetRisk = async (ip) => { const risk = await api.assets.risk(ip); showModal(`资产风险 - ${ip}`, `<p>风险分数: ${risk.risk_score}</p><p>高危告警数: ${risk.high_severity_count}</p><p>攻击源: ${risk.attack_sources.map(s=>`${s.src_ip}(${s.alert_count})`).join(', ')}</p><p>建议: ${risk.recommendations.join('; ')}</p><canvas id="trendCanvas"></canvas>`); setTimeout(()=>{ const ctx = document.getElementById('trendCanvas')?.getContext('2d'); if(ctx) new Chart(ctx, { type: 'line', data: { labels: risk.alert_trend.map(t=>t.date), datasets: [{label:'告警趋势', data: risk.alert_trend.map(t=>t.count)}] } }); },100); };
}