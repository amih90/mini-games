'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface TrackProps {
  trackWidth?: number;
  trackRadiusX?: number;
  trackRadiusZ?: number;
}

/**
 * Pixar-style oval NASCAR track with stadium.
 * Procedural geometry — bright kid-friendly colors.
 */
export function Track({
  trackWidth = 4,
  trackRadiusX = 14,
  trackRadiusZ = 8,
}: TrackProps) {
  // Generate oval track shape
  const { trackShape, innerShape, wallShape } = useMemo(() => {
    const segments = 64;
    const outerPoints: THREE.Vector2[] = [];
    const innerPoints: THREE.Vector2[] = [];
    const wallPoints: THREE.Vector2[] = [];
    const halfWidth = trackWidth / 2;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      outerPoints.push(new THREE.Vector2(
        cos * (trackRadiusX + halfWidth),
        sin * (trackRadiusZ + halfWidth),
      ));
      innerPoints.push(new THREE.Vector2(
        cos * (trackRadiusX - halfWidth),
        sin * (trackRadiusZ - halfWidth),
      ));
      wallPoints.push(new THREE.Vector2(
        cos * (trackRadiusX + halfWidth + 0.8),
        sin * (trackRadiusZ + halfWidth + 0.8),
      ));
    }

    return {
      trackShape: { outer: outerPoints, inner: innerPoints },
      innerShape: innerPoints,
      wallShape: wallPoints,
    };
  }, [trackWidth, trackRadiusX, trackRadiusZ]);

  // Track surface geometry (ring shape)
  const trackGeometry = useMemo(() => {
    const segments = 64;
    const halfWidth = trackWidth / 2;
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const t = i / segments;

      // Outer vertex
      positions.push(
        cos * (trackRadiusX + halfWidth),
        0,
        sin * (trackRadiusZ + halfWidth),
      );
      uvs.push(t, 1);
      normals.push(0, 1, 0);

      // Inner vertex
      positions.push(
        cos * (trackRadiusX - halfWidth),
        0,
        sin * (trackRadiusZ - halfWidth),
      );
      uvs.push(t, 0);
      normals.push(0, 1, 0);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setIndex(indices);
    return geom;
  }, [trackWidth, trackRadiusX, trackRadiusZ]);

  // Lane markers (dashed center line)
  const laneMarkers = useMemo(() => {
    const markers: { pos: [number, number, number]; rot: number }[] = [];
    const segments = 40;
    for (let i = 0; i < segments; i += 2) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      markers.push({
        pos: [cos * trackRadiusX, 0.02, sin * trackRadiusZ],
        rot: -angle + Math.PI / 2,
      });
    }
    return markers;
  }, [trackRadiusX, trackRadiusZ]);

  return (
    <group>
      {/* Ground / infield */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#4caf50" roughness={0.9} />
      </mesh>

      {/* Track surface */}
      <mesh geometry={trackGeometry} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#444" roughness={0.6} />
      </mesh>

      {/* Lane markers */}
      {laneMarkers.map((m, i) => (
        <mesh key={i} position={m.pos} rotation={[-Math.PI / 2, 0, m.rot]}>
          <planeGeometry args={[0.6, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* Start / finish line */}
      <mesh position={[trackRadiusX, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[trackWidth, 0.8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Checkered pattern strips */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`checker-${i}`}
          position={[trackRadiusX - trackWidth / 2 + (i + 0.5) * (trackWidth / 8), 0.025, i % 2 === 0 ? -0.2 : 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[trackWidth / 8, 0.35]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#111' : 'white'} />
        </mesh>
      ))}

      {/* Outer wall */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = cos * (trackRadiusX + trackWidth / 2 + 0.5);
        const z = sin * (trackRadiusZ + trackWidth / 2 + 0.5);
        return (
          <mesh key={`wall-${i}`} position={[x, 0.4, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <boxGeometry args={[3.2, 0.8, 0.15]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#e0e0e0' : '#ff7043'} />
          </mesh>
        );
      })}

      {/* Stadium bleachers (simplified — colored blocks behind walls) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dist = trackRadiusX + trackWidth / 2 + 3;
        const distZ = trackRadiusZ + trackWidth / 2 + 3;
        return (
          <group key={`stand-${i}`} position={[cos * dist, 0, sin * distZ]} rotation={[0, -angle, 0]}>
            {/* Bleacher tiers */}
            {[0, 1, 2].map((tier) => (
              <mesh key={tier} position={[0, 0.5 + tier * 0.8, -tier * 0.3]}>
                <boxGeometry args={[3, 0.7, 0.6]} />
                <meshStandardMaterial
                  color={['#42a5f5', '#66bb6a', '#ffa726'][tier]}
                  roughness={0.7}
                />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Light towers at corners */}
      {[
        [trackRadiusX + 6, 0, trackRadiusZ + 6],
        [-(trackRadiusX + 6), 0, trackRadiusZ + 6],
        [trackRadiusX + 6, 0, -(trackRadiusZ + 6)],
        [-(trackRadiusX + 6), 0, -(trackRadiusZ + 6)],
      ].map((pos, i) => (
        <group key={`tower-${i}`} position={pos as [number, number, number]}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 8, 8]} />
            <meshStandardMaterial color="#666" metalness={0.7} />
          </mesh>
          <pointLight position={[0, 8.5, 0]} intensity={50} color="#fff5e6" distance={25} />
          <mesh position={[0, 8.2, 0]}>
            <boxGeometry args={[1.2, 0.3, 0.3]} />
            <meshStandardMaterial color="#eee" emissive="#fff9c4" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Track math utilities ────────────────────────────────────

/**
 * Get position on the oval track at a given angle (radians).
 * laneOffset pushes the car perpendicular to the track tangent (positive = outward).
 */
export function getTrackPosition(
  angle: number,
  radiusX: number = 14,
  radiusZ: number = 8,
  laneOffset: number = 0,
): { x: number; z: number; rotation: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Base position on ellipse
  const baseX = cos * radiusX;
  const baseZ = sin * radiusZ;

  // Tangent direction (derivative of ellipse)
  const tx = -sin * radiusX;
  const tz = cos * radiusZ;

  // Normal direction (perpendicular to tangent, pointing outward)
  const nLen = Math.sqrt(tx * tx + tz * tz);
  const nx = tz / nLen;   // rotate tangent 90° CW
  const nz = -tx / nLen;

  // Offset along normal
  const x = baseX + nx * laneOffset;
  const z = baseZ + nz * laneOffset;

  // Car rotation = tangent direction
  const rotation = Math.atan2(tx, tz);

  return { x, z, rotation };
}

/**
 * Calculate approximate track length for an oval.
 */
export function getTrackLength(radiusX: number = 14, radiusZ: number = 8): number {
  // Ramanujan's approximation for ellipse perimeter
  const a = radiusX;
  const b = radiusZ;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}
