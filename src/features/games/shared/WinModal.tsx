'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { KidButton } from '@/components/ui/KidButton';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useEffect } from 'react';

interface WinModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
  onClose?: () => void;
  score?: number;
  moves?: number;
}

export function WinModal({ isOpen, onPlayAgain, onClose, score, moves }: WinModalProps) {
  const t = useTranslations('common');
  const { playSuccess } = useRetroSounds();

  useEffect(() => {
    if (isOpen) {
      playSuccess();
    }
  }, [isOpen, playSuccess]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-8xl mb-4"
            >
              🎉
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-slate-800 mb-2"
            >
              {t('youWin')}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl text-slate-600 mb-6"
            >
              {t('greatJob')}
            </motion.p>

            {/* Stats */}
            {(score !== undefined || moves !== undefined) && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-8 mb-8"
              >
                {score !== undefined && (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-candy-pink">{score}</div>
                    <div className="text-slate-500">{t('score')}</div>
                  </div>
                )}
                {moves !== undefined && (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-sky-bubble">{moves}</div>
                    <div className="text-slate-500">{t('moves')}</div>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <KidButton variant="success" size="xl" onClick={onPlayAgain}>
                {t('playAgain')} 🎮
              </KidButton>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
