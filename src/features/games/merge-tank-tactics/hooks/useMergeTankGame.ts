'use client';

import { useReducer, useCallback } from 'react';
import {
  GameState,
  GamePhase,
  Difficulty,
  Tank,
  TankType,
  TankOwner,
  AttackEvent,
  BattleRound,
  DifficultySettings,
} from '../types';
import { getTankStats, getTankCost } from '../data/tankStats';
import { STAGES, STAGE_REWARDS } from '../data/stages';

// ─── Difficulty settings ───────────────────────────────────────────────────

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy:   { startGold: 200, enemyHpMult: 0.7,  stagesNeeded: 5  },
  medium: { startGold: 150, enemyHpMult: 1.0,  stagesNeeded: 8  },
  hard:   { startGold: 100, enemyHpMult: 1.5,  stagesNeeded: 12 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return `t${++_uid}`; }

function createTank(
  type: TankType,
  level: number,
  col: number,
  row: number,
  owner: TankOwner,
  hpMult = 1,
): Tank {
  const stats = getTankStats(type, level);
  const hp = Math.round(stats.hp * hpMult);
  return {
    id: uid(),
    type,
    level,
    hp,
    maxHp: hp,
    atk: stats.atk,
    def: stats.def,
    range: stats.range,
    col,
    row,
    owner,
    isAlive: true,
  };
}

function cloneTank(t: Tank): Tank { return { ...t }; }

function findTarget(attacker: Tank, enemies: Tank[]): Tank | null {
  const alive = enemies.filter(t => t.isAlive);
  if (!alive.length) return null;

  // Column-range filtering: melee=±1, range=±3 (covers all cols)
  const inRange = alive.filter(e => Math.abs(e.col - attacker.col) <= attacker.range);
  const pool = inRange.length > 0 ? inRange : alive;

  // Prefer row 0 (front row of the opponent's grid)
  pool.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return Math.abs(a.col - attacker.col) - Math.abs(b.col - attacker.col);
  });

  return pool[0];
}

export function simulateBattle(playerTanks: Tank[], enemyTanks: Tank[]): BattleRound[] {
  let players = playerTanks.map(cloneTank);
  let enemies = enemyTanks.map(cloneTank);
  const rounds: BattleRound[] = [];
  let safety = 60;

  while (
    players.some(t => t.isAlive) &&
    enemies.some(t => t.isAlive) &&
    safety-- > 0
  ) {
    const playerAttacks: AttackEvent[] = [];
    const enemyAttacks: AttackEvent[] = [];

    // Player attacks
    for (const attacker of players.filter(t => t.isAlive)) {
      const target = findTarget(attacker, enemies);
      if (!target) continue;
      const damage = Math.max(1, attacker.atk - target.def);
      target.hp -= damage;
      if (target.hp <= 0) { target.hp = 0; target.isAlive = false; }
      playerAttacks.push({
        id: `pa-${attacker.id}-${target.id}-${rounds.length}`,
        attackerId: attacker.id,
        targetId: target.id,
        damage,
        killedTarget: !target.isAlive,
      });
    }

    // Enemy attacks (against still-alive players)
    for (const attacker of enemies.filter(t => t.isAlive)) {
      const target = findTarget(attacker, players);
      if (!target) continue;
      const damage = Math.max(1, attacker.atk - target.def);
      target.hp -= damage;
      if (target.hp <= 0) { target.hp = 0; target.isAlive = false; }
      enemyAttacks.push({
        id: `ea-${attacker.id}-${target.id}-${rounds.length}`,
        attackerId: attacker.id,
        targetId: target.id,
        damage,
        killedTarget: !target.isAlive,
      });
    }

    // Snapshot state after round
    const tankStates: BattleRound['tankStates'] = {};
    for (const t of [...players, ...enemies]) {
      tankStates[t.id] = { hp: t.hp, isAlive: t.isAlive };
    }
    rounds.push({ playerAttacks, enemyAttacks, tankStates });
  }

  return rounds;
}

function buildEnemyTanks(stage: number, hpMult: number): Tank[] {
  const idx = Math.min(stage - 1, STAGES.length - 1);
  return STAGES[idx].map(f => createTank(f.type, f.level, f.col, f.row, 'enemy', hpMult));
}

