'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { BossSegment } from '../useArmyRunnerGame';

interface FinalBossProps {
  boss: BossSegment;
}

export function FinalBoss({ boss }: FinalBossProps) {
  const textRef = useRef<THREE.Group>(null);
  const leftTorchRef = useRef<THREE.PointLight>(null);
  const rightTorchRef = useRef<THREE.PointLight>(null);

  const flickerOffsets = useMemo(
    () => [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
    [],
  );

  useFrame(({ camera, clock }) => {
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
    const t = clock.getElapsedTime();
    if (leftTorchRef.current) {
      leftTorchRef.current.intensity = 3 + Math.sin(t * 8 + flickerOffsets[0]);
    }
    if (rightTorchRef.current) {
      rightTorchRef.current.intensity = 3 + Math.sin(t * 8 + flickerOffsets[1]);
    }
  });

  const merlons = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < 6; i++) {
      positions.push(-2.5 + i * 1);
    }
    return positions;
  }, []);

  const portcullisHBars = useMemo(() => {
    const bars: number[] = [];
    for (let y = 0.3; y < 1.8; y += 0.35) {
      bars.push(y);
    }
    return bars;
  }, []);

  const portcullisVBars = useMemo(() => {
    const bars: number[] = [];
    for (let x = -0.5; x <= 0.5; x += 0.25) {
      bars.push(x);
    }
    return bars;
  }, []);

  return (
    <group position={[0, 0, boss.z]}>
      {/* Main wall */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[6, 3, 1]} />
        <meshStandardMaterial color="#886644" />
      </mesh>

      {/* Battlements / crenellations */}
      {merlons.map((x, i) => (
        <mesh key={i} position={[x, 3.25, 0]}>
          <boxGeometry args={[0.5, 0.5, 1]} />
          <meshStandardMaterial color="#887755" />
        </mesh>
      ))}

      {/* Round towers */}
      <mesh position={[-2.5, 2.5, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 5, 12]} />
        <meshStandardMaterial color="#776644" />
      </mesh>
      <mesh position={[2.5, 2.5, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 5, 12]} />
        <meshStandardMaterial color="#776644" />
      </mesh>

      {/* Smooth tower caps */}
      <mesh position={[-2.5, 5.3, 0]}>
        <coneGeometry args={[0.8, 1.2, 8]} />
        <meshStandardMaterial color="#cc2222" />
      </mesh>
      <mesh position={[2.5, 5.3, 0]}>
        <coneGeometry args={[0.8, 1.2, 8]} />
        <meshStandardMaterial color="#cc2222" />
      </mesh>

      {/* Flickering torch lights */}
      <pointLight ref={leftTorchRef} position={[-2.5, 4, 0.8]} color="#ff6600" intensity={3} distance={5} />
      <pointLight ref={rightTorchRef} position={[2.5, 4, 0.8]} color="#ff6600" intensity={3} distance={5} />

      {/* Arched entrance */}
      <mesh position={[0, 0.9, 0.3]}>
        <boxGeometry args={[1.5, 1.8, 0.5]} />
        <meshStandardMaterial color="#332211" emissive="#ffaa44" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 1.8, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.5, 12, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#332211" emissive="#ffaa44" emissiveIntensity={0.4} />
      </mesh>

      {/* Portcullis grid */}
      {portcullisHBars.map((y, i) => (
        <mesh key={`h${i}`} position={[0, y, 0.55]}>
          <boxGeometry args={[1.4, 0.04, 0.04]} />
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {portcullisVBars.map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0.9, 0.55]}>
          <boxGeometry args={[0.04, 1.8, 0.04]} />
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* Banner */}
      <mesh position={[0, 4.5, 0.6]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="#ffdd00" emissive="#ffdd00" emissiveIntensity={0.3} side={2} />
      </mesh>

      {/* Finish text — above castle wall */}
      <group ref={textRef} position={[0, 4.2, 0.8]}>
        <Text
          fontSize={0.8}
          color="#ffdd00"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.06}
          outlineColor="#aa8800"
        >
          FINISH
        </Text>
      </group>
    </group>
  );
}
