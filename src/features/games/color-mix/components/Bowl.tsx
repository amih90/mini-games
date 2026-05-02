'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { COLOR_BY_ID, totalParts, blendHex } from '../data/colors';

interface BowlProps {
  /** Color id → number of parts. */
  pour: Record<string, number>;
  /** When set, the bowl shows the resolved final color (post-stir). */
  resultHex?: string | null;
  /** True while stir animation is playing. */
  stirring?: boolean;
  reduceMotion?: boolean;
}

/**
 * Mixing bowl. Shows the live blend of poured paints as marbled streaks
 * before stirring; switches to a single uniform color (with bubbles & wave)
 * after the stir resolves.
 */
export function Bowl({ pour, resultHex, stirring, reduceMotion }: BowlProps) {
  const total = totalParts(pour);
  const previewHex = useMemo(() => blendHex(pour), [pour]);
  const finalHex = resultHex ?? previewHex;
  const showFinal = !!resultHex;

  // Build marbled stripes for preview state
  const stripes = useMemo(() => {
    const entries = Object.entries(pour).filter(([, n]) => n > 0);
    const expanded: { id: string; hex: string }[] = [];
    for (const [id, n] of entries) {
      const c = COLOR_BY_ID[id];
      if (!c) continue;
      for (let i = 0; i < n; i++) expanded.push({ id, hex: c.hex });
    }
    return expanded;
  }, [pour]);

  const stripeWidth = stripes.length > 0 ? 100 / stripes.length : 100;

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 200 130"
        className="w-44 h-28 sm:w-56 sm:h-36 drop-shadow-xl"
        aria-label={`Mixing bowl with ${total} parts of paint`}
        role="img"
      >
        <defs>
          <clipPath id="bowl-clip">
            <path d="M 20 30 Q 100 50 180 30 L 175 90 Q 100 130 25 90 Z" />
          </clipPath>
          <linearGradient id="bowl-rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
          <linearGradient id="bowl-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>
          <radialGradient id="bowl-shine">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Bowl body (back) */}
        <ellipse cx="100" cy="30" rx="80" ry="14" fill="url(#bowl-rim)" />

        {/* Liquid area (clipped) */}
        <g clipPath="url(#bowl-clip)">
          {/* Empty floor when nothing poured */}
          {total === 0 && (
            <rect x="0" y="0" width="200" height="130" fill="#F3F4F6" />
          )}

          {/* Marbled streaks (preview) */}
          {!showFinal && stripes.length > 0 && stripes.map((s, i) => (
            <rect
              key={`${s.id}-${i}`}
              x={i * stripeWidth}
              y={0}
              width={stripeWidth + 0.5}
              height={130}
              fill={s.hex}
              opacity={0.92}
            />
          ))}
          {/* Soft blur overlay simulates partial mixing */}
          {!showFinal && stripes.length > 1 && (
            <rect x="0" y="0" width="200" height="130" fill={previewHex} opacity={0.35} />
          )}

          {/* Final stirred color */}
          <AnimatePresence>
            {showFinal && (
              <motion.rect
                key="final"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                x="0"
                y="0"
                width="200"
                height="130"
                fill={finalHex}
              />
            )}
          </AnimatePresence>

          {/* Wave surface */}
          {total > 0 && (
            <motion.path
              d="M -10 38 Q 50 30 100 38 T 210 38 L 210 60 L -10 60 Z"
              fill="rgba(255,255,255,0.18)"
              animate={reduceMotion ? undefined : { x: [0, -10, 0, 10, 0] }}
              transition={reduceMotion ? undefined : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />
          )}

          {/* Bubbles when stirring */}
          {stirring && !reduceMotion && (
            <>
              <motion.circle cx="60" cy="80" r="4" fill="rgba(255,255,255,0.6)"
                animate={{ y: [-30, -60], opacity: [1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }} />
              <motion.circle cx="100" cy="85" r="6" fill="rgba(255,255,255,0.5)"
                animate={{ y: [-30, -60], opacity: [1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }} />
              <motion.circle cx="140" cy="82" r="3" fill="rgba(255,255,255,0.7)"
                animate={{ y: [-30, -60], opacity: [1, 0] }}
                transition={{ duration: 1.0, repeat: Infinity, delay: 0.6 }} />
            </>
          )}
        </g>

        {/* Bowl outline + rim */}
        <path
          d="M 20 30 Q 100 50 180 30 L 175 90 Q 100 130 25 90 Z"
          fill="none"
          stroke="#374151"
          strokeWidth="2.5"
        />
        <ellipse cx="100" cy="30" rx="80" ry="14" fill="none" stroke="#374151" strokeWidth="2.5" />
        <ellipse cx="100" cy="30" rx="74" ry="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        {/* Inner shadow */}
        <ellipse cx="100" cy="30" rx="78" ry="12" fill="url(#bowl-shadow)" opacity="0.4" />
        {/* Shine */}
        <ellipse cx="55" cy="50" rx="20" ry="6" fill="url(#bowl-shine)" opacity="0.8" />
      </svg>

      {/* Stir indicator below bowl */}
      {stirring && !reduceMotion && (
        <motion.div
          className="absolute -bottom-1 text-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        >
          🥄
        </motion.div>
      )}
    </div>
  );
}
