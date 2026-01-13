# MongoDB Atlas Setup Guide
## Free Cloud Database for Driver App

Since your cPanel hosting doesn't include MongoDB, you'll use MongoDB Atlas (cloud MongoDB). It's **completely free** for small applications!

---

## 🌟 Why MongoDB Atlas?

- ✅ **Free forever** (M0 cluster - 512MB storage)
- ✅ No credit card required for free tier
- ✅ Automatic backups
- ✅ High availability and security
- ✅ Works perfectly with cPanel hosting
- ✅ Easy to scale later if needed

---

## 📋 Step-by-Step Setup (5-10 Minutes)

### Step 1: Create Account

1. Go to: **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"** or **"Sign Up"**
3. Choose signup method:
   - Email + password
   - Or use Google account
4. Complete registration

### Step 2: Create Your First Cluster

1. After login, you'll see **"Create a Cluster"** or **"Build a Database"**
2. Click it
3. Choose **"Shared"** (Free option)
4. Select cloud provider:
   - **AWS**, **Google Cloud**, or **Azure** (any is fine)
5. Choose region:
   - Pick one closest to India (e.g., Mumbai/Singapore)
   - This reduces latency
6. Cluster Name: Leave as `Cluster0` or name it `driver-app-cluster`
7. Click **"Create Cluster"**
8. Wait 3-5 minutes for cluster creation

### Step 3: Create Database User

1. On the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose authentication method: **"Password"**
4. Set username: `driver_app_user` (or any name you prefer)
5. Click **"Autogenerate Secure Password"** or create your own
   - **⚠️ IMPORTANT**: Copy and save this password! You'll need it later
6. Database User Privileges: Choose **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Allow Network Access

1. On the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Choose one of these options:

   **Option A: Allow From Anywhere (Easiest)**
   - Click **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0` (this allows any IP)
   - Description: "cPanel Server Access"
   - Click **"Confirm"**
   
   **Option B: Specific IP (More Secure)**
   - If you know your cPanel server IP: `156.238.98.83`
   - Enter it manually
   - Click **"Confirm"**

4. Wait 1-2 minutes for changes to activate

### Step 5: Get Connection String

1. Click **"Database"** in left sidebar (or "Clusters")
2. Find your cluster (Cluster0)
3. Click **"Connect"** button
4. Choose **"Connect your application"**
5. Driver: **"Python"**
6. Version: **"3.12 or later"** (or latest available)
7. You'll see a connection string like:

```
mongodb+srv://driver_app_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

8. **Copy this string**
9. Replace `<password>` with the actual password you created in Step 3

**Example:**
```
# Before (what you copied):
mongodb+srv://driver_app_user:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority

# After (with your actual password):
mongodb+srv://driver_app_user:MySecurePass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

### Step 6: Update Your .env File

1. Log into cPanel File Manager
2. Navigate to `/home/thinktre/driver_app/`
3. Edit `.env` file
4. Update these lines:

```bash
MONGODB_URL=mongodb+srv://driver_app_user:YourPasswordHere@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=driver_app
```

5. Save the file

---

## ✅ Verify Connection

### Method 1: Test in cPanel Terminal

If you have terminal access:

```bash
cd /home/thinktre/driver_app
source /home/thinktre/virtualenv/driver_app/3.11/bin/activate
python -c "from pymongo import MongoClient; import os; from dotenv import load_dotenv; load_dotenv(); client = MongoClient(os.getenv('MONGODB_URL')); print('✅ Connected:', client.server_info()['version'])"
```

### Method 2: Test Health Endpoint

1. Restart your application
2. Open browser: `https://thinktreesystems.in/health`
3. Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Method 3: Check Application Logs

Check `/home/thinktre/driver_app/tmp/error.log` for connection errors

---

## 🗄️ View Your Data

### Using MongoDB Atlas UI

1. Go to MongoDB Atlas dashboard
2. Click **"Browse Collections"** on your cluster
3. You'll see your databases and collections:
   - `driver_app` database
   - Collections: `users`, `drivers`, `vehicles`, `trips`, etc.
4. Click any collection to view documents

### Using MongoDB Compass (Desktop App)

1. Download: https://www.mongodb.com/products/compass
2. Install on your Mac
3. Connect using the same connection string
4. Browse and query data visually

---

## 📊 Monitor Usage

### Check Free Tier Limits

1. Go to Atlas dashboard
2. Click your cluster
3. View **"Metrics"** tab
4. Monitor:
   - **Storage**: Up to 512 MB (free)
   - **Data Transfer**: Unlimited
   - **Connections**: Up to 500 concurrent

### Upgrade If Needed (Later)

If you exceed free tier:
- **M2**: $9/month (2GB storage)
- **M5**: $25/month (5GB storage)
- But free tier should be enough to start!

---

## 🔐 Security Best Practices

### 1. Strong Password
```bash
# Good password examples:
MyApp#2024!SecureDB
Tr@nsP0rt_DB_2024
```

### 2. Rotate Credentials
- Change database password every 3-6 months
- Update `.env` file after password change

### 3. Limit IP Access
- If possible, use specific IP instead of 0.0.0.0/0
- Add only your server IP: `156.238.98.83`

### 4. Enable Alerts
1. Go to **"Alerts"** in Atlas
2. Set up email notifications for:
   - High connection count
   - Storage usage > 80%
   - Failed authentication attempts

---

## 🔧 Troubleshooting

### Error: "Authentication Failed"

**Cause**: Wrong username or password  
**Solution**:
1. Go to **"Database Access"** in Atlas
2. Reset user password
3. Update `.env` file with new password
4. Restart application

### Error: "Connection Timeout"

**Cause**: IP not whitelisted or network issue  
**Solution**:
1. Check **"Network Access"** in Atlas
2. Ensure `0.0.0.0/0` is added or your server IP
3. Wait 1-2 minutes for changes to propagate
4. Test connection again

### Error: "Too Many Connections"

**Cause**: Free tier limit (500 concurrent)  
**Solution**:
1. Close unused connections in your code
2. Implement connection pooling (already done in your app)
3. Monitor connections in Atlas dashboard

### Can't See Database or Collections

**Cause**: Database not created yet (normal!)  
**Solution**:
- MongoDB creates database on first write operation
- Seed your database:
  ```bash
  python -m app.db.seed_roles
  python -m app.db.seed_statuses
  ```
- Collections appear after first document insert

---

## 📚 Additional Resources

- **Atlas Documentation**: https://docs.atlas.mongodb.com/
- **MongoDB University** (Free courses): https://university.mongodb.com/
- **Connection String Format**: https://docs.mongodb.com/manual/reference/connection-string/
- **Python Driver (Motor)**: https://motor.readthedocs.io/

---

## 💡 Pro Tips

### Tip 1: Connection String Special Characters
If your password contains special characters (`@`, `:`, `/`, `?`), URL-encode them:
```
@ = %40
: = %3A
/ = %2F
? = %3F
```

### Tip 2: Enable Backups
Free tier includes basic backups automatically, but you can:
1. Export data periodically
2. Use `mongodump` for local backups

### Tip 3: Performance Indexes
Your app already creates indexes, but monitor:
1. Go to **"Performance Advisor"** in Atlas
2. Follow recommendations for slow queries

---

## ✅ Setup Complete!

Your MongoDB Atlas is now configured for:
- **Username**: driver_app_user (or what you chose)
- **Database**: driver_app
- **Connection**: Ready for cPanel deployment

**Next Step**: Use the connection string in your `.env` file during cPanel deployment!

---

**Questions?** Check MongoDB Atlas documentation or their excellent support forum!

