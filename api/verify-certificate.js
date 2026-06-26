/**
 * Serverless function to verify and serve certificates securely
 * Deploy to: Vercel, Netlify, or AWS Lambda
 * 
 * This function:
 * 1. Verifies the student is eligible
 * 2. Validates the certificate exists
 * 3. Serves the certificate only if both conditions are met
 * 4. Logs access attempts for audit trail
 */

import fs from 'fs';
import path from 'path';

// Load eligible candidates at build time
function loadEligibleCandidates() {
  try {
    const candidates = fs.readFileSync(
      path.join(process.cwd(), 'assets/candidateswhocompletedtheassignment.txt'),
      'utf8'
    );
    return new Set(
      candidates.split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean)
    );
  } catch (e) {
    console.error('Failed to load eligible candidates:', e);
    return new Set();
  }
}

const ELIGIBLE_CANDIDATES = loadEligibleCandidates();

// Prevent directory traversal attacks
function validateFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return false;
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) return false;
  if (!fileName.endsWith('.png')) return false;
  return /^[a-zA-Z0-9\s\-_.]+\.png$/.test(fileName);
}

function logAccess(studentName, status, ip) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Certificate Access: ${studentName} - ${status} - IP: ${ip}`);
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, code } = req.query;
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  // Validate inputs
  if (!name || !code || typeof name !== 'string' || typeof code !== 'string') {
    logAccess(name || 'unknown', 'REJECTED - invalid_params', clientIP);
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  const normalizedName = name.trim();
  const normalizedCode = String(code).trim().toLowerCase();

  // Validate file name to prevent directory traversal
  if (!validateFileName(`${normalizedName}.png`)) {
    logAccess(normalizedName, 'REJECTED - invalid_filename', clientIP);
    return res.status(400).json({ error: 'Invalid file name' });
  }

  // Check eligibility
  if (!ELIGIBLE_CANDIDATES.has(normalizedName.toLowerCase())) {
    logAccess(normalizedName, 'REJECTED - not_eligible', clientIP);
    return res.status(403).json({ error: 'Not eligible to download this certificate' });
  }

  try {
    // Load student records and verify code matches name
    const studentsData = fs.readFileSync(
      path.join(process.cwd(), 'assets/FLUTTER ELIGIBLE CANDIDATES.txt'),
      'utf8'
    );

    const rows = studentsData.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
    const headers = rows[0].split(/\t+/).map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h === 'name');
    const codeIdx = headers.findIndex(h => /unique\s*code/i.test(h));

    if (nameIdx < 0 || codeIdx < 0) {
      logAccess(normalizedName, 'ERROR - parsing_failed', clientIP);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Find matching student and verify code
    const student = rows.slice(1).find(row => {
      const cols = row.split(/\t+/).map(c => c.trim());
      return cols[nameIdx]?.toLowerCase() === normalizedName.toLowerCase();
    });

    if (!student) {
      logAccess(normalizedName, 'REJECTED - student_not_found', clientIP);
      return res.status(404).json({ error: 'Student certificate not found' });
    }

    const cols = student.split(/\t+/).map(c => c.trim());
    const studentCode = String(cols[codeIdx] || '').trim().toLowerCase();

    // Verify code matches (second factor authentication)
    if (studentCode !== normalizedCode) {
      logAccess(normalizedName, 'REJECTED - code_mismatch', clientIP);
      return res.status(403).json({ error: 'Certificate code does not match' });
    }

    // Verify file exists
    const certPath = path.join(
      process.cwd(),
      `assets/certificates/student/${normalizedName}.png`
    );

    if (!fs.existsSync(certPath)) {
      logAccess(normalizedName, 'REJECTED - file_not_found', clientIP);
      return res.status(404).json({ error: 'Certificate file not found' });
    }

    // Read and serve certificate
    const fileBuffer = fs.readFileSync(certPath);

    // Set security headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Disposition', `attachment; filename="${normalizedName}_certificate.png"`);

    logAccess(normalizedName, 'SUCCESS', clientIP);
    return res.status(200).send(fileBuffer);

  } catch (error) {
    console.error('Certificate server error:', error);
    logAccess(normalizedName, 'ERROR - ' + error.message, clientIP);
    return res.status(500).json({ error: 'Server error' });
  }
}
