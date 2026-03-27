'use client';

import { useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EarthHotspot } from '../data/earthHotspots';

interface EarthHotspotMarkerProps {
  hotspot: EarthHotspot;
  earthRadius: number;
  locale: string;
  onHotspotClick: (hotspot: EarthHotspot) => void;
}

/** Convert lat/lon (degrees) to a 3D position on a sphere of given radius */
function latLonTo3D(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  nature: '#22c55e',
  geography: '#f59e0b',
  history: '#a855f7',
  science: '#3b82f6',
};

export function EarthHotspotMarker({ hotspot, earthRadius, locale, onHotspotClick }: EarthHotspotMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const pos = latLonTo3D(hotspot.lat, hotspot.lon, earthRadius + 0.04);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.25;
      meshRef.current.scale.setScalar(pulse * (hovered ? 1.6 : 1));
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onHotspotClick(hotspot);
  }, [hotspot, onHotspotClick]);

  const color = CATEGORY_COLORS[hotspot.category] ?? '#ffffff';

  return (
    <mesh
      ref={meshRef}
      position={pos}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color={color} />
      {hovered && (
        <Html center distanceFactor={5}>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap border border-white/20">
            <div className="font-bold">{hotspot.emoji} {hotspot.name}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}
