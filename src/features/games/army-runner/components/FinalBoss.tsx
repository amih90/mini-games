'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { BossSegment } from '../useArmyRunnerGame';

interface FinalBossProps {
  boss: BossSegment;
}

export function FinalBoss({ boss }: FinalBossProps) {
  const textRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group position={[0, 0, boss.z]}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[6, 3, 1]} />
        <meshStandardMaterial color="#886644" />
      </mesh>
      <mesh position={[-2.5, 2.5, 0]}>
        <boxGeometry args={[1.2, 5, 1.2]} />
        <meshStandardMaterial color="#776644" />
      </mesh>
      <mesh position={[2.5, 2.5, 0]}>
        <boxGeometry args={[1.2, 5, 1.2]} />
        <meshStandardMaterial color="#776644" />
      </mesh>
      <mesh position={[-2.5, 5.3, 0]}>
        <coneGeometry args={[0.8, 1.2, 4]} />
        <meshStandardMaterial color="#cc2222" />
      </mesh>
      <mesh position={[2.5, 5.3, 0]}>
        <coneGeometry args={[0.8, 1.2, 4]} />
        <meshStandardMaterial color="#cc2222" />
      </mesh>
      <mesh position={[0, 0.9, 0.3]}>
        <boxGeometry args={[1.5, 1.8, 0.5]} />
        <meshStandardMaterial color="#332211" />
      </mesh>
      <mesh position={[0, 4.5, 0.6]}>
        <planeGeometry args={[1, 0.6]} />
        <meshStandardMaterial color="#ffdd00" side={2} />
      </mesh>
      <group ref={textRef} position={[0, 3.5, 0]}>
        <Text
          fontSize={0.6}
          color="#ffdd00"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.03}
          outlineColor="black"
        >
          FINISH
        </Text>
      </group>
    </group>
  );
}
