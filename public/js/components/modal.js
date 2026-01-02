/**
 * Modal Component
 * Simple modal for displaying workout details
 */

// Store onClose callback
let onCloseCallback = null;

/**
 * Open modal with content
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.content
 * @param {Function} options.onClose - Optional callback when modal closes
 */
export function openModal({ title, content, onClose }) {
    const modal = document.getElementById('workoutModal');
    const modalTitle = document.getElementById('modalDate');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = content;

    // Store onClose callback
    onCloseCallback = onClose || null;

    modal.classList.add('active');
}

/**
 * Close modal
 */
export function closeModal() {
    const modal = document.getElementById('workoutModal');
    if (modal) {
        modal.classList.remove('active');

        // Call onClose callback if it exists
        if (onCloseCallback && typeof onCloseCallback === 'function') {
            onCloseCallback();
            onCloseCallback = null; // Clear callback after calling
        }
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
