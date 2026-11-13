import { OBSTACLE_RADII, isInsideArena, clampArenaX, clampArenaY } from "./config.js";

const CELL_SIZE = 192;
const OBJECT_TYPES = ["crate", "barrel", "rock", "tree", "flowers"];

function objectInCell(gx, gy) {
  const hash = (gx * 73856093 ^ gy * 19349663) >>> 0;
  if (hash % 7 !== 0) return null;
  const type = OBJECT_TYPES[(hash >>> 4) % OBJECT_TYPES.length];
  if (type === "flowers") return null;
  const x = gx * CELL_SIZE + 96; const y = gy * CELL_SIZE + 96; const radius = OBSTACLE_RADII[type];
  if (!isInsideArena(x, y, radius)) return null;
  return { x, y, radius };
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
