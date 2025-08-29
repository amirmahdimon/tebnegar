document.addEventListener('DOMContentLoaded', () => {
    // Theme init
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');
            if (isDark) { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
            else { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
        });
    }

    // Profile dropdown
    const profileButton = document.getElementById('profile-button');
    const profileMenu = document.getElementById('profile-menu');
    if (profileButton && profileMenu) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', () => profileMenu.classList.add('hidden'));
    }

    // Tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Bug report modal controls
    const reportBtn = document.getElementById('report-bug-btn');
    const modal = document.getElementById('bug-report-modal');
    const closeBtn = document.getElementById('close-bug-modal');
    const cancelBtn = document.getElementById('cancel-bug-report');
    if (reportBtn && modal) {
        const openModal = () => { modal.classList.remove('hidden'); };
        const closeModal = () => { modal.classList.add('hidden'); };
        reportBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        const form = document.getElementById('bug-report-form');
        if (form) form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Here you can add backend submission; for now just close
            closeModal();
        });
    }
});


