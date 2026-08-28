import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useStore } from '../store/useStore';
import { TMDB } from '../api/tmdb';
import { scrambleText } from '../lib/animations';

const STATUSES = [
  [0, 'INITIALIZING PROJECTION'],
  [24, 'SYNCING THE ARCHIVE'],
  [52, 'CALIBRATING LIGHT'],
  [78, 'COMPOSING THE FRAME'],
  [100, 'PICTURE READY'],
];

export default function Preloader({ onReady }) {
  const [progress, setProgress] = useState(0);
  const setPreloaderDone = useStore((s) => s.setPreloaderDone);
  const loadFavorites = useStore((s) => s.loadFavorites);

  const rootRef = useRef(null);
  const centerRef = useRef(null);
  const counterRef = useRef(null);
  const barRef = useRef(null);
  const statusRef = useRef(null);
  const maskRef = useRef(null);

  useEffect(() => {
    let active = true;
    let completed = false;
    let exitTimeline;
    const finish = () => {
      if (!active || completed) return;
      completed = true;
      setPreloaderDone();
      onReady?.();
    };
    const safetyTimer = window.setTimeout(finish, 8000);
    const context = gsap.context(() => {
      gsap.fromTo(
        barRef.current,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 1.1, ease: 'power3.inOut' }
      );
      gsap.fromTo(
        centerRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }, rootRef);

    scrambleText(statusRef.current, STATUSES[0][1], { duration: 0.55 });

    const run = async () => {
      const updateProgress = (value) => {
        if (!active) return;
        setProgress(value);
        gsap.to(counterRef.current, {
          innerText: value,
          duration: 0.35,
          snap: { innerText: 1 },
          ease: 'power1.out',
          overwrite: true,
        });
      };

      updateProgress(14);
      try {
        const movies = await TMDB.fetchTrending();
        updateProgress(38);
        const imgs = movies.filter((m) => m.poster_path).slice(0, 12);
        const loadAll = imgs.map(
          (m) =>
            new Promise((res) => {
              const img = new Image();
              img.onload = img.onerror = res;
              img.src = TMDB.poster(m.poster_path, 'w342');
            })
        );
        await Promise.all(loadAll).catch(() => {});
      } catch {
        updateProgress(58);
      }

      await loadFavorites().catch(() => {});
      updateProgress(82);
      await new Promise((resolve) => setTimeout(resolve, 280));
      updateProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 420));

      if (!active) return;
      exitTimeline = gsap.timeline({
        onComplete: finish,
      });
      exitTimeline
        .to(centerRef.current, { scale: 1.4, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(maskRef.current, { scaleY: 0, transformOrigin: 'top center', duration: 0.75, ease: 'power4.inOut' }, '-=0.15');
    };

    run();

    return () => {
      active = false;
      window.clearTimeout(safetyTimer);
      exitTimeline?.kill();
      context.revert();
    };
  }, [loadFavorites, onReady, setPreloaderDone]);

  useEffect(() => {
    const current = STATUSES.reduce(
      (acc, [thresh, label]) => (progress >= thresh ? [thresh, label] : acc),
      STATUSES[0]
    );
    if (statusRef.current && statusRef.current.textContent !== current[1]) {
      scrambleText(statusRef.current, current[1], { duration: 0.4 });
    }
  }, [progress]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-[10000] bg-cinema-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '28px 28px' }} />

      <div ref={maskRef} className="absolute inset-0 bg-cinema-black" />

      <div ref={centerRef} className="relative flex flex-col items-center gap-8 z-10">
        <div className="relative">
          <span className="font-display text-8xl md:text-[10rem] tracking-[0.2em] text-glow-accent leading-none bg-gradient-to-b from-white via-white/70 to-transparent bg-clip-text text-transparent">
            CINE
          </span>
          <div className="absolute -inset-8 rounded-full border border-cinema-accent/10 animate-pulse-glow" />
        </div>

        <div className="w-[300px] md:w-[480px]">
          <div ref={barRef} className="h-[3px] w-full rounded-full bg-gradient-to-r from-cinema-accent via-cinema-gold to-cinema-accent" />
          <div className="flex justify-between items-center mt-4">
            <span ref={statusRef} className="font-mono text-xs text-cinema-gray/70 tracking-[0.25em]" />
            <span ref={counterRef} className="font-display text-3xl text-cinema-gold tabular-nums">
              0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
