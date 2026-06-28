const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Protect all task routes with auth middleware
router.use(auth);

// Helper function to build access filter for a user
async function buildAccessFilter(userId, projectId) {
  const userProjects = await Project.find({
    $or: [
      { owner: userId },
      { members: userId }
    ]
  }).select('_id');
  
  const projectIds = userProjects.map(p => p._id);

  if (projectId && projectId !== 'all') {
    // If a specific project is requested, verify user has access
    const hasAccess = projectIds.some(id => id.toString() === projectId);
    if (!hasAccess) {
      throw new Error('Access Denied: You are not a member of this project.');
    }
    return { project: projectId };
  }

  // Default filter: tasks belonging to projects they belong to, or legacy tasks they created/are assigned to
  return {
    $or: [
      { project: { $in: projectIds } },
      { $and: [ { project: null }, { $or: [ { creator: userId }, { assignee: userId } ] } ] }
    ]
  };
}

// Get analytics stats
router.get('/analytics', async (req, res) => {
  try {
    const { project } = req.query;
    let filter;
    try {
      filter = await buildAccessFilter(req.user._id, project);
    } catch (authError) {
      return res.status(403).json({ message: authError.message });
    }

    const totalTasks = await Task.countDocuments(filter);
    const completedTasks = await Task.countDocuments({ ...filter, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ ...filter, status: 'in-progress' });
    const pendingTasks = await Task.countDocuments({ ...filter, status: { $ne: 'done' } });

    const highPriority = await Task.countDocuments({ ...filter, priority: 'high' });
    const mediumPriority = await Task.countDocuments({ ...filter, priority: 'medium' });
    const lowPriority = await Task.countDocuments({ ...filter, priority: 'low' });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics stats', error: error.message });
  }
});

// GET all tasks (with filtering, search, and sorting)
router.get('/', async (req, res) => {
  try {
    const { status, priority, search, sortBy, project } = req.query;
    
    let baseFilter;
    try {
      baseFilter = await buildAccessFilter(req.user._id, project);
    } catch (authError) {
      return res.status(403).json({ message: authError.message });
    }

    const filter = { ...baseFilter };

    // Apply status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Apply priority filter
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    // Apply search query on title or description
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    let query = Task.find(filter)
      .populate('assignee', '-password')
      .populate('project')
      .populate('creator', '-password');

    // Apply sorting
    if (sortBy) {
      if (sortBy === 'dueDate_asc') {
        query = query.sort({ dueDate: 1 });
      } else if (sortBy === 'dueDate_desc') {
        query = query.sort({ dueDate: -1 });
      } else if (sortBy === 'priority_high') {
        // High -> Medium -> Low sorting logic
        query = query.sort({ priority: 1 });
      } else {
        query = query.sort({ createdAt: -1 }); // default: newest first
      }
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const tasks = await query;
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
});

// GET a single task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', '-password')
      .populate('project')
      .populate('creator', '-password');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify access permission
    if (task.project) {
      const project = await Project.findById(task.project);
      const isMember = project.members.some(m => m.toString() === req.user._id.toString());
      const isOwner = project.owner.toString() === req.user._id.toString();
      if (!isMember && !isOwner) {
        return res.status(403).json({ message: 'Access Denied: You do not belong to this project.' });
      }
    } else {
      // Standalone task: check if creator or assignee is req.user
      const isCreator = task.creator && task.creator._id.toString() === req.user._id.toString();
      const isAssignee = task.assignee && task.assignee._id.toString() === req.user._id.toString();
      if (!isCreator && !isAssignee) {
        return res.status(403).json({ message: 'Access Denied: You are not authorized to view this standalone task.' });
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving task', error: error.message });
  }
});

// POST create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignee, project, subtasks, tags, storyPoints } = req.body;
    
    // Explicit title validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // Validate project if provided
    let verifiedProjectId = null;
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      const proj = await Project.findById(project);
      if (!proj) {
        return res.status(400).json({ message: 'Project not found.' });
      }
      const isMember = proj.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember && proj.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not a member of the selected project.' });
      }
      verifiedProjectId = project;
    }

    // Validate assignee if provided
    let verifiedAssigneeId = null;
    if (assignee && mongoose.Types.ObjectId.isValid(assignee)) {
      const user = await User.findById(assignee);
      if (!user) {
        return res.status(400).json({ message: 'Assignee not found.' });
      }
      verifiedAssigneeId = assignee;
    }

    const newTask = new Task({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      assignee: verifiedAssigneeId,
      project: verifiedProjectId,
      creator: req.user._id,
      subtasks: subtasks || [],
      tags: tags || [],
      storyPoints: storyPoints || 1
    });

    const savedTask = await newTask.save();
    
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignee', '-password')
      .populate('project')
      .populate('creator', '-password');

    res.status(201).json(populatedTask);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

// PUT update an existing task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignee, project, subtasks, tags, storyPoints } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify authorization
    if (task.project) {
      const proj = await Project.findById(task.project);
      const isMember = proj.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember && proj.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access Denied: Only project members can edit tasks.' });
      }
    } else {
      const isCreator = task.creator && task.creator.toString() === req.user._id.toString();
      const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
      if (!isCreator && !isAssignee) {
        return res.status(403).json({ message: 'Access Denied: You are not authorized to edit this task.' });
      }
    }

    if (title !== undefined && (!title || title.trim() === '')) {
      return res.status(400).json({ message: 'Task title cannot be empty' });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description ? description.trim() : '';
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (subtasks !== undefined) updateFields.subtasks = subtasks;
    if (tags !== undefined) updateFields.tags = tags;
    if (storyPoints !== undefined) updateFields.storyPoints = storyPoints;

    // Validate and update project if provided
    if (project !== undefined) {
      if (project === null) {
        updateFields.project = null;
      } else if (mongoose.Types.ObjectId.isValid(project)) {
        const proj = await Project.findById(project);
        if (!proj) {
          return res.status(400).json({ message: 'Project not found.' });
        }
        const isMember = proj.members.some(m => m.toString() === req.user._id.toString());
        if (!isMember && proj.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'You are not a member of the selected project.' });
        }
        updateFields.project = project;
      } else {
        return res.status(400).json({ message: 'Invalid project ID.' });
      }
    }

    // Validate and update assignee if provided
    if (assignee !== undefined) {
      if (assignee === null) {
        updateFields.assignee = null;
      } else if (mongoose.Types.ObjectId.isValid(assignee)) {
        const user = await User.findById(assignee);
        if (!user) {
          return res.status(400).json({ message: 'Assignee not found.' });
        }
        updateFields.assignee = assignee;
      } else {
        return res.status(400).json({ message: 'Invalid assignee ID.' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
    .populate('assignee', '-password')
    .populate('project')
    .populate('creator', '-password');

    res.json(updatedTask);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify authorization
    if (task.project) {
      const proj = await Project.findById(task.project);
      const isMember = proj.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember && proj.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access Denied: Only project members can delete tasks.' });
      }
    } else {
      const isCreator = task.creator && task.creator.toString() === req.user._id.toString();
      if (!isCreator) {
        return res.status(403).json({ message: 'Access Denied: Only the creator can delete this task.' });
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task successfully deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

module.exports = router;
