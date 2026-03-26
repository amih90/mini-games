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

const BODY_COLOR = new THREE.Color('#2266dd');
const HEAD_COLOR = new THREE.Color('#ffcc88');
const PLAYER_HELMET_COLOR = new THREE.Color('#556b2f');
const CUSTOM_HELMET_COLOR = new THREE.Color('#444444');

const bodyGeom = new THREE.BoxGeometry(0.22, 0.38, 0.18);
const headGeom = new THREE.SphereGeometry(0.1, 12, 8);
const legGeom = new THREE.BoxGeometry(0.08, 0.25, 0.08);
const armGeom = new THREE.BoxGeometry(0.07, 0.22, 0.07);
const helmetGeom = (() => {
  const g = new THREE.SphereGeometry(0.12, 12, 8);
  g.scale(1, 0.6, 1);
  return g;
})();

const maxCount = 80;

export function SoldierCrowd({ offsets, groupX, groupZ, color, time: externalTime }: SoldierCrowdProps) {
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const headMeshRef = useRef<THREE.InstancedMesh>(null);
  const leftLegRef = useRef<THREE.InstancedMesh>(null);
  const rightLegRef = useRef<THREE.InstancedMesh>(null);
  const leftArmRef = useRef<THREE.InstancedMesh>(null);
  const rightArmRef = useRef<THREE.InstancedMesh>(null);
  const helmetRef = useRef<THREE.InstancedMesh>(null);
  const internalTimeRef = useRef(0);
  const prevCountRef = useRef(0);
  const spawnTimestamps = useRef(new Float32Array(maxCount));

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
    color: color ? new THREE.Color(color).multiplyScalar(0.7) : new THREE.Color('#1a4faa'),
    roughness: 0.7,
  }), [color]);

  const helmetMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: color ? CUSTOM_HELMET_COLOR.clone() : PLAYER_HELMET_COLOR.clone(),
    roughness: 0.8,
  }), [color]);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempScaleVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    internalTimeRef.current += delta;
    const t = externalTime ?? internalTimeRef.current;

    if (!bodyMeshRef.current || !headMeshRef.current || !leftLegRef.current ||
        !rightLegRef.current || !leftArmRef.current || !rightArmRef.current || !helmetRef.current) return;

    // Spawn timestamps for new soldiers
    if (count > prevCountRef.current) {
      for (let i = prevCountRef.current; i < count; i++) {
        spawnTimestamps.current[i] = t;
      }
    }
    prevCountRef.current = count;

    bodyMeshRef.current.count = count;
    headMeshRef.current.count = count;
    leftLegRef.current.count = count;
    rightLegRef.current.count = count;
    leftArmRef.current.count = count;
    rightArmRef.current.count = count;
    helmetRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const off = offsets[i];
      const x = groupX + off.x;
      const z = groupZ + off.z;

      const spawnAge = t - spawnTimestamps.current[i];
      const s = Math.min(1, spawnAge / 0.3);

      const bounce = Math.sin(t * 8 + off.phase) * 0.07;
      const legSwing = Math.sin(t * 10 + off.phase) * 0.3;
      const armSwing = Math.sin(t * 10 + off.phase) * 0.25;
      const sway = Math.sin(t * 5 + off.phase) * 0.02;

      // Body — forward lean + sway
      tempMatrix.makeRotationX(0.1);
      tempMatrix.scale(tempScaleVec.set(s, s, s));
      tempMatrix.setPosition(x + sway, (0.45 + bounce) * s, z);
      bodyMeshRef.current.setMatrixAt(i, tempMatrix);

      // Head
      tempMatrix.makeScale(s, s, s);
      tempMatrix.setPosition(x + sway, (0.75 + bounce) * s, z);
      headMeshRef.current.setMatrixAt(i, tempMatrix);

      // Helmet
      tempMatrix.makeScale(s, s, s);
      tempMatrix.setPosition(x + sway, (0.82 + bounce) * s, z);
      helmetRef.current.setMatrixAt(i, tempMatrix);

      // Left leg
      tempMatrix.makeRotationX(legSwing);
      tempMatrix.scale(tempScaleVec.set(s, s, s));
      tempMatrix.setPosition(x - 0.07, 0.12 * s, z);
      leftLegRef.current.setMatrixAt(i, tempMatrix);

      // Right leg
      tempMatrix.makeRotationX(-legSwing);
      tempMatrix.scale(tempScaleVec.set(s, s, s));
      tempMatrix.setPosition(x + 0.07, 0.12 * s, z);
      rightLegRef.current.setMatrixAt(i, tempMatrix);

      // Left arm — opposite to left leg
      tempMatrix.makeRotationX(-armSwing);
      tempMatrix.scale(tempScaleVec.set(s, s, s));
      tempMatrix.setPosition(x - 0.15, (0.38 + bounce) * s, z);
      leftArmRef.current.setMatrixAt(i, tempMatrix);

      // Right arm — opposite to right leg
      tempMatrix.makeRotationX(armSwing);
      tempMatrix.scale(tempScaleVec.set(s, s, s));
      tempMatrix.setPosition(x + 0.15, (0.38 + bounce) * s, z);
      rightArmRef.current.setMatrixAt(i, tempMatrix);
    }

    bodyMeshRef.current.instanceMatrix.needsUpdate = true;
    headMeshRef.current.instanceMatrix.needsUpdate = true;
    leftLegRef.current.instanceMatrix.needsUpdate = true;
    rightLegRef.current.instanceMatrix.needsUpdate = true;
    leftArmRef.current.instanceMatrix.needsUpdate = true;
    rightArmRef.current.instanceMatrix.needsUpdate = true;
    helmetRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyMeshRef} args={[bodyGeom, bodyMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={headMeshRef} args={[headGeom, headMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={helmetRef} args={[helmetGeom, helmetMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={leftLegRef} args={[legGeom, legMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={rightLegRef} args={[legGeom, legMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={leftArmRef} args={[armGeom, bodyMat, maxCount]} frustumCulled={false} />
      <instancedMesh ref={rightArmRef} args={[armGeom, bodyMat, maxCount]} frustumCulled={false} />
    </group>
  );
}
