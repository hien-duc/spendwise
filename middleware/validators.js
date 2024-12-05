const { body, query, param, validationResult } = require('express-validator');

// Validate transaction creation/update
exports.validateTransaction = [
    body('category_id').isUUID().withMessage('Invalid category ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('type').isIn(['expense', 'income', 'investment']).withMessage('Invalid transaction type'),
    body('note').optional().isString().trim().isLength({ max: 500 }).withMessage('Note too long'),
];

// Validate date parameters
exports.validateDate = [
    param('date').isISO8601().withMessage('Invalid date format'),
];

// Validate year/month parameters
exports.validateYearMonth = [
    param('year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
    param('month').optional().isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
];

// Validate category filters
exports.validateCategoryFilters = [
    query('year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
    query('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
    query('type').isIn(['expense', 'income', 'investment']).withMessage('Invalid type'),
];

// Middleware to check for validation errors
exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }
    next();
};
