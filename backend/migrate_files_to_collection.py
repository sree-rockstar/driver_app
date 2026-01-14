#!/usr/bin/env python3
"""
Migration script to move file paths from users collection to files collection
Run this once to migrate existing users' documents to the new files collection
"""

import asyncio
import sys
import os
from datetime import datetime
from bson import ObjectId

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb import get_database


async def migrate_files():
    """Migrate existing file paths to files collection"""
    db = get_database()
    
    print("Starting migration of file paths to files collection...")
    
    # Get all users with documents
    users = await db.users.find({"documents": {"$exists": True, "$ne": None}}).to_list(length=None)
    
    print(f"Found {len(users)} users with documents")
    
    migrated_count = 0
    error_count = 0
    
    for user in users:
        try:
            user_id = str(user["_id"])
            documents = user.get("documents", {})
            
            if not documents:
                continue
            
            print(f"\nMigrating documents for user: {user.get('full_name')} ({user.get('mobile_number')})")
            
            new_document_refs = {}
            
            # Process each document type
            for doc_type, file_path in documents.items():
                if not file_path:
                    continue
                
                # Check if it's already a file ID (ObjectId format)
                if ObjectId.is_valid(file_path) and len(file_path) == 24:
                    print(f"  - {doc_type}: Already migrated (file ID: {file_path})")
                    new_document_refs[doc_type] = file_path
                    continue
                
                # It's a file path, create a file document
                print(f"  - {doc_type}: Migrating file path: {file_path}")
                
                # Determine category and original filename from path
                if "driving_license" in file_path:
                    category = "driving_licenses"
                elif "aadhar" in file_path:
                    category = "aadhar"
                else:
                    category = "unknown"
                
                original_filename = os.path.basename(file_path)
                
                # Get file size if file exists
                file_size = 0
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                else:
                    print(f"    WARNING: File not found on disk: {file_path}")
                
                # Determine MIME type from extension
                ext = os.path.splitext(file_path)[1].lower()
                mime_type_map = {
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.pdf': 'application/pdf'
                }
                mime_type = mime_type_map.get(ext, 'application/octet-stream')
                
                # Create file document
                file_doc = {
                    "user_id": user_id,
                    "file_type": doc_type,
                    "file_path": file_path,
                    "original_filename": original_filename,
                    "mime_type": mime_type,
                    "file_size": file_size,
                    "uploaded_at": user.get("created_at", datetime.utcnow()),
                    "status": "active"
                }
                
                result = await db.files.insert_one(file_doc)
                file_id = str(result.inserted_id)
                new_document_refs[doc_type] = file_id
                
                print(f"    Created file document with ID: {file_id}")
            
            # Update user document with file IDs
            if new_document_refs:
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"documents": new_document_refs}}
                )
                print(f"  ✓ Updated user document with file references")
                migrated_count += 1
            
        except Exception as e:
            print(f"  ✗ Error migrating user {user.get('mobile_number')}: {str(e)}")
            error_count += 1
            continue
    
    print(f"\n{'='*60}")
    print(f"Migration complete!")
    print(f"Successfully migrated: {migrated_count} users")
    print(f"Errors: {error_count} users")
    print(f"{'='*60}")
    
    # Show statistics
    total_files = await db.files.count_documents({})
    print(f"\nTotal files in files collection: {total_files}")


if __name__ == "__main__":
    print("File Migration Script")
    print("=" * 60)
    
    # Confirm before running
    response = input("This will migrate all existing file paths to the files collection.\nContinue? (yes/no): ")
    
    if response.lower() != "yes":
        print("Migration cancelled.")
        sys.exit(0)
    
    asyncio.run(migrate_files())

