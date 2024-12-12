const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated profile ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         currency:
 *           type: string
 *           description: User's preferred currency
 *           default: USD
 *         initial_balance:
 *           type: number
 *           format: decimal
 *           description: User's initial balance
 *           default: 0.00
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Profile creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Profile last update timestamp
 */

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/profiles:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               currency:
 *                 type: string
 *                 description: User's preferred currency
 *               initial_balance:
 *                 type: number
 *                 format: decimal
 *                 description: User's initial balance
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/', async (req, res) => {
    try {
        const { name, email, currency, initial_balance } = req.body;
        const updates = {};
        
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (currency) updates.currency = currency;
        if (initial_balance !== undefined) updates.initial_balance = initial_balance;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/profiles:
 *   delete:
 *     summary: Delete current user's profile
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.delete('/', async (req, res) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/profiles/initial-balance:
 *   patch:
 *     summary: Update user's initial balance
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - initial_balance
 *             properties:
 *               initial_balance:
 *                 type: number
 *                 format: decimal
 *                 description: User's new initial balance
 *     responses:
 *       200:
 *         description: Initial balance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid balance value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.patch('/initial-balance', async (req, res) => {
    try {
        const { initial_balance } = req.body;

        if (initial_balance === undefined) {
            return res.status(400).json({ error: 'Initial balance is required' });
        }

        if (typeof initial_balance !== 'number' || isNaN(initial_balance)) {
            return res.status(400).json({ error: 'Initial balance must be a valid number' });
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ 
                initial_balance,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;