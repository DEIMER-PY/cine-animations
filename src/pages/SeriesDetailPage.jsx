import ProjectionLoader from '../components/ProjectionLoader';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Bookmark, CalendarDays, Play, Star, Tv } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Catalog } from '../api/catalog';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';
import SeriesCard from '../components/SeriesCard';
import CinemaFooter from '../components/CinemaFooter';

export default function SeriesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [series, setSeries] = useState(null);
  const [error, setError] = useState('');
  const openTrailer = useStore((state) => state.openTrailer);
  const saved = useStore((state) => state.seriesWatchlist.some((item) => String(item.id) === String(id)));
  const add = useStore((state) => state.addSeriesToWatchlist);
  const remove = useStore((state) => state.removeSeriesFromWatchlist);
  useEffect(() => { let active = true; Catalog.fetchSeriesDetails(id).then((data) => active && setSeries(data)).catch(() => active && setError('No pudimos recuperar esta serie.')); return () => { active = false; }; }, [id]);
  useEffect(() => { if (!series) return undefined; const context = gsap.context(() => { gsap.from('.series-detail__poster', { rotationY: -18, x: -70, autoAlpha: 0, duration: 1, ease: 'power4.out' }); gsap.from('.series-detail__copy > *', { y: 35, autoAlpha: 0, stagger: .07, duration: .75 }); }, rootRef); return () => context.revert(); }, [series]);
  const certification = useMemo(() => series?.content_ratings?.results?.find((item) => item.iso_3166_1 === 'CO')?.rating || series?.content_ratings?.results?.find((item) => item.iso_3166_1 === 'US')?.rating, [series]);
  if (error) return <div className="cinema-loading"><span>404</span><p>{error}</p><Link to="/series">Volver a series</Link></div>;
  if (!series) return <ProjectionLoader label="Abriendo la temporada" full />;
  const cast = series.credits?.cast?.filter((person) => person.profile_path).slice(0, 10) || [];
  const similar = (series.similar?.results || []).filter((item) => item.poster_path).slice(0, 8).map((item) => ({ ...item, title: item.name, release_date: item.first_air_date, media_type: 'tv' }));
  return <div ref={rootRef} className="series-detail">
    <button className="series-detail__back" onClick={() => navigate(-1)}><ArrowLeft size={15} />VOLVER</button>
    <section className="series-detail__hero"><img className="series-detail__backdrop" src={TMDB.backdrop(series.backdrop_path, 'original')} alt="" /><div className="series-detail__shade" /><div className="series-detail__poster"><img src={TMDB.poster(series.poster_path, 'w500')} alt={`Póster de ${series.title}`} /></div><div className="series-detail__copy"><p>SERIE · {series.status?.toUpperCase() || 'TMDB'}</p><h1>{series.title}</h1><div className="series-detail__facts"><span><Star size={14} fill="currentColor" />{series.vote_average.toFixed(1)}</span><span><CalendarDays size={14} />{series.first_air_date?.slice(0, 4)}</span><span><Tv size={14} />{series.number_of_seasons || 0} temporada{series.number_of_seasons === 1 ? '' : 's'}</span>{certification && <span>{certification}</span>}</div><p className="series-detail__overview">{series.overview || 'Sin sinopsis disponible en español.'}</p><div className="series-detail__actions"><button className="button-primary" onClick={(event) => openTrailer(series, { mediaType: 'tv', originRect: event.currentTarget.getBoundingClientRect() })}><Play size={16} />VER TRAILER</button><button className={`button-ghost ${saved ? 'is-active' : ''}`} onClick={() => saved ? remove(series.id) : add(series)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'EN MI LISTA' : 'GUARDAR SERIE'}</button></div></div></section>
    <section className="season-index"><header><p>GUÍA DE TEMPORADAS</p><h2>EL MAPA DE<br /><em>LA HISTORIA.</em></h2></header><div>{(series.seasons || []).filter((season) => season.season_number > 0).map((season) => <article key={season.id}>{season.poster_path ? <img src={TMDB.poster(season.poster_path, 'w342')} alt="" loading="lazy" /> : <span /> }<div><small>TEMPORADA {String(season.season_number).padStart(2, '0')}</small><h3>{season.name}</h3><p>{season.episode_count} episodios · {season.air_date?.slice(0, 4) || 'Sin fecha'}</p></div></article>)}</div></section>
    <section className="series-cast"><header><p>REPARTO PRINCIPAL</p><h2>ROSTROS DE LA SERIE</h2></header><div>{cast.map((person) => <Link to={`/persona/${person.id}`} key={person.id}><img src={TMDB.profile(person.profile_path, 'w185')} alt={`Retrato de ${person.name}`} loading="lazy" /><strong>{person.name}</strong><span>{person.character}</span></Link>)}</div></section>
    {similar.length > 0 && <section className="series-similar"><header><p>DESPUÉS DE ESTA</p><h2>TAMBIÉN PODRÍA ATRAPARTE</h2></header><div>{similar.map((item) => <SeriesCard key={item.id} series={item} />)}</div></section>}
    <CinemaFooter />
  </div>;
}
