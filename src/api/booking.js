import { supabase } from '../lib/supabase';
import { CINEMA_FORMATS, CINEMA_VENUE, DEMO_MOVIES } from '../data/cinema';
import { normalizeMovie } from './catalog';
import { getCinemaMovie } from './cinema';

const HOLD_KEY = 'cine:demo:holds';
const BOOKING_KEY = 'cine:demo:bookings';
const RATING_KEY = 'cine:demo:ratings';
const HOLD_SECONDS = 10 * 60;
const showingCache = new Map();
const demoLocks = new Map();

const read = (key, fallback = []) => {
  if (typeof localStorage === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
};
const write = (key, value) => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value)); };

function localDate(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

export function buildDemoShowings(movies = DEMO_MOVIES, days = 7) {
  const formats = Object.entries(CINEMA_FORMATS);
  const hours = [14, 17, 20];
  const unavailable = [...activeLocalHolds(), ...read(BOOKING_KEY)];
  return Array.from({ length: days }, (_, day) => movies.slice(0, 5).flatMap((movie, movieIndex) =>
    hours.map((hour, slot) => {
      const [format, detail] = formats[(movieIndex + slot + day) % formats.length];
      const startsAt = localDate(day);
      startsAt.setHours(hour + (movieIndex % 2), slot === 1 ? 30 : 0, 0, 0);
      const id = `demo-${day}-${movie.id}-${slot}`;
      const unavailableCount = unavailable.filter((item) => item.showing_id === id).reduce((count, item) => count + (item.seat_ids?.length || 0), 0);
      return {
        id,
        movie_id: movie.databaseId || String(movie.id),
        tmdb_id: movie.id,
        movie,
        venue: CINEMA_VENUE,
        room: detail.room,
        format,
        formatLabel: detail.label,
        price: detail.price,
        starts_at: startsAt.toISOString(),
        language: slot % 2 ? 'SUB' : 'DOB',
        available_count: Math.max(0, 126 - ((movieIndex * 7 + slot * 3 + day) % 18) - unavailableCount),
      };
    })
  )).flat();
}

export async function listShowings(filters = {}) {
  if (supabase) {
    let query = supabase.from('cinema_showings').select('*, cinema_rooms(*), Pelicula(*)').eq('status', 'scheduled').order('starts_at');
    if (filters.movieId) query = query.eq('movie_id', filters.movies?.find((movie) => String(movie.id) === String(filters.movieId))?.databaseId || filters.movieId);
    if (filters.date) query = query.gte('starts_at', `${filters.date}T00:00:00`).lt('starts_at', `${filters.date}T23:59:59`);
    if (filters.format) query = query.eq('format', filters.format);
    const { data, error } = await query;
    if (!error && data?.length) {
      const normalized = await Promise.all(data.map(async (showing) => {
      const { count } = await supabase.from('cinema_showing_seats').select('*', { count: 'exact', head: true }).eq('showing_id', showing.id).eq('status', 'available');
      return {
        ...showing,
        movie: normalizeMovie(showing.Pelicula || {}),
        room: showing.cinema_rooms?.name,
        formatLabel: CINEMA_FORMATS[showing.format]?.label || showing.format,
        tmdb_id: showing.Pelicula?.tmdbId || showing.Pelicula?.tmdb_id,
        available_count: count ?? 0,
      };
      }));
      normalized.forEach((showing) => showingCache.set(String(showing.id), showing));
      return normalized;
    }
  }
  const demo = buildDemoShowings(filters.movies || DEMO_MOVIES)
    .filter((showing) => !filters.movieId || String(showing.tmdb_id) === String(filters.movieId) || String(showing.movie_id) === String(filters.movieId))
    .filter((showing) => !filters.date || showing.starts_at.startsWith(filters.date))
    .filter((showing) => !filters.format || showing.format === filters.format);
  demo.forEach((showing) => showingCache.set(String(showing.id), showing));
  return demo;
}

export async function getShowing(showingId) {
  const cached = showingCache.get(String(showingId));
  if (cached) return cached;
  const showings = await listShowings();
  const found = showings.find((showing) => String(showing.id) === String(showingId));
  if (found) return found;
  const match = String(showingId).match(/^demo-(\d+)-(\d+)-(\d+)$/);
  if (!match) return null;
  const movie = await getCinemaMovie(match[2]);
  return buildDemoShowings([movie]).find((showing) => String(showing.id) === String(showingId)) || null;
}

const seatId = (row, number) => `${row}${number}`;
const deterministicSold = (showingId, rowIndex, number) => {
  const seed = [...String(showingId)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (seed + rowIndex * 13 + number * 7) % 17 === 0;
};

function activeLocalHolds() {
  const now = Date.now();
  const holds = read(HOLD_KEY).filter((hold) => hold.status === 'held' && new Date(hold.expires_at).getTime() > now);
  write(HOLD_KEY, holds);
  return holds;
}

export function seatState(seat, holds = [], showingId, bookings = []) {
  if (seat.status === 'sold') return 'sold';
  if (seat.status === 'reserved') return 'reserved';
  const booking = bookings.find((item) => item.showing_id === showingId && item.seat_ids?.includes(seat.id));
  if (booking) return booking.operation === 'reservation' || booking.status === 'reserved_demo' ? 'reserved' : 'sold';
  return holds.some((hold) => hold.showing_id === showingId && hold.seat_ids.includes(seat.id)) ? 'held' : seat.accessible ? 'accessible' : 'available';
}

export function getSeatLocation(row, number, rowCount = 10, seatsPerRow = 14) {
  const rowIndex = Math.max(0, row.toUpperCase().charCodeAt(0) - 65);
  const depth = rowIndex < rowCount / 3 ? 'Frontal' : rowIndex >= rowCount * 2 / 3 ? 'Posterior' : 'Zona media';
  const side = number <= seatsPerRow / 3 ? 'izquierda' : number > seatsPerRow * 2 / 3 ? 'derecha' : 'centro';
  return `${depth} · ${side}`;
}

export async function getSeatMap(showingId) {
  if (supabase) {
    const { data, error } = await supabase.from('cinema_showing_seats').select('*, cinema_seats(*)').eq('showing_id', showingId).order('seat_id');
    if (!error && data?.length) return data.map((item) => ({
      id: item.cinema_seats.id,
      row: item.cinema_seats.row_label,
      number: item.cinema_seats.seat_number,
      code: `${item.cinema_seats.row_label}${item.cinema_seats.seat_number}`,
      accessible: item.cinema_seats.accessible,
      zone: item.cinema_seats.zone,
      location: getSeatLocation(item.cinema_seats.row_label, item.cinema_seats.seat_number),
      status: item.status,
      price: item.price,
    }));
  }
  const rows = 'ABCDEFGHIJ'.split('');
  const holds = activeLocalHolds();
  const bookings = read(BOOKING_KEY);
  return rows.flatMap((row, rowIndex) => Array.from({ length: 14 }, (_, index) => {
    const number = index + 1;
    const accessible = row === 'A' && [1, 2, 13, 14].includes(number);
    const sold = deterministicSold(showingId, rowIndex, number);
    const seat = { id: seatId(row, number), code: seatId(row, number), row, number, accessible, location: getSeatLocation(row, number), status: sold ? 'sold' : 'available' };
    return { ...seat, status: seatState(seat, holds, showingId, bookings) };
  }));
}

export function toggleSeatSelection(selected, seatIdValue, max = 8) {
  if (selected.includes(seatIdValue)) return selected.filter((id) => id !== seatIdValue);
  return selected.length >= max ? selected : [...selected, seatIdValue];
}

export const calculateTotal = (price, seatIds) => Number(price || 0) * seatIds.length;
export const remainingHoldSeconds = (expiresAt, now = Date.now()) => Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));

