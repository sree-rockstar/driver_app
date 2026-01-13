# cPanel Deployment Checklist

## Quick Summary for cPanel Deployment

### Application Root on cPanel
Upload your files to: **`/home/yourusername/driver_app/`**

### Entry Point File
**File**: `passenger_wsgi.py` (already created in `backend/` folder)  
**Callable Object**: `application`

---

## ✅ Pre-Deployment Checklist

### 1. Files to Upload to `/home/yourusername/driver_app/`

```
✅ app/                    (entire directory)
✅ passenger_wsgi.py       (from backend/ folder)
✅ requirements.txt        (updated with asgiref)
✅ .env                    (create with production settings)
✅ uploads/                (empty directory)
```

**DO NOT upload:**
- ❌ venv/
- ❌ __pycache__/
- ❌ *.pyc files
- ❌ backend.log

### 2. Create `.env` File in Application Root

Create `/home/yourusername/driver_app/.env`:

```bash
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=driver_app
SECRET_KEY=CHANGE-THIS-TO-A-VERY-SECURE-RANDOM-STRING
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
APP_NAME=Driver App API
```

### 3. Update passenger_wsgi.py

Edit line 17 in `passenger_wsgi.py`:

```python
# Change this:
INTERP = "/home/username/virtualenv/driver_app/3.11/bin/python"

# To your actual cPanel path (found in "Setup Python App"):
INTERP = "/home/YOURUSERNAME/virtualenv/driver_app/3.11/bin/python"
```

---

## 📋 cPanel Setup Steps

### Step 1: Setup Python App

1. Login to cPanel
2. Go to **"Setup Python App"** (or "Python Selector")
3. Click **"Create Application"**
4. Fill in:
   - **Python Version**: 3.11 (or 3.9+)
   - **Application Root**: `driver_app` (or `/home/yourusername/driver_app`)
   - **Application URL**: Your domain or subdomain
   - **Application Startup File**: `passenger_wsgi.py`
   - **Application Entry Point**: `application`

### Step 2: Install Dependencies

In cPanel Terminal or SSH:

```bash
cd ~/driver_app
source ~/virtualenv/driver_app/3.11/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Set Permissions

```bash
chmod 755 ~/driver_app
chmod 755 ~/driver_app/app
chmod 755 ~/driver_app/uploads
chmod 644 ~/driver_app/passenger_wsgi.py
```

### Step 4: Start Application

```bash
mkdir -p ~/driver_app/tmp
touch ~/driver_app/tmp/restart.txt
```

Or click **"Restart"** button in cPanel Python App interface.

---

## 🗄️ MongoDB Setup

### Option A: MongoDB Atlas (Recommended - Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (or your server IP)
5. Get connection string
6. Update `.env` with connection string

### Option B: Local MongoDB (if available)

Ask your hosting provider if MongoDB is available on the server.

---

## 🧪 Testing

### Test Backend API

```bash
# Test health endpoint
curl https://yourdomain.com/health

# Should return: {"status":"healthy"}

# Test root endpoint
curl https://yourdomain.com/

# Should return: {"message":"Welcome to Driver App API"}

# Test API docs
curl https://yourdomain.com/api/v1/openapi.json
```

### View Logs

```bash
# Application logs
tail -f ~/driver_app/tmp/error.log

# Access logs
tail -f ~/logs/access_log
```

---

## 🔧 Troubleshooting

### Application Won't Start

1. Check Python version: `python --version` (should be 3.9+)
2. Verify virtual environment path in `passenger_wsgi.py`
3. Check logs: `tail -f ~/driver_app/tmp/error.log`
4. Verify all dependencies installed: `pip list`

### Import Errors

```bash
cd ~/driver_app
source ~/virtualenv/driver_app/3.11/bin/activate
pip install -r requirements.txt --force-reinstall
touch ~/driver_app/tmp/restart.txt
```

### 500 Internal Server Error

1. Check `.env` file exists and is readable
2. Check file permissions (755 for directories, 644 for files)
3. View error logs
4. Verify MongoDB connection string

### CORS Errors

Update `ALLOWED_ORIGINS` in `.env`:
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://localhost:5173
```

---

## 🔄 Restarting Application

Whenever you make changes, restart the app:

```bash
touch ~/driver_app/tmp/restart.txt
```

Or use the **"Restart"** button in cPanel's Python App interface.

---

## 📁 Directory Structure on cPanel

```
/home/yourusername/
├── driver_app/                    # ← Application Root (upload here)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app instance
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   └── models/
│   ├── uploads/                  # Upload directory
│   ├── tmp/                      # Passenger temp (auto-created)
│   │   └── restart.txt
│   ├── passenger_wsgi.py         # ← Entry point
│   ├── requirements.txt
│   └── .env                      # Environment variables
│
└── public_html/                  # Frontend (optional)
    ├── index.html
    ├── assets/
    └── .htaccess
```

---

## 🚀 Final Checklist

- [ ] Upload all files to `/home/yourusername/driver_app/`
- [ ] Create `.env` file with production settings
- [ ] Update `INTERP` path in `passenger_wsgi.py`
- [ ] Setup Python App in cPanel
- [ ] Install dependencies via pip
- [ ] Setup MongoDB (Atlas or local)
- [ ] Update MongoDB connection string in `.env`
- [ ] Set correct file permissions
- [ ] Restart application
- [ ] Test API endpoints
- [ ] Check logs for errors
- [ ] Update CORS settings if needed

---

## 📞 Need Help?

If you encounter issues:
1. Check the detailed guide: `CPANEL_DEPLOYMENT_GUIDE.md`
2. View logs: `tail -f ~/driver_app/tmp/error.log`
3. Contact your hosting provider for Python/MongoDB support
4. Consider alternative hosting (Railway, Render, DigitalOcean) for better FastAPI support

---

## 🔗 Important URLs

After deployment, your app will be available at:
- **API Root**: `https://yourdomain.com/`
- **Health Check**: `https://yourdomain.com/health`
- **API Endpoints**: `https://yourdomain.com/api/v1/...`
- **API Docs**: `https://yourdomain.com/docs` (if enabled)

Good luck with your deployment! 🚀

