import fs from 'fs';
import { Jimp, loadFont, measureText, measureTextHeight } from 'jimp';
import { SANS_64_WHITE } from 'jimp/fonts';

export function readCertificateBuffer(certPath) {
  if (!certPath || !fs.existsSync(certPath)) {
    return null;
  }
  return fs.readFileSync(certPath);
}

export async function createBlurredPreview(buffer) {
  const image = await Jimp.read(buffer);
  
  // 1. Blur the image
  image.blur(15);
  
  // 2. Reduce brightness
  image.brightness(-0.18);
  
  // 3. Draw a red semi-transparent watermark bar in the middle
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  const barHeight = Math.max(120, Math.round(height * 0.18));
  const barY = Math.round((height - barHeight) / 2);
  
  // Create a red bar with 50% opacity (0xdc262680)
  const redBar = new Jimp({ width, height: barHeight, color: 0xdc262680 });
  
  // Load standard white font
  const font = await loadFont(SANS_64_WHITE);
  
  const text = 'PREVIEW ONLY - DOWNLOAD LOCKED';
  const textWidth = measureText(font, text);
  const textHeight = measureTextHeight(font, text, width);
  
  const textX = Math.round((width - textWidth) / 2);
  const textY = Math.round((barHeight - textHeight) / 2);
  
  redBar.print({ font, x: textX, y: textY, text });
  
  // Composite the bar onto the blurred certificate image
  image.composite(redBar, 0, barY);
  
  return await image.getBuffer('image/png');
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
