export const ROOM_WIDTH = 1160;
export const WORLD_HEIGHT = 515;
export const LEGACY_ROOM_IDS = ['bedroom', 'lounge', 'dining', 'restroom', 'bathroom', 'games', 'ballroom', 'yard'] as const;
export const ROOM_IDS = [...LEGACY_ROOM_IDS, 'playground', 'basement', 'boutique', 'toyshop', 'icecream', 'beach', 'beach-shade'] as const;
export type RoomId = typeof ROOM_IDS[number];
export const DESTINATION_IDS = ['home', 'mall', 'beach'] as const;
export type DestinationId = typeof DESTINATION_IDS[number];
export type OutingId = Exclude<DestinationId, 'home'>;
export const WORLD_IDS = ['mansion', 'basement', 'mall', 'beach'] as const;
export type WorldId = typeof WORLD_IDS[number];
export const WORLDS: Record<WorldId, { destination: DestinationId; rooms: readonly RoomId[] }> = {
  mansion: { destination: 'home', rooms: [...LEGACY_ROOM_IDS, 'playground'] },
  basement: { destination: 'home', rooms: ['basement'] },
  mall: { destination: 'mall', rooms: ['boutique', 'toyshop', 'icecream'] },
  beach: { destination: 'beach', rooms: ['beach', 'beach-shade'] },
};
const ROOM_WORLDS: Record<RoomId, WorldId> = {
  bedroom: 'mansion', lounge: 'mansion', dining: 'mansion', restroom: 'mansion',
  bathroom: 'mansion', games: 'mansion', ballroom: 'mansion', yard: 'mansion',
  playground: 'mansion', basement: 'basement', boutique: 'mall', toyshop: 'mall',
  icecream: 'mall', beach: 'beach', 'beach-shade': 'beach',
};
export function worldForRoom(room: RoomId): WorldId { return ROOM_WORLDS[room]; }
export function destinationForRoom(room: RoomId): DestinationId { return WORLDS[worldForRoom(room)].destination; }
export function roomsForWorld(world: WorldId): readonly RoomId[] { return WORLDS[world].rooms; }
export function worldWidth(room: RoomId): number { return WORLDS[worldForRoom(room)].rooms.length * ROOM_WIDTH; }
export const PRINCESS_IDS = ['liora', 'mira', 'coral', 'flora', 'ruby', 'celeste', 'hazel', 'nova'] as const;
export type PrincessId = typeof PRINCESS_IDS[number];
export const NEED_IDS = ['satiety', 'energy', 'hygiene', 'toiletComfort', 'fun'] as const;
export type NeedId = typeof NEED_IDS[number];
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ActivityId = 'meal' | 'bed' | 'couch' | 'toilet' | 'bath' | 'wash' | 'toys' | 'draw' | 'book' | 'dance' | 'piano' | 'swing' | 'garden' | 'slide' | 'treehouse' | 'sandcastle' | 'shells' | 'splash' | 'potion' | 'icecream';
export const SHOP_IDS = ['outfits', 'toys', 'treats'] as const;
export type ShopId = typeof SHOP_IDS[number];
export const SHOPS: Record<ShopId, { room: RoomId; x: number; y: number; width: number; height: number; prop: string }> = {
  outfits: { room: 'boutique', x: 585, y: 475, width: 610, height: 330, prop: 'shop-boutique' },
  toys: { room: 'toyshop', x: 585, y: 475, width: 610, height: 320, prop: 'shop-toys' },
  treats: { room: 'icecream', x: 585, y: 475, width: 610, height: 310, prop: 'shop-icecream' },
};
export const RECIPE_IDS = ['starlight', 'blossom'] as const;
export type RecipeId = typeof RECIPE_IDS[number];
export const INGREDIENT_IDS = ['stardust', 'moonwater', 'petals', 'crystal', 'dewdrop'] as const;
export type IngredientId = typeof INGREDIENT_IDS[number];
export const RECIPES: Record<RecipeId, { ingredients: readonly IngredientId[]; color: number }> = {
  starlight: { ingredients: ['moonwater', 'stardust', 'crystal'], color: 0xc4a7e7 },
  blossom: { ingredients: ['dewdrop', 'petals', 'stardust'], color: 0xf1afbf },
};

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
export const ACTIVITIES: Record<ActivityId, { need: NeedId; target: number; duration: number; policy: 'care' | 'leisure' }> = {
  meal: { need: 'satiety', target: 95, duration: 8500, policy: 'care' },
  bed: { need: 'energy', target: 98, duration: 16000, policy: 'care' },
  couch: { need: 'energy', target: 76, duration: 9000, policy: 'care' },
  toilet: { need: 'toiletComfort', target: 98, duration: 6500, policy: 'care' },
  bath: { need: 'hygiene', target: 98, duration: 11000, policy: 'care' },
  wash: { need: 'hygiene', target: 85, duration: 6500, policy: 'care' },
  toys: { need: 'fun', target: 94, duration: 9000, policy: 'leisure' },
  draw: { need: 'fun', target: 95, duration: 10500, policy: 'leisure' },
  book: { need: 'fun', target: 92, duration: 9000, policy: 'leisure' },
  dance: { need: 'fun', target: 95, duration: 9000, policy: 'leisure' },
  piano: { need: 'fun', target: 95, duration: 10000, policy: 'leisure' },
  swing: { need: 'fun', target: 95, duration: 9000, policy: 'leisure' },
  garden: { need: 'fun', target: 95, duration: 10500, policy: 'leisure' },
  slide: { need: 'fun', target: 95, duration: 10000, policy: 'leisure' },
  treehouse: { need: 'fun', target: 96, duration: 12000, policy: 'leisure' },
  sandcastle: { need: 'fun', target: 95, duration: 10000, policy: 'leisure' },
  shells: { need: 'fun', target: 94, duration: 8500, policy: 'leisure' },
  splash: { need: 'fun', target: 96, duration: 10000, policy: 'leisure' },
  potion: { need: 'fun', target: 96, duration: 13000, policy: 'leisure' },
  icecream: { need: 'satiety', target: 85, duration: 6000, policy: 'care' },
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
  appearance?: 'snack' | 'music-box' | 'hammock';
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
  { id: 'royal-slide', room: 'playground', activity: 'slide', x: 310, y: 480, width: 400, height: 310, slots: [0] },
  { id: 'storybook-treehouse', room: 'playground', activity: 'treehouse', x: 840, y: 480, width: 400, height: 360, slots: [0] },
  { id: 'cauldron-left', room: 'basement', activity: 'potion', x: 320, y: 480, width: 360, height: 250, slots: [0] },
  { id: 'cauldron-right', room: 'basement', activity: 'potion', x: 835, y: 480, width: 360, height: 250, slots: [0] },
  { id: 'sandcastle-cove', room: 'beach', activity: 'sandcastle', x: 280, y: 480, width: 325, height: 175, slots: [-50, 50] },
  { id: 'shell-collection', room: 'beach', activity: 'shells', x: 845, y: 480, width: 295, height: 165, slots: [-45, 45] },
  { id: 'shallow-splash', room: 'beach-shade', activity: 'splash', x: 345, y: 480, width: 410, height: 250, slots: [-65, 65] },
  { id: 'palm-hammock', room: 'beach-shade', activity: 'couch', appearance: 'hammock', x: 905, y: 480, width: 360, height: 290, slots: [0] },
];

