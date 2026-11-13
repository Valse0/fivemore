export const MAX_ENEMIES = 150;
const CELL_SIZE = 96;
const HASH_SIZE = 257;
const TYPES = {
  walker: { hp: 36, speed: 43, radius: 16, xp: 1, scale: 1 },
  runner: { hp: 19, speed: 79, radius: 12, xp: 1, scale: 0.76 },
};
const enemies = Array.from({ length: MAX_ENEMIES }, () => ({ active: false, x: 0, y: 0, hp: 0, speed: 0, radius: 0, xp: 0, type: 0, angle: 0, next: -1, flash: 0 }));
const corpses = Array.from({ length: MAX_ENEMIES }, () => ({ active: false, x: 0, y: 0, angle: 0, type: 0, life: 0 }));
const bucketHeads = new Int16Array(HASH_SIZE);
const typeIndex = { walker: 0, runner: 1 };
let spawnClock = 0;
let spawnOrdinal = 0;
let activeCount = 0;
let kills = 0;

function hash(x, y) {
  const cx = Math.floor(x / CELL_SIZE);
  const cy = Math.floor(y / CELL_SIZE);
  const value = ((cx * 73856093) ^ (cy * 19349663)) % HASH_SIZE;
  return value < 0 ? value + HASH_SIZE : value;
}

export function resetEnemies() {
  for (let i = 0; i < MAX_ENEMIES; i += 1) enemies[i].active = false;
  for (let i = 0; i < MAX_ENEMIES; i += 1) corpses[i].active = false;
  spawnClock = 0; spawnOrdinal = 0; activeCount = 0; kills = 0;
}

function spawn(player, width, height, time) {
  let enemy = null;
  for (let i = 0; i < MAX_ENEMIES; i += 1) if (!enemies[i].active) { enemy = enemies[i]; break; }
  if (!enemy) return;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.hypot(width, height) * 0.58;
  const type = time >= 60 && spawnOrdinal % 4 === 0 ? 1 : 0;
  const stats = TYPES[type ? "runner" : "walker"];
  enemy.active = true;
  enemy.x = player.x + Math.cos(angle) * distance;
  enemy.y = player.y + Math.sin(angle) * distance;
  enemy.hp = stats.hp; enemy.speed = stats.speed; enemy.radius = stats.radius; enemy.xp = stats.xp;
  enemy.type = type; enemy.angle = 0; enemy.next = -1;
  enemy.flash = 0;
  spawnOrdinal += 1; activeCount += 1;
}

export function rebuildEnemyHash() {
  bucketHeads.fill(-1);
  for (let i = 0; i < MAX_ENEMIES; i += 1) {
    const enemy = enemies[i];
    if (!enemy.active) continue;
    const bucket = hash(enemy.x, enemy.y);
    enemy.next = bucketHeads[bucket];
    bucketHeads[bucket] = i;
  }
}

export function forNearby(x, y, visit) {
  const baseX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
  const baseY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
  for (let cy = -1; cy <= 1; cy += 1) for (let cx = -1; cx <= 1; cx += 1) {
    let index = bucketHeads[hash(baseX + cx * CELL_SIZE, baseY + cy * CELL_SIZE)];
    while (index !== -1) { visit(enemies[index], index); index = enemies[index].next; }
  }
}

export function damageEnemy(index, damage) {
  const enemy = enemies[index];
  if (!enemy || !enemy.active) return false;
  enemy.hp -= damage; enemy.flash = 0.06;
  if (enemy.hp > 0) return false;
  spawnParticles(enemy.x, enemy.y, 12, "blood");
  for (let i = 0; i < MAX_ENEMIES; i += 1) if (!corpses[i].active) { corpses[i].active = true; corpses[i].x = enemy.x; corpses[i].y = enemy.y; corpses[i].angle = enemy.angle; corpses[i].type = enemy.type; corpses[i].life = 0.5; break; }
  enemy.active = false; activeCount -= 1; kills += 1;
  return true;
}

export function updateEnemies(player, dt, time, width, height) {
  spawnClock -= dt;
  const interval = Math.max(0.34, 1.18 - Math.floor(time / 30) * 0.09);
  while (spawnClock <= 0 && activeCount < MAX_ENEMIES) { spawn(player, width, height, time); spawnClock += interval; }
  for (let i = 0; i < MAX_ENEMIES; i += 1) {
    const e = enemies[i];
    if (!e.active) continue;
    e.flash = Math.max(0, e.flash - dt);
    const dx = player.x - e.x; const dy = player.y - e.y;
    const distance = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    e.x += dx / distance * e.speed * dt;
    e.y += dy / distance * e.speed * dt;
  }
  rebuildEnemyHash();
}

export function drawEnemies(ctx, image, player, viewWidth, viewHeight, runnerImage) {
  for (let i = 0; i < MAX_ENEMIES; i += 1) {
    const corpse = corpses[i]; if (!corpse.active) continue;
    const x = corpse.x - player.x + viewWidth / 2; const y = corpse.y - player.y + viewHeight / 2;
    ctx.globalAlpha = corpse.life / 0.5; ctx.save(); ctx.translate(x, y); ctx.rotate(corpse.angle + Math.PI / 2);
    ctx.drawImage(corpse.type ? runnerImage : image, -30, -30, 60, 60); ctx.restore();
  }
  for (let i = 0; i < MAX_ENEMIES; i += 1) {
    const e = enemies[i];
    if (!e.active) continue;
    const x = e.x - player.x + viewWidth / 2;
    const y = e.y - player.y + viewHeight / 2;
    if (x < -56 || y < -56 || x > viewWidth + 56 || y > viewHeight + 56) continue;
    const sprite = e.type ? runnerImage : image;
    const size = 64 * (e.type ? TYPES.runner.scale : 1);
    if (e.flash > 0) ctx.globalAlpha = 0.45;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(e.angle + Math.PI / 2);
    ctx.drawImage(sprite || image, -size / 2, -size / 2, size, size); ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export function updateCorpses(dt) {
  for (let i = 0; i < MAX_ENEMIES; i += 1) if (corpses[i].active) { corpses[i].life -= dt; if (corpses[i].life <= 0) corpses[i].active = false; }
}

export function getEnemies() { return enemies; }
export function getEnemyCount() { return activeCount; }
export function getKillCount() { return kills; }
import { spawnParticles } from "./particles.js";
