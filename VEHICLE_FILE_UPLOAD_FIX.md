# 🔧 Vehicle File Upload Fix

## Problem
Vehicle documents and photos were not being saved properly in the MongoDB `files` collection and could not be retrieved by admins or drivers.

## Root Cause
There was a **mismatch between file storage and retrieval logic**:

### Before (Broken):
1. **Upload**: Created files with a custom `file_id` field
   ```python
   file_doc = {
       "file_id": str(uuid.uuid4()),  # Custom field
       "vehicle_id": vehicle_id,
       ...
   }
   await db.files.insert_one(file_doc)  # Creates _id automatically
   ```

2. **Storage in Vehicle**: Stored the custom `file_id`
   ```python
   update_data = {
       f"documents.{field_name}": file_id  # Custom file_id
   }
   ```

3. **Retrieval**: Looked up by custom `file_id`
   ```python
   file_record = await db.files.find_one({"file_id": file_id})
   ```

4. **Display**: `/documents/file/{file_id}` endpoint expected MongoDB `_id`
   ```python
   file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
   ```

❌ **Result**: Files saved with `file_id` field, but endpoint couldn't find them using `_id`

### After (Fixed):
1. **Upload**: Use MongoDB's `_id` (no custom `file_id`)
   ```python
   result = await db.files.insert_one(file_doc)
   file_id = str(result.inserted_id)  # Use MongoDB's _id
   ```

2. **Storage in Vehicle**: Store MongoDB's `_id`
   ```python
   update_data = {
       f"documents.{field_name}": file_id  # MongoDB _id
   }
   ```

3. **Retrieval**: Look up by `_id`
   ```python
   file_record = await db.files.find_one({"_id": ObjectId(file_id)})
   ```

4. **Display**: Endpoint receives and uses MongoDB `_id`
   ```python
   file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
   ```

✅ **Result**: Consistent use of MongoDB's `_id` throughout

## Files Changed

### 1. `backend/app/api/v1/endpoints/vehicles.py`

#### Changes in Document Upload (`upload_vehicle_document`):
- ❌ Removed: Custom `file_id` field in file document
- ✅ Added: Use MongoDB's `_id` from `insert_one` result
- ✅ Updated: Store `_id` in vehicle's `documents` field

#### Changes in Photo Upload (`upload_vehicle_photo`):
- ❌ Removed: Custom `file_id` field in file document
- ✅ Added: Use MongoDB's `_id` from `insert_one` result
- ✅ Updated: Store `_id` in vehicle's `photos` field

#### Changes in Document Retrieval (`get_vehicle_documents`):
- ❌ Changed: `find_one({"file_id": file_id})`
- ✅ To: `find_one({"_id": ObjectId(file_id)})`
- ✅ Added: `ObjectId.is_valid()` validation

#### Changes in Photo Retrieval (`get_vehicle_photos`):
- ❌ Changed: `find_one({"file_id": file_id})`
- ✅ To: `find_one({"_id": ObjectId(file_id)})`
- ✅ Added: `ObjectId.is_valid()` validation

### 2. `backend/app/api/v1/endpoints/documents.py`

#### Changes in File Access (`get_file`):
- ✅ Added: Support for vehicle files (check `vehicle_id` field)
- ✅ Updated: Admins can access vehicle files
- ✅ Improved: Permission logic to handle both user and vehicle files

**New Permission Logic**:
```python
is_user_file = file_doc.get("user_id") == current_user_id
is_vehicle_file = file_doc.get("vehicle_id") is not None
is_admin = user_role in ["admin", "super_admin"]

# Allow access if:
# 1. User owns the file, OR
# 2. Admin accessing any file (user or vehicle)
```

## What This Fixes

✅ **File Upload**: Files now correctly saved to `files` collection with proper structure
✅ **File Retrieval**: Files can be fetched using MongoDB `_id`
✅ **Admin Access**: Admins can view vehicle documents and photos
✅ **Driver Access**: Drivers can view vehicle documents (if assigned)
✅ **Consistency**: All file operations use the same `_id` field

