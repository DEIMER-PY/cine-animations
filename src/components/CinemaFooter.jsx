import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Ticket } from 'lucide-react';

export default function CinemaFooter() {
  return <footer className="cinema-footer-pro">
    <div className="cinema-footer-pro__marquee" aria-hidden="true"><span>LA PANTALLA TE ESPERA · BOGOTÁ · CLASSIC · DOLBY ATMOS · IMAX LASER · </span><span>LA PANTALLA TE ESPERA · BOGOTÁ · CLASSIC · DOLBY ATMOS · IMAX LASER · </span></div>
    <div className="cinema-footer-pro__body">
      <div className="cinema-footer-pro__brand"><Link to="/" className="cinema-wordmark"><strong>CINE</strong><small>ANIMATIONS</small></Link><p>Un cine independiente diseñado para que elegir, reservar y recordar una película también sea parte de la función.</p><Link to="/cartelera" className="button-primary"><Ticket size={15} />COMPRAR ENTRADAS</Link></div>
      <nav aria-label="Explorar el cine"><span>EXPLORAR</span><Link to="/cartelera">Cartelera <ArrowRight size={12} /></Link><Link to="/cartelera?tab=proximamente">Próximamente <ArrowRight size={12} /></Link><Link to="/experiencias">Experiencias <ArrowRight size={12} /></Link><Link to="/cuenta">Mi archivo <ArrowRight size={12} /></Link></nav>
      <div className="cinema-footer-pro__visit"><span>VISÍTANOS</span><p><MapPin size={14} />Distrito Creativo<br />Bogotá, Colombia</p><p>Todos los días<br />11:00 — 23:30</p><a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>INSTAGRAM</a></div>
    </div>
    <div className="cinema-footer-pro__base"><span>© 2026 CINE ANIMATIONS</span><span>AMERICA/BOGOTA · COP</span><span>HECHO PARA LA PANTALLA GRANDE</span></div>
  </footer>;
}
