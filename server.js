const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./backend/config/database');

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:', {
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    PORT: process.env.PORT || 'Not set'
});

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'http://localhost:4202' : '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'frontend/workwave-client/dist/workwave-client')));

// API routes would go here
// Example:
app.use('/api/tasks', require('./backend/routes/tasks'));

// Catch all other routes and return the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/workwave-client/dist/workwave-client/index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Define port - changed to 5002 to avoid conflicts with other servers
const PORT = process.env.PORT || 5002;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 