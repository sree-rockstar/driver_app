# Azure Deployment - Complete Package

✅ **Your backend is now ready to deploy to Azure Web App!**

## 📦 What's Included

All necessary files and documentation have been created for a seamless Azure deployment:

### Deployment Files
1. **`backend/startup.txt`** - Azure startup command configuration
2. **`backend/requirements.txt`** - Updated with gunicorn for production
3. **`backend/env.template`** - Environment variables template
4. **`deploy-azure.sh`** - Automated deployment script (executable)
5. **`.github/workflows/azure-deploy.yml`** - CI/CD workflow for automated deployments

### Documentation
1. **`AZURE_QUICK_START.md`** - 5-minute quick start guide
2. **`AZURE_DEPLOYMENT_GUIDE.md`** - Comprehensive 500+ line deployment guide
3. **`AZURE_DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist
4. **`DEPLOYMENT_COMPARISON.md`** - Compare Azure vs other platforms
5. **`backend/DEPLOYMENT.md`** - Backend-specific deployment guide

## 🚀 Quick Start (Choose One Method)

### Method 1: Automated Script (Fastest - 5 minutes)

```bash
# Make script executable (if not already)
chmod +x deploy-azure.sh

# Run deployment
./deploy-azure.sh
```

The script will:
- Login to Azure
- Create all resources
- Configure settings
- Deploy your code
- Enable logging
- Generate secure keys

### Method 2: Azure Portal (GUI)

1. **Create MongoDB Atlas** → [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create Azure Web App** → [portal.azure.com](https://portal.azure.com)
3. **Configure Settings** → Add environment variables
4. **Deploy Code** → GitHub or ZIP deploy

See `AZURE_QUICK_START.md` for detailed steps.

### Method 3: Manual CLI

```bash
# Login
az login

# Create resources
az group create --name driver-app-rg --location eastus
az appservice plan create --name driver-app-plan --resource-group driver-app-rg --sku B1 --is-linux
az webapp create --resource-group driver-app-rg --plan driver-app-plan --name your-app-name --runtime "PYTHON:3.11"

# Configure
az webapp config set --resource-group driver-app-rg --name your-app-name \
  --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 --worker-class uvicorn.workers.UvicornWorker app.main:app"

# Add environment variables (see AZURE_DEPLOYMENT_GUIDE.md)

