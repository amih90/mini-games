'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GamePhase } from '../types';

interface BattleGridProps {
  phase: GamePhase;
  selectedTankId: string | null;
  pendingTankType: string | null;
  onCellClick: (col: number, row: number, owner: 'player' | 'enemy') => void;
}

const CELL_SIZE = 1.5;
const COLS = 4;
const ROWS = 3;

/** Horizontal layout: player army on RIGHT (+x), enemy army on LEFT (-x) */
function cellWorldPos(col: number, row: number, owner: 'player' | 'enemy'): [number, number, number] {
  const z = (row - 1) * CELL_SIZE;
  const localX = (col - 1.5) * CELL_SIZE;
  const armyOffsetX = owner === 'player' ? 4.5 : -4.5;
  return [armyOffsetX + localX, 0, z];
}

interface CellMeshProps {
  col: number;
  row: number;
  owner: 'player' | 'enemy';
  isInteractive: boolean;
  onClick: () => void;
}

function CellMesh({ col, row, owner, isInteractive, onClick }: CellMeshProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const hoveredRef = useRef(false);

  useFrame(() => {
    if (!matRef.current) return;
    const target = hoveredRef.current ? 0.35 : 0;
    matRef.current.emissiveIntensity += (target - matRef.current.emissiveIntensity) * 0.15;
  });

  const pos = cellWorldPos(col, row, owner);

  // Only player cells are interactive during prep
  const handlePointerEnter = () => { if (isInteractive) hoveredRef.current = true; };
  const handlePointerLeave = () => { hoveredRef.current = false; };
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isInteractive) onClick();
  };

  const baseColor = owner === 'player' ? '#2a4a6e' : '#5a1e28';
  const emissiveColor = owner === 'player' ? '#4488ff' : '#ff4444';

  return (
    <mesh
      position={pos}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
      onPointerDown={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <planeGeometry args={[CELL_SIZE - 0.06, CELL_SIZE - 0.06]} />
      <meshStandardMaterial
        ref={matRef}
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={0}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Semi-transparent grid cells that handle hover glow and interaction */
export function BattleGrid({ phase, selectedTankId, pendingTankType, onCellClick }: BattleGridProps) {
  const playerInteractive = phase === 'prep';

  return (
    <group>
      {Array.from({ length: COLS }, (_, col) =>
        Array.from({ length: ROWS }, (_, row) => (
          <CellMesh
            key={`p-${col}-${row}`}
            col={col}
            row={row}
            owner="player"
            isInteractive={playerInteractive && !!(pendingTankType || selectedTankId)}
            onClick={() => onCellClick(col, row, 'player')}
          />
        ))
      )}
      {Array.from({ length: COLS }, (_, col) =>
        Array.from({ length: ROWS }, (_, row) => (
          <CellMesh
            key={`e-${col}-${row}`}
            col={col}
            row={row}
            owner="enemy"
            isInteractive={false}
            onClick={() => onCellClick(col, row, 'enemy')}
          />
        ))
      )}
    </group>
  );
}