export function getStation(id: string | null | undefined): Station | undefined {
  return STATIONS.find(station => station.id === id);
}

export function roomIndex(room: RoomId): number {
  return WORLDS[worldForRoom(room)].rooms.indexOf(room);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function urgentNeed(needs: Record<NeedId, number>): NeedId | null {
  const priority: NeedId[] = ['toiletComfort', 'energy', 'satiety', 'hygiene', 'fun'];
  return priority.reduce<NeedId | null>((best, need) => needs[need] < 30 && (best === null || needs[need] < needs[best]) ? need : best, null);
}

export const CHARACTER_PARTS = ['hair', 'dress', 'seated', 'head', 'closed', 'pout', 'left-arm', 'right-arm', 'left-leg', 'right-leg'] as const;
export const PROP_TEXTURES = ['bed-back', 'bed-front', 'couch', 'book', 'meal-back', 'meal-front', 'snack-back', 'snack-front', 'toilet-open', 'toilet-closed', 'bath-back', 'bath-front', 'wash', 'toys', 'draw', 'dance', 'piano', 'music-box', 'swing', 'garden', 'slide-back', 'slide-front', 'treehouse-back', 'treehouse-front', 'cauldron-back', 'cauldron-front', 'sandcastle', 'shells', 'splash-back', 'splash-front', 'hammock', 'shop-boutique', 'shop-toys', 'shop-icecream'] as const;
export const ICON_TEXTURES = ['meal', 'moon', 'bubble', 'door', 'star', 'heart', 'coin', 'travel', 'stairs', 'wardrobe', 'bag', 'home', 'grab', 'stop', 'pause', 'play', 'album', 'check', 'cart', 'eat', 'sleep', 'bath', 'toilet', 'potion', ...INGREDIENT_IDS, ...RECIPE_IDS.map(id => `recipe-${id}`)] as const;
export const NEED_TEXTURES: Record<NeedId, string> = { satiety: 'meal', energy: 'moon', hygiene: 'bubble', toiletComfort: 'door', fun: 'star' };
export const ACTIVITY_PICTURES: Record<ActivityId, string> = {
  meal: 'icons/eat.svg', bed: 'icons/sleep.svg', couch: 'props/couch.svg',
  toilet: 'icons/toilet.svg', bath: 'icons/bath.svg', wash: 'props/wash.svg',
  toys: 'items/plush-dragon.svg', draw: 'props/draw.svg', book: 'props/book.svg',
  dance: 'props/dance.svg', piano: 'props/piano.svg', swing: 'props/swing.svg',
  garden: 'props/garden.svg', slide: 'props/slide-back.svg', treehouse: 'props/treehouse-back.svg',
  sandcastle: 'props/sandcastle.svg', shells: 'props/shells.svg', splash: 'props/splash-back.svg',
  potion: 'icons/potion.svg', icecream: 'items/strawberry.svg',
};
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export function artUrl(path: string): string {
  return `${BASE_PATH}/games/princess-mansion/${path}`;
}
