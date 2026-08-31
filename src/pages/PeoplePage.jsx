import MotionGallery from '../components/MotionGallery';
import ProjectionLoader from '../components/ProjectionLoader';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TMDB } from '../api/tmdb';
import CinemaFooter from '../components/CinemaFooter';



export default function PeoplePage() {
  const rootRef = useRef(null);
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; TMDB.fetchTrendingPeople().then((rows) => active && setPeople(rows.filter((person) => person.profile_path))).catch(() => active && setError('No pudimos abrir el archivo de personas. Inténtalo de nuevo más tarde.')).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  const visible = useMemo(() => people.filter((person) => person.name.toLowerCase().includes(query.toLowerCase())), [people, query]);
  return <div ref={rootRef} className="people-page">
    <section className="people-hero"><div /><p>PERSONAS · EN TENDENCIA</p><h1>EL CINE TAMBIÉN<br /><em>TIENE ROSTRO.</em></h1><span>Recorre el archivo con los controles laterales y abre cada historia.</span></section>
    {loading ? <ProjectionLoader label="Revelando retratos" /> : <MotionGallery items={people} type="person" label="Personas en tendencia" />}
    {error && <p className="catalog-empty" role="status">{error}</p>}
    <section className="people-directory"><header><div><p>DIRECTORIO TMDB</p><h2>ENCUENTRA A<br /><em>QUIEN HIZO POSIBLE LA HISTORIA.</em></h2></div><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar una persona" /></label></header><div>{visible.map((person) => <Link to={`/persona/${person.id}`} key={person.id}><span>{person.profile_path ? <img src={TMDB.profile(person.profile_path, 'w185')} alt="" loading="lazy" /> : <UserRound />}</span><div><strong>{person.name}</strong><small>{person.known_for_department || 'Cine'}</small><p>{person.known_for?.slice(0, 3).map((item) => item.title || item.name).join(' · ')}</p></div></Link>)}</div></section><CinemaFooter />
  </div>;
}
