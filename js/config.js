// js/config.js - 前端配置

// 获取当前访问的IP地址
function getCurrentIP() {
    const hostname = window.location.hostname;
    // 如果是 localhost 或 127.0.0.1，使用 localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '127.0.0.1';
    }
    // 否则使用当前访问的IP（前端服务器IP）
    return hostname;
}

// 后端配置
// 方式1: 手动指定后端IP（如果后端在不同机器上）
// export const BACKEND_URL = 'http://192.168.10.41:8000/api';

// 方式2: 自动使用前端服务器相同IP（前后端在同一机器不同端口）
const currentIP = getCurrentIP();
export const BACKEND_URL = `http://${currentIP}:8000/api`;

// 方式3: 也可以配置多个后端地址（备用）
export const BACKUP_BACKEND_URL = null;

console.log('[Config] 前端地址:', window.location.href);
console.log('[Config] 后端地址:', BACKEND_URL);

// 导出配置
export const config = {
    backendUrl: BACKEND_URL,
    timeout: 30000,  // 30秒超时
};