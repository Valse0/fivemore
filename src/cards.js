export const cards = [
  {
    id: "damage",
    type: "stat",
    title: "Sharp Rounds",
    description: "+4 bullet damage",
    maxLevel: 5,
    level: 0,
    apply: (weaponsState) => {
      weaponsState.damageBonus = (weaponsState.damageBonus || 0) + 4;
    }
  },
  {
    id: "fireRate",
    type: "stat",
    title: "Rapid Bolt",
    description: "+15% fire rate",
    maxLevel: 5,
    level: 0,
    apply: (weaponsState) => {
      weaponsState.fireIntervalBonus = (weaponsState.fireIntervalBonus || 0) + 0.06;
    }
  },
  {
    id: "moveSpeed",
    type: "stat",
    title: "Light Steps",
    description: "+20 movement speed",
    maxLevel: 5,
    level: 0,
    apply: (player) => {
      player.speed += 20;
    }
  },
  {
    id: "maxHp",
    type: "stat",
    title: "Tough Vest",
    description: "+25 Max HP & Heal +25",
    maxLevel: 5,
    level: 0,
    apply: (player) => {
      player.maxHp = (player.maxHp || 100) + 25;
      player.hp = Math.min(player.maxHp, player.hp + 25);
    }
  },
  {
    id: "pickupRadius",
    type: "stat",
    title: "Magnetic Grasp",
    description: "+35 gem collection radius",
    maxLevel: 5,
    level: 0,
    apply: (xpState) => {
      xpState.pickupRadiusBonus = (xpState.pickupRadiusBonus || 0) + 35;
    }
  },
  {
    id: "bulletCount",
    type: "stat",
    title: "Twin Shot",
    description: "+1 additional bullet per volley",
    maxLevel: 3,
    level: 0,
    apply: (weaponsState) => {
      weaponsState.bulletCount = (weaponsState.bulletCount || 1) + 1;
    }
  }
];

let lastSelectedCardIds = [];

export function resetCards() {
  for (const card of cards) card.level = 0;
  lastSelectedCardIds = [];
}

export function getRandomCards(count = 3) {
  const available = cards.filter(c => c.level < c.maxLevel);
  if (available.length === 0) return [];
  
  let pool = available.filter(c => !lastSelectedCardIds.includes(c.id));
  if (pool.length < count) {
    pool = available;
  }
  
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function applyCardUpgrade(cardId, player, weaponsState, xpState) {
  const card = cards.find(c => c.id === cardId);
  if (!card || card.level >= card.maxLevel) return;
  card.level += 1;
  lastSelectedCardIds = [card.id];
  
  if (card.id === "damage" || card.id === "fireRate" || card.id === "bulletCount") {
    card.apply(weaponsState);
  } else if (card.id === "moveSpeed" || card.id === "maxHp") {
    card.apply(player);
  } else if (card.id === "pickupRadius") {
    card.apply(xpState);
  }
}
