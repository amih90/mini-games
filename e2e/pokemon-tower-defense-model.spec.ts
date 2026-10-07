import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

type Difficulty = 'easy' | 'medium' | 'hard';
type MapId = 'classic' | 'coast' | 'volcano';
interface EnemyType {
  name: string;
  image: string;
  health: number;
  speed: number;
  radius: number;
  reward?: number;
}
interface EnemyFamily {
  id: string;
  stages: EnemyType[];
}
interface Tower {
  type: string;
  evolutionStage: number;
  eeveeEvolution?: string;
  skills: { power: number; range: number; special: number };
}
interface TowerType {
  name: string;
  element: string;
  cost: number;
  damage: number;
  range: number;
  rate: number;
  attack: string;
  splash?: number;
  slow?: number;
  color: string;
  evolutions: { name: string; image: string; mastery?: boolean }[];
}
interface TowerStats {
  damage: number;
  range: number;
  rate: number;
  element: string;
  attack: string;
  color: string;
  splash: number;
  slow: number;
  chains: number;
}
interface MapDefinition {
  width: number;
  height: number;
  goal: { x: number; y: number };
  path: { x: number; y: number }[];
  blockers: { x: number; y: number; rx: number; ry: number; type: string }[];
  theme: { field: string[]; water: string[]; decoration: string };
}
interface Camera { x: number; y: number; zoom: number }
interface Modifier { health: number; speed: number; count: number }
interface GameData {
  POKEMON: Record<string, { dex: number; en: string; he: string; zh: string; es: string }>;
  ELEMENTS: Record<string, { color: string }>;
  ADDITIONAL_TOWERS: Record<string, TowerType>;
  ADDITIONAL_ENEMY_FAMILIES: EnemyFamily[];
  ADDITIONAL_BOSSES: (EnemyType & { id: string; tier: number; ability: string; weakness: string[] })[];
  EEVEE_EVOLUTIONS: Record<string, { element: string }>;
  DIFFICULTIES: Record<Difficulty, { coins: number; lives: number; abilityInterval: number; spawnInterval: number }>;
  MAPS: Record<MapId, MapDefinition>;
  waveCount: (wave: number, difficulty: Difficulty, modifier: Modifier) => number;
  buildWavePlan: (options: {
    family: EnemyFamily; secondaryFamily?: EnemyFamily; wave: number;
    count: number; difficulty: Difficulty; random?: () => number;
  }) => EnemyType[];
  enemyStats: (type: EnemyType, wave: number, difficulty: Difficulty, modifier: Modifier, boss?: boolean, random?: () => number) => {
    health: number; speed: number; radius: number;
  };
  towerStats: (base: TowerType, tower: Tower) => TowerStats;
  shuffled: <T>(items: T[], random?: () => number) => T[];
  clampCamera: (camera: Camera, map: MapDefinition) => Camera;
  screenToWorld: (point: { x: number; y: number }, camera: Camera) => { x: number; y: number };
}

const host: { PokemonTDData?: GameData } = {};
runInNewContext(
  readFileSync(path.join(__dirname, '../public/games/pokemon-tower-defense/data.js'), 'utf8'),
  { window: host },
);
if (!host.PokemonTDData) throw new Error('Pokémon data bundle did not initialize.');
const data = host.PokemonTDData;
const normal: Modifier = { health: 1, speed: 1, count: 0 };
const birdFamily: EnemyFamily = {
  id: 'pidgey',
  stages: ['pidgey', 'pidgeotto', 'pidgeot'].map((id, index) => ({
    name: data.POKEMON[id].en, image: `${id}Animated`,
    health: 0.9 + index * 0.4, speed: 1.08, radius: 25 + index * 3, reward: 1,
  })),
};
const eevee: TowerType = {
  name: 'Eevee', element: 'normal', cost: 80, damage: 21, range: 210,
  rate: 0.65, attack: 'star', splash: 20, color: '#e4ad67', evolutions: [],
};

