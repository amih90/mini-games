'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { POTIONS, CREATURES } from './recipes';
import { GameState, PotionId } from './types';

// ─── Props ───────────────────────────────────────────────────

interface PotionCraftSceneProps {
  state: GameState;
  onSelectPotion: (id: PotionId) => void;
  selectedPotion: PotionId | null;
  isStirring: boolean;
  stirDirection: 'cw' | 'ccw';
  lastAddedColor: string | null;
  targetCreatureId: string;
}

// ─── Laboratory ──────────────────────────────────────────────

function Laboratory() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 2.5, -3.5]}>
        <boxGeometry args={[10, 6, 0.3]} />
        <meshStandardMaterial color="#7a6955" />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="#5a4530" />
      </mesh>
      {/* Left wall */}
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 6, 0.3]} />
        <meshStandardMaterial color="#6d5d49" />
      </mesh>
      {/* Right wall */}
      <mesh position={[5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 6, 0.3]} />
        <meshStandardMaterial color="#6d5d49" />
      </mesh>
      {/* Candles */}
      <Candle position={[-3, 0, -3]} />
      <Candle position={[3, 0, -3]} />
      <Candle position={[0, 0, -3]} />
    </group>
  );
}

function Candle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Candle stick */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.0, 8]} />
        <meshStandardMaterial color="#d4a857" />
      </mesh>
      {/* Flame glow */}
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#ffaa33"
          emissive="#ff8800"
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight
        position={[0, 1.2, 0]}
        intensity={0.4}
        color="#ffaa55"
        distance={4}
      />
    </group>
  );
}

// ─── Cauldron ────────────────────────────────────────────────

function CauldronGroup({
  potionColors,
  heatLevel,
  isBrewing,
  isStirring,
  stirDirection,
  lastAddedColor,
  maxPotions,
}: {
  potionColors: string[];
  heatLevel: number;
  isBrewing: boolean;
  isStirring: boolean;
  stirDirection: 'cw' | 'ccw';
  lastAddedColor: string | null;
  maxPotions: number;
}) {
  const liquidRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const swirlRef = useRef<THREE.Group>(null);
  const splashRef = useRef<THREE.Group>(null);
  const stirSpeedRef = useRef(0);
  const splashTimeRef = useRef(0);
  const fillRef = useRef(0); // animated fill level 0-1

  // Mixed color of all added potions
  const liquidColor = useMemo(() => {
    if (potionColors.length === 0) return '#2a4a2a';
    if (potionColors.length === 1) return potionColors[0];
    const c = new THREE.Color(potionColors[0]);
    for (let i = 1; i < potionColors.length; i++) {
      c.lerp(new THREE.Color(potionColors[i]), 1 / (i + 1));
    }
    return `#${c.getHexString()}`;
  }, [potionColors]);

  // Target fill: 0 when empty, proportional to potions added
  const targetFill = maxPotions > 0 ? potionColors.length / maxPotions : 0;

  // Track when a new potion was added for splash animation
  const prevCountRef = useRef(potionColors.length);
  useFrame(() => {
    if (potionColors.length > prevCountRef.current) {
      splashTimeRef.current = 1.0;
    }
    prevCountRef.current = potionColors.length;
  });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dir = stirDirection === 'cw' ? 1 : -1;

    // Animate fill level smoothly
    fillRef.current += (targetFill - fillRef.current) * 0.06;

    // Update liquid mesh
    if (liquidRef.current) {
      const fill = fillRef.current;

      if (fill < 0.01) {
        liquidRef.current.visible = false;
      } else {
        liquidRef.current.visible = true;
        // Pot interior: Y 0.41 (floor) to 1.10 (rim), radii 0.7 (bottom) to 1.0 (top)
        // Liquid geometry is tapered [1.0, 0.7, 1, 24] matching pot taper ratio
        const liquidH = 0.05 + fill * 0.52; // 0.05 to 0.57
        const baseY = 0.44; // just above pot floor
        const liquidY = baseY + liquidH / 2;
        // Scale: ~85% of pot wall to leave visible gap
        const liquidR = 0.85;

        liquidRef.current.scale.set(liquidR, liquidH, liquidR);
        liquidRef.current.position.y = liquidY + Math.sin(t * 2) * 0.008;
      }

      // Stir speed ramp up/down
      const targetSpeed = isStirring ? 6 * dir : 0;
      stirSpeedRef.current += (targetSpeed - stirSpeedRef.current) * 0.08;
      liquidRef.current.rotation.y += stirSpeedRef.current * 0.016;
    }

    // Swirl particles rotation
    if (swirlRef.current) {
      swirlRef.current.rotation.y += stirSpeedRef.current * 0.008;
      swirlRef.current.visible = Math.abs(stirSpeedRef.current) > 0.3 && potionColors.length > 0;
      const f = fillRef.current;
      const surfaceY = 0.44 + (0.05 + f * 0.52) + 0.02;
      swirlRef.current.position.y = surfaceY;
    }

    // Splash effect decay
    if (splashRef.current) {
      splashTimeRef.current *= 0.96;
      // Only show splash when there are actually potions (not during clear)
      splashRef.current.visible = splashTimeRef.current > 0.05 && potionColors.length > 0;
      const s = splashTimeRef.current;
      // Keep splash small enough to stay inside the pot (max scale ~1.5x)
      splashRef.current.scale.set(1 + s * 0.5, 1 + s * 0.5, 1 + s * 0.5);
      const f2 = fillRef.current;
      const splashSurfaceY = 0.44 + (0.05 + f2 * 0.52);
      // Keep splash just above liquid surface, don't let it rise above rim (1.08)
      splashRef.current.position.y = Math.min(splashSurfaceY + s * 0.1, 1.05);
    }

    // Cauldron shake
    if (groupRef.current) {
      if (isStirring) {
        groupRef.current.rotation.z = Math.sin(t * 20) * 0.02;
        groupRef.current.rotation.x = Math.cos(t * 15) * 0.015;
      } else {
        groupRef.current.rotation.z *= 0.92;
        groupRef.current.rotation.x *= 0.92;
      }
    }
  });

  const legAngle = (2 * Math.PI) / 3;

  return (
    <group position={[0, 0, 0]} ref={groupRef}>
      {/* Pot body — open top so camera can see liquid inside */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[1.0, 0.7, 0.7, 24, 1, true]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Pot bottom cap (floor of cauldron) */}
      <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Dark interior floor for depth */}
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.68, 24]} />
        <meshStandardMaterial color="#111" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Rim torus */}
      <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.06, 8, 24]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 3 Legs */}
      {[0, 1, 2].map((i) => {
        const angle = i * legAngle;
        const lx = Math.sin(angle) * 0.6;
        const lz = Math.cos(angle) * 0.6;
        return (
          <mesh
            key={i}
            position={[lx, 0.1, lz]}
            rotation={[Math.sin(angle) * 0.3, 0, -Math.cos(angle) * 0.3]}
          >
            <cylinderGeometry args={[0.04, 0.06, 0.5, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        );
      })}
      {/* Liquid volume (tapered cylinder matching pot shape) */}
      <mesh ref={liquidRef} position={[0, 0.75, 0]} visible={false}>
        <cylinderGeometry args={[1.0, 0.7, 1, 24]} />
        <meshStandardMaterial
          color={liquidColor}
          emissive={liquidColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Swirl streaks (visible during stir, kept inside pot) */}
      <group ref={swirlRef} position={[0, 1.02, 0]} visible={false}>
        {potionColors.slice(-3).map((col, i) => {
          const angle = (i / 3) * Math.PI * 2;
          const r = 0.15 + i * 0.1;
          return (
            <mesh key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}
              rotation={[-Math.PI / 2, 0, angle]}>
              <capsuleGeometry args={[0.03, 0.15, 3, 6]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.4}
                transparent opacity={0.6} />
            </mesh>
          );
        })}
      </group>

      {/* Splash effect (when potion is added) — kept inside pot */}
      <group ref={splashRef} position={[0, 1.05, 0]} visible={false}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.15, 0.02 + i * 0.02, Math.sin(a) * 0.15]}>
              <sphereGeometry args={[0.04 - i * 0.003, 6, 6]} />
              <meshStandardMaterial
                color={lastAddedColor || liquidColor}
                emissive={lastAddedColor || liquidColor}
                emissiveIntensity={0.5}
                transparent opacity={0.7}
              />
            </mesh>
          );
        })}
      </group>

      {/* Bubbles — only when pot has liquid */}
      <Bubbles isBrewing={isBrewing} heatLevel={heatLevel} hasLiquid={potionColors.length > 0} />
      {/* Fire under cauldron */}
      <FireEffect heatLevel={heatLevel} />
    </group>
  );
}

