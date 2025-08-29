document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');
            if (isDark) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
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

    // Mobile sidebar toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarNav = document.getElementById('sidebar-nav');
    if (mobileMenuToggle && sidebarNav) {
        mobileMenuToggle.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                sidebarNav.classList.toggle('hidden');
                sidebarNav.classList.toggle('flex');
                if (sidebarNav.classList.contains('flex')) {
                    sidebarNav.classList.add('lg:hidden');
                    sidebarNav.style.animation = 'slideInRight 0.3s ease-out';
                } else {
                    sidebarNav.classList.add('hidden');
                    sidebarNav.classList.remove('lg:hidden');
                    sidebarNav.style.animation = 'slideOutRight 0.3s ease-in';
                }
            }
        });
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                if (!mobileMenuToggle.contains(e.target) && !sidebarNav.contains(e.target)) {
                    if (sidebarNav.classList.contains('flex')) {
                        sidebarNav.classList.add('hidden');
                        sidebarNav.classList.remove('flex', 'lg:hidden');
                        sidebarNav.style.animation = 'slideOutRight 0.3s ease-in';
                    }
                }
            }
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024 && sidebarNav.classList.contains('flex')) {
                sidebarNav.classList.add('hidden');
                sidebarNav.classList.remove('flex', 'lg:hidden');
            }
        });
    }

    // Dashboard interactions (placeholders)
    document.querySelectorAll('.chat-history-card').forEach(card => {
        card.addEventListener('click', () => { window.location.href = 'Assistant.html'; });
    });
});


