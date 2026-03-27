'use client';

import { useRef, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetWithTextureProps {
  name: string;
  emoji: string;
  radius: number;
  orbitRadius: number;
  speed: number;
  speedMultiplier: number;
  texture: THREE.Texture;
  isGlowing: boolean;
  isCollected: boolean;
  onClick: () => void;
}

export function PlanetWithTexture({
  name, emoji, radius, orbitRadius, speed, speedMultiplier,
  texture, isGlowing, isCollected, onClick,
}: PlanetWithTextureProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    angle.current += speed * speedMultiplier * delta;
    const x = Math.cos(angle.current) * orbitRadius;
    const z = Math.sin(angle.current) * orbitRadius;
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.rotation.y += delta * 0.4;
    }
    if (glowRef.current) {
      glowRef.current.position.set(x, 0, z);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (isGlowing) {
        mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
      }
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isCollected) onClick();
  }, [isCollected, onClick]);

  if (isCollected) return null;

  return (
    <>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          emissive={isGlowing ? new THREE.Color(texture.image ? '#ffffff' : '#888888') : new THREE.Color('#000000')}
          emissiveIntensity={isGlowing ? 0.4 : 0}
          metalness={0.05}
          roughness={0.8}
        />
        {isGlowing && (
          <Html center distanceFactor={8}>
            <div className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full pointer-events-none whitespace-nowrap animate-pulse">
              ✨ {emoji} {name}
            </div>
          </Html>
        )}
      </mesh>
      {isGlowing && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[radius * 1.8, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>
      )}
    </>
  );
}
