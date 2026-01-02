/**
 * Workout Service
 * Handles workout tracking with localStorage fallback
 */

import { storage, getTodayString, getWeekNumberInMonth, randomInt } from '../utils/helpers.js';
import { showToast } from '../utils/helpers.js';

const STORAGE_KEY = 'walktogive_data';

// Workout definitions for each day of the week
export const WORKOUT_DEFINITIONS = [
    [
        { name: "Sun Salutation Flow", desc: "Complete 5 rounds of sun salutations. Each round: reach up, fold forward, step back to plank, lower down, upward dog, downward dog, step forward, fold, reach up. Flow smoothly with your breath.", duration: 15, image: "sun-salutation-flow.jpg" },
        { name: "Dynamic Lunges", desc: "12 reps per leg of alternating forward lunges with a twist. As you lunge, rotate your torso toward the front leg. Engage your core and maintain balance throughout.", duration: 10, image: "dynamic-lunges.jpg" },
        { name: "Arm Circles & Shoulder Rolls", desc: "2 minutes of continuous movement: 20 forward arm circles, 20 backward, 15 shoulder rolls back, 15 forward. Keep movements controlled.", duration: 5, image: "arm-circles-shoulder-rolls.jpg" },
        { name: "Morning Stretch Hold", desc: "Hold each for 45 seconds: standing quad stretch both sides, standing hamstring fold, tricep overhead stretch both sides, neck tilts both sides.", duration: 8, image: "morning-stretch-hold.jpg" }
    ],
    [
        { name: "Jumping Jacks Pyramid", desc: "Pyramid style: 10 jumping jacks, 20, 30, 40, 50, then back down: 40, 30, 20, 10. Take 20-second breaks between each set.", duration: 12, image: "jumping-jacks-pyramid.jpg" },
        { name: "High Knees Intervals", desc: "6 rounds of 30 seconds high knees at maximum intensity, followed by 30 seconds walking in place. Drive those knees up to hip level.", duration: 6, image: "high-knees-intervals.jpg" },
        { name: "Burpee Challenge", desc: "3 sets of 8 burpees. Each burpee: squat, jump back to plank, optional push-up, jump feet forward, explosive jump up. Rest 90 seconds between sets.", duration: 10, image: "burpee-challenge.jpg" },
        { name: "Cool Down Walk & Breathe", desc: "5-minute slow walk while practicing deep breathing: 4-count inhale through nose, 4-count hold, 6-count exhale through mouth.", duration: 5, image: "cool-down-walk-breathe.jpg" }
    ],
    [
        { name: "Plank Variations", desc: "Complete this circuit twice: 45-second standard plank, 30-second right side plank, 30-second left side plank, 45-second plank with hip dips (15 per side). Rest 60 seconds between rounds.", duration: 8, image: "plank-variations.jpg" },
        { name: "Bicycle Crunches", desc: "4 sets of 30 reps total (15 per side). Lie on back, hands behind head, bring opposite elbow to opposite knee while extending other leg. Don't pull on neck.", duration: 8, image: "bicycle-crunches.jpg" },
        { name: "Dead Bug Exercise", desc: "3 sets of 12 reps per side. Lie on back, arms straight up, knees at 90°. Lower opposite arm and leg toward floor without arching back. Rest 45 seconds between sets.", duration: 10, image: "dead-bug-exercise.jpg" },
        { name: "Cat-Cow to Child's Pose", desc: "10 rounds flowing between cat-cow, then rest in child's pose for 5 deep breaths. Finish with gentle spinal twists both sides.", duration: 7, image: "cat-cow-childs-pose.jpg" }
    ],
    [
        { name: "Bodyweight Squat Pyramid", desc: "Pyramid up then down: 5 squats, 10, 15, 20, 15, 10, 5. Rest 30 seconds between sets. Focus on sitting back, chest up. Total: 80 squats!", duration: 15, image: "bodyweight-squat-pyramid.jpg" },
        { name: "Reverse Lunges", desc: "4 sets of 12 reps per leg. Step back into lunge, lower back knee almost to floor, drive through front heel to return. Add a knee drive at top. Rest 45 seconds.", duration: 12, image: "reverse-lunges.jpg" },
        { name: "Single-Leg Glute Bridges", desc: "3 sets of 10 reps per leg. Lie on back, one foot flat, other leg extended. Lift hips high, squeezing glutes at top. Lower with control.", duration: 8, image: "single-leg-glute-bridges.jpg" },
        { name: "Wall Sit Hold", desc: "3 rounds of maximum holds: sit against wall with thighs parallel to ground. Hold as long as possible (aim for 45+ seconds). Rest 60 seconds between.", duration: 7, image: "wall-sit-hold.jpg" }
    ],
    [
        { name: "Hip Mobility Circuit", desc: "2 rounds of: 10 hip circles each direction per leg, 10 leg swings forward/back per leg, 10 leg swings side-to-side per leg, 8 deep squat holds (5 seconds each).", duration: 12, image: "hip-mobility-circuit.jpg" },
        { name: "Shoulder Mobility Flow", desc: "Complete 2 times: 10 arm circles forward, 10 backward, 8 shoulder pass-throughs, 10 wall slides. Move slowly and feel the stretch.", duration: 8, image: "shoulder-mobility-flow.jpg" },
        { name: "Yoga Flow Sequence", desc: "15-minute flow: downward dog (1 min), warrior 1 both sides (30 sec each), warrior 2 both sides (30 sec each), triangle pose both sides (30 sec each), pigeon pose both sides (1 min each).", duration: 15, image: "yoga-flow-sequence.jpg" },
        { name: "Deep Stretching Finale", desc: "Hold each 60 seconds: seated forward fold, butterfly stretch, supine twist both sides, figure-4 hip stretch both sides, final resting pose.", duration: 10, image: "deep-stretching-finale.jpg" }
    ],
    [
        { name: "Push-up Variations", desc: "Total 50 push-ups: 15 standard (or on knees), 15 wide-grip, 10 diamond, 10 decline (feet elevated). Rest as needed. Modify as needed.", duration: 12, image: "push-up-variations.jpg" },
        { name: "Tricep Dips Ladder", desc: "Using sturdy chair: 5 dips, rest 20 sec, 8 dips, rest 20 sec, 10 dips, rest 20 sec, 12 dips, rest 20 sec, 15 dips. Keep shoulders down.", duration: 8, image: "tricep-dips-ladder.jpg" },
        { name: "Plank to Down Dog", desc: "4 sets of 10 reps: start in plank, push hips up and back into downward dog, return to plank. Builds shoulder stability. Rest 45 seconds.", duration: 10, image: "plank-to-down-dog.jpg" },
        { name: "Arm Circles with Resistance", desc: "Hold light weights or water bottles. 3 sets of: 30-second forward circles, 30-second backward circles, 30-second up-and-down pulses.", duration: 6, image: "arm-circles-resistance.jpg" }
    ],
    [
        { name: "Gentle Walking Intervals", desc: "20 minutes total: alternate 3 minutes easy pace, 2 minutes brisk pace. Focus on posture, engage core, swing arms naturally.", duration: 20, image: "gentle-walking-intervals.jpg" },
        { name: "Foam Rolling Routine", desc: "Spend 2 minutes on each area: calves, hamstrings, IT bands, quads, upper back, glutes. Roll slowly, pause on tender spots.", duration: 12, image: "foam-rolling-routine.jpg" },
        { name: "Yin Yoga Poses", desc: "Hold each pose for 3-5 minutes: dragon pose both sides, butterfly, supine twist both sides, legs up the wall. Deep, restorative stretching.", duration: 15, image: "yin-yoga-poses.jpg" },
        { name: "Breathing & Meditation", desc: "10 minutes of breathwork: 5 minutes box breathing (4-4-4-4 pattern), 5 minutes of body scan meditation from toes to head.", duration: 10, image: "breathing-meditation.jpg" }
    ]
];

