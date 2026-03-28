'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useWildFriendsGame } from './hooks/useWildFriendsGame';
import { useAnimalAlbum } from './hooks/useAnimalAlbum';
import { useSceneProgress } from './hooks/useSceneProgress';
import { t } from './data/translations';
import { SCENES, SCENE_BY_ID } from './data/scenes';
import { ANIMALS, ANIMALS_BY_CONTINENT } from './data/animals';
import { HubGlobe } from './scenes/HubGlobe';
import { SceneContainer } from './scenes/Environments';
import { ChallengeRouter } from './scenes/ChallengeRouter';
import { KiwiNarrator } from './components/KiwiNarrator';
import { ProgressTracker } from './components/ProgressTracker';
import type { Difficulty, GamePhase } from './types';

interface WildFriendsGameProps {
  locale?: string;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'from-green-400 to-green-500 hover:from-green-500 hover:to-green-600',
  medium: 'from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500',
  hard: 'from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600',
};

const SCENE_COLORS: Record<string, string> = {
  africa: 'from-amber-400 to-orange-500',
  amazon: 'from-green-500 to-emerald-600',
  arctic: 'from-cyan-300 to-blue-400',
  australia: 'from-orange-400 to-red-500',
  ocean: 'from-blue-400 to-indigo-500',
};

