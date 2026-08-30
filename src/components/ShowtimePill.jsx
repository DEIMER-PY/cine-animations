import { Link } from 'react-router-dom';
import { formatCinemaTime, formatCOP } from '../data/cinema';

export default function ShowtimePill({ showing, compact = false }) {
  return <Link to={`/funcion/${showing.id}/asientos`} className={`showtime-pill ${compact ? 'showtime-pill--compact' : ''}`}>
    <span className="showtime-pill__time">{formatCinemaTime(showing.starts_at)}</span>
    <span>{showing.formatLabel || showing.format}</span><small>{showing.language}</small>
    {!compact && <><strong>{formatCOP(showing.price)}</strong><small className="showtime-pill__availability">{showing.available_count ?? '—'} disponibles</small></>}
  </Link>;
}
