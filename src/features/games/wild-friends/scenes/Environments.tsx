'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';

// ─── Africa: Savanna ─────────────────────────────────────

function SavannaSun() {
  return (
    <mesh position={[3, 4, -5]}>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshBasicMaterial color="#fbbf24" />
    </mesh>
  );
}

function SavannaGrass() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).color.setHSL(
        0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02,
        0.6,
        0.45
      );
    }
  });
  return (
    <mesh ref={ref} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#a3b18a" />
    </mesh>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 2, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshStandardMaterial color="#5c7a35" flatShading />
      </mesh>
    </group>
  );
}

export function AfricaScene() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} color="#fff5e0" />
      <SavannaSun />
      <SavannaGrass />
      <Tree position={[-3, 0, -2]} />
      <Tree position={[4, 0, -4]} />
      <Tree position={[1, 0, -6]} />
      <fog attach="fog" args={['#fef3c7', 10, 25]} />
    </>
  );
}

// ─── Amazon: Rainforest ──────────────────────────────────

function RainforestTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[1.5, 2, 8]} />
        <meshStandardMaterial color="#166534" flatShading />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[1, 1.5, 8]} />
        <meshStandardMaterial color="#15803d" flatShading />
      </mesh>
    </group>
  );
}

export function AmazonScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 6, 3]} intensity={0.8} color="#90ee90" />
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>
      <RainforestTree position={[-2, 0, -1]} />
      <RainforestTree position={[3, 0, -3]} />
      <RainforestTree position={[-4, 0, -4]} />
      <RainforestTree position={[1, 0, -5]} />
      <RainforestTree position={[5, 0, -2]} />
      <fog attach="fog" args={['#1a3a1a', 8, 20]} />
    </>
  );
}

// ─── Arctic: Wonderland ──────────────────────────────────

function Iceberg({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#e0f2fe" flatShading />
      </mesh>
    </group>
  );
}

export function ArcticScene() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 2]} intensity={0.7} color="#bfdbfe" />
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0f2fe" />
      </mesh>
      <Iceberg position={[-3, 0, -2]} scale={1.5} />
      <Iceberg position={[4, 0, -5]} scale={0.8} />
      <Iceberg position={[1, 0, -3]} />
      <fog attach="fog" args={['#dbeafe', 10, 25]} />
    </>
  );
}

// ─── Australia: Outback ──────────────────────────────────

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale}>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#b45309" flatShading />
    </mesh>
  );
}

export function AustraliaScene() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 2]} intensity={1.3} color="#fde68a" />
      <mesh position={[3, 3, -6]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#d97706" />
      </mesh>
      <Rock position={[-2, 0.3, -2]} scale={1.5} />
      <Rock position={[3, 0.2, -4]} />
      <Rock position={[-4, 0.4, -5]} scale={2} />
      <fog attach="fog" args={['#fef3c7', 12, 25]} />
    </>
  );
}

// ─── Ocean: Deep Sea ─────────────────────────────────────

function Bubble({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y =
        position[1] + ((state.clock.elapsedTime * 0.5 + position[0]) % 6);
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} />
    </mesh>
  );
}

function Seaweed({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime + position[0]) * 0.15;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[0.05, 0.08, 2, 6]} />
      <meshStandardMaterial color="#16a34a" />
    </mesh>
  );
}

export function OceanScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 5, 3]} intensity={0.6} color="#93c5fd" />
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      <Bubble position={[-1, 0, -2]} />
      <Bubble position={[2, 1, -3]} />
      <Bubble position={[-3, 0.5, -1]} />
      <Seaweed position={[-2, -1, -2]} />
      <Seaweed position={[1, -1, -3]} />
      <Seaweed position={[3, -1, -1]} />
      <fog attach="fog" args={['#0c2d48', 6, 18]} />
    </>
  );
}

// ─── Scene Container (wraps any 3D scene) ─────────────────

interface SceneContainerProps {
  sceneId: string;
  children?: React.ReactNode;
}

export function SceneContainer({ sceneId, children }: SceneContainerProps) {
  return (
    <div className="w-full aspect-[4/3] max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl">
      <Suspense
        fallback={
          <div className="w-full h-full bg-gradient-to-b from-sky-300 to-blue-500 flex items-center justify-center">
            <span className="text-4xl animate-pulse">Loading...</span>
          </div>
        }
      >
        <Canvas camera={{ position: [0, 2, 6], fov: 50 }} shadows>
          {sceneId === 'africa' && <AfricaScene />}
          {sceneId === 'amazon' && <AmazonScene />}
          {sceneId === 'arctic' && <ArcticScene />}
          {sceneId === 'australia' && <AustraliaScene />}
          {sceneId === 'ocean' && <OceanScene />}
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
