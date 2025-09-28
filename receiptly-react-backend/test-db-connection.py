#!/usr/bin/env python3
"""
Test script to verify database connection and create a sample receipt
"""

import asyncio
import os
from datetime import datetime

from prisma import Prisma


async def test_database_connection():
    """Test database connection and CRUD operations."""
    
    print("🧪 Testing database connection...\n")
    
    # Create Prisma client
    db = Prisma()
    
    try:
        # Connect to database
        print("1. Connecting to database...")
        await db.connect()
        print("   ✅ Connected successfully!")
        
        # Test creating a receipt
        print("\n2. Creating test receipt...")
        
        receipt_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": "12:30",
            "total": "19.99",
            "imageData": None,
            "items": {
                "create": [
                    {"name": "Test Coffee", "price": "4.99", "quantity": "1"},
                    {"name": "Test Pastry", "price": "15.00", "quantity": "1"}
                ]
            }
        }
        
        receipt = await db.receipt.create(
            data=receipt_data,
            include={"items": True}
        )
        
        print(f"   ✅ Receipt created with ID: {receipt.id}")
        print(f"   📄 Receipt has {len(receipt.items)} items")
        
        # Test fetching receipts
        print("\n3. Fetching all receipts...")
        receipts = await db.receipt.find_many(include={"items": True})
        print(f"   ✅ Found {len(receipts)} receipts in database")
        
        # Show the latest receipt
        if receipts:
            latest = receipts[0]
            print(f"   📋 Latest receipt: {latest.date} - ${latest.total}")
            for item in latest.items:
                print(f"      • {item.name}: ${item.price} x{item.quantity}")
        
        print("\n🎉 Database test completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Database test failed: {str(e)}")
        return False
        
    finally:
        # Disconnect
        await db.disconnect()
        print("\n🔌 Disconnected from database")


async def main():
    """Main test function."""
    print("🚀 Database Connection Test")
    print("=" * 40)
    print(f"📍 DATABASE_URL: {os.getenv('DATABASE_URL', 'not set')}\n")
    
    success = await test_database_connection()
    
    if success:
        print("\n✅ All tests passed! Your database connection is working.")
    else:
        print("\n❌ Tests failed. Check your database configuration.")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running: docker-compose up -d postgres")
        print("2. Verify DATABASE_URL in .env file")
        print("3. Run: prisma db push")


if __name__ == "__main__":
    asyncio.run(main())