'use client';

import { motion } from 'framer-motion';
import type { PaintColor } from '../data/colors';

interface PaintTubeProps {
  color: PaintColor;
  /** Display name in current locale. */
  label: string;
  /** Number of parts currently poured into the bowl from this tube. */
  parts: number;
  onPour: () => void;
  disabled?: boolean;
  cbAssist?: boolean;
  reduceMotion?: boolean;
  /** Hint glow when hint ladder suggests this tube. */
  hintGlow?: boolean;
  /** Subtle entrance animation when newly unlocked. */
  newlyUnlocked?: boolean;
  /** Keyboard shortcut digit (1-9) shown as small badge. */
  shortcut?: number;
}

/**
 * SVG paint tube: cap, body with paint label, drip nozzle.
 * Tilts on hover, "squeezes" on tap, shows part counter when poured.
 */
export function PaintTube({
  color,
  label,
  parts,
  onPour,
  disabled,
  cbAssist,
  reduceMotion,
  hintGlow,
  newlyUnlocked,
  shortcut,
}: PaintTubeProps) {
  const dark = isDark(color.hex);
  const textColor = dark ? '#FFFFFF' : '#1F2937';
  const motionProps = reduceMotion
    ? {}
    : {
        whileHover: disabled ? undefined : { y: -4, rotate: -3 },
        whileTap: disabled ? undefined : { scale: 0.93, rotate: 2 },
      };

  return (
    <motion.button
      type="button"
      onClick={onPour}
      disabled={disabled}
      initial={newlyUnlocked && !reduceMotion ? { scale: 0, rotate: 180 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      {...motionProps}
      className={`
        relative flex flex-col items-center gap-1 p-1 sm:p-2 rounded-2xl transition-shadow
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}
        ${hintGlow ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-transparent animate-pulse' : ''}
        focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300
      `}
      aria-label={`${label} paint tube${parts > 0 ? `, ${parts} parts poured` : ''}`}
    >
      {/* Shortcut badge — leading edge */}
      {shortcut && (
        <span className="absolute -top-1 -start-1 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/95 text-gray-700 text-[10px] sm:text-xs font-bold flex items-center justify-center shadow border border-gray-300">
          {shortcut}
        </span>
      )}

      {/* Parts counter — trailing edge */}
      {parts > 0 && (
        <motion.span
          key={parts}
          initial={reduceMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -end-2 z-10 min-w-[1.5rem] h-6 px-1 rounded-full bg-yellow-400 text-gray-900 text-xs font-extrabold flex items-center justify-center shadow-lg border-2 border-white"
        >
          ×{parts}
        </motion.span>
      )}

      {/* SVG tube */}
      <svg
        viewBox="0 0 60 100"
        className="w-12 h-20 sm:w-16 sm:h-24 drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`tube-${color.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color.hex} stopOpacity="0.85" />
            <stop offset="50%" stopColor={color.hex} stopOpacity="1" />
            <stop offset="100%" stopColor={color.hex} stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`cap-${color.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#4B5563" />
          </linearGradient>
        </defs>

        {/* Tube body */}
        <rect x="10" y="20" width="40" height="65" rx="8" fill={`url(#tube-${color.id})`} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        {/* Pinched bottom */}
        <path d="M 10 80 L 14 92 L 46 92 L 50 80 Z" fill={`url(#tube-${color.id})`} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        <line x1="14" y1="92" x2="46" y2="92" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
        {/* Label band */}
        <rect x="10" y="42" width="40" height="20" fill="rgba(255,255,255,0.85)" />
        {/* Cap (top) */}
        <rect x="22" y="6" width="16" height="14" rx="2" fill={`url(#cap-${color.id})`} />
        <rect x="20" y="16" width="20" height="6" rx="1" fill="#374151" />
        {/* Highlight */}
        <rect x="14" y="22" width="3" height="58" rx="1.5" fill="rgba(255,255,255,0.35)" />

        {/* Color-blind letter on label band */}
        {cbAssist && (
          <text
            x="30"
            y="56"
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#1F2937"
            fontFamily="system-ui, sans-serif"
          >
            {color.cbCode}
          </text>
        )}
      </svg>

      {/* Label */}
      <span
        className="text-[10px] sm:text-xs font-bold leading-tight text-center max-w-[64px] truncate px-1 py-0.5 rounded"
        style={{ color: textColor, backgroundColor: dark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}

function isDark(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140;
}
