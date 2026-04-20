// 工具函数
const Utils = {
    // 格式化时间
    formatTime(timestamp) {
        if (!timestamp) return '-';
        return timestamp.replace(' ', ' ').substring(0, 19);
    },

    // 获取严重程度标签
    getSeverityLabel(severity) {
        const map = { 1: '高', 2: '中', 3: '低' };
        return map[severity] || '未知';
    },

    getSeverityClass(severity) {
        const map = { 1: 'badge-high', 2: 'badge-medium', 3: 'badge-low' };
        return map[severity] || '';
    },

    // 处理状态标签
    getProcessedLabel(processed) {
        return processed === 1 ? '已处理' : '未处理';
    },

    getProcessedClass(processed) {
        return processed === 1 ? 'badge-processed' : 'badge-unprocessed';
    },

    // 显示时间
    updateCurrentTime() {
        const now = new Date();
        const timeStr = now.toLocaleString('zh-CN');
        const timeElement = document.getElementById('current-time');
        if (timeElement) timeElement.textContent = timeStr;
    },

    // 显示模态框
    showModal(title, content) {
        let modal = document.getElementById('global-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'global-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title"></h3>
                        <span class="modal-close">&times;</span>
                    </div>
                    <div id="modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.modal-close').onclick = () => modal.classList.remove('active');
        }
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        modal.classList.add('active');
    },

    // 防抖
    debounce(fn, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
};

// 定时更新时间
setInterval(Utils.updateCurrentTime, 1000);
Utils.updateCurrentTime();