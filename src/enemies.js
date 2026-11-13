import { quantizeDirection, snapWorldPixel, snapWorldSize, DRAW_SIZES, USE_V2_ASSETS, ENEMY_CONFIG, ENEMY_ATTACK_ANIMATIONS, SPITTER_CONFIG, BOSS_SPAWN_TIME, clampArenaX, clampArenaY } from "./config.js";
import { sprites, drawFrame, frameCount } from "./assets.js";
import { moveCircle, segmentBlockedByObstacle } from "./obstacles.js";

export const MAX_ENEMIES = 150;
const CELL_SIZE = 96;
const HASH_SIZE = 257;
const TYPE_NAMES = ["walker", "runner", "tank", "spitter", "boss"];
const enemies = Array.from({ length: MAX_ENEMIES }, () => ({ active: false, x: 0, y: 0, hp: 0, speed: 0, damage: 0, radius: 0, xp: 0, type: 0, angle: 0, next: -1, flash: 0, spitClock: 0, attackTimer: 0 }));
const corpses = Array.from({ length: MAX_ENEMIES }, () => ({ active: false, x: 0, y: 0, angle: 0, type: 0, life: 0, animation: 0 }));
const MAX_SPITS = 48;
const spits = Array.from({ length: MAX_SPITS }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
const bucketHeads = new Int16Array(HASH_SIZE);
let spawnClock = 0;
let spawnOrdinal = 0;
let activeCount = 0;
let kills = 0;
let animationTime = 0;
let bossSpawned = false;
let spitDamageCallback = null;
let spitFrameTime = 0;

function allocateEnemy(typeName, x, y) {
  let enemy = null;
  for (let i = 0; i < MAX_ENEMIES; i += 1) if (!enemies[i].active) { enemy = enemies[i]; break; }
  if (!enemy) return null;
  const stats = ENEMY_CONFIG[typeName];
  enemy.active = true; enemy.x = x; enemy.y = y;
  enemy.hp = stats.hp; enemy.speed = stats.speed; enemy.damage = stats.damage;
  enemy.radius = stats.radius; enemy.xp = stats.xp; enemy.type = stats.id;
  enemy.angle = 0; enemy.next = -1; enemy.flash = 0; enemy.spitClock = SPITTER_CONFIG.attackInterval; enemy.attackTimer = 0;
  activeCount += 1;
  return enemy;
}

function hash(x, y) {
  const cx = Math.floor(x / CELL_SIZE);
  const cy = Math.floor(y / CELL_SIZE);
  const value = ((cx * 73856093) ^ (cy * 19349663)) % HASH_SIZE;
  return value < 0 ? value + HASH_SIZE : value;
}

export function resetEnemies() {
  for (let i = 0; i < MAX_ENEMIES; i += 1) enemies[i].active = false;
  for (let i = 0; i < MAX_ENEMIES; i += 1) corpses[i].active = false;
  for (let i = 0; i < MAX_SPITS; i += 1) spits[i].active = false;
  spawnClock = 0; spawnOrdinal = 0; activeCount = 0; kills = 0; bossSpawned = false; spitFrameTime = 0;
}

function chooseSpawnType(time) {
  let totalWeight = 0;
  for (const stats of Object.values(ENEMY_CONFIG)) if (stats.spawnWeight > 0 && stats.startTime <= time) totalWeight += stats.spawnWeight;
  let choice = Math.random() * totalWeight;
  for (const [name, stats] of Object.entries(ENEMY_CONFIG)) {
    if (stats.spawnWeight <= 0 || stats.startTime > time) continue;
    choice -= stats.spawnWeight;
    if (choice < 0) return name;
  }
  return "walker";
}

function spawn(player, width, height, time, typeName = chooseSpawnType(time), position = null) {
  const angle = Math.random() * Math.PI * 2;
  const distance = typeName === "boss" ? Math.min(width, height) * 0.3 : Math.hypot(width, height) * 0.58;
  const stats = ENEMY_CONFIG[typeName];
  const x = clampArenaX(position?.x ?? player.x + Math.cos(angle) * distance, stats.radius);
  const y = clampArenaY(position?.y ?? player.y + Math.sin(angle) * distance, stats.radius);
  const enemy = allocateEnemy(typeName, x, y);
  if (!enemy) return null;
  spawnOrdinal += 1;
  return enemy;
}

function fireSpit(enemy, player, dx, dy, distance) {
  let spit = null;
  for (let i = 0; i < MAX_SPITS; i += 1) if (!spits[i].active) { spit = spits[i]; break; }
  if (!spit) return;
  const angle = Math.atan2(dy, dx); const ux = dx / distance; const uy = dy / distance;
  spit.active = true;
  spit.x = enemy.x + ux * (enemy.radius + SPITTER_CONFIG.spitRadius);
  spit.y = enemy.y + uy * (enemy.radius + SPITTER_CONFIG.spitRadius);
  spit.vx = ux * SPITTER_CONFIG.spitSpeed; spit.vy = uy * SPITTER_CONFIG.spitSpeed; spit.life = 3;
}

function pointSegmentDistanceSquared(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1; const dy = y2 - y1; const lengthSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const x = x1 + dx * t; const y = y1 + dy * t;
  return (px - x) ** 2 + (py - y) ** 2;
}

function updateSpits(player, dt) {
  for (let i = 0; i < MAX_SPITS; i += 1) {
    const spit = spits[i]; if (!spit.active) continue;
    const oldX = spit.x; const oldY = spit.y;
    const nextX = oldX + spit.vx * dt; const nextY = oldY + spit.vy * dt;
    spit.life -= dt;
    if (!SPITTER_CONFIG.spitPassesObstacles && segmentBlockedByObstacle(oldX, oldY, nextX, nextY, SPITTER_CONFIG.spitRadius)) { spit.active = false; continue; }
    if (pointSegmentDistanceSquared(player.x, player.y, oldX, oldY, nextX, nextY) <= (SPITTER_CONFIG.spitRadius + 14) ** 2) {
      if (spitDamageCallback) spitDamageCallback(SPITTER_CONFIG.spitDamage, { x: oldX, y: oldY, angle: Math.atan2(-spit.vy, -spit.vx), active: true });
      spit.active = false; continue;
    }
    spit.x = nextX; spit.y = nextY;
    if (spit.life <= 0) spit.active = false;
  }
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
  for (let i = 0; i < MAX_ENEMIES; i += 1) if (!corpses[i].active) { corpses[i].active = true; corpses[i].x = enemy.x; corpses[i].y = enemy.y; corpses[i].angle = enemy.angle; corpses[i].type = enemy.type; corpses[i].life = 0.5; corpses[i].animation = 0; break; }
  enemy.active = false; activeCount -= 1; kills += 1;
  return true;
}

export function updateEnemies(player, dt, time, width, height, onPlayerDamage = null) {
  animationTime += dt; spitFrameTime += dt; spitDamageCallback = onPlayerDamage;
  spawnClock -= dt;
  const interval = Math.max(0.34, 1.18 - Math.floor(time / 30) * 0.09);
  if (!bossSpawned && time >= BOSS_SPAWN_TIME && activeCount < MAX_ENEMIES) bossSpawned = Boolean(spawn(player, width, height, time, "boss"));
  while (spawnClock <= 0 && activeCount < MAX_ENEMIES) { spawn(player, width, height, time); spawnClock += interval; }
  for (let i = 0; i < MAX_ENEMIES; i += 1) {
    const e = enemies[i];
    if (!e.active) continue;
    e.flash = Math.max(0, e.flash - dt);
    e.attackTimer = Math.max(0, e.attackTimer - dt);
    const dx = player.x - e.x; const dy = player.y - e.y;
    const distance = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    const typeName = TYPE_NAMES[e.type];
    if (typeName === "spitter") {
      e.spitClock -= dt;
      const offset = distance - SPITTER_CONFIG.preferredDistance;
      if (Math.abs(offset) > 18) {
        const direction = offset < 0 ? -1 : 1;
        moveCircle(e, dx / distance * e.speed * dt * direction, dy / distance * e.speed * dt * direction, e.radius);
      }
      if (distance <= SPITTER_CONFIG.attackRange && e.spitClock <= 0) { fireSpit(e, player, dx, dy, distance); e.spitClock = SPITTER_CONFIG.attackInterval; }
    } else moveCircle(e, dx / distance * e.speed * dt, dy / distance * e.speed * dt, e.radius);
  }
  updateSpits(player, dt);
  rebuildEnemyHash();
}

export function drawEnemies(ctx, image, player, viewWidth, viewHeight, runnerImage) {
  for (let i = 0; i < MAX_ENEMIES; i += 1) {
    const corpse = corpses[i]; if (!corpse.active) continue;
    const x = snapWorldPixel(corpse.x); const y = snapWorldPixel(corpse.y);
    const name = TYPE_NAMES[corpse.type] || "walker";
    const sprite = sprites[name];
    const size = snapWorldSize(DRAW_SIZES[name]);
    ctx.globalAlpha = corpse.life / 0.5; ctx.save(); ctx.translate(x, y);
    if (USE_V2_ASSETS) {
      const count = frameCount(sprite); const deathStart = Math.max(0, count - 3);
      if (Math.cos(corpse.angle) < 0) ctx.scale(-1, 1);
      drawFrame(ctx, sprite, Math.min(count-1, deathStart + Math.floor(corpse.animation * 8)), -size / 2, -size / 2, size, size);
    } else {
      const legacySize=snapWorldSize(60); ctx.rotate(quantizeDirection(corpse.angle+Math.PI/2));
      ctx.drawImage(corpse.type ? runnerImage : image, -legacySize/2, -legacySize/2, legacySize, legacySize);
    }
    ctx.restore();
  }
  for (let i = 0; i < MAX_ENEMIES; i += 1) {
    const e = enemies[i];
    if (!e.active) continue;
    const x = snapWorldPixel(e.x);
    const y = snapWorldPixel(e.y);
    if (x < player.x - viewWidth / 2 - 56 || y < player.y - viewHeight / 2 - 56
      || x > player.x + viewWidth / 2 + 56 || y > player.y + viewHeight / 2 + 56) continue;
    const name = TYPE_NAMES[e.type] || "walker";
    const sprite = USE_V2_ASSETS ? sprites[name] : (e.type ? runnerImage : image);
    const size = USE_V2_ASSETS ? snapWorldSize(DRAW_SIZES[name] * ENEMY_CONFIG[name].scale)
      : snapWorldSize(64 * ENEMY_CONFIG[name].scale);
    if (e.flash > 0) ctx.globalAlpha = 0.45;
    ctx.save(); ctx.translate(x, y);
    if (USE_V2_ASSETS) {
      if (Math.cos(e.angle) < 0) ctx.scale(-1, 1);
      const attack = ENEMY_ATTACK_ANIMATIONS[name];
      const attackSprite = attack && sprites[attack.sprite];
      if (attack && e.attackTimer > 0 && attackSprite?.complete && attackSprite.naturalWidth) {
        const duration = (attack.lastFrame - attack.firstFrame + 1) / attack.fps;
        const elapsed = duration - e.attackTimer;
        const frame = attack.firstFrame + Math.min(attack.lastFrame - attack.firstFrame, Math.floor(elapsed * attack.fps));
        drawFrame(ctx, attackSprite, frame, -size / 2, -size / 2, size, size, attack.frameSize);
      } else {
        const frames = frameCount(sprite); const frame = Math.floor(animationTime * 8) % Math.max(1, frames - 2);
        drawFrame(ctx, sprite, frame, -size / 2, -size / 2, size, size);
      }
    } else {
      ctx.rotate(quantizeDirection(e.angle+Math.PI/2)); ctx.drawImage(sprite || image, -size/2, -size/2, size, size);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export function drawSpits(ctx, player, width, height) {
  const left = player.x - width / 2; const right = player.x + width / 2;
  const top = player.y - height / 2; const bottom = player.y + height / 2;
  for (let i = 0; i < MAX_SPITS; i += 1) {
    const spit = spits[i]; if (!spit.active || spit.x < left - 16 || spit.x > right + 16 || spit.y < top - 16 || spit.y > bottom + 16) continue;
    const size = snapWorldSize(DRAW_SIZES.spit);
    ctx.save(); ctx.translate(snapWorldPixel(spit.x), snapWorldPixel(spit.y)); ctx.rotate(quantizeDirection(Math.atan2(spit.vy, spit.vx)));
    drawFrame(ctx, sprites.spit, Math.floor(spitFrameTime * 12) % frameCount(sprites.spit), -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

export function updateCorpses(dt) {
  for (let i = 0; i < MAX_ENEMIES; i += 1) if (corpses[i].active) { corpses[i].life -= dt; corpses[i].animation = Math.min(0.375, corpses[i].animation + dt); if (corpses[i].life <= 0) corpses[i].active = false; }
}

export function getEnemies() { return enemies; }
export function getEnemyCount() { return activeCount; }
export function getKillCount() { return kills; }
export function getSpitCount() { let count = 0; for (let i = 0; i < MAX_SPITS; i += 1) if (spits[i].active) count += 1; return count; }
export function isBossAlive() { for (let i = 0; i < MAX_ENEMIES; i += 1) if (enemies[i].active && enemies[i].type === ENEMY_CONFIG.boss.id) return true; return false; }
export function hasBossSpawned() { return bossSpawned; }
export function debugSpawnEnemy(typeName, player, x = player.x + 180, y = player.y) {
  if (!ENEMY_CONFIG[typeName] || activeCount >= MAX_ENEMIES) return null;
  const enemy = spawn(player, 0, 0, BOSS_SPAWN_TIME, typeName, { x, y });
  if (typeName === "boss") bossSpawned = true;
  rebuildEnemyHash();
  return enemy;
}
export function getEnemyCountsByType() {
  const counts = { walker: 0, runner: 0, tank: 0, spitter: 0, boss: 0 };
  for (let i = 0; i < MAX_ENEMIES; i += 1) if (enemies[i].active) counts[TYPE_NAMES[enemies[i].type]] += 1;
  return counts;
}
import { spawnParticles } from "./particles.js";
