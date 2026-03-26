'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CreatureId } from '../types';

// ─── Types ───────────────────────────────────────────────────

interface CreatureProps {
  creatureId: CreatureId;
  color: string;
  emissiveColor: string;
  isFail: boolean;
  visible: boolean;
}

// ─── Bounce easing (overshoot then settle) ───────────────────

function bounceEase(t: number): number {
  if (t < 0.4) {
    // Ramp up to overshoot (0 → 1.2)
    const p = t / 0.4;
    return p * p * 1.2;
  }
  if (t < 0.7) {
    // Overshoot → settle (1.2 → 0.95)
    const p = (t - 0.4) / 0.3;
    return 1.2 - 0.25 * p;
  }
  // Final settle (0.95 → 1.0)
  const p = (t - 0.7) / 0.3;
  return 0.95 + 0.05 * p;
}

// ─── Individual creature bodies ──────────────────────────────

function SlimeBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const t = clock.getElapsedTime();
    bodyRef.current.scale.x = 1 + Math.sin(t * 3) * 0.1;
    bodyRef.current.scale.z = 1 + Math.cos(t * 3) * 0.1;
    bodyRef.current.scale.y = 0.7 - Math.sin(t * 3) * 0.05;
  });
  return (
    <group>
      <mesh ref={bodyRef} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 0.15, 0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.12, 0.15, 0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

function FireImpBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 4) * 0.08;
  });
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      {/* Pointy ears */}
      <mesh position={[-0.2, 0.25, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.06, 0.18, 6]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.2, 0.25, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.06, 0.18, 6]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.3} />
      </mesh>
      {/* Flame tail */}
      <mesh position={[0, -0.1, -0.3]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.08, 0.25, 6]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.0} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.08, 0.27]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffee00" emissive="#ffee00" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.1, 0.08, 0.27]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffee00" emissive="#ffee00" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function WaterSpriteBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 2.5) * 0.06;
    bodyRef.current.scale.set(s, s, s);
  });
  return (
    <group>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          roughness={0.1}
        />
      </mesh>
      {/* Fins */}
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0.5, 0.3]}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, -0.5, -0.3]}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.08, 0.3]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1a3a5a" />
      </mesh>
      <mesh position={[0.1, 0.08, 0.3]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1a3a5a" />
      </mesh>
    </group>
  );
}

function StoneGolemBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;
  });
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.5, 0.6, 0.4]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.1} roughness={0.9} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.38, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.38, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 0.5, 0.16]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.08, 0.5, 0.16]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function FairyBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flap = Math.sin(t * 12) * 0.4;
    if (leftWingRef.current) leftWingRef.current.rotation.y = -0.6 + flap;
    if (rightWingRef.current) rightWingRef.current.rotation.y = 0.6 - flap;
  });
  return (
    <group>
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      {/* Wings */}
      <mesh ref={leftWingRef} position={[-0.15, 0.05, -0.05]} rotation={[0, -0.6, 0.2]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={emissiveColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={rightWingRef} position={[0.15, 0.05, -0.05]} rotation={[0, 0.6, -0.2]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={emissiveColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Glow */}
      <pointLight color={emissiveColor} intensity={0.8} distance={2} />
      {/* Eyes */}
      <mesh position={[-0.06, 0.06, 0.18]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.06, 0.06, 0.18]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

function ShadowWispBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const orbitsRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!orbitsRef.current) return;
    const t = clock.getElapsedTime();
    orbitsRef.current.children.forEach((child, i) => {
      const angle = t * 0.8 + (i * Math.PI * 2) / 4;
      const r = 0.45;
      child.position.set(
        Math.cos(angle) * r,
        Math.sin(t * 0.5 + i) * 0.15,
        Math.sin(angle) * r,
      );
    });
  });
  return (
    <group>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Orbiting wisps */}
      <group ref={orbitsRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.3}
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CrystalDragonBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.06;
  });
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.3, 0.2, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
      {/* Head (octahedron) */}
      <mesh position={[0, 0.1, 0.4]}>
        <octahedronGeometry args={[0.15]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.6} />
      </mesh>
      {/* Tail segments */}
      <mesh position={[0, 0, -0.4]}>
        <boxGeometry args={[0.15, 0.1, 0.15]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.55]}>
        <boxGeometry args={[0.1, 0.08, 0.12]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.67]}>
        <boxGeometry args={[0.06, 0.05, 0.08]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      {/* Wings */}
      <mesh position={[-0.25, 0.1, -0.05]} rotation={[0.1, -0.3, 0.5]}>
        <planeGeometry args={[0.4, 0.25]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0.25, 0.1, -0.05]} rotation={[0.1, 0.3, -0.5]}>
        <planeGeometry args={[0.4, 0.25]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.05, 0.15, 0.52]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.05, 0.15, 0.52]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function GoldenPhoenixBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flap = Math.sin(t * 2) * 0.3;
    if (leftWingRef.current) leftWingRef.current.rotation.z = 0.3 + flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -0.3 - flap;
  });
  return (
    <group>
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.6}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      {/* Wings */}
      <mesh ref={leftWingRef} position={[-0.3, 0.1, 0]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={rightWingRef} position={[0.3, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Tail cones */}
      <mesh position={[0, -0.1, -0.35]} rotation={[0.6, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 6]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.1, -0.15, -0.45]} rotation={[0.8, 0.2, 0]}>
        <coneGeometry args={[0.06, 0.25, 6]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.1, -0.15, -0.45]} rotation={[0.8, -0.2, 0]}>
        <coneGeometry args={[0.06, 0.25, 6]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.09, 0.1, 0.27]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffee88" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.09, 0.1, 0.27]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffee88" emissiveIntensity={0.8} />
      </mesh>
      {/* Glow */}
      <pointLight color={emissiveColor} intensity={1.2} distance={3} />
    </group>
  );
}

function FailBlobBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const t = clock.getElapsedTime();
    bodyRef.current.scale.x = 1.2 + Math.sin(t * 4) * 0.1;
    bodyRef.current.scale.y = 0.8 + Math.cos(t * 3.5) * 0.08;
    bodyRef.current.scale.z = 1.1 + Math.sin(t * 3) * 0.06;
  });
  return (
    <group>
      <mesh ref={bodyRef} scale={[1.2, 0.8, 1.1]}>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.2} roughness={0.6} />
      </mesh>
      {/* Goofy eyes */}
      <mesh position={[-0.15, 0.15, 0.35]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.15, 0.15, 0.39]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.12, 0.1, 0.35]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.12, 0.1, 0.38]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

function FailSpikyBody({ color, emissiveColor }: { color: string; emissiveColor: string }) {
  const groupRef = useRef<THREE.Group>(null);

  const spikes = useMemo(() => {
    const dirs: [number, number, number][] = [
      [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0],
      [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0],
    ];
    return dirs.map((d) => {
      const len = Math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2);
      const norm: [number, number, number] = [d[0] / len, d[1] / len, d[2] / len];
      return {
        pos: [norm[0] * 0.35, norm[1] * 0.35, norm[2] * 0.35] as [number, number, number],
        rotation: new THREE.Euler(
          Math.atan2(norm[2], Math.sqrt(norm[0] ** 2 + norm[1] ** 2)),
          0,
          Math.atan2(-norm[0], norm[1]),
        ),
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.x = Math.sin(t * 15) * 0.03;
    groupRef.current.rotation.z = Math.cos(t * 13) * 0.03;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.3} />
      </mesh>
      {spikes.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rotation}>
          <coneGeometry args={[0.05, 0.2, 5]} />
          <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Eyes */}
      <mesh position={[-0.08, 0.08, 0.28]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.08, 0.08, 0.28]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

function FailWobblyBody({ emissiveColor }: { color: string; emissiveColor: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const wobbleColors = ['#cc66cc', '#66cccc', '#cccc66'];
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 3) * 0.15;
    groupRef.current.rotation.x = Math.cos(t * 2.5) * 0.1;
  });
  return (
    <group ref={groupRef}>
      {/* Bottom sphere */}
      <mesh position={[0, -0.2, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color={wobbleColors[0]} emissive={emissiveColor} emissiveIntensity={0.2} />
      </mesh>
      {/* Middle sphere */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={wobbleColors[1]} emissive={emissiveColor} emissiveIntensity={0.2} />
      </mesh>
      {/* Top sphere */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={wobbleColors[2]} emissive={emissiveColor} emissiveIntensity={0.2} />
      </mesh>
      {/* Eyes on top */}
      <mesh position={[-0.05, 0.4, 0.12]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.05, 0.4, 0.12]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

// ─── Creature Router ─────────────────────────────────────────

function CreatureBody({ creatureId, color, emissiveColor }: {
  creatureId: CreatureId;
  color: string;
  emissiveColor: string;
}) {
  switch (creatureId) {
    case 'slime':          return <SlimeBody color={color} emissiveColor={emissiveColor} />;
    case 'fireImp':        return <FireImpBody color={color} emissiveColor={emissiveColor} />;
    case 'waterSprite':    return <WaterSpriteBody color={color} emissiveColor={emissiveColor} />;
    case 'stoneGolem':     return <StoneGolemBody color={color} emissiveColor={emissiveColor} />;
    case 'fairy':          return <FairyBody color={color} emissiveColor={emissiveColor} />;
    case 'shadowWisp':     return <ShadowWispBody color={color} emissiveColor={emissiveColor} />;
    case 'crystalDragon':  return <CrystalDragonBody color={color} emissiveColor={emissiveColor} />;
    case 'goldenPhoenix':  return <GoldenPhoenixBody color={color} emissiveColor={emissiveColor} />;
    case 'failBlob':       return <FailBlobBody color={color} emissiveColor={emissiveColor} />;
    case 'failSpiky':      return <FailSpikyBody color={color} emissiveColor={emissiveColor} />;
    case 'failWobbly':     return <FailWobblyBody color={color} emissiveColor={emissiveColor} />;
    default:               return <SlimeBody color={color} emissiveColor={emissiveColor} />;
  }
}

// ─── Creature (main export) ──────────────────────────────────

export function Creature({ creatureId, color, emissiveColor, isFail, visible }: CreatureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const emergeTimeRef = useRef<number | null>(null);
  const wasVisibleRef = useRef(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Detect visibility transition
    if (visible && !wasVisibleRef.current) {
      emergeTimeRef.current = t;
    }
    wasVisibleRef.current = visible;

    if (!visible) {
      groupRef.current.scale.setScalar(0);
      return;
    }

    // Emerge animation (1s with bounce easing)
    if (emergeTimeRef.current !== null) {
      const elapsed = t - emergeTimeRef.current;
      if (elapsed < 1.0) {
        const s = bounceEase(elapsed);
        groupRef.current.scale.setScalar(s);
      } else {
        groupRef.current.scale.setScalar(1);
        emergeTimeRef.current = null;
      }
    }

    // Slow rotation when visible
    groupRef.current.rotation.y += 0.008;
  });

  // Suppress unused var warning — isFail available for future use
  void isFail;

  return (
    <group ref={groupRef} position={[0, 2, 0]} scale={visible ? 1 : 0}>
      <CreatureBody creatureId={creatureId} color={color} emissiveColor={emissiveColor} />
    </group>
  );
}
