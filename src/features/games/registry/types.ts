export type GameCategory =
  | 'colors'
  | 'memory'
  | 'math'
  | 'reaction'
  | 'ages-3-5'
  | 'ages-6-8';

export type GameEngine = 'react' | 'phaser' | 'canvas' | 'r3f';

export interface AgeRange {
  min: number;
  max: number;
}

export interface GameTitle {
  en: string;
  he: string;
  zh?: string;
  es?: string;
}

export interface GameConfig {
  /** Unique identifier for the game, used in URLs */
  slug: string;
  /** Localized title object */
  title: GameTitle;
  /** Localized description object */
  description: GameTitle;
  /** Categories this game belongs to */
  categories: GameCategory[];
  /** Target age range */
  ageRange: AgeRange;
  /** Path to thumbnail image */
  thumbnail: string;
  /** Game rendering engine */
  engine: GameEngine;
  /** i18n namespace for game-specific translations */
  i18nNamespace: string;
}

export interface GameComponentProps {
  /** Callback when game is completed */
  onComplete?: () => void;
  /** Callback when player wants to play again */
  onPlayAgain?: () => void;
  /** Whether sound is enabled */
  soundEnabled?: boolean;
}
