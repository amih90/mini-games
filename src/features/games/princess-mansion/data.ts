export const ROOM_WIDTH = 1160;
export const WORLD_HEIGHT = 515;
export const ROOM_IDS = ['bedroom', 'lounge', 'dining', 'restroom', 'bathroom', 'games', 'ballroom', 'yard'] as const;
export type RoomId = typeof ROOM_IDS[number];
export const PRINCESS_IDS = ['liora', 'mira', 'coral', 'flora', 'ruby', 'celeste', 'hazel', 'nova'] as const;
export type PrincessId = typeof PRINCESS_IDS[number];
export const NEED_IDS = ['satiety', 'energy', 'hygiene', 'toiletComfort', 'fun'] as const;
export type NeedId = typeof NEED_IDS[number];
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ActivityId = 'meal' | 'bed' | 'couch' | 'toilet' | 'bath' | 'wash' | 'toys' | 'draw' | 'book' | 'dance' | 'piano' | 'swing' | 'garden';

export const PRINCESSES: Record<PrincessId, { color: string; favorite: ActivityId; invitation: number }> = {
  liora: { color: '#e5a18b', favorite: 'meal', invitation: 0 },
  mira: { color: '#b7a0cf', favorite: 'book', invitation: 4 },
  coral: { color: '#79bebc', favorite: 'bath', invitation: 10 },
  flora: { color: '#d595a5', favorite: 'garden', invitation: 18 },
  ruby: { color: '#c97582', favorite: 'toys', invitation: 28 },
  celeste: { color: '#809fc9', favorite: 'piano', invitation: 42 },
  hazel: { color: '#97b592', favorite: 'swing', invitation: 60 },
  nova: { color: '#ab93c4', favorite: 'draw', invitation: 82 },
};

export const DIFFICULTIES: Record<Difficulty, { decay: number; duration: number }> = {
  easy: { decay: 0.6, duration: 0.85 },
  medium: { decay: 1, duration: 1 },
  hard: { decay: 1.4, duration: 1.15 },
};

export const DECAY: Record<NeedId, number> = { satiety: 0.06, energy: 0.05, hygiene: 0.035, toiletComfort: 0.07, fun: 0.06 };
export const ACTIVITIES: Record<ActivityId, { need: NeedId; target: number; duration: number }> = {
  meal: { need: 'satiety', target: 95, duration: 8500 },
  bed: { need: 'energy', target: 98, duration: 16000 },
  couch: { need: 'energy', target: 76, duration: 9000 },
  toilet: { need: 'toiletComfort', target: 98, duration: 6500 },
  bath: { need: 'hygiene', target: 98, duration: 11000 },
  wash: { need: 'hygiene', target: 85, duration: 6500 },
  toys: { need: 'fun', target: 94, duration: 9000 },
  draw: { need: 'fun', target: 95, duration: 10500 },
  book: { need: 'fun', target: 92, duration: 9000 },
  dance: { need: 'fun', target: 95, duration: 9000 },
  piano: { need: 'fun', target: 95, duration: 10000 },
  swing: { need: 'fun', target: 95, duration: 9000 },
  garden: { need: 'fun', target: 95, duration: 10500 },
};

export interface Station {
  id: string;
  room: RoomId;
  activity: ActivityId;
  x: number;
  y: number;
  width: number;
  height: number;
  slots: number[];
  appearance?: 'snack' | 'music-box';
}

export const STATIONS: readonly Station[] = [
  ...[190, 445, 700, 955].map((x, index): Station => ({ id: `bed-${index}`, room: 'bedroom', activity: 'bed', x, y: 480, width: 238, height: 210, slots: [0] })),
  { id: 'couch-left', room: 'lounge', activity: 'couch', x: 245, y: 480, width: 300, height: 168, slots: [-55, 55] },
  { id: 'reading', room: 'lounge', activity: 'book', x: 820, y: 480, width: 310, height: 172, slots: [-55, 55] },
  { id: 'royal-table', room: 'dining', activity: 'meal', x: 660, y: 470, width: 520, height: 200, slots: [-165, -55, 55, 165] },
  { id: 'snack-table', room: 'dining', activity: 'meal', appearance: 'snack', x: 180, y: 465, width: 205, height: 130, slots: [0] },
  { id: 'stall-left', room: 'restroom', activity: 'toilet', x: 350, y: 470, width: 180, height: 270, slots: [0] },
  { id: 'stall-right', room: 'restroom', activity: 'toilet', x: 620, y: 470, width: 180, height: 270, slots: [0] },
  { id: 'handwash', room: 'restroom', activity: 'wash', x: 930, y: 470, width: 190, height: 230, slots: [0] },
  { id: 'bubble-bath', room: 'bathroom', activity: 'bath', x: 445, y: 475, width: 390, height: 255, slots: [0] },
  { id: 'grooming', room: 'bathroom', activity: 'wash', x: 930, y: 470, width: 200, height: 235, slots: [0] },
  { id: 'toy-castle', room: 'games', activity: 'toys', x: 280, y: 470, width: 320, height: 185, slots: [-55, 55] },
  { id: 'craft-easel', room: 'games', activity: 'draw', x: 795, y: 470, width: 250, height: 235, slots: [-42, 42] },
  { id: 'dance-floor', room: 'ballroom', activity: 'dance', x: 650, y: 480, width: 410, height: 100, slots: [-135, -45, 45, 135] },
  { id: 'royal-piano', room: 'ballroom', activity: 'piano', x: 235, y: 480, width: 280, height: 200, slots: [0] },
  { id: 'music-box', room: 'ballroom', activity: 'piano', appearance: 'music-box', x: 1010, y: 470, width: 170, height: 145, slots: [0] },
  { id: 'tree-swing', room: 'yard', activity: 'swing', x: 595, y: 475, width: 220, height: 310, slots: [0] },
  { id: 'flower-garden', room: 'yard', activity: 'garden', x: 200, y: 475, width: 290, height: 150, slots: [-50, 50] },
  { id: 'butterfly-garden', room: 'yard', activity: 'garden', x: 975, y: 475, width: 255, height: 145, slots: [-45, 45] },
];

export function getStation(id: string): Station | undefined {
  return STATIONS.find(station => station.id === id);
}

export function roomIndex(room: RoomId): number {
  return ROOM_IDS.indexOf(room);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function urgentNeed(needs: Record<NeedId, number>): NeedId | null {
  const priority: NeedId[] = ['toiletComfort', 'energy', 'satiety', 'hygiene', 'fun'];
  return priority.reduce<NeedId | null>((best, need) => needs[need] < 30 && (best === null || needs[need] < needs[best]) ? need : best, null);
}

export const CHARACTER_PARTS = ['hair', 'dress', 'seated', 'head', 'closed', 'pout', 'left-arm', 'right-arm', 'left-leg', 'right-leg'] as const;
export const PROP_TEXTURES = ['bed-back', 'bed-front', 'couch', 'book', 'meal-back', 'meal-front', 'snack-back', 'snack-front', 'toilet-open', 'toilet-closed', 'bath-back', 'bath-front', 'wash', 'toys', 'draw', 'dance', 'piano', 'music-box', 'swing', 'garden'] as const;
export const NEED_TEXTURES: Record<NeedId, string> = { satiety: 'meal', energy: 'moon', hygiene: 'bubble', toiletComfort: 'door', fun: 'star' };
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export function artUrl(path: string): string {
  return `${BASE_PATH}/games/princess-mansion/${path}`;
}