async function withDemoShowingLock(showingId, task) {
  const previous = demoLocks.get(showingId) || Promise.resolve();
  let unlock;
  const gate = new Promise((resolve) => { unlock = resolve; });
  const queued = previous.then(() => gate);
  demoLocks.set(showingId, queued);
  await previous;
  try { return await task(); } finally {
    unlock();
    if (demoLocks.get(showingId) === queued) demoLocks.delete(showingId);
  }
}

export async function holdSeats(showingId, seatIds) {
  if (!seatIds.length || seatIds.length > 8) throw new Error('Selecciona entre 1 y 8 asientos.');
  if (supabase) {
    const { data, error } = await supabase.rpc('hold_cinema_seats', { p_showing_id: showingId, p_seat_ids: seatIds });
    if (!error && data) return Array.isArray(data) ? data[0] : data;
    if (error && !String(showingId).startsWith('demo-')) throw error;
  }
  return withDemoShowingLock(showingId, async () => {
    const currentMap = await getSeatMap(showingId);
    const unavailable = currentMap.filter((seat) => seatIds.includes(seat.id) && !['available', 'accessible'].includes(seat.status));
    if (unavailable.length) throw new Error(`Los asientos ${unavailable.map((seat) => seat.id).join(', ')} ya no están disponibles.`);
    const showing = await getShowing(showingId);
    const hold = {
      id: crypto.randomUUID(), showing_id: showingId, seat_ids: seatIds, showing,
      total: calculateTotal(showing?.price, seatIds), status: 'held',
      expires_at: new Date(Date.now() + HOLD_SECONDS * 1000).toISOString(), created_at: new Date().toISOString(),
    };
    write(HOLD_KEY, [...activeLocalHolds(), hold]);
    return hold;
  });
}

