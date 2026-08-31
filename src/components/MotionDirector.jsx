import { useEffect } from 'react';
import gsap from 'gsap';
import { useLocation } from 'react-router-dom';

export default function MotionDirector() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return undefined;
    let active = null;
    const touched = new Set();
    let xTo = null;
    let yTo = null;
    const reset = (target) => gsap.to(target, { x: 0, y: 0, scale: 1, rotationX: 0, rotationY: 0, duration: .55, ease: 'power3.out', overwrite: true });
    const over = (event) => {
      const target = event.target.closest('[data-motion]');
      if (!target || target === active) return;
      if (active) reset(active);
      active = target;
      touched.add(target);
      xTo = gsap.quickTo(target, 'x', { duration: .35, ease: 'power3.out' });
      yTo = gsap.quickTo(target, 'y', { duration: .35, ease: 'power3.out' });
      if (target.dataset.motion === 'lift') gsap.to(target, { y: -7, rotationX: 1.5, scale: 1.015, duration: .45, ease: 'power3.out', overwrite: 'auto' });
    };
    const move = (event) => {
      if (!active || active.dataset.motion !== 'magnetic') return;
      const rect = active.getBoundingClientRect();
      xTo?.((event.clientX - (rect.left + rect.width / 2)) * .16);
      yTo?.((event.clientY - (rect.top + rect.height / 2)) * .18);
    };
    const out = (event) => { if (!active || active.contains(event.relatedTarget)) return; reset(active); active = null; };
    const down = (event) => { const target = event.target.closest('[data-motion]'); if (target) { touched.add(target); gsap.to(target, { scale: .965, duration: .12, ease: 'power2.out', overwrite: true }); } };
    const up = (event) => { const target = event.target.closest('[data-motion]'); if (target) { touched.add(target); gsap.to(target, { scale: 1, duration: .35, ease: 'back.out(2)', overwrite: true }); } };
    document.addEventListener('pointerover', over); document.addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerout', out); document.addEventListener('pointerdown', down); document.addEventListener('pointerup', up);
    return () => { document.removeEventListener('pointerover', over); document.removeEventListener('pointermove', move); document.removeEventListener('pointerout', out); document.removeEventListener('pointerdown', down); document.removeEventListener('pointerup', up); touched.forEach((target) => { gsap.killTweensOf(target); gsap.set(target, { clearProps: 'transform' }); }); touched.clear(); };
  }, [pathname]);
  return null;
}
