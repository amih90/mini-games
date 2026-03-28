'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SceneTransitionProps {
  isTransitioning: boolean;
  biome: string;
  continentName: string;
}

export function SceneTransition({
  isTransitioning,
  biome,
  continentName,
}: SceneTransitionProps) {
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center
            bg-gradient-to-br from-green-800 to-emerald-900"
        >
          <motion.div
            animate={{ scale: [0.5, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1 }}
            className="text-8xl mb-4"
          >
            {biome}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white"
          >
            {continentName}
          </motion.h2>
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mt-6 text-white text-lg"
          >
            ✈️ Traveling...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
