'use client';

import { motion } from 'framer-motion';

interface ColorWheelProps {
  /** Set of discovered result-color ids — discovered slices show in color, others greyscale. */
  discovered: Set<string>;
  size?: number;
  reduceMotion?: boolean;
}

/**
 * 12-slice color wheel showing primaries, secondaries, and tertiaries.
 * Acts as the "trophy case" — undiscovered slices are greyed out.
 */
export function ColorWheel({ discovered, size = 200, reduceMotion }: ColorWheelProps) {
  const segments = WHEEL_SEGMENTS.map((s, i) => {
    const isDiscovered = discovered.has(s.id) || s.always;
    const fill = isDiscovered ? s.hex : '#D1D5DB';
    const angle = (360 / WHEEL_SEGMENTS.length) * i;
    return { ...s, fill, angle, isDiscovered };
  });

  return (
    <motion.div
      initial={reduceMotion ? false : { rotate: -10, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 12 }}
      style={{ width: size, height: size }}
      className="relative"
      aria-label={`Color wheel: ${segments.filter(s => s.isDiscovered).length} of ${segments.length} discovered`}
      role="img"
    >
      <svg viewBox="-110 -110 220 220" width={size} height={size} className="drop-shadow-lg">
        <defs>
          <radialGradient id="wheel-shine">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {segments.map(seg => {
          const start = (seg.angle - 15) * Math.PI / 180;
          const end = (seg.angle + 15) * Math.PI / 180;
          const x1 = Math.cos(start) * 90;
          const y1 = Math.sin(start) * 90;
          const x2 = Math.cos(end) * 90;
          const y2 = Math.sin(end) * 90;
          const path = `M 0 0 L ${x1} ${y1} A 90 90 0 0 1 ${x2} ${y2} Z`;
          return (
            <path
              key={seg.id}
              d={path}
              fill={seg.fill}
              stroke="#FFFFFF"
              strokeWidth="2"
              opacity={seg.isDiscovered ? 1 : 0.55}
            />
          );
        })}
        {/* Inner white circle */}
        <circle cx="0" cy="0" r="32" fill="#FFFFFF" stroke="#374151" strokeWidth="2" />
        {/* Highlight */}
        <ellipse cx="-25" cy="-25" rx="30" ry="12" fill="url(#wheel-shine)" />
        <text x="0" y="6" textAnchor="middle" fontSize="22" fontWeight="800" fill="#374151" fontFamily="system-ui">
          🎨
        </text>
      </svg>
    </motion.div>
  );
}

interface Segment {
  id: string;
  hex: string;
  /** True for primaries — always shown in color even before discovery. */
  always?: boolean;
}

// Order: top → clockwise. 12 slices, 30° each.
// Pattern: primary → tertiary → secondary → tertiary → primary ...
const WHEEL_SEGMENTS: Segment[] = [
  { id: 'red',       hex: '#EF4444', always: true },          // 0°  (top)
  { id: 'orange',    hex: '#F97316' },                        // 30°
  { id: 'gold',      hex: '#EAB308' },                        // 60°
  { id: 'yellow',    hex: '#FACC15', always: true },          // 90°
  { id: 'mint',      hex: '#A7F3D0' },                        // 120°
  { id: 'green',     hex: '#22C55E' },                        // 150°
  { id: 'cyan',      hex: '#06B6D4' },                        // 180°
  { id: 'light-blue',hex: '#93C5FD' },                        // 210°
  { id: 'blue',      hex: '#3B82F6', always: true },          // 240°
  { id: 'indigo',    hex: '#4338CA' },                        // 270°
  { id: 'purple',    hex: '#A855F7' },                        // 300°
  { id: 'magenta',   hex: '#D946EF' },                        // 330°
];
