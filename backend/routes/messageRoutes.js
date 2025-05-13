const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    sendMessage,
    getTaskMessages,
    getUnreadCount,
    markAsRead
} = require('../controllers/messageController');

// All routes require authentication
router.use(auth);

// Message routes
router.post('/', sendMessage);
router.get('/task/:taskId', getTaskMessages);
router.get('/unread', getUnreadCount);
router.put('/read', markAsRead);

module.exports = router; 