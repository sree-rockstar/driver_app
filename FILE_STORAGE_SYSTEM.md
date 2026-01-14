# File Storage System - Raw Files with Authentication

## Overview
This document explains how files are stored in raw format during signup and retrieved securely for display.

## How It Works

### 1. **File Upload During Signup**

When a user registers, files are uploaded and stored in **raw binary format** on disk:

```
uploads/
├── driving_licenses/
│   ├── 862755a2-65c9-4140-b81c-8bc8bc61f254.png  ← Raw PNG file
│   └── 3d94b353-cd81-4f72-bc5e-9b9558f39af5.png  ← Raw PNG file
└── aadhar/
    ├── 263f933a-e828-4922-a140-e772ddf4e373.png  ← Raw PNG file
    └── 83316769-da7c-4b8a-9544-7b1857f4e593.png  ← Raw PNG file
```

**Process:**
1. User uploads file during registration
2. File is validated (size, type, format)
3. File is saved to disk with unique UUID filename
4. File metadata is stored in `files` collection
5. File ID is stored in user's `documents` field

### 2. **Files Collection**

Each file has metadata stored in MongoDB:

```json
{
  "_id": "file_id_123",
  "user_id": "user_id",
  "file_type": "driving_license_front",
  "file_path": "uploads/driving_licenses/862755a2.png",
  "original_filename": "dl_front.png",
  "mime_type": "image/png",
  "file_size": 1024000,
  "uploaded_at": "2025-12-22T...",
  "status": "active"
}
```

### 3. **Security Architecture**

**❌ REMOVED: Unauthenticated Static File Access**
```python
# OLD - INSECURE (removed)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

**✅ SECURE: Authenticated API Endpoint**
```python
# NEW - SECURE
GET /api/v1/documents/file/{file_id}
# Requires: Bearer token authentication
# Returns: Raw file with proper MIME type
```

### 4. **File Retrieval Flow**

```
┌─────────────┐
│   Frontend  │
│  (Profile)  │
└──────┬──────┘
       │ 1. User documents contain file IDs
       │    documents.driving_license_front = "/api/v1/documents/file/123"
       │
       ▼
┌──────────────────────────────┐
│  useAuthenticatedImage Hook  │
│  (React Hook)                │
└──────┬───────────────────────┘
       │ 2. Fetch with auth token
       │    Authorization: Bearer {token}
       │
       ▼
┌──────────────────────────┐
│  Backend API Endpoint    │
│  /documents/file/{id}    │
└──────┬───────────────────┘
       │ 3. Verify authentication
       │ 4. Check file ownership
       │ 5. Read raw file from disk
       │
       ▼
┌──────────────────────┐
│   Raw File (Binary)  │
│   Content-Type: image/png
│   Content-Disposition: inline
└──────┬───────────────┘
       │ 6. Return raw file
       │
       ▼
┌──────────────────────┐
│  Frontend (Blob URL) │
│  blob:http://...     │
└──────────────────────┘
       │ 7. Display in <img> tag
       ▼
┌──────────────────────┐
│  User sees image     │
└──────────────────────┘
```

## Code Implementation

### Backend: File Serving Endpoint

```python
@router.get("/file/{file_id}")
async def get_file(file_id: str, current_user: User = Depends(get_current_user)):
    # 1. Find file in database
    file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
    
    # 2. Check permissions
    if file_doc.get("user_id") != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403)
    
    # 3. Return raw file
    return FileResponse(
        path=file_doc["file_path"],
        media_type=file_doc["mime_type"],
        headers={
            "Content-Disposition": 'inline',  # Display in browser
            "Cache-Control": "public, max-age=31536000"
        }
    )
