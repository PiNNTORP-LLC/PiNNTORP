export function initTabs() {
    // 1. Sidebar Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const appViews = document.querySelectorAll('.app-view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetViewId = btn.getAttribute('data-view');

            // Deactivate all nav buttons and hide all views
            navBtns.forEach(b => b.classList.remove('active'));
            appViews.forEach(v => v.classList.add('hidden'));

            // Activate target
            btn.classList.add('active');
            const targetView = document.getElementById(targetViewId);
            if (targetView) targetView.classList.remove('hidden');
        });
    });

    // 2. Games Inner-Tab Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.game-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            // Deactivate all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.add('hidden'));

            // Activate target
            btn.classList.add('active');
            const targetElement = document.getElementById(targetId);
            if (targetElement) targetElement.classList.remove('hidden');
        });
    });
}
