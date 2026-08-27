import { create } from 'zustand';
import { Catalog, normalizeMovie } from '../api/catalog';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const GUEST_FAVORITES = 'cine:guest:favorites';
const GUEST_WATCHLIST = 'cine:guest:watchlist';

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

export const useStore = create((set, get) => ({
  currentSection: 'home',
  selectedMovie: null,
  favorites: [],
  watchlist: [],
  movies: [],
  loading: false,
  collectionLoading: false,
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

  setShowAuthModal: (show) => set({ showAuthModal: show }),
  openTrailer: (movie) => set({ showTrailerModal: true, trailerMovie: movie }),
  closeTrailer: () => set({ showTrailerModal: false, trailerMovie: null }),
  setSection: (section) => set({ currentSection: section }),
  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
  clearSelectedMovie: () => set({ selectedMovie: null }),
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setMousePosition: (pos) => set({ mousePosition: pos }),
  setPreloaderProgress: (progress) => set({ preloaderProgress: progress }),
  setPreloaderDone: () => set({ isPreloaderDone: true }),
  setMovies: (movies) => set({ movies }),

  loadCollections: async (userId = get().user?.id) => {
    set({ collectionLoading: true });
    try {
      if (userId && supabase) {
        const [favorites, watchlist] = await Promise.all([
          fetchRemoteCollection('user_favorites', userId),
          fetchRemoteCollection('user_watchlist', userId),
        ]);
        set({ favorites, watchlist });
      } else {
        set({ favorites: readGuest(GUEST_FAVORITES), watchlist: readGuest(GUEST_WATCHLIST) });
      }
    } finally {
      set({ collectionLoading: false });
    }
  },

  initializeApp: async () => {
    if (!supabase) {
      await get().loadCollections();
      set({ authReady: true });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    set({ session, user: publicUser(session?.user) });
    if (session?.user) {
      await Promise.all([
        mergeGuestCollection('user_favorites', GUEST_FAVORITES, session.user.id),
        mergeGuestCollection('user_watchlist', GUEST_WATCHLIST, session.user.id),
      ]);
    }
    await get().loadCollections(session?.user?.id);
    set({ authReady: true });
    if (!get().authSubscription) {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        set({ session: nextSession, user: publicUser(nextSession?.user), authReady: true });
        window.setTimeout(() => get().loadCollections(nextSession?.user?.id), 0);
      });
      set({ authSubscription: listener.subscription });
    }
  },

  loadFavorites: () => get().initializeApp(),

  signIn: async ({ email, password }) => {
    if (!isSupabaseConfigured) throw new Error('Supabase no está configurado.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUp: async ({ email, password, displayName }) => {
    if (!isSupabaseConfigured) throw new Error('Supabase no está configurado.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  requestPasswordReset: async (email) => {
    if (!isSupabaseConfigured) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
    set({ session: null, user: null, favorites: readGuest(GUEST_FAVORITES), watchlist: readGuest(GUEST_WATCHLIST) });
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
    const movieId = await Catalog.resolveDatabaseId(movie);
    if (!movieId) throw new Error('Esta película todavía no está disponible en la colección.');
    const { error } = await supabase.from(table).upsert({ user_id: userId, movie_id: movieId }, { onConflict: 'user_id,movie_id' });
    if (error) {
      set({ [type]: current });
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
    const databaseId = await Catalog.resolveDatabaseId(target || { id: movieId });
    const { error } = await supabase.from(table).delete().eq('user_id', userId).eq('movie_id', databaseId);
    if (error) {
      set({ [type]: current });
      throw error;
    }
  },

  addFavorite: (movie) => get().addToCollection('favorites', movie),
  removeFavorite: (movieId) => get().removeFromCollection('favorites', movieId),
  isFavorite: (movieId) => get().favorites.some((movie) => String(movie.id) === String(movieId)),
  addToWatchlist: (movie) => get().addToCollection('watchlist', movie),
  removeFromWatchlist: (movieId) => get().removeFromCollection('watchlist', movieId),
  isInWatchlist: (movieId) => get().watchlist.some((movie) => String(movie.id) === String(movieId)),
}));
