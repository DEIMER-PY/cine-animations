import { Bookmark, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';
import { useState } from 'react';

export default function SeriesCard({ series, rank }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const saved = useStore((state) => state.seriesWatchlist.some((item) => String(item.id) === String(series.id)));
  const add = useStore((state) => state.addSeriesToWatchlist);
  const remove = useStore((state) => state.removeSeriesFromWatchlist);
  const openTrailer = useStore((state) => state.openTrailer);
  const toggle = async () => {
    setSaving(true); setError('');
    try { if (saved) await remove(series.id); else await add(series); }
    catch { setError('No se pudo sincronizar. Inténtalo de nuevo.'); }
    finally { setSaving(false); }
  };
  return <article className="series-card motion-surface" data-motion="lift">
    <Link to={`/serie/${series.id}`} className="series-card__poster">
      {rank && <b>#{rank}</b>}
      <img src={TMDB.poster(series.poster_path, 'w500')} alt={`Póster de ${series.title}`} loading="lazy" />
      <span><Star size={12} fill="currentColor" />{series.vote_average.toFixed(1)}</span>
    </Link>
    <div className="series-card__copy"><div><small>{series.release_date?.slice(0, 4) || 'EN EMISIÓN'}</small><Link to={`/serie/${series.id}`}>{series.title}</Link></div><div>
      <button onClick={(event) => openTrailer(series, { mediaType: 'tv', originRect: event.currentTarget.getBoundingClientRect() })} aria-label={`Ver trailer de ${series.title}`}><Play size={15} /></button>
      <button disabled={saving} className={saved ? 'is-active' : ''} onClick={toggle} aria-label={saved ? 'Quitar serie de mi lista' : 'Guardar serie en mi lista'}><Bookmark size={15} fill={saved ? 'currentColor' : 'none'} /></button>
    </div></div>{error && <p role="status" className="collection-warning">{error}</p>}
  </article>;
}
