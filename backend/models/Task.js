const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        required: true
    },
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
    skills: [{
        type: String,
        required: true
    }],
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

// Add pre-save middleware to auto-increment the id
taskSchema.pre('save', async function(next) {
    if (this.isNew) {
        const lastTask = await this.constructor.findOne({}, {}, { sort: { 'id': -1 } });
        this.id = lastTask ? lastTask.id + 1 : 1;
    }
    next();
});

// Migration script to ensure all tasks have numeric IDs
const migrateTaskIds = async () => {
    try {
        const tasks = await mongoose.model('Task').find({ id: { $exists: false } });
        console.log(`Found ${tasks.length} tasks without numeric IDs`);
        
        let lastId = await mongoose.model('Task').findOne({}, {}, { sort: { 'id': -1 } });
        lastId = lastId ? lastId.id : 0;
        
        for (const task of tasks) {
            lastId++;
            task.id = lastId;
            await task.save();
            console.log(`Assigned ID ${lastId} to task ${task._id}`);
        }
        
        console.log('Task ID migration completed');
    } catch (error) {
        console.error('Task ID migration failed:', error);
    }
};

// Run migration if needed
migrateTaskIds();

// Index for better search performance
taskSchema.index({ id: 1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ status: 1, category: 1 });
taskSchema.index({ client: 1, status: 1 });
taskSchema.index({ skills: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 