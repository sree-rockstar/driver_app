from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("Connected to MongoDB")


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database():
    """Get database instance"""
    return client[settings.DATABASE_NAME]