test.describe('Pokémon roster and evolution model', () => {
  test('adds exactly 50 selectable Pokémon with complete species and evolution data', () => {
    const entries = Object.entries(data.ADDITIONAL_TOWERS);
    expect(entries).toHaveLength(50);
    for (const id of ['mew', 'mewtwo', 'dragonite', 'lugia', 'zapdos', 'moltres', 'arceus']) {
      expect(data.ADDITIONAL_TOWERS[id]).toBeDefined();
    }
    for (const [id, tower] of entries) {
      expect(tower.cost).toBeGreaterThan(0);
      expect(tower.damage).toBeGreaterThan(0);
      expect(tower.range).toBeGreaterThan(0);
      expect(tower.rate).toBeGreaterThan(0);
      expect(data.ELEMENTS[tower.element]).toBeDefined();
      expect(tower.evolutions).toHaveLength(2);
      for (const species of [id, ...tower.evolutions.map(form => form.image.replace('Animated', ''))]) {
        const pokemon = data.POKEMON[species];
        expect(pokemon.dex).toBeGreaterThan(0);
        for (const locale of ['en', 'he', 'zh', 'es'] as const) expect(pokemon[locale].length).toBeGreaterThan(0);
      }
    }
  });

  test('all eight Eevee choices change combat style and retain their branch at mastery', () => {
    expect(Object.keys(data.EEVEE_EVOLUTIONS).sort()).toEqual([
      'espeon', 'flareon', 'glaceon', 'jolteon', 'leafeon', 'sylveon', 'umbreon', 'vaporeon',
    ]);
    const choices = Object.keys(data.EEVEE_EVOLUTIONS).map(eeveeEvolution => {
      const tower: Tower = { type: 'eevee', eeveeEvolution, evolutionStage: 1, skills: { power: 1, range: 1, special: 1 } };
      const evolved = data.towerStats(eevee, tower);
      const mastered = data.towerStats(eevee, { ...tower, evolutionStage: 2 });
      expect(evolved.element).toBe(data.EEVEE_EVOLUTIONS[eeveeEvolution].element);
      expect(mastered.element).toBe(evolved.element);
      expect(mastered.damage).toBeGreaterThan(evolved.damage);
      expect(mastered.range).toBeGreaterThan(evolved.range);
      expect(mastered.rate).toBeLessThan(evolved.rate);
      return [eeveeEvolution, evolved] as const;
    });
    const stats = Object.fromEntries(choices);
    expect(stats.jolteon.attack).toBe('lightning');
    expect(stats.jolteon.chains).toBeGreaterThanOrEqual(3);
    expect(stats.flareon.attack).toBe('fire');
    expect(stats.leafeon.attack).toBe('seed');
    expect(stats.glaceon.slow).toBeGreaterThan(stats.vaporeon.slow);
    expect(stats.sylveon.splash).toBeGreaterThan(stats.espeon.splash);
    expect(stats.espeon.range).toBeGreaterThan(stats.flareon.range);
    expect(new Set(choices.map(([, value]) => JSON.stringify(value))).size).toBe(8);
  });

  test('unevolved Eevee stays Normal, and old evolved saves retain Vaporeon', () => {
    const original: Tower = { type: 'eevee', evolutionStage: 0, skills: { power: 0, range: 0, special: 0 } };
    expect(data.towerStats(eevee, original)).toMatchObject({ element: 'normal', attack: 'star', damage: 21, range: 210 });
    expect(data.towerStats(eevee, { ...original, evolutionStage: 1 })).toMatchObject({ element: 'water', attack: 'water' });
  });

  test('Magikarp has a meaningful Gyarados power increase', () => {
    const base = data.ADDITIONAL_TOWERS.magikarp;
    const tower: Tower = { type: 'magikarp', evolutionStage: 0, skills: { power: 1, range: 1, special: 1 } };
    const before = data.towerStats(base, tower);
    const after = data.towerStats(base, { ...tower, evolutionStage: 1 });
    expect(after.damage).toBeGreaterThan(before.damage * 3);
  });
});

