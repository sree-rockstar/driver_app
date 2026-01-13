# 🚀 Driver App - Quick Deployment Guide
## cPanel File Manager Method

---

## ⚡ Quick Info

- **cPanel URL**: https://thinktreesystems.in:2083
- **Username**: thinktre
- **Deployment Package**: `/Users/sree/Documents/Documents - Sreekanth's MacBook Pro/DriverApp/driver_app/backend/driver_app_deploy.zip` (57 MB)
- **Target Directory**: `/home/thinktre/driver_app/`
- **Domain**: thinktreesystems.in

---

## 📋 Quick Steps (5 Minutes Setup)

### 1. Upload Files (2 min)
```
cPanel → File Manager → /home/thinktre/ 
→ Create folder: driver_app
→ Upload: driver_app_deploy.zip
→ Extract archive
→ Delete zip file (optional)
```

### 2. Create .env File (1 min)
```
Create file: /home/thinktre/driver_app/.env
Copy content from deployment guide
Update MongoDB URL from MongoDB Atlas
Generate SECRET_KEY (32+ random characters)
```

### 3. Setup Python App (1 min)
```
cPanel → Setup Python App → Create Application

Settings:
- Python Version: 3.11
- App Root: /home/thinktre/driver_app
- Startup File: passenger_wsgi.py
- Entry Point: application
- URL: thinktreesystems.in
```

### 4. Install Dependencies (5-10 min auto)
```
In Python App interface:
→ Run pip install requirements.txt
OR
→ Use Terminal (if available)
```

### 5. Start App
```
Python App → Restart button
OR
Create file: /home/thinktre/driver_app/tmp/restart.txt
```

### 6. Test
```
Browser: https://thinktreesystems.in/health
Expected: {"status": "healthy", "database": "connected"}
```

---

## 🔑 Critical Configuration

### MongoDB Atlas (Required - It's Free!)

1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create cluster (M0 - Free forever)
4. Create database user
5. Network Access → Allow 0.0.0.0/0
6. Get connection string
7. Update `.env` file

**Example .env File:**
```bash
MONGODB_URL=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/
DATABASE_NAME=driver_app
SECRET_KEY=Generate-A-Random-32-Character-String-Here-XyZ123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=https://thinktreesystems.in,https://www.thinktreesystems.in
APP_NAME=Driver App API
DEBUG=false
```

---

## 🔧 Essential File Permissions

```bash
755 - /home/thinktre/driver_app/
755 - /home/thinktre/driver_app/app/
755 - /home/thinktre/driver_app/uploads/
644 - /home/thinktre/driver_app/passenger_wsgi.py
644 - /home/thinktre/driver_app/.env
```

Set in File Manager: Select folder/file → Permissions → 755 or 644

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login to cPanel | Contact hosting provider for password reset |
| Upload fails | Check available disk space in cPanel |
| 500 Error | Check logs: `/home/thinktre/driver_app/tmp/error.log` |
| Module not found | Reinstall: `pip install -r requirements.txt --force-reinstall` |
| MongoDB connection failed | Check `.env` MongoDB URL and Atlas IP whitelist |
| App won't restart | Delete and recreate: `tmp/restart.txt` |

---

## 📞 Support Resources

1. **Full Guide**: See `CPANEL_FILE_MANAGER_DEPLOYMENT.md`
2. **cPanel Docs**: https://docs.cpanel.net/
3. **MongoDB Atlas**: https://docs.atlas.mongodb.com/
4. **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## ✅ Post-Deployment Checklist

- [ ] Health endpoint responds: `/health`
- [ ] API docs accessible: `/docs` (if DEBUG=true)
- [ ] Login works: POST `/api/v1/auth/login`
- [ ] File upload works: POST `/api/v1/files/upload`
- [ ] Database seeded (roles, statuses, trip config)
- [ ] Indexes created (files, trips, vehicles)

---

## 🎯 Test Credentials (After DB Seed)

Create admin user by running:
```bash
cd /home/thinktre/driver_app
source /home/thinktre/virtualenv/driver_app/3.11/bin/activate
python ../add_admin_sreekanth.py
```

Or create via API: POST `/api/v1/auth/register`

---

## 🌟 Your URLs

- **API**: https://thinktreesystems.in/
- **Health**: https://thinktreesystems.in/health
- **Auth**: https://thinktreesystems.in/api/v1/auth/login
- **Vehicles**: https://thinktreesystems.in/api/v1/vehicles/
- **Trips**: https://thinktreesystems.in/api/v1/trips/

---

**Ready to deploy? Follow the detailed guide in `CPANEL_FILE_MANAGER_DEPLOYMENT.md`**

**Package size**: 57 MB  
**Estimated upload time**: 2-5 minutes (depending on connection)  
**Estimated total deployment time**: 15-20 minutes

