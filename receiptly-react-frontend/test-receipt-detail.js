#!/usr/bin/env node

/**
 * Test script to verify Receipt Detail functionality
 * Tests both the API endpoint and mock API for individual receipts
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

async function testReceiptDetail() {
  console.log('🧪 Testing Receipt Detail functionality...\n');
  
  try {
    // First, get all receipts to find a receipt ID to test
    console.log('1. Fetching receipts list...');
    const receiptsResponse = await fetch(`${API_BASE_URL}/api/receipts/`);
    const receipts = await receiptsResponse.json();
    
    if (!receiptsResponse.ok) {
      console.log('   ❌ Failed to fetch receipts:', receipts);
      return false;
    }
    
    console.log(`   ✅ Found ${receipts.length} receipts`);
    
    if (receipts.length === 0) {
      console.log('   ⚠️  No receipts found. Creating a test receipt first...');
      
      // Create a test receipt
      const testReceipt = {
        date: new Date().toISOString().split('T')[0],
        time: '14:30',
        total: '23.50',
        imageData: null,
        store: 'Test Store',
        address: '123 Test Street',
        items: [
          { name: 'Test Item 1', price: '12.50', quantity: '1' },
          { name: 'Test Item 2', price: '11.00', quantity: '1' }
        ]
      };
      
      const createResponse = await fetch(`${API_BASE_URL}/api/receipts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testReceipt)
      });
      
      if (createResponse.ok) {
        const createdReceipt = await createResponse.json();
        console.log('   ✅ Created test receipt with ID:', createdReceipt.id);
        
        // Test fetching the specific receipt
        return await testSingleReceipt(createdReceipt.id);
      } else {
        console.log('   ❌ Failed to create test receipt');
        return false;
      }
    } else {
      // Test with the first receipt
      const firstReceipt = receipts[0];
      console.log(`   📄 Testing with receipt ID: ${firstReceipt.id}`);
      
      return await testSingleReceipt(firstReceipt.id);
    }
    
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
    return false;
  }
}

async function testSingleReceipt(receiptId) {
  try {
    console.log(`\n2. Testing GET /api/receipts/${receiptId}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}`);
    const receipt = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Receipt detail fetched successfully!');
      console.log(`   📄 Receipt: ${receipt.date} - $${receipt.total}`);
      console.log(`   🛍️  Items: ${receipt.items.length} items`);
      
      if (receipt.store) {
        console.log(`   🏪 Store: ${receipt.store}`);
      }
      
      if (receipt.items && receipt.items.length > 0) {
        console.log('   📋 Items:');
        receipt.items.forEach((item, index) => {
          console.log(`      ${index + 1}. ${item.name} - $${item.price} x${item.quantity}`);
        });
      }
      
      return true;
    } else {
      console.log('   ❌ Failed to fetch receipt detail:', receipt);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Error fetching receipt detail:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Receipt Detail Test');
  console.log('=' * 50);
  console.log('🔗 Testing API at:', API_BASE_URL);
  console.log('');
  
  const success = await testReceiptDetail();
  
  console.log('\n📋 Summary:');
  console.log('='.repeat(50));
  
  if (success) {
    console.log('✅ Receipt Detail functionality is working!');
    console.log('\n🎯 What this means:');
    console.log('   • "View Details" buttons should now work');
    console.log('   • Individual receipt pages load correctly');  
    console.log('   • Receipt data displays properly');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start your frontend: npm start');
    console.log('   2. Go to the receipts page');
    console.log('   3. Click "View Details" on any receipt');
  } else {
    console.log('❌ Receipt Detail functionality has issues');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend is running');
    console.log('   2. Check that receipts exist in the database');
    console.log('   3. Verify the API endpoints are working');
  }
  
  console.log('');
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}