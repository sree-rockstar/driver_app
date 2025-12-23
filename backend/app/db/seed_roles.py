"""
Seed user roles into the database
Run this script once to populate the roles collection
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


async def seed_roles():
    """Seed user roles with permissions"""
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Define roles with permissions
    roles = [
        {
            "name": "Super Admin",
            "code": "super_admin",
            "description": "Full system access. Can manage everything including system configuration.",
            "tier": 1,
            "is_backend_role": True,
            "color": "#DC2626",  # Red
            "permissions": {
                "manage_users": True,
                "view_users": True,
                "approve_drivers": True,
                "manage_drivers": True,
                "view_drivers": True,
                "create_trips": True,
                "assign_trips": True,
                "manage_trips": True,
                "view_trips": True,
                "manage_payments": True,
                "view_payments": True,
                "generate_invoices": True,
                "view_reports": True,
                "export_reports": True,
                "system_config": True,
                "manage_roles": True,
                "verify_documents": True,
                "view_documents": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Admin",
            "code": "admin",
            "description": "Manage drivers, users, and operations. Cannot change system settings.",
            "tier": 2,
            "is_backend_role": True,
            "color": "#7C3AED",  # Purple
            "permissions": {
                "manage_users": True,
                "view_users": True,
                "approve_drivers": True,
                "manage_drivers": True,
                "view_drivers": True,
                "create_trips": True,
                "assign_trips": True,
                "manage_trips": True,
                "view_trips": True,
                "manage_payments": False,
                "view_payments": True,
                "generate_invoices": False,
                "view_reports": True,
                "export_reports": True,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": True,
                "view_documents": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Manager",
            "code": "manager",
            "description": "Assign drivers to trips and monitor operations. View reports.",
            "tier": 2,
            "is_backend_role": True,
            "color": "#2563EB",  # Blue
            "permissions": {
                "manage_users": False,
                "view_users": True,
                "approve_drivers": False,
                "manage_drivers": False,
                "view_drivers": True,
                "create_trips": True,
                "assign_trips": True,
                "manage_trips": True,
                "view_trips": True,
                "manage_payments": False,
                "view_payments": True,
                "generate_invoices": False,
                "view_reports": True,
                "export_reports": True,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": False,
                "view_documents": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Operator/Dispatcher",
            "code": "operator",
            "description": "Create and assign trips, communicate with drivers, handle daily operations.",
            "tier": 3,
            "is_backend_role": True,
            "color": "#059669",  # Green
            "permissions": {
                "manage_users": False,
                "view_users": False,
                "approve_drivers": False,
                "manage_drivers": False,
                "view_drivers": True,
                "create_trips": True,
                "assign_trips": True,
                "manage_trips": True,
                "view_trips": True,
                "manage_payments": False,
                "view_payments": False,
                "generate_invoices": False,
                "view_reports": True,
                "export_reports": False,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": False,
                "view_documents": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Accountant",
            "code": "accountant",
            "description": "Manage payments, process payouts, generate financial reports.",
            "tier": 3,
            "is_backend_role": True,
            "color": "#D97706",  # Amber
            "permissions": {
                "manage_users": False,
                "view_users": False,
                "approve_drivers": False,
                "manage_drivers": False,
                "view_drivers": True,
                "create_trips": False,
                "assign_trips": False,
                "manage_trips": False,
                "view_trips": True,
                "manage_payments": True,
                "view_payments": True,
                "generate_invoices": True,
                "view_reports": True,
                "export_reports": True,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": False,
                "view_documents": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "HR Staff",
            "code": "hr_staff",
            "description": "Manage driver onboarding, verify documents, handle driver records.",
            "tier": 3,
            "is_backend_role": True,
            "color": "#EC4899",  # Pink
            "permissions": {
                "manage_users": False,
                "view_users": True,
                "approve_drivers": True,
                "manage_drivers": True,
                "view_drivers": True,
                "create_trips": False,
                "assign_trips": False,
                "manage_trips": False,
                "view_trips": False,
                "manage_payments": False,
                "view_payments": False,
                "generate_invoices": False,
                "view_reports": True,
                "export_reports": False,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": True,
                "view_documents": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Support Staff",
            "code": "support_staff",
            "description": "Handle customer queries, view information (read-only).",
            "tier": 4,
            "is_backend_role": True,
            "color": "#6366F1",  # Indigo
            "permissions": {
                "manage_users": False,
                "view_users": True,
                "approve_drivers": False,
                "manage_drivers": False,
                "view_drivers": True,
                "create_trips": False,
                "assign_trips": False,
                "manage_trips": False,
                "view_trips": True,
                "manage_payments": False,
                "view_payments": False,
                "generate_invoices": False,
                "view_reports": True,
                "export_reports": False,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": False,
                "view_documents": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Driver",
            "code": "driver",
            "description": "Regular driver with assigned trips and full-time availability.",
            "tier": 5,
            "is_backend_role": False,
            "color": "#10B981",  # Green
            "permissions": {
                "manage_users": False,
                "view_users": False,
                "approve_drivers": False,
                "manage_drivers": False,
                "view_drivers": False,
                "create_trips": False,
                "assign_trips": False,
                "manage_trips": False,
                "view_trips": True,  # Only their own trips
                "manage_payments": False,
                "view_payments": True,  # Only their own payments
                "generate_invoices": False,
                "view_reports": True,  # Only their own reports
                "export_reports": False,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": False,
                "view_documents": True,  # Only their own documents
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Spare Driver",
            "code": "spare_driver",
            "description": "Backup/substitute driver available on-call for emergency or temporary assignments.",
            "tier": 5,
            "is_backend_role": False,
            "color": "#F59E0B",  # Orange
            "permissions": {
                "manage_users": False,
                "view_users": False,
                "approve_drivers": False,
                "manage_drivers": False,
                "view_drivers": False,
                "create_trips": False,
                "assign_trips": False,
                "manage_trips": False,
                "view_trips": True,  # Only their own trips
                "manage_payments": False,
                "view_payments": True,  # Only their own payments
                "generate_invoices": False,
                "view_reports": True,  # Only their own reports
                "export_reports": False,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": False,
                "view_documents": True,  # Only their own documents
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "User/Customer",
            "code": "user",
            "description": "Customer who can book trips and view their bookings.",
            "tier": 5,
            "is_backend_role": False,
            "color": "#8B5CF6",  # Violet
            "permissions": {
                "manage_users": False,
                "view_users": False,
                "approve_drivers": False,
                "manage_drivers": False,
                "view_drivers": False,
                "create_trips": False,  # Can request trips
                "assign_trips": False,
                "manage_trips": False,
                "view_trips": True,  # Only their own bookings
                "manage_payments": False,
                "view_payments": True,  # Only their own payments
                "generate_invoices": False,
                "view_reports": False,
                "export_reports": False,
                "system_config": False,
                "manage_roles": False,
                "verify_documents": False,
                "view_documents": False,
            },
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]
    
    print(f"Seeding {len(roles)} user roles...")
    
    # Check if roles already exist
    existing_count = await db.user_roles.count_documents({})
    
    if existing_count > 0:
        print(f"Found {existing_count} existing roles.")
        response = input("Do you want to recreate all roles? (yes/no): ").lower()
        if response == "yes":
            print("Deleting existing roles...")
            await db.user_roles.delete_many({})
        else:
            print("Keeping existing roles. Adding only new ones...")
            # Insert only new roles
            for role in roles:
                existing = await db.user_roles.find_one({"code": role["code"]})
                if not existing:
                    await db.user_roles.insert_one(role)
                    print(f"✅ Added role: {role['name']}")
                else:
                    print(f"⏭️  Skipped (exists): {role['name']}")
            
            client.close()
            print("\n✅ Role seeding completed!")
            return
    
    # Insert all roles
    result = await db.user_roles.insert_many(roles)
    
    # Create index on code (unique)
    await db.user_roles.create_index("code", unique=True)
    
    print(f"\n✅ Successfully seeded {len(result.inserted_ids)} roles!")
    print("\n" + "="*70)
    print("Roles created:")
    print("="*70)
    
    # Group by tier
    tiers = {
        1: "System Level",
        2: "Management Level",
        3: "Operations Level",
        4: "Support Level",
        5: "External/Field Level"
    }
    
    for tier_num, tier_name in tiers.items():
        tier_roles = [r for r in roles if r["tier"] == tier_num]
        if tier_roles:
            print(f"\n📊 {tier_name}:")
            for role in tier_roles:
                icon = "🏢" if role["is_backend_role"] else "🚗"
                print(f"  {icon} {role['name']:<25} ({role['code']})")
    
    print("\n" + "="*70)
    
    # Update Sreekanth to Super Admin
    print("\n🔧 Updating Sreekanth's role to Super Admin...")
    result = await db.users.update_one(
        {"mobile_number": "9945610425"},
        {"$set": {"role": "super_admin", "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count > 0:
        print("✅ Sreekanth is now Super Admin!")
    else:
        user = await db.users.find_one({"mobile_number": "9945610425"})
        if user:
            print(f"ℹ️  Sreekanth's current role: {user.get('role', 'Not set')}")
        else:
            print("⚠️  Sreekanth's account not found. Please register first.")
    
    client.close()


if __name__ == "__main__":
    print("=" * 70)
    print("   User Role Seeding Script - PR TRAVELS")
    print("=" * 70)
    print()
    
    try:
        asyncio.run(seed_roles())
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print()


