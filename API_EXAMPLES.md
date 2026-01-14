# API Examples

This document provides example API calls for the Driver App.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

### Register a New User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "user"
  }'
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### Register an Admin User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## User Endpoints

### Get Current User Profile
```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Current User Profile
```bash
curl -X PUT "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Updated Doe",
    "email": "newemail@example.com"
  }'
```

## Driver Endpoints

### Create Driver Profile
```bash
curl -X POST "http://localhost:8000/api/v1/drivers" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "507f1f77bcf86cd799439011",
    "license_number": "DL123456789",
    "vehicle_type": "Sedan",
    "vehicle_number": "ABC-1234",
    "status": "offline",
    "current_location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }'
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "user_id": "507f1f77bcf86cd799439011",
  "license_number": "DL123456789",
  "vehicle_type": "Sedan",
  "vehicle_number": "ABC-1234",
  "status": "offline",
  "current_location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "rating": 0.0,
  "total_trips": 0,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### List All Drivers
```bash
curl -X GET "http://localhost:8000/api/v1/drivers?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Driver by ID
```bash
curl -X GET "http://localhost:8000/api/v1/drivers/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Driver
```bash
curl -X PUT "http://localhost:8000/api/v1/drivers/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "available",
    "current_location": {
      "latitude": 37.7849,
      "longitude": -122.4094
    }
  }'
```

## Admin Endpoints

**Note:** All admin endpoints require a user with `role: "admin"` and a valid JWT token.

### List All Users
```bash
curl -X GET "http://localhost:8000/api/v1/admin/users?skip=0&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### Get User by ID
```bash
curl -X GET "http://localhost:8000/api/v1/admin/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### Delete User
```bash
curl -X DELETE "http://localhost:8000/api/v1/admin/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### Activate User
```bash
curl -X PUT "http://localhost:8000/api/v1/admin/users/507f1f77bcf86cd799439011/activate" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "User activated successfully"
}
```

### Deactivate User
```bash
curl -X PUT "http://localhost:8000/api/v1/admin/users/507f1f77bcf86cd799439011/deactivate" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "User deactivated successfully"
}
```

### Get Application Statistics
```bash
curl -X GET "http://localhost:8000/api/v1/admin/stats" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

**Response:**
```json
{
  "total_users": 150,
  "total_drivers": 45,
  "active_users": 120
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

### 400 Bad Request
```json
{
  "detail": "Email already registered"
}
```

## Using with JavaScript/TypeScript

The frontend already has API helpers configured. Example:

```typescript
import { authAPI, usersAPI, driversAPI, adminAPI } from './lib/api'

// Login
const { data } = await authAPI.login('user@example.com', 'password123')

// Get current user
const { data: user } = await authAPI.getCurrentUser()

// Create driver
const { data: driver } = await driversAPI.create({
  user_id: user.id,
  license_number: 'DL123456789',
  vehicle_type: 'Sedan',
  vehicle_number: 'ABC-1234'
})

// Admin: Get all users
const { data: users } = await adminAPI.getAllUsers()
```

## Interactive API Documentation

Visit http://localhost:8000/docs for interactive Swagger UI documentation where you can:
- View all endpoints
- Try API calls directly from the browser
- See request/response schemas
- Authorize with JWT token

## Notes

- Replace `YOUR_TOKEN_HERE` with the actual JWT token from login
- All timestamps are in ISO 8601 format (UTC)
- Pagination is supported with `skip` and `limit` query parameters
- The JWT token expires after 30 minutes (configurable in `.env`)