test.describe('Pokémon waves and difficulty model', () => {
  test('guarantees a 7 Pidgey + 3 Pidgeotto composition instead of random identical spawns', () => {
    const plan = data.buildWavePlan({ family: birdFamily, wave: 6, count: 10, difficulty: 'easy', random: () => 0.4 });
    expect(plan).toHaveLength(10);
    expect(plan.filter(enemy => enemy.image === 'pidgeyAnimated')).toHaveLength(7);
    expect(plan.filter(enemy => enemy.image === 'pidgeottoAnimated')).toHaveLength(3);
    expect(plan.filter(enemy => enemy.image === 'pidgeotAnimated')).toHaveLength(0);
  });

  test('hard introduces Pidgeot earlier, and later waves favor final forms', () => {
    const build = (wave: number, difficulty: Difficulty) =>
      data.buildWavePlan({ family: birdFamily, wave, count: 20, difficulty });
    expect(build(7, 'easy').some(enemy => enemy.image === 'pidgeotAnimated')).toBe(false);
    expect(build(7, 'hard').filter(enemy => enemy.image === 'pidgeotAnimated')).toHaveLength(6);
    expect(build(30, 'hard').filter(enemy => enemy.image === 'pidgeotAnimated')).toHaveLength(14);
    expect(new Set(build(30, 'hard').map(enemy => enemy.image)).size).toBe(3);
  });

  test('mixed-family waves include a second family without changing the promised count', () => {
    const secondary = data.ADDITIONAL_ENEMY_FAMILIES.find(family => family.id === 'gastly');
    if (!secondary) throw new Error('Gastly family is missing.');
    const plan = data.buildWavePlan({ family: birdFamily, secondaryFamily: secondary, wave: 12, count: 20, difficulty: 'medium' });
    expect(plan).toHaveLength(20);
    expect(plan.filter(enemy => secondary.stages.some(stage => stage.image === enemy.image))).toHaveLength(4);
    expect(plan.filter(enemy => birdFamily.stages.some(stage => stage.image === enemy.image))).toHaveLength(16);
  });

  test('all families keep exact counts across tiers and progression thresholds', () => {
    for (const family of data.ADDITIONAL_ENEMY_FAMILIES) {
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        for (const wave of [1, 4, 6, 9, 11, 20, 50]) {
          const count = data.waveCount(wave, difficulty, normal);
          const plan = data.buildWavePlan({ family, wave, count, difficulty });
          expect(plan).toHaveLength(count);
          expect(plan.every(enemy => family.stages.some(stage => stage.image === enemy.image))).toBe(true);
          expect(plan.every(enemy => data.POKEMON[enemy.image.replace('Animated', '')])).toBe(true);
        }
      }
    }
  });

  test('each difficulty measurably changes health, speed, count, resources and boss abilities', () => {
    const values = (['easy', 'medium', 'hard'] as const).map(difficulty => ({
      enemy: data.enemyStats(birdFamily.stages[0], 6, difficulty, normal, false, () => 0),
      count: data.waveCount(6, difficulty, normal),
      settings: data.DIFFICULTIES[difficulty],
    }));
    for (let index = 1; index < values.length; index++) {
      expect(values[index].enemy.health).toBeGreaterThan(values[index - 1].enemy.health);
      expect(values[index].enemy.speed).toBeGreaterThan(values[index - 1].enemy.speed);
      expect(values[index].count).toBeGreaterThan(values[index - 1].count);
      expect(values[index].settings.coins).toBeLessThan(values[index - 1].settings.coins);
      expect(values[index].settings.lives).toBeLessThan(values[index - 1].settings.lives);
      expect(values[index].settings.abilityInterval).toBeLessThan(values[index - 1].settings.abilityInterval);
      expect(values[index].settings.spawnInterval).toBeLessThan(values[index - 1].settings.spawnInterval);
    }
  });

  test('13 additional bosses are larger and stronger, with six supported mechanics', () => {
    expect(data.ADDITIONAL_BOSSES).toHaveLength(13);
    const abilities = new Set<string>();
    for (const boss of data.ADDITIONAL_BOSSES) {
      abilities.add(boss.ability);
      expect(boss.weakness.every(element => data.ELEMENTS[element])).toBe(true);
      const regular = data.enemyStats({ ...boss, reward: 1 }, 15, 'medium', normal, false, () => 0);
      const medium = data.enemyStats(boss, 15, 'medium', normal, true, () => 0);
      const hard = data.enemyStats(boss, 15, 'hard', normal, true, () => 0);
      const later = data.enemyStats(boss, 30, 'hard', normal, true, () => 0);
      expect(medium.health).toBeGreaterThan(regular.health * 10);
      expect(medium.radius).toBeGreaterThan(regular.radius * 1.5);
      expect(hard.health).toBeGreaterThanOrEqual(medium.health * 2);
      expect(hard.radius).toBeGreaterThan(medium.radius);
      expect(later.health).toBeGreaterThan(hard.health);
      expect(later.radius).toBeGreaterThan(hard.radius);
    }
    expect([...abilities].sort()).toEqual(['dash', 'enrage', 'heal', 'phase', 'shield', 'storm']);
  });

  test('family shuffle is a non-mutating permutation for no-repeat rotation', () => {
    const ids = data.ADDITIONAL_ENEMY_FAMILIES.map(family => family.id);
    const copy = [...ids];
    const queue = data.shuffled(ids, () => 0);
    expect(ids).toEqual(copy);
    expect(queue).not.toEqual(copy);
    expect([...queue].sort()).toEqual([...ids].sort());
    expect(new Set(queue).size).toBe(ids.length);
  });
});

