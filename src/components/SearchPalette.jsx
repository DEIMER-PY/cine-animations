import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, LoaderCircle, Search, Sparkles, UserRound, X } from 'lucide-react';
import { Catalog } from '../api/catalog';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';

export default function SearchPalette({ open, onClose }) {
  const inputRef = useRef(null);
  const requestRef = useRef(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ movies: [], people: [], genres: [] });
  const setSelectedMovie = useStore((state) => state.setSelectedMovie);
  const setSection = useStore((state) => state.setSection);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ movies: [], people: [], genres: [] });
      return undefined;
    }
    window.setTimeout(() => inputRef.current?.focus(), 80);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ movies: [], people: [], genres: [] });
      setLoading(false);
      return undefined;
    }
    const request = ++requestRef.current;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const next = await Catalog.commandSearch(query);
        if (request === requestRef.current) setResults(next);
      } finally {
        if (request === requestRef.current) setLoading(false);
      }
    }, 240);
    return () => window.clearTimeout(timer);
  }, [query]);

  const count = useMemo(() => results.movies.length + results.people.length + results.genres.length, [results]);
  const selectMovie = (movie) => {
    setSelectedMovie(movie);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[900] flex justify-center bg-black/80 px-4 pt-[10vh] backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.section role="dialog" aria-modal="true" aria-label="Buscar en el archivo cinematográfico" className="h-fit max-h-[78vh] w-full max-w-3xl overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0c0c0d]/95 shadow-[0_30px_100px_rgba(0,0,0,.75)]" initial={{ y: -24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -18, scale: 0.98 }}>
            <div className="flex items-center gap-4 border-b border-white/8 px-5 sm:px-7">
              {loading ? <LoaderCircle className="animate-spin text-cinema-accent" size={20} /> : <Search className="text-cinema-accent" size={20} />}
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} className="h-20 flex-1 bg-transparent font-display text-2xl tracking-wide text-white outline-none placeholder:text-white/20" placeholder="BUSCA PELÍCULA, PERSONA O GÉNERO" aria-label="Consulta" />
              <button onClick={onClose} className="rounded-full border border-white/10 p-2 text-white/35 hover:text-white" aria-label="Cerrar búsqueda"><X size={17} /></button>
            </div>

            <div className="max-h-[calc(78vh-5rem)] overflow-y-auto p-4 sm:p-6">
              {query.length < 2 && (
                <div className="grid min-h-56 place-items-center text-center">
                  <div><Sparkles className="mx-auto mb-4 text-cinema-gold/60" /><p className="font-mono text-[10px] tracking-[.25em] text-white/35">ESCRIBE DOS CARACTERES PARA EXPLORAR</p><p className="mt-2 text-xs text-white/20">Atajo global: /</p></div>
                </div>
              )}
              {query.length >= 2 && !loading && count === 0 && (
                <div className="grid min-h-56 place-items-center text-center"><div><p className="font-display text-3xl text-white/25">SIN RESULTADOS</p><p className="mt-2 text-xs text-white/25">Prueba otro título, artista o género.</p></div></div>
              )}

              {results.movies.length > 0 && (
                <div>
                  <p className="mb-3 font-mono text-[9px] tracking-[.25em] text-cinema-gold">PELÍCULAS · {results.movies.length}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {results.movies.map((movie) => (
                      <button key={movie.id} onClick={() => selectMovie(movie)} className="group flex items-center gap-3 rounded-xl border border-transparent p-2 text-left transition hover:border-white/10 hover:bg-white/[.04]">
                        <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/5">{movie.poster_path ? <img src={TMDB.poster(movie.poster_path, 'w185')} alt="" className="h-full w-full object-cover" /> : <Film className="m-auto mt-5 text-white/20" size={18} />}</div>
                        <div className="min-w-0"><p className="truncate text-sm text-white/75 group-hover:text-white">{movie.title}</p><p className="mt-1 font-mono text-[9px] tracking-wider text-white/25">{movie.release_date?.slice(0, 4) || 'SIN FECHA'} · ★ {movie.vote_average?.toFixed(1)}</p></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(results.people.length > 0 || results.genres.length > 0) && (
                <div className="mt-6 grid gap-6 border-t border-white/5 pt-5 sm:grid-cols-2">
                  {results.people.length > 0 && <div><p className="mb-3 font-mono text-[9px] tracking-[.25em] text-cinema-gold">PERSONAS</p>{results.people.map((person) => <div key={person.id} className="flex items-center gap-3 rounded-xl p-2"><div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white/5">{person.profilePath ? <img src={TMDB.profile(person.profilePath, 'w185')} alt="" className="h-full w-full object-cover" /> : <UserRound size={16} className="text-white/20" />}</div><div><p className="text-xs text-white/70">{person.name}</p><p className="font-mono text-[8px] tracking-widest text-white/25">{person.profession || 'CINE'}</p></div></div>)}</div>}
                  {results.genres.length > 0 && <div><p className="mb-3 font-mono text-[9px] tracking-[.25em] text-cinema-gold">GÉNEROS</p><div className="flex flex-wrap gap-2">{results.genres.map((genre) => <button key={genre.id} onClick={() => { setSection('catalog'); onClose(); }} className="rounded-full border border-white/10 px-3 py-2 font-mono text-[9px] tracking-wider text-white/45 transition hover:border-cinema-accent/40 hover:text-white">{genre.name}</button>)}</div></div>}
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
