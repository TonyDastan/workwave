const axios = require('axios');

async function listTasks() {
  try {
    console.log('Fetching tasks...');
    const response = await axios.get('http://localhost:5002/api/tasks');
    
    console.log('\nAPI Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && Array.isArray(response.data.tasks)) {
      console.log('\nAvailable Tasks:');
      response.data.tasks.forEach(task => {
        console.log(`\nID: ${task._id || task.id}`);
        console.log(`Title: ${task.title}`);
        console.log(`Status: ${task.status}`);
        console.log('------------------------');
      });
    } else {
      console.log('\nNo tasks found or unexpected response format');
      console.log('Response data:', response.data);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Error: Could not connect to the server. Make sure the server is running on port 5002');
    } else {
      console.error('Error:', error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : error.message);
    }
  }
}

// Run the test
listTasks(); 