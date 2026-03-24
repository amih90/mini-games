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

interface WordChallenge {
  word: string;
  emoji: string;
  letters: string[];
}

interface DifficultyConfig {
  totalLevels: number;
  wordsPerLevel: number;
  pool: WordChallenge[];
  scoreMultiplier: number;
}

const EASY_WORDS: WordChallenge[] = [
  { word: 'CAT', emoji: '🐱', letters: ['C', 'A', 'T'] },
  { word: 'DOG', emoji: '🐶', letters: ['D', 'O', 'G'] },
  { word: 'SUN', emoji: '☀️', letters: ['S', 'U', 'N'] },
  { word: 'BEE', emoji: '🐝', letters: ['B', 'E', 'E'] },
  { word: 'HAT', emoji: '🎩', letters: ['H', 'A', 'T'] },
  { word: 'CUP', emoji: '☕', letters: ['C', 'U', 'P'] },
  { word: 'BUS', emoji: '🚌', letters: ['B', 'U', 'S'] },
  { word: 'PIG', emoji: '🐷', letters: ['P', 'I', 'G'] },
];

const MEDIUM_WORDS: WordChallenge[] = [
  ...EASY_WORDS,
  { word: 'FISH', emoji: '🐟', letters: ['F', 'I', 'S', 'H'] },
  { word: 'FROG', emoji: '🐸', letters: ['F', 'R', 'O', 'G'] },
  { word: 'STAR', emoji: '⭐', letters: ['S', 'T', 'A', 'R'] },
  { word: 'CAKE', emoji: '🎂', letters: ['C', 'A', 'K', 'E'] },
  { word: 'BIRD', emoji: '🐦', letters: ['B', 'I', 'R', 'D'] },
  { word: 'MOON', emoji: '🌙', letters: ['M', 'O', 'O', 'N'] },
  { word: 'TREE', emoji: '🌳', letters: ['T', 'R', 'E', 'E'] },
  { word: 'DUCK', emoji: '🦆', letters: ['D', 'U', 'C', 'K'] },
];

const HARD_WORDS: WordChallenge[] = [
  ...MEDIUM_WORDS,
  { word: 'APPLE', emoji: '🍎', letters: ['A', 'P', 'P', 'L', 'E'] },
  { word: 'HOUSE', emoji: '🏠', letters: ['H', 'O', 'U', 'S', 'E'] },
  { word: 'SNAKE', emoji: '🐍', letters: ['S', 'N', 'A', 'K', 'E'] },
  { word: 'PLANE', emoji: '✈️', letters: ['P', 'L', 'A', 'N', 'E'] },
  { word: 'TIGER', emoji: '🐯', letters: ['T', 'I', 'G', 'E', 'R'] },
  { word: 'WHALE', emoji: '🐋', letters: ['W', 'H', 'A', 'L', 'E'] },
  { word: 'CLOUD', emoji: '☁️', letters: ['C', 'L', 'O', 'U', 'D'] },
  { word: 'HEART', emoji: '❤️', letters: ['H', 'E', 'A', 'R', 'T'] },
];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, wordsPerLevel: 5, pool: EASY_WORDS, scoreMultiplier: 1 },
  medium: { totalLevels: 4, wordsPerLevel: 6, pool: MEDIUM_WORDS, scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, wordsPerLevel: 7, pool: HARD_WORDS, scoreMultiplier: 2 },
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
    title: 'Letter Soup',
    description: 'Spell the word by tapping letters in order!',
    easy: '😊 Easy', medium: '🤔 Medium', hard: '🔥 Hard',
    spellWord: 'Spell this word!',
    tapLetters: 'Tap the letters in order:',
    levelComplete: 'Level {n} Complete!',
    score: 'Score', nextLevel: 'Next Level →',
  },
  he: {
    title: 'מרק אותיות',
    description: 'איתות את המילה על ידי הקשה על אותיות בסדר!',
    easy: '😊 קל', medium: '🤔 בינוני', hard: '🔥 קשה',
    spellWord: 'איתות את המילה!',
    tapLetters: 'הקישו על האותיות בסדר:',
    levelComplete: 'שלב {n} הושלם!',
    score: 'ניקוד', nextLevel: 'שלב הבא →',
  },
  zh: {
    title: '字母汤',
    description: '按顺序点击字母拼出单词！',
    easy: '😊 简单', medium: '🤔 中等', hard: '🔥 困难',
    spellWord: '拼出这个单词！',
    tapLetters: '按顺序点击字母：',
    levelComplete: '第{n}关完成！',
    score: '分数', nextLevel: '下一关 →',
  },
  es: {
    title: 'Sopa de Letras',
    description: '¡Deletrea la palabra tocando letras en orden!',
    easy: '😊 Fácil', medium: '🤔 Medio', hard: '🔥 Difícil',
    spellWord: '¡Deletrea esta palabra!',
    tapLetters: 'Toca las letras en orden:',
    levelComplete: '¡Nivel {n} Completado!',
    score: 'Puntos', nextLevel: 'Siguiente Nivel →',
  },
};

