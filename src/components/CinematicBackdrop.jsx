import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TMDB } from '../api/tmdb';
import { Catalog } from '../api/catalog';

/**
 * Plays a muted, looping cinematic trailer as a full-bleed background layer
 * with a dark grade so content stays readable. Falls back to a static
 * backdrop image until the video is ready.
 */
export default function CinematicBackdrop({ movieId, backdropPath, intensity = 0.82 }) {
  const wrapRef = useRef(null);
  const [videoKey, setVideoKey] = useState(null);
  const [ready, setReady] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);

  // fetch a YouTube trailer for the given movie
  useEffect(() => {
    if (!movieId) return;
    let cancelled = false;
    Catalog.fetchMovieDetails(movieId)
      .then((data) => {
        const yt = (data?.videos?.results || []).find(
          (v) => v.site === 'YouTube' && v.type === 'Trailer'
        );
        if (yt && !cancelled) setVideoKey(yt.key);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  useEffect(() => {
    const node = wrapRef.current;
    const media = window.matchMedia('(prefers-reduced-motion: no-preference)');
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setAllowMotion(entry.isIntersecting && media.matches && !document.hidden);
      if (!entry.isIntersecting) setReady(false);
    }, { threshold: 0.08 });
    const sync = () => setAllowMotion(media.matches && !document.hidden && node.getBoundingClientRect().bottom > 0 && node.getBoundingClientRect().top < window.innerHeight);
    observer.observe(node);
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  // fade the layer in once mounted
  useEffect(() => {
    if (wrapRef.current) {
      gsap.fromTo(wrapRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });
    }
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* poster fallback */}
      <img
        src={TMDB.backdrop(backdropPath, 'original')}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: !ready ? 1 : 0, transition: 'opacity 0.8s ease' }}
      />

      {/* trailer video */}
      {videoKey && allowMotion && (
        <iframe
          title="cinematic backdrop"
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&mute=1&loop=1&playlist=${videoKey}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}
          onLoad={() => setReady(true)}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
        />
      )}

      {/* cinematic grade */}
      <div
        className="absolute inset-0 bg-cinema-black"
        style={{ opacity: intensity }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-cinema-black/40 via-cinema-black/10 to-cinema-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/60 via-transparent to-cinema-black/30" />
    </div>
  );
}
