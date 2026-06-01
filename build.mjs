/**
 * Merges index.template.html + sections/*.html into index.html.
 * Run: node build.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(root, 'index.template.html');
const outPath = path.join(root, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('Missing index.template.html');
  process.exit(1);
}

let html = fs.readFileSync(templatePath, 'utf8');
const includeRe = /<!--\s*@include\s+([^\s]+)\s*-->/g;

html = html.replace(includeRe, (_, rel) => {
  const filePath = path.join(root, rel.replace(/\//g, path.sep));
  if (!fs.existsSync(filePath)) {
    throw new Error(`Include not found: ${rel}`);
  }
  return fs.readFileSync(filePath, 'utf8').trimEnd();
});

fs.writeFileSync(outPath, html + '\n');
console.log('Built index.html');
