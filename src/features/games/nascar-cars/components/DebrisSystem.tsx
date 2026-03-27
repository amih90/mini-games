'use client';

import { Suspense, useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const DEBRIS_MODELS = [
  `${BASE_PATH}/models/debris/bumper.glb`,
  `${BASE_PATH}/models/debris/door.glb`,
  `${BASE_PATH}/models/debris/tire.glb`,
  `${BASE_PATH}/models/debris/spoiler.glb`,
  `${BASE_PATH}/models/debris/plate.glb`,
];

// Preload all debris models
DEBRIS_MODELS.forEach((path) => useGLTF.preload(path));

export interface CollisionEvent {
  x: number;
  z: number;
  intensity: number; // 0-1
}

interface DebrisPieceData {
  id: number;
  modelIndex: number;
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number;
  avx: number; avy: number; avz: number;
  age: number;
  maxAge: number;
  scale: number;
}

/** Single animated debris piece — uses internal ref for mutable physics state */
function DebrisMesh({ data }: { data: DebrisPieceData }) {
  const { scene } = useGLTF(DEBRIS_MODELS[data.modelIndex]);
  const ref = useRef<THREE.Group>(null);
  // Internal mutable copy of physics state — avoids react-compiler prop-mutation ban
  const state = useRef({ ...data });

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.scale.setScalar(data.scale);
    return cloned;
  }, [scene, data.scale]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);

    s.vy -= 9.8 * dt;
    s.px += s.vx * dt;
    s.py += s.vy * dt;
    s.pz += s.vz * dt;

    if (s.py < 0.1) {
      s.py = 0.1;
      s.vy *= -0.3;
      s.vx *= 0.7;
      s.vz *= 0.7;
    }

    s.rx += s.avx * dt;
    s.ry += s.avy * dt;
    s.rz += s.avz * dt;
    s.age += dt;

    const fadeStart = s.maxAge * 0.6;
    const opacity = s.age > fadeStart
      ? Math.max(0, 1 - (s.age - fadeStart) / (s.maxAge - fadeStart))
      : 1;

    ref.current.position.set(s.px, s.py, s.pz);
    ref.current.rotation.set(s.rx, s.ry, s.rz);
    ref.current.scale.setScalar(s.scale * opacity);
    ref.current.visible = opacity > 0.01;
  });

  return (
    <group ref={ref}>
      <primitive object={model} />
    </group>
  );
}

// Seeded pseudo-random for debris creation
let debrisSeed = 0;
function debrisRandom(): number {
  debrisSeed = (debrisSeed * 1664525 + 1013904223) & 0xFFFFFFFF;
  return (debrisSeed >>> 0) / 0xFFFFFFFF;
}

/**
 * Debris system — spawns flying car parts when collisions happen.
 */
export function DebrisSystem({ events }: { events: CollisionEvent[] }) {
  const [pieces, setPieces] = useState<DebrisPieceData[]>([]);
  const nextId = useRef(0);
  const prevEventsLen = useRef(0);

  useFrame(() => {
    // Spawn debris for new events
    if (events.length > 0 && events.length !== prevEventsLen.current) {
      prevEventsLen.current = events.length;
      const newPieces: DebrisPieceData[] = [];
      events.forEach((evt) => {
        const count = Math.ceil(evt.intensity * 3);
        for (let i = 0; i < count; i++) {
          const angle = debrisRandom() * Math.PI * 2;
          const upSpeed = 3 + debrisRandom() * 5;
          const outSpeed = 2 + debrisRandom() * 4;
          newPieces.push({
            id: nextId.current++,
            modelIndex: Math.floor(debrisRandom() * DEBRIS_MODELS.length),
            px: evt.x, py: 0.5, pz: evt.z,
            vx: Math.cos(angle) * outSpeed,
            vy: upSpeed,
            vz: Math.sin(angle) * outSpeed,
            rx: debrisRandom() * Math.PI,
            ry: debrisRandom() * Math.PI,
            rz: debrisRandom() * Math.PI,
            avx: (debrisRandom() - 0.5) * 10,
            avy: (debrisRandom() - 0.5) * 10,
            avz: (debrisRandom() - 0.5) * 10,
            age: 0,
            maxAge: 2.5 + debrisRandom() * 1.5,
            scale: 0.4 + debrisRandom() * 0.3,
          });
        }
      });
      if (newPieces.length > 0) {
        setPieces((prev) => [...prev, ...newPieces]);
      }
    }
  });

  // Periodically clean up expired pieces (every ~1s via a timer, not per-frame setState)
  const cleanupTimer = useRef(0);
  useFrame((_, delta) => {
    cleanupTimer.current += delta;
    if (cleanupTimer.current > 1.0) {
      cleanupTimer.current = 0;
      setPieces((prev) => prev.filter((p) => p.age < p.maxAge + 2));
    }
  });

  return (
    <Suspense fallback={null}>
      {pieces.map((piece) => (
        <DebrisMesh key={piece.id} data={piece} />
      ))}
    </Suspense>
  );
}
