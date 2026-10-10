import type { ShopId } from './data';

export const OUTFIT_IDS = ['rose-gala', 'seaside', 'forest-cape'] as const;
export type OutfitId = typeof OUTFIT_IDS[number];
export type OutfitSelection = 'original' | OutfitId;
export const TOY_IDS = ['plush-dragon', 'royal-train', 'bubble-wand'] as const;
export type ToyId = typeof TOY_IDS[number];
export type ToySelection = 'blocks' | ToyId;
export const TREAT_IDS = ['strawberry', 'vanilla', 'blueberry'] as const;
export type TreatId = typeof TREAT_IDS[number];
export type ItemId = OutfitId | ToyId | TreatId;
export type CatalogItem =
  | { id: OutfitId; shop: 'outfits'; price: number }
  | { id: ToyId; shop: 'toys'; price: number }
  | { id: TreatId; shop: 'treats'; price: number };

export const CATALOG: readonly CatalogItem[] = [
  { id: 'rose-gala', shop: 'outfits', price: 18 },
  { id: 'seaside', shop: 'outfits', price: 24 },
  { id: 'forest-cape', shop: 'outfits', price: 30 },
  { id: 'plush-dragon', shop: 'toys', price: 10 },
  { id: 'royal-train', shop: 'toys', price: 14 },
  { id: 'bubble-wand', shop: 'toys', price: 18 },
  { id: 'strawberry', shop: 'treats', price: 4 },
  { id: 'vanilla', shop: 'treats', price: 5 },
  { id: 'blueberry', shop: 'treats', price: 6 },
];
export const WELCOME_COINS = 10;
export const CARE_COINS = 3;
export const FAVORITE_COINS = 4;
export const MAX_TREATS = 99;
export const TREAT_COLORS: Record<TreatId, number> = { strawberry: 0xf3a9bd, vanilla: 0xffefd0, blueberry: 0xbda7df };
export const OUTFIT_PARTS = ['dress', 'seated', 'left-arm', 'right-arm', 'portrait'] as const;
export function getItem(id: string): CatalogItem | undefined { return CATALOG.find(item => item.id === id); }
export function shopItems(shop: ShopId): readonly CatalogItem[] { return CATALOG.filter(item => item.shop === shop); }
export function portraitPath(id: string, outfit: OutfitSelection = 'original'): string {
  return `characters/${id}${outfit === 'original' ? '' : `-${outfit}`}-portrait.svg`;
}
