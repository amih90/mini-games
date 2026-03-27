'use client';

import { Suspense, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ─── Car types with distinct silhouettes ─────────────────────
export type CarType = 'stock' | 'formula' | 'muscle';

export const CAR_TYPE_LABELS: Record<string, Record<CarType, string>> = {
  en: { stock: 'Stock Car', formula: 'Formula', muscle: 'Muscle Car' },
  he: { stock: 'מכונית מירוץ', formula: 'פורמולה', muscle: 'מאסל קאר' },
  zh: { stock: '方程式赛车', formula: '一级方程式', muscle: '肌肉车' },
  es: { stock: 'Stock Car', formula: 'Fórmula', muscle: 'Muscle Car' },
};

// ─── Player color presets ────────────────────────────────────
export const PLAYER_COLORS = [
  { hex: '#ffeb3b', name: 'Yellow' },
  { hex: '#e53935', name: 'Red' },
  { hex: '#1e88e5', name: 'Blue' },
  { hex: '#43a047', name: 'Green' },
  { hex: '#fb8c00', name: 'Orange' },
  { hex: '#8e24aa', name: 'Purple' },
  { hex: '#f5f5f5', name: 'White' },
  { hex: '#212121', name: 'Black' },
  { hex: '#d81b60', name: 'Pink' },
  { hex: '#00acc1', name: 'Teal' },
];

// ─── Model paths ─────────────────────────────────────────────
const MODEL_PATHS: Record<CarType, string> = {
  stock: '/models/cars/stock.glb',
  formula: '/models/cars/formula.glb',
  muscle: '/models/cars/muscle.glb',
};

// Preload all models on module load
Object.values(MODEL_PATHS).forEach((path) => useGLTF.preload(path));

interface CarProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  speed?: number;
  isPlayer?: boolean;
  carNumber?: number;
  braking?: boolean;
  drafting?: boolean;
  carType?: CarType;
}

/**
 * glTF race car loaded from Kenney Car Kit (CC0).
 * Applies player color to body, spins wheel nodes,
 * brake glow, exhaust sparkles, draft shimmer.
 */
function CarModel({
  color,
  speed = 0,
  isPlayer = false,
  carNumber = 0,
  braking = false,
  drafting = false,
  carType = 'stock',
}: Omit<CarProps, 'position' | 'rotation'>) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATHS[carType]);

  // Clone so each car instance gets its own materials
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    // Scale Kenney models to ~1.8 units long
    cloned.scale.setScalar(0.9);
    // Rotate 180° so car faces +Z (forward direction on track)
    cloned.rotation.y = Math.PI;
    return cloned;
  }, [scene]);

  // Refs to named parts for animation
  const wheelRefs = useRef<THREE.Object3D[]>([]);

  // Find wheel and body nodes on mount
  useEffect(() => {
    const wheels: THREE.Object3D[] = [];
    model.traverse((child) => {
      if (child.name.startsWith('wheel-')) {
        wheels.push(child);
      }
    });
    wheelRefs.current = wheels;
  }, [model]);

  // Apply clearcoat paint color to body meshes
  useEffect(() => {
    const targetColor = new THREE.Color(color);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && (child.name === 'body' || child.name === 'spoiler')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: targetColor,
          metalness: 0.7,
          roughness: 0.15,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          envMapIntensity: 1.2,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [model, color]);

  // Wheel spin
  useFrame((_, delta) => {
    const spinRate = speed * delta * 12;
    wheelRefs.current.forEach((wheel) => {
      wheel.rotation.x += spinRate;
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={model} />

      {/* Headlight glow */}
      <pointLight position={[0, 0.15, 0.9]} intensity={0.6} color="#fffde7" distance={5} />

      {/* Brake glow */}
      <pointLight position={[0, 0.15, -0.9]} intensity={braking ? 5 : 0} color="#ff1744" distance={4} />

      {/* Taillights */}
      <mesh position={[-0.35, 0.12, -0.85]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={braking ? 3.0 : 0.4} />
      </mesh>
      <mesh position={[0.35, 0.12, -0.85]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={braking ? 3.0 : 0.4} />
      </mesh>

      {/* Player car indicator */}
      {isPlayer && (
        <pointLight position={[0, 1.5, 0]} intensity={3} color="#ffeb3b" distance={4} />
      )}

      {/* Draft shimmer */}
      {drafting && (
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[1.4, 0.5, 2.0]} />
          <meshStandardMaterial color="#e3f2fd" transparent opacity={0.15} emissive="#90caf9" emissiveIntensity={1.0} depthWrite={false} />
        </mesh>
      )}

      {/* Race number on roof */}
      {carNumber > 0 && (
        <Suspense fallback={null}>
          <Text
            position={[0, 0.55, -0.05]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.22}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="black"
          >
            {String(carNumber)}
          </Text>
        </Suspense>
      )}

      {/* Exhaust sparkle plume */}
      {speed > 0.3 && (
        <Sparkles
          count={40}
          scale={[0.8, 0.4, 1.5]}
          size={3}
          speed={0.8}
          color="#999999"
          opacity={0.35}
          position={[0, 0.08, -1.0]}
        />
      )}

      {/* Brake sparks */}
      {braking && speed > 0.5 && (
        <Sparkles
          count={20}
          scale={[1.2, 0.2, 0.4]}
          size={2}
          speed={3}
          color="#ff6600"
          opacity={0.8}
          position={[0, -0.1, -0.6]}
        />
      )}
    </group>
  );
}

/**
 * Car wrapper — positions/rotates the car group, wraps model in Suspense.
 */
export function Car({
  position,
  rotation,
  color,
  speed = 0,
  isPlayer = false,
  carNumber = 0,
  braking = false,
  drafting = false,
  carType = 'stock',
}: CarProps) {
  return (
    <group position={position} rotation={rotation}>
      <Suspense fallback={null}>
        <CarModel
          color={color}
          speed={speed}
          isPlayer={isPlayer}
          carNumber={carNumber}
          braking={braking}
          drafting={drafting}
          carType={carType}
        />
      </Suspense>
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
