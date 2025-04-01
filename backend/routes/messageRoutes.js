const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  markMessageAsRead,
} = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All protected routes
router.post('/', auth, sendMessage);
router.get('/', auth, getConversations);
router.get('/:userId', auth, getConversation);
router.put('/:messageId/read', auth, markMessageAsRead);

module.exports = router; 