'use client';

import { useState, useCallback, useMemo } from 'react';
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

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'won';

interface Shape {
  id: string;
  emoji: string;
  name: string;
}

interface TargetObject {
  name: string;
  emoji: string;
  recipe: string[]; // shape ids needed
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  shapes: Shape[];
  targets: TargetObject[];
  scoreMultiplier: number;
}

const SHAPES: Shape[] = [
  { id: 'triangle', emoji: '🔺', name: 'Triangle' },
  { id: 'square', emoji: '🟧', name: 'Square' },
  { id: 'circle', emoji: '🔵', name: 'Circle' },
  { id: 'rectangle', emoji: '🟩', name: 'Rectangle' },
  { id: 'diamond', emoji: '🔷', name: 'Diamond' },
  { id: 'star', emoji: '⭐', name: 'Star' },
];

const EASY_TARGETS: TargetObject[] = [
  { name: 'House', emoji: '🏠', recipe: ['triangle', 'square'] },
  { name: 'Ice Cream', emoji: '🍦', recipe: ['triangle', 'circle'] },
  { name: 'Snowman', emoji: '⛄', recipe: ['circle', 'circle'] },
  { name: 'Car', emoji: '🚗', recipe: ['rectangle', 'circle'] },
];

const MEDIUM_TARGETS: TargetObject[] = [
  ...EASY_TARGETS,
  { name: 'Rocket', emoji: '🚀', recipe: ['triangle', 'rectangle', 'triangle'] },
  { name: 'Castle', emoji: '🏰', recipe: ['triangle', 'square', 'square'] },
  { name: 'Tree', emoji: '🌲', recipe: ['triangle', 'triangle', 'rectangle'] },
  { name: 'Robot', emoji: '🤖', recipe: ['square', 'rectangle', 'circle'] },
];

