/**
 * Configuration for Shop items and prices
 */
export const SHOP_PRICES = {
  STREAK_FREEZE: 150,
  SHIELD_PACK: 400,
  XP_BOOSTER: 100,
};

export const SHOP_ITEMS = [
  {
    id: 'freeze',
    title: 'Streak Freeze',
    type: 'freeze',
    cost: SHOP_PRICES.STREAK_FREEZE,
  },
  {
    id: 'shield-3x',
    title: 'Paket Shield (3x)',
    type: 'shield-3x',
    cost: SHOP_PRICES.SHIELD_PACK,
  },
  {
    id: 'multiplier',
    title: 'XP Booster (1 Jam)',
    type: 'multiplier',
    cost: SHOP_PRICES.XP_BOOSTER,
  }
];
