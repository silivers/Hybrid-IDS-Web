import { api } from '../api.js';
import { formatTimestamp, severityLabel, severityClass, showModal, showToast } from '../utils.js';

export async function renderAlerts(container) {
    let currentPage = 1, filters = { page_size: 20 };
    
    const load = async () => {
        try {
            const params = { page: currentPage, page_size: 20, sort_order: 'DESC', ...filters };
            const res = await api.alerts.list(params);
            const items = res.items, pagination = res.pagination;
            
            let html = `
                <div class="filter-bar">
                    <input type="text" id="filterSrc" placeholder="源IP" value="${filters.src_ip || ''}">
                    <input type="text" id="filterDst" placeholder="目标IP" value="${filters.dst_ip || ''}">
                    <select id="filterSev">
                        <option value="">严重程度</option>
                        <option value="1" ${filters.severity === '1' ? 'selected' : ''}>高</option>
                        <option value="2" ${filters.severity === '2' ? 'selected' : ''}>中</option>
                        <option value="3" ${filters.severity === '3' ? 'selected' : ''}>低</option>
                    </select>
                    <select id="filterProc">
                        <option value="">处理状态</option>
                        <option value="0" ${filters.processed === '0' ? 'selected' : ''}>未处理</option>
                        <option value="1" ${filters.processed === '1' ? 'selected' : ''}>已处理</option>
                    </select>
                    <button class="btn btn-primary" id="applyFilter">筛选</button>
                    <button class="btn" id="batchProcessBtn">批量标记已处理</button>
                    <button class="btn" id="refreshBtn"><i class="fas fa-sync-alt"></i> 刷新</button>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="selectAll"></th>
                                <th>ID</th><th>时间戳</th><th>源IP:端口</th><th>目标IP:端口</th>
                                <th>协议</th><th>严重程度</th><th>规则消息</th><th>状态</th><th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            if (items.length === 0) {
                html += `<tr><td colspan="10" style="text-align:center;padding:40px;">暂无告警数据</td></tr>`;
            } else {
                for(const a of items){
                    html += `<tr>
                        <td><input type="checkbox" class="alert-checkbox" value="${a.alert_id}"></td>
                        <td>${a.alert_id}</td>
                        <td>${formatTimestamp(a.timestamp)}</td>
                        <td>${a.src_ip}:${a.src_port}</td>
                        <td>${a.dst_ip}:${a.dst_port}</td>
                        <td>${a.protocol}</td>
                        <td><span class="badge-sev ${severityClass(a.severity)}">${severityLabel(a.severity)}</span></td>
                        <td title="${a.msg || ''}">${(a.msg || '-').substring(0, 50)}${(a.msg || '').length > 50 ? '...' : ''}</td>
                        <td>${a.processed === 1 ? '<span style="color:#2ecc71;">已处理</span>' : '<span style="color:#e74c3c;">未处理</span>'}</td>
                        <td>
                            <button class="btn-sm btn" onclick="window.viewAlertDetail(${a.alert_id})">详情</button>
                            ${a.processed === 0 ? `<button class="btn-sm btn" onclick="window.markSingle(${a.alert_id})">标记处理</button>` : ''}
                        </td>
                    </tr>`;
                }
            }
            html += `</tbody></table></div>`;
            container.innerHTML = html;
            
            // 添加分页
            if (pagination.total_pages > 1) {
                const paginationDiv = renderPagination(currentPage, pagination.total_pages, (page) => { currentPage = page; load(); });
                container.appendChild(paginationDiv);
            }
            
            // 绑定事件
            document.getElementById('applyFilter').onclick = () => { 
                filters.src_ip = document.getElementById('filterSrc').value;
                filters.dst_ip = document.getElementById('filterDst').value;
                filters.severity = document.getElementById('filterSev').value;
                filters.processed = document.getElementById('filterProc').value;
                currentPage = 1; 
                load(); 
            };
            document.getElementById('refreshBtn').onclick = () => { load(); };
            document.getElementById('batchProcessBtn').onclick = async () => { 
                const ids = [...document.querySelectorAll('.alert-checkbox:checked')].map(cb => parseInt(cb.value)); 
                if(ids.length === 0) {
                    showToast('请至少选择一个告警', 'warning');
                    return;
                }
                try {
                    const result = await api.alerts.batchProcess(ids, 1);
                    showToast(`成功标记 ${result.processed_count} 条告警为已处理`, 'success');
                    load(); 
                } catch(e) {
                    showToast(`批量处理失败: ${e.message}`, 'error');
                }
            };
            const selectAllCheckbox = document.getElementById('selectAll');
            if(selectAllCheckbox) {
                selectAllCheckbox.onchange = (e) => document.querySelectorAll('.alert-checkbox').forEach(cb => cb.checked = e.target.checked);
            }
        } catch(e) {
            container.innerHTML = `<div style="text-align:center;padding:60px;"><i class="fas fa-database" style="font-size:48px;color:#888;"></i><p>加载告警数据失败: ${e.message}</p><button class="btn btn-primary" onclick="location.reload()">重试</button></div>`;
        }
    };
    
    window.viewAlertDetail = async (id) => { 
        try {
            const alert = await api.alerts.detail(id); 
            const ruleHtml = alert.rule ? `
                <div style="background:#0a0a12;padding:12px;border-radius:12px;margin-top:12px;">
                    <strong>规则文本:</strong>
                    <pre style="background:#0a0a12;padding:8px;overflow-x:auto;font-size:12px;">${alert.rule.rule_text || '无'}</pre>
                    <strong>匹配的content:</strong> ${alert.matched_content || '-'}<br>
                    <strong>CVE编号:</strong> ${alert.rule.cve_list?.join(', ') || '-'}
                </div>
            ` : '<p>无规则详情</p>';
            showModal(`告警详情 #${id}`, `
                <div style="display:grid;gap:8px;">
                    <p><strong>时间:</strong> ${formatTimestamp(alert.timestamp)}</p>
                    <p><strong>源地址:</strong> ${alert.src_ip}:${alert.src_port}</p>
                    <p><strong>目标地址:</strong> ${alert.dst_ip}:${alert.dst_port}</p>
                    <p><strong>协议:</strong> ${alert.protocol}</p>
                    <p><strong>严重程度:</strong> <span class="badge-sev ${severityClass(alert.severity)}">${severityLabel(alert.severity)}</span></p>
                    <p><strong>Payload预览:</strong> ${alert.payload_preview || '-'}</p>
                    ${ruleHtml}
                    <p><strong>规则所有content条件:</strong> ${alert.rule_contents?.map(c => c.content_pattern).join(', ') || '-'}</p>
                </div>
            `);
        } catch(e) {
            showToast(`获取告警详情失败: ${e.message}`, 'error');
        }
    };
    
    window.markSingle = async (id) => { 
        try {
            await api.alerts.markProcessed(id, 1); 
            showToast(`告警 #${id} 已标记为已处理`, 'success');
            load(); 
        } catch(e) {
            showToast(`标记失败: ${e.message}`, 'error');
        }
    };
    
    await load();
}

// 分页辅助函数
function renderPagination(current, totalPages, onPage) {
    const container = document.createElement('div');
    container.className = 'pagination';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.className = `btn btn-sm ${current === 1 ? 'disabled' : ''}`;
    prevBtn.disabled = current === 1;
    prevBtn.onclick = () => { if(current > 1) onPage(current - 1); };
    container.appendChild(prevBtn);
    
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(totalPages, current + 2);
    for(let i = startPage; i <= endPage; i++) { 
        const btn = document.createElement('button'); 
        btn.textContent = i; 
        btn.className = `btn btn-sm ${i === current ? 'btn-primary' : ''}`; 
        btn.onclick = () => onPage(i); 
        container.appendChild(btn); 
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.className = `btn btn-sm ${current === totalPages ? 'disabled' : ''}`;
    nextBtn.disabled = current === totalPages;
    nextBtn.onclick = () => { if(current < totalPages) onPage(current + 1); };
    container.appendChild(nextBtn);
    return container;
}