# Mobile Number Based Registration System

## Overview

The application now uses **mobile number-based authentication** instead of email. Users (drivers) register with their mobile number and upload required documents during registration.

## Registration Requirements

### Required Fields
1. ✅ **Full Name** - User's complete name
2. ✅ **Mobile Number** - 10-digit mobile number (primary identifier)
3. ✅ **Password** - Minimum 6 characters
4. ✅ **Driving License Number** - DL number
5. ✅ **Aadhar Number** - 12-digit Aadhar number

### Required Document Uploads
1. ✅ **Driving License - Front** (Image)
2. ✅ **Driving License - Back** (Image)
3. ✅ **Aadhar Card - Front** (Image)
4. ✅ **Aadhar Card - Back** (Image)

### Optional Fields
- Email Address

## File Upload Specifications

- **Maximum File Size**: 10MB per file
- **Accepted Formats**: JPG, JPEG, PNG, WebP
- **Validation**: Server-side image validation
- **Storage**: Files stored in `/uploads` directory
  - Driving Licenses: `/uploads/driving_licenses/`
  - Aadhar Cards: `/uploads/aadhar/`

## API Endpoints

### 1. Register New Driver/User
```bash
POST /api/v1/auth/register
Content-Type: multipart/form-data

Required Fields:
- mobile_number (string)
- full_name (string)
- password (string)
- driving_license_number (string)
- aadhar_number (string)
- dl_front (file)
- dl_back (file)
- aadhar_front (file)
- aadhar_back (file)

Optional Fields:
- email (string)
```

**Example using curl:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -F "mobile_number=9876543210" \
  -F "full_name=John Doe" \
  -F "password=secure123" \
  -F "driving_license_number=DL1234567890" \
  -F "aadhar_number=123456789012" \
  -F "email=john@example.com" \
  -F "dl_front=@/path/to/dl_front.jpg" \
  -F "dl_back=@/path/to/dl_back.jpg" \
  -F "aadhar_front=@/path/to/aadhar_front.jpg" \
  -F "aadhar_back=@/path/to/aadhar_back.jpg"
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "mobile_number": "9876543210",
  "full_name": "John Doe",
  "email": "john@example.com",
  "driving_license_number": "DL1234567890",
  "aadhar_number": "123456789012",
  "role": "driver",
  "is_active": true,
  "is_verified": false,
  "documents": {
    "driving_license_front": "uploads/driving_licenses/uuid.jpg",
    "driving_license_back": "uploads/driving_licenses/uuid.jpg",
    "aadhar_front": "uploads/aadhar/uuid.jpg",
    "aadhar_back": "uploads/aadhar/uuid.jpg"
  },
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### 2. Login with Mobile Number
```bash
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

Fields:
- username (mobile_number)
- password
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -d "username=9876543210&password=secure123"
```

### 3. Upload/Update Documents (After Registration)
```bash
POST /api/v1/documents/upload-documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

Optional Fields (upload only what you want to update):
- dl_front (file)
- dl_back (file)
- aadhar_front (file)
- aadhar_back (file)
```

### 4. Get My Documents
```bash
GET /api/v1/documents/my-documents
Authorization: Bearer {token}
```

### 5. Update Document Numbers
```bash
PUT /api/v1/documents/update-details
Authorization: Bearer {token}
Content-Type: multipart/form-data

Fields:
- driving_license_number (optional)
- aadhar_number (optional)
```

## User Registration Flow

### Frontend Flow

1. **Navigate to Register Page** (`/register`)
2. **Fill Basic Information**
   - Full Name
   - Mobile Number (10 digits)
   - Email (optional)
   - Password & Confirm Password

3. **Enter Document Details**
   - Driving License Number
   - Aadhar Number (12 digits)

4. **Upload Documents**
   - Click on upload boxes to select/capture images
   - Preview appears after selection
   - All 4 documents required

5. **Submit Registration**
   - Validation occurs
   - Files uploaded to server
   - User account created with `is_verified: false`

6. **Redirect to Login**
   - Success message shown
   - User can now login with mobile number

### Backend Flow

1. **Receive Registration Data**
2. **Validate Mobile Number** (10 digits, numeric)
3. **Check if Mobile Already Registered**
4. **Validate & Save Images**
   - Check file size (max 10MB)
   - Verify image format
   - Generate unique filename
   - Save to appropriate folder
5. **Hash Password** (bcrypt)
6. **Create User Document** in MongoDB
7. **Return User Data** (without password)

## User Verification System

### Verification States

- **`is_verified: false`** (Default after registration)
  - User can login
  - Limited access
  - Pending admin review

- **`is_verified: true`** (After admin approval)
  - Full access granted
  - Can use all features

### Admin Verification Process

1. Admin logs into admin panel
2. Views user list at `/admin/users`
3. Reviews user details and uploaded documents
4. Can activate/deactivate users
5. Future: Add document verification endpoint

## Security Features

### Authentication
- JWT token-based authentication
- Token contains mobile_number and role
- Token expires after 30 minutes (configurable)

### File Upload Security
- File type validation (images only)
- File size limit (10MB)
- Unique filename generation (UUID)
- Server-side image verification using Pillow

