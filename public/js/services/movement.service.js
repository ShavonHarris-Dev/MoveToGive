/**
 * Movement Service
 * Handles group challenges/movements with localStorage and Supabase integration
 */

import supabase from '../config/supabase.js';
import { storage, showToast } from '../utils/helpers.js';
import { isValidMovementName, isValidMovementDescription, isValidDateRange } from '../utils/validation.js';
import { checkAndUnlockBadges } from './badge.service.js';

const STORAGE_KEY = 'walktogive_data';

/**
 * Get data from storage
 * @returns {Object}
 */
function getData() {
    const data = storage.get(STORAGE_KEY);
    return data || {
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
 * Create a new movement
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.charity
 * @param {string} params.description
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @returns {Object}
 */
export function createMovement({ name, charity, description, startDate, endDate }) {
    // Validate inputs
    const nameValidation = isValidMovementName(name);
    if (!nameValidation.valid) {
        showToast(nameValidation.message, 'error');
        return { success: false, movement: null, error: nameValidation.message };
    }

    const descValidation = isValidMovementDescription(description);
    if (!descValidation.valid) {
        showToast(descValidation.message, 'error');
        return { success: false, movement: null, error: descValidation.message };
    }

    const dateValidation = isValidDateRange(startDate, endDate);
    if (!dateValidation.valid) {
        showToast(dateValidation.message, 'error');
        return { success: false, movement: null, error: dateValidation.message };
    }

    if (!charity) {
        showToast('Please select a charity', 'error');
        return { success: false, movement: null, error: 'Charity required' };
    }

    const data = getData();

    if (!data.movements) {
        data.movements = [];
    }

    // Create movement
    const movement = {
        id: Date.now(),
        name,
        charity,
        description,
        startDate,
        endDate,
        creator: 'You',
        members: ['You'],
        totalRaised: 0,
        weeklyContributions: {},
        createdAt: new Date().toISOString()
    };

    data.movements.push(movement);
    saveData(data);

    showToast(`Movement "${name}" created!`, 'success');

    // Check for badge unlocks
    checkAndUnlockBadges();

    return { success: true, movement, error: null };
}

/**
 * Get all movements
 * @returns {Array}
 */
export function getMovements() {
    const data = getData();
    return data.movements || [];
}

/**
 * Get movement by ID
 * @param {string|number} movementId
 * @returns {Object|null}
 */
export function getMovementById(movementId) {
    const data = getData();
    return data.movements?.find(m => m.id === movementId) || null;
}

/**
 * Check if movement is active
 * @param {Object} movement
 * @returns {boolean}
 */
export function isMovementActive(movement) {
    const now = new Date();
    const start = new Date(movement.startDate);
    const end = new Date(movement.endDate);
    return now >= start && now <= end;
}

/**
 * Join a movement
 * @param {string|number} movementId
 * @returns {boolean}
 */
export function joinMovement(movementId) {
    const data = getData();

    if (!data.movements) {
        return false;
    }

    const movement = data.movements.find(m => m.id === movementId);
    if (!movement) {
        showToast('Movement not found', 'error');
        return false;
    }

    if (movement.members.includes('You')) {
        showToast('You are already a member of this movement', 'info');
        return false;
    }

    movement.members.push('You');
    saveData(data);

    showToast(`Joined "${movement.name}"!`, 'success');
    return true;
}

/**
 * Leave a movement
 * @param {string|number} movementId
 * @returns {boolean}
 */
export function leaveMovement(movementId) {
    const data = getData();

    if (!data.movements) {
        return false;
    }

    const movement = data.movements.find(m => m.id === movementId);
    if (!movement) {
        return false;
    }

    const index = movement.members.indexOf('You');
    if (index === -1) {
        showToast('You are not a member of this movement', 'error');
        return false;
    }

    movement.members.splice(index, 1);
    saveData(data);

    showToast(`Left "${movement.name}"`, 'info');
    return true;
}

/**
 * Add contribution to movement (called when weekly reward is earned)
 * @param {string|number} movementId
 * @param {string} weekKey
 * @param {number} amount
 */
export function addMovementContribution(movementId, weekKey, amount) {
    const data = getData();

    if (!data.movements) {
        return;
    }

    const movement = data.movements.find(m => m.id === movementId);
    if (!movement) {
        return;
    }

    if (!movement.members.includes('You')) {
        return;
    }

    if (!movement.weeklyContributions) {
        movement.weeklyContributions = {};
    }

    if (!movement.weeklyContributions[weekKey]) {
        movement.weeklyContributions[weekKey] = 0;
    }

    movement.weeklyContributions[weekKey] += amount;
    movement.totalRaised += amount;

    saveData(data);
}

/**
 * Update all movement contributions (called after workout completion)
 * @param {string} weekKey
 * @param {number} amount
 */
export function updateMovementContributions(weekKey, amount) {
    const data = getData();

    if (!data.movements) {
        return;
    }

    // Add contribution to all active movements the user is a member of
    data.movements.forEach(movement => {
        if (movement.members.includes('You') && isMovementActive(movement)) {
            addMovementContribution(movement.id, weekKey, amount);
        }
    });
}

/**
 * Get user's active movements
 * @returns {Array}
 */
export function getActiveMovements() {
    const data = getData();
    if (!data.movements) {
        return [];
    }

    return data.movements.filter(m =>
        m.members.includes('You') && isMovementActive(m)
    );
}

/**
 * Create movement in Supabase
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function createMovementInSupabase(params) {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('movements')
            .insert({
                name: params.name,
                charity: params.charity,
                description: params.description,
                start_date: params.startDate,
                end_date: params.endDate,
                creator_id: user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-join as creator
        await supabase
            .from('movement_members')
            .insert({
                movement_id: data.id,
                user_id: user.id
            });

        showToast(`Movement "${params.name}" created!`, 'success');
        checkAndUnlockBadges();

        return { success: true, movement: data, error: null };
    } catch (error) {
        console.error('Error creating movement:', error);
        showToast(error.message || 'Failed to create movement', 'error');
        return { success: false, movement: null, error: error.message };
    }
}

/**
 * Get movements from Supabase
 * @returns {Promise<Array>}
 */
export async function getMovementsFromSupabase() {
    if (!supabase) return [];

    try {
        const { data: movements, error } = await supabase
            .from('movements')
            .select(`
                *,
                movement_members (
                    user_id,
                    profiles (display_name)
                ),
                movement_contributions (
                    amount
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data
        return movements.map(m => ({
            id: m.id,
            name: m.name,
            charity: m.charity,
            description: m.description,
            startDate: m.start_date,
            endDate: m.end_date,
            creator: m.creator_id,
            members: m.movement_members.map(mm => mm.profiles.display_name),
            totalRaised: m.movement_contributions.reduce((sum, c) => sum + c.amount, 0),
            weeklyContributions: {},
            createdAt: m.created_at
        }));
    } catch (error) {
        console.error('Error fetching movements:', error);
        return [];
    }
}

/**
 * Join movement in Supabase
 * @param {string} movementId
 * @returns {Promise<Object>}
 */
export async function joinMovementInSupabase(movementId) {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('movement_members')
            .insert({
                movement_id: movementId,
                user_id: user.id
            });

        if (error) throw error;

        showToast('Joined movement!', 'success');
        return { success: true, error: null };
    } catch (error) {
        console.error('Error joining movement:', error);
        showToast(error.message || 'Failed to join movement', 'error');
        return { success: false, error: error.message };
    }
}
