'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Tank } from '../types';

interface TankMeshProps {
  tank: Tank;
  isSelected: boolean;
  isHit: boolean;
  isBattle?: boolean;
  onClick: (id: string) => void;
}

/**
 * Returns the target x-position for a tank during battle.
 * Melee tanks advance to the center combat zone; range tanks hold their line.
 */
export function getTankBattleX(tank: Pick<Tank, 'col' | 'row' | 'owner' | 'type'>, isBattle: boolean): number {
  const localX = (tank.col - 1.5) * 1.5;
  const armyX = tank.owner === 'player' ? 4.5 : -4.5;
  if (isBattle && tank.type === 'melee') {
    // Advance to the centre zone, preserving column spread (scaled down)
    return tank.owner === 'player'
      ? 1.5 + localX * 0.3
      : -1.5 + localX * 0.3;
  }
  return armyX + localX;
}

/** Level-based tank colors matching historical vehicle paint */
const TANK_COLORS: Record<number, string> = {
  1: '#6b6b5a', // Olive drab  — T-55
  2: '#5a7a45', // Army green  — M60
  3: '#7a8a6a', // NATO green  — Leopard 2
  4: '#c8b87a', // Desert tan  — M1A2 Abrams
  5: '#d4a843', // Gold tan    — Merkava IV (elite)
};

const TRACK_MAT_ARGS = { color: '#1a1a1a', metalness: 0.8, roughness: 0.3 } as const;
const BARREL_MAT_ARGS = { color: '#333333', metalness: 0.9, roughness: 0.15 } as const;

// ─── Shared track helper ─────────────────────────────────────────────────

function Tracks({ hullW, hullH, hullL }: { hullW: number; hullH: number; hullL: number }) {
  return (
    <>
      <mesh position={[-(hullW / 2 + 0.05), -hullH / 2 + 0.08, 0]} castShadow>
        <boxGeometry args={[0.18, 0.22, hullL + 0.2]} />
        <meshStandardMaterial {...TRACK_MAT_ARGS} />
      </mesh>
      <mesh position={[hullW / 2 + 0.05, -hullH / 2 + 0.08, 0]} castShadow>
        <boxGeometry args={[0.18, 0.22, hullL + 0.2]} />
        <meshStandardMaterial {...TRACK_MAT_ARGS} />
      </mesh>
    </>
  );
}

// ─── T-55 (Level 1) — Soviet hemispherical dome, short barrel ────────────

function T55({ color, emissive, eI, turretRef }: TankBodyProps) {
  const hullW = 0.85, hullH = 0.32, hullL = 1.0, barrelLen = 0.5;
  const mat = { color, emissive, emissiveIntensity: eI, metalness: 0.7, roughness: 0.35 };
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[hullW, hullH, hullL]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Tracks hullW={hullW} hullH={hullH} hullL={hullL} />
      {/* Turret ring */}
      <mesh position={[0, hullH / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.28 * 1.1, 0.15, 8]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Dome turret + short barrel */}
      <group position={[0, hullH / 2 + 0.18, 0]} ref={turretRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.22, 8]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh position={[0, 0, -(0.28 + barrelLen / 2)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, barrelLen, 6]} />
          <meshStandardMaterial {...BARREL_MAT_ARGS} />
        </mesh>
      </group>
    </>
  );
}

// ─── M60 (Level 2) — US angular box turret, medium barrel ────────────────

