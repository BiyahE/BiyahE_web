
// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = 'https://musiimheammasnmegnnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11c2lpbWhlYW1tYXNubWVnbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTIwMTcsImV4cCI6MjA3MzU4ODAxN30.KH2Pckv8CM9iTbYRBIzSSxt7rZFCRDhhxIf06655mm8';

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase === 'undefined' || !supabase.createClient) {
        console.error('Supabase library not loaded yet');
        return false;
    }

    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });

        console.log('✅ Supabase client initialized successfully');

        // Expose globally
        window.supabaseClient = supabaseClient;
        window.supabase = supabaseClient;

        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return false;
    }
}

if (!initSupabase()) {
    const checkInterval = setInterval(() => {
        if (initSupabase()) {
            clearInterval(checkInterval);
        }
    }, 100);

    setTimeout(() => {
        clearInterval(checkInterval);
        if (!supabaseClient) {
            console.error('❌ Failed to initialize Supabase after 5 seconds');
        }
    }, 5000);
}


// ==========================================
// AUTHENTICATION SYSTEM - RLS ENABLED
// ==========================================

const Auth = {
    async isAuthenticated() {
        const localUser = this.getCurrentUser();

        if (!localUser) {
            return { authenticated: false, error: 'Not authenticated. Please login again.' };
        }

        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error || !session) {
                console.warn('Supabase Auth session missing, attempting to restore...');
                const restored = await this.restoreSupabaseSession(localUser);
                if (!restored) {
                    return {
                        authenticated: true,
                        user: localUser,
                        warning: 'Supabase Auth not active - some features may be limited'
                    };
                }
            }
        } catch (e) {
            console.warn('Session check error:', e);
        }

        return {
            authenticated: true,
            user: localUser,
            supabaseActive: true
        };
    },

    // ==========================================
    // RESTORE SUPABASE SESSION — uses plain
    // password saved at login time as '_sp'
    // ==========================================
    async restoreSupabaseSession(localUser) {
        try {
            const email = localStorage.getItem('_se');
            const password = localStorage.getItem('_sp');

            if (!email || !password) {
                console.warn('No plain credentials stored — cannot restore session');
                return false;
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (!error && data.session) {
                console.log('✅ Supabase session restored via restoreSupabaseSession');
                return true;
            }
            console.warn('restoreSupabaseSession failed:', error?.message);
            return false;
        } catch (e) {
            console.warn('restoreSupabaseSession exception:', e);
            return false;
        }
    },

    async checkAuth() {
        const authStatus = await this.isAuthenticated();

        if (!authStatus.authenticated) {
            console.warn('Authentication check failed:', authStatus.error);
            this.clearAuthData();
            window.location.href = 'index.html';
            return false;
        }

        return true;
    },

    clearAuthData() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('_se');
        localStorage.removeItem('_sp');

        if (supabaseClient) {
            supabaseClient.auth.signOut().catch(console.error);
        }
    },

    // ==========================================
    // PASSWORD HASHING (SHA-256)
    // ==========================================

    async hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + 'biyahe-salt-2024');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (error) {
            console.error('Hashing error:', error);
            throw new Error('Failed to hash password: ' + error.message);
        }
    },

    async verifyPassword(password, hash) {
        try {
            const hashedInput = await this.hashPassword(password);
            return hashedInput === hash;
        } catch (error) {
            console.error('Verification error:', error);
            throw new Error('Failed to verify password: ' + error.message);
        }
    },

    // ==========================================
    // LOGIN - saves plain password as _sp/_se
    // so any page can restore the Supabase session
    // ==========================================

    async login(email, password) {
        try {
            const client = await this.ensureSupabase();

            console.log('🔐 Attempting login for:', email);

            // Step 1: Fetch user from Staff_Account table
            const { data: user, error } = await client
                .from('Staff_Account')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                console.error('Login error - user not found:', error);
                return { success: false, message: 'Invalid email or password' };
            }

            if (user.status && user.status.toLowerCase() === 'inactive') {
                return { success: false, message: 'Account is inactive. Please contact administrator.' };
            }

            // Step 2: Verify password against Staff_Account
            const isValid = await this.verifyPassword(password, user.password);
            if (!isValid) {
                return { success: false, message: 'Invalid email or password' };
            }

            // Step 3: ENSURE Supabase Auth user exists and create session
            let supabaseSession = null;
            let authWarning = null;

            try {
                console.log('Attempting Supabase Auth sign in...');
                const { data: authData, error: authError } = await client.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (!authError && authData.session) {
                    console.log('✅ Supabase Auth session created (existing user)');
                    supabaseSession = authData.session;
                } else {
                    console.log('User not in Supabase Auth, creating...');

                    const { data: signUpData, error: signUpError } = await client.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                fullname: user.fullname,
                                role: user.role,
                                staff_id: user.id
                            }
                        }
                    });

                    if (!signUpError && signUpData.session) {
                        console.log('✅ Supabase Auth user created and session established');
                        supabaseSession = signUpData.session;
                    } else if (signUpError) {
                        if (signUpError.message.includes('already registered') || signUpError.code === 'user_already_exists') {
                            console.log('User exists but no session, trying sign in again...');

                            const { data: retryData, error: retryError } = await client.auth.signInWithPassword({
                                email: email,
                                password: password
                            });

                            if (!retryError && retryData.session) {
                                console.log('✅ Supabase Auth session established on retry');
                                supabaseSession = retryData.session;
                            } else {
                                console.warn('⚠️ Could not establish session:', retryError?.message);
                                authWarning = 'Please contact admin to sync your password.';
                            }
                        } else {
                            console.warn('⚠️ Supabase Auth signup failed:', signUpError.message);
                            authWarning = 'Some database features may be limited.';
                        }
                    }
                }
            } catch (authErr) {
                console.warn('Supabase Auth error:', authErr.message);
                authWarning = 'Authentication service error. Please try again.';
            }

            // Step 4: Create local session data
            const sessionData = {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                status: user.status,
                loginTime: new Date().toISOString(),
                supabaseAuthenticated: !!supabaseSession,
                supabaseWarning: authWarning
            };

            // ==========================================
            // SAVE PLAIN PASSWORD so every page can
            // restore the Supabase Auth session for RLS
            // ==========================================
            localStorage.setItem('_se', email);
            localStorage.setItem('_sp', password);

            localStorage.setItem('currentUser', JSON.stringify(sessionData));

            console.log('✅ Login successful - User role:', user.role);
            if (supabaseSession) {
                console.log('✅ Supabase Auth active - Real-time subscriptions will work');
            } else {
                console.warn('⚠️ Supabase Auth not active - Real-time may not work');
            }

            return {
                success: true,
                message: 'Login successful',
                user: sessionData,
                supabaseSession: supabaseSession,
                warning: authWarning
            };

        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: error.message || 'Login failed' };
        }


    },

    // ==========================================
    // LOGOUT
    // ==========================================

    async logout() {
        try {
            const client = await this.ensureSupabase();
            await client.auth.signOut();
            this.clearAuthData();
            console.log('✅ Logout successful');
            window.location.href = 'index.html';
            return { success: true, message: 'Logout successful' };
        } catch (error) {
            console.error('Logout error:', error);
            this.clearAuthData();
            window.location.href = 'index.html';
            return { success: true, message: 'Logout successful' };
        }
    },

    // ==========================================
    // SESSION MANAGEMENT
    // ==========================================

    isLoggedIn() {
        const user = localStorage.getItem('currentUser');
        return user !== null;
    },

    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    async getCurrentUserData() {
        const userJson = localStorage.getItem('currentUser');

        if (!userJson) {
            console.error("No user found in localStorage");
            return null;
        }

        const user = JSON.parse(userJson);

        try {
            const client = await this.ensureSupabase();

            const { data, error } = await client
                .from('Staff_Account')
                .select('fullname, role, email, status')
                .eq('email', user.email)
                .single();

            if (error) {
                console.error("Error fetching profile from database:", error);
                return user;
            }

            return data;
        } catch (error) {
            console.error("Error in getCurrentUserData:", error);
            return user;
        }
    },

    async ensureSupabase() {
        let attempts = 0;
        while (!supabaseClient && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!supabaseClient) {
            throw new Error('Supabase client not initialized - check if supabase-js library is loaded');
        }

        return supabaseClient;
    },

    async checkSupabaseAuth() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            return { active: !!session, session };
        } catch (e) {
            console.error('Supabase auth check failed:', e);
            return { active: false, error: e.message };
        }
    }
};

