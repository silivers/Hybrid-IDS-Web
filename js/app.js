// 应用主控制器
class App {
    constructor() {
        this.currentView = 'dashboard';
        this.components = {
            dashboard: DashboardComponent,
            alerts: AlertsComponent,
            assets: AssetsComponent,
            rules: RulesComponent,
            reports: ReportsComponent
        };
        this.init();
    }

    init() {
        this.bindNavigation();
        this.loadView('dashboard');
    }

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) {
                    this.loadView(view);
                    this.setActiveNav(item);
                }
            });
        });
    }

    setActiveNav(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
        const title = activeItem.querySelector('span:last-child')?.textContent || activeItem.dataset.view;
        document.getElementById('page-title').textContent = title;
    }

    async loadView(viewName) {
        this.currentView = viewName;
        const container = document.getElementById('view-container');
        container.innerHTML = '<div class="loading">加载中...</div>';
        
        try {
            const Component = this.components[viewName];
            if (Component) {
                await Component.render(container);
            } else {
                container.innerHTML = '<div class="card">页面不存在</div>';
            }
        } catch (error) {
            console.error('加载视图失败:', error);
            container.innerHTML = '<div class="card">加载失败，请刷新重试</div>';
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});