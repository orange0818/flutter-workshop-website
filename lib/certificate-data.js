import fs from 'fs';
import path from 'path';

const CANDIDATES_FILE = 'data/eligible-candidates.txt';
const COMPLETED_FILE = 'data/completed-assignments.txt';
const CERTIFICATE_DIR = 'assets/certificates/student';

function normalizeCertificateName(name) {
  return String(name || '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildCertificateFileMap(rootDir) {
  const dir = path.join(rootDir, CERTIFICATE_DIR);
  const map = new Map();

  if (!fs.existsSync(dir)) {
    return map;
  }

  for (const file of fs.readdirSync(dir)) {
    if (!file.toLowerCase().endsWith('.png')) continue;
    const baseName = file.slice(0, -4);
    map.set(normalizeCertificateName(baseName), path.join(dir, file));
  }

  return map;
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

function parseCompletedSet(rootDir) {
  const names = readLines(path.join(rootDir, COMPLETED_FILE));
  const completed = new Set(names.map((name) => name.toLowerCase()));
  if (completed.size === 0) {
    throw new Error('Completed assignment list is empty');
  }
  return completed;
}

export function loadCertificateData(rootDir) {
  const { byName, byCode } = parseCandidates(rootDir);
  const completedAssignments = parseCompletedSet(rootDir);
  const certificateFiles = buildCertificateFileMap(rootDir);

  return {
    candidateCount: byName.size,
    completedCount: completedAssignments.size,
    certificateFiles,
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
    hasCompletedAssignment(name) {
      const normalized = String(name || '').trim().toLowerCase();
      return completedAssignments.has(normalized);
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
  const fileName = `${String(name || '').trim()}.png`;
  if (!fileName || fileName === '.png') return false;
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) return false;
  if (!fileName.endsWith('.png')) return false;
  return /^[a-zA-Z0-9\s\-_.]+\.png$/.test(fileName);
}

export function getCertificatePath(rootDir, name, certificateFiles = null) {
  if (!validateCertificateFileName(name)) {
    return null;
  }

  const trimmed = name.trim();
  const exactPath = path.join(rootDir, CERTIFICATE_DIR, `${trimmed}.png`);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }

  const files = certificateFiles || buildCertificateFileMap(rootDir);
  return files.get(normalizeCertificateName(trimmed)) || null;
}
