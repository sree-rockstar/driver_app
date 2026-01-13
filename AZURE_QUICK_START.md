# Azure Deployment - Quick Start

Get your Driver App backend deployed to Azure in minutes!

## 🚀 Fastest Way (5 minutes)

### Prerequisites
- Azure account ([Sign up free](https://azure.microsoft.com/free/))
- MongoDB Atlas database ([Create free cluster](https://www.mongodb.com/cloud/atlas))

### Step-by-Step

1. **Install Azure CLI** (if not installed):
```bash
# macOS
brew install azure-cli

# Windows
# Download from: https://aka.ms/installazurecliwindows

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

2. **Make deployment script executable**:
```bash
chmod +x deploy-azure.sh
```

3. **Run the deployment script**:
```bash
./deploy-azure.sh
```

The script will:
- ✓ Login to Azure
- ✓ Create all necessary resources
- ✓ Configure your app
- ✓ Deploy your code
- ✓ Set up logging

4. **That's it!** Your API will be live at:
```
https://your-app-name.azurewebsites.net
```

---

## 📋 Manual Deployment (Azure Portal)

If you prefer using the web interface:

### 1. Create MongoDB Atlas Database
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create free M0 cluster
- Create database user
- Get connection string

### 2. Create Azure Web App
- Go to [Azure Portal](https://portal.azure.com)
- Click "Create a resource" → "Web App"
- Fill in:
  - **Name**: `driver-app-backend` (must be unique)
  - **Runtime**: Python 3.11
  - **Region**: Choose nearest
  - **Plan**: B1 Basic (or F1 Free for testing)
- Click "Create"

### 3. Configure Settings
In your Web App:
- Go to **Configuration** → **Application settings**
- Add these settings:

```
MONGODB_URL = mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME = driver_app
SECRET_KEY = [generate with: openssl rand -hex 32]
ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30
ALLOWED_ORIGINS = https://your-frontend.com
APP_NAME = Driver App API
DEBUG = False
SCM_DO_BUILD_DURING_DEPLOYMENT = true
ENABLE_ORYX_BUILD = true
```

- Go to **Configuration** → **General settings**
- Set **Startup Command**:
```
gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 --worker-class uvicorn.workers.UvicornWorker app.main:app
```

### 4. Deploy Code

**Option A: GitHub** (Recommended)
- Go to **Deployment Center**
- Select **GitHub**
- Authorize and select your repo
- Save

**Option B: ZIP Deploy**
```bash
cd backend
zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
az webapp deployment source config-zip \
  --resource-group your-rg \
  --name your-app-name \
  --src deploy.zip
```

### 5. Test
Visit: `https://your-app-name.azurewebsites.net/health`

---

## 🔧 Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URL` | Yes | `mongodb+srv://...` |
| `DATABASE_NAME` | Yes | `driver_app` |
| `SECRET_KEY` | Yes | Generate with `openssl rand -hex 32` |
| `ALGORITHM` | Yes | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | `30` |
| `ALLOWED_ORIGINS` | Yes | `https://example.com` |
| `APP_NAME` | No | `Driver App API` |
| `DEBUG` | No | `False` (production) |

---

## 🐛 Troubleshooting

### App won't start
```bash
# View logs
az webapp log tail --resource-group your-rg --name your-app-name
```

Common issues:
- ✗ Missing environment variables → Check Configuration
- ✗ Wrong startup command → Check General settings
- ✗ Database connection → Check MongoDB URL and IP whitelist

### Can't connect to MongoDB
1. Go to MongoDB Atlas
2. Network Access → Add IP: `0.0.0.0/0` (allow all)
3. Or add Azure Web App outbound IPs

### 502 Bad Gateway
- App is timing out during startup
- Usually database connection issue
- Check logs for details

---

## 💰 Pricing

| Tier | Cost/Month | Best For |
|------|------------|----------|
| F1 (Free) | $0 | Testing (limited CPU) |
| B1 (Basic) | ~$13 | Development |
| B2 (Basic) | ~$26 | Small production |
| S1 (Standard) | ~$70 | Production |
| P1V2 (Premium) | ~$100 | High traffic |

**Free Tier Includes:**
- 60 CPU minutes/day
- 1 GB disk space
- Custom domain support
- Free SSL certificate

---

## 📊 Monitoring

### View Real-time Logs
```bash
az webapp log tail --resource-group driver-app-rg --name driver-app-backend
```

### Enable Application Insights
1. Go to your Web App
2. **Application Insights** → **Turn on**
3. Monitor requests, performance, failures

### Set Up Alerts
- High CPU usage
- Too many errors
- Slow response times

---

## 🔐 Security Checklist

- ✓ Generate strong `SECRET_KEY` (32+ characters)
- ✓ Set `DEBUG=False` in production
- ✓ Whitelist specific CORS origins (not `*`)
- ✓ Use HTTPS only (enabled by default)
- ✓ Keep MongoDB credentials secure
- ✓ Regularly update dependencies
- ✓ Enable Application Insights
- ✓ Set up automated backups

---

## 📱 Update Frontend

After deployment, update your frontend API URL:

```typescript
// frontend/src/lib/api.ts
const API_BASE_URL = 'https://driver-app-backend.azurewebsites.net/api/v1';
```

Or use environment variable:

```bash
# frontend/.env
VITE_API_URL=https://driver-app-backend.azurewebsites.net/api/v1
```

---

## 🔄 CI/CD Setup

Auto-deploy on every push to main:

1. Copy `.github/workflows/azure-deploy.yml` (already created)
2. Get publish profile from Azure Portal:
   - Your Web App → **Get publish profile**
3. Add to GitHub secrets:
   - Settings → Secrets → New secret
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: Paste publish profile content
4. Push to main branch → Auto-deploy! 🎉

---

## 📚 Useful Commands

```bash
# Login
az login

# List all web apps
az webapp list --output table

# Restart app
az webapp restart --resource-group driver-app-rg --name driver-app-backend

# View logs
az webapp log tail --resource-group driver-app-rg --name driver-app-backend

# SSH into container
az webapp ssh --resource-group driver-app-rg --name driver-app-backend

# Stop app (saves money)
az webapp stop --resource-group driver-app-rg --name driver-app-backend

# Start app
az webapp start --resource-group driver-app-rg --name driver-app-backend

# Delete app (cleanup)
az webapp delete --resource-group driver-app-rg --name driver-app-backend

# Delete resource group (cleanup everything)
az group delete --name driver-app-rg
```

---

## 🆘 Get Help

- **Full Guide**: See `AZURE_DEPLOYMENT_GUIDE.md`
- **Azure Docs**: [docs.microsoft.com/azure/app-service](https://docs.microsoft.com/azure/app-service/)
- **FastAPI Docs**: [fastapi.tiangolo.com/deployment](https://fastapi.tiangolo.com/deployment/)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com/)

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Azure account set up
- [ ] Azure CLI installed
- [ ] Run `./deploy-azure.sh` or deploy via portal
- [ ] All environment variables configured
- [ ] Startup command set
- [ ] Test health endpoint
- [ ] Update frontend API URL
- [ ] Enable Application Insights
- [ ] Set up CI/CD (optional)
- [ ] Configure custom domain (optional)
- [ ] Set up alerts and monitoring

---

## 🎉 Next Steps

1. ✓ Deploy backend to Azure
2. Test all API endpoints
3. Deploy frontend (Azure Static Web Apps, Vercel, or Netlify)
4. Set up custom domain
5. Enable monitoring and alerts
6. Configure backups
7. Go live! 🚀

**Need help?** Check the full deployment guide or Azure documentation.
