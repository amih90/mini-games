'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'gameOver' | 'won';
type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon' | 'pentagon';

export interface ColorItem {
  id: string;
  color: string;
  colorName: string;
  shape: ShapeType;
}

interface DifficultyConfig {
  colorCount: number;
  shapeSize: number;
  timeLimits: number[]; // per level; 0 = unlimited
  scoreMultiplier: number;
  totalLevels: number;
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { colorCount: 3, shapeSize: 100, timeLimits: [0, 0, 0],    scoreMultiplier: 1, totalLevels: 3 },
  medium: { colorCount: 5, shapeSize: 80,  timeLimits: [60, 50, 40], scoreMultiplier: 2, totalLevels: 3 },
  hard:   { colorCount: 7, shapeSize: 60,  timeLimits: [35, 28, 22], scoreMultiplier: 3, totalLevels: 3 },
};

const ALL_COLORS: Omit<ColorItem, 'id'>[] = [
  { color: '#EF4444', colorName: 'red',    shape: 'circle'   },
  { color: '#3B82F6', colorName: 'blue',   shape: 'square'   },
  { color: '#22C55E', colorName: 'green',  shape: 'triangle' },
  { color: '#EAB308', colorName: 'yellow', shape: 'star'     },
  { color: '#A855F7', colorName: 'purple', shape: 'diamond'  },
  { color: '#F97316', colorName: 'orange', shape: 'hexagon'  },
  { color: '#EC4899', colorName: 'pink',   shape: 'pentagon' },
];

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};

// ────────────────────────────────────────────────────────────────────
// Instructions (Feynman-style, 4 locales)
// ────────────────────────────────────────────────────────────────────

