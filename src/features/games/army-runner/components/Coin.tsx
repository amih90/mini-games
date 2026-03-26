'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CoinSegment } from '../useArmyRunnerGame';

interface CoinProps {
  coin: CoinSegment;
}

export function Coin({ coin }: CoinProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current) {
      timeRef.current += delta;
      groupRef.current.rotation.y += delta * 2;
      groupRef.current.position.y = 0.5 + Math.sin(timeRef.current * 2) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[coin.x, 0.5, coin.z]}>
      {/* Main coin body */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 24]} />
        <meshStandardMaterial
          color="#ffdd00"
          metalness={0.8}
          roughness={0.2}
          emissive="#ffaa00"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Embossed inner disc — front */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.01, 24]} />
        <meshStandardMaterial
          color="#ffcc00"
          metalness={0.9}
          roughness={0.15}
          emissive="#ffaa00"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Embossed inner disc — back */}
      <mesh position={[0, -0.035, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.01, 24]} />
        <meshStandardMaterial
          color="#ffcc00"
          metalness={0.9}
          roughness={0.15}
          emissive="#ffaa00"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Glow light */}
      <pointLight color="#ffdd00" intensity={0.5} distance={2} />
    </group>
  );
}
