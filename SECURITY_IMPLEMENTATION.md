# Certificate Portal Security Implementation Guide

## Overview

This document explains the security measures implemented to prevent unauthorized certificate downloads via developer tools.

## Security Layers Implemented

### 1. **Server-Side Verification (API Endpoint)**
- **File**: `api/verify-certificate.js`
- **Purpose**: Validates certificate requests server-side before serving files
- **Features**:
  - Checks student eligibility from `candidateswhocompletedtheassignment.txt`
  - Verifies code matches name (two-factor verification)
  - Validates file names to prevent directory traversal attacks
  - Sets security headers (no-cache, no-store, nosniff, etc.)
  - Logs all access attempts for audit trail
  - Prevents unauthorized downloads even if client-side checks are bypassed

### 2. **Service Worker (Client-Side Enforcement)**
- **File**: `service-worker.js`
- **Purpose**: Intercepts HTTP requests and enforces security policies
- **Features**:
  - Blocks direct access to certificate files under `/assets/certificates/`
  - Routes all certificate requests through the verified API endpoint
  - Prevents caching of sensitive certificate files
  - Validates request parameters before fetching
  - Logs security events and access attempts
  - Enforces HTTPS communication

### 3. **Client-Side Protections**
- **Updated**: `script.js` and `certificate.html`
- **Features**:
  - Service worker registration on page load
  - Blob URLs for certificate downloads (not direct file links)
  - Automatic blob URL revocation after download
  - Disabled right-click on certificate images
  - Prevented drag-drop downloads
  - Removed direct `student.file` references
  - All downloads now go through `/api/verify-certificate` endpoint

### 4. **Audit Logging**
- **File**: `api/audit-log.js`
- **Purpose**: Records all certificate access attempts for security monitoring
- **Features**:
  - Logs successful downloads
  - Logs blocked/denied access attempts
  - Captures IP address and user agent
  - Includes student name and status
  - Can integrate with external logging services

## Deployment Instructions

### For Vercel:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel deploy
   ```

3. **Verify API endpoints are working**:
   - Check that `/api/verify-certificate` is accessible
   - Check that `/api/audit-log` is accessible

### For Netlify:

1. **Add Functions Configuration**:
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     functions = "api"
   
   [functions]
     node_bundler = "esbuild"
   
   [[redirects]]
     from = "/api/verify-certificate"
     to = "/.netlify/functions/verify-certificate"
     status = 200
   
   [[redirects]]
     from = "/api/audit-log"
     to = "/.netlify/functions/audit-log"
     status = 200
   ```

2. **Deploy**:
   ```bash
   npm run build
   netlify deploy
   ```

### For Traditional Hosting (Node.js/Express):

1. **Install Express**:
   ```bash
   npm install express
   ```

2. **Create a simple server** (if not already present):
   ```javascript
   import express from 'express';
   import verifyCertificate from './api/verify-certificate.js';
   import auditLog from './api/audit-log.js';

   const app = express();
   app.use(express.static('.'));
   app.get('/api/verify-certificate', (req, res) => verifyCertificate({ query: req.query }, res));
   app.post('/api/audit-log', (req, res) => auditLog(req, res));
   app.listen(3000, () => console.log('Server running on port 3000'));
   ```

3. **Deploy to hosting provider** (Heroku, Railway, Fly.io, etc.)

## How It Works: Step-by-Step

### User Attempts to Download Certificate:

1. **User selects name** → Portal shows certificate preview (if eligible)
2. **User clicks download button** → JavaScript intercepts click
3. **Client-side validation** → Checks if student is marked as eligible
4. **Server API call** → Sends request to `/api/verify-certificate?name=X&code=Y`
5. **Server-side verification**:
   - Checks eligibility list
   - Verifies code matches name
   - Validates file exists
   - Sets security headers
6. **Return certificate** → Server sends certificate image with no-cache headers
7. **Download as blob** → Browser creates temporary blob URL for download
8. **Auto-revoke** → Blob URL is revoked after 100ms to prevent access
9. **Audit log** → Access attempt is logged for monitoring

