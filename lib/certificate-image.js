import fs from 'fs';

export function readCertificateBuffer(certPath) {
  if (!certPath || !fs.existsSync(certPath)) {
    return null;
  }
  return fs.readFileSync(certPath);
}

export function applySecureImageHeaders(res, { attachment = false, fileName = 'certificate.png' } = {}) {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (attachment) {
    const safeName = String(fileName).replace(/[^\w\-_. ]+/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  } else {
    res.setHeader('Content-Disposition', 'inline');
  }
}
