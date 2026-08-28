import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, ChevronDown, Heart, LoaderCircle, Search, SlidersHorizontal } from 'lucide-react';
import { Catalog } from '../api/catalog';
import { TMDB } from '../api/tmdb';
import { useGenres } from '../hooks/useMovies';
import { useStore } from '../store/useStore';

const sorts = {
  popularity: ['POPULARIDAD', (a, b) => b.popularity - a.popularity],
  rating: ['CALIFICACIÓN', (a, b) => b.vote_average - a.vote_average],
  newest: ['MÁS RECIENTES', (a, b) => String(b.release_date).localeCompare(String(a.release_date))],
  title: ['TÍTULO A—Z', (a, b) => a.title.localeCompare(b.title)],
};

function CatalogCard({ movie, index }) {
  const setSelectedMovie = useStore((state) => state.setSelectedMovie);
  const { isFavorite, addFavorite, removeFavorite, isInWatchlist, addToWatchlist, removeFromWatchlist } = useStore();
  const favorite = isFavorite(movie.id);
  const queued = isInWatchlist(movie.id);

  return (
    <motion.article layout initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ delay: Math.min(index * 0.035, 0.3) }} className="group relative">
      <button onClick={() => setSelectedMovie(movie)} className="block w-full text-left">
        <motion.div initial={{ clipPath: 'inset(0 0 100% 0)', scale: 1.06 }} whileInView={{ clipPath: 'inset(0 0 0% 0)', scale: 1 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="relative aspect-[.705] overflow-hidden rounded-2xl border border-white/8 bg-[#121212]" style={{ willChange: 'transform, clip-path' }}>
          {movie.poster_path ? <img src={TMDB.poster(movie.poster_path, 'w500')} alt={`Póster de ${movie.title}`} loading="lazy" className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.07] group-hover:saturate-125" /> : <div className="grid h-full place-items-center font-display text-6xl text-white/5">CINE</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent opacity-70 transition group-hover:opacity-95" />
          <div className="absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="line-clamp-3 text-xs leading-relaxed text-white/55">{movie.overview || 'Una historia esperando ser descubierta.'}</p>
          </div>
          <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[9px] tracking-wider text-white/70 backdrop-blur">★ {movie.vote_average?.toFixed(1)}</span>
        </motion.div>
        <div className="px-1 pt-3"><h3 className="truncate font-display text-xl tracking-wide text-white/85 transition group-hover:text-white">{movie.title}</h3><div className="mt-1 flex items-center justify-between font-mono text-[9px] tracking-[.15em] text-white/28"><span>{movie.release_date?.slice(0, 4) || 'ARCHIVE'}</span><span>{movie.genres?.[0]?.name || 'CINEMA'}</span></div></div>
      </button>
      <div className="absolute right-3 top-3 flex translate-y-2 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
        <button onClick={() => favorite ? removeFavorite(movie.id) : addFavorite(movie)} className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md ${favorite ? 'border-cinema-accent/50 bg-cinema-accent text-white' : 'border-white/15 bg-black/65 text-white/70 hover:text-white'}`} aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}><Heart size={15} className={favorite ? 'fill-current' : ''} /></button>
        <button onClick={() => queued ? removeFromWatchlist(movie.id) : addToWatchlist(movie)} className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md ${queued ? 'border-cinema-gold/50 bg-cinema-gold text-black' : 'border-white/15 bg-black/65 text-white/70 hover:text-white'}`} aria-label={queued ? 'Quitar de ver después' : 'Añadir a ver después'}><Bookmark size={15} className={queued ? 'fill-current' : ''} /></button>
      </div>
    </motion.article>
  );
}

