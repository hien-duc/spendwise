const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Fixed Costs
 *   description: Fixed recurring costs management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FixedCost:
 *       type: object
 *       required:
 *         - amount
 *         - frequency
 *         - start_date
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
 *           description: Cost amount
 *         frequency:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           description: Payment frequency
 *         start_date:
 *           type: string
 *           format: date
 *           description: Start date of the cost
 *         end_date:
 *           type: string
 *           format: date
 *           description: Optional end date of the cost
 *         note:
 *           type: string
 *           description: Optional note about the cost
 *         is_active:
 *           type: boolean
 *           description: Whether the cost is active
 */

// Validation middleware
const validateFixedCost = [
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
 * /api/financial/fixed-costs:
 *   get:
 *     summary: Get all fixed costs for the authenticated user
 *     tags: [Fixed Costs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of fixed costs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FixedCost'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('fixed_costs')
            .select('*, categories(*)')
            .eq('user_id', req.user.id)
            .order('amount', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching fixed costs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-costs/{id}:
 *   get:
 *     summary: Get a specific fixed cost by ID
 *     tags: [Fixed Costs]
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
 *         description: Fixed cost details
 *       404:
 *         description: Fixed cost not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('fixed_costs')
            .select('*, categories(*)')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Fixed cost not found' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching fixed cost:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-costs:
 *   post:
 *     summary: Create a new fixed cost
 *     tags: [Fixed Costs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FixedCost'
 *     responses:
 *       201:
 *         description: Fixed cost created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', validateFixedCost, handleValidationErrors, async (req, res) => {
    try {
        const costData = {
            user_id: req.user.id,
            category_id: req.body.category_id,
            amount: req.body.amount,
            frequency: req.body.frequency,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            note: req.body.note,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true
        };

        const { data, error } = await supabase
            .from('fixed_costs')
            .insert([costData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating fixed cost:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-costs/{id}:
 *   put:
 *     summary: Update a fixed cost
 *     tags: [Fixed Costs]
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
 *             $ref: '#/components/schemas/FixedCost'
 *     responses:
 *       200:
 *         description: Fixed cost updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Fixed cost not found
 *       500:
 *         description: Server error
 */
router.put('/:id', validateFixedCost, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            category_id: req.body.category_id,
            amount: req.body.amount,
            frequency: req.body.frequency,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            note: req.body.note,
            is_active: req.body.is_active
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const { data, error } = await supabase
            .from('fixed_costs')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Fixed cost not found' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error updating fixed cost:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/fixed-costs/{id}:
 *   delete:
 *     summary: Delete a fixed cost
 *     tags: [Fixed Costs]
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
 *         description: Fixed cost deleted successfully
 *       404:
 *         description: Fixed cost not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the cost exists and belongs to the user
        const { data: existingCost, error: checkError } = await supabase
            .from('fixed_costs')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (checkError || !existingCost) {
            return res.status(404).json({ error: 'Fixed cost not found' });
        }

        // If cost exists, proceed with deletion
        const { error: deleteError } = await supabase
            .from('fixed_costs')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (deleteError) throw deleteError;

        res.json({ message: 'Fixed cost deleted successfully' });
    } catch (error) {
        console.error('Error deleting fixed cost:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
