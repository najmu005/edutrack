import './style.css'
import { setupDashboard } from './ui/Dashboard.js'
import { setupSidebar } from './ui/Sidebar.js'
import { setupNavigation } from './ui/Navigation.js'

document.querySelector('#app').innerHTML = `
  <div class="flex h-screen overflow-hidden">
    <div id="sidebar" class="w-64 bg-primary text-white flex-shrink-0 transition-all duration-300 transform -translate-x-full md:translate-x-0 fixed md:relative z-20 h-full"></div>
    
    <div class="flex-1 flex flex-col h-full overflow-hidden relative">
        <button id="mobile-menu-btn" class="md:hidden absolute top-4 left-4 z-30 text-primary p-2 bg-white rounded-md shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <header id="header" class="bg-white shadow-sm h-16 flex items-center justify-end px-8 z-10 hidden md:flex">
            <!-- Header content like user profile or breadcrumbs -->
            <div class="text-gray-500 text-sm">Welcome back, Student</div>
        </header>

        <main id="main-content" class="flex-1 overflow-y-auto p-4 md:p-8 relative">
            <!-- Dynamic Content -->
        </main>
    </div>
    
    <!-- Mobile Overlay -->
    <div id="mobile-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-10 hidden md:hidden"></div>
  </div>
`

// Initial setups
setupSidebar(document.querySelector('#sidebar'));
setupDashboard(document.querySelector('#main-content'));
setupNavigation();

// Mobile Menu Logic
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('mobile-overlay');

function toggleSidebar() {
  const isClosed = sidebar.classList.contains('-translate-x-full');
  if (isClosed) {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

mobileMenuBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);
