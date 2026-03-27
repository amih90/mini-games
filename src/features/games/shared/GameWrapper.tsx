'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { KidButton } from '@/components/ui/KidButton';
import { useRetroSounds } from '@/hooks/useRetroSounds';

interface GameWrapperProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  className?: string;
  onInstructionsClick?: () => void;
  /** Lock to viewport height with no scroll — use for full-screen 3D / canvas games */
  fullHeight?: boolean;
}

export function GameWrapper({
  children,
  title,
  showBackButton = true,
  className = '',
  onInstructionsClick,
  fullHeight = false,
}: GameWrapperProps) {
  const t = useTranslations('common');
  const { isMuted, toggleMute, playClick } = useRetroSounds();

  const handleBackClick = () => {
    playClick();
  };

  return (
    <div className={`${fullHeight ? 'h-svh' : 'min-h-screen'} flex flex-col bg-gradient-to-b from-[#f7941d] via-[#ffb74d] to-[#f7941d] ${className}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#f7941d]/95 backdrop-blur-sm border-b-4 border-[#ffdd00]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link href="/games" onClick={handleBackClick}>
                <KidButton variant="secondary" size="md">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">←</span>
                    <span>{t('back')}</span>
                  </span>
                </KidButton>
              </Link>
            )}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md"
            >
              {title}
            </motion.h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Instructions button */}
            {onInstructionsClick && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playClick();
                  onInstructionsClick();
                }}
                className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-lavender-dream/50"
                aria-label="Instructions"
              >
                <span className="text-2xl" aria-hidden="true">
                  ❓
                </span>
              </motion.button>
            )}
            
            {/* Sound toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-lavender-dream/50"
              aria-label={isMuted ? t('soundOff') : t('soundOn')}
              aria-pressed={!isMuted}
            >
              <span className="text-2xl" aria-hidden="true">
                {isMuted ? '🔇' : '🔊'}
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Game content */}
      <main className={`flex-1 min-h-0 ${fullHeight ? 'overflow-hidden flex flex-col' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: fullHeight ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={fullHeight ? 'flex-1 h-full' : ''}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
