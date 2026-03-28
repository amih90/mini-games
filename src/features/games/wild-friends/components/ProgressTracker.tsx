'use client';

import { motion } from 'framer-motion';

interface ProgressTrackerProps {
  discovered: number;
  total: number;
  scenesCompleted: number;
  totalScenes: number;
  label?: string;
}

export function ProgressTracker({
  discovered,
  total,
  scenesCompleted,
  totalScenes,
  label = 'Friends Found',
}: ProgressTrackerProps) {
  const pct = total > 0 ? (discovered / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3 bg-white/80 rounded-2xl p-3 shadow-sm">
      <div className="text-2xl">🐾</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{label}</span>
          <span>
            {discovered}/{total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full h-2.5"
          />
        </div>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: totalScenes }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < scenesCompleted ? 'bg-yellow-400' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
