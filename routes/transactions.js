const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateTransaction, validateDate, handleValidationErrors, validateYearMonth } = require('../middleware/validators');

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateTransaction, handleValidationErrors, async (req, res) => {
    const { category_id, amount, note, date, type } = req.body;
    try {
        const { data, error } = await supabase
            .from('transactions')
            .insert([{
                user_id: req.user.id,
                category_id,
                amount,
                note,
                date,
                type
            }])
            .select('*, categories(*)')
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions for the authenticated user
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, categories(*)')
            .eq('user_id', req.user.id)
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/transactions/date/{date}:
 *   get:
 *     summary: Get transactions by date
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of transactions for the date
 */
router.get('/date/:date', validateDate, handleValidationErrors, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, categories(*)')
            .eq('user_id', req.user.id)
            .eq('date', req.params.date)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 */
router.put('/:id', validateTransaction, handleValidationErrors, async (req, res) => {
    const { category_id, amount, note, date, type } = req.body;
    try {
        const { data, error } = await supabase
            .from('transactions')
            .update({
                category_id,
                amount,
                note,
                date,
                type
            })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select('*, categories(*)')
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 */
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/transactions/calendar/{year}/{month}:
 *   get:
 *     summary: Get monthly calendar data with transactions and totals
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year for the calendar data
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Month for the calendar data (1-12)
 *     responses:
 *       200:
 *         description: Monthly calendar data with transactions and totals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   transaction_id:
 *                     type: string
 *                     format: uuid
 *                   transaction_date:
 *                     type: string
 *                     format: date
 *                   category_id:
 *                     type: string
 *                     format: uuid
 *                   category_name:
 *                     type: string
 *                   category_icon:
 *                     type: string
 *                   category_color:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   transaction_type:
 *                     type: string
 *                     enum: [income, expense, investment]
 *                   note:
 *                     type: string
 *                   month_total_income:
 *                     type: number
 *                   month_total_expense:
 *                     type: number
 *                   month_total_investment:
 *                     type: number
 *                   month_net_balance:
 *                     type: number
 */
router.get('/calendar/:year/:month', validateYearMonth, handleValidationErrors, async (req, res) => {
    const { year, month } = req.params;
    try {
        const { data, error } = await supabase
            .rpc('get_monthly_calendar_data', {
                user_id_param: req.user.id,
                year_param: parseInt(year),
                month_param: parseInt(month)
            });
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
