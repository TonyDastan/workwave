const Review = require('../models/Review');
const { Task } = require('../models/Task');
const User = require('../models/User');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { taskId, revieweeId, rating, comment, reviewType } = req.body;
    
    // Verify task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task is completed
    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot review a task that is not completed' });
    }
    
    // Check if user is either client or worker of the task
    const isClient = task.client.toString() === req.user._id.toString();
    const isWorker = task.worker && task.worker.toString() === req.user._id.toString();
    
    if (!isClient && !isWorker) {
      return res.status(403).json({ message: 'You can only review tasks you were directly involved in' });
    }
    
    // Validate review type based on user role
    if (reviewType === 'client-to-worker' && !isClient) {
      return res.status(403).json({ message: 'Only clients can review workers' });
    }
    
    if (reviewType === 'worker-to-client' && !isWorker) {
      return res.status(403).json({ message: 'Only workers can review clients' });
    }
    
    // Check if user has already reviewed this task
    const existingReview = await Review.findOne({
      task: taskId,
      reviewer: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this task' });
    }
    
    // Create review
    const review = await Review.create({
      task: taskId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      comment,
      reviewType
    });
    
    // Update reviewee's average rating
    const userReviews = await Review.find({ reviewee: revieweeId });
    const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / userReviews.length;
    
    await User.findByIdAndUpdate(revieweeId, { rating: averageRating });
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name profileImage')
      .populate('task', 'title')
      .sort({ createdAt: -1 });
      
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reviews for a task
// @route   GET /api/reviews/task/:taskId
// @access  Public
const getTaskReviews = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    const reviews = await Review.find({ task: taskId })
      .populate('reviewer', 'name profileImage')
      .populate('reviewee', 'name profileImage')
      .sort({ createdAt: -1 });
      
    res.json(reviews);
  } catch (error) {
    console.error('Get task reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createReview,
  getUserReviews,
  getTaskReviews,
}; 