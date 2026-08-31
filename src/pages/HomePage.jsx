import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { getCinemaMovies } from '../api/cinema';
import { listShowings } from '../api/booking';
import { useStore } from '../store/useStore';
import MovieTile from '../components/MovieTile';
import MovieFrames from '../components/MovieFrames';
import CinemaFooter from '../components/CinemaFooter';
import RotatingHero from '../components/RotatingHero';
import DiscoveryRails from '../components/DiscoveryRails';
import CinemaExplorer from '../components/CinemaExplorer';
import SpotlightDeck from '../components/SpotlightDeck';
import { CINEMA_FORMATS, DEMO_MOVIES } from '../data/cinema';

gsap.registerPlugin(ScrollTrigger);
export default function HomePage() {
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const [movies, setMovies] = useState(() => DEMO_MOVIES.slice(0, 30).map((movie) => ({ ...movie, demo: true })));
  const [showings, setShowings] = useState([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const openTrailer = useStore((state) => state.openTrailer);

  useEffect(() => { let active = true; getCinemaMovies('trending', 36).then((items) => { if (!active) return []; setMovies(items); useStore.getState().setMovies(items); return listShowings({ movies: items.slice(0, 12) }); }).then((items) => { if (active) setShowings(items); }).catch(() => { if (active) setShowings([]); }).finally(() => { if (active) setCatalogReady(true); }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!movies.length) return undefined;
    const media = gsap.matchMedia();
    media.add({ cinematic: '(min-width: 769px) and (prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
      if (context.conditions.reduced) { gsap.set('.hero-kicker, .hero-title__line, .hero-summary, .hero-actions, .hero-showtimes', { clearProps: 'all' }); return undefined; }
      gsap.utils.toArray('.format-panel', rootRef.current).forEach((panel, index) => gsap.from(panel, { xPercent: index % 2 ? 16 : -16, rotationX: -12, transformOrigin: 'center top', autoAlpha: 0, scrollTrigger: { trigger: panel, start: 'top 84%', end: 'top 54%', scrub: .6 } }));
      const finale = gsap.timeline({ scrollTrigger: { trigger: '.cinema-finale', start: 'top 80%', end: 'center center', scrub: .7 } });
      finale.from('.cinema-finale__orb', { scale: .25, autoAlpha: 0 }).from('.cinema-finale h2, .cinema-finale p, .cinema-finale a', { y: 60, autoAlpha: 0, stagger: .08 }, .08);
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return undefined;
    }, rootRef);
    return () => media.revert();
  }, [movies]);

  return <div ref={rootRef} className="cinema-home" data-catalog-ready={catalogReady}>
    <RotatingHero movies={movies} showings={showings} onTrailer={openTrailer} heroRef={heroRef} />

    <section id="cartelera" className="cinema-section cinema-section--light">
      <div className="section-heading"><div><p>01 · AHORA EN PANTALLA</p><h2><span className="heading-mask"><span>Historias que</span></span><span className="heading-mask"><em>piden oscuridad.</em></span></h2></div><Link to="/cartelera">VER CARTELERA <ArrowRight size={16} /></Link></div>
      <div className="movie-grid">{movies.slice(5, 9).map((movie, index) => <MovieTile key={movie.id} movie={movie} index={index} />)}</div>
    </section>

    <SpotlightDeck movies={movies.slice(9, 18)} />
    <DiscoveryRails seedMovies={movies} />
    <section className="format-story">
      <div className="format-story__intro"><p>02 · TRES FORMAS DE VER</p><h2>EL SONIDO NO SE OYE.<br /><span>ATRAVIESA.</span></h2><p>Salas diseñadas como instrumentos: imagen, arquitectura y sonido calibrados para desaparecer cuando empieza la película.</p></div>
      <div className="format-story__panels">{Object.entries(CINEMA_FORMATS).map(([key, detail], index) => <article className="format-panel" key={key}><span>0{index + 1}</span><div><p>{key}</p><h3>{detail.label}</h3><small>{detail.room}</small></div><Link to={`/cartelera?format=${key}`}>DESCUBRIR <ArrowRight size={15} /></Link></article>)}</div>
    </section>

    <CinemaExplorer movies={movies} />

    <section className="cinema-finale">
      <div className="cinema-finale__orb" /><p>LA PELÍCULA EMPIEZA ANTES DE LA PANTALLA</p><h2><span className="finale-line"><span>ELIGE TU</span></span><span className="finale-line"><span>PRÓXIMA <em>ESCENA.</em></span></span></h2><Link to="/cartelera" className="button-primary">COMPRAR ENTRADAS <ArrowRight size={17} /></Link>
    </section>
    <MovieFrames movies={movies} />
    <CinemaFooter />
  </div>;
}
