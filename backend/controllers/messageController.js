const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, taskId } = req.body;
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Create message
    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content,
      task: taskId || null
    });
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profileImage')
      .populate('recipient', 'name profileImage');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user._id;
    
    // Get messages where current user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
      .populate('sender', 'name profileImage')
      .populate('recipient', 'name profileImage')
      .populate('task', 'title')
      .sort({ createdAt: 1 });
    
    // Mark messages from the other user as read
    await Message.updateMany(
      { sender: userId, recipient: currentUserId, isRead: false },
      { isRead: true }
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get all unique users the current user has had conversations with
    const sentMessages = await Message.find({ sender: currentUserId })
      .distinct('recipient');
      
    const receivedMessages = await Message.find({ recipient: currentUserId })
      .distinct('sender');
    
    // Combine and remove duplicates
    const conversationUserIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    // Get last message for each conversation
    const conversations = [];
    
    for (const userId of conversationUserIds) {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: currentUserId, recipient: userId },
          { sender: userId, recipient: currentUserId }
        ]
      })
        .populate('sender', 'name profileImage')
        .populate('recipient', 'name profileImage')
        .sort({ createdAt: -1 })
        .limit(1);
      
      // Get unread count
      const unreadCount = await Message.countDocuments({
        sender: userId,
        recipient: currentUserId,
        isRead: false
      });
      
      // Get user details
      const otherUser = await User.findById(userId).select('name profileImage');
      
      conversations.push({
        user: otherUser,
        lastMessage,
        unreadCount
      });
    }
    
    // Sort by most recent message
    conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );
    
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
const markMessageAsRead = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the recipient
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }
    
    // Mark as read
    message.isRead = true;
    await message.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markMessageAsRead,
}; 