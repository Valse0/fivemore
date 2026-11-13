import { MAX_PARTICLES, snapWorldPixel, snapWorldSize } from "./config.js";

const particles = Array.from({ length: MAX_PARTICLES }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 1, color: "#fff" }));
const atlas = document.createElement("canvas");
atlas.width = 64; atlas.height = 16;
const atlasContext = atlas.getContext("2d");
for (let i = 0; i < 4; i += 1) {
  atlasContext.globalAlpha = 1 - i * 0.22;
  atlasContext.fillStyle = ["#fff4c7", "#f6ce67", "#a6bf72", "#8e3c39"][i];
  atlasContext.beginPath(); atlasContext.arc(i * 16 + 8, 8, 5, 0, Math.PI * 2); atlasContext.fill();
}

export function spawnParticles(x, y, count, kind = "spark") {
  for (let n = 0; n < count; n += 1) {
    let p = null;
    for (let i = 0; i < MAX_PARTICLES; i += 1) if (!particles[i].active) { p = particles[i]; break; }
    if (!p) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = kind === "blood" ? 24 + Math.random() * 65 : 45 + Math.random() * 130;
    p.active = true; p.x = x; p.y = y; p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed;
    p.life = p.maxLife = 0.12 + Math.random() * 0.24; p.size = kind === "spark" ? 2 : 3;
    p.color = kind === "blood" ? (Math.random() < 0.5 ? "#8e3c39" : "#708b47") : "#fff4c7";
  }
}

export function updateParticles(dt) {
  for (let i = 0; i < MAX_PARTICLES; i += 1) {
    const p = particles[i]; if (!p.active) continue;
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
    if (p.life <= 0) p.active = false;
  }
}

export function drawParticles(ctx, player, width, height) {
  for (let i = 0; i < MAX_PARTICLES; i += 1) {
    const p = particles[i]; if (!p.active) continue;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    const size = snapWorldSize(p.size);
    ctx.drawImage(atlas, p.color === "#fff4c7" ? 0 : p.color === "#8e3c39" ? 48 : 32, 0, 16, 16,
      snapWorldPixel(p.x - p.size / 2), snapWorldPixel(p.y - p.size / 2), size, size);
  }
  ctx.globalAlpha = 1;
}
