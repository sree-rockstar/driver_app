# Your cPanel Deployment Paths

## 📍 Your Specific Paths

**cPanel Username**: `thinktre`  
**Application Name**: `driver_app`

---

## Directory Structure on Your cPanel

```
/home/thinktre/
├── driver_app/                              # ← Upload your application here
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   └── models/
│   ├── uploads/                            # Create this directory
│   ├── tmp/                                # Auto-created by Passenger
│   ├── passenger_wsgi.py                   # Entry point (already configured)
│   ├── requirements.txt
│   └── .env                                # Create this file
│
├── virtualenv/
│   └── driver_app/
│       └── 3.11/
│           └── bin/
│               └── python                  # Your Python interpreter
│
└── public_html/                            # Optional: for frontend
    ├── index.html
    └── assets/
```

---

## ✅ Your Configuration (Already Set)

### passenger_wsgi.py

```python
INTERP = "/home/thinktre/virtualenv/driver_app/3.11/bin/python"
```

✅ **Already configured correctly!**

---

## 📋 Upload Checklist

### Files to Upload to `/home/thinktre/driver_app/`

From your local `backend/` folder, upload:

```
✅ app/                    (entire folder)
✅ passenger_wsgi.py       (already configured)
✅ requirements.txt        (updated)
✅ uploads/                (create empty folder)
```

### Create .env File

Create `/home/thinktre/driver_app/.env` with:

```bash
# MongoDB Configuration (use MongoDB Atlas)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=driver_app

# JWT Security
SECRET_KEY=your-very-secure-random-secret-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - Add your domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Application
APP_NAME=Driver App API
DEBUG=false
```

---

## 🚀 cPanel Setup Steps

### 1. Create Python Application

1. Login to cPanel → **"Setup Python App"**
2. Click **"Create Application"**
3. Fill in:
   - **Python Version**: `3.11` (or 3.9+)
   - **Application Root**: `driver_app`
   - **Application URL**: Your domain
   - **Application Startup File**: `passenger_wsgi.py`
   - **Application Entry Point**: `application`
4. Click **"Create"**

### 2. Install Dependencies

In cPanel Terminal or SSH:

```bash
cd /home/thinktre/driver_app
source /home/thinktre/virtualenv/driver_app/3.11/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Set Permissions

```bash
chmod 755 /home/thinktre/driver_app
chmod 755 /home/thinktre/driver_app/app
chmod 755 /home/thinktre/driver_app/uploads
chmod 644 /home/thinktre/driver_app/passenger_wsgi.py
```

### 4. Start Application

```bash
mkdir -p /home/thinktre/driver_app/tmp
touch /home/thinktre/driver_app/tmp/restart.txt
```

---

## 🗄️ MongoDB Setup (Required)

Since most cPanel hosting doesn't include MongoDB, use **MongoDB Atlas** (free):

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Create database user
4. Whitelist all IPs: `0.0.0.0/0`
5. Get connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```
6. Update `.env` file with this connection string

---

## 🧪 Testing Your Application

### Via cURL

```bash
# Test health endpoint
curl https://yourdomain.com/health

# Test root endpoint
curl https://yourdomain.com/

# Test API
curl https://yourdomain.com/api/v1/
```

### View Logs

```bash
# Application errors
tail -f /home/thinktre/driver_app/tmp/error.log

# Access logs
tail -f /home/thinktre/logs/access_log
```

---

## 🔄 Restart Application

After any changes:

```bash
touch /home/thinktre/driver_app/tmp/restart.txt
```

Or click **"Restart"** in cPanel Python App interface.

---

## 📝 Quick Commands Reference

```bash
# Navigate to app
cd /home/thinktre/driver_app

# Activate virtual environment
source /home/thinktre/virtualenv/driver_app/3.11/bin/activate

# Install dependencies
pip install -r requirements.txt

# Check installed packages
pip list

# View logs
tail -f tmp/error.log

# Restart app
touch tmp/restart.txt
```

---

## ⚠️ Common Issues

### 1. ImportError or ModuleNotFoundError

```bash
cd /home/thinktre/driver_app
source /home/thinktre/virtualenv/driver_app/3.11/bin/activate
pip install -r requirements.txt --force-reinstall
touch tmp/restart.txt
```

### 2. MongoDB Connection Error

- Verify MongoDB Atlas connection string in `.env`
- Check if IP is whitelisted in MongoDB Atlas
- Test connection string separately

### 3. 500 Internal Server Error

- Check `.env` file exists
- Check file permissions (755 for folders, 644 for files)
- View error logs: `tail -f tmp/error.log`

### 4. Python Version Mismatch

Your app uses **Python 3.14** locally but needs **3.11** on cPanel.

- Should work fine (backward compatible)
- If issues, test locally with Python 3.11

---

## ✅ Final Checklist

- [ ] Upload `app/` folder to `/home/thinktre/driver_app/`
- [ ] Upload `passenger_wsgi.py` (already configured)
- [ ] Upload `requirements.txt`
- [ ] Create `.env` file with production settings
- [ ] Setup MongoDB Atlas
- [ ] Create Python App in cPanel
- [ ] Install dependencies via pip
- [ ] Set file permissions
- [ ] Restart application
- [ ] Test endpoints
- [ ] Check logs for errors

---

## 🎯 Your Application URLs

After deployment:

- **API Root**: `https://yourdomain.com/`
- **Health Check**: `https://yourdomain.com/health`
- **API Endpoints**: `https://yourdomain.com/api/v1/...`

---

## 🚀 Deployment Without SSH

Since SSH is not available on your server, use the **File Manager Deployment Method**:

📖 **See**: `CPANEL_FILE_MANAGER_DEPLOYMENT.md` - Complete step-by-step guide  
⚡ **Quick Start**: `DEPLOYMENT_QUICK_START.md` - 5-minute setup overview

**Deployment Package Ready**: `backend/driver_app_deploy.zip` (57 MB)

---

**Ready to deploy!** 🚀

All paths are configured for your cPanel account: **thinktre**