export default function WildFriendsGame({ locale = 'en' }: WildFriendsGameProps) {
  const sounds = useRetroSounds();
  const [showInstructions, setShowInstructions] = useState(true);
  const game = useWildFriendsGame();
  const album = useAnimalAlbum();
  const progress = useSceneProgress();

  const currentScene = game.state.currentSceneId
    ? SCENE_BY_ID[game.state.currentSceneId]
    : null;

  const sceneAnimals = useMemo(() => {
    if (!currentScene) return [];
    return currentScene.animalIds
      .map((id) => ANIMALS[id])
      .filter(Boolean);
  }, [currentScene]);

  const currentAnimal = game.state.currentAnimalId
    ? ANIMALS[game.state.currentAnimalId]
    : null;

  // ─── Handlers ──────────────────────────────────────────
  const handleDifficultySelect = useCallback(
    (diff: Difficulty) => {
      sounds.playClick();
      game.startGame(diff);
    },
    [sounds, game]
  );

  const handleEnterScene = useCallback(
    (sceneId: string) => {
      sounds.playWhoosh();
      game.enterScene(sceneId);
    },
    [sounds, game]
  );

  const handleStartExploring = useCallback(() => {
    sounds.playClick();
    game.startExploring();
  }, [sounds, game]);

  const handleEncounterAnimal = useCallback(
    (animalId: string) => {
      sounds.playFlip();
      game.encounterAnimal(animalId);
    },
    [sounds, game]
  );

  const handleShowFact = useCallback(() => {
    sounds.playPowerUp();
    game.showFactCard();
  }, [sounds, game]);

  const handleStartChallenge = useCallback(() => {
    sounds.playClick();
    game.startChallenge();
  }, [sounds, game]);

  const handleCompleteChallenge = useCallback(() => {
    sounds.playSuccess();
    if (currentAnimal && currentScene) {
      album.addAnimal(currentAnimal.id, currentScene.id);
    }
    game.completeChallenge();
  }, [sounds, game, album, currentAnimal, currentScene]);

  const handleNextAnimal = useCallback(() => {
    sounds.playClick();
    game.nextAnimal(sceneAnimals.length);
  }, [sounds, game, sceneAnimals.length]);

  const handleSceneComplete = useCallback(() => {
    if (currentScene) {
      progress.completeScene(currentScene.id);
    }
    sounds.playLevelUp();
    if (progress.completedCount + 1 >= progress.totalScenes) {
      game.triggerFinale();
    } else {
      game.returnToHub();
    }
  }, [sounds, game, progress, currentScene]);

  const handleReturnToHub = useCallback(() => {
    sounds.playClick();
    game.returnToHub();
  }, [sounds, game]);

  const handlePlayAgain = useCallback(() => {
    sounds.playClick();
    album.resetAlbum();
    progress.resetProgress();
    game.resetGame();
  }, [sounds, game, album, progress]);

  // ─── Keyboard Navigation (US-020) ──────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { phase } = game.state;
      switch (e.key) {
        case 'Escape':
          if (phase !== 'menu' && phase !== 'hub') {
            handleReturnToHub();
          }
          break;
        case 'Enter':
        case ' ':
          if (phase === 'scene_intro') handleStartExploring();
          if (phase === 'scene_complete') handleSceneComplete();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.state, handleReturnToHub, handleStartExploring, handleSceneComplete]);

  // ─── Render Phase ──────────────────────────────────────

  const renderPhase = () => {
    switch (game.state.phase) {
      case 'menu':
        return renderMenu();
      case 'hub':
        return renderHub();
      case 'scene_intro':
        return renderSceneIntro();
      case 'exploring':
        return renderExploring();
      case 'animal_encounter':
        return renderAnimalEncounter();
      case 'fact_card':
        return renderFactCard();
      case 'challenge':
        return renderChallenge();
      case 'reward':
        return renderReward();
      case 'scene_complete':
        return renderSceneComplete();
      case 'grand_finale':
        return renderFinale();
      default:
        return renderMenu();
    }
  };

  // ─── Menu ──────────────────────────────────────────────

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-8xl"
      >
        🦜
      </motion.div>
      <h1 className="text-4xl font-bold text-green-700 drop-shadow-lg">
        {t(locale, 'title')}
      </h1>
      <p className="text-lg text-green-600">{t(locale, 'subtitle')}</p>

      <div className="w-full space-y-3 mt-4">
        <h2 className="text-xl font-bold text-center text-gray-700">
          {t(locale, 'difficultyTitle')}
        </h2>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
          <button
            key={diff}
            onClick={() => handleDifficultySelect(diff)}
            className={`w-full p-4 rounded-2xl text-white font-bold text-lg
              bg-gradient-to-r ${DIFFICULTY_COLORS[diff]}
              shadow-lg transition-all active:scale-95 touch-manipulation`}
          >
            {t(locale, `difficulty${diff.charAt(0).toUpperCase() + diff.slice(1)}`)}
          </button>
        ))}
      </div>
    </motion.div>
  );

  // ─── Hub (World Map) ───────────────────────────────────

  const renderHub = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 p-4 w-full max-w-lg mx-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-4xl">🦜</span>
        <div>
          <h2 className="text-2xl font-bold text-green-700">{t(locale, 'title')}</h2>
          <p className="text-sm text-green-600">
            {t(locale, 'completedCount').replace('{count}', String(album.discoveredCount))}
          </p>
        </div>
      </div>

      <ProgressTracker
        discovered={album.discoveredCount}
        total={album.totalCount}
        scenesCompleted={progress.completedCount}
        totalScenes={progress.totalScenes}
        label={t(locale, 'collection')}
      />

      {/* 3D Globe */}
      <HubGlobe
        completedScenes={progress.completedScenes}
        onSelectScene={handleEnterScene}
      />

      <p className="text-green-600 text-center text-sm">{t(locale, 'explore')}</p>

      {/* Continent buttons fallback */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
        {SCENES.map((scene) => {
          const completed = progress.isSceneCompleted(scene.id);
          return (
            <button
              key={scene.id}
              onClick={() => handleEnterScene(scene.id)}
              className={`relative p-3 rounded-xl text-white font-bold text-sm
                bg-gradient-to-br ${SCENE_COLORS[scene.id] ?? 'from-gray-400 to-gray-500'}
                shadow-md transition-all active:scale-95 touch-manipulation
                ${completed ? 'ring-2 ring-yellow-300' : ''}`}
            >
              <span className="text-xl">{scene.biome}</span>{' '}
              <span>{scene.continent[locale as keyof typeof scene.continent] ?? scene.continent.en}</span>
              {completed && <span className="ml-1">✅</span>}
            </button>
          );
        })}
      </div>

      <KiwiNarrator
        message={t(locale, 'kiwiWelcome')}
        autoHide={5000}
        position="bottom-center"
      />
    </motion.div>
  );

  // ─── Scene Intro ───────────────────────────────────────

  const renderSceneIntro = () => {
    if (!currentScene) return null;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto text-center"
      >
        <div className="text-6xl">{currentScene.biome}</div>
        <h2 className="text-3xl font-bold text-green-700">
          {currentScene.continent[locale as keyof typeof currentScene.continent] ?? currentScene.continent.en}
        </h2>
        <div className="bg-white/80 p-4 rounded-2xl shadow-md">
          <span className="text-3xl mr-2">🦜</span>
          <p className="text-lg text-gray-700 italic mt-2">
            &ldquo;{currentScene.storyIntro[locale as keyof typeof currentScene.storyIntro] ?? currentScene.storyIntro.en}&rdquo;
          </p>
        </div>
        <button
          onClick={handleStartExploring}
          className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500
            text-white font-bold text-xl rounded-2xl shadow-lg
            active:scale-95 transition-all touch-manipulation"
        >
          {t(locale, 'play')} 🌿
        </button>
        <button
          onClick={handleReturnToHub}
          className="text-green-600 underline text-sm"
        >
          {t(locale, 'backToGlobe')}
        </button>
      </motion.div>
    );
  };

  // ─── Exploring (3D scene + Animal Grid) ─────────────────

  const renderExploring = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto"
    >
      {currentScene && (
        <h2 className="text-xl font-bold text-green-700">
          {currentScene.continent[locale as keyof typeof currentScene.continent] ?? currentScene.continent.en}
        </h2>
      )}

      {/* 3D environment */}
      {currentScene && (
        <SceneContainer sceneId={currentScene.id} />
      )}

      <p className="text-green-600">{t(locale, 'discover')}</p>

      <div className="grid grid-cols-3 gap-4 w-full">
        {sceneAnimals.map((animal) => {
          const discovered = album.isDiscovered(animal.id);
          return (
            <motion.button
              key={animal.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !discovered && handleEncounterAnimal(animal.id)}
              className={`flex flex-col items-center p-4 rounded-2xl shadow-md
                transition-all touch-manipulation
                ${discovered
                  ? 'bg-green-100 border-2 border-green-300'
                  : 'bg-white hover:bg-yellow-50 border-2 border-dashed border-gray-300 animate-pulse'
                }`}
            >
              <span className="text-4xl">{discovered ? animal.emoji : '❓'}</span>
              <span className="text-sm mt-1 font-medium">
                {discovered
                  ? (animal.name[locale as keyof typeof animal.name] ?? animal.name.en)
                  : t(locale, 'tapAnimal')}
              </span>
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={handleReturnToHub}
        className="mt-4 text-green-600 underline text-sm"
      >
        {t(locale, 'backToGlobe')}
      </button>
    </motion.div>
  );

  // ─── Animal Encounter ──────────────────────────────────

  const renderAnimalEncounter = () => {
    if (!currentAnimal) return null;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto text-center"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl"
        >
          {currentAnimal.emoji}
        </motion.div>
        <h3 className="text-3xl font-bold text-green-700">
          {currentAnimal.name[locale as keyof typeof currentAnimal.name] ?? currentAnimal.name.en}
        </h3>

        <div className="bg-white/80 p-4 rounded-2xl shadow-md w-full">
          <span className="text-2xl">🦜</span>
          <p className="text-sm text-gray-600 mt-1">{t(locale, 'kiwiCelebrate')}</p>
        </div>

        <button
          onClick={handleShowFact}
          className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-500
            text-white font-bold rounded-2xl shadow-lg
            active:scale-95 transition-all touch-manipulation"
        >
          📖 {t(locale, 'nextAnimal')}
        </button>
      </motion.div>
    );
  };

  // ─── Fact Card ─────────────────────────────────────────

  const renderFactCard = () => {
    if (!currentAnimal) return null;
    return (
      <motion.div
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto"
      >
        <div className="bg-white rounded-3xl shadow-xl p-6 w-full text-center">
          <span className="text-6xl block mb-3">{currentAnimal.emoji}</span>
          <h3 className="text-2xl font-bold text-green-700">
            {currentAnimal.name[locale as keyof typeof currentAnimal.name] ?? currentAnimal.name.en}
          </h3>
          <div className="mt-4 bg-yellow-50 p-4 rounded-xl">
            <p className="text-lg">💡</p>
            <p className="text-gray-700">
              {currentAnimal.fact[locale as keyof typeof currentAnimal.fact] ?? currentAnimal.fact.en}
            </p>
          </div>
        </div>

        <button
          onClick={handleStartChallenge}
          className="px-6 py-3 bg-gradient-to-r from-orange-400 to-red-400
            text-white font-bold rounded-2xl shadow-lg
            active:scale-95 transition-all touch-manipulation"
        >
          🎮 {t(locale, 'play')}
        </button>
      </motion.div>
    );
  };

  // ─── Challenge (interactive mini-games via ChallengeRouter) ──

  const renderChallenge = () => {
    if (!currentAnimal) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto text-center"
      >
        <ChallengeRouter
          animal={currentAnimal}
          locale={locale}
          difficulty={game.state.difficulty}
          onComplete={handleCompleteChallenge}
        />
      </motion.div>
    );
  };

  // ─── Reward ────────────────────────────────────────────

  const renderReward = () => {
    if (!currentAnimal) return null;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: 3, duration: 0.5 }}
          className="text-7xl"
        >
          🌟
        </motion.div>
        <h3 className="text-2xl font-bold text-yellow-600">{t(locale, 'great')}</h3>
        <p className="text-gray-600">{t(locale, 'kiwiCelebrate')}</p>

        <div className="bg-green-100 p-4 rounded-2xl flex items-center gap-3">
          <span className="text-4xl">{currentAnimal.emoji}</span>
          <span className="font-bold text-green-700">
            {currentAnimal.name[locale as keyof typeof currentAnimal.name] ?? currentAnimal.name.en}
          </span>
          <span>→ 📖</span>
        </div>

        <button
          onClick={handleNextAnimal}
          className="px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-400
            text-white font-bold rounded-2xl shadow-lg
            active:scale-95 transition-all touch-manipulation"
        >
          {t(locale, 'nextAnimal')} →
        </button>
      </motion.div>
    );
  };

  // ─── Scene Complete ────────────────────────────────────

  const renderSceneComplete = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto text-center"
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 1 }}
        className="text-7xl"
      >
        🎉
      </motion.div>
      <h3 className="text-2xl font-bold text-green-700">{t(locale, 'sceneComplete')}</h3>

      <button
        onClick={handleSceneComplete}
        className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500
          text-white font-bold rounded-2xl shadow-lg
          active:scale-95 transition-all touch-manipulation"
      >
        {t(locale, 'backToGlobe')} 🌍
      </button>
    </motion.div>
  );

  // ─── Grand Finale ──────────────────────────────────────

  const renderFinale = () => {
    // Trigger victory sound on mount
    if (game.state.phase === 'grand_finale') {
      sounds.playWin();
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto text-center relative overflow-hidden"
      >
        {/* Confetti particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 400 - 200,
              y: -50,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: 600,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 1.5,
              repeat: Infinity,
              repeatDelay: Math.random() * 2,
            }}
            className="absolute text-2xl pointer-events-none"
            style={{ left: `${Math.random() * 100}%` }}
          >
            {['🎊', '🌟', '⭐', '✨', '🎉'][i % 5]}
          </motion.div>
        ))}

        {/* Kiwi flying victory lap */}
        <motion.div
          animate={{
            x: [0, 100, 0, -100, 0],
            y: [0, -30, -10, -30, 0],
            rotate: [0, 15, 0, -15, 0],
          }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="text-7xl"
        >
          🦜
        </motion.div>

        {/* Trophy */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl"
        >
          🏆
        </motion.div>
        <h2 className="text-3xl font-bold text-yellow-600">
          {t(locale, 'worldExplorer')}
        </h2>
        <p className="text-lg text-gray-700">{t(locale, 'congratulations')}</p>

        {/* All 15 animals with dance animations */}
        <div className="flex flex-wrap justify-center gap-2 my-4">
          {Object.values(ANIMALS).map((animal, i) => (
            <motion.span
              key={animal.id}
              animate={{
                y: [0, -8, 0],
                rotate: [0, i % 2 === 0 ? 10 : -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 1 + (i % 3) * 0.3,
                delay: i * 0.1,
              }}
              className="text-3xl"
            >
              {animal.emoji}
            </motion.span>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white/80 rounded-2xl p-4 shadow-md">
          <p className="text-sm text-gray-600">
            🐾 {album.discoveredCount}/{album.totalCount} {t(locale, 'collection')}
          </p>
          <p className="text-sm text-gray-600">
            🌍 {progress.completedCount}/{progress.totalScenes} Continents
          </p>
        </div>

        <button
          onClick={handlePlayAgain}
          className="px-8 py-4 bg-gradient-to-r from-purple-400 to-pink-500
            text-white font-bold text-xl rounded-2xl shadow-lg
            active:scale-95 transition-all touch-manipulation"
        >
          {t(locale, 'playAgain')} 🔄
        </button>
      </motion.div>
    );
  };

  // ─── Main Render ───────────────────────────────────────

  return (
    <GameWrapper
      title={t(locale, 'title')}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50 p-4">
        <AnimatePresence mode="wait">
          {renderPhase()}
        </AnimatePresence>
      </div>

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => {
          setShowInstructions(false);
          sounds.playClick();
        }}
        title={t(locale, 'instructionsTitle')}
        instructions={[
          {
            icon: '🦜',
            title: t(locale, 'instructionsStep1'),
            description: t(locale, 'instructionsStep2'),
          },
          {
            icon: '🎮',
            title: t(locale, 'instructionsStep3'),
            description: t(locale, 'instructionsStep4'),
          },
        ]}
        controls={[
          { icon: '👆', description: t(locale, 'controlsTouch') },
          { icon: '🖱️', description: t(locale, 'controlsMouse') },
          { icon: '⌨️', description: t(locale, 'controlsKeyboard') },
        ]}
        tip={t(locale, 'instructionsTip')}
        locale={locale}
      />
    </GameWrapper>
  );
}
