// 规则管理组件
const RulesComponent = {
    currentPage: 1,
    pageSize: 20,
    filters: {},

    async render(container) {
        await this.loadRules();
        this.renderHTML(container);
        this.bindEvents();
    },

    async loadRules() {
        const params = {
            page: this.currentPage,
            page_size: this.pageSize,
            ...this.filters
        };
        try {
            this.rulesData = await api.getRules(params);
        } catch (error) {
            console.error('加载规则失败:', error);
            this.rulesData = { items: [], pagination: { total: 0, total_pages: 0 } };
        }
    },

    renderHTML(container) {
        const items = this.rulesData?.items || [];
        const pagination = this.rulesData?.pagination || {};
        
        const html = `
            <div class="card">
                <div class="card-title">🔍 筛选条件</div>
                <div class="filter-bar" id="rule-filters">
                    <input type="text" id="filter-sid" placeholder="规则SID" value="${this.filters.sid || ''}" style="width:100px;">
                    <input type="text" id="filter-msg" placeholder="规则关键词" value="${this.filters.msg_keyword || ''}">
                    <select id="filter-severity">
                        <option value="">全部等级</option>
                        <option value="1" ${this.filters.severity === '1' ? 'selected' : ''}>高</option>
                        <option value="2" ${this.filters.severity === '2' ? 'selected' : ''}>中</option>
                        <option value="3" ${this.filters.severity === '3' ? 'selected' : ''}>低</option>
                    </select>
                    <select id="filter-enabled">
                        <option value="">全部状态</option>
                        <option value="1" ${this.filters.enabled === '1' ? 'selected' : ''}>启用</option>
                        <option value="0" ${this.filters.enabled === '0' ? 'selected' : ''}>禁用</option>
                    </select>
                    <button id="apply-filters">查询</button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">📜 Snort规则列表 (共 ${pagination.total || 0} 条)</div>
                <div class="table-container">
                    <table style="font-size:0.85rem;">
                        <thead>
                            <tr><th>SID</th><th>规则消息</th><th>分类</th><th>协议</th><th>严重程度</th><th>状态</th><th>匹配内容</th><th>操作</th></tr>
                        </thead>
                        <tbody>
                            ${items.map(rule => this.renderRuleRow(rule)).join('')}
                        </tbody>
                    </table>
                </div>
                ${this.renderPagination(pagination)}
            </div>
        `;
        
        container.innerHTML = html;
    },

    renderRuleRow(rule) {
        const contentPreview = rule.content_preview?.slice(0, 3).join(', ') || '-';
        
        return `
            <tr>
                <td><strong>${rule.sid}</strong></td>
                <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis;" title="${rule.msg}">${rule.msg || '-'}</td>
                <td>${rule.classtype || '-'}</td>
                <td>${rule.protocol?.toUpperCase() || '-'}</td>
                <td><span class="badge ${Utils.getSeverityClass(rule.severity)}">${Utils.getSeverityLabel(rule.severity)}</span></td>
                <td><span class="badge ${rule.enabled === 1 ? 'badge-processed' : 'badge-unprocessed'}">${rule.enabled === 1 ? '启用' : '禁用'}</span></td>
                <td style="max-width:150px; font-size:0.75rem; color:#666;">${contentPreview}</td>
                <td><button class="toggle-rule" data-sid="${rule.sid}" data-enabled="${rule.enabled}">${rule.enabled === 1 ? '禁用' : '启用'}</button>
                       <button class="view-rule" data-sid="${rule.sid}" style="margin-left:5px;">详情</button></td>
            </tr>
        `;
    },

    renderPagination(pagination) {
        if (pagination.total_pages <= 1) return '';
        
        return `
            <div class="pagination">
                <button ${!pagination.has_prev ? 'disabled' : ''} data-page="${pagination.page - 1}">上一页</button>
                <span>第 ${pagination.page} / ${pagination.total_pages} 页</span>
                <button ${!pagination.has_next ? 'disabled' : ''} data-page="${pagination.page + 1}">下一页</button>
            </div>
        `;
    },

    bindEvents() {
        // 筛选
        document.getElementById('apply-filters')?.addEventListener('click', async () => {
            this.filters = {
                sid: document.getElementById('filter-sid')?.value || undefined,
                msg_keyword: document.getElementById('filter-msg')?.value || undefined,
                severity: document.getElementById('filter-severity')?.value || undefined,
                enabled: document.getElementById('filter-enabled')?.value || undefined
            };
            Object.keys(this.filters).forEach(k => !this.filters[k] && delete this.filters[k]);
            this.currentPage = 1;
            await this.loadRules();
            this.renderHTML(document.getElementById('view-container'));
            this.bindEvents();
        });
        
        // 分页
        document.querySelectorAll('.pagination button').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page)) {
                    this.currentPage = page;
                    await this.loadRules();
                    this.renderHTML(document.getElementById('view-container'));
                    this.bindEvents();
                }
            });
        });
        
        // 启用/禁用
        document.querySelectorAll('.toggle-rule').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const sid = parseInt(btn.dataset.sid);
                const currentEnabled = parseInt(btn.dataset.enabled);
                const newEnabled = currentEnabled === 1 ? 0 : 1;
                
                if (confirm(`确定要${newEnabled === 1 ? '启用' : '禁用'}规则 ${sid} 吗？`)) {
                    await api.toggleRule(sid, newEnabled);
                    await this.loadRules();
                    this.renderHTML(document.getElementById('view-container'));
                    this.bindEvents();
                }
            });
        });
        
        // 查看详情
        document.querySelectorAll('.view-rule').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const sid = parseInt(btn.dataset.sid);
                await this.showDetail(sid);
            });
        });
    },

    async showDetail(sid) {
        try {
            const rule = await api.getRuleDetail(sid);
            
            const content = `
                <div style="line-height:1.8;">
                    <p><strong>SID:</strong> ${rule.sid}</p>
                    <p><strong>消息:</strong> ${rule.msg}</p>
                    <p><strong>分类:</strong> ${rule.classtype}</p>
                    <p><strong>协议:</strong> ${rule.protocol}</p>
                    <p><strong>源地址:</strong> ${rule.source_ip}:${rule.source_port}</p>
                    <p><strong>目标地址:</strong> ${rule.dest_ip}:${rule.dest_port}</p>
                    <p><strong>严重程度:</strong> <span class="badge ${Utils.getSeverityClass(rule.severity)}">${Utils.getSeverityLabel(rule.severity)}</span></p>
                    <p><strong>版本:</strong> ${rule.rev}</p>
                    ${rule.reference ? `<p><strong>参考链接:</strong> ${rule.reference}</p>` : ''}
                    
                    <hr>
                    <h4>📝 匹配条件 (Content)</h4>
                    ${this.renderContentsTable(rule.contents)}
                    
                    <hr>
                    <h4>📄 完整规则文本</h4>
                    <pre style="background:#f5f5f5; padding:12px; border-radius:6px; overflow-x:auto; font-size:12px; font-family:monospace;">${rule.rule_text || '无'}</pre>
                </div>
            `;
            
            Utils.showModal(`规则详情 - SID: ${sid}`, content);
        } catch (error) {
            alert('加载规则详情失败: ' + error.message);
        }
    },

    renderContentsTable(contents) {
        if (!contents || contents.length === 0) return '<div>无匹配条件</div>';
        
        return `
            <table style="width:100%; margin-top:10px; font-size:0.85rem;">
                <thead>
                    <tr><th>顺序</th><th>匹配模式</th><th>类型</th><th>偏移</th><th>深度</th><th>距离</th><th>范围内</th></tr>
                </thead>
                <tbody>
                    ${contents.map(c => `
                        <tr>
                            <td>${c.position_order}</td>
                            <td><code>${c.content_pattern}</code></td>
                            <td>${c.content_type}</td>
                            <td>${c.offset_val ?? '-'}</td>
                            <td>${c.depth_val ?? '-'}</td>
                            <td>${c.distance_val ?? '-'}</td>
                            <td>${c.within_val ?? '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
};