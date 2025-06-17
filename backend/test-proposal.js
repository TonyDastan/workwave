const axios = require('axios');

// Test data
const taskId = '683a3310c19b45cdfd0b6cbd'; // task4
const proposalData = {
  coverLetter: 'This is a test cover letter that meets the minimum length requirement of 50 characters. I am very interested in this task.',
  proposedBudget: 5000,
  estimatedTime: '2 days'
};

// First, we need to authenticate as a worker
const workerCredentials = {
  email: 'testworker@example.com',
  password: 'testpassword123'
};

// Base URL for API
const API_URL = 'http://localhost:5002/api';

async function testProposalSubmission() {
  try {
    // 1. Register a test worker if needed
    console.log('1. Registering test worker...');
    console.log('Request URL:', `${API_URL}/auth/register`);
    console.log('Request Data:', { ...workerCredentials, firstName: 'Test', lastName: 'Worker', role: 'worker' });
    
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'Worker',
        email: workerCredentials.email,
        password: workerCredentials.password,
        role: 'worker'
      });
      console.log('Worker registered successfully:', registerResponse.data);
    } catch (error) {
      if (error.response && error.response.data.message === 'User already exists') {
        console.log('Worker already exists, proceeding with login');
      } else {
        throw error;
      }
    }

    // 2. Login to get auth token
    console.log('\n2. Logging in as worker...');
    console.log('Request URL:', `${API_URL}/auth/login`);
    console.log('Request Data:', workerCredentials);
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, workerCredentials);
    const token = loginResponse.data.token;
    console.log('Login successful, got token:', token);

    // 3. Verify the task exists
    console.log('\n3. Verifying task exists...');
    console.log('Request URL:', `${API_URL}/tasks/${taskId}`);
    
    const taskResponse = await axios.get(`${API_URL}/tasks/${taskId}`);
    console.log('Task found:', taskResponse.data);

    // 4. Submit the proposal
    console.log('\n4. Submitting proposal...');
    console.log('Request URL:', `${API_URL}/tasks/${taskId}/apply`);
    console.log('Request Data:', proposalData);
    console.log('Request Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const response = await axios.post(
      `${API_URL}/tasks/${taskId}/apply`,
      proposalData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('\n5. Success!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('\nError:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : undefined,
      request: error.request ? {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data,
        headers: error.config?.headers
      } : undefined
    });
  }
}

// Run the test
testProposalSubmission(); 