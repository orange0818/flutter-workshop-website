# Vercel Deployment Guide

Step-by-step guide for deploying the certificate portal to Vercel.

## Prerequisites

- Vercel account (free at vercel.com)
- GitHub account with project repository
- Git installed locally

## Deployment Steps

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Production-ready certificate portal"
git remote add origin https://github.com/YOUR_USERNAME/flutter-workshop-website.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select "Import Git Repository"
4. Paste your GitHub repository URL
5. Click "Continue"

### Step 3: Configure Project

1. **Project Name**: `flutter-workshop-certificate`
2. **Framework Preset**: Select "Other" (Node.js)
3. **Root Directory**: Leave empty (root)
4. **Build Command**: Leave empty
5. **Output Directory**: Leave empty
6. **Install Command**: `npm install`

### Step 4: Environment Variables

1. Click "Environment Variables"
2. Add variables:
   ```
   NODE_ENV = production
   LOG_LEVEL = info
   ```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Your site is now live at `https://flutter-workshop-certificate.vercel.app`

## Post-Deployment

### Verify Deployment

```bash
# Check health
curl https://flutter-workshop-certificate.vercel.app/health

# Test API
curl "https://flutter-workshop-certificate.vercel.app/api/verify-certificate?name=test&code=test"
```

### Configure Custom Domain (Optional)

1. Go to Vercel dashboard
2. Click your project
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Follow DNS configuration steps

### Monitor Functions

1. Go to Vercel dashboard
2. Click your project
3. Go to "Functions"
4. Click `/api/verify-certificate` to view logs
5. Monitor error rates and performance

## Automatic Deployments

After connecting to GitHub, Vercel automatically deploys:
- **On push to main**: Production deployment
- **On pull requests**: Preview deployment

To deploy a new version:
```bash
git push origin main
# Vercel automatically deploys
```

## Rollback

To rollback to a previous deployment:

1. Go to Vercel dashboard
2. Go to "Deployments" tab
3. Find the previous working deployment
4. Click "..."
5. Select "Promote to Production"

## Environment-Specific Configuration

### Production
```
NODE_ENV=production
REQUIRE_HTTPS=true
LOG_LEVEL=warn
```

### Staging (Optional)
```
NODE_ENV=production
REQUIRE_HTTPS=true
LOG_LEVEL=info
```

## Troubleshooting

### Build Failed
- Check build logs in Vercel dashboard
- Verify `npm install` succeeds locally
- Check for environment variable issues

### Functions Not Found
- Verify `/api` folder exists
- Check function files named correctly
- Ensure `package.json` has correct scripts

### Certificate Download Fails
- Verify certificate files in `assets/certificates/student/`
- Check eligibility list files exist
- Review function logs for errors

### HTTPS Issues
- Vercel auto-provisions SSL certificates
- Wait 5-10 minutes for certificate to be issued
- Check domain DNS configuration

## Performance Optimization

### Caching

Vercel automatically caches:
- Static files (CSS, JS, images)
- API responses (configurable)

### CDN

Vercel includes global CDN:
- Assets served from nearest edge location
- Reduces latency worldwide
- No additional cost

## Security

### HTTPS
- ✅ Automatic SSL/TLS certificate
- ✅ Automatic renewal
- ✅ HSTS preloading available

### DDoS Protection
- ✅ Included in all Vercel deployments
- ✅ Automatic rate limiting
- ✅ Bot detection

### Environment Variables
- ✅ Encrypted in transit
- ✅ Not exposed in client code
- ✅ Secure access logs

## Monitoring

### Built-in Monitoring
- ✅ Function execution logs
- ✅ Error tracking
- ✅ Performance metrics
- ✅ Uptime monitoring

### Integrations
- Sentry (error tracking)
- Datadog (monitoring)
- New Relic (APM)

## Pricing

### Free Tier Includes
- ✅ Unlimited deployments
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Serverless functions (400,000 GB-seconds/month)

### Pro Tier
- Enhanced support
- Team collaboration
- Advanced analytics

For certificate portal, **Free tier is sufficient**.

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions

---

## Deployment Checklist

Before clicking deploy:

- [ ] Code pushed to GitHub
- [ ] `.env` file configured
- [ ] Certificate files in `assets/certificates/student/`
- [ ] Student data files configured
- [ ] Local testing passed
- [ ] README.md updated with deployment info
- [ ] Team notified of deployment

## Quick Reference

```bash
# View logs
vercel logs

# List deployments
vercel list

# Switch to production
vercel promote [deployment-url]

# Show current project
vercel ls

# Remove project
vercel remove
```

---

**Status**: Ready to Deploy ✓
**Estimated Deployment Time**: 2-3 minutes
**Next Step**: Follow "Deployment Steps" above
