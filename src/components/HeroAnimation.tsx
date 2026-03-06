'use client';

import { motion } from 'framer-motion';

const floatingEmojis = ['🎮', '🎯', '🧩', '🎨', '⭐', '🌟'];

export function HeroAnimation() {
  return (
    <div className="relative h-32 mb-8" aria-hidden="true">
      {floatingEmojis.map((emoji, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl"
          style={{
            left: `${15 + index * 14}%`,
            top: '50%',
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: index * 0.3,
            ease: 'easeInOut',
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}
