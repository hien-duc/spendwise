const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateYearMonth, handleValidationErrors } = require('../middleware/validators');

/**
 * @swagger
 * /api/reports/monthly/{year}/{month}:
 *   get:
 *     summary: Get detailed monthly report with category breakdowns and totals
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monthly report with totals and category breakdowns
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_income:
 *                   type: number
 *                 total_expense:
 *                   type: number
 *                 total_investment:
 *                   type: number
 *                 net_balance:
 *                   type: number
 *                 category_name:
 *                   type: string
 *                 category_icon:
 *                   type: string
 *                 category_color:
 *                   type: string
 *                 category_type:
 *                   type: string
 *                 category_amount:
 *                   type: number
 *                 category_percentage:
 *                   type: number
 */
router.get('/monthly/:year/:month', validateYearMonth, handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_monthly_report_data', {
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
 * /api/reports/category-trend/{year}/{categoryId}:
 *   get:
 *     summary: Get category trend data for a specific year
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Monthly trend data for the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 month:
 *                   type: integer
 *                 month_name:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 category_name:
 *                   type: string
 *                 category_icon:
 *                   type: string
 *                 category_color:
 *                   type: string
 *                 category_type:
 *                   type: string
 *                 date_label:
 *                   type: string
 *                 latest_transaction_date:
 *                   type: string
 *                   format: date
 */
router.get('/category-trend/:year/:categoryId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_category_trend_detail', {
                user_id_param: req.user.id,
                year_param: parseInt(req.params.year),
                category_id_param: req.params.categoryId
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;