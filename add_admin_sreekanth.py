#!/usr/bin/env python3
"""
Script to add Sreekanth as admin user
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

# Configuration
MONGODB_URL = "mongodb+srv://thinktreesystemsllp_db_user:hAbdFYj9G8NxUpze@pr-driver-app.0wvhuk1.mongodb.net/?appName=pr-driver-app"
DATABASE_NAME = "driver_app"


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


async def add_admin():
    """Add Sreekanth as admin user"""
    print("=" * 60)
    print("   Adding Admin User: Sreekanth")
    print("=" * 60)
    print()
    
    # User details
    mobile_number = "8884441998"
    full_name = "Sreekanth"
    mpin = "1359"
    
    print(f"📱 Mobile Number: {mobile_number}")
    print(f"👤 Name: {full_name}")
    print(f"🔐 MPIN: {mpin}")
    print()
    
    print("Connecting to MongoDB...")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Check if mobile number already exists
        existing_user = await db.users.find_one({"mobile_number": mobile_number})
        if existing_user:
            print(f"⚠️  User with mobile number {mobile_number} already exists!")
            print(f"   Name: {existing_user.get('full_name')}")
            print(f"   Role: {existing_user.get('role')}")
            print(f"   Status: {existing_user.get('status')}")
            print()
            
            response = input("Do you want to update this user? (yes/no): ").lower()
            if response != "yes":
                print("❌ Operation cancelled")
                client.close()
                return
            
            # Update existing user
            hashed_mpin = hash_password(mpin)
            update_data = {
                "full_name": full_name,
                "mpin_hash": hashed_mpin,
                "hashed_password": hashed_mpin,
                "has_mpin": True,
                "role": "admin",
                "status": "registered",
                "is_verified": True,
                "updated_at": datetime.utcnow(),
            }
            
            await db.users.update_one(
                {"mobile_number": mobile_number},
                {"$set": update_data}
            )
            
            print()
            print("=" * 60)
            print("✅ Admin user updated successfully!")
            print("=" * 60)
        else:
            # Create new admin user
            hashed_mpin = hash_password(mpin)
            admin_user = {
                "mobile_number": mobile_number,
                "full_name": full_name,
                "email": None,
                "mpin_hash": hashed_mpin,
                "hashed_password": hashed_mpin,  # Also set as password for compatibility
                "has_mpin": True,
                "role": "admin",
                "status": "registered",
                "is_verified": True,
                "driving_license_number": None,
                "aadhar_number": None,
                "documents": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            
            result = await db.users.insert_one(admin_user)
            
            print()
            print("=" * 60)
            print("✅ Admin user created successfully!")
            print("=" * 60)
            print()
            print(f"User ID: {result.inserted_id}")
        
        print()
        print("Login Details:")
        print(f"  🌐 URL: http://localhost:5173/login")
        print(f"  📱 Mobile: {mobile_number}")
        print(f"  🔐 MPIN: {mpin}")
        print()
        print("After login, you'll be redirected to:")
        print(f"  🔧 Admin Dashboard: http://localhost:5173/admin")
        print()
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return


if __name__ == "__main__":
    print()
    import sys
    try:
        asyncio.run(add_admin())
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
        sys.exit(0)
    print()
