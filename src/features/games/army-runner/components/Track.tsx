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

export function Track({ gameStateRef }: TrackProps) {
  const groupRef = useRef<THREE.Group>(null);
  const groundColor = useMemo(() => new THREE.Color('#88cc66'), []);
  const trackColor = useMemo(() => new THREE.Color('#ccccbb'), []);
  const wallColor = useMemo(() => new THREE.Color('#ff8844'), []);

  useFrame(() => {
    if (!groupRef.current || !gameStateRef.current) return;
    groupRef.current.position.z = gameStateRef.current.trackZ + TRACK_LENGTH / 2 - 20;
  });

  return (
    <group ref={groupRef}>
      {/* Ground plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
        <planeGeometry args={[40, TRACK_LENGTH]} />
        <meshStandardMaterial color={groundColor} />
      </mesh>

      {/* Track surface */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[TRACK_WIDTH, TRACK_LENGTH]} />
        <meshStandardMaterial color={trackColor} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-TRACK_WIDTH / 2 - 0.15, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.6, TRACK_LENGTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Right wall */}
      <mesh position={[TRACK_WIDTH / 2 + 0.15, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.6, TRACK_LENGTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Center lane line */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
        <planeGeometry args={[0.08, TRACK_LENGTH]} />
        <meshStandardMaterial color="white" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}
