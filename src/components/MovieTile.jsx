import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bookmark, Heart, Star } from 'lucide-react';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';

export default function MovieTile({ movie, index = 0, showFavorite = true }) {
  const isFavorite = useStore((state) => state.isFavorite(movie.id));
  const addFavorite = useStore((state) => state.addFavorite);
  const removeFavorite = useStore((state) => state.removeFavorite);
  const queued = useStore((state) => state.isInWatchlist(movie.id));
  const addToWatchlist = useStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);
  return <motion.article className="movie-tile" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10%' }} transition={{ delay: Math.min(index * .06, .24) }}>
    <Link to={`/pelicula/${movie.id}`} className="movie-tile__image">
      <img src={TMDB.poster(movie.poster_path, 'w500')} srcSet={`${TMDB.poster(movie.poster_path, 'w342')} 342w, ${TMDB.poster(movie.poster_path, 'w500')} 500w`} sizes="(max-width: 768px) 46vw, 24vw" alt={`Póster de ${movie.title}`} loading="lazy" />
      <div className="movie-tile__scrim" /><span className="movie-tile__open"><ArrowUpRight size={18} /></span>
      <div className="movie-tile__meta"><span>{movie.certification || '12+'}</span><span><Star size={12} fill="currentColor" />{Number(movie.vote_average || 0).toFixed(1)}</span></div>
    </Link>
    <div className="movie-tile__copy"><div><h3>{movie.title}</h3><p>{movie.genres?.[0]?.name || 'Cine'} · {movie.release_date?.slice(0, 4)}</p></div>{showFavorite && <div className="movie-tile__collection"><button onClick={() => queued ? removeFromWatchlist(movie.id) : addToWatchlist(movie)} className={queued ? 'is-queued' : ''} aria-label={queued ? 'Quitar de ver más tarde' : 'Agregar a ver más tarde'}><Bookmark size={17} fill={queued ? 'currentColor' : 'none'} /></button><button onClick={() => isFavorite ? removeFavorite(movie.id) : addFavorite(movie)} className={isFavorite ? 'is-favorite' : ''} aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /></button></div>}</div>
  </motion.article>;
}
