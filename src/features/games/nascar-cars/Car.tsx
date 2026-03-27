'use client';

import { Suspense, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

// ─── Car types with distinct silhouettes ─────────────────────
export type CarType = 'stock' | 'formula' | 'muscle';

export const CAR_TYPE_LABELS: Record<string, Record<CarType, string>> = {
  en: { stock: 'Stock Car', formula: 'Formula', muscle: 'Muscle Car' },
  he: { stock: 'מכונית מירוץ', formula: 'פורמולה', muscle: 'מאסל קאר' },
  zh: { stock: '方程式赛车', formula: '一级方程式', muscle: '肌肉车' },
  es: { stock: 'Stock Car', formula: 'Fórmula', muscle: 'Muscle Car' },
};

// ─── Player color presets ────────────────────────────────────
export const PLAYER_COLORS = [
  { hex: '#ffeb3b', name: 'Yellow' },
  { hex: '#e53935', name: 'Red' },
  { hex: '#1e88e5', name: 'Blue' },
  { hex: '#43a047', name: 'Green' },
  { hex: '#fb8c00', name: 'Orange' },
  { hex: '#8e24aa', name: 'Purple' },
  { hex: '#f5f5f5', name: 'White' },
  { hex: '#212121', name: 'Black' },
  { hex: '#d81b60', name: 'Pink' },
  { hex: '#00acc1', name: 'Teal' },
];

interface CarProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  speed?: number;
  isPlayer?: boolean;
  carNumber?: number;
  braking?: boolean;
  drafting?: boolean;
  carType?: CarType;
}

/**
 * Race car — supports stock, formula, and muscle body styles.
 * Exhaust particles, brake glow, draft shimmer all shared.
 */