const INSTRUCTIONS_DATA: Record<string, { instructions: { icon: string; title: string; description: string }[]; controls: { icon: string; description: string }[]; tip: string }> = {
  en: {
    instructions: [
      { icon: '🖼️', title: 'See the Picture', description: 'An emoji shows the word you need to spell.' },
      { icon: '🔤', title: 'Find Letters', description: 'Tap letters from the soup in the correct spelling order.' },
      { icon: '⭐', title: 'Spell It Right', description: 'Get all letters in order to complete each word!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap letters in order to spell the word' },
      { icon: '↩️', description: 'Tap a placed letter to undo it' },
    ],
    tip: 'Say the word out loud and tap the first letter you hear!',
  },
  he: {
    instructions: [
      { icon: '🖼️', title: 'ראו את התמונה', description: 'אמוג׳י מראה את המילה שצריך לאיית.' },
      { icon: '🔤', title: 'מצאו אותיות', description: 'הקישו על אותיות מהמרק בסדר האיות הנכון.' },
      { icon: '⭐', title: 'איתות נכון', description: 'סדרו את כל האותיות בסדר להשלמת כל מילה!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו על אותיות בסדר לאיות המילה' },
      { icon: '↩️', description: 'הקישו על אות ששובצה לביטול' },
    ],
    tip: 'אמרו את המילה בקול והקישו על האות הראשונה ששומעים!',
  },
  zh: {
    instructions: [
      { icon: '🖼️', title: '看图片', description: '表情符号显示你需要拼写的单词。' },
      { icon: '🔤', title: '找字母', description: '从字母汤中按正确顺序点击字母。' },
      { icon: '⭐', title: '拼写正确', description: '按顺序排列所有字母完成每个单词！' },
    ],
    controls: [
      { icon: '👆', description: '按顺序点击字母拼写单词' },
      { icon: '↩️', description: '点击已放置的字母撤销' },
    ],
    tip: '大声说出单词，然后点击你听到的第一个字母！',
  },
  es: {
    instructions: [
      { icon: '🖼️', title: 'Ve la Imagen', description: 'Un emoji muestra la palabra que necesitas deletrear.' },
      { icon: '🔤', title: 'Encuentra Letras', description: 'Toca letras de la sopa en el orden correcto.' },
      { icon: '⭐', title: 'Deletrea Bien', description: '¡Pon todas las letras en orden para completar cada palabra!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca las letras en orden para deletrear' },
      { icon: '↩️', description: 'Toca una letra colocada para deshacerla' },
    ],
    tip: '¡Di la palabra en voz alta y toca la primera letra que escuches!',
  },
};

