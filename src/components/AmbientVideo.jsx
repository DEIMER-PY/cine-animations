import { useEffect, useState } from 'react';

export default function AmbientVideo({ className = '', webm, mp4, poster, ...props }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 769px) and (prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(query.matches && (navigator.deviceMemory == null || navigator.deviceMemory >= 4));
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  if (!enabled) return null;
  return <video className={className} autoPlay muted loop playsInline preload="metadata" poster={poster} {...props}><source src={webm} type="video/webm" /><source src={mp4} type="video/mp4" /></video>;
}
