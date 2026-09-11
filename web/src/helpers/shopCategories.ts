import { Slot, SlotWithItem } from '../typings';
import { isSlotWithItem } from './index';

export type ShopCategoryMeta = {
  id: string;
  label: string;
};

const MELEE = new Set([
  'weapon_bat',
  'weapon_battleaxe',
  'weapon_bottle',
  'weapon_candycane',
  'weapon_crowbar',
  'weapon_dagger',
  'weapon_flashlight',
  'weapon_golfclub',
  'weapon_hammer',
  'weapon_hatchet',
  'weapon_knife',
  'weapon_knuckle',
  'weapon_machete',
  'weapon_nightstick',
  'weapon_poolcue',
  'weapon_stone_hatchet',
  'weapon_switchblade',
  'weapon_wrench',
]);

const LABELS: Record<string, string> = {
  armor: 'ARMOR',
  weapons: 'WEAPONS',
  melee: 'MELEE COMBAT',
  ammo: 'AMMO',
  magazines: 'MAGAZINES',
  attachments: 'ATTACHMENTS',
  food: 'FOOD',
  drinks: 'DRINKS',
  medical: 'MEDICAL',
  tools: 'TOOLS',
  general: 'GENERAL',
};

export const resolveItemCategory = (name: string, explicit?: string) => {
  if (explicit) return explicit.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes('armour') || n.includes('armor') || n.includes('vest') || n.includes('kevlar')) return 'armor';
  if (n.startsWith('ammo-') || n.endsWith('ammo') || n.includes('ammo')) return 'ammo';
  if (n.includes('clip') || n.includes('magazine') || n.startsWith('at_clip')) return 'magazines';
  if (n.startsWith('at_') || n.includes('suppressor') || n.includes('scope')) return 'attachments';
  if (MELEE.has(n) || n.includes('knife') || n.includes('baton')) return 'melee';
  if (n.startsWith('weapon_')) return 'weapons';
  if (n.includes('bandage') || n.includes('medikit') || n.includes('medkit') || n.includes('pill') || n.includes('firstaid')) return 'medical';
  if (n.includes('water') || n.includes('cola') || n.includes('coffee') || n.includes('beer') || n.includes('drink')) return 'drinks';
  if (n.includes('burger') || n.includes('sandwich') || n.includes('pizza') || n.includes('food') || n.includes('taco')) return 'food';
  if (n.includes('lockpick') || n.includes('repairkit') || n.includes('toolbox') || n.includes('wrench')) return 'tools';
  return 'general';
};

export const categoryLabel = (id: string, fallback?: string) => (fallback || LABELS[id] || id).toUpperCase();

export const collectShopCategories = (items: Slot[], configured?: ShopCategoryMeta[]) => {
  if (configured && configured.length > 0) {
    return configured.map((entry) => ({
      id: entry.id.toLowerCase(),
      label: categoryLabel(entry.id, entry.label),
    }));
  }
  const stock = items.filter((item): item is SlotWithItem => isSlotWithItem(item));
  const seen = new Map<string, ShopCategoryMeta>();
  for (let i = 0; i < stock.length; i++) {
    const id = resolveItemCategory(stock[i].name, stock[i].category);
    if (!seen.has(id)) seen.set(id, { id, label: categoryLabel(id) });
  }
  return Array.from(seen.values());
};
