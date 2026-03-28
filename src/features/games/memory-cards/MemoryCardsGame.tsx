'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';
import { MemoryCard } from './components/MemoryCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';

interface Card {
  id: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface DifficultySettings {
  cols: number;
  rows: number;
  pairs: number;
  mismatchMs: number;
  emojis: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_EMOJIS = [
  '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🦁',
  '🐮', '🐷', '🐵', '🐔', '🦄', '🐝', '🐢', '🐙',
];

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    cols: 3,
    rows: 2,
    pairs: 3,
    mismatchMs: 1200,
    emojis: ALL_EMOJIS.slice(0, 3),
  },
  medium: {
    cols: 4,
    rows: 3,
    pairs: 6,
    mismatchMs: 900,
    emojis: ALL_EMOJIS.slice(0, 6),
  },
  hard: {
    cols: 4,
    rows: 4,
    pairs: 8,
    mismatchMs: 700,
    emojis: ALL_EMOJIS.slice(0, 8),
  },
};

const DIFFICULTY_LEVEL_MAP: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const LS_KEY = 'memory-cards-highscore';

// ---------------------------------------------------------------------------
// Instructions data (Feynman-style, 4 locales)
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCards(emojis: string[]): Card[] {
  const pairs = emojis.flatMap((emoji, index) => [
    { id: `${index}-a`, emoji, isFlipped: false, isMatched: false },
    { id: `${index}-b`, emoji, isFlipped: false, isMatched: false },
  ]);
  return shuffleArray(pairs);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MemoryCardsGame() {
  const t = useTranslations('memoryCards');
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;

  const {
    playClick,
    playFlip,
    playMatch,
    playHit,
    playLevelUp,
    playWin,
  } = useRetroSounds();

  // ---- State ----
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const settings = difficulty ? DIFFICULTY_SETTINGS[difficulty] : null;
  const totalPairs = settings?.pairs ?? 0;
  const isWin = totalPairs > 0 && pairsFound === totalPairs;

  // ---- Cleanup timers on unmount ----
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  // ---- Start game for a given difficulty ----
  const startGame = useCallback(
    (diff: Difficulty) => {
      playClick();
      const s = DIFFICULTY_SETTINGS[diff];
      setDifficulty(diff);
      setCards(createCards(s.emojis));
      setFlippedCards([]);
      setMoves(0);
      setPairsFound(0);
      setIsChecking(false);
      setShowWin(false);
      setFocusedIndex(0);
    },
    [playClick],
  );

  // ---- Reset / play again ----
  const resetGame = useCallback(() => {
    if (difficulty) {
      startGame(difficulty);
    }
  }, [difficulty, startGame]);

  const backToMenu = useCallback(() => {
    playClick();
    setDifficulty(null);
    setCards([]);
    setFlippedCards([]);
    setMoves(0);
    setPairsFound(0);
    setIsChecking(false);
    setShowWin(false);
  }, [playClick]);

  // ---- Win detection ----
  useEffect(() => {
    if (!isWin) return;

    playWin();

    // Check high score (lower moves = better)
    if (highScore === 0 || moves < highScore) {
      setHighScore(moves);
      localStorage.setItem(LS_KEY, String(moves));
    }

    const timer = setTimeout(() => setShowWin(true), 600);
    return () => clearTimeout(timer);
  }, [isWin, moves, highScore, playWin]);

  // ---- Flip card logic ----
  const flipCard = useCallback(
    (id: string) => {
      if (isChecking || !settings) return;

      const card = cards.find((c) => c.id === id);
      if (!card || card.isFlipped || card.isMatched) return;

      playFlip();

      const newCards = cards.map((c) =>
        c.id === id ? { ...c, isFlipped: true } : c,
      );
      setCards(newCards);

      const newFlipped = [...flippedCards, id];
      setFlippedCards(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((prev) => prev + 1);
        setIsChecking(true);

        const [firstId, secondId] = newFlipped;
        const firstCard = newCards.find((c) => c.id === firstId);
        const secondCard = newCards.find((c) => c.id === secondId);

        if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
          // Match!
          playMatch();
          checkTimeoutRef.current = setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true }
                  : c,
              ),
            );
            setPairsFound((prev) => {
              const next = prev + 1;
              // Level-up sound when not the last pair (win sound covers that)
              if (next < totalPairs && next > 0 && next % 3 === 0) {
                playLevelUp();
              }
              return next;
            });
            setFlippedCards([]);
            setIsChecking(false);
          }, 500);
        } else {
          // Mismatch
          playHit();
          checkTimeoutRef.current = setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c,
              ),
            );
            setFlippedCards([]);
            setIsChecking(false);
          }, settings.mismatchMs);
        }
      }
    },
    [
      cards,
      flippedCards,
      isChecking,
      settings,
      totalPairs,
      playFlip,
      playMatch,
      playHit,
      playLevelUp,
    ],
  );

  // ---- Keyboard navigation ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!settings) return;
      const { cols } = settings;
      const total = cards.length;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % total);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + total) % total);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + cols, total - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - cols, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (cards[focusedIndex] && !cards[focusedIndex].isMatched) {
            flipCard(cards[focusedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          backToMenu();
          break;
      }
    },
    [cards, focusedIndex, settings, flipCard, backToMenu],
  );

  // Auto-focus grid when game starts
  useEffect(() => {
    if (difficulty && gridRef.current) {
      gridRef.current.focus();
    }
  }, [difficulty]);

  // ---- Instruction helpers ----


  // ---- Render: Difficulty selector ----
  if (!difficulty) {
    return (
      <GameWrapper
        title={t('title')}
        onInstructionsClick={() => setShowInstructions(true)}
      >
        {/* Instructions panel */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl text-slate-600 text-center mb-8"
        >
          {t('instructions')}
        </motion.p>

        {/* Difficulty selector */}
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-700 mb-6">
            {t('selectDifficulty')}
          </h2>

          <div className="flex flex-col gap-4">
            {(['easy', 'medium', 'hard'] as const).map((diff) => {
              const gridInfo =
                diff === 'easy'
                  ? '3×2'
                  : diff === 'medium'
                    ? '4×3'
                    : '4×4';
              return (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startGame(diff)}
                  className={`
                    w-full py-4 px-6 rounded-2xl text-xl font-bold text-white shadow-lg
                    min-h-[56px] transition-colors focus:outline-none focus:ring-4
                    ${
                      diff === 'easy'
                        ? 'bg-gradient-to-r from-green-400 to-green-500 focus:ring-green-300'
                        : diff === 'medium'
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 focus:ring-yellow-300'
                          : 'bg-gradient-to-r from-red-400 to-red-500 focus:ring-red-300'
                    }
                  `}
                >
                  {t(diff)}{' '}
                  <span className="text-base font-normal opacity-80">
                    ({gridInfo} · {DIFFICULTY_SETTINGS[diff].pairs} {t('pairs')})
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Instructions modal */}
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={t('title')}
          instructions={[
            { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
            { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
            { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
          ]}
          controls={[
            { icon: t('instructions.control0Icon'), description: t('instructions.control0Desc') },
            { icon: t('instructions.control1Icon'), description: t('instructions.control1Desc') },
            { icon: t('instructions.control2Icon'), description: t('instructions.control2Desc') },
          ]}
          tip={t('instructions.tip')}
          locale={locale}
        />
      </GameWrapper>
    );
  }

  // ---- Render: Active game ----
  return (
    <GameWrapper
      title={t('title')}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div
        className={`max-w-2xl mx-auto`}
        dir={direction}
      >
        {/* Top bar: level + stats */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <LevelDisplay
            level={DIFFICULTY_LEVEL_MAP[difficulty]}
          />

          {/* Back to menu */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={backToMenu}
            className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            ← {t('selectDifficulty')}
          </motion.button>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center gap-6 sm:gap-8 mb-6 flex-wrap"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-candy-pink">{moves}</div>
            <div className="text-slate-500 text-sm">{t('moves')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-mint-fresh">
              {pairsFound}/{totalPairs}
            </div>
            <div className="text-slate-500 text-sm">{t('pairsFound')}</div>
          </div>
          {highScore > 0 && (
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-bubble">
                {highScore}
              </div>
              <div className="text-slate-500 text-sm">{t('bestMoves')}</div>
            </div>
          )}
        </motion.div>

        {/* Card Grid */}
        <div
          ref={gridRef}
          className="grid gap-3 sm:gap-4 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${settings?.cols ?? 4}, minmax(0, 1fr))`,
            maxWidth: (settings?.cols ?? 4) === 3 ? '320px' : '420px',
          }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="grid"
          aria-label={t('title')}
        >
          {cards.map((card, index) => (
            <MemoryCard
              key={card.id}
              card={card}
              onClick={() => flipCard(card.id)}
              disabled={isChecking || card.isFlipped || card.isMatched}
              isFocused={focusedIndex === index}
            />
          ))}
        </div>

        {/* New best indicator */}
        <AnimatePresence>
          {isWin && highScore === moves && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mt-4 text-lg font-bold text-candy-pink"
            >
              🏆 {t('newBest')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={showWin}
        onPlayAgain={resetGame}
        moves={moves}
      />

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t('title')}
        instructions={[
          { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
          { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
          { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
        ]}
        controls={[
          { icon: t('instructions.control0Icon'), description: t('instructions.control0Desc') },
          { icon: t('instructions.control1Icon'), description: t('instructions.control1Desc') },
          { icon: t('instructions.control2Icon'), description: t('instructions.control2Desc') },
        ]}
        tip={t('instructions.tip')}
        locale={locale}
      />
    </GameWrapper>
  );
}
