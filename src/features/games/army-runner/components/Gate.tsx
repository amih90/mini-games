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
      <Text
        fontSize={1.0}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.05}
        outlineColor="black"
      >
        {label}
      </Text>
    </group>
  );
}

function GateArch({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[-GATE_WIDTH / 2, GATE_HEIGHT / 2, 0]}>
        <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[GATE_WIDTH / 2, GATE_HEIGHT / 2, 0]}>
        <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, GATE_HEIGHT, 0]}>
        <boxGeometry args={[GATE_WIDTH + PILLAR_WIDTH, PILLAR_WIDTH, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, GATE_HEIGHT / 2, 0]}>
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH, GATE_HEIGHT - PILLAR_WIDTH]} />
        <meshStandardMaterial color={color} opacity={0.3} transparent side={THREE.DoubleSide} />
      </mesh>
      <GateLabel position={[0, GATE_HEIGHT / 2 + 0.2, 0]} label={label} />
    </group>
  );
}

export function Gate({ gate }: GateProps) {
  const leftLabel = `${gate.left.op === '+' ? '+' : 'x'}${gate.left.value}`;
  const rightLabel = `${gate.right.op === '+' ? '+' : 'x'}${gate.right.value}`;
  const leftColor = gate.left.op === '+' ? '#44bb44' : '#ddaa00';
  const rightColor = gate.right.op === '+' ? '#44bb44' : '#ddaa00';

  return (
    <group position={[0, 0, gate.z]}>
      <GateArch x={-GATE_WIDTH / 2 + 0.2} label={leftLabel} color={leftColor} />
      <mesh position={[0, GATE_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.15, GATE_HEIGHT, 0.3]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <GateArch x={GATE_WIDTH / 2 - 0.2} label={rightLabel} color={rightColor} />
    </group>
  );
}
