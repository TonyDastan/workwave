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

// Protected routes
router.use(auth);

// Debug middleware - moved after auth
router.use((req, res, next) => {
  console.log('=== Task Route Debug ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Full Path:', req.originalUrl);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('User:', req.user);
  console.log('=====================');
  next();
});

// Worker proposal routes - must come before /:id route
router.get('/worker/proposals', checkRole(['worker']), getWorkerProposals);

// Client-specific routes
router.get('/with-proposals', checkRole(['client']), getTasksWithProposals);

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
router.post('/:id/proposals/:proposalId/accept', checkRole(['client']), acceptProposal);
router.post('/:id/proposals/:proposalId/reject', checkRole(['client']), rejectProposal);

// Get task by ID - must come after all other routes
router.get('/:id', getTaskById);

module.exports = router; 