const { supabase } = require('./supabase');
require('dotenv').config();

// Check required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Error: ${envVar} environment variable is required`);
        process.exit(1);
    }
}

// Test user credentials
const testUser = {
    email: 'test_user_' + Date.now() + '@example.com',
    password: 'Test@Password123!',
    name: 'Test User'
};

// Test functions
async function testAuth() {
    try {
        // 1. Sign up
        console.log('Testing signup...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testUser.email,
            password: testUser.password,
            options: {
                data: {
                    name: testUser.name
                }
            }
        });
        
        if (signUpError) {
            console.error('Signup error:', signUpError.message);
            throw signUpError;
        }
        console.log('Signup successful');

        // 2. Sign in
        console.log('\nTesting login...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
        });
        
        if (signInError) {
            console.error('Login error:', signInError.message);
            throw signInError;
        }
        console.log('Login successful');

        // Get and verify the session token
        const session = signInData.session;
        console.log('\nSession verified:', !!session.access_token);

        // 3. Test getting user profile
        console.log('\nTesting get user...');
        const { data: userData, error: userError } = await supabase.auth.getUser(session.access_token);
        if (userError) {
            console.error('Get user error:', userError.message);
            throw userError;
        }
        console.log('User data retrieved successfully');

        // 4. Test sign out
        console.log('\nTesting sign out...');
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
            console.error('Sign out error:', signOutError.message);
            throw signOutError;
        }
        console.log('Sign out successful');

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
console.log('Starting authentication tests...\n');
testAuth().then(() => {
    console.log('\nAll authentication tests completed successfully');
}).catch(error => {
    console.error('Test suite failed:', error.message);
});
