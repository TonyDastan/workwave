const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://gastondastan25:gastondastan25@workwave.4ugrc.mongodb.net/workwave?retryWrites=true&w=majority&appName=WorkWave";

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        
        mongoose.connection.on('connecting', () => {
            console.log('Connecting to MongoDB...');
        });

        mongoose.connection.on('connected', () => {
            console.log('Successfully connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log('Database:', conn.connection.name);
        
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error('Please make sure MongoDB is installed and running, or provide a valid MONGO_URI in the .env file');
        process.exit(1);
    }
};

module.exports = connectDB; 