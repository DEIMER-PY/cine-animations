import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TMDB } from '../api/tmdb';
import { Catalog } from '../api/catalog';

/** A fixed, full-viewport ambient video layer that quietly plays behind all content. */
export default function GlobalBackdrop({ intensity = 0.92 }) {
  const wrapRef = useRef(null);
  const [movie, setMovie] = useState(null);
  const [videoKey, setVideoKey] = useState(null);
  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: no-preference) and (min-width: 769px)');
    const sync = () => setAllowMotion(query.matches && !document.hidden);
    sync();
    query.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      query.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Catalog.fetchMovies('trending', 5)
      .then(async (data) => {
        if (cancelled) return;
        const candidates = (data || []).filter((m) => m.backdrop_path);
        setMovie(candidates[0] || null);
        if (candidates[0]) {
          const detail = await Catalog.fetchMovieDetails(candidates[0].id);
          const yt = detail?.videos?.results?.find((video) => video.site === 'YouTube' && video.type === 'Trailer');
          if (!cancelled && yt) setVideoKey(yt.key);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (wrapRef.current) {
      gsap.fromTo(wrapRef.current, { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power2.out' });
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {!videoKey && movie && (
        <img
          src={TMDB.backdrop(movie.backdrop_path, 'original')}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scale(1.08)' }}
        />
      )}
      {videoKey && allowMotion && (
        <iframe
          title="ambient cinema"
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&mute=1&loop=1&playlist=${videoKey}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
        />
      )}
      <div className="absolute inset-0 bg-cinema-black" style={{ opacity: intensity }} />
      <div className="absolute inset-0 bg-gradient-to-b from-cinema-black/60 via-cinema-black/30 to-cinema-black/80" />
    </div>
  );
}
