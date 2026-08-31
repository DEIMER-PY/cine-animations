import { expect, test } from '@playwright/test';
import { mockCatalog } from './fixtures/catalog';

test.beforeEach(async ({ page }) => {
  await mockCatalog(page);
});

test('uses the native pointer and only the document for vertical booking scroll', async ({ page }) => {
  await page.goto('/cartelera');
  await page.locator('.showtime-pill').first().click();
  await expect(page.locator('.booking-summary')).toBeVisible();
  await expect(page.locator('.custom-cursor')).toHaveCount(0);
  const summary = page.locator('.booking-summary');
  expect(await summary.evaluate((node) => {
    const style = getComputedStyle(node);
    return { overflow: style.overflowY, fits: node.scrollHeight <= node.clientHeight + 1 };
  })).toEqual({ overflow: 'visible', fits: true });

  await summary.locator('h2').scrollIntoViewIfNeeded();
  await summary.locator('h2').hover();
  const before = await page.evaluate(() => window.scrollY);
  const remaining = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
  await page.mouse.wheel(0, 280);
  if (remaining > 1) await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  expect(await summary.evaluate((node) => node.scrollTop)).toBe(0);

  const seat = page.locator('.cinema-seat:not(:disabled)').first();
  await seat.click();
  expect(await seat.evaluate((node) => getComputedStyle(node).cursor)).toBe('pointer');
  await expect(seat).toHaveClass(/is-selected/);
  const buy = page.getByRole('button', { name: 'COMPRAR E INICIAR SESIÓN', exact: true });
  await buy.scrollIntoViewIfNeeded();
  await expect(buy).toBeInViewport();
  await buy.click();
  await expect(page).toHaveURL(/\/acceso\?returnTo=/);
});

test('home keeps document scrolling and native cursor after a route change', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true');
  await expect(page.locator('.custom-cursor')).toHaveCount(0);
  expect(await page.locator('body').evaluate((node) => getComputedStyle(node).cursor)).not.toBe('none');
  await page.mouse.move(20, 400);
  await page.mouse.wheel(0, 450);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('short viewport and reduced motion keep the summary actions in the page flow', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 580 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cartelera');
  await page.locator('.showtime-pill').first().click();
  await page.locator('.cinema-seat:not(:disabled)').first().click();
  const buy = page.getByRole('button', { name: 'COMPRAR E INICIAR SESIÓN', exact: true });
  await buy.focus();
  await expect(buy).toBeFocused();
  await expect(buy).toBeInViewport();
  expect(await page.locator('.booking-summary').evaluate((node) => getComputedStyle(node).overflowY)).toBe('visible');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/acceso\?returnTo=/);
});
