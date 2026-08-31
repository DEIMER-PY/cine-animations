import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStore } from '../store/useStore';
import { TMDB } from '../api/tmdb';

export default function ProjectionLoader({ label = 'Preparando tu próxima historia', full = false }) {
  const root = useRef(null);
  const movies = useStore((state) => state.movies);
  const images = movies.filter((movie) => movie.poster_path).slice(0, 6);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timeline;
    const context = gsap.context(() => {
      timeline = gsap.timeline({ repeat: -1, paused: true });
      root.current.querySelectorAll('.poster-orbit__card').forEach((card, index) => {
        const frames = Array.from({ length: 7 }, (_, step) => {
          const angle = (index + step) * Math.PI / 3;
          return { x: Math.cos(angle) * 100, y: Math.sin(angle) * 26, z: Math.sin(angle) * 90, rotationY: Math.cos(angle) * -24, scale: .8 + (Math.sin(angle) + 1) * .12, duration: .45, ease: 'none' };
        });
        gsap.set(card, frames[0]);
        timeline.to(card, { keyframes: frames.slice(1) }, 0);
      });
      timeline.to('.poster-orbit__card', { x: (index) => (index - 2.5) * 47, y: 0, z: 0, rotationY: 0, scale: .8, duration: .4, stagger: .025, ease: 'power3.inOut' });
    }, root);
    let visible = false;
    const sync = () => timeline?.paused(!visible || document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(root.current);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); context.revert(); };
  }, []);
  return <div ref={root} className={`projection-loader poster-orbit ${full ? 'projection-loader--full' : ''}`} role="status" aria-live="polite"><div className="poster-orbit__stage" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div className="poster-orbit__card" key={index}>{images[index] ? <img src={TMDB.poster(images[index].poster_path, 'w185')} alt="" /> : <span>{String(index + 1).padStart(2, '0')}<i /></span>}</div>)}</div><strong>{label}</strong><small>LAS HISTORIAS ESTÁN TOMANDO SU LUGAR</small></div>;
}
