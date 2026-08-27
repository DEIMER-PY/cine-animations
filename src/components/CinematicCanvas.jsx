import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  ContactShadows,
  Float,
  Preload,
} from '@react-three/drei';
import * as THREE from 'three';
import { useMovies } from '../hooks/useMovies';
import { useStore } from '../store/useStore';
import MovieCard3D from './MovieCard3D';

function CameraController() {
  const { camera } = useThree();
  const mousePosition = useStore((s) => s.mousePosition);
  const targetRef = useRef(new THREE.Vector3(0, 0, 8));
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const targetX = mousePosition.x * 0.3;
    const targetY = mousePosition.y * 0.15;

    targetRef.current.x += (targetX - targetRef.current.x) * 0.03;
    targetRef.current.y += (targetY - targetRef.current.y) * 0.03;

    camera.position.x += (targetRef.current.x - camera.position.x) * 0.02;
    camera.position.y += (targetRef.current.y - camera.position.y) * 0.02;
    camera.lookAt(lookAtRef.current);
  });

  return null;
}

function FloatingLights() {
  const light1Ref = useRef();
  const light2Ref = useRef();
  const light3Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (light1Ref.current) {
      light1Ref.current.position.x = Math.sin(t * 0.3) * 5;
      light1Ref.current.position.y = Math.cos(t * 0.2) * 3;
      light1Ref.current.intensity = 1.5 + Math.sin(t * 0.5) * 0.5;
    }
    if (light2Ref.current) {
      light2Ref.current.position.x = Math.cos(t * 0.4) * 4;
      light2Ref.current.position.z = Math.sin(t * 0.3) * 5;
    }
    if (light3Ref.current) {
      light3Ref.current.position.y = Math.sin(t * 0.6) * 2 + 2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight
        ref={light1Ref}
        position={[3, 2, 4]}
        color="#e50914"
        intensity={1.5}
        distance={20}
      />
      <pointLight
        ref={light2Ref}
        position={[-3, 1, -2]}
        color="#00f0ff"
        intensity={1}
        distance={15}
      />
      <pointLight
        ref={light3Ref}
        position={[0, 3, 0]}
        color="#d4a017"
        intensity={0.8}
        distance={12}
      />
      <spotLight
        position={[0, 8, 0]}
        angle={0.3}
        penumbra={0.8}
        intensity={0.5}
        color="#ffffff"
        castShadow
      />
    </>
  );
}

function ParticleField() {
  const count = 200;
  const meshRef = useRef();

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 0.02 + 0.005;
    }
    return [pos, sz];
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const posArr = meshRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += Math.sin(t + i * 0.1) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#d4a017"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function MovieGrid({ movies }) {
  const columns = Math.min(movies.length, 4);
  const spacing = 2.8;

  return (
    <group>
      {movies.map((movie, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = (col - (columns - 1) / 2) * spacing;
        const y = -row * spacing + 2;
        const z = Math.sin(col * 0.5 + row * 0.3) * 0.5;

        return (
          <Float
            key={movie.id}
            speed={1.5 + ((index * 7 + 3) % 5) * 0.1}
            rotationIntensity={0.1}
            floatIntensity={0.3}
            floatingRange={[-0.05, 0.05]}
          >
            <MovieCard3D
              movie={movie}
              position={[x, y, z]}
              index={index}
            />
          </Float>
        );
      })}
    </group>
  );
}

function Scene() {
  const { movies, loading } = useMovies('trending');

  if (loading) return null;

  return (
    <>
      <CameraController />
      <FloatingLights />
      <ParticleField />
      <MovieGrid movies={movies.slice(0, 12)} />
      <ContactShadows
        position={[0, -5, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={6}
        color="#000000"
      />
    </>
  );
}

export default function CinematicCanvas() {
  return (
    <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-white/5 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-cinema-black/20 via-transparent to-cinema-black/40 pointer-events-none z-10 rounded-2xl" />
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        shadows
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 8, 25]} />
        <Suspense fallback={null}>
          <Scene />
          <Environment preset="night" />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
