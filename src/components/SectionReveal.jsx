import { useSectionReveal } from '../hooks/useSectionReveal';

/** Wraps children in a scope and applies GSAP clip-path reveal to any `.reveal` descendants. */
export default function SectionReveal({ children, className = '' }) {
  const ref = useSectionReveal();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
