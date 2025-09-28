#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test
 * Tests the React frontend against the FastAPI backend
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

async function testBackendConnection() {
  console.log('🧪 Testing backend connection...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('   ✅ Backend is healthy:', healthData);
    } else {
      console.log('   ❌ Backend health check failed:', healthData);
      return false;
    }
    
    // Test receipts endpoint (GET)
    console.log('\n2. Testing GET /api/receipts...');
    const receiptsResponse = await fetch(`${API_BASE_URL}/api/receipts`);
    const receiptsData = await receiptsResponse.json();
    
    if (receiptsResponse.ok) {
      console.log('   ✅ Receipts endpoint working, found', receiptsData.length, 'receipts');
    } else {
      console.log('   ❌ Receipts endpoint failed:', receiptsData);
      return false;
    }
    
    // Test creating a receipt
    console.log('\n3. Testing POST /api/receipts (create receipt)...');
    const testReceipt = {
      date: new Date().toISOString().split('T')[0],
      time: '12:30',
      total: '15.99',
      imageData: null,
      items: [
        { name: 'Test Coffee', price: '4.99', quantity: '1' },
        { name: 'Test Sandwich', price: '11.00', quantity: '1' }
      ]
    };
    
    const createResponse = await fetch(`${API_BASE_URL}/api/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testReceipt)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('   ✅ Receipt created successfully! ID:', createData.id);
      return createData.id;
    } else {
      console.log('   ❌ Failed to create receipt:', createData);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
    return false;
  }
}

async function testFrontendConfiguration() {
  console.log('\n🎭 Testing frontend configuration...\n');
  
  const config = {
    'API_BASE_URL': process.env.REACT_APP_API_BASE_URL,
    'USE_MOCK_API': process.env.REACT_APP_USE_MOCK_API,
    'ENVIRONMENT': process.env.REACT_APP_ENVIRONMENT,
    'NODE_ENV': process.env.NODE_ENV
  };
  
  console.log('Frontend configuration:');
  Object.entries(config).forEach(([key, value]) => {
    console.log(`   ${key}: ${value || 'not set'}`);
  });
  
  if (process.env.REACT_APP_USE_MOCK_API === 'true') {
    console.log('\n   ⚠️  Warning: Mock API is enabled. Set REACT_APP_USE_MOCK_API=false to test real backend');
  } else {
    console.log('\n   ✅ Mock API is disabled, will use real backend');
  }
}

async function main() {
  console.log('🚀 Frontend-Backend Integration Test\n');
  console.log('🔗 Testing connection to:', API_BASE_URL);
  console.log('');
  
  await testFrontendConfiguration();
  
  const backendWorking = await testBackendConnection();
  
  console.log('\n📋 Summary:');
  console.log('='.repeat(50));
  
  if (backendWorking) {
    console.log('✅ Backend integration is working!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Start your React frontend: npm start');
    console.log('   2. Upload a receipt and try saving it');
    console.log('   3. Check the receipts list page');
  } else {
    console.log('❌ Backend integration has issues');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your FastAPI backend is running:');
    console.log('      cd receiptly-react-backend && ./start.sh');
    console.log('   2. Check that the API URL is correct in .env:');
    console.log(`      REACT_APP_API_BASE_URL=${API_BASE_URL}`);
    console.log('   3. Make sure mock API is disabled:');
    console.log('      REACT_APP_USE_MOCK_API=false');
  }
  
  console.log('');
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}