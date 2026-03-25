'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SoldierOffset } from '../useArmyRunnerGame';

interface SoldierCrowdProps {
  offsets: SoldierOffset[];
  groupX: number;
  groupZ: number;
  color?: string;
  time?: number;
}

const BODY_COLOR = new THREE.Color('#4488ff');
const HEAD_COLOR = new THREE.Color('#ffcc88');

const bodyGeom = new THREE.BoxGeometry(0.25, 0.4, 0.2);
const headGeom = new THREE.SphereGeometry(0.1, 8, 6);
const legGeom = new THREE.BoxGeometry(0.08, 0.25, 0.08);

export function SoldierCrowd({ offsets, groupX, groupZ, color, time: externalTime }: SoldierCrowdProps) {
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const headMeshRef = useRef<THREE.InstancedMesh>(null);
  const leftLegRef = useRef<THREE.InstancedMesh>(null);
  const rightLegRef = useRef<THREE.InstancedMesh>(null);
  const internalTimeRef = useRef(0);

  const maxCount = 80;
  const count = Math.min(offsets.length, maxCount);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: color ? new THREE.Color(color) : BODY_COLOR,
    roughness: 0.6,
  }), [color]);

  const headMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: HEAD_COLOR,
    roughness: 0.5,
  }), []);

  const legMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: color ? new THREE.Color(color).multiplyScalar(0.7) : new THREE.Color('#3366cc'),
    roughness: 0.7,
  }), [color]);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    internalTimeRef.current += delta;
    const t = externalTime ?? internalTimeRef.current;

    if (!bodyMeshRef.current || !headMeshRef.current || !leftLegRef.current || !rightLegRef.current) return;

    bodyMeshRef.current.count = count;
    headMeshRef.current.count = count;
    leftLegRef.current.count = count;
    rightLegRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const off = offsets[i];
      const x = groupX + off.x;
      const z = groupZ + off.z;
      const bounce = Math.sin(t * 8 + off.phase) * 0.05;
      const legSwing = Math.sin(t * 10 + off.phase) * 0.3;

      // Body
      tempPos.set(x, 0.45 + bounce, z);
      tempMatrix.makeTranslation(tempPos.x, tempPos.y, tempPos.z);
      bodyMeshRef.current.setMatrixAt(i, tempMatrix);

      // Head
      tempPos.set(x, 0.75 + bounce, z);
      tempMatrix.makeTranslation(tempPos.x, tempPos.y, tempPos.z);
      headMeshRef.current.setMatrixAt(i, tempMatrix);

      // Left leg
      tempMatrix.makeRotationX(legSwing);
      tempMatrix.setPosition(x - 0.07, 0.12, z);
      leftLegRef.current.setMatrixAt(i, tempMatrix);

      // Right leg
      tempMatrix.makeRotationX(-legSwing);
      tempMatrix.setPosition(x + 0.07, 0.12, z);
      rightLegRef.current.setMatrixAt(i, tempMatrix);
    }

    bodyMeshRef.current.instanceMatrix.needsUpdate = true;
    headMeshRef.current.instanceMatrix.needsUpdate = true;
    leftLegRef.current.instanceMatrix.needsUpdate = true;
    rightLegRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyMeshRef} args={[bodyGeom, bodyMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={headMeshRef} args={[headGeom, headMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={leftLegRef} args={[legGeom, legMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={rightLegRef} args={[legGeom, legMat, maxCount]} frustumCulled={false} />
    </group>
  );
}
