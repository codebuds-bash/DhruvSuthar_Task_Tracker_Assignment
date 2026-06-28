const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const Project = require('../models/Project');

// @route   GET /api/notifications
// @desc    Get all pending invite notifications for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
      status: 'pending'
    })
      .populate('sender', 'name email')
      .populate('project', 'name key')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/notifications/:id/respond
// @desc    Accept or reject a project invitation
// @access  Private
router.post('/:id/respond', auth, async (req, res) => {
  const { action } = req.body; // 'accept' or 'reject'

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation has already been handled' });
    }

    if (action === 'accept') {
      const project = await Project.findById(notification.project);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Add to project members if not already there
      if (!project.members.includes(req.user.id)) {
        project.members.push(req.user.id);
        await project.save();
      }

      notification.status = 'accepted';
    } else {
      notification.status = 'rejected';
    }

    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
