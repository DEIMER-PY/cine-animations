create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table if not exists public.cinema_venues (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  address text not null,
  timezone text not null default 'America/Bogota',
  created_at timestamptz not null default now()
);

create table if not exists public.cinema_rooms (
  id uuid primary key default extensions.gen_random_uuid(),
  venue_id uuid not null references public.cinema_venues(id) on delete cascade,
  name text not null,
  format text not null check (format in ('CLASSIC', 'DOLBY', 'IMAX')),
  base_price integer not null check (base_price >= 0),
  rows_count integer not null check (rows_count between 1 and 26),
  seats_per_row integer not null check (seats_per_row between 1 and 40),
  unique (venue_id, name)
);

create table if not exists public.cinema_seats (
  id uuid primary key default extensions.gen_random_uuid(),
  room_id uuid not null references public.cinema_rooms(id) on delete cascade,
  row_label text not null check (char_length(row_label) = 1),
  seat_number integer not null check (seat_number > 0),
  accessible boolean not null default false,
  zone text not null default 'standard' check (zone in ('standard', 'preferred', 'accessible')),
  unique (room_id, row_label, seat_number)
);

create table if not exists public.cinema_showings (
  id uuid primary key default extensions.gen_random_uuid(),
  movie_id text not null references public."Pelicula"(id) on delete cascade,
  room_id uuid not null references public.cinema_rooms(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz,
  format text not null check (format in ('CLASSIC', 'DOLBY', 'IMAX')),
  language text not null default 'DOB' check (language in ('DOB', 'SUB')),
  price integer not null check (price >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'finished')),
  created_at timestamptz not null default now(),
  unique (room_id, starts_at)
);

