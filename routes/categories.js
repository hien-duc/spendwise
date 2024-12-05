const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { 
    validateCategoryFilters,
    validateYearMonth,
    handleValidationErrors 
} = require('../middleware/validators');

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
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [expense, income, investment]
 *     responses:
 *       200:
 *         description: Category summary data
 *       401:
 *         description: Unauthorized
 */
router.get('/summary',
    validateCategoryFilters,
    handleValidationErrors,
    async (req, res, next) => {
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
            next(error);
        }
    }
);

/**
 * @swagger
 * /api/categories/breakdown:
 *   get:
 *     summary: Get category breakdown
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [expense, income, investment]
 *     responses:
 *       200:
 *         description: Category breakdown data
 */
router.get('/breakdown',
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        const { year, month, type } = req.query;
        try {
            const { data, error } = await supabase
                .rpc('get_category_breakdown_by_type', {
                    user_id_param: req.user.id,
                    year_param: parseInt(year),
                    month_param: parseInt(month),
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
 * /api/categories:
 *   get:
 *     summary: Get all categories for the user
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', req.user.id)
            .order('name');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a category by ID
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
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Category not found' });
        }
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
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [expense, income, investment]
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', async (req, res) => {
    const { name, type, icon } = req.body;
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([
                { 
                    user_id: req.user.id,
                    name,
                    type,
                    icon,
                    is_default: false
                }
            ])
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', async (req, res) => {
    const { name, icon } = req.body;
    try {
        const { data, error } = await supabase
            .from('categories')
            .update({ name, icon })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Category not found' });
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

module.exports = router;
