#!/bin/bash

# Script to update azure-app-settings.json with your actual values
# Usage: ./update-azure-config.sh

set -e

echo "════════════════════════════════════════════════════════════"
echo "   Azure App Settings Configuration Helper"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: 'jq' is not installed. Using basic method."
    echo "   Install jq for better JSON handling: brew install jq"
    USE_JQ=false
else
    USE_JQ=true
fi

# Prompt for values
echo "Please provide the following values:"
echo "(Press Enter to keep default/template value)"
echo ""

read -p "MongoDB URL: " MONGODB_URL
read -p "Database Name [driver_app]: " DATABASE_NAME
DATABASE_NAME="${DATABASE_NAME:-driver_app}"

# Generate or input SECRET_KEY
echo ""
echo "SECRET_KEY options:"
echo "  1. Generate new random key (recommended)"
echo "  2. Enter existing key"
read -p "Choose option (1 or 2): " SECRET_OPTION

if [ "$SECRET_OPTION" = "1" ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    echo "✓ Generated SECRET_KEY: $SECRET_KEY"
else
    read -p "Enter SECRET_KEY: " SECRET_KEY
fi

read -p "Frontend Domain(s) (comma-separated): " ALLOWED_ORIGINS
read -p "App Name [Driver App API]: " APP_NAME
APP_NAME="${APP_NAME:-Driver App API}"

echo ""
read -p "Is this for production? (y/n): " IS_PRODUCTION
if [[ $IS_PRODUCTION =~ ^[Yy]$ ]]; then
    DEBUG="False"
else
    DEBUG="True"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Configuration Summary:"
echo "════════════════════════════════════════════════════════════"
echo "MongoDB URL: ${MONGODB_URL:0:30}..."
echo "Database Name: $DATABASE_NAME"
echo "SECRET_KEY: ${SECRET_KEY:0:20}... (length: ${#SECRET_KEY})"
echo "ALLOWED_ORIGINS: $ALLOWED_ORIGINS"
echo "APP_NAME: $APP_NAME"
echo "DEBUG: $DEBUG"
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "Save this configuration? (y/n): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Configuration cancelled."
    exit 0
fi

# Create the JSON file
cat > azure-app-settings.json << EOF
[
  {
    "name": "MONGODB_URL",
    "value": "$MONGODB_URL",
    "slotSetting": false
  },
  {
    "name": "DATABASE_NAME",
    "value": "$DATABASE_NAME",
    "slotSetting": false
  },
  {
    "name": "SECRET_KEY",
    "value": "$SECRET_KEY",
    "slotSetting": false
  },
  {
    "name": "ALGORITHM",
    "value": "HS256",
    "slotSetting": false
  },
  {
    "name": "ACCESS_TOKEN_EXPIRE_MINUTES",
    "value": "30",
    "slotSetting": false
  },
  {
    "name": "ALLOWED_ORIGINS",
    "value": "$ALLOWED_ORIGINS",
    "slotSetting": false
  },
  {
    "name": "APP_NAME",
    "value": "$APP_NAME",
    "slotSetting": false
  },
  {
    "name": "DEBUG",
    "value": "$DEBUG",
    "slotSetting": false
  },
  {
    "name": "SCM_DO_BUILD_DURING_DEPLOYMENT",
    "value": "1",
    "slotSetting": false
  },
  {
    "name": "ENABLE_ORYX_BUILD",
    "value": "true",
    "slotSetting": false
  },
  {
    "name": "WEBSITES_ENABLE_APP_SERVICE_STORAGE",
    "value": "true",
    "slotSetting": false
  }
]
EOF

echo "✓ Configuration saved to azure-app-settings.json"
echo ""

# Validate JSON if jq is available
if [ "$USE_JQ" = true ]; then
    if jq empty azure-app-settings.json 2>/dev/null; then
        echo "✓ JSON is valid"
    else
        echo "⚠️  Warning: JSON might be invalid. Please check the file."
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Next Steps:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Review the configuration file:"
echo "   cat azure-app-settings.json"
echo ""
echo "2. Import to Azure Web App:"
echo "   az webapp config appsettings set \\"
echo "     --resource-group driver-app-rg \\"
echo "     --name your-app-name \\"
echo "     --settings @azure-app-settings.json"
echo ""
echo "3. Or use the portal:"
echo "   - Go to Azure Portal → Your Web App"
echo "   - Configuration → Application settings"
echo "   - Advanced edit → Paste JSON content"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT: Keep your SECRET_KEY secure!"
echo "   SECRET_KEY: $SECRET_KEY"
echo ""
echo "Save this key in a secure location (password manager)"
echo ""

# Offer to save credentials securely
read -p "Save configuration to secure file (config.secret)? (y/n): " SAVE_SECRET
if [[ $SAVE_SECRET =~ ^[Yy]$ ]]; then
    cat > config.secret << EOF
# Azure Configuration - KEEP THIS FILE SECURE!
# Generated: $(date)

MONGODB_URL=$MONGODB_URL
DATABASE_NAME=$DATABASE_NAME
SECRET_KEY=$SECRET_KEY
ALLOWED_ORIGINS=$ALLOWED_ORIGINS
APP_NAME=$APP_NAME
DEBUG=$DEBUG

# Azure Web App Details
RESOURCE_GROUP=driver-app-rg
APP_NAME=driver-app-backend

# Import command:
# az webapp config appsettings set --resource-group driver-app-rg --name driver-app-backend --settings @azure-app-settings.json
EOF
    chmod 600 config.secret
    echo "✓ Saved to config.secret (chmod 600)"
    echo "⚠️  Add config.secret to .gitignore!"
    
    # Add to gitignore if not already there
    if [ -f .gitignore ]; then
        if ! grep -q "config.secret" .gitignore; then
            echo "config.secret" >> .gitignore
            echo "✓ Added config.secret to .gitignore"
        fi
    fi
fi

echo ""
echo "✅ Configuration complete!"
