'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'won';

interface Shape {
  id: string;
  emoji: string;
}

interface TargetObject {
  id: string;
  emoji: string;
  recipe: string[]; // shape ids needed (may contain duplicates)
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  shapes: Shape[];
  targets: TargetObject[];
  scoreMultiplier: number;
  hintsPerChallenge: number;
}

interface Challenge {
  target: TargetObject;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHAPES: Shape[] = [
  { id: 'triangle', emoji: '🔺' },
  { id: 'square', emoji: '🟧' },
  { id: 'circle', emoji: '🔵' },
  { id: 'rectangle', emoji: '🟩' },
  { id: 'diamond', emoji: '🔷' },
  { id: 'star', emoji: '⭐' },
  { id: 'heart', emoji: '❤️' },
  { id: 'hexagon', emoji: '⬡' },
];

const EASY_TARGETS: TargetObject[] = [
  { id: 'house', emoji: '🏠', recipe: ['triangle', 'square'] },
  { id: 'icecream', emoji: '🍦', recipe: ['triangle', 'circle'] },
  { id: 'snowman', emoji: '⛄', recipe: ['circle', 'circle'] },
  { id: 'car', emoji: '🚗', recipe: ['rectangle', 'circle'] },
  { id: 'boat', emoji: '⛵', recipe: ['triangle', 'rectangle'] },
  { id: 'mushroom', emoji: '🍄', recipe: ['circle', 'rectangle'] },
];

const MEDIUM_TARGETS: TargetObject[] = [
  ...EASY_TARGETS,
  { id: 'rocket', emoji: '🚀', recipe: ['triangle', 'rectangle', 'triangle'] },
  { id: 'castle', emoji: '🏰', recipe: ['triangle', 'square', 'square'] },
  { id: 'tree', emoji: '🌲', recipe: ['triangle', 'triangle', 'rectangle'] },
  { id: 'robot', emoji: '🤖', recipe: ['square', 'rectangle', 'circle'] },
  { id: 'fish', emoji: '🐟', recipe: ['diamond', 'circle', 'triangle'] },
  { id: 'flower', emoji: '🌸', recipe: ['circle', 'circle', 'rectangle'] },
];

const HARD_TARGETS: TargetObject[] = [
  ...MEDIUM_TARGETS,
  { id: 'spaceship', emoji: '🛸', recipe: ['triangle', 'rectangle', 'circle', 'diamond'] },
  { id: 'train', emoji: '🚂', recipe: ['rectangle', 'square', 'circle', 'circle'] },
  { id: 'crown', emoji: '👑', recipe: ['triangle', 'triangle', 'triangle', 'rectangle'] },
  { id: 'butterfly', emoji: '🦋', recipe: ['circle', 'diamond', 'diamond', 'circle'] },
  { id: 'caterpillar', emoji: '🐛', recipe: ['circle', 'circle', 'circle', 'diamond'] },
  { id: 'castle2', emoji: '🏯', recipe: ['triangle', 'square', 'rectangle', 'star'] },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    totalLevels: 3,
    challengesPerLevel: 5,
    shapes: SHAPES.slice(0, 4),
    targets: EASY_TARGETS,
    scoreMultiplier: 1,
    hintsPerChallenge: 3,
  },
  medium: {
    totalLevels: 4,
    challengesPerLevel: 6,
    shapes: SHAPES.slice(0, 6),
    targets: MEDIUM_TARGETS,
    scoreMultiplier: 1.5,
    hintsPerChallenge: 2,
  },
  hard: {
    totalLevels: 5,
    challengesPerLevel: 7,
    shapes: SHAPES.slice(0, 8),
    targets: HARD_TARGETS,
    scoreMultiplier: 2,
    hintsPerChallenge: 1,
  },
};

// ---------------------------------------------------------------------------
// Localised strings
// ---------------------------------------------------------------------------

