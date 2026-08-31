// Stable catalog fixtures. Live YouTube/TMDB playback is checked separately in-browser.
export const movies = Array.from({ length: 24 }, (_, index) => ({
  id: 1000 + index, title: `Película ${index + 1}`, name: `Serie ${index + 1}`,
  overview: 'Una historia de cine para comprobar navegación, cartelera y entradas.',
  poster_path: `/poster-${index}.jpg`, backdrop_path: `/scene-${index}.jpg`,
  vote_average: 6 + index / 10, vote_count: 100, popularity: 30 - index, release_date: `${index % 2 ? '2025' : '2026'}-08-20`, original_language: index % 2 ? 'es' : 'en',
  first_air_date: '2026-08-20', runtime: 120,
  genres: [{ id: index % 6 + 1, name: ['Acción', 'Drama', 'Animación', 'Comedia', 'Suspenso', 'Fantasía'][index % 6] }],
}));

export async function mockCatalog(page) {
  await page.route('**/rest/v1/**', (route) => route.fulfill({ status: 503, json: { message: 'Offline test fixture' } }));
  await page.route('https://image.tmdb.org/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="500" height="750" fill="#293448"/><circle cx="250" cy="300" r="110" fill="#bb1737"/></svg>' }));
  await page.route('https://images.unsplash.com/**', (route) => route.abort());
  await page.route(/(?:api\/tmdb|functions\/v1\/tmdb-proxy)\?/, async (route) => {
    const path = new URL(route.request().url()).searchParams.get('path') || '';
    if (path.endsWith('/videos')) return route.fulfill({ json: { results: [] } });
    if (/^\/(movie|tv)\/\d+$/.test(path)) return route.fulfill({ json: { ...(movies.find((movie) => movie.id === Number(path.split('/')[2])) || movies[0]), credits: { cast: [] }, videos: { results: [] }, seasons: [], similar: { results: movies.slice(1, 5) } } });
    if (path.includes('person')) return route.fulfill({ json: { results: movies.slice(0, 9).map((movie) => ({ id: movie.id, name: `Talento ${movie.id}`, profile_path: movie.poster_path, known_for_department: 'Acting', known_for: [movie] })) } });
    if (path.includes('/genre/')) return route.fulfill({ json: { genres: movies.slice(0, 6).flatMap((movie) => movie.genres) } });
    return route.fulfill({ json: { results: movies } });
  });
}