// ─── Bubbles ─────────────────────────────────────────────────

function Bubbles({
  isBrewing,
  heatLevel,
  hasLiquid,
}: {
  isBrewing: boolean;
  heatLevel: number;
  hasLiquid: boolean;
}) {
  const count = 6;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const offsets = useMemo(
    () => Array.from({ length: count }, () => Math.random() * Math.PI * 2),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isBrewing ? 2.0 : 1.0;
    const activity = Math.max(heatLevel, isBrewing ? 0.5 : 0);
    for (let i = 0; i < count; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const phase = offsets[i];
      const cycle = ((t * speed + phase) % 2) / 2; // 0-1
      // Keep bubbles within pot radius (~0.3 from center)
      mesh.position.x = Math.sin(phase * 3) * 0.25;
      mesh.position.z = Math.cos(phase * 5) * 0.25;
      // Start inside pot, rise through rim
      mesh.position.y = 0.8 + cycle * 0.5;
      const s = (1 - cycle) * 0.06 * activity;
      mesh.scale.setScalar(Math.max(s, 0.001));
      // Only show bubbles when there's liquid in the pot
      mesh.visible = activity > 0.05 && hasLiquid;
    }
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#aaffaa"
            emissive="#66ff66"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Fire ────────────────────────────────────────────────────

function FireEffect({ heatLevel }: { heatLevel: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const flameData = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        x: (i - 1.5) * 0.25,
        z: (i % 2 === 0 ? -0.1 : 0.1),
        phase: i * 1.3,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < flameData.length; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const flicker = 0.8 + Math.sin(t * 6 + flameData[i].phase) * 0.2;
      const s = heatLevel * flicker;
      mesh.scale.set(s, s * 1.2, s);
      mesh.visible = heatLevel > 0.05;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      {flameData.map((fd, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[fd.x, 0, fd.z]}
        >
          <coneGeometry args={[0.12, 0.35, 6]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff4400"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      {heatLevel > 0.05 && (
        <pointLight
          position={[0, 0.1, 0]}
          intensity={heatLevel * 1.5}
          color="#ff6633"
          distance={3}
        />
      )}
    </group>
  );
}

// ─── Potion Shelf ────────────────────────────────────────────

function PotionShelf({
  availablePotions,
  onSelectPotion,
  selectedPotion,
}: {
  availablePotions: PotionId[];
  onSelectPotion: (id: PotionId) => void;
  selectedPotion: PotionId | null;
}) {
  const shelfY = 2.0;
  const shelfZ = -2.8;
  const count = availablePotions.length;
  const spacing = 0.7;
  const startX = -((count - 1) * spacing) / 2;

  return (
    <group>
      {/* Shelf plank */}
      <mesh position={[0, shelfY - 0.08, shelfZ]}>
        <boxGeometry args={[Math.max(count * spacing + 0.8, 3), 0.1, 0.45]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>
      {/* Shelf bracket left */}
      <mesh position={[-(count * spacing) / 2 - 0.3, shelfY - 0.3, shelfZ]}>
        <boxGeometry args={[0.08, 0.5, 0.12]} />
        <meshStandardMaterial color="#6b4f10" />
      </mesh>
      {/* Shelf bracket right */}
      <mesh position={[(count * spacing) / 2 + 0.3, shelfY - 0.3, shelfZ]}>
        <boxGeometry args={[0.08, 0.5, 0.12]} />
        <meshStandardMaterial color="#6b4f10" />
      </mesh>
      {/* Bottles */}
      {availablePotions.map((id, i) => {
        const potion = POTIONS[id];
        const isSelected = selectedPotion === id;
        const x = startX + i * spacing;
        return (
          <PotionBottle
            key={id}
            position={[x, shelfY + 0.2, shelfZ]}
            color={potion.color}
            emissiveColor={potion.emissiveColor}
            isSelected={isSelected}
            label={`${i + 1}`}
            onClick={() => onSelectPotion(id)}
          />
        );
      })}
    </group>
  );
}

function PotionBottle({
  position,
  color,
  emissiveColor,
  isSelected,
  label,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  emissiveColor: string;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Gentle bob when selected
    if (isSelected) {
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 4) * 0.04;
    } else {
      groupRef.current.position.y = position[1];
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Glass body */}
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 1.2 : 0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.14, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {/* Cork */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.06, 8]} />
        <meshStandardMaterial color="#a0784a" />
      </mesh>
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.02, 8, 20]} />
          <meshStandardMaterial
            color="#ffff00"
            emissive="#ffff00"
            emissiveIntensity={2}
          />
        </mesh>
      )}
      {/* Number label */}
      <Text
        position={[0, -0.35, 0.15]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
}

