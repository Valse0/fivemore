const MAX_GEMS = 150;
const gems = Array.from({ length: MAX_GEMS }, () => ({ active: false, x: 0, y: 0 }));
export const progression = { xp: 0, needed: 4, level: 1, toast: 0 };

export function resetXP() {
  for (let i = 0; i < MAX_GEMS; i += 1) gems[i].active = false;
  progression.xp = 0; progression.needed = 4; progression.level = 1; progression.toast = 0;
}

export function dropGem(x, y) {
  for (let i = 0; i < MAX_GEMS; i += 1) if (!gems[i].active) { gems[i].active = true; gems[i].x = x; gems[i].y = y; return; }
}

export function updateXP(player, dt) {
  if (progression.toast > 0) progression.toast -= dt;
  for (let i = 0; i < MAX_GEMS; i += 1) {
    const gem = gems[i]; if (!gem.active) continue;
    let dx = player.x - gem.x; let dy = player.y - gem.y;
    let distance = Math.hypot(dx, dy);
    if (distance < 110 && distance > 1) {
      const move = Math.min(distance, (110 + (110 - distance) * 4) * dt);
      gem.x += dx / distance * move; gem.y += dy / distance * move;
      dx = player.x - gem.x; dy = player.y - gem.y; distance = Math.hypot(dx, dy);
    }
    if (distance < 25) {
      gem.active = false; progression.xp += 1;
      if (progression.xp >= progression.needed) {
        progression.xp -= progression.needed; progression.level += 1;
        progression.needed = Math.ceil(progression.needed * 1.3); progression.toast = 1.6;
      }
    }
  }
}

export function drawGems(ctx, player, width, height, image) {
  for (let i = 0; i < MAX_GEMS; i += 1) {
    const gem = gems[i]; if (!gem.active) continue;
    const x = gem.x - player.x + width / 2; const y = gem.y - player.y + height / 2;
    if (image && image.complete && image.naturalWidth) ctx.drawImage(image, x - 7, y - 7, 14, 14);
    else {
      ctx.fillStyle = "#9be8c6";
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
    }
  }
}
