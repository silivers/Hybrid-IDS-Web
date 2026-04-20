// API 基础配置
const API_BASE = 'http://localhost:8000/api';

class API {
    constructor() {
        this.baseURL = API_BASE;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '请求失败');
            }
            return result.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // 仪表盘
    getDashboardOverview(days = 7) {
        return this.request(`/dashboard/overview?days=${days}`);
    }

    // 告警管理
    getAlerts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/alerts${query ? '?' + query : ''}`);
    }

    getAlertDetail(alertId) {
        return this.request(`/alerts/${alertId}`);
    }

    processAlert(alertId, processed = 1) {
        return this.request(`/alerts/${alertId}/process`, {
            method: 'PUT',
            body: JSON.stringify({ processed })
        });
    }

    batchProcessAlerts(alertIds, processed = 1) {
        return this.request('/alerts/batch-process', {
            method: 'PUT',
            body: JSON.stringify({ alert_ids: alertIds, processed })
        });
    }

    // 资产管理
    getAssets(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/assets${query ? '?' + query : ''}`);
    }

    getAssetRisk(dstIp) {
        return this.request(`/assets/${encodeURIComponent(dstIp)}/risk`);
    }

    // 事件调查
    investigateSource(srcIp, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/investigate/source/${encodeURIComponent(srcIp)}${query ? '?' + query : ''}`);
    }

    investigateConversation(srcIp, dstIp, params = {}) {
        const query = new URLSearchParams({ src_ip: srcIp, dst_ip: dstIp, ...params }).toString();
        return this.request(`/investigate/conversation?${query}`);
    }

    investigateAsset(dstIp) {
        return this.request(`/investigate/asset/${encodeURIComponent(dstIp)}`);
    }

    // 规则管理
    getRules(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/rules${query ? '?' + query : ''}`);
    }

    getRuleDetail(sid) {
        return this.request(`/rules/${sid}`);
    }

    toggleRule(sid, enabled) {
        return this.request(`/rules/${sid}/toggle`, {
            method: 'PUT',
            body: JSON.stringify({ enabled })
        });
    }

    // 报表
    getReportSummary(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/reports/summary${query ? '?' + query : ''}`);
    }

    getTopSources(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/reports/top-sources${query ? '?' + query : ''}`);
    }

    getTopRules(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/reports/top-rules${query ? '?' + query : ''}`);
    }

    // 统计辅助
    getFilterOptions() {
        return this.request('/stats/filter-options');
    }
}

const api = new API();