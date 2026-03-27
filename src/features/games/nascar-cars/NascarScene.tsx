'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Sky, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, SSAO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Car, AI_CAR_COLORS, CarType } from './Car';
import { Track, getTrackPosition } from './Track';
import { RaceState, GAME_CONSTANTS } from './useNascarGame';

export type CameraMode = 'tv' | 'cockpit';

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
  cameraMode?: CameraMode;
  playerColor?: string;
  playerCarType?: CarType;
  steerAngle?: number;  // -1 to 1 for cockpit steering wheel
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
  cameraMode = 'tv',
  playerColor = '#ffeb3b',
  playerCarType = 'stock',
  steerAngle = 0,
}: NascarSceneProps) {
  const { camera } = useThree();
  const playerCarRef = useRef<THREE.Group>(null);
  const aiCarRefs = useRef<(THREE.Group | null)[]>([]);
  const cameraTarget = useRef(new THREE.Vector3());
  const cameraPos = useRef(new THREE.Vector3(0, 10, 60));
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

    // ── Camera ──
    if (cameraMode === 'cockpit') {
      // First-person cockpit — sit at driver eye level, look forward along track
      const cockpitPos = getTrackPosition(player.angle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);
      const lookAheadAngle = player.angle + 0.08;
      const lookAheadPos = getTrackPosition(lookAheadAngle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);

      const targetCamPos = new THREE.Vector3(cockpitPos.x, 0.7, cockpitPos.z);
      const targetLookAt = new THREE.Vector3(lookAheadPos.x, 0.5, lookAheadPos.z);

      // Smooth but responsive
      cameraPos.current.lerp(targetCamPos, 0.15);
      cameraTarget.current.lerp(targetLookAt, 0.12);
    } else {
      // TV chase camera — smooth follow behind
      const camDist = 14;
      const camHeight = 6;
      const behindAngle = player.angle - 0.04;
      const behindPos = getTrackPosition(behindAngle, TRACK_RADIUS_X + camDist, TRACK_RADIUS_Z + camDist, 0);

      const targetCamPos = new THREE.Vector3(behindPos.x, camHeight, behindPos.z);
      const aheadAngle = player.angle + 0.06;
      const aheadPos = getTrackPosition(aheadAngle, TRACK_RADIUS_X, TRACK_RADIUS_Z, player.laneOffset);
      const targetLookAt = new THREE.Vector3(aheadPos.x, 0.8, aheadPos.z);

      // Slower lerp for smoother TV feel
      cameraPos.current.lerp(targetCamPos, 0.04);
      cameraTarget.current.lerp(targetLookAt, 0.06);
    }

    camera.position.copy(cameraPos.current);
    camera.lookAt(cameraTarget.current);

    // Camera shake at high speed — very subtle
    const speedPct = state.playerSpeedPct / 100;
    if (speedPct > 0.75) {
      const intensity = cameraMode === 'cockpit' ? 0.004 : 0.008;
      const shakeAmt = (speedPct - 0.75) * intensity;
      cameraPos.current.x += (Math.random() - 0.5) * shakeAmt;
      cameraPos.current.y += (Math.random() - 0.5) * shakeAmt * 0.3;
      camera.position.copy(cameraPos.current);
    }
  });

  // Ensure refs array size (numAiCars is a prop, never changes mid-race)
  useEffect(() => {
    aiCarRefs.current = Array(numAiCars).fill(null);
  }, [numAiCars]);

  return (
    <>
      {/* Environment map for reflections on cars */}
      <Environment preset="dawn" />

      {/* Sky — race-day afternoon feel */}
      <Sky sunPosition={[100, 40, 80]} turbidity={3} rayleigh={0.6} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <color attach="background" args={['#87ceeb']} />
      <fog attach="fog" args={['#c8d6e5', 120, 400]} />

      {/* Main sun — higher-res shadow map */}
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0003}
      />
      {/* Warm fill from opposite side */}
      <directionalLight position={[-15, 15, -10]} intensity={0.5} color="#ffe0b2" />
      <hemisphereLight args={['#87ceeb', '#3a8c3f', 0.6]} />
      <ambientLight intensity={0.2} />

      {/* Contact shadows ground cars to the track */}
      <ContactShadows
        position={[0, 0.005, 0]}
        scale={250}
        blur={2}
        opacity={0.45}
        far={100}
      />

      {/* Track (Daytona style with pit lane) */}
      <Track showPitLane />

      {/* Animated checkered flag at start/finish — outside SAFER barrier */}
      <mesh ref={flagRef} position={[TRACK_RADIUS_X + 8, 6.5, 1.5]}>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[TRACK_RADIUS_X + 8, 6.5, 1.52]}>
        <planeGeometry args={[1.1, 0.7]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Flag pole */}
      <mesh position={[TRACK_RADIUS_X + 8, 3.5, 1.5]}>
        <cylinderGeometry args={[0.06, 0.06, 7, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>

      {/* Player Car — hidden in cockpit mode so it doesn't clip */}
      <group ref={playerCarRef} position={[TRACK_RADIUS_X, 0.25, 0]}>
        {cameraMode !== 'cockpit' && (
          <Car
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            color={playerColor}
            speed={playerSpeed}
            isPlayer
            carNumber={1}
            braking={isBraking}
            drafting={isDrafting}
            carType={playerCarType}
          />
        )}

        {/* ═══ Cockpit Interior ═══ */}
        {cameraMode === 'cockpit' && (
          <group position={[0, 0.1, 0]}>
            {/* Dashboard — dark panel in front of driver */}
            <mesh position={[0, 0.25, 0.35]}>
              <boxGeometry args={[1.0, 0.08, 0.4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
            {/* Dashboard top cover */}
            <mesh position={[0, 0.3, 0.3]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[1.0, 0.02, 0.3]} />
              <meshStandardMaterial color="#222" roughness={0.7} />
            </mesh>
            {/* Steering column */}
            <mesh position={[0, 0.2, 0.2]} rotation={[0.5, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
              <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>
            {/* Steering wheel — rotates with steer input */}
            <group position={[0, 0.28, 0.12]} rotation={[0.5, 0, -steerAngle * 0.8]}>
              {/* Wheel rim (torus) */}
              <mesh>
                <torusGeometry args={[0.14, 0.015, 8, 24]} />
                <meshStandardMaterial color="#111" roughness={0.4} metalness={0.3} />
              </mesh>
              {/* Center hub */}
              <mesh>
                <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
              </mesh>
              {/* Spokes */}
              {[0, Math.PI * 0.67, Math.PI * 1.33].map((a, i) => (
                <mesh key={`spoke-${i}`} position={[Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0]} rotation={[0, 0, a]}>
                  <boxGeometry args={[0.14, 0.018, 0.012]} />
                  <meshStandardMaterial color="#222" metalness={0.5} />
                </mesh>
              ))}
              {/* Top marker (12 o'clock) */}
              <mesh position={[0, 0.13, 0]}>
                <boxGeometry args={[0.03, 0.015, 0.018]} />
                <meshStandardMaterial color="#e53935" emissive="#e53935" emissiveIntensity={0.5} />
              </mesh>
            </group>
            {/* Speed display */}
            <mesh position={[0.2, 0.26, 0.38]}>
              <boxGeometry args={[0.12, 0.08, 0.01]} />
              <meshStandardMaterial color="#111" emissive="#00e676" emissiveIntensity={0.3} />
            </mesh>
            {/* RPM display */}
            <mesh position={[-0.2, 0.26, 0.38]}>
              <boxGeometry args={[0.12, 0.08, 0.01]} />
              <meshStandardMaterial color="#111" emissive="#ff9100" emissiveIntensity={0.3} />
            </mesh>
            {/* Side panels (door cards) */}
            {[-1, 1].map((side) => (
              <mesh key={`door-${side}`} position={[side * 0.48, 0.2, 0.1]}>
                <boxGeometry args={[0.04, 0.25, 0.6]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* AI Cars */}
      {Array.from({ length: numAiCars }).map((_, i) => (
        <group
          key={i}
          ref={(el: THREE.Group | null) => { aiCarRefs.current[i] = el; }}
          position={[TRACK_RADIUS_X - (i + 1) * 3.0, 0.25, 0]}
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

      {/* Post-processing — cinematic racing effects */}
      <EffectComposer>
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={16}
          radius={5}
          intensity={20}
        />
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={1.0} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0008]}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.5} />
      </EffectComposer>
    </>
  );
}
