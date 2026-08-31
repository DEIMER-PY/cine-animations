import ProjectionLoader from '../components/ProjectionLoader';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { TMDB } from '../api/tmdb';
import CinemaFooter from '../components/CinemaFooter';

gsap.registerPlugin(ScrollTrigger);

export default function PersonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [person, setPerson] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { TMDB.fetchPersonDetails(id).then(setPerson); }, [id]);
  useEffect(() => {
    if (!person) return undefined;
    const context = gsap.context(() => {
      gsap.from('.person-hero__portrait', { clipPath: 'inset(100% 0 0)', duration: 1.1, ease: 'power4.inOut' });
      gsap.from('.person-hero__copy > *', { y: 38, autoAlpha: 0, stagger: .08, duration: .9, ease: 'power3.out', delay: .2 });
      gsap.from('.person-credit', { y: 60, autoAlpha: 0, stagger: .045, scrollTrigger: { trigger: '.person-filmography', start: 'top 78%' } });
    }, rootRef);
    return () => context.revert();
  }, [person]);

  const credits = useMemo(() => {
    if (!person) return [];
    const all = [...(person.combined_credits?.cast || []), ...(person.combined_credits?.crew || [])];
    return [...new Map(all.filter((item) => item.poster_path).sort((a, b) => Number(b.vote_count || 0) - Number(a.vote_count || 0)).map((item) => [`${item.media_type}-${item.id}`, item])).values()].slice(0, 16);
  }, [person]);

  if (!person) return <ProjectionLoader label="Abriendo el archivo de la persona" full />;
  const social = person.external_ids || {};
  return <div ref={rootRef} className="person-page">
    <button onClick={() => navigate(-1)} className="person-page__back"><ArrowLeft size={15} />VOLVER A LA PELÍCULA</button>
    <section className="person-hero">
      <div className="person-hero__portrait">{person.profile_path ? <img src={TMDB.profile(person.profile_path, 'h632')} alt={`Retrato de ${person.name}`} /> : <i>{person.name.slice(0, 1)}</i>}</div>
      <div className="person-hero__copy"><p>ARCHIVO DE TALENTO · {person.known_for_department?.toUpperCase()}</p><h1>{person.name}</h1><dl><div><dt>NACE</dt><dd>{person.birthday || 'Sin dato público'}</dd></div><div><dt>ORIGEN</dt><dd>{person.place_of_birth || 'Sin dato público'}</dd></div><div><dt>CRÉDITOS</dt><dd>{credits.length}+ seleccionados</dd></div></dl><div className={`person-biography ${expanded ? 'is-expanded' : ''}`}><p>{person.biography || 'TMDB todavía no publica una biografía en español para esta persona.'}</p></div>{person.biography?.length > 480 && <button className="person-more" onClick={() => setExpanded((value) => !value)}>{expanded ? 'LEER MENOS' : 'LEER BIOGRAFÍA COMPLETA'}</button>}<div className="person-socials">{social.instagram_id && <a href={`https://instagram.com/${social.instagram_id}`} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialGlyph type="instagram" /></a>}{social.facebook_id && <a href={`https://facebook.com/${social.facebook_id}`} target="_blank" rel="noreferrer" aria-label="Facebook"><SocialGlyph type="facebook" /></a>}{social.imdb_id && <a href={`https://www.imdb.com/name/${social.imdb_id}`} target="_blank" rel="noreferrer">IMDb <ExternalLink size={13} /></a>}</div></div>
    </section>
    <section className="person-filmography"><header><p>FILMOGRAFÍA SELECCIONADA</p><h2>HISTORIAS EN LAS QUE<br /><em>DEJÓ SU HUELLA.</em></h2></header><div>{credits.map((credit) => <Link className="person-credit" to={credit.media_type === 'movie' ? `/pelicula/${credit.id}` : `/serie/${credit.id}`} key={`${credit.media_type}-${credit.id}`}><img src={TMDB.poster(credit.poster_path, 'w342')} alt={`Póster de ${credit.title || credit.name}`} loading="lazy" /><span>{credit.release_date?.slice(0, 4) || credit.first_air_date?.slice(0, 4) || '—'} · {credit.character || credit.job || credit.media_type}</span><strong>{credit.title || credit.name}</strong></Link>)}</div></section>
    <CinemaFooter />
  </div>;
}

function SocialGlyph({ type }) {
  if (type === 'facebook') return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v2H6v4h3v7h4v-7h3.5l.5-4h-4V9c0-.7.3-1 1-1Z"/></svg>;
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
}
