import { supabase } from '../lib/supabase';
import { TMDB } from './tmdb';

const MOVIE_COLUMNS = 'id,tmdbId,titulo,tituloOriginal,sinopsis,fechaEstreno,duracionMinutos,clasificacion,calificacion,votos,posterUrl,fondoUrl,trailerUrl,idiomaOriginal,estado,popularidad,tendencia,enCartelera,proximamente';

export function normalizeMovie(row) {
  if (!row) return null;
  const tmdbId = row.tmdbId ?? row.tmdb_id ?? row.id;
  return {
    id: tmdbId,
    databaseId: row.databaseId ?? (row.tmdbId != null ? row.id : null),
    tmdbId,
    title: row.titulo ?? row.title ?? 'Untitled',
    original_title: row.tituloOriginal ?? row.original_title ?? row.titulo ?? row.title,
    overview: row.sinopsis ?? row.overview ?? '',
    release_date: row.fechaEstreno ?? row.release_date ?? null,
    runtime: row.duracionMinutos ?? row.runtime ?? null,
    certification: row.clasificacion ?? row.certification ?? null,
    vote_average: Number(row.calificacion ?? row.vote_average ?? 0),
    vote_count: Number(row.votos ?? row.vote_count ?? 0),
    poster_path: row.posterUrl ?? row.poster_path ?? null,
    backdrop_path: row.fondoUrl ?? row.backdrop_path ?? null,
    trailer_url: row.trailerUrl ?? row.trailer_url ?? null,
    original_language: row.idiomaOriginal ?? row.original_language ?? 'es',
    popularity: Number(row.popularidad ?? row.popularity ?? 0),
    trend: Number(row.tendencia ?? row.trend ?? 0),
    nowPlaying: Boolean(row.enCartelera ?? row.nowPlaying),
    upcoming: Boolean(row.proximamente ?? row.upcoming),
    genres: row.genres ?? [],
    genre_ids: row.genre_ids ?? [],
    credits: row.credits,
    videos: row.videos,
    similar: row.similar,
  };
}

function normalizeFallback(movie) {
  return normalizeMovie({ ...movie, tmdbId: movie.id, databaseId: movie.databaseId ?? null });
}

