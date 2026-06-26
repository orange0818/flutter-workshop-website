# Netlify Deployment Guide

Step-by-step guide for deploying the certificate portal to Netlify.

## Prerequisites

- Netlify account (free at netlify.com)
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

### Step 2: Create netlify.toml

Netlify needs configuration file (should already exist):

```toml
[build]
  command = "npm run build"
  functions = "api"
  publish = "."

[functions]
  node_bundler = "esbuild"
  external_node_modules = []

[[redirects]]
  from = "/api/verify-certificate"
  to = "/.netlify/functions/verify-certificate"
  status = 200

[[redirects]]
  from = "/api/audit-log"
  to = "/.netlify/functions/audit-log"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/certificates/*"
  [headers.values]
    Cache-Control = "no-store, no-cache, must-revalidate, private"
```

### Step 3: Connect to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site"
3. Select "Import an existing project"
4. Choose GitHub
5. Authorize Netlify access to GitHub
6. Select your repository
7. Click "Deploy site"

### Step 4: Configure Settings

1. In Netlify dashboard, go to "Site settings"
2. Go to "Build & deploy" → "Build settings"
3. Verify:
   - **Build command**: `npm run build`
   - **Publish directory**: `.`
   - **Functions directory**: `api`

### Step 5: Environment Variables

1. Go to "Site settings" → "Build & deploy" → "Environment"
2. Add variables:
   ```
   NODE_ENV = production
   LOG_LEVEL = info
   ```

### Step 6: Deploy

1. Netlify automatically starts build
2. Wait for "Site deploy" to complete (2-3 minutes)
3. Your site is live at `https://your-site-name.netlify.app`

## Post-Deployment

### Verify Deployment

```bash
# Check site
curl https://your-site-name.netlify.app/health

# Test API
curl "https://your-site-name.netlify.app/api/verify-certificate?name=test&code=test"
```

### Configure Custom Domain

1. Go to Netlify dashboard
2. Go to "Site settings" → "Domain management"
3. Click "Add custom domain"
4. Enter your domain
5. Follow DNS setup instructions

### Monitor Functions

1. Go to "Functions" tab
2. View logs for `verify-certificate` and `audit-log`
3. Monitor error rates and performance

## Automatic Deployments

Netlify automatically deploys:
- **On push to main**: Production deployment
- **On pull requests**: Deploy preview

To deploy a new version:
```bash
git push origin main
# Netlify automatically builds and deploys
```

## Rollback

To rollback to previous deployment:

1. Go to "Deploys" tab
2. Find the previous working deployment
3. Click "Restore this deploy"

## Environment Configuration

### Production
```
NODE_ENV=production
REQUIRE_HTTPS=true
LOG_LEVEL=warn
```

### Staging (Optional Preview)
```
NODE_ENV=staging
LOG_LEVEL=info
```

## Troubleshooting

### Build Failed
- Check build logs in Netlify dashboard
- Verify `npm run build` succeeds locally
- Check for missing environment variables

### Functions Not Deploying
- Verify `api/` folder structure
- Check function files are `.js` files
- Ensure proper exports

### Certificate Download Fails
- Check certificate files in `assets/certificates/student/`
- Verify eligibility list files
- Review function logs in Netlify

### HTTPS Issues
- Netlify auto-provisions SSL certificates
- Wait 5-10 minutes for certificate
- Check domain DNS configuration

## Performance Optimization

### Caching

Configure cache in `netlify.toml`:
```toml
[[headers]]
  for = "*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store"
```

### CDN

Netlify includes global CDN:
- Automatic edge caching
- Reduced latency worldwide
- No additional configuration

## Security

### HTTPS
- ✅ Automatic SSL/TLS
- ✅ Auto-renewal
- ✅ HSTS support

### DDoS Protection
- ✅ Automatic protection
- ✅ Rate limiting
- ✅ Bot detection

### Environment Variables
- ✅ Encrypted storage
- ✅ Not exposed to client
- ✅ Secure access logs

## Monitoring & Logging

### Netlify Analytics
- Function execution time
- Error rates
- Build time

### Integrations
- Sentry (error tracking)
- Datadog (APM)
- LogRocket (user monitoring)

## Pricing

### Free Tier Includes
- ✅ Unlimited deployments
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Serverless functions (125,000 invocations/month)

### Pro Tier
- More function invocations
- Enhanced support
- Advanced features

For certificate portal, **Free tier is sufficient**.

## Support

- **Netlify Docs**: https://docs.netlify.com
- **Support**: https://support.netlify.com
- **Community**: https://community.netlify.com

## Deployment Checklist

Before deploying:

- [ ] Code pushed to GitHub
- [ ] `netlify.toml` configured
- [ ] Environment variables set
- [ ] Certificate files present
- [ ] Student data files configured
- [ ] Local testing passed
- [ ] README updated

## Quick Reference

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy manually
netlify deploy

# Deploy to production
netlify deploy --prod

# View logs
netlify logs

# List deployments
netlify api listSiteDeploys --site-id=YOUR_SITE_ID
```

---

**Status**: Ready to Deploy ✓
**Estimated Deployment Time**: 2-3 minutes
**Next Step**: Connect GitHub to Netlify and deploy
