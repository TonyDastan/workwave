const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    for (let collection of collections) {
      const indexes = await collection.indexes();
      console.log(`Collection ${collection.collectionName} has indexes:`, indexes);
      
      if (collection.collectionName === 'users') {
        await collection.dropIndex('username_1');
        console.log('Dropped username index from users collection');
      }
    }

    console.log('Index cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndexes(); 