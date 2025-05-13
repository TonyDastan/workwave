const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate.' });
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