# Deploy
cd backend && zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
az webapp deployment source config-zip --resource-group driver-app-rg --name your-app-name --src deploy.zip
```

## 📋 Pre-Deployment Requirements

### 1. Azure Account
- Sign up at [portal.azure.com](https://portal.azure.com)
- Free tier includes $200 credit for 30 days

### 2. MongoDB Atlas
- Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create free M0 cluster
- Get connection string

### 3. Environment Variables

You'll need these values ready:

```bash
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=driver_app
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ALLOWED_ORIGINS=https://your-frontend.com
DEBUG=False
```

Generate SECRET_KEY:
```bash
openssl rand -hex 32
```

## 📚 Documentation Guide

### For First-Time Users
1. **Start here:** `AZURE_QUICK_START.md`
2. **If issues:** `AZURE_DEPLOYMENT_CHECKLIST.md`
3. **For details:** `AZURE_DEPLOYMENT_GUIDE.md`

### For Experienced Users
1. **Run:** `./deploy-azure.sh`
2. **Reference:** `backend/DEPLOYMENT.md`

### For Decision Making
1. **Compare platforms:** `DEPLOYMENT_COMPARISON.md`
2. **Understand options:** `AZURE_DEPLOYMENT_GUIDE.md` (Option A vs B)

## 🎯 Deployment Options Comparison

| Method | Time | Difficulty | Best For |
|--------|------|------------|----------|
| **Automated Script** | 5 min | Easy | Most users |
| **Azure Portal** | 15 min | Easy | GUI lovers |
| **Manual CLI** | 10 min | Medium | CLI experts |
| **GitHub Actions** | Auto | Easy | CI/CD |

## 💰 Cost Breakdown

### Free Tier (Testing)
- **Cost:** $0/month
- **Limits:** 60 CPU minutes/day
- **Best for:** Development and testing

### Basic B1 (Recommended)
- **Cost:** ~$13/month
- **Resources:** 1.75 GB RAM, 10 GB storage
- **Best for:** Small production apps

### Standard S1 (Scaling)
- **Cost:** ~$70/month
- **Features:** Auto-scaling, custom domains, SSL
- **Best for:** Production with traffic

### Premium P1V2 (High Performance)
- **Cost:** ~$100/month
- **Features:** Better performance, more resources
- **Best for:** High-traffic production

**Tip:** Start with Free tier for testing, upgrade to B1 for production.

## 🔧 Key Features Configured

### ✅ Production-Ready Setup
- Gunicorn WSGI server with Uvicorn workers
- 4 worker processes
- 600-second timeout for long operations
- Automatic builds on deployment

### ✅ Security
- HTTPS enabled by default
- Environment-based configuration
- Secret key generation
- CORS configuration
- Debug mode disabled in production

### ✅ Monitoring & Logging
- Application logging to filesystem
- Real-time log streaming
- Optional Application Insights
- Health check endpoints

### ✅ Database
- MongoDB Atlas integration
- Connection string configuration
- Async driver (Motor) for FastAPI

### ✅ File Storage
- Local uploads directory
- Optional Azure Blob Storage
- Persistent storage configuration

## 🔍 What Happens During Deployment

1. **Resource Creation** (2-3 min)
   - Resource group
   - App Service plan
   - Web App instance

2. **Configuration** (1 min)
   - Environment variables
   - Startup command
   - Logging settings

3. **Code Deployment** (2-5 min)
   - Upload code package
   - Install dependencies (via requirements.txt)
   - Start application

4. **Verification** (1 min)
   - Health check
   - Log review
   - Test endpoints

**Total Time:** ~10-15 minutes

## 🧪 Post-Deployment Testing

### 1. Basic Health Check
```bash
curl https://your-app-name.azurewebsites.net/health
# Expected: {"status": "healthy"}
```

### 2. API Documentation
Visit: `https://your-app-name.azurewebsites.net/api/v1/openapi.json`

### 3. Test Authentication
```bash
curl -X POST https://your-app-name.azurewebsites.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile_number": "1234567890", "mpin": "1234"}'
```

### 4. View Logs
```bash
az webapp log tail --resource-group driver-app-rg --name your-app-name
```

## 🔄 CI/CD Setup (Optional)

Automatic deployment on every push to main:

1. **GitHub Secrets Setup:**
   - Go to Azure Portal → Your Web App → Get publish profile
   - GitHub → Settings → Secrets → New secret
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: Paste publish profile content

2. **Workflow File:** (Already created)
   - `.github/workflows/azure-deploy.yml`

3. **Test:**
   - Push to main branch
   - Watch Actions tab in GitHub
   - Automatic deployment! 🎉

## 📊 Monitoring Your App

### Real-Time Logs
```bash
az webapp log tail --resource-group driver-app-rg --name your-app-name
```

### Application Insights (Recommended)
1. Go to your Web App in Azure Portal
2. Click "Application Insights" → "Turn on"
3. Monitor:
   - Request rates and response times
   - Failed requests
   - Server exceptions
   - Dependencies (MongoDB)

### Health Monitoring
Azure automatically monitors `/health` endpoint
- Unhealthy app → automatic restart
- Configurable in "Health check" settings

## 🚨 Troubleshooting

### App Not Starting?
```bash
# Check logs
az webapp log tail --resource-group driver-app-rg --name your-app-name

# Common issues:
# 1. Missing environment variables
# 2. Wrong startup command
# 3. Database connection failure
```

### Database Connection Issues?
1. Check MongoDB URL in configuration
2. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0)
3. Test connection string locally first

### CORS Errors?
1. Update ALLOWED_ORIGINS in configuration
2. Include your frontend domain
3. Restart the app

### 502 Bad Gateway?
- App is timing out
- Check database connection
- Verify startup command timeout (600s)

**See full troubleshooting:** `AZURE_DEPLOYMENT_GUIDE.md` → Troubleshooting section

## 📱 Frontend Integration

After backend deployment, update frontend:

