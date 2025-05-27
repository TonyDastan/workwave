const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'your_mongodb_connection_string_here';

async function dropTaskIdIndex() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const result = await mongoose.connection.db.collection('tasks').dropIndex('id_1');
    console.log('Dropped index:', result);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Index id_1 does not exist.');
    } else {
      console.error('Error dropping index:', err);
    }
    await mongoose.disconnect();
  }
}

dropTaskIdIndex(); 