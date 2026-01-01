/**
 * Badge Service
 * Handles achievement badges with localStorage fallback and Supabase integration
 */

import supabase from '../config/supabase.js';
import { storage, createConfetti, showToast } from '../utils/helpers.js';
import { getTotalCompletedDays, getTotalEarnings, getCurrentStreak } from './workout.service.js';

const STORAGE_KEY = 'walktogive_data';

// Badge definitions
export const BADGE_DEFINITIONS = [
    {
        id: 'first_day',
        name: 'First Step',
        icon: '🌱',
        description: 'Complete your first workout',
        requirement: 1,
        type: 'days'
    },
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        icon: '💪',
        description: 'Complete your first full week',
        requirement: 1,
        type: 'weeks'
    },
    {
        id: 'streak_starter',
        name: 'Streak Starter',
        icon: '🔥',
        description: 'Maintain a 3-week streak',
        requirement: 3,
        type: 'streak'
    },
    {
        id: 'consistent_champion',
        name: 'Consistent Champion',
        icon: '⭐',
        description: 'Maintain a 6-week streak',
        requirement: 6,
        type: 'streak'
    },
    {
        id: 'unstoppable',
        name: 'Unstoppable Force',
        icon: '🚀',
        description: 'Maintain a 12-week streak',
        requirement: 12,
        type: 'streak'
    },
    {
        id: 'month_master',
        name: 'Month Master',
        icon: '📅',
        description: 'Complete 30 total days',
        requirement: 30,
        type: 'days'
    },
    {
        id: 'hundred_club',
        name: '100 Club',
        icon: '💯',
        description: 'Complete 100 total days',
        requirement: 100,
        type: 'days'
    },
    {
        id: 'charity_champion',
        name: 'Charity Champion',
        icon: '❤️',
        description: 'Earn $50 for charity',
        requirement: 50,
        type: 'earnings'
    },
    {
        id: 'generous_giver',
        name: 'Generous Giver',
        icon: '🎁',
        description: 'Earn $100 for charity',
        requirement: 100,
        type: 'earnings'
    },
    {
        id: 'movement_maker',
        name: 'Movement Maker',
        icon: '🌟',
        description: 'Create your first Movement',
        requirement: 1,
        type: 'movements'
    },
    {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        icon: '🦋',
        description: 'Add 5 friends',
        requirement: 5,
        type: 'friends'
    },
    {
        id: 'year_long',
        name: 'Year-Long Warrior',
        icon: '👑',
        description: 'Complete 365 days',
        requirement: 365,
        type: 'days'
    }
];

/**
 * Get data from storage
 * @returns {Object}
 */
function getData() {
    const data = storage.get(STORAGE_KEY);
    return data || {
        completedDays: {},
        weeklyRewards: {},
        unlockedBadges: [],
        friends: [],
        movements: []
    };
}

/**
 * Save data to storage
 * @param {Object} data
 */
function saveData(data) {
    storage.set(STORAGE_KEY, data);
}

/**
 * Get current progress for each badge type
 * @param {Object} data
 * @returns {Object}
 */
function getCurrentProgress(data) {
    const totalDays = getTotalCompletedDays();
    const totalEarnings = getTotalEarnings();
    const currentStreak = getCurrentStreak();
    const totalWeeks = Object.keys(data.weeklyRewards || {}).length;
    const totalMovements = (data.movements || []).filter(m => m.creator === 'You').length;
    const totalFriends = (data.friends || []).length;

    return {
        days: totalDays,
        weeks: totalWeeks,
        streak: currentStreak,
        earnings: totalEarnings,
        movements: totalMovements,
        friends: totalFriends
    };
}

/**
 * Check if a badge should be unlocked
 * @param {Object} badge
 * @param {Object} progress
 * @returns {boolean}
 */
function shouldUnlockBadge(badge, progress) {
    const current = progress[badge.type] || 0;
    return current >= badge.requirement;
}

/**
 * Check and unlock badges
 * @returns {Array} Newly unlocked badges
 */
