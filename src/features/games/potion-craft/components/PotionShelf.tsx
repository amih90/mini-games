'use client';

import { Text } from '@react-three/drei';
import { POTIONS } from '../recipes';
import type { PotionId } from '../types';
import { PotionBottle } from './PotionBottle';

interface PotionShelfProps {
  availablePotions: PotionId[];
  onSelectPotion: (id: PotionId) => void;
  selectedPotion: PotionId | null;
}

function ShelfBoard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main plank */}
      <mesh>
        <boxGeometry args={[5, 0.08, 0.4]} />
        <meshStandardMaterial color="#8B6914" roughness={0.7} />
      </mesh>
      {/* Brackets */}
      <mesh position={[-1.8, -0.12, 0.1]}>
        <boxGeometry args={[0.08, 0.2, 0.15]} />
        <meshStandardMaterial color="#6B4F12" roughness={0.8} />
      </mesh>
      <mesh position={[1.8, -0.12, 0.1]}>
        <boxGeometry args={[0.08, 0.2, 0.15]} />
        <meshStandardMaterial color="#6B4F12" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function PotionShelf({
  availablePotions,
  onSelectPotion,
  selectedPotion,
}: PotionShelfProps) {
  const bottomShelfY = 2.5;
  const topShelfY = 3.5;
  const shelfZ = -4.5;

  const bottomRow = availablePotions.slice(0, 4);
  const topRow = availablePotions.slice(4);

  const getRowX = (index: number, total: number) => {
    const totalWidth = (total - 1) * 0.8;
    return -totalWidth / 2 + index * 0.8;
  };

  return (
    <group>
      <ShelfBoard position={[0, bottomShelfY, shelfZ]} />
      <ShelfBoard position={[0, topShelfY, shelfZ]} />

      {/* Bottom shelf potions */}
      {bottomRow.map((id, i) => {
        const potion = POTIONS[id];
        if (!potion) return null;
        const x = getRowX(i, bottomRow.length);
        return (
          <group key={id}>
            <PotionBottle
              shape={potion.bottleShape}
              color={potion.color}
              emissiveColor={potion.emissiveColor}
              position={[x, bottomShelfY + 0.2, shelfZ + 0.05]}
              isSelected={selectedPotion === id}
              onClick={() => onSelectPotion(id)}
            />
            <Text
              position={[x, bottomShelfY - 0.15, shelfZ + 0.2]}
              fontSize={0.12}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {String(i + 1)}
            </Text>
          </group>
        );
      })}

      {/* Top shelf potions */}
      {topRow.map((id, i) => {
        const potion = POTIONS[id];
        if (!potion) return null;
        const x = getRowX(i, topRow.length);
        return (
          <group key={id}>
            <PotionBottle
              shape={potion.bottleShape}
              color={potion.color}
              emissiveColor={potion.emissiveColor}
              position={[x, topShelfY + 0.2, shelfZ + 0.05]}
              isSelected={selectedPotion === id}
              onClick={() => onSelectPotion(id)}
            />
            <Text
              position={[x, topShelfY - 0.15, shelfZ + 0.2]}
              fontSize={0.12}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {String(bottomRow.length + i + 1)}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
