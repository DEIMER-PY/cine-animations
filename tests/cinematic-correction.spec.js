import { expect, test } from '@playwright/test';
import { mockCatalog } from './fixtures/catalog';

async function mockTrailers(page, { blocked = false, failed = false, empty = false } = {}) {
  await mockCatalog(page);
  await page.route(/(?:api\/tmdb|functions\/v1\/tmdb-proxy)\?/, async (route) => {
    const path = new URL(route.request().url()).searchParams.get('path');
    if (!path?.endsWith('/videos')) return route.fallback();
    await route.fulfill({ json: { results: empty ? [] : [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'es', name: 'Trailer oficial' }] } });
  });
  await page.addInitScript(({ blocked, failed }) => {
    window.__players = [];
    window.YT = { Player: class {
      constructor(node, options) {
        this.options = options; this.state = -1; this.muted = false; this.destroyed = false;
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'about:blank';
        node.replaceWith(this.iframe);
        window.__players.push(this);
        setTimeout(() => { if (!this.destroyed) options.events.onReady({ target: this }); }, 10);
      }
      getIframe() { return this.iframe; }
      mute() { this.muted = true; }
      unMute() { this.muted = false; }
      playVideo() {
        if (this.destroyed) return;
        if (failed) { this.options.events.onError({ target: this, data: 101 }); return; }
        if (blocked && this.muted) { this.options.events.onAutoplayBlocked(); return; }
        if (this.state === 1) return;
        this.state = 1; this.options.events.onStateChange({ target: this, data: 1 });
      }
      pauseVideo() { if (this.state === 2 || this.destroyed) return; this.state = 2; this.options.events.onStateChange({ target: this, data: 2 }); }
      destroy() { this.destroyed = true; this.state = -1; this.iframe.remove(); }
    } };
  }, { blocked, failed });
}

test('Spotlight changes only by click or keyboard; scrolling stays free', async ({ page }) => {
  await mockTrailers(page);
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  const deck = page.locator('.cinematic-spotlight');
  await deck.locator('.spotlight-stage').scrollIntoViewIfNeeded();
  await expect(deck).toHaveAttribute('data-active-index', '0');
  await deck.locator('.spotlight-card.is-active').hover();
  await page.mouse.wheel(0, 250);
  await page.waitForTimeout(500);
  await expect(deck).toHaveAttribute('data-active-index', '0');
  await deck.getByRole('button', { name: 'Película siguiente' }).click();
  await expect(deck).toHaveAttribute('data-active-index', '1');
  await page.waitForTimeout(500);
  await deck.locator('.spotlight-stage').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(deck).toHaveAttribute('data-active-index', '0');
});

test('trailer portal precedes iframe, pauses preview and restores focus', async ({ page }) => {
  await mockTrailers(page);
  const forbidden = [];
  page.on('request', (request) => { if (request.url().includes('/media/cosmos/')) forbidden.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  const trigger = page.getByRole('button', { name: 'TRAILER COMPLETO', exact: true });
  await page.evaluate(() => {
    window.__portalTiming = {};
    const observer = new MutationObserver(() => {
      if (document.querySelector('[data-testid="trailer-intro"]') && !window.__portalTiming.intro) window.__portalTiming.intro = performance.now();
      if (document.querySelector('dialog iframe')) { window.__portalTiming.player = performance.now(); window.__portalTiming.overlap = Boolean(document.querySelector('[data-testid="trailer-intro"]')); observer.disconnect(); }
    });
    observer.observe(document.documentElement, { subtree: true, childList: true });
  });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('iframe')).toHaveCount(1);
  const timing = await page.evaluate(() => window.__portalTiming);
  // MutationObserver timing varies with rendering load: test ordering, not scheduler precision.
  expect(timing.intro).toBeDefined();
  expect(timing.player).toBeGreaterThan(timing.intro);
  expect(timing.overlap).toBe(false);
  expect(await page.evaluate(() => window.__players.filter((player) => !player.destroyed && player.state === 1).length)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(forbidden).toEqual([]);
});

test('restricted embed offers an external link and accessible retry', async ({ page }) => {
  await mockTrailers(page, { failed: true });
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await page.getByRole('button', { name: 'TRAILER COMPLETO', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('PROYECCIÓN INTERRUMPIDA')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'VER EN YOUTUBE' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abcdefghijk');
});

test('missing trailer renders an honest empty state', async ({ page }) => {
  await mockTrailers(page, { empty: true });
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await page.getByRole('button', { name: 'TRAILER COMPLETO', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('TRAILER NO DISPONIBLE')).toBeVisible();
  await expect(page.getByRole('dialog').locator('iframe')).toHaveCount(0);
});

test('reduced motion has no automatic player and headlines fit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockTrailers(page);
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await expect(page.locator('.hero-preview iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reproducir avance' }).click();
  await expect(page.locator('.hero-preview iframe')).toHaveCount(1);
  const widths = await page.locator('.heading-mask, .finale-line').evaluateAll((elements) => elements.map((element) => ({ width: element.clientWidth, scroll: element.scrollWidth })));
  for (const item of widths) expect(item.scroll).toBeLessThanOrEqual(item.width + 2);
});

test('preview rotates after eight seconds of playback and pauses offscreen', async ({ page, isMobile }) => {
  await mockTrailers(page);
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await page.locator('.hero-preview').scrollIntoViewIfNeeded();
  if (isMobile) await page.getByRole('button', { name: 'Reproducir avance' }).click();
  await expect(page.locator('.hero-preview iframe')).toHaveCount(1);
  const before = await page.locator('.cinema-hero').getAttribute('data-hero-index');
  await expect(page.locator('.cinema-hero')).not.toHaveAttribute('data-hero-index', before, { timeout: 11000 });
  await page.locator('.cinema-finale').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.__players.filter((player) => !player.destroyed && player.state === 1).length)).toBe(0);
});

test('autoplay blocking leaves a manual play control instead of a retry loop', async ({ page, isMobile }) => {
  await mockTrailers(page, { blocked: true });
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
  await page.locator('.hero-preview').scrollIntoViewIfNeeded();
  if (isMobile) await page.getByRole('button', { name: 'Reproducir avance' }).click();
  await expect(page.getByText('Pulsa reproducir para activar el avance.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reproducir avance' })).toBeVisible();
  const count = await page.evaluate(() => window.__players.length);
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__players.length)).toBe(count);
});

test('seat stairs do not interfere and demo tickets survive confirmation', async ({ page }) => {
  await mockCatalog(page);
  await page.addInitScript(() => localStorage.setItem('cine:demo:user', JSON.stringify({ id: 'demo-qa', name: 'QA Cine', email: 'qa@example.test', demo: true })));
  await page.goto('/cartelera');
  await page.locator('.showtime-pill').first().click();
  await expect(page.locator('.cinema-steps').first()).toBeVisible();
  const available = page.locator('.cinema-seat--available:not([disabled])');
  await available.first().click();
  await expect(page.locator('.cinema-seat.is-selected')).toHaveCount(1);
  await page.getByRole('button', { name: 'COMPRAR', exact: true }).click();
  await expect(page.locator('.cinema-ticket')).toBeVisible();
  await page.locator('.terms-check input').check();
  await page.getByRole('button', { name: 'CONFIRMAR COMPRA', exact: true }).click();
  await expect(page.locator('.booking-success .cinema-ticket')).toBeVisible();
  await expect(page.locator('.cinema-ticket__stub strong')).toContainText('CINE-');
  await page.getByRole('link', { name: 'VER MIS ENTRADAS' }).click();
  await expect(page.locator('.ticket-list .cinema-ticket')).toHaveCount(1);
});