```typescript
// frontend/src/lib/api.ts
const API_BASE_URL = 'https://your-app-name.azurewebsites.net/api/v1';
```

Or use environment variable:

```bash
# frontend/.env
VITE_API_URL=https://your-app-name.azurewebsites.net/api/v1
```

Then deploy frontend to:
- Azure Static Web Apps
- Vercel
- Netlify
- Azure App Service

## 🎓 Learning Resources

### Azure Documentation
- [Web App Docs](https://docs.microsoft.com/azure/app-service/)
- [Python on Azure](https://docs.microsoft.com/azure/app-service/quickstart-python)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)

### FastAPI Deployment
- [FastAPI Documentation](https://fastapi.tiangolo.com/deployment/)
- [Uvicorn Deployment](https://www.uvicorn.org/deployment/)

### MongoDB Atlas
- [Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)

## 🛠 Useful Commands Reference

```bash
# Login to Azure
az login

# List all web apps
az webapp list --output table

# View app details
az webapp show --resource-group driver-app-rg --name your-app-name

# Restart app
az webapp restart --resource-group driver-app-rg --name your-app-name

# Stop app (saves money on paid tiers)
az webapp stop --resource-group driver-app-rg --name your-app-name

# Start app
az webapp start --resource-group driver-app-rg --name your-app-name

# Stream logs
az webapp log tail --resource-group driver-app-rg --name your-app-name

# SSH into container
az webapp ssh --resource-group driver-app-rg --name your-app-name

# Update app setting
az webapp config appsettings set \
  --resource-group driver-app-rg \
  --name your-app-name \
  --settings KEY=VALUE

# Deploy new version
cd backend
zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
az webapp deployment source config-zip \
  --resource-group driver-app-rg \
  --name your-app-name \
  --src deploy.zip

# Delete app (cleanup)
az webapp delete --resource-group driver-app-rg --name your-app-name

# Delete everything
az group delete --name driver-app-rg
```

## ✅ Success Checklist

Your deployment is successful when:

- ✅ App is accessible at Azure URL
- ✅ `/health` endpoint returns 200 OK
- ✅ API documentation is accessible
- ✅ Authentication works
- ✅ Database operations work
- ✅ No errors in logs
- ✅ Response times < 2 seconds
- ✅ Frontend can connect to backend

## 📞 Support

### Documentation Files
- **Quick Start:** `AZURE_QUICK_START.md`
- **Full Guide:** `AZURE_DEPLOYMENT_GUIDE.md`
- **Checklist:** `AZURE_DEPLOYMENT_CHECKLIST.md`
- **Platform Comparison:** `DEPLOYMENT_COMPARISON.md`
- **Backend Guide:** `backend/DEPLOYMENT.md`

### External Resources
- [Azure Support](https://portal.azure.com) - Click "?" in portal
- [Azure Community](https://techcommunity.microsoft.com/t5/azure/ct-p/Azure)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-web-app-service)

## 🎉 Next Steps

1. **Deploy backend** using this package
2. **Test all endpoints** thoroughly
3. **Set up monitoring** (Application Insights)
4. **Deploy frontend** to hosting platform
5. **Configure custom domain** (optional)
6. **Set up CI/CD** for automatic deployments
7. **Enable backups** for production
8. **Go live!** 🚀

## 📝 Notes

- All sensitive data should be in environment variables, never in code
- Use strong SECRET_KEY (generated with `openssl rand -hex 32`)
- Keep DEBUG=False in production
- Whitelist specific CORS origins
- Monitor costs in Azure Cost Management
- Set up alerts for unusual activity
- Regular backups of database
- Keep dependencies updated

---

## 🚀 Ready to Deploy?

**Fastest way to get started:**

```bash
./deploy-azure.sh
```

That's it! Your backend will be live in 5-10 minutes.

**Need help?** Check the documentation files above or visit the Azure Portal.

**Good luck with your deployment!** 🎉

---

**Package Created:** January 2026
**Platform:** Azure Web App
**Runtime:** Python 3.11
**Framework:** FastAPI
**Database:** MongoDB Atlas
**Deployment:** Automated + Manual options
