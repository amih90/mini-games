'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface TrackProps {
  trackWidth?: number;
  trackRadiusX?: number;
  trackRadiusZ?: number;
  showPitLane?: boolean;
}

// ─── Daytona-style tri-oval constants ────────────────────────
const BANKING_TURNS = 0.45;       // ~26° banking in turns (visual)
const BANKING_TRIOVAL = 0.22;     // ~13° banking at tri-oval front
const BANKING_BACK = 0.05;        // ~3° banking on back straight
const PIT_LANE_WIDTH = 1.5;
const PIT_LANE_OFFSET = 3.5;
const NUM_PIT_BOXES = 8;
const CROWD_DENSITY = 12;

/** Get banking angle at a given track position */
function getBankAngle(angle: number): number {
  const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (normalized > Math.PI * 0.3 && normalized < Math.PI * 0.7) return BANKING_TURNS;
  if (normalized > Math.PI * 1.3 && normalized < Math.PI * 1.7) return BANKING_TURNS;
  if (normalized > Math.PI * 0.8 && normalized < Math.PI * 1.2) return BANKING_BACK;
  if (normalized < Math.PI * 0.2 || normalized > Math.PI * 1.8) return BANKING_TRIOVAL;
  return BANKING_TRIOVAL * 0.5 + BANKING_TURNS * 0.5;
}

/** Crowd colors — varied clothing */
const CROWD_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#607d8b', '#ffffff', '#e0e0e0',
];

/**
 * Daytona-style NASCAR tri-oval track with:
 * - Banked turns and tri-oval front stretch
 * - SAFER barriers and catch fencing
 * - Multi-tier grandstands with crowd dots
 * - Pit lane along the front stretch with tire stacks & pit crew
 * - Lake Lloyd in infield
 * - Light towers, timing tower, victory lane
 */
