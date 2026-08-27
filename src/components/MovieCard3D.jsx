import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { TMDB } from '../api/tmdb';
import { useStore } from '../store/useStore';

function PosterMaterial({ posterUrl, isHovered }) {
  const texture = useTexture(posterUrl);
  const materialRef = useRef();

  useFrame(() => {
    if (!materialRef.current) return;
    const target = isHovered ? 1.0 : 0.85;
    materialRef.current.opacity += (target - materialRef.current.opacity) * 0.1;
  });

  return (
    <meshStandardMaterial
      ref={materialRef}
      map={texture}
      transparent
      opacity={0.85}
      side={THREE.DoubleSide}
      roughness={0.4}
      metalness={0.1}
    />
  );
}

function GlowBorder({ isHovered, width, height }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.material.opacity = isHovered
      ? 0.3 + Math.sin(t * 3) * 0.1
      : 0.05;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.01]}>
      <planeGeometry args={[width + 0.12, height + 0.12]} />
      <meshBasicMaterial
        color="#e50914"
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function MovieCard3D({ movie, position, index }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const setSelectedMovie = useStore((s) => s.setSelectedMovie);
  const targetScale = useRef(1);

  const posterUrl = useMemo(
    () => movie.poster_path ? TMDB.poster(movie.poster_path, 'w342') : null,
    [movie.poster_path]
  );

  const width = 1.6;
  const height = 2.4;

  useFrame(() => {
    if (!groupRef.current) return;

    targetScale.current = hovered ? 1.08 : 1;
    groupRef.current.scale.x +=
      (targetScale.current - groupRef.current.scale.x) * 0.1;
    groupRef.current.scale.y +=
      (targetScale.current - groupRef.current.scale.y) * 0.1;
    groupRef.current.scale.z +=
      (targetScale.current - groupRef.current.scale.z) * 0.1;

    if (hovered) {
      groupRef.current.rotation.y +=
        (0 - groupRef.current.rotation.y) * 0.1;
      groupRef.current.rotation.x +=
        (0 - groupRef.current.rotation.x) * 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedMovie(movie);
      }}
    >
      <RoundedBox
        args={[width, height, 0.04]}
        radius={0.03}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.8}
          metalness={0.2}
        />
      </RoundedBox>

      {movie.poster_path && (
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[width - 0.1, height - 0.1]} />
          <PosterMaterial posterUrl={posterUrl} isHovered={hovered} />
        </mesh>
      )}

      <GlowBorder isHovered={hovered} width={width} height={height} />

      <group position={[0, -height / 2 - 0.15, 0.02]}>
        <mesh>
          <planeGeometry args={[width, 0.25]} />
          <meshBasicMaterial color="#0a0a0a" transparent opacity={0.9} />
        </mesh>
      </group>

      {hovered && (
        <pointLight
          position={[0, 0, 1]}
          color="#e50914"
          intensity={2}
          distance={4}
        />
      )}
    </group>
  );
}
