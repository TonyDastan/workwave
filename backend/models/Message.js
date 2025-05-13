const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    attachments: [{
        type: String // URLs to attached files
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
messageSchema.index({ sender: 1, receiver: 1, task: 1 });
messageSchema.index({ task: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 