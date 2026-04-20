// js/utils.js - 精简美化版
let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

export function showToast(message, type = 'error') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : type === 'warning' ? 'fa-clock' : 'fa-check-circle'}" style="margin-right: 10px;"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 4500);
}

export function formatTimestamp(iso) { 
    if (!iso) return '-';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
}
export function severityLabel(sev) { return {1:'高',2:'中',3:'低'}[sev] || '未知'; }
export function severityClass(sev) { return {1:'sev-high',2:'sev-med',3:'sev-low'}[sev] || ''; }

export function showModal(title, contentHtml) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><h3>${title}</h3><i class="fas fa-times" style="cursor:pointer;color:#aaa;" onclick="this.closest('.modal').remove()"></i></div><div>${contentHtml}</div><div style="margin-top:20px;text-align:right;"><button class="btn" onclick="this.closest('.modal').remove()">关闭</button></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

export function renderPagination(current, totalPages, onPage) {
    const div = document.createElement('div');
    div.className = 'pagination';
    const prev = document.createElement('button');
    prev.textContent = '‹'; prev.className = `btn btn-sm ${current === 1 ? 'disabled' : ''}`;
    prev.onclick = () => current > 1 && onPage(current - 1);
    div.appendChild(prev);
    for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
        const btn = document.createElement('button');
        btn.textContent = i; btn.className = `btn btn-sm ${i === current ? 'btn-primary' : ''}`;
        btn.onclick = () => onPage(i);
        div.appendChild(btn);
    }
    const next = document.createElement('button');
    next.textContent = '›'; next.className = `btn btn-sm ${current === totalPages ? 'disabled' : ''}`;
    next.onclick = () => current < totalPages && onPage(current + 1);
    div.appendChild(next);
    return div;
}

window.utils = { formatTimestamp, severityLabel, severityClass, showModal, renderPagination, showToast };