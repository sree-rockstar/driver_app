# Files Collection Migration - Quick Start Guide

## Step-by-Step Migration Instructions

### 1. **Backup Your Database** (IMPORTANT!)
```bash
# Create a backup of your MongoDB database
mongodump --db driver_app --out ./backup_$(date +%Y%m%d)
```

### 2. **Run the Migration Script**
```bash
cd backend
python migrate_files_to_collection.py
```

When prompted, type `yes` to continue.

The script will:
- ✅ Create file documents for all existing user documents
- ✅ Update user documents with file ID references
- ✅ Preserve all existing files on disk
- ✅ Show progress for each user

### 3. **Create Database Indexes**
```bash
python create_files_indexes.py
```

This optimizes query performance for the files collection.

### 4. **Verify Migration**
Check that files were migrated correctly:
```bash
# Connect to MongoDB
mongosh

# Switch to your database
use driver_app

# Check files collection
db.files.countDocuments()  // Should show your migrated files

# Check a sample file document
db.files.findOne()

# Check a user's documents (should now have file IDs)
db.users.findOne({mobile_number: "9886315755"}).documents
```

### 5. **Restart Your Backend Server**
```bash
# Stop the current server if running
# Then start it again
cd backend
source venv/bin/activate  # or venv/Scripts/activate on Windows
python -m app.main
```

### 6. **Test the Frontend**
1. Open the app in your browser
2. Navigate to the Profile page
3. Verify that document images load correctly
4. Click on documents to preview them

## What Changed?

### Database Structure

**Before:**
```json
{
  "_id": "user_id",
  "documents": {
    "driving_license_front": "uploads/driving_licenses/file.png",
    "aadhar_front": "uploads/aadhar/file.png"
  }
}
```

**After:**
```json
// User document
{
  "_id": "user_id",
  "documents": {
    "driving_license_front": "file_id_123",  // Reference to files collection
    "aadhar_front": "file_id_456"
  }
}

// Files collection (new!)
{
  "_id": "file_id_123",
  "user_id": "user_id",
  "file_type": "driving_license_front",
  "file_path": "uploads/driving_licenses/file.png",
  "original_filename": "file.png",
  "mime_type": "image/png",
  "file_size": 1024000,
  "uploaded_at": "2025-12-22T...",
  "status": "active"
}
```

### API Endpoints

**New Endpoints:**
- `GET /api/v1/documents/file/{file_id}` - Get file (returns actual image)
- `GET /api/v1/documents/file/{file_id}/info` - Get file metadata
- `GET /api/v1/documents/my-documents` - Get all user documents

**Modified Endpoints:**
- `GET /api/v1/users/me` - Now returns file URLs instead of paths
  ```json
  {
    "documents": {
      "driving_license_front": "/api/v1/documents/file/507f1f77bcf86cd799439011"
    }
  }
  ```

### Frontend Changes

The frontend now uses API URLs for images:
```tsx
// Before
<img src={`${API_BASE_URL}/${user.documents.driving_license_front}`} />

// After (no change needed! The API URL is already complete)
<img src={`${API_BASE_URL}${user.documents.driving_license_front}`} />
```

## Troubleshooting

### Issue: Migration fails
**Solution:**
- Check database connection
- Verify MongoDB is running
- Check error messages in the migration script output

### Issue: Files don't load in frontend
**Solution:**
1. Check browser console for errors
2. Verify API endpoint is correct
3. Check that files collection has documents: `db.files.countDocuments()`
4. Verify user's documents field has file IDs

### Issue: "File not found" errors
**Solution:**
1. Check that files exist on disk
2. Verify file paths in files collection are correct
3. Check file permissions

## Rollback (If Needed)

If something goes wrong, you can restore from backup:
```bash
# Restore from backup
mongorestore --db driver_app --drop ./backup_YYYYMMDD/driver_app
```

## Post-Migration Checklist

- [ ] Migration script completed without errors
- [ ] Files collection has documents
- [ ] Database indexes created
- [ ] Backend server restarted
- [ ] Can view user profile
- [ ] Document images load correctly
- [ ] Document preview modal works
- [ ] New user registration works
- [ ] File upload works for new users

## Support

If you encounter issues:
1. Check the logs: `backend/logs/` or console output
2. Verify MongoDB connection and collections
3. Check that all files exist on disk
4. Review the FILE_STORAGE_MIGRATION.md for detailed information

## Benefits of This Migration

✅ **Better Organization** - Files and user data are separated
✅ **Improved Security** - File-level access control
✅ **Scalability** - Easy to add features like versioning, cloud storage
✅ **Maintenance** - Easier to track and manage files
✅ **Performance** - Optimized queries with indexes

