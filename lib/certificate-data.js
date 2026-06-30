import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CANDIDATES_FILE = 'data/eligible-candidates.txt';
const CERTIFICATE_DIR = 'assets/certificates/student';
export const SALT = 'tsec_flutter_workshop_2026_secure_salt';

export function normalizeCertificateName(name) {
  return String(name || '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function getHashedFilename(name) {
  const normalized = normalizeCertificateName(name);
  const hash = crypto.createHash('sha256').update(normalized + SALT).digest('hex');
  return `${hash}.png`;
}

function readLines(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required data file not found: ${filePath}`);
  }
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseCandidates(rootDir) {
  const rows = readLines(path.join(rootDir, CANDIDATES_FILE));
  if (rows.length < 2) {
    throw new Error('Candidate list is empty or missing headers');
  }

  const headers = rows[0].split(/\t+/).map((cell) => cell.trim().toLowerCase());
  const nameIndex = headers.findIndex((header) => header === 'name');
  const codeIndex = headers.findIndex((header) => /unique\s*code/i.test(header));

  if (nameIndex < 0 || codeIndex < 0) {
    throw new Error('Candidate list must include NAME and Unique Code columns');
  }

  const byName = new Map();
  const byCode = new Map();

  rows.slice(1).forEach((row) => {
    const cols = row.split(/\t+/).map((cell) => cell.trim());
    const name = cols[nameIndex] || '';
    const code = String(cols[codeIndex] || '').trim();
    if (!name || !code) return;

    const record = {
      name,
      code,
      normalizedName: name.toLowerCase(),
      normalizedCode: code.toLowerCase(),
    };

    byName.set(record.normalizedName, record);
    byCode.set(record.normalizedCode, record);
  });

  if (byName.size === 0) {
    throw new Error('No candidate records found');
  }

  return { byName, byCode };
}

export function loadCertificateData(rootDir) {
  const { byName, byCode } = parseCandidates(rootDir);

  return {
    candidateCount: byName.size,
    findByName(name) {
      const normalized = String(name || '').trim().toLowerCase();
      if (!normalized) return null;
      return byName.get(normalized) || null;
    },
    findByCode(code) {
      const normalized = String(code || '').trim().toLowerCase();
      if (!normalized) return null;
      return byCode.get(normalized) || null;
    },
    searchNames(query, limit = 8) {
      const normalized = String(query || '').trim().toLowerCase();
      if (normalized.length < 2) return [];

      const matches = [];
      for (const record of byName.values()) {
        if (record.normalizedName.includes(normalized)) {
          matches.push(record.name);
          if (matches.length >= limit) break;
        }
      }
      return matches;
    },
  };
}

export function validateCertificateFileName(name) {
  const normalized = normalizeCertificateName(name);
  return normalized.length > 0 && !normalized.includes('/') && !normalized.includes('\\') && !normalized.includes('..');
}

export function getCertificatePath(rootDir, name) {
  if (!validateCertificateFileName(name)) {
    return null;
  }
  const hashedFilename = getHashedFilename(name);
  const exactPath = path.join(rootDir, CERTIFICATE_DIR, hashedFilename);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }
  return null;
}
