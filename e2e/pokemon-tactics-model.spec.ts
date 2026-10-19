import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, generateEnemies, getActiveUnit, getAIAction, getDamagePreview, getUnitMoves,
  getMovementAllowance, getReachableCells, parseGameState, transition, validateGameState } from '../src/features/games/pokemon-tactics/engine';
import { allSpeciesIds, easyEncounters, evolutions, speciesCatalog, speciesIds, trainingCost, victoryReward } from '../src/features/games/pokemon-tactics/data';
import type { GameAction, GameState, SpeciesId, Unit } from '../src/features/games/pokemon-tactics/types';
import { pokemonName } from '../src/features/games/pokemon-tactics/localization';

function act(state: GameState, action: GameAction): GameState {
  const result = transition(state, action);
  expect(result.error, JSON.stringify(action)).toBeUndefined();
  return result.state;
}
function party(species: SpeciesId[] = ['charmander'], difficulty: GameState['difficulty'] = 'medium'): GameState {
  let s = createCampaign(difficulty);
  s.gold = 10000;
  for (const [i, id] of species.entries()) {
    s = act(s, { type: 'buyCreature', species: id });
    s = act(s, { type: 'deploy', unitId: s.roster[i].id, position: { x: 3, y: i } });
  }
  return s;
}
function battle(species: SpeciesId[] = ['charmander']): GameState {
  return act(party(species), { type: 'startBattle' });
}
function activeSetup(state: GameState, owner: Unit['owner'] = 'player'): GameState {
  const unit = state.battleUnits.find(u => u.owner === owner && u.hp > 0)!;
  state.activeId = unit.id;
  state.initiative = [unit.id, ...state.battleUnits.filter(u => u.id !== unit.id && u.hp > 0).map(u => u.id)];
  state.moved = false;
  return state;
}
function sync(state: GameState) {
  state.roster = state.roster.map(u => {
    const b = state.battleUnits.find(b => b.id === u.id);
    return b ? { ...JSON.parse(JSON.stringify(b)), position: null } : u;
  });
}
function finishWith(state: GameState, winner: Unit['owner']): GameState {
  for (const u of state.battleUnits) if (u.owner !== winner) u.hp = 0;
  activeSetup(state, winner);
  return act(state, { type: 'defend' });
}
function nextActivation(state: GameState, id: string): GameState {
  let s = state;
  for (let i = 0; i < 30 && s.phase === 'battle' && s.activeId !== id; i++) s = act(s, { type: 'defend' });
  expect(s.activeId).toBe(id);
  return s;
}

test('empty campaign, 56 basic species, static affordable shop and atomic failures', () => {
  const initial = createCampaign('medium');
  expect(initial.roster).toEqual([]);
  expect(initial.gold).toBe(500);
  expect(speciesIds).toHaveLength(56);
  for (const species of Object.values(speciesCatalog)) {
    expect(species.price).toBeGreaterThanOrEqual(80);
    expect(species.price).toBeLessThanOrEqual(160);
    expect(species.moves).toHaveLength(3);
    expect(species.moves[0].energy).toBe(0);
    expect(species.moves[0].cooldown).toBe(0);
  }
  let s = initial;
  for (let i = 0; i < 6; i++) s = act(s, { type: 'buyCreature', species: 'geodude' });
  expect(s.roster).toHaveLength(6);
  expect(s.gold).toBe(20);
  const denied = transition(s, { type: 'buyPotion', potion: 'healingPotion' });
  expect(denied.error).toBe('insufficientGold');
  expect(denied.state).toBe(s);
  expect(initial.roster).toEqual([]);
  s.gold = 10000;
  for (let i = 0; i < 6; i++) s = act(s, { type: 'buyCreature', species: 'geodude' });
  expect(transition(s, { type: 'buyCreature', species: 'gastly' }).error).toBe('rosterFull');
  expect(new Set(s.roster.map(u => u.id)).size).toBe(12);
});

test('all 56 families recruit, evolve, save and fight with complete local artwork and translated names', () => {
  expect(new Set(speciesIds).size).toBe(56);
  const seen = new Set<SpeciesId>();
  for (const base of speciesIds) {
    let state = party([base]);
    const unitId = state.roster[0].id;
    let form: SpeciesId = base;
    let stages = 0;
    const lineage = new Set<SpeciesId>();
    expect(evolutions[base], base).toBeDefined();
    while (true) {
      expect(lineage.has(form), `Evolution cycle: ${form}`).toBe(false);
      expect(seen.has(form), `Shared or duplicate family: ${form}`).toBe(false);
      lineage.add(form);
      seen.add(form);
      const art = readFileSync(join(process.cwd(), 'public/games/pokemon-tactics/pokemon', `${form}.png`));
      expect(art.subarray(0, 8).toString('hex'), form).toBe('89504e470d0a1a0a');
      for (const locale of ['en', 'he', 'zh', 'es']) {
        expect(pokemonName(form, locale), `${form}/${locale}`).not.toBe(form);
      }
      expect(state.roster[0].species).toBe(form);
      expect(parseGameState(JSON.stringify(state)).state).toEqual(state);
      const combat = act(state, { type: 'startBattle' });
      const combatUnit = combat.battleUnits.find(unit => unit.id === unitId)!;
      expect(combatUnit.species).toBe(form);
      expect(getUnitMoves(combatUnit)).toHaveLength(3);
      expect(getAIAction(activeSetup(combat), 'player')).toBeDefined();
      const next = evolutions[form];
      if (!next) break;
      state = act(state, { type: 'evolve', unitId });
      expect(state.deployment[unitId]).toEqual({ x: 3, y: 0 });
      form = next.species;
      stages++;
      expect(stages).toBeLessThan(4);
    }
  }
  expect([...seen].sort()).toEqual([...allSpeciesIds].sort());
});

