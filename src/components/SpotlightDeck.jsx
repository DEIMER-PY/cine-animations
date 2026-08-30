import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { ArrowLeft, ArrowRight, Bookmark, Play, Star, Ticket } from 'lucide-react';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';

gsap.registerPlugin(Draggable);

const relativeIndex = (index, active, length) => {
  let delta = index - active;
  if (delta > length / 2) delta -= length;
  if (delta < -length / 2) delta += length;
  return delta;
};

export default function SpotlightDeck({ movies = [] }) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const [active, setActive] = useState(0);
  const openTrailer = useStore((state) => state.openTrailer);
  const watchlist = useStore((state) => state.watchlist);
  const addToWatchlist = useStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);
  const selection = useMemo(() => movies.slice(0, 7), [movies]);
  const movie = selection[active] || selection[0];
  const queued = watchlist.some((item) => String(item.id) === String(movie?.id));
  const move = useCallback((direction) => setActive((current) => (current + direction + selection.length) % selection.length), [selection.length]);

  useEffect(() => {
    if (!rootRef.current || !selection.length) return undefined;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray('.spotlight-card');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      cards.forEach((card, index) => {
        const delta = relativeIndex(index, active, cards.length);
        const distance = Math.abs(delta);
        gsap.to(card, { x: delta * Math.min(window.innerWidth * .19, 300), z: distance * -155, rotationY: delta * -17, scale: distance === 0 ? 1 : Math.max(.7, 1 - distance * .105), autoAlpha: distance > 3 ? 0 : Math.max(.35, 1 - distance * .2), zIndex: cards.length - distance, duration: reduced ? 0 : .85, ease: 'power4.inOut', overwrite: true });
      });
      const detail = rootRef.current.querySelector('.spotlight-detail');
      if (detail && !reduced) gsap.fromTo(detail.children, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .58, stagger: .055, ease: 'power3.out', overwrite: true });
    }, rootRef);
    return () => context.revert();
  }, [active, selection]);

  useEffect(() => {
    if (!dragRef.current || selection.length < 2) return undefined;
    let startX = 0;
    const [instance] = Draggable.create(dragRef.current, { type: 'x', cursor: 'grab', activeCursor: 'grabbing', minimumMovement: 8, onPress() { startX = this.x; }, onRelease() { const distance = this.x - startX; if (Math.abs(distance) > 34) move(distance < 0 ? 1 : -1); gsap.set(this.target, { x: 0 }); } });
    return () => instance.kill();
  }, [move, selection.length]);

  if (!movie) return null;
  return <section id="spotlight" ref={rootRef} className="spotlight" aria-labelledby="spotlight-title" onKeyDown={(event) => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); }}>
    <img className="spotlight__backdrop" src={TMDB.backdrop(movie.backdrop_path, 'w1280')} alt="" loading="lazy" />
    <div className="spotlight__veil" />
    <header className="spotlight__header"><div><p>02 · CARTELERA EN MOVIMIENTO</p><h2 id="spotlight-title">TU PRÓXIMA<br /><em>OBSESIÓN.</em></h2></div><span>ARRASTRA · DESLIZA · USA LAS FLECHAS</span></header>
    <div className="spotlight-stage" ref={dragRef} tabIndex="0" role="region" aria-label="Selector de películas destacado">
      {selection.map((item, index) => <button className={`spotlight-card ${index === active ? 'is-active' : ''}`} key={item.id} onClick={() => setActive(index)} aria-label={`Destacar ${item.title}`} aria-pressed={index === active}><img src={TMDB.poster(item.poster_path, 'w500')} alt={`Póster de ${item.title}`} loading="lazy" /><span>{String(index + 1).padStart(2, '0')}</span></button>)}
    </div>
    <div className="spotlight-detail" key={movie.id} aria-live="polite"><p>{movie.release_date?.slice(0, 4) || 'PRÓXIMO'} <i /> {movie.genres?.slice(0, 2).map((genre) => genre.name).join(' · ') || 'SELECCIÓN CINE'}</p><h3>{movie.title}</h3><div className="spotlight-detail__score"><Star size={14} fill="currentColor" /> {Number(movie.vote_average || 0).toFixed(1)} <span>TMDB</span></div><div className="spotlight-detail__actions"><Link className="button-primary" to={`/pelicula/${movie.id}`}><Ticket size={16} />VER FUNCIONES</Link><button className="button-ghost" onClick={() => openTrailer(movie)}><Play size={15} fill="currentColor" />TRÁILER</button><button className={`spotlight-save ${queued ? 'is-active' : ''}`} onClick={() => queued ? removeFromWatchlist(movie.id) : addToWatchlist(movie)} aria-label={queued ? 'Quitar de ver más tarde' : 'Guardar para ver más tarde'}><Bookmark size={17} fill={queued ? 'currentColor' : 'none'} />{queued ? 'GUARDADA' : 'MI LISTA'}</button></div></div>
    <div className="spotlight-controls"><button onClick={() => move(-1)} aria-label="Película anterior"><ArrowLeft size={18} /></button><span>{String(active + 1).padStart(2, '0')} / {String(selection.length).padStart(2, '0')}</span><button onClick={() => move(1)} aria-label="Película siguiente"><ArrowRight size={18} /></button></div>
  </section>;
}
