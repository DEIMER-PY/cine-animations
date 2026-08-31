import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Film, Heart, Home, LogIn, Menu, Search, Ticket, Tv, UserRound, UsersRound, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchPalette from './SearchPalette';

const links = [
  { to: '/cartelera', label: 'Cartelera', eyebrow: 'EN PANTALLA', title: 'Funciones de hoy', items: ['Classic desde $24.000', 'Dolby Atmos desde $34.000', 'IMAX Laser desde $42.000'] },
  { to: '/cartelera?tab=proximamente', label: 'Próximamente', eyebrow: 'PREPARA TU AGENDA', title: 'Lo siguiente se acerca', items: ['Estrenos de la semana', 'Preventa seleccionada', 'Recordatorios en tu archivo'] },
  { to: '/experiencias', label: 'Experiencias', eyebrow: 'TRES FORMAS DE VER', title: 'La sala también narra', items: ['Classic', 'Dolby Atmos', 'IMAX Laser'] },
  { to: '/series', label: 'Series', eyebrow: 'OTRO EPISODIO', title: 'Historias que continúan', items: ['Tendencias semanales', 'Mejor valoradas', 'Ahora en emisión'] },
  { to: '/personas', label: 'Personas', eyebrow: 'TALENTO EN MOVIMIENTO', title: 'Quienes hacen el cine', items: ['Actores en tendencia', 'Dirección y creación', 'Biografías y filmografías'] },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const user = useStore((state) => state.user);
  const favorites = useStore((state) => state.favorites);
  const watchlist = useStore((state) => state.watchlist);
  const seriesWatchlist = useStore((state) => state.seriesWatchlist);
  const collectionCount = favorites.length + watchlist.length + seriesWatchlist.length;

  useEffect(() => { const update = () => setScrolled(window.scrollY > 28); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, []);
  useEffect(() => { setOpen(false); setSearchOpen(false); setHovered(null); }, [location.pathname, location.search]);
  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); setHovered(null); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  useEffect(() => { const shortcut = (event) => { const isTyping = /input|textarea|select/i.test(event.target.tagName); const opensSlash = event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey; const opensCommand = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'; if (opensSlash || opensCommand) { event.preventDefault(); setSearchOpen(true); } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut); }, []);

  return <>
    <motion.header initial={{ y: -90 }} animate={{ y: 0 }} className={`cinema-nav ${scrolled ? 'cinema-nav--solid' : ''}`} onMouseLeave={() => setHovered(null)}>
      <button className="cinema-nav__menu" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu size={19} /><span>MENÚ</span></button>
      <nav className="cinema-nav__links" aria-label="Navegación principal">{links.map((item) => { const active = location.pathname === item.to.split('?')[0] && (item.label === 'Próximamente' ? location.search.includes('tab=proximamente') : item.label === 'Cartelera' ? !location.search.includes('tab=proximamente') : true); return <Link key={item.to} to={item.to} onMouseEnter={() => setHovered(item)} onFocus={() => setHovered(item)} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : ''}>{item.label}</Link>; })}</nav>
      <Link to="/" className="cinema-wordmark" aria-label="CINE ANIMATIONS inicio"><strong>CINE</strong><small>ANIMATIONS</small></Link>
      <div className="cinema-nav__actions">
        <button onClick={() => setSearchOpen(true)} aria-label="Buscar películas, series, personas o géneros"><Search size={18} /></button>
        <Link to="/cuenta" aria-label="Colección y ver más tarde" className="relative"><Heart size={18} />{collectionCount > 0 && <span className="nav-badge">{collectionCount}</span>}</Link>
        <Link to={user ? '/cuenta' : `/acceso?returnTo=${encodeURIComponent(location.pathname)}`} aria-label={user ? 'Mi cuenta' : 'Iniciar sesión'}>{user ? <UserRound size={18} /> : <LogIn size={18} />}</Link>
        <Link to="/cartelera" className="cinema-ticket-cta" aria-label="Comprar entradas"><Ticket size={15} /><span>COMPRAR ENTRADAS</span></Link>
      </div>
      <AnimatePresence>{hovered && <motion.div className="cinema-mega" initial={{ opacity: 0, y: -12, clipPath: 'inset(0 0 100% 0)' }} animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }} exit={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: .35, ease: [0.22, 1, 0.36, 1] }}><div><span>{hovered.eyebrow}</span><strong>{hovered.title}</strong></div><ul>{hovered.items.map((item) => <li key={item}>{item}</li>)}</ul><Link to={hovered.to}>EXPLORAR SECCIÓN →</Link></motion.div>}</AnimatePresence>
    </motion.header>
    <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    <nav className="cinema-mobile-dock" aria-label="Accesos rápidos">
      <NavLink to="/"><Home size={18} /><span>Inicio</span></NavLink>
      <NavLink to="/cartelera"><Film size={18} /><span>Cartelera</span></NavLink>
      <NavLink to="/series"><Tv size={18} /><span>Series</span></NavLink>
      <button type="button" onClick={() => setSearchOpen(true)}><Search size={18} /><span>Buscar</span></button>
      <NavLink to="/personas"><UsersRound size={18} /><span>Personas</span></NavLink>
      <NavLink to="/cuenta"><Heart size={18} /><span>Mi lista</span>{collectionCount > 0 && <b>{collectionCount}</b>}</NavLink>
    </nav>
    <AnimatePresence>{open && <motion.div className="cinema-menu" initial={{ clipPath: 'circle(0% at 24px 24px)' }} animate={{ clipPath: 'circle(150% at 24px 24px)' }} exit={{ clipPath: 'circle(0% at 24px 24px)' }} transition={{ duration: .75, ease: [0.76, 0, 0.24, 1] }}>
      <div className="cinema-menu__top"><span className="font-mono text-[10px] tracking-[.35em] text-white/35">CINE ANIMATIONS · BOGOTÁ</span><button onClick={() => setOpen(false)} aria-label="Cerrar menú"><X size={24} /></button></div>
      <div className="cinema-menu__body"><motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .12 }}><button type="button" className="cinema-menu__search" onClick={() => { setOpen(false); setSearchOpen(true); }}><Search size={26} /><span>BUSCAR PELÍCULAS, SERIES, PERSONAS Y GÉNEROS</span></button></motion.div>{[{ to: '/', label: 'Inicio' }, ...links, { to: '/cuenta', label: 'Mi archivo' }, { to: '/acceso', label: 'Acceso' }].map(({ to, label }, index) => <motion.div key={to} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .18 + index * .06 }}><Link to={to}><span>{String(index + 1).padStart(2, '0')}</span>{label}</Link></motion.div>)}</div>
      <div className="cinema-menu__footer"><p>Distrito Creativo<br />Bogotá, Colombia</p><p>CLASSIC · DOLBY ATMOS · IMAX LASER</p></div>
    </motion.div>}</AnimatePresence>
  </>;
}
