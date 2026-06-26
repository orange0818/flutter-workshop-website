import fs from 'fs';
import sharp from 'sharp';

const PREVIEW_WATERMARK = `
<svg width="1200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="rgba(220,38,38,0.35)"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="rgba(255,255,255,0.92)">
    PREVIEW ONLY - DOWNLOAD LOCKED
  </text>
</svg>`;

export function readCertificateBuffer(certPath) {
  if (!certPath || !fs.existsSync(certPath)) {
    return null;
  }
  return fs.readFileSync(certPath);
}

export async function createBlurredPreview(buffer) {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 850;

  const watermark = Buffer.from(
    PREVIEW_WATERMARK.replace('width="1200"', `width="${width}"`).replace(
      'height="200"',
      `height="${Math.max(120, Math.round(height * 0.18))}"`
    )
  );

  return image
    .blur(18)
    .modulate({ brightness: 0.82, saturation: 0.75 })
    .composite([
      {
        input: watermark,
        gravity: 'centre',
      },
    ])
    .png()
    .toBuffer();
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
