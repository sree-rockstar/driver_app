"""
Script to create indexes for the trips collection in MongoDB.
Run this script after setting up your database.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def create_trips_indexes():
    """Create indexes for the trips collection"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    print("Creating indexes for trips collection...")
    
    # Index on user_id for faster queries by user
    await db.trips.create_index("user_id")
    print("✓ Created index on user_id")
    
    # Compound index on user_id and trip_id for uniqueness check
    await db.trips.create_index([("user_id", 1), ("trip_id", 1)], unique=True)
    print("✓ Created compound unique index on user_id and trip_id")
    
    # Index on site for filtering by work site
    await db.trips.create_index("site")
    print("✓ Created index on site")
    
    # Index on date for sorting and filtering by date
    await db.trips.create_index([("user_id", 1), ("date", -1)])
    print("✓ Created compound index on user_id and date (descending)")
    
    # Index on created_at for sorting by creation time
    await db.trips.create_index("created_at")
    print("✓ Created index on created_at")
    
    print("\n✅ All indexes created successfully!")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(create_trips_indexes())


