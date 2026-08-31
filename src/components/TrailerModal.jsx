import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ExternalLink, Film, RotateCcw, X } from 'lucide-react';
import { Catalog } from '../api/catalog';
import { TMDB } from '../api/tmdb';
import ProjectionLoader from './ProjectionLoader';

export default function TrailerModal({ isOpen, onClose, movieId, movieTitle, movieBackdropPath, originRect, mediaType = 'movie', isDemo = false }) {
  const dialogRef = useRef(null);
  const portalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const dialog = dialogRef.current;
    const focus = document.activeElement;
    if (!dialog.open) dialog.showModal();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const context = gsap.context(() => {
      const rect = portalRef.current.getBoundingClientRect();
      const from = originRect ? { x: originRect.left + originRect.width / 2 - rect.left - rect.width / 2, y: originRect.top + originRect.height / 2 - rect.top - rect.height / 2, scale: Math.max(.08, originRect.width / rect.width) } : { y: 35, scale: .8 };
      gsap.timeline({ onComplete: () => setEntered(true) })
        .from(portalRef.current, { ...from, rotationX: reduced ? 0 : -12, autoAlpha: 0, duration: reduced ? 0 : .7, ease: 'power4.inOut' }, 0)
        .fromTo('.trailer-fan img', { x: 0, y: 70, rotationY: -65, autoAlpha: 0 }, { x: (index) => (index - 2) * 65, y: (index) => Math.abs(index - 2) * 18, rotation: (index) => (index - 2) * 8, rotationY: 0, autoAlpha: 1, duration: reduced ? 0 : .5, stagger: reduced ? 0 : .04 }, 0);
    }, portalRef);
    return () => { context.revert(); if (dialog.open) dialog.close(); if (focus?.isConnected) focus.focus(); };
  }, [isOpen, originRect]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setSelected(0);
    (isDemo ? Promise.resolve([]) : Catalog.getTrailerCandidates(mediaType, movieId)).then((rows) => { if (active) setVideos(rows); })
      .catch(() => { if (active) setError('No pudimos consultar los trailers.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [movieId, mediaType, attempt, isDemo]);

  useEffect(() => {
    if (!closing) return undefined;
    const tween = gsap.to(portalRef.current, { y: 25, scale: .93, autoAlpha: 0, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .25, ease: 'power2.in', onComplete: () => onCloseRef.current() });
    return () => tween.kill();
  }, [closing]);

  const video = videos[selected];
  const ready = entered && !loading;
  const image = TMDB.backdrop(movieBackdropPath, 'w780');
  const externalURL = video ? `https://www.youtube.com/watch?v=${video.key}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movieTitle} trailer oficial`)}`;
  if (!isOpen) return null;
  return <dialog ref={dialogRef} className="trailer-dialog" aria-labelledby="trailer-heading" onCancel={(event) => { event.preventDefault(); setClosing(true); }} onClick={(event) => { if (event.target === event.currentTarget) setClosing(true); }}>
    <div className="trailer-portal" ref={portalRef}>
      <header className="trailer-toolbar"><span>PROYECCIÓN / {mediaType === 'tv' ? 'SERIE' : 'PELÍCULA'}</span><button onClick={() => setClosing(true)} aria-label="Cerrar trailer"><X size={21} /></button></header>
      <div className="trailer-portal__screen">
        {!ready && <div className="trailer-intro" data-testid="trailer-intro">{!entered && image ? <div className="trailer-fan" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <img key={index} src={image} alt="" />)}</div> : <ProjectionLoader label={`Preparando ${movieTitle}`} />}</div>}
        {ready && <div className="trailer-handoff">
          {image && <img src={image} alt={`Escena de ${movieTitle}`} />}
          <div><Film size={28} /><strong>{video ? 'EL TRAILER, EN SU PANTALLA ORIGINAL.' : 'TRAILER NO DISPONIBLE'}</strong>
            <p>{error || (video ? 'Abre YouTube para reproducirlo sin las restricciones del reproductor insertado.' : 'No hay un enlace confirmado en TMDB. Puedes buscarlo por título, sin confundirlo con otra película.')}</p>
            <a className="button-primary" href={externalURL} target="_blank" rel="noopener noreferrer">{video ? 'VER EN YOUTUBE' : 'BUSCAR TRAILER EN YOUTUBE'} <ExternalLink size={16} /></a>
            <a className="trailer-same-tab" href={externalURL}>Si no se abre, continuar en esta pestaña →</a>
            {!video && <button onClick={() => setAttempt((value) => value + 1)}><RotateCcw size={16} />REINTENTAR CONSULTA</button>}
          </div>
        </div>}
      </div>
      <header><p>TRAILER COMPLETO</p><h2 id="trailer-heading">{movieTitle}</h2></header>
      {ready && videos.length > 1 && <div className="trailer-related"><span>OTROS TRAILERS DE ESTE TÍTULO</span><div>{videos.map((item, index) => <button key={item.key} onClick={() => { setSelected(index); setError(''); }} className={index === selected ? 'is-active' : ''}><strong>{item.name}</strong></button>)}</div></div>}
    </div>
  </dialog>;
}
