# Routing Debug Guide

## Issue
After successful login, the app redirects back to `/login` instead of `/admin` or `/dashboard`.

## Debugging Steps

### 1. Check Browser Console
Open browser console (F12) and look for:
- Login success messages
- Token received
- User data
- Navigation logs
- ProtectedRoute checks

### 2. Check Local Storage
In browser console, run:
```javascript
// Check if auth is stored
localStorage.getItem('auth-storage')

// Parse and view
JSON.parse(localStorage.getItem('auth-storage'))
```

Should show:
```json
{
  "state": {
    "user": {
      "id": "...",
      "mobile_number": "8884441998",
      "full_name": "Sreekanth",
      "role": "admin",
      ...
    },
    "token": "eyJhbG..."
  }
}
```

### 3. Test API Directly

Use the test file: `test_login.html`

```bash
# Open in browser
open test_login.html
```

Or test via curl:
```bash
# Step 1: Check mobile
curl -X POST "http://localhost:8000/api/v1/auth/check-mobile" \
  -F "mobile_number=8884441998"

# Step 2: Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -F "mobile_number=8884441998" \
  -F "mpin=1359"

# Step 3: Get user (use token from step 2)
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Check Console Logs

The app now has debug logs. After login attempt, check console for:

```
Login successful, token received: {access_token: "...", token_type: "bearer"}
User data received: {id: "...", role: "admin", ...}
Auth state set, user role: admin
Navigating to /admin
ProtectedRoute check: {hasToken: true, hasUser: true, userRole: "admin", requireAdmin: true}
Access granted
```

### 5. Common Issues

#### Issue: Auth state not persisting
**Symptom**: Login succeeds but immediately redirects back
**Check**: 
```javascript
// In browser console after login
console.log(localStorage.getItem('auth-storage'))
```
**Solution**: Clear local storage and try again
```javascript
localStorage.clear()
```

#### Issue: Token not being sent
**Symptom**: 401 errors after login
**Check**: Network tab in browser, look for Authorization header
**Solution**: Verify axios interceptor is working

#### Issue: User role not matching
**Symptom**: Admin redirected to /dashboard
**Check**: 
```javascript
const { user } = useAuthStore.getState()
console.log(user.role)  // Should be "admin"
```
**Solution**: Verify database has correct role

### 6. Force Clear and Retry

```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Then login again.

### 7. Check Backend Logs

Look for:
- Login request received
- User found
- MPIN verified
- Token generated
- User data returned

## Quick Fix Commands

### Clear Browser Storage
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Restart Backend
```bash
lsof -ti:8000 | xargs kill -9
cd backend && source venv/bin/activate && python main.py
```

### Restart Frontend
```bash
lsof -ti:5173 | xargs kill -9
cd frontend && npm run dev
```

## Expected Flow

```
1. User enters mobile → Click Next
   Console: "Checking mobile..."
   
2. Backend validates mobile
   Console: "Mobile valid, has MPIN: true"
   
3. User enters MPIN → Click Sign In
   Console: "Login successful, token received"
   Console: "User data received: {role: 'admin'}"
   Console: "Auth state set, user role: admin"
   Console: "Navigating to /admin"
   
4. ProtectedRoute checks auth
   Console: "ProtectedRoute check: {hasToken: true, hasUser: true, userRole: 'admin'}"
   Console: "Access granted"
   
5. Admin Dashboard loads
   URL: http://localhost:5173/admin
```

## If Still Not Working

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Clear console**
4. **Try login again**
5. **Copy all console logs**
6. **Share the logs** to identify the exact issue

The debug logs will show exactly where the flow is breaking!

