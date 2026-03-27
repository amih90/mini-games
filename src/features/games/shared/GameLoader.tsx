'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackGamePlay, trackGameSession } from '@/lib/gtag';

// Lazy load game components with loading states
const ColorMatchGame = dynamic(
  () => import('@/features/games/color-match/ColorMatchGame').then((mod) => mod.ColorMatchGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const MemoryCardsGame = dynamic(
  () => import('@/features/games/memory-cards/MemoryCardsGame').then((mod) => mod.MemoryCardsGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const FlappyBirdGame = dynamic(
  () => import('@/features/games/flappy-bird/FlappyBirdGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ChickenInvadersGame = dynamic(
  () => import('@/features/games/chicken-invaders/ChickenInvadersGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const TetrisGame = dynamic(
  () => import('@/features/games/tetris/TetrisGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const SnakeGame = dynamic(
  () => import('@/features/games/snake/SnakeGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const BrickBreakerGame = dynamic(
  () => import('@/features/games/brick-breaker/BrickBreakerGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const DinoRunGame = dynamic(
  () => import('@/features/games/dino-run/DinoRunGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const WhackAMoleGame = dynamic(
  () => import('@/features/games/whack-a-mole/WhackAMoleGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const PenaltyKickGame = dynamic(
  () => import('@/features/games/penalty-kick/PenaltyKickGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const SprintRaceGame = dynamic(
  () => import('@/features/games/sprint-race/SprintRaceGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const TowerDefenseGame = dynamic(
  () => import('@/features/games/tower-defense/TowerDefenseGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const CheckersGame = dynamic(
  () => import('@/features/games/checkers/CheckersGame').then((mod) => mod.CheckersGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ReversiGame = dynamic(
  () => import('@/features/games/reversi/ReversiGame').then((mod) => mod.ReversiGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ChessGame = dynamic(
  () => import('@/features/games/chess/ChessGame').then((mod) => mod.ChessGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const BackgammonGame = dynamic(
  () => import('@/features/games/backgammon/BackgammonGame').then((mod) => mod.BackgammonGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const PingPongGame = dynamic(
  () => import('@/features/games/ping-pong/PingPongGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const NascarCarsGame = dynamic(
  () => import('@/features/games/nascar-cars/NascarCarsGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ArmyRunnerGame = dynamic(
  () => import('@/features/games/army-runner/ArmyRunnerGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const PotionCraftGame = dynamic(
  () => import('@/features/games/potion-craft/PotionCraftGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const SprintRacePhaserGame = dynamic(
  () => import('@/features/games/sprint-race-phaser/SprintRacePhaserGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ColorMixGame = dynamic(
  () => import('@/features/games/color-mix/ColorMixGame').then((mod) => mod.ColorMixGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const FractionPizzaGame = dynamic(
  () => import('@/features/games/fraction-pizza/FractionPizzaGame').then((mod) => mod.FractionPizzaGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const LetterSoupGame = dynamic(
  () => import('@/features/games/letter-soup/LetterSoupGame').then((mod) => mod.LetterSoupGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const MatchPairsGame = dynamic(
  () => import('@/features/games/match-pairs/MatchPairsGame').then((mod) => mod.MatchPairsGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const MirrorDrawGame = dynamic(
  () => import('@/features/games/mirror-draw/MirrorDrawGame').then((mod) => mod.MirrorDrawGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const NumberMuncherGame = dynamic(
  () => import('@/features/games/number-muncher/NumberMuncherGame').then((mod) => mod.NumberMuncherGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const PatternMakerGame = dynamic(
  () => import('@/features/games/pattern-maker/PatternMakerGame').then((mod) => mod.PatternMakerGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const PlantGrowerGame = dynamic(
  () => import('@/features/games/plant-grower/PlantGrowerGame').then((mod) => mod.PlantGrowerGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const RhymeTimeGame = dynamic(
  () => import('@/features/games/rhyme-time/RhymeTimeGame').then((mod) => mod.RhymeTimeGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ShapeBuilderGame = dynamic(
  () => import('@/features/games/shape-builder/ShapeBuilderGame').then((mod) => mod.ShapeBuilderGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const SizeSorterGame = dynamic(
  () => import('@/features/games/size-sorter/SizeSorterGame').then((mod) => mod.SizeSorterGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const WeatherDressUpGame = dynamic(
  () => import('@/features/games/weather-dress-up/WeatherDressUpGame').then((mod) => mod.WeatherDressUpGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const BackgammonPhaserGame = dynamic(
  () => import('@/features/games/backgammon-phaser/BackgammonPhaserGame'),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const OddOneOutGame = dynamic(
  () => import('@/features/games/odd-one-out/OddOneOutGame').then((mod) => mod.OddOneOutGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ShadowMatchGame = dynamic(
  () => import('@/features/games/shadow-match/ShadowMatchGame').then((mod) => mod.ShadowMatchGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const CountingBubblesGame = dynamic(
  () => import('@/features/games/counting-bubbles/CountingBubblesGame').then((mod) => mod.CountingBubblesGame),
  {
    loading: () => <GameLoadingSkeleton />,
    ssr: false,
  }
);

const ShapeSorter3DGame = dynamic(
  () => import('@/features/games/shape-sorter-3d/ShapeSorter3DGame'),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const SolarSystem3DGame = dynamic(
  () => import('@/features/games/solar-system-3d/SolarSystem3DGame'),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const NumberTower3DGame = dynamic(
  () => import('@/features/games/number-tower-3d/NumberTower3DGame'),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const AnimalDiceGame = dynamic(
  () => import('@/features/games/animal-dice/AnimalDiceGame'),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

function GameLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-peach-glow-light via-white to-sky-bubble-light flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎮</div>
        <div className="text-2xl font-bold text-slate-600">Loading...</div>
      </div>
    </div>
  );
}

interface GameLoaderProps {
  slug: string;
}

export function GameLoader({ slug }: GameLoaderProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const sessionStart = useRef<number>(Date.now());

  useEffect(() => {
    sessionStart.current = Date.now();
    trackGamePlay(slug);

    return () => {
      const durationSec = (Date.now() - sessionStart.current) / 1000;
      if (durationSec >= 2) {
        trackGameSession(slug, durationSec);
      }
    };
  }, [slug]);

  switch (slug) {
    case 'color-match':
      return <ColorMatchGame />;
    case 'memory-cards':
      return <MemoryCardsGame />;
    case 'flappy-bird':
      return <FlappyBirdGame locale={locale} />;
    case 'chicken-invaders':
      return <ChickenInvadersGame locale={locale} />;
    case 'tetris':
      return <TetrisGame locale={locale} />;
    case 'snake':
      return <SnakeGame locale={locale} />;
    case 'brick-breaker':
      return <BrickBreakerGame locale={locale} />;
    case 'dino-run':
      return <DinoRunGame locale={locale} />;
    case 'whack-a-mole':
      return <WhackAMoleGame locale={locale} />;
    case 'penalty-kick':
      return <PenaltyKickGame locale={locale} />;
    case 'sprint-race':
      return <SprintRaceGame locale={locale} />;
    case 'tower-defense':
      return <TowerDefenseGame locale={locale} />;
    case 'checkers':
      return <CheckersGame />;
    case 'reversi':
      return <ReversiGame />;
    case 'chess':
      return <ChessGame />;
    case 'backgammon':
      return <BackgammonGame />;
    case 'ping-pong':
      return <PingPongGame locale={locale} />;
    case 'nascar-cars':
      return <NascarCarsGame locale={locale} />;
    case 'army-runner':
      return <ArmyRunnerGame locale={locale} />;
    case 'potion-craft':
      return <PotionCraftGame locale={locale} />;
    case 'sprint-race-phaser':
      return <SprintRacePhaserGame />;
    case 'color-mix':
      return <ColorMixGame />;
    case 'fraction-pizza':
      return <FractionPizzaGame />;
    case 'letter-soup':
      return <LetterSoupGame />;
    case 'match-pairs':
      return <MatchPairsGame />;
    case 'mirror-draw':
      return <MirrorDrawGame />;
    case 'number-muncher':
      return <NumberMuncherGame />;
    case 'pattern-maker':
      return <PatternMakerGame />;
    case 'plant-grower':
      return <PlantGrowerGame />;
    case 'rhyme-time':
      return <RhymeTimeGame />;
    case 'shape-builder':
      return <ShapeBuilderGame />;
    case 'size-sorter':
      return <SizeSorterGame />;
    case 'weather-dress-up':
      return <WeatherDressUpGame />;
    case 'backgammon-phaser':
      return <BackgammonPhaserGame />;
    case 'odd-one-out':
      return <OddOneOutGame />;
    case 'shadow-match':
      return <ShadowMatchGame />;
    case 'counting-bubbles':
      return <CountingBubblesGame />;
    case 'shape-sorter-3d':
      return <ShapeSorter3DGame locale={locale} />;
    case 'solar-system-3d':
      return <SolarSystem3DGame locale={locale} />;
    case 'number-tower-3d':
      return <NumberTower3DGame locale={locale} />;
    case 'animal-dice':
      return <AnimalDiceGame locale={locale} />;
    default:
      return null;
  }
}
