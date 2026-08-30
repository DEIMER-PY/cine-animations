const IMG_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function apiFetch(endpoint, params = {}) {
  const remoteProxy = SUPABASE_URL && SUPABASE_KEY;
  const url = new URL(remoteProxy ? `${SUPABASE_URL}/functions/v1/tmdb-proxy` : '/api/tmdb', window.location.origin);
  url.searchParams.set('path', endpoint);
  url.searchParams.set('language', 'es-CO');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = remoteProxy ? { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } : {};
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
  return res.json();
}

export const TMDB = {
  poster: (path, size = 'w500') => !path ? null : path.startsWith('http') ? path : `${IMG_BASE}/${size}${path}`,
  backdrop: (path, size = 'original') => !path ? null : path.startsWith('http') ? path : `${IMG_BASE}/${size}${path}`,
  profile: (path, size = 'w185') => !path ? null : path.startsWith('http') ? path : `${IMG_BASE}/${size}${path}`,

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
      append_to_response: 'credits,videos,similar,images',
    });
  },

  async fetchUpcoming() {
    const data = await apiFetch('/movie/upcoming', { page: '1' });
    return data.results;
  },

  async fetchPersonDetails(id) {
    return apiFetch(`/person/${id}`, { append_to_response: 'combined_credits,external_ids' });
  },

  async fetchSearch(query) {
    const data = await apiFetch('/search/movie', {
      query,
      page: '1',
    });
    return data.results;
  },

  async fetchPersonSearch(query) {
    const data = await apiFetch('/search/person', { query, page: '1' });
    return data.results;
  },

  async fetchTrendingPeople() {
    const data = await apiFetch('/trending/person/week', { page: '1' });
    return data.results;
  },

  async fetchGenres() {
    const data = await apiFetch('/genre/movie/list');
    return data.genres;
  },
};
