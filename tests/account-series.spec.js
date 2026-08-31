import { expect, test } from '@playwright/test';
import { mockCatalog } from './fixtures/catalog';

test.beforeEach(async ({ page }) => { await mockCatalog(page); await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('series watchlist survives reload and its account card opens the series', async ({ page }) => {
  await page.goto('/series');
  await page.locator('.series-card').first().getByRole('button', { name: 'Guardar serie en mi lista' }).click();
  await page.reload();
  await expect(page.locator('.series-card').first().getByRole('button', { name: 'Quitar serie de mi lista' })).toBeVisible();
  await page.goto('/cuenta');
  await page.getByRole('button', { name: 'SERIES POR VER 1', exact: true }).click();
  await expect(page.locator('.account-series .series-card')).toHaveCount(1);
  await page.locator('.account-series .series-card__poster').click();
  await expect(page).toHaveURL(/\/serie\/\d+$/);
  await page.goto('/cuenta');
  await page.getByRole('button', { name: 'SERIES POR VER 1', exact: true }).click();
  await page.getByRole('button', { name: 'Quitar serie de mi lista' }).click();
  await expect(page.getByRole('button', { name: 'SERIES POR VER 0', exact: true })).toBeVisible();
});

test('demo registration validates confirmation and recovery view does not redirect', async ({ page }) => {
  await page.goto('/acceso');
  await page.getByRole('button', { name: 'REGISTRARME' }).click();
  await page.locator('input[name=displayName]').fill('Visitante QA');
  await page.locator('input[name=email]').fill('registro@example.test');
  await page.locator('input[name=password]').fill('PruebaLocal123!');
  await page.locator('input[name=confirmation]').fill('Distinta123!');
  await page.getByRole('button', { name: 'CREAR CUENTA' }).click();
  await expect(page.getByRole('status')).toContainText('no coinciden');
  await page.locator('input[name=confirmation]').fill('PruebaLocal123!');
  await page.getByRole('button', { name: 'CREAR CUENTA' }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
  await expect(page.getByRole('heading', { name: 'HOLA, VISITANTE QA' })).toBeVisible();
  await page.goto('/acceso?mode=update');
  await expect(page.getByRole('heading', { name: 'NUEVA CONTRASEÑA' })).toBeVisible();
  await expect(page).toHaveURL(/mode=update$/);
});
