'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameState } from '../useArmyRunnerGame';

interface TrackProps {
  gameStateRef: React.RefObject<GameState>;
}

const TRACK_LENGTH = 200;
const TRACK_WIDTH = 8;
const BOLLARD_COUNT = 12;
const BOLLARD_SPACING = TRACK_LENGTH / (BOLLARD_COUNT + 1);
const BOLLARD_X = TRACK_WIDTH / 2 + 0.6;
const CURB_HEIGHT = 0.15;
const CURB_WIDTH = 0.35;

export function Track({ gameStateRef }: TrackProps) {
  const groupRef = useRef<THREE.Group>(null);

  const colors = useMemo(
    () => ({
      grass: new THREE.Color('#5a9e3f'),
      grassBorder: new THREE.Color('#4a8a2f'),
      asphalt: new THREE.Color('#777777'),
      curbRed: new THREE.Color('#cc0000'),
      curbWhite: new THREE.Color('#ffffff'),
      bollard: new THREE.Color('#ff8800'),
    }),
    [],
  );

  const bollardPositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < BOLLARD_COUNT; i++) {
      positions.push(-TRACK_LENGTH / 2 + BOLLARD_SPACING * (i + 1));
    }
    return positions;
  }, []);

  useFrame(() => {
    if (!groupRef.current || !gameStateRef.current) return;
    groupRef.current.position.z = gameStateRef.current.trackZ + TRACK_LENGTH / 2 - 20;
  });

  return (
    <group ref={groupRef}>
      {/* Ground plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.grass} />
      </mesh>

      {/* Darker grass border strips alongside track edges */}
      <mesh rotation-x={-Math.PI / 2} position={[-(TRACK_WIDTH / 2 + 1), -0.005, 0]}>
        <planeGeometry args={[2, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.grassBorder} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[TRACK_WIDTH / 2 + 1, -0.005, 0]}>
        <planeGeometry args={[2, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.grassBorder} />
      </mesh>

      {/* Track surface — asphalt */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[TRACK_WIDTH, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.asphalt} roughness={0.9} />
      </mesh>

      {/* Lane divider lines at ±1.5 from center */}
      <mesh rotation-x={-Math.PI / 2} position={[-1.5, 0.005, 0]}>
        <planeGeometry args={[0.08, TRACK_LENGTH]} />
        <meshStandardMaterial color="white" opacity={0.4} transparent />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[1.5, 0.005, 0]}>
        <planeGeometry args={[0.08, TRACK_LENGTH]} />
        <meshStandardMaterial color="white" opacity={0.4} transparent />
      </mesh>

      {/* Left curb — red base */}
      <mesh position={[-TRACK_WIDTH / 2 - CURB_WIDTH / 2, CURB_HEIGHT / 2, 0]}>
        <boxGeometry args={[CURB_WIDTH, CURB_HEIGHT, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.curbRed} />
      </mesh>
      {/* Left curb — white stripe overlay */}
      <mesh position={[-TRACK_WIDTH / 2 - CURB_WIDTH / 2, CURB_HEIGHT / 2 + 0.001, 0]}>
        <boxGeometry args={[CURB_WIDTH * 0.6, CURB_HEIGHT + 0.002, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.curbWhite} />
      </mesh>

      {/* Right curb — red base */}
      <mesh position={[TRACK_WIDTH / 2 + CURB_WIDTH / 2, CURB_HEIGHT / 2, 0]}>
        <boxGeometry args={[CURB_WIDTH, CURB_HEIGHT, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.curbRed} />
      </mesh>
      {/* Right curb — white stripe overlay */}
      <mesh position={[TRACK_WIDTH / 2 + CURB_WIDTH / 2, CURB_HEIGHT / 2 + 0.001, 0]}>
        <boxGeometry args={[CURB_WIDTH * 0.6, CURB_HEIGHT + 0.002, TRACK_LENGTH]} />
        <meshStandardMaterial color={colors.curbWhite} />
      </mesh>

      {/* Barrier bollards along both sides */}
      {bollardPositions.map((z, i) => (
        <group key={i}>
          <mesh position={[-BOLLARD_X, 0.25, z]} castShadow>
            <boxGeometry args={[0.15, 0.5, 0.15]} />
            <meshStandardMaterial color={colors.bollard} />
          </mesh>
          <mesh position={[BOLLARD_X, 0.25, z]} castShadow>
            <boxGeometry args={[0.15, 0.5, 0.15]} />
            <meshStandardMaterial color={colors.bollard} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
