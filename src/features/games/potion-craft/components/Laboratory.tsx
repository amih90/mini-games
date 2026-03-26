'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Flickering Candle ───────────────────────────────────────

function Candle({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.4 + Math.random() * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Plate */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 12]} />
        <meshStandardMaterial color="#8a7a5a" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Wax body */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#f5e6a3" roughness={0.6} />
      </mesh>
      {/* Flame glow sphere */}
      <mesh position={[0, 0.34, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#ffcc44"
          emissive="#ff8800"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0.36, 0]}
        color="#ffaa44"
        intensity={0.5}
        distance={3}
        decay={2}
      />
    </group>
  );
}

// ─── Book Stack ──────────────────────────────────────────────

function BookStack({ position }: { position: [number, number, number] }) {
  const bookColors = ['#8B0000', '#1a3a5c', '#2d5a1e', '#4a2060'];
  return (
    <group position={position}>
      {bookColors.map((color, i) => (
        <mesh
          key={i}
          position={[
            (i % 2) * 0.05 - 0.02,
            i * 0.12,
            (i % 3) * 0.03,
          ]}
          rotation={[0, i * 0.08, 0]}
        >
          <boxGeometry args={[0.5, 0.1, 0.35]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Scroll ──────────────────────────────────────────────────

function Scroll({ position, rotation }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation ?? [Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
      <meshStandardMaterial color="#d4b896" roughness={0.7} />
    </mesh>
  );
}

// ─── Scientific Equipment ────────────────────────────────────

function ScienceEquipment({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Flask */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#aaddff"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.15, 8]} />
        <meshStandardMaterial
          color="#aaddff"
          transparent
          opacity={0.5}
          roughness={0.1}
        />
      </mesh>
      {/* Mortar */}
      <mesh position={[0.35, 0.08, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.16, 12]} />
        <meshStandardMaterial color="#888888" roughness={0.6} />
      </mesh>
      {/* Pestle */}
      <mesh position={[0.35, 0.2, 0.05]} rotation={[0.3, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.035, 0.22, 8]} />
        <meshStandardMaterial color="#999999" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ─── Laboratory ──────────────────────────────────────────────

export function Laboratory() {
  return (
    <group>
      {/* ── Ambient Light ────────────────────────────────── */}
      <ambientLight intensity={0.15} color="#9988bb" />

      {/* ── Stone Walls ──────────────────────────────────── */}
      {/* Back wall */}
      <mesh position={[0, 3.5, -5]}>
        <boxGeometry args={[14, 8, 0.4]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-6, 3.5, -0.5]}>
        <boxGeometry args={[0.4, 8, 10]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[6, 3.5, -0.5]}>
        <boxGeometry args={[0.4, 8, 10]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      {/* ── Wooden Floor ─────────────────────────────────── */}
      <mesh position={[0, -0.5, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#654321" roughness={0.85} />
      </mesh>

      {/* ── Ceiling ──────────────────────────────────────── */}
      <mesh position={[0, 7, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#3a2e22" roughness={1} />
      </mesh>

      {/* ── Candles (left wall) ──────────────────────────── */}
      <Candle position={[-5.6, 3.0, -3]} />
      <Candle position={[-5.6, 3.0, -1]} />
      <Candle position={[-5.6, 3.0, 1]} />

      {/* ── Candles (right wall) ─────────────────────────── */}
      <Candle position={[5.6, 3.0, -3]} />
      <Candle position={[5.6, 3.0, -1]} />
      <Candle position={[5.6, 3.0, 1]} />

      {/* ── Side Table with Books & Scrolls ──────────────── */}
      <group>
        {/* Table */}
        <mesh position={[-4, 0.4, -3]}>
          <boxGeometry args={[1.4, 0.9, 0.8]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.8} />
        </mesh>
        {/* Table legs */}
        {[
          [-4.55, -0.05, -3.3],
          [-4.55, -0.05, -2.7],
          [-3.45, -0.05, -3.3],
          [-3.45, -0.05, -2.7],
        ].map((pos, i) => (
          <mesh key={`leg-${i}`} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.8} />
          </mesh>
        ))}

        <BookStack position={[-4.2, 0.92, -3]} />

        <Scroll position={[-3.6, 0.92, -2.85]} rotation={[Math.PI / 2, 0, 0.3]} />
        <Scroll position={[-3.5, 0.92, -3.15]} rotation={[Math.PI / 2, 0, -0.15]} />
        <Scroll position={[-3.7, 0.92, -3.3]} rotation={[Math.PI / 2, 0, 0.6]} />
      </group>

      {/* ── Shelf with Science Equipment ─────────────────── */}
      <group>
        {/* Shelf plank */}
        <mesh position={[-5.5, 2.0, -3]}>
          <boxGeometry args={[1.0, 0.06, 0.4]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.8} />
        </mesh>
        {/* Shelf brackets */}
        <mesh position={[-5.8, 1.85, -3]}>
          <boxGeometry args={[0.06, 0.3, 0.06]} />
          <meshStandardMaterial color="#4a2a10" roughness={0.7} />
        </mesh>
        <mesh position={[-5.2, 1.85, -3]}>
          <boxGeometry args={[0.06, 0.3, 0.06]} />
          <meshStandardMaterial color="#4a2a10" roughness={0.7} />
        </mesh>

        <ScienceEquipment position={[-5.5, 2.05, -3]} />
      </group>
    </group>
  );
}
