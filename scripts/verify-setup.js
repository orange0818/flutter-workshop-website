/**
 * Production Setup Verification Script
 * Checks that all required files and configurations are in place
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let errors = [];
let warnings = [];
let success = [];

// Check file exists
function checkFile(filePath, description) {
  const fullPath = path.join(root, filePath);
  if (fs.existsSync(fullPath)) {
    success.push(`✓ ${description}`);
    return true;
  } else {
    errors.push(`✗ Missing: ${description} (${filePath})`);
    return false;
  }
}

// Check directory exists
function checkDir(dirPath, description) {
  const fullPath = path.join(root, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    success.push(`✓ ${description}`);
    return true;
  } else {
    errors.push(`✗ Missing: ${description} (${dirPath})`);
    return false;
  }
}

// Check file has content
function checkFileContent(filePath, description) {
  const fullPath = path.join(root, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8').trim();
    if (content.length > 0) {
      success.push(`✓ ${description} (${content.split('\n').length} entries)`);
      return true;
    } else {
      warnings.push(`⚠ Warning: ${description} is empty (${filePath})`);
      return false;
    }
  } else {
    errors.push(`✗ Missing: ${description} (${filePath})`);
    return false;
  }
}

// Check package.json has dependencies
function checkDependencies() {
  try {
    const pkgPath = path.join(root, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    const required = ['express', 'compression', 'jimp'];
    const missing = required.filter(dep => !pkg.dependencies?.[dep]);
    
    if (missing.length === 0) {
      success.push('✓ All required dependencies in package.json');
      return true;
    } else {
      errors.push(`✗ Missing dependencies: ${missing.join(', ')}`);
      return false;
    }
  } catch (e) {
    errors.push(`✗ Cannot parse package.json: ${e.message}`);
    return false;
  }
}

// Check API files
function checkAPIFiles() {
  const files = [
    'lib/certificate-routes.js',
    'lib/certificate-data.js',
    'lib/certificate-image.js',
    'lib/blocked-paths.js',
    'scripts/security-audit.js',
  ];
  
  let ok = true;
  files.forEach(file => {
    if (!checkFile(file, `API: ${path.basename(file)}`)) {
      ok = false;
    }
  });
  return ok;
}

console.log('\n' + '='.repeat(70));
console.log('Production Setup Verification');
console.log('='.repeat(70) + '\n');

// Core server files
console.log('Core Files:');
checkFile('api/index.js', 'Express server');
checkFile('service-worker.js', 'Service worker');
checkFile('package.json', 'Package configuration');
checkFile('.gitignore', 'Git ignore rules');
checkDependencies();

console.log('\nAssets:');
checkDir('data', 'Server-only data directory');
checkDir('assets', 'Assets directory');
checkDir('assets/certificates', 'Certificates storage');
checkDir('assets/certificates/student', 'Student certificates');
checkFileContent('data/eligible-candidates.txt', 'Eligible candidates list');
checkFileContent('data/completed-assignments.txt', 'Completed assignment list');

console.log('\nPortal Files:');
checkFile('certificate.html', 'Certificate portal HTML');
checkFile('script.js', 'Portal JavaScript');
checkFile('style.css', 'Portal styles');

console.log('\nAPI Endpoints:');
checkAPIFiles();

console.log('\nDocumentation:');
checkFile('SECURITY_IMPLEMENTATION.md', 'Security documentation');
checkFile('DEPLOYMENT_CHECKLIST.md', 'Deployment checklist');
checkFile('TESTING_DEPLOYMENT.md', 'Testing & deployment guide');

console.log('\n' + '='.repeat(70));

if (success.length > 0) {
  console.log(`\n✓ Success (${success.length}):`);
  success.forEach(msg => console.log(`  ${msg}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠ Warnings (${warnings.length}):`);
  warnings.forEach(msg => console.log(`  ${msg}`));
}

if (errors.length > 0) {
  console.log(`\n✗ Errors (${errors.length}):`);
  errors.forEach(msg => console.log(`  ${msg}`));
  console.log('\n' + '='.repeat(70));
  console.log('❌ Setup incomplete. Please fix errors above.');
  console.log('='.repeat(70) + '\n');
  process.exit(1);
} else {
  console.log('\n✓ Production setup complete and verified!');
  console.log('\nNext steps:');
  console.log('1. npm install');
  console.log('2. npm run dev (for local testing)');
  console.log('3. Deploy to production (Vercel/Netlify/self-hosted)');
  console.log('\n' + '='.repeat(70) + '\n');
  process.exit(0);
}
