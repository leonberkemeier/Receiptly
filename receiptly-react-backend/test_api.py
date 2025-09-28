#!/usr/bin/env python3
"""
Simple test script to verify the FastAPI backend is working correctly.
Run this after starting the server with: python main.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_endpoints():
    """Test health check endpoints."""
    print("🧪 Testing health endpoints...")
    
    # Test root endpoint
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Root endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test health endpoint
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")

def test_receipts_endpoints():
    """Test receipts CRUD operations."""
    print("\n🧾 Testing receipts endpoints...")
    
    # Test GET all receipts (empty initially)
    try:
        response = requests.get(f"{BASE_URL}/api/receipts/")
        print(f"✅ GET receipts: {response.status_code} - Found {len(response.json())} receipts")
    except Exception as e:
        print(f"❌ GET receipts failed: {e}")
    
    # Test CREATE receipt
    receipt_data = {
        "date": "2024-01-15",
        "time": "14:30",
        "total": "25.99",
        "imageData": None,
        "items": [
            {"name": "Coffee", "price": "4.99", "quantity": "1"},
            {"name": "Sandwich", "price": "12.99", "quantity": "1"},
            {"name": "Cookie", "price": "8.01", "quantity": "1"}
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/receipts/", json=receipt_data)
        if response.status_code == 201:
            created_receipt = response.json()
            print(f"✅ CREATE receipt: {response.status_code} - Created receipt ID: {created_receipt['id']}")
            return created_receipt['id']
        else:
            print(f"❌ CREATE receipt failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ CREATE receipt failed: {e}")
        return None

def test_api_docs():
    """Test API documentation endpoints."""
    print("\n📚 Testing API documentation...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API docs available at: http://localhost:8000/docs")
        else:
            print(f"❌ API docs not available: {response.status_code}")
    except Exception as e:
        print(f"❌ API docs test failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Receiptly API tests...")
    print("Make sure the server is running with: python main.py\n")
    
    test_health_endpoints()
    receipt_id = test_receipts_endpoints()
    test_api_docs()
    
    print("\n🎉 Tests completed!")
    print("Visit http://localhost:8000/docs for interactive API documentation")