const { supabase } = require('./supabase');

// Test user credentials
const testUser = {
    email: 'test@example.com',
    password: 'testPassword123!',
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
        
        if (signUpError) throw signUpError;
        console.log('Signup successful:', signUpData);

        // 2. Sign in
        console.log('\nTesting login...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
        });
        
        if (signInError) throw signInError;
        console.log('Login successful:', signInData);

        // Get the session token
        const session = signInData.session;
        console.log('\nAccess Token:', session.access_token);

        // 3. Test getting user profile
        console.log('\nTesting get user...');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        console.log('User data:', userData);

        // 4. Test sign out
        console.log('\nTesting sign out...');
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        console.log('Sign out successful');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the tests
console.log('Starting authentication tests...\n');
testAuth();
