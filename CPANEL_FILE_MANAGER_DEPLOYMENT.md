# cPanel File Manager Deployment Guide
## Deploy Driver App Without SSH

Since SSH is not available, this guide will walk you through deploying your Driver App using cPanel's File Manager interface.

---

## 📦 Files Prepared for Deployment

✅ **Deployment Package Created**: `backend/driver_app_deploy.zip`

This archive contains:
- `app/` - Your FastAPI application
- `passenger_wsgi.py` - Entry point (configured for user: **thinktre**)
- `requirements.txt` - Python dependencies
- `uploads/` - Upload directories with existing files
- Database index creation scripts

**Package Location**: `/Users/sree/Documents/Documents - Sreekanth's MacBook Pro/DriverApp/driver_app/backend/driver_app_deploy.zip`

---

## 🌐 Step 1: Log into cPanel

1. Open your browser and go to: **https://thinktreesystems.in:2083**
2. Login with:
   - **Username**: `thinktre`
   - **Password**: (your cPanel password)

---

## 📁 Step 2: Upload Files Using File Manager

### 2.1 Navigate to File Manager

1. In cPanel home, find and click **"File Manager"**
2. You'll see your directory structure, including:
   - `public_html/` (for frontend)
   - Your home directory

### 2.2 Create Application Directory

1. Navigate to your home directory: `/home/thinktre/`
2. Click **"+ Folder"** button (or "Create" → "Folder")
3. Name it: `driver_app`
4. Click **"Create New Folder"**

### 2.3 Upload the Deployment Archive

