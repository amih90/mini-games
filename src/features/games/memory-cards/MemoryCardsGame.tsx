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

const instructionsData: Record<
  string,
  {
    instructions: { icon: string; title: string; description: string }[];
    controls: { icon: string; description: string }[];
    tip: string;
  }
> = {
  en: {
    instructions: [
      {
        icon: '🃏',
        title: 'Goal',
        description:
          'All the cards are face-down. Your job is to find every matching pair by flipping just two cards at a time.',
      },
      {
        icon: '👀',
        title: 'How it works',
        description:
          'Flip two cards. If they show the same picture — great, they stay face-up! If not, they flip back. Try to remember where each picture was.',
      },
      {
        icon: '🧠',
        title: 'Use your memory',
        description:
          'The fewer moves you use, the better your score. Pay attention and use your brain like a camera!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Click or tap a card to flip it' },
      { icon: '⬆️', description: 'Arrow keys to move between cards' },
      { icon: '⏎', description: 'Enter or Space to flip selected card' },
    ],
    tip: 'Start by flipping cards in order — it helps you build a mental map of where things are!',
  },
  he: {
    instructions: [
      {
        icon: '🃏',
        title: 'מטרה',
        description:
          'כל הקלפים הפוכים. המשימה שלכם היא למצוא את כל הזוגות על ידי הפיכת שני קלפים בכל פעם.',
      },
      {
        icon: '👀',
        title: 'איך זה עובד',
        description:
          'הפכו שני קלפים. אם הם מראים את אותה תמונה — מעולה, הם נשארים גלויים! אם לא, הם חוזרים. נסו לזכור איפה כל תמונה הייתה.',
      },
      {
        icon: '🧠',
        title: 'השתמשו בזיכרון',
        description:
          'ככל שתשתמשו בפחות מהלכים, הניקוד שלכם יהיה טוב יותר. שימו לב והשתמשו במוח כמו מצלמה!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו או הקישו על קלף כדי להפוך אותו' },
      { icon: '⬆️', description: 'חצים לנווט בין הקלפים' },
      { icon: '⏎', description: 'אנטר או רווח להפיכת הקלף הנבחר' },
    ],
    tip: 'התחילו בהפיכת קלפים לפי סדר — זה עוזר לבנות מפה מנטלית של המיקומים!',
  },
  zh: {
    instructions: [
      {
        icon: '🃏',
        title: '目标',
        description:
          '所有卡牌都是背面朝上的。你的任务是每次翻两张牌，找到所有匹配的对。',
      },
      {
        icon: '👀',
        title: '怎么玩',
        description:
          '翻开两张牌。如果它们显示相同的图案——太好了，它们会保持正面朝上！如果不同，它们会翻回去。试着记住每张图案的位置。',
      },
      {
        icon: '🧠',
        title: '用你的记忆力',
        description:
          '你使用的步数越少，得分就越好。集中注意力，把你的大脑当成照相机！',
      },
    ],
    controls: [
      { icon: '🖱️', description: '点击或触摸卡牌来翻转' },
      { icon: '⬆️', description: '方向键在卡牌之间移动' },
      { icon: '⏎', description: '回车或空格翻转选中的卡牌' },
    ],
    tip: '从按顺序翻牌开始——这有助于你建立位置的心理地图！',
  },
  es: {
    instructions: [
      {
        icon: '🃏',
        title: 'Objetivo',
        description:
          'Todas las cartas están boca abajo. Tu misión es encontrar cada par volteando solo dos cartas a la vez.',
      },
      {
        icon: '👀',
        title: 'Cómo funciona',
        description:
          'Voltea dos cartas. Si muestran la misma imagen, ¡genial, se quedan boca arriba! Si no, se voltean de nuevo. Intenta recordar dónde estaba cada imagen.',
      },
      {
        icon: '🧠',
        title: 'Usa tu memoria',
        description:
          'Cuantos menos movimientos uses, mejor será tu puntuación. ¡Presta atención y usa tu cerebro como una cámara!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Haz clic o toca una carta para voltearla' },
      { icon: '⬆️', description: 'Flechas para moverte entre cartas' },
      { icon: '⏎', description: 'Enter o Espacio para voltear la carta seleccionada' },
    ],
    tip: '¡Empieza volteando cartas en orden — te ayuda a construir un mapa mental de dónde están!',
  },
};

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
  const isRtl = locale === 'he';

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
  const instrLocale = instructionsData[locale] || instructionsData.en;

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
          instructions={instrLocale.instructions}
          controls={instrLocale.controls}
          tip={instrLocale.tip}
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
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Top bar: level + stats */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <LevelDisplay
            level={DIFFICULTY_LEVEL_MAP[difficulty]}
            locale={locale}
            isRtl={isRtl}
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
        instructions={instrLocale.instructions}
        controls={instrLocale.controls}
        tip={instrLocale.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
