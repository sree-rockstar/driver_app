# MPIN-Based Login System

## Overview

The Driver App now uses a **two-step MPIN-based login** system instead of traditional password login. This provides a more mobile-friendly and secure authentication experience.

## Login Flow

### Step 1: Enter Mobile Number
```
User enters 10-digit mobile number → Clicks "Next"
                    ↓
System checks if mobile exists and has MPIN set
                    ↓
If valid: Show MPIN entry screen
If invalid: Show error message
```

### Step 2: Enter MPIN
```
User enters 4 or 6 digit MPIN → Clicks "Sign In"
                    ↓
System validates MPIN against database
                    ↓
If correct: Generate JWT token → Route to dashboard
If incorrect: Show error message
```

## User Experience

### Login Page (`/login`)

**Step 1 - Mobile Number Entry:**
- Clean, focused interface
- Single input field for mobile number
- 10-digit validation
- "Next" button disabled until valid mobile entered
- Auto-focus on input field

**Step 2 - MPIN Entry:**
- Shows user's mobile number with edit option
- Displays user's name (personalization)
- MPIN input with show/hide toggle
- Large, centered input for easy typing
- 4-6 digit MPIN support
- Numeric keyboard on mobile
- "Back" option to change mobile number

### Dashboard Messaging

**If Status = `pending_approval`:**
```
⏳ Your Account is Pending for Approval

Thank you for registering with PR TRAVELS. Your account is 
currently under review by our admin team.

You will be notified once your account is approved and activated.

[Info Box]
What happens next?
Our team will review your documents and verify your details.
This usually takes 24-48 hours. Once approved, you'll have 
full access to all features.
```

**If Status = `active` (or other):**
```
🚗 Welcome to PR TRAVELS

Hello, [User Name]!

Your journey with us begins here. Explore your dashboard to 
manage your profile, view trips, and access all our services.
```

## API Endpoints

### 1. Check Mobile Number
Validates mobile number and returns user info without authentication.

```bash
POST /api/v1/auth/check-mobile
Content-Type: multipart/form-data

Fields:
- mobile_number (string, 10 digits)
```

**Success Response (200):**
```json
{
  "mobile_number": "9876543210",
  "has_mpin": true,
  "full_name": "John Doe",
  "status": "active"
}
```

**Error Responses:**
- **400**: Invalid mobile number format
- **404**: Mobile number not registered
- **403**: Account not active (deactivated/suspended)

### 2. Login with MPIN
Authenticates user with mobile number and MPIN.

```bash
POST /api/v1/auth/login
Content-Type: multipart/form-data

Fields:
- mobile_number (string, 10 digits)
- mpin (string, 4-6 digits)
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- **400**: Invalid mobile number format or MPIN not set
- **401**: Mobile number not registered or incorrect MPIN
- **403**: Account deactivated or suspended

## Security Features

### Mobile Number Validation
- Exactly 10 digits required
- Must be numeric only
- Checked against database before proceeding

### MPIN Security
- Hashed using bcrypt
- 4 or 6 digits only
- Numeric only
- Show/hide toggle for privacy
- Failed attempts logged (future: rate limiting)

### Status-Based Access Control
```javascript
// Allowed to login
if (status === 'registered' || 
    status === 'pending_approval' || 
    status === 'active') {
  // Allow login
}

// Blocked from login
if (status === 'inactive') {
  throw "Account is suspended"
}

if (status === 'deactivated') {
  throw "Account has been deactivated"
}
```

### Token Generation
- JWT token with 30-minute expiry (configurable)
- Contains: `mobile_number` and `role`
- HS256 algorithm
- Secure secret key

## Frontend Implementation

### Login Component Structure

```typescript
// State management
const [step, setStep] = useState<'mobile' | 'mpin'>('mobile')
const [mobileNumber, setMobileNumber] = useState('')
const [mpin, setMpin] = useState('')
const [userInfo, setUserInfo] = useState(null)

// Step 1: Mobile validation
const handleMobileNext = async () => {
  const { data } = await authAPI.checkMobile(mobileNumber)
  if (data.has_mpin) {
    setUserInfo(data)
    setStep('mpin')
  }
}

// Step 2: MPIN authentication
const handleMpinSubmit = async () => {
  const { data: tokenData } = await authAPI.login(mobileNumber, mpin)
  const { data: userData } = await authAPI.getCurrentUser()
  setAuth(userData, tokenData.access_token)
  navigate('/dashboard')
}
```

### Dashboard Conditional Rendering

```typescript
{user?.status === 'pending_approval' ? (
  // Show approval pending message
  <PendingApprovalMessage />
) : (
  // Show PR TRAVELS welcome
  <WelcomeMessage />
)}
```

## Error Messages

### Mobile Number Step

| Error | Message | Action |
|-------|---------|--------|
| Invalid format | "Invalid mobile number format" | Re-enter mobile |
| Not registered | "Mobile number not found." | Register or correct number |
| No MPIN | "MPIN not set. Please complete registration first." | Complete registration |
| Account blocked | "Account is not active. Please contact support." | Contact support |

### MPIN Step

| Error | Message | Action |
|-------|---------|--------|
| Wrong MPIN | "Incorrect MPIN. Please try again." | Re-enter MPIN |
| Account suspended | "Account is suspended. Please contact support." | Contact support |
| Account deactivated | "Account has been deactivated. Please contact support." | Contact support |

## User Journey Examples

### New User Journey

```
Day 1:
1. User registers with documents
2. Status: "registered"
3. User tries to login → Enter mobile → Asked to set MPIN
4. User sets MPIN
5. Status changes to "pending_approval"
6. User logs in again → Sees "Pending for Approval" message

