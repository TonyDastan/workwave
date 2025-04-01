const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'frontend/workwave-client/dist/workwave-client')));

// API routes would go here
// Example:
// app.use('/api/tasks', require('./backend/routes/tasks'));

// Catch all other routes and return the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/workwave-client/dist/workwave-client/index.html'));
});

// Define port - changed to 5002 to avoid conflicts with other servers
const PORT = process.env.PORT || 5002;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 