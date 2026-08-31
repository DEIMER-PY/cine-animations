import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TMDB } from '../api/tmdb';

let manifestRequest;
function getManifest() {
  manifestRequest ||= fetch('/media/editorial/manifest.json').then((response) => response.ok ? response.json() : {}).catch(() => ({}));
  return manifestRequest;
}

// Double-buffer decoded stills: an unavailable image never replaces the last frame.
export default function EditorialBackdrop({ movie, moving, reduced }) {
  const root = useRef(null);
  const context = useRef(null);
  const drift = useRef(null);
  const [frames, setFrames] = useState([]);
  useEffect(() => {
    context.current = gsap.context(() => {}, root);
    return () => context.current.revert();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const image = new window.Image();
    let timeout;
    const load = async () => {
      const manifest = await getManifest();
      if (cancelled) return;
      const asset = manifest[String(movie.id)];
      const src = asset?.backdrop === movie.backdrop_path ? (window.innerWidth <= 768 ? asset.small : asset.src) : TMDB.backdrop(movie.backdrop_path, 'w1280') || TMDB.poster(movie.poster_path);
      if (!src) return;
      image.onload = () => {
        if (cancelled) return;
        clearTimeout(timeout);
        setFrames((previous) => [...previous.slice(-1), { id: movie.id, src, title: movie.title }]);
      };
      image.onerror = () => { clearTimeout(timeout); if (!cancelled) setFrames([]); };
      timeout = setTimeout(() => { image.onload = null; image.onerror = null; if (!cancelled) setFrames([]); }, 12000);
      image.src = src;
    };
    load();
    return () => { cancelled = true; clearTimeout(timeout); image.onload = null; image.onerror = null; };
  }, [movie.id, movie.backdrop_path, movie.poster_path, movie.title]);

  useEffect(() => {
    if (!frames.length) return undefined;
    let fade;
    context.current.add(() => {
      const nodes = root.current.querySelectorAll('img');
      const next = nodes[nodes.length - 1];
      fade = gsap.fromTo(next, { autoAlpha: reduced ? 1 : 0 }, { autoAlpha: 1, duration: reduced ? 0 : .9, ease: 'power2.out' });
      drift.current = gsap.fromTo(next, { scale: reduced ? 1 : 1.055 }, { scale: 1, duration: 10, ease: 'none', paused: true });
    });
    return () => { fade?.kill(); drift.current?.kill(); };
  }, [frames, reduced]);

  useEffect(() => { if (moving && !reduced) drift.current?.play(); else drift.current?.pause(); }, [frames, moving, reduced]);
  return <div ref={root} className="editorial-backdrop" aria-hidden="true">{frames.map((frame, index) => <img key={`${frame.id}-${index}`} src={frame.src} alt="" className="editorial-scene" decoding="async" />)}</div>;
}
