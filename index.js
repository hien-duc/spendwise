const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const {
    validateTransaction,
    validateDate,
    validateYearMonth,
    validateCategoryFilters,
    handleValidationErrors
} = require('./middleware/validators');
const { errorHandler } = require('./middleware/errorHandler');
const authenticateUser = require('./middleware/auth');
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

// Authentication middleware
app.post('/api/transactions',
    authenticateUser,
    validateTransaction,
    handleValidationErrors,
    async (req, res, next) => {
        const { category_id, amount, note, date, type } = req.body;
        try {
            const { data, error } = await supabase
                .rpc('create_transaction', {
                    user_id_param: req.user.id,
                    category_id_param: category_id,
                    amount_param: amount,
                    note_param: note,
                    date_param: date,
                    type_param: type
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/transactions/:date',
    authenticateUser,
    validateDate,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_transactions_by_date', {
                    user_id_param: req.user.id,
                    date_param: req.params.date
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/categories/summary',
    authenticateUser,
    validateCategoryFilters,
    handleValidationErrors,
    async (req, res, next) => {
        const { year, month, type } = req.query;
        try {
            const { data, error } = await supabase
                .rpc('get_category_summary', {
                    user_id_param: req.user.id,
                    year_param: parseInt(year),
                    month_param: parseInt(month),
                    type_param: type
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/categories/breakdown',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        const { year, month, type } = req.query;
        try {
            const { data, error } = await supabase
                .rpc('get_category_breakdown_by_type', {
                    user_id_param: req.user.id,
                    year_param: parseInt(year),
                    month_param: parseInt(month),
                    type_param: type
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/monthly-balance/:year/:month',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_monthly_balance_by_month_year', {
                    user_id_param: req.user.id,
                    year_param: parseInt(req.params.year),
                    month_param: parseInt(req.params.month)
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/trends/:type/:year',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        const { type, year } = req.params;
        try {
            const { data, error } = await supabase
                .rpc(`get_monthly_${type}_trend`, {
                    user_id_param: req.user.id,
                    year_param: parseInt(year)
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/trends/income/:year',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_monthly_income_trend', {
                    user_id_param: req.user.id,
                    year_param: parseInt(req.params.year)
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/trends/expense/:year',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_monthly_expense_trend', {
                    user_id_param: req.user.id,
                    year_param: parseInt(req.params.year)
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/trends/investment/:year',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_monthly_investment_trend', {
                    user_id_param: req.user.id,
                    year_param: parseInt(req.params.year)
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/annual/income/:year',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_annual_income_by_categories', {
                    user_id_param: req.user.id,
                    year_param: parseInt(req.params.year)
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/annual/expense/:year',
    authenticateUser,
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_annual_expense_by_categories', {
                    user_id_param: req.user.id,
                    year_param: parseInt(req.params.year)
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/all-time/investment',
    authenticateUser,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_all_time_investment_by_categories', {
                    user_id_param: req.user.id
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

app.get('/api/all-time/balance',
    authenticateUser,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_all_time_balance_report', {
                    user_id_param: req.user.id
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});