export function LetterSoupGame() {
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
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [streak, setStreak] = useState(0);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const challenges = useMemo(() => {
    return shuffle(config.pool).slice(0, config.wordsPerLevel);
  }, [config, level, phase]);

  const current = challenges[challengeIndex];

  // Scrambled letters (the word letters + some distractors, shuffled)
  const availableLetters = useMemo(() => {
    if (!current) return [];
    const distractors = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      .filter(l => !current.letters.includes(l));
    const extra = shuffle(distractors).slice(0, Math.min(3, distractors.length));
    return shuffle([...current.letters, ...extra]);
  }, [current]);

  // Track which available letters have been used (by index)
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setTypedLetters([]);
    setUsedIndices(new Set());
    playClick();
  }, [playClick]);

  const handleLetterTap = useCallback((letter: string, idx: number) => {
    if (feedback || usedIndices.has(idx)) return;
    const nextIdx = typedLetters.length;
    if (!current) return;

    // Only allow correct next letter
    if (letter === current.letters[nextIdx]) {
      playClick();
      const newTyped = [...typedLetters, letter];
      setTypedLetters(newTyped);
      setUsedIndices(prev => { const n = new Set(prev); n.add(idx); return n; });

      if (newTyped.length === current.letters.length) {
        // Word complete!
        setFeedback('correct');
        const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
        setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
        setStreak(prev => prev + 1);
        playSuccess();

        setTimeout(() => {
          setFeedback(null);
          setTypedLetters([]);
          setUsedIndices(new Set());
          if (challengeIndex + 1 >= config.wordsPerLevel) {
            if (level >= config.totalLevels) {
              setPhase('won');
            } else {
              setPhase('levelComplete');
            }
          } else {
            setChallengeIndex(prev => prev + 1);
          }
        }, 1200);
      }
    } else {
      // Wrong letter
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => {
        setFeedback(null);
        setTypedLetters([]);
        setUsedIndices(new Set());
      }, 600);
    }
  }, [feedback, usedIndices, typedLetters, current, streak, config, challengeIndex, level, playClick, playSuccess, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setTypedLetters([]);
    setUsedIndices(new Set());
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setTypedLetters([]);
    setUsedIndices(new Set());
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-4 sm:p-8`} dir={direction}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-2xl mx-auto">
            <LevelDisplay level={level} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-sm font-bold">🔥 {streak}</span>
              )}
              <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-base font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🔤</span>
              <h2 className="text-3xl font-bold text-rose-800">{strings.title}</h2>
              <p className="text-rose-600 text-center max-w-xs">{strings.description}</p>
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

          {phase === 'playing' && current && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              {/* Picture hint */}
              <div className="bg-white/80 rounded-2xl p-4 mb-4 text-center shadow-sm">
                <span className="text-6xl">{current.emoji}</span>
                <p className="text-base text-rose-600 mt-2">{strings.spellWord}</p>
              </div>

              {/* Letter slots — always LTR since words are English/Latin */}
              <div className="flex justify-center gap-2 mb-4" dir="ltr">
                {current.letters.map((l, i) => (
                  <div
                    key={i}
                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                      typedLetters[i]
                        ? 'bg-rose-100 border-rose-400 text-rose-800'
                        : i === typedLetters.length
                          ? 'bg-white border-dashed border-rose-300 animate-pulse'
                          : 'bg-gray-50 border-gray-200 text-gray-300'
                    }`}
                  >
                    {typedLetters[i] || '_'}
                  </div>
                ))}
              </div>

              {/* Available letters — always LTR since letters are English/Latin */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4" dir="ltr">
                <p className="text-sm text-rose-500 mb-2 text-center">{strings.tapLetters}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {availableLetters.map((letter, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: usedIndices.has(idx) ? 1 : 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLetterTap(letter, idx)}
                      disabled={usedIndices.has(idx)}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold text-lg shadow-sm transition-all ${
                        usedIndices.has(idx)
                          ? 'bg-gray-200 text-gray-400 opacity-50'
                          : 'bg-white text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      {letter}
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

              <p className="text-center text-sm text-rose-400 mt-3">
                {challengeIndex + 1} / {config.wordsPerLevel}
              </p>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-rose-800">{strings.levelComplete.replace('{n}', String(level))}</h2>
              <p className="text-rose-600">{strings.score}: {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-md">{strings.nextLevel}</motion.button>
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
