begin;

do $$
declare
  unsafe_count integer;
begin
  select count(*) into unsafe_count
  from pg_policies
  where schemaname = 'public'
    and tablename in ('user_favorites', 'user_watchlist')
    and cmd in ('SELECT', 'INSERT', 'DELETE')
    and coalesce(qual, with_check, '') not like '%auth.uid()%';

  if unsafe_count > 0 then
    raise exception 'Collection policies must scope access to auth.uid()';
  end if;

  if has_table_privilege('anon', 'public.user_favorites', 'INSERT')
    or has_table_privilege('anon', 'public.user_watchlist', 'INSERT') then
    raise exception 'Anonymous users cannot write remote collections';
  end if;
end
$$;

rollback;
