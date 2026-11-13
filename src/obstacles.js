import { OBSTACLE_RADII, ARENA_W, ARENA_H, BREAKABLE_CONFIG, isInsideArena, clampArenaX, clampArenaY } from "./config.js";

const CELL_SIZE = 192;
const OBJECT_TYPES = ["crate", "barrel", "rock", "tree", "flowers"];
const OBJECT_FRAME_SIZES = { crate: 48, barrel: 48, rock: 48, tree: 96, flowers: 24 };
const MIN_GX = Math.floor(-ARENA_W / 2 / CELL_SIZE) - 1;
const MAX_GX = Math.ceil(ARENA_W / 2 / CELL_SIZE) + 1;
const MIN_GY = Math.floor(-ARENA_H / 2 / CELL_SIZE) - 1;
const MAX_GY = Math.ceil(ARENA_H / 2 / CELL_SIZE) + 1;
const GRID_WIDTH = MAX_GX - MIN_GX + 1;
const worldObjects = Array(GRID_WIDTH * (MAX_GY - MIN_GY + 1)).fill(null);

function objectSlot(gx, gy) {
  if (gx < MIN_GX || gx > MAX_GX || gy < MIN_GY || gy > MAX_GY) return -1;
  return (gy - MIN_GY) * GRID_WIDTH + gx - MIN_GX;
}

for (let gy = MIN_GY; gy <= MAX_GY; gy += 1) for (let gx = MIN_GX; gx <= MAX_GX; gx += 1) {
  const hash = (gx * 73856093 ^ gy * 19349663) >>> 0;
  if (hash % 7 !== 0) continue;
  // Keep one deterministic barrel in the arena; the hash otherwise yields none in this bounds.
  const type = gx === -4 && gy === 4 ? "barrel" : OBJECT_TYPES[(hash >>> 4) % OBJECT_TYPES.length];
  const x = gx * CELL_SIZE + 96; const y = gy * CELL_SIZE + 96;
  if (!isInsideArena(x, y, OBJECT_FRAME_SIZES[type] / 2)) continue;
  const breakable = BREAKABLE_CONFIG[type];
  worldObjects[objectSlot(gx, gy)] = {
    type, x, y, radius: OBSTACLE_RADII[type] || 0, angle: 0,
    active: true, health: breakable?.hits || 0, maxHealth: breakable?.hits || 0,
    destroyed: false, effectTimer: 0, burnmark: false, blastApplied: false, pickupDropped: false,
  };
}

export function getWorldObjectAt(gx, gy) {
  const slot = objectSlot(gx, gy);
  return slot < 0 ? null : worldObjects[slot];
}

export function getWorldObjects() { return worldObjects; }

export function resetWorldObjects() {
  for (let i = 0; i < worldObjects.length; i += 1) {
    const object = worldObjects[i]; if (!object) continue;
    const breakable = BREAKABLE_CONFIG[object.type];
    object.active = true; object.health = breakable?.hits || 0; object.destroyed = false;
    object.effectTimer = 0; object.burnmark = false; object.blastApplied = false; object.pickupDropped = false;
  }
}

export function updateWorldObjectEffects(dt) {
  for (let i = 0; i < worldObjects.length; i += 1) {
    const object = worldObjects[i]; if (object?.effectTimer > 0) object.effectTimer = Math.max(0, object.effectTimer - dt);
  }
}

export function damageBreakableAt(x, y, radius) {
  const margin = radius + 48;
  const minX = Math.floor((x - margin) / CELL_SIZE); const maxX = Math.floor((x + margin) / CELL_SIZE);
  const minY = Math.floor((y - margin) / CELL_SIZE); const maxY = Math.floor((y + margin) / CELL_SIZE);
  for (let gy = minY; gy <= maxY; gy += 1) for (let gx = minX; gx <= maxX; gx += 1) {
    const object = getWorldObjectAt(gx, gy);
    if (!object?.active || !BREAKABLE_CONFIG[object.type]) continue;
    const dx = x - object.x; const dy = y - object.y; const combined = radius + object.radius;
    if (dx * dx + dy * dy > combined * combined) continue;
    object.health -= 1;
    if (object.health <= 0) {
      object.active = false; object.destroyed = true;
      object.effectTimer = object.type === "crate" ? BREAKABLE_CONFIG.crate.breakDuration : BREAKABLE_CONFIG.barrel.explosionDuration;
      if (object.type === "barrel") object.burnmark = true;
    }
    return object;
  }
  return null;
}

function objectInCell(gx, gy) {
  const object = getWorldObjectAt(gx, gy);
  return object?.active && object.radius ? object : null;
}

function collides(x, y, radius) {
  const minX = Math.floor((x - radius - 20) / CELL_SIZE);
  const maxX = Math.floor((x + radius + 20) / CELL_SIZE);
  const minY = Math.floor((y - radius - 20) / CELL_SIZE);
  const maxY = Math.floor((y + radius + 20) / CELL_SIZE);
  for (let gy = minY; gy <= maxY; gy += 1) {
    for (let gx = minX; gx <= maxX; gx += 1) {
      const obstacle = objectInCell(gx, gy);
      if (!obstacle) continue;
      const dx = x - obstacle.x;
      const dy = y - obstacle.y;
      const combined = radius + obstacle.radius;
      if (dx * dx + dy * dy < combined * combined) return true;
    }
  }
  return false;
}

export function segmentBlockedByObstacle(x1, y1, x2, y2, radius = 0) {
  const bounds = 20 + radius;
  const minX = Math.floor((Math.min(x1, x2) - bounds) / CELL_SIZE);
  const maxX = Math.floor((Math.max(x1, x2) + bounds) / CELL_SIZE);
  const minY = Math.floor((Math.min(y1, y2) - bounds) / CELL_SIZE);
  const maxY = Math.floor((Math.max(y1, y2) + bounds) / CELL_SIZE);
  const dx = x2 - x1; const dy = y2 - y1; const lengthSq = dx * dx + dy * dy || 1;
  for (let gy = minY; gy <= maxY; gy += 1) for (let gx = minX; gx <= maxX; gx += 1) {
    const obstacle = objectInCell(gx, gy);
    if (!obstacle) continue;
    const t = Math.max(0, Math.min(1, ((obstacle.x - x1) * dx + (obstacle.y - y1) * dy) / lengthSq));
    const nearestX = x1 + dx * t; const nearestY = y1 + dy * t;
    if ((nearestX - obstacle.x) ** 2 + (nearestY - obstacle.y) ** 2 < (obstacle.radius + radius) ** 2) return true;
  }
  return false;
}

export function moveCircle(entity, dx, dy, radius) {
  const nextX = clampArenaX(entity.x + dx, radius);
  if (!collides(nextX, entity.y, radius)) entity.x = nextX;
  const nextY = clampArenaY(entity.y + dy, radius);
  if (!collides(entity.x, nextY, radius)) entity.y = nextY;
}
