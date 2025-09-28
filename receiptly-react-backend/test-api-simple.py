#!/usr/bin/env python3
"""
Simple API test to verify FastAPI endpoints work correctly
"""

import asyncio
import httpx
from main import app
import uvicorn
import threading
import time


def run_server():
    """Run the FastAPI server in a thread"""
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")


async def test_api():
    """Test the API endpoints"""
    print("🧪 Testing FastAPI endpoints...\n")
    
    # Wait for server to start
    await asyncio.sleep(2)
    
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8001") as client:
        try:
            # Test health endpoint
            print("1. Testing health endpoint...")
            response = await client.get("/health")
            if response.status_code == 200:
                print("   ✅ Health check passed:", response.json())
            else:
                print("   ❌ Health check failed:", response.status_code)
                return False
            
            # Test creating a receipt
            print("\n2. Testing POST /api/receipts...")
            receipt_data = {
                "date": "2024-01-15",
                "time": "14:30", 
                "total": "25.99",
                "items": [
                    {"name": "API Test Coffee", "price": "4.99", "quantity": "1"},
                    {"name": "API Test Sandwich", "price": "21.00", "quantity": "1"}
                ]
            }
            
            response = await client.post("/api/receipts/", json=receipt_data)
            if response.status_code == 201:
                receipt = response.json()
                print(f"   ✅ Receipt created successfully! ID: {receipt['id']}")
                return receipt['id']
            else:
                print(f"   ❌ Failed to create receipt: {response.status_code}")
                print(f"      Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ API test failed: {e}")
            return False


async def main():
    """Main test function"""
    print("🚀 FastAPI Test")
    print("=" * 40)
    
    # Start server in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give server time to start
    print("⏳ Starting server...")
    await asyncio.sleep(3)
    
    # Test the API
    result = await test_api()
    
    if result:
        print("\n✅ All API tests passed!")
        print("🎉 Your FastAPI backend is working correctly!")
    else:
        print("\n❌ API tests failed!")
        print("🔧 Check the error messages above for troubleshooting")


if __name__ == "__main__":
    asyncio.run(main())