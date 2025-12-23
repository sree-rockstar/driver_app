"""
Create indexes for vehicle-related collections
Run this once: python create_vehicles_indexes.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "driver_app")


async def create_indexes():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("="*70)
    print("🔧 Creating indexes for vehicle collections...")
    print("="*70)
    
    # ========================================
    # 1. VEHICLES COLLECTION
    # ========================================
    print("\n📦 Creating indexes for 'vehicles' collection...")
    
    # Unique indexes
    await db.vehicles.create_index("vehicle_id", unique=True)
    print("  ✓ Unique index on 'vehicle_id'")
    
    await db.vehicles.create_index("registration_number", unique=True)
    print("  ✓ Unique index on 'registration_number'")
    
    # Query indexes
    await db.vehicles.create_index("status")
    print("  ✓ Index on 'status' (for filtering by status)")
    
    await db.vehicles.create_index("fuel_type")
    print("  ✓ Index on 'fuel_type' (for filtering by fuel type)")
    
    await db.vehicles.create_index("is_electric")
    print("  ✓ Index on 'is_electric' (for filtering EVs)")
    
    await db.vehicles.create_index("current_driver_id")
    print("  ✓ Index on 'current_driver_id' (for finding driver's vehicle)")
    
    # Date indexes
    await db.vehicles.create_index([("insurance_expiry", 1)])
    print("  ✓ Index on 'insurance_expiry' (for expiry alerts)")
    
    await db.vehicles.create_index([("created_at", -1)])
    print("  ✓ Index on 'created_at' (descending, for recent vehicles)")
    
    # Compound index for common queries
    await db.vehicles.create_index([("status", 1), ("fuel_type", 1)])
    print("  ✓ Compound index on 'status' and 'fuel_type'")
    
    # ========================================
    # 2. VEHICLE ASSIGNMENTS COLLECTION
    # ========================================
    print("\n🔗 Creating indexes for 'vehicle_assignments' collection...")
    
    # Compound indexes for common queries
    await db.vehicle_assignments.create_index([("vehicle_id", 1), ("status", 1)])
    print("  ✓ Compound index on 'vehicle_id' and 'status'")
    
    await db.vehicle_assignments.create_index([("driver_id", 1), ("status", 1)])
    print("  ✓ Compound index on 'driver_id' and 'status'")
    
    await db.vehicle_assignments.create_index([("assigned_at", -1)])
    print("  ✓ Index on 'assigned_at' (descending, for recent assignments)")
    
    await db.vehicle_assignments.create_index("status")
    print("  ✓ Index on 'status'")
    
    await db.vehicle_assignments.create_index("assignment_type")
    print("  ✓ Index on 'assignment_type'")
    
    # ========================================
    # 3. CHARGING SESSIONS COLLECTION (EV)
    # ========================================
    print("\n⚡ Creating indexes for 'charging_sessions' collection...")
    
    # Compound indexes for queries
    await db.charging_sessions.create_index([("vehicle_id", 1), ("started_at", -1)])
    print("  ✓ Compound index on 'vehicle_id' and 'started_at'")
    
    await db.charging_sessions.create_index([("driver_id", 1), ("started_at", -1)])
    print("  ✓ Compound index on 'driver_id' and 'started_at'")
    
    await db.charging_sessions.create_index("status")
    print("  ✓ Index on 'status'")
    
    await db.charging_sessions.create_index([("started_at", -1)])
    print("  ✓ Index on 'started_at' (descending, for recent sessions)")
    
    # Index on charging station for analytics
    await db.charging_sessions.create_index("charging_station_name")
    print("  ✓ Index on 'charging_station_name' (for station analytics)")
    
    # ========================================
    # 4. BATTERY HEALTH LOGS COLLECTION (EV)
    # ========================================
    print("\n🔋 Creating indexes for 'battery_health_logs' collection...")
    
    # Compound index for time-series data
    await db.battery_health_logs.create_index([("vehicle_id", 1), ("measured_at", -1)])
    print("  ✓ Compound index on 'vehicle_id' and 'measured_at'")
    
    await db.battery_health_logs.create_index([("measured_at", -1)])
    print("  ✓ Index on 'measured_at' (descending, for latest readings)")
    
    await db.battery_health_logs.create_index("battery_health_percentage")
    print("  ✓ Index on 'battery_health_percentage' (for health queries)")
    
    # ========================================
    # 5. VEHICLE MAINTENANCE COLLECTION
    # ========================================
    print("\n🔧 Creating indexes for 'vehicle_maintenance' collection...")
    
    # Compound indexes
    await db.vehicle_maintenance.create_index([("vehicle_id", 1), ("scheduled_date", -1)])
    print("  ✓ Compound index on 'vehicle_id' and 'scheduled_date'")
    
    await db.vehicle_maintenance.create_index("status")
    print("  ✓ Index on 'status'")
    
    await db.vehicle_maintenance.create_index([("scheduled_date", 1)])
    print("  ✓ Index on 'scheduled_date' (ascending, for upcoming maintenance)")
    
    await db.vehicle_maintenance.create_index([("created_at", -1)])
    print("  ✓ Index on 'created_at' (descending)")
    
    await db.vehicle_maintenance.create_index("maintenance_type")
    print("  ✓ Index on 'maintenance_type'")
    
    # Index for overdue maintenance queries
    await db.vehicle_maintenance.create_index([("status", 1), ("scheduled_date", 1)])
    print("  ✓ Compound index on 'status' and 'scheduled_date' (for overdue)")
    
    # ========================================
    # 6. VEHICLE EXPENSES COLLECTION
    # ========================================
    print("\n💰 Creating indexes for 'vehicle_expenses' collection...")
    
    # Compound indexes for common queries
    await db.vehicle_expenses.create_index([("vehicle_id", 1), ("date", -1)])
    print("  ✓ Compound index on 'vehicle_id' and 'date'")
    
    await db.vehicle_expenses.create_index([("driver_id", 1), ("date", -1)])
    print("  ✓ Compound index on 'driver_id' and 'date'")
    
    await db.vehicle_expenses.create_index("expense_type")
    print("  ✓ Index on 'expense_type' (for filtering by type)")
    
    await db.vehicle_expenses.create_index([("date", -1)])
    print("  ✓ Index on 'date' (descending, for recent expenses)")
    
    # Compound index for expense analytics
    await db.vehicle_expenses.create_index([("expense_type", 1), ("date", -1)])
    print("  ✓ Compound index on 'expense_type' and 'date'")
    
    await db.vehicle_expenses.create_index("trip_id")
    print("  ✓ Index on 'trip_id' (for trip-related expenses)")
    
    # ========================================
    # SUMMARY
    # ========================================
    print("\n" + "="*70)
    print("✅ All indexes created successfully!")
    print("="*70)
    
    # Get index stats
    print("\n📊 Index Summary:")
    collections = [
        "vehicles",
        "vehicle_assignments",
        "charging_sessions",
        "battery_health_logs",
        "vehicle_maintenance",
        "vehicle_expenses"
    ]
    
    total_indexes = 0
    for collection_name in collections:
        indexes = await db[collection_name].list_indexes().to_list(length=100)
        count = len(indexes)
        total_indexes += count
        print(f"  • {collection_name}: {count} indexes")
    
    print(f"\n  Total indexes created: {total_indexes}")
    print("="*70)
    
    client.close()


if __name__ == "__main__":
    print("\n🚀 Fleet Management System - Database Index Creation")
    print("📅 Starting at:", asyncio.get_event_loop().time())
    asyncio.run(create_indexes())
    print("\n✅ Index creation complete! Your database is optimized for queries.")
    print("\n💡 Next step: Run migration script to migrate existing vehicle data")
    print("   Command: python migrate_vehicles_from_drivers.py\n")

