import { test, expect } from '@playwright/test';

test.describe('CINE ANIMATIONS smoke suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the navigation and hero', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('HOME', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('CATALOG', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('ENSEMBLE', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('COLLECTION', { exact: true }).first()).toBeVisible();
  });

  test('navigates to catalog section via the nav', async ({ page }) => {
    await page.getByText('CATALOG', { exact: true }).first().click();
    await expect(page.getByText('THE CINEMATIC CANVAS')).toBeVisible();
  });

  test('navigates to the ensemble (cast) section', async ({ page }) => {
    await page.getByText('ENSEMBLE', { exact: true }).first().click();
    await expect(page.getByText('THE ENSEMBLE')).toBeVisible();
  });

  test('scrolls home and reveals hero section content', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1200);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('page has no fatal console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(1500);
    expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
  });
});