export function checkAndUnlockBadges() {
    const data = getData();
    const progress = getCurrentProgress(data);
    const newlyUnlocked = [];

    if (!data.unlockedBadges) {
        data.unlockedBadges = [];
    }

    BADGE_DEFINITIONS.forEach(badge => {
        // Skip if already unlocked
        if (data.unlockedBadges.includes(badge.id)) {
            return;
        }

        // Check if should unlock
        if (shouldUnlockBadge(badge, progress)) {
            data.unlockedBadges.push(badge.id);
            newlyUnlocked.push(badge);
        }
    });

    // Save updated data
    if (newlyUnlocked.length > 0) {
        saveData(data);

        // Show celebration for first new badge
        if (newlyUnlocked.length > 0) {
            setTimeout(() => {
                showBadgeCelebration(newlyUnlocked[0]);
            }, 500);
        }
    }

    return newlyUnlocked;
}

/**
 * Show badge unlock celebration
 * @param {Object} badge
 */
function showBadgeCelebration(badge) {
    createConfetti(50);

    const modal = document.getElementById('celebrationModal');
    const icon = document.getElementById('celebrationIcon');
    const title = document.getElementById('celebrationTitle');
    const message = document.getElementById('celebrationMessage');

    if (!modal || !icon || !title || !message) {
        // Fallback to toast if modal elements don't exist
        showToast(`🎉 Badge Unlocked: ${badge.name}!`, 'success', 5000);
        return;
    }

    icon.textContent = badge.icon;
    title.textContent = badge.name;
    message.textContent = `You've unlocked: ${badge.description}`;

    modal.classList.add('active');
}

/**
 * Get all badges with unlock status
 * @returns {Array}
 */
export function getAllBadges() {
    const data = getData();
    const progress = getCurrentProgress(data);

    return BADGE_DEFINITIONS.map(badge => {
        const isUnlocked = data.unlockedBadges?.includes(badge.id) || false;
        const currentProgress = progress[badge.type] || 0;
        const progressPercent = Math.min(100, (currentProgress / badge.requirement) * 100);

        return {
            ...badge,
            unlocked: isUnlocked,
            progress: currentProgress,
            progressPercent,
            isNew: false // Will be set by UI if recently unlocked
        };
    });
}

/**
 * Get unlocked badges
 * @returns {Array}
 */
export function getUnlockedBadges() {
    const data = getData();
    return BADGE_DEFINITIONS.filter(badge =>
        data.unlockedBadges?.includes(badge.id)
    );
}

/**
 * Get badge count
 * @returns {Object} {unlocked: number, total: number}
 */
export function getBadgeCount() {
    const data = getData();
    return {
        unlocked: data.unlockedBadges?.length || 0,
        total: BADGE_DEFINITIONS.length
    };
}

/**
 * Sync badges with Supabase (for authenticated users)
 * @returns {Promise<boolean>}
 */
export async function syncBadgesWithSupabase() {
    if (!supabase) return false;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const data = getData();
        const unlockedBadges = data.unlockedBadges || [];

        // Get badges from Supabase
        const { data: dbBadges, error: fetchError } = await supabase
            .from('badges')
            .select('id, badge_key');

        if (fetchError) throw fetchError;

        // Get user's unlocked badges
        const { data: userBadges, error: userError } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', user.id);

        if (userError) throw userError;

        const unlockedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

        // Unlock badges in database that are unlocked locally
        for (const badgeKey of unlockedBadges) {
            const dbBadge = dbBadges.find(b => b.badge_key === badgeKey);
            if (!dbBadge) continue;

            if (!unlockedBadgeIds.has(dbBadge.id)) {
                await supabase
                    .from('user_badges')
                    .insert({
                        user_id: user.id,
                        badge_id: dbBadge.id
                    });
            }
        }

        return true;
    } catch (error) {
        console.error('Error syncing badges:', error);
        return false;
    }
}

/**
 * Close celebration modal
 */
export function closeCelebration() {
    const modal = document.getElementById('celebrationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Make functions globally available
window.closeCelebration = closeCelebration;
window.checkAndUnlockBadges = checkAndUnlockBadges;