function M60({ color, emissive, eI, turretRef }: TankBodyProps) {
  const hullW = 0.9, hullH = 0.36, hullL = 1.1;
  const turretW = 0.45, turretH = 0.28, turretL = 0.55, barrelLen = 0.7;
  const mat = { color, emissive, emissiveIntensity: eI, metalness: 0.7, roughness: 0.35 };
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[hullW, hullH, hullL]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Tracks hullW={hullW} hullH={hullH} hullL={hullL} />
      <mesh position={[0, hullH / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[turretW / 2, turretW / 2 * 1.1, 0.15, 8]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <group position={[0, hullH / 2 + 0.18, 0]} ref={turretRef}>
        <mesh castShadow>
          <boxGeometry args={[turretW, turretH, turretL]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh position={[0, 0, -(turretL / 2 + barrelLen / 2)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, barrelLen, 6]} />
          <meshStandardMaterial {...BARREL_MAT_ARGS} />
        </mesh>
      </group>
    </>
  );
}

// ─── Leopard 2 (Level 3) — NATO wedge turret, side skirts ────────────────

function Leopard2({ color, emissive, eI, turretRef }: TankBodyProps) {
  const hullW = 0.95, hullH = 0.35, hullL = 1.15;
  const turretW = 0.5, turretH = 0.3, turretL = 0.58, barrelLen = 0.85;
  const mat = { color, emissive, emissiveIntensity: eI, metalness: 0.72, roughness: 0.33 };
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[hullW, hullH, hullL]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Tracks hullW={hullW} hullH={hullH} hullL={hullL} />
      {/* Side skirts */}
      <mesh position={[-(hullW / 2 + 0.15), -hullH / 2 + 0.05, 0]} castShadow>
        <boxGeometry args={[0.08, 0.18, hullL + 0.1]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[hullW / 2 + 0.15, -hullH / 2 + 0.05, 0]} castShadow>
        <boxGeometry args={[0.08, 0.18, hullL + 0.1]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, hullH / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[turretW / 2, turretW / 2 * 1.1, 0.15, 8]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <group position={[0, hullH / 2 + 0.18, 0]} ref={turretRef}>
        {/* Wedge turret — angled front face via scaleZ */}
        <mesh castShadow scale={[1, 1, 1]}>
          <boxGeometry args={[turretW, turretH, turretL]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        {/* Front slope wedge */}
        <mesh position={[0, -0.04, -(turretL / 2 + 0.1)]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[turretW * 0.9, turretH * 0.6, 0.2]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh position={[0, 0, -(turretL / 2 + barrelLen / 2)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, barrelLen, 6]} />
          <meshStandardMaterial {...BARREL_MAT_ARGS} />
        </mesh>
      </group>
    </>
  );
}

// ─── M1A2 Abrams (Level 4) — bustle turret, composite armor wedges ────────

function Abrams({ color, emissive, eI, turretRef }: TankBodyProps) {
  const hullW = 1.0, hullH = 0.38, hullL = 1.2;
  const turretW = 0.52, turretH = 0.32, turretL = 0.62, barrelLen = 0.95;
  const mat = { color, emissive, emissiveIntensity: eI, metalness: 0.73, roughness: 0.3 };
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[hullW, hullH, hullL]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Tracks hullW={hullW} hullH={hullH} hullL={hullL} />
      <mesh position={[0, hullH / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[turretW / 2, turretW / 2 * 1.1, 0.15, 8]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <group position={[0, hullH / 2 + 0.18, 0]} ref={turretRef}>
        {/* Main turret body */}
        <mesh castShadow>
          <boxGeometry args={[turretW, turretH, turretL]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        {/* Bustle (rear turret extension) */}
        <mesh position={[0, 0, turretL / 2 + 0.15]} castShadow>
          <boxGeometry args={[turretW * 0.85, turretH * 0.7, 0.3]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        {/* Composite armor wedges on turret sides */}
        <mesh position={[-(turretW / 2 + 0.06), 0, -0.05]} castShadow>
          <boxGeometry args={[0.12, 0.25, 0.28]} />
          <meshStandardMaterial color={color} metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[turretW / 2 + 0.06, 0, -0.05]} castShadow>
          <boxGeometry args={[0.12, 0.25, 0.28]} />
          <meshStandardMaterial color={color} metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, -(turretL / 2 + barrelLen / 2)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, barrelLen, 6]} />
          <meshStandardMaterial {...BARREL_MAT_ARGS} />
        </mesh>
      </group>
    </>
  );
}

// ─── Merkava IV (Level 5) — front engine hump, rear turret, ERA tiles ─────

function Merkava({ color, emissive, eI, turretRef }: TankBodyProps) {
  const hullW = 1.0, hullH = 0.42, hullL = 1.3;
  const turretW = 0.54, turretH = 0.34, turretL = 0.65, barrelLen = 1.0;
  const turretOffsetZ = 0.2; // rear turret
  const mat = { color, emissive, emissiveIntensity: eI, metalness: 0.74, roughness: 0.28 };
  const eraMat = { color: '#a09060', metalness: 0.6, roughness: 0.4 };
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[hullW, hullH, hullL]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Front engine hump */}
      <mesh position={[0, hullH / 2 + 0.06, -(hullL / 2 - 0.15)]} castShadow>
        <boxGeometry args={[0.7, 0.18, 0.3]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Tracks hullW={hullW} hullH={hullH} hullL={hullL} />
      {/* ERA tiles on hull sides */}
      {[-1, 0, 1].map(i => (
        <mesh key={`era-l-${i}`} position={[-(hullW / 2 + 0.06), 0.02, i * 0.35]} castShadow>
          <boxGeometry args={[0.07, 0.12, 0.22]} />
          <meshStandardMaterial {...eraMat} />
        </mesh>
      ))}
      {[-1, 0, 1].map(i => (
        <mesh key={`era-r-${i}`} position={[hullW / 2 + 0.06, 0.02, i * 0.35]} castShadow>
          <boxGeometry args={[0.07, 0.12, 0.22]} />
          <meshStandardMaterial {...eraMat} />
        </mesh>
      ))}
      {/* Rear basket */}
      <mesh position={[0, hullH / 2 - 0.1, hullL / 2 + 0.14]} castShadow>
        <boxGeometry args={[0.65, 0.2, 0.25]} />
        <meshStandardMaterial color="#888870" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* Turret ring */}
      <mesh position={[0, hullH / 2 + 0.1, turretOffsetZ]} castShadow>
        <cylinderGeometry args={[turretW / 2, turretW / 2 * 1.1, 0.15, 8]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Rear-mounted turret + long barrel */}
      <group position={[0, hullH / 2 + 0.18, turretOffsetZ]} ref={turretRef}>
        <mesh castShadow>
          <boxGeometry args={[turretW, turretH, turretL]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        {/* Gold emissive pulse on turret edges for Level 5 */}
        <mesh position={[0, turretH / 2 + 0.04, 0]} castShadow>
          <boxGeometry args={[turretW + 0.02, 0.04, turretL + 0.02]} />
          <meshStandardMaterial color="#d4a843" emissive="#d4a843" emissiveIntensity={eI + 0.4} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -(turretL / 2 + barrelLen / 2)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, barrelLen, 6]} />
          <meshStandardMaterial {...BARREL_MAT_ARGS} />
        </mesh>
      </group>
    </>
  );
}

// ─── Shared props type ────────────────────────────────────────────────────

interface TankBodyProps {
  color: string;
  emissive: string;
  eI: number;
  turretRef: React.RefObject<THREE.Group>;
}

// ─── Main TankMesh ────────────────────────────────────────────────────────

/** Procedural tank mesh with 5 level-based archetypes (T-55 → Merkava IV) */
export function TankMesh({ tank, isSelected, isHit, isBattle = false, onClick }: TankMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const turretRef = useRef<THREE.Group>(null!);

  const color = TANK_COLORS[tank.level] ?? TANK_COLORS[1];
  const baseEmissive =
    tank.level >= 5 ? '#7a5c00' :
    tank.level >= 4 ? '#2d1b69' : '#000000';
  const emissive = isHit ? '#ffffff' : isSelected ? '#ffff88' : baseEmissive;
  const baseEI = tank.level >= 5 ? 0.6 : tank.level >= 4 ? 0.3 : 0;
  const eI = isHit ? 3.0 : isSelected ? 0.8 : baseEI;

  const levelScale = 0.75 + tank.level * 0.1;

  // Horizontal layout: player on RIGHT (+x), enemy on LEFT (-x)
  const z = (tank.row - 1) * 1.5;
  const targetX = getTankBattleX(tank, isBattle);

  // Track animated x separately so we can lerp smoothly
  const currentXRef = useRef(targetX);

  // Barrels aimed at enemy: player rotates +Y π/2 (barrel points -x toward enemy)
  //                         enemy  rotates -Y π/2 (barrel points +x toward player)
  const rotY = tank.owner === 'player' ? Math.PI / 2 : -Math.PI / 2;

  useFrame(() => {
    if (!groupRef.current) return;
    // Smooth advance / retreat on x axis
    currentXRef.current += (targetX - currentXRef.current) * 0.04;
    groupRef.current.position.x = currentXRef.current;
    // Subtle idle float
    groupRef.current.position.y = 0.08 + Math.sin(Date.now() * 0.002 + tank.col + tank.row) * 0.03;
    // Range tanks sweep their turret
    if (tank.type === 'range' && turretRef.current) {
      turretRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.25;
    }
  });

  if (!tank.isAlive) return null;

  const bodyProps: TankBodyProps = { color, emissive, eI, turretRef };

  return (
    <group
      ref={groupRef}
      position={[currentXRef.current, 0.08, z]}
      scale={[levelScale, levelScale, levelScale]}
      rotation={[0, rotY, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(tank.id); }}
      onPointerDown={(e) => { e.stopPropagation(); onClick(tank.id); }}
    >
      {tank.level === 1 && <T55 {...bodyProps} />}
      {tank.level === 2 && <M60 {...bodyProps} />}
      {tank.level === 3 && <Leopard2 {...bodyProps} />}
      {tank.level === 4 && <Abrams {...bodyProps} />}
      {(tank.level >= 5) && <Merkava {...bodyProps} />}

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.84, 24]} />
          <meshStandardMaterial
            color="#ffff00"
            emissive="#ffff00"
            emissiveIntensity={2}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Level badge — emissive sphere on top */}
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.3}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

