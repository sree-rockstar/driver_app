# Azure Deployment Checklist

Use this checklist to ensure a smooth deployment to Azure Web App.

## Pre-Deployment

### 1. Prerequisites Setup
- [ ] Azure account created ([Sign up](https://azure.microsoft.com/free/))
- [ ] Azure CLI installed ([Install](https://docs.microsoft.com/cli/azure/install-azure-cli))
- [ ] MongoDB Atlas cluster created ([Create](https://www.mongodb.com/cloud/atlas))
- [ ] MongoDB database user created
- [ ] MongoDB connection string obtained
- [ ] IP whitelist configured in MongoDB Atlas (0.0.0.0/0 or specific IPs)

### 2. Environment Configuration
- [ ] Generate strong SECRET_KEY: `openssl rand -hex 32`
- [ ] Note down frontend domain for CORS
- [ ] Prepare environment variables:
  - [ ] MONGODB_URL
  - [ ] DATABASE_NAME
  - [ ] SECRET_KEY
  - [ ] ALLOWED_ORIGINS
  - [ ] DEBUG=False (for production)

### 3. Code Preparation
- [ ] All changes committed to Git
- [ ] Dependencies updated in requirements.txt
- [ ] gunicorn added to requirements.txt ✅ (already done)
- [ ] Backend code tested locally
- [ ] No sensitive data in code (.env not committed)

## Deployment

### Option A: Automated Deployment (Recommended)

- [ ] Make script executable: `chmod +x deploy-azure.sh`
- [ ] Run deployment script: `./deploy-azure.sh`
- [ ] Follow prompts to configure:
  - [ ] Resource group name
  - [ ] Azure region
  - [ ] App name (must be globally unique)
  - [ ] Pricing tier (F1/B1/S1/P1V2)
- [ ] Provide MongoDB connection string when prompted
- [ ] Provide frontend domain for CORS
- [ ] Note down generated SECRET_KEY
- [ ] Wait for deployment to complete (2-5 minutes)

### Option B: Manual Portal Deployment

#### Azure Resources
- [ ] Login to [Azure Portal](https://portal.azure.com)
- [ ] Create Resource Group:
  - [ ] Name: `driver-app-rg`
  - [ ] Region: Choose closest to users
- [ ] Create App Service Plan:
  - [ ] Name: `driver-app-plan`
  - [ ] Pricing tier: B1 Basic (or higher)
- [ ] Create Web App:
  - [ ] Name: `driver-app-backend` (must be unique)
  - [ ] Runtime: Python 3.11
  - [ ] OS: Linux

#### Configuration
- [ ] Go to Configuration → Application settings
- [ ] Add all environment variables:
  - [ ] MONGODB_URL
  - [ ] DATABASE_NAME
  - [ ] SECRET_KEY
  - [ ] ALGORITHM = HS256
  - [ ] ACCESS_TOKEN_EXPIRE_MINUTES = 30
  - [ ] ALLOWED_ORIGINS
  - [ ] APP_NAME = Driver App API
  - [ ] DEBUG = False
  - [ ] SCM_DO_BUILD_DURING_DEPLOYMENT = true
  - [ ] ENABLE_ORYX_BUILD = true
- [ ] Go to Configuration → General settings
- [ ] Set Startup Command:
  ```
  gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 --worker-class uvicorn.workers.UvicornWorker app.main:app
  ```
- [ ] Click Save (app will restart)

#### Code Deployment
Choose one method:

**GitHub Deploy (Recommended):**
- [ ] Go to Deployment Center
- [ ] Select GitHub as source
- [ ] Authorize Azure
- [ ] Select repository and branch
- [ ] Click Save
- [ ] Wait for first deployment (5-10 minutes)

**ZIP Deploy:**
- [ ] Create deployment package:
  ```bash
  cd backend
  zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
  ```
- [ ] Deploy via CLI:
  ```bash
  az webapp deployment source config-zip \
    --resource-group driver-app-rg \
    --name driver-app-backend \
    --src deploy.zip
  ```

## Post-Deployment

### 1. Verification
- [ ] Go to Web App URL: `https://your-app-name.azurewebsites.net`
- [ ] Test root endpoint (should see welcome message)
- [ ] Test health endpoint: `/health`
- [ ] Test API docs: `/api/v1/openapi.json`
- [ ] Check if app is running (no 502/503 errors)

### 2. Logging & Monitoring
- [ ] Enable Application Logging:
  - [ ] Go to App Service logs
  - [ ] Application Logging: Filesystem
  - [ ] Level: Information
  - [ ] Save
- [ ] Enable detailed error messages: Yes
- [ ] Enable failed request tracing: Yes
- [ ] View logs in Log stream to verify startup
- [ ] No errors in logs

### 3. Security
- [ ] Verify DEBUG=False in production
- [ ] Verify ALLOWED_ORIGINS is properly set (not *)
- [ ] Verify SECRET_KEY is strong and unique
- [ ] HTTPS Only enabled (under TLS/SSL settings)
- [ ] Minimum TLS version set to 1.2
- [ ] Store SECRET_KEY securely (password manager)

### 4. Database
- [ ] Test database connection (check logs)
- [ ] Verify MongoDB Atlas shows connections
- [ ] Run any necessary database migrations
- [ ] Seed initial data if needed:
  - [ ] Roles: `python backend/app/db/seed_roles.py`
  - [ ] Statuses: `python backend/app/db/seed_statuses.py`
  - [ ] Trip config: `python backend/app/db/seed_trip_config.py`

### 5. API Testing
- [ ] Test authentication endpoints:
  - [ ] POST /api/v1/auth/login
  - [ ] POST /api/v1/auth/register
- [ ] Test driver endpoints:
  - [ ] GET /api/v1/drivers/
  - [ ] POST /api/v1/drivers/
- [ ] Test vehicle endpoints:
  - [ ] GET /api/v1/vehicles/
  - [ ] POST /api/v1/vehicles/
- [ ] Test trip endpoints:
  - [ ] GET /api/v1/trips/
  - [ ] POST /api/v1/trips/
- [ ] Test file upload endpoints
- [ ] Test protected routes (with authentication)

### 6. Performance
- [ ] Check response times (should be < 2s)
- [ ] Check startup time (should complete within 230s)
- [ ] No memory issues in monitoring
- [ ] No high CPU usage

### 7. Storage
- [ ] Configure persistent storage:
  - [ ] Configuration → General settings
  - [ ] File system storage: On
  - [ ] Save
- [ ] Or configure Azure Blob Storage for production:
  - [ ] Create storage account
  - [ ] Create container
  - [ ] Update app to use Blob Storage

## Frontend Integration

### 1. Update Frontend Configuration
- [ ] Update API base URL in frontend:
  ```typescript
  const API_BASE_URL = 'https://your-app-name.azurewebsites.net/api/v1';
  ```
- [ ] Or set environment variable:
  ```
  VITE_API_URL=https://your-app-name.azurewebsites.net/api/v1
  ```
- [ ] Test frontend locally with Azure backend
- [ ] Verify CORS is working
- [ ] Verify authentication flows work

### 2. Deploy Frontend
- [ ] Deploy frontend to hosting platform
- [ ] Update ALLOWED_ORIGINS in Azure to include frontend URL
- [ ] Test production frontend with production backend

## Optional Enhancements

### 1. Application Insights
- [ ] Enable Application Insights:
  - [ ] Application Insights → Turn on
  - [ ] Create new resource
- [ ] Configure custom metrics if needed
- [ ] Set up availability tests
- [ ] Create dashboard for monitoring

### 2. Alerts
- [ ] Set up alert for high CPU usage (> 80%)
- [ ] Set up alert for high memory usage (> 80%)
- [ ] Set up alert for HTTP 5xx errors
- [ ] Set up alert for slow response times (> 5s)
- [ ] Configure alert actions (email, SMS, webhook)

### 3. Backups
- [ ] Enable automated backups:
  - [ ] Backups → Configure
  - [ ] Set backup schedule
  - [ ] Set retention period
  - [ ] Note: Requires Basic tier or higher
- [ ] Test restore process

### 4. Custom Domain
- [ ] Purchase/have domain ready
- [ ] Add custom domain in Azure:
  - [ ] Custom domains → Add custom domain
  - [ ] Verify domain ownership
  - [ ] Add DNS records
- [ ] Create SSL certificate:
  - [ ] TLS/SSL settings
  - [ ] Create App Service Managed Certificate
  - [ ] Add TLS/SSL binding
- [ ] Test custom domain
- [ ] Update frontend to use custom domain

### 5. Scaling
- [ ] Configure auto-scaling rules:
  - [ ] Scale out → Enable auto-scale
  - [ ] Set min/max instances
  - [ ] Configure scale conditions (CPU, memory, etc.)
- [ ] Test scaling behavior

### 6. CI/CD
- [ ] Copy GitHub Actions workflow to repository
- [ ] Get publish profile from Azure Portal
- [ ] Add AZURE_WEBAPP_PUBLISH_PROFILE to GitHub secrets
- [ ] Test automated deployment (push to main)
- [ ] Verify deployment succeeds

## Testing Checklist

### Functional Testing
- [ ] User registration works
- [ ] User login works
- [ ] Driver CRUD operations work
- [ ] Vehicle CRUD operations work
- [ ] Trip CRUD operations work
- [ ] File uploads work
- [ ] File downloads work (authenticated)
- [ ] Search and filters work
- [ ] Pagination works
- [ ] Authentication/authorization works correctly

### Security Testing
- [ ] Unauthenticated users cannot access protected routes
- [ ] Users cannot access others' private data
- [ ] File access is properly authenticated
- [ ] SQL injection attempts fail (N/A for MongoDB, but test)
- [ ] XSS attempts are blocked
- [ ] CORS is properly configured
- [ ] HTTPS is enforced

### Performance Testing
- [ ] Load test with expected traffic
- [ ] Response times are acceptable
- [ ] Database queries are optimized
- [ ] No memory leaks
- [ ] Concurrent requests handled properly

## Documentation

- [ ] Document deployment process for team
- [ ] Save all credentials securely:
  - [ ] Azure login credentials
  - [ ] MongoDB credentials
  - [ ] SECRET_KEY
  - [ ] App URLs
- [ ] Document environment variables
- [ ] Document any custom configuration
- [ ] Share access with team members

## Maintenance Plan

- [ ] Schedule regular updates:
  - [ ] Python version
  - [ ] Dependencies
  - [ ] Azure platform updates
- [ ] Monitor costs and optimize
- [ ] Review logs regularly
- [ ] Test backup restore process quarterly
- [ ] Review and update security settings

## Troubleshooting Checklist

If something doesn't work:

- [ ] Check logs in Azure Log stream
- [ ] Verify all environment variables are set correctly
- [ ] Check MongoDB connection (test locally)
- [ ] Verify startup command is correct
- [ ] Check if gunicorn is installed
- [ ] Verify CORS settings
- [ ] Check application insights for errors
- [ ] Try restarting the app
- [ ] Check Azure service health status
- [ ] Review recent changes in deployment

## Common Commands

Save these for future use:

```bash
# Login to Azure
az login

# View app status
az webapp show --resource-group driver-app-rg --name driver-app-backend

# Restart app
az webapp restart --resource-group driver-app-rg --name driver-app-backend

# Stream logs
az webapp log tail --resource-group driver-app-rg --name driver-app-backend

# SSH into container
az webapp ssh --resource-group driver-app-rg --name driver-app-backend

# Update app settings
az webapp config appsettings set --resource-group driver-app-rg --name driver-app-backend --settings KEY=VALUE

# Deploy new version
cd backend && zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
az webapp deployment source config-zip --resource-group driver-app-rg --name driver-app-backend --src deploy.zip
```

## Success Criteria

Deployment is successful when:

- ✅ App is accessible via Azure URL
- ✅ Health check returns 200 OK
- ✅ Authentication works
- ✅ Database operations work
- ✅ File uploads work
- ✅ Frontend can communicate with backend
- ✅ No errors in logs
- ✅ Response times are acceptable
- ✅ Monitoring is enabled
- ✅ HTTPS is working

## Final Notes

- Keep this checklist for future deployments
- Update checklist based on your experience
- Share with team members
- Document any deviations or customizations

---

**Deployment Date:** _______________

**Deployed By:** _______________

**App URL:** _______________

**Notes:** _______________

---

Good luck with your deployment! 🚀
