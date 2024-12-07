const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateYearMonth, handleValidationErrors } = require('../middleware/validators');

/**
 * @swagger
 * /api/trends/yearly:
 *   get:
 *     summary: Get yearly transaction trends
 *     tags: [Trends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter trends by transaction type
 *     responses:
 *       200:
 *         description: Yearly transaction trends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   year:
 *                     type: integer
 *                   month:
 *                     type: integer
 *                   total_amount:
 *                     type: number
 *                   transaction_count:
 *                     type: integer
 *                   average_amount:
 *                     type: number
 */
router.get('/yearly', async (req, res) => {
    const { type } = req.query;
    try {
        const { data, error } = await supabase
            .rpc('get_yearly_trends', {
                user_id_param: req.user.id,
                type_param: type
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/trends/category:
 *   get:
 *     summary: Get category spending trends
 *     tags: [Trends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year for the trends
 *     responses:
 *       200:
 *         description: Category spending trends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category_id:
 *                     type: string
 *                   category_name:
 *                     type: string
 *                   monthly_amounts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         month:
 *                           type: integer
 *                         amount:
 *                           type: number
 */
router.get('/category', async (req, res) => {
    const { year } = req.query;
    try {
        const { data, error } = await supabase
            .rpc('get_category_trends', {
                user_id_param: req.user.id,
                year_param: parseInt(year)
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get yearly trend by type
router.get('/:type/:year', validateYearMonth, handleValidationErrors, async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;