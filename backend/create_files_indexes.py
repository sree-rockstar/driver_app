#!/usr/bin/env python3
"""
Create indexes for the files collection
Run this after migration to optimize queries
"""

import asyncio
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb import get_database


async def create_indexes():
    """Create indexes for the files collection"""
    db = get_database()
    
    print("Creating indexes for files collection...")
    print("=" * 60)
    
    try:
        # Index on user_id for fast user file lookups
        result = await db.files.create_index("user_id")
        print(f"✓ Created index on user_id: {result}")
        
        # Index on file_type for filtering by document type
        result = await db.files.create_index("file_type")
        print(f"✓ Created index on file_type: {result}")
        
        # Index on status for filtering active/deleted files
        result = await db.files.create_index("status")
        print(f"✓ Created index on status: {result}")
        
        # Compound index on user_id and file_type for common queries
        result = await db.files.create_index([("user_id", 1), ("file_type", 1)])
        print(f"✓ Created compound index on (user_id, file_type): {result}")
        
        # Index on uploaded_at for sorting by date
        result = await db.files.create_index("uploaded_at")
        print(f"✓ Created index on uploaded_at: {result}")
        
        print("=" * 60)
        print("All indexes created successfully!")
        
        # List all indexes
        print("\nCurrent indexes on files collection:")
        indexes = await db.files.list_indexes().to_list(length=None)
        for idx in indexes:
            print(f"  - {idx['name']}: {idx.get('key', {})}")
        
    except Exception as e:
        print(f"✗ Error creating indexes: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    print("Files Collection Index Creation")
    print("=" * 60)
    asyncio.run(create_indexes())