test('ordinary teams win all ten Easy encounters across fixed seeds using only earned resources', () => {
  for (const seed of [1, 12345, 987654]) {
  let state = createCampaign('easy', seed);
  for (const species of ['pikachu', 'charmander', 'bulbasaur'] as const) {
    state = act(state, { type: 'buyCreature', species });
  }
  for (let stage = 1; stage <= 10; stage++) {
    state = act(state, { type: 'rest' });
    for (const species of ['geodude', 'squirtle', 'gastly'] as const) {
      let form: SpeciesId | undefined = species;
      const family: SpeciesId[] = [];
      while (form) { family.push(form); form = evolutions[form]?.species; }
      if (!state.roster.some(u => family.includes(u.species)) && state.gold >= speciesCatalog[species].price + 30) {
        state = act(state, { type: 'buyCreature', species });
      }
    }
    for (const unit of [...state.roster]) {
      const evolution = evolutions[unit.species];
      if (evolution && state.gold >= evolution.cost + 30) {
        state = act(state, { type: 'evolve', unitId: unit.id });
      }
    }
    while (stage === 10 && state.potions.healingPotion < 3 && state.gold >= 30) {
      state = act(state, { type: 'buyPotion', potion: 'healingPotion' });
    }
    for (const [i, unit] of state.roster.entries()) {
      state = act(state, { type: 'deploy', unitId: unit.id, position: { x: 3, y: i + 1 } });
    }
    state = act(state, { type: 'startBattle' });
    for (let actions = 0; actions < 800 && state.phase === 'battle'; actions++) {
      const active = getActiveUnit(state)!;
      const action: GameAction | null = active.owner === 'player' && active.hp < active.maxHp / 3 && state.potions.healingPotion > 0
        ? { type: 'usePotion', potion: 'healingPotion', targetId: active.id }
        : getAIAction(state, active.owner);
      expect(action).not.toBeNull();
      state = act(state, action!);
    }
    expect(state.phase, `Seed ${seed}, encounter ${stage}, gold ${state.gold}`).toBe(stage === 10 ? 'complete' : 'victory');
    expect(validateGameState(state).state).toBeDefined();
    if (stage < 10) state = act(state, { type: 'continue' });
  }
  expect(state.rewardedStages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  }
});

test('player auto planner uses legal actions, does not mutate or spend items, and respects ownership', () => {
  let state = battle(['pikachu', 'bulbasaur']);
  const inventory = { ...state.potions, healingPotion: 3, revivePotion: 2 };
  state.potions = inventory;
  const gold = state.gold;
  for (let i = 0; i < 800 && state.phase === 'battle'; i++) {
    const active = getActiveUnit(state)!;
    const before = JSON.stringify(state);
    expect(getAIAction(state, active.owner === 'player' ? 'enemy' : 'player')).toBeNull();
    const action = getAIAction(state, active.owner);
    expect(JSON.stringify(state)).toBe(before);
    expect(action).not.toBeNull();
    expect(['move', 'useMove', 'defend']).toContain(action!.type);
    state = act(state, action!);
  }
  expect(state.phase).not.toBe('battle');
  expect(state.potions).toEqual(inventory);
  expect(state.gold).toBeGreaterThanOrEqual(gold);
});

test('free Easy rest revives a broke team, preserves upgrades and checkpoint, and never farms rewards', () => {
  let state = act(party(['charmander'], 'easy'), { type: 'evolve', unitId: 'player-1' });
  state = act(state, { type: 'train', unitId: 'player-1' });
  state = act(state, { type: 'startBattle' });
  state = act(finishWith(state, 'enemy'), { type: 'recover' });
  state.gold = 0;
  state.roster[0].energy = 0;
  const before = JSON.parse(JSON.stringify(state)) as GameState;
  state = act(state, { type: 'rest' });
  expect(state.roster[0]).toMatchObject({ species: 'charmeleon', level: 2, hp: state.roster[0].maxHp,
    energy: state.roster[0].maxEnergy, cooldowns: {}, statuses: [], defending: false });
  expect(state.gold).toBe(0);
  expect(state.deployment).toEqual(before.deployment);
  expect(state.checkpoint).toEqual(before.checkpoint);
  expect(state.rewardedStages).toEqual([]);
  expect(act(state, { type: 'rest' })).toEqual(state);
  expect(validateGameState(state).state).toEqual(state);
  expect(transition(act(state, { type: 'startBattle' }), { type: 'rest' }).error).toBe('campOnly');
  for (const difficulty of ['medium', 'hard'] as const) {
    const harder = party(['charmander'], difficulty);
    expect(transition(harder, { type: 'rest' })).toEqual({ state: harder, error: 'easyOnly' });
  }
});

test('Easy rewards and automatic participant growth happen once, including KO but not bench teammates', () => {
  let camp = party(['pikachu', 'charmander', 'bulbasaur'], 'easy');
  camp.stage = 2;
  camp = act(camp, { type: 'bench', unitId: 'player-3' });
  let state = act(camp, { type: 'startBattle' });
  state.battleUnits.find(u => u.id === 'player-2')!.hp = 0;
  state = finishWith(state, 'player');
  expect(state.gold).toBe(camp.gold + 325);
  expect(state.roster.map(u => u.level)).toEqual([2, 2, 1]);
  expect(state.roster[1].hp).toBe(0);
  expect(state.roster[1].maxHp).toBe(camp.roster[1].maxHp + 10);
  const denied = transition(state, { type: 'defend' });
  expect(denied.state).toBe(state);
  state = act(state, { type: 'continue' });
  expect(state.roster.map(u => u.level)).toEqual([2, 2, 1]);
  for (let stage = 1; stage <= 10; stage++) {
    expect(victoryReward(stage, 'easy')).toBe(300 + (stage - 1) * 25);
    const enemies = generateEnemies(stage, 'easy');
    expect(enemies).toHaveLength(easyEncounters[stage - 1].count);
    expect(enemies.every(u => u.level === easyEncounters[stage - 1].level)).toBe(true);
    expect(victoryReward(stage, 'medium')).toBe(180 + stage * 35);
    expect(victoryReward(stage, 'hard')).toBe(Math.floor((180 + stage * 35) * .85));
  }
  const boss = generateEnemies(10, 'easy')[0];
  expect(boss.maxHp).toBe(Math.floor((speciesCatalog[boss.species].maxHp + 20) * .8));
});

test('deployment guards team, boundary, duplicate squares, bench and empty start', () => {
  expect(transition(createCampaign(), { type: 'startBattle' }).error).toBe('invalidDeployment');
  let s = party(['geodude', 'geodude', 'geodude', 'geodude', 'geodude', 'geodude']);
  expect(transition(s, { type: 'deploy', unitId: s.roster[1].id, position: { x: 3, y: 0 } }).error).toBe('occupiedCell');
  expect(transition(s, { type: 'deploy', unitId: s.roster[0].id, position: { x: 4, y: 0 } }).error).toBe('invalidPlacement');
  s = act(s, { type: 'buyCreature', species: 'geodude' });
  expect(transition(s, { type: 'deploy', unitId: s.roster[6].id, position: { x: 2, y: 0 } }).error).toBe('teamFull');
  s = act(s, { type: 'bench', unitId: s.roster[0].id });
  s = act(s, { type: 'deploy', unitId: s.roster[6].id, position: { x: 2, y: 0 } });
  expect(act(s, { type: 'startBattle' }).battleUnits.filter(u => u.owner === 'player')).toHaveLength(6);
});

test('eight directions cost one, blockers prevent either corner, no overlaps or double movement', () => {
  const s = activeSetup(battle());
  const unit = getActiveUnit(s)!;
  unit.position = { x: 3, y: 3 };
  expect(getReachableCells(s, unit.id)).toContainEqual({ x: 6, y: 6 });
  s.blockedCells = [{ x: 4, y: 3 }];
  unit.movement = 1;
  expect(getReachableCells(s, unit.id)).not.toContainEqual({ x: 4, y: 4 });
  s.blockedCells = [{ x: 3, y: 4 }];
  expect(getReachableCells(s, unit.id)).not.toContainEqual({ x: 4, y: 4 });
  s.blockedCells = [];
  const blocker = s.battleUnits.find(u => u.id !== unit.id)!;
  blocker.position = { x: 4, y: 3 };
  expect(getReachableCells(s, unit.id)).not.toContainEqual({ x: 4, y: 4 });
  expect(getReachableCells(s, unit.id)).not.toContainEqual(blocker.position);
  const moved = act(s, { type: 'move', position: { x: 2, y: 3 } });
  expect(transition(moved, { type: 'move', position: { x: 1, y: 3 } }).error).toBe('alreadyMoved');
  expect(transition(moved, { type: 'wait' }).error).toBe('alreadyMoved');
  expect(getReachableCells(moved, unit.id)).toEqual([]);
});

test('initiative is speed interleaved, seeded reproducible and ties not fixed by ownership', () => {
  const s = party(['pikachu', 'geodude']);
  const a = act(s, { type: 'startBattle' });
  const b = act(s, { type: 'startBattle' });
  expect(a.initiative).toEqual(b.initiative);
  const speeds = a.initiative.map(id => a.battleUnits.find(u => u.id === id)!.speed);
  expect(speeds).toEqual([...speeds].sort((x, y) => y - x));
  const firstOwners = new Set<string>();
  for (let seed = 0; seed < 50; seed++) {
    const equal = activeSetup(battle());
    equal.seed = seed;
    equal.battleUnits.forEach(u => { u.speed = 10; u.hp = u.maxHp; });
    equal.initiative = [equal.activeId!];
    const next = act(equal, { type: 'defend' });
    firstOwners.add(getActiveUnit(next)!.owner);
  }
  expect([...firstOwners].sort()).toEqual(['enemy', 'player']);
});

test('wait requeues once in same cycle without double resource/status tick', () => {
  const s = activeSetup(battle());
  const id = s.activeId!;
  const energy = getActiveUnit(s)!.energy;
  const cycle = s.cycle;
  let waiting = act(s, { type: 'wait' });
  expect(waiting.initiative.at(-1)).toBe(id);
  waiting = nextActivation(waiting, id);
  expect(waiting.cycle).toBe(cycle);
  expect(getActiveUnit(waiting)!.energy).toBe(energy);
  expect(transition(waiting, { type: 'wait' }).error).toBe('alreadyWaited');
});

test('preview and actual deterministic damage match, energy and cooldown are guarded', () => {
  let s = activeSetup(battle());
  const a = getActiveUnit(s)!;
  const b = s.battleUnits.find(u => u.owner === 'enemy')!;
  a.position = { x: 3, y: 3 }; b.position = { x: 4, y: 4 }; b.hp = b.maxHp = 500;
  const expected = getDamagePreview(s, a.id, b.id, 'flamethrower');
  const hp = b.hp;
  s = act(s, { type: 'useMove', moveId: 'flamethrower', targetId: b.id });
  expect(s.battleUnits.find(u => u.id === b.id)!.hp).toBe(hp - expected);
  expect(s.battleUnits.find(u => u.id === a.id)!.cooldowns.flamethrower).toBe(3);
  s = nextActivation(s, a.id);
  expect(getActiveUnit(s)!.cooldowns.flamethrower).toBe(2);
  expect(transition(s, { type: 'useMove', moveId: 'flamethrower', targetId: b.id }).error).toBe('moveCoolingDown');
  getActiveUnit(s)!.energy = 0;
  expect(transition(s, { type: 'useMove', moveId: 'ember', targetId: b.id }).error).toBe('insufficientEnergy');
  getActiveUnit(s)!.energy = 12;
  const after = act(s, { type: 'useMove', moveId: 'ember', targetId: b.id });
  expect(after.battleUnits.find(u => u.id === a.id)!.energy).toBe(4);
});

test('energy never regenerates in combat and recovers only once on returning to formation', () => {
  let state = battle(['pikachu']);
  const id = state.roster[0].id;
  expect(state.battleUnits.find(u => u.id === id)!.energy).toBe(12);
  state.battleUnits.find(u => u.id === id)!.energy = 2;
  sync(state);
  for (let i = 0; i < 16 && state.phase === 'battle'; i++) state = act(state, { type: 'defend' });
  expect(state.battleUnits.find(u => u.id === id)!.energy).toBe(2);
  state = finishWith(state, 'player');
  expect(state.roster[0].energy).toBe(2);
  state = act(state, { type: 'continue' });
  expect(state.roster[0].energy).toBe(8);
  expect(transition(state, { type: 'continue' }).state).toBe(state);
  state = act(state, { type: 'startBattle' });
  expect(state.battleUnits.find(u => u.id === id)!.energy).toBe(8);
  state = act(finishWith(state, 'enemy'), { type: 'recover' });
  expect(state.roster[0].energy).toBe(14);
  expect(transition(state, { type: 'recover' }).state).toBe(state);
  state = act(state, { type: 'retry' });
  expect(state.battleUnits.find(u => u.id === id)!.energy).toBe(8);
  let capped = battle(['pikachu']);
  capped.battleUnits.find(u => u.owner === 'player')!.energy = 23;
  capped = act(finishWith(capped, 'player'), { type: 'continue' });
  expect(capped.roster[0].energy).toBe(24);
});
test('both teams have identical attack ranges including diagonals for every species and move', () => {
  for (const species of allSpeciesIds) {
    const starter = speciesIds.find(base => {
      let form: SpeciesId = base;
      while (form !== species && evolutions[form]) form = evolutions[form]!.species;
      return form === species;
    })!;
    let camp = party([starter]);
    while (camp.roster[0].species !== species) camp = act(camp, { type: 'evolve', unitId: camp.roster[0].id });
    const initial = act(camp, { type: 'startBattle' });
    const player = initial.battleUnits.find(u => u.owner === 'player')!;
    const enemy = initial.battleUnits.find(u => u.owner === 'enemy')!;
    Object.assign(enemy, { ...player, id: enemy.id, owner: 'enemy' });
    for (const move of getUnitMoves(player)) {
      for (const owner of ['player', 'enemy'] as const) {
        for (const diagonal of [false, true]) {
          for (const gap of [move.range, move.range + 1]) {
            const state: GameState = JSON.parse(JSON.stringify(initial));
            const source = state.battleUnits.find(u => u.owner === owner)!;
            const target = move.kind === 'heal' ? source : state.battleUnits.find(u => u.owner !== owner)!;
            source.position = { x: 3, y: 3 };
            source.energy = source.maxEnergy;
            source.cooldowns = {};
            if (move.kind === 'heal') {
              const ally = { ...source, id: `${source.id}-ally`, hp: 1, position: { x: 3 + gap, y: diagonal ? 3 + gap : 3 } };
              state.battleUnits.push(ally);
              state.activeId = source.id;
              state.initiative = [source.id, ...state.battleUnits.filter(u => u.id !== source.id).map(u => u.id)];
              const result = transition(state, { type: 'useMove', moveId: move.id, targetId: ally.id });
              expect(result.error).toBe(gap > move.range ? 'outOfRange' : undefined);
            } else {
              target.position = { x: 3 + gap, y: diagonal ? 3 + gap : 3 };
              state.activeId = source.id;
              state.initiative = [source.id, ...state.battleUnits.filter(u => u.id !== source.id).map(u => u.id)];
              expect(transition(state, { type: 'useMove', moveId: move.id, targetId: target.id }).error).toBe(gap > move.range ? 'outOfRange' : undefined);
            }
          }
        }
      }
    }
  }
});

test('every evolution family preserves identity, training, injuries, resources, formation and saves', () => {
  expect(allSpeciesIds).toHaveLength(speciesIds.length + Object.keys(evolutions).length);
  for (const starter of speciesIds) {
    let state = act(party([starter]), { type: 'train', unitId: 'player-1' });
    state.roster[0].hp -= 17;
    state.roster[0].energy = 3;
    state.roster[0].cooldowns[getUnitMoves(state.roster[0])[2].id] = 2;
    while (evolutions[state.roster[0].species]) {
      const before = state;
      const unit = before.roster[0];
      const evolution = evolutions[unit.species]!;
      state = act(before, { type: 'evolve', unitId: unit.id });
      expect(state.gold).toBe(before.gold - evolution.cost);
      expect(before.roster[0].species).toBe(unit.species);
      expect(state.roster[0]).toMatchObject({ id: unit.id, species: evolution.species, level: unit.level,
        hp: unit.hp + 25, maxHp: unit.maxHp + 25, attack: unit.attack + 6,
        defense: unit.defense + 4, speed: unit.speed + 2, energy: 3, maxEnergy: unit.maxEnergy + 8,
        cooldowns: unit.cooldowns, statuses: unit.statuses });
      expect(state.deployment).toEqual(before.deployment);
      expect(parseGameState(JSON.stringify(state)).state).toEqual(state);
    }
    expect(transition(state, { type: 'evolve', unitId: 'player-1' }).error).toBe('fullyEvolved');
    const ready = act(state, { type: 'startBattle' });
    expect(ready.checkpoint!.roster[0]).toEqual(state.roster[0]);
    expect(parseGameState(JSON.stringify(ready)).state).toEqual(ready);
  }
});

test('evolution spending is atomic and rejects battle, KO, invalid units and direct evolved recruitment', () => {
  const state = party(['charmander']);
  expect(transition(state, { type: 'evolve', unitId: 'missing' }).error).toBe('invalidUnit');
  expect(transition(state, { type: 'buyCreature', species: 'charizard' }).error).toBe('invalidSpecies');
  state.gold = 199;
  const denied = transition(state, { type: 'evolve', unitId: 'player-1' });
  expect(denied.error).toBe('insufficientGold');
  expect(denied.state).toBe(state);
  state.gold = 200;
  state.roster[0].hp = 0;
  expect(transition(state, { type: 'evolve', unitId: 'player-1' }).error).toBe('unitKO');
  state.roster[0].hp = state.roster[0].maxHp;
  const first = act(state, { type: 'evolve', unitId: 'player-1' });
  expect(first.gold).toBe(0);
  first.gold = 400;
  const final = act(first, { type: 'evolve', unitId: 'player-1' });
  expect(final.gold).toBe(0);
  expect(final.roster[0].species).toBe('charizard');
  expect(transition(act(final, { type: 'startBattle' }), { type: 'evolve', unitId: 'player-1' }).error).toBe('campOnly');
});

test('checkpoint rollback discards a camp evolution bought after defeat', () => {
  const start = battle(['charmander']);
  let state = act(finishWith(start, 'enemy'), { type: 'recover' });
  state.potions.revivePotion = 1;
  state = act(state, { type: 'usePotion', potion: 'revivePotion', targetId: 'player-1' });
  state = act(state, { type: 'evolve', unitId: 'player-1' });
  expect(state.roster[0].species).toBe('charmeleon');
  const restored = act(state, { type: 'retry' });
  expect(restored.checkpoint).toEqual(start.checkpoint);
  expect(restored.roster[0].species).toBe('charmander');
  expect(restored.gold).toBe(start.checkpoint!.gold);
  expect(parseGameState(JSON.stringify(restored)).state).toEqual(restored);
});

test('burn deals four on two activations; slow expires after two actions; defend halves damage', () => {
  let s = activeSetup(battle());
  const a = getActiveUnit(s)!;
  const b = s.battleUnits.find(u => u.owner === 'enemy')!;
  a.position = { x: 3, y: 3 }; b.position = { x: 4, y: 3 }; b.hp = b.maxHp = 500;
  const damage = getDamagePreview(s, a, b, 'ember');
  s = act(s, { type: 'useMove', moveId: 'ember', targetId: b.id });
  s = nextActivation(s, b.id);
  expect(getActiveUnit(s)!.hp).toBe(500 - damage - 4);
  expect(getActiveUnit(s)!.statuses).toEqual([{ kind: 'burn', remaining: 1 }]);
  s = act(s, { type: 'defend' });
  s = nextActivation(s, b.id);
  expect(getActiveUnit(s)!.hp).toBe(500 - damage - 8);
  expect(getActiveUnit(s)!.statuses).toEqual([]);
  const slow = getActiveUnit(s)!;
  slow.statuses = [{ kind: 'slow', remaining: 2 }];
  expect(getMovementAllowance(slow)).toBe(slow.movement - 1);
  s = act(s, { type: 'defend' });
  expect(s.battleUnits.find(u => u.id === b.id)!.statuses[0].remaining).toBe(1);
  s = nextActivation(s, b.id);
  expect(getActiveUnit(s)!.defending).toBe(false);
  s = act(s, { type: 'defend' });
  const defended = s.battleUnits.find(u => u.id === b.id)!;
  expect(defended.statuses).toEqual([]);
  const full = getDamagePreview(s, s.battleUnits.find(u => u.id === a.id)!, { ...defended, defending: false }, 'scratch');
  expect(getDamagePreview(s, a.id, b.id, 'scratch')).toBe(Math.max(1, Math.floor(full / 2)));
});

test('dead queued units skip; activation burn KO finishes battle and roster KOs persist', () => {
  let s = activeSetup(battle(['charmander', 'squirtle']));
  const dead = s.battleUnits.find(u => u.owner === 'player' && u.id !== s.activeId)!;
  dead.hp = 0;
  s = act(s, { type: 'defend' });
  expect(s.activeId).not.toBe(dead.id);
  s = finishWith(s, 'player');
  expect(s.phase).toBe('victory');
  expect(s.roster.find(u => u.id === dead.id)!.hp).toBe(0);
  const next = act(s, { type: 'continue' });
  expect(next.deployment[dead.id]).toBeUndefined();
  expect(next.roster.find(u => u.id === dead.id)!.hp).toBe(0);
  let burning = activeSetup(battle(), 'enemy');
  const player = burning.battleUnits.find(u => u.owner === 'player')!;
  player.hp = 3; player.statuses = [{ kind: 'burn', remaining: 1 }];
  burning.initiative = [burning.activeId!, player.id];
  burning = act(burning, { type: 'defend' });
  expect(burning.phase).toBe('defeat');
  expect(burning.roster[0].hp).toBe(0);
});

test('potions inventory, capped camp healing, revive guard, battle healing consumes action', () => {
  let s = party(['charmander', 'squirtle']);
  s = act(s, { type: 'buyPotion', potion: 'healingPotion' });
  s = act(s, { type: 'buyPotion', potion: 'revivePotion' });
  expect(transition(s, { type: 'usePotion', potion: 'healingPotion', targetId: s.roster[0].id }).error).toBe('alreadyHealthy');
  s.roster[0].hp -= 10;
  s = act(s, { type: 'usePotion', potion: 'healingPotion', targetId: s.roster[0].id });
  expect(s.roster[0].hp).toBe(s.roster[0].maxHp);
  s.roster[0].hp = 0;
  s = act(s, { type: 'usePotion', potion: 'revivePotion', targetId: s.roster[0].id });
  expect(s.roster[0].hp).toBe(Math.floor(s.roster[0].maxHp * .35));
  s = act(s, { type: 'buyPotion', potion: 'healingPotion' });
  s = activeSetup(act(s, { type: 'startBattle' }));
  const id = s.activeId!;
  expect(transition(s, { type: 'usePotion', potion: 'revivePotion', targetId: id }).error).toBe('noPotion');
  s.potions.revivePotion = 1;
  expect(transition(s, { type: 'usePotion', potion: 'revivePotion', targetId: id }).error).toBe('reviveCampOnly');
  s = act(s, { type: 'usePotion', potion: 'healingPotion', targetId: id });
  expect(s.activeId).not.toBe(id);
  expect(s.potions.healingPotion).toBe(0);
});

test('training has explicit increasing costs and level cap without reviving KOs', () => {
  let s = party();
  const id = s.roster[0].id;
  const before = s.gold;
  const old = s.roster[0];
  s = act(s, { type: 'train', unitId: id });
  expect(s.gold).toBe(before - trainingCost(1));
  expect(s.roster[0].maxHp).toBe(old.maxHp + 10);
  expect(s.roster[0].attack).toBe(old.attack + 3);
  for (let i = 0; i < 3; i++) s = act(s, { type: 'train', unitId: id });
  expect(s.roster[0].level).toBe(5);
  expect(transition(s, { type: 'train', unitId: id }).error).toBe('maxLevel');
  s.roster[0].hp = 0;
  expect(transition(s, { type: 'train', unitId: id }).error).toBe('unitKO');
});

test('victory pays once, persists health/energy, freely repositions, completes stage ten', () => {
  let s = battle();
  const player = s.battleUnits.find(u => u.owner === 'player')!;
  player.hp = 20; player.energy = 2;
  const gold = s.gold;
  s = finishWith(s, 'player');
  expect(s.gold).toBe(gold + 215);
  expect(s.roster[0].hp).toBe(20);
  expect(s.roster[0].energy).toBe(2);
  expect(transition(s, { type: 'defend' }).state.gold).toBe(s.gold);
  s = act(s, { type: 'continue' });
  expect(s.stage).toBe(2);
  s = act(s, { type: 'deploy', unitId: player.id, position: { x: 0, y: 7 } });
  expect(s.deployment[player.id]).toEqual({ x: 0, y: 7 });
  s.stage = 10;
  s = act(s, { type: 'startBattle' });
  s = finishWith(s, 'player');
  expect(s.phase).toBe('complete');
  expect(s.stage).toBe(10);
  expect(transition(s, { type: 'continue' }).error).toBe('victoryOnly');
  expect(act(s, { type: 'reset', difficulty: 'hard' })).toEqual(createCampaign('hard'));
});

test('all defeat routes: retry immutable snapshot, recovery retains spent items/KO, checkpoint prevents softlock', () => {
  let s = party();
  s = act(s, { type: 'buyPotion', potion: 'healingPotion' });
  const before = JSON.parse(JSON.stringify(s));
  s = activeSetup(act(s, { type: 'startBattle' }));
  getActiveUnit(s)!.hp -= 20;
  s = act(s, { type: 'usePotion', potion: 'healingPotion', targetId: s.activeId! });
  s = finishWith(s, 'enemy');
  const snapshot = JSON.parse(JSON.stringify(s.checkpoint));
  expect(s.potions.healingPotion).toBe(0);
  const retry = act(s, { type: 'retry' });
  expect(retry.checkpoint).toEqual(snapshot);
  expect(retry.gold).toBe(before.gold);
  expect(retry.potions).toEqual(before.potions);
  expect(retry.stage).toBe(1);
  let recovery = act(s, { type: 'recover' });
  expect(recovery.roster[0].hp).toBe(0);
  expect(recovery.potions.healingPotion).toBe(0);
  expect(recovery.stage).toBe(1);
  expect(recovery.checkpoint).toEqual(snapshot);
  recovery = act(recovery, { type: 'buyCreature', species: 'geodude' });
  const restored = act(recovery, { type: 'retry' });
  expect(restored.roster).toHaveLength(1);
  expect(restored.gold).toBe(before.gold);
  expect(s.checkpoint).toEqual(snapshot);
  const reset = act(s, { type: 'reset', difficulty: 'easy' });
  expect(reset.gold).toBe(500);
  expect(reset.roster).toEqual([]);
});

test('difficulty changes enemies/rewards; boss uses only six basics with stronger stats', () => {
  const easy = generateEnemies(10, 'easy');
  const hard = generateEnemies(10, 'hard');
  expect(easy).toHaveLength(6);
  expect(hard[0].maxHp).toBeGreaterThan(easy[0].maxHp);
  expect(generateEnemies(10, 'medium')[0].maxHp).toBeGreaterThan(generateEnemies(9, 'medium')[0].maxHp);
  expect(hard.every(u => speciesIds.includes(u.species))).toBe(true);
  const e = finishWith(act(party(['pikachu'], 'easy'), { type: 'startBattle' }), 'player');
  const h = finishWith(act(party(['pikachu'], 'hard'), { type: 'startBattle' }), 'player');
  expect(e.gold).toBeGreaterThan(h.gold);
});

test('AI uses affordable advantage attacks, meaningful heal and legal pathing without waits', () => {
  let s = activeSetup(battle(), 'enemy');
  const enemy = getActiveUnit(s)!;
  const player = s.battleUnits.find(u => u.owner === 'player')!;
  enemy.species = 'squirtle'; enemy.energy = 20; enemy.cooldowns = {};
  enemy.position = { x: 4, y: 3 }; player.position = { x: 3, y: 3 };
  const chosen = getAIAction(s)!;
  expect(chosen.type).toBe('useMove');
  expect(transition(s, chosen).error).toBeUndefined();
  enemy.species = 'bulbasaur'; enemy.hp = 1; enemy.maxHp = 100;
  enemy.cooldowns = {}; enemy.position = { x: 10, y: 3 }; player.position = { x: 0, y: 3 };
  expect(getAIAction(s)).toEqual({ type: 'useMove', moveId: 'synthesis', targetId: enemy.id });
  enemy.hp = 100;
  let cycles = 0;
  for (let i = 0; i < 180 && s.phase === 'battle'; i++) {
    const a = getActiveUnit(s)!;
    const action = a.owner === 'enemy' ? getAIAction(s)! : { type: 'defend' as const };
    expect(action.type).not.toBe('wait');
    s = act(s, action);
    cycles = s.cycle;
  }
  expect(s.phase).toBe('defeat');
  expect(cycles).toBeLessThan(40);
});

test('save validator roundtrips all phases and explicitly rejects malformed fields and drift', () => {
  const camp = party();
  const combat = act(camp, { type: 'startBattle' });
  const defeat = finishWith(JSON.parse(JSON.stringify(combat)), 'enemy');
  const win = finishWith(JSON.parse(JSON.stringify(combat)), 'player');
  for (const s of [createCampaign(), camp, combat, defeat, win, act(win, { type: 'continue' }), act(defeat, { type: 'recover' })]) {
    sync(s);
    expect(validateGameState(s).error).toBeUndefined();
    expect(parseGameState(JSON.stringify(s)).state).toEqual(s);
  }
  const bad: Array<[string, unknown]> = [
    ['version', 2], ['gold', -1], ['stage', 11], ['difficulty', 'nightmare'],
    ['potions', { healingPotion: -1, revivePotion: 0 }], ['roster', [{ id: 'oops' }]],
    ['deployment', { 'player-1': { x: 8, y: 1 } }], ['seed', '42'], ['phase', 'unknown'],
    ['initiative', ['nonexistent']], ['checkpoint', {}], ['rewardedStages', [11]],
  ];
  for (const [key, value] of bad) expect(validateGameState({ ...camp, [key]: value }).error, key).toBeTruthy();
  const drift = JSON.parse(JSON.stringify(combat));
  drift.roster[0].hp--;
  expect(validateGameState(drift).error).toBe('invalidSave:rosterDrift');
  expect(parseGameState('{').error).toBe('invalidSave:json');
  expect(validateGameState({ version: 1 }).error).toBeTruthy();
  const reordered = JSON.parse(JSON.stringify(combat));
  reordered.roster = reordered.roster.map((u: Unit) => Object.fromEntries(Object.entries(u).reverse()));
  expect(validateGameState(reordered).error).toBeUndefined();
});

test('Bulbasaur support heals a living ally, costs its action, and rejects enemy/full/KO targets', () => {
  let s = activeSetup(battle(['bulbasaur', 'geodude']));
  const healer = getActiveUnit(s)!;
  const ally = s.battleUnits.find(u => u.owner === 'player' && u.id !== healer.id)!;
  const enemy = s.battleUnits.find(u => u.owner === 'enemy')!;
  healer.position = { x: 3, y: 3 }; ally.position = { x: 3, y: 4 };
  expect(transition(s, { type: 'useMove', moveId: 'synthesis', targetId: enemy.id }).error).toBe('invalidTarget');
  expect(transition(s, { type: 'useMove', moveId: 'synthesis', targetId: ally.id }).error).toBe('alreadyHealthy');
  ally.hp = 0;
  expect(transition(s, { type: 'useMove', moveId: 'synthesis', targetId: ally.id }).error).toBe('invalidTarget');
  ally.hp = 10;
  s = act(s, { type: 'useMove', moveId: 'synthesis', targetId: ally.id });
  expect(s.battleUnits.find(u => u.id === ally.id)!.hp).toBe(38);
  expect(s.activeId).not.toBe(healer.id);
  expect(s.battleUnits.find(u => u.id === healer.id)!.cooldowns.synthesis).toBe(3);
});

test('invalid runtime shop selectors and action values return errors without mutation', () => {
  const s = createCampaign();
  expect(transition(s, { type: 'buyCreature', species: 'constructor' } as unknown as GameAction).error).toBe('invalidSpecies');
  expect(transition(s, { type: 'buyPotion', potion: 'constructor' } as unknown as GameAction).error).toBe('invalidPotion');
  expect(transition(s, { type: 'reset', difficulty: 'constructor' } as unknown as GameAction).error).toBe('invalidDifficulty');
  expect(transition(s, null as unknown as GameAction).error).toBe('invalidAction');
  expect(s.gold).toBe(500);
});