1. Open the `driver_app` folder you just created
2. Click **"Upload"** button in the toolbar
3. Click **"Select File"** or drag and drop
4. Select: `/Users/sree/Documents/Documents - Sreekanth's MacBook Pro/DriverApp/driver_app/backend/driver_app_deploy.zip`
5. Wait for upload to complete (you'll see a progress bar)
6. Close the upload dialog

### 2.4 Extract the Archive

1. Find `driver_app_deploy.zip` in the file list
2. Right-click on it (or select it and click "Extract" in toolbar)
3. Click **"Extract"**
4. Choose extract location: `/home/thinktre/driver_app/`
5. Click **"Extract File(s)"**
6. Once extraction is complete, click **"Close"**
7. **Optional**: Delete `driver_app_deploy.zip` to save space

### 2.5 Verify Directory Structure

Your `/home/thinktre/driver_app/` should now contain:

```
driver_app/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   ├── core/
│   ├── db/
│   └── models/
├── uploads/
│   ├── aadhar/
│   ├── driving_licenses/
│   └── vehicles/
├── passenger_wsgi.py
└── requirements.txt
```

---

## 🔒 Step 3: Create .env Configuration File

### 3.1 Create .env File

1. In File Manager, navigate to `/home/thinktre/driver_app/`
2. Click **"+ File"** button (or "Create" → "File")
3. Name it: `.env`
4. Click **"Create New File"**

### 3.2 Edit .env File

1. Find `.env` in the file list
2. Right-click and select **"Edit"** (or select it and click "Edit" in toolbar)
3. If prompted about encoding, choose **"utf-8"** and click **"Edit"**
4. Paste the following configuration:

```bash
# MongoDB Configuration
# IMPORTANT: You'll need MongoDB Atlas (free) since most cPanel doesn't include MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=driver_app

# JWT Security Configuration
SECRET_KEY=your-very-secure-random-secret-key-at-least-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration - Add your domain
ALLOWED_ORIGINS=https://thinktreesystems.in,https://www.thinktreesystems.in,capacitor://localhost

# Application Settings
APP_NAME=Driver App API
DEBUG=false

# File Upload Settings (optional)
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=/home/thinktre/driver_app/uploads
```

5. Click **"Save Changes"** (top right)
6. Click **"Close"**

### 3.3 Update MongoDB URL (Important!)

You need MongoDB Atlas (it's free):

1. Go to: **https://www.mongodb.com/cloud/atlas**
2. Create a free account
3. Create a new cluster (choose free M0 tier)
4. Create a database user with username and password
5. Go to **Network Access** → **Add IP Address** → Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Get your connection string:
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)
7. Go back to File Manager, edit `.env` file
8. Replace `MONGODB_URL` with your actual connection string
9. Generate a secure `SECRET_KEY`:
   ```bash
   # Use a password generator or create a random 32+ character string
   # Example: Xk9mP2nQ7rT5vW8yA1bD4eF6gH8jK0lM
   ```

---

## 🐍 Step 4: Setup Python Application in cPanel

### 4.1 Open Setup Python App

1. Go back to cPanel home
2. Find and click **"Setup Python App"** (or "Python Selector" or "Python Application")
   - Look in Software section
   - Use search if needed

### 4.2 Create New Python Application

1. Click **"Create Application"** button
2. Fill in the form:

   **Python Version**: Select `3.11` or `3.9+` (highest available)
   
   **Application Root**: `/home/thinktre/driver_app`
   
   **Application URL**: 
   - Choose your domain: `thinktreesystems.in`
   - Leave path empty or use `/api` if you want
   
   **Application Startup File**: `passenger_wsgi.py`
   
   **Application Entry Point**: `application`
   
   **Passenger Log File**: (leave default or set to `logs/passenger.log`)

3. Click **"Create"** button

### 4.3 Note Your Virtual Environment Path

After creation, you'll see:
```
Virtual Environment Path: /home/thinktre/virtualenv/driver_app/3.11
```
**Important**: Make sure this matches the path in `passenger_wsgi.py` (line 16)

If the path is different, edit `passenger_wsgi.py` in File Manager to match.

---

## 📥 Step 5: Install Python Dependencies

### Option A: Using cPanel Terminal (If Available)

1. In cPanel, look for **"Terminal"** (might be in Advanced section)
2. If found, click to open terminal
3. Run these commands:

```bash
cd /home/thinktre/driver_app
source /home/thinktre/virtualenv/driver_app/3.11/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

4. Wait for installation to complete (may take 5-10 minutes)

### Option B: Using Python App Interface

1. Go back to **"Setup Python App"**
2. Find your application in the list
3. Click the application name or "Edit" button
4. You should see a section to **"Run Pip Install"** or **"Install Dependencies"**
5. Enter: `requirements.txt`
6. Click **"Run"** or **"Install"**

### Option C: Manual pip install (If above options don't work)

1. In cPanel Python App interface, find the **"Configuration Files"** section
2. Click **"Run Python Script"** or similar option
3. Paste this script:

```python
import subprocess
import sys

subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "/home/thinktre/driver_app/requirements.txt"])
```

4. Run it

---

## 🔧 Step 6: Set File Permissions

### 6.1 Using File Manager

1. Go to File Manager
2. Navigate to `/home/thinktre/`
3. Select `driver_app` folder
4. Click **"Permissions"** button (or right-click → "Change Permissions")
5. Set permissions to **755** (User: Read/Write/Execute, Group: Read/Execute, World: Read/Execute)
6. Check **"Recurse into subdirectories"**
7. Click **"Change Permissions"**

### 6.2 Set Upload Directory Permissions

1. Navigate to `/home/thinktre/driver_app/uploads/`
2. Select the `uploads` folder
3. Click **"Permissions"**
4. Set to **755** or **775** (to allow write access)
5. Apply recursively

---

## 🚀 Step 7: Start/Restart the Application

### Method 1: Using Python App Interface

1. Go to **"Setup Python App"**
2. Find your `driver_app` application
3. Click **"Restart"** button (circular arrow icon)
4. Wait for restart to complete

### Method 2: Using File Manager (Touch restart.txt)

1. In File Manager, navigate to `/home/thinktre/driver_app/`
2. Create folder `tmp` if it doesn't exist
3. Inside `tmp/` folder, create a file named `restart.txt`
4. Or if `restart.txt` exists, edit it and save (just add a space or new line)
5. This triggers Passenger to restart the app

---

## 🧪 Step 8: Test Your Deployment

### 8.1 Test Health Endpoint

Open your browser and visit:
- **https://thinktreesystems.in/health**

You should see:
```json
{"status": "healthy", "database": "connected"}
```

### 8.2 Test API Root

Visit:
- **https://thinktreesystems.in/**
- **https://thinktreesystems.in/api/v1/**

### 8.3 Check Application Status

1. Go to **"Setup Python App"** in cPanel
2. Your application should show status: **"Running"** (green indicator)
3. If it shows an error, click on it to see error details

---

## 📋 Step 9: Initialize Database (One-time Setup)

### 9.1 Seed Roles and Statuses

If cPanel Terminal is available:

```bash
cd /home/thinktre/driver_app
source /home/thinktre/virtualenv/driver_app/3.11/bin/activate
python -m app.db.seed_roles
python -m app.db.seed_statuses
python -m app.db.seed_trip_config
```

### 9.2 Create Indexes

```bash
python create_files_indexes.py
python create_trips_indexes.py
python create_vehicles_indexes.py
```

### 9.3 If Terminal Not Available

Create a temporary script in File Manager:

1. Create file: `/home/thinktre/driver_app/init_database.py`
2. Add content:

```python
#!/usr/bin/env python
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.db.seed_roles import seed_roles
from app.db.seed_statuses import seed_statuses
from app.db.seed_trip_config import seed_trip_config

