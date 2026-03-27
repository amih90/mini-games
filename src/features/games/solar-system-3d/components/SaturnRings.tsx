'use client';

import * as THREE from 'three';

interface SaturnRingsProps {
  ringTexture: THREE.Texture;
}

export function SaturnRings({ ringTexture }: SaturnRingsProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0.3]}>
      <ringGeometry args={[1.3, 2.2, 64]} />
      <meshBasicMaterial
        map={ringTexture}
        alphaMap={ringTexture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
        color="#e8c97a"
      />
    </mesh>
  );
}
