import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

console.log('\n' + '='.repeat(70));
console.log('Security Audit');
console.log('='.repeat(70) + '\n');

const serverSource = read('api/index.js');
const scriptSource = read('script.js');
const packageJson = JSON.parse(read('package.json'));
const blockedPathsSource = read('lib/blocked-paths.js');
const routesSource = read('lib/certificate-routes.js');
const dataSource = read('lib/certificate-data.js');

const requiredChecks = [
  ['api/index.js uses blocked static middleware before express.static', () => {
    const blockedIndex = serverSource.indexOf('isBlockedStaticPath');
    const staticIndex = serverSource.indexOf('express.static');
    if (blockedIndex < 0 || staticIndex < 0 || blockedIndex > staticIndex) {
      fail('api/index.js must block sensitive static paths before express.static');
    }
  }],
  ['blocked paths include certificate images', () => {
    if (!/\/assets\\\/certificates/.test(blockedPathsSource)) {
      fail('lib/blocked-paths.js must block /assets/certificates');
    }
  }],
  ['blocked paths include candidate data files', () => {
    if (!blockedPathsSource.includes('/data')) {
      fail('lib/blocked-paths.js must block /data directory');
    }
    if (!blockedPathsSource.includes('FLUTTER ELIGIBLE CANDIDATES')) {
      fail('lib/blocked-paths.js must block legacy candidate list path');
    }
    if (!blockedPathsSource.includes('candidateswhocompletedtheassignment')) {
      fail('lib/blocked-paths.js must block legacy completed assignment path');
    }
  }],
  ['candidate data is loaded from non-public data directory', () => {
    if (!dataSource.includes("data/eligible-candidates.txt")) {
      fail('lib/certificate-data.js must load candidates from data/eligible-candidates.txt');
    }
  }],
  ['client does not fetch eligibility text files', () => {
    if (/fetch\(['"]assets\/FLUTTER ELIGIBLE CANDIDATES\.txt['"]\)/.test(scriptSource)) {
      fail('script.js must not fetch candidate list from public assets');
    }
    if (/fetch\(['"]assets\/candidateswhocompletedtheassignment\.txt['"]\)/.test(scriptSource)) {
      fail('script.js must not fetch completed assignment list from public assets');
    }
  }],
  ['client does not expose direct certificate file paths', () => {
    if (/assets\/certificates\/student\//.test(scriptSource)) {
      fail('script.js must not reference direct certificate file URLs');
    }
  }],
  ['client uses secured API endpoints', () => {
    const requiredApis = [
      '/api/certificate-names',
      '/api/certificate-preview',
      '/api/verify-certificate',
    ];
    requiredApis.forEach((apiPath) => {
      if (!scriptSource.includes(apiPath)) {
        fail(`script.js must use ${apiPath}`);
      }
    });
  }],
  ['build runs security audit', () => {
    if (!String(packageJson.scripts?.build || '').includes('security-audit')) {
      fail('package.json build script must run scripts/security-audit.js');
    }
  }],

  ['certificate library files exist', () => {
    [
      'lib/blocked-paths.js',
      'lib/certificate-data.js',
      'lib/certificate-image.js',
      'lib/certificate-routes.js',
    ].forEach((filePath) => {
      if (!fileExists(filePath)) {
        fail(`Missing required security module: ${filePath}`);
      }
    });
  }],
];

requiredChecks.forEach(([label, check]) => {
  try {
    check();
    console.log(`✓ ${label}`);
  } catch (error) {
    fail(`${label}: ${error.message}`);
    console.log(`✗ ${label}`);
  }
});

if (warnings.length) {
  console.log('\nWarnings (' + warnings.length + '):');
  warnings.forEach((message) => console.log(`  ⚠ ${message}`));
}

if (errors.length) {
  console.log('\nSecurity audit failed with ' + errors.length + ' error(s):');
  errors.forEach((message) => console.log(`  ✗ ${message}`));
  console.log('\n' + '='.repeat(70));
  console.log('❌ Deployment blocked until security issues are resolved.');
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}

console.log('\n✓ Security audit passed.');
console.log('='.repeat(70) + '\n');
