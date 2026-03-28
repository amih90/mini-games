'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KiwiNarratorProps {
  message: string;
  onDismiss?: () => void;
  autoHide?: number;
  position?: 'bottom-left' | 'bottom-center' | 'top-center';
}

export function KiwiNarrator({
  message,
  onDismiss,
  autoHide,
  position = 'bottom-left',
}: KiwiNarratorProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoHide);
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, onDismiss]);

  const positionClasses: Record<string, string> = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  const handleClick = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          onClick={handleClick}
          className={`fixed ${positionClasses[position]} z-50
            flex items-end gap-2 cursor-pointer max-w-sm touch-manipulation`}
        >
          {/* Kiwi avatar */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-5xl flex-shrink-0"
          >
            🦜
          </motion.div>

          {/* Speech bubble */}
          <div className="relative bg-white rounded-2xl rounded-bl-sm p-3 shadow-lg border border-green-200">
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
            {/* Bubble tail */}
            <div className="absolute -bottom-1 left-2 w-3 h-3 bg-white border-b border-l border-green-200 rotate-[-45deg]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
