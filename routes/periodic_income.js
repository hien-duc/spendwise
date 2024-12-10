const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Periodic Income
 *   description: Periodic income management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PeriodicIncome:
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
 *           description: Income amount
 *         frequency:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           description: Income frequency
 *         start_date:
 *           type: string
 *           format: date
 *           description: Start date of the income
 *         end_date:
 *           type: string
 *           format: date
 *           description: Optional end date of the income
 *         note:
 *           type: string
 *           description: Optional note about the income
 *         is_active:
 *           type: boolean
 *           description: Whether the income is active
 */

// Validation middleware
const validatePeriodicIncome = [
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
 * /api/financial/periodic-income:
 *   get:
 *     summary: Get all periodic income for the authenticated user
 *     tags: [Periodic Income]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of periodic income
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PeriodicIncome'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('periodic_income')
            .select('*, categories(*)')
            .eq('user_id', req.user.id)
            .order('amount', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching periodic income:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/periodic-income/{id}:
 *   get:
 *     summary: Get a specific periodic income by ID
 *     tags: [Periodic Income]
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
 *         description: Periodic income details
 *       404:
 *         description: Periodic income not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('periodic_income')
            .select('*, categories(*)')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Periodic income not found' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching periodic income:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/periodic-income:
 *   post:
 *     summary: Create a new periodic income
 *     tags: [Periodic Income]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PeriodicIncome'
 *     responses:
 *       201:
 *         description: Periodic income created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', validatePeriodicIncome, handleValidationErrors, async (req, res) => {
    try {
        const incomeData = {
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
            .from('periodic_income')
            .insert([incomeData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating periodic income:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/periodic-income/{id}:
 *   put:
 *     summary: Update a periodic income
 *     tags: [Periodic Income]
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
 *             $ref: '#/components/schemas/PeriodicIncome'
 *     responses:
 *       200:
 *         description: Periodic income updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Periodic income not found
 *       500:
 *         description: Server error
 */
router.put('/:id', validatePeriodicIncome, handleValidationErrors, async (req, res) => {
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
            .from('periodic_income')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Periodic income not found' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error updating periodic income:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/financial/periodic-income/{id}:
 *   delete:
 *     summary: Delete a periodic income
 *     tags: [Periodic Income]
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
 *         description: Periodic income deleted successfully
 *       404:
 *         description: Periodic income not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the income exists and belongs to the user
        const { data: existingIncome, error: checkError } = await supabase
            .from('periodic_income')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (checkError || !existingIncome) {
            return res.status(404).json({ error: 'Periodic income not found' });
        }

        // If income exists, proceed with deletion
        const { error: deleteError } = await supabase
            .from('periodic_income')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (deleteError) throw deleteError;

        res.json({ message: 'Periodic income deleted successfully' });
    } catch (error) {
        console.error('Error deleting periodic income:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
