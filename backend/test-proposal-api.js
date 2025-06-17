const axios = require('axios');

// Test data
const taskId = '683a3310c19b45cdfd0b6cbd';
const workerToken = 'YOUR_WORKER_AUTH_TOKEN'; // You'll need to replace this with a valid token
const proposalData = {
  coverLetter: 'This is a test cover letter that meets the minimum length requirement of 50 characters. I am very interested in this task.',
  proposedBudget: 5000,
  estimatedTime: '2 days'
};

// First verify the task exists
async function verifyTask() {
  try {
    console.log('Verifying task exists...');
    const response = await axios.get(
      `http://localhost:5002/api/tasks/${taskId}`
    );
    console.log('Task found:', response.data);
    return true;
  } catch (error) {
    console.error('Error verifying task:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : error.message);
    return false;
  }
}

// Test the API endpoint
async function testProposalSubmission() {
  try {
    console.log('\nTesting proposal submission...');
    console.log('Task ID:', taskId);
    console.log('Proposal Data:', proposalData);

    // First check if task exists
    const taskExists = await verifyTask();
    if (!taskExists) {
      console.error('Cannot submit proposal - task does not exist');
      return;
    }

    const response = await axios.post(
      `http://localhost:5002/api/tasks/${taskId}/proposals`,
      proposalData,
      {
        headers: {
          'Authorization': `Bearer ${workerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\nSuccess!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('\nError submitting proposal:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers
    } : error.message);
  }
}

// Run the test
testProposalSubmission(); 