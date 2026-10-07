'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { KidButton } from '@/components/ui/KidButton';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { trackGameComplete } from '@/lib/gtag';
import { usePlayAgainKey } from './usePlayAgainKey';
import { useDialogFocus } from './useDialogFocus';

interface WinModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
  onClose?: () => void;
  score?: number;
  moves?: number;
  title?: string;
  description?: string;
  actionLabel?: string;
  onSound?: () => void;
  keyboardShortcut?: boolean;
  theme?: 'default' | 'storybook';
  children?: ReactNode;
}

export function WinModal({ isOpen, onPlayAgain, onClose, score, moves, title, description, actionLabel, onSound, keyboardShortcut = true, theme = 'default', children }: WinModalProps) {
  const t = useTranslations('common');
  const { playSuccess } = useRetroSounds({ enabled: !onSound });
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(isOpen, panel, onClose);

  usePlayAgainKey(isOpen && keyboardShortcut, onPlayAgain);

  useEffect(() => {
    if (isOpen) {
      (onSound ?? playSuccess)();
      // Extract game slug from pathname (e.g. /en/games/tetris -> tetris)
      const segments = pathname.split('/');
      const gamesIdx = segments.indexOf('games');
      const slug = gamesIdx !== -1 ? segments[gamesIdx + 1] : undefined;
      if (slug) {
        trackGameComplete(slug, score);
      }
    }
  }, [isOpen, playSuccess, onSound, pathname, score]);

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
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`${theme === 'storybook' ? 'bg-[#fffaf0] border-2 border-[#e6d4ad]' : 'bg-white'} rounded-3xl shadow-2xl p-8 max-w-md w-full text-center`}
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
              id={titleId}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`${theme === 'storybook' ? 'font-serif text-3xl text-[#896b56]' : 'text-4xl text-slate-800'} font-bold mb-2`}
            >
              {title ?? t('youWin')}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`${theme === 'storybook' ? 'text-base text-[#887361]' : 'text-2xl text-slate-600'} mb-6`}
            >
              {description ?? t('greatJob')}
            </motion.p>
            {children}

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
              <KidButton variant="success" size="xl" onClick={onPlayAgain} className={theme === 'storybook' ? '!bg-[#8da99b] !text-base !px-5 !min-h-12' : ''}>
                {actionLabel ?? t('playAgain')} 🎮
              </KidButton>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
