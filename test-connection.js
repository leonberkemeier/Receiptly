#!/usr/bin/env node

// Simple test script to verify frontend-backend connection
// Run this with: node test-connection.js

console.log('🧪 Testing Frontend-Backend Connection...\n');

// Test 1: Check if backend is accessible
async function testBackendHealth() {
  try {
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    console.log('✅ Backend Health Check:', data);
    return true;
  } catch (error) {
    console.log('❌ Backend Health Check Failed:', error.message);
    return false;
  }
}

// Test 2: Test user registration
async function testRegistration() {
  try {
    const testUser = {
      name: 'Test User Connection',
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    };

    const response = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Registration Test Passed:', {
        user: data.user.name,
        email: data.user.email,
        hasToken: !!data.token
      });
      return data.token;
    } else {
      console.log('❌ Registration Test Failed:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Registration Test Failed:', error.message);
    return null;
  }
}

// Test 3: Test authenticated endpoint
async function testAuthenticatedEndpoint(token) {
  if (!token) {
    console.log('⏭️  Skipping authenticated endpoint test (no token)');
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/api/receipts/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authenticated Endpoint Test Passed:', {
        receiptsCount: data.length
      });
    } else {
      console.log('❌ Authenticated Endpoint Test Failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Authenticated Endpoint Test Failed:', error.message);
  }
}

// Test 4: Check frontend is accessible
async function testFrontendHealth() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Frontend is accessible on http://localhost:3000');
      return true;
    } else {
      console.log('❌ Frontend not accessible:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Testing Backend...');
  const backendOk = await testBackendHealth();
  
  console.log('\nTesting Frontend...');
  const frontendOk = await testFrontendHealth();
  
  if (!backendOk || !frontendOk) {
    console.log('\n❌ Basic connectivity failed. Please ensure both servers are running.');
    return;
  }
  
  console.log('\nTesting Authentication...');
  const token = await testRegistration();
  
  console.log('\nTesting Authenticated Endpoints...');
  await testAuthenticatedEndpoint(token);
  
  console.log('\n🎉 Connection tests completed!');
  console.log('\n📋 Instructions:');
  console.log('   1. Open http://localhost:3000 in your browser');
  console.log('   2. Try to register a new account');
  console.log('   3. If you see "Network error occurred", check the browser console for details');
  console.log('   4. Backend API docs: http://localhost:8000/docs');
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  console.log('Installing fetch for Node.js...');
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    runTests();
  }).catch(() => {
    console.log('⚠️  Please install node-fetch: npm install node-fetch');
    console.log('Or test manually in your browser console.');
  });
} else {
  runTests();
}