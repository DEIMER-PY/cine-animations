import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ProjectorWorld() {
  const dustRef = useRef(null);
  const ringsRef = useRef(null);
  const positions = useMemo(() => {
    const array = new Float32Array(220 * 3);
    for (let index = 0; index < 220; index += 1) {
      array[index * 3] = (Math.random() - .5) * 16;
      array[index * 3 + 1] = (Math.random() - .5) * 9;
      array[index * 3 + 2] = (Math.random() - .5) * 8;
    }
    return array;
  }, []);

  useFrame(({ clock, pointer }) => {
    const time = clock.getElapsedTime();
    if (dustRef.current) {
      dustRef.current.rotation.y = time * .018;
      dustRef.current.rotation.x = pointer.y * .025;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z = time * .035;
      ringsRef.current.position.x += (pointer.x * .45 - ringsRef.current.position.x) * .025;
      ringsRef.current.position.y += (pointer.y * .2 - ringsRef.current.position.y) * .025;
    }
  });

  return <>
    <points ref={dustRef}><bufferGeometry><bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} /></bufferGeometry><pointsMaterial color="#e3c77a" size={.025} transparent opacity={.55} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    <group ref={ringsRef} position={[3.8, .3, -1]} rotation={[1.15, .15, 0]}>{[1.2, 1.8, 2.45].map((radius, index) => <mesh key={radius}><torusGeometry args={[radius, .006 + index * .003, 8, 96]} /><meshBasicMaterial color={index === 1 ? '#c41230' : '#c9a84c'} transparent opacity={.18 - index * .03} /></mesh>)}</group>
    <spotLight position={[5, 2, 5]} color="#d8c18b" intensity={2.2} angle={.24} penumbra={1} distance={18} />
  </>;
}

export default function HeroAtmosphere3D() {
  const containerRef = useRef(null);
  const [active, setActive] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const capable = window.innerWidth > 900 && (navigator.deviceMemory == null || navigator.deviceMemory >= 4);
    setAvailable(!reduced && capable);
  }, []);
  useEffect(() => {
    if (!available || !containerRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: .02 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [available]);

  if (!available) return null;
  return <div ref={containerRef} className="hero-atmosphere-3d" aria-hidden="true"><Canvas frameloop={active ? 'always' : 'never'} dpr={[1, 1.25]} camera={{ position: [0, 0, 6], fov: 50 }} gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}><ProjectorWorld /></Canvas></div>;
}
