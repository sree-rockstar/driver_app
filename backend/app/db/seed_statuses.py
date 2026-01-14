"""
Seed initial user statuses into the database
Run this script once to populate the statuses collection
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "driver_app")


async def seed_statuses():
    """Seed initial user statuses"""
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Define initial statuses
    statuses = [
        {
            "name": "Registered",
            "code": "registered",
            "description": "User has completed registration but not set MPIN",
            "color": "#3B82F6",  # Blue
            "is_active": True,
            "order": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Pending for Approval",
            "code": "pending_approval",
            "description": "User has set MPIN and waiting for admin approval",
            "color": "#F59E0B",  # Amber/Orange
            "is_active": True,
            "order": 2,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Active",
            "code": "active",
            "description": "User is approved and can use all features",
            "color": "#10B981",  # Green
            "is_active": True,
            "order": 3,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "In-Active/Suspended",
            "code": "inactive",
            "description": "User account is temporarily suspended",
            "color": "#EF4444",  # Red
            "is_active": True,
            "order": 4,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "De-Activated",
            "code": "deactivated",
            "description": "User account is permanently deactivated",
            "color": "#6B7280",  # Gray
            "is_active": True,
            "order": 5,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]
    
    print(f"Seeding {len(statuses)} user statuses...")
    
    # Check if statuses already exist
    existing_count = await db.user_statuses.count_documents({})
    
    if existing_count > 0:
        print(f"Found {existing_count} existing statuses.")
        response = input("Do you want to recreate all statuses? (yes/no): ").lower()
        if response == "yes":
            print("Deleting existing statuses...")
            await db.user_statuses.delete_many({})
        else:
            print("Keeping existing statuses. Adding only new ones...")
            # Insert only new statuses
            for status in statuses:
                existing = await db.user_statuses.find_one({"code": status["code"]})
                if not existing:
                    await db.user_statuses.insert_one(status)
                    print(f"✅ Added status: {status['name']}")
                else:
                    print(f"⏭️  Skipped (exists): {status['name']}")
            
            client.close()
            print("\n✅ Status seeding completed!")
            return
    
    # Insert all statuses
    result = await db.user_statuses.insert_many(statuses)
    
    # Create index on code (unique)
    await db.user_statuses.create_index("code", unique=True)
    
    print(f"\n✅ Successfully seeded {len(result.inserted_ids)} statuses!")
    print("\nStatuses created:")
    for status in statuses:
        print(f"  - {status['name']} ({status['code']})")
    
    client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("   User Status Seeding Script")
    print("=" * 60)
    print()
    
    try:
        asyncio.run(seed_statuses())
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
    
    print()

