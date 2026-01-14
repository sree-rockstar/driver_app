# Debugging Guide for PR TRAVELS Driver App

## 🐛 VS Code/Cursor Debug Configurations

The project includes pre-configured debug setups in `.vscode/launch.json`.

---

## 🚀 Available Debug Configurations

### 1. 🐍 Backend: FastAPI
- **What**: Runs the FastAPI backend with debugger attached
- **Port**: 8000
- **Features**: Hot reload, breakpoints, step debugging
- **Use When**: Debugging backend API endpoints

**How to Use:**
1. Open any Python file in `backend/`
2. Press `F5` or click "Run and Debug"
3. Select "🐍 Backend: FastAPI"
4. Set breakpoints in your code
5. Make API calls to trigger breakpoints

### 2. 🐍 Backend: Run main.py
- **What**: Runs main.py directly with debugger
- **Use When**: Debugging server startup issues

### 3. ⚛️ Frontend: React Dev Server
- **What**: Starts Vite dev server with debugging
- **Port**: 5173
- **Use When**: Running frontend for testing

### 4. 🌐 Frontend: Chrome Debug
- **What**: Launches Chrome with debugging enabled
- **URL**: http://localhost:5173
- **Use When**: Debugging React components, frontend logic
- **Features**: Console logging, React DevTools

**How to Use:**
1. Make sure backend is running
2. Select "🌐 Frontend: Chrome Debug"
3. Chrome will open with debugger attached
4. Set breakpoints in `.tsx` files
5. Interact with the app to hit breakpoints

### 5. 🧪 Backend: Seed Statuses
- **What**: Runs the status seeding script with debugger
- **Use When**: Debugging database seeding

### 6. 👤 Backend: Create Admin
- **What**: Runs admin creation script with debugger
- **Use When**: Debugging admin user creation

---

## 🎯 Compound Configurations (Run Multiple)

### 🚀 Full Stack (Backend + Frontend)
- **What**: Starts both backend and frontend together
- **Components**: 
  - Backend on port 8000
  - Frontend on port 5173
- **Use When**: Full stack development and testing

**How to Use:**
1. Press `F5`
2. Select "🚀 Full Stack (Backend + Frontend)"
3. Both servers start simultaneously
4. Open http://localhost:5173

### 🔍 Full Stack Debug (Backend + Chrome)
- **What**: Backend + Chrome with debugging
- **Use When**: Debugging both frontend and backend together

---

## 🎨 Setting Breakpoints

### Backend (Python)
```python
# In any .py file, click left margin or press F9
def login(mobile_number: str, mpin: str):
    # Set breakpoint here ← Click here
    user = await db.users.find_one({"mobile_number": mobile_number})
    
    # Debugger will pause execution
    if not user:  # ← You can inspect variables here
        raise HTTPException(...)
```

### Frontend (TypeScript/React)
```typescript
// In any .tsx or .ts file
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Set breakpoint here ← Click left margin
  const { data } = await authAPI.login(mobileNumber, mpin)
  
  // Inspect variables in debug console
  console.log(data)  // ← Also logged in debug console
}
```

---

## 🔍 Debug Features

### Backend Debugging

**Watch Variables:**
- Add variables to "Watch" panel
- Example: `user`, `form_data`, `db`

**Call Stack:**
- See the execution path
- Navigate up/down the stack

**Debug Console:**
- Execute Python expressions
- Example: `print(user['email'])`

**Conditional Breakpoints:**
- Right-click breakpoint
- Add condition: `mobile_number == "9876543210"`

### Frontend Debugging

**React DevTools:**
- Inspect component state
- View props
- Component tree

**Network Tab:**
- Monitor API calls
- Check request/response
- View timing

**Console:**
- View console.log output
- Execute JavaScript

---

## 📋 Common Debug Scenarios

### Scenario 1: Debug Login Flow

**Backend:**
```python
# File: backend/app/api/v1/endpoints/auth.py
@router.post("/login")
async def login(mobile_number: str, mpin: str):
    # Breakpoint 1: Check input
    print(f"Login attempt: {mobile_number}")
    
    user = await db.users.find_one({"mobile_number": mobile_number})
    # Breakpoint 2: Check if user found
    
    if not verify_password(mpin, user.get("mpin_hash", "")):
        # Breakpoint 3: Check password verification
        raise HTTPException(...)
```

