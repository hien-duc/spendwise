const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateCategoryFilters, handleValidationErrors } = require('../middleware/validators');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories for current user
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter categories by type
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', async (req, res) => {
    const { type } = req.query;
    try {
        let query = supabase
            .from('categories')
            .select('*')
            .eq('user_id', req.user.id);
            
        if (type) {
            query = query.eq('type', type);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.post('/', async (req, res) => {
    const { name, type, icon, color } = req.body;
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{
                user_id: req.user.id,
                name,
                type,
                icon,
                color
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', async (req, res) => {
    const { name, type, icon, color } = req.body;
    try {
        const { data, error } = await supabase
            .from('categories')
            .update({ name, type, icon, color })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .eq('is_default', false)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Category not found or cannot be modified' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 */
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .eq('is_default', false);

        if (error) throw error;
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/categories/summary:
 *   get:
 *     summary: Get category summary
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Filter by month
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by type
 *     responses:
 *       200:
 *         description: Category summary
 */
router.get('/summary', validateCategoryFilters, handleValidationErrors, async (req, res) => {
    const { year, month, type } = req.query;
    try {
        const { data, error } = await supabase
            .rpc('get_category_summary', {
                user_id_param: req.user.id,
                year_param: parseInt(year),
                month_param: parseInt(month),
                type_param: type
            });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;