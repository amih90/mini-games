'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
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
  numAiCars: number;
  countdown: number;
  locale: string;
}

// ─── Countdown — follows the camera ─────────────────────────
function CountdownText({
  cameraTarget,
  cameraPos,
  countdown,
  goLabel,
}: {
  cameraTarget: React.MutableRefObject<THREE.Vector3>;
  cameraPos: React.MutableRefObject<THREE.Vector3>;
  countdown: number;
  goLabel: string;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const mid = new THREE.Vector3()
      .addVectors(cameraPos.current, cameraTarget.current)
      .multiplyScalar(0.5);
    mid.y = 5;
    ref.current.position.copy(mid);
    ref.current.lookAt(cameraPos.current);
  });

  return (
    <group ref={ref}>
      <Text
        fontSize={3}
        color={countdown > 1 ? '#ef5350' : '#ffeb3b'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.15}
        outlineColor="black"
      >
        {countdown > 0.5 ? Math.ceil(countdown).toString() : goLabel}
      </Text>
    </group>
  );
}

// ─── Main Scene ──────────────────────────────────────────────
export function NascarScene({
  raceStateRef,
  paused,
  gameActive,
  onFrame,
  // playerPosition, playerLap, totalLaps — received but HUD lives in NascarCarsGame
  numAiCars,
  countdown,
  locale,
}: NascarSceneProps) {
  const { camera } = useThree();
  const playerCarRef = useRef<THREE.Group>(null);
  const aiCarRefs = useRef<(THREE.Group | null)[]>([]);
  const cameraTarget = useRef(new THREE.Vector3());
  const cameraPos = useRef(new THREE.Vector3(0, 4, 20));
  const flagRef = useRef<THREE.Mesh | null>(null);

  // Braking / drafting / speed as state — safe to read in JSX
  const [playerSpeed, setPlayerSpeed] = useState(0);
  const [isBraking, setIsBraking] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const prevPlayerSpeedRef = useRef(0);

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
    // Animate flag
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(Date.now() * 0.005) * 0.35;
    }

    if (paused || !gameActive) return;

    onFrame(delta);

    const state = raceStateRef.current;
    const player = state.player;

    // Detect braking / drafting for car visual props
    const currentSpeed = player.speed;
    const braking = currentSpeed < prevPlayerSpeedRef.current - 0.02;
    prevPlayerSpeedRef.current = currentSpeed;
    setPlayerSpeed(currentSpeed);
    setIsBraking(braking);
    setIsDrafting(state.playerDrafting ?? false);

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

    // ── Cinematic low-slung NASCAR camera ──
    const camDist = 5;      // was 7 — tighter, more immersive
    const camHeight = 1.8;  // was 4 — TV broadcast low-angle feel
    const behindAngle = player.angle - 0.12;
    const behindPos = getTrackPosition(behindAngle, TRACK_RADIUS_X + camDist, TRACK_RADIUS_Z + camDist, 0);

    const targetCamPos = new THREE.Vector3(behindPos.x, camHeight, behindPos.z);

    // Look slightly ahead of player — shows oncoming traffic
    const aheadAngle = player.angle + 0.14;
    const aheadPos = getTrackPosition(aheadAngle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);
    const targetLookAt = new THREE.Vector3(aheadPos.x, 0.7, aheadPos.z);

    cameraPos.current.lerp(targetCamPos, 0.10);
    cameraTarget.current.lerp(targetLookAt, 0.15);

    camera.position.copy(cameraPos.current);
    camera.lookAt(cameraTarget.current);

    // Camera shake at high speed — mutate via cameraPos ref, not camera directly
    const speedPct = state.playerSpeedPct / 100;
    if (speedPct > 0.65) {
      const shakeAmt = (speedPct - 0.65) * 0.018;
      cameraPos.current.x += (Math.random() - 0.5) * shakeAmt;
      cameraPos.current.y += (Math.random() - 0.5) * shakeAmt * 0.4;
      camera.position.copy(cameraPos.current);
    }
  });

  // Ensure refs array size (numAiCars is a prop, never changes mid-race)
  useEffect(() => {
    aiCarRefs.current = Array(numAiCars).fill(null);
  }, [numAiCars]);

  return (
    <>
      {/* Sky — race-day afternoon feel */}
      <Sky sunPosition={[100, 40, 80]} turbidity={3} rayleigh={0.6} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <color attach="background" args={['#87ceeb']} />
      <fog attach="fog" args={['#c8d6e5', 50, 120]} />

      {/* Main sun */}
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-15, 15, -10]} intensity={0.4} />
      <hemisphereLight args={['#87ceeb', '#3a8c3f', 0.5]} />
      <ambientLight intensity={0.25} />

      {/* Track (Daytona style with pit lane) */}
      <Track showPitLane />

      {/* Animated checkered flag at start/finish */}
      <mesh ref={flagRef} position={[TRACK_RADIUS_X + 3.5, 4.5, 0.5]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[TRACK_RADIUS_X + 3.5, 4.5, 0.51]}>
        <planeGeometry args={[0.56, 0.36]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Flag pole */}
      <mesh position={[TRACK_RADIUS_X + 3.5, 2.5, 0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 5, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>

      {/* Player Car */}
      <group ref={playerCarRef} position={[TRACK_RADIUS_X, 0.25, 0]}>
        <Car
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          color="#ffeb3b"
          speed={playerSpeed}
          isPlayer
          carNumber={1}
          braking={isBraking}
          drafting={isDrafting}
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
            carNumber={i + 2}
          />
        </group>
      ))}

      {/* Countdown text */}
      {countdown > 0 && (
        <CountdownText
          cameraTarget={cameraTarget}
          cameraPos={cameraPos}
          countdown={countdown}
          goLabel={labels.go}
        />
      )}

      {/* Post-processing — bloom + vignette for cinematic feel */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.35} luminanceSmoothing={0.7} intensity={0.9} />
        <Vignette eskil={false} offset={0.35} darkness={0.55} />
      </EffectComposer>
    </>
  );
}