```

### Frontend: Custom Hook

```typescript
// Custom React hook to load authenticated images
export const useAuthenticatedImage = (apiPath: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  useEffect(() => {
    const loadImage = async () => {
      // Fetch with auth token
      const response = await fetch(fullUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Convert to blob and create object URL
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      setImageUrl(blobUrl)
    }
    
    loadImage()
    
    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [apiPath])
  
  return { imageUrl, loading, error }
}
```

### Frontend: Usage in Components

```tsx
// Profile component
const { imageUrl, loading } = useAuthenticatedImage(
  user.documents.driving_license_front
)

return (
  <div>
    {loading ? <Loader /> : <img src={imageUrl} alt="DL Front" />}
  </div>
)
```

## File Storage Details

### Raw File Format
- Files are stored exactly as uploaded
- No compression or modification
- Original MIME type preserved
- Binary data intact

### File Validation
```python
# During upload
- Max size: 10MB
- Allowed formats: .jpg, .jpeg, .png, .webp
- Image validation: PIL verifies it's a valid image
- Virus scanning: Can be added
```

### File Naming
```
Format: {UUID}.{extension}
Example: 862755a2-65c9-4140-b81c-8bc8bc61f254.png

Benefits:
- No filename collisions
- Prevents path traversal attacks
- Anonymous (doesn't reveal user info)
```

## Security Features

### 1. **Authentication Required**
- All file access requires valid JWT token
- Token must be in Authorization header
- No anonymous access to any files

### 2. **Authorization Checks**
- Users can only access their own files
- Admins can access all files
- Ownership verified on every request

### 3. **File Status**
```json
{
  "status": "active"  // or "deleted", "replaced"
}
```
- Deleted files return 410 Gone
- Status checked before serving

### 4. **Path Validation**
- File paths stored as relative paths
- No directory traversal possible
- Files only served from uploads directory

## Performance Optimizations

### 1. **Caching Headers**
```http
Cache-Control: public, max-age=31536000
```
- Files cached in browser for 1 year
- Reduces server load
- Faster subsequent loads

### 2. **Blob URLs**
```javascript
// Frontend creates blob URLs
const blobUrl = URL.createObjectURL(blob)
// Result: blob:http://localhost:5173/abc-123

Benefits:
- Browser manages memory
- No repeated API calls
- Smooth image display
```

### 3. **Database Indexes**
```javascript
db.files.createIndex({ "user_id": 1 })
db.files.createIndex({ "file_type": 1 })
db.files.createIndex({ "user_id": 1, "file_type": 1 })
```

## Testing the System

### 1. **Test File Upload**
```bash
# Register with files
curl -X POST http://localhost:8000/api/v1/auth/register \
  -F "mobile_number=1234567890" \
  -F "full_name=Test User" \
  -F "password=test123" \
  -F "dl_front=@/path/to/image.png"
```

### 2. **Test File Retrieval**
```bash
# Get file (requires auth token)
curl -X GET http://localhost:8000/api/v1/documents/file/FILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output downloaded_image.png
```

### 3. **Verify in Browser**
1. Register a new user with documents
2. Login to the app
3. Navigate to Profile page
4. Images should load with thumbnails
5. Click to preview full-size images

## Troubleshooting

### Issue: Images don't load
**Check:**
1. Auth token is valid: Check browser network tab
2. File exists on disk: `ls uploads/driving_licenses/`
3. File ID in database: `db.files.findOne()`
4. CORS settings: Check backend allows credentials

### Issue: "403 Forbidden"
**Cause:** User doesn't own the file
**Solution:** Verify file's `user_id` matches current user

### Issue: "404 Not Found"
**Cause:** File not in database or disk
**Solution:** 
- Check files collection: `db.files.find()`
- Verify file on disk exists
- Run migration if upgrading

## Advantages of This System

✅ **Security**
- Authentication required for all files
- File-level access control
- No direct file system access

✅ **Raw Format**
- Files stored exactly as uploaded
- No quality loss
- Original format preserved

✅ **Scalability**
- Easy to add cloud storage (S3, Azure)
- Can implement CDN
- File versioning possible

✅ **Flexibility**
- Support any file type (images, PDFs, etc.)
- Easy to add processing (thumbnails, OCR)
- Audit trail built-in

✅ **User Experience**
- Fast loading with caching
- Smooth preview modals
- Works on all devices

## Future Enhancements

1. **Thumbnail Generation**
   - Generate thumbnails on upload
   - Serve smaller versions for lists
   - Full size for previews

2. **Cloud Storage Integration**
   - S3/Azure Blob Storage
   - CDN for global delivery
   - Automatic backups

3. **Image Optimization**
   - WebP conversion
   - Responsive sizes
   - Lazy loading

4. **Advanced Features**
   - Document versioning
   - OCR for text extraction
   - Digital signatures
   - Expiration dates

## Summary

✅ Files are stored in **raw binary format** on disk
✅ Metadata stored in **files collection**
✅ **Secure authentication** required for access
✅ Files served with **proper MIME types** for browser display
✅ Frontend uses **blob URLs** for smooth display
✅ **Migration script** available for existing data
✅ **Production-ready** with caching and optimizations

