/**
 * One-time helper: splits monolithic index.html into template, sections, style.css, script.js.
 * Run from project root: node scripts/extract.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/\r\n/g, '\n');

const styleMatch = html.match(/<style>\n([\s\S]*?)\n  <\/style>/);
if (styleMatch) {
  const css = styleMatch[1].replace(/^    /gm, '');
  fs.writeFileSync(path.join(root, 'style.css'), css);
  console.log('Wrote style.css');
}

const scriptMarker = '  <script>\n    const FORM_URL';
const scriptStart = html.indexOf(scriptMarker);
const scriptEnd = html.indexOf('</script>', scriptStart) + '</script>'.length;

if (scriptStart === -1) {
  console.error('Could not find inline script block');
  process.exit(1);
}

const scriptInner = html.slice(scriptStart + '  <script>\n'.length, html.indexOf('\n  </script>', scriptStart));
fs.writeFileSync(path.join(root, 'script.js'), scriptInner.replace(/^    /gm, ''));
console.log('Wrote script.js');

const bodyOpen = html.indexOf('<body');
const bodyContentStart = html.indexOf('>', bodyOpen) + 1;
const body = html.slice(bodyContentStart, scriptStart);
const sectionDir = path.join(root, 'sections');
fs.mkdirSync(sectionDir, { recursive: true });

const parts = body.split(/\n(?=  <!-- )/);
const sectionFiles = [];

for (const part of parts) {
  const trimmed = part.trim();
  if (!trimmed) continue;
  const nameMatch = trimmed.match(/^<!--\s*([^>]+?)\s*-->/);
  const label = nameMatch ? nameMatch[1].trim() : 'fragment';
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const fileName = `${slug}.html`;
  const content = trimmed.startsWith('<!--') ? trimmed : `  ${trimmed}`;
  const filePath = path.join(sectionDir, fileName);
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : content + '\n');
  sectionFiles.push({ label, fileName, content });
  console.log('Wrote sections/' + fileName);
}

const headEnd = html.indexOf('</head>') + 7;
const head = html.slice(0, headEnd);
let headWithoutStyle = head.replace(/<style>[\s\S]*?<\/style>\n/, '  <link rel="stylesheet" href="style.css" />\n');
headWithoutStyle = headWithoutStyle.replace(
  /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap/g,
  '<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap'
);
headWithoutStyle = headWithoutStyle.replace(
  /<script src="https:\/\/unpkg\.com\/aos@2\.3\.1\/dist\/aos\.js"><\/script>/,
  '<script defer src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>'
);

const includes = sectionFiles
  .map((s) => `  <!-- @include sections/${s.fileName} -->`)
  .join('\n');

const template = `${headWithoutStyle}
<body class="antialiased">

${includes}

  <script defer src="script.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.template.html'), template);
console.log('Wrote index.template.html — run node build.mjs to regenerate index.html');
