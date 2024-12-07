const { supabase } = require('./supabase');
require('dotenv').config();

// Check required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'API_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Error: ${envVar} environment variable is required`);
        process.exit(1);
    }
}

// Default to localhost if API_URL is not set
if (!process.env.API_URL) {
    process.env.API_URL = 'http://localhost:3000';
}

// Test data
const testUser = {
    email: 'test_user_' + Date.now() + '@example.com',
    password: 'Test@Password123!'
};

const testData = {
    category: {
        name: 'Test Category',
        description: 'Test category description',
        type: 'expense',
        icon: 'test_icon',
        color: '#FF5252'
    },
    transaction: {
        amount: 100.00,
        description: 'Test transaction',
        type: 'expense',
        date: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
    }
};

// Helper function to handle API responses
async function handleResponse(response) {
    try {
        const contentType = response.headers.get('content-type');
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response status:', response.status);
            console.error('Response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        
        const text = await response.text();
        if (!text) return null;
        throw new Error('Expected JSON response but got: ' + contentType);
    } catch (error) {
        console.error('Response handling error:', error.message);
        throw error;
    }
}

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test API endpoints
async function testAPI() {
    try {
        // 1. Create test user
        console.log('Creating test user...');
        const { error: signUpError } = await supabase.auth.signUp({
            email: testUser.email,
            password: testUser.password
        });
        if (signUpError) throw signUpError;
        
        // Wait for registration to complete
        console.log('Waiting for registration to complete...');
        await wait(2000);

        // 2. Login to get token
        console.log('Logging in...');
        const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword(testUser);
        if (loginError) {
            console.error('Login error:', loginError.message);
            throw loginError;
        }
        console.log('Login successful');

        const token = session.access_token;
        
        // Common headers for all requests
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 3. Test Categories API
        console.log('\nTesting Categories API...');
        
        // Create category
        console.log('Creating category...');
        let response = await fetch(`${process.env.API_URL}/api/categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testData.category)
        });
        let category = await handleResponse(response);
        console.log('Category created successfully');

        // Get categories
        console.log('Getting categories...');
        response = await fetch(`${process.env.API_URL}/api/categories`, {
            headers
        });
        const categories = await handleResponse(response);
        console.log('Categories retrieved successfully');

        // 4. Test Transactions API
        console.log('\nTesting Transactions API...');
        
        // Create transaction
        console.log('Creating transaction...');
        const transactionData = {
            ...testData.transaction,
            category_id: category.id
        };
        
        response = await fetch(`${process.env.API_URL}/api/transactions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(transactionData)
        });
        let transaction = await handleResponse(response);
        console.log('Transaction created successfully');

        // Get transactions
        console.log('Getting transactions...');
        response = await fetch(`${process.env.API_URL}/api/transactions`, {
            headers
        });
        const transactions = await handleResponse(response);
        console.log('Transactions retrieved successfully');

        // 5. Cleanup
        console.log('\nCleaning up test data...');
        
        // Delete transaction
        response = await fetch(`${process.env.API_URL}/api/transactions/${transaction.id}`, {
            method: 'DELETE',
            headers
        });
        await handleResponse(response);
        console.log('Transaction deleted successfully');

        // Delete category
        response = await fetch(`${process.env.API_URL}/api/categories/${category.id}`, {
            method: 'DELETE',
            headers
        });
        await handleResponse(response);
        console.log('Category deleted successfully');

        // Sign out
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        console.log('\nSigned out successfully');

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
console.log('Starting API tests...\n');
testAPI().then(() => {
    console.log('\nAll API tests completed successfully');
}).catch(error => {
    console.error('Test suite failed:', error.message);
});