### Data Protection
- Passwords hashed with bcrypt
- Aadhar number masked in frontend (last 4 digits only)
- Documents stored outside web root
- Static file serving configured in FastAPI

### Input Validation
- Mobile number: 10 digits, numeric
- Aadhar number: 12 digits, numeric
- Password: minimum 6 characters
- Driving License: alphanumeric

## Database Schema

### User Collection

```javascript
{
  "_id": ObjectId,
  "mobile_number": "9876543210",  // Unique index
  "full_name": "John Doe",
  "email": "john@example.com",  // Optional
  "driving_license_number": "DL1234567890",
  "aadhar_number": "123456789012",
  "hashed_password": "bcrypt_hash",
  "role": "driver",  // enum: admin, user, driver
  "is_active": true,
  "is_verified": false,
  "documents": {
    "driving_license_front": "uploads/driving_licenses/uuid.jpg",
    "driving_license_back": "uploads/driving_licenses/uuid.jpg",
    "aadhar_front": "uploads/aadhar/uuid.jpg",
    "aadhar_back": "uploads/aadhar/uuid.jpg"
  },
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Recommended Indexes

```javascript
db.users.createIndex({ "mobile_number": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { sparse: true })
db.users.createIndex({ "is_verified": 1 })
db.users.createIndex({ "created_at": -1 })
```

## Frontend Components

### Updated Components

1. **Register Page** (`/register`)
   - Mobile number input
   - Document upload with preview
   - Form validation
   - Multi-step form layout

2. **Login Page** (`/login`)
   - Mobile number instead of email
   - Simple 2-field form

3. **User Dashboard** (`/dashboard`)
   - Shows mobile number
   - Document upload status
   - Verification status badge
   - Masked Aadhar number

4. **Admin Users Page** (`/admin/users`)
   - Mobile number in user list
   - Verification badge
   - Document count indicator

## Testing the Registration

### Manual Testing

1. **Start the application**
   ```bash
   ./start.sh
   ```

2. **Open browser**
   - Go to http://localhost:5173/register

3. **Fill the form**
   - Name: Test Driver
   - Mobile: 9876543210
   - DL Number: DL123456789
   - Aadhar: 123456789012
   - Upload 4 images (can use any image files for testing)

4. **Submit and Login**
   - Should redirect to login
   - Login with: 9876543210 / your_password

5. **View Dashboard**
   - Should show all details
   - Document upload status
   - Verification pending message

### API Testing (Postman/Insomnia)

1. **Import the Swagger docs**
   - http://localhost:8000/docs

2. **Test Registration**
   - Use multipart/form-data
   - Add all required fields
   - Attach image files

3. **Test Login**
   - Use form-data
   - username = mobile_number
   - Get JWT token

4. **Test Protected Routes**
   - Add token to Authorization header
   - Test document endpoints

## Migration from Email to Mobile

If you have existing users with email-based accounts:

1. **Add mobile_number field** to existing users
2. **Make email optional** in database
3. **Update authentication** to check mobile_number
4. **Notify users** to add mobile number to their profile

## Troubleshooting

### File Upload Issues

**Error: "File size exceeds 10MB"**
- Compress images before upload
- Use lower quality for test images

**Error: "Invalid file type"**
- Ensure files are JPG, PNG, or WebP
- Check file extension

**Error: "Invalid image file"**
- File might be corrupted
- Try different image

### Registration Issues

**Error: "Mobile number already registered"**
- Use different mobile number
- Or login with existing number

**Error: "Invalid mobile number format"**
- Must be exactly 10 digits
- Only numeric characters

**Error: "Please upload only image files"**
- Upload JPG, PNG, or WebP files
- Not PDF or other document formats

### Login Issues

**Error: "Incorrect mobile number or password"**
- Check mobile number (10 digits)
- Check password
- No spaces in fields

## Production Considerations

### Before Deployment

1. ✅ **Add Mobile Number Verification**
   - SMS OTP verification
   - Prevent fake registrations

2. ✅ **Document OCR/Verification**
   - Auto-extract DL/Aadhar numbers
   - Verify document authenticity

3. ✅ **Image Compression**
   - Compress uploaded images
   - Reduce storage costs

4. ✅ **CDN for Images**
   - Serve uploaded files via CDN
   - Faster access worldwide

5. ✅ **Rate Limiting**
   - Limit registration attempts
   - Prevent spam

6. ✅ **Admin Document Review UI**
   - View uploaded documents
   - Approve/Reject with reason

## Future Enhancements

- [ ] SMS/WhatsApp OTP verification
- [ ] Document AI verification
- [ ] Image cropping tool
- [ ] Bulk user approval
- [ ] Document expiry tracking
- [ ] Re-upload expired documents
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app (React Native)

---

## Quick Reference

**Login with Mobile**: Username field = Mobile Number
**New Dependencies**: Pillow, aiofiles (already in requirements.txt)
**Upload Directory**: `/uploads` (auto-created)
**Default Role**: All new registrations get `role: "driver"`
**Verification**: Manual by admin (future: automatic)

---

**Updated**: December 2024

