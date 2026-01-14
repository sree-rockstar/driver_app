"""
Update specific user to Super Admin role
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "driver_app")

# User ID to update
USER_ID = "694964b921b761f59fc4634a"


async def update_to_super_admin():
    """Update user to super_admin role"""
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Convert string ID to ObjectId
        user_object_id = ObjectId(USER_ID)
        
        # Find the user first
        user = await db.users.find_one({"_id": user_object_id})
        
        if not user:
            print(f"❌ User with ID {USER_ID} not found!")
            client.close()
            return
        
        print(f"\n📋 User Found:")
        print(f"   Name: {user.get('full_name', 'N/A')}")
        print(f"   Mobile: {user.get('mobile_number', 'N/A')}")
        print(f"   Current Role: {user.get('role', 'N/A')}")
        print(f"   Current Status: {user.get('status', 'N/A')}")
        
        # Update to super_admin
        print(f"\n🔧 Updating to Super Admin...")
        result = await db.users.update_one(
            {"_id": user_object_id},
            {
                "$set": {
                    "role": "super_admin",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ Successfully updated user to Super Admin!")
            
            # Fetch updated user
            updated_user = await db.users.find_one({"_id": user_object_id})
            print(f"\n📋 Updated User Details:")
            print(f"   Name: {updated_user.get('full_name', 'N/A')}")
            print(f"   Mobile: {updated_user.get('mobile_number', 'N/A')}")
            print(f"   Role: {updated_user.get('role', 'N/A')}")
            print(f"   Status: {updated_user.get('status', 'N/A')}")
        else:
            print(f"ℹ️  User already has super_admin role or no changes made.")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("   Update User to Super Admin")
    print("=" * 60)
    print()
    
    asyncio.run(update_to_super_admin())
    
    print()
    print("=" * 60)


