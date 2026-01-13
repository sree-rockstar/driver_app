# GitHub Actions Deployment Troubleshooting

## Error: Could not open requirements file

### Issue
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

### Solution

This error occurs during Azure's Oryx build process. Here's how to fix it:

#### Option 1: Check GitHub Secrets (Most Common Issue)

1. **Verify you have the publish profile secret:**
   - Go to GitHub → Your Repository → Settings → Secrets and variables → Actions
   - Check if `AZURE_WEBAPP_PUBLISH_PROFILE` exists
   
2. **Get publish profile from Azure:**
   ```bash
   az webapp deployment list-publishing-profiles \
     --resource-group driver-app-rg \
     --name prt-backend-g9abh2fjdngzcpdc \
     --xml
   ```

3. **Or download from Azure Portal:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to your Web App: `prt-backend-g9abh2fjdngzcpdc`
   - Click "Get publish profile" (download button)
   - Copy the entire contents
   - Add to GitHub Secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`

#### Option 2: Verify Deployment Package

The workflow has been updated to show the zip contents. Check the GitHub Actions logs to verify `requirements.txt` is at the root of the zip file.

#### Option 3: Deploy Manually First

Deploy manually via Azure CLI to ensure everything works:

```bash
cd backend
zip -r ../deploy.zip . -x "venv/*" "__pycache__/*" "*.pyc" ".env" "*.log" "uploads/*"
cd ..

az webapp deployment source config-zip \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --src deploy.zip
```

#### Option 4: Check Azure Build Settings

Verify these settings are configured in Azure:

```bash
az webapp config appsettings list \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --query "[?name=='SCM_DO_BUILD_DURING_DEPLOYMENT' || name=='ENABLE_ORYX_BUILD']"
```

Should return:
```json
[
  {
    "name": "SCM_DO_BUILD_DURING_DEPLOYMENT",
    "value": "1"
  },
  {
    "name": "ENABLE_ORYX_BUILD",
    "value": "true"
  }
]
```

## Quick Fix: Disable Oryx Build (Use Pre-built Package)

If Oryx build keeps failing, you can deploy a pre-built package:

### Step 1: Update Azure Settings

```bash
# Disable Oryx build
az webapp config appsettings set \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT="false" \
    ENABLE_ORYX_BUILD="false"
```

### Step 2: Update Startup Command

Ensure startup command is set:

```bash
az webapp config set \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 --worker-class uvicorn.workers.UvicornWorker app.main:app"
```

### Step 3: Deploy

The deployment will use your requirements.txt without re-building.

## GitHub Actions Setup Guide

### 1. Get Publish Profile

**Via Azure Portal:**
1. Go to https://portal.azure.com
2. Find your Web App: `prt-backend-g9abh2fjdngzcpdc`
3. Click "Get publish profile" button
4. Save the downloaded XML file

**Via Azure CLI:**
```bash
az webapp deployment list-publishing-profiles \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --xml > publish-profile.xml
```

### 2. Add to GitHub Secrets

1. Open your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Paste the entire contents of the publish profile XML
6. Click **Add secret**

### 3. Verify Workflow File

Ensure `.github/workflows/azure-deploy.yml` has the correct app name:

```yaml
env:
  AZURE_WEBAPP_NAME: prt-backend-g9abh2fjdngzcpdc
```

### 4. Trigger Deployment

**Option A: Push to main branch**
```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

**Option B: Manual trigger**
1. Go to GitHub → Actions
2. Select "Deploy Backend to Azure Web App"
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"

## Viewing Logs

### GitHub Actions Logs
1. Go to your repository on GitHub
2. Click "Actions" tab
3. Click on the failed workflow run
4. Click on the job to see detailed logs

### Azure Deployment Logs
```bash
# Real-time logs
az webapp log tail \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc

# Download logs
az webapp log download \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --log-file app-logs.zip
```

### Azure Portal Logs
1. Go to Azure Portal
2. Your Web App → **Log stream**
3. Watch deployment progress

## Common Issues

### Issue: "App name not found"
**Fix:** Update `AZURE_WEBAPP_NAME` in workflow to `prt-backend-g9abh2fjdngzcpdc`

### Issue: "Publish profile invalid"
**Fix:** Re-download publish profile from Azure Portal and update GitHub secret

### Issue: "Deployment successful but app not working"
**Fix:** Check environment variables are set in Azure

### Issue: "502 Bad Gateway after deployment"
**Fix:** 
1. Check startup command is set
2. Verify MongoDB connection
3. Check application logs

### Issue: "Permission denied"
**Fix:** Ensure GitHub Actions has correct permissions in Azure

## Manual Deployment (Bypass GitHub Actions)

If GitHub Actions continues to fail, deploy manually:

```bash
# 1. Create deployment package
cd backend
zip -r ../deploy.zip . \
  -x "venv/*" \
  -x "__pycache__/*" \
  -x "*/__pycache__/*" \
  -x "*.pyc" \
  -x ".env" \
  -x "*.log" \
  -x "uploads/*"
cd ..

# 2. Deploy to Azure
az webapp deployment source config-zip \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --src deploy.zip \
  --timeout 600

# 3. Check status
az webapp show \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --query state

# 4. View logs
az webapp log tail \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc
```

## Test After Deployment

```bash
# Health check
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health

# Root endpoint
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/

# API docs
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/openapi.json
```

## Alternative: Use Azure DevOps

If GitHub Actions continues to be problematic, consider using Azure DevOps Pipelines:

1. Create Azure DevOps account
2. Connect to your GitHub repo
3. Create pipeline for continuous deployment
4. Uses native Azure integration

## Support

- **GitHub Actions Docs**: https://docs.github.com/actions
- **Azure Deployment**: https://docs.microsoft.com/azure/app-service/deploy-github-actions
- **Azure CLI**: https://docs.microsoft.com/cli/azure/

---

**Current Status:**
- App Name: `prt-backend-g9abh2fjdngzcpdc`
- Region: Canada Central
- URL: https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net

**Next Step:** Add GitHub secret `AZURE_WEBAPP_PUBLISH_PROFILE` and push to main branch.
