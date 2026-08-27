import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStore } from '../store/useStore';
import { TMDB } from '../api/tmdb';
import { Marquee } from './animations';

gsap.registerPlugin(ScrollTrigger);

const PHASE_COUNT = 5;

function ScrollIndicator() {
  const lineRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      lineRef.current,
      { scaleY: 0, transformOrigin: 'top' },
      { scaleY: 1, duration: 1.2, ease: 'power2.out', repeat: -1, yoyo: true }
    );
  }, []);

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20 pointer-events-none">
      <span className="font-mono text-[10px] text-white/30 tracking-[0.4em]">SCROLL</span>
      <div className="w-px h-10 bg-white/10 relative overflow-hidden">
        <div ref={lineRef} className="absolute inset-0 bg-gradient-to-b from-cinema-accent to-transparent" />
      </div>
    </div>
  );
}

function PhaseIndicator({ activePhase }) {
  const labels = ['I', 'II', 'III', 'IV', 'V'];

  return (
    <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 z-30 pointer-events-none">
      {labels.map((label, i) => {
        const isActive = activePhase === i;
        return (
          <div key={i} className="flex items-center gap-3">
            <span
              className={`font-mono text-[9px] tracking-[0.3em] transition-all duration-500 ${
                isActive ? 'text-cinema-accent opacity-100' : 'text-white/0 opacity-0'
              }`}
            >
              {label}
            </span>
            <div className="relative flex items-center justify-center">
              <div
                className={`rounded-full transition-all duration-500 ${
                  isActive
                    ? 'w-2.5 h-2.5 bg-cinema-accent shadow-[0_0_12px_rgba(229,9,20,0.8)]'
                    : 'w-1.5 h-1.5 bg-white/20'
                }`}
              />
              {isActive && (
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cinema-accent/30 animate-ping" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingStars({ rating = 0, containerRef }) {
  const starsRef = useRef([]);
  const safeRating = isNaN(rating) ? 0 : rating;
  const normalized = Math.round((safeRating / 10) * 5);
  const hasHalf = (safeRating / 10) * 5 - normalized >= 0.25;

  return (
    <div ref={containerRef} className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i < normalized;
        const isHalf = i === normalized && hasHalf;
        return (
          <span
            key={i}
            ref={(el) => (starsRef.current[i] = el)}
            className={`text-lg transition-colors ${
              isFilled
                ? 'text-cinema-gold'
                : isHalf
                ? 'text-cinema-gold/50'
                : 'text-white/10'
            }`}
            style={{ opacity: 0 }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default function HeroSection() {
  const setSelectedMovie = useStore((s) => s.setSelectedMovie);
  const setSection = useStore((s) => s.setSection);
  const [movies, setMovies] = useState([]);
  const [activePhase, setActivePhase] = useState(0);

  const sectionRef = useRef(null);
  const stageRef = useRef(null);

  const bgRef = useRef(null);
  const phase1TitleRef = useRef(null);
  const phase1TaglineRef = useRef(null);
  const phase1ImageRef = useRef(null);

  const phase2GroupRef = useRef(null);
  const phase2YearRef = useRef(null);
  const phase2SubtextRef = useRef(null);

  const phase3SynopsRef = useRef(null);
  const phase4CtaRef = useRef(null);
  const phase4OverlayRef = useRef(null);

  const phase5GroupRef = useRef(null);

  const ratingContainerRef = useRef(null);

  const mmRef = useRef(null);

  const fetchMovies = useCallback(async () => {
    try {
      const results = await TMDB.fetchTrending();
      setMovies(results.filter((m) => m.backdrop_path).slice(0, 5));
    } catch {
      setMovies([]);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    if (movies.length < 2) return;

    const ctx = gsap.context(() => {
      const featured = movies.slice(0, 5);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          pin: false,
          onUpdate: (self) => {
            const progress = self.progress;
            const phase = Math.min(Math.floor(progress * PHASE_COUNT), PHASE_COUNT - 1);
            setActivePhase(phase);
          },
        },
      });

      gsap.set(phase1TitleRef.current, { opacity: 1 });
      gsap.set(phase1TaglineRef.current, { opacity: 0, y: 20 });
      gsap.set(phase1ImageRef.current, { scale: 1 });

      gsap.set(phase2GroupRef.current, { opacity: 0, y: 40 });
      gsap.set(phase2YearRef.current, { opacity: 0, scaleX: 0 });
      gsap.set(phase2SubtextRef.current, { opacity: 0, y: 15 });

      gsap.set(phase3SynopsRef.current, { opacity: 0 });
      gsap.set(ratingContainerRef.current, { opacity: 0 });

      gsap.set(phase4CtaRef.current, { opacity: 0, y: 30 });
      gsap.set(phase4OverlayRef.current, { opacity: 0 });

      gsap.set(phase5GroupRef.current, { opacity: 1 });

      tl.addLabel('phase1');

      tl.to(
        phase1ImageRef.current,
        { scale: 1.2, duration: 1, ease: 'none' },
        'phase1'
      );
      tl.to(
        phase1TaglineRef.current,
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
        'phase1+=0.2'
      );

      tl.addLabel('phase2');
      tl.to(
        phase1TitleRef.current,
        { scale: 0.5, y: '-40vh', opacity: 0.7, duration: 1, ease: 'power2.inOut' },
        'phase2'
      );
      tl.to(
        phase1TaglineRef.current,
        { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' },
        'phase2'
      );
      tl.to(
        phase1ImageRef.current,
        { opacity: 0, duration: 0.8, ease: 'power2.inOut' },
        'phase2+=0.2'
      );

      tl.set(
        bgRef.current,
        { backgroundImage: `url(${TMDB.backdrop(featured[1].backdrop_path, 'original')})` },
        'phase2+=0.3'
      );
      tl.to(
        bgRef.current,
        { opacity: 1, duration: 0.6, ease: 'power2.out' },
        'phase2+=0.3'
      );

      tl.to(
        phase2GroupRef.current,
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        'phase2+=0.5'
      );
      tl.to(
        phase2YearRef.current,
        { opacity: 1, scaleX: 1, duration: 0.5, ease: 'expo.out' },
        'phase2+=0.7'
      );
      tl.to(
        phase2SubtextRef.current,
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        'phase2+=0.9'
      );

      tl.addLabel('phase3');
      tl.to(
        phase2GroupRef.current,
        { opacity: 0, y: -40, duration: 0.5, ease: 'power2.in' },
        'phase3'
      );

      tl.to(
        phase3SynopsRef.current,
        { opacity: 1, duration: 0.01 },
        'phase3+=0.2'
      );

      const synopsLines = phase3SynopsRef.current?.querySelectorAll('.synops-line');
      if (synopsLines) {
        tl.fromTo(
          synopsLines,
          { opacity: 0, y: 30, rotateX: -40 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.4,
            stagger: 0.15,
            ease: 'power3.out',
          },
          'phase3+=0.2'
        );
      }

      const stars = ratingContainerRef.current?.querySelectorAll('span');
      if (stars) {
        tl.fromTo(
          stars,
          { opacity: 0, scale: 0, rotation: -180 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.25,
            stagger: 0.1,
            ease: 'back.out(2)',
          },
          'phase3+=0.8'
        );
      }
      tl.to(
        ratingContainerRef.current,
        { opacity: 1, duration: 0.01 },
        'phase3+=0.8'
      );

      tl.addLabel('phase4');
      tl.to(
        phase3SynopsRef.current,
        { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' },
        'phase4'
      );
      tl.to(
        ratingContainerRef.current,
        { opacity: 0, duration: 0.3, ease: 'power2.in' },
        'phase4'
      );

      tl.to(
        phase4OverlayRef.current,
        { opacity: 1, duration: 0.6, ease: 'power2.out' },
        'phase4+=0.2'
      );
      tl.fromTo(
        phase4CtaRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'power3.out',
        },
        'phase4+=0.3'
      );

      tl.addLabel('phase5');
      tl.to(
        phase5GroupRef.current,
        { opacity: 0, duration: 1, ease: 'power3.inOut' },
        'phase5'
      );
      tl.to(
        phase4OverlayRef.current,
        { opacity: 0, duration: 0.6, ease: 'power2.in' },
        'phase5'
      );

      mmRef.current = tl;
    }, sectionRef);

    return () => {
      ctx.revert();
      mmRef.current = null;
    };
  }, [movies]);

  if (movies.length === 0) {
    return (
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="font-display text-6xl text-glow-accent tracking-[0.3em] animate-pulse-glow">
          CINE
        </div>
      </section>
    );
  }

  const featured = movies.slice(0, 5);
  const currentMovie = featured[0];
  const secondMovie = featured[1] || featured[0];

  const synopsisText = currentMovie.overview || 'Una historia épica que redefine el cine.';
  const synopsisWords = synopsisText.split(' ');
  const synopsisLines = [];
  const wordsPerLine = Math.ceil(synopsisWords.length / 3);
  for (let i = 0; i < 3; i++) {
    synopsisLines.push(synopsisWords.slice(i * wordsPerLine, (i + 1) * wordsPerLine).join(' '));
  }

  return (
    <section ref={sectionRef} className="relative h-[500vh]">
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-cinema-black">
          <div
            ref={bgRef}
            className="absolute inset-0 bg-cover bg-center transition-none"
            style={{
              backgroundImage: `url(${TMDB.backdrop(secondMovie.backdrop_path, 'original')})`,
              opacity: 0,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-cinema-black/40 via-transparent to-cinema-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/80 via-transparent to-cinema-black/40" />
          <div ref={phase4OverlayRef} className="absolute inset-0 bg-cinema-black/70" />
        </div>

        <div
          ref={phase1ImageRef}
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{
            backgroundImage: `url(${TMDB.backdrop(currentMovie.backdrop_path, 'original')})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/30 to-cinema-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/90 via-cinema-black/30 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex items-end pb-32 md:pb-40 px-4 md:px-8 lg:px-16">
          <div className="max-w-[1600px] mx-auto w-full relative">

            <div ref={phase1TitleRef} className="absolute bottom-0 left-0 will-change-transform">
              <h1 className="font-display text-6xl md:text-8xl lg:text-[11rem] leading-[0.82] tracking-wider text-glow-accent">
                {currentMovie.title?.split(' ').slice(0, 3).join(' ')}
              </h1>
              <p
                ref={phase1TaglineRef}
                className="font-mono text-xs text-white/40 tracking-[0.3em] mt-4 uppercase"
              >
                {currentMovie.tagline || 'Now Playing in Theaters'}
              </p>
            </div>

            <div ref={phase2GroupRef} className="absolute bottom-0 left-0 will-change-transform">
              <div className="flex items-center gap-6 mb-6">
                <div
                  ref={phase2YearRef}
                  className="font-display text-8xl md:text-[12rem] leading-none tracking-wider text-white/10 origin-left"
                >
                  {currentMovie.release_date?.split('-')[0] || '2026'}
                </div>
                <div className="w-px h-20 bg-cinema-accent/40" />
              </div>
              <div ref={phase2SubtextRef}>
                <p className="font-display text-3xl md:text-5xl tracking-wider text-white/80 mb-2">
                  {secondMovie.title}
                </p>
                <p className="font-mono text-xs text-cinema-gray/50 tracking-[0.3em]">
                  FEATURED PRODUCTION
                </p>
              </div>
            </div>

            <div
              ref={phase3SynopsRef}
              className="absolute bottom-0 left-0 max-w-xl will-change-transform"
              style={{ perspective: '600px' }}
            >
              <div className="mb-8">
                {synopsisLines.map((line, i) => (
                  <p
                    key={i}
                    className="synops-line font-body text-base md:text-lg text-white/70 leading-relaxed mb-3"
                    style={{ transformOrigin: 'left bottom' }}
                  >
                    {line}
                  </p>
                ))}
              </div>
              <div ref={ratingContainerRef} className="flex items-center gap-4">
                <RatingStars rating={currentMovie.vote_average} containerRef={ratingContainerRef} />
                <span className="font-mono text-sm text-cinema-gold ml-2">
                  {currentMovie.vote_average?.toFixed(1)}
                </span>
                <span className="text-white/10 mx-2">|</span>
                <span className="font-mono text-xs text-white/30 tracking-wider">
                  {currentMovie.vote_count?.toLocaleString()} VOTES
                </span>
              </div>
            </div>

            <div
              ref={phase4CtaRef}
              className="absolute bottom-0 left-0 flex items-center gap-5 will-change-transform"
            >
              <button
                onClick={() => setSelectedMovie(currentMovie)}
                data-cursor-magnetic
                className="flex items-center gap-3 px-10 py-5 bg-cinema-accent hover:bg-red-600 rounded-xl font-display text-2xl tracking-wider transition-colors duration-300 box-glow-accent group"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="group-hover:scale-110 transition-transform duration-300"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                EXPLORE
              </button>
              <button
                onClick={() => setSection('catalog')}
                data-cursor-magnetic
                className="flex items-center gap-3 px-10 py-5 border border-white/10 hover:border-cinema-gray/40 hover:bg-cinema-gray/5 rounded-xl font-display text-2xl tracking-wider transition-all duration-300 text-white/60 hover:text-white"
              >
                VIEW CATALOG
              </button>
            </div>

          </div>
        </div>

        <div ref={phase5GroupRef} className="absolute inset-0 z-20 pointer-events-none" />

        <ScrollIndicator />

        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <Marquee speed={30} className="border-t border-white/5 bg-cinema-black/30 backdrop-blur-sm py-3">
            {movies.slice(0, 8).map((m) => (
              <span key={m.id} className="mx-6 flex items-center gap-6 font-display text-lg tracking-[0.3em] text-white/25">
                {m.title?.toUpperCase()}
                <span className="text-cinema-accent">✦</span>
              </span>
            ))}
          </Marquee>
        </div>
      </div>

      <PhaseIndicator activePhase={activePhase} />
    </section>
  );
}
