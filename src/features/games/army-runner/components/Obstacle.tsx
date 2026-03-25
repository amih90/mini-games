'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ObstacleSegment } from '../useArmyRunnerGame';

interface ObstacleProps {
  obstacle: ObstacleSegment;
}

function RotatingBar({ z }: { z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 2.5;
  });
  return (
    <mesh ref={ref} position={[0, 0.6, z]}>
      <boxGeometry args={[5, 0.3, 0.3]} />
      <meshStandardMaterial color="#cc3333" />
    </mesh>
  );
}

function MovingWall({ z }: { z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    if (ref.current) {
      timeRef.current += delta * 2;
      ref.current.position.x = Math.sin(timeRef.current) * 2.5;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.5, z]}>
      <boxGeometry args={[2, 1, 0.4]} />
      <meshStandardMaterial color="#cc5500" />
    </mesh>
  );
}

function SawBlade({ z }: { z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 6;
  });
  return (
    <group position={[0, 0.6, z]}>
      <mesh ref={ref}>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 16]} />
        <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function NarrowPassage({ z }: { z: number }) {
  const gapWidth = 2.0;
  const wallWidth = 2.5;
  return (
    <group position={[0, 0.5, z]}>
      <mesh position={[-(gapWidth / 2 + wallWidth / 2), 0, 0]}>
        <boxGeometry args={[wallWidth, 1.2, 0.5]} />
        <meshStandardMaterial color="#884400" />
      </mesh>
      <mesh position={[gapWidth / 2 + wallWidth / 2, 0, 0]}>
        <boxGeometry args={[wallWidth, 1.2, 0.5]} />
        <meshStandardMaterial color="#884400" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[gapWidth, 0.15, 0.5]} />
        <meshStandardMaterial color="#ffaa00" />
      </mesh>
    </group>
  );
}

export function Obstacle({ obstacle }: ObstacleProps) {
  switch (obstacle.kind) {
    case 'rotating-bar': return <RotatingBar z={obstacle.z} />;
    case 'moving-wall': return <MovingWall z={obstacle.z} />;
    case 'saw-blade': return <SawBlade z={obstacle.z} />;
    case 'narrow-passage': return <NarrowPassage z={obstacle.z} />;
    default: return null;
  }
}
