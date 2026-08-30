import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

export default function SmoothScroll({ enabled }) {
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 769) return undefined;
    const lenis = new Lenis({ duration: 1.08, smoothWheel: true, wheelMultiplier: .9 });
    const update = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(update); gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(update); lenis.destroy(); };
  }, [enabled]);
  return null;
}
