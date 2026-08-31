import { create } from 'zustand';
import { Catalog, normalizeMovie } from '../api/catalog';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const GUEST_FAVORITES = 'cine:guest:favorites';
const GUEST_WATCHLIST = 'cine:guest:watchlist';
const GUEST_SERIES_WATCHLIST = 'cine:guest:series-watchlist';
const DEMO_USER = 'cine:demo:user';
const VIEW_HISTORY = 'cine:view:history';

const readGuest = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const writeGuest = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const publicUser = (user) => user ? {
  id: user.id,
  email: user.email,
  name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Cinephile',
  avatar: user.user_metadata?.avatar_url || null,
} : null;

async function fetchRemoteCollection(table, userId) {
  const { data: rows, error } = await supabase.from(table).select('movie_id,created_at').eq('user_id', userId);
  if (error) throw error;
  const ids = (rows || []).map((row) => row.movie_id);
  if (!ids.length) return [];
  const { data: movies, error: movieError } = await supabase.from('Pelicula').select('*').in('id', ids);
  if (movieError) throw movieError;
  return (movies || []).map(normalizeMovie);
}

async function mergeGuestCollection(table, key, userId) {
  const movies = readGuest(key);
  const rows = (await Promise.all(movies.map(async (movie) => {
    const movieId = await Catalog.resolveDatabaseId(movie);
    return movieId ? { user_id: userId, movie_id: movieId } : null;
  }))).filter(Boolean);
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'user_id,movie_id' });
    if (error) throw error;
  }
  localStorage.removeItem(key);
}