export function Track({
  trackWidth = 4,
  trackRadiusX = 14,
  trackRadiusZ = 8,
  showPitLane = true,
}: TrackProps) {

  // ─── Track surface geometry (banked ring) ──────────────────
  const trackGeometry = useMemo(() => {
    const segments = 128;
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
      const bank = getBankAngle(angle);

      positions.push(cos * (trackRadiusX + halfWidth), Math.sin(bank) * halfWidth * 0.6, sin * (trackRadiusZ + halfWidth));
      uvs.push(t, 1);
      normals.push(0, 1, 0);

      positions.push(cos * (trackRadiusX - halfWidth), 0, sin * (trackRadiusZ - halfWidth));
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
    geom.computeVertexNormals();
    return geom;
  }, [trackWidth, trackRadiusX, trackRadiusZ]);

  // ─── Lane markers (dashed center lines) ────────────────────
  const laneMarkers = useMemo(() => {
    const markers: { pos: [number, number, number]; rot: number }[] = [];
    const segments = 60;
    for (let i = 0; i < segments; i += 2) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const bank = getBankAngle(angle);
      markers.push({
        pos: [cos * trackRadiusX, Math.sin(bank) * (trackWidth / 2) * 0.3 + 0.02, sin * trackRadiusZ],
        rot: -angle + Math.PI / 2,
      });
    }
    return markers;
  }, [trackRadiusX, trackRadiusZ, trackWidth]);

  // ─── SAFER barriers (concrete walls) ──────────────────────
  const saferBarriers = useMemo(() => {
    const barriers: { pos: [number, number, number]; rot: number; length: number }[] = [];
    const segments = 48;
    const halfWidth = trackWidth / 2;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const bank = getBankAngle(angle);
      barriers.push({
        pos: [cos * (trackRadiusX + halfWidth + 0.4), Math.sin(bank) * halfWidth * 0.6 + 0.3, sin * (trackRadiusZ + halfWidth + 0.4)],
        rot: -angle + Math.PI / 2,
        length: (2 * Math.PI * Math.max(trackRadiusX, trackRadiusZ)) / segments + 0.3,
      });
    }
    return barriers;
  }, [trackWidth, trackRadiusX, trackRadiusZ]);

  // ─── Pit lane positions ────────────────────────────────────
  const pitBoxes = useMemo(() => {
    if (!showPitLane) return [];
    const boxes: { pos: [number, number, number]; rot: number }[] = [];
    const pitStartAngle = -0.35;
    const pitEndAngle = 0.35;
    for (let i = 0; i < NUM_PIT_BOXES; i++) {
      const t = i / (NUM_PIT_BOXES - 1);
      const angle = pitStartAngle + t * (pitEndAngle - pitStartAngle);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      boxes.push({
        pos: [cos * (trackRadiusX - trackWidth / 2 - PIT_LANE_OFFSET), 0.01, sin * (trackRadiusZ - trackWidth / 2 - PIT_LANE_OFFSET)],
        rot: -angle + Math.PI / 2,
      });
    }
    return boxes;
  }, [showPitLane, trackRadiusX, trackRadiusZ, trackWidth]);

  // ─── Grandstands ───────────────────────────────────────────
  const grandstands = useMemo(() => {
    const stands: { pos: [number, number, number]; rot: number; tiers: number; width: number }[] = [];
    const halfWidth = trackWidth / 2;
    // Front stretch (big grandstands) — pushed far out to clear camera
    for (let i = 0; i < 10; i++) {
      const angle = -0.6 + (i / 9) * 1.2;
      stands.push({
        pos: [Math.cos(angle) * (trackRadiusX + halfWidth + 12), 0, Math.sin(angle) * (trackRadiusZ + halfWidth + 12)],
        rot: -angle,
        tiers: 8,
        width: 3.5,
      });
    }
    // Back stretch (smaller)
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI - 0.4 + (i / 5) * 0.8;
      stands.push({
        pos: [Math.cos(angle) * (trackRadiusX + halfWidth + 11), 0, Math.sin(angle) * (trackRadiusZ + halfWidth + 11)],
        rot: -angle,
        tiers: 4,
        width: 3,
      });
    }
    // Turn grandstands
    for (let turn = 0; turn < 2; turn++) {
      const baseAngle = turn === 0 ? Math.PI / 2 : -Math.PI / 2;
      for (let i = 0; i < 4; i++) {
        const angle = baseAngle - 0.3 + (i / 3) * 0.6;
        stands.push({
          pos: [Math.cos(angle) * (trackRadiusX + halfWidth + 11), 0, Math.sin(angle) * (trackRadiusZ + halfWidth + 11)],
          rot: -angle,
          tiers: 5,
          width: 3,
        });
      }
    }
    return stands;
  }, [trackRadiusX, trackRadiusZ, trackWidth]);

  // ─── Track apron geometry ──────────────────────────────────
  const apronGeometry = useMemo(() => {
    const segments = 128;
    const halfWidth = trackWidth / 2;
    const apronWidth = 1.0;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      positions.push(cos * (trackRadiusX - halfWidth), 0.005, sin * (trackRadiusZ - halfWidth));
      positions.push(cos * (trackRadiusX - halfWidth - apronWidth), 0.005, sin * (trackRadiusZ - halfWidth - apronWidth));
      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [trackRadiusX, trackRadiusZ, trackWidth]);

  // ─── Pit road surface geometry ─────────────────────────────
  const pitRoadGeometry = useMemo(() => {
    if (!showPitLane) return null;
    const segments = 32;
    const positions: number[] = [];
    const indices: number[] = [];
    const pitStartAngle = -0.5;
    const pitEndAngle = 0.5;
    const halfWidth = trackWidth / 2;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = pitStartAngle + t * (pitEndAngle - pitStartAngle);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      positions.push(cos * (trackRadiusX - halfWidth - PIT_LANE_OFFSET + PIT_LANE_WIDTH / 2), 0.008, sin * (trackRadiusZ - halfWidth - PIT_LANE_OFFSET + PIT_LANE_WIDTH / 2));
      positions.push(cos * (trackRadiusX - halfWidth - PIT_LANE_OFFSET - PIT_LANE_WIDTH / 2), 0.008, sin * (trackRadiusZ - halfWidth - PIT_LANE_OFFSET - PIT_LANE_WIDTH / 2));
      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [showPitLane, trackRadiusX, trackRadiusZ, trackWidth]);

  return (
    <group>
      {/* ── Ground / infield (grass) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#3a8c3f" roughness={0.95} />
      </mesh>

      {/* ── Lake Lloyd (infield water) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -0.02, -1]} scale={[1, 0.7, 1]} receiveShadow>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial color="#2196f3" roughness={0.1} metalness={0.3} transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -0.03, -1]} scale={[1, 0.73, 1]}>
        <circleGeometry args={[5.5, 32]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} />
      </mesh>

      {/* ── Lighter infield grass patch ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -0.04, 2]} scale={[1, 0.67, 1]}>
        <circleGeometry args={[3, 16]} />
        <meshStandardMaterial color="#4caf50" roughness={0.9} />
      </mesh>

      {/* ── Track surface (banked) ── */}
      <mesh geometry={trackGeometry} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>

      {/* ── Track apron ── */}
      <mesh geometry={apronGeometry} receiveShadow>
        <meshStandardMaterial color="#666" roughness={0.7} />
      </mesh>

      {/* ── Lane markers ── */}
      {laneMarkers.map((m, i) => (
        <mesh key={`lm-${i}`} position={m.pos} rotation={[-Math.PI / 2, 0, m.rot]}>
          <planeGeometry args={[0.6, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* ── Start / finish line (checkered) ── */}
      <group position={[trackRadiusX, 0.03, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[trackWidth, 1.2]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`sf-${i}`} position={[(i % 4 - 1.5) * (trackWidth / 4), 0.005, (Math.floor(i / 4) - 1) * 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[trackWidth / 4 - 0.05, 0.38]} />
            <meshStandardMaterial color={(i + Math.floor(i / 4)) % 2 === 0 ? '#111' : 'white'} />
          </mesh>
        ))}
      </group>

      {/* ── SAFER barriers ── */}
      {saferBarriers.map((b, i) => (
        <mesh key={`safer-${i}`} position={b.pos} rotation={[0, b.rot, 0]}>
          <boxGeometry args={[b.length, 0.6, 0.2]} />
          <meshStandardMaterial color={i % 4 === 0 ? '#ff7043' : '#e0e0e0'} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}

      {/* ── Catch fencing ── */}
      {saferBarriers.filter((_, i) => i % 3 === 0).map((b, i) => (
        <mesh key={`fence-${i}`} position={[b.pos[0], b.pos[1] + 0.8, b.pos[2]]} rotation={[0, b.rot, 0]}>
          <planeGeometry args={[b.length, 1.2]} />
          <meshStandardMaterial color="#888" transparent opacity={0.25} side={THREE.DoubleSide} wireframe />
        </mesh>
      ))}

      {/* ── Inner wall ── */}
      {Array.from({ length: 48 }).map((_, i) => {
        const angle = (i / 48) * Math.PI * 2;
        return (
          <mesh key={`iwall-${i}`} position={[Math.cos(angle) * (trackRadiusX - trackWidth / 2 - 0.3), 0.2, Math.sin(angle) * (trackRadiusZ - trackWidth / 2 - 0.3)]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <boxGeometry args={[2, 0.4, 0.12]} />
            <meshStandardMaterial color="#bdbdbd" roughness={0.7} />
          </mesh>
        );
      })}

      {/* ── Pit lane ── */}
      {showPitLane && pitRoadGeometry && (
        <group>
          <mesh geometry={pitRoadGeometry} receiveShadow>
            <meshStandardMaterial color="#555" roughness={0.6} />
          </mesh>
          {pitBoxes.map((box, i) => (
            <group key={`pit-${i}`} position={box.pos} rotation={[0, box.rot, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[1.8, PIT_LANE_WIDTH * 0.8]} />
                <meshStandardMaterial color="#555" roughness={0.7} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -0.5]}>
                <planeGeometry args={[0.6, 0.3]} />
                <meshStandardMaterial color="#ff9800" />
              </mesh>
              <mesh position={[0, 0.4, -1]}>
                <boxGeometry args={[1.5, 0.8, 0.3]} />
                <meshStandardMaterial color="#37474f" roughness={0.6} />
              </mesh>
              {[0, 1, 2, 3].map((ti) => (
                <mesh key={`tire-${ti}`} position={[-0.5 + (ti % 2) * 0.35, 0.15 + Math.floor(ti / 2) * 0.25, -1.4]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.1, 0.05, 6, 12]} />
                  <meshStandardMaterial color="#222" roughness={0.9} />
                </mesh>
              ))}
              {[-0.4, 0, 0.4].map((offset, ci) => (
                <group key={`crew-${ci}`} position={[offset, 0, -0.7]}>
                  <mesh position={[0, 0.4, 0]}>
                    <capsuleGeometry args={[0.08, 0.25, 4, 8]} />
                    <meshStandardMaterial color={['#f44336', '#2196f3', '#ff9800'][ci]} />
                  </mesh>
                  <mesh position={[0, 0.7, 0]}>
                    <sphereGeometry args={[0.07, 8, 8]} />
                    <meshStandardMaterial color="#ffcc80" />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* ── Grandstands with crowd ── */}
      {grandstands.map((stand, si) => (
        <group key={`stand-${si}`} position={stand.pos} rotation={[0, stand.rot, 0]}>
          {Array.from({ length: stand.tiers }).map((_, tier) => (
            <group key={`tier-${tier}`}>
              <mesh position={[0, 0.4 + tier * 0.55, -tier * 0.35]} castShadow>
                <boxGeometry args={[stand.width, 0.12, 0.5]} />
                <meshStandardMaterial color={tier % 2 === 0 ? '#78909c' : '#90a4ae'} roughness={0.8} />
              </mesh>
              {tier < stand.tiers - 1 && Array.from({ length: CROWD_DENSITY }).map((_, ci) => (
                <mesh key={`crowd-${ci}`} position={[(ci / (CROWD_DENSITY - 1) - 0.5) * (stand.width - 0.3), 0.6 + tier * 0.55, -tier * 0.35]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshStandardMaterial color={CROWD_COLORS[(si * CROWD_DENSITY + ci + tier * 7) % CROWD_COLORS.length]} />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, stand.tiers * 0.3, -stand.tiers * 0.2]}>
            <boxGeometry args={[stand.width + 0.2, stand.tiers * 0.6, 0.15]} />
            <meshStandardMaterial color="#546e7a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ── Sponsor signage — moved further out ── */}
      {[
        { pos: [trackRadiusX + trackWidth / 2 + 10, 5.5, 0] as [number, number, number], rot: -Math.PI / 2 },
        { pos: [-(trackRadiusX + trackWidth / 2 + 10), 3, 0] as [number, number, number], rot: Math.PI / 2 },
      ].map((sign, i) => (
        <group key={`sign-${i}`} position={sign.pos} rotation={[0, sign.rot, 0]}>
          <mesh><boxGeometry args={[6, 1.2, 0.1]} /><meshStandardMaterial color="#1565c0" /></mesh>
          <mesh position={[0, 0, 0.06]}><boxGeometry args={[5.5, 0.8, 0.01]} /><meshStandardMaterial color="#fff" emissive="#e3f2fd" emissiveIntensity={0.3} /></mesh>
        </group>
      ))}

      {/* ── Light towers — pushed further out ── */}
      {[
        [trackRadiusX + 14, 0, trackRadiusZ + 10],
        [-(trackRadiusX + 14), 0, trackRadiusZ + 10],
        [trackRadiusX + 14, 0, -(trackRadiusZ + 10)],
        [-(trackRadiusX + 14), 0, -(trackRadiusZ + 10)],
        [0, 0, trackRadiusZ + 14],
        [0, 0, -(trackRadiusZ + 14)],
      ].map((pos, i) => (
        <group key={`tower-${i}`} position={pos as [number, number, number]}>
          <mesh position={[0, 5.5, 0]}><cylinderGeometry args={[0.12, 0.18, 11, 8]} /><meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} /></mesh>
          <pointLight position={[0, 11.5, 0]} intensity={80} color="#fff5e6" distance={35} />
          <mesh position={[0, 11.2, 0]}><boxGeometry args={[1.6, 0.4, 0.4]} /><meshStandardMaterial color="#eee" emissive="#fff9c4" emissiveIntensity={1.0} /></mesh>
        </group>
      ))}

      {/* ── Timing / scoring tower — pushed to outer perimeter ── */}
      <group position={[trackRadiusX + 10, 0, -trackRadiusZ - 6]}>
        <mesh position={[0, 3, 0]}><boxGeometry args={[1, 6, 0.8]} /><meshStandardMaterial color="#263238" roughness={0.5} /></mesh>
        {[0, 1, 2, 3, 4].map((pi) => (
          <mesh key={`panel-${pi}`} position={[0, 1 + pi * 0.9, 0.45]}>
            <boxGeometry args={[0.8, 0.7, 0.05]} />
            <meshStandardMaterial color={['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'][pi]} emissive={['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'][pi]} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>

      {/* ── Victory lane — pushed outside track perimeter ── */}
      <group position={[trackRadiusX + 10, 0, trackRadiusZ + 6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><planeGeometry args={[3, 3]} /><meshStandardMaterial color="#222" roughness={0.6} /></mesh>
        {Array.from({ length: 9 }).map((_, ci) => (
          <mesh key={`vl-${ci}`} rotation={[-Math.PI / 2, 0, 0]} position={[(ci % 3 - 1) * 0.9, 0.015, (Math.floor(ci / 3) - 1) * 0.9]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={ci % 2 === 0 ? '#333' : 'white'} />
          </mesh>
        ))}
      </group>

      {/* ── Infield buildings — low profile, stay well inside track to not block camera ── */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[4, 0.6, 1.5]} /><meshStandardMaterial color="#546e7a" roughness={0.7} /></mesh>
        {[-1.5, -0.5, 0.5, 1.5].map((gx) => (
          <mesh key={`gdoor-${gx}`} position={[gx * 0.9, 0.25, 0.76]}><planeGeometry args={[0.7, 0.5]} /><meshStandardMaterial color="#37474f" /></mesh>
        ))}
      </group>
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

  const baseX = cos * radiusX;
  const baseZ = sin * radiusZ;

  const tx = -sin * radiusX;
  const tz = cos * radiusZ;

  const nLen = Math.sqrt(tx * tx + tz * tz);
  const nx = tz / nLen;
  const nz = -tx / nLen;

  const x = baseX + nx * laneOffset;
  const z = baseZ + nz * laneOffset;

  const rotation = Math.atan2(tx, tz);

  return { x, z, rotation };
}

/**
 * Calculate approximate track length for an oval.
 */
export function getTrackLength(radiusX: number = 14, radiusZ: number = 8): number {
  const a = radiusX;
  const b = radiusZ;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/** Get position along the pit lane. t = 0..1 */
export function getPitLanePosition(
  t: number,
  radiusX: number = 14,
  radiusZ: number = 8,
  trackWidth: number = 4,
): { x: number; z: number; rotation: number } {
  const pitStartAngle = -0.5;
  const pitEndAngle = 0.5;
  const angle = pitStartAngle + t * (pitEndAngle - pitStartAngle);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rX = radiusX - trackWidth / 2 - PIT_LANE_OFFSET;
  const rZ = radiusZ - trackWidth / 2 - PIT_LANE_OFFSET;
  const x = cos * rX;
  const z = sin * rZ;
  const tx = -sin * rX;
  const tz = cos * rZ;
  const rotation = Math.atan2(tx, tz);
  return { x, z, rotation };
}

/** Pit lane constants exported for game logic */
export const PIT_CONSTANTS = {
  PIT_LANE_WIDTH,
  PIT_LANE_OFFSET,
  NUM_PIT_BOXES,
  PIT_ENTRY_ANGLE: -0.5,
  PIT_EXIT_ANGLE: 0.5,
};
