import { test, expect } from '@playwright/test';
import { mockCatalog } from './catalogFixture';

test.setTimeout(60000);

test('captures the final visual surfaces', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await mockCatalog(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('nav').first()).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: 'docs/screenshots/home-desktop.png', fullPage: false });

  await page.getByRole('button', { name: 'CATALOG', exact: true }).first().evaluate((button) => button.click());
  await expect(page.locator('article').first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'docs/screenshots/catalog-desktop.png', fullPage: false });

  await page.locator('article').first().locator('button').first().click({ force: true });
  await expect(page.getByRole('button', { name: 'Close movie details' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/detail-desktop.png', fullPage: false });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Iniciar sesión' }).evaluate((button) => button.click());
  const dialog = page.getByRole('dialog', { name: 'WELCOME BACK' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText('WELCOME BACK', { timeout: 10000 });
  await page.screenshot({ path: 'docs/screenshots/login-desktop.png', fullPage: false });
});

test('captures the mobile home and catalog', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await mockCatalog(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('nav').first()).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: 'docs/screenshots/home-mobile.png', fullPage: false });
  await page.getByRole('button', { name: 'CATALOG', exact: true }).last().evaluate((button) => button.click());
  await expect(page.locator('article').first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'docs/screenshots/catalog-mobile.png', fullPage: false });
});
