#!/usr/bin/env python3
"""
Script to create an admin user via command line
Run this to create your first admin account
"""

import asyncio
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Configuration
MONGODB_URL = "mongodb+srv://thinktreesystemsllp_db_user:hAbdFYj9G8NxUpze@pr-driver-app.0wvhuk1.mongodb.net/?appName=pr-driver-app"
DATABASE_NAME = "driver_app"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin():
    """Create an admin user"""
    print("=" * 50)
    print("   Create Admin User for Driver App")
    print("=" * 50)
    print()
    
    # Get user input
    mobile_number = input("Enter Admin Mobile Number (10 digits): ").strip()
    
    # Validate mobile number
    if len(mobile_number) != 10 or not mobile_number.isdigit():
        print("❌ Error: Mobile number must be exactly 10 digits")
        return
    
    full_name = input("Enter Admin Full Name: ").strip()
    if not full_name:
        print("❌ Error: Name cannot be empty")
        return
    
    email = input("Enter Admin Email (optional, press Enter to skip): ").strip() or None
    
    password = input("Enter Admin Password (min 6 characters): ").strip()
    if len(password) < 6:
        print("❌ Error: Password must be at least 6 characters")
        return
    
    confirm_password = input("Confirm Password: ").strip()
    if password != confirm_password:
        print("❌ Error: Passwords do not match")
        return
    
    print()
    print("Connecting to MongoDB...")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Check if mobile number already exists
        existing_user = await db.users.find_one({"mobile_number": mobile_number})
        if existing_user:
            print(f"❌ Error: Mobile number {mobile_number} is already registered")
            client.close()
            return
        
        # Create admin user
        admin_user = {
            "mobile_number": mobile_number,
            "full_name": full_name,
            "email": email,
            "hashed_password": pwd_context.hash(password),
            "role": "admin",
            "is_active": True,
            "is_verified": True,  # Admins are auto-verified
            "driving_license_number": None,
            "aadhar_number": None,
            "documents": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        result = await db.users.insert_one(admin_user)
        
        print()
        print("=" * 50)
        print("✅ Admin user created successfully!")
        print("=" * 50)
        print()
        print("Admin Details:")
        print(f"  Mobile Number: {mobile_number}")
        print(f"  Name: {full_name}")
        if email:
            print(f"  Email: {email}")
        print(f"  Role: admin")
        print(f"  User ID: {result.inserted_id}")
        print()
        print("You can now login at: http://localhost:5173/login")
        print(f"  Username: {mobile_number}")
        print(f"  Password: [your password]")
        print()
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return


if __name__ == "__main__":
    print()
    try:
        asyncio.run(create_admin())
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
        sys.exit(0)
    print()

