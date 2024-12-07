const { body, query, param, validationResult } = require('express-validator');

const validateTransaction = [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('type').isIn(['expense', 'income', 'investment']).withMessage('Invalid transaction type'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('category_id').isUUID().withMessage('Invalid category ID'),
    body('note').optional().isString().withMessage('Note must be a string')
];

const validateDate = [
    param('date').isISO8601().withMessage('Invalid date format')
];

const validateYearMonth = [
    param('year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
    param('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month')
];

const validateCategoryFilters = [
    query('year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
    query('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
    query('type').isIn(['expense', 'income', 'investment']).withMessage('Invalid type')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateTransaction,
    validateDate,
    validateYearMonth,
    validateCategoryFilters,
    handleValidationErrors
};
