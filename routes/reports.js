const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { validateYearMonth, handleValidationErrors } = require('../middleware/validators');

/**
 * @swagger
 * /api/reports/monthly-balance/{year}/{month}:
 *   get:
 *     summary: Get monthly balance
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/monthly-balance/:year/:month',
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_monthly_balance_by_month_year', {
                    user_id_param: req.user.id,
                    year_param: parseInt(req.params.year),
                    month_param: parseInt(req.params.month)
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
 * /api/reports/annual/{type}/{year}:
 *   get:
 *     summary: Get annual report by type
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: path
 *         name: year
 *         schema:
 *           type: integer
 */
router.get('/annual/:type/:year',
    validateYearMonth,
    handleValidationErrors,
    async (req, res, next) => {
        const { type, year } = req.params;
        try {
            const { data, error } = await supabase
                .rpc(`get_annual_${type}_by_categories`, {
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

/**
 * @swagger
 * /api/reports/all-time/balance:
 *   get:
 *     summary: Get all-time balance report
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 */
router.get('/all-time/balance',
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .rpc('get_all_time_balance_report', {
                    user_id_param: req.user.id
                });
            if (error) throw error;
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