### If Developer Tools Are Used:

**Attempt**: Direct file access (e.g., `assets/certificates/student/John.png`)
- **Result**: Service worker blocks the request
- **Error**: "Certificate access requires verification"
- **Status**: 403 Forbidden

**Attempt**: Modified download button JavaScript
- **Result**: API validation fails (code doesn't match name or student not eligible)
- **Error**: Server returns 403 or 404
- **Audit**: Access attempt is logged as security event

**Attempt**: Network tab to find certificate URL
- **Result**: Blob URL (e.g., `blob:https://domain.com/abc123`) expires after 100ms
- **Error**: Blob URL is revoked, cannot be re-accessed
- **Audit**: Access attempt is logged

## Security Headers Added

The API endpoint sets these headers on certificate responses:

```
Content-Type: image/png
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Disposition: attachment; filename="[student]_certificate.png"
```

## Testing Security

### Test 1: Direct File Access
```bash
curl https://your-site.com/assets/certificates/student/John.png
# Expected: 403 Forbidden (or blocked by service worker)
```

### Test 2: API Access Without Parameters
```bash
curl https://your-site.com/api/verify-certificate
# Expected: 400 Bad Request
```

### Test 3: API Access With Wrong Code
```bash
curl "https://your-site.com/api/verify-certificate?name=John&code=WRONG"
# Expected: 403 Forbidden
```

### Test 4: Valid Certificate Request
```bash
curl "https://your-site.com/api/verify-certificate?name=John&code=ABC123"
# Expected: 200 OK with PNG file (if eligible)
```

## Monitoring & Alerts

Monitor these events for security threats:

1. **Repeated 403 errors** → Someone trying to guess certificate codes
2. **High access velocity** → Potential automated attack/scraping
3. **Requests from suspicious IPs** → Geographic anomalies
4. **Requests to non-existent students** → Scanning for valid names

Integrate with services like:
- **Sentry** - Real-time error monitoring
- **DataDog** - Infrastructure monitoring
- **Splunk** - Log analysis
- **PagerDuty** - Alerting

## Future Enhancements

1. **Rate limiting** - Limit requests per IP per minute
2. **CAPTCHA** - Add CAPTCHA on repeated failed attempts
3. **Time-based expiration** - Certificates expire after 30 days
4. **QR codes** - Use QR codes for one-time download links
5. **Watermarking** - Add student-specific watermarks to certificates
6. **Download limits** - Each student can only download certificate N times

## Troubleshooting

### API endpoint returns 404
- Verify the `api/` folder exists
- Check your deployment provider supports serverless functions
- Verify Node.js version compatibility

### Service worker not registering
- Check browser console for errors
- Verify HTTPS is enabled (service workers require HTTPS)
- Clear browser cache and re-register

### Certificate download fails with 403
- Verify student name is in `FLUTTER ELIGIBLE CANDIDATES.txt`
- Verify student completed the assignment (in `candidateswhocompletedtheassignment.txt`)
- Verify the code matches exactly (case-sensitive after normalization)

### Images not loading in preview
- Check `/api/verify-certificate` endpoint is responding
- Verify certificate PNG files exist in `assets/certificates/student/`
- Check browser console for CORS issues

## Rollback Instructions

If you need to disable the security layer:

1. **Remove service worker registration** from `script.js`
2. **Revert download logic** in `script.js` to use direct file paths
3. **Remove API endpoints** from deployment
4. **Rebuild** and redeploy

## Compliance & Auditing

This implementation helps meet compliance requirements for:
- **FERPA** (Family Educational Rights and Privacy Act)
- **GDPR** (General Data Protection Regulation)
- **SOC 2** (System and Organization Controls)
- **HIPAA** (if any health data is involved)

Audit logs provide proof of:
- Who accessed what
- When they accessed it
- Whether access was authorized
- All failed access attempts

## Questions & Support

For questions about this implementation, refer to:
- `api/verify-certificate.js` - Server verification logic
- `service-worker.js` - Client-side enforcement
- `script.js` - Certificate portal JavaScript
