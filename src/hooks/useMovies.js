import { useState, useEffect, useCallback } from 'react';
import { TMDB } from '../api/tmdb';

export function useMovies(category = 'trending') {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      switch (category) {
        case 'popular':
          data = await TMDB.fetchPopular();
          break;
        case 'topRated':
          data = await TMDB.fetchTopRated();
          break;
        case 'nowPlaying':
          data = await TMDB.fetchNowPlaying();
          break;
        default:
          data = await TMDB.fetchTrending();
      }
      setMovies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return { movies, loading, error, refetch: fetchMovies };
}

export function useMovieDetails(id) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await TMDB.fetchMovieDetails(id);
        if (!cancelled) setMovie(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return { movie, loading, error };
}

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await TMDB.fetchSearch(query);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}

export function useGenres() {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    TMDB.fetchGenres().then(setGenres).catch(() => {});
  }, []);

  const getGenreName = (id) => {
    const g = genres.find((g) => g.id === id);
    return g ? g.name : '';
  };

  return { genres, getGenreName };
}
