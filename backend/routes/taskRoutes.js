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
  rateWorker,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
  getTasksWithProposals
} = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Public routes
router.get('/', getTasks);

// Protected routes - clients only
router.post('/', auth, checkRole(['client']), createTask);
router.get('/with-proposals', auth, checkRole(['client']), getTasksWithProposals);

// Task-specific routes
router.get('/:id', getTaskById);
router.put('/:id', auth, checkRole(['client']), updateTask);
router.delete('/:id', auth, checkRole(['client']), deleteTask);
router.post('/:id/assign', auth, checkRole(['client']), assignWorker);
router.post('/:id/rate', auth, checkRole(['client']), rateWorker);

// Proposal routes
router.post('/:id/proposals', auth, checkRole(['worker']), applyForTask);
router.delete('/:id/proposals/:proposalId', auth, checkRole(['worker']), withdrawProposal);
router.post('/:id/proposals/:proposalId/accept', auth, acceptProposal);
router.post('/:id/proposals/:proposalId/reject', auth, rejectProposal);
router.post('/:id/status', auth, updateTaskStatus);

module.exports = router; 