async def init():
    print("Seeding roles...")
    await seed_roles()
    print("Seeding statuses...")
    await seed_statuses()
    print("Seeding trip config...")
    await seed_trip_config()
    print("✅ Database initialized!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(init())
```

3. Run it through Python App interface or cPanel's "Run Python Script" feature

---

## 🔍 Step 10: View Logs and Troubleshoot

### 10.1 View Application Logs

**Method 1: File Manager**
1. Navigate to `/home/thinktre/driver_app/tmp/`
2. Look for files like:
   - `error.log`
   - `passenger.log`
3. Right-click → **View** or **Edit** to read logs

**Method 2: cPanel Error Logs**
1. In cPanel, go to **"Errors"** or **"Error Log"**
2. Look for recent Python/Passenger errors

### 10.2 Common Issues and Fixes

#### Issue 1: ImportError or ModuleNotFoundError

**Solution**: Reinstall dependencies
1. Go to Python App interface
2. Run pip install again: `pip install -r requirements.txt --force-reinstall`
3. Restart application

#### Issue 2: MongoDB Connection Error

**Solution**: Check MongoDB Atlas
- Verify connection string in `.env`
- Ensure IP `0.0.0.0/0` is whitelisted in MongoDB Atlas
- Test connection string format

#### Issue 3: 500 Internal Server Error

**Solution**: Check logs
1. View error logs (see 10.1 above)
2. Common causes:
   - Missing `.env` file
   - Wrong file permissions
   - Python version mismatch
   - Missing dependencies

#### Issue 4: Application Won't Start

**Solution**:
1. Check `passenger_wsgi.py` has correct virtual environment path
2. Verify all files uploaded correctly
3. Check Python version compatibility
4. Restart application: `touch tmp/restart.txt`

---

## ✅ Deployment Checklist

Use this to track your progress:

- [ ] Log into cPanel (https://thinktreesystems.in:2083)
- [ ] Create `driver_app` folder in `/home/thinktre/`
- [ ] Upload `driver_app_deploy.zip`
- [ ] Extract archive
- [ ] Create `.env` file with configuration
- [ ] Setup MongoDB Atlas account
- [ ] Update `.env` with MongoDB connection string
- [ ] Generate and set SECRET_KEY in `.env`
- [ ] Create Python Application in cPanel
- [ ] Install dependencies (requirements.txt)
- [ ] Set file permissions (755 for folders, 644 for files)
- [ ] Set uploads folder to 755 or 775
- [ ] Restart application
- [ ] Test health endpoint: https://thinktreesystems.in/health
- [ ] Test API root: https://thinktreesystems.in/api/v1/
- [ ] Initialize database (seed roles, statuses, trip config)
- [ ] Create database indexes
- [ ] Check logs for any errors
- [ ] Test login functionality
- [ ] Verify file uploads work

---

## 🌐 Your Application URLs

After successful deployment:

- **API Base**: https://thinktreesystems.in/
- **Health Check**: https://thinktreesystems.in/health
- **API Endpoints**: https://thinktreesystems.in/api/v1/
- **Login**: https://thinktreesystems.in/api/v1/auth/login
- **Docs** (if enabled): https://thinktreesystems.in/docs

---

## 📞 Need Help?

If you encounter issues:

1. **Check Logs**: Always start by checking error logs
2. **cPanel Support**: Contact your hosting provider's support
3. **MongoDB Atlas**: Check their documentation for connection issues
4. **Python Version**: Ensure Python 3.9+ is being used

---

## 🎯 Next Steps After Deployment

1. **Frontend Deployment**: Upload your frontend build to `/home/thinktre/public_html/`
2. **Domain Configuration**: Point your domain to the application
3. **SSL Certificate**: Enable HTTPS (usually auto-configured in cPanel)
4. **Backup Strategy**: Setup regular backups of your database and files
5. **Monitoring**: Set up application monitoring and alerts

---

**🎉 You're all set!** Your Driver App backend is now deployed on cPanel!

**Deployed by**: thinktre  
**Application Path**: /home/thinktre/driver_app  
**Domain**: thinktreesystems.in

