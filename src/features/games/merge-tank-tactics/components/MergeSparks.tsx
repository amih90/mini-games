'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MergeSparksProps {
  position: THREE.Vector3;
  onComplete?: () => void;
}

const SPARK_COUNT = 14;

/** Golden sparkle burst played when two tanks merge */
export function MergeSparks({ position, onComplete }: MergeSparksProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const ageRef = useRef(0);
  const completedRef = useRef(false);

  const velocities = useMemo(() => {
    return Array.from({ length: SPARK_COUNT }, (_, i) => {
      const angle = (i / SPARK_COUNT) * Math.PI * 2;
      const speed = 1.2 + Math.random() * 1.5;
      return new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 2,
        Math.sin(angle) * speed
      );
    });
  }, []);

  const positions = useMemo(
    () => Array.from({ length: SPARK_COUNT }, () => position.clone()),
    [position]
  );

  useEffect(() => {
    ageRef.current = 0;
    completedRef.current = false;
    for (let i = 0; i < SPARK_COUNT; i++) {
      positions[i].copy(position);
    }
  }, [position, positions]);

  useFrame((_, delta) => {
    if (completedRef.current) return;
    ageRef.current += delta;
    const t = ageRef.current;
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, i) => {
      if (i >= SPARK_COUNT) return;
      const mesh = child as THREE.Mesh;
      positions[i].addScaledVector(velocities[i], delta);
      positions[i].y -= 3.5 * delta;
      mesh.position.copy(positions[i]);
      const scale = Math.max(0, 1 - t * 2.0);
      mesh.scale.setScalar(scale);
    });

    if (t > 0.6 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: SPARK_COUNT }, (_, i) => (
        <mesh key={i} position={position.toArray() as [number, number, number]}>
          <octahedronGeometry args={[0.07 + (i % 2) * 0.04, 0]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#ffa500"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
