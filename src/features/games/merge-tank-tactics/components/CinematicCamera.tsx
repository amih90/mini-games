'use client';

import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraMode } from '../types';

interface CinematicCameraProps {
  mode: CameraMode;
  attackerPos?: [number, number, number];
  targetPos?: [number, number, number];
}

export function CinematicCamera({ mode, attackerPos, targetPos }: CinematicCameraProps) {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const lookAtRef = useRef(new THREE.Vector3(0, 0.5, 0));
  const tmpLookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    let targetPosition: THREE.Vector3;
    let targetLookAt: THREE.Vector3;

    switch (mode) {
      case 'overview':
      case 'prep': {
        targetPosition = new THREE.Vector3(
          Math.sin(t * 0.1) * 1.5,
          10,
          12 + Math.cos(t * 0.08) * 0.5,
        );
        targetLookAt = new THREE.Vector3(0, 0.5, 0);
        break;
      }
      case 'battle_start': {
        targetPosition = new THREE.Vector3(-8, 4, 6);
        targetLookAt = new THREE.Vector3(0, 1, 0);
        break;
      }
      case 'attack': {
        if (attackerPos && targetPos) {
          const midX = (attackerPos[0] + targetPos[0]) / 2;
          targetPosition = new THREE.Vector3(midX, 5, 8);
          targetLookAt = new THREE.Vector3(midX, 0, 0);
        } else {
          targetPosition = new THREE.Vector3(0, 7, 10);
          targetLookAt = new THREE.Vector3(0, 0, 0);
        }
        break;
      }
      case 'explosion': {
        const shake = (Math.random() - 0.5) * 0.15;
        targetPosition = new THREE.Vector3(shake, 12 + shake * 0.5, 14);
        targetLookAt = new THREE.Vector3(0, 0, 0);
        break;
      }
      case 'victory': {
        targetPosition = new THREE.Vector3(
          Math.sin(t * 0.5) * 10,
          8,
          Math.cos(t * 0.5) * 10,
        );
        targetLookAt = new THREE.Vector3(0, 0, 0);
        break;
      }
      default: {
        targetPosition = new THREE.Vector3(0, 10, 12);
        targetLookAt = new THREE.Vector3(0, 0.5, 0);
        break;
      }
    }

    camera.position.lerp(targetPosition, 0.03);
    tmpLookAt.current.lerp(targetLookAt, 0.05);
    lookAtRef.current.lerp(targetLookAt, 0.05);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}
