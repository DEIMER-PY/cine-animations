import { mkdir, writeFile } from 'node:fs/promises';

// Vendored documentation assets, pinned to a release; no runtime CDN dependency.
const release = 'v2.17.0';
const names = ['javascript', 'html5', 'css3', 'react', 'vitejs', 'tailwindcss', 'threejs', 'supabase', 'postgresql', 'nodejs', 'git', 'github', 'vitest', 'playwright', 'eslint'];
await mkdir('docs/icons', { recursive: true });
for (const name of names) {
  const response = await fetch(`https://raw.githubusercontent.com/devicons/devicon/${release}/icons/${name}/${name}-original.svg`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const svg = await response.text();
  if (!svg.includes('<svg')) throw new Error(`${name}: expected SVG`);
  await writeFile(`docs/icons/${name}.svg`, svg);
  console.log(`SVG ${name}`);
}
const license = await fetch(`https://raw.githubusercontent.com/devicons/devicon/${release}/LICENSE`);
if (!license.ok) throw new Error('Could not retrieve Devicon license');
await writeFile('docs/icons/LICENSE', await license.text());
