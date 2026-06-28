const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Guard all project routes with auth middleware
router.use(auth);

// GET / - List all projects user belongs to
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
    .populate('owner', '-password')
    .populate('members', '-password')
    .sort({ name: 1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
});

// POST / - Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, key } = req.body;

    if (!name || !key) {
      return res.status(400).json({ message: 'Project name and key are required.' });
    }

    // Check if key already exists
    const uppercaseKey = key.trim().toUpperCase();
    const existingProject = await Project.findOne({ key: uppercaseKey });
    if (existingProject) {
      return res.status(400).json({ message: `Project key "${uppercaseKey}" is already taken.` });
    }

    const newProject = new Project({
      name: name.trim(),
      description: description ? description.trim() : '',
      key: uppercaseKey,
      owner: req.user._id,
      members: [req.user._id] // creator is automatically a member
    });

    const savedProject = await newProject.save();
    
    // Populate before sending back
    const populatedProject = await Project.findById(savedProject._id)
      .populate('owner', '-password')
      .populate('members', '-password');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// GET /:id - Get specific project details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', '-password')
      .populate('members', '-password');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check authorization: User must be member or owner
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving project', error: error.message });
  }
});

// POST /:id/members - Create a project invitation notification for a user
router.post('/:id/members', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'User email is required.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check authorization: Only owner or members can invite others
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.toString() === req.user._id.toString());
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied. Only project members can invite users.' });
    }

    // Find the user by email
    const userToAdd = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({ message: `No user found with email "${email}".` });
    }

    // Check if user is already a member
    const alreadyMember = project.members.some(m => m.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this project.' });
    }

    // Check for existing pending invitation
    const Notification = require('../models/Notification');
    const existingInvite = await Notification.findOne({
      recipient: userToAdd._id,
      project: project._id,
      status: 'pending'
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'An invitation is already pending for this user.' });
    }

    // Create invite notification
    const newInvite = new Notification({
      recipient: userToAdd._id,
      sender: req.user._id,
      project: project._id,
      type: 'project_invite',
      status: 'pending'
    });

    await newInvite.save();

    res.json({
      message: `Invitation successfully sent to ${userToAdd.name}.`,
      invitedUser: { _id: userToAdd._id, name: userToAdd.name, email: userToAdd.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error inviting project member', error: error.message });
  }
});

// DELETE /:id/members/:userId - Remove user from project
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check authorization: Only owner or members can remove (or user removing themselves)
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSelf = req.params.userId === req.user._id.toString();
    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: 'Access denied. You cannot remove members.' });
    }

    // Owner cannot be removed
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Project owner cannot be removed from the project.' });
    }

    // Check if user is member
    const memberIndex = project.members.findIndex(m => m.toString() === req.params.userId);
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'User is not a member of this project.' });
    }

    // Remove user
    project.members.splice(memberIndex, 1);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', '-password')
      .populate('members', '-password');

    res.json({
      message: 'User successfully removed from the project.',
      project: populatedProject
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing project member', error: error.message });
  }
});

// DELETE /:id - Delete a project and all associated tasks
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check authorization: Only owner can delete a project
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied. Only the project owner can delete this project.' });
    }

    // Delete all associated tasks
    const Task = require('../models/Task');
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project and all associated tasks permanently deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
});

module.exports = router;
