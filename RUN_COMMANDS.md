# How to Run PR TRAVELS Driver App

## 🚀 Quick Start Commands

### Backend
```bash
cd /Users/sree/Documents/DriverApp/driver_app/backend
source venv/bin/activate
python main.py
```

### Frontend
```bash
cd /Users/sree/Documents/DriverApp/driver_app/frontend
npm run dev
```

---

## 📦 First Time Setup

### 1. Setup Virtual Environment (Backend)
```bash
cd /Users/sree/Documents/DriverApp/driver_app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Install Dependencies (Frontend)
```bash
cd /Users/sree/Documents/DriverApp/driver_app/frontend
npm install
```

### 3. Seed Statuses & Create Admin
```bash
cd /Users/sree/Documents/DriverApp/driver_app
python backend/app/db/seed_statuses.py
python create_admin.py
```

---

## 💻 Running the Application

### Option 1: Manual (2 Terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/sree/Documents/DriverApp/driver_app/backend
source venv/bin/activate
python main.py
```
✅ Backend runs on: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
cd /Users/sree/Documents/DriverApp/driver_app/frontend
npm run dev
```
✅ Frontend runs on: http://localhost:5173

### Option 2: Using Docker
```bash
cd /Users/sree/Documents/DriverApp/driver_app
docker-compose up -d
```

---

## 🛑 Stop Commands

### Stop Backend
Press `Ctrl + C` in backend terminal

### Stop Frontend
Press `Ctrl + C` in frontend terminal

### Stop Docker
```bash
docker-compose down
```

---

## 📋 Daily Development

```bash
# Morning - Start work
# Terminal 1
cd /Users/sree/Documents/DriverApp/driver_app/backend
source venv/bin/activate
python main.py

# Terminal 2
cd /Users/sree/Documents/DriverApp/driver_app/frontend
npm run dev

# Open browser: http://localhost:5173
```

---

## 🌐 Access URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

## 🔧 Alternative Backend Start Commands

All of these work:

```bash
# Method 1 (Recommended)
python main.py

# Method 2
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Method 3 (Production)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 📝 Complete Setup Script

Copy and paste this for first-time setup:

```bash
cd /Users/sree/Documents/DriverApp/driver_app

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app/db/seed_statuses.py
cd ..

# Frontend setup
cd frontend
npm install
cd ..

# Create admin
python create_admin.py

# Done! Now run the app
echo "✅ Setup complete!"
echo "Terminal 1: cd backend && source venv/bin/activate && python main.py"
echo "Terminal 2: cd frontend && npm run dev"
```

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Run Backend | `python main.py` |
| Run Frontend | `npm run dev` |
| Activate venv | `source venv/bin/activate` |
| Deactivate venv | `deactivate` |
| View API docs | http://localhost:8000/docs |
| Access app | http://localhost:5173 |

---

**Note:** Always activate the virtual environment before running the backend!

