/**
 * Settings Component
 * Handles reward range settings
 */

import { updateRewardRange, getRewardRange } from '../services/workout.service.js';

/**
 * Update reward range
 */
export function handleUpdateRewardRange() {
    const minInput = document.getElementById('minReward');
    const maxInput = document.getElementById('maxReward');

    if (!minInput || !maxInput) return;

    const min = parseInt(minInput.value);
    const max = parseInt(maxInput.value);

    updateRewardRange(min, max);
}

/**
 * Initialize settings
 */
export function initSettings() {
    const range = getRewardRange();

    const minInput = document.getElementById('minReward');
    const maxInput = document.getElementById('maxReward');

    if (minInput) minInput.value = range.min;
    if (maxInput) maxInput.value = range.max;

    // Set up update button
    const updateBtn = document.querySelector('.btn-update');
    if (updateBtn) {
        updateBtn.addEventListener('click', handleUpdateRewardRange);
    }
}
