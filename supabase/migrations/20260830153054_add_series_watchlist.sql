create table if not exists public.series_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id bigint not null check (tmdb_id > 0),
  snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

comment on table public.series_watchlist is 'Series de TMDB guardadas por cada usuario; el snapshot permite renderizar la lista sin duplicar el catálogo remoto.';

alter table public.series_watchlist enable row level security;

revoke all on table public.series_watchlist from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.series_watchlist to authenticated;

create policy "series_watchlist_select_own"
on public.series_watchlist for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "series_watchlist_insert_own"
on public.series_watchlist for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "series_watchlist_update_own"
on public.series_watchlist for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "series_watchlist_delete_own"
on public.series_watchlist for delete
to authenticated
using ((select auth.uid()) = user_id);
