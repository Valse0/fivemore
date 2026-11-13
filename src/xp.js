import { spawnParticles } from "./particles.js";
import { xpPickup, levelUp } from "./sfx.js";
import { snapWorldPixel, snapWorldSize } from "./config.js";

const MAX_GEMS = 150;
const gems = Array.from({ length: MAX_GEMS }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, value: 1, color: 0, scale: 1 }));
export const progression = { xp: 0, needed: 4, level: 1, toast: 0, pulse: 0 };
const gemAtlas = document.createElement("canvas"); gemAtlas.width = 96; gemAtlas.height = 32;
const gc = gemAtlas.getContext("2d");
const gemColors = ["#69aee8", "#79d69a", "#bd83ec"];
for (let i = 0; i < 3; i += 1) {
  const cx = i * 32 + 16;
  gc.fillStyle = "rgba(255,255,255,.16)"; gc.beginPath(); gc.arc(cx, 16, 14, 0, Math.PI * 2); gc.fill();
  gc.fillStyle = gemColors[i]; gc.beginPath(); gc.moveTo(cx, 3); gc.lineTo(cx + 9, 12); gc.lineTo(cx + 6, 25); gc.lineTo(cx, 29); gc.lineTo(cx - 6, 25); gc.lineTo(cx - 9, 12); gc.closePath(); gc.fill();
  gc.fillStyle = "rgba(255,255,255,.52)"; gc.beginPath(); gc.moveTo(cx, 5); gc.lineTo(cx + 2, 14); gc.lineTo(cx - 1, 24); gc.lineTo(cx - 6, 13); gc.closePath(); gc.fill();
  gc.fillStyle = "#fff"; gc.fillRect(cx - 2, 7, 3, 3);
}

export function resetXP() {
  for (let i = 0; i < MAX_GEMS; i += 1) gems[i].active = false;
  progression.xp = 0; progression.needed = 4; progression.level = 1; progression.toast = 0; progression.pulse = 0;
}

export function dropGem(x, y) {
  for (let i = 0; i < MAX_GEMS; i += 1) if (!gems[i].active) {
    const gem = gems[i]; const roll = Math.random(); gem.value = roll > 0.97 ? 4 : roll > 0.82 ? 2 : 1;
    gem.color = gem.value === 4 ? 2 : gem.value === 2 ? 1 : 0;
    const angle = Math.random() * Math.PI * 2; const speed = 20 + Math.random() * 55;
    gem.active = true; gem.x = x; gem.y = y; gem.vx = Math.cos(angle) * speed; gem.vy = Math.sin(angle) * speed - 22; gem.age = 0; gem.scale = 1; return;
  }
}

export function updateXP(player, dt) {
  if (progression.toast > 0) progression.toast = Math.max(0, progression.toast - dt);
  progression.pulse = Math.max(0, progression.pulse - dt);
  let leveled = false;
  for (let i = 0; i < MAX_GEMS; i += 1) {
    const gem = gems[i]; if (!gem.active) continue;
    gem.age += dt;
    let dx = player.x - gem.x; let dy = player.y - gem.y;
    let distance = Math.hypot(dx, dy);
    if (gem.age < 0.22) { gem.x += gem.vx * dt; gem.y += gem.vy * dt; gem.vy += 110 * dt; gem.vx *= 0.96; }
    else if (distance < 135) {
      const t = 1 - distance / 135; const speed = 70 + t * t * 600;
      const move = Math.min(distance, speed * dt); gem.x += dx / (distance || 1) * move; gem.y += dy / (distance || 1) * move;
      dx = player.x - gem.x; dy = player.y - gem.y; distance = Math.hypot(dx, dy);
    }
    if (distance < 23) {
      gem.active = false; progression.xp += gem.value; progression.pulse = 0.18; spawnParticles(gem.x, gem.y, 4, "spark");
      xpPickup();
      while (progression.xp >= progression.needed) {
        progression.xp -= progression.needed; progression.level += 1;
        progression.needed = Math.ceil(progression.needed * 1.3); progression.toast = 1.6; leveled = true;
        levelUp();
      }
    }
  }
  return leveled;
}

export function drawGems(ctx, player, width, height) {
  for (let i = 0; i < MAX_GEMS; i += 1) {
    const gem = gems[i]; if (!gem.active) continue;
    const x = gem.x - player.x + width / 2; const y = gem.y - player.y + height / 2;
    const bob = Math.sin(gem.age * 6) * 1.5; const pulse = 1 + Math.sin(gem.age * 8) * 0.08;
    const size = 14 * pulse * (gem.age < 0.22 ? Math.min(1, gem.age / 0.08) : 1);
    const gemSize = snapWorldSize(size);
    const glowSize = snapWorldSize(size * 2);
    ctx.globalAlpha = 0.55; ctx.drawImage(gemAtlas, gem.color * 32, 0, 32, 32, snapWorldPixel(x - size), snapWorldPixel(y - size + bob), glowSize, glowSize);
    ctx.globalAlpha = 1; ctx.drawImage(gemAtlas, gem.color * 32, 0, 32, 32, snapWorldPixel(x - size / 2), snapWorldPixel(y - size / 2 + bob), gemSize, gemSize);
  }
}
