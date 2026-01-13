# Deploy Driver App Backend to Azure Web App

> **⚡ Quick Deploy:** Run `./deploy-azure.sh` and follow the prompts (5 minutes)

## 📖 Documentation Overview

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **AZURE_DEPLOYMENT_SUMMARY.md** | 📦 Complete package overview | Start here! |
| **AZURE_QUICK_START.md** | 🚀 5-minute quick start | First deployment |
| **AZURE_DEPLOYMENT_GUIDE.md** | 📚 Comprehensive guide (500+ lines) | Detailed reference |
| **AZURE_DEPLOYMENT_CHECKLIST.md** | ✅ Step-by-step checklist | Track progress |
| **DEPLOYMENT_COMPARISON.md** | ⚖️ Platform comparison | Choose platform |
| **backend/DEPLOYMENT.md** | 🔧 Backend-specific guide | Technical details |

## 🎯 Three Ways to Deploy

### 1️⃣ Automated Script (Recommended)
```bash
./deploy-azure.sh
```
- ⏱️ Time: 5-10 minutes
- 🎓 Difficulty: Easy
- ✅ Best for: Everyone

### 2️⃣ Azure Portal (GUI)
See: `AZURE_QUICK_START.md`
- ⏱️ Time: 15 minutes
- 🎓 Difficulty: Easy
- ✅ Best for: Visual learners

### 3️⃣ Azure CLI (Manual)
See: `AZURE_DEPLOYMENT_GUIDE.md` → Option B
- ⏱️ Time: 10 minutes
- 🎓 Difficulty: Medium
- ✅ Best for: CLI experts

## 🎬 Quick Start

### Step 1: Prerequisites (2 minutes)

```bash
# Install Azure CLI
brew install azure-cli  # macOS
# or download from: https://aka.ms/installazurecliwindows

# Create MongoDB Atlas account
# Visit: https://www.mongodb.com/cloud/atlas
# Create free M0 cluster and get connection string
```

### Step 2: Deploy (5 minutes)

```bash
# Make script executable
chmod +x deploy-azure.sh

# Run deployment
./deploy-azure.sh
```

Follow the prompts to provide:
- Resource group name
- Azure region
- App name (must be unique)
- MongoDB connection string
- Frontend domain for CORS

### Step 3: Verify (1 minute)

```bash
# Test your deployment
curl https://your-app-name.azurewebsites.net/health

# Should return: {"status": "healthy"}
```

### Step 4: Update Frontend

```typescript
// Update API URL in your frontend
const API_BASE_URL = 'https://your-app-name.azurewebsites.net/api/v1';
```

**Done! 🎉**

## 📋 What You Need

### Required
- ✅ Azure account ([Free signup](https://azure.microsoft.com/free/) - $200 credit)
- ✅ MongoDB Atlas ([Free cluster](https://www.mongodb.com/cloud/atlas))
- ✅ Azure CLI ([Install guide](https://docs.microsoft.com/cli/azure/install-azure-cli))

### Optional
- GitHub account (for CI/CD)
- Custom domain (for production)

## 💰 Pricing

| Tier | Cost | Resources | Best For |
|------|------|-----------|----------|
| **F1 (Free)** | $0/mo | 60 min/day CPU | Testing |
| **B1 (Basic)** | $13/mo | 1.75 GB RAM | Production ⭐ |
| **S1 (Standard)** | $70/mo | Auto-scaling | High traffic |
| **P1V2 (Premium)** | $100/mo | High performance | Enterprise |

**Recommendation:** Start with F1 for testing, upgrade to B1 for production.

## 🆘 Common Issues

### "App name not available"
App name must be globally unique. Try: `driver-app-backend-yourname`

### "Connection refused" or 502 Error
1. Check logs: `az webapp log tail --resource-group driver-app-rg --name your-app`
2. Verify MongoDB connection string
3. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0)

### CORS Errors
Update `ALLOWED_ORIGINS` in Azure Configuration:
```
ALLOWED_ORIGINS=https://your-frontend.com,https://www.your-frontend.com
```

### "Module not found"
Make sure `requirements.txt` includes all dependencies and `gunicorn` is installed.

**More help:** See `AZURE_DEPLOYMENT_GUIDE.md` → Troubleshooting

## 📊 Monitoring

### View Real-Time Logs
```bash
az webapp log tail --resource-group driver-app-rg --name your-app-name
```

### Enable Application Insights
1. Azure Portal → Your Web App
2. Application Insights → Turn on
3. Monitor performance, errors, and usage

### Health Checks
Azure monitors `/health` endpoint automatically

## 🔄 Update Your App

### Option 1: Automated (GitHub Actions)
1. Push to main branch
2. GitHub Actions deploys automatically
3. See `.github/workflows/azure-deploy.yml`

### Option 2: Manual Deploy
```bash
cd backend
zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"
az webapp deployment source config-zip \
  --resource-group driver-app-rg \
  --name your-app-name \
  --src deploy.zip
```

### Option 3: Re-run Script
```bash
./deploy-azure.sh
```

## 🔐 Security Checklist

- ✅ Use strong `SECRET_KEY` (generate with `openssl rand -hex 32`)
- ✅ Set `DEBUG=False` in production
- ✅ Whitelist specific CORS origins (not `*`)
- ✅ Use HTTPS only (enabled by default)
- ✅ Keep MongoDB credentials secure
- ✅ Regularly update dependencies
- ✅ Enable monitoring and alerts

## 📚 Full Documentation

For detailed information, see:

1. **[AZURE_DEPLOYMENT_SUMMARY.md](./AZURE_DEPLOYMENT_SUMMARY.md)** - Complete overview
2. **[AZURE_QUICK_START.md](./AZURE_QUICK_START.md)** - Quick start guide
3. **[AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md)** - Comprehensive guide
4. **[AZURE_DEPLOYMENT_CHECKLIST.md](./AZURE_DEPLOYMENT_CHECKLIST.md)** - Deployment checklist
5. **[DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md)** - Platform comparison

## 🎓 Learn More

- [Azure Web Apps](https://docs.microsoft.com/azure/app-service/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Python on Azure](https://docs.microsoft.com/azure/app-service/quickstart-python)

## 🤝 Need Help?

1. **Check documentation** files above
2. **View logs** for error messages
3. **Azure Support** via portal
4. **Community** on Stack Overflow

## ✨ Next Steps

After deployment:

1. ✅ Test all API endpoints
2. ✅ Update frontend configuration
3. ✅ Deploy frontend
4. ✅ Set up monitoring
5. ✅ Configure custom domain (optional)
6. ✅ Set up CI/CD
7. ✅ Go live! 🚀

---

**Ready to deploy?** Run `./deploy-azure.sh` now! ⚡

**Questions?** Check `AZURE_DEPLOYMENT_SUMMARY.md` for complete overview.

---

Made with ❤️ for Driver App | Deploy in 5 minutes | Production-ready
