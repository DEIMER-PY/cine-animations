import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';
import { useGenres } from '../hooks/useMovies';
import CinematicBackdrop from './CinematicBackdrop';
import { TextScramble, AnimatedCounter } from './animations';

const AUTO_ROTATE_MS = 6000;
const MAX_MOVIES = 5;

export default function SynopsisSection() {
  const setSelectedMovie = useStore((s) => s.setSelectedMovie);
  const { getGenreName } = useGenres();
  const [movies, setMovies] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    TMDB.fetchTopRated()
      .then((data) => setMovies(data.filter((m) => m.backdrop_path && m.poster_path).slice(0, MAX_MOVIES)))
      .catch(() => {});
  }, []);

  const advance = useCallback(() => {
    if (movies.length === 0) return;
    setCurrentIdx((prev) => (prev + 1) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    if (movies.length === 0) return;
    const id = setInterval(advance, AUTO_ROTATE_MS);
    return () => clearInterval(id);
  }, [advance, movies.length]);

  const movie = movies[currentIdx];
  if (!movie) return null;

  const posterUrl = TMDB.poster(movie.poster_path, 'w500');

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        <CinematicBackdrop movieId={movie.id} backdropPath={movie.backdrop_path} intensity={0.5} />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/70 to-cinema-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-cinema-black/50" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-20 md:py-28">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="shrink-0 w-56 md:w-72 lg:w-80"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </motion.div>

          <motion.div
            key={`info-${movie.id}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 max-w-2xl"
          >
            <motion.div variants={childVariants} className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-cinema-accent" />
              <span className="font-mono text-xs text-cinema-gray/60 tracking-[0.3em]">
                TOP RATED
              </span>
            </motion.div>

            <motion.h2
              variants={childVariants}
              className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-wider mb-4 text-glow-accent"
            >
              <TextScramble text={movie.title} duration={1.2} />
            </motion.h2>

            <motion.div variants={childVariants} className="flex flex-wrap items-center gap-3 mb-5 text-sm">
              <span className="flex items-center gap-1.5 font-mono text-cinema-gold">
                <Star size={14} className="text-cinema-accent fill-cinema-accent" />
                <AnimatedCounter to={movie.vote_average || 0} decimals={1} />
              </span>
              <span className="text-white/20">|</span>
              <span className="font-mono text-white/40">
                {movie.release_date?.split('-')[0]}
              </span>
              <span className="text-white/20">|</span>
              <div className="flex gap-2">
                {movie.genre_ids?.slice(0, 3).map((id) => (
                  <span
                    key={id}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider border border-white/10 text-white/40"
                  >
                    {getGenreName(id)}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.p
              variants={childVariants}
              className="text-white/50 leading-relaxed text-sm md:text-base mb-8 line-clamp-4"
            >
              {movie.overview || 'No description available.'}
            </motion.p>

            <motion.div variants={childVariants}>
              <button
                onClick={() => setSelectedMovie(movie)}
                data-cursor-magnetic
                className="flex items-center gap-3 px-8 py-4 bg-cinema-accent hover:bg-red-600 rounded-xl font-display text-xl tracking-wider transition-all box-glow-accent group"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="group-hover:scale-110 transition-transform"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                READ MORE
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        {movies.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setCurrentIdx(i)}
            data-cursor-magnetic
            className="absolute bottom-0 left-0 h-full transition-all duration-300"
            style={{
              width: `${100 / movies.length}%`,
              left: `${(i * 100) / movies.length}%`,
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-white/10" />
              {i === currentIdx && (
                <motion.div
                  key={currentIdx}
                  className="absolute inset-0 bg-cinema-accent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_ROTATE_MS / 1000, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
