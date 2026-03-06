'use client';

import { motion, PanInfo } from 'framer-motion';
import type { ColorItem } from '../ColorMatchGame';

interface DraggableShapeProps {
  item: ColorItem;
  isDragging: boolean;
  isFocused: boolean;
  onDragStart: () => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

export function DraggableShape({
  item,
  isDragging,
  isFocused,
  onDragStart,
  onDragEnd,
}: DraggableShapeProps) {
  const renderShape = () => {
    const baseClass = 'w-20 h-20 sm:w-24 sm:h-24';

    switch (item.shape) {
      case 'circle':
        return (
          <div
            className={`${baseClass} rounded-full`}
            style={{ backgroundColor: item.color }}
          />
        );
      case 'square':
        return (
          <div
            className={`${baseClass} rounded-2xl`}
            style={{ backgroundColor: item.color }}
          />
        );
      case 'triangle':
        return (
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '48px solid transparent',
              borderRight: '48px solid transparent',
              borderBottom: `80px solid ${item.color}`,
            }}
          />
        );
      case 'star':
        return (
          <div className={`${baseClass} flex items-center justify-center`}>
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={item.color}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <motion.div
      drag
      dragSnapToOrigin
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      whileDrag={{ scale: 1.2, zIndex: 50 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: isFocused
          ? '0 0 0 4px rgba(168, 85, 247, 0.5)'
          : isDragging
          ? '0 20px 40px rgba(0,0,0,0.2)'
          : '0 4px 12px rgba(0,0,0,0.1)',
      }}
      exit={{ opacity: 0, scale: 0 }}
      className={`cursor-grab active:cursor-grabbing p-2 rounded-3xl bg-white ${
        isFocused ? 'ring-4 ring-lavender-dream' : ''
      }`}
      role="button"
      aria-label={`${item.colorName} ${item.shape}`}
      tabIndex={0}
    >
      {renderShape()}
    </motion.div>
  );
}
