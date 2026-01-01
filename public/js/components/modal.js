/**
 * Modal Component
 * Simple modal for displaying workout details
 */

/**
 * Open modal with content
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.content
 */
export function openModal({ title, content }) {
    const modal = document.getElementById('workoutModal');
    const modalTitle = document.getElementById('modalDate');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = content;

    modal.classList.add('active');
}

/**
 * Close modal
 */
export function closeModal() {
    const modal = document.getElementById('workoutModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Initialize modal
 */
export function initModal() {
    // Close modal when clicking outside
    const modal = document.getElementById('workoutModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Close modal with close button
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Make closeModal globally available
window.closeModal = closeModal;
