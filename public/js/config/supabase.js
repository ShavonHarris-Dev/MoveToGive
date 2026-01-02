/**
 * Supabase Configuration
 * Initializes and exports the Supabase client
 */

// NOTE: In production, these should come from environment variables
// For now, they'll be loaded from a config object or directly set
const SUPABASE_URL = window.SUPABASE_CONFIG?.url || '';
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || '';

// Initialize Supabase client
let supabase = null;
let supabaseMode = 'offline'; // 'offline', 'configured', 'authenticated'

try {
    if (typeof window.supabase === 'undefined') {
        console.warn('⚠️ Supabase library not loaded. Running in offline mode with localStorage.');
        supabaseMode = 'offline';
    } else if (!SUPABASE_URL || !SUPABASE_ANON_KEY ||
               SUPABASE_URL.includes('your-project-ref') ||
               SUPABASE_ANON_KEY.includes('your-anon-key')) {
        console.warn('⚠️ Supabase credentials not configured. Running in offline mode with localStorage.');
        console.info('💡 To enable cloud features, create supabase-config.js with your credentials.');
        supabaseMode = 'offline';
    } else {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: window.localStorage,
                storageKey: 'walktogive-auth'
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            },
            global: {
                headers: {
                    'X-Client-Info': 'walktogive-web'
                }
            }
        });

        supabaseMode = 'configured';
        console.log('✅ Supabase client initialized successfully');
        console.info('🔐 Sign in to enable cloud sync and real-time features');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    console.warn('⚠️ Falling back to offline mode with localStorage');
    supabase = null;
    supabaseMode = 'offline';
}

/**
 * Helper function to check if Supabase is properly configured
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
    return supabaseMode !== 'offline' && supabase !== null;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    if (!isSupabaseConfigured()) return false;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session !== null;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

/**
 * Get the current user session
 * @returns {Promise<{user: Object|null, session: Object|null}>}
 */
export async function getCurrentSession() {
    if (!isSupabaseConfigured()) {
        return { user: null, session: null };
    }

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
            supabaseMode = 'authenticated';
        }

        return { user: session?.user || null, session };
    } catch (error) {
        console.error('Error getting session:', error);
        return { user: null, session: null };
    }
}

/**
 * Get current user
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
    const { user } = await getCurrentSession();
    return user;
}

/**
 * Listen to auth state changes
 * @param {Function} callback - Called when auth state changes
 * @returns {Object} Subscription object with unsubscribe method
 */
export function onAuthStateChange(callback) {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured - auth state changes disabled');
        return { unsubscribe: () => {} };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);

        // Update mode based on auth state
        if (session) {
            supabaseMode = 'authenticated';
        } else if (supabase) {
            supabaseMode = 'configured';
        }

        callback(event, session);
    });

    return subscription;
}

/**
 * Get Supabase mode
 * @returns {string} 'offline' | 'configured' | 'authenticated'
 */
export function getSupabaseMode() {
    return supabaseMode;
}

/**
 * Check if running in offline mode
 * @returns {boolean}
 */
export function isOfflineMode() {
    return supabaseMode === 'offline';
}

/**
 * Get user profile from database
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile() {
    if (!isSupabaseConfigured()) return null;

    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            // If profile doesn't exist, create it
            if (error.code === 'PGRST116') {
                return await createUserProfile(user.id, {
                    display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
                    email: user.email
                });
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

/**
 * Create user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data (display_name, email, etc.)
 * @returns {Promise<Object|null>}
 */
export async function createUserProfile(userId, profileData = {}) {
    if (!isSupabaseConfigured()) return null;

    try {
        // Generate unique invite code
        const inviteCode = generateInviteCode();

        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                display_name: profileData.display_name || profileData.email?.split('@')[0] || 'User',
                invite_code: inviteCode,
                min_reward: 1,
                max_reward: 5
            })
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error creating user profile:', error);
        return null;
    }
}

/**
 * Generate unique invite code
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
 * Export supabase client and mode
 */
export { supabase, supabaseMode };
export default supabase;
