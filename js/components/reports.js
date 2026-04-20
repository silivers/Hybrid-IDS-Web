import { api } from '../api.js';

export async function renderReports(container) {
    const summary = await api.reports.summary({ group_by: 'day' });
    const topSources = await api.reports.topSources({ limit: 10 });
    const topRules = await api.reports.topRules({ limit: 10 });
    const html = `
        <div class="stats-grid"><div class="stat-card"><div class="stat-title">报表周期</div><div class="stat-value">${summary.period.start} 至 ${summary.period.end}</div></div><div class="stat-card"><div class="stat-title">告警总数</div><div class="stat-value">${summary.summary.total_alerts}</div></div><div class="stat-card"><div class="stat-title">高危占比</div><div class="stat-value">${summary.summary.high_percentage||0}%</div></div></div>
        <div class="chart-card"><h3>TOP攻击源</h3><div id="srcReport"></div></div>
        <div class="chart-card"><h3>TOP规则命中</h3><div id="ruleReport"></div></div>
    `;
    container.innerHTML = html;
    document.getElementById('srcReport').innerHTML = `<table>${topSources.top_sources.map(s=>`<tr><td>${s.src_ip}</td><td>${s.alert_count}</td><td>${s.percentage}%</td></tr>`).join('')}</table>`;
    document.getElementById('ruleReport').innerHTML = `<table>${topRules.top_rules.map(r=>`<tr><td>SID ${r.sid}</td><td>${r.msg||'-'}</td><td>${r.hit_count}</td></tr>`).join('')}</table>`;
}