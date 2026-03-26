'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────

interface ParticleEffectsProps {
  intensity: number;       // 0-1
  cauldronActive: boolean;
}

// ─── Ambient Dust Motes ──────────────────────────────────────

const DUST_COUNT = 25;
const ROOM_BOUNDS = {
  xMin: -5, xMax: 5,
  yMin: 0, yMax: 6,
  zMin: -4, zMax: 2,
};

interface DustMote {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

function AmbientDust({ intensity }: { intensity: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const motes = useMemo<DustMote[]>(() => {
    return Array.from({ length: DUST_COUNT }, () => ({
      pos: new THREE.Vector3(
        THREE.MathUtils.randFloat(ROOM_BOUNDS.xMin, ROOM_BOUNDS.xMax),
        THREE.MathUtils.randFloat(ROOM_BOUNDS.yMin, ROOM_BOUNDS.yMax),
        THREE.MathUtils.randFloat(ROOM_BOUNDS.zMin, ROOM_BOUNDS.zMax),
      ),
      vel: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.15),
        THREE.MathUtils.randFloat(0.01, 0.06),
        THREE.MathUtils.randFloatSpread(0.1),
      ),
    }));
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const children = groupRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const m = motes[i];
      m.pos.x += m.vel.x * delta;
      m.pos.y += m.vel.y * delta;
      m.pos.z += m.vel.z * delta;

      // Wrap around bounds
      if (m.pos.x > ROOM_BOUNDS.xMax) m.pos.x = ROOM_BOUNDS.xMin;
      if (m.pos.x < ROOM_BOUNDS.xMin) m.pos.x = ROOM_BOUNDS.xMax;
      if (m.pos.y > ROOM_BOUNDS.yMax) m.pos.y = ROOM_BOUNDS.yMin;
      if (m.pos.y < ROOM_BOUNDS.yMin) m.pos.y = ROOM_BOUNDS.yMax;
      if (m.pos.z > ROOM_BOUNDS.zMax) m.pos.z = ROOM_BOUNDS.zMin;
      if (m.pos.z < ROOM_BOUNDS.zMin) m.pos.z = ROOM_BOUNDS.zMax;

      children[i].position.copy(m.pos);
    }
  });

  return (
    <group ref={groupRef}>
      {motes.map((m, i) => (
        <mesh key={i} position={m.pos} visible={intensity > 0}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial
            color="#ffe4a0"
            emissive="#ffe4a0"
            emissiveIntensity={0.5 * intensity}
            transparent
            opacity={0.6 * intensity}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Magic Sparkles ──────────────────────────────────────────

const SPARKLE_COUNT = 12;
const SPARKLE_COLORS = ['#ffee44', '#44eeff', '#ff88cc', '#aa66ff'];
const CAULDRON_RADIUS = 2;

interface Sparkle {
  pos: THREE.Vector3;
  speed: number;
  colorIndex: number;
  phase: number;
}

function MagicSparkles({ active, intensity }: { active: boolean; intensity: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const sparkles = useMemo<Sparkle[]>(() => {
    return Array.from({ length: SPARKLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * CAULDRON_RADIUS;
      return {
        pos: new THREE.Vector3(
          Math.cos(angle) * r,
          1 + Math.random() * 2,
          Math.sin(angle) * r,
        ),
        speed: 0.3 + Math.random() * 0.4,
        colorIndex: Math.floor(Math.random() * SPARKLE_COLORS.length),
        phase: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !active) return;
    const children = groupRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const s = sparkles[i];
      s.pos.y += s.speed * delta;

      // Respawn when too high
      if (s.pos.y > 5) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * CAULDRON_RADIUS;
        s.pos.set(Math.cos(angle) * r, 1 + Math.random(), Math.sin(angle) * r);
        s.colorIndex = Math.floor(Math.random() * SPARKLE_COLORS.length);
      }

      children[i].position.copy(s.pos);
    }
  });

  return (
    <group ref={groupRef}>
      {sparkles.map((s, i) => (
        <mesh key={i} position={s.pos} visible={active}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial
            color={SPARKLE_COLORS[s.colorIndex]}
            emissive={SPARKLE_COLORS[s.colorIndex]}
            emissiveIntensity={1.0 * intensity}
            transparent
            opacity={0.8 * intensity}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Glow Ring ───────────────────────────────────────────────

function GlowRing({ visible }: { visible: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = clock.getElapsedTime() * 0.3;
  });

  return (
    <mesh
      ref={ringRef}
      position={[0, 1.5, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      visible={visible}
    >
      <torusGeometry args={[1.5, 0.01, 8, 48]} />
      <meshStandardMaterial
        color="#aaccff"
        emissive="#aaccff"
        emissiveIntensity={0.5}
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── ParticleEffects (main export) ───────────────────────────

export function ParticleEffects({ intensity, cauldronActive }: ParticleEffectsProps) {
  return (
    <group>
      <AmbientDust intensity={intensity} />
      <MagicSparkles active={cauldronActive} intensity={intensity} />
      <GlowRing visible={intensity > 0.3} />
    </group>
  );
}
