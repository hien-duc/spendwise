const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateYearMonth, handleValidationErrors } = require('../middleware/validators');

/**
 * @swagger
 * /api/reports/monthly:
 *   get:
 *     summary: Get monthly financial report
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year for the report
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Month for the report (1-12)
 *     responses:
 *       200:
 *         description: Monthly financial report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_income:
 *                   type: number
 *                 total_expense:
 *                   type: number
 *                 net_savings:
 *                   type: number
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:
 *                         type: string
 *                       category_name:
 *                         type: string
 *                       total_amount:
 *                         type: number
 */
router.get('/monthly/:year/:month', validateYearMonth, handleValidationErrors, async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/reports/annual:
 *   get:
 *     summary: Get annual financial report
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year for the report
 *     responses:
 *       200:
 *         description: Annual financial report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 total_income:
 *                   type: number
 *                 total_expense:
 *                   type: number
 *                 net_savings:
 *                   type: number
 *                 monthly_breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: integer
 *                       income:
 *                         type: number
 *                       expense:
 *                         type: number
 */
router.get('/annual/:year', validateYearMonth, handleValidationErrors, async (req, res) => {
    try {
        const { data: income, error: incomeError } = await supabase
            .rpc('get_annual_income_by_categories', {
                user_id_param: req.user.id,
                year_param: parseInt(req.params.year)
            });
        
        if (incomeError) throw incomeError;

        const { data: expense, error: expenseError } = await supabase
            .rpc('get_annual_expense_by_categories', {
                user_id_param: req.user.id,
                year_param: parseInt(req.params.year)
            });
        
        if (expenseError) throw expenseError;

        res.json({
            income,
            expense
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/reports/all-time:
 *   get:
 *     summary: Get all-time financial summary
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All-time financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_income:
 *                   type: number
 *                 total_expense:
 *                   type: number
 *                 net_worth:
 *                   type: number
 *                 transaction_count:
 *                   type: integer
 *                 first_transaction_date:
 *                   type: string
 *                   format: date
 */
router.get('/all-time', async (req, res) => {
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
 * /api/reports/category/annual:
 *   get:
 *     summary: Get category annual report
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year for the report
 *     responses:
 *       200:
 *         description: Category annual report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:
 *                         type: string
 *                       category_name:
 *                         type: string
 *                       total_amount:
 *                         type: number
 */
router.get('/category/annual/:year', validateYearMonth, handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_category_annual_report', {
                user_id_param: req.user.id,
                year_param: parseInt(req.params.year)
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;