// js/config.js - 前端配置文件
// 用于动态检测和配置后端API地址

/**
 * 获取当前访问的主机名/IP地址
 * @returns {string} 当前访问的主机名或IP
 */
function getCurrentHostname() {
    const hostname = window.location.hostname;
    console.log('[Config] 当前访问主机名:', hostname);
    return hostname;
}

/**
 * 获取后端API基础地址
 * 自动根据前端访问地址推断后端地址（前后端在同一台机器，不同端口）
 * @returns {string} 后端API基础URL
 */
function getBackendUrl() {
    const hostname = getCurrentHostname();
    
    // 本地访问情况
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        return 'http://127.0.0.1:8000/api';
    }
    
    // 局域网访问情况 - 使用相同的IP地址，端口改为8000
    // 例如: 前端访问 http://192.168.10.41:3000，后端在 http://192.168.10.41:8000
    return `http://${hostname}:8000/api`;
}

/**
 * 手动设置后端地址（如果需要覆盖自动检测）
 * 取消注释并修改为实际的后端地址
 */
// export const MANUAL_BACKEND_URL = 'http://192.168.10.8:8000/api';

// 导出配置
export const config = {
    // 后端API地址
    get backendUrl() {
        // 如果手动设置了地址，优先使用手动地址
        // if (typeof MANUAL_BACKEND_URL !== 'undefined') return MANUAL_BACKEND_URL;
        return getBackendUrl();
    },
    
    // 请求超时时间（毫秒）
    timeout: 30000,
    
    // 是否启用调试日志
    debug: true,
    
    // 分页默认配置
    pagination: {
        defaultPageSize: 20,
        maxPageSize: 100
    },
    
    // 图表默认配置
    charts: {
        colors: {
            high: '#e74c3c',
            medium: '#f39c12',
            low: '#3498db',
            primary: '#4f9eff'
        }
    }
};

// 导出后端地址常量
export const BACKEND_URL = config.backendUrl;

// 打印配置信息
if (config.debug) {
    console.log('═══════════════════════════════════════════════');
    console.log('[Config] 前端配置信息');
    console.log('[Config] 当前页面URL:', window.location.href);
    console.log('[Config] 前端服务器:', window.location.host);
    console.log('[Config] 后端API地址:', BACKEND_URL);
    console.log('[Config] 请求超时:', config.timeout, 'ms');
    console.log('═══════════════════════════════════════════════');
}

// 可选：测试后端连接
export async function testBackendConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${BACKEND_URL}/dashboard/overview?days=1`, {
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            console.log('[Config] 后端连接测试成功:', data.code === 200 ? '正常' : '异常');
            return true;
        }
        return false;
    } catch (error) {
        console.error('[Config] 后端连接测试失败:', error.message);
        console.error('[Config] 请确保:');
        console.error('[Config]   1. 后端服务已启动: cd Hybrid-IDS-Backend && sudo python main.py');
        console.error('[Config]   2. 后端地址正确:', BACKEND_URL);
        console.error('[Config]   3. 防火墙允许8000端口: sudo ufw allow 8000');
        return false;
    }
}

// 挂载到 window 以便在控制台调试
window.appConfig = {
    backendUrl: BACKEND_URL,
    config: config,
    testBackend: testBackendConnection
};
