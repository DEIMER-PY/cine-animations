import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { TMDB } from '../api/tmdb';

// Real linked artwork, not a video of somebody else's interface.
export default function MotionGallery({ items = [], type = 'movie', variant = 'wall', label = 'Explorar historias' }) {
  const root = useRef(null);
  const animationContext = useRef(null);
  useLayoutEffect(() => {
    animationContext.current = gsap.context(() => {}, root);
    return () => animationContext.current.revert();
  }, []);
  const lock = useRef(0);
  const [active, setActive] = useState(0);
  const cards = items.slice(0, 9);
  const count = cards.length;
  const move = (direction) => {
    if (!count || performance.now() < lock.current) return;
    lock.current = performance.now() + 350;
    setActive((value) => (value + direction + count) % count);
  };
  useLayoutEffect(() => {
    if (!count) return undefined;
    const targets = root.current.querySelectorAll('.motion-gallery__card');
    animationContext.current.add(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const width = root.current.clientWidth;
      gsap.to('.motion-gallery__card', {
        x: (index) => {
          const delta = ((index - active + count + Math.floor(count / 2)) % count) - Math.floor(count / 2);
          return delta * Math.min(width * .21, variant === 'fan' ? 140 : 210);
        },
        y: (index) => Math.abs(((index - active + count + Math.floor(count / 2)) % count) - Math.floor(count / 2)) * (variant === 'fan' ? 18 : 8),
        z: (index) => -Math.abs(((index - active + count + Math.floor(count / 2)) % count) - Math.floor(count / 2)) * 100,
        rotationY: (index) => -(((index - active + count + Math.floor(count / 2)) % count) - Math.floor(count / 2)) * (variant === 'fan' ? 4 : 14),
        rotation: (index) => variant === 'fan' ? (((index - active + count + Math.floor(count / 2)) % count) - Math.floor(count / 2)) * 8 : 0,
        duration: reduced ? 0 : .7, ease: 'power3.inOut', overwrite: true,
      });
    });
    return () => gsap.killTweensOf(targets);
  }, [active, count, variant]);
  if (!count) return null;
  return <section ref={root} className={`motion-gallery motion-gallery--${variant}`} aria-label={label} onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}>
    <div className="motion-gallery__stage">{cards.map((item, index) => {
      const delta = ((index - active + count + Math.floor(count / 2)) % count) - Math.floor(count / 2);
      const title = item.title || item.name;
      return <Link className={`motion-gallery__card ${delta === 0 ? 'is-active' : ''}`} style={{ zIndex: count - Math.abs(delta) }} tabIndex={Math.abs(delta) > 2 ? -1 : 0} aria-hidden={Math.abs(delta) > 2 ? true : undefined} key={item.id} to={`/${type === 'person' ? 'persona' : type === 'tv' ? 'serie' : 'pelicula'}/${item.id}`}><img src={type === 'person' ? TMDB.profile(item.profile_path, 'h632') : TMDB.poster(item.poster_path, 'w342')} alt="" loading="lazy" /><span>{title}</span></Link>;
    })}</div>
    <div className="motion-gallery__controls"><button onClick={() => move(-1)} aria-label={`${label}: anterior`}><ArrowLeft size={18} /></button><span>{active + 1} / {count}</span><button onClick={() => move(1)} aria-label={`${label}: siguiente`}><ArrowRight size={18} /></button></div>
  </section>;
}