export function Car({
  position,
  rotation,
  color,
  speed = 0,
  isPlayer = false,
  carNumber = 0,
  braking = false,
  drafting = false,
  carType = 'stock',
}: CarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelFLRef = useRef<THREE.Mesh>(null);
  const wheelFRRef = useRef<THREE.Mesh>(null);
  const wheelBLRef = useRef<THREE.Mesh>(null);
  const wheelBRRef = useRef<THREE.Mesh>(null);
  // Exhaust: created once, mutated each frame via ref
  const exhaustGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const exhaustMatRef = useRef<THREE.PointsMaterial | null>(null);
  const exhaustPointsRef = useRef<THREE.Points | null>(null);

  // Create exhaust geometry once and add to parent group
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const positions = new Float32Array(60);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.07,
      color: '#bbbbbb',
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    exhaustGeoRef.current = geo;
    exhaustMatRef.current = mat;
    exhaustPointsRef.current = pts;
    group.add(pts);
    return () => {
      group.remove(pts);
      geo.dispose();
      mat.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    // Wheel spin
    const spinRate = speed * delta * 8;
    [wheelFLRef, wheelFRRef, wheelBLRef, wheelBRRef].forEach((ref) => {
      if (ref.current) ref.current.rotation.x += spinRate;
    });

    // Exhaust particles
    if (exhaustGeoRef.current && exhaustMatRef.current) {
      exhaustMatRef.current.opacity = speed > 0.3 ? 0.55 : 0;
      if (speed > 0.3) {
        const pts = exhaustGeoRef.current.attributes.position as THREE.BufferAttribute;
        const arr = pts.array as Float32Array;
        for (let i = 0; i < 20; i++) {
          arr[i * 3]     += (Math.random() - 0.5) * 0.016;
          arr[i * 3 + 1] += 0.013;
          arr[i * 3 + 2] += 0.09 * speed;
          if (arr[i * 3 + 2] > 2.8) {
            arr[i * 3]     = (Math.random() - 0.5) * 0.14;
            arr[i * 3 + 1] = 0.04;
            arr[i * 3 + 2] = -0.92;
          }
        }
        pts.needsUpdate = true;
      }
    }
  });

  const wheelY = -0.18;
  const wheelZ_front = carType === 'formula' ? 0.75 : 0.6;
  const wheelZ_back = carType === 'formula' ? -0.72 : -0.58;
  const wheelX = carType === 'formula' ? 0.62 : 0.55;
  const wheelRadius = carType === 'formula' ? 0.22 : 0.19;
  const wheelWidth = carType === 'formula' ? 0.18 : 0.14;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>

      {/* ════════ STOCK CAR ════════ */}
      {carType === 'stock' && (
        <group>
          {/* Main body — low and wide NASCAR stock car */}
          <RoundedBox args={[1.3, 0.32, 1.8]} radius={0.08} smoothness={4} castShadow position={[0, 0.08, 0]}>
            <meshStandardMaterial color={color} roughness={0.25} metalness={0.3} />
          </RoundedBox>
          {/* Cabin / roof */}
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
          {/* Side stripes */}
          {[-1, 1].map((side) => (
            <mesh key={`stripe-${side}`} position={[side * 0.651, 0.12, 0]} rotation={[0, (side > 0 ? 1 : -1) * Math.PI / 2, 0]}>
              <planeGeometry args={[1.6, 0.18]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))}
          {/* Number panels */}
          {[-1, 1].map((side) => (
            <mesh key={`num-${side}`} position={[side * 0.652, 0.15, -0.15]} rotation={[0, (side > 0 ? 1 : -1) * Math.PI / 2, 0]}>
              <planeGeometry args={[0.4, 0.22]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))}
          {/* Rear spoiler */}
          <mesh position={[0, 0.48, -0.82]} castShadow>
            <boxGeometry args={[1.2, 0.04, 0.28]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>
          {[-0.58, 0.58].map((sx) => (
            <mesh key={`ep-${sx}`} position={[sx, 0.42, -0.82]}>
              <boxGeometry args={[0.04, 0.16, 0.28]} />
              <meshStandardMaterial color="#333" metalness={0.6} />
            </mesh>
          ))}
          {[-0.35, 0.35].map((sx) => (
            <mesh key={`ss-${sx}`} position={[sx, 0.36, -0.8]}>
              <boxGeometry args={[0.04, 0.12, 0.04]} />
              <meshStandardMaterial color="#444" metalness={0.7} />
            </mesh>
          ))}
          {/* Hood scoop */}
          <mesh position={[0, 0.25, 0.2]}>
            <boxGeometry args={[0.3, 0.04, 0.2]} />
            <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* ════════ FORMULA / OPEN-WHEEL ════════ */}
      {carType === 'formula' && (
        <group>
          {/* Central monocoque — narrow nose-cone shape */}
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.55, 0.22, 2.1]} />
            <meshStandardMaterial color={color} roughness={0.15} metalness={0.5} />
          </mesh>
          {/* Nose cone — tapered front */}
          <mesh position={[0, 0.06, 1.15]} castShadow>
            <boxGeometry args={[0.35, 0.16, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.15} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.04, 1.4]}>
            <boxGeometry args={[0.2, 0.1, 0.25]} />
            <meshStandardMaterial color={color} roughness={0.15} metalness={0.5} />
          </mesh>
          {/* Front wing — wide, low */}
          <mesh position={[0, -0.04, 1.25]}>
            <boxGeometry args={[1.4, 0.02, 0.25]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.4} />
          </mesh>
          {/* Front wing endplates */}
          {[-0.68, 0.68].map((sx) => (
            <mesh key={`fwep-${sx}`} position={[sx, 0.0, 1.25]}>
              <boxGeometry args={[0.03, 0.1, 0.25]} />
              <meshStandardMaterial color="#222" metalness={0.6} />
            </mesh>
          ))}
          {/* Halo / cockpit surround */}
          <mesh position={[0, 0.22, -0.1]}>
            <boxGeometry args={[0.5, 0.06, 0.55]} />
            <meshStandardMaterial color="#333" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Driver helmet */}
          <mesh position={[0, 0.24, -0.15]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Side pods (air intakes) */}
          {[-1, 1].map((side) => (
            <mesh key={`pod-${side}`} position={[side * 0.42, 0.04, -0.15]} castShadow>
              <boxGeometry args={[0.3, 0.18, 0.9]} />
              <meshStandardMaterial color={color} roughness={0.2} metalness={0.4} />
            </mesh>
          ))}
          {/* Engine cover — raised hump behind driver */}
          <mesh position={[0, 0.14, -0.65]}>
            <boxGeometry args={[0.35, 0.18, 0.6]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.4} />
          </mesh>
          {/* Rear wing — high, large */}
          <mesh position={[0, 0.42, -0.95]}>
            <boxGeometry args={[1.0, 0.03, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Rear wing endplates */}
          {[-0.48, 0.48].map((sx) => (
            <mesh key={`rwep-${sx}`} position={[sx, 0.36, -0.95]}>
              <boxGeometry args={[0.03, 0.14, 0.22]} />
              <meshStandardMaterial color="#333" metalness={0.6} />
            </mesh>
          ))}
          {/* Rear wing pylons */}
          {[-0.12, 0.12].map((sx) => (
            <mesh key={`rwp-${sx}`} position={[sx, 0.26, -0.92]}>
              <boxGeometry args={[0.03, 0.2, 0.03]} />
              <meshStandardMaterial color="#444" metalness={0.7} />
            </mesh>
          ))}
          {/* DRS flap */}
          <mesh position={[0, 0.46, -0.85]}>
            <boxGeometry args={[0.9, 0.015, 0.1]} />
            <meshStandardMaterial color={color} roughness={0.15} metalness={0.5} />
          </mesh>
          {/* Rear diffuser */}
          <mesh position={[0, -0.06, -1.0]}>
            <boxGeometry args={[0.8, 0.08, 0.15]} />
            <meshStandardMaterial color="#111" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Air intake above driver */}
          <mesh position={[0, 0.3, -0.05]}>
            <boxGeometry args={[0.18, 0.12, 0.18]} />
            <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* ════════ MUSCLE CAR ════════ */}
      {carType === 'muscle' && (
        <group>
          {/* Main body — long, aggressive */}
          <RoundedBox args={[1.35, 0.35, 2.0]} radius={0.06} smoothness={4} castShadow position={[0, 0.08, 0]}>
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.35} />
          </RoundedBox>
          {/* Cabin — fastback slope */}
          <RoundedBox args={[0.95, 0.26, 0.65]} radius={0.06} smoothness={4} castShadow position={[0, 0.3, -0.1]}>
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
          </RoundedBox>
          {/* Windshield */}
          <mesh position={[0, 0.28, 0.28]} rotation={[0.35, 0, 0]}>
            <planeGeometry args={[0.78, 0.28]} />
            <meshStandardMaterial color="#90caf9" transparent opacity={0.55} roughness={0.1} metalness={0.3} side={THREE.DoubleSide} />
          </mesh>
          {/* Hood scoop — aggressive raised intake */}
          <mesh position={[0, 0.28, 0.35]} castShadow>
            <boxGeometry args={[0.3, 0.08, 0.45]} />
            <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Hood power bulge */}
          <mesh position={[0, 0.27, 0.15]} castShadow>
            <boxGeometry args={[0.6, 0.04, 0.8]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
          </mesh>
          {/* Racing stripes (twin center) */}
          {[-0.12, 0.12].map((sx) => (
            <mesh key={`rstripe-${sx}`} position={[sx, 0.265, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.1, 1.8]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))}
          {/* Side exhaust pipes */}
          {[-1, 1].map((side) => (
            <group key={`exhaust-${side}`}>
              <mesh position={[side * 0.65, -0.05, -0.3]}>
                <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
                <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[side * 0.65, -0.05, -0.5]}>
                <cylinderGeometry args={[0.05, 0.04, 0.06, 8]} />
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          ))}
          {/* Rear spoiler (lip-style, not as tall as stock) */}
          <mesh position={[0, 0.28, -0.95]} castShadow>
            <boxGeometry args={[1.2, 0.04, 0.12]} />
            <meshStandardMaterial color="#222" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Wide fender flares */}
          {[-1, 1].map((side) => (
            <mesh key={`flare-${side}`} position={[side * 0.65, 0.0, -0.5]}>
              <boxGeometry args={[0.12, 0.22, 0.5]} />
              <meshStandardMaterial color={color} roughness={0.25} metalness={0.3} />
            </mesh>
          ))}
          {/* Rear window */}
          <mesh position={[0, 0.28, -0.42]} rotation={[-0.35, 0, 0]}>
            <planeGeometry args={[0.7, 0.2]} />
            <meshStandardMaterial color="#90caf9" transparent opacity={0.5} roughness={0.1} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ════════ SHARED PARTS (all car types) ════════ */}

      {/* Front splitter */}
      <mesh position={[0, -0.08, carType === 'formula' ? 1.3 : 0.9]} castShadow>
        <boxGeometry args={[carType === 'formula' ? 1.4 : 1.3, 0.04, 0.15]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Front grille */}
      {carType !== 'formula' && (
        <mesh position={[0, 0.06, 0.91]}>
          <planeGeometry args={[0.9, 0.2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}

      {/* Headlights */}
      <mesh position={[-0.42, 0.08, carType === 'formula' ? 1.1 : 0.88]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.42, 0.08, carType === 'formula' ? 1.1 : 0.88]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.5} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.4, 0.08, carType === 'formula' ? -1.05 : -0.91]}>
        <boxGeometry args={[0.25, 0.06, 0.04]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={braking ? 2.5 : 0.4} />
      </mesh>
      <mesh position={[0.4, 0.08, carType === 'formula' ? -1.05 : -0.91]}>
        <boxGeometry args={[0.25, 0.06, 0.04]} />
        <meshStandardMaterial color="#ef5350" emissive="#e53935" emissiveIntensity={braking ? 2.5 : 0.4} />
      </mesh>
      <pointLight position={[0, 0.08, carType === 'formula' ? -1.1 : -0.95]} intensity={braking ? 4 : 0} color="#ff1744" distance={3} />
      <pointLight position={[0, 0.08, carType === 'formula' ? 1.15 : 0.95]} intensity={0.6} color="#fffde7" distance={4} />

      {/* Rear bumper / diffuser */}
      <mesh position={[0, -0.04, carType === 'formula' ? -1.05 : -0.9]}>
        <boxGeometry args={[1.2, 0.12, 0.08]} />
        <meshStandardMaterial color="#222" roughness={0.6} />
      </mesh>

      {/* Player car indicator */}
      {isPlayer && (
        <pointLight position={[0, 1.2, 0]} intensity={2.5} color="#ffeb3b" distance={3} />
      )}

      {/* Draft shimmer */}
      {drafting && (
        <RoundedBox args={[1.38, 0.36, carType === 'formula' ? 2.2 : 1.88]} radius={0.09} smoothness={3} position={[0, 0.08, 0]}>
          <meshStandardMaterial color="#e3f2fd" transparent opacity={0.18} emissive="#90caf9" emissiveIntensity={1.0} depthWrite={false} />
        </RoundedBox>
      )}

      {/* Race number on roof / nose */}
      {carNumber > 0 && (
        <Suspense fallback={null}>
          <Text
            position={carType === 'formula' ? [0, 0.2, 0.7] : [0, 0.49, -0.05]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.22}
            color="black"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.025}
            outlineColor="white"
          >
            {String(carNumber)}
          </Text>
        </Suspense>
      )}

      {/* Exhaust smoke particles — added imperatively in useEffect above */}

      {/* Wheels */}
      {[
        { ref: wheelFLRef, pos: [-wheelX, wheelY, wheelZ_front] as [number, number, number] },
        { ref: wheelFRRef, pos: [wheelX, wheelY, wheelZ_front] as [number, number, number] },
        { ref: wheelBLRef, pos: [-wheelX, wheelY, wheelZ_back] as [number, number, number] },
        { ref: wheelBRRef, pos: [wheelX, wheelY, wheelZ_back] as [number, number, number] },
      ].map(({ ref, pos }, i) => (
        <group key={i} position={pos}>
          <mesh ref={ref} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[i % 2 === 0 ? -0.08 : 0.08, 0, 0]}>
            <cylinderGeometry args={[wheelRadius * 0.42, wheelRadius * 0.42, 0.02, 6]} />
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
