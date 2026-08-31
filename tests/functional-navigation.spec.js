import { expect, test } from '@playwright/test';
import { mockCatalog } from './fixtures/catalog';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockCatalog(page);
});

test('navigation menu opens every destination and closes with Escape', async ({ page }) => {
  await page.goto('/');
  for (const [name, path] of [['Cartelera', '/cartelera'], ['Próximamente', '/cartelera?tab=proximamente'], ['Series', '/series'], ['Personas', '/personas'], ['Mi archivo', '/cuenta'], ['Acceso', '/acceso']]) {
    if (await page.locator('.cinema-nav__menu').isVisible()) {
      await page.getByRole('button', { name: 'Abrir menú' }).click();
      await page.locator('.cinema-menu').getByRole('link', { name, exact: false }).click();
    } else if (name === 'Mi archivo') await page.getByRole('link', { name: 'Colección y ver más tarde' }).click();
    else if (name === 'Acceso') await page.getByRole('link', { name: 'Iniciar sesión' }).click();
    else await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path.replace('?', '\\?') + (name === 'Acceso' ? '(?:\\?.*)?$' : '$')));
    await expect(page.locator('.cinema-menu')).toHaveCount(0);
  }
  if (await page.locator('.cinema-nav__menu').isVisible()) {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.cinema-menu')).toHaveCount(0);
  }
});

test('favorites and watchlist persist, display in account and can be removed', async ({ page }) => {
  await page.goto('/cartelera');
  const tile = page.locator('.movie-tile').first();
  await tile.getByRole('button', { name: 'Agregar a favoritos', exact: true }).click();
  await tile.getByRole('button', { name: 'Agregar a ver más tarde' }).click();
  await page.reload();
  await expect(tile.getByRole('button', { name: 'Quitar de favoritos' })).toBeVisible();
  await expect(tile.getByRole('button', { name: 'Quitar de ver más tarde' })).toBeVisible();
  const collection = page.locator('.cinema-nav__actions').getByRole('link', { name: 'Colección y ver más tarde' });
  if (await collection.isVisible()) await collection.click();
  else await page.getByRole('navigation', { name: 'Accesos rápidos' }).getByRole('link', { name: 'Mi lista' }).click();
  await expect(page.getByRole('button', { name: 'FAVORITOS 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'PELÍCULAS POR VER 1' }).click();
  await page.getByRole('button', { name: 'Quitar de ver más tarde' }).click();
  await expect(page.getByRole('button', { name: 'PELÍCULAS POR VER 0' })).toBeVisible();
  await page.getByRole('button', { name: 'FAVORITOS 1', exact: true }).click();
  await page.getByRole('button', { name: 'Quitar de favoritos' }).click();
  await expect(page.getByRole('button', { name: 'FAVORITOS 0', exact: true })).toBeVisible();
});

test('filters combine year and language, search ignores accents and reset works', async ({ page }) => {
  await page.goto('/cartelera');
  await expect(page.locator('.schedule-row').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'AÑO', exact: true }).selectOption('2025');
  await page.getByRole('combobox', { name: 'IDIOMA', exact: true }).selectOption('en');
  await expect(page.locator('.schedule-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'LIMPIAR FILTROS' }).click();
  await page.getByPlaceholder('Buscar por título o género…').fill('accion');
  await expect(page.locator('.schedule-row').first()).toBeVisible();
  for (const title of await page.locator('.schedule-row__info > p:first-child').allTextContents()) expect(title).toContain('Acción');
  await page.getByRole('button', { name: 'LIMPIAR FILTROS' }).click();
  await page.getByRole('combobox', { name: 'ORDEN', exact: true }).selectOption('RATING');
  await expect(page.locator('.schedule-row__info h2').first()).toHaveText('Película 18');
  await page.locator('.format-filter').getByRole('button', { name: 'IMAX', exact: true }).click();
  for (const text of await page.locator('.showtime-pill').allTextContents()) expect(text).toContain('IMAX');
});

test('global search navigates to a result and clearing removes old results', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('button', { name: 'Buscar películas, series, personas o géneros', exact: true });
  if (await search.isVisible()) await search.click();
  else await page.getByRole('navigation', { name: 'Accesos rápidos' }).getByRole('button', { name: 'Buscar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Buscar en el archivo cinematográfico' });
  await dialog.getByRole('textbox', { name: 'Consulta' }).fill('Pelicula');
  await expect(dialog.getByText(/PELÍCULAS ·/)).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Consulta' }).fill('');
  await expect(dialog.getByText(/PELÍCULAS ·/)).toHaveCount(0);
  await dialog.getByRole('textbox', { name: 'Consulta' }).fill('Pelicula');
  await dialog.getByRole('button', { name: /Película 1 2026/ }).click();
  await expect(page).toHaveURL(/\/pelicula\/1000$/);
  await expect(dialog).toHaveCount(0);
});

test('demo login returns to requested page, persists and signs out', async ({ page }) => {
  await page.goto('/acceso?returnTo=/cuenta');
  await page.locator('input[name=email]').fill('prueba@example.test');
  await page.locator('input[name=password]').fill('DemoSolo123!');
  await page.getByRole('button', { name: 'ENTRAR AL ARCHIVO' }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
  await expect(page.getByText('prueba@example.test', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'CERRAR SESIÓN' }).click();
  await expect(page.getByText('ARCHIVO LOCAL', { exact: true })).toBeVisible();
  await page.goto('/acceso');
  await page.getByRole('button', { name: '¿OLVIDASTE TU CONTRASEÑA?' }).click();
  await page.locator('input[name=email]').fill('prueba@example.test');
  await page.getByRole('button', { name: 'ENVIAR ENLACE' }).click();
  await expect(page.getByRole('status')).toContainText('no se envían correos');
});
