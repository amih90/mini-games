'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────

interface CauldronProps {
  potionColors: string[];
  heatLevel: number;
  isBrewing: boolean;
}

// ─── Color Mixing Helper ─────────────────────────────────────

function mixColors(colors: string[]): THREE.Color {
  if (colors.length === 0) return new THREE.Color('#1a4a2a');
  const result = new THREE.Color(colors[0]);
  for (let i = 1; i < colors.length; i++) {
    result.lerp(new THREE.Color(colors[i]), 1 / (i + 1));
  }
  return result;
}

// ─── Bubble ──────────────────────────────────────────────────

interface BubbleData {
  x: number;
  z: number;
  radius: number;
  speed: number;
  phase: number;
}

function Bubbles({
  liquidColor,
  heatLevel,
  isBrewing,
}: {
  liquidColor: THREE.Color;
  heatLevel: number;
  isBrewing: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const bubbles = useMemo<BubbleData[]>(() => {
    return Array.from({ length: 10 }, () => ({
      x: (Math.random() - 0.5) * 1.4,
      z: (Math.random() - 0.5) * 1.4,
      radius: 0.03 + Math.random() * 0.05,
      speed: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const activity = heatLevel * (isBrewing ? 1.8 : 1);

    groupRef.current.children.forEach((child, i) => {
      const b = bubbles[i];
      const cycle = ((t * b.speed * activity + b.phase) % 1.2);
      child.position.set(
        b.x + Math.sin(t * 2 + b.phase) * 0.05,
        1.3 + cycle * 0.5,
        b.z + Math.cos(t * 2 + b.phase) * 0.05,
      );
      const scale = cycle < 0.1 ? cycle / 0.1 : cycle > 1.0 ? 1 - (cycle - 1.0) / 0.2 : 1;
      child.scale.setScalar(Math.max(scale * activity, 0.01));
    });
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((b, i) => (
        <mesh key={i} position={[b.x, 1.3, b.z]}>
          <sphereGeometry args={[b.radius, 8, 8]} />
          <meshStandardMaterial
            color={liquidColor}
            emissive={liquidColor}
            emissiveIntensity={0.6}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Steam Wisps ─────────────────────────────────────────────

function SteamWisps({ heatLevel }: { heatLevel: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const wisps = useMemo(() => {
    return Array.from({ length: 5 }, () => ({
      x: (Math.random() - 0.5) * 0.8,
      z: (Math.random() - 0.5) * 0.8,
      speed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    groupRef.current.children.forEach((child, i) => {
      const w = wisps[i];
      const cycle = (t * w.speed + w.phase) % 2.5;
      const rise = cycle * 0.6;
      const fadeProgress = cycle / 2.5;

      child.position.set(
        w.x + Math.sin(t + w.phase) * 0.2 * fadeProgress,
        1.6 + rise,
        w.z + Math.cos(t * 0.7 + w.phase) * 0.15 * fadeProgress,
      );

      const scale = 0.08 + fadeProgress * 0.25;
      child.scale.setScalar(scale * heatLevel);

      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = Math.max(0, (1 - fadeProgress) * 0.35 * heatLevel);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {wisps.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#cccccc"
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Cauldron ────────────────────────────────────────────────

export function Cauldron({ potionColors, heatLevel, isBrewing }: CauldronProps) {
  const liquidRef = useRef<THREE.Mesh>(null);
  const liquidColor = useMemo(() => mixColors(potionColors), [potionColors]);

  // Leg positions (spread 120° apart)
  const legAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

  useFrame(({ clock }) => {
    if (!liquidRef.current) return;
    const t = clock.getElapsedTime();
    const amplitude = isBrewing ? 0.06 : 0.015;
    const speed = isBrewing ? 3 : 1.5;
    liquidRef.current.position.y = 1.3 + Math.sin(t * speed) * amplitude * heatLevel;
    liquidRef.current.rotation.x = Math.sin(t * 0.8) * 0.02 * heatLevel;
    liquidRef.current.rotation.z = Math.cos(t * 0.6) * 0.02 * heatLevel;
  });

  const ironMaterial = {
    color: '#333333',
    metalness: 0.8,
    roughness: 0.3,
  } as const;

  return (
    <group position={[0, 0, 0]}>
      {/* ── Bowl (hemisphere facing up) ──────────────── */}
      <mesh position={[0, 1, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...ironMaterial} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Rim torus ────────────────────────────────── */}
      <mesh position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.08, 12, 32]} />
        <meshStandardMaterial {...ironMaterial} />
      </mesh>

      {/* ── Stand Legs ───────────────────────────────── */}
      {legAngles.map((angle, i) => {
        const legX = Math.sin(angle) * 0.6;
        const legZ = Math.cos(angle) * 0.6;
        const tiltX = Math.cos(angle) * 0.2;
        const tiltZ = -Math.sin(angle) * 0.2;
        return (
          <mesh
            key={`leg-${i}`}
            position={[legX, 0.4, legZ]}
            rotation={[tiltX, 0, tiltZ]}
          >
            <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.4} />
          </mesh>
        );
      })}

      {/* ── Base Ring ────────────────────────────────── */}
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.04, 8, 24]} />
        <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ── Liquid Surface ───────────────────────────── */}
      <mesh ref={liquidRef} position={[0, 1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshStandardMaterial
          color={liquidColor}
          emissive={liquidColor}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* ── Bubbles ──────────────────────────────────── */}
      <Bubbles
        liquidColor={liquidColor}
        heatLevel={heatLevel}
        isBrewing={isBrewing}
      />

      {/* ── Steam Wisps ──────────────────────────────── */}
      <SteamWisps heatLevel={heatLevel} />
    </group>
  );
}