// ─── Scientist ───────────────────────────────────────────────

function ScientistFigure({ reaction }: { reaction: string }) {
  const bodyRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const ponytailRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const t = clock.getElapsedTime();

    // Breathing bob
    const bobSpeed = reaction === 'excited' ? 4 : 1.5;
    const bobAmp = reaction === 'excited' ? 0.06 : 0.02;
    bodyRef.current.position.y = Math.sin(t * bobSpeed) * bobAmp;

    // Subtle torso sway
    bodyRef.current.rotation.z = Math.sin(t * 0.8) * 0.015;

    // Arm animations
    if (armLRef.current) {
      const base = 0.4;
      const swing = reaction === 'excited'
        ? Math.sin(t * 5) * 0.25
        : reaction === 'thinking'
          ? Math.sin(t * 2) * 0.1
          : Math.sin(t * 1.2) * 0.05;
      armLRef.current.rotation.z = base + swing;
      armLRef.current.rotation.x = Math.sin(t * 0.9) * 0.03;
    }
    if (armRRef.current) {
      const base = -0.4;
      const stir = reaction === 'thinking'
        ? Math.sin(t * 3) * 0.2
        : reaction === 'excited'
          ? Math.sin(t * 5 + 1) * 0.2
          : Math.sin(t * 1.2 + 1) * 0.04;
      armRRef.current.rotation.z = base + stir;
      armRRef.current.rotation.x = Math.sin(t * 1.1 + 0.5) * 0.03;
    }

    // Ponytail physics
    if (ponytailRef.current) {
      ponytailRef.current.rotation.z = Math.sin(t * 2.2) * 0.12;
      ponytailRef.current.rotation.x = Math.sin(t * 1.7) * 0.06 - 0.15;
    }

    // Weight shift on legs
    if (legLRef.current && legRRef.current) {
      const shift = Math.sin(t * 0.6) * 0.02;
      legLRef.current.rotation.z = shift;
      legRRef.current.rotation.z = -shift * 0.5;
    }
  });

  // ── Color Palette ──
  const PINK = '#FF4FA3';
  const PINK_DARK = '#CC3580';
  const PINK_ROOT = '#E03888';
  const PURPLE_TOP = '#6A3FBF';
  const PURPLE_DARK = '#4A2A8F';
  const SKIN = '#F6C7A5';
  const SKIN_SHADOW = '#E8B896';
  const SKIRT = '#5A3A2E';
  const BOOT_RED = '#D72638';
  const BOOT_DARK = '#A01E2D';
  const GLOVE = '#8B5E3C';
  const GLOVE_LIGHT = '#A67852';
  const COAT = '#F8F8F8';
  const COAT_FOLD = '#E8E8E8';
  const EYE_PURPLE = '#7B5CFF';
  const EYE_BRIGHT = '#A08CFF';
  const LIP = '#FF8FB8';
  const GOGGLE_FRAME = '#5A3A20';
  const GOGGLE_GLASS = '#88CCFF';
  const CHOKER = '#2a2a2a';

  return (
    <group position={[-2.5, 0, -1]} ref={bodyRef}>

      {/* ════════════ BOOTS (knee-high, red, heeled) ════════════ */}
      {/* Left boot */}
      <group ref={legLRef} position={[-0.1, 0, 0.02]}>
        {/* Sole */}
        <mesh position={[0, 0.01, 0.01]}>
          <boxGeometry args={[0.1, 0.02, 0.14]} />
          <meshStandardMaterial color="#1a1010" roughness={0.9} />
        </mesh>
        {/* Heel block */}
        <mesh position={[0, 0.045, -0.04]}>
          <boxGeometry args={[0.05, 0.07, 0.05]} />
          <meshStandardMaterial color={BOOT_DARK} roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Boot lower (ankle) */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.14, 10]} />
          <meshStandardMaterial color={BOOT_RED} roughness={0.25} metalness={0.08} />
        </mesh>
        {/* Boot mid (calf) */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.058, 0.062, 0.16, 10]} />
          <meshStandardMaterial color={BOOT_RED} roughness={0.25} metalness={0.08} />
        </mesh>
        {/* Boot top (knee) with slight flare */}
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.063, 0.058, 0.1, 10]} />
          <meshStandardMaterial color={BOOT_RED} roughness={0.25} metalness={0.08} />
        </mesh>
        {/* Boot top rim */}
        <mesh position={[0, 0.43, 0]}>
          <torusGeometry args={[0.063, 0.006, 6, 12]} />
          <meshStandardMaterial color={BOOT_DARK} roughness={0.3} />
        </mesh>
        {/* Lace-up detail (V-shape crosses) */}
        {[0.14, 0.2, 0.26, 0.32, 0.38].map((y, i) => (
          <group key={i} position={[0, y, 0.06]}>
            <mesh position={[-0.012, 0, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.025, 0.005, 0.004]} />
              <meshStandardMaterial color={BOOT_DARK} />
            </mesh>
            <mesh position={[0.012, 0, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.025, 0.005, 0.004]} />
              <meshStandardMaterial color={BOOT_DARK} />
            </mesh>
          </group>
        ))}
        {/* Boot shine highlight */}
        <mesh position={[0.02, 0.25, 0.055]}>
          <capsuleGeometry args={[0.006, 0.12, 3, 4]} />
          <meshStandardMaterial color="#FF4858" emissive="#FF4858" emissiveIntensity={0.15} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Right boot */}
      <group ref={legRRef} position={[0.1, 0, -0.01]}>
        <mesh position={[0, 0.01, 0.01]}>
          <boxGeometry args={[0.1, 0.02, 0.14]} />
          <meshStandardMaterial color="#1a1010" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.045, -0.04]}>
          <boxGeometry args={[0.05, 0.07, 0.05]} />
          <meshStandardMaterial color={BOOT_DARK} roughness={0.3} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.14, 10]} />
          <meshStandardMaterial color={BOOT_RED} roughness={0.25} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.058, 0.062, 0.16, 10]} />
          <meshStandardMaterial color={BOOT_RED} roughness={0.25} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.063, 0.058, 0.1, 10]} />
          <meshStandardMaterial color={BOOT_RED} roughness={0.25} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.43, 0]}>
          <torusGeometry args={[0.063, 0.006, 6, 12]} />
          <meshStandardMaterial color={BOOT_DARK} roughness={0.3} />
        </mesh>
        {[0.14, 0.2, 0.26, 0.32, 0.38].map((y, i) => (
          <group key={i} position={[0, y, 0.06]}>
            <mesh position={[-0.012, 0, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.025, 0.005, 0.004]} />
              <meshStandardMaterial color={BOOT_DARK} />
            </mesh>
            <mesh position={[0.012, 0, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.025, 0.005, 0.004]} />
              <meshStandardMaterial color={BOOT_DARK} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.02, 0.25, 0.055]}>
          <capsuleGeometry args={[0.006, 0.12, 3, 4]} />
          <meshStandardMaterial color="#FF4858" emissive="#FF4858" emissiveIntensity={0.15} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* ════════════ LEGS (exposed skin between skirt and boots) ════════════ */}
      <mesh position={[-0.1, 0.48, 0]}>
        <cylinderGeometry args={[0.052, 0.058, 0.08, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.48, 0]}>
        <cylinderGeometry args={[0.052, 0.058, 0.08, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>

      {/* ════════════ MINI SKIRT ════════════ */}
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.11, 0.17, 0.12, 12]} />
        <meshStandardMaterial color={SKIRT} roughness={0.65} />
      </mesh>
      {/* Skirt waistband */}
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.11, 0.008, 6, 14]} />
        <meshStandardMaterial color="#3A2218" roughness={0.5} />
      </mesh>
      {/* Skirt fold lines */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.14, 0.52, Math.sin(angle) * 0.14]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.003, 0.08, 0.01]} />
            <meshStandardMaterial color="#4A2A1E" transparent opacity={0.3} />
          </mesh>
        );
      })}

      {/* ════════════ TORSO — PURPLE CORSET TOP ════════════ */}
      {/* Main corset */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.22, 12]} />
        <meshStandardMaterial color={PURPLE_TOP} roughness={0.35} metalness={0.08} />
      </mesh>
      {/* Bust shaping (subtle) */}
      <mesh position={[0, 0.76, 0.08]} scale={[1.2, 0.7, 0.6]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={PURPLE_TOP} roughness={0.35} metalness={0.08} />
      </mesh>
      {/* Corset front lacing */}
      {[0.65, 0.7, 0.75, 0.8].map((y) => (
        <group key={y} position={[0, y, 0.12]}>
          <mesh position={[-0.015, 0, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.025, 0.006, 0.004]} />
            <meshStandardMaterial color={PURPLE_DARK} />
          </mesh>
          <mesh position={[0.015, 0, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.025, 0.006, 0.004]} />
            <meshStandardMaterial color={PURPLE_DARK} />
          </mesh>
        </group>
      ))}
      {/* Corset top edge */}
      <mesh position={[0, 0.83, 0]} rotation={[0.05, 0, 0]}>
        <torusGeometry args={[0.125, 0.006, 6, 14]} />
        <meshStandardMaterial color={PURPLE_DARK} roughness={0.4} />
      </mesh>
      {/* Corset bottom edge */}
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.115, 0.005, 6, 14]} />
        <meshStandardMaterial color={PURPLE_DARK} roughness={0.4} />
      </mesh>

      {/* ════════════ LAB COAT (open, flowing) ════════════ */}
      {/* Back panel */}
      <mesh position={[0, 0.68, -0.12]}>
        <boxGeometry args={[0.32, 0.58, 0.025]} />
        <meshStandardMaterial color={COAT} roughness={0.55} />
      </mesh>
      {/* Left flap (slightly angled open) */}
      <mesh position={[-0.15, 0.66, 0.0]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.09, 0.56, 0.018]} />
        <meshStandardMaterial color={COAT} roughness={0.55} />
      </mesh>
      {/* Right flap */}
      <mesh position={[0.15, 0.66, 0.0]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.09, 0.56, 0.018]} />
        <meshStandardMaterial color={COAT} roughness={0.55} />
      </mesh>
      {/* Coat fold shadows */}
      <mesh position={[-0.1, 0.7, -0.1]}>
        <boxGeometry args={[0.01, 0.4, 0.02]} />
        <meshStandardMaterial color={COAT_FOLD} roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.7, -0.1]}>
        <boxGeometry args={[0.01, 0.4, 0.02]} />
        <meshStandardMaterial color={COAT_FOLD} roughness={0.6} />
      </mesh>
      {/* Collar left */}
      <mesh position={[-0.1, 0.9, 0.06]} rotation={[0.35, 0.2, 0.2]}>
        <boxGeometry args={[0.08, 0.06, 0.015]} />
        <meshStandardMaterial color={COAT} roughness={0.5} />
      </mesh>
      {/* Collar right */}
      <mesh position={[0.1, 0.9, 0.06]} rotation={[0.35, -0.2, -0.2]}>
        <boxGeometry args={[0.08, 0.06, 0.015]} />
        <meshStandardMaterial color={COAT} roughness={0.5} />
      </mesh>
      {/* Coat pocket left */}
      <mesh position={[-0.12, 0.55, 0.01]}>
        <boxGeometry args={[0.05, 0.03, 0.005]} />
        <meshStandardMaterial color={COAT_FOLD} roughness={0.6} />
      </mesh>

      {/* ════════════ NECK + CHOKER ════════════ */}
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.038, 0.045, 0.07, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.905, 0]}>
        <torusGeometry args={[0.042, 0.007, 6, 16]} />
        <meshStandardMaterial color={CHOKER} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Choker gem */}
      <mesh position={[0, 0.905, 0.045]}>
        <octahedronGeometry args={[0.01, 0]} />
        <meshStandardMaterial color="#FF44AA" emissive="#FF44AA" emissiveIntensity={0.4} metalness={0.3} />
      </mesh>

      {/* ════════════ HEAD ════════════ */}
      {/* Main head */}
      <mesh position={[0, 1.07, 0]}>
        <sphereGeometry args={[0.155, 16, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>
      {/* Jaw / chin (slightly elongated) */}
      <mesh position={[0, 0.99, 0.04]} scale={[0.85, 0.6, 0.75]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>
      {/* Cheeks (soft rounded) */}
      <mesh position={[-0.08, 1.03, 0.1]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#FCBDB0" roughness={0.9} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.08, 1.03, 0.1]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#FCBDB0" roughness={0.9} transparent opacity={0.5} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.14, 1.06, 0]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color={SKIN_SHADOW} roughness={0.8} />
      </mesh>
      <mesh position={[0.14, 1.06, 0]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color={SKIN_SHADOW} roughness={0.8} />
      </mesh>

      {/* ════════════ EYES (large, expressive, anime-style) ════════════ */}
      {/* Left eye */}
      <group position={[-0.055, 1.08, 0.11]}>
        {/* Eye white */}
        <mesh scale={[1, 1.2, 0.7]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="white" roughness={0.3} />
        </mesh>
        {/* Iris */}
        <mesh position={[0, 0, 0.02]} scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshStandardMaterial color={EYE_PURPLE} emissive={EYE_PURPLE} emissiveIntensity={0.25} roughness={0.2} />
        </mesh>
        {/* Iris inner ring */}
        <mesh position={[0, 0, 0.028]}>
          <sphereGeometry args={[0.016, 6, 6]} />
          <meshStandardMaterial color={EYE_BRIGHT} emissive={EYE_BRIGHT} emissiveIntensity={0.2} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.035]}>
          <sphereGeometry args={[0.01, 6, 6]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        {/* Catchlight large */}
        <mesh position={[0.01, 0.014, 0.037]}>
          <sphereGeometry args={[0.006, 4, 4]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.5} />
        </mesh>
        {/* Catchlight small */}
        <mesh position={[-0.006, -0.008, 0.036]}>
          <sphereGeometry args={[0.003, 4, 4]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
        </mesh>
        {/* Upper eyelid */}
        <mesh position={[0, 0.03, 0.015]} scale={[1.15, 0.3, 0.8]} rotation={[0.2, 0, 0]}>
          <sphereGeometry args={[0.035, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={SKIN_SHADOW} />
        </mesh>
        {/* Eyelash */}
        <mesh position={[0, 0.035, 0.025]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.06, 0.004, 0.01]} />
          <meshStandardMaterial color="#1a0a15" />
        </mesh>
      </group>

      {/* Right eye */}
      <group position={[0.055, 1.08, 0.11]}>
        <mesh scale={[1, 1.2, 0.7]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="white" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.02]} scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshStandardMaterial color={EYE_PURPLE} emissive={EYE_PURPLE} emissiveIntensity={0.25} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.028]}>
          <sphereGeometry args={[0.016, 6, 6]} />
          <meshStandardMaterial color={EYE_BRIGHT} emissive={EYE_BRIGHT} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <sphereGeometry args={[0.01, 6, 6]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh position={[0.01, 0.014, 0.037]}>
          <sphereGeometry args={[0.006, 4, 4]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[-0.006, -0.008, 0.036]}>
          <sphereGeometry args={[0.003, 4, 4]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, 0.03, 0.015]} scale={[1.15, 0.3, 0.8]} rotation={[0.2, 0, 0]}>
          <sphereGeometry args={[0.035, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={SKIN_SHADOW} />
        </mesh>
        <mesh position={[0, 0.035, 0.025]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.06, 0.004, 0.01]} />
          <meshStandardMaterial color="#1a0a15" />
        </mesh>
      </group>

      {/* ════════════ EYEBROWS (arched, expressive) ════════════ */}
      <mesh position={[-0.055, 1.125, 0.12]} rotation={[0.1, 0, 0.12]}>
        <capsuleGeometry args={[0.005, 0.04, 3, 6]} />
        <meshStandardMaterial color={PINK_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[0.055, 1.125, 0.12]} rotation={[0.1, 0, -0.12]}>
        <capsuleGeometry args={[0.005, 0.04, 3, 6]} />
        <meshStandardMaterial color={PINK_DARK} roughness={0.6} />
      </mesh>

      {/* ════════════ NOSE ════════════ */}
      <mesh position={[0, 1.05, 0.15]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color={SKIN_SHADOW} roughness={0.8} />
      </mesh>
      {/* Nose bridge */}
      <mesh position={[0, 1.065, 0.14]}>
        <capsuleGeometry args={[0.005, 0.015, 3, 4]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>

      {/* ════════════ MOUTH (friendly smile) ════════════ */}
      {/* Upper lip */}
      <mesh position={[0, 1.01, 0.135]} scale={[1, 0.5, 0.5]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color={LIP} roughness={0.35} />
      </mesh>
      {/* Lower lip */}
      <mesh position={[0, 1.003, 0.133]} scale={[1.1, 0.4, 0.5]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color={LIP} roughness={0.35} />
      </mesh>
      {/* Smile line */}
      <mesh position={[0, 1.005, 0.14]} scale={[1, 0.15, 0.3]}>
        <torusGeometry args={[0.02, 0.003, 4, 10, Math.PI]} />
        <meshStandardMaterial color="#E07090" />
      </mesh>

      {/* ════════════ HAIR ════════════ */}
      {/* Front bangs — fluffy, layered */}
      <mesh position={[0, 1.16, 0.08]}>
        <sphereGeometry args={[0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <meshStandardMaterial color={PINK} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Bangs fringe left */}
      <mesh position={[-0.06, 1.12, 0.12]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.025, 0.05, 4, 6]} />
        <meshStandardMaterial color={PINK} roughness={0.35} />
      </mesh>
      {/* Bangs fringe right */}
      <mesh position={[0.06, 1.12, 0.12]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.025, 0.05, 4, 6]} />
        <meshStandardMaterial color={PINK} roughness={0.35} />
      </mesh>
      {/* Bangs center strand */}
      <mesh position={[0, 1.11, 0.13]} rotation={[0.15, 0, 0.05]}>
        <capsuleGeometry args={[0.02, 0.04, 4, 6]} />
        <meshStandardMaterial color={PINK} roughness={0.35} />
      </mesh>

      {/* Side hair — flowing past ears */}
      <mesh position={[-0.13, 1.02, -0.02]}>
        <capsuleGeometry args={[0.04, 0.18, 5, 8]} />
        <meshStandardMaterial color={PINK} roughness={0.38} />
      </mesh>
      <mesh position={[0.13, 1.02, -0.02]}>
        <capsuleGeometry args={[0.04, 0.18, 5, 8]} />
        <meshStandardMaterial color={PINK} roughness={0.38} />
      </mesh>
      {/* Extra side wisps */}
      <mesh position={[-0.14, 0.92, 0.01]}>
        <capsuleGeometry args={[0.02, 0.08, 3, 6]} />
        <meshStandardMaterial color={PINK_DARK} roughness={0.4} />
      </mesh>
      <mesh position={[0.14, 0.92, 0.01]}>
        <capsuleGeometry args={[0.02, 0.08, 3, 6]} />
        <meshStandardMaterial color={PINK_DARK} roughness={0.4} />
      </mesh>

      {/* Back hair volume */}
      <mesh position={[0, 1.08, -0.1]} scale={[1.1, 1, 0.7]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color={PINK_ROOT} roughness={0.4} />
      </mesh>

      {/* Hair bun / tie point */}
      <mesh position={[0, 1.2, -0.08]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={PINK_DARK} roughness={0.35} />
      </mesh>
      {/* Hair tie band */}
      <mesh position={[0, 1.2, -0.08]}>
        <torusGeometry args={[0.05, 0.01, 6, 10]} />
        <meshStandardMaterial color="#CC2266" roughness={0.4} />
      </mesh>

      {/* Ponytail (animated, fluffy, long) */}
      <group ref={ponytailRef} position={[0, 1.18, -0.12]}>
        {/* Main ponytail body */}
        <mesh position={[0, -0.12, -0.03]}>
          <capsuleGeometry args={[0.05, 0.3, 6, 10]} />
          <meshStandardMaterial color={PINK} roughness={0.35} metalness={0.05} />
        </mesh>
        {/* Ponytail tip (tapers) */}
        <mesh position={[0, -0.34, -0.05]}>
          <capsuleGeometry args={[0.03, 0.1, 4, 8]} />
          <meshStandardMaterial color={PINK_DARK} roughness={0.4} />
        </mesh>
        {/* Volume strands */}
        <mesh position={[-0.03, -0.1, -0.02]} rotation={[0, 0, -0.1]}>
          <capsuleGeometry args={[0.025, 0.2, 4, 6]} />
          <meshStandardMaterial color={PINK} roughness={0.4} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.03, -0.15, -0.02]} rotation={[0, 0, 0.1]}>
          <capsuleGeometry args={[0.025, 0.2, 4, 6]} />
          <meshStandardMaterial color={PINK} roughness={0.4} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* ════════════ GOGGLES ON HEAD ════════════ */}
      {/* Strap */}
      <mesh position={[0, 1.17, 0]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.15, 0.01, 6, 22]} />
        <meshStandardMaterial color={GOGGLE_FRAME} roughness={0.5} />
      </mesh>
      {/* Left lens housing */}
      <group position={[-0.09, 1.18, 0.1]} rotation={[0.2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 0.025, 10]} />
          <meshStandardMaterial color={GOGGLE_FRAME} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.013]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 10]} />
          <meshStandardMaterial color={GOGGLE_GLASS} transparent opacity={0.4} metalness={0.4} roughness={0.1} />
        </mesh>
        {/* Lens rim */}
        <mesh>
          <torusGeometry args={[0.035, 0.004, 6, 12]} />
          <meshStandardMaterial color="#3A2010" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
      {/* Right lens housing */}
      <group position={[0.09, 1.18, 0.1]} rotation={[0.2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 0.025, 10]} />
          <meshStandardMaterial color={GOGGLE_FRAME} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.013]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 10]} />
          <meshStandardMaterial color={GOGGLE_GLASS} transparent opacity={0.4} metalness={0.4} roughness={0.1} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.035, 0.004, 6, 12]} />
          <meshStandardMaterial color="#3A2010" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
      {/* Bridge between lenses */}
      <mesh position={[0, 1.18, 0.13]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.04, 0.008, 0.008]} />
        <meshStandardMaterial color={GOGGLE_FRAME} roughness={0.5} />
      </mesh>

      {/* ════════════ ARMS ════════════ */}
      {/* Left arm — raised holding potion bottle */}
      <group ref={armLRef} position={[-0.2, 0.84, 0]} rotation={[0, 0, 0.4]}>
        {/* Shoulder (coat) */}
        <mesh position={[-0.04, 0, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        {/* Upper arm */}
        <mesh position={[-0.1, -0.01, 0]}>
          <capsuleGeometry args={[0.032, 0.1, 5, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        {/* Elbow */}
        <mesh position={[-0.17, -0.02, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        {/* Forearm */}
        <mesh position={[-0.24, -0.01, 0.02]} rotation={[0.3, 0, -0.15]}>
          <capsuleGeometry args={[0.028, 0.08, 5, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        {/* Glove (fingerless) */}
        <mesh position={[-0.3, 0, 0.04]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color={GLOVE} roughness={0.5} />
        </mesh>
        {/* Finger tips peeking out */}
        <mesh position={[-0.32, 0.01, 0.05]}>
          <sphereGeometry args={[0.01, 4, 4]} />
          <meshStandardMaterial color={SKIN} roughness={0.8} />
        </mesh>
        {/* Glove strap */}
        <mesh position={[-0.28, 0, 0.04]}>
          <torusGeometry args={[0.03, 0.004, 4, 8]} />
          <meshStandardMaterial color={GLOVE_LIGHT} />
        </mesh>
        {/* Potion bottle in hand */}
        <group position={[-0.3, 0.04, 0.04]}>
          {/* Bottle body */}
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.018, 0.025, 0.055, 8]} />
            <meshStandardMaterial color="#6688ff" transparent opacity={0.6} roughness={0.1} metalness={0.1} />
          </mesh>
          {/* Liquid inside */}
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.015, 0.022, 0.035, 8]} />
            <meshStandardMaterial color="#4466ee" emissive="#4466ee" emissiveIntensity={0.3} transparent opacity={0.7} />
          </mesh>
          {/* Bottle neck */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.008, 0.012, 0.02, 6]} />
            <meshStandardMaterial color="#88aaff" transparent opacity={0.5} />
          </mesh>
          {/* Cork */}
          <mesh position={[0, 0.075, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.012, 6]} />
            <meshStandardMaterial color="#C4A46C" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Right arm — stirring pose */}
      <group ref={armRRef} position={[0.2, 0.84, 0]} rotation={[0, 0, -0.4]}>
        <mesh position={[0.04, 0, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        <mesh position={[0.1, -0.01, 0]}>
          <capsuleGeometry args={[0.032, 0.1, 5, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        <mesh position={[0.17, -0.02, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        <mesh position={[0.24, -0.01, 0.02]} rotation={[0.3, 0, 0.15]}>
          <capsuleGeometry args={[0.028, 0.08, 5, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.55} />
        </mesh>
        {/* Glove */}
        <mesh position={[0.3, 0, 0.04]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color={GLOVE} roughness={0.5} />
        </mesh>
        <mesh position={[0.32, 0.01, 0.05]}>
          <sphereGeometry args={[0.01, 4, 4]} />
          <meshStandardMaterial color={SKIN} roughness={0.8} />
        </mesh>
        <mesh position={[0.28, 0, 0.04]}>
          <torusGeometry args={[0.03, 0.004, 4, 8]} />
          <meshStandardMaterial color={GLOVE_LIGHT} />
        </mesh>
        {/* Stirring spoon / stick */}
        <group position={[0.3, 0.04, 0.04]}>
          <mesh position={[0, 0.06, 0]} rotation={[0, 0, -0.15]}>
            <cylinderGeometry args={[0.005, 0.006, 0.2, 5]} />
            <meshStandardMaterial color="#8B6844" roughness={0.7} />
          </mesh>
          {/* Spoon bowl */}
          <mesh position={[0, 0.16, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color="#7A5A38" roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─── Creature ────────────────────────────────────────────────

function CreatureBody({ creatureId, color, emissiveColor }: {
  creatureId: string;
  color: string;
  emissiveColor: string;
}) {
  switch (creatureId) {
    case 'slime':
      return (
        <group>
          {/* Blobby body */}
          <mesh position={[0, -0.05, 0]} scale={[1, 0.7, 1]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.5} transparent opacity={0.9} />
          </mesh>
          {/* Drips */}
          <mesh position={[-0.2, -0.22, 0.1]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.18, -0.18, -0.08]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.6} />
          </mesh>
          {/* Big googly eyes */}
          <mesh position={[-0.1, 0.1, 0.28]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.1, 0.1, 0.36]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.1, 0.1, 0.28]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.1, 0.1, 0.36]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Smile */}
          <mesh position={[0, -0.08, 0.32]} scale={[1, 0.3, 1]}>
            <sphereGeometry args={[0.08, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1a5a1a" />
          </mesh>
        </group>
      );

    case 'fireImp':
      return (
        <group>
          {/* Angular body */}
          <mesh>
            <dodecahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={1.2} />
          </mesh>
          {/* Horns */}
          <mesh position={[-0.15, 0.35, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.05, 0.2, 6]} />
            <meshStandardMaterial color="#8b0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.15, 0.35, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.05, 0.2, 6]} />
            <meshStandardMaterial color="#8b0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
          {/* Glowing eyes */}
          <mesh position={[-0.1, 0.08, 0.28]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffaa00" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.1, 0.08, 0.28]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffaa00" emissiveIntensity={3} />
          </mesh>
          {/* Tail */}
          <mesh position={[0, -0.1, -0.32]} rotation={[0.5, 0, 0]}>
            <coneGeometry args={[0.04, 0.3, 6]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.8} />
          </mesh>
          <pointLight intensity={1.5} color="#ff4400" distance={2} />
        </group>
      );

    case 'waterSprite':
      return (
        <group>
          {/* Teardrop body */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, -0.15, 0]} scale={[0.8, 1.2, 0.8]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color={color} transparent opacity={0.6} />
          </mesh>
          {/* Flowing tendrils */}
          <mesh position={[-0.2, -0.25, 0]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.02, 0.04, 0.25, 6]} />
            <meshStandardMaterial color={color} transparent opacity={0.5} />
          </mesh>
          <mesh position={[0.2, -0.25, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.02, 0.04, 0.25, 6]} />
            <meshStandardMaterial color={color} transparent opacity={0.5} />
          </mesh>
          {/* Gentle eyes */}
          <mesh position={[-0.08, 0.15, 0.25]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="white" transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.08, 0.15, 0.29]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#0044aa" />
          </mesh>
          <mesh position={[0.08, 0.15, 0.25]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="white" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0.08, 0.15, 0.29]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#0044aa" />
          </mesh>
        </group>
      );

    case 'stoneGolem':
      return (
        <group>
          {/* Blocky body */}
          <mesh>
            <boxGeometry args={[0.5, 0.6, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.35, 0.3, 0.3]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          {/* Arms */}
          <mesh position={[-0.38, 0.1, 0]}>
            <boxGeometry args={[0.18, 0.45, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          <mesh position={[0.38, 0.1, 0]}>
            <boxGeometry args={[0.18, 0.45, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          {/* Legs */}
          <mesh position={[-0.15, -0.4, 0]}>
            <boxGeometry args={[0.18, 0.3, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          <mesh position={[0.15, -0.4, 0]}>
            <boxGeometry args={[0.18, 0.3, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          {/* Glowing crack eyes */}
          <mesh position={[-0.08, 0.42, 0.14]}>
            <boxGeometry args={[0.06, 0.03, 0.02]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.08, 0.42, 0.14]}>
            <boxGeometry args={[0.06, 0.03, 0.02]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} />
          </mesh>
        </group>
      );

    case 'fairy':
      return (
        <group>
          {/* Delicate body */}
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#ffe0c8" />
          </mesh>
          {/* Wings - left */}
          <mesh position={[-0.25, 0.15, -0.05]} rotation={[0, -0.3, 0.3]} scale={[1, 1.5, 0.1]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive={emissiveColor} emissiveIntensity={0.8} transparent opacity={0.4} />
          </mesh>
          {/* Wings - right */}
          <mesh position={[0.25, 0.15, -0.05]} rotation={[0, 0.3, -0.3]} scale={[1, 1.5, 0.1]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive={emissiveColor} emissiveIntensity={0.8} transparent opacity={0.4} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.05, 0.28, 0.12]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#4488ff" emissive="#2266ff" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0.05, 0.28, 0.12]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#4488ff" emissive="#2266ff" emissiveIntensity={1} />
          </mesh>
          <pointLight intensity={0.8} color={emissiveColor} distance={2} />
        </group>
      );

    case 'shadowWisp':
      return (
        <group>
          {/* Ghostly body */}
          <mesh scale={[1, 1.3, 1]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={1} transparent opacity={0.6} />
          </mesh>
          {/* Wispy trails */}
          <mesh position={[-0.15, -0.3, 0]} scale={[0.5, 1.5, 0.5]}>
            <coneGeometry args={[0.15, 0.4, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.3} />
          </mesh>
          <mesh position={[0.15, -0.35, 0]} scale={[0.4, 1.3, 0.4]}>
            <coneGeometry args={[0.12, 0.35, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.25} />
          </mesh>
          {/* Hollow eyes */}
          <mesh position={[-0.1, 0.1, 0.25]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.1, 0.1, 0.25]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={3} />
          </mesh>
        </group>
      );

    case 'crystalDragon':
      return (
        <group>
          {/* Elongated body */}
          <mesh scale={[0.8, 1, 1.3]}>
            <dodecahedronGeometry args={[0.35, 1]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.6} metalness={0.4} roughness={0.2} />
          </mesh>
          {/* Crystal spikes */}
          {[[-0.2, 0.3, 0], [0, 0.35, -0.1], [0.2, 0.28, 0], [-0.1, 0.3, -0.2], [0.1, 0.32, -0.15]].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} rotation={[(Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5]}>
              <coneGeometry args={[0.04, 0.18, 4]} />
              <meshStandardMaterial color="#aaffff" emissive="#88ddff" emissiveIntensity={1.5} transparent opacity={0.7} />
            </mesh>
          ))}
          {/* Snout */}
          <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.12, 0.2, 8]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.12, 0.1, 0.3]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.12, 0.1, 0.3]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} />
          </mesh>
          <pointLight intensity={1} color="#00aaff" distance={3} />
        </group>
      );

    case 'goldenPhoenix':
      return (
        <group>
          {/* Body */}
          <mesh scale={[0.8, 1, 0.8]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={1.2} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.32, 0.1]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={1} />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 0.28, 0.24]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.04, 0.12, 4]} />
            <meshStandardMaterial color="#ff8800" />
          </mesh>
          {/* Wings spread */}
          <mesh position={[-0.35, 0.1, -0.05]} rotation={[0, -0.2, 0.5]} scale={[1.5, 0.8, 0.1]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={1.5} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.35, 0.1, -0.05]} rotation={[0, 0.2, -0.5]} scale={[1.5, 0.8, 0.1]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={1.5} transparent opacity={0.7} />
          </mesh>
          {/* Tail feathers */}
          <mesh position={[0, -0.1, -0.3]} rotation={[-0.5, 0, 0]}>
            <coneGeometry args={[0.15, 0.4, 6]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1} transparent opacity={0.6} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.05, 0.35, 0.2]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.05, 0.35, 0.2]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
          </mesh>
          <pointLight intensity={2} color="#ffaa00" distance={3} />
        </group>
      );

    default: // fail creatures
      return (
        <group>
          {/* Wonky body */}
          <mesh scale={[1.1, 0.8, 0.9]}>
            <icosahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
          </mesh>
          {/* Derpy eyes */}
          <mesh position={[-0.12, 0.15, 0.25]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.12, 0.18, 0.31]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.14, 0.08, 0.25]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.14, 0.06, 0.3]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Silly tongue */}
          <mesh position={[0.05, -0.1, 0.32]} rotation={[0.3, 0, 0.2]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#ff6688" />
          </mesh>
        </group>
      );
  }
}

function CreatureDisplay({
  creatureId,
  color,
  emissiveColor,
  visible,
}: {
  creatureId: string;
  color: string;
  emissiveColor: string;
  visible: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    if (visible) {
      scaleRef.current = Math.min(scaleRef.current + delta * 1.5, 1);
    } else {
      scaleRef.current = Math.max(scaleRef.current - delta * 3, 0);
    }
    const s = scaleRef.current;
    groupRef.current.scale.set(s, s, s);
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.6;
    // Gentle float
    groupRef.current.position.y = 2.5 + Math.sin(clock.getElapsedTime() * 1.5) * 0.1;
    groupRef.current.visible = s > 0.01;
  });

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      <CreatureBody creatureId={creatureId} color={color} emissiveColor={emissiveColor} />
      <pointLight intensity={1.5} color={emissiveColor} distance={3} />
    </group>
  );
}

// ─── Target Creature Ghost (goal display) ────────────────────

function TargetCreatureGhost({
  creatureId,
  color,
  emissiveColor,
}: {
  creatureId: string;
  color: string;
  emissiveColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.4;
    groupRef.current.position.y = 3.2 + Math.sin(t * 1.2) * 0.08;
  });

  return (
    <group ref={groupRef} position={[2.2, 3.2, -1]} scale={[0.6, 0.6, 0.6]}>
      <CreatureBody creatureId={creatureId} color={color} emissiveColor={emissiveColor} />
      {/* Holographic overlay */}
      <mesh>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
      <pointLight intensity={0.5} color={emissiveColor} distance={2} />
    </group>
  );
}

// ─── Brewing Sparkles ────────────────────────────────────────

function BrewingSparkles({ active }: { active: boolean }) {
  const count = 4;
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      if (!active) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      const angle = t * 2 + (i * Math.PI * 2) / count;
      const r = 0.6 + Math.sin(t * 3 + i) * 0.2;
      mesh.position.x = Math.cos(angle) * r;
      mesh.position.z = Math.sin(angle) * r;
      mesh.position.y = 1.5 + Math.sin(t * 4 + i * 2) * 0.3;
      const flicker = 0.03 + Math.sin(t * 8 + i) * 0.015;
      mesh.scale.setScalar(Math.max(flicker, 0.001));
    }
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial
            color="#ffffaa"
            emissive="#ffff66"
            emissiveIntensity={3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Main Scene ──────────────────────────────────────────────

export function PotionCraftScene({
  state,
  onSelectPotion,
  selectedPotion,
  isStirring,
  stirDirection,
  lastAddedColor,
  targetCreatureId,
}: PotionCraftSceneProps) {
  const potionColors = state.cauldronPotions.map((id) => POTIONS[id].color);
  const isBrewing = state.phase === 'brewing';
  const isPlaying = state.phase === 'playing';

  const reaction = (() => {
    if (state.phase === 'result') {
      return state.stars > 0 ? 'excited' : 'disappointed';
    }
    if (isBrewing) return 'thinking';
    return 'idle';
  })();

  const showCreature =
    state.phase === 'result' && state.resultCreature !== null;
  const creatureData = state.resultCreature
    ? CREATURES[state.resultCreature]
    : null;

  const targetData = CREATURES[targetCreatureId as keyof typeof CREATURES] || null;

  const availablePotions = isPlaying
    ? Array.from(state.unlockedPotions)
    : [];

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} color="#ffeedd" />
      <directionalLight position={[3, 6, 2]} intensity={0.6} color="#fff5e0" />
      <pointLight position={[0, 5, -3]} intensity={0.3} color="#8866ff" distance={10} />

      {/* Room */}
      <Laboratory />

      {/* Cauldron + fire + bubbles */}
      <CauldronGroup
        potionColors={potionColors}
        heatLevel={state.heatLevel}
        isBrewing={isBrewing}
        isStirring={isStirring}
        stirDirection={stirDirection}
        lastAddedColor={lastAddedColor}
        maxPotions={state.currentLevel?.recipe.ingredients.length ?? 3}
      />

      {/* Brewing sparkles */}
      <BrewingSparkles active={isBrewing} />

      {/* Potion shelf */}
      <PotionShelf
        availablePotions={availablePotions}
        onSelectPotion={onSelectPotion}
        selectedPotion={selectedPotion}
      />

      {/* Scientist */}
      <ScientistFigure reaction={reaction} />

      {/* Target creature ghost — always visible during playing */}
      {isPlaying && targetData && (
        <TargetCreatureGhost
          creatureId={targetCreatureId}
          color={targetData.color}
          emissiveColor={targetData.emissiveColor}
        />
      )}

      {/* Result creature */}
      {creatureData && state.resultCreature && (
        <CreatureDisplay
          creatureId={state.resultCreature}
          color={creatureData.color}
          emissiveColor={creatureData.emissiveColor}
          visible={showCreature}
        />
      )}
    </>
  );
}