const SHAPE_NAMES: Record<string, Record<string, string>> = {
  en: { triangle: 'Triangle', square: 'Square', circle: 'Circle', rectangle: 'Rectangle', diamond: 'Diamond', star: 'Star', heart: 'Heart', hexagon: 'Hexagon' },
  he: { triangle: 'משולש', square: 'ריבוע', circle: 'עיגול', rectangle: 'מלבן', diamond: 'מעוין', star: 'כוכב', heart: 'לב', hexagon: 'משושה' },
  zh: { triangle: '三角形', square: '正方形', circle: '圆形', rectangle: '长方形', diamond: '菱形', star: '星形', heart: '心形', hexagon: '六边形' },
  es: { triangle: 'Triángulo', square: 'Cuadrado', circle: 'Círculo', rectangle: 'Rectángulo', diamond: 'Diamante', star: 'Estrella', heart: 'Corazón', hexagon: 'Hexágono' },
};

const TARGET_NAMES: Record<string, Record<string, string>> = {
  en: { house: 'House', icecream: 'Ice Cream', snowman: 'Snowman', car: 'Car', boat: 'Boat', mushroom: 'Mushroom', rocket: 'Rocket', castle: 'Castle', tree: 'Tree', robot: 'Robot', fish: 'Fish', flower: 'Flower', spaceship: 'Spaceship', train: 'Train', crown: 'Crown', butterfly: 'Butterfly', caterpillar: 'Caterpillar', castle2: 'Palace' },
  he: { house: 'בית', icecream: 'גלידה', snowman: 'איש שלג', car: 'מכונית', boat: 'סירה', mushroom: 'פטריה', rocket: 'רקטה', castle: 'טירה', tree: 'עץ', robot: 'רובוט', fish: 'דג', flower: 'פרח', spaceship: 'חללית', train: 'רכבת', crown: 'כתר', butterfly: 'פרפר', caterpillar: 'זחל', castle2: 'ארמון' },
  zh: { house: '房子', icecream: '冰淇淋', snowman: '雪人', car: '汽车', boat: '船', mushroom: '蘑菇', rocket: '火箭', castle: '城堡', tree: '树', robot: '机器人', fish: '鱼', flower: '花', spaceship: '飞船', train: '火车', crown: '皇冠', butterfly: '蝴蝶', caterpillar: '毛毛虫', castle2: '宫殿' },
  es: { house: 'Casa', icecream: 'Helado', snowman: 'Muñeco de nieve', car: 'Carro', boat: 'Barco', mushroom: 'Hongo', rocket: 'Cohete', castle: 'Castillo', tree: 'Árbol', robot: 'Robot', fish: 'Pez', flower: 'Flor', spaceship: 'Nave', train: 'Tren', crown: 'Corona', butterfly: 'Mariposa', caterpillar: 'Oruga', castle2: 'Palacio' },
};

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Shape Builder', description: 'Combine shapes to build fun objects!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    buildThis: 'Build this:', needs: '{n} shapes needed', recipe: 'Recipe:',
    tapToAdd: 'Tap shapes to add:', yourShapes: 'Your shapes (tap to remove):',
    empty: 'Tap shapes above to start building!',
    clear: '🗑️ Clear', check: '✅ Check!', hint: '💡 Hint',
    levelComplete: 'Level {n} Complete!', score: 'Score', nextLevel: 'Next Level →',
    correct: 'Perfect!', almost: 'Almost there!', tryAgain: 'Not quite — try again!',
    great: 'Great job!', awesome: 'Awesome!', amazing: 'Amazing builder!',
    hintUsed: 'Added a shape for you!', noHints: 'No hints left!',
    progress: '{n} of {total}',
  },
  he: {
    title: 'בונה הצורות', description: 'שלבו צורות לבניית דברים מהנים!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    buildThis: 'בנו את זה:', needs: 'צריך {n} צורות', recipe: 'מתכון:',
    tapToAdd: 'לחצו על צורות להוספה:', yourShapes: 'הצורות שלכם (לחצו להסרה):',
    empty: 'לחצו על צורות למעלה כדי להתחיל לבנות!',
    clear: '🗑️ נקה', check: '✅ בדיקה!', hint: '💡 רמז',
    levelComplete: 'שלב {n} הושלם!', score: 'ניקוד', nextLevel: 'שלב הבא →',
    correct: 'מושלם!', almost: 'כמעט שם!', tryAgain: 'לא בדיוק — נסו שוב!',
    great: 'כל הכבוד!', awesome: 'מדהים!', amazing: 'בנאי מדהים!',
    hintUsed: 'הוספנו צורה בשבילכם!', noHints: 'אין עוד רמזים!',
    progress: '{n} מתוך {total}',
  },
  zh: {
    title: '形状建造师', description: '组合形状来建造有趣的物体！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    buildThis: '建造这个：', needs: '需要{n}个形状', recipe: '配方：',
    tapToAdd: '点击形状添加：', yourShapes: '你的形状（点击移除）：',
    empty: '点击上面的形状开始建造！',
    clear: '🗑️ 清除', check: '✅ 检查！', hint: '💡 提示',
    levelComplete: '第{n}关完成！', score: '分数', nextLevel: '下一关 →',
    correct: '完美！', almost: '快了！', tryAgain: '不太对——再试试！',
    great: '做得好！', awesome: '太棒了！', amazing: '神奇的建造师！',
    hintUsed: '帮你加了一个形状！', noHints: '没有提示了！',
    progress: '{n} / {total}',
  },
  es: {
    title: 'Constructor de Formas', description: '¡Combina formas para construir objetos divertidos!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    buildThis: 'Construye esto:', needs: 'Necesita {n} formas', recipe: 'Receta:',
    tapToAdd: 'Toca formas para agregar:', yourShapes: 'Tus formas (toca para quitar):',
    empty: '¡Toca las formas de arriba para empezar!',
    clear: '🗑️ Limpiar', check: '✅ ¡Revisar!', hint: '💡 Pista',
    levelComplete: '¡Nivel {n} Completado!', score: 'Puntos', nextLevel: 'Siguiente Nivel →',
    correct: '¡Perfecto!', almost: '¡Casi!', tryAgain: '¡No del todo — inténtalo de nuevo!',
    great: '¡Buen trabajo!', awesome: '¡Increíble!', amazing: '¡Constructor increíble!',
    hintUsed: '¡Te agregamos una forma!', noHints: '¡No quedan pistas!',
    progress: '{n} de {total}',
  },
};

