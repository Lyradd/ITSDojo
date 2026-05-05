/**
 * Configuration for Shop items and prices
 */
export const SHOP_PRICES = {
  STREAK_FREEZE: 150,
  SHIELD_PACK: 400,
  XP_BOOSTER: 100,
  GEM_MINER: 1000,
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
    title: 'Shield Pack',
    type: 'shield-3x',
    cost: SHOP_PRICES.SHIELD_PACK,
  },
  {
    id: 'multiplier',
    title: 'XP Booster (1 Jam)',
    type: 'multiplier',
    cost: SHOP_PRICES.XP_BOOSTER,
  },
  {
    id: 'gem-miner',
    title: 'Gem Miner (Permanen)',
    type: 'gem-miner',
    cost: SHOP_PRICES.GEM_MINER,
  }
];
