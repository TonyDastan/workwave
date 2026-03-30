const { Task } = require('../models/Task');
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
      .populate('clientId', 'firstName lastName email rating profilePicture')
      .populate('workerId', 'firstName lastName email rating profilePicture');

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
    console.log('Getting task with ID:', req.params.id);
    let task;
    
    // Try to find by MongoDB ObjectId first
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Searching by MongoDB ObjectId');
      task = await Task.findById(req.params.id);
    }
    
    // If not found by ObjectId, try to find by numeric ID
    if (!task) {
      console.log('Searching by numeric ID');
      const numericId = parseInt(req.params.id);
      if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid task ID format' });
      }
      task = await Task.findOne({ id: numericId });
    }
    
    if (!task) {
      console.log('Task not found');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('Found task:', task._id);

    // Populate related data
    await task.populate('clientId', 'firstName lastName email rating profilePicture');
    if (task.workerId) {
      await task.populate('workerId', 'firstName lastName email rating profilePicture');
    }
    if (task.proposals && task.proposals.length > 0) {
      await task.populate('proposals.workerId', 'firstName lastName email rating profilePicture');
    }

    // Transform the response to match frontend expectations
    const response = {
      id: task.id || task._id,
      title: task.title,
      description: task.description,
      category: task.category,
      location: task.location,
      budget: task.budget,
      deadline: task.deadline,
      status: task.status,
      isUrgent: task.isUrgent,
      skills: task.skills,
      clientId: task.clientId?._id || task.clientId,
      clientName: task.clientId?.name || 'Unknown Client',
      clientPicture: task.clientId?.profilePicture,
      workerId: task.workerId?._id || task.workerId,
      workerName: task.workerId?.name,
      workerPicture: task.workerId?.profilePicture,
      rating: task.rating,
      proposals: task.proposals.map(p => {
        const pObj = p.toObject();
        return {
          ...pObj,
          workerId: p.workerId?._id || p.workerId, // Ensure workerId is an ID string
          workerName: p.workerName || p.workerId?.name || 'Unknown Worker',
          workerPicture: p.workerPicture || p.workerId?.profilePicture || null,
          workerRating: p.workerRating || p.workerId?.rating || 0
        };
      }),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Client only)
const createTask = async (req, res) => {
  try {
    const { title, description, category, location, budget, deadline, skills, isUrgent } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !location || !budget || !deadline) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate skills array
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: 'Please select at least one required skill' });
    }
    
    // Create new task
    const task = await Task.create({
      title,
      description,
      category,
      clientId: req.user._id,
      location,
      budget,
      deadline,
      skills,
      isUrgent: isUrgent || false
    });
    
    // Populate client details
    await task.populate('clientId', 'firstName lastName email rating profilePicture');
    
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
    if (task.clientId.toString() !== req.user._id.toString()) {
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
    if (task.clientId.toString() !== req.user._id.toString()) {
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
    console.log('Applying for task with ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const task = await Task.findById(req.params.id);
    console.log('Found task:', task);
    
    if (!task) {
      console.log('Task not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'This task is no longer accepting applications' });
    }
    
    // Check if user is worker
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can apply for tasks' });
    }
    
    // Check if already applied
    const alreadyApplied = task.proposals.find(
      (proposal) => proposal.workerId.toString() === req.user._id.toString()
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this task' });
    }
    
    // Validate proposal data
    const { 
      coverLetter, 
      proposedBudget, 
      estimatedTime
    } = req.body;

    if (!coverLetter || !proposedBudget || !estimatedTime) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (coverLetter.length < 50 || coverLetter.length > 1000) {
      return res.status(400).json({ message: 'Cover letter must be between 50 and 1000 characters' });
    }

    if (proposedBudget < 1) {
      return res.status(400).json({ message: 'Proposed budget must be greater than 0' });
    }

    if (!estimatedTime.match(/^[0-9]+ (hours|days|weeks)$/)) {
      return res.status(400).json({ message: 'Invalid time format. Use format: number + (hours/days/weeks)' });
    }
    
    // Add proposal
    const proposal = {
      workerId: req.user._id,
      coverLetter,
      proposedBudget,
      estimatedTime,
      status: 'pending',
      workerName: `${req.user.firstName} ${req.user.lastName}`,
      workerPicture: req.user.profilePicture,
      workerRating: req.user.rating,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    task.proposals.push(proposal);
    await task.save();

    // Populate worker details
    await task.populate('proposals.workerId', 'firstName lastName email rating profilePicture');
    
    res.status(201).json(task);
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
    if (task.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to assign workers for this task' });
    }
    
    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'This task has already been assigned or completed' });
    }
    
    // Check if worker exists in proposals
    const workerExists = task.proposals.find(
      (proposal) => proposal.workerId.toString() === workerId
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
    const isClient = task.clientId.toString() === req.user._id.toString();
    const isWorker = task.workerId && task.workerId.toString() === req.user._id.toString();
    
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
    if (status === 'completed' && task.workerId) {
      await User.findByIdAndUpdate(
        task.workerId,
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
    if (task.clientId.toString() !== req.user._id.toString()) {
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
    if (task.workerId) {
      const worker = await User.findById(task.workerId);
      if (worker) {
        const workerTasks = await Task.find({ workerId: task.workerId, rating: { $exists: true } });
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
    if (task.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client who created the task can approve proposals' });
    }
    
    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'This task is no longer accepting proposals' });
    }
    
    const { workerId, proposalId } = req.body;
    
    // Find the proposal
    let proposal;
    if (proposalId) {
      proposal = task.proposals.id(proposalId);
    } else if (workerId) {
      proposal = task.proposals.find(p => p.workerId.toString() === workerId);
    }
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Get the worker ID from the proposal
    const actualWorkerId = proposal.workerId;
    
    // Update task status and assign worker
    task.workerId = actualWorkerId;
    task.status = 'assigned';
    proposal.status = 'accepted';
    
    // Update all other proposals to rejected
    task.proposals.forEach(p => {
      if (p._id.toString() !== proposal._id.toString()) {
        p.status = 'rejected';
      }
    });
    
    const updatedTask = await task.save();
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject a proposal
// @route   POST /api/tasks/:id/proposals/:proposalId/reject
// @access  Private (Task owner only)
const rejectProposal = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is task owner
    if (task.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject proposals for this task' });
    }
    
    const proposal = task.proposals.id(req.params.proposalId);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Update proposal status to rejected
    proposal.status = 'rejected';
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Reject proposal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Withdraw a proposal
// @route   DELETE /api/tasks/:id/proposals/:proposalId
// @access  Private (Worker only)
const withdrawProposal = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const proposal = task.proposals.id(req.params.proposalId);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Check if user is the proposal owner
    if (proposal.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to withdraw this proposal' });
    }
    
    // Remove the proposal
    task.proposals = task.proposals.filter(
      (p) => p._id.toString() !== req.params.proposalId
    );
    
    await task.save();
    
    res.json({ message: 'Proposal withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw proposal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all proposals submitted by the current worker
// @route   GET /api/tasks/worker/proposals
// @access  Private (Worker only)
const getWorkerProposals = async (req, res) => {
  try {
    console.log(`Getting proposals for worker: ${req.user._id}`);
    const tasks = await Task.find(
      { 'proposals.workerId': req.user._id },
      { title: 1, status: 1, budget: 1, deadline: 1, category: 1, proposals: 1, clientId: 1, location: 1, isUrgent: 1, rating: 1 }
    )
    .populate('clientId', 'firstName lastName email rating profilePicture')
    .sort('-createdAt');

    console.log(`Found ${tasks.length} tasks with proposals from this worker`);

    // Return only the matching proposal inside each task, including client info
    const workerProposals = tasks.map(task => {
      const proposal = task.proposals.find(
        p => p.workerId.toString() === req.user._id.toString()
      );
      
      if (!proposal) return null;

      const client = task.clientId;
      const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
      const clientPicture = client ? client.profilePicture : null;

      const result = {
        _id: proposal._id,
        workerId: proposal.workerId,
        coverLetter: proposal.coverLetter,
        proposedBudget: proposal.proposedBudget,
        estimatedTime: proposal.estimatedTime,
        status: proposal.status,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        taskId: task._id,
        taskTitle: task.title,
        taskStatus: task.status,
        taskBudget: task.budget,
        taskDeadline: task.deadline,
        taskCategory: task.category,
        taskLocation: task.location,
        taskIsUrgent: task.isUrgent,
        clientId: client ? client._id : null,
        clientName,
        clientPicture,
        taskRating: task.rating
      };
      
      return result;
    }).filter(p => p !== null);

    console.log('Sample worker proposal data:', JSON.stringify(workerProposals[0], null, 2));
    res.json(workerProposals);
  } catch (error) {
    console.error('Get worker proposals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all tasks with proposals for a client
// @route   GET /api/tasks/with-proposals
// @access  Private (Client only)
const getTasksWithProposals = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      clientId: req.user._id,
      'proposals.0': { $exists: true } // Only tasks with at least one proposal
    })
    .populate('proposals.workerId', 'firstName lastName email rating profilePicture')
    .sort('-createdAt');

    // Map tasks to ensure consistent proposal structure for the frontend
    const mappedTasks = tasks.map(task => {
      const taskObj = task.toObject();
      return {
        ...taskObj,
        proposals: task.proposals.map(p => ({
          ...p.toObject(),
          workerId: p.workerId?._id || p.workerId, // Ensure workerId is an ID string
          workerName: p.workerName || p.workerId?.name || 'Unknown Worker',
          workerPicture: p.workerPicture || p.workerId?.profilePicture || null,
          workerRating: p.workerRating || p.workerId?.rating || 0
        }))
      };
    });

    res.json(mappedTasks);
  } catch (error) {
    console.error('Get tasks with proposals error:', error);
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
  acceptProposal,
  rejectProposal,
  withdrawProposal,
  getTasksWithProposals,
  getWorkerProposals
}; 