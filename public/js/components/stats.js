/**
 * Stats Component
 * Displays user statistics
 */

import { getStats } from '../services/workout.service.js';

/**
 * Update and render statistics
 */
export function updateStats() {
    const stats = getStats();

    const totalDaysEl = document.getElementById('totalDays');
    const currentStreakEl = document.getElementById('currentStreak');
    const totalEarnedEl = document.getElementById('totalEarned');

    if (totalDaysEl) totalDaysEl.textContent = stats.totalDays;
    if (currentStreakEl) currentStreakEl.textContent = stats.currentStreak;
    if (totalEarnedEl) totalEarnedEl.textContent = `$${stats.totalEarned}`;
}

/**
 * Initialize stats display
 */
export function initStats() {
    updateStats();

    // Make updateStats globally available for other components
    window.updateStats = updateStats;
}
