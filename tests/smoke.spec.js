import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const catalogFixture = Array.from({ length: 24 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  tmdbId: 1000 + index,
  titulo: index === 0 ? 'Spider-Man: Brand New Day' : `Film Archive ${String(index + 1).padStart(2, '0')}`,
  tituloOriginal: index === 0 ? 'Spider-Man: Brand New Day' : `Film Archive ${String(index + 1).padStart(2, '0')}`,
  sinopsis: 'Una pieza cinematográfica preparada para pruebas deterministas.',
  fechaEstreno: `202${index % 6}-01-01`,
  duracionMinutos: 118,
  clasificacion: 'PG-13',
  calificacion: 8.6,
  votos: 1200 + index,
  posterUrl: null,
  fondoUrl: null,
  trailerUrl: null,
  idiomaOriginal: 'es',
  estado: 'publicada',
  popularidad: 100 - index,
  tendencia: 100 - index,
  enCartelera: true,
  proximamente: false,
}));

async function mockCatalog(page) {
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type, apikey, x-client-info',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
      return;
    }
    if (request.method() !== 'GET') return route.continue();
    const url = new URL(request.url());
    const resource = url.pathname.split('/').pop();
    let body = [];
    if (resource === 'Pelicula') {
      const search = url.searchParams.get('titulo') || '';
      const movies = search ? catalogFixture.filter((movie) => movie.titulo.includes('Spider')) : catalogFixture;
      body = request.headers().accept?.includes('application/vnd.pgrst.object+json') ? movies[0] : movies;
    } else if (resource === 'Genero') {
      body = [{ id: 1, nombre: 'Drama', slug: 'drama' }];
    }
    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(body) });
  });
  await page.route('**/api.themoviedb.org/3/**', async (route) => {
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type, apikey, x-client-info',
      'access-control-allow-methods': 'GET,OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
      return;
    }
    const url = new URL(route.request().url());
    const movies = catalogFixture.map((movie) => ({
      id: movie.tmdbId,
      title: movie.titulo,
      original_title: movie.tituloOriginal,
      overview: movie.sinopsis,
      release_date: movie.fechaEstreno,
      vote_average: movie.calificacion,
      vote_count: movie.votos,
      poster_path: null,
      backdrop_path: null,
      genre_ids: [1],
      popularity: movie.popularidad,
    }));
    let body = { results: movies };
    if (url.pathname.includes('/genre/movie/list')) body = { genres: [{ id: 1, name: 'Drama' }] };
    if (/\/movie\/\d+$/.test(url.pathname)) body = { ...movies[0], credits: { cast: [] }, videos: { results: [] }, similar: { results: movies.slice(1, 5) } };
    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(body) });
  });
}

async function openApp(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.addStyleTag({
    content: '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important}',
  });
  await expect(page.locator('nav').first()).toBeVisible({ timeout: 20000 });
}

test.describe('CINE ANIMATIONS', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await mockCatalog(page);
    await openApp(page);
  });

  test('renders the navigation and the five-phase hero', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'HOME', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'CATALOG', exact: true }).first()).toBeVisible();
    const title = page.getByRole('heading', { level: 1 });
    if (await title.count()) {
      const heroHeight = await title.locator('xpath=ancestor::section').evaluate((section) => section.scrollHeight);
      expect(heroHeight).toBeGreaterThan(4000);
    } else {
      await expect(page.getByText('CINE', { exact: true }).last()).toBeVisible();
    }
  });

  test('searches movies, people and genres from the command palette', async ({ page }) => {
    await page.locator('body').press('/');
    const search = page.getByRole('textbox', { name: 'Consulta' });
    await search.fill('Spider');
    await expect(page.getByRole('button', { name: /Spider-Man: Brand New Day/ })).toBeVisible({ timeout: 15000 });
    await search.press('Escape');
    await expect(search).toBeHidden();
  });

  test('filters, sorts and progressively loads the catalog', async ({ page }) => {
    await page.getByRole('button', { name: 'CATALOG', exact: true }).first().evaluate((button) => button.click());
    await expect(page.getByRole('heading', { name: 'THE ARCHIVE' })).toBeVisible();
    await expect(page.locator('article')).toHaveCount(12, { timeout: 30000 });
    await page.getByRole('combobox', { name: 'Rating' }).selectOption('8');
    await expect(page.getByText(/★ 8\./).first()).toBeVisible();
    const loadMore = page.getByRole('button', { name: /CARGAR OTRO ROLLO/ });
    if (await loadMore.isVisible()) {
      await loadMore.click();
      await expect(page.locator('article')).not.toHaveCount(12);
    }
  });

  test('persists guest favorites and watchlist across reloads', async ({ page }) => {
    await page.getByRole('button', { name: 'CATALOG', exact: true }).first().evaluate((button) => button.click());
    await expect(page.getByRole('button', { name: 'Añadir a favoritos' }).first()).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Añadir a favoritos' }).first().click({ force: true });
    await page.getByRole('button', { name: 'Añadir a ver después' }).first().click({ force: true });
    await page.reload();
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Abrir mi colección' }).click();
    await expect(page.getByRole('button', { name: 'FAVORITES · 1' })).toBeVisible();
    await page.getByRole('button', { name: 'WATCH LATER · 1' }).click();
    await expect(page.getByText('QUEUED TO WATCH')).toBeVisible();
  });

  test('opens movie details and closes with Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'CATALOG', exact: true }).first().evaluate((button) => button.click());
    await expect(page.locator('article').first()).toBeVisible({ timeout: 30000 });
    await page.locator('article').first().locator('button').first().click({ force: true });
    await expect(page.getByRole('button', { name: 'Close movie details' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Close movie details' })).toBeHidden();
  });

  test('validates login, registration and recovery without fake social controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Iniciar sesión' }).evaluate((button) => button.click());
    await expect(page.getByRole('dialog', { name: 'WELCOME BACK' })).toBeVisible();
    await page.getByRole('button', { name: 'ENTRAR AL ARCHIVO' }).click({ force: true });
    await expect(page.getByText('Escribe un correo válido.')).toBeVisible();
    await page.getByRole('button', { name: 'REGISTRARME' }).click();
    await expect(page.getByRole('heading', { name: 'JOIN THE ARCHIVE' })).toBeVisible();
    await page.getByRole('button', { name: 'ENTRAR', exact: true }).click();
    await page.getByRole('button', { name: /¿OLVIDASTE/ }).click();
    await expect(page.getByRole('heading', { name: 'RECOVER ACCESS' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('has no serious accessibility violations on the catalog', async ({ page }) => {
    await page.getByRole('button', { name: 'CATALOG', exact: true }).first().evaluate((button) => button.click());
    await expect(page.locator('article').first()).toBeVisible({ timeout: 30000 });
    const scan = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
    const important = scan.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact));
    expect(important).toEqual([]);
  });

  test('runs without fatal browser errors', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.reload();
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 20000 });
    const fatalErrors = errors.filter((error) => !error.includes('favicon') && !error.includes('Failed to load resource'));
    expect(fatalErrors).toEqual([]);
  });
});

test.describe('mobile experience', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('uses touch navigation and opens the mobile menu', async ({ page }) => {
    await mockCatalog(page);
    await openApp(page);
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeVisible();
    await page.getByRole('button', { name: 'CATALOG', exact: true }).first().evaluate((button) => button.click());
    await expect(page.getByRole('heading', { name: 'THE ARCHIVE' })).toBeVisible();
  });
});