const INSTRUCTIONS_DATA: Record<
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
        icon: '🎨',
        title: 'Goal',
        description:
          'Each shape has a color. Each zone has a color. Your job is to put each shape into the zone that matches — like sorting colored blocks into the right buckets!',
      },
      {
        icon: '✋',
        title: 'How to Play',
        description:
          'Grab a colored shape by clicking and dragging it (or touching on mobile). Drop it onto the zone with the same color. If it matches, it stays!',
      },
      {
        icon: '⭐',
        title: 'Scoring',
        description:
          'You earn points for every correct match. Harder difficulties and higher levels give bonus points. Can you beat your high score?',
      },
      {
        icon: '📈',
        title: 'Levels',
        description:
          'There are 3 levels in each difficulty. Match all shapes to clear a level. Clear all 3 to win!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Drag shapes with mouse or finger' },
      { icon: '⌨️', description: 'Tab to navigate, Enter to select & drop' },
      { icon: '⏰', description: 'Medium & Hard have a timer — be quick!' },
    ],
    tip: 'Start with Easy to learn the colors, then try Medium or Hard for a real challenge!',
  },
  he: {
    instructions: [
      {
        icon: '🎨',
        title: 'מטרה',
        description:
          'לכל צורה יש צבע ולכל אזור יש צבע. שימו כל צורה באזור שמתאים לצבע שלה — כמו לסדר קוביות צבעוניות בדליים הנכונים!',
      },
      {
        icon: '✋',
        title: 'איך לשחק',
        description:
          'תפסו צורה צבעונית על ידי לחיצה וגרירה (או נגיעה בנייד). שחררו אותה על האזור עם אותו צבע. אם מתאים, היא נשארת!',
      },
      {
        icon: '⭐',
        title: 'ניקוד',
        description:
          'מרוויחים נקודות על כל התאמה נכונה. רמות קושי גבוהות ושלבים מתקדמים נותנים בונוס. אפשר לשבור את השיא?',
      },
      {
        icon: '📈',
        title: 'שלבים',
        description:
          'יש 3 שלבים בכל רמת קושי. התאימו את כל הצורות כדי לעבור שלב. עברו את כל 3 השלבים כדי לנצח!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'גררו צורות עם עכבר או אצבע' },
      { icon: '⌨️', description: 'Tab לניווט, Enter לבחירה והנחה' },
      { icon: '⏰', description: 'ברמות בינוני וקשה יש טיימר — מהרו!' },
    ],
    tip: 'התחילו ברמה קלה ללמוד את הצבעים, ואז נסו בינוני או קשה!',
  },
  zh: {
    instructions: [
      {
        icon: '🎨',
        title: '目标',
        description:
          '每个形状都有颜色，每个区域也有颜色。把每个形状放到匹配颜色的区域里——就像把彩色积木分类放进正确的桶里！',
      },
      {
        icon: '✋',
        title: '怎么玩',
        description:
          '点击并拖动彩色形状（或在手机上触摸拖动），将其放到相同颜色的区域上。匹配正确就会留在那里！',
      },
      {
        icon: '⭐',
        title: '得分',
        description:
          '每次正确匹配都会获得分数。更难的级别和更高的关卡会给更多分数。你能打破最高分吗？',
      },
      {
        icon: '📈',
        title: '关卡',
        description: '每个难度有3个关卡。匹配所有形状来通过一关。通过全部3关即可获胜！',
      },
    ],
    controls: [
      { icon: '🖱️', description: '用鼠标或手指拖动形状' },
      { icon: '⌨️', description: 'Tab导航，Enter选择和放置' },
      { icon: '⏰', description: '中级和高级有时间限制——快点！' },
    ],
    tip: '从简单模式开始学习颜色，然后尝试中级或高级！',
  },
  es: {
    instructions: [
      {
        icon: '🎨',
        title: 'Objetivo',
        description:
          'Cada forma tiene un color y cada zona tiene un color. Pon cada forma en la zona que coincida — ¡como clasificar bloques de colores en los cubos correctos!',
      },
      {
        icon: '✋',
        title: 'Cómo jugar',
        description:
          'Agarra una forma haciendo clic y arrastrando (o tocando en móvil). Suéltala en la zona del mismo color. ¡Si coincide, se queda!',
      },
      {
        icon: '⭐',
        title: 'Puntuación',
        description:
          'Ganas puntos por cada coincidencia correcta. Las dificultades y niveles más altos dan más puntos. ¿Puedes superar tu récord?',
      },
      {
        icon: '📈',
        title: 'Niveles',
        description:
          'Hay 3 niveles en cada dificultad. Combina todas las formas para pasar un nivel. ¡Pasa los 3 niveles para ganar!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Arrastra formas con ratón o dedo' },
      { icon: '⌨️', description: 'Tab para navegar, Enter para seleccionar' },
      { icon: '⏰', description: '¡Medio y Difícil tienen límite de tiempo!' },
    ],
    tip: '¡Empieza en Fácil para aprender los colores, luego prueba Medio o Difícil!',
  },
};

// ────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getColorsForLevel(difficulty: Difficulty): ColorItem[] {
  const count = DIFFICULTY_CONFIG[difficulty].colorCount;
  return ALL_COLORS.slice(0, count).map((c, i) => ({ ...c, id: String(i + 1) }));
}

// ────────────────────────────────────────────────────────────────────
// Shape renderer
// ────────────────────────────────────────────────────────────────────

function ShapeIcon({ shape, color, size }: { shape: ShapeType; color: string; size: number }) {
  const px = `${size}px`;

  switch (shape) {
    case 'circle':
      return <div className="rounded-full" style={{ width: px, height: px, backgroundColor: color }} />;
    case 'square':
      return <div className="rounded-2xl" style={{ width: px, height: px, backgroundColor: color }} />;
    case 'triangle': {
      const half = size / 2;
      return (
        <div
          className="mx-auto"
          style={{
            width: 0,
            height: 0,
            borderLeft: `${half}px solid transparent`,
            borderRight: `${half}px solid transparent`,
            borderBottom: `${size}px solid ${color}`,
          }}
        />
      );
    }
    case 'star':
      return (
        <svg viewBox="0 0 24 24" style={{ width: px, height: px }} fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" style={{ width: px, height: px }} fill={color}>
          <path d="M12 2L22 12L12 22L2 12Z" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" style={{ width: px, height: px }}>
          <polygon points="50,3 95,25 95,75 50,97 5,75 5,25" fill={color} />
        </svg>
      );
    case 'pentagon':
      return (
        <svg viewBox="0 0 100 100" style={{ width: px, height: px }}>
          <polygon points="50,3 97,38 79,97 21,97 3,38" fill={color} />
        </svg>
      );
  }
}

