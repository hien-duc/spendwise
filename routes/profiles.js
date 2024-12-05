const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');

// Get user profile
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
router.put('/', async (req, res) => {
    const { name, email, initial_balance } = req.body;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ name, email, initial_balance })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user profile (this will cascade delete all user data)
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

module.exports = router;
