import { damageEnemy, forNearby, getEnemies } from "./enemies.js";

const MAX_BULLETS = 48;
const BULLET_SPEED = 520;
const bullets = Array.from({ length: MAX_BULLETS }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
let fireClock = 0;
let killsCallback = null;
let candidate = null;
let candidateDistance = Infinity;
let bulletX = 0; let bulletY = 0; let hitIndex = -1;

function selectNearest(enemy, index) {
  if (!enemy.active) return;
  const dx = enemy.x - bulletX; const dy = enemy.y - bulletY;
  const distance = dx * dx + dy * dy;
  if (distance < candidateDistance) { candidate = enemy; candidateDistance = distance; }
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
  bulletX = player.x; bulletY = player.y; candidate = null; candidateDistance = Infinity;
  const available = getEnemies();
  for (let i = 0; i < available.length; i += 1) selectNearest(available[i], i);
  if (!candidate) return;
  let bullet = null;
  for (let i = 0; i < MAX_BULLETS; i += 1) if (!bullets[i].active) { bullet = bullets[i]; break; }
  if (!bullet) return;
  const dx = candidate.x - player.x; const dy = candidate.y - player.y;
  const distance = Math.hypot(dx, dy) || 1;
  bullet.active = true; bullet.x = player.x; bullet.y = player.y;
  bullet.vx = dx / distance * BULLET_SPEED; bullet.vy = dy / distance * BULLET_SPEED; bullet.life = 1.6;
}

export function updateWeapons(player, dt) {
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
      if (damageEnemy(hitIndex, 18) && killsCallback) killsCallback(enemies[hitIndex].x, enemies[hitIndex].y);
      bullet.active = false;
    } else if (bullet.life <= 0) bullet.active = false;
  }
}

export function drawBullets(ctx, player, width, height) {
  ctx.fillStyle = "#f6ce67";
  for (let i = 0; i < MAX_BULLETS; i += 1) {
    const b = bullets[i]; if (!b.active) continue;
    const x = b.x - player.x + width / 2; const y = b.y - player.y + height / 2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.fillRect(-1, -3, 2, 6); ctx.restore();
  }
}

export function getBulletCount() {
  let count = 0; for (let i = 0; i < MAX_BULLETS; i += 1) if (bullets[i].active) count += 1;
  return count;
}
export function setGemDropCallback(callback) { killsCallback = callback; }
