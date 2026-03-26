'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StirToolProps {
  isStirring: boolean;
  stirCount: number;
}

export function StirTool({ isStirring, stirCount }: StirToolProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseScale = useRef(1);
  const prevStirCount = useRef(stirCount);

  // Pulse on stir completion
  useEffect(() => {
    if (stirCount > prevStirCount.current) {
      pulseScale.current = 1.25;
    }
    prevStirCount.current = stirCount;
  }, [stirCount]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isStirring) {
      // Rotate around Y for stirring — full circle in ~1s
      groupRef.current.rotation.y += delta * Math.PI * 2;

      // Move to center (above cauldron)
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        0,
        delta * 5
      );
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        0,
        delta * 5
      );
    } else {
      // Rest at side of cauldron
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        1.3,
        delta * 3
      );
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        0,
        delta * 3
      );
      // Reset rotation when resting
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        0,
        delta * 3
      );
    }

    // Pulse decay
    if (pulseScale.current > 1) {
      pulseScale.current = THREE.MathUtils.lerp(pulseScale.current, 1, delta * 4);
      if (pulseScale.current < 1.01) pulseScale.current = 1;
    }

    const s = pulseScale.current;
    groupRef.current.scale.set(s, s, s);
  });

  const leanAngle = (30 * Math.PI) / 180;

  return (
    <group ref={groupRef} position={[1.3, 1.2, 0]}>
      {/* Spoon assembly tilted */}
      <group rotation={[0, 0, leanAngle]}>
        {/* Handle */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 12]} />
          <meshStandardMaterial color="#4a2810" roughness={0.7} />
        </mesh>

        {/* Spoon head at bottom */}
        <mesh position={[0, -0.35, 0]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#6b3a1f" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
