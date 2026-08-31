import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

// Read-only validation: local links, anchors, screenshot manifest and SVG XML.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
let references = 0;
let svgCount = 0;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? walk(path.join(directory, entry.name))
    : path.join(directory, entry.name)))).flat();
}

function anchors(text) {
  const explicit = [...text.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1]
    .replace(/<[^>]*>/g, '').replace(/`/g, '').trim().toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-'));
  return new Set([...explicit, ...headings]);
}

const docFiles = await walk(path.join(root, 'docs'));
for (const file of [path.join(root, 'README.md'), ...docFiles.filter((name) => name.endsWith('.md'))]) {
  const source = await readFile(file, 'utf8');
  const targets = [
    ...[...source.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].map((match) => match[1]),
    ...[...source.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]),
  ];
  for (const ref of targets) {
    if (/^(?:https?:|mailto:|data:)/i.test(ref)) continue;
    references++;
    const [relative, fragment] = ref.split('#');
    const target = relative ? path.resolve(path.dirname(file), decodeURIComponent(relative)) : file;
    try {
      await stat(target);
      if (fragment && target.endsWith('.md') && !anchors(await readFile(target, 'utf8')).has(decodeURIComponent(fragment))) {
        errors.push(`${path.relative(root, file)}: anchor missing: ${ref}`);
      }
    } catch { errors.push(`${path.relative(root, file)}: missing resource: ${ref}`); }
  }
  const fences = source.match(/^```/gm) || [];
  if (fences.length % 2) errors.push(`${path.relative(root, file)}: unclosed code fence`);
}

for (const file of docFiles.filter((name) => name.endsWith('.svg'))) {
  try {
    const dom = new JSDOM(await readFile(file, 'utf8'), { contentType: 'image/svg+xml' });
    const svg = dom.window.document.documentElement;
    if (svg.localName !== 'svg' || !svg.getAttribute('viewBox')) errors.push(`${path.relative(root, file)}: SVG/viewBox missing`);
    if (svg.querySelector('script, foreignObject')) errors.push(`${path.relative(root, file)}: embedded active content`);
    for (const node of svg.querySelectorAll('*')) for (const attr of node.attributes) {
      if (/^on/i.test(attr.name) || (/href$/.test(attr.name) && /^(?:https?:|javascript:)/i.test(attr.value))) errors.push(`${path.relative(root, file)}: active or remote SVG reference`);
    }
    dom.window.close();
    svgCount++;
  } catch (error) { errors.push(`${path.relative(root, file)}: invalid XML: ${error.message}`); }
}

const manifest = JSON.parse(await readFile(path.join(root, 'docs/images/capture-manifest.json'), 'utf8'));
for (const entry of manifest.files) {
  try { await stat(path.join(root, 'docs/images', entry.file)); }
  catch { errors.push(`Screenshot missing: ${entry.file}`); }
}

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Documentation OK: ${references} local references, ${svgCount} SVG files, ${manifest.files.length} screenshots. External links and Mermaid rendering are not network-validated.`);
