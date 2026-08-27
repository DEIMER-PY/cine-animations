import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { scrambleText, animateCounter } from '../../lib/animations';

/** Infinite marquee strip. Repeats children and scrolls them with GSAP. */
export function Marquee({ children, speed = 40, reverse = false, className = '' }) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const moved = gsap.to(track, {
      x: reverse ? '+=50%' : '-=50%',
      duration: speed,
      ease: 'none',
      repeat: -1,
    });
    return () => {
      moved.kill();
    };
  }, [speed, reverse]);

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex shrink-0" aria-hidden={i !== 0}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Scrambles the provided text on mount and when `text` changes. */
export function TextScramble({ text, as: Tag = 'span', className = '', duration = 1, delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    let cancelled = false;
    const t = setTimeout(() => {
      scrambleText(ref.current, text, { duration }).then(() => {
        if (ref.current && !cancelled) ref.current.textContent = text;
      });
    }, delay * 1000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text, duration, delay]);

  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}

/** Animates a number to a target value when it becomes visible. */
export function AnimatedCounter({ to = 0, duration = 1.8, decimals = 0, suffix = '', className = '' }) {
  const ref = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper || to == null) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animateCounter(el, to, { duration, decimals, suffix });
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(wrapper);
    return () => obs.disconnect();
  }, [to, duration, decimals, suffix]);

  return (
    <span ref={wrapperRef} className={className}>
      <span ref={ref}>0{suffix}</span>
    </span>
  );
}

/** Magnetic hover wrapper using GSAP quickTo. */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });

    const move = (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(relX * strength);
      yTo(relY * strength);
    };
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
    };

    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </div>
  );
}
