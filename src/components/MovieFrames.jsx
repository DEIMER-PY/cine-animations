import MotionGallery from './MotionGallery';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { getCinemaMovies } from '../api/cinema';
import { TMDB } from '../api/tmdb';

const ROWS = [
  { duration: 42, direction: -1, label: 'EN CARTELERA' },
  { duration: 52, direction: 1, label: 'MÁS VISTAS' },
  { duration: 46, direction: -1, label: 'PRÓXIMAMENTE' },
];

function FrameRow({ movies, config, rowIndex }) {
  const trackRef = useRef(null);
  const tweenRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const reel = Array.from({ length: 10 }, (_, index) => movies[(index + rowIndex * 3) % movies.length]);
  const track = [...reel, ...reel];

  useLayoutEffect(() => {
    if (!trackRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      tweenRef.current = config.direction < 0
        ? gsap.fromTo(trackRef.current, { xPercent: 0 }, { xPercent: -50, duration: config.duration, repeat: -1, ease: 'none' })
        : gsap.fromTo(trackRef.current, { xPercent: -50 }, { xPercent: 0, duration: config.duration, repeat: -1, ease: 'none' });
    }, trackRef);
    let visible = false;
    const sync = () => tweenRef.current?.paused(pausedRef.current || !visible || document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(trackRef.current.parentElement);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); context.revert(); };
  }, [config.direction, config.duration, movies]);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
    tweenRef.current?.paused(next);
  };

  return <div className="movie-frames__row">
    <div className="movie-frames__row-label"><span>0{rowIndex + 1}</span>{config.label}</div>
    <button className="movie-frames__pause" onClick={toggle} aria-label={paused ? `Reproducir carrusel ${config.label}` : `Pausar carrusel ${config.label}`}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>
    <div ref={trackRef} className="movie-frames__track">
      {track.map((movie, index) => <Link to={`/pelicula/${movie.id}`} className="movie-frame" key={`${movie.id}-${rowIndex}-${index}`} aria-hidden={index >= reel.length ? 'true' : undefined} tabIndex={index >= reel.length ? -1 : 0}>
        <img src={TMDB.backdrop(movie.backdrop_path, 'w780')} alt={index < reel.length ? `Escena de ${movie.title}` : ''} loading="lazy" />
        <span className="movie-frame__veil" />
        <span className="movie-frame__copy"><small>{movie.release_date?.slice(0, 4) || '2026'} · ★ {Number(movie.vote_average || 0).toFixed(1)}</small><strong>{movie.title}</strong><i>ABRIR FICHA <ArrowUpRight size={13} /></i></span>
      </Link>)}
    </div>
  </div>;
}

export default function MovieFrames({ movies: suppliedMovies = [] }) {
  const [movies, setMovies] = useState(suppliedMovies.filter((movie) => movie.backdrop_path));

  useEffect(() => {
    if (suppliedMovies.length) {
      setMovies(suppliedMovies.filter((movie) => movie.backdrop_path));
      return;
    }
    getCinemaMovies('trending', 20).then((items) => setMovies(items.filter((movie) => movie.backdrop_path)));
  }, [suppliedMovies]);

  if (!movies.length) return <section className="movie-frames movie-frames--loading" aria-label="Cargando archivo cinematográfico"><div /><div /><div /></section>;

  return <section className="movie-frames" aria-labelledby="movie-frames-title">
    <MotionGallery items={movies} variant="fan" label="Archivo de películas" />
    <header><p>05 · ARCHIVO EN MOVIMIENTO</p><h2 id="movie-frames-title">TODAS LAS HISTORIAS.<br /><em>NINGUNA QUIETA.</em></h2><span>Explora el archivo · Solo el control de pausa detiene la proyección</span></header>
    <div className="movie-frames__fade movie-frames__fade--left" /><div className="movie-frames__fade movie-frames__fade--right" />
    {ROWS.map((config, index) => <FrameRow key={config.label} movies={movies} config={config} rowIndex={index} />)}
  </section>;
}