/**
 * Get all data from storage
 * @returns {Object}
 */
function getData() {
    const storedData = storage.get(STORAGE_KEY);

    // Default structure
    const defaultData = {
        completedDays: {},
        weeklyRewards: {},
        minReward: 1,
        maxReward: 5,
        friends: [],
        movements: [],
        cheers: {},
        inviteCode: generateInviteCode(),
        unlockedBadges: [],
        profiles: {}
    };

    // If no stored data, return defaults
    if (!storedData) {
        return defaultData;
    }

    // Merge stored data with defaults to ensure all properties exist
    return {
        ...defaultData,
        ...storedData,
        // Ensure nested objects exist
        completedDays: storedData.completedDays || {},
        weeklyRewards: storedData.weeklyRewards || {},
        friends: storedData.friends || [],
        movements: storedData.movements || [],
        cheers: storedData.cheers || {},
        unlockedBadges: storedData.unlockedBadges || [],
        profiles: storedData.profiles || {}
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
 * Generate invite code
 * @returns {string}
 */
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WALK';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Get workouts for a specific day
 * @param {number} dayOfWeek (0-6)
 * @returns {Array}
 */
export function getWorkoutsForDay(dayOfWeek) {
    return WORKOUT_DEFINITIONS[dayOfWeek];
}

/**
 * Complete a workout for a specific date
 * @param {string} dateKey (YYYY-MM-DD)
 * @returns {Object} {success: boolean, weekCompleted: boolean, reward: number|null}
 */
export function completeWorkout(dateKey) {
    const data = getData();

    // Mark day as completed
    data.completedDays[dateKey] = true;

    // Check if week is complete
    const [year, month, day] = dateKey.split('-').map(Number);
    const weekNum = getWeekNumberInMonth(new Date(year, month - 1, day));
    const weekKey = `${year}-${month}-week${weekNum}`;

    const weekCompleted = isWeekComplete(data, year, month, weekNum);
    let reward = null;

    if (weekCompleted && !data.weeklyRewards[weekKey]) {
        // Award reward
        reward = randomInt(data.minReward, data.maxReward);
        data.weeklyRewards[weekKey] = reward;
        showToast(`🎉 Week complete! You earned $${reward} for charity!`, 'success');

        // Update movement contributions
        if (data.movements) {
            data.movements.forEach(movement => {
                if (movement.members.includes('You') && isMovementActiveForDate(movement, dateKey)) {
                    if (!movement.weeklyContributions) {
                        movement.weeklyContributions = {};
                    }
                    if (!movement.weeklyContributions[weekKey]) {
                        movement.weeklyContributions[weekKey] = 0;
                    }
                    movement.weeklyContributions[weekKey] += reward;
                    movement.totalRaised += reward;
                }
            });
        }
    }

    saveData(data);

    return {
        success: true,
        weekCompleted,
        reward
    };
}

/**
 * Check if movement is active for a specific date
 * @param {Object} movement
 * @param {string} dateKey
 * @returns {boolean}
 */
function isMovementActiveForDate(movement, dateKey) {
    const date = new Date(dateKey);
    const start = new Date(movement.startDate);
    const end = new Date(movement.endDate);
    return date >= start && date <= end;
}

/**
 * Check if a specific week is complete
 * @param {Object} data
 * @param {number} year
 * @param {number} month
 * @param {number} weekNum
 * @returns {boolean}
 */
function isWeekComplete(data, year, month, weekNum) {
    // Count completed days in this week
    let count = 0;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayWeek = getWeekNumberInMonth(date);

        if (dayWeek === weekNum) {
            const dateKey = `${year}-${month}-${day}`;
            if (data.completedDays[dateKey]) {
                count++;
            }
        }
    }

    // Need 7 days for a complete week
    return count >= 7;
}

/**
 * Get completed days
 * @returns {Object}
 */
export function getCompletedDays() {
    const data = getData();
    return data.completedDays;
}

/**
 * Get weekly rewards
 * @returns {Object}
 */
export function getWeeklyRewards() {
    const data = getData();
    return data.weeklyRewards;
}

/**
 * Check if a day is completed
 * @param {string} dateKey
 * @returns {boolean}
 */
export function isDayCompleted(dateKey) {
    const data = getData();
    return !!data.completedDays[dateKey];
}

/**
 * Get total completed days
 * @returns {number}
 */
export function getTotalCompletedDays() {
    const data = getData();
    return Object.keys(data.completedDays).length;
}

/**
 * Get total earnings
 * @returns {number}
 */
export function getTotalEarnings() {
    const data = getData();
    return Object.values(data.weeklyRewards).reduce((sum, val) => sum + val, 0);
}

/**
 * Get current streak (consecutive weeks with rewards)
 * @returns {number}
 */
export function getCurrentStreak() {
    const data = getData();
    const weekKeys = Object.keys(data.weeklyRewards).sort().reverse();

    let streak = 0;
    for (const key of weekKeys) {
        if (data.weeklyRewards[key]) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Update reward range
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function updateRewardRange(min, max) {
    if (min > max || min < 1) {
        showToast('Invalid reward range', 'error');
        return false;
    }

    const data = getData();
    data.minReward = min;
    data.maxReward = max;
    saveData(data);

    showToast(`Reward range updated to $${min} - $${max}`, 'success');
    return true;
}

/**
 * Get reward range
 * @returns {Object} {min: number, max: number}
 */
export function getRewardRange() {
    const data = getData();
    return {
        min: data.minReward,
        max: data.maxReward
    };
}

/**
 * Get statistics for display
 * @returns {Object}
 */
export function getStats() {
    return {
        totalDays: getTotalCompletedDays(),
        currentStreak: getCurrentStreak(),
        totalEarned: getTotalEarnings()
    };
}

/**
 * Get monthly total
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
export function getMonthlyTotal(year, month) {
    const data = getData();
    let total = 0;

    Object.keys(data.weeklyRewards).forEach(key => {
        if (key.startsWith(`${year}-${month}-`)) {
            total += data.weeklyRewards[key];
        }
    });

    return total;
}

/**
 * Export all workout data
 * @returns {Object}
 */
export function exportData() {
    return getData();
}

/**
 * Import workout data (for syncing with Supabase later)
 * @param {Object} importedData
 */
export function importData(importedData) {
    saveData(importedData);
    showToast('Data imported successfully', 'success');
}