async function fetchRemoteSeriesWatchlist(userId) {
  const { data, error } = await supabase.from('series_watchlist').select('tmdb_id,snapshot,created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({ ...row.snapshot, id: row.tmdb_id, tmdb_id: row.tmdb_id, media_type: 'tv' }));
}

async function mergeGuestSeries(userId) {
  const series = readGuest(GUEST_SERIES_WATCHLIST);
  if (series.length) {
    const rows = series.map((item) => ({ user_id: userId, tmdb_id: Number(item.id), snapshot: { ...item, media_type: 'tv' } }));
    const { error } = await supabase.from('series_watchlist').upsert(rows, { onConflict: 'user_id,tmdb_id' });
    if (error) throw error;
  }
  localStorage.removeItem(GUEST_SERIES_WATCHLIST);
}

export const useStore = create((set, get) => ({
  currentSection: 'home',
  selectedMovie: null,
  favorites: [],
  watchlist: [],
  seriesWatchlist: [],
  history: [],
  movies: [],
  loading: false,
  collectionLoading: false,
  collectionError: '',
  scrollProgress: 0,
  mousePosition: { x: 0, y: 0 },
  preloaderProgress: 0,
  isPreloaderDone: false,
  authReady: false,
  session: null,
  user: null,
  showAuthModal: false,
  showTrailerModal: false,
  trailerMovie: null,
  trailerOrigin: null,
  trailerMediaType: 'movie',

  setShowAuthModal: (show) => set({ showAuthModal: show }),
  openTrailer: (movie, options = {}) => set({ showTrailerModal: true, trailerMovie: movie, trailerOrigin: options.originRect || null, trailerMediaType: options.mediaType || movie?.media_type || 'movie' }),
  closeTrailer: () => set({ showTrailerModal: false, trailerMovie: null, trailerOrigin: null, trailerMediaType: 'movie' }),
  setSection: (section) => set({ currentSection: section }),
  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
  clearSelectedMovie: () => set({ selectedMovie: null }),
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setMousePosition: (pos) => set({ mousePosition: pos }),
  setPreloaderProgress: (progress) => set({ preloaderProgress: progress }),
  setPreloaderDone: () => set({ isPreloaderDone: true }),
  setMovies: (movies) => set({ movies }),
  recordMovieView: (movie) => {
    const current = readGuest(VIEW_HISTORY).filter((item) => String(item.id) !== String(movie.id));
    const next = [{ ...movie, viewedAt: new Date().toISOString() }, ...current].slice(0, 30);
    writeGuest(VIEW_HISTORY, next);
    set({ history: next });
  },

  loadCollections: async (userId = get().user?.id) => {
    set({ collectionLoading: true, collectionError: '' });
    try {
      if (userId && supabase) {
        const results = await Promise.allSettled([
          fetchRemoteCollection('user_favorites', userId),
          fetchRemoteCollection('user_watchlist', userId),
          fetchRemoteSeriesWatchlist(userId),
        ]);
        if (get().user?.id !== userId) return;
        const keys = ['favorites', 'watchlist', 'seriesWatchlist'];
        const localKeys = [GUEST_FAVORITES, GUEST_WATCHLIST, GUEST_SERIES_WATCHLIST];
        const collections = Object.fromEntries(results.map((result, index) => [keys[index], [...new Map([...(result.status === 'fulfilled' ? result.value : get()[keys[index]]), ...readGuest(localKeys[index])].map((item) => [String(item.id), item])).values()]]));
        set({ ...collections, collectionError: results.some((result) => result.status === 'rejected') ? 'Parte de tu colección no pudo sincronizarse. Tus elementos locales se conservan; puedes reintentar.' : '' });
      } else {
        set({ favorites: readGuest(GUEST_FAVORITES), watchlist: readGuest(GUEST_WATCHLIST), seriesWatchlist: readGuest(GUEST_SERIES_WATCHLIST) });
      }
    } finally {
      set({ collectionLoading: false });
    }
  },

  initializeApp: async () => {
    if (!supabase) {
      const demoUser = readGuest(DEMO_USER);
      set({ user: demoUser?.id ? demoUser : null, session: demoUser?.id ? { user: demoUser } : null });
      await get().loadCollections();
      set({ authReady: true, history: readGuest(VIEW_HISTORY) });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    set({ session, user: publicUser(session?.user) });
    if (session?.user) {
      await Promise.allSettled([
        mergeGuestCollection('user_favorites', GUEST_FAVORITES, session.user.id),
        mergeGuestCollection('user_watchlist', GUEST_WATCHLIST, session.user.id),
        mergeGuestSeries(session.user.id),
      ]);
    }
    await get().loadCollections(session?.user?.id);
    set({ authReady: true, history: readGuest(VIEW_HISTORY) });
    if (!get().authSubscription) {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        set({ session: nextSession, user: publicUser(nextSession?.user), authReady: true });
        window.setTimeout(async () => {
          if (nextSession?.user) {
            await Promise.allSettled([
              mergeGuestCollection('user_favorites', GUEST_FAVORITES, nextSession.user.id),
              mergeGuestCollection('user_watchlist', GUEST_WATCHLIST, nextSession.user.id),
              mergeGuestSeries(nextSession.user.id),
            ]);
          }
          await get().loadCollections(nextSession?.user?.id);
        }, 0);
      });
      set({ authSubscription: listener.subscription });
    }
  },

  loadFavorites: () => get().initializeApp(),

  signIn: async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      if (!email || password?.length < 8) throw new Error('Ingresa un correo y una contraseña de mínimo 8 caracteres.');
      const user = { id: `demo-${email.toLowerCase()}`, email: email.toLowerCase(), name: email.split('@')[0], demo: true };
      writeGuest(DEMO_USER, user);
      set({ user, session: { user }, authReady: true });
      return { user, session: { user } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUp: async ({ email, password, displayName }) => {
    if (!isSupabaseConfigured) {
      if (!email || password?.length < 8 || !displayName?.trim()) throw new Error('Completa nombre, correo y una contraseña de mínimo 8 caracteres.');
      const user = { id: `demo-${email.toLowerCase()}`, email: email.toLowerCase(), name: displayName.trim(), demo: true };
      writeGuest(DEMO_USER, user);
      set({ user, session: { user }, authReady: true });
      return { user, session: { user } };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  requestPasswordReset: async (email) => {
    if (!isSupabaseConfigured) throw new Error('Modo demostración: no se envían correos. Configura Supabase para recuperar una cuenta real.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/acceso?mode=update` });
    if (error) throw error;
  },

  updatePassword: async (password) => {
    if (!isSupabaseConfigured) throw new Error('Modo demostración: no hay una contraseña real que actualizar.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  signOut: async () => {
    if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
    else localStorage.removeItem(DEMO_USER);
    set({ session: null, user: null, favorites: readGuest(GUEST_FAVORITES), watchlist: readGuest(GUEST_WATCHLIST), seriesWatchlist: readGuest(GUEST_SERIES_WATCHLIST) });
  },

  addToCollection: async (type, movie) => {
    const key = type === 'favorites' ? GUEST_FAVORITES : GUEST_WATCHLIST;
    const table = type === 'favorites' ? 'user_favorites' : 'user_watchlist';
    const current = get()[type];
    if (current.some((item) => String(item.id) === String(movie.id))) return;
    const next = [...current, movie];
    set({ [type]: next });
    const userId = get().user?.id;
    if (!userId || !supabase) {
      writeGuest(key, next);
      return;
    }
    try {
      const movieId = await Catalog.resolveDatabaseId(movie);
      if (!movieId) throw new Error('Esta película todavía no está disponible en la colección.');
      const { error } = await supabase.from(table).upsert({ user_id: userId, movie_id: movieId }, { onConflict: 'user_id,movie_id' });
      if (error) throw error;
    } catch (error) {
      set((state) => ({ [type]: state[type].filter((item) => String(item.id) !== String(movie.id)) }));
      throw error;
    }
  },

  removeFromCollection: async (type, movieId) => {
    const key = type === 'favorites' ? GUEST_FAVORITES : GUEST_WATCHLIST;
    const table = type === 'favorites' ? 'user_favorites' : 'user_watchlist';
    const current = get()[type];
    const target = current.find((movie) => String(movie.id) === String(movieId));
    const next = current.filter((movie) => String(movie.id) !== String(movieId));
    set({ [type]: next });
    const userId = get().user?.id;
    if (!userId || !supabase) {
      writeGuest(key, next);
      return;
    }
    try {
      const databaseId = await Catalog.resolveDatabaseId(target || { id: movieId });
      if (!databaseId) throw new Error('No pudimos identificar esta película.');
      const { error } = await supabase.from(table).delete().eq('user_id', userId).eq('movie_id', databaseId);
      if (error) throw error;
    } catch (error) {
      set((state) => ({ [type]: target && !state[type].some((item) => String(item.id) === String(movieId)) ? [...state[type], target] : state[type] }));
      throw error;
    }
  },

  collectionAction: async (operation) => {
    set({ collectionError: '' });
    try { await operation(); return true; }
    catch { set({ collectionError: 'No se pudo guardar el cambio. Revisa tu conexión o inicia sesión de nuevo.' }); return false; }
  },
  addFavorite: (movie) => get().collectionAction(() => get().addToCollection('favorites', movie)),
  removeFavorite: (movieId) => get().collectionAction(() => get().removeFromCollection('favorites', movieId)),
  isFavorite: (movieId) => get().favorites.some((movie) => String(movie.id) === String(movieId)),
  addToWatchlist: (movie) => get().collectionAction(() => get().addToCollection('watchlist', movie)),
  removeFromWatchlist: (movieId) => get().collectionAction(() => get().removeFromCollection('watchlist', movieId)),
  isInWatchlist: (movieId) => get().watchlist.some((movie) => String(movie.id) === String(movieId)),
  addSeriesToWatchlist: async (series) => {
    const current = get().seriesWatchlist;
    if (current.some((item) => String(item.id) === String(series.id))) return;
    const next = [{ ...series, media_type: 'tv' }, ...current];
    set({ seriesWatchlist: next });
    const userId = get().user?.id;
    if (!userId || !supabase) return writeGuest(GUEST_SERIES_WATCHLIST, next);
    const { error } = await supabase.from('series_watchlist').upsert({ user_id: userId, tmdb_id: Number(series.id), snapshot: { ...series, media_type: 'tv' } }, { onConflict: 'user_id,tmdb_id' });
    if (error) { set({ seriesWatchlist: current }); throw error; }
  },
  removeSeriesFromWatchlist: async (seriesId) => {
    const current = get().seriesWatchlist;
    const next = current.filter((item) => String(item.id) !== String(seriesId));
    set({ seriesWatchlist: next });
    const userId = get().user?.id;
    if (!userId || !supabase) return writeGuest(GUEST_SERIES_WATCHLIST, next);
    const { error } = await supabase.from('series_watchlist').delete().eq('user_id', userId).eq('tmdb_id', Number(seriesId));
    if (error) { set({ seriesWatchlist: current }); throw error; }
  },
  isSeriesInWatchlist: (seriesId) => get().seriesWatchlist.some((item) => String(item.id) === String(seriesId)),
}));
