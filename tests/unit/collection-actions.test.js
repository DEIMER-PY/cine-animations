import { beforeEach, expect, it, vi } from 'vitest';

const { resolveId, upsert } = vi.hoisted(() => ({ resolveId: vi.fn(), upsert: vi.fn() }));
vi.mock('../../src/lib/supabase', () => ({ isSupabaseConfigured: true, supabase: { from: () => ({ upsert }) } }));
vi.mock('../../src/api/catalog', () => ({ Catalog: { resolveDatabaseId: resolveId }, normalizeMovie: (item) => item }));
import { useStore } from '../../src/store/useStore';

beforeEach(() => {
  resolveId.mockReset(); upsert.mockReset();
  useStore.setState({ user: { id: 'owner' }, favorites: [], watchlist: [], collectionError: '' });
});

it('rolls back an optimistic favorite when the database ID is missing', async () => {
  resolveId.mockResolvedValue(null);
  await expect(useStore.getState().addFavorite({ id: 1 })).resolves.toBe(false);
  expect(useStore.getState().favorites).toEqual([]);
  expect(useStore.getState().collectionError).toContain('No se pudo guardar el cambio');
  expect(upsert).not.toHaveBeenCalled();
});

it('failed save preserves another favorite added while the request was pending', async () => {
  let release;
  resolveId.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
  const pending = useStore.getState().addFavorite({ id: 1 });
  useStore.setState({ favorites: [{ id: 1 }, { id: 2 }] });
  release(null);
  await pending;
  expect(useStore.getState().favorites).toEqual([{ id: 2 }]);
});

it('failed removal restores the target without erasing unrelated changes', async () => {
  useStore.setState({ favorites: [{ id: 1 }, { id: 2 }] });
  resolveId.mockRejectedValue(new Error('Sin conexión'));
  await expect(useStore.getState().removeFavorite(1)).resolves.toBe(false);
  expect(useStore.getState().favorites.map((item) => item.id).sort()).toEqual([1, 2]);
  expect(useStore.getState().collectionError).toContain('Revisa tu conexión');
});
