const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    budget: {
        type: Number,
        required: true,
        min: 1
    }
});

const proposalSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverLetter: {
        type: String,
        required: true,
        minlength: 50,
        maxlength: 1000
    },
    proposedBudget: {
        type: Number,
        required: true,
        min: 1
    },
    estimatedTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]+ (hours|days|weeks)$/.test(v);
            },
            message: props => `${props.value} is not a valid time format!`
        }
    },
    availability: {
        type: String,
        required: true,
        minlength: 10
    },
    questions: {
        type: String
    },
    milestones: [milestoneSchema],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    },
    workerName: String,
    workerImage: String,
    workerRating: Number,
    clientFeedback: String,
    isPreferred: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    budget: {
        type: Number,
        required: [true, 'Budget is required'],
        min: [1, 'Budget must be at least 1']
    },
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Cleaning', 'IT & Technology', 'Gardening', 'Handyman', 'Delivery']
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'completed', 'cancelled'],
        default: 'open'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deadline: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    isUrgent: {
        type: Boolean,
        default: false
    },
    skills: [{
        type: String
    }],
    proposals: [proposalSchema],
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
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

// Update the updatedAt timestamp before saving
taskSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

proposalSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index for better search performance
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ status: 1, category: 1 });
taskSchema.index({ clientId: 1, status: 1 });
taskSchema.index({ skills: 1 });

const Task = mongoose.model('Task', taskSchema);

// Migration function to clean up any tasks with invalid data
const runMigration = async () => {
    try {
        // Find tasks with invalid data
        const tasks = await Task.find({
            $or: [
                { title: { $exists: false } },
                { description: { $exists: false } },
                { budget: { $exists: false } },
                { location: { $exists: false } },
                { category: { $exists: false } },
                { deadline: { $exists: false } }
            ]
        });
        
        console.log(`Found ${tasks.length} tasks with invalid data`);
        
        // Remove tasks with invalid data
        if (tasks.length > 0) {
            await Task.deleteMany({
                _id: { $in: tasks.map(task => task._id) }
            });
            console.log(`Removed ${tasks.length} invalid tasks`);
        }
        
        console.log('Task migration completed');
    } catch (error) {
        console.error('Task migration failed:', error);
    }
};

module.exports = { Task, runMigration }; 