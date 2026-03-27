'use client';

import { useRef, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface MoonProps {
  earthMeshRef: React.RefObject<THREE.Mesh>;
  texture: THREE.Texture;
  speedMultiplier: number;
  onMoonClick?: () => void;
}

export function Moon({ earthMeshRef, texture, speedMultiplier, onMoonClick }: MoonProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const angle = useRef(0);

  useFrame((_, delta) => {
    angle.current += 0.5 * speedMultiplier * delta; // moon orbits faster than planets
    if (meshRef.current && earthMeshRef.current) {
      const ep = earthMeshRef.current.position;
      meshRef.current.position.set(
        ep.x + Math.cos(angle.current) * 1.4,
        ep.y,
        ep.z + Math.sin(angle.current) * 1.4,
      );
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onMoonClick?.();
  }, [onMoonClick]);

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial map={texture} roughness={0.9} metalness={0.0} />
      <Html center distanceFactor={5}>
        <div className="text-white text-[10px] bg-black/40 px-1 rounded pointer-events-none whitespace-nowrap">
          🌙
        </div>
      </Html>
    </mesh>
  );
}
