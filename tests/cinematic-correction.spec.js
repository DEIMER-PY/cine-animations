import { expect, test } from '@playwright/test';
import { mockCatalog } from './fixtures/catalog';

async function mockTrailers(page, { empty = false } = {}) {
  await mockCatalog(page);
  await page.route(/(?:api\/tmdb|functions\/v1\/tmdb-proxy)\?/, async (route) => {
    const path = new URL(route.request().url()).searchParams.get('path');
    if (!path?.endsWith('/videos')) return route.fallback();
    await route.fulfill({ json: { results: empty ? [] : [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'es', name: 'Trailer oficial' }] } });
  });
}

async function home(page) {
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 20000 });
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


test('portal opens an external trailer without iframe and restores focus', async ({ page }) => {
  await mockTrailers(page);
  const forbidden = [];
  page.on('request', (request) => { if (/media\/cosmos|youtube.*(?:embed|iframe_api)/.test(request.url())) forbidden.push(request.url()); });
  await home(page);
  const trigger = page.getByRole('button', { name: 'VER TRAILER', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.trailer-handoff')).toBeVisible();
  await expect(dialog.getByTestId('trailer-intro')).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: 'VER EN YOUTUBE', exact: true })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abcdefghijk');
  await expect(dialog.getByRole('link', { name: /continuar en esta pestaña/ })).not.toHaveAttribute('target', '_blank');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(forbidden).toEqual([]);
});

test('missing trailer offers an honest title search and retry', async ({ page }) => {
  await mockTrailers(page, { empty: true });
  await home(page);
  await page.getByRole('button', { name: 'VER TRAILER', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('TRAILER NO DISPONIBLE')).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'BUSCAR TRAILER EN YOUTUBE' })).toHaveAttribute('href', /results\?search_query=Pel/);
  await dialog.getByRole('button', { name: 'REINTENTAR CONSULTA' }).click();
  await expect(dialog.getByText('TRAILER NO DISPONIBLE')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('reduced motion has a decoded photo, manual navigation and complete headlines', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockTrailers(page);
  await home(page);
  await expect(page.locator('.editorial-scene').last()).toBeVisible();
  expect(await page.locator('.editorial-scene').last().evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Película destacada siguiente' }).click();
  await expect(page.locator('.cinema-hero')).toHaveAttribute('data-hero-index', '1');
  await page.getByRole('button', { name: 'Película destacada anterior' }).click();
  await expect(page.locator('.cinema-hero')).toHaveAttribute('data-hero-index', '0');
  const widths = await page.locator('.heading-mask, .finale-line').evaluateAll((elements) => elements.map((element) => ({ width: element.clientWidth, scroll: element.scrollWidth })));
  for (const item of widths) expect(item.scroll).toBeLessThanOrEqual(item.width + 2);
});

test('hero rotates and stops out of view', async ({ page }) => {
  await mockTrailers(page);
  await home(page);
  await expect(page.locator('.cinema-hero')).not.toHaveAttribute('data-hero-index', '0', { timeout: 11000 });
  await page.locator('.cinema-finale').scrollIntoViewIfNeeded();
  const index = await page.locator('.cinema-hero').getAttribute('data-hero-index');
  await page.waitForTimeout(8500);
  await expect(page.locator('.cinema-hero')).toHaveAttribute('data-hero-index', index);
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
