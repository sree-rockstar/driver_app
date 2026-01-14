"""
Migrate existing vehicle data from driver records to separate vehicle entities
Run this once: python migrate_vehicles_from_drivers.py

This script:
1. Finds all drivers with vehicle information (vehicle_type, vehicle_number)
2. Creates separate vehicle records
3. Creates permanent assignments linking drivers to vehicles
4. Updates driver records with vehicle references
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


async def migrate_vehicles():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("="*70)
    print("🚀 Fleet Management Migration - Vehicles from Drivers")
    print("="*70)
    print(f"\nDatabase: {DATABASE_NAME}")
    print(f"MongoDB URL: {MONGODB_URL[:30]}...")
    
    # Get all drivers
    total_drivers = await db.drivers.count_documents({})
    print(f"\nTotal drivers in database: {total_drivers}")
    
    # Get drivers with vehicle info
    drivers_with_vehicles_count = await db.drivers.count_documents({
        "vehicle_type": {"$exists": True, "$ne": None, "$ne": ""},
        "vehicle_number": {"$exists": True, "$ne": None, "$ne": ""}
    })
    
    print(f"Drivers with vehicle information: {drivers_with_vehicles_count}")
    
    if drivers_with_vehicles_count == 0:
        print("\n⚠️  No drivers with vehicle information found.")
        print("   This is normal if this is a new installation.")
        print("   You can add vehicles manually through the admin panel.\n")
        client.close()
        return
    
    print(f"\n{'='*70}")
    print("Starting migration...")
    print(f"{'='*70}\n")
    
    # Get all drivers with vehicle info
    drivers_cursor = db.drivers.find({
        "vehicle_type": {"$exists": True, "$ne": None, "$ne": ""},
        "vehicle_number": {"$exists": True, "$ne": None, "$ne": ""}
    })
    
    migrated = 0
    skipped = 0
    errors = 0
    
    async for driver in drivers_cursor:
        vehicle_number = driver.get("vehicle_number")
        vehicle_type = driver.get("vehicle_type", "Unknown")
        user_id = driver.get("user_id")
        
        if not vehicle_number or not user_id:
            skipped += 1
            continue
        
        print(f"Processing: Driver {user_id} → Vehicle {vehicle_number}")
        
        try:
            # Check if vehicle already exists
            existing = await db.vehicles.find_one({"registration_number": vehicle_number})
            
            if existing:
                print(f"  ⏭️  Vehicle {vehicle_number} already exists")
                
                # Update driver with vehicle reference
                await db.drivers.update_one(
                    {"_id": driver["_id"]},
                    {
                        "$set": {
                            "assigned_vehicle_id": existing["vehicle_id"],
                            "vehicle_assignment_type": "permanent",
                            "migrated_to_fleet": True
                        }
                    }
                )
                skipped += 1
                continue
            
            # Generate vehicle_id
            count = await db.vehicles.count_documents({})
            vehicle_id = f"VEH{str(count + 1).zfill(3)}"
            
            # Determine if electric
            is_electric = vehicle_type.lower() in ["electric", "ev", "electric vehicle", "e-vehicle"]
            
            # Determine fuel type
            if is_electric:
                fuel_type = "electric"
            elif "diesel" in vehicle_type.lower():
                fuel_type = "diesel"
            elif "petrol" in vehicle_type.lower() or "gasoline" in vehicle_type.lower():
                fuel_type = "petrol"
            elif "cng" in vehicle_type.lower():
                fuel_type = "cng"
            elif "hybrid" in vehicle_type.lower():
                fuel_type = "hybrid"
            else:
                fuel_type = "diesel"  # Default
            
            # Create vehicle document
            vehicle_doc = {
                "vehicle_id": vehicle_id,
                "registration_number": vehicle_number,
                "make": driver.get("vehicle_make", "Unknown"),
                "model": driver.get("vehicle_model", "Unknown"),
                "year": driver.get("vehicle_year", 2020),
                "color": driver.get("vehicle_color", "Unknown"),
                "vehicle_type": vehicle_type,
                "seating_capacity": driver.get("seating_capacity", 5),
                "fuel_type": fuel_type,
                "is_electric": is_electric,
                "status": "in_use",
                "condition": "good",
                "current_driver_id": user_id,
                "odometer_reading": driver.get("odometer_reading", 0),
                "documents": {},
                "photos": {},
                "ownership_type": "owned",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "migration_script"
            }
            
            # Add EV details if electric
            if is_electric:
                vehicle_doc["ev_details"] = {
                    "battery_capacity": 60,  # Default, should be updated manually
                    "current_battery_level": 100,
                    "estimated_range": 340,
                    "current_range": 340,
                    "charging_type": "AC+DC",
                    "max_charging_speed": 50,
                    "charging_status": "not_charging",
                    "battery_health": 100,
                    "charging_cycles": 0,
                    "home_charging_available": False
                }
            
            # Insert vehicle
            result = await db.vehicles.insert_one(vehicle_doc)
            
            # Create permanent assignment
            assignment_doc = {
                "vehicle_id": vehicle_id,
                "driver_id": user_id,
                "assigned_at": datetime.utcnow(),
                "assignment_type": "permanent",
                "odometer_at_assignment": driver.get("odometer_reading", 0),
                "condition_at_assignment": "good",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.vehicle_assignments.insert_one(assignment_doc)
            
            # Update driver with vehicle reference
            await db.drivers.update_one(
                {"_id": driver["_id"]},
                {
                    "$set": {
                        "assigned_vehicle_id": vehicle_id,
                        "vehicle_assignment_type": "permanent",
                        "migrated_to_fleet": True
                    }
                }
            )
            
            migrated += 1
            print(f"  ✅ Migrated {vehicle_number} → {vehicle_id} ({fuel_type})")
            
            if is_electric:
                print(f"     ⚡ EV detected - update battery specs manually")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error migrating {vehicle_number}: {str(e)}")
    
    # Print summary
    print(f"\n{'='*70}")
    print("📊 Migration Summary")
    print(f"{'='*70}")
    print(f"  ✅ Successfully migrated: {migrated}")
    print(f"  ⏭️  Skipped (already exists): {skipped}")
    print(f"  ❌ Errors: {errors}")
    print(f"  📊 Total processed: {migrated + skipped + errors}")
    print(f"{'='*70}")
    
    if migrated > 0:
        print("\n✨ Migration successful!")
        print("\n📝 Next steps:")
        print("   1. Review migrated vehicles in the admin panel")
        print("   2. Update vehicle details (make, model, year, etc.)")
        print("   3. Upload vehicle photos")
        print("   4. Upload vehicle documents (RC, Insurance, etc.)")
        print("   5. For EVs: Update battery capacity and charging details")
    
    if errors > 0:
        print(f"\n⚠️  {errors} error(s) occurred during migration")
        print("   Check the error messages above for details")
    
    print()
    
    client.close()


async def rollback_migration():
    """
    Rollback migration - use with caution!
    This will delete all migrated vehicles and assignments
    """
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("\n⚠️  ROLLBACK MODE")
    print("="*70)
    
    # Count affected records
    vehicles_count = await db.vehicles.count_documents({"created_by": "migration_script"})
    assignments_count = await db.vehicle_assignments.count_documents({})
    
    if vehicles_count == 0:
        print("No migrated vehicles found. Nothing to rollback.")
        client.close()
        return
    
    print(f"Found {vehicles_count} vehicles created by migration")
    print(f"Found {assignments_count} assignments")
    
    confirm = input("\nAre you sure you want to DELETE these records? (type 'YES' to confirm): ")
    
    if confirm == "YES":
        # Delete vehicles created by migration
        result1 = await db.vehicles.delete_many({"created_by": "migration_script"})
        print(f"  ✅ Deleted {result1.deleted_count} vehicles")
        
        # Delete all assignments (be careful!)
        result2 = await db.vehicle_assignments.delete_many({})
        print(f"  ✅ Deleted {result2.deleted_count} assignments")
        
        # Remove vehicle references from drivers
        result3 = await db.drivers.update_many(
            {"migrated_to_fleet": True},
            {
                "$unset": {
                    "assigned_vehicle_id": "",
                    "vehicle_assignment_type": "",
                    "migrated_to_fleet": ""
                }
            }
        )
        print(f"  ✅ Updated {result3.modified_count} driver records")
        
        print("\n✅ Rollback complete!")
    else:
        print("\n❌ Rollback cancelled")
    
    client.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--rollback":
        print("\n🔄 Running migration rollback...")
        asyncio.run(rollback_migration())
    else:
        print("\n🚀 Running vehicle migration...")
        print("   (Use --rollback flag to undo migration)\n")
        asyncio.run(migrate_vehicles())

