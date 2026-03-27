'use client';

import { useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NamedStar } from '../data/namedStars';

interface StarObjectProps {
  star: NamedStar;
  skyRadius: number;
  locale: string;
  isSelected: boolean;
  onStarClick: (star: NamedStar) => void;
}

const STAR_SIZES: Record<number, number> = {};

function getStarSize(magnitude: number): number {
  // Brighter (lower magnitude) = larger sprite
  if (magnitude < 0) return 0.8;
  if (magnitude < 0.5) return 0.6;
  if (magnitude < 1.0) return 0.5;
  if (magnitude < 1.5) return 0.4;
  return 0.35;
}

export function StarObject({ star, skyRadius, locale, isSelected, onStarClick }: StarObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const baseScale = getStarSize(star.apparentMagnitude);

  // Convert spherical (theta, phi) to Cartesian
  const x = skyRadius * Math.sin(star.phi) * Math.cos(star.theta);
  const y = skyRadius * Math.cos(star.phi);
  const z = skyRadius * Math.sin(star.phi) * Math.sin(star.theta);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const target = isSelected ? baseScale * 3 : hovered ? baseScale * 2.5 : baseScale;
      const current = meshRef.current.scale.x;
      const next = current + (target - current) * Math.min(delta * 8, 1);
      meshRef.current.scale.setScalar(next);
    }
    if (glowRef.current && isSelected) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.1 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onStarClick(star);
  }, [star, onStarClick]);

  return (
    <group position={[x, y, z]}>
      {/* Glow sphere when selected */}
      {isSelected && (
        <mesh ref={glowRef} scale={baseScale}>
          <sphereGeometry args={[4, 8, 8]} />
          <meshBasicMaterial color={star.color} transparent opacity={0.1} side={THREE.BackSide} />
        </mesh>
      )}
      {/* Ring when selected */}
      {isSelected && (
        <mesh ref={ringRef} scale={baseScale} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3, 0.05, 8, 24]} />
          <meshBasicMaterial color={star.color} transparent opacity={0.6} />
        </mesh>
      )}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={baseScale}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={star.color} />
        {(hovered || isSelected) && (
          <Html center distanceFactor={20}>
            <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap border border-white/20">
              <div className="font-bold">{star.name}</div>
              <div className="text-gray-300">{star.constellation} · {star.distanceLY} ly</div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}
