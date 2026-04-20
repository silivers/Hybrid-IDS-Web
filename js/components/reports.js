// 报表组件
const ReportsComponent = {
    async render(container) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        
        try {
            const [summary, topSources, topRules] = await Promise.all([
                api.getReportSummary({ start_date: startDate, end_date: endDate }),
                api.getTopSources({ start_date: startDate, end_date: endDate, limit: 10 }),
                api.getTopRules({ start_date: startDate, end_date: endDate, limit: 10 })
            ]);
            
            this.renderHTML(container, summary, topSources, topRules, startDate, endDate);
            this.bindEvents(startDate, endDate);
        } catch (error) {
            container.innerHTML = `<div class="card">加载失败: ${error.message}</div>`;
        }
    },

    renderHTML(container, summary, topSources, topRules, startDate, endDate) {
        const s = summary?.summary || {};
        
        const html = `
            <div class="card">
                <div class="card-title">📅 报表时间范围</div>
                <div class="filter-bar">
                    <input type="date" id="report-start" value="${startDate}">
                    <span>至</span>
                    <input type="date" id="report-end" value="${endDate}">
                    <button id="refresh-report">生成报表</button>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">告警总数</div>
                    <div class="metric-value">${s.total_alerts || 0}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">高危告警</div>
                    <div class="metric-value" style="color:#ff4757">${s.high_count || 0} (${s.high_percentage || 0}%)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">中危告警</div>
                    <div class="metric-value" style="color:#ffa502">${s.medium_count || 0} (${s.medium_percentage || 0}%)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">低危告警</div>
                    <div class="metric-value">${s.low_count || 0} (${s.low_percentage || 0}%)</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🎯 TOP 10 攻击源</div>
                ${this.renderTopSourcesTable(topSources.top_sources || [])}
            </div>
            
            <div class="card">
                <div class="card-title">📊 TOP 10 命中规则</div>
                ${this.renderTopRulesTable(topRules.top_rules || [])}
            </div>
        `;
        
        container.innerHTML = html;
    },

    renderTopSourcesTable(sources) {
        if (!sources.length) return '<div>暂无数据</div>';
        
        return `
            <div class="table-container">
                <table>
                    <thead><tr><th>排名</th><th>攻击源IP</th><th>告警数</th><th>占比</th><th>高危</th><th>中危</th><th>低危</th><th>目标数</th></tr></thead>
                    <tbody>
                        ${sources.map((s, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong>${s.src_ip}</strong></td>
                                <td>${s.alert_count}</td>
                                <td>${s.percentage}%</td>
                                <td class="badge-high" style="color:white;">${s.high_count || 0}</td>
                                <td class="badge-medium" style="color:white;">${s.medium_count || 0}</td>
                                <td class="badge-low" style="color:white;">${s.low_count || 0}</td>
                                <td>${s.target_count || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderTopRulesTable(rules) {
        if (!rules.length) return '<div>暂无数据</div>';
        
        return `
            <div class="table-container">
                <table>
                    <thead><tr><th>排名</th><th>SID</th><th>规则消息</th><th>分类</th><th>命中次数</th><th>占比</th><th>严重程度</th></tr></thead>
                    <tbody>
                        ${rules.map((r, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong>${r.sid}</strong></td>
                                <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis;" title="${r.msg}">${r.msg || '-'}</td>
                                <td>${r.classtype || '-'}</td>
                                <td>${r.hit_count}</td>
                                <td>${r.percentage}%</td>
                                <td><span class="badge ${Utils.getSeverityClass(r.rule_severity)}">${Utils.getSeverityLabel(r.rule_severity)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    bindEvents(startDate, endDate) {
        document.getElementById('refresh-report')?.addEventListener('click', async () => {
            const start = document.getElementById('report-start').value;
            const end = document.getElementById('report-end').value;
            
            if (start && end) {
                const container = document.getElementById('view-container');
                container.innerHTML = '<div class="loading">加载中...</div>';
                
                try {
                    const [summary, topSources, topRules] = await Promise.all([
                        api.getReportSummary({ start_date: start, end_date: end }),
                        api.getTopSources({ start_date: start, end_date: end, limit: 10 }),
                        api.getTopRules({ start_date: start, end_date: end, limit: 10 })
                    ]);
                    this.renderHTML(container, summary, topSources, topRules, start, end);
                    this.bindEvents(start, end);
                } catch (error) {
                    container.innerHTML = `<div class="card">加载失败: ${error.message}</div>`;
                }
            }
        });
    }
};