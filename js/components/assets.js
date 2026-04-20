// 资产管理组件
const AssetsComponent = {
    async render(container) {
        try {
            const data = await api.getAssets({ limit: 50 });
            this.renderHTML(container, data);
            this.bindEvents();
        } catch (error) {
            container.innerHTML = `<div class="card">加载失败: ${error.message}</div>`;
        }
    },

    renderHTML(container, data) {
        const items = data?.items || [];
        
        const html = `
            <div class="card">
                <div class="card-title">💻 受监控资产列表 (共 ${data?.total_assets || 0} 个)</div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>目标IP</th><th>告警总数</th><th>最高严重等级</th><th>最近告警时间</th><th>未处理数</th><th>风险评分</th><th>操作</th></tr>
                        </thead>
                        <tbody>
                            ${items.map(asset => this.renderAssetRow(asset)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },

    renderAssetRow(asset) {
        return `
            <tr>
                <td><strong>${asset.dst_ip}</strong></td>
                <td>${asset.total_alerts}</td>
                <td><span class="badge ${Utils.getSeverityClass(asset.max_severity)}">${asset.max_severity_level || Utils.getSeverityLabel(asset.max_severity)}</span></td>
                <td>${Utils.formatTime(asset.last_alert)}</td>
                <td>${asset.unprocessed_count || 0}</td>
                <td>${asset.risk_score ? asset.risk_score.toFixed(1) : '-'}</td>
                <td><button class="view-risk" data-ip="${asset.dst_ip}">查看风险</button></td>
            </tr>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.view-risk').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ip = btn.dataset.ip;
                await this.showRiskDetail(ip);
            });
        });
    },

    async showRiskDetail(ip) {
        try {
            const [risk, context] = await Promise.all([
                api.getAssetRisk(ip),
                api.investigateAsset(ip)
            ]);
            
            const content = `
                <div style="line-height:1.8;">
                    <h4>资产: ${ip}</h4>
                    <hr>
                    <p><strong>风险评分:</strong> <span style="font-size:1.5rem; font-weight:bold; color:#ff4757;">${risk.risk_score || '-'}</span></p>
                    <p><strong>高危告警数:</strong> ${risk.high_severity_count || 0}</p>
                    <p><strong>告警总数:</strong> ${context.statistics?.total_alerts || 0}</p>
                    <p><strong>最高严重等级:</strong> ${context.statistics?.max_severity ? Utils.getSeverityLabel(context.statistics.max_severity) : '-'}</p>
                    <p><strong>最早告警:</strong> ${Utils.formatTime(context.statistics?.first_alert)}</p>
                    <p><strong>最近告警:</strong> ${Utils.formatTime(context.statistics?.last_alert)}</p>
                    <p><strong>唯一攻击源数:</strong> ${context.statistics?.unique_attackers || 0}</p>
                    
                    <hr>
                    <h4>🎯 TOP 攻击源</h4>
                    ${this.renderAttackersTable(context.top_attackers)}
                    
                    <hr>
                    <h4>📋 规则类型分布</h4>
                    ${this.renderClasstypesTable(context.rule_type_distribution)}
                    
                    ${risk.recommendations ? `
                        <hr>
                        <h4>💡 安全建议</h4>
                        <ul>
                            ${risk.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
            
            Utils.showModal(`资产风险分析 - ${ip}`, content);
        } catch (error) {
            alert('加载风险详情失败: ' + error.message);
        }
    },

    renderAttackersTable(attackers) {
        if (!attackers || attackers.length === 0) return '<div>暂无数据</div>';
        
        return `
            <table style="width:100%; margin-top:10px;">
                <thead><tr><th>攻击源IP</th><th>告警数</th><th>高危数</th><th>最近告警</th></tr></thead>
                <tbody>
                    ${attackers.slice(0, 10).map(a => `
                        <tr>
                            <td>${a.src_ip}</td>
                            <td>${a.alert_count}</td>
                            <td>${a.high_count || 0}</td>
                            <td>${Utils.formatTime(a.last_alert)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    renderClasstypesTable(classtypes) {
        if (!classtypes || classtypes.length === 0) return '<div>暂无数据</div>';
        
        return `
            <table style="width:100%; margin-top:10px;">
                <thead><tr><th>攻击分类</th><th>告警数量</th></tr></thead>
                <tbody>
                    ${classtypes.map(c => `
                        <tr><td>${c.classtype}</td><td>${c.count}</td></tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
};