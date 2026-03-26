'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────

interface ScientistProps {
  reaction: 'idle' | 'excited' | 'disappointed' | 'thinking';
}

// ─── Scientist ───────────────────────────────────────────────

export function Scientist({ reaction }: ScientistProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    switch (reaction) {
      case 'idle': {
        // Gentle breathing
        if (bodyRef.current) {
          bodyRef.current.scale.y = 1 + Math.sin(t * 2.1) * 0.02;
        }
        // Slight arm sway
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.1 + Math.sin(t * 1.5) * 0.03;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.1 + Math.sin(t * 1.5 + 0.5) * 0.03;
        }
        // Reset head
        if (headRef.current) {
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.05);
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.05);
        }
        // Reset body position
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -0.5, 0.05);
        break;
      }

      case 'excited': {
        // Bounce up and down fast
        groupRef.current.position.y = -0.5 + Math.abs(Math.sin(t * 12)) * 0.1;
        // Arms raise up
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
            leftArmRef.current.rotation.z, -1.2, 0.1,
          );
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
            rightArmRef.current.rotation.z, 1.2, 0.1,
          );
        }
        if (headRef.current) {
          headRef.current.rotation.x = 0;
          headRef.current.rotation.z = Math.sin(t * 8) * 0.1;
        }
        break;
      }

      case 'disappointed': {
        // Head tilts down
        if (headRef.current) {
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.2, 0.05);
        }
        // Arms hang lower, slight sway
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
            leftArmRef.current.rotation.z, 0.05, 0.05,
          );
          leftArmRef.current.rotation.x = Math.sin(t * 0.8) * 0.03;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
            rightArmRef.current.rotation.z, -0.05, 0.05,
          );
          rightArmRef.current.rotation.x = Math.sin(t * 0.8 + 1) * 0.03;
        }
        // Slight body sway
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -0.55, 0.03);
        break;
      }

      case 'thinking': {
        // One arm raised to chin
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
            rightArmRef.current.rotation.z, -1.6, 0.05,
          );
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
            rightArmRef.current.rotation.x, -0.8, 0.05,
          );
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
            leftArmRef.current.rotation.z, 0.1, 0.05,
          );
        }
        // Head tilts slightly
        if (headRef.current) {
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.15, 0.03);
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.05, 0.03);
        }
        // Slow sway
        groupRef.current.position.y = -0.5 + Math.sin(t * 1.2) * 0.02;
        break;
      }
    }
  });

  const skinColor = '#ffdbac';
  const labCoatColor = '#f0f0f0';
  const hairColor = '#3a1a00';
  const frameColor = '#222222';

  return (
    <group ref={groupRef} position={[-2.5, -0.5, -1]} rotation={[0, 0.4, 0]}>
      {/* ── Legs ─────────────────────────────────────── */}
      <mesh position={[-0.1, 0.55, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#333333" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.55, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#333333" roughness={0.7} />
      </mesh>

      {/* ── Shoes ────────────────────────────────────── */}
      <mesh position={[-0.1, 0.28, 0.04]}>
        <boxGeometry args={[0.16, 0.08, 0.2]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.28, 0.04]}>
        <boxGeometry args={[0.16, 0.08, 0.2]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>

      {/* ── Body / Lab coat ──────────────────────────── */}
      <mesh ref={bodyRef} position={[0, 1.15, 0]}>
        <boxGeometry args={[0.6, 1.0, 0.3]} />
        <meshStandardMaterial color={labCoatColor} roughness={0.6} />
      </mesh>

      {/* ── Lab coat lapels (accent detail) ──────────── */}
      <mesh position={[0, 1.45, 0.16]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
      </mesh>

      {/* ── Arms (pivot from shoulder) ───────────────── */}
      <group ref={leftArmRef} position={[-0.36, 1.5, 0]} rotation={[0, 0, 0.1]}>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial color={labCoatColor} roughness={0.6} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.63, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.36, 1.5, 0]} rotation={[0, 0, -0.1]}>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial color={labCoatColor} roughness={0.6} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.63, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Head Group ───────────────────────────────── */}
      <group ref={headRef} position={[0, 1.95, 0]}>
        {/* Head sphere */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Hair (half-sphere on top+back) */}
        <mesh position={[0, 0.4, -0.02]} rotation={[0.3, 0, 0]}>
          <sphereGeometry args={[0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>

        {/* ── Glasses ──────────────────────────────── */}
        {/* Left lens */}
        <mesh position={[-0.08, 0.35, 0.2]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.01, 8, 16]} />
          <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Right lens */}
        <mesh position={[0.08, 0.35, 0.2]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.01, 8, 16]} />
          <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0.35, 0.21]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.06, 6]} />
          <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.5} />
        </mesh>

        {/* ── Eyes ─────────────────────────────────── */}
        <mesh position={[-0.07, 0.36, 0.21]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.07, 0.36, 0.21]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* Mouth (subtle line) */}
        <mesh position={[0, 0.28, 0.21]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.004, 0.004, 0.08, 4]} />
          <meshStandardMaterial color="#c4877a" />
        </mesh>
      </group>
    </group>
  );
}
