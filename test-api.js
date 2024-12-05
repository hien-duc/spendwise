const { supabase } = require('./supabase');

// Test data
const testUser = {
    email: 'test@example.com',
    password: 'testPassword123!'
};

// Helper function to handle API responses
async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        const text = await response.text();
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers));
        console.error('Response body:', text);
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    const text = await response.text();
    console.error('Unexpected content type:', contentType);
    console.error('Response body:', text);
    throw new Error('Expected JSON response but got: ' + contentType);
}

// Test API endpoints
async function testAPI() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword(testUser);
        if (loginError) throw loginError;
        
        const token = session.access_token;
        console.log('Got access token:', token.substring(0, 20) + '...');

        // Common headers for all requests
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Test Categories API
        console.log('\nTesting Categories API...');
        
        // Create category
        console.log('Creating category...');
        const newCategory = {
            name: 'Test Category',
            type: 'expense',
            icon: 'test_icon'
        };
        
        console.log('Making POST request to /api/categories with data:', newCategory);
        const createCategoryResponse = await fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers,
            body: JSON.stringify(newCategory)
        });
        const category = await handleResponse(createCategoryResponse);
        console.log('Created category:', category);

        // Get categories
        console.log('\nGetting categories...');
        const getCategoriesResponse = await fetch('http://localhost:3000/api/categories', {
            headers
        });
        const categories = await handleResponse(getCategoriesResponse);
        console.log('Categories:', categories);

        // 3. Test Transactions API
        console.log('\nTesting Transactions API...');
        
        // Create transaction
        console.log('Creating transaction...');
        const newTransaction = {
            category_id: category.id,
            amount: 50.00,
            note: 'Test transaction',
            date: new Date().toISOString().split('T')[0],
            type: 'expense'
        };
        
        const createTransactionResponse = await fetch('http://localhost:3000/api/transactions', {
            method: 'POST',
            headers,
            body: JSON.stringify(newTransaction)
        });
        const transaction = await handleResponse(createTransactionResponse);
        console.log('Created transaction:', transaction);

        // Get transactions
        console.log('\nGetting transactions...');
        const getTransactionsResponse = await fetch('http://localhost:3000/api/transactions', {
            headers
        });
        const transactions = await handleResponse(getTransactionsResponse);
        console.log('Transactions:', transactions);

        // 4. Test Profile API
        console.log('\nTesting Profile API...');
        const getProfileResponse = await fetch('http://localhost:3000/api/profiles', {
            headers
        });
        const profile = await handleResponse(getProfileResponse);
        console.log('Profile:', profile);

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
console.log('Starting API tests...\n');
testAPI();
