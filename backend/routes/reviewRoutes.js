const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getTaskReviews,
} = require('../controllers/reviewController');
const auth = require('../middleware/auth');

// Public routes
router.get('/user/:userId', getUserReviews);
router.get('/task/:taskId', getTaskReviews);

// Protected routes
router.post('/', auth, createReview);

module.exports = router; 