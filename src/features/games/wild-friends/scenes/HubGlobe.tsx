'use client';

import { useCallback, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense } from 'react';

interface HubGlobeProps {
  completedScenes: string[];
  onSelectScene: (sceneId: string) => void;
}

const CONTINENT_MARKERS = [
  { id: 'africa', position: [0.7, 0.5, 0.5] as [number, number, number], color: '#f59e0b', emoji: '🌍' },
  { id: 'amazon', position: [-0.5, 0.2, 0.8] as [number, number, number], color: '#22c55e', emoji: '🌴' },
  { id: 'arctic', position: [0, 0.95, 0.3] as [number, number, number], color: '#67e8f9', emoji: '❄️' },
  { id: 'australia', position: [0.8, -0.4, -0.4] as [number, number, number], color: '#ef4444', emoji: '🏜️' },
  { id: 'ocean', position: [-0.6, -0.3, -0.7] as [number, number, number], color: '#3b82f6', emoji: '🌊' },
];

function Globe() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#4ade80" roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

function ContinentMarker({
  position,
  color,
  completed,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  completed: boolean;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={completed ? '#fbbf24' : color}
        emissive={completed ? '#fbbf24' : color}
        emissiveIntensity={completed ? 0.5 : 0.2}
      />
    </mesh>
  );
}

function GlobeScene({ completedScenes, onSelectScene }: HubGlobeProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Globe />
      {CONTINENT_MARKERS.map((marker) => (
        <ContinentMarker
          key={marker.id}
          position={marker.position}
          color={marker.color}
          completed={completedScenes.includes(marker.id)}
          onClick={() => onSelectScene(marker.id)}
        />
      ))}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(3 * Math.PI) / 4}
      />
    </>
  );
}

export function HubGlobe({ completedScenes, onSelectScene }: HubGlobeProps) {
  return (
    <div className="w-full aspect-square max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl">
      <Suspense
        fallback={
          <div className="w-full h-full bg-gradient-to-b from-sky-300 to-blue-500 flex items-center justify-center">
            <span className="text-4xl animate-spin">🌍</span>
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <GlobeScene
            completedScenes={completedScenes}
            onSelectScene={onSelectScene}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
