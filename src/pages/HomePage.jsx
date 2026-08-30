import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, Play, Ticket } from 'lucide-react';
import { getCinemaMovies } from '../api/cinema';
import { listShowings } from '../api/booking';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';
import MovieTile from '../components/MovieTile';
import ShowtimePill from '../components/ShowtimePill';
import MovieFrames from '../components/MovieFrames';
import CinemaFooter from '../components/CinemaFooter';
import AmbientVideo from '../components/AmbientVideo';
import DiscoveryRails from '../components/DiscoveryRails';
import { CINEMA_FORMATS, DEMO_MOVIES } from '../data/cinema';

gsap.registerPlugin(ScrollTrigger);
const HeroAtmosphere3D = lazy(() => import('../components/HeroAtmosphere3D'));

export default function HomePage() {
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const [movies, setMovies] = useState(() => DEMO_MOVIES.slice(0, 10));
  const [showings, setShowings] = useState([]);
  const openTrailer = useStore((state) => state.openTrailer);

  useEffect(() => { let active = true; getCinemaMovies('trending', 10).then((items) => { if (!active) return []; setMovies(items); return listShowings({ movies: items }); }).then((items) => { if (active) setShowings(items); }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!movies.length) return undefined;
    const media = gsap.matchMedia();
    media.add({ cinematic: '(min-width: 769px) and (prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
      if (context.conditions.reduced) { gsap.set('.hero-kicker, .hero-title__line, .hero-summary, .hero-actions, .hero-showtimes', { clearProps: 'all' }); return undefined; }
      const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
      intro
        .from('.hero-media', { scale: 1.04, autoAlpha: 0, duration: 1.25 }, 0)
        .from('.hero-kicker', { y: 24, autoAlpha: 0, duration: .7 }, .15)
        .from('.hero-title__line', { yPercent: 115, rotateX: -22, autoAlpha: 0, duration: 1.05, stagger: .07, transformOrigin: '50% 100%' }, .2)
        .from('.hero-summary, .hero-actions', { y: 30, autoAlpha: 0, duration: .8, stagger: .1 }, .65)
        .from('.hero-showtimes, .hero-index, .hero-scroll', { y: 18, autoAlpha: 0, duration: .7, stagger: .08 }, .82);
      gsap.timeline({ scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: .7 } })
        .to('.hero-media__image', { scale: 1.17, yPercent: 8, ease: 'none' }, 0)
        .to('.hero-media__video', { autoAlpha: 0, ease: 'none' }, 0)
        .to('.cinema-hero__content', { yPercent: 12, autoAlpha: .1, ease: 'none' }, 0);
      gsap.utils.toArray('.format-panel', rootRef.current).forEach((panel, index) => gsap.from(panel, { xPercent: index % 2 ? 16 : -16, autoAlpha: 0, scrollTrigger: { trigger: panel, start: 'top 84%', end: 'top 54%', scrub: .6 } }));
      const finale = gsap.timeline({ scrollTrigger: { trigger: '.cinema-finale', start: 'top 80%', end: 'center center', scrub: .7 } });
      finale.from('.cinema-finale__orb', { scale: .25, autoAlpha: 0 }).from('.cinema-finale h2, .cinema-finale p, .cinema-finale a', { y: 60, autoAlpha: 0, stagger: .08 }, .08);
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => intro.kill();
    }, rootRef);
    return () => media.revert();
  }, [movies]);

  const featured = movies[0];
  const featuredShowings = useMemo(() => featured ? showings.filter((item) => String(item.tmdb_id) === String(featured.id)).slice(0, 4) : [], [showings, featured]);
  return <div ref={rootRef} className="cinema-home">
    <section ref={heroRef} className="cinema-hero" aria-labelledby="hero-title">
      <div className="hero-media">
        <img className="hero-media__image" src={TMDB.backdrop(featured.backdrop_path, 'original')} alt="" fetchPriority="high" />
        <AmbientVideo className="hero-media__video" webm="/media/cinema-atmosphere.webm" mp4="/media/cinema-atmosphere.mp4" aria-hidden="true" />
        <Suspense fallback={null}><HeroAtmosphere3D /></Suspense>
        <div className="hero-media__layers" />
      </div>
      <div className="cinema-hero__content">
        <p className="hero-kicker">ESTRENO DE LA SEMANA <span>·</span> IMAX LASER</p>
        <h1 id="hero-title" className="hero-title">{featured.title.split(' ').map((word, index) => <span className="hero-title__line" key={`${word}-${index}`}>{word}</span>)}</h1>
        <p className="hero-summary">{featured.overview}</p>
        <div className="hero-actions"><Link to={`/pelicula/${featured.id}`} className="button-primary"><Ticket size={17} />VER FUNCIONES</Link><button onClick={() => openTrailer(featured)} className="button-ghost"><Play size={16} fill="currentColor" />TRÁILER</button></div>
        <div className="hero-showtimes"><div><span>HOY EN</span><strong>CINE BOGOTÁ</strong></div><div className="hero-showtimes__rail">{featuredShowings.map((showing) => <ShowtimePill key={showing.id} showing={showing} compact />)}</div></div>
      </div>
      <div className="hero-index"><span>01</span><div /><small>06</small></div>
      <a href="#cartelera" className="hero-scroll"><ArrowDown size={16} />EXPLORAR</a>
    </section>

    <section id="cartelera" className="cinema-section cinema-section--light">
      <div className="section-heading"><div><p>01 · AHORA EN PANTALLA</p><h2>Historias que<br /><em>piden oscuridad.</em></h2></div><Link to="/cartelera">VER CARTELERA <ArrowRight size={16} /></Link></div>
      <div className="movie-grid">{movies.slice(0, 4).map((movie, index) => <MovieTile key={movie.id} movie={movie} index={index} />)}</div>
    </section>

    <DiscoveryRails seedMovies={movies} />

    <section className="format-story">
      <div className="format-story__intro"><p>02 · TRES FORMAS DE VER</p><h2>EL SONIDO NO SE OYE.<br /><span>ATRAVIESA.</span></h2><p>Salas diseñadas como instrumentos: imagen, arquitectura y sonido calibrados para desaparecer cuando empieza la película.</p></div>
      <div className="format-story__panels">{Object.entries(CINEMA_FORMATS).map(([key, detail], index) => <article className="format-panel" key={key}><span>0{index + 1}</span><div><p>{key}</p><h3>{detail.label}</h3><small>{detail.room}</small></div><Link to={`/cartelera?format=${key}`}>DESCUBRIR <ArrowRight size={15} /></Link></article>)}</div>
    </section>

    <section className="cinema-finale">
      <div className="cinema-finale__orb" /><p>LA PELÍCULA EMPIEZA ANTES DE LA PANTALLA</p><h2>ELIGE TU<br />PRÓXIMA <em>ESCENA.</em></h2><Link to="/cartelera" className="button-primary">COMPRAR ENTRADAS <ArrowRight size={17} /></Link>
    </section>
    <MovieFrames movies={movies} />
    <CinemaFooter />
  </div>;
}
