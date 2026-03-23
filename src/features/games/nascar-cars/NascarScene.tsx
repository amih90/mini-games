'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Sky } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Car, AI_CAR_COLORS } from './Car';
import { Track, getTrackPosition } from './Track';
import { RaceState, GAME_CONSTANTS } from './useNascarGame';

const { TRACK_RADIUS_X, TRACK_RADIUS_Z } = GAME_CONSTANTS;

interface NascarSceneProps {
  raceStateRef: React.MutableRefObject<RaceState>;
  paused: boolean;
  gameActive: boolean;
  onFrame: (delta: number) => void;
  playerPosition: number;
  playerLap: number;
  totalLaps: number;
  countdown: number;
  locale: string;
}

// ─── Main Scene ──────────────────────────────────────────────
export function NascarScene({
  raceStateRef,
  paused,
  gameActive,
  onFrame,
  playerPosition,
  playerLap,
  totalLaps,
  countdown,
  locale,
}: NascarSceneProps) {
  const { camera } = useThree();
  const playerCarRef = useRef<THREE.Group>(null);
  const aiCarRefs = useRef<(THREE.Group | null)[]>([]);
  const cameraTarget = useRef(new THREE.Vector3());
  const cameraPos = useRef(new THREE.Vector3(0, 8, 20));

  // Locale labels for HUD
  const labels = useMemo(() => {
    const l: Record<string, { position: string; lap: string; go: string }> = {
      en: { position: 'P', lap: 'Lap', go: 'GO!' },
      he: { position: 'מקום', lap: 'הקפה', go: '!צא' },
      zh: { position: '名次', lap: '圈', go: '出发！' },
      es: { position: 'Pos', lap: 'Vuelta', go: '¡YA!' },
    };
    return l[locale] || l.en;
  }, [locale]);

  // Game loop
  useFrame((_, delta) => {
    if (paused || !gameActive) return;

    onFrame(delta);

    const state = raceStateRef.current;
    const player = state.player;

    // Update player car 3D position
    const playerPos = getTrackPosition(player.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);

    if (playerCarRef.current) {
      playerCarRef.current.position.set(playerPos.x, 0.25, playerPos.z);
      playerCarRef.current.rotation.set(0, playerPos.rotation, 0);
    }

    // Update AI car 3D positions
    state.aiCars.forEach((aiCar, i) => {
      const aiPos = getTrackPosition(aiCar.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, aiCar.laneOffset);
      const ref = aiCarRefs.current[i];
      if (ref) {
        ref.position.set(aiPos.x, 0.25, aiPos.z);
        ref.rotation.set(0, aiPos.rotation, 0);
      }
    });

    // 3rd-person camera following player
    const camDist = 6;
    const camHeight = 3.5;
    const behindAngle = player.angle - 0.15;
    const behindPos = getTrackPosition(behindAngle, TRACK_RADIUS_X + camDist, TRACK_RADIUS_Z + camDist, 0);

    cameraPos.current.lerp(
      new THREE.Vector3(behindPos.x, camHeight, behindPos.z),
      0.05,
    );
    cameraTarget.current.lerp(
      new THREE.Vector3(playerPos.x, 0.5, playerPos.z),
      0.1,
    );

    camera.position.copy(cameraPos.current);
    camera.lookAt(cameraTarget.current);
  });

  const state = raceStateRef.current;
  const numAiCars = state.aiCars.length;

  // Ensure refs array size
  useEffect(() => {
    aiCarRefs.current = Array(numAiCars).fill(null);
  }, [numAiCars]);

  return (
    <>
      {/* Sky */}
      <Sky sunPosition={[100, 50, 100]} turbidity={2} rayleigh={0.5} />
      <color attach="background" args={['#87ceeb']} />

      {/* Extra lighting for outdoor scene */}
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={['#87ceeb', '#4caf50', 0.4]} />

      {/* Track */}
      <Track />

      {/* Player Car */}
      <group ref={playerCarRef} position={[TRACK_RADIUS_X, 0.25, 0]}>
        <Car
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          color="#ffeb3b"
          speed={state.player.speed}
          isPlayer
        />
      </group>

      {/* AI Cars */}
      {Array.from({ length: numAiCars }).map((_, i) => (
        <group
          key={i}
          ref={(el: THREE.Group | null) => { aiCarRefs.current[i] = el; }}
          position={[TRACK_RADIUS_X - (i + 1) * 1.5, 0.25, 0]}
        >
          <Car
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            color={AI_CAR_COLORS[i % AI_CAR_COLORS.length]}
            speed={state.aiCars[i]?.speed ?? 0}
          />
        </group>
      ))}

      {/* Countdown text */}
      {countdown > 0 && (
        <Text
          position={[
            raceStateRef.current.player.angle === 0 ? TRACK_RADIUS_X : 0,
            5,
            0,
          ]}
          fontSize={3}
          color={countdown > 1 ? '#ef5350' : '#ffeb3b'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="black"
        >
          {countdown > 0.5 ? Math.ceil(countdown).toString() : labels.go}
        </Text>
      )}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom intensity={0.3} luminanceThreshold={0.9} luminanceSmoothing={0.9} />
      </EffectComposer>
    </>
  );
}
