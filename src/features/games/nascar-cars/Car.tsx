'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface CarProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  speed?: number;
  isPlayer?: boolean;
  number?: number;
}

/**
 * NASCAR Next-Gen style stock car — low profile, wide body,
 * prominent rear spoiler, front splitter, center-lock wheels.
 */
export function Car({
  position,
  rotation,
  color,
  speed = 0,
  isPlayer = false,
}: CarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelFLRef = useRef<THREE.Mesh>(null);
  const wheelFRRef = useRef<THREE.Mesh>(null);
  const wheelBLRef = useRef<THREE.Mesh>(null);
  const wheelBRRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const spinRate = speed * delta * 8;
    [wheelFLRef, wheelFRRef, wheelBLRef, wheelBRRef].forEach((ref) => {
      if (ref.current) ref.current.rotation.x += spinRate;
    });
  });

  const wheelY = -0.18;
  const wheelZ_front = 0.6;
  const wheelZ_back = -0.58;
  const wheelX = 0.55;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main body — low and wide NASCAR stock car */}
      <RoundedBox args={[1.3, 0.32, 1.8]} radius={0.08} smoothness={4} castShadow position={[0, 0.08, 0]}>
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.3} />
      </RoundedBox>

      {/* Cabin / roof — narrow, set back */}
      <RoundedBox args={[0.9, 0.28, 0.75]} radius={0.08} smoothness={4} castShadow position={[0, 0.32, -0.05]}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.2} />
      </RoundedBox>

      {/* Roof stripe */}
      <mesh position={[0, 0.47, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 0.7]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.3, 0.32]} rotation={[0.4, 0, 0]}>
        <planeGeometry args={[0.75, 0.3]} />
        <meshStandardMaterial color="#90caf9" transparent opacity={0.6} roughness={0.1} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.3, -0.4]} rotation={[-0.4, 0, 0]}>
        <planeGeometry args={[0.65, 0.22]} />
        <meshStandardMaterial color="#90caf9" transparent opacity={0.5} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Side stripe / racing livery */}
      {[-1, 1].map((side) => (
        <mesh key={`stripe-${side}`} position={[side * 0.651, 0.12, 0]} rotation={[0, (side > 0 ? 1 : -1) * Math.PI / 2, 0]}>
          <planeGeometry args={[1.6, 0.18]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* ── Number panel (sides) ── */}
      {[-1, 1].map((side) => (
        <mesh key={`num-${side}`} position={[side * 0.652, 0.15, -0.15]} rotation={[0, (side > 0 ? 1 : -1) * Math.PI / 2, 0]}>
          <planeGeometry args={[0.4, 0.22]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* ── Front splitter ── */}
      <mesh position={[0, -0.08, 0.9]} castShadow>
        <boxGeometry args={[1.3, 0.04, 0.15]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* ── Front grille ── */}
      <mesh position={[0, 0.06, 0.91]}>
        <planeGeometry args={[0.9, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.42, 0.08, 0.88]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.42, 0.08, 0.88]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.5} />
      </mesh>

      {/* Taillights (wide, LED-style) */}
      <mesh position={[-0.4, 0.08, -0.91]}>
        <boxGeometry args={[0.25, 0.06, 0.04]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.4, 0.08, -0.91]}>
        <boxGeometry args={[0.25, 0.06, 0.04]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={0.4} />
      </mesh>

      {/* ── Rear spoiler (prominent — NASCAR Next Gen) ── */}
      <mesh position={[0, 0.48, -0.82]} castShadow>
        <boxGeometry args={[1.2, 0.04, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Spoiler endplates */}
      {[-0.58, 0.58].map((sx) => (
        <mesh key={`ep-${sx}`} position={[sx, 0.42, -0.82]}>
          <boxGeometry args={[0.04, 0.16, 0.28]} />
          <meshStandardMaterial color="#333" metalness={0.6} />
        </mesh>
      ))}
      {/* Spoiler supports */}
      {[-0.35, 0.35].map((sx) => (
        <mesh key={`ss-${sx}`} position={[sx, 0.36, -0.8]}>
          <boxGeometry args={[0.04, 0.12, 0.04]} />
          <meshStandardMaterial color="#444" metalness={0.7} />
        </mesh>
      ))}

      {/* ── Rear bumper / diffuser ── */}
      <mesh position={[0, -0.04, -0.9]}>
        <boxGeometry args={[1.2, 0.12, 0.08]} />
        <meshStandardMaterial color="#222" roughness={0.6} />
      </mesh>

      {/* ── Hood scoop / vents ── */}
      <mesh position={[0, 0.25, 0.2]}>
        <boxGeometry args={[0.3, 0.04, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* ── Googly eyes — Pixar style (player car only) ── */}
      {isPlayer && (
        <group position={[0, 0.32, 0.5]}>
          <mesh position={[-0.18, 0, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.18, 0.01, 0.08]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.18, 0, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.18, 0.01, 0.08]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      )}

      {/* Smile (player car) */}
      {isPlayer && (
        <mesh position={[0, 0.16, 0.92]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.12, 0.02, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      )}

      {/* ── Wheels (wider, lower — center lock style) ── */}
      {[
        { ref: wheelFLRef, pos: [-wheelX, wheelY, wheelZ_front] as [number, number, number] },
        { ref: wheelFRRef, pos: [wheelX, wheelY, wheelZ_front] as [number, number, number] },
        { ref: wheelBLRef, pos: [-wheelX, wheelY, wheelZ_back] as [number, number, number] },
        { ref: wheelBRRef, pos: [wheelX, wheelY, wheelZ_back] as [number, number, number] },
      ].map(({ ref, pos }, i) => (
        <group key={i} position={pos}>
          {/* Tire */}
          <mesh ref={ref} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.14, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
          </mesh>
          {/* Center lock / hubcap */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[i % 2 === 0 ? -0.08 : 0.08, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 6]} />
            <meshStandardMaterial color="#bbb" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Car color presets for AI opponents ──────────────────────
export const AI_CAR_COLORS = [
  '#e53935', // red
  '#1e88e5', // blue
  '#43a047', // green
  '#fb8c00', // orange
  '#8e24aa', // purple
  '#00acc1', // teal
  '#f4511e', // deep orange
  '#3949ab', // indigo
  '#c0ca33', // lime
  '#d81b60', // pink
];