const ENCOURAGEMENTS: Record<string, string[]> = {
  en: ['Nice one! 🎉', 'You got it! ⭐', 'Super builder! 🏗️', 'Amazing! 🌟', 'Great work! 💪'],
  he: ['יופי! 🎉', 'נכון! ⭐', 'בנאי על! 🏗️', 'מדהים! 🌟', 'עבודה נהדרת! 💪'],
  zh: ['好棒! 🎉', '对了! ⭐', '超级建造师! 🏗️', '太厉害了! 🌟', '做得好! 💪'],
  es: ['¡Bien hecho! 🎉', '¡Lo lograste! ⭐', '¡Súper constructor! 🏗️', '¡Increíble! 🌟', '¡Gran trabajo! 💪'],
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🔍', title: 'Look at the Target', description: 'See the object you need to build and its recipe.' },
      { icon: '🔷', title: 'Pick Shapes', description: 'Tap the shapes that match the recipe to add them.' },
      { icon: '✅', title: 'Check Your Build', description: 'Hit Check when you think you have the right shapes!' },
      { icon: '💡', title: 'Use Hints', description: 'Stuck? Tap the hint button to get a shape added for you.' },
    ],
    controls: [
      { icon: '👆', description: 'Tap or click a shape to add it' },
      { icon: '⌨️', description: 'Press 1-8 to add shapes by number' },
      { icon: '🔙', description: 'Tap a placed shape or press Backspace to remove' },
      { icon: '💡', description: 'Press H for a hint' },
      { icon: '↩️', description: 'Press Enter to check your build' },
    ],
    tip: 'Look at the recipe — it shows exactly which shapes you need. Count carefully!',
  },
  he: {
    instructions: [
      { icon: '🔍', title: 'הסתכלו על המטרה', description: 'ראו את העצם שצריך לבנות ואת המתכון.' },
      { icon: '🔷', title: 'בחרו צורות', description: 'לחצו על צורות שמתאימות למתכון.' },
      { icon: '✅', title: 'בדקו את הבנייה', description: 'לחצו בדיקה כשאתם חושבים שיש לכם את הצורות הנכונות!' },
      { icon: '💡', title: 'השתמשו ברמזים', description: 'תקועים? לחצו על כפתור הרמז לקבלת צורה.' },
    ],
    controls: [
      { icon: '👆', description: 'לחצו על צורה להוספה' },
      { icon: '⌨️', description: 'לחצו 1-8 להוספת צורות לפי מספר' },
      { icon: '🔙', description: 'לחצו על צורה מונחת או Backspace להסרה' },
      { icon: '💡', description: 'לחצו H לרמז' },
      { icon: '↩️', description: 'לחצו Enter לבדיקה' },
    ],
    tip: 'הסתכלו על המתכון — הוא מראה בדיוק אילו צורות צריך. ספרו בזהירות!',
  },
  zh: {
    instructions: [
      { icon: '🔍', title: '看目标', description: '看看你需要建造的物体和它的配方。' },
      { icon: '🔷', title: '选择形状', description: '点击与配方匹配的形状来添加。' },
      { icon: '✅', title: '检查你的作品', description: '觉得形状对了就点检查！' },
      { icon: '💡', title: '使用提示', description: '卡住了？点击提示按钮获得一个形状。' },
    ],
    controls: [
      { icon: '👆', description: '点击形状添加' },
      { icon: '⌨️', description: '按1-8按数字添加形状' },
      { icon: '🔙', description: '点击已放置的形状或按Backspace移除' },
      { icon: '💡', description: '按H获得提示' },
      { icon: '↩️', description: '按Enter检查' },
    ],
    tip: '看配方——它准确地显示了你需要哪些形状。仔细数！',
  },
  es: {
    instructions: [
      { icon: '🔍', title: 'Mira el Objetivo', description: 'Ve el objeto que necesitas construir y su receta.' },
      { icon: '🔷', title: 'Elige Formas', description: 'Toca las formas que coincidan con la receta.' },
      { icon: '✅', title: 'Revisa tu Construcción', description: '¡Presiona Revisar cuando creas que tienes las formas correctas!' },
      { icon: '💡', title: 'Usa Pistas', description: '¿Atascado? Toca el botón de pista para obtener una forma.' },
    ],
    controls: [
      { icon: '👆', description: 'Toca o haz clic en una forma para agregarla' },
      { icon: '⌨️', description: 'Presiona 1-8 para agregar formas por número' },
      { icon: '🔙', description: 'Toca una forma colocada o presiona Backspace para quitar' },
      { icon: '💡', description: 'Presiona H para una pista' },
      { icon: '↩️', description: 'Presiona Enter para revisar' },
    ],
    tip: '¡Mira la receta — muestra exactamente qué formas necesitas. ¡Cuenta con cuidado!',
  },
};

