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
  showSoundToggle?: boolean;
  /** Lock to viewport height with no scroll — use for full-screen 3D / canvas games */
  fullHeight?: boolean;
  theme?: 'default' | 'storybook' | 'fieldnotes';
  sound?: Pick<ReturnType<typeof useRetroSounds>, 'isMuted' | 'toggleMute' | 'playClick'>;
}

export function GameWrapper({
  children,
  title,
  showBackButton = true,
  className = '',
  onInstructionsClick,
  showSoundToggle = true,
  fullHeight = false,
  theme = 'default',
  sound,
}: GameWrapperProps) {
  const t = useTranslations('common');
  const ownSound = useRetroSounds({ enabled: !sound });
  const { isMuted, toggleMute, playClick } = sound ?? ownSound;
  const storybook = theme === 'storybook';
  const fieldnotes = theme === 'fieldnotes';

  const handleBackClick = () => {
    playClick();
  };

  return (
    <div className={`${fullHeight ? (fieldnotes ? 'h-dvh' : 'h-svh') : 'min-h-screen'} flex flex-col ${fieldnotes ? 'bg-[#101c29] text-[#edf5f7]' : storybook ? 'bg-[#fbf3e4] text-[#655149]' : 'bg-gradient-to-b from-[#f7941d] via-[#ffb74d] to-[#f7941d]'} ${className}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-sm ${fieldnotes ? 'bg-[#101c29]/95 border-b border-white/10' : storybook ? 'bg-[#fffaf0]/95 border-b border-[#e1cfa9]' : 'bg-[#f7941d]/95 border-b-4 border-[#ffdd00]'}`}>
        <div className={`container mx-auto px-4 ${fieldnotes ? 'py-px' : storybook ? 'py-2' : 'py-3'} flex items-center justify-between gap-2`}>
          <div className="flex items-center gap-3 min-w-0">
            {showBackButton && (
              <Link href="/games" onClick={handleBackClick}>
                <KidButton variant="secondary" size="md" className={fieldnotes ? '!px-3 !py-0 !h-12 !text-xs !rounded-xl !min-h-12 !shadow-none !border-white/10 !bg-[#243749] !text-[#edf5f7]' : storybook ? '!px-3 !py-2 !text-sm !rounded-xl !min-h-11 !shadow-none !border-[#e7d9bd] !bg-[#fffaf0] !text-[#766251]' : ''}>
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
              className={fieldnotes ? 'text-sm sm:text-base font-bold truncate text-[#edf5f7]' : storybook ? 'text-lg sm:text-2xl font-serif font-semibold truncate text-[#786050]' : 'text-2xl sm:text-3xl font-bold text-white drop-shadow-md'}
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
                className={`${fieldnotes ? 'p-0 h-12 w-12' : 'p-3'} rounded-xl ${fieldnotes ? 'bg-[#243749] border border-white/10' : 'bg-white shadow-md hover:shadow-lg'} transition-shadow min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-lavender-dream/50`}
                aria-label={t('instructions')}
              >
                <span className="text-2xl" aria-hidden="true">
                  {fieldnotes ? '?' : '❓'}
                </span>
              </motion.button>
            )}
            
            {/* Sound toggle */}
            {showSoundToggle && (
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
            )}
          </div>
        </div>
      </header>

      {/* Game content */}
      <main className={`flex-1 min-h-0 ${fullHeight ? 'overflow-hidden flex flex-col' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: fullHeight ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={fullHeight ? 'flex-1 h-full min-h-0' : ''}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
