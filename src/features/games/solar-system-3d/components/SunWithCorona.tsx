'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SunWithCoronaProps {
  texture: THREE.Texture;
}

export function SunWithCorona({ texture }: SunWithCoronaProps) {
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
    }
  });

  return (
    <group>
      {/* Sun sphere with texture */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ff8c00"
          emissiveIntensity={1.2}
        />
      </mesh>
      {/* Corona glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={4} color="#fff5c0" distance={80} decay={2} />
    </group>
  );
}
