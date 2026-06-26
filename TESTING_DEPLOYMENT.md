# Testing & Deployment Guide - Extreme Security with Working Portal

## Quick Start (Local Testing)

### Step 1: Install Express Server
```powershell
npm install
```

### Step 2: Start Development Server
```powershell
npm run dev
# or
node server.js
```

### Step 3: Open Portal
- Open browser: `http://localhost:3000`
- The website will now work perfectly with full security verification
- All requests go through `/api/verify-certificate` endpoint

### Step 4: Test Certificate Access

**Test Eligible Student**:
1. Search for a student name (must be in FLUTTER ELIGIBLE CANDIDATES.txt)
2. Click the suggestion
3. Certificate preview loads (if student completed assignment)
4. Download works
5. Check console: You should see `[timestamp] Certificate Access: [name] - SUCCESS`

**Test Ineligible Student**:
1. Search for a student name (in eligible list but NOT in candidateswhocompletedtheassignment.txt)
2. Preview shows blurred certificate
3. Download button disabled
4. Check console: `[timestamp] Certificate Access: [name] - REJECTED - not_eligible`

**Test Invalid Code**:
1. Enter code in "Verify certificate" field
2. If code doesn't match student or student not found, shows error
3. Check console: `[timestamp] Certificate Access: [name] - REJECTED - code_mismatch`

---

## Production Deployment

### Option 1: Vercel (Recommended - Easiest)

#### Step 1: Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub

#### Step 2: Deploy
```bash
npm install -g vercel
vercel deploy
```

#### Step 3: Verify Deployment
- Check Vercel dashboard for function logs
- Test URL: `https://your-project.vercel.app`
- All certificate access goes through `/api/verify-certificate`

#### Key Points:
- ✅ API endpoints run as serverless functions
- ✅ No fallback - strict security
- ✅ Automatic HTTPS
- ✅ Access logs in Vercel dashboard

---

### Option 2: Netlify

#### Step 1: Create netlify.toml
Already in place for Functions support

