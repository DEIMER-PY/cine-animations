import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { getCinemaMovies } from '../api/cinema';
import { listShowings } from '../api/booking';
import { formatCinemaDate } from '../data/cinema';
import MovieTile from '../components/MovieTile';
import ShowtimePill from '../components/ShowtimePill';

export default function ShowtimesPage() {
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'cartelera';
  const urlQuery = params.get('q') || '';
  const searchRef = useRef(null);
  const [movies, setMovies] = useState([]); const [showings, setShowings] = useState([]); const [query, setQuery] = useState(params.get('q') || '');
  const [format, setFormat] = useState(params.get('format') || 'ALL'); const [day, setDay] = useState(0);
  const [year, setYear] = useState('ALL'); const [language, setLanguage] = useState('ALL'); const [sort, setSort] = useState('POPULARITY');
  useEffect(() => { let active = true; getCinemaMovies(tab === 'proximamente' ? 'upcoming' : 'nowPlaying', 18).then((items) => { if (!active) return []; setMovies(items); return listShowings({ movies: items }); }).then((items) => { if (active) setShowings(items); }); return () => { active = false; }; }, [tab]);
  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);
  useEffect(() => { if (params.get('focus') === 'search') setTimeout(() => searchRef.current?.focus(), 300); }, [params]);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + index); return date; }), []);
  const years = [...new Set(movies.map((movie) => movie.release_date?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const languages = [...new Set(movies.map((movie) => movie.original_language).filter(Boolean))].sort();
  const dateKey = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const visibleMovies = movies.filter((movie) => {
    const searchable = `${movie.title} ${(movie.genres || []).map((genre) => genre.name).join(' ')}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase()) && (year === 'ALL' || movie.release_date?.startsWith(year)) && (language === 'ALL' || movie.original_language === language);
  }).sort((a, b) => sort === 'RATING' ? Number(b.vote_average || 0) - Number(a.vote_average || 0) : sort === 'RELEASE' ? String(b.release_date || '').localeCompare(String(a.release_date || '')) : Number(b.popularity || 0) - Number(a.popularity || 0));
  return <div className="showtimes-page">
    <header className="page-hero"><p>CINE ANIMATIONS · BOGOTÁ</p><h1>{tab === 'proximamente' ? <>PRÓXIMOS<br /><span>ESTRENOS</span></> : <>LA<br /><span>CARTELERA</span></>}</h1><div className="page-hero__aside"><CalendarDays size={18} /><p>Películas seleccionadas para verse grandes. Funciones todos los días en Classic, Dolby Atmos e IMAX Laser.</p></div></header>
    <div className="schedule-toolbar"><div className="date-strip">{dates.map((date, index) => <button key={date.toISOString()} className={day === index ? 'is-active' : ''} onClick={() => setDay(index)}><span>{index === 0 ? 'HOY' : formatCinemaDate(date).split(' ')[0]}</span><strong>{date.getDate()}</strong></button>)}</div><label className="schedule-search"><Search size={16} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título o género…" /></label><div className="format-filter"><SlidersHorizontal size={15} />{['ALL', 'CLASSIC', 'DOLBY', 'IMAX'].map((item) => <button key={item} className={format === item ? 'is-active' : ''} onClick={() => setFormat(item)}>{item === 'ALL' ? 'TODAS' : item}</button>)}</div><div className="advanced-filters"><label>AÑO<select value={year} onChange={(event) => setYear(event.target.value)}><option value="ALL">TODOS</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label><label>IDIOMA<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="ALL">TODOS</option>{languages.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}</select></label><label>ORDEN<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="POPULARITY">POPULARIDAD</option><option value="RATING">PUNTUACIÓN</option><option value="RELEASE">ESTRENO</option></select></label>{(query || year !== 'ALL' || language !== 'ALL' || format !== 'ALL') && <button className="filters-reset" onClick={() => { setQuery(''); setYear('ALL'); setLanguage('ALL'); setFormat('ALL'); }}>LIMPIAR FILTROS</button>}<span className="result-count">{visibleMovies.length} RESULTADOS</span></div></div>
    <section className="schedule-list">{visibleMovies.length ? visibleMovies.map((movie, index) => { const movieShowings = showings.filter((item) => String(item.tmdb_id) === String(movie.id) && dateKey(new Date(item.starts_at)) === dateKey(dates[day]) && (format === 'ALL' || item.format === format)); return <article className="schedule-row" key={movie.id}><MovieTile movie={movie} index={index} /><div className="schedule-row__info"><p>{movie.genres?.map((genre) => genre.name).join(' · ') || 'CINE'} · {movie.runtime || 120} MIN</p><h2>{movie.title}</h2><p className="schedule-row__summary">{movie.overview}</p><div className="schedule-row__times">{movieShowings.length ? movieShowings.map((showing) => <ShowtimePill key={showing.id} showing={showing} />) : <span className="no-showings">Sin funciones con estos filtros.</span>}</div></div></article>; }) : <div className="catalog-empty"><strong>NO ENCONTRAMOS ESA PELÍCULA</strong><p>Prueba otro título, género, año o idioma.</p><button className="button-ghost" onClick={() => { setQuery(''); setYear('ALL'); setLanguage('ALL'); setFormat('ALL'); }}>VER TODA LA CARTELERA</button></div>}</section>
  </div>;
}
