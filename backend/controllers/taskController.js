const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
const getTasks = async (req, res) => {
  try {
    const {
      status,
      category,
      location,
      minBudget,
      maxBudget,
      skills,
      isUrgent,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (status) filter.status = status;
    if (isUrgent === 'true') filter.isUrgent = true;
    
    // Budget range
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }
    
    // Skills (array of skills)
    if (skills) {
      const skillsArray = skills.split(',');
      filter.skills = { $in: skillsArray };
    }
    
    // Search by title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const tasks = await Task.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('client', 'name email rating')
      .populate('worker', 'name email rating');

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Public
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('client', 'name email rating')
      .populate('worker', 'name email rating')
      .populate('applicants.worker', 'name email rating');
      
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Client only)
const createTask = async (req, res) => {
  try {
    const { title, description, category, location, budget, deadline, skills, isUrgent } = req.body;
    
    // Create new task
    const task = await Task.create({
      title,
      description,
      category,
      client: req.user._id,
      location,
      budget,
      deadline,
      skills: skills || [],
      isUrgent: isUrgent || false
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Task owner only)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is task owner
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Only allow updates if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Cannot update task once it has been assigned or completed' });
    }
    
    const { title, description, category, location, budget, deadline, skills, isUrgent } = req.body;
    
    task.title = title || task.title;
    task.description = description || task.description;
    task.category = category || task.category;
    task.location = location || task.location;
    task.budget = budget || task.budget;
    task.deadline = deadline || task.deadline;
    task.skills = skills || task.skills;
    task.isUrgent = isUrgent !== undefined ? isUrgent : task.isUrgent;
    
    const updatedTask = await task.save();
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Task owner only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is task owner
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    // Only allow deletion if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Cannot delete task once it has been assigned or completed' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Apply for a task
// @route   POST /api/tasks/:id/apply
// @access  Private (Workers only)
const applyForTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'This task is no longer accepting applications' });
    }
    
    // Check if user is worker
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ message: 'Only workers can apply for tasks' });
    }
    
    // Check if already applied
    const alreadyApplied = task.applicants.find(
      (applicant) => applicant.worker.toString() === req.user._id.toString()
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this task' });
    }
    
    // Add application
    const { coverLetter } = req.body;
    
    task.applicants.push({
      worker: req.user._id,
      coverLetter
    });
    
    await task.save();
    
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply for task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign a worker to a task
// @route   PUT /api/tasks/:id/assign
// @access  Private (Task owner only)
const assignWorker = async (req, res) => {
  try {
    const { workerId } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is task owner
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to assign workers for this task' });
    }
    
    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'This task has already been assigned or completed' });
    }
    
    // Check if worker exists in applicants
    const workerExists = task.applicants.find(
      (applicant) => applicant.worker.toString() === workerId
    );
    
    if (!workerExists) {
      return res.status(400).json({ message: 'This worker has not applied for the task' });
    }
    
    // Assign worker and update status
    task.worker = workerId;
    task.status = 'assigned';
    
    const updatedTask = await task.save();
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Assign worker error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private (Task owner or assigned worker)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Validate status
    const validStatusTransitions = {
      assigned: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled']
    };
    
    if (!validStatusTransitions[task.status] || !validStatusTransitions[task.status].includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }
    
    // Check authorization
    const isClient = task.client.toString() === req.user._id.toString();
    const isWorker = task.worker && task.worker.toString() === req.user._id.toString();
    
    if (!isClient && !isWorker) {
      return res.status(403).json({ message: 'Not authorized to update this task status' });
    }
    
    // Client can cancel, worker can mark as in-progress or completed
    if (status === 'cancelled' && !isClient) {
      return res.status(403).json({ message: 'Only the client can cancel a task' });
    }
    
    if (['in-progress', 'completed'].includes(status) && !isWorker) {
      return res.status(403).json({ message: 'Only the assigned worker can update work status' });
    }
    
    // Update status
    task.status = status;
    
    // If completed, increment the worker's completed tasks count
    if (status === 'completed' && task.worker) {
      await User.findByIdAndUpdate(
        task.worker,
        { $inc: { completedTasks: 1 } }
      );
    }
    
    const updatedTask = await task.save();
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Rate a worker for a completed task
// @route   POST /api/tasks/:id/rate
// @access  Private (Task owner only)
const rateWorker = async (req, res) => {
  try {
    const { rating } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is task owner
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this task' });
    }
    
    // Check if task is completed
    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed tasks' });
    }
    
    // Check if task already has a rating
    if (task.rating) {
      return res.status(400).json({ message: 'Task has already been rated' });
    }
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Update task with rating
    task.rating = rating;
    
    // Update worker's average rating
    if (task.worker) {
      const worker = await User.findById(task.worker);
      if (worker) {
        const workerTasks = await Task.find({ worker: task.worker, rating: { $exists: true } });
        const totalRating = workerTasks.reduce((sum, t) => sum + t.rating, 0) + rating;
        worker.rating = totalRating / (workerTasks.length + 1);
        await worker.save();
      }
    }
    
    const updatedTask = await task.save();
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Rate worker error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept a proposal
// @route   PUT /api/tasks/:id/accept
// @access  Private (Client only)
const acceptProposal = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is task owner (client)
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client who created the task can approve proposals' });
    }
    
    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'This task is no longer accepting proposals' });
    }
    
    const proposal = task.applicants.find(
      (applicant) => applicant.worker.toString() === req.body.workerId
    );
    
    if (!proposal) {
      return res.status(400).json({ message: 'Proposal not found' });
    }
    
    // Update task status and assign worker
    task.worker = req.body.workerId;
    task.status = 'assigned';
    
    // Update all other proposals to rejected
    task.applicants.forEach(applicant => {
      if (applicant.worker.toString() !== req.body.workerId) {
        applicant.status = 'rejected';
      }
    });
    
    const updatedTask = await task.save();
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  applyForTask,
  assignWorker,
  updateTaskStatus,
  rateWorker,
  acceptProposal
}; 