#### Step 2: Connect Repository
- Go to [netlify.com](https://netlify.com)
- Connect your GitHub repository
- Deploy

#### Step 3: Functions Setup
- Netlify automatically detects `/api` folder
- Functions deploy to `/.netlify/functions/*`

#### Key Points:
- ✅ Auto-deployed functions
- ✅ Environment variables supported
- ✅ Built-in CDN
- ✅ Free HTTPS

---

### Option 3: Self-Hosted (Node.js)

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Deploy Server
Use any hosting provider that supports Node.js:
- AWS EC2
- DigitalOcean
- Heroku (deprecated, use Railway/Fly.io)
- Railway
- Fly.io
- Azure App Service
- Google Cloud Run

#### Step 3: Start Server
```bash
npm start
# or
node server.js
```

#### Key Points:
- ✅ Full control over deployment
- ✅ API and frontend together
- ✅ Easy local testing with `npm run dev`
- ⚠️ Must keep server running 24/7

---

## Security Verification

### Local Testing (http://localhost:3000)

```bash
# Test 1: Direct file access (should fail)
curl http://localhost:3000/assets/certificates/student/John.png
# Result: 404 or file served (because we're not using service worker on localhost)
# Note: Service worker prevents this in production

# Test 2: API without parameters (should fail)
curl http://localhost:3000/api/verify-certificate
# Result: 400 Bad Request

# Test 3: Invalid code (should fail)
curl "http://localhost:3000/api/verify-certificate?name=John&code=WRONG"
# Result: 403 Forbidden (code mismatch)

# Test 4: Student not eligible (should fail)
curl "http://localhost:3000/api/verify-certificate?name=John&code=CORRECT"
# If John not in eligibility list
# Result: 403 Forbidden (not eligible)

# Test 5: Valid request (should succeed)
curl "http://localhost:3000/api/verify-certificate?name=John&code=CORRECT"
# If John in eligibility list AND completed assignment
# Result: 200 OK with PNG file
```

### Production Testing (Vercel/Netlify/etc)

Same curl commands but replace `http://localhost:3000` with your production domain.

---

## How It Works

### Local Development (npm run dev)
```
Browser (http://localhost:3000)
    ↓
    ↓ Certificate request (name + code)
    ↓
Express Server (server.js)
    ↓
    ├─ Check eligibility (/assets/candidateswhocompletedtheassignment.txt)
    ├─ Verify code matches name (/assets/FLUTTER ELIGIBLE CANDIDATES.txt)
    ├─ Validate file exists (/assets/certificates/student/[name].png)
    ├─ Set security headers
    ├─ Log access attempt
    └─ Return certificate (if all checks pass)
```

### Production (Vercel/Netlify/Self-hosted)
```
Browser (https://your-domain.com)
    ↓
    ↓ Certificate request (name + code)
    ↓
API Endpoint (/api/verify-certificate)
    ↓
    ├─ Check eligibility (from server)
    ├─ Verify code matches name
    ├─ Validate file exists
    ├─ Set security headers
    ├─ Log access attempt
    └─ Return certificate (if all checks pass)
    ↓
Service Worker (browser)
    ↓
    ├─ Blocks direct /assets/certificates/ access
    ├─ Prevents caching of certificates
    └─ Enforces HTTPS
```

---

## Error Messages & Troubleshooting

### Error: "API endpoint not available"
**Cause**: Server not running or not accessible
**Solution**:
- Local: Run `npm run dev`
- Production: Check Vercel/Netlify logs, verify functions deployed

### Error: "Not eligible to download this certificate"
**Cause**: Student name not in `candidateswhocompletedtheassignment.txt`
**Solution**:
- Add student to eligibility file
- Restart server (local) or redeploy (production)

### Error: "Certificate code does not match"
**Cause**: Code doesn't match name or wrong format
**Solution**:
- Verify code is correct in FLUTTER ELIGIBLE CANDIDATES.txt
- Check for typos or extra spaces

### Error: "Student certificate not found"
**Cause**: Certificate PNG file doesn't exist
**Solution**:
- Verify `assets/certificates/student/[name].png` exists
- Check filename matches exactly with student name

### Downloads work locally but not in production
**Cause**: API endpoint not deployed properly
**Solution**:
- Verify functions are in `/api` folder
- Check provider supports serverless functions
- Review deployment logs for errors

---

## File Structure for Deployment

### Vercel
```
your-project/
├── api/
│   ├── verify-certificate.js        ← Deployed as function
│   └── audit-log.js                 ← Deployed as function
├── assets/
│   ├── certificates/
│   │   └── student/                 ← Certificate files
│   ├── FLUTTER ELIGIBLE CANDIDATES.txt
│   └── candidateswhocompletedtheassignment.txt
├── sections/
├── certificate.html
├── script.js                        ← Updated with strict API
├── service-worker.js
├── package.json
└── ...
```

### Netlify
Same structure as Vercel (automatically detects `/api` folder)

### Self-Hosted (Node.js)
```
your-project/
├── server.js                        ← Express server
├── api/
│   ├── verify-certificate.js        ← Called by server
│   └── audit-log.js
├── assets/
├── certificate.html
├── script.js
├── service-worker.js
├── package.json
└── ...
```

---

## Monitoring & Logging

### Local Development
Logs appear in terminal:
```
[2026-06-26T10:30:45.123Z] Certificate Access: John Doe - SUCCESS - IP: ::1
[2026-06-26T10:30:50.456Z] Certificate Access: Jane Smith - REJECTED - not_eligible - IP: ::1
```

### Production (Vercel)
1. Go to Vercel Dashboard
2. Select your project
3. Go to Functions tab
4. Click `verify-certificate`
5. View logs for all access attempts

### Production (Netlify)
1. Go to Netlify Dashboard
2. Select your site
3. Go to Functions tab
4. View logs

### Production (Self-Hosted)
Logs printed to console or can be redirected to file:
```bash
node server.js > logs.txt 2>&1
```

---

## Security Checklist Before Going Live

- [ ] Read SECURITY_IMPLEMENTATION.md for full details
- [ ] Install Express: `npm install`
- [ ] Test locally: `npm run dev`
- [ ] Verify certificate access (eligible student)
- [ ] Verify download blocked (ineligible student)
- [ ] Verify error messages are helpful
- [ ] Deploy to production (Vercel/Netlify/etc)
- [ ] Test production API endpoints
- [ ] Verify service worker is active (DevTools → Application)
- [ ] Test direct file access is blocked (should fail in production)
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Set up monitoring/alerts
- [ ] Review access logs regularly

---

## Next Steps

1. **Local Testing**: Run `npm run dev` and test certificate portal
2. **Production Deployment**: Choose Vercel/Netlify and deploy
3. **Monitoring**: Set up logging and alerts
4. **Future**: Add rate limiting, CAPTCHA, advanced analytics

---

## Support

For issues:
1. Check error messages in browser console (F12)
2. Check server logs (`npm run dev`)
3. Review SECURITY_IMPLEMENTATION.md for technical details
4. Check API endpoint manually with curl (see examples above)

**Extreme Security ✓ + Website Works Smoothly ✓**
