'use client';

import { Environment as DreiEnvironment } from '@react-three/drei';
import * as THREE from 'three';
import { BattleEnvironment } from '../types';

interface EnvironmentProps {
  env: BattleEnvironment;
}

const HDRI_MAP: Record<BattleEnvironment, string> = {
  desert_storm:     '/textures/merge-tank/desert_storm.hdr',
  european_theater: '/textures/merge-tank/european_theater.hdr',
  arctic_front:     '/textures/merge-tank/arctic_front.hdr',
  urban_rubble:     '/textures/merge-tank/urban_rubble.hdr',
  night_battle:     '/textures/merge-tank/night_battle.hdr',
};

export function BattleEnvironment3D({ env }: EnvironmentProps) {
  const hdriPath = HDRI_MAP[env];

  return (
    <>
      <DreiEnvironment files={hdriPath} background />

      {env === 'desert_storm' && <DesertStorm />}
      {env === 'european_theater' && <EuropeanTheater />}
      {env === 'arctic_front' && <ArcticFront />}
      {env === 'urban_rubble' && <UrbanRubble />}
      {env === 'night_battle' && <NightBattle />}
    </>
  );
}

// ─── Desert Storm ─────────────────────────────────────────────────────────

function DesertStorm() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#d4b896" roughness={0.9} metalness={0} />
      </mesh>
      {/* Sand berm divider */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.4, 0.8, 14]} />
        <meshStandardMaterial color="#c8a060" roughness={0.9} metalness={0} />
      </mesh>
      {/* Rocks */}
      <mesh position={[-7, 0.2, 3]} castShadow>
        <sphereGeometry args={[0.6, 6, 5]} />
        <meshStandardMaterial color="#b8956a" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[8, 0.15, -2]} castShadow>
        <sphereGeometry args={[0.4, 6, 5]} />
        <meshStandardMaterial color="#c0a070" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[6, 0.25, 5]} castShadow>
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshStandardMaterial color="#aa8860" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── European Theater ────────────────────────────────────────────────────

function EuropeanTheater() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#4a6840" roughness={0.85} metalness={0} />
      </mesh>
      {/* Hedgerow divider */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 14]} />
        <meshStandardMaterial color="#4a5c3a" roughness={0.9} metalness={0} />
      </mesh>
      {/* Dead tree trunks */}
      <mesh position={[-8, 0.8, 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 2.2, 6]} />
        <meshStandardMaterial color="#3d2e1a" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[9, 0.7, -3]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.8, 6]} />
        <meshStandardMaterial color="#3d2e1a" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[-6, 0.6, -4]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 1.5, 6]} />
        <meshStandardMaterial color="#4a3620" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Arctic Front ────────────────────────────────────────────────────────

function ArcticFront() {
  return (
    <group>
      {/* Snow ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#dde8f0" roughness={0.7} metalness={0} />
      </mesh>
      {/* Snow ridge divider */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 14]} />
        <meshStandardMaterial color="#e8f2fc" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Snowy tree stumps */}
      <mesh position={[-7, 0.2, 3]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.5, 6]} />
        <meshStandardMaterial color="#c8d8e8" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[7, 0.2, -2]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.4, 6]} />
        <meshStandardMaterial color="#c0d0e0" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[-5, 0.15, -4]} castShadow>
        <cylinderGeometry args={[0.11, 0.15, 0.45, 6]} />
        <meshStandardMaterial color="#ccdae8" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Urban Rubble ────────────────────────────────────────────────────────

function UrbanRubble() {
  return (
    <group>
      {/* Concrete ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#555560" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Rubble wall – stacked irregular boxes */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.55, 0.55, 13]} />
        <meshStandardMaterial color="#606060" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[0.15, 0.48, 1.5]} castShadow>
        <boxGeometry args={[0.4, 0.35, 0.8]} />
        <meshStandardMaterial color="#707070" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[-0.1, 0.5, -2]} castShadow>
        <boxGeometry args={[0.45, 0.3, 1.0]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Collapsed wall sections */}
      <mesh position={[-9, 0.3, 1]} rotation={[0, 0.2, 0.15]} castShadow>
        <boxGeometry args={[3.5, 0.7, 0.3]} />
        <meshStandardMaterial color="#686868" roughness={1} metalness={0.05} />
      </mesh>
      <mesh position={[9, 0.25, -2]} rotation={[0, -0.15, -0.1]} castShadow>
        <boxGeometry args={[3, 0.6, 0.3]} />
        <meshStandardMaterial color="#5e5e5e" roughness={1} metalness={0.05} />
      </mesh>
    </group>
  );
}

// ─── Night Battle ────────────────────────────────────────────────────────

function NightBattle() {
  return (
    <group>
      {/* Dark ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1e24" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Concertina wire divider */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.03, 0.5, 14]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Night visibility light */}
      <ambientLight intensity={0.15} />
      {/* Searchlight cones */}
      <spotLight
        position={[-10, 5, 4]}
        target-position={[0, 0, 0]}
        angle={0.25}
        penumbra={0.4}
        intensity={3}
        color="#e8f0ff"
        castShadow
      />
      <spotLight
        position={[10, 5, -3]}
        target-position={[0, 0, 0]}
        angle={0.25}
        penumbra={0.4}
        intensity={3}
        color="#e8f0ff"
        castShadow
      />
      {/* Searchlight beam geometry */}
      <mesh position={[-10, 2.5, 4]} rotation={[0, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.05, 5, 8, 1, true]} />
        <meshStandardMaterial
          color="#e8f0ff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[10, 2.5, -3]} rotation={[0, Math.PI, -Math.PI / 4]}>
        <coneGeometry args={[0.05, 5, 8, 1, true]} />
        <meshStandardMaterial
          color="#e8f0ff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
