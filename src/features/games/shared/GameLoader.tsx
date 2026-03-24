'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

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

const ShapeBuilderGame = dynamic(
  () => import('@/features/games/shape-builder/ShapeBuilderGame').then((mod) => mod.ShapeBuilderGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const PatternMakerGame = dynamic(
  () => import('@/features/games/pattern-maker/PatternMakerGame').then((mod) => mod.PatternMakerGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const NumberMuncherGame = dynamic(
  () => import('@/features/games/number-muncher/NumberMuncherGame').then((mod) => mod.NumberMuncherGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const RhymeTimeGame = dynamic(
  () => import('@/features/games/rhyme-time/RhymeTimeGame').then((mod) => mod.RhymeTimeGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const LetterSoupGame = dynamic(
  () => import('@/features/games/letter-soup/LetterSoupGame').then((mod) => mod.LetterSoupGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const SizeSorterGame = dynamic(
  () => import('@/features/games/size-sorter/SizeSorterGame').then((mod) => mod.SizeSorterGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const WeatherDressUpGame = dynamic(
  () => import('@/features/games/weather-dress-up/WeatherDressUpGame').then((mod) => mod.WeatherDressUpGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const PlantGrowerGame = dynamic(
  () => import('@/features/games/plant-grower/PlantGrowerGame').then((mod) => mod.PlantGrowerGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const FractionPizzaGame = dynamic(
  () => import('@/features/games/fraction-pizza/FractionPizzaGame').then((mod) => mod.FractionPizzaGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const MirrorDrawGame = dynamic(
  () => import('@/features/games/mirror-draw/MirrorDrawGame').then((mod) => mod.MirrorDrawGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

const MatchPairsGame = dynamic(
  () => import('@/features/games/match-pairs/MatchPairsGame').then((mod) => mod.MatchPairsGame),
  { loading: () => <GameLoadingSkeleton />, ssr: false }
);

function GameLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-peach-glow-light via-white to-sky-bubble-light flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎮</div>
        <div className="flex justify-center gap-1">
          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
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
    case 'sprint-race-phaser':
      return <SprintRacePhaserGame />;
    case 'color-mix':
      return <ColorMixGame />;
    case 'shape-builder':
      return <ShapeBuilderGame />;
    case 'pattern-maker':
      return <PatternMakerGame />;
    case 'number-muncher':
      return <NumberMuncherGame />;
    case 'rhyme-time':
      return <RhymeTimeGame />;
    case 'letter-soup':
      return <LetterSoupGame />;
    case 'size-sorter':
      return <SizeSorterGame />;
    case 'weather-dress-up':
      return <WeatherDressUpGame />;
    case 'plant-grower':
      return <PlantGrowerGame />;
    case 'fraction-pizza':
      return <FractionPizzaGame />;
    case 'mirror-draw':
      return <MirrorDrawGame />;
    case 'match-pairs':
      return <MatchPairsGame />;
    default:
      return null;
  }
}
