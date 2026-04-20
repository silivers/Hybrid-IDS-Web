// js/api.js - 完整修复版（保持功能，代码整洁）
import { config, BACKEND_URL, testBackendConnection } from './config.js';

const API_BASE = BACKEND_URL;
console.log('[API] 后端地址:', API_BASE);

testBackendConnection().then(connected => {
    const statusEl = document.getElementById('backend-status');
    if (statusEl) {
        if (connected) {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> 后端已连接';
            statusEl.style.background = '#1a3a2a';
            statusEl.style.color = '#2ecc71';
        } else {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 后端离线';
            statusEl.style.background = '#3a1a1a';
            statusEl.style.color = '#ff6b6b';
        }
    }
});

export const ErrorHandler = {
    listeners: [],
    onError(cb) { this.listeners.push(cb); },
    emit(err) { this.listeners.forEach(fn => fn(err)); },
    async handleResponse(res, url) {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const json = await res.json();
        if (json.code !== 200) throw new Error(json.message || `API错误 (${json.code})`);
        return json.data;
    }
};

async function request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;
    if (config.debug) console.log(`[API] ${options.method || 'GET'} ${url}`);
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, signal: controller.signal, ...options });
        clearTimeout(timeoutId);
        return await ErrorHandler.handleResponse(res, url);
    } catch (err) {
        if (err.name === 'AbortError') ErrorHandler.emit(new Error(`请求超时`));
        else if (err.message.includes('fetch')) ErrorHandler.emit(new Error(`无法连接后端: ${API_BASE}`));
        throw err;
    }
}

export const api = {
    getBackendUrl: () => API_BASE,
    dashboard: { overview: (days = 7) => request(`/dashboard/overview?days=${days}`) },
    alerts: {
        list: (params) => request(`/alerts?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_,v]) => v != null && v !== '')))}`),
        detail: (id) => request(`/alerts/${id}`),
        markProcessed: (id) => request(`/alerts/${id}/process?processed=1`, { method: 'PUT' }),
        batchProcess: (alert_ids) => request('/alerts/batch-process', { method: 'PUT', body: JSON.stringify({ alert_ids, processed: 1 }) })
    },
    assets: { list: (params) => request(`/assets?${new URLSearchParams(params)}`), risk: (ip) => request(`/assets/${encodeURIComponent(ip)}/risk`) },
    rules: { list: (params) => request(`/rules?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_,v]) => v != null && v !== '')))}`), detail: (sid) => request(`/rules/${sid}`), toggle: (sid, enabled) => request(`/rules/${sid}/toggle`, { method: 'PUT', body: JSON.stringify({ enabled }) }) },
    investigate: { source: (src_ip, params) => request(`/investigate/source/${encodeURIComponent(src_ip)}?${new URLSearchParams(params)}`), conversation: (src_ip, dst_ip, params) => request(`/investigate/conversation?src_ip=${src_ip}&dst_ip=${dst_ip}&${new URLSearchParams(params)}`), asset: (dst_ip) => request(`/investigate/asset/${encodeURIComponent(dst_ip)}`) },
    reports: { summary: (params) => request(`/reports/summary?${new URLSearchParams(params)}`), topSources: (params) => request(`/reports/top-sources?${new URLSearchParams(params)}`), topRules: (params) => request(`/reports/top-rules?${new URLSearchParams(params)}`) },
    stats: { filterOptions: () => request('/stats/filter-options'), classtypes: () => request('/stats/classtypes') }
};

window.api = api;