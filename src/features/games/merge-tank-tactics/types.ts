export type TankType = 'melee' | 'range';
export type GamePhase = 'setup' | 'prep' | 'battle' | 'result';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TankOwner = 'player' | 'enemy';
export type BattleEnvironment = 'desert_storm' | 'european_theater' | 'arctic_front' | 'urban_rubble' | 'night_battle';
export type CameraMode = 'prep' | 'battle_start' | 'attack' | 'explosion' | 'victory' | 'overview';

export interface Tank {
  id: string;
  type: TankType;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  range: number;
  col: number;
  row: number;
  owner: TankOwner;
  isAlive: boolean;
}

export interface AttackEvent {
  id: string;
  attackerId: string;
  targetId: string;
  damage: number;
  killedTarget: boolean;
}

export interface BattleRound {
  playerAttacks: AttackEvent[];
  enemyAttacks: AttackEvent[];
  /** hp / isAlive snapshot after this round resolves */
  tankStates: Record<string, { hp: number; isAlive: boolean }>;
}

export interface DifficultySettings {
  startGold: number;
  enemyHpMult: number;
  stagesNeeded: number;
}

export interface EnemyFormation {
  type: TankType;
  level: number;
  col: number;
  row: number;
}

export interface GameState {
  phase: GamePhase;
  difficulty: Difficulty;
  stage: number;
  gold: number;
  purchaseCount: number;
  playerTanks: Tank[];
  enemyTanks: Tank[];
  selectedTankId: string | null;
  pendingTankType: TankType | null;
  result: 'win' | 'lose' | null;
  stagesWon: number;
  totalStagesNeeded: number;
  reward: number;
  /** Snapshot of tanks when battle started (for replaying HP) */
  initialBattlePlayerTanks: Tank[];
  initialBattleEnemyTanks: Tank[];
  battleLog: BattleRound[];
}
