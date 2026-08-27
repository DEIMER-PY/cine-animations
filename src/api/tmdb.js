const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMG_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json;charset=utf-8',
};

async function apiFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('language', 'es-ES');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
  return res.json();
}

export const TMDB = {
  poster: (path, size = 'w500') => path?.startsWith('http') ? path : `${IMG_BASE}/${size}${path}`,
  backdrop: (path, size = 'original') => path?.startsWith('http') ? path : `${IMG_BASE}/${size}${path}`,
  profile: (path, size = 'w185') => path?.startsWith('http') ? path : `${IMG_BASE}/${size}${path}`,

  async fetchTrending() {
    const data = await apiFetch('/trending/movie/week');
    return data.results;
  },

  async fetchPopular() {
    const data = await apiFetch('/movie/popular', { page: '1' });
    return data.results;
  },

  async fetchTopRated() {
    const data = await apiFetch('/movie/top_rated', { page: '1' });
    return data.results;
  },

  async fetchNowPlaying() {
    const data = await apiFetch('/movie/now_playing', { page: '1' });
    return data.results;
  },

  async fetchMovieDetails(id) {
    return apiFetch(`/movie/${id}`, {
      append_to_response: 'credits,videos,similar',
    });
  },

  async fetchSearch(query) {
    const data = await apiFetch('/search/movie', {
      query,
      page: '1',
    });
    return data.results;
  },

  async fetchGenres() {
    const data = await apiFetch('/genre/movie/list');
    return data.genres;
  },
};
