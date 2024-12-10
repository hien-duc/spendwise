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
    financialGoal: {
        name: 'Buy a House',
        target_amount: 500000.00,
        current_amount: 50000.00,
        deadline: '2025-12-31',
        status: 'in_progress'
    },
    fixedCost: {
        amount: 1500.00,
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
        note: 'Monthly rent payment'
    },
    periodicIncome: {
        amount: 5000.00,
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
        note: 'Monthly salary'
    },
    fixedInvestment: {
        amount: 1000.00,
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        expected_return_rate: 8.5,
        investment_type: 'Stocks',
        is_active: true,
        note: 'Monthly stock investment'
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
            body: JSON.stringify({
                name: 'Test Category',
                description: 'Test category description',
                type: 'expense',
                icon: 'test_icon',
                color: '#FF5252'
            })
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

        // 4. Test Financial Goals API
        console.log('\nTesting Financial Goals API...');
        
        // Create financial goal
        console.log('Creating financial goal...');
        response = await fetch(`${process.env.API_URL}/api/financial/financial-goals`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testData.financialGoal)
        });
        let financialGoal = await handleResponse(response);
        console.log('Financial goal created successfully');

        // Get financial goals
        console.log('Getting financial goals...');
        response = await fetch(`${process.env.API_URL}/api/financial/financial-goals`, {
            headers
        });
        const financialGoals = await handleResponse(response);
        console.log('Financial goals retrieved successfully');

        // Update financial goal
        console.log('Updating financial goal...');
        const updatedGoal = {
            ...testData.financialGoal,
            current_amount: 75000.00
        };
        response = await fetch(`${process.env.API_URL}/api/financial/financial-goals/${financialGoal.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updatedGoal)
        });
        await handleResponse(response);
        console.log('Financial goal updated successfully');

        // Delete financial goal
        console.log('Deleting financial goal...');
        response = await fetch(`${process.env.API_URL}/api/financial/financial-goals/${financialGoal.id}`, {
            method: 'DELETE',
            headers
        });
        await handleResponse(response);
        console.log('Financial goal deleted successfully');

        // 5. Test Fixed Costs API
        console.log('\nTesting Fixed Costs API...');
        
        // Create fixed cost
        console.log('Creating fixed cost...');
        response = await fetch(`${process.env.API_URL}/api/financial/fixed-costs`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testData.fixedCost)
        });
        let fixedCost = await handleResponse(response);
        console.log('Fixed cost created successfully');

        // Get fixed costs
        console.log('Getting fixed costs...');
        response = await fetch(`${process.env.API_URL}/api/financial/fixed-costs`, {
            headers
        });
        await handleResponse(response);
        console.log('Fixed costs retrieved successfully');

        // Delete fixed cost
        console.log('Deleting fixed cost...');
        response = await fetch(`${process.env.API_URL}/api/financial/fixed-costs/${fixedCost.id}`, {
            method: 'DELETE',
            headers
        });
        await handleResponse(response);
        console.log('Fixed cost deleted successfully');

        // 6. Test Periodic Income API
        console.log('\nTesting Periodic Income API...');
        
        // Create periodic income
        console.log('Creating periodic income...');
        response = await fetch(`${process.env.API_URL}/api/financial/periodic-income`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testData.periodicIncome)
        });
        let periodicIncome = await handleResponse(response);
        console.log('Periodic income created successfully');

        // Get periodic income
        console.log('Getting periodic income...');
        response = await fetch(`${process.env.API_URL}/api/financial/periodic-income`, {
            headers
        });
        await handleResponse(response);
        console.log('Periodic income retrieved successfully');

        // Delete periodic income
        console.log('Deleting periodic income...');
        response = await fetch(`${process.env.API_URL}/api/financial/periodic-income/${periodicIncome.id}`, {
            method: 'DELETE',
            headers
        });
        await handleResponse(response);
        console.log('Periodic income deleted successfully');

        // 7. Test Fixed Investments API
        console.log('\nTesting Fixed Investments API...');
        
        // Create fixed investment
        console.log('Creating fixed investment...');
        response = await fetch(`${process.env.API_URL}/api/financial/fixed-investments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testData.fixedInvestment)
        });
        let fixedInvestment = await handleResponse(response);
        console.log('Fixed investment created successfully');

        // Get fixed investments
        console.log('Getting fixed investments...');
        response = await fetch(`${process.env.API_URL}/api/financial/fixed-investments`, {
            headers
        });
        await handleResponse(response);
        console.log('Fixed investments retrieved successfully');

        // Delete fixed investment
        console.log('Deleting fixed investment...');
        response = await fetch(`${process.env.API_URL}/api/financial/fixed-investments/${fixedInvestment.id}`, {
            method: 'DELETE',
            headers
        });
        await handleResponse(response);
        console.log('Fixed investment deleted successfully');

        // 8. Test Transactions API
        console.log('\nTesting Transactions API...');
        
        // Create transaction
        console.log('Creating transaction...');
        const transactionData = {
            amount: 100.00,
            description: 'Test transaction',
            type: 'expense',
            date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
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

        // Delete transaction
        console.log('Deleting transaction...');
        response = await fetch(`${process.env.API_URL}/api/transactions/${transaction.id}`, {
            method: 'DELETE',
            headers
        });
        await handleResponse(response);
        console.log('Transaction deleted successfully');

        // 9. Generate Recurring Transactions
        console.log('\nTesting Transaction Generation...');
        
        // Trigger transaction generation
        console.log('Generating recurring transactions...');
        response = await fetch(`${process.env.API_URL}/api/financial/generate-transactions`, {
            method: 'POST',
            headers
        });
        await handleResponse(response);
        console.log('Transactions generated successfully');

        // Verify generated transactions
        console.log('Verifying generated transactions...');
        response = await fetch(`${process.env.API_URL}/api/transactions`, {
            headers
        });
        const generatedTransactions = await handleResponse(response);
        console.log('Transaction verification successful');

        // 10. Cleanup
        console.log('\nCleaning up test data...');
        
        // Delete category
        console.log('Deleting category...');
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
