import { useMemo, useRef } from 'react';

/** Ambient rising ember particles; pure CSS-driven (no rAF churn). */
export default function Embers({ count = 14 }) {
  const ref = useRef(null);

  const embers = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 3 + Math.random() * 6,
        delay: Math.random() * 12,
        duration: 9 + Math.random() * 10,
        drift: `${-60 + Math.random() * 120}px`,
        opacityBase: 0.4 + Math.random() * 0.5,
      })),
    [count]
  );

  return (
    <div ref={ref} className="fixed inset-0 z-[5] pointer-events-none" aria-hidden="true">
      {embers.map((e) => (
        <span
          key={e.id}
          className="ember"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            '--drift': e.drift,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