// ==========================================
// BUS API - RLS ENABLED VERSION
// ==========================================

const BusAPI = {
    getCurrentUser() {
        let user = Auth.getCurrentUser();
        if (!user) {
            const json = localStorage.getItem('currentUser');
            if (json) {
                try { user = JSON.parse(json); } catch (e) { user = null; }
            }
        }
        return user;
    },

    getClient() { return supabaseClient; },

    async checkAuthForRLS() {
        const user = this.getCurrentUser();
        if (!user) return { allowed: false, error: 'Not authenticated', code: 'AUTH_REQUIRED' };
        const { active } = await Auth.checkSupabaseAuth();
        if (!active) console.warn('Supabase Auth not active - operations may fail');
        return { allowed: true, user: user, supabaseActive: active };
    },

    async getAllBuses() {
        try {
            const client = this.getClient();
            const { data, error } = await client.from('bus').select('*').order('bus_id', { ascending: true });
            if (error) {
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    return { success: false, error: 'RLS Policy Error: Access denied. Please logout and login again.', code: 'RLS_VIOLATION', data: [] };
                }
                return { success: false, error: error.message, data: [] };
            }
            return { success: true, data: data || [] };
        } catch (err) {
            return { success: false, error: err.message, data: [] };
        }
    },

    async getBusById(busId) {
        try {
            const { data, error } = await this.getClient().from('bus').select('*').eq('bus_id', busId).single();
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async updateBus(busId, updates) {
        const authCheck = await this.checkAuthForRLS();
        if (!authCheck.allowed) return { success: false, error: authCheck.error, code: authCheck.code, requiresRelogin: true };
        try {
            const user = this.getCurrentUser();
            const updateData = { ...updates, updated_by: user ? user.email : null, updated_at: new Date().toISOString() };
            const { data, error } = await this.getClient().from('bus').update(updateData).eq('bus_id', busId).select();
            if (error) {
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    return { success: false, error: 'RLS Policy Error: Access denied. Please logout and login again.', code: 'RLS_VIOLATION', requiresRelogin: true };
                }
                return { success: false, error: error.message };
            }
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async addBus(busData) {
        const authCheck = await this.checkAuthForRLS();
        if (!authCheck.allowed) return { success: false, error: authCheck.error, code: authCheck.code, requiresRelogin: true };
        if (!busData.bus_id || !busData.driver || !busData.route || !busData.capacity || busData.minimum_fare === undefined || !busData.departure || !busData.arrival) {
            return { success: false, error: 'Missing required fields' };
        }
        try {
            const user = this.getCurrentUser();
            const newBus = {
                bus_id: busData.bus_id, ip_ad: busData.ip_ad || null, driver: busData.driver,
                route: busData.route, capacity: parseInt(busData.capacity), minimum_fare: parseFloat(busData.minimum_fare),
                standing: parseInt(busData.standing) || 0, status: busData.status || 'active',
                departure: busData.departure, arrival: busData.arrival, frequency: busData.frequency || null,
                maximum_capacity: parseInt(busData.maximum_capacity) || parseInt(busData.capacity),
                created_by: user ? user.email : null, updated_by: user ? user.email : null,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            };
            const { data, error } = await this.getClient().from('bus').insert([newBus]).select();
            if (error) {
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    return { success: false, error: 'RLS Policy Error: Access denied. Please logout and login again.', code: 'RLS_VIOLATION', requiresRelogin: true };
                }
                return { success: false, error: error.message };
            }
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async deleteBus(busId) {
        const authCheck = await this.checkAuthForRLS();
        if (!authCheck.allowed) return { success: false, error: authCheck.error, code: authCheck.code, requiresRelogin: true };
        try {
            const { error } = await this.getClient().from('bus').delete().eq('bus_id', busId);
            if (error) return { success: false, error: error.message };
            return { success: true, message: 'Bus deleted successfully' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async getBusSchedule() {
        try {
            const { data, error } = await this.getClient().from('bus')
                .select('bus_id, route, driver, departure, arrival, frequency, capacity, standing, minimum_fare, status')
                .order('route', { ascending: true }).order('departure', { ascending: true });
            if (error) return { success: false, error: error.message, data: [] };
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message, data: [] };
        }
    }
};

// ==========================================
// REALTIME MANAGER
// ==========================================

const RealtimeManager = {
    subscriptions: new Map(),

    subscribe(table, callback, filter = null) {
        if (!supabaseClient) { console.error('Supabase not initialized'); return null; }
        const user = Auth.getCurrentUser();
        if (!user) { console.error('User not authenticated - cannot subscribe to real-time'); return null; }
        if (this.subscriptions.has(table)) this.unsubscribe(table);

        let channel = supabaseClient
            .channel(`${table}_changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table: table, filter: filter }, (payload) => {
                console.log(`Real-time update on ${table}:`, payload);
                callback(payload);
            })
            .subscribe((status, err) => {
                console.log(`Subscription status for ${table}:`, status);
                if (status === 'CHANNEL_ERROR') console.error('Subscription error:', err);
            });

        this.subscriptions.set(table, channel);
        return channel;
    },

    subscribeToPassengers(callback) { return this.subscribe('Passenger', callback); },
    subscribeToStaffChanges(callback) { return this.subscribe('Staff_Account', callback); },
    subscribeToDevices(callback) { return this.subscribe('devices', callback); },
    subscribeToFeedback(callback) { return this.subscribe('Feedback', callback); },
    subscribeToBus(callback) { return this.subscribe('bus', callback); },
    subscribeToBusGPS(callback) { return this.subscribe('bus_gps', callback); },

    unsubscribe(table) {
        if (this.subscriptions.has(table)) {
            supabaseClient.removeChannel(this.subscriptions.get(table));
            this.subscriptions.delete(table);
            console.log(`Unsubscribed from ${table}`);
        }
    },

    unsubscribeAll() {
        this.subscriptions.forEach((channel) => supabaseClient.removeChannel(channel));
        this.subscriptions.clear();
        console.log('All real-time subscriptions cleared');
    }
};

// ==========================================
// FEEDBACK API
// ==========================================

const FeedbackAPI = {
    getCurrentUser() { return Auth.getCurrentUser(); },
    getClient() { return supabaseClient; },

    async submitFeedback(name, email, message, rate) {
        const user = this.getCurrentUser();
        const { data, error } = await this.getClient().from('Feedback').insert([{
            name: name || (user ? user.fullname : 'Anonymous'),
            email: email || (user ? user.email : ''),
            message, rate, status: 'pending', reply: null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }]).select();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async getAllFeedback() {
        const { data, error } = await this.getClient().from('Feedback').select('*').order('created_at', { ascending: false });
        if (error) return { success: false, error: error.message, data: [] };
        return { success: true, data };
    },

    async getUserFeedback(userEmail) {
        const { data, error } = await this.getClient().from('Feedback').select('*').eq('email', userEmail).order('created_at', { ascending: false });
        if (error) return { success: false, error: error.message, data: [] };
        return { success: true, data };
    },

    async replyToFeedback(feedbackId, replyMessage, newStatus = 'resolved') {
        const { data, error } = await this.getClient().from('Feedback').update({ reply: replyMessage, status: newStatus, updated_at: new Date().toISOString() }).eq('id', feedbackId).select();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async updateStatus(feedbackId, status) {
        const validStatuses = ['pending', 'in_review', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) return { success: false, error: 'Invalid status' };
        const { data, error } = await this.getClient().from('Feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', feedbackId).select();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async deleteFeedback(feedbackId) {
        const { error } = await this.getClient().from('Feedback').delete().eq('id', feedbackId);
        if (error) return { success: false, error: error.message };
        return { success: true, message: 'Feedback deleted successfully' };
    }
};

// ==========================================
// PASSENGER METHODS (with RFID validation)
// ==========================================

async function validateRFID(rfid) {
    try {
        const client = await Auth.ensureSupabase();
        const { data, error } = await client.from('registration').select('RFID, fullname, email, phone, balance, profile, QR_code').eq('RFID', rfid).single();
        if (error || !data) return { valid: false, message: 'RFID not registered', data: null };
        return { valid: true, message: 'RFID validated', data };
    } catch (error) {
        return { valid: false, message: error.message, data: null };
    }
}

async function insertPassenger(passengerData) {
    try {
        const validation = await validateRFID(passengerData.RFID);
        if (!validation.valid) return { success: false, message: validation.message };
        const client = await Auth.ensureSupabase();
        const { data, error } = await client.from('Passenger').insert([{ ...passengerData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]).select();
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'Passenger added successfully', data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function getAllPassengers() {
    try {
        const client = await Auth.ensureSupabase();
        const { data, error } = await client.from('Passenger').select('*');
        if (error) return { success: false, message: error.message, data: [] };
        console.log('✅ Loaded passengers:', data?.length || 0);
        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, message: error.message, data: [] };
    }
}

async function updatePassenger(rfid, updates) {
    try {
        const client = await Auth.ensureSupabase();
        const { data, error } = await client.from('Passenger').update({ ...updates, updated_at: new Date().toISOString() }).eq('RFID', rfid).select();
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'Passenger updated successfully', data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function deletePassenger(rfid) {
    try {
        const client = await Auth.ensureSupabase();
        const { error } = await client.from('Passenger').delete().eq('RFID', rfid);
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'Passenger deleted successfully' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ==========================================
// PASSWORD RESET REQUEST
// ==========================================

async function submitAdminApprovalRequest(email) {
    try {
        const client = await Auth.ensureSupabase();
        const { data: user, error: userError } = await client.from('Staff_Account').select('id, email').eq('email', email).maybeSingle();
        if (userError || !user) return { success: false, message: 'Email not found in our system.' };
        const { data: existingRequest } = await client.from('password_reset_requests').select('id').eq('email', email).eq('status', 'pending').maybeSingle();
        if (existingRequest) return { success: false, message: 'A reset request is already pending for this email.' };
        const { error: insertError } = await client.from('password_reset_requests').insert([{ user_id: user.id, email, status: 'pending', requested_at: new Date().toISOString() }]);
        if (insertError) return { success: false, message: 'Failed to submit request.' };
        return { success: true };
    } catch (error) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

// ==========================================
// ROLE PERMISSIONS SYSTEM - RESTRICTED ACCESS
// ==========================================

const RolePermissions = {
    // View permissions - which pages each role can SEE
    viewPermissions: {
        'admin': ['dashboard', 'live-tracking', 'analytics', 'feedback', 'bus-info', 'schedule', 'top-up-reference', 'accounts'],
        'staff_operator': ['dashboard', 'live-tracking', 'feedback', 'bus-info', 'schedule', 'accounts', 'finance', 'top-up-reference'],
        'staff_finance': ['dashboard', 'analytics', 'feedback', 'bus-info', 'schedule', 'accounts', 'finance', 'top-up-reference'], // Same as admin but WITHOUT live-tracking
        'staff_loader': [  'load', 'accounts', 'finance', 'top-up-reference'],
        'driver': ['bus-info', 'schedule'],
        'developer': ['dashboard', 'live-tracking', 'analytics', 'feedback', 'bus-info', 'schedule', 'load', 'accounts', 'finance', 'top-up-reference', 'developer-logs']
    },
    
    // Modify permissions - which pages each role can EDIT/MODIFY
    modifyPermissions: {
        'admin': [], // Admin is read-only for all pages
        'staff_operator': ['dashboard', 'live-tracking', 'feedback', 'bus-info', 'schedule', 'accounts', 'finance', 'top-up-reference'],
        'staff_finance': ['dashboard', 'analytics', 'feedback', 'bus-info', 'schedule', 'accounts', 'finance', 'top-up-reference'],
        'staff_loader': ['dashboard', 'live-tracking', 'analytics', 'feedback', 'bus-info', 'schedule', 'load', 'accounts', 'finance', 'top-up-reference'],
        'driver': ['dashboard', 'live-tracking', 'analytics', 'feedback', 'bus-info', 'schedule', 'load', 'accounts', 'finance', 'top-up-reference'],
        'developer': ['dashboard', 'live-tracking', 'analytics', 'feedback', 'bus-info', 'schedule', 'load', 'accounts', 'finance', 'top-up-reference', 'developer-logs']
    },
    
    // Read-only pages for each role
    readOnlyPages: {
        'admin': ['dashboard', 'live-tracking', 'analytics', 'feedback', 'bus-info', 'schedule', 'top-up-reference', 'accounts'],
        'staff_operator': [],
        'staff_finance': [],
        'staff_loader': ['accounts'], // Loader has view-only access to accounts
        'driver': [],
        'developer': []
    },

    // Account Management tab permissions - which tabs each role can see
    accountTabPermissions: {
        'admin': ['accounts', 'passengers'],
        'staff_operator': ['accounts', 'passengers'],
        'staff_finance': ['accounts', 'passengers'],
        'staff_loader': ['passengers'], // Loader ONLY sees Passengers tab
        'driver': [],
        'developer': ['accounts', 'passengers']
    },

    canView(role, page) { 
        const rolePages = this.viewPermissions[role] || [];
        return rolePages.includes(page);
    },
    
    canModify(role, page) { 
        const rolePages = this.modifyPermissions[role] || [];
        return rolePages.includes(page);
    },
    
    isReadOnly(role, page) { 
        const readOnlyPages = this.readOnlyPages[role] || [];
        return readOnlyPages.includes(page);
    },
    
    getAvailablePages(role) { 
        return this.viewPermissions[role] || [];
    },

    getDefaultPage(role) {
        const pages = this.viewPermissions[role];
        return pages && pages.length > 0 ? pages[0] : 'dashboard';
    },

    getRoleDisplayName(role) {
        const names = {
            'admin': 'Administrator',
            'staff_operator': 'Staff Operator',
            'staff_finance': 'Finance Staff',
            'staff_loader': 'Staff Loader',
            'driver': 'Driver',
            'developer': 'Developer'
        };
        return names[role] || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};

window.RolePermissions = RolePermissions;



// ==========================================
// EXPORTS
// ==========================================

window.Auth = Auth;
window.BusAPI = BusAPI;
window.FeedbackAPI = FeedbackAPI;
window.RealtimeManager = RealtimeManager;
window.supabaseClient = supabaseClient;
window.submitAdminApprovalRequest = submitAdminApprovalRequest;
window.validateRFID = validateRFID;
window.insertPassenger = insertPassenger;
window.getAllPassengers = getAllPassengers;
window.updatePassenger = updatePassenger;
window.deletePassenger = deletePassenger;

console.log('✅ auth.js loaded successfully - RLS-enabled Auth object available at window.Auth');