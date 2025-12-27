import { setupDashboard } from './Dashboard.js';
import { setupSemesterForm } from './SemesterForm.js';
import { setupAnalytics } from './AnalyticsView.js';
import { setupAttendanceView } from './AttendanceView.js';

export function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });
}

export function navigateTo(page, params = {}) {
    const mainContent = document.getElementById('main-content');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');

    // Close mobile menu if open
    if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }

    // Simple router
    switch (page) {
        case 'dashboard':
            setupDashboard(mainContent);
            break;
        case 'add-marks':
            // Pass params to setupSemesterForm (e.g. { editIndex: 1 })
            setupSemesterForm(mainContent, params);
            break;
        case 'analytics':
            setupAnalytics(mainContent);
            break;
        case 'attendance':
            setupAttendanceView(mainContent);
            break;
        case 'settings':
            mainContent.innerHTML = '<h2 class="text-3xl font-bold mb-6">Settings</h2><p class="text-gray-600">Settings page coming soon...</p>';
            break;
    }
}
