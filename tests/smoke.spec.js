import { test, expect } from '@playwright/test';

test.describe('CINE ANIMATIONS premium flow', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('renders the cinematic home and commerce action', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'CINE ANIMATIONS inicio' })).toBeVisible();
    await expect(page.getByText('COMPRAR ENTRADAS').first()).toBeVisible();
    await expect(page.getByText('AHORA EN PANTALLA')).toBeVisible();
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
  });

  test('opens an interactive seat map', async ({ page }) => {
    await page.goto('/cartelera');
    await page.locator('.showtime-pill').first().click();
    await expect(page).toHaveURL(/\/funcion\/.+\/asientos/);
    await expect(page.getByText('SELECCIÓN DE ASIENTOS')).toBeVisible();
    await expect(page.locator('.cinema-seat').first()).toBeVisible();
  });

  test('keeps the mobile purchase path usable', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await expect(page.getByText('COMPRAR ENTRADAS').first()).toBeVisible();
    await expect(page.locator('.hero-title')).toBeVisible();
  });

  test('has no fatal page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(1200);
    expect(errors).toEqual([]);
  });

  test('opens global search from desktop or mobile navigation', async ({ page }) => {
    const desktopSearch = page.getByRole('button', { name: 'Buscar películas, personas o géneros' });
    if (await desktopSearch.isVisible()) await desktopSearch.click();
    else await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Buscar en el archivo cinematográfico' })).toBeVisible();
    await page.getByLabel('Consulta').fill('Avatar');
    await expect(page.getByLabel('Consulta')).toHaveValue('Avatar');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Buscar en el archivo cinematográfico' })).toBeHidden();
  });

  test('keeps an anonymous watch-later list on the device', async ({ page }) => {
    const tile = page.locator('.movie-tile').first();
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();
    await tile.getByRole('button', { name: /Agregar a ver más tarde/i }).click();
    await page.goto('/cuenta');
    await page.getByRole('button', { name: /POR VER 1/ }).click();
    await expect(page.locator('.account-movies .movie-tile')).toHaveCount(1);
  });
});
