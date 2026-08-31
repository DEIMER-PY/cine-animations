import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, Pause, Play, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TMDB } from '../api/tmdb';
import { Catalog } from '../api/catalog';
import { useStore } from '../store/useStore';
import { canPlayPreview, createPlaybackClock } from '../utils/trailers';
import ShowtimePill from './ShowtimePill';
import YouTubePlayer from './YouTubePlayer';

export default function RotatingHero({ movies, showings, onTrailer, heroRef }) {
  const root = useRef(null);
  const selection = useMemo(() => movies.slice(0, 5), [movies]);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [paused, setPaused] = useState(false);
  const [requested, setRequested] = useState(false);
  const [restricted, setRestricted] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidateMovieId, setCandidateMovieId] = useState(null);
  const [candidate, setCandidate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [playbackState, setPlaybackState] = useState(-1);
  const [attempt, setAttempt] = useState(0);
  const modalOpen = useStore((state) => state.showTrailerModal);
  const movie = selection[active % (selection.length || 1)];
  const clock = useRef(createPlaybackClock());
  const enabled = canPlayPreview({ visible, hidden, modalOpen, paused }) && !blocked && (!restricted || requested);
  const video = candidateMovieId === movie?.id ? candidates[candidate] : undefined;
  const move = useCallback((direction) => {
    setActive((value) => (value + direction + selection.length) % Math.max(1, selection.length));
    setRequested(false); setBlocked(false); setPlaybackState(-1);
    clock.current.reset();
  }, [selection.length]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 768px)');
    const update = () => setRestricted(query.matches || Boolean(navigator.connection?.saveData));
    update(); query.addEventListener('change', update);
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio > .5), { threshold: [0, .5, .51, 1] });
    const panel = root.current?.querySelector('.hero-preview');
    if (panel) observer.observe(panel);
    return () => { observer.disconnect(); query.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    if (!movie) return undefined;
    let stale = false;
    setCandidates([]); setCandidate(0); setLoading(true); setMessage(''); setPlaybackState(-1);
    clock.current.reset();
    (movie.demo ? Promise.resolve([]) : Catalog.getTrailerCandidates('movie', movie.id, movie.original_language)).then((rows) => {
      if (!stale) { setCandidates(rows); setCandidateMovieId(movie.id); if (!rows.length) setMessage('Este título todavía no tiene trailer disponible.'); }
    }).catch(() => { if (!stale) setMessage('El trailer no está disponible en este momento.'); }).finally(() => { if (!stale) setLoading(false); });
    const context = gsap.context(() => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo('.hero-copy > *', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .045, duration: .55, overwrite: true });
    }, root);
    return () => { stale = true; context.revert(); };
  }, [movie]);

  useEffect(() => {
    const playbackClock = clock.current;
    const counting = enabled && (playbackState === 1 || (!loading && !video));
    playbackClock.update(counting, performance.now());
    if (!counting || selection.length < 2) return undefined;
    const timer = setInterval(() => { if (playbackClock.update(true, performance.now())) move(1); }, 100);
    return () => { clearInterval(timer); playbackClock.update(false, performance.now()); };
  }, [enabled, playbackState, loading, video, move, selection.length]);

  const failure = () => {
    setPlaybackState(-1);
    if (candidate + 1 < candidates.length) setCandidate((value) => value + 1);
    else { setCandidates([]); setMessage('No se puede reproducir aquí. Abre el trailer completo para ver alternativas.'); }
  };
  if (!movie) return null;
  const featuredShowings = showings.filter((item) => String(item.tmdb_id) === String(movie.id)).slice(0, 4);
  return <section ref={(node) => { root.current = node; if (heroRef) heroRef.current = node; }} className="cinema-hero cinema-hero--screening" aria-labelledby="hero-title" data-hero-index={active}>
    <div className="hero-copy">
      <p className="hero-kicker">LA FUNCIÓN EMPIEZA AQUÍ · BOGOTÁ</p>
      <p className="hero-film-meta">{movie.release_date?.slice(0, 4)} · ★ {Number(movie.vote_average || 0).toFixed(1)} TMDB</p>
      <h1 id="hero-title">{movie.title}</h1>
      <p className="hero-genres">{movie.genres?.slice(0, 3).map((genre) => genre.name).join(' / ')}</p>
      <p className="hero-summary">{movie.overview}</p>
      <div className="hero-actions"><Link to={`/pelicula/${movie.id}`} className="button-primary" data-motion="magnetic"><Ticket size={17} />VER FUNCIONES</Link><button className="button-ghost" onClick={(event) => onTrailer(movie, { originRect: event.currentTarget.getBoundingClientRect() })}><Play size={16} />TRAILER COMPLETO</button></div>
    </div>
    <div className="hero-screening">
      <header><span>PROYECCIÓN PRIVADA / {String(active + 1).padStart(2, '0')}</span><span>AVANCE · 8 SEGUNDOS</span></header>
      <div className="hero-preview">
        {video && (!restricted || requested) && !blocked ? <YouTubePlayer key={`${movie.id}-${video.key}-${attempt}`} videoId={video.key} title={`Avance de ${movie.title}`} playing={enabled} muted onState={setPlaybackState} onError={failure} onBlocked={() => { setBlocked(true); setMessage('Pulsa reproducir para activar el avance.'); }} /> : <img src={TMDB.backdrop(movie.backdrop_path, 'w1280') || TMDB.poster(movie.poster_path)} alt={`Escena de ${movie.title}`} fetchPriority="high" />}
      </div>
      <div className="hero-player-controls"><button onClick={() => move(-1)} aria-label="Avance anterior"><ArrowLeft size={18} /></button><button onClick={() => { if (blocked || restricted && !requested) { setBlocked(false); setRequested(true); setPaused(false); setAttempt((value) => value + 1); setMessage(''); } else setPaused((value) => !value); }} aria-label={paused || blocked || restricted && !requested ? 'Reproducir avance' : 'Pausar avances'}>{paused || blocked || restricted && !requested ? <Play size={17} /> : <Pause size={17} />}</button><span>{active + 1} / {selection.length}</span><button onClick={() => move(1)} aria-label="Avance siguiente"><ArrowRight size={18} /></button></div>
      <p className="hero-playback-status" role="status">{loading ? 'Buscando el trailer oficial…' : message || (restricted && !requested ? 'Reproduce el avance cuando quieras.' : 'Trailer oficial · reproducción silenciosa')}</p>
    </div>
    <div className="hero-showtimes"><div><span>HOY EN</span><strong>CINE BOGOTÁ</strong></div><div className="hero-showtimes__rail">{featuredShowings.length ? featuredShowings.map((showing) => <ShowtimePill key={showing.id} showing={showing} compact />) : <span className="hero-showtimes__empty">PRÓXIMAS FUNCIONES EN PROGRAMACIÓN</span>}</div></div>
  </section>;
}
