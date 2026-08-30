import { beforeEach, describe, expect, it } from 'vitest';
import { calculateTotal, getSeatMap, holdSeats, listShowings, releaseHold, remainingHoldSeconds, seatState, toggleSeatSelection } from '../../src/api/booking';
import { normalizeMovie } from '../../src/api/catalog';
import { DEMO_MOVIES } from '../../src/data/cinema';

beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key), clear: () => storage.clear() };
});

describe('cinema booking helpers', () => {
  it('calculates Colombian ticket totals', () => { expect(calculateTotal(34000, ['C5', 'C6'])).toBe(68000); });
  it('limits selection to eight and toggles seats', () => { const eight = ['A1','A2','A3','A4','A5','A6','A7','A8']; expect(toggleSeatSelection(eight, 'A9')).toEqual(eight); expect(toggleSeatSelection(eight, 'A4')).not.toContain('A4'); });
  it('never returns a negative countdown', () => { expect(remainingHoldSeconds(new Date(5000).toISOString(), 2000)).toBe(3); expect(remainingHoldSeconds(new Date(1000).toISOString(), 2000)).toBe(0); });
  it('prioritizes sold and held states', () => { expect(seatState({ id: 'B2', status: 'sold' }, [], 'show')).toBe('sold'); expect(seatState({ id: 'B2', status: 'available' }, [{ showing_id: 'show', seat_ids: ['B2'] }], 'show')).toBe('held'); expect(seatState({ id: 'A1', status: 'available', accessible: true }, [], 'show')).toBe('accessible'); });
  it('allows only one concurrent hold for the same seat', async () => {
    const [showing] = await listShowings({ movies: [DEMO_MOVIES[0]] });
    const seat = (await getSeatMap(showing.id)).find((item) => ['available', 'accessible'].includes(item.status));
    const attempts = await Promise.allSettled([holdSeats(showing.id, [seat.id]), holdSeats(showing.id, [seat.id])]);
    expect(attempts.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((item) => item.status === 'rejected')).toHaveLength(1);
    const winner = attempts.find((item) => item.status === 'fulfilled');
    await releaseHold(winner.value.id);
  });
});

describe('movie normalization', () => {
  it('normalizes database rows into the UI contract', () => { const movie = normalizeMovie({ id: 'db-1', tmdbId: 42, titulo: 'Prueba', calificacion: '8.4' }); expect(movie.id).toBe(42); expect(movie.databaseId).toBe('db-1'); expect(movie.title).toBe('Prueba'); expect(movie.vote_average).toBe(8.4); });
});
