import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CERT_DIR = path.join(root, 'assets/certificates/student');
const SALT = 'tsec_flutter_workshop_2026_secure_salt';

function normalizeCertificateName(name) {
  return String(name || '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getHashedFilename(name) {
  const normalized = normalizeCertificateName(name);
  const hash = crypto.createHash('sha256').update(normalized + SALT).digest('hex');
  return `${hash}.png`;
}

console.log('Starting certificate hashing and renaming...');
console.log(`Target directory: ${CERT_DIR}`);

if (!fs.existsSync(CERT_DIR)) {
  console.error(`Error: Directory not found: ${CERT_DIR}`);
  process.exit(1);
}

try {
  const files = fs.readdirSync(CERT_DIR);
  let renameCount = 0;
  let skipCount = 0;

  for (const file of files) {
    if (!file.toLowerCase().endsWith('.png')) {
      console.log(`Skipping non-PNG file: ${file}`);
      continue;
    }

    const baseName = file.slice(0, -4);
    
    // If it's already a 64-char hex hash, skip it
    if (/^[a-f0-9]{64}$/i.test(baseName)) {
      console.log(`File is already hashed: ${file}`);
      skipCount++;
      continue;
    }

    const hashedName = getHashedFilename(baseName);
    const oldPath = path.join(CERT_DIR, file);
    const newPath = path.join(CERT_DIR, hashedName);

    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: "${file}" -> "${hashedName}"`);
    renameCount++;
  }

  console.log('\nRenaming complete!');
  console.log(`Renamed: ${renameCount} files`);
  console.log(`Skipped (already hashed): ${skipCount} files`);
} catch (error) {
  console.error('An error occurred during renaming:', error.message);
  process.exit(1);
}
