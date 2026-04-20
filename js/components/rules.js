// js/components/rules.js
import { api } from '../api.js';
import { showModal, showToast } from '../utils.js';

export async function renderRules(container) {
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {
        sid: '',
        msg_keyword: '',
        classtype: '',
        protocol: '',
        severity: '',
        enabled: ''
    };
    
    const load = async () => {
        try {
            // 构建查询参数
            const params = {
                page: currentPage,
                page_size: 20
            };
            
            if (currentFilters.sid) params.sid = currentFilters.sid;
            if (currentFilters.msg_keyword) params.msg_keyword = currentFilters.msg_keyword;
            if (currentFilters.classtype) params.classtype = currentFilters.classtype;
            if (currentFilters.protocol) params.protocol = currentFilters.protocol;
            if (currentFilters.severity) params.severity = currentFilters.severity;
            if (currentFilters.enabled !== '') params.enabled = currentFilters.enabled;
            
            console.log('[Rules] 加载规则列表，参数:', params);
            const res = await api.rules.list(params);
            console.log('[Rules] 响应数据:', res);
            
            const items = res.items || [];
            const pagination = res.pagination || { total: 0, total_pages: 1, page: currentPage };
            totalPages = pagination.total_pages || 1;
            
            // 构建表格HTML
            let html = `
                <div class="filter-bar">
                    <input type="text" id="filterSid" placeholder="SID" value="${currentFilters.sid}" style="width:100px;">
                    <input type="text" id="filterMsg" placeholder="消息关键词" value="${currentFilters.msg_keyword}" style="width:200px;">
                    <input type="text" id="filterClasstype" placeholder="分类" value="${currentFilters.classtype}" style="width:150px;">
                    <select id="filterProtocol" style="width:100px;">
                        <option value="">协议</option>
                        <option value="tcp" ${currentFilters.protocol === 'tcp' ? 'selected' : ''}>TCP</option>
                        <option value="udp" ${currentFilters.protocol === 'udp' ? 'selected' : ''}>UDP</option>
                        <option value="icmp" ${currentFilters.protocol === 'icmp' ? 'selected' : ''}>ICMP</option>
                        <option value="ip" ${currentFilters.protocol === 'ip' ? 'selected' : ''}>IP</option>
                    </select>
                    <select id="filterSeverity" style="width:100px;">
                        <option value="">严重程度</option>
                        <option value="1" ${currentFilters.severity === '1' ? 'selected' : ''}>高</option>
                        <option value="2" ${currentFilters.severity === '2' ? 'selected' : ''}>中</option>
                        <option value="3" ${currentFilters.severity === '3' ? 'selected' : ''}>低</option>
                    </select>
                    <select id="filterEnabled" style="width:100px;">
                        <option value="">状态</option>
                        <option value="1" ${currentFilters.enabled === '1' ? 'selected' : ''}>启用</option>
                        <option value="0" ${currentFilters.enabled === '0' ? 'selected' : ''}>禁用</option>
                    </select>
                    <button class="btn btn-primary" id="searchBtn">搜索</button>
                    <button class="btn" id="resetBtn">重置</button>
                </div>
                <div class="stats-info" style="margin-bottom: 10px; padding: 8px 16px; background: #1a1a2a; border-radius: 12px;">
                    <span>共 <strong>${pagination.total || 0}</strong> 条规则，当前第 <strong>${currentPage}</strong> / <strong>${totalPages}</strong> 页</span>
                </div>
                <div class="table-wrapper">
                    <table style="width:100%;">
                        <thead>
                            <tr>
                                <th>SID</th>
                                <th>消息</th>
                                <th>分类</th>
                                <th>协议</th>
                                <th>严重程度</th>
                                <th>启用状态</th>
                                <th>Content预览</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            if (items.length === 0) {
                html += `<tr><td colspan="8" style="text-align:center;padding:40px;">暂无规则数据</td></tr>`;
            } else {
                for (const r of items) {
                    const severityLevel = r.severity === 1 ? '高' : (r.severity === 2 ? '中' : '低');
                    const severityClass = r.severity === 1 ? 'sev-high' : (r.severity === 2 ? 'sev-med' : 'sev-low');
                    const contentPreview = r.content_preview && r.content_preview.length > 0 
                        ? r.content_preview.join(', ').substring(0, 50) + (r.content_preview.join(', ').length > 50 ? '...' : '')
                        : '-';
                    
                    html += `
                        <tr>
                            <td>${r.sid}</td>
                            <td title="${r.msg || ''}">${(r.msg || '-').substring(0, 60)}${(r.msg || '').length > 60 ? '...' : ''}</td>
                            <td>${r.classtype || '-'}</td>
                            <td>${r.protocol || '-'}</td>
                            <td><span class="badge-sev ${severityClass}">${severityLevel}</span></td>
                            <td>${r.enabled === 1 ? '<span style="color:#2ecc71;">启用</span>' : '<span style="color:#e74c3c;">禁用</span>'}</td>
                            <td title="${contentPreview}">${contentPreview}</td>
                            <td>
                                <button class="btn-sm btn" onclick="window.viewRuleDetail(${r.sid})">详情</button>
                                <button class="btn-sm btn" onclick="window.toggleRule(${r.sid}, ${r.enabled === 1 ? 0 : 1})">
                                    ${r.enabled === 1 ? '禁用' : '启用'}
                                </button>
                            </td>
                        </tr>
                    `;
                }
            }
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = html;
            
            // 添加分页控件
            if (totalPages > 1) {
                const paginationDiv = createPagination(currentPage, totalPages, (page) => {
                    currentPage = page;
                    load();
                });
                container.appendChild(paginationDiv);
            }
            
            // 绑定事件
            document.getElementById('searchBtn').onclick = () => {
                currentFilters.sid = document.getElementById('filterSid').value;
                currentFilters.msg_keyword = document.getElementById('filterMsg').value;
                currentFilters.classtype = document.getElementById('filterClasstype').value;
                currentFilters.protocol = document.getElementById('filterProtocol').value;
                currentFilters.severity = document.getElementById('filterSeverity').value;
                currentFilters.enabled = document.getElementById('filterEnabled').value;
                currentPage = 1;
                load();
            };
            
            document.getElementById('resetBtn').onclick = () => {
                currentFilters = { sid: '', msg_keyword: '', classtype: '', protocol: '', severity: '', enabled: '' };
                currentPage = 1;
                load();
            };
            
        } catch (error) {
            console.error('[Rules] 加载失败:', error);
            container.innerHTML = `<div class="error-container" style="text-align:center;padding:60px;">
                <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#ff6b6b;"></i>
                <h3>加载失败</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">重试</button>
            </div>`;
            showToast(error.message, 'error');
        }
    };
    
    // 创建分页控件
    function createPagination(current, total, onPageChange) {
        const container = document.createElement('div');
        container.className = 'pagination';
        container.style.cssText = 'display: flex; justify-content: center; gap: 8px; margin-top: 20px; flex-wrap: wrap;';
        
        // 首页
        const firstBtn = document.createElement('button');
        firstBtn.textContent = '首页';
        firstBtn.className = `btn btn-sm ${current === 1 ? 'disabled' : ''}`;
        firstBtn.disabled = current === 1;
        firstBtn.onclick = () => { if (current > 1) onPageChange(1); };
        container.appendChild(firstBtn);
        
        // 上一页
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一页';
        prevBtn.className = `btn btn-sm ${current === 1 ? 'disabled' : ''}`;
        prevBtn.disabled = current === 1;
        prevBtn.onclick = () => { if (current > 1) onPageChange(current - 1); };
        container.appendChild(prevBtn);
        
        // 页码
        const startPage = Math.max(1, current - 2);
        const endPage = Math.min(total, current + 2);
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `btn btn-sm ${i === current ? 'btn-primary' : ''}`;
            pageBtn.onclick = () => onPageChange(i);
            container.appendChild(pageBtn);
        }
        
        // 下一页
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页';
        nextBtn.className = `btn btn-sm ${current === total ? 'disabled' : ''}`;
        nextBtn.disabled = current === total;
        nextBtn.onclick = () => { if (current < total) onPageChange(current + 1); };
        container.appendChild(nextBtn);
        
        // 末页
        const lastBtn = document.createElement('button');
        lastBtn.textContent = '末页';
        lastBtn.className = `btn btn-sm ${current === total ? 'disabled' : ''}`;
        lastBtn.disabled = current === total;
        lastBtn.onclick = () => { if (current < total) onPageChange(total); };
        container.appendChild(lastBtn);
        
        // 跳转
        const jumpInput = document.createElement('input');
        jumpInput.type = 'number';
        jumpInput.placeholder = '页码';
        jumpInput.style.cssText = 'width: 70px; background: #1e1e2a; border: 1px solid #2d2d3a; border-radius: 8px; padding: 4px 8px; color: #e0e0e0;';
        jumpInput.min = 1;
        jumpInput.max = total;
        const jumpBtn = document.createElement('button');
        jumpBtn.textContent = '跳转';
        jumpBtn.className = 'btn btn-sm';
        jumpBtn.onclick = () => {
            let page = parseInt(jumpInput.value);
            if (isNaN(page)) page = 1;
            page = Math.max(1, Math.min(total, page));
            onPageChange(page);
        };
        container.appendChild(jumpInput);
        container.appendChild(jumpBtn);
        
        return container;
    }
    
    // 全局函数：查看规则详情
    window.viewRuleDetail = async (sid) => {
        try {
            showToast('加载规则详情...', 'warning');
            const rule = await api.rules.detail(sid);
            console.log('[Rules] 规则详情:', rule);
            
            const contentHtml = rule.contents && rule.contents.length > 0
                ? `<div style="margin-top:12px;">
                    <strong>Content匹配条件:</strong>
                    <table style="width:100%;margin-top:8px;font-size:12px;">
                        <thead><tr><th>模式</th><th>偏移</th><th>深度</th><th>距离</th><th>范围内</th></tr></thead>
                        <tbody>
                            ${rule.contents.map(c => `
                                <tr>
                                    <td><code>${c.content_pattern || '-'}</code></td>
                                    <td>${c.offset_val || '-'}</td>
                                    <td>${c.depth_val || '-'}</td>
                                    <td>${c.distance_val || '-'}</td>
                                    <td>${c.within_val || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
                : '<p>无content条件</p>';
            
            showModal(`规则详情 - SID: ${sid}`, `
                <div style="max-height:500px;overflow-y:auto;">
                    <p><strong>消息:</strong> ${rule.msg || '-'}</p>
                    <p><strong>分类:</strong> ${rule.classtype || '-'}</p>
                    <p><strong>协议:</strong> ${rule.protocol || '-'}</p>
                    <p><strong>严重程度:</strong> ${rule.severity === 1 ? '高' : (rule.severity === 2 ? '中' : '低')}</p>
                    <p><strong>启用状态:</strong> ${rule.enabled === 1 ? '启用' : '禁用'}</p>
                    <p><strong>参考信息:</strong> ${rule.reference || '-'}</p>
                    <div style="margin-top:12px;">
                        <strong>规则文本:</strong>
                        <pre style="background:#0a0a12;padding:12px;border-radius:8px;overflow-x:auto;font-size:11px;margin-top:8px;">${rule.rule_text || '无'}</pre>
                    </div>
                    ${contentHtml}
                </div>
            `);
        } catch (error) {
            console.error('[Rules] 获取详情失败:', error);
            showToast(`获取规则详情失败: ${error.message}`, 'error');
        }
    };
    
    // 全局函数：切换规则状态
    window.toggleRule = async (sid, enabled) => {
        try {
            const action = enabled === 1 ? '启用' : '禁用';
            showToast(`正在${action}规则...`, 'warning');
            await api.rules.toggle(sid, enabled);
            showToast(`规则 ${action}成功`, 'success');
            await load();
        } catch (error) {
            console.error('[Rules] 切换状态失败:', error);
            showToast(`操作失败: ${error.message}`, 'error');
        }
    };
    
    await load();
}