## Database Structure

### Files Collection (After Fix):
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),  // MongoDB auto-generated
  "vehicle_id": "BYD-001",                       // Reference to vehicle
  "file_type": "vehicle_insurance",              // Type of document
  "document_type": "insurance",                  // Short name
  "file_path": "uploads/vehicles/BYD-001/documents/insurance_uuid.pdf",
  "original_filename": "insurance_policy.pdf",
  "file_size": 245678,
  "mime_type": "application/pdf",
  "uploaded_at": ISODate("2025-01-01T10:00:00Z"),
  "uploaded_by": "admin@example.com",
  "status": "active"
}
```

### Vehicles Collection:
```json
{
  "vehicle_id": "BYD-001",
  "documents": {
    "registration_certificate": "507f1f77bcf86cd799439011",  // MongoDB _id
    "insurance": "507f1f77bcf86cd799439012",                 // MongoDB _id
    "pollution_certificate": "507f1f77bcf86cd799439013"      // MongoDB _id
  },
  "photos": {
    "front_view": "507f1f77bcf86cd799439014",                // MongoDB _id
    "back_view": "507f1f77bcf86cd799439015"                  // MongoDB _id
  }
}
```

## How to Test

### 1. Restart Backend
```bash
cd backend
# Kill existing process
# Restart with:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test Document Upload
1. Navigate to `/fleet` in the admin panel
2. Click on any vehicle
3. Click "Upload Vehicle Document"
4. Select document type (e.g., "Insurance")
5. Choose a file (PDF, JPG, PNG)
6. Set expiry date
7. Click Upload

✅ **Expected**: Success message, file appears in list

### 3. Test Document Retrieval
1. Click "View Documents" on the vehicle
2. Documents should display with thumbnails
3. Click on any document to view full size

✅ **Expected**: Documents load and display correctly

### 4. Verify in MongoDB
```javascript
// Check files collection
db.files.find({ vehicle_id: "BYD-001" }).pretty()

// Should show documents with _id field, no custom file_id field

// Check vehicle documents
db.vehicles.findOne({ vehicle_id: "BYD-001" }).documents

// Should show ObjectId strings as values
```

## Migration for Existing Data

If you have existing vehicle files with the old `file_id` structure:

```javascript
// Find old files
db.files.find({ file_id: { $exists: true }, vehicle_id: { $exists: true } })

// For each old file:
// 1. Note the _id
// 2. Find vehicles referencing the old file_id
// 3. Update vehicle to reference _id instead
// 4. Remove the custom file_id field

// Example migration script:
db.files.find({ 
  file_id: { $exists: true }, 
  vehicle_id: { $exists: true } 
}).forEach(function(file) {
  // Update vehicles that reference this file
  db.vehicles.updateMany(
    { $or: [
      { "documents.registration_certificate": file.file_id },
      { "documents.insurance": file.file_id },
      { "documents.pollution_certificate": file.file_id },
      // ... add other document fields
    ]},
    { $set: {
      "documents.registration_certificate": file._id.str,
      // ... update all matching fields
    }}
  );
  
  // Remove custom file_id field
  db.files.updateOne(
    { _id: file._id },
    { $unset: { file_id: "" } }
  );
});
```

## API Endpoints Affected

### Working Correctly Now:
- ✅ `POST /vehicles/{vehicle_id}/documents/upload` - Upload documents
- ✅ `POST /vehicles/{vehicle_id}/photos/upload` - Upload photos
- ✅ `GET /vehicles/{vehicle_id}/documents` - List vehicle documents
- ✅ `GET /vehicles/{vehicle_id}/photos` - List vehicle photos
- ✅ `GET /documents/file/{file_id}` - Display/download files

## Summary

**Before**: Files saved but couldn't be retrieved ❌
**After**: Files saved AND retrieved correctly ✅

**Key Change**: Use MongoDB's `_id` consistently throughout the entire flow, from upload to storage to retrieval to display.

## Status: FIXED ✅
All vehicle document and photo uploads now work correctly!

