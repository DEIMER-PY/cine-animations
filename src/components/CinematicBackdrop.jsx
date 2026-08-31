import { TMDB } from '../api/tmdb';

/** Legacy sections also use photographic backgrounds, never embedded players. */
export default function CinematicBackdrop({ backdropPath, intensity = .82 }) {
  return <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {backdropPath && <img src={TMDB.backdrop(backdropPath, 'w1280')} alt="" className="absolute inset-0 w-full h-full object-cover" />}
    <div className="absolute inset-0 bg-cinema-black" style={{ opacity: intensity }} />
  </div>;
}
