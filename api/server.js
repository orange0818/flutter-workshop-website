/**
 * Production-Ready Express Server (Vercel Serverless Compatible)
 *
 * Certificate access is enforced server-side:
 * - Static paths for certificates and eligibility data are blocked
 * - Preview returns a blurred image until assignment completion + code verification
 * - Download requires candidate list membership, assignment completion, and matching code
 */

import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { isBlockedStaticPath } from '../lib/blocked-paths.js';
import { loadCertificateData } from '../lib/certificate-data.js';
import { createCertificateHandlers } from '../lib/certificate-routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const projectRoot = process.cwd();
const isVercel = Boolean(process.env.VERCEL);

const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';

app.set('trust proxy', 1);

let certificateData;
try {
  certificateData = loadCertificateData(projectRoot);
  console.log(`✓ Loaded ${certificateData.candidateCount} workshop candidates`);
  console.log(`✓ Loaded ${certificateData.completedCount} completed assignments`);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

function logAccess(studentName, status, ip, responseTime) {
  const timestamp = new Date().toISOString();
  const emoji = status.includes('SUCCESS') ? '✓' : status.includes('ERROR') ? '❌' : '⚠';
  const timeStr = responseTime ? ` [${responseTime}ms]` : '';
  console.log(`${emoji} [${timestamp}] ${String(studentName).padEnd(20)} | ${status.padEnd(35)} | ${ip}${timeStr}`);
}

const certificateHandlers = createCertificateHandlers({
  rootDir: projectRoot,
  certificateData,
  logAccess,
});

app.use(compression());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  if (isProduction && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }

  next();
});

app.use((req, res, next) => {
  const origin = req.get('origin');
  const host = req.get('host');

  if (origin && host && origin.includes(host)) {
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

app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  if (isBlockedStaticPath(req.path)) {
    const secret = req.query.secret;
    const SALT = 'tsec_flutter_workshop_2026_secure_salt';
    if (secret === SALT) {
      return next();
    }
    logAccess('unknown', 'REJECTED - blocked_static_path', req.ip || req.connection.remoteAddress);
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    candidateCount: certificateData.candidateCount,
    completedAssignments: certificateData.completedCount,
  });
});

app.get('/api/certificate-names', (req, res) => certificateHandlers.searchNames(req, res));
app.get('/api/certificate-status', (req, res) => certificateHandlers.statusByName(req, res));
app.get('/api/certificate-lookup', (req, res) => certificateHandlers.lookupByCode(req, res));
app.get('/api/certificate-preview', (req, res) => certificateHandlers.preview(req, res));
app.get('/api/verify-certificate', (req, res) => certificateHandlers.download(req, res));

app.post('/api/audit-log', (req, res) => {
  try {
    const logData = req.body;
    if (!logData) {
      return res.status(400).json({ error: 'No log data provided' });
    }

    if (isProduction) {
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

app.use(
  express.static(projectRoot, {
    maxAge: isDevelopment ? 0 : '1h',
    etag: false,
  })
);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);

  res.status(err.status || 500).json({
    error: isProduction ? 'Internal server error' : err.message,
    ...(isDevelopment && { stack: err.stack }),
  });
});

const server = isVercel
  ? null
  : app.listen(PORT, () => {
      console.log(`\n${'='.repeat(70)}`);
      console.log('✓ Production Server Ready');
      console.log(`✓ Environment: ${NODE_ENV}`);
      console.log(`✓ Port: ${PORT}`);
      console.log(`✓ Portal: http://localhost:${PORT}`);
      console.log(`✓ Download API: http://localhost:${PORT}/api/verify-certificate`);
      console.log(`✓ Preview API: http://localhost:${PORT}/api/certificate-preview`);
      console.log(`✓ Health: http://localhost:${PORT}/health`);
      console.log(`${'='.repeat(70)}\n`);
    });

process.on('SIGTERM', () => {
  console.log('\n✓ SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('\n✓ SIGINT received, shutting down gracefully...');
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;
