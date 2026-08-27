create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 2 and 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id text not null references public."Pelicula"(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create table if not exists public.user_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id text not null references public."Pelicula"(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create index if not exists user_favorites_movie_id_idx on public.user_favorites(movie_id);
create index if not exists user_watchlist_movie_id_idx on public.user_watchlist(movie_id);

alter table public.profiles enable row level security;
alter table public.user_favorites enable row level security;
alter table public.user_watchlist enable row level security;
alter table public."Pelicula" enable row level security;
alter table public."Genero" enable row level security;
alter table public."GeneroPelicula" enable row level security;
alter table public."Persona" enable row level security;
alter table public."Credito" enable row level security;
alter table public."ImagenPelicula" enable row level security;
alter table public."VideoPelicula" enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "user_favorites_select_own" on public.user_favorites;
create policy "user_favorites_select_own" on public.user_favorites for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_favorites_insert_own" on public.user_favorites;
create policy "user_favorites_insert_own" on public.user_favorites for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_favorites_delete_own" on public.user_favorites;
create policy "user_favorites_delete_own" on public.user_favorites for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "user_watchlist_select_own" on public.user_watchlist;
create policy "user_watchlist_select_own" on public.user_watchlist for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_watchlist_insert_own" on public.user_watchlist;
create policy "user_watchlist_insert_own" on public.user_watchlist for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_watchlist_delete_own" on public.user_watchlist;
create policy "user_watchlist_delete_own" on public.user_watchlist for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "pelicula_public_read" on public."Pelicula";
create policy "pelicula_public_read" on public."Pelicula" for select to anon, authenticated using (coalesce(estado, 'publicada') = 'publicada');
drop policy if exists "genero_public_read" on public."Genero";
create policy "genero_public_read" on public."Genero" for select to anon, authenticated using (true);
drop policy if exists "genero_pelicula_public_read" on public."GeneroPelicula";
create policy "genero_pelicula_public_read" on public."GeneroPelicula" for select to anon, authenticated using (exists (select 1 from public."Pelicula" p where p.id = "peliculaId" and coalesce(p.estado, 'publicada') = 'publicada'));
drop policy if exists "persona_public_read" on public."Persona";
create policy "persona_public_read" on public."Persona" for select to anon, authenticated using (true);
drop policy if exists "credito_public_read" on public."Credito";
create policy "credito_public_read" on public."Credito" for select to anon, authenticated using (exists (select 1 from public."Pelicula" p where p.id = "peliculaId" and coalesce(p.estado, 'publicada') = 'publicada'));
drop policy if exists "imagen_pelicula_public_read" on public."ImagenPelicula";
create policy "imagen_pelicula_public_read" on public."ImagenPelicula" for select to anon, authenticated using (exists (select 1 from public."Pelicula" p where p.id = "peliculaId" and coalesce(p.estado, 'publicada') = 'publicada'));
drop policy if exists "video_pelicula_public_read" on public."VideoPelicula";
create policy "video_pelicula_public_read" on public."VideoPelicula" for select to anon, authenticated using (exists (select 1 from public."Pelicula" p where p.id = "peliculaId" and coalesce(p.estado, 'publicada') = 'publicada'));

create or replace function private.handle_new_cine_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_cine_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure private.handle_new_cine_user();

grant usage on schema public to anon, authenticated;
grant select on public."Pelicula", public."Genero", public."GeneroPelicula", public."Persona", public."Credito", public."ImagenPelicula", public."VideoPelicula" to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.user_favorites, public.user_watchlist to authenticated;
revoke all on public.profiles, public.user_favorites, public.user_watchlist from anon;
