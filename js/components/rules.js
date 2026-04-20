import { api } from '../api.js';
import { showModal } from '../utils.js';

export async function renderRules(container) {
    let page = 1;
    const load = async () => {
        const res = await api.rules.list({ page, page_size: 20 });
        let html = `<div class="filter-bar"><input id="sidFilter" placeholder="SID"><input id="msgFilter" placeholder="消息关键词"><button id="searchBtn" class="btn btn-primary">搜索</button></div><div class="table-wrapper"><table><thead><tr><th>SID</th><th>消息</th><th>分类</th><th>协议</th><th>严重程度</th><th>启用状态</th><th>Content预览</th><th>操作</th></tr></thead><tbody>`;
        for(const r of res.items){
            html += `<tr><td>${r.sid}</td><td>${r.msg||'-'}</td><td>${r.classtype||'-'}</td><td>${r.protocol||'-'}</td><td>${r.severity_level}</td><td>${r.enabled===1?'启用':'禁用'}</td><td>${r.content_preview?.join(', ')||'-'}</td><td><button class="btn-sm btn" onclick="window.viewRuleDetail(${r.sid})">详情</button> <button class="btn-sm btn" onclick="window.toggleRule(${r.sid}, ${r.enabled===1?0:1})">${r.enabled===1?'禁用':'启用'}</button></td></tr>`;
        }
        html += `</tbody></table></div>`;
        container.innerHTML = html;
        document.getElementById('searchBtn').onclick = () => { /* reload with filters */ };
    };
    window.viewRuleDetail = async (sid) => { const rule = await api.rules.detail(sid); showModal(`规则 SID:${sid}`, `<pre>${rule.rule_text}</pre><p>Reference: ${rule.reference}</p><p>CVE: ${rule.cve_list?.join(',')}</p><p>Content条件: ${rule.contents?.map(c=>`${c.content_pattern} (offset=${c.offset_val})`).join('<br>')||'-'}</p>`); };
    window.toggleRule = async (sid, enabled) => { await api.rules.toggle(sid, enabled); load(); };
    await load();
}