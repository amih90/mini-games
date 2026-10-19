import { difficultySettings, elementalPercent, GRID_HEIGHT, GRID_WIDTH, MAX_ROSTER, MAX_STAGE, MAX_TEAM,
  allSpeciesIds, easyEncounters, encounterSpeciesIds, evolutions, potionPrices, speciesCatalog, speciesIds, trainingCost, victoryReward } from './data';
import type { Cell, Checkpoint, Difficulty, GameAction, GameState, LoadResult, Move, SpeciesId,
  TransitionResult, Unit } from './types';

export type { Cell, Difficulty, GameAction, GameState, Move, Unit } from './types';
export { speciesCatalog, trainingCost } from './data';
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const inside = (c: Cell) => !!c && Number.isInteger(c.x) && Number.isInteger(c.y) &&
  c.x >= 0 && c.x < GRID_WIDTH && c.y >= 0 && c.y < GRID_HEIGHT;
export const distance = (a: Cell, b: Cell): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const campPhase = (s: GameState) => s.phase === 'camp' || s.phase === 'deployment';
const nextSeed = (seed: number) => (Math.imul(seed, 1664525) + 1013904223) >>> 0;

export function createCampaign(difficulty: Difficulty = 'medium', seed = 12345): GameState {
  return { version: 1, phase: 'camp', difficulty, stage: 1, gold: 500,
    potions: { healingPotion: 0, revivePotion: 0 }, roster: [], deployment: {},
    battleUnits: [], blockedCells: [], initiative: [], activeId: null, cycle: 0,
    moved: false, waitedIds: [], seed: seed >>> 0, nextId: 1, checkpoint: null, rewardedStages: [] };
}
function makeUnit(species: SpeciesId, id: string, owner: Unit['owner'], level = 1, percent = 100): Unit {
  const base = speciesCatalog[species];
  const stat = (n: number, growth: number) => Math.max(1, Math.floor((n + (level - 1) * growth) * percent / 100));
  const maxHp = stat(base.maxHp, 10);
  return { id, species, owner, level, hp: maxHp, maxHp, energy: 12, maxEnergy: 24,
    attack: stat(base.attack, 3), defense: stat(base.defense, 2), speed: base.speed + level - 1,
    movement: base.movement, cooldowns: {}, statuses: [], defending: false, position: null };
}
export function generateEnemies(stage: number, difficulty: Difficulty): Unit[] {
  const easy = difficulty === 'easy' ? easyEncounters[stage - 1] : undefined;
  const count = easy?.count ?? Math.min(6, 1 + Math.ceil(stage / 2));
  return Array.from({ length: count }, (_, i) => {
    const species = encounterSpeciesIds[(stage * 2 + i * 3 + Math.floor(i / 2)) % encounterSpeciesIds.length];
    const level = easy?.level ?? Math.min(5, 1 + Math.floor((stage - 1) / 3));
    const unit = makeUnit(species, `enemy-${stage}-${i}`, 'enemy', level,
      difficultySettings[difficulty].enemyPercent + (stage === 10 && difficulty !== 'easy' ? 25 : 0));
    unit.position = { x: 9 + i % 2, y: 1 + i };
    return unit;
  });
}
export function getActiveUnit(state: GameState): Unit | undefined {
  return state.battleUnits.find(u => u.id === state.activeId && u.hp > 0);
}
export function getUnitMoves(unit: Unit): readonly Move[] { return speciesCatalog[unit.species].moves; }
export function getMove(unit: Unit, moveId: string): Move | undefined {
  return getUnitMoves(unit).find(m => m.id === moveId);
}
function occupied(state: GameState, c: Cell, id: string): boolean {
  return state.blockedCells.some(b => sameCell(b, c)) ||
    state.battleUnits.some(u => u.id !== id && u.hp > 0 && u.position && sameCell(u.position, c));
}
function neighbors(state: GameState, cell: Cell, id: string): Cell[] {
  const cells: Cell[] = [];
  for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
    if (!x && !y) continue;
    const target = { x: cell.x + x, y: cell.y + y };
    if (!inside(target) || occupied(state, target, id)) continue;
    if (x && y && (occupied(state, { x: cell.x + x, y: cell.y }, id) ||
      occupied(state, { x: cell.x, y: cell.y + y }, id))) continue;
    cells.push(target);
  }
  return cells;
}
export function getMovementAllowance(unit: Unit): number {
  return Math.max(0, unit.movement - (unit.statuses.some(s => s.kind === 'slow') ? 1 : 0));
}
export function getReachableCells(state: GameState, id: string): Cell[] {
  const unit = state.battleUnits.find(u => u.id === id);
  if (state.phase !== 'battle' || !unit?.position || unit.hp <= 0 || id !== state.activeId || state.moved) return [];
  const queue = [{ cell: unit.position, steps: 0 }];
  const seen = new Set([`${unit.position.x},${unit.position.y}`]);
  const result: Cell[] = [];
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (item.steps >= getMovementAllowance(unit)) continue;
    for (const cell of neighbors(state, item.cell, id)) {
      const key = `${cell.x},${cell.y}`;
      if (seen.has(key)) continue;
      seen.add(key); result.push(cell); queue.push({ cell, steps: item.steps + 1 });
    }
  }
  return result;
}
export function getDamagePreview(state: GameState, source: Unit | string, target: Unit | string, move: Move | string): number {
  const a = typeof source === 'string' ? state.battleUnits.find(u => u.id === source) : source;
  const b = typeof target === 'string' ? state.battleUnits.find(u => u.id === target) : target;
  const m = typeof move === 'string' ? a && getMove(a, move) : move;
  if (!a || !b || !m || m.kind !== 'damage') return 0;
  const raw = Math.max(1, m.power + a.attack - Math.floor(b.defense / 2));
  return Math.max(1, Math.floor(raw * elementalPercent(m.element, speciesCatalog[b.species].element) / 100 *
    (b.defending ? 0.5 : 1)));
}
function syncRoster(state: GameState) {
  state.roster = state.roster.map(unit => {
    const battle = state.battleUnits.find(b => b.id === unit.id);
    return battle ? { ...copy(battle), position: null } : unit;
  });
}
function trainUnit(unit: Unit) {
  unit.level++; unit.maxHp += 10;
  if (unit.hp > 0) unit.hp += 10;
  unit.attack += 3; unit.defense += 2; unit.speed++;
}
function outcome(state: GameState): boolean {
  const playerAlive = state.battleUnits.some(u => u.owner === 'player' && u.hp > 0);
  const enemyAlive = state.battleUnits.some(u => u.owner === 'enemy' && u.hp > 0);
  if (playerAlive && enemyAlive) return false;
  syncRoster(state);
  state.activeId = null; state.initiative = [];
  if (!playerAlive) state.phase = 'defeat';
  else {
    if (!state.rewardedStages.includes(state.stage)) {
      state.gold += victoryReward(state.stage, state.difficulty);
      if (state.difficulty === 'easy' && state.stage % 2 === 0) {
        for (const unit of state.battleUnits) if (unit.owner === 'player' && unit.level < 5) trainUnit(unit);
        syncRoster(state);
      }
      state.rewardedStages.push(state.stage);
    }
    state.phase = state.stage === MAX_STAGE ? 'complete' : 'victory';
    state.checkpoint = null;
  }
  return true;
}
function newCycle(state: GameState) {
  state.cycle++; state.waitedIds = [];
  const ties = new Map<string, number>();
  const living = state.battleUnits.filter(u => u.hp > 0);
  for (const u of living) { state.seed = nextSeed(state.seed); ties.set(u.id, state.seed); }
  state.initiative = living.sort((a, b) => b.speed - a.speed ||
    ties.get(a.id)! - ties.get(b.id)! || a.id.localeCompare(b.id)).map(u => u.id);
}
function activate(state: GameState) {
  while (state.phase === 'battle') {
    if (outcome(state)) return;
    if (!state.initiative.length) newCycle(state);
    const unit = state.battleUnits.find(u => u.id === state.initiative[0]);
    if (!unit || unit.hp <= 0) { state.initiative.shift(); continue; }
    state.activeId = unit.id;
    // A waited turn resumes the same activation, rather than ticking resources twice.
    if (!state.waitedIds.includes(unit.id)) {
      state.moved = false; unit.defending = false;
      for (const key of Object.keys(unit.cooldowns)) unit.cooldowns[key] = Math.max(0, unit.cooldowns[key] - 1);
      for (const status of unit.statuses) if (status.kind === 'burn') {
        unit.hp = Math.max(0, unit.hp - 4); status.remaining--;
      }
      unit.statuses = unit.statuses.filter(s => s.remaining > 0);
    } else state.moved = false;
    syncRoster(state);
    if (outcome(state)) return;
    if (unit.hp <= 0) { state.initiative.shift(); continue; }
    return;
  }
}
function finishActivation(state: GameState) {
  const unit = getActiveUnit(state);
  if (unit) {
    for (const status of unit.statuses) if (status.kind === 'slow') status.remaining--;
    unit.statuses = unit.statuses.filter(s => s.remaining > 0);
  }
  state.initiative.shift(); state.activeId = null; state.moved = false;
  syncRoster(state);
  if (!outcome(state)) activate(state);
}
function snapshot(state: GameState): Checkpoint {
  return copy({ gold: state.gold, potions: state.potions, roster: state.roster,
    deployment: state.deployment, stage: state.stage, seed: state.seed, nextId: state.nextId });
}
function clearBattle(state: GameState) {
  state.battleUnits = []; state.initiative = []; state.activeId = null; state.cycle = 0;
  state.moved = false; state.waitedIds = [];
}
function campRecovery(state: GameState) {
  for (const unit of state.roster) {
    unit.energy = Math.min(unit.maxEnergy, unit.energy + Math.ceil(unit.maxEnergy / 4));
    unit.cooldowns = {}; unit.statuses = []; unit.defending = false;
  }
}
function validDeployment(state: GameState): boolean {
  const entries = Object.entries(state.deployment);
  return entries.length >= 1 && entries.length <= MAX_TEAM && entries.every(([id, cell], i) =>
    inside(cell) && cell.x <= 3 && !state.blockedCells.some(b => sameCell(b, cell)) &&
    !!state.roster.find(u => u.id === id && u.hp > 0) &&
    !entries.slice(0, i).some(([, other]) => sameCell(cell, other)));
}
export function transition(original: GameState, action: GameAction): TransitionResult {
  const fail = (error: string): TransitionResult => ({ state: original, error });
  if (!record(action) || typeof action.type !== 'string') return fail('invalidAction');
  const state = copy(original);
  if (action.type === 'reset') {
    if (!['easy', 'medium', 'hard'].includes(action.difficulty)) return fail('invalidDifficulty');
    return { state: createCampaign(action.difficulty) };
  }
  switch (action.type) {
    case 'buyCreature': {
      if (!campPhase(state)) return fail('campOnly');
      if (!speciesIds.some(id => id === action.species)) return fail('invalidSpecies');
      const species = speciesCatalog[action.species];
      if (state.roster.length >= MAX_ROSTER) return fail('rosterFull');
      if (state.gold < species.price) return fail('insufficientGold');
      state.gold -= species.price;
      state.roster.push(makeUnit(action.species, `player-${state.nextId++}`, 'player'));
      break;
    }
    case 'buyPotion': {
      if (!campPhase(state)) return fail('campOnly');
      if (!['healingPotion', 'revivePotion'].includes(action.potion)) return fail('invalidPotion');
      const price = potionPrices[action.potion];
      if (state.gold < price) return fail('insufficientGold');
      state.gold -= price; state.potions[action.potion]++;
      break;
    }
    case 'train': {
      if (!campPhase(state)) return fail('campOnly');
      const unit = state.roster.find(u => u.id === action.unitId);
      if (!unit) return fail('invalidUnit');
      if (unit.hp <= 0) return fail('unitKO');
      if (unit.level >= 5) return fail('maxLevel');
      const cost = trainingCost(unit.level);
      if (state.gold < cost) return fail('insufficientGold');
      state.gold -= cost; trainUnit(unit);
      break;
    }
    case 'evolve': {
      if (!campPhase(state)) return fail('campOnly');
      const unit = state.roster.find(u => u.id === action.unitId);
      if (!unit) return fail('invalidUnit');
      if (unit.hp <= 0) return fail('unitKO');
      const evolution = evolutions[unit.species];
      if (!evolution) return fail('fullyEvolved');
      if (state.gold < evolution.cost) return fail('insufficientGold');
      const before = speciesCatalog[unit.species], after = speciesCatalog[evolution.species];
      state.gold -= evolution.cost;
      unit.species = evolution.species;
      unit.maxHp += after.maxHp - before.maxHp;
      unit.hp += after.maxHp - before.maxHp;
      unit.attack += after.attack - before.attack;
      unit.defense += after.defense - before.defense;
      unit.speed += after.speed - before.speed;
      unit.movement = after.movement;
      unit.maxEnergy += 8;
      break;
    }
    case 'rest':
      if (!campPhase(state)) return fail('campOnly');
      if (state.difficulty !== 'easy') return fail('easyOnly');
      for (const unit of state.roster) {
        unit.hp = unit.maxHp; unit.energy = unit.maxEnergy;
        unit.cooldowns = {}; unit.statuses = []; unit.defending = false;
      }
      break;
    case 'prepareBattle':
      if (!campPhase(state)) return fail('campOnly');
      state.phase = 'deployment'; break;
    case 'deploy': {
      if (!campPhase(state)) return fail('campOnly');
      const unit = state.roster.find(u => u.id === action.unitId);
      if (!unit) return fail('invalidUnit');
      if (unit.hp <= 0) return fail('unitKO');
      if (!inside(action.position) || action.position.x > 3 ||
        state.blockedCells.some(b => sameCell(b, action.position))) return fail('invalidPlacement');
      if (Object.entries(state.deployment).some(([id, c]) => id !== unit.id && sameCell(c, action.position))) return fail('occupiedCell');
      if (!state.deployment[unit.id] && Object.keys(state.deployment).length >= MAX_TEAM) return fail('teamFull');
      state.deployment[unit.id] = copy(action.position); break;
    }
    case 'bench':
      if (!campPhase(state)) return fail('campOnly');
      if (!state.roster.some(u => u.id === action.unitId)) return fail('invalidUnit');
      delete state.deployment[action.unitId]; break;
    case 'startBattle': {
      if (!campPhase(state)) return fail('campOnly');
      if (!validDeployment(state)) return fail('invalidDeployment');
      state.checkpoint = snapshot(state); state.phase = 'battle';
      state.battleUnits = state.roster.filter(u => state.deployment[u.id]).map(u =>
        ({ ...copy(u), position: copy(state.deployment[u.id]), statuses: [], cooldowns: {}, defending: false }));
      state.battleUnits.push(...generateEnemies(state.stage, state.difficulty));
      if (state.battleUnits.some(u => u.position && state.blockedCells.some(c => sameCell(c, u.position!)))) return fail('invalidPlacement');
      state.initiative = []; state.cycle = 0; state.waitedIds = []; activate(state); break;
    }
    case 'usePotion': {
      if (!['healingPotion', 'revivePotion'].includes(action.potion)) return fail('invalidPotion');
      if (state.phase !== 'battle' && !campPhase(state)) return fail('campOnly');
      if (state.potions[action.potion] <= 0) return fail('noPotion');
      const inBattle = state.phase === 'battle';
      if (inBattle && action.potion === 'revivePotion') return fail('reviveCampOnly');
      const active = getActiveUnit(state);
      if (inBattle && active?.owner !== 'player') return fail('notPlayerTurn');
      const target = (inBattle ? state.battleUnits : state.roster).find(u => u.id === action.targetId && u.owner === 'player');
      if (!target) return fail('invalidTarget');
      if (action.potion === 'healingPotion') {
        if (target.hp <= 0) return fail('unitKO');
        if (target.hp >= target.maxHp) return fail('alreadyHealthy');
        if (inBattle && (!active?.position || !target.position || distance(active.position, target.position) > 3)) return fail('outOfRange');
        target.hp = Math.min(target.maxHp, target.hp + 35);
      } else {
        if (target.hp > 0) return fail('unitAlive');
        target.hp = Math.max(1, Math.floor(target.maxHp * 0.35));
      }
      state.potions[action.potion]--;
      if (inBattle) finishActivation(state); break;
    }
    case 'move': {
      if (state.phase !== 'battle') return fail('battleOnly');
      const active = getActiveUnit(state);
      if (!active) return fail('noActiveUnit');
      if (state.moved) return fail('alreadyMoved');
      if (!inside(action.position)) return fail('unreachableCell');
      if (!getReachableCells(state, active.id).some(c => sameCell(c, action.position))) return fail('unreachableCell');
      active.position = copy(action.position); state.moved = true; syncRoster(state); break;
    }
    case 'useMove': {
      if (state.phase !== 'battle') return fail('battleOnly');
      const active = getActiveUnit(state);
      if (!active) return fail('noActiveUnit');
      const move = getMove(active, action.moveId);
      const target = state.battleUnits.find(u => u.id === action.targetId && u.hp > 0);
      if (!move) return fail('invalidMove');
      if (!target || (move.kind === 'heal' ? active.owner !== target.owner : active.owner === target.owner)) return fail('invalidTarget');
      if (!active.position || !target.position || distance(active.position, target.position) > move.range) return fail('outOfRange');
      if (active.energy < move.energy) return fail('insufficientEnergy');
      if ((active.cooldowns[move.id] ?? 0) > 0) return fail('moveCoolingDown');
      if (move.kind === 'heal' && target.hp >= target.maxHp) return fail('alreadyHealthy');
      active.energy -= move.energy;
      if (move.cooldown) active.cooldowns[move.id] = move.cooldown;
      if (move.kind === 'heal') target.hp = Math.min(target.maxHp, target.hp + move.power);
      else {
        target.hp = Math.max(0, target.hp - getDamagePreview(state, active, target, move));
        if (target.hp > 0 && move.status) {
          target.statuses = target.statuses.filter(s => s.kind !== move.status);
          target.statuses.push({ kind: move.status, remaining: 2 });
        }
      }
      finishActivation(state); break;
    }
    case 'defend': {
      if (state.phase !== 'battle') return fail('battleOnly');
      const active = getActiveUnit(state);
      if (!active) return fail('noActiveUnit');
      active.defending = true; finishActivation(state); break;
    }
    case 'wait': {
      if (state.phase !== 'battle') return fail('battleOnly');
      const active = getActiveUnit(state);
      if (!active) return fail('noActiveUnit');
      if (state.waitedIds.includes(active.id)) return fail('alreadyWaited');
      // Moving then waiting would grant a second movement on the resumed turn.
      if (state.moved) return fail('alreadyMoved');
      state.waitedIds.push(active.id); state.initiative.shift(); state.initiative.push(active.id);
      state.activeId = null; activate(state); break;
    }
    case 'retry': {
      if (!state.checkpoint || (state.phase !== 'defeat' && !campPhase(state))) return fail('noCheckpoint');
      const saved = copy(state.checkpoint);
      Object.assign(state, saved); clearBattle(state); state.phase = 'deployment';
      return transition(state, { type: 'startBattle' });
    }
    case 'recover':
      if (state.phase !== 'defeat') return fail('defeatOnly');
      syncRoster(state); clearBattle(state); state.phase = 'camp';
      campRecovery(state);
      for (const id of Object.keys(state.deployment)) if (state.difficulty !== 'easy' && !state.roster.some(u => u.id === id && u.hp > 0)) delete state.deployment[id];
      break;
    case 'continue':
      if (state.phase !== 'victory' || state.stage >= MAX_STAGE) return fail('victoryOnly');
      state.stage++; clearBattle(state); state.phase = 'camp';
      campRecovery(state);
      for (const id of Object.keys(state.deployment)) if (state.difficulty !== 'easy' && !state.roster.some(u => u.id === id && u.hp > 0)) delete state.deployment[id];
      break;
    default: return fail('invalidAction');
  }
  return { state };
}

