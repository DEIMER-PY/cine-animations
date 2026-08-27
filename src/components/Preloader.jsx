import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { TMDB } from '../api/tmdb';

export default function Preloader({ onReady }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('INITIALIZING SYSTEMS');
  const [visible, setVisible] = useState(true);
  const setPreloaderDone = useStore((s) => s.setPreloaderDone);
  const loadFavorites = useStore((s) => s.loadFavorites);
  const loadedCount = useRef(0);
  const totalAssets = useRef(0);

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        setStatus('CONNECTING TO TMDB DATABASE');
        const movies = await TMDB.fetchTrending();
        totalAssets.current = movies.length;

        setStatus('RENDERING FRAME BUFFER');
        const imagePromises = movies
          .filter((m) => m.poster_path)
          .map((m) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                loadedCount.current++;
                setProgress(
                  Math.min(
                    (loadedCount.current / totalAssets.current) * 100,
                    100
                  )
                );
                resolve();
              };
              img.onerror = () => {
                loadedCount.current++;
                setProgress(
                  Math.min(
                    (loadedCount.current / totalAssets.current) * 100,
                    100
                  )
                );
                resolve();
              };
              img.src = TMDB.poster(m.poster_path, 'w342');
            });
          });

        await Promise.all(imagePromises);
        setStatus('COMPILING SHADERS');
        await loadFavorites();
        setStatus('SCENE READY');

        await new Promise((r) => setTimeout(r, 600));
        setVisible(false);
        setPreloaderDone();
        onReady?.();
      } catch (err) {
        console.error('Preloader error:', err);
        setStatus('FALLBACK MODE ACTIVE');
        await new Promise((r) => setTimeout(r, 1000));
        setVisible(false);
        setPreloaderDone();
        onReady?.();
      }
    };

    preloadAssets();
  }, []);

  if (!visible) return null;

  const segments = 40;
  const filledSegments = Math.floor((progress / 100) * segments);

  return (
    <div className="fixed inset-0 z-[10000] bg-cinema-black flex items-center justify-center">
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px'}} />

      <div className="relative flex flex-col items-center gap-8 z-10">
        <div className="font-display text-8xl md:text-[10rem] tracking-[0.2em] text-glow-accent leading-none">
          C
        </div>

        <div className="w-[300px] md:w-[500px]">
          <div className="flex gap-[2px]">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 transition-all duration-100"
                style={{
                  backgroundColor:
                    i < filledSegments
                      ? i % 5 === 0
                        ? '#d4a017'
                        : '#e50914'
                      : 'rgba(255,255,255,0.06)',
                  boxShadow:
                    i < filledSegments
                      ? `0 0 8px ${i % 5 === 0 ? 'rgba(212,160,23,0.5)' : 'rgba(229,9,20,0.5)'}`
                      : 'none',
                }}
              />
            ))}
          </div>

          <div className="flex justify-between mt-3">
            <span className="font-mono text-xs text-cinema-gray/60 tracking-widest">
              {status}
            </span>
            <span className="font-mono text-xs text-cinema-gold">
              {Math.floor(progress)}%
            </span>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full border border-cinema-accent/10 animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full border border-cinema-gray/5" />
      </div>
    </div>
  );
}
