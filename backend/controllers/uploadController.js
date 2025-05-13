const { cloudinary } = require('../config/cloudinary');

// Upload single file
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.json({
            message: 'File uploaded successfully',
            file: {
                url: req.file.path,
                filename: req.file.filename,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
};

// Upload multiple files
exports.uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const files = req.files.map(file => ({
            url: file.path,
            filename: file.filename,
            mimetype: file.mimetype
        }));

        res.json({
            message: 'Files uploaded successfully',
            files
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading files', error: error.message });
    }
};

// Delete file
exports.deleteFile = async (req, res) => {
    try {
        const { public_id } = req.params;

        const result = await cloudinary.uploader.destroy(public_id);
        
        if (result.result === 'not found') {
            return res.status(404).json({ message: 'File not found' });
        }

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
}; 