test.describe('Pokémon map and camera model', () => {
  test('three genuinely larger maps have different routes and environments', () => {
    const maps = Object.values(data.MAPS);
    expect(maps.map(map => [map.width, map.height])).toEqual([[1600, 900], [2240, 1260], [2880, 1620]]);
    const length = (map: MapDefinition) => map.path.slice(1).reduce((total, point, index) =>
      total + Math.hypot(point.x - map.path[index].x, point.y - map.path[index].y), 0);
    for (let index = 1; index < maps.length; index++) {
      expect(maps[index].width * maps[index].height).toBeGreaterThan(maps[index - 1].width * maps[index - 1].height * 1.5);
      expect(length(maps[index])).toBeGreaterThan(length(maps[index - 1]));
      expect(maps[index].path).not.toEqual(maps[index - 1].path);
      expect(maps[index].theme.field).not.toEqual(maps[index - 1].theme.field);
      expect(maps[index].theme.water).not.toEqual(maps[index - 1].theme.water);
    }
    expect(maps.map(map => map.theme.decoration)).toEqual(['flowers', 'shells', 'crystals']);
    for (const map of maps) {
      expect(map.width / map.height).toBeCloseTo(16 / 9);
      expect(map.path[0].x).toBeLessThan(0);
      expect(map.path[map.path.length - 1].x).toBeGreaterThan(map.width);
      expect(map.goal.x).toBeLessThan(map.width);
      expect(map.goal.y).toBeLessThan(map.height);
      expect(map.blockers.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('zoomed placement and camera bounds work on every map size', () => {
    for (const map of Object.values(data.MAPS)) {
      expect(data.clampCamera({ x: 100, y: 100, zoom: 1 }, map)).toEqual({ x: 0, y: 0, zoom: 1 });
      const far = data.clampCamera({ x: 99999, y: 99999, zoom: 2 }, map);
      expect(far).toEqual({ x: map.width / 2, y: map.height / 2, zoom: 2 });
      expect(data.screenToWorld({ x: 160, y: 240 }, { x: 300, y: 400, zoom: 2 }))
        .toEqual({ x: 380, y: 520 });
      expect(data.clampCamera({ x: -10, y: -10, zoom: 5 }, map)).toEqual({ x: 0, y: 0, zoom: 3 });
    }
  });
});
