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
    default:
      return null;
  }
}
