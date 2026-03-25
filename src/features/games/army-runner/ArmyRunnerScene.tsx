'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Track } from './components/Track';
import { Gate } from './components/Gate';
import { Obstacle } from './components/Obstacle';
import { EnemyGroup } from './components/EnemyGroup';
import { FinalBoss } from './components/FinalBoss';
import { Coin } from './components/Coin';
import type { GameState, Segment } from './useArmyRunnerGame';

interface ArmyRunnerSceneProps {
  gameStateRef: React.RefObject<GameState>;
  paused: boolean;
  gameActive: boolean;
  onFrame: (delta: number) => string[];
  onEvents: (events: string[]) => void;
  moveGroup: (deltaX: number) => void;
}

// ─── Player crowd rendered imperatively via InstancedMesh ───
const bodyGeom = new THREE.BoxGeometry(0.25, 0.4, 0.2);
const headGeom = new THREE.SphereGeometry(0.1, 8, 6);
const legGeom = new THREE.BoxGeometry(0.08, 0.25, 0.08);

function PlayerCrowd({ gameStateRef }: { gameStateRef: React.RefObject<GameState> }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const lLegRef = useRef<THREE.InstancedMesh>(null);
  const rLegRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const mat = useMemo(() => new THREE.Matrix4(), []);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4488ff', roughness: 0.6 }), []);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffcc88', roughness: 0.5 }), []);
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3366cc', roughness: 0.7 }), []);

  const MAX = 80;

  useFrame((_, delta) => {
    const state = gameStateRef.current;
    if (!state || !bodyRef.current || !headRef.current || !lLegRef.current || !rLegRef.current) return;

    timeRef.current += delta;
    const t = timeRef.current;
    const offsets = state.soldierOffsets;
    const count = Math.min(offsets.length, MAX);

    bodyRef.current.count = count;
    headRef.current.count = count;
    lLegRef.current.count = count;
    rLegRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const off = offsets[i];
      const x = state.groupX + off.x;
      const z = state.trackZ + off.z;
      const bounce = Math.sin(t * 8 + off.phase) * 0.05;
      const legSwing = Math.sin(t * 10 + off.phase) * 0.3;

      mat.makeTranslation(x, 0.45 + bounce, z);
      bodyRef.current.setMatrixAt(i, mat);

      mat.makeTranslation(x, 0.75 + bounce, z);
      headRef.current.setMatrixAt(i, mat);

      mat.makeRotationX(legSwing);
      mat.setPosition(x - 0.07, 0.12, z);
      lLegRef.current.setMatrixAt(i, mat);

      mat.makeRotationX(-legSwing);
      mat.setPosition(x + 0.07, 0.12, z);
      rLegRef.current.setMatrixAt(i, mat);
    }

    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    lLegRef.current.instanceMatrix.needsUpdate = true;
    rLegRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[bodyGeom, bodyMat, MAX]} frustumCulled={false} />
      <instancedMesh ref={headRef} args={[headGeom, headMat, MAX]} frustumCulled={false} />
      <instancedMesh ref={lLegRef} args={[legGeom, legMat, MAX]} frustumCulled={false} />
      <instancedMesh ref={rLegRef} args={[legGeom, legMat, MAX]} frustumCulled={false} />
    </group>
  );
}

// ─── Visibility wrapper — controls show/hide via Three.js, not React ───
function SegmentWrapper({
  segment,
  gameStateRef,
  children,
}: {
  segment: Segment;
  gameStateRef: React.RefObject<GameState>;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current || !gameStateRef.current) return;
    const dist = segment.z - gameStateRef.current.trackZ;
    const hidden =
      ('triggered' in segment && (segment as { triggered: boolean }).triggered) ||
      ('collected' in segment && (segment as { collected: boolean }).collected);
    ref.current.visible = dist > -5 && dist < 80 && !hidden;
  });

  return <group ref={ref}>{children}</group>;
}

// ─── Main Scene ───
export function ArmyRunnerScene({
  gameStateRef,
  paused,
  gameActive,
  onFrame,
  onEvents,
  moveGroup,
}: ArmyRunnerSceneProps) {
  const { camera } = useThree();
  const cameraPos = useRef(new THREE.Vector3(0, 5, -6));
  const cameraTarget = useRef(new THREE.Vector3(0, 0.5, 8));
  const keysRef = useRef<Set<string>>(new Set());
  const lightRef = useRef<THREE.PointLight>(null);

  // Segments — set once per level (the ONLY React state update during gameplay)
  const [segments, setSegments] = useState<Segment[]>([]);
  const levelRef = useRef(-1);

  // Set camera direction immediately on mount
  useEffect(() => {
    camera.position.set(0, 5, -6);
    camera.lookAt(0, 0.5, 8);
  }, [camera]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Game loop — NO setState for positions, purely imperative
  useFrame((_, delta) => {
    if (paused || !gameActive) return;
    const state = gameStateRef.current;
    if (!state) return;

    // Detect level change → update segment list
    if (state.level !== levelRef.current) {
      levelRef.current = state.level;
      setSegments(state.segments);
    }

    // Keyboard input
    const keys = keysRef.current;
    const speed = 8;
    if (keys.has('arrowleft') || keys.has('a')) moveGroup(-speed * delta);
    if (keys.has('arrowright') || keys.has('d')) moveGroup(speed * delta);

    // Game logic tick
    const events = onFrame(delta);
    if (events.length > 0) onEvents(events);

    // Camera follow — imperative, no state
    const cx = state.groupX * 0.3;
    const camH = 5 + Math.min(state.soldierCount * 0.02, 2);
    cameraPos.current.lerp(new THREE.Vector3(cx, camH, state.trackZ - 6), 0.08);
    cameraTarget.current.lerp(new THREE.Vector3(cx * 0.5, 0.5, state.trackZ + 10), 0.12);
    camera.position.copy(cameraPos.current);
    camera.lookAt(cameraTarget.current);

    // Point light follows player
    if (lightRef.current) {
      lightRef.current.position.set(0, 8, state.trackZ + 10);
    }
  });

  return (
    <group>
      {/* Extra point light follows player (R3FGameContainer provides ambient + directional) */}
      <pointLight ref={lightRef} position={[0, 8, 10]} intensity={5} color="#ffffee" />

      {/* Sky + Fog */}
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 30, 80]} />

      {/* Track — updates its own position via useFrame */}
      <Track gameStateRef={gameStateRef} />

      {/* Player soldiers — reads from gameStateRef directly */}
      <PlayerCrowd gameStateRef={gameStateRef} />

      {/* Segments — rendered once per level, visibility managed by SegmentWrapper */}
      {segments.map((seg, i) => (
        <SegmentWrapper key={`seg-${i}`} segment={seg} gameStateRef={gameStateRef}>
          {seg.type === 'gate-pair' && <Gate gate={seg} />}
          {seg.type === 'obstacle' && <Obstacle obstacle={seg} />}
          {seg.type === 'enemy' && <EnemyGroup enemy={seg} />}
          {seg.type === 'coins' && <Coin coin={seg} />}
          {seg.type === 'boss' && <FinalBoss boss={seg} />}
        </SegmentWrapper>
      ))}
    </group>
  );
}
