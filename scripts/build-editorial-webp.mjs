import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const origin = process.env.CAPTURE_URL || 'http://127.0.0.1:5173';
const response = await fetch(`${origin}/api/tmdb?path=/trending/movie/week&language=es-CO`, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Local TMDB proxy: ${response.status}`);
const { results } = await response.json();
await mkdir('.artifacts/editorial-source', { recursive: true });
await mkdir('public/media/editorial', { recursive: true });
const manifest = {};
for (const movie of results.filter((item) => item.backdrop_path).slice(0, 5)) {
  if (!/^\d+$/.test(String(movie.id)) || !/^\/[\w.-]+$/.test(movie.backdrop_path)) continue;
  const image = await fetch(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`, { signal: AbortSignal.timeout(20000) });
  if (!image.ok) throw new Error(`Backdrop ${movie.id}: ${image.status}`);
  const input = `.artifacts/editorial-source/${movie.id}.jpg`;
  await writeFile(input, Buffer.from(await image.arrayBuffer()));
  for (const width of [960, 1600]) {
    execFileSync(ffmpeg, ['-y', '-i', input, '-vf', `scale=${width}:-2`, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '82', `public/media/editorial/${movie.id}-${width}.webp`], { stdio: 'ignore' });
  }
  manifest[movie.id] = { title: movie.title, backdrop: movie.backdrop_path, src: `/media/editorial/${movie.id}-1600.webp`, small: `/media/editorial/${movie.id}-960.webp` };
  console.log(`WebP: ${movie.title}`);
}
await writeFile('public/media/editorial/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
