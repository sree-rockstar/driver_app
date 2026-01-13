#!/bin/bash

# Azure Web App Deployment Script for Driver App Backend
# Make this script executable: chmod +x deploy-azure.sh

set -e  # Exit on error

echo "================================"
echo "Azure Web App Deployment Script"
echo "================================"
echo ""

# Configuration Variables
RESOURCE_GROUP="driver-app-rg"
LOCATION="eastus"
APP_NAME="driver-app-backend"
PLAN_NAME="driver-app-plan"
SKU="B1"  # Options: F1 (Free), B1 (Basic), B2, B3, S1 (Standard), P1V2 (Premium)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it from:"
    echo "https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

print_success "Azure CLI found"

# Login to Azure
print_info "Logging in to Azure..."
if az account show &> /dev/null; then
    print_success "Already logged in to Azure"
    CURRENT_SUBSCRIPTION=$(az account show --query name -o tsv)
    print_info "Current subscription: $CURRENT_SUBSCRIPTION"
    read -p "Continue with this subscription? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        az login
    fi
else
    az login
fi

# Prompt for configuration if needed
read -p "Resource Group name [$RESOURCE_GROUP]: " input
RESOURCE_GROUP="${input:-$RESOURCE_GROUP}"

read -p "Azure Region [$LOCATION]: " input
LOCATION="${input:-$LOCATION}"

read -p "App name [$APP_NAME]: " input
APP_NAME="${input:-$APP_NAME}"

read -p "SKU tier [$SKU] (F1/B1/B2/S1/P1V2): " input
SKU="${input:-$SKU}"

echo ""
print_info "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  App Name: $APP_NAME"
echo "  SKU: $SKU"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

# Create resource group
print_info "Creating resource group..."
if az group create --name "$RESOURCE_GROUP" --location "$LOCATION" &> /dev/null; then
    print_success "Resource group created: $RESOURCE_GROUP"
else
    print_info "Resource group already exists or error creating it"
fi

# Create App Service plan
print_info "Creating App Service plan..."
if az appservice plan create \
    --name "$PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --sku "$SKU" \
    --is-linux &> /dev/null; then
    print_success "App Service plan created: $PLAN_NAME"
else
    print_info "App Service plan already exists or error creating it"
fi

# Create Web App
print_info "Creating Web App..."
if az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$PLAN_NAME" \
    --name "$APP_NAME" \
    --runtime "PYTHON:3.11" &> /dev/null; then
    print_success "Web App created: $APP_NAME"
else
    print_info "Web App already exists or error creating it"
fi

# Configure startup command
print_info "Configuring startup command..."
az webapp config set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 --worker-class uvicorn.workers.UvicornWorker app.main:app" &> /dev/null
print_success "Startup command configured"

# Prompt for environment variables
echo ""
print_info "Now configure your environment variables..."
echo ""

read -p "MongoDB URL: " MONGODB_URL
read -p "Database Name [driver_app]: " DATABASE_NAME
DATABASE_NAME="${DATABASE_NAME:-driver_app}"

# Generate a secure secret key
print_info "Generating secure SECRET_KEY..."
SECRET_KEY=$(openssl rand -hex 32)
print_success "Generated SECRET_KEY: ${SECRET_KEY:0:10}..."

read -p "Allowed CORS Origins (comma-separated): " ALLOWED_ORIGINS
read -p "Set DEBUG to False? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DEBUG_VALUE="False"
else
    DEBUG_VALUE="True"
fi

# Configure application settings
print_info "Configuring application settings..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
        MONGODB_URL="$MONGODB_URL" \
        DATABASE_NAME="$DATABASE_NAME" \
        SECRET_KEY="$SECRET_KEY" \
        ALGORITHM="HS256" \
        ACCESS_TOKEN_EXPIRE_MINUTES="30" \
        ALLOWED_ORIGINS="$ALLOWED_ORIGINS" \
        APP_NAME="Driver App API" \
        DEBUG="$DEBUG_VALUE" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
        ENABLE_ORYX_BUILD="true" \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE="true" \
    --output none

print_success "Application settings configured"

# Enable logging
print_info "Enabling application logging..."
az webapp log config \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --application-logging filesystem \
    --level information \
    --output none
print_success "Logging enabled"

# Deploy code
print_info "Preparing deployment package..."
cd backend

# Create deployment package
if [ -f deploy.zip ]; then
    rm deploy.zip
fi

zip -r deploy.zip . \
    -x "venv/*" \
    -x "__pycache__/*" \
    -x "*/__pycache__/*" \
    -x "*.pyc" \
    -x ".env" \
    -x "backend.log" \
    -x "*.log" \
    -x ".git/*" \
    > /dev/null

print_success "Deployment package created"

# Deploy
print_info "Deploying application (this may take a few minutes)..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src deploy.zip \
    --output none

print_success "Application deployed successfully!"

# Clean up
rm deploy.zip

cd ..

# Get the app URL
APP_URL="https://$APP_NAME.azurewebsites.net"

echo ""
echo "================================"
print_success "Deployment Complete!"
echo "================================"
echo ""
echo "Your API is available at:"
echo "  $APP_URL"
echo ""
echo "Health check:"
echo "  $APP_URL/health"
echo ""
echo "API Documentation:"
echo "  $APP_URL/api/v1/openapi.json"
echo ""
print_info "Next steps:"
echo "  1. Test your API endpoints"
echo "  2. Update frontend to use the new backend URL"
echo "  3. Monitor logs: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME"
echo "  4. Configure custom domain (optional)"
echo "  5. Set up Application Insights for monitoring"
echo ""
print_info "Your SECRET_KEY has been saved to Azure. Keep it secure!"
echo "  SECRET_KEY: $SECRET_KEY"
echo ""

# Offer to open the app
read -p "Open the app in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "$APP_URL"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$APP_URL"
    else
        print_info "Please open manually: $APP_URL"
    fi
fi

# Offer to stream logs
echo ""
read -p "Stream logs now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Streaming logs (Press Ctrl+C to stop)..."
    az webapp log tail --resource-group "$RESOURCE_GROUP" --name "$APP_NAME"
fi

print_success "All done! 🚀"
