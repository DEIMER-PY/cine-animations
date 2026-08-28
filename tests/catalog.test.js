import { describe, expect, it } from 'vitest';
import { normalizeMovie } from '../src/api/catalog';

describe('normalizeMovie', () => {
  it('normalizes the Spanish database contract into the stable UI model', () => {
    const movie = normalizeMovie({
      id: 'db-1',
      tmdbId: 42,
      titulo: 'La película',
      tituloOriginal: 'The Movie',
      sinopsis: 'Una historia.',
      fechaEstreno: '2026-08-27',
      calificacion: '8.7',
      posterUrl: '/poster.jpg',
      fondoUrl: '/backdrop.jpg',
    });

    expect(movie).toMatchObject({
      id: 42,
      databaseId: 'db-1',
      tmdbId: 42,
      title: 'La película',
      original_title: 'The Movie',
      overview: 'Una historia.',
      release_date: '2026-08-27',
      vote_average: 8.7,
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
    });
  });

  it('keeps a TMDB fallback movie usable', () => {
    const movie = normalizeMovie({ id: 7, title: 'Fallback', vote_average: 6.5 });
    expect(movie.title).toBe('Fallback');
    expect(movie.vote_average).toBe(6.5);
    expect(movie.genres).toEqual([]);
  });
});
