/**
 * Production-Ready Express Server
 * 
 * Handles:
 * - Certificate portal serving
 * - API verification endpoint
 * - Security headers and middleware
 * - Access logging and monitoring
 * - Error handling
 * 
 * Environment Variables:
 * - PORT (default: 3000)
 * - NODE_ENV (development|production)
 * 
 * Usage:
 *   Development: npm run dev
 *   Production: npm start
 */

import express from 'express';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Compression
app.use(compression());

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HTTPS enforcement in production
  if (isProduction && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  
  next();
});

// CORS (allow same-origin only)
app.use((req, res, next) => {
  const origin = req.get('origin');
  const host = req.get('host');
  
  // Only allow requests from same origin
  if (origin && origin.includes(host)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname, {
  maxAge: isDevelopment ? 0 : '1h',
  etag: false
}));

// ============================================================================
// UTILITIES
// ============================================================================

// Load eligible candidates at startup
function loadEligibleCandidates() {
  try {
    const filePath = path.join(__dirname, 'assets/candidateswhocompletedtheassignment.txt');
    if (!fs.existsSync(filePath)) {
      console.error('❌ Error: eligibility file not found');
      console.error(`   Expected: ${filePath}`);
      process.exit(1);
    }
    const candidates = fs.readFileSync(filePath, 'utf8');
    const set = new Set(
      candidates.split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean)
    );
    console.log(`✓ Loaded ${set.size} eligible candidates`);
    return set;
  } catch (e) {
    console.error('❌ Failed to load eligible candidates:', e.message);
    process.exit(1);
  }
}

// Validate filename to prevent directory traversal
function validateFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return false;
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) return false;
  if (!fileName.endsWith('.png')) return false;
  return /^[a-zA-Z0-9\s\-_.]+\.png$/.test(fileName);
}

// Request logging with proper formatting
function logAccess(studentName, status, ip, responseTime) {
  const timestamp = new Date().toISOString();
  const emoji = status.includes('SUCCESS') ? '✓' : status.includes('ERROR') ? '❌' : '⚠';
  const timeStr = responseTime ? ` [${responseTime}ms]` : '';
  console.log(`${emoji} [${timestamp}] ${studentName.padEnd(20)} | ${status.padEnd(35)} | ${ip}${timeStr}`);
}

const ELIGIBLE_CANDIDATES = loadEligibleCandidates();

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    eligibleStudents: ELIGIBLE_CANDIDATES.size
  });
});

// Certificate verification and serving endpoint
app.get('/api/verify-certificate', (req, res) => {
  const startTime = Date.now();
  const { name, code } = req.query;
  const clientIP = req.ip || req.connection.remoteAddress;

  try {
    // Validate inputs
    if (!name || !code || typeof name !== 'string' || typeof code !== 'string') {
      logAccess(name || 'unknown', 'REJECTED - invalid_params', clientIP, Date.now() - startTime);
      return res.status(400).json({ 
        error: 'Missing or invalid parameters',
        required: { name: 'string', code: 'string' }
      });
    }

    const normalizedName = name.trim();
    const normalizedCode = String(code).trim().toLowerCase();

    // Validate filename security
    if (!validateFileName(`${normalizedName}.png`)) {
      logAccess(normalizedName, 'REJECTED - invalid_filename', clientIP, Date.now() - startTime);
      return res.status(400).json({ error: 'Invalid file name format' });
    }

    // Check eligibility
    if (!ELIGIBLE_CANDIDATES.has(normalizedName.toLowerCase())) {
      logAccess(normalizedName, 'REJECTED - not_eligible', clientIP, Date.now() - startTime);
      return res.status(403).json({ error: 'Not eligible to download this certificate' });
    }

    // Load student records
    const studentsFile = path.join(__dirname, 'assets/FLUTTER ELIGIBLE CANDIDATES.txt');
    if (!fs.existsSync(studentsFile)) {
      console.error(`❌ Student records file not found: ${studentsFile}`);
      logAccess(normalizedName, 'ERROR - server_config', clientIP, Date.now() - startTime);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const studentsData = fs.readFileSync(studentsFile, 'utf8');
    const rows = studentsData.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
    
    if (rows.length < 2) {
      logAccess(normalizedName, 'ERROR - no_records', clientIP, Date.now() - startTime);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Parse headers and find columns
    const headers = rows[0].split(/\t+/).map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h === 'name');
    const codeIdx = headers.findIndex(h => /unique\s*code/i.test(h));

    if (nameIdx < 0 || codeIdx < 0) {
      console.error('❌ Invalid column headers in student file');
      logAccess(normalizedName, 'ERROR - parsing', clientIP, Date.now() - startTime);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Find matching student
    const student = rows.slice(1).find(row => {
      const cols = row.split(/\t+/).map(c => c.trim());
      return cols[nameIdx]?.toLowerCase() === normalizedName.toLowerCase();
    });

    if (!student) {
      logAccess(normalizedName, 'REJECTED - student_not_found', clientIP, Date.now() - startTime);
      return res.status(404).json({ error: 'Student certificate not found' });
    }

    // Verify code matches
    const cols = student.split(/\t+/).map(c => c.trim());
    const studentCode = String(cols[codeIdx] || '').trim().toLowerCase();

    if (studentCode !== normalizedCode) {
      logAccess(normalizedName, 'REJECTED - code_mismatch', clientIP, Date.now() - startTime);
      return res.status(403).json({ error: 'Certificate code does not match' });
    }

    // Verify certificate file exists
    const certPath = path.join(__dirname, `assets/certificates/student/${normalizedName}.png`);
    if (!fs.existsSync(certPath)) {
      console.error(`❌ Certificate file not found: ${certPath}`);
      logAccess(normalizedName, 'REJECTED - file_not_found', clientIP, Date.now() - startTime);
      return res.status(404).json({ error: 'Certificate file not found' });
    }

    // Read certificate file
    const fileBuffer = fs.readFileSync(certPath);

    // Set security and caching headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Disposition', `attachment; filename="${normalizedName}_certificate.png"`);
    res.setHeader('Content-Length', fileBuffer.length);

    logAccess(normalizedName, 'SUCCESS - certificate_delivered', clientIP, Date.now() - startTime);
    return res.status(200).send(fileBuffer);

  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    logAccess(name || 'unknown', `ERROR - ${error.message}`, clientIP, Date.now() - startTime);
    return res.status(500).json({ 
      error: isProduction ? 'Server error' : error.message
    });
  }
});

// Audit logging endpoint
app.post('/api/audit-log', (req, res) => {
  try {
    const logData = req.body;
    if (!logData) {
      return res.status(400).json({ error: 'No log data provided' });
    }
    
    // In production, integrate with external logging service
    if (isProduction) {
      // TODO: Send to Sentry, DataDog, LogRocket, etc.
      console.log('[AUDIT]', JSON.stringify(logData));
    } else {
      console.log('[AUDIT]', logData);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Audit logging error:', error.message);
    return res.status(500).json({ error: 'Logging failed' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: isProduction ? 'Internal server error' : err.message,
    ...(isDevelopment && { stack: err.stack })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`✓ Production Server Ready`);
  console.log(`✓ Environment: ${NODE_ENV}`);
  console.log(`✓ Port: ${PORT}`);
  console.log(`✓ Portal: http://localhost:${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api/verify-certificate`);
  console.log(`✓ Health: http://localhost:${PORT}/health`);
  console.log(`✓ Eligible students: ${ELIGIBLE_CANDIDATES.size}`);
  console.log(`${'='.repeat(70)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n✓ SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n✓ SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;
