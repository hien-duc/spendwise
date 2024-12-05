const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const { errorHandler } = require('./middleware/errorHandler');
const authenticateUser = require('./middleware/auth');
const {
    validateTransaction,
    validateDate,
    validateYearMonth,
    validateCategoryFilters,
    handleValidationErrors
} = require('./middleware/validators');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = 'https://ejrdbduxshcpvmgcmcuy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Swagger UI options
const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "SpendWise API Documentation"
};

// Middleware
app.use(
    helmet({
        contentSecurityPolicy: false, // Disable CSP for Swagger UI
    })
);
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Import routes
const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');
const reportsRouter = require('./routes/reports');
const trendsRouter = require('./routes/trends');
const profilesRouter = require('./routes/profiles');

// Mount routes
app.use('/api/transactions', authenticateUser, transactionsRouter);
app.use('/api/categories', authenticateUser, categoriesRouter);
app.use('/api/reports', authenticateUser, reportsRouter);
app.use('/api/trends', authenticateUser, trendsRouter);
app.use('/api/profiles', authenticateUser, profilesRouter);

// Error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});
