import { HEALTH_PICKUP_CONFIG, PLAYER_MAX_HP, snapWorldPixel, snapWorldSize, USE_V2_ASSETS } from "./config.js";
import { sprites, drawFrame } from "./assets.js";

const MAX_HEALTH_PICKUPS = 32;
const pickups = Array.from({ length: MAX_HEALTH_PICKUPS }, () => ({ active: false, x: 0, y: 0, amount: 0, age: 0, life: 0 }));

export function resetHealthPickups() {
  for (let i = 0; i < MAX_HEALTH_PICKUPS; i += 1) pickups[i].active = false;
}

export function dropHealthPickup(x, y, amount) {
  for (let i = 0; i < MAX_HEALTH_PICKUPS; i += 1) {
    const pickup = pickups[i]; if (pickup.active) continue;
    pickup.active = true; pickup.x = x; pickup.y = y; pickup.amount = amount;
    pickup.age = 0; pickup.life = HEALTH_PICKUP_CONFIG.lifetime;
    return true;
  }
  return false;
}

export function updateHealthPickups(player, dt) {
  for (let i = 0; i < MAX_HEALTH_PICKUPS; i += 1) {
    const pickup = pickups[i]; if (!pickup.active) continue;
    pickup.age += dt; pickup.life -= dt;
    const dx = player.x - pickup.x; const dy = player.y - pickup.y;
    if (dx * dx + dy * dy <= HEALTH_PICKUP_CONFIG.pickupRadius ** 2 && player.hp < PLAYER_MAX_HP) {
      player.hp = Math.min(PLAYER_MAX_HP, player.hp + pickup.amount);
      pickup.active = false;
    } else if (pickup.life <= 0) pickup.active = false;
  }
}

export function drawHealthPickups(ctx, player, width, height) {
  const left = player.x - width / 2 - HEALTH_PICKUP_CONFIG.drawSize;
  const right = player.x + width / 2 + HEALTH_PICKUP_CONFIG.drawSize;
  const top = player.y - height / 2 - HEALTH_PICKUP_CONFIG.drawSize;
  const bottom = player.y + height / 2 + HEALTH_PICKUP_CONFIG.drawSize;
  const size = snapWorldSize(HEALTH_PICKUP_CONFIG.drawSize);
  for (let i = 0; i < MAX_HEALTH_PICKUPS; i += 1) {
    const pickup = pickups[i]; if (!pickup.active || pickup.x < left || pickup.x > right || pickup.y < top || pickup.y > bottom) continue;
    const frame = HEALTH_PICKUP_CONFIG.firstFrame + Math.floor(pickup.age * HEALTH_PICKUP_CONFIG.fps) % (HEALTH_PICKUP_CONFIG.lastFrame - HEALTH_PICKUP_CONFIG.firstFrame + 1);
    if (USE_V2_ASSETS) drawFrame(ctx, sprites.pickupIcons, frame, snapWorldPixel(pickup.x - size / 2), snapWorldPixel(pickup.y - size / 2), size, size, HEALTH_PICKUP_CONFIG.frameSize);
  }
}

export function getHealthPickupCount() {
  let count = 0; for (let i = 0; i < MAX_HEALTH_PICKUPS; i += 1) if (pickups[i].active) count += 1;
  return count;
}
