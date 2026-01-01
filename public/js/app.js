/**
 * Main Application Entry Point
 * Initializes all components and handles app lifecycle
 */

import { initNavigation } from './components/navigation.js';
import { initCalendar } from './components/calendar.js';
import { initModal } from './components/modal.js';
import { initStats } from './components/stats.js';
import { initSettings } from './components/settings.js';
import { initBadges } from './components/badges.js';
import { initFriendsPage } from './pages/friends.js';
import { initMovementsPage } from './pages/movements.js';
import { signInWithGoogle as googleSignIn, signOut as authSignOut, onAuthStateChange, getCurrentUser } from './services/auth.service.js';
import { isSupabaseConfigured, getUserProfile, createUserProfile } from './config/supabase.js';

/**
 * Initialize the application
 */
async function initApp() {
    console.log('🏃‍♀️ WalkToGive - Initializing...');

    try {
        // Initialize authentication first
        await initAuth();

        // Initialize core components
        initNavigation();
        initModal();
        initStats();
        initSettings();
        initCalendar();
        initBadges();

        // Initialize page controllers
        initFriendsPage();
        initMovementsPage();

        // Initialize badges section collapsed state
        initBadgesCollapse();

        console.log('✅ WalkToGive initialized successfully!');

        // Show welcome message for first-time users
        const hasSeenWelcome = localStorage.getItem('walktogive_welcome_shown');
        if (!hasSeenWelcome) {
            showWelcomeMessage();
            localStorage.setItem('walktogive_welcome_shown', 'true');
        }
    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
}

/**
 * Initialize badges section collapsed state
 * Starts collapsed by default, remembers user preference
 */
function initBadgesCollapse() {
    const badgesContent = document.getElementById('badgesContent');
    const collapseIcon = document.querySelector('#badgesCollapseBtn .collapse-icon');

    if (badgesContent && collapseIcon) {
        // Check saved preference, default to collapsed
        const savedState = localStorage.getItem('walktogive_badges_collapsed');
        const shouldBeCollapsed = savedState === null ? true : savedState === 'true';

        if (shouldBeCollapsed) {
            badgesContent.classList.add('collapsed');
            collapseIcon.classList.add('rotated');
        } else {
            badgesContent.classList.remove('collapsed');
            collapseIcon.classList.remove('rotated');
        }
    }
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    setTimeout(() => {
        alert(`👋 Welcome to WalkToGive!

Movement Meets Purpose

Here's how it works:
✓ Complete daily workouts (detailed exercises for each day)
✓ Finish all 7 days in a week to earn money for charity
✓ Set your reward range and track your progress
✓ Stay consistent and make a difference!

Click on any day in the calendar to see your workout and mark it complete.

Let's get started! 💪❤️`);
    }, 500);
}

/**
 * Toggle badges section collapsed/expanded
 * Called from onclick in HTML
 */
window.toggleBadgesSection = function() {
    const badgesContent = document.getElementById('badgesContent');
    const collapseIcon = document.querySelector('#badgesCollapseBtn .collapse-icon');

    if (badgesContent && collapseIcon) {
        badgesContent.classList.toggle('collapsed');
        collapseIcon.classList.toggle('rotated');

        // Save state to localStorage
        const isCollapsed = badgesContent.classList.contains('collapsed');
        localStorage.setItem('walktogive_badges_collapsed', isCollapsed ? 'true' : 'false');
    }
};

/**
 * Open authentication modal
 */
window.openAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
    }
};

/**
 * Close authentication modal
 */
window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

/**
 * Sign in with Google
 */
window.signInWithGoogle = async function() {
    try {
        if (!isSupabaseConfigured()) {
            alert('⚠️ Cloud features are not configured.\n\nYou can continue using the app in offline mode, or configure Supabase to enable cloud sync and authentication.');
            closeAuthModal();
            return;
        }

        await googleSignIn();
        // User will be redirected to Google, then back to the app
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Failed to sign in with Google. Please try again.');
    }
};

/**
 * Sign out
 */
window.signOut = async function() {
    try {
        await authSignOut();
        updateAuthUI(null);
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

/**
 * Update UI based on authentication state
 */
async function updateAuthUI(user) {
    const authLoggedOut = document.getElementById('authLoggedOut');
    const authLoggedIn = document.getElementById('authLoggedIn');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        // User is logged in
        if (authLoggedOut) authLoggedOut.style.display = 'none';
        if (authLoggedIn) authLoggedIn.style.display = 'block';

        // Get user profile
        const profile = await getUserProfile();

        if (userName) {
            userName.textContent = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
        }
        if (userEmail) {
            userEmail.textContent = user.email || '';
        }

        // Close auth modal if open
        closeAuthModal();

        console.log('✅ User signed in:', user.email);
    } else {
        // User is logged out
        if (authLoggedOut) authLoggedOut.style.display = 'block';
        if (authLoggedIn) authLoggedIn.style.display = 'none';

        console.log('👤 No user signed in (offline mode)');
    }
}

/**
 * Initialize authentication
 */
async function initAuth() {
    if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured. Running in offline mode.');
        return;
    }

    // Check current auth state
    const { user } = await getCurrentUser();
    await updateAuthUI(user);

    // Listen for auth state changes
    onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
            // Create profile if it doesn't exist
            let profile = await getUserProfile();
            if (!profile) {
                const displayName = session.user.user_metadata?.display_name ||
                                  session.user.user_metadata?.full_name ||
                                  session.user.email?.split('@')[0] ||
                                  'User';

                profile = await createUserProfile(session.user.id, {
                    display_name: displayName,
                    email: session.user.email
                });

                console.log('✅ User profile created:', profile);
            }

            await updateAuthUI(session.user);
        } else if (event === 'SIGNED_OUT') {
            await updateAuthUI(null);
        }
    });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
window.WalkToGive = {
    version: '1.0.0',
    initialized: true
};
