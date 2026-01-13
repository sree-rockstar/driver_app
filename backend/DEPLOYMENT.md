# Backend Deployment Guide

This document covers deployment options for the Driver App FastAPI backend.

## Deployment Files

- `startup.txt` - Azure Web App startup command
- `requirements.txt` - Python dependencies (includes gunicorn for production)
- `env.template` - Environment variables template
- `Dockerfile` - Docker container configuration
- `passenger_wsgi.py` - cPanel/Passenger WSGI entry point

## Quick Deploy to Azure

```bash
# From project root
./deploy-azure.sh
```

See `../AZURE_QUICK_START.md` for detailed instructions.

## Environment Variables

Required environment variables:

```bash
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=driver_app
SECRET_KEY=generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=https://your-frontend.com
APP_NAME=Driver App API
DEBUG=False
```

## Local Development

```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
python main.py
```

Server runs at: http://localhost:8000

## Production Deployment Options

### 1. Azure Web App (Recommended)
- **Pros**: Easy scaling, managed service, built-in SSL, monitoring
- **Cons**: Cost ($13+/month), requires Azure account
- **Guide**: See `../AZURE_DEPLOYMENT_GUIDE.md`

### 2. Docker Container
- **Pros**: Consistent environment, easy to deploy anywhere
- **Cons**: Requires container orchestration for scaling
- **Command**: 
  ```bash
  docker build -t driver-app-backend .
  docker run -p 8000:8000 --env-file .env driver-app-backend
  ```

### 3. cPanel/Shared Hosting
- **Pros**: Cheap, familiar to many developers
- **Cons**: Limited resources, harder to scale
- **Guide**: See existing cPanel deployment guides

### 4. AWS/GCP/DigitalOcean
- Similar to Azure, adapt the deployment script

## Health Checks

The application provides health check endpoints:

- `/` - Welcome message
- `/health` - Health status
- `/api/v1/openapi.json` - API documentation

## Database

Application uses MongoDB. For production:

1. **MongoDB Atlas** (Recommended)
   - Free tier available
   - Automatic backups
   - Global distribution
   - Easy setup

2. **Self-hosted MongoDB**
   - More control
   - Requires maintenance
   - Setup backup strategy

## File Uploads

Files are stored in the `uploads/` directory:
- `uploads/aadhar/` - Aadhar card documents
- `uploads/driving_licenses/` - Driver licenses
- `uploads/vehicles/` - Vehicle documents and photos

For production, consider:
- Azure Blob Storage
- AWS S3
- Cloudinary
- Local storage with backups

## Security Considerations

1. **Never commit `.env` file** - It's in .gitignore
2. **Use strong SECRET_KEY** - Generate with `openssl rand -hex 32`
3. **Set DEBUG=False** in production
4. **Whitelist CORS origins** - Don't use `*`
5. **Use HTTPS only** - Enabled by default on Azure
6. **Keep dependencies updated** - Run `pip install --upgrade -r requirements.txt`
7. **Monitor logs** - Enable Application Insights on Azure

## Monitoring

### Azure Application Insights
- Request tracking
- Performance monitoring
- Error tracking
- Custom metrics

### Logging
Application logs to:
- Console (stdout/stderr)
- `backend.log` (local development)
- Azure Log Stream (production)

Log levels:
- DEBUG: Detailed information
- INFO: General information
- WARNING: Warning messages
- ERROR: Error messages
- CRITICAL: Critical issues

## Scaling

### Vertical Scaling (More Power)
- Upgrade to higher tier (B2, S1, P1V2)
- More CPU, RAM, storage

### Horizontal Scaling (More Instances)
- Add more instances
- Configure auto-scaling rules
- Requires Standard tier or higher

## Troubleshooting

### Common Issues

**502 Bad Gateway**
- App is starting but timing out
- Check database connection
- Increase startup timeout

**Database Connection Failed**
- Check MONGODB_URL
- Verify MongoDB Atlas IP whitelist
- Test connection string locally

**Module Not Found**
- Check requirements.txt
- Ensure all dependencies are listed
- Rebuild deployment package

**CORS Errors**
- Verify ALLOWED_ORIGINS setting
- Check frontend is using correct API URL
- Ensure credentials are included in requests

### View Logs

**Azure:**
```bash
az webapp log tail --resource-group driver-app-rg --name driver-app-backend
```

**Local:**
```bash
tail -f backend.log
```

## CI/CD

Automated deployment is configured via GitHub Actions:
- `.github/workflows/azure-deploy.yml`
- Triggers on push to main branch
- Requires `AZURE_WEBAPP_PUBLISH_PROFILE` secret

## Backup Strategy

1. **Database**: MongoDB Atlas automatic backups
2. **Files**: Regular backup of uploads/ directory
3. **Code**: Git repository serves as backup

## Cost Optimization

- Use Free tier (F1) for development/testing
- Basic tier (B1) for small production (~$13/month)
- Stop/start app when not needed (Free tier)
- Monitor usage and optimize resources
- Use reserved instances for savings

## Performance Tips

1. **Enable caching** - Add Redis for session caching
2. **Use CDN** - Serve static files via CDN
3. **Optimize database queries** - Add indexes
4. **Compress responses** - Enable gzip compression
5. **Use connection pooling** - Already configured with Motor

## Support

- Azure Support: [portal.azure.com](https://portal.azure.com)
- FastAPI Docs: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- MongoDB Atlas: [cloud.mongodb.com](https://cloud.mongodb.com)

## Useful Commands

```bash
# Test locally
python main.py

# Check dependencies
pip list

# Update dependencies
pip install --upgrade -r requirements.txt

# Create deployment package
zip -r deploy.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"

# Test with production settings
DEBUG=False uvicorn app.main:app --host 0.0.0.0 --port 8000

# Generate secret key
openssl rand -hex 32
```

## Next Steps After Deployment

1. Test all API endpoints
2. Update frontend configuration
3. Set up monitoring and alerts
4. Configure custom domain
5. Enable backups
6. Set up SSL certificate (if using custom domain)
7. Load test the application
8. Document any custom configuration

---

For detailed Azure deployment instructions, see:
- Quick Start: `../AZURE_QUICK_START.md`
- Full Guide: `../AZURE_DEPLOYMENT_GUIDE.md`
