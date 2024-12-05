const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateYearMonth, handleValidationErrors } = require('../middleware/validators');

/**
 * @swagger
 * /api/trends/{type}/{year}:
 *   get:
 *     summary: Get yearly trend by type
 *     tags: [Trends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [income, expense, investment]
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:type/:year',
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
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
            next(error);
        }
    }
);

module.exports = router;
