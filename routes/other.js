const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateYearMonth, handleValidationErrors } = require('../middleware/validators');


/**
 * @swagger
 * /api/other/annual-transactions/{year}:
 *   get:
 *     summary: Get annual transactions report with monthly breakdown
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Annual transactions report with monthly breakdown and totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 month_number:
 *                   type: integer
 *                 month_name:
 *                   type: string
 *                 income_amount:
 *                   type: number
 *                 expense_amount:
 *                   type: number
 *                 investment_amount:
 *                   type: number
 *                 running_income_total:
 *                   type: number
 *                 running_expense_total:
 *                   type: number
 *                 running_investment_total:
 *                   type: number
 *                 year_to_date_income_total:
 *                   type: number
 *                 year_to_date_expense_total:
 *                   type: number
 *                 year_to_date_investment_total:
 *                   type: number
 */
router.get('/annual-transactions/:year', handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_annual_transactions_report', {
                user_id_param: req.user.id,
                year_param: parseInt(req.params.year)
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/other/annual-trend/{year}:
 *   get:
 *     summary: Get annual transaction trends with running totals
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Annual transaction trends with monthly breakdown and totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year_number:
 *                   type: integer
 *                 month_number:
 *                   type: integer
 *                 month_name:
 *                   type: string
 *                 income_amount:
 *                   type: number
 *                 income_running_total:
 *                   type: number
 *                 income_year_total:
 *                   type: number
 *                 expense_amount:
 *                   type: number
 *                 expense_running_total:
 *                   type: number
 *                 expense_year_total:
 *                   type: number
 *                 investment_amount:
 *                   type: number
 *                 investment_running_total:
 *                   type: number
 *                 investment_year_total:
 *                   type: number
 */
router.get('/annual-trend/:year', handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_annual_transactions_trend', {
                user_id_param: req.user.id,
                year_param: parseInt(req.params.year)
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/other/annual-categories/{year}:
 *   get:
 *     summary: Get annual transactions summary by categories
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Annual transactions summary grouped by categories with percentages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category_name:
 *                   type: string
 *                 category_icon:
 *                   type: string
 *                 category_color:
 *                   type: string
 *                 total_amount:
 *                   type: number
 *                 percentage:
 *                   type: number
 *                 transaction_type:
 *                   type: string
 */
router.get('/annual-categories/:year', handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_annual_categories_summary', {
                user_id_param: req.user.id,
                year_param: parseInt(req.params.year)
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/other/all-time-balance:
 *   get:
 *     summary: Get all-time financial report with cumulative balance
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All-time financial report with monthly breakdown and cumulative balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 month:
 *                   type: integer
 *                 month_name:
 *                   type: string
 *                 income_amount:
 *                   type: number
 *                 expense_amount:
 *                   type: number
 *                 investment_amount:
 *                   type: number
 *                 net_amount:
 *                   type: number
 *                 initial_balance:
 *                   type: number
 *                 cumulative_balance:
 *                   type: number
 */
router.get('/all-time-balance', async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_all_time_balance_report', {
                user_id_param: req.user.id
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/other/all-time-categories:
 *   get:
 *     summary: Get all-time transactions summary by categories
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All-time transactions summary grouped by categories with percentages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category_name:
 *                   type: string
 *                 category_icon:
 *                   type: string
 *                 category_color:
 *                   type: string
 *                 total_amount:
 *                   type: number
 *                 percentage:
 *                   type: number
 *                 transaction_type:
 *                   type: string
 */
router.get('/all-time-categories', async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_all_time_categories_summary', {
                user_id_param: req.user.id
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/other/recent-years-summary:
 *   get:
 *     summary: Get financial summary for 5 most recent years
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Financial summary showing income, expense, and net amount for the 5 most recent years
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   year:
 *                     type: integer
 *                   total_income:
 *                     type: number
 *                   total_expense:
 *                     type: number
 *                   net_amount:
 *                     type: number
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Internal server error
 */
router.get('/recent-years-summary', async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_recent_years_summary', {
            user_id_param: req.user.id
        });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error getting recent years summary:', error);
        res.status(500).json({ error: 'Failed to get recent years summary' });
    }
});


/**
 * @swagger
 * /api/other/top-categories-all-time:
 *   get:
 *     summary: Get top 5 categories by percentage with remaining as 'others' for all time
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Top 5 categories with their percentages and others combined for all time
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   percentage:
 *                     type: number
 *                   icon:
 *                     type: string
 *                   color:
 *                     type: string
 */
router.get('/top-categories-all-time', handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_top_categories_percentage_all_time', {
                user_id_param: req.user.id
            });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/other/top-categories-recent-years:
 *   get:
 *     summary: Get top 5 categories by percentage for the most recent 5 years
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Top 5 categories with their percentages for each of the last 5 years
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   year:
 *                     type: integer
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         category:
 *                           type: string
 *                         percentage:
 *                           type: number
 *                         icon:
 *                           type: string
 *                         color:
 *                           type: string
 */
router.get('/top-categories-recent-years', handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_top_categories_recent_years', {
                user_id_param: req.user.id
            });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;