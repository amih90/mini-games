import { EnemyFormation, BattleEnvironment } from '../types';

export interface StageInfo {
  id: number;
  name: string;
  historicalBattle: string;
  year: string;
  description: string;
  environment: BattleEnvironment;
  enemyFormation: EnemyFormation[];
}

export const STAGE_INFO: StageInfo[] = [
  {
    id: 1,
    name: 'Battle of 73 Easting',
    historicalBattle: '73 Easting',
    year: '1991',
    description: 'US M1A2 vs Iraqi T-72s in the largest tank battle since WWII',
    environment: 'desert_storm',
    enemyFormation: [
      { type: 'melee', level: 1, col: 1, row: 0 },
      { type: 'melee', level: 1, col: 2, row: 0 },
    ],
  },
  {
    id: 2,
    name: 'Battle of Arracourt',
    historicalBattle: 'Arracourt',
    year: '1944',
    description: '4th Armored Division Shermans hold off Panther counterattack',
    environment: 'european_theater',
    enemyFormation: [
      { type: 'melee', level: 1, col: 0, row: 0 },
      { type: 'melee', level: 1, col: 3, row: 0 },
      { type: 'range', level: 1, col: 2, row: 1 },
    ],
  },
  {
    id: 3,
    name: 'Battle of Kursk',
    historicalBattle: 'Kursk',
    year: '1943',
    description: 'Largest tank battle in history: T-34 vs Tiger I',
    environment: 'european_theater',
    enemyFormation: [
      { type: 'melee', level: 2, col: 1, row: 0 },
      { type: 'range', level: 1, col: 0, row: 1 },
      { type: 'range', level: 1, col: 3, row: 1 },
    ],
  },
  {
    id: 4,
    name: 'Peace for Galilee',
    historicalBattle: 'Lebanon 1982',
    year: '1982',
    description: 'First combat use of Israeli Merkava vs Syrian T-62',
    environment: 'urban_rubble',
    enemyFormation: [
      { type: 'melee', level: 2, col: 0, row: 0 },
      { type: 'melee', level: 2, col: 3, row: 0 },
      { type: 'range', level: 1, col: 1, row: 1 },
      { type: 'range', level: 2, col: 2, row: 1 },
    ],
  },
  {
    id: 5,
    name: 'Valley of Tears',
    historicalBattle: 'Golan Heights 1973',
    year: '1973',
    description: '77 Israeli Centurions vs 500+ Syrian tanks',
    environment: 'desert_storm',
    enemyFormation: [
      { type: 'melee', level: 2, col: 0, row: 0 },
      { type: 'melee', level: 2, col: 3, row: 0 },
      { type: 'range', level: 2, col: 1, row: 1 },
      { type: 'range', level: 2, col: 2, row: 1 },
      { type: 'melee', level: 1, col: 2, row: 0 },
    ],
  },
  {
    id: 6,
    name: 'Battle of Medina Ridge',
    historicalBattle: 'Medina Ridge',
    year: '1991',
    description: 'M1A2 Abrams vs Republican Guard in night engagement',
    environment: 'night_battle',
    enemyFormation: [
      { type: 'melee', level: 3, col: 1, row: 0 },
      { type: 'melee', level: 2, col: 2, row: 0 },
      { type: 'range', level: 2, col: 0, row: 1 },
      { type: 'range', level: 2, col: 3, row: 1 },
      { type: 'range', level: 1, col: 1, row: 2 },
    ],
  },
  {
    id: 7,
    name: 'Battle of Fallujah',
    historicalBattle: 'Fallujah 2004',
    year: '2004',
    description: 'M1A2 in intense urban combat',
    environment: 'urban_rubble',
    enemyFormation: [
      { type: 'melee', level: 3, col: 0, row: 0 },
      { type: 'melee', level: 3, col: 2, row: 0 },
      { type: 'range', level: 2, col: 1, row: 1 },
      { type: 'range', level: 2, col: 3, row: 1 },
      { type: 'melee', level: 2, col: 3, row: 0 },
    ],
  },
  {
    id: 8,
    name: 'Villers-Bocage',
    historicalBattle: 'Normandy 1944',
    year: '1944',
    description: 'Tiger I vs Cromwells in hedgerow country',
    environment: 'european_theater',
    enemyFormation: [
      { type: 'melee', level: 3, col: 0, row: 0 },
      { type: 'melee', level: 3, col: 3, row: 0 },
      { type: 'range', level: 3, col: 1, row: 1 },
      { type: 'range', level: 3, col: 2, row: 1 },
      { type: 'melee', level: 2, col: 1, row: 0 },
      { type: 'range', level: 2, col: 2, row: 2 },
    ],
  },
  {
    id: 9,
    name: 'Operation Wrath of God',
    historicalBattle: 'Lebanon 2006',
    year: '2006',
    description: 'Merkava IV vs Hezbollah ATGMs',
    environment: 'urban_rubble',
    enemyFormation: [
      { type: 'melee', level: 4, col: 1, row: 0 },
      { type: 'melee', level: 3, col: 2, row: 0 },
      { type: 'range', level: 3, col: 0, row: 1 },
      { type: 'range', level: 3, col: 3, row: 1 },
      { type: 'range', level: 3, col: 1, row: 2 },
      { type: 'melee', level: 3, col: 3, row: 0 },
    ],
  },
  {
    id: 10,
    name: 'Prokhorovka — BOSS',
    historicalBattle: 'Prokhorovka 1943',
    year: '1943',
    description: 'Epic climax: all tank types, maximum difficulty',
    environment: 'european_theater',
    enemyFormation: [
      { type: 'melee', level: 4, col: 0, row: 0 },
      { type: 'melee', level: 4, col: 3, row: 0 },
      { type: 'range', level: 4, col: 1, row: 1 },
      { type: 'range', level: 4, col: 2, row: 1 },
      { type: 'melee', level: 3, col: 1, row: 0 },
      { type: 'range', level: 3, col: 2, row: 0 },
      { type: 'range', level: 3, col: 0, row: 2 },
    ],
  },
];

/** Flat EnemyFormation[][] used by useMergeTankGame (shape must not change) */
export const STAGES: EnemyFormation[][] = STAGE_INFO.map(s => s.enemyFormation);

export const STAGE_REWARDS = [50, 60, 70, 80, 90, 100, 110, 120, 130, 150];
