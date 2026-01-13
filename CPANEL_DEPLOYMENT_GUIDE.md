/home/thinktre# cPanel Deployment Guide for Driver App

## Application Structure on cPanel

```
/home/username/driver_app/          # Application Root
├── app/                             # Your FastAPI application
│   ├── __init__.py
│   ├── main.py                      # FastAPI app instance
│   ├── api/
│   ├── core/
│   ├── db/
│   └── models/
├── uploads/                         # Upload directory (create with 755 permissions)
├── requirements.txt                 # Python dependencies
├── passenger_wsgi.py               # Entry point for cPanel (IMPORTANT!)
├── tmp/                            # For Passenger restart (auto-created)
└── .env                            # Environment variables

/home/username/public_html/         # Web-accessible directory
└── (frontend build files - optional)
```

## Step 1: Create passenger_wsgi.py

Create this file in your application root. This is the **entry point** for cPanel's Python application:

```python
import sys
import os

# Add your application directory to the path
INTERP = "/home/username/virtualenv/driver_app/3.11/bin/python"
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.insert(0, os.path.dirname(__file__))

# Import FastAPI app
from app.main import app as application

# cPanel uses 'application' as the WSGI/ASGI callable
# Note: You may need an ASGI-to-WSGI adapter
```

## Step 2: Install ASGI-to-WSGI Adapter

Since cPanel typically uses Passenger which expects WSGI, you need to adapt FastAPI (ASGI) to WSGI:

**Update requirements.txt** to include:

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
motor>=3.6.0
pymongo>=4.10.0
pydantic>=2.10.0
pydantic-settings>=2.6.0
python-jose[cryptography]>=3.3.0
bcrypt>=4.0.0
python-multipart>=0.0.18
python-dotenv>=1.0.0
email-validator>=2.2.0
pillow>=11.0.0
aiofiles>=24.1.0
asgiref>=3.7.2
```

**Updated passenger_wsgi.py with ASGI adapter:**

```python
import sys
import os

# Path to your Python interpreter in the virtual environment
INTERP = "/home/username/virtualenv/driver_app/3.11/bin/python"
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add application directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import the ASGI to WSGI adapter
from asgiref.wsgi import WsgiToAsgi

# Import your FastAPI application
from app.main import app

# Convert ASGI app to WSGI
application = WsgiToAsgi(app)
```

## Step 3: Files to Upload

Upload these files/folders to `/home/username/driver_app/`:

### Essential Backend Files:

- ✅ `app/` directory (entire folder with all Python files)
- ✅ `requirements.txt`
- ✅ `passenger_wsgi.py` (create this - see above)
- ✅ `.env` file (with production settings)
- ✅ `uploads/` directory (empty, will be populated)

### DO NOT Upload:

- ❌ `venv/` or `__pycache__/` directories
- ❌ `backend.log` or other logs
- ❌ `.pyc` files
- ❌ Local database files

## Step 4: cPanel Setup Steps

### 4.1 Create Python Application in cPanel

1. Log into cPanel
2. Go to **"Setup Python App"**
3. Click **"Create Application"**
4. Configure:
   - **Python version**: 3.11 (or latest available)
   - **Application root**: `/home/username/driver_app`
   - **Application URL**: `yourdomain.com` or `yourdomain.com/api`
   - **Application startup file**: `passenger_wsgi.py`
   - **Application Entry point**: `application`

### 4.2 Set Environment Variables

In the Python App interface, add these variables:

```bash
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=driver_app
SECRET_KEY=your-very-secure-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,capacitor://localhost
APP_NAME=Driver App API
```

### 4.3 Install Dependencies

In cPanel terminal or SSH:

```bash
cd ~/driver_app
source ~/virtualenv/driver_app/3.11/bin/activate
pip install -r requirements.txt
```

### 4.4 Set Directory Permissions

```bash
chmod 755 ~/driver_app
chmod 755 ~/driver_app/uploads
chmod 755 ~/driver_app/app
chmod 644 ~/driver_app/passenger_wsgi.py
```

### 4.5 Restart Application

```bash
mkdir -p ~/driver_app/tmp
touch ~/driver_app/tmp/restart.txt
```

Or click **"Restart"** in the Python App interface.

## Step 5: MongoDB Setup

### Option A: MongoDB on Same Server (if available)

- Contact hosting provider to install MongoDB
- Or use MongoDB Atlas (cloud)

### Option B: MongoDB Atlas (Recommended)

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `.env`:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   DATABASE_NAME=driver_app
   ```

## Step 6: Frontend Deployment

Upload frontend build to `public_html`:

```bash
# Build frontend locally
cd frontend
npm run build

# Upload dist/* to /home/username/public_html/
```

## Step 7: .htaccess Configuration

Create `/home/username/public_html/.htaccess`:

```apache
# API Proxy to Python App
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Proxy API requests to Python app
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^(.*)$ https://yourdomain.com:8000/$1 [P,L]

    # Frontend routing (React Router)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## Troubleshooting

### View Logs

```bash
tail -f ~/driver_app/tmp/error.log
tail -f ~/logs/access_log
```

### Restart Application

```bash
touch ~/driver_app/tmp/restart.txt
```

### Check Python Version

```bash
source ~/virtualenv/driver_app/3.11/bin/activate
python --version
```

### Test Application

```bash
curl http://yourdomain.com/health
curl http://yourdomain.com/api/v1/
```

## Important Notes

1. **ASGI Support**: Most cPanel hosts use Passenger which is WSGI-based. The `asgiref.wsgi.WsgiToAsgi` adapter converts FastAPI (ASGI) to WSGI.

2. **Async Limitations**: Some async features may not work optimally with WSGI adapter. Consider:

   - Using a VPS with native ASGI support (Uvicorn)
   - Asking hosting provider about ASGI support

3. **MongoDB**: cPanel shared hosting rarely includes MongoDB. Use MongoDB Atlas (free tier available).

4. **File Uploads**: Ensure `uploads/` directory has write permissions (755 or 775).

5. **Security**:
   - Change `DEBUG=false` in production
   - Use strong `SECRET_KEY`
   - Limit `ALLOWED_ORIGINS` to your domains only

## Alternative: Deploy Backend Separately

Consider deploying backend on:

- **Railway.app** (free tier, native ASGI support)
- **Render.com** (free tier, supports FastAPI)
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**

Then deploy only the frontend on cPanel.
