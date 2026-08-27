import { create } from 'zustand';

const API_URL = import.meta.env.VITE_JSON_SERVER_URL || 'http://localhost:3001';

export const useStore = create((set, get) => ({
  currentSection: 'home',
  selectedMovie: null,
  favorites: [],
  movies: [],
  loading: false,
  scrollProgress: 0,
  mousePosition: { x: 0, y: 0 },
  preloaderProgress: 0,
  isPreloaderDone: false,
  user: null,
  showAuthModal: false,
  showTrailerModal: false,
  trailerMovie: null,

  setUser: (user) => set({ user }),
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

  addFavorite: async (movie) => {
    const { favorites } = get();
    if (favorites.some((f) => f.id === movie.id)) return;
    const newFav = { ...movie, favoritedAt: Date.now() };
    set({ favorites: [...favorites, newFav] });
    try {
      await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFav),
      });
    } catch (err) {
      console.error('Failed to save favorite:', err);
    }
  },

  removeFavorite: async (movieId) => {
    const { favorites } = get();
    const target = favorites.find((f) => f.id === movieId);
    set({ favorites: favorites.filter((f) => f.id !== movieId) });
    if (target?.serverId) {
      try {
        await fetch(`${API_URL}/favorites/${target.serverId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to remove favorite:', err);
      }
    }
  },

  isFavorite: (movieId) => get().favorites.some((f) => f.id === movieId),

  loadFavorites: async () => {
    try {
      const res = await fetch(`${API_URL}/favorites`);
      const data = await res.json();
      set({ favorites: data });
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  },
}));
