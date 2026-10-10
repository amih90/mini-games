'use client';

import { useId, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KidButton } from '@/components/ui/KidButton';
import { useDialogFocus } from './useDialogFocus';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instructions: {
    icon: ReactNode;
    title: string;
    description: string;
  }[];
  controls: {
    icon: string;
    description: string;
  }[];
  tip?: string;
  locale?: string;
  theme?: 'default' | 'storybook' | 'fieldnotes';
}

const modalLabels: Record<string, { howToPlay: string; controls: string; proTip: string; letsPlay: string; close: string }> = {
  en: { howToPlay: 'How to Play', controls: 'Controls', proTip: 'Pro Tip', letsPlay: "Got it! Let's Play! 🚀", close: 'Close' },
  he: { howToPlay: 'איך לשחק', controls: 'פקדים', proTip: 'טיפ מקצועי', letsPlay: '!הבנתי! בואו נשחק 🚀', close: 'סגירה' },
  zh: { howToPlay: '如何游玩', controls: '操作方式', proTip: '小技巧', letsPlay: '明白了！开始游戏！🚀', close: '关闭' },
  es: { howToPlay: 'Cómo jugar', controls: 'Controles', proTip: 'Consejo', letsPlay: '¡Entendido! ¡A jugar! 🚀', close: 'Cerrar' },
};

/**
 * Instructions modal following the Feynman Technique:
 * - Explain in simple language
 * - Break down into small steps
 * - Use visual aids (icons/emojis)
 * - Focus on the "why" not just the "how"
 */
export function InstructionsModal({
  isOpen,
  onClose,
  title,
  instructions,
  controls,
  tip,
  locale = 'en',
  theme = 'default',
}: InstructionsModalProps) {
  const labels = modalLabels[locale] || modalLabels.en;
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(isOpen, panel, onClose);
  const storybook = theme === 'storybook';
  const fieldnotes = theme === 'fieldnotes';
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`${fieldnotes ? 'bg-[#192b3a] text-[#edf5f7] border border-white/15 max-h-[90dvh]' : 'bg-white max-h-[90vh]'} rounded-3xl shadow-2xl max-w-2xl w-full overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`sticky top-0 p-6 rounded-t-3xl ${fieldnotes ? 'z-10 bg-[#192b3a]/95 backdrop-blur-md border-b border-white/10' : storybook ? 'bg-[#91afa1] border-b-4 border-[#e8d6ac]' : 'bg-gradient-to-r from-[#f7941d] to-[#ffb74d] border-b-4 border-[#ffdd00]'}`}>
              <div className="flex items-center justify-between">
                <h2 id={titleId} className="text-3xl font-bold text-white drop-shadow-md">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                  aria-label={labels.close}
                >
                  <span className="text-2xl" aria-hidden="true">✕</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* How to Play Section */}
              <div>
                <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${fieldnotes ? 'text-[#a6ecdb]' : storybook ? 'text-[#789486]' : 'text-[#f7941d]'}`}>
                  {!fieldnotes && <span aria-hidden="true">🎯</span>}
                  <span>{labels.howToPlay}</span>
                </h3>
                <div className="space-y-4">
                  {instructions.map((instruction, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-4 items-start p-4 rounded-2xl ${fieldnotes ? 'border bg-white/5 border-white/10' : storybook ? 'border-2 bg-[#f7efe0] border-[#e3d3b0]' : 'border-2 bg-gradient-to-r from-[#f7941d]/10 to-[#ffb74d]/10 border-[#f7941d]/20'}`}
                    >
                      <span className={fieldnotes ? 'flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[#a6ecdb]/10 text-[#a6ecdb] font-bold' : 'text-4xl flex-shrink-0'} aria-hidden="true">
                        {fieldnotes ? String(index + 1).padStart(2, '0') : instruction.icon}
                      </span>
                      <div>
                        <h4 className={`text-lg font-bold mb-1 ${fieldnotes ? 'text-[#edf5f7]' : 'text-gray-800'}`}>
                          {instruction.title}
                        </h4>
                        <p className={`${fieldnotes ? 'text-[#aec2ce]' : 'text-gray-600'} leading-relaxed`}>
                          {instruction.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Controls Section */}
              <div>
                <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${fieldnotes ? 'text-[#a6ecdb]' : storybook ? 'text-[#789486]' : 'text-[#f7941d]'}`}>
                  {!fieldnotes && <span aria-hidden="true">🎮</span>}
                  <span>{labels.controls}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {controls.map((control, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={`flex gap-3 p-3 rounded-xl ${fieldnotes ? 'items-start border bg-white/5 border-white/10' : storybook ? 'items-center border-2 bg-white shadow-sm border-[#dcccaf]' : 'items-center border-2 bg-white shadow-sm border-[#ffdd00]'}`}
                    >
                      <span className={fieldnotes ? 'flex-shrink-0 pt-1' : 'text-2xl'} aria-hidden="true">
                        {fieldnotes ? (
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#a6ecdb" strokeWidth="1.5">
                            <rect x="4" y="3" width="16" height="18" rx="5" />
                            <path d="M12 6v5M8 15h8" />
                          </svg>
                        ) : control.icon}
                      </span>
                      <span className={`${fieldnotes ? 'text-[#aec2ce]' : 'text-gray-700'} font-medium`}>
                        {control.description}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tip Section */}
              {tip && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`p-4 rounded-2xl ${fieldnotes ? 'border bg-[#ead4a5]/5 border-[#ead4a5]/25' : storybook ? 'border-2 bg-[#edf1e4] border-[#b4c3a2]' : 'border-2 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300'}`}
                >
                  <div className="flex gap-3 items-start">
                    {!fieldnotes && <span className="text-3xl" aria-hidden="true">💡</span>}
                    <div>
                      <h4 className={`text-lg font-bold mb-1 ${fieldnotes ? 'text-[#ead4a5]' : storybook ? 'text-[#658473]' : 'text-purple-800'}`}>
                        {labels.proTip}
                      </h4>
                      <p className={fieldnotes ? 'text-[#aec2ce]' : storybook ? 'text-[#718773]' : 'text-purple-700'}>{tip}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Close Button */}
              <div className="flex justify-center pt-4">
                <KidButton
                  variant="primary"
                  size="lg"
                  onClick={onClose}
                  className={fieldnotes ? '!bg-[#a6ecdb] !text-[#192b3a] !border-0 !shadow-none !rounded-xl hover:!bg-[#c3f5e8]' : storybook ? '!bg-[#8da99b] !text-[#fffaf0] hover:!bg-[#79998a]' : ''}
                >
                  {fieldnotes ? labels.letsPlay.replace('🚀', '').trim() : labels.letsPlay}
                </KidButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
