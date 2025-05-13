const Message = require('../models/Message');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, taskId, content, attachments } = req.body;
    
    // Verify task exists and user is part of it
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to send message (must be client or worker of the task)
    if (task.client.toString() !== req.user._id.toString() && 
        task.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send messages for this task' });
    }

    // Check if receiver is the other party in the task
    if (receiverId !== task.client.toString() && receiverId !== task.worker.toString()) {
      return res.status(403).json({ message: 'Invalid receiver for this task' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      task: taskId,
      content,
      attachments
    });

    await message.save();

    // Populate sender and receiver details
    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: 'Error sending message', error: error.message });
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

// Get messages for a task
const getTaskMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify task exists and user is part of it
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to view messages
    if (task.client.toString() !== req.user._id.toString() && 
        task.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view messages for this task' });
    }

    const messages = await Message.find({ task: taskId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    // Mark messages as read
    await Message.updateMany(
      { 
        task: taskId, 
        receiver: req.user._id,
        isRead: false 
      },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: req.user._id
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ message: 'Error marking messages as read', error: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markMessageAsRead,
  getTaskMessages,
  getUnreadCount,
  markAsRead,
}; 