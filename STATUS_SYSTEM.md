# User Status Management System

## Overview

The Driver App now includes a comprehensive status management system with MPIN functionality. Users progress through different statuses as they complete registration and verification steps.

## User Status Flow

```
REGISTRATION
     ↓
1. Registered ───→ User completes registration with documents
     ↓
     [User sets MPIN]
     ↓
2. Pending for Approval ───→ Waiting for admin review
     ↓
     [Admin approves]
     ↓
3. Active ───→ User can use all features
     ↓
     [Admin actions]
     ↓
4. In-Active/Suspended ───→ Temporarily suspended
   OR
5. De-Activated ───→ Permanently deactivated
```

## Status Definitions

### 1. Registered
- **Code**: `registered`
- **Color**: Blue (#3B82F6)
- **Description**: User has completed registration but not set MPIN
- **User Can**:
  - Login to system
  - View dashboard
  - Set MPIN
- **User Cannot**:
  - Access full features
  - Make transactions

### 2. Pending for Approval
- **Code**: `pending_approval`
- **Color**: Orange/Amber (#F59E0B)
- **Description**: User has set MPIN and waiting for admin approval
- **User Can**:
  - Login to system
  - View dashboard
  - Update profile
- **User Cannot**:
  - Access restricted features
  - Make transactions
- **Admin Action Required**: Review and approve/activate user

### 3. Active
- **Code**: `active`
- **Color**: Green (#10B981)
- **Description**: User is approved and can use all features
- **User Can**:
  - Full access to all features
  - Make transactions
  - Book rides/deliveries
  - Manage profile

### 4. In-Active/Suspended
- **Code**: `inactive`
- **Color**: Red (#EF4444)
- **Description**: User account is temporarily suspended
- **User Can**:
  - View suspension message
- **User Cannot**:
  - Login (blocked at login)
  - Access any features
- **Admin Note**: Can be reactivated to Active status

### 5. De-Activated
- **Code**: `deactivated`
- **Color**: Gray (#6B7280)
- **Description**: User account is permanently deactivated
- **User Can**:
  - Nothing (completely blocked)
- **User Cannot**:
  - Login (blocked at login)
- **Admin Note**: Permanent action, user needs to re-register

## MPIN System

### What is MPIN?
- MPIN (Mobile Personal Identification Number)
- 4 or 6 digit PIN
- Used for secure transactions
- Required for account activation

### MPIN Flow

1. **After Registration**: User status = `registered`, `has_mpin = false`
2. **User Sets MPIN**: 
   - Navigate to `/set-mpin`
   - Enter 4 or 6 digit PIN
   - Confirm PIN
   - Status automatically changes to `pending_approval`
   - `has_mpin = true`
3. **Admin Approves**: Changes status to `active`

### MPIN Endpoints

#### Set MPIN (First Time)
```bash
POST /api/v1/mpin/set-mpin
Content-Type: multipart/form-data

Fields:
- mpin (4 or 6 digits)
- confirm_mpin (must match)
```

**Response:**
```json
{
  "message": "MPIN set successfully. Your account is now pending for admin approval.",
  "status": "pending_approval"
}
```

#### Change MPIN
```bash
POST /api/v1/mpin/change-mpin
Content-Type: multipart/form-data

Fields:
- old_mpin
- new_mpin (4 or 6 digits)
- confirm_mpin
```

#### Verify MPIN (for transactions)
```bash
POST /api/v1/mpin/verify-mpin
Content-Type: multipart/form-data

Fields:
- mpin
```

#### Get MPIN Status
```bash
GET /api/v1/mpin/mpin-status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "has_mpin": true,
  "status": "pending_approval"
}
```

## Admin Status Management

### Admin Capabilities

1. **View All Users with Status**
   - Color-coded status badges
   - MPIN status indicator
   - Filter/sort by status

2. **Edit User Details**
   - Full name, mobile, email
   - Driving license number
   - Aadhar number
   - Change status

3. **Change User Status**
   - Dropdown with all available statuses
   - Instant status update
   - User notified (future feature)

4. **View Status Statistics**
   - User distribution by status
   - Visual charts with status colors
   - Real-time counts

### Admin Endpoints

#### List All Users
```bash
GET /api/v1/admin/users
Authorization: Bearer {admin_token}
```

#### Update User Details
```bash
PUT /api/v1/admin/users/{user_id}
Authorization: Bearer {admin_token}

Query Parameters:
- full_name (optional)
- email (optional)
- mobile_number (optional)
- driving_license_number (optional)
- aadhar_number (optional)
```

#### Change User Status
```bash
PUT /api/v1/admin/users/{user_id}/status?status_code=active
Authorization: Bearer {admin_token}
```

#### Get All Statuses
```bash
GET /api/v1/statuses/
Authorization: Bearer {admin_token}

Query Parameters:
- include_inactive (boolean, default: false)
```

#### Get Status Statistics
```bash
GET /api/v1/statuses/stats
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "stats": [
    {
      "status_code": "registered",
      "status_name": "Registered",
      "color": "#3B82F6",
      "count": 45
    },
    {
      "status_code": "pending_approval",
      "status_name": "Pending for Approval",
      "color": "#F59E0B",
      "count": 23
    },
    {
      "status_code": "active",
      "status_name": "Active",
      "color": "#10B981",
      "count": 156
    }
  ]
}
```

## Database Schema

### User Collection Updates

```javascript
{
  "_id": ObjectId,
  "mobile_number": "9876543210",
  "full_name": "John Doe",
  "status": "pending_approval",  // Status code
  "has_mpin": true,               // Boolean flag
  "mpin_hash": "bcrypt_hash",     // Hashed MPIN
  // ... other fields
}
```

### New Collection: user_statuses

```javascript
{
  "_id": ObjectId,
  "name": "Pending for Approval",
  "code": "pending_approval",     // Unique code
  "description": "User has set MPIN and waiting for admin approval",
  "color": "#F59E0B",             // Hex color for UI
  "is_active": true,              // Can be disabled
  "order": 2,                     // Display order
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Indexes

```javascript
// Users collection
db.users.createIndex({ "status": 1 })
db.users.createIndex({ "has_mpin": 1 })

// User statuses collection
db.user_statuses.createIndex({ "code": 1 }, { unique: true })
db.user_statuses.createIndex({ "order": 1 })
```

## Setup Instructions

### 1. Seed Status Data

Run the seeding script to populate initial statuses:

```bash
cd backend
python app/db/seed_statuses.py
```

This will create all 5 default statuses in the database.

### 2. Update Existing Users (if any)

If you have existing users in the database:

```javascript
// MongoDB shell
db.users.updateMany(
  { status: { $exists: false } },
  {
    $set: {
      status: "registered",
      has_mpin: false
    }
  }
)
```

### 3. Create Admin Account

```bash
python create_admin.py
```

Admin users are created with:
- `status: "registered"` (but can access admin panel)
- `has_mpin: false` (not required for admin)
- `is_verified: true`

## Frontend Components

### User Side

#### 1. Set MPIN Page (`/set-mpin`)
- Simple PIN entry form
- Visual feedback
- Confirmation field
- Auto-redirects to dashboard after success

#### 2. Dashboard Status Banners
- **Registered**: Shows "Set MPIN Required" with button
- **Pending Approval**: Shows "Account under review" message
- **Active**: Shows "Account Active" with green badge
- **Inactive/Deactivated**: Blocked at login

### Admin Side

#### 1. User Management Page (`/admin/users`)
- Table view with all users
- Color-coded status badges
- MPIN indicator
- Edit button per user
- Delete button per user

#### 2. Edit User Modal
- Edit personal details
- Change status via dropdown
- Save changes
- Real-time validation

#### 3. Status Management Page (`/admin/statuses`)
- View all statuses
- Status statistics with charts
- User distribution
- Color-coded display

## Login Restrictions

Users with certain statuses are blocked at login:

### Allowed to Login
- `registered` ✅
- `pending_approval` ✅
- `active` ✅

### Blocked at Login
- `inactive` ❌ - Shows: "Account is suspended"
- `deactivated` ❌ - Shows: "Account has been deactivated"

## Typical User Journey

### New Driver Registration

1. **Day 1 - Registration**
   ```
   User: Fills registration form with documents
   System: Creates account with status "registered"
   User: Receives success message
   ```

2. **Day 1 - Set MPIN**
   ```
   User: Logs in, sees "Set MPIN" banner
   User: Navigates to /set-mpin
   User: Sets 4-digit MPIN
   System: Changes status to "pending_approval"
   User: Sees "Pending Approval" message
   ```

3. **Day 2 - Admin Review**
   ```
   Admin: Logs into admin panel
   Admin: Reviews user details and documents
   Admin: Changes status to "active"
   System: User account activated
   ```

4. **Day 2 - Active Usage**
   ```
   User: Logs in
   User: Sees "Account Active" message
   User: Can access all features
   ```

### Suspension Flow

```
Active User → Admin changes status to "inactive"
              ↓
User tries to login → Blocked with message
              ↓
Admin resolves issue → Changes status back to "active"
              ↓
User can login again
```

## Security Features

1. **MPIN Hashing**: All MPINs are hashed using bcrypt
2. **Numeric Only**: MPIN accepts only digits
3. **Length Validation**: Must be 4 or 6 digits
4. **Confirmation Required**: Must enter twice
5. **Status Validation**: System validates status exists before update
6. **Admin Only**: Only admins can change user status

## Future Enhancements

- [ ] Email/SMS notifications on status change
- [ ] Status change history/audit log
- [ ] Reason field for status changes
- [ ] Auto-approve after document verification
- [ ] Scheduled status changes
- [ ] Bulk status updates
- [ ] Custom status creation via UI
- [ ] Status-based feature access control
- [ ] MPIN reset via OTP
- [ ] Biometric MPIN alternative

## Troubleshooting

### User Can't Set MPIN

**Error**: "MPIN already set"
- **Solution**: User already has MPIN, use change-mpin instead

**Error**: "MPIN must be 4 or 6 digits"
- **Solution**: Enter exactly 4 or 6 numeric digits

### Admin Can't Change Status

**Error**: "Invalid status code"
- **Solution**: Run seed script to create statuses

**Error**: "Status configuration error"
- **Solution**: Check if user_statuses collection exists

### Login Blocked

**Message**: "Account is suspended"
- **Action**: Contact admin or wait for status change

**Message**: "Account has been deactivated"
- **Action**: Account permanently closed, contact support

## Testing

### Test User Flow

1. Register new user
2. Login and verify status = "registered"
3. Set MPIN
4. Verify status = "pending_approval"
5. Admin login
6. Change user status to "active"
7. User login
8. Verify full access

### Test Admin Functions

1. Admin login
2. View users list
3. Edit user details
4. Change user status
5. View status statistics
6. Check status page

## API Testing Examples

### Set MPIN
```bash
TOKEN="your_jwt_token"

curl -X POST "http://localhost:8000/api/v1/mpin/set-mpin" \
  -H "Authorization: Bearer $TOKEN" \
  -F "mpin=1234" \
  -F "confirm_mpin=1234"
```

### Admin Change Status
```bash
ADMIN_TOKEN="admin_jwt_token"
USER_ID="user_id_here"

curl -X PUT "http://localhost:8000/api/v1/admin/users/$USER_ID/status?status_code=active" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Status Stats
```bash
curl -X GET "http://localhost:8000/api/v1/statuses/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

**Version**: 2.1  
**Last Updated**: December 2024  
**Status**: Production Ready ✅

