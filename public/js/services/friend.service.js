/**
 * Friend Service
 * Handles friend management with localStorage and Supabase integration
 */

import supabase from '../config/supabase.js';
import { storage, showToast } from '../utils/helpers.js';
import { isValidDisplayName } from '../utils/validation.js';
import { checkAndUnlockBadges } from './badge.service.js';

const STORAGE_KEY = 'walktogive_data';

/**
 * Get data from storage
 * @returns {Object}
 */
function getData() {
    const data = storage.get(STORAGE_KEY);
    return data || {
        friends: [],
        cheers: {}
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
 * Generate mock friend data
 * @param {string} name
 * @returns {Object}
 */
function generateMockFriend(name) {
    return {
        id: Date.now() + Math.random(),
        name: name,
        displayName: name,
        days: Math.floor(Math.random() * 50) + 10,
        streak: Math.floor(Math.random() * 8) + 1,
        earned: Math.floor(Math.random() * 100) + 20,
        lastActive: new Date().toISOString(),
        isMock: true
    };
}

/**
 * Add a friend (localStorage version)
 * @param {string} nameOrCode
 * @returns {Object} {success: boolean, friend: Object|null, error: string|null}
 */
export function addFriend(nameOrCode) {
    const data = getData();

    if (!data.friends) {
        data.friends = [];
    }

    // Validate input
    const validation = isValidDisplayName(nameOrCode);
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return { success: false, friend: null, error: validation.message };
    }

    // Check if already friends
    if (data.friends.find(f => f.name === nameOrCode || f.displayName === nameOrCode)) {
        const msg = 'This friend is already in your list!';
        showToast(msg, 'error');
        return { success: false, friend: null, error: msg };
    }

    // Create mock friend
    const friend = generateMockFriend(nameOrCode);
    data.friends.push(friend);

    saveData(data);
    showToast(`Added ${nameOrCode} as a friend!`, 'success');

    // Check for badge unlocks
    checkAndUnlockBadges();

    return { success: true, friend, error: null };
}

/**
 * Get all friends
 * @returns {Array}
 */
export function getFriends() {
    const data = getData();
    return data.friends || [];
}

/**
 * Remove a friend
 * @param {string|number} friendId
 * @returns {boolean}
 */
export function removeFriend(friendId) {
    const data = getData();

    if (!data.friends) {
        return false;
    }

    const index = data.friends.findIndex(f => f.id === friendId);
    if (index === -1) {
        return false;
    }

    const friendName = data.friends[index].name;
    data.friends.splice(index, 1);

    saveData(data);
    showToast(`Removed ${friendName} from friends`, 'info');

    return true;
}

/**
 * Cheer a friend
 * @param {string|number} friendId
 * @returns {boolean}
 */
export function cheerFriend(friendId) {
    const data = getData();

    if (!data.cheers) {
        data.cheers = {};
    }

    const cheerKey = `cheer-${friendId}`;

    // Check if already cheered
    if (data.cheers[cheerKey]) {
        showToast('You already cheered this friend!', 'info');
        return false;
    }

    // Mark as cheered
    data.cheers[cheerKey] = true;
    saveData(data);

    const friend = data.friends?.find(f => f.id === friendId);
    if (friend) {
        showToast(`🎉 You cheered ${friend.name}!`, 'success');
    }

    return true;
}

/**
 * Check if friend has been cheered
 * @param {string|number} friendId
 * @returns {boolean}
 */
export function hasCheered(friendId) {
    const data = getData();
    const cheerKey = `cheer-${friendId}`;
    return data.cheers?.[cheerKey] || false;
}

/**
 * Update friend stats (simulate activity)
 */
export function updateFriendsStats() {
    const data = getData();

    if (!data.friends || data.friends.length === 0) {
        return;
    }

    // Randomly update friend stats to simulate activity
    data.friends.forEach(friend => {
        if (Math.random() > 0.7) {
            friend.days++;
            if (Math.random() > 0.5) {
                friend.earned += Math.floor(Math.random() * 5) + 1;
            }
            friend.lastActive = new Date().toISOString();
        }
    });

    saveData(data);
}

/**
 * Find friend by invite code (Supabase version)
 * @param {string} inviteCode
 * @returns {Promise<Object>}
 */
export async function findFriendByInviteCode(inviteCode) {
    if (!supabase) {
        return { success: false, profile: null, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, invite_code')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

        if (error) throw error;

        return { success: true, profile: data, error: null };
    } catch (error) {
        console.error('Error finding friend:', error);
        return { success: false, profile: null, error: error.message };
    }
}

/**
 * Send friend request (Supabase version)
 * @param {string} friendId
 * @returns {Promise<Object>}
 */
export async function sendFriendRequest(friendId) {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('friendships')
            .insert({
                user_id: user.id,
                friend_id: friendId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        showToast('Friend request sent!', 'success');
        return { success: true, friendship: data, error: null };
    } catch (error) {
        console.error('Error sending friend request:', error);
        showToast(error.message || 'Failed to send friend request', 'error');
        return { success: false, error: error.message };
    }
}

/**
 * Accept friend request (Supabase version)
 * @param {string} friendshipId
 * @returns {Promise<Object>}
 */
export async function acceptFriendRequest(friendshipId) {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;

        showToast('Friend request accepted!', 'success');
        checkAndUnlockBadges();

        return { success: true, friendship: data, error: null };
    } catch (error) {
        console.error('Error accepting friend request:', error);
        showToast(error.message || 'Failed to accept friend request', 'error');
        return { success: false, error: error.message };
    }
}

/**
 * Get friends from Supabase
 * @returns {Promise<Array>}
 */
export async function getFriendsFromSupabase() {
    if (!supabase) return [];

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Get accepted friendships
        const { data: friendships, error } = await supabase
            .from('friendships')
            .select(`
                id,
                friend_id,
                profiles!friendships_friend_id_fkey (
                    id,
                    display_name,
                    invite_code
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'accepted');

        if (error) throw error;

        // Get friend stats (workout counts, earnings, etc.)
        const friendsWithStats = await Promise.all(
            friendships.map(async (friendship) => {
                const friendId = friendship.friend_id;

                // Get workout count
                const { count: workoutCount } = await supabase
                    .from('workouts')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', friendId)
                    .eq('completed', true);

                // Get earnings
                const { data: rewards } = await supabase
                    .from('weekly_rewards')
                    .select('amount')
                    .eq('user_id', friendId);

                const totalEarned = rewards?.reduce((sum, r) => sum + r.amount, 0) || 0;

                return {
                    id: friendId,
                    name: friendship.profiles.display_name,
                    displayName: friendship.profiles.display_name,
                    days: workoutCount || 0,
                    earned: totalEarned,
                    streak: 0, // Calculate streak separately if needed
                    inviteCode: friendship.profiles.invite_code
                };
            })
        );

        return friendsWithStats;
    } catch (error) {
        console.error('Error fetching friends from Supabase:', error);
        return [];
    }
}
