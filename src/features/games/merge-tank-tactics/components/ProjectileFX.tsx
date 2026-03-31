'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProjectileFXProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color?: string;
  onComplete?: () => void;
}

/** Animated sphere projectile that travels from attacker to target */
export function ProjectileFX({ from, to, color = '#ffdd00', onComplete }: ProjectileFXProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const tmpVec = useRef(new THREE.Vector3());

  useEffect(() => {
    progressRef.current = 0;
    completedRef.current = false;
  }, [from, to]);

  useFrame((_, delta) => {
    if (completedRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 2.2);
    tmpVec.current.lerpVectors(from, to, progressRef.current);
    // Arc trajectory
    tmpVec.current.y += Math.sin(progressRef.current * Math.PI) * 0.8;
    if (meshRef.current) {
      meshRef.current.position.copy(tmpVec.current);
    }
    if (progressRef.current >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return (
    <mesh ref={meshRef} position={from}>
      <sphereGeometry args={[0.12, 6, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        toneMapped={false}
      />
    </mesh>
  );
}
