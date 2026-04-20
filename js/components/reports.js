// js/components/reports.js - 美化版
import { api } from '../api.js';

export async function renderReports(container) {
    const summary = await api.reports.summary({ group_by: 'day' });
    const topSources = await api.reports.topSources({ limit: 10 });
    const topRules = await api.reports.topRules({ limit: 10 });
    
    const html = `<div class="stats-grid">
        <div class="stat-card"><div class="stat-title"><i class="fas fa-calendar-alt"></i> 报表周期</div><div class="stat-value" style="font-size:1rem;">${summary.period?.start || '-'} 至 ${summary.period?.end || '-'}</div></div>
        <div class="stat-card"><div class="stat-title"><i class="fas fa-chart-line"></i> 告警总数</div><div class="stat-value">${summary.summary?.total_alerts || 0}</div></div>
        <div class="stat-card"><div class="stat-title"><i class="fas fa-exclamation-triangle"></i> 高危占比</div><div class="stat-value">${summary.summary?.high_percentage || 0}%</div></div>
    </div>
    <div class="chart-row">
        <div class="chart-card"><h3><i class="fas fa-upload"></i> TOP攻击源</h3><div class="table-wrapper"><table><thead><tr><th>源IP</th><th>告警数</th><th>占比</th></tr></thead><tbody>${(topSources.top_sources || []).map(s => `<tr><td>${s.src_ip}</td><td>${s.alert_count}</td><td>${s.percentage}%</td></tr>`).join('') || '<tr><td colspan="3" style="text-align:center;">暂无数据</td></tr>'}</tbody></table></div></div>
        <div class="chart-card"><h3><i class="fas fa-gavel"></i> TOP规则命中</h3><div class="table-wrapper"><table><thead><tr><th>SID</th><th>规则消息</th><th>命中次数</th></tr></thead><tbody>${(topRules.top_rules || []).map(r => `<tr><td>${r.sid}</td><td>${(r.msg || '-').substring(0, 40)}${(r.msg || '').length > 40 ? '...' : ''}</td><td>${r.hit_count}</td></tr>`).join('') || '<tr><td colspan="3" style="text-align:center;">暂无数据</td></tr>'}</tbody></table></div></div>
    </div>`;
    container.innerHTML = html;
}