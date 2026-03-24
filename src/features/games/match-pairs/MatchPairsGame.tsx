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

interface PairDef {
  item: string;
  itemEmoji: string;
  match: string;
  matchEmoji: string;
  category: string;
}

interface DifficultyConfig {
  totalLevels: number;
  pairsPerLevel: number;
  pool: PairDef[];
  scoreMultiplier: number;
}

const ANIMAL_PAIRS: PairDef[] = [
  { item: 'Dog', itemEmoji: '🐶', match: 'Bone', matchEmoji: '🦴', category: 'food' },
  { item: 'Cat', itemEmoji: '🐱', match: 'Fish', matchEmoji: '🐟', category: 'food' },
  { item: 'Rabbit', itemEmoji: '🐰', match: 'Carrot', matchEmoji: '🥕', category: 'food' },
  { item: 'Monkey', itemEmoji: '🐵', match: 'Banana', matchEmoji: '🍌', category: 'food' },
  { item: 'Bear', itemEmoji: '🐻', match: 'Honey', matchEmoji: '🍯', category: 'food' },
  { item: 'Mouse', itemEmoji: '🐭', match: 'Cheese', matchEmoji: '🧀', category: 'food' },
];

const HOME_PAIRS: PairDef[] = [
  { item: 'Bird', itemEmoji: '🐦', match: 'Nest', matchEmoji: '🪺', category: 'home' },
  { item: 'Fish', itemEmoji: '🐟', match: 'Water', matchEmoji: '🌊', category: 'home' },
  { item: 'Spider', itemEmoji: '🕷️', match: 'Web', matchEmoji: '🕸️', category: 'home' },
  { item: 'Bee', itemEmoji: '🐝', match: 'Hive', matchEmoji: '🐝', category: 'home' },
  { item: 'Penguin', itemEmoji: '🐧', match: 'Ice', matchEmoji: '🧊', category: 'home' },
  { item: 'Snail', itemEmoji: '🐌', match: 'Shell', matchEmoji: '🐚', category: 'home' },
];

const TOOL_PAIRS: PairDef[] = [
  { item: 'Chef', itemEmoji: '👨‍🍳', match: 'Pan', matchEmoji: '🍳', category: 'tool' },
  { item: 'Doctor', itemEmoji: '👩‍⚕️', match: 'Stethoscope', matchEmoji: '🩺', category: 'tool' },
  { item: 'Artist', itemEmoji: '🧑‍🎨', match: 'Palette', matchEmoji: '🎨', category: 'tool' },
  { item: 'Farmer', itemEmoji: '🧑‍🌾', match: 'Tractor', matchEmoji: '🚜', category: 'tool' },
  { item: 'Astronaut', itemEmoji: '🧑‍🚀', match: 'Rocket', matchEmoji: '🚀', category: 'tool' },
  { item: 'Firefighter', itemEmoji: '🧑‍🚒', match: 'Truck', matchEmoji: '🚒', category: 'tool' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, pairsPerLevel: 3, pool: ANIMAL_PAIRS, scoreMultiplier: 1 },
  medium: { totalLevels: 4, pairsPerLevel: 4, pool: [...ANIMAL_PAIRS, ...HOME_PAIRS], scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, pairsPerLevel: 5, pool: [...ANIMAL_PAIRS, ...HOME_PAIRS, ...TOOL_PAIRS], scoreMultiplier: 2 },
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
  en: {
    title: 'Match Pairs',
    description: 'Match animals to their food, homes, or tools!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    tapInstruction: 'Tap an item on the left, then its match on the right!',
    levelComplete: 'Level {n} Complete!',
    score: 'Score:',
    nextLevel: 'Next Level →',
  },
  he: {
    title: 'התאמת זוגות',
    description: 'התאימו חיות לאוכל, לבתים או לכלים שלהם!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    tapInstruction: 'הקישו על פריט בצד שמאל, ואז על ההתאמה בצד ימין!',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד:',
    nextLevel: 'שלב הבא →',
  },
  zh: {
    title: '配对游戏',
    description: '将动物与它们的食物、家或工具配对！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    tapInstruction: '点击左边的项目，然后点击右边的匹配项！',
    levelComplete: '第{n}关完成！',
    score: '分数：',
    nextLevel: '下一关 →',
  },
  es: {
    title: 'Emparejar',
    description: '¡Empareja animales con su comida, hogar o herramientas!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    tapInstruction: '¡Toca un elemento a la izquierda, luego su pareja a la derecha!',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos:',
    nextLevel: 'Siguiente Nivel →',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🔗', title: 'Find the Match', description: 'Each item on the left has a partner on the right!' },
      { icon: '🐶', title: 'Think About It', description: 'Dogs eat bones, cats eat fish — match what belongs together.' },
      { icon: '⭐', title: 'Score Points', description: 'Match all pairs to complete the level. Build streaks for bonus points!' },
    ],
    controls: [
      { icon: '👈', description: 'Tap an item on the left to select it' },
      { icon: '👉', description: 'Then tap the matching item on the right' },
    ],
    tip: 'Think about what each animal eats or where it lives!',
  },
  he: {
    instructions: [
      { icon: '🔗', title: 'מצאו את ההתאמה', description: 'לכל פריט בצד שמאל יש שותף בצד ימין!' },
      { icon: '🐶', title: 'חשבו על זה', description: 'כלבים אוכלים עצמות, חתולים אוכלים דגים — התאימו מה שייך ביחד.' },
      { icon: '⭐', title: 'צברו נקודות', description: 'התאימו את כל הזוגות כדי להשלים את השלב. בנו רצפים לנקודות בונוס!' },
    ],
    controls: [
      { icon: '👈', description: 'הקישו על פריט בצד שמאל לבחירה' },
      { icon: '👉', description: 'ואז הקישו על ההתאמה בצד ימין' },
    ],
    tip: 'חשבו מה כל חיה אוכלת או איפה היא גרה!',
  },
  zh: {
    instructions: [
      { icon: '🔗', title: '找到配对', description: '左边的每个项目在右边都有一个搭档！' },
      { icon: '🐶', title: '想一想', description: '狗吃骨头，猫吃鱼 — 配对属于一起的东西。' },
      { icon: '⭐', title: '得分', description: '配对所有对来完成关卡。连续配对获得额外分数！' },
    ],
    controls: [
      { icon: '👈', description: '点击左边的项目选择' },
      { icon: '👉', description: '然后点击右边的匹配项' },
    ],
    tip: '想想每只动物吃什么或住在哪里！',
  },
  es: {
    instructions: [
      { icon: '🔗', title: 'Encuentra la Pareja', description: '¡Cada elemento a la izquierda tiene una pareja a la derecha!' },
      { icon: '🐶', title: 'Piénsalo', description: 'Los perros comen huesos, los gatos comen pescado — empareja lo que va junto.' },
      { icon: '⭐', title: 'Gana Puntos', description: '¡Empareja todos los pares para completar el nivel. ¡Haz rachas para puntos extra!' },
    ],
    controls: [
      { icon: '👈', description: 'Toca un elemento a la izquierda para seleccionarlo' },
      { icon: '👉', description: 'Luego toca el elemento correspondiente a la derecha' },
    ],
    tip: '¡Piensa en lo que come cada animal o dónde vive!',
  },
};