// ────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────

export function ColorMatchGame() {
  const t = useTranslations('colorMatch');
  const locale = useLocale();
  const isRtl = locale === 'he';

  const { playClick, playMatch, playHit, playLevelUp, playWin, playGameOver } =
    useRetroSounds();

  // ── Game state ──────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);

  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('color-match-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [draggableItems, setDraggableItems] = useState<ColorItem[]>([]);
  const [dropZones, setDropZones] = useState<ColorItem[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<ColorItem | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [incorrectFlash, setIncorrectFlash] = useState<string | null>(null);

  // ── Keyboard navigation ────────────────────────────────────────
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [focusedZoneIndex, setFocusedZoneIndex] = useState(0);
  const [keyboardMode, setKeyboardMode] = useState<'items' | 'zones'>('items');

  // ── Refs ────────────────────────────────────────────────────────
  const dropZoneRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // ── Derived ────────────────────────────────────────────────────
  const config = DIFFICULTY_CONFIG[difficulty];
  const unmatchedItems = draggableItems.filter((item) => !matchedIds.has(item.id));
  const instrData = INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en;

  // ── Initialize a level ─────────────────────────────────────────
  const initLevel = useCallback((diff: Difficulty, lvl: number) => {
    const colors = getColorsForLevel(diff);
    setDraggableItems(shuffleArray(colors));
    setDropZones(shuffleArray(colors));
    setMatchedIds(new Set());
    setDraggedItem(null);
    setFocusedItemIndex(0);
    setFocusedZoneIndex(0);
    setKeyboardMode('items');
    setIncorrectFlash(null);
    const timeLimit = DIFFICULTY_CONFIG[diff].timeLimits[lvl - 1] ?? 0;
    setTimeLeft(timeLimit);
  }, []);

  // ── Start game ─────────────────────────────────────────────────
  const startGame = useCallback(
    (diff: Difficulty) => {
      playClick();
      setDifficulty(diff);
      setLevel(1);
      setScore(0);
      setPhase('playing');
      initLevel(diff, 1);
    },
    [initLevel, playClick],
  );

  // ── Restart (back to menu) ─────────────────────────────────────
  const restartGame = useCallback(() => {
    playClick();
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('menu');
    setLevel(1);
    setScore(0);
    setMatchedIds(new Set());
  }, [playClick]);

  usePlayAgainKey(phase === 'gameOver', restartGame);

  // ── Advance level ──────────────────────────────────────────────
  const advanceLevel = useCallback(() => {
    const next = level + 1;
    if (next > config.totalLevels) {
      playWin();
      setPhase('won');
    } else {
      playLevelUp();
      setLevel(next);
      setPhase('playing');
      initLevel(difficulty, next);
    }
  }, [level, config.totalLevels, difficulty, initLevel, playWin, playLevelUp]);

  // ── Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const limit = DIFFICULTY_CONFIG[difficulty].timeLimits[level - 1] ?? 0;
    if (limit === 0) return; // no timer for this level

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          playGameOver();
          setPhase('gameOver');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, difficulty, level, playGameOver]);

  // ── Win / level-complete detection ─────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    if (matchedIds.size === 0 || matchedIds.size < draggableItems.length) return;

    // All matched — stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Time bonus (1 point per remaining second × multiplier)
    const timeBonus = timeLeft * config.scoreMultiplier;
    if (timeBonus > 0) {
      setScore((prev) => prev + timeBonus);
    }

    const delay = setTimeout(() => {
      if (level >= config.totalLevels) {
        playWin();
        setPhase('won');
      } else {
        playLevelUp();
        setPhase('levelComplete');
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [matchedIds, draggableItems.length, phase, level, config, timeLeft, playWin, playLevelUp]);

  // ── High-score persistence ─────────────────────────────────────
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('color-match-highscore', String(score));
    }
  }, [score, highScore]);

  // ── Register drop-zone ref ─────────────────────────────────────
  const registerDropZoneRef = useCallback(
    (colorName: string, el: HTMLDivElement | null) => {
      if (el) dropZoneRefs.current.set(colorName, el);
      else dropZoneRefs.current.delete(colorName);
    },
    [],
  );

  // ── Attempt a match (shared by drag-drop & keyboard) ──────────
  const attemptMatch = useCallback(
    (item: ColorItem, zoneColorName: string) => {
      if (matchedIds.has(item.id)) return;

      if (item.colorName === zoneColorName) {
        playMatch();
        setMatchedIds((prev) => new Set([...prev, item.id]));
        setScore((prev) => prev + 10 * config.scoreMultiplier * level);
      } else {
        playHit();
        setIncorrectFlash(zoneColorName);
        setTimeout(() => setIncorrectFlash(null), 500);
      }
    },
    [matchedIds, playMatch, playHit, config.scoreMultiplier, level],
  );

  // ── Drag handlers ──────────────────────────────────────────────
  const handleDragStart = useCallback((item: ColorItem) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(
    (item: ColorItem, event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      let pointerX: number;
      let pointerY: number;

      if ('changedTouches' in event && event.changedTouches.length > 0) {
        pointerX = event.changedTouches[0].clientX;
        pointerY = event.changedTouches[0].clientY;
      } else if ('touches' in event && event.touches.length > 0) {
        pointerX = event.touches[0].clientX;
        pointerY = event.touches[0].clientY;
      } else if ('clientX' in event) {
        pointerX = event.clientX;
        pointerY = event.clientY;
      } else {
        pointerX = info.point.x;
        pointerY = info.point.y;
      }

      for (const [colorName, element] of dropZoneRefs.current.entries()) {
        const rect = element.getBoundingClientRect();
        const inside =
          pointerX >= rect.left &&
          pointerX <= rect.right &&
          pointerY >= rect.top &&
          pointerY <= rect.bottom;

        if (inside) {
          attemptMatch(item, colorName);
          break;
        }
      }

      setDraggedItem(null);
    },
    [attemptMatch],
  );

  // ── Keyboard navigation ────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (phase !== 'playing') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (keyboardMode === 'items') {
            setFocusedItemIndex((p) => (p + 1) % Math.max(unmatchedItems.length, 1));
          } else {
            setFocusedZoneIndex((p) => (p + 1) % dropZones.length);
          }
          playClick();
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (keyboardMode === 'items') {
            setFocusedItemIndex((p) => (p - 1 + unmatchedItems.length) % Math.max(unmatchedItems.length, 1));
          } else {
            setFocusedZoneIndex((p) => (p - 1 + dropZones.length) % dropZones.length);
          }
          playClick();
          break;

        case 'Tab':
          e.preventDefault();
          if (keyboardMode === 'items' && unmatchedItems.length > 0) {
            if (!draggedItem && unmatchedItems[focusedItemIndex]) {
              setDraggedItem(unmatchedItems[focusedItemIndex]);
            }
            setKeyboardMode('zones');
          } else {
            setKeyboardMode('items');
            setDraggedItem(null);
          }
          playClick();
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (keyboardMode === 'items') {
            if (unmatchedItems[focusedItemIndex]) {
              setDraggedItem(unmatchedItems[focusedItemIndex]);
              setKeyboardMode('zones');
              playClick();
            }
          } else if (keyboardMode === 'zones' && draggedItem) {
            attemptMatch(draggedItem, dropZones[focusedZoneIndex].colorName);
            setDraggedItem(null);
            setKeyboardMode('items');
          }
          break;

        case 'Escape':
          e.preventDefault();
          setDraggedItem(null);
          setKeyboardMode('items');
          break;
      }
    },
    [
      phase,
      keyboardMode,
      unmatchedItems,
      dropZones,
      focusedItemIndex,
      focusedZoneIndex,
      draggedItem,
      attemptMatch,
      playClick,
    ],
  );

  // ── Auto-focus game container on play ──────────────────────────
  useEffect(() => {
    if (phase === 'playing' && gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, [phase]);

  // ────────────────────────────────────────────────────────────────
  // Render helper: grid cols class for drop zones
  // ────────────────────────────────────────────────────────────────
  const gridCols =
    config.colorCount <= 3
      ? 'grid-cols-3'
      : config.colorCount <= 5
        ? 'grid-cols-3 sm:grid-cols-5'
        : 'grid-cols-4 sm:grid-cols-7';

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────

  return (
    <GameWrapper
      title={t('title')}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      {/* ═══════ MENU PHASE ═══════ */}
      {phase === 'menu' && (
        <div className={`max-w-2xl mx-auto text-center py-8 ${isRtl ? 'direction-rtl' : ''}`}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl text-slate-600 mb-6"
          >
            {t('description')}
          </motion.p>

          {highScore > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full bg-amber-100 text-amber-700 font-bold text-lg shadow"
            >
              🏆 {t('highScore')}: {highScore}
            </motion.div>
          )}

          <h2 className="text-2xl font-bold text-slate-700 mb-6">{t('selectDifficulty')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
              const cfg = DIFFICULTY_CONFIG[diff];
              return (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(diff)}
                  className="flex flex-col items-center gap-2 p-6 rounded-3xl bg-white border-4 border-slate-200 shadow-lg hover:border-amber-400 hover:shadow-xl transition-all min-h-[48px] focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                  <span className="text-4xl">{DIFFICULTY_EMOJI[diff]}</span>
                  <span className="text-xl font-bold text-slate-800">{t(diff)}</span>
                  <span className="text-sm text-slate-500">
                    {cfg.colorCount} {t('colors')}
                    {cfg.timeLimits[0] > 0 ? ` · ${cfg.timeLimits[0]}s` : ` · ${t('noTimer')}`}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ PLAYING PHASE ═══════ */}
      {phase === 'playing' && (
        <div
          ref={gameContainerRef}
          className={`max-w-4xl mx-auto ${isRtl ? 'direction-rtl' : ''}`}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="application"
          aria-label={t('title')}
        >
          {/* ── Score bar ── */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <LevelDisplay level={level} locale={locale} />

            <div className="flex items-center gap-4">
              {/* Timer */}
              {config.timeLimits[level - 1] > 0 && (
                <motion.div
                  animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-slate-600'}`}
                >
                  ⏰ {timeLeft}s
                </motion.div>
              )}

              {/* Score */}
              <div className="text-center">
                <span className="text-3xl font-bold text-candy-pink">{score}</span>
                <span className="text-lg text-slate-500 ms-2">{t('points')}</span>
              </div>
            </div>

            {/* Difficulty badge */}
            <div className="px-3 py-1 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
              {DIFFICULTY_EMOJI[difficulty]} {t(difficulty)}
            </div>
          </div>

          {/* ── Hint text ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg text-slate-500 text-center mb-6"
          >
            {draggedItem ? t('dropInZone') : t('instructions')}
          </motion.p>

          {/* ── Drop zones ── */}
          <div className={`grid ${gridCols} gap-3 sm:gap-4 mb-10`}>
            {dropZones.map((zone, index) => {
              const isMatched = matchedIds.has(zone.id);
              const isActive = draggedItem?.colorName === zone.colorName;
              const isFocused = keyboardMode === 'zones' && focusedZoneIndex === index;
              const isFlashing = incorrectFlash === zone.colorName;

              return (
                <motion.div
                  key={zone.id}
                  ref={(el: HTMLDivElement | null) => registerDropZoneRef(zone.colorName, el)}
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    borderWidth: isActive ? 4 : 3,
                  }}
                  className={`
                    aspect-square rounded-3xl border-dashed flex flex-col items-center justify-center gap-2
                    transition-colors duration-200 min-h-[80px]
                    ${isMatched ? 'bg-green-100 border-green-400' : 'bg-white/60 border-slate-300'}
                    ${isActive && !isMatched ? 'border-amber-400 bg-amber-50' : ''}
                    ${isFocused ? 'ring-4 ring-purple-400' : ''}
                    ${isFlashing ? 'bg-red-100 border-red-400' : ''}
                  `}
                  role="button"
                  aria-label={`${t('dropZoneFor')} ${t(zone.colorName)}`}
                  aria-pressed={isMatched}
                  tabIndex={0}
                  onClick={() => {
                    if (draggedItem && !isMatched) {
                      attemptMatch(draggedItem, zone.colorName);
                      setDraggedItem(null);
                      setKeyboardMode('items');
                    }
                  }}
                >
                  {isMatched ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-4xl sm:text-5xl"
                    >
                      ✓
                    </motion.div>
                  ) : (
                    <>
                      <div
                        className="w-8 h-8 rounded-full opacity-30"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-xs text-slate-400 font-medium">{t(zone.colorName)}</span>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ── Draggable items ── */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <AnimatePresence>
              {unmatchedItems.map((item, index) => {
                const isFocused = keyboardMode === 'items' && focusedItemIndex === index;
                const isDragging = draggedItem?.id === item.id;

                return (
                  <motion.div
                    key={item.id}
                    drag
                    dragSnapToOrigin
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={(event, info) =>
                      handleDragEnd(item, event as MouseEvent | TouchEvent | PointerEvent, info)
                    }
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    whileTap={{ scale: 0.95 }}
                    whileDrag={{ scale: 1.15, zIndex: 50 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      boxShadow: isFocused
                        ? '0 0 0 4px rgba(168, 85, 247, 0.5)'
                        : isDragging
                          ? '0 20px 40px rgba(0,0,0,0.2)'
                          : '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                    className={`cursor-grab active:cursor-grabbing p-3 rounded-3xl bg-white
                      ${isFocused ? 'ring-4 ring-purple-400' : ''}
                      ${isDragging ? 'opacity-70' : ''}
                    `}
                    role="button"
                    aria-label={`${t(item.colorName)} ${item.shape}`}
                    tabIndex={0}
                    onClick={() => {
                      if (!draggedItem) {
                        setDraggedItem(item);
                        setKeyboardMode('zones');
                        playClick();
                      }
                    }}
                  >
                    <ShapeIcon shape={item.shape} color={item.color} size={config.shapeSize} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ── Progress ── */}
          <AnimatePresence>
            {matchedIds.size > 0 && matchedIds.size < draggableItems.length && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mt-8 text-2xl font-bold text-green-500"
              >
                {t('keepGoing')} {matchedIds.size}/{draggableItems.length}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════ LEVEL COMPLETE PHASE ═══════ */}
      {phase === 'levelComplete' && (
        <div className={`max-w-md mx-auto text-center py-12 ${isRtl ? 'direction-rtl' : ''}`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5 }}
            className="text-7xl mb-4"
          >
            🎉
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-800 mb-2"
          >
            {t('levelComplete')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-slate-500 mb-8"
          >
            {t('score')}: {score}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={advanceLevel}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-lg min-h-[48px] focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            {t('nextLevel')} →
          </motion.button>
        </div>
      )}

      {/* ═══════ GAME OVER PHASE ═══════ */}
      {phase === 'gameOver' && (
        <div className={`max-w-md mx-auto text-center py-12 ${isRtl ? 'direction-rtl' : ''}`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5 }}
            className="text-7xl mb-4"
          >
            ⏰
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-800 mb-2"
          >
            {t('timeUp')}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-8 mb-8"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-candy-pink">{score}</div>
              <div className="text-slate-500">{t('score')}</div>
            </div>
            {score >= highScore && score > 0 && (
              <div className="text-center">
                <div className="text-4xl">🏆</div>
                <div className="text-amber-500 font-bold">{t('newHighScore')}</div>
              </div>
            )}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={restartGame}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-lg min-h-[48px] focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            {t('playAgain')} 🎮
          </motion.button>
        </div>
      )}

      {/* ═══════ WIN MODAL ═══════ */}
      <WinModal isOpen={phase === 'won'} onPlayAgain={restartGame} score={score} />

      {/* ═══════ INSTRUCTIONS MODAL ═══════ */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t('title')}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