create table if not exists public.cinema_holds (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  showing_id uuid not null references public.cinema_showings(id) on delete cascade,
  status text not null default 'held' check (status in ('held', 'released', 'expired', 'confirmed')),
  total integer not null default 0 check (total >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cinema_showing_seats (
  showing_id uuid not null references public.cinema_showings(id) on delete cascade,
  seat_id uuid not null references public.cinema_seats(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'held', 'reserved', 'sold')),
  hold_id uuid references public.cinema_holds(id) on delete set null,
  price integer not null check (price >= 0),
  updated_at timestamptz not null default now(),
  primary key (showing_id, seat_id)
);

create table if not exists public.cinema_hold_seats (
  hold_id uuid not null references public.cinema_holds(id) on delete cascade,
  showing_id uuid not null,
  seat_id uuid not null,
  unit_price integer not null check (unit_price >= 0),
  primary key (hold_id, seat_id),
  foreign key (showing_id, seat_id) references public.cinema_showing_seats(showing_id, seat_id) on delete cascade
);

create table if not exists public.cinema_bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  showing_id uuid not null references public.cinema_showings(id) on delete restrict,
  hold_id uuid unique references public.cinema_holds(id) on delete set null,
  reference text not null unique,
  total integer not null check (total >= 0),
  status text not null default 'confirmed_demo' check (status in ('reserved_demo', 'confirmed_demo', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.cinema_booking_items (
  booking_id uuid not null references public.cinema_bookings(id) on delete cascade,
  seat_id uuid not null references public.cinema_seats(id) on delete restrict,
  unit_price integer not null check (unit_price >= 0),
  primary key (booking_id, seat_id)
);

create table if not exists public.cinema_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id text not null references public."Pelicula"(id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  review text check (char_length(review) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

alter table public.cinema_ratings add column if not exists review text check (char_length(review) <= 1200);

create index if not exists cinema_showings_movie_start_idx on public.cinema_showings(movie_id, starts_at);
create index if not exists cinema_showing_seats_status_idx on public.cinema_showing_seats(showing_id, status);
create index if not exists cinema_holds_user_idx on public.cinema_holds(user_id, created_at desc);
create index if not exists cinema_bookings_user_idx on public.cinema_bookings(user_id, created_at desc);

create or replace function private.populate_cinema_showing_seats()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.cinema_showing_seats (showing_id, seat_id, price)
  select new.id, seat.id, new.price
  from public.cinema_seats seat
  where seat.room_id = new.room_id
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists populate_cinema_showing_seats on public.cinema_showings;
create trigger populate_cinema_showing_seats after insert on public.cinema_showings
for each row execute function private.populate_cinema_showing_seats();

create or replace function private.hold_cinema_seats(p_showing_id uuid, p_seat_ids text[])
returns table (id uuid, showing_id uuid, seat_ids text[], total integer, status text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hold public.cinema_holds;
  v_requested integer := coalesce(array_length(p_seat_ids, 1), 0);
  v_available integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_requested < 1 or v_requested > 8 then raise exception 'INVALID_SEAT_COUNT'; end if;

  update public.cinema_showing_seats ss
  set status = 'available', hold_id = null, updated_at = now()
  from public.cinema_holds h
  where ss.hold_id = h.id and ss.showing_id = p_showing_id
    and h.status = 'held' and h.expires_at <= now();
  update public.cinema_holds set status = 'expired'
  where showing_id = p_showing_id and status = 'held' and expires_at <= now();

  perform 1 from public.cinema_showing_seats
  where showing_id = p_showing_id and seat_id = any(p_seat_ids::uuid[])
  for update;
  select count(*) into v_available from public.cinema_showing_seats
  where showing_id = p_showing_id and seat_id = any(p_seat_ids::uuid[]) and status = 'available';
  if v_available <> v_requested then raise exception 'SEATS_UNAVAILABLE'; end if;

  insert into public.cinema_holds (user_id, showing_id, total, expires_at)
  select v_user, p_showing_id, sum(price), now() + interval '10 minutes'
  from public.cinema_showing_seats
  where showing_id = p_showing_id and seat_id = any(p_seat_ids::uuid[])
  returning * into v_hold;

  update public.cinema_showing_seats set status = 'held', hold_id = v_hold.id, updated_at = now()
  where showing_id = p_showing_id and seat_id = any(p_seat_ids::uuid[]);
  insert into public.cinema_hold_seats (hold_id, showing_id, seat_id, unit_price)
  select v_hold.id, showing_id, seat_id, price from public.cinema_showing_seats
  where showing_id = p_showing_id and seat_id = any(p_seat_ids::uuid[]);

  return query select v_hold.id, v_hold.showing_id, p_seat_ids, v_hold.total, v_hold.status, v_hold.expires_at;
end;
$$;

create or replace function private.release_cinema_hold(p_hold_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.cinema_holds where id = p_hold_id and user_id = v_user and status = 'held') then return false; end if;
  update public.cinema_showing_seats set status = 'available', hold_id = null, updated_at = now() where hold_id = p_hold_id and status = 'held';
  update public.cinema_holds set status = 'released' where id = p_hold_id;
  return true;
end;
$$;

create or replace function private.confirm_demo_cinema_booking(p_hold_id uuid, p_operation text default 'purchase')
returns table (id uuid, reference text, showing_id uuid, total integer, status text)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hold public.cinema_holds;
  v_booking public.cinema_bookings;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_operation not in ('reservation', 'purchase') then raise exception 'INVALID_OPERATION'; end if;
  select * into v_hold from public.cinema_holds where cinema_holds.id = p_hold_id for update;
  if v_hold.user_id <> v_user or v_hold.status <> 'held' or v_hold.expires_at <= now() then raise exception 'HOLD_INVALID_OR_EXPIRED'; end if;
  insert into public.cinema_bookings (user_id, showing_id, hold_id, reference, total, status)
  values (v_user, v_hold.showing_id, v_hold.id, 'CINE-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 9)), v_hold.total, case when p_operation = 'reservation' then 'reserved_demo' else 'confirmed_demo' end)
  returning * into v_booking;
  insert into public.cinema_booking_items (booking_id, seat_id, unit_price)
  select v_booking.id, seat_id, unit_price from public.cinema_hold_seats where hold_id = p_hold_id;
  update public.cinema_showing_seats set status = case when p_operation = 'reservation' then 'reserved' else 'sold' end, hold_id = null, updated_at = now() where hold_id = p_hold_id;
  update public.cinema_holds set status = 'confirmed' where cinema_holds.id = p_hold_id;
  return query select v_booking.id, v_booking.reference, v_booking.showing_id, v_booking.total, v_booking.status;
end;
$$;

create or replace function public.hold_cinema_seats(p_showing_id uuid, p_seat_ids text[])
returns table (id uuid, showing_id uuid, seat_ids text[], total integer, status text, expires_at timestamptz)
language sql security invoker set search_path = '' as $$
  select * from private.hold_cinema_seats(p_showing_id, p_seat_ids)
$$;

create or replace function public.release_cinema_hold(p_hold_id uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select private.release_cinema_hold(p_hold_id)
$$;

create or replace function public.confirm_demo_cinema_booking(p_hold_id uuid, p_operation text default 'purchase')
returns table (id uuid, reference text, showing_id uuid, total integer, status text)
language sql security invoker set search_path = '' as $$
  select * from private.confirm_demo_cinema_booking(p_hold_id, p_operation)
$$;

revoke all on function private.hold_cinema_seats(uuid, text[]) from public, anon, authenticated;
revoke all on function private.release_cinema_hold(uuid) from public, anon, authenticated;
revoke all on function private.confirm_demo_cinema_booking(uuid, text) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.hold_cinema_seats(uuid, text[]) to authenticated;
grant execute on function private.release_cinema_hold(uuid) to authenticated;
grant execute on function private.confirm_demo_cinema_booking(uuid, text) to authenticated;
revoke all on function public.hold_cinema_seats(uuid, text[]) from public, anon;
revoke all on function public.release_cinema_hold(uuid) from public, anon;
revoke all on function public.confirm_demo_cinema_booking(uuid, text) from public, anon;
grant execute on function public.hold_cinema_seats(uuid, text[]) to authenticated;
grant execute on function public.release_cinema_hold(uuid) to authenticated;
grant execute on function public.confirm_demo_cinema_booking(uuid, text) to authenticated;

alter table public.cinema_venues enable row level security;
alter table public.cinema_rooms enable row level security;
alter table public.cinema_seats enable row level security;
alter table public.cinema_showings enable row level security;
alter table public.cinema_showing_seats enable row level security;
alter table public.cinema_holds enable row level security;
alter table public.cinema_hold_seats enable row level security;
alter table public.cinema_bookings enable row level security;
alter table public.cinema_booking_items enable row level security;
alter table public.cinema_ratings enable row level security;

create policy "cinema venues public read" on public.cinema_venues for select to anon, authenticated using (true);
create policy "cinema rooms public read" on public.cinema_rooms for select to anon, authenticated using (true);
create policy "cinema seats public read" on public.cinema_seats for select to anon, authenticated using (true);
create policy "cinema showings public read" on public.cinema_showings for select to anon, authenticated using (status = 'scheduled');
create policy "cinema showing seats public read" on public.cinema_showing_seats for select to anon, authenticated using (true);
create policy "users read own cinema holds" on public.cinema_holds for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own cinema hold seats" on public.cinema_hold_seats for select to authenticated using (exists (select 1 from public.cinema_holds h where h.id = hold_id and h.user_id = (select auth.uid())));
create policy "users read own cinema bookings" on public.cinema_bookings for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own cinema booking items" on public.cinema_booking_items for select to authenticated using (exists (select 1 from public.cinema_bookings b where b.id = booking_id and b.user_id = (select auth.uid())));
create policy "users manage own cinema ratings" on public.cinema_ratings for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select on public.cinema_venues, public.cinema_rooms, public.cinema_seats, public.cinema_showings, public.cinema_showing_seats to anon, authenticated;
grant select on public.cinema_holds, public.cinema_hold_seats, public.cinema_bookings, public.cinema_booking_items to authenticated;
grant select, insert, update on public.cinema_ratings to authenticated;
revoke insert, update, delete on public.cinema_showing_seats, public.cinema_holds, public.cinema_hold_seats, public.cinema_bookings, public.cinema_booking_items from anon, authenticated;

insert into public.cinema_venues (id, name, address, timezone) values
('10000000-0000-4000-8000-000000000001', 'CINE ANIMATIONS Bogotá', 'Distrito Creativo · Bogotá, Colombia', 'America/Bogota')
on conflict (id) do update set name = excluded.name, address = excluded.address;
insert into public.cinema_rooms (id, venue_id, name, format, base_price, rows_count, seats_per_row) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Sala Lumière','CLASSIC',24000,8,12),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Sala Kubrick','DOLBY',34000,10,14),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Gran Sala Vértigo','IMAX',42000,12,16)
on conflict (id) do nothing;

insert into public.cinema_seats (room_id, row_label, seat_number, accessible, zone)
select room.id, chr(64 + row_number)::text, seat_number,
  row_number = 1 and seat_number in (1, 2, room.seats_per_row - 1, room.seats_per_row),
  case when row_number = 1 and seat_number in (1, 2, room.seats_per_row - 1, room.seats_per_row) then 'accessible' when row_number between greatest(2, room.rows_count / 2) and room.rows_count - 1 then 'preferred' else 'standard' end
from public.cinema_rooms room
cross join lateral generate_series(1, room.rows_count) as rows(row_number)
cross join lateral generate_series(1, room.seats_per_row) as seats(seat_number)
on conflict (room_id, row_label, seat_number) do nothing;

with ranked_movies as (
  select id, row_number() over (order by coalesce("tendencia", 0) desc, coalesce("popularidad", 0) desc) as rn
  from public."Pelicula" where coalesce(estado, 'publicada') = 'publicada' limit 5
), schedule as (
  select movie.id as movie_id, movie.rn, day_offset, slot, show_hour,
    case ((movie.rn + slot + day_offset) % 3) when 0 then 'CLASSIC' when 1 then 'DOLBY' else 'IMAX' end as format
  from ranked_movies movie cross join generate_series(0, 6) day_offset
  cross join (values (0,14),(1,17),(2,20)) as slots(slot, show_hour)
)
insert into public.cinema_showings (movie_id, room_id, starts_at, format, language, price)
select schedule.movie_id,
  case schedule.format when 'CLASSIC' then '20000000-0000-4000-8000-000000000001'::uuid when 'DOLBY' then '20000000-0000-4000-8000-000000000002'::uuid else '20000000-0000-4000-8000-000000000003'::uuid end,
  ((date_trunc('day', now() at time zone 'America/Bogota') + day_offset * interval '1 day' + show_hour * interval '1 hour') at time zone 'America/Bogota'),
  schedule.format, case when slot % 2 = 0 then 'DOB' else 'SUB' end,
  case schedule.format when 'CLASSIC' then 24000 when 'DOLBY' then 34000 else 42000 end
from schedule
on conflict (room_id, starts_at) do nothing;

do $$ begin
  alter publication supabase_realtime add table public.cinema_showing_seats;
exception when duplicate_object then null;
end $$;
