const axios = require('axios');

const API_URL = 'http://localhost:5002/api';
let authToken = '';
let taskId = '';
let messageId = '';

// Test user data
const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'client',
    phone: '1234567890'
};

// Test task data
const testTask = {
    title: 'House Cleaning',
    description: 'Need house cleaning service',
    category: 'Cleaning',
    location: 'New York',
    budget: 100,
    deadline: '2024-04-01T00:00:00.000Z',
    isUrgent: true
};

// Test message data
const testMessage = {
    content: 'Hello, I\'m interested in your task',
    receiver: '', // Will be set after creating another user
    task: '' // Will be set after creating a task
};

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };
        if (data) config.data = data;
        return await axios(config);
    } catch (error) {
        console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
};

// Test registration
const testRegistration = async () => {
    try {
        console.log('Attempting to register user with data:', testUser);
        const response = await axios.post(`${API_URL}/auth/register`, testUser);
        console.log('Registration successful:', response.data);
        authToken = response.data.token;
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error.response?.data || error.message);
        throw error;
    }
};

// Test login
const testLogin = async () => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('Login successful:', response.data);
        authToken = response.data.token;
        return response.data;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
};

// Test create task
const testCreateTask = async () => {
    try {
        const response = await makeAuthRequest('post', '/tasks', testTask);
        console.log('Task created successfully:', response.data);
        taskId = response.data._id;
        return response.data;
    } catch (error) {
        console.error('Create task failed:', error.response?.data || error.message);
        throw error;
    }
};

// Test get tasks
const testGetTasks = async () => {
    try {
        const response = await makeAuthRequest('get', '/tasks');
        console.log('Tasks retrieved successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get tasks failed:', error.response?.data || error.message);
        throw error;
    }
};

// Test create message
const testCreateMessage = async () => {
    try {
        const messageData = {
            ...testMessage,
            task: taskId
        };
        const response = await makeAuthRequest('post', '/messages', messageData);
        console.log('Message created successfully:', response.data);
        messageId = response.data._id;
        return response.data;
    } catch (error) {
        console.error('Create message failed:', error.response?.data || error.message);
        throw error;
    }
};

// Run all tests
const runTests = async () => {
    try {
        console.log('Starting API tests...');
        
        // Test registration
        await testRegistration();
        
        console.log('Registration test completed successfully!');
    } catch (error) {
        console.error('Registration test failed:', error);
    }
};

// Run the tests
runTests(); 