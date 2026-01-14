# File Storage Migration - Files Collection

## Overview
This document describes the migration from storing file paths directly in user documents to using a separate `files` collection for better file management.

## Changes Made

### 1. **New Files Collection**
Created a new MongoDB collection called `files` to store file metadata separately from user documents.

**File Document Structure:**
```json
{
  "_id": "ObjectId",
  "user_id": "string",              // Reference to user
  "file_type": "string",            // driving_license_front, driving_license_back, aadhar_front, aadhar_back
  "file_path": "string",            // Path to file on disk
  "original_filename": "string",    // Original filename from upload
  "mime_type": "string",            // File MIME type (image/png, image/jpeg, etc.)
  "file_size": 0,                   // File size in bytes
  "uploaded_at": "datetime",        // Upload timestamp
  "status": "active"                // active, deleted, replaced
}
```

### 2. **Updated User Model**
Modified the `DocumentImages` class in `user.py` to store file IDs instead of file paths:

**Before:**
```python
class DocumentImages(BaseModel):
    driving_license_front: Optional[str] = None  # File path
    driving_license_back: Optional[str] = None   # File path
    aadhar_front: Optional[str] = None           # File path
    aadhar_back: Optional[str] = None            # File path
```

**After:**
```python
class DocumentImages(BaseModel):
    """References to file IDs in the files collection"""
    driving_license_front: Optional[str] = None  # File ID reference
    driving_license_back: Optional[str] = None   # File ID reference
    aadhar_front: Optional[str] = None           # File ID reference
    aadhar_back: Optional[str] = None            # File ID reference
```

### 3. **New File Model**
Created `backend/app/models/file.py` with the `FileDocument` model for the files collection.

### 4. **Updated Registration Endpoint**
Modified `auth.py` registration endpoint to:
- Create user first
- Upload files and create file documents with user_id reference
- Store file IDs in user's documents field

### 5. **New Documents Endpoints**
Created `backend/app/api/v1/endpoints/documents.py` with:
- `GET /api/v1/documents/file/{file_id}` - Retrieve actual file
- `GET /api/v1/documents/file/{file_id}/info` - Get file metadata
- `GET /api/v1/documents/my-documents` - Get all user's documents

### 6. **Updated Users Endpoint**
Modified `users.py` to populate document URLs when fetching current user:
- Converts file IDs to API endpoint URLs
- Frontend can directly use these URLs to display images

## Benefits

1. **Better File Management**
   - Centralized file metadata storage
   - Easy to track file uploads, sizes, and types
   - Can implement file versioning and history

2. **Improved Security**
   - File access control at the file level
   - Easy to implement file permissions
   - Track who accesses what files

3. **Scalability**
   - Easier to implement features like file deletion, replacement
   - Can add file processing status (pending, processed, failed)
   - Support for multiple versions of the same document

4. **Better Organization**
   - Separate concerns (user data vs file data)
   - Easier to maintain and query
   - Can implement file cleanup and maintenance tasks

## Migration Process

### For Existing Data
Run the migration script to convert existing user documents:

```bash
cd backend
python migrate_files_to_collection.py
```

The script will:
1. Find all users with documents
2. Create file documents in the files collection for each file path
3. Update user documents to reference file IDs instead of paths
4. Preserve all existing files on disk (no file moves required)

### For New Registrations
New user registrations automatically use the new system:
1. User document is created first
2. Files are uploaded and file documents created
3. User document is updated with file ID references

## API Changes

### Document URLs
Users now receive API endpoint URLs for their documents:

**Before:**
```json
{
  "documents": {
    "driving_license_front": "uploads/driving_licenses/abc123.png"
  }
}
```

**After:**
```json
{
  "documents": {
    "driving_license_front": "/api/v1/documents/file/507f1f77bcf86cd799439011"
  }
}
```

### Frontend Integration
The frontend can use these URLs directly in `<img>` tags:
```jsx
<img src={`${API_BASE_URL}${user.documents.driving_license_front}`} />
```

## Security Considerations

1. **File Access Control**
   - Users can only access their own files
   - Admins can access all files
   - Authentication required for all file endpoints

2. **File Validation**
   - MIME type checking
   - File size limits
   - File path validation

3. **Status Tracking**
   - Files can be marked as deleted without removing from disk
   - Replaced files maintain history
   - Audit trail for file access

## Database Indexes

Recommended indexes for the files collection:
```javascript
db.files.createIndex({ "user_id": 1 })
db.files.createIndex({ "file_type": 1 })
db.files.createIndex({ "status": 1 })
db.files.createIndex({ "user_id": 1, "file_type": 1 })
```

## Future Enhancements

1. **File Versioning**
   - Keep multiple versions of documents
   - Track document updates

2. **File Processing**
   - Image optimization
   - Thumbnail generation
   - OCR for text extraction

3. **Storage Options**
   - Support for cloud storage (S3, Azure, etc.)
   - CDN integration for faster delivery

4. **File Expiration**
   - Temporary file storage
   - Automatic cleanup of old/unused files

## Testing

After migration, verify:
1. Existing users can view their documents
2. New registrations work correctly
3. File access permissions are enforced
4. Document preview works in frontend

## Rollback

If issues occur, you can rollback by:
1. Keeping the old file paths as backups
2. The migration script preserves original file paths in the files collection
3. Can regenerate user documents from files collection if needed

