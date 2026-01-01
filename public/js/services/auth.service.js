/**
 * Authentication Service
 * Handles all authentication-related operations with Supabase
 * Falls back to offline mode when Supabase is not configured
 */

import supabase, { isSupabaseConfigured, getUserProfile } from '../config/supabase.js';
import { isValidEmail, isValidPassword, isValidDisplayName } from '../utils/validation.js';
import { showToast } from '../utils/helpers.js';

/**
 * Sign up a new user
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.displayName
 * @returns {Promise<{user: Object|null, profile: Object|null, error: Error|null}>}
 */
export async function signUp({ email, password, displayName }) {
    try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            throw new Error('Cloud features not available. Running in offline mode. No account needed!');
        }

        // Validate inputs
        if (!isValidEmail(email)) {
            throw new Error('Invalid email address');
        }

        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message);
        }

        const nameValidation = isValidDisplayName(displayName);
        if (!nameValidation.valid) {
            throw new Error(nameValidation.message);
        }

        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName
                },
                emailRedirectTo: `${window.location.origin}/verify-email`
            }
        });

        if (error) throw error;

        // Wait for profile to be created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get user profile
        const profile = await getUserProfile();

        showToast('Account created successfully! Please check your email to verify.', 'success');

        return { user: data.user, profile, error: null };
    } catch (error) {
        console.error('Signup error:', error);
        showToast(error.message || 'Failed to create account', 'error');
        return { user: null, profile: null, error };
    }
}

/**
 * Sign in an existing user
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
 */
export async function signIn({ email, password }) {
    try {
        if (!isValidEmail(email)) {
            throw new Error('Invalid email address');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        showToast('Welcome back!', 'success');

        return { user: data.user, session: data.session, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        showToast(error.message || 'Failed to sign in', 'error');
        return { user: null, session: null, error };
    }
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<{error: Error|null}>}
 */
export async function signInWithGoogle() {
    try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            throw new Error('Cloud features not available. Running in offline mode. No account needed!');
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        if (error) throw error;

        // The user will be redirected to Google for authentication
        return { error: null };
    } catch (error) {
        console.error('Google sign in error:', error);
        showToast(error.message || 'Failed to sign in with Google', 'error');
        return { error };
    }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        showToast('Signed out successfully', 'success');

        return { error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        showToast(error.message || 'Failed to sign out', 'error');
        return { error };
    }
}

/**
 * Get the current user
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        return { user, error: null };
    } catch (error) {
        console.error('Get current user error:', error);
        return { user: null, error };
    }
}

/**
 * Get the current session
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        return { session, error: null };
    } catch (error) {
        console.error('Get session error:', error);
        return { session: null, error };
    }
}

/**
 * Reset password (send reset email)
 * @param {string} email
 * @returns {Promise<{error: Error|null}>}
 */
export async function resetPassword(email) {
    try {
        if (!isValidEmail(email)) {
            throw new Error('Invalid email address');
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;

        showToast('Password reset email sent! Check your inbox.', 'success');

        return { error: null };
    } catch (error) {
        console.error('Reset password error:', error);
        showToast(error.message || 'Failed to send reset email', 'error');
        return { error };
    }
}

/**
 * Update user password
 * @param {string} newPassword
 * @returns {Promise<{error: Error|null}>}
 */
export async function updatePassword(newPassword) {
    try {
        const passwordValidation = isValidPassword(newPassword);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message);
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        showToast('Password updated successfully', 'success');

        return { error: null };
    } catch (error) {
        console.error('Update password error:', error);
        showToast(error.message || 'Failed to update password', 'error');
        return { error };
    }
}

/**
 * Update user profile
 * @param {Object} updates
 * @returns {Promise<{error: Error|null}>}
 */
export async function updateProfile(updates) {
    try {
        const { error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) throw error;

        showToast('Profile updated successfully', 'success');

        return { error: null };
    } catch (error) {
        console.error('Update profile error:', error);
        showToast(error.message || 'Failed to update profile', 'error');
        return { error };
    }
}

/**
 * Listen for auth state changes
 * @param {Function} callback
 * @returns {Object} Subscription object
 */
export function onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    const { user } = await getCurrentUser();
    return user !== null;
}
