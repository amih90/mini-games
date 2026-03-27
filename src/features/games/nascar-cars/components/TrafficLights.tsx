'use client';

import { GAME_CONSTANTS } from '../useNascarGame';

const { TRACK_RADIUS_X } = GAME_CONSTANTS;

/**
 * Race-start traffic light gantry above the start/finish line.
 * Shows 3 red lights during countdown, then green on GO.
 */
export function TrafficLights({ countdown }: { countdown: number }) {
  const lightsOn = countdown > 0;
  const count = lightsOn ? Math.ceil(countdown) : 0;

  return (
    <group position={[TRACK_RADIUS_X + 2, 0, 0]}>
      {/* Gantry structure — arch over the track */}
      {/* Left post */}
      <mesh position={[-6, 3.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 7, 8]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>
      {/* Right post */}
      <mesh position={[6, 3.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 7, 8]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>
      {/* Cross beam */}
      <mesh position={[0, 7.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 12, 8]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>

      {/* Light housing */}
      <mesh position={[0, 7, 0.2]}>
        <boxGeometry args={[3.5, 0.8, 0.3]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>

      {/* 3 lights: red/red/red during countdown, green on go */}
      {[0, 1, 2].map((idx) => {
        const isRed = lightsOn && count >= 3 - idx;
        const isGreen = !lightsOn && countdown <= 0 && countdown > -2;
        const emissive = isRed ? '#ff0000' : isGreen ? '#00ff00' : '#111111';
        const color = isRed ? '#ff3333' : isGreen ? '#33ff33' : '#222222';
        return (
          <group key={idx}>
            <mesh position={[-1 + idx * 1, 7, 0.4]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={isRed || isGreen ? 2.0 : 0} />
            </mesh>
            {(isRed || isGreen) && (
              <pointLight
                position={[-1 + idx * 1, 6.5, 1]}
                intensity={8}
                color={isRed ? '#ff0000' : '#00ff00'}
                distance={8}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
