/**
 * Badges Component
 * Renders and manages the badge/achievement system
 */

import { getAllBadges, checkAndUnlockBadges } from '../services/badge.service.js';

/**
 * Render badges section
 */
export function renderBadges() {
    const container = document.getElementById('badgesGrid');
    if (!container) return;

    const badges = getAllBadges();
    container.innerHTML = '';

    badges.forEach(badge => {
        const card = document.createElement('div');
        card.className = `badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`;

        let html = '';

        // Add "NEW" banner for newly unlocked badges
        if (badge.isNew) {
            html += '<div class="new-badge-banner">NEW!</div>';
        }

        html += `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-description">${badge.description}</div>
        `;

        // Show progress for locked badges
        if (!badge.unlocked) {
            html += `
                <div class="badge-progress">
                    ${badge.progress} / ${badge.requirement}
                </div>
            `;
        }

        card.innerHTML = html;
        container.appendChild(card);
    });
}

/**
 * Initialize badges section
 */
export function initBadges() {
    renderBadges();

    // Check for new badges
    checkAndUnlockBadges();
}
