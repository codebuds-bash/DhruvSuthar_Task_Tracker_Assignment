// Triggering dev reload
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tasktracker';

// Middleware
app.use(cors({
  origin: 'https://achievotasktracker.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);

// Simple status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date()
  });
});

// Serve frontend in production (optional, if we build the bundle)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Database Migration Function for Legacy String Assignee Values
async function migrateDatabase() {
  try {
    const Task = require('./models/Task');
    // Find all tasks where assignee is a string that cannot be cast to an ObjectId (or is a string value)
    const tasks = await Task.find({});
    let migratedCount = 0;
    for (let task of tasks) {
      if (task.assignee && typeof task.assignee === 'string') {
        // Clear or convert legacy string to null to prevent CastError
        task.assignee = null;
        await task.save();
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      console.log(`Database Migration: Cleared legacy string assignee values for ${migratedCount} tasks.`);
    }
  } catch (err) {
    console.error('Database Migration Error:', err.message);
  }
}

// Database Connection and Server Start
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    await migrateDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Please make sure MongoDB is running locally or specify a valid MONGODB_URI in your .env file.');
    // Let's start the server anyway so the API at least responds with error messages rather than crashing immediately
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} (Database disconnected)`);
    });
  });