function buildInitialState(difficulty: Difficulty): GameState {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  return {
    phase: 'prep',
    difficulty,
    stage: 1,
    gold: settings.startGold,
    purchaseCount: 0,
    playerTanks: [],
    enemyTanks: buildEnemyTanks(1, settings.enemyHpMult),
    selectedTankId: null,
    pendingTankType: null,
    result: null,
    stagesWon: 0,
    totalStagesNeeded: settings.stagesNeeded,
    reward: 0,
    initialBattlePlayerTanks: [],
    initialBattleEnemyTanks: [],
    battleLog: [],
  };
}

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'BUY_TANK'; tankType: TankType }
  | { type: 'CANCEL_PENDING' }
  | { type: 'PLACE_TANK'; col: number; row: number }
  | { type: 'SELECT_TANK'; id: string | null }
  | { type: 'MOVE_TANK'; id: string; col: number; row: number }
  | { type: 'MERGE_TANKS'; sourceId: string; targetId: string }
  | { type: 'START_BATTLE' }
  | { type: 'END_BATTLE'; result: 'win' | 'lose' }
  | { type: 'NEXT_STAGE' }
  | { type: 'RESET'; difficulty: Difficulty };

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'BUY_TANK': {
      const cost = getTankCost(state.purchaseCount);
      if (state.gold < cost) return state;
      return {
        ...state,
        gold: state.gold - cost,
        purchaseCount: state.purchaseCount + 1,
        pendingTankType: action.tankType,
        selectedTankId: null,
      };
    }

    case 'CANCEL_PENDING': {
      // Refund last purchase
      const refund = getTankCost(state.purchaseCount - 1);
      return {
        ...state,
        gold: state.gold + refund,
        purchaseCount: Math.max(0, state.purchaseCount - 1),
        pendingTankType: null,
      };
    }

    case 'PLACE_TANK': {
      if (!state.pendingTankType) return state;
      const occupied = state.playerTanks.some(t => t.col === action.col && t.row === action.row && t.isAlive);
      if (occupied) return state;
      const tank = createTank(state.pendingTankType, 1, action.col, action.row, 'player');
      return {
        ...state,
        playerTanks: [...state.playerTanks, tank],
        pendingTankType: null,
      };
    }

    case 'SELECT_TANK': {
      return { ...state, selectedTankId: action.id, pendingTankType: null };
    }

    case 'MOVE_TANK': {
      const occupied = state.playerTanks.some(
        t => t.id !== action.id && t.col === action.col && t.row === action.row && t.isAlive
      );
      if (occupied) return state;
      return {
        ...state,
        selectedTankId: null,
        playerTanks: state.playerTanks.map(t =>
          t.id === action.id ? { ...t, col: action.col, row: action.row } : t
        ),
      };
    }

    case 'MERGE_TANKS': {
      const src = state.playerTanks.find(t => t.id === action.sourceId);
      const tgt = state.playerTanks.find(t => t.id === action.targetId);
      if (!src || !tgt) return state;
      if (src.type !== tgt.type || src.level !== tgt.level) return state;
      if (src.level >= 5) return state;

      const newLevel = src.level + 1;
      const merged = createTank(tgt.type, newLevel, tgt.col, tgt.row, 'player');
      return {
        ...state,
        selectedTankId: null,
        playerTanks: [
          ...state.playerTanks.filter(t => t.id !== action.sourceId && t.id !== action.targetId),
          merged,
        ],
      };
    }

    case 'START_BATTLE': {
      if (!state.playerTanks.some(t => t.isAlive)) return state;
      const battleLog = simulateBattle(state.playerTanks, state.enemyTanks);
      return {
        ...state,
        phase: 'battle',
        selectedTankId: null,
        pendingTankType: null,
        initialBattlePlayerTanks: state.playerTanks.map(cloneTank),
        initialBattleEnemyTanks: state.enemyTanks.map(cloneTank),
        battleLog,
      };
    }

    case 'END_BATTLE': {
      const stagesWon = action.result === 'win' ? state.stagesWon + 1 : state.stagesWon;
      const idx = Math.min(state.stage - 1, STAGE_REWARDS.length - 1);
      const reward = action.result === 'win' ? STAGE_REWARDS[idx] : 0;
      return {
        ...state,
        phase: 'result',
        result: action.result,
        stagesWon,
        reward,
      };
    }

    case 'NEXT_STAGE': {
      const settings = DIFFICULTY_SETTINGS[state.difficulty];
      const nextStage = state.result === 'win' ? state.stage + 1 : state.stage;
      return {
        ...buildInitialState(state.difficulty),
        gold: state.gold + state.reward,
        stage: nextStage,
        stagesWon: state.stagesWon,
        enemyTanks: buildEnemyTanks(nextStage, settings.enemyHpMult),
        purchaseCount: 0,
      };
    }

    case 'RESET': {
      return buildInitialState(action.difficulty);
    }

    default:
      return state;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useMergeTankGame(initialDifficulty: Difficulty = 'medium') {
  const [state, dispatch] = useReducer(reducer, initialDifficulty, buildInitialState);

  const buyTank      = useCallback((tankType: TankType) => dispatch({ type: 'BUY_TANK', tankType }), []);
  const cancelPending = useCallback(() => dispatch({ type: 'CANCEL_PENDING' }), []);
  const placeTank    = useCallback((col: number, row: number) => dispatch({ type: 'PLACE_TANK', col, row }), []);
  const selectTank   = useCallback((id: string | null) => dispatch({ type: 'SELECT_TANK', id }), []);
  const moveTank     = useCallback((id: string, col: number, row: number) => dispatch({ type: 'MOVE_TANK', id, col, row }), []);
  const mergeTanks   = useCallback((sourceId: string, targetId: string) => dispatch({ type: 'MERGE_TANKS', sourceId, targetId }), []);
  const startBattle  = useCallback(() => dispatch({ type: 'START_BATTLE' }), []);
  const endBattle    = useCallback((result: 'win' | 'lose') => dispatch({ type: 'END_BATTLE', result }), []);
  const nextStage    = useCallback(() => dispatch({ type: 'NEXT_STAGE' }), []);
  const resetGame    = useCallback((difficulty: Difficulty) => dispatch({ type: 'RESET', difficulty }), []);

  /** Get all tanks with HP updated to a specific battle round snapshot */
  const getTanksAtRound = useCallback(
    (round: number): Tank[] => {
      const all = [...state.initialBattlePlayerTanks, ...state.initialBattleEnemyTanks];
      if (round === 0 || !state.battleLog.length) return all;
      const snap = state.battleLog[Math.min(round - 1, state.battleLog.length - 1)].tankStates;
      return all.map(t => ({
        ...t,
        hp: snap[t.id]?.hp ?? t.hp,
        isAlive: snap[t.id]?.isAlive ?? t.isAlive,
      }));
    },
    [state.initialBattlePlayerTanks, state.initialBattleEnemyTanks, state.battleLog]
  );

  return {
    state,
    buyTank,
    cancelPending,
    placeTank,
    selectTank,
    moveTank,
    mergeTanks,
    startBattle,
    endBattle,
    nextStage,
    resetGame,
    getTanksAtRound,
  };
}
