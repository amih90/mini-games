import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

type Difficulty = 'easy' | 'medium' | 'hard';
type MapId = 'classic' | 'coast' | 'volcano' | 'switchback' | 'spiral';
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
  upgradeCosts: number[];
  special: { icon: string };
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
  route: { x: number; y: number; distance: number }[];
  blockers: { x: number; y: number; rx: number; ry: number; type: string }[];
  theme: { field: string[]; water: string[]; decoration: string };
}
interface Camera { x: number; y: number; zoom: number }
interface Modifier { health: number; speed: number; count: number }
interface GameData {
  routeDistance: (route: MapDefinition['route'], x: number, y: number) => number;
  advanceRoute: (route: MapDefinition['route'], traveler: { x: number; y: number; segment: number }, distance: number) => void;
  routeProgress: (route: MapDefinition['route'], traveler: { x: number; y: number; segment: number }) => number;
  sampleRoute: (path: MapDefinition['path']) => MapDefinition['route'];
  POKEMON: Record<string, { dex: number; en: string; he: string; zh: string; es: string }>;
  ELEMENTS: Record<string, { color: string; attack: string; icon: string }>;
  ADDITIONAL_TOWERS: Record<string, TowerType>;
  EXPANSION_BASE_IDS: string[];
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
  shopTowerIds: (towerTypes: Record<string, TowerType>, eeveeEvolutions?: Record<string, { element: string }>) => string[];
  shuffled: <T>(items: T[], random?: () => number) => T[];
  clampCamera: (camera: Camera, map: MapDefinition) => Camera;
  screenToWorld: (point: { x: number; y: number }, camera: Camera) => { x: number; y: number };
  bossCount: (wave: number, difficulty: Difficulty) => number;
  bossWaveReward: (wave: number, defeated: number, total: number) => number;
  towerStrike: (durability: number, difficulty: Difficulty) => { durability: number; stun: number };
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
  rate: 0.65, attack: 'star', splash: 20, color: '#e4ad67',
  upgradeCosts: [76, 136], special: { icon: '⭐' }, evolutions: [],
};

