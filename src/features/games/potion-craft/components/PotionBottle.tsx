'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BottleShape } from '../types';

interface PotionBottleProps {
  shape: BottleShape;
  color: string;
  emissiveColor: string;
  onClick?: () => void;
  isSelected?: boolean;
  position?: [number, number, number];
}

function BottleBody({ shape, color, emissiveColor }: {
  shape: BottleShape;
  color: string;
  emissiveColor: string;
}) {
  const glassMaterial = (
    <meshStandardMaterial
      color="#ffffff"
      transparent
      opacity={0.3}
      roughness={0.1}
      metalness={0.1}
      side={THREE.DoubleSide}
    />
  );

  const liquidMaterial = (
    <meshStandardMaterial
      color={color}
      emissive={emissiveColor}
      emissiveIntensity={0.5}
      transparent
      opacity={0.8}
    />
  );

  switch (shape) {
    case 'round':
      return (
        <group>
          {/* Glass outer */}
          <mesh>
            <sphereGeometry args={[0.15, 24, 24]} />
            {glassMaterial}
          </mesh>
          {/* Liquid inner */}
          <mesh>
            <sphereGeometry args={[0.13, 24, 24]} />
            {liquidMaterial}
          </mesh>
          {/* Neck */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
            {glassMaterial}
          </mesh>
          {/* Cork */}
          <mesh position={[0, 0.285, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        </group>
      );

    case 'tall':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
            {glassMaterial}
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.065, 0.065, 0.33, 16]} />
            {liquidMaterial}
          </mesh>
          <mesh position={[0, 0.215, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
            {glassMaterial}
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        </group>
      );

    case 'triangular':
      return (
        <group>
          <mesh>
            <coneGeometry args={[0.15, 0.25, 16]} />
            {glassMaterial}
          </mesh>
          <mesh>
            <coneGeometry args={[0.13, 0.23, 16]} />
            {liquidMaterial}
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
            {glassMaterial}
          </mesh>
          <mesh position={[0, 0.265, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        </group>
      );

    case 'spiral':
      return (
        <group>
          <mesh>
            <torusKnotGeometry args={[0.1, 0.04, 64, 16, 2, 3]} />
            {glassMaterial}
          </mesh>
          <mesh>
            <torusKnotGeometry args={[0.1, 0.03, 64, 16, 2, 3]} />
            {liquidMaterial}
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
            {glassMaterial}
          </mesh>
          <mesh position={[0, 0.275, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        </group>
      );

    case 'crystal':
      return (
        <group>
          <mesh>
            <octahedronGeometry args={[0.12]} />
            {glassMaterial}
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.1]} />
            {liquidMaterial}
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
            {glassMaterial}
          </mesh>
          <mesh position={[0, 0.255, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        </group>
      );

    case 'flask':
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.12, 24, 24]} />
            {glassMaterial}
          </mesh>
          <mesh>
            <sphereGeometry args={[0.1, 24, 24]} />
            {liquidMaterial}
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.15, 12]} />
            {glassMaterial}
          </mesh>
          <mesh position={[0, 0.29, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        </group>
      );
  }
}

export function PotionBottle({
  shape,
  color,
  emissiveColor,
  onClick,
  isSelected,
  position = [0, 0, 0],
}: PotionBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const initialY = useRef(position[1]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const bob = Math.sin(clock.getElapsedTime() * Math.PI) * 0.02;
    groupRef.current.position.y = initialY.current + bob;
  });

  const scale = isSelected ? 1.15 : 1;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <BottleBody shape={shape} color={color} emissiveColor={emissiveColor} />

      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[0.22, 0.015, 16, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}