export async function getHold(holdId) {
  if (supabase) {
    const { data } = await supabase.from('cinema_holds').select('*, cinema_showings(*, cinema_rooms(*), Pelicula(*)), cinema_hold_seats(*)').eq('id', holdId).maybeSingle();
    if (data) return {
      ...data,
      showing: data.cinema_showings ? {
        ...data.cinema_showings,
        movie: normalizeMovie(data.cinema_showings.Pelicula || {}),
        room: data.cinema_showings.cinema_rooms?.name,
        formatLabel: CINEMA_FORMATS[data.cinema_showings.format]?.label || data.cinema_showings.format,
      } : null,
      seat_ids: data.cinema_hold_seats?.map((item) => item.seat_id) || [],
    };
  }
  return read(HOLD_KEY).find((hold) => hold.id === holdId) || null;
}

export async function releaseHold(holdId) {
  if (supabase) {
    const { error } = await supabase.rpc('release_cinema_hold', { p_hold_id: holdId });
    if (!error) return true;
  }
  write(HOLD_KEY, read(HOLD_KEY).filter((hold) => hold.id !== holdId));
  return true;
}

export async function confirmDemoBooking(holdId, operation = 'purchase', customer = null) {
  if (supabase) {
    const { data, error } = await supabase.rpc('confirm_demo_cinema_booking', { p_hold_id: holdId, p_operation: operation });
    if (!error && data) return Array.isArray(data) ? data[0] : data;
    if (error && !read(HOLD_KEY).some((hold) => hold.id === holdId)) throw error;
  }
  const holds = read(HOLD_KEY);
  const hold = holds.find((item) => item.id === holdId);
  if (!hold || remainingHoldSeconds(hold.expires_at) === 0) throw new Error('La reserva temporal expiró.');
  const booking = { ...hold, id: crypto.randomUUID(), hold_id: hold.id, operation, customer, status: operation === 'reservation' ? 'reserved_demo' : 'confirmed_demo', reference: `CINE-${Date.now().toString(36).toUpperCase()}`, confirmed_at: new Date().toISOString() };
  write(BOOKING_KEY, [booking, ...read(BOOKING_KEY)]);
  write(HOLD_KEY, holds.filter((item) => item.id !== holdId));
  return booking;
}

export async function listMyBookings() {
  if (supabase) {
    const { data, error } = await supabase.from('cinema_bookings').select('*, cinema_showings(*, cinema_rooms(*), Pelicula(*)), cinema_booking_items(*)').order('created_at', { ascending: false });
    if (!error) return data || [];
  }
  return read(BOOKING_KEY);
}

export async function rateMovie(movieId, score, review = '') {
  if (score < 1 || score > 5) throw new Error('La valoración debe estar entre 1 y 5.');
  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from('cinema_ratings').upsert({ user_id: auth.user?.id, movie_id: movieId, score, review: review.trim() || null }, { onConflict: 'user_id,movie_id' });
    if (!error) return { score, review };
  }
  const ratings = read(RATING_KEY, {});
  ratings[movieId] = { score, review, updated_at: new Date().toISOString() };
  write(RATING_KEY, ratings);
  return ratings[movieId];
}

export function subscribeToSeatMap(showingId, callback) {
  if (!supabase || String(showingId).startsWith('demo-')) return () => {};
  const channel = supabase.channel(`showing:${showingId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cinema_showing_seats', filter: `showing_id=eq.${showingId}` }, callback)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
