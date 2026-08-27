import { useEffect, useState } from 'react';
import { TMDB } from '../api/tmdb';

const TOKEN = import.meta.env.VITE_TMDB_TOKEN;

const ROW_CONFIGS = [
  { height: '250px', speed: 60, direction: 1 },
  { height: '200px', speed: 45, direction: -1 },
  { height: '180px', speed: 70, direction: 1 },
];

function ScrollingRow({ movies, config, rowIndex }) {
  const count = 18;
  const repeated = Array.from({ length: count }, (_, i) => movies[i % movies.length]);
  const track = [...repeated, ...repeated];
  const dirName = config.direction > 0 ? 'Right' : 'Left';

  return (
    <div className="relative w-full overflow-hidden group/row">
      <div
        className={`flex gap-3 items-center w-max`}
        style={{
          height: config.height,
          animation: `movieScroll${dirName} ${config.speed}s linear infinite`,
        }}
      >
        {track.map((movie, i) => (
          <div
            key={`${movie.id}-${rowIndex}-${i}`}
            className="shrink-0 relative rounded-lg overflow-hidden cursor-pointer group/card hover:z-10"
            style={{ width: '380px', height: config.height }}
          >
            <img
              src={TMDB.backdrop(movie.backdrop_path, 'w780')}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-cinema-black/30 group-hover/card:bg-transparent transition-colors duration-300" />

            <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
              <p className="font-display text-sm md:text-base text-white tracking-wider truncate">
                {movie.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-cinema-gold text-xs font-mono">
                  ★ {movie.vote_average?.toFixed(1)}
                </span>
                <span className="text-white/30 text-xs font-mono">
                  {movie.release_date?.split('-')[0]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MovieFrames() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.themoviedb.org/3/trending/movie/week', {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json;charset=utf-8',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`TMDB ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMovies(data.results.filter((m) => m.backdrop_path));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="relative w-full py-8 space-y-4 overflow-hidden">
        {ROW_CONFIGS.map((config, i) => (
          <div key={i} className="flex gap-3" style={{ height: config.height }}>
            {Array.from({ length: 8 }).map((__, j) => (
              <div
                key={j}
                className="shrink-0 w-[380px] h-full bg-white/5 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ))}
      </section>
    );
  }

  if (!movies.length) return null;

  return (
    <section className="relative w-full py-12 space-y-4 overflow-hidden">
      <style>{`
        @keyframes movieScrollRight {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes movieScrollLeft {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .movie-frames-row:hover > div {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="absolute inset-y-0 left-0 w-32 md:w-48 z-20 bg-gradient-to-r from-cinema-black to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 md:w-48 z-20 bg-gradient-to-l from-cinema-black to-transparent pointer-events-none" />

      {ROW_CONFIGS.map((config, i) => (
        <div key={i} className="movie-frames-row">
          <ScrollingRow movies={movies} config={config} rowIndex={i} />
        </div>
      ))}
    </section>
  );
}
