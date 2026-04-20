// js/components/investigate.js - 美化版
import { api } from '../api.js';
import { formatTimestamp, showModal } from '../utils.js';

export async function renderInvestigate(container) {
    container.innerHTML = `<div class="filter-bar">
        <input id="srcIp" placeholder="源IP" style="width:180px;">
        <button id="searchSrc" class="btn btn-primary">按源IP调查</button>
        <input id="convSrc" placeholder="源IP" style="width:150px;">
        <input id="convDst" placeholder="目标IP" style="width:150px;">
        <button id="searchConv" class="btn">对话聚合</button>
        <input id="assetIp" placeholder="目标资产IP" style="width:150px;">
        <button id="assetBtn" class="btn">资产上下文</button>
    </div><div id="investigateResult"></div>`;
    
    document.getElementById('searchSrc').onclick = async () => {
        const src = document.getElementById('srcIp').value;
        if (!src) { showModal('提示', '<p>请输入源IP地址</p>'); return; }
        const data = await api.investigate.source(src, { limit: 100 });
        showModal(`源IP调查: ${src}`, `<p><strong>总告警:</strong> ${data.statistics?.total_alerts || 0}</p><p><strong>唯一目标:</strong> ${data.statistics?.unique_dst_ips || 0}</p><p><strong>高危/中危/低危:</strong> ${data.statistics?.severity_breakdown?.high || 0}/${data.statistics?.severity_breakdown?.medium || 0}/${data.statistics?.severity_breakdown?.low || 0}</p><div style="max-height:400px;overflow-y:auto;"><strong>告警列表 (最近20条):</strong><ul style="margin-top:8px;">${(data.alerts || []).slice(0,20).map(a => `<li style="margin-bottom:6px;">${formatTimestamp(a.timestamp)} ${a.dst_ip}:${a.dst_port} [${a.msg}]</li>`).join('') || '<li>暂无告警</li>'}</ul></div>`);
    };
    
    document.getElementById('searchConv').onclick = async () => {
        const src = document.getElementById('convSrc').value, dst = document.getElementById('convDst').value;
        if (!src || !dst) { showModal('提示', '<p>请输入源IP和目标IP</p>'); return; }
        const data = await api.investigate.conversation(src, dst, { time_window_minutes: 5 });
        showModal(`${src} ↔ ${dst}`, `<p><strong>总告警数:</strong> ${data.total_alerts || 0}</p><p><strong>时间窗口聚合数:</strong> ${data.aggregated_alerts?.length || 0}</p>`);
    };
    
    document.getElementById('assetBtn').onclick = async () => {
        const ip = document.getElementById('assetIp').value;
        if (!ip) { showModal('提示', '<p>请输入目标资产IP</p>'); return; }
        const ctx = await api.investigate.asset(ip);
        showModal(`资产 ${ip} 上下文`, `<p><strong>总告警:</strong> ${ctx.statistics?.total_alerts || 0}</p><p><strong>最高严重等级:</strong> ${ctx.statistics?.max_severity || '-'}</p><p><strong>最近告警:</strong> ${formatTimestamp(ctx.statistics?.last_alert)}</p><p><strong>Top攻击者:</strong> ${ctx.top_attackers?.map(a => `${a.src_ip}(${a.alert_count})`).join(', ') || '无'}</p>`);
    };
}