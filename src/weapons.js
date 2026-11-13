import { damageEnemy, forNearby, getEnemies } from "./enemies.js";
import { AIM_ASSIST_DEG, quantizeDirection, snapWorldPixel, snapWorldSize } from "./config.js";
import { spawnParticles } from "./particles.js";
import { pistolShot, bulletHit, zombieDeath } from "./sfx.js";

const MAX_BULLETS = 48;
const BULLET_SPEED = 520;
const bullets = Array.from({ length: MAX_BULLETS }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
let fireClock = 0;
let killsCallback = null;
let candidate = null;
let candidateDistance = Infinity;
let bulletX = 0; let bulletY = 0; let hitIndex = -1;
let aimAngle = 0;

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
}

function fire(player) {
  bulletX = player.x; bulletY = player.y; aimAngle = player.angle; candidate = null; candidateDistance = Infinity;
  const available = getEnemies();
  for (let i = 0; i < available.length; i += 1) selectNearest(available[i], i);
  let bullet = null;
  for (let i = 0; i < MAX_BULLETS; i += 1) if (!bullets[i].active) { bullet = bullets[i]; break; }
  if (!bullet) return;
  const angle = candidate ? Math.atan2(candidate.y - player.y, candidate.x - player.x) : player.angle;
  bullet.active = true; bullet.x = player.x; bullet.y = player.y;
  bullet.vx = Math.cos(angle) * BULLET_SPEED; bullet.vy = Math.sin(angle) * BULLET_SPEED; bullet.life = 1.6;
  player.shotAngle = angle; player.firing = 0.08; player.recoil = 0.05;
  pistolShot();
}

export function updateWeapons(player, dt) {
  player.firing = Math.max(0, player.firing - dt); player.recoil = Math.max(0, player.recoil - dt);
  fireClock -= dt;
  if (fireClock <= 0) { fire(player); fireClock += 0.5; }
  const enemies = getEnemies();
  for (let i = 0; i < MAX_BULLETS; i += 1) {
    const bullet = bullets[i];
    if (!bullet.active) continue;
    bullet.life -= dt;
    bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt;
    bulletX = bullet.x; bulletY = bullet.y; hitIndex = -1;
    forNearby(bullet.x, bullet.y, findBulletHit);
    if (hitIndex !== -1) {
      spawnParticles(bullet.x, bullet.y, 5, "spark");
      bulletHit();
      if (damageEnemy(hitIndex, 18)) { zombieDeath(enemies[hitIndex].type); if (killsCallback) killsCallback(enemies[hitIndex].x, enemies[hitIndex].y); }
      bullet.active = false;
    } else if (bullet.life <= 0) bullet.active = false;
  }
}

export function drawBullets(ctx, player, width, height) {
  for (let i = 0; i < MAX_BULLETS; i += 1) {
    const b = bullets[i]; if (!b.active) continue;
    const x = snapWorldPixel(b.x - player.x + width / 2); const y = snapWorldPixel(b.y - player.y + height / 2);
    const bulletWidth = snapWorldSize(4); const bulletHeight = snapWorldSize(10);
    ctx.save(); ctx.translate(x, y); ctx.rotate(quantizeDirection(Math.atan2(b.vy, b.vx))); ctx.fillStyle = "#f6ce67"; ctx.fillRect(-bulletWidth / 2, -bulletHeight / 2, bulletWidth, bulletHeight); ctx.fillStyle = "#fff4c7"; ctx.fillRect(-snapWorldSize(1), -snapWorldSize(4), snapWorldSize(2), snapWorldSize(7)); ctx.restore();
  }
}

export function getBulletCount() {
  let count = 0; for (let i = 0; i < MAX_BULLETS; i += 1) if (bullets[i].active) count += 1;
  return count;
}
export function setGemDropCallback(callback) { killsCallback = callback; }
