const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://gastondastan25:gastondastan25@workwave.4ugrc.mongodb.net/workwave?retryWrites=true&w=majority&appName=WorkWave";

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
        });

        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB; 