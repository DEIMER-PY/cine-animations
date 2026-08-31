import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table) => {
      const query = {
        select() { return this; }, eq() { return this; }, order() { return this; }, in() { return this; },
        then(resolve) { return Promise.resolve(table === 'series_watchlist' ? { data: null, error: new Error('table unavailable') } : { data: table === 'Pelicula' ? [{ id: 'db-1', tmdbId: 11, titulo: 'Película guardada' }] : [{ movie_id: 'db-1' }], error: null }).then(resolve); },
      };
      return query;
    },
  },
}));

import { useStore } from '../../src/store/useStore';

beforeEach(() => {
  const data = new Map();
  vi.stubGlobal('localStorage', { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) });
  useStore.setState({ user: { id: 'owner' }, favorites: [], watchlist: [], seriesWatchlist: [], collectionError: '' });
});

it('preserves movie collections and guest series when series storage is unavailable', async () => {
  localStorage.setItem('cine:guest:series-watchlist', JSON.stringify([{ id: 22, title: 'Serie pendiente' }]));
  await expect(useStore.getState().loadCollections('owner')).resolves.toBeUndefined();
  expect(useStore.getState().favorites[0].title).toBe('Película guardada');
  expect(useStore.getState().watchlist).toHaveLength(1);
  expect(useStore.getState().seriesWatchlist[0].id).toBe(22);
  expect(useStore.getState().collectionError).toContain('no pudo sincronizarse');
  expect(useStore.getState().collectionLoading).toBe(false);
  expect(localStorage.getItem('cine:guest:series-watchlist')).toContain('Serie pendiente');
});
