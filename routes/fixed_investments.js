const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Fixed Investments
 *   description: Fixed investment management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FixedInvestment:
 *       type: object
 *       required:
 *         - amount
 *         - frequency
 *         - start_date
 *         - investment_type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID from auth
 *         category_id:
 *           type: string
 *           format: uuid
 *           description: Category ID reference
 *         amount:
 *           type: number
 *           format: decimal
 *           description: Investment amount
 *         frequency:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           description: Investment frequency
 *         start_date:
 *           type: string
 *           format: date
 *           description: Start date of the investment
 *         end_date:
 *           type: string
 *           format: date
 *           description: Optional end date of the investment
 *         expected_return_rate:
 *           type: number
 *           format: decimal
 *           description: Expected return rate percentage
 *         investment_type:
 *           type: string
 *           description: Type of investment
 *         note:
 *           type: string
 *           description: Optional note about the investment
 *         is_active:
 *           type: boolean
 *           description: Whether the investment is active
 */

// Validation middleware
const validateFixedInvestment = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('frequency')
        .isIn(['daily', 'weekly', 'monthly', 'yearly'])
        .withMessage('Invalid frequency'),
    body('start_date')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    body('category_id')
        .optional()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    body('expected_return_rate')
        .optional()
        .isFloat({ min: -100, max: 1000 })
        .withMessage('Expected return rate must be a valid percentage'),
    body('investment_type')
        .notEmpty()
        .withMessage('Investment type is required')
        .trim(),
    body('note')
        .optional()
        .isString()
        .trim()
        .withMessage('Note must be a string'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('Is active must be a boolean')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * @swagger
 * /api/financial/fixed-investments:
 *   get:
 *     summary: Get all fixed investments for the authenticated user
 *     tags: [Fixed Investments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of fixed investments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FixedInvestment'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('fixed_investments')
            .select('*, categories(*)')
            .eq('user_id', req.user.id)
            .order('amount', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching fixed investments:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-investments/{id}:
 *   get:
 *     summary: Get a specific fixed investment by ID
 *     tags: [Fixed Investments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fixed investment details
 *       404:
 *         description: Fixed investment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('fixed_investments')
            .select('*, categories(*)')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Fixed investment not found' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching fixed investment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-investments:
 *   post:
 *     summary: Create a new fixed investment
 *     tags: [Fixed Investments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FixedInvestment'
 *     responses:
 *       201:
 *         description: Fixed investment created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', validateFixedInvestment, handleValidationErrors, async (req, res) => {
    try {
        const investmentData = {
            user_id: req.user.id,
            category_id: req.body.category_id,
            amount: req.body.amount,
            frequency: req.body.frequency,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            expected_return_rate: req.body.expected_return_rate,
            investment_type: req.body.investment_type,
            note: req.body.note,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true
        };

        const { data, error } = await supabase
            .from('fixed_investments')
            .insert([investmentData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating fixed investment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-investments/{id}:
 *   put:
 *     summary: Update a fixed investment
 *     tags: [Fixed Investments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FixedInvestment'
 *     responses:
 *       200:
 *         description: Fixed investment updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Fixed investment not found
 *       500:
 *         description: Server error
 */
router.put('/:id', validateFixedInvestment, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            category_id: req.body.category_id,
            amount: req.body.amount,
            frequency: req.body.frequency,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            expected_return_rate: req.body.expected_return_rate,
            investment_type: req.body.investment_type,
            note: req.body.note,
            is_active: req.body.is_active
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const { data, error } = await supabase
            .from('fixed_investments')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Fixed investment not found' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error updating fixed investment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-investments/{id}:
 *   delete:
 *     summary: Delete a fixed investment
 *     tags: [Fixed Investments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fixed investment deleted successfully
 *       404:
 *         description: Fixed investment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the investment exists and belongs to the user
        const { data: existingInvestment, error: checkError } = await supabase
            .from('fixed_investments')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (checkError || !existingInvestment) {
            return res.status(404).json({ error: 'Fixed investment not found' });
        }

        // If investment exists, proceed with deletion
        const { error: deleteError } = await supabase
            .from('fixed_investments')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (deleteError) throw deleteError;

        res.json({ message: 'Fixed investment deleted successfully' });
    } catch (error) {
        console.error('Error deleting fixed investment:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
