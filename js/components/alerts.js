import { api } from '../api.js';
import { formatTimestamp, severityLabel, severityClass, showModal } from '../utils.js';

export async function renderAlerts(container) {
    let currentPage = 1, filters = { page_size: 20 };
    const load = async () => {
        const params = { page: currentPage, page_size: 20, sort_order: 'DESC', ...filters };
        const res = await api.alerts.list(params);
        const items = res.items, pagination = res.pagination;
        let html = `<div class="filter-bar"><input type="text" id="filterSrc" placeholder="源IP"><input type="text" id="filterDst" placeholder="目标IP"><select id="filterSev"><option value="">严重程度</option><option value="1">高</option><option value="2">中</option><option value="3">低</option></select><select id="filterProc"><option value="">处理状态</option><option value="0">未处理</option><option value="1">已处理</option></select><button class="btn btn-primary" id="applyFilter">筛选</button><button class="btn" id="batchProcessBtn">批量标记已处理</button></div><div class="table-wrapper"><table><thead><tr><th><input type="checkbox" id="selectAll"></th><th>ID</th><th>时间戳</th><th>源IP:端口</th><th>目标IP:端口</th><th>协议</th><th>严重程度</th><th>规则消息</th><th>状态</th><th>操作</th></tr></thead><tbody>`;
        for(const a of items){
            html += `<tr><td><input type="checkbox" class="alert-checkbox" value="${a.alert_id}"></td><td>${a.alert_id}</td><td>${formatTimestamp(a.timestamp)}</td><td>${a.src_ip}:${a.src_port}</td><td>${a.dst_ip}:${a.dst_port}</td><td>${a.protocol}</td><td><span class="badge-sev ${severityClass(a.severity)}">${severityLabel(a.severity)}</span></td><td>${a.msg || '-'}</td><td>${a.processed===1?'已处理':'未处理'}</td><td><button class="btn-sm btn" onclick="window.viewAlertDetail(${a.alert_id})">详情</button> ${a.processed===0?`<button class="btn-sm btn" onclick="window.markSingle(${a.alert_id})">标记处理</button>`:''}</td></tr>`;
        }
        html += `</tbody></table></div>`;
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        for(let i=1;i<=pagination.total_pages;i++){ const btn = document.createElement('button'); btn.textContent=i; btn.className=`btn btn-sm ${i===currentPage?'btn-primary':''}`; btn.onclick=()=>{currentPage=i;load();}; paginationDiv.appendChild(btn); }
        container.innerHTML = html;
        container.appendChild(paginationDiv);
        document.getElementById('applyFilter').onclick = () => { filters.src_ip = document.getElementById('filterSrc').value; filters.dst_ip = document.getElementById('filterDst').value; filters.severity = document.getElementById('filterSev').value; filters.processed = document.getElementById('filterProc').value; currentPage=1; load(); };
        document.getElementById('batchProcessBtn').onclick = async () => { const ids = [...document.querySelectorAll('.alert-checkbox:checked')].map(cb => parseInt(cb.value)); if(ids.length) await api.alerts.batchProcess(ids,1); load(); };
        document.getElementById('selectAll').onchange = (e) => document.querySelectorAll('.alert-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    window.viewAlertDetail = async (id) => { const alert = await api.alerts.detail(id); const ruleHtml = alert.rule ? `<pre>${alert.rule.rule_text || ''}</pre><div>匹配content: ${alert.matched_content}</div><div>CVE: ${alert.rule.cve_list?.join(',')||'-'}</div>` : ''; showModal(`告警 #${id}`, `<p><strong>源IP:</strong> ${alert.src_ip}:${alert.src_port}</p><p><strong>目标:</strong> ${alert.dst_ip}:${alert.dst_port}</p><p><strong>Payload预览:</strong> ${alert.payload_preview||'-'}</p><p><strong>规则完整信息:</strong></p>${ruleHtml}<p><strong>所有content条件:</strong> ${alert.rule_contents?.map(c=>c.content_pattern).join(', ')||'-'}</p>`); };
    window.markSingle = async (id) => { await api.alerts.markProcessed(id,1); load(); };
    await load();
}