const express = require('express');
const router = express.Router();

// Example in-memory tasks array
let tasks = [
  { id: 1, title: 'Sample Task', completed: false }
];

// GET /api/tasks - get all tasks
router.get('/', (req, res) => {
  res.json(tasks);
});

// POST /api/tasks - add a new task
router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newTask = { id: tasks.length + 1, title, completed: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Error handler for this router
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router; 