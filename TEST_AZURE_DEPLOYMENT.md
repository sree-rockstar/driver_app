# Testing Azure Deployment

Your backend is deployed at: `https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net`

## 🧪 Quick Tests

### 1. Basic Health Check (Browser or Terminal)

**Browser:**

```
https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health
```

**Terminal:**

```bash
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health
```

**Expected Response:**

```json
{ "status": "healthy" }
```

### 2. Root Endpoint

**Browser:**

```
https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/
```

**Terminal:**

```bash
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/
```

**Expected Response:**

```json
{ "message": "Welcome to Driver App API" }
```

### 3. API Documentation

**OpenAPI JSON:**

```
https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/openapi.json
```

**Interactive API Docs (if enabled):**

```
https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/docs
```

## 🔐 Test Authentication Endpoints

### Register a Test User

```bash
curl -X POST https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "9999999999",
    "name": "Test User",
    "email": "test@example.com",
    "mpin": "1234"
  }'
```

### Login

```bash
curl -X POST https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "9999999999",
    "mpin": "1234"
  }'
```

**Expected Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {...}
}
```

Save the `access_token` for authenticated requests.

## 📊 Test Protected Endpoints

### Get All Drivers (requires authentication)

```bash
# Replace YOUR_TOKEN with the access_token from login
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/drivers/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Current User

```bash
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚗 Test Vehicle Endpoints

### Get All Vehicles

```bash
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/vehicles/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Vehicle

```bash
curl -X POST https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/vehicles/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_number": "TEST001",
    "vehicle_type": "sedan",
    "manufacturer": "Test",
    "model": "Test Model",
    "year": 2024
  }'
```

## 🛣️ Test Trip Endpoints

### Get All Trips

```bash
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1/trips/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Test with Postman/Insomnia

### Import Collection

1. Open Postman/Insomnia
2. Set Base URL: `https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net`
3. Test endpoints:
   - GET `/health`
   - POST `/api/v1/auth/login`
   - GET `/api/v1/drivers/`
   - GET `/api/v1/vehicles/`
   - GET `/api/v1/trips/`

### Authentication Setup

1. Login to get token
2. Add Authorization header: `Bearer YOUR_TOKEN`
3. Test protected endpoints

## 🌐 Test CORS

### From Browser Console

Open your frontend app, open browser console, and run:

```javascript
fetch(
  "https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health"
)
  .then((res) => res.json())
  .then((data) => console.log("Success:", data))
  .catch((err) => console.error("CORS Error:", err));
```

If CORS is working, you should see: `Success: {status: "healthy"}`

## 📱 Update Frontend Configuration

Update your frontend to use the Azure backend:

### React/Vue/Angular

```typescript
// src/config/api.ts or similar
export const API_BASE_URL =
  "https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1";
```

### Environment Variable

```bash
# .env or .env.production
VITE_API_URL=https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1
REACT_APP_API_URL=https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1
```

### Capacitor/Ionic (Mobile App)

```typescript
// src/config/api.ts
export const API_BASE_URL =
  "https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1";
```

## 🔍 Monitor and Debug

### View Real-time Logs

```bash
az webapp log tail \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc
```

### Check Application Status

```bash
az webapp show \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --query state
```

### View Configuration

```bash
az webapp config appsettings list \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc \
  --output table
```

## 🐛 Troubleshooting

### App Not Responding (502/503)

1. **Check if app is starting:**

```bash
az webapp log tail \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc
```

2. **Restart the app:**

```bash
az webapp restart \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc
```

3. **Verify environment variables are set:**

```bash
az webapp config appsettings list \
  --resource-group driver-app-rg \
  --name prt-backend-g9abh2fjdngzcpdc
```

### Database Connection Issues

1. Check MongoDB Atlas IP whitelist
2. Add Azure outbound IPs or allow all (0.0.0.0/0)
3. Verify MONGODB_URL is correct

### CORS Errors

1. Verify ALLOWED_ORIGINS is set to "\*" in Azure configuration
2. Check that DEBUG=True or ALLOWED_ORIGINS includes your frontend domain
3. Test with curl first (CORS is browser-only)

### Slow Response Times

1. Check if app is cold starting (first request after idle)
2. Consider upgrading to Basic tier for better performance
3. Enable Application Insights for monitoring

## ✅ Complete Test Script

Save this as `test-azure.sh`:

```bash
#!/bin/bash

BASE_URL="https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net"

echo "Testing Azure Backend Deployment"
echo "================================="
echo ""

# Test 1: Health Check
echo "1. Testing /health endpoint..."
HEALTH=$(curl -s "$BASE_URL/health")
if [[ $HEALTH == *"healthy"* ]]; then
    echo "✅ Health check passed: $HEALTH"
else
    echo "❌ Health check failed: $HEALTH"
fi
echo ""

# Test 2: Root endpoint
echo "2. Testing root endpoint..."
ROOT=$(curl -s "$BASE_URL/")
if [[ $ROOT == *"Welcome"* ]]; then
    echo "✅ Root endpoint passed: $ROOT"
else
    echo "❌ Root endpoint failed: $ROOT"
fi
echo ""

# Test 3: API Documentation
echo "3. Testing API documentation..."
DOCS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/openapi.json")
if [[ $DOCS == "200" ]]; then
    echo "✅ API documentation available (HTTP $DOCS)"
else
    echo "⚠️  API documentation returned HTTP $DOCS"
fi
echo ""

# Test 4: CORS (from terminal - this won't show actual CORS headers)
echo "4. Checking response headers..."
curl -I "$BASE_URL/health" 2>&1 | grep -i "access-control"
echo ""

echo "================================="
echo "Basic tests complete!"
echo ""
echo "Next steps:"
echo "1. Test authentication endpoints with Postman"
echo "2. Update your frontend to use this backend URL"
echo "3. Test from your frontend application"
echo "4. Monitor logs: az webapp log tail --resource-group driver-app-rg --name prt-backend-g9abh2fjdngzcpdc"
```

Make it executable and run:

```bash
chmod +x test-azure.sh
./test-azure.sh
```

## 📊 Performance Testing

### Load Test with Apache Bench

```bash
# Install ab (Apache Bench)
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health
```

### Test Response Times

```bash
# Test response time
time curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health

# Detailed timing
curl -w "\nTime Total: %{time_total}s\nTime Connect: %{time_connect}s\n" \
  -o /dev/null -s \
  https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health
```

## 🎯 Integration Test with Frontend

1. **Update Frontend API URL**
2. **Test User Registration**
3. **Test User Login**
4. **Test Driver Management**
5. **Test Vehicle Management**
6. **Test Trip Management**
7. **Test File Uploads**

## 📈 Monitor in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Web App: `prt-backend-g9abh2fjdngzcpdc`
3. Check:
   - **Overview** - CPU, Memory usage
   - **Log stream** - Real-time logs
   - **Metrics** - Response times, requests
   - **Diagnose and solve problems** - Issues

## ✅ Deployment Verification Checklist

- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Root endpoint returns welcome message
- [ ] API documentation is accessible
- [ ] Authentication (login/register) works
- [ ] Protected endpoints require token
- [ ] CORS allows your frontend domain
- [ ] Database connection is working
- [ ] No errors in logs
- [ ] Response times are acceptable (< 2s)
- [ ] Frontend can connect successfully

---

**Your Backend URL:**

```
https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net
```

**API Base URL for Frontend:**

```
https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/api/v1
```

**Quick Test:**

```bash
curl https://prt-backend-g9abh2fjdngzcpdc.canadacentral-01.azurewebsites.net/health
```

Good luck! 🚀
