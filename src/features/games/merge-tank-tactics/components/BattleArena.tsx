'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { Tank, GamePhase, BattleRound, AttackEvent, BattleEnvironment, CameraMode } from '../types';
import { FXPhase } from '../hooks/useBattleLoop';
import { BattleGrid } from './BattleGrid';
import { TankMesh } from './TankMesh';
import { HPBar } from './HPBar';
import { ProjectileFX } from './ProjectileFX';
import { ExplosionFX } from './ExplosionFX';
import { MergeSparks } from './MergeSparks';
import { BattleEnvironment3D } from './Environment';
import { CinematicCamera } from './CinematicCamera';

// ─── Tank world position (horizontal layout) ──────────────────────────────

import { getTankBattleX } from './TankMesh';

function tankWorldPos(tank: Tank, isBattle = false): THREE.Vector3 {
  const z = (tank.row - 1) * 1.5;
  const x = getTankBattleX(tank, isBattle);
  return new THREE.Vector3(x, 0.5, z);
}

// ─── Inner scene ──────────────────────────────────────────────────────────

interface SceneProps {
  tanks: Tank[];
  phase: GamePhase;
  selectedTankId: string | null;
  pendingTankType: string | null;
  fxPhase: FXPhase;
  currentRound: BattleRound | null;
  hitTankIds: Set<string>;
  explosionPositions: THREE.Vector3[];
  mergeSparkPos: THREE.Vector3 | null;
  environment: BattleEnvironment;
  cameraMode: CameraMode;
  onCellClick: (col: number, row: number, owner: 'player' | 'enemy') => void;
  onTankClick: (id: string) => void;
}

function Scene({
  tanks, phase, selectedTankId, pendingTankType,
  fxPhase, currentRound, hitTankIds, explosionPositions, mergeSparkPos,
  environment, cameraMode,
  onCellClick, onTankClick,
}: SceneProps) {
  const isBattle = phase === 'battle';

  const projectiles = useMemo(() => {
    if (!currentRound || fxPhase !== 'projectile') return [];
    const allAttacks: AttackEvent[] = [
      ...currentRound.playerAttacks,
      ...currentRound.enemyAttacks,
    ];
    return allAttacks.map(atk => {
      const attacker = tanks.find(t => t.id === atk.attackerId);
      const target   = tanks.find(t => t.id === atk.targetId);
      if (!attacker || !target) return null;
      return {
        id: atk.id,
        from: tankWorldPos(attacker, isBattle),
        to:   tankWorldPos(target, isBattle),
        color: attacker.owner === 'player' ? '#88ddff' : '#ff6644',
      };
    }).filter(Boolean) as { id: string; from: THREE.Vector3; to: THREE.Vector3; color: string }[];
  }, [currentRound, fxPhase, tanks, isBattle]);

  const isHitPhase = fxPhase === 'hit';

  // Derive attacker/target world positions for cinematic camera during attack
  const attackerWorldPos = useMemo((): [number, number, number] | undefined => {
    if (!currentRound || fxPhase !== 'projectile') return undefined;
    const atk = currentRound.playerAttacks[0] ?? currentRound.enemyAttacks[0];
    if (!atk) return undefined;
    const t = tanks.find(tank => tank.id === atk.attackerId);
    if (!t) return undefined;
    const v = tankWorldPos(t, isBattle);
    return [v.x, v.y, v.z];
  }, [currentRound, fxPhase, tanks, isBattle]);

  const targetWorldPos = useMemo((): [number, number, number] | undefined => {
    if (!currentRound || fxPhase !== 'projectile') return undefined;
    const atk = currentRound.playerAttacks[0] ?? currentRound.enemyAttacks[0];
    if (!atk) return undefined;
    const t = tanks.find(tank => tank.id === atk.targetId);
    if (!t) return undefined;
    const v = tankWorldPos(t);
    return [v.x, v.y, v.z];
  }, [currentRound, fxPhase, tanks]);

  return (
    <>
      {/* Cinematic camera takes over all movement */}
      <CinematicCamera
        mode={cameraMode}
        attackerPos={attackerWorldPos}
        targetPos={targetWorldPos}
      />

      {/* Lighting (supplemental — HDRI provides primary IBL) */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 6, -6]} intensity={0.35} color="#4488ff" />

      {/* Environment: HDRI skybox + themed terrain props */}
      <BattleEnvironment3D env={environment} />

      {/* Grid overlay */}
      <BattleGrid
        phase={phase}
        selectedTankId={selectedTankId}
        pendingTankType={pendingTankType}
        onCellClick={onCellClick}
      />

      {/* Tanks */}
      {tanks.map(tank => (
        <TankMesh
          key={tank.id}
          tank={tank}
          isSelected={tank.id === selectedTankId}
          isHit={isHitPhase && hitTankIds.has(tank.id)}
          isBattle={isBattle}
          onClick={onTankClick}
        />
      ))}

      {/* HP bars */}
      {tanks.map(tank => (
        <HPBar key={`hp-${tank.id}`} tank={tank} isBattle={isBattle} />
      ))}

      {/* Projectiles */}
      {projectiles.map(p => (
        <ProjectileFX key={p.id} from={p.from} to={p.to} color={p.color} />
      ))}

      {/* Explosions */}
      {explosionPositions.map((pos, i) => (
        <ExplosionFX key={`exp-${i}`} position={pos} />
      ))}

      {/* Merge sparks */}
      {mergeSparkPos && <MergeSparks position={mergeSparkPos} />}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.3} intensity={0.8} />
        <Vignette eskil={false} offset={0.35} darkness={phase === 'battle' ? 0.7 : 0.4} />
      </EffectComposer>
    </>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────

interface BattleArenaProps {
  tanks: Tank[];
  phase: GamePhase;
  selectedTankId: string | null;
  pendingTankType: string | null;
  fxPhase: FXPhase;
  currentRound: BattleRound | null;
  hitTankIds: Set<string>;
  explosionPositions: THREE.Vector3[];
  mergeSparkPos: THREE.Vector3 | null;
  environment: BattleEnvironment;
  cameraMode: CameraMode;
  onCellClick: (col: number, row: number, owner: 'player' | 'enemy') => void;
  onTankClick: (id: string) => void;
}

export function BattleArena(props: BattleArenaProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 12], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}

