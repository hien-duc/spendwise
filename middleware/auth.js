const { supabase } = require('../supabase');

/**
 * Middleware to authenticate users using Supabase JWT tokens
 * Expects a Bearer token in the Authorization header
 */
const authenticateUser = async (req, res, next) => {
    // Skip auth for Swagger documentation
    if (req.path === '/api-docs' || req.path.startsWith('/api-docs/')) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please provide a valid Bearer token in the Authorization header'
        });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
            console.error('Auth error:', error.message);
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'The provided authentication token is invalid or expired'
            });
        }

        if (!user) {
            return res.status(401).json({ 
                error: 'User not found',
                message: 'No user associated with this token'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(500).json({ 
            error: 'Authentication failed',
            message: 'An error occurred while authenticating the user'
        });
    }
};

module.exports = authenticateUser;
