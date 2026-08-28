import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUp, CircleDot, Film, Heart, Search, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';

const links = [
  ['home', 'Home'],
  ['catalog', 'Archive'],
  ['cast', 'Ensemble'],
  ['collection', 'Collection'],
];

export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const setSection = useStore((state) => state.setSection);
  const setShowAuthModal = useStore((state) => state.setShowAuthModal);
  const user = useStore((state) => state.user);

  const navigate = (section) => {
    setSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-white/5 bg-[#070707]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(196,18,48,.12),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(201,168,76,.08),transparent_25%)]" />
      <motion.div initial={{ opacity: 0, y: 35 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="relative mx-auto max-w-[1500px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-14 border-b border-white/5 pb-16 lg:grid-cols-[1.2fr_.8fr_.8fr]">
          <div>
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-cinema-accent text-white"><Film size={20} /></div><span className="font-display text-3xl tracking-[.16em] text-white">CINE</span></div>
            <p className="mt-7 max-w-lg font-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[.85] tracking-wide text-white/90">KEEP THE<br /><span className="text-outline">FRAME ALIVE.</span></p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/35">Una experiencia experimental de descubrimiento cinematográfico, construida con motion, WebGL y un archivo vivo.</p>
          </div>

          <div>
            <p className="mb-5 font-mono text-[9px] tracking-[.3em] text-cinema-gold">EXPLORE</p>
            <div className="space-y-2">{links.map(([id, label], index) => <button key={id} onClick={() => navigate(id)} className="group flex w-full items-center justify-between border-b border-white/5 py-3 text-left font-display text-2xl tracking-wide text-white/40 transition hover:border-cinema-accent/30 hover:text-white"><span>{label}</span><span className="font-mono text-[9px] text-white/15 transition group-hover:text-cinema-accent">0{index + 1}</span></button>)}</div>
          </div>

          <div>
            <p className="mb-5 font-mono text-[9px] tracking-[.3em] text-cinema-gold">SYSTEM</p>
            <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[.02] p-5">
              <Status icon={CircleDot} label="CATALOG" value="SUPABASE · LIVE" />
              <Status icon={ShieldCheck} label="SESSION" value={user ? 'AUTHENTICATED' : 'GUEST MODE'} />
              <Status icon={Heart} label="COLLECTION" value="SYNC READY" />
            </div>
            {!user && <button onClick={() => setShowAuthModal(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-cinema-accent/25 bg-cinema-accent/10 py-3 font-mono text-[10px] tracking-[.18em] text-cinema-accent transition hover:bg-cinema-accent/20"><Search size={14} /> OPEN PRIVATE ARCHIVE</button>}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-7 font-mono text-[9px] tracking-[.15em] text-white/20 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 CINE ANIMATIONS · EXPERIMENTAL INTERFACE</p><p>CATALOG DATA · SUPABASE / TMDB ENRICHMENT</p></div>
      </motion.div>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Volver arriba" className="fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/70 text-white/40 backdrop-blur transition hover:border-cinema-accent/40 hover:text-white"><ArrowUp size={16} /></button>
    </footer>
  );
}

function Status({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"><Icon size={14} className="text-emerald-400" /><div className="flex flex-1 items-center justify-between"><span className="font-mono text-[9px] tracking-wider text-white/25">{label}</span><span className="font-mono text-[8px] tracking-wider text-white/45">{value}</span></div></div>;
}
