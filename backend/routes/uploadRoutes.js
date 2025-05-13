const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
    uploadFile,
    uploadMultipleFiles,
    deleteFile
} = require('../controllers/uploadController');

// All routes require authentication
router.use(auth);

// Upload routes
router.post('/single', upload.single('file'), uploadFile);
router.post('/multiple', upload.array('files', 5), uploadMultipleFiles);
router.delete('/:public_id', deleteFile);

module.exports = router; 