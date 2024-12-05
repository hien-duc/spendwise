const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { 
    validateTransaction, 
    validateDate,
    handleValidationErrors 
} = require('../middleware/validators');

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
 *       200:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
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

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    try {
        const { data, error, count } = await supabase
            .from('transactions')
            .select('*, categories(name, icon)', { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        res.json({
            data,
            total: count,
            limit,
            offset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
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
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, categories(name, icon)')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
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
 * /api/transactions/{date}:
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
 *         description: Date to fetch transactions for
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/:date',
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
 */
router.put('/:id', 
    validateTransaction,
    handleValidationErrors,
    async (req, res) => {
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
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

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

module.exports = router;
