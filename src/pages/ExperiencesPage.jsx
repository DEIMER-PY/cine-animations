import { Link } from 'react-router-dom';
import { ArrowRight, AudioWaveform, CircleDot, ScanLine } from 'lucide-react';
import { CINEMA_FORMATS, formatCOP } from '../data/cinema';

const icons = { CLASSIC: ScanLine, DOLBY: AudioWaveform, IMAX: CircleDot };
export default function ExperiencesPage() {
  return <div className="experiences-page"><header><p>03 · ARQUITECTURA PARA SENTIR</p><h1>TRES SALAS.<br /><span>NINGUNA DISTRACCIÓN.</span></h1><p>No añadimos tecnología para que la mires. La calibramos hasta que desaparece y solo queda la película.</p></header><section>{Object.entries(CINEMA_FORMATS).map(([key, detail], index) => { const Icon = icons[key]; return <article key={key}><div className="experience-number">0{index + 1}</div><Icon size={36} /><div><p>{key}</p><h2>{detail.label}</h2><span>{detail.room} · desde {formatCOP(detail.price)}</span></div><p>{key === 'CLASSIC' ? 'Proyección precisa, butacas amplias y la intimidad de una sala curada.' : key === 'DOLBY' ? 'Sonido tridimensional, negros profundos y mezcla calibrada para cada asiento.' : 'Pantalla de gran formato, proyección láser y escala diseñada para el espectáculo.'}</p><Link to={`/cartelera?format=${key}`}>VER FUNCIONES <ArrowRight size={16} /></Link></article>; })}</section></div>;
}
