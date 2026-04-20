const API_BASE = '/api';  // 可配置代理地址

async function request(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    const json = await res.json();
    if (json.code !== 200) throw new Error(json.message || '请求失败');
    return json.data;
}

export const api = {
    dashboard: { overview: (days = 7) => request(`/dashboard/overview?days=${days}`) },
    alerts: {
        list: (params) => {
            const query = new URLSearchParams(params).toString();
            return request(`/alerts?${query}`);
        },
        detail: (id) => request(`/alerts/${id}`),
        markProcessed: (id, processed = 1) => request(`/alerts/${id}/process?processed=${processed}`, { method: 'PUT' }),
        batchProcess: (alert_ids, processed = 1) => request('/alerts/batch-process', { method: 'PUT', body: JSON.stringify({ alert_ids, processed }) })
    },
    assets: { list: (params) => request(`/assets?${new URLSearchParams(params)}`), risk: (ip) => request(`/assets/${encodeURIComponent(ip)}/risk`) },
    rules: { list: (params) => request(`/rules?${new URLSearchParams(params)}`), detail: (sid) => request(`/rules/${sid}`), toggle: (sid, enabled) => request(`/rules/${sid}/toggle`, { method: 'PUT', body: JSON.stringify({ enabled }) }) },
    investigate: { source: (src_ip, params) => request(`/investigate/source/${encodeURIComponent(src_ip)}?${new URLSearchParams(params)}`), conversation: (src_ip, dst_ip, params) => request(`/investigate/conversation?src_ip=${src_ip}&dst_ip=${dst_ip}&${new URLSearchParams(params)}`), asset: (dst_ip) => request(`/investigate/asset/${encodeURIComponent(dst_ip)}`) },
    reports: { summary: (params) => request(`/reports/summary?${new URLSearchParams(params)}`), topSources: (params) => request(`/reports/top-sources?${new URLSearchParams(params)}`), topRules: (params) => request(`/reports/top-rules?${new URLSearchParams(params)}`) },
    stats: { filterOptions: () => request('/stats/filter-options') }
};
window.api = api;