export function getAIAction(state: GameState, owner: Unit['owner'] = 'enemy'): GameAction | null {
  const unit = getActiveUnit(state);
  if (state.phase !== 'battle' || !unit || unit.owner !== owner || !unit.position) return null;
  const affordable = getUnitMoves(unit).filter(m => unit.energy >= m.energy && !(unit.cooldowns[m.id] > 0));
  const candidates: { action: GameAction; score: number }[] = [];
  for (const move of affordable) for (const target of state.battleUnits) {
    if (target.hp <= 0 || !target.position || distance(unit.position, target.position) > move.range) continue;
    if (move.kind === 'heal') {
      const missing = target.maxHp - target.hp;
      if (target.owner === unit.owner && missing >= 12) candidates.push({
        action: { type: 'useMove', moveId: move.id, targetId: target.id }, score: Math.min(missing, move.power) + (target.hp < target.maxHp / 3 ? 30 : 0),
      });
    } else if (target.owner !== unit.owner) {
      const damage = getDamagePreview(state, unit, target, move);
      candidates.push({ action: { type: 'useMove', moveId: move.id, targetId: target.id },
        score: damage + (damage >= target.hp ? 100 : 0) + (1 - target.hp / target.maxHp) * 15 });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length) return candidates[0].action;
  if (!state.moved) {
    const targets = state.battleUnits.filter(u => u.owner !== unit.owner && u.hp > 0 && u.position);
    const reachable = getReachableCells(state, unit.id);
    // Distance to an affordable attack's range, using full legal paths rather than walking into blockers.
    const range = Math.max(...affordable.filter(m => m.kind === 'damage').map(m => m.range), 1);
    const goalCells: Cell[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) for (let x = 0; x < GRID_WIDTH; x++) {
      const cell = { x, y };
      if (!occupied(state, cell, unit.id) && targets.some(t => distance(cell, t.position!) <= range)) goalCells.push(cell);
    }
    const costs = new Map<string, number>();
    const queue = goalCells.map(cell => ({ cell, cost: 0 }));
    for (const cell of goalCells) costs.set(`${cell.x},${cell.y}`, 0);
    for (let i = 0; i < queue.length; i++) {
      const { cell, cost } = queue[i];
      for (const next of neighbors(state, cell, unit.id)) {
        const key = `${next.x},${next.y}`;
        if (!costs.has(key)) { costs.set(key, cost + 1); queue.push({ cell: next, cost: cost + 1 }); }
      }
    }
    const cost = (cell: Cell) => costs.get(`${cell.x},${cell.y}`) ?? Infinity;
    reachable.sort((a, b) => cost(a) - cost(b) || distance(a, unit.position!) - distance(b, unit.position!));
    if (reachable.length && cost(reachable[0]) < cost(unit.position)) return { type: 'move', position: reachable[0] };
  }
  return { type: 'defend' };
}

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const cellValid = (v: unknown): v is Cell => record(v) && integer(v.x, 0, 11) && integer(v.y, 0, 7);
const inventoryValid = (v: unknown): boolean => record(v) && integer(v.healingPotion) && integer(v.revivePotion);
function unitValid(v: unknown): v is Unit {
  if (!record(v) || typeof v.id !== 'string' || !v.id || !allSpeciesIds.includes(v.species as SpeciesId) ||
    !['player', 'enemy'].includes(v.owner as string) || !integer(v.level, 1, 5) ||
    !integer(v.maxHp, 1, 10000) || !integer(v.hp, 0, v.maxHp) ||
    !integer(v.maxEnergy, 1, 1000) || !integer(v.energy, 0, v.maxEnergy) ||
    !integer(v.attack, 1, 1000) || !integer(v.defense, 1, 1000) ||
    !integer(v.speed, 1, 1000) || !integer(v.movement, 1, 12) ||
    typeof v.defending !== 'boolean' || (v.position !== null && !cellValid(v.position)) ||
    !record(v.cooldowns) || !Array.isArray(v.statuses)) return false;
  const moves = speciesCatalog[v.species as SpeciesId].moves;
  return Object.entries(v.cooldowns).every(([id, n]) => moves.some(m => m.id === id && integer(n, 0, m.cooldown))) &&
    v.statuses.length <= 2 && v.statuses.every(s => record(s) && ['burn', 'slow'].includes(s.kind as string) && integer(s.remaining, 1, 2)) &&
    new Set(v.statuses.map(s => s.kind)).size === v.statuses.length;
}
function rosterValid(v: unknown): v is Unit[] {
  return Array.isArray(v) && v.length <= MAX_ROSTER && v.every(u => unitValid(u) && u.owner === 'player' && u.position === null) &&
    new Set(v.map(u => u.id)).size === v.length;
}
function deploymentValid(v: unknown, roster: Unit[], blocked: Cell[]): boolean {
  if (!record(v) || Object.keys(v).length > MAX_TEAM) return false;
  const positions = Object.values(v);
  return Object.entries(v).every(([id, c]) => roster.some(u => u.id === id) &&
    cellValid(c) && c.x <= 3 && !blocked.some(b => sameCell(b, c))) &&
    new Set(positions.map(c => `${(c as Cell).x},${(c as Cell).y}`)).size === positions.length;
}
export function validateGameState(value: unknown): LoadResult {
  const fail = (field: string): LoadResult => ({ error: `invalidSave:${field}` });
  if (!record(value)) return fail('object');
  if (value.version !== 1) return fail('version');
  if (!['easy', 'medium', 'hard'].includes(value.difficulty as string)) return fail('difficulty');
  if (!['camp', 'deployment', 'battle', 'victory', 'defeat', 'complete'].includes(value.phase as string)) return fail('phase');
  if (!integer(value.stage, 1, MAX_STAGE)) return fail('stage');
  if (!integer(value.gold)) return fail('gold');
  if (!inventoryValid(value.potions)) return fail('potions');
  if (!rosterValid(value.roster)) return fail('roster');
  if (!Array.isArray(value.blockedCells) || !value.blockedCells.every(cellValid) ||
    new Set(value.blockedCells.map(c => `${c.x},${c.y}`)).size !== value.blockedCells.length) return fail('blockedCells');
  if (!deploymentValid(value.deployment, value.roster, value.blockedCells)) return fail('deployment');
  if (!integer(value.seed, 0, 0xffffffff) || !integer(value.nextId, 1) ||
    value.roster.some(u => !/^player-[1-9]\d*$/.test(u.id) || Number(u.id.slice(7)) >= (value.nextId as number))) return fail('seedOrId');
  if (!integer(value.cycle) || typeof value.moved !== 'boolean') return fail('activation');
  if (!Array.isArray(value.rewardedStages) || !value.rewardedStages.every(s => integer(s, 1, MAX_STAGE)) ||
    new Set(value.rewardedStages).size !== value.rewardedStages.length) return fail('rewards');
  if (value.rewardedStages.some(s => (s as number) > (value.stage as number))) return fail('rewards');
  if (!Array.isArray(value.battleUnits) || value.battleUnits.length > 12 ||
    !value.battleUnits.every(u => unitValid(u) && u.position !== null) ||
    new Set(value.battleUnits.map(u => u.id)).size !== value.battleUnits.length) return fail('battleUnits');
  const units = value.battleUnits as Unit[];
  const living = units.filter(u => u.hp > 0);
  if (new Set(living.map(u => `${u.position!.x},${u.position!.y}`)).size !== living.length ||
    living.some(u => (value.blockedCells as Cell[]).some(c => sameCell(c, u.position!)))) return fail('overlap');
  if (!Array.isArray(value.initiative) || !value.initiative.every(id => typeof id === 'string' && units.some(u => u.id === id)) ||
    new Set(value.initiative).size !== value.initiative.length) return fail('initiative');
  if (!Array.isArray(value.waitedIds) || !value.waitedIds.every(id => typeof id === 'string' && units.some(u => u.id === id)) ||
    new Set(value.waitedIds).size !== value.waitedIds.length) return fail('waitedIds');
  if (value.activeId !== null && (typeof value.activeId !== 'string' ||
    value.initiative[0] !== value.activeId || !living.some(u => u.id === value.activeId))) return fail('activeId');
  if (value.phase === 'battle' && (value.activeId === null || !value.checkpoint ||
    !living.some(u => u.owner === 'player') || !living.some(u => u.owner === 'enemy'))) return fail('battle');
  if (value.phase !== 'battle' && (value.activeId !== null || value.initiative.length)) return fail('inactiveBattle');
  if ((value.phase === 'camp' || value.phase === 'deployment') && units.length) return fail('campBattle');
  if (value.phase === 'complete' && value.stage !== MAX_STAGE) return fail('complete');
  if (value.phase === 'victory' && value.stage === MAX_STAGE) return fail('victory');
  if ((value.phase === 'victory' || value.phase === 'complete') && (!value.rewardedStages.includes(value.stage) ||
    living.some(u => u.owner === 'enemy') || !living.some(u => u.owner === 'player'))) return fail('victoryOutcome');
  if (value.phase === 'defeat' && (living.some(u => u.owner === 'player') || !value.checkpoint)) return fail('defeat');
  for (const unit of units.filter(u => u.owner === 'player')) {
    const roster = value.roster.find(u => u.id === unit.id);
    if (!roster || !equalData({ ...unit, position: null }, roster)) return fail('rosterDrift');
  }
  if (value.checkpoint !== null) {
    const c = value.checkpoint;
    if (!record(c) || !integer(c.gold) || !inventoryValid(c.potions) || !rosterValid(c.roster) ||
      !deploymentValid(c.deployment, c.roster, value.blockedCells) || c.stage !== value.stage ||
      !integer(c.seed, 0, 0xffffffff) || !integer(c.nextId, 1) ||
      Object.entries(c.deployment as Record<string, Cell>).length === 0 ||
      Object.keys(c.deployment as object).some(id => !(c.roster as Unit[]).find(u => u.id === id && u.hp > 0))) return fail('checkpoint');
  }
  if ((value.phase === 'victory' || value.phase === 'complete') && value.checkpoint !== null) return fail('checkpoint');
  return { state: copy(value) as unknown as GameState };
}
export function parseGameState(text: string): LoadResult {
  try { return validateGameState(JSON.parse(text)); }
  catch { return { error: 'invalidSave:json' }; }
}

function equalData(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equalData(v, b[i]));
  if (!record(a) || !record(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length &&
    keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && equalData(a[key], b[key]));
}
