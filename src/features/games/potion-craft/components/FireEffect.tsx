'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────

interface FlameData {
  x: number;
  z: number;
  baseRadius: number;
  baseHeight: number;
  phaseOffset: number;
  speed: number;
}

// ─── Fire Effect ─────────────────────────────────────────────

export function FireEffect({ heatLevel }: { heatLevel: number }) {
  const flamesRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const flames = useMemo<FlameData[]>(() => {
    const configs: FlameData[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      configs.push({
        x: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.3,
        baseRadius: 0.1 + Math.random() * 0.1,
        baseHeight: 0.3 + Math.random() * 0.2,
        phaseOffset: (i / count) * Math.PI * 2,
        speed: 2.5 + Math.random() * 2,
      });
    }
    return configs;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const heat = Math.max(heatLevel, 0);

    // Animate each flame cone
    if (flamesRef.current) {
      flamesRef.current.children.forEach((child, i) => {
        const f = flames[i];
        const wave = Math.sin(t * f.speed + f.phaseOffset);
        const scaleY = (0.5 + wave * 0.5) * heat;
        const scaleXZ = (0.8 + wave * 0.2) * heat;
        child.scale.set(
          Math.max(scaleXZ, 0.01),
          Math.max(scaleY, 0.01),
          Math.max(scaleXZ, 0.01),
        );

        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.opacity = (0.6 + wave * 0.4) * heat;
          mat.emissiveIntensity = (1.5 + wave * 0.8) * heat;
        }
      });
    }

    // Animate inner glow
    if (glowRef.current) {
      const glowWave = Math.sin(t * 4) * 0.15 + 0.85;
      const s = glowWave * heat;
      glowRef.current.scale.setScalar(Math.max(s, 0.01));
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = 0.4 * heat;
        mat.emissiveIntensity = (2 + Math.sin(t * 5) * 0.5) * heat;
      }
    }

    // Animate point light
    if (lightRef.current) {
      lightRef.current.intensity = heat * 2 + Math.sin(t * 6) * 0.3 * heat;
    }
  });

  return (
    <group>
      {/* ── Flame Cones ──────────────────────────────── */}
      <group ref={flamesRef}>
        {flames.map((f, i) => (
          <mesh
            key={i}
            position={[f.x, 0.1 + f.baseHeight * 0.5, f.z]}
          >
            <coneGeometry args={[f.baseRadius, f.baseHeight, 8]} />
            <meshStandardMaterial
              color="#ff8833"
              emissive="#ff6600"
              emissiveIntensity={1.5 * heatLevel}
              transparent
              opacity={0.8}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* ── Point Light ──────────────────────────────── */}
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        color="#ff6600"
        intensity={heatLevel * 2}
        distance={4}
        decay={2}
      />

      {/* ── Inner Glow Core ──────────────────────────── */}
      <mesh ref={glowRef} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color="#ffdd44"
          emissive="#ffcc00"
          emissiveIntensity={2 * heatLevel}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
