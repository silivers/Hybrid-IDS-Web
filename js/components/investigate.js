import { api } from '../api.js';
import { formatTimestamp, showModal } from '../utils.js';

export async function renderInvestigate(container) {
    container.innerHTML = `
        <div class="filter-bar"><input id="srcIp" placeholder="源IP"><button id="searchSrc" class="btn btn-primary">按源IP调查</button><input id="convSrc" placeholder="源IP"><input id="convDst" placeholder="目标IP"><button id="searchConv" class="btn">对话聚合</button><input id="assetIp" placeholder="目标资产IP"><button id="assetBtn" class="btn">资产上下文</button></div>
        <div id="investigateResult"></div>
    `;
    document.getElementById('searchSrc').onclick = async () => { const src = document.getElementById('srcIp').value; if(!src) return; const data = await api.investigate.source(src, { limit: 100 }); showModal(`源IP调查: ${src}`, `<p>总告警: ${data.statistics.total_alerts}</p><p>唯一目标: ${data.statistics.unique_dst_ips}</p><p>高危/中危/低危: ${data.statistics.severity_breakdown.high}/${data.statistics.severity_breakdown.medium}/${data.statistics.severity_breakdown.low}</p><ul>${data.alerts.slice(0,20).map(a=>`<li>${formatTimestamp(a.timestamp)} ${a.dst_ip}:${a.dst_port} [${a.msg}]</li>`).join('')}</ul>`); };
    document.getElementById('searchConv').onclick = async () => { const src = document.getElementById('convSrc').value, dst = document.getElementById('convDst').value; if(!src||!dst) return; const data = await api.investigate.conversation(src, dst, { time_window_minutes:5 }); showModal(`${src} ↔ ${dst}`, `<p>总告警数: ${data.total_alerts}</p><p>时间窗口聚合数: ${data.aggregated_alerts.length}</p>`); };
    document.getElementById('assetBtn').onclick = async () => { const ip = document.getElementById('assetIp').value; if(!ip) return; const ctx = await api.investigate.asset(ip); showModal(`资产 ${ip} 上下文`, `<p>总告警: ${ctx.statistics.total_alerts}</p><p>最高严重等级: ${ctx.statistics.max_severity}</p><p>最近告警: ${formatTimestamp(ctx.statistics.last_alert)}</p><p>Top攻击者: ${ctx.top_attackers.map(a=>`${a.src_ip}(${a.alert_count})`).join(',')}</p>`); };
}