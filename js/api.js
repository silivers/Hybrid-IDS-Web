// js/api.js - 完整修复版本
import { config, BACKEND_URL, testBackendConnection } from './config.js';

const API_BASE = BACKEND_URL;

console.log('[API] 初始化, 后端地址:', API_BASE);

// 测试后端连接（可选，会输出到控制台）
testBackendConnection().then(connected => {
    if (connected) {
        console.log('[API] ✅ 后端连接正常');
        const statusEl = document.getElementById('backend-status');
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> 后端已连接';
            statusEl.style.background = '#1a3a2a';
            statusEl.style.color = '#2ecc71';
        }
    } else {
        console.log('[API] ❌ 后端连接失败');
        const statusEl = document.getElementById('backend-status');
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 后端离线';
            statusEl.style.background = '#3a1a1a';
            statusEl.style.color = '#ff6b6b';
        }
    }
});

// 全局错误处理
export const ErrorHandler = {
    listeners: [],
    onError(callback) { this.listeners.push(callback); },
    emit(error) { this.listeners.forEach(fn => fn(error)); },
    async handleResponse(response, url) {
        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.url = url;
            this.emit(error);
            throw error;
        }
        const json = await response.json();
        if (json.code !== 200) {
            const error = new Error(json.message || `API错误 (${json.code})`);
            error.code = json.code;
            error.details = json.data;
            this.emit(error);
            throw error;
        }
        return json.data;
    }
};

async function request(endpoint, options = {}) {
    // 确保 endpoint 以 / 开头
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;
    
    if (config.debug) {
        console.log(`[API] 请求: ${options.method || 'GET'} ${url}`);
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            signal: controller.signal,
            ...options
        });
        clearTimeout(timeoutId);
        return await ErrorHandler.handleResponse(res, url);
    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error);
        
        if (error.name === 'AbortError') {
            const timeoutError = new Error(`请求超时 (${config.timeout/1000}s): ${url}`);
            ErrorHandler.emit(timeoutError);
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            const networkError = new Error(
                `无法连接到后端服务！\n` +
                `后端地址: ${API_BASE}\n` +
                `请确保:\n` +
                `1. 后端已启动: cd Hybrid-IDS-Backend && sudo python main.py\n` +
                `2. 后端端口8000已开放\n` +
                `3. 防火墙允许: sudo ufw allow 8000`
            );
            networkError.status = 0;
            ErrorHandler.emit(networkError);
        }
        throw error;
    }
}

export const api = {
    // 获取后端地址（用于调试）
    getBackendUrl: () => API_BASE,
    
    dashboard: { 
        overview: (days = 7) => request(`/dashboard/overview?days=${days}`) 
    },
    
    alerts: {
        list: (params) => {
            // 过滤掉空值参数
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/alerts?${query}` : '/alerts';
            return request(url);
        },
        detail: (id) => request(`/alerts/${id}`),
        markProcessed: (id, processed = 1) => request(`/alerts/${id}/process?processed=${processed}`, { method: 'PUT' }),
        batchProcess: (alert_ids, processed = 1) => request('/alerts/batch-process', { 
            method: 'PUT', 
            body: JSON.stringify({ alert_ids, processed }) 
        })
    },
    
    assets: { 
        list: (params) => {
            // 过滤掉空值参数
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/assets?${query}` : '/assets';
            return request(url);
        }, 
        risk: (ip) => request(`/assets/${encodeURIComponent(ip)}/risk`) 
    },
    
    rules: { 
        list: (params) => {
            // 过滤掉空值参数
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/rules?${query}` : '/rules';
            console.log('[API] 规则列表请求URL:', url);
            return request(url);
        }, 
        detail: (sid) => request(`/rules/${sid}`), 
        toggle: (sid, enabled) => request(`/rules/${sid}/toggle`, { 
            method: 'PUT', 
            body: JSON.stringify({ enabled }) 
        })
    },
    
    investigate: { 
        source: (src_ip, params) => {
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/investigate/source/${encodeURIComponent(src_ip)}?${query}` : `/investigate/source/${encodeURIComponent(src_ip)}`;
            return request(url);
        }, 
        conversation: (src_ip, dst_ip, params) => {
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/investigate/conversation?src_ip=${src_ip}&dst_ip=${dst_ip}&${query}` : `/investigate/conversation?src_ip=${src_ip}&dst_ip=${dst_ip}`;
            return request(url);
        }, 
        asset: (dst_ip) => request(`/investigate/asset/${encodeURIComponent(dst_ip)}`) 
    },
    
    reports: { 
        summary: (params) => {
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/reports/summary?${query}` : '/reports/summary';
            return request(url);
        }, 
        topSources: (params) => {
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/reports/top-sources?${query}` : '/reports/top-sources';
            return request(url);
        }, 
        topRules: (params) => {
            const filteredParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== '' && value !== null && value !== undefined) {
                    filteredParams[key] = value;
                }
            }
            const query = new URLSearchParams(filteredParams).toString();
            const url = query ? `/reports/top-rules?${query}` : '/reports/top-rules';
            return request(url);
        }
    },
    
    stats: { 
        filterOptions: () => request('/stats/filter-options'),
        classtypes: () => request('/stats/classtypes')
    }
};

// 导出后端地址供其他模块使用
export const backendUrl = API_BASE;

// 挂载到 window 以便调试
window.api = api;
window.ErrorHandler = ErrorHandler;
