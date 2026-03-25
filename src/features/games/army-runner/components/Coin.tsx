'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CoinSegment } from '../useArmyRunnerGame';

interface CoinProps {
  coin: CoinSegment;
}

export function Coin({ coin }: CoinProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 3;
    }
  });

  return (
    <mesh ref={ref} position={[coin.x, 0.5, coin.z]}>
      <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
      <meshStandardMaterial color="#ffdd00" metalness={0.8} roughness={0.2} emissive="#ffaa00" emissiveIntensity={0.3} />
    </mesh>
  );
}
