import { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { TMDB } from '../api/tmdb';

function FavoriteCard({ movie, index }) {
  const removeFavorite = useStore((s) => s.removeFavorite);
  const setSelectedMovie = useStore((s) => s.setSelectedMovie);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const posterUrl = movie.poster_path
    ? TMDB.poster(movie.poster_path, 'w342')
    : null;

  return (
    <div
      ref={cardRef}
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setSelectedMovie(movie)}
      data-cursor-magnetic
      style={{
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div
        className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${
          isHovered
            ? 'border-cinema-gold/40 shadow-[0_0_30px_rgba(212,160,23,0.15)]'
            : 'border-white/5'
        }`}
      >
        <div className="aspect-[2/3] relative">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-700"
              style={{
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              }}
            />
          ) : (
            <div className="w-full h-full bg-cinema-mid flex items-center justify-center text-white/10 text-4xl">
              ?
            </div>
          )}

          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background:
                'linear-gradient(180deg, transparent 30%, rgba(10,10,10,0.9) 100%)',
            }}
          />

          <div
            className={`absolute inset-0 flex flex-col justify-end p-4 transition-all duration-500 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cinema-gold text-xs font-mono">
                ★ {movie.vote_average?.toFixed(1)}
              </span>
              <span className="text-white/20 text-xs">
                {movie.release_date?.split('-')[0]}
              </span>
            </div>
            <p className="text-white/40 text-xs line-clamp-3 leading-relaxed">
              {movie.overview?.slice(0, 120)}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFavorite(movie.id);
            }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
              isHovered
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-75'
            } hover:bg-cinema-accent/80 text-white/60 hover:text-white`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div
            className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500 ${
              isHovered ? 'bg-cinema-gold' : 'bg-transparent'
            }`}
          />
        </div>

        <div className="p-3 bg-cinema-dark/80">
          <h3 className="font-body text-sm text-white/80 truncate">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1 h-1 rounded-full bg-cinema-gold/60" />
            <span className="font-mono text-[10px] text-white/30">
              SAVED TO COLLECTION
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterRipple({ rippleRef }) {
  return (
    <div
      ref={rippleRef}
      className="pointer-events-none fixed z-50"
      style={{
        left: -200,
        top: -200,
        width: 200,
        height: 200,
      }}
    >
      <div
        className="w-full h-full rounded-full border border-cinema-gold/10"
        style={{
          animation: 'ripple 2s ease-out infinite',
        }}
      />
    </div>
  );
}

export default function FavoritesGrid() {
  const favorites = useStore((s) => s.favorites);
  const rippleRef = useRef(null);

  useEffect(() => {
    let raf;
    const handleMouse = (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (rippleRef.current) {
          rippleRef.current.style.left = `${e.clientX - 100}px`;
          rippleRef.current.style.top = `${e.clientY - 100}px`;
        }
      });
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouse);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <div className="text-6xl text-white/10">♡</div>
        <div className="text-center">
          <h3 className="font-display text-2xl text-white/20 tracking-wider mb-2">
            YOUR COLLECTION IS EMPTY
          </h3>
          <p className="font-mono text-xs text-white/10 tracking-wider">
            Add films from the catalog to build your personal collection
          </p>
        </div>
        <style>{`
          @keyframes ripple {
            0% { transform: scale(0.5); opacity: 0.5; }
            100% { transform: scale(2); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <span className="font-mono text-xs text-cinema-gold/40 tracking-widest">
          {favorites.length} FILMS SAVED
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-cinema-gold/20 to-transparent" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {favorites.map((movie, index) => (
          <FavoriteCard key={movie.id} movie={movie} index={index} />
        ))}
      </div>

      <WaterRipple rippleRef={rippleRef} />

      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.5); opacity: 0.3; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
