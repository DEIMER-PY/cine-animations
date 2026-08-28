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

export async function mockCatalog(page) {
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