export function MatchPairsGame() {
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [streak, setStreak] = useState(0);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const { leftItems, rightItems, pairs } = useMemo(() => {
    const picked = shuffle(config.pool).slice(0, config.pairsPerLevel);
    const left = picked.map((p, i) => ({ idx: i, label: p.item, emoji: p.itemEmoji }));
    const right = shuffle(picked.map((p, i) => ({ idx: i, label: p.match, emoji: p.matchEmoji })));
    return { leftItems: left, rightItems: right, pairs: picked };
  }, [config, level, phase]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setStreak(0);
    setMatched(new Set());
    setSelectedLeft(null);
    playClick();
  }, [playClick]);

  const handleLeftTap = useCallback((idx: number) => {
    if (feedback || matched.has(idx)) return;
    playClick();
    setSelectedLeft(idx);
  }, [feedback, matched, playClick]);

  const handleRightTap = useCallback((pairIdx: number) => {
    if (feedback || selectedLeft === null || matched.has(pairIdx)) return;

    if (selectedLeft === pairIdx) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();

      const newMatched = new Set(matched);
      newMatched.add(pairIdx);
      setMatched(newMatched);

      setTimeout(() => {
        setFeedback(null);
        setSelectedLeft(null);
        if (newMatched.size >= config.pairsPerLevel) {
          if (level >= config.totalLevels) {
            setPhase('won');
          } else {
            setPhase('levelComplete');
          }
        }
      }, 800);
    } else {
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => {
        setFeedback(null);
        setSelectedLeft(null);
      }, 600);
    }
  }, [selectedLeft, matched, streak, config, level, feedback, playSuccess, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setMatched(new Set());
    setSelectedLeft(null);
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setMatched(new Set());
    setSelectedLeft(null);
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-4 sm:p-8" dir={direction}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-sm font-bold">🔥 {streak}</span>
              )}
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-base font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🔗</span>
              <h2 className="text-3xl font-bold text-teal-800">{strings.title}</h2>
              <p className="text-teal-600 text-center max-w-xs">{strings.description}</p>
              <div className="flex flex-col gap-3 w-56">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button key={d} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleStart(d)}
                    className={`py-3 px-6 rounded-xl font-bold text-lg text-white shadow-md ${d === 'easy' ? 'bg-green-400 hover:bg-green-500' : d === 'medium' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'bg-red-400 hover:bg-red-500'}`}>
                    {strings[d]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              <p className="text-center text-base text-teal-600 mb-3">
                {strings.tapInstruction}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Left column */}
                <div className="flex flex-col gap-3">
                  {leftItems.map(({ idx, label, emoji }) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: matched.has(idx) ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLeftTap(idx)}
                      className={`py-3 px-3 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        matched.has(idx) ? 'bg-emerald-200 text-emerald-500 opacity-60' :
                        selectedLeft === idx ? 'bg-teal-400 text-white ring-2 ring-teal-600' :
                        'bg-white text-teal-800 hover:bg-teal-50'
                      }`}
                    >
                      <span className="mr-1">{emoji}</span> {label}
                    </motion.button>
                  ))}
                </div>
                {/* Right column */}
                <div className="flex flex-col gap-3">
                  {rightItems.map(({ idx, label, emoji }) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: matched.has(idx) ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRightTap(idx)}
                      className={`py-3 px-3 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        matched.has(idx) ? 'bg-emerald-200 text-emerald-500 opacity-60' :
                        'bg-white text-cyan-800 hover:bg-cyan-50'
                      }`}
                    >
                      <span className="mr-1">{emoji}</span> {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                    <span className="text-8xl">{feedback === 'correct' ? '🎉' : '❌'}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-teal-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-teal-600">{strings.score} {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold shadow-md">{strings.nextLevel}</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title={strings.title}
          {...(INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en)}
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
