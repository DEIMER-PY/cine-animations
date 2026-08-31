import { describe, expect, it } from 'vitest';
import { normalizeSeries } from '../../src/api/catalog';
import { assignUniqueGenreMovies, nextHeroIndex, wrapCarouselIndex } from '../../src/utils/cinemaDiscovery';

describe('cinematic discovery helpers', () => {
  const movies = [
    { id: 1, backdrop_path: '/one.jpg', genres: [{ name: 'Drama' }, { name: 'Crimen' }] },
    { id: 2, backdrop_path: '/two.jpg', genres: [{ name: 'Crimen' }] },
    { id: 3, backdrop_path: '/three.jpg', genres: [{ name: 'Acción' }] },
  ];

  it('assigns a unique movie and backdrop to every genre window', () => {
    const entries = assignUniqueGenreMovies(movies, 3);
    expect(new Set(entries.map(([, movie]) => movie.id)).size).toBe(entries.length);
    expect(new Set(entries.map(([, movie]) => movie.backdrop_path)).size).toBe(entries.length);
    entries.forEach(([genre, movie]) => expect(movie.genres.some((item) => item.name === genre)).toBe(true));
  });

  it('wraps spotlight and hero indexes in both directions', () => {
    expect(wrapCarouselIndex(0, -1, 7)).toBe(6);
    expect(wrapCarouselIndex(6, 1, 7)).toBe(0);
    expect(nextHeroIndex(4, 5)).toBe(0);
  });

  it('normalizes TMDB series into the shared media contract', () => {
    const series = normalizeSeries({ id: 99, name: 'Prueba', first_air_date: '2026-08-30', vote_average: '8.7' });
    expect(series).toMatchObject({ id: 99, title: 'Prueba', media_type: 'tv', release_date: '2026-08-30', vote_average: 8.7 });
  });
});
