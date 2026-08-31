import { test, expect } from '@playwright/test';
import { mockCatalog } from './fixtures/catalog';

test.describe('CINE ANIMATIONS premium flow', () => {
  test.beforeEach(async ({ page }) => { await mockCatalog(page); await page.goto('/'); });

  test('renders the cinematic home and commerce action', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'CINE ANIMATIONS inicio' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Comprar entradas', exact: true }).first()).toBeVisible();
    await expect(page.getByText('AHORA EN PANTALLA')).toBeVisible();
    await expect(page.locator('.cinema-explorer')).toBeAttached();
  });

  test('navigates through real showtime and movie routes', async ({ page }) => {
    const desktopNav = page.getByRole('navigation', { name: 'Navegación principal' });
    if (await desktopNav.isVisible()) await desktopNav.getByRole('link', { name: 'Cartelera', exact: true }).click();
    else { await page.getByRole('button', { name: 'Abrir menú' }).click(); await page.locator('.cinema-menu a[href="/cartelera"]').click(); }
    await expect(page).toHaveURL(/\/cartelera/);
    await expect(page.getByRole('heading', { name: /LA CARTELERA/i })).toBeVisible();
    await page.locator('.schedule-row .movie-tile__image').first().click();
    await expect(page).toHaveURL(/\/pelicula\//);
    await expect(page.getByText('FUNCIONES DISPONIBLES')).toBeVisible();
    await expect(page.locator('.movie-index')).toBeAttached();
  });

  test('opens an interactive seat map', async ({ page }) => {
    await page.goto('/cartelera');
    await page.locator('.showtime-pill').first().click();
    await expect(page).toHaveURL(/\/funcion\/.+\/asientos/);
    await expect(page.locator('.booking-steps .is-active')).toContainText('ASIENTOS');
    await expect(page.locator('.cinema-seat').first()).toBeVisible();
  });

  test('keeps the mobile purchase path usable', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Comprar entradas', exact: true }).first()).toBeVisible();
    await expect(page.locator('#hero-title')).toBeVisible();
  });

  test('has no fatal page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(1200);
    expect(errors).toEqual([]);
  });

  test('opens global search from desktop or mobile navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'CINE ANIMATIONS inicio' })).toBeVisible();
    const desktopSearch = page.getByRole('button', { name: 'Buscar películas, series, personas o géneros' });
    if (await desktopSearch.isVisible()) await desktopSearch.click();
    else await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Buscar en el archivo cinematográfico' })).toBeVisible();
    await page.getByLabel('Consulta').fill('Avatar');
    await expect(page.getByLabel('Consulta')).toHaveValue('Avatar');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Buscar en el archivo cinematográfico' })).toBeHidden();
  });

  test('keeps editorial headlines complete and genre artwork unique', async ({ page }) => {
    await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 15000 });
    await expect(page.getByText('Historias que', { exact: true })).toBeVisible();
    await expect(page.getByText('piden oscuridad.', { exact: true })).toBeVisible();
    await expect(page.getByText('ESCENA.', { exact: true })).toBeAttached();
    const ids = await page.locator('.genre-window[data-movie-id]').evaluateAll((nodes) => nodes.map((node) => node.dataset.movieId));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('keeps the archive marquee moving while hovered', async ({ page }) => {
    const row = page.locator('.movie-frames__row').first();
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    const track = row.locator('.movie-frames__track');
    const before = await track.evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(700);
    const after = await track.evaluate((node) => getComputedStyle(node).transform);
    expect(after).not.toBe(before);
  });

  test('exposes real series and people routes', async ({ page }) => {
    await page.goto('/series');
    await expect(page.getByRole('heading', { name: /OTRO EPISODIO/i })).toBeVisible();
    await page.goto('/personas');
    await expect(page.getByRole('heading', { name: /EL CINE TAMBIÉN/i })).toBeVisible();
  });

  test('keeps an anonymous watch-later list on the device', async ({ page }) => {
    await expect(page.locator('.cinema-home')).toHaveAttribute('data-catalog-ready', 'true', { timeout: 15000 });
    const tile = page.locator('.movie-tile').first();
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();
    await tile.getByRole('button', { name: /Agregar a ver más tarde/i }).click();
    await page.goto('/cuenta');
    await page.getByRole('button', { name: /POR VER 1/ }).click();
    await expect(page.locator('.account-movies .movie-tile')).toHaveCount(1);
  });
});
