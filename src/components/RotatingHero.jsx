import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, Pause, Play, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import ShowtimePill from './ShowtimePill';
import EditorialBackdrop from './EditorialBackdrop';
import { canAnimateHero, HERO_INTERVAL_MS } from '../utils/trailers';

export default function RotatingHero({ movies, showings, onTrailer, heroRef }) {
  const root = useRef(null);
  const selection = useMemo(() => movies.slice(0, 5), [movies]);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const modalOpen = useStore((state) => state.showTrailerModal);
  const index = active % Math.max(1, selection.length);
  const movie = selection[index];
  const hasMovies = selection.length > 0;
  const moving = canAnimateHero({ visible, hidden, paused, reduced, modalOpen });
  const move = useCallback((direction) => setActive((value) => (value + direction + selection.length) % Math.max(1, selection.length)), [selection.length]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches || Boolean(navigator.connection?.saveData));
    const visibility = () => setHidden(document.hidden);
    update(); query.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); query.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, [hasMovies]);

  useEffect(() => {
    if (!moving || selection.length < 2) return undefined;
    const timer = setTimeout(() => move(1), HERO_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [moving, index, move, selection.length]);

  useEffect(() => {
    if (!movie || reduced) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo('.hero-copy > *', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .035, duration: .5, overwrite: true });
    }, root);
    return () => context.revert();
  }, [movie, reduced]);

  if (!movie) return null;
  const featuredShowings = showings.filter((item) => String(item.tmdb_id) === String(movie.id)).slice(0, 4);
  return <section ref={(node) => { root.current = node; if (heroRef) heroRef.current = node; }} className="cinema-hero cinema-hero--editorial" aria-labelledby="hero-title" data-hero-index={index}>
    <EditorialBackdrop movie={movie} moving={moving} reduced={reduced} />
    <div className="editorial-shade" aria-hidden="true" />
    <div className="editorial-frame" aria-hidden="true"><span>ENCUADRE / {String(index + 1).padStart(2, '0')}</span><span>BOGOTÁ · CINE ANIMATIONS</span></div>
    <div className="hero-copy">
      <p className="hero-kicker">LA FUNCIÓN EMPIEZA AQUÍ</p>
      <p className="hero-film-meta">{movie.release_date?.slice(0, 4)} · ★ {Number(movie.vote_average || 0).toFixed(1)} TMDB</p>
      <h1 id="hero-title">{movie.title}</h1>
      <p className="hero-genres">{movie.genres?.slice(0, 3).map((genre) => genre.name).join(' / ')}</p>
      <p className="hero-summary">{movie.overview}</p>
      <div className="hero-actions"><Link to={`/pelicula/${movie.id}`} className="button-primary" data-motion="magnetic"><Ticket size={17} />VER FUNCIONES</Link><button className="button-ghost" onClick={(event) => onTrailer(movie, { originRect: event.currentTarget.getBoundingClientRect() })}><Play size={16} />VER TRAILER</button></div>
    </div>
    <div className="editorial-controls" aria-label="Películas destacadas">
      <button onClick={() => move(-1)} aria-label="Película destacada anterior"><ArrowLeft size={18} /></button>
      <span>{String(index + 1).padStart(2, '0')} / {String(selection.length).padStart(2, '0')}</span>
      <button onClick={() => move(1)} aria-label="Película destacada siguiente"><ArrowRight size={18} /></button>
      {!reduced && <button onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Reanudar fondos' : 'Pausar fondos'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
    </div>
    <div className="hero-showtimes"><div><span>HOY EN</span><strong>CINE BOGOTÁ</strong></div><div className="hero-showtimes__rail">{featuredShowings.length ? featuredShowings.map((showing) => <ShowtimePill key={showing.id} showing={showing} compact />) : <span className="hero-showtimes__empty">PRÓXIMAS FUNCIONES EN PROGRAMACIÓN</span>}</div></div>
  </section>;
}
