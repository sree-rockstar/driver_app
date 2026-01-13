# Import Azure App Settings from JSON

This guide shows you how to import the environment variables into Azure Web App.

## 📄 Configuration File

The file `azure-app-settings.json` contains all required environment variables in Azure's JSON format.

## 🔧 Before You Import

**IMPORTANT:** Update these values in `azure-app-settings.json`:

1. **MONGODB_URL** - Replace with your MongoDB Atlas connection string
2. **SECRET_KEY** - Generate a secure key (see below)
3. **ALLOWED_ORIGINS** - Replace with your actual frontend domain(s)

### Generate Secure SECRET_KEY

```bash
openssl rand -hex 32
```

Copy the output and replace the `SECRET_KEY` value in the JSON file.

## 📥 Import Methods

### Method 1: Azure CLI (Recommended)

```bash
# Login to Azure
az login

# Set your variables
RESOURCE_GROUP="driver-app-rg"
APP_NAME="driver-app-backend"

# Import all settings from JSON file
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings @azure-app-settings.json
```

### Method 2: Azure Portal (Manual)

1. Open [Azure Portal](https://portal.azure.com)
2. Go to your Web App
3. Click **Configuration** → **Application settings**
4. Click **Advanced edit** (top right)
5. Paste the contents of `azure-app-settings.json`
6. Click **OK**
7. Click **Save** at the top

### Method 3: Individual Settings via CLI

```bash
RESOURCE_GROUP="driver-app-rg"
APP_NAME="driver-app-backend"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    MONGODB_URL="your-mongodb-connection-string" \
    DATABASE_NAME="driver_app" \
    SECRET_KEY="your-generated-secret-key" \
    ALGORITHM="HS256" \
    ACCESS_TOKEN_EXPIRE_MINUTES="30" \
    ALLOWED_ORIGINS="https://your-frontend.com" \
    APP_NAME="Driver App API" \
    DEBUG="False" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="1" \
    ENABLE_ORYX_BUILD="true" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="true"
```

## 📋 Configuration Variables Explained

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `MONGODB_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DATABASE_NAME` | MongoDB database name | `driver_app` |
| `SECRET_KEY` | JWT signing key | Generate with `openssl rand -hex 32` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `https://example.com,https://www.example.com` |
| `APP_NAME` | Application name | `Driver App API` |
| `DEBUG` | Debug mode (False for production) | `False` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | Enable build during deployment | `1` |
| `ENABLE_ORYX_BUILD` | Enable Oryx build system | `true` |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | Enable persistent storage | `true` |

## ✅ Verify Configuration

After importing, verify the settings:

```bash
# View all settings
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --output table
```

Or in Azure Portal:
1. Go to your Web App
2. **Configuration** → **Application settings**
3. Verify all variables are present

## 🔄 Update Existing Settings

To update a single setting:

```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings SECRET_KEY="new-secret-key"
```

## 🗑️ Delete a Setting

```bash
az webapp config appsettings delete \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --setting-names DEBUG
```

## 📤 Export Current Settings

To backup or view your current configuration:

```bash
# Export as JSON
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME > current-settings.json

# Export as table
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --output table
```

## 🔐 Security Best Practices

1. **Never commit `azure-app-settings.json` with real values** to Git
2. **Generate strong SECRET_KEY** (at least 32 characters)
3. **Use specific ALLOWED_ORIGINS** (not `*`)
4. **Set DEBUG=False** in production
5. **Restrict MongoDB access** in Atlas IP whitelist
6. **Rotate secrets regularly** (especially SECRET_KEY)
7. **Use Azure Key Vault** for sensitive values (advanced)

## 🎯 Quick Setup Script

Create a file `setup-azure-config.sh`:

```bash
#!/bin/bash

# Configuration
RESOURCE_GROUP="driver-app-rg"
APP_NAME="driver-app-backend"

# Prompt for values
read -p "MongoDB URL: " MONGODB_URL
read -p "Frontend Domain (e.g., https://example.com): " FRONTEND_DOMAIN

# Generate secret key
SECRET_KEY=$(openssl rand -hex 32)
echo "Generated SECRET_KEY: $SECRET_KEY"

# Set all configuration
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    MONGODB_URL="$MONGODB_URL" \
    DATABASE_NAME="driver_app" \
    SECRET_KEY="$SECRET_KEY" \
    ALGORITHM="HS256" \
    ACCESS_TOKEN_EXPIRE_MINUTES="30" \
    ALLOWED_ORIGINS="$FRONTEND_DOMAIN" \
    APP_NAME="Driver App API" \
    DEBUG="False" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="1" \
    ENABLE_ORYX_BUILD="true" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="true"

echo "Configuration completed!"
echo "Save your SECRET_KEY securely: $SECRET_KEY"
```

Make it executable and run:

```bash
chmod +x setup-azure-config.sh
./setup-azure-config.sh
```

## 🆘 Troubleshooting

### Settings Not Applied

1. Check if app restarted (automatic after config change)
2. View logs: `az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME`
3. Verify settings are saved in portal

### Invalid JSON Format

- Ensure proper JSON syntax
- Check for trailing commas
- Validate JSON: `cat azure-app-settings.json | jq`

### Permission Denied

```bash
# Login again
az login

# Check your subscription
az account show
```

## 📚 Related Documentation

- `AZURE_QUICK_START.md` - Full deployment guide
- `AZURE_DEPLOYMENT_GUIDE.md` - Comprehensive reference
- `deploy-azure.sh` - Automated deployment script

---

**Need help?** Check the Azure documentation or run `az webapp config appsettings --help`
