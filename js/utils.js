// 错误提示组件
let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

export function showToast(message, type = 'error') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'error' ? '#5a1e1e' : type === 'warning' ? '#5a3e1a' : '#1a3a3a'};
        color: ${type === 'error' ? '#ff8888' : type === 'warning' ? '#ffcc88' : '#88ff88'};
        padding: 12px 20px;
        border-radius: 12px;
        border-left: 4px solid ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa44' : '#44ff44'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 0.9rem;
        max-width: 350px;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(8px);
        background: rgba(30,30,40,0.95);
    `;
    toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : type === 'warning' ? 'fa-clock' : 'fa-check-circle'}" style="margin-right: 10px;"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

export function formatTimestamp(iso) { 
    if (!iso) return '-'; 
    try {
        const d = new Date(iso); 
        return d.toLocaleString(); 
    } catch(e) { return iso; }
}

export function severityLabel(sev) { 
    const map = {1:'高',2:'中',3:'低'};
    return map[sev] || '未知'; 
}

export function severityClass(sev) { 
    const map = {1:'sev-high',2:'sev-med',3:'sev-low'};
    return map[sev] || ''; 
}

export function showModal(title, contentHtml) { 
    let modal = document.createElement('div'); 
    modal.className = 'modal'; 
    modal.innerHTML = `
        <div class="modal-content">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="margin:0;">${title}</h3>
                <i class="fas fa-times" style="cursor:pointer;color:#888;" onclick="this.closest('.modal').remove()"></i>
            </div>
            <div>${contentHtml}</div>
            <div style="margin-top:20px;text-align:right;">
                <button class="btn" onclick="this.closest('.modal').remove()">关闭</button>
            </div>
        </div>
    `; 
    document.body.appendChild(modal); 
    modal.addEventListener('click', (e) => { 
        if(e.target === modal) modal.remove(); 
    }); 
}

export function renderPagination(current, totalPages, onPage) { 
    const container = document.createElement('div'); 
    container.className = 'pagination'; 
    // 上一页
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.className = `btn btn-sm ${current === 1 ? 'disabled' : ''}`;
    prevBtn.disabled = current === 1;
    prevBtn.onclick = () => { if(current > 1) onPage(current - 1); };
    container.appendChild(prevBtn);
    
    // 页码
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(totalPages, current + 2);
    for(let i = startPage; i <= endPage; i++) { 
        const btn = document.createElement('button'); 
        btn.textContent = i; 
        btn.className = `btn btn-sm ${i === current ? 'btn-primary' : ''}`; 
        btn.onclick = () => onPage(i); 
        container.appendChild(btn); 
    }
    
    // 下一页
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.className = `btn btn-sm ${current === totalPages ? 'disabled' : ''}`;
    nextBtn.disabled = current === totalPages;
    nextBtn.onclick = () => { if(current < totalPages) onPage(current + 1); };
    container.appendChild(nextBtn);
    
    return container; 
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    .btn.disabled, .btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;
document.head.appendChild(style);

window.utils = { formatTimestamp, severityLabel, severityClass, showModal, renderPagination, showToast };