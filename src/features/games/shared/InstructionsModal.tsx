'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KidButton } from '@/components/ui/KidButton';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instructions: {
    icon: string;
    title: string;
    description: string;
  }[];
  controls: {
    icon: string;
    description: string;
  }[];
  tip?: string;
  locale?: string;
}

const modalLabels: Record<string, { howToPlay: string; controls: string; proTip: string; letsPlay: string }> = {
  en: { howToPlay: 'How to Play', controls: 'Controls', proTip: 'Pro Tip', letsPlay: "Got it! Let's Play! 🚀" },
  he: { howToPlay: 'איך לשחק', controls: 'פקדים', proTip: 'טיפ מקצועי', letsPlay: '!הבנתי! בואו נשחק 🚀' },
  zh: { howToPlay: '如何游玩', controls: '操作方式', proTip: '小技巧', letsPlay: '明白了！开始游戏！🚀' },
  es: { howToPlay: 'Cómo jugar', controls: 'Controles', proTip: 'Consejo', letsPlay: '¡Entendido! ¡A jugar! 🚀' },
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
}: InstructionsModalProps) {
  const labels = modalLabels[locale] || modalLabels.en;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#f7941d] to-[#ffb74d] p-6 rounded-t-3xl border-b-4 border-[#ffdd00]">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white drop-shadow-md">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <span className="text-2xl" aria-hidden="true">✕</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* How to Play Section */}
              <div>
                <h3 className="text-2xl font-bold text-[#f7941d] mb-4 flex items-center gap-2">
                  <span aria-hidden="true">🎯</span>
                  <span>{labels.howToPlay}</span>
                </h3>
                <div className="space-y-4">
                  {instructions.map((instruction, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 items-start p-4 bg-gradient-to-r from-[#f7941d]/10 to-[#ffb74d]/10 rounded-2xl border-2 border-[#f7941d]/20"
                    >
                      <span className="text-4xl flex-shrink-0" aria-hidden="true">
                        {instruction.icon}
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">
                          {instruction.title}
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          {instruction.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Controls Section */}
              <div>
                <h3 className="text-2xl font-bold text-[#f7941d] mb-4 flex items-center gap-2">
                  <span aria-hidden="true">🎮</span>
                  <span>{labels.controls}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {controls.map((control, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-white border-2 border-[#ffdd00] rounded-xl shadow-sm"
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {control.icon}
                      </span>
                      <span className="text-gray-700 font-medium">
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
                  className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-300"
                >
                  <div className="flex gap-3 items-start">
                    <span className="text-3xl" aria-hidden="true">💡</span>
                    <div>
                      <h4 className="text-lg font-bold text-purple-800 mb-1">
                        {labels.proTip}
                      </h4>
                      <p className="text-purple-700">{tip}</p>
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
                >
                  {labels.letsPlay}
                </KidButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
