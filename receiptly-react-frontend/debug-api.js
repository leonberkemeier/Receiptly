// Debug script to test the API functionality
const { JSDOM } = require('jsdom');

// Mock browser environment
const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>', {
  url: 'http://localhost:3000'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock environment variables
process.env.REACT_APP_API_BASE_URL = 'http://localhost:8000';
process.env.NODE_ENV = 'development';

// Import the mock API setup
const { setupMockApi } = require('./src/utils/mockApi.ts');

console.log('Setting up mock API...');
setupMockApi();

// Test the API call
async function testApiCall() {
  try {
    console.log('Testing API call...');
    
    const testData = {
      items: [
        { name: 'Test Item', price: '5.00', quantity: '1' }
      ],
      total: '5.00',
      date: '2024-01-01',
      time: '12:00',
      store: 'Test Store',
      address: 'Test Address'
    };
    
    const response = await fetch('http://localhost:8000/api/receipts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const result = await response.json();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testApiCall();