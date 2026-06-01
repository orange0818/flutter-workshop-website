import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const logosDir = path.join(root, 'assets', 'logos');
const imagesDir = path.join(root, 'assets', 'images');

fs.mkdirSync(logosDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(path.join(root, 'assets', 'icons'), { recursive: true });

const tsecSrc = path.join(root, 'assets', 'New tsec logo.WEBP');
const tpcSrc = path.join(root, 'assets', 'new tpc logo.png');
const tsecDest = path.join(logosDir, 'tsec.webp');
const tpcDest = path.join(logosDir, 'tpc.png');

if (fs.existsSync(tsecSrc)) {
  fs.copyFileSync(tsecSrc, tsecDest);
  console.log('Copied TSEC logo -> assets/logos/tsec.webp');
}
if (fs.existsSync(tpcSrc)) {
  fs.copyFileSync(tpcSrc, tpcDest);
  console.log('Copied TPC logo -> assets/logos/tpc.png');
}

const legacyTrainer = path.join(root, 'assets', 'trainer.png');
const newTrainer = path.join(imagesDir, 'trainer.png');
if (fs.existsSync(legacyTrainer) && !fs.existsSync(newTrainer)) {
  fs.copyFileSync(legacyTrainer, newTrainer);
  console.log('Moved trainer.png -> assets/images/trainer.png');
}
