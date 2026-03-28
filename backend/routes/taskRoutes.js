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
  getTasksWithProposals,
  getWorkerProposals
} = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Public routes
router.get('/', getTasks);
// Protected static routes - Must come before /:id to avoid conflicts
// We add auth middleware explicitly here since they are before the global router.use(auth)
router.get('/worker/proposals', auth, checkRole(['worker']), getWorkerProposals);
router.get('/with-proposals', auth, checkRole(['client']), getTasksWithProposals);

// Public parameterized route
router.get('/:id', getTaskById);

// Protected routes (rest of the routes)
router.use(auth);

// Task management routes
router.post('/', checkRole(['client']), createTask);
router.put('/:id', checkRole(['client']), updateTask);
router.delete('/:id', checkRole(['client']), deleteTask);

// Proposal routes
router.post('/:id/apply', checkRole(['worker']), applyForTask);
router.delete('/:id/proposals/:proposalId', checkRole(['worker']), withdrawProposal);

// Task status routes
router.put('/:id/assign', checkRole(['client']), assignWorker);
router.put('/:id/status', updateTaskStatus);
router.post('/:id/rate', checkRole(['client']), rateWorker);

// Proposal management routes
router.put('/:id/accept', checkRole(['client']), acceptProposal);
router.post('/:id/proposals/:proposalId/reject', checkRole(['client']), rejectProposal);

module.exports = router; 