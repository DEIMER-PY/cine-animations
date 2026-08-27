import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Thin cinematic progress rail at the very top, driven by scroll. */
export default function ScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const animation = gsap.to(el, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    });
    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, []);

  return <div ref={ref} className="scroll-rail" />;
}
