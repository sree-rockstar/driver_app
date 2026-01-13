# Azure Web App Deployment Guide

This guide walks you through deploying your FastAPI Driver App backend to Azure Web App.

## Prerequisites

1. **Azure Account**: Sign up at [portal.azure.com](https://portal.azure.com)
2. **Azure CLI**: Install from [docs.microsoft.com/cli/azure/install-azure-cli](https://docs.microsoft.com/cli/azure/install-azure-cli)
3. **MongoDB Atlas**: Set up a cloud MongoDB database at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

## Deployment Options

You have two main options:

- **Option A**: Deploy via Azure Portal (GUI) - Easier for beginners
- **Option B**: Deploy via Azure CLI (Command Line) - Faster for experienced users

---

## Option A: Deploy via Azure Portal

### Step 1: Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0)
3. Create a database user with username and password
4. Add `0.0.0.0/0` to the IP Whitelist (or use Azure Web App's outbound IPs later)
5. Get your connection string (Format: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`)

### Step 2: Create Azure Web App

1. **Sign in to Azure Portal** at [portal.azure.com](https://portal.azure.com)

2. **Create a Resource Group**:

   - Click "Resource groups" → "+ Create"
   - Name: `driver-app-rg`
   - Region: Choose closest to your users (e.g., `East US`)
   - Click "Review + create" → "Create"

3. **Create Web App**:
   - Click "Create a resource" → "Web App"
   - Fill in the form:
     - **Subscription**: Your Azure subscription
     - **Resource Group**: `driver-app-rg`
     - **Name**: `driver-app-backend` (must be globally unique)
     - **Publish**: `Code`
     - **Runtime stack**: `Python 3.11`
     - **Operating System**: `Linux`
     - **Region**: Same as resource group
     - **Pricing Plan**: Choose your plan (F1 Free for testing, B1 Basic for production)
   - Click "Review + create" → "Create"
   - Wait for deployment to complete (2-3 minutes)

### Step 3: Configure Application Settings

1. Go to your Web App resource
2. In the left menu, click **"Configuration"** under Settings
3. Click **"+ New application setting"** and add each of these:

```
Name: MONGODB_URL
Value: mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

Name: DATABASE_NAME
Value: driver_app

Name: SECRET_KEY
Value: generate-a-secure-random-string-here-at-least-32-characters

Name: ALGORITHM
Value: HS256

Name: ACCESS_TOKEN_EXPIRE_MINUTES
Value: 30

Name: ALLOWED_ORIGINS
Value: https://your-frontend-domain.com,https://www.your-frontend-domain.com

Name: APP_NAME
Value: Driver App API

Name: DEBUG
Value: False

Name: SCM_DO_BUILD_DURING_DEPLOYMENT
Value: true

Name: ENABLE_ORYX_BUILD
Value: true
```

4. Click **"Save"** at the top (this will restart the app)

### Step 4: Configure Startup Command

1. Still in "Configuration" page
2. Click on **"General settings"** tab
3. In **"Startup Command"** field, enter:

```bash
gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 --worker-class uvicorn.workers.UvicornWorker app.main:app
```

4. Click **"Save"**

### Step 5: Deploy Your Code

#### Method 1: GitHub Deployment (Recommended)

1. Push your code to GitHub (if not already there)
2. In Azure Portal, go to your Web App
3. Click **"Deployment Center"** in left menu
4. Select **"GitHub"** as source
5. Authorize Azure to access your GitHub
6. Select your repository and branch
7. Click **"Save"**
8. Azure will automatically deploy your app

#### Method 2: ZIP Deployment

1. **Prepare deployment package**:

```bash
cd backend
zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc" -x ".env" -x "backend.log"
```

2. **Deploy via Azure CLI**:

```bash
az login
az webapp deployment source config-zip --resource-group driver-app-rg --name driver-app-backend --src deploy.zip
```

#### Method 3: FTP Deployment

1. In Azure Portal, go to **"Deployment Center"**
2. Click **"FTP credentials"**
3. Note your FTP hostname, username, and password
4. Use any FTP client (FileZilla, WinSCP) to upload files to `/site/wwwroot`
5. Exclude: `venv/`, `__pycache__/`, `*.pyc`, `.env`, `backend.log`

### Step 6: Set Up Persistent Storage (for File Uploads)

1. In Azure Portal, go to your Web App
2. Click **"Configuration"** → **"General settings"**
3. Under **"Platform settings"**, find **"File system storage"**
4. Toggle it to **"On"**
5. Click **"Save"**

Alternatively, configure Azure Blob Storage for file uploads (recommended for production):

```python
# Add to requirements.txt
azure-storage-blob>=12.19.0

# Update backend/app/core/file_upload.py to use Azure Blob Storage
```

### Step 7: Enable Logging

1. Go to **"App Service logs"** in left menu
2. Turn on **"Application logging"**: Filesystem
3. Set **"Level"**: Information
4. Turn on **"Detailed error messages"**: Yes
5. Turn on **"Failed request tracing"**: Yes
6. Click **"Save"**

### Step 8: Verify Deployment

1. Go to **"Overview"** in left menu
2. Click on your app URL (e.g., `https://driver-app-backend.azurewebsites.net`)
3. You should see: `{"message": "Welcome to Driver App API"}`
4. Test health endpoint: `https://driver-app-backend.azurewebsites.net/health`
5. Check API docs: `https://driver-app-backend.azurewebsites.net/api/v1/openapi.json`

### Step 9: View Logs

If something doesn't work:

1. Go to **"Log stream"** in left menu
2. Watch real-time logs
3. Or go to **"Advanced Tools"** → **"Go"** → **"Log Files"**

---

## Option B: Deploy via Azure CLI

### Quick Deployment Script

```bash
#!/bin/bash

# Variables
RESOURCE_GROUP="driver-app-rg"
LOCATION="eastus"
APP_NAME="driver-app-backend"
SKU="B1"  # Use F1 for free tier, B1 for basic, P1V2 for production

# Login to Azure
az login

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan
az appservice plan create \
  --name driver-app-plan \
  --resource-group $RESOURCE_GROUP \
  --sku $SKU \
  --is-linux

# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan driver-app-plan \
  --name $APP_NAME \
  --runtime "PYTHON:3.11"

# Configure startup command
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 --worker-class uvicorn.workers.UvicornWorker app.main:app"

# Configure application settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    MONGODB_URL="your-mongodb-connection-string" \
    DATABASE_NAME="driver_app" \
    SECRET_KEY="your-secret-key" \
    ALGORITHM="HS256" \
    ACCESS_TOKEN_EXPIRE_MINUTES="30" \
    ALLOWED_ORIGINS="https://your-frontend.com" \
    APP_NAME="Driver App API" \
    DEBUG="False" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    ENABLE_ORYX_BUILD="true"

# Enable persistent storage
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE="true"

# Enable logging
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --application-logging filesystem \
  --level information

# Deploy code (ZIP deployment)
cd backend
zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc" -x ".env" -x "backend.log"
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip

# Open the app in browser
az webapp browse --resource-group $RESOURCE_GROUP --name $APP_NAME

echo "Deployment complete!"
echo "Your API is available at: https://$APP_NAME.azurewebsites.net"
```

Save this as `deploy-azure.sh` and run it after updating the variables.

---

## Post-Deployment Tasks

### 1. Update Frontend Configuration

Update your frontend to use the new Azure backend URL:

```typescript
// frontend/src/lib/api.ts or similar
const API_BASE_URL = "https://driver-app-backend.azurewebsites.net/api/v1";
```

### 2. Set Up Custom Domain (Optional)

1. Go to **"Custom domains"** in Azure Portal
2. Click **"+ Add custom domain"**
3. Follow the wizard to add your domain
4. Configure DNS records at your domain registrar

### 3. Enable HTTPS/SSL

Azure Web Apps come with free SSL for `*.azurewebsites.net`. For custom domains:

1. Go to **"TLS/SSL settings"**
2. Click **"Private Key Certificates"** → **"+ Create App Service Managed Certificate"**
3. Select your custom domain
4. Go to **"Bindings"** → **"+ Add TLS/SSL Binding"**

### 4. Scale Your App

**Vertical Scaling** (More powerful instance):

1. Go to **"Scale up (App Service plan)"**
2. Choose a higher tier (B2, P1V2, etc.)

**Horizontal Scaling** (More instances):

1. Go to **"Scale out (App Service plan)"**
2. Increase instance count or enable auto-scaling

### 5. Set Up Monitoring

1. Go to **"Application Insights"** in left menu
2. Click **"Turn on Application Insights"**
3. Create new resource or link existing
4. Monitor performance, requests, failures, and dependencies

### 6. Configure Backups (Production)

1. Go to **"Backups"** in left menu
2. Configure automated backups
3. Requires Basic tier or higher

---

## Troubleshooting

### App Not Starting

1. Check logs in **"Log stream"**
2. Verify startup command is correct
3. Ensure all required environment variables are set
4. Check if `gunicorn` is in `requirements.txt`

### Database Connection Issues

1. Verify MongoDB connection string
2. Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` or Azure outbound IPs)
3. Test connection string locally first

### File Upload Issues

1. Ensure persistent storage is enabled
2. Or migrate to Azure Blob Storage for better scalability

### CORS Errors

1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Check that frontend is using correct backend URL

### 502 Bad Gateway

1. App is starting but timing out
2. Increase timeout in startup command: `--timeout 600`
3. Check for database connection delays

### View Detailed Logs

```bash
# Stream logs
az webapp log tail --resource-group driver-app-rg --name driver-app-backend

# Download logs
az webapp log download --resource-group driver-app-rg --name driver-app-backend
```

---

## Cost Optimization

- **Free Tier (F1)**: Good for testing, limited to 60 CPU minutes/day
- **Basic (B1)**: ~$13/month, good for development
- **Standard (S1)**: ~$70/month, includes auto-scaling and custom domains
- **Premium (P1V2)**: ~$100/month, better performance and features

Consider:

- Using Azure Free Trial ($200 credit for 30 days)
- Stopping the app when not in use (Free tier only)
- Using reserved instances for production (up to 55% savings)

---

## Security Best Practices

1. **Use Strong SECRET_KEY**: Generate with `openssl rand -hex 32`
2. **Set DEBUG=False**: Never run production with debug enabled
3. **Whitelist CORS Origins**: Don't use `*` in production
4. **Enable HTTPS Only**: Go to TLS/SSL settings → HTTPS Only: On
5. **Rotate Secrets Regularly**: Update SECRET_KEY periodically
6. **Use Key Vault**: Store secrets in Azure Key Vault for better security
7. **Enable Authentication**: Add Azure AD if needed

---

## CI/CD with GitHub Actions

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure Web App

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Create deployment package
        run: |
          cd backend
          zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc" -x ".env" -x "backend.log"

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: "driver-app-backend"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: backend/deploy.zip
```

To get publish profile:

1. Go to Azure Portal → Your Web App
2. Click **"Get publish profile"** in top menu
3. Copy content and add as GitHub secret named `AZURE_WEBAPP_PUBLISH_PROFILE`

---

## Monitoring and Maintenance

### Health Checks

Azure automatically monitors your `/health` endpoint. Configure:

1. Go to **"Health check"** in left menu
2. Enable health check
3. Path: `/health`
4. Interval: 5 minutes

### Performance Monitoring

Use Application Insights to monitor:

- Response times
- Failed requests
- Dependencies (MongoDB)
- Custom metrics

### Alerts

Set up alerts for:

- High CPU usage
- High memory usage
- Too many 5xx errors
- Slow response times

---

## Migration from cPanel

If you're migrating from cPanel:

1. Export MongoDB data from old database
2. Import to MongoDB Atlas
3. Update DNS to point to Azure Web App
4. Test thoroughly before switching production traffic
5. Keep old deployment running during transition

---

## Support and Resources

- [Azure Web App Documentation](https://docs.microsoft.com/azure/app-service/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

---

## Quick Reference Commands

```bash
# Login
az login

# View Web App
az webapp show --resource-group driver-app-rg --name driver-app-backend

# Restart Web App
az webapp restart --resource-group driver-app-rg --name driver-app-backend

# View logs
az webapp log tail --resource-group driver-app-rg --name driver-app-backend

# SSH into container
az webapp ssh --resource-group driver-app-rg --name driver-app-backend

# List all Web Apps
az webapp list --output table

# Delete Web App
az webapp delete --resource-group driver-app-rg --name driver-app-backend
```

---

## Next Steps

1. Deploy backend to Azure Web App
2. Test all API endpoints
3. Update frontend to use Azure backend URL
4. Deploy frontend (Azure Static Web Apps, Azure App Service, or Vercel)
5. Set up monitoring and alerts
6. Configure backups
7. Test the complete application

Good luck with your deployment! 🚀
