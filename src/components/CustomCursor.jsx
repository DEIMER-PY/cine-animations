import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef(32);
  const targetSizeRef = useRef(32);
  const hoveringRef = useRef(false);
  const clickingRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return undefined;

    const handleMouseMove = (e) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
    };

    const handleOverInteractive = (e) => {
      const target = e.target;
      const isInteractive =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-cursor-magnetic]') ||
        target.closest('[data-cursor-expand]');

      hoveringRef.current = !!isInteractive;
      targetSizeRef.current = target.closest('[data-cursor-expand]')
        ? 80
        : isInteractive
        ? 50
        : 32;

      if (cursorRef.current) {
        cursorRef.current.style.borderColor = hoveringRef.current
          ? 'rgba(196, 18, 48, 0.8)'
          : 'rgba(255, 255, 255, 0.4)';
        cursorRef.current.style.boxShadow = hoveringRef.current
          ? '0 0 30px rgba(196, 18, 48, 0.3)'
          : 'none';
      }
    };

    const handleMouseDown = () => {
      clickingRef.current = true;
      if (cursorRef.current) {
        cursorRef.current.style.backgroundColor = 'rgba(196, 18, 48, 0.15)';
      }
    };

    const handleMouseUp = () => {
      clickingRef.current = false;
      if (cursorRef.current) {
        cursorRef.current.style.backgroundColor = 'transparent';
      }
    };

    const animate = () => {
      const curr = currentRef.current;
      const target = targetRef.current;

      curr.x += (target.x - curr.x) * 0.12;
      curr.y += (target.y - curr.y) * 0.12;

      sizeRef.current += (targetSizeRef.current - sizeRef.current) * 0.12;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(${target.x}px, ${target.y}px)`;
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${curr.x}px, ${curr.y}px)`;
        cursorRef.current.style.width = `${sizeRef.current}px`;
        cursorRef.current.style.height = `${sizeRef.current}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleOverInteractive);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleOverInteractive);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border transition-colors duration-200"
        style={{
          width: 32,
          height: 32,
          marginLeft: -16,
          marginTop: -16,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={cursorDotRef}
        className="custom-cursor fixed top-0 left-0 pointer-events-none z-[9998] w-1 h-1 rounded-full bg-white"
        style={{ marginLeft: -2, marginTop: -2 }}
      />
      <style>{`
        @media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
          .custom-cursor { display: none !important; }
        }
      `}</style>
    </>
  );
}
