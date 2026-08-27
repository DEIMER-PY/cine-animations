import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useMovieDetails, useGenres } from '../hooks/useMovies';
import { TMDB } from '../api/tmdb';

export default function MovieDetail() {
  const selectedMovie = useStore((s) => s.selectedMovie);
  const clearSelectedMovie = useStore((s) => s.clearSelectedMovie);
  const addFavorite = useStore((s) => s.addFavorite);
  const removeFavorite = useStore((s) => s.removeFavorite);
  const addToWatchlist = useStore((s) => s.addToWatchlist);
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist);
  const openTrailer = useStore((s) => s.openTrailer);
  const favorites = useStore((s) => s.favorites);
  const watchlist = useStore((s) => s.watchlist);
  const { movie } = useMovieDetails(selectedMovie?.id);
  const { getGenreName } = useGenres();
  const [activeTab, setActiveTab] = useState('overview');
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  const isFav = favorites.some((f) => f.id === selectedMovie?.id);
  const isQueued = watchlist.some((item) => item.id === selectedMovie?.id);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [clearSelectedMovie]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') clearSelectedMovie();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [clearSelectedMovie]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) clearSelectedMovie();
  };

  if (!selectedMovie) return null;

  const backdropUrl = selectedMovie.backdrop_path
    ? TMDB.backdrop(selectedMovie.backdrop_path, 'original')
    : null;
  const posterUrl = selectedMovie.poster_path
    ? TMDB.poster(selectedMovie.poster_path, 'w500')
    : null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
    >
      <div
        ref={contentRef}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl film-grain"
      >
        <div className="relative h-[300px] md:h-[400px] overflow-hidden rounded-t-2xl">
          {backdropUrl && (
            <img
              src={backdropUrl}
              alt={selectedMovie.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/60 to-transparent" />

          <button
            onClick={clearSelectedMovie}
            aria-label="Close movie details"
            data-cursor-magnetic
            className="absolute top-4 right-4 w-10 h-10 rounded-full glass-panel-tight flex items-center justify-center text-white/60 hover:text-white hover:bg-cinema-accent/20 transition-all z-10"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative p-6 md:p-10 -mt-20">
          <div className="flex flex-col md:flex-row gap-8">
            {posterUrl && (
              <div className="shrink-0 w-40 md:w-52 mx-auto md:mx-0">
                <img
                  src={posterUrl}
                  alt={selectedMovie.title}
                  className="w-full rounded-xl shadow-2xl border border-white/5"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="font-display text-4xl md:text-6xl tracking-wider leading-none mb-3">
                {selectedMovie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                <span className="font-mono text-cinema-gold">
                  {selectedMovie.release_date?.split('-')[0]}
                </span>
                <span className="text-white/20">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-cinema-accent">★</span>
                  <span className="font-mono text-cinema-gray">
                    {selectedMovie.vote_average?.toFixed(1)}
                  </span>
                </div>
                <span className="text-white/20">•</span>
                <div className="flex gap-2">
                  {selectedMovie.genre_ids?.slice(0, 3).map((id) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider border border-white/10 text-white/40"
                    >
                      {getGenreName(id)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button
                  data-cursor-magnetic
                  onClick={() => selectedMovie && openTrailer(selectedMovie)}
                  className="flex items-center gap-2 px-6 py-3 bg-cinema-accent hover:bg-red-600 rounded-xl font-display text-lg tracking-wider transition-all box-glow-accent"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  PLAY
                </button>
                <button
                  onClick={() =>
                    isFav
                      ? removeFavorite(selectedMovie.id)
                      : addFavorite(selectedMovie)
                  }
                  data-cursor-magnetic
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-display text-lg tracking-wider border transition-all ${
                    isFav
                      ? 'border-cinema-gold bg-cinema-gold/10 text-cinema-gold'
                      : 'border-white/10 hover:border-cinema-gold/50 text-white/60 hover:text-cinema-gold'
                  }`}
                >
                  <span>{isFav ? '♥' : '♡'}</span>
                  {isFav ? 'SAVED' : 'SAVE'}
                </button>
                <button
                  onClick={() => isQueued ? removeFromWatchlist(selectedMovie.id) : addToWatchlist(selectedMovie)}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-3 font-display text-lg tracking-wider transition-all ${isQueued ? 'border-cinema-accent bg-cinema-accent/10 text-cinema-accent' : 'border-white/10 text-white/60 hover:border-cinema-accent/50 hover:text-white'}`}
                >
                  {isQueued ? 'QUEUED' : 'WATCH LATER'}
                </button>
              </div>

              <div className="flex gap-1 mb-6 border-b border-white/5">
                {['overview', 'cast', 'similar'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-mono text-xs tracking-wider uppercase transition-all ${
                      activeTab === tab
                        ? 'text-cinema-gray border-b-2 border-cinema-gray'
                        : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <p className="text-white/60 leading-relaxed text-sm max-w-xl">
                  {selectedMovie.overview || 'No description available.'}
                </p>
              )}

              {activeTab === 'cast' && movie?.credits?.cast && (
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {movie.credits.cast.slice(0, 10).map((actor) => (
                    <div
                      key={actor.id}
                      className="shrink-0 w-20 text-center"
                    >
                      {actor.profile_path ? (
                        <img
                          src={TMDB.profile(actor.profile_path)}
                          alt={actor.name}
                          className="w-16 h-16 rounded-full object-cover mx-auto border border-white/10 mb-1"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-cinema-mid flex items-center justify-center mx-auto mb-1 text-white/20 text-xl">
                          ?
                        </div>
                      )}
                      <span className="text-[10px] text-white/50 leading-tight block">
                        {actor.name}
                      </span>
                      <span className="text-[9px] text-white/30 leading-tight block">
                        {actor.character}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'similar' && movie?.similar?.results && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {movie.similar.results.slice(0, 8).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => useStore.getState().setSelectedMovie(m)}
                      data-cursor-magnetic
                      className="text-left group"
                    >
                      {m.poster_path && (
                        <img
                          src={TMDB.poster(m.poster_path, 'w185')}
                          alt={m.title}
                          className="w-full rounded-lg mb-1 group-hover:ring-2 ring-cinema-accent transition-all"
                        />
                      )}
                      <span className="text-[10px] text-white/40 group-hover:text-white/70 transition-colors line-clamp-1">
                        {m.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
