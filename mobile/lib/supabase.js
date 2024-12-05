import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ejrdbduxshcpvmgcmcuy.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});

// Helper to get current session
export const getCurrentSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error getting session:', error.message);
        return null;
    }
};

// Helper to get current user
export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting user:', error.message);
        return null;
    }
};

// Helper to get access token
export const getAccessToken = async () => {
    try {
        const session = await getCurrentSession();
        return session?.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.message);
        return null;
    }
};
