// 告警管理组件
const AlertsComponent = {
    currentPage: 1,
    pageSize: 20,
    filters: {},
    selectedAlerts: new Set(),

    async render(container) {
        this.selectedAlerts.clear();
        await this.loadFilterOptions();
        await this.loadAlerts();
        this.renderHTML(container);
        this.bindEvents();
    },

    async loadFilterOptions() {
        try {
            this.filterOptions = await api.getFilterOptions();
        } catch (error) {
            console.error('加载筛选选项失败:', error);
            this.filterOptions = {};
        }
    },

    async loadAlerts() {
        const params = {
            page: this.currentPage,
            page_size: this.pageSize,
            ...this.filters
        };
        try {
            this.alertsData = await api.getAlerts(params);
        } catch (error) {
            console.error('加载告警失败:', error);
            this.alertsData = { items: [], pagination: { total: 0, total_pages: 0 } };
        }
    },

    renderHTML(container) {
        const items = this.alertsData?.items || [];
        const pagination = this.alertsData?.pagination || {};
        
        const html = `
            <div class="card">
                <div class="card-title">🔍 筛选条件</div>
                <div class="filter-bar" id="alert-filters">
                    <select id="filter-severity">
                        <option value="">全部等级</option>
                        ${this.renderFilterOptions(this.filterOptions.severities, 'severity', 'label')}
                    </select>
                    <select id="filter-processed">
                        <option value="">全部状态</option>
                        ${this.renderFilterOptions(this.filterOptions.processed_status, 'processed', 'label')}
                    </select>
                    <input type="text" id="filter-src-ip" placeholder="源IP" value="${this.filters.src_ip || ''}">
                    <input type="text" id="filter-dst-ip" placeholder="目标IP" value="${this.filters.dst_ip || ''}">
                    <button id="apply-filters">查询</button>
                    <button id="batch-process" class="btn-primary">批量标记已处理</button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">⚠️ 告警列表</div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th><input type="checkbox" id="select-all"></th><th>ID</th><th>时间</th><th>源IP:端口</th><th>目标IP:端口</th><th>协议</th><th>严重程度</th><th>规则消息</th><th>状态</th><th>操作</th></tr>
                        </thead>
                        <tbody>
                            ${items.map(alert => this.renderAlertRow(alert)).join('')}
                        </tbody>
                    </table>
                </div>
                ${this.renderPagination(pagination)}
            </div>
        `;
        
        container.innerHTML = html;
    },

    renderAlertRow(alert) {
        const srcPort = alert.src_port ? `:${alert.src_port}` : '';
        const dstPort = alert.dst_port ? `:${alert.dst_port}` : '';
        const isSelected = this.selectedAlerts.has(alert.alert_id);
        
        return `
            <tr>
                <td><input type="checkbox" class="alert-checkbox" data-id="${alert.alert_id}" ${isSelected ? 'checked' : ''}></td>
                <td>${alert.alert_id}</td>
                <td>${Utils.formatTime(alert.timestamp)}</td>
                <td>${alert.src_ip}${srcPort}</td>
                <td>${alert.dst_ip}${dstPort}</td>
                <td>${alert.protocol?.toUpperCase() || '-'}</td>
                <td><span class="badge ${Utils.getSeverityClass(alert.severity)}">${Utils.getSeverityLabel(alert.severity)}</span></td>
                <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis;">${alert.msg || '-'}</td>
                <td><span class="badge ${Utils.getProcessedClass(alert.processed)}">${Utils.getProcessedLabel(alert.processed)}</span></td>
                <td><button class="view-detail" data-id="${alert.alert_id}">详情</button></td>
            </tr>
        `;
    },

    renderFilterOptions(options, valueField, labelField) {
        if (!options) return '';
        return options.map(opt => `<option value="${opt[valueField]}">${opt[labelField]} (${opt.count || 0})</option>`).join('');
    },

    renderPagination(pagination) {
        if (pagination.total_pages <= 1) return '';
        
        return `
            <div class="pagination">
                <button ${!pagination.has_prev ? 'disabled' : ''} data-page="${pagination.page - 1}">上一页</button>
                <span>第 ${pagination.page} / ${pagination.total_pages} 页 (共 ${pagination.total} 条)</span>
                <button ${!pagination.has_next ? 'disabled' : ''} data-page="${pagination.page + 1}">下一页</button>
            </div>
        `;
    },

    bindEvents() {
        // 筛选
        document.getElementById('apply-filters')?.addEventListener('click', async () => {
            this.filters = {
                severity: document.getElementById('filter-severity')?.value || undefined,
                processed: document.getElementById('filter-processed')?.value || undefined,
                src_ip: document.getElementById('filter-src-ip')?.value || undefined,
                dst_ip: document.getElementById('filter-dst-ip')?.value || undefined
            };
            Object.keys(this.filters).forEach(k => !this.filters[k] && delete this.filters[k]);
            this.currentPage = 1;
            this.selectedAlerts.clear();
            await this.loadAlerts();
            this.renderHTML(document.getElementById('view-container'));
            this.bindEvents();
        });
        
        // 全选
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.alert-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const id = parseInt(cb.dataset.id);
                if (e.target.checked) this.selectedAlerts.add(id);
                else this.selectedAlerts.delete(id);
            });
        });
        
        // 单个复选框
        document.querySelectorAll('.alert-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) this.selectedAlerts.add(id);
                else this.selectedAlerts.delete(id);
            });
        });
        
        // 批量处理
        document.getElementById('batch-process')?.addEventListener('click', async () => {
            if (this.selectedAlerts.size === 0) {
                alert('请选择要处理的告警');
                return;
            }
            if (confirm(`确定要将 ${this.selectedAlerts.size} 条告警标记为已处理吗？`)) {
                await api.batchProcessAlerts(Array.from(this.selectedAlerts), 1);
                this.selectedAlerts.clear();
                await this.loadAlerts();
                this.renderHTML(document.getElementById('view-container'));
                this.bindEvents();
            }
        });
        
        // 分页
        document.querySelectorAll('.pagination button').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page)) {
                    this.currentPage = page;
                    await this.loadAlerts();
                    this.renderHTML(document.getElementById('view-container'));
                    this.bindEvents();
                }
            });
        });
        
        // 查看详情
        document.querySelectorAll('.view-detail').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(btn.dataset.id);
                await this.showDetail(id);
            });
        });
    },

    async showDetail(alertId) {
        try {
            const detail = await api.getAlertDetail(alertId);
            const content = `
                <div style="line-height:1.8;">
                    <p><strong>告警ID:</strong> ${detail.alert_id}</p>
                    <p><strong>时间:</strong> ${Utils.formatTime(detail.timestamp)}</p>
                    <p><strong>源IP:端口:</strong> ${detail.src_ip}:${detail.src_port}</p>
                    <p><strong>目标IP:端口:</strong> ${detail.dst_ip}:${detail.dst_port}</p>
                    <p><strong>协议:</strong> ${detail.protocol}</p>
                    <p><strong>严重程度:</strong> <span class="badge ${Utils.getSeverityClass(detail.severity)}">${Utils.getSeverityLabel(detail.severity)}</span></p>
                    <p><strong>匹配内容:</strong> <code>${detail.matched_content || '-'}</code></p>
                    <p><strong>Payload预览:</strong> <pre style="background:#f5f5f5; padding:10px; border-radius:6px; overflow-x:auto;">${detail.payload_preview || '-'}</pre></p>
                    ${detail.rule ? `
                        <hr>
                        <p><strong>规则消息:</strong> ${detail.rule.msg}</p>
                        <p><strong>规则分类:</strong> ${detail.rule.classtype || '-'}</p>
                        <p><strong>规则文本:</strong> <pre style="background:#f5f5f5; padding:10px; border-radius:6px; overflow-x:auto; font-size:12px;">${detail.rule.rule_text || '-'}</pre></p>
                    ` : ''}
                </div>
            `;
            Utils.showModal(`告警详情 #${alertId}`, content);
        } catch (error) {
            alert('加载详情失败: ' + error.message);
        }
    }
};