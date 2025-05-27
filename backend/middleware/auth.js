const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user using userId from token
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// Middleware to check if user is worker
const isWorker = async (req, res, next) => {
    try {
        if (req.user.role !== 'worker') {
            return res.status(403).json({ message: 'Access denied. Workers only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// Middleware to check if user is client
const isClient = async (req, res, next) => {
    try {
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Access denied. Clients only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    auth,
    isAdmin,
    isWorker,
    isClient
}; 