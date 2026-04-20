function getCurrentHostname() { return window.location.hostname; }

function getBackendUrl() {
    const hostname = getCurrentHostname();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        return 'http://127.0.0.1:8000/api';
    }
    return `http://${hostname}:8000/api`;
}

export const config = {
    get backendUrl() { return getBackendUrl(); },
    timeout: 30000,
    debug: true,
    pagination: { defaultPageSize: 20, maxPageSize: 100 },
    charts: { colors: { high: '#e74c3c', medium: '#f39c12', low: '#3498db', primary: '#4f9eff' } }
};

export const BACKEND_URL = config.backendUrl;

if (config.debug) {
    console.log('[Config] 后端地址:', BACKEND_URL);
}

export async function testBackendConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${BACKEND_URL}/dashboard/overview?days=1`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res.ok;
    } catch { return false; }
}

window.appConfig = { backendUrl: BACKEND_URL, testBackend: testBackendConnection };