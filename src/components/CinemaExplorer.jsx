import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles, Star, UserRound } from 'lucide-react';
import { TMDB } from '../api/tmdb';

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_GENRES = ['Drama', 'Ciencia ficción', 'Thriller', 'Animación'];

export default function CinemaExplorer({ movies = [] }) {
  const rootRef = useRef(null);
  const [people, setPeople] = useState([]);
  const [peopleState, setPeopleState] = useState('loading');

  useEffect(() => {
    let active = true;
    TMDB.fetchTrendingPeople().then((items) => { if (active) { setPeople(items.filter((person) => person.profile_path).slice(0, 9)); setPeopleState('ready'); } }).catch(() => { if (active) setPeopleState('error'); });
    return () => { active = false; };
  }, []);

  const genres = useMemo(() => {
    const byName = new Map();
    movies.forEach((movie) => (movie.genres || []).forEach((genre) => {
      if (!byName.has(genre.name) && movie.backdrop_path) byName.set(genre.name, movie);
    }));
    return [...byName.entries()].slice(0, 6);
  }, [movies]);

  const metrics = useMemo(() => {
    const rated = movies.filter((movie) => Number(movie.vote_average));
    const average = rated.length ? rated.reduce((sum, movie) => sum + Number(movie.vote_average), 0) / rated.length : 0;
    const votes = movies.reduce((sum, movie) => sum + Number(movie.vote_count || 0), 0);
    return { average, votes };
  }, [movies]);

  useEffect(() => {
    if (!people.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      gsap.from('.talent-card', { x: 70, autoAlpha: 0, rotate: 3, stagger: .07, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.talent-radar', start: 'top 78%', once: true } });
      gsap.from('.genre-window', { y: 55, autoAlpha: 0, scale: .96, stagger: .06, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.genre-explorer', start: 'top 82%', once: true } });
      gsap.from('.cine-pulse__metric', { y: 36, autoAlpha: 0, stagger: .09, duration: .75, scrollTrigger: { trigger: '.cine-pulse', start: 'top 86%', once: true } });
    }, rootRef);
    return () => context.revert();
  }, [people]);

  return <section ref={rootRef} className="cinema-explorer">
    <div className="talent-radar">
      <header className="editorial-heading"><div><p>03 · PERSONAS EN TENDENCIA</p><h2>ROSTROS QUE<br /><em>MUEVEN LA PANTALLA.</em></h2></div><span>Biografías, créditos y redes verificadas por TMDB.</span></header>
      <div className="talent-radar__track">{people.length ? people.map((person, index) => <Link to={`/persona/${person.id}`} className="talent-card" key={person.id}>
        <span className="talent-card__portrait"><img src={TMDB.profile(person.profile_path, 'h632')} alt={`Retrato de ${person.name}`} loading="lazy" /><b>0{index + 1}</b></span>
        <strong>{person.name}</strong><small>{person.known_for_department || 'Cine'}</small><p>{person.known_for?.slice(0, 2).map((credit) => credit.title || credit.name).join(' · ')}</p>
      </Link>) : peopleState === 'loading' ? Array.from({ length: 6 }, (_, index) => <div className="talent-card talent-card--loading" key={index}><span><UserRound /></span></div>) : <div className="talent-radar__empty"><UserRound size={24} /><p>El archivo de talento no está disponible por el momento.</p></div>}</div>
    </div>

    <div className="genre-explorer">
      <header><p>04 · ENCUENTRA TU TONO</p><h2>EXPLORA POR <em>GÉNERO.</em></h2></header>
      <div>{genres.length ? genres.map(([genre, movie]) => <Link className="genre-window" to={`/cartelera?q=${encodeURIComponent(genre)}`} key={genre}><img src={TMDB.backdrop(movie.backdrop_path, 'w780')} alt="" loading="lazy" /><span /><p>{genre}</p><ArrowRight size={18} /></Link>) : FALLBACK_GENRES.map((genre) => <Link className="genre-window genre-window--empty" to={`/cartelera?q=${encodeURIComponent(genre)}`} key={genre}><p>{genre}</p><ArrowRight size={18} /></Link>)}</div>
    </div>

    <div className="cine-pulse">
      <div className="cine-pulse__intro"><Sparkles size={18} /><p>EL PULSO DE LA SEMANA</p><h3>Datos para elegir.<br />Instinto para reservar.</h3></div>
      <div className="cine-pulse__metric"><span>VALORACIÓN MEDIA</span><strong><Star size={20} fill="currentColor" />{metrics.average.toFixed(1)}</strong><small>en la selección actual</small></div>
      <div className="cine-pulse__metric"><span>VOTOS DE COMUNIDAD</span><strong>{new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(metrics.votes)}</strong><small>señales agregadas de TMDB</small></div>
      <div className="cine-pulse__metric"><span>HISTORIAS EN RADAR</span><strong>{movies.length.toString().padStart(2, '0')}</strong><small>rotación dinámica semanal</small></div>
      <Link to="/cartelera">ABRIR CARTELERA <ArrowRight size={15} /></Link>
    </div>
  </section>;
}
