"""
Seed script for trip types and payment methods
"""
import asyncio
from datetime import datetime
from app.db.mongodb import get_database, connect_to_mongo, close_mongo_connection


async def seed_trip_types():
    """Seed initial trip types"""
    db = get_database()
    
    trip_types = [
        "Quick Ride",
        "Ola",
        "Uber",
        "Rapido",
        "Namma Yatri",
        "Rental",
        "Company Duty"
    ]
    
    for trip_type_name in trip_types:
        existing = await db.trip_types.find_one({"name": trip_type_name})
        if not existing:
            trip_type_data = {
                "name": trip_type_name,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.trip_types.insert_one(trip_type_data)
            print(f"✅ Created trip type: {trip_type_name}")
        else:
            print(f"⏭️  Trip type already exists: {trip_type_name}")


async def seed_payment_methods():
    """Seed initial payment methods"""
    db = get_database()
    
    payment_methods = [
        "Cash",
        "Credit",
        "UPI"
    ]
    
    for payment_method_name in payment_methods:
        existing = await db.payment_methods.find_one({"name": payment_method_name})
        if not existing:
            payment_method_data = {
                "name": payment_method_name,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.payment_methods.insert_one(payment_method_data)
            print(f"✅ Created payment method: {payment_method_name}")
        else:
            print(f"⏭️  Payment method already exists: {payment_method_name}")


async def main():
    print("🌱 Seeding trip configuration data...")
    await connect_to_mongo()
    
    print("\n📋 Seeding Trip Types...")
    await seed_trip_types()
    
    print("\n💳 Seeding Payment Methods...")
    await seed_payment_methods()
    
    await close_mongo_connection()
    print("\n✅ Seeding completed!")


if __name__ == "__main__":
    asyncio.run(main())

