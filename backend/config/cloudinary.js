const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'domb9yvwt',
    api_key: '718826191569884',
    api_secret: 'haGMYbXaCqoonSjtSXgyxaBD2bU'
});

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'workwave',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});

// Create multer upload instance
const upload = multer({ storage: storage });

module.exports = {
    cloudinary,
    upload
}; 