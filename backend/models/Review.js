const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  reviewType: {
    type: String,
    enum: ['client-to-worker', 'worker-to-client'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure one review per task per reviewer
ReviewSchema.index({ task: 1, reviewer: 1 }, { unique: true });

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review; 