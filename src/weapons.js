import { damageEnemy, forNearby, getEnemies } from "./enemies.js";
import { AIM_ASSIST_DEG, WEAPON_MUZZLE_OFFSET, WEAPON_COLLISION_RADIUS, BREAKABLE_CONFIG, quantizeDirection, snapWorldPixel, snapWorldSize, DRAW_SIZES, USE_V2_ASSETS } from "./config.js";
import { sprites, drawFrame, frameCount } from "./assets.js";
import { spawnParticles } from "./particles.js";
import { pistolShot, bulletHit, zombieDeath } from "./sfx.js";
import { damageBreakableAt } from "./obstacles.js";
import { dropHealthPickup } from "./pickups.js";

const MAX_BULLETS = 48;
const BULLET_SPEED = 520;
const bullets = Array.from({ length: MAX_BULLETS }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
let fireClock = 0;
let killsCallback = null;
let candidate = null;
let candidateDistance = Infinity;
let bulletX = 0; let bulletY = 0; let hitIndex = -1;
let aimAngle = 0;
let visualTime = 0;

export const weaponsState = {
  damageBonus: 0,
  fireIntervalBonus: 0,
  bulletCount: 1,
};

function selectNearest(enemy, index) {
  if (!enemy.active) return;
  const dx = enemy.x - bulletX; const dy = enemy.y - bulletY;
  const distance = dx * dx + dy * dy;
  const angle = Math.atan2(dy, dx);
  const delta = Math.atan2(Math.sin(angle - aimAngle), Math.cos(angle - aimAngle));
  if (Math.abs(delta) <= AIM_ASSIST_DEG * Math.PI / 180 && distance < candidateDistance) { candidate = enemy; candidateDistance = distance; }
}

function findBulletHit(enemy, index) {
  if (!enemy.active) return;
  const dx = enemy.x - bulletX; const dy = enemy.y - bulletY;
  const radius = enemy.radius + 4;
  if (dx * dx + dy * dy <= radius * radius) hitIndex = index;
}

export function resetWeapons() {
  for (let i = 0; i < MAX_BULLETS; i += 1) bullets[i].active = false;
  fireClock = 0;
  weaponsState.damageBonus = 0;
  weaponsState.fireIntervalBonus = 0;
  weaponsState.bulletCount = 1;
}

function fire(player, viewWidth, viewHeight) {
  bulletX = player.x; bulletY = player.y; aimAngle = player.angle; candidate = null; candidateDistance = Infinity;
  const available = getEnemies();
  const halfWidth = viewWidth / 2; const halfHeight = viewHeight / 2;
  let visibleEnemy = false;
  for (let i = 0; i < available.length; i += 1) {
    const enemy = available[i];
    if (!enemy.active || enemy.x < player.x - halfWidth || enemy.x > player.x + halfWidth
      || enemy.y < player.y - halfHeight || enemy.y > player.y + halfHeight) continue;
    visibleEnemy = true;
    selectNearest(enemy, i);
  }
  if (!visibleEnemy) return;
  const baseAngle = candidate ? Math.atan2(candidate.y - player.y, candidate.x - player.x) : player.angle;
  const count = weaponsState.bulletCount || 1;
  for (let bIndex = 0; bIndex < count; bIndex += 1) {
    let bullet = null;
    for (let i = 0; i < MAX_BULLETS; i += 1) if (!bullets[i].active) { bullet = bullets[i]; break; }
    if (!bullet) break;
    const spread = count > 1 ? (bIndex - (count - 1) / 2) * 0.15 : 0;
    const angle = baseAngle + spread;
    bullet.active = true;
    bullet.x = player.x + Math.cos(angle) * WEAPON_MUZZLE_OFFSET;
    bullet.y = player.y + Math.sin(angle) * WEAPON_MUZZLE_OFFSET;
    bullet.vx = Math.cos(angle) * BULLET_SPEED; bullet.vy = Math.sin(angle) * BULLET_SPEED; bullet.life = 1.6;
  }
  player.shotAngle = baseAngle; player.firing = 0.08; player.recoil = 0.05;
  pistolShot();
}

function explodeBarrel(barrel, player, onPlayerDamage, enemies) {
  const { blastRadius, blastDamage } = BREAKABLE_CONFIG.barrel;
  const radiusSquared = blastRadius * blastRadius;
  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i]; if (!enemy.active) continue;
    const dx = enemy.x - barrel.x; const dy = enemy.y - barrel.y;
    if (dx * dx + dy * dy > radiusSquared) continue;
    if (damageEnemy(i, blastDamage)) {
      zombieDeath(enemy.type);
      if (killsCallback) killsCallback(enemy.x, enemy.y);
    }
  }
  const dx = player.x - barrel.x; const dy = player.y - barrel.y;
  if (dx * dx + dy * dy <= radiusSquared && onPlayerDamage) onPlayerDamage(blastDamage, barrel);
  bulletHit();
}

