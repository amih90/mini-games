'use client';

import { motion } from 'framer-motion';
import { useCallback } from 'react';

interface DropZoneProps {
  color: string;
  colorName: string;
  isMatched: boolean;
  isActive: boolean;
  isFocused: boolean;
  onDrop: () => void;
  registerRef?: (element: HTMLDivElement | null) => void;
}

export function DropZone({
  color,
  colorName,
  isMatched,
  isActive,
  isFocused,
  registerRef,
}: DropZoneProps) {
  // Combine ref registration with motion ref
  const setRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (registerRef) {
        registerRef(element);
      }
    },
    [registerRef]
  );

  return (
    <motion.div
      ref={setRef}
      animate={{
        scale: isActive ? 1.1 : 1,
        borderWidth: isActive ? 4 : 3,
      }}
      className={`
        aspect-square rounded-3xl border-dashed
        flex items-center justify-center
        transition-colors duration-200
        ${isMatched ? 'bg-mint-fresh/20 border-mint-fresh' : 'bg-white/50 border-slate-300'}
        ${isActive && !isMatched ? 'border-candy-pink bg-candy-pink/10' : ''}
        ${isFocused ? 'ring-4 ring-lavender-dream' : ''}
      `}
      role="button"
      aria-label={`Drop zone for ${colorName}`}
      aria-pressed={isMatched}
      tabIndex={0}
    >
      {isMatched ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-5xl"
        >
          ✓
        </motion.div>
      ) : (
        <div
          className="w-12 h-12 rounded-full opacity-30"
          style={{ backgroundColor: color }}
        />
      )}
    </motion.div>
  );
}
