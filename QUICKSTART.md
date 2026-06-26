# Quick Start Guide

Get the certificate portal running in 5 minutes.

## 1. Install Dependencies

```powershell
npm install
```

This installs Express and compression middleware.

## 2. Verify Setup

```powershell
npm run verify
```

This checks that all required files are present and properly configured.

## 3. Run Locally

```powershell
npm run dev
```

Output should look like:
```
======================================================================
✓ Production Server Ready
✓ Environment: development
✓ Port: 3000
✓ Portal: http://localhost:3000
✓ API: http://localhost:3000/api/verify-certificate
✓ Health: http://localhost:3000/health
✓ Eligible students: 48
======================================================================
```

## 4. Open in Browser

Visit: **http://localhost:3000**

## 5. Test Certificate Access

### Test 1: Eligible Student
1. Search for a student name (must be in `FLUTTER ELIGIBLE CANDIDATES.txt`)
2. If they also completed the assignment (in `candidateswhocompletedtheassignment.txt`):
   - ✓ Certificate preview appears
   - ✓ Download button enabled
   - ✓ Click download to get certificate

### Test 2: Eligible but Incomplete
1. Search for a student who's eligible but didn't complete assignment
2. ✓ Blurred certificate preview
3. ✓ Download button disabled

### Test 3: Code Verification
1. Enter certificate code in "Verify certificate" section
2. ✓ If valid: Shows full certificate
3. ✓ If invalid: Shows error message

## 6. Check Terminal Output

Terminal logs all certificate access:
```
✓ [2026-06-26T10:30:45.123Z] John Doe             | SUCCESS - certificate_delivered | ::1 [15ms]
⚠ [2026-06-26T10:30:50.456Z] Jane Smith           | REJECTED - not_eligible        | ::1 [8ms]
```

## 7. Deploy to Production

### Easy: Vercel
```bash
vercel deploy
```
See `docs/DEPLOY_VERCEL.md` for details.

### Easy: Netlify
Connect GitHub to Netlify dashboard.
See `docs/DEPLOY_NETLIFY.md` for details.

### DIY: Self-Hosted
```bash
npm start
```
See `docs/DEPLOY_SELF_HOSTED.md` for details.

---

## File Structure

```
flask-workshop-website/
├── server.js                 # Express server
├── service-worker.js         # Browser request interception
├── script.js                 # Portal JavaScript (uses API)
├── certificate.html          # Portal UI
├── package.json              # Dependencies
├── api/
│   ├── verify-certificate.js # Certificate verification
│   └── audit-log.js          # Access logging
└── assets/
    ├── FLUTTER ELIGIBLE CANDIDATES.txt
    ├── candidateswhocompletedtheassignment.txt
    └── certificates/student/  # PNG files
```

---

## API Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Test Certificate Download
```bash
# Replace John with actual student name, ABC123 with actual code
curl "http://localhost:3000/api/verify-certificate?name=John&code=ABC123"
```

---

## Common Issues

### "API endpoint not available"
- **Fix**: Make sure server is running (`npm run dev`)

### "Not eligible to download"
- **Fix**: Student must be in BOTH files:
  1. `assets/FLUTTER ELIGIBLE CANDIDATES.txt`
  2. `assets/candidateswhocompletedtheassignment.txt`

### "Certificate code does not match"
- **Fix**: Verify code in `FLUTTER ELIGIBLE CANDIDATES.txt` matches entered code

### "Certificate file not found"
- **Fix**: Verify PNG file exists in `assets/certificates/student/[NAME].png`

---

## Next Steps

1. **Local Testing Complete?** → Try deploying to production
2. **Want to Customize?** → Edit `script.js` and `style.css`
3. **Need HTTPS?** → Deploy to Vercel/Netlify (automatic) or use Let's Encrypt (self-hosted)
4. **Need Monitoring?** → Check `docs/PRODUCTION_CHECKLIST.md`

---

## Documentation

- `README.md` - Project overview
- `SECURITY_IMPLEMENTATION.md` - Security details
- `PRODUCTION_CHECKLIST.md` - Pre-deployment checklist
- `docs/DEPLOY_VERCEL.md` - Vercel deployment
- `docs/DEPLOY_NETLIFY.md` - Netlify deployment
- `docs/DEPLOY_SELF_HOSTED.md` - Self-hosted deployment

---

## Support

For issues:
1. Check browser console (F12)
2. Check terminal output
3. Review documentation
4. Check API response: `curl http://localhost:3000/api/verify-certificate`

---

**Status**: ✅ Ready to Run
**Time to Deploy**: < 5 minutes locally, 2-3 minutes to production
**Questions?**: Check documentation in `docs/` folder
