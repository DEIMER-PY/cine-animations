import { Catalog } from './catalog';
import { TMDB } from './tmdb';
import { DEMO_MOVIES } from '../data/cinema';

export async function getCinemaMovies(category = 'trending', limit = 30) {
  try {
    const movies = await Catalog.fetchMovies(category, limit);
    const usable = (movies || []).filter((movie) => movie.backdrop_path && movie.poster_path);
    if (usable.length < 3) return DEMO_MOVIES.slice(0, limit).map((movie) => ({ ...movie, demo: true }));
    const needsGenres = usable.some((movie) => !movie.genres?.length && movie.genre_ids?.length);
    if (!needsGenres) return usable;
    const genres = await TMDB.fetchGenres();
    const byId = new Map(genres.map((genre) => [genre.id, genre]));
    return usable.map((movie) => ({ ...movie, genres: movie.genres?.length ? movie.genres : (movie.genre_ids || []).map((id) => byId.get(id)).filter(Boolean) }));
  } catch {
    return DEMO_MOVIES.slice(0, limit).map((movie) => ({ ...movie, demo: true }));
  }
}

export async function getCinemaMovie(id) {
  const demo = DEMO_MOVIES.find((movie) => String(movie.id) === String(id));
  if (demo) return { ...demo, demo: true };
  try {
    return await Catalog.fetchMovieDetails(id);
  } catch {
    return { ...DEMO_MOVIES[0], demo: true };
  }
}
