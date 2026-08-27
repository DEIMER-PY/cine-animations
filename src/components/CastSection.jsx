import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';
import { TextScramble } from './animations';

const ImdbIcon = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M22.109 12.738c0 3.977-3.217 7.197-7.183 7.197s-7.183-3.22-7.183-7.197c0-3.977 3.217-7.197 7.183-7.197s7.183 3.22 7.183 7.197zm-3.225.024c0-2.17-1.77-3.93-3.958-3.93s-3.958 1.76-3.958 3.93c0 2.17 1.77 3.93 3.958 3.93s3.958-1.76 3.958-3.93zM4.836 2.451v19.098h3.045v-19.1H4.836zM14.39 2.451l-5.16 13.206h.002L9.22 2.451H5.981l6.738 16.643.004-.005.007.016h3.035l2.755-7.08 2.808 7.08h3.092l-4.32-9.938 4.492-9.705h-3.185l-2.54 6.238-2.008-6.238h-2.468z" />
  </svg>
);

function SkeletonCard() {
  return (
    <div className="glass-panel flex-shrink-0 w-[280px] h-[420px] rounded-2xl overflow-hidden border border-white/5">
      <div className="w-full h-[280px] bg-white/5 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse" />
        <div className="flex gap-2 mt-4">
          <div className="h-6 w-16 bg-white/5 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-3 pt-2 opacity-0">
          <div className="h-4 w-4 rounded bg-white/10" />
          <div className="h-4 w-4 rounded bg-white/10" />
          <div className="h-4 w-4 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function CastSection() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const setSelectedMovie = useStore((s) => s.setSelectedMovie);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const trendingRes = await fetch(
          'https://api.themoviedb.org/3/trending/movie/week',
          {
            headers: {
              Authorization: 'Bearer ' + import.meta.env.VITE_TMDB_TOKEN,
            },
          }
        );

        if (!trendingRes.ok) throw new Error('Failed to fetch trending movies');

        const trendingData = await trendingRes.json();
        const topMovies = trendingData.results.slice(0, 3);

        const creditsResults = await Promise.all(
          topMovies.map((movie) =>
            fetch(
              `https://api.themoviedb.org/3/movie/${movie.id}?append_to_response=credits`,
              {
                headers: {
                  Authorization:
                    'Bearer ' + import.meta.env.VITE_TMDB_TOKEN,
                },
              }
            ).then((r) => {
              if (!r.ok) throw new Error('Failed to fetch credits');
              return r.json();
            })
          )
        );

        if (cancelled) return;

        const seenIds = new Set();
        const uniqueActors = [];

        for (const movieData of creditsResults) {
          const movieTitle = movieData.title || movieData.original_title;
          const movieId = movieData.id;
          const cast = (movieData.credits && movieData.credits.cast) || [];

          for (const member of cast.slice(0, 8)) {
            if (!seenIds.has(member.id)) {
              seenIds.add(member.id);
              uniqueActors.push({
                id: member.id,
                name: member.name,
                profile_path: member.profile_path,
                known_for_department: member.known_for_department,
                character: member.character,
                movieTitle,
                movieId,
                movie: {
                  id: movieData.id,
                  title: movieData.title,
                  original_title: movieData.original_title,
                  poster_path: movieData.poster_path,
                  backdrop_path: movieData.backdrop_path,
                  overview: movieData.overview,
                  release_date: movieData.release_date,
                  vote_average: movieData.vote_average,
                  vote_count: movieData.vote_count,
                  genres: movieData.genres,
                },
              });
            }
          }
        }

        setActors(uniqueActors);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const handleMovieClick = (movieObj) => {
    if (setSelectedMovie && movieObj) {
      setSelectedMovie(movieObj);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  };

  const departmentColors = {
    Acting: 'bg-[#e50914]/20 text-[#e50914] border-[#e50914]/30',
    Directing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Directing ': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Production: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Writing: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Camera: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    Editing: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    default: 'bg-white/10 text-white/50 border-white/10',
  };

  const getDepartmentColor = (dept) =>
    departmentColors[dept] || departmentColors.default;

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-wider text-white mb-3">
            <TextScramble text="THE ENSEMBLE" delay={0.3} duration={0.8} />
          </h2>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#e50914]" />
            <span className="w-2 h-2 rotate-45 bg-[#e50914]" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#e50914]" />
          </div>
          <p className="font-mono text-sm text-white/40 max-w-md mx-auto">
            Featured talent from this week&apos;s trending films
          </p>
        </motion.div>
      </div>

      <div className="relative group/section">
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#e50914]/80 hover:border-[#e50914]/50 transition-all duration-300 opacity-0 group-hover/section:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#e50914]/80 hover:border-[#e50914]/50 transition-all duration-300 opacity-0 group-hover/section:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>

        {loading ? (
          <div className="flex gap-6 px-6 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="font-mono text-sm text-white/40">
              Failed to load cast data: {error}
            </p>
          </div>
        ) : actors.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="font-mono text-sm text-white/40">
              No cast data available
            </p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-6 px-6 overflow-x-auto scroll-smooth scrollbar-hide"
            style={{
              scrollSnapType: 'x mandatory',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {actors.map((actor, i) => (
              <motion.div
                key={actor.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={cardVariants}
                className="flex-shrink-0 w-[280px] snap-start"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 group/card transition-all duration-300 hover:scale-[1.03] hover:border-[#e50914]/40 hover:shadow-[0_0_30px_rgba(229,9,20,0.15)] h-full flex flex-col">
                  <div className="relative w-full h-[280px] overflow-hidden">
                    {actor.profile_path ? (
                      <img
                        src={TMDB.profile(actor.profile_path)}
                        alt={actor.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <Film className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-3 left-3 right-3">
                      <button
                        onClick={() => handleMovieClick(actor.movie)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e50914]/90 hover:bg-[#e50914] text-white text-[10px] font-mono tracking-wide transition-colors duration-200 cursor-pointer"
                      >
                        <Film size={10} />
                        {actor.movieTitle}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-display text-xl text-white font-semibold leading-tight truncate">
                      {actor.name}
                    </h3>
                    <p className="font-mono text-xs text-white/40 mt-1 truncate italic">
                      as {actor.character || 'Unknown Role'}
                    </p>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${getDepartmentColor(
                          actor.known_for_department
                        )}`}
                      >
                        {actor.known_for_department || 'Entertainment'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-auto pt-4 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                      <a
                        href={`https://www.imdb.com/name/nm${actor.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#f5c518] hover:border-[#f5c518]/30 hover:bg-[#f5c518]/10 transition-all duration-200"
                        aria-label={`${actor.name} on IMDb`}
                      >
                        <ImdbIcon size={14} />
                      </a>
                      <a
                        href={`https://www.instagram.com/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#E1306C] hover:border-[#E1306C]/30 hover:bg-[#E1306C]/10 transition-all duration-200"
                        aria-label={`${actor.name} on Instagram`}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      </a>
                      <a
                        href={`https://twitter.com/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/10 transition-all duration-200"
                        aria-label={`${actor.name} on Twitter`}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
