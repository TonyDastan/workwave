const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const { cloudinary, upload } = require('./config/cloudinary');
const connectDB = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: ['http://localhost:4202', 'http://localhost:4200', 'http://localhost:4201'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Apply rate limiting to all routes
app.use(apiLimiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Detailed request logging
app.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('=====================');
  next();
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Mount API routes with file upload middleware
app.use('/api/auth', upload.single('profilePicture'), authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', upload.single('file'), uploadRoutes);
app.use('/api/tasks', taskRoutes);

// Test route to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Handle 404 for API routes
app.all('/api/*', (req, res) => {
  console.log('404 for API URL:', req.url);
  res.status(404).json({ message: 'API route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/workwave-client/dist/workwave-client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/workwave-client/dist/workwave-client/index.html'));
  });
}

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS enabled for origins: http://localhost:4202, http://localhost:4200, http://localhost:4201`);
}); 