Day 2:
7. Admin approves account
8. Status changes to "active"
9. User logs in → Sees "Welcome to PR TRAVELS"
10. Full access granted
```

### Returning User Journey

```
1. User opens app
2. Enters mobile number → Clicks Next
3. Sees personalized greeting: "Hello, [Name]!"
4. Enters MPIN
5. Instant login → Dashboard
6. Sees relevant message based on status
```

### Blocked User Journey

```
1. User enters mobile number → Clicks Next
2. System checks status
3. If suspended: Shows "Account is suspended"
4. If deactivated: Shows "Account has been deactivated"
5. User cannot proceed → Must contact support
```

## Testing

### Test Cases

#### 1. Valid Login Flow
```bash
# Step 1: Check mobile
curl -X POST "http://localhost:8000/api/v1/auth/check-mobile" \
  -F "mobile_number=9876543210"

# Expected: 200 with user info

# Step 2: Login with MPIN
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -F "mobile_number=9876543210" \
  -F "mpin=1234"

# Expected: 200 with JWT token
```

#### 2. Invalid Mobile Number
```bash
curl -X POST "http://localhost:8000/api/v1/auth/check-mobile" \
  -F "mobile_number=123"

# Expected: 400 - Invalid format
```

#### 3. Unregistered Mobile
```bash
curl -X POST "http://localhost:8000/api/v1/auth/check-mobile" \
  -F "mobile_number=0000000000"

# Expected: 404 - Not registered
```

#### 4. Wrong MPIN
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -F "mobile_number=9876543210" \
  -F "mpin=0000"

# Expected: 401 - Incorrect MPIN
```

#### 5. No MPIN Set
```bash
# User with status "registered" and has_mpin = false
curl -X POST "http://localhost:8000/api/v1/auth/check-mobile" \
  -F "mobile_number=9876543210"

# Expected: 200 with has_mpin: false

curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -F "mobile_number=9876543210" \
  -F "mpin=1234"

# Expected: 400 - MPIN not set
```

## Mobile Responsiveness

### Login Screen
- Full-screen on mobile
- Large touch targets
- Numeric keyboard for mobile/MPIN
- Auto-focus on inputs
- Smooth transitions between steps

### Dashboard
- Responsive cards
- Touch-friendly buttons
- Readable text sizes
- Optimized for small screens

## Accessibility

- Proper label associations
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios
- Focus indicators
- Error announcements

## Performance

- Minimal API calls (only 2 for complete login)
- Instant validation feedback
- Optimistic UI updates
- No unnecessary re-renders
- Lazy loading of dashboard components

## Future Enhancements

- [ ] Biometric login (fingerprint/face ID)
- [ ] Remember device (skip mobile entry)
- [ ] MPIN recovery via OTP
- [ ] Rate limiting for failed attempts
- [ ] Account lockout after X failed attempts
- [ ] Login notification (SMS/Email)
- [ ] Multi-device management
- [ ] Session management UI
- [ ] Login history
- [ ] Suspicious login detection

## Migration from Password

If you have existing users with password-based login:

1. **Dual Support Period** (recommended):
   ```python
   # Support both password and MPIN
   if user.has_mpin:
       # Validate MPIN
   else:
       # Validate password
   ```

2. **Force MPIN Setup**:
   - After successful password login
   - Redirect to MPIN setup
   - Mark password as deprecated

3. **Communication**:
   - Notify users about change
   - Provide migration guide
   - Set deadline for transition

## Troubleshooting

### Issue: User can't login after setting MPIN

**Check:**
1. Verify `has_mpin = true` in database
2. Verify `mpin_hash` exists
3. Check user status (not inactive/deactivated)
4. Try resetting MPIN via admin

### Issue: "MPIN not set" error but user claims they set it

**Check:**
1. Query user in database
2. Verify `has_mpin` field value
3. Check if status changed to "pending_approval"
4. Review application logs for errors during MPIN setup

### Issue: Dashboard shows wrong message

**Check:**
1. User's current status in database
2. Frontend receiving correct user data
3. Conditional rendering logic
4. Browser cache (clear and retry)

## Configuration

### MPIN Length
```python
# backend/app/api/v1/endpoints/mpin.py
# Change accepted MPIN lengths
if len(mpin) not in [4, 6, 8]:  # Add 8-digit support
    raise HTTPException(...)
```

### Token Expiry
```bash
# backend/.env
ACCESS_TOKEN_EXPIRE_MINUTES=30  # Change as needed
```

### Mobile Number Length
```python
# backend/app/api/v1/endpoints/auth.py
# Change for different countries
if len(mobile_number) != 10:  # Change to 11 for some countries
    raise HTTPException(...)
```

## Best Practices

1. **Always validate mobile format** before database queries
2. **Hash MPIN** immediately after receiving
3. **Use HTTPS** in production
4. **Implement rate limiting** for failed attempts
5. **Log authentication attempts** for security audit
6. **Use secure token storage** in frontend
7. **Clear sensitive data** from memory after use
8. **Implement CSRF protection** for API calls
9. **Regular security audits** of authentication flow
10. **Monitor for unusual patterns** (multiple failed logins, etc.)

---

**Version**: 3.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅

