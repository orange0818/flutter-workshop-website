# Production Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment Verification

### Setup Verification
- [ ] Run `npm install` - all dependencies installed
- [ ] Run `npm run verify` - all files verified
- [ ] Run `npm run dev` - development server starts
- [ ] Certificate portal loads at `http://localhost:3000`
- [ ] Service worker appears in DevTools (Application → Service Workers)

### File Verification
- [ ] `server.js` exists and is production-ready
- [ ] `api/verify-certificate.js` exists with security checks
- [ ] `api/audit-log.js` exists for logging
- [ ] `service-worker.js` exists and blocks direct file access
- [ ] `script.js` uses API endpoint (no fallback)
- [ ] All certificate PNG files in `assets/certificates/student/`

### Data Files
- [ ] `assets/FLUTTER ELIGIBLE CANDIDATES.txt` has student list
- [ ] `assets/candidateswhocompletedtheassignment.txt` has completion list
- [ ] File formats are correct (tab-separated, proper headers)
- [ ] Student names match exactly between files

### Security Headers
- [ ] X-Content-Type-Options: nosniff ✓
- [ ] X-Frame-Options: DENY ✓
- [ ] X-XSS-Protection: 1; mode=block ✓
- [ ] Cache-Control: no-cache on certificates ✓
- [ ] HTTPS redirect enabled in production ✓

## Testing Before Deployment

### Functional Testing
- [ ] Eligible student: Can view and download certificate
- [ ] Ineligible student: Sees blurred preview, download disabled
- [ ] Invalid code: Shows error message
- [ ] Invalid name: Shows error message
- [ ] Missing file: Shows appropriate error

### Security Testing
```bash
# Test 1: Direct file access blocked (should fail in production)
curl https://your-domain.com/assets/certificates/student/John.png
# Expected: Service worker blocks or 403

# Test 2: API without parameters (should fail)
curl https://your-domain.com/api/verify-certificate
# Expected: 400 Bad Request

# Test 3: Invalid code (should fail)
curl "https://your-domain.com/api/verify-certificate?name=John&code=WRONG"
# Expected: 403 Forbidden

# Test 4: Valid request (should succeed)
curl "https://your-domain.com/api/verify-certificate?name=John&code=ABC123"
# Expected: 200 OK with certificate
```

### Performance Testing
- [ ] Page loads in < 3 seconds
- [ ] Certificate download completes quickly
- [ ] No console errors
- [ ] No broken images/resources
- [ ] Compression working (check response headers)

### Browser Compatibility
- [ ] Chrome/Chromium: Works
- [ ] Firefox: Works
- [ ] Safari: Works
- [ ] Edge: Works
- [ ] Mobile browsers: Works

## Environment Configuration

### Production Environment (.env)
```
NODE_ENV=production
PORT=3000
ENABLE_HTTPS=true
LOG_LEVEL=info
```

### Security
- [ ] HTTPS is enabled
- [ ] SSL/TLS certificate is valid
- [ ] Domain is whitelisted
- [ ] CORS configured for same-origin only
- [ ] No debug mode enabled

## Deployment Platform Setup

### Vercel Deployment
- [ ] Vercel account created
- [ ] Project connected to GitHub
- [ ] Environment variables set
- [ ] Functions deployed successfully
- [ ] Domain configured (or use Vercel domain)
- [ ] HTTPS enabled (automatic)

### Netlify Deployment
- [ ] Netlify account created
- [ ] Site connected to GitHub
- [ ] Functions detected and deployed
- [ ] Environment variables set
- [ ] Domain configured
- [ ] HTTPS enabled (automatic)

### Self-Hosted Deployment
- [ ] Node.js ≥16.0.0 installed
- [ ] PM2/systemd configured for restart
- [ ] Nginx/reverse proxy configured
- [ ] SSL certificate configured
- [ ] Firewall allows port 3000 (or configured port)
- [ ] Monitoring tool installed (optional)

## Monitoring & Logging Setup

### Log Collection
- [ ] Vercel/Netlify logs accessible
- [ ] Error tracking service configured (optional)
  - [ ] Sentry account (optional)
  - [ ] DataDog account (optional)
  - [ ] LogRocket account (optional)
- [ ] Log files backed up

### Alerts
- [ ] High error rate alert set (>5% failures)
- [ ] Server down alert set
- [ ] Unusual access pattern alert (optional)
- [ ] Alert recipients configured

### Monitoring Metrics
- [ ] Response time tracked
- [ ] Error rate tracked
- [ ] Certificate access volume tracked
- [ ] Failed verifications tracked

## Backup & Recovery

### Data Backup
- [ ] Certificate files backed up
- [ ] Student data files backed up
- [ ] Eligibility list backed up
- [ ] Backup location secure and off-site
- [ ] Backup frequency: Daily/Weekly

### Recovery Plan
- [ ] Disaster recovery procedure documented
- [ ] Rollback plan documented
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

## Documentation

### Deployment Documentation
- [ ] Deployment steps documented
- [ ] Environment setup documented
- [ ] Configuration documented
- [ ] Monitoring setup documented
- [ ] Emergency contacts listed

### User Documentation
- [ ] User guide created
- [ ] FAQ documentation
- [ ] Support email configured
- [ ] Troubleshooting guide created

### Developer Documentation
- [ ] API documentation created
- [ ] Code comments sufficient
- [ ] Architecture documented
- [ ] Security documentation up-to-date

## Post-Deployment

### Immediate (First Hour)
- [ ] Service status: ✓ OK
- [ ] No error logs
- [ ] API responding normally
- [ ] Certificate downloads working
- [ ] Security checks passing

### Short-term (First Day)
- [ ] Monitor error rate (should be < 1%)
- [ ] Monitor performance metrics
- [ ] Monitor certificate access patterns
- [ ] Verify backups working
- [ ] Get team feedback

### Long-term (First Week)
- [ ] Analyze usage patterns
- [ ] Check monitoring alerts
- [ ] Review security logs
- [ ] Verify backup integrity
- [ ] Plan any optimizations

## Rollback Plan

If critical issues occur:

1. **Immediate Actions**
   - [ ] Stop accepting new requests
   - [ ] Notify users
   - [ ] Alert team
   - [ ] Check logs for root cause

2. **Rollback (if needed)**
   - [ ] Revert to previous version
   - [ ] Verify system stability
   - [ ] Test critical functions
   - [ ] Re-enable service

3. **Post-Rollback**
   - [ ] Communicate with users
   - [ ] Schedule incident review
   - [ ] Plan fixes
   - [ ] Update documentation

## Compliance Checklist

### Legal Compliance
- [ ] FERPA compliance verified
- [ ] GDPR compliance verified (if applicable)
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

### Security Compliance
- [ ] Security assessment completed
- [ ] Vulnerability scan completed
- [ ] Penetration testing completed (optional)
- [ ] Security audit passed

## Final Sign-Off

- [ ] All items checked
- [ ] Team approval obtained
- [ ] Stakeholder sign-off received
- [ ] Deployment authorized

### Deployed By: _________________ Date: _________

### Verified By: _________________ Date: _________

---

## Quick Deployment Commands

### Vercel
```bash
npm install -g vercel
vercel deploy --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Self-Hosted
```bash
npm install
npm run build
npm start
```

---

## Support Contacts

- **Technical Support**: [contact info]
- **Emergency**: [phone number]
- **Email**: [support email]

---

**Last Updated**: 2026-06-26
**Next Review**: [schedule date]
