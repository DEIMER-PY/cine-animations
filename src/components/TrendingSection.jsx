import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';
import { useGenres } from '../hooks/useMovies';

function TrendingCard({ movie, index }) {
  const setSelectedMovie = useStore((s) => s.setSelectedMovie);
  const { getGenreName } = useGenres();
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  if (!movie?.poster_path) return null;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: 40 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.5, delay: index * 0.07, ease: 'easeOut' },
        },
      }}
      className="flex-none w-[200px] md:w-[240px] lg:w-[260px] snap-center"
    >
      <div
        ref={cardRef}
        className="relative cursor-pointer group"
        style={{
          perspective: '800px',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => setSelectedMovie(movie)}
        data-cursor-magnetic
      >
        <div
          className="relative rounded-2xl overflow-hidden transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.05 : 1})`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="glass-panel overflow-hidden">
            <div className="relative aspect-[2/3]">
              <img
                src={TMDB.poster(movie.poster_path, 'w342')}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-500"
                style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/20 to-transparent" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: 'inset 0 0 40px rgba(229, 9, 20, 0.15), 0 0 30px rgba(229, 9, 20, 0.1)',
                }}
              />
            </div>

            <div className="p-3 md:p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={12} className="text-cinema-accent fill-cinema-accent" />
                <span className="font-mono text-xs text-cinema-gold">{movie.vote_average?.toFixed(1)}</span>
                <span className="text-white/15 ml-auto text-[10px] font-mono">{movie.release_date?.split('-')[0]}</span>
              </div>

              <h3 className="font-display text-lg md:text-xl tracking-wider leading-tight mb-2 line-clamp-2 group-hover:text-cinema-accent transition-colors">
                {movie.title}
              </h3>

              <div className="flex flex-wrap gap-1">
                {movie.genre_ids?.slice(0, 2).map((id) => (
                  <span
                    key={id}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider border border-white/8 text-white/30"
                  >
                    {getGenreName(id)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TrendingSection() {
  const scrollRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    TMDB.fetchTrending()
      .then((data) => setMovies(data.filter((m) => m.poster_path).slice(0, 15)))
      .catch(() => {});
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [movies]);

  const scrollBy = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > *')?.offsetWidth || 260;
    el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
  };

  if (movies.length === 0) return null;

  return (
    <section className="relative w-full py-20 md:py-28">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 mb-10">
        <div className="flex items-end gap-4">
          <div>
            <span className="font-mono text-[10px] text-cinema-gray/50 tracking-[0.3em] block mb-2">
              CURATED FOR YOU
            </span>
            <h2 className="font-display text-5xl md:text-7xl tracking-wider text-glow-accent relative inline-block">
              TRENDING NOW
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-cinema-accent via-cinema-gold to-transparent origin-left"
              />
            </h2>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canScrollLeft}
              data-cursor-magnetic
              className={`w-10 h-10 rounded-xl glass-panel-tight flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'text-white/60 hover:text-white hover:bg-cinema-accent/20 hover:border-cinema-accent/30'
                  : 'text-white/10 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canScrollRight}
              data-cursor-magnetic
              className={`w-10 h-10 rounded-xl glass-panel-tight flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'text-white/60 hover:text-white hover:bg-cinema-accent/20 hover:border-cinema-accent/30'
                  : 'text-white/10 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        <div
          ref={scrollRef}
          className="flex gap-4 px-4 md:px-8 lg:px-16 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {movies.map((movie, i) => (
            <TrendingCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
