/**
 * Movements Page Controller
 * Manages the movements page UI and interactions
 */

import { createMovement, getMovements, joinMovement, leaveMovement, isMovementActive } from '../services/movement.service.js';
import { formatDateRange } from '../utils/formatters.js';

/**
 * Render movements list
 */
export function renderMovementsList() {
    const container = document.getElementById('movementsList');
    if (!container) return;

    const movements = getMovements();

    if (movements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌟</div>
                <h4>No movements yet</h4>
                <p>Create a movement to rally friends around a cause you care about!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    movements.forEach(movement => {
        const isMember = movement.members.includes('You');
        const isActive = isMovementActive(movement);

        const card = document.createElement('div');
        card.className = 'movement-card';

        card.innerHTML = `
            <div class="movement-header">
                <div class="movement-title">
                    ${movement.name}
                    ${isActive ? '<span class="active-badge">Active</span>' : ''}
                </div>
                <div class="movement-charity">💝 ${movement.charity}</div>
                <div class="movement-dates">
                    📅 ${formatDateRange(movement.startDate, movement.endDate)}
                </div>
            </div>

            <div class="movement-description">${movement.description}</div>

            <div class="movement-stats-grid">
                <div class="movement-stat-card">
                    <div class="movement-stat-value">${movement.members.length}</div>
                    <div class="movement-stat-label">Members</div>
                </div>
                <div class="movement-stat-card">
                    <div class="movement-stat-value">$${movement.totalRaised}</div>
                    <div class="movement-stat-label">Group Total</div>
                </div>
                <div class="movement-stat-card">
                    <div class="movement-stat-value">${Object.keys(movement.weeklyContributions || {}).length}</div>
                    <div class="movement-stat-label">Weeks</div>
                </div>
            </div>

            <div class="movement-members">
                <h5>👥 Members</h5>
                <div class="member-badges">
                    ${movement.members.map(m => `<span class="member-badge">${m}</span>`).join('')}
                </div>
            </div>

            ${isMember ?
                `<button class="leave-movement-btn" onclick="window.handleLeaveMovement(${movement.id})">Leave Movement</button>` :
                `<button class="join-movement-btn" onclick="window.handleJoinMovement(${movement.id})">Join Movement</button>`
            }
        `;

        container.appendChild(card);
    });
}

/**
 * Handle create movement
 */
export function handleCreateMovement() {
    const name = document.getElementById('movementName')?.value.trim();
    const charity = document.getElementById('movementCharity')?.value;
    const description = document.getElementById('movementDescription')?.value.trim();
    const startDate = document.getElementById('movementStart')?.value;
    const endDate = document.getElementById('movementEnd')?.value;

    if (!name || !charity || !description || !startDate || !endDate) {
        return;
    }

    const result = createMovement({
        name,
        charity,
        description,
        startDate,
        endDate
    });

    if (result.success) {
        // Clear form
        document.getElementById('movementName').value = '';
        document.getElementById('movementCharity').value = '';
        document.getElementById('movementDescription').value = '';
        document.getElementById('movementStart').value = '';
        document.getElementById('movementEnd').value = '';

        // Re-render list
        renderMovementsList();
    }
}

/**
 * Handle join movement
 * @param {string|number} movementId
 */
window.handleJoinMovement = function(movementId) {
    joinMovement(movementId);
    renderMovementsList();
};

/**
 * Handle leave movement
 * @param {string|number} movementId
 */
window.handleLeaveMovement = function(movementId) {
    if (confirm('Are you sure you want to leave this movement?')) {
        leaveMovement(movementId);
        renderMovementsList();
    }
};

/**
 * Initialize movements page
 */
export function initMovementsPage() {
    renderMovementsList();

    // Set up create movement button
    const createBtn = document.querySelector('.create-movement-btn');
    if (createBtn) {
        createBtn.addEventListener('click', handleCreateMovement);
    }

    // Set default dates (today to 30 days from now)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const startInput = document.getElementById('movementStart');
    const endInput = document.getElementById('movementEnd');

    if (startInput && !startInput.value) {
        startInput.value = today.toISOString().split('T')[0];
    }

    if (endInput && !endInput.value) {
        endInput.value = futureDate.toISOString().split('T')[0];
    }
}
