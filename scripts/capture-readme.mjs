import { chromium, devices, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Live catalog screenshots in isolated storage, never the user's session.
const baseURL = process.env.CAPTURE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const manifest = { capturedAt: new Date().toISOString(), baseURL, catalog: 'live TMDB / configured catalog', files: [] };
await mkdir('docs/images', { recursive: true });

async function capture(page, filename, { fullPage = false, note = 'Live catalog; no authenticated session' } = {}) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = [...document.images].filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight;
    });
    await Promise.race([
      Promise.all(visible.map((img) => img.decode().catch(() => {}))),
      new Promise((resolve) => setTimeout(resolve, 6000)),
    ]);
  });
  await page.screenshot({ path: `docs/images/${filename}`, fullPage });
  manifest.files.push({ file: filename, route: new URL(page.url()).pathname, viewport: page.viewportSize(), note });
  console.log(`Captured ${filename}`);
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 30000 });
  await page.locator('.editorial-scene').last().waitFor({ timeout: 20000 });
  await capture(page, 'screening-hero.png');
  await page.getByRole('button', { name: 'VER TRAILER', exact: true }).click();
  await page.locator('.trailer-handoff').waitFor({ timeout: 30000 });
  await capture(page, 'screening-trailer.png', { note: 'Live TMDB trailer candidate; external link, no iframe or video playback' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for (const [selector, filename] of [
    ['.cinematic-spotlight', 'screening-spotlight.png'],
    ['.cinema-explorer', 'editorial-explorer.png'],
    ['.movie-frames', 'movie-frames.png'],
  ]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await capture(page, filename);
  }
  for (const [route, ready, filename] of [
    ['/personas', '.people-directory a', 'screening-people.png'],
    ['/series', '.series-card', 'screening-series.png'],
    ['/acceso', '.auth-submit', 'screening-login.png'],
  ]) {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.locator(ready).first().waitFor({ timeout: 30000 });
    await capture(page, filename);
  }
  await page.goto(`${baseURL}/cartelera`, { waitUntil: 'domcontentloaded' });
  await page.locator('.schedule-row .movie-tile__image').first().click();
  await page.locator('.movie-index').scrollIntoViewIfNeeded();
  await capture(page, 'movie-index.png');
  await page.goto(`${baseURL}/cartelera`, { waitUntil: 'domcontentloaded' });
  await page.locator('.showtime-pill').first().click();
  await page.locator('.cinema-seat:not(:disabled)').first().click();
  await capture(page, 'seat-selection.png', { fullPage: true });

  // Supabase writes are blocked: screenshots must not create real reservations.
  const demo = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await demo.route('**/rest/v1/**', (route) => route.fulfill({ status: 503, json: { message: 'Documentation: local demo only' } }));
  await demo.route('**/auth/v1/**', (route) => route.fulfill({ status: 503, json: { message: 'Documentation: no remote authentication' } }));
  await demo.addInitScript(() => localStorage.setItem('cine:demo:user', JSON.stringify({ id: 'demo-docs', name: 'Visitante de demostración', email: 'demo@example.test', demo: true })));
  await demo.goto(`${baseURL}/cartelera`, { waitUntil: 'domcontentloaded' });
  await demo.locator('.showtime-pill').first().click();
  await demo.locator('.cinema-seat:not(:disabled)').first().click();
  await demo.getByRole('button', { name: 'COMPRAR', exact: true }).click();
  await demo.locator('.cinema-ticket').waitFor();
  await capture(demo, 'screening-checkout.png', { fullPage: true, note: 'Local demo hold; Supabase REST/Auth blocked' });
  await demo.locator('.terms-check input').check();
  await demo.getByRole('button', { name: 'CONFIRMAR COMPRA', exact: true }).click();
  await demo.locator('.booking-success .cinema-ticket').waitFor();
  await capture(demo, 'screening-ticket.png', { fullPage: true, note: 'Local demo purchase; no real payment or remote write' });

  const mobile = await browser.newPage({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
  await mobile.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await expect(mobile.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 30000 });
  await mobile.locator('.editorial-scene').last().waitFor({ timeout: 20000 });
  await capture(mobile, 'screening-mobile.png');
  await mobile.goto(`${baseURL}/cartelera`, { waitUntil: 'domcontentloaded' });
  await mobile.locator('.showtime-pill').first().click();
  await mobile.locator('.cinema-seat:not(:disabled)').first().click();
  await capture(mobile, 'screening-seats-mobile.png', { fullPage: true });
  await writeFile('docs/images/capture-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  await browser.close();
}
