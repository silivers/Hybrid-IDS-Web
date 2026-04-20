// js/components/rules.js - 美化版
import { api } from '../api.js';
import { showModal, showToast } from '../utils.js';

export async function renderRules(container) {
    let currentPage = 1, totalPages = 1;
    let filters = { sid: '', msg_keyword: '', classtype: '', protocol: '', severity: '', enabled: '' };
    
    const load = async () => {
        try {
            const params = { page: currentPage, page_size: 20 };
            if (filters.sid) params.sid = filters.sid;
            if (filters.msg_keyword) params.msg_keyword = filters.msg_keyword;
            if (filters.classtype) params.classtype = filters.classtype;
            if (filters.protocol) params.protocol = filters.protocol;
            if (filters.severity) params.severity = filters.severity;
            if (filters.enabled !== '') params.enabled = filters.enabled;
            
            const res = await api.rules.list(params);
            const items = res.items || [];
            const pagination = res.pagination || { total: 0, total_pages: 1 };
            totalPages = pagination.total_pages;
            
            let html = `<div class="filter-bar">
                <input type="text" id="filterSid" placeholder="SID" value="${filters.sid}" style="width:100px;">
                <input type="text" id="filterMsg" placeholder="消息关键词" value="${filters.msg_keyword}" style="width:200px;">
                <input type="text" id="filterClasstype" placeholder="分类" value="${filters.classtype}" style="width:150px;">
                <select id="filterProtocol"><option value="">协议</option><option value="tcp" ${filters.protocol === 'tcp' ? 'selected' : ''}>TCP</option><option value="udp" ${filters.protocol === 'udp' ? 'selected' : ''}>UDP</option><option value="icmp" ${filters.protocol === 'icmp' ? 'selected' : ''}>ICMP</option></select>
                <select id="filterSeverity"><option value="">严重程度</option><option value="1" ${filters.severity === '1' ? 'selected' : ''}>高</option><option value="2" ${filters.severity === '2' ? 'selected' : ''}>中</option><option value="3" ${filters.severity === '3' ? 'selected' : ''}>低</option></select>
                <select id="filterEnabled"><option value="">状态</option><option value="1" ${filters.enabled === '1' ? 'selected' : ''}>启用</option><option value="0" ${filters.enabled === '0' ? 'selected' : ''}>禁用</option></select>
                <button class="btn btn-primary" id="searchBtn">搜索</button>
                <button class="btn" id="resetBtn">重置</button>
            </div><div class="stats-info" style="margin-bottom:12px;padding:8px 16px;background:#12141e;border-radius:16px;"><span>共 <strong>${pagination.total}</strong> 条规则，第 <strong>${currentPage}</strong> / <strong>${totalPages}</strong> 页</span></div><div class="table-wrapper"><table><thead><tr><th>SID</th><th>消息</th><th>分类</th><th>协议</th><th>严重程度</th><th>启用状态</th><th>Content预览</th><th>操作</th></tr></thead><tbody>`;
            
            if (items.length === 0) html += `<tr><td colspan="8" style="text-align:center;padding:40px;">暂无规则数据</td></tr>`;
            else for (const r of items) {
                const severityLevel = r.severity === 1 ? '高' : (r.severity === 2 ? '中' : '低');
                const severityClass = r.severity === 1 ? 'sev-high' : (r.severity === 2 ? 'sev-med' : 'sev-low');
                const contentPreview = r.content_preview?.length ? r.content_preview.join(', ').substring(0, 50) + (r.content_preview.join(', ').length > 50 ? '...' : '') : '-';
                html += `<tr><td>${r.sid}</td><td title="${r.msg || ''}">${(r.msg || '-').substring(0, 60)}${(r.msg || '').length > 60 ? '...' : ''}</td><td>${r.classtype || '-'}</td><td>${r.protocol || '-'}</td><td><span class="badge-sev ${severityClass}">${severityLevel}</span></td><td>${r.enabled === 1 ? '<span style="color:#2ecc71;">启用</span>' : '<span style="color:#ff8a7a;">禁用</span>'}</td><td title="${contentPreview}">${contentPreview}</td><td><button class="btn-sm btn" onclick="window.viewRuleDetail(${r.sid})">详情</button><button class="btn-sm btn" onclick="window.toggleRule(${r.sid}, ${r.enabled === 1 ? 0 : 1})">${r.enabled === 1 ? '禁用' : '启用'}</button></td></tr>`;
            }
            html += `</tbody></table></div>`;
            container.innerHTML = html;
            
            if (totalPages > 1) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'pagination';
                for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                    const btn = document.createElement('button');
                    btn.textContent = i;
                    btn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : ''}`;
                    btn.onclick = () => { currentPage = i; load(); };
                    paginationDiv.appendChild(btn);
                }
                container.appendChild(paginationDiv);
            }
            
            document.getElementById('searchBtn').onclick = () => {
                filters.sid = document.getElementById('filterSid').value;
                filters.msg_keyword = document.getElementById('filterMsg').value;
                filters.classtype = document.getElementById('filterClasstype').value;
                filters.protocol = document.getElementById('filterProtocol').value;
                filters.severity = document.getElementById('filterSeverity').value;
                filters.enabled = document.getElementById('filterEnabled').value;
                currentPage = 1; load();
            };
            document.getElementById('resetBtn').onclick = () => {
                filters = { sid: '', msg_keyword: '', classtype: '', protocol: '', severity: '', enabled: '' };
                currentPage = 1; load();
            };
        } catch (error) {
            container.innerHTML = `<div class="error-container"><i class="fas fa-exclamation-triangle"></i><h3>加载失败</h3><p>${error.message}</p><button class="btn btn-primary" onclick="location.reload()">重试</button></div>`;
            showToast(error.message, 'error');
        }
    };
    
    window.viewRuleDetail = async (sid) => {
        try {
            const rule = await api.rules.detail(sid);
            const contentHtml = rule.contents?.length ? `<div style="margin-top:12px;"><strong>Content匹配条件:</strong><table style="width:100%;margin-top:8px;font-size:12px;"><thead><tr><th>模式</th><th>偏移</th><th>深度</th><th>距离</th><th>范围内</th></tr></thead><tbody>${rule.contents.map(c => `<tr><td><code>${c.content_pattern || '-'}</code></td><td>${c.offset_val || '-'}</td><td>${c.depth_val || '-'}</td><td>${c.distance_val || '-'}</td><td>${c.within_val || '-'}</td></tr>`).join('')}</tbody></table></div>` : '<p>无content条件</p>';
            showModal(`规则详情 - SID: ${sid}`, `<div style="max-height:500px;overflow-y:auto;"><p><strong>消息:</strong> ${rule.msg || '-'}</p><p><strong>分类:</strong> ${rule.classtype || '-'}</p><p><strong>协议:</strong> ${rule.protocol || '-'}</p><p><strong>严重程度:</strong> ${rule.severity === 1 ? '高' : (rule.severity === 2 ? '中' : '低')}</p><p><strong>启用状态:</strong> ${rule.enabled === 1 ? '启用' : '禁用'}</p><p><strong>参考信息:</strong> ${rule.reference || '-'}</p><div style="margin-top:12px;"><strong>规则文本:</strong><pre style="background:#0c0e16;padding:12px;border-radius:12px;overflow-x:auto;font-size:11px;">${rule.rule_text || '无'}</pre></div>${contentHtml}</div>`);
        } catch (error) { showToast(`获取规则详情失败: ${error.message}`, 'error'); }
    };
    
    window.toggleRule = async (sid, enabled) => {
        try {
            const action = enabled === 1 ? '启用' : '禁用';
            await api.rules.toggle(sid, enabled);
            showToast(`规则 ${action}成功`, 'success');
            await load();
        } catch (error) { showToast(`操作失败: ${error.message}`, 'error'); }
    };
    
    await load();
}