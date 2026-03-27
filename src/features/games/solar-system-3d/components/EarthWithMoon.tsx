'use client';

import { useRef, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface EarthWithMoonProps {
  radius: number;
  orbitRadius: number;
  speed: number;
  speedMultiplier: number;
  earthTexture: THREE.Texture;
  moonTexture: THREE.Texture;
  isGlowing: boolean;
  isCollected: boolean;
  onClick: () => void;
}

export function EarthWithMoon({
  radius, orbitRadius, speed, speedMultiplier,
  earthTexture, moonTexture,
  isGlowing, isCollected, onClick,
}: EarthWithMoonProps) {
  const groupRef = useRef<THREE.Group>(null!); // Earth + Moon group at orbit position
  const earthRef = useRef<THREE.Mesh>(null!);
  const moonRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const earthAngle = useRef(Math.random() * Math.PI * 2);
  const moonAngle = useRef(0);

  useFrame((state, delta) => {
    earthAngle.current += speed * speedMultiplier * delta;
    moonAngle.current += 0.8 * speedMultiplier * delta;

    const ex = Math.cos(earthAngle.current) * orbitRadius;
    const ez = Math.sin(earthAngle.current) * orbitRadius;

    if (groupRef.current) groupRef.current.position.set(ex, 0, ez);
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.3;

    if (moonRef.current) {
      moonRef.current.position.set(
        Math.cos(moonAngle.current) * 1.4,
        0,
        Math.sin(moonAngle.current) * 1.4,
      );
    }
    if (glowRef.current) {
      glowRef.current.position.set(0, 0, 0);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (isGlowing) mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isCollected) onClick();
  }, [isCollected, onClick]);

  if (isCollected) return null;

  return (
    <group ref={groupRef}>
      {/* Earth */}
      <mesh ref={earthRef} onClick={handleClick}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          map={earthTexture}
          emissive={isGlowing ? '#ffffff' : '#000000'}
          emissiveIntensity={isGlowing ? 0.35 : 0}
          roughness={0.7}
          metalness={0.05}
        />
        {isGlowing && (
          <Html center distanceFactor={8}>
            <div className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full pointer-events-none whitespace-nowrap animate-pulse">
              ✨ 🌍 Earth
            </div>
          </Html>
        )}
      </mesh>
      {/* Moon */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial map={moonTexture} roughness={0.9} />
        <Html center distanceFactor={4}>
          <div className="text-white text-[9px] bg-black/40 px-1 rounded pointer-events-none whitespace-nowrap">
            🌙
          </div>
        </Html>
      </mesh>
      {isGlowing && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[radius * 1.8, 16, 16]} />
          <meshBasicMaterial color="#88aaff" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}