// Floating particle colors per shape
const SHAPE_COLORS: Record<string, string> = {
  triangle: '#ef4444', square: '#f97316', circle: '#3b82f6',
  rectangle: '#22c55e', diamond: '#6366f1', star: '#eab308',
  heart: '#ec4899', hexagon: '#8b5cf6',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Build a challenge list client-side only (avoids SSR hydration mismatch). */
function generateChallenges(config: DifficultyConfig): Challenge[] {
  const result: Challenge[] = [];
  const pool = config.targets;
  for (let i = 0; i < config.challengesPerLevel; i++) {
    result.push({ target: pool[Math.floor(Math.random() * pool.length)] });
  }
  return result;
}

/** Compare two sorted arrays of strings for equality. */
function arraysEqualSorted(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShapeBuilderGame() {
  const t = useTranslations();
  const locale = useLocale();
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const shapeNames = SHAPE_NAMES[locale] || SHAPE_NAMES.en;
  const targetNames = TARGET_NAMES[locale] || TARGET_NAMES.en;
  const encouragements = ENCOURAGEMENTS[locale] || ENCOURAGEMENTS.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const {
    playClick, playSuccess, playDrop, playPowerUp, playLevelUp,
    playHit, playWin, playGameOver, playBeep, playMove,
  } = useRetroSounds();

  // -- Core state --
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(0);
  const [encouragement, setEncouragement] = useState('');
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

  const particleId = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];
  const currentTarget = challenges[challengeIndex]?.target ?? null;

  // -- Client-only mount --
  useEffect(() => { setMounted(true); }, []);

  // -- Generate challenges when level/phase changes (client-only) --
  useEffect(() => {
    if (!mounted || phase !== 'playing') return;
    const c = generateChallenges(config);
    setChallenges(c);
    setChallengeIndex(0);
    setSelectedShapes([]);
    setHintsLeft(config.hintsPerChallenge);
  }, [mounted, level, phase, config]);

  // -- Celebration particles --
  const spawnParticles = useCallback((emoji: string, count: number) => {
    const newParticles = Array.from({ length: count }, () => ({
      id: particleId.current++,
      emoji,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 30,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1500);
  }, []);

  // -- Keyboard support --
  useEffect(() => {
    if (phase !== 'playing' || !mounted || feedback) return;

    const handleKey = (e: KeyboardEvent) => {
      // Number keys 1-8 → add shape
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= config.shapes.length) {
        e.preventDefault();
        const shape = config.shapes[num - 1];
        handleShapeTap(shape.id);
        return;
      }
      // H → hint
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleHint();
        return;
      }
      // Backspace → remove last shape
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          handleRemoveShape(selectedShapes.length - 1);
        }
        return;
      }
      // Enter → check
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedShapes.length > 0) handleCheck();
        return;
      }
      // C → clear
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setSelectedShapes([]);
        playDrop();
        return;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mounted, feedback, selectedShapes, config.shapes]);

  // -- Handlers --

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setSelectedShapes([]);
    setStreak(0);
    setEncouragement('');
    playClick();
  }, [playClick]);

  const handleShapeTap = useCallback((shapeId: string) => {
    if (phase !== 'playing' || feedback) return;
    playMove();
    setSelectedShapes(prev => [...prev, shapeId]);
  }, [phase, feedback, playMove]);

  const handleRemoveShape = useCallback((index: number) => {
    if (feedback) return;
    playDrop();
    setSelectedShapes(prev => prev.filter((_, i) => i !== index));
  }, [feedback, playDrop]);

  const handleHint = useCallback(() => {
    if (!currentTarget || feedback || hintsLeft <= 0) {
      if (hintsLeft <= 0) playBeep();
      return;
    }
    // Find a missing shape from the recipe
    const recipeCopy = [...currentTarget.recipe].sort();
    const selectedCopy = [...selectedShapes].sort();
    let missingShape: string | null = null;
    let ri = 0, si = 0;
    while (ri < recipeCopy.length) {
      if (si < selectedCopy.length && recipeCopy[ri] === selectedCopy[si]) {
        ri++;
        si++;
      } else {
        missingShape = recipeCopy[ri];
        break;
      }
    }
    if (!missingShape && ri < recipeCopy.length) {
      missingShape = recipeCopy[ri];
    }
    if (missingShape) {
      playPowerUp();
      setSelectedShapes(prev => [...prev, missingShape!]);
      setHintsLeft(prev => prev - 1);
      setEncouragement(strings.hintUsed);
      const shape = SHAPES.find(s => s.id === missingShape);
      if (shape) spawnParticles(shape.emoji, 3);
      setTimeout(() => setEncouragement(''), 1500);
    }
  }, [currentTarget, feedback, hintsLeft, selectedShapes, playPowerUp, playBeep, strings, spawnParticles]);

  const handleCheck = useCallback(() => {
    if (!currentTarget || feedback) return;

    const isCorrect = arraysEqualSorted(selectedShapes, currentTarget.recipe);

    if (isCorrect) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();
      spawnParticles(currentTarget.emoji, 8);
      setEncouragement(pickRandom(encouragements));

      setTimeout(() => {
        setFeedback(null);
        setSelectedShapes([]);
        setEncouragement('');
        setHintsLeft(config.hintsPerChallenge);
        if (challengeIndex + 1 >= config.challengesPerLevel) {
          if (level >= config.totalLevels) {
            playWin();
            setPhase('won');
          } else {
            playLevelUp();
            setPhase('levelComplete');
          }
        } else {
          setChallengeIndex(prev => prev + 1);
        }
      }, 1400);
    } else {
      setFeedback('wrong');
      setStreak(0);
      playHit();
      // Show which shapes are wrong — keep the correct ones, remove wrong ones
      setEncouragement(strings.tryAgain);
      setTimeout(() => {
        setFeedback(null);
        setEncouragement('');
        // Clear on wrong — user tries again
        setSelectedShapes([]);
      }, 1200);
    }
  }, [currentTarget, selectedShapes, streak, config, challengeIndex, level, playSuccess, playHit, playWin, playLevelUp, feedback, encouragements, strings, spawnParticles]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setSelectedShapes([]);
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setSelectedShapes([]);
    setStreak(0);
    setEncouragement('');
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  // -- Derived --
  const recipeFulfilled = currentTarget
    ? (() => {
        const remaining = [...currentTarget.recipe];
        selectedShapes.forEach(s => {
          const idx = remaining.indexOf(s);
          if (idx !== -1) remaining.splice(idx, 1);
        });
        return {
          matched: currentTarget.recipe.length - remaining.length,
          total: currentTarget.recipe.length,
          isFull: selectedShapes.length >= currentTarget.recipe.length,
        };
      })()
    : { matched: 0, total: 0, isFull: false };

  // -- SSR guard --
  if (!mounted) {
    return (
      <GameWrapper title={strings.title} onInstructionsClick={() => {}}>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <span className="text-6xl">🏗️</span>
          </motion.div>
        </div>
      </GameWrapper>
    );
  }

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-8 relative overflow-hidden" dir={direction}>

        {/* Floating particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, scale: 1, x: `${p.x}vw`, y: `${p.y}vh` }}
              animate={{ opacity: 0, scale: 2, y: `${p.y - 20}vh` }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="fixed text-3xl pointer-events-none z-50"
              style={{ left: 0, top: 0 }}
            >
              {p.emoji}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* HUD */}
        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2 items-center">
              {streak >= 2 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold"
                >
                  🔥 {streak}
                </motion.span>
              )}
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm font-bold">
                ⭐ {score}
              </span>
            </div>
          </div>
        )}

        {/* Encouragement toast */}
        <AnimatePresence>
          {encouragement && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-amber-700 font-bold text-lg"
            >
              {encouragement}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu */}
        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 pt-12"
            >
              <motion.span
                className="text-7xl"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                🏗️
              </motion.span>
              <h2 className="text-3xl font-bold text-amber-800">{strings.title}</h2>
              <p className="text-amber-600 text-center max-w-xs">{strings.description}</p>
              <div className="flex flex-col gap-3 w-56">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStart(d)}
                    onTouchEnd={(e) => { e.preventDefault(); handleStart(d); }}
                    className={`py-3 px-6 rounded-xl font-bold text-lg text-white shadow-md transition-colors ${
                      d === 'easy' ? 'bg-green-400 hover:bg-green-500' :
                      d === 'medium' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' :
                      'bg-red-400 hover:bg-red-500'
                    }`}
                  >
                    {strings[d]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Playing */}
          {phase === 'playing' && currentTarget && (
            <motion.div
              key={`playing-${level}-${challengeIndex}`}
              initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              {/* Target card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4 text-center shadow-sm">
                <p className="text-sm text-amber-600 mb-1">{strings.buildThis}</p>
                <motion.span
                  className="text-6xl inline-block"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  {currentTarget.emoji}
                </motion.span>
                <p className="text-lg font-bold text-amber-800 mt-1">
                  {targetNames[currentTarget.id] || currentTarget.id}
                </p>

                {/* Recipe display — shows which shapes are needed */}
                <div className="mt-2">
                  <p className="text-xs text-amber-500 mb-1">{strings.recipe}</p>
                  <div className="flex justify-center gap-1 flex-wrap">
                    {currentTarget.recipe.map((shapeId, idx) => {
                      const shape = SHAPES.find(s => s.id === shapeId);
                      // Check if this recipe slot is fulfilled
                      const selectedCopy = [...selectedShapes];
                      let fulfilled = false;
                      for (let r = 0; r <= idx; r++) {
                        const ri = selectedCopy.indexOf(currentTarget.recipe[r]);
                        if (ri !== -1) {
                          if (r === idx) fulfilled = true;
                          selectedCopy.splice(ri, 1);
                        }
                      }
                      return (
                        <motion.span
                          key={idx}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl transition-all ${
                            fulfilled
                              ? 'bg-green-100 ring-2 ring-green-400 scale-110'
                              : 'bg-amber-50 ring-1 ring-amber-200'
                          }`}
                          animate={fulfilled ? { scale: [1.1, 1.2, 1.1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {shape?.emoji}
                        </motion.span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-amber-400 mt-1">
                    {strings.progress
                      .replace('{n}', String(recipeFulfilled.matched))
                      .replace('{total}', String(recipeFulfilled.total))}
                  </p>
                </div>
              </div>

              {/* Shape palette */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 mb-4">
                <p className="text-xs text-amber-500 mb-2 text-center">{strings.tapToAdd}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {config.shapes.map((shape, idx) => (
                    <motion.button
                      key={shape.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleShapeTap(shape.id)}
                      onTouchEnd={(e) => { e.preventDefault(); handleShapeTap(shape.id); }}
                      className="w-[72px] h-[72px] sm:w-20 sm:h-20 bg-white rounded-xl shadow-md flex flex-col items-center justify-center hover:bg-amber-50 active:bg-amber-100 transition-colors relative"
                      style={{ borderBottom: `3px solid ${SHAPE_COLORS[shape.id] || '#f59e0b'}` }}
                    >
                      <span className="text-3xl sm:text-4xl">{shape.emoji}</span>
                      <span className="text-[10px] sm:text-xs text-amber-600 leading-tight">
                        {shapeNames[shape.id] || shape.id}
                      </span>
                      <span className="absolute top-0.5 right-1 text-[9px] text-amber-300 font-mono">
                        {idx + 1}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Building area */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 mb-4 min-h-[80px]">
                <p className="text-xs text-amber-500 mb-2 text-center">{strings.yourShapes}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <AnimatePresence>
                    {selectedShapes.map((shapeId, idx) => {
                      const shape = SHAPES.find(s => s.id === shapeId);
                      return (
                        <motion.button
                          key={`${shapeId}-${idx}`}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={() => handleRemoveShape(idx)}
                          onTouchEnd={(e) => { e.preventDefault(); handleRemoveShape(idx); }}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-50 rounded-xl flex items-center justify-center shadow-md hover:bg-red-50 active:bg-red-100 transition-colors"
                          style={{ borderBottom: `2px solid ${SHAPE_COLORS[shapeId] || '#f59e0b'}` }}
                        >
                          <span className="text-2xl sm:text-3xl">{shape?.emoji}</span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                  {selectedShapes.length === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-amber-300 text-sm py-3"
                    >
                      {strings.empty}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedShapes([]); playDrop(); }}
                  onTouchEnd={(e) => { e.preventDefault(); setSelectedShapes([]); playDrop(); }}
                  className="px-4 py-3 rounded-xl bg-gray-200 text-gray-600 font-bold text-sm sm:text-base"
                >
                  {strings.clear}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleHint}
                  onTouchEnd={(e) => { e.preventDefault(); handleHint(); }}
                  disabled={hintsLeft <= 0}
                  className="px-4 py-3 rounded-xl bg-purple-100 text-purple-700 font-bold text-sm sm:text-base disabled:opacity-40 transition-opacity"
                >
                  {strings.hint} ({hintsLeft})
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  onTouchEnd={(e) => { e.preventDefault(); handleCheck(); }}
                  disabled={selectedShapes.length === 0 || !!feedback}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-base sm:text-lg shadow-md disabled:opacity-50 transition-opacity"
                >
                  {strings.check}
                </motion.button>
              </div>

              {/* Feedback overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
                  >
                    <motion.span
                      className="text-8xl"
                      animate={feedback === 'correct' ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] } : { x: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.6 }}
                    >
                      {feedback === 'correct' ? '🎉' : '🔄'}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress bar */}
              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-amber-400 mb-1">
                  <span>{challengeIndex + 1} / {config.challengesPerLevel}</span>
                </div>
                <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((challengeIndex + 1) / config.challengesPerLevel) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Level Complete */}
          {phase === 'levelComplete' && (
            <motion.div
              key="levelComplete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 pt-16"
            >
              <motion.span
                className="text-7xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                🌟
              </motion.span>
              <h2 className="text-2xl font-bold text-amber-800">
                {strings.levelComplete.replace('{n}', String(level))}
              </h2>
              <p className="text-amber-600">{strings.score}: {score}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                onTouchEnd={(e) => { e.preventDefault(); handleNextLevel(); }}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-md"
              >
                {strings.nextLevel}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={strings.title}
          {...(INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en)}
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
