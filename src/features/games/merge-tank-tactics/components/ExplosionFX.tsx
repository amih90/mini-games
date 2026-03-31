'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionFXProps {
  position: THREE.Vector3;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 18;

/** Orange/red particle burst used when a tank is destroyed */
export function ExplosionFX({ position, onComplete }: ExplosionFXProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const ageRef = useRef(0);
  const completedRef = useRef(false);

  // Initial velocities for each particle
  const velocities = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      return new THREE.Vector3(
        Math.cos(angle) * speed,
        1.5 + Math.random() * 3,
        Math.sin(angle) * speed
      );
    });
  }, []);

  const positions = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, () => position.clone()),
    [position]
  );

  useEffect(() => {
    ageRef.current = 0;
    completedRef.current = false;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i].copy(position);
    }
  }, [position, positions]);

  useFrame((_, delta) => {
    if (completedRef.current) return;
    ageRef.current += delta;
    const t = ageRef.current;
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, i) => {
      if (i >= PARTICLE_COUNT) return;
      const mesh = child as THREE.Mesh;
      positions[i].addScaledVector(velocities[i], delta);
      positions[i].y -= 4 * delta; // gravity
      mesh.position.copy(positions[i]);
      const scale = Math.max(0, 1 - t * 1.8);
      mesh.scale.setScalar(scale);
    });

    if (t > 0.7 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <mesh key={i} position={position.toArray() as [number, number, number]}>
          <sphereGeometry args={[0.09 + (i % 3) * 0.04, 4, 4]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#ff4500' : i % 3 === 1 ? '#ff8c00' : '#ffff00'}
            emissive={i % 3 === 0 ? '#ff2200' : '#ff6600'}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
