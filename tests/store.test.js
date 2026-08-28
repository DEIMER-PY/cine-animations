import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../src/store/useStore';

const movie = { id: 99, tmdbId: 99, title: 'Test Film', poster_path: '/test.jpg' };

describe('guest collections', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ user: null, session: null, favorites: [], watchlist: [] });
  });

  it('persists favorites and watchlist locally for guests', async () => {
    await useStore.getState().addFavorite(movie);
    await useStore.getState().addToWatchlist(movie);

    expect(useStore.getState().isFavorite(99)).toBe(true);
    expect(useStore.getState().isInWatchlist(99)).toBe(true);
    expect(JSON.parse(localStorage.getItem('cine:guest:favorites'))).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('cine:guest:watchlist'))).toHaveLength(1);
  });

  it('removes guest selections without leaving stale storage', async () => {
    await useStore.getState().addFavorite(movie);
    await useStore.getState().removeFavorite(99);
    expect(useStore.getState().favorites).toEqual([]);
    expect(JSON.parse(localStorage.getItem('cine:guest:favorites'))).toEqual([]);
  });
});
