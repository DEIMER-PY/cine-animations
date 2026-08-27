import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';

function PlayButton() {
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <div className="absolute inset-0 rounded-full bg-cinema-accent/20 animate-pulse" />
      <div className="absolute inset-1 rounded-full bg-cinema-accent/30 animate-pulse" style={{ animationDelay: '0.3s' }} />
      <div className="relative w-12 h-12 rounded-full bg-cinema-accent flex items-center justify-center shadow-lg shadow-cinema-accent/40">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

function GalleryCard({ movie, index, isFeatured }) {
  const setSelectedMovie = useStore((s) => s.setSelectedMovie);
  const [hovered, setHovered] = useState(false);

  if (!movie?.backdrop_path) return null;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, delay: index * 0.08, ease: 'easeOut' },
        },
      }}
      className={`relative group cursor-pointer overflow-hidden rounded-2xl ${
        isFeatured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setSelectedMovie(movie)}
      data-cursor-magnetic
    >
      <div
        className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
          hovered ? 'ring-2 ring-cinema-accent shadow-[0_0_30px_rgba(229,9,20,0.2)]' : ''
        }`}
        style={{
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        <div className={`${isFeatured ? 'aspect-video' : 'aspect-[16/10]'}`}>
          <img
            src={TMDB.backdrop(movie.backdrop_path, isFeatured ? 'original' : 'w780')}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
            loading="lazy"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/20 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/40 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <PlayButton />
        </div>

        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg glass-panel-tight flex items-center gap-1">
          <span className="text-cinema-accent text-xs">★</span>
          <span className="font-mono text-xs text-cinema-gold">{movie.vote_average?.toFixed(1)}</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          <h3
            className={`font-display tracking-wider leading-none mb-1 transition-colors duration-300 ${
              isFeatured ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
            } ${hovered ? 'text-cinema-accent' : 'text-white'}`}
          >
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs font-mono text-white/40">
            <span>{movie.release_date?.split('-')[0]}</span>
            <span className="text-white/20">•</span>
            <span>{movie.original_language?.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function VideoGallery() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    TMDB.fetchNowPlaying()
      .then((data) => setMovies(data.filter((m) => m.backdrop_path).slice(0, 7)))
      .catch(() => {});
  }, []);

  if (movies.length === 0) return null;

  const featured = movies[0];
  const rest = movies.slice(1);

  return (
    <section className="relative w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-20 md:py-28">
      <div className="flex items-center gap-4 mb-12">
        <div className="flex flex-col items-center gap-1">
          <div className="w-[2px] h-3 bg-cinema-accent" />
          <div className="w-[2px] h-3 bg-cinema-gold" />
        </div>
        <h2 className="font-display text-5xl md:text-7xl tracking-wider text-glow-accent">
          NOW PLAYING
        </h2>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-cinema-accent/40 via-cinema-gold/20 to-transparent ml-4" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
      >
        <GalleryCard movie={featured} index={0} isFeatured />

        {rest.map((movie, i) => (
          <GalleryCard key={movie.id} movie={movie} index={i + 1} isFeatured={false} />
        ))}
      </motion.div>
    </section>
  );
}
