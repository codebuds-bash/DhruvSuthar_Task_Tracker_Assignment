const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'tasktrackersecretkey12345';

const AVATAR_LIST = ['bear', 'chicken', 'duck', 'fox', 'meerkat', 'rabbit'];

// POST /register - Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields (name, email, password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Pick avatar: use provided one or random
    const chosenAvatar = AVATAR_LIST.includes(avatar) ? avatar : AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)];

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatarUrl: `/avatars/${chosenAvatar}.png`
    });

    const savedUser = await newUser.save();

    // Create and sign JWT
    const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        avatarUrl: savedUser.avatarUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// POST /login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Sign JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// GET /me - Get current user profile
router.get('/me', auth, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl
  });
});

// GET /users - List all users (protected)
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ name: 1 });
    const formattedUsers = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl
    }));
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error listing users', error: error.message });
  }
});

// PUT /avatar - Update current user's avatar
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!AVATAR_LIST.includes(avatar)) {
      return res.status(400).json({ message: 'Invalid avatar selection.' });
    }
    const avatarUrl = `/avatars/${avatar}.png`;
    await User.findByIdAndUpdate(req.user._id, { avatarUrl });
    res.json({ avatarUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error updating avatar', error: error.message });
  }
});

// GET /avatars - List available avatars
router.get('/avatars', auth, (req, res) => {
  res.json(AVATAR_LIST.map(a => ({ name: a, url: `/avatars/${a}.png` })));
});

module.exports = router;
