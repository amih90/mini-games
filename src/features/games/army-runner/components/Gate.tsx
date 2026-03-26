'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GatePair as GatePairData } from '../useArmyRunnerGame';

interface GateProps {
  gate: GatePairData;
}

const GATE_WIDTH = 3;
const GATE_HEIGHT = 3;
const PILLAR_WIDTH = 0.3;

function GateLabel({ position, label }: { position: [number, number, number]; label: string }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (ref.current) {
      ref.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Drop shadow */}
      <Text
        fontSize={1.0}
        color="black"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.07}
        outlineColor="black"
        position={[0.04, -0.04, -0.05]}
        fillOpacity={0.5}
      >
        {label}
      </Text>
      <Text
        fontSize={1.0}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.07}
        outlineColor="black"
      >
        {label}
      </Text>
    </group>
  );
}

function GateArch({ x, label, color }: { x: number; label: string; color: string }) {
  const panelMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (panelMatRef.current) {
      panelMatRef.current.emissiveIntensity = Math.sin(clock.getElapsedTime() * 3) * 0.15 + 0.2;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      {/* Left pillar */}
      <mesh position={[-GATE_WIDTH / 2, GATE_HEIGHT / 2, 0]}>
        <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[-GATE_WIDTH / 2, GATE_HEIGHT, 0]}>
        <sphereGeometry args={[PILLAR_WIDTH * 0.6, 8, 8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Right pillar */}
      <mesh position={[GATE_WIDTH / 2, GATE_HEIGHT / 2, 0]}>
        <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[GATE_WIDTH / 2, GATE_HEIGHT, 0]}>
        <sphereGeometry args={[PILLAR_WIDTH * 0.6, 8, 8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Top bar */}
      <mesh position={[0, GATE_HEIGHT, 0]}>
        <boxGeometry args={[GATE_WIDTH + PILLAR_WIDTH, PILLAR_WIDTH, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Pulsing transparent panel */}
      <mesh position={[0, GATE_HEIGHT / 2, 0]}>
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH, GATE_HEIGHT - PILLAR_WIDTH]} />
        <meshStandardMaterial
          ref={panelMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          opacity={0.3}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      <GateLabel position={[0, GATE_HEIGHT / 2 + 0.2, 0.2]} label={label} />
    </group>
  );
}

const OP_SYMBOLS: Record<string, string> = { '+': '+', '-': '-', 'x': '×', '÷': '÷' };
const OP_COLORS: Record<string, string> = { '+': '#44bb44', '-': '#dd4444', 'x': '#ddaa00', '÷': '#dd6600' };

export function Gate({ gate }: GateProps) {
  const leftLabel = `${OP_SYMBOLS[gate.left.op] ?? gate.left.op}${gate.left.value}`;
  const rightLabel = `${OP_SYMBOLS[gate.right.op] ?? gate.right.op}${gate.right.value}`;
  const leftColor = OP_COLORS[gate.left.op] ?? '#888888';
  const rightColor = OP_COLORS[gate.right.op] ?? '#888888';

  return (
    <group position={[0, 0, gate.z]}>
      <GateArch x={-GATE_WIDTH / 2 + 0.2} label={leftLabel} color={leftColor} />
      <mesh position={[0, GATE_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.2, GATE_HEIGHT, 0.3]} />
        <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.5} />
      </mesh>
      <GateArch x={GATE_WIDTH / 2 - 0.2} label={rightLabel} color={rightColor} />
    </group>
  );
}