const HARD_TARGETS: TargetObject[] = [
  ...MEDIUM_TARGETS,
  { name: 'Spaceship', emoji: '🛸', recipe: ['triangle', 'rectangle', 'circle', 'diamond'] },
  { name: 'Train', emoji: '🚂', recipe: ['rectangle', 'square', 'circle', 'circle'] },
  { name: 'Crown', emoji: '👑', recipe: ['triangle', 'triangle', 'triangle', 'rectangle'] },
  { name: 'Butterfly', emoji: '🦋', recipe: ['circle', 'diamond', 'diamond', 'circle'] },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    totalLevels: 3,
    challengesPerLevel: 6,
    shapes: SHAPES.slice(0, 3),
    targets: EASY_TARGETS,
    scoreMultiplier: 1,
  },
  medium: {
    totalLevels: 4,
    challengesPerLevel: 7,
    shapes: SHAPES.slice(0, 5),
    targets: MEDIUM_TARGETS,
    scoreMultiplier: 1.5,
  },
  hard: {
    totalLevels: 5,
    challengesPerLevel: 8,
    shapes: SHAPES,
    targets: HARD_TARGETS,
    scoreMultiplier: 2,
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: { title: 'Shape Builder', description: 'Pick the right shapes to build each object!', easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard', buildThis: 'Build this:', needs: 'Needs {n} shapes', tapToAdd: 'Tap shapes to add:', yourShapes: 'Your shapes (tap to remove):', empty: 'Empty — pick shapes above!', clear: '🗑️ Clear', check: '✅ Check!', levelComplete: 'Level {n} Complete!', score: 'Score', nextLevel: 'Next Level →' },
  he: { title: 'בונה הצורות', description: 'בחרו את הצורות הנכונות לבנות כל דבר!', easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה', buildThis: 'בנו את זה:', needs: 'צריך {n} צורות', tapToAdd: 'לחצו על צורות להוספה:', yourShapes: 'הצורות שלכם (לחצו להסרה):', empty: 'ריק — בחרו צורות למעלה!', clear: '🗑️ נקה', check: '✅ בדיקה!', levelComplete: 'שלב {n} הושלם!', score: 'ניקוד', nextLevel: 'שלב הבא →' },
  zh: { title: '形状建造师', description: '选择正确的形状来建造每个物体！', easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难', buildThis: '建造这个：', needs: '需要{n}个形状', tapToAdd: '点击形状添加：', yourShapes: '你的形状（点击移除）：', empty: '空的——从上面选形状！', clear: '🗑️ 清除', check: '✅ 检查！', levelComplete: '第{n}关完成！', score: '分数', nextLevel: '下一关 →' },
  es: { title: 'Constructor de Formas', description: '¡Elige las formas correctas para construir cada objeto!', easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil', buildThis: 'Construye esto:', needs: 'Necesita {n} formas', tapToAdd: 'Toca formas para agregar:', yourShapes: 'Tus formas (toca para quitar):', empty: '¡Vacío — elige formas arriba!', clear: '🗑️ Limpiar', check: '✅ ¡Revisar!', levelComplete: '¡Nivel {n} Completado!', score: 'Puntos', nextLevel: 'Siguiente Nivel →' },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: { instructions: [{ icon: '🔍', title: 'Look at the Target', description: 'See the object you need to build.' }, { icon: '🔷', title: 'Pick Shapes', description: 'Tap shapes from the palette that match.' }, { icon: '✅', title: 'Complete It', description: 'Select all the right shapes to finish!' }], controls: [{ icon: '👆', description: 'Tap a shape to add it' }, { icon: '👆', description: 'Tap a placed shape to remove it' }, { icon: '✅', description: 'Hit Check when ready' }], tip: 'Count the shapes needed — the number must match exactly!' },
  he: { instructions: [{ icon: '🔍', title: 'הסתכלו על המטרה', description: 'ראו את העצם שצריך לבנות.' }, { icon: '🔷', title: 'בחרו צורות', description: 'לחצו על צורות מהפלטה שמתאימות.' }, { icon: '✅', title: 'השלימו', description: 'בחרו את כל הצורות הנכונות לסיים!' }], controls: [{ icon: '👆', description: 'לחצו על צורה להוספה' }, { icon: '👆', description: 'לחצו על צורה מונחת להסרה' }, { icon: '✅', description: 'לחצו בדיקה כשמוכנים' }], tip: 'ספרו את הצורות הנדרשות — המספר חייב להתאים בדיוק!' },
  zh: { instructions: [{ icon: '🔍', title: '看目标', description: '看看你需要建造的物体。' }, { icon: '🔷', title: '选择形状', description: '从调色板中点击匹配的形状。' }, { icon: '✅', title: '完成它', description: '选择所有正确的形状来完成！' }], controls: [{ icon: '👆', description: '点击形状添加' }, { icon: '👆', description: '点击已放置的形状移除' }, { icon: '✅', description: '准备好后点击检查' }], tip: '数一数需要的形状——数量必须精确匹配！' },
  es: { instructions: [{ icon: '🔍', title: 'Mira el Objetivo', description: 'Ve el objeto que necesitas construir.' }, { icon: '🔷', title: 'Elige Formas', description: 'Toca las formas de la paleta que coincidan.' }, { icon: '✅', title: 'Complétalo', description: '¡Selecciona todas las formas correctas para terminar!' }], controls: [{ icon: '👆', description: 'Toca una forma para agregarla' }, { icon: '👆', description: 'Toca una forma colocada para quitarla' }, { icon: '✅', description: 'Presiona Revisar cuando estés listo' }], tip: '¡Cuenta las formas necesarias — el número debe coincidir exactamente!' },
};

export function ShapeBuilderGame() {
  const t = useTranslations();
  const locale = useLocale();
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);

  const config = DIFFICULTY_CONFIG[difficulty];

  const challenges = useMemo(() => {
    const pool = config.targets;
    const result: TargetObject[] = [];
    for (let i = 0; i < config.challengesPerLevel; i++) {
      result.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return result;
  }, [config, level, phase]);

  const currentTarget = challenges[challengeIndex];

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setSelectedShapes([]);
    setStreak(0);
    playClick();
  }, [playClick]);

  const handleShapeTap = useCallback((shapeId: string) => {
    if (phase !== 'playing' || feedback) return;
    playClick();
    setSelectedShapes(prev => [...prev, shapeId]);
  }, [phase, feedback, playClick]);

  const handleRemoveShape = useCallback((index: number) => {
    if (feedback) return;
    playDrop();
    setSelectedShapes(prev => prev.filter((_, i) => i !== index));
  }, [feedback, playDrop]);

  const handleCheck = useCallback(() => {
    if (!currentTarget || feedback) return;

    const sortedSelected = [...selectedShapes].sort();
    const sortedRecipe = [...currentTarget.recipe].sort();

    const isCorrect =
      sortedSelected.length === sortedRecipe.length &&
      sortedSelected.every((s, i) => s === sortedRecipe[i]);

    if (isCorrect) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();

      setTimeout(() => {
        setFeedback(null);
        setSelectedShapes([]);
        if (challengeIndex + 1 >= config.challengesPerLevel) {
          if (level >= config.totalLevels) {
            setPhase('won');
          } else {
            setPhase('levelComplete');
          }
        } else {
          setChallengeIndex(prev => prev + 1);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => {
        setFeedback(null);
        setSelectedShapes([]);
      }, 1000);
    }
  }, [currentTarget, selectedShapes, streak, config, challengeIndex, level, playSuccess, playDrop, feedback]);

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
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-8" dir={direction}>

        {/* HUD */}
        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">
                  🔥 {streak}
                </span>
              )}
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm font-bold">
                ⭐ {score}
              </span>
            </div>
          </div>
        )}

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
              <span className="text-7xl">🏗️</span>
              <h2 className="text-3xl font-bold text-amber-800">{strings.title}</h2>
              <p className="text-amber-600 text-center max-w-xs">
                {strings.description}
              </p>
              <div className="flex flex-col gap-3 w-56">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStart(d)}
                    className={`py-3 px-6 rounded-xl font-bold text-lg text-white shadow-md ${
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
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              {/* Target */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4 text-center shadow-sm">
                <p className="text-sm text-amber-600 mb-1">{strings.buildThis}</p>
                <span className="text-5xl">{currentTarget.emoji}</span>
                <p className="text-lg font-bold text-amber-800 mt-1">{currentTarget.name}</p>
                <p className="text-xs text-amber-500">
                  {strings.needs.replace('{n}', String(currentTarget.recipe.length))}
                </p>
              </div>

              {/* Shape palette */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4">
                <p className="text-xs text-amber-500 mb-2 text-center">{strings.tapToAdd}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {config.shapes.map((shape) => (
                    <motion.button
                      key={shape.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleShapeTap(shape.id)}
                      className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl shadow-md flex flex-col items-center justify-center hover:bg-amber-50 transition-colors"
                    >
                      <span className="text-4xl sm:text-5xl">{shape.emoji}</span>
                      <span className="text-xs sm:text-sm text-amber-600">{shape.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Building area */}
              <div className="bg-white/80 rounded-2xl p-3 mb-4 min-h-[80px]">
                <p className="text-xs text-amber-500 mb-2 text-center">{strings.yourShapes}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <AnimatePresence>
                    {selectedShapes.map((shapeId, idx) => {
                      const shape = SHAPES.find(s => s.id === shapeId);
                      return (
                        <motion.button
                          key={`${shapeId}-${idx}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={() => handleRemoveShape(idx)}
                          className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center shadow-md"
                        >
                          <span className="text-3xl">{shape?.emoji}</span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                  {selectedShapes.length === 0 && (
                    <p className="text-amber-300 text-sm py-3">{strings.empty}</p>
                  )}
                </div>
              </div>

              {/* Check button */}
              <div className="flex justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedShapes([])}
                  className="px-5 py-3 rounded-xl bg-gray-200 text-gray-600 font-bold text-base"
                >
                  {strings.clear}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  disabled={selectedShapes.length === 0 || !!feedback}
                  className="px-8 py-3 rounded-xl bg-amber-500 text-white font-bold text-lg shadow-md disabled:opacity-50"
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
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
                  >
                    <span className="text-8xl">
                      {feedback === 'correct' ? '🎉' : '❌'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-sm text-amber-400 mt-3">
                {challengeIndex + 1} / {config.challengesPerLevel}
              </p>
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
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-amber-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-amber-600">{strings.score}: {score}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
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
