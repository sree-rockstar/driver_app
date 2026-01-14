# Changelog

All notable changes to the Driver App project.

## [2.0.0] - December 2024

### 🚀 Major Changes

#### Authentication System Overhaul
- **BREAKING**: Changed from email-based to mobile number-based authentication
- Login now requires mobile number (10 digits) instead of email
- Mobile number is now the primary unique identifier

#### Document Upload System
- Added file upload support for user documents
- Required documents during registration:
  - Driving License (Front & Back)
  - Aadhar Card (Front & Back)
- Max file size: 10MB per image
- Supported formats: JPG, JPEG, PNG, WebP
- Server-side image validation using Pillow

#### User Model Updates
- Added `mobile_number` field (required, unique)
- Added `driving_license_number` field
- Added `aadhar_number` field
- Added `is_verified` field (for admin approval)
- Added `documents` object with image paths
- Made `email` optional
- Default role changed to `driver`

### ✨ New Features

#### Backend
- New file upload handling module (`app/core/file_upload.py`)
- New documents API endpoint (`/api/v1/documents/`)
  - Upload/update documents
  - Get user documents
  - Update document numbers
- Static file serving for uploaded documents
- Multipart form-data support for registration
- Image validation and processing
- Unique filename generation (UUID-based)
- Auto-create uploads directory structure

#### Frontend
- Complete redesign of registration page
  - Multi-section form (Basic Info, Documents, Uploads)
  - File upload with preview
  - Image capture support
  - Real-time validation
  - Progress indicators
- Updated login page for mobile number
- Enhanced user dashboard
  - Document upload status
  - Verification status badge
  - Masked Aadhar number display
  - Document information section
- Updated admin user list
  - Mobile number display
  - Verification status indicator
  - Better sorting (newest first)

#### Database
- New collections structure for documents
- File paths stored as references
- Indexed mobile_number field

### 🔧 Technical Updates

#### Dependencies Added
- `pillow==10.1.0` - Image processing and validation
- `aiofiles==23.2.1` - Async file operations

#### API Changes
- `/api/v1/auth/register` now accepts `multipart/form-data`
- `/api/v1/auth/login` uses `mobile_number` in username field
- New endpoint: `/api/v1/documents/upload-documents`
- New endpoint: `/api/v1/documents/my-documents`
- New endpoint: `/api/v1/documents/update-details`

#### Configuration Updates
- MongoDB Atlas connection string updated
- Static file serving configured
- Upload directories auto-created
- CORS updated for file uploads

### 📝 Documentation

#### New Files
- `MOBILE_REGISTRATION.md` - Complete guide for mobile-based registration
- `create_admin.py` - CLI script to create admin users
- `CHANGELOG.md` - This file

#### Updated Files
- `README.md` - Updated for new features
- `API_EXAMPLES.md` - Added file upload examples
- `FEATURES.md` - Added document management features

### 🛠️ Scripts & Tools

- Added `create_admin.py` - Interactive CLI to create admin users
- Updated `start.sh` - Works with MongoDB Atlas
- Updated `docker-compose.yml` - Removed local MongoDB

### 🔒 Security Enhancements

- File type validation (images only)
- File size limits enforced
- Server-side image verification
- Secure filename generation
- Password minimum length increased to 6 characters
- Mobile number format validation
- Aadhar number masking in frontend

### 🐛 Bug Fixes

- Fixed token authentication to use mobile_number
- Fixed user lookup in protected routes
- Fixed CORS for multipart form data
- Fixed file path handling across platforms

### ⚠️ Breaking Changes

1. **Authentication Method Changed**
   - Old: Login with email
   - New: Login with mobile number
   - Migration required for existing users

2. **User Model Changed**
   - `email` is now optional
   - `mobile_number` is now required and unique
   - New fields added: `driving_license_number`, `aadhar_number`, `is_verified`, `documents`

3. **Registration API Changed**
   - Now requires `multipart/form-data`
   - New required fields
   - File uploads required

### 📊 Database Migrations

If you have existing data:

```javascript
// Add mobile_number to existing users
db.users.updateMany(
  { mobile_number: { $exists: false } },
  {
    $set: {
      mobile_number: "0000000000",  // Set temporary value
      is_verified: true,
      driving_license_number: null,
      aadhar_number: null,
      documents: null
    }
  }
)

// Create index
db.users.createIndex({ "mobile_number": 1 }, { unique: true })
```

### 🎯 Next Steps / Roadmap

- [ ] SMS OTP verification for mobile numbers
- [ ] Document OCR for auto-filling DL/Aadhar numbers
- [ ] Admin document review interface
- [ ] Document expiry tracking
- [ ] Image compression before upload
- [ ] CDN integration for images
- [ ] Document re-upload functionality
- [ ] Bulk user approval for admins

### 📦 Installation Notes

After pulling this update:

1. **Update Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Update Node dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Create admin user:**
   ```bash
   python create_admin.py
   ```

4. **Start the application:**
   ```bash
   ./start.sh
   ```

### 🙏 Credits

Built with:
- FastAPI for backend
- React + TypeScript for frontend
- MongoDB Atlas for database
- Pillow for image processing
- TailwindCSS for styling

---

## [1.0.0] - Initial Release

### Features
- Email-based authentication
- User and Admin panels
- Basic user management
- JWT authentication
- Docker support
- PWA capabilities

---

**Legend:**
- 🚀 Major Changes
- ✨ New Features
- 🔧 Technical Updates
- 📝 Documentation
- 🛠️ Scripts & Tools
- 🔒 Security
- 🐛 Bug Fixes
- ⚠️ Breaking Changes
- 📊 Database
- 🎯 Roadmap

