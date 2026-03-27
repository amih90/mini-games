'use client';

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GAME_CONSTANTS } from '../useNascarGame';

const { TRACK_RADIUS_X, TRACK_RADIUS_Z } = GAME_CONSTANTS;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Deterministic pseudo-random (seeded) — avoids react-compiler Math.random() ban
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ─── Scenery model paths ─────────────────────────────────────
const SCENERY = {
  treeA: `${BASE_PATH}/models/track/tree-a.glb`,
  treeB: `${BASE_PATH}/models/track/tree-b.glb`,
  barrierRed: `${BASE_PATH}/models/track/barrier-red.glb`,
  barrierWhite: `${BASE_PATH}/models/track/barrier-white.glb`,
  cone: `${BASE_PATH}/models/track/cone.glb`,
  flagCheckers: `${BASE_PATH}/models/track/flag-checkers.glb`,
  billboard: `${BASE_PATH}/models/track/billboard.glb`,
  fenceStraight: `${BASE_PATH}/models/track/fence-straight.glb`,
  lightPost: `${BASE_PATH}/models/track/light-post.glb`,
  grandstand: `${BASE_PATH}/models/track/grandstand.glb`,
  tent: `${BASE_PATH}/models/track/tent.glb`,
  bannerTower: `${BASE_PATH}/models/track/banner-tower.glb`,
};

// Preload all scenery
Object.values(SCENERY).forEach((path) => useGLTF.preload(path));

/** Place a cloned glTF model at a position with rotation + scale */
function SceneryModel({ path, position, rotation = 0, scale = 1 }: {
  path: string;
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const { scene } = useGLTF(path);
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  return (
    <primitive
      object={model}
      position={position}
      rotation={[0, rotation, 0]}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    />
  );
}

/** Generate tree positions along the outside of the track */
function useTreePositions() {
  return useMemo(() => {
    const trees: { pos: [number, number, number]; rot: number; type: 'a' | 'b'; scale: number }[] = [];
    const outerOffset = 18; // Distance outside track edge

    // Trees along the full perimeter — outside the grandstands
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const dist = outerOffset + seededRandom(i * 3 + 1) * 8;
      const x = Math.cos(angle) * (TRACK_RADIUS_X + dist);
      const z = Math.sin(angle) * (TRACK_RADIUS_Z + dist);
      trees.push({
        pos: [x, 0, z],
        rot: seededRandom(i * 3 + 2) * Math.PI * 2,
        type: seededRandom(i * 3 + 3) > 0.5 ? 'a' : 'b',
        scale: 1.5 + seededRandom(i * 3 + 4) * 1.5,
      });
    }

    // Infield trees (inside the track)
    for (let i = 0; i < 12; i++) {
      const x = (seededRandom(100 + i * 3) - 0.5) * (TRACK_RADIUS_X - 8);
      const z = (seededRandom(100 + i * 3 + 1) - 0.5) * (TRACK_RADIUS_Z - 6);
      trees.push({
        pos: [x, 0, z],
        rot: seededRandom(100 + i * 3 + 2) * Math.PI * 2,
        type: seededRandom(200 + i) > 0.4 ? 'a' : 'b',
        scale: 1.0 + seededRandom(300 + i) * 1.2,
      });
    }

    return trees;
  }, []);
}

/** Generate cone positions along pit lane entry */
function useConePositions() {
  return useMemo(() => {
    const cones: { pos: [number, number, number]; rot: number }[] = [];
    // Pit entry markers
    for (let i = 0; i < 8; i++) {
      const angle = -0.4 + (i / 7) * 0.8;
      const r = TRACK_RADIUS_X - 7;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * (TRACK_RADIUS_Z - 4);
      cones.push({ pos: [x, 0, z], rot: -angle });
    }
    return cones;
  }, []);
}

/**
 * Track scenery — trees, barriers, cones, billboards, etc.
 * Uses Kenney Racing Kit GLB models (CC0).
 */
export function TrackScenery() {
  const trees = useTreePositions();
  const cones = useConePositions();

  return (
    <Suspense fallback={null}>
      <group>
        {/* ── Trees around the track ── */}
        {trees.map((t, i) => (
          <SceneryModel
            key={`tree-${i}`}
            path={t.type === 'a' ? SCENERY.treeA : SCENERY.treeB}
            position={t.pos}
            rotation={t.rot}
            scale={t.scale}
          />
        ))}

        {/* ── Pit lane cones ── */}
        {cones.map((c, i) => (
          <SceneryModel
            key={`cone-${i}`}
            path={SCENERY.cone}
            position={c.pos}
            rotation={c.rot}
            scale={1.5}
          />
        ))}

        {/* ── Red tire barriers in turn run-off areas ── */}
        {[Math.PI / 2, -Math.PI / 2].map((turnAngle, ti) => (
          <group key={`turn-barriers-${ti}`}>
            {Array.from({ length: 6 }).map((_, i) => {
              const a = turnAngle - 0.15 + (i / 5) * 0.3;
              const r = TRACK_RADIUS_X + 8;
              return (
                <SceneryModel
                  key={`barrier-${ti}-${i}`}
                  path={i % 2 === 0 ? SCENERY.barrierRed : SCENERY.barrierWhite}
                  position={[Math.cos(a) * r, 0, Math.sin(a) * (TRACK_RADIUS_Z + 8)]}
                  rotation={-a + Math.PI / 2}
                  scale={2.5}
                />
              );
            })}
          </group>
        ))}

        {/* ── Billboards along back straight ── */}
        {[-0.8, -0.4, 0.4, 0.8].map((offset, i) => {
          const angle = Math.PI + offset * 0.4;
          const r = TRACK_RADIUS_X + 16;
          return (
            <SceneryModel
              key={`billboard-${i}`}
              path={SCENERY.billboard}
              position={[Math.cos(angle) * r, 0, Math.sin(angle) * (TRACK_RADIUS_Z + 16)]}
              rotation={-angle}
              scale={3}
            />
          );
        })}

        {/* ── Banner towers at start/finish ── */}
        <SceneryModel path={SCENERY.bannerTower} position={[TRACK_RADIUS_X + 10, 0, 4]} rotation={Math.PI / 2} scale={3} />
        <SceneryModel path={SCENERY.bannerTower} position={[TRACK_RADIUS_X + 10, 0, -4]} rotation={Math.PI / 2} scale={3} />

        {/* ── Tents near pit area ── */}
        <SceneryModel path={SCENERY.tent} position={[TRACK_RADIUS_X - 20, 0, -TRACK_RADIUS_Z + 10]} rotation={0} scale={3} />
        <SceneryModel path={SCENERY.tent} position={[TRACK_RADIUS_X - 25, 0, -TRACK_RADIUS_Z + 10]} rotation={0.2} scale={3} />

        {/* ── Fence along front straight ── */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = -0.35 + (i / 9) * 0.7;
          const r = TRACK_RADIUS_X + 9;
          return (
            <SceneryModel
              key={`fence-${i}`}
              path={SCENERY.fenceStraight}
              position={[Math.cos(angle) * r, 0, Math.sin(angle) * (TRACK_RADIUS_Z + 9)]}
              rotation={-angle + Math.PI / 2}
              scale={2.5}
            />
          );
        })}
      </group>
    </Suspense>
  );
}
