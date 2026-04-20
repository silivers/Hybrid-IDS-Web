// js/components/assets.js - 移除风险分数后
import { api } from '../api.js';
import { formatTimestamp, severityLabel, severityClass } from '../utils.js';

export async function renderAssets(container) {
    const assets = await api.assets.list({ limit: 100 });
    let html = `<div class="stats-grid"><div class="stat-card"><div class="stat-title"><i class="fas fa-server"></i> 总资产数</div><div class="stat-value">${assets.total_assets}</div></div></div><div class="table-wrapper"><table><thead><tr><th>目标IP</th><th>总告警数</th><th>最高严重等级</th><th>最近告警时间</th></tr></thead><tbody>`;
    for (const a of assets.items) {
        html += `<tr>
            <td>${a.dst_ip}</td>
            <td>${a.total_alerts}</td>
            <td><span class="badge-sev ${severityClass(a.max_severity)}">${severityLabel(a.max_severity)}</span></td>
            <td>${formatTimestamp(a.last_alert)}</td>
        </tr>`;
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}