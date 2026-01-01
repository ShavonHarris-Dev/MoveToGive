/**
 * Navigation Component
 * Handles tab navigation between pages
 */

let currentPage = 'fitness';

/**
 * Switch to a different page
 * @param {string} pageName
 */
export function switchPage(pageName) {
    currentPage = pageName;

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected page
    const pageEl = document.getElementById(`${pageName}-page`);
    if (pageEl) {
        pageEl.classList.add('active');
    }

    // Activate selected tab
    const activeTab = document.querySelector(`[data-page="${pageName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

/**
 * Initialize navigation
 */
export function initNavigation() {
    // Set up tab click handlers
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const pageName = tab.dataset.page;
            if (pageName) {
                switchPage(pageName);
            }
        });
    });

    // Show fitness page by default
    switchPage('fitness');
}
