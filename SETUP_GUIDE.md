# Quick Setup Guide

## 🚀 Fast Start (5 minutes)

### Prerequisites Check
```bash
# Check Python version (need 3.11+)
python --version

# Check Node version (need 18+)
node --version

# Check if MongoDB is installed
mongod --version

# OR use Docker
docker --version
```

## Method 1: Docker Setup (Easiest) 🐳

```bash
# 1. Navigate to project
cd driver_app

# 2. Start everything
docker-compose up -d

# 3. Wait 30 seconds for services to start

# 4. Open browser
open http://localhost:5173
```

**That's it!** 🎉

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Method 2: Manual Setup 🛠️

### Step 1: Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Step 2: Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Start server (in a new terminal)
python run.py
```

Backend running at http://localhost:8000 ✅

### Step 3: Frontend Setup
```bash
# Open a NEW terminal

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend running at http://localhost:5173 ✅

## First User Registration 👤

### Option 1: Using the UI
1. Go to http://localhost:5173/register
2. Fill in the form
3. Click "Sign Up"
4. Login at http://localhost:5173/login

**Note**: First user will be a regular user. To create admin, use Option 2.

### Option 2: Create Admin via API
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

Then login at http://localhost:5173/login with:
- Email: `admin@example.com`
- Password: `admin123`

## Testing the Setup ✅

1. **Register a user** at http://localhost:5173/register
2. **Login** at http://localhost:5173/login
3. **See dashboard** - should redirect automatically
4. **Check API docs** at http://localhost:8000/docs

## Common Issues & Solutions 🔧

### "Port already in use"
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
pgrep mongod

# If not, start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### "Module not found" (Python)
```bash
# Make sure venv is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### "Dependencies error" (Node)
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps 🎯

1. ✅ Setup complete
2. ✅ Create your first admin user
3. ✅ Explore the admin panel
4. ✅ Read the main README.md for detailed documentation
5. ✅ Start building your features!

## Need Help? 

- Check `README.md` for detailed documentation
- Visit http://localhost:8000/docs for API documentation
- Check browser console for frontend errors
- Check terminal for backend errors

---

**You're all set! Happy coding! 🚀**


