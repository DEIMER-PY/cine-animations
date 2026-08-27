import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/animations';

/**
 * Applies GSAP scroll-driven reveals to all `.reveal` descendants inside
 * the returned ref. Elements burst in with a slight clip-path wipe.
 */
export function useSectionReveal(options = {}) {
  const scopeRef = useRef(null);
  const trigger = options.trigger ?? '.reveal';
  const y = options.y ?? 46;
  const stagger = options.stagger ?? 0.12;
  const start = options.start ?? 'top 85%';

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      const items = scope.querySelectorAll(trigger);
      gsap.set(items, {
        opacity: 0,
        y,
        clipPath: 'inset(0 0 100% 0)',
        willChange: 'transform, opacity',
      });
      items.forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: 1.1,
          delay: i * stagger,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: 'play none none none',
          },
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [start, stagger, trigger, y]);

  return scopeRef;
}