export default function CatalogSection() {
  const { genres } = useGenres();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [year, setYear] = useState('all');
  const [rating, setRating] = useState('0');
  const [sort, setSort] = useState('popularity');
  const [visible, setVisible] = useState(12);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setMovies(await Catalog.browse(100));
    } catch (loadError) {
      setError(loadError?.message || 'No pudimos abrir el archivo cinematográfico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setVisible(12); }, [query, genre, year, rating, sort]);

  const years = useMemo(() => [...new Set(movies.map((movie) => movie.release_date?.slice(0, 4)).filter(Boolean))].sort((a, b) => b - a), [movies]);
  const filtered = useMemo(() => movies
    .filter((movie) => !query || `${movie.title} ${movie.overview}`.toLowerCase().includes(query.toLowerCase()))
    .filter((movie) => genre === 'all' || movie.genre_ids.some((id) => String(id) === genre))
    .filter((movie) => year === 'all' || movie.release_date?.startsWith(year))
    .filter((movie) => movie.vote_average >= Number(rating))
    .sort(sorts[sort][1]), [movies, query, genre, year, rating, sort]);

  return (
    <section className="relative min-h-screen overflow-hidden pb-32 pt-28" aria-labelledby="catalog-title">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_75%_10%,rgba(196,18,48,.16),transparent_38%),radial-gradient(circle_at_20%_20%,rgba(201,168,76,.08),transparent_32%)]" />
      <div className="relative mx-auto max-w-[1600px] px-4 md:px-8 lg:px-16">
        <div className="mb-12 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="font-mono text-[10px] tracking-[.35em] text-cinema-accent">CURATED DATABASE · {movies.length || '—'} TITLES</p><h1 id="catalog-title" className="mt-4 font-display text-[clamp(4rem,10vw,9rem)] leading-[.75] tracking-[-.01em] text-white">THE<br /><span className="text-outline">ARCHIVE</span></h1></div>
          <p className="max-w-md border-l border-cinema-gold/30 pl-5 text-sm leading-relaxed text-white/35">No es una cuadrícula infinita: es una mesa de montaje. Busca, filtra y construye tu propia secuencia.</p>
        </div>

        <div className="sticky top-16 z-30 mb-10 rounded-2xl border border-white/10 bg-[#0a0a0a]/85 p-3 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(120px,.7fr))]">
            <label className="relative"><span className="sr-only">Buscar películas</span><Search className="absolute left-3.5 top-3.5 text-white/25" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en el archivo…" className="h-11 w-full rounded-xl border border-white/8 bg-white/[.035] pl-10 pr-3 text-xs text-white outline-none focus:border-cinema-accent/40" /></label>
            <Select icon={SlidersHorizontal} label="Género" value={genre} onChange={setGenre} options={[['all', 'TODOS'], ...genres.map((item) => [String(item.id), item.name.toUpperCase()])]} />
            <Select label="Año" value={year} onChange={setYear} options={[['all', 'CUALQUIER AÑO'], ...years.map((item) => [item, item])]} />
            <Select label="Rating" value={rating} onChange={setRating} options={[['0', 'CUALQUIER RATING'], ['6', '6+'], ['7', '7+'], ['8', '8+']]} />
            <Select label="Orden" value={sort} onChange={setSort} options={Object.entries(sorts).map(([key, value]) => [key, value[0]])} />
          </div>
        </div>

        {loading && <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{Array.from({ length: 12 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-[.705] rounded-2xl bg-white/[.045]" /><div className="mt-3 h-5 w-3/4 rounded bg-white/[.045]" /></div>)}</div>}
        {error && <div className="grid min-h-72 place-items-center rounded-3xl border border-red-500/15 bg-red-500/[.035] text-center"><div><p className="font-display text-3xl text-white/50">ARCHIVE INTERRUPTED</p><p className="mt-2 text-xs text-white/30">{error}</p><button onClick={load} className="mt-5 rounded-full border border-cinema-accent/40 px-5 py-2 font-mono text-[10px] tracking-widest text-cinema-accent">REINTENTAR</button></div></div>}
        {!loading && !error && filtered.length === 0 && <div className="grid min-h-72 place-items-center text-center"><div><p className="font-display text-4xl text-white/20">NO MATCHING FRAMES</p><button onClick={() => { setQuery(''); setGenre('all'); setYear('all'); setRating('0'); }} className="mt-4 font-mono text-[10px] tracking-widest text-cinema-gold">LIMPIAR FILTROS</button></div></div>}
        {!loading && !error && filtered.length > 0 && <><motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"><AnimatePresence>{filtered.slice(0, visible).map((movie, index) => <CatalogCard key={movie.id} movie={movie} index={index} />)}</AnimatePresence></motion.div>{visible < filtered.length && <div className="mt-16 flex justify-center"><button onClick={() => setVisible((amount) => amount + 12)} className="group flex items-center gap-3 rounded-full border border-white/10 px-7 py-3 font-mono text-[10px] tracking-[.22em] text-white/45 transition hover:border-cinema-gold/40 hover:text-white"><LoaderCircle size={14} className="transition group-hover:rotate-180" /> CARGAR OTRO ROLLO · {filtered.length - visible}</button></div>}</>}
      </div>
    </section>
  );
}

function Select({ icon: Icon, label, value, onChange, options }) {
  return <label className="relative"><span className="sr-only">{label}</span>{Icon && <Icon className="pointer-events-none absolute left-3 top-3.5 text-white/25" size={15} />}<select value={value} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full appearance-none rounded-xl border border-white/8 bg-[#101011] pr-8 text-[10px] tracking-wider text-white/55 outline-none focus:border-cinema-accent/40 ${Icon ? 'pl-9' : 'pl-3'}`}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-white/25" size={15} /></label>;
}
