'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface CarProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  speed?: number;
  isPlayer?: boolean;
  number?: number;
}

/**
 * Pixar-style cartoon car — rounded body, cylinder wheels, googly eyes.
 * No GLTF models needed — all procedural geometry.
 */
export function Car({
  position,
  rotation,
  color,
  speed = 0,
  isPlayer = false,
}: CarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelFLRef = useRef<THREE.Mesh>(null);
  const wheelFRRef = useRef<THREE.Mesh>(null);
  const wheelBLRef = useRef<THREE.Mesh>(null);
  const wheelBRRef = useRef<THREE.Mesh>(null);

  // Spin wheels based on speed
  useFrame((_, delta) => {
    const spinRate = speed * delta * 8;
    [wheelFLRef, wheelFRRef, wheelBLRef, wheelBRRef].forEach((ref) => {
      if (ref.current) ref.current.rotation.x += spinRate;
    });
  });

  const wheelY = -0.2;
  const wheelZ_front = 0.55;
  const wheelZ_back = -0.55;
  const wheelX = 0.5;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main body — rounded box */}
      <RoundedBox args={[1.1, 0.4, 1.6]} radius={0.12} smoothness={4} castShadow position={[0, 0.1, 0]}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </RoundedBox>

      {/* Cabin / roof — smaller rounded box */}
      <RoundedBox args={[0.85, 0.32, 0.8]} radius={0.1} smoothness={4} castShadow position={[0, 0.38, -0.1]}>
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.15} />
      </RoundedBox>

      {/* Windshield */}
      <mesh position={[0, 0.35, 0.3]} rotation={[0.3, 0, 0]}>
        <planeGeometry args={[0.7, 0.28]} />
        <meshStandardMaterial color="#b3e5fc" transparent opacity={0.7} roughness={0.1} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Googly eyes — Pixar style (player car only) */}
      {isPlayer && (
        <group position={[0, 0.4, 0.42]}>
          {/* Left eye */}
          <mesh position={[-0.15, 0, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.15, 0.01, 0.07]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Right eye */}
          <mesh position={[0.15, 0, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.15, 0.01, 0.07]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      )}

      {/* Smile (player car) */}
      {isPlayer && (
        <mesh position={[0, 0.22, 0.81]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.12, 0.02, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      )}

      {/* Headlights */}
      <mesh position={[-0.35, 0.1, 0.8]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.35, 0.1, 0.8]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.5} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.35, 0.1, -0.82]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.35, 0.1, -0.82]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={0.4} />
      </mesh>

      {/* Spoiler (racing style) */}
      <mesh position={[0, 0.45, -0.75]} castShadow>
        <boxGeometry args={[0.9, 0.04, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Spoiler supports */}
      <mesh position={[-0.3, 0.35, -0.72]}>
        <boxGeometry args={[0.04, 0.15, 0.04]} />
        <meshStandardMaterial color="#444" metalness={0.7} />
      </mesh>
      <mesh position={[0.3, 0.35, -0.72]}>
        <boxGeometry args={[0.04, 0.15, 0.04]} />
        <meshStandardMaterial color="#444" metalness={0.7} />
      </mesh>

      {/* Wheels */}
      {[
        { ref: wheelFLRef, pos: [-wheelX, wheelY, wheelZ_front] as [number, number, number] },
        { ref: wheelFRRef, pos: [wheelX, wheelY, wheelZ_front] as [number, number, number] },
        { ref: wheelBLRef, pos: [-wheelX, wheelY, wheelZ_back] as [number, number, number] },
        { ref: wheelBRRef, pos: [wheelX, wheelY, wheelZ_back] as [number, number, number] },
      ].map(({ ref, pos }, i) => (
        <group key={i} position={pos}>
          <mesh ref={ref} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
            <meshStandardMaterial color="#222" roughness={0.7} />
          </mesh>
          {/* Hubcap */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[i % 2 === 0 ? -0.07 : 0.07, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 12]} />
            <meshStandardMaterial color="#999" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Car color presets for AI opponents ──────────────────────
export const AI_CAR_COLORS = [
  '#e53935', // red
  '#1e88e5', // blue
  '#43a047', // green
  '#fb8c00', // orange
  '#8e24aa', // purple
  '#00acc1', // teal
  '#f4511e', // deep orange
  '#3949ab', // indigo
  '#c0ca33', // lime
  '#d81b60', // pink
];
