const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Cleaning', 'IT & Technology', 'Gardening', 'Handyman', 'Delivery']
    },
    location: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: true,
        min: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
        default: 'open'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    proposals: [{
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: {
            type: Number,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isUrgent: {
        type: Boolean,
        default: false
    },
    attachments: [{
        type: String // URLs to attached files
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better search performance
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ status: 1, category: 1 });
taskSchema.index({ client: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 