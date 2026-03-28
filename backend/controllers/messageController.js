const Message = require('../models/Message');
const User = require('../models/User');
const { Task } = require('../models/Task');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, taskId, content, attachments } = req.body;
    
    console.log('Received message request:', {
      receiverId,
      taskId,
      content,
      userId: req.user._id
    });

    // Verify task exists and user is part of it
    const task = await Task.findById(taskId);
    if (!task) {
      console.log('Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('Task found:', {
      taskId: task._id,
      clientId: task.clientId,
      workerId: task.workerId,
      status: task.status
    });

    // Check if user is authorized to send message:
    // 1. User is the client
    // 2. User is the assigned worker
    // 3. User has a proposal for this task
    const isClient = task.clientId.toString() === req.user._id.toString();
    const isAssignedWorker = task.workerId && task.workerId.toString() === req.user._id.toString();
    const hasProposal = task.proposals && task.proposals.some(p => p.workerId.toString() === req.user._id.toString());

    console.log('Authorization Flags:', { isClient, isAssignedWorker, hasProposal });

    if (!isClient && !isAssignedWorker && !hasProposal) {
      console.log('Authorization failed: User is not client, assigned worker, or proposer', {
        userId: req.user._id,
        taskId: task._id
      });
      return res.status(403).json({ message: 'Not authorized to send messages for this task' });
    }

    // Check if receiver is valid:
    // 1. Receiver is the client
    // 2. Receiver is the assigned worker
    // 3. Receiver has a proposal for this task
    const receiverIsClient = task.clientId.toString() === receiverId;
    const receiverIsAssignedWorker = task.workerId && task.workerId.toString() === receiverId;
    
    // Debug: Log all proposers for this task
    const proposers = task.proposals ? task.proposals.map(p => p.workerId.toString()) : [];
    console.log('Task Proposers:', proposers);
    console.log('Checking Receiver ID:', receiverId);

    const receiverIsProposer = proposers.includes(receiverId.toString());

    console.log('Receiver Flags:', { receiverIsClient, receiverIsAssignedWorker, receiverIsProposer });

    if (!receiverIsClient && !receiverIsAssignedWorker && !receiverIsProposer) {
      console.log('Invalid receiver: Receiver is not client, assigned worker, or proposer', {
        receiverId,
        taskId: task._id,
        proposers
      });
      return res.status(403).json({ message: 'Invalid receiver for this task' });
    }

    // Additional check: Proposers can only message the client (unless they are assigned)
    if (hasProposal && !isAssignedWorker && !isClient && !receiverIsClient) {
      console.log('Authorization failed: Proposer can only message the client', {
        userId: req.user._id,
        receiverId
      });
      return res.status(403).json({ message: 'Proposers can only message the task client' });
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
    await message.populate('sender', 'firstName lastName email profilePicture');
    await message.populate('receiver', 'firstName lastName email profilePicture');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error in sendMessage:', error);
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
    
    console.log('Getting conversation between:', {
      currentUserId,
      otherUserId: userId
    });
    
    // Get messages where current user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'firstName lastName email profilePicture')
      .populate('receiver', 'firstName lastName email profilePicture')
      .populate('task', 'title')
      .sort({ createdAt: 1 });
    
    console.log('Found messages:', messages.length);
    
    // Mark messages from the other user as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
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
    
    // Get all messages where the current user is either sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      // Group by the conversation partner
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", currentUserId] },
              then: "$receiver",
              else: "$sender"
            }
          },
          lastMessage: { $last: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$receiver", currentUserId] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      // Lookup user details for the conversation partner
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      // Unwind the user array (converts array to object)
      {
        $unwind: "$user"
      },
      // Project only the fields we need
      {
        $project: {
          _id: 0,
          user: {
            _id: "$user._id",
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            email: "$user.email",
            profilePicture: "$user.profilePicture"
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      // Sort by last message date
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    console.log('Found conversations:', messages.length);

    // Populate task details for the last message
    for (let conv of messages) {
      if (conv.lastMessage.task) {
        await Message.populate(conv, {
          path: 'lastMessage.task',
          select: 'title'
        });
      }
    }
    
    res.json(messages);
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
    if (message.receiver.toString() !== req.user._id.toString()) {
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

    // Check if user is authorized to view messages:
    // 1. User is the client
    // 2. User is the assigned worker
    // 3. User is a worker who has sent/received messages for this task
    const isClient = task.clientId && task.clientId.toString() === req.user._id.toString();
    const isAssignedWorker = task.workerId && task.workerId.toString() === req.user._id.toString();
    
    // Check if user has any messages in this task
    let isParticipant = isClient || isAssignedWorker;
    
    if (!isParticipant) {
      const messageCount = await Message.countDocuments({
        task: taskId,
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id }
        ]
      });
      isParticipant = messageCount > 0;
    }
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view messages for this task' });
    }

    const messages = await Message.find({ task: taskId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'firstName lastName email profilePicture')
      .populate('receiver', 'firstName lastName email profilePicture');

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