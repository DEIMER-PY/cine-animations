import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, ArrowRight, Bookmark, Play, Star } from 'lucide-react';
import { getCinemaMovies } from '../api/cinema';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';

gsap.registerPlugin(ScrollTrigger);

function RailCard({ movie, rank }) {
  const queued = useStore((state) => state.isInWatchlist(movie.id));
  const add = useStore((state) => state.addToWatchlist);
  const remove = useStore((state) => state.removeFromWatchlist);
  const openTrailer = useStore((state) => state.openTrailer);
  return <article className="discovery-card">
    <Link to={`/pelicula/${movie.id}`}><img src={TMDB.backdrop(movie.backdrop_path, 'w780')} alt={`Escena de ${movie.title}`} loading="lazy" /><span className="discovery-card__shade" />{rank && <b className="discovery-card__rank">{rank}</b>}<div className="discovery-card__copy"><span>{movie.release_date?.slice(0, 4) || 'PRÓXIMO'} · ★ {Number(movie.vote_average || 0).toFixed(1)}</span><strong>{movie.title}</strong><small>{movie.genres?.slice(0, 2).map((genre) => genre.name).join(' · ') || 'SELECCIÓN CINE'}</small></div></Link>
    <div className="discovery-card__actions"><button onClick={() => openTrailer(movie)} aria-label={`Ver trailer de ${movie.title}`}><Play size={13} fill="currentColor" /></button><button className={queued ? 'is-active' : ''} onClick={() => queued ? remove(movie.id) : add(movie)} aria-label={queued ? `Quitar ${movie.title} de ver más tarde` : `Añadir ${movie.title} a ver más tarde`}><Bookmark size={13} fill={queued ? 'currentColor' : 'none'} /></button></div>
  </article>;
}

function Rail({ title, eyebrow, movies, ranked = false }) {
  const railRef = useRef(null);
  const move = (direction) => { const rail = railRef.current; if (!rail) return; gsap.to(rail, { scrollLeft: rail.scrollLeft + direction * Math.min(rail.clientWidth * .82, 920), duration: .85, ease: 'power3.inOut', overwrite: true }); };
  return <section className="discovery-rail"><header><div><p>{eyebrow}</p><h3>{title}</h3></div><div><button onClick={() => move(-1)} aria-label={`Desplazar ${title} a la izquierda`}><ArrowLeft size={16} /></button><button onClick={() => move(1)} aria-label={`Desplazar ${title} a la derecha`}><ArrowRight size={16} /></button></div></header><div ref={railRef} className="discovery-rail__track">{movies.map((movie, index) => <RailCard key={`${title}-${movie.id}`} movie={movie} rank={ranked ? index + 1 : null} />)}</div></section>;
}

export default function DiscoveryRails({ seedMovies = [] }) {
  const rootRef = useRef(null);
  const favorites = useStore((state) => state.favorites);
  const history = useStore((state) => state.history);
  const [catalog, setCatalog] = useState({ popular: seedMovies, top: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getCinemaMovies('popular', 16), getCinemaMovies('topRated', 16), getCinemaMovies('upcoming', 16)]).then(([popular, top, upcoming]) => { if (active) setCatalog({ popular, top, upcoming }); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const personalized = useMemo(() => {
    const source = favorites[0] || history[0];
    const genreIds = new Set(source?.genre_ids || source?.genres?.map((genre) => genre.id) || []);
    const pool = [...catalog.popular, ...catalog.top];
    const unique = [...new Map(pool.map((movie) => [movie.id, movie])).values()];
    const matched = genreIds.size ? unique.filter((movie) => (movie.genre_ids || movie.genres?.map((genre) => genre.id) || []).some((id) => genreIds.has(id))) : [];
    return { source, movies: (matched.length >= 5 ? matched : unique).filter((movie) => String(movie.id) !== String(source?.id)).slice(0, 14) };
  }, [catalog, favorites, history]);

  useEffect(() => {
    if (loading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      ScrollTrigger.batch('.discovery-card', { start: 'top 88%', once: true, interval: .08, batchMax: 5, onEnter: (cards) => gsap.fromTo(cards, { autoAlpha: 0, y: 48, rotationY: -7 }, { autoAlpha: 1, y: 0, rotationY: 0, duration: .9, stagger: .08, ease: 'power3.out', overwrite: true }) });
      gsap.utils.toArray('.discovery-rail header').forEach((header) => gsap.from(header, { x: -40, autoAlpha: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: header, start: 'top 88%', once: true } }));
      ScrollTrigger.refresh();
    }, rootRef);
    return () => context.revert();
  }, [loading]);

  if (loading) return <section className="discovery-skeleton" aria-label="Cargando recomendaciones">{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</section>;
  return <div ref={rootRef} className="discovery-hub">
    {history.length > 0 && <Rail eyebrow="TU HISTORIAL" title="Continúa explorando" movies={history.slice(0, 12)} />}
    <Rail eyebrow="TOP CINE ANIMATIONS" title="Las más buscadas esta semana" movies={catalog.popular.slice(0, 10)} ranked />
    <Rail eyebrow={personalized.source ? `PORQUE GUARDASTE ${personalized.source.title}` : 'UNA SELECCIÓN PARA TI'} title="Creemos que te pueden gustar" movies={personalized.movies} />
    <Rail eyebrow="VALORACIÓN DE LA COMUNIDAD" title="Aclamadas por la crítica" movies={catalog.top} />
    <Rail eyebrow="PRÓXIMAMENTE EN BOGOTÁ" title="Ponlas en tu radar" movies={catalog.upcoming} />
    <div className="discovery-hub__more"><Star size={16} fill="currentColor" /><p>Las recomendaciones se adaptan con tus favoritos, tu lista y las películas que exploras.</p><Link to="/cartelera">ABRIR CATÁLOGO COMPLETO <ArrowRight size={15} /></Link></div>
  </div>;
}
