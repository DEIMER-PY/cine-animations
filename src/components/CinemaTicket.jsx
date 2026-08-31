import { CalendarDays, Ticket } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { TMDB } from '../api/tmdb';
import { formatCinemaDate, formatCinemaTime, formatCOP } from '../data/cinema';

export default function CinemaTicket({ showing = {}, seatIds = [], total, reference = 'HOLD ACTIVO', operation = 'reservation', compact = false }) {
  const root = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      gsap.timeline().from(root.current, { rotationX: -18, y: 35, autoAlpha: 0, duration: .55, ease: 'power3.out' }).from('.cinema-ticket__stub', { rotationY: -85, autoAlpha: .2, duration: .55, ease: 'power3.out' }, .2);
    }, root);
    return () => context.revert();
  }, [reference]);
  const movie = showing.movie || showing.Pelicula || {};
  const title = movie.title || movie.titulo || 'FUNCIÓN CINE ANIMATIONS';
  const poster = movie.poster_path || movie.posterUrl;
  return <article ref={root} className={`cinema-ticket ${compact ? 'cinema-ticket--compact' : ''}`}>
    <div className="cinema-ticket__main">{poster && <img src={TMDB.poster(poster, 'w342')} alt="" />}
      <div><span className="cinema-ticket__eyebrow">{operation === 'reservation' ? 'RESERVA' : 'COMPRA DEMO'} · CINE BOGOTÁ</span><h2>{title}</h2><p><CalendarDays size={13} />{showing.starts_at ? `${formatCinemaDate(showing.starts_at)} · ${formatCinemaTime(showing.starts_at)}` : 'FUNCIÓN CONFIRMADA'}</p><dl><div><dt>SALA</dt><dd>{showing.room || showing.cinema_rooms?.name || 'SALA PRINCIPAL'}</dd></div><div><dt>FORMATO</dt><dd>{showing.formatLabel || showing.format || 'CLASSIC'}</dd></div><div><dt>ASIENTOS</dt><dd>{seatIds.join(' · ') || 'POR CONFIRMAR'}</dd></div></dl></div>
    </div>
    <div className="cinema-ticket__stub"><Ticket size={24} /><span>REFERENCIA</span><strong>{reference}</strong>{total != null && <b>{formatCOP(total)}</b>}<i aria-hidden="true" /></div>
  </article>;
}
