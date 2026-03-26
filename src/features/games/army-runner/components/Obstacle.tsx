'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ObstacleSegment } from '../useArmyRunnerGame';

interface ObstacleProps {
  obstacle: ObstacleSegment;
}

function RotatingBar({ z }: { z: number }) {
  const barRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (barRef.current) barRef.current.rotation.y += delta * 2.5;
  });
  return (
    <group position={[0, 0, z]}>
      {/* Central support pillar */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 12]} />
        <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rotating bar assembly */}
      <group ref={barRef} position={[0, 0.6, 0]}>
        {/* Main bar */}
        <mesh>
          <boxGeometry args={[5, 0.35, 0.35]} />
          <meshStandardMaterial
            color="#cc2222"
            emissive="#880000"
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Yellow hazard end cap — left */}
        <mesh position={[-2.35, 0, 0]}>
          <boxGeometry args={[0.3, 0.36, 0.36]} />
          <meshStandardMaterial color="#ffcc00" />
        </mesh>
        {/* Yellow hazard end cap — right */}
        <mesh position={[2.35, 0, 0]}>
          <boxGeometry args={[0.3, 0.36, 0.36]} />
          <meshStandardMaterial color="#ffcc00" />
        </mesh>
      </group>
    </group>
  );
}

function MovingWall({ z }: { z: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    timeRef.current += delta * 2;
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(timeRef.current) * 2.5;
    }
    if (lightRef.current) {
      const mat = lightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(timeRef.current * 4) * 0.5;
    }
  });
  return (
    <group ref={groupRef} position={[0, 0, z]}>
      {/* Concrete barrier body — slightly trapezoidal (wider bottom) */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[2.2, 0.7, 0.5]} />
        <meshStandardMaterial color="#888888" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.8, 0.4, 0.45]} />
        <meshStandardMaterial color="#888888" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Hazard stripes on front face */}
      <mesh position={[0, 0.55, 0.26]}>
        <boxGeometry args={[1.6, 0.08, 0.01]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <mesh position={[0, 0.75, 0.26]}>
        <boxGeometry args={[1.4, 0.08, 0.01]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      {/* Flashing red warning light on top */}
      <mesh ref={lightRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

function SawBlade({ z }: { z: number }) {
  const spinRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.z += delta * 8;
  });
  return (
    <group position={[0, 0.6, z]}>
      <group ref={spinRef}>
        {/* Main disc */}
        <mesh>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 24]} />
          <meshStandardMaterial
            color="#999999"
            metalness={0.8}
            roughness={0.2}
            emissive="#ff4400"
            emissiveIntensity={0.15}
          />
        </mesh>
        {/* Outer teeth ring */}
        <mesh>
          <torusGeometry args={[1.25, 0.08, 8, 24]} />
          <meshStandardMaterial
            color="#555555"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
      </group>
      {/* Center hub */}
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 12]} />
        <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Inner ring detail */}
      <mesh>
        <torusGeometry args={[0.15, 0.03, 8, 16]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function NarrowPassage({ z }: { z: number }) {
  const gapWidth = 2.0;
  const wallWidth = 2.5;
  return (
    <group position={[0, 0.5, z]}>
      {/* Left concrete wall */}
      <mesh position={[-(gapWidth / 2 + wallWidth / 2), 0, 0]}>
        <boxGeometry args={[wallWidth, 1.2, 0.5]} />
        <meshStandardMaterial color="#666666" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Right concrete wall */}
      <mesh position={[gapWidth / 2 + wallWidth / 2, 0, 0]}>
        <boxGeometry args={[wallWidth, 1.2, 0.5]} />
        <meshStandardMaterial color="#666666" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Top warning bar spanning the gap */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[gapWidth, 0.15, 0.5]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff6600"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Warning chevron post — left */}
      <mesh position={[-(gapWidth / 2 - 0.08), 0, 0.28]}>
        <boxGeometry args={[0.06, 1.0, 0.06]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <mesh position={[-(gapWidth / 2 - 0.08), 0.15, 0.28]}>
        <boxGeometry args={[0.07, 0.12, 0.07]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[-(gapWidth / 2 - 0.08), -0.15, 0.28]}>
        <boxGeometry args={[0.07, 0.12, 0.07]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      {/* Warning chevron post — right */}
      <mesh position={[gapWidth / 2 - 0.08, 0, 0.28]}>
        <boxGeometry args={[0.06, 1.0, 0.06]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <mesh position={[gapWidth / 2 - 0.08, 0.15, 0.28]}>
        <boxGeometry args={[0.07, 0.12, 0.07]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[gapWidth / 2 - 0.08, -0.15, 0.28]}>
        <boxGeometry args={[0.07, 0.12, 0.07]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      {/* Bollard — inner left corner */}
      <mesh position={[-(gapWidth / 2 - 0.15), -0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Bollard — inner right corner */}
      <mesh position={[gapWidth / 2 - 0.15, -0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.3} roughness={0.6} />
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
