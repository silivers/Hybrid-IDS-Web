// 仪表盘组件
const DashboardComponent = {
    async render(container) {
        try {
            const data = await api.getDashboardOverview(7);
            this.renderHTML(container, data);
        } catch (error) {
            container.innerHTML = `<div class="card">加载失败: ${error.message}</div>`;
        }
    },

    renderHTML(container, data) {
        const { metrics, severity_distribution, top_stats } = data;
        
        const html = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">总告警数</div>
                    <div class="metric-value">${metrics.total_alerts}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">高危告警</div>
                    <div class="metric-value" style="color:#ff4757">${metrics.high_severity}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">未处理告警</div>
                    <div class="metric-value" style="color:#ffa502">${metrics.unprocessed}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">受影响资产</div>
                    <div class="metric-value">${metrics.affected_assets}</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">📊 告警等级分布</div>
                ${this.renderSeverityChart(severity_distribution)}
            </div>
            
            <div class="card">
                <div class="card-title">🎯 TOP 10 攻击源IP</div>
                ${this.renderTopList(top_stats.src_ips || [], 'src_ip', 'count')}
            </div>
            
            <div class="card">
                <div class="card-title">📍 TOP 10 目标资产</div>
                ${this.renderTopList(top_stats.dst_ips || [], 'dst_ip', 'count')}
            </div>
            
            <div class="card">
                <div class="card-title">⚠️ TOP 10 告警规则</div>
                ${this.renderTopList(top_stats.rules || [], 'msg', 'count', 'sid')}
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    renderSeverityChart(distribution) {
        if (!distribution || distribution.length === 0) {
            return '<div>暂无数据</div>';
        }
        
        const maxCount = Math.max(...distribution.map(d => d.count));
        
        return `
            <div style="display: flex; gap: 20px; justify-content: space-around;">
                ${distribution.map(item => {
                    const percent = maxCount > 0 ? (item.count / maxCount * 100) : 0;
                    const colors = { 1: '#ff4757', 2: '#ffa502', 3: '#1e90ff' };
                    return `
                        <div style="flex:1; text-align:center;">
                            <div style="margin-bottom:8px; font-weight:bold;">${item.level}</div>
                            <div style="background:#f0f0f0; height:120px; border-radius:8px; position:relative;">
                                <div style="background:${colors[item.severity] || '#0066ff'}; height:${percent}%; width:100%; position:absolute; bottom:0; border-radius:8px 8px 0 0;"></div>
                            </div>
                            <div style="margin-top:8px; font-size:1.2rem; font-weight:bold;">${item.count}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    renderTopList(list, labelField, countField, idField = null) {
        if (!list || list.length === 0) {
            return '<div>暂无数据</div>';
        }
        
        return `
            <table>
                <thead>
                    <tr><th>排名</th><th>${labelField === 'msg' ? '规则名称' : (labelField === 'src_ip' ? '源IP' : '目标IP')}</th><th>告警次数</th></tr>
                </thead>
                <tbody>
                    ${list.slice(0, 10).map((item, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${item[labelField] || '-'}</td>
                            <td><strong>${item[countField]}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
};