**Frontend:**
```typescript
// File: frontend/src/pages/Login.tsx
const handleMpinSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Breakpoint 1: Check form data
  console.log({ mobileNumber, mpin })
  
  try {
    // Breakpoint 2: Before API call
    const { data: tokenData } = await authAPI.login(mobileNumber, mpin)
    
    // Breakpoint 3: After successful login
    const { data: userData } = await authAPI.getCurrentUser()
    setAuth(userData, tokenData.access_token)
  } catch (err) {
    // Breakpoint 4: On error
    console.error(err)
  }
}
```

### Scenario 2: Debug Database Query

```python
# File: backend/app/api/v1/endpoints/admin.py
@router.get("/users")
async def list_all_users():
    db = get_database()
    
    # Breakpoint 1: Before query
    users_cursor = db.users.find().skip(0).limit(50)
    
    # Breakpoint 2: After query
    users = await users_cursor.to_list(length=50)
    
    # Inspect 'users' variable
    print(f"Found {len(users)} users")
    
    return users
```

### Scenario 3: Debug MPIN Setting

```python
# File: backend/app/api/v1/endpoints/mpin.py
@router.post("/set-mpin")
async def set_mpin(mpin: str, confirm_mpin: str, current_user: dict):
    # Breakpoint 1: Validate input
    if mpin != confirm_mpin:
        raise HTTPException(...)
    
    # Breakpoint 2: Before hashing
    hashed_mpin = get_password_hash(mpin)
    
    # Breakpoint 3: Before database update
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"mpin_hash": hashed_mpin, "has_mpin": True}}
    )
    
    # Breakpoint 4: Success
    return {"message": "MPIN set successfully"}
```

---

## 🛠️ Debug Tools

### VS Code Debug Console

**Backend (Python):**
```python
# While paused at breakpoint, type in Debug Console:
user['email']
len(users)
type(mpin)
dir(current_user)
```

**Frontend (JavaScript):**
```javascript
// While paused at breakpoint, type in Console:
mobileNumber
userData.role
Object.keys(formData)
JSON.stringify(user, null, 2)
```

---

## 🔧 Troubleshooting Debug Issues

### Backend Not Starting

**Issue**: "Module not found"
```bash
# Solution: Set PYTHONPATH
export PYTHONPATH=/Users/sree/Documents/DriverApp/driver_app/backend
```

**Issue**: "Port 8000 already in use"
```bash
# Solution: Kill existing process
lsof -ti:8000 | xargs kill -9
```

### Frontend Debug Not Working

**Issue**: Chrome doesn't open
- Install Chrome browser
- Or change `type` to `"msedge"` for Edge

**Issue**: Breakpoints not hitting
- Make sure source maps are enabled
- Check `vite.config.ts` has `sourcemap: true`

### Debugger Not Attaching

**Issue**: Python debugger won't attach
```bash
# Solution: Install debugpy
pip install debugpy
```

**Issue**: TypeScript debugger not working
```bash
# Solution: Rebuild frontend
npm run build
```

---

## 📝 Debug Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Start Debugging | `F5` | `F5` |
| Stop Debugging | `Shift+F5` | `Shift+F5` |
| Step Over | `F10` | `F10` |
| Step Into | `F11` | `F11` |
| Step Out | `Shift+F11` | `Shift+F11` |
| Continue | `F5` | `F5` |
| Toggle Breakpoint | `F9` | `F9` |
| Debug Console | `Ctrl+Shift+Y` | `Cmd+Shift+Y` |

---

## 🎯 Best Practices

1. **Use Breakpoints Wisely**
   - Don't set too many at once
   - Use conditional breakpoints for specific cases
   - Remove breakpoints when done

2. **Log Important Data**
   - Add strategic `print()` or `console.log()`
   - Use logging levels (DEBUG, INFO, ERROR)

3. **Test in Isolation**
   - Debug one component at a time
   - Use unit tests for individual functions

4. **Check Network**
   - Use browser Network tab
   - Check API responses
   - Verify request payloads

5. **Database State**
   - Check MongoDB directly
   - Use MongoDB Compass
   - Verify data before debugging

---

## 🎓 Learn More

### Backend Debugging
- [VS Code Python Debugging](https://code.visualstudio.com/docs/python/debugging)
- [FastAPI Debugging Tips](https://fastapi.tiangolo.com/tutorial/debugging/)

### Frontend Debugging
- [VS Code JavaScript Debugging](https://code.visualstudio.com/docs/nodejs/reactjs-tutorial)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

**Happy Debugging! 🐛 → ✨**

