const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  applyForTask,
  assignWorker,
  updateTaskStatus,
  rateWorker
} = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getTasks);
router.get('/:id', getTaskById);

// Protected routes - all users
router.post('/:id/apply', auth, checkRole(['worker']), applyForTask);

// Protected routes - clients only
router.post('/', auth, checkRole(['client']), createTask);
router.put('/:id', auth, checkRole(['client']), updateTask);
router.delete('/:id', auth, checkRole(['client']), deleteTask);
router.put('/:id/assign', auth, checkRole(['client']), assignWorker);

// Protected routes - task participants
router.put('/:id/status', auth, updateTaskStatus);

// Protected routes - rate worker
router.post('/:id/rate', protect, rateWorker);

module.exports = router; 