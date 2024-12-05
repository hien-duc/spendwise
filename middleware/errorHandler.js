// Error types
const ErrorTypes = {
    VALIDATION_ERROR: 'ValidationError',
    AUTH_ERROR: 'AuthenticationError',
    NOT_FOUND: 'NotFoundError',
    DATABASE_ERROR: 'DatabaseError',
    RATE_LIMIT_ERROR: 'RateLimitError',
};

// Custom error class
class AppError extends Error {
    constructor(type, message, statusCode) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.type || 'UnknownError'}: ${err.message}`);
    console.error(err.stack);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'An unexpected error occurred';
    let type = err.type || 'UnknownError';

    // Handle Supabase errors
    if (err.message?.includes('JWT')) {
        statusCode = 401;
        type = ErrorTypes.AUTH_ERROR;
        message = 'Authentication failed';
    }

    // Database errors
    if (err.code?.startsWith('22') || err.code?.startsWith('23')) {
        statusCode = 400;
        type = ErrorTypes.DATABASE_ERROR;
        message = 'Invalid data provided';
    }

    res.status(statusCode).json({
        error: {
            type,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        }
    });
};

module.exports = {
    ErrorTypes,
    AppError,
    errorHandler,
};
