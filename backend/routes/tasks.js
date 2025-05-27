const express = require('express');
const router = express.Router();
const { Task } = require('../models/Task');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/tasks - get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      details: err.message 
    });
  }
});

// GET /api/tasks/:id - get a single task by ID
router.get('/:id', async (req, res) => {
  try {
    // Validate if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ 
      error: 'Failed to fetch task',
      details: err.message 
    });
  }
});

// POST /api/tasks - create a new task
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      category,
      location,
      skills,
      isUrgent
    } = req.body;

    // Validate required fields
    if (!title || !description || !budget || !deadline || !category || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'description', 'budget', 'deadline', 'category', 'location']
      });
    }

    // Validate budget is a positive number
    if (isNaN(budget) || budget <= 0) {
      return res.status(400).json({
        error: 'Budget must be a positive number'
      });
    }

    // Validate deadline is a future date
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({
        error: 'Deadline must be a valid future date'
      });
    }

    // Create new task
    const task = new Task({
      title,
      description,
      budget,
      deadline: deadlineDate,
      category,
      location,
      skills: skills || [],
      isUrgent: isUrgent || false,
      clientId: req.user.id,
      status: 'open'
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ 
      error: 'Failed to create task',
      details: err.message 
    });
  }
});

// PUT /api/tasks/:id - update a task
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const {
      title,
      description,
      budget,
      deadline,
      category,
      location,
      skills,
      isUrgent,
      status
    } = req.body;

    // Validate required fields
    if (!title || !description || !budget || !deadline || !category || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'description', 'budget', 'deadline', 'category', 'location']
      });
    }

    // Validate budget is a positive number
    if (isNaN(budget) || budget <= 0) {
      return res.status(400).json({
        error: 'Budget must be a positive number'
      });
    }

    // Validate deadline is a future date if status is not 'completed'
    const deadlineDate = new Date(deadline);
    if (status !== 'completed' && (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date())) {
      return res.status(400).json({
        error: 'Deadline must be a valid future date'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Ensure user owns the task or is admin
    if (task.clientId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        budget,
        deadline: deadlineDate,
        category,
        location,
        skills: skills || [],
        isUrgent: isUrgent || false,
        status: status || task.status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ 
      error: 'Failed to update task',
      details: err.message 
    });
  }
});

// DELETE /api/tasks/:id - delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Ensure user owns the task or is admin
    if (task.clientId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ 
      error: 'Failed to delete task',
      details: err.message 
    });
  }
});

// Error handler for this router
router.use((err, req, res, next) => {
  console.error('Task router error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: err.message 
  });
});

module.exports = router; 