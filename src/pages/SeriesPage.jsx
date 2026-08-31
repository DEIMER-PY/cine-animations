import MotionGallery from '../components/MotionGallery';
import ProjectionLoader from '../components/ProjectionLoader';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Search, SlidersHorizontal, Tv } from 'lucide-react';
import { Catalog } from '../api/catalog';
import SeriesCard from '../components/SeriesCard';
import CinemaFooter from '../components/CinemaFooter';

const groups = [
  ['trending', 'TENDENCIAS DE LA SEMANA'],
  ['popular', 'LAS MÁS POPULARES'],
  ['topRated', 'ACLAMADAS POR LA AUDIENCIA'],
  ['onAir', 'AHORA EN EMISIÓN'],
];

export default function SeriesPage() {
  const rootRef = useRef(null);
  const [collections, setCollections] = useState({});
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('popularidad');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all(groups.map(async ([key]) => [key, await Catalog.fetchSeries(key, 20)]))
      .then((entries) => { if (active) setCollections(Object.fromEntries(entries)); })
      .catch(() => { if (active) setError('No pudimos abrir el archivo de series.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading || !rootRef.current) return undefined;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('.series-hero__copy > *', { y: 46, autoAlpha: 0, stagger: .08, duration: .85, ease: 'power3.out' });
        gsap.from('.series-card', { y: 35, autoAlpha: 0, stagger: { each: .035, from: 'start' }, duration: .65, ease: 'power3.out' });
      }, rootRef);
      return () => context.revert();
    });
    return () => mm.revert();
  }, [loading]);

  const visible = useMemo(() => Object.fromEntries(groups.map(([key]) => {
    const needle = query.trim().toLowerCase();
    const filtered = (collections[key] || []).filter((item) => !needle || item.title.toLowerCase().includes(needle));
    return [key, [...filtered].sort((a, b) => sort === 'valoración' ? b.vote_average - a.vote_average : Number(b.popularity || 0) - Number(a.popularity || 0))];
  })), [collections, query, sort]);

  return <div ref={rootRef} className="series-page">
    <section className="series-hero">
      
      <div className="series-hero__veil" /><div className="series-hero__copy"><p>ARCHIVO SERIAL · TMDB</p><h1>OTRO EPISODIO.<br /><em>OTRA OBSESIÓN.</em></h1><span>Series en tendencia, clásicos modernos y temporadas que siguen respirando después de los créditos.</span></div>
    </section>
    <MotionGallery items={collections.trending || []} type="tv" label="Series protagonistas" />
    <section className="series-catalog">
      <header><div><Tv size={20} /><p>EXPLORA EL ARCHIVO</p></div><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en estas series" /></label><label><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="popularidad">Popularidad</option><option value="valoración">Valoración</option></select></label></header>
      {loading && <ProjectionLoader label="Programando episodios" />}
      {error && <div className="catalog-empty"><strong>SEÑAL INTERRUMPIDA</strong><p>{error}</p></div>}
      {!loading && !error && groups.map(([key, label]) => <section className="series-rail" key={key}><header><span>{label}</span><b>{String(visible[key]?.length || 0).padStart(2, '0')}</b></header><div>{(visible[key] || []).map((series, index) => <SeriesCard key={series.id} series={series} rank={key === 'trending' && index < 10 ? index + 1 : null} />)}</div></section>)}
    </section><CinemaFooter />
  </div>;
}
