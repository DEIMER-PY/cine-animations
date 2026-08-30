const TMDB_BASE = 'https://api.themoviedb.org/3';
const ALLOWED_PATHS = [
  /^\/trending\/movie\/(day|week)$/,
  /^\/trending\/person\/(day|week)$/,
  /^\/movie\/(popular|top_rated|now_playing|upcoming)$/,
  /^\/movie\/\d+$/,
  /^\/search\/movie$/,
  /^\/search\/person$/,
  /^\/genre\/movie\/list$/,
  /^\/person\/\d+$/,
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'GET') return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: corsHeaders });

  const token = Deno.env.get('TMDB_TOKEN');
  if (!token) return Response.json({ error: 'TMDB_NOT_CONFIGURED' }, { status: 503, headers: corsHeaders });

  const incoming = new URL(request.url);
  const path = incoming.searchParams.get('path') || '';
  if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) return Response.json({ error: 'PATH_NOT_ALLOWED' }, { status: 400, headers: corsHeaders });

  const target = new URL(`${TMDB_BASE}${path}`);
  for (const [key, value] of incoming.searchParams.entries()) if (key !== 'path') target.searchParams.set(key, value);
  if (/^\/movie\/\d+$/.test(path)) target.searchParams.set('append_to_response', 'credits,videos,similar');
  if (/^\/person\/\d+$/.test(path)) target.searchParams.set('append_to_response', 'combined_credits,external_ids');

  const response = await fetch(target, { headers: { Authorization: `Bearer ${token}`, accept: 'application/json' } });
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8', 'cache-control': response.ok ? 'public, max-age=300, s-maxage=1800' : 'no-store' },
  });
});