test.describe('Pokémon roster and evolution model', () => {
  test('retains all additional tower definitions with complete species and evolution data', () => {
    const entries = Object.entries(data.ADDITIONAL_TOWERS);
    expect(entries).toHaveLength(147);
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

  test('preserves the Johto expansion and adds complete starter lines from every generation', () => {
    const originalAdditional = 'mew mewtwo dragonite lugia zapdos moltres arceus articuno raikou entei suicune hooh celebi jirachi rayquaza groudon kyogre dialga palkia giratina zekrom reshiram vaporeon jolteon flareon espeon umbreon leafeon glaceon sylveon dratini gastly geodude onix machop growlithe psyduck poliwag slowpoke lapras snorlax scyther magikarp larvitar rhyhorn riolu bagon gible beldum togepi'.split(' ');
    const originalStarters = 'pikachu charmander bulbasaur squirtle eevee magnemite vulpix torchic chikorita rowlet mudkip piplup shinx abra ralts'.split(' ');
    const johtoAdditions = 'totodile croconaw feraligatr cyndaquil quilava typhlosion mareep flaaffy ampharos chinchou lanturn marill azumarill hoppip skiploom jumpluff sunkern sunflora wooper quagsire teddiursa ursaring slugma magcargo swinub piloswine houndour houndoom skarmory shuckle'.split(' ');
    const addedStarters = 'treecko turtwig chimchar snivy tepig oshawott chespin fennekin froakie litten popplio grookey scorbunny sobble sprigatito fuecoco quaxly'.split(' ');
    const expansionBases = 'bellsprout tentacool doduo drowzee krabby horsea spinarak aipom gligar lotad seedot aron electrike trapinch shroomish cranidos shieldon shellos drifloon snover stunky sandile darumaka joltik litwick axew golett honedge skiddo goomy phantump bergmite grubbin salandit mareanie jangmo-o morelull rookidee blipbug toxel impidimp silicobra cufant sizzlipede pawmi tarountula nacli tadbulb shroodle frigibax'.split(' ');
    const actual = Object.keys(data.ADDITIONAL_TOWERS);
    expect(data.EXPANSION_BASE_IDS).toEqual(expansionBases);
    expect(actual.filter(id => !originalAdditional.includes(id)).sort()).toEqual([...johtoAdditions, ...addedStarters, ...expansionBases].sort());
    expect(new Set([...originalStarters, ...actual]).size).toBe(162);
    expect(new Set([...originalStarters, ...actual].map(id => data.POKEMON[id].dex)).size).toBe(162);
    for (const id of originalAdditional) expect(actual).toContain(id);
    const starters = [
      ['bulbasaur', ['ivysaur', 'venusaur']], ['charmander', ['charmeleon', 'charizard']],
      ['squirtle', ['wartortle', 'blastoise']], ['chikorita', ['bayleef', 'meganium']],
      ['cyndaquil', ['quilava', 'typhlosion']], ['totodile', ['croconaw', 'feraligatr']],
      ['treecko', ['grovyle', 'sceptile']], ['torchic', ['combusken', 'blaziken']],
      ['mudkip', ['marshtomp', 'swampert']], ['turtwig', ['grotle', 'torterra']],
      ['chimchar', ['monferno', 'infernape']], ['piplup', ['prinplup', 'empoleon']],
      ['snivy', ['servine', 'serperior']], ['tepig', ['pignite', 'emboar']],
      ['oshawott', ['dewott', 'samurott']], ['chespin', ['quilladin', 'chesnaught']],
      ['fennekin', ['braixen', 'delphox']], ['froakie', ['frogadier', 'greninja']],
      ['rowlet', ['dartrix', 'decidueye']], ['litten', ['torracat', 'incineroar']],
      ['popplio', ['brionne', 'primarina']], ['grookey', ['thwackey', 'rillaboom']],
      ['scorbunny', ['raboot', 'cinderace']], ['sobble', ['drizzile', 'inteleon']],
      ['sprigatito', ['floragato', 'meowscarada']], ['fuecoco', ['crocalor', 'skeledirge']],
      ['quaxly', ['quaxwell', 'quaquaval']],
    ] as const;
    expect(starters).toHaveLength(27);
    for (const [base, forms] of starters) {
      expect([...originalStarters, ...actual]).toContain(base);
      for (const id of [base, ...forms]) {
        const pokemon = data.POKEMON[id];
        expect(pokemon.dex).toBeGreaterThan(0);
        for (const locale of ['en', 'he', 'zh', 'es'] as const) expect(pokemon[locale].length).toBeGreaterThan(0);
      }
      const tower = data.ADDITIONAL_TOWERS[base];
      if (tower) {
        expect(tower.evolutions.map(form => form.image)).toEqual(forms.map(form => `${form}Animated`));
        for (const stage of [0, 1, 2]) {
          const stats = data.towerStats(tower, { type: base, evolutionStage: stage, skills: { power: 1, range: 1, special: 1 } });
          expect(stats.damage).toBeGreaterThan(0);
          expect(stats.element).toBe(tower.element);
        }
      }
    }
    for (const [id, forms] of [
      ['totodile', ['croconaw', 'feraligatr']], ['cyndaquil', ['quilava', 'typhlosion']],
      ['mareep', ['flaaffy', 'ampharos']], ['hoppip', ['skiploom', 'jumpluff']],
    ] as const) {
      const base = data.ADDITIONAL_TOWERS[id];
      expect(base.evolutions.map(form => form.image)).toEqual(forms.map(form => `${form}Animated`));
      expect(base.evolutions.every(form => !form.mastery)).toBe(true);
      for (const stage of [0, 1, 2]) {
        const stats = data.towerStats(base, { type: id, evolutionStage: stage, skills: { power: 1, range: 1, special: 1 } });
        expect(stats.element).toBe(base.element);
        expect(stats.damage).toBeGreaterThan(0);
      }
    }
    for (const id of ['feraligatr', 'typhlosion', 'ampharos', 'jumpluff', 'skarmory', 'shuckle']) {
      expect(data.ADDITIONAL_TOWERS[id].evolutions.every(form => form.mastery && form.image === `${id}Animated`)).toBe(true);
    }
    const available = data.shopTowerIds(data.ADDITIONAL_TOWERS);
    for (const id of ['croconaw', 'feraligatr', 'quilava', 'typhlosion', 'flaaffy', 'ampharos', 'lanturn', 'azumarill', 'skiploom', 'jumpluff', 'sunflora', 'quagsire', 'ursaring', 'magcargo', 'piloswine', 'houndoom']) {
      expect(available).not.toContain(id);
    }
    const withEevee = data.shopTowerIds({ ...data.ADDITIONAL_TOWERS, eevee });
    for (const id of Object.keys(data.EEVEE_EVOLUTIONS)) expect(withEevee).not.toContain(id);
    for (const id of [...johtoAdditions, ...addedStarters].filter(id => ![
      'croconaw', 'feraligatr', 'quilava', 'typhlosion', 'flaaffy', 'ampharos', 'lanturn',
      'azumarill', 'skiploom', 'jumpluff', 'sunflora', 'quagsire', 'ursaring', 'magcargo',
      'piloswine', 'houndoom',
    ].includes(id))) {
      if (Object.hasOwn(data.ADDITIONAL_TOWERS, id)) expect(available).toContain(id);
    }
  });

  test('adds exactly 50 unique base-form purchases with localized species, artwork dex, and valid combat data', () => {
    const expansionSpecies = [...new Set(data.EXPANSION_BASE_IDS.flatMap(id => [
      id, ...data.ADDITIONAL_TOWERS[id].evolutions.map(form => form.image.replace(/Animated$/, '')),
    ]))];
    expect(data.EXPANSION_BASE_IDS).toHaveLength(50);
    expect(new Set(data.EXPANSION_BASE_IDS).size).toBe(50);
    expect(expansionSpecies).toHaveLength(119);
    expect(new Set(expansionSpecies.map(id => data.POKEMON[id].dex)).size).toBe(119);
    expect(Object.keys(data.POKEMON)).toHaveLength(355);
    expect(data.shopTowerIds(data.ADDITIONAL_TOWERS)).toHaveLength(130);

    const available = data.shopTowerIds(data.ADDITIONAL_TOWERS);
    for (const id of data.EXPANSION_BASE_IDS) {
      const tower = data.ADDITIONAL_TOWERS[id];
      const species = data.POKEMON[id];
      expect(available).toContain(id);
      expect(tower.cost).toBeGreaterThan(0);
      expect(tower.damage).toBeGreaterThan(0);
      expect(tower.range).toBeGreaterThan(0);
      expect(tower.rate).toBeGreaterThan(0);
      expect(tower.upgradeCosts).toHaveLength(2);
      expect(tower.special.icon).toBe(data.ELEMENTS[tower.element].icon);
      expect(tower.attack).toBe(data.ELEMENTS[tower.element].attack);
      expect(species.dex).toBeGreaterThan(0);
      for (const locale of ['en', 'he', 'zh', 'es'] as const) {
        expect(species[locale].length, `${id} ${locale}`).toBeGreaterThan(0);
      }
      expect(tower.evolutions).toHaveLength(2);
      for (const form of tower.evolutions) {
        const formId = form.image.replace(/Animated$/, '');
        const evolved = data.POKEMON[formId];
        expect(evolved.dex, `${id} → ${formId} dex`).toBeGreaterThan(0);
        expect(form.name).toBe(evolved.en);
        for (const locale of ['en', 'he', 'zh', 'es'] as const) {
          expect(evolved[locale].length, `${formId} ${locale}`).toBeGreaterThan(0);
        }
        expect(available).not.toContain(formId);
      }
      for (const stage of [0, 1, 2]) {
        const stats = data.towerStats(tower, {
          type: id, evolutionStage: stage, skills: { power: 1, range: 1, special: 1 },
        });
        expect(stats.damage, `${id} stage ${stage}`).toBeGreaterThan(0);
        expect(stats.range, `${id} stage ${stage}`).toBeGreaterThan(0);
        expect(stats.element).toBe(tower.element);
      }
    }
    expect(available.filter(id => data.EXPANSION_BASE_IDS.includes(id))).toHaveLength(50);
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
  test('boss squads scale predictably from 2–5 or 3–5 while Easy stays learnable', () => {
    for (const [wave, medium, hard] of [[5, 2, 3], [10, 2, 3], [15, 3, 4], [25, 4, 5], [35, 5, 5], [100, 5, 5]]) {
      expect(data.bossCount(wave, 'easy')).toBe(1);
      expect(data.bossCount(wave, 'medium')).toBe(medium);
      expect(data.bossCount(wave, 'hard')).toBe(hard);
    }
  });

  test('Easy strikes only stun, and other tiers require three hits for destruction', () => {
    expect(data.towerStrike(3, 'easy')).toEqual({ durability: 3, stun: 1.2 });
    for (const difficulty of ['medium', 'hard'] as const) {
      let durability = 3;
      for (const remaining of [2, 1, 0]) {
        const result = data.towerStrike(durability, difficulty);
        expect(result).toEqual({ durability: remaining, stun: difficulty === 'hard' ? 3 : 2 });
        durability = result.durability;
      }
      expect(data.towerStrike(0, difficulty).durability).toBe(0);
    }
  });

  test('a squad earns the full wave reward only when every boss was defeated', () => {
    expect(data.bossWaveReward(5, 1, 2)).toBe(12);
    expect(data.bossWaveReward(5, 0, 2)).toBe(12);
    expect(data.bossWaveReward(5, 2, 2)).toBe(65);
    expect(data.bossWaveReward(25, 4, 5)).toBe(12);
    expect(data.bossWaveReward(25, 5, 5)).toBe(145);
  });

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
    const maps = [data.MAPS.classic, data.MAPS.coast, data.MAPS.volcano];
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

  test('two compact tactical maps really reverse direction and spiral inward', () => {
    expect(Object.keys(data.MAPS)).toHaveLength(5);
    const garden = data.MAPS.switchback;
    const spiral = data.MAPS.spiral;
    expect(garden.path).not.toEqual(data.MAPS.classic.path);
    expect(spiral.path).not.toEqual(garden.path);
    expect(garden.path[3].x).toBeLessThan(garden.path[2].x);
    expect(spiral.path[3].x).toBeLessThan(spiral.path[2].x);
    expect(spiral.path[5].y).toBeGreaterThan(spiral.path[1].y);
    for (const map of [garden, spiral]) {
      expect([map.width, map.height]).toEqual([1600, 900]);
      expect(map.path[0].x).toBeLessThan(0);
      if (map === garden) expect(map.path.at(-1)?.x).toBeGreaterThan(map.width);
      else expect(map.path.at(-1)).toEqual(map.goal);
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

  for (const mapId of ['classic', 'coast', 'volcano', 'switchback', 'spiral'] as const) {
    test(`${mapId}: one deterministic road handles corners, fast bosses, progress and exclusion`, () => {
      const map = data.MAPS[mapId], route = map.route;
      expect(data.sampleRoute(map.path)).toEqual(route);
      expect(route.length).toBeGreaterThan(100);
      const total = route.at(-1)!.distance;
      for (const step of [5, 12, 157, 880]) {
        const traveler = { ...route[0], segment: 0 };
        let traveled = 0;
        while (traveled < total) {
          data.advanceRoute(route, traveler, step);
          traveled = Math.min(total, traveled + step);
          expect(data.routeDistance(route, traveler.x, traveler.y)).toBeLessThan(0.000001);
          expect(data.routeProgress(route, traveler)).toBeCloseTo(traveled, 6);
          const camera = data.clampCamera({ x: traveler.x - 150, y: traveler.y - 100, zoom: 2.5 }, map);
          const screen = { x: (traveler.x - camera.x) * camera.zoom, y: (traveler.y - camera.y) * camera.zoom };
          expect(data.screenToWorld(screen, camera).x).toBeCloseTo(traveler.x, 6);
          expect(data.screenToWorld(screen, camera).y).toBeCloseTo(traveler.y, 6);
        }
        expect(traveler.segment).toBe(route.length - 1);
      }
      const buildable = [];
      for (let y = 280; y < map.height - 40; y += 80) for (let x = 40; x < map.width; x += 80) {
        if (data.routeDistance(route, x, y) > 82 &&
            !map.blockers.some(a => ((x-a.x)/(a.rx+36))**2 + ((y-a.y)/(a.ry+36))**2 < 1)) buildable.push({ x, y });
      }
      expect(buildable.length).toBeGreaterThan(20);
    });
  }
});