export function updateWeapons(player, dt, viewWidth, viewHeight, onPlayerDamage = null) {
  visualTime += dt;
  player.firing = Math.max(0, player.firing - dt); player.recoil = Math.max(0, player.recoil - dt);
  fireClock -= dt;
  const interval = Math.max(0.18, 0.5 - (weaponsState.fireIntervalBonus || 0));
  if (fireClock <= 0) { fire(player, viewWidth, viewHeight); fireClock += interval; }
  const enemies = getEnemies();
  for (let i = 0; i < MAX_BULLETS; i += 1) {
    const bullet = bullets[i];
    if (!bullet.active) continue;
    bullet.life -= dt;
    bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt;
    const obstacle = damageBreakableAt(bullet.x, bullet.y, WEAPON_COLLISION_RADIUS);
    if (obstacle) {
      bulletHit();
      if (obstacle.destroyed && obstacle.type === "crate" && !obstacle.pickupDropped) {
        obstacle.pickupDropped = dropHealthPickup(obstacle.x, obstacle.y, BREAKABLE_CONFIG.crate.healthPickupAmount);
      }
      if (obstacle.destroyed && obstacle.type === "barrel" && !obstacle.blastApplied) {
        obstacle.blastApplied = true;
        explodeBarrel(obstacle, player, onPlayerDamage, enemies);
      }
      bullet.active = false;
      continue;
    }
    bulletX = bullet.x; bulletY = bullet.y; hitIndex = -1;
    forNearby(bullet.x, bullet.y, findBulletHit);
    if (hitIndex !== -1) {
      spawnParticles(bullet.x, bullet.y, 5, "spark");
      bulletHit();
      const damage = 18 + (weaponsState.damageBonus || 0);
      if (damageEnemy(hitIndex, damage)) { zombieDeath(enemies[hitIndex].type); if (killsCallback) killsCallback(enemies[hitIndex].x, enemies[hitIndex].y); }
      bullet.active = false;
    } else if (bullet.life <= 0) bullet.active = false;
  }
}

export function drawBullets(ctx, player, width, height) {
  for (let i = 0; i < MAX_BULLETS; i += 1) {
    const b = bullets[i]; if (!b.active) continue;
    const x = snapWorldPixel(b.x); const y = snapWorldPixel(b.y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(quantizeDirection(Math.atan2(b.vy, b.vx)));
    if (USE_V2_ASSETS) {
      const size = snapWorldSize(DRAW_SIZES.bullet);
      drawFrame(ctx, sprites.bullet, Math.floor(visualTime * 18) % frameCount(sprites.bullet), -size/2, -size/2, size, size, 32);
    } else {
      const bulletWidth=snapWorldSize(4); const bulletHeight=snapWorldSize(10);
      ctx.fillStyle="#f6ce67"; ctx.fillRect(-bulletWidth/2,-bulletHeight/2,bulletWidth,bulletHeight);
      ctx.fillStyle="#fff4c7"; ctx.fillRect(-snapWorldSize(1),-snapWorldSize(4),snapWorldSize(2),snapWorldSize(7));
    }
    ctx.restore();
  }
}

export function getBulletCount() {
  let count = 0; for (let i = 0; i < MAX_BULLETS; i += 1) if (bullets[i].active) count += 1;
  return count;
}
export function setGemDropCallback(callback) { killsCallback = callback; }
