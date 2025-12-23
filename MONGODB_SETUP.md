# MongoDB Atlas Configuration

## Your MongoDB Connection Details

**MongoDB Atlas URI:**
```
mongodb+srv://thinktreesystemsllp_db_user:hAbdFYj9G8NxUpze@pr-driver-app.0wvhuk1.mongodb.net/?appName=pr-driver-app
```

**Database Name:** `driver_app`

## How to Configure

### Method 1: Update backend/.env file

Edit the file `backend/.env` and update the MongoDB URL:

```bash
# MongoDB Configuration
MONGODB_URL=mongodb+srv://thinktreesystemsllp_db_user:hAbdFYj9G8NxUpze@pr-driver-app.0wvhuk1.mongodb.net/?appName=pr-driver-app
DATABASE_NAME=driver_app

# JWT Configuration - CHANGE THIS IN PRODUCTION!
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Application Configuration
APP_NAME=Driver App API
DEBUG=True
```

### Method 2: Using Terminal

```bash
cd backend

# Create/update .env file
cat > .env << 'EOF'
# MongoDB Configuration
MONGODB_URL=mongodb+srv://thinktreesystemsllp_db_user:hAbdFYj9G8NxUpze@pr-driver-app.0wvhuk1.mongodb.net/?appName=pr-driver-app
DATABASE_NAME=driver_app

# JWT Configuration - CHANGE THIS IN PRODUCTION!
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Application Configuration
APP_NAME=Driver App API
DEBUG=True
EOF
```

### Method 3: Update docker-compose.yml

If using Docker, also update the `docker-compose.yml` file:

Find the `backend` service and update the environment section:

```yaml
backend:
  environment:
    - MONGODB_URL=mongodb+srv://thinktreesystemsllp_db_user:hAbdFYj9G8NxUpze@pr-driver-app.0wvhuk1.mongodb.net/?appName=pr-driver-app
    - DATABASE_NAME=driver_app
```

And you can comment out or remove the local MongoDB service since you're using Atlas:

```yaml
# mongodb:  # Comment out this entire section
#   image: mongo:7.0
#   ...
```

## Quick Setup Command

Run this command from the project root:

```bash
# Update backend .env
cat > backend/.env << 'EOF'
MONGODB_URL=mongodb+srv://thinktreesystemsllp_db_user:hAbdFYj9G8NxUpze@pr-driver-app.0wvhuk1.mongodb.net/?appName=pr-driver-app
DATABASE_NAME=driver_app
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
APP_NAME=Driver App API
DEBUG=True
EOF

echo "✅ MongoDB Atlas configuration updated!"
```

## Verify Connection

After updating, start the backend:

```bash
cd backend
source venv/bin/activate  # If using virtual environment
python run.py
```

You should see:
```
Connected to MongoDB
```

## Notes

- ✅ No need to run local MongoDB
- ✅ Data will be stored in MongoDB Atlas cloud
- ✅ Your database cluster: `pr-driver-app.0wvhuk1.mongodb.net`
- ✅ Username: `thinktreesystemsllp_db_user`
- ⚠️ Password is embedded in the URI (keep it secure!)

## Security Note

Since the password is in the connection string, make sure:
1. Never commit `.env` files to git (already in `.gitignore`)
2. Keep your MongoDB Atlas IP whitelist configured
3. Consider using environment variables in production

## Troubleshooting

If connection fails:
1. Check MongoDB Atlas IP whitelist (allow your IP)
2. Verify the password is correct
3. Check network connectivity
4. Look for connection errors in terminal