async function fetchCatalog(category = 'trending', limit = 30) {
  if (!supabase) throw new Error('Supabase is not configured');
  let query = supabase.from('Pelicula').select(MOVIE_COLUMNS).limit(limit);

  if (category === 'topRated') query = query.order('calificacion', { ascending: false, nullsFirst: false });
  else if (category === 'nowPlaying') query = query.eq('enCartelera', true).order('popularidad', { ascending: false, nullsFirst: false });
  else if (category === 'upcoming') query = query.eq('proximamente', true).order('fechaEstreno', { ascending: true, nullsFirst: false });
  else if (category === 'popular') query = query.order('popularidad', { ascending: false, nullsFirst: false });
  else query = query.order('tendencia', { ascending: false, nullsFirst: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeMovie);
}

async function fallbackCategory(category) {
  if (category === 'popular') return TMDB.fetchPopular();
  if (category === 'topRated') return TMDB.fetchTopRated();
  if (category === 'nowPlaying') return TMDB.fetchNowPlaying();
  if (category === 'upcoming') return TMDB.fetchUpcoming();
  return TMDB.fetchTrending();
}

export const Catalog = {
  async fetchMovies(category = 'trending', limit = 30) {
    try {
      return await fetchCatalog(category, limit);
    } catch {
      const movies = await fallbackCategory(category);
      return movies.slice(0, limit).map(normalizeFallback);
    }
  },

  async browse(limit = 100) {
    const movies = await fetchCatalog('popular', limit);
    if (!supabase || !movies.length) return movies;
    const databaseIds = movies.map((movie) => movie.databaseId).filter(Boolean);
    const { data: links } = await supabase
      .from('GeneroPelicula')
      .select('peliculaId,generoId,Genero(id,nombre,slug)')
      .in('peliculaId', databaseIds);
    const byMovie = new Map();
    (links || []).forEach((link) => {
      const genres = byMovie.get(link.peliculaId) || [];
      genres.push({ id: link.Genero?.id ?? link.generoId, name: link.Genero?.nombre, slug: link.Genero?.slug });
      byMovie.set(link.peliculaId, genres);
    });
    return movies.map((movie) => {
      const genres = byMovie.get(movie.databaseId) || [];
      return { ...movie, genres, genre_ids: genres.map((genre) => genre.id) };
    });
  },

  async search(query, limit = 12) {
    const value = query.trim();
    if (value.length < 2) return [];
    if (supabase) {
      const { data, error } = await supabase
        .from('Pelicula')
        .select(MOVIE_COLUMNS)
        .ilike('titulo', `%${value.replace(/[%_]/g, '')}%`)
        .order('popularidad', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (!error) return (data || []).map(normalizeMovie);
    }
    const movies = await TMDB.fetchSearch(value);
    return movies.slice(0, limit).map(normalizeFallback);
  },

  async commandSearch(query, limit = 8) {
    const value = query.trim().replace(/[%_]/g, '');
    if (value.length < 2) return { movies: [], people: [], genres: [] };
    const moviesPromise = this.search(value, limit);
    if (!supabase) {
      const [movies, people, genres] = await Promise.all([moviesPromise, TMDB.fetchPersonSearch(value), TMDB.fetchGenres()]);
      return {
        movies,
        people: people.slice(0, 5).map((person) => ({ id: person.id, name: person.name, profilePath: person.profile_path, profession: person.known_for_department })),
        genres: genres.filter((genre) => genre.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5),
      };
    }
    const [movies, peopleResult, genresResult] = await Promise.all([
      moviesPromise,
      supabase.from('Persona').select('id,tmdbId,nombre,fotoUrl,profesion').ilike('nombre', `%${value}%`).limit(5),
      supabase.from('Genero').select('id,nombre,slug').ilike('nombre', `%${value}%`).limit(5),
    ]);
    return {
      movies,
      people: (peopleResult.data || []).map((person) => ({ id: person.tmdbId ?? person.id, name: person.nombre, profilePath: person.fotoUrl, profession: person.profesion })),
      genres: (genresResult.data || []).map((genre) => ({ id: genre.id, name: genre.nombre, slug: genre.slug })),
    };
  },

  async fetchGenres() {
    if (supabase) {
      const { data, error } = await supabase.from('Genero').select('id,nombre,slug').order('nombre');
      if (!error) return (data || []).map((genre) => ({ id: genre.id, name: genre.nombre, slug: genre.slug }));
    }
    return TMDB.fetchGenres();
  },

  async fetchMovieDetails(id) {
    if (supabase) {
      const numericId = Number(id);
      const movieQuery = supabase.from('Pelicula').select(MOVIE_COLUMNS);
      const { data: row, error } = Number.isFinite(numericId)
        ? await movieQuery.eq('tmdbId', numericId).maybeSingle()
        : await movieQuery.eq('id', id).maybeSingle();

      if (!error && row) {
        const [videosResult, creditsResult] = await Promise.all([
          supabase.from('VideoPelicula').select('clave,sitio,tipo,nombre,oficial,idioma,publicadoEn').eq('peliculaId', row.id),
          supabase.from('Credito').select('id,tipo,personaje,orden,Persona(id,tmdbId,nombre,fotoUrl,profesion,imdbId)').eq('peliculaId', row.id).order('orden').limit(24),
        ]);
        const videos = (videosResult.data || []).map((video) => ({
          key: video.clave,
          site: video.sitio,
          type: video.tipo,
          name: video.nombre,
          official: video.oficial,
        }));
        const cast = (creditsResult.data || []).map((credit) => ({
          id: credit.Persona?.tmdbId ?? credit.Persona?.id ?? credit.id,
          name: credit.Persona?.nombre ?? 'Unknown',
          character: credit.personaje ?? credit.tipo,
          profile_path: credit.Persona?.fotoUrl ?? null,
          order: credit.orden,
        }));
        return normalizeMovie({
          ...row,
          videos: { results: videos },
          credits: { cast },
          similar: { results: [] },
        });
      }
    }
    return normalizeFallback(await TMDB.fetchMovieDetails(id));
  },

  async resolveDatabaseId(movie) {
    if (movie.databaseId) return movie.databaseId;
    if (!supabase || !movie.tmdbId && !movie.id) return null;
    const { data } = await supabase
      .from('Pelicula')
      .select('id')
      .eq('tmdbId', Number(movie.tmdbId ?? movie.id))
      .maybeSingle();
    return data?.id ?? null